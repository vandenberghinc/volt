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
  cancel_user_subscription: () => cancel_user_subscription,
  create_user_subscription: () => create_user_subscription,
  delete_subscription_caches: () => delete_subscription_caches,
  enforce_single_subscription_plan: () => enforce_single_subscription_plan,
  is_user_subscribed_to: () => is_user_subscribed_to,
  list_subscribed_meters: () => list_subscribed_meters,
  list_subscribed_plans: () => list_subscribed_plans,
  update_subscription_record: () => update_subscription_record
});
module.exports = __toCommonJS(stdin_exports);
var vlib = __toESM(require("@vandenberghinc/vlib"));
var import_error = require("./error.js");
var import_customers = require("./customers.js");
var import_utils = require("./utils.js");
var import_collection = require("../../database/collection.js");
const subscription_record_cache = new vlib.Cache({
  max_size: 25e4,
  ttl: {
    sliding: true,
    // Short lived cache, see docstring why
    duration: 1e3 * 60 * 5
  }
});
async function list_all_customer_subscriptions(client, server, uid, customer_id) {
  (0, import_utils.assert)(uid.trim().length > 0, "invalid_argument", "Uid must be a non-empty string.", { uid });
  const ensured_customer_id = customer_id ?? await (0, import_customers.ensure_stripe_customer)(client, server, uid);
  const subscriptions = [];
  let starting_after;
  for (; ; ) {
    const page = await (0, import_utils.stripe_api_call)(() => client.subscriptions.list({
      customer: ensured_customer_id,
      status: "all",
      limit: 100,
      starting_after,
      // ALWAYS expand, since the callee's expect this.
      expand: ["data.items.data.price"]
    }), { operation: "subscriptions.list", customer_id: ensured_customer_id, starting_after });
    subscriptions.push(...page.data);
    if (!page.has_more || page.data.length === 0) {
      break;
    }
    const last = page.data[page.data.length - 1];
    (0, import_utils.assert)(last !== void 0, "api_error", "Stripe subscriptions pagination returned an empty last item.", {
      customer_id: ensured_customer_id,
      returned: page.data.length
    });
    starting_after = last.id;
  }
  return subscriptions;
}
function resolve_plan_parent_subscription(opts) {
  for (const product of opts.all_products) {
    if (product.type === "subscription" && product.id === opts.plan.subscription_id) {
      return product;
    }
  }
  throw new import_error.InternalStripeError("invalid_product", "Subscription plan refers to a missing parent subscription product.", { plan_id: opts.plan.id, subscription_id: opts.plan.subscription_id });
}
async function resolve_default_payment_method_id(client, opts) {
  const customer = await (0, import_utils.stripe_api_call)(() => client.customers.retrieve(opts.stripe_customer_id, {
    expand: ["invoice_settings.default_payment_method"]
  }), { operation: "customers.retrieve", uid: opts.uid, stripe_customer_id: opts.stripe_customer_id });
  (0, import_utils.public_assert)(customer.deleted !== true, "customer_not_found", "Stripe customer was not found.", { uid: opts.uid, stripe_customer_id: opts.stripe_customer_id });
  const invoice_settings = customer.invoice_settings;
  const default_payment_method = invoice_settings?.default_payment_method;
  if (typeof default_payment_method === "string") {
    return default_payment_method;
  }
  if (default_payment_method && typeof default_payment_method === "object") {
    const id = default_payment_method.id;
    if (typeof id === "string" && id.trim().length > 0) {
      return id;
    }
  }
  throw new import_error.ExternalStripeError("payment_method_missing", "No default payment method on file. Please add a payment method before subscribing.", { uid: opts.uid, stripe_customer_id: opts.stripe_customer_id });
}
function resolve_payment_intent_from_subscription(subscription) {
  const latest_invoice = subscription.latest_invoice;
  if (!latest_invoice || typeof latest_invoice === "string") {
    return null;
  }
  const payment_intent = latest_invoice.payment_intent;
  if (!payment_intent || typeof payment_intent === "string") {
    return null;
  }
  return payment_intent;
}
function build_subscription_create_params_from_product(opts) {
  const parent = opts.parent_subscription;
  const subscription_params = {
    // Safe metadata for reconciliation and security auditing.
    metadata: {
      __volt_uid: opts.uid,
      __volt_subscription_id: parent.id
    }
  };
  if (parent.trial_days !== void 0) {
    subscription_params.trial_period_days = parent.trial_days;
  }
  const billing_anchor = parent.billing_anchor ?? "immediately";
  if (billing_anchor === "immediately") {
    return subscription_params;
  }
  if (billing_anchor === "first_of_month") {
    const now = /* @__PURE__ */ new Date();
    const trial_days = parent.trial_days;
    const trial_end_reference = trial_days !== void 0 ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + trial_days, now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds())) : now;
    const anchor_date = new Date(Date.UTC(trial_end_reference.getUTCFullYear(), trial_end_reference.getUTCMonth() + 1, 1, 0, 0, 0, 0));
    subscription_params.billing_cycle_anchor = Math.floor(anchor_date.getTime() / 1e3);
    subscription_params.proration_behavior = "none";
    return subscription_params;
  }
  throw new import_error.InternalStripeError("invalid_product", "Unsupported billing_anchor value.", { billing_anchor, subscription_id: parent.id });
}
function create_subscriptions_db(server) {
  return server.db.collection({
    name: "Volt.Stripe.Subscriptions",
    indexes: [
      {
        keys: { uid: 1 },
        unique: true
      }
    ],
    // Ensure its not unique so we retrieve the cached collection if already created.
    unique: false
  });
}
async function update_subscription_record(client, server, opts) {
  const subscriptions = await list_all_customer_subscriptions(client, server, opts.uid, void 0);
  const sub_price_id_to_plan_id = /* @__PURE__ */ new Map();
  const meter_price_id_to_product_id = /* @__PURE__ */ new Map();
  for (const product of opts.all_products) {
    if (product.type === "subscription") {
      for (const plan of product.plans) {
        sub_price_id_to_plan_id.set(plan.stripe_price_id, plan.id);
      }
    } else if (product.type === "meter") {
      meter_price_id_to_product_id.set(product.stripe_price_id, product.id);
    } else if (product.type !== "one_time") {
      product.toString();
    }
  }
  const record = {
    uid: opts.uid,
    subscriptions: {},
    meters: {}
  };
  for (const subscription of subscriptions) {
    switch (subscription.status) {
      // Store all semi-active statuses, they can later be filtered.
      case "active":
      case "trialing":
      case "past_due": {
        for (const item of subscription.items.data) {
          const price = item.price;
          if (!price) {
            continue;
          }
          if (sub_price_id_to_plan_id.has(price.id)) {
            const plan_id = sub_price_id_to_plan_id.get(price.id);
            if (!plan_id) {
              continue;
            }
            record.subscriptions[plan_id] = subscription.status;
          }
          if (meter_price_id_to_product_id.has(price.id)) {
            const product_id = meter_price_id_to_product_id.get(price.id);
            if (!product_id) {
              continue;
            }
            record.meters[product_id] = subscription.status;
          }
        }
        break;
      }
      default:
        break;
    }
  }
  const db = create_subscriptions_db(server);
  await db.set({ uid: opts.uid }, record, {
    // ensure we do not flatten the subscriptions object so we can remove old plans that are no longer active.
    flatten: false,
    upsert: true,
    retry: 3
  });
}
async function load_subscription_record(server, opts) {
  const use_cache = opts.cache ?? true;
  if (use_cache) {
    const cached = subscription_record_cache.get(opts.uid);
    if (cached != null) {
      return cached;
    }
  }
  const db = create_subscriptions_db(server);
  const record = await db.load({ uid: opts.uid }, { throw: false });
  if (record instanceof Error) {
    if (record instanceof import_collection.Collection.NotFoundError) {
      const empty_record = { uid: opts.uid, subscriptions: {}, meters: {} };
      subscription_record_cache.set(opts.uid, empty_record);
      return empty_record;
    }
    throw record;
  }
  subscription_record_cache.set(opts.uid, record);
  return record;
}
function delete_subscription_caches(uid) {
  subscription_record_cache.delete(uid);
}
async function list_subscribed_plans(client, server, opts) {
  (0, import_utils.assert)(opts.uid.trim().length > 0, "invalid_argument", "Uid must be a non-empty string.", { uid: opts.uid });
  const record = await load_subscription_record(server, { uid: opts.uid });
  const active_statuses = new Set(opts.status ?? [
    "active",
    "trialing",
    "past_due"
  ]);
  const active = {};
  for (const [id, status] of Object.entries(record.subscriptions)) {
    if (!active_statuses.has(status)) {
      continue;
    }
    active[id] = status;
  }
  return active;
}
async function list_subscribed_meters(client, server, opts) {
  const record = await load_subscription_record(server, { uid: opts.uid });
  const active_statuses = new Set(opts.status ?? [
    "active"
    // We dont allow `trialing` and `past_due` to reduce risk of accidental/abusive access.
  ]);
  const active = {};
  for (const [id, status] of Object.entries(record.meters)) {
    if (!active_statuses.has(status)) {
      continue;
    }
    active[id] = status;
  }
  return active;
}
async function is_user_subscribed_to(client, server, opts) {
  (0, import_utils.assert)(opts.plan.id.trim().length > 0, "invalid_argument", "Plan.id must be a non-empty string.", { plan_id: opts.plan.id });
  if (opts.plan.type === "meter") {
    const subscribed_plans = await list_subscribed_meters(client, server, {
      uid: opts.uid,
      stripe_customer_id: opts.customer_id ?? await (0, import_customers.ensure_stripe_customer)(client, server, opts.uid),
      all_products: opts.all_products,
      status: opts.status
    });
    return Object.keys(subscribed_plans).includes(opts.plan.id);
  } else {
    const subscribed_plans = await list_subscribed_plans(client, server, {
      uid: opts.uid,
      customer_id: opts.customer_id,
      all_products: opts.all_products,
      status: opts.status
    });
    return Object.keys(subscribed_plans).includes(opts.plan.id);
  }
  return false;
}
async function create_user_subscription(client, server, opts) {
  (0, import_utils.public_assert)((0, import_utils.is_non_empty_string)(opts.uid), "invalid_argument", "Property 'uid' must be a non-empty string.");
  (0, import_utils.assert)(Array.isArray(opts.all_products), "invalid_argument", "Property 'all_products' must be an array.");
  (0, import_utils.assert)(opts.target.id.trim().length > 0, "invalid_argument", "Target.id must be non-empty.", { target_id: opts.target.id });
  delete_subscription_caches(opts.uid);
  const stripe_customer_id = await (0, import_customers.ensure_stripe_customer)(client, server, opts.uid);
  const default_payment_method_id = await resolve_default_payment_method_id(client, {
    uid: opts.uid,
    stripe_customer_id
  });
  const idempotency_key = (0, import_utils.stable_idempotency_key)(`sub_create:${opts.uid}:${opts.idempotency_key}`);
  const base_params = {
    customer: stripe_customer_id,
    // We always charge automatically for subscriptions.
    // Docs: https://docs.stripe.com/api/subscriptions/create#create_subscription-collection_method
    collection_method: "charge_automatically",
    // Use the default invoice payment method for off-session charges.
    // Docs: https://docs.stripe.com/api/subscriptions/create#create_subscription-default_payment_method
    default_payment_method: default_payment_method_id,
    // Crucial: create an incomplete subscription when payment can't be completed immediately,
    // so we can surface the PaymentIntent client_secret to the UI for SCA/3DS.
    // Docs: https://docs.stripe.com/billing/subscriptions/overview#handling-incomplete-subscriptions
    payment_behavior: "default_incomplete",
    // Safe metadata only.
    metadata: {
      __volt_uid: opts.uid,
      __volt_target_id: opts.target.id,
      __volt_target_type: opts.target.type
    }
  };
  if (opts.target.type === "subscription_plan") {
    const parent_subscription = resolve_plan_parent_subscription({
      plan: opts.target,
      all_products: opts.all_products
    });
    const subscription_level_params = build_subscription_create_params_from_product({
      uid: opts.uid,
      parent_subscription
    });
    base_params.items = [{ price: opts.target.stripe_price_id, quantity: 1 }];
    base_params.trial_period_days = subscription_level_params.trial_period_days;
    base_params.billing_cycle_anchor = subscription_level_params.billing_cycle_anchor;
    base_params.proration_behavior = subscription_level_params.proration_behavior;
    base_params.metadata = {
      ...base_params.metadata ?? {},
      ...subscription_level_params.metadata ?? {},
      __volt_subscription_id: parent_subscription.id,
      __volt_plan_id: opts.target.id
    };
  } else if (opts.target.type === "meter") {
    base_params.items = [{ price: opts.target.stripe_price_id, quantity: 1 }];
    base_params.metadata = {
      ...base_params.metadata ?? {},
      __volt_meter_product_id: opts.target.id,
      __volt_meter_event_name: opts.target.meter_event_name
    };
  } else {
    opts.target.toString();
    throw new import_error.InternalStripeError("invalid_argument", "Unsupported subscription target type.", { target_type: opts.target.type });
  }
  const subscription = await (0, import_utils.stripe_api_call)(() => client.subscriptions.create({
    ...base_params,
    // Expand payment intent so we can return client_secret for SCA, if required.
    // Docs: https://docs.stripe.com/expand
    expand: ["latest_invoice.payment_intent"]
  }, { idempotencyKey: idempotency_key }), {
    operation: "subscriptions.create",
    uid: opts.uid,
    stripe_customer_id,
    target_id: opts.target.id,
    target_type: opts.target.type
  });
  delete_subscription_caches(opts.uid);
  const payment_intent = resolve_payment_intent_from_subscription(subscription);
  if (payment_intent && payment_intent.status === "requires_action") {
    const client_secret = payment_intent.client_secret;
    (0, import_utils.public_assert)((0, import_utils.is_non_empty_string)(client_secret), "subscription_payment_action_required", "Additional payment verification is required, but Stripe did not return a client secret.", { subscription_id: subscription.id, payment_intent_id: payment_intent.id });
    return {
      type: "requires_action",
      subscription_id: subscription.id,
      stripe_customer_id,
      payment_intent_id: payment_intent.id,
      client_secret,
      status: subscription.status
    };
  }
  if (payment_intent && payment_intent.status === "requires_payment_method") {
    throw new import_error.ExternalStripeError("payment_method_missing", "Your default payment method could not be charged. Please update your payment method and try again.", { subscription_id: subscription.id, payment_intent_id: payment_intent.id });
  }
  if (subscription.status === "incomplete" || subscription.status === "incomplete_expired") {
    throw new import_error.InternalStripeError("subscription_create_error", "Subscription was created in an incomplete state without a resolvable PaymentIntent.", {
      uid: opts.uid,
      stripe_customer_id,
      subscription_id: subscription.id,
      status: subscription.status,
      has_latest_invoice: subscription.latest_invoice != null,
      has_payment_intent: payment_intent != null
    });
  }
  return {
    type: "created",
    subscription_id: subscription.id,
    stripe_customer_id,
    status: subscription.status
  };
}
async function cancel_user_subscription(client, server, opts) {
  const uid = opts.uid;
  (0, import_utils.assert)(uid.trim().length > 0, "invalid_argument", "Uid must be a non-empty string.", { uid });
  (0, import_utils.assert)(opts.plan.id.trim().length > 0, "invalid_argument", "Plan.id must be non-empty.", { plan_id: opts.plan.id });
  (0, import_utils.assert)(opts.plan.stripe_price_id.trim().length > 0, "invalid_argument", "Plan.stripe_price_id must be non-empty.", { plan_id: opts.plan.id });
  const cancel_at_period_end = opts.cancel_at_period_end ?? true;
  delete_subscription_caches(uid);
  const subscriptions = await list_all_customer_subscriptions(client, server, uid, opts.customer_id);
  const active_sub_status = /* @__PURE__ */ new Set([
    "active",
    "trialing",
    "past_due"
    // since Stripe can keep subscriptions in past_due while retrying payment.
  ]);
  const affected_subscriptions = [];
  for (const subscription of subscriptions) {
    if (!active_sub_status.has(subscription.status)) {
      continue;
    }
    let matches_plan = false;
    for (const item of subscription.items.data) {
      const price = item.price;
      if (!price) {
        continue;
      }
      if (price.id === opts.plan.stripe_price_id) {
        matches_plan = true;
        break;
      }
    }
    if (!matches_plan) {
      continue;
    }
    affected_subscriptions.push(subscription);
  }
  if (affected_subscriptions.length === 0) {
    delete_subscription_caches(uid);
    return [];
  }
  await Promise.all(affected_subscriptions.map(async (subscription) => {
    if (cancel_at_period_end) {
      await (0, import_utils.stripe_api_call)(() => client.subscriptions.update(subscription.id, { cancel_at_period_end: true }, { idempotencyKey: (0, import_utils.stable_idempotency_key)(`sub_update_cancel_at_period_end:${subscription.id}`) }), {
        operation: "subscriptions.update",
        action: "cancel_at_period_end",
        uid,
        subscription_id: subscription.id,
        plan_id: opts.plan.id,
        stripe_price_id: opts.plan.stripe_price_id
      });
    } else {
      await (0, import_utils.stripe_api_call)(() => client.subscriptions.cancel(subscription.id, void 0, { idempotencyKey: (0, import_utils.stable_idempotency_key)(`sub_cancel_immediate:${subscription.id}`) }), {
        operation: "subscriptions.cancel",
        action: "cancel_immediately",
        uid,
        subscription_id: subscription.id,
        plan_id: opts.plan.id,
        stripe_price_id: opts.plan.stripe_price_id
      });
    }
  }));
  delete_subscription_caches(uid);
  return affected_subscriptions;
}
async function enforce_single_subscription_plan(client, server, opts) {
  (0, import_utils.assert)(opts.uid.length > 0, "invalid_argument", "uid must be provided");
  (0, import_utils.assert)(opts.stripe_customer_id.length > 0, "invalid_argument", "stripe_customer_id must be provided");
  const { new_subscription, all_products } = opts;
  const active_sub_status = /* @__PURE__ */ new Set([
    "active",
    "trialing",
    "past_due"
  ]);
  if (!active_sub_status.has(new_subscription.status)) {
    return [];
  }
  const price_to_subscription_product = /* @__PURE__ */ new Map();
  for (const product of all_products) {
    if (product.type !== "subscription")
      continue;
    for (const plan of product.plans) {
      price_to_subscription_product.set(plan.stripe_price_id, product);
    }
  }
  const resolved_products = /* @__PURE__ */ new Set();
  for (const item of new_subscription.items.data) {
    const price = item.price;
    if (!price)
      continue;
    (0, import_utils.assert)(typeof price !== "string", "invalid_argument", "new_subscription.items.data.price must be expanded.", {
      subscription_id: new_subscription.id
    });
    const sub_product = price_to_subscription_product.get(price.id);
    if (sub_product) {
      resolved_products.add(sub_product);
    }
  }
  if (resolved_products.size === 0) {
    return [];
  }
  if (resolved_products.size > 1) {
    throw new import_error.InternalStripeError("subscription_resolution_error", "Subscription resolves to multiple subscription products.", {
      subscription_id: new_subscription.id,
      subscription_product_ids: [...resolved_products].map((p) => p.id)
    });
  }
  const [subscription_product] = [...resolved_products];
  const product_price_ids = new Set(subscription_product.plans.map((p) => p.stripe_price_id));
  const all_subscriptions = await list_all_customer_subscriptions(client, server, opts.uid, opts.stripe_customer_id);
  const canceled = [];
  for (const sub of all_subscriptions) {
    if (sub.id === new_subscription.id)
      continue;
    if (!active_sub_status.has(sub.status))
      continue;
    let overlaps = false;
    for (const item of sub.items.data) {
      const price = item.price;
      if (!price)
        continue;
      (0, import_utils.assert)(typeof price !== "string", "api_error", "Expected expanded item.price from subscriptions.list expand.", {
        subscription_id: sub.id
      });
      if (product_price_ids.has(price.id)) {
        overlaps = true;
        break;
      }
    }
    if (!overlaps)
      continue;
    await (0, import_utils.stripe_api_call)(() => client.subscriptions.cancel(sub.id, void 0, {
      idempotencyKey: opts.idempotency_key ?? (0, import_utils.stable_idempotency_key)(`enforce_single_plan:${opts.stripe_customer_id}:${new_subscription.id}:${sub.id}`)
    }), {
      operation: "subscriptions.cancel",
      action: "enforce_single_plan",
      uid: opts.uid,
      stripe_customer_id: opts.stripe_customer_id,
      kept_subscription_id: new_subscription.id,
      canceled_subscription_id: sub.id,
      subscription_product_id: subscription_product.id
    });
    canceled.push(sub);
  }
  if (canceled.length > 0) {
    delete_subscription_caches(opts.uid);
  }
  return canceled;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  cancel_user_subscription,
  create_user_subscription,
  delete_subscription_caches,
  enforce_single_subscription_plan,
  is_user_subscribed_to,
  list_subscribed_meters,
  list_subscribed_plans,
  update_subscription_record
});
