/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Imports.

import * as vlib from "@vandenberghinc/vlib";
import { Utils } from "./utils.js";
import { Collection } from "./database/collection.js";
import { logger } from "./logger.js";

// ---------------------------------------------------------
// Types

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

// ---------------------------------------------------------
// Rate limit groups.

/*  @docs:
    @nav: Backend
    @chapter: Rate Limit
    @title: Rate Limit Groups
    @desc:
        The rate limit groups for the endpoint.

        A group can either be registered through this class or by defining the rate limit group on an endpoint using `Endpoint.rate_limit`.

        This class will be accessable under `Server` attribute `rate_limits`.
 */
export const RateLimits = {
    groups: new Map<string, RateLimitData>(),

    /*  @docs:
        @title: Add group
        @desc:
            Add a rate limit group.
        @param:
            @name: group
            @description: The rate limit group.
            @type: string
            @default: "global"
        @param:
            @name: limit
            @description: The maximum requests per rate limit interval.
            @type: number
            @default: 50
        @param:
            @name: interval
            @description: The rate limit interval in seconds.
            @type: number
            @default: 60
     */
    add({
        group = null,
        limit = null,
        interval = null,
    }: RateLimitGroup): RateLimitData {
        const settings: RateLimitData = this.groups.has(group!) 
            ? this.groups.get(group!)! 
            : { group: "", limit: 0, interval: 0 };
        
        settings.group = group!;
        if (limit) {
            settings.limit = limit;
        } else if (!settings.limit) {
            settings.limit = 50;
        }
        if (interval) {
            settings.interval = interval;
        } else if (!settings.interval) {
            settings.interval = 60;
        }
        this.groups.set(group!, settings)
        return settings;
    }
}

// ---------------------------------------------------------
// Server.

/*  @docs:
    @nav: Backend
    @chapter: Rate Limit
    @title: Rate Limit Server
    @desc: 
        The rate limit websocket class (server).

        Rate limiting is handled automatically when the endpoints has it enabled.
    @param:
        @name: ip
        @desc: The rate limit server ip. By default localhost will be used.
        @type: null, string
    @param:
        @name: port
        @desc: The rate limit server port. The default port is `51234`.
        @def: 51234
        @type: number
    @param:
        @name: https
        @desc: To enable https on the server you must define a `https.createServer` configuration.
        @type: boolean
    @param:
        @name: _server
        @ignore: true
 */
export class RateLimitServer {
    // Static attributes.
    static default_port: number = 51234;

    // Instance attributes
    private ip: string | null;
    private port: number;
    private https_config: any;
    private server: { _sys_db: Collection };
    private limits: Map<string, Map<string, RateLimitCacheData>>;
    private ws?: any;
    private clear_caches_interval?: NodeJS.Timeout;

    constructor({
        port = RateLimitServer.default_port,
        ip = null,
        https = null,
        _server,
    }: {
        port?: number,
        ip?: string | null,
        https?: any | null,
        _server: { _sys_db: Collection },
    }) {
        // Checks.
        vlib.Scheme.verify({
            object: arguments[0], 
            check_unknown: true, 
            scheme: {
                port: {type: "number", default: RateLimitServer.default_port},
                ip: {type: "string", default: null},
                https: {type: "https", default: null},
                _server: "object",
            }
        });

        // Arguments.
        this.ip = ip;
        this.port = port;
        this.https_config = https;
        this.server = _server;

        // Attributes.
        this.limits = new Map();
    }

