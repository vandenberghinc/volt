/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Libraries.

// Imports.
import { logger } from "../logger.js";
import { Status } from "../status.js";
import * as vlib from "@vandenberghinc/vlib";
import { ExternalError, InternalError } from "../utils.js";
import { Collection } from "./collection.js";
import { Query } from "./collection.js";
import { Database } from "./database.js";

/** Debug */
const { log } = logger;

// ---------------------------------------------------------


// ---------------------------------------------------------

/**
 * The document object, a container class for a document reference and its initialized data.
 * See {@link Document.Ref} for more information why we use a container around the reference.
 * 
 * This class is mainly used to serve as a base class for custom derived document classes.
 * 
 * We use a base class that does not expose any other sensitive functions such as `save`, `delete`, etc.
 * Because otherwise its somewhat unsafe to extend this class for sensitive data.
 */
export class Document<
    Data extends Document.Data
> {

    /** Attributes */
    ref: Document.Ref<Data>;
    data: Data;

    /** Constructor
     * @param ref The document reference object.
     * @param data The initialized document data.
    */
    constructor(
        ref: Document.Ref<Data>,
        data: Data,
    ) {
        this.ref = ref;
        this.data = data;
    }

    /** Check if a document exists.
      * @note this does not load the full document. 
      */
    async exists(): Promise<boolean> {
        return this.ref.exists();
    }
}

// ---------------------------------------------------------
// Document reference object.

export namespace Document {

    /** Base type for the Data template. */
    export type Data = object | Record<string, any> | any[];

    /**
     * Document reference object. Its objectively an document without holding its data.
     * Its more efficient to store that separately and use this to perform operations on it.
     * This supports a hierarchy where a class instance always holds a reference and the loaded document.
     * And a static function can be declared to load the document and initialize the class instance.
     * This is a better design then a class with an optional data attribute, which was the previous design.
     * This proved very difficult to work with and was not very efficient.
     */
    export class Ref<
        Data extends Document.Data
    > {
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
            col: Collection,
            def?: Data | (() => Data),
            chunked?: boolean;
            external_errors?: boolean;
            record_version?: number,
            transform_version?: (version: number, document: any) => Data,
            on_load?: (data: Data) => Data,
        }) {

            // Assign attributes.
            this.query = query;
            this.col = opts.col;
            this.def = opts.def;
            this.chunked = opts.chunked || false;
            this.error_type = opts.external_errors ? ExternalError : InternalError;
            this.record_version = typeof opts.record_version === "number" ? opts.record_version : 1;
            this.transform_version = opts.transform_version;
            this._on_load = opts.on_load;

            // Check transform.
            if (this.record_version != 1 && !this.transform_version) {
                throw new this.error_type({
                    type: "InvalidDocumentRef",
                    message: "Transform version must be set when record version is set.",
                    status: Status.bad_request,
                });
            }
        }

        /** Insert defaults from constructor param `def`. */
        private insert_defaults(data: Data) {
            if (data && this.def && !Array.isArray(this.def) && (typeof this.def === "object" || typeof this.def === "function")) {
                const set_defaults = (obj: Record<string, any>, defaults: Record<string, any>) => {
                    Object.keys(defaults).forEach((key) => {
                        if (obj[key] === undefined) {
                            obj[key] = defaults[key];
                        } else if (
                            typeof obj[key] === "object" && !Array.isArray(obj[key]) && obj[key] != null &&
                            typeof defaults[key] === "object" && !Array.isArray(defaults[key]) && defaults[key] != null
                        ) {
                            set_defaults(obj[key], defaults[key])
                        }
                    })
                }
                set_defaults(data, typeof this.def === "function" ? this.def() : this.def);
            }
        }

        /** 
         * On load callback.
         * @note this is not called when default data is used for an empty document.
         */
        private on_load(data: Data): Data {

            // Transform version.
            if (this.record_version && (data as any).__record_version !== 1) {
                data = this.transform_version!(this.record_version, data);
            }
            
            // Set defaults.
            this.insert_defaults(data);

            // Call on load.
            if (this._on_load) {
                data = this._on_load(data);
            }

            // Response.
            return data;
        }

        /** Get the computed default value, when defined. */
        as_default(): Data | undefined {
            if (this.def) {
                return typeof this.def === "function" ? this.def() : this.def;
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
         * Load a project from the database
         * @param def the default value, when the default value is an object then the attributes will be checked / inserted as well.
         */
        async load(): Promise<undefined | Data> {
            const data: Data = await this.col.load(
                this.query,
                { chunked: this.chunked },
            )
            if (!data) {
                if (this.def) {
                    return typeof this.def === "function" ? this.def() : this.def;
                }
                return;
            }
            return this.on_load(data);
        }

        /**
         * Load partial by projection.
         * @param fields The fields to load, nested fields should be separated by a dot (e.g. "a.b.c").
         */
        async load_partial(...fields: string[]): Promise<undefined | Partial<Data>> {
            const projection: Record<string, number> = {};
            for (const field of fields) {
                projection[field] = 1;
            }
            return await this.col.load(
                this.query,
                { projection },
            );
        }

        /** Save the project to the database */
        async save(data: Data) {
            (data as any).__record_version = this.record_version;
            return this.col.save(
                this.query,
                data,
                { chunked: this.chunked },
            );
        }

        /** Save partial to the database
         * @note automatically inserts the new values when the document is loaded. 
         */
        async save_partial(partial_data: Record<string, any>) {
            if (this.chunked) {
                throw new this.error_type({
                    type: "UnsupportedDocumentOperation",
                    message: "Chunked documents do not support partial updates.",
                    status: Status.bad_request,
                });
            }
            return this.col.save(
                this.query,
                partial_data,
                { chunked: this.chunked },
            );
        }

        /** Delete database record. */
        async delete(opts?: {
            bulk?: boolean
        }) {
            return this.col.delete(
                this.query,
                {
                    ...opts,
                    chunked: this.chunked,
                },
            );
        }
    }
}

