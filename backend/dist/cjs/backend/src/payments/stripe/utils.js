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
  add_days_utc: () => add_days_utc,
  assert: () => assert,
  assert_never: () => assert_never,
  first_day_of_next_month_utc: () => first_day_of_next_month_utc,
  generate_random_idempotency_key: () => generate_random_idempotency_key,
  is_non_empty_string: () => is_non_empty_string,
  public_assert: () => public_assert,
  public_assert_never: () => public_assert_never,
  stable_idempotency_key: () => stable_idempotency_key,
  stripe_api_call: () => stripe_api_call,
  to_unix_seconds: () => to_unix_seconds
});
module.exports = __toCommonJS(stdin_exports);
var import_node_crypto = require("node:crypto");
var import_error = require("./error.js");
async function stripe_api_call(fn, context) {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof import_error.ExternalStripeError || error instanceof import_error.InternalStripeError) {
      throw error;
    }
    throw new import_error.InternalStripeError("api_error", "Stripe API request failed.", context, error);
  }
}
function assert(condition, error_code, message, context, cause) {
  if (!condition) {
    const normalized_message = message.endsWith(".") ? message : `${message}.`;
    throw new import_error.InternalStripeError(error_code, normalized_message, context, cause);
  }
}
function public_assert(condition, error_code, message, context, cause) {
  if (!condition) {
    const normalized_message = message.endsWith(".") ? message : `${message}.`;
    throw new import_error.ExternalStripeError(error_code, normalized_message, context, cause);
  }
}
function assert_never(value, message) {
  throw new import_error.InternalStripeError("invalid_argument", message, { value });
}
function public_assert_never(value, message) {
  throw new import_error.ExternalStripeError("invalid_argument", message, { value });
}
function is_non_empty_string(value) {
  return typeof value === "string" && value.trim().length > 0;
}
function generate_random_idempotency_key(prefix, max_length = 255) {
  if (!Number.isInteger(max_length) || max_length < 1 || max_length > 255) {
    throw new Error(`generate_random_idempotency_key: max_length must be an integer between 1 and 255 (got ${max_length})`);
  }
  const p = prefix.trim();
  if (p.length === 0) {
    throw new Error("generate_random_idempotency_key: prefix must be non-empty");
  }
  const key = `${p}_${(0, import_node_crypto.randomUUID)()}`;
  if (key.length > max_length) {
    const digest = (0, import_node_crypto.createHash)("sha256").update(key).digest("hex");
    return digest.slice(0, Math.min(max_length, digest.length));
  }
  return key;
}
function stable_idempotency_key(seed, max_length = 255) {
  assert(Number.isInteger(max_length) && max_length >= 1 && max_length <= 255, "invalid_argument", "Idempotency max_length must be an integer between 1 and 255.", { max_length });
  const s = seed.trim();
  assert(s.length > 0, "invalid_argument", "Idempotency seed must be non-empty.", {});
  if (s.length <= max_length)
    return s;
  const digest = (0, import_node_crypto.createHash)("sha256").update(s).digest("hex");
  return digest.slice(0, Math.min(max_length, digest.length));
}
function to_unix_seconds(date) {
  return Math.floor(date.getTime() / 1e3);
}
function first_day_of_next_month_utc(now) {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  return new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0));
}
function add_days_utc(date, days) {
  assert(Number.isInteger(days), "invalid_argument", "Days must be an integer.", { days });
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  return new Date(Date.UTC(year, month, day + days, date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds()));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  add_days_utc,
  assert,
  assert_never,
  first_day_of_next_month_utc,
  generate_random_idempotency_key,
  is_non_empty_string,
  public_assert,
  public_assert_never,
  stable_idempotency_key,
  stripe_api_call,
  to_unix_seconds
});
