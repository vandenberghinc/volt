import { ChildProcess } from "child_process";
import { MongoClient, Collection as MongoCollection } from 'mongodb';
import { vlib } from "./vinc.js";
import { ExternalError, InternalError } from "./utils.js";
interface BaseOptions {
    options?: Record<string, any>;
    commit_quorum?: any;
    forced?: boolean;
}
type IndexOptions = (BaseOptions & {
    key: string;
    keys?: never;
}) | (BaseOptions & {
    key?: never;
    keys: string[];
});
export declare class Collection {
    static chunk_size: number;
    static constructor_scheme: {
        name: string;
        uid_based: string;
        ttl: {
            type: string;
            default: null;
        };
        indexes: {
            type: string;
            default: never[];
            value_scheme: {
                type: string[];
                scheme: {
                    key: {
                        type: string;
                        required: (data: any) => boolean;
                    };
                    keys: {
                        type: string[];
                        required: (data: any) => boolean;
                        value_scheme: string;
                        postprocess: (keys: any) => any;
                    };
                    options: {
                        type: string;
                        required: boolean;
                    };
                    commit_quorom: {
                        type: string;
                        required: boolean;
                    };
                    forced: {
                        type: string;
                        default: boolean;
                    };
                };
                postprocess: (info: any) => any;
            };
        };
    };
    col: MongoCollection;
    name: string;
    uid_based: boolean;
    ttl: number | null;
    ttl_enabled: boolean;
    constructor(name: string, collection: MongoCollection, ttl?: number | null, // ttl in msec
    indexes?: IndexOptions[], uid_based?: boolean);
    private _process_doc;
    private _load_chunked;
    private _save_chunked;
    create_index({ key, keys, // following the IndexOptions "key" or "keys" must be defined in typescript but not in raw js.
    options, commit_quorum, forced }: IndexOptions): Promise<string>;
    find(query: Record<string, any>): Promise<any>;
    exists(path: string | Record<string, any>): Promise<boolean>;
    load(path: string | Record<string, any>, opts?: {
        default?: any;
        chunked?: boolean;
        attributes?: string[];
        projection?: Record<string, any>;
    } | null): Promise<any>;
    save(path: string | Record<string, any>, content: any, opts?: {
        chunked?: boolean;
        bulk?: boolean;
        set?: boolean;
    } | null): Promise<any>;
    /** Update many. */
    update_many(...args: Parameters<typeof this.col.updateMany>): Promise<any>;
    list(path: string | Record<string, any>, options?: {
        process?: boolean;
        projection?: Record<string, any>;
    }): Promise<any[]>;
    list_query(query?: Record<string, any>, options?: {
        process?: boolean;
        projection?: Record<string, any>;
    }): Promise<any[]>;
    list_all(query?: Record<string, any>, options?: {
        process?: boolean;
        projection?: Record<string, any>;
    }): Promise<any[]>;
    delete(path: string | Record<string, any>, opts?: {
        chunked?: boolean;
        bulk?: boolean;
    }): Promise<any>;
    delete_query(query?: Record<string, any>): Promise<any>;
    delete_all(path: string | Record<string, any>): Promise<void>;
    delete_many(query: Record<string, any>): Promise<void>;
    delete_collection(): Promise<void>;
    clean<T>(doc: T): T | null;
    /** Write bulk operations. */
    bulk_operations(operations?: any[]): Promise<any>;
}
export declare class UIDCollection {
    private _col;
    col: MongoCollection;
    constructor(name: string, collection: MongoCollection, indexes?: IndexOptions[], ttl?: number | null);
    create_index(args: IndexOptions): Promise<string>;
    find(uid?: string | null, query?: Record<string, any>): Promise<any>;
    exists(uid: string, path: string | Record<string, any>): Promise<boolean>;
    load(uid: string, path: string | Record<string, any>, opts?: {
        default?: any;
        chunked?: boolean;
        attributes?: string[];
        projection?: Record<string, any>;
    } | null): Promise<any>;
    save(uid: string, path: string | Record<string, any>, content: any, opts?: {
        chunked?: boolean;
        bulk?: boolean;
        set?: boolean;
    } | null): Promise<any>;
    /** Update many. */
    update_many(...args: Parameters<typeof this.col.updateMany>): Promise<any>;
    list(uid: string, path: string | Record<string, any>, options?: {
        process?: boolean;
        projection?: Record<string, any>;
    }): Promise<any[]>;
    list_query(query?: Record<string, any>, options?: {
        process?: boolean;
        projection?: Record<string, any>;
    }): Promise<any[]>;
    list_all(uid?: string | null, options?: {
        process?: boolean;
        projection?: Record<string, any>;
    }): Promise<any[]>;
    delete(uid: string, path: string | Record<string, any>, opts?: {
        chunked?: boolean;
        bulk?: boolean;
    }): Promise<any>;
    delete_query(query: Record<string, any>): Promise<any>;
    delete_all(uid: string, path?: string | Record<string, any> | null): Promise<void>;
    delete_many(query: Record<string, any>): Promise<void>;
    delete_collection(): Promise<void>;
    clean<T>(doc: T): T | null;
    /** Write bulk operations. */
    bulk_operations(operations?: any[]): Promise<any>;
}
export declare class Database {
    static constructor_scheme: {
        uri: {
            type: string;
            default: null;
        };
        source: {
            type: string;
            default: null;
        };
        config: {
            type: string;
            default: {};
        };
        start_args: {
            type: string;
            default: never[];
        };
        client: {
            type: string;
            default: {};
        };
        collections: {
            type: string;
            default: never[];
            value_scheme: {
                type: string[];
                preprocess: (info: string | Record<string, any>) => Record<string, any>;
                scheme: {
                    name: string;
                    ttl: {
                        type: string;
                        default: null;
                    };
                    indexes: {
                        type: string;
                        default: never[];
                        value_scheme: {
                            type: string[];
                            scheme: {
                                key: {
                                    type: string;
                                    required: (data: any) => boolean;
                                };
                                keys: {
                                    type: string[];
                                    required: (data: any) => boolean;
                                    value_scheme: string;
                                    postprocess: (keys: any) => any;
                                };
                                options: {
                                    type: string;
                                    required: boolean;
                                };
                                commit_quorom: {
                                    type: string;
                                    required: boolean;
                                };
                                forced: {
                                    type: string;
                                    default: boolean;
                                };
                            };
                            postprocess: (info: any) => any;
                        };
                    };
                };
            };
        };
        uid_collections: {
            type: string;
            default: never[];
            value_scheme: {
                type: string[];
                preprocess: (info: string | Record<string, any>) => Record<string, any>;
                scheme: {
                    name: string;
                    ttl: {
                        type: string;
                        default: null;
                    };
                    indexes: {
                        type: string;
                        default: never[];
                        value_scheme: {
                            type: string[];
                            scheme: {
                                key: {
                                    type: string;
                                    required: (data: any) => boolean;
                                };
                                keys: {
                                    type: string[];
                                    required: (data: any) => boolean;
                                    value_scheme: string;
                                    postprocess: (keys: any) => any;
                                };
                                options: {
                                    type: string;
                                    required: boolean;
                                };
                                commit_quorom: {
                                    type: string;
                                    required: boolean;
                                };
                                forced: {
                                    type: string;
                                    default: boolean;
                                };
                            };
                            postprocess: (info: any) => any;
                        };
                    };
                };
            };
        };
        preview: {
            type: string;
            default: boolean;
        };
        preview_ip_whitelist: {
            type: string;
            default: never[];
        };
        daemon: {
            type: string[];
            default: {};
        };
        _server: {
            type: string[];
        };
    };
    uri: string | null;
    client_opts: Record<string, any> | null;
    config: Record<string, any>;
    source: vlib.Path | undefined;
    start_args: string[];
    _collections: {
        name: string;
        ttl?: number | null;
        indexes?: string[] | IndexOptions[];
    }[];
    _uid_collections: {
        name: string;
        ttl?: number | null;
        indexes?: string[] | IndexOptions[];
    }[];
    server: any;
    client: MongoClient | null;
    collections: Record<string, Collection | UIDCollection>;
    proc?: ChildProcess;
    daemon?: any;
    db?: any;
    _listed_cols: any;
    constructor({ uri, source, config, start_args, client, collections, uid_collections, daemon, _server, }: {
        uri?: string | null;
        source?: string | null;
        config?: Record<string, any> | null;
        start_args?: string[];
        client?: Record<string, any> | null;
        collections?: {
            name: string;
            ttl?: number | null;
            indexes?: string[] | IndexOptions[];
        }[];
        uid_collections?: {
            name: string;
            ttl?: number | null;
            indexes?: string[] | IndexOptions[];
        }[];
        preview?: boolean;
        preview_ip_whitelist?: string[];
        daemon?: Record<string, any> | boolean;
        _server: any;
    });
    connect(): Promise<void>;
    initialize(): Promise<void>;
    close(): Promise<void>;
    create_collection(info: {
        name: string;
        indexes?: IndexOptions[];
        ttl?: number | null;
    } | string): Promise<Collection>;
    create_uid_collection(info: {
        name: string;
        indexes?: IndexOptions[];
        ttl?: number | null;
    } | string): Promise<UIDCollection>;
    get_collections(): Promise<string[]>;
}
type DocumentOptionsBase = Record<string, any> | any[];
/** A loaded uid document type. */
export type LoadedUIDDocument<DocumentOptions extends DocumentOptionsBase, DerivedDocument extends UIDDocument<DocumentOptions> = UIDDocument<DocumentOptions>> = Omit<DerivedDocument, "data"> & {
    data: DocumentOptions;
};
/** Objective document class.
 * @deprecated Use `Reference` instead.
*/
export declare class UIDDocument<DocumentOptions extends DocumentOptionsBase> {
    col: UIDCollection;
    data?: DocumentOptions;
    def?: DocumentOptions | (() => DocumentOptions);
    uid: string;
    path: string | Record<string, any>;
    chunked: boolean;
    error_type: typeof InternalError | typeof ExternalError;
    /** Constructor
      * @param def The default value, when the default value is an object then the attributes will be checked / inserted as well.
      */
    constructor({ col, uid, path, data, def, chunked, external_errors }: {
        col: UIDCollection;
        uid: string;
        path: string | Record<string, any>;
        data?: DocumentOptions;
        def?: DocumentOptions | (() => DocumentOptions);
        chunked?: boolean;
        external_errors?: boolean;
    });
    /** As database document. */
    document(): undefined | DocumentOptions;
    /** Create error options. */
    not_found_error(): {
        type: string;
        message: string;
        status: number;
    };
    not_loaded_error(): {
        type: string;
        message: string;
        status: number;
    };
    /** Set defaults from constructor param `def`. */
    set_defaults(): void;
    /** On load callback.
      * @note this is not called when default data is used for an empty document.
      * @warning the user MUST always call this function after manually loading the document.
      */
    on_load(): any;
    /** Assert load. */
    assert_load(): Promise<void>;
    /** Assert load */
    assert_loaded(): asserts this is {
        data: DocumentOptions;
    };
    /** Check if a project exists.
      * @note this does not load the full document.
      */
    exists(): Promise<boolean>;
    /**
     * Load a project from the database
     * @param def the default value, when the default value is an object then the attributes will be checked / inserted as well.
     */
    load(): Promise<DocumentOptions>;
    try_load(): Promise<undefined | DocumentOptions>;
    /** Load partial by projection.
      * @note This automatically inserts the new values when the document is loaded in this specific scenario it also calls the on load callback.
      * @param fields The fields to load, nested fields should be separated by a dot (e.g. "a.b.c").
      */
    load_partial(...fields: string[]): Promise<Partial<DocumentOptions>>;
    try_load_partial(...fields: string[]): Promise<undefined | Partial<DocumentOptions>>;
    /** Save the project to the database */
    save(): Promise<void>;
    /** Save partial to the database
      * @note automatically inserts the new values when the document is loaded.
      */
    save_partial(partial_data: Partial<DocumentOptions>): Promise<void>;
    /** Delete database record. */
    delete(opts?: {
        bulk?: boolean;
    }): Promise<any>;
    /** Wrapper function to insert an obj into another
      * @note this is not a deep copy.
      */
    private static __insert_obj;
}
/**
 * Document reference object. Its objectively an document without holding its data.
 * Its more efficient to store that separately and use this to perform operations on it.
 */
