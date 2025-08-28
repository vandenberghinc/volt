/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Libraries.

import * as vlib from "@vandenberghinc/vlib";
import * as mongodb from "mongodb";
import { WithId } from "mongodb";

// Imports.
import { Status } from "../status.js";
import { ExternalError, InternalError } from "../utils.js";
import { Collection } from "./collection.js";
import { Query } from "./collection.js";
import { FlattenToDotNotation } from "./flatten.js";
import { StrictUpdateFilter } from "./filters/filters.js";

// ---------------------------------------------------------
// Document reference object.

export namespace Document {

    /** Nested types for the {@link Ref} class. */
    export namespace Ref {

        /** The options interface for the second args `opts` from the {@link Ref} constructor. */
        export interface Opts<Data extends mongodb.Document> {
            /** The parent collection. */
            col: Collection<Data>;
            /**
             * The default value to return for an empty document.
             * Or when the document exists, fields present in the default
             * which are not present in the document will be merged in.
             * 
             * @note For inserts, the entire default is deep-cloned.
             *       For load-time merging, only the values that get assigned are cloned; the default object itself is not mutated.
             */
            def?: Data | (() => Data);
            // chunked?: boolean;
            /** If true then the errors are thrown as external errors, instead of internal errors. */
            external_errors?: boolean;
            /**
             * The record type version for the database. 
             *  This can be used in combination with parameter `transform_version` to ...
             * Transform older record versions to the current version.
             */
            record_version?: number;
            /** The function to transform an older document version to the current version. */
            transform_version?: (from_version: undefined | number, to_version: number, document: any) => Ref.WithSysFieldsAndId<Data>;
            /**
             * The function to call when the document is loaded, also when the default value is used.
             * @warning This callback is not called when partially loading the document through for instance {@link Ref.load_partial}.
             * @note This callback is called after the optional `transform_version` is executed.
             */
            on_load?: (data: Ref.WithSysFieldsAndId<Data>) => Ref.WithSysFieldsAndId<Data>;
        }

        /**
         * A type to add system values always added by the ref class,
         */
        export type WithSysFields<T> = T & { __record_version?: number };
        export type WithSysFieldsAndId<T> = WithId<WithSysFields<T>>;
    }

