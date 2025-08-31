// /**
//  * @author Daan van den Bergh
//  * @copyright © 2022 - 2025 Daan van den Bergh.
//  */

// // ---------------------------------------------------------
// // Libraries.

// import * as vlib from "@vandenberghinc/vlib";
// import * as mongodb from "mongodb";
// import { WithId } from "mongodb";

// // Imports.
// import { Status } from "../status.js";
// import { ExternalError, InternalError } from "../utils.js";
// import { Collection } from "./collection.js";
// import { FlattenToDotNotation } from "./flatten.js";
// import { StrictUpdateFilter } from "./filters/filters.js";

// // ---------------------------------------------------------
// // Document reference object.

// export namespace Document {

//     /** Nested types for the {@link Ref} class. */
//     export namespace Ref {

//         /** The options interface for the second args `opts` from the {@link Ref} constructor. */
//         export interface Opts<
//             Data extends mongodb.Document,
//             Default extends Collection.LoadOpts.Default<Data> = Collection.LoadOpts.Default<Data>,
//         > {
//             /** The parent collection. */
//             col: Collection<Data>;
//             /**
//              * The default value to return for an empty document.
//              * Or when the document exists, fields present in the default
//              * which are not present in the document will be merged in.
//              * 
//              * @note For inserts, the entire default is deep-cloned.
//              *       For load-time merging, only the values that get assigned are cloned; the default object itself is not mutated.
//              */
//             default?: Default;
//             /** If true then (some) errors are thrown as external errors, instead of internal errors. */
//             external_errors?: boolean;
//             /**
//              * The record type version for the database. 
//              * This can be used to transform older record versions to the current
//              * version when used in combination with field {@link Opts.transform_version}.
//              */
//             record_version?: number;
//             /**
//              * The function to transform an older document version to the current version.
//              * This callback is only executed when loading the document through {@link Ref.load},
//              * or when executing {@link Ref.on_load}.
//              * 
//              * This callback is executed before the optional {@link Opts.on_load} callback.
//              * 
//              * @note The callback input `data` may be an older document shape that does not match {@link Data}.
//              */
//             transform_version?: OnTransformVersion<Data>;
//             /**
//              * The function to call when the document is loaded, also when the default value is used.
//              * This callback is only executed when loading the document through {@link Ref.load},
//              * or when executing {@link Ref.on_load}.
//              * 
//              * This callback is executed after the optional {@link Opts.transform_version} callback.
//              */
//             on_load?: OnLoad<Data>;
//         }

//         /**
//          * The type for the {@link Opts.transform_version} and {@link Ref.transform_version} callback.
//          * @note The input `data` may be an older document shape that does not match {@link Data}.
//          */
//         export type OnTransformVersion<
//             Data extends mongodb.Document,
//         > = <
//                 Projection extends Collection.LoadOpts.Projection,
//                 D extends (
//                     Projection extends undefined
//                     ? Ref.WithSysFieldsAndId<Data>
//                     : Ref.WithSysFieldsAndId<Partial<Data>>
//                 ) = (
//                     Projection extends undefined
//                     ? Ref.WithSysFieldsAndId<Data>
//                     : Ref.WithSysFieldsAndId<Partial<Data>>
//                 )
//             >(
//                 data: Record<string, any>,
//                 opts: {
//                     from_version: undefined | number;
//                     to_version: number;
//                     partial: Projection extends undefined ? false : true;
//                 },
//             ) => D;

//         /** The type for the {@link Opts.on_load} and {@link Ref._on_load} callback */
//         export type OnLoad<
//             Data extends mongodb.Document,
//         > = <
//                 Projection extends Collection.LoadOpts.Projection,
//                 D extends (
//                     Projection extends undefined
//                     ? Ref.WithSysFieldsAndId<Data>
//                     : Ref.WithSysFieldsAndId<Partial<Data>>
//                 ) = (
//                     Projection extends undefined
//                     ? Ref.WithSysFieldsAndId<Data>
//                     : Ref.WithSysFieldsAndId<Partial<Data>>
//                 )
//             >(
//                 data: D,
//                 opts: {
//                     partial: Projection extends undefined ? false : true;
//                 },
//             ) => D;

//         /**
//          * A type to add system values always added by the ref class,
//          */
//         export type WithSysFields<T> = T & { __record_version?: number };
//         export type WithSysFieldsAndId<T> = WithId<WithSysFields<T>>;
//     }

