/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh.
 */
import { Db, MongoClient } from 'mongodb';
import * as mongodb from "mongodb";
import { Collection } from "./collection.js";
import type { Server } from "../server.js";
export declare namespace Database {
    /** The database constructor options. */
    interface Opts {
        /** The database URI. */
        uri: string;
        /** The additional cient options. */
        client?: Record<string, any>;
    }
}
/**
 * The MongoDB database class, accessable under `Server.db`.
 * @docs
 * @nav Backend/Database
*/
export declare class Database {
    static constructor_scheme: {
        uri: {
            type: string;
            default: null;
        };
        client: {
            type: string;
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
    constructor({ uri, client, _server, }: Database.Opts & {
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
    collection<Data extends mongodb.Document = mongodb.Document>(info: string | (Omit<Collection.Opts<Data>, "db"> & {
        unique?: boolean;
    })): Collection<Data>;
}