    // Start.
    async start(): Promise<void> {
        // Load/generate api key.
        const data = await this.server._sys_db.load("rate_limit", {
            default: {
                api_key: null,
            }
        });
        if (data.api_key == null) {
            data.api_key = vlib.String.random(32);
            await this.server._sys_db.save("rate_limit", data);
        }

        // Initialize server.
        this.ws = new vlib.websocket.Server({
            ip: this.ip,
            port: this.port,
            https: this.https_config,
            api_keys: [data.api_key],
            rate_limit: {
                limit: 100,
                interval: 60,
            },
        });

        // Listen event.
        this.ws.on_event("listen", (address: string) => {
            logger.log(0, `Running on ${address}.`);
        });

        // Error event.
        this.ws.on_event('error', (stream: any, e: Error) => {
            logger.error(e);
        });

        // Create limit command.
        this.ws.on("limit", async (stream: any, id: string, data: {ip: string, groups: RateLimitGroup[]}) => {
            try {
                this.ws.send({
                    stream, 
                    id, 
                    data: {response: await this.limit(data.ip, data.groups)}
                });
            } catch (e: any) {
                logger.error(e);
                this.ws.send({ stream, id, data: { error: e.message } });
            }
        });

        // Create command: reset & reset_all.
        this.ws.on("reset", async (stream: any, id: string, data: {group: string}) => {
            try {
                await this.reset(data.group);
                this.ws.send({stream, id, data: {error: undefined}});
            } catch (e: any) {
                logger.error(e);
                this.ws.send({ stream, id, data: {error: e.message} });
            }
        });
        this.ws.on("reset_all", async (stream: any, id: string) => {
            try {
                await this.reset_all();
                this.ws.send({ stream, id, data: { error: undefined } });
            } catch (e: any) {
                logger.error(e);
                this.ws.send({ stream, id, data: { error: e.message } });
            }
        });

        // Start.
        await this.ws.start();

        // Clear caches once every 1h.
        this.clear_caches_interval = setInterval(() => {
            const remove_after = Date.now() + (3600 * 1000);
            for (const [group, map] of this.limits.entries()) {
                for (const [ip, data] of map.entries()) {
                    if (remove_after > data.expiration) {
                        map.delete(ip);
                    }
                }
            }
        }, 3600 * 1000);
    }

    // Stop.
    async stop(): Promise<void> {
        logger.log(0, "Stopping the rate limit server.");
        if (this.clear_caches_interval) {
            clearInterval(this.clear_caches_interval);
        }
        if (this.ws) {
            await this.ws.stop();
            this.ws = undefined;
        }
    }

    // Returns null when rate limit is approved, and returns the unix timestamp (as str) of reset when rate limit has been exceeded.
    async limit(
        ip: string, 
        groups: RateLimitGroup[] = [{group: null, limit: null, interval: null}]
    ): Promise<number | null> {
        return groups.iterate((rate_limit) => {
            for (let attempts = 2; attempts >= 0; --attempts) {
                try {
                    // Get endpoint limits.
                    let limits: Map<string, RateLimitCacheData>;
                    if (this.limits.has(rate_limit.group!)) {
                        limits = this.limits.get(rate_limit.group!)!;
                    } else {
                        limits = new Map();
                        this.limits.set(rate_limit.group!, limits);
                    }

                    // Limit.
                    const now = Date.now();
                    if (limits.has(ip)) {
                        let data = limits.get(ip)!;
                        if (now >= data.expiration) {
                            data = {
                                count: 0,
                                expiration: now + rate_limit.interval! * 1000,
                            };
                        }
                        ++data.count;
                        if (data.count > rate_limit.limit!) {
                            return data.expiration as number;
                        }
                        limits.set(ip, data);
                    } else {
                        limits.set(ip, {
                            count: 1,
                            expiration: now + rate_limit.interval! * 1000,
                        });
                    }
                    break;
                } catch (e) {
                    if (attempts === 0) {
                        throw e;
                    }
                }
            }
        }) ?? null;
    }

    // Reset a group limit.
    async reset(group: string): Promise<void> {
        for (const [key, group_limits] of this.limits.entries()) {
            if (key === group) {
                for (const cache of group_limits.values()) { cache.count = 0; }
            }
        }
    }

    // Reset all rate limit groups.
    async reset_all(): Promise<void> {
        for (const group_limits of this.limits.values()) {
            for (const cache of group_limits.values()) { cache.count = 0; }
        }
    }
}

// ---------------------------------------------------------
// Client.

