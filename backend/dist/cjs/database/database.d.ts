/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh.
 */
import { Db, MongoClient } from 'mongodb';
import { Collection } from "./collection.js";
import type { Server } from "../server.js";
import { Document } from "./document.js";
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
    uri: string;
    client_opts?: Record<string, any>;
    server: Server;
    client?: MongoClient;
    _db?: Db;
    collections: Map<string, Collection<any>>;
    private _connect_promise?;
    _listed_cols: any;
    constructor({ uri, client, _server, }: {
        uri: string;
        client?: Record<string, any>;
        _server: Server;
    });
    db(): Promise<Db>;
    connected: boolean;
    connect(): Promise<void>;
    /** Initialize. */
    initialize(): Promise<void>;
    /** Ensure connection. */
    ensure_connection(): Promise<void>;
    close(): Promise<void>;
    /**
     * {Create Collection}
     * Initialize database collection.
     * @note When called multiple times with the same name, it will return the same cached collection.
     * @param info.unique If true, an error will be thrown if the collection already exists.
     *                    By default it is false.
     */
    collection<Data extends Document.Data = any>(info: string | (Omit<ConstructorParameters<typeof Collection>[0], "db"> & {
        unique?: boolean;
    })): Promise<Collection<Data>>;
}
