/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
import * as https from "https";
import * as vlib from "@vandenberghinc/vlib";
import type { Server } from "./server.js";
export interface RateLimitGroup {
    /** The rate limit group name. */
    group?: string | null;
    /** The maximum requests per rate limit interval. */
    limit?: number | null;
    /** The rate limit interval in seconds. */
    interval?: number | null;
}
export interface RateLimitData {
    /** The rate limit group name. */
    group: string;
    /** The maximum requests per rate limit interval. */
    limit: number;
    /** The rate limit interval in seconds. */
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
 *
 * @nav Rate Limit
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
    function add({ group, limit, interval }: RateLimitGroup): RateLimitData;
    /**
     * Normalize an IPv4 or IPv6 address into a unique, canonical string suitable for rate limiting keys.
     *
     * Behavior:
     * - Trims surrounding whitespace.
     * - If bracketed (`[addr]` or `[addr]:port`), removes brackets (and any trailing port).
     * - Removes IPv6 zone/scope IDs (`%...`), e.g. `fe80::1%eth0` → `fe80::1`.
     * - IPv4: returns dotted-decimal without leading zeros (e.g. `001.002.003.004` → `1.2.3.4`).
     * - IPv6: emits RFC 5952 canonical form (lowercase hex, no leading zeros, single longest `::`).
     * - IPv4-mapped IPv6 (`::ffff:0:0/96`) is normalized to plain IPv4 (e.g. `::ffff:203.0.113.7` → `203.0.113.7`).
     *
     * Notes:
     * - This function expects a host/address string (not a full URL). It tolerates `[v6]:port`
     *   but intentionally does **not** accept non-bracketed `ipv4:port`.
     *
     * @param ip The input IPv4/IPv6 address.
     * @returns Canonical address string.
     * @throws {Error} If the input is not a valid IPv4 or IPv6 address.
     *
     * @docs
     */
    function normalize_ip(ip: string): string;
}
/** Nested types for the {@link RateLimitServer}. */
export declare namespace RateLimitServer {
    /**
     * Constructor options.
     * @docs
     */
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
 */
export declare class RateLimitServer {
    static default_port: number;
    private ip;
    private port;
    private https_config;
    private server;
    private limits;
    ws?: vlib.websocket.Server;
    private clear_caches_interval?;
    constructor({ port, ip, https, _server, }: RateLimitServer.Opts & {
        _server: Server;
    });
    /** Assert the server is running. */
    private assert_connected;
    start(): Promise<void>;
    stop(): Promise<void>;
    limit(ip: string, groups?: RateLimitGroup[]): Promise<number | null>;
    reset(group: string): Promise<void>;
    reset_all(): Promise<void>;
}
/** Nested types for the {@link RateLimitClient}. */
export declare namespace RateLimitClient {
    /**
     * Constructor options.
     * @docs
     */
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
 */
export declare class RateLimitClient {
    private ip;
    private port;
    private https;
    private url?;
    private server;
    ws?: vlib.websocket.Client;
    constructor({ ip, port, https, url, _server, }: RateLimitClient.Opts & {
        _server: Server;
    });
    /** Assert the client is started & connected. */
    private assert_connected;
    start(): Promise<void>;
    stop(): Promise<void>;
    limit(ip: string, groups?: RateLimitGroup[]): Promise<number | null>;
    reset(group: string): Promise<void>;
    reset_all(): Promise<void>;
}
export default RateLimits;
