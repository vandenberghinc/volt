/**
 * @author Daan van den Bergh
 * @copyright © 2026 - 2026 Daan van den Bergh. All rights reserved
 */
import Stripe from "stripe";
import { type InitializedOneTimeProduct, type InitializedProduct, type InitializedSubscriptionPlan, type InitializedMeterProduct, SubscriptionPlanId, ProductId } from "./products.js";
import { Server } from "../../server.js";
/**
 * A checkout line item input accepted by our API.
 */
export interface CreateCheckoutLineItem {
    /** Product reference: initialized product/plan object OR an id string. */
    product: InitializedOneTimeProduct | InitializedSubscriptionPlan | ProductId | SubscriptionPlanId;
    /** Quantity to purchase/subscribe with. */
    quantity: number;
}
/**
 * Options for creating a Stripe Checkout Session.
 */
export interface CreateCheckoutSessionOpts {
    /**
     * The internal user id, used to resolve/ensure Stripe customer.
     * The `uid` may be undefined for one-time payment checkouts, but must be defined for subscription checkouts since a Stripe Customer is required. In that case, the user must be authenticated and not "anonymous".
     */
    uid: string | undefined;
    /**
     * A caller-provided idempotency key for initialize/start.
     * Re-using the same session_id makes `start_checkout_session` idempotent across retries.
     */
    session_id: string;
    /** Items to purchase/subscribe to. */
    line_items: CreateCheckoutLineItem[];
    /** All initialized products, used to resolve string ids to objects. */
    all_products: InitializedProduct[];
    /** Where Stripe should redirect after successful payment. */
    success_url: string;
    /** Where Stripe should redirect when the customer cancels. */
    cancel_url: string;
    /** Optional: require tax id collection (useful for B2B in EU). */
    tax_id_collection_enabled?: boolean;
    /** The allowed hosts for redirect URLs. */
    allowed_hosts: undefined | string[];
}
/**
 * A minimal response payload for a created Checkout Session.
 */
export interface CreatedCheckoutSession {
    /** The Stripe Checkout Session id. */
    id: string;
    /** The hosted Checkout URL (only for hosted sessions). */
    url: string;
    /** The Checkout mode used. */
    mode: "payment" | "subscription";
    /** Currency used for the session. */
    currency: string;
}
/**
 * Options for creating a metered Stripe Subscription (MeterProduct).
 *
 * This is intentionally separate from Checkout because Stripe Checkout is not always
 * a good fit for usage-based billing flows where you want to subscribe a customer
 * immediately and bill later based on meter events.
 */
export interface CreateMeterSubscriptionOpts {
    /** The internal user id, used to resolve/ensure Stripe customer. */
    uid: string;
    /**
     * A caller-provided idempotency key.
     * Re-using the same subscription_id makes `create_meter_subscription` idempotent across retries.
     */
    subscription_id: string;
    /** The meter product reference: initialized object OR an id string. */
    meter_product: InitializedMeterProduct | string;
    /** All initialized products, used to resolve string ids to objects. */
    all_products: InitializedProduct[];
}
/**
 * A minimal response payload for a created metered subscription.
 */
export interface CreatedMeterSubscription {
    /** The Stripe Subscription id. */
    id: string;
    /**
     * The Stripe Subscription status.
     * Note: We only return "active" or "trialing" for success; "incomplete" can be returned when action is required.
     */
    status: Stripe.Subscription.Status;
    /**
     * When action is required, Stripe returns a PaymentIntent client_secret.
     * This is safe to return to the client to complete SCA/3DS flows.
     */
    latest_invoice_payment_intent_client_secret?: string;
    /** The subscribed meter product id (our internal product id). */
    product_id: string;
    /** The Stripe price id used by the subscription item. */
    stripe_price_id: string;
}
/**
 * Create a new session id to ensure idempotency for checkout session creation.
 */
export declare function create_checkout_session_id(uid: string | undefined): string;
/**
 * Start a Stripe Checkout Session for the provided items.
 *
 * Stripe docs:
 * - Create session: https://docs.stripe.com/api/checkout/sessions/create
 * - Mixed cart (subscription + one-time): https://docs.stripe.com/payments/checkout/how-checkout-works
 * - Stripe Tax for Checkout: https://docs.stripe.com/tax/checkout
 *
 * @warning Only one subscription plan per checkout session is supported, due to later subscription cancellation restrictions.
 * @warning If subscription mode is used, subscription-level settings (`billing_anchor`, `trial_days`) must be unambiguous.
 */
export declare function start_checkout_session(client: Stripe, server: Server, opts: CreateCheckoutSessionOpts): Promise<CreatedCheckoutSession>;
