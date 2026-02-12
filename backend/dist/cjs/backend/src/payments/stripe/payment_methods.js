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
  create_payment_method_setup_intent: () => create_payment_method_setup_intent,
  finalize_payment_method_setup: () => finalize_payment_method_setup
});
module.exports = __toCommonJS(stdin_exports);
var import_customers = require("./customers.js");
var import_error = require("./error.js");
var import_utils = require("./utils.js");
function resolve_payment_method_id_from_setup_intent(setup_intent) {
  const payment_method = setup_intent.payment_method;
  if (!payment_method) {
    throw new import_error.ExternalStripeError("payment_method_missing", "No payment method was provided. Please try again.", { setup_intent_id: setup_intent.id, status: setup_intent.status });
  }
  if (typeof payment_method === "string") {
    return payment_method;
  }
  const id = payment_method.id;
  if (!(0, import_utils.is_non_empty_string)(id)) {
    throw new import_error.ExternalStripeError("payment_method_missing", "No payment method was provided. Please try again.", { setup_intent_id: setup_intent.id, status: setup_intent.status });
  }
  return id;
}
function assert_setup_intent_belongs_to_customer(opts) {
  const { setup_intent, expected_customer_id, uid } = opts;
  const setup_intent_customer = setup_intent.customer;
  (0, import_utils.public_assert)(setup_intent_customer !== null, "invalid_argument", "Setup intent is missing a customer association.", { uid, setup_intent_id: setup_intent.id });
  const setup_customer_id = typeof setup_intent_customer === "string" ? setup_intent_customer : setup_intent_customer.id;
  (0, import_utils.public_assert)(setup_customer_id === expected_customer_id, "invalid_argument", "Setup intent does not belong to this customer.", { uid, setup_intent_id: setup_intent.id, expected_customer_id, setup_customer_id });
}
async function create_payment_method_setup_intent(client, opts) {
  (0, import_utils.public_assert)((0, import_utils.is_non_empty_string)(opts.uid), "invalid_argument", "Property 'uid' must be a non-empty string.");
  const stripe_customer_id = await (0, import_customers.ensure_stripe_customer)(client, opts.uid);
  let setup_intent;
  try {
    setup_intent = await (0, import_utils.stripe_api_call)(() => client.setupIntents.create({
      customer: stripe_customer_id,
      // off_session indicates we plan to charge when the customer is not actively in-session.
      usage: "off_session"
    }, {
      idempotencyKey: opts.idempotency_key
    }), { operation: "setupIntents.create", uid: opts.uid, stripe_customer_id });
  } catch (error) {
    throw new import_error.InternalStripeError("api_error", "Failed to create a payment method setup intent.", { uid: opts.uid, stripe_customer_id }, error);
  }
  const client_secret = setup_intent.client_secret;
  (0, import_utils.assert)((0, import_utils.is_non_empty_string)(client_secret), "api_error", "Stripe did not return a SetupIntent client_secret.", { uid: opts.uid, stripe_customer_id, setup_intent_id: setup_intent.id });
  return {
    id: setup_intent.id,
    client_secret,
    stripe_customer_id
  };
}
async function finalize_payment_method_setup(client, opts) {
  (0, import_utils.public_assert)((0, import_utils.is_non_empty_string)(opts.uid), "invalid_argument", "Property 'uid' must be a non-empty string.");
  (0, import_utils.public_assert)((0, import_utils.is_non_empty_string)(opts.setup_intent_id), "invalid_argument", "Property 'setup_intent_id' must be a non-empty string.");
  const stripe_customer_id = await (0, import_customers.ensure_stripe_customer)(client, opts.uid);
  const setup_intent = await (0, import_utils.stripe_api_call)(() => client.setupIntents.retrieve(opts.setup_intent_id, {
    expand: ["payment_method"]
  }), { operation: "setupIntents.retrieve", uid: opts.uid, setup_intent_id: opts.setup_intent_id });
  assert_setup_intent_belongs_to_customer({
    setup_intent,
    expected_customer_id: stripe_customer_id,
    uid: opts.uid
  });
  (0, import_utils.public_assert)(setup_intent.status === "succeeded", "invalid_argument", "Payment method setup is not complete. Please finish adding your payment method.", { uid: opts.uid, setup_intent_id: setup_intent.id, status: setup_intent.status });
  const payment_method_id = resolve_payment_method_id_from_setup_intent(setup_intent);
  await (0, import_utils.stripe_api_call)(() => client.customers.update(stripe_customer_id, {
    invoice_settings: {
      default_payment_method: payment_method_id
    }
  }, {
    idempotencyKey: opts.idempotency_key ?? (0, import_utils.stable_idempotency_key)(`finalize_payment_method_setup:${opts.uid}:${setup_intent.id}`)
  }), {
    operation: "customers.update",
    uid: opts.uid,
    stripe_customer_id,
    setup_intent_id: setup_intent.id,
    payment_method_id,
    action: "set_default_payment_method"
  });
  return {
    stripe_customer_id,
    payment_method_id,
    setup_intent_id: setup_intent.id
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  create_payment_method_setup_intent,
  finalize_payment_method_setup
});
