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
  ExternalError: () => ExternalError,
  InternalError: () => InternalError
});
module.exports = __toCommonJS(stdin_exports);
var import_status = require("../status.js");
class BaseError extends Error {
  type;
  status;
  data;
  invalid_fields;
  constructor({ type = "BaseError", message, status, data, invalid_fields, cause }) {
    super(message);
    this.name = "BaseError";
    this.type = type;
    this.status = status ?? import_status.Status.internal_server_error;
    this.data = data;
    this.invalid_fields = invalid_fields ?? {};
    this.cause = cause;
  }
  serve(stream) {
    stream.error({
      status: this.status ?? import_status.Status.internal_server_error,
      headers: { "Content-Type": "application/json" },
      message: this.message,
      type: this.type,
      invalid_fields: this.invalid_fields
    });
    return this;
  }
}
class InternalError extends BaseError {
  constructor(args) {
    args.type ??= "InternalError";
    super(args);
    this.name = "InternalError";
  }
  serve(stream) {
    stream.error({
      status: import_status.Status.internal_server_error,
      headers: { "Content-Type": "application/json" },
      message: "Internal Server Error",
      type: "InternalServerError"
    });
    return this;
  }
}
class ExternalError extends BaseError {
  constructor(args) {
    args.type ??= "ExternalError";
    super(args);
    this.name = "ExternalError";
  }
  serve(stream) {
    stream.error({
      status: this.status ?? import_status.Status.internal_server_error,
      headers: { "Content-Type": "application/json" },
      message: this.message,
      type: this.type,
      invalid_fields: this.invalid_fields
    });
    return this;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ExternalError,
  InternalError
});
