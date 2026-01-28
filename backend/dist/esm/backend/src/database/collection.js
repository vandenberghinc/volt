/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh.
 */
import * as mongodb from 'mongodb';
import * as vlib from "@vandenberghinc/vlib";
import { flatten } from "./flatten.js";
import { InvalidUsageError } from '../errors/index.js';
// ---------------------------------------------------------
// The collection class.
// ---------------------------------------------------------
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
 *
 * @nav Database
 * @docs
 */
export class Collection {
    /** Collection name */
    name;
    /** The mongo collection. */
    _col;
    /**
     * The Database parent class, used to initialize the collection on demand.
     * So the user can define collections at root level before the database is initialized.
     */
    db;
    /** Is initialized. */
    initialized = false;
    /** Whether this collection instance is transaction-based. */
    is_transaction = false;
    /** Whether this transaction has been finalized (committed or aborted). */
    is_finalized_transaction = false;
    /** Time to live in msec for all documents. */
    ttl;
    /** Is ttl behaviour enabled? */
    ttl_enabled;
    /** Enable sliding ttl (refreshes ttl on update), or static ttl (sets ttl on insert) */
    sliding_ttl;
    /**
     * The temporary indexes passed to the constructor for the init method.
     * @note This is not private so it can be updated by {@link QuotaManager}.
     */
    _init_indexes;
    /** The MongoDB client session for transaction support. */
    _session;
    /**
     * The record type version for the database.
     * See {@link Collection.Opts.record_version} for more info.
     *
     * Ensure its always defined so we always set the version to `1`,
     * in case the user decides later that it would need the transform version
     * for older documents. Otherwise they would not have the old `1` version.
     */
    record_version;
    /**
     * The function to transform an older document version to the current version.
     * See {@link Collection.Opts.on_transform_version} for more info.
     */
    on_transform_version;
    /**
     * Save fully transformed documents again to prevent unneeded future transformations.
     * See {@link Collection.Opts.persist_transformed_on_load} for more info.
     */
    persist_transformed_on_load;
    /**
     * The function to call when a document is loaded (also when a default value is used).
     * See {@link Collection.Opts.on_load} for more info.
     */
    on_load_cb;
    /**
     * Constructs a new Collection instance.
     *
     * @param opts The constructor options for the collection.
     *
     * @throws An error when attempting to initialize a transaction-based collection without initializing the derived collection first.
     *
     * @docs
     */
    constructor(opts) {
        // Public constructor.
        if (!opts.transaction_based) {
            this.name = opts.name;
            this._col = opts.col;
            this.db = opts.db;
            this._init_indexes = opts.indexes;
            this.is_transaction = false;
            // Set ttl behaviour.
            let ttl_ms;
            let ttl_sliding = true;
            if (typeof opts.ttl === "number") {
                ttl_ms = opts.ttl;
                ttl_sliding = true;
            }
            else if (opts.ttl && typeof opts.ttl === "object") {
                ttl_ms = opts.ttl.milliseconds;
                ttl_sliding = opts.ttl.sliding ?? true;
            }
            else {
                ttl_ms = undefined;
                ttl_sliding = true;
            }
            this.ttl = ttl_ms;
            this.ttl_enabled = this.ttl != null;
            this.sliding_ttl = ttl_sliding;
            // Versioning & load callbacks.
            if (opts.on_transform_version != null && opts.record_version == null) {
                throw new InvalidUsageError({
                    message: "Option 'on_transform_version' requires 'record_version' to be defined.",
                    reason: "missing_record_version",
                });
            }
            if (opts.record_version != null && (!Number.isInteger(opts.record_version) || opts.record_version < 1)) {
                throw new InvalidUsageError({
                    message: "Option 'record_version' must be a positive integer.",
                    reason: "invalid_record_version",
                });
            }
            const version = opts.record_version ?? 1;
            if (version !== 1 && opts.on_transform_version == null) {
                throw new InvalidUsageError({
                    message: "Option 'on_transform_version' must be set when 'record_version' is not 1.",
                    reason: "missing_transform_version",
                });
            }
            this.record_version = opts.record_version ?? 1;
            this.on_transform_version = opts.on_transform_version;
            this.on_load_cb = opts.on_load;
            this.persist_transformed_on_load = opts.persist_transformed_on_load ?? true;
        }
        // Private constructor for transaction based collections.
        else {
            // Ensure the derived collection is initialized, so we can skip this step in `init()`.
            if (!opts.derived_collection.initialized) {
                throw new InvalidUsageError({
                    message: `Derived collection "${opts.derived_collection.name}" is not yet initialized, this is required in order to construct a transaction based collection.`,
                    reason: "collection_not_initialized",
                });
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
            // Copy versioning & load callbacks from derived collection.
            this.record_version = opts.derived_collection.record_version;
            this.on_transform_version = opts.derived_collection.on_transform_version;
            this.on_load_cb = opts.derived_collection.on_load_cb;
            this.persist_transformed_on_load = opts.derived_collection.persist_transformed_on_load;
        }
    }
    // -------------------------------------------------------------------
    // Private methods.
    // -------------------------------------------------------------------
    /**
     * Initialize a database query from path or object.
     * @throws An error if the input type is incorrect, and optionally if the query is empty.
     */
    _init_query(query, allow_empty, param_name) {
        if (!query || typeof query !== "object" || Array.isArray(query)) {
            throw new InvalidUsageError({
                message: `Parameter "${param_name}" is not a valid query.`,
                reason: "invalid_query",
                field: param_name,
            });
        }
        if (!allow_empty && Object.keys(query).length === 0) {
            throw new InvalidUsageError({
                message: `Parameter "${param_name}" is an empty object.`,
                reason: "empty_query",
                field: param_name,
            });
        }
        return query;
    }
    /**
     * Setup the ttl configuration.
     *
     * @note When transaction mode is enabled, the session option will not be used.
     */
    async _setup_ttl() {
        //
        // WE DONT USE THE TRANSACTION SESSION IN THIS METHOD.
        //
        // This function is not accessible on transaction based collections.
        this.assert_not_transaction_based();
        // Check init.
        if (!this.initialized) {
            await this.init();
        }
        this.assert_init();
        if (!this.ttl_enabled || this.ttl == null) {
            return;
        }
        const desired_seconds = Math.max(1, Math.ceil(this.ttl / 1000));
        // 1) Get all indexes
        const indexes = await this._col.indexes(); // [{ key: { __ttl_timestamp: 1 }, expireAfterSeconds: 3600 }, ...]
        // 2) Find the TTL index
        const ttl_index = indexes.find(ix => ix && typeof ix.key === "object" && ix.key.__ttl_timestamp === 1);
        // 3a) Doesn't exist → create it
        if (!ttl_index) {
            await this._col.createIndex({ __ttl_timestamp: 1 }, { expireAfterSeconds: desired_seconds });
            return;
        }
        // 3b) Exists but wrong TTL → drop & recreate
        if (ttl_index.expireAfterSeconds !== desired_seconds) {
            let coll_mod_succeeded = false;
            try {
                await this.db._db.command({
                    collMod: this.name,
                    index: {
                        name: ttl_index.name,
                        expireAfterSeconds: desired_seconds
                    }
                });
                coll_mod_succeeded = true;
            }
            catch (error) {
            }
            if (!coll_mod_succeeded) {
                try {
                    await this._col.dropIndex(ttl_index.name ?? "__ttl_timestamp_1");
                }
                catch { /* ignore */ }
                await this._col.createIndex({ __ttl_timestamp: 1 }, { expireAfterSeconds: desired_seconds });
            }
        }
        // 3c) Exists and correct → nothing to do
    }
    /**
     * Apply the ttl timestamp to a database operation (update doc or pipeline).
     * Do not upsert if the user explicitly sets `upsert: false` in the operation.
     */
    _apply_ttl_to_operation(operation, upsert) {
        if (!this.ttl_enabled)
            return;
        const now = new Date();
        // Pipeline updates: append a $set stage
        if (Array.isArray(operation)) {
            if (this.sliding_ttl) {
                operation.push({ $set: { __ttl_timestamp: now } });
            }
            else {
                // Static TTL: set only if missing to avoid refreshing on normal updates
                operation.push({ $set: { __ttl_timestamp: { $ifNull: ["$__ttl_timestamp", now] } } });
            }
            return;
        }
        // Classic update document with operators
        const opKey = this.sliding_ttl ? "$set" : "$setOnInsert";
        // For static TTL, only relevant if upsert is not explicitly false.
        if (this.sliding_ttl || upsert !== false) {
            const bucket = operation[opKey];
            if (bucket == null) {
                operation[opKey] = { __ttl_timestamp: now };
            }
            else if (typeof bucket === "object") {
                bucket.__ttl_timestamp = now;
            }
            else {
                throw new InvalidUsageError({
                    message: `Invalid update operator object for TTL control at "${opKey}".`,
                    reason: "bad_ttl_operator",
                });
            }
        }
    }
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
    _apply_record_version_to_operation(operation, upsert) {
        const current = this.record_version;
        if (current == null)
            return;
        // 1) Pipeline update: we cannot reliably $setOnInsert in aggregation pipelines.
        //    Do nothing here. If you rely on upsert+pipeline, set __record_version in user pipeline.
        if (Array.isArray(operation))
            return;
        const op = operation;
        const hasDollar = Object.keys(op).some(k => k[0] === "$");
        // 2) Replacement doc
        if (!hasDollar) {
            if (!upsert)
                return; // normal replace of existing doc → do not stamp
            // upsert replacement → insert path; stamp unless user provided a different value
            if (op.__record_version == null) {
                op.__record_version = current;
            }
            return;
        }
        // 3) Operator doc
        // Respect any user-provided versions
        const userSet = op?.$set?.__record_version;
        const userOnIns = op?.$setOnInsert?.__record_version;
        if (userSet != null || userOnIns != null)
            return;
        // Only set on insert path (true upsert); never set on $set for existing docs
        if (upsert) {
            op.$setOnInsert = { ...(op.$setOnInsert ?? {}), __record_version: current };
        }
    }
    /**
     * Decide if an error is worth a bounded retry.
     * Prefers label-based detection and adds well-known transient/network surfaces.
     *
     * @param unknown_err The thrown error.
     * @returns True for retryable/transient errors; false otherwise.
     */
    _should_retry_error(unknown_err) {
        if (typeof unknown_err !== "object" || !unknown_err || Array.isArray(unknown_err)) {
            return false;
        }
        const err = unknown_err;
        const name = err?.name;
        const code_name = err?.codeName;
        /** Safely check MongoDB error labels (driver-provided). */
        const has_label = (label) => {
            if (typeof err?.hasErrorLabel === "function") {
                try {
                    return !!err.hasErrorLabel(label);
                }
                catch {
                    return false;
                }
            }
            const labels = err?.errorLabels;
            return Array.isArray(labels) && labels.includes(label);
        };
        /** Normalize numeric error code when available. */
        const raw_code = err?.code;
        const numeric_code = typeof raw_code === "number" ? raw_code :
            (typeof raw_code === "string" && /^\d+$/.test(raw_code)) ? Number(raw_code) :
                undefined;
        /** Common Node.js system error codes that indicate transient I/O. */
        const sys_code = typeof raw_code === "string" && isNaN(Number(raw_code)) ? raw_code : undefined;
        const transient_sys = new Set([
            "ECONNRESET", "ETIMEDOUT", "EPIPE", "ECONNREFUSED",
            "ENETUNREACH", "ENETDOWN", "EHOSTUNREACH", "EAI_AGAIN"
        ]);
        // Do NOT retry an intentional/explicit abort
        if (name === "AbortError")
            return false;
        // Prefer official labels
        if (has_label("TransientTransactionError") ||
            has_label("UnknownTransactionCommitResult") ||
            has_label("RetryableWriteError")) {
            return true;
        }
        // Classic driver surfaces that usually resolve on retry
        if (name === "MongoNetworkError" ||
            name === "MongoNetworkTimeoutError" ||
            name === "MongoServerSelectionError" ||
            name === "MongoTopologyClosedError" ||
            (sys_code && transient_sys.has(sys_code))) {
            return true;
        }
        // Common network/replication/server transient codes
        switch (numeric_code) {
            case 6: /* HostUnreachable */ return true;
            case 7: /* HostNotFound */ return true;
            case 50: /* ExceededTimeLimit / MaxTimeMSExpired */ return true;
            case 89: /* NetworkTimeout */ return true;
            case 91: /* ShutdownInProgress */ return true;
            case 112: /* WriteConflict */ return true;
            case 189: /* PrimarySteppedDown */ return true;
            case 262: /* ExceededTimeLimit (variant) */ return true;
            case 10107: /* NotWritablePrimary / NotMaster */ return true;
            case 11600: /* InterruptedAtShutdown */ return true;
            case 11602: /* InterruptedDueToReplStateChange */ return true;
            case 13435: /* NotPrimaryNoSecondaryOk */ return true;
            case 13436: /* NotPrimaryOrSecondary */ return true;
            case 9001: /* SocketException */ return true;
            default: break;
        }
        // Some deployments bubble pool-cleared as codeName only
        if (code_name === "PoolClearedError")
            return true;
        return false;
    }
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
    async _with_retry(fn, retry) {
        const opts = Collection.Retry.normalize(retry);
        if (opts.attempts <= 1) {
            return await Promise.resolve().then(fn);
        }
        const last_index = opts.attempts - 1;
        for (let i = 0; i < opts.attempts; i++) {
            try {
                return await Promise.resolve().then(fn);
            }
            catch (err) {
                // Not retryable or out of attempts → rethrow immediately.
                if (!this._should_retry_error(err) || i >= last_index) {
                    throw err;
                }
                const delay = Collection.Retry.compute_backoff_delay(i, opts);
                if (delay > 0) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
                // Retry next loop iteration.
            }
        }
        // Type safety — logically unreachable.
        throw new Error("Unexpected retry loop termination in _with_retry");
    }
    /**
     * Ensure `__record_version` is properly included for projections so version
     * transformation can determine the original version reliably.
     *
     * @param projection The user-specified projection (if any).
     * @returns A projection with `__record_version` enforced where needed.
     */
    _ensure_version_in_projection(projection) {
        if (!projection)
            return projection;
        // Is inclusion based array.
        if (Array.isArray(projection)) {
            return projection.includes("__record_version")
                ? projection
                : [...projection, "__record_version"];
        }
        // Is exclusion based.
        if (Object.values(projection).some(v => v === 0 || v === false)) {
            if (projection["__record_version"] != null) {
                const clone = { ...projection };
                delete clone["__record_version"];
                return clone;
            }
            return projection;
        }
        // Is inclusion based.
        if (projection["__record_version"] !== 1 && projection["__record_version"] !== true) {
            return { ...projection, __record_version: 1 };
        }
        return projection;
    }
    /**
     * Determine whether a projection should be considered partial.
     * @param projection The user-specified projection (if any).
     * @returns True when a non-empty projection was provided.
     */
    _is_partial_projection(projection) {
        if (!projection)
            return false;
        if (Array.isArray(projection))
            return projection.length > 0;
        return Object.keys(projection).length > 0;
    }
    /**
      * Check whether the given update is operator-style (or a pipeline).
      * - Aggregation pipeline: Array → valid.
      * - Operator update: at least one top-level key starts with '$' → valid.
      * - Plain object without '$' keys → NOT valid for updateOne/findOneAndUpdate.
      */
    _is_operator_update_or_pipeline(operation) {
        return Array.isArray(operation) || (operation && typeof operation === "object" && Object.keys(operation).some(k => k[0] === "$"));
    }
    // -------------------------------------------------------------------
    // Public methods.
    // -------------------------------------------------------------------
    /**
     * Initialize the collection, creating indexes and setting up TTL if needed.
     * @returns The initialized collection instance.
     *
     * @docs
     */
    async init() {
        if (this.initialized === false) {
            this.db.server.log(3, "Initializing collection: ", this.name);
            // Initialize NON transaction based.
            if (!this.is_transaction) {
                // Create collection.
                if (this._col == null) {
                    this.db.server.log(3, "Checking collection: ", this.name);
                    // Start connection in dev mode.
                    if (!this.db.server.production) {
                        await this.db.ensure_connection();
                    }
                    // Not connected.
                    if (!this.db.connected || !this.db._db) {
                        throw new InvalidUsageError({
                            message: `Database client is not connected.`,
                            reason: "client_not_connected",
                        });
                    }
                    // Check if the collection exists
                    if (this.db._listed_cols == null) {
                        this.db.server.log(3, "Listing collections...");
                        this.db._listed_cols = await this.db._db.listCollections().toArray();
                        this.db.server.log(3, "Listed collections: " + this.db._listed_cols.map(x => x.name).join(", "));
                    }
                    // Create collection with retry logic for race conditions
                    if (!this.db._listed_cols.find(x => x.name === this.name)) {
                        this.db.server.log(3, "Creating collection: " + this.name);
                        let create_col_retries = 3;
                        let last_error = null;
                        let collection_created = false;
                        while (create_col_retries > 0 && !collection_created) {
                            try {
                                await this.db._db.createCollection(this.name);
                                collection_created = true;
                            }
                            catch (error) {
                                last_error = error;
                                if (error.codeName === "NamespaceExists") {
                                    collection_created = true; // Collection exists, that's ok
                                }
                                else if (create_col_retries > 1 && (error.code === 11000 || error.code === 48)) {
                                    create_col_retries--;
                                    await new Promise(r => setTimeout(r, 100));
                                }
                                else {
                                    throw error;
                                }
                            }
                        }
                        if (!collection_created && last_error) {
                            throw last_error;
                        }
                    }
                    // Create collection.
                    this.db.server.log(3, "Initializing mongodb collection connection: " + this.name);
                    this._col = this.db._db.collection(this.name);
                }
                // Assign as initialized when the column is created.
                // Also since next used methods are checking for this attribute.
                this.initialized = true;
                // Create ttl index.
                if (this.ttl_enabled) {
                    this.db.server.log(3, "Setting up TTL index for collection: " + this.name);
                    await this._setup_ttl();
                }
                // Create indexes.
                if (this._init_indexes?.length) {
                    for (const item of this._init_indexes) {
                        this.db.server.log(3, "Creating index " + JSON.stringify(item) + " on collection: " + this.name);
                        await this.create_index(item);
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
                    throw new InvalidUsageError({
                        message: "Database client is not initialized, this is likely because "
                            + "you did not initialize the transaction based collection through 'Collection.start_transaction'.",
                        reason: "client_not_connected",
                    });
                }
                if (!this._col) {
                    throw new InvalidUsageError({
                        message: "Derived collection is not initialized, this should have been initialized before passing it to a transaction based collection constructor.",
                        reason: "derived_collection_not_initialized",
                    });
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
     *
     * @docs
     */
    assert_init() {
        if (!this.initialized || this._col == null) {
            throw new InvalidUsageError({
                message: `Collection "${this.name}" is not initialized.`,
                reason: "collection_not_initialized",
            });
        }
    }
    /**
     * Assert that if this is a transaction, it has not been finalized.
     * @throws Error if this is a finalized transaction.
     *
     * @docs
     */
    assert_not_finalized() {
        if (this.is_transaction && this.is_finalized_transaction) {
            throw new InvalidUsageError({
                message: `Transaction has already been finalized (committed or aborted).`,
                reason: "transaction_finalized",
            });
        }
    }
    /**
     * Assert that this collection is not transaction based.
     *
     * @docs
     */
    assert_not_transaction_based() {
        if (this.is_transaction) {
            throw new InvalidUsageError({
                message: `Collection "${this.name}" is transaction based.`,
                reason: "collection_is_transaction",
            });
        }
    }
    /**
     * Get operation options with session if this is a transaction.
     * @returns Options object with session if applicable.
     *
     * @docs
     */
    get_operation_options(opts) {
        if (this.is_transaction && this._session) {
            return { ...opts, session: this._session };
        }
        return opts ?? {};
    }
    /**
     * Get the raw and initialized MongoDB collection.
     * @returns The MongoDB collection instance.
     *
     * @docs
     */
    async col() {
        await this.init();
        return this._col;
    }
    /**
     * Check if an index exists.
     * @note Not supported for transaction based collections.
     * @param index The name of the index to check.
     * @returns True if the index exists, false otherwise.
     *
     * @docs
     */
    async has_index(index) {
        if (!this.initialized) {
            await this.init();
        }
        this.assert_init();
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
     *
     * @docs
     */
    async create_index(opts) {
        // Not supported on transaction-based collections.
        this.assert_not_transaction_based();
        // Ensure initialized
        if (!this.initialized) {
            await this.init();
        }
        this.assert_init();
        // ---- Normalize inputs ----
        let key;
        let keys;
        let options;
        let unique;
        let sparse;
        let forced = false;
        if (typeof opts === "string") {
            key = opts;
            unique = undefined;
            sparse = undefined;
        }
        else {
            ({ key, keys, forced = false } = opts);
            const options = opts.options;
            // Conflict guard between `unique` and `options.unique`
            if (opts.unique != null && options?.unique != null && opts.unique !== options.unique) {
                throw new InvalidUsageError({
                    message: `Encountered different values for attribute 'unique': ${opts.unique} and 'options.unique': ${options.unique}.`,
                    reason: "invalid_unique_option",
                });
            }
            unique = opts.unique ?? options?.unique;
            // Conflict guard between `sparse` and `options.sparse`
            if (opts.sparse != null && options?.sparse != null && opts.sparse !== options.sparse) {
                throw new InvalidUsageError({
                    message: `Encountered different values for attribute 'sparse': ${opts.sparse} and 'options.sparse': ${options.sparse}.`,
                    reason: "invalid_sparse_option",
                });
            }
            sparse = opts.sparse ?? options?.sparse;
        }
        // Ensure `unique` in options when provided
        if (unique) {
            options = options || {};
            options.unique = unique;
        }
        // Ensure `sparse` in options when provided
        if (sparse) {
            options = options || {};
            options.sparse = sparse;
        }
        // Build keys object
        let keys_obj;
        if (key) {
            keys_obj = { [key]: 1 };
        }
        else if (Array.isArray(keys) && keys.length > 0) {
            keys_obj = {};
            for (const k of keys)
                keys_obj[k] = 1;
        }
        else if (keys != null && typeof keys === "object") {
            keys_obj = keys;
        }
        else {
            throw new InvalidUsageError({
                message: "Define one of the following parameters: [key, keys].",
                reason: "invalid_index_definition",
            });
        }
        const drop_index = async () => {
            try {
                const existing = await this._col.listIndexes().toArray();
                const match = existing.find(ix => {
                    const ix_key = ix?.key;
                    if (!ix_key)
                        return false;
                    const a = Object.entries(ix_key);
                    const b = Object.entries(keys_obj);
                    if (a.length !== b.length)
                        return false;
                    // exact key-value equality (order-insensitive)
                    const as = new Map(a);
                    for (const [kk, vv] of b) {
                        if (as.get(kk) !== vv)
                            return false;
                    }
                    return true;
                });
                // Prefer matched key's real name
                if (match?.name) {
                    try {
                        await this._col.dropIndex(match.name);
                    }
                    catch (err) {
                        if (err?.codeName !== "IndexNotFound")
                            throw err;
                    }
                }
                else if (options?.name) {
                    try {
                        await this._col.dropIndex(options.name);
                    }
                    catch (err) {
                        if (err?.codeName !== "IndexNotFound")
                            throw err;
                    }
                }
                else {
                    // last-resort synthesized name (simple cases)
                    const synthesized = Object.entries(keys_obj).map(([k, v]) => `${k}_${v}`).join("_");
                    try {
                        await this._col.dropIndex(synthesized);
                    }
                    catch (err) {
                        if (err?.codeName !== "IndexNotFound")
                            throw err;
                    }
                }
            }
            catch (err) {
                // If listIndexes itself fails for some reason, do not hide the error
                throw new Error(`Failed to create index on collection "${this.name}": ${err}`, { cause: err });
            }
        };
        try {
            // Create (or re-create)
            try {
                return await this._col.createIndex(keys_obj, options);
            }
            // Retry once on IndexKeySpecsConflict when forced=true
            catch (err) {
                if (forced && err && typeof err === "object" && (err.codeName === "IndexKeySpecsConflict")) {
                    await drop_index();
                    return await this._col.createIndex(keys_obj, options);
                }
                throw err;
            }
        }
        catch (err) {
            throw new Error(`Failed to create index on collection "${this.name}": ${err}`, { cause: err });
        }
    }
    /**
     * Standalone helper: merge `source` into `target` for missing keys only.
     * Clones assigned nested objects/arrays/dates once (when `clone` is true).
     *
     * @throws An error if the max depth recursion depth has been exceeded.
     *
     * @docs
     */
    static insert_defaults(target, source, opts = {}) {
        const max_depth = opts.max_depth ?? 1_000;
        const depth = opts.depth ?? 0;
        const should_clone = opts.clone ?? true;
        const isPlainObject = (v) => v != null && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype;
        const cloneAssigned = (val, d) => {
            if (!should_clone)
                return val;
            if (d > max_depth)
                return val;
            if (Array.isArray(val)) {
                return val.map(item => cloneAssigned(item, d + 1));
            }
            if (val instanceof Date) {
                return new Date(val.getTime());
            }
            if (isPlainObject(val)) {
                const out = {};
                for (const k of Object.keys(val)) {
                    out[k] = cloneAssigned(val[k], d + 1);
                }
                return out;
            }
            // Map/Set/custom instances: keep by reference
            return val;
        };
        if (depth > max_depth) {
            throw new Error(`Maximum recursion depth (${max_depth}) exceeded in 'insert_defaults'`);
        }
        for (const key of Object.keys(source)) {
            const v = target[key];
            const d = source[key];
            if (v === undefined) {
                target[key] = cloneAssigned(d, depth + 1);
            }
            else if (isPlainObject(v) && isPlainObject(d)) {
                Collection.insert_defaults(v, d, { depth: depth + 1, max_depth, clone: should_clone });
            }
            // Existing non-plain objects/arrays/primitives are left as-is.
        }
    }
    flatten(obj, prefix = "") {
        return flatten(obj, prefix);
    }
    /**
     * Execute `on_transform_version` and `on_load_cb` on a loaded document.
     * Ensures `__record_version` is set when {@link record_version} is defined.
     *
     * @note This is done automatically during load operations.
     *
     * @param data The loaded document.
     * @param opts Additional options.
     *
     * @returns The transformed document.
     *
     * @throws {Collection.OnTransformError} When an error occurs during the {@link Collection.Opts.on_transform_version} callback.
     * @throws {Collection.OnLoadError} When an error occurs during the {@link Collection.Opts.on_load} callback.
     *
     * @docs
     */
    async apply_on_load(data, opts) {
        let transformed = false;
        const is_partial = this._is_partial_projection(opts.projection);
        // Transform from older version to current (unchanged), but track if we did it.
        if (this.record_version != null &&
            this.on_transform_version != null &&
            data &&
            data.__record_version !== this.record_version) {
            try {
                data = await this.on_transform_version(data, {
                    from_version: data.__record_version,
                    to_version: this.record_version,
                    projection: opts.projection,
                    is_partial: is_partial,
                });
                transformed = true;
            }
            catch (error) {
                throw new Collection.OnTransformError({
                    message: `Failed to transform document from version '${data.__record_version}' to '${this.record_version}'.`,
                    query: {},
                    reason: "callback_error",
                    cause: error,
                });
            }
            data.__record_version = this.record_version;
        }
        // Keep existing on_load invocation
        if (this.on_load_cb) {
            try {
                data = await this.on_load_cb(data, {
                    projection: opts.projection,
                    is_partial: is_partial,
                });
            }
            catch (error) {
                throw new Collection.OnLoadError({
                    message: `Encountered an error during the 'on_load' callback.`,
                    query: {},
                    reason: "callback_error",
                    cause: error,
                });
            }
        }
        // Persist document once when safe.
        if (transformed &&
            this.persist_transformed_on_load &&
            opts.persist && // only persist if doc came from DB (not a default)
            !is_partial && // only when we have a full document
            data?._id != null // we can target by _id
        ) {
            try {
                // Use $replace to replace the entire document
                if (this.persist_transformed_on_load === "replace") {
                    const replace_doc = { ...data };
                    if (this.ttl_enabled && replace_doc.__ttl_timestamp == null) {
                        replace_doc.__ttl_timestamp = new Date();
                    }
                    if (this.record_version != null && replace_doc.__record_version == null) {
                        replace_doc.__record_version = this.record_version;
                    }
                    const res = this.replace({ _id: data._id }, replace_doc, { upsert: false, throw: false, apply_ttl: false } // do not create on read
                    );
                    if (opts.await_persist) {
                        await res;
                    }
                    else {
                        void res;
                    }
                }
                // Use $set to avoid converting replacement to operator by TTL injection,
                // and to avoid unsetting unknown fields.
                else {
                    const set_doc = { ...data };
                    delete set_doc._id;
                    delete set_doc.__ttl_timestamp; // keep TTL untouched
                    const res = this.save({ _id: data._id }, { $set: set_doc }, { upsert: false, throw: false, apply_ttl: false } // do not create on read
                    );
                    if (opts.await_persist) {
                        await res;
                    }
                    else {
                        void res;
                    }
                }
            }
            catch {
                // ignore any failure on read-path persistence
            }
        }
        return data;
    }
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
     *
     * @docs
     */
    async count(query, opts) {
        // Asserts.
        if (!this.initialized) {
            await this.init();
        }
        this.assert_init();
        this.assert_not_finalized();
        // Normalize/validate query; allow empty when omitted.
        const query_op = this._init_query(query ?? {}, true, "query");
        // Unpack opts.
        const throw_errors = opts?.throw ?? true;
        try {
            const n = await this._with_retry(() => this._col.countDocuments(query_op, this.get_operation_options(typeof opts?.timeout === "number" ? { maxTimeMS: opts.timeout } : {})), opts?.retry);
            return n;
        }
        catch (e) {
            const err = new Collection.CountError({
                message: "Count operation failed due to an unexpected error.",
                query: query_op,
                reason: this._should_retry_error(e)
                    ? (Collection.Retry.get_attempts(opts?.retry) > 1 ? "retries_exhausted" : "retryable")
                    : "unknown",
                cause: e,
            });
            if (throw_errors)
                throw err;
            return err;
        }
    }
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
     *
     * @docs
     */
    async count_estimated(opts) {
        // Asserts.
        if (!this.initialized) {
            await this.init();
        }
        this.assert_init();
        this.assert_not_finalized();
        // Unpack opts.
        const throw_errors = opts?.throw ?? true;
        try {
            const n = await this._with_retry(() => this._col.estimatedDocumentCount(this.get_operation_options(typeof opts?.timeout === "number" ? { maxTimeMS: opts.timeout } : {})), opts?.retry);
            return n;
        }
        catch (e) {
            const err = new Collection.CountError({
                message: "Estimated count operation failed due to an unexpected error.",
                query: {}, // no filter for estimatedDocumentCount
                reason: this._should_retry_error(e)
                    ? (Collection.Retry.get_attempts(opts?.retry) > 1 ? "retries_exhausted" : "retryable")
                    : "unknown",
                cause: e,
            });
            if (throw_errors)
                throw err;
            return err;
        }
    }
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
     *
     * @docs
     */
    async list(query, opts, allow_empty_query = false) {
        // Assert.
        if (!this.initialized) {
            await this.init();
        }
        this.assert_init();
        this.assert_not_finalized();
        // Unpack opts.
        const throw_errors = opts?.throw ?? true;
        const has_callback = typeof opts?.callback === "function";
        const page_info_requested = opts?.page_info === true && opts?.cursor !== true && !has_callback;
        // Invalid combinations.
        if (has_callback && opts?.cursor === true) {
            throw new InvalidUsageError({
                message: "Option 'callback' cannot be combined with 'cursor: true'.",
                reason: "invalid_option_combination",
                field: "opts.callback",
            });
        }
        if (has_callback && opts?.page_info === true) {
            throw new InvalidUsageError({
                message: "Option 'callback' cannot be combined with 'page_info: true'.",
                reason: "invalid_option_combination",
                field: "opts.callback",
            });
        }
        // Capture explicit user limit; if undefined, we will stream all documents
        // Add +1 for finite check since we may need to probe (page_info only).
        const user_limit = opts?.limit;
        if (typeof user_limit === "number") {
            const effective_user_limit = page_info_requested ? user_limit + 1 : user_limit;
            const is_integer = Number.isInteger(user_limit);
            const is_valid = user_limit >= 0 && Number.isFinite(effective_user_limit);
            if (!is_integer || !is_valid) {
                throw new InvalidUsageError({
                    message: `Option 'limit' must be a non-negative finite integer${page_info_requested ? " (including +1 for pagination)." : "."}`,
                    reason: "invalid_limit",
                    field: "opts.limit",
                });
            }
        }
        // Driver limit; +1 when probing for has_more.
        const probing_limit = (typeof user_limit === "number" && page_info_requested)
            ? user_limit + 1
            : user_limit;
        // Validate skip.
        if (opts?.skip != null) {
            if (!Number.isInteger(opts.skip) || opts.skip < 0) {
                throw new InvalidUsageError({
                    message: "Option 'skip' must be a non-negative integer.",
                    reason: "invalid_skip",
                    field: "opts.skip",
                });
            }
        }
        // Early return on zero limit (no round trip); respect page_info + callback shapes.
        if (user_limit === 0 && !opts?.cursor) {
            if (has_callback) {
                return undefined;
            }
            return (page_info_requested
                ? { items: [], has_more: false }
                : []);
        }
        // Batch size for server-to-client pulls; larger values reduce round trips
        let batch_size = typeof opts?.pagination?.batch_size === "number" ? Math.floor(opts.pagination.batch_size) : 1000;
        if (!Number.isFinite(batch_size) || batch_size < 1 || batch_size > 10000) {
            throw new InvalidUsageError({
                message: "Option `pagination.batch_size` must be an integer between '1' and '10000'.",
                reason: "invalid_pagination_batch_size",
                field: "opts.pagination.batch_size",
            });
        }
        // If a finite user limit is set and smaller than 10k, match the batch size to it
        // (this reduces round-trips and aligns with probing when page_info is requested).
        if (typeof probing_limit === "number" && probing_limit > 0 && probing_limit < 10000) {
            batch_size = Math.min(batch_size, probing_limit);
        }
        // validate/normalize the user query (and guard against empty queries unless explicitly allowed)
        const query_op = this._init_query(query, allow_empty_query, "query");
        // Build driver find options
        const find_options = {
            projection: opts?.projection
                ? Collection.Projection.init(this._ensure_version_in_projection(opts.projection))
                : undefined,
            sort: opts?.sort,
            skip: opts?.skip,
            // no default so we can stream all docs if no limit was set.
            // allow +1 probe for page_info
            limit: probing_limit,
        };
        // Only set maxTimeMS when a timeout is explicitly provided
        if (typeof opts?.timeout === "number") {
            find_options.maxTimeMS = opts.timeout;
        }
        try {
            // Create a find cursor.
            const cursor = await this._with_retry(() => this._col.find(query_op, this.get_operation_options(find_options)), opts?.retry);
            // Set batch size here, so its used for all subsequent fetches instead of only the first if it was defined in find_options.
            cursor.batchSize(batch_size);
            // Only set maxTimeMS when a timeout is explicitly provided
            if (typeof opts?.timeout === "number") {
                cursor.maxTimeMS(opts.timeout);
            }
            // Return cursor.
            if (opts?.cursor)
                return cursor;
            // Streaming callback path (memory-friendly).
            if (has_callback) {
                const max_docs = user_limit ?? Number.POSITIVE_INFINITY;
                let processed_count = 0;
                try {
                    while (processed_count < max_docs) {
                        const first = await this._with_retry(() => cursor.next(), opts?.retry);
                        if (first == null)
                            break;
                        let processed = first;
                        if (processed && typeof processed === "object") {
                            processed = await this.apply_on_load(processed, {
                                projection: opts?.projection,
                                persist: true,
                                await_persist: false,
                            });
                        }
                        try {
                            await opts.callback(processed);
                        }
                        catch (cb_err) {
                            // Surface callback failure with a dedicated reason
                            throw new Collection.ListError({
                                message: "List callback failed for a streamed document.",
                                query: query_op,
                                reason: "callback_error",
                                cause: cb_err,
                            });
                        }
                        processed_count++;
                        if (processed_count >= max_docs)
                            break;
                        // Drain current batch without network calls.
                        let drained = 1;
                        while (drained < batch_size && processed_count < max_docs) {
                            const next_in_buffer = await cursor.tryNext();
                            if (next_in_buffer == null)
                                break;
                            let processed2 = next_in_buffer;
                            if (processed2 && typeof processed2 === "object") {
                                processed2 = await this.apply_on_load(processed2, {
                                    projection: opts?.projection,
                                    persist: true,
                                    await_persist: false,
                                });
                            }
                            try {
                                await opts.callback(processed2);
                            }
                            catch (cb_err) {
                                throw new Collection.ListError({
                                    message: "List callback failed for a streamed document.",
                                    query: query_op,
                                    reason: "callback_error",
                                    cause: cb_err,
                                });
                            }
                            processed_count++;
                            drained++;
                        }
                    }
                }
                finally {
                    if (!cursor.closed) {
                        await cursor.close().catch(() => { });
                    }
                }
                return undefined;
            }
            // -------- Original array / page_info path (no callback) --------
            const max_docs = user_limit ?? Number.POSITIVE_INFINITY;
            const target = page_info_requested && typeof user_limit === "number" ? user_limit + 1 : max_docs;
            const docs = [];
            let fetched = 0;
            try {
                while (fetched < target) {
                    const first = await this._with_retry(() => cursor.next(), opts?.retry);
                    if (first == null) {
                        // cursor exhausted
                        break;
                    }
                    // Execute on_load / on_transform_version here.
                    let processed = first;
                    if (processed && typeof processed === "object") {
                        processed = await this.apply_on_load(processed, {
                            projection: opts?.projection,
                            persist: true,
                            await_persist: false,
                        });
                    }
                    docs.push(processed);
                    fetched++;
                    if (fetched >= target) {
                        break;
                    }
                    // Drain the rest of the currently buffered batch WITHOUT retry
                    let drained = 1;
                    while (drained < batch_size && fetched < target) {
                        const next_in_buffer = await cursor.tryNext();
                        if (next_in_buffer == null) {
                            break;
                        }
                        let processed2 = next_in_buffer;
                        if (processed2 && typeof processed2 === "object") {
                            processed2 = await this.apply_on_load(processed2, {
                                projection: opts?.projection,
                                persist: true,
                                await_persist: false,
                            });
                        }
                        docs.push(processed2);
                        fetched++;
                        drained++;
                    }
                }
            }
            finally {
                if (!cursor.closed) {
                    await cursor.close().catch(() => { });
                }
            }
            // Return page info.
            if (page_info_requested) {
                let has_more = false;
                let out = docs;
                if (typeof user_limit === "number" && docs.length > user_limit) {
                    has_more = true;
                    out = docs.slice(0, user_limit);
                }
                return { items: out, has_more };
            }
            // Return documents.
            if (docs.length > max_docs && max_docs !== Number.POSITIVE_INFINITY) {
                return docs.slice(0, max_docs);
            }
            return docs;
        }
        catch (e) {
            // If a callback already wrapped the error as a ListError, pass it through unchanged.
            if (e instanceof Collection.ListError) {
                if (throw_errors)
                    throw e;
                return e;
            }
            const error = new Collection.ListError({
                message: "Encountered an error while listing documents.",
                query: query_op,
                reason: this._should_retry_error(e)
                    ? (Collection.Retry.get_attempts(opts?.retry) > 1 ? "retries_exhausted" : "retryable")
                    : "unknown",
                cause: e,
            });
            if (throw_errors)
                throw error;
            return error;
        }
    }
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
     *
     * @docs
     */
    async list_all(opts) {
        return this.list({}, opts, true);
    }
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
     *
     * @docs
     */
    async exists(query, opts) {
        // Asserts.
        if (!this.initialized) {
            await this.init();
        }
        this.assert_init();
        this.assert_not_finalized();
        // Init query.
        const query_op = this._init_query(query, false, "query");
        // Unpack opts.
        const throw_errors = opts?.throw ?? true; // Warning: NEVER change this default
        // Apply operation.
        try {
            const find_opts = {
                projection: { _id: 1 },
            };
            if (typeof opts?.timeout === "number") {
                find_opts.maxTimeMS = opts.timeout;
            }
            const doc = await this._with_retry(() => this._col.findOne(query_op, this.get_operation_options(find_opts)), opts?.retry);
            return doc != null;
            // Catch error.
        }
        catch (e) {
            // Encountered a non retryable error or no retries (left).
            const err = new Collection.ExistsError({
                message: 'Failed to check if the queried document exists due to an unexpected error.',
                query: query_op,
                reason: this._should_retry_error(e)
                    ? (Collection.Retry.get_attempts(opts?.retry) > 1 ? 'retries_exhausted' : 'retryable')
                    : 'unknown',
                cause: e,
            });
            if (throw_errors)
                throw err;
            return err;
        }
    }
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
     *
     * @docs
     */
    async load(query, opts) {
        // Checks.
        if (!this.initialized) {
            await this.init();
        }
        this.assert_init();
        this.assert_not_finalized();
        // Unpack opts.
        const retry = opts?.retry;
        const throw_errors = opts?.throw ?? true; // Warning: NEVER change this default
        // Init query.
        const find_query = this._init_query(query, false, "query");
        // Create options.
        const base_find = {};
        if (opts?.projection)
            base_find.projection = Collection.Projection.init(this._ensure_version_in_projection(opts.projection));
        if (typeof opts?.timeout === "number")
            base_find.maxTimeMS = opts.timeout;
        const find_opts = this.get_operation_options(base_find);
        // Load doc.
        try {
            const doc = await this._with_retry(() => this._col.findOne(find_query, find_opts), opts?.retry);
            // Handle default.
            if (!doc) {
                if (opts?.default) {
                    let default_doc;
                    if (typeof opts.default === "function") {
                        default_doc = vlib.Object.deep_copy(opts.default());
                    }
                    else {
                        default_doc = vlib.Object.deep_copy(opts.default);
                    }
                    if (default_doc._id == null) {
                        default_doc._id = new mongodb.ObjectId();
                    }
                    if (this.record_version != null) {
                        default_doc.__record_version = this.record_version;
                    }
                    // Execute on_load for defaults as well.
                    let out = default_doc;
                    const is_partial = this._is_partial_projection(opts?.projection);
                    out = await this.apply_on_load(out, {
                        projection: opts?.projection,
                        persist: false, // do not persist defaults.
                        await_persist: true,
                    });
                    return out;
                }
                const err = new Collection.NotFoundError({
                    message: 'Document not found.',
                    query: find_query,
                    reason: "not_found",
                });
                if (throw_errors)
                    throw err;
                return err;
            }
            // Insert default keys.
            let working = doc;
            if (opts?.default) {
                if (typeof opts.default === "function") {
                    Collection.insert_defaults(working, opts.default(), { clone: true });
                }
                else {
                    Collection.insert_defaults(working, opts.default, { clone: true });
                }
            }
            // Execute on_transform_version/on_load callbacks.
            working = await this.apply_on_load(working, {
                projection: opts?.projection,
                persist: true,
                await_persist: true,
            });
            return working;
        }
        catch (e) {
            if (e instanceof Collection.NotFoundError) {
                if (throw_errors)
                    throw e;
                return e;
            }
            // Encountered a non retryable error or no retries (left).
            const err = new Collection.LoadError({
                message: 'Load failed due to an unexpected error.',
                query: find_query,
                reason: this._should_retry_error(e)
                    ? (Collection.Retry.get_attempts(retry) > 1 ? 'retries_exhausted' : 'retryable')
                    : 'unknown',
                cause: e,
            });
            if (throw_errors)
                throw err;
            return err;
        }
    }
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
     *
     * @docs
     */
    async set(query, content, opts) {
        // Flatten.
        if (opts?.flatten)
            content = this.flatten(content);
        // Create op.
        const operation = { $set: content };
        // Save.
        return await this.save(query, operation, opts);
    }
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
     *
     * @docs
     */
    async save(query, operation, // @todo add strict pipeline type.
    opts) {
        // Checks.
        if (!this.initialized) {
            await this.init();
        }
        this.assert_init();
        this.assert_not_finalized();
        // Validate update shape BEFORE we mutate it with TTL/version logic.
        // Plain replacement docs are not supported with updateOne/findOneAndUpdate.
        if (!this._is_operator_update_or_pipeline(operation)) {
            throw new InvalidUsageError({
                message: "Plain replacement documents are not allowed for 'save()' (uses updateOne/findOneAndUpdate). " +
                    "Pass an operator update or aggregation pipeline. " +
                    "To replace a document, call 'replace()'.",
                reason: "invalid_update_document",
                field: "operation",
            });
        }
        // Init query.
        const query_op = this._init_query(query, false, "query");
        // Unpack opts.
        const throw_errors = opts?.throw ?? true; // NEVER change this default.
        const retry = opts?.retry;
        const upsert = opts?.upsert ?? true; // NEVER change this default.
        // Apply TTL.
        if (this.ttl_enabled && opts?.apply_ttl !== false)
            this._apply_ttl_to_operation(operation, upsert);
        // Apply record versioning.
        if (this.record_version != null)
            this._apply_record_version_to_operation(operation, upsert);
        // Bulk operation.
        if (opts?.bulk) {
            const b_op = {
                updateOne: {
                    filter: query_op,
                    update: operation,
                    upsert: upsert,
                },
            };
            return b_op;
        }
        // Return document.
        if (opts?.return) {
            let res;
            try {
                res = await this._with_retry(() => this._col.findOneAndUpdate(query_op, operation, this.get_operation_options({
                    upsert,
                    returnDocument: mongodb.ReturnDocument.AFTER,
                    includeResultMetadata: false,
                    ...(typeof opts?.timeout === "number" ? { maxTimeMS: opts.timeout } : {}),
                })), retry);
            }
            catch (e) {
                // Encountered a non retryable error or no retries (left).
                const err = new Collection.SaveError({
                    message: 'Update failed due to an unexpected error.',
                    query: query_op,
                    reason: this._should_retry_error(e)
                        ? (Collection.Retry.get_attempts(retry) > 1 ? 'retries_exhausted' : 'retryable')
                        : 'unknown',
                    cause: e,
                });
                if (throw_errors)
                    throw err;
                return err;
            }
            if (!res) {
                const err = new Collection.SaveError({
                    message: 'Document write was not acknowledged.',
                    query: query_op,
                    reason: 'not_acknowledged',
                });
                if (throw_errors)
                    throw err;
                return err;
            }
            // Apply on_load / on_transform_version on returned document.
            try {
                const processed = await this.apply_on_load(res, {
                    projection: undefined,
                    persist: true,
                    await_persist: true,
                });
                return processed;
            }
            catch (e) {
                const err = new Collection.SaveError({
                    message: 'Update succeeded but post-load processing failed.',
                    query: query_op,
                    reason: 'post_process_failed',
                    cause: e,
                });
                if (throw_errors)
                    throw err;
                return err;
            }
        }
        // Dont return document.
        else {
            let res;
            try {
                res = await this._with_retry(() => this._col.updateOne(query_op, operation, this.get_operation_options({
                    upsert,
                    ...(typeof opts?.timeout === "number" ? { maxTimeMS: opts.timeout } : {}),
                })), retry);
            }
            catch (e) {
                // Encountered a non retryable error or no retries (left).
                const err = new Collection.SaveError({
                    message: 'Update failed due to an unexpected error.',
                    query: query_op,
                    reason: this._should_retry_error(e)
                        ? (Collection.Retry.get_attempts(retry) > 1 ? 'retries_exhausted' : 'retryable')
                        : 'unknown',
                    cause: e,
                });
                if (throw_errors)
                    throw err;
                return err;
            }
            if (!res.acknowledged || (res.matchedCount === 0 && res.upsertedCount === 0)) {
                const err = new Collection.SaveError({
                    message: !res.acknowledged
                        ? 'Document write was not acknowledged.'
                        : 'No document matched the filter and no upsert occurred.',
                    query: query_op,
                    reason: !res.acknowledged ?
                        'not_acknowledged' :
                        'no_match'
                });
                if (throw_errors)
                    throw err;
                return err;
            }
            return res;
        }
    }
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
     *
     * @docs
     */
    async save_many(query, operation, opts) {
        // Asserts / init.
        if (!this.initialized) {
            await this.init();
        }
        this.assert_init();
        this.assert_not_finalized();
        // Validate update shape BEFORE we mutate it with TTL/version logic.
        // Plain replacement docs are not supported with updateMany
        if (!this._is_operator_update_or_pipeline(operation)) {
            throw new InvalidUsageError({
                message: "Plain replacement documents are not allowed for 'save_many()' (uses updateMany). " +
                    "Pass an operator update or aggregation pipeline. " +
                    "To replace documents, call 'replace_many()'.",
                reason: "invalid_update_document",
                field: "operation",
            });
        }
        const query_op = this._init_query(query, false, "query");
        const throw_errors = opts?.throw ?? true; // default true
        const retry = opts?.retry;
        const upsert = opts?.upsert ?? false; // default false for save_many
        // Apply TTL
        if (this.ttl_enabled && opts?.apply_ttl !== false) {
            this._apply_ttl_to_operation(operation, upsert);
        }
        // Apply record versioning.
        if (this.record_version != null) {
            this._apply_record_version_to_operation(operation, upsert);
        }
        // Bulk path.
        if (opts?.bulk) {
            const b_op = {
                updateMany: {
                    filter: query_op,
                    update: operation,
                    upsert,
                },
            };
            return b_op;
        }
        // Perform write operation.
        let write;
        try {
            write = await this._with_retry(() => this._col.updateMany(query_op, operation, this.get_operation_options({
                upsert,
                ...(typeof opts?.timeout === "number" ? { maxTimeMS: opts.timeout } : {}),
            })), retry);
        }
        catch (e) {
            const err = new Collection.SaveError({
                message: "Update-many failed due to an unexpected error.",
                query: query_op,
                reason: this._should_retry_error(e)
                    ? (Collection.Retry.get_attempts(retry) > 1 ? 'retries_exhausted' : 'retryable')
                    : 'unknown',
                cause: e,
            });
            if (throw_errors)
                throw err;
            return err;
        }
        // Acknowledgement / match check (mirror `save` semantics)
        if (!write.acknowledged || (write.matchedCount === 0 && write.upsertedCount === 0)) {
            const err = new Collection.SaveError({
                message: !write.acknowledged
                    ? "Document write was not acknowledged."
                    : "No document matched the filter and no upsert occurred.",
                query: query_op,
                reason: !write.acknowledged ? "not_acknowledged" : "no_match",
            });
            if (throw_errors)
                throw err;
            return err;
        }
        // No follow-up read requested
        if (!opts?.return) {
            return write;
        }
        // --- Follow-up read phase (list): keep ListError semantics intact ---
        const follow = typeof opts.return === "object" ? opts.return : {};
        // Let ListError bubble (throw:true) or be returned (throw:false) unchanged.
        const out = await this.list(query, {
            ...follow,
            // copy control fields from the write options
            throw: opts.throw,
            retry: opts.retry,
            timeout: opts.timeout,
            // Note: we intentionally do NOT set cursor/page_info (they're excluded in SaveManyReturnOpts).
        });
        return out;
    }
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
    _build_replace_pipeline(base_replacement, upsert, apply_ttl) {
        const now = new Date();
        // Merge order matters (later overrides earlier):
        // 1) user replacement
        // 2) existing _id on matches
        // 3) carry stored values we may need to preserve
        const merge_objects = [
            base_replacement,
            {
                $cond: [
                    { $ne: ["$_id", null] },
                    { _id: "$_id" },
                    {}
                ]
            },
        ];
        if (this.record_version != null) {
            // capture stored version (only present on matches)
            merge_objects.push({ __old_rv: "$__record_version" });
        }
        if (apply_ttl) {
            // capture stored TTL for static TTL preservation on matches
            merge_objects.push({ __old_ttl: "$__ttl_timestamp" });
        }
        else {
            // explicit preservation when TTL logic is disabled
            merge_objects.push({ __ttl_timestamp: "$__ttl_timestamp" });
        }
        const pipeline = [
            { $replaceWith: { $mergeObjects: merge_objects } },
        ];
        // ----- Record versioning -----
        if (this.record_version != null) {
            pipeline.push({
                $set: {
                    /**
                     * Matches:
                     *   Prefer stored version (`__old_rv`), otherwise keep any user-provided value.
                     * Upserts:
                     *   Respect user-provided value if present; otherwise default to `this.record_version`.
                     */
                    __record_version: {
                        $cond: [
                            { $ne: ["$__old_rv", null] },
                            "$__old_rv",
                            upsert
                                ? { $ifNull: ["$__record_version", this.record_version] }
                                : "$__record_version"
                        ]
                    }
                }
            });
        }
        // ----- TTL stamping/preservation -----
        if (apply_ttl) {
            pipeline.push({
                $set: this.sliding_ttl
                    // Always refresh on any write
                    ? { __ttl_timestamp: now }
                    // Static TTL: preserve on matches; on upsert, respect user value if any, else stamp now
                    : {
                        __ttl_timestamp: {
                            $cond: [
                                { $ne: ["$__old_ttl", null] },
                                "$__old_ttl",
                                { $ifNull: ["$__ttl_timestamp", now] }
                            ]
                        }
                    }
            });
        }
        // Cleanup temp carriers
        pipeline.push({ $unset: ["__old_rv", "__old_ttl"] });
        return pipeline;
    }
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
     *
     * @docs
     */
    async replace(query, replacement, opts) {
        // Asserts / init.
        if (!this.initialized) {
            await this.init();
        }
        this.assert_init();
        this.assert_not_finalized();
        // Validate "replacement-only".
        if (this._is_operator_update_or_pipeline(replacement)) {
            throw new InvalidUsageError({
                message: "The 'replace()' method accepts a replacement document only (no update operators or pipelines).",
                reason: "invalid_replacement_document",
                field: "replacement",
            });
        }
        const query_op = this._init_query(query, false, "query");
        // Unpack opts.
        const throw_errors = opts?.throw ?? true; // NEVER change this.
        const retry = opts?.retry;
        const upsert = opts?.upsert ?? true; // default true (mirrors save)
        const apply_ttl = this.ttl_enabled && opts?.apply_ttl !== false;
        // Prepare replacement for the pipeline.
        const base_replacement = { ...replacement };
        // For matched docs we always preserve existing _id via the pipeline; for upsert:false we can
        // proactively drop user _id to avoid accidental immutable-field issues in case of driver quirks.
        if (upsert === false) {
            delete base_replacement._id;
        }
        // Build pipeline that emulates a full replacement.
        const pipeline = this._build_replace_pipeline(base_replacement, upsert, apply_ttl);
        // Bulk path.
        if (opts?.bulk) {
            const b_op = {
                updateOne: {
                    filter: query_op,
                    update: pipeline,
                    upsert,
                }
            };
            return b_op;
        }
        // Return the replaced document (post-state) via findOneAndUpdate with pipeline.
        if (opts?.return) {
            let res;
            try {
                res = await this._with_retry(() => this._col.findOneAndUpdate(query_op, pipeline, this.get_operation_options({
                    upsert,
                    returnDocument: mongodb.ReturnDocument.AFTER,
                    includeResultMetadata: false,
                    ...(typeof opts?.timeout === "number" ? { maxTimeMS: opts.timeout } : {}),
                })), retry);
            }
            catch (e) {
                const err = new Collection.SaveError({
                    message: "Replace failed due to an unexpected error.",
                    query: query_op,
                    reason: this._should_retry_error(e)
                        ? (Collection.Retry.get_attempts(retry) > 1 ? "retries_exhausted" : "retryable")
                        : "unknown",
                    cause: e,
                });
                if (throw_errors)
                    throw err;
                return err;
            }
            if (!res) {
                const err = new Collection.SaveError({
                    message: "Document write was not acknowledged.",
                    query: query_op,
                    reason: "not_acknowledged",
                });
                if (throw_errors)
                    throw err;
                return err;
            }
            // Apply post-load processing.
            try {
                const processed = await this.apply_on_load(res, {
                    projection: undefined,
                    persist: true,
                    await_persist: true,
                });
                return processed;
            }
            catch (e) {
                const err = new Collection.SaveError({
                    message: "Replace succeeded but post-load processing failed.",
                    query: query_op,
                    reason: "post_process_failed",
                    cause: e,
                });
                if (throw_errors)
                    throw err;
                return err;
            }
        }
        // Replace without returning the document (updateOne with pipeline).
        let write;
        try {
            write = await this._with_retry(() => this._col.updateOne(query_op, pipeline, this.get_operation_options({
                upsert,
                ...(typeof opts?.timeout === "number" ? { maxTimeMS: opts.timeout } : {}),
            })), retry);
        }
        catch (e) {
            const err = new Collection.SaveError({
                message: "Replace failed due to an unexpected error.",
                query: query_op,
                reason: this._should_retry_error(e)
                    ? (Collection.Retry.get_attempts(retry) > 1 ? "retries_exhausted" : "retryable")
                    : "unknown",
                cause: e,
            });
            if (throw_errors)
                throw err;
            return err;
        }
        if (!write.acknowledged || (write.matchedCount === 0 && write.upsertedCount === 0)) {
            const err = new Collection.SaveError({
                message: !write.acknowledged
                    ? "Document write was not acknowledged."
                    : "No document matched the filter and no upsert occurred.",
                query: query_op,
                reason: !write.acknowledged ? "not_acknowledged" : "no_match",
            });
            if (throw_errors)
                throw err;
            return err;
        }
        return write;
    }
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
     *
     * @docs
     */
    async replace_many(query, replacement, opts) {
        // Asserts / init.
        if (!this.initialized) {
            await this.init();
        }
        this.assert_init();
        this.assert_not_finalized();
        // Validate "replacement-only".
        if (this._is_operator_update_or_pipeline(replacement)) {
            throw new InvalidUsageError({
                message: "The 'replace_many()' method accepts a replacement document only (no update operators or pipelines).",
                reason: "invalid_replacement_document",
                field: "replacement",
            });
        }
        const query_op = this._init_query(query, false, "query");
        const throw_errors = opts?.throw ?? true; // NEVER change this.
        const retry = opts?.retry;
        const upsert = opts?.upsert ?? false; // default false (mirrors save_many)
        const apply_ttl = this.ttl_enabled && opts?.apply_ttl !== false;
        // Sanitize: never accept user-supplied _id in replace_many
        const base_replacement = { ...replacement };
        delete base_replacement._id;
        // Build pipeline once and reuse.
        const pipeline = this._build_replace_pipeline(base_replacement, upsert, apply_ttl);
        // Bulk path
        if (opts?.bulk) {
            const b_op = {
                updateMany: {
                    filter: query_op,
                    update: pipeline,
                    upsert,
                },
            };
            return b_op;
        }
        // Perform write
        let write;
        try {
            write = await this._with_retry(() => this._col.updateMany(query_op, pipeline, this.get_operation_options({
                upsert,
                ...(typeof opts?.timeout === "number" ? { maxTimeMS: opts.timeout } : {}),
            })), retry);
        }
        catch (e) {
            const err = new Collection.SaveError({
                message: "Replace-many failed due to an unexpected error.",
                query: query_op,
                reason: this._should_retry_error(e)
                    ? (Collection.Retry.get_attempts(retry) > 1 ? 'retries_exhausted' : 'retryable')
                    : 'unknown',
                cause: e,
            });
            if (throw_errors)
                throw err;
            return err;
        }
        // Acknowledgement / match check
        if (!write.acknowledged || (write.matchedCount === 0 && write.upsertedCount === 0)) {
            const err = new Collection.SaveError({
                message: !write.acknowledged
                    ? "Document write was not acknowledged."
                    : "No document matched the filter and no upsert occurred.",
                query: query_op,
                reason: !write.acknowledged ? "not_acknowledged" : "no_match",
            });
            if (throw_errors)
                throw err;
            return err;
        }
        // No follow-up read requested
        if (!opts?.return) {
            return write;
        }
        // Follow-up read (same as save_many)
        const follow = typeof opts.return === "object" ? opts.return : {};
        const out = await this.list(query, {
            ...follow,
            throw: opts.throw,
            retry: opts.retry,
            timeout: opts.timeout,
        });
        return out;
    }
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
     *
     * @docs
     */
    async delete(query, opts) {
        // Asserts.
        if (!this.initialized) {
            await this.init();
        }
        this.assert_init();
        this.assert_not_finalized();
        // Init opts.
        const throw_errors = opts?.throw ?? true; // NEVER change this default.
        // Init query.
        const query_op = this._init_query(query, false, "query");
        // Bulk operation.
        if (opts != null && opts.bulk) {
            const b_op = {
                deleteOne: {
                    filter: query_op,
                }
            };
            return b_op;
            // Execute operation.
        }
        else {
            let res;
            try {
                res = await this._with_retry(() => this._col.deleteOne(query_op, this.get_operation_options(typeof opts?.timeout === "number" ? { maxTimeMS: opts.timeout } : {})), opts?.retry);
            }
            catch (e) {
                const err = new Collection.DeleteError({
                    message: `Failed to delete document(s) in collection "${this.name}".`,
                    query: query_op,
                    reason: this._should_retry_error(e)
                        ? (Collection.Retry.get_attempts(opts?.retry) > 1 ? 'retries_exhausted' : 'retryable')
                        : 'unknown',
                    cause: e,
                });
                if (throw_errors)
                    throw err;
                return err;
            }
            if (!res.acknowledged) {
                const err = new Collection.DeleteError({
                    message: `Failed to delete document(s) in collection "${this.name}".`,
                    query: query_op,
                    reason: "not_acknowledged",
                });
                if (throw_errors)
                    throw err;
                return err;
            }
            return res;
        }
    }
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
     *
     * @docs
     */
    async delete_many(query, opts, allow_empty_query = false) {
        // Asserts.
        if (!this.initialized) {
            await this.init();
        }
        this.assert_init();
        this.assert_not_finalized();
        // Init opts.
        const throw_errors = opts?.throw ?? true; // NEVER change this default.
        // Init query.
        const query_op = this._init_query(query, allow_empty_query, "query");
        // Bulk operation.
        if (opts != null && opts.bulk) {
            const b_op = {
                deleteMany: {
                    filter: query_op,
                }
            };
            return b_op;
            // Execute operation.
        }
        else {
            let res;
            try {
                res = await this._with_retry(() => this._col.deleteMany(query_op, this.get_operation_options(typeof opts?.timeout === "number" ? { maxTimeMS: opts.timeout } : {})), opts?.retry);
            }
            catch (e) {
                const err = new Collection.DeleteError({
                    message: `Failed to delete document(s) in collection "${this.name}".`,
                    query: query_op,
                    reason: this._should_retry_error(e)
                        ? (Collection.Retry.get_attempts(opts?.retry) > 1 ? 'retries_exhausted' : 'retryable')
                        : 'unknown',
                    cause: e,
                });
                if (throw_errors)
                    throw err;
                return err;
            }
            if (!res.acknowledged) {
                const err = new Collection.DeleteError({
                    message: `Failed to delete document(s) in collection "${this.name}".`,
                    query: query_op,
                    reason: "not_acknowledged",
                });
                if (throw_errors)
                    throw err;
                return err;
            }
            return res;
        }
    }
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
     *
     * @docs
     */
    async delete_all(opts) {
        return this.delete_many({}, opts, true);
    }
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
     *
     * @docs
     */
    async delete_collection(opts) {
        // Asserts.
        if (!this.initialized) {
            await this.init();
        }
        this.assert_init();
        this.assert_not_finalized();
        this.assert_not_transaction_based();
        // Init opts.
        const throw_errors = opts?.throw ?? true; // NEVER change this default.
        // Drop collection.
        let res;
        try {
            res = await this._with_retry(() => this._col.drop(this.get_operation_options(typeof opts?.timeout === "number" ? { maxTimeMS: opts.timeout } : {})), opts?.retry);
        }
        catch (e) {
            // Make it idempotent: "namespace not found" means already dropped.
            if (e && typeof e === "object" && (e?.code === 26 || e?.codeName === "NamespaceNotFound")) {
                return undefined;
            }
            const err = new Collection.DeleteError({
                message: `Failed to drop collection "${this.name}".`,
                query: {},
                reason: this._should_retry_error(e)
                    ? (Collection.Retry.get_attempts(opts?.retry) > 1 ? 'retries_exhausted' : 'retryable')
                    : 'unknown',
                cause: e,
            });
            if (throw_errors)
                throw err;
            return err;
        }
        // Handle response.
        if (!res) {
            const err = new Collection.DeleteError({
                message: `Failed to drop collection "${this.name}", detected by a falsy return.`,
                query: {},
                reason: "not_acknowledged",
            });
            if (throw_errors)
                throw err;
            return err;
        }
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
     *
     * @docs
     */
    async bulk_operations(operations, opts) {
        // Assert.
        if (!this.initialized) {
            await this.init();
        }
        this.assert_init();
        this.assert_not_finalized();
        if (!Array.isArray(operations)) {
            throw new TypeError('Operations must be an array');
        }
        if (operations.length > 100000) {
            throw new InvalidUsageError({
                message: 'Bulk operations exceed MongoDB limit of 100000',
                reason: "invalid_operations_length",
            });
        }
        // Unpack opts.
        const throw_errors = opts?.throw ?? true; // NEVER change this default.
        // Apply record version + TTL per operation.
        if (this.ttl_enabled || this.record_version != null) {
            const now = new Date();
            for (const op of operations) {
                // --- Record version injection (when applicable) ---
                if (this.record_version != null) {
                    const rv = this.record_version;
                    // insertOne → always an insert; stamp unless user set a different value
                    if (op.insertOne?.document && typeof op.insertOne.document === "object") {
                        const d = op.insertOne.document;
                        if (d.__record_version == null) {
                            d.__record_version = rv;
                        }
                    }
                    // replaceOne → only stamp when upsert === true (insert path)
                    else if (op.replaceOne?.replacement && typeof op.replaceOne.replacement === "object") {
                        if (op.replaceOne.upsert) {
                            const d = op.replaceOne.replacement;
                            if (d.__record_version == null) {
                                d.__record_version = rv;
                            }
                        }
                    }
                    // updateOne/Many → only set $setOnInsert when upsert true and user did not set any value
                    else if (op.updateOne?.update) {
                        if (op.updateOne.upsert)
                            this._apply_record_version_to_operation(op.updateOne.update, true);
                    }
                    else if (op.updateMany?.update) {
                        if (op.updateMany.upsert)
                            this._apply_record_version_to_operation(op.updateMany.update, true);
                    }
                    // deleteOne/deleteMany → no-op
                }
                // --- TTL injection (when enabled) ---
                if (!this.ttl_enabled)
                    continue;
                // insertOne
                if (op.insertOne?.document && typeof op.insertOne.document === "object") {
                    if (this.sliding_ttl || op.insertOne.document.__ttl_timestamp == null) {
                        op.insertOne.document.__ttl_timestamp = now;
                    }
                    continue;
                }
                // replaceOne
                if (op.replaceOne?.replacement && typeof op.replaceOne.replacement === "object") {
                    if (this.sliding_ttl) {
                        op.replaceOne.replacement.__ttl_timestamp = now;
                    }
                    else if (op.replaceOne.upsert && op.replaceOne.replacement.__ttl_timestamp == null) {
                        op.replaceOne.replacement.__ttl_timestamp = now;
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
        try {
            return await this._with_retry(() => this._col.bulkWrite(operations, this.get_operation_options({
                ordered: true,
                ...(typeof opts?.timeout === "number" ? { maxTimeMS: opts.timeout } : {}),
            })), opts?.retry);
        }
        catch (e) {
            // Encountered a non retryable error or no retries (left).
            const err = new Collection.BulkError({
                message: 'Bulk operations failed due to an unexpected error.',
                query: {},
                reason: this._should_retry_error(e)
                    ? (Collection.Retry.get_attempts(opts?.retry) > 1 ? 'retries_exhausted' : 'retryable')
                    : 'unknown',
                cause: e,
            });
            if (throw_errors)
                throw err;
            return err;
        }
    }
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
     *
     * @docs
     */
    async aggregate(pipeline, // @todo add strict pipeline type.
    opts) {
        // Asserts.
        if (!this.initialized) {
            await this.init();
        }
        this.assert_init();
        this.assert_not_finalized();
        // Unpack opts.
        const throw_errors = opts?.throw ?? true; // NEVER change this default.
        // Aggregate.
        try {
            const cursor = await this._with_retry(() => this._col.aggregate(pipeline, this.get_operation_options(typeof opts?.timeout === "number" ? { maxTimeMS: opts.timeout } : {})), opts?.retry);
            if (typeof opts?.timeout === "number" && typeof cursor.maxTimeMS === "function") {
                cursor.maxTimeMS(opts.timeout);
            }
            if (opts?.cursor)
                return cursor;
            const arr = await this._with_retry(() => cursor.toArray(), opts?.retry);
            return arr;
            // We do not apply the on-load callback here.
            // Since the aggregation pipeline might have projected
            // the document and we can not guarantee its shape,
            // we avoid applying the on-load callback.
            // Post-process loaded docs when possible.
            // const processed = Array.isArray(arr)
            //     ? arr.map(d => (d && typeof d === "object")
            //         ? this._apply_on_load<undefined>(d, true) FIX // not sure if we should apply on load here.
            //         : d
            //     )
            //     : arr;
            // return processed as Res;
        }
        catch (e) {
            // Encountered a non retryable error or no retries (left).
            const err = new Collection.AggregateError({
                message: 'Aggregate operation failed due to an unexpected error.',
                query: {},
                reason: this._should_retry_error(e)
                    ? (Collection.Retry.get_attempts(opts?.retry) > 1 ? 'retries_exhausted' : 'retryable')
                    : 'unknown',
                cause: e,
            });
            if (throw_errors)
                throw err;
            return err;
        }
    }
    /**
     * Clean a document from all default system attributes.
     * @param doc The document to clean.
     * @returns The cleaned document without system attributes.
     *
     * @docs
     */
    clean(doc) {
        if (doc == null) {
            return doc;
        }
        if (typeof doc === "object") {
            const out = { ...doc };
            delete out._id;
            delete out._path;
            if (out.__ttl_timestamp != null) {
                delete out.__ttl_timestamp;
            }
            if (out.__record_version != null) {
                delete out.__record_version;
            }
            return out;
        }
        return doc;
    }
    // ---------------------------------------------------------
    // Sessions & transactions.
    // ---------------------------------------------------------
    /**
     * Start a new transaction by creating a TransactionCollection instance.
     * @returns A new TransactionCollection instance with transaction capabilities.
     *
     * @docs
     */
    async start_transaction() {
        if (!this.db.client) {
            throw new InvalidUsageError({
                message: "Database client is not initialized, ensure the parent 'volt.Server' is initialized.",
                reason: "client_not_connected",
            });
        }
        if (!this.initialized) {
            await this.init();
        }
        this.assert_init();
        return new TransactionCollection({
            derived_collection: this,
            transaction_based: true,
        });
    }
    // ------------------- DEPRECATED -------------------------
    /** Prepare a _path based regex operation. @deprecated */
    prepare_path_regex_filter(path) {
        // Validate path to prevent ReDoS
        while (path.length > 0 && path.charAt(path.length - 1) === "/") {
            path = path.substring(0, path.length - 1);
        }
        if (path.length == 0) {
            throw new InvalidUsageError({
                message: `Invalid path '${path}'`,
                reason: "invalid_path",
            });
        }
        if (path.length > 1000) {
            throw new InvalidUsageError({
                message: `Path too long (${path.length})`,
                reason: "invalid_path",
            });
        }
        const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const filter = {
            _path: {
                $regex: `^${escapeRegExp(path)}/`,
                // $options: 'i'  // Case insensitive for consistency
            }
        };
        return filter;
    }
}
/** Nested types for the {@link Collection} class. */
(function (Collection) {
    // -------------------------------------------------------------------
    // Retry options.
    // -------------------------------------------------------------------
    /** Mini module for managing retry attempts. */
    let Retry;
    (function (Retry) {
        /**
         * Get the number of attempts from a a retry type
         * @returns 1 when undefined, or the specified number of attempts,
         *          with a minimum of 1 and maximum of 100.
         */
        function get_attempts(retry) {
            return Math.max(1, Math.min(100, typeof retry === "number" ? retry : !retry ? 1 : retry.attempts));
        }
        Retry.get_attempts = get_attempts;
        /**
         * Normalize retry options into a bounded, concrete shape.
         *
         * @param retry A retry attempts number or {@link Collection.Retry.Opts}.
         * @returns A normalized retry configuration.
         */
        function normalize(retry) {
            const base = typeof retry === "number"
                ? { attempts: retry }
                : typeof retry === "object"
                    ? retry ?? { attempts: 1 }
                    : { attempts: 1 };
            let attempts = Number(base.attempts);
            if (!Number.isFinite(attempts))
                attempts = 1;
            // Clamp attempts to [1, 100] (1 = try once, no retries).
            attempts = Math.max(1, Math.min(100, attempts));
            const initial_delay = base.initial_delay ?? 100;
            const max_delay = base.max_delay ?? 1000;
            const backoff_factor = base.backoff_factor ?? 2;
            // Small bounded jitter to avoid thundering herd; internal only.
            const jitter_ratio = 0.2;
            return {
                attempts,
                initial_delay,
                max_delay,
                backoff_factor,
                jitter_ratio,
            };
        }
        Retry.normalize = normalize;
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
        function compute_backoff_delay(attempt_index, params) {
            const base = Math.min(params.max_delay, (params.initial_delay <= 0 ? 0 : params.initial_delay) * Math.pow(Math.max(1, params.backoff_factor), attempt_index));
            if (base <= 0)
                return 0;
            // Jitter in [ -j*base, +j*base ]
            const jitter = (Math.random() * 2 - 1) * (params.jitter_ratio * base);
            const delay = Math.max(0, Math.min(params.max_delay, base + jitter));
            return Math.floor(delay);
        }
        Retry.compute_backoff_delay = compute_backoff_delay;
    })(Retry = Collection.Retry || (Collection.Retry = {}));
    // -------------------------------------------------------------------
    // Errors.
    // ---------------------------------------------------------
    /**
     * The base error for {@link NotFoundError}, {@link DeleteError} etc.
     */
    class OperationError extends Error {
        /** The error message. */
        message;
        query;
        reason;
        /** An optional error that caused this error. */
        cause;
        /** Construct a not found error. */
        constructor(opts) {
            super(opts.message);
            this.message = opts.message;
            this.name = "OperationError";
            this.query = opts.query;
            this.reason = opts.reason;
            this.cause = opts.cause;
            Object.setPrototypeOf(this, new.target.prototype); // ensure instanceof works after transpile.
        }
    }
    Collection.OperationError = OperationError;
    /**
     * Error thrown when a document is not found.
     * This error extends the {@link OperationError} which in turn extends the default {@link Error} class.
     * @docs
     */
    class NotFoundError extends OperationError {
        /**
         * Constructor method.
         * @param opts The error options, see {@link OperationError.Opts}.
         */
        constructor(opts) {
            super(opts);
            this.name = "NotFoundError";
            Object.setPrototypeOf(this, new.target.prototype); // ensure instanceof works after transpile.
        }
    }
    Collection.NotFoundError = NotFoundError;
    /**
     * Error thrown when a {@link Collection.Opts.on_transform_version} callback fails.
     * This error extends the {@link OperationError} which in turn extends the default {@link Error} class.
     * @docs
     */
    class OnTransformError extends OperationError {
        /**
         * Constructor method.
         * @param opts The error options, see {@link OperationError.Opts}.
         */
        constructor(opts) {
            super(opts);
            this.name = "OnTransformError";
            Object.setPrototypeOf(this, new.target.prototype); // ensure instanceof works after transpile.
        }
    }
    Collection.OnTransformError = OnTransformError;
    /**
     * Error thrown when a {@link Collection.Opts.on_load} callback fails.
     * This error extends the {@link OperationError} which in turn extends the default {@link Error} class.
     * @docs
     */
    class OnLoadError extends OperationError {
        /**
         * Constructor method.
         * @param opts The error options, see {@link OperationError.Opts}.
         */
        constructor(opts) {
            super(opts);
            this.name = "OnLoadError";
            Object.setPrototypeOf(this, new.target.prototype); // ensure instanceof works after transpile.
        }
    }
    Collection.OnLoadError = OnLoadError;
    /**
     * Error thrown when a count operation fails.
     * This error extends {@link OperationError} which in turn extends the default {@link Error} class.
     * @docs
     */
    class CountError extends OperationError {
        /**
         * Construct a {@link CountError}.
         * @param opts The error options, see {@link OperationError.Opts}.
         */
        constructor(opts) {
            super(opts);
            this.name = "CountError";
            Object.setPrototypeOf(this, new.target.prototype); // ensure instanceof works after transpile.
        }
    }
    Collection.CountError = CountError;
    /**
     * Error thrown when a list operation fails.
     * This error extends the {@link OperationError} which in turn extends the default {@link Error} class.
     * @docs
     */
    class ListError extends OperationError {
        /**
         * Constructor method.
         * @param opts The error options, see {@link OperationError.Opts}.
         */
        constructor(opts) {
            super(opts);
            this.name = "ListError";
            Object.setPrototypeOf(this, new.target.prototype); // ensure instanceof works after transpile.
        }
    }
    Collection.ListError = ListError;
    /**
     * Error thrown when a load operation fails.
     * This error extends the {@link OperationError} which in turn extends the default {@link Error} class.
     * @docs
     */
    class ExistsError extends OperationError {
        /**
         * Constructor method.
         * @param opts The error options, see {@link OperationError.Opts}.
         */
        constructor(opts) {
            super(opts);
            this.name = "ExistsError";
            Object.setPrototypeOf(this, new.target.prototype); // ensure instanceof works after transpile.
        }
    }
    Collection.ExistsError = ExistsError;
    /**
     * Error thrown when a load operation fails.
     * This error extends the {@link OperationError} which in turn extends the default {@link Error} class.
     * @docs
     */
    class LoadError extends OperationError {
        /**
         * Constructor method.
         * @param opts The error options, see {@link OperationError.Opts}.
         */
        constructor(opts) {
            super(opts);
            this.name = "LoadError";
            Object.setPrototypeOf(this, new.target.prototype); // ensure instanceof works after transpile.
        }
    }
    Collection.LoadError = LoadError;
    /**
     * Error thrown when a save operation fails.
     * This error extends the {@link OperationError} which in turn extends the default {@link Error} class.
     * @docs
     */
    class SaveError extends OperationError {
        /**
         * Constructor method.
         * @param opts The error options, see {@link OperationError.Opts}.
         */
        constructor(opts) {
            super(opts);
            this.name = "SaveError";
            Object.setPrototypeOf(this, new.target.prototype); // ensure instanceof works after transpile.
        }
    }
    Collection.SaveError = SaveError;
    /**
     * Error thrown when a delete operation fails.
     * This error extends the {@link OperationError} which in turn extends the default {@link Error} class.
     * @docs
     */
    class DeleteError extends OperationError {
        /**
         * Constructor method.
         * @param opts The error options, see {@link OperationError.Opts}.
         */
        constructor(opts) {
            super(opts);
            this.name = "DeleteError";
            Object.setPrototypeOf(this, new.target.prototype); // ensure instanceof works after transpile.
        }
    }
    Collection.DeleteError = DeleteError;
    /**
     * Error thrown when a bulk operation fails.
     * This error extends the {@link OperationError} which in turn extends the default {@link Error} class.
     * @docs
     */
    class BulkError extends OperationError {
        /**
         * Constructor method.
         * @param opts The error options, see {@link OperationError.Opts}.
         */
        constructor(opts) {
            super(opts);
            this.name = "BulkError";
            Object.setPrototypeOf(this, new.target.prototype); // ensure instanceof works after transpile.
        }
    }
    Collection.BulkError = BulkError;
    /**
     * Error thrown when an aggregate operation fails.
     * This error extends the {@link OperationError} which in turn extends the default {@link Error} class.
     * @docs
     */
    class AggregateError extends OperationError {
        /**
         * Constructor method.
         * @param opts The error options, see {@link OperationError.Opts}.
         */
        constructor(opts) {
            super(opts);
            this.name = "AggregateError";
            Object.setPrototypeOf(this, new.target.prototype); // ensure instanceof works after transpile.
        }
    }
    Collection.AggregateError = AggregateError;
    /** The nested types for the {@link Projection} type. */
    let Projection;
    (function (Projection) {
        /**
         * Convert a projection query into a MongoDB-compatible format.
         * @throws An error if both inclusion (1) and exclusion (0) patterns are found,
         *         since this is not allowed by mongodb.
         */
        function init(projection) {
            if (Array.isArray(projection)) {
                const p = {};
                for (let i = 0; i < projection.length; i++) {
                    p[projection[i]] = 1;
                }
                return p;
            }
            else {
                const p = projection;
                // object form
                let has_include = false;
                let has_exclude = false;
                for (const [k, v] of Object.entries(p)) {
                    if (v === 1 || v === true) {
                        if (k !== "_id")
                            has_include = true;
                    }
                    else if (v === 0 || v === false) {
                        if (k !== "_id")
                            has_exclude = true;
                    }
                    else {
                        throw new InvalidUsageError({
                            message: `Invalid projection value for "${k}": expected 0, 1, true or false.`,
                            reason: "invalid_projection",
                        });
                    }
                    if (has_include && has_exclude) {
                        throw new InvalidUsageError({
                            message: "Invalid projection: cannot mix inclusion and exclusion (except for _id).",
                            reason: "invalid_projection",
                        });
                    }
                }
                return p;
            }
        }
        Projection.init = init;
    })(Projection = Collection.Projection || (Collection.Projection = {}));
    // Unit tests for `ProjectedDocument`.
    {
    }
})(Collection || (Collection = {}));
// ---------------------------------------------------------
// The extended transaction based collection class.
// ---------------------------------------------------------
/**
 * TransactionCollection extends Collection with transaction-specific methods.
 * This class provides commit and abort functionality for MongoDB transactions.
 * @warning The transaction collection should only be initialized via {@link Collection.start_transaction}.
 *
 * @nav Database
 * @docs
 */
export class TransactionCollection extends Collection {
    /**
     * Commit the current transaction.
     * Implements retry logic for transient errors and unknown commit results.
     * @throws {InvalidUsageError} If there is no active session or if the transaction has already been finalized.
     * @throws {Error} If the commit fails after retries or encounters a non-retryable error.
     *
     * @docs
     */
    async commit() {
        const session = this._session;
        if (!session) {
            throw new InvalidUsageError({
                message: "No active session for this transaction.",
                reason: "no_session",
            });
        }
        if (this.is_finalized_transaction) {
            throw new InvalidUsageError({
                message: "Transaction has already been finalized.",
                reason: "transaction_finalized",
            });
        }
        // if (typeof (session as any).inTransaction === "function" && !(session as any).inTransaction()) {
        //     throw new Error("Cannot commit: session is not in a transaction.");
        // }
        const max_retries_unknown = 10; // for UnknownTransactionCommitResult / network-ish
        const base_delay_ms = 20;
        const max_delay_ms = 1000;
        for (let attempt = 0; attempt <= max_retries_unknown; attempt++) {
            try {
                await session.commitTransaction();
                this.is_finalized_transaction = true;
                try {
                    await session.endSession();
                }
                finally {
                    this._session = undefined;
                }
                return;
            }
            catch (err) {
                const has_label = (label) => {
                    if (!err || typeof err !== "object") {
                        return false;
                    }
                    if (typeof err?.hasErrorLabel === "function") {
                        try {
                            return !!err.hasErrorLabel(label);
                        }
                        catch { }
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
                    try {
                        await session.abortTransaction();
                    }
                    catch { }
                    this.is_finalized_transaction = true;
                    try {
                        await session.endSession();
                    }
                    finally {
                        this._session = undefined;
                    }
                    const e = new Error(`TransientTransactionError during commit; transaction aborted. Retry the entire transaction. ${err?.message ?? ""}`);
                    e.codeName = err?.codeName;
                    e.errorLabels = err?.errorLabels;
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
                    try {
                        await session.endSession();
                    }
                    finally {
                        this._session = undefined;
                    }
                    const e = new Error(`Commit failed after ${attempt + 1} attempt(s) with unknown outcome; last error: ${err?.message ?? err}`);
                    e.codeName = err?.codeName;
                    e.errorLabels = err?.errorLabels;
                    throw e;
                }
                // Non-retryable: finalize and rethrow
                this.is_finalized_transaction = true;
                try {
                    await session.endSession();
                }
                finally {
                    this._session = undefined;
                }
                throw err;
            }
        }
    }
    /**
     * Abort the current transaction.
     * Implements retry logic for transient errors.
     * @throws {InvalidUsageError} If there is no active session or if the transaction has already been finalized.
     * @throws {Error} If the abort fails after retries or encounters a non-retryable error.
     *
     * @docs
     */
    async abort() {
        const session = this._session;
        if (!session) {
            throw new InvalidUsageError({
                message: "No active session for this transaction.",
                reason: "no_session",
            });
        }
        if (this.is_finalized_transaction) {
            throw new InvalidUsageError({
                message: "Transaction has already been finalized.",
                reason: "transaction_finalized",
            });
        }
        const max_retries = 5;
        const base_delay_ms = 20;
        const max_delay_ms = 500;
        for (let attempt = 0; attempt <= max_retries; attempt++) {
            try {
                await session.abortTransaction();
                this.is_finalized_transaction = true;
                try {
                    await session.endSession();
                }
                finally {
                    this._session = undefined;
                }
                return;
            }
            catch (err) {
                // If server says it doesn't exist, treat as already aborted/ended
                if (err?.codeName === "NoSuchTransaction") {
                    this.is_finalized_transaction = true;
                    try {
                        await session.endSession();
                    }
                    finally {
                        this._session = undefined;
                    }
                    return;
                }
                const has_label = (label) => {
                    if (!err || typeof err !== "object") {
                        return false;
                    }
                    if (typeof err?.hasErrorLabel === "function") {
                        try {
                            return !!err.hasErrorLabel(label);
                        }
                        catch { }
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
                try {
                    await session.endSession();
                }
                finally {
                    this._session = undefined;
                }
                throw err;
            }
        }
    }
    /**
     * Cleanup method for proper resource management
     * Can be called manually or via async disposal
     *
     * @warning This method aborts the transaction if it is still active.
     * @docs
     */
    async cleanup() {
        if (this._session && !this.is_finalized_transaction) {
            try {
                await this.abort();
            }
            catch (error) {
                console.error('Failed to abort transaction during cleanup:', error);
                // Still try to end the session
                if (this._session) {
                    try {
                        await this._session.endSession();
                    }
                    catch (endError) {
                        console.error('Failed to end session during cleanup:', endError);
                    }
                }
            }
            finally {
                this.is_finalized_transaction = true;
            }
        }
    }
    // Support for async disposal (TC39 proposal)
    async [Symbol.asyncDispose]() {
        await this.cleanup();
    }
    /**
     * Check if the transaction is still active (not finalized).
     * @returns True if the transaction is active, false otherwise.
     * @docs
     */
    is_active() {
        return this.is_transaction && !this.is_finalized_transaction && this._session != null;
    }
}
// -------------------------------------------------------
// Some unit tests for save.
// -------------------------------------------------------
async function test_save() {
    const res = void await test_col.save({ uid: "" }, 
    // @ts-ignore
    { uid: "" }, { return: true });
    const res_no_throw = await test_col.save({ uid: "" }, 
    // @ts-ignore
    { uid: "" }, { return: true, throw: false, bulk: false });
    function init_save_opts(opts) {
        return opts;
    }
    // ok: bulk path
    const a = init_save_opts({ bulk: true, upsert: true });
    // ok: no return, throw not allowed
    const b = init_save_opts({ return: false, upsert: true });
    // ok; throw `true` allowed when return is `false`
    const b2 = init_save_opts({ return: false, throw: true });
    // ok: return + no upsert, throw allowed
    const c = init_save_opts({ return: true, upsert: false, throw: false });
    // @ts-expect-error ❌ bulk not allowed when return is true
    const e = init_save_opts({ return: true, upsert: true, bulk: true });
    const res_bulk_op = await test_col.save({ uid: "" }, { uid: "" }, { bulk: true });
    const res_undef = await test_col.save({ uid: "" }, { uid: "" });
    const res_doc = await test_col.save({ uid: "" }, { uid: "" }, { return: true });
    const res_doc_or_undef = await test_col.save({ uid: "" }, { uid: "" }, { return: true, throw: false, upsert: false });
    async function save_wrapper(doc, bulk) {
        return await test_col.save({ id: "test" }, { $set: doc }, { bulk });
    }
}
// -------------------------------------------------------
