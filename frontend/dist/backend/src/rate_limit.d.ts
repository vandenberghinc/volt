import * as https from "https";
import type { Server } from "./server.js";
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
/**
 * The rate limit groups for the endpoint.
 *
 * A group can either be registered through this class or by defining the rate limit group on an endpoint using `Endpoint.rate_limit`.
 *
 * This class will be accessable under `Server` attribute `rate_limits`.
 * @nav Backend/Rate Limit
 * @docs
 */
export declare namespace RateLimits {
    const groups: Map<string, RateLimitData>;
    /**
     * Add a rate limit group.
     * @param group  The rate limit group.
     * @param limit The maximum requests per rate limit interval, defaults to 50.
     * @param interval The rate limit interval in seconds, defaults to 60.
     * @docs
     */
    function add({ 
    /** The rate limit group name. */
    group, 
    /** The maximum requests per rate limit interval. */
    limit, 
    /** The rate limit interval in seconds. */
    interval, }: RateLimitGroup): RateLimitData;
}
/** Nested types for the {@link RateLimitServer}. */
export declare namespace RateLimitServer {
    /** Constructor options. */
    interface Opts {
        /** The port to which the rate limiting server will bind. The default is `51234`. */
        port?: number;
        /** The IP address to which the rate limiting server will bind. By default, it runs on localhost only. */
        ip?: string;
        /** Enable the https attribute to run on https. */
        https?: https.ServerOptions;
    }
}
/**
 * The rate limit websocket class (server).
 * Rate limiting is handled automatically when the endpoints has it enabled.
 *
 * @nav Backend/Rate Limit
 */
export declare class RateLimitServer {
    static default_port: number;
    private ip;
    private port;
    private https_config;
    private server;
    private limits;
    private ws?;
    private clear_caches_interval?;
    constructor({ port, ip, https, _server, }: RateLimitServer.Opts & {
        _server: Server;
    });
    start(): Promise<void>;
    stop(): Promise<void>;
    limit(ip: string, groups?: RateLimitGroup[]): Promise<number | null>;
    reset(group: string): Promise<void>;
    reset_all(): Promise<void>;
}
/** Nested types for the {@link RateLimitClient}. */
export declare namespace RateLimitClient {
    /** Constructor options. */
    interface Opts {
        /** The port to which the rate limiting server will bind. The default is `51234`. */
        port?: number;
        /** The IP address to which the rate limiting server will bind. By default, it runs on localhost only. */
        ip?: string;
        /** A boolean flag indicating if the server runs on HTTPS. */
        https?: boolean;
        /** The websocket URL of the server. If defined this takes precedence over parameters `ip` and `port`. */
        url?: string;
    }
}
/**
 * The secondary rate limit class (client).
 *
 * Rate limiting is handled automatically when the endpoints has it enabled.
 *
 * @nav Backend/Rate Limit
 */
export declare class RateLimitClient {
    private ip;
    private port;
    private https;
    private url?;
    private server;
    private ws?;
    constructor({ ip, port, https, url, _server, }: RateLimitClient.Opts & {
        _server: Server;
    });
    start(): Promise<void>;
    stop(): Promise<void>;
    limit(ip: string, groups?: RateLimitGroup[]): Promise<number | null>;
    reset(group: string): Promise<void>;
    reset_all(): Promise<void>;
}
export default RateLimits;
