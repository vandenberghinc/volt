/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh.
 */
import * as vlib from "@vandenberghinc/vlib";
import * as mongodb from "mongodb";
import { WithId } from "mongodb";
import { ExternalError, InternalError } from "../utils.js";
import { Collection } from "./collection.js";
import { Query } from "./collection.js";
import { FlattenToDotNotation } from "./flatten.js";
import { StrictUpdateFilter } from "./filters/filters.js";
export declare namespace Document {
    /** Nested types for the {@link Ref} class. */
    namespace Ref {
        /** The options interface for the second args `opts` from the {@link Ref} constructor. */
        interface Opts<Data extends mongodb.Document, Default extends Collection.LoadOpts.Default<Data> = Collection.LoadOpts.Default<Data>> {
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
            default?: Default;
            /** If true then (some) errors are thrown as external errors, instead of internal errors. */
            external_errors?: boolean;
            /**
             * The record type version for the database.
             * This can be used to transform older record versions to the current
             * version when used in combination with field {@link Opts.transform_version}.
             */
            record_version?: number;
            /**
             * The function to transform an older document version to the current version.
             * This callback is only executed when loading the document through {@link Ref.load},
             * or when executing {@link Ref.on_load}.
             *
             * This callback is executed before the optional {@link Opts.on_load} callback.
             *
             * @note The callback input `data` may be an older document shape that does not match {@link Data}.
             */
            transform_version?: OnTransformVersion<Data>;
            /**
             * The function to call when the document is loaded, also when the default value is used.
             * This callback is only executed when loading the document through {@link Ref.load},
             * or when executing {@link Ref.on_load}.
             *
             * This callback is executed after the optional {@link Opts.transform_version} callback.
             */
            on_load?: OnLoad<Data>;
        }
        /**
         * The type for the {@link Opts.transform_version} and {@link Ref.transform_version} callback.
         * @note The input `data` may be an older document shape that does not match {@link Data}.
         */
        type OnTransformVersion<Data extends mongodb.Document> = <Projection extends Collection.LoadOpts.Projection, D extends (Projection extends undefined ? Ref.WithSysFieldsAndId<Data> : Ref.WithSysFieldsAndId<Partial<Data>>) = (Projection extends undefined ? Ref.WithSysFieldsAndId<Data> : Ref.WithSysFieldsAndId<Partial<Data>>)>(data: Record<string, any>, opts: {
            from_version: undefined | number;
            to_version: number;
            partial: Projection extends undefined ? false : true;
        }) => D;
        /** The type for the {@link Opts.on_load} and {@link Ref._on_load} callback */
        type OnLoad<Data extends mongodb.Document> = <Projection extends Collection.LoadOpts.Projection, D extends (Projection extends undefined ? Ref.WithSysFieldsAndId<Data> : Ref.WithSysFieldsAndId<Partial<Data>>) = (Projection extends undefined ? Ref.WithSysFieldsAndId<Data> : Ref.WithSysFieldsAndId<Partial<Data>>)>(data: D, opts: {
            partial: Projection extends undefined ? false : true;
        }) => D;
        /**
         * A type to add system values always added by the ref class,
         */
        type WithSysFields<T> = T & {
            __record_version?: number;
        };
        type WithSysFieldsAndId<T> = WithId<WithSysFields<T>>;
    }
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
    class Ref<Data extends mongodb.Document, Default extends Collection.LoadOpts.Default<Data> = undefined> {
        col: Collection<Data>;
        query: Query<Data>;
        default?: Default;
        record_version: number;
        error_type: typeof InternalError | typeof ExternalError;
        transform_version?: Ref.OnTransformVersion<Data>;
        _on_load?: Ref.OnLoad<Data>;
        /** Construct a new `Ref` instance. */
        constructor(query: Query<Data>, opts: Ref.Opts<Data, Default>);
        /**
         * On load callback.
         *
         * @param opts.insert_defaults Whether to insert default values.
         *                             Defaults to `true`.
         */
        private on_load;
        /**
         * Get the computed default value, when defined.
         *
         * Cloning the default object by default.
         *
         * @param opts.clone Whether to clone the default object.
         *                   Defaults to `true`.
         */
        as_default(opts?: {
            clone: boolean;
        }): Ref.WithSysFields<Data> | undefined;
        /** Check if a document exists.
         * @note This does not load the full document.
         */
        exists(): Promise<boolean>;
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
        load<Projection extends Collection.LoadOpts.Projection = undefined, Throw extends Collection.LoadOpts.Throw = undefined>(opts?: Omit<Collection.LoadOpts<Data, Default, Projection, Throw>, "default">): Promise<Collection.LoadResult<Data, Default, Projection, Throw>>;
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
        safe_set<Bulk extends boolean | undefined = undefined, Return extends boolean | undefined = undefined, Throw extends boolean | undefined = undefined, Upsert extends boolean | undefined = undefined>(data: Data | FlattenToDotNotation<Data>, opts?: Collection.SaveOpts<Bulk, Return, Throw, Upsert> & Pick<Collection.SetOpts, "flatten">): Promise<Collection.SaveResult<Data, Bulk, Return, Throw>>;
        /**
         * Save the document to the database, internally executing {@link Collection.set}
         *
         * @warning This does not insert the default values upon document creation.
         *          Use {@link safe_set} to safely insert defaults.
         *
         * @throws An error if the document write is not acknowledged by mongodb (failed) or if the matched query count is 0.
         *         Or when `return` is `true` it returns an error if the returned document is undefined.
         */
        set<Bulk extends boolean | undefined = undefined, Return extends boolean | undefined = undefined, Throw extends boolean | undefined = undefined, Upsert extends boolean | undefined = undefined>(data: Data | FlattenToDotNotation<Data>, opts?: Collection.SetOpts<Bulk, Return, Throw, Upsert>): Promise<Collection.SetResult<Data, Bulk, Return, Throw>>;
        /**
         * Save the document to the database, internally executing {@link Collection.set}
         *
         * @warning This does not insert the default values upon document creation.
         *          Use {@link safe_set} to safely insert defaults.
         *
         * @throws An error if the document write is not acknowledged by mongodb (failed) or if the matched query count is 0.
         *         Or when `return` is `true` it returns an error if the returned document is undefined.
         */
        set_partial<Bulk extends boolean | undefined = undefined, Return extends boolean | undefined = undefined, Throw extends boolean | undefined = undefined, Upsert extends boolean | undefined = undefined>(data: Partial<Data> | Partial<FlattenToDotNotation<Data>>, opts?: Collection.SetOpts<Bulk, Return, Throw, Upsert>): Promise<Collection.SetResult<Data, Bulk, Return, Throw>>;
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
        safe_save<Bulk extends boolean | undefined = undefined, Return extends boolean | undefined = undefined, Throw extends boolean | undefined = undefined, Upsert extends boolean | undefined = undefined>(data: vlib.Types.Neverify<StrictUpdateFilter<Data>, "$setOnInsert">, opts?: Collection.SaveOpts<Bulk, Return, Throw, Upsert>): Promise<Collection.SaveResult<Data, Bulk, Return, Throw>>;
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
        save<Bulk extends boolean | undefined = undefined, Return extends boolean | undefined = undefined, Throw extends boolean | undefined = undefined, Upsert extends boolean | undefined = undefined>(data: StrictUpdateFilter<Data>, opts?: Collection.SaveOpts<Bulk, Return, Throw, Upsert>): Promise<Collection.SaveResult<Data, Bulk, Return, Throw>>;
        /** Delete the database record. */
        delete<Bulk extends boolean | undefined = undefined>(opts?: Collection.DeleteOpts<Bulk>): Promise<Collection.DeleteResult<Data, Bulk>>;
    }
}
