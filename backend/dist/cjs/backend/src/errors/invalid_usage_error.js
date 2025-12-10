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
  InvalidUsageError: () => InvalidUsageError
});
module.exports = __toCommonJS(stdin_exports);
class InvalidUsageError extends Error {
  /**
   * The reason code for the invalid usage error, e.g. `bad_ttl`
   * or `invalid_filter`.
   *
   * Could be used to detect specific issues with the request,
   */
  reason;
  /** The optional param/attr/field that was invalid. */
  field;
  /** An optional error that caused the invalid usage error. */
  cause;
  /** Construct an invalid usage error. */
  constructor(opts) {
    super(opts.message);
    this.name = "InvalidUsageError";
    this.reason = opts.reason;
    this.cause = opts.cause;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  InvalidUsageError
});
