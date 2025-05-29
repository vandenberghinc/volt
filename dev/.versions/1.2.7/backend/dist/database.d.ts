export = Database;
declare class Database {
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
                preprocess: (info: any) => any;
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
                preprocess: (info: any) => any;
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
        _server: string;
    };
    constructor({ uri, source, config, start_args, client, collections, uid_collections, preview, preview_ip_whitelist, daemon, _server, }: {
        uri?: null | undefined;
        source?: null | undefined;
        config?: null | undefined;
        start_args?: never[] | undefined;
        client?: null | undefined;
        collections?: never[] | undefined;
        uid_collections?: never[] | undefined;
        preview?: boolean | undefined;
        preview_ip_whitelist?: never[] | undefined;
        daemon?: {} | undefined;
        _server: any;
    }, ...args: any[]);
    uri: string | null;
    preview: boolean;
    preview_ip_whitelist: any[];
    client_opts: any;
    config: {} | null;
    source: any;
    start_args: any[];
    _collections: any[];
    _uid_collections: any[];
    server: any;
    client: MongoClient | null;
    collections: {};
    daemon: any;
    _initialize_db_preview(): void;
    connect(): Promise<void>;
    db: import("mongodb").Db | undefined;
    initialize(): Promise<void>;
    proc: libproc.ChildProcessWithoutNullStreams | undefined;
    close(): Promise<void>;
    create_collection({ name, indexes, ttl }: {
        name: any;
        indexes?: never[] | undefined;
        ttl?: null | undefined;
    }, ...args: any[]): Collection;
    create_uid_collection({ name, indexes, ttl }: {
        name: any;
        indexes?: never[] | undefined;
        ttl?: null | undefined;
    }, ...args: any[]): UIDCollection;
    get_collections(): Promise<any>;
}
import { MongoClient } from "mongodb";
import libproc = require("child_process");
declare class Collection {
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
    constructor(name: any, collection: any, ttl?: null, indexes?: any[], uid_based?: boolean);
    name: any;
    col: any;
    uid_based: boolean;
    ttl: any;
    ttl_enabled: boolean;
    _process_doc(doc: any): any;
    _load_chunked(path: any, find_opts: any): Promise<libbson.Document | null>;
    _save_chunked(path: any, content: any): Promise<void>;
    create_index({ keys, options, commit_quorum, forced }: {
        keys: any;
        options?: null | undefined;
        commit_quorum?: null | undefined;
        forced?: boolean | undefined;
    }): Promise<any>;
    find(query: any): Promise<any>;
    exists(path: any): Promise<boolean>;
    load(path: any, opts?: null): Promise<any>;
    save(path: any, content: any, opts?: null): Promise<any>;
    list(path: any, options?: {}): Promise<any>;
    list_query(query?: {}, options?: {}): Promise<any>;
    list_all(query?: {}, options?: {}): Promise<any>;
    delete(path: any, opts?: null): Promise<{
        deleteMany: {
            filter: any;
        };
        deleteOne?: undefined;
    } | {
        deleteOne: {
            filter: any;
        };
        deleteMany?: undefined;
    } | undefined>;
    delete_query(query?: {}): Promise<any>;
    delete_all(path: any): Promise<void>;
    delete_recursive(path: any, uid?: null): Promise<any>;
    delete_collection(): Promise<void>;
    clean(doc: any): any;
    bulk_operations(operations?: any[]): Promise<any>;
}
declare class UIDCollection {
    constructor(name: any, collection: any, indexes: any[] | undefined, ttl: any);
    _col: Collection;
    col: any;
    create_index({ keys, options, commit_quorum }: {
        keys: any;
        options?: null | undefined;
        commit_quorum?: null | undefined;
    }): Promise<any>;
    find(uid?: null, query?: {}): Promise<any>;
    exists(uid: any, path: any): Promise<boolean>;
    load(uid: any, path: any, opts?: null): Promise<any>;
    save(uid: any, path: any, content: any, opts?: null): Promise<any>;
    list(uid: any, path: any, options?: {}): Promise<any>;
    list_query(query?: {}, options?: {}): Promise<any>;
    list_all(uid?: null, options?: {}): Promise<any>;
    delete(uid: any, path: any, opts?: null): Promise<{
        deleteMany: {
            filter: any;
        };
        deleteOne?: undefined;
    } | {
        deleteOne: {
            filter: any;
        };
        deleteMany?: undefined;
    } | undefined>;
    delete_query(query: any): Promise<any>;
    delete_all(uid: any, path?: null): Promise<void>;
    delete_recursive(uid: any, path: any): Promise<any>;
    delete_collection(): Promise<void>;
    clean(doc: any): any;
    bulk_operations(operations?: any[]): Promise<any>;
}
import libbson = require("bson");
