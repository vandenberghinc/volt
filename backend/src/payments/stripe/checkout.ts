/**
 * @author Daan van den Bergh
 * @copyright © 2026 - 2026 Daan van den Bergh. All rights reserved
 */

import Stripe from "stripe";
import * as vlib from "@vandenberghinc/vlib"

import {
    type InitializedOneTimeProduct,
    type InitializedProduct,
    type InitializedSubscriptionPlan,
    type InitializedMeterProduct,
    resolve_plan_to_parent_subscription,
    SubscriptionPlanId,
    ProductId,
} from "./products.js";
import { ensure_stripe_customer } from "./customers.js";
import { ExternalStripeError, InternalStripeError } from "./error.js";
import {
    assert,
    public_assert,
    stripe_api_call,
    add_days_utc,
    first_day_of_next_month_utc,
    to_unix_seconds,
    is_non_empty_string,
    generate_random_idempotency_key,
    stable_idempotency_key,
} from "./utils.js";
import { Server } from "../../server.js";
import { Collection } from "../../database/collection.js";
import { is_user_subscribed_to } from "./subscriptions.js";

// ----------------------------------------------------------------------------------
// Types.

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
 * The database record for a session.
 */
interface CheckoutSessionRecord {
    /** The internal user id, can be undefined for one-time payments. */
    uid: string | undefined;
    /** The internal session id, can be used as idempotency key. */
    session_id: string;
    /** Currency used for the session. */
    currency: string;
    /** The creation params. */
    create_params: Stripe.Checkout.SessionCreateParams;
}

// ----------------------------------------------------------------------------------
// Internal helpers.

/**
 * Resolve a product reference (object or id string) into an initialized purchasable item.
 *
 * Note: Passing a subscription *product id* is ambiguous (it can have multiple plans),
 * so we reject it with a user-visible error.
 */
function resolve_checkout_item_product(opts: {
    product_ref: InitializedOneTimeProduct | InitializedSubscriptionPlan | string;
    all_products: InitializedProduct[];
}): InitializedOneTimeProduct | InitializedSubscriptionPlan {
    const { product_ref, all_products } = opts;

    // Fast path: already a concrete initialized object.
    if (typeof product_ref !== "string") {
        return product_ref;
    }

    public_assert(
        is_non_empty_string(product_ref),
        "checkout_invalid_product_ref",
        "Invalid product reference.",
        { product_ref_type: typeof product_ref },
    );

    const ref_id = product_ref.trim();

    // 1) Try matching a one-time product by product id.
    for (const product of all_products) {
        if (product.type === "one_time" && product.id === ref_id) {
            return product;
        }
    }

    // 2) Try matching a subscription plan by plan id across all subscription products.
    const matching_plans: InitializedSubscriptionPlan[] = [];
    for (const product of all_products) {
        if (product.type !== "subscription") {
            continue;
        }

        for (const plan of product.plans) {
            if (plan.id === ref_id) {
                matching_plans.push(plan);
            }
        }

        // If the caller passed a subscription product id, that is ambiguous by definition.
        if (product.id === ref_id) {
            throw new ExternalStripeError(
                "checkout_subscription_plan_ambiguous",
                "Subscription product id is ambiguous. Please specify a subscription plan id.",
                { ref_id: ref_id },
            );
        }
    }

    public_assert(
        matching_plans.length === 1,
        matching_plans.length === 0 ? "checkout_invalid_product_ref" : "checkout_subscription_plan_ambiguous",
        matching_plans.length === 0
            ? "Unknown product reference."
            : "Ambiguous subscription plan reference. Plan id must be unique across products.",
        { ref_id, matches: matching_plans.length },
    );

    const plan = matching_plans[0];
    assert(plan !== undefined, "checkout_invalid_product_ref", "Missing plan after plan resolution.", { ref_id });
    return plan;
}

/**
 * Create the checkout session database collection.
 * The collection is only initialized on the first call and the cached collection is returned afterwards.
 */
