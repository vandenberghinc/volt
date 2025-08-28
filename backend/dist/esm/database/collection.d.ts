/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh.
 */
import { AggregationCursor, BulkWriteResult, WithId } from 'mongodb';
import * as mongodb from 'mongodb';
import { Document } from "./document.js";
import type { Database } from "./database.js";
import { StrictFilter, StrictUpdateFilter } from "./filters/filters.js";
import { FlattenToDotNotation } from "./flatten.js";
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
} & ({
    key: string;
    keys?: never;
} | {
    key?: never;
    keys: string[] | Record<string, number>;
});
/**
 * Strict query type that can be either a string path or a strict MongoDB query object.
 */
export type Query<Data extends mongodb.Document> = string | StrictFilter<Data>;
/** Nested types for the {@link Query} type. */
export declare namespace Query {
    /** The {@link Query} as object only form. */
    type Object<Data extends mongodb.Document> = StrictFilter<Data>;
}
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
export declare class Collection<Data extends mongodb.Document = mongodb.Document> {
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
    initialized: boolean;
    /** Whether this collection instance is transaction-based. */
    is_transaction: boolean;
    /** Whether this transaction has been finalized (committed or aborted). */
    is_finalized_transaction: boolean;
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
    constructor(opts: Collection.Opts<Data> | TransactionCollection.Opts<Data>);
    /**
     * Initialize a database query from path or object.
     * @throws An error if the input type is incorrect, and optionally if the query is empty.
     */
    private _init_query;
    /**
     * Setup the ttl configuration.
     *
     * @note When transaction mode is enabled, the session option will not be used.
     */
    private _setup_ttl;
    /**
     * Apply the ttl timestamp to a database operation (update doc or pipeline).
     * Do not upsert if the user explicitly sets `upsert: false` in the operation.
     */
    private _apply_ttl_to_operation;
    /**
     * Initialize the collection, creating indexes and setting up TTL if needed.
     * @returns The initialized collection instance.
     */
    init(): Promise<this>;
    /**
     * Assert that the collection is initialized and has a valid MongoDB collection.
     * @throws {Error} Throws if the collection is not initialized or _col is null
     * @returns An initialized collection type assertion
     */
    assert_init(): asserts this is {
        _col: mongodb.Collection<Data>;
        initialized: true;
    };
    /**
     * Assert that if this is a transaction, it has not been finalized.
     * @throws Error if this is a finalized transaction.
     */
    assert_not_finalized(): void;
    /**
     * Assert that this collection is not transaction based.
     */
    assert_not_transaction_based(): void;
    /**
     * Get operation options with session if this is a transaction.
     * @returns Options object with session if applicable.
     */
    get_operation_options<T extends Record<string, any> = {}>(opts?: T): T & {
        session?: mongodb.ClientSession;
    };
    /**
     * Get the raw and initialized MongoDB collection.
     * @returns The MongoDB collection instance.
     */
    col(): Promise<mongodb.Collection<Data>>;
    /**
     * Create a document reference.
     * @param query The query to identify the document.
     * @param opts Additional options for the reference.
     * @returns A new {@link Document.Ref} instance.
     */
    ref<Data extends mongodb.Document = mongodb.Document>(query: Query<Data>, opts?: Omit<Document.Ref.Opts<Data>, "col">): Document.Ref<Data>;
    reference<Data extends mongodb.Document = mongodb.Document>(query: Query<Data>, opts?: Omit<Document.Ref.Opts<Data>, "col">): Document.Ref<Data>;
    /**
     * Check if an index exists.
     * @note Not supported for transaction based collections.
     * @param index The name of the index to check.
     * @returns True if the index exists, false otherwise.
     */
    has_index(index: string): Promise<boolean>;
    /**
     * Creates indexes on collections.
     *
     * @note When transaction mode is enabled, the session option will not be used.
     *
     * @param opts The index create options.
     */
    create_index(opts: string | IndexOpts): Promise<string>;
    /**
     * Find a document by a query.
     * @param query The query options.
     * @returns Returns the document that was found or `undefined` when no document is found.
     */
    find(query: StrictFilter<Data>): Promise<WithId<Data> | undefined>;
    find_many(query: StrictFilter<Data>, opts?: {
        cursor: true;
    } & mongodb.FindOptions & mongodb.Abortable): Promise<mongodb.FindCursor<WithId<Data>>>;
    find_many(query: StrictFilter<Data>, opts?: {
        cursor?: boolean;
    } & mongodb.FindOptions & mongodb.Abortable): Promise<WithId<Data>[]>;
    /**
     * Check if a document exists.
     * @param query The database path to the document.
     * @returns True if the document exists, false otherwise.
     */
    exists(query: Query<Data>): Promise<boolean>;
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
    load<O extends Collection.LoadOpts<Data> | undefined = undefined>(query: Query<Data>, opts?: O): Promise<Collection.LoadResult<Data, O>>;
    /**
     * Standalone helper: merge `source` into `target` for missing keys only.
     * Clones assigned nested objects/arrays/dates once (when `clone` is true).
     *
     * @throws An error if the max depth recursion depth has been exceeded.
     */
    static insert_defaults_helper(target: Record<string, any>, source: Record<string, any>, opts?: {
        depth?: number;
        max_depth?: number;
        clone?: boolean;
    }): void;
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
    set<Bulk extends boolean | undefined = undefined, Return extends boolean | undefined = undefined, Throw extends boolean | undefined = undefined, Upsert extends boolean | undefined = undefined>(query: Query<Data>, content: Partial<Data> | Partial<FlattenToDotNotation<Data>>, opts?: Collection.SetOpts<Bulk, Return, Throw, Upsert>): Promise<Collection.SetResult<Data, Bulk, Return, Throw, Upsert>>;
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
    save<Bulk extends boolean | undefined = undefined, Return extends boolean | undefined = undefined, Throw extends boolean | undefined = undefined, Upsert extends boolean | undefined = undefined>(query: Query<Data>, operation: StrictUpdateFilter<Data>, opts?: Collection.SaveOpts<Bulk, Return, Throw, Upsert>): Promise<Collection.SaveResult<Data, Bulk, Return, Throw, Upsert>>;
    /**
     * Update multiple documents matching the filter.
     * @param filter MongoDB query object.
     * @param update Update document or pipeline.
     * @param options MongoDB UpdateOptions.
     */
    update_many(filter: StrictFilter<Data>, update: StrictUpdateFilter<Data>, options?: mongodb.UpdateOptions & mongodb.Abortable): Promise<mongodb.UpdateResult<Data>>;
    /** Prepare a _path based regex operation. */
    private prepare_path_regex_filter;
    /**
     * List all child documents of directory path.
     * By default limited to 10000 documents.
     * @param query The database directory path.
     * @param opts List options.
     * @param options.projection The data attributes to retrieve, when left undefined all attributes are retrieved.
     * @returns Array of documents matching the path.
     */
    list(query: Query<Data>, opts?: {
        projection?: Collection.Projection;
        limit?: number;
    }): Promise<WithId<Data>[]>;
    /**
     * List all documents of the collection based on a query.
     * By default limited to 10000 documents.
     * @param query The query options.
     * @param opts List options.
     * @param options.projection The data attributes to retrieve, when left undefined all attributes are retrieved.
     * @returns Array of documents matching the query.
     */
    list_query(query: StrictFilter<Data>, opts?: {
        projection?: Collection.Projection;
        limit?: number;
    }): Promise<WithId<Data>[]>;
    /**
     * List all documents of the collection.
     * By default limited to 10000 documents.
     * @param query The query to filter documents.
     * @param opts List options.
     * @param options.projection The data attributes to retrieve, when left undefined all attributes are retrieved.
     * @returns Array of all documents in the collection.
     */
    list_all(query?: StrictFilter<Data>, opts?: {
        projection?: Collection.Projection;
        limit?: number;
    }): Promise<WithId<Data>[]>;
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
    delete<Bulk extends boolean | undefined = undefined>(query: Query<Data>, opts?: Collection.DeleteOpts<Bulk>): Promise<Collection.DeleteResult<Data, Bulk>>;
    /**
     * Delete a document of the collection by query.
     * @param query The query object.
     * @throws Error if query is empty or invalid.
     * @throws a {@link Collection.DeleteError} if the deletion was not acknowledged, this does not check against the deleted document count.
     */
    delete_query(query: StrictFilter<Data>): Promise<mongodb.DeleteResult>;
    /**
     * Delete multiple documents matching the query.
     * @param query MongoDB query object.
     * @throws a {@link Collection.DeleteError} if the deletion was not acknowledged, this does not check against the deleted document count.
     */
    delete_many(query: StrictFilter<Data>): Promise<mongodb.DeleteResult>;
    /**
     * Delete all documents in the collection, optionally by query.
     * @throws a {@link Collection.DeleteError} if the deletion was not acknowledged, this does not check against the deleted document count.
     */
    delete_all(query?: StrictFilter<Data>): Promise<mongodb.DeleteResult>;
    /**
     * Delete all documents from the collection and drop the collection.
     *
     * @note This function is not supported for transaction based collections.
     */
    delete_collection(): Promise<void>;
    /**
     * Clean a document from all default system attributes.
     * @param doc The document to clean.
     * @returns The cleaned document without system attributes.
     */
    clean<T extends Partial<Data> = Data>(doc: T): T | undefined;
    /**
     * Execute bulk write operations.
     * @param operations Array of bulk write operations.
     * @returns MongoDB BulkWriteResult.
     */
    bulk_operations(operations?: mongodb.AnyBulkWriteOperation<Data>[]): Promise<BulkWriteResult>;
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
    aggregate<T extends Partial<Data> = Data>(pipeline: mongodb.Document[], opts: {
        cursor?: false;
        clean?: boolean;
    }): Promise<T[]>;
    aggregate<T extends Partial<Data> = Data>(pipeline: mongodb.Document[], opts?: {
        cursor: true;
        clean?: boolean;
    }): Promise<AggregationCursor<T>>;
    /**
     * Start a new transaction by creating a TransactionCollection instance.
     * @returns A new TransactionCollection instance with transaction capabilities.
     */
    start_transaction(): Promise<TransactionCollection<Data>>;
}
/** Nested types for the {@link Collection} class. */
export declare namespace Collection {
    /** The constructor options for {@link Collection}. */
    interface Opts<Data extends mongodb.Document = mongodb.Document> {
        /** The name of the collection. */
        name: string;
        /** The MongoDB collection instance. */
        col?: mongodb.Collection<Data>;
        /** The time to live for every record in the collection. */
        ttl?: number | {
            /** The time to live value in milliseconds. */
            milliseconds: number;
            /**
             * Enable sliding ttl (refreshes ttl on update), or static ttl (sets ttl on insert)
             * Defaults to `true`.
             */
            sliding?: boolean;
        };
        /** The indexes to create / validate upon initialization. */
        indexes?: (string | IndexOpts)[];
        /** Construct the collection in transaction mode. */
        transaction_based?: false;
        /** The {@link Database} instance. */
        db: Database;
        derived_collection?: never;
    }
    /** The options for {@link Collection.load} */
    interface LoadOpts<Data extends mongodb.Document = mongodb.Document> {
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
    type LoadResult<Data extends mongodb.Document = mongodb.Document, O extends Collection.LoadOpts<Data> | undefined = undefined> = O extends {
        projection: infer P extends Projection;
    } ? (O extends {
        default: Data;
    } ? ProjectedDocument<Data, P> : ProjectedDocument<Data, P> | undefined) : (O extends {
        default: Data;
    } ? WithId<Data> : WithId<Data> | undefined);
    /** Only allow specific keys from T */
    type Exact<T extends Record<PropertyKey, unknown>> = T & {
        [K in Exclude<PropertyKey, keyof T>]?: never;
    };
    /**
     * Options for the save operation.
     *
     * @template Bulk - If true, returns an unexecuted bulk operation object
     * @template Return - If true, returns the updated document
     * @template Throw - If false (only with return:true, upsert:false), returns undefined instead of throwing
     * @template Upsert - If true/undefined, creates document if missing (default: true)
     */
    type SaveOpts<Bulk extends boolean | undefined = boolean | undefined, Return extends boolean | undefined = boolean | undefined, Throw extends boolean | undefined = boolean | undefined, Upsert extends boolean | undefined = boolean | undefined> = Bulk extends true ? {
        bulk: Bulk;
        return?: never;
        throw?: true;
        upsert?: Upsert;
    } : Return extends true ? Upsert extends false ? {
        bulk?: false;
        return: Return;
        throw?: Throw;
        upsert: Upsert;
    } : {
        bulk?: false;
        return: Return;
        throw?: false;
        upsert?: Upsert;
    } : {
        bulk?: false;
        return?: false;
        throw?: true;
        upsert?: Upsert;
    };
    /** The return type of {@link Collection.save} by separate flags instead of a single option object */
    type SaveResult<Data extends mongodb.Document = mongodb.Document, Bulk extends boolean | undefined = boolean | undefined, Return extends boolean | undefined = boolean | undefined, Throw extends boolean | undefined = boolean | undefined, Upsert extends boolean | undefined = boolean | undefined> = Bulk extends true ? mongodb.AnyBulkWriteOperation<Data> : Return extends true ? Throw extends false ? Upsert extends false ? WithId<Data> | undefined : WithId<Data> : WithId<Data> : undefined;
    /** The return type of {@link Collection.save} */
    type SaveResultBy<Data extends mongodb.Document = mongodb.Document, O extends Collection.SaveOpts | undefined = undefined> = O extends {
        bulk?: infer Bulk extends boolean | undefined;
        return?: infer Return extends boolean | undefined;
        throw?: infer Throw extends boolean | undefined;
        upsert?: infer Upsert extends boolean | undefined;
    } ? SaveResult<Data, Bulk, Return, Throw, Upsert> : never;
    /** The options (third arg) for {@link Collection.set} */
    type SetOpts<Bulk extends boolean | undefined = boolean | undefined, Return extends boolean | undefined = boolean | undefined, Throw extends boolean | undefined = boolean | undefined, Upsert extends boolean | undefined = boolean | undefined> = SaveOpts<Bulk, Return, Throw, Upsert> & {
        /** If true, the operation will flatten the input data to a dot nested notation. */
        flatten?: boolean;
    };
    /** The return type of {@link Collection.set} by separate flags instead of a single option object */
    type SetResult<Data extends mongodb.Document = mongodb.Document, Bulk extends boolean | undefined = boolean | undefined, Return extends boolean | undefined = boolean | undefined, Throw extends boolean | undefined = boolean | undefined, Upsert extends boolean | undefined = boolean | undefined> = SaveResult<Data, Bulk, Return, Throw, Upsert>;
    /** The return type of {@link Collection.set} */
    type SetResultBy<Data extends mongodb.Document = mongodb.Document, O extends Collection.SetOpts | undefined = undefined> = SaveResultBy<Data, O>;
    /** The options for {@link Collection.delete} */
    interface DeleteOpts<Bulk extends boolean | undefined = undefined> {
        /** If true, the operation will return a non executed bulk operation object. */
        bulk?: Bulk;
    }
    /** The return type of {@link Collection.delete} */
    type DeleteResult<Data extends mongodb.Document = mongodb.Document, Bulk extends boolean | undefined = undefined> = Bulk extends true ? mongodb.AnyBulkWriteOperation<Data> : mongodb.DeleteResult;
    /** The return type of {@link Collection.delete} */
    type DeleteResultBy<Data extends mongodb.Document = mongodb.Document, O extends Collection.DeleteOpts | undefined = undefined> = O extends {
        bulk: true;
    } ? mongodb.AnyBulkWriteOperation<Data> : mongodb.DeleteResult;
    /** Error thrown when a write operation fails. */
    class WriteError extends Error {
        query: Record<string, any> | Record<string, any>[];
        constructor(message: string, query: Record<string, any> | Record<string, any>[]);
    }
    /** Error thrown when a delete operation fails. */
    class DeleteError extends Error {
        query: Record<string, any> | Record<string, any>[];
        constructor(message: string, query: Record<string, any> | Record<string, any>[]);
    }
    /**
     * The attributes to include (1) or exclude (0) from the loaded document in a database query.
     * Mixing inclusion and exclusion patterns is not allowed, following mongodb rules.
     */
    type Projection = readonly string[] | Record<string, number | boolean>;
    /** The nested types for the {@link Projection} type. */
    namespace Projection {
        /**
         * Convert a projection query into a MongoDB-compatible format.
         * @throws An error if both inclusion (1) and exclusion (0) patterns are found,
         *         since this is not allowed by mongodb.
         */
        function init(projection: Projection): Record<string, number | boolean>;
        type IncludeKeys<P> = P extends readonly (infer K)[] ? Extract<K, string> : P extends Record<string, 0 | 1 | boolean> ? {
            [K in keyof P]: P[K] extends 1 | true ? (K & string) : never;
        }[keyof P] : never;
        type ExcludeKeys<P> = P extends Record<string, 0 | 1 | boolean> ? {
            [K in keyof P]: P[K] extends 0 | false ? (K & string) : never;
        }[keyof P] : never;
        /**
         * Determines which keys from `Data` are included after applying projection `P`.
         *
         * - Empty `[]` or `{}` → all keys (no projection)
         * - Array `["field1", ...]` → specified fields + "_id"
         * - Inclusion `{field1: 1}` → specified fields + "_id" (unless `{_id: 0}`)
         * - Exclusion `{field1: 0}` → all keys except excluded ones
         */
        type IncludedKeysFor<Data extends mongodb.Document, P> = P extends readonly [] ? keyof WithId<Data> : P extends readonly any[] ? ("_id" | (IncludeKeys<P> & keyof WithId<Data>)) : ([
            keyof P
        ] extends [never] ? keyof WithId<Data> : P extends Record<string, 0 | 1 | boolean> ? (IncludeKeys<P> extends never ? Exclude<keyof WithId<Data>, ExcludeKeys<P>> : ((IncludeKeys<P> & keyof WithId<Data>) | (P extends {
            _id: 0 | false;
        } ? never : "_id"))) : keyof WithId<Data>);
    }
    /**
     * Projected document.
     * The projected fields are included as is, and the non included fields
     * are included as optional, since {@link LoadOpts.default} may add them.
     */
    type ProjectedDocument<Data extends mongodb.Document, Prjct extends readonly string[] | Record<string, number | boolean>> = Prjct extends readonly [] ? WithId<Data> : [
        keyof Prjct
    ] extends [never] ? WithId<Data> : Partial<Omit<WithId<Data>, Projection.IncludedKeysFor<Data, Prjct>>> & Pick<WithId<Data>, Extract<Projection.IncludedKeysFor<Data, Prjct>, keyof WithId<Data>>>;
}
/**
 * TransactionCollection extends Collection with transaction-specific methods.
 * This class provides commit and abort functionality for MongoDB transactions.
 */
export declare class TransactionCollection<Data extends mongodb.Document = mongodb.Document> extends Collection<Data> {
    commit(): Promise<void>;
    abort(): Promise<void>;
    /**
     * Cleanup method for proper resource management
     * Can be called manually or via async disposal
     *
     * @warning This method aborts the transaction if it is still active.
     */
    cleanup(): Promise<void>;
    [Symbol.asyncDispose](): Promise<void>;
    /**
     * Check if the transaction is still active (not finalized).
     * @returns True if the transaction is active, false otherwise.
     */
    is_active(): boolean;
}
/** Nested types for the {@link TransactionCollection} class. */
export declare namespace TransactionCollection {
    /** The constructor options for a transaction based {@link Collection}. */
    interface Opts<Data extends mongodb.Document = mongodb.Document> {
        /** Construct the collection in transaction mode. */
        transaction_based: true;
        /**
         * The derived collection
         * @warning Ensure this collection is initialized by {@link init},
         *         or an error will be thrown when attempting to construct
         *         a transaction based collection instance.
         */
        derived_collection: (Omit<Collection<Data>, "_col" | "initialized"> & {
            initialized: true;
            _col: mongodb.Collection<Data>;
        });
        name?: never;
        col?: never;
        ttl?: never;
        indexes?: never;
        db?: never;
    }
}
