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
  delete_stripe_customer: () => delete_stripe_customer,
  ensure_stripe_customer: () => ensure_stripe_customer,
  find_stripe_customer_id: () => find_stripe_customer_id,
  retrieve_active_customer: () => retrieve_active_customer
});
module.exports = __toCommonJS(stdin_exports);
var vlib = __toESM(require("@vandenberghinc/vlib"));
var import_error = require("./error.js");
var import_utils = require("./utils.js");
const stripe_customer_cache = new vlib.Cache({
  max_size: 1e5,
  ttl: {
    sliding: false,
    duration: 60 * 60 * 1e3
    // 1 hour
  }
});
const stripe_customer_uid_metadata_key = "__volt_uid";
function escape_stripe_search_value(value) {
  return value.replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}
function assert_uid(uid) {
  if (typeof uid !== "string" || uid.length < 16 || uid.length > 128) {
    throw new import_error.InternalStripeError("invalid_uid", "Invalid uid for Stripe customer mapping.", { uid_length: typeof uid === "string" ? uid.length : null });
  }
  if (/[\u0000-\u001F\u007F]/.test(uid)) {
    throw new import_error.InternalStripeError("invalid_uid", "uid contains control characters.", {});
  }
}
async function find_stripe_customer_id(client, uid) {
  assert_uid(uid);
  const escaped_uid = escape_stripe_search_value(uid);
  const query = `metadata['${stripe_customer_uid_metadata_key}']:'${escaped_uid}'`;
  const search_result = await (0, import_utils.stripe_api_call)(() => client.customers.search({
    query,
    limit: 1
  }), { uid, query });
  const customer = search_result.data[0];
  if (!customer) {
    return null;
  }
  return customer.id;
}
async function ensure_stripe_customer(client, uid) {
  assert_uid(uid);
  const cached_customer_id = stripe_customer_cache.get(uid);
  if (cached_customer_id) {
    return cached_customer_id;
  }
  const existing_customer_id = await find_stripe_customer_id(client, uid);
  if (existing_customer_id) {
    stripe_customer_cache.set(uid, existing_customer_id);
    return existing_customer_id;
  }
  const created_customer = await (0, import_utils.stripe_api_call)(() => client.customers.create({
    metadata: {
      [stripe_customer_uid_metadata_key]: uid
    }
  }, {
    // Prevent duplicates across concurrent calls / processes.
    idempotencyKey: (0, import_utils.stable_idempotency_key)(`customer_create_uid:${uid}`)
  }), { uid, metadata_key: stripe_customer_uid_metadata_key });
  const created_customer_id = created_customer.id;
  stripe_customer_cache.set(uid, created_customer_id);
  return created_customer_id;
}
async function delete_stripe_customer(client, uid) {
  assert_uid(uid);
  const cached_customer_id = stripe_customer_cache.get(uid);
  const customer_id = cached_customer_id ?? await find_stripe_customer_id(client, uid);
  stripe_customer_cache.delete(uid);
  if (!customer_id) {
    return;
  }
  const deleted_customer = await (0, import_utils.stripe_api_call)(() => client.customers.del(customer_id), { uid, customer_id });
  if (deleted_customer.deleted !== true) {
    throw new import_error.InternalStripeError("customer_delete_error", "Stripe customer delete did not return a deleted confirmation.", { uid, customer_id });
  }
}
async function retrieve_active_customer(client, stripe_customer_id, context) {
  const customer = await (0, import_utils.stripe_api_call)(() => client.customers.retrieve(stripe_customer_id), { ...context, operation: "customers.retrieve", stripe_customer_id });
  if ("deleted" in customer && customer.deleted === true) {
    throw new import_error.InternalStripeError("customer_not_found", "Stripe customer was deleted.", { ...context, stripe_customer_id });
  }
  return customer;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  delete_stripe_customer,
  ensure_stripe_customer,
  find_stripe_customer_id,
  retrieve_active_customer
});
