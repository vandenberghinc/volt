/**
 * @author Daan van den Bergh
 * @copyright © 2025 - 2025 Daan van den Bergh. All rights reserved.
 */

// External imports.
import * as vlib from "@vandenberghinc/vlib";

// Imports.
import { Collection } from "../database/collection.js"
import { Server } from "../server.js"

/** Utility types for the `SystemError`. */
export namespace SystemError {

    /**
     * Options for creating a system error.
     * @docs
     */
    export interface Opts {
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
    export type Logger = { error: (message: string) => void };

    /**
     * The database record for a saved system error.
     * @docs
     */
    export interface Document {
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
 * @nav Errors
 * @docs
 */
export class SystemError extends Error {

    /**
     * The default logger to dump messages to.
     * This can either be `console` or a custom logger such as `FileLogger`.
     * 
     * This logger is shared across all system errors,
     * unless a specific logger is passed to the {@link SystemError.Opts} constructor options.
     */
    static logger: SystemError.Logger = console;

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
    private static collection: undefined | Collection<SystemError.Document>;

    /**
     * Set a collection that will be used as default to save system errors to.
     * 
     * @param collection The collection options to use.
     * 
     * @docs
     */
    static set_collection(opts: Pick<
        Collection.Opts<SystemError.Document>,
        "name" | "ttl"
    > & {
        server: Server,
    }) {
        SystemError.collection = opts.server.db.collection<SystemError.Document>({
            name: opts.name,
            ttl: opts.ttl,
            indexes: [
                { keys: { id: 1 }, unique: true, forced: true }
            ],
            record_version: 1,
        });
    }

    /**
     * Configure the newly created system error instances,
     * assigning a global database collection and logger instance.
     * 
     * @docs
     */
    static setup(opts: {
        /** The initialized server instance. */
        server: Server,
        /** The collection options to use. */
        collection: Pick<
            Collection.Opts<SystemError.Document>,
            "name" | "ttl"
        >,
        /** The logger to use, defaults to {@link Server.log}. */
        logger?: SystemError.Logger,
    }) {
        SystemError.collection = opts.server.db.collection<SystemError.Document>({
            name: opts.collection.name,
            ttl: opts.collection.ttl,
            indexes: [
                { keys: { id: 1 }, unique: true, forced: true }
            ],
            record_version: 1,
        });
        SystemError.logger = opts.logger ?? opts.server.log;
    }

    /**
     * The generated identifier length (characters) for error IDs.
     * Defaults to 256 to preserve existing behavior; tune per database constraints.
     */
    static id_length: number = 256;

    /**
     * The maximum length for the stringified {@link SystemError.details} field when saved to the database collection as a string.
     * The `details` field is stringified when it (a) contains cycles or non-plain structures, or (b) its full JSON size exceeds
     * {@link SystemError.max_details_length}. Otherwise, the redacted plain object/array is stored.
     */
    static max_details_length: number = 10_000;

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
    private _format_colored?: string;

    /** A cache for the result of format({ colored: false }). */
    private _format_non_colored?: string;

    /**
     * Private constructor.
     * Use {@link SystemError.create} or {@link SystemError.create_detach} to create a new system error.
     */
    private constructor(opts: SystemError.Opts) {
        super(opts.message);

        // Ensures `instanceof SystemError` works in all transpilation targets.
        Object.setPrototypeOf(this, new.target.prototype);

        // Attributes.
        this.message = opts.message;
        this.details = opts.details;
        this.collection = opts.collection ?? SystemError.collection;
        this.logger = opts.logger ?? SystemError.logger;
        this.owner = opts.owner;

        // Define 'cause' as non-enumerable to avoid accidental leakage on serialization.
        if (opts.cause) {
            Object.defineProperty(this, "cause", {
                value: opts.cause,
                enumerable: false,
                configurable: true,
                writable: true,
            });
        }

        // Generate an id.
        this.id = vlib.String.random(
            SystemError.id_length,
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        );

        // Set error instance name.
        this.name = "SystemError";

        // Add timestamp.
        this.timestamp = Date.now();

        /** Capture a robust stack trace at the point of creation (cross-env safe). */
        const holder: { name: string; message: string; stack?: string } = { name: "X", message: "Y" };
        let prev_limit: number | undefined;
        try {
            // Feature-detect Node API.
            const has_capture = typeof (Error as any).captureStackTrace === "function";
            const has_limit = typeof (Error as any).stackTraceLimit === "number";
            if (has_limit) {
                prev_limit = (Error as any).stackTraceLimit;
                (Error as any).stackTraceLimit = 35;
            }
            if (has_capture) {
                (Error as any).captureStackTrace(holder, (this as any).constructor);
            } else {
                // Fallback: use current error stack
                holder.stack = this.stack;
            }
        } finally {
            if (typeof prev_limit === "number") {
                (Error as any).stackTraceLimit = prev_limit;
            }
        }
        this.trace = (holder.stack || "")
            .split("\n")
            .slice(1)
            .map((line) => line.trim());

        // Dont log from here, log from create or create_detach.
        // Perhaps we also want to create a constructor for loaded sys errs later.
    }

