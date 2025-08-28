/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh.
 */

// External imports.
// import { deserialize, serialize } from "bson";
import { AggregationCursor, BulkWriteResult, WithId } from 'mongodb';
import * as mongodb from 'mongodb';

// Imports.
import * as vlib from "@vandenberghinc/vlib";
import { Document } from "./document.js";
import type { Database } from "./database.js";
import { StrictFilter, StrictUpdateFilter } from "./filters/filters.js";
import { FlattenToDotNotation, flatten } from "./flatten.js";

// ---------------------------------------------------------
// Types & interfaces.
// ---------------------------------------------------------

/** Index options. */
export type IndexOpts = {
    /**
     * Creates a unique index.
     * @warning An error will be thrown both when `unique` and `options.unique` are booleans with different values.
     */
    unique?: boolean;
    /** When forced is enabled, the potentially existing index will be dropped and recreated later. */
    forced?: boolean;
    /** The options from {@link mongodb.CreateIndexesOptions} */
    options?: {
        unique?: boolean;
        name?: string;
        sparse?: boolean;
        expireAfterSeconds?: number;
        partialFilterExpression?: mongodb.Document;
        collation?: mongodb.CollationOptions;
    };
} & (
        | {
            key: string;
            keys?: never
        }
        | {
            key?: never;
            keys: string[] | Record<string, number>
        }
    )
/**
 * Strict query type that can be either a string path or a strict MongoDB query object.
 */
export type Query<Data extends mongodb.Document> = string | StrictFilter<Data>;

/** Nested types for the {@link Query} type. */
export namespace Query {

    /** The {@link Query} as object only form. */
    export type Object<Data extends mongodb.Document> = StrictFilter<Data>;
}

// ---------------------------------------------------------
// The collection class.
// ---------------------------------------------------------

/**
 * @todo Deprecate `document.ts: Ref & Document`
 *       AND add a `record_version` `transform_version` collection params
 *       That move the versioning logic to the collection layer.
 *       AND potentially other additional features implemented in the depr classes.
 */
/**
 * A wrapper class for the MongoDB collection.
 * 
 * @example
 * const col1 = server.db.collection("col1");
 * const col2 = server.db.collection({
 *    name: "col2",
 *    indexes: ["uid", "name"],
 *    ttl: 1000 * 60 * 60 * 24, // 1 day
 * });
 */
export class Collection<Data extends mongodb.Document = mongodb.Document> {

    /** Collection name */
    name: string;

    /** The mongo collection. */
    _col?: mongodb.Collection<Data>;

    /**
     * The Database parent class, used to initialize the collection on demand.
     * So the user can define collections at root level before the database is initialized.
     */
    db: Database;

    /** Is initialized. */
    initialized: boolean = false;

    /** Whether this collection instance is transaction-based. */
    is_transaction: boolean = false;

    /** Whether this transaction has been finalized (committed or aborted). */
    is_finalized_transaction: boolean = false;

    /** Time to live in msec for all documents. */
    readonly ttl?: number;
    /** Is ttl behaviour enabled? */
    readonly ttl_enabled: boolean;
    /** Enable sliding ttl (refreshes ttl on update), or static ttl (sets ttl on insert) */
    readonly sliding_ttl: boolean;

    /** The temporary indexes passed to the constructor for the init method. */
    protected readonly _init_indexes?: (string | IndexOpts)[];

    /** The MongoDB client session for transaction support. */
    protected _session?: mongodb.ClientSession;

