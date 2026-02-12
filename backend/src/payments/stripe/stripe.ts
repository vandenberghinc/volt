/**
 * @author Daan van den Bergh
 * @copyright © 2026 - 2026 Daan van den Bergh. All rights reserved
 */

import StripeClient from "stripe";
import { delete_stripe_customer, ensure_stripe_customer } from "./customers.js";
import { initialize_products, InitializedMeterProduct, InitializedOneTimeProduct, InitializedProduct, InitializedSubscriptionPlan, InitializedSubscriptionProduct, MeterProduct, Product, ProductId, SubscriptionPlan, SubscriptionPlanId } from "./products.js";
import { assert } from "./utils.js";
import { cancel_user_subscription, delete_subscription_caches, is_user_subscribed_to, list_subscribed_meters, list_subscribed_plans, SemiActiveSubscriptionStatus } from "./subscriptions.js";
import { Server } from "../../server.js";
import { handle_stripe_webhook, register_or_update_stripe_webhook_endpoint } from "./webhooks.js";
import { cancel_meter_usage_event, CancelMeterUsageEventOpts, CancelMeterUsageEventResult, record_meter_usage, RecordMeterUsageOpts, RecordMeterUsageResult } from "./meters.js";
import { Request } from "../../../../frontend/src/modules/request.js";
import { AuthStream, Stream } from "../../stream.js";
import { create_checkout_session_id, CreatedCheckoutSession, start_checkout_session } from "./checkout.js";
import { Endpoint } from "../../endpoint.js";

/**
 * The stripe payments class.
 */
export class Stripe {

    /** The payments type. */
    type: "stripe" = "stripe";

    /** The initialized stripe client. */
    client: StripeClient;

    /** The uninitialized products. */
    raw_products: Product[];

    /** The initialized stripe products. */
    products: InitializedProduct[] = [];

    /** The parent server instance. */
    server: Server;

    /** The webhook signing secret. */
    webhook_signing_secret?: string;

    /** Constructs the Stripe payments instance. */
    constructor(server: Server, opts: Stripe.Opts) {
        this.raw_products = opts.products;
        this.server = server;
        this.client = new StripeClient(opts.api_key, {
            typescript: true,
            maxNetworkRetries: 5,
        });
    }

    // -------------------------------------------------------------------------
    // Private methods.