    /**
     * Document reference object. Its objectively an document without holding its data.
     * Its more efficient to store that separately and use this to perform operations on it.
     * This supports a hierarchy where a class instance always holds a reference and the loaded document.
     * And a static function can be declared to load the document and initialize the class instance.
     * This is a better design then a class with an optional data attribute, which was the previous design.
     * This proved very difficult to work with and was not very efficient.
     * 
     * @warning This class adds system field `__record_version` to each record, do not override this field manually.
     */
    export class Ref<
        Data extends mongodb.Document
    > {
        col: Collection<Data>;
        query: Query<Data>;
        def?: Data | (() => Data);
        // chunked: boolean;
        record_version: number; // defaults to 1.
        error_type: typeof InternalError | typeof ExternalError;
        transform_version?: (from_version: undefined | number, to_version: number, document: any) => Ref.WithSysFieldsAndId<Data>;
        _on_load?: (data: Ref.WithSysFieldsAndId<Data>) => Ref.WithSysFieldsAndId<Data>;

        /** Construct a new `Ref` instance. */
        constructor(query: Query<Data>, opts: Ref.Opts<Data>) {

            // Validate query
            if (
                !query ||
                (typeof query !== "string" && typeof query !== "object") ||
                (typeof query === "object" && query != null && Object.keys(query).length === 0)
            ) {
                throw new (opts.external_errors ? ExternalError : InternalError)({
                    type: "InvalidDocumentRef",
                    message: "Query must be a non-empty string or a non-empty object",
                    status: Status.bad_request,
                });
            }

            // Assign attributes.
            this.query = query;
            this.col = opts.col;
            this.def = opts.def;
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
        private on_load(
            data: Ref.WithSysFieldsAndId<Data>,
            opts?: { insert_defaults: boolean },
        ): Ref.WithSysFieldsAndId<Data> {

            if (
                this.record_version != null
                && this.transform_version != null
                && data.__record_version !== this.record_version
            ) {
                try {
                    data = this.transform_version(data.__record_version, this.record_version, data);
                } catch (e) {
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

            // Set defaults.
            if (this.def && (opts?.insert_defaults ?? true)) {
                try {
                    Collection.insert_defaults_helper(
                        data,
                        this.as_default({ clone: false })!,
                        { clone: true },
                    );
                } catch (e) {
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
                data = this._on_load(data);
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
        as_default(opts?: { clone: boolean}): Ref.WithSysFields<Data> | undefined {
            if (this.def) {
                const raw: Ref.WithSysFields<Data> = typeof this.def === "function" ? this.def() : this.def;
                if (opts?.clone ?? true) {
                    const cloned: Data = (typeof globalThis.structuredClone === "function")
                        ? structuredClone(raw)
                        : vlib.Object.deep_copy(raw);
                    (cloned as Ref.WithSysFields<Data>).__record_version = this.record_version;
                    return cloned;
                }
                // still not mutate raw since we set __record_version.
                return {
                    ...raw,
                    __record_version: this.record_version,
                }
            }
        }

        /** Check if a project exists.
         * @note this does not load the full document. 
         */
        async exists(): Promise<boolean> {
            return await this.col.exists(
                this.query,
            );
        }

        /**
         * Load a project from the database.
         * Automatically performing the optional {@link Ref.Opts.transform_version} and {@link Ref.Opts.on_load} callbacks.
         * 
         * @param def the default value, when the default value is an object then the attributes will be checked / inserted as well.
         */
        async load(): Promise<undefined | Ref.WithSysFieldsAndId<Data>> {
            let data = await this.col.load(
                this.query,
                // { chunked: this.chunked },
            )
            if (!data) {
                if (this.def) {
                    data = this.as_default() as Ref.WithSysFieldsAndId<Data>;
                    (data as any)._id = new mongodb.ObjectId();
                    return this.on_load(
                        data,
                        { insert_defaults: false },
                    );
                }
                return ;
            }
            return this.on_load(data);
        }

        /**
         * Load partial by projection.
         * 
         * @warning This does not execute the optional {@link Ref.Opts.transform_version} and {@link Ref.Opts.on_load} callbacks.
         * 
         * @param fields The fields to load, nested fields should be separated by a dot (e.g. "a.b.c").
         */
        async load_partial(...fields: string[]): Promise<undefined | Partial<Ref.WithSysFieldsAndId<Data>>> {
            const projection: Record<string, number> = {};
            projection._id = 1;
            projection.__record_version = 1;
            for (const field of fields) {
                projection[field] = 1;
            }
            return await this.col.load(
                this.query,
                { projection },
            );
        }

        /**
         * Safely save the document to the database, internally executing {@link Collection.save}
         * Inserting default values upon document creation.
         * 
         * @note This retrieves the default document values opon every call.
         *       Either by executing the {@link Ref.def} method, or by passing its
         *       raw properties directly if it is passed as such.
         * 
         * @warning Keep in mind that if you defined {@link Ref.def} as method,
         *          it will be called on every call of this function.
         */
        async safe_set<
            Bulk extends boolean | undefined = undefined,
            Return extends boolean | undefined = undefined,
            Throw extends boolean | undefined = undefined,
            Upsert extends boolean | undefined = undefined,
        >(
            data: Data | FlattenToDotNotation<Data>,
            opts?: Collection.SaveOpts<Bulk, Return, Throw, Upsert> & Pick<Collection.SetOpts, "flatten">,
        ): Promise<Collection.SaveResult<Data, Bulk, Return, Throw, Upsert>> {
            const op_data: Ref.WithSysFields<Data | FlattenToDotNotation<Data>> = {
                ...(opts?.flatten ? this.col.flatten(data) as any : data),
                __record_version: this.record_version,
            };
            return this.col.save<Bulk, Return, Throw, Upsert>(
                this.query,
                {
                    $set: op_data,
                    $setOnInsert: this.as_default(),
                } as StrictUpdateFilter<Data>,
                opts,
            );
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
        async set<
            Bulk extends boolean | undefined = undefined,
            Return extends boolean | undefined = undefined,
            Throw extends boolean | undefined = undefined,
            Upsert extends boolean | undefined = undefined,
        >(
            data: Data | FlattenToDotNotation<Data>,
            opts?: Collection.SetOpts<Bulk, Return, Throw, Upsert>,
        ): Promise<Collection.SetResult<Data, Bulk, Return, Throw, Upsert>> {
            const op_data: Ref.WithSysFields<Data | FlattenToDotNotation<Data>> = {
                ...data, // flattening is handled in `col.set`.
                __record_version: this.record_version,
            };
            return this.col.set(
                this.query,
                op_data,
                opts,
            );
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
        async set_partial<
            Bulk extends boolean | undefined = undefined,
            Return extends boolean | undefined = undefined,
            Throw extends boolean | undefined = undefined,
            Upsert extends boolean | undefined = undefined,
        >(
            data: Partial<Data> | Partial<FlattenToDotNotation<Data>>,
            opts?: Collection.SetOpts<Bulk, Return, Throw, Upsert>,
        ): Promise<Collection.SetResult<Data, Bulk, Return, Throw, Upsert>> {
            const op_data: Ref.WithSysFields<Partial<Data> | Partial<FlattenToDotNotation<Data>>> = {
                ...data, // flattening is handled in `col.set`.
                __record_version: this.record_version,
            };
            return this.col.set(
                this.query,
                op_data,
                opts,
            );
        }

        /**
         * Save a single document without performing any default `$set` or `$inc` like operations.
         * When a document does not exist it will automatically be created.
         * Inserting default values upon document creation.
         * 
         * @warning Keep in mind that if you defined {@link Ref.def} as method,
         *          it will be called on every call of this function.
         * 
         * @note This retrieves the default document values opon every call.
         *       Either by executing the {@link Ref.def} method, or by passing its
         *       raw properties directly if it is passed as such.
         * 
         * @throws An error if the document write is not acknowledged by mongodb (failed) or if the matched query count is 0.
         *         Or when `return` is `true` it returns an error if the returned document is undefined.
         */
        async safe_save<
            Bulk extends boolean | undefined = undefined,
            Return extends boolean | undefined = undefined,
            Throw extends boolean | undefined = undefined,
            Upsert extends boolean | undefined = undefined,
        >(
            data: vlib.Types.Neverify<StrictUpdateFilter<Data>, "$setOnInsert">,
            opts?: Collection.SaveOpts<Bulk, Return, Throw, Upsert>,
        ): Promise<Collection.SaveResult<Data, Bulk, Return, Throw, Upsert>> {
            if (data.$set == null) {
                (data as StrictUpdateFilter<any>).$set = { __record_version: this.record_version }
            } else {
                (data as StrictUpdateFilter<any>).$set = {
                    ...(data as StrictUpdateFilter<any>).$set,
                    __record_version: this.record_version,
                };
            }
            (data as StrictUpdateFilter<any>).$setOnInsert = this.as_default();
            return this.col.save(
                this.query,
                data,
                opts,
            );
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
        async save<
            Bulk extends boolean | undefined = undefined,
            Return extends boolean | undefined = undefined,
            Throw extends boolean | undefined = undefined,
            Upsert extends boolean | undefined = undefined,
        >(
            data: StrictUpdateFilter<Data>,
            opts?: Collection.SaveOpts<Bulk, Return, Throw, Upsert>,
        ): Promise<Collection.SaveResult<Data, Bulk, Return, Throw, Upsert>> {
            if (data.$set == null) {
                (data as StrictUpdateFilter<any>).$set = { __record_version: this.record_version }
            } else {
                (data as StrictUpdateFilter<any>).$set = {
                    ...(data as StrictUpdateFilter<any>).$set,
                    __record_version: this.record_version,
                };
            }
            return this.col.save(
                this.query,
                data,
                opts,
            );
        }

        /** Delete the database record. */
        async delete<Bulk extends boolean | undefined = undefined>(
            opts?: Collection.DeleteOpts<Bulk>,
        ): Promise<Collection.DeleteResult<Data, Bulk>> {
            return this.col.delete(
                this.query,
                opts,
            );
        }
    }
}