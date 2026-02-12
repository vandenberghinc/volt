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
  Stripe: () => Stripe
});
module.exports = __toCommonJS(stdin_exports);
var import_stripe = __toESM(require("stripe"));
var import_customers = require("./customers.js");
var import_products = require("./products.js");
var import_utils = require("./utils.js");
var import_subscriptions = require("./subscriptions.js");
var import_webhooks = require("./webhooks.js");
var import_meters = require("./meters.js");
var import_checkout = require("./checkout.js");
var import_endpoint = require("../../endpoint.js");
class Stripe {
  /** The payments type. */
  type = "stripe";
  /** The initialized stripe client. */
  client;
  /** The uninitialized products. */
  raw_products;
  /** The initialized stripe products. */
  products = [];
  /** The parent server instance. */
  server;
  /** The webhook signing secret. */
  webhook_signing_secret;
  /** Constructs the Stripe payments instance. */
  constructor(server, opts) {
    this.raw_products = opts.products;
    this.server = server;
    this.client = new import_stripe.default(opts.api_key, {
      typescript: true,
      maxNetworkRetries: 5
    });
  }
  // -------------------------------------------------------------------------
  // Private methods.
  /**
  * Initialize all endpoints.
  * @note Should not be called when initialized as a worker.
  */
  async initialize_endpoints() {
    this.server.endpoint({
      method: "POST",
      endpoint: "/volt/api/stripe/webhook",
      allow_unknown_params: true,
      callback: async (stream) => {
        await stream.join();
        if (!this.webhook_signing_secret) {
          stream.error({
            status: 500,
            type: "stripe_webhook_not_initialized",
            message: "Stripe webhook signing secret is not initialized."
          });
          return;
        }
        const stripe_signature_header = stream.headers["stripe-signature"];
        if (typeof stripe_signature_header !== "string" || stripe_signature_header.length === 0) {
          stream.error({
            status: 400,
            type: "invalid_argument",
            message: "Missing Stripe-Signature header."
          });
          return;
        }
        await (0, import_webhooks.handle_stripe_webhook)(this.client, {
          server: this.server,
          stream,
          webhook_signing_secret: this.webhook_signing_secret,
          // use wire body instead of raw body since we need the wired body for signature verification.
          raw_body: stream.wire_body,
          stripe_signature_header,
          all_products: this.products
        });
      }
    });
    this.server.endpoint({
      method: import_endpoint.Endpoint.method("GET"),
      endpoint: import_endpoint.Endpoint.endpoint("/volt/api/stripe/v1/products"),
      authenticated: false,
      callback: async (stream) => {
        return stream.send({
          status: 200,
          data: {
            products: this.raw_products
          }
        });
      }
    });
    this.server.endpoint({
      method: import_endpoint.Endpoint.method("GET"),
      endpoint: import_endpoint.Endpoint.endpoint("/volt/api/stripe/v1/subscriptions"),
      authenticated: true,
      callback: async (stream) => {
        const subs = await this.get_active_subscriptions({
          uid: stream.uid
        });
        const active_subs = [];
        for (const plan_id of Object.keys(subs)) {
          const plan = this.get_subscription_plan(plan_id);
          const product = this.get_subscription_product_by_plan(plan);
          active_subs.push({ product, plan });
        }
        ;
        return stream.send({
          status: 200,
          data: {
            subscriptions: active_subs
          }
        });
      }
    });
    this.server.endpoint({
      method: import_endpoint.Endpoint.method("GET"),
      endpoint: import_endpoint.Endpoint.endpoint("/volt/api/stripe/v1/subscriptions/meters"),
      authenticated: true,
      callback: async (stream) => {
        const active = await this.get_active_meters({
          uid: stream.uid
        });
        const meters = [];
        for (const product_id of Object.keys(active)) {
          meters.push(this.get_meter_product(product_id));
        }
        return stream.send({
          status: 200,
          data: {
            meters
          }
        });
      }
    });
    this.server.endpoint({
      method: import_endpoint.Endpoint.method("DELETE"),
      endpoint: import_endpoint.Endpoint.endpoint("/volt/api/stripe/v1/subscriptions"),
      params: {
        plan: "string",
        cancel_at_period_end: { type: "boolean", default: true }
      },
      authenticated: true,
      callback: async (stream, params) => {
        const res = await this.cancel_subscription({
          uid: stream.uid,
          plan: this.get_subscription_plan(params.plan),
          cancel_at_period_end: params.cancel_at_period_end
        });
        return stream.send({
          status: 200,
          data: {}
        });
      }
    });
    this.server.endpoint({
      method: import_endpoint.Endpoint.method("POST"),
      endpoint: import_endpoint.Endpoint.endpoint("/volt/api/stripe/v1/checkout/session_id"),
      authenticated: false,
      callback: async (stream) => {
        return stream.send({
          status: 200,
          data: {
            session_id: (0, import_checkout.create_checkout_session_id)(stream.uid)
          }
        });
      }
    });
    this.server.endpoint({
      method: import_endpoint.Endpoint.method("POST"),
      endpoint: import_endpoint.Endpoint.endpoint("/volt/api/stripe/v1/checkout/session"),
      params: {
        session_id: "string",
        line_items: {
          type: "array",
          min: 1,
          max: 50,
          value_schema: {
            type: "object",
            schema: {
              product: "string",
              quantity: {
                type: "number",
                min: 1
              }
            }
          }
        },
        success_url: "string",
        cancel_url: "string",
        tax_id_collection_enabled: "boolean"
      },
      authenticated: false,
      callback: async (stream, params) => {
        const res = await (0, import_checkout.start_checkout_session)(this.client, this.server, {
          uid: stream.uid,
          session_id: params.session_id,
          line_items: params.line_items,
          success_url: params.success_url,
          cancel_url: params.cancel_url,
          tax_id_collection_enabled: params.tax_id_collection_enabled,
          all_products: this.products,
          allowed_hosts: void 0
        });
        return stream.send({
          status: 200,
          data: res
        });
      }
    });
  }
  // -------------------------------------------------------------------------
  // Initialization.
  /**
   * Initialize the stripe class.
   */
  async initialize(opts) {
    this.products = await (0, import_products.initialize_products)(this.client, this.server, this.raw_products);
    if (!opts.worker) {
      if (this.server.https_enabled) {
        const res = await (0, import_webhooks.register_or_update_stripe_webhook_endpoint)(this.client, this.server, {
          /**
           * @warning
           * Never change the webhook_id since this could break updating the webhook endpoint
           * if the url / description etc changes.
           */
          webhook_app_id: "Volt.Stripe.Webhook",
          webhook_url: `${this.server.full_domain}/volt/api/stripe/webhook`,
          description: "The internal volt stripe payments webhook endpoint.",
          ensure_enabled: true
        });
        this.webhook_signing_secret = res.webhook_signing_secret;
      }
      await this.initialize_endpoints();
    }
  }
  // -------------------------------------------------------------------------
  // Users API.
  /**
   * A callback to delete a user from the payments provider when the user is deleted from our system.
   */
  async delete_user(uid) {
    await (0, import_customers.delete_stripe_customer)(this.client, this.server, uid);
    (0, import_subscriptions.delete_subscription_caches)(uid);
  }
  /**
   * Get the stripe customer id for a given user id (uid), if a customer does
   * not exist, it is automatically created and the new customer id is returned.
   * @returns The stripe customer id.
   */
  async ensure_stripe_customer(uid) {
    return await (0, import_customers.ensure_stripe_customer)(this.client, this.server, uid);
  }
  // -------------------------------------------------------------------------
  // Products API.
  /**
   * Fetch an initialized product by its id.
   * @throws {InternalStripeError} When the product is not found.
   */
  get_product(product_id) {
    const product = this.products.find((p) => p.id === product_id);
    (0, import_utils.assert)(product, "invalid_product", `Product with id '${product_id}' not found.`, { product_id });
    return product;
  }
  /**
   * Fetch an initialized subscription or subscription plan by its id.
   * @throws {InternalStripeError} When the product is not found.
   */
  get_subscription_or_plan(product_or_plan_id) {
    for (const product of this.products) {
      if (product.type !== "subscription") {
        continue;
      }
      if (product.id === product_or_plan_id) {
        return product;
      }
      if (product.type === "subscription") {
        const plan = product.plans.find((p) => p.id === product_or_plan_id);
        if (plan) {
          return product;
        }
      }
    }
    (0, import_utils.assert)(false, "invalid_product", `Product or subscription plan with id '${product_or_plan_id}' not found.`, { product_id: product_or_plan_id });
  }
  /**
   * Get a one-time product by its id.
   * @throws {InternalStripeError} When the product is not found or is not a one-time product.
   */
  get_one_time_product(product_id) {
    const product = this.get_product(product_id);
    (0, import_utils.assert)(product.type === "one_time", "invalid_product", `Product with id '${product_id}' is not a one-time product.`, { product_id, product_type: product.type });
    return product;
  }
  /**
   * Get a subscription product by its id.
   * @throws {InternalStripeError} When the product is not found or is not a subscription product.
   */
  get_subscription_product(product_id) {
    const product = this.get_product(product_id);
    (0, import_utils.assert)(product.type === "subscription", "invalid_product", `Product with id '${product_id}' is not a subscription product.`, { product_id, product_type: product.type });
    return product;
  }
  /**
   * Get a subscription plan by its id.
   * @throws {InternalStripeError} When the plan is not found.
   */
  get_subscription_plan(plan_id) {
    for (const product of this.products) {
      if (product.type !== "subscription") {
        continue;
      }
      const plan = product.plans.find((p) => p.id === plan_id);
      if (plan) {
        return plan;
      }
    }
    (0, import_utils.assert)(false, "invalid_product", `Subscription plan with id '${plan_id}' not found.`, { plan_id });
  }
  /**
   * Resolve a subscription plan to its parent subscription product.
   * @throws {InternalStripeError} When the plan or parent subscription is not found.
   */
  get_subscription_product_by_plan(plan) {
    const plan_id = typeof plan === "string" ? plan : plan.id;
    for (const product of this.products) {
      if (product.type !== "subscription") {
        continue;
      }
      const found_plan = product.plans.find((p) => p.id === plan_id);
      if (found_plan) {
        return product;
      }
    }
    (0, import_utils.assert)(false, "invalid_product", `Subscription plan with id '${plan_id}' not found.`, { plan_id });
  }
  /**
   * Get a meter product by its id.
   * @throws {InternalStripeError} When the product is not found or is not a meter product.
   */
  get_meter_product(product_id) {
    const product = this.get_product(product_id);
    (0, import_utils.assert)(product.type === "meter", "invalid_product", `Product with id '${product_id}' is not a meter product.`, { product_id, product_type: product.type });
    return product;
  }
  // -------------------------------------------------------------------------
  // Subscriptions API.
  /**
   * Check if a user is subscribed to a subscription (plan).
   * @returns `true` if the user has an active subscription to the plan or subscription product, `false` otherwise.
   */
  async is_subscribed(opts) {
    let plan;
    if (typeof opts.plan === "string") {
      for (const product of this.products) {
        if (product.type === "subscription") {
          const found_plan = product.plans.find((p) => p.id === opts.plan);
          if (found_plan) {
            plan = found_plan;
            break;
          }
        } else if (product.type === "meter" && product.id === opts.plan) {
          plan = product;
          break;
        }
      }
    } else {
      plan = opts.plan;
    }
    (0, import_utils.assert)(plan, "invalid_argument", `Subscription plan or meter with id '${typeof opts.plan === "string" ? opts.plan : opts.plan.id}' not found.`, { plan_id: typeof opts.plan === "string" ? opts.plan : opts.plan.id });
    return await (0, import_subscriptions.is_user_subscribed_to)(this.client, this.server, {
      uid: opts.uid,
      plan,
      customer_id: void 0,
      all_products: this.products,
      status: opts.status
    });
  }
  /**
   * Fetch all active subscription plan id's for a user.
   * @note
   * Note that `trialing` and `past_due` subscriptions statuses are considered active,
   * since Stripe can still attempt to pay those subscriptions and move them to `active` status.
   * @returns An array of active subscription plan id's the user is subscribed to.
   */
  async get_active_subscriptions(opts) {
    return await (0, import_subscriptions.list_subscribed_plans)(this.client, this.server, {
      uid: opts.uid,
      customer_id: void 0,
      all_products: this.products,
      status: opts.status
    });
  }
  /**
   * Fetch all active meter subscription id's for a user.
   * @note
   * Note that only subscriptions with status `active` are considered active here,
   * not  `trialing` and `past_due`.
   * This is to reduce risk of abusing meter products since they can be used in a pay-as-you-go manner without upfront commitment.
   *
   * @returns An array of active subscription plan id's the user is subscribed to.
   */
  async get_active_meters(opts) {
    return await (0, import_subscriptions.list_subscribed_meters)(this.client, this.server, {
      uid: opts.uid,
      stripe_customer_id: void 0,
      all_products: this.products,
      status: opts.status
    });
  }
  /**
   * Cancel a user's subscription to a plan.
   * @warning This will cancel all of the user's subscriptions containing the plan's price id, use with caution.
   * @warning This will cancel the entire subscription containing the plan, even if the subscription contains multiple plans.
   *          However, during checkout its not allowed to checkout multiple subscription plans, therefore this should not be an issue.
   */
  async cancel_subscription(opts) {
    await (0, import_subscriptions.cancel_user_subscription)(this.client, this.server, {
      uid: opts.uid,
      plan: opts.plan,
      customer_id: void 0,
      cancel_at_period_end: opts.cancel_at_period_end
    });
  }
  // -------------------------------------------------------------------------
  // Meters API.
  /**
   * Record usage for a meter product.
   */
  async record_meter_usage(opts) {
    return await (0, import_meters.record_meter_usage)(this.client, this.server, this.products, opts);
  }
  /**
   * Cancel a previously recorded meter usage event by its identifier (best-effort within 24 hours).
   */
  async cancel_meter_usage_event(opts) {
    return await (0, import_meters.cancel_meter_usage_event)(this.client, this.server, this.products, opts);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Stripe
});
