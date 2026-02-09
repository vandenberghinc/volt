/**
 * @author Daan van den Bergh
 * @copyright © 2026 - 2026 Daan van den Bergh. All rights reserved
 */

import * as vlib from "@vandenberghinc/vlib";
import Stripe from "stripe";
import { ExternalStripeError, InternalStripeError } from "./error.js";
import { ensure_stripe_customer } from "./customers.js";
import { assert, generate_random_idempotency_key, public_assert, stripe_api_call, is_non_empty_string } from "./utils.js";
import type {
    InitializedMeterProduct,
    InitializedProduct,
    InitializedSubscriptionPlan,
    InitializedSubscriptionProduct,
    ProductId,
    SubscriptionPlanId,
} from "./products.js";

// ----------------------------------------------------------------------------
// Caching.

/**
 * Cache for the active subscriptions plan ids per user id.
 */
const active_sub_plans_cache = new vlib.Cache<string, SubscriptionPlanId[]>({
    max_size: 250_000,
    ttl: {
        sliding: true,
        duration: 1000 * 3600 * 24,
    },
});

/**
 * Cache for the active meter product ids per user id.
 */
const active_meters_cache = new vlib.Cache<string, ProductId[]>({
    max_size: 250_000,
    ttl: {
        sliding: true,
        duration: 1000 * 3600 * 24,
    },
});

// ----------------------------------------------------------------------------
// Internal helpers.

/**
 * A discriminated union describing what the UI must do after subscription creation.
 */
