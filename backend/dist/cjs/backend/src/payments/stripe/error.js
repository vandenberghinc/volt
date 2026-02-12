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
  ExternalStripeError: () => ExternalStripeError,
  InternalStripeError: () => InternalStripeError
});
module.exports = __toCommonJS(stdin_exports);
var import_internal_external = require("../../errors/internal_external.js");
class InternalStripeError extends import_internal_external.InternalError {
  /** Stable error code for programmatic handling (never include secrets). */
  error_code;
  /** Optional safe context for debugging (never include secrets). */
  context;
  /** Constructs a StripeWrapperError. */
  constructor(code, message, context, cause) {
    super({
      message,
      type: code,
      cause
    });
    this.name = "StripeError";
    this.error_code = code;
    this.context = context;
    this.cause = cause;
  }
}
class ExternalStripeError extends import_internal_external.ExternalError {
  /** Stable error code for programmatic handling (never include secrets). */
  error_code;
  /** Optional safe context for debugging (never include secrets). */
  context;
  /** Constructs a StripeWrapperError. */
  constructor(code, message, context, cause) {
    super({
      message,
      type: code,
      cause
    });
    this.name = "StripeError";
    this.error_code = code;
    this.context = context;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ExternalStripeError,
  InternalStripeError
});
