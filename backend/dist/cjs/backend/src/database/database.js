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
  Database: () => Database
});
module.exports = __toCommonJS(stdin_exports);
var import_mongodb = require("mongodb");
var import_collection = require("./collection.js");
class Database {
  static constructor_scheme = {
    uri: { type: "string", default: null },
    database_name: { type: "string", default: void 0 },
    client: { type: "object", default: {} },
    _server: { type: ["object", "undefined"] }
    // source: {type: "string", default: null},
    // config: {type: "object", default: {}},
    // start_args: {type: "array", default: []},
    // preview: {type: "boolean", default: true},
    // preview_ip_whitelist: {type: "array", default: []},
    // daemon: {type: ["object", "boolean"], default: {}},
  };
  // Attributes.
  uri;
  database_name;
  client_opts;
  server;
  client;
  _db;
  collections = /* @__PURE__ */ new Map();
  // System.
  _listed_cols;
  constructor({ uri, database, client, _server }) {
    this.uri = uri;
    this.database_name = database;
    this.client_opts = client;
    this.server = _server;
  }
  // Get the database.
  async db() {
    await this.ensure_connection();
    return this._db;
  }
  // Connect.
  connected = false;
  connect_promise;
  async connect() {
    if (this.connect_promise) {
      return this.connect_promise;
    }
    return this.connect_promise = new Promise(async (resolve, reject) => {
      try {
        if (this.client == null) {
          throw new Error("MongoDB client is not initialized.");
        }
        this.server.log(3, "Connecting to the database client.");
        await this.client.connect();
        this.server.log(3, "Connecting to the database.");
        this._db = this.client.db(this.database_name);
        this.connected = true;
        this.server.log(1, "Connected to the database.");
        resolve();
      } catch (error) {
        this.server.log.error(error);
        reject(new Error("Error connecting to the database"));
      }
    });
  }
  /** Initialize. */
  async initialize() {
    this.server.log(3, "Initializing the database.");
    const opts = this.client_opts ?? {};
    opts.serverApi ??= {
      version: import_mongodb.ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true
    };
    if (typeof opts.serverApi === "object") {
      opts.serverApi.version ??= import_mongodb.ServerApiVersion.v1;
      opts.serverApi.strict ??= true;
      opts.serverApi.deprecationErrors ??= true;
    }
    opts.serverSelectionTimeoutMS = 1e3;
    opts.connectTimeoutMS = 1e3;
    this.client = new import_mongodb.MongoClient(this.uri, opts);
    if (this.server.production) {
      await this.connect();
      for (const col of this.collections.values()) {
        await col.init();
      }
    }
    this.server.log(3, "Database initialized.");
  }
  /** Ensure connection. */
  async ensure_connection() {
    if (this.connected)
      return;
    if (this.connect_promise)
      return this.connect_promise;
    return this.connect();
  }
  // Close.
  async close() {
    this.server.log(0, "Stopping the database.");
    await this.client?.close();
    this.connect_promise = void 0;
  }
  /**
   * {Create Collection}
   * Initialize database collection.
   * @note When called multiple times with the same name, it will return the same cached collection.
   * @param info.unique If true, an error will be thrown if the collection already exists.
   *                    Defauls to `true`.
   */
  collection(info) {
    let name;
    let unique = true;
    let args;
    if (typeof info === "string") {
      name = info;
    } else {
      unique = info.unique ?? true;
      name = info.name;
      args = info;
    }
    if (this.collections.has(name)) {
      if (unique) {
        throw new Error(`Collection "${name}" already exists.`);
      }
      return this.collections.get(name);
    }
    const col = new import_collection.Collection({
      name,
      db: this,
      ...args
    });
    this.collections.set(name, col);
    return col;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Database
});
