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
var import_logger = require("./logger.js");
const RateLimits = {
  groups: /* @__PURE__ */ new Map(),
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
  add({ group = null, limit = null, interval = null }) {
    const settings = this.groups.has(group) ? this.groups.get(group) : { group: "", limit: 0, interval: 0 };
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
    this.groups.set(group, settings);
    return settings;
  }
};
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
  constructor({ port = RateLimitServer.default_port, ip = null, https = null, _server }) {
    vlib.Scheme.validate(arguments[0], {
      strict: true,
      scheme: {
        port: { type: "number", default: RateLimitServer.default_port },
        ip: { type: "string", default: null },
        https: { type: "https", default: null },
        _server: "object"
      }
    });
    this.ip = ip;
    this.port = port;
    this.https_config = https;
    this.server = _server;
    this.limits = /* @__PURE__ */ new Map();
  }
  // Start.
  async start() {
    const data = await this.server._sys_db.load("rate_limit", {
      default: {
        api_key: null
      }
    });
    if (data.api_key == null) {
      data.api_key = vlib.String.random(32);
      await this.server._sys_db.save("rate_limit", data);
    }
    this.ws = new vlib.websocket.Server({
      ip: this.ip,
      port: this.port,
      https: this.https_config,
      api_keys: [data.api_key],
      rate_limit: {
        limit: 100,
        interval: 60
      }
    });
    this.ws.on_event("listen", (address) => {
      import_logger.logger.log(0, `Running on ${address}.`);
    });
    this.ws.on_event("error", (stream, e) => {
      import_logger.logger.error(e);
    });
    this.ws.on("limit", async (stream, id, data2) => {
      try {
        this.ws.send({
          stream,
          id,
          data: { response: await this.limit(data2.ip, data2.groups) }
        });
      } catch (e) {
        import_logger.logger.error(e);
        this.ws.send({ stream, id, data: { error: e.message } });
      }
    });
    this.ws.on("reset", async (stream, id, data2) => {
      try {
        await this.reset(data2.group);
        this.ws.send({ stream, id, data: { error: void 0 } });
      } catch (e) {
        import_logger.logger.error(e);
        this.ws.send({ stream, id, data: { error: e.message } });
      }
    });
    this.ws.on("reset_all", async (stream, id) => {
      try {
        await this.reset_all();
        this.ws.send({ stream, id, data: { error: void 0 } });
      } catch (e) {
        import_logger.logger.error(e);
        this.ws.send({ stream, id, data: { error: e.message } });
      }
    });
    await this.ws.start();
    this.clear_caches_interval = setInterval(() => {
      const remove_after = Date.now() + 3600 * 1e3;
      for (const [group, map] of this.limits.entries()) {
        for (const [ip, data2] of map.entries()) {
          if (remove_after > data2.expiration) {
            map.delete(ip);
          }
        }
      }
    }, 3600 * 1e3);
  }
  // Stop.
  async stop() {
    import_logger.logger.log(0, "Stopping the rate limit server.");
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
  constructor({ ip = null, port = RateLimitServer.default_port, https = false, url = null, _server }) {
    vlib.Scheme.validate(arguments[0], {
      strict: true,
      scheme: {
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
  // Start.
  async start() {
    const data = await this.server._sys_db.load("rate_limit", {
      default: {
        api_key: null
      }
    });
    if (data.api_key == null) {
      throw new Error("No rate limit api key has been generated yet.");
    }
    this.ws = new vlib.websocket.Client({
      url: this.url ? this.url : `${this.https ? "wss" : "ws"}://${this.ip}:${this.port}`,
      api_key: data.api_key,
      reconnect: {
        interval: 10,
        max_interval: 3e4
      },
      ping: true
    });
    this.ws.on_event("error", (e) => {
      import_logger.logger.error(e);
    });
    this.ws.on_event("reconnect", (e) => {
      import_logger.logger.log(0, "Attempting to reconnect with the server.");
    });
    this.ws.on_event("close", () => {
      import_logger.logger.log(0, "Websocket closed after exhausting all reconnect attempts.");
      process.exit(1);
    });
    await this.ws.connect();
  }
  // Stop.
  async stop() {
    import_logger.logger.log(0, "Stopping the rate limit client.");
    if (this.ws) {
      await this.ws.disconnect();
      this.ws = void 0;
    }
  }
  // Limit function.
  // Returns null when rate limit is approved, and returns the unix timestamp (as str) of reset when rate limit has been exceeded.
  async limit(ip, groups = [{ group: null, limit: null, interval: null }]) {
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
    const { data } = await this.ws.request({
      command: "reset_all",
      timeout: 1e4
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
