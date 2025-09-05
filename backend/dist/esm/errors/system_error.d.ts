/**
 * @author Daan van den Bergh
 * @copyright © 2025 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Collection } from "../database/collection.js";
import { Server } from "../server.js";
/** Utility types for the `SystemError`. */
export declare namespace SystemError {
    /** Options for creating a system error. */
    interface Opts {
        /** The message of the error. */
        message: string;
        /**
         * Additional details about the error.
         * This details object will be inspected automatically,
         * and trimmed if needed before saving it to the database.
         * @note Secrets are **redacted by key name** (e.g., password, token, api_key) before logging or persistence.
         *       Values not matched by key-based heuristics may still appear; avoid placing secrets in `details` when possible.
         */
        details?: Record<string, any>;
        /** A nested error cause. */
        cause?: Error;
        /**
         * The collection to save the error to.
         *
         * Defaults to static attribute {@link SystemError.collection}.
         *
         * @warning
         * If both {@link SystemError.collection} and field {@link SystemError.Opts.collection} are undefined,
         * the error will NOT be saved to the database.
         *
         * @note Ensure a database index is created for field `id`.
         */
        collection?: Collection<SystemError.Document>;
        /**
         * The logger to dump messages to.
         * This can either be `console` or a custom logger such as `FileLogger`.
         *
         * Defaults to static attribute {@link SystemError.logger}.
         */
        logger?: Logger;
        /**
         * An optional owner field.
         * For instance system errors saved by the {@link QuotaManager} have an owner of `volt.QuotaManager`.
         */
        owner?: string;
    }
    /**
     * The logger type to dump error messages to.
     * @dev_note
     * Even though console is less narrow than `Logger` we still keep it as `(m:string) => void`
     * to ensure it behaves consistently with different loggers, since console
     * joins args with a space and `FileLogger` does not.
     */
    type Logger = {
        error: (message: string) => void;
    };
    /** The database record for a saved system error. */
    interface Document {
        /** The unique id for this error. */
        id: string;
        /** The attached system error message. */
        message: string;
        /**
         * Stringified or raw object details.
         *
         * It will be saved to the database as:
         * - `undefined` if no details were defined.
         * - A string if (a) the value contains circular references, (b) it is not a plain object / plain array,
         *   or (c) the stringified representation exceeds {@link SystemError.max_details_length}.
         * - Otherwise, the raw object.
         */
        details?: string | Record<string, any>;
        /** The creation timestamp in milliseconds since Unix epoch. */
        timestamp: number;
        /** The stack trace at the time of error creation. */
        trace: string[];
        /** The captured stacktrace of the creation of the system error. */
        stack?: string;
        /** The string formatted version of the error message, truncated to max `10_000` characters. */
        format: string;
        /** The original error (if any) that caused this system error. */
        error?: {
            name: string;
            message: string;
            stack?: string;
        };
        /**
         * An optional owner field.
         * For instance system errors saved by the {@link QuotaManager} have an owner of `volt.QuotaManager`.
         */
        owner?: string;
    }
}
/**
 * The system error.
 * Used to indicate a fatal system error that should not occur and should be reported to developers.
 * When created, it is logged and (optionally) persisted to the configured collection.
 */
export declare class SystemError extends Error {
    /**
     * The default logger to dump messages to.
     * This can either be `console` or a custom logger such as `FileLogger`.
     *
     * This logger is shared across all system errors,
     * unless a specific logger is passed to the {@link SystemError.Opts} constructor options.
     */
    static logger: SystemError.Logger;
    /**
     * The default collection to save the error to.
     *
     * This collection is shared across all system errors,
     * unless a specific collection is passed to the {@link SystemError.Opts} constructor options.
     *
     * @warning
     * If both {@link SystemError.collection} and field {@link SystemError.Opts.collection} are undefined,
     * the error will not be saved to the database.
     *
     * @note Ensure a database index is created for field `id`.
     */
    private static collection;
    /**
     * Set a collection that will be used as default to save system errors to.
     *
     * @param collection The collection options to use.
     */
    static set_collection(opts: Pick<Collection.Opts<SystemError.Document>, "name" | "ttl"> & {
        server: Server;
    }): void;
    /**
     * The generated identifier length (characters) for error IDs.
     * Defaults to 256 to preserve existing behavior; tune per database constraints.
     */
    static id_length: number;
    /**
     * The maximum length for the stringified {@link SystemError.details} field when saved to the database collection as a string.
     * The `details` field is stringified when it (a) contains cycles or non-plain structures, or (b) its full JSON size exceeds
     * {@link SystemError.max_details_length}. Otherwise, the redacted plain object/array is stored.
     */
    static max_details_length: number;
    /**
     * A unique id for this error instance.
     * Unique to this system error instance.
     */
    id: string;
    /** The attached message. */
    message: string;
    /** The attached details. */
    details: undefined | Record<string, any>;
    /** A nested error cause. */
    cause: undefined | Error;
    /** The collection to save the error to. */
    collection: undefined | Collection<SystemError.Document>;
    /**
     * The logger to dump messages to.
     * Defaults to static attribute {@link SystemError.logger}.
     */
    logger: SystemError.Logger;
    /**
     * An optional owner field.
     * For instance system errors saved by the {@link QuotaManager} have an owner of `volt.QuotaManager`.
     */
    owner: undefined | string;
    /** The creation timestamp in milliseconds since Unix epoch. */
    timestamp: number;
    /** The captured stacktrace of the creation of the system error. */
    trace: string[];
    /** A cache for the result of format({ colored: true }). */
    private _format_colored?;
    /** A cache for the result of format({ colored: false }). */
    private _format_non_colored?;
    /**
     * Private constructor.
     * Use {@link SystemError.create} or {@link SystemError.create_detach} to create a new system error.
     */
    private constructor();
    /** Construct a system error & save it to the database. */
    static create(opts: SystemError.Opts): Promise<SystemError>;
    /**
     * Construct a system error & save it to the database.
     * This is a synchronous version of the create method.
     * Beware that this does not join the async save operation,
     * Instead it detaches and catches and logs any errors that occur during saving
     */
    static create_detach(opts: SystemError.Opts): SystemError;
    /**
     * Get the error as a database document.
     *
     * @returns A plain object representing the system error for database storage.
     */
    document(): SystemError.Document;
    /**
     * Format the error as a string.
     * @param colored Present the formatted error with colors to make it more visually pleasing.
     *                Defaults to `false`.
     * @returns A string representation of the system error.
     */
    format({ colored }?: {
        colored?: boolean;
    }): string;
    /**
     * Convert the error to a string without ANSI colors to avoid leaking escape codes into sinks
     * (e.g., files, JSON logs) that assume plain text.
     * @returns Non-colored string representation of the error.
     */
    toString(): string;
    /**
     * Detect a plain object (no custom prototype, not an array).
     * @param v - The value to test.
     */
    private is_plain_object;
    /**
     * Inspect and prepare the details for safe storage in `SystemError.Document.details`.
     *
     * @returns
     * - `undefined` if no details were defined.
     * - A string if (a) the value contains circular references, (b) it is not a plain object / array,
     *   or (c) the full stringified representation exceeds {@link SystemError.max_details_length}.
     * - Otherwise, the redacted raw object is returned.
     */
    private prepare_details_for_db;
    /**
     * Deep-clone arrays/plain objects and redact sensitive keys (best-effort).
     * Does not mutate the source object.
     * Uses a null-prototype object & explicit property definitions to prevent prototype pollution via magic keys.
     * @param input - The value to clone & redact.
     * @returns A redacted deep clone of the input.
     */
    private redact_secrets;
}
