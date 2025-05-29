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
  Document: () => Document,
  ExtendedDocument: () => ExtendedDocument
});
module.exports = __toCommonJS(stdin_exports);
var import_logger = require("../logger.js");
var import_status = require("../status.js");
var import_utils = require("../utils.js");
const { log } = import_logger.logger;
class Document {
  /** Attributes */
  ref;
  data;
  /** Constructor
   * @param ref The document reference object.
   * @param data The initialized document data.
  */
  constructor(ref, data) {
    this.ref = ref;
    this.data = data;
  }
  /** Check if a document exists.
    * @note this does not load the full document.
    */
  async exists() {
    return this.ref.exists();
  }
}
(function(Document2) {
  class Ref {
    col;
    query;
    def;
    chunked;
    record_version;
    error_type;
    transform_version;
    _on_load;
    /** Constructor
     * @param col The collection created by the server.
     * @param uid The uid of the document, this is only required when the collection is a UIDCollection.
     * @param query The document query, used to find the existing document.
     * @param def The default value, when the default value is an object then the attributes will be checked / inserted as well.
     * @param chunked If true then the document is stored in chunks.
     * @param external_errors If true then the errors are thrown as external errors, instead of internal errors.
     * @param record_version The record type version for the database.
     *        This can be used in combination with parameter `transform_version` to ...
     *        Transform older record versions to the current version.
     * @param transform_version The function to transform an older document version to the current version.
     * @param on_load The function to call when the document is loaded.
    */
    constructor(query, opts) {
      this.query = query;
      this.col = opts.col;
      this.def = opts.def;
      this.chunked = opts.chunked || false;
      this.error_type = opts.external_errors ? import_utils.ExternalError : import_utils.InternalError;
      this.record_version = typeof opts.record_version === "number" ? opts.record_version : 1;
      this.transform_version = opts.transform_version;
      this._on_load = opts.on_load;
      if (this.record_version != 1 && !this.transform_version) {
        throw new this.error_type({
          type: "InvalidDocumentRef",
          message: "Transform version must be set when record version is set.",
          status: import_status.Status.bad_request
        });
      }
    }
    /** Insert defaults from constructor param `def`. */
    insert_defaults(data) {
      if (data && this.def && !Array.isArray(this.def) && (typeof this.def === "object" || typeof this.def === "function")) {
        const set_defaults = (obj, defaults) => {
          Object.keys(defaults).forEach((key) => {
            if (obj[key] === void 0) {
              obj[key] = defaults[key];
            } else if (typeof obj[key] === "object" && !Array.isArray(obj[key]) && obj[key] != null && typeof defaults[key] === "object" && !Array.isArray(defaults[key]) && defaults[key] != null) {
              set_defaults(obj[key], defaults[key]);
            }
          });
        };
        set_defaults(data, typeof this.def === "function" ? this.def() : this.def);
      }
    }
    /**
     * On load callback.
     * @note this is not called when default data is used for an empty document.
     */
    on_load(data) {
      if (this.record_version && data.__record_version !== 1) {
        data = this.transform_version(this.record_version, data);
      }
      this.insert_defaults(data);
      if (this._on_load) {
        data = this._on_load(data);
      }
      return data;
    }
    /** Get the computed default value, when defined. */
    as_default() {
      if (this.def) {
        return typeof this.def === "function" ? this.def() : this.def;
      }
    }
    /** Check if a project exists.
     * @note this does not load the full document.
     */
    async exists() {
      return await this.col.exists(this.query);
    }
    /**
     * Load a project from the database
     * @param def the default value, when the default value is an object then the attributes will be checked / inserted as well.
     */
    async load() {
      const data = await this.col.load(this.query, { chunked: this.chunked });
      if (!data) {
        if (this.def) {
          return typeof this.def === "function" ? this.def() : this.def;
        }
        return;
      }
      return this.on_load(data);
    }
    /**
     * Load partial by projection.
     * @param fields The fields to load, nested fields should be separated by a dot (e.g. "a.b.c").
     */
    async load_partial(...fields) {
      const projection = {};
      for (const field of fields) {
        projection[field] = 1;
      }
      return await this.col.load(this.query, { projection });
    }
    /** Save the project to the database */
    async save(data) {
      data.__record_version = this.record_version;
      return this.col.save(this.query, data, { chunked: this.chunked });
    }
    /** Save partial to the database
     * @note automatically inserts the new values when the document is loaded.
     */
    async save_partial(partial_data) {
      if (this.chunked) {
        throw new this.error_type({
          type: "UnsupportedDocumentOperation",
          message: "Chunked documents do not support partial updates.",
          status: import_status.Status.bad_request
        });
      }
      return this.col.save(this.query, partial_data, { chunked: this.chunked });
    }
    /** Delete database record. */
    async delete(opts) {
      return this.col.delete(this.query, {
        ...opts,
        chunked: this.chunked
      });
    }
  }
  Document2.Ref = Ref;
})(Document || (Document = {}));
class ExtendedDocument extends Document {
  /** Constructor
   * @param ref The document reference object.
   * @param data The initialized document data.
  */
  constructor(ref, data) {
    super(ref, data);
  }
  /** Wrapper function to insert an obj into another
    * @note this is not a deep copy.
    */
  static __insert_obj(obj, partial) {
    Object.keys(partial).forEach((key) => {
      const val = partial[key];
      if (val !== null && typeof val === "object" && !Array.isArray(val) && obj[key] !== null && typeof obj[key] === "object" && !Array.isArray(obj[key])) {
        ExtendedDocument.__insert_obj(obj[key], val);
      } else {
        obj[key] = val;
      }
    });
  }
  /** Save the data to the database */
  async save() {
    return this.ref.save(this.data);
  }
  /** Save partial to the database
    * @note automatically inserts the new values when the document is loaded.
    */
  async save_partial(partial_data) {
    if (this.data && typeof partial_data === "object" && !Array.isArray(this.data) && partial_data && typeof partial_data === "object" && !Array.isArray(partial_data)) {
      ExtendedDocument.__insert_obj(this.data, partial_data);
    }
    return this.ref.save_partial(partial_data);
  }
  /** Delete database record. */
  async delete(opts) {
    return this.ref.delete(opts);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Document,
  ExtendedDocument
});
