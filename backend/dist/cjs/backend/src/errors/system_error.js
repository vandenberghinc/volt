var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  SystemError: () => SystemError
});
module.exports = __toCommonJS(stdin_exports);
var vlib = __toESM(require("@vandenberghinc/vlib"));
class SystemError extends Error {
  /**
   * The default logger to dump messages to.
   * This can either be `console` or a custom logger such as `FileLogger`.
   *
   * This logger is shared across all system errors,
   * unless a specific logger is passed to the {@link SystemError.Opts} constructor options.
   */
  static logger = console;
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
  static collection;
  /**
   * Set a collection that will be used as default to save system errors to.
   *
   * @param collection The collection options to use.
   */
  static set_collection(opts) {
    SystemError.collection = opts.server.db.collection({
      name: opts.name,
      ttl: opts.ttl,
      indexes: [
        { keys: { id: 1 }, unique: true, forced: true }
      ],
      record_version: 1
    });
  }
  /**
   * Configure the newly created system error instances,
   * assigning a global database collection and logger instance.
   */
  static setup(opts) {
    SystemError.collection = opts.server.db.collection({
      name: opts.collection.name,
      ttl: opts.collection.ttl,
      indexes: [
        { keys: { id: 1 }, unique: true, forced: true }
      ],
      record_version: 1
    });
    SystemError.logger = opts.logger ?? opts.server.log;
  }
  /**
   * The generated identifier length (characters) for error IDs.
   * Defaults to 256 to preserve existing behavior; tune per database constraints.
   */
  static id_length = 256;
  /**
   * The maximum length for the stringified {@link SystemError.details} field when saved to the database collection as a string.
   * The `details` field is stringified when it (a) contains cycles or non-plain structures, or (b) its full JSON size exceeds
   * {@link SystemError.max_details_length}. Otherwise, the redacted plain object/array is stored.
   */
  static max_details_length = 1e4;
  /**
   * A unique id for this error instance.
   * Unique to this system error instance.
   */
  id;
  /** The attached message. */
  message;
  /** The attached details. */
  details;
  /** A nested error cause. */
  cause;
  /** The collection to save the error to. */
  collection;
  /**
   * The logger to dump messages to.
   * Defaults to static attribute {@link SystemError.logger}.
   */
  logger;
  /**
   * An optional owner field.
   * For instance system errors saved by the {@link QuotaManager} have an owner of `volt.QuotaManager`.
   */
  owner;
  /** The creation timestamp in milliseconds since Unix epoch. */
  timestamp;
  /** The captured stacktrace of the creation of the system error. */
  trace;
  /** A cache for the result of format({ colored: true }). */
  _format_colored;
  /** A cache for the result of format({ colored: false }). */
  _format_non_colored;
  /**
   * Private constructor.
   * Use {@link SystemError.create} or {@link SystemError.create_detach} to create a new system error.
   */
  constructor(opts) {
    super(opts.message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.message = opts.message;
    this.details = opts.details;
    this.collection = opts.collection ?? SystemError.collection;
    this.logger = opts.logger ?? SystemError.logger;
    this.owner = opts.owner;
    if (opts.cause) {
      Object.defineProperty(this, "cause", {
        value: opts.cause,
        enumerable: false,
        configurable: true,
        writable: true
      });
    }
    this.id = vlib.String.random(SystemError.id_length, "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789");
    this.name = "SystemError";
    this.timestamp = Date.now();
    const holder = { name: "X", message: "Y" };
    let prev_limit;
    try {
      const has_capture = typeof Error.captureStackTrace === "function";
      const has_limit = typeof Error.stackTraceLimit === "number";
      if (has_limit) {
        prev_limit = Error.stackTraceLimit;
        Error.stackTraceLimit = 35;
      }
      if (has_capture) {
        Error.captureStackTrace(holder, this.constructor);
      } else {
        holder.stack = this.stack;
      }
    } finally {
      if (typeof prev_limit === "number") {
        Error.stackTraceLimit = prev_limit;
      }
    }
    this.trace = (holder.stack || "").split("\n").slice(1).map((line) => line.trim());
  }
  /** Construct a system error & save it to the database. */
  static async create(opts) {
    const error = new SystemError(opts);
    const formatted = error.format({ colored: false });
    console.error("[debug]", formatted);
    if (error.logger) {
      error.logger.error(formatted);
    }
    if (error.collection) {
      await error.collection.set({ id: error.id }, error.document(), { retry: 25 });
    }
    return error;
  }
  /**
   * Construct a system error & save it to the database.
   * This is a synchronous version of the create method.
   * Beware that this does not join the async save operation,
   * Instead it detaches and catches and logs any errors that occur during saving
   */
  static create_detach(opts) {
    const error = new SystemError(opts);
    const formatted = error.format({ colored: false });
    console.error("[debug]", formatted);
    if (error.logger) {
      error.logger.error(formatted);
    }
    if (error.collection) {
      void error.collection.set({ id: error.id }, error.document(), { retry: 25 }).catch((e) => {
        try {
          error.logger.error(`Failed to save system error to database: ${e instanceof Error ? e.message : String(e)}
` + error.format({ colored: false }));
        } catch (_) {
        }
      });
    }
    return error;
  }
  /**
   * Get the error as a database document.
   *
   * @returns A plain object representing the system error for database storage.
   */
  document() {
    const doc = {
      id: this.id,
      message: this.message,
      timestamp: this.timestamp,
      trace: this.trace,
      stack: this.stack,
      format: vlib.String.truncate(this.format({ colored: false }), 1e4)
    };
    if (this.details) {
      try {
        doc.details = this.prepare_details_for_db();
      } catch (e) {
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
        stack: this.cause.stack
      };
    }
    return doc;
  }
  /**
   * Format the error as a string.
   * @param colored Present the formatted error with colors to make it more visually pleasing.
   *                Defaults to `false`.
   * @returns A string representation of the system error.
   */
  format({ colored = false } = {}) {
    if (colored && this._format_colored)
      return this._format_colored;
    else if (!colored && this._format_non_colored)
      return this._format_non_colored;
    try {
      const green = (m) => colored ? vlib.Color.green(m) : m;
      const lines = [
        `SystemError: ${this.message}`
      ];
      if (this.trace) {
        lines.push(...this.trace.map((l) => `  ${l}`));
      }
      lines.push(`  error_id: ${green('"' + this.id + '"')}`);
      if (this.owner != null) {
        lines.push(`  owner: ${green('"' + this.owner + '"')}`);
      }
      let details;
      try {
        details = vlib.Object.stringify(this.redact_secrets(this.details), {
          indent: 2,
          start_indent: 1,
          colored,
          max_length: 1e3
        });
      } catch (e) {
        details = `Encountered an error while processing details: ${e instanceof Error ? e.message : String(e)}`;
      }
      lines.push(`  created_at: ${green('"' + new Date(this.timestamp).toISOString() + '"')}`, `  details: ${details}`);
      if (this.cause) {
        lines.push(
          `  nested error:`,
          // ...(this.cause?.stack ?? this.cause.toString()).split("\n")
          //    .map(line => `    ${line.trim()}`)
          vlib.logging.format_error(this.cause, {
            colored,
            indent: 2,
            start_indent: 2
          })
        );
      }
      if (colored) {
        return this._format_colored = lines.join("\n");
      } else {
        return this._format_non_colored = lines.join("\n");
      }
    } catch (e) {
      return `Encountered an error while formatting the system error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
  /**
   * Convert the error to a string without ANSI colors to avoid leaking escape codes into sinks
   * (e.g., files, JSON logs) that assume plain text.
   * @returns Non-colored string representation of the error.
   */
  toString() {
    return this.format({ colored: false });
  }
  // ----------------------------------------------------------
  // Private methods.
  /**
   * Detect a plain object (no custom prototype, not an array).
   * @param v - The value to test.
   */
  is_plain_object(v) {
    if (v === null || typeof v !== "object" || Array.isArray(v))
      return false;
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
  prepare_details_for_db() {
    if (!this.details)
      return void 0;
    const is_json_safe = (val, in_path = /* @__PURE__ */ new WeakSet()) => {
      if (val == null)
        return true;
      const t = typeof val;
      if (t === "undefined" || t === "boolean" || t === "number" || t === "string")
        return true;
      if (t === "function" || t === "symbol" || t === "bigint")
        return false;
      if (val instanceof String || val instanceof Date)
        return true;
      if (typeof val === "object") {
        const obj = val;
        if (in_path.has(obj))
          return false;
        in_path.add(obj);
        if (Array.isArray(obj)) {
          for (const item of obj) {
            if (!is_json_safe(item, in_path)) {
              in_path.delete(obj);
              return false;
            }
          }
          in_path.delete(obj);
          return true;
        }
        if (this.is_plain_object(obj)) {
          for (const v of Object.values(obj)) {
            if (!is_json_safe(v, in_path)) {
              in_path.delete(obj);
              return false;
            }
          }
          in_path.delete(obj);
          return true;
        }
        in_path.delete(obj);
        return false;
      }
      return false;
    };
    const redacted = this.redact_secrets(this.details);
    if (!is_json_safe(redacted)) {
      return vlib.Object.stringify(redacted, {
        colored: false,
        max_length: SystemError.max_details_length
      });
    }
    let full_string;
    try {
      full_string = JSON.stringify(redacted);
    } catch (_) {
      full_string = vlib.Object.stringify(redacted, { colored: false });
    }
    if (full_string.length > SystemError.max_details_length) {
      return vlib.String.truncate(full_string, SystemError.max_details_length);
    }
    return redacted;
  }
  /**
   * Deep-clone arrays/plain objects and redact sensitive keys (best-effort).
   * Does not mutate the source object.
   * Uses a null-prototype object & explicit property definitions to prevent prototype pollution via magic keys.
   * @param input - The value to clone & redact.
   * @returns A redacted deep clone of the input.
   */
  redact_secrets(input) {
    const sensitive = /^(password|pass|secret|api[_-]?key|token|access[_-]?token|refresh[_-]?token|authorization|auth|cookie|session|private[_-]?key|client[_-]?secret)$/i;
    const define_plain = (obj, key, value) => {
      Object.defineProperty(obj, key, { value, enumerable: true, writable: true, configurable: true });
    };
    const clone = (val) => {
      if (val == null)
        return val;
      if (Array.isArray(val))
        return val.map(clone);
      if (this.is_plain_object(val)) {
        const out = /* @__PURE__ */ Object.create(null);
        for (const [k, v] of Object.entries(val)) {
          if (sensitive.test(k)) {
            define_plain(out, k, "[REDACTED]");
          } else {
            define_plain(out, k, clone(v));
          }
        }
        return out;
      }
      return val;
    };
    return clone(input);
  }
}
;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SystemError
});
