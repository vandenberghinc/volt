import { Collection } from "./database/collection.js";
export interface RateLimitGroup {
    group?: string | null;
    limit?: number | null;
    interval?: number | null;
}
export interface RateLimitData {
    group: string;
    limit: number;
    interval: number;
}
export interface RateLimitCacheData {
    count: number;
    expiration: number;
}
export declare const RateLimits: {
    groups: Map<string, RateLimitData>;
    add({ group, limit, interval, }: RateLimitGroup): RateLimitData;
};
export declare class RateLimitServer {
    static default_port: number;
    private ip;
    private port;
    private https_config;
    private server;
    private limits;
    private ws?;
    private clear_caches_interval?;
    constructor({ port, ip, https, _server, }: {
        port?: number;
        ip?: string | null;
        https?: any | null;
        _server: {
            _sys_db: Collection;
        };
    });
    start(): Promise<void>;
    stop(): Promise<void>;
    limit(ip: string, groups?: RateLimitGroup[]): Promise<number | null>;
    reset(group: string): Promise<void>;
    reset_all(): Promise<void>;
}
export declare class RateLimitClient {
    private ip;
    private port;
    private https;
    private url;
    private server;
    private ws?;
    constructor({ ip, port, https, url, _server, }: {
        ip?: string | null;
        port?: number;
        https?: boolean;
        url?: string | null;
        _server: any;
    });
    start(): Promise<void>;
    stop(): Promise<void>;
    limit(ip: string, groups?: RateLimitGroup[]): Promise<number | null>;
    reset(group: string): Promise<void>;
    reset_all(): Promise<void>;
}
export default RateLimits;
