/**
 * @author Daan van den Bergh
 * @copyright © 2025 - 2025 Daan van den Bergh. All rights reserved.
 */

// External imports.
import * as vlib from "@vandenberghinc/vlib";

// Imports.
import { SystemError } from "../../errors/system_error.js";
import { Collection, TransactionCollection } from "../collection.js";
import type { StrictFilter } from "../filters/strict_filter.js";
import type { Server } from "../../server.js"
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
 */
export class QuotaManager {

    // ----------------------------------------------------------------
    // Attributes
    // ----------------------------------------------------------------

    /** The collection for database operations. */
    collection: Collection<QuotaManager.Document>;

    /** The system error options. */
    system_error: QuotaManager.Opts["system_error"];

    /**
     * Construct a new quota manager with a specific quota type.
     * 
     * @throws {InvalidUsageError} If {@link QuotaManager.Opts.collection} is already initialized and does not have the correct index.
     *                             If the passed collection has manually assigned fields for {@link Collection.record_version} or {@link Collection.on_transform_version}.
     *                             If the passed collection is transaction based.
     */
    constructor(opts: QuotaManager.Opts) {

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
        })
        this.system_error = opts.system_error;
    }


    // ----------------------------------------------------------------
    // Private utility methods.
    // ----------------------------------------------------------------

    /**
     * Helper to create consistent query objects for MongoDB.
     */
    private create_db_query(query: StrictFilter<QuotaManager.Query>) {
        return { uid: query.uid, id: query.id };
    }

    /**
     * Format a compact, human-readable quota identifier for logs and error messages.
     *
     * @param query An object carrying the `uid` and `id` fields.
     * @returns A stable identifier of the form `<uid>:<id>`.
     */
    private format_quota_id(query: QuotaManager.Query): string {
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
     */
    async get<
        Default extends Collection.LoadOpts.Default<QuotaManager.Document> = undefined,
        Projection extends Collection.LoadOpts.Projection = undefined,
        Throw extends Collection.LoadOpts.Throw = undefined,
    >(
        query: QuotaManager.Query,
        opts?: Collection.LoadOpts<QuotaManager.Document, Default, Projection, Throw>
    ): Promise<Collection.WithThrow<
        Throw,
        InvalidUsageError,
        Collection.LoadResult<QuotaManager.Document, Default, Projection, Throw>>
    > {
        type Res = Collection.WithThrow<
            Throw,
            InvalidUsageError,
            Collection.LoadResult<QuotaManager.Document, Default, Projection, Throw>
        >;

        // Validate quota identity + config
        const val_err = QuotaManager.Query.validate(query);
        if (val_err) {
            const err = new InvalidUsageError({
                message: `Invalid quota: ${val_err}`,
                reason: "invalid_quota",
                field: "quota",
            });
            if (opts?.throw ?? true) throw err;
            return err as Res;
        }

        // Load.
        if (opts) {
            opts = { retry: 25, ...opts };
            return this.collection.load(this.create_db_query(query), opts);
        } else {
            return this.collection.load<Default, Projection, Throw>(
                this.create_db_query(query),
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
        query: QuotaManager.Query,
        opts?: Pick<Collection.LoadOpts, "timeout">,
    ): Promise<QuotaManager.GetStatusResult> {
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
                    original_error: (loaded_quota as any)?.message ?? String(loaded_quota),
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
     */
    async list({
        uid,
        timeout,
    }: {
        /** The user id of the quotas to list. */
        uid: string,
        /** Per-operation timeout in milliseconds, mapped to `maxTimeoutMS`. */
        timeout?: number
    }): Promise<QuotaManager.ListedQuota[]> {
        const now_sec = Math.floor(Date.now() / 1000);
        const listed: QuotaManager.ListedQuota[] = [];

        await this.collection.list({ uid }, {
            timeout,
            retry: 5,
            callback: (q: QuotaManager.Document): void => {
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
        quota: QuotaManager.Document.Opts & { usage?: never; start?: never },
        opts?: Pick<
            Collection.SaveOpts<undefined, true, Throw, true>,
            "throw" | "timeout"
        >
    ): Promise<Collection.WithThrow<
        Throw,
        InvalidUsageError,
        Collection.SaveResult<QuotaManager.Document, undefined, true, Throw>
    >> {
        type Res = Collection.WithThrow<
            Throw,
            InvalidUsageError,
            Collection.SaveResult<QuotaManager.Document, undefined, true, Throw>
        >;

        // Validate quota identity + config
        const val_err = QuotaManager.Document.Opts.validate(quota, this.collection);
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
            this.create_db_query(quota),
            {
                $set: {
                    max: quota.max,
                    interval: quota.interval,
                },
                $setOnInsert: {
                    usage: 0,
                    start: now_sec,
                },
            },
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
        query: QuotaManager.Query,
        opts?: Pick<
            Collection.SaveOpts<undefined, true, Throw, false>, 
            "throw" | "timeout"
        >
    ): Promise<Collection.WithThrow<
        Throw,
        InvalidUsageError,
        Collection.SaveResult<QuotaManager.Document, undefined, true, Throw>>
    > {
        type Res = Collection.WithThrow<
            Throw,
            InvalidUsageError,
            Collection.SaveResult<QuotaManager.Document, undefined, true, Throw>
        >;

        // Check.
        const query_err = QuotaManager.Query.validate(query);
        if (query_err) {
            const err = new InvalidUsageError({
                message: `Invalid quota query: ${query_err}`,
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
            this.create_db_query(query),
            {
                $set: {
                    usage: 0,
                    start: Math.floor(Date.now() / 1000)
                },
            },
            save_opts,
        );
    }

    /** Delete all quotas for a user. */
    async delete_by_user({ uid }: { uid: string }): Promise<void> {
        await this.collection.delete_many({ uid }, { retry: 25 });
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
        query: QuotaManager.Query,
        upsert: undefined | QuotaManager.Quota.Opts, 
    }): QuotaManager.LimitFailure | undefined {
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
            const record: QuotaManager.Document.Opts = {
                ...upsert,
                ...query,
            }
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
     */
    async limit_helper({
        query,
        requested_usage,
        upsert,
        safety_ratio = 1,
        check_limit = true,
        perform_increment = true,
        collection,
    }: QuotaManager.LimitOpts & {
        /** Whether to enforce limit checks, defaults to `true`. */
        check_limit?: boolean;
        /** The database collection or transaction to use. */
        collection: Collection<QuotaManager.Document> | TransactionCollection<QuotaManager.Document>,
    }): Promise<QuotaManager.LimitFailure | QuotaManager.LimitSuccess> {

        const val_input_res = this.validate_limit_helper_params({
            requested_usage,
            safety_ratio,
            upsert,
            query,
        });
        if (val_input_res) return val_input_res;

        const now_sec = Math.floor(Date.now() / 1000);
        const db_query = this.create_db_query(query);

        // ---------------------------
        // fast path (no reset needed)
        // ---------------------------

        if (check_limit) {
            if (perform_increment) {
                // enforce BOTH actual and safety-ratio checks, and prevent negative usage
                const result = await collection.save(
                    {
                        ...db_query,
                        $expr: {
                            $and: [
                                { $lt: [now_sec, { $add: ["$start", "$interval"] }] },
                                { $lte: [{ $add: ["$usage", requested_usage] }, "$max"] },
                                { $lte: [{ $add: ["$usage", requested_usage * safety_ratio] }, "$max"] },
                                { $gte: [{ $add: ["$usage", requested_usage] }, 0] },
                            ]
                        }
                    },
                    { $inc: { usage: requested_usage } },
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
                        ...db_query,
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
                        ...db_query,
                        $expr: {
                            $and: [
                                { $lt: [now_sec, { $add: ["$start", "$interval"] }] },
                                { $gte: [{ $add: ["$usage", requested_usage] }, 0] },
                            ]
                        }
                    },
                    { $inc: { usage: requested_usage } },
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
                        original_error: (current as any)?.message ?? String(current),
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
                const virtual_doc: QuotaManager.Document = {
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
            const doc_record: QuotaManager.Document = {
                uid: query.uid,
                id: query.id,
                max: upsert.max,
                interval: upsert.interval,
                start: now_sec,
                usage: Math.max(0, requested_usage),
            };
            const created = await collection.set(
                db_query,
                doc_record,
                { return: true, upsert: true, throw: false, retry: 25 }
            );
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
                        original_error: (created as any)?.message ?? String(created),
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
                const view_after_reset: QuotaManager.Document = { ...current, usage: 0, start: now_sec };
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
                    ...db_query,
                    // optimistic lock against concurrent reset
                    start: current.start,
                },
                {
                    $set: {
                        usage: new_usage,
                        start: now_sec,
                    }
                },
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
                        ...db_query,
                        start: current.start, // optimistic lock in the same window
                    },
                    { $set: { usage: 0 } },
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
            const inc_result = await collection.save(
                {
                    ...db_query,
                    start: current.start,
                    $expr: { $gte: [{ $add: ["$usage", requested_usage] }, 0] },
                },
                { $inc: { usage: requested_usage } },
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
            const inc_result = await collection.save(
                {
                    ...db_query,
                    start: current.start,
                    $expr: { $gte: [{ $add: ["$usage", requested_usage] }, 0] },
                },
                { $inc: { usage: requested_usage } },
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
                { ...db_query, start: current.start },
                { $set: { usage: 0 } },
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
     */
    async limit({
        query, requested_usage, upsert, safety_ratio, perform_increment = true
    }: QuotaManager.LimitOpts & {
        /** Whether to perform the increment, defaults to `true`. */
        perform_increment?: boolean,
    }): Promise<QuotaManager.LimitFailure | QuotaManager.LimitSuccess> {
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
    }: Omit<QuotaManager.LimitOpts, "safety_ratio">): Promise<QuotaManager.LimitFailure | QuotaManager.LimitSuccess> {
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
        limits: QuotaManager.BatchLimit[],
    }): Promise<QuotaManager.BatchLimitFailure | QuotaManager.BatchLimitSuccess> {

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
        const results: QuotaManager.LimitSuccess[] = [];
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
        } catch (error: unknown) {
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
        } catch (error: unknown) {
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
export namespace QuotaManager {

    // ----------------------------------------------------------------
    // Constructor options.
    // ----------------------------------------------------------------

    /**
     * The constructor options of the {@link QuotaManager} class.
     */
    export interface Opts {
        /** The parent server instance, used to create the database collection. */
        server: Server;
        /**s
         * The options for initialized the collection.
         * @warning
         * Ensure the chosen collection name is unique for this quota manager when using multiple quota managers.
         * Since there is only a single configurable `id` index field per quota.
         * Therefore using multiple purpose specific quota managers is required.
         * @warning
         * The {@link Quota.interval} may not exceed the `ttl` duration, if passed.
         */
        collection: Pick<
            Collection.Opts<QuotaManager.Document>,
            "ttl" | "name"
        >;
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
    // Queries, quotas and documents.
    // ----------------------------------------------------------------

    /**
     * The interface for a quota search query.
     * 
     * @dev_note Ensure this remains a FLAT interface, or update spread copies to deep copies.
     */
    export interface Query {
        /** The user id (index attribute). */
        uid: string;
        /** The quota id, e.g. "my-project" (index attribute). */
        id: string;
    }

    /** Nested types for the {@link QuotaManager.Query} type. */
    export namespace Query {

        /**
         * Validate {@link QuotaManager.Query} at runtime.
         * @returns An error message if the query is invalid, or undefined if it is valid.
         */
        export function validate(query: Query): string | undefined {
            // Validate query.
            if (!query.uid?.trim()) {
                return "Invalid uid: must be a non-empty string.";
            }
            if (!query.id?.trim()) {
                return "Invalid id: must be a non-empty string.";
            }
        }
    }

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
         * @note This may not exceed the collections `ttl` duration, if set.
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
            export function validate(quota: Quota.Opts, collection: Collection<QuotaManager.Document>): string | undefined {
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
        }

        /**
         * Convert `null | undefined` to `undefined` (no-op).
         */
        export function to_nano(q: null | undefined): undefined;
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
        export function to_nano(q: null | undefined | number | Quota.Opts): undefined | number | Quota.Opts {
            if (q == null) return undefined
            else if (typeof q === "number") {
                return new SafeInt(q, { from_scale: 1, to_scale: SafeInt.Scale.Nano }).value()
            }
            return {
                max: new SafeInt(q.max, { from_scale: 1, to_scale: SafeInt.Scale.Nano }).value(),
                interval: q.interval,
            };
        }
    }

    /** The OpenAIQuery quota document. */
    export type Document = Quota & Query;

    /** Nested types for the {@link Document} type. */
    export namespace Document {

        /** Input options for creating a {@link Document} record. */
        export type Opts = Quota.Opts & Query;

        /** Nested types for the {@link Document.Opts} type. */
        export namespace Opts {

            /**
             * Validate {@link Document.Opts} at runtime.
             * @returns An error message if the quota is invalid, or undefined if it is valid.
             */
            export function validate(quota: QuotaManager.Document.Opts, collection: Collection<QuotaManager.Document>): string | undefined {
                let e: string | undefined;
                if ((e = Query.validate(quota))) return e;
                if ((e = Quota.Opts.validate(quota, collection))) return e;
            }

        }
    }

    // ----------------------------------------------------------------
    // Method types.
    // ----------------------------------------------------------------

    /** The listed quota from {@link QuotaManager.list}. */
    export interface ListedQuota {
        /** The listed quota. */
        quota: QuotaManager.Document,
        /** The remaining usage left for this quota. */
        remaining: number,
        /** Percentage used for the quota. */
        percentage_used: number,
        /** Quota needs a reset, interval has expired. */
        needs_reset: boolean,
    }

    /** The returned type of {@link QuotaManager.get_status} */
    export type GetStatusResult = 
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
            quota: QuotaManager.Document;
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
    export interface LimitOpts {
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
    export interface LimitFailure {
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
        quota?: QuotaManager.Document;
        /** The remaining quota usage. */
        remaining?: number;
    }

    /** The allowed response of {@link limit}. */
    export interface LimitSuccess {
        /** Validation success indicator. */
        success: true;
        /** The operation status, kept for consistency. */
        status: "success";
        /** The returned quota document. */
        quota: QuotaManager.Document;
        /** The remaining quota usage. */
        remaining: number;
        /** Whether the quota was reset. */
        was_reset: boolean;
    }

    /**
     * The batch limit query and requested usage for {@link batch_limit}.
     */
    export interface BatchLimit {
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
    export interface BatchLimitFailure extends LimitFailure {
        /** The failed query identifying the quota */
        failed_query: Query;
    }

    /** The batch limit success response. */
    export interface BatchLimitSuccess {
        /** Validation success indicator. */
        success: true;
        /** The operation status, kept for consistency. */
        status: "success";
        /** The individual results for each quota. */
        results: LimitSuccess[];
    }
}