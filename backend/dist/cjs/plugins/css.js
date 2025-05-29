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
  CSS: () => CSS
});
module.exports = __toCommonJS(stdin_exports);
var import_clean_css = __toESM(require("clean-css"));
var import_vinc = require("../vinc.js");
var CSS;
(function(CSS2) {
  function minify(data) {
    return new import_clean_css.default().minify(data).styles;
  }
  CSS2.minify = minify;
  async function bundle({ data, paths = void 0, minify: minify2 = false, output = void 0, postprocess = void 0, log_level = 0 }) {
    if (paths !== void 0) {
      data = "";
      for (const path of paths) {
        data += await new import_vinc.vlib.Path(path).load();
      }
    }
    if (minify2) {
      data = CSS2.minify(data);
    }
    if (typeof postprocess === "function") {
      const res = postprocess(data);
      if (res instanceof Promise) {
        data = await res;
      } else {
        data = res;
      }
    }
    if (typeof output === "string") {
      await new import_vinc.vlib.Path(output).save(data);
    } else if (Array.isArray(output)) {
      for (let i = 0; i < output.length; i++) {
        await new import_vinc.vlib.Path(output[i]).save(data);
      }
    }
    if (log_level >= 1) {
      const first_path = typeof output === "string" ? output : Array.isArray(output) ? output[0] : void 0;
      if (first_path != null) {
        const p = new import_vinc.vlib.Path(first_path);
        import_vinc.vlib.Utils.print_marker(`Bundled ${p.name()} (${p.str()}) [${import_vinc.vlib.Utils.format_bytes(p.size)}].`);
      }
    }
    return data;
  }
  CSS2.bundle = bundle;
})(CSS || (CSS = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CSS
});
