/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */


// ---------------------------------------------------------
// Libraries.

const libproc = require("child_process");
const libbson = require("bson");
const { Transform } = require('stream');
const {MongoClient, ObjectID} = require('mongodb');

// ---------------------------------------------------------
// Imports.

const logger = require("./logger.js");
const Status = require("./status.js");
const {vlib} = require("./vinc.js");

const log_source = logger.LogSource("Database")

// ---------------------------------------------------------
// Collection.
// Path based collection, so "myfile", "mydir/myfile".

// @warning: The "path" param must always be allowed to be an object or string, also for the UIDCollection class.
// @warning: THE DATABASE COLLECTION SHOULD ALSO ACCEPT OBJECTS FOR PATHS.
/*  @docs:
    @nav: Backend
    @chapter: Database
    @title: Collection
    @desc: The database collection class.
    @note: The document attribute `_path` is a reserved index attribute for the path of the document.
    @attribute: 
        @name: col
        @desc: The native mongodb collection.
*/
class Collection {

    // Static attributes.
    static chunk_size = 1024 * 1024 * 4; // 4MB chunks, lower is better for frequent updates.
    static constructor_scheme = {
        name: "string",
        uid_based: "boolean",
        ttl: {type: "number", default: null},
        indexes: {
            type: "array",
            default: [],
            value_scheme: {
                type: ["string", "object"],
                scheme: {
                    key: {type: "string", required: (data) => data.key == null && data.keys == null },
                    keys: {
                        type: ["string", "array"],
                        required: (data) => data.key == null && data.keys == null, value_scheme: "string",
                        postprocess: (keys) => typeof keys === "string" ? [keys] : keys,
                    },
                    options: {type: "object", required: false},
                    commit_quorom: {type: "object", required: false},
                    forced: {type: "boolean", default: false},
                },
                postprocess: (info) => {
                    if (typeof info === "string") return {keys: [info]}
                    if (typeof info === "object" && info.key) {
                        info.keys = info.key;
                        delete info.key;
                        return info;
                    }
                    return info;
                },
            },
        },
    }

    // Constructor.
    constructor(
        name,
        collection,
        ttl = null,
        indexes = [],
        uid_based = false,
    ) {

        // Verify scheme.
        ({indexes, ttl} = vlib.scheme.verify({
            object: {
                name,
                indexes,
                ttl,
                uid_based,
            },
            check_unknown: true,
            scheme: Collection.constructor_scheme,
        }));

        // Attributes.
        this.name = name;
        this.col = collection;
        this.uid_based = uid_based;
        this.ttl = ttl;
        this.ttl_enabled = typeof ttl === "number";

        // Create default indexes.
        if (uid_based) {
            this.col.createIndex({ _path: 1, _uid: 1 });
        } else {
            this.col.createIndex({_path: 1});
        }

        // Creat ttl index.
        if (this.ttl_enabled) {
            this.col.dropIndex("_ttl_timestamp_1")
            .catch(err => {
                if (err.codeName !== 'IndexNotFound') {
                    throw err;
                }    
            })
            .then(() => {
                this.col.createIndex({_ttl_timestamp: 1}, {expireAfterSeconds: parseInt(this.ttl / 1000)});
            })
        }

        // Create indexes.
        if (Array.isArray(indexes) && indexes.length > 0) {
            for (const index of indexes) {
                this.create_index({
                    keys: index.keys,
                    options: index.options,
                    commit_quorom: index.commit_quorom,
                    forced: index.forced,
                })
            }
        }
    }

    // Handle file response.
    _process_doc(doc) {
        if (doc == null) { return null; }
        else if (doc._content != null) {
            return doc._content;
        }
        return doc;
    }

    // Chunked methods.
    async _load_chunked(path, find_opts) {
        let query = typeof path === "string" ? {_path: path, chunk: {$gte: 0}} : {...path, chunk: {$gte: 0}};
        const chunks_cursor = this.col.find(query, find_opts).sort({chunk: 1});
        const chunks = await chunks_cursor.toArray();
        if (chunks.length === 0) {
            return null;
        }
        const buffer = Buffer.concat(chunks.map(chunk => chunk.data.buffer));
        return libbson.deserialize(buffer);

        // const transformStream = new Transform({
        //     transform(chunk, encoding, callback) {
        //         this.push(chunk.data.buffer);
        //         callback();
        //     }
        // });
        // chunks.forEach(chunk => transformStream.write(chunk));
        // transformStream.end();
        // return new Promise((resolve, reject) => {
        //     let buffers = [];
        //     transformStream.on('data', (data) => buffers.push(data));
        //     transformStream.on('end', () => {
        //         const buffer = Buffer.concat(buffers);
        //         resolve(bson.deserialize(buffer));
        //     });
        //     transformStream.on('error', reject);
        // });
    }
    async _save_chunked(path, content) {

        // Serialize.
        const buffer = libbson.serialize(content);
        const new_chunk_count = Math.ceil(buffer.length / Collection.chunk_size);

        // Retrieve the old chunk count
        const ref_query = typeof path === "string" ? {_path: path,  chunk: -1} : {...path, chunk: -1};
        const object_ref = await this.col.findOne(ref_query);
        const old_chunk_count = object_ref ? object_ref.chunks : 0;

        // Update chunks.
        const bulk_ops = [];
        for (let i = 0; i < buffer.length; i += Collection.chunk_size) {
            let query, update;
            if (typeof path === "string") {
                query = {
                    _path: path,
                    chunk: i / Collection.chunk_size,
                }
                update = {
                    chunk: i / Collection.chunk_size,
                    data: buffer.slice(i, i + Collection.chunk_size)
                }
            } else {
                query = {
                    ...path,
                    chunk: i / Collection.chunk_size,
                }
                update = {
                    chunk: i / Collection.chunk_size,
                    data: buffer.slice(i, i + Collection.chunk_size)
                }
            }
            const full_update = {
                $set: update,
            };
            if (this.ttl_enabled) {
                full_update["$setOnInsert"] = { _ttl_timestamp: new Date() };
            }
            bulk_ops.push({
                updateOne: {
                    filter: query,
                    update: full_update,
                    upsert: true
                }
            });
        }

        // Update reference.
        const full_update = {
            $set: {
                chunk: -1,
                chunks: new_chunk_count,
            },
        };
        if (this.ttl_enabled) {
            full_update["$setOnInsert"] = { _ttl_timestamp: new Date() };
        }
        bulk_ops.push({
            updateOne: {
                filter: ref_query,
                update: full_update,
                upsert: true
            }
        });

        // Write.
        await this.col.bulkWrite(bulk_ops, {ordered: true});

        // Delete any excess chunks if the new chunk count is less than the old chunk count
        if (new_chunk_count < old_chunk_count) {
            ref_query.chunk = {$gte: new_chunk_count};
            await this.col.deleteMany(ref_query);
        }
    }

