/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh.
 */
import { MongoClient, ServerApiVersion } from 'mongodb';
// Imports.
import { logger } from "../logger.js";
import { Collection } from "./collection.js";
/** Debug */
const { log } = logger;
// ---------------------------------------------------------
// Database.
/*  @docs:
    @nav: Backend
    @chapter: Database
    @title: Database
    @desc:
        The MongoDB database class, accessable under `Server.db`.

        The database class can be utilized in two ways.

        1. You only provide the `uri` parameter to access an already running mongodb database.

        2. You provide parameters `config` and `start_args` to start and optionally create the database.

    @warning:
        Do not forget to enable TLS when using the `config` parameter.
    @param:
        @name: uri
        @desc: The mongodb server uri.
        @type: string
    @param:
        @name: source
        @desc: The source path of the database directory, by default path `$server_source/.db` will be used.
        @type: null, string
    @param:
        @name: config
        @desc: The json data for the mongodb config file.
        @type: null, string
    @param:
        @name: start_args
        @desc: The mongod database start command arguments.
        @type: null, array[string]
    @param:
        @name: client
        @desc: The MongoClient options.
        @type: null, object
*/
export class Database {
    static constructor_scheme = {
        uri: { type: "string", default: null },
        source: { type: "string", default: null },
        config: { type: "object", default: {} },
        start_args: { type: "array", default: [] },
        client: { type: "object", default: {} },
        collections: { type: "array", default: [], value_scheme: {
                type: ["string", "object"],
                preprocess: (info) => typeof info === "string" ? { name: info } : info,
                scheme: {
                    name: Collection.constructor_scheme.name,
                    ttl: Collection.constructor_scheme.ttl,
                    indexes: Collection.constructor_scheme.indexes,
                },
            } },
        preview: { type: "boolean", default: true },
        preview_ip_whitelist: { type: "array", default: [] },
        daemon: { type: ["object", "boolean"], default: {} },
        _server: { type: ["object", "undefined"] },
    };
    // Attributes.
    uri;
    client_opts;
    server;
    client;
    _db;
    collections = new Map();
    _connect_promise;
    // System.
    _listed_cols;
    constructor({ uri, client, _server, }) {
        this.uri = uri;
        this.client_opts = client;
        this.server = _server;
        // DEPRECATED
        // source?: string,
        // config?: Record<string, any>,
        // start_args?: string[],
        // preview?: boolean,
        // preview_ip_whitelist?: string[],
        // daemon?: Record<string, any> | boolean,
        // Checks.
        // if (!_server || (_server.is_primary && uri == null)) {
        //     ({uri, config, start_args, config, client} = vlib.Scheme.verify({
        //         object: arguments[0],
        //         check_unknown: true, 
        //         throw_err: true,
        //         scheme: Database.constructor_scheme
        //     }));
        // }
        // Arguments.
        // this.preview = preview;
        // this.preview_ip_whitelist = preview_ip_whitelist;
        // this.config = config || {};
        // this.source = source != null ? new vlib.Path(source) : _server?.source.join(".db");
        // this.start_args = start_args;
        // Initialize the service daemon.
        // if (this.server?.daemon && daemon !== false) {
        //     const log_source = this.server.source.join(".logs");
        //     if (!log_source.exists()) {
        //         log_source.mkdir_sync();
        //     }
        //     if (!this.server) {
        //         throw new Error("Parameter 'Database._server' must be defined for this behaviour.");
        //     }
        //     this.daemon = new vlib.Daemon({
        //         name: this.server.daemon.name + ".mongodb",
        //         user: (daemon as Record<string, any>).user || this.server.daemon.user,
        //         group: (daemon as Record<string, any>).group || this.server.daemon.group,
        //         command: "mongod",
        //         cwd: this.server.daemon.cwd,
        //         args: ["--config", this.source!.join("mongod.json").str(), ...this.start_args],
        //         env: (daemon as Record<string, any>).env || this.server.daemon.env,
        //         description: (daemon as Record<string, any>).description || `Service daemon for the mongo database of website ${this.server.domain}.`,
        //         auto_restart: true,
        //         logs: (daemon as Record<string, any>).logs || log_source.join("logs.mongodb").str(),
        //         errors: (daemon as Record<string, any>).errors || log_source.join("errors.mongodb").str(),
        //     })
        // }
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
                throw new Error('MongoDB client is not initialized.');
            }
            await this.client.connect();
            this._db = this.client.db();
            this.connected = true;
            log(1, "Connected to the database.");
        }
        catch (error) {
            console.error(error);
            throw new Error('Error connecting to the database');
        }
    }
    /** Initialize. */
    async initialize() {
        // Initialize client (same as before)
        const opts = this.client_opts ?? {};
        opts.serverApi ??= {};
        opts.serverApi.version ??= ServerApiVersion.v1;
        opts.serverApi.strict ??= true;
        opts.serverApi.deprecationErrors ??= true;
        this.client = new MongoClient(this.uri, opts);
        // In development we start the connection in the background so the server
        // can finish booting immediately. In production we still block.
        if (this.server.production === false) {
            this._connect_promise = this.connect(); // don’t await
        }
        else {
            await this.connect(); // block in prod
        }
    }
    /** Ensure connection. */
    async ensure_connection() {
        if (this.connected)
            return; // already ready
        if (this._connect_promise)
            return this._connect_promise; // wait for bg task
        this._connect_promise = this.connect(); // cold-start (unlikely)
        return this._connect_promise;
    }
    // Close.
    async close() {
        log(0, "Stopping the database.");
        await this.client?.close();
    }
    /**
     * {Create Collection}
     * Initialize database collection.
     * @note When called multiple times with the same name, it will return the same cached collection.
     * @param info.unique If true, an error will be thrown if the collection already exists.
     *                    By default it is false.
     */
    async collection(info) {
        // Set name by single string argument.
        let name;
        let unique = false;
        let args;
        if (typeof info === "string") {
            name = info;
        }
        else {
            unique = info.unique || false;
            name = info.name;
            args = info;
        }
        // Check collection.
        if (this.collections.has(name)) {
            if (unique) {
                throw new Error(`Collection "${name}" already exists.`);
            }
            return this.collections.get(name);
        }
        // Create collection.
        const col = new Collection({
            name,
            db: this,
            ...args,
        });
        this.collections.set(name, col);
        return col;
        // Logs.
        // debug(2, `Initializing collection "${name}".`);
        // // Check if the collection exists
        // if (this._listed_cols == null) {
        //     this._listed_cols = await this.db.listCollections().toArray();
        // }
        // if (!this._listed_cols.find(x => x.name === name)) {
        //     log(0, `Creating collection "${name}".`);
        //     await this.db.createCollection(name);
        // }
        // // Create collection.
        // const col: Collection = Collection.create({
        //     ...info,
        //     collection: this.db.collection(name),
        // });
        // this.collections.set(name, col);
        // return col;
    }
}
