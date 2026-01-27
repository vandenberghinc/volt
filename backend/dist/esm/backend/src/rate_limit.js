/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
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
        ["global", { group: "global", interval: 60, limit: 5000 }],
    ]);
    /**
     * Add a rate limit group.
     * @param group  The rate limit group.
     * @param limit The maximum requests per rate limit interval, defaults to 50.
     * @param interval The rate limit interval in seconds, defaults to 60.
     * @docs
     */
    function add({ group, limit, interval }) {
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
     */
    function normalize_ip(ip) {
        let s = strip_brackets_zone_and_port(ip);
        // Fast path: dotted-decimal IPv4.
        const v4 = try_parse_ipv4_bytes(s);
        if (v4) {
            return ipv4_bytes_to_string(v4);
        }
        // IPv6 (supports embedded IPv4 tail).
        const hextets = parse_ipv6_to_hextets(s);
        // Collapse IPv4-mapped IPv6 to plain IPv4.
        if (is_ipv4_mapped(hextets)) {
            const b0 = (hextets[6] >>> 8) & 0xff;
            const b1 = hextets[6] & 0xff;
            const b2 = (hextets[7] >>> 8) & 0xff;
            const b3 = hextets[7] & 0xff;
            return `${b0}.${b1}.${b2}.${b3}`;
        }
        return ipv6_hextets_to_rfc5952(hextets);
    }
    RateLimits.normalize_ip = normalize_ip;
    /**
     * Trim, remove surrounding brackets for IPv6, drop any `:port` after a closing bracket,
     * and strip a zone/scope ID starting at `%`.
     *
     * Non-bracketed `ipv4:port` is intentionally NOT supported to avoid ambiguity.
     *
     * @param input Raw input string.
     * @returns Address-only string.
     * @throws Error when a starting `[` lacks a matching `]`.
     */
    function strip_brackets_zone_and_port(input) {
        let s = input.trim();
        if (s.startsWith('[')) {
            const rb = s.indexOf(']');
            if (rb === -1)
                throw new Error('invalid ip: unmatched closing bracket');
            s = s.slice(1, rb); // ignore anything after the closing bracket (like :port)
        }
        const pct = s.indexOf('%');
        if (pct !== -1)
            s = s.slice(0, pct);
        return s;
    }
    /**
     * Attempt to parse dotted-decimal IPv4 into 4 bytes via a single linear scan.
     *
     * Accepts leading zeros but interprets strictly as decimal (no octal/hex legacy forms).
     *
     * @param s Candidate IPv4 string.
     * @returns Four bytes or null if not valid dotted-decimal.
     */
    function try_parse_ipv4_bytes(s) {
        let a = 0, b = 0, c = 0, d = 0;
        let val = 0, dots = 0, digits = 0;
        for (let i = 0; i < s.length; i++) {
            const ch = s.charCodeAt(i);
            if (ch === 46 /* '.' */) {
                if (digits === 0)
                    return null; // empty octet
                if (dots === 0)
                    a = val;
                else if (dots === 1)
                    b = val;
                else if (dots === 2)
                    c = val;
                else
                    return null; // too many dots
                dots++;
                val = 0;
                digits = 0;
            }
            else if (ch >= 48 && ch <= 57) {
                val = val * 10 + (ch - 48);
                if (val > 255)
                    return null;
                digits++;
            }
            else {
                return null;
            }
        }
        if (dots !== 3 || digits === 0)
            return null;
        d = val;
        return [a, b, c, d];
    }
    /**
     * Convert 4 IPv4 bytes to dotted-decimal.
     *
     * @param bytes Four IPv4 bytes.
     * @returns Dotted-decimal string.
     */
    function ipv4_bytes_to_string(bytes) {
        return `${bytes[0]}.${bytes[1]}.${bytes[2]}.${bytes[3]}`;
    }
    /**
     * Parse an IPv6 string (optionally with a dotted-decimal IPv4 tail) into eight 16-bit hextets.
     *
     * Rules:
     * - At most one `::` zero-run compression.
     * - Each hex hextet: 1–4 hex chars (case-insensitive).
     * - An embedded IPv4 tail must be the final token on its side and contributes two hextets.
     *
     * @param s Candidate IPv6 string (no brackets, no zone).
     * @returns Eight hextets.
     * @throws Error on invalid IPv6.
     */
    function parse_ipv6_to_hextets(s) {
        const dbl = s.indexOf('::');
        const has_double = dbl !== -1;
        if (has_double && s.indexOf('::', dbl + 2) !== -1) {
            throw new Error('invalid ipv6: multiple ::');
        }
        const left_end = has_double ? dbl : s.length;
        const right_start = has_double ? dbl + 2 : s.length;
        const left = parse_ipv6_side_range(s, 0, left_end);
        const right = has_double ? parse_ipv6_side_range(s, right_start, s.length) : [];
        let zeros = 0;
        if (has_double) {
            zeros = 8 - (left.length + right.length);
            if (zeros < 1)
                throw new Error('invalid ipv6: bad :: compression');
        }
        else {
            if (left.length !== 8)
                throw new Error('invalid ipv6: must have 8 hextets without ::');
        }
        const out = new Array(8);
        let k = 0;
        for (let i = 0; i < left.length; i++)
            out[k++] = left[i];
        for (let i = 0; i < zeros; i++)
            out[k++] = 0;
        for (let i = 0; i < right.length; i++)
            out[k++] = right[i];
        return [
            out[0], out[1], out[2], out[3],
            out[4], out[5], out[6], out[7]
        ];
    }
    /**
     * Parse one side of an IPv6 address delimited by `:` using index ranges,
     * with optional trailing embedded IPv4 token (counts as two hextets).
     *
     * @param s Full input string.
     * @param start Start index (inclusive).
     * @param end End index (exclusive).
     * @returns Array of hextets from this side.
     * @throws Error on invalid tokens/order.
     */
    function parse_ipv6_side_range(s, start, end) {
        if (start === end)
            return [];
        const out = [];
        let i = start;
        while (i < end) {
            const token_start = i;
            // find next ':' or end
            while (i < end && s.charCodeAt(i) !== 58 /* ':' */)
                i++;
            const token_end = i;
            if (token_end === token_start)
                throw new Error('invalid ipv6: empty hextet');
            // detect embedded IPv4 by scanning token for '.'
            let has_dot = false;
            for (let p = token_start; p < token_end; p++) {
                if (s.charCodeAt(p) === 46 /* '.' */) {
                    has_dot = true;
                    break;
                }
            }
            if (has_dot) {
                if (i !== end)
                    throw new Error('invalid ipv6: embedded ipv4 must be last token');
                const bytes = try_parse_ipv4_bytes(s.slice(token_start, token_end));
                if (!bytes)
                    throw new Error('invalid ipv6: bad embedded ipv4');
                out.push(((bytes[0] << 8) | bytes[1]) & 0xffff);
                out.push(((bytes[2] << 8) | bytes[3]) & 0xffff);
            }
            else {
                out.push(parse_hextet_token(s, token_start, token_end));
            }
            if (++i > end)
                break; // skip ':' and continue
            if (out.length > 8)
                throw new Error('invalid ipv6: too many hextets');
        }
        return out;
    }
    /**
     * Parse a hex hextet (1–4 chars) from a substring into a 16-bit number.
     *
     * @param s Source string.
     * @param start Start index (inclusive).
     * @param end End index (exclusive).
     * @returns A number from 0 to 65535.
     * @throws Error if invalid length or characters.
     */
    function parse_hextet_token(s, start, end) {
        const len = end - start;
        if (len < 1 || len > 4)
            throw new Error('invalid ipv6: hextet size');
        let val = 0;
        for (let i = 0; i < len; i++) {
            const c = s.charCodeAt(start + i);
            let nibble;
            if (c >= 48 && c <= 57)
                nibble = c - 48; // 0-9
            else if (c >= 97 && c <= 102)
                nibble = 10 + (c - 97); // a-f
            else if (c >= 65 && c <= 70)
                nibble = 10 + (c - 65); // A-F
            else
                throw new Error('invalid ipv6: non-hex character');
            val = (val << 4) | nibble;
        }
        return val & 0xffff;
    }
    /**
     * Check if an IPv6 address is IPv4-mapped (::ffff:0:0/96).
     *
     * @param h Eight hextets.
     * @returns True if IPv4-mapped.
     */
    function is_ipv4_mapped(h) {
        return h[0] === 0 && h[1] === 0 && h[2] === 0 && h[3] === 0 && h[4] === 0 && h[5] === 0xffff;
    }
    /**
     * Render eight IPv6 hextets using RFC 5952 canonical form:
     * - lowercase hex
     * - no leading zeros
     * - compress the longest run of ≥2 consecutive zero hextets with "::"
     *   (first run wins on ties)
     *
     * @param h Eight hextets.
     * @returns Canonical IPv6 string.
     */
    function ipv6_hextets_to_rfc5952(h) {
        // find longest zero-run
        let best_start = -1, best_len = 0;
        for (let i = 0; i < 8;) {
            if (h[i] !== 0) {
                i++;
                continue;
            }
            const start = i;
            while (i < 8 && h[i] === 0)
                i++;
            const len = i - start;
            if (len >= 2 && len > best_len) {
                best_start = start;
                best_len = len;
            }
        }
        // build string without extra allocations
        let out = '';
        for (let i = 0; i < 8; i++) {
            if (best_len && i === best_start) {
                // insert the '::'
                if (i === 0)
                    out += '::';
                else
                    out += ':::';
                i += best_len - 1; // skip compressed zeros
                continue;
            }
            if (i > 0 && !(best_len && i === best_start + best_len))
                out += ':';
            out += h[i].toString(16); // lowercase, no leading zeros
        }
        // special: all zeros compressed
        if (out === '')
            return '::';
        // fix potential ':::' at beginning (from i===0 case)
        if (out.startsWith(':::'))
            out = out.slice(1);
        return out;
    }
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
    /** Assert the server is running. */
    assert_connected() {
        if (!this.ws) {
            throw new Error("The rate limit server is not running.");
        }
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
            this.assert_connected();
            try {
                this.ws.respond({
                    stream,
                    id,
                    data: { response: await this.limit(data.ip, data.groups) }
                });
            }
            catch (e) {
                this.server.log.error(e);
                this.ws.respond({ stream, id, data: { error: e.message } });
            }
        });
        // Create command: reset & reset_all.
        this.ws.on("reset", async (stream, id, data) => {
            this.assert_connected();
            try {
                await this.reset(data.group);
                this.ws.respond({ stream, id, data: { error: undefined } });
            }
            catch (e) {
                this.server.log.error(e);
                this.ws.respond({ stream, id, data: { error: e.message } });
            }
        });
        this.ws.on("reset_all", async (stream, id) => {
            this.assert_connected();
            try {
                await this.reset_all();
                this.ws.respond({ stream, id, data: { error: undefined } });
            }
            catch (e) {
                this.server.log.error(e);
                this.ws.respond({ stream, id, data: { error: e.message } });
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
        for (const rate_limit of groups) {
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
        }
        return null;
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
    /** Assert the client is started & connected. */
    assert_connected() {
        if (!this.ws) {
            throw new Error("The rate limit client is not started.");
        }
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
        this.assert_connected();
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
        this.assert_connected();
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
        this.assert_connected();
        const { data } = await this.ws.request({
            command: "reset_all",
            timeout: 10000,
            data: {},
        });
        if (data.error) {
            throw new Error(data.error);
        }
    }
}
// ---------------------------------------------------------
// Exports.
export default RateLimits;
