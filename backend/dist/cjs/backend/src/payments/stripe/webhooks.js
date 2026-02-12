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
  handle_stripe_webhook: () => handle_stripe_webhook,
  register_or_update_stripe_webhook_endpoint: () => register_or_update_stripe_webhook_endpoint
});
module.exports = __toCommonJS(stdin_exports);
var vlib = __toESM(require("@vandenberghinc/vlib"));
var import_collection = require("../../database/collection.js");
var import_error = require("./error.js");
var import_utils = require("./utils.js");
var import_products = require("./products.js");
var import_subscriptions = require("./subscriptions.js");
var import_payment_methods = require("./payment_methods.js");
const stripe_uid_metadata_key = "__volt_uid";
const processed_event_id_cache = new vlib.Cache({
  max_size: 25e4,
  ttl: {
    sliding: true,
    duration: 10 * 60 * 1e3
    // 10 minutes
  }
});
const inflight_event_id_cache = new vlib.Cache({
  max_size: 25e4,
  ttl: {
    sliding: true,
    duration: 60 * 1e3 * 5
    // 5 minutes
  }
});
function index_products_by_stripe_price_id(all_products) {
  const plan_by_price_id = /* @__PURE__ */ new Map();
  const meter_by_price_id = /* @__PURE__ */ new Map();
  for (const product of all_products) {
    if (product.type === "subscription") {
      for (const plan of product.plans) {
        plan_by_price_id.set(plan.stripe_price_id, plan);
      }
    } else if (product.type === "meter") {
      meter_by_price_id.set(product.stripe_price_id, product);
    } else if (product.type === "one_time") {
    } else {
      product.type.toString();
      throw new import_error.InternalStripeError("invalid_product", "Unknown product type.", { product_type: product.type });
    }
  }
  return { plan_by_price_id, meter_by_price_id };
}
function resolve_subscription_items(opts) {
  const { plan_by_price_id, meter_by_price_id } = index_products_by_stripe_price_id(opts.all_products);
  const resolved = [];
  for (const item of opts.subscription.items.data) {
    const price = item.price;
    if (!price) {
      continue;
    }
    const stripe_price_id = price.id;
    const plan = plan_by_price_id.get(stripe_price_id) ?? void 0;
    const meter_product = meter_by_price_id.get(stripe_price_id) ?? void 0;
    if (plan) {
      const product = (0, import_products.resolve_plan_to_parent_subscription)({
        plan,
        all_products: opts.all_products
      });
      resolved.push({
        stripe_price_id,
        product,
        plan
      });
    } else if (meter_product) {
      resolved.push({
        stripe_price_id,
        product: meter_product
      });
    } else {
      resolved.push({ stripe_price_id });
    }
  }
  return resolved;
}
function construct_stripe_event(client, opts) {
  try {
    return client.webhooks.constructEvent(opts.raw_body, opts.stripe_signature_header, opts.webhook_signing_secret);
  } catch (error) {
    throw new import_error.InternalStripeError("invalid_argument", "Invalid Stripe webhook signature.", { has_signature: (0, import_utils.is_non_empty_string)(opts.stripe_signature_header) }, error);
  }
}
async function await_event_trigger(response) {
  const promises = response.filter((r) => Boolean(r));
  await Promise.all(promises);
}
const required_stripe_webhook_events = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "setup_intent.succeeded"
];
const webhook_metadata_app_id = "__volt_webhook_app_id";
function create_stripe_webhook_endpoints_db(server) {
  return server.db.collection({
    name: "Volt.Stripe.WebhookEndpoints",
    indexes: [
      {
        keys: { webhook_app_id: 1 },
        unique: true
      }
    ],
    // No TTL: webhook endpoints are long-lived configuration.
    unique: false
  });
}
function assert_https_webhook_url(webhook_url) {
  (0, import_utils.assert)((0, import_utils.is_non_empty_string)(webhook_url), "invalid_argument", "Property 'webhook_url' must be a non-empty string.");
  let parsed;
  try {
    parsed = new URL(webhook_url);
  } catch (error) {
    throw new import_error.InternalStripeError("invalid_argument", "Property 'webhook_url' must be a valid absolute URL.", { webhook_url }, error);
  }
  (0, import_utils.assert)(parsed.protocol === "https:", "invalid_argument", "Property 'webhook_url' must use https.", { webhook_url });
}
function same_event_set(a, b) {
  if (a.length !== b.length)
    return false;
  const set_a = new Set(a);
  if (set_a.size !== b.length)
    return false;
  for (const ev of b) {
    if (!set_a.has(ev))
      return false;
  }
  return true;
}
function extract_webhook_secret(endpoint) {
  const secret = endpoint.secret;
  return (0, import_utils.is_non_empty_string)(secret) ? secret : void 0;
}
async function find_stripe_webhook_by_app_id(client, webhook_app_id) {
  let starting_after;
  for (; ; ) {
    const page = await (0, import_utils.stripe_api_call)(() => client.webhookEndpoints.list({ limit: 100, ...starting_after ? { starting_after } : {} }), { operation: "webhookEndpoints.list", webhook_app_id });
    for (const endpoint of page.data) {
      if (endpoint.metadata?.[webhook_metadata_app_id] === webhook_app_id) {
        return endpoint;
      }
    }
    if (!page.has_more)
      return void 0;
    const last = page.data[page.data.length - 1];
    if (!last)
      return void 0;
    starting_after = last.id;
  }
}
async function register_or_update_stripe_webhook_endpoint(client, server, opts) {
  assert_https_webhook_url(opts.webhook_url);
  (0, import_utils.assert)((0, import_utils.is_non_empty_string)(opts.webhook_app_id), "invalid_argument", "Property 'webhook_app_id' must be a non-empty string.");
  const ensure_enabled = opts.ensure_enabled !== false;
  const enabled_events = Array.from(required_stripe_webhook_events);
  const webhook_endpoints_db = create_stripe_webhook_endpoints_db(server);
  const loaded = await webhook_endpoints_db.load({ webhook_app_id: opts.webhook_app_id }, { throw: false, retry: 3 });
  if (!(loaded instanceof Error)) {
    let endpoint;
    try {
      endpoint = await (0, import_utils.stripe_api_call)(() => client.webhookEndpoints.retrieve(loaded.stripe_webhook_endpoint_id), {
        operation: "webhookEndpoints.retrieve",
        stripe_webhook_endpoint_id: loaded.stripe_webhook_endpoint_id,
        webhook_url: opts.webhook_url
      });
    } catch (error) {
      const by_app_id = await find_stripe_webhook_by_app_id(client, opts.webhook_app_id);
      if (!by_app_id)
        throw error;
      endpoint = by_app_id;
    }
    if (endpoint.metadata?.[webhook_metadata_app_id] !== opts.webhook_app_id) {
      const by_app_id = await find_stripe_webhook_by_app_id(client, opts.webhook_app_id);
      if (!by_app_id) {
        throw new import_error.InternalStripeError("webhook_endpoint_app_id_mismatch", "Webhook endpoint app id does not match and no endpoint was found for webhook_app_id.", { webhook_url: opts.webhook_url, webhook_app_id: opts.webhook_app_id });
      }
      throw new import_error.InternalStripeError("webhook_endpoint_secret_missing", "Stripe webhook endpoint for webhook_app_id exists but signing secret is not available via DB lookup. Store the whsec_ value at creation time.", { webhook_url: opts.webhook_url, stripe_webhook_endpoint_id: by_app_id.id, webhook_app_id: opts.webhook_app_id });
    }
    const needs_event_update = !same_event_set(endpoint.enabled_events ?? [], enabled_events);
    const needs_enable = ensure_enabled && endpoint.status !== "enabled";
    if (needs_event_update || needs_enable) {
      const update_params = {
        enabled_events,
        ...needs_enable ? { disabled: false } : {},
        ...(0, import_utils.is_non_empty_string)(opts.description) ? { description: opts.description.trim() } : {},
        metadata: {
          ...endpoint.metadata ?? {},
          [webhook_metadata_app_id]: opts.webhook_app_id
        }
      };
      await (0, import_utils.stripe_api_call)(() => client.webhookEndpoints.update(endpoint.id, update_params, {
        // Stable idempotency ensures safe retries without duplicating config writes.
        idempotencyKey: (0, import_utils.stable_idempotency_key)(`webhook_endpoints.update:${endpoint.id}:${opts.webhook_url}`, 255)
      }), {
        operation: "webhookEndpoints.update",
        stripe_webhook_endpoint_id: endpoint.id,
        webhook_url: opts.webhook_url
      });
    }
    const updated_record = {
      webhook_url: opts.webhook_url,
      stripe_webhook_endpoint_id: loaded.stripe_webhook_endpoint_id,
      webhook_signing_secret: loaded.webhook_signing_secret,
      enabled_events: enabled_events.slice(),
      updated_at_ms: Date.now(),
      webhook_app_id: opts.webhook_app_id
    };
    await webhook_endpoints_db.set({ webhook_app_id: opts.webhook_app_id }, updated_record, { throw: true, retry: 3 });
    return {
      stripe_webhook_endpoint_id: updated_record.stripe_webhook_endpoint_id,
      webhook_signing_secret: updated_record.webhook_signing_secret,
      enabled_events: updated_record.enabled_events
    };
  }
  if (loaded instanceof Error && !(loaded instanceof import_collection.Collection.NotFoundError)) {
    throw new import_error.InternalStripeError("webhook_endpoint_load_error", "Failed to access webhook endpoints record.", { webhook_url: opts.webhook_url }, loaded);
  }
  const existing = await find_stripe_webhook_by_app_id(client, opts.webhook_app_id);
  if (existing) {
    const needs_event_update = !same_event_set(existing.enabled_events ?? [], enabled_events);
    const needs_enable = ensure_enabled && existing.status !== "enabled";
    const needs_url_update = existing.url !== opts.webhook_url;
    if (needs_event_update || needs_enable || needs_url_update) {
      const update_params = {
        enabled_events,
        ...needs_enable ? { disabled: false } : {},
        ...(0, import_utils.is_non_empty_string)(opts.description) ? { description: opts.description.trim() } : {},
        ...needs_url_update ? { url: opts.webhook_url } : {},
        metadata: {
          ...existing.metadata ?? {},
          [webhook_metadata_app_id]: opts.webhook_app_id
        }
      };
      await (0, import_utils.stripe_api_call)(() => client.webhookEndpoints.update(existing.id, update_params, {
        idempotencyKey: (0, import_utils.stable_idempotency_key)(`webhook_endpoints.update:${existing.id}:${opts.webhook_url}`, 255)
      }), {
        operation: "webhookEndpoints.update",
        stripe_webhook_endpoint_id: existing.id,
        webhook_url: opts.webhook_url
      });
    }
    throw new import_error.InternalStripeError("webhook_endpoint_secret_missing", "Stripe webhook endpoint exists but signing secret is not available. Store the whsec_ value at creation time.", { webhook_url: opts.webhook_url, stripe_webhook_endpoint_id: existing.id });
  }
  const create_params = {
    // Docs: https://docs.stripe.com/api/webhook_endpoints/create
    url: opts.webhook_url,
    enabled_events,
    ...(0, import_utils.is_non_empty_string)(opts.description) ? { description: opts.description.trim() } : {},
    metadata: {
      [webhook_metadata_app_id]: opts.webhook_app_id
    }
  };
  const created = await (0, import_utils.stripe_api_call)(() => client.webhookEndpoints.create(create_params, {
    // Stable idempotency ensures safe retries without creating multiple endpoints.
    idempotencyKey: (0, import_utils.stable_idempotency_key)(`webhook_endpoints.create:${opts.webhook_app_id}:${opts.webhook_url}`, 255)
  }), { operation: "webhookEndpoints.create", webhook_app_id: opts.webhook_app_id });
  const webhook_signing_secret = extract_webhook_secret(created);
  if (!webhook_signing_secret) {
    throw new import_error.InternalStripeError("webhook_endpoint_secret_missing", "Stripe did not return a webhook signing secret on endpoint creation.", { webhook_url: opts.webhook_url, stripe_webhook_endpoint_id: created.id });
  }
  if (ensure_enabled && created.status !== "enabled") {
    await (0, import_utils.stripe_api_call)(() => client.webhookEndpoints.update(created.id, { disabled: false }, {
      idempotencyKey: (0, import_utils.stable_idempotency_key)(`webhook_endpoints.enable:${created.id}:${opts.webhook_url}`, 255)
    }), {
      operation: "webhookEndpoints.update",
      stripe_webhook_endpoint_id: created.id,
      webhook_url: opts.webhook_url
    });
  }
  const record = {
    webhook_url: opts.webhook_url,
    stripe_webhook_endpoint_id: created.id,
    webhook_signing_secret,
    enabled_events: enabled_events.slice(),
    updated_at_ms: Date.now(),
    webhook_app_id: opts.webhook_app_id
  };
  await webhook_endpoints_db.set({ webhook_app_id: opts.webhook_app_id }, record, { throw: true, retry: 3 });
  return {
    stripe_webhook_endpoint_id: record.stripe_webhook_endpoint_id,
    webhook_signing_secret: record.webhook_signing_secret,
    enabled_events: record.enabled_events
  };
}
async function handle_stripe_webhook(client, opts) {
  try {
    (0, import_utils.assert)((0, import_utils.is_non_empty_string)(opts.webhook_signing_secret), "invalid_argument", "webhook_signing_secret must be provided.");
    (0, import_utils.assert)((0, import_utils.is_non_empty_string)(opts.stripe_signature_header), "invalid_argument", "stripe_signature_header must be provided.");
    (0, import_utils.assert)(Array.isArray(opts.all_products), "invalid_argument", "all_products must be an array.");
    (0, import_utils.assert)(Buffer.isBuffer(opts.raw_body), "invalid_argument", "raw_body must be a Buffer.");
    const event = construct_stripe_event(client, {
      webhook_signing_secret: opts.webhook_signing_secret,
      raw_body: opts.raw_body,
      stripe_signature_header: opts.stripe_signature_header
    });
    if (processed_event_id_cache.get(event.id) === true) {
      opts.server.log(1, "Stripe webhook deduplicated event: ", { event_id: event.id, type: event.type });
      opts.stream.success({ status: 200, data: { received: true, deduplicated: true } });
      return;
    }
    if (inflight_event_id_cache.get(event.id) === true) {
      opts.server.log(1, "Stripe webhook already inflight: ", { event_id: event.id, type: event.type });
      opts.stream.success({ status: 200, data: { received: true, inflight: true } });
      return;
    }
    inflight_event_id_cache.set(event.id, true);
    try {
      switch (event.type) {
        case "checkout.session.completed": {
          opts.server.log(1, "Stripe webhook received checkout.session.completed: ", { event_id: event.id });
          const session = event.data.object;
          const stripe_session_id = session.id;
          (0, import_utils.assert)((0, import_utils.is_non_empty_string)(stripe_session_id), "api_error", "checkout.session.completed missing session.id");
          const uid = session.metadata?.[stripe_uid_metadata_key];
          if (!(0, import_utils.is_non_empty_string)(uid)) {
            throw new import_error.InternalStripeError("invalid_argument", "Checkout session missing uid metadata.", { stripe_session_id });
          }
          const mode = session.mode === "subscription" ? "subscription" : session.mode === "setup" ? "setup" : "payment";
          const stripe_customer_id = typeof session.customer === "string" ? session.customer : session.customer && typeof session.customer === "object" ? session.customer.id : void 0;
          (0, import_utils.assert)((0, import_utils.is_non_empty_string)(stripe_customer_id), "api_error", "Checkout session missing customer id.", {
            uid,
            stripe_session_id
          });
          const stripe_subscription_id = typeof session.subscription === "string" ? session.subscription : void 0;
          const currency = (0, import_utils.is_non_empty_string)(session.currency) ? session.currency : void 0;
          const metadata = session.metadata ?? {};
          (0, import_subscriptions.delete_subscription_caches)(uid);
          await await_event_trigger(opts.server.events.trigger("stripe.checkout_session_completed", {
            uid,
            stripe_session_id,
            mode,
            stripe_customer_id,
            stripe_subscription_id,
            currency,
            metadata
          }));
          processed_event_id_cache.set(event.id, true);
          opts.stream.success({ status: 200, data: { received: true } });
          return;
        }
        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          opts.server.log(1, "Stripe webhook received subscription event: ", { event_id: event.id, type: event.type });
          const subscription = event.data.object;
          const stripe_subscription_id = subscription.id;
          (0, import_utils.assert)((0, import_utils.is_non_empty_string)(stripe_subscription_id), "api_error", "Subscription event missing subscription.id");
          const stripe_customer_id_value = subscription.customer;
          const stripe_customer_id = typeof stripe_customer_id_value === "string" ? stripe_customer_id_value : stripe_customer_id_value.id;
          (0, import_utils.assert)((0, import_utils.is_non_empty_string)(stripe_customer_id), "api_error", "Subscription event missing customer id", {
            stripe_subscription_id
          });
          let uid = subscription.metadata?.[stripe_uid_metadata_key];
          if (!(0, import_utils.is_non_empty_string)(uid)) {
            const customer = await (0, import_utils.stripe_api_call)(() => client.customers.retrieve(stripe_customer_id), { operation: "customers.retrieve", stripe_customer_id, reason: "resolve_uid_fallback" });
            if ("deleted" in customer && customer.deleted === true) {
              throw new import_error.InternalStripeError("customer_not_found", "Subscription references a deleted customer.", { stripe_subscription_id, stripe_customer_id });
            }
            uid = customer.metadata?.[stripe_uid_metadata_key];
          }
          if (!(0, import_utils.is_non_empty_string)(uid)) {
            throw new import_error.InternalStripeError("invalid_argument", "Subscription missing uid metadata (subscription + customer).", { stripe_subscription_id, stripe_customer_id });
          }
          const typed_subscription = await (0, import_utils.stripe_api_call)(() => client.subscriptions.retrieve(stripe_subscription_id, {
            expand: ["items.data.price"]
          }), {
            operation: "subscriptions.retrieve",
            stripe_subscription_id,
            stripe_customer_id,
            uid
          });
          (0, import_subscriptions.delete_subscription_caches)(uid);
          if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
            await (0, import_subscriptions.enforce_single_subscription_plan)(client, opts.server, {
              uid,
              stripe_customer_id,
              new_subscription: typed_subscription,
              all_products: opts.all_products,
              idempotency_key: (0, import_utils.stable_idempotency_key)(`enforce_single_subscription_plan:${event.id}`)
            });
          }
          await (0, import_subscriptions.update_subscription_record)(client, opts.server, {
            uid,
            all_products: opts.all_products
          });
          const items = resolve_subscription_items({
            subscription: typed_subscription,
            all_products: opts.all_products
          });
          const cancel_at_period_end = typed_subscription.cancel_at_period_end ?? void 0;
          if (event.type === "customer.subscription.created") {
            await await_event_trigger(opts.server.events.trigger("stripe.subscription_created", {
              uid,
              stripe_subscription_id: typed_subscription.id,
              stripe_customer_id,
              status: typed_subscription.status,
              items
            }));
          } else if (event.type === "customer.subscription.updated") {
            await await_event_trigger(opts.server.events.trigger("stripe.subscription_updated", {
              uid,
              stripe_subscription_id: typed_subscription.id,
              stripe_customer_id,
              status: typed_subscription.status,
              items,
              cancel_at_period_end
            }));
          } else {
            await await_event_trigger(opts.server.events.trigger("stripe.subscription_deleted", {
              uid,
              stripe_subscription_id: typed_subscription.id,
              stripe_customer_id,
              status: typed_subscription.status,
              items
            }));
          }
          processed_event_id_cache.set(event.id, true);
          opts.stream.success({ status: 200, data: { received: true } });
          return;
        }
        case "invoice.paid":
        case "invoice.payment_failed": {
          opts.server.log(1, "Stripe webhook received invoice event: ", { event_id: event.id, type: event.type });
          const invoice = event.data.object;
          const stripe_invoice_id = invoice.id;
          (0, import_utils.assert)((0, import_utils.is_non_empty_string)(stripe_invoice_id), "api_error", "Invoice event missing invoice.id");
          const stripe_customer_id_value = invoice.customer;
          const stripe_customer_id = typeof stripe_customer_id_value === "string" ? stripe_customer_id_value : stripe_customer_id_value?.id;
          (0, import_utils.assert)((0, import_utils.is_non_empty_string)(stripe_customer_id), "api_error", "Invoice event missing customer id", {
            stripe_invoice_id
          });
          let uid = invoice.metadata?.[stripe_uid_metadata_key];
          if (!(0, import_utils.is_non_empty_string)(uid)) {
            const customer = await (0, import_utils.stripe_api_call)(() => client.customers.retrieve(stripe_customer_id), { operation: "customers.retrieve", stripe_customer_id, reason: "resolve_uid_fallback" });
            if ("deleted" in customer && customer.deleted === true) {
              throw new import_error.InternalStripeError("customer_not_found", "Invoice references a deleted customer.", { stripe_invoice_id, stripe_customer_id });
            }
            uid = customer.metadata?.[stripe_uid_metadata_key];
          }
          if (!(0, import_utils.is_non_empty_string)(uid)) {
            throw new import_error.InternalStripeError("invalid_argument", "Invoice missing uid metadata (invoice + customer).", { stripe_invoice_id, stripe_customer_id });
          }
          (0, import_subscriptions.delete_subscription_caches)(uid);
          const currency = invoice.currency;
          (0, import_utils.assert)((0, import_utils.is_non_empty_string)(currency), "api_error", "Invoice missing currency", { stripe_invoice_id });
          const hosted_invoice_url = (0, import_utils.is_non_empty_string)(invoice.hosted_invoice_url) ? invoice.hosted_invoice_url : void 0;
          if (event.type === "invoice.paid") {
            const amount_paid = typeof invoice.amount_paid === "number" && Number.isFinite(invoice.amount_paid) ? invoice.amount_paid : 0;
            await await_event_trigger(opts.server.events.trigger("stripe.invoice_paid", {
              uid,
              stripe_invoice_id,
              stripe_customer_id,
              amount_paid,
              currency,
              hosted_invoice_url
            }));
          } else {
            const amount_due = typeof invoice.amount_due === "number" && Number.isFinite(invoice.amount_due) ? invoice.amount_due : 0;
            await await_event_trigger(opts.server.events.trigger("stripe.invoice_payment_failed", {
              uid,
              stripe_invoice_id,
              stripe_customer_id,
              amount_due,
              currency,
              hosted_invoice_url
            }));
          }
          processed_event_id_cache.set(event.id, true);
          opts.stream.success({ status: 200, data: { received: true } });
          return;
        }
        case "payment_intent.succeeded":
        case "payment_intent.payment_failed": {
          opts.server.log(1, "Stripe webhook received payment_intent event: ", { event_id: event.id, type: event.type });
          const pi = event.data.object;
          const stripe_payment_intent_id = pi.id;
          (0, import_utils.assert)((0, import_utils.is_non_empty_string)(stripe_payment_intent_id), "api_error", "PaymentIntent event missing id");
          let uid = pi.metadata?.[stripe_uid_metadata_key];
          const stripe_customer_id_value = pi.customer;
          const stripe_customer_id = typeof stripe_customer_id_value === "string" ? stripe_customer_id_value : stripe_customer_id_value?.id;
          if (!(0, import_utils.is_non_empty_string)(uid) && (0, import_utils.is_non_empty_string)(stripe_customer_id)) {
            const customer = await (0, import_utils.stripe_api_call)(() => client.customers.retrieve(stripe_customer_id), { operation: "customers.retrieve", stripe_customer_id, reason: "resolve_uid_fallback" });
            if ("deleted" in customer && customer.deleted === true) {
              throw new import_error.InternalStripeError("customer_not_found", "PaymentIntent references a deleted customer.", { stripe_payment_intent_id, stripe_customer_id });
            }
            uid = customer.metadata?.[stripe_uid_metadata_key];
          }
          if (!(0, import_utils.is_non_empty_string)(uid)) {
            processed_event_id_cache.set(event.id, true);
            opts.stream.success({ status: 200, data: { received: true } });
            return;
          }
          const currency = pi.currency;
          if (!(0, import_utils.is_non_empty_string)(currency)) {
            throw new import_error.InternalStripeError("api_error", "PaymentIntent missing currency.", { uid, stripe_payment_intent_id });
          }
          const metadata = pi.metadata ?? {};
          if (event.type === "payment_intent.succeeded") {
            const amount_received = typeof pi.amount_received === "number" && Number.isFinite(pi.amount_received) ? pi.amount_received : 0;
            await await_event_trigger(opts.server.events.trigger("stripe.payment_succeeded", {
              uid,
              stripe_payment_intent_id,
              stripe_customer_id,
              amount_received,
              currency,
              metadata
            }));
          } else {
            const amount = typeof pi.amount === "number" && Number.isFinite(pi.amount) ? pi.amount : 0;
            const last_payment_error_message = (0, import_utils.is_non_empty_string)(pi.last_payment_error?.message) ? pi.last_payment_error?.message : void 0;
            await await_event_trigger(opts.server.events.trigger("stripe.payment_failed", {
              uid,
              stripe_payment_intent_id,
              stripe_customer_id,
              amount,
              currency,
              last_payment_error_message,
              metadata
            }));
          }
          processed_event_id_cache.set(event.id, true);
          opts.stream.success({ status: 200, data: { received: true } });
          return;
        }
        case "setup_intent.succeeded": {
          opts.server.log(1, "Stripe webhook received setup_intent.succeeded: ", { event_id: event.id });
          const setup_intent = event.data.object;
          const stripe_setup_intent_id = setup_intent.id;
          (0, import_utils.assert)((0, import_utils.is_non_empty_string)(stripe_setup_intent_id), "api_error", "SetupIntent event missing id");
          const stripe_customer_id_value = setup_intent.customer;
          const stripe_customer_id = typeof stripe_customer_id_value === "string" ? stripe_customer_id_value : stripe_customer_id_value?.id;
          if (!(0, import_utils.is_non_empty_string)(stripe_customer_id)) {
            throw new import_error.InternalStripeError("invalid_argument", "SetupIntent missing customer id.", { stripe_setup_intent_id });
          }
          let uid = setup_intent.metadata?.[stripe_uid_metadata_key];
          if (!(0, import_utils.is_non_empty_string)(uid)) {
            const customer = await (0, import_utils.stripe_api_call)(() => client.customers.retrieve(stripe_customer_id), { operation: "customers.retrieve", stripe_customer_id, reason: "resolve_uid_fallback" });
            if ("deleted" in customer && customer.deleted === true) {
              throw new import_error.InternalStripeError("customer_not_found", "SetupIntent references a deleted customer.", { stripe_setup_intent_id, stripe_customer_id });
            }
            uid = customer.metadata?.[stripe_uid_metadata_key];
          }
          if (!(0, import_utils.is_non_empty_string)(uid)) {
            throw new import_error.InternalStripeError("invalid_argument", "SetupIntent missing uid metadata (intent + customer).", { stripe_setup_intent_id, stripe_customer_id });
          }
          const finalized = await (0, import_payment_methods.finalize_payment_method_setup)(client, opts.server, {
            uid,
            setup_intent_id: stripe_setup_intent_id,
            idempotency_key: (0, import_utils.stable_idempotency_key)(`finalize_payment_method_setup:${event.id}`)
          });
          await await_event_trigger(opts.server.events.trigger("stripe.payment_method_ready", {
            uid,
            stripe_customer_id: finalized.stripe_customer_id,
            stripe_setup_intent_id: finalized.setup_intent_id,
            stripe_payment_method_id: finalized.payment_method_id
          }));
          processed_event_id_cache.set(event.id, true);
          opts.stream.success({ status: 200, data: { received: true } });
          return;
        }
        default: {
          opts.server.log(1, "Stripe webhook received unhandled event type: ", { event_id: event.id, type: event.type });
          processed_event_id_cache.set(event.id, true);
          opts.stream.success({ status: 200, data: { received: true } });
          return;
        }
      }
    } finally {
      inflight_event_id_cache.delete(event.id);
    }
  } catch (error) {
    let status = 500;
    let type = "api_error";
    let message = "Stripe webhook handling failed.";
    if (error instanceof import_error.InternalStripeError) {
      type = error.error_code ?? type;
      if (type === "invalid_argument") {
        status = 400;
      }
    }
    if (!opts.stream.finished) {
      opts.stream.error({ status, type, message });
    }
    return;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handle_stripe_webhook,
  register_or_update_stripe_webhook_endpoint
});
