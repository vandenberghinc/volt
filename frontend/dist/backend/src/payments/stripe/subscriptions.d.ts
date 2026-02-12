/**
 * @author Daan van den Bergh
 * @copyright © 2026 - 2026 Daan van den Bergh. All rights reserved
 */
import Stripe from "stripe";
import type { InitializedMeterProduct, InitializedProduct, InitializedSubscriptionPlan, ProductId, SubscriptionPlanId } from "./products.js";
import { Server } from "../../server.js";
/**
 * A discriminated union describing what the UI must do after subscription creation.
 */
export type CreateSubscriptionResult = {
    /** The outcome type. */
    type: "created";
    /** The Stripe subscription id. */
    subscription_id: string;
    /** The Stripe customer id. */
    stripe_customer_id: string;
    /** The resulting subscription status. */
    status: Stripe.Subscription.Status;
} | {
    /** The outcome type. */
    type: "requires_action";
    /** The Stripe subscription id (created but incomplete). */
    subscription_id: string;
    /** The Stripe customer id. */
    stripe_customer_id: string;
    /** The PaymentIntent id requiring action. */
    payment_intent_id: string;
    /** The PaymentIntent client_secret to confirm in the UI (SCA/3DS). */
    client_secret: string;
    /** The resulting subscription status. */
    status: Stripe.Subscription.Status;
};
/**
 * A semi-active subscription status.
 * Note that we support past_due here as stripe can still retry the payment
 * before marking the subscription as unpaid (canceled).
 */
export type SemiActiveSubscriptionStatus = "active" | "trialing" | "past_due";
/**
 * Update the subscriptions record for a user after a subscription mutation.
 * @note This includes the meter subscriptions.
 * @internal
 */
export declare function update_subscription_record(client: Stripe, server: Server, opts: {
    /** The user id. */
    uid: string;
    /** All products. */
    all_products: InitializedProduct[];
}): Promise<void>;
/**
 * Delete a user from the subscription caches.
 * Should be called after any mutation to the user's subscriptions to avoid stale cache entries.
 */
export declare function delete_subscription_caches(uid: string): void;
/**
 * List all subscribed product plans for a given user.
 */
export declare function list_subscribed_plans<Status extends SemiActiveSubscriptionStatus = "active" | "trialing" | "past_due">(client: Stripe, server: Server, opts: {
    uid: string;
    customer_id: undefined | string;
    all_products: InitializedProduct[];
    status?: Status[];
}): Promise<Record<SubscriptionPlanId, Status>>;
/**
 * List all meter product id's that a customer is currently subscribed (entitled) to.
 *
 * We require an active-ish subscription that contains a subscription item for the meter product's price id.
 * This prevents accidental/abusive usage reporting for users who aren't subscribed.
 *
 * Stripe docs:
 * - List subscriptions: https://docs.stripe.com/api/subscriptions/list
 * - Expand: https://docs.stripe.com/expand
 */
export declare function list_subscribed_meters<Status extends SemiActiveSubscriptionStatus = "active">(client: Stripe, server: Server, opts: {
    uid: string;
    stripe_customer_id: undefined | string;
    all_products: InitializedProduct[];
    status?: SemiActiveSubscriptionStatus[];
}): Promise<Record<ProductId, Status>>;
/**
 * Check whether a user (by uid) is subscribed to a specific subscription (plan) or meter product.
 *
 * @returns `true` if the user has an active subscription to the subscription (plan) or meter product, `false` otherwise.
 */
export declare function is_user_subscribed_to(client: Stripe, server: Server, opts: {
    uid: string;
    plan: InitializedSubscriptionPlan | InitializedMeterProduct;
    customer_id: undefined | string;
    all_products: InitializedProduct[];
    status?: SemiActiveSubscriptionStatus[];
}): Promise<boolean>;
/**
 * Create a subscription for either:
 * - a subscription plan (licensed recurring)
 * - a meter product (metered recurring)
 *
 * This uses the customer's default invoice payment method for off-session billing and
 * returns a "requires_action" payload when SCA/3DS confirmation is needed in the UI.
 *
 * Stripe docs:
 * - Create subscription: https://docs.stripe.com/api/subscriptions/create
 * - Payment behavior (default_incomplete): https://docs.stripe.com/billing/subscriptions/overview#handling-incomplete-subscriptions
 * - Expand: https://docs.stripe.com/expand
 * - PaymentIntents: https://docs.stripe.com/api/payment_intents
 *
 * @warning This function intentionally creates subscriptions with `payment_behavior="default_incomplete"`
 *          so we can reliably detect and surface required customer actions (SCA).
 */
export declare function create_user_subscription(client: Stripe, server: Server, opts: {
    /** The user id (uid) to create the subscription for. */
    uid: string;
    /** The subscription target (plan or meter product). */
    target: InitializedSubscriptionPlan | InitializedMeterProduct;
    /** All initialized products (required to resolve trial/billing_anchor for plans). */
    all_products: InitializedProduct[];
    /** Idempotency key to ensure stable retries. */
    idempotency_key: string;
}): Promise<CreateSubscriptionResult>;
/**
 * Cancel a user's Stripe subscription(s) matching a specific subscription plan.
 *
 * Important behavior change:
 * - If the matched Stripe Subscription contains multiple subscription items (multiple plans),
 *   we still cancel the *entire* subscription (all items) to keep semantics simple and consistent.
 *
 * Stripe docs:
 * - Cancel a subscription: https://docs.stripe.com/api/subscriptions/cancel
 * - Update a subscription (cancel_at_period_end): https://docs.stripe.com/api/subscriptions/update
 * - List subscriptions: https://docs.stripe.com/api/subscriptions/list
 *
 * @note If a user is not subscribed to the specified plan, this function succeeds without doing anything (idempotent).
 *
 * @returns The affected subscriptions which were canceled/updated.
 */
export declare function cancel_user_subscription(client: Stripe, server: Server, opts: {
    /** The user id (uid) to cancel the subscription for. */
    uid: string;
    /** The specific plan to cancel (cancels subscriptions containing this plan price id). */
    plan: InitializedSubscriptionPlan;
    /** The stripe customer id, can be provided to avoid resolving it again. */
    customer_id: undefined | string;
    /** Whether to cancel at period end (default true). */
    cancel_at_period_end?: boolean;
}): Promise<Stripe.Subscription[]>;
/**
 * Enforce that a user can only have **one active subscription plan per SubscriptionProduct**.
 *
 * Workflow:
 * 1. Accepts the newly created/updated Stripe.Subscription (expanded items.price).
 * 2. Resolves which internal SubscriptionProduct it belongs to by matching *all* known plan price IDs.
 * 3. Lists all customer subscriptions.
 * 4. Cancels (immediately) all other active subscriptions that contain *any* plan
 *    from the same SubscriptionProduct, excluding the newly created subscription.
 *
 * Safety guarantees:
 * - Does nothing if the new subscription is not live.
 * - Does nothing if the subscription does not map to any known SubscriptionProduct.
 * - Cancels only subscriptions that clearly overlap with the same SubscriptionProduct.
 */
export declare function enforce_single_subscription_plan(client: Stripe, server: Server, opts: {
    /** Internal user id */
    uid: string;
    /** Stripe customer id */
    stripe_customer_id: string;
    /** Newly created or updated subscription (items.price must be expanded) */
    new_subscription: Stripe.Subscription;
    /** All initialized products */
    all_products: InitializedProduct[];
    /** An optional idempotency key. */
    idempotency_key?: string;
}): Promise<Stripe.Subscription[]>;
