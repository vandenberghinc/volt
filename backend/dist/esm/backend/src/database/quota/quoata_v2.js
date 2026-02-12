/**
 * @author Daan van den Bergh
 * @copyright © 2025 - 2025 Daan van den Bergh. All rights reserved.
 */
// Imports.
import { SystemError } from "../../errors/system_error.js";
import { Collection, TransactionCollection } from "../collection.js";
import { InvalidUsageError } from "../../errors/index.js";
import { SafeInt } from "./safe_int.js";
/**
 * The quota manager.
 * This manager can be used to manage and enforce usage quotas for different resources,
 * for instance limiting money spent on tokens, or for rate limiting purposes.
 *
 * For managing monetary quotas, it is advised to use a nano-scale amount system
 * (smallest unit integer accounting). See {@link Quota.to_nano} for converting to nano scale.
 *
 * The quota manager ties each operation to a specific user id. For creating system quota's you can
 * use a non numeric `uid` to simulate a `uid` if needed.
 *
 * @template Type The allowed type for {@link Query.type}, provided at class level.
 *
 * @nav Database
 * @docs
 */
export class QuotaManager {
    // ----------------------------------------------------------------
    // Attributes
    // ----------------------------------------------------------------
    /** The collection for database operations. */
    collection;
    /** The system error options. */
    system_error;
    /**
     * Construct a new quota manager with a specific quota type.
     *
     * @throws {InvalidUsageError} If {@link QuotaManager.Opts.collection} is already initialized and does not have the correct index.
     *                             If the passed collection has manually assigned fields for {@link Collection.record_version} or {@link Collection.on_transform_version}.
     *                             If the passed collection is transaction based.
     *
     * @docs
     */
    constructor(opts) {
        // Attributes.
        this.collection = opts.server.db.collection({
            name: opts.collection.name,
            ttl: opts.collection.ttl,
            indexes: [
                { key: "id", unique: true, forced: true },
                { key: "uid", forced: true },
            ],
            unique: true,
            persist_transformed_on_load: "replace",
            record_version: 1,
            // on_transform_version() {}
        });
        this.system_error = opts.system_error;
    }
    // ----------------------------------------------------------------
    // Private utility methods.
    // ----------------------------------------------------------------
    /**
     * Helper to create consistent query objects for MongoDB.
     */
    create_db_query(query) {
        return { uid: query.uid, id: query.id };
    }
    /**
     * Format a compact, human-readable quota identifier for logs and error messages.
     *
     * @param query An object carrying the `uid` and `id` fields.
     * @returns A stable identifier of the form `<uid>:<id>`.
     */
    format_quota_id(query) {
        return `${query.uid}:${query.id}`;
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
     *
     * @docs
     */
    async get(query, opts) {
        // Validate quota identity + config
        const val_err = QuotaManager.Query.validate(query);
        if (val_err) {
            const err = new InvalidUsageError({
                message: `Invalid quota: ${val_err}`,
                reason: "invalid_quota",
                field: "quota",
            });
            if (opts?.throw ?? true)
                throw err;
            return err;
        }
        // Load.
        if (opts) {
            opts = { retry: 25, ...opts };
            return this.collection.load(this.create_db_query(query), opts);
        }
        else {
            return this.collection.load(this.create_db_query(query), { retry: 25 });
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
     *
     * @docs
     */
    async get_status(query, opts) {
        const now_sec = Math.floor(Date.now() / 1000);
        const db_query = this.create_db_query(query);
        // Validate query.
        const val_err = QuotaManager.Query.validate(query);
        if (val_err) {
            return {
                found: false,
                reason: "invalid_query",
                error: `Invalid query: ${val_err}`,
            };
        }
        const loaded_quota = await this.collection.load(db_query, { retry: 25, throw: false, timeout: opts?.timeout });
        if (loaded_quota instanceof Collection.NotFoundError) {
            return {
                found: false,
                reason: "not_found",
                error: `Quota not found: ${this.format_quota_id(query)} for user ${query.uid}`,
            };
        }
        if (loaded_quota instanceof Error) {
            SystemError.create_detach({
                owner: "volt.QuotaManager",
                collection: this.system_error?.collection,
                logger: this.system_error?.logger,
                message: "Failed to load quota in get_status().",
                details: {
                    quota_id: this.format_quota_id(query),
                    uid: query.uid,
                    original_error: loaded_quota?.message ?? String(loaded_quota),
                },
            });
            return {
                found: false,
                reason: "system_error",
                error: `Encountered an unknown error while loading quota: ${this.format_quota_id(query)} for user ${query.uid}.`,
            };
        }
        const needs_reset = now_sec >= (loaded_quota.start + loaded_quota.interval);
        const effective_usage = needs_reset ? 0 : loaded_quota.usage;
        const time_until_reset = needs_reset ? 0 : Math.max(0, (loaded_quota.start + loaded_quota.interval) - now_sec);
        const remaining = Math.max(0, loaded_quota.max - effective_usage);
        const percentage_used = (loaded_quota.max > 0)
            ? Math.min(100, Math.max(0, (effective_usage / loaded_quota.max) * 100))
            : (effective_usage > 0 ? 100 : 0);
        return {
            found: true,
            quota: needs_reset ? { ...loaded_quota, usage: 0, start: now_sec } : loaded_quota,
            remaining,
            percentage_used,
            needs_reset,
            time_until_reset,
        };
    }
    /**
     * List all quotas for a user, optionally filtered by type.
     *
     * @param uid The user identifier.
     * @param type Optional quota type filter.
     * @returns List of quotas with their current status.
     *
     * @docs
     */
    async list({ uid, timeout, }) {
        const now_sec = Math.floor(Date.now() / 1000);
        const listed = [];
        await this.collection.list({ uid }, {
            timeout,
            retry: 5,
            callback: (q) => {
                const needs_reset = now_sec >= (q.start + q.interval);
                const effective_usage = needs_reset ? 0 : q.usage;
                const percentage_used = (q.max > 0)
                    ? Math.min(100, Math.max(0, (effective_usage / q.max) * 100))
                    : (effective_usage > 0 ? 100 : 0);
                listed.push({
                    quota: needs_reset ? { ...q, usage: 0, start: now_sec } : q,
                    remaining: Math.max(0, q.max - effective_usage),
                    percentage_used,
                    needs_reset,
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
     *
     * @docs
     */
    async set(quota, opts) {
        // Validate quota identity + config
        const val_err = QuotaManager.Document.Opts.validate(quota, this.collection);
        if (val_err) {
            const err = new InvalidUsageError({
                message: `Invalid quota: ${val_err}`,
                reason: "invalid_quota",
                field: "quota",
            });
            if (opts?.throw ?? true)
                throw err;
            return err;
        }
        // Atomic upsert that never resets runtime fields on existing documents:
        // - $set updates config only.
        // - $setOnInsert initializes runtime counters on first creation.
        const now_sec = Math.floor(Date.now() / 1000);
        const save_opts = {
            return: true,
            upsert: true,
            retry: 25,
            throw: opts?.throw ?? true,
            timeout: opts?.timeout,
        };
        return await this.collection.save(this.create_db_query(quota), {
            $set: {
                max: quota.max,
                interval: quota.interval,
            },
            $setOnInsert: {
                usage: 0,
                start: now_sec,
            },
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
     *
     * @docs
     */
    async reset_usage(query, opts) {
        // Check.
        const query_err = QuotaManager.Query.validate(query);
        if (query_err) {
            const err = new InvalidUsageError({
                message: `Invalid quota query: ${query_err}`,
                reason: "invalid_query",
                field: "query",
            });
            if (opts?.throw ?? true)
                throw err;
            return err;
        }
        // Save.
        const save_opts = {
            return: true,
            upsert: false,
            retry: 25,
            throw: opts?.throw,
            timeout: opts?.timeout,
        };
        return await this.collection.save(this.create_db_query(query), {
            $set: {
                usage: 0,
                start: Math.floor(Date.now() / 1000)
            },
        }, save_opts);
    }
    /**
     * Delete all quotas for a user.
     *
     * @docs
     */
    async delete_by_user({ uid }) {
        await this.collection.delete_many({ uid }, { retry: 25 });
    }
    // ----------------------------------------------------------------
    // Quota limiting.
    // ----------------------------------------------------------------
    /**
     * Validate the required {@link limit_helper} parameters.
     * @note Parameter `requested_usage` may be a negative number.
     *
     * @docs
     */
    validate_limit_helper_params({ requested_usage, safety_ratio, query, upsert, }) {
        // Param `requested_usage` may be a negative number in case the 
        // estimated quota usage was higher then the actual usage.
        // This could for instance happen in class OpenAI.
        // Validate input
        if (!Number.isFinite(requested_usage)) {
            return {
                success: false,
                status: "invalid_usage",
                error: `Invalid requested usage: ${requested_usage}. Must be a finite number.`,
            };
        }
        // Validate safety ratio.
        if (safety_ratio !== undefined && (!Number.isFinite(safety_ratio) || safety_ratio < 1)) {
            // Safety ratio must be finite and >= 1 to avoid underestimation.
            return {
                success: false,
                status: "invalid_usage",
                error: `Invalid 'safety_ratio' value: ${safety_ratio}. Must be finite and >= 1.`,
            };
        }
        const product_safety_usage = requested_usage * (safety_ratio ?? 1);
        if (!Number.isFinite(product_safety_usage)) {
            // Guard against overflow/Infinity in the product used by checks and $expr.
            return {
                success: false,
                status: "invalid_usage",
                error: `Invalid product of 'requested_usage' and 'safety_ratio'.`,
            };
        }
        // Validate query.
        const val_err = QuotaManager.Query.validate(query);
        if (val_err) {
            return {
                success: false,
                status: "invalid_usage",
                error: `Invalid quota query: ${val_err}`,
            };
        }
        // Validate upsertion.
        if (upsert) {
            const record = {
                ...upsert,
                ...query,
            };
            const val_err = QuotaManager.Document.Opts.validate(record, this.collection);
            if (val_err) {
                return {
                    success: false,
                    status: "invalid_usage",
                    error: `Invalid quota upsert: ${val_err}`,
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
     * @docs
     *
     */
    async limit_helper({ query, requested_usage, upsert, safety_ratio = 1, check_limit = true, perform_increment = true, collection, }) {
        const val_input_res = this.validate_limit_helper_params({
            requested_usage,
            safety_ratio,
            upsert,
            query,
        });
        if (val_input_res)
            return val_input_res;
        const now_sec = Math.floor(Date.now() / 1000);
        const db_query = this.create_db_query(query);
        // ---------------------------
        // fast path (no reset needed)
        // ---------------------------
        if (check_limit) {
            if (perform_increment) {
                // enforce BOTH actual and safety-ratio checks, and prevent negative usage
                const result = await collection.save({
                    ...db_query,
                    $expr: {
                        $and: [
                            { $lt: [now_sec, { $add: ["$start", "$interval"] }] },
                            { $lte: [{ $add: ["$usage", requested_usage] }, "$max"] },
                            { $lte: [{ $add: ["$usage", requested_usage * safety_ratio] }, "$max"] },
                            { $gte: [{ $add: ["$usage", requested_usage] }, 0] },
                        ]
                    }
                }, { $inc: { usage: requested_usage } }, { return: true, upsert: false, retry: 25, throw: false });
                if (!(result instanceof Error)) {
                    return {
                        success: true,
                        status: "success",
                        quota: result,
                        remaining: Math.max(0, result.max - result.usage),
                        was_reset: false,
                    };
                }
            }
            else {
                // check-only fast path: verify constraints without incrementing
                const result = await collection.load({
                    ...db_query,
                    $expr: {
                        $and: [
                            { $lt: [now_sec, { $add: ["$start", "$interval"] }] },
                            { $lte: [{ $add: ["$usage", requested_usage] }, "$max"] },
                            { $lte: [{ $add: ["$usage", requested_usage * safety_ratio] }, "$max"] },
                            { $gte: [{ $add: ["$usage", requested_usage] }, 0] },
                        ]
                    }
                }, { retry: 25, throw: false });
                if (!(result instanceof Error)) {
                    return {
                        success: true,
                        status: "success",
                        quota: result,
                        remaining: Math.max(0, result.max - result.usage),
                        was_reset: false,
                    };
                }
            }
        }
        else {
            if (perform_increment) {
                // increment without limit checks; still prevent negative usage via atomic guard
                const result = await collection.save({
                    ...db_query,
                    $expr: {
                        $and: [
                            { $lt: [now_sec, { $add: ["$start", "$interval"] }] },
                            { $gte: [{ $add: ["$usage", requested_usage] }, 0] },
                        ]
                    }
                }, { $inc: { usage: requested_usage } }, { return: true, upsert: false, throw: false, retry: 25 });
                if (!(result instanceof Error)) {
                    return {
                        success: true,
                        status: "success",
                        quota: result,
                        remaining: Math.max(0, result.max - result.usage),
                        was_reset: false,
                    };
                }
            }
            // perform_increment === false and check_limit === false:
            // fall through to slow path; we'll just load and return current state.
        }
        // ---------------------------
        // slow path (load current)
        // ---------------------------
        let current = await collection.load(db_query, { retry: 25, throw: false });
        if (current instanceof Error) {
            // only treat NotFoundError as "document missing"; everything else is a system error
            if (!(current instanceof Collection.NotFoundError)) {
                SystemError.create_detach({
                    owner: "volt.QuotaManager",
                    collection: this.system_error?.collection,
                    logger: this.system_error?.logger,
                    message: `Encountered an unknown error while loading quota '${this.format_quota_id(query)}' for user '${query.uid}'`,
                    details: {
                        query,
                        requested_usage,
                        upsert,
                        safety_ratio,
                        check_limit,
                        perform_increment,
                        is_transaction: collection instanceof TransactionCollection,
                        original_error: current?.message ?? String(current),
                    },
                });
                return {
                    success: false,
                    status: "system_error",
                    error: `Encountered an unknown error while loading quota '${this.format_quota_id(query)}' for user '${query.uid}'`,
                };
            }
            // not found
            if (!upsert) {
                return {
                    success: false,
                    status: "not_found",
                    error: `Quota not found '${this.format_quota_id(query)}' for user '${query.uid}'`,
                };
            }
            // upsert provided but perform a check-only (no write)
            if (!perform_increment) {
                const would_exceed_actual = requested_usage > upsert.max;
                const would_exceed_ratio = (requested_usage * safety_ratio) > upsert.max;
                if (check_limit && (would_exceed_actual || would_exceed_ratio)) {
                    return {
                        success: false,
                        status: "would_exceed",
                        error: `Requested usage (${requested_usage}, safety=${requested_usage * safety_ratio}) exceeds fresh-window maximum (${upsert.max}).`,
                        remaining: upsert.max,
                    };
                }
                const virtual_doc = {
                    uid: query.uid,
                    id: query.id,
                    max: upsert.max,
                    interval: upsert.interval,
                    start: now_sec,
                    usage: Math.max(0, requested_usage),
                };
                return {
                    success: true,
                    status: "success",
                    quota: virtual_doc,
                    remaining: Math.max(0, virtual_doc.max - virtual_doc.usage),
                    was_reset: false,
                };
            }
            // perform_increment === true: create within the provided collection/transaction
            const doc_record = {
                uid: query.uid,
                id: query.id,
                max: upsert.max,
                interval: upsert.interval,
                start: now_sec,
                usage: Math.max(0, requested_usage),
            };
            const created = await collection.set(db_query, doc_record, { return: true, upsert: true, throw: false, retry: 25 });
            if (created instanceof Error) {
                SystemError.create_detach({
                    owner: "volt.QuotaManager",
                    collection: this.system_error?.collection,
                    logger: this.system_error?.logger,
                    message: `Failed to create quota '${this.format_quota_id(query)}' for user '${query.uid}'`,
                    details: {
                        query,
                        requested_usage,
                        upsert,
                        safety_ratio,
                        check_limit,
                        perform_increment,
                        is_transaction: collection instanceof TransactionCollection,
                        original_error: created?.message ?? String(created),
                    },
                });
                return {
                    success: false,
                    status: "system_error",
                    error: `Failed to create quota '${this.format_quota_id(query)}' for user '${query.uid}'`,
                };
            }
            current = created;
        }
        // interval expired -> reset window then apply/check
        const interval_expired = now_sec >= (current.start + current.interval);
        if (interval_expired) {
            if (check_limit) {
                const would_exceed_actual = requested_usage > current.max;
                const would_exceed_ratio = (requested_usage * safety_ratio) > current.max;
                if (would_exceed_actual || would_exceed_ratio) {
                    return {
                        success: false,
                        status: "would_exceed",
                        error: `Requested usage (${requested_usage}, safety=${requested_usage * safety_ratio}) exceeds fresh-window maximum (${current.max}).`,
                        quota: current,
                        remaining: current.max,
                    };
                }
            }
            if (!perform_increment) {
                // check-only: return a "would-be" reset view without writing
                const view_after_reset = { ...current, usage: 0, start: now_sec };
                return {
                    success: true,
                    status: "success",
                    quota: view_after_reset,
                    remaining: Math.max(0, view_after_reset.max - view_after_reset.usage),
                    was_reset: false,
                };
            }
            // perform_increment === true -> actually reset (and apply increment if any)
            const new_usage = Math.max(0, requested_usage);
            const reset_result = await collection.save({
                ...db_query,
                // optimistic lock against concurrent reset
                start: current.start,
            }, {
                $set: {
                    usage: new_usage,
                    start: now_sec,
                }
            }, { return: true, upsert: false, throw: false, retry: 25 });
            if (!(reset_result instanceof Error)) {
                return {
                    success: true,
                    status: "success",
                    quota: reset_result,
                    remaining: Math.max(0, reset_result.max - reset_result.usage),
                    was_reset: true,
                };
            }
            SystemError.create_detach({
                owner: "volt.QuotaManager",
                collection: this.system_error?.collection,
                logger: this.system_error?.logger,
                message: `Race condition detected after maximum retries.`,
                details: {
                    query, requested_usage, upsert,
                    safety_ratio, check_limit, perform_increment,
                    is_transaction: collection instanceof TransactionCollection,
                },
            });
            return {
                success: false,
                status: "system_error",
                error: `Race condition detected after maximum retries.`,
                quota: current,
                remaining: Math.max(0, current.max - current.usage),
            };
        }
        // interval active (no reset)
        if (check_limit) {
            /**
             * Check-only path in the active window: `check_limit === true && perform_increment === false`.
             * Performs validation without mutating the database.
             * - Fails if the quota is already exceeded.
             * - Fails if `(usage + requested_usage)` would exceed `max` (including safety ratio).
             * - Returns the current quota snapshot on success with `was_reset: false`.
             */
            if (!perform_increment) {
                /** Quota already exceeded; no capacity remains. */
                if (current.usage > current.max) {
                    return {
                        success: false,
                        status: "exceeded",
                        error: `Quota usage '${current.usage}' has already exceeded maximum quota '${current.max}'`,
                        quota: current,
                        remaining: Math.max(0, current.max - current.usage),
                    };
                }
                const would_exceed_actual = (current.usage + requested_usage) > current.max;
                const would_exceed_ratio = (current.usage + (requested_usage * safety_ratio)) > current.max;
                if (would_exceed_actual || would_exceed_ratio) {
                    return {
                        success: false,
                        status: "would_exceed",
                        error: `Requested usage (${requested_usage}, safety=${requested_usage * safety_ratio}) would exceed remaining quota.`,
                        quota: current,
                        remaining: Math.max(0, current.max - current.usage),
                    };
                }
                /** Success: constraints satisfied, no DB mutations performed. */
                return {
                    success: true,
                    status: "success",
                    quota: current,
                    remaining: Math.max(0, current.max - current.usage),
                    was_reset: false,
                };
            }
            /**
             * `check_limit && perform_increment === true` -> original guarded increment
             */
            if ((current.usage + requested_usage) < 0) {
                const clamp_result = await collection.save({
                    ...db_query,
                    start: current.start, // optimistic lock in the same window
                }, { $set: { usage: 0 } }, { return: true, upsert: false, throw: false, retry: 25 });
                if (!(clamp_result instanceof Error)) {
                    return {
                        success: true,
                        status: "success",
                        quota: clamp_result,
                        remaining: Math.max(0, clamp_result.max - clamp_result.usage),
                        was_reset: false,
                    };
                }
                SystemError.create_detach({
                    owner: "volt.QuotaManager",
                    collection: this.system_error?.collection,
                    logger: this.system_error?.logger,
                    message: `Failed to clamp usage to zero for query '${this.format_quota_id(query)}'.`,
                    details: {
                        query, requested_usage, upsert,
                        safety_ratio, check_limit, perform_increment,
                        is_transaction: collection instanceof TransactionCollection,
                    },
                });
                return {
                    success: false,
                    status: "system_error",
                    error: `Failed to clamp usage to zero for query '${this.format_quota_id(query)}'.`,
                    quota: current,
                    remaining: Math.max(0, current.max - current.usage),
                };
            }
            /** Quota already exceeded; do not allow further increments. */
            if (current.usage > current.max) {
                return {
                    success: false,
                    status: "exceeded",
                    error: `Quota usage '${current.usage}' has already exceeded maximum quota '${current.max}'`,
                    quota: current,
                    remaining: Math.max(0, current.max - current.usage),
                };
            }
            const would_exceed_actual = (current.usage + requested_usage) > current.max;
            const would_exceed_ratio = (current.usage + (requested_usage * safety_ratio)) > current.max;
            if (would_exceed_actual || would_exceed_ratio) {
                return {
                    success: false,
                    status: "would_exceed",
                    error: `Requested usage (${requested_usage}, safety=${requested_usage * safety_ratio}) would exceed remaining quota.`,
                    quota: current,
                    remaining: Math.max(0, current.max - current.usage),
                };
            }
            // race-safe increment guarded by start equality and non-negative
            const inc_result = await collection.save({
                ...db_query,
                start: current.start,
                $expr: { $gte: [{ $add: ["$usage", requested_usage] }, 0] },
            }, { $inc: { usage: requested_usage } }, { return: true, upsert: false, throw: false, retry: 25 });
            if (!(inc_result instanceof Error)) {
                return {
                    success: true,
                    status: "success",
                    quota: inc_result,
                    remaining: Math.max(0, inc_result.max - inc_result.usage),
                    was_reset: false,
                };
            }
            SystemError.create_detach({
                owner: "volt.QuotaManager",
                collection: this.system_error?.collection,
                logger: this.system_error?.logger,
                message: `Failed to update quota for query '${this.format_quota_id(query)}'.`,
                details: {
                    query, requested_usage, upsert,
                    safety_ratio, check_limit, perform_increment,
                    is_transaction: collection instanceof TransactionCollection,
                },
            });
            return {
                success: false,
                status: "system_error",
                error: `Failed to update quota for query '${this.format_quota_id(query)}'.`,
                quota: current,
                remaining: Math.max(0, current.max - current.usage),
            };
        }
        // check_limit === false
        else {
            if (!perform_increment) {
                // check-only without limit checks: return current state (window-view) without writing
                const needs_reset = now_sec >= current.start + current.interval;
                const effective_usage = needs_reset ? 0 : current.usage;
                const view_quota = needs_reset ? { ...current, usage: 0, start: now_sec } : current;
                return {
                    success: true,
                    status: "success",
                    quota: view_quota,
                    remaining: Math.max(0, view_quota.max - effective_usage),
                    was_reset: false,
                };
            }
            /**
             * Increment-only slow path with race safety and non-negative invariant.
             *
             * Invariant:
             * - Never persist a negative `usage`.
             *
             * Mechanism:
             * - First attempt an atomic guarded increment (`$expr: usage + requested_usage >= 0`)
             *   under optimistic lock `start: current.start`.
             * - If the guard fails (e.g., the increment would underflow), clamp `usage` to `0`
             *   with the same optimistic lock to avoid TOCTOU races.
             */
            const inc_result = await collection.save({
                ...db_query,
                start: current.start,
                $expr: { $gte: [{ $add: ["$usage", requested_usage] }, 0] },
            }, { $inc: { usage: requested_usage } }, { return: true, upsert: false, throw: false, retry: 25 });
            if (!(inc_result instanceof Error)) {
                return {
                    success: true,
                    status: "success",
                    quota: inc_result,
                    remaining: Math.max(0, inc_result.max - inc_result.usage),
                    was_reset: false,
                };
            }
            /**
             * Guard failed — clamp to zero atomically (same optimistic lock).
             */
            const clamp_result = await collection.save({ ...db_query, start: current.start }, { $set: { usage: 0 } }, { return: true, upsert: false, throw: false, retry: 25 });
            if (!(clamp_result instanceof Error)) {
                return {
                    success: true,
                    status: "success",
                    quota: clamp_result,
                    remaining: Math.max(0, clamp_result.max - clamp_result.usage),
                    was_reset: false,
                };
            }
            SystemError.create_detach({
                owner: "volt.QuotaManager",
                collection: this.system_error?.collection,
                logger: this.system_error?.logger,
                message: `Failed to update quota for query '${this.format_quota_id(query)}'.`,
                details: {
                    query, requested_usage, upsert,
                    safety_ratio, check_limit, perform_increment,
                    is_transaction: collection instanceof TransactionCollection,
                },
            });
            return {
                success: false,
                status: "system_error",
                error: `Failed to update quota for query '${this.format_quota_id(query)}'.`,
                quota: current,
                remaining: Math.max(0, current.max - current.usage),
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
     *
     * @docs
     */
    async limit({ query, requested_usage, upsert, safety_ratio, perform_increment = true }) {
        if (requested_usage < 0) {
            return {
                success: false,
                status: "invalid_usage",
                error: `Negative requested_usage (${requested_usage}) is not allowed in 'limit'. Use 'increment' for decrements.`,
            };
        }
        return this.limit_helper({
            query,
            requested_usage,
            upsert,
            safety_ratio,
            collection: this.collection,
            check_limit: true,
            perform_increment,
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
     *
     * @docs
     */
    async increment({ query, requested_usage, upsert, }) {
        return this.limit_helper({
            query,
            requested_usage,
            upsert,
            collection: this.collection,
            check_limit: false,
            perform_increment: true,
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
     *
     * @docs
     */
    async batch_limit({ limits }) {
        // Throw invalid usage error when no limits are provided, dont return response.
        if (limits.length === 0) {
            throw new Error("No limits provided for batch_limit");
        }
        // Early validation
        for (const item of limits) {
            if (item.requested_usage < 0) {
                return {
                    success: false,
                    status: "invalid_usage",
                    failed_query: item.query,
                    error: `Negative 'requested_usage' (${item.requested_usage}) is not allowed in 'batch_limit'. Use 'increment' for decrements.`,
                };
            }
            // Validate input
            const val_input_res = this.validate_limit_helper_params({
                requested_usage: item.requested_usage,
                safety_ratio: item.safety_ratio,
                upsert: item.upsert,
                query: item.query,
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
        // Start transaction.
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
                    perform_increment: limit.perform_increment ?? true,
                });
                if (!result.success) {
                    await transaction.abort();
                    return {
                        ...result,
                        failed_query: limit.query,
                    };
                }
                results.push(result);
            }
        }
        catch (error) {
            await transaction.abort();
            SystemError.create_detach({
                owner: "volt.QuotaManager",
                collection: this.system_error?.collection,
                logger: this.system_error?.logger,
                message: `Transaction failed: ${error instanceof Error ? error.message : String(error)}`,
                details: {
                    failed_query: active_limit.query,
                    is_transaction: true,
                },
            });
            return {
                success: false,
                status: "system_error",
                failed_query: active_limit.query,
                error: `Transaction failed: ${error instanceof Error ? error.message : String(error)}`,
            };
        }
        // Commit with error handling; abort on failure to preserve atomicity.
        try {
            await transaction.commit();
        }
        catch (error) {
            await transaction.abort();
            SystemError.create_detach({
                owner: "volt.QuotaManager",
                collection: this.system_error?.collection,
                logger: this.system_error?.logger,
                message: `Transaction commit failed: ${error instanceof Error ? error.message : String(error)}`,
                details: {
                    failed_query: active_limit.query,
                    is_transaction: true,
                },
            });
            return {
                success: false,
                status: "system_error",
                failed_query: active_limit.query,
                error: `Transaction commit failed: ${error instanceof Error ? error.message : String(error)}`,
            };
        }
        // Result.
        return {
            success: true,
            status: "success",
            results,
        };
    }
}
/**
 * The quota manager module.
 * This manager can be used to manage and enforce usage quotas for different resources,
 * for instance limiting money spent on tokens, or for rate limiting purposes.
 *
 * For managing monetary quotas, it is advised to use a nano-scale amount system
 * (smallest unit integer accounting). See {@link Quota.to_nano} for converting to nano scale.
 */
(function (QuotaManager) {
    // ----------------------------------------------------------------
    // Constructor options.
    // ----------------------------------------------------------------
    /** Nested types for the {@link QuotaManager.Query} type. */
    let Query;
    (function (Query) {
        /**
         * Validate {@link QuotaManager.Query} at runtime.
         * @returns An error message if the query is invalid, or undefined if it is valid.
         */
        function validate(query) {
            // Validate query.
            if (!query.uid?.trim()) {
                return "Invalid uid: must be a non-empty string.";
            }
            if (!query.id?.trim()) {
                return "Invalid id: must be a non-empty string.";
            }
        }
        Query.validate = validate;
    })(Query = QuotaManager.Query || (QuotaManager.Query = {}));
    ;
    /** Nested types for the {@link Quota} interface. */
    let Quota;
    (function (Quota) {
        /** Nested types for the {@link Opts} interface. */
        let Opts;
        (function (Opts) {
            /** The schema to validate quota {@link Opts} */
            Opts.Schema = {
                max: {
                    type: "number",
                    required: true,
                },
                interval: {
                    type: "number",
                    required: true,
                },
            };
            /**
             * Validate {@link Quota.Opts} at runtime.
             * @returns An error message if the quota is invalid, or undefined if it is valid.
             */
            function validate(quota, collection) {
                // Validate quota fields
                if (quota.max <= 0 || !Number.isFinite(quota.max)) {
                    return `Invalid quota 'max': ${quota.max}. Must be positive and finite.`;
                }
                if (quota.interval <= 0 || !Number.isFinite(quota.interval)) {
                    return `Invalid quota 'interval': ${quota.interval}. Must be positive and finite.`;
                }
                else if (collection.ttl != null && quota.interval * 1000 >= collection.ttl) {
                    return `Invalid quota 'interval': ${quota.interval}. Must be less than the collection TTL of ${Math.ceil(collection.ttl / 1000)} seconds.`;
                }
            }
            Opts.validate = validate;
        })(Opts = Quota.Opts || (Quota.Opts = {}));
        /**
         * Helper function to convert a number or quota scales to a nano integer.
         * For `Quota` options it only updates the `max` attribute.
         * Internally using {@link QuotaManager.to_scaled_amount}.
         *
         * @note This should be used before saving / upserting the quota,
         *       this should not be applied on saved quota's
         *
         * @param q The number, quota or undefined to convert, undefined will simply return undefined again.
         *
         * @returns The scaled input type.
         *
         * @docs
         */
        function to_nano(q, opts) {
            if (q == null)
                return undefined;
            else if (typeof q === "number") {
                return new SafeInt(q, { from_scale: 1, to_scale: SafeInt.Scale.Nano, round: opts?.round }).to_number();
            }
            return {
                max: new SafeInt(q.max, { from_scale: 1, to_scale: SafeInt.Scale.Nano, round: opts?.round }).to_number(),
                interval: q.interval,
            };
        }
        Quota.to_nano = to_nano;
    })(Quota = QuotaManager.Quota || (QuotaManager.Quota = {}));
    /** Nested types for the {@link Document} type. */
    let Document;
    (function (Document) {
        /** Nested types for the {@link Document.Opts} type. */
        let Opts;
        (function (Opts) {
            /**
             * Validate {@link Document.Opts} at runtime.
             * @returns An error message if the quota is invalid, or undefined if it is valid.
             */
            function validate(quota, collection) {
                let e;
                if ((e = Query.validate(quota)))
                    return e;
                if ((e = Quota.Opts.validate(quota, collection)))
                    return e;
            }
            Opts.validate = validate;
        })(Opts = Document.Opts || (Document.Opts = {}));
    })(Document = QuotaManager.Document || (QuotaManager.Document = {}));
})(QuotaManager || (QuotaManager = {}));