    /**
     * Constructs a new Collection instance.
     * 
     * @param opts The constructor options for the collection.
     * 
     * @throws An error when attempting to initialize a transaction-based collection without initializing the derived collection first.
     */
    constructor(opts: Collection.Opts<Data> | TransactionCollection.Opts<Data>) {

        // Public constructor.
        if (!opts.transaction_based) {
            this.name = opts.name;
            this._col = opts.col;
            this.db = opts.db;
            this._init_indexes = opts.indexes;
            this.is_transaction = false;

            // Set ttl behaviour.
            // Replace your constructor’s TTL block with this:
            let ttl_ms: number | undefined;
            let ttl_sliding = true;
            if (typeof opts.ttl === "number") {
                ttl_ms = opts.ttl;
                ttl_sliding = true;
            } else if (opts.ttl && typeof opts.ttl === "object") {
                ttl_ms = opts.ttl.milliseconds;
                ttl_sliding = opts.ttl.sliding ?? true;
            } else {
                ttl_ms = undefined;
                ttl_sliding = true;
            }
            this.ttl = ttl_ms;
            this.ttl_enabled = this.ttl != null;
            this.sliding_ttl = ttl_sliding;
        }

        // Private constructor for transaction based collections.
        else {

            // Ensure the derived collection is initialized, so we can skip this step in `init()`.
            if (!opts.derived_collection.initialized) {
                throw new Error(`Derived collection "${opts.derived_collection.name}" is not yet initialized, this is required in order to construct a transaction based collection.`);
            }

            // Copy properties from the derived collection.
            this.name = opts.derived_collection.name;
            this._col = opts.derived_collection._col;
            this.ttl = opts.derived_collection.ttl;
            this.sliding_ttl = opts.derived_collection.sliding_ttl;
            this.ttl_enabled = opts.derived_collection.ttl_enabled;
            this.db = opts.derived_collection.db;
            // indexes are not checked nor created in transaction mode.
            // this._init_indexes = opts.derived_collection._init_indexes;
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
    private _init_query(
        query: Query<Data>,
        allow_empty: boolean,
        param_name: string,
    ): mongodb.Filter<Data> {
        if (typeof query !== "string" && (typeof query !== "object" || query == null)) {
            vlib.schema.throw_invalid_type(param_name, query, ["string", "object"], true);
        }
        const op_query = typeof query === "object" ? query : { _path: query } as unknown as mongodb.Filter<Data>;
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
    private async _setup_ttl() {
        //
        // WE DONT USE THE TRANSACTION SESSION IN THIS METHOD.
        //

        // This function is not accessible on transaction based collections.
        this.assert_not_transaction_based();

        // Check init.
        if (!this.initialized) { await this.init(); } this.assert_init();
        if (!this.ttl_enabled || this.ttl == null) {
            return;
        }
        const desired_seconds = Math.floor(this.ttl / 1000);
        // 1) Get all indexes
        const indexes = await this._col.indexes();  // [{ key: { _ttl_timestamp: 1 }, expireAfterSeconds: 3600 }, ...]

        // 2) Find the TTL index
        const ttl_index = indexes.find(ix =>
            ix && typeof ix.key === "object" && (ix.key as any)._ttl_timestamp === 1
        );

        // 3a) Doesn't exist → create it
        if (!ttl_index) {
            await this._col.createIndex(
                { _ttl_timestamp: 1 },
                { expireAfterSeconds: desired_seconds }
            );
            return;
        }

        // 3b) Exists but wrong TTL → drop & recreate
        if (ttl_index.expireAfterSeconds !== desired_seconds) {
            let coll_mod_succeeded = false;
            try {
                await this.db._db!.command({
                    collMod: this.name,
                    index: {
                        name: ttl_index.name,
                        expireAfterSeconds: desired_seconds
                    }
                });
                coll_mod_succeeded = true;
            } catch (error: any) {
            }
            if (!coll_mod_succeeded) {
                try {
                    await this._col.dropIndex(ttl_index.name ?? ({ _ttl_timestamp: 1 } as any));
                } catch { /* ignore */ }
                await this._col.createIndex({ _ttl_timestamp: 1 }, { expireAfterSeconds: desired_seconds });
            }
        }

        // 3c) Exists and correct → nothing to do
    }

    /**
     * Apply the ttl timestamp to a database operation (update doc or pipeline).
     * Do not upsert if the user explicitly sets `upsert: false` in the operation.
     */
    private _apply_ttl_to_operation(
        operation: StrictUpdateFilter<Data> | mongodb.Document[],
        upsert: boolean,
    ): void {
        if (!this.ttl_enabled) return;
        const now = new Date();

        // Pipeline updates: append a $set stage
        if (Array.isArray(operation)) {
            if (this.sliding_ttl) {
                operation.push({ $set: { _ttl_timestamp: now } });
            } else {
                // Static TTL: set only if missing to avoid refreshing on normal updates
                operation.push({ $set: { _ttl_timestamp: { $ifNull: ["$_ttl_timestamp", now] } } });
            }
            return;
        }

        // Classic update document with operators
        const opKey = this.sliding_ttl ? "$set" : "$setOnInsert";
        // For static TTL, only relevant if upsert is not explicitly false.
        if (this.sliding_ttl || upsert !== false) {
            const bucket = (operation as any)[opKey];
            if (bucket == null) {
                (operation as any)[opKey] = { _ttl_timestamp: now };
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
    async init(): Promise<this> {
        if (this.initialized === false) {

            // Initialize NON transaction based.
            if (!this.is_transaction) {

                // Create collection.
                if (this._col == null) {

                    // Start connection in dev mode.
                    if (!this.db.server.production) {
                        await this.db.ensure_connection();
                    }

                    // Not connected.
                    if (!this.db.connected || !this.db._db) {
                        throw new Error(`Database is not connected.`);
                    }
                    // Check if the collection exists
                    if (this.db._listed_cols == null) {
                        this.db._listed_cols = await this.db._db.listCollections().toArray();
                    }
                    // Create collection with retry logic for race conditions
                    if (!this.db._listed_cols.find(x => x.name === this.name)) {
                        let create_col_retries = 3;
                        let last_error: any = null;
                        let collection_created = false;
                        while (create_col_retries > 0 && !collection_created) {
                            try {
                                await this.db._db.createCollection(this.name);
                                collection_created = true;
                            } catch (error: any) {
                                last_error = error;
                                if (error.codeName === "NamespaceExists") {
                                    collection_created = true; // Collection exists, that's ok
                                } else if (create_col_retries > 1 && (error.code === 11000 || error.code === 48)) {
                                    create_col_retries--;
                                    await new Promise(r => setTimeout(r, 100));
                                } else {
                                    throw error;
                                }
                            }
                        }
                        if (!collection_created && last_error) {
                            throw last_error;
                        }
                    }

                    // Create collection.
                    this._col = this.db._db.collection(this.name);

                }

                // Assign as initialized when the column is created.
                // Also since next used methods are checking for this attribute.
                this.initialized = true;

                // Create ttl index.
                if (this.ttl_enabled) {
                    await this._setup_ttl();
                }

                // Create indexes.
                if (!this.is_transaction) {
                    if (this._init_indexes?.length) {
                        for (const item of this._init_indexes) {
                            await this.create_index(item)
                        }
                    } else {
                        await this.create_index({ key: "_path", options: { unique: false } });
                    }
                }
            }

            /**
             * Initialize transaction based.
             * @note This assumes the derived collection has already been initialized.
             */
            else {

                // Start a new transaction.
                if (!this.db.client) {
                    throw new Error(
                        "Database client is not initialized, this is likely because "
                        + "you did not initialize the transaction based collection through 'Collection.start_transaction'."
                    );
                }
                if (!this._col) {
                    throw new Error("SystemError: Derived collection is not initialized, this should have been initialized in the constructor.");
                }

                // Create the session.
                this._session = this.db.client.startSession();

                // Start the transaction.
                this._session.startTransaction();

                // Set as initialized.
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
    assert_init(): asserts this is { _col: mongodb.Collection<Data>, initialized: true } {
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
    assert_not_finalized(): void {
        if (this.is_transaction && this.is_finalized_transaction) {
            throw new Error(`Transaction has already been finalized (committed or aborted).`);
        }
    }

    /**
     * Assert that this collection is not transaction based.
     */
    assert_not_transaction_based(): void {
        if (this.is_transaction) {
            throw new Error(`Collection "${this.name}" is transaction based.`);
        }
    }

    /**
     * Get operation options with session if this is a transaction.
     * @returns Options object with session if applicable.
     */
    get_operation_options<T extends Record<string, any> = {}>(opts?: T): T & { session?: mongodb.ClientSession } {
        if (this.is_transaction && this._session) {
            return { ...opts, session: this._session } as T & { session?: mongodb.ClientSession };
        }
        return opts ?? {} as T & { session?: mongodb.ClientSession };
    }

    /**
     * Get the raw and initialized MongoDB collection.
     * @returns The MongoDB collection instance.
     */
    async col(): Promise<mongodb.Collection<Data>> {
        await this.init();
        return this._col!;
    }

    /**
     * Create a document reference.
     * @param query The query to identify the document.
     * @param opts Additional options for the reference.
     * @returns A new {@link Document.Ref} instance.
     */
    ref<Data extends mongodb.Document = mongodb.Document>(
        query: Query<Data>,
        opts?: Omit<Document.Ref.Opts<Data>, "col">
    ): Document.Ref<Data> {
        const constructor_opts: Document.Ref.Opts<Data> = {
            col: this as any,
            ...(opts ?? {})
        };
        return new Document.Ref<Data>(
            query,
            constructor_opts
        );
    }
    reference<Data extends mongodb.Document = mongodb.Document>(
        query: Query<Data>,
        opts?: Omit<Document.Ref.Opts<Data>, "col">
    ): Document.Ref<Data> {
        return this.ref(query, opts);
    }

    /**
     * Check if an index exists.
     * @note Not supported for transaction based collections.
     * @param index The name of the index to check.
     * @returns True if the index exists, false otherwise.
     */
    async has_index(index: string): Promise<boolean> {
        if (!this.initialized) { await this.init(); } this.assert_init();
        this.assert_not_finalized();
        this.assert_not_transaction_based();
        // No need to pass session obj here.
        return (await this._col.listIndexes().toArray()).some(x => x.name === index);
    }

    /**
     * Creates indexes on collections.
     *
     * @note When transaction mode is enabled, the session option will not be used.
     *
     * @param opts The index create options.
     */
    async create_index(opts: string | IndexOpts): Promise<string> {
        //
        // WE DONT USE THE TRANSACTION SESSION IN THIS METHOD.
        //

        // This function is not accessible on transaction based collections.
        this.assert_not_transaction_based();

        // Init.
        if (!this.initialized) { await this.init(); } this.assert_init();

        // Initialize options.
        let key: string | undefined;
        let keys: string[] | Record<string, number> | undefined
        let options: IndexOpts["options"] | undefined
        let unique: boolean | undefined; // keep as optionally undefined to ensure the opts.options.unique and opts.unique dont clash.
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

            // Ensure `opts.unique` and `opts.options.unique` dont clash.
            // Or throw an error if they do, as described in the attribute's docstring.
            if (opts.unique != null && opts.options?.unique != null && opts.unique !== opts.options.unique) {
                throw new Error(`Encountered different values for attribute 'unique': ${opts.unique} and 'options.unique': ${opts.options.unique}.`);
            }
            unique = opts.unique ?? options?.unique;
        }

        // Insert `unique` into options.
        if (unique) {
            options = options || {};
            options.unique = unique;
        }

        // Create keys objs per input type.
        let keys_obj: Record<string, number> = {};
        if (key) {
            keys_obj = {};
            keys_obj[key] = 1;
        }
        else if (Array.isArray(keys) && keys.length > 0) {
            keys_obj = {};
            for (const key of keys) {
                keys_obj[key] = 1;
            }
        } else if (keys != null && typeof keys === "object" && !Array.isArray(keys)) {
            keys_obj = keys;
        } else {
            throw new Error("Define one of the following parameters: [key, keys].");
        }

        // Drop index.
        if (forced) {
            try {
                await this._col.dropIndex(
                    options?.name ??
                    Object.entries(keys_obj)
                        .map(([key, value]) => `${key}_${value}`)
                        .join('_')
                )
            } catch (err: any) {
                if (err.codeName !== 'IndexNotFound') {
                    throw err;
                }
            }
        }

        // Create index.
        return await this._col.createIndex(keys_obj, options);
    }

    /**
     * Find a document by a query.
     * @param query The query options.
     * @returns Returns the document that was found or `undefined` when no document is found.
     */
    async find(query: StrictFilter<Data>): Promise<WithId<Data> | undefined> {
        if (!this.initialized) { await this.init(); } this.assert_init();
        this.assert_not_finalized();
        return await this._col.findOne(
            query,
            this.get_operation_options(),
        ) ?? undefined;
    }

    async find_many(
        query: StrictFilter<Data>,
        opts?: { cursor: true } & mongodb.FindOptions & mongodb.Abortable,
    ): Promise<mongodb.FindCursor<WithId<Data>>>;
    async find_many(
        query: StrictFilter<Data>,
        opts?: { cursor?: boolean } & mongodb.FindOptions & mongodb.Abortable,
    ): Promise<WithId<Data>[]>;
    /**
     * Find multiple documents by query.
     * By default limited to 10000 results.
     * @param query MongoDB query objects.
     * @returns Array of found documents.
     */
    async find_many(
        query: StrictFilter<Data>,
        opts?: { cursor?: boolean } & mongodb.FindOptions & mongodb.Abortable,
    ): Promise<mongodb.FindCursor<WithId<Data>> | WithId<Data>[]> {
        if (!this.initialized) { await this.init(); } this.assert_init();
        this.assert_not_finalized();
        if (!opts) {
            opts = {};
        }
        if (opts.limit == null) {
            opts.limit = 10000;
        }
        const op_opts: mongodb.FindOptions & mongodb.Abortable = opts;
        const cursor = this._col.find(
            query,
            this.get_operation_options(op_opts)
        );
        if (opts?.cursor) return cursor;
        return await cursor.toArray();
    }

    /**
     * Check if a document exists.
     * @param query The database path to the document.
     * @returns True if the document exists, false otherwise.
     */
    async exists(query: Query<Data>): Promise<boolean> {
        if (!this.initialized) { await this.init(); } this.assert_init();
        this.assert_not_finalized();
        const doc = await this._col.findOne(
            this._init_query(query, false, "query"),
            this.get_operation_options({ projection: { _id: 1 } })
        );
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
    async load<O extends Collection.LoadOpts<Data> | undefined = undefined>(
        query: Query<Data>,
        opts?: O,
    ): Promise<Collection.LoadResult<Data, O>> {
        if (!this.initialized) { await this.init(); } this.assert_init();
        this.assert_not_finalized();
        // if (opts && opts.projection && opts.chunked) {
        //     throw new Error("The `projection` and `chunked` options cannot be used together.");
        // }

        // Create options.
        const find_opts = opts?.projection
            ? { projection: Collection.Projection.init(opts.projection) }
            : undefined;

        // Load doc.
        let doc: WithId<Data> | null;
        // if (opts != null && opts.chunked === true) {
        //     doc = await this._load_chunked(path, find_opts);
        // } else {

        // Load.
        doc = await this._col.findOne(
            this._init_query(query, false, "query"),
            this.get_operation_options(find_opts),
        );
        // }

        // Handle default.
        if (doc == null) {
            if (opts != null && opts.default !== undefined) {
                return ((typeof globalThis.structuredClone === "function")
                    ? structuredClone(opts.default)
                    : vlib.Object.deep_copy(opts.default)
                ) as Collection.LoadResult<Data, O>;
            }
            return undefined as Collection.LoadResult<Data, O>;
        }

        // Insert default keys.
        else if (opts != null && typeof opts.default === "object" && opts.default != null && !Array.isArray(opts.default)) {
            Collection.insert_defaults_helper(doc, opts.default, { clone: true });
        }

        // Response.
        return doc as Collection.LoadResult<Data, O>;
    }

    /**
     * Standalone helper: merge `source` into `target` for missing keys only.
     * Clones assigned nested objects/arrays/dates once (when `clone` is true).
     *
     * @throws An error if the max depth recursion depth has been exceeded.
     */
    static insert_defaults_helper(
        target: Record<string, any>,
        source: Record<string, any>,
        opts: { depth?: number; max_depth?: number; clone?: boolean } = {},
    ): void {
        const max_depth = opts.max_depth ?? 1_000;
        const depth = opts.depth ?? 0;
        const should_clone = opts.clone ?? true;

        const isPlainObject = (v: any): v is Record<string, any> =>
            v != null && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype;

        const cloneAssigned = (val: any, d: number): any => {
            if (!should_clone) return val;
            if (d > max_depth) return val;

            if (Array.isArray(val)) {
                return val.map(item => cloneAssigned(item, d + 1));
            }
            if (val instanceof Date) {
                return new Date(val.getTime());
            }
            if (isPlainObject(val)) {
                const out: Record<string, any> = {};
                for (const k of Object.keys(val)) {
                    out[k] = cloneAssigned(val[k], d + 1);
                }
                return out;
            }
            // Map/Set/custom instances: keep by reference
            return val;
        };

        if (depth > max_depth) {
            throw new Error(`Maximum recursion depth (${max_depth}) exceeded in insert_defaults_helper`);
        }

        for (const key of Object.keys(source)) {
            const v = target[key];
            const d = (source as any)[key];

            if (v === undefined) {
                target[key] = cloneAssigned(d, depth + 1);
            } else if (isPlainObject(v) && isPlainObject(d)) {
                Collection.insert_defaults_helper(v, d, { depth: depth + 1, max_depth, clone: should_clone });
            }
            // Existing non-plain objects/arrays/primitives are left as-is.
        }
    }

    /**
     * Flatten a nested object to a flat `key.subkey` like object, suitable for {@link set} and {@link save} $inc operations.
     * @param obj The object to flatten.
     * @param prefix The prefix to use for the keys, used for recursive calls, new keys will be formatted as `{prefix}.key`.
     * @returns A flat object with keys in the format `key.subkey`.
     * @example
     * const nested = { a: { b: 1, c: { d: 2 } }, e: 3 };
     * const flat = flatten(nested);
     * // flat = { 'a.b': 1, 'a.c.d': 2, 'e': 3 }
     */
    flatten<T extends Record<string, any>>(obj: T, prefix?: string): FlattenToDotNotation<T>;
    flatten<T extends Record<string, any>, const Prefix extends string>(obj: T, prefix: Prefix): FlattenToDotNotation<T, Prefix>;
    flatten<T extends Record<string, any>>(obj: T, prefix: string = ""): FlattenToDotNotation<T> {
        return flatten(obj, prefix);
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
    async set<
        Bulk extends boolean | undefined = undefined,
        Return extends boolean | undefined = undefined,
        Throw extends boolean | undefined = undefined,
        Upsert extends boolean | undefined = undefined,
    >(
        query: Query<Data>,
        content: Partial<Data> | Partial<FlattenToDotNotation<Data>>,
        opts?: Collection.SetOpts<Bulk, Return, Throw, Upsert>,
    ): Promise<Collection.SetResult<Data, Bulk, Return, Throw, Upsert>> {
        type Res = Collection.SetResult<Data, Bulk, Return, Throw, Upsert>;

        if (!this.initialized) { await this.init(); } this.assert_init();
        this.assert_not_finalized();
        
        if (content == null) {
            vlib.schema.throw_invalid_type("content", content, "object", true);
        }

        if (opts?.flatten) content = this.flatten(content) as any;

        // Vars.
        const operation: Record<string, any> = { $set: content };

        // Apply TTL.
        if (this.ttl_enabled) this._apply_ttl_to_operation(operation, opts?.upsert ?? true);

        // Bulk operation.
        if (opts?.bulk) {
            const b_op: mongodb.AnyBulkWriteOperation<Data> = {
                updateOne: {
                    filter: this._init_query(query, false, "query"),
                    update: operation,
                    upsert: opts?.upsert ?? true,
                }
            }
            return b_op as Res;
        }

        // Normal operation.
        else {
            // When return is true, we need to find the document first.
            if (opts?.return) {
                if ((opts?.upsert ?? true) === false) {
                    throw new Error("Upsert must be disabled when 'throw' is 'false' and 'return' is 'true'.");
                }
                const query_op = this._init_query(query, false, "query");
                const res = await this._col.findOneAndUpdate(
                    query_op,
                    operation,
                    this.get_operation_options({
                        upsert: opts?.upsert ?? true,
                        returnDocument: mongodb.ReturnDocument.AFTER,
                        includeResultMetadata: false, // consistency for v5/v6 etc.
                    }),
                );
                if (!res) {
                    if (!(opts?.throw ?? true)) {
                        return undefined as Res;
                    }
                    throw new Collection.WriteError(
                        'Document not found or update failed.',
                        query_op,
                    );
                }
                return res as Res;
            }
            // No return.
            else {
                const query_op = this._init_query(query, false, "query");
                const res = await this._col.updateOne(
                    query_op,
                    operation,
                    this.get_operation_options({
                        upsert: opts?.upsert ?? true
                    }),
                );
                if (!res.acknowledged || (res.matchedCount === 0 && res.upsertedCount === 0)) {
                    throw new Collection.WriteError(
                        'No document matched the filter and no upsert occurred.',
                        query_op,
                    );
                }
            }
        }

        return undefined as Res;
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
    async save<
        Bulk extends boolean | undefined = undefined,
        Return extends boolean | undefined = undefined,
        Throw extends boolean | undefined = undefined,
        Upsert extends boolean | undefined = undefined,
    >(
        query: Query<Data>,
        operation: StrictUpdateFilter<Data>,
        opts?: Collection.SaveOpts<Bulk, Return, Throw, Upsert>,
    ): Promise<Collection.SaveResult<Data, Bulk, Return, Throw, Upsert>> {
        type Res = Collection.SaveResult<Data, Bulk, Return, Throw, Upsert>;

        if (!this.initialized) { await this.init(); } this.assert_init();
        this.assert_not_finalized();

        // Vars.
        const query_op = this._init_query(query, false, "query");

        // Apply TTL.
        if (this.ttl_enabled) this._apply_ttl_to_operation(operation, opts?.upsert ?? true);

        // Bulk operation.
        if (opts?.bulk) {
            const b_op: mongodb.AnyBulkWriteOperation<Data> = {
                updateOne: {
                    filter: query_op,
                    update: operation as mongodb.UpdateFilter<Data>,
                    upsert: opts?.upsert ?? true,
                },
            };
            return b_op as Res;
        }

        // Normal operation.
        else {
            // When return is true, we need to find the document first.
            if (opts?.return) {
                if ((opts?.upsert ?? true) === false) {
                    throw new Error("Upsert must be disabled when 'throw' is 'false' and 'return' is 'true'.");
                }
                const res = await this._col.findOneAndUpdate(
                    query_op,
                    operation as mongodb.UpdateFilter<Data>,
                    this.get_operation_options({
                        upsert: opts?.upsert ?? true,
                        returnDocument: mongodb.ReturnDocument.AFTER,
                        includeResultMetadata: false, // consistency for v5/v6 etc.
                    }),
                );
                if (!res) {
                    if (!(opts?.throw ?? true)) {
                        return undefined as Res;
                    }
                    throw new Collection.WriteError(
                        'Document not found or update failed.',
                        query_op,
                    );
                }
                return res as Res;
            }
            // No return.
            else {
                const res = await this._col.updateOne(
                    query_op,
                    operation as mongodb.UpdateFilter<Data>,
                    this.get_operation_options({
                        upsert: opts?.upsert ?? true
                    }),
                );
                if (!res.acknowledged || (res.matchedCount === 0 && res.upsertedCount === 0)) {
                    throw new Collection.WriteError(
                        'No document matched the filter and no upsert occurred.',
                        query_op,
                    );
                }
            }
        }

        return undefined as Res;
    }

    /**
     * Update multiple documents matching the filter.
     * @param filter MongoDB query object.
     * @param update Update document or pipeline.
     * @param options MongoDB UpdateOptions.
     */
    async update_many(
        filter: StrictFilter<Data>,
        update: StrictUpdateFilter<Data>,
        options?: mongodb.UpdateOptions & mongodb.Abortable,
    ): Promise<mongodb.UpdateResult<Data>> {
        // Validate required parameters
        if (!filter || typeof filter !== 'object') {
            throw new Error('Filter parameter is required and must be an object');
        }
        if (!update || typeof update !== 'object') {
            throw new Error('Update parameter is required and must be an object');
        }

        // Initialize if needed
        if (!this.initialized) {
            await this.init();
        }
        this.assert_init();
        this.assert_not_finalized();

        // Apply ttl.
        if (this.ttl_enabled) this._apply_ttl_to_operation(update, options?.upsert ?? false);

        // Merge session into options if this is a transaction
        const operation_options = this.get_operation_options(options);

        // Execute the update operation
        return this._col.updateMany(
            filter,
            update as mongodb.UpdateFilter<Data>,
            operation_options,
        );
    }

    /** Prepare a _path based regex operation. */
    private prepare_path_regex_filter(path: string): mongodb.Filter<Data> {
        // Validate path to prevent ReDoS
        while (path.length > 0 && path.charAt(path.length - 1) === "/") {
            path = path.substring(0, path.length - 1);
        }
        if (path.length == 0) {
            throw Error("Invalid path.");
        }
        if (path.length > 1000) {
            throw new Error('Path too long');
        }
        const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const filter: mongodb.Filter<{ _path: string }> = {
            _path: {
                $regex: `^${escapeRegExp(path)}/`,
                // $options: 'i'  // Case insensitive for consistency
            }
        };
        return filter as unknown as mongodb.Filter<Data>;
    }

    /**
     * List all child documents of directory path.
     * By default limited to 10000 documents.
     * @param query The database directory path.
     * @param opts List options.
     * @param options.projection The data attributes to retrieve, when left undefined all attributes are retrieved.
     * @returns Array of documents matching the path.
     */
    async list(
        query: Query<Data>,
        opts?: {
            projection?: Collection.Projection;
            limit?: number;
        }
    ): Promise<WithId<Data>[]> {
        if (!this.initialized) { await this.init(); } this.assert_init();
        this.assert_not_finalized();
        if (opts?.projection) {
            opts.projection = Collection.Projection.init(opts.projection);
        }
        if (!opts) {
            opts = {};
        }
        if (opts.limit == null) {
            opts.limit = 10000;
        }
        const op_opts: mongodb.FindOptions & mongodb.Abortable = opts;
        // String query.
        if (typeof query === "string") {
            const filter = this.prepare_path_regex_filter(query);
            return await this._col.find(
                filter,
                this.get_operation_options(op_opts)
            ).toArray();
        }
        // Query obj with path.
        else if (query && typeof query === "object" && (query as Record<string, any>)._path) {
            const filter = {
                ...query,
                ...this.prepare_path_regex_filter((query as Record<string, any>)._path),
            };
            return await this._col.find(
                filter,
                this.get_operation_options(op_opts),
            ).toArray()
        }
        // Direct query.
        else {
            return await this._col.find(
                this._init_query(query, true, "query"),
                this.get_operation_options(op_opts),
            ).toArray();
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
    async list_query(
        query: StrictFilter<Data>,
        opts?: {
            projection?: Collection.Projection;
            limit?: number;
        }
    ): Promise<WithId<Data>[]> {
        if (!this.initialized) { await this.init(); } this.assert_init();
        this.assert_not_finalized();
        if (!opts) {
            opts = {};
        }
        if (opts.projection) {
            opts.projection = Collection.Projection.init(opts.projection);
        }
        if (opts.limit == null) {
            opts.limit = 10000;
        }
        const op_opts: mongodb.FindOptions & mongodb.Abortable = opts;
        return await this._col.find(
            query, 
            this.get_operation_options(op_opts)
        ).toArray();
    }

    /**
     * List all documents of the collection.
     * By default limited to 10000 documents.
     * @param query The query to filter documents.
     * @param opts List options.
     * @param options.projection The data attributes to retrieve, when left undefined all attributes are retrieved.
     * @returns Array of all documents in the collection.
     */
    async list_all(
        query?: StrictFilter<Data>,
        opts?: {
            projection?: Collection.Projection;
            limit?: number;
        }
    ): Promise<WithId<Data>[]> {
        if (!this.initialized) { await this.init(); } this.assert_init();
        this.assert_not_finalized();
        if (!opts) {
            opts = {};
        }
        if (opts.projection) {
            opts.projection = Collection.Projection.init(opts.projection);
        }
        if (opts.limit == null) {
            opts.limit = 10000;
        }
        const op_opts: mongodb.FindOptions & mongodb.Abortable = opts;
        return await this._col.find(
            query ?? {},
            this.get_operation_options(op_opts)
        ).toArray();
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
    async delete<Bulk extends boolean | undefined = undefined>(
        query: Query<Data>,
        opts?: Collection.DeleteOpts<Bulk>,
    ): Promise<Collection.DeleteResult<Data, Bulk>> {
        if (!this.initialized) { await this.init(); } this.assert_init();
        this.assert_not_finalized();
        // // Chunked document.
        // if (opts != null && opts.chunked === true) {
        //     if (opts.bulk) {
        //         return { deleteMany: { filter: typeof path === "object" ? path : { _path: path } } };
        //     } else {
        //         await this._col.deleteMany(typeof path === "object" ? path : { _path: path }, this.get_operation_options());
        //     }
        // }
        // // No chunked document.
        // else {
            const query_op = this._init_query(query, false, "query");
            if (Object.keys(query_op).length === 0) {
                throw Error(`Parameter "query" is an empty object.`);
            }
            if (opts != null && opts.bulk) {
                const b_op: mongodb.AnyBulkWriteOperation<Data> = {
                    deleteOne: {
                        filter: query_op,
                    }
                };
                return b_op as Collection.DeleteResult<Data, Bulk>;
            } else {
                const res = await this._col.deleteOne(
                    query_op,
                    this.get_operation_options(),
                );
                if (!res.acknowledged) {
                    throw new Collection.DeleteError(
                        `Failed to delete document(s) in collection "${this.name}". Query: ${JSON.stringify(query_op)}`,
                        query_op
                    );
                }
                return res as Collection.DeleteResult<Data, Bulk>;
            }
        // }
    }

    /**
     * Delete a document of the collection by query.
     * @param query The query object.
     * @throws Error if query is empty or invalid.
     * @throws a {@link Collection.DeleteError} if the deletion was not acknowledged, this does not check against the deleted document count.
     */
    async delete_query(query: StrictFilter<Data>): Promise<mongodb.DeleteResult> {
        if (!this.initialized) { await this.init(); } this.assert_init();
        this.assert_not_finalized();
        const query_op = this._init_query(query, false, "query");
        const res = await this._col.deleteMany(query_op, this.get_operation_options())
        if (!res.acknowledged) {
            throw new Collection.DeleteError(
                `Failed to delete document(s) in collection "${this.name}".`,
                query_op
            );
        }
        return res;
    }

    /**
     * Delete multiple documents matching the query.
     * @param query MongoDB query object.
     * @throws a {@link Collection.DeleteError} if the deletion was not acknowledged, this does not check against the deleted document count.
     */
    async delete_many(query: StrictFilter<Data>): Promise<mongodb.DeleteResult> {
        if (!this.initialized) { await this.init(); } this.assert_init();
        this.assert_not_finalized();
        const op_query = this._init_query(query, false, "query");
        const res = await this._col.deleteMany(
            op_query,
            this.get_operation_options()
        );
        if (!res.acknowledged) {
            throw new Collection.DeleteError(
                `Failed to delete document(s) in collection "${this.name}".`,
                op_query
            );
        }
        return res;
    }

    /**
     * Delete all documents in the collection, optionally by query.
     * @throws a {@link Collection.DeleteError} if the deletion was not acknowledged, this does not check against the deleted document count.
     */
    async delete_all(query?: StrictFilter<Data>): Promise<mongodb.DeleteResult> {
        if (!this.initialized) { await this.init(); } this.assert_init();
        this.assert_not_finalized();
        const res = await this._col.deleteMany(
            query ?? {},
            this.get_operation_options()
        );
        if (!res.acknowledged) {
            throw new Collection.DeleteError(
                `Failed to delete all document(s) in collection "${this.name}".`,
                query ?? {}
            );
        }
        return res;
    }

    /**
     * Delete all documents from the collection and drop the collection.
     * 
     * @note This function is not supported for transaction based collections.
     */
    async delete_collection(): Promise<void> {
        if (!this.initialized) { await this.init(); } this.assert_init();
        this.assert_not_finalized();
        this.assert_not_transaction_based();
        await this._col.deleteMany({}, this.get_operation_options())
        try {
            const res = await this._col.drop(this.get_operation_options());
            if (!res) {
                throw new Collection.DeleteError(
                    `Failed to drop collection "${this.name}" detected by a falsy return.`,
                    {}
                );
            }
        } catch (err: any) {
            // Make it idempotent: "namespace not found" means already dropped.
            if (err?.code === 26 || err?.codeName === "NamespaceNotFound") {
                return;
            }
            // Your DeleteError expects a query object; pass {} instead of undefined.
            throw new Collection.DeleteError(
                `Failed to drop collection "${this.name}": ${err?.message ?? err}`,
                {},
            );
        }
    }

    /**
     * Clean a document from all default system attributes.
     * @param doc The document to clean.
     * @returns The cleaned document without system attributes.
     */
    clean<T extends Partial<Data> = Data>(doc: T): T | undefined {
        if (doc == null) { return doc; }
        if (typeof doc === "object") {
            const out = Array.isArray(doc) ? (doc as any).slice() : { ...(doc as any) };
            delete (out as any)._id;
            delete (out as any)._path;
            if (this.ttl_enabled) {
                delete (out as any)._ttl_timestamp;
            }
            return out as T;
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
    async bulk_operations(operations: mongodb.AnyBulkWriteOperation<Data>[] = []): Promise<BulkWriteResult> {
        if (!this.initialized) { await this.init(); } this.assert_init();
        this.assert_not_finalized();
        if (!Array.isArray(operations)) {
            throw new TypeError('Operations must be an array');
        }
        if (operations.length > 100000) {
            throw new Error('Bulk operations exceed MongoDB limit of 100000');
        }
        
        if (this.ttl_enabled) {
            const now = new Date();
            for (const op of operations as any[]) {
                
                // insertOne
                if (op.insertOne?.document && typeof op.insertOne.document === "object") {
                    if (this.sliding_ttl || op.insertOne.document._ttl_timestamp == null) {
                        op.insertOne.document._ttl_timestamp = now;
                    }
                    continue;
                }

                // replaceOne
                if (op.replaceOne?.replacement && typeof op.replaceOne.replacement === "object") {
                    if (this.sliding_ttl) {
                        op.replaceOne.replacement._ttl_timestamp = now;
                    } else if (op.replaceOne.upsert && op.replaceOne.replacement._ttl_timestamp == null) {
                        op.replaceOne.replacement._ttl_timestamp = now;
                    }
                    continue;
                }

                // updateOne
                if (op.updateOne?.update) {
                    this._apply_ttl_to_operation(op.updateOne.update, op.updateOne.upsert);
                    continue;
                }

                // updateMany
                if (op.updateMany?.update) {
                    this._apply_ttl_to_operation(op.updateMany.update, op.updateMany.upsert);
                    continue;
                }

                // deleteOne / deleteMany: no TTL changes
            }
        }
        
        // Perform.
        return await this._col.bulkWrite(operations, this.get_operation_options({ ordered: true }));
    }
        
    /**
     * Execute an aggregation pipeline.
     * @param pipeline MongoDB aggregation pipeline stages.
     * @param opts Aggregation options.
     * @param opts.cursor If true, returns an AggregationCursor instead of array.
     * @param opts.clean If true, cleans system attributes from results.
     * @returns Array of results or AggregationCursor.
     * 
     * @todo add proper type safety for `pipeline` however mongodb api also doesnt offer this.
     */
    async aggregate<T extends Partial<Data> = Data>(pipeline: mongodb.Document[], opts: { cursor?: false, clean?: boolean }): Promise<T[]>;
    async aggregate<T extends Partial<Data> = Data>(pipeline: mongodb.Document[], opts?: { cursor: true, clean?: boolean }): Promise<AggregationCursor<T>>;
    async aggregate<T extends Partial<Data> = Data>(pipeline: mongodb.Document[], opts?: { cursor?: boolean, clean?: boolean }): Promise<T[] | AggregationCursor<T>> {
        if (!this.initialized) { await this.init() } this.assert_init();
        this.assert_not_finalized();
        const out = this._col.aggregate<T>(
            pipeline,
            this.get_operation_options(),
        );
        if (opts?.cursor) { return out; }
        const arr = await out.toArray() as T[];
        if (opts?.clean === true) { return arr.map((doc) => this.clean<T>(doc)).filter((x): x is T => x != null); }
        return arr;
    }

    // ---------------------------------------------------------
    // Sessions & transactions.
    // ---------------------------------------------------------

    /**
     * Start a new transaction by creating a TransactionCollection instance.
     * @returns A new TransactionCollection instance with transaction capabilities.
     */
    async start_transaction(): Promise<TransactionCollection<Data>> {
        if (!this.db.client) {
            throw new Error("Database client is not initialized, ensure the parent 'volt.Server' is initialized.");
        }
        if (!this.initialized) { await this.init(); } this.assert_init();
        return new TransactionCollection<Data>({
            derived_collection: this,
            transaction_based: true,
        });
    }

    // ------------------- DEPRECATED -------------------------

    // Chunked methods.

    // /**
    //  * Load a document that has been stored in chunks.
    //  * @param path The query path or object to find the document.
    //  * @param find_opts Additional find options.
    //  * @returns The deserialized document or null if not found.
    //  */
    // private async _load_chunked(
    //     path: Query<Data>,
    //     find_opts?: Record<string, any>
    // ): Promise<any> {
    //     if (!this.initialized) { await this.init(); } this.assert_init();
    //     this.assert_not_finalized();
    //     let query = typeof path === "string" ?
    //         { _path: path, chunk: { $gte: 0 } } :
    //         { ...path, chunk: { $gte: 0 } };
    //     const chunks_cursor = this._col.find(query, this.get_operation_options(find_opts)).sort({ chunk: 1 });
    //     const chunks = await chunks_cursor.toArray();
    //     if (chunks.length === 0) {
    //         return null;
    //     }
    //     const buffer = Buffer.concat(chunks.map(chunk => chunk.data.buffer));
    //     return deserialize(buffer);
    // }

    // /**
    //  * Save a document in chunks to support documents larger than 16MB.
    //  * @param path The query path or object to identify the document.
    //  * @param content The content to save.
    //  */
    // private async _save_chunked(
    //     path: Query<Data>,
    //     content: any
    // ): Promise<void> {
    //     if (!this.initialized) { await this.init(); } this.assert_init();
    //     this.assert_not_finalized();

    //     // 4MB chunks, lower is better for frequent updates.
    //     const CHUNK_SIZE: number = 1024 * 1024 * 4;

    //     // Serialize.
    //     const buffer = serialize(content);
    //     const new_chunk_count = Math.ceil(buffer.length / CHUNK_SIZE);

    //     // Retrieve the old chunk count
    //     const ref_query: any = typeof path === "string" ?
    //         { _path: path, chunk: -1 } :
    //         { ...path, chunk: -1 };
    //     const object_ref = await this._col.findOne(ref_query, this.get_operation_options());
    //     const old_chunk_count = object_ref ? object_ref.chunks : 0;

    //     // Update chunks.
    //     const bulk_ops: any[] = [];
    //     for (let i = 0; i < buffer.length; i += CHUNK_SIZE) {
    //         let query: Record<string, any>, update: Record<string, any>;
    //         if (typeof path === "string") {
    //             query = {
    //                 _path: path,
    //                 chunk: i / CHUNK_SIZE,
    //             }
    //             update = {
    //                 chunk: i / CHUNK_SIZE,
    //                 data: buffer.slice(i, i + CHUNK_SIZE)
    //             }
    //         } else {
    //             query = {
    //                 ...path,
    //                 chunk: i / CHUNK_SIZE,
    //             }
    //             update = {
    //                 chunk: i / CHUNK_SIZE,
    //                 data: buffer.slice(i, i + CHUNK_SIZE)
    //             }
    //         }
    //         const full_update: Record<string, any> = {
    //             $set: update,
    //         };
    //         if (this.ttl_enabled) {
    //             full_update["$setOnInsert"] = { _ttl_timestamp: new Date() };
    //         }
    //         bulk_ops.push({
    //             updateOne: {
    //                 filter: query,
    //                 update: full_update,
    //                 upsert: true
    //             }
    //         });
    //     }

    //     // Update reference.
    //     const full_update: Record<string, any> = {
    //         $set: {
    //             chunk: -1,
    //             chunks: new_chunk_count,
    //         },
    //     };
    //     if (this.ttl_enabled) {
    //         full_update["$setOnInsert"] = { _ttl_timestamp: new Date() };
    //     }
    //     bulk_ops.push({
    //         updateOne: {
    //             filter: ref_query,
    //             update: full_update,
    //             upsert: true
    //         }
    //     });

    //     // Write.
    //     await this._col.bulkWrite(bulk_ops, this.get_operation_options({ ordered: true }));

    //     // Delete any excess chunks if the new chunk count is less than the old chunk count
    //     if (new_chunk_count < old_chunk_count) {
    //         ref_query.chunk = { $gte: new_chunk_count };
    //         await this._col.deleteMany(ref_query, this.get_operation_options());
    //     }
    // }
}

/** Nested types for the {@link Collection} class. */
export namespace Collection {

    /** The constructor options for {@link Collection}. */
    export interface Opts<Data extends mongodb.Document = mongodb.Document> {
        /** The name of the collection. */
        name: string,
        /** The MongoDB collection instance. */
        col?: mongodb.Collection<Data>,
        /** The time to live for every record in the collection. */
        ttl?: number | {
            /** The time to live value in milliseconds. */
            milliseconds: number,
            /**
             * Enable sliding ttl (refreshes ttl on update), or static ttl (sets ttl on insert)
             * Defaults to `true`.
             */
            sliding?: boolean;
        },
        /** The indexes to create / validate upon initialization. */
        indexes?: (string | IndexOpts)[],
        /** Construct the collection in transaction mode. */
        transaction_based?: false,
        /** The {@link Database} instance. */
        db: Database,
        // Unused.
        derived_collection?: never;
    }

    /** The options for {@link Collection.load} */
    export interface LoadOpts<Data extends mongodb.Document = mongodb.Document> {
        /**
         * The default data to be returned when the data does not exist.
         * 
         * Keys that do not exist in the loaded object, but do exist in the default object
         * will automatically be inserted upon loading.
         * 
         * The object will automatically be deep-cloned if used as default or for insertion.
         */
        default?: Data;
        /**
         * The attributes to include (1) or exclude (0) from the document.
         * Mixing inclusion and exclusion patterns is not allowed, following mongodb rules.
         * @throws An error if inclusion and exclusion patterns are mixed.
         */
        projection?: Projection;
    }

    /** The return type of {@link Collection.load} */
    export type LoadResult<
        Data extends mongodb.Document = mongodb.Document,
        O extends Collection.LoadOpts<Data> | undefined = undefined
    > =
        // projection provided
        O extends { projection: infer P extends Projection }
        ? (
            // default provided -> never undefined
            O extends { default: Data }
                ? ProjectedDocument<Data, P>
                : ProjectedDocument<Data, P> | undefined
        )
        // no projection
        : (
            O extends { default: Data }
                ? WithId<Data>
                : WithId<Data> | undefined
        );

    /** Only allow specific keys from T */
    export type Exact<T extends Record<PropertyKey, unknown>> =
        // keep T's own props
        T &
        // forbid anything else: if a non-T prop is present, its type must be never
        { [K in Exclude<PropertyKey, keyof T>]?: never };


    
    /**
     * Options for the save operation.
     * 
     * @template Bulk - If true, returns an unexecuted bulk operation object
     * @template Return - If true, returns the updated document
     * @template Throw - If false (only with return:true, upsert:false), returns undefined instead of throwing
     * @template Upsert - If true/undefined, creates document if missing (default: true)
     */
    export type SaveOpts<
        Bulk extends boolean | undefined = boolean | undefined,
        Return extends boolean | undefined = boolean | undefined,
        Throw extends boolean | undefined = boolean | undefined,
        Upsert extends boolean | undefined = boolean | undefined
    > = Bulk extends true // false by default.
        ? { bulk: Bulk; return?: never; throw?: true; upsert?: Upsert }
        : Return extends true // false by default.
            ? Upsert extends false // true by default.
                ? { bulk?: false; return: Return; throw?: Throw; upsert: Upsert }
                : { bulk?: false; return: Return; throw?: false; upsert?: Upsert }
            : { bulk?: false; return?: false; throw?: true; upsert?: Upsert };    
    
    /** The return type of {@link Collection.save} by separate flags instead of a single option object */
    export type SaveResult<
        Data extends mongodb.Document = mongodb.Document,
        Bulk extends boolean | undefined = boolean | undefined,
        Return extends boolean | undefined = boolean | undefined,
        Throw extends boolean | undefined = boolean | undefined,
        Upsert extends boolean | undefined = boolean | undefined
    > = Bulk extends true ? mongodb.AnyBulkWriteOperation<Data> :
        Return extends true
            ? Throw extends false
                ? Upsert extends false
                    ? WithId<Data> | undefined
                    : WithId<Data>
            : WithId<Data>
        : undefined
        
    /** The return type of {@link Collection.save} */
    export type SaveResultBy<
        Data extends mongodb.Document = mongodb.Document,
        O extends Collection.SaveOpts | undefined = undefined
    > = O extends {
            bulk?: infer Bulk extends boolean | undefined;
            return?: infer Return extends boolean | undefined;
            throw?: infer Throw extends boolean | undefined;
            upsert?: infer Upsert extends boolean | undefined;
        } ? SaveResult<Data, Bulk, Return, Throw, Upsert> : never
        // O extends { bulk: true } ? mongodb.AnyBulkWriteOperation<Data> :
        // O extends { return: true; throw: false } ? WithId<Data> | undefined :
        // O extends { return: true } ? WithId<Data> :
        // undefined;
    
    /** The options (third arg) for {@link Collection.set} */
    export type SetOpts<
        Bulk extends boolean | undefined = boolean | undefined,
        Return extends boolean | undefined = boolean | undefined,
        Throw extends boolean | undefined = boolean | undefined,
        Upsert extends boolean | undefined = boolean | undefined
    > = SaveOpts<Bulk, Return, Throw, Upsert> & {
        /** If true, the operation will flatten the input data to a dot nested notation. */
        flatten?: boolean;
    }

    /** The return type of {@link Collection.set} by separate flags instead of a single option object */
    export type SetResult<
        Data extends mongodb.Document = mongodb.Document,
        Bulk extends boolean | undefined = boolean | undefined,
        Return extends boolean | undefined = boolean | undefined,
        Throw extends boolean | undefined = boolean | undefined,
        Upsert extends boolean | undefined = boolean | undefined,
    > = SaveResult<Data, Bulk, Return, Throw, Upsert>;

    /** The return type of {@link Collection.set} */
    export type SetResultBy<
        Data extends mongodb.Document = mongodb.Document,
        O extends Collection.SetOpts | undefined = undefined
    > = SaveResultBy<Data, O>;

    /** The options for {@link Collection.delete} */
    export interface DeleteOpts<
        Bulk extends boolean | undefined = undefined,
    > {
        /** If true, the operation will return a non executed bulk operation object. */
        bulk?: Bulk;
    }

    /** The return type of {@link Collection.delete} */
    export type DeleteResult<
        Data extends mongodb.Document = mongodb.Document,
        Bulk extends boolean | undefined = undefined,
    > = Bulk extends true
        ? mongodb.AnyBulkWriteOperation<Data>
        : mongodb.DeleteResult;

    /** The return type of {@link Collection.delete} */
    export type DeleteResultBy<
        Data extends mongodb.Document = mongodb.Document,
        O extends Collection.DeleteOpts | undefined = undefined
    > = O extends { bulk: true }
        ? mongodb.AnyBulkWriteOperation<Data>
        : mongodb.DeleteResult;

    /** Error thrown when a write operation fails. */
    export class WriteError extends Error {
        query: Record<string, any> | Record<string, any>[];
        constructor(
            message: string,
            query: Record<string, any> | Record<string, any>[], // may be an empty query, for instance when deleting all documents in the collection.
        ) {
            super(message);
            this.name = "WriteError";
            this.query = query;
            Object.setPrototypeOf(this, new.target.prototype); // ensure instanceof works after transpile.
        }
    }

    /** Error thrown when a delete operation fails. */
    export class DeleteError extends Error {
        query: Record<string, any> | Record<string, any>[];
        constructor(
            message: string,
            query: Record<string, any> | Record<string, any>[], // may be an empty query, for instance when deleting all documents in the collection.
        ) {
            super(message);
            this.name = "DeleteError";
            this.query = query;
            Object.setPrototypeOf(this, new.target.prototype); // ensure instanceof works after transpile.
        }
    }

    // ---------------------------------------------------------
    // Projection & projected types document.
    // ---------------------------------------------------------

    /**
     * The attributes to include (1) or exclude (0) from the loaded document in a database query.
     * Mixing inclusion and exclusion patterns is not allowed, following mongodb rules.
     */
    export type Projection = readonly string[] | Record<string, number | boolean>;

    /** The nested types for the {@link Projection} type. */
    export namespace Projection {

        /**
         * Convert a projection query into a MongoDB-compatible format.
         * @throws An error if both inclusion (1) and exclusion (0) patterns are found,
         *         since this is not allowed by mongodb.
         */
        export function init(projection: Projection): Record<string, number | boolean> {
            if (Array.isArray(projection)) {
                const p: Record<string, number | boolean> = {};
                for (let i = 0; i < projection.length; i++) {
                    p[projection[i]] = 1;
                }
                return p;
            } else {
                const p = projection as Record<string, number | boolean>;
                // object form
                let has_include = false;
                let has_exclude = false;
                for (const [k, v] of Object.entries(p)) {
                    if (v === 1 || v === true) {
                        if (k !== "_id") has_include = true;
                    } else if (v === 0 || v === false) {
                        if (k !== "_id") has_exclude = true;
                    } else {
                        throw new Error(
                            `Invalid projection value for "${k}": expected 0, 1, true or false.`
                        );
                    }
                    if (has_include && has_exclude) {
                        throw new Error(
                            "Invalid projection: cannot mix inclusion and exclusion (except for _id)."
                        );
                    }
                }
                return p;
            }
        }

        // /** Extract the set of projected keys from either form of projection. */
        // export type ExtractKeys<P> = P extends readonly (infer K)[]
        //     ? Extract<K, string>
        //     : P extends Record<infer K, number | boolean>
        //         ? Extract<K & string, string>
        //         : never;

        // Keys explicitly included in a projection object (value 1|true),
        // or the array form (string[]).
        export type IncludeKeys<P> =
            P extends readonly (infer K)[] ? Extract<K, string> :
            P extends Record<string, 0 | 1 | boolean>
            ? { [K in keyof P]: P[K] extends 1 | true ? (K & string) : never }[keyof P]
            : never;

        // Keys explicitly excluded in a projection object (value 0|false).
        export type ExcludeKeys<P> =
            P extends Record<string, 0 | 1 | boolean>
            ? { [K in keyof P]: P[K] extends 0 | false ? (K & string) : never }[keyof P]
            : never;

        /**
         * Determines which keys from `Data` are included after applying projection `P`.
         * 
         * - Empty `[]` or `{}` → all keys (no projection)
         * - Array `["field1", ...]` → specified fields + "_id"
         * - Inclusion `{field1: 1}` → specified fields + "_id" (unless `{_id: 0}`)
         * - Exclusion `{field1: 0}` → all keys except excluded ones
         */
        export type IncludedKeysFor<Data extends mongodb.Document, P> =
            // Empty array [] → full document
            P extends readonly [] ? keyof WithId<Data> :
            // Non-empty array → inclusion array: listed fields + "_id"
            P extends readonly any[]
            ? ("_id" | (IncludeKeys<P> & keyof WithId<Data>))
            : (
                // Empty object {} → full document
                [keyof P] extends [never] ? keyof WithId<Data> :
                // Object with keys
                P extends Record<string, 0 | 1 | boolean>
                ? (
                    // Exclusion object (no include-keys) → all except excluded
                    IncludeKeys<P> extends never
                    ? Exclude<keyof WithId<Data>, ExcludeKeys<P>>
                    // Inclusion object → listed + "_id" unless explicitly dropped
                    : ((IncludeKeys<P> & keyof WithId<Data>) |
                        (P extends { _id: 0 | false } ? never : "_id"))
                )
                // Fallback → full document
                : keyof WithId<Data>
            );
    }

    /**
     * Projected document.
     * The projected fields are included as is, and the non included fields
     * are included as optional, since {@link LoadOpts.default} may add them.
     */
    export type ProjectedDocument<
        Data extends mongodb.Document,
        Prjct extends readonly string[] | Record<string, number | boolean>
    > =
        // Special case: empty array [] means no projection (full document)
        Prjct extends readonly [] ? WithId<Data> :
        // Special case: empty object {} means no projection (full document)
        [keyof Prjct] extends [never] ? WithId<Data> :
        // Regular projection logic
        Partial<
            Omit<WithId<Data>,
            Projection.IncludedKeysFor<Data, Prjct>>
        > &
        Pick<
            WithId<Data>,
            Extract<Projection.IncludedKeysFor<Data, Prjct>, keyof WithId<Data>>
        >;
    // export type ProjectedDocument<
    //     Data extends mongodb.Document,
    //     Prjct extends readonly string[] | Record<string, number | boolean>
    // > =
    //     Partial<
    //         Omit<WithId<Data>,
    //         Projection.IncludedKeysFor<Data, Prjct>>
    //     > &
    //     Pick<
    //         WithId<Data>,
    //         Extract<Projection.IncludedKeysFor<Data, Prjct>, keyof WithId<Data>>
    //     >;

    // Unit tests for `ProjectedDocument`.
    {
        // ===== Test helpers =====
        type Equal<A, B> =
            (<T>() => T extends A ? 1 : 2) extends
            (<T>() => T extends B ? 1 : 2) ? true : false;
        type Expect<T extends true> = T;

        // ===== Test data model =====
        interface DataDoc {
            _path: string;
            name: string;
            age: number;
            admin?: boolean;
        }

        // Use the SAME WithId your library uses:
        type WD = WithId<DataDoc>;

        // ===== 1) Inclusion array: ["name"] ⇒ require "name" and (by Mongo default) "_id"
        type T1 = ProjectedDocument<DataDoc, readonly ["name"]>;
        type E1 = Pick<WD, "_id" | "name"> & Partial<Omit<WD, "_id" | "name">>;
        type A1 = Expect<Equal<T1, E1>>;

        // ===== 2) Inclusion object dropping _id explicitly
        type T2 = ProjectedDocument<DataDoc, { name: 1; _id: 0 }>;
        type E2 = Pick<WD, "name"> & Partial<Omit<WD, "name">>;
        type A2 = Expect<Equal<T2, E2>>;

        // ===== 3) Exclusion object (exclude "age") ⇒ keep everything else
        type T3 = ProjectedDocument<DataDoc, { age: 0 }>;
        type E3 = Pick<WD, Exclude<keyof WD, "age">> & Partial<Pick<WD, "age">>;
        type A3 = Expect<Equal<T3, E3>>;

        // ===== 4) Empty inclusion array treated as "no projection" (full doc)
        type T4 = ProjectedDocument<DataDoc, readonly []>;
        type E4 = WD;
        type A4 = Expect<Equal<T4, E4>>;

        // ===== 5) Empty projection object {} => also no projection (full doc)
        type T5 = ProjectedDocument<DataDoc, {}>;
        type E5 = WD;
        type A5 = Expect<Equal<T5, E5>>;
    }
}

// ---------------------------------------------------------
// The extended transaction based collection class.
// ---------------------------------------------------------

/**
 * TransactionCollection extends Collection with transaction-specific methods.
 * This class provides commit and abort functionality for MongoDB transactions.
 */
export class TransactionCollection<Data extends mongodb.Document = mongodb.Document> extends Collection<Data> {

    async commit(): Promise<void> {
        const session = this._session;
        if (!session) throw new Error("No active session for this transaction.");
        if (this.is_finalized_transaction) throw new Error("Transaction has already been finalized.");
        // if (typeof (session as any).inTransaction === "function" && !(session as any).inTransaction()) {
        //     throw new Error("Cannot commit: session is not in a transaction.");
        // }

        const max_retries_unknown = 10;   // for UnknownTransactionCommitResult / network-ish
        const base_delay_ms = 20;
        const max_delay_ms = 1000;

        for (let attempt = 0; attempt <= max_retries_unknown; attempt++) {
            try {
                await session.commitTransaction();
                this.is_finalized_transaction = true;
                try { await session.endSession(); } finally { this._session = undefined; }
                return;
            } catch (err: any) {
                const has_label = (label: string) => {
                    if (!err || typeof err !== "object") {
                        return false;
                    }
                    if (typeof err?.hasErrorLabel === "function") {
                        try { return !!err.hasErrorLabel(label); } catch { }
                    }
                    return Array.isArray(err?.errorLabels) && err.errorLabels.includes(label);
                };
                const unknown_commit = has_label("UnknownTransactionCommitResult");
                const transient = has_label("TransientTransactionError");
                const is_networkish = err?.name === "MongoNetworkError" || err?.name === "MongoNetworkTimeoutError";
                // const no_such_txn = err?.codeName === "NoSuchTransaction";

                // Unknown outcome or network glitch: retry commit with backoff
                if ((unknown_commit || is_networkish) && attempt < max_retries_unknown) {
                    const delay = Math.min(max_delay_ms, base_delay_ms * Math.pow(2, attempt));
                    await new Promise(res => setTimeout(res, delay));
                    continue;
                }

                // Transient: abort and tell caller to retry the whole transaction
                if (transient) {
                    try { await session.abortTransaction(); } catch { }
                    this.is_finalized_transaction = true;
                    try { await session.endSession(); } finally { this._session = undefined; }
                    const e = new Error(`TransientTransactionError during commit; transaction aborted. Retry the entire transaction. ${err?.message ?? ""}`);
                    (e as any).codeName = err?.codeName; (e as any).errorLabels = err?.errorLabels;
                    throw e;
                }

                // Already ended on server: consider finalized
                // DONT SILENTLY ALLOW THIS.
                // if (no_such_txn) {
                //     this.is_finalized_transaction = true;
                //     try { await session.endSession(); } finally { this._session = undefined; }
                //     return;
                // }

                // Exceeded retries for unknown outcome / network-ish
                if ((unknown_commit || is_networkish) && attempt >= max_retries_unknown) {
                    this.is_finalized_transaction = true;
                    try { await session.endSession(); } finally { this._session = undefined; }
                    const e = new Error(`Commit failed after ${attempt + 1} attempt(s) with unknown outcome; last error: ${err?.message ?? err}`);
                    (e as any).codeName = err?.codeName; (e as any).errorLabels = err?.errorLabels;
                    throw e;
                }

                // Non-retryable: finalize and rethrow
                this.is_finalized_transaction = true;
                try { await session.endSession(); } finally { this._session = undefined; }
                throw err;
            }
        }
    }

    async abort(): Promise<void> {
        const session = this._session;
        if (!session) throw new Error("No active session for this transaction.");
        if (this.is_finalized_transaction) throw new Error("Transaction has already been finalized.");

        const max_retries = 5;
        const base_delay_ms = 20;
        const max_delay_ms = 500;

        for (let attempt = 0; attempt <= max_retries; attempt++) {
            try {
                await session.abortTransaction();
                this.is_finalized_transaction = true;
                try { await session.endSession(); } finally { this._session = undefined; }
                return;
            } catch (err: any) {

                // If server says it doesn't exist, treat as already aborted/ended
                if (err?.codeName === "NoSuchTransaction") {
                    this.is_finalized_transaction = true;
                    try { await session.endSession(); } finally { this._session = undefined; }
                    return;
                }

                const has_label = (label: string) => {
                    if (!err || typeof err !== "object") {
                        return false;
                    }
                    if (typeof err?.hasErrorLabel === "function") {
                        try { return !!err.hasErrorLabel(label); } catch { }
                    }
                    return Array.isArray(err?.errorLabels) && err.errorLabels.includes(label);
                };
                const transient = has_label("TransientTransactionError");
                const is_networkish = err?.name === "MongoNetworkError" || err?.name === "MongoNetworkTimeoutError";

                // Transient outcome or network glitch: retry commit with backoff
                if ((transient || is_networkish) && attempt < max_retries) {
                    const delay = Math.min(max_delay_ms, base_delay_ms * Math.pow(2, attempt));
                    await new Promise(res => setTimeout(res, delay));
                    continue;
                }

                // Give up: finalize and rethrow
                this.is_finalized_transaction = true;
                try { await session.endSession(); } finally { this._session = undefined; }
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
    async cleanup(): Promise<void> {
        if (this._session && !this.is_finalized_transaction) {
            try {
                await this.abort();
            } catch (error) {
                console.error('Failed to abort transaction during cleanup:', error);
                // Still try to end the session
                if (this._session) {
                    try {
                        await this._session.endSession();
                    } catch (endError) {
                        console.error('Failed to end session during cleanup:', endError);
                    }
                }
            } finally {
                this.is_finalized_transaction = true;
            }
        }
    }

    // Support for async disposal (TC39 proposal)
    async [Symbol.asyncDispose](): Promise<void> {
        await this.cleanup();
    }

    /**
     * Check if the transaction is still active (not finalized).
     * @returns True if the transaction is active, false otherwise.
     */
    is_active(): boolean {
        return this.is_transaction && !this.is_finalized_transaction && this._session != null;
    }
}

/** Nested types for the {@link TransactionCollection} class. */
export namespace TransactionCollection {

    /** The constructor options for a transaction based {@link Collection}. */
    export interface Opts<Data extends mongodb.Document = mongodb.Document> {
        /** Construct the collection in transaction mode. */
        transaction_based: true,
        /**
         * The derived collection
         * @warning Ensure this collection is initialized by {@link init},
         *         or an error will be thrown when attempting to construct
         *         a transaction based collection instance.
         */
        derived_collection:
        (Omit<Collection<Data>, "_col" | "initialized"> & {
            initialized: true,
            _col: mongodb.Collection<Data>
        }),
        // Unused.
        name?: never;
        col?: never;
        ttl?: never;
        indexes?: never;
        db?: never;
    }
}

// -------------------------------------------------------
// Some unit tests for save.
// -------------------------------------------------------

async function test_save() {

    interface TestDoc { uid: string }

    // @ts-ignore
    declare const test_col = new Collection<TestDoc>();
    const res = void await test_col.save(
        { uid: "" },
        // @ts-ignore
        { uid: "" },
        { return: true }
    )
    const res_no_throw = await test_col.save(
        { uid: "" },
        // @ts-ignore
        { uid: "" },
        { return: true, throw: false, bulk: false }
    )

    function init_save_opts<
        Bulk extends boolean | undefined = undefined,
        Return extends boolean | undefined = undefined,
        Throw extends boolean | undefined = undefined,
        Upsert extends boolean | undefined = undefined
    >(opts: Collection.SaveOpts<Bulk, Return, Throw, Upsert>): Collection.SaveOpts<Bulk, Return, Throw, Upsert> {
        return opts;
    }

    // ok: bulk path
    const a = init_save_opts({ bulk: true, upsert: true });

    // ok: no return, throw not allowed
    const b = init_save_opts({ return: false, upsert: true });

    // ok; throw `true` allowed when return is `false`
    const b2 = init_save_opts({ return: false, throw: true });

    // @ts-expect-error ❌ throw `false` not allowed when return is false
    const b3 = init_save_opts({ return: false, throw: false });

    // ok: return + no upsert, throw allowed
    const c = init_save_opts({ return: true, upsert: false, throw: false });

    // @ts-expect-error ❌ throw not allowed when upsert can be true
    const d = init_save_opts({ return: true, upsert: true, throw: true });

    // @ts-expect-error ❌ bulk not allowed when return is true
    const e = init_save_opts({ return: true, upsert: true, bulk: true });

    const res_bulk_op = await test_col.save(
        { uid: "" },
        { uid: "" } as StrictUpdateFilter<any>,
        { bulk: true }
    )
    const res_undef = await test_col.save(
        { uid: "" },
        { uid: "" } as StrictUpdateFilter<any>,
    )
    const res_doc = await test_col.save(
        { uid: "" },
        { uid: "" } as StrictUpdateFilter<any>,
        { return: true }
    )
    const res_doc_or_undef = await test_col.save(
        { uid: "" },
        { uid: "" } as StrictUpdateFilter<any>,
        { return: true, throw: false, upsert: false }
    )

    async function save_wrapper<const Bulk extends boolean>(
        doc: TestDoc,
        bulk: Bulk,
    ): Promise<Collection.SaveResult<TestDoc, Bulk>> {
        return await test_col.save(
            { id: "test" } as StrictFilter<TestDoc>,
            { $set: doc },
            { bulk } as Collection.SaveOpts<Bulk>
        )
    }
}
// -------------------------------------------------------