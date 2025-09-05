/**
 * @author Daan van den Bergh
 * @copyright © 2025 - 2025 Daan van den Bergh. All rights reserved.
 */
import * as vlib from "@vandenberghinc/vlib";
import { SystemError } from "../../errors/system_error.js";
import { Collection, TransactionCollection } from "../collection.js";
import type { Server } from "../../server.js";
import { InvalidUsageError } from "../../errors/index.js";
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
export declare class QuotaManager {
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
    constructor(opts: QuotaManager.Opts);
    /**
     * Helper to create consistent query objects for MongoDB.
     */
    private create_db_query;
    /**
     * Format a compact, human-readable quota identifier for logs and error messages.
     *
     * @param query An object carrying the `uid` and `id` fields.
     * @returns A stable identifier of the form `<uid>:<id>`.
     */
    private format_quota_id;
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
    get<Default extends Collection.LoadOpts.Default<QuotaManager.Document> = undefined, Projection extends Collection.LoadOpts.Projection = undefined, Throw extends Collection.LoadOpts.Throw = undefined>(query: QuotaManager.Query, opts?: Collection.LoadOpts<QuotaManager.Document, Default, Projection, Throw>): Promise<Collection.WithThrow<Throw, InvalidUsageError, Collection.LoadResult<QuotaManager.Document, Default, Projection, Throw>>>;
    /**
     * Get current quota status without modifying it.
     *
     * @param query The quota identifier arguments.
     * @param opts Additional load options, see {@link Collection.LoadOpts}.
     *
     * @returns An object containing error or status information,
     *          see {@link QuotaManager.GetStatusResult}
     */
    get_status(query: QuotaManager.Query, opts?: Pick<Collection.LoadOpts, "timeout">): Promise<QuotaManager.GetStatusResult>;
    /**
     * List all quotas for a user, optionally filtered by type.
     *
     * @param uid The user identifier.
     * @param type Optional quota type filter.
     * @returns List of quotas with their current status.
     */
    list({ uid, timeout, }: {
        /** The user id of the quotas to list. */
        uid: string;
        /** Per-operation timeout in milliseconds, mapped to `maxTimeoutMS`. */
        timeout?: number;
    }): Promise<QuotaManager.ListedQuota[]>;
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
    set<Throw extends Collection.SaveOpts.Throw = true>(quota: QuotaManager.Document.Opts & {
        usage?: never;
        start?: never;
    }, opts?: Pick<Collection.SaveOpts<undefined, true, Throw, true>, "throw" | "timeout">): Promise<Collection.WithThrow<Throw, InvalidUsageError, Collection.SaveResult<QuotaManager.Document, undefined, true, Throw>>>;
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
    reset_usage<Throw extends Collection.SaveOpts.Throw = undefined>(query: QuotaManager.Query, opts?: Pick<Collection.SaveOpts<undefined, true, Throw, false>, "throw" | "timeout">): Promise<Collection.WithThrow<Throw, InvalidUsageError, Collection.SaveResult<QuotaManager.Document, undefined, true, Throw>>>;
    /**
     * Validate the required {@link limit_helper} parameters.
     * @note requested_usage may be a negative number.
     */
    private validate_limit_helper_params;
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
    limit_helper({ query, requested_usage, upsert, safety_ratio, check_limit, perform_increment, collection, }: QuotaManager.LimitOpts & {
        /** Whether to enforce limit checks, defaults to `true`. */
        check_limit?: boolean;
        /** The database collection or transaction to use. */
        collection: Collection<QuotaManager.Document> | TransactionCollection<QuotaManager.Document>;
    }): Promise<QuotaManager.LimitFailure | QuotaManager.LimitSuccess>;
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
    limit({ query, requested_usage, upsert, safety_ratio, perform_increment }: QuotaManager.LimitOpts & {
        /** Whether to perform the increment, defaults to `true`. */
        perform_increment?: boolean;
    }): Promise<QuotaManager.LimitFailure | QuotaManager.LimitSuccess>;
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
    increment({ query, requested_usage, upsert, }: Omit<QuotaManager.LimitOpts, "safety_ratio">): Promise<QuotaManager.LimitFailure | QuotaManager.LimitSuccess>;
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
    batch_limit({ limits }: {
        limits: QuotaManager.BatchLimit[];
    }): Promise<QuotaManager.BatchLimitFailure | QuotaManager.BatchLimitSuccess>;
}
/**
 * The quota manager module.
 * This manager can be used to manage and enforce usage quotas for different resources,
 * for instance limiting money spent on tokens, or for rate limiting purposes.
 *
 * For managing monetary quotas, it is advised to use a nano-scale amount system
 * (smallest unit integer accounting). See {@link Quota.to_nano} for converting to nano scale.
 */
