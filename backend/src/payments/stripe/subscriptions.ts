/**
 * @author Daan van den Bergh
 * @copyright © 2026 - 2026 Daan van den Bergh. All rights reserved
 */

import * as vlib from "@vandenberghinc/vlib";
import StripeClient from "stripe";
import { InternalStripeError } from "./error.js";
import { ensure_stripe_customer } from "./customers.js";
import { assert, generate_random_idempotency_key, stripe_api_call } from "./utils.js";
import type { InitializedProduct, InitializedSubscriptionPlan, InitializedSubscriptionProduct, SubscriptionPlan, SubscriptionPlanId } from "./products.js";

// ----------------------------------------------------------------------------
// Caching.

/**
 * Cache for the active subscriptions plan ids per user.
 */
const subscriptions_cache = new vlib.Cache<string, SubscriptionPlanId[]>({
    max_size: 100_000,
    ttl: {
        sliding: true,
        duration: 60 * 1000, // 60 seconds (keep short to avoid stale entitlements too long)
    },
});

// ----------------------------------------------------------------------------
// Stripe querying helpers.

/**
 * List all subscriptions for a user.
 *
 * Stripe docs:
 * - List subscriptions: https://docs.stripe.com/api/subscriptions/list
 * - Expand: https://docs.stripe.com/expand
 */
async function list_all_customer_subscriptions(
    client: StripeClient,
    uid: string,
    customer_id: undefined | string, // keep as required param to avoid forgetting to define it where possible.
): Promise<StripeClient.Subscription[]> {

    /** Validate input early to avoid cache poisoning with ambiguous keys. */
    assert(uid.trim().length > 0, "invalid_argument", "Uid must be a non-empty string.", { uid });

    // Ensure customer.
    if (!customer_id) {
        customer_id = await ensure_stripe_customer(client, uid);
    }

    // Fetch subscriptions.
    const subscriptions: StripeClient.Subscription[] = [];
    let starting_after: string | undefined;
    for (; ;) {
        const page = await stripe_api_call(
            () =>
                client.subscriptions.list({
                    customer: customer_id,
                    status: "all",
                    limit: 100,
                    starting_after,
                    expand: ["data.items.data.price"],
                }),
            { operation: "subscriptions.list", customer_id, starting_after },
        );

        subscriptions.push(...page.data);

        if (!page.has_more || page.data.length === 0) {
            break;
        }

        const last = page.data[page.data.length - 1];
        assert(last !== undefined, "api_error", "Stripe subscriptions pagination returned an empty last item.", {
            customer_id,
            returned: page.data.length,
        });

        starting_after = last.id;
    }

    return subscriptions;
}


/**
 * The subscription statuses that we consider as "subscribed" for entitlement purposes.
 *
 * We intentionally include "past_due" because Stripe can keep a subscription in past_due while retrying payment.
 * If your business rules require stricter access control, remove it here.
 */
const active_subscription_statuses: ReadonlySet<StripeClient.Subscription.Status> = new Set([
    "active",
    "trialing",
    "past_due",
]);

// ----------------------------------------------------------------------------
// Public API.

/**
 * Delete a user from the subcribed plans cache.
 * Should be called after any mutation to the user's subscriptions to avoid stale cache entries.
 */
export function delete_uid_from_subscription_cache(uid: string): void {
    subscriptions_cache.delete(uid);
}

/**
 * List all subscribed product plans for a given user.
 */
export async function list_subscribed_plans(client: StripeClient, opts: {
    uid: string,
    customer_id: undefined | string, // keep as required param to avoid forgetting to define it where possible.
    all_products: InitializedProduct[],
}): Promise<SubscriptionPlanId[]> {

    /** Validate input early to avoid cache poisoning with ambiguous keys. */
    assert(opts.uid.trim().length > 0, "invalid_argument", "Uid must be a non-empty string.", { uid: opts.uid });

    // Check cache first.
    const cached = subscriptions_cache.get(opts.uid);
    if (cached) {
        return cached;
    }

    // Fetch subscriptions.
    const subscriptions = await list_all_customer_subscriptions(client, opts.uid, opts.customer_id);

    // Index subscription plans to their stripe price ids for fast lookup.
    const price_id_to_plan = new Map<string, InitializedSubscriptionPlan>();
    for (const product of opts.all_products) {
        if (product.type !== "subscription") {
            continue;
        }
        for (const plan of product.plans) {
            price_id_to_plan.set(plan.stripe_price_id, plan);
        }
    }

    // The active plan ids.
    const matched_plan_ids: SubscriptionPlanId[] = [];

    // Walk all subscriptions.
    for (const subscription of subscriptions) {
        if (!active_subscription_statuses.has(subscription.status)) {
            continue;
        }

        for (const item of subscription.items.data) {
            const price = item.price;
            if (!price) {
                continue;
            }
            const plan_id = price_id_to_plan.get(price.id)?.id;
            if (plan_id) {
                matched_plan_ids.push(plan_id);
                break;
            }
        }
    }

    // Set cache.
    subscriptions_cache.set(opts.uid, matched_plan_ids);

    return matched_plan_ids;
}

/**
 * Check whether a user (by uid) is subscribed to a specific subscription (plan).
 *
 * @returns `true` if the user has an active subscription to the subscription or plan, `false` otherwise.
 */
