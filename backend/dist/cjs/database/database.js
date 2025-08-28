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
  client_opts;
  server;
  client;
  _db;
  collections = /* @__PURE__ */ new Map();
  _connect_promise;
  // System.
  _listed_cols;
  constructor({ uri, client, _server }) {
    this.uri = uri;
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
  async connect() {
    try {
      if (this.client == null) {
        throw new Error("MongoDB client is not initialized.");
      }
      await this.client.connect();
      this._db = this.client.db();
      this.connected = true;
      this.server.log(1, "Connected to the database.");
    } catch (error) {
      this.server.log.error(error);
      throw new Error("Error connecting to the database");
    }
  }
  /** Initialize. */
  async initialize() {
    const opts = this.client_opts ?? {};
    opts.serverApi ??= {};
    opts.serverApi.version ??= import_mongodb.ServerApiVersion.v1;
    opts.serverApi.strict ??= true;
    opts.serverApi.deprecationErrors ??= true;
    this.client = new import_mongodb.MongoClient(this.uri, opts);
    if (this.server.production === false) {
      this._connect_promise = this.connect();
    } else {
      await this.connect();
    }
  }
  /** Ensure connection. */
  async ensure_connection() {
    if (this.connected)
      return;
    if (this._connect_promise)
      return this._connect_promise;
    this._connect_promise = this.connect();
    return this._connect_promise;
  }
  // Close.
  async close() {
    this.server.log(0, "Stopping the database.");
    await this.client?.close();
  }
  /**
   * {Create Collection}
   * Initialize database collection.
   * @note When called multiple times with the same name, it will return the same cached collection.
   * @param info.unique If true, an error will be thrown if the collection already exists.
   *                    By default it is false.
   */
  collection(info) {
    let name;
    let unique = false;
    let args;
    if (typeof info === "string") {
      name = info;
    } else {
      unique = info.unique || false;
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