export declare namespace QuotaManager {
    /**
     * The constructor options of the {@link QuotaManager} class.
     */
    interface Opts {
        /** The parent server instance, used to create the database collection. */
        server: Server;
        /**s
         * The options for initialized the collection.
         * @warning
         * Ensure the chosen collection name is unique for this quota manager when using multiple quota managers.
         * Since there is only a single configurable `id` index field per quota.
         * Therefore using multiple purpose specific quota managers is required.
         */
        collection: Pick<Collection.Opts<QuotaManager.Document>, "ttl" | "name">;
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
    /**
     * The interface for a quota search query.
     *
     * @dev_note Ensure this remains a FLAT interface, or update spread copies to deep copies.
     */
    interface Query {
        /** The user id (index attribute). */
        uid: string;
        /** The quota id, e.g. "my-project" (index attribute). */
        id: string;
    }
    /** Nested types for the {@link QuotaManager.Query} type. */
    namespace Query {
        /**
         * Validate {@link QuotaManager.Query} at runtime.
         * @returns An error message if the query is invalid, or undefined if it is valid.
         */
        function validate(query: Query): string | undefined;
    }
    /**
     * Quota settings for managing costs.
     * This interface can serves as a quota group which can be configured for account-wide, project-wide etc quotas.
     *
     * @dev_note Ensure this remains a FLAT interface, or update spread copies to deep copies.
     */
    interface Quota {
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
    }
    /** Nested types for the {@link Quota} interface. */
    namespace Quota {
        /** The OpenAIQuery input options (excluding the usage & start attribute) */
        type Opts = Omit<Quota, "usage" | "start">;
        /** Nested types for the {@link Opts} interface. */
        namespace Opts {
            /** The schema to validate quota {@link Opts} */
            const Schema: vlib.Schema.Entries.Opts;
            /**
             * Validate {@link Quota.Opts} at runtime.
             * @returns An error message if the quota is invalid, or undefined if it is valid.
             */
            function validate(quota: Quota.Opts): string | undefined;
        }
        /**
         * Convert `null | undefined` to `undefined` (no-op).
         */
        function to_nano(q: null | undefined): undefined;
        /**
         * Convert a numeric amount to its nano-scale integer.
         */
        function to_nano(q: number): number;
        /**
         * Convert quota options to nano-scale by scaling `max`; `interval` is preserved.
         */
        function to_nano(q: Quota.Opts): Quota.Opts;
    }
    /** The OpenAIQuery quota document. */
    type Document = Quota & Query;
    /** Nested types for the {@link Document} type. */
    namespace Document {
        /** Input options for creating a {@link Document} record. */
        type Opts = Quota.Opts & Query;
        /** Nested types for the {@link Document.Opts} type. */
        namespace Opts {
            /**
             * Validate {@link Document.Opts} at runtime.
             * @returns An error message if the quota is invalid, or undefined if it is valid.
             */
            function validate(quota: QuotaManager.Document.Opts): string | undefined;
        }
    }
    /** The listed quota from {@link QuotaManager.list}. */
    interface ListedQuota {
        /** The listed quota. */
        quota: QuotaManager.Document;
        /** The remaining usage left for this quota. */
        remaining: number;
        /** Percentage used for the quota. */
        percentage_used: number;
        /** Quota needs a reset, interval has expired. */
        needs_reset: boolean;
    }
    /** The returned type of {@link QuotaManager.get_status} */
    type GetStatusResult = {
        found: false;
        /** Diagnostic message. */
        error: string;
        /**
         * The error reason.
         * @note By default a {@link SystemError} is saved when the status is `system_error`.
         */
        reason: "invalid_query" | "not_found" | "system_error";
    } | {
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
    };
    /** The parameter options for {@link limit} and {@link increment} */
    interface LimitOpts {
        /** The quota identifier arguments. */
        query: Query;
        /** The amount of usage to increment, this may be a negative amount, must it must be a finite number. */
        requested_usage: number;
        /** The quota document to create if it doesn't exist, if left undefined, the quota document must exist in the collection, or the validation will fail. */
        upsert?: Quota.Opts;
        /**
         * The usage validation safety ratio, used to prevent over-usage, defaults to `1.0`.
         *
         * The validation will be applied as:
         * `would_exceeded = (requested_usage * safety_ratio) + current.usage > current.max`
         *
         * The incrementation caused by the safety ratio is not saved to the database.
         */
        safety_ratio?: number;
        /** Whether to perform the increment, defaults to `true`. */
        perform_increment?: boolean;
    }
    /** The non allowed response of {@link limit}. */
    interface LimitFailure {
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
    interface LimitSuccess {
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
    interface BatchLimit {
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
        safety_ratio?: number;
        /**
         * The quota document to create if it doesn't exist, if left undefined, the quota document must exist in the collection, or the validation will fail.
         * @dev_note We use `Quota.Opts` instead of `Document.Opts` so we can derive the query attrs from field `query`
         */
        upsert?: Quota.Opts;
        /** Whether to enforce limit checks, defaults to `true`. */
        check_limit?: boolean;
        /** Whether to perform the increment, defaults to `true`. */
        perform_increment?: boolean;
    }
    /** The batch limit failure response. */
    interface BatchLimitFailure extends LimitFailure {
        /** The failed query identifying the quota */
        failed_query: Query;
    }
    /** The batch limit success response. */
    interface BatchLimitSuccess {
        /** Validation success indicator. */
        success: true;
        /** The operation status, kept for consistency. */
        status: "success";
        /** The individual results for each quota. */
        results: LimitSuccess[];
    }
}
