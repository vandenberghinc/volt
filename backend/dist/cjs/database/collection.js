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
  Collection: () => Collection,
  TransactionCollection: () => TransactionCollection
});
module.exports = __toCommonJS(stdin_exports);
var mongodb = __toESM(require("mongodb"));
var vlib = __toESM(require("@vandenberghinc/vlib"));
var import_document = require("./document.js");
var import_flatten = require("./flatten.js");
class Collection {
  /** Collection name */
  name;
  /** The mongo collection. */
  _col;
  /**
   * The Database parent class, used to initialize the collection on demand.
   * So the user can define collections at root level before the database is initialized.
   */
  db;
  /** Is initialized. */
  initialized = false;
  /** Whether this collection instance is transaction-based. */
  is_transaction = false;
  /** Whether this transaction has been finalized (committed or aborted). */
  is_finalized_transaction = false;
  /** Time to live in msec for all documents. */
  ttl;
  /** Is ttl behaviour enabled? */
  ttl_enabled;
  /** Enable sliding ttl (refreshes ttl on update), or static ttl (sets ttl on insert) */
  sliding_ttl;
  /** The temporary indexes passed to the constructor for the init method. */
  _init_indexes;
  /** The MongoDB client session for transaction support. */
  _session;
  /**
   * Constructs a new Collection instance.
   *
   * @param opts The constructor options for the collection.
   *
   * @throws An error when attempting to initialize a transaction-based collection without initializing the derived collection first.
   */
  constructor(opts) {
    if (!opts.transaction_based) {
      this.name = opts.name;
      this._col = opts.col;
      this.db = opts.db;
      this._init_indexes = opts.indexes;
      this.is_transaction = false;
      let ttl_ms;
      let ttl_sliding = true;
      if (typeof opts.ttl === "number") {
        ttl_ms = opts.ttl;
        ttl_sliding = true;
      } else if (opts.ttl && typeof opts.ttl === "object") {
        ttl_ms = opts.ttl.milliseconds;
        ttl_sliding = opts.ttl.sliding ?? true;
      } else {
        ttl_ms = void 0;
        ttl_sliding = true;
      }
      this.ttl = ttl_ms;
      this.ttl_enabled = this.ttl != null;
      this.sliding_ttl = ttl_sliding;
    } else {
      if (!opts.derived_collection.initialized) {
        throw new Error(`Derived collection "${opts.derived_collection.name}" is not yet initialized, this is required in order to construct a transaction based collection.`);
      }
      this.name = opts.derived_collection.name;
      this._col = opts.derived_collection._col;
      this.ttl = opts.derived_collection.ttl;
      this.sliding_ttl = opts.derived_collection.sliding_ttl;
      this.ttl_enabled = opts.derived_collection.ttl_enabled;
      this.db = opts.derived_collection.db;
      this.is_transaction = true;
    }
  }
  // -------------------------------------------------------------------
  // Private methods.
  // -------------------------------------------------------------------
  /**
   * Initialize a database query from path or object.
   * @throws An error if the input type is incorrect, and optionally if the query is empty.
   */
  _init_query(query, allow_empty, param_name) {
    if (typeof query !== "string" && (typeof query !== "object" || query == null)) {
      vlib.schema.throw_invalid_type(param_name, query, ["string", "object"], true);
    }
    const op_query = typeof query === "object" ? query : { _path: query };
    if (!allow_empty && Object.keys(op_query).length === 0) {
      throw Error(`Parameter "${param_name}" is an empty object.`);
    }
    return op_query;
  }
  /**
   * Setup the ttl configuration.
   *
   * @note When transaction mode is enabled, the session option will not be used.
   */
  async _setup_ttl() {
    this.assert_not_transaction_based();
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    if (!this.ttl_enabled || this.ttl == null) {
      return;
    }
    const desired_seconds = Math.floor(this.ttl / 1e3);
    const indexes = await this._col.indexes();
    const ttl_index = indexes.find((ix) => ix && typeof ix.key === "object" && ix.key._ttl_timestamp === 1);
    if (!ttl_index) {
      await this._col.createIndex({ _ttl_timestamp: 1 }, { expireAfterSeconds: desired_seconds });
      return;
    }
    if (ttl_index.expireAfterSeconds !== desired_seconds) {
      let coll_mod_succeeded = false;
      try {
        await this.db._db.command({
          collMod: this.name,
          index: {
            name: ttl_index.name,
            expireAfterSeconds: desired_seconds
          }
        });
        coll_mod_succeeded = true;
      } catch (error) {
      }
      if (!coll_mod_succeeded) {
        try {
          await this._col.dropIndex(ttl_index.name ?? { _ttl_timestamp: 1 });
        } catch {
        }
        await this._col.createIndex({ _ttl_timestamp: 1 }, { expireAfterSeconds: desired_seconds });
      }
    }
  }
  /**
   * Apply the ttl timestamp to a database operation (update doc or pipeline).
   * Do not upsert if the user explicitly sets `upsert: false` in the operation.
   */
  _apply_ttl_to_operation(operation, upsert) {
    if (!this.ttl_enabled)
      return;
    const now = /* @__PURE__ */ new Date();
    if (Array.isArray(operation)) {
      if (this.sliding_ttl) {
        operation.push({ $set: { _ttl_timestamp: now } });
      } else {
        operation.push({ $set: { _ttl_timestamp: { $ifNull: ["$_ttl_timestamp", now] } } });
      }
      return;
    }
    const opKey = this.sliding_ttl ? "$set" : "$setOnInsert";
    if (this.sliding_ttl || upsert !== false) {
      const bucket = operation[opKey];
      if (bucket == null) {
        operation[opKey] = { _ttl_timestamp: now };
      } else if (typeof bucket === "object") {
        bucket._ttl_timestamp = now;
      } else {
        throw new Error(`Invalid update operator object for TTL control at "${opKey}".`);
      }
    }
  }
  // -------------------------------------------------------------------
  // Public methods.
  // -------------------------------------------------------------------
  /**
   * Initialize the collection, creating indexes and setting up TTL if needed.
   * @returns The initialized collection instance.
   */
  async init() {
    if (this.initialized === false) {
      if (!this.is_transaction) {
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
            let create_col_retries = 3;
            let last_error = null;
            let collection_created = false;
            while (create_col_retries > 0 && !collection_created) {
              try {
                await this.db._db.createCollection(this.name);
                collection_created = true;
              } catch (error) {
                last_error = error;
                if (error.codeName === "NamespaceExists") {
                  collection_created = true;
                } else if (create_col_retries > 1 && (error.code === 11e3 || error.code === 48)) {
                  create_col_retries--;
                  await new Promise((r) => setTimeout(r, 100));
                } else {
                  throw error;
                }
              }
            }
            if (!collection_created && last_error) {
              throw last_error;
            }
          }
          this._col = this.db._db.collection(this.name);
        }
        this.initialized = true;
        if (this.ttl_enabled) {
          await this._setup_ttl();
        }
        if (!this.is_transaction) {
          if (this._init_indexes?.length) {
            for (const item of this._init_indexes) {
              await this.create_index(item);
            }
          } else {
            await this.create_index({ key: "_path", options: { unique: false } });
          }
        }
      } else {
        if (!this.db.client) {
          throw new Error("Database client is not initialized, this is likely because you did not initialize the transaction based collection through 'Collection.start_transaction'.");
        }
        if (!this._col) {
          throw new Error("SystemError: Derived collection is not initialized, this should have been initialized in the constructor.");
        }
        this._session = this.db.client.startSession();
        this._session.startTransaction();
        this.initialized = true;
      }
    }
    return this;
  }
  /**
   * Assert that the collection is initialized and has a valid MongoDB collection.
   * @throws {Error} Throws if the collection is not initialized or _col is null
   * @returns An initialized collection type assertion
   */
  assert_init() {
    if (!this.initialized) {
      throw new Error(`Collection "${this.name}" is not initialized.`);
    }
    if (this._col == null) {
      throw new Error(`Collection "${this.name}" is not initialized.`);
    }
  }
  /**
   * Assert that if this is a transaction, it has not been finalized.
   * @throws Error if this is a finalized transaction.
   */
  assert_not_finalized() {
    if (this.is_transaction && this.is_finalized_transaction) {
      throw new Error(`Transaction has already been finalized (committed or aborted).`);
    }
  }
  /**
   * Assert that this collection is not transaction based.
   */
  assert_not_transaction_based() {
    if (this.is_transaction) {
      throw new Error(`Collection "${this.name}" is transaction based.`);
    }
  }
  /**
   * Get operation options with session if this is a transaction.
   * @returns Options object with session if applicable.
   */
  get_operation_options(opts) {
    if (this.is_transaction && this._session) {
      return { ...opts, session: this._session };
    }
    return opts ?? {};
  }
  /**
   * Get the raw and initialized MongoDB collection.
   * @returns The MongoDB collection instance.
   */
  async col() {
    await this.init();
    return this._col;
  }
  /**
   * Create a document reference.
   * @param query The query to identify the document.
   * @param opts Additional options for the reference.
   * @returns A new {@link Document.Ref} instance.
   */
  ref(query, opts) {
    const constructor_opts = {
      col: this,
      ...opts ?? {}
    };
    return new import_document.Document.Ref(query, constructor_opts);
  }
  reference(query, opts) {
    return this.ref(query, opts);
  }
  /**
   * Check if an index exists.
   * @note Not supported for transaction based collections.
   * @param index The name of the index to check.
   * @returns True if the index exists, false otherwise.
   */
  async has_index(index) {
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    this.assert_not_finalized();
    this.assert_not_transaction_based();
    return (await this._col.listIndexes().toArray()).some((x) => x.name === index);
  }
  /**
   * Creates indexes on collections.
   *
   * @note When transaction mode is enabled, the session option will not be used.
   *
   * @param opts The index create options.
   */
  async create_index(opts) {
    this.assert_not_transaction_based();
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    let key;
    let keys;
    let options;
    let unique;
    let forced = false;
    if (typeof opts === "string") {
      key = opts;
      unique = false;
    } else {
      ({
        key,
        keys,
        options,
        forced = false
      } = opts);
      if (opts.unique != null && opts.options?.unique != null && opts.unique !== opts.options.unique) {
        throw new Error(`Encountered different values for attribute 'unique': ${opts.unique} and 'options.unique': ${opts.options.unique}.`);
      }
      unique = opts.unique ?? options?.unique;
    }
    if (unique) {
      options = options || {};
      options.unique = unique;
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
    } else if (keys != null && typeof keys === "object" && !Array.isArray(keys)) {
      keys_obj = keys;
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
    return await this._col.createIndex(keys_obj, options);
  }
  /**
   * Find a document by a query.
   * @param query The query options.
   * @returns Returns the document that was found or `undefined` when no document is found.
   */
  async find(query) {
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    this.assert_not_finalized();
    return await this._col.findOne(query, this.get_operation_options()) ?? void 0;
  }
  /**
   * Find multiple documents by query.
   * By default limited to 10000 results.
   * @param query MongoDB query objects.
   * @returns Array of found documents.
   */
  async find_many(query, opts) {
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    this.assert_not_finalized();
    if (!opts) {
      opts = {};
    }
    if (opts.limit == null) {
      opts.limit = 1e4;
    }
    const op_opts = opts;
    const cursor = this._col.find(query, this.get_operation_options(op_opts));
    if (opts?.cursor)
      return cursor;
    return await cursor.toArray();
  }
  /**
   * Check if a document exists.
   * @param query The database path to the document.
   * @returns True if the document exists, false otherwise.
   */
  async exists(query) {
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    this.assert_not_finalized();
    const doc = await this._col.findOne(this._init_query(query, false, "query"), this.get_operation_options({ projection: { _id: 1 } }));
    return doc != null;
  }
  /**
   * Load data by path.
   *
   * @note The `default` value will be deep-cloned if it is returned or inserted.
   *
   * @param query The database query.
   * @param opts Additional load options {@link Collection.LoadOpts}.
   *
   * @returns Returns the loaded (projected) document or undefined if not found, unless `def` is defined.
   */
  async load(query, opts) {
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    this.assert_not_finalized();
    const find_opts = opts?.projection ? { projection: Collection.Projection.init(opts.projection) } : void 0;
    let doc;
    doc = await this._col.findOne(this._init_query(query, false, "query"), this.get_operation_options(find_opts));
    if (doc == null) {
      if (opts != null && opts.default !== void 0) {
        return typeof globalThis.structuredClone === "function" ? structuredClone(opts.default) : vlib.Object.deep_copy(opts.default);
      }
      return void 0;
    } else if (opts != null && typeof opts.default === "object" && opts.default != null && !Array.isArray(opts.default)) {
      Collection.insert_defaults_helper(doc, opts.default, { clone: true });
    }
    return doc;
  }
  /**
   * Standalone helper: merge `source` into `target` for missing keys only.
   * Clones assigned nested objects/arrays/dates once (when `clone` is true).
   *
   * @throws An error if the max depth recursion depth has been exceeded.
   */
  static insert_defaults_helper(target, source, opts = {}) {
    const max_depth = opts.max_depth ?? 1e3;
    const depth = opts.depth ?? 0;
    const should_clone = opts.clone ?? true;
    const isPlainObject = (v) => v != null && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype;
    const cloneAssigned = (val, d) => {
      if (!should_clone)
        return val;
      if (d > max_depth)
        return val;
      if (Array.isArray(val)) {
        return val.map((item) => cloneAssigned(item, d + 1));
      }
      if (val instanceof Date) {
        return new Date(val.getTime());
      }
      if (isPlainObject(val)) {
        const out = {};
        for (const k of Object.keys(val)) {
          out[k] = cloneAssigned(val[k], d + 1);
        }
        return out;
      }
      return val;
    };
    if (depth > max_depth) {
      throw new Error(`Maximum recursion depth (${max_depth}) exceeded in insert_defaults_helper`);
    }
    for (const key of Object.keys(source)) {
      const v = target[key];
      const d = source[key];
      if (v === void 0) {
        target[key] = cloneAssigned(d, depth + 1);
      } else if (isPlainObject(v) && isPlainObject(d)) {
        Collection.insert_defaults_helper(v, d, { depth: depth + 1, max_depth, clone: should_clone });
      }
    }
  }
  flatten(obj, prefix = "") {
    return (0, import_flatten.flatten)(obj, prefix);
  }
  /**
   * Save data with predefined `$set` behaviour.
   * When the document already exists this function only updates the specified content attributes.
   * When a document does not exist it will automatically be created, unless `opts.upsert` is explicitly set to `false`.
   *
   * @param query The database query / path to the document.
   * @param content The data to save.
   * @param opts Additional options.
   * @param opts.bulk When `true` a bulk operation object is returned, so several operations can be executed in bulk.
   *                  When applying the bulk operation outside of {@link bulk_operations}, ensure you dont forget to submit the transaction session.
   * @param opts.flatten When `true` the content is flattened to a `key.subkey` like object, suitable for `$set` and `$inc` like operations.
   * @param opts.return When `true` and bulk is `false` this function will return the **updated** document as response.
   * @param opts.upsert When `true` or `undefined`, the document will be created if it does not exist.
   *                    Defaults to `true`.
   *
   * @throws {Collection.WriteError} A {@link Collection.WriteError} if the document write is not acknowledged by mongodb (failed) or if the matched query count is 0.
   *         Or when `return` is `true` it returns a {@link Collection.WriteError} if the returned document is undefined.
   *
   * @returns The following result in order of precedence:
   *          1. A bulk unexecuted bulk operation if `opts.bulk` is `true.
   *          2. The updated document if `opts.return` is `true`.
   *          3. A void response.
   */
  async set(query, content, opts) {
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    this.assert_not_finalized();
    if (content == null) {
      vlib.schema.throw_invalid_type("content", content, "object", true);
    }
    if (opts?.flatten)
      content = this.flatten(content);
    const operation = { $set: content };
    if (this.ttl_enabled)
      this._apply_ttl_to_operation(operation, opts?.upsert ?? true);
    if (opts?.bulk) {
      const b_op = {
        updateOne: {
          filter: this._init_query(query, false, "query"),
          update: operation,
          upsert: opts?.upsert ?? true
        }
      };
      return b_op;
    } else {
      if (opts?.return) {
        if ((opts?.upsert ?? true) === false) {
          throw new Error("Upsert must be disabled when 'throw' is 'false' and 'return' is 'true'.");
        }
        const query_op = this._init_query(query, false, "query");
        const res = await this._col.findOneAndUpdate(query_op, operation, this.get_operation_options({
          upsert: opts?.upsert ?? true,
          returnDocument: mongodb.ReturnDocument.AFTER,
          includeResultMetadata: false
          // consistency for v5/v6 etc.
        }));
        if (!res) {
          if (!(opts?.throw ?? true)) {
            return void 0;
          }
          throw new Collection.WriteError("Document not found or update failed.", query_op);
        }
        return res;
      } else {
        const query_op = this._init_query(query, false, "query");
        const res = await this._col.updateOne(query_op, operation, this.get_operation_options({
          upsert: opts?.upsert ?? true
        }));
        if (!res.acknowledged || res.matchedCount === 0 && res.upsertedCount === 0) {
          throw new Collection.WriteError("No document matched the filter and no upsert occurred.", query_op);
        }
      }
    }
    return void 0;
  }
  /**
   * Save a single document without performing any default `$set` or `$inc` like operations.
   * When a document does not exist it will automatically be created.
   * @param query The database query / path to the document.
   * @param operation The data operation to perform, e.g. `{ $set: { key: value } }` or `{ $inc: { key: value } }`.
   * @param opts Additional options.
   * @param opts.bulk When `true` a bulk operation object is returned, so several operations can be executed in bulk.
   *                  When applying the bulk operation outside of {@link bulk_operations}, ensure you dont forget to submit the transaction session.
   * @param opts.return When `true` and bulk is `false` this function will return the **updated** document as response.
   * @param opts.upsert When `true` or `undefined`, the document will be created if it does not exist.
   *                    Defaults to `true`.
   *
   * @throws {Collection.WriteError} A {@link Collection.WriteError} if the document write is not acknowledged by mongodb (failed) or if the matched query count is 0.
   *         Or when `return` is `true` it returns a {@link Collection.WriteError} if the returned document is undefined.
   */
  async save(query, operation, opts) {
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    this.assert_not_finalized();
    const query_op = this._init_query(query, false, "query");
    if (this.ttl_enabled)
      this._apply_ttl_to_operation(operation, opts?.upsert ?? true);
    if (opts?.bulk) {
      const b_op = {
        updateOne: {
          filter: query_op,
          update: operation,
          upsert: opts?.upsert ?? true
        }
      };
      return b_op;
    } else {
      if (opts?.return) {
        if ((opts?.upsert ?? true) === false) {
          throw new Error("Upsert must be disabled when 'throw' is 'false' and 'return' is 'true'.");
        }
        const res = await this._col.findOneAndUpdate(query_op, operation, this.get_operation_options({
          upsert: opts?.upsert ?? true,
          returnDocument: mongodb.ReturnDocument.AFTER,
          includeResultMetadata: false
          // consistency for v5/v6 etc.
        }));
        if (!res) {
          if (!(opts?.throw ?? true)) {
            return void 0;
          }
          throw new Collection.WriteError("Document not found or update failed.", query_op);
        }
        return res;
      } else {
        const res = await this._col.updateOne(query_op, operation, this.get_operation_options({
          upsert: opts?.upsert ?? true
        }));
        if (!res.acknowledged || res.matchedCount === 0 && res.upsertedCount === 0) {
          throw new Collection.WriteError("No document matched the filter and no upsert occurred.", query_op);
        }
      }
    }
    return void 0;
  }
  /**
   * Update multiple documents matching the filter.
   * @param filter MongoDB query object.
   * @param update Update document or pipeline.
   * @param options MongoDB UpdateOptions.
   */
  async update_many(filter, update, options) {
    if (!filter || typeof filter !== "object") {
      throw new Error("Filter parameter is required and must be an object");
    }
    if (!update || typeof update !== "object") {
      throw new Error("Update parameter is required and must be an object");
    }
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    this.assert_not_finalized();
    if (this.ttl_enabled)
      this._apply_ttl_to_operation(update, options?.upsert ?? false);
    const operation_options = this.get_operation_options(options);
    return this._col.updateMany(filter, update, operation_options);
  }
  /** Prepare a _path based regex operation. */
  prepare_path_regex_filter(path) {
    while (path.length > 0 && path.charAt(path.length - 1) === "/") {
      path = path.substring(0, path.length - 1);
    }
    if (path.length == 0) {
      throw Error("Invalid path.");
    }
    if (path.length > 1e3) {
      throw new Error("Path too long");
    }
    const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const filter = {
      _path: {
        $regex: `^${escapeRegExp(path)}/`
        // $options: 'i'  // Case insensitive for consistency
      }
    };
    return filter;
  }
  /**
   * List all child documents of directory path.
   * By default limited to 10000 documents.
   * @param query The database directory path.
   * @param opts List options.
   * @param options.projection The data attributes to retrieve, when left undefined all attributes are retrieved.
   * @returns Array of documents matching the path.
   */
  async list(query, opts) {
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    this.assert_not_finalized();
    if (opts?.projection) {
      opts.projection = Collection.Projection.init(opts.projection);
    }
    if (!opts) {
      opts = {};
    }
    if (opts.limit == null) {
      opts.limit = 1e4;
    }
    const op_opts = opts;
    if (typeof query === "string") {
      const filter = this.prepare_path_regex_filter(query);
      return await this._col.find(filter, this.get_operation_options(op_opts)).toArray();
    } else if (query && typeof query === "object" && query._path) {
      const filter = {
        ...query,
        ...this.prepare_path_regex_filter(query._path)
      };
      return await this._col.find(filter, this.get_operation_options(op_opts)).toArray();
    } else {
      return await this._col.find(this._init_query(query, true, "query"), this.get_operation_options(op_opts)).toArray();
    }
  }
  /**
   * List all documents of the collection based on a query.
   * By default limited to 10000 documents.
   * @param query The query options.
   * @param opts List options.
   * @param options.projection The data attributes to retrieve, when left undefined all attributes are retrieved.
   * @returns Array of documents matching the query.
   */
  async list_query(query, opts) {
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    this.assert_not_finalized();
    if (!opts) {
      opts = {};
    }
    if (opts.projection) {
      opts.projection = Collection.Projection.init(opts.projection);
    }
    if (opts.limit == null) {
      opts.limit = 1e4;
    }
    const op_opts = opts;
    return await this._col.find(query, this.get_operation_options(op_opts)).toArray();
  }
  /**
   * List all documents of the collection.
   * By default limited to 10000 documents.
   * @param query The query to filter documents.
   * @param opts List options.
   * @param options.projection The data attributes to retrieve, when left undefined all attributes are retrieved.
   * @returns Array of all documents in the collection.
   */
  async list_all(query, opts) {
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    this.assert_not_finalized();
    if (!opts) {
      opts = {};
    }
    if (opts.projection) {
      opts.projection = Collection.Projection.init(opts.projection);
    }
    if (opts.limit == null) {
      opts.limit = 1e4;
    }
    const op_opts = opts;
    return await this._col.find(query ?? {}, this.get_operation_options(op_opts)).toArray();
  }
  /**
   * Delete a document of the collection by path.
   * @param query The database path to the document.
   * @param opts Additional options.
   * @param opts.bulk Get a bulk operation object, so several operations can be executed in bulk.
   *                  When applying the bulk operation outside of {@link bulk_operations}, ensure you dont forget to submit the transaction session.
   * @returns Void or bulk operation object if bulk is true.
   *
   * @throws a {@link Collection.DeleteError} if the deletion was not acknowledged, this does not check against the deleted document count.
   */
  async delete(query, opts) {
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    this.assert_not_finalized();
    const query_op = this._init_query(query, false, "query");
    if (Object.keys(query_op).length === 0) {
      throw Error(`Parameter "query" is an empty object.`);
    }
    if (opts != null && opts.bulk) {
      const b_op = {
        deleteOne: {
          filter: query_op
        }
      };
      return b_op;
    } else {
      const res = await this._col.deleteOne(query_op, this.get_operation_options());
      if (!res.acknowledged) {
        throw new Collection.DeleteError(`Failed to delete document(s) in collection "${this.name}". Query: ${JSON.stringify(query_op)}`, query_op);
      }
      return res;
    }
  }
  /**
   * Delete a document of the collection by query.
   * @param query The query object.
   * @throws Error if query is empty or invalid.
   * @throws a {@link Collection.DeleteError} if the deletion was not acknowledged, this does not check against the deleted document count.
   */
  async delete_query(query) {
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    this.assert_not_finalized();
    const query_op = this._init_query(query, false, "query");
    const res = await this._col.deleteMany(query_op, this.get_operation_options());
    if (!res.acknowledged) {
      throw new Collection.DeleteError(`Failed to delete document(s) in collection "${this.name}".`, query_op);
    }
    return res;
  }
  /**
   * Delete multiple documents matching the query.
   * @param query MongoDB query object.
   * @throws a {@link Collection.DeleteError} if the deletion was not acknowledged, this does not check against the deleted document count.
   */
  async delete_many(query) {
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    this.assert_not_finalized();
    const op_query = this._init_query(query, false, "query");
    const res = await this._col.deleteMany(op_query, this.get_operation_options());
    if (!res.acknowledged) {
      throw new Collection.DeleteError(`Failed to delete document(s) in collection "${this.name}".`, op_query);
    }
    return res;
  }
  /**
   * Delete all documents in the collection, optionally by query.
   * @throws a {@link Collection.DeleteError} if the deletion was not acknowledged, this does not check against the deleted document count.
   */
  async delete_all(query) {
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    this.assert_not_finalized();
    const res = await this._col.deleteMany(query ?? {}, this.get_operation_options());
    if (!res.acknowledged) {
      throw new Collection.DeleteError(`Failed to delete all document(s) in collection "${this.name}".`, query ?? {});
    }
    return res;
  }
  /**
   * Delete all documents from the collection and drop the collection.
   *
   * @note This function is not supported for transaction based collections.
   */
  async delete_collection() {
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    this.assert_not_finalized();
    this.assert_not_transaction_based();
    await this._col.deleteMany({}, this.get_operation_options());
    try {
      const res = await this._col.drop(this.get_operation_options());
      if (!res) {
        throw new Collection.DeleteError(`Failed to drop collection "${this.name}" detected by a falsy return.`, {});
      }
    } catch (err) {
      if (err?.code === 26 || err?.codeName === "NamespaceNotFound") {
        return;
      }
      throw new Collection.DeleteError(`Failed to drop collection "${this.name}": ${err?.message ?? err}`, {});
    }
  }
  /**
   * Clean a document from all default system attributes.
   * @param doc The document to clean.
   * @returns The cleaned document without system attributes.
   */
  clean(doc) {
    if (doc == null) {
      return doc;
    }
    if (typeof doc === "object") {
      const out = Array.isArray(doc) ? doc.slice() : { ...doc };
      delete out._id;
      delete out._path;
      if (this.ttl_enabled) {
        delete out._ttl_timestamp;
      }
      return out;
    }
    return doc;
  }
  // /**
  //  * @todo implement
  //  * Enhanced bulk operations with retry logic for failed operations
  //  * @param operations - Array of bulk write operations
  //  * @param retries - Number of retry attempts for failed operations. Set to -1 to disable retries. Default is 3.
  //  * @returns Simplified BulkWriteResult with aggregated counts from all attempts
  //  */
  // async bulk_operations(
  //     operations: any[] = [],
  //     retries: number = 3
  // ): Promise<{
  //     ok: boolean;
  //     inserted_count: number;
  //     matched_count: number;
  //     modified_count: number;
  //     deleted_count: number;
  //     upserted_count: number;
  //     upserted_ids: { [key: number]: any };
  //     inserted_ids: { [key: number]: any };
  //     failed_operations: number[];
  //     errors?: any[];
  // }> {
  //     if (!this.initialized) { await this.init(); }
  //     this.assert_init();
  //     // Validate operations
  //     if (!Array.isArray(operations)) {
  //         throw new TypeError('Operations must be an array');
  //     }
  //     // Return early for empty operations
  //     if (operations.length === 0) {
  //         return {
  //             ok: true,
  //             inserted_count: 0,
  //             matched_count: 0,
  //             modified_count: 0,
  //             deleted_count: 0,
  //             upserted_count: 0,
  //             upserted_ids: {},
  //             inserted_ids: {},
  //             failed_operations: []
  //         };
  //     }
  //     // MongoDB bulk write limit
  //     const MAX_BATCH_SIZE = 100000;
  //     if (operations.length > MAX_BATCH_SIZE) {
  //         throw new Error(`Bulk operations exceed MongoDB limit of ${MAX_BATCH_SIZE}. Please batch your operations.`);
  //     }
  //     // Initialize aggregated results
  //     const aggregated_result = {
  //         ok: true,
  //         inserted_count: 0,
  //         matched_count: 0,
  //         modified_count: 0,
  //         deleted_count: 0,
  //         upserted_count: 0,
  //         upserted_ids: {} as { [key: number]: any },
  //         inserted_ids: {} as { [key: number]: any },
  //         failed_operations: [] as number[],
  //         errors: [] as any[]
  //     };
  //     // Track operation status (true = succeeded, false = failed/pending)
  //     const operation_status: Map<number, boolean> = new Map();
  //     operations.forEach((_, index) => operation_status.set(index, false));
  //     // Track latest errors for each operation (will be cleared if operation succeeds)
  //     const latest_errors: Map<number, any> = new Map();
  //     // Track operations that need to be executed
  //     let pending_operations = operations.map((op, index) => ({ op, original_index: index }));
  //     let attempt_count = 0;
  //     const max_attempts = retries < 0 ? 1 : retries + 1;
  //     while (pending_operations.length > 0 && attempt_count < max_attempts) {
  //         attempt_count++;
  //         try {
  //             // Execute bulk operations
  //             const result = await this._col.bulkWrite(
  //                 pending_operations.map(item => item.op),
  //                 { ordered: false } // Use unordered for better error handling
  //             );
  //             // Track which operations succeeded in this attempt
  //             const succeeded_in_this_attempt = new Set<number>();
  //             // Aggregate successful results
  //             aggregated_result.inserted_count += result.insertedCount;
  //             aggregated_result.matched_count += result.matchedCount;
  //             aggregated_result.modified_count += result.modifiedCount;
  //             aggregated_result.deleted_count += result.deletedCount;
  //             aggregated_result.upserted_count += result.upsertedCount;
  //             // Map inserted/upserted IDs back to original indices
  //             if (result.insertedIds && typeof result.insertedIds === 'object') {
  //                 for (const [key, value] of Object.entries(result.insertedIds)) {
  //                     const idx = parseInt(key);
  //                     if (!isNaN(idx) && pending_operations[idx]) {
  //                         const original_index = pending_operations[idx].original_index;
  //                         aggregated_result.inserted_ids[original_index] = value;
  //                         succeeded_in_this_attempt.add(original_index);
  //                     }
  //                 }
  //             }
  //             if (result.upsertedIds && typeof result.upsertedIds === 'object') {
  //                 for (const [key, value] of Object.entries(result.upsertedIds)) {
  //                     const idx = parseInt(key);
  //                     if (!isNaN(idx) && pending_operations[idx]) {
  //                         const original_index = pending_operations[idx].original_index;
  //                         aggregated_result.upserted_ids[original_index] = value;
  //                         succeeded_in_this_attempt.add(original_index);
  //                     }
  //                 }
  //             }
  //             // Check for write errors
  //             const write_errors = result.hasWriteErrors?.() ? result.getWriteErrors() : [];
  //             if (write_errors.length > 0) {
  //                 aggregated_result.ok = false;
  //                 // Track failed operations by their indices in current batch
  //                 const failed_indices_in_batch = new Set(write_errors.map(err => err.index));
  //                 // Update errors for failed operations
  //                 for (const error of write_errors) {
  //                     if (error.index < pending_operations.length) {
  //                         const original_index = pending_operations[error.index].original_index;
  //                         latest_errors.set(original_index, {
  //                             ...error,
  //                             index: original_index,
  //                             attempt: attempt_count,
  //                             timestamp: new Date().toISOString()
  //                         });
  //                     }
  //                 }
  //                 // Mark operations as succeeded if they weren't in the error list
  //                 pending_operations.forEach((item, batch_index) => {
  //                     if (!failed_indices_in_batch.has(batch_index)) {
  //                         const original_index = item.original_index;
  //                         operation_status.set(original_index, true);
  //                         succeeded_in_this_attempt.add(original_index);
  //                         // Clear any previous errors for this operation
  //                         latest_errors.delete(original_index);
  //                     }
  //                 });
  //                 // Filter pending operations to only include failed ones
  //                 if (retries >= 0 && attempt_count < max_attempts) {
  //                     pending_operations = pending_operations.filter((_, index) => failed_indices_in_batch.has(index));
  //                     // Add exponential backoff for retries
  //                     if (pending_operations.length > 0) {
  //                         const delay = Math.min(1000 * Math.pow(2, attempt_count - 1), 5000);
  //                         await new Promise(resolve => setTimeout(resolve, delay));
  //                     }
  //                 } else {
  //                     // No more retries, exit
  //                     break;
  //                 }
  //             } else {
  //                 // All operations in this batch succeeded
  //                 pending_operations.forEach(item => {
  //                     operation_status.set(item.original_index, true);
  //                     succeeded_in_this_attempt.add(item.original_index);
  //                     // Clear any previous errors for these operations
  //                     latest_errors.delete(item.original_index);
  //                 });
  //                 pending_operations = [];
  //             }
  //             // Log successful recoveries for monitoring
  //             if (attempt_count > 1 && succeeded_in_this_attempt.size > 0) {
  //                 console.log(`[BulkOps] Recovered ${succeeded_in_this_attempt.size} operations on attempt ${attempt_count}`);
  //             }
  //         } catch (error: any) {
  //             aggregated_result.ok = false;
  //             // Track error for all pending operations
  //             const affected_indices = pending_operations.map(item => item.original_index);
  //             for (const original_index of affected_indices) {
  //                 latest_errors.set(original_index, {
  //                     message: error.message || 'Unknown error',
  //                     code: error.code,
  //                     attempt: attempt_count,
  //                     index: original_index,
  //                     timestamp: new Date().toISOString(),
  //                     type: 'batch_error'
  //                 });
  //             }
  //             // If retries are disabled or we've exhausted retries, throw
  //             if (retries < 0 || attempt_count >= max_attempts) {
  //                 break;
  //             }
  //             // Add exponential backoff before retry
  //             const delay = Math.min(1000 * Math.pow(2, attempt_count - 1), 5000);
  //             await new Promise(resolve => setTimeout(resolve, delay));
  //         }
  //     }
  //     // Final reconciliation: determine which operations ultimately failed
  //     aggregated_result.failed_operations = [];
  //     aggregated_result.errors = [];
  //     for (const [index, succeeded] of operation_status.entries()) {
  //         if (!succeeded) {
  //             aggregated_result.failed_operations.push(index);
  //             const error = latest_errors.get(index);
  //             if (error) {
  //                 aggregated_result.errors.push(error);
  //             }
  //         }
  //     }
  //     // Sort failed operations for consistency
  //     aggregated_result.failed_operations.sort((a, b) => a - b);
  //     // Clean up errors array if empty
  //     if (aggregated_result.errors.length === 0) {
  //         delete (aggregated_result as any).errors;
  //     }
  //     // If we still have failed operations after all retries, include detailed error
  //     if (aggregated_result.failed_operations.length > 0) {
  //         const error = new Error(
  //             `Bulk operations partially failed: ${aggregated_result.failed_operations.length} of ${operations.length} operations could not be completed after ${attempt_count} attempts. ` +
  //             `Successfully processed: ${operations.length - aggregated_result.failed_operations.length} operations.`
  //         );
  //         (error as any).aggregated_result = aggregated_result;
  //         (error as any).retry_attempts = attempt_count;
  //         (error as any).success_rate = ((operations.length - aggregated_result.failed_operations.length) / operations.length * 100).toFixed(2) + '%';
  //         // Only throw if all operations failed
  //         if (aggregated_result.failed_operations.length === operations.length) {
  //             throw error;
  //         }
  //         // Log partial failure for monitoring
  //         console.warn(`[BulkOps] Partial failure:`, (error as any).success_rate, 'success rate');
  //     } else {
  //         // Clean up failed operations array.
  //         delete (aggregated_result as any).failed_operations;
  //     }
  //     return aggregated_result;
  // }
  /**
   * Execute bulk write operations.
   * @param operations Array of bulk write operations.
   * @returns MongoDB BulkWriteResult.
   */
  async bulk_operations(operations = []) {
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    this.assert_not_finalized();
    if (!Array.isArray(operations)) {
      throw new TypeError("Operations must be an array");
    }
    if (operations.length > 1e5) {
      throw new Error("Bulk operations exceed MongoDB limit of 100000");
    }
    if (this.ttl_enabled) {
      const now = /* @__PURE__ */ new Date();
      for (const op of operations) {
        if (op.insertOne?.document && typeof op.insertOne.document === "object") {
          if (this.sliding_ttl || op.insertOne.document._ttl_timestamp == null) {
            op.insertOne.document._ttl_timestamp = now;
          }
          continue;
        }
        if (op.replaceOne?.replacement && typeof op.replaceOne.replacement === "object") {
          if (this.sliding_ttl) {
            op.replaceOne.replacement._ttl_timestamp = now;
          } else if (op.replaceOne.upsert && op.replaceOne.replacement._ttl_timestamp == null) {
            op.replaceOne.replacement._ttl_timestamp = now;
          }
          continue;
        }
        if (op.updateOne?.update) {
          this._apply_ttl_to_operation(op.updateOne.update, op.updateOne.upsert);
          continue;
        }
        if (op.updateMany?.update) {
          this._apply_ttl_to_operation(op.updateMany.update, op.updateMany.upsert);
          continue;
        }
      }
    }
    return await this._col.bulkWrite(operations, this.get_operation_options({ ordered: true }));
  }
  async aggregate(pipeline, opts) {
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    this.assert_not_finalized();
    const out = this._col.aggregate(pipeline, this.get_operation_options());
    if (opts?.cursor) {
      return out;
    }
    const arr = await out.toArray();
    if (opts?.clean === true) {
      return arr.map((doc) => this.clean(doc)).filter((x) => x != null);
    }
    return arr;
  }
  // ---------------------------------------------------------
  // Sessions & transactions.
  // ---------------------------------------------------------
  /**
   * Start a new transaction by creating a TransactionCollection instance.
   * @returns A new TransactionCollection instance with transaction capabilities.
   */
  async start_transaction() {
    if (!this.db.client) {
      throw new Error("Database client is not initialized, ensure the parent 'volt.Server' is initialized.");
    }
    if (!this.initialized) {
      await this.init();
    }
    this.assert_init();
    return new TransactionCollection({
      derived_collection: this,
      transaction_based: true
    });
  }
}
(function(Collection2) {
  class WriteError extends Error {
    query;
    constructor(message, query) {
      super(message);
      this.name = "WriteError";
      this.query = query;
      Object.setPrototypeOf(this, new.target.prototype);
    }
  }
  Collection2.WriteError = WriteError;
  class DeleteError extends Error {
    query;
    constructor(message, query) {
      super(message);
      this.name = "DeleteError";
      this.query = query;
      Object.setPrototypeOf(this, new.target.prototype);
    }
  }
  Collection2.DeleteError = DeleteError;
  let Projection;
  (function(Projection2) {
    function init(projection) {
      if (Array.isArray(projection)) {
        const p = {};
        for (let i = 0; i < projection.length; i++) {
          p[projection[i]] = 1;
        }
        return p;
      } else {
        const p = projection;
        let has_include = false;
        let has_exclude = false;
        for (const [k, v] of Object.entries(p)) {
          if (v === 1 || v === true) {
            if (k !== "_id")
              has_include = true;
          } else if (v === 0 || v === false) {
            if (k !== "_id")
              has_exclude = true;
          } else {
            throw new Error(`Invalid projection value for "${k}": expected 0, 1, true or false.`);
          }
          if (has_include && has_exclude) {
            throw new Error("Invalid projection: cannot mix inclusion and exclusion (except for _id).");
          }
        }
        return p;
      }
    }
    Projection2.init = init;
  })(Projection = Collection2.Projection || (Collection2.Projection = {}));
  {
  }
})(Collection || (Collection = {}));
class TransactionCollection extends Collection {
  async commit() {
    const session = this._session;
    if (!session)
      throw new Error("No active session for this transaction.");
    if (this.is_finalized_transaction)
      throw new Error("Transaction has already been finalized.");
    const max_retries_unknown = 10;
    const base_delay_ms = 20;
    const max_delay_ms = 1e3;
    for (let attempt = 0; attempt <= max_retries_unknown; attempt++) {
      try {
        await session.commitTransaction();
        this.is_finalized_transaction = true;
        try {
          await session.endSession();
        } finally {
          this._session = void 0;
        }
        return;
      } catch (err) {
        const has_label = (label) => {
          if (!err || typeof err !== "object") {
            return false;
          }
          if (typeof err?.hasErrorLabel === "function") {
            try {
              return !!err.hasErrorLabel(label);
            } catch {
            }
          }
          return Array.isArray(err?.errorLabels) && err.errorLabels.includes(label);
        };
        const unknown_commit = has_label("UnknownTransactionCommitResult");
        const transient = has_label("TransientTransactionError");
        const is_networkish = err?.name === "MongoNetworkError" || err?.name === "MongoNetworkTimeoutError";
        if ((unknown_commit || is_networkish) && attempt < max_retries_unknown) {
          const delay = Math.min(max_delay_ms, base_delay_ms * Math.pow(2, attempt));
          await new Promise((res) => setTimeout(res, delay));
          continue;
        }
        if (transient) {
          try {
            await session.abortTransaction();
          } catch {
          }
          this.is_finalized_transaction = true;
          try {
            await session.endSession();
          } finally {
            this._session = void 0;
          }
          const e = new Error(`TransientTransactionError during commit; transaction aborted. Retry the entire transaction. ${err?.message ?? ""}`);
          e.codeName = err?.codeName;
          e.errorLabels = err?.errorLabels;
          throw e;
        }
        if ((unknown_commit || is_networkish) && attempt >= max_retries_unknown) {
          this.is_finalized_transaction = true;
          try {
            await session.endSession();
          } finally {
            this._session = void 0;
          }
          const e = new Error(`Commit failed after ${attempt + 1} attempt(s) with unknown outcome; last error: ${err?.message ?? err}`);
          e.codeName = err?.codeName;
          e.errorLabels = err?.errorLabels;
          throw e;
        }
        this.is_finalized_transaction = true;
        try {
          await session.endSession();
        } finally {
          this._session = void 0;
        }
        throw err;
      }
    }
  }
  async abort() {
    const session = this._session;
    if (!session)
      throw new Error("No active session for this transaction.");
    if (this.is_finalized_transaction)
      throw new Error("Transaction has already been finalized.");
    const max_retries = 5;
    const base_delay_ms = 20;
    const max_delay_ms = 500;
    for (let attempt = 0; attempt <= max_retries; attempt++) {
      try {
        await session.abortTransaction();
        this.is_finalized_transaction = true;
        try {
          await session.endSession();
        } finally {
          this._session = void 0;
        }
        return;
      } catch (err) {
        if (err?.codeName === "NoSuchTransaction") {
          this.is_finalized_transaction = true;
          try {
            await session.endSession();
          } finally {
            this._session = void 0;
          }
          return;
        }
        const has_label = (label) => {
          if (!err || typeof err !== "object") {
            return false;
          }
          if (typeof err?.hasErrorLabel === "function") {
            try {
              return !!err.hasErrorLabel(label);
            } catch {
            }
          }
          return Array.isArray(err?.errorLabels) && err.errorLabels.includes(label);
        };
        const transient = has_label("TransientTransactionError");
        const is_networkish = err?.name === "MongoNetworkError" || err?.name === "MongoNetworkTimeoutError";
        if ((transient || is_networkish) && attempt < max_retries) {
          const delay = Math.min(max_delay_ms, base_delay_ms * Math.pow(2, attempt));
          await new Promise((res) => setTimeout(res, delay));
          continue;
        }
        this.is_finalized_transaction = true;
        try {
          await session.endSession();
        } finally {
          this._session = void 0;
        }
        throw err;
      }
    }
  }
  // /**
  //  * Commit the transaction.
  //  * @throws Error if the transaction has already been finalized.
  //  */
  // async commit(): Promise<void> {
  //     if (!this._session) {
  //         throw new Error("No active session for this transaction.");
  //     }
  //     if (this.is_finalized_transaction) {
  //         throw new Error("Transaction has already been finalized.");
  //     }
  //     await this._session.commitTransaction();
  //     this.is_finalized_transaction = true;
  //     await this._session.endSession();
  // }
  // /**
  //  * Abort the transaction.
  //  * @throws Error if the transaction has already been finalized.
  //  */
  // async abort(): Promise<void> {
  //     if (!this._session) {
  //         throw new Error("No active session for this transaction.");
  //     }
  //     if (this.is_finalized_transaction) {
  //         throw new Error("Transaction has already been finalized.");
  //     }
  //     await this._session.abortTransaction();
  //     this.is_finalized_transaction = true;
  //     await this._session.endSession();
  // }
  /**
   * Cleanup method for proper resource management
   * Can be called manually or via async disposal
   *
   * @warning This method aborts the transaction if it is still active.
   */
  async cleanup() {
    if (this._session && !this.is_finalized_transaction) {
      try {
        await this.abort();
      } catch (error) {
        console.error("Failed to abort transaction during cleanup:", error);
        if (this._session) {
          try {
            await this._session.endSession();
          } catch (endError) {
            console.error("Failed to end session during cleanup:", endError);
          }
        }
      } finally {
        this.is_finalized_transaction = true;
      }
    }
  }
  // Support for async disposal (TC39 proposal)
  async [Symbol.asyncDispose]() {
    await this.cleanup();
  }
  /**
   * Check if the transaction is still active (not finalized).
   * @returns True if the transaction is active, false otherwise.
   */
  is_active() {
    return this.is_transaction && !this.is_finalized_transaction && this._session != null;
  }
}
async function test_save() {
  const res = void await test_col.save(
    { uid: "" },
    // @ts-ignore
    { uid: "" },
    { return: true }
  );
  const res_no_throw = await test_col.save(
    { uid: "" },
    // @ts-ignore
    { uid: "" },
    { return: true, throw: false, bulk: false }
  );
  function init_save_opts(opts) {
    return opts;
  }
  const a = init_save_opts({ bulk: true, upsert: true });
  const b = init_save_opts({ return: false, upsert: true });
  const b2 = init_save_opts({ return: false, throw: true });
  const b3 = init_save_opts({ return: false, throw: false });
  const c = init_save_opts({ return: true, upsert: false, throw: false });
  const d = init_save_opts({ return: true, upsert: true, throw: true });
  const e = init_save_opts({ return: true, upsert: true, bulk: true });
  const res_bulk_op = await test_col.save({ uid: "" }, { uid: "" }, { bulk: true });
  const res_undef = await test_col.save({ uid: "" }, { uid: "" });
  const res_doc = await test_col.save({ uid: "" }, { uid: "" }, { return: true });
  const res_doc_or_undef = await test_col.save({ uid: "" }, { uid: "" }, { return: true, throw: false, upsert: false });
  async function save_wrapper(doc, bulk) {
    return await test_col.save({ id: "test" }, { $set: doc }, { bulk });
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Collection,
  TransactionCollection
});
