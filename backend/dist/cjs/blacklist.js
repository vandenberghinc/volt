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
  Blacklist: () => Blacklist
});
module.exports = __toCommonJS(stdin_exports);
var vlib = __toESM(require("@vandenberghinc/vlib"));
class Blacklist {
  api_key;
  cache;
  constructor({
    api_key,
    // honey pot api key
    _server
  }) {
    vlib.Scheme.verify({ object: arguments[0], check_unknown: true, scheme: {
      api_key: "string"
    } });
    this.api_key = api_key;
    this.cache = /* @__PURE__ */ new Map();
  }
  // Verify, returns true on allowed and false on not allowed.
  async verify(ip) {
    throw new Error("Deprecated");
    if (this.cache.has(ip)) {
      return this.cache.get(ip);
    }
    let result;
    await new Promise((resolve) => {
      dns.resolveTxt(`${this.api_key}.${ip.split(".").reverse().join(".")}.dnsbl.httpbl.org`, (error, records) => {
        if (error) {
          result = true;
          console.error(error);
        } else {
          result = true;
          console.log(records);
        }
        resolve();
      });
    });
    this.cache.set(ip, result);
    return result;
  }
}
module.exports = Blacklist;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Blacklist
});