    // Create index.
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
    async create_index({keys, options = null, commit_quorum = null, forced = false}) {
        let keys_obj = keys;
        if (typeof keys === "string") {
            keys_obj = {}
            keys_obj[index.key] = 1;
        }
        else if (Array.isArray(keys)) {
            keys_obj = {};
            for (const key of keys) {
                keys_obj[key] = 1;
            }
        }
        else if (keys == null || typeof keys !== "object") {
            vlib.scheme.throw_invalid_type("keys", keys, ["string", "string[]", "object"], true);
        } else {
            vlib.scheme.throw_invalid_type("keys", keys, ["string", "string[]", "object"], true);
        }

        // Drop index.
        if (forced) {
            try {
                await this.col.dropIndex(options?.name ?? Object.entries(keys_obj).map(([key, value]) => `${key}_${value}`).join('_'))
            } catch (err) {
                if (err.codeName !== 'IndexNotFound') {
                    throw err;
                }
            }
        }

        // Create index.
        return await this.col.createIndex(keys_obj, options, commit_quorum)
    }

    // Find.
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
        try {
            return this._process_doc(await this.col.findOne(query));
        } catch (error) {
            console.error(error);
            throw new Error('Encountered an error while finding the document.');
        }
    }

    // Exists.
    /*  @docs:
     *  @title: Exists
     *  @description: Check if a document exists.
     *  @parameter:
     *      @name: path
     *      @description: The database path to the document.
     *      @type: string
     */
    async exists(path) {
        if (typeof path !== "string" && (typeof path !== "object" || path === null)) {
            throw Error(`Parameter "path" has an invalid type "${typeof path}", the valid type is "string".`);
        }
        try {
            const doc = await this.col.findOne(
                typeof path === "object" ? path : {_path: path},
                {projection: { _id: 1 }}
            );
            return doc != null;
        } catch (error) {
            console.error(error);
            throw new Error('Encountered an error while checking if the document exists.');
        }
    }

    // Load.
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
        if (typeof path !== "string" && (typeof path !== "object" || path === null)) {
            throw Error(`Parameter "path" has an invalid type "${typeof path}", the valid type is "string".`);
        }
        try {

            // Get attributes.
            let find_opts;
            if (opts) {
                if (opts.projection) {
                    find_opts = {projection: opts.projection};
                }
                else if (opts.attributes) {
                    find_opts = {projection: {
                        _id: 1,
                        _path: 1,
                        _uid: 1,
                    }};
                    opts.attributes.iterate((i) => {
                        find_opts.projection[i] = 1;
                    })
                }
            }

            // Load doc.
            let doc;
            if (opts != null && opts.chunked === true) {
                doc = await this._load_chunked(path, find_opts);
            } else {

                // Load.
                doc = await this.col.findOne(
                    typeof path === "object" ? path : {_path: path},
                    find_opts,
                );
                this.clean(doc);
            }

            // Process doc.
            doc = this._process_doc(doc);

            // Handle default.
            if (doc == null) {
                if (opts != null && opts.default !== undefined) { return opts.default; }
                return null;
            }

            // Insert default keys.
            else if (opts != null && typeof opts.default === "object" && opts.default !== null && Array.isArray(opts.default) === false) {
                const set_defaults = (obj, defaults) => {
                    Object.keys(defaults).iterate((key) => {
                        if (obj[key] === undefined) {
                            obj[key] = defaults[key];
                        } else if (
                            typeof obj[key] === "object" && Array.isArray(obj[key]) === false && obj[key] !== null &&
                            typeof defaults[key] === "object" && Array.isArray(defaults[key]) === false && defaults[key] !== null
                        ) {
                            set_defaults(obj[key], defaults[key])
                        }
                    })
                }
                set_defaults(doc, opts.default);
            }

            // Response.
            return doc;

        } catch (error) {
            console.error(error);
            throw new Error('Encountered an error while loading the document.');
        }
    }

    // Save.
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
        if (typeof path !== "string" && (typeof path !== "object" || path === null)) {
            throw Error(`Parameter "path" has an invalid type "${typeof path}", the valid type is "string".`);
        }
        try {

            // Vars.
            let doc, set;

            // Create set.
            if (typeof content === "object" && Array.isArray(content) == false && content !== null) {
                delete content._id;
                delete content._path;
                delete content._uid;
                delete content._ttl_timestamp;
                set = content;
            } else {
                set = {_content: content};
            }

            // Save chunked.
            if (opts != null && opts.chunked === true) {
                await this._save_chunked(path, set);
            }

            // Save as single doc.
            else {

                // Apply $set rules.
                if (opts == null || (opts.set !== false && opts.auto_set !== false)) {
                    set = {$set: set};
                }

                // Apply TTL.
                if (this.ttl_enabled) {
                    if (set["$setOnInsert"] === undefined) {
                        set["$setOnInsert"] = {}
                        set["$setOnInsert"]._ttl_timestamp = new Date();
                    }
                    else if (set["$setOnInsert"] !== null && typeof set["$setOnInsert"] === "object") {
                        set["$setOnInsert"]._ttl_timestamp = new Date();
                    } else {
                        throw new Error(`Undefined behaviour: Unable to assign the $setOnInsert data for ttl control due to unexpected defined $setOnInsert type ${vlib.scheme.value_type(set["$setOnInsert"])}.`);
                    }
                }

                // Bulk operation.
                if (opts != null && opts.bulk) {
                    return {updateOne: {
                        filter: typeof path === "object" ? path : {_path: path},
                        update: set,
                        upsert: true,
                    }};
                }

                // Normal operation.
                else {
                    await this.col.updateOne(
                        typeof path === "object" ? path : {_path: path},
                        set,
                        {upsert: true},
                    );
                }
            }

            // Response.
            return content;

        } catch (error) {
            console.error(error);
            throw new Error('Encountered an error while updating the document.');
        }
    }

    // Append items to the arrays inside the document.
    /*  DEPRECATED docs:
     *  @title: Append
     *  @description: 
     *      Append the items from the nested arrays in the content to the arrays inside the document.
     *
     *      This will throw an error if the content has any non array attributes.
     *  @return:
     *      Returns the updated document.
     *  @parameter:
     *      @name: path
     *      @description: The database path to the document.
     *      @type: string
     *  @parameter:
     *      @name: data
     *      @description: The data to save.
     *      @type: object[string, array]
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
     */
    // async append(path, content, opts = null) {
    //     if (typeof path !== "string" && (typeof path !== "object" || path === null)) {
    //         throw Error(`Parameter "path" has an invalid type "${typeof path}", the valid type is "string".`);
    //     }
    //     if (typeof content !== "object" || content === null || Array.isArray(content)) {
    //         throw Error(`Parameter "content" has an invalid type, the valid type is "object".`);
    //     }
    //     Object.keys(content).iterate((key) => {
    //         if (!Array.isArray(content[key])) {
    //             throw Error(`Parameter "content" has an invalid type for nested attribute "${key}", the valid nested type is "array".`);
    //         }
    //     })
    //     try {

    //         // Vars.
    //         let doc, set;

    //         // Create set.
    //         if (typeof content === "object" && Array.isArray(content) == false && content !== null) {
    //             delete content._id;
    //             delete content._path;
    //             delete content._uid;
    //             set = content;
    //         } else {
    //             set = {_content: content};
    //         }

    //         // Save chunked.
    //         if (opts != null && opts.chunked === true) {
    //             await this._save_chunked(path, set);
    //         }

    //         // Save as single doc.
    //         else {
    //             await this.col.findOneAndUpdate(
    //                 typeof path === "object" ? path : {_path: path},
    //                 {$set: set},
    //                 {upsert: true}
    //             );
    //         }

    //         // Response.
    //         return content;

    //     } catch (error) {
    //         console.error(error);
    //         throw new Error('Encountered an error while updating the document.');
    //     }
    // }

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
        if (typeof path !== "string" && (typeof path !== "object" || path === null)) {
            throw Error(`Parameter "path" has an invalid type "${typeof path}", the valid type is "string".`);
        }
        if (typeof path === "sting") {
            while (path.length > 0 && path.charAt(path.length - 1) === "/") {
                path = path.substr(0, path.length - 1);
            }
            if (path.length == 0) {
                throw Error("Invalid path.");
            }
            path = {_path: {$regex: `^${path}/`}};
        } else if (path._path) {
            const _path = path._path;
            while (_path.length > 0 && _path.charAt(_path.length - 1) === "/") {
                _path = path.substr(0, _path.length - 1);
            }
            if (_path.length == 0) {
                throw Error("Invalid path.");
            }
            path._path = {$regex: `^${path}/`};
        }
        try {
            const docs = await this.col.find(path, {projection: options.projection}).toArray();
            if (options.process === false) {
                return docs;
            }
            const result = docs.iterate_append((doc) => this._process_doc(doc)) // list as array since the user might have used a path object width different attributes so dict is not reliable.
            return result;
        } catch (error) {
            console.error(error);
            throw new Error('Encountered an error while listing all documents.');
        }
    }

    // List query.
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
        try {
            const docs = await this.col.find(query, {projection: options.projection}).toArray();
            if (options.process === false) { return docs; }
            const result = docs.iterate_append((doc) => this._process_doc(doc)) // list as array since the user might have used a path object width different attributes so dict is not reliable.
            return result;
        } catch (error) {
            console.error(error);
            throw new Error('Encountered an error while listing all documents.');
        }
    }

    // List all document ids.
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
        let docs;
        if (this.uid_based) {
            docs = await this.col.find(query, {projection: options.projection}).toArray();
        } else {
            docs = await this.col.find(query, {projection: options.projection}).toArray();
        }
        if (options.process === false) {
            return docs;
        }
        return docs.iterate_append((doc) => this._process_doc(doc)) // list as array since the user might have used a path object width different attributes so dict is not reliable.
    }

    // Delete.
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
    async delete(path, opts = null) {
        if (typeof path !== "string" && (typeof path !== "object" || path === null)) {
            throw Error(`Parameter "path" has an invalid type "${typeof path}", the valid type is "string".`);
        }
        try {
            if (opts != null && opts.chunked === true) {
                if (opts.bulk) {
                    return {deleteMany: {filter: typeof path === "object" ? path : {_path: path}}};
                } else {
                    await this.col.deleteMany(typeof path === "object" ? path : {_path: path});
                }
            } else {
                if (opts != null && opts.bulk) {
                    return {deleteOne: {filter: typeof path === "object" ? path : {_path: path}}};
                } else {
                    await this.col.deleteOne(typeof path === "object" ? path : {_path: path});
                }
            }
        } catch (error) {
            console.error(error);
            throw new Error('Encountered an error while deleting.');
        }
    }

    // Delete.
    /*  @docs:
     *  @title: Delete Query
     *  @description: Delete a document of the collection by query.
     *  @parameter:
     *      @name: query
     *      @description: The query object.
     *      @type: object
     */
    async delete_query(query = {}) {
        if (typeof query !== "object" || query === null || Object.keys(query).length === 0) {
            throw Error(`Parameter "query" has an invalid type "${typeof query}", the valid type is "object".`);
        }
        if (Object.keys(query).length === 0) {
            throw Error(`Parameter "query" is an empty object.`);
        }
        return await this.col.deleteMany(query)
    }

    // Delete all.
    async delete_all(path) {
        if (typeof path !== "string" && (typeof path !== "object" || path === null)) {
            throw Error(`Parameter "path" has an invalid type "${typeof path}", the valid type is "string".`);
        }
        try {
            await this.col.deleteMany(typeof path === "object" ? path : {_path: path});
        } catch (error) {
            console.error(error);
            throw new Error('Encountered an error while deleting.');
        }
    }

    // Delete recursive, meant for subpath style deletion of a dir, so dir "mydir/" to delete everything inside the dir "mydir/file" etc.
    /*  @docs:
     *  @title: Delete Recursive
     *  @description: Delete all the documents inside a directory of a uid from the collection.
     *  @parameter:
     *      @name: path
     *      @description: The database directory path.
     *      @type: string
     *  @parameter:
     *      @name: uid
     *      @ignore: true
     */
    async delete_recursive(path, uid = null) {
        if (typeof path !== "string") { // this func only accept string path's.
            throw Error(`Parameter "path" has an invalid type "${typeof path}", the valid type is "string".`);
        }
        if (this.uid_based && typeof uid !== "string") {
            throw Error(`Parameter "uid" has an invalid type "${typeof uid}", the valid type is "string".`);
        }
        while (path.length > 0 && path.charAt(path.length - 1) === "/") {
            path = path.substr(0, path.length - 1);
        }
        if (path.length == 0) {
            throw Error("Invalid path.");
        }
        const args = {
            _path: {$regex: `^${path}/`}
        }
        if (uid != null) {
            args._uid = uid;
        }
        try {
            return await this.col.deleteMany(args);
        } catch (error) {
            console.error(error);
            throw new Error('Encountered an error while deleting.');
        }
    }

    // Delete collection.
    /*  @docs:
     *  @title: Delete Collection
     *  @description: Delete all documents of from the collection.
     */
    async delete_collection() {
        await this.col.deleteMany()
        await this.col.drop();
    }

    // Clean a document from all system attributes.
    /*  @docs:
     *  @title: Clean document
     *  @description: Clean a document from all default system attributes.
     */
    clean(doc) {
        if (doc == null) { return doc; }
        delete doc._id;
        delete doc._path;
        if (this.uid_based) {
            delete doc._uid;
        }
        if (this.ttl_enabled) {
            delete doc._ttl_timestamp;
        }
        return doc;
    }

    // Write bulk operations.
    async bulk_operations(operations = []) {
        return await this.col.bulkWrite(operations, {ordered: true});
    }

    // Save.
    /*  DEPRECATED docs:
     *  @title: Save
     *  @description: Save data by path.
     *  @parameter:
     *      @name: path
     *      @description: The database path to the document.
     *      @type: string
     *  @parameter:
     *      @name: data
     *      @description: The data to save.
     *      @type: null, boolean, number, string, array, object
    async save(path, content) {
        if (typeof path !== "string" && (typeof path !== "object" || path === null)) {
            throw Error(`Parameter "path" has an invalid type "${typeof path}", the valid type is "string".`);
        }
        let doc;
        if (typeof path === "object") {
            doc = path;
        } else {
            doc = {_path: path};
        }
        if (typeof content === "object" && Array.isArray(content) == false && content !== null) {
            Object.expand(doc, content);
        } else {
            doc._content = content;
        }
        try {
            const response = await this.col.insertOne(doc);
        } catch (error) {
            console.error(error);
            throw new Error('Encountered an error while saving the document.');
        }
    }
    */

     /*
    async _save_chunked(path, content) {

        // Variables.
        const buffer = libbson.serialize(content);
        const chunks = Math.ceil(buffer.length / Collection.chunk_size);
        const bulk_ops = [];

        // Chunk.
        for (let i = 0; i < buffer.length; i += Collection.chunk_size) {
            let document;
            if (typeof path === "string") {
                document = {
                    _path: path,
                    chunk: i / Collection.chunk_size,
                    data: buffer.slice(i, i + Collection.chunk_size)
                }
            } else {
                document = {
                    ...path,
                    chunk: i / Collection.chunk_size,
                    data: buffer.slice(i, i + Collection.chunk_size)
                }
            }
            bulk_ops.push({insertOne: {document}});
        }

        // Create reference.
        const ref_query = typeof path === "string" ? {_path: path,  chunk: -1} : {...path, chunk: -1};
        bulk_ops.push({
            updateOne: {
                filter: ref_query,
                update: {$set: {
                    chunk: -1,
                    chunks: new_chunk_count,
                }},
                upsert: true
            }
        });

        // Create reference.
        await this.col.updateOne(
            typeof path === "string" ? {_path: path} : path,
            {$set: {
                chunk: -1, // to indicate as main chunk reference.
                chunks,
            }},
            {upsert: true}
        );

        // Write.
        await this.col.bulkWrite(bulk_ops, { ordered: true });
    }
    async _delete_chunked(path) {
        await this.col.deleteMany(typeof path === "string" ? {_path: path} : path);
    }
    */
}

