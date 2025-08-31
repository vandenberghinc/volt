/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */
import * as vlib from "@vandenberghinc/vlib";
// ---------------------------------------------------------
// Rate limit groups.
/**
 * The rate limit groups for the endpoint.
 *
 * A group can either be registered through this class or by defining the rate limit group on an endpoint using `Endpoint.rate_limit`.
 *
 * This class will be accessable under `Server` attribute `rate_limits`.
 * @nav Backend/Rate Limit
 * @docs
 */
export var RateLimits;
(function (RateLimits) {
    RateLimits.groups = new Map([
        /** The `global` rate settings. */
        ["global", { group: "global", interval: 60, limit: 1000 }],
    ]);
    /**
     * Add a rate limit group.
     * @param group  The rate limit group.
     * @param limit The maximum requests per rate limit interval, defaults to 50.
     * @param interval The rate limit interval in seconds, defaults to 60.
     * @docs
     */
    function add({ 
    /** The rate limit group name. */
    group = null, 
    /** The maximum requests per rate limit interval. */
    limit = null, 
    /** The rate limit interval in seconds. */
    interval = null, }) {
        const settings = RateLimits.groups.has(group)
            ? RateLimits.groups.get(group)
            : { group: "", limit: 0, interval: 0 };
        settings.group = group;
        if (limit) {
            settings.limit = limit;
        }
        else if (!settings.limit) {
            settings.limit = 50;
        }
        if (interval) {
            settings.interval = interval;
        }
        else if (!settings.interval) {
            settings.interval = 60;
        }
        RateLimits.groups.set(group, settings);
        return settings;
    }
    RateLimits.add = add;
})(RateLimits || (RateLimits = {}));
/**
 * The rate limit websocket class (server).
 * Rate limiting is handled automatically when the endpoints has it enabled.
 *
 * @nav Backend/Rate Limit
 */