//     /**
//      * Document reference object. Its objectively a document without holding its data.
//      * Its more efficient to store that separately and use this to perform operations on it.
//      * This supports a hierarchy where a class instance always holds a reference and the loaded document.
//      * And a static function can be declared to load the document and initialize the class instance.
//      * This is a better design then a class with an optional data attribute, which was the previous design.
//      * This proved very difficult to work with and was not very efficient.
//      * 
//      * @warning This class adds system field `__record_version` to each record, do not override this field manually.
//      */
//     export class Ref<
//         Data extends mongodb.Document,
//         Default extends Collection.LoadOpts.Default<Data> = undefined,
//     > {
//         col: Collection<Data>;
//         query: Collection.Query<Data>;
//         default?: Default;
//         // chunked: boolean;
//         record_version: number; // defaults to 1.
//         error_type: typeof InternalError | typeof ExternalError;
//         transform_version?: Ref.OnTransformVersion<Data>;
//         _on_load?: Ref.OnLoad<Data>;

//         /** Construct a new `Ref` instance. */
//         constructor(query: Collection.Query<Data>, opts: Ref.Opts<Data, Default>) {

//             // Validate query
//             if (
//                 !query ||
//                 (typeof query !== "string" && typeof query !== "object") ||
//                 (typeof query === "object" && query != null && Object.keys(query).length === 0)
//             ) {
//                 throw new (opts.external_errors ? ExternalError : InternalError)({
//                     type: "InvalidDocumentRef",
//                     message: "Query must be a non-empty string or a non-empty object",
//                     status: Status.bad_request,
//                 });
//             }

//             // Assign attributes.
//             this.query = query;
//             this.col = opts.col;
//             this.default = opts.default;
//             // this.chunked = opts.chunked || false;
//             this.error_type = opts.external_errors ? ExternalError : InternalError;
//             this.transform_version = opts.transform_version;
//             this._on_load = opts.on_load;

//             // Validate and set record version
//             const version = opts.record_version ?? 1;
//             if (!Number.isInteger(version) || version < 1) {
//                 throw new this.error_type({
//                     type: "InvalidDocumentRef",
//                     message: "Record version must be a positive integer",
//                     status: Status.bad_request,
//                 });
//             }
//             this.record_version = version;

//             // Check transform.
//             if (this.record_version !== 1 && !this.transform_version) {
//                 throw new this.error_type({
//                     type: "InvalidDocumentRef",
//                     message: "Transform version must be set when record version is set.",
//                     status: Status.bad_request,
//                 });
//             }
//         }
        
//         /** 
//          * On load callback.
//          *
//          * @param opts.insert_defaults Whether to insert default values.
//          *                             Defaults to `true`.
//          */
//         private on_load<Projection extends Collection.LoadOpts.Projection>(
//             data: Projection extends undefined
//                 ? Ref.WithSysFieldsAndId<Data>
//                 : Ref.WithSysFieldsAndId<globalThis.Partial<Data>>,
//             opts: {
//                 insert_defaults: boolean,
//                 projection: Projection,
//             },
//         ): Projection extends undefined ? Ref.WithSysFieldsAndId<Data> : Ref.WithSysFieldsAndId<Partial<Data>> {
//             const is_partial = (opts?.projection != null && Object.keys(opts.projection).length > 0) as Projection extends undefined ? false : true;

//             if (
//                 this.record_version != null
//                 && this.transform_version != null
//                 && data.__record_version !== this.record_version
//             ) {
//                 try {
//                     data = this.transform_version<Projection>(data, {
//                         from_version: data.__record_version,
//                         to_version: this.record_version,
//                         partial: is_partial,
//                     });
//                 } catch (e) {
//                     throw new this.error_type({
//                         type: "DocumentTransformError",
//                         message: `Failed to transform document version: ${e instanceof Error ? e.message : String(e)}`,
//                         status: Status.internal_server_error,
//                         cause: e
//                     });
//                 }
//                 data.__record_version = this.record_version;
//             }

//             // Set record version if it doesnt exist.
//             // ENSURE THIS IS DONE AFTER CALLING transform_version
//             if (this.record_version != null && data.__record_version == null) {
//                 data.__record_version = this.record_version;

//             }

//             // Merge defaults only on full loads. For partial (projected) loads we avoid adding fields the caller did not request.
//             if (
//                 this.default
//                 && (opts?.insert_defaults ?? true)
//                 && !is_partial
//             ) {
//                 try {
//                     Collection.insert_defaults_helper(
//                         data,
//                         this.as_default({ clone: false })!,
//                         { clone: true },
//                     );
//                 } catch (e) {
//                     throw new this.error_type({
//                         type: "RecursionDepthExceeded",
//                         message: e instanceof Error ? e.message : String(e),
//                         status: Status.internal_server_error,
//                         cause: e,
//                     });
//                 }
//             }

