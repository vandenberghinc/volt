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
  Collection: () => Collection
});
module.exports = __toCommonJS(stdin_exports);
var import_bson = require("bson");
var import_logger = require("../logger.js");
var import_document = require("./document.js");
const { log } = import_logger.logger;
class Collection {
  // Static attributes.
  static chunk_size = 1024 * 1024 * 4;
  // 4MB chunks, lower is better for frequent updates.
  static constructor_scheme = {
    name: "string",
    ttl: { type: "number", default: null },
    // ttl in msec
    indexes: {
      type: "array",
      default: [],
      value_scheme: {
        type: ["string", "object"],
        scheme: {
          key: { type: "string", required: (data) => data.key == null && data.keys == null },
          keys: {
            type: ["array"],
            required: (data) => data.key == null && data.keys == null,
            value_scheme: "string",
            postprocess: (keys) => typeof keys === "string" ? [keys] : keys
          },
          options: { type: "object", required: false },
          forced: { type: "boolean", default: false }
        },
        postprocess: (info) => {
          if (typeof info === "string")
            return { keys: [info] };
          return info;
        }
      }
    }
  };
  /** Collection name */
  name;
  /** Time to live in msec for all documents. */
  ttl;
  ttl_enabled;
  /** The column. */
  _col;
  /**
   * The Database parent class, used to initialize the column on demand.
   * So the user can define collections at root level before the database is initialized. */
  db;
  /** Is initialized. */
  initialized = false;
  /** The temporary indexes passed to the constructor for the init method. */
  _init_indexes;
  /** Constructor. */
  constructor(opts) {
    this.name = opts.name;
    this._col = opts.col;
    this.ttl = opts.ttl;
    this.ttl_enabled = typeof opts.ttl === "number";
    this.db = opts.db;
    this._init_indexes = opts.indexes;
  }
  /** Initialize. */
  async init() {
    if (this.initialized === false) {
      if (this._col == null) {
        if (!this.db.server.production) {
          await this.db.ensure_connection();
        }
        if (!this.db.connected || !this.db._db) {
          throw new Error(`Database is not connected.`);
        }
        if (this.db._listed_cols == null) {
          this.db._listed_cols = await this.db._db.listCollections().toArray();
        }
        if (!this.db._listed_cols.find((x) => x.name === this.name)) {
          log(0, `Creating collection "${this.name}".`);
          await this.db._db.createCollection(this.name);
        }
        this._col = this.db._db.collection(this.name);
      }
      this.initialized = true;
      if (this.ttl_enabled) {
        await this._setup_ttl();
      }
      if (this._init_indexes?.length) {
        for (const item of this._init_indexes) {
          await this.create_index(item);
        }
      } else {
        await this.create_index({ key: "_path", options: { unique: false } });
      }
    }
    return this;
  }
  assert_init() {
    if (this._col == null) {
      throw new Error(`Collection "${this.name}" is not initialized.`);
    }
  }
  /** Setup the ttl configuration. */
  async _setup_ttl() {
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    if (this.ttl == null) {
      return;
    }
    const desired_seconds = Math.floor(this.ttl / 1e3);
    const indexes = await this._col.indexes();
    const ttl_index = indexes.find((ix) => ix.key._ttl_timestamp === 1 || ix.key instanceof Array && ix.key[0] === "_ttl_timestamp");
    if (!ttl_index) {
      await this._col.createIndex({ _ttl_timestamp: 1 }, { expireAfterSeconds: desired_seconds });
      return;
    }
    if (ttl_index.expireAfterSeconds !== desired_seconds) {
      if (!ttl_index.name) {
        return;
      }
      await this._col.dropIndex(ttl_index.name);
      await this._col.createIndex({ _ttl_timestamp: 1 }, { expireAfterSeconds: desired_seconds });
    }
  }
  _process_doc(doc) {
    if (doc == null) {
      return;
    } else if (doc._content != null) {
      return doc._content;
    }
    return doc;
  }
  // Chunked methods.
  async _load_chunked(path, find_opts) {
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    let query = typeof path === "string" ? { _path: path, chunk: { $gte: 0 } } : { ...path, chunk: { $gte: 0 } };
    const chunks_cursor = this._col.find(query, find_opts).sort({ chunk: 1 });
    const chunks = await chunks_cursor.toArray();
    if (chunks.length === 0) {
      return null;
    }
    const buffer = Buffer.concat(chunks.map((chunk) => chunk.data.buffer));
    return (0, import_bson.deserialize)(buffer);
  }
  async _save_chunked(path, content) {
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    const buffer = (0, import_bson.serialize)(content);
    const new_chunk_count = Math.ceil(buffer.length / Collection.chunk_size);
    const ref_query = typeof path === "string" ? { _path: path, chunk: -1 } : { ...path, chunk: -1 };
    const object_ref = await this._col.findOne(ref_query);
    const old_chunk_count = object_ref ? object_ref.chunks : 0;
    const bulk_ops = [];
    for (let i = 0; i < buffer.length; i += Collection.chunk_size) {
      let query, update;
      if (typeof path === "string") {
        query = {
          _path: path,
          chunk: i / Collection.chunk_size
        };
        update = {
          chunk: i / Collection.chunk_size,
          data: buffer.slice(i, i + Collection.chunk_size)
        };
      } else {
        query = {
          ...path,
          chunk: i / Collection.chunk_size
        };
        update = {
          chunk: i / Collection.chunk_size,
          data: buffer.slice(i, i + Collection.chunk_size)
        };
      }
      const full_update2 = {
        $set: update
      };
      if (this.ttl_enabled) {
        full_update2["$setOnInsert"] = { _ttl_timestamp: /* @__PURE__ */ new Date() };
      }
      bulk_ops.push({
        updateOne: {
          filter: query,
          update: full_update2,
          upsert: true
        }
      });
    }
    const full_update = {
      $set: {
        chunk: -1,
        chunks: new_chunk_count
      }
    };
    if (this.ttl_enabled) {
      full_update["$setOnInsert"] = { _ttl_timestamp: /* @__PURE__ */ new Date() };
    }
    bulk_ops.push({
      updateOne: {
        filter: ref_query,
        update: full_update,
        upsert: true
      }
    });
    await this._col.bulkWrite(bulk_ops, { ordered: true });
    if (new_chunk_count < old_chunk_count) {
      ref_query.chunk = { $gte: new_chunk_count };
      await this._col.deleteMany(ref_query);
    }
  }
  // Get the raw and initialized mongo collection.
  async col() {
    await this.init();
    return this._col;
  }
  /** Create a reference. */
  ref(query, opts) {
    return new import_document.Document.Ref(query, opts ? { ...opts, col: this } : { col: this });
  }
  reference(query, opts) {
    return new import_document.Document.Ref(query, opts ? { ...opts, col: this } : { col: this });
  }
  /** Has index. */
  async has_index(index) {
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    return (await this._col.listIndexes().toArray()).some((x) => x.name === index);
  }
  /*  @docs:
      @title: Create index
      @description: Creates indexes on collections.
      @return:
          Returns the document that was found or `null` when no document is found.
      @parameter:
          @name: keys
          @desc: The `keys` argument for the orignal mongodb `createIndex()` function.
      @parameter:
          @name: options
          @desc: The `options` argument for the orignal mongodb `createIndex()` function.
      @parameter:
          @name: commitQuorum
          @desc: The `commitQuorum` argument for the orignal mongodb `createIndex()` function.
   */
  async create_index(opts) {
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    let key, keys;
    let options;
    let forced = false;
    if (typeof opts === "string") {
      key = opts;
    } else {
      ({
        key,
        keys,
        options,
        forced = false
      } = opts);
    }
    let keys_obj = {};
    if (key) {
      keys_obj = {};
      keys_obj[key] = 1;
    } else if (Array.isArray(keys) && keys.length > 0) {
      keys_obj = {};
      for (const key2 of keys) {
        keys_obj[key2] = 1;
      }
    } else {
      throw new Error("Define one of the following parameters: [key, keys].");
    }
    if (forced) {
      try {
        await this._col.dropIndex(options?.name ?? Object.entries(keys_obj).map(([key2, value]) => `${key2}_${value}`).join("_"));
      } catch (err) {
        if (err.codeName !== "IndexNotFound") {
          throw err;
        }
      }
    }
    return await this._col.createIndex(keys_obj, options || {});
  }
  /*  @docs:
   *  @title: Find
   *  @description: Find a document by a query.
   *  @return:
   *      Returns the document that was found or `null` when no document is found.
   *  @parameter:
   *      @name: query
   *      @desc: The query options.
   *      @type: object
   */
  async find(query) {
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    try {
      return this._process_doc(await this._col.findOne(query));
    } catch (error) {
      console.error(error);
      throw new Error("Encountered an error while finding the document.");
    }
  }
  async find_many(query) {
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    try {
      const list = await this._col.find(query).toArray();
      return list.map((i) => this._process_doc(i));
    } catch (error) {
      console.error(error);
      throw new Error("Encountered an error while finding the document.");
    }
  }
  /*  @docs:
   *  @title: Exists
   *  @description: Check if a document exists.
   *  @parameter:
   *      @name: path
   *      @description: The database path to the document.
   *      @type: string
   */
  async exists(path) {
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    if (typeof path !== "string" && (typeof path !== "object" || path == null)) {
      throw Error(`Parameter "path" has an invalid type "${typeof path}", the valid type is "string".`);
    }
    try {
      const doc = await this._col.findOne(typeof path === "object" ? path : { _path: path }, { projection: { _id: 1 } });
      return doc != null;
    } catch (error) {
      console.error(error);
      throw new Error("Encountered an error while checking if the document exists.");
    }
  }
  /*  @docs:
   *  @title: Load
   *  @description: Load data by path.
   *  @return:
   *      Returns the loaded document.
   *
   *      Returns the `def` parameter when the data does not exist, keep in mind that when parameter `def` is an object it could be a reference to a defined variable.
   *  @parameter:
   *      @name: path
   *      @description: The database path to the document.
   *      @type: string
   *  @parameter:
   *      @name: opts
   *      @desc: Additional options.
   *      @type: null, object
   *      @attribute:
   *          @name: default
   *          @description:
   *              The default data to be returned when the data does not exist.
   *
   *              When the type of attribute `default` is `object` then the keys that do not exist in the loaded object, but do exist in the default object will be inserted into the loaded object.
   *          @type: null, object
   *      @attribute:
   *          @name: chunked
   *          @description: Load a chunked document.
   *          @type: null, object
   *      @attribute:
   *          @name: attributes
   *          @description: The attributes to load.
   *          @type: null, string[]
   */
  async load(path, opts = null) {
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    if (typeof path !== "string" && (typeof path !== "object" || path == null)) {
      throw Error(`Parameter "path" has an invalid type "${typeof path}", the valid type is "string".`);
    }
    if (opts && opts.projection && opts.chunked) {
      throw new Error("The `projection` and `chunked` options cannot be used together.");
    }
    try {
      let find_opts;
      if (opts) {
        if (opts.projection) {
          find_opts = { projection: opts.projection };
        } else if (opts.attributes) {
          find_opts = { projection: {
            _id: 1,
            _path: 1,
            _uid: 1
          } };
          opts.attributes.forEach((i) => {
            if (find_opts?.projection) {
              find_opts.projection[i] = 1;
            }
          });
        }
      }
      let doc;
      if (opts != null && opts.chunked === true) {
        doc = await this._load_chunked(path, find_opts);
      } else {
        doc = await this._col.findOne(typeof path === "object" ? path : { _path: path }, find_opts);
      }
      doc = this._process_doc(doc);
      if (doc == null) {
        if (opts != null && opts.default !== void 0) {
          return opts.default;
        }
        return;
      } else if (opts != null && typeof opts.default === "object" && opts.default != null && Array.isArray(opts.default) === false) {
        const set_defaults = (obj, defaults) => {
          Object.keys(defaults).forEach((key) => {
            if (obj[key] === void 0) {
              obj[key] = defaults[key];
            } else if (typeof obj[key] === "object" && !Array.isArray(obj[key]) && obj[key] != null && typeof defaults[key] === "object" && !Array.isArray(defaults[key]) && defaults[key] != null) {
              set_defaults(obj[key], defaults[key]);
            }
          });
        };
        set_defaults(doc, opts.default);
      }
      return doc;
    } catch (error) {
      console.error(error);
      throw new Error("Encountered an error while loading the document.");
    }
  }
  /*  @docs:
   *  @title: Save
   *  @description: Save data by path. When the document already exists this function only updates the specified content attributes.
   *  @return:
   *      Returns the updated document.
   *  @parameter:
   *      @name: path
   *      @description: The database path to the document.
   *      @type: string
   *  @parameter:
   *      @name: data
   *      @description: The data to save.
   *      @type: null, boolean, number, string, array, object
   *  @parameter:
   *      @name: opts
   *      @desc: Additional options.
   *      @type: null, object
   *      @attribute:
   *          @name: chunked
   *          @description: Chunk the document into multiple documents, therefore documents larger than 16MB are supported.
   *          @warning: Currently this option is only supported for types `object` and `array`.
   *          @default: false
   *          @type: boolean
   *      @attribute:
   *          @name: bulk
   *          @description: Get a bulk operation object, so several operations can be executed in bulk.
   *          @default: false
   *          @type: boolean
   *      @attribute:
   *          @name: set
   *          @description: By default the $set attribute is used for the content, with `opts.set` disabled you can create your own instructions. The `content` attribute must reflect this.
   *          @warning: This does not work in combination with `opts.chunked`.
   *          @default: true
   *          @type: boolean
   */
  async save(path, content, opts = null) {
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    if (typeof path !== "string" && (typeof path !== "object" || path == null)) {
      throw Error(`Parameter "path" has an invalid type "${typeof path}", the valid type is "string".`);
    }
    try {
      let doc, set;
      if (typeof content === "object" && Array.isArray(content) == false && content != null) {
        delete content._id;
        delete content._path;
        delete content._uid;
        delete content._ttl_timestamp;
        set = content;
      } else {
        set = { _content: content };
      }
      if (opts != null && opts.chunked === true) {
        await this._save_chunked(path, set);
      } else {
        if (opts == null || opts.set !== false) {
          set = { $set: set };
        }
        if (this.ttl_enabled) {
          if (set["$setOnInsert"] === void 0) {
            set["$setOnInsert"] = {};
            set["$setOnInsert"]._ttl_timestamp = /* @__PURE__ */ new Date();
          } else if (set["$setOnInsert"] != null && typeof set["$setOnInsert"] === "object") {
            set["$setOnInsert"]._ttl_timestamp = /* @__PURE__ */ new Date();
          } else {
            throw new Error(`Undefined behaviour: Unable to assign the $setOnInsert data for ttl control.`);
          }
        }
        if (opts != null && opts.bulk) {
          return {
            updateOne: {
              filter: typeof path === "object" ? path : { _path: path },
              update: set,
              upsert: true
            }
          };
        } else {
          await this._col.updateOne(typeof path === "object" ? path : { _path: path }, set, { upsert: true });
        }
      }
      return content;
    } catch (error) {
      console.error(error);
      throw new Error("Encountered an error while updating the document.");
    }
  }
  /** Update many. */
  async update_many(...args) {
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    return this._col.updateMany(...args);
  }
  // List.
  /*  @docs:
   *  @title: List
   *  @description: List all child documents of directory path.
   *  @parameter:
   *      @name: path
   *      @description: The database directory path.
   *      @type: string
   *  @parameter:
   *      @name: options
   *      @description: List options.
   *      @type: object
   *      @attribute:
   *          @name: process
   *          @description: Process the document. By default saved non object data will be stored under `_content`. Processing checks this attribute and uses that content instead when it is detected.
   *          @type: boolean
   *          @default: true
   *      @attribute:
   *          @name: projection
   *          @description: The data attributes to retrieve, when left undefined all attributes are retrieved.
   *          @type: object
   *          @default: undefined
   */
  async list(path, options = {}) {
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    if (typeof path !== "string" && (typeof path !== "object" || path == null)) {
      throw Error(`Parameter "path" has an invalid type "${typeof path}", the valid type is "string".`);
    }
    if (typeof path === "string") {
      while (path.length > 0 && path.charAt(path.length - 1) === "/") {
        path = path.substr(0, path.length - 1);
      }
      if (path.length == 0) {
        throw Error("Invalid path.");
      }
      path = { _path: { $regex: `^${path}/` } };
    } else if (path._path) {
      let _path = path._path;
      while (_path.length > 0 && _path.charAt(_path.length - 1) === "/") {
        _path = _path.substr(0, _path.length - 1);
      }
      if (_path.length == 0) {
        throw Error("Invalid path.");
      }
      path._path = { $regex: `^${_path}/` };
    }
    try {
      const docs = await this._col.find(path, { projection: options.projection }).toArray();
      if (options.process === false) {
        return docs;
      }
      return docs.map((doc) => this._process_doc(doc));
    } catch (error) {
      console.error(error);
      throw new Error("Encountered an error while listing all documents.");
    }
  }
  /*  @docs:
   *  @title: List Query
   *  @description: List all documents of the collection based on a query.
   *  @parameter:
   *      @name: query
   *      @desc: The query options.
   *      @type: object
   *  @parameter:
   *      @name: options
   *      @description: List options.
   *      @type: object
   *      @attribute:
   *          @name: process
   *          @description: Process the document. By default saved non object data will be stored under `_content`. Processing checks this attribute and uses that content instead when it is detected.
   *          @type: boolean
   *          @default: true
   *      @attribute:
   *          @name: projection
   *          @description: The data attributes to retrieve, when left undefined all attributes are retrieved.
   *          @type: object
   *          @default: undefined
   */
  async list_query(query = {}, options = {}) {
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    try {
      const docs = await this._col.find(query, { projection: options.projection }).toArray();
      if (options.process === false) {
        return docs;
      }
      return docs.map((doc) => this._process_doc(doc));
    } catch (error) {
      console.error(error);
      throw new Error("Encountered an error while listing all documents.");
    }
  }
  /*  @docs:
   *  @title: List All
   *  @description: List all documents of the collection, optionally per uid.
   *  @parameter:
   *      @name: query
   *      @ignore: true
   *  @parameter:
   *      @name: options
   *      @description: List options.
   *      @type: object
   *      @attribute:
   *          @name: process
   *          @description: Process the document. By default saved non object data will be stored under `_content`. Processing checks this attribute and uses that content instead when it is detected.
   *          @type: boolean
   *          @default: true
   *      @attribute:
   *          @name: projection
   *          @description: The data attributes to retrieve, when left undefined all attributes are retrieved.
   *          @type: object
   *          @default: undefined
   */
  async list_all(query = {}, options = {}) {
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    let docs;
    docs = await this._col.find(query, { projection: options.projection }).toArray();
    if (options.process === false) {
      return docs;
    }
    return docs.map((doc) => this._process_doc(doc));
  }
  /*  @docs:
   *  @title: Delete
   *  @description: Delete a document of the collection by path.
   *  @parameter:
   *      @name: path
   *      @description: The database path to the document.
   *      @type: string
   *  @parameter:
   *      @name: opts
   *      @desc: Additional options.
   *      @type: null, object
   *      @attribute:
   *          @name: chunked
   *          @description: Delete a chunked document.
   *          @default: false
   *          @type: boolean
   *      @attribute:
   *          @name: bulk
   *          @description: Get a bulk operation object, so several operations can be executed in bulk.
   *          @default: false
   *          @type: boolean
   */
  async delete(path, opts) {
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    if (typeof path !== "string" && (typeof path !== "object" || path == null)) {
      throw Error(`Parameter "path" has an invalid type "${typeof path}", the valid type is "string".`);
    }
    try {
      if (opts != null && opts.chunked === true) {
        if (opts.bulk) {
          return { deleteMany: { filter: typeof path === "object" ? path : { _path: path } } };
        } else {
          await this._col.deleteMany(typeof path === "object" ? path : { _path: path });
        }
      } else {
        if (opts != null && opts.bulk) {
          return { deleteOne: { filter: typeof path === "object" ? path : { _path: path } } };
        } else {
          await this._col.deleteOne(typeof path === "object" ? path : { _path: path });
        }
      }
    } catch (error) {
      console.error(error);
      throw new Error("Encountered an error while deleting.");
    }
  }
  /*  @docs:
   *  @title: Delete Query
   *  @description: Delete a document of the collection by query.
   *  @parameter:
   *      @name: query
   *      @description: The query object.
   *      @type: object
   */
  async delete_query(query = {}) {
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    if (typeof query !== "object" || query == null || Object.keys(query).length === 0) {
      throw Error(`Parameter "query" has an invalid type "${typeof query}", the valid type is "object".`);
    }
    if (Object.keys(query).length === 0) {
      throw Error(`Parameter "query" is an empty object.`);
    }
    await this._col.deleteMany(query);
  }
  // Delete all.
  async delete_all(path) {
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    if (typeof path !== "string" && (typeof path !== "object" || path == null)) {
      throw Error(`Parameter "path" has an invalid type "${typeof path}", the valid type is "string".`);
    }
    try {
      await this._col.deleteMany(typeof path === "object" ? path : { _path: path });
    } catch (error) {
      console.error(error);
      throw new Error("Encountered an error while deleting.");
    }
  }
  async delete_many(query) {
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    try {
      await this._col.deleteMany(query);
    } catch (error) {
      console.error(error);
      throw new Error("Encountered an error while deleting.");
    }
  }
  /*  @docs:
   *  @title: Delete Collection
   *  @description: Delete all documents of from the collection.
   */
  async delete_collection() {
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    await this._col.deleteMany();
    await this._col.drop();
  }
  /*  @docs:
  //  *  @title: Clean document
  //  *  @description: Clean a document from all default system attributes.
  //  */
  clean(doc) {
    if (doc == null) {
      return doc;
    }
    if (typeof doc === "object") {
      delete doc._id;
      delete doc._path;
      if (this.ttl_enabled) {
        delete doc._ttl_timestamp;
      }
    }
    return doc;
  }
  /** Write bulk operations. */
  async bulk_operations(operations = []) {
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    return await this._col.bulkWrite(operations, { ordered: true });
  }
  async aggregate(pipeline, opts) {
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    const out = this._col.aggregate(pipeline);
    if (opts?.cursor) {
      return out;
    }
    const arr = await out.toArray();
    if (opts?.clean === true) {
      return arr.map((doc) => this.clean(doc)).filter((x) => x != null);
    }
    return arr;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Collection
});
