var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  Frontend: () => Frontend,
  default: () => stdin_default
});
module.exports = __toCommonJS(stdin_exports);
const import_meta = {};
var __dirname = typeof __dirname !== "undefined" ? __dirname : import_meta.dirname;
const Frontend = {
  /** CSS exports. */
  css: {
    /** The default volt css export. */
    volt: __dirname + "/../../../frontend/src/css/volt.css"
  }
};
var stdin_default = Frontend;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Frontend
});