// ---------------------------------------------------------
// UID based collection.

// @warning: The "path" param must always be allowed to be an object or string, also for the UIDCollection class.
// @warning: THE DATABASE COLLECTION SHOULD ALSO ACCEPT OBJECTS FOR PATHS.
/*  @docs:
    @nav: Backend
    @chapter: Database
    @title: UID Collection
    @desc: The UID based database collection class.
    @note: The document attribute `_uid` is a reserved index attribute for the user id of the document.
    @note: The document attribute `_path` is a reserved index attribute for the path of the document.
    @attribute: 
        @name: col
        @desc: The native mongodb collection.
*/
class UIDCollection {
    constructor(
        name,
        collection,
        indexes = [],
        ttl,
    ) {
        this._col = new Collection(name, collection, indexes, ttl, true);
        this.col = this._col.col; // keep as `this.col` so user can interact with it in the same way as in `Collection`.
    }

    // Create index.
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
    async create_index({keys, options = null, commit_quorum = null}) {
        return this._col.createIndex({keys, options, commit_quorum});
    }

    // Find.
    /*  @docs:
     *  @title: Find
     *  @description: Find a document by a query.
     *  @return:
     *      Returns the document that was found or `null` when no document is found.
     *  @parameter:
     *      @name: uid
     *      @cached: Users:uid:param
     *      @required: false
     *  @parameter:
     *      @name: query
     *      @desc: The query options.
     *      @type: object
     */
    async find(uid = null, query = {}) {
        if (uid != null) {
            query._uid = uid;
        }
        // else if (typeof uid === "object") {
        //     query = uid;
        // }
        return await this._col.find(query);
    }