export type CreateSubscriptionResult =
    | {
            /** The outcome type. */
        type: "created";
        /** The Stripe subscription id. */
        subscription_id: string;
        /** The Stripe customer id. */
        stripe_customer_id: string;
        /** The resulting subscription status. */
        status: Stripe.Subscription.Status;
    }
    | {
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
 * List all subscriptions for a user.
 * 
 * We do not use any caching here by design, dont change this since it will break current implementations.
 *
 * Stripe docs:
 * - List subscriptions: https://docs.stripe.com/api/subscriptions/list
 * - Expand: https://docs.stripe.com/expand
 */
async function list_all_customer_subscriptions(
    client: Stripe,
    uid: string,
    customer_id: undefined | string, // keep as required param to avoid forgetting to define it where possible.
): Promise<Stripe.Subscription[]> {
    /** Validate input early to avoid cache poisoning with ambiguous keys. */
    assert(uid.trim().length > 0, "invalid_argument", "Uid must be a non-empty string.", { uid });

    // Ensure customer.
    const ensured_customer_id = customer_id ?? await ensure_stripe_customer(client, uid);

    // Fetch subscriptions.
    const subscriptions: Stripe.Subscription[] = [];
    let starting_after: string | undefined;
    for (; ;) {
        const page = await stripe_api_call(
            () =>
                client.subscriptions.list({
                    customer: ensured_customer_id,
                    status: "all",
                    limit: 100,
                    starting_after,
                    // ALWAYS expand, since the callee's expect this.
                    expand: ["data.items.data.price"],
                }),
            { operation: "subscriptions.list", customer_id: ensured_customer_id, starting_after },
        );

        subscriptions.push(...page.data);

        if (!page.has_more || page.data.length === 0) {
            break;
        }

        const last = page.data[page.data.length - 1];
        assert(last !== undefined, "api_error", "Stripe subscriptions pagination returned an empty last item.", {
            customer_id: ensured_customer_id,
            returned: page.data.length,
        });

        starting_after = last.id;
    }

    return subscriptions;
}

/**
 * Resolve the parent subscription product for a plan.
 * This is needed to apply subscription-level rules (trial_days, billing_anchor).
 */
function resolve_plan_parent_subscription(opts: {
    plan: InitializedSubscriptionPlan;
    all_products: InitializedProduct[];
}): InitializedSubscriptionProduct {
    for (const product of opts.all_products) {
        if (product.type === "subscription" && product.id === opts.plan.subscription_id) {
            return product;
        }
    }

    // If we cannot find it, this indicates a corrupted initialization state.
    throw new InternalStripeError(
        "invalid_product",
        "Subscription plan refers to a missing parent subscription product.",
        { plan_id: opts.plan.id, subscription_id: opts.plan.subscription_id },
    );
}

/**
 * Retrieve a Stripe customer and safely resolve the default payment method id for invoices/subscriptions.
 *
 * Stripe docs:
 * - Retrieve customer: https://docs.stripe.com/api/customers/retrieve
 * - invoice_settings.default_payment_method: https://docs.stripe.com/api/customers/object#customer_object-invoice_settings
 */
async function resolve_default_payment_method_id(
    client: Stripe,
    opts: {
        uid: string;
        stripe_customer_id: string;
    },
): Promise<string> {
    // We expand default_payment_method so we can always read `.id` without extra requests.
    const customer = await stripe_api_call(
        () =>
            client.customers.retrieve(opts.stripe_customer_id, {
                expand: ["invoice_settings.default_payment_method"],
            }),
        { operation: "customers.retrieve", uid: opts.uid, stripe_customer_id: opts.stripe_customer_id },
    );

    // Stripe can return DeletedCustomer; we must never proceed if the customer is deleted.
    public_assert(
        (customer as { deleted?: unknown }).deleted !== true,
        "customer_not_found",
        "Stripe customer was not found.",
        { uid: opts.uid, stripe_customer_id: opts.stripe_customer_id },
    );

    // We avoid any unsafe casts by narrowing through `unknown` and structural checks.
    const invoice_settings = (customer as { invoice_settings?: unknown }).invoice_settings;
    const default_payment_method = (invoice_settings as { default_payment_method?: unknown } | undefined)?.default_payment_method;

    // invoice_settings.default_payment_method is string | PaymentMethod | null.
    if (typeof default_payment_method === "string") {
        return default_payment_method;
    }

    if (default_payment_method && typeof default_payment_method === "object") {
        const id = (default_payment_method as { id?: unknown }).id;
        if (typeof id === "string" && id.trim().length > 0) {
            return id;
        }
    }

    // User-facing: without a default payment method, we cannot bill off-session securely.
    throw new ExternalStripeError(
        "payment_method_missing",
        "No default payment method on file. Please add a payment method before subscribing.",
        { uid: opts.uid, stripe_customer_id: opts.stripe_customer_id },
    );
}

/**
 * Extract a PaymentIntent from an expanded subscription.latest_invoice.payment_intent.
 *
 * Stripe docs:
 * - Subscription object: https://docs.stripe.com/api/subscriptions/object
 * - Invoice.payment_intent: https://docs.stripe.com/api/invoices/object#invoice_object-payment_intent
 * - PaymentIntent statuses: https://docs.stripe.com/api/payment_intents/object#payment_intent_object-status
 */
function resolve_payment_intent_from_subscription(subscription: Stripe.Subscription & {
    latest_invoice: Stripe.Invoice & { payment_intent: Stripe.PaymentIntent };
}): Stripe.PaymentIntent | null {
    const latest_invoice = subscription.latest_invoice;

    // latest_invoice is string | Invoice | null.
    if (!latest_invoice || typeof latest_invoice === "string") {
        return null;
    }

    const payment_intent = latest_invoice.payment_intent;

    // payment_intent is string | PaymentIntent | null.
    if (!payment_intent || typeof payment_intent === "string") {
        return null;
    }

    return payment_intent;
}

/**
 * Build SubscriptionCreateParams.SubscriptionData from our initialized product configuration.
 */
function build_subscription_create_params_from_product(opts: {
    uid: string;
    parent_subscription: InitializedSubscriptionProduct;
}): Pick<Stripe.SubscriptionCreateParams, "trial_period_days" | "billing_cycle_anchor" | "proration_behavior" | "metadata"> {
    const parent = opts.parent_subscription;

    const subscription_params: Pick<
        Stripe.SubscriptionCreateParams,
        "trial_period_days" | "billing_cycle_anchor" | "proration_behavior" | "metadata"
    > = {
        // Safe metadata for reconciliation and security auditing.
        metadata: {
            __volt_uid: opts.uid,
            __volt_subscription_id: parent.id,
        },
    };

    // Apply trial days if configured (Stripe requires integer days).
    if (parent.trial_days !== undefined) {
        subscription_params.trial_period_days = parent.trial_days;
    }

    // Apply billing anchor strategy.
    //
    // NOTE:
    // - We only support "immediately" and "first_of_month" because those are the only ones we model.
    // - For "first_of_month", we disable proration to avoid pro-rated invoices on anchor changes.
    const billing_anchor = parent.billing_anchor ?? "immediately";
    if (billing_anchor === "immediately") {
        return subscription_params;
    }

    if (billing_anchor === "first_of_month") {
        // We keep this logic consistent with checkout.ts: anchor to first day of next month
        // after the trial ends (or now if no trial).
        const now = new Date();
        const trial_days = parent.trial_days;
        const trial_end_reference = trial_days !== undefined ? new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate() + trial_days,
            now.getUTCHours(),
            now.getUTCMinutes(),
            now.getUTCSeconds(),
            now.getUTCMilliseconds(),
        )) : now;

        const anchor_date = new Date(Date.UTC(
            trial_end_reference.getUTCFullYear(),
            trial_end_reference.getUTCMonth() + 1,
            1,
            0, 0, 0, 0,
        ));

        // Stripe expects unix timestamp seconds.
        subscription_params.billing_cycle_anchor = Math.floor(anchor_date.getTime() / 1000);
        subscription_params.proration_behavior = "none";
        return subscription_params;
    }

    // Future-proof exhaustive safety.
    throw new InternalStripeError(
        "invalid_product",
        "Unsupported billing_anchor value.",
        { billing_anchor, subscription_id: parent.id },
    );
}

