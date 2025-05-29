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
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
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
  ExternalError: () => import_utils.ExternalError,
  InternalError: () => import_utils.InternalError,
  Mail: () => Mail
});
module.exports = __toCommonJS(stdin_exports);
var import_utils = require("./utils.js");
__reExport(stdin_exports, require("./status.js"), module.exports);
__reExport(stdin_exports, require("./meta.js"), module.exports);
__reExport(stdin_exports, require("./splash_screen.js"), module.exports);
__reExport(stdin_exports, require("./view.js"), module.exports);
__reExport(stdin_exports, require("./stream.js"), module.exports);
__reExport(stdin_exports, require("./endpoint.js"), module.exports);
__reExport(stdin_exports, require("./server.js"), module.exports);
__reExport(stdin_exports, require("./database/database.js"), module.exports);
__reExport(stdin_exports, require("./database/document.js"), module.exports);
__reExport(stdin_exports, require("./database/collection.js"), module.exports);
__reExport(stdin_exports, require("./rate_limit.js"), module.exports);
__reExport(stdin_exports, require("./logger.js"), module.exports);
var Mail = __toESM(require("./plugins/mail/ui.js"));
__reExport(stdin_exports, require("./frontend.js"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ExternalError,
  InternalError,
  Mail,
  ...require("./status.js"),
  ...require("./meta.js"),
  ...require("./splash_screen.js"),
  ...require("./view.js"),
  ...require("./stream.js"),
  ...require("./endpoint.js"),
  ...require("./server.js"),
  ...require("./database/database.js"),
  ...require("./database/document.js"),
  ...require("./database/collection.js"),
  ...require("./rate_limit.js"),
  ...require("./logger.js"),
  ...require("./frontend.js")
});