    // Exists.
    /*  @docs:
     *  @title: Exists
     *  @description: Check if a document exists.
     *  @parameter:
     *      @name: uid
     *      @cached: Users:uid:param
     *  @parameter:
     *      @name: path
     *      @description: The database path to the document.
     *      @type: string, object
     */
    async exists(uid, path) {
        if (typeof path !== "string" && (typeof path !== "object" || path === null)) {
            throw Error(`Parameter "path" has an invalid type "${typeof path}", the valid type is "string".`);
        }
        if (typeof uid !== "string") {
            throw Error(`Parameter "uid" has an invalid type "${typeof uid}", the valid type is "string".`);
        }
        if (typeof path === "object") {
            return await this._col.exists({...path, _uid: uid});
        } else {
            return await this._col.exists({_path: path, _uid: uid});
        }
    }

    // Load.
    /*  @docs:
     *  @title: Load
     *  @description: Load data by user id and path.
     *  @return:
     *      Returns the loaded document.
     *
     *      Returns the `def` parameter when the data does not exist, keep in mind that when parameter `def` is an object it could be a reference to a defined variable.
     *  @parameter:
     *      @name: uid
     *      @cached: Users:uid:param
     *  @parameter:
     *      @name: path
     *      @description: The database path to the document.
     *      @type: string, object
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
     */
    async load(uid, path, opts = null) {
        if (typeof path !== "string" && (typeof path !== "object" || path === null)) {
            throw Error(`Parameter "path" has an invalid type "${typeof path}", the valid type is "string".`);
        }
        if (typeof uid !== "string") {
            throw Error(`Parameter "uid" has an invalid type "${typeof uid}", the valid type is "string".`);
        }
        if (typeof path === "object") {
            return await this._col.load({...path, _uid: uid}, opts);
        } else {
            return await this._col.load({_path: path, _uid: uid}, opts);
        }
    }