//             // Call on load.
//             if (this._on_load) {
//                 data = this._on_load<Projection>(data, {
//                     partial: is_partial,
//                 });
//             }

//             // Response.
//             return data;
//         }

//         /**
//          * Get the computed default value, when defined.
//          * 
//          * Cloning the default object by default.
//          * 
//          * @param opts.clone Whether to clone the default object.
//          *                   Defaults to `true`.
//          */
//         as_default(opts?: { clone: boolean}): Ref.WithSysFields<Data> | undefined {
//             // Dont insert `_id` here so it will never be overridden.
//             if (this.default) {
//                 const raw: Ref.WithSysFields<Data> = typeof this.default === "function" ? this.default() : this.default;
//                 if (opts?.clone ?? true) {
//                     const cloned: Data = (typeof globalThis.structuredClone === "function")
//                         ? structuredClone(raw)
//                         : vlib.Object.deep_copy(raw);
//                     (cloned as Ref.WithSysFields<Data>).__record_version = this.record_version;
//                     return cloned;
//                 }
//                 // still not mutate raw since we set __record_version.
//                 return {
//                     ...raw,
//                     __record_version: this.record_version,
//                 }
//             }
//         }

//         /** Check if a document exists.
//          * @note This does not load the full document. 
//          */
//         async exists(): Promise<boolean> {
//             return await this.col.exists(
//                 this.query,
//             );
//         }

//         /**
//          * Load a document from the database.
//          * 
//          * Automatically performing the optional {@link Ref.Opts.transform_version} and {@link Ref.Opts.on_load} callbacks.
//          * 
//          * Internally performing {@link Collection.load} so more info about the loading process can be found there.
//          * 
//          * Default fields are automatically upserted when missing in the loaded document and
//          * {@link Ref.Opts.default} is defined while {@link Collection.LoadOpts.projection} is not defined.
//          * 
//          * @note When loading a document with a specified {@link Collection.LoadOpts.projection} the `__record_version` field will always be included.
//          * 
//          * @returns See {@link Collection.LoadResult} for more info about the return type.
//          */
//         async load<
//             Projection extends Collection.LoadOpts.Projection = undefined,
//             Throw extends Collection.LoadOpts.Throw = undefined,
//         >(
//             opts?: Omit<Collection.LoadOpts<Data, Default, Projection, Throw>, "default">
//         ): Promise<Collection.LoadResult<Data, Default, Projection, Throw>> {
//             type Res = Collection.LoadResult<Data, Default, Projection, Throw>;
//             const throw_errors = opts?.throw ?? true;
//             try {

//                 // Check projection.
//                 if (opts?.projection && Object.keys(opts.projection).length === 0) {
//                     opts.projection = undefined;
//                 }
//                 if (opts?.projection) {
//                     // Insert __record_version for the transform version callback.
//                     if (Array.isArray(opts.projection) && !opts.projection.includes("__record_version")) {
//                         opts.projection = [...opts.projection, "__record_version"] as unknown as Projection;
//                     }
//                     else if (typeof opts.projection === "object") {
//                         // For exclusion patterns ensure record version is not excluded, 
//                         // Inclusion and exclusion styles can not be mixed.
//                         if (Object.values(opts.projection).some(v => v === 0 || v === false)) {
//                             if (opts.projection["__record_version"] != null) {
//                                 opts.projection = { ...opts.projection };
//                                 delete opts.projection["__record_version"];
//                             }
//                         } else if (opts.projection["__record_version"] !== 1 && opts.projection["__record_version"] !== true) {
//                             // Ensure its included.
//                             opts.projection = {
//                                 ...opts.projection,
//                                 __record_version: 1,
//                             }
//                         }
//                     }
//                 }

//                 // Load data.
//                 if ((opts as undefined | Collection.LoadOpts<Data, Default, Projection, Throw>)?.default) {
//                     // ensure default is not present at runtime.
//                     opts = { ...opts, default: undefined } as Collection.LoadOpts<Data, Default, Projection, Throw>
//                 }
//                 const data = await this.col.load<Default, Projection, Throw>(
//                     this.query,
//                     opts,
//                 );