export class RateLimitServer {
    // Static attributes.
    static default_port = 51234;
    // Instance attributes
    ip;
    port;
    https_config;
    server;
    limits;
    ws;
    clear_caches_interval;
    constructor({ port = RateLimitServer.default_port, ip, https, _server, }) {
        // Checks.
        vlib.schema.validate(arguments[0], {
            unknown: false,
            throw: true,
            schema: {
                port: { type: "number", default: RateLimitServer.default_port },
                ip: { type: "string", required: false },
                https: { type: "any", required: false },
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
    async start() {
        // Ensure the rate limit api key is defined.
        if (!this.server.rate_limit_api_key) {
            throw new Error("Rate limit API key is not defined.");
        }
        // Initialize server.
        this.ws = new vlib.websocket.Server({
            ip: this.ip,
            port: this.port,
            https: this.https_config,
            api_keys: [this.server.rate_limit_api_key],
            rate_limit: {
                limit: 100,
                interval: 60,
            },
        });
        // Listen event.
        this.ws.on_event("listen", (address) => {
            this.server.log(0, `Running on ${address}.`);
        });
        // Error event.
        this.ws.on_event('error', (stream, e) => {
            this.server.log.error(e);
        });
        // Create limit command.
        this.ws.on("limit", async (stream, id, data) => {
            try {
                this.ws.send({
                    stream,
                    id,
                    data: { response: await this.limit(data.ip, data.groups) }
                });
            }
            catch (e) {
                this.server.log.error(e);
                this.ws.send({ stream, id, data: { error: e.message } });
            }
        });
        // Create command: reset & reset_all.
        this.ws.on("reset", async (stream, id, data) => {
            try {
                await this.reset(data.group);
                this.ws.send({ stream, id, data: { error: undefined } });
            }
            catch (e) {
                this.server.log.error(e);
                this.ws.send({ stream, id, data: { error: e.message } });
            }
        });
        this.ws.on("reset_all", async (stream, id) => {
            try {
                await this.reset_all();
                this.ws.send({ stream, id, data: { error: undefined } });
            }
            catch (e) {
                this.server.log.error(e);
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
    async stop() {
        this.server.log("Stopping the rate limit server.");
        if (this.clear_caches_interval) {
            clearInterval(this.clear_caches_interval);
        }
        if (this.ws) {
            await this.ws.stop();
            this.ws = undefined;
        }
    }
    // Returns null when rate limit is approved, and returns the unix timestamp (as str) of reset when rate limit has been exceeded.
    async limit(ip, groups = [{ group: null, limit: null, interval: null }]) {
        return groups.iterate((rate_limit) => {
            for (let attempts = 2; attempts >= 0; --attempts) {
                try {
                    // Get endpoint limits.
                    let limits;
                    if (this.limits.has(rate_limit.group)) {
                        limits = this.limits.get(rate_limit.group);
                    }
                    else {
                        limits = new Map();
                        this.limits.set(rate_limit.group, limits);
                    }
                    // Limit.
                    const now = Date.now();
                    if (limits.has(ip)) {
                        let data = limits.get(ip);
                        if (now >= data.expiration) {
                            data = {
                                count: 0,
                                expiration: now + rate_limit.interval * 1000,
                            };
                        }
                        ++data.count;
                        if (data.count > rate_limit.limit) {
                            return data.expiration;
                        }
                        limits.set(ip, data);
                    }
                    else {
                        limits.set(ip, {
                            count: 1,
                            expiration: now + rate_limit.interval * 1000,
                        });
                    }
                    break;
                }
                catch (e) {
                    if (attempts === 0) {
                        throw e;
                    }
                }
            }
        }) ?? null;
    }
    // Reset a group limit.
    async reset(group) {
        for (const [key, group_limits] of this.limits.entries()) {
            if (key === group) {
                for (const cache of group_limits.values()) {
                    cache.count = 0;
                }
            }
        }
    }
    // Reset all rate limit groups.
    async reset_all() {
        for (const group_limits of this.limits.values()) {
            for (const cache of group_limits.values()) {
                cache.count = 0;
            }
        }
    }
}
/**
 * The secondary rate limit class (client).
 *
 * Rate limiting is handled automatically when the endpoints has it enabled.
 *
 * @nav Backend/Rate Limit
 */
export class RateLimitClient {
    ip;
    port;
    https;
    url;
    server;
    ws;
    constructor({ ip, port = RateLimitServer.default_port, https = false, url, _server, }) {
        // Checks.
        vlib.schema.validate(arguments[0], {
            unknown: false,
            throw: true,
            schema: {
                ip: { type: "string", default: null },
                port: { type: "number", default: RateLimitServer.default_port },
                https: { type: "object", default: null },
                url: { type: "string", default: null },
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
    async start() {
        // Ensure the rate limit api key is defined.
        if (!this.server.rate_limit_api_key) {
            throw new Error("Rate limit API key is not defined.");
        }
        // Initialize server.
        this.ws = new vlib.websocket.Client({
            url: this.url ? this.url : `${this.https ? "wss" : "ws"}://${this.ip}:${this.port}`,
            api_key: this.server.rate_limit_api_key,
            reconnect: {
                interval: 10,
                max_interval: 30000,
            },
            ping: true,
        });
        // Error event.
        this.ws.on_event('error', (e) => {
            this.server.log.error(e);
        });
        // Reconnect event.
        this.ws.on_event('reconnect', (e) => {
            this.server.log('Attempting to reconnect with the server.');
        });
        // Close event.
        this.ws.on_event('close', () => {
            this.server.log('Websocket closed after exhausting all reconnect attempts.');
            process.exit(1); // stop the thread.
        });
        // Connect.
        await this.ws.connect();
    }
    // Stop.
    async stop() {
        this.server.log("Stopping the rate limit client.");
        if (this.ws) {
            await this.ws.disconnect();
            this.ws = undefined;
        }
    }
    // Limit function.
    // Returns null when rate limit is approved, and returns the unix timestamp (as str) of reset when rate limit has been exceeded.
    async limit(ip, groups = [{ group: null, limit: null, interval: null }]) {
        const { data } = await this.ws.request({
            command: "limit",
            timeout: 10000,
            data: { ip, groups }
        });
        if (data.error) {
            throw new Error(data.error);
        }
        return data.response;
    }
    // Reset a group limit.
    async reset(group) {
        const { data } = await this.ws.request({
            command: "reset",
            timeout: 10000,
            data: { group }
        });
        if (data.error) {
            throw new Error(data.error);
        }
    }
    // Reset all rate limit groups.
    async reset_all() {
        const { data } = await this.ws.request({
            command: "reset_all",
            timeout: 10000,
        });
        if (data.error) {
            throw new Error(data.error);
        }
    }
}
// ---------------------------------------------------------
// Exports.
export default RateLimits;