    // Save.
    /*  @docs:
     *  @title: Save
     *  @description: Save data by user id and path. When the document already exists this function only updates the specified content attributes.
     *  @return:
     *      Returns the updated document.
     *  @parameter:
     *      @name: uid
     *      @cached: Users:uid:param
     *  @parameter:
     *      @name: path
     *      @description: The database path to the document.
     *      @type: string, object
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
    async save(uid, path, content, opts = null) {
        if (typeof path !== "string" && (typeof path !== "object" || path === null)) {
            throw Error(`Parameter "path" has an invalid type "${typeof path}", the valid type is "string".`);
        }
        if (typeof uid !== "string") {
            throw Error(`Parameter "uid" has an invalid type "${typeof uid}", the valid type is "string".`);
        }
        if (typeof path === "object") {
            return await this._col.save({...path, _uid: uid}, content, opts);
        } else {
            return await this._col.save({_path: path, _uid: uid}, content, opts);
        }
    }

    // List.
    /*  @docs:
     *  @title: List
     *  @description: List all child documents of directory path.
     *  @parameter:
     *      @name: uid
     *      @cached: Users:uid:param
     *  @parameter:
     *      @name: path
     *      @description: The database directory path.
     *      @type: string, object
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
    async list(uid, path, options = {}) {
        if (typeof path !== "string" && (typeof path !== "object" || path === null)) {
            throw Error(`Parameter "path" has an invalid type "${typeof path}", the valid type is "string".`);
        }
        if (typeof uid !== "string") {
            throw Error(`Parameter "uid" has an invalid type "${typeof uid}", the valid type is "string".`);
        }
        if (typeof path === "object") {
            return await this._col.list({...path, _uid: uid}, options)
        } else {
            return await this._col.list({_path: path, _uid: uid}, options)
        }
    }

    // List query.
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
        return await this._col.list_query(query, options);
    }

    // List all.
    /*  @docs:
     *  @title: List All
     *  @description: List all documents of the collection, optionally per uid.
     *  @parameter:
     *      @name: uid
     *      @cached: Users:uid:param
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
    async list_all(uid = null, options = {}) {
        if (uid == null) {
            return await this._col.list_all({}, options)
        } else {
            return await this._col.list_all({_uid: uid}, options);
        }
    }

    // Delete.
    /*  @docs:
     *  @title: Delete
     *  @description: Delete a document of the collection by uid and path.
     *  @parameter:
     *      @name: uid
     *      @cached: Users:uid:param
     *  @parameter:
     *      @name: path
     *      @description: The database path to the document.
     *      @type: string, object
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
    async delete(uid, path, opts = null) {
        if (typeof path !== "string" && (typeof path !== "object" || path === null)) {
            throw Error(`Parameter "path" has an invalid type "${typeof path}", the valid type is "string".`);
        }
        if (typeof uid !== "string") {
            throw Error(`Parameter "uid" has an invalid type "${typeof uid}", the valid type is "string".`);
        }
        if (typeof path === "object") {
            return await this._col.delete({...path, _uid: uid}, opts)
        } else {
            return await this._col.delete({_path: path, _uid: uid}, opts)
        }
    }

    // Delete.
    /*  @docs:
     *  @title: Delete Query
     *  @description: Delete a document of the collection by query.
     *  @parameter:
     *      @name: query
     *      @description: The query object.
     *      @type: object
     */
    async delete_query(query) {
        if (typeof query !== "object" || query === null || Object.keys(query).length === 0) {
            throw Error(`Parameter "query" has an invalid type "${typeof query}", the valid type is "object".`);
        }
        if (Object.keys(query).length === 0) {
            throw Error(`Parameter "query" is an empty object.`);
        }
        return await this._col.delete_query(query)
    }