//                 // Error returned by `throw:false`
//                 if (data instanceof Error) {
//                     if (data instanceof Collection.NotFoundError && this.default) {
//                         // Not found & this.default is defined.
//                         const data = this.as_default() as Ref.WithSysFieldsAndId<Data>;
//                         if ((data as any)._id == null) {
//                             (data as any)._id = new mongodb.ObjectId();
//                         }
//                         return this.on_load<Projection>(
//                             data,
//                             { insert_defaults: false, projection: opts?.projection as Projection },
//                         ) as Res;
//                     }
//                     if (throw_errors) throw data;
//                     return data;
//                 }

//                 // Not an error.
//                 const success_data = data as Projection extends undefined ? Ref.WithSysFieldsAndId<Data> : Ref.WithSysFieldsAndId<Partial<Data>>;
//                 return this.on_load<Projection>(
//                     success_data,
//                     { insert_defaults: true, projection: opts?.projection as Projection },
//                 ) as Res;

//             // Handle thrown errors.
//             } catch (err: unknown) {

//                 // Not found when `throw:true`.
//                 if (err instanceof Collection.NotFoundError) {
//                     if (this.default) {
//                         const data = this.as_default() as Ref.WithSysFieldsAndId<Data>;
//                         if (!(data as any)._id) {
//                             (data as any)._id = new mongodb.ObjectId();
//                         }
//                         return this.on_load<Projection>(
//                             data,
//                             { insert_defaults: false, projection: opts?.projection as Projection },
//                         ) as Res;
//                     }
//                     if (throw_errors) throw err;
//                     return err as Res;
//                 }

//                 // Throw or return error.
//                 if (throw_errors) throw err;
//                 return err as Res;
//             }
//         }

//         /**
//          * Safely save the document to the database, internally executing {@link Collection.save}
//          * Inserting default values upon document creation.
//          * 
//          * @note This retrieves the default document values upon every call.
//          *       Either by executing the {@link Ref.def} method, or by passing its
//          *       raw properties directly if it is passed as such.
//          * 
//          * @warning Keep in mind that if you defined {@link Ref.def} as method,
//          *          it will be called on every call of this function.
//          */
//         async safe_set<
//             Bulk extends boolean | undefined = undefined,
//             Return extends boolean | undefined = undefined,
//             Throw extends boolean | undefined = undefined,
//             Upsert extends boolean | undefined = undefined,
//         >(
//             data: Data | FlattenToDotNotation<Data>,
//             opts?: Collection.SaveOpts<Bulk, Return, Throw, Upsert> & Pick<Collection.SetOpts, "flatten">,
//         ): Promise<Collection.SaveResult<Data, Bulk, Return, Throw>> {
//             const op_data: Ref.WithSysFields<Data | FlattenToDotNotation<Data>> = {
//                 ...(opts?.flatten ? this.col.flatten(data) as any : data),
//                 __record_version: this.record_version,
//             };
//             return this.col.save<Bulk, Return, Throw, Upsert>(
//                 this.query,
//                 {
//                     $set: op_data,
//                     $setOnInsert: this.as_default(),
//                 } as StrictUpdateFilter<Data>,
//                 opts,
//             );
//         }

//         /**
//          * Save the document to the database, internally executing {@link Collection.set}
//          * 
//          * @warning This does not insert the default values upon document creation.
//          *          Use {@link safe_set} to safely insert defaults.
//          * 
//          * @throws An error if the document write is not acknowledged by mongodb (failed) or if the matched query count is 0.
//          *         Or when `return` is `true` it returns an error if the returned document is undefined.
//          */
//         async set<
//             Bulk extends boolean | undefined = undefined,
//             Return extends boolean | undefined = undefined,
//             Throw extends boolean | undefined = undefined,
//             Upsert extends boolean | undefined = undefined,
//         >(
//             data: Data | FlattenToDotNotation<Data>,
//             opts?: Collection.SetOpts<Bulk, Return, Throw, Upsert>,
//         ): Promise<Collection.SetResult<Data, Bulk, Return, Throw>> {
//             const op_data: Ref.WithSysFields<Data | FlattenToDotNotation<Data>> = {
//                 ...data, // flattening is handled in `col.set`.
//                 __record_version: this.record_version,
//             };
//             return this.col.set(
//                 this.query,
//                 op_data,
//                 opts,
//             );
//         }

