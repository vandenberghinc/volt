/**
 * @author Daan van den Bergh
 * @copyright © 2025 - 2025 Daan van den Bergh. All rights reserved.
 */
import * as vlib from "@vandenberghinc/vlib";
import { SystemError } from "../errors/system_error.js";
import { Collection, TransactionCollection } from "./collection.js";
import { InvalidUsageError } from "src/volt.js";
import { Server } from "../server.js";
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
export declare class QuotaManager<Query extends QuotaManager.QueryBase> {
    /** The initialized database collection used by this quota manager. */
    collection: Collection<QuotaManager.Document<Query>>;
    /**
     * A validator for queries.
     * If provided each query will be validated by this validator.
     * Should return an object with an optional error when occurred.
     */
    query_validator: undefined | QuotaManager.QueryValidator<Query>;
    /** The system error options. */
    system_error: QuotaManager.Opts<Query>["system_error"];
    /**
     * Construct a new quota manager with a specific quota type.
     */
    constructor(opts: QuotaManager.Opts<Query>);
    /**
     * Format a compact, human-readable query for logs and error messages.
     *
     * @param query An object carrying the `type` and `name` fields.
     *
     * @returns A stable query of the form `<key1>:<value1>_<key2>:<value2>`.
     */
    private format_query;
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
    get<Default extends Collection.LoadOpts.Default<QuotaManager.Document<Query>> = undefined, Projection extends Collection.LoadOpts.Projection = undefined, Throw extends Collection.LoadOpts.Throw = undefined>(query: Query, opts?: Collection.LoadOpts<QuotaManager.Document<Query>, Default, Projection, Throw>): Promise<Collection.WithThrow<Throw, InvalidUsageError, Collection.LoadResult<QuotaManager.Document<Query>, Default, Projection, Throw>>>;
    /**
     * Get current quota status without modifying it.
     *
     * @param query The quota identifier arguments.
     * @param opts Additional load options, see {@link Collection.LoadOpts}.
     *
     * @returns An object containing error or status information,
     *          see {@link QuotaManager.GetStatusResult}
     */
    get_status(query: Query, opts?: Pick<Collection.LoadOpts, "timeout">): Promise<QuotaManager.GetStatusResult<Query>>;
    /**
     * List all quotas for a user, optionally filtered by type.
     *
     * @param query The partial query to list quotas by.
     * @param type Optional quota type filter.
     * @returns List of quotas with their current status.
     */
    list({ query, timeout, }: {
        /** The query of documents to list. */
        query: Partial<Query>;
        /** Per-operation timeout in milliseconds, mapped to `maxTimeoutMS`. */
        timeout?: number;
    }): Promise<QuotaManager.ListedQuota<Query>[]>;
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
    set<Throw extends Collection.SaveOpts.Throw = true>(query: Query, quota: QuotaManager.Document.Opts<Query> & {
        usage?: never;
        start?: never;
    }, opts?: Pick<Collection.SaveOpts<undefined, true, Throw, true>, "throw" | "timeout">): Promise<Collection.WithThrow<Throw, InvalidUsageError, Collection.SaveResult<QuotaManager.Document<Query>, undefined, true, Throw>>>;
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
    reset_usage<Throw extends Collection.SaveOpts.Throw = undefined>(query: Query, opts?: Pick<Collection.SaveOpts<undefined, true, Throw, false>, "throw" | "timeout">): Promise<Collection.WithThrow<Throw, InvalidUsageError, Collection.SaveResult<QuotaManager.Document<Query>, undefined, true, Throw>>>;
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
    limit_helper({ query, requested_usage, upsert, safety_ratio, check_limit, perform_increment, collection, }: QuotaManager.LimitOpts<Query> & {
        /** Whether to enforce limit checks, defaults to `true`. */
        check_limit?: boolean;
        /** The database collection or transaction to use. */
        collection: Collection<QuotaManager.Document<Query>> | TransactionCollection<QuotaManager.Document<Query>>;
    }): Promise<QuotaManager.LimitFailure<Query> | QuotaManager.LimitSuccess<Query>>;
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
    limit({ query, requested_usage, upsert, safety_ratio, perform_increment }: QuotaManager.LimitOpts<Query> & {
        /** Whether to perform the increment, defaults to `true`. */
        perform_increment?: boolean;
    }): Promise<QuotaManager.LimitFailure<Query> | QuotaManager.LimitSuccess<Query>>;
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
    increment({ query, requested_usage, upsert, }: Omit<QuotaManager.LimitOpts<Query>, "safety_ratio">): Promise<QuotaManager.LimitFailure<Query> | QuotaManager.LimitSuccess<Query>>;
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
        limits: QuotaManager.BatchLimit<Query>[];
    }): Promise<QuotaManager.BatchLimitFailure<Query> | QuotaManager.BatchLimitSuccess<Query>>;
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
    interface Opts<Query extends QueryBase> {
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
        collection: Pick<Collection.Opts<QuotaManager.Document<Query>>, "name" | "ttl">;
        /**
         * A validator for queries.
         * If provided each query will be validated by this validator.
         * Should return a `string` error message if validation fails,
         * otherwise `undefined`.
         * See {@link QueryValidator}.
         */
        query_validator?: QueryValidator<Query>;
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
     * The base type for queries.
     * Simply an empty interface, the actual query should be defined by user in the `QuotaManager` `Query` generic.
     */
    interface QueryBase {
    }
    /**
     * A callback to verify queries.
     * Should return a `string` error message if validation fails,
     * otherwise `undefined`.
     */
    type QueryValidator<Query extends QueryBase> = (query: Query) => undefined | string;
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
         * Convert `undefined` to `undefined` (no-op).
         */
        function to_nano(q: undefined): undefined;
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
    type Document<Query extends QueryBase> = Omit<Query, keyof Quota> & Quota;
    /** Nested types for the {@link Document} type. */
    namespace Document {
        /** Input options for creating a {@link Document} record. */
        type Opts<Query extends QueryBase> = Omit<Query, keyof Quota> & Quota.Opts;
    }
    /**
     * The available amount scales for cost/usage values.
     * Either 1 (base unit) or 1e9 (nano unit).
     *
     * @example
     * - Currency: 1 = dollars/euros/etc, 1e9 = nano-units of that currency.
     * - Generic units: 1 = unit, 1e9 = nano-units.
     */
    type AmountScale = AmountScale.Base | AmountScale.Nano;
    /** Nested types for the {@link AmountScale} type. */
    namespace AmountScale {
        /**
         * Base scale (1). Represents whole units (e.g., dollars, tokens, units).
         */
        type Base = 1;
        /** Base scale constant. */
        const Base: Base;
        /**
         * Nano scale (1e9). Represents smallest-unit integers (e.g., nano-units).
         */
        type Nano = 1_000_000_000;
        /** Nano scale constant. */
        const Nano: Nano;
    }
    /**
     * Branded alias to document intent: value is a non-negative safe integer at nano scale.
     * This remains a number at runtime.
     */
    type NanoInt = number;
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
    function to_scaled_amount(value: number, from_scale: AmountScale, to_scale: AmountScale): number;
    /**
     * Assert that an amount is a non-negative safe integer in nano scale.
     *
     * @param label  A label for diagnostics.
     * @param value  The numeric value to validate.
     * @param prefix Optional string prepended to the error message.
     * @throws       Error if the value is not a non-negative safe integer.
     */
    function assert_nano_int(label: string, value: number, prefix?: string): asserts value is NanoInt;
    /**
     * Multiply an integer quantity by a scaled integer price to obtain a scaled integer cost.
     * All arithmetic is integer-safe under IEEE-754 up to ~9e15.
     *
     * @param quantity     Non-negative safe integer count.
     * @param price_scaled Non-negative safe integer price in some integer scale (e.g., nano).
     * @returns            The product as a safe integer.
     * @throws             Error on invalid inputs or overflow.
     */
    function mul_int_safe(quantity: number, price_scaled: number): number;
    /**
     * Rounding mode for integer division in critical accounting paths.
     */
    type RoundingMode = "exact" | "floor" | "ceil" | "round";
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
    function div_int_safe(numerator: number, denominator: number, mode?: RoundingMode): number;
    /**
     * Safely add two integer values with overflow checking.
     *
     * @param a     The first operand; may be negative. Must be a safe integer.
     * @param b     The second operand; may be negative. Must be a safe integer.
     * @param label A descriptive label for error reporting.
     * @returns     The sum of `a` and `b` as a safe integer.
     * @throws      {Error} If either operand is not a safe integer, or if the sum would overflow.
     */
    function add_int_safe(a: number, b: number, label: string): number;
    /** The listed quota from {@link QuotaManager.list}. */
    interface ListedQuota<Query extends QueryBase> {
        /** The listed quota. */
        quota: QuotaManager.Document<Query>;
        /** The remaining usage left for this quota. */
        remaining: number;
        /** Percentage used for the quota. */
        percentage_used: number;
        /** Quota needs a reset, interval has expired. */
        needs_reset: boolean;
    }
    /** The returned type of {@link QuotaManager.get_status} */
    type GetStatusResult<Query extends QueryBase> = {
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
        quota: QuotaManager.Document<Query>;
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
    interface LimitOpts<Query extends QueryBase> {
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
    interface LimitFailure<Query extends QueryBase> {
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
    interface LimitSuccess<Query extends QueryBase> {
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
    interface BatchLimit<Query extends QueryBase> {
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
    interface BatchLimitFailure<Query extends QueryBase> extends LimitFailure<Query> {
        /** The failed query identifying the quota */
        failed_query: Query;
    }
    /** The batch limit success response. */
    interface BatchLimitSuccess<Query extends QueryBase> {
        /** Validation success indicator. */
        success: true;
        /** The operation status, kept for consistency. */
        status: "success";
        /** The individual results for each quota. */
        results: LimitSuccess<Query>[];
    }
}