    // Delete all.
    /*  @docs:
     *  @title: Delete All
     *  @description: Delete all documents of a uid from the collection.
     *  @parameter:
     *      @name: uid
     *      @cached: Users:uid:param
     *  @parameter:
     *      @name: path
     *      @description: The optional database path query.
     *      @type: null, string, object
     */
    async delete_all(uid, path = null) {
        if (typeof uid !== "string") {
            throw Error(`Parameter "uid" has an invalid type "${typeof uid}", the valid type is "string".`);
        }
        if (path == null) {
            return await this._col.delete_all({_uid: uid})
        }
        else if (typeof path === "object") {
            return await this._col.delete_all({...path, _uid: uid})
        } else {
            return await this._col.delete_all({_path: path, _uid: uid})
        }
    }

    // Delete recursive, meant for subpath style deletion of a dir, so dir "mydir/" to delete everything inside the dir "mydir/document" etc.
    /*  @docs:
     *  @title: Delete Recursive
     *  @description: Delete all the documents inside a directory of a uid from the collection.
     *  @parameter:
     *      @name: uid
     *      @cached: Users:uid:param
     *  @parameter:
     *      @name: path
     *      @description: The database directory path.
     *      @type: string
     */
    async delete_recursive(uid, path) {
        if (typeof path !== "string") { // must always be a string.
            throw Error(`Parameter "path" has an invalid type "${typeof path}", the valid type is "string".`);
        }
        if (typeof uid !== "string") {
            throw Error(`Parameter "uid" has an invalid type "${typeof uid}", the valid type is "string".`);
        }
        return await this._col.delete_recursive(path, uid)
    }

    // Delete collection.
    /*  @docs:
     *  @title: Delete Collection
     *  @description: Delete all documents of from the collection.
     */
    async delete_collection() {
        await this._col.delete_collection()
    }

    // Clean a document from all default system attributes.
    /*  @docs:
     *  @title: Clean document
     *  @description: Clean a document from all default system attributes.
     */
    clean(doc) {
        return this._col.clean(doc);
    }

    // Write bulk operations.
    async bulk_operations(operations = []) {
        return await this.col.bulkWrite(operations, {ordered: true});
    }

