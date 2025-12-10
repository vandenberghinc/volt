var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  RateLimitClient: () => RateLimitClient,
  RateLimitServer: () => RateLimitServer,
  RateLimits: () => RateLimits,
  default: () => stdin_default
});
module.exports = __toCommonJS(stdin_exports);
var vlib = __toESM(require("@vandenberghinc/vlib"));
var RateLimits;
(function(RateLimits2) {
  RateLimits2.groups = /* @__PURE__ */ new Map([
    /** The `global` rate settings. */
    ["global", { group: "global", interval: 60, limit: 5e3 }]
  ]);
  function add({ group, limit, interval }) {
    const settings = RateLimits2.groups.has(group) ? RateLimits2.groups.get(group) : { group: "", limit: 0, interval: 0 };
    settings.group = group;
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
    RateLimits2.groups.set(group, settings);
    return settings;
  }
  RateLimits2.add = add;
  function normalize_ip(ip) {
    let s = strip_brackets_zone_and_port(ip);
    const v4 = try_parse_ipv4_bytes(s);
    if (v4) {
      return ipv4_bytes_to_string(v4);
    }
    const hextets = parse_ipv6_to_hextets(s);
    if (is_ipv4_mapped(hextets)) {
      const b0 = hextets[6] >>> 8 & 255;
      const b1 = hextets[6] & 255;
      const b2 = hextets[7] >>> 8 & 255;
      const b3 = hextets[7] & 255;
      return `${b0}.${b1}.${b2}.${b3}`;
    }
    return ipv6_hextets_to_rfc5952(hextets);
  }
  RateLimits2.normalize_ip = normalize_ip;
  function strip_brackets_zone_and_port(input) {
    let s = input.trim();
    if (s.startsWith("[")) {
      const rb = s.indexOf("]");
      if (rb === -1)
        throw new Error("invalid ip: unmatched closing bracket");
      s = s.slice(1, rb);
    }
    const pct = s.indexOf("%");
    if (pct !== -1)
      s = s.slice(0, pct);
    return s;
  }
  function try_parse_ipv4_bytes(s) {
    let a = 0, b = 0, c = 0, d = 0;
    let val = 0, dots = 0, digits = 0;
    for (let i = 0; i < s.length; i++) {
      const ch = s.charCodeAt(i);
      if (ch === 46) {
        if (digits === 0)
          return null;
        if (dots === 0)
          a = val;
        else if (dots === 1)
          b = val;
        else if (dots === 2)
          c = val;
        else
          return null;
        dots++;
        val = 0;
        digits = 0;
      } else if (ch >= 48 && ch <= 57) {
        val = val * 10 + (ch - 48);
        if (val > 255)
          return null;
        digits++;
      } else {
        return null;
      }
    }
    if (dots !== 3 || digits === 0)
      return null;
    d = val;
    return [a, b, c, d];
  }
  function ipv4_bytes_to_string(bytes) {
    return `${bytes[0]}.${bytes[1]}.${bytes[2]}.${bytes[3]}`;
  }
  function parse_ipv6_to_hextets(s) {
    const dbl = s.indexOf("::");
    const has_double = dbl !== -1;
    if (has_double && s.indexOf("::", dbl + 2) !== -1) {
      throw new Error("invalid ipv6: multiple ::");
    }
    const left_end = has_double ? dbl : s.length;
    const right_start = has_double ? dbl + 2 : s.length;
    const left = parse_ipv6_side_range(s, 0, left_end);
    const right = has_double ? parse_ipv6_side_range(s, right_start, s.length) : [];
    let zeros = 0;
    if (has_double) {
      zeros = 8 - (left.length + right.length);
      if (zeros < 1)
        throw new Error("invalid ipv6: bad :: compression");
    } else {
      if (left.length !== 8)
        throw new Error("invalid ipv6: must have 8 hextets without ::");
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
      out[0],
      out[1],
      out[2],
      out[3],
      out[4],
      out[5],
      out[6],
      out[7]
    ];
  }
  function parse_ipv6_side_range(s, start, end) {
    if (start === end)
      return [];
    const out = [];
    let i = start;
    while (i < end) {
      const token_start = i;
      while (i < end && s.charCodeAt(i) !== 58)
        i++;
      const token_end = i;
      if (token_end === token_start)
        throw new Error("invalid ipv6: empty hextet");
      let has_dot = false;
      for (let p = token_start; p < token_end; p++) {
        if (s.charCodeAt(p) === 46) {
          has_dot = true;
          break;
        }
      }
      if (has_dot) {
        if (i !== end)
          throw new Error("invalid ipv6: embedded ipv4 must be last token");
        const bytes = try_parse_ipv4_bytes(s.slice(token_start, token_end));
        if (!bytes)
          throw new Error("invalid ipv6: bad embedded ipv4");
        out.push((bytes[0] << 8 | bytes[1]) & 65535);
        out.push((bytes[2] << 8 | bytes[3]) & 65535);
      } else {
        out.push(parse_hextet_token(s, token_start, token_end));
      }
      if (++i > end)
        break;
      if (out.length > 8)
        throw new Error("invalid ipv6: too many hextets");
    }
    return out;
  }
  function parse_hextet_token(s, start, end) {
    const len = end - start;
    if (len < 1 || len > 4)
      throw new Error("invalid ipv6: hextet size");
    let val = 0;
    for (let i = 0; i < len; i++) {
      const c = s.charCodeAt(start + i);
      let nibble;
      if (c >= 48 && c <= 57)
        nibble = c - 48;
      else if (c >= 97 && c <= 102)
        nibble = 10 + (c - 97);
      else if (c >= 65 && c <= 70)
        nibble = 10 + (c - 65);
      else
        throw new Error("invalid ipv6: non-hex character");
      val = val << 4 | nibble;
    }
    return val & 65535;
  }
  function is_ipv4_mapped(h) {
    return h[0] === 0 && h[1] === 0 && h[2] === 0 && h[3] === 0 && h[4] === 0 && h[5] === 65535;
  }
  function ipv6_hextets_to_rfc5952(h) {
    let best_start = -1, best_len = 0;
    for (let i = 0; i < 8; ) {
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
    let out = "";
    for (let i = 0; i < 8; i++) {
      if (best_len && i === best_start) {
        if (i === 0)
          out += "::";
        else
          out += ":::";
        i += best_len - 1;
        continue;
      }
      if (i > 0 && !(best_len && i === best_start + best_len))
        out += ":";
      out += h[i].toString(16);
    }
    if (out === "")
      return "::";
    if (out.startsWith(":::"))
      out = out.slice(1);
    return out;
  }
})(RateLimits || (RateLimits = {}));
class RateLimitServer {
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
  constructor({ port = RateLimitServer.default_port, ip, https, _server }) {
    vlib.schema.validate(arguments[0], {
      unknown: false,
      throw: true,
      schema: {
        port: { type: "number", default: RateLimitServer.default_port },
        ip: { type: "string", required: false },
        https: { type: "any", required: false },
        _server: "object"
      }
    });
    this.ip = ip;
    this.port = port;
    this.https_config = https;
    this.server = _server;
    this.limits = /* @__PURE__ */ new Map();
  }
  /** Assert the server is running. */
  assert_connected() {
    if (!this.ws) {
      throw new Error("The rate limit server is not running.");
    }
  }
  // Start.
  async start() {
    if (!this.server.rate_limit_api_key) {
      throw new Error("Rate limit API key is not defined.");
    }
    this.ws = new vlib.websocket.Server({
      ip: this.ip,
      port: this.port,
      https: this.https_config,
      api_keys: [this.server.rate_limit_api_key],
      rate_limit: {
        limit: 100,
        interval: 60
      }
    });
    this.ws.on_event("listen", (address) => {
      this.server.log(0, `Running on ${address}.`);
    });
    this.ws.on_event("error", (stream, e) => {
      this.server.log.error(e);
    });
    this.ws.on("limit", async (stream, id, data) => {
      this.assert_connected();
      try {
        this.ws.respond({
          stream,
          id,
          data: { response: await this.limit(data.ip, data.groups) }
        });
      } catch (e) {
        this.server.log.error(e);
        this.ws.respond({ stream, id, data: { error: e.message } });
      }
    });
    this.ws.on("reset", async (stream, id, data) => {
      this.assert_connected();
      try {
        await this.reset(data.group);
        this.ws.respond({ stream, id, data: { error: void 0 } });
      } catch (e) {
        this.server.log.error(e);
        this.ws.respond({ stream, id, data: { error: e.message } });
      }
    });
    this.ws.on("reset_all", async (stream, id) => {
      this.assert_connected();
      try {
        await this.reset_all();
        this.ws.respond({ stream, id, data: { error: void 0 } });
      } catch (e) {
        this.server.log.error(e);
        this.ws.respond({ stream, id, data: { error: e.message } });
      }
    });
    await this.ws.start();
    this.clear_caches_interval = setInterval(() => {
      const remove_after = Date.now() + 3600 * 1e3;
      for (const [group, map] of this.limits.entries()) {
        for (const [ip, data] of map.entries()) {
          if (remove_after > data.expiration) {
            map.delete(ip);
          }
        }
      }
    }, 3600 * 1e3);
  }
  // Stop.
  async stop() {
    this.server.log("Stopping the rate limit server.");
    if (this.clear_caches_interval) {
      clearInterval(this.clear_caches_interval);
    }
    if (this.ws) {
      await this.ws.stop();
      this.ws = void 0;
    }
  }
  // Returns null when rate limit is approved, and returns the unix timestamp (as str) of reset when rate limit has been exceeded.
  async limit(ip, groups = [{ group: null, limit: null, interval: null }]) {
    return groups.iterate((rate_limit) => {
      for (let attempts = 2; attempts >= 0; --attempts) {
        try {
          let limits;
          if (this.limits.has(rate_limit.group)) {
            limits = this.limits.get(rate_limit.group);
          } else {
            limits = /* @__PURE__ */ new Map();
            this.limits.set(rate_limit.group, limits);
          }
          const now = Date.now();
          if (limits.has(ip)) {
            let data = limits.get(ip);
            if (now >= data.expiration) {
              data = {
                count: 0,
                expiration: now + rate_limit.interval * 1e3
              };
            }
            ++data.count;
            if (data.count > rate_limit.limit) {
              return data.expiration;
            }
            limits.set(ip, data);
          } else {
            limits.set(ip, {
              count: 1,
              expiration: now + rate_limit.interval * 1e3
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
class RateLimitClient {
  ip;
  port;
  https;
  url;
  server;
  ws;
  constructor({ ip, port = RateLimitServer.default_port, https = false, url, _server }) {
    vlib.schema.validate(arguments[0], {
      unknown: false,
      throw: true,
      schema: {
        ip: { type: "string", default: null },
        port: { type: "number", default: RateLimitServer.default_port },
        https: { type: "object", default: null },
        url: { type: "string", default: null },
        _server: "object"
      }
    });
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
    if (!this.server.rate_limit_api_key) {
      throw new Error("Rate limit API key is not defined.");
    }
    this.ws = new vlib.websocket.Client({
      url: this.url ? this.url : `${this.https ? "wss" : "ws"}://${this.ip}:${this.port}`,
      api_key: this.server.rate_limit_api_key,
      reconnect: {
        interval: 10,
        max_interval: 3e4
      },
      ping: true
    });
    this.ws.on_event("error", (e) => {
      this.server.log.error(e);
    });
    this.ws.on_event("reconnect", (e) => {
      this.server.log("Attempting to reconnect with the server.");
    });
    this.ws.on_event("close", () => {
      this.server.log("Websocket closed after exhausting all reconnect attempts.");
      process.exit(1);
    });
    await this.ws.connect();
  }
  // Stop.
  async stop() {
    this.server.log("Stopping the rate limit client.");
    if (this.ws) {
      await this.ws.disconnect();
      this.ws = void 0;
    }
  }
  // Limit function.
  // Returns null when rate limit is approved, and returns the unix timestamp (as str) of reset when rate limit has been exceeded.
  async limit(ip, groups = [{ group: null, limit: null, interval: null }]) {
    this.assert_connected();
    const { data } = await this.ws.request({
      command: "limit",
      timeout: 1e4,
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
      timeout: 1e4,
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
      timeout: 1e4,
      data: {}
    });
    if (data.error) {
      throw new Error(data.error);
    }
  }
}
var stdin_default = RateLimits;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RateLimitClient,
  RateLimitServer,
  RateLimits
});