/*  @docs:
    @nav: Backend
    @chapter: Rate Limit
    @title: Rate Limit Client
    @desc: 
        The secondary rate limit class (client).

        Rate limiting is handled automatically when the endpoints has it enabled.
    @param:
        @name: ip
        @desc: The rate limit server ip. By default localhost will be used.
        @type: null, string
    @param:
        @name: port
        @desc: The rate limit server port. The default port is `51234`.
        @def: 51234
        @type: number
    @param:
        @name: https
        @desc: A boolean indicating if the rate limit server has https enabled.
        @type: boolean
    @param:
        @name: url
        @desc: The websocket url of the server. If defined this takes precedence over parameters `ip` and `port`.
        @type: null, string
    @param:
        @name: _server
        @ignore: true
 */
export class RateLimitClient {
    private ip: string;
    private port: number;
    private https: boolean;
    private url: string | null;
    private server: any;
    private ws?: any;

    constructor({
        ip = null,
        port = RateLimitServer.default_port,
        https = false,
        url = null,
        _server,
    }: {
        ip?: string | null,
        port?: number,
        https?: boolean,
        url?: string | null,
        _server: any,
    }) {
        // Checks.
        vlib.Scheme.verify({
            object: arguments[0], 
            check_unknown: true, 
            scheme: {
                ip: {type: "string", default: null},
                port: {type: "number", default: RateLimitServer.default_port},
                https: {type: "object", default: null},
                url: {type: "string", default: null},
                _server: "object",
            }
        });

        // Arguments.
        this.ip = ip ? ip : "localhost";
        this.port = port;
        this.https = https;
        this.url = url;
        this.server = _server;
    }

    // Start.
    async start(): Promise<void> {
        // Create websocket.
        const data = await this.server._sys_db.load("rate_limit", {
            default: {
                api_key: null,
            }
        });
        if (data.api_key == null) {
            throw new Error("No rate limit api key has been generated yet.");
        }

        // Initialize server.
        this.ws = new vlib.websocket.Client({
            url: this.url ? this.url : `${this.https ? "wss" : "ws"}://${this.ip}:${this.port}`,
            api_key: data.api_key,
            reconnect: {
                interval: 10,
                max_interval: 30000,
            },
            ping: true,
        })

        // Error event.
        this.ws.on_event('error', (e: Error) => {
            logger.error(e);
        });

        // Reconnect event.
        this.ws.on_event('reconnect', (e: Error) => {
            logger.log(0, 'Attempting to reconnect with the server.');
        });

        // Close event.
        this.ws.on_event('close', () => {
            logger.log(0, 'Websocket closed after exhausting all reconnect attempts.');
            process.exit(1); // stop the thread.
        });

        // Connect.
        await this.ws.connect();
    }

    // Stop.
    async stop(): Promise<void> {
        logger.log(0, "Stopping the rate limit client.");
        if (this.ws) {
            await this.ws.disconnect();
            this.ws = undefined;
        }
    }

    // Limit function.
    // Returns null when rate limit is approved, and returns the unix timestamp (as str) of reset when rate limit has been exceeded.
    async limit(
        ip: string, 
        groups: RateLimitGroup[] = [{group: null, limit: null, interval: null}]
    ): Promise<number | null> {
        const { data } = await this.ws.request({
            command: "limit", 
            timeout: 10000, 
            data: { ip, groups }
        });
        if (data.error) { throw new Error(data.error); }
        return data.response;
    }

    // Reset a group limit.
    async reset(group: string): Promise<void> {
        const { data } = await this.ws.request({
            command: "reset",
            timeout: 10000,
            data: { group }
        });
        if (data.error) { throw new Error(data.error); }
    }

    // Reset all rate limit groups.
    async reset_all(): Promise<void> {
        const { data } = await this.ws.request({
            command: "reset_all",
            timeout: 10000,
        });
        if (data.error) { throw new Error(data.error); }
    }
}

// ---------------------------------------------------------
// Exports.

export default RateLimits;