    // Save.
    /*  DEPRECATED docs:
     *  @title: Save
     *  @description: Save data by user id and path.
     *  @parameter:
     *      @name: uid
     *      @cached: Users:uid:param
     *  @parameter:
     *      @name: path
     *      @description: The database path to the document.
     *      @type: string, object
     *  @parameter:
     *      @name: data
     *      @description: The data to save.
     *      @type: null, boolean, number, string, array, object
    async save(uid, path, content) {
        if (typeof path !== "string" && (typeof path !== "object" || path === null)) {
            throw Error(`Parameter "path" has an invalid type "${typeof path}", the valid type is "string".`);
        }
        if (typeof uid !== "string") {
            throw Error(`Parameter "uid" has an invalid type "${typeof uid}", the valid type is "string".`);
        }
        if (typeof path === "object") {
            return await this._col.save({...path, _uid: uid}, content);
        } else {
            return await this._col.save({_path: path, _uid: uid}, content);
        }
    }
    */

}


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
        Do not forget to enable TLS when using the `config` parameter. More information about integrating TLS can be found in the <Link https://www.mongodb.com/docs/manual/tutorial/upgrade-cluster-to-ssl/>MongoDB documentation</Link>
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
        @desc: The json data for the mongodb config file. This file will be saved to the `$source/.db/mongod.json` file when it is defined. More information about parameters can be found in the <Link https://www.mongodb.com/docs/manual/reference/configuration-options/>MongoDB documentation</Link>.
        @type: null, string
    @param:
        @name: start_args
        @desc: The mongod database start command arguments.
        @type: null, array[string]
    @param:
        @name: client
        @desc: The MongoClient options.
        @type: null, object
    @param:
        @name: collections
        @desc: The normal collections, the collections will be accessable under `Database.$collection_name`.
        @type: string[], CollectionObject[]
        @attributes_type: CollectionObject
        @attribute:
            @name: name
            @descr: The name of the collection.
        @attribute:
            @name: indexes
            @descr: The document attribute names for which to create indexes. 
            @type: string[]
        @attribute:
            @name: ttl
            @descr: The time to live in milliseconds of every document in the collection. When the time to live has expired the document is automatically deleted.
            @type: number
    @param:
        @name: uid_collections
        @desc: The uid collections, the uid collections will be accessable under `Database.$collection_name`.
        @type: string[], CollectionObject[]
        @attributes_type: CollectionObject
        @attribute:
            @name: name
            @descr: The name of the collection.
        @attribute:
            @name: indexes
            @descr: The document attribute names for which to create indexes. 
            @type: string[]
        @attribute:
            @name: ttl
            @descr: The time to live in milliseconds of every document in the collection. When the time to live has expired the document is automatically deleted.
            @type: number
    @param:
        @name: preview
        @desc: Enable the database preview endpoint `/volt/db/preview` (only available when `Server.production` is `false`).
        @type: string
    @param:
        @name: preview_ip_whitelist
        @desc: The allowed ip's to visit the database preview.
        @type: string
    @param:
        @name: daemon
        @description:
            The optional settings for the service daemon. The service daemon can be disabled by passing value `false` to parameter `daemon`.
        @type: object
        @attr:
            @name: user
            @desc: The executing user of the service daemon.
            @type: string
        @attr:
            @name: group
            @desc: The executing group of the service daemon.
            @type: string
        @attr:
            @name: args
            @desc: The arguments for the start command.
            @type: array[string]
        @attr:
            @name: env
            @desc: The environment variables for the service daemon.
            @type: object
        @attr:
            @name: description
            @desc: The description of the service daemon.
            @type: string
        @attr:
            @name: logs
            @desc: The path to the log file.
            @type: string
        @attr:
            @name: errors
            @desc: The path to the error log file.
            @type: string
    @param:
        @name: _server
        @ignore: true
 */
class Database {

    // Constructor scheme.
    static constructor_scheme = {
        uri: {type: "string", default: null},
        source: {type: "string", default: null},
        config: {type: "object", default: {}},
        start_args: {type: "array", default: []},
        client: {type: "object", default: {}},
        collections: {type: "array", default: [], value_scheme: {
            type: ["string", "object"],
            preprocess: (info) => typeof info === "string" ? {name: info} : info,
            scheme: {
                name: Collection.constructor_scheme.name,
                ttl: Collection.constructor_scheme.ttl,
                indexes: Collection.constructor_scheme.indexes,
            },
        }},
        uid_collections: {type: "array", default: [], value_scheme: {
            type: ["string", "object"],
            preprocess: (info) => typeof info === "string" ? {name: info} : info,
            scheme: {
                name: Collection.constructor_scheme.name,
                ttl: Collection.constructor_scheme.ttl,
                indexes: Collection.constructor_scheme.indexes,
            },
        }},
        preview: {type: "boolean", default: true},
        preview_ip_whitelist: {type: "array", default: []},
        daemon: {type: ["object", "boolean"], default: {}},
        _server: "object",
    }

    // Constructor.
    constructor({
        uri = null, //'mongodb://localhost:27017/main',
        source = null,
        config = null,
        start_args = [],
        client = null,
        collections = [],
        uid_collections = [],
        preview = true,
        preview_ip_whitelist = [],
        daemon = {},
        _server,
    }) {

        // Checks.
        if (_server.is_primary && uri == null) {
            ({uri, config, start_args, config, client} = vlib.scheme.verify({object: arguments[0], check_unknown: true, scheme: Database.constructor_scheme}));
        }

        // Arguments.
        this.uri = uri;
        this.preview = preview;
        this.preview_ip_whitelist = preview_ip_whitelist;
        this.client_opts = client;
        this.config = config;
        this.source = source != null ? new vlib.Path(source) : _server.source.join(".db");
        this.start_args = start_args;
        this._collections = collections;
        this._uid_collections = uid_collections;
        this.server = _server;

        // Attributes.
        this.client = null;
        this.collections = {};

        // Initialize the service daemon.
        if (this.server.daemon && daemon !== false) {
            const log_source = this.server.source.join(".logs");
            if (!log_source.exists()) {
                log_source.mkdir_sync();
            }
            this.daemon = new vlib.Daemon({
                name: this.server.daemon.name + ".mongodb",
                user: daemon.user || this.server.daemon.user,
                group: daemon.group || this.server.daemon.group,
                command: "mongod",
                cwd: this.server.daemon.cwd,
                args: ["--config", this.source.join("mongod.json").str(), ...this.start_args],
                env: daemon.env || this.server.daemon.env,
                description: daemon.description || `Service daemon for the mongo database of website ${this.server.domain}.`,
                auto_restart: true,
                logs: daemon.logs || log_source.join("logs.mongodb").str(),
                errors: daemon.errors || log_source.join("errors.mongodb").str(),
            })
        }
    }

    // Database preview.
    _initialize_db_preview() {
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
                                                let value_type = Array.isArray(value) ? "array" : value === null ? "null" : typeof value;
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
    }

    // Connect.
    async connect() {
        try {
            await this.client.connect();
            this.db = this.client.db();
        } catch (error) {
            console.error(error);
            throw new Error('Error connecting to the database');
        }
    }

