/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Libraries.

// External imports.
import { ChildProcess, spawn } from "child_process";
import { Db, MongoClient, ServerApiVersion } from 'mongodb';

// Imports.
import { logger } from "../logger.js";
import * as vlib from "@vandenberghinc/vlib";
import { Collection, IndexOptions } from "./collection.js";
import type { Server } from "../server.js";
import { Document } from "./document.js";

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
        uri: {type: "string", default: null},
        source: {type: "string", default: null},
        config: {type: "object", default: {}},
        start_args: {type: "array", default: []},
        client: {type: "object", default: {}},
        collections: {type: "array", default: [], value_scheme: {
            type: ["string", "object"],
            preprocess: (info: string | Record<string, any>) => typeof info === "string" ? {name: info} : info,
            scheme: {
                name: Collection.constructor_scheme.name,
                ttl: Collection.constructor_scheme.ttl,
                indexes: Collection.constructor_scheme.indexes,
            },
        }},
        preview: {type: "boolean", default: true},
        preview_ip_whitelist: {type: "array", default: []},
        daemon: {type: ["object", "boolean"], default: {}},
        _server: {type: ["object", "undefined"]},
    }

    // Attributes.
    uri: string;
    client_opts?: Record<string, any>;
    server: Server;
    client?: MongoClient;
    _db?: Db;
    collections = new Map<string, Collection>();

    private _connect_promise?: Promise<void>;

    // System.
    public _listed_cols: any;

    constructor({
        uri,
        client,
        _server,
    }: {
        uri: string,
        client?: Record<string, any>,
        _server: Server,
    }) {
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
            log(1, "Connected to the database.");
        } catch (error) {
            console.error(error);
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
    async collection<Data extends Document.Data = any>(info: 
        string |
        (Omit<ConstructorParameters<typeof Collection>[0], "db"> & {
            unique?: boolean;
        })
    ): Promise<Collection<Data>> {
        // Set name by single string argument.
        let name: string;
        let unique = false;
        let args: Omit<ConstructorParameters<typeof Collection<Data>>[0], "db"> | undefined;
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


    /* Database preview.
    _initialize_db_preview(): void {
        
        if (this.preview && this.server.production === false) {
            this.server.endpoint(

                // Database preview.
                {
                    method: "GET"   ,
                    endpoint: "/volt/db/preview",
                    view: {
                        callback: () => {
                            volt.utils.on_load(async () => {
                                
                                // Style theme.   
                                const style = {
                                    // bg: "#151721",
                                    // sub_bg: "#191B28",
                                    // tag_bg: "#1C203A",
                                    // div_bg: "#282B40",
                                    // fg: "#FFFFFF",
                                    // sub_fg: "#FFFFFF99",
                                    // tag_fg: "#FFFFFF",

                                    bg: "#F6F8F8",
                                    sub_bg: "#FFFFFF",
                                    tag_bg: "#F6F8F8",
                                    div_bg: "#00000010",
                                    fg: "#32334F",
                                    sub_fg: "#31344599",
                                    tag_fg: "#313445",
                                };

                                // List all collections.
                                const collections = (await volt.utils.request({url: "/volt/db/collections"})).collections;

                                // Render a list.
                                const prev_lists = [];
                                function RenderList ({
                                    title, 
                                    list, 
                                    doc = null,
                                    add_prev = true,
                                }) {
                                    if (add_prev) {
                                        prev_lists.append({title, list, doc});
                                    }

                                    // Object view.
                                    const obj_view = VStack();
                                    const refresh_obj_view = () => {
                                        obj_view.inner_html("");
                                        let index = 0;
                                        obj_view.append(
                                            ForEach(list, (key, value) => {
                                                ++index;
                                                let current_key = key;
                                                let value_type = Array.isArray(value) ? "array" : value == null ? "null" : typeof value;
                                                if (Array.isArray(value)) {
                                                    value = JSON.stringify(value, null, 4)
                                                }

                                                // Key input.
                                                const key_input = Input("key")
                                                    .value(key)
                                                    .font_family("'Menlo', 'Consolas', monospace")
                                                    .color(style.sub_fg)
                                                    .font_size(14)
                                                    .padding(0)
                                                    .readonly(key === "_path" || key === "_uid" || key === "uid")
                                                    .on_mouse_over(e => e.color(style.fg))
                                                    .on_mouse_out(e => e.color(style.sub_fg))
                                                    .on_render((e) => e.width(e.text_width(key)))
                                                    .on_input((e) => {
                                                        if (key != current_key) {
                                                            list[e.value()] = list[current_key];
                                                            delete list[current_key];
                                                            current_key = e.value();
                                                        }
                                                        e.width(e.text_width(current_key));
                                                    });

                                                // Value input.
                                                const value_input = Input("value")
                                                        .value(value == null ? "null" : value)
                                                        .font_family("'Menlo', 'Consolas', monospace")
                                                        .color(style.sub_fg)
                                                        .display("inline-block")
                                                        .width("fit-content")
                                                        .font_size(14)
                                                        .readonly(key === "_path" || key === "_uid")
                                                        .stretch(true)
                                                        .on_mouse_over(e => e.color(style.fg))
                                                        .on_mouse_out(e => e.color(style.sub_fg))
                                                        .on_input(() => {
                                                            clearTimeout(value_input.timeout)
                                                            value_input.timeout = setTimeout(update_value, 500);
                                                        })

                                                // Type select.
                                                const type_select = ExtendedSelect({items: ["null", "boolean", "number", "string", "array", "object"]})
                                                    .center()
                                                    .margin(0)
                                                    .max_width(73)
                                                    .color(style.sub_fg)
                                                    .font_size(14)
                                                    .border_radius(10)
                                                    .background(style.tag_bg)
                                                    .border_color(style.div_bg)
                                                    .value(value_type)
                                                    .container
                                                        .padding(2.5, 5)
                                                        .parent();

                                                // Update the list after edits.
                                                const update_value = () => {
                                                    const type = type_select.value();
                                                    const value = value_input.value();
                                                    if (type === "null") {
                                                        list[current_key] = null;
                                                        value_input.value(list[current_key].toString());
                                                    }
                                                    else if (type === "boolean") {
                                                        list[current_key] = value == "true" || value == "True" || value == "TRUE" || value == "1";
                                                        value_input.value(list[current_key].toString());
                                                    }
                                                    else if (type === "number") {
                                                        if (value.indexOf(".") === -1) {
                                                            list[current_key] = paseInt(value);
                                                        } else {
                                                            list[current_key] = paseFloat(value);
                                                        }
                                                        if (isNaN(list[key_input.key])) {
                                                            list[current_key] = 0;
                                                        }
                                                        value_input.value(list[current_key].toString());
                                                    }
                                                    else if (type === "string") {
                                                        list[current_key] = value;
                                                    }
                                                    else if (type === "object") {
                                                        list[current_key] = JSON.parse(value);
                                                    }
                                                }
                                                
                                                // Row.
                                                const row = HStack(
                                                    key_input,
                                                    Text(" : ")
                                                        .white_space("pre")
                                                        .font_family("'Menlo', 'Consolas', monospace")
                                                        .color(style.sub_fg)
                                                        .font_size(14),
                                                    value_input,
                                                    type_select,

                                                    index < Object.keys(list).length ? null : VStack("add")
                                                        .background(style.tag_bg)
                                                        .padding(5, 12.5)
                                                        .border_radius(10)
                                                        .font_size(13)
                                                        .color("#3B8553")
                                                        .margin_left(10)
                                                        .border(1, style.div_bg)
                                                        .on_click(() => {
                                                            list["_new"] = "";
                                                            refresh_obj_view();
                                                        }),

                                                    VStack("delete")
                                                        .background(style.tag_bg)
                                                        .color("#B2321E")
                                                        .padding(5, 12.5)
                                                        .border_radius(10)
                                                        .font_size(13)
                                                        .margin_left(10)
                                                        .border(1, style.div_bg)
                                                        .on_click(async () => {
                                                        }),
                                                )
                                                .center_vertical()
                                                .padding(7.5, 0)
                                                if (volt.utils.is_obj(value)) {
                                                    row.on_click(() => RenderList({title: `${title}.${key}`, list: value}));
                                                }
                                                return [
                                                    row,
                                                    Divider().background(style.div_bg),
                                                ]
                                            })
                                        );
                                    }

                                    // Add.
                                    preview.inner_html("");
                                    preview.append(
                                        Scroller(
                                            VStack(
                                                HStack(
                                                    Title("Database")
                                                        .font_family("'Menlo', 'Consolas', monospace")
                                                        .font_size(12)
                                                        .color(style.tag_fg)
                                                        .background(style.tag_bg)
                                                        .padding(5, 12.5)
                                                        .border_radius(10)
                                                        .margin(0, 0, 0, 0)
                                                        .border(1, style.div_bg)
                                                        .width("fit-content"),

                                                    Spacer(),

                                                    doc == null ? null : Button("Update")
                                                        .background(style.tag_bg)
                                                        .color("#3B8553")
                                                        .padding(5, 12.5)
                                                        .margin_right(10)
                                                        .border_radius(10)
                                                        .border(1, style.div_bg)
                                                        .on_click(() => {
                                                            // --prev_lists.length;
                                                            // const last = prev_lists[prev_lists.length - 1];
                                                            // RenderList({...last, add_prev: false})
                                                        }),

                                                    doc == null ? null : Button("Delete")
                                                        .background(style.tag_bg)
                                                        .color("#B2321E")
                                                        .padding(5, 12.5)
                                                        .margin_right(10)
                                                        .border_radius(10)
                                                        .border(1, style.div_bg)
                                                        .on_click(async () => {
                                                            volt.utils.request({
                                                                method: "DELETE",
                                                                url: "/volt/db/document",
                                                                data: doc,
                                                            })
                                                            --prev_lists.length;
                                                            const last = prev_lists[prev_lists.length - 1];

                                                            const __name = doc.uid != null ? `${doc.uid}:${doc.id}` : doc.id
                                                            const filtered_list = [];
                                                            last.list.iterate((item) => {
                                                                if (item.__name !== __name) {
                                                                    filtered_list.append(item);
                                                                }
                                                            })
                                                            last.list = filtered_list;
                                                            RenderList({...last, add_prev: false})
                                                        }),

                                                    prev_lists.length == 1 ? null : Button("Prev")
                                                        .background(style.tag_bg)
                                                        .color(style.tag_fg)
                                                        .padding(5, 12.5)
                                                        .border_radius(10)
                                                        .border(1, style.div_bg)
                                                        .on_click(() => {
                                                            --prev_lists.length;
                                                            const last = prev_lists[prev_lists.length - 1];
                                                            RenderList({...last, add_prev: false})
                                                        }),
                                                ),

                                                Title(title)
                                                    .font_family("'Menlo', 'Consolas', monospace")
                                                    .font_size(18)
                                                    .color(style.fg)
                                                    .margin(15, 0),

                                                Divider().background(style.div_bg),

                                                Array.isArray(list)
                                                    ? ForEach(list, (item) => {
                                                        return [
                                                            VStack(
                                                                Text(item.__name)
                                                                    .font_family("'Menlo', 'Consolas', monospace")
                                                                    .color(style.sub_fg)
                                                                    .font_size(14)
                                                                    .on_mouse_over(e => e.color(style.fg))
                                                                    .on_mouse_out(e => e.color(style.sub_fg))
                                                            )
                                                            .padding(7.5, 0)
                                                            .on_click(item.__click),

                                                            Divider().background(style.div_bg),
                                                        ]
                                                    })
                                                    : () => {refresh_obj_view(); return obj_view}
                                            )
                                            .margin(25, 50)
                                            .padding(25, 25)
                                            .background(style.sub_bg)
                                            .border_radius(10)
                                            .box_shadow("0px 0px 5px #00000090")
                                        )
                                        .font_family("Helvetica, sans-serif")
                                        .background(style.bg)
                                        .frame("100%", "100%")
                                    )
                                }

                                // Render the collections.
                                const RenderCollections = () => {
                                    RenderList({title: "/", list: collections.iterate_append((item) => {
                                        return {
                                            __name: `${item}/`,
                                            __click: () => RenderCollection(item),
                                        }
                                    })})
                                }

                                // Render a collection.
                                const RenderCollection = async (collection) => {
                                    const documents = (await volt.utils.request({url: "/volt/db/documents", data: {collection}})).documents;
                                    RenderList({title: `${collection}/`, list: documents.iterate_append((item) => {
                                        return {
                                            __name: item._uid != null ? `${item._uid}:${item._path}` : item._path,
                                            __click: () => RenderDocument(collection, item._path, item._uid),
                                        }
                                    })})
                                }

                                // Render a document.
                                const RenderDocument = async (collection, path, uid = null) => {
                                    let doc = (await volt.utils.request({url: "/volt/db/document", data: {collection, path, uid}})).document
                                    if (Array.isArray(doc)) {
                                        doc = {_content: doc};
                                    }
                                    RenderList({
                                        title: uid != null ? `${collection}/${uid}:${path}` : `${collection}/${path}`, 
                                        list: doc,
                                        doc: {collection, uid, path},
                                    })
                                }

                                // Stack.
                                const preview = VStack()
                                    .position(0, 0, 0, 0);

                                // Render all collections.
                                RenderCollections();

                                // Response.
                                return preview;

                            });
                        }
                    }
                },

                // Get collections.
                {
                    method: "GET",
                    endpoint: "/volt/db/collections",
                    content_type: "application/json",
                    rate_limit: "global",
                    callback: async (stream) => {

                        // Check ip whitelist.
                        if (!this.preview_ip_whitelist.includes(stream.ip)) {
                            return stream.error({status: Status.forbidden});
                        }

                        // Sign in.
                        return stream.success({data: {
                            message: "Successfully retrieved all collections.",
                            collections: await this.get_collections(),
                        }});
                    }
                },

                // Get collection documents.
                {
                    method: "GET",
                    endpoint: "/volt/db/documents",
                    content_type: "application/json",
                    rate_limit: "global",
                    params: {
                        collection: "string",
                    },
                    callback: async (stream, params) => {

                        // Check ip whitelist.
                        if (!this.preview_ip_whitelist.includes(stream.ip)) {
                            return stream.error({status: Status.forbidden});
                        }

                        // Check collection.
                        let col;
                        if ((col = this.collections[params.collection]) == null) {
                            return stream.error({data: {error: `Invalid collection "${params.collection}".`}})
                        }

                        // Load docs.
                        let docs = await col.list_all();

                        // Sign in.
                        return stream.success({data: {
                            message: "Successfully loaded the document.",
                            documents: docs,
                        }});
                    }
                },

                // Get document.
                {
                    method: "GET",
                    endpoint: "/volt/db/document",
                    content_type: "application/json",
                    rate_limit: "global",
                    params: {
                        collection: "string",
                        path: ["string", "object"],
                        uid: {type: ["string", "null"], default: null},
                    },
                    callback: async (stream, params) => {

                        // Check ip whitelist.
                        if (!this.preview_ip_whitelist.includes(stream.ip)) {
                            return stream.error({status: Status.forbidden});
                        }

                        // Check collection.
                        let col;
                        if ((col = this.collections[params.collection]) == null) {
                            return stream.error({data: {error: `Invalid collection "${params.collection}".`}})
                        }

                        // Load doc.
                        let doc;
                        if (params.uid == null) {
                            doc = await col.load(params.path);
                        } else {
                            doc = await col.load(params.uid, params.path);
                        }

                        // Sign in.
                        return stream.success({data: {
                            message: "Successfully loaded the document.",
                            document: doc,
                        }});
                    }
                },

                // Delete document.
                {
                    method: "DELETE",
                    endpoint: "/volt/db/document",
                    content_type: "application/json",
                    rate_limit: "global",
                    params: {
                        collection: "string",
                        path: ["string", "object"],
                        uid: {type: ["string", "null"], default: null},
                    },
                    callback: async (stream, params) => {

                        // Check ip whitelist.
                        if (!this.preview_ip_whitelist.includes(stream.ip)) {
                            return stream.error({status: Status.forbidden});
                        }

                        // Check collection.
                        let col;
                        if ((col = this.collections[params.collection]) == null) {
                            return stream.error({data: {error: `Invalid collection "${params.collection}".`}})
                        }

                        // Load doc.
                        let doc;
                        if (params.uid == null) {
                            doc = await col.delete(params.path);
                        } else {
                            doc = await col.delete(params.uid, params.path);
                        }

                        // Sign in.
                        return stream.success({data: {
                            message: "Successfully deleted the document.",
                        }});
                    }
                },

                // Update document.
                {
                    method: "PATCH",
                    endpoint: "/volt/db/document",
                    content_type: "application/json",
                    rate_limit: "global",
                    params: {
                        collection: "string",
                        path: ["string", "object"],
                        uid: {type: ["string", "null"], default: null},
                        content: "object",
                    },
                    callback: async (stream, params) => {

                        // Check ip whitelist.
                        if (!this.preview_ip_whitelist.includes(stream.ip)) {
                            return stream.error({status: Status.forbidden});
                        }

                        // Check collection.
                        let col;
                        if ((col = this.collections[params.collection]) == null) {
                            return stream.error({data: {error: `Invalid collection "${params.collection}".`}})
                        }

                        // Load doc.
                        let doc;
                        if (params.uid == null) {
                            doc = await col.save(params.path, params.content);
                        } else {
                            doc = await col.save(params.uid, params.path, params.content);
                        }

                        // Sign in.
                        return stream.success({data: {
                            message: "Successfully updated the document.",
                        }});
                    }
                },
            )
        } 
    }*/


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


    /*  @docs:
     *  @title: Get Collections
     *  @description: Get the names of the initializated database collections.
     */
    // async get_collections(): Promise<string[]> {
    //     const created = Object.keys(Array.from(this.collections.keys()));
    //     const database = (await this.db.listCollections().toArray()).map((item: any) => item.name);
    //     return created.concat(database)
    //         .filter((value, index, self) => self.indexOf(value) === index)
    //         .sort((a, b) => {
    //             const result = a.toLowerCase().localeCompare(b.toLowerCase());
    //             if (a.startsWith('_') && b.startsWith('_')) { return result; }
    //             if (a.startsWith('_')) { return 1; }
    //             if (b.startsWith('_')) { return -1; }
    //             return result;
    //         });
    // }


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
    //         db_path.mkdir_sync();
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
    //         this.source!.mkdir_sync();
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
