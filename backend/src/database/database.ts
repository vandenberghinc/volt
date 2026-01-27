/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Libraries.

// External imports.
import { Db, MongoClient, ServerApiVersion } from 'mongodb';
import * as mongodb from "mongodb"

// Imports.
import { Collection, TransactionCollection } from "./collection.js";
import type { Server } from "../server.js";

// ---------------------------------------------------------
// Database.

export namespace Database {

    /**
     * Options for constructing a {@link Database} object.
     * 
     * @docs
     */
    export interface Opts {
        /** The database URI. */
        uri: string,
        /** The database name, if not provided it will the database name from the connection URI will be used. */
        database?: string,
        /** The additional cient options. */
        client?: mongodb.MongoClientOptions,
    }
}

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
        uri: {type: "string", default: null},
        database_name: {type: "string", default: undefined},
        client: {type: "object", default: {}},
        _server: {type: ["object", "undefined"]},

        // source: {type: "string", default: null},
        // config: {type: "object", default: {}},
        // start_args: {type: "array", default: []},
        // preview: {type: "boolean", default: true},
        // preview_ip_whitelist: {type: "array", default: []},
        // daemon: {type: ["object", "boolean"], default: {}},
    }

    // Attributes.
    uri: string;
    database_name: undefined | string;
    client_opts?: mongodb.MongoClientOptions;
    server: Server;
    client?: MongoClient;
    _db?: Db;
    collections = new Map<string, Collection<any>>();

    // System.
    public _listed_cols: any;

    constructor({
        uri,
        database,
        client,
        _server,
    }: Database.Opts & { _server: Server }) {
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
    async db(): Promise<Db> {
        await this.ensure_connection();
        return this._db!;
    }

    // Connect.
    public connected: boolean = false;
    private connect_promise?: Promise<void>;
    async connect(): Promise<void> {
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
            } catch (error) {
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
    async initialize(): Promise<void> {
        this.server.log(3, "Initializing the database.");
        // Initialize client (same as before)
        const opts = this.client_opts ?? {};
        opts.serverApi ??= {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
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
    async ensure_connection(): Promise<void> {
        if (this.connected) return;
        if (this.connect_promise) return this.connect_promise;
        return this.connect();
    }

    /**
     * Close the database connection.
     * @docs
     */
    async close(): Promise<void> {
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
    collection<Data extends mongodb.Document = mongodb.Document>(info: 
        string |
        (Omit<Collection.Opts<Data>, "db"> & {
            unique?: boolean;
        })
    ): Collection<Data> {
        
        // Set name by single string argument.
        let name: string;
        let unique = true;
        let args: Omit<Collection.Opts<Data>, "db"> | undefined;
        if (typeof info === "string") {
            name = info;
        } else {
            unique = info.unique ?? true;
            name = info.name;
            args = info;
        }

        // Check collection.
        if (this.collections.has(name)) {
            if (unique) {
                throw new Error(`Collection "${name}" already exists.`);
            }
            return this.collections.get(name)!;
        }

        // Create collection.
        const col: Collection<Data> = new Collection<Data>({
            name,
            db: this,
            ...args,
        })
        this.collections.set(name, col);
        return col;

    }

    // DEPRECATED
    // _collections: {
    //     name: string,
    //     ttl?: number | null,
    //     indexes?: string[] | IndexOptions[],
    // }[] = [];
    // preview: boolean;
    // preview_ip_whitelist: string[];
    // source: vlib.Path | undefined; // Using vlib.Path type
    // proc?: ChildProcess;
    // daemon?: any;
    // start_args: string[];
    // config: Record<string, any>;

    // DEPRECATED
    // _start_mongo(): void {

    // // Set default config.
    // if (this.config.systemLog === undefined) { this.config.systemLog = {}; }

    // this.config.systemLog.path = this.source?.join("mongod.log").str()

    // if (this.config.systemLog.destination === undefined) {
    //     this.config.systemLog.destination = "file";
    // }
    // if (this.config.systemLog.logAppend === undefined) {
    //     this.config.systemLog.logAppend = true;
    // }
    // if (this.config.systemLog.logRotate === undefined) {
    //     this.config.systemLog.logRotate = "reopen";
    // }
    // if (this.config.systemLog.verbosity === undefined && this.server) {
    //     this.config.systemLog.verbosity = this.server.production ? 0 : 1;
    // }

    // if (this.config.storage === undefined) { this.config.storage = {}; }

    // if (this.source) {
    //     const db_path = this.source.join("db");
    //     this.config.storage.dbPath = db_path.str()
    //     if (!db_path.exists()) {
    //         db_path.mkdir_sync({ recursive: true });
    //     }

    //     if (this.config.processManagement === undefined) { this.config.processManagement = {}; }
    //     this.config.processManagement.pidFilePath = this.source.join("mongod.pid").str()
    // }

    // if (this.config.net === undefined) { this.config.net = {}; }
    // if (this.config.net.port === undefined) { this.config.net.port = 27017; }
    // if (this.config.net.bindIp === undefined) { this.config.net.bindIp = "127.0.0.1"; }

    // // Mode 2: Start database.
    // if (this.server?.is_primary && this.uri == null) {
    //     // Create the database.
    //     if (!this.source!.exists()) {
    //         this.source!.mkdir_sync({ recursive: true });
    //     }

    //     // Set the uri.
    //     if (this.uri == null) {
    //         this.uri = `mongodb://${this.config.net.bindIp}:${this.config.net.port}/main`
    //     }

    //     // Save the config.
    //     const config_path = this.source!.join("mongod.json");
    //     config_path.save_sync(JSON.stringify(this.config));

    //     // Start the database.
    //     this.proc = spawn(
    //         "mongod",
    //         ["--config", config_path.str(), ...this.start_args],
    //         {
    //             stdio: "pipe",
    //             detached: true,
    //             env: {...process.env},
    //         },
    //     )
    //     this.proc.stdout?.on('data', (data) => {
    //         console.log(data.toString());
    //     })
    //     this.proc.stderr?.on('data', (data) => {
    //         console.error(data.toString());
    //     })
    //     this.proc.on("error", (code, signal) => {
    //         console.error(`MongoDB crashed with error signal ${signal}.`);
    //         process.exit(code);
    //     })
    // }

    // // Assign URI.
    // else if (this.server && !this.server.is_primary && this.uri == null) {
    //     this.uri = `mongodb://${this.config.net.bindIp}:${this.config.net.port}/main`
    // }

    // }
}
