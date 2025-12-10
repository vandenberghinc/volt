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
  ThreadMonitor: () => ThreadMonitor,
  default: () => stdin_default
});
module.exports = __toCommonJS(stdin_exports);
var import_async_hooks = __toESM(require("async_hooks"));
class ThreadMonitor {
  async_resources = /* @__PURE__ */ new Map();
  ignored_types = /* @__PURE__ */ new Set([
    "TIMERWRAP",
    "PROMISE",
    "RANDOMBYTESREQUEST",
    "DNSCHANNEL",
    "Immediate"
  ]);
  hook;
  constructor() {
    this.hook = import_async_hooks.default.createHook({
      init: (async_id, type, trigger_id, resource) => {
        if (this.ignored_types.has(type))
          return;
        const err = new Error();
        const stack = err.stack ? err.stack.split("\n").slice(2).filter((line) => !line.includes("node:internal/")).join("\n") : "No stack available";
        this.async_resources.set(async_id, {
          type,
          stack,
          timestamp: Date.now(),
          trigger_id,
          resource
        });
      },
      destroy: (async_id) => {
        this.async_resources.delete(async_id);
      }
    });
  }
  start() {
    this.hook.enable();
  }
  stop() {
    this.hook.disable();
  }
  dump_active_resources(options = {}) {
    const now = Date.now();
    let resources = Array.from(this.async_resources.entries());
    if (typeof options.min_age === "number") {
      resources = resources.filter(([_, info]) => now - info.timestamp >= options.min_age);
    }
    if (options.types != null) {
      resources = resources.filter(([_, info]) => options.types.includes(info.type));
    }
    if (options.exclude_types != null) {
      resources = resources.filter(([_, info]) => !options.exclude_types.includes(info.type));
    }
    if (!options.include_internal != null) {
      resources = resources.filter(([_, info]) => !info.stack.includes("node:internal/"));
    }
    resources.sort((a, b) => a[1].timestamp - b[1].timestamp);
    console.log("\n=== Active Async Resources ===");
    if (resources.length === 0) {
      console.log("No active resources matching criteria");
      return;
    }
    for (const [async_id, info] of resources) {
      const age = Math.round((now - info.timestamp) / 1e3);
      console.log(`
AsyncID: ${async_id}`);
      console.log(`Type: ${info.type}`);
      console.log(`Age: ${age}s`);
      console.log(`Trigger ID: ${info.trigger_id}`);
      console.log("Stack trace:");
      console.log(info.stack);
      console.log("-".repeat(40));
    }
  }
  get_resource_count() {
    const counts = {};
    for (const info of this.async_resources.values()) {
      counts[info.type] = (counts[info.type] || 0) + 1;
    }
    return counts;
  }
}
var stdin_default = ThreadMonitor;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ThreadMonitor
});
