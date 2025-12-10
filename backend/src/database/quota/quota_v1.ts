// @ts-nocheck
/**
 * @author Daan van den Bergh
 * @copyright © 2025 - 2025 Daan van den Bergh. All rights reserved.
 */

APPLY_FIX // Ask final audit

// External imports.
import * as vlib from "@vandenberghinc/vlib";

// Imports.
import { SystemError } from "../../errors/system_error.js";
import { Collection, TransactionCollection } from "../collection.js";
import { InvalidUsageError } from "src/volt.js";
import type { StrictFilter } from "../filters/strict_filter.js";
import type { StrictUpdateFilter } from "mongodb";
import { Server } from "../../server.js"

/**
 * The quota manager.
 * This manager can be used to manage and enforce usage quotas for different resources,
 * for instance limiting money spent on tokens, or for rate limiting purposes.
 * 
 * For managing monetary quotas, it is advised to use a nano-scale amount system
 * (smallest unit integer accounting). See {@link Quota.to_nano} for converting to nano scale.
 * 
 * @template Type The allowed type for {@link Query.type}, provided at class level.
 */
export class QuotaManager<
    Query extends QuotaManager.QueryBase,
> {

    // ----------------------------------------------------------------
    // Attributes
    // ----------------------------------------------------------------

    /** The initialized database collection used by this quota manager. */
    collection: Collection<QuotaManager.Document<Query>>;

    /**
     * A validator for queries.
     * If provided each query will be validated by this validator.
     * Should return an object with an optional error when occurred.
     */
    query_validator: undefined | QuotaManager.QueryValidator<Query>

    /** The system error options. */
    system_error: QuotaManager.Opts<Query>["system_error"];

    /**
     * Construct a new quota manager with a specific quota type.
     */
    constructor(opts: QuotaManager.Opts<Query>) {

        // Attributes.
        this.collection = opts.server.db.collection({
            name: opts.collection.name,
            ttl: opts.collection.ttl,
            indexes: [
                {
                    keys: { uid: 1, type: 1, name: 1 },
                    unique: true,
                    forced: true,
                },
            ],
            record_version: 1,
            persist_transformed_on_load: "replace",
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
    private format_query(query: Query): string {
        return Object.entries(query).map(([k, v]) => `${k}:${v}`).join("_")
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
    async get<
        Default extends Collection.LoadOpts.Default<QuotaManager.Document<Query>> = undefined,
        Projection extends Collection.LoadOpts.Projection = undefined,
        Throw extends Collection.LoadOpts.Throw = undefined,
    >(
        query: Query,
        opts?: Collection.LoadOpts<QuotaManager.Document<Query>, Default, Projection, Throw>
    ): Promise<Collection.WithThrow<
        Throw,
        InvalidUsageError,
        Collection.LoadResult<QuotaManager.Document<Query>, Default, Projection, Throw>>
    > {
        type Res = Collection.WithThrow<
            Throw,
            InvalidUsageError,
            Collection.LoadResult<QuotaManager.Document<Query>, Default, Projection, Throw>
        >;

        // Validate quota identity + config
        const val_err = this.query_validator ? this.query_validator(query) : undefined;
        if (val_err != null) {
            const err = new InvalidUsageError({
                message: `Invalid query: ${val_err}`,
                reason: "invalid_query",
                field: "query",
            });
            if (opts?.throw ?? true) throw err;
            return err as Res;
        }

        // Load.
        if (opts) {
            opts = { retry: 25, ...opts };
            return this.collection.load(query, opts);
        } else {
            return this.collection.load<Default, Projection, Throw>(
                query,
                { retry: 25 }
            );
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
    async get_status(
        query: Query,
        opts?: Pick<Collection.LoadOpts, "timeout">,
    ): Promise<QuotaManager.GetStatusResult<Query>> {
        const now_sec = Math.floor(Date.now() / 1000);

        // Validate quota identity + config
        const val_err = this.query_validator ? this.query_validator(query) : undefined;
        if (val_err != null) {
            return {
                found: false,
                reason: "invalid_query",
                error: `Invalid query: ${val_err}`
            }
        }

        // Load quota.
        const loaded_quota = await this.collection.load(query, { retry: 25, throw: false, timeout: opts?.timeout });
        if (loaded_quota instanceof Collection.NotFoundError) {
            return {
                found: false,
                reason: "not_found",
                error: `Quota not found with query '${this.format_query(query)}'`,
            };
        }
        if (loaded_quota instanceof Error) {
            SystemError.create_detach({
                owner: "volt.QuotaManager",
                collection: this.system_error?.collection,
                logger: this.system_error?.logger,
                message: "Failed to load quota in get_status().",
                details: {
                    query,
                    original_error: (loaded_quota as any)?.message ?? String(loaded_quota),
                },
            });
            return {
                found: false,
                reason: "system_error",
                error: `Encountered an unknown error while loading quota '${this.format_query(query)}'.`,
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
     * @param query The partial query to list quotas by.
     * @param type Optional quota type filter.
     * @returns List of quotas with their current status.
     */
    async list({
        query,
        timeout,
    }: {
        /** The query of documents to list. */
        query: Partial<Query>,
        /** Per-operation timeout in milliseconds, mapped to `maxTimeoutMS`. */
        timeout?: number
    }): Promise<QuotaManager.ListedQuota<Query>[]> {
        const now_sec = Math.floor(Date.now() / 1000);
        const listed: QuotaManager.ListedQuota<Query>[] = [];

        await this.collection.list(query, {
            timeout,
            retry: 5,
            callback: (q: QuotaManager.Document<Query>): void => {
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
     */
    async set<
        Throw extends Collection.SaveOpts.Throw = true,
    >(
        query: Query,
        quota: QuotaManager.Document.Opts<Query> & { usage?: never; start?: never },
        opts?: Pick<
            Collection.SaveOpts<undefined, true, Throw, true>,
            "throw" | "timeout"
        >
    ): Promise<Collection.WithThrow<
        Throw,
        InvalidUsageError,
        Collection.SaveResult<QuotaManager.Document<Query>, undefined, true, Throw>
    >> {
        type Res = Collection.WithThrow<
            Throw,
            InvalidUsageError,
            Collection.SaveResult<QuotaManager.Document<Query>, undefined, true, Throw>
        >;

        // Validate the query.
        let query_err: string | undefined;
        if (this.query_validator && (query_err = this.query_validator(query)) != null) {
            const err = new InvalidUsageError({
                message: `Invalid query: ${query_err}`,
                reason: "invalid_query",
                field: "query",
            });
            if (opts?.throw ?? true) throw err;
            return err as Res;
        }

        // Validate quota identity + config
        const val_err = QuotaManager.Quota.Opts.validate(quota);
        if (val_err) {
            const err = new InvalidUsageError({
                message: `Invalid quota: ${val_err}`,
                reason: "invalid_quota",
                field: "quota",
            });
            if (opts?.throw ?? true) throw err;
            return err as Res;
        }

        // Atomic upsert that never resets runtime fields on existing documents:
        // - $set updates config only.
        // - $setOnInsert initializes runtime counters on first creation.
        const now_sec = Math.floor(Date.now() / 1000);
        const save_opts: Collection.SaveOpts<undefined, true, Throw, true> = {
            return: true,
            upsert: true,
            retry: 25,
            throw: opts?.throw ?? true as Throw,
            timeout: opts?.timeout,
        };

        return await this.collection.save(
            query,
            {
                $set: {
                    max: quota.max,
                    interval: quota.interval,
                },
                $setOnInsert: {
                    usage: 0,
                    start: now_sec,
                },
            } as StrictUpdateFilter<QuotaManager.Document<Query>> as any,
            save_opts,
        );
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
    async reset_usage<
        Throw extends Collection.SaveOpts.Throw = undefined,
    >(
        query: Query,
        opts?: Pick<
            Collection.SaveOpts<undefined, true, Throw, false>, 
            "throw" | "timeout"
        >
    ): Promise<Collection.WithThrow<
        Throw,
        InvalidUsageError,
        Collection.SaveResult<QuotaManager.Document<Query>, undefined, true, Throw>>
    > {
        type Res = Collection.WithThrow<
            Throw,
            InvalidUsageError,
            Collection.SaveResult<QuotaManager.Document<Query>, undefined, true, Throw>
        >;

        // Validate the query.
        let query_err: string | undefined;
        if (this.query_validator && (query_err = this.query_validator(query)) != null) {
            const err = new InvalidUsageError({
                message: `Invalid query: ${query_err}`,
                reason: "invalid_query",
                field: "query",
            });
            if (opts?.throw ?? true) throw err;
            return err as Res;
        }

        // Save.
        const save_opts: Collection.SaveOpts<undefined, true, Throw, false> = {
            return: true,
            upsert: false,
            retry: 25,
            throw: opts?.throw,
            timeout: opts?.timeout,
        }
        return await this.collection.save(
            query,
            {
                $set: {
                    usage: 0,
                    start: Math.floor(Date.now() / 1000)
                },
            } as StrictUpdateFilter<QuotaManager.Document<Query>> as any,
            save_opts,
        );
    }

    // ----------------------------------------------------------------
    // Quota limiting.
    // ----------------------------------------------------------------

    /**
     * Validate the required {@link limit_helper} parameters.
     * @note requested_usage may be a negative number.
     */
    private validate_limit_helper_params({
        requested_usage,
        safety_ratio,
        query,
        upsert,
    }: {
        requested_usage: number,
        safety_ratio: undefined | number,
        query: Query,
        upsert: undefined | QuotaManager.Quota.Opts, 
    }): QuotaManager.LimitFailure<Query> | undefined {
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

        // Validate the query.
        let query_err: string | undefined;
        if (this.query_validator && (query_err = this.query_validator(query)) != null) {
            return {
                success: false,
                status: "invalid_usage",
                error: `Invalid query: ${query_err}`,
            };
        }

        // Validate upsertion.
        if (upsert) {
            const val_err = QuotaManager.Quota.Opts.validate(upsert);
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
     */
    async limit_helper({
        query,
        requested_usage,
        upsert,
        safety_ratio = 1,
        check_limit = true,
        perform_increment = true,
        collection,
    }: QuotaManager.LimitOpts<Query> & {
        /** Whether to enforce limit checks, defaults to `true`. */
        check_limit?: boolean;
        /** The database collection or transaction to use. */
        collection: Collection<QuotaManager.Document<Query>> | TransactionCollection<QuotaManager.Document<Query>>,
    }): Promise<QuotaManager.LimitFailure<Query> | QuotaManager.LimitSuccess<Query>> {

        const val_input_res = this.validate_limit_helper_params({
            requested_usage,
            safety_ratio,
            upsert,
            query,
        });
        if (val_input_res) return val_input_res;

        const now_sec = Math.floor(Date.now() / 1000);

        // ---------------------------
        // fast path (no reset needed)
        // ---------------------------

        if (check_limit) {
            if (perform_increment) {
                // enforce BOTH actual and safety-ratio checks, and prevent negative usage
                const result = await collection.save(
                    {
                        ...query,
                        $expr: {
                            $and: [
                                { $lt: [now_sec, { $add: ["$start", "$interval"] }] },
                                { $lte: [{ $add: ["$usage", requested_usage] }, "$max"] },
                                { $lte: [{ $add: ["$usage", requested_usage * safety_ratio] }, "$max"] },
                                { $gte: [{ $add: ["$usage", requested_usage] }, 0] },
                            ]
                        }
                    },
                    { $inc: { usage: requested_usage } } as StrictUpdateFilter<QuotaManager.Document<Type>> as any,
                    { return: true, upsert: false, retry: 25, throw: false }
                );
                if (!(result instanceof Error)) {
                    return {
                        success: true,
                        status: "success",
                        quota: result,
                        remaining: Math.max(0, result.max - result.usage),
                        was_reset: false,
                    };
                }
            } else {
                // check-only fast path: verify constraints without incrementing
                const result = await collection.load(
                    {
                        ...query,
                        $expr: {
                            $and: [
                                { $lt: [now_sec, { $add: ["$start", "$interval"] }] },
                                { $lte: [{ $add: ["$usage", requested_usage] }, "$max"] },
                                { $lte: [{ $add: ["$usage", requested_usage * safety_ratio] }, "$max"] },
                                { $gte: [{ $add: ["$usage", requested_usage] }, 0] },
                            ]
                        }
                    },
                    { retry: 25, throw: false }
                );
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
        } else {
            if (perform_increment) {
                // increment without limit checks; still prevent negative usage via atomic guard
                const result = await collection.save(
                    {
                        ...query,
                        $expr: {
                            $and: [
                                { $lt: [now_sec, { $add: ["$start", "$interval"] }] },
                                { $gte: [{ $add: ["$usage", requested_usage] }, 0] },
                            ]
                        }
                    },
                    { $inc: { usage: requested_usage } } as StrictUpdateFilter<QuotaManager.Document<Type>> as any,
                    { return: true, upsert: false, throw: false, retry: 25 }
                );

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

        let current = await collection.load(query, { retry: 25, throw: false });

        if (current instanceof Error) {

            // only treat NotFoundError as "document missing"; everything else is a system error
            if (!(current instanceof Collection.NotFoundError)) {
                SystemError.create_detach({
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
                        is_transaction: collection instanceof TransactionCollection,
                        original_error: (current as any)?.message ?? String(current),
                    },
                });
                return {
                    success: false,
                    status: "system_error",
                    error: `Encountered an unknown error while loading quota '${this.format_query(query)}'`,
                };
            }

            // not found
            if (!upsert) {
                return {
                    success: false,
                    status: "not_found",
                    error: `Quota not found '${this.format_query(query)}'`,
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
                const virtual_doc: QuotaManager.Document<Query> = {
                    ...query,
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
            const doc_record: QuotaManager.Document<Query> = {
                ...query,
                max: upsert.max,
                interval: upsert.interval,
                start: now_sec,
                usage: Math.max(0, requested_usage),
            };
            const created = await collection.set(
                query,
                doc_record,
                { return: true, upsert: true, throw: false, retry: 25 }
            );
            if (created instanceof Error) {
                SystemError.create_detach({
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
                        is_transaction: collection instanceof TransactionCollection,
                        original_error: (created as any)?.message ?? String(created),
                    },
                });
                return {
                    success: false,
                    status: "system_error",
                    error: `Failed to create quota '${this.format_query(query)}'`,
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
                const view_after_reset: QuotaManager.Document<Query> = { ...current, usage: 0, start: now_sec };
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
            const reset_result = await collection.save(
                {
                    ...query,
                    // optimistic lock against concurrent reset
                    start: current.start,
                },
                {
                    $set: {
                        usage: new_usage,
                        start: now_sec,
                    }
                } as StrictUpdateFilter<QuotaManager.Document<Query>> as any,
                { return: true, upsert: false, throw: false, retry: 25 }
            );

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
                const clamp_result = await collection.save(
                    {
                        ...query,
                        start: current.start, // optimistic lock in the same window
                    },
                    { $set: { usage: 0 } } as StrictUpdateFilter<QuotaManager.Document<Query>> as any,
                    { return: true, upsert: false, throw: false, retry: 25 }
                );
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
                    message: `Failed to clamp usage to zero for query '${this.format_query(query)}'.`,
                    details: {
                        query, requested_usage, upsert,
                        safety_ratio, check_limit, perform_increment,
                        is_transaction: collection instanceof TransactionCollection,
                    },
                });
                return {
                    success: false,
                    status: "system_error",
                    error: `Failed to clamp usage to zero for query '${this.format_query(query)}'.`,
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
            const inc_result = await collection.save(
                {
                    ...query,
                    start: current.start,
                    $expr: { $gte: [{ $add: ["$usage", requested_usage] }, 0] },
                } as StrictFilter<QuotaManager.Document<Query>>,
                { $inc: { usage: requested_usage } } as StrictUpdateFilter<QuotaManager.Document<Type>> as any,
                { return: true, upsert: false, throw: false, retry: 25 }
            );
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
                message: `Failed to update quota for query '${this.format_query(query)}'.`,
                details: {
                    query, requested_usage, upsert,
                    safety_ratio, check_limit, perform_increment,
                    is_transaction: collection instanceof TransactionCollection,
                },
            });
            return {
                success: false,
                status: "system_error",
                error: `Failed to update quota for query '${this.format_query(query)}'.`,
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
            const inc_result = await collection.save(
                {
                    ...query,
                    start: current.start,
                    $expr: { $gte: [{ $add: ["$usage", requested_usage] }, 0] },
                } as StrictFilter<QuotaManager.Document<Query>>,
                { $inc: { usage: requested_usage } } as StrictUpdateFilter<QuotaManager.Document<Query>> as any,
                { return: true, upsert: false, throw: false, retry: 25 }
            );
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
            const clamp_result = await collection.save(
                { ...query, start: current.start },
                { $set: { usage: 0 } } as StrictUpdateFilter<QuotaManager.Document<Query>> as any,
                { return: true, upsert: false, throw: false, retry: 25 }
            );
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
                message: `Failed to update quota for query '${this.format_query(query)}'.`,
                details: {
                    query, requested_usage, upsert,
                    safety_ratio, check_limit, perform_increment,
                    is_transaction: collection instanceof TransactionCollection,
                },
            });
            return {
                success: false,
                status: "system_error",
                error: `Failed to update quota for query '${this.format_query(query)}'.`,
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
     */
    async limit({
        query, requested_usage, upsert, safety_ratio, perform_increment = true
    }: QuotaManager.LimitOpts<Query> & {
        /** Whether to perform the increment, defaults to `true`. */
        perform_increment?: boolean,
    }): Promise<QuotaManager.LimitFailure<Query> | QuotaManager.LimitSuccess<Query>> {
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
     */
    async increment({
        query, requested_usage, upsert,
    }: Omit<QuotaManager.LimitOpts<Query>, "safety_ratio">): Promise<QuotaManager.LimitFailure<Query> | QuotaManager.LimitSuccess<Query>> {
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
     */
    async batch_limit({
        limits
    }: {
        limits: QuotaManager.BatchLimit<Query>[],
    }): Promise<QuotaManager.BatchLimitFailure<Query> | QuotaManager.BatchLimitSuccess<Query>> {

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
        const results: QuotaManager.LimitSuccess<Query>[] = [];
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
                    }
                }
                results.push(result);
            }
        } catch (error: any) {
            await transaction.abort();
            SystemError.create_detach({
                owner: "volt.QuotaManager",
                collection: this.system_error?.collection,
                logger: this.system_error?.logger,
                message: `Transaction failed: ${error && typeof error === "object" && error.message ? error.message : error}`,
                details: {
                    failed_query: active_limit.query,
                    is_transaction: true,
                },
            });
            return {
                success: false,
                status: "system_error",
                failed_query: active_limit.query,
                error: `Transaction failed: ${error && typeof error === "object" && error.message ? error.message : error}`,
            };
        }
        
        // Commit with error handling; abort on failure to preserve atomicity.
        try {
            await transaction.commit();
        } catch (error: unknown) {
            await transaction.abort();
            SystemError.create_detach({
                owner: "volt.QuotaManager",
                collection: this.system_error?.collection,
                logger: this.system_error?.logger,
                message: `Transaction commit failed: ${error && typeof error === "object" && error.message ? error.message : error}`,
                details: {
                    failed_query: active_limit.query,
                    is_transaction: true,
                },
            });
            return {
                success: false,
                status: "system_error",
                failed_query: active_limit.query,
                error: `Transaction commit failed: ${error && typeof error === "object" && error.message ? error.message : error}`,
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
export namespace QuotaManager {

    // ----------------------------------------------------------------
    // Constructor options.
    // ----------------------------------------------------------------

    /**
     * The constructor options of the {@link QuotaManager} class.
     */
    export interface Opts<Query extends QueryBase> {
        /**
         * The initialized server instance.
         */
        server: Server;
        /**
         * The options for initializing the database collection.
         * 
         * Ensure the {@link Collection.Opts.name} field is unique and only used for this quota manager.
         * Or it will cause undefined behaviour.
         */
        collection: Pick<
            Collection.Opts<QuotaManager.Document<Query>>,
            "name" | "ttl"
        >;
        /**
         * A validator for queries.
         * If provided each query will be validated by this validator.
         * Should return a `string` error message if validation fails,
         * otherwise `undefined`.
         * See {@link QueryValidator}.
         */
        query_validator?: QueryValidator<Query>;

        // /**
        //  * The the collection used for the quota records & database operations.
        //  * 
        //  * @warning
        //  * It is highly advised to use a different collection per {@link type}.
        //  * However, currently re-using the collection for different type's works as well.
        //  * But this may CHANGE in future versions, thus dont rely on this behaviour.
        //  * 
        //  * @warning
        //  * Do not assign a value to following collection constructor option fields,
        //  * or an {@link InvalidUsageError} will be thrown in the {@link QuotaManager} constructor:
        //  * - {@link Collection.Opts.record_version} (handled internally).
        //  * - {@link Collection.Opts.on_transform_version} (handled internally).
        //  * - {@link Collection.Opts.indexes} (handled internally).`
        //  * 
        //  * @warning
        //  * This collection must be passed before it is initialized by {@link Collection.init},
        //  * And the passed collection may not be transaction based.
        //  * Otherwise an {@link InvalidUsageError} will be thrown in the {@link QuotaManager} constructor.
        //  */
        // collection: Collection<QuotaManager.Document<Type>>;
        /**
         * Options for handling encountered system errors.
         * See {@link SystemError}.
         */
        system_error?: {
            /**
             * The collection used to save {@link SystemError}'s to.
             * Defaults to {@link SystemError.collection}.
             * 
             * @warning Ensure either {@link collection} or {@link SystemError.collection}
             *          is defined. Otherwise system errors are not saved to the database.
             */
            collection?: Collection<SystemError.Document>;
            /**
             * The logger to use for creating system {@link SystemError}'s.
             * Defaults to {@link SystemError.logger}.
             */
            logger?: SystemError.Logger;
        };
    }

    // ----------------------------------------------------------------
    // Queries.
    // ----------------------------------------------------------------

    /**
     * The base type for queries.
     * Simply an empty interface, the actual query should be defined by user in the `QuotaManager` `Query` generic.
     */
    // export type QueryBase = Omit<Record<string, any>, keyof Quota> & vlib.Types.Neverify<Record<string, any>, keyof Quota>;
    // export interface QueryBase extends vlib.Types.Neverify<Quota, keyof Quota> {
    //     [key: string]: any;
    // }
    export interface QueryBase {}

    /**
     * A callback to verify queries.
     * Should return a `string` error message if validation fails,
     * otherwise `undefined`.
     */
    export type QueryValidator<Query extends QueryBase> = (query: Query) => undefined | string;

    // ----------------------------------------------------------------
    // Quotas.
    // ----------------------------------------------------------------

    /**
     * Quota settings for managing costs.
     * This interface can serves as a quota group which can be configured for account-wide, project-wide etc quotas.
     * 
     * @dev_note Ensure this remains a FLAT interface, or update spread copies to deep copies.
     */
    export interface Quota {
        /**
         * The maximum amount of usage allowed.
         * Allowed: positive finite floating number (decimals supported).
         */
        max: number;
        /**
         * The time interval in SECONDS for the quota; when this interval has passed the usage will be reset.
         * Recommended to be an integer number of seconds.
         */
        interval: number;
        /**
         * The start timestamp in SECONDS of the quota interval period.
         * This value is always persisted as an INTEGER (seconds since epoch).
         */
        start: number;
        /**
         * The current amount of usage.
         * Allowed: finite floating number (decimals supported). Never persisted below 0.
         */
        usage: number;
    };


    /** Nested types for the {@link Quota} interface. */
    export namespace Quota {

        /** The OpenAIQuery input options (excluding the usage & start attribute) */
        export type Opts = Omit<Quota, "usage" | "start">;

        /** Nested types for the {@link Opts} interface. */
        export namespace Opts {

            /** The schema to validate quota {@link Opts} */
            export const Schema: vlib.Schema.Entries.Opts = {
                max: { type: "number", required: true },
                interval: { type: "number", required: true },
            };

            /**
             * Validate {@link Quota.Opts} at runtime.
             * @returns An error message if the quota is invalid, or undefined if it is valid.
             */
            export function validate(quota: Quota.Opts): string | undefined {
                // Validate quota fields
                if (quota.max <= 0 || !Number.isFinite(quota.max)) {
                    return `Invalid max value: ${quota.max}. Must be positive and finite.`;
                }
                if (quota.interval <= 0 || !Number.isFinite(quota.interval)) {
                    return `Invalid interval value: ${quota.interval}. Must be positive and finite.`;
                }
            }
        }

        /**
         * Convert `undefined` to `undefined` (no-op).
         */
        export function to_nano(q: undefined): undefined;
        /**
         * Convert a numeric amount to its nano-scale integer.
         */
        export function to_nano(q: number): number;
        /**
         * Convert quota options to nano-scale by scaling `max`; `interval` is preserved.
         */
        export function to_nano(q: Quota.Opts): Quota.Opts;
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
         */
        export function to_nano(q: undefined | number | Quota.Opts): undefined | number | Quota.Opts {
            if (!q) { return undefined; }
            else if (typeof q === "number") {
                return QuotaManager.to_scaled_amount(q, 1, 1_000_000_000)
            }
            return {
                max: QuotaManager.to_scaled_amount(q.max, 1, 1_000_000_000),
                interval: q.interval,
            };
        }
    }

    // ----------------------------------------------------------------
    // Document for the database.
    // ----------------------------------------------------------------

    /** The OpenAIQuery quota document. */
    export type Document<Query extends QueryBase> = Omit<Query, keyof Quota> & Quota;

    /** Nested types for the {@link Document} type. */
    export namespace Document {

        /** Input options for creating a {@link Document} record. */
        export type Opts<Query extends QueryBase> = Omit<Query, keyof Quota> & Quota.Opts;
    }

    // ----------------------------------------------------------------
    // Amount scale types (currency-/unit-neutral).
    // ----------------------------------------------------------------

    /**
     * The available amount scales for cost/usage values.
     * Either 1 (base unit) or 1e9 (nano unit).
     *
     * @example
     * - Currency: 1 = dollars/euros/etc, 1e9 = nano-units of that currency.
     * - Generic units: 1 = unit, 1e9 = nano-units.
     */
    export type AmountScale = AmountScale.Base | AmountScale.Nano;

    /** Nested types for the {@link AmountScale} type. */
    export namespace AmountScale {
        /**
         * Base scale (1). Represents whole units (e.g., dollars, tokens, units).
         */
        export type Base = 1;
        /** Base scale constant. */
        export const Base: Base = 1;

        /**
         * Nano scale (1e9). Represents smallest-unit integers (e.g., nano-units).
         */
        export type Nano = 1_000_000_000;
        /** Nano scale constant. */
        export const Nano: Nano = 1_000_000_000;
    }

    /**
     * Branded alias to document intent: value is a non-negative safe integer at nano scale.
     * This remains a number at runtime.
     */
    export type NanoInt = number;

    /**
     * Convert an amount between {@link AmountScale} values.
     *
     * Semantics:
     * - to_scale === 1                ➜ return a precision float (presentation).
     * - to_scale === 1_000_000_000    ➜ return a rounded safe integer (nano).
     * - Same-scale:
     *     • scale 1                   ➜ return value as-is (validated finite).
     *     • scale 1_000_000_000       ➜ require integer & safe integer.
     *
     * @param value       The numeric amount to convert.
     * @param from_scale  The current scale of {@link value}.
     * @param to_scale    The target scale.
     * @returns           The converted amount at the requested scale.
     * @throws            Error if input is invalid or conversion would overflow.
     */
    export function to_scaled_amount(value: number, from_scale: AmountScale, to_scale: AmountScale): number {
        if (!Number.isFinite(value)) {
            throw new Error(`Invalid 'value': ${value}`);
        }

        // Same-scale: validate without introducing rounding.
        if (from_scale === to_scale) {
            if (to_scale === AmountScale.Base) {
                return value; // allow presentation float
            }
            // to_scale === AmountScale.Nano
            if (!Number.isInteger(value) || !Number.isSafeInteger(value)) {
                throw new Error(`Expected safe integer at nano scale, got ${value}`);
            }
            return value;
        }

        // Cross-scale conversions
        if (to_scale === AmountScale.Nano) {
            // base -> nano: round to nearest and require safe integer
            const n = Math.round(value * AmountScale.Nano);
            if (!Number.isSafeInteger(n)) {
                throw new Error(`Overflow converting to nano scale from value=${value}`);
            }
            return n;
        }

        // to_scale === AmountScale.Base
        // nano -> base: require safe integer input, return float
        if (!Number.isInteger(value) || !Number.isSafeInteger(value)) {
            throw new Error(`Expected safe integer at nano scale when converting to base scale, got ${value}`);
        }
        return value / AmountScale.Nano;
    }

    /**
     * Assert that an amount is a non-negative safe integer in nano scale.
     *
     * @param label  A label for diagnostics.
     * @param value  The numeric value to validate.
     * @param prefix Optional string prepended to the error message.
     * @throws       Error if the value is not a non-negative safe integer.
     */
    export function assert_nano_int(label: string, value: number, prefix?: string): asserts value is NanoInt {
        if (!Number.isInteger(value) || !Number.isSafeInteger(value) || value < 0) {
            throw new Error(`${prefix ?? ""}Invalid ${label}: expected non-negative safe integer at nano scale, got ${value}`);
        }
    }

    /**
     * Multiply an integer quantity by a scaled integer price to obtain a scaled integer cost.
     * All arithmetic is integer-safe under IEEE-754 up to ~9e15.
     *
     * @param quantity     Non-negative safe integer count.
     * @param price_scaled Non-negative safe integer price in some integer scale (e.g., nano).
     * @returns            The product as a safe integer.
     * @throws             Error on invalid inputs or overflow.
     */
    export function mul_int_safe(quantity: number, price_scaled: number): number {
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

    /**
     * Rounding mode for integer division in critical accounting paths.
     */
    export type RoundingMode = "exact" | "floor" | "ceil" | "round";

    /**
     * Divide two non-negative safe integers with explicit rounding semantics.
     *
     * @param numerator   The non-negative safe integer dividend.
     * @param denominator The positive safe integer divisor.
     * @param mode        Rounding strategy (default: "exact").
     * @returns           Integer quotient under the selected mode.
     * @throws            Error on invalid inputs, division by zero,
     *                    non-exact remainder in "exact" mode, or overflow.
     */
    export function div_int_safe(
        numerator: number,
        denominator: number,
        mode: RoundingMode = "exact",
    ): number {
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
        const remainder = numerator - product;                 // 0 <= remainder < denominator

        if (mode === "exact") {
            if (remainder !== 0) {
                throw new Error(
                    `Non-exact division in 'div_int_safe()': ${numerator} / ${denominator} leaves remainder ${remainder}`,
                );
            }
            return quotient;
        }

        if (mode === "floor") {
            return quotient;
        }

        if (mode === "ceil") {
            return remainder === 0 ? quotient : (quotient + 1);
        }

        if (mode === "round") {
            // Round-half-up: add 1 if remainder/denominator >= 0.5
            // Compare 2*remainder vs denominator to avoid floating point.
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

        throw new Error(`Invalid 'mode' for div_int_safe(): ${mode as string}`);
    }


    /**
     * Safely add two integer values with overflow checking.
     *
     * @param a     The first operand; may be negative. Must be a safe integer.
     * @param b     The second operand; may be negative. Must be a safe integer.
     * @param label A descriptive label for error reporting.
     * @returns     The sum of `a` and `b` as a safe integer.
     * @throws      {Error} If either operand is not a safe integer, or if the sum would overflow.
     */
    export function add_int_safe(a: number, b: number, label: string): number {
        if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b)) {
            throw new Error(`Invalid operands for ${label}: expected safe integers, got a=${a}, b=${b}`);
        }
        const s = a + b;
        if (!Number.isSafeInteger(s)) {
            throw new Error(`Overflow adding ${label}: ${a} + ${b} = ${s}`);
        }
        return s;
    }

    // ----------------------------------------------------------------
    // Method types.
    // ----------------------------------------------------------------

    /** The listed quota from {@link QuotaManager.list}. */
    export interface ListedQuota<Query extends QueryBase> {
        /** The listed quota. */
        quota: QuotaManager.Document<Query>,
        /** The remaining usage left for this quota. */
        remaining: number,
        /** Percentage used for the quota. */
        percentage_used: number,
        /** Quota needs a reset, interval has expired. */
        needs_reset: boolean,
    }

    /** The returned type of {@link QuotaManager.get_status} */
    export type GetStatusResult<Query extends QueryBase> = 
        | { /** Indicates the quota was not found or an error occurred. */
            found: false;
            /** Diagnostic message. */
            error: string;
            /**
             * The error reason.
             * @note By default a {@link SystemError} is saved when the status is `system_error`.
             */
            reason: "invalid_query" | "not_found" | "system_error";
        }
        | {
            /** Indicates the quota was found. */
            found: true;
            /** The current quota (or a virtual reset view if the window expired). */
            quota: QuotaManager.Document<Query>;
            /** Remaining capacity in the active window (never negative). */
            remaining: number;
            /** Percentage of the window used, clamped to [0, 100]. */
            percentage_used: number;
            /** Whether the interval needs a reset (i.e., has expired). */
            needs_reset: boolean;
            /** Seconds until reset (0 when the window already expired). */
            time_until_reset: number;
        }

    /** The parameter options for {@link limit} and {@link increment} */
    export interface LimitOpts<Query extends QueryBase> {
        /** The quota identifier arguments. */
        query: Query,
        /** The amount of usage to increment, this may be a negative amount, must it must be a finite number. */
        requested_usage: number,
        /** The quota document to create if it doesn't exist, if left undefined, the quota document must exist in the collection, or the validation will fail. */
        upsert?: Quota.Opts, // use Quota.Opts instead of Document.Opts so we can derive the query attrs from `query`.
        /**
         * The usage validation safety ratio, used to prevent over-usage, defaults to `1.0`.
         * 
         * The validation will be applied as:
         * `would_exceeded = (requested_usage * safety_ratio) + current.usage > current.max`
         * 
         * The incrementation caused by the safety ratio is not saved to the database.
         */
        safety_ratio?: number,
        /** Whether to perform the increment, defaults to `true`. */
        perform_increment?: boolean,
    }

    /** The non allowed response of {@link limit}. */
    export interface LimitFailure<Query extends QueryBase> {
        /** Validation success indicator. */
        success: false;
        /**
         * The limit failure status.
         * @note By default a {@link SystemError} is saved when the status is `system_error`.
         */
        status: "not_found" | "exceeded" | "would_exceed" | "invalid_usage" | "system_error";
        /** The error message. */
        error: string;
        /** The quota document, if available. */
        quota?: QuotaManager.Document<Query>;
        /** The remaining quota usage. */
        remaining?: number;
    }

    /** The allowed response of {@link limit}. */
    export interface LimitSuccess<Query extends QueryBase> {
        /** Validation success indicator. */
        success: true;
        /** The operation status, kept for consistency. */
        status: "success";
        /** The returned quota document. */
        quota: QuotaManager.Document<Query>;
        /** The remaining quota usage. */
        remaining: number;
        /** Whether the quota was reset. */
        was_reset: boolean;
    }

    /**
     * The batch limit query and requested usage for {@link batch_limit}.
     */
    export interface BatchLimit<Query extends QueryBase> {
        /** The query identifying the quota */
        query: Query;
        /** The requested usage amount */
        requested_usage: number;
        /**
         * The usage validation safety ratio, used to prevent over-usage, defaults to `1.0`.
         * 
         * The validation will be applied as:
         * `would_exceeded = (requested_usage * safety_ratio) + current.usage > current.max`
         * 
         * The incrementation caused by the safety ratio is not saved to the database.
         */
        safety_ratio?: number,
        /**
         * The quota document to create if it doesn't exist, if left undefined, the quota document must exist in the collection, or the validation will fail.
         * @dev_note We use `Quota.Opts` instead of `Document.Opts` so we can derive the query attrs from field `query`
         */
        upsert?: Quota.Opts,
        /** Whether to enforce limit checks, defaults to `true`. */
        check_limit?: boolean;
        /** Whether to perform the increment, defaults to `true`. */
        perform_increment?: boolean,
    }

    /** The batch limit failure response. */
    export interface BatchLimitFailure<Query extends QueryBase> extends LimitFailure<Query> {
        /** The failed query identifying the quota */
        failed_query: Query;
    }

    /** The batch limit success response. */
    export interface BatchLimitSuccess<Query extends QueryBase> {
        /** Validation success indicator. */
        success: true;
        /** The operation status, kept for consistency. */
        status: "success";
        /** The individual results for each quota. */
        results: LimitSuccess<Query>[];
    }
}