    /**
     * Construct a system error & save it to the database.
     * @docs
     */
    static async create(opts: SystemError.Opts): Promise<SystemError> {
        const error = new SystemError(opts);
        const formatted = error.format({ colored: false });
        console.error("[debug]", formatted);
        if (error.logger) {
            error.logger.error(formatted);
        }
        if (error.collection) {
            await error.collection.set(
                { id: error.id },
                error.document(),
                { retry: 25, },
            );
        }
        return error;
    }

    /**
     * Construct a system error & save it to the database.
     * This is a synchronous version of the create method.
     * Beware that this does not join the async save operation,
     * Instead it detaches and catches and logs any errors that occur during saving
     * @docs
     */
    static create_detach(opts: SystemError.Opts): SystemError {
        const error = new SystemError(opts);
        const formatted = error.format({ colored: false });
        console.error("[debug]", formatted);
        if (error.logger) {
            error.logger.error(formatted);
        }
        if (error.collection) {
            void error.collection.set(
                { id: error.id },
                error.document(),
                { retry: 25 },
            ).catch((e: unknown) => {
                try {
                    error.logger.error(`Failed to save system error to database: ${e instanceof Error ? e.message : String(e)}\n` + error.format({ colored: false }));
                } catch(_: any) { /** ignore */}
            })
        }
        return error;
    }

    /**
     * Get the error as a database document.
     * 
     * @returns A plain object representing the system error for database storage.
     * @docs
     */
    document(): SystemError.Document {
        const doc: SystemError.Document = {
            id: this.id,
            message: this.message,
            timestamp: this.timestamp,
            trace: this.trace,
            stack: this.stack,
            format: vlib.String.truncate(this.format({ colored: false }), 10_000),
        };
        if (this.details) {
            try {
                doc.details = this.prepare_details_for_db();
            } catch (e: unknown) {
                doc.details = `Encountered an error while processing details: ${e instanceof Error ? e.message : String(e)}`;
            }
        }
        if (this.owner != null) {
            doc.owner = this.owner;
        }
        if (this.cause) {
            doc.error = {
                name: this.cause.name,
                message: this.cause.message,
                stack: this.cause.stack,
            };
        }
        return doc;
    }

    /**
     * Format the error as a string.
     * @param colored Present the formatted error with colors to make it more visually pleasing.
     *                Defaults to `false`.
     * @returns A string representation of the system error.
     * @docs
     */
    format({ colored = false }: { colored?: boolean } = {}): string {
        if (colored && this._format_colored) return this._format_colored;
        else if (!colored && this._format_non_colored) return this._format_non_colored;

        try {
            const green = (m: string): string => colored ? vlib.Color.green(m) : m;

            const lines: string[] = [
                `SystemError: ${this.message}`,
            ];
            
            if (this.trace) {
                lines.push(
                    ...this.trace.map(l => `  ${l}`),
                );
            }

            lines.push(
                `  error_id: ${green('"' + this.id + '"')}`,
            );

            if (this.owner != null) {
                lines.push(
                    `  owner: ${green('"' + this.owner + '"')}`,
                );
            }

            let details: string;
            try {
                details = vlib.Object.stringify(this.redact_secrets(this.details), {
                    indent: 2,
                    start_indent: 1,
                    colored: colored,
                    max_length: 1000,
                });
            } catch (e: unknown) {
                details = `Encountered an error while processing details: ${e instanceof Error ? e.message : String(e)}`;
            }

            lines.push(
                `  created_at: ${green('"' + new Date(this.timestamp).toISOString() + '"')}`,
                `  details: ${details}`,
            )

            if (this.cause) {
                lines.push(
                    `  nested error:`,
                    // ...(this.cause?.stack ?? this.cause.toString()).split("\n")
                    //    .map(line => `    ${line.trim()}`)
                    vlib.logging.format_error(this.cause, {
                        colored: colored,
                        indent: 2,
                        start_indent: 2,
                    })
                );
            }

            if (colored) {
                return this._format_colored = lines.join("\n");
            } else {
                return this._format_non_colored = lines.join("\n");
            }
        } catch (e: unknown) {
            return `Encountered an error while formatting the system error: ${e instanceof Error ? e.message : String(e)}`;
        }
    }
    
