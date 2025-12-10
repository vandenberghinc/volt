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
        /** The database name, if not provided it will the database name from the connection URI will be used. */
        database?: string;
        /** The additional cient options. */
        client?: mongodb.MongoClientOptions;
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
        database_name: {
            type: string;
            default: undefined;
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
    database_name: undefined | string;
    client_opts?: mongodb.MongoClientOptions;
    server: Server;
    client?: MongoClient;
    _db?: Db;
    collections: Map<string, Collection<any>>;
    _listed_cols: any;
    constructor({ uri, database, client, _server, }: Database.Opts & {
        _server: Server;
    });
    db(): Promise<Db>;
    connected: boolean;
    private connect_promise?;
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
     *                    Defauls to `true`.
     */
    collection<Data extends mongodb.Document = mongodb.Document>(info: string | (Omit<Collection.Opts<Data>, "db"> & {
        unique?: boolean;
    })): Collection<Data>;
}
