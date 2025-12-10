var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  QuotaManager: () => QuotaManager
});
module.exports = __toCommonJS(stdin_exports);
var import_system_error = require("../../errors/system_error.js");
var import_collection = require("../collection.js");
var import_volt = require("src/volt.js");
APPLY_FIX;
class QuotaManager {
  // ----------------------------------------------------------------
  // Attributes
  // ----------------------------------------------------------------
  /** The initialized database collection used by this quota manager. */
  collection;
  /**
   * A validator for queries.
   * If provided each query will be validated by this validator.
   * Should return an object with an optional error when occurred.
   */
  query_validator;
  /** The system error options. */
  system_error;
  /**
   * Construct a new quota manager with a specific quota type.
   */
  constructor(opts) {
    this.collection = opts.server.db.collection({
      name: opts.collection.name,
      ttl: opts.collection.ttl,
      indexes: [
        {
          keys: { uid: 1, type: 1, name: 1 },
          unique: true,
          forced: true
        }
      ],
      record_version: 1,
      persist_transformed_on_load: "replace"
    });
    this.query_validator = opts.query_validator;
    this.system_error = opts.system_error;
  }
  // ----------------------------------------------------------------
  // Private utility methods.
  // ----------------------------------------------------------------
  /**
   * Format a compact, human-readable query for logs and error messages.
   *
   * @param query An object carrying the `type` and `name` fields.
   *
   * @returns A stable query of the form `<key1>:<value1>_<key2>:<value2>`.
   */
  format_query(query) {
    return Object.entries(query).map(([k, v]) => `${k}:${v}`).join("_");
  }
  // ----------------------------------------------------------------
  // Database operation methods.
  // ----------------------------------------------------------------
  /**
   * Get current quota status without modifying it.
   *
   * @note The `opts.retry` field defaults to `25`.
   * @note System load errors are not saved inside this function.
   *
   * @param query The quota identifier arguments.
   * @param opts Additional load options.
   *
   * @returns A load result depending on `opts`, see {@link Collection.LoadResult}
   *
   * @throws {Collection.NotFoundError} When `opts.throw !== false` and the quota does not exist.
   * @throws {Collection.LoadError} When `opts.throw !== false` and a database error was encountered during the load operation.
   * @throws {Collection.InvalidUsageError} When `opts.throw !== false` and the query is invalid.
   */
  async get(query, opts) {
    const val_err = this.query_validator ? this.query_validator(query) : void 0;
    if (val_err != null) {
      const err = new import_volt.InvalidUsageError({
        message: `Invalid query: ${val_err}`,
        reason: "invalid_query",
        field: "query"
      });
      if (opts?.throw ?? true)
        throw err;
      return err;
    }
    if (opts) {
      opts = { retry: 25, ...opts };
      return this.collection.load(query, opts);
    } else {
      return this.collection.load(query, { retry: 25 });
    }
  }
  /**
   * Get current quota status without modifying it.
   *
   * @param query The quota identifier arguments.
   * @param opts Additional load options, see {@link Collection.LoadOpts}.
   *
   * @returns An object containing error or status information,
   *          see {@link QuotaManager.GetStatusResult}
   */
  async get_status(query, opts) {
    const now_sec = Math.floor(Date.now() / 1e3);
    const val_err = this.query_validator ? this.query_validator(query) : void 0;
    if (val_err != null) {
      return {
        found: false,
        reason: "invalid_query",
        error: `Invalid query: ${val_err}`
      };
    }
    const loaded_quota = await this.collection.load(query, { retry: 25, throw: false, timeout: opts?.timeout });
    if (loaded_quota instanceof import_collection.Collection.NotFoundError) {
      return {
        found: false,
        reason: "not_found",
        error: `Quota not found with query '${this.format_query(query)}'`
      };
    }
    if (loaded_quota instanceof Error) {
      import_system_error.SystemError.create_detach({
        owner: "volt.QuotaManager",
        collection: this.system_error?.collection,
        logger: this.system_error?.logger,
        message: "Failed to load quota in get_status().",
        details: {
          query,
          original_error: loaded_quota?.message ?? String(loaded_quota)
        }
      });
      return {
        found: false,
        reason: "system_error",
        error: `Encountered an unknown error while loading quota '${this.format_query(query)}'.`
      };
    }
    const needs_reset = now_sec >= loaded_quota.start + loaded_quota.interval;
    const effective_usage = needs_reset ? 0 : loaded_quota.usage;
    const time_until_reset = needs_reset ? 0 : Math.max(0, loaded_quota.start + loaded_quota.interval - now_sec);
    const remaining = Math.max(0, loaded_quota.max - effective_usage);
    const percentage_used = loaded_quota.max > 0 ? Math.min(100, Math.max(0, effective_usage / loaded_quota.max * 100)) : effective_usage > 0 ? 100 : 0;
    return {
      found: true,
      quota: needs_reset ? { ...loaded_quota, usage: 0, start: now_sec } : loaded_quota,
      remaining,
      percentage_used,
      needs_reset,
      time_until_reset
    };
  }
  /**
   * List all quotas for a user, optionally filtered by type.
   *
   * @param query The partial query to list quotas by.
   * @param type Optional quota type filter.
   * @returns List of quotas with their current status.
   */
  async list({ query, timeout }) {
    const now_sec = Math.floor(Date.now() / 1e3);
    const listed = [];
    await this.collection.list(query, {
      timeout,
      retry: 5,
      callback: (q) => {
        const needs_reset = now_sec >= q.start + q.interval;
        const effective_usage = needs_reset ? 0 : q.usage;
        const percentage_used = q.max > 0 ? Math.min(100, Math.max(0, effective_usage / q.max * 100)) : effective_usage > 0 ? 100 : 0;
        listed.push({
          quota: needs_reset ? { ...q, usage: 0, start: now_sec } : q,
          remaining: Math.max(0, q.max - effective_usage),
          percentage_used,
          needs_reset
        });
      }
    });
    return listed;
  }
  /**
   * Update or save quota configuration (`max`, `interval`) for an existing quota document,
   * automatically creating the document if it does not exist.
   *
   * This method never resets runtime fields on existing documents:
   * - On update: only `max` and `interval` are changed.
   * - On insert: `usage` is initialized to `0` and `start` to the current UNIX timestamp (seconds).
   *
   * @param quota The configuration document (identity + {@link Quota.Opts}). Fields `usage` and `start`
   *              are forbidden at the type level and ignored defensively at runtime.
   * @param opts  Additional save options; see {@link Collection.SaveOpts}.
   *
   * @note The `opts.throw` field defaults to `true`.
   *
   * @returns The updated (or newly created) quota document, or an error-like result depending on `opts.throw`.
   *          See {@link Collection.SaveResult}.
   *
   * @throws {InvalidUsageError} When `opts.throw !== false` and validation fails.
   * @throws {Collection.SaveError} When `opts.throw !== false` and a database error occurs during the save operation.
   */
  async set(query, quota, opts) {
    let query_err;
    if (this.query_validator && (query_err = this.query_validator(query)) != null) {
      const err = new import_volt.InvalidUsageError({
        message: `Invalid query: ${query_err}`,
        reason: "invalid_query",
        field: "query"
      });
      if (opts?.throw ?? true)
        throw err;
      return err;
    }
    const val_err = QuotaManager.Quota.Opts.validate(quota);
    if (val_err) {
      const err = new import_volt.InvalidUsageError({
        message: `Invalid quota: ${val_err}`,
        reason: "invalid_quota",
        field: "quota"
      });
      if (opts?.throw ?? true)
        throw err;
      return err;
    }
    const now_sec = Math.floor(Date.now() / 1e3);
    const save_opts = {
      return: true,
      upsert: true,
      retry: 25,
      throw: opts?.throw ?? true,
      timeout: opts?.timeout
    };
    return await this.collection.save(query, {
      $set: {
        max: quota.max,
        interval: quota.interval
      },
      $setOnInsert: {
        usage: 0,
        start: now_sec
      }
    }, save_opts);
  }
  /**
   * Reset quota usage to zero & timestamp to the current unix timestamp for the specified quota.
   *
   * @param query The quota identifier, see {@link QuotaManager.Query}.
   * @param opts Additional save options, see {@link Collection.SaveOpts}
   *
   * @note The `opts.throw` field defaults to the default value of {@link Collection.SaveOpts.throw}.
   *
   * @returns The updated quota document after resetting quota or an error depending on `throw`.
   *          See {@link Collection.SaveResult}.
   *
   * @throws {Collection.NotFoundError} When `opts.throw !== false` and the quota does not exist.
   * @throws {Collection.SaveError} When `opts.throw !== false` and a database error was encountered during the save operation.
   * @throws {Collection.InvalidUsageError} When `opts.throw !== false` and the query is invalid.
   */
  async reset_usage(query, opts) {
    let query_err;
    if (this.query_validator && (query_err = this.query_validator(query)) != null) {
      const err = new import_volt.InvalidUsageError({
        message: `Invalid query: ${query_err}`,
        reason: "invalid_query",
        field: "query"
      });
      if (opts?.throw ?? true)
        throw err;
      return err;
    }
    const save_opts = {
      return: true,
      upsert: false,
      retry: 25,
      throw: opts?.throw,
      timeout: opts?.timeout
    };
    return await this.collection.save(query, {
      $set: {
        usage: 0,
        start: Math.floor(Date.now() / 1e3)
      }
    }, save_opts);
  }
  // ----------------------------------------------------------------
  // Quota limiting.
  // ----------------------------------------------------------------
  /**
   * Validate the required {@link limit_helper} parameters.
   * @note requested_usage may be a negative number.
   */
  validate_limit_helper_params({ requested_usage, safety_ratio, query, upsert }) {
    if (!Number.isFinite(requested_usage)) {
      return {
        success: false,
        status: "invalid_usage",
        error: `Invalid requested usage: ${requested_usage}. Must be a finite number.`
      };
    }
    if (safety_ratio !== void 0 && (!Number.isFinite(safety_ratio) || safety_ratio < 1)) {
      return {
        success: false,
        status: "invalid_usage",
        error: `Invalid 'safety_ratio' value: ${safety_ratio}. Must be finite and >= 1.`
      };
    }
    const product_safety_usage = requested_usage * (safety_ratio ?? 1);
    if (!Number.isFinite(product_safety_usage)) {
      return {
        success: false,
        status: "invalid_usage",
        error: `Invalid product of 'requested_usage' and 'safety_ratio'.`
      };
    }
    let query_err;
    if (this.query_validator && (query_err = this.query_validator(query)) != null) {
      return {
        success: false,
        status: "invalid_usage",
        error: `Invalid query: ${query_err}`
      };
    }
    if (upsert) {
      const val_err = QuotaManager.Quota.Opts.validate(upsert);
      if (val_err) {
        return {
          success: false,
          status: "invalid_usage",
          error: `Invalid quota upsert: ${val_err}`
        };
      }
    }
  }
  /**
   * Validates quota limits and atomically increments usage if within bounds.
   * Handles interval resets automatically in a single database operation.
   *
   * @warning Ensure the quota exists in the database, or define `upsert` to create it when needed.
   *
   * @note This automatically increments the quota usage with the requested usage when `perform_increment` is true.
   *       When `perform_increment` is false, it only validates availability without modifying the database.
   *
   * @returns Success with updated quota info or validation/error details.
   *
   */
  async limit_helper({ query, requested_usage, upsert, safety_ratio = 1, check_limit = true, perform_increment = true, collection }) {
    const val_input_res = this.validate_limit_helper_params({
      requested_usage,
      safety_ratio,
      upsert,
      query
    });
    if (val_input_res)
      return val_input_res;
    const now_sec = Math.floor(Date.now() / 1e3);
    if (check_limit) {
      if (perform_increment) {
        const result = await collection.save({
          ...query,
          $expr: {
            $and: [
              { $lt: [now_sec, { $add: ["$start", "$interval"] }] },
              { $lte: [{ $add: ["$usage", requested_usage] }, "$max"] },
              { $lte: [{ $add: ["$usage", requested_usage * safety_ratio] }, "$max"] },
              { $gte: [{ $add: ["$usage", requested_usage] }, 0] }
            ]
          }
        }, { $inc: { usage: requested_usage } }, { return: true, upsert: false, retry: 25, throw: false });
        if (!(result instanceof Error)) {
          return {
            success: true,
            status: "success",
            quota: result,
            remaining: Math.max(0, result.max - result.usage),
            was_reset: false
          };
        }
      } else {
        const result = await collection.load({
          ...query,
          $expr: {
            $and: [
              { $lt: [now_sec, { $add: ["$start", "$interval"] }] },
              { $lte: [{ $add: ["$usage", requested_usage] }, "$max"] },
              { $lte: [{ $add: ["$usage", requested_usage * safety_ratio] }, "$max"] },
              { $gte: [{ $add: ["$usage", requested_usage] }, 0] }
            ]
          }
        }, { retry: 25, throw: false });
        if (!(result instanceof Error)) {
          return {
            success: true,
            status: "success",
            quota: result,
            remaining: Math.max(0, result.max - result.usage),
            was_reset: false
          };
        }
      }
    } else {
      if (perform_increment) {
        const result = await collection.save({
          ...query,
          $expr: {
            $and: [
              { $lt: [now_sec, { $add: ["$start", "$interval"] }] },
              { $gte: [{ $add: ["$usage", requested_usage] }, 0] }
            ]
          }
        }, { $inc: { usage: requested_usage } }, { return: true, upsert: false, throw: false, retry: 25 });
        if (!(result instanceof Error)) {
          return {
            success: true,
            status: "success",
            quota: result,
            remaining: Math.max(0, result.max - result.usage),
            was_reset: false
          };
        }
      }
    }
    let current = await collection.load(query, { retry: 25, throw: false });
    if (current instanceof Error) {
      if (!(current instanceof import_collection.Collection.NotFoundError)) {
        import_system_error.SystemError.create_detach({
          owner: "volt.QuotaManager",
          collection: this.system_error?.collection,
          logger: this.system_error?.logger,
          message: `Encountered an unknown error while loading quota '${this.format_query(query)}'`,
          details: {
            query,
            requested_usage,
            upsert,
            safety_ratio,
            check_limit,
            perform_increment,
            is_transaction: collection instanceof import_collection.TransactionCollection,
            original_error: current?.message ?? String(current)
          }
        });
        return {
          success: false,
          status: "system_error",
          error: `Encountered an unknown error while loading quota '${this.format_query(query)}'`
        };
      }
      if (!upsert) {
        return {
          success: false,
          status: "not_found",
          error: `Quota not found '${this.format_query(query)}'`
        };
      }
      if (!perform_increment) {
        const would_exceed_actual = requested_usage > upsert.max;
        const would_exceed_ratio = requested_usage * safety_ratio > upsert.max;
        if (check_limit && (would_exceed_actual || would_exceed_ratio)) {
          return {
            success: false,
            status: "would_exceed",
            error: `Requested usage (${requested_usage}, safety=${requested_usage * safety_ratio}) exceeds fresh-window maximum (${upsert.max}).`,
            remaining: upsert.max
          };
        }
        const virtual_doc = {
          ...query,
          max: upsert.max,
          interval: upsert.interval,
          start: now_sec,
          usage: Math.max(0, requested_usage)
        };
        return {
          success: true,
          status: "success",
          quota: virtual_doc,
          remaining: Math.max(0, virtual_doc.max - virtual_doc.usage),
          was_reset: false
        };
      }
      const doc_record = {
        ...query,
        max: upsert.max,
        interval: upsert.interval,
        start: now_sec,
        usage: Math.max(0, requested_usage)
      };
      const created = await collection.set(query, doc_record, { return: true, upsert: true, throw: false, retry: 25 });
      if (created instanceof Error) {
        import_system_error.SystemError.create_detach({
          owner: "volt.QuotaManager",
          collection: this.system_error?.collection,
          logger: this.system_error?.logger,
          message: `Failed to create quota '${this.format_query(query)}'`,
          details: {
            query,
            requested_usage,
            upsert,
            safety_ratio,
            check_limit,
            perform_increment,
            is_transaction: collection instanceof import_collection.TransactionCollection,
            original_error: created?.message ?? String(created)
          }
        });
        return {
          success: false,
          status: "system_error",
          error: `Failed to create quota '${this.format_query(query)}'`
        };
      }
      current = created;
    }
    const interval_expired = now_sec >= current.start + current.interval;
    if (interval_expired) {
      if (check_limit) {
        const would_exceed_actual = requested_usage > current.max;
        const would_exceed_ratio = requested_usage * safety_ratio > current.max;
        if (would_exceed_actual || would_exceed_ratio) {
          return {
            success: false,
            status: "would_exceed",
            error: `Requested usage (${requested_usage}, safety=${requested_usage * safety_ratio}) exceeds fresh-window maximum (${current.max}).`,
            quota: current,
            remaining: current.max
          };
        }
      }
      if (!perform_increment) {
        const view_after_reset = { ...current, usage: 0, start: now_sec };
        return {
          success: true,
          status: "success",
          quota: view_after_reset,
          remaining: Math.max(0, view_after_reset.max - view_after_reset.usage),
          was_reset: false
        };
      }
      const new_usage = Math.max(0, requested_usage);
      const reset_result = await collection.save({
        ...query,
        // optimistic lock against concurrent reset
        start: current.start
      }, {
        $set: {
          usage: new_usage,
          start: now_sec
        }
      }, { return: true, upsert: false, throw: false, retry: 25 });
      if (!(reset_result instanceof Error)) {
        return {
          success: true,
          status: "success",
          quota: reset_result,
          remaining: Math.max(0, reset_result.max - reset_result.usage),
          was_reset: true
        };
      }
      import_system_error.SystemError.create_detach({
        owner: "volt.QuotaManager",
        collection: this.system_error?.collection,
        logger: this.system_error?.logger,
        message: `Race condition detected after maximum retries.`,
        details: {
          query,
          requested_usage,
          upsert,
          safety_ratio,
          check_limit,
          perform_increment,
          is_transaction: collection instanceof import_collection.TransactionCollection
        }
      });
      return {
        success: false,
        status: "system_error",
        error: `Race condition detected after maximum retries.`,
        quota: current,
        remaining: Math.max(0, current.max - current.usage)
      };
    }
    if (check_limit) {
      if (!perform_increment) {
        if (current.usage > current.max) {
          return {
            success: false,
            status: "exceeded",
            error: `Quota usage '${current.usage}' has already exceeded maximum quota '${current.max}'`,
            quota: current,
            remaining: Math.max(0, current.max - current.usage)
          };
        }
        const would_exceed_actual2 = current.usage + requested_usage > current.max;
        const would_exceed_ratio2 = current.usage + requested_usage * safety_ratio > current.max;
        if (would_exceed_actual2 || would_exceed_ratio2) {
          return {
            success: false,
            status: "would_exceed",
            error: `Requested usage (${requested_usage}, safety=${requested_usage * safety_ratio}) would exceed remaining quota.`,
            quota: current,
            remaining: Math.max(0, current.max - current.usage)
          };
        }
        return {
          success: true,
          status: "success",
          quota: current,
          remaining: Math.max(0, current.max - current.usage),
          was_reset: false
        };
      }
      if (current.usage + requested_usage < 0) {
        const clamp_result = await collection.save({
          ...query,
          start: current.start
          // optimistic lock in the same window
        }, { $set: { usage: 0 } }, { return: true, upsert: false, throw: false, retry: 25 });
        if (!(clamp_result instanceof Error)) {
          return {
            success: true,
            status: "success",
            quota: clamp_result,
            remaining: Math.max(0, clamp_result.max - clamp_result.usage),
            was_reset: false
          };
        }
        import_system_error.SystemError.create_detach({
          owner: "volt.QuotaManager",
          collection: this.system_error?.collection,
          logger: this.system_error?.logger,
          message: `Failed to clamp usage to zero for query '${this.format_query(query)}'.`,
          details: {
            query,
            requested_usage,
            upsert,
            safety_ratio,
            check_limit,
            perform_increment,
            is_transaction: collection instanceof import_collection.TransactionCollection
          }
        });
        return {
          success: false,
          status: "system_error",
          error: `Failed to clamp usage to zero for query '${this.format_query(query)}'.`,
          quota: current,
          remaining: Math.max(0, current.max - current.usage)
        };
      }
      if (current.usage > current.max) {
        return {
          success: false,
          status: "exceeded",
          error: `Quota usage '${current.usage}' has already exceeded maximum quota '${current.max}'`,
          quota: current,
          remaining: Math.max(0, current.max - current.usage)
        };
      }
      const would_exceed_actual = current.usage + requested_usage > current.max;
      const would_exceed_ratio = current.usage + requested_usage * safety_ratio > current.max;
      if (would_exceed_actual || would_exceed_ratio) {
        return {
          success: false,
          status: "would_exceed",
          error: `Requested usage (${requested_usage}, safety=${requested_usage * safety_ratio}) would exceed remaining quota.`,
          quota: current,
          remaining: Math.max(0, current.max - current.usage)
        };
      }
      const inc_result = await collection.save({
        ...query,
        start: current.start,
        $expr: { $gte: [{ $add: ["$usage", requested_usage] }, 0] }
      }, { $inc: { usage: requested_usage } }, { return: true, upsert: false, throw: false, retry: 25 });
      if (!(inc_result instanceof Error)) {
        return {
          success: true,
          status: "success",
          quota: inc_result,
          remaining: Math.max(0, inc_result.max - inc_result.usage),
          was_reset: false
        };
      }
      import_system_error.SystemError.create_detach({
        owner: "volt.QuotaManager",
        collection: this.system_error?.collection,
        logger: this.system_error?.logger,
        message: `Failed to update quota for query '${this.format_query(query)}'.`,
        details: {
          query,
          requested_usage,
          upsert,
          safety_ratio,
          check_limit,
          perform_increment,
          is_transaction: collection instanceof import_collection.TransactionCollection
        }
      });
      return {
        success: false,
        status: "system_error",
        error: `Failed to update quota for query '${this.format_query(query)}'.`,
        quota: current,
        remaining: Math.max(0, current.max - current.usage)
      };
    } else {
      if (!perform_increment) {
        const needs_reset = now_sec >= current.start + current.interval;
        const effective_usage = needs_reset ? 0 : current.usage;
        const view_quota = needs_reset ? { ...current, usage: 0, start: now_sec } : current;
        return {
          success: true,
          status: "success",
          quota: view_quota,
          remaining: Math.max(0, view_quota.max - effective_usage),
          was_reset: false
        };
      }
      const inc_result = await collection.save({
        ...query,
        start: current.start,
        $expr: { $gte: [{ $add: ["$usage", requested_usage] }, 0] }
      }, { $inc: { usage: requested_usage } }, { return: true, upsert: false, throw: false, retry: 25 });
      if (!(inc_result instanceof Error)) {
        return {
          success: true,
          status: "success",
          quota: inc_result,
          remaining: Math.max(0, inc_result.max - inc_result.usage),
          was_reset: false
        };
      }
      const clamp_result = await collection.save({ ...query, start: current.start }, { $set: { usage: 0 } }, { return: true, upsert: false, throw: false, retry: 25 });
      if (!(clamp_result instanceof Error)) {
        return {
          success: true,
          status: "success",
          quota: clamp_result,
          remaining: Math.max(0, clamp_result.max - clamp_result.usage),
          was_reset: false
        };
      }
      import_system_error.SystemError.create_detach({
        owner: "volt.QuotaManager",
        collection: this.system_error?.collection,
        logger: this.system_error?.logger,
        message: `Failed to update quota for query '${this.format_query(query)}'.`,
        details: {
          query,
          requested_usage,
          upsert,
          safety_ratio,
          check_limit,
          perform_increment,
          is_transaction: collection instanceof import_collection.TransactionCollection
        }
      });
      return {
        success: false,
        status: "system_error",
        error: `Failed to update quota for query '${this.format_query(query)}'.`,
        quota: current,
        remaining: Math.max(0, current.max - current.usage)
      };
    }
  }
  /**
   * Validate quota limits and, optionally, atomically increment usage if within bounds.
   * Handles interval resets automatically in a single database operation.
   *
   * @warning Ensure the quota exists in the database, or provide `upsert` to create it when needed.
   *
   * @param perform_increment When `true` (default), performs the atomic increment. When `false`,
   *                          executes a dry-run validation without modifying the database.
   *
   * @note Negative `requested_usage` is not allowed. Use {@link increment} for decrements.
   *
   * @returns On success, returns the (possibly updated) quota and remaining capacity; on failure,
   *          returns a diagnostic indicating why the request was rejected.
   */
  async limit({ query, requested_usage, upsert, safety_ratio, perform_increment = true }) {
    if (requested_usage < 0) {
      return {
        success: false,
        status: "invalid_usage",
        error: `Negative requested_usage (${requested_usage}) is not allowed in 'limit'. Use 'increment' for decrements.`
      };
    }
    return this.limit_helper({
      query,
      requested_usage,
      upsert,
      safety_ratio,
      collection: this.collection,
      check_limit: true,
      perform_increment
    });
  }
  /**
   * Increment the usage on a quota.
   *
   * @warning This does not check for quota limits.
   * @warning Ensure the quota exists in the database, or define `upsert` to create it when needed.
   *
   * @note This function allows for negative `requested_usage` values.
   *
   * @returns The updated quota record or a diagnostic if the quota was not found in the database or if the max retries have been exceeded.
   */
  async increment({ query, requested_usage, upsert }) {
    return this.limit_helper({
      query,
      requested_usage,
      upsert,
      collection: this.collection,
      check_limit: false,
      perform_increment: true
    });
  }
  /**
   * Validates multiple quota limits and atomically increments usage if within bounds.
   * Handles interval resets automatically in a single database operation.
   *
   * This transaction based operation only commits changes if all quotas pass validation.
   *
   * @warning Ensure the quota exists in the database.
   *
   * @note This function does not allow for negative usage values, use {@link increment} for decrements.
   * @note This automatically increments the quota usage with the requested usage.
   *
   * @param limits The quota limits to validate and increment upon success, or roll back upon failure.
   *
   * @returns Success with updated quota info or validation/error details.
   */
  async batch_limit({ limits }) {
    if (limits.length === 0) {
      throw new Error("No limits provided for batch_limit");
    }
    for (const item of limits) {
      if (item.requested_usage < 0) {
        return {
          success: false,
          status: "invalid_usage",
          failed_query: item.query,
          error: `Negative 'requested_usage' (${item.requested_usage}) is not allowed in 'batch_limit'. Use 'increment' for decrements.`
        };
      }
      const val_input_res = this.validate_limit_helper_params({
        requested_usage: item.requested_usage,
        safety_ratio: item.safety_ratio,
        upsert: item.upsert,
        query: item.query
      });
      if (val_input_res) {
        return {
          success: false,
          status: val_input_res.status,
          failed_query: item.query,
          error: val_input_res.error
        };
      }
    }
    const transaction = await this.collection.start_transaction();
    const results = [];
    let active_limit = limits[0];
    try {
      for (const limit of limits) {
        active_limit = limit;
        const result = await this.limit_helper({
          query: limit.query,
          requested_usage: limit.requested_usage,
          upsert: limit.upsert,
          collection: transaction,
          safety_ratio: limit.safety_ratio,
          check_limit: limit.check_limit ?? true,
          perform_increment: limit.perform_increment ?? true
        });
        if (!result.success) {
          await transaction.abort();
          return {
            ...result,
            failed_query: limit.query
          };
        }
        results.push(result);
      }
    } catch (error) {
      await transaction.abort();
      import_system_error.SystemError.create_detach({
        owner: "volt.QuotaManager",
        collection: this.system_error?.collection,
        logger: this.system_error?.logger,
        message: `Transaction failed: ${error && typeof error === "object" && error.message ? error.message : error}`,
        details: {
          failed_query: active_limit.query,
          is_transaction: true
        }
      });
      return {
        success: false,
        status: "system_error",
        failed_query: active_limit.query,
        error: `Transaction failed: ${error && typeof error === "object" && error.message ? error.message : error}`
      };
    }
    try {
      await transaction.commit();
    } catch (error) {
      await transaction.abort();
      import_system_error.SystemError.create_detach({
        owner: "volt.QuotaManager",
        collection: this.system_error?.collection,
        logger: this.system_error?.logger,
        message: `Transaction commit failed: ${error && typeof error === "object" && error.message ? error.message : error}`,
        details: {
          failed_query: active_limit.query,
          is_transaction: true
        }
      });
      return {
        success: false,
        status: "system_error",
        failed_query: active_limit.query,
        error: `Transaction commit failed: ${error && typeof error === "object" && error.message ? error.message : error}`
      };
    }
    return {
      success: true,
      status: "success",
      results
    };
  }
}
(function(QuotaManager2) {
  ;
  let Quota;
  (function(Quota2) {
    let Opts;
    (function(Opts2) {
      Opts2.Schema = {
        max: { type: "number", required: true },
        interval: { type: "number", required: true }
      };
      function validate(quota) {
        if (quota.max <= 0 || !Number.isFinite(quota.max)) {
          return `Invalid max value: ${quota.max}. Must be positive and finite.`;
        }
        if (quota.interval <= 0 || !Number.isFinite(quota.interval)) {
          return `Invalid interval value: ${quota.interval}. Must be positive and finite.`;
        }
      }
      Opts2.validate = validate;
    })(Opts = Quota2.Opts || (Quota2.Opts = {}));
    function to_nano(q) {
      if (!q) {
        return void 0;
      } else if (typeof q === "number") {
        return QuotaManager2.to_scaled_amount(q, 1, 1e9);
      }
      return {
        max: QuotaManager2.to_scaled_amount(q.max, 1, 1e9),
        interval: q.interval
      };
    }
    Quota2.to_nano = to_nano;
  })(Quota = QuotaManager2.Quota || (QuotaManager2.Quota = {}));
  let AmountScale;
  (function(AmountScale2) {
    AmountScale2.Base = 1;
    AmountScale2.Nano = 1e9;
  })(AmountScale = QuotaManager2.AmountScale || (QuotaManager2.AmountScale = {}));
  function to_scaled_amount(value, from_scale, to_scale) {
    if (!Number.isFinite(value)) {
      throw new Error(`Invalid 'value': ${value}`);
    }
    if (from_scale === to_scale) {
      if (to_scale === AmountScale.Base) {
        return value;
      }
      if (!Number.isInteger(value) || !Number.isSafeInteger(value)) {
        throw new Error(`Expected safe integer at nano scale, got ${value}`);
      }
      return value;
    }
    if (to_scale === AmountScale.Nano) {
      const n = Math.round(value * AmountScale.Nano);
      if (!Number.isSafeInteger(n)) {
        throw new Error(`Overflow converting to nano scale from value=${value}`);
      }
      return n;
    }
    if (!Number.isInteger(value) || !Number.isSafeInteger(value)) {
      throw new Error(`Expected safe integer at nano scale when converting to base scale, got ${value}`);
    }
    return value / AmountScale.Nano;
  }
  QuotaManager2.to_scaled_amount = to_scaled_amount;
  function assert_nano_int(label, value, prefix) {
    if (!Number.isInteger(value) || !Number.isSafeInteger(value) || value < 0) {
      throw new Error(`${prefix ?? ""}Invalid ${label}: expected non-negative safe integer at nano scale, got ${value}`);
    }
  }
  QuotaManager2.assert_nano_int = assert_nano_int;
  function mul_int_safe(quantity, price_scaled) {
    if (!Number.isSafeInteger(quantity) || quantity < 0) {
      throw new Error(`Invalid 'quantity': expected non-negative safe integer, got ${quantity}`);
    }
    if (!Number.isSafeInteger(price_scaled) || price_scaled < 0) {
      throw new Error(`Invalid 'price_scaled': expected non-negative safe integer, got ${price_scaled}`);
    }
    const product = quantity * price_scaled;
    if (!Number.isSafeInteger(product)) {
      throw new Error(`Overflow in 'mul_int_safe()': ${quantity} * ${price_scaled} = ${product}`);
    }
    return product;
  }
  QuotaManager2.mul_int_safe = mul_int_safe;
  function div_int_safe(numerator, denominator, mode = "exact") {
    if (!Number.isSafeInteger(numerator) || numerator < 0) {
      throw new Error(`Invalid 'numerator': expected non-negative safe integer, got ${numerator}`);
    }
    if (!Number.isSafeInteger(denominator) || denominator <= 0) {
      throw new Error(`Invalid 'denominator': expected positive safe integer, got ${denominator}`);
    }
    const quotient = Math.trunc(numerator / denominator);
    const product = quotient * denominator;
    if (!Number.isSafeInteger(product)) {
      throw new Error(`Overflow computing remainder in 'div_int_safe()'`);
    }
    const remainder = numerator - product;
    if (mode === "exact") {
      if (remainder !== 0) {
        throw new Error(`Non-exact division in 'div_int_safe()': ${numerator} / ${denominator} leaves remainder ${remainder}`);
      }
      return quotient;
    }
    if (mode === "floor") {
      return quotient;
    }
    if (mode === "ceil") {
      return remainder === 0 ? quotient : quotient + 1;
    }
    if (mode === "round") {
      const twice_remainder = remainder * 2;
      if (!Number.isSafeInteger(twice_remainder)) {
        throw new Error(`Overflow computing rounding threshold in 'div_int_safe()'`);
      }
      if (twice_remainder >= denominator) {
        const q = quotient + 1;
        if (!Number.isSafeInteger(q)) {
          throw new Error(`Overflow rounding quotient in 'div_int_safe()'`);
        }
        return q;
      }
      return quotient;
    }
    throw new Error(`Invalid 'mode' for div_int_safe(): ${mode}`);
  }
  QuotaManager2.div_int_safe = div_int_safe;
  function add_int_safe(a, b, label) {
    if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b)) {
      throw new Error(`Invalid operands for ${label}: expected safe integers, got a=${a}, b=${b}`);
    }
    const s = a + b;
    if (!Number.isSafeInteger(s)) {
      throw new Error(`Overflow adding ${label}: ${a} + ${b} = ${s}`);
    }
    return s;
  }
  QuotaManager2.add_int_safe = add_int_safe;
})(QuotaManager || (QuotaManager = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  QuotaManager
});