export async function is_user_subscribed_to(client: StripeClient, opts: {
    uid: string,
    plan: InitializedSubscriptionProduct | InitializedSubscriptionPlan,
    customer_id: undefined | string, // keep as required param to avoid forgetting to define it where possible.
    all_products: InitializedProduct[],
}): Promise<boolean> {
    
    /** Validate inputs early. */
    assert(opts.plan.id.trim().length > 0, "invalid_argument", "Plan.id must be a non-empty string.", { plan_id: opts.plan.id });
    if (opts.plan.type === "subscription") {
        assert(Array.isArray(opts.plan.plans) && opts.plan.plans.length > 0, "invalid_argument", "Subscription product must have plans.", { plan_id: opts.plan.id });
    }
    else if (opts.plan.type === "subscription_plan") {
        assert(opts.plan.stripe_price_id.trim().length > 0, "invalid_argument", "Plan.stripe_price_id must be a non-empty string.", {
            plan_id: opts.plan.id,
        });
    }
    // @ts-expect-error should be never.
    else { opts.plan.toString() }

    // Retrieve subscribed plans.
    const subscribed_plans = await list_subscribed_plans(client, {
        uid: opts.uid,
        customer_id: opts.customer_id,
        all_products: opts.all_products,
    });

    // Check if the user is subscribed to the subscription product.
    if (opts.plan.type === "subscription") {
        for (const plan of opts.plan.plans) {
            if (subscribed_plans.includes(plan.id)) {
                return true;
            }
        }
    }
    // Check if the user is subscribed to the specific plan.
    else if (opts.plan.type === "subscription_plan") {
        if (subscribed_plans.includes(opts.plan.id)) {
            return true;
        }
    }
    // @ts-expect-error should be never.
    else { opts.plan.toString() }

    // Not subscribed.
    return false;
}

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
export async function cancel_user_subscription(
    client: StripeClient,
    opts: {
        /** The user id (uid) to cancel the subscription for. */
        uid: string;
        /** The specific plan to cancel (cancels subscriptions containing this plan price id). */
        plan: InitializedSubscriptionPlan;
        /** The stripe customer id, can be provided to avoid resolving it again. */
        customer_id: undefined | string;
        /** Whether to cancel at period end (default true). */
        cancel_at_period_end?: boolean;
    },
): Promise<StripeClient.Subscription[]> {
    // -------------------------------------------------------------------------
    // Validate inputs.

    const uid = opts.uid;

    /** Validate uid so we never act on an ambiguous identity. */
    assert(uid.trim().length > 0, "invalid_argument", "Uid must be a non-empty string.", { uid });

    /** Validate plan fields so we only match the intended Stripe price. */
    assert(opts.plan.id.trim().length > 0, "invalid_argument", "Plan.id must be non-empty.", { plan_id: opts.plan.id });
    assert(
        opts.plan.stripe_price_id.trim().length > 0,
        "invalid_argument",
        "Plan.stripe_price_id must be non-empty.",
        { plan_id: opts.plan.id },
    );

    const cancel_at_period_end = opts.cancel_at_period_end ?? true;

    // Any mutation can change entitlements; invalidate cache up-front to reduce stale reads.
    delete_uid_from_subscription_cache(uid);

    // -------------------------------------------------------------------------
    // Fetch subscriptions.

    /** Fetch all subscriptions (paginated). */
    const subscriptions = await list_all_customer_subscriptions(client, uid, opts.customer_id);

    // -------------------------------------------------------------------------
    // Identify matching subscriptions.

    const affected_subscriptions: StripeClient.Subscription[] = [];

    for (const subscription of subscriptions) {
        // We only operate on active-ish subscriptions; canceled/unpaid ones are ignored.
        if (!active_subscription_statuses.has(subscription.status)) {
            continue;
        }

        // Match if any subscription item uses the plan's Stripe price id.
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

    // Idempotent semantics: if nothing matches, succeed without doing anything.
    if (affected_subscriptions.length === 0) {
        // Best-effort cache invalidation so the next read doesn't serve stale positives.
        delete_uid_from_subscription_cache(uid);

        return [];
    }

    // -------------------------------------------------------------------------
    // Cancel/update subscriptions.
    //
    // NOTE: Even if a subscription contains multiple items (multiple plans),
    // we cancel the entire subscription to avoid partial-cancel surprises.

    await Promise.all(
        affected_subscriptions.map(async (subscription) => {
            if (cancel_at_period_end) {
                // Non-destructive cancel: the subscription stays active until end of period, then cancels.
                await stripe_api_call(
                    () =>
                        client.subscriptions.update(
                            subscription.id,
                            { cancel_at_period_end: true },
                            { idempotencyKey: generate_random_idempotency_key(`sub_cancel_at_period_end_${subscription.id}`) },
                        ),
                    {
                        operation: "subscriptions.update",
                        action: "cancel_at_period_end",
                        uid,
                        subscription_id: subscription.id,
                        plan_id: opts.plan.id,
                        stripe_price_id: opts.plan.stripe_price_id,
                    },
                );
            } else {
                // Immediate cancellation.
                await stripe_api_call(
                    () =>
                        client.subscriptions.cancel(
                            subscription.id,
                            undefined,
                            { idempotencyKey: generate_random_idempotency_key(`sub_cancel_immediate_${subscription.id}`) },
                        ),
                    {
                        operation: "subscriptions.cancel",
                        action: "cancel_immediately",
                        uid,
                        subscription_id: subscription.id,
                        plan_id: opts.plan.id,
                        stripe_price_id: opts.plan.stripe_price_id,
                    },
                );
            }
        }),
    );

    // Mutation happened: invalidate cache again post-mutation to reduce stale reads.
    delete_uid_from_subscription_cache(uid);

    // Response.
    return affected_subscriptions;
}