function create_checkout_session_db(server: Server): Collection<CheckoutSessionRecord> {
    // Initialize the database connection.
    return server.db.collection<CheckoutSessionRecord>({
        name: "Volt.Stripe.CheckoutSessions",
        indexes: [
            {
                keys: { session_id: 1 },
                unique: true,
            },
            {
                keys: { uid: 1 },
                unique: false, // since it might be undefined/anonymous
            },
        ],
        ttl: {
            milliseconds: 1000 * 60 * 60 * 24, // 24 hours
            sliding: false,
        },
        // Ensure its not unique so we retrieve the cached collection if already created.
        unique: false,
    });
}

/**
 * Assert a success_url or cancel_url is a valid https URL.
 */
function assert_https_url(raw: string, field: "success_url" | "cancel_url", allowed_hosts: undefined | string[]): void {
    public_assert(is_non_empty_string(raw), "invalid_argument", `Property '${field}' must be provided.`);
    let url: URL;
    try {
        url = new URL(raw);
    } catch {
        throw new ExternalStripeError("invalid_argument", `Property '${field}' must be a valid absolute URL.`, { field });
    }
    public_assert(url.protocol === "https:", "invalid_argument", `Property '${field}' must use https.`, { field });
    public_assert(
        allowed_hosts === undefined || allowed_hosts.includes(url.host),
        "invalid_argument",
        `Property '${field}' must use an allowed host.`,
        { field, host: url.host },
    );
}

// ----------------------------------------------------------------------------------
// Public API

/**
 * Create a new session id to ensure idempotency for checkout session creation.
 */