//         /**
//          * Save the document to the database, internally executing {@link Collection.set}
//          * 
//          * @warning This does not insert the default values upon document creation.
//          *          Use {@link safe_set} to safely insert defaults.
//          * 
//          * @throws An error if the document write is not acknowledged by mongodb (failed) or if the matched query count is 0.
//          *         Or when `return` is `true` it returns an error if the returned document is undefined.
//          */
//         async set_partial<
//             Bulk extends boolean | undefined = undefined,
//             Return extends boolean | undefined = undefined,
//             Throw extends boolean | undefined = undefined,
//             Upsert extends boolean | undefined = undefined,
//         >(
//             data: Partial<Data> | Partial<FlattenToDotNotation<Data>>,
//             opts?: Collection.SetOpts<Bulk, Return, Throw, Upsert>,
//         ): Promise<Collection.SetResult<Data, Bulk, Return, Throw>> {
//             const op_data: Ref.WithSysFields<Partial<Data> | Partial<FlattenToDotNotation<Data>>> = {
//                 ...data, // flattening is handled in `col.set`.
//                 __record_version: this.record_version,
//             };
//             return this.col.set(
//                 this.query,
//                 op_data,
//                 opts,
//             );
//         }

//         /**
//          * Save a single document without performing any default `$set` or `$inc` like operations.
//          * When a document does not exist it will automatically be created.
//          * Inserting default values upon document creation.
//          * 
//          * @warning Keep in mind that if you defined {@link Ref.def} as method,
//          *          it will be called on every call of this function.
//          * 
//          * @note This retrieves the default document values upon every call.
//          *       Either by executing the {@link Ref.def} method, or by passing its
//          *       raw properties directly if it is passed as such.
//          * 
//          * @throws An error if the document write is not acknowledged by mongodb (failed) or if the matched query count is 0.
//          *         Or when `return` is `true` it returns an error if the returned document is undefined.
//          */
//         async safe_save<
//             Bulk extends boolean | undefined = undefined,
//             Return extends boolean | undefined = undefined,
//             Throw extends boolean | undefined = undefined,
//             Upsert extends boolean | undefined = undefined,
//         >(
//             data: vlib.Types.Neverify<StrictUpdateFilter<Data>, "$setOnInsert">,
//             opts?: Collection.SaveOpts<Bulk, Return, Throw, Upsert>,
//         ): Promise<Collection.SaveResult<Data, Bulk, Return, Throw>> {
//             if (data.$set == null) {
//                 (data as StrictUpdateFilter<any>).$set = { __record_version: this.record_version }
//             } else {
//                 (data as StrictUpdateFilter<any>).$set = {
//                     ...(data as StrictUpdateFilter<any>).$set,
//                     __record_version: this.record_version,
//                 };
//             }
//             (data as StrictUpdateFilter<any>).$setOnInsert = this.as_default();
//             return this.col.save(
//                 this.query,
//                 data,
//                 opts,
//             );
//         }

//         /**
//          * Save a single document without performing any default `$set` or `$inc` like operations.
//          * When a document does not exist it will automatically be created.
//          * 
//          * @warning This does not insert the default values upon document creation.
//          *          Use {@link safe_save} to safely insert defaults.
//          * 
//          * @throws An error if the document write is not acknowledged by mongodb (failed) or if the matched query count is 0.
//          *         Or when `return` is `true` it returns an error if the returned document is undefined.
//          */
//         async save<
//             Bulk extends boolean | undefined = undefined,
//             Return extends boolean | undefined = undefined,
//             Throw extends boolean | undefined = undefined,
//             Upsert extends boolean | undefined = undefined,
//         >(
//             data: StrictUpdateFilter<Data>,
//             opts?: Collection.SaveOpts<Bulk, Return, Throw, Upsert>,
//         ): Promise<Collection.SaveResult<Data, Bulk, Return, Throw>> {
//             if (data.$set == null) {
//                 (data as StrictUpdateFilter<any>).$set = { __record_version: this.record_version }
//             } else {
//                 (data as StrictUpdateFilter<any>).$set = {
//                     ...(data as StrictUpdateFilter<any>).$set,
//                     __record_version: this.record_version,
//                 };
//             }
//             return this.col.save(
//                 this.query,
//                 data,
//                 opts,
//             );
//         }

//         /** Delete the database record. */
//         async delete<Bulk extends boolean | undefined = undefined>(
//             opts?: Collection.DeleteOpts<Bulk>,
//         ): Promise<Collection.DeleteResult<Data, Bulk>> {
//             return this.col.delete(
//                 this.query,
//                 opts,
//             );
//         }
//     }
// }