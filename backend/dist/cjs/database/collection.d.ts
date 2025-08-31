/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh.
 */
import { WithId } from 'mongodb';
import * as mongodb from 'mongodb';
import type { Database } from "./database.js";
import { StrictFilter, StrictUpdateFilter } from "./filters/filters.js";
import { FlattenToDotNotation } from "./flatten.js";
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
    protected readonly _init_indexes?: (string | Collection.IndexOpts)[];
    /** The MongoDB client session for transaction support. */
    protected _session?: mongodb.ClientSession;
    /**
     * The record type version for the database.
     * See {@link Collection.Opts.record_version} for more info.
     *
     * Ensure its always defined so we always set the version to `1`,
     * in case the user decides later that it would need the transform version
     * for older documents. Otherwise they would not have the old `1` version.
     */
    readonly record_version: number;
    /**
     * The function to transform an older document version to the current version.
     * See {@link Collection.Opts.on_transform_version} for more info.
     */
    readonly on_transform_version?: Collection.OnTransformVersion<Data>;
    /**
     * Save fully transformed documents again to prevent unneeded future transformations.
     * See {@link Collection.Opts.persist_transformed_on_load} for more info.
     */
    readonly persist_transformed_on_load: boolean | "replace";
    /**
     * The function to call when a document is loaded (also when a default value is used).
     * See {@link Collection.Opts.on_load} for more info.
     */
    readonly on_load_cb?: Collection.OnLoad<Data>;
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
     * Injects `__record_version` into an update **only on insert paths**.
         *
             * Rules:
             * - **Pipeline updates** (`update: Document[]`): no-op here (MongoDB has no `$setOnInsert` in pipelines).
             *   If you rely on upsert+pipeline, set `__record_version` explicitly in your pipeline.
     * - **Replacement doc** (no operators):
     *   - When `upsert === true`, set `__record_version` **only if missing**.
     *   - When `upsert !== true`, do nothing (don’t mask older stored versions).
         * - **Operator doc**:
         *   - Respect any user-provided `__record_version` in `$set` or `$setOnInsert`.
         *   - When `upsert === true` and the user didn’t provide a value, set it via `$setOnInsert`.
     *
         * Rationale:
             * This avoids bumping `__record_version` during normal updates (which would mask older versions)
             * while still stamping newly inserted documents.
     */
    private _apply_record_version_to_operation;
    /**
     * Decide if an error is worth a bounded retry.
     * Prefers label-based detection and adds well-known transient/network surfaces.
     *
     * @param unknown_err The thrown error.
     * @returns True for retryable/transient errors; false otherwise.
     */
    private _should_retry_error;
    /**
     * Execute an async function with bounded, exponential backoff retries for retryable errors.
     *
     * - attempts: 1 ⇒ no retry (single execution).
     * - Uses small bounded jitter to smooth load (see Collection.Retry).
     *
     * @param fn The async operation to execute.
     * @param retry Number of attempts (1 = no retries) or {@link Collection.Retry.Opts}.
     * @returns The function result when successful.
     * @throws The last error if not retryable or retries exhausted.
     */
    private _with_retry;
    /**
     * Ensure `__record_version` is properly included for projections so version
     * transformation can determine the original version reliably.
     *
     * @param projection The user-specified projection (if any).
     * @returns A projection with `__record_version` enforced where needed.
     */
    private _ensure_version_in_projection;
    /**
     * Determine whether a projection should be considered partial.
     * @param projection The user-specified projection (if any).
     * @returns True when a non-empty projection was provided.
     */
    private _is_partial_projection;
    /**
      * Check whether the given update is operator-style (or a pipeline).
      * - Aggregation pipeline: Array → valid.
      * - Operator update: at least one top-level key starts with '$' → valid.
      * - Plain object without '$' keys → NOT valid for updateOne/findOneAndUpdate.
      */
    private _is_operator_update_or_pipeline;
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
    create_index(opts: string | Collection.IndexOpts): Promise<string>;
    /**
     * Standalone helper: merge `source` into `target` for missing keys only.
     * Clones assigned nested objects/arrays/dates once (when `clone` is true).
     *
     * @throws An error if the max depth recursion depth has been exceeded.
     */
    static insert_defaults(target: Record<string, any>, source: Record<string, any>, opts?: {
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
     * Execute `on_transform_version` and `on_load_cb` on a loaded document.
     * Ensures `__record_version` is set when {@link record_version} is defined.
     *
     * @param data The loaded document.
     * @param opts Additional options.
     *
     * @returns The transformed document.
     *
     * @throws {Collection.OnTransformError} When an error occurs during the {@link Collection.Opts.on_transform_version} callback.
     * @throws {Collection.OnLoadError} When an error occurs during the {@link Collection.Opts.on_load} callback.
     */
    apply_on_load<Projection extends Collection.Projection | undefined>(data: any, opts: {
        /**
         * The projection option for the load operation
         * Assign to `undefined` when no projection was defined.
         */
        projection: Projection;
        /**
         * The permission to persist the document after making
         * the necessary `on_transform_version` transformations.
         */
        persist: boolean;
        /**
         * Await the persist operation.
         * Note that errors encountered during the save operation are silently ignored.
         */
        await_persist: boolean;
    }): Promise<any>;
    /**
     * Count documents accurately using MongoDB's `countDocuments`.
     *
     * @param query An optional filter to count matching documents. When omitted, counts all documents.
     * @param opts  Additional options, see {@link Collection.CountOpts}.
     *
     * @note The `opts.throw` option defaults to `true`.
     *
     * @returns
     * - A number representing the accurate count when successful.
     * - A {@link Collection.CountError} when `opts.throw === false` and an error occurs.
     *
     * @throws {Collection.CountError} When `throw !== false` and the count fails.
     * @throws {InvalidUsageError} (always) When the provided argument(s) are invalid or if the collection was not used properly.
     */
    count<Throw extends Collection.CountOpts.Throw = undefined>(query?: Collection.Query<Data>, opts?: Collection.CountOpts<Throw>): Promise<Collection.CountResult<Throw>>;
    /**
     * Return a fast, approximate count of the entire collection using
     * MongoDB's `estimatedDocumentCount`. This method does **not** accept
     * a filter and may be off under heavy churn.
     *
     * @param opts Additional options, see {@link Collection.CountOpts}.
     *
     * @note The `opts.throw` option defaults to `true`.
     *
     * @returns
     * - A number representing the estimated total number of documents when successful.
     * - A {@link Collection.CountError} when `opts.throw === false` and an error occurs.
     *
     * @throws {Collection.CountError} When `throw !== false` and the count fails.
     * @throws {InvalidUsageError} (always) When the collection was not used properly.
     */
    count_estimated<Throw extends Collection.CountOpts.Throw = undefined>(opts?: Collection.CountOpts<Throw>): Promise<Collection.CountResult<Throw>>;
    /**
     * List all documents for a specific query.
     *
     * @param query The database directory path.
     * @param opts The list options, see {@link Collection.ListOpts}.
     * @param allow_empty_query When `true`, allows an empty query (i.e. `{}`) to be passed, which would otherwise throw an error.
     *
     * @note The `opts.throw` option defaults to `true`.
     * @note The {@link Collection.Opts.on_load} and {@link Collection.Opts.on_transform_version} callbacks
     *       are not executed when `opts.cursor === true`.
     * @note When `opts.callback` is a function (and `opts.cursor !== true`), this method streams documents and
     *       invokes the callback for each processed document, then returns `undefined` on success.
     *       This mode is memory-friendly and avoids accumulating the entire result set.
     *
     * @returns
     * - An error if `opts.throw === false` and a {@link Collection.ListError} has occurred.
     * - The find cursor when `opts.cursor === true`.
     * - When `opts.callback && !opts.cursor` is provided, `undefined` on success.
     * - When `opts.page_info === true && !opts.cursor && !opts.callback`, returns {@link Collection.ListedPage}.
     * - Otherwise, an array of documents matching the path.
     *
     * @throws {Collection.ListError} When `throw !== false` if an error occurred during the operation, in which case {@link Collection.ListError.cause} is defined.
     * @throws {InvalidUsageError} (always) When the provided argument(s) are invalid or if the collection was not used properly.
     */
    list<Projection extends Collection.ListOpts.Projection = undefined, Throw extends Collection.ListOpts.Throw = undefined, Cursor extends Collection.ListOpts.Cursor = undefined, Callback extends Collection.ListOpts.Callback<Data, Projection> = undefined, PageInfo extends Collection.ListOpts.PageInfo = undefined>(query: Collection.Query<Data>, opts?: Collection.ListOpts<Data, Projection, Throw, Cursor, Callback, PageInfo>, allow_empty_query?: boolean): Promise<Collection.ListResult<Data, Projection, Throw, Cursor, Callback, PageInfo>>;
    /**
     * List all documents of the collection.
     *
     * @param opts The list options, see {@link Collection.ListOpts}.
     *
     * @note The `opts.throw` option defaults to `true`.
     * @note The {@link Collection.Opts.on_load} and {@link Collection.Opts.on_transform_version} callbacks
     *       are not executed when `opts.cursor === true`.
     * @note When `opts.callback` is a function (and `opts.cursor !== true`), this method streams documents and
     *       invokes the callback for each processed document, then returns `undefined` on success.
     *
     * @returns
     * - Array of all documents in the collection.
     * - The find cursor when `opts.cursor === true`.
     * - `undefined` when `opts.callback && !opts.cursor`.
     * - An error if `opts.throw === false` and a {@link Collection.ListError} has occurred.
     *
     * @throws {Collection.ListError} When `throw !== false` if an error occurred during the operation, in which case {@link Collection.ListError.cause} is defined.
     * @throws {InvalidUsageError} (always) When the provided argument(s) are invalid or if the collection was not used properly.
     */
    list_all<Projection extends Collection.ListOpts.Projection = undefined, Throw extends Collection.ListOpts.Throw = undefined, Cursor extends Collection.ListOpts.Cursor = undefined, Callback extends Collection.ListOpts.Callback<Data, Projection> = undefined, PageInfo extends Collection.ListOpts.PageInfo = undefined>(opts?: Collection.ListOpts<Data, Projection, Throw, Cursor, Callback, PageInfo>): Promise<Collection.ListResult<Data, Projection, Throw, Cursor, Callback, PageInfo>>;
    /**
     * Check if a document exists by only loading the document's id.
     *
     * @param query The database path to the document.
     * @param opts The exists options, see {@link Collection.ExistsOpts}.
     *
     * @note The `opts.throw` option defaults to `true`.
     * @note This method does not execute the {@link Collection.Opts.on_load}
     *       and {@link Collection.Opts.on_transform_version} callbacks.
     *
     * @returns
     * - An error if `opts.throw === false` and a {@link Collection.ExistsError} has occurred.
     * - True if the document exists, false otherwise.
     *
     * @throws {Collection.ExistsError} When `throw !== false` if an error occurred during the operation, in which case {@link Collection.ExistsError.cause} is defined.
     * @throws {InvalidUsageError} (always) When the provided argument(s) are invalid or if the collection was not used properly.
     */
    exists<Throw extends Collection.ExistsOpts.Throw = undefined>(query: Collection.Query<Data>, opts?: Collection.ExistsOpts<Throw>): Promise<Collection.ExistsResult<Throw>>;
    /**
     * Load a single document by query.
     *
     * Applies an optional projection and, if a `default` is provided, inserts any
     * missing keys from the default into the loaded document (values are deep-cloned).
     *
     * @note The `default` value is deep-cloned if it is returned or inserted.
     * @note The `opts.throw` option defaults to `true`.
     *
     * @param query The database query.
     * @param opts Additional load options {@link Collection.LoadOpts}.
     *
     * @returns
     * - When `opts.throw === false`:
     *   - If found: the loaded (projected) document.
     *   - If not found and `opts.default` is provided: the deep-cloned default data.
     *   - If not found and no default: a {@link Collection.NotFoundError}.
     *   - On load failure: a {@link Collection.LoadError}.
     * - When `opts.throw !== false` (default):
     *   - If found: the loaded (projected) document.
     *   - If not found and `opts.default` is provided: the deep-cloned default data.
     *   - If not found and no default: a {@link Collection.NotFoundError} is **thrown**.
     *   - On load failure: a {@link Collection.LoadError} is **thrown**.
     *
     * @throws {Collection.LoadError} Only when `opts.throw !== false` and the load fails.
     * @throws {Collection.NotFoundError} When the document is not found and `opts.throw !== false && opts.default == null`.
     * @throws {InvalidUsageError} When the provided arguments are invalid or if the collection was not used properly.
     */
    load<Default extends Collection.LoadOpts.Default<Data> = undefined, Projection extends Collection.LoadOpts.Projection = undefined, Throw extends Collection.LoadOpts.Throw = undefined>(query: Collection.Query<Data>, opts?: Collection.LoadOpts<Data, Default, Projection, Throw>): Promise<Collection.LoadResult<Data, Default, Projection, Throw>>;
    /**
     * Save data with predefined `$set` behaviour.
     * When the document already exists this function only updates the specified content attributes.
     * When a document does not exist it will automatically be created, unless `opts.upsert !== false`.
     *
     * @param query The database query / path to the document.
     * @param content The data to save.
     * @param opts Additional options, see {@link Collection.SetOpts}.
     *
     * @note The `opts.throw` option defaults to `true`.
     * @note The `opts.upsert` option defaults to `true`.
     *
     * @returns
     * - When `opts.bulk === true`: an unexecuted bulk operation.
     * - When `opts.return === true`: the **updated** document; or a {@link Collection.SaveError} when `throw:false` and a write failure occurs.
     * - Otherwise: `undefined` on success; or a {@link Collection.SaveError} when `throw:false` and a write failure occurs.
     *
     * @throws {Collection.SaveError} Only when `opts.throw !== false` and the write fails.
     * @throws {InvalidUsageError} (always) When the provided argument(s) are invalid or if the collection was not used properly.
     */
    set<Bulk extends boolean | undefined = undefined, Return extends boolean | undefined = undefined, Throw extends boolean | undefined = undefined, Upsert extends boolean | undefined = undefined>(query: Collection.Query<Data>, content: Partial<Data> | Partial<FlattenToDotNotation<Data>>, opts?: Collection.SetOpts<Bulk, Return, Throw, Upsert>): Promise<Collection.SetResult<Data, Bulk, Return, Throw>>;
    /**
     * Save a single document without performing any default `$set` or `$inc` like operations.
     * When a document does not exist it will automatically be created unless `opts.upsert === false`.
     *
     * @param query The database query / path to the document.
     * @param operation The MongoDB update document or pipeline (e.g. `{ $set: { key: value } }`).
     * @param opts Additional options, see {@link Collection.SaveOpts}.
     *
     * @note The `opts.throw` option defaults to `true`.
     * @note The `opts.upsert` option defaults to `true`.
     * @note Replacement documents are not allowed here. An update operator
     *       document (e.g. `$set`, `$inc`) or an aggregation pipeline is required.
     *       To replace a document use {@link replace}.
     *
     * @returns
     * - When `opts.bulk === true`: an unexecuted bulk operation.
     * - When `opts.return === true`: the **updated** document; or a {@link Collection.SaveError} when `throw:false` and a write failure occurs.
     * - Otherwise: {@link mongodb.UpdateResult} on success; or a {@link Collection.SaveError} when `throw:false` and a write failure occurs.
     *
     * @throws {Collection.SaveError} Only when `opts.throw !== false` and the write fails.
     * @throws {InvalidUsageError} (always) When the provided argument(s) are invalid or if the collection was not used properly.
     */
    save<Bulk extends boolean | undefined = undefined, Return extends boolean | undefined = undefined, Throw extends boolean | undefined = undefined, Upsert extends boolean | undefined = undefined>(query: Collection.Query<Data>, operation: StrictUpdateFilter<Data> | mongodb.Document[], // @todo add strict pipeline type.
    opts?: Collection.SaveOpts<Bulk, Return, Throw, Upsert>): Promise<Collection.SaveResult<Data, Bulk, Return, Throw>>;
    /**
     * Save multiple documents without performing any default `$set` or `$inc` operations.
     * Uses MongoDB `updateMany` (unlike {@link save}, which uses `updateOne`).
     *
     * @param query      The database query / path to the documents.
     * @param operation  The MongoDB update document or pipeline (e.g. `{ $set: { ... } }`).
     * @param opts       Additional options, see {@link Collection.SaveManyOpts}.
     *
     * @note The `opts.throw` option defaults to `true`.
     * @note The `opts.upsert` option defaults to `false` (unlike {@link save}, which defaults to `true`).
     * @note When `opts.return` is truthy, this performs a **follow-up** {@link list} with the same `query`
     *       to return the (post-update) documents. This is **less efficient** than `save(..., { return: true })`
     *       because it requires an additional list query after the write.
     * @note If the follow-up `list()` fails:
     *       - with `opts.throw !== false`, it will throw a {@link Collection.ListError};
     *       - with `opts.throw === false`, it will return a {@link Collection.ListError}.
     *
     * @returns
     * - When `opts.bulk === true`: an unexecuted bulk operation (`{ updateMany: ... }`).
     * - When `opts.return` is falsy: {@link mongodb.UpdateResult} on success; or a {@link Collection.SaveError} when `throw:false`.
     * - When `opts.return` is truthy: the matched/updated docs (via `list()`); or
     *   - a {@link Collection.SaveError} when the write fails and `throw:false`, or
     *   - a {@link Collection.ListError} when the follow-up read fails and `throw:false`.
     *
     * @throws {Collection.SaveError} Only when `opts.throw !== false` and the write fails.
     * @throws {Collection.ListError} Only when `opts.throw !== false` and the follow-up list fails.
     * @throws {InvalidUsageError} (always) When the provided argument(s) are invalid or the collection was misused.
     */
    save_many<Bulk extends boolean | undefined = undefined, Return extends boolean | Collection.SaveManyReturnOpts | undefined = undefined, Throw extends boolean | undefined = undefined, Upsert extends boolean | undefined = undefined>(query: Collection.Query<Data>, operation: StrictUpdateFilter<Data> | mongodb.Document[], opts?: Collection.SaveManyOpts<Bulk, Return, Throw, Upsert>): Promise<Collection.SaveManyResult<Data, Bulk, Return, Throw>>;
    /**
 * Build an aggregation replacement pipeline that preserves _id on matches and
 * applies versioning/TTL consistently with non-pipeline paths.
 *
 * - On matches: preserve stored `__record_version` and (for static TTL) stored `__ttl_timestamp`.
 * - On upserts:
 *   - `__record_version`: respect user value if provided, else stamp `this.record_version`.
 *   - `__ttl_timestamp`:
 *       • sliding TTL  → always set to "now"
 *       • static  TTL  → respect user value if provided, else set to "now"
 *
 * @param base_replacement A shallow clone of the user replacement. For replace_many, pass without `_id`.
 * @param upsert           Whether the write is an upsert.
 * @param apply_ttl        Whether TTL logic should be applied (`this.ttl_enabled && opts?.apply_ttl !== false`).
 * @returns A MongoDB aggregation pipeline that performs the replacement.
 */
    private _build_replace_pipeline;
    /**
     * Replace a single document.
     * Accepts a replacement document only (no update operators/pipelines).
     *
     * Internally uses an aggregation pipeline to emulate a full replacement while preserving `_id`
     * for matched documents and applying record-version/TTL semantics consistently.
     *
     * @param query       The match filter.
     * @param replacement The replacement document, no `$` operators.
     * @param opts        Options, see {@link Collection.ReplaceOpts}.
     *
     * @note The `opts.throw` option defaults to `true`.
     * @note The `opts.upsert` option defaults to `true`.
     * @note TTL semantics:
     *       - When `opts.apply_ttl === false` (or TTL is disabled), the existing TTL is preserved for matched docs.
     *       - With sliding TTL, `__ttl_timestamp` is refreshed on every write.
     *       - With static TTL, matched docs keep their original TTL; upserts receive a fresh timestamp.
     *
     * @warning Updating the document id `_id` will cause undefined behaviour on matches. On matched documents,
     *          a user-supplied `_id` is ignored and the existing `_id` is preserved. On true upserts, a
     *          user-supplied `_id` is allowed and will be used by the server.
     *
     * @returns
     * - When `opts.bulk === true`: an unexecuted bulk operation.
     * - When `opts.return === true`: the **updated** document; or a {@link Collection.SaveError} when `throw:false` and a write failure occurs.
     * - Otherwise: {@link mongodb.UpdateResult} on success; or a {@link Collection.SaveError} when `throw:false` and a write failure occurs.
     *
     * @throws {Collection.SaveError} Only when `opts.throw !== false` and the write fails.
     * @throws {InvalidUsageError} (always) When the provided argument(s) are invalid or if the collection was not used properly.
     */
    replace<Bulk extends boolean | undefined = undefined, Return extends boolean | undefined = undefined, Throw extends boolean | undefined = undefined, Upsert extends boolean | undefined = undefined>(query: Collection.Query<Data>, replacement: Data, opts?: Collection.ReplaceOpts<Bulk, Return, Throw, Upsert>): Promise<Collection.ReplaceResult<Data, Bulk, Return, Throw>>;
    /**
     * Replace multiple documents matched by `query`.
     * Accepts a **replacement document only** (no update operators or pipelines).
     *
     * Internally uses an aggregation pipeline to emulate a full replacement while preserving `_id`
     * for matched documents and applying record-version/TTL semantics consistently.
     *
     * @param query        The match filter.
     * @param replacement  The replacement document, no `$` operators.
     * @param opts         Options, see {@link Collection.ReplaceManyOpts}.
     *
     * @note The `opts.throw` option defaults to `true`.
     * @note The `opts.upsert` option defaults to `false` (unlike {@link replace}, which defaults to `true`).
     * @note When `opts.return` is truthy, this performs a **follow-up** {@link list} with the same `query`
     *       to return the (post-update) documents. This is **less efficient** than `replace(..., { return: true })`
     *       because it requires an additional list query after the write.
     * @note TTL semantics:
     *       - When `opts.apply_ttl === false` (or TTL is disabled), the existing TTL is preserved for matched docs.
     *       - With sliding TTL, `__ttl_timestamp` is refreshed on every write.
     *       - With static TTL, matched docs keep their original TTL; upserts receive a fresh timestamp.
     *
     * @warning The `_id` field is handled with special care:
     *          - Any `_id` present in the `replacement` is **ignored/stripped** for `replace_many`.
     *            This prevents attempts to change immutable ids across multiple documents.
     *          - For matched documents, the existing `_id` is always preserved.
     *          - For true upserts (`opts.upsert === true` when no match occurs), the server will
     *            generate a new `_id`. If you need to upsert with a caller-chosen `_id`, use
     *            {@link replace} (single-document) instead.
     *
     * @returns
     * - When `opts.bulk === true`: an unexecuted bulk operation (`{ updateMany: ... }`).
     * - When `opts.return` is falsy: {@link mongodb.UpdateResult} on success; or a
     *   {@link Collection.SaveError} when `throw:false` and a write failure occurs.
     * - When `opts.return` is truthy: the matched/updated docs (via a follow-up {@link list});
     *   or a {@link Collection.SaveError} / {@link Collection.ListError} when `throw:false`.
     *
     * @throws {Collection.SaveError} Only when `opts.throw !== false` and the write fails.
     * @throws {Collection.ListError} Only when `opts.throw !== false` and the follow-up list fails.
     * @throws {InvalidUsageError} (always) When arguments are invalid or the collection was misused.
     */
    replace_many<Bulk extends boolean | undefined = undefined, Return extends boolean | Collection.SaveManyReturnOpts | undefined = undefined, Throw extends boolean | undefined = undefined, Upsert extends boolean | undefined = undefined>(query: Collection.Query<Data>, replacement: Data, opts?: Collection.ReplaceManyOpts<Bulk, Return, Throw, Upsert>): Promise<Collection.ReplaceManyResult<Data, Bulk, Return, Throw>>;
    /**
     * Delete a document of the collection.
     *
     * @param query The database query to the document.
     * @param opts Additional options, see {@link Collection.DeleteOpts}.
     *
     * @note The `opts.throw` option defaults to `true`.
     *
     * @returns
     * - An unexecuted bulk operation object if `bulk === true`.
     * - A {@link Collection.DeleteError} when occurred and `opts.throw === false`.
     * - A {@link mongodb.DeleteResult}.
     *
     * @throws {Collection.DeleteError} When `opts.throw !== false` and if the deletion was not acknowledged, this does not check against the deleted document count.
     * @throws {InvalidUsageError} (always) When the provided argument(s) are invalid or if the collection was not used properly.
     */
    delete<Bulk extends boolean | undefined = undefined, Throw extends boolean | undefined = undefined>(query: Collection.Query<Data>, opts?: Collection.DeleteOpts<Bulk, Throw>): Promise<Collection.DeleteResult<Data, Bulk, Throw>>;
    /**
     * Delete multiple documents matching the query.
     *
     * @param query The database query to the document(s).
     * @param opts Additional options, see {@link Collection.DeleteOpts}.
     * @param allow_empty_query When `true`, allows an empty query (i.e. `{}`) to be passed, which would otherwise throw an error.
     *
     * @note The `opts.throw` option defaults to `true`.
     *
     * @returns
     * - An unexecuted bulk operation object if `bulk === true`.
     * - A {@link Collection.DeleteError} when occurred and `opts.throw == false`.
     * - A {@link mongodb.DeleteResult}.
     *
     * @throws {Collection.DeleteError} When `opts.throw !== false` and if the deletion was not acknowledged, this does not check against the deleted document count.
     * @throws {InvalidUsageError} (always) When the provided argument(s) are invalid or if the collection was not used properly.
     */
    delete_many<Bulk extends boolean | undefined = undefined, Throw extends boolean | undefined = undefined>(query: Collection.Query<Data>, opts?: Collection.DeleteOpts<Bulk, Throw>, allow_empty_query?: boolean): Promise<Collection.DeleteResult<Data, Bulk, Throw>>;
    /**
     * Delete all documents in the collection.
     *
     * @param opts Additional options, see {@link Collection.DeleteOpts}.
     *
     * @note The `opts.throw` option defaults to `true`.
     *
     * @returns
     * - An unexecuted bulk operation object if `bulk === true`.
     * - A {@link Collection.DeleteError} when occurred and `opts.throw == false`.
     * - A {@link mongodb.DeleteResult}.
     *
     * @throws {Collection.DeleteError} When `opts.throw !== false` and if the deletion was not acknowledged, this does not check against the deleted document count.
     * @throws {InvalidUsageError} (always) When the provided argument(s) are invalid or if the collection was not used properly.
     */
    delete_all<Bulk extends boolean | undefined = undefined, Throw extends boolean | undefined = undefined>(opts?: Collection.DeleteOpts<Bulk, Throw>): Promise<Collection.DeleteResult<Data, Bulk, Throw>>;
    /**
     * Delete all documents from the collection and drop the collection.
     *
     * @note This function is not supported for transaction based collections.
     *
     * @param opts Additional options, see {@link Collection.DeleteOpts}.
     *
     * @note The `opts.throw` option defaults to `true`.
     *
     * @returns
     * - A {@link Collection.DeleteError} when occurred and `opts.throw === false`.
     * - Undefined upon success.
     *
     * @throws {Collection.DeleteError} When `opts.throw !== false` and if the deletion was not acknowledged, this does not check against the deleted document count.
     * @throws {InvalidUsageError} (always) When the provided argument(s) are invalid or if the collection was not used properly.
     */
    delete_collection<Throw extends boolean | undefined = undefined>(opts?: Collection.DeleteCollectionOpts<Throw>): Promise<Collection.DeleteCollectionResult<Throw>>;
    /**
     * Execute bulk write operations.
     *
     * @param operations Array of bulk write operations.
     * @param opts Additional options, see {@link Collection.BulkOpts}
     *
     * @note The `opts.throw` option defaults to `true`.
     *
     * @returns
     * - A {@link Collection.BulkError} if occurred and `opts.throw === false`.
     * - A {@link mongodb.BulkWriteResult}.
     *
     * @throws {Collection.BulkError} When `opts.throw !== false` and if the bulk operation failed, this does not check against the bulk write result (this may change in the future).
     * @throws {InvalidUsageError} (always) When the provided argument(s) are invalid or if the collection was not used properly.
     */
    bulk_operations<Throw extends boolean | undefined = undefined>(operations: mongodb.AnyBulkWriteOperation<Data>[], opts?: Collection.BulkOpts<Throw>): Promise<Collection.BulkResult<Throw>>;
    /**
     * Execute an aggregation pipeline.
     *
     * @param pipeline MongoDB aggregation pipeline stages.
     * @param opts Aggregation options, see {@link Collection.AggregateOpts}
     *
     * @note The `opts.throw` option defaults to `true`.
     * @note This method does not execute the {@link Collection.Opts.on_load}
     *       and {@link Collection.Opts.on_transform_version} callbacks.
     *
     * @returns
     * - A {@link Collection.AggregateError} if occurred and `opts.throw === false`.
     * - An {@link mongodb.AggregationCursor} if `opts.cursor === true`.
     * - An array of document results.
     *
     * @throws {Collection.AggregateError} When `opts.throw !== false` and if the aggregate operation failed, this does not check against the aggregate result (this may change in the future).
     * @throws {InvalidUsageError} (always) When the provided argument(s) are invalid or if the collection was not used properly.
     */
    aggregate<T extends Partial<Data> = Data, Throw extends boolean | undefined = undefined, Cursor extends boolean | undefined = undefined>(pipeline: mongodb.Document[], // @todo add strict pipeline type.
    opts?: Collection.AggregateOpts<Throw, Cursor>): Promise<Collection.AggregateResult<T, Throw, Cursor>>;
    /**
     * Clean a document from all default system attributes.
     * @param doc The document to clean.
     * @returns The cleaned document without system attributes.
     */
    clean<T extends Partial<Data> = Data>(doc: T): Omit<T, "_id" | "_path" | "__ttl_timestamp" | "__record_version">;
    /**
     * Start a new transaction by creating a TransactionCollection instance.
     * @returns A new TransactionCollection instance with transaction capabilities.
     */
    start_transaction(): Promise<TransactionCollection<Data>>;
    /** Prepare a _path based regex operation. @deprecated */
    private prepare_path_regex_filter;
}
/** Nested types for the {@link Collection} class. */
export declare namespace Collection {
    /** The constructor options for {@link Collection}. */
    export interface Opts<Data extends mongodb.Document = mongodb.Document> {
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
        indexes?: (string | Collection.IndexOpts)[];
        /** Construct the collection in transaction mode. */
        transaction_based?: false;
        /** The {@link Database} instance. */
        db: Database;
        /**
         * The record type version for the database.
         * Defaults to `1` when not defined.
         * When not `1`, {@link on_transform_version} must be defined.
         */
        record_version?: number;
        /**
         * The function to transform an older document version to the current version.
         *
         * Only allowed when {@link record_version} is defined.
         *
         * Executed before {@link on_load}.
         *
         * Any errors produced inside this callback will be wrapped in the `cause` of a {@link OnTransformError},
         * However, this error is often wrapped inside the `cause` of the operation specific error such as {@link LoadError}.
         *
         * @note This callback is executed when a document is loaded anywhere inside the {@link Collection} class.
         *       Except for the special cases mentioned in the warnings sections.
         *
         * @warning This callback is not executed:
         *          - When a `Cursor` is returned in for instance {@link Collection.list} or {@link Collection.aggregate}.
         *          - Inside the {@link Collection.aggregate} method.
         */
        on_transform_version?: OnTransformVersion<Data>;
        /**
         * If true, after a successful on_transform_version (and only when we loaded a full doc,
         * not a projection), the transformed document is persisted once so future reads don't
         * need to transform again.
         * If `replace`, the existing document is replaced with the transformed document.
         * Defaults to `true`.
         */
        persist_transformed_on_load?: boolean | "replace";
        /**
         * The function to call when a document is loaded, also when a default value is used.
         *
         * Executed after {@link on_transform_version}.
         *
         * Any errors produced inside this callback will be wrapped in the `cause` of a {@link OnLoadError},
         * However, this error is often wrapped inside the `cause` of the operation specific error such as {@link LoadError}.
         *
         * @note This callback is executed when a document is loaded anywhere inside the {@link Collection} class.
         *       Except for the special cases mentioned in the warnings sections.
         *
         * @warning This callback is not executed:
         *          - When a `Cursor` is returned in for instance {@link Collection.list} or {@link Collection.aggregate}.
         *          - Inside the {@link Collection.aggregate} method.
         */
        on_load?: OnLoad<Data>;
        derived_collection?: never;
    }
    /**
     * The type for the {@link Opts.on_transform_version} and {@link Collection.on_transform_version} callback.
     * @note The input `data` may be an older document shape that does not match {@link Data}.
     */
    export type OnTransformVersion<Data extends mongodb.Document> = <Projection extends Collection.LoadOpts.Projection>(data: Record<string, any>, opts: {
        from_version: undefined | number;
        to_version: number;
        projection: Projection;
        is_partial: Projection extends undefined ? false : true;
    }) => WithProjection<Projection, Data> | Promise<WithProjection<Projection, Data>>;
    /** The type for the {@link Opts.on_load} and {@link Collection.on_load_cb} callback */
    export type OnLoad<Data extends mongodb.Document> = <Projection extends Collection.LoadOpts.Projection>(data: WithProjection<Projection, Data>, opts: {
        projection: Projection;
        is_partial: Projection extends undefined ? false : true;
    }) => WithProjection<Projection, Data> | Promise<WithProjection<Projection, Data>>;
    /** Index options for {@link Collection.create_index}. */
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
     * Query type for querying documents.
     * @note Keep this as a simple alias for now in case we want to build in a
     *       `QueryByStrict<Data, Strict extends boolean>` like type to support strict and non strict.
     */
    export type Query<Data extends mongodb.Document> = StrictFilter<Data>;
    /** Mini module for managing retry attempts. */
    export namespace Retry {
        /**
         * Retry options for database operations such as {@link Collection.save}.
         *
         * The operation is only retried for retryable errors.
         */
        interface Opts {
            /**
             * The number of retry attempts, `1` means no retry but a single operation.
             * Minimum value is `1` maximum is `100`,
             * this value is automatically capped if exceeded.
             */
            attempts: number;
            /**
             * The initial delay before the first retry attempt (in milliseconds).
             * Defaults to `100`.
             */
            initial_delay?: number;
            /**
             * The maximum delay between retry attempts (in milliseconds).
             * Defaults to `1000`.
             */
            max_delay?: number;
            /**
             * A backoff factor to apply to the delay between attempts.
             * Defaults to `2`.
             */
            backoff_factor?: number;
        }
        /**
         * The normalized retry options interface.
         */
        interface Normalized extends Required<Opts> {
            /** Jitter ratio in `[0, 1]` to randomize backoff. */
            jitter_ratio: number;
        }
        /**
         * Get the number of attempts from a a retry type
         * @returns 1 when undefined, or the specified number of attempts,
         *          with a minimum of 1 and maximum of 100.
         */
        function get_attempts(retry: undefined | number | Opts): number;
        /**
         * Normalize retry options into a bounded, concrete shape.
         *
         * @param retry A retry attempts number or {@link Collection.Retry.Opts}.
         * @returns A normalized retry configuration.
         */
        function normalize(retry?: number | Opts): Normalized;
        /**
         * Compute a single backoff delay using exponential growth with bounded jitter.
         *
         * @param attempt_index Zero-based retry index (0 = first retry).
         * @param initial_delay Initial delay for the *first* retry.
         * @param backoff_factor Exponential factor.
         * @param max_delay Maximum delay cap.
         * @param jitter_ratio Additive jitter ratio in `[0, 1]`.
         * @returns Milliseconds to wait before the next retry.
         */
        function compute_backoff_delay(attempt_index: number, params: Normalized): number;
    }
    /**
     * Wrap a (return) type as an error or as the return type based on a `Throw` generic.
     * Generic `Throw` defaults to `true`, so `undefined` counts as `true`.
     *
     * @returns
     * 1. When `Throw`` is `true | undefined`, the returned type will be `NoThrowType`.
     * 2. When `Throw` is `false` the returned type will be `NoThrowType | PossibleErrors`.
     *
     * @template Throw The throw generic, defaults to `true` if `undefined`.
     * @template PossibleErrors The errors that are returned if `Throw` is `false`.
     * @template NoThrowType The type when `Throw` is `false`.
     */
    type WithThrow<Throw extends boolean | undefined, PossibleErrors extends Error, NoThrowType> = Throw extends true | undefined ? NoThrowType : NoThrowType | PossibleErrors;
    /**
     * Options for {@link Collection.count} and {@link Collection.count_estimated}.
     */
    export interface CountOpts<Throw extends CountOpts.Throw = undefined> {
        /**
         * When false, the operation will **not throw** on count-related failures.
         * Instead, it will return a {@link Collection.CountError}.
         * Defaults to `true`.
         */
        throw?: Throw;
        /**
         * Optional bounded retry attempts for retryable errors (e.g., transient/network).
         * Retries use exponential backoff. Defaults to `1` (no retry).
         * For specific control use {@link Collection.Retry.Opts}.
         */
        retry?: number | Collection.Retry.Opts;
        /** Per-operation timeout in milliseconds, mapped to `maxTimeMS`. */
        timeout?: number;
    }
    /** The nested types for {@link CountOpts}. */
    export namespace CountOpts {
        /** The default value for the `Throw` template of {@link CountOpts}. */
        type Throw = boolean | undefined;
    }
    /**
     * The return type of {@link Collection.count} and {@link Collection.count_estimated}.
     * @note `Error` is also a returned type since other errors might be thrown as well.
     */
    export type CountResult<Throw extends CountOpts.Throw = undefined> = WithThrow<Throw, Collection.CountError | Error, number>;
    /** The options for {@link Collection.list} and alike */
    export interface ListOpts<Data extends ListOpts.Data = ListOpts.Data, Projection extends ListOpts.Projection = undefined, Throw extends ListOpts.Throw = undefined, Cursor extends ListOpts.Cursor = undefined, Callback extends Collection.ListOpts.Callback<Data, Projection> = undefined, PageInfo extends ListOpts.PageInfo = undefined> {
        /**
         * The attributes to include (1) or exclude (0) from the document.
         * Mixing inclusion and exclusion patterns is not allowed, following mongodb rules.
         * @throws An error if inclusion and exclusion patterns are mixed.
         */
        projection?: Projection;
        /**
         * Maximum number of documents to return (non-negative integer).
         * If omitted, all matching documents are streamed and returned.
         * Pagination is always enabled; only the batch size is configurable.
         */
        limit?: number;
        /**
         * When false, the operation will **not throw** on list-related failures.
         * Instead, it will return a {@link Collection.ListError}.
         * Defaults to `true`.
         */
        throw?: Throw;
        /**
         * Optional bounded retry attempts for retryable errors (e.g., transient/network).
         * Retries use exponential backoff. Defaults to `1` (no retry).
         * For specific control use {@link Retry.Opts}.
         */
        retry?: number | Retry.Opts;
        /** Per-operation timeout in milliseconds, mapped to `maxTimeoutMS`. */
        timeout?: number;
        /** Set to sort the documents coming back from the query. Array of indexes, `[['a', 1]]` etc. */
        sort?: mongodb.Sort;
        /** Set to skip N documents ahead in your query (non-negative integer). */
        skip?: number;
        /**
         * Options for cursor-based pagination/streaming beyond any single-round-trip limit.
         * By default pagination is enabled.
         */
        pagination?: {
            /**
             * The pagination batch size, must be a number
             * between `1` and `10000`, defaults to `1000`.
            */
            batch_size?: number;
        };
        /**
         * Whether to return the find cursor or an array of found documents.
         * If `true` the find cursor is returned.
         * If `false | undefined` an array of documents is returned.
         * Defaults to `false`.
         */
        cursor?: Callback extends undefined ? PageInfo extends undefined ? Cursor : never : never;
        /**
         * A per-document callback to process each document **as it streams in**.
         *
         * When defined (and `cursor !== true`), {@link Collection.list} will:
         * - Iterate the cursor, apply {@link Collection.Opts.on_transform_version} and {@link Collection.Opts.on_load},
         *   then invoke this callback for **each** processed document,
         * - Respect `limit`, `skip`, `sort`, and `pagination.batch_size`,
         * - **Not** accumulate results in memory,
         * - Return `undefined` on success.
         *
         * @warning Mutually exclusive with `cursor:true` and `page_info:true`.
         */
        callback?: Cursor extends false | undefined ? PageInfo extends undefined ? Callback : never : never;
        /** If true (and not returning a cursor), then the returned result is wrapped in a {@link ListedPage}. */
        page_info?: Cursor extends false | undefined ? Callback extends undefined ? PageInfo : never : never;
    }
    /** A per-document streaming callback for {@link Collection.list}. */
    export type ListCallback<Data extends ListOpts.Data = ListOpts.Data, Projection extends ListOpts.Projection = undefined> = (
    /**
     * A single document from the result set.
     * Type: {@link WithProjection} of the collection's {@link Data} with {@link WithId}.
     */
    doc: WithProjection<Projection, WithId<Data>>) => void | Promise<void>;
    /** Nested types for the {@link ListOpts} */
    export namespace ListOpts {
        /** The default value for the `Data` template of {@link ListOpts} */
        type Data = mongodb.Document;
        /** The default value for the `Projection` template of {@link ListOpts} */
        type Projection = Collection.Projection | undefined;
        /** The default value for the `Throw` template of {@link ListOpts} */
        type Throw = boolean | undefined;
        /** The default value for the `Cursor` template of {@link ListOpts} */
        type Cursor = boolean | undefined;
        /** The default value for the `Callback` template of {@link ListOpts} */
        type Callback<D extends Data, P extends Projection> = ListCallback<D, P> | undefined;
        /** The default value for the `PageInfo` template of {@link ListOpts} */
        type PageInfo = boolean | undefined;
    }
    /** The returned page information. */
    export interface ListedPage<T> {
        /** The returned documents. */
        items: T[];
        /** Still has more documents. */
        has_more: boolean;
    }
    /**
     * The return type of {@link Collection.list} and alike
     * @note `Error` is also a returned type since some other errors might be thrown as well.
     */
    export type ListResult<Data extends ListOpts.Data = ListOpts.Data, Projection extends ListOpts.Projection = undefined, Throw extends ListOpts.Throw = undefined, Cursor extends ListOpts.Cursor = undefined, Callback extends ListOpts.Callback<Data, Projection> = undefined, PageInfo extends ListOpts.PageInfo = undefined> = WithThrow<Throw, Collection.ListError | Error, (Cursor extends true ? mongodb.FindCursor<WithProjection<Projection, WithId<Data>>> : Callback extends ListCallback<Data, Projection> ? undefined : PageInfo extends true ? ListedPage<WithProjection<Projection, WithId<Data>>> : WithProjection<Projection, WithId<Data>>[])>;
    /** The options for {@link Collection.exist} */
    export interface ExistsOpts<Throw extends ExistsOpts.Throw = undefined> {
        /**
         * When false, the operation will **not throw** on exist-related failures.
         * Instead, it will return a {@link Collection.ExistsError}.
         * Defaults to `true`.
         */
        throw?: Throw;
        /**
         * Optional bounded retry attempts for retryable errors (e.g., transient/network).
         * Retries use exponential backoff. Defaults to `1` (no retry).
         * For specific control use {@link Retry.Opts}.
         */
        retry?: number | Retry.Opts;
        /** Per-operation timeout in milliseconds, mapped to `maxTimeoutMS`. */
        timeout?: number;
    }
    /** Nested types for the {@link ExistsOpts} */
    export namespace ExistsOpts {
        /** The default value for the `Throw` template of {@link ExistsOpts} */
        type Throw = boolean | undefined;
    }
    /**
     * The return type of {@link Collection.exists} and alike
     * @note `Error` is also a returned type since some other errors might be thrown as well.
     */
    export type ExistsResult<Throw extends ExistsOpts.Throw = undefined> = WithThrow<Throw, ExistsError | Error, boolean>;
    /** The options for {@link Collection.load} */
    export interface LoadOpts<Data extends LoadOpts.Data = LoadOpts.Data, Default extends LoadOpts.Default<Data> = undefined, Projection extends LoadOpts.Projection = undefined, Throw extends LoadOpts.Throw = undefined> {
        /**
         * The default data to be returned when the data does not exist.
         *
         * Keys that do not exist in the loaded object, but do exist in the default object
         * will automatically be inserted upon loading.
         *
         * The object will automatically be deep-cloned if used as default or for insertion.
         *
         * @note This does not save the default data when the document does not exist, its merely used for the returned value.
         */
        default?: Default;
        /**
         * The attributes to include (1) or exclude (0) from the document.
         * Mixing inclusion and exclusion patterns is not allowed, following mongodb rules.
         * @throws An error if inclusion and exclusion patterns are mixed.
         */
        projection?: Projection;
        /**
         * When false, the operation will **not throw** on load-related failures.
         * Instead, it will return a {@link Collection.LoadError}.
         * Defaults to `true`.
         */
        throw?: Throw;
        /**
         * Optional bounded retry attempts for retryable errors (e.g., transient/network).
         * Retries use exponential backoff. Defaults to `1` (no retry).
         * For specific control use {@link Retry.Opts}.
         */
        retry?: number | Retry.Opts;
        /** Per-operation timeout in milliseconds, mapped to `maxTimeoutMS`. */
        timeout?: number;
    }
    /** Nested types for the {@link LoadOpts} interface. */
    export namespace LoadOpts {
        /** The default value for the `Data` template of {@link LoadOpts} */
        type Data = mongodb.Document;
        /** The default value for the `Default` template of {@link LoadOpts} */
        type Default<Data extends mongodb.Document> = Data | (() => Data) | undefined;
        /** The default value for the `Projection` template of {@link LoadOpts} */
        type Projection = Collection.Projection | undefined;
        /** The default value for the `Throw` template of {@link LoadOpts} */
        type Throw = boolean | undefined;
    }
    /** Helper type to return type unpack the default value type. */
    export type UnpackedDefault<Data extends LoadOpts.Data, Default extends LoadOpts.Default<Data>> = Default extends () => infer R ? R : Default;
    /**
     * The return type of {@link Collection.load}
     * @note `Error` is also a returned type since some other errors might be thrown as well.
     */
    export type LoadResult<Data extends LoadOpts.Data = LoadOpts.Data, Default extends LoadOpts.Default<Data> = undefined, Projection extends LoadOpts.Projection = undefined, Throw extends LoadOpts.Throw = undefined> = Default extends undefined ? WithThrow<Throw, Collection.NotFoundError | Collection.LoadError | Error, WithProjection<Projection, WithId<Data>>> : WithThrow<Throw, Collection.LoadError | Error, WithProjection<Projection, WithId<Data>> | WithId<UnpackedDefault<Data, Default>>>;
    /**
     * Options for the save operation.
     *
     * @property bulk   If `true`, returns an unexecuted bulk operation object.
     * @property return If `true` (and not bulk), return the **updated** document.
     * @property throw  When `false`, the operation will **not throw** on write-related failures.
     *                  Instead, it will return a {@link Collection.SaveError}.
     *                  Defaults to `true`.
     * @property upsert When true/undefined, the document will be created if it does not exist (default: true).
     *                  When `false`, no upsert is performed.
     * @property retry  Optional bounded retry attempts for retryable errors (e.g., transient/network).
     *                  Retries use exponential backoff. Defaults to `1` (no retry).
     *                  For specific control use {@link Retry.Opts}.
     * @property timeout Per-operation timeout in milliseconds, mapped to `maxTimeoutMS`.
     * @property apply_ttl If `false` the TTL index will not be applied to the operation.
     *                     This behaviour only takes effect if the collection has TTL settings enabled.
     *                     Defaults to `true`.
     */
    export type SaveOpts<Bulk extends boolean | undefined = undefined, Return extends boolean | undefined = undefined, Throw extends boolean | undefined = undefined, Upsert extends boolean | undefined = undefined> = Bulk extends true ? {
        bulk: Bulk;
        return?: never;
        throw?: never;
        upsert?: Upsert;
        retry?: never;
        timeout?: never;
        apply_ttl?: never;
    } : Return extends true ? Upsert extends false ? {
        bulk?: false;
        return: Return;
        throw?: Throw;
        upsert: Upsert;
        retry?: number | Retry.Opts;
        timeout?: number;
        apply_ttl?: boolean;
    } : {
        bulk?: false;
        return: Return;
        throw?: Throw;
        upsert?: Upsert;
        retry?: number | Retry.Opts;
        timeout?: number;
        apply_ttl?: boolean;
    } : {
        bulk?: false;
        return?: false;
        throw?: Throw;
        upsert?: Upsert;
        retry?: number | Retry.Opts;
        timeout?: number;
        apply_ttl?: boolean;
    };
    /**
     * The return type of {@link Collection.save}.
     * @note `Error` is also a returned type since some other errors might be thrown as well.
     */
    export type SaveResult<Data extends mongodb.Document = mongodb.Document, Bulk extends boolean | undefined = undefined, Return extends boolean | undefined = undefined, Throw extends boolean | undefined = undefined> = Bulk extends true ? mongodb.AnyBulkWriteOperation<Data> : Return extends true ? WithThrow<Throw, Collection.SaveError | Error, WithId<Data>> : WithThrow<Throw, Collection.SaveError | Error, mongodb.UpdateResult<Data>>;
    /** The options (third arg) for {@link Collection.set} */
    export type SetOpts<Bulk extends boolean | undefined = undefined, Return extends boolean | undefined = undefined, Throw extends boolean | undefined = undefined, Upsert extends boolean | undefined = undefined> = SaveOpts<Bulk, Return, Throw, Upsert> & {
        /** If true, the operation will flatten the input data to a dot nested notation. */
        flatten?: boolean;
    };
    /** The return type of {@link Collection.set}. */
    export type SetResult<Data extends mongodb.Document = mongodb.Document, Bulk extends boolean | undefined = undefined, Return extends boolean | undefined = undefined, Throw extends boolean | undefined = undefined> = SaveResult<Data, Bulk, Return, Throw>;
    /** The additional return options for {@link SaveManyOpts.return} */
    export type SaveManyReturnOpts = Omit<ListOpts, "throw" | "retry" | "timeout" | "cursor" | "page_info" | "callback">;
    /**
     * Options for the {@link Collection.save_many} operation.
     */
    export interface SaveManyOpts<Bulk extends boolean | undefined = undefined, Return extends boolean | undefined | SaveManyReturnOpts = undefined, Throw extends boolean | undefined = undefined, Upsert extends boolean | undefined = undefined> {
        /** If true, returns an unexecuted bulk operation object (`{ updateMany: ... }`). */
        bulk?: Bulk extends true ? Bulk : never;
        /**
         * When truthy, return the matched/updated documents by running a follow-up {@link list} with the same `query`.
         * You can pass `true` (no extra options), or an options object to control the follow-up read.
         * @warning This is **less efficient** than {@link save} with `return:true`,
         *          because it requires an additional read after the write.
         */
        return?: Bulk extends true ? never : (Return);
        /**
         * When false, the operation will **not throw** on write-related failures.
         * Instead it will return a {@link Collection.SaveError}. Defaults to `true`.
         */
        throw?: Bulk extends true ? never : (Throw);
        /**
         * When true, perform an upsert if no documents match the filter.
         * Defaults to `false` (unlike {@link save}, which defaults to `true`).
         */
        upsert?: Bulk extends true ? never : (Upsert);
        /**
         * Optional bounded retry attempts for retryable errors (e.g., transient/network) on the **write** operation.
         * Retries use exponential backoff. Defaults to `1` (no retry).
         * For specific control use {@link Retry.Opts}.
         */
        retry?: Bulk extends true ? never : (number | Retry.Opts);
        /** Per-operation timeout in milliseconds for the **write** call, mapped to `maxTimeMS`. */
        timeout?: Bulk extends true ? never : (number);
        /**
         * If `false` the TTL index will not be applied to the operation.
         * This behaviour only takes effect if the collection has TTL settings enabled.
         * Defaults to `true`.
         */
        apply_ttl?: boolean;
    }
    /**
     * The return type of {@link Collection.save_many}.
     */
    export type SaveManyResult<Data extends mongodb.Document = mongodb.Document, Bulk extends boolean | undefined = undefined, Return extends boolean | SaveManyReturnOpts | undefined = undefined, Throw extends boolean | undefined = undefined> = Bulk extends true ? mongodb.AnyBulkWriteOperation<Data> : (Return extends false | undefined ? WithThrow<Throw, Collection.SaveError | Error, mongodb.UpdateResult<Data>> : WithThrow<Throw, Collection.SaveError | Collection.ListError | Error, WithProjection<ExtractProjection<Return>, WithId<Data>>[]>);
    /** The options (third arg) for {@link Collection.replace} */
    export type ReplaceOpts<Bulk extends boolean | undefined = undefined, Return extends boolean | undefined = undefined, Throw extends boolean | undefined = undefined, Upsert extends boolean | undefined = undefined> = SaveOpts<Bulk, Return, Throw, Upsert>;
    /** The return type of {@link Collection.replace}. */
    export type ReplaceResult<Data extends mongodb.Document = mongodb.Document, Bulk extends boolean | undefined = undefined, Return extends boolean | undefined = undefined, Throw extends boolean | undefined = undefined> = SaveResult<Data, Bulk, Return, Throw>;
    /** The options for {@link Collection.replace_many} */
    export type ReplaceManyOpts<Bulk extends boolean | undefined = undefined, Return extends boolean | undefined | SaveManyReturnOpts = undefined, Throw extends boolean | undefined = undefined, Upsert extends boolean | undefined = undefined> = SaveManyOpts<Bulk, Return, Throw, Upsert>;
    /** The return type of {@link Collection.replace_many} */
    export type ReplaceManyResult<Data extends mongodb.Document = mongodb.Document, Bulk extends boolean | undefined = undefined, Return extends boolean | SaveManyReturnOpts | undefined = undefined, Throw extends boolean | undefined = undefined> = SaveManyResult<Data, Bulk, Return, Throw>;
    /** The options for {@link Collection.delete} */
    export interface DeleteOpts<Bulk extends boolean | undefined = undefined, Throw extends boolean | undefined = undefined> {
        /** If true, the operation will return a non executed bulk operation object. */
        bulk?: Bulk;
        /**
         * Optional bounded retry attempts for retryable errors (e.g., transient/network).
         * Retries use exponential backoff. Defaults to `1` (no retry).
         * For specific control use {@link Retry.Opts}.
         */
        retry?: number | Retry.Opts;
        /**
         * When false, the operation will **not throw** on delete-related failures.
         * Instead, it will return a {@link Collection.DeleteError}.
         * Defaults to `true`.
         */
        throw?: Throw;
        /** Per-operation timeout in milliseconds, mapped to `maxTimeoutMS`. */
        timeout?: number;
    }
    /** The return type of {@link Collection.delete} */
    export type DeleteResult<Data extends mongodb.Document = mongodb.Document, Bulk extends boolean | undefined = undefined, Throw extends boolean | undefined = undefined> = Bulk extends true ? mongodb.AnyBulkWriteOperation<Data> : WithThrow<Throw, DeleteError | Error, mongodb.DeleteResult>;
    /** The options for {@link Collection.delete_collection} */
    export type DeleteCollectionOpts<Throw extends boolean | undefined = undefined> = Pick<DeleteOpts<false, Throw>, "retry" | "throw" | "timeout">;
    /** The return type of {@link Collection.delete_collection} */
    export type DeleteCollectionResult<Throw extends boolean | undefined = undefined> = WithThrow<Throw, DeleteError | Error, undefined>;
    /** The options for {@link Collection.bulk_operations} */
    export interface BulkOpts<Throw extends boolean | undefined = undefined> {
        /**
         * Optional bounded retry attempts for retryable errors (e.g., transient/network).
         * Retries use exponential backoff. Defaults to `1` (no retry).
         * For specific control use {@link Retry.Opts}.
         */
        retry?: number | Collection.Retry.Opts;
        /**
         * When false, the operation will **not throw** on bulk-related failures.
         * Instead, it will return a {@link Collection.BulkError}.
         * Defaults to `true`.
         */
        throw?: Throw;
        /** Per-operation timeout in milliseconds, mapped to `maxTimeoutMS`. */
        timeout?: number;
    }
    /** The return type of {@link Collection.bulk_operations} */
    export type BulkResult<Throw extends boolean | undefined = undefined> = WithThrow<Throw, BulkError | Error, mongodb.BulkWriteResult>;
    /** The options for {@link Collection.aggregate} */
    export interface AggregateOpts<Throw extends boolean | undefined = undefined, Cursor extends boolean | undefined = undefined> {
        /**
         * Optional bounded retry attempts for retryable errors (e.g., transient/network).
         * Retries use exponential backoff. Defaults to `1` (no retry).
         * For specific control use {@link Retry.Opts}.
         */
        retry?: number | Collection.Retry.Opts;
        /**
         * When false, the operation will **not throw** on aggregation-related failures.
         * Instead, it will return a {@link Collection.AggregateError}.
         * Defaults to `true`.
         */
        throw?: Throw;
        /**
         * Whether to return the find cursor or an array of documents.
         * If `true` the aggregation cursor is returned.
         * If `false | undefined` an array of documents is returned.
         * Defaults to `false`.
         */
        cursor?: Cursor;
        /** Per-operation timeout in milliseconds, mapped to `maxTimeoutMS`. */
        timeout?: number;
    }
    /** The return type of {@link Collection.aggregate} */
    export type AggregateResult<Data extends mongodb.Document = mongodb.Document, Throw extends boolean | undefined = undefined, Cursor extends boolean | undefined = undefined> = WithThrow<Throw, AggregateError | Error, (Cursor extends true ? mongodb.AggregationCursor<Data> : Data[])>;
    /** The base error for {@link NotFoundError}, {@link DeleteError} etc. */
    export class OperationError extends Error implements OperationError.Opts {
        /** The error message. */
        message: string;
        query: Record<string, any> | Record<string, any>[];
        reason?: string;
        /** An optional error that caused this error. */
        cause?: unknown;
        /** Construct a not found error. */
        constructor(opts: OperationError.Opts);
    }
    /** The nested types for {@link BaseError} */
    export namespace OperationError {
        /** The constructor options for {@link BaseError} */
        interface Opts {
            /** The new error message. */
            message: string;
            /**
             * The document query.
             * May be an empty query, for instance when deleting all
             * documents in the collection, or for other reasons.
             */
            query: Record<string, any> | Record<string, any>[];
            /**
             * The reason code for the invalid usage error, e.g. `bad_ttl`
             * or `invalid_filter`.
             *
             * Could be used to detect specific issues with the request,
             */
            reason?: string;
            /** An optional error that caused this error. */
            cause?: unknown;
        }
    }
    /**
     * Error thrown when a document is not found.
     * This error extends the {@link OperationError} which in turn extends the default {@link Error} class.
     */
    export class NotFoundError extends OperationError {
        /**
         * Constructor method.
         * @param opts The error options, see {@link OperationError.Opts}.
         */
        constructor(opts: OperationError.Opts);
    }
    /**
     * Error thrown when a {@link Collection.Opts.on_transform_version} callback fails.
     * This error extends the {@link OperationError} which in turn extends the default {@link Error} class.
     */
    export class OnTransformError extends OperationError {
        /**
         * Constructor method.
         * @param opts The error options, see {@link OperationError.Opts}.
         */
        constructor(opts: OperationError.Opts);
    }
    /**
     * Error thrown when a {@link Collection.Opts.on_load} callback fails.
     * This error extends the {@link OperationError} which in turn extends the default {@link Error} class.
     */
    export class OnLoadError extends OperationError {
        /**
         * Constructor method.
         * @param opts The error options, see {@link OperationError.Opts}.
         */
        constructor(opts: OperationError.Opts);
    }
    /**
     * Error thrown when a count operation fails.
     * This error extends {@link OperationError} which in turn extends the default {@link Error} class.
     */
    export class CountError extends OperationError {
        /**
         * Construct a {@link CountError}.
         * @param opts The error options, see {@link OperationError.Opts}.
         */
        constructor(opts: OperationError.Opts);
    }
    /**
     * Error thrown when a list operation fails.
     * This error extends the {@link OperationError} which in turn extends the default {@link Error} class.
     */
    export class ListError extends OperationError {
        /**
         * Constructor method.
         * @param opts The error options, see {@link OperationError.Opts}.
         */
        constructor(opts: OperationError.Opts);
    }
    /**
     * Error thrown when a load operation fails.
     * This error extends the {@link OperationError} which in turn extends the default {@link Error} class.
     */
    export class ExistsError extends OperationError {
        /**
         * Constructor method.
         * @param opts The error options, see {@link OperationError.Opts}.
         */
        constructor(opts: OperationError.Opts);
    }
    /**
     * Error thrown when a load operation fails.
     * This error extends the {@link OperationError} which in turn extends the default {@link Error} class.
     */
    export class LoadError extends OperationError {
        /**
         * Constructor method.
         * @param opts The error options, see {@link OperationError.Opts}.
         */
        constructor(opts: OperationError.Opts);
    }
    /**
     * Error thrown when a save operation fails.
     * This error extends the {@link OperationError} which in turn extends the default {@link Error} class.
     */
    export class SaveError extends OperationError {
        /**
         * Constructor method.
         * @param opts The error options, see {@link OperationError.Opts}.
         */
        constructor(opts: OperationError.Opts);
    }
    /**
     * Error thrown when a delete operation fails.
     * This error extends the {@link OperationError} which in turn extends the default {@link Error} class.
     */
    export class DeleteError extends OperationError {
        /**
         * Constructor method.
         * @param opts The error options, see {@link OperationError.Opts}.
         */
        constructor(opts: OperationError.Opts);
    }
    /**
     * Error thrown when a bulk operation fails.
     * This error extends the {@link OperationError} which in turn extends the default {@link Error} class.
     */
    export class BulkError extends OperationError {
        /**
         * Constructor method.
         * @param opts The error options, see {@link OperationError.Opts}.
         */
        constructor(opts: OperationError.Opts);
    }
    /**
     * Error thrown when an aggregate operation fails.
     * This error extends the {@link OperationError} which in turn extends the default {@link Error} class.
     */
    export class AggregateError extends OperationError {
        /**
         * Constructor method.
         * @param opts The error options, see {@link OperationError.Opts}.
         */
        constructor(opts: OperationError.Opts);
    }
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
    export type Projected<Projection extends Collection.Projection, Data extends mongodb.Document> = Projection extends readonly [] ? WithId<Data> : [
        keyof Projection
    ] extends [never] ? WithId<Data> : Partial<Omit<WithId<Data>, Projection.IncludedKeysFor<Data, Projection>>> & Pick<WithId<Data>, Extract<Projection.IncludedKeysFor<Data, Projection>, keyof WithId<Data>>>;
    /**
     * Wrap a (return) type as a projected document or as a document type based on a `Projection` generic.
     * Generic `Projection` defaults to `undefined`, so `undefined` returns a non projected document.
     *
     * @returns
     * 1. When `Projection`` is `Collection.Projection`, the returned type will be `ProjectedDocument<Data, Projection>`.
     * 2. When `Projection` is `undefined` the returned type will be `Data`.
     *
     * @template Projection The throw generic, defaults to `undefined`.
     * @template Data The document data type.
     */
    export type WithProjection<Projection extends Collection.Projection | undefined, Data extends mongodb.Document> = Projection extends Collection.Projection ? Projected<Projection, Data> : Data;
    /** Extract the projection field from a type. */
    export type ExtractProjection<R> = R extends {
        projection?: infer P extends undefined | Collection.Projection;
    } ? P : undefined;
    export {};
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
