/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh.
 */
import { ExternalError, InternalError } from "../utils.js";
import { Collection } from "./collection.js";
import { Query } from "./collection.js";
/**
 * The document object, a container class for a document reference and its initialized data.
 * See {@link Document.Ref} for more information why we use a container around the reference.
 *
 * This class is mainly used to serve as a base class for custom derived document classes.
 *
 * We use a base class that does not expose any other sensitive functions such as `save`, `delete`, etc.
 * Because otherwise its somewhat unsafe to extend this class for sensitive data.
 */
export declare class Document<Data extends Document.Data> {
    /** Attributes */
    ref: Document.Ref<Data>;
    data: Data;
    /** Constructor
     * @param ref The document reference object.
     * @param data The initialized document data.
    */
    constructor(ref: Document.Ref<Data>, data: Data);
    /** Check if a document exists.
      * @note this does not load the full document.
      */
    exists(): Promise<boolean>;
}
export declare namespace Document {
    /** Base type for the Data template. */
    type Data = object | Record<string, any> | any[];
    /**
     * Document reference object. Its objectively an document without holding its data.
     * Its more efficient to store that separately and use this to perform operations on it.
     * This supports a hierarchy where a class instance always holds a reference and the loaded document.
     * And a static function can be declared to load the document and initialize the class instance.
     * This is a better design then a class with an optional data attribute, which was the previous design.
     * This proved very difficult to work with and was not very efficient.
     */
    class Ref<Data extends Document.Data> {
        col: Collection;
        query: Query;
        def?: Data | (() => Data);
        chunked: boolean;
        record_version?: number;
        error_type: typeof InternalError | typeof ExternalError;
        transform_version?: (version: number, document: any) => Data;
        _on_load?: (data: Data) => Data;
        /** Constructor
         * @param col The collection created by the server.
         * @param uid The uid of the document, this is only required when the collection is a UIDCollection.
         * @param query The document query, used to find the existing document.
         * @param def The default value, when the default value is an object then the attributes will be checked / inserted as well.
         * @param chunked If true then the document is stored in chunks.
         * @param external_errors If true then the errors are thrown as external errors, instead of internal errors.
         * @param record_version The record type version for the database.
         *        This can be used in combination with parameter `transform_version` to ...
         *        Transform older record versions to the current version.
         * @param transform_version The function to transform an older document version to the current version.
         * @param on_load The function to call when the document is loaded.
        */
        constructor(query: Query, opts: {
            col: Collection;
            def?: Data | (() => Data);
            chunked?: boolean;
            external_errors?: boolean;
            record_version?: number;
            transform_version?: (version: number, document: any) => Data;
            on_load?: (data: Data) => Data;
        });
        /** Insert defaults from constructor param `def`. */
        private insert_defaults;
        /**
         * On load callback.
         * @note this is not called when default data is used for an empty document.
         */
        private on_load;
        /** Get the computed default value, when defined. */
        as_default(): Data | undefined;
        /** Check if a project exists.
         * @note this does not load the full document.
         */
        exists(): Promise<boolean>;
        /**
         * Load a project from the database
         * @param def the default value, when the default value is an object then the attributes will be checked / inserted as well.
         */
        load(): Promise<undefined | Data>;
        /**
         * Load partial by projection.
         * @param fields The fields to load, nested fields should be separated by a dot (e.g. "a.b.c").
         */
        load_partial(...fields: string[]): Promise<undefined | Partial<Data>>;
        /** Save the project to the database */
        save(data: Data): Promise<any>;
        /** Save partial to the database
         * @note automatically inserts the new values when the document is loaded.
         */
        save_partial(partial_data: Record<string, any>): Promise<any>;
        /** Delete database record. */
        delete(opts?: {
            bulk?: boolean;
        }): Promise<any>;
    }
}
/**
 * The extended document object with more functionality.
 */
export declare class ExtendedDocument<Data extends Document.Data> extends Document<Data> {
    /** Constructor
     * @param ref The document reference object.
     * @param data The initialized document data.
    */
    constructor(ref: Document.Ref<Data>, data: Data);
    /** Wrapper function to insert an obj into another
      * @note this is not a deep copy.
      */
    private static __insert_obj;
    /** Save the data to the database */
    save(): Promise<any>;
    /** Save partial to the database
      * @note automatically inserts the new values when the document is loaded.
      */
    save_partial(partial_data: Record<string, any>): Promise<any>;
    /** Delete database record. */
    delete(opts?: {
        bulk?: boolean;
    }): Promise<any>;
}