export declare class DocumentRef<Document extends Record<string, any> | any[]> {
    col: UIDCollection | Collection;
    uid?: string;
    path: string | Record<string, any>;
    def?: Document | (() => Document);
    chunked: boolean;
    record_version?: number;
    error_type: typeof InternalError | typeof ExternalError;
    transform_version?: (version: number, document: any) => Document;
    _on_load?: (data: Document) => Document;
    /** Constructor
     * @param col The collection created by the server.
     * @param uid The uid of the document, this is only required when the collection is a UIDCollection.
     * @param path The path of the document, this can be a string or an object query.
     * @param def The default value, when the default value is an object then the attributes will be checked / inserted as well.
     * @param chunked If true then the document is stored in chunks.
     * @param external_errors If true then the errors are thrown as external errors, instead of internal errors.
     * @param record_version The record type version for the database.
     *        This can be used in combination with parameter `transform_version` to ...
     *        Transform older record versions to the current version.
     * @param transform_version The function to transform an older document version to the current version.
     * @param on_load The function to call when the document is loaded.
    */
    constructor({ col, uid, path, def, chunked, external_errors, record_version, transform_version, on_load, }: {
        col: UIDCollection | Collection;
        uid?: string;
        path: string | Record<string, any>;
        data?: Document;
        def?: Document | (() => Document);
        chunked?: boolean;
        external_errors?: boolean;
        record_version?: number;
        transform_version?: (version: number, document: any) => Document;
        on_load?: (data: Document) => Document;
    });
    /** Set defaults from constructor param `def`. */
    set_defaults(data: Document): void;
    /** Get the computed default value, when defined. */
    as_default(): Document | undefined;
    /**
     * On load callback.
      * @note this is not called when default data is used for an empty document.
      */
    private on_load;
    /** Check if a project exists.
      * @note this does not load the full document.
      */
    exists(): Promise<boolean>;
    /**
     * Load a project from the database
     * @param def the default value, when the default value is an object then the attributes will be checked / inserted as well.
     */
    load(): Promise<undefined | Document>;
    /**
     * Load partial by projection.
     * @param fields The fields to load, nested fields should be separated by a dot (e.g. "a.b.c").
     */
    load_partial(...fields: string[]): Promise<undefined | Partial<Document>>;
    /** Save the project to the database */
    save(data: Document): Promise<any>;
    /** Save partial to the database
      * @note automatically inserts the new values when the document is loaded.
      */
    save_partial(partial_data: Record<string, any>): Promise<any>;
    /** Delete database record. */
    delete(opts?: {
        bulk?: boolean;
    }): Promise<any>;
}
export {};