// ----------------------------------------------------------------------------
// Public API.

/**
 * Delete a user from the subscription caches.
 * Should be called after any mutation to the user's subscriptions to avoid stale cache entries.
 */
export function delete_subscription_caches(uid: string): void {
    active_sub_plans_cache.delete(uid);
    active_meters_cache.delete(uid);
}

/**
 * List all subscribed product plans for a given user.
 */
export async function list_subscribed_plans(
    client: Stripe,
    opts: {
        uid: string,
        customer_id: undefined | string, // keep as required param to avoid forgetting to define it where possible.
        all_products: InitializedProduct[],
    },
): Promise<SubscriptionPlanId[]> {
    /** Validate input early to avoid cache poisoning with ambiguous keys. */
    assert(opts.uid.trim().length > 0, "invalid_argument", "Uid must be a non-empty string.", { uid: opts.uid });

    // Check cache first.
    const cached = active_sub_plans_cache.get(opts.uid);
    if (cached != null) {
        return cached;
    }

    // Subscription statuses that represent a live (entitlement-granting) subscription.
    const active_sub_status: ReadonlySet<Stripe.Subscription.Status> = new Set([
        "active",
        "trialing",
        "past_due", // since Stripe can keep subscriptions in past_due while retrying payment.
    ]);

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
        if (!active_sub_status.has(subscription.status)) {
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
            }
        }
    }

    // Set cache.
    active_sub_plans_cache.set(opts.uid, matched_plan_ids);

    return matched_plan_ids;
}

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
export async function list_subscribed_meters(
    client: Stripe,
    opts: {
        uid: string;
        stripe_customer_id: string;
        all_products: InitializedProduct[];
    },
): Promise<ProductId[]> {

    // Check cache.
    const cached = active_meters_cache.get(opts.uid);
    if (cached) {
        return cached;
    }

    // Subscription statuses that represent a live (entitlement-granting) subscription.
    const active_sub_status: ReadonlySet<Stripe.Subscription.Status> = new Set([
        "active",
        // We dont allow `trialing` and `past_due` to reduce risk of accidental/abusive access.
    ]);

    // Map all meter product ids to their Stripe price ids for quick lookup.
    const meter_price_id_to_product_id = new Map<string, ProductId>();
    for (const product of opts.all_products) {
        if (product.type === "meter") {
            meter_price_id_to_product_id.set(product.stripe_price_id, product.id);
        }
    }

    // We fetch subscriptions and expand items.price so we can reliably compare price ids.
    // Docs: https://docs.stripe.com/api/subscriptions/list
    const subscriptions = await list_all_customer_subscriptions(
        client,
        opts.uid,
        opts.stripe_customer_id,
    );

    // Fetch all entitled meter products for a user.
    const entitled_meters: ProductId[] = [];
    for (const subscription of subscriptions) {
        if (!active_sub_status.has(subscription.status)) {
            continue;
        }
        for (const item of subscription.items.data) {
            const price = item.price;
            if (!price) {
                continue;
            }
            const resolved_meter = meter_price_id_to_product_id.get(price.id);
            if (!resolved_meter) {
                continue;
            }
            entitled_meters.push(resolved_meter);
        }
    }

    // Cache.
    active_meters_cache.set(opts.uid, entitled_meters);

    // Response.
    return entitled_meters;
}