// ---------------------------------------------------------
/**
 * The extended document object with more functionality.
 */

export class ExtendedDocument<
    Data extends Document.Data
> extends Document<Data> {

    /** Constructor
     * @param ref The document reference object.
     * @param data The initialized document data.
    */
    constructor(
        ref: Document.Ref<Data>,
        data: Data,
    ) {
        super(ref, data);
    }

    /** Wrapper function to insert an obj into another
      * @note this is not a deep copy.
      */
    private static __insert_obj(obj: Record<string, any>, partial: Record<string, any>): void {
        Object.keys(partial).forEach((key) => {
            const val = partial[key];
            // If both current value and new value are plain objects, recurse:
            if (
                val !== null &&
                typeof val === "object" &&
                !Array.isArray(val) &&
                obj[key] !== null &&
                typeof obj[key] === "object" &&
                !Array.isArray(obj[key])
            ) {
                ExtendedDocument.__insert_obj(obj[key], val as Record<string, any>);
            } else {
                // Otherwise overwrite (including arrays, primitives, null, etc.)
                obj[key] = val;
            }
        });
    };

    /** Save the data to the database */
    async save() {
        return this.ref.save(this.data);
    }

    /** Save partial to the database
      * @note automatically inserts the new values when the document is loaded. 
      */
    async save_partial(partial_data: Record<string, any>) {
        if (
            this.data && typeof partial_data === "object" && !Array.isArray(this.data) &&
            partial_data && typeof partial_data === "object" && !Array.isArray(partial_data)
        ) {
            ExtendedDocument.__insert_obj(this.data, partial_data);
        }
        return this.ref.save_partial(partial_data);
    }

    /** Delete database record. */
    async delete(opts?: {
        bulk?: boolean
    }) {
        return this.ref.delete(opts);
    }
}