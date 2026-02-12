/**
 * @author Daan van den Bergh
 * @copyright © 2026 - 2026 Daan van den Bergh. All rights reserved
 */
import StripeClient from "stripe";
import { InitializedMeterProduct, InitializedOneTimeProduct, InitializedProduct, InitializedSubscriptionPlan, InitializedSubscriptionProduct, MeterProduct, Product, ProductId, SubscriptionPlan, SubscriptionPlanId } from "./products.js";
import { Server } from "../../server.js";
import { CancelMeterUsageEventOpts, CancelMeterUsageEventResult, RecordMeterUsageOpts, RecordMeterUsageResult } from "./meters.js";
import { Request } from "../../../../frontend/src/modules/request.js";
import { CreatedCheckoutSession } from "./checkout.js";
/**
 * The stripe payments class.
 */
export declare class Stripe {
    /** The payments type. */
    type: "stripe";
    /** The initialized stripe client. */
    client: StripeClient;
    /** The uninitialized products. */
    raw_products: Product[];
    /** The initialized stripe products. */
    products: InitializedProduct[];
    /** The parent server instance. */
    server: Server;
    /** The webhook signing secret. */
    webhook_signing_secret?: string;
    /** Constructs the Stripe payments instance. */
    constructor(server: Server, opts: Stripe.Opts);
    /**
 * Initialize all endpoints.
 * @note Should not be called when initialized as a worker.
 */
    private initialize_endpoints;
    /**
     * Initialize the stripe class.
     */
    initialize(opts: {
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
        worker?: boolean;
    }): Promise<void>;
    /**
     * A callback to delete a user from the payments provider when the user is deleted from our system.
     */
    delete_user(uid: string): Promise<void>;
    /**
     * Get the stripe customer id for a given user id (uid).
     * @returns The stripe customer id, or `undefined` if no customer exists for the uid.
     */
    get_stripe_customer_id(uid: string): Promise<string | undefined>;
    /**
     * Get the stripe customer id for a given user id (uid), if a customer does
     * not exist, it is automatically created and the new customer id is returned.
     * @returns The stripe customer id.
     */
    ensure_stripe_customer(uid: string): Promise<string>;
    /**
     * Fetch an initialized product by its id.
     * @throws {InternalStripeError} When the product is not found.
     */
    get_product(product_id: ProductId): InitializedProduct;
    /**
     * Fetch an initialized subscription or subscription plan by its id.
     * @throws {InternalStripeError} When the product is not found.
     */
    get_subscription_or_plan(product_or_plan_id: ProductId | SubscriptionPlanId): InitializedSubscriptionProduct | InitializedSubscriptionPlan;
    /**
     * Get a one-time product by its id.
     * @throws {InternalStripeError} When the product is not found or is not a one-time product.
     */
    get_one_time_product(product_id: ProductId): InitializedOneTimeProduct;
    /**
     * Get a subscription product by its id.
     * @throws {InternalStripeError} When the product is not found or is not a subscription product.
     */
    get_subscription_product(product_id: ProductId): InitializedSubscriptionProduct;
    /**
     * Get a subscription plan by its id.
     * @throws {InternalStripeError} When the plan is not found.
     */
    get_subscription_plan(plan_id: SubscriptionPlanId): InitializedSubscriptionPlan;
    /**
     * Resolve a subscription plan to its parent subscription product.
     * @throws {InternalStripeError} When the plan or parent subscription is not found.
     */
    get_subscription_product_by_plan(plan: SubscriptionPlanId | SubscriptionPlan): InitializedSubscriptionProduct;
    /**
     * Get a meter product by its id.
     * @throws {InternalStripeError} When the product is not found or is not a meter product.
     */
    get_meter_product(product_id: ProductId): InitializedMeterProduct;
    /**
     * Check if a user is subscribed to a subscription (plan).
     * @returns `true` if the user has an active subscription to the plan or subscription product, `false` otherwise.
     */
    is_subscribed(opts: {
        /** The user id */
        uid: string;
        /** The subcription (plan) or its id to check. */
        plan: InitializedSubscriptionPlan | SubscriptionPlanId | InitializedSubscriptionProduct | ProductId;
    }): Promise<boolean>;
    /**
     * Fetch all active subscription plan id's for a user.
     * @note
     * Note that `trialing` and `past_due` subscriptions statuses are considered active,
     * since Stripe can still attempt to pay those subscriptions and move them to `active` status.
     * @returns An array of active subscription plan id's the user is subscribed to.
     */
    get_active_subscriptions(opts: {
        /** The user id */
        uid: string;
    }): Promise<SubscriptionPlanId[]>;
    /**
     * Fetch all active meter subscription id's for a user.
     * @note
     * Note that only subscriptions with status `active` are considered active here,
     * not  `trialing` and `past_due`.
     * This is to reduce risk of abusing meter products since they can be used in a pay-as-you-go manner without upfront commitment.
     *
     * @returns An array of active subscription plan id's the user is subscribed to.
     */
    get_active_meters(opts: {
        /** The user id */
        uid: string;
    }): Promise<ProductId[]>;
    /**
     * Cancel a user's subscription to a plan.
     * @warning This will cancel all of the user's subscriptions containing the plan's price id, use with caution.
     * @warning This will cancel the entire subscription containing the plan, even if the subscription contains multiple plans.
     *          However, during checkout its not allowed to checkout multiple subscription plans, therefore this should not be an issue.
     */
    cancel_subscription(opts: {
        /** The user id (uid) to cancel the subscription for. */
        uid: string;
        /** The specific plan to cancel (cancels subscriptions containing this plan price id). */
        plan: InitializedSubscriptionPlan;
        /** Whether to cancel at period end (default true). */
        cancel_at_period_end?: boolean;
    }): Promise<void>;
    /**
     * Record usage for a meter product.
     */
    record_meter_usage<Kind extends MeterProduct.Kind>(opts: RecordMeterUsageOpts<Kind>): Promise<RecordMeterUsageResult>;
    /**
     * Cancel a previously recorded meter usage event by its identifier (best-effort within 24 hours).
     */
    cancel_meter_usage_event(opts: CancelMeterUsageEventOpts): Promise<CancelMeterUsageEventResult>;
}
/** Nested types for the {@link Stripe} class. */
export declare namespace Stripe {
    /** The user facing options for initializing the Stripe class. */
    interface Opts {
        /** The stripe API key. */
        api_key: string;
        /** The stripe products. */
        products: Product[];
    }
    /** The types for the frontend endpoints. */
    namespace Endpoints {
        /** Get all (non-initialized) products. */
        type GetProducts = Request.Info<"GET", "/volt/api/stripe/v1/products", undefined, {
            products: Product[];
        }, undefined>;
        /** Get subscriptions of a user. */
        type GetSubscriptions = Request.Info<"GET", "/volt/api/stripe/v1/subscriptions", undefined, {
            subscriptions: {
                product: InitializedSubscriptionProduct;
                plan: InitializedSubscriptionPlan;
            }[];
        }, undefined>;
        /** Get meter subscriptions of a user. */
        type GetMeterSubscriptions = Request.Info<"GET", "/volt/api/stripe/v1/subscriptions/meters", undefined, {
            meters: InitializedMeterProduct[];
        }, undefined>;
        /** Cancel a user subscription. */
        type CancelSubscription = Request.Info<"DELETE", "/volt/api/stripe/v1/subscriptions", {
            /** The subscription plan id to cancel. */
            plan: SubscriptionPlanId;
            /** Whether to cancel at period end (default true), or immediately. */
            cancel_at_period_end?: boolean;
        }, {}, undefined>;
        /** Create checkout session id. */
        type CreateCheckoutSessionId = Request.Info<"POST", "/volt/api/stripe/v1/checkout/session_id", undefined, {
            session_id: string;
        }, undefined>;
        /** Start checkout session./ */
        type StartCheckoutSession = Request.Info<"POST", "/volt/api/stripe/v1/checkout/session", {
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
        }, CreatedCheckoutSession, undefined>;
    }
}