    /**
     * Convert the error to a string without ANSI colors to avoid leaking escape codes into sinks
     * (e.g., files, JSON logs) that assume plain text.
     * @returns Non-colored string representation of the error.
     * @docs
     */
    toString(): string {
        return this.format({ colored: false });
    }

    // ----------------------------------------------------------
    // Private methods.

    /**
     * Detect a plain object (no custom prototype, not an array).
     * @param v - The value to test.
     */
    private is_plain_object(v: unknown): v is Record<string, unknown> {
        if (v === null || typeof v !== "object" || Array.isArray(v)) return false;
        const proto = Object.getPrototypeOf(v);
        return proto === Object.prototype || proto === null;
    }

    /**
     * Inspect and prepare the details for safe storage in `SystemError.Document.details`.
     *
     * @returns
     * - `undefined` if no details were defined.
     * - A string if (a) the value contains circular references, (b) it is not a plain object / array,
     *   or (c) the full stringified representation exceeds {@link SystemError.max_details_length}.
     * - Otherwise, the redacted raw object is returned.
     */
    private prepare_details_for_db(): undefined | string | Record<string, any> {
        if (!this.details) return undefined;
        /**
         * Recursively verify JSON-safety and detect cycles using path-level tracking.
         * @param val - The value to traverse.
         * @param in_path - WeakSet to track the current recursion path for cycles.
         */
        const is_json_safe = (val: unknown, in_path = new WeakSet<object>()): boolean => {
            if (val == null) return true;
            const t = typeof val;
            if (t === "undefined" || t === "boolean" || t === "number" || t === "string") return true;
            if (t === "function" || t === "symbol" || t === "bigint") return false;

            if (val instanceof String || val instanceof Date) return true;
            if (typeof val === "object") {
                const obj = val as object;
                if (in_path.has(obj)) return false; // cycle
                in_path.add(obj);

                if (Array.isArray(obj)) {
                    for (const item of obj) {
                        if (!is_json_safe(item, in_path)) { in_path.delete(obj); return false; }
                    }
                    in_path.delete(obj);
                    return true;
                }
                if (this.is_plain_object(obj)) {
                    for (const v of Object.values(obj as Record<string, unknown>)) {
                        if (!is_json_safe(v, in_path)) { in_path.delete(obj); return false; }
                    }
                    in_path.delete(obj);
                    return true;
                }
                in_path.delete(obj);
                return false; // Non-plain object (Map/Set/RegExp/etc.)
            }
            return false;
        };

        // Redact early (never mutate the original).
        const redacted = this.redact_secrets(this.details);

        // If structurally unsafe => stringify (capped).
        if (!is_json_safe(redacted)) {
            return vlib.Object.stringify(redacted, {
                colored: false,
                max_length: SystemError.max_details_length,
            });
        }

        // Measure the *full* length (no cap) to decide storage shape.
        // Measure the *full* length (no cap) to decide storage shape.
        let full_string: string;
        try {
            full_string = JSON.stringify(redacted);
        } catch (_: unknown) {
            // Extremely defensive fallback; should not execute after JSON-safety verification.
            full_string = vlib.Object.stringify(redacted, { colored: false });
        }
        if (full_string.length > SystemError.max_details_length) {
            // Persist as a truncated string to enforce the size budget.
            return vlib.String.truncate(full_string, SystemError.max_details_length);
        }

        // Safe & within budget: store as object.
        return redacted as Record<string, any>;
    }

    /**
     * Deep-clone arrays/plain objects and redact sensitive keys (best-effort).
     * Does not mutate the source object.
     * Uses a null-prototype object & explicit property definitions to prevent prototype pollution via magic keys.
     * @param input - The value to clone & redact.
     * @returns A redacted deep clone of the input.
     */
    private redact_secrets<T>(input: T): T {
        const sensitive = /^(password|pass|secret|api[_-]?key|token|access[_-]?token|refresh[_-]?token|authorization|auth|cookie|session|private[_-]?key|client[_-]?secret)$/i;

        const define_plain = (obj: Record<string, unknown>, key: string, value: unknown): void => {
            Object.defineProperty(obj, key, { value, enumerable: true, writable: true, configurable: true });
        };

        const clone = <U>(val: U): U => {
            if (val == null) return val;
            if (Array.isArray(val)) return (val.map(clone) as unknown) as U;
            if (this.is_plain_object(val)) {
                const out: Record<string, unknown> = Object.create(null);
                for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
                    if (sensitive.test(k)) {
                        define_plain(out, k, "[REDACTED]");
                    } else {
                        define_plain(out, k, clone(v));
                    }
                }
                return (out as unknown) as U;
            }
            // Leave other types as-is.
            return val;
        };

        return clone(input);
    }

};