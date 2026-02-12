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
  create_checkout_session_id: () => create_checkout_session_id,
  start_checkout_session: () => start_checkout_session
});
module.exports = __toCommonJS(stdin_exports);
var vlib = __toESM(require("@vandenberghinc/vlib"));
var import_products = require("./products.js");
var import_customers = require("./customers.js");
var import_error = require("./error.js");
var import_utils = require("./utils.js");
var import_collection = require("../../database/collection.js");
var import_subscriptions = require("./subscriptions.js");
function resolve_checkout_item_product(opts) {
  const { product_ref, all_products } = opts;
  if (typeof product_ref !== "string") {
    return product_ref;
  }
  (0, import_utils.public_assert)((0, import_utils.is_non_empty_string)(product_ref), "checkout_invalid_product_ref", "Invalid product reference.", { product_ref_type: typeof product_ref });
  const ref_id = product_ref.trim();
  for (const product of all_products) {
    if (product.type === "one_time" && product.id === ref_id) {
      return product;
    }
  }
  const matching_plans = [];
  for (const product of all_products) {
    if (product.type !== "subscription") {
      continue;
    }
    for (const plan2 of product.plans) {
      if (plan2.id === ref_id) {
        matching_plans.push(plan2);
      }
    }
    if (product.id === ref_id) {
      throw new import_error.ExternalStripeError("checkout_subscription_plan_ambiguous", "Subscription product id is ambiguous. Please specify a subscription plan id.", { ref_id });
    }
  }
  (0, import_utils.public_assert)(matching_plans.length === 1, matching_plans.length === 0 ? "checkout_invalid_product_ref" : "checkout_subscription_plan_ambiguous", matching_plans.length === 0 ? "Unknown product reference." : "Ambiguous subscription plan reference. Plan id must be unique across products.", { ref_id, matches: matching_plans.length });
  const plan = matching_plans[0];
  (0, import_utils.assert)(plan !== void 0, "checkout_invalid_product_ref", "Missing plan after plan resolution.", { ref_id });
  return plan;
}
function create_checkout_session_db(server) {
  return server.db.collection({
    name: "Volt.Stripe.CheckoutSessions",
    indexes: [
      {
        keys: { session_id: 1 },
        unique: true
      },
      {
        keys: { uid: 1 },
        unique: false
        // since it might be undefined/anonymous
      }
    ],
    ttl: {
      milliseconds: 1e3 * 60 * 60 * 24,
      // 24 hours
      sliding: false
    },
    // Ensure its not unique so we retrieve the cached collection if already created.
    unique: false
  });
}
function assert_https_url(raw, field, allowed_hosts) {
  (0, import_utils.public_assert)((0, import_utils.is_non_empty_string)(raw), "invalid_argument", `Property '${field}' must be provided.`);
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new import_error.ExternalStripeError("invalid_argument", `Property '${field}' must be a valid absolute URL.`, { field });
  }
  (0, import_utils.public_assert)(url.protocol === "https:", "invalid_argument", `Property '${field}' must use https.`, { field });
  (0, import_utils.public_assert)(allowed_hosts === void 0 || allowed_hosts.includes(url.host), "invalid_argument", `Property '${field}' must use an allowed host.`, { field, host: url.host });
}
function create_checkout_session_id(uid) {
  return (0, import_utils.generate_random_idempotency_key)(`checkout_${uid ?? "anonymous"}`, 255);
}
async function start_checkout_session(client, server, opts) {
  (0, import_utils.public_assert)((0, import_utils.is_non_empty_string)(opts.session_id), "invalid_argument", "Property 'session_id' must be a non-empty string when provided.");
  (0, import_utils.public_assert)(Array.isArray(opts.line_items) && opts.line_items.length > 0, "invalid_argument", "Property 'line_items' must be a non-empty array.");
  (0, import_utils.public_assert)(opts.line_items.length <= 50, "invalid_argument", "Too many line items.", { count: opts.line_items.length });
  (0, import_utils.assert)(Array.isArray(opts.all_products), "invalid_argument", "Property 'all_products' must be an array.");
  assert_https_url(opts.success_url, "success_url", opts.allowed_hosts);
  assert_https_url(opts.cancel_url, "cancel_url", opts.allowed_hosts);
  const resolved_items = opts.line_items.map((item, index) => {
    (0, import_utils.public_assert)(Number.isInteger(item.quantity) && item.quantity >= 1, "checkout_invalid_quantity", "Quantity must be an integer >= 1.", { index, quantity: item.quantity });
    const resolved_product = resolve_checkout_item_product({
      product_ref: item.product,
      all_products: opts.all_products
    });
    if (resolved_product.type === "one_time" && resolved_product.quantity_rules) {
      if (resolved_product.quantity_rules.min !== void 0) {
        (0, import_utils.public_assert)(item.quantity >= resolved_product.quantity_rules.min, "checkout_invalid_quantity", "Quantity is below the minimum allowed.", { product_id: resolved_product.id, quantity: item.quantity, min: resolved_product.quantity_rules.min });
      }
      if (resolved_product.quantity_rules.max !== void 0) {
        (0, import_utils.public_assert)(item.quantity <= resolved_product.quantity_rules.max, "checkout_invalid_quantity", "Quantity is above the maximum allowed.", { product_id: resolved_product.id, quantity: item.quantity, max: resolved_product.quantity_rules.max });
      }
    }
    if (resolved_product.type === "subscription_plan") {
      (0, import_utils.public_assert)(item.quantity === 1, "checkout_invalid_quantity", "Quantity must be 1 for subscription plans.", { plan_id: resolved_product.id, quantity: item.quantity });
    }
    return {
      product: resolved_product,
      quantity: item.quantity
    };
  });
  let subscription_plan_count = 0;
  let selected_plan_id;
  let selected_subscription_id;
  for (const item of resolved_items) {
    if (item.product.type !== "subscription_plan") {
      continue;
    }
    subscription_plan_count += 1;
    selected_plan_id = item.product.id;
    selected_subscription_id = item.product.subscription_id;
    (0, import_utils.public_assert)(subscription_plan_count === 1, "checkout_subscription_plan_ambiguous", "Only one subscription plan can be purchased per checkout session.", {
      selected_plan_id,
      selected_subscription_id,
      subscription_plan_count
    });
    (0, import_utils.public_assert)(opts.uid != null && opts.uid !== "anonymous", "invalid_uid", "You must be authenticated to purchase a subscription, sign in or sign up and try again.", { uid: opts.uid });
    const is_already_subscribed = await (0, import_subscriptions.is_user_subscribed_to)(client, server, {
      uid: opts.uid,
      plan: item.product,
      all_products: opts.all_products,
      customer_id: void 0
    });
    (0, import_utils.public_assert)(!is_already_subscribed, "checkout_already_subscribed", "You are already subscribed to this plan.", { uid: opts.uid, plan_id: item.product.id, subscription_id: item.product.subscription_id });
  }
  const has_subscription_item = resolved_items.some((item) => item.product.type === "subscription_plan");
  const mode = has_subscription_item ? "subscription" : "payment";
  const currencies = /* @__PURE__ */ new Set();
  for (const item of resolved_items) {
    if (item.product.type === "subscription_plan") {
      const parent_subscription = (0, import_products.resolve_plan_to_parent_subscription)({
        plan: item.product,
        all_products: opts.all_products
      });
      currencies.add(parent_subscription.currency);
    } else {
      currencies.add(item.product.currency);
    }
  }
  (0, import_utils.public_assert)(currencies.size === 1, "checkout_mixed_currency", "All checkout items must use the same currency.", { currencies: Array.from(currencies.values()) });
  const currency = Array.from(currencies.values())[0];
  (0, import_utils.assert)(currency !== void 0, "checkout_mixed_currency", "Missing currency after currency validation.");
  let stripe_customer_id;
  if (mode === "subscription" || opts.uid) {
    (0, import_utils.public_assert)(opts.uid != null && opts.uid !== "anonymous", "invalid_uid", "You must be authenticated to purchase a subscription, sign in or sign up and try again.", { uid: opts.uid });
    (0, import_utils.public_assert)((0, import_utils.is_non_empty_string)(opts.uid), "invalid_argument", "Property 'uid' must be a non-empty string.");
    stripe_customer_id = await (0, import_customers.ensure_stripe_customer)(client, server, opts.uid);
  }
  const stripe_line_items = resolved_items.map((item) => {
    (0, import_utils.public_assert)((0, import_utils.is_non_empty_string)(item.product.stripe_price_id), "invalid_product", "Product is missing a Stripe price id.", { product_id: item.product.id, type: item.product.type });
    return {
      price: item.product.stripe_price_id,
      quantity: item.quantity
    };
  });
  let subscription_data;
  if (mode === "subscription") {
    const trial_days_values = /* @__PURE__ */ new Set();
    const billing_anchor_values = /* @__PURE__ */ new Set();
    for (const item of resolved_items) {
      if (item.product.type !== "subscription_plan") {
        continue;
      }
      const parent_subscription = (0, import_products.resolve_plan_to_parent_subscription)({
        plan: item.product,
        all_products: opts.all_products
      });
      if (parent_subscription.trial_days !== void 0) {
        trial_days_values.add(parent_subscription.trial_days);
      }
      const anchor = parent_subscription.billing_anchor ?? "immediately";
      billing_anchor_values.add(anchor);
    }
    (0, import_utils.public_assert)(trial_days_values.size <= 1, "invalid_product", "Conflicting 'trial_days' across subscription products in the same checkout.", { trial_days_values: Array.from(trial_days_values.values()) });
    (0, import_utils.public_assert)(billing_anchor_values.size <= 1, "invalid_product", "Conflicting 'billing_anchor' across subscription products in the same checkout.", { billing_anchor_values: Array.from(billing_anchor_values.values()) });
    const trial_days = Array.from(trial_days_values.values())[0];
    const billing_anchor = Array.from(billing_anchor_values.values())[0] ?? "immediately";
    subscription_data = {};
    if (trial_days !== void 0) {
      subscription_data.trial_period_days = trial_days;
    }
    if (billing_anchor === "first_of_month") {
      const now = /* @__PURE__ */ new Date();
      const trial_end_reference = trial_days !== void 0 ? (0, import_utils.add_days_utc)(now, trial_days) : now;
      const anchor_date = (0, import_utils.first_day_of_next_month_utc)(trial_end_reference);
      subscription_data.billing_cycle_anchor = (0, import_utils.to_unix_seconds)(anchor_date);
      subscription_data.proration_behavior = "none";
    } else if (billing_anchor === "immediately") {
    } else {
      throw new import_error.InternalStripeError("invalid_product", "Unsupported billing_anchor value.", { billing_anchor });
    }
    if (opts.uid) {
      subscription_data.metadata = {
        __volt_uid: opts.uid
      };
    }
  }
  const create_params = {
    // Docs: https://docs.stripe.com/api/checkout/sessions/create
    mode,
    ...stripe_customer_id ? { customer: stripe_customer_id } : {},
    success_url: opts.success_url,
    cancel_url: opts.cancel_url,
    line_items: stripe_line_items,
    customer_update: {
      address: "auto",
      name: "auto",
      shipping: "auto"
    },
    // Stripe Tax: collect address automatically for tax calculation.
    // Docs: https://docs.stripe.com/tax/checkout
    automatic_tax: { enabled: true },
    // Optional: tax id collection is helpful for B2B scenarios (e.g. VAT).
    ...opts.tax_id_collection_enabled === true ? { tax_id_collection: { enabled: true } } : {},
    // Attach safe session metadata (not secrets).
    metadata: {
      ...opts.uid ? { __volt_uid: opts.uid } : {},
      __volt_mode: mode
    },
    // Include subscription configuration only in subscription mode.
    ...subscription_data ? { subscription_data } : {}
  };
  const checkout_session_db = create_checkout_session_db(server);
  const loaded_session = await checkout_session_db.load({ session_id: opts.session_id }, { throw: false, retry: 3 });
  let pinned_session;
  if (loaded_session instanceof import_collection.Collection.NotFoundError) {
    const record = {
      uid: opts.uid,
      session_id: opts.session_id,
      currency,
      create_params
    };
    await checkout_session_db.set({ session_id: opts.session_id }, record, { throw: true, retry: 3 });
    pinned_session = record;
  } else if (loaded_session instanceof Error) {
    throw new import_error.InternalStripeError("checkout_create_error", "Failed to access checkout session record.", { uid: opts.uid, session_id: opts.session_id }, loaded_session);
  } else {
    if (loaded_session.currency !== currency || !vlib.Object.deep_eq(loaded_session.create_params, create_params)) {
      throw new import_error.ExternalStripeError("checkout_create_error", "A checkout session with the same session_id already exists with different parameters. Please use a unique session_id for each distinct checkout session.", { uid: opts.uid, session_id: opts.session_id });
    }
    pinned_session = loaded_session;
  }
  const session = await (0, import_utils.stripe_api_call)(() => client.checkout.sessions.create(pinned_session.create_params, {
    idempotencyKey: (0, import_utils.stable_idempotency_key)(`checkout.sessions.create:${pinned_session.session_id}`, 255)
  }), { operation: "checkout.sessions.create" });
  (0, import_utils.public_assert)((0, import_utils.is_non_empty_string)(session.url), "checkout_create_error", "Stripe did not return a checkout URL.", { session_id: session.id, mode: session.mode });
  const session_mode = session.mode === "subscription" ? "subscription" : "payment";
  return {
    id: session.id,
    url: session.url,
    mode: session_mode,
    currency: pinned_session.currency
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  create_checkout_session_id,
  start_checkout_session
});
