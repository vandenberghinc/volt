/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh.
 */
import { AggregationCursor, Collection as MongoCollection, Document as MongoDoc } from 'mongodb';
import { Document } from "./document.js";
import type { Database } from "./database.js";
/** Index options. */
interface BaseOptions {
    options?: Record<string, any>;
    forced?: boolean;
}
export type IndexOptions = (BaseOptions & {
    key: string;
    keys?: never;
}) | (BaseOptions & {
    key?: never;
    keys: string[];
});
export type Query = string | Record<string, any>;
/**
 * A wrapper class for the MongoDB collection.
 *
 * @note Any document type is suported, including primitives, arrays and objects.
 *
 * @example
 * const col1 = server.db.collection("col1");
 * const col2 = server.db.collection({
 *    name: "col2",
 *    indexes: ["uid", "name"],
 *    ttl: 1000 * 60 * 60 * 24, // 1 day
 * });
 */
export declare class Collection<Data extends Document.Data = any> {
    static chunk_size: number;
    static constructor_scheme: {
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
    /** Collection name */
    name: string;
    /** Time to live in msec for all documents. */
    ttl?: number;
    ttl_enabled: boolean;
    /** The column. */
    _col?: MongoCollection;
    /**
     * The Database parent class, used to initialize the column on demand.
     * So the user can define collections at root level before the database is initialized. */
    db: Database;
    /** Is initialized. */
    initialized: boolean;
    /** The temporary indexes passed to the constructor for the init method. */
    private _init_indexes?;
    /** Constructor. */
    constructor(opts: {
        name: string;
        col?: MongoCollection;
        ttl?: number;
        indexes?: (string | IndexOptions)[];
        db: Database;
    });
    /** Initialize. */
    init(): Promise<this>;
    assert_init(): asserts this is {
        _col: MongoCollection;
    };
    /** Setup the ttl configuration. */
    _setup_ttl(): Promise<void>;
    private _process_doc;
    private _load_chunked;
    private _save_chunked;
    col(): Promise<NonNullable<MongoCollection>>;
    /** Create a reference. */
    ref<Data extends Document.Data = any>(query: Query, opts?: Omit<ConstructorParameters<typeof Document.Ref<Data>>[1], "col">): Document.Ref<Data>;
    reference<Data extends Document.Data = any>(query: Query, opts?: Omit<ConstructorParameters<typeof Document.Ref<Data>>[1], "col">): Document.Ref<Data>;
    /** Has index. */
    has_index(index: string): Promise<boolean>;
    create_index(opts: string | IndexOptions): Promise<string>;
    find(query: Record<string, any>): Promise<Data | undefined>;
    find_many(query: Record<string, any>): Promise<Data[] | undefined>;
    exists(path: Query): Promise<boolean>;
    load(path: Query, opts?: {
        default?: any;
        chunked?: boolean;
        attributes?: string[];
        projection?: Record<string, any>;
    } | null): Promise<Data | undefined>;
    save(path: Query, content: any, opts?: {
        chunked?: boolean;
        bulk?: boolean;
        set?: boolean;
    } | null): Promise<any>;
    /** Update many. */
    update_many(...args: Parameters<typeof MongoCollection.prototype.updateMany>): Promise<any>;
    list(path: Query, options?: {
        process?: boolean;
        projection?: Record<string, any>;
    }): Promise<Data[]>;
    list_query(query?: Record<string, any>, options?: {
        process?: boolean;
        projection?: Record<string, any>;
    }): Promise<Data[]>;
    list_all(query?: Record<string, any>, options?: {
        process?: boolean;
        projection?: Record<string, any>;
    }): Promise<Data[]>;
    delete(path: Query, opts?: {
        chunked?: boolean;
        bulk?: boolean;
    }): Promise<any>;
    delete_query(query?: Record<string, any>): Promise<void>;
    delete_all(path: Query): Promise<void>;
    delete_many(query: Record<string, any>): Promise<void>;
    delete_collection(): Promise<void>;
    clean<T extends Partial<Data> = Data>(doc: T): T | undefined;
    /** Write bulk operations. */
    bulk_operations(operations?: any[]): Promise<any>;
    /** Aggregate */
    aggregate<T extends Partial<Data> = Data>(pipeline: MongoDoc[], opts: {
        cursor?: false;
        clean?: boolean;
    }): Promise<T[]>;
    aggregate<T extends Partial<Data> = Data>(pipeline: MongoDoc[], opts?: {
        cursor: true;
        clean?: boolean;
    }): Promise<AggregationCursor<T>>;
}
export {};
