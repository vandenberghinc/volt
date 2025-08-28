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
  Document: () => Document
});
module.exports = __toCommonJS(stdin_exports);
var vlib = __toESM(require("@vandenberghinc/vlib"));
var mongodb = __toESM(require("mongodb"));
var import_status = require("../status.js");
var import_utils = require("../utils.js");
var import_collection = require("./collection.js");
var Document;
(function(Document2) {
  class Ref {
    col;
    query;
    def;
    // chunked: boolean;
    record_version;
    // defaults to 1.
    error_type;
    transform_version;
    _on_load;
    /** Construct a new `Ref` instance. */
    constructor(query, opts) {
      if (!query || typeof query !== "string" && typeof query !== "object" || typeof query === "object" && query != null && Object.keys(query).length === 0) {
        throw new (opts.external_errors ? import_utils.ExternalError : import_utils.InternalError)({
          type: "InvalidDocumentRef",
          message: "Query must be a non-empty string or a non-empty object",
          status: import_status.Status.bad_request
        });
      }
      this.query = query;
      this.col = opts.col;
      this.def = opts.def;
      this.error_type = opts.external_errors ? import_utils.ExternalError : import_utils.InternalError;
      this.transform_version = opts.transform_version;
      this._on_load = opts.on_load;
      const version = opts.record_version ?? 1;
      if (!Number.isInteger(version) || version < 1) {
        throw new this.error_type({
          type: "InvalidDocumentRef",
          message: "Record version must be a positive integer",
          status: import_status.Status.bad_request
        });
      }
      this.record_version = version;
      if (this.record_version !== 1 && !this.transform_version) {
        throw new this.error_type({
          type: "InvalidDocumentRef",
          message: "Transform version must be set when record version is set.",
          status: import_status.Status.bad_request
        });
      }
    }
    /**
     * On load callback.
     *
     * @param opts.insert_defaults Whether to insert default values.
     *                             Defaults to `true`.
     */
    on_load(data, opts) {
      if (this.record_version != null && this.transform_version != null && data.__record_version !== this.record_version) {
        try {
          data = this.transform_version(data.__record_version, this.record_version, data);
        } catch (e) {
          throw new this.error_type({
            type: "DocumentTransformError",
            message: `Failed to transform document version: ${e instanceof Error ? e.message : String(e)}`,
            status: import_status.Status.internal_server_error,
            cause: e
          });
        }
        data.__record_version = this.record_version;
      }
      if (this.record_version != null && data.__record_version == null) {
        data.__record_version = this.record_version;
      }
      if (this.def && (opts?.insert_defaults ?? true)) {
        try {
          import_collection.Collection.insert_defaults_helper(data, this.as_default({ clone: false }), { clone: true });
        } catch (e) {
          throw new this.error_type({
            type: "RecursionDepthExceeded",
            message: e instanceof Error ? e.message : String(e),
            status: import_status.Status.internal_server_error,
            cause: e
          });
        }
      }
      if (this._on_load) {
        data = this._on_load(data);
      }
      return data;
    }
    /**
     * Get the computed default value, when defined.
     *
     * Cloning the default object by default.
     *
     * @param opts.clone Whether to clone the default object.
     *                   Defaults to `true`.
     */
    as_default(opts) {
      if (this.def) {
        const raw = typeof this.def === "function" ? this.def() : this.def;
        if (opts?.clone ?? true) {
          const cloned = typeof globalThis.structuredClone === "function" ? structuredClone(raw) : vlib.Object.deep_copy(raw);
          cloned.__record_version = this.record_version;
          return cloned;
        }
        return {
          ...raw,
          __record_version: this.record_version
        };
      }
    }
    /** Check if a project exists.
     * @note this does not load the full document.
     */
    async exists() {
      return await this.col.exists(this.query);
    }
    /**
     * Load a project from the database.
     * Automatically performing the optional {@link Ref.Opts.transform_version} and {@link Ref.Opts.on_load} callbacks.
     *
     * @param def the default value, when the default value is an object then the attributes will be checked / inserted as well.
     */
    async load() {
      let data = await this.col.load(this.query);
      if (!data) {
        if (this.def) {
          data = this.as_default();
          data._id = new mongodb.ObjectId();
          return this.on_load(data, { insert_defaults: false });
        }
        return;
      }
      return this.on_load(data);
    }
    /**
     * Load partial by projection.
     *
     * @warning This does not execute the optional {@link Ref.Opts.transform_version} and {@link Ref.Opts.on_load} callbacks.
     *
     * @param fields The fields to load, nested fields should be separated by a dot (e.g. "a.b.c").
     */
    async load_partial(...fields) {
      const projection = {};
      projection._id = 1;
      projection.__record_version = 1;
      for (const field of fields) {
        projection[field] = 1;
      }
      return await this.col.load(this.query, { projection });
    }
    /**
     * Safely save the document to the database, internally executing {@link Collection.save}
     * Inserting default values upon document creation.
     *
     * @note This retrieves the default document values opon every call.
     *       Either by executing the {@link Ref.def} method, or by passing its
     *       raw properties directly if it is passed as such.
     *
     * @warning Keep in mind that if you defined {@link Ref.def} as method,
     *          it will be called on every call of this function.
     */
    async safe_set(data, opts) {
      const op_data = {
        ...opts?.flatten ? this.col.flatten(data) : data,
        __record_version: this.record_version
      };
      return this.col.save(this.query, {
        $set: op_data,
        $setOnInsert: this.as_default()
      }, opts);
    }
    /**
     * Save the document to the database, internally executing {@link Collection.set}
     *
     * @warning This does not insert the default values upon document creation.
     *          Use {@link safe_set} to safely insert defaults.
     *
     * @throws An error if the document write is not acknowledged by mongodb (failed) or if the matched query count is 0.
     *         Or when `return` is `true` it returns an error if the returned document is undefined.
     */
    async set(data, opts) {
      const op_data = {
        ...data,
        // flattening is handled in `col.set`.
        __record_version: this.record_version
      };
      return this.col.set(this.query, op_data, opts);
    }
    /**
     * Save the document to the database, internally executing {@link Collection.set}
     *
     * @warning This does not insert the default values upon document creation.
     *          Use {@link safe_set} to safely insert defaults.
     *
     * @throws An error if the document write is not acknowledged by mongodb (failed) or if the matched query count is 0.
     *         Or when `return` is `true` it returns an error if the returned document is undefined.
     */
    async set_partial(data, opts) {
      const op_data = {
        ...data,
        // flattening is handled in `col.set`.
        __record_version: this.record_version
      };
      return this.col.set(this.query, op_data, opts);
    }
    /**
     * Save a single document without performing any default `$set` or `$inc` like operations.
     * When a document does not exist it will automatically be created.
     * Inserting default values upon document creation.
     *
     * @warning Keep in mind that if you defined {@link Ref.def} as method,
     *          it will be called on every call of this function.
     *
     * @note This retrieves the default document values opon every call.
     *       Either by executing the {@link Ref.def} method, or by passing its
     *       raw properties directly if it is passed as such.
     *
     * @throws An error if the document write is not acknowledged by mongodb (failed) or if the matched query count is 0.
     *         Or when `return` is `true` it returns an error if the returned document is undefined.
     */
    async safe_save(data, opts) {
      if (data.$set == null) {
        data.$set = { __record_version: this.record_version };
      } else {
        data.$set = {
          ...data.$set,
          __record_version: this.record_version
        };
      }
      data.$setOnInsert = this.as_default();
      return this.col.save(this.query, data, opts);
    }
    /**
     * Save a single document without performing any default `$set` or `$inc` like operations.
     * When a document does not exist it will automatically be created.
     *
     * @warning This does not insert the default values upon document creation.
     *          Use {@link safe_save} to safely insert defaults.
     *
     * @throws An error if the document write is not acknowledged by mongodb (failed) or if the matched query count is 0.
     *         Or when `return` is `true` it returns an error if the returned document is undefined.
     */
    async save(data, opts) {
      if (data.$set == null) {
        data.$set = { __record_version: this.record_version };
      } else {
        data.$set = {
          ...data.$set,
          __record_version: this.record_version
        };
      }
      return this.col.save(this.query, data, opts);
    }
    /** Delete the database record. */
    async delete(opts) {
      return this.col.delete(this.query, opts);
    }
  }
  Document2.Ref = Ref;
})(Document || (Document = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Document
});
