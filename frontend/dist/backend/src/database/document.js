/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh.
 */
// ---------------------------------------------------------
// Libraries.
import * as vlib from "@vandenberghinc/vlib";
import * as mongodb from "mongodb";
// Imports.
import { Status } from "../status.js";
import { ExternalError, InternalError } from "../utils.js";
import { Collection } from "./collection.js";
// ---------------------------------------------------------
// Document reference object.
export var Document;
(function (Document) {
    /**
     * Document reference object. Its objectively a document without holding its data.
     * Its more efficient to store that separately and use this to perform operations on it.
     * This supports a hierarchy where a class instance always holds a reference and the loaded document.
     * And a static function can be declared to load the document and initialize the class instance.
     * This is a better design then a class with an optional data attribute, which was the previous design.
     * This proved very difficult to work with and was not very efficient.
     *
     * @warning This class adds system field `__record_version` to each record, do not override this field manually.
     */
    class Ref {
        col;
        query;
        default;
        // chunked: boolean;
        record_version; // defaults to 1.
        error_type;
        transform_version;
        _on_load;
        /** Construct a new `Ref` instance. */
        constructor(query, opts) {
            // Validate query
            if (!query ||
                (typeof query !== "string" && typeof query !== "object") ||
                (typeof query === "object" && query != null && Object.keys(query).length === 0)) {
                throw new (opts.external_errors ? ExternalError : InternalError)({
                    type: "InvalidDocumentRef",
                    message: "Query must be a non-empty string or a non-empty object",
                    status: Status.bad_request,
                });
            }
            // Assign attributes.
            this.query = query;
            this.col = opts.col;
            this.default = opts.default;
            // this.chunked = opts.chunked || false;
            this.error_type = opts.external_errors ? ExternalError : InternalError;
            this.transform_version = opts.transform_version;
            this._on_load = opts.on_load;
            // Validate and set record version
            const version = opts.record_version ?? 1;
            if (!Number.isInteger(version) || version < 1) {
                throw new this.error_type({
                    type: "InvalidDocumentRef",
                    message: "Record version must be a positive integer",
                    status: Status.bad_request,
                });
            }
            this.record_version = version;
            // Check transform.
            if (this.record_version !== 1 && !this.transform_version) {
                throw new this.error_type({
                    type: "InvalidDocumentRef",
                    message: "Transform version must be set when record version is set.",
                    status: Status.bad_request,
                });
            }
        }
        /**
         * On load callback.
         *
         * @param opts.insert_defaults Whether to insert default values.
         *                             Defaults to `true`.
         */
        on_load(data, opts) {
            const is_partial = (opts?.projection != null && Object.keys(opts.projection).length > 0);
            if (this.record_version != null
                && this.transform_version != null
                && data.__record_version !== this.record_version) {
                try {
                    data = this.transform_version(data, {
                        from_version: data.__record_version,
                        to_version: this.record_version,
                        partial: is_partial,
                    });
                }
                catch (e) {
                    throw new this.error_type({
                        type: "DocumentTransformError",
                        message: `Failed to transform document version: ${e instanceof Error ? e.message : String(e)}`,
                        status: Status.internal_server_error,
                        cause: e
                    });
                }
                data.__record_version = this.record_version;
            }
            // Set record version if it doesnt exist.
            // ENSURE THIS IS DONE AFTER CALLING transform_version
            if (this.record_version != null && data.__record_version == null) {
                data.__record_version = this.record_version;
            }
            // Merge defaults only on full loads. For partial (projected) loads we avoid adding fields the caller did not request.
            if (this.default
                && (opts?.insert_defaults ?? true)
                && !is_partial) {
                try {
                    Collection.insert_defaults_helper(data, this.as_default({ clone: false }), { clone: true });
                }
                catch (e) {
                    throw new this.error_type({
                        type: "RecursionDepthExceeded",
                        message: e instanceof Error ? e.message : String(e),
                        status: Status.internal_server_error,
                        cause: e,
                    });
                }
            }
            // Call on load.
            if (this._on_load) {
                data = this._on_load(data, {
                    partial: is_partial,
                });
            }
            // Response.
            return data;
        }
        /**
         * Get the computed default value, when defined.
         *
         * Cloning the default object by default.
         *
         * @param opts.clone Whether to clone the default object.
         *                   Defaults to `true`.
         */
        as_default(opts) {
            // Dont insert `_id` here so it will never be overridden.
            if (this.default) {
                const raw = typeof this.default === "function" ? this.default() : this.default;
                if (opts?.clone ?? true) {
                    const cloned = (typeof globalThis.structuredClone === "function")
                        ? structuredClone(raw)
                        : vlib.Object.deep_copy(raw);
                    cloned.__record_version = this.record_version;
                    return cloned;
                }
                // still not mutate raw since we set __record_version.
                return {
                    ...raw,
                    __record_version: this.record_version,
                };
            }
        }
        /** Check if a document exists.
         * @note This does not load the full document.
         */
        async exists() {
            return await this.col.exists(this.query);
        }
        /**
         * Load a document from the database.
         *
         * Automatically performing the optional {@link Ref.Opts.transform_version} and {@link Ref.Opts.on_load} callbacks.
         *
         * Internally performing {@link Collection.load} so more info about the loading process can be found there.
         *
         * Default fields are automatically upserted when missing in the loaded document and
         * {@link Ref.Opts.default} is defined while {@link Collection.LoadOpts.projection} is not defined.
         *
         * @note When loading a document with a specified {@link Collection.LoadOpts.projection} the `__record_version` field will always be included.
         *
         * @returns See {@link Collection.LoadResult} for more info about the return type.
         */
        async load(opts) {
            const throw_errors = opts?.throw ?? true;
            try {
                // Check projection.
                if (opts?.projection && Object.keys(opts.projection).length === 0) {
                    opts.projection = undefined;
                }
                if (opts?.projection) {
                    // Insert __record_version for the transform version callback.
                    if (Array.isArray(opts.projection) && !opts.projection.includes("__record_version")) {
                        opts.projection = [...opts.projection, "__record_version"];
                    }
                    else if (typeof opts.projection === "object") {
                        // For exclusion patterns ensure record version is not excluded, 
                        // Inclusion and exclusion styles can not be mixed.
                        if (Object.values(opts.projection).some(v => v === 0 || v === false)) {
                            if (opts.projection["__record_version"] != null) {
                                opts.projection = { ...opts.projection };
                                delete opts.projection["__record_version"];
                            }
                        }
                        else if (opts.projection["__record_version"] !== 1 && opts.projection["__record_version"] !== true) {
                            // Ensure its included.
                            opts.projection = {
                                ...opts.projection,
                                __record_version: 1,
                            };
                        }
                    }
                }
                // Load data.
                if (opts?.default) {
                    // ensure default is not present at runtime.
                    opts = { ...opts, default: undefined };
                }
                const data = await this.col.load(this.query, opts);
                // Error returned by `throw:false`
                if (data instanceof Error) {
                    if (data instanceof Collection.NotFoundError && this.default) {
                        // Not found & this.default is defined.
                        const data = this.as_default();
                        if (data._id == null) {
                            data._id = new mongodb.ObjectId();
                        }
                        return this.on_load(data, { insert_defaults: false, projection: opts?.projection });
                    }
                    if (throw_errors)
                        throw data;
                    return data;
                }
                // Not an error.
                const success_data = data;
                return this.on_load(success_data, { insert_defaults: true, projection: opts?.projection });
                // Handle thrown errors.
            }
            catch (err) {
                // Not found when `throw:true`.
                if (err instanceof Collection.NotFoundError) {
                    if (this.default) {
                        const data = this.as_default();
                        if (!data._id) {
                            data._id = new mongodb.ObjectId();
                        }
                        return this.on_load(data, { insert_defaults: false, projection: opts?.projection });
                    }
                    if (throw_errors)
                        throw err;
                    return err;
                }
                // Throw or return error.
                if (throw_errors)
                    throw err;
                return err;
            }
        }
        /**
         * Safely save the document to the database, internally executing {@link Collection.save}
         * Inserting default values upon document creation.
         *
         * @note This retrieves the default document values upon every call.
         *       Either by executing the {@link Ref.def} method, or by passing its
         *       raw properties directly if it is passed as such.
         *
         * @warning Keep in mind that if you defined {@link Ref.def} as method,
         *          it will be called on every call of this function.
         */
        async safe_set(data, opts) {
            const op_data = {
                ...(opts?.flatten ? this.col.flatten(data) : data),
                __record_version: this.record_version,
            };
            return this.col.save(this.query, {
                $set: op_data,
                $setOnInsert: this.as_default(),
            }, opts);
        }
        /**
         * Save the document to the database, internally executing {@link Collection.set}
         *
         * @warning This does not insert the default values upon document creation.
         *          Use {@link safe_set} to safely insert defaults.
         *
         * @throws An error if the document write is not acknowledged by mongodb (failed) or if the matched query count is 0.
         *         Or when `return` is `true` it returns an error if the returned document is undefined.
         */
        async set(data, opts) {
            const op_data = {
                ...data, // flattening is handled in `col.set`.
                __record_version: this.record_version,
            };
            return this.col.set(this.query, op_data, opts);
        }
        /**
         * Save the document to the database, internally executing {@link Collection.set}
         *
         * @warning This does not insert the default values upon document creation.
         *          Use {@link safe_set} to safely insert defaults.
         *
         * @throws An error if the document write is not acknowledged by mongodb (failed) or if the matched query count is 0.
         *         Or when `return` is `true` it returns an error if the returned document is undefined.
         */
        async set_partial(data, opts) {
            const op_data = {
                ...data, // flattening is handled in `col.set`.
                __record_version: this.record_version,
            };
            return this.col.set(this.query, op_data, opts);
        }
        /**
         * Save a single document without performing any default `$set` or `$inc` like operations.
         * When a document does not exist it will automatically be created.
         * Inserting default values upon document creation.
         *
         * @warning Keep in mind that if you defined {@link Ref.def} as method,
         *          it will be called on every call of this function.
         *
         * @note This retrieves the default document values upon every call.
         *       Either by executing the {@link Ref.def} method, or by passing its
         *       raw properties directly if it is passed as such.
         *
         * @throws An error if the document write is not acknowledged by mongodb (failed) or if the matched query count is 0.
         *         Or when `return` is `true` it returns an error if the returned document is undefined.
         */
        async safe_save(data, opts) {
            if (data.$set == null) {
                data.$set = { __record_version: this.record_version };
            }
            else {
                data.$set = {
                    ...data.$set,
                    __record_version: this.record_version,
                };
            }
            data.$setOnInsert = this.as_default();
            return this.col.save(this.query, data, opts);
        }
        /**
         * Save a single document without performing any default `$set` or `$inc` like operations.
         * When a document does not exist it will automatically be created.
         *
         * @warning This does not insert the default values upon document creation.
         *          Use {@link safe_save} to safely insert defaults.
         *
         * @throws An error if the document write is not acknowledged by mongodb (failed) or if the matched query count is 0.
         *         Or when `return` is `true` it returns an error if the returned document is undefined.
         */
        async save(data, opts) {
            if (data.$set == null) {
                data.$set = { __record_version: this.record_version };
            }
            else {
                data.$set = {
                    ...data.$set,
                    __record_version: this.record_version,
                };
            }
            return this.col.save(this.query, data, opts);
        }
        /** Delete the database record. */
        async delete(opts) {
            return this.col.delete(this.query, opts);
        }
    }
    Document.Ref = Ref;
})(Document || (Document = {}));