    // Initialize.
    async initialize() {

        // Set default config.
        if (this.config == null) {
            this.config = {};
        }
        if (this.config.systemLog === undefined) { this.config.systemLog = {}; }

        this.config.systemLog.path = this.source.join("mongod.log").str()

        if (this.config.systemLog.destination === undefined) {
            this.config.systemLog.destination = "file";
        }
        if (this.config.systemLog.logAppend === undefined) {
            this.config.systemLog.logAppend = true;
        }
        if (this.config.systemLog.logRotate === undefined) {
            this.config.systemLog.logRotate = "reopen";
        }
        if (this.config.systemLog.verbosity === undefined) {
            this.config.systemLog.verbosity = this.server.production ? 0 : 1;
        }

        if (this.config.storage === undefined) { this.config.storage = {}; }

        const db_path = this.source.join("db");
        this.config.storage.dbPath = db_path.str()
        if (!db_path.exists()) {
            db_path.mkdir_sync();
        }

        if (this.config.processManagement === undefined) { this.config.processManagement = {}; }
        this.config.processManagement.pidFilePath = this.source.join("mongod.pid").str()

        if (this.config.net === undefined) { this.config.net = {}; }
        if (this.config.net.port === undefined) { this.config.net.port = 27017; }
        if (this.config.net.bindIp === undefined) { this.config.net.bindIp = "127.0.0.1"; }

        // Mode 2: Start database.
        if (this.server.is_primary && this.uri == null) {

            // Create the database.
            if (!this.source.exists()) {
                this.source.mkdir_sync();
            }

            // Set the uri.
            if (this.uri == null) {
                this.uri = `mongodb://${this.config.net.bindIp}:${this.config.net.port}/main`
            }

            // Save the config.
            const config_path = this.source.join("mongod.json");
            config_path.save_sync(JSON.stringify(this.config));

            // Start the database.
            this.proc = libproc.spawn(
                "mongod",
                ["--config", config_path.str(), ...this.start_args],
                {
                    // cwd: this.source,
                    stdio: "pipe",
                    detached: true,
                    env: {...process.env},
                },
            )
            this.proc.stdout.on('data', (data) => {
                console.log(data.toString());
            })
            this.proc.stderr.on('data', (data) => {
                console.error(data.toString());
            })
            this.proc.on("error", (code, signal) => {
                console.error(`MongoDB crashed with error signal ${signal}.`);
                process.exit(code);
            })

        }

        // Assign URI.
        else if (!this.server.is_primary && this.uri == null) {
            this.uri = `mongodb://${this.config.net.bindIp}:${this.config.net.port}/main`
        }

        // Initialize client.
        this.client = new MongoClient(this.uri, this.client_opts);

        // Connect.
        await this.connect();

        // Create collections.
        this._collections.iterate((info) => {
            if (this[info.name] !== undefined) {
                throw Error(`Unable to initialize database collection "${info.name}", this attribute name is already used.`);
            }
            if (Array.isArray(info.indexes)) {
                for (const index of info.indexes) {
                    if (index != null && typeof index === "object") {
                        index.forced = true;
                    }
                }
            }
            this[info.name] = this.create_collection(info);
        })
        this._uid_collections.iterate((info) => {
            if (this[info.name] !== undefined) {
                throw Error(`Unable to initialize database collection "${info.name}", this attribute name is already used.`);
            }
            if (Array.isArray(info.indexes)) {
                for (const index of info.indexes) {
                    if (index != null && typeof index === "object") {
                        index.forced = true;
                    }
                }
            }
            this[info.name] = this.create_uid_collection(info);
        })
    }

    // Close.
    async close() {
        logger.log(0, log_source, "Stopping the database.");
        await this.client.close();
    }

    // Create a uid collection.
    /*  @docs:
        @title: Create Collection
        @desc: Create a database collection.
        @param:
            @name: name
            @desc: The name of the collection.
            @type: string
     */
    create_collection({name, indexes = [], ttl = null}) {

        // Set name by single string argument.
        if (typeof arguments[0] === "string") {
            name = arguments[0];
        }

        // Check collection.
        if (name in this.collections) {
            throw Error(`Collection "${name}" is already initialized.`)
        }
        const col = new Collection(
            name,
            this.db.collection(name),
            ttl,
            indexes,
        );
        this.collections[name] = col;
        return col;
    }

    // Create a uid collection.
    /*  @docs:
        @title: Create UID Based Collection
        @desc: Create a UID based database collection.
        @param:
            @name: name
            @desc: The name of the collection.
            @type: string
     */
    create_uid_collection({name, indexes = [], ttl = null}) {

        // Set name by single string argument.
        if (typeof arguments[0] === "string") {
            name = arguments[0];
        }

        // Check collection.
        if (name in this.collections) {
            throw Error(`Collection "${name}" is already initialized.`)
        }
        const col = new UIDCollection(
            name,
            this.db.collection(name),
            ttl,
            indexes,
        );
        this.collections[name] = col;
        return col;
    }

    // Get collections.
    /*  @docs:
        @title: Get Collections
        @desc: Get the names of the initializated database collections.
     */
    async get_collections() {
        const created = Object.keys(this.collections);
        const database = (await this.db.listCollections().toArray()).iterate_append((item) => { return item.name});
        return created.concat(database).drop_duplicates().sort((a, b) => {
            const result = a.toLowerCase().localeCompare(b.toLowerCase());
            if (a.startsWith('_') && b.startsWith('_')) { return result; }
            if (a.startsWith('_')) { return 1; }
            if (b.startsWith('_')) { return -1; }
            return result;
        });
    }

}


// ---------------------------------------------------------
// Exports.

module.exports = Database;