    /**
 * Initialize all endpoints.
 * @note Should not be called when initialized as a worker.
 */
    private async initialize_endpoints(): Promise<void> {

        // Create the webhook endpoint.
        this.server.endpoint({
            method: "POST",
            endpoint: "/volt/api/stripe/webhook",
            allow_unknown_params: true,
            callback: async (stream: Stream) => {
                // Ensure the request body is fully received.
                await stream.join();

                // Ensure we have the signing secret (set during initialize()).
                if (!this.webhook_signing_secret) {
                    stream.error({
                        status: 500,
                        type: "stripe_webhook_not_initialized",
                        message: "Stripe webhook signing secret is not initialized.",
                    });
                    return;
                }

                // Stripe-Signature header (Node normalizes to lowercase).
                const stripe_signature_header = stream.headers["stripe-signature"];
                if (typeof stripe_signature_header !== "string" || stripe_signature_header.length === 0) {
                    stream.error({
                        status: 400,
                        type: "invalid_argument",
                        message: "Missing Stripe-Signature header.",
                    });
                    return;
                }

                // Handle the webhook.
                await handle_stripe_webhook(this.client, {
                    server: this.server,
                    stream,
                    webhook_signing_secret: this.webhook_signing_secret,
                    // use wire body instead of raw body since we need the wired body for signature verification.
                    raw_body: stream.wire_body,
                    stripe_signature_header,
                    all_products: this.products,
                });
            },
        });

        // ---------------------------------------------
        // Products endpoints.

        // Create a checkout session id.
        this.server.endpoint({
            method: Endpoint.method<Stripe.Endpoints.GetProducts>(
                "GET",
            ),
            endpoint: Endpoint.endpoint<Stripe.Endpoints.GetProducts>(
                "/volt/api/stripe/v1/products",
            ),
            authenticated: false,
            callback: async (stream: Stream) => {
                return stream.send<Stripe.Endpoints.GetProducts["result"]>({
                    status: 200,
                    data: {
                        products: this.raw_products,
                    }
                })
            },
        });

        // ---------------------------------------------
        // Subscriptions endpoints.

        // Get subscriptions of a user.
        this.server.endpoint({
            method: Endpoint.method<Stripe.Endpoints.GetSubscriptions>(
                "GET",
            ),
            endpoint: Endpoint.endpoint<Stripe.Endpoints.GetSubscriptions>(
                "/volt/api/stripe/v1/subscriptions",
            ),
            authenticated: true,
            callback: async (stream: AuthStream) => {

                // Fetch all subscriptions.
                const subs = await this.get_active_subscriptions({
                    uid: stream.uid,
                });
                const active_subs: Stripe.Endpoints.GetSubscriptions["result"]["subscriptions"] = [];
                for (const plan_id of Object.keys(subs)) {
                    const plan = this.get_subscription_plan(plan_id);
                    const product = this.get_subscription_product_by_plan(plan);
                    active_subs.push({ product, plan, });
                };

                return stream.send<Stripe.Endpoints.GetSubscriptions["result"]>({
                    status: 200,
                    data: {
                        subscriptions: active_subs
                    }
                })
            },
        });

        // Get meter subscriptions of a user.
        this.server.endpoint({
            method: Endpoint.method<Stripe.Endpoints.GetMeterSubscriptions>(
                "GET",
            ),
            endpoint: Endpoint.endpoint<Stripe.Endpoints.GetMeterSubscriptions>(
                "/volt/api/stripe/v1/subscriptions/meters",
            ),
            authenticated: true,
            callback: async (stream: AuthStream) => {

                // Fetch all subscriptions.
                const active = await this.get_active_meters({
                    uid: stream.uid,
                });
                const meters: InitializedMeterProduct[] = [];
                for (const product_id of Object.keys(active)) {
                    meters.push(this.get_meter_product(product_id));
                }

                return stream.send<Stripe.Endpoints.GetMeterSubscriptions["result"]>({
                    status: 200,
                    data: {
                        meters,
                    }
                })
            },
        });

        // Cancel subscription.
        this.server.endpoint({
            method: Endpoint.method<Stripe.Endpoints.CancelSubscription>(
                "DELETE",
            ),
            endpoint: Endpoint.endpoint<Stripe.Endpoints.CancelSubscription>(
                "/volt/api/stripe/v1/subscriptions",
            ),
            params: {
                plan: "string",
                cancel_at_period_end: { type: "boolean", default: true },
            },
            authenticated: true,
            callback: async (stream: AuthStream, params) => {

                // Fetch all subscriptions.
                const res = await this.cancel_subscription({
                    uid: stream.uid,
                    plan: this.get_subscription_plan(params.plan),
                    cancel_at_period_end: params.cancel_at_period_end,
                })

                return stream.send<Stripe.Endpoints.CancelSubscription["result"]>({
                    status: 200,
                    data: {}
                })
            },
        });

        // ---------------------------------------------
        // Checkout endpoints.

        // Create a checkout session id.
        this.server.endpoint({
            method: Endpoint.method<Stripe.Endpoints.CreateCheckoutSessionId>(
                "POST",
            ),
            endpoint: Endpoint.endpoint<Stripe.Endpoints.CreateCheckoutSessionId>(
                "/volt/api/stripe/v1/checkout/session_id",
            ),
            authenticated: false,
            callback: async (stream: Stream) => {
                return stream.send<Stripe.Endpoints.CreateCheckoutSessionId["result"]>({
                    status: 200,
                    data: {
                        session_id: create_checkout_session_id(stream.uid),
                    }
                })
            },
        });

        // Start a checkout session.
        this.server.endpoint({
            method: Endpoint.method<Stripe.Endpoints.StartCheckoutSession>(
                "POST",
            ),
            endpoint: Endpoint.endpoint<Stripe.Endpoints.StartCheckoutSession>(
                "/volt/api/stripe/v1/checkout/session",
            ),
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
                                min: 1,
                            },
                        },
                    },
                },
                success_url: "string",
                cancel_url: "string",
                tax_id_collection_enabled: "boolean",
            },
            authenticated: false,
            callback: async (stream: Stream, params) => {
                const res = await start_checkout_session(
                    this.client,
                    this.server,
                    {
                        uid: stream.uid,
                        session_id: params.session_id,
                        line_items: params.line_items,
                        success_url: params.success_url,
                        cancel_url: params.cancel_url,
                        tax_id_collection_enabled: params.tax_id_collection_enabled,
                        all_products: this.products,
                        allowed_hosts: undefined,
                    },
                )
                return stream.send<Stripe.Endpoints.StartCheckoutSession["result"]>({
                    status: 200,
                    data: res,
                })
            },
        });
    }


    // -------------------------------------------------------------------------
    // Initialization.

    /**
     * Initialize the stripe class.
     */
    async initialize(opts: {
        /**
         * By default the server is initialized as web server.
         * 
         * However, when using worker threads, the web server parts are skipped.
         * Only essential operations such as database, users, payments etc. are initialized.
         * Therefore the server can still be used within a worker threads without
         * the overhead of creating http/https servers, endpoints, static files, etc.
         * 
         * The user-defined initialize callbacks are still executed but the `worker` is passed as indication.
         */
        worker?: boolean,
    }): Promise<void> {

        // Initialize products.
        this.products = await initialize_products(this.client, this.server, this.raw_products);

        // Ensure the webhook is registered.
        if (!opts.worker) {
            if (this.server.https_enabled) {
                const res = await register_or_update_stripe_webhook_endpoint(this.client, this.server, {
                    /**
                     * @warning
                     * Never change the webhook_id since this could break updating the webhook endpoint
                     * if the url / description etc changes.
                     */
                    webhook_app_id: "Volt.Stripe.Webhook",
                    webhook_url: `${this.server.full_domain}/volt/api/stripe/webhook`,
                    description: "The internal volt stripe payments webhook endpoint.",
                    ensure_enabled: true,
                });
                this.webhook_signing_secret = res.webhook_signing_secret;
            }

            // Initialize endpoints.
            await this.initialize_endpoints();
        }

    }

    // -------------------------------------------------------------------------
    // Users API.

    /**
     * A callback to delete a user from the payments provider when the user is deleted from our system.
     */
    async delete_user(uid: string): Promise<void> {
        await delete_stripe_customer(this.client, this.server, uid);
        delete_subscription_caches(uid);
    }

    /**
     * Get the stripe customer id for a given user id (uid), if a customer does
     * not exist, it is automatically created and the new customer id is returned.
     * @returns The stripe customer id.
     */
    async ensure_stripe_customer(uid: string): Promise<string> {
        return await ensure_stripe_customer(this.client, this.server, uid);
    }

    // -------------------------------------------------------------------------
    // Products API.

    /**
     * Fetch an initialized product by its id.
     * @throws {InternalStripeError} When the product is not found.
     */
    get_product(product_id: ProductId): InitializedProduct {
        const product = this.products.find((p) => p.id === product_id);
        assert(product, "invalid_product", `Product with id '${product_id}' not found.`, { product_id });
        return product;
    }

    /**
     * Fetch an initialized subscription or subscription plan by its id.
     * @throws {InternalStripeError} When the product is not found.
     */
    get_subscription_or_plan(product_or_plan_id: ProductId | SubscriptionPlanId): InitializedSubscriptionProduct | InitializedSubscriptionPlan {
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
        assert(false, "invalid_product", `Product or subscription plan with id '${product_or_plan_id}' not found.`, { product_id: product_or_plan_id });
    }

    /**
     * Get a one-time product by its id.
     * @throws {InternalStripeError} When the product is not found or is not a one-time product.
     */
    get_one_time_product(product_id: ProductId): InitializedOneTimeProduct {
        const product = this.get_product(product_id);
        assert(product.type === "one_time", "invalid_product", `Product with id '${product_id}' is not a one-time product.`, { product_id, product_type: product.type });
        return product;
    }

    /**
     * Get a subscription product by its id.
     * @throws {InternalStripeError} When the product is not found or is not a subscription product.
     */
    get_subscription_product(product_id: ProductId): InitializedSubscriptionProduct {
        const product = this.get_product(product_id);
        assert(product.type === "subscription", "invalid_product", `Product with id '${product_id}' is not a subscription product.`, { product_id, product_type: product.type });
        return product;
    }

    /**
     * Get a subscription plan by its id.
     * @throws {InternalStripeError} When the plan is not found.
     */
    get_subscription_plan(plan_id: SubscriptionPlanId): InitializedSubscriptionPlan {
        for (const product of this.products) {
            if (product.type !== "subscription") {
                continue;
            }
            const plan = product.plans.find((p) => p.id === plan_id);
            if (plan) {
                return plan;
            }
        }
        assert(false, "invalid_product", `Subscription plan with id '${plan_id}' not found.`, { plan_id });
    }

    /**
     * Resolve a subscription plan to its parent subscription product.
     * @throws {InternalStripeError} When the plan or parent subscription is not found.
     */
    get_subscription_product_by_plan(plan: SubscriptionPlanId | SubscriptionPlan): InitializedSubscriptionProduct {
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
        assert(false, "invalid_product", `Subscription plan with id '${plan_id}' not found.`, { plan_id });
    }

    /**
     * Get a meter product by its id.
     * @throws {InternalStripeError} When the product is not found or is not a meter product.
     */
    get_meter_product(product_id: ProductId): InitializedMeterProduct {
        const product = this.get_product(product_id);
        assert(product.type === "meter", "invalid_product", `Product with id '${product_id}' is not a meter product.`, { product_id, product_type: product.type });
        return product;
    }

    // -------------------------------------------------------------------------
    // Subscriptions API.

    /**
     * Check if a user is subscribed to a subscription (plan).
     * @returns `true` if the user has an active subscription to the plan or subscription product, `false` otherwise.
     */
    async is_subscribed(opts: {
        /** The user id */
        uid: string;
        /** The subcription (plan) or its id to check. */
        plan:
            | InitializedSubscriptionPlan
            | SubscriptionPlanId
            | InitializedMeterProduct
            | ProductId;
        /** Only allow specific subscription statuses. */
        status?: SemiActiveSubscriptionStatus[];
    }): Promise<boolean> {
        let plan: InitializedSubscriptionPlan | InitializedMeterProduct | undefined;
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
        assert(plan, "invalid_argument", `Subscription plan or meter with id '${typeof opts.plan === "string" ? opts.plan : opts.plan.id}' not found.`, { plan_id: typeof opts.plan === "string" ? opts.plan : opts.plan.id });
        
        
        return await is_user_subscribed_to(this.client, this.server, {
            uid: opts.uid,
            plan,
            customer_id: undefined,
            all_products: this.products,
            status: opts.status,
        });
    }

    /**
     * Fetch all active subscription plan id's for a user.
     * @note
     * Note that `trialing` and `past_due` subscriptions statuses are considered active,
     * since Stripe can still attempt to pay those subscriptions and move them to `active` status.
     * @returns An array of active subscription plan id's the user is subscribed to.
     */
    async get_active_subscriptions<Status extends SemiActiveSubscriptionStatus = "active" | "trialing" | "past_due">(opts: {
        /** The user id */
        uid: string;
        /** The optional subscription status to filter. */
        status?: Status[];
    }): Promise<Record<SubscriptionPlanId, Status>> {
        return await list_subscribed_plans(this.client, this.server, {
            uid: opts.uid,
            customer_id: undefined,
            all_products: this.products,
            status: opts.status,
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
    async get_active_meters<Status extends SemiActiveSubscriptionStatus = "active">(opts: {
        /** The user id */
        uid: string;
        /** The optional subscription status to filter. */
        status?: Status[];
    }): Promise<Record<ProductId, Status>> {
        return await list_subscribed_meters(this.client, this.server, {
            uid: opts.uid,
            stripe_customer_id: undefined,
            all_products: this.products,
            status: opts.status,
        });
    }

    /**
     * Cancel a user's subscription to a plan.
     * @warning This will cancel all of the user's subscriptions containing the plan's price id, use with caution.
     * @warning This will cancel the entire subscription containing the plan, even if the subscription contains multiple plans.
     *          However, during checkout its not allowed to checkout multiple subscription plans, therefore this should not be an issue.
     */
    async cancel_subscription(opts: {
        /** The user id (uid) to cancel the subscription for. */
        uid: string;
        /** The specific plan to cancel (cancels subscriptions containing this plan price id). */
        plan: InitializedSubscriptionPlan;
        /** Whether to cancel at period end (default true). */
        cancel_at_period_end?: boolean;
    }): Promise<void> {
        await cancel_user_subscription(this.client, this.server, {
            uid: opts.uid,
            plan: opts.plan,
            customer_id: undefined,
            cancel_at_period_end: opts.cancel_at_period_end,
        });
    }

    // -------------------------------------------------------------------------
    // Meters API.

    /**
     * Record usage for a meter product.
     */
    async record_meter_usage<Kind extends MeterProduct.Kind>(
        opts: RecordMeterUsageOpts<Kind>,
    ): Promise<RecordMeterUsageResult> {
        return await record_meter_usage(
            this.client,
            this.server,
            this.products,
            opts,
        );
    }

    /**
     * Cancel a previously recorded meter usage event by its identifier (best-effort within 24 hours).
     */
    async cancel_meter_usage_event(
        opts: CancelMeterUsageEventOpts,
    ): Promise<CancelMeterUsageEventResult> {
        return await cancel_meter_usage_event(
            this.client,
            this.server,
            this.products,
            opts,
        );
    }


    
}

/** Nested types for the {@link Stripe} class. */
export namespace Stripe {

    /** The user facing options for initializing the Stripe class. */
    export interface Opts {
        /** The stripe API key. */
        api_key: string;
        /** The stripe products. */
        products: Product[];
    }

    /** The types for the frontend endpoints. */
    export namespace Endpoints {

        // ---------------------------------------------
        // Products.
        // ---------------------------------------------

        /** Get all (non-initialized) products. */
        export type GetProducts = Request.Info<
            // Method.
            "GET",
            // Endpoint.
            "/volt/api/stripe/v1/products",
            // Params.
            undefined,
            // Result.
            { products: Product[] },
            // Error.
            undefined
        >

        // ---------------------------------------------
        // Subscriptions.
        // ---------------------------------------------

        /** Get subscriptions of a user. */
        export type GetSubscriptions = Request.Info<
            // Method.
            "GET",
            // Endpoint.
            "/volt/api/stripe/v1/subscriptions",
            // Params.
            undefined,
            // Result.
            { subscriptions: {
                product: InitializedSubscriptionProduct;
                plan: InitializedSubscriptionPlan;
            }[] },
            // Error.
            undefined
        >

        /** Get meter subscriptions of a user. */
        export type GetMeterSubscriptions = Request.Info<
            // Method.
            "GET",
            // Endpoint.
            "/volt/api/stripe/v1/subscriptions/meters",
            // Params.
            undefined,
            // Result.
            {
                meters: InitializedMeterProduct[]
            },
            // Error.
            undefined
        >

        /** Cancel a user subscription. */
        export type CancelSubscription = Request.Info<
            // Method.
            "DELETE",
            // Endpoint.
            "/volt/api/stripe/v1/subscriptions",
            // Params.
            {
                /** The subscription plan id to cancel. */
                plan: SubscriptionPlanId;
                /** Whether to cancel at period end (default true), or immediately. */
                cancel_at_period_end?: boolean;
            },
            // Result.
            {},
            // Error.
            undefined
        >

        // ---------------------------------------------
        // Checkout.
        // ---------------------------------------------

        /** Create checkout session id. */
        export type CreateCheckoutSessionId = Request.Info<
            // Method.
            "POST", 
            // Endpoint.
            "/volt/api/stripe/v1/checkout/session_id",
            // Params.
            undefined, 
            // Result.
            { session_id: string },
            // Error.
            undefined 
        >

        /** Start checkout session./ */
        export type StartCheckoutSession = Request.Info<
            // Method.
            "POST",
            // Endpoint.
            "/volt/api/stripe/v1/checkout/session",
            // Params.
            {
                /** The checkout session id generated by `create_checkout_session_id`. */
                session_id: string;
                /** The product or subscription plan id to checkout. */
                line_items: {
                    /** The product or subscription plan to checkout. */
                    product: ProductId | SubscriptionPlanId;
                    /** The quantity to checkout (default 1). */
                    quantity: number;
                }[];
                /** Where Stripe should redirect after successful payment. */
                success_url: string;
                /** Where Stripe should redirect when the customer cancels. */
                cancel_url: string;
                /** Require tax id collection (useful for B2B in EU). */
                tax_id_collection_enabled: boolean;

            },
            // Result.
            CreatedCheckoutSession,
            // Error.
            undefined
        >

    }
}