export function create_checkout_session_id(uid: string | undefined): string {
    return generate_random_idempotency_key(`checkout_${uid ?? "anonymous"}`, 255);
}

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
export async function start_checkout_session(
    client: Stripe,
    server: Server,
    opts: CreateCheckoutSessionOpts,
): Promise<CreatedCheckoutSession> {
    // Basic validation (external/user-facing where appropriate).
    public_assert(
        is_non_empty_string(opts.session_id),
        "invalid_argument",
        "Property 'session_id' must be a non-empty string when provided.",
    );
    public_assert(Array.isArray(opts.line_items) && opts.line_items.length > 0, "invalid_argument", "Property 'line_items' must be a non-empty array.");
    public_assert(opts.line_items.length <= 50, "invalid_argument", "Too many line items.", { count: opts.line_items.length });
    assert(Array.isArray(opts.all_products), "invalid_argument", "Property 'all_products' must be an array.");
    assert_https_url(opts.success_url, "success_url", opts.allowed_hosts);
    assert_https_url(opts.cancel_url, "cancel_url", opts.allowed_hosts);

    // Resolve all item product references into concrete purchasable objects.
    const resolved_items: {
        product: InitializedOneTimeProduct | InitializedSubscriptionPlan;
        quantity: number;
    }[] = opts.line_items.map((item, index) => {
        public_assert(
            Number.isInteger(item.quantity) && item.quantity >= 1,
            "checkout_invalid_quantity",
            "Quantity must be an integer >= 1.",
            { index, quantity: item.quantity },
        );

        const resolved_product = resolve_checkout_item_product({
            product_ref: item.product,
            all_products: opts.all_products,
        });

        // Validate quantity rules.
        if (resolved_product.type === "one_time" && resolved_product.quantity_rules) {
            if (resolved_product.quantity_rules.min !== undefined) {
                public_assert(
                    item.quantity >= resolved_product.quantity_rules.min,
                    "checkout_invalid_quantity",
                    "Quantity is below the minimum allowed.",
                    { product_id: resolved_product.id, quantity: item.quantity, min: resolved_product.quantity_rules.min },
                );
            }

            if (resolved_product.quantity_rules.max !== undefined) {
                public_assert(
                    item.quantity <= resolved_product.quantity_rules.max,
                    "checkout_invalid_quantity",
                    "Quantity is above the maximum allowed.",
                    { product_id: resolved_product.id, quantity: item.quantity, max: resolved_product.quantity_rules.max },
                );
            }
        }

        // Validate subscription.
        if (resolved_product.type === "subscription_plan") {
            // Subscriptions are not seat-based in our model; quantity for subscription plans must be 1.
            public_assert(
                item.quantity === 1,
                "checkout_invalid_quantity",
                "Quantity must be 1 for subscription plans.",
                { plan_id: resolved_product.id, quantity: item.quantity },
            );
        }

        return {
            product: resolved_product,
            quantity: item.quantity,
        };
    });

    // Enforce: a Checkout Session may contain at most one subscription plan.
    //
    // Reason: Stripe Checkout creates exactly one Subscription per session in `mode="subscription"`,
    // and every recurring line item becomes a Subscription Item on that single Subscription.
    // Therefore, multiple `subscription_plan` items would create a multi-item subscription, which we forbid.
    // Since we need to cancel a subscription as a whole in Stripe, allowing multiple plans would also
    // cancel multiple plans when the user only meant to cancel one, which would be a bad experience.
    //
    // Stripe docs: https://docs.stripe.com/api/checkout/sessions/create
    let subscription_plan_count = 0;
    let selected_plan_id: string | undefined;
    let selected_subscription_id: string | undefined;

    for (const item of resolved_items) {
        if (item.product.type !== "subscription_plan") {
            continue;
        }

        subscription_plan_count += 1;

        // Capture for safe debug context.
        selected_plan_id = item.product.id;
        selected_subscription_id = item.product.subscription_id;

        public_assert(
            subscription_plan_count === 1,
            "checkout_subscription_plan_ambiguous",
            "Only one subscription plan can be purchased per checkout session.",
            {
                selected_plan_id,
                selected_subscription_id,
                subscription_plan_count,
            },
        );

        // Ensure uid is defined.
        public_assert(opts.uid != null && opts.uid !== "anonymous", "invalid_uid", "You must be authenticated to purchase a subscription, sign in or sign up and try again.", { uid: opts.uid });

        // Ensure the user is not already subscribed to the plan.
        const is_already_subscribed = await is_user_subscribed_to(client, server, {
            uid: opts.uid,
            plan: item.product,
            all_products: opts.all_products,
            customer_id: undefined,
        });
        public_assert(
            !is_already_subscribed,
            "checkout_already_subscribed",
            "You are already subscribed to this plan.",
            { uid: opts.uid, plan_id: item.product.id, subscription_id: item.product.subscription_id },
        );
    }

    // Determine mode (Stripe requires subscription mode if any recurring item is present).
    const has_subscription_item = resolved_items.some((item) => item.product.type === "subscription_plan");
    const mode: "payment" | "subscription" = has_subscription_item ? "subscription" : "payment";

    // Enforce single-currency checkouts (Stripe Checkout sessions are single-currency).
    const currencies = new Set<string>();
    for (const item of resolved_items) {
        if (item.product.type === "subscription_plan") {
            const parent_subscription = resolve_plan_to_parent_subscription({
                plan: item.product,
                all_products: opts.all_products,
            });
            currencies.add(parent_subscription.currency);
        } else {
            currencies.add(item.product.currency);
        }
    }
    public_assert(
        currencies.size === 1,
        "checkout_mixed_currency",
        "All checkout items must use the same currency.",
        { currencies: Array.from(currencies.values()) },
    );
    const currency = Array.from(currencies.values())[0];
    assert(currency !== undefined, "checkout_mixed_currency", "Missing currency after currency validation.");

    // If mode is subscription, ensure the `uid` is defined.
    // And retrieve the stripe customer id.
    // For one-time payments, creating a Customer is optional; avoid extra API calls unless you need it.
    let stripe_customer_id: string | undefined;
    if (mode === "subscription" || opts.uid) {
        public_assert(opts.uid != null && opts.uid !== "anonymous", "invalid_uid", "You must be authenticated to purchase a subscription, sign in or sign up and try again.", { uid: opts.uid });
        public_assert(is_non_empty_string(opts.uid), "invalid_argument", "Property 'uid' must be a non-empty string.");
        stripe_customer_id = await ensure_stripe_customer(client, server, opts.uid);
    }

    // Build Stripe line items.
    const stripe_line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = resolved_items.map((item) => {
        // We only use pre-created Price ids to avoid “inline price” pitfalls and keep tax behavior stable.
        // Stripe docs: line_items.price https://docs.stripe.com/api/checkout/sessions/create
        public_assert(
            is_non_empty_string(item.product.stripe_price_id),
            "invalid_product",
            "Product is missing a Stripe price id.",
            { product_id: item.product.id, type: item.product.type },
        );
        return {
            price: item.product.stripe_price_id,
            quantity: item.quantity,
        };
    });

    // Subscription-specific settings (trial_days + billing_anchor).
    let subscription_data: Stripe.Checkout.SessionCreateParams.SubscriptionData | undefined;

    if (mode === "subscription") {
        // Collect the subscription-level settings from each subscription product referenced.
        // Note: Stripe creates a single Subscription object for the Checkout Session, so
        // these settings must be coherent across all subscription products in the cart.
        const trial_days_values = new Set<number>();
        const billing_anchor_values = new Set<"immediately" | "first_of_month">();

        for (const item of resolved_items) {
            if (item.product.type !== "subscription_plan") {
                continue;
            }

            const parent_subscription = resolve_plan_to_parent_subscription({
                plan: item.product,
                all_products: opts.all_products,
            });

            if (parent_subscription.trial_days !== undefined) {
                trial_days_values.add(parent_subscription.trial_days);
            }

            // Default was set during initialization, but we still guard.
            const anchor = parent_subscription.billing_anchor ?? "immediately";
            billing_anchor_values.add(anchor);
        }

        // If multiple different trial_days or anchors exist, it is ambiguous which to apply.
        public_assert(
            trial_days_values.size <= 1,
            "invalid_product",
            "Conflicting 'trial_days' across subscription products in the same checkout.",
            { trial_days_values: Array.from(trial_days_values.values()) },
        );

        public_assert(
            billing_anchor_values.size <= 1,
            "invalid_product",
            "Conflicting 'billing_anchor' across subscription products in the same checkout.",
            { billing_anchor_values: Array.from(billing_anchor_values.values()) },
        );

        const trial_days = Array.from(trial_days_values.values())[0];
        const billing_anchor = Array.from(billing_anchor_values.values())[0] ?? "immediately";

        subscription_data = {};

        // Apply trial days, if configured.
        if (trial_days !== undefined) {
            subscription_data.trial_period_days = trial_days;
        }

        // Apply billing anchor strategy, if requested.
        if (billing_anchor === "first_of_month") {
            // We anchor to the first day of the next month *after the trial ends* (or after “now” if no trial).
            // This avoids Stripe rejecting an anchor that is earlier than the first invoice timing in practice.
            // Stripe docs: subscription_data.billing_cycle_anchor and proration_behavior.
            const now = new Date();
            const trial_end_reference = trial_days !== undefined ? add_days_utc(now, trial_days) : now;
            const anchor_date = first_day_of_next_month_utc(trial_end_reference);

            subscription_data.billing_cycle_anchor = to_unix_seconds(anchor_date);
            subscription_data.proration_behavior = "none";
        } else if (billing_anchor === "immediately") {
            // Default behavior: Stripe anchors to creation time (or trial end when a trial is set).
        } else {
            // Exhaustive safety for future anchor variants.
            throw new InternalStripeError(
                "invalid_product",
                "Unsupported billing_anchor value.",
                { billing_anchor },
            );
        }

        // Include safe metadata on the Subscription object for downstream reconciliation (optional).
        if (opts.uid) {
            subscription_data.metadata = {
                __volt_uid: opts.uid,
            };
        }
    }

    // Build Checkout Session request.
    const create_params: Stripe.Checkout.SessionCreateParams = {
        // Docs: https://docs.stripe.com/api/checkout/sessions/create
        mode,
        ...(stripe_customer_id ? { customer: stripe_customer_id } : {}),
        success_url: opts.success_url,
        cancel_url: opts.cancel_url,
        line_items: stripe_line_items,
        customer_update: {
            address: "auto",
            name: "auto",
            shipping: "auto",
        },

        // Stripe Tax: collect address automatically for tax calculation.
        // Docs: https://docs.stripe.com/tax/checkout
        automatic_tax: { enabled: true },

        // Optional: tax id collection is helpful for B2B scenarios (e.g. VAT).
        ...(opts.tax_id_collection_enabled === true ? { tax_id_collection: { enabled: true } } : {}),

        // Attach safe session metadata (not secrets).
        metadata: {
            ...(opts.uid ? { __volt_uid: opts.uid } : {}),
            __volt_mode: mode,
        },

        // Include subscription configuration only in subscription mode.
        ...(subscription_data ? { subscription_data } : {}),
    };

    // Initialize the record collection.
    const checkout_session_db = create_checkout_session_db(server);

    // Check if a session record already exists.
    // If so then we need to assert the create_params and currency are the same to ensure idempotency.
    const loaded_session = await checkout_session_db.load(
        { session_id: opts.session_id },
        { throw: false, retry: 3 }
    );
    let pinned_session: CheckoutSessionRecord;
    if (loaded_session instanceof Collection.NotFoundError) {
        // No existing session, proceed to create a new one.
        const record: CheckoutSessionRecord = {
            uid: opts.uid,
            session_id: opts.session_id,
            currency,
            create_params,
        };
        await checkout_session_db.set(
            { session_id: opts.session_id },
            record,
            { throw: true, retry: 3 }
        );
        pinned_session = record;
    }
    // Another error.
    else if (loaded_session instanceof Error) {
        throw new InternalStripeError(
            "checkout_create_error",
            "Failed to access checkout session record.",
            { uid: opts.uid, session_id: opts.session_id },
            loaded_session,
        );
    }

    // Compare the existing session's create_params and currency with the current ones to ensure idempotency.
    else {
        if (
            loaded_session.currency !== currency
            || !vlib.Object.deep_eq(loaded_session.create_params, create_params)
        ) {
            throw new ExternalStripeError(
                "checkout_create_error",
                "A checkout session with the same session_id already exists with different parameters. Please use a unique session_id for each distinct checkout session.",
                { uid: opts.uid, session_id: opts.session_id },
            );
        }
        pinned_session = loaded_session;
    }

    // Create session.
    // We use stripe_api_call to consistently throw InternalStripeError on Stripe API failures.
    // Docs: https://docs.stripe.com/api/checkout/sessions/create
    const session = await stripe_api_call(
        () =>
            client.checkout.sessions.create(pinned_session.create_params, {
                idempotencyKey: stable_idempotency_key(
                    `checkout.sessions.create:${pinned_session.session_id}`,
                    255,
                ),
            }),
        { operation: "checkout.sessions.create" },
    );

    // The hosted URL is required for redirect-based Checkout.
    // If your integration uses embedded/custom UI mode later, you’d return client_secret instead.
    public_assert(
        is_non_empty_string(session.url),
        "checkout_create_error",
        "Stripe did not return a checkout URL.",
        { session_id: session.id, mode: session.mode },
    );

    // Stripe returns `mode` as a string; we normalize to our union type.
    const session_mode = session.mode === "subscription" ? "subscription" : "payment";

    return {
        id: session.id,
        url: session.url,
        mode: session_mode,
        currency: pinned_session.currency,
    };
}
