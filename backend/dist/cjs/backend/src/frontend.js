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
  Frontend: () => Frontend,
  default: () => stdin_default
});
module.exports = __toCommonJS(stdin_exports);
var vlib = __toESM(require("@vandenberghinc/vlib"));
const import_meta = {};
var __dirname = typeof __dirname !== "undefined" ? __dirname : import_meta.dirname;
function validate_path(path) {
  if (!vlib.Path.exists(path)) {
    throw new Error(`Frontend path "${path}" does not exist. Please create a GitHub issue to report this.`);
  }
  return path;
}
const Frontend = {
  /** The frontend assets path. */
  assets: validate_path(__dirname + "/../../../../../frontend/assets/"),
  /** CSS exports. */
  css: {
    /** The default volt css export. */
    volt: validate_path(__dirname + "/../../../../../frontend/css/volt.css")
  }
};
var stdin_default = Frontend;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Frontend
});
