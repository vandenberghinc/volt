/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh.
 */
// ---------------------------------------------------------
// Libraries.
// External imports.
import { MongoClient, ServerApiVersion } from 'mongodb';
// Imports.
import { Collection } from "./collection.js";
/**
 * The MongoDB database class, accessable under `Server.db`.
 *
 * @note This class is initialized under server property `db` when the server is started with the `database` option.
 *
 * @nav Database
 * @docs
*/
export class Database {
    static constructor_scheme = {
        uri: { type: "string", default: null },
        database_name: { type: "string", default: undefined },
        client: { type: "object", default: {} },
        _server: { type: ["object", "undefined"] },
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
    collections = new Map();
    // System.
    _listed_cols;
    constructor({ uri, database, client, _server, }) {
        this.uri = uri;
        this.database_name = database;
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
        //     ({uri, config, start_args, config, client} = vlib.Schema.verify({
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
        //         log_source.mkdir_sync({ recursive: true });
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
    connect_promise;
    async connect() {
        if (this.connect_promise) {
            return this.connect_promise;
        }
        return this.connect_promise = new Promise(async (resolve, reject) => {
            try {
                if (this.client == null) {
                    throw new Error('MongoDB client is not initialized.');
                }
                this.server.log(3, "Connecting to the database client.");
                await this.client.connect();
                this.server.log(3, "Connecting to the database.");
                this._db = this.client.db(this.database_name);
                this.connected = true;
                this.server.log(1, "Connected to the database.");
                resolve();
            }
            catch (error) {
                this.server.log.error(error);
                reject(new Error('Error connecting to the database'));
            }
        });
    }
    /**
     * Initialize the database.
     * @note This is done automatically by initializing the server.
     * @docs
     */
    async initialize() {
        this.server.log(3, "Initializing the database.");
        // Initialize client (same as before)
        const opts = this.client_opts ?? {};
        opts.serverApi ??= {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        };
        if (typeof opts.serverApi === "object") {
            opts.serverApi.version ??= ServerApiVersion.v1;
            opts.serverApi.strict ??= true;
            opts.serverApi.deprecationErrors ??= true;
        }
        // for speeding up connect().
        opts.serverSelectionTimeoutMS = 1000;
        opts.connectTimeoutMS = 1000;
        this.client = new MongoClient(this.uri, opts);
        // In production we instanlty connect and initialize all columns.
        if (this.server.production) {
            await this.connect(); // block in prod
            // In production we also wanna initialize all collections right away.
            for (const col of this.collections.values()) {
                await col.init();
            }
        }
        this.server.log(3, "Database initialized.");
    }
    /**
     * Ensure the database connection is established.
     * @docs
     */
    async ensure_connection() {
        if (this.connected)
            return;
        if (this.connect_promise)
            return this.connect_promise;
        return this.connect();
    }
    /**
     * Close the database connection.
     * @docs
     */
    async close() {
        this.server.log(0, "Stopping the database.");
        await this.client?.close();
        this.connect_promise = undefined;
    }
    /**
     * Initialize database collection.
     * @note When called multiple times with the same name, it will return the same cached collection.
     * @param info.unique If true, an error will be thrown if the collection already exists.
     *                    Defauls to `true`.
     *
     * @docs
     */
    collection(info) {
        // Set name by single string argument.
        let name;
        let unique = true;
        let args;
        if (typeof info === "string") {
            name = info;
        }
        else {
            unique = info.unique ?? true;
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
    }
}