/**
 * Check whether a user (by uid) is subscribed to a specific subscription (plan) or meter product.
 *
 * @returns `true` if the user has an active subscription to the subscription (plan) or meter product, `false` otherwise.
 */
export async function is_user_subscribed_to(
    client: Stripe,
    opts: {
        uid: string,
        plan: InitializedSubscriptionProduct | InitializedSubscriptionPlan | InitializedMeterProduct,
        customer_id: undefined | string, // keep as required param to avoid forgetting to define it where possible.
        all_products: InitializedProduct[],
    },
): Promise<boolean> {
    /** Validate inputs early. */
    assert(opts.plan.id.trim().length > 0, "invalid_argument", "Plan.id must be a non-empty string.", { plan_id: opts.plan.id });
    if (opts.plan.type === "subscription") {
        assert(Array.isArray(opts.plan.plans) && opts.plan.plans.length > 0, "invalid_argument", "Subscription product must have plans.", { plan_id: opts.plan.id });
    }

    // Meter product path.
    if (opts.plan.type === "meter") {
        const subscribed_plans = await list_subscribed_meters(client, {
            uid: opts.uid,
            stripe_customer_id: opts.customer_id ?? await ensure_stripe_customer(client, opts.uid),
            all_products: opts.all_products,
        });
        return subscribed_plans.includes(opts.plan.id);
    }

    // Subscription (plan) path.
    else {

        // Retrieve subscribed plans.
        const subscribed_plans = new Set(await list_subscribed_plans(client, {
            uid: opts.uid,
            customer_id: opts.customer_id,
            all_products: opts.all_products,
        }));

        // Check if the user is subscribed to the subscription product.
        if (opts.plan.type === "subscription") {
            for (const plan of opts.plan.plans) {
                if (subscribed_plans.has(plan.id)) {
                    return true;
                }
            }
        }
        // Check if the user is subscribed to the specific plan.
        else if (opts.plan.type === "subscription_plan") {
            if (subscribed_plans.has(opts.plan.id)) {
                return true;
            }
        }
        // @ts-expect-error should be never.
        else { opts.plan.toString() }
    }

    // Not subscribed.
    return false;
}

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
export async function create_user_subscription(
    client: Stripe,
    opts: {
        /** The user id (uid) to create the subscription for. */
        uid: string;
        /** The subscription target (plan or meter product). */
        target: InitializedSubscriptionPlan | InitializedMeterProduct;
        /** All initialized products (required to resolve trial/billing_anchor for plans). */
        all_products: InitializedProduct[];
        /** Optional Stripe customer id (avoids re-resolving). */
        customer_id: undefined | string;
        /** Optional: attach safe metadata (never secrets). */
        metadata?: Record<string, string>;
    },
): Promise<CreateSubscriptionResult> {
    // -------------------------------------------------------------------------
    // Validate inputs (user-facing where appropriate).

    public_assert(is_non_empty_string(opts.uid), "invalid_argument", "Property 'uid' must be a non-empty string.");
    assert(Array.isArray(opts.all_products), "invalid_argument", "Property 'all_products' must be an array.");
    assert(opts.target.id.trim().length > 0, "invalid_argument", "Target.id must be non-empty.", { target_id: opts.target.id });

    // Any mutation can change entitlements; invalidate cache up-front to reduce stale reads.
    delete_subscription_caches(opts.uid);

    // -------------------------------------------------------------------------
    // Ensure customer + default payment method.

    const stripe_customer_id = opts.customer_id ?? await ensure_stripe_customer(client, opts.uid);

    const default_payment_method_id = await resolve_default_payment_method_id(client, {
        uid: opts.uid,
        stripe_customer_id,
    });

    // -------------------------------------------------------------------------
    // Build subscription create params.

    const idempotency_key = generate_random_idempotency_key(`sub_create_${opts.uid}_${opts.target.id}`);

    // Base params shared for both plan and meter.
    const base_params: Stripe.SubscriptionCreateParams = {
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
            ...(opts.metadata ?? {}),
            __volt_uid: opts.uid,
            __volt_target_id: opts.target.id,
            __volt_target_type: opts.target.type,
        },
    };

    // Items differ per target type.
    if (opts.target.type === "subscription_plan") {
        // Resolve parent subscription product to apply trial/billing anchor coherently.
        const parent_subscription = resolve_plan_parent_subscription({
            plan: opts.target,
            all_products: opts.all_products,
        });

        const subscription_level_params = build_subscription_create_params_from_product({
            uid: opts.uid,
            parent_subscription,
        });

        // Stripe docs: items.price https://docs.stripe.com/api/subscriptions/create#create_subscription-items-price
        base_params.items = [{ price: opts.target.stripe_price_id, quantity: 1 }];

        // Apply subscription-level options (trial, anchor, metadata).
        base_params.trial_period_days = subscription_level_params.trial_period_days;
        base_params.billing_cycle_anchor = subscription_level_params.billing_cycle_anchor;
        base_params.proration_behavior = subscription_level_params.proration_behavior;

        // Merge metadata (preserve base keys).
        base_params.metadata = {
            ...(base_params.metadata ?? {}),
            ...(subscription_level_params.metadata ?? {}),
            __volt_subscription_id: parent_subscription.id,
            __volt_plan_id: opts.target.id,
        };
    } else if (opts.target.type === "meter") {
        // Meter products are metered recurring prices already linked to a Stripe Billing Meter during initialization.
        // Stripe docs: https://docs.stripe.com/api/prices/create (recurring.meter)
        base_params.items = [{ price: opts.target.stripe_price_id, quantity: 1 }];

        // Useful context for reconciliation.
        base_params.metadata = {
            ...(base_params.metadata ?? {}),
            __volt_meter_product_id: opts.target.id,
            __volt_meter_event_name: opts.target.meter_event_name,
        };
    } else {
        // Exhaustive safety for future target types.
        // @ts-expect-error should be never
        opts.target.toString();
        throw new InternalStripeError(
            "invalid_argument",
            "Unsupported subscription target type.",
            { target_type: (opts.target as unknown as { type?: unknown }).type },
        );
    }

    // -------------------------------------------------------------------------
    // Create subscription (expand latest_invoice.payment_intent so we can surface UI actions).

    const subscription = await stripe_api_call(
        () =>
            client.subscriptions.create(
                {
                    ...base_params,
                    // Expand payment intent so we can return client_secret for SCA, if required.
                    // Docs: https://docs.stripe.com/expand
                    expand: ["latest_invoice.payment_intent"],
                },
                { idempotencyKey: idempotency_key },
            ),
        {
            operation: "subscriptions.create",
            uid: opts.uid,
            stripe_customer_id,
            target_id: opts.target.id,
            target_type: opts.target.type,
        },
    ) as Stripe.Response<Stripe.Subscription & { latest_invoice: Stripe.Invoice & { payment_intent: Stripe.PaymentIntent } }>;

    // Mutation happened: invalidate cache again post-mutation to reduce stale reads.
    delete_subscription_caches(opts.uid);

    // -------------------------------------------------------------------------
    // Handle outcomes:
    // - active/trialing/past_due => success
    // - incomplete + requires_action => UI must confirm the PaymentIntent
    // - incomplete + requires_payment_method => user must add/replace payment method

    const payment_intent = resolve_payment_intent_from_subscription(subscription);

    // If Stripe indicates the PaymentIntent needs customer action, return client_secret to the UI.
    if (payment_intent && payment_intent.status === "requires_action") {
        const client_secret = payment_intent.client_secret;

        public_assert(
            is_non_empty_string(client_secret),
            "subscription_payment_action_required",
            "Additional payment verification is required, but Stripe did not return a client secret.",
            { subscription_id: subscription.id, payment_intent_id: payment_intent.id },
        );

        return {
            type: "requires_action",
            subscription_id: subscription.id,
            stripe_customer_id,
            payment_intent_id: payment_intent.id,
            client_secret,
            status: subscription.status,
        };
    }

    // If payment method was rejected/invalid, surface a user-actionable error.
    if (payment_intent && payment_intent.status === "requires_payment_method") {
        throw new ExternalStripeError(
            "payment_method_missing",
            "Your default payment method could not be charged. Please update your payment method and try again.",
            { subscription_id: subscription.id, payment_intent_id: payment_intent.id },
        );
    }

    // Some accounts/flows may produce an "incomplete" subscription without an expanded PI; treat as internal inconsistency.
    if (subscription.status === "incomplete" || subscription.status === "incomplete_expired") {
        throw new InternalStripeError(
            "subscription_create_error",
            "Subscription was created in an incomplete state without a resolvable PaymentIntent.",
            {
                uid: opts.uid,
                stripe_customer_id,
                subscription_id: subscription.id,
                status: subscription.status,
                has_latest_invoice: subscription.latest_invoice != null,
                has_payment_intent: payment_intent != null,
            },
        );
    }

    // Otherwise, consider it created (active/trialing/past_due/etc).
    return {
        type: "created",
        subscription_id: subscription.id,
        stripe_customer_id,
        status: subscription.status,
    };
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
    client: Stripe,
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
): Promise<Stripe.Subscription[]> {
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
    delete_subscription_caches(uid);

    // -------------------------------------------------------------------------
    // Fetch subscriptions.

    /** Fetch all subscriptions (paginated). */
    const subscriptions = await list_all_customer_subscriptions(client, uid, opts.customer_id);

    // -------------------------------------------------------------------------
    // Identify matching subscriptions.

    // Subscription statuses that represent a live (entitlement-granting) subscription.
    const active_sub_status: ReadonlySet<Stripe.Subscription.Status> = new Set([
        "active",
        "trialing",
        "past_due", // since Stripe can keep subscriptions in past_due while retrying payment.
    ]);

    const affected_subscriptions: Stripe.Subscription[] = [];

    for (const subscription of subscriptions) {
        // We only operate on active-ish subscriptions; canceled/unpaid ones are ignored.
        if (!active_sub_status.has(subscription.status)) {
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
        delete_subscription_caches(uid);

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
    delete_subscription_caches(uid);

    // Response.
    return affected_subscriptions;
}

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
export async function enforce_single_subscription_plan(
    client: Stripe,
    opts: {
        /** Internal user id */
        uid: string;
        /** Stripe customer id */
        stripe_customer_id: string;
        /** Newly created or updated subscription (items.price must be expanded) */
        new_subscription: Stripe.Subscription;
        /** All initialized products */
        all_products: InitializedProduct[];
    },
): Promise<Stripe.Subscription[]> {
    assert(opts.uid.length > 0, "invalid_argument", "uid must be provided");
    assert(opts.stripe_customer_id.length > 0, "invalid_argument", "stripe_customer_id must be provided");

    const { new_subscription, all_products } = opts;

    // Subscription statuses that represent a live (entitlement-granting) subscription.
    // Keep inline to avoid confusion with `active_subscription_statuses`.
    const active_sub_status: ReadonlySet<Stripe.Subscription.Status> = new Set([
        "active",
        "trialing",
        "past_due",
    ]);

    // Only enforce for live subscriptions
    if (!active_sub_status.has(new_subscription.status)) {
        return [];
    }

    // Build a map of price_id -> SubscriptionProduct
    const price_to_subscription_product = new Map<string, InitializedSubscriptionProduct>();
    for (const product of all_products) {
        if (product.type !== "subscription") continue;
        for (const plan of product.plans) {
            price_to_subscription_product.set(plan.stripe_price_id, product);
        }
    }

    // Resolve which SubscriptionProduct this new subscription belongs to
    const resolved_products = new Set<InitializedSubscriptionProduct>();
    for (const item of new_subscription.items.data) {
        const price = item.price;
        if (!price) continue;

        const sub_product = price_to_subscription_product.get(price.id);
        if (sub_product) {
            resolved_products.add(sub_product);
        }
    }

    // If we can't resolve exactly one subscription product, do nothing
    if (resolved_products.size === 0) {
        return [];
    }
    if (resolved_products.size > 1) {
        throw new InternalStripeError(
            "subscription_resolution_error",
            "Subscription resolves to multiple subscription products.",
            {
                subscription_id: new_subscription.id,
                subscription_product_ids: [...resolved_products].map((p) => p.id),
            },
        );
    }
    const [subscription_product] = [...resolved_products];

    // All Stripe price ids belonging to this SubscriptionProduct
    const product_price_ids = new Set(
        subscription_product.plans.map((p) => p.stripe_price_id),
    );

    // Fetch all customer subscriptions
    const all_subscriptions = await list_all_customer_subscriptions(
        client,
        opts.uid,
        opts.stripe_customer_id,
    );

    const canceled: Stripe.Subscription[] = [];

    for (const sub of all_subscriptions) {
        // Skip the newly created subscription
        if (sub.id === new_subscription.id) continue;

        // Only cancel live subscriptions
        if (!active_sub_status.has(sub.status)) continue;

        // Check if this subscription contains *any* plan from the same SubscriptionProduct
        let overlaps = false;
        for (const item of sub.items.data) {
            const price = item.price;
            if (!price) continue;
            if (product_price_ids.has(price.id)) {
                overlaps = true;
                break;
            }
        }
        if (!overlaps) continue;

        // Cancel immediately (idempotent)
        await stripe_api_call(
            () =>
                client.subscriptions.cancel(
                    sub.id,
                    undefined,
                    {
                        idempotencyKey: generate_random_idempotency_key(
                            `enforce_single_plan_${opts.stripe_customer_id}_${sub.id}`,
                        ),
                    },
                ),
            {
                operation: "subscriptions.cancel",
                action: "enforce_single_plan",
                uid: opts.uid,
                stripe_customer_id: opts.stripe_customer_id,
                kept_subscription_id: new_subscription.id,
                canceled_subscription_id: sub.id,
                subscription_product_id: subscription_product.id,
            },
        );
        canceled.push(sub);
    }

    // Invalidate cache.
    if (canceled.length > 0) {
        delete_subscription_caches(opts.uid);
    }

    // Return.
    return canceled;
}
