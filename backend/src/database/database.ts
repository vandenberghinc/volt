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

    /** The database constructor options. */
    export interface Opts {
        /** The database URI. */
        uri: string,
        /** The additional cient options. */
        client?: Record<string, any>,
    }
}

/**
 * The MongoDB database class, accessable under `Server.db`.
 * @docs
 * @nav Backend/Database
*/
export class Database {
    static constructor_scheme = {
        uri: {type: "string", default: null},
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
    client_opts?: Record<string, any>;
    server: Server;
    client?: MongoClient;
    _db?: Db;
    collections = new Map<string, Collection<any>>();

    private _connect_promise?: Promise<void>;

    // System.
    public _listed_cols: any;

    constructor({
        uri,
        client,
        _server,
    }: Database.Opts & { _server: Server }) {
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
    async connect(): Promise<void> {
        try {
            if (this.client == null) {
                throw new Error('MongoDB client is not initialized.');
            }
            await this.client.connect();
            this._db = this.client.db();
            this.connected = true;
            this.server.log(1, "Connected to the database.");
        } catch (error) {
            this.server.log.error(error);
            throw new Error('Error connecting to the database');
        }
    }

    /** Initialize. */
    async initialize(): Promise<void> {
        // Initialize client (same as before)
        const opts = this.client_opts ?? {};
        opts.serverApi ??= {}
        opts.serverApi.version ??= ServerApiVersion.v1;
        opts.serverApi.strict ??= true;
        opts.serverApi.deprecationErrors ??= true;
        this.client = new MongoClient(this.uri, opts);

        // In development we start the connection in the background so the server
        // can finish booting immediately. In production we still block.
        if (this.server.production === false) {
            this._connect_promise = this.connect();         // don’t await
        } else {
            await this.connect();                           // block in prod
        }
    }


    /** Ensure connection. */
    async ensure_connection(): Promise<void> {
        if (this.connected) return;                         // already ready
        if (this._connect_promise) return this._connect_promise; // wait for bg task
        this._connect_promise = this.connect();             // cold-start (unlikely)
        return this._connect_promise;
    }

    // Close.
    async close(): Promise<void> {
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
    collection<Data extends mongodb.Document = mongodb.Document>(info: 
        string |
        (Omit<Collection.Opts<Data>, "db"> & {
            unique?: boolean;
        })
    ): Collection<Data> {
        
        // Set name by single string argument.
        let name: string;
        let unique = false;
        let args: Omit<Collection.Opts<Data>, "db"> | undefined;
        if (typeof info === "string") {
            name = info;
        } else {
            unique = info.unique || false;
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
