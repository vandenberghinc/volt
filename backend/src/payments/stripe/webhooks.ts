/**
 * @author Daan van den Bergh
 * @copyright © 2026 - 2026 Daan van den Bergh. All rights reserved
 * 
 * Stripe webhook entrypoint:
 * - Verifies webhook signatures (security-critical).
 * - Handles lifecycle events emitted by our billing flows (Checkout, Subscriptions, Invoices, SetupIntents, PaymentIntents).
 * - Invalidates local entitlement caches after Stripe-side mutations.
 * - Triggers server events for application-level reactions.
 *
 * Stripe docs:
 * - Webhooks: https://docs.stripe.com/webhooks
 * - Verify signatures: https://docs.stripe.com/webhooks/signatures
 */

/**
 * @WARNING
 * WHEN HANDLING NEW SUBSCRIPTION EVENTS OF A HIGHER OR LOWER PLAN
 * DONT FORGET TO CANCEL THE OTHER SUBSCRIBED PLANS FROM THE PARENT SUBSCRIPTION
 */

import * as vlib from "@vandenberghinc/vlib";
import Stripe from "stripe";

import { InternalStripeError } from "./error.js";
import {
    assert,
    is_non_empty_string,
    stripe_api_call,
} from "./utils.js";
import type {
    InitializedMeterProduct,
    InitializedProduct,
    InitializedSubscriptionPlan,
    InitializedSubscriptionProduct,
    InitializedOneTimeProduct,
} from "./products.js";
import {
    resolve_plan_to_parent_subscription,
} from "./products.js";
import {
    delete_subscription_caches,
} from "./subscriptions.js";
import { Server } from "src/server.js";
import { finalize_payment_method_setup } from "./payment_methods.js";

// -------------------------------------------------------------------------------------------------
// Public events types (user-land).

/**
 * A resolved subscription item mapping that we expose to event consumers.
 */
export type StripeResolvedSubscriptionItem =
    | {
        /** The Stripe price id on the subscription item. */
        stripe_price_id: string;
        // Note that other product/plan attributes are not available here.
        // This can happen if the `stripe_price_id` does not match any
        // known products/plans from our initializer (e.g. created outside our system).
    }
    | {
        /** The Stripe price id on the subscription item. */
        stripe_price_id: string;
        /** The resolved subscription product (when price maps to a known plan). */
        product: InitializedSubscriptionProduct;
        /** The resolved subscription plan (licensed) when applicable. */
        plan: InitializedSubscriptionPlan;
    }
    | {
        /** The Stripe price id on the subscription item. */
        stripe_price_id: string;
        /** The resolved subscription product (when price maps to a known plan). */
        product: InitializedMeterProduct;
    };

// -------------------------------------------------------------------------------------------------
// Internal constants.

/** The uid metadata key we use across Stripe objects. */
const stripe_uid_metadata_key = "__volt_uid";

/**
 * Dedup cache for webhook event ids (webhooks are delivered at-least-once).
 * We keep a short TTL to avoid double-processing on transient retries.
 */
const processed_event_id_cache = new vlib.Cache<string, true>({
    max_size: 250_000,
    ttl: {
        sliding: true,
        duration: 5 * 60 * 1000, // 5 minutes
    },
});

// -------------------------------------------------------------------------------------------------
// Internal helpers.

/**
 * Build a mapping from Stripe price id -> (plan | meter_product) for fast resolution.
 */
function index_products_by_stripe_price_id(all_products: InitializedProduct[]): {
    plan_by_price_id: Map<string, InitializedSubscriptionPlan>;
    meter_by_price_id: Map<string, InitializedMeterProduct>;
    subscription_by_id: Map<string, InitializedSubscriptionProduct>;
} {
    const plan_by_price_id = new Map<string, InitializedSubscriptionPlan>();
    const meter_by_price_id = new Map<string, InitializedMeterProduct>();
    const subscription_by_id = new Map<string, InitializedSubscriptionProduct>();

    for (const product of all_products) {
        if (product.type === "subscription") {
            subscription_by_id.set(product.id, product);
            for (const plan of product.plans) {
                plan_by_price_id.set(plan.stripe_price_id, plan);
            }
        } else if (product.type === "meter") {
            meter_by_price_id.set(product.stripe_price_id, product);
        } else if (product.type === "one_time") {
            // Note: one-time products can show up in checkout sessions, but not in subscriptions.
            // We do not index them here for subscription item mapping.
            void product;
        }
    }

    return { plan_by_price_id, meter_by_price_id, subscription_by_id };
}

/**
 * Resolve subscription item mappings from a Stripe subscription object.
 *
 * We expect `subscription.items.data[].price` to be expanded or at least present with `id`.
 */
function resolve_subscription_items(opts: {
    subscription: Stripe.Subscription;
    all_products: InitializedProduct[];
}): StripeResolvedSubscriptionItem[] {
    const { plan_by_price_id, meter_by_price_id } = index_products_by_stripe_price_id(opts.all_products);

    const resolved: StripeResolvedSubscriptionItem[] = [];

    for (const item of opts.subscription.items.data) {
        const price = item.price;
        if (!price) {
            continue;
        }

        const stripe_price_id = price.id;
        const plan = plan_by_price_id.get(stripe_price_id) ?? undefined;
        const meter_product = meter_by_price_id.get(stripe_price_id) ?? undefined;

        if (plan) {
            const product = resolve_plan_to_parent_subscription({
                plan,
                all_products: opts.all_products,
            });
            resolved.push({
                stripe_price_id,
                product,
                plan,
            });
        } else if (meter_product) {
            resolved.push({
                stripe_price_id,
                product: meter_product,
            });
        } else {
            // Unknown price id (maybe created outside our initializer). We still surface the price id.
            resolved.push({ stripe_price_id });
        }
    }

    return resolved;
}

/**
 * Verify and construct a Stripe event from raw request payload.
 */
function construct_stripe_event(
    client: Stripe,
    opts: {
        webhook_signing_secret: string;
        raw_body: string | Buffer;
        stripe_signature_header: string;
    },
): Stripe.Event {
    // Security: This is the only safe way to validate the signature and parse the event.
    // Docs: https://docs.stripe.com/webhooks/signatures#verify-signatures
    try {
        return client.webhooks.constructEvent(
            opts.raw_body,
            opts.stripe_signature_header,
            opts.webhook_signing_secret,
        );
    } catch (error: unknown) {
        // Signature issues are user-facing *only* if exposed through an API; usually treat as internal and log.
        throw new InternalStripeError(
            "invalid_argument",
            "Invalid Stripe webhook signature.",
            { has_signature: is_non_empty_string(opts.stripe_signature_header) },
            error,
        );
    }
}

/**
 * Await the events trigger() response chronologically.
 */
async function await_event_trigger(response: (void | Promise<any>)[]): Promise<void> {
    for (const res of response) {
        if (!res) continue;
        await res;
    }
}

// -------------------------------------------------------------------------------------------------
// Public API (minimal exports).

/**
 * Handle a Stripe webhook call:
 * - verifies signature
 * - deduplicates event ids briefly
 * - routes event types to handlers
 * - emits application events via `server.events.trigger`
 *
 * @noote This function expects the caller to provide the raw body and Stripe-Signature header.
 */
export async function handle_stripe_webhook(
    client: Stripe,
    opts: {
        /** The running server instance (used for event emission). */
        server: Server;
        /** The Stripe webhook signing secret for this endpoint. */
        webhook_signing_secret: string;
        /**
         * The raw request body (unparsed) as received from Stripe.
         * Security: signature verification requires the exact raw bytes.
         */
        raw_body: string | Buffer;
        /**
         * The `Stripe-Signature` request header.
         * Docs: https://docs.stripe.com/webhooks/signatures#verify-signatures
         */
        stripe_signature_header: string;
        /**
         * The initialized products list (for mapping price ids back to user-exposed products/plans).
         * Pass the same list you use in checkout/subscriptions logic.
         */
        all_products: InitializedProduct[];
    },
): Promise<void> {
    // Validate critical inputs early.
    assert(is_non_empty_string(opts.webhook_signing_secret), "invalid_argument", "webhook_signing_secret must be provided.");
    assert(is_non_empty_string(opts.stripe_signature_header), "invalid_argument", "stripe_signature_header must be provided.");
    assert(Array.isArray(opts.all_products), "invalid_argument", "all_products must be an array.");

    // 1) Verify signature + parse event.
    const event = construct_stripe_event(client, {
        webhook_signing_secret: opts.webhook_signing_secret,
        raw_body: opts.raw_body,
        stripe_signature_header: opts.stripe_signature_header,
    });

    // 2) Deduplicate best-effort (webhooks are at-least-once).
    if (processed_event_id_cache.get(event.id) === true) {
        opts.server.log(1, "Stripe webhook deduplicated event: ", { event_id: event.id, type: event.type });
        return;
    }
    processed_event_id_cache.set(event.id, true);

    // 3) Route by event type.
    //
    // Stripe event type list: https://docs.stripe.com/api/events/types
    switch (event.type) {
        case "checkout.session.completed": {
            opts.server.log(1, "Stripe webhook received checkout.session.completed: ", { event_id: event.id });

            const session = event.data.object;

            const stripe_session_id = session.id;
            assert(is_non_empty_string(stripe_session_id), "api_error", "checkout.session.completed missing session.id");

            const uid = session.metadata?.[stripe_uid_metadata_key];
            if (!is_non_empty_string(uid)) {
                // If we cannot map to a uid, we cannot safely emit app-level events.
                // Treat as internal misconfiguration (metadata missing).
                throw new InternalStripeError(
                    "invalid_argument",
                    "Checkout session missing uid metadata.",
                    { stripe_session_id },
                );
            }

            const mode: "payment" | "subscription" =
                session.mode === "subscription" ? "subscription" : "payment";

            const stripe_customer_id = session.customer;
            assert(is_non_empty_string(stripe_customer_id), "api_error", "Checkout session missing customer id.", {
                uid,
                stripe_session_id,
            });

            const stripe_subscription_id = typeof session.subscription === "string" ? session.subscription : undefined;
            const currency = is_non_empty_string(session.currency) ? session.currency : undefined;

            // Stripe metadata values are already strings.
            const metadata: Record<string, string> = session.metadata ?? {};

            // Invalidate subscription cache.
            delete_subscription_caches(uid);

            await await_event_trigger(opts.server.events.trigger("stripe.checkout_session_completed", {
                uid,
                stripe_session_id,
                mode,
                stripe_customer_id,
                stripe_subscription_id,
                currency,
                metadata,
            }));

            return;
        }

        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
            opts.server.log(1, "Stripe webhook received subscription event: ", { event_id: event.id, type: event.type });

            const subscription = event.data.object;

            const stripe_subscription_id = subscription.id;
            assert(is_non_empty_string(stripe_subscription_id), "api_error", "Subscription event missing subscription.id");

            const stripe_customer_id_value = subscription.customer;
            const stripe_customer_id = typeof stripe_customer_id_value === "string" ? stripe_customer_id_value : stripe_customer_id_value.id;
            assert(is_non_empty_string(stripe_customer_id), "api_error", "Subscription event missing customer id", {
                stripe_subscription_id,
            });

            // Resolve uid from subscription.metadata; fallback to customer metadata via retrieve if needed.
            let uid = subscription.metadata?.[stripe_uid_metadata_key];
            if (!is_non_empty_string(uid)) {
                // Fallback: retrieve customer to read metadata (best-effort).
                const customer = await stripe_api_call(
                    () => client.customers.retrieve(stripe_customer_id),
                    { operation: "customers.retrieve", stripe_customer_id, reason: "resolve_uid_fallback" },
                );

                if ("deleted" in customer && customer.deleted === true) {
                    throw new InternalStripeError(
                        "customer_not_found",
                        "Subscription references a deleted customer.",
                        { stripe_subscription_id, stripe_customer_id },
                    );
                }

                uid = customer.metadata?.[stripe_uid_metadata_key];
            }

            if (!is_non_empty_string(uid)) {
                throw new InternalStripeError(
                    "invalid_argument",
                    "Subscription missing uid metadata (subscription + customer).",
                    { stripe_subscription_id, stripe_customer_id },
                );
            }

            // Retrieve a strongly-typed Subscription so we can read items and status reliably.
            // We expand items.data.price so that price ids are always present.
            const typed_subscription = await stripe_api_call(
                () =>
                    client.subscriptions.retrieve(stripe_subscription_id, {
                        expand: ["items.data.price"],
                    }),
                {
                    operation: "subscriptions.retrieve",
                    stripe_subscription_id,
                    stripe_customer_id,
                    uid,
                },
            );

            // Invalidate entitlement caches for any subscription mutations.
            delete_subscription_caches(uid);

            const items = resolve_subscription_items({
                subscription: typed_subscription,
                all_products: opts.all_products,
            });

            const cancel_at_period_end = typed_subscription.cancel_at_period_end ?? undefined;

            if (event.type === "customer.subscription.created") {
                await await_event_trigger(opts.server.events.trigger("stripe.subscription_created", {
                    uid,
                    stripe_subscription_id: typed_subscription.id,
                    stripe_customer_id,
                    status: typed_subscription.status,
                    items,
                }));
            } else if (event.type === "customer.subscription.updated") {
                await await_event_trigger(opts.server.events.trigger("stripe.subscription_updated", {
                    uid,
                    stripe_subscription_id: typed_subscription.id,
                    stripe_customer_id,
                    status: typed_subscription.status,
                    items,
                    cancel_at_period_end,
                }));
            } else {
                await await_event_trigger(opts.server.events.trigger("stripe.subscription_deleted", {
                    uid,
                    stripe_subscription_id: typed_subscription.id,
                    stripe_customer_id,
                    status: typed_subscription.status,
                    items,
                }));
            }

            return;
        }

        case "invoice.paid":
        case "invoice.payment_failed": {
            opts.server.log(1, "Stripe webhook received invoice event: ", { event_id: event.id, type: event.type });

            const invoice = event.data.object;

            const stripe_invoice_id = invoice.id;
            assert(is_non_empty_string(stripe_invoice_id), "api_error", "Invoice event missing invoice.id");

            const stripe_customer_id_value = invoice.customer;
            const stripe_customer_id =
                typeof stripe_customer_id_value === "string"
                    ? stripe_customer_id_value
                    : stripe_customer_id_value?.id;

            assert(is_non_empty_string(stripe_customer_id), "api_error", "Invoice event missing customer id", {
                stripe_invoice_id,
            });

            // Resolve uid from invoice.metadata; fallback to customer metadata.
            let uid = invoice.metadata?.[stripe_uid_metadata_key];
            if (!is_non_empty_string(uid)) {
                const customer = await stripe_api_call(
                    () => client.customers.retrieve(stripe_customer_id),
                    { operation: "customers.retrieve", stripe_customer_id, reason: "resolve_uid_fallback" },
                );

                if ("deleted" in customer && customer.deleted === true) {
                    throw new InternalStripeError(
                        "customer_not_found",
                        "Invoice references a deleted customer.",
                        { stripe_invoice_id, stripe_customer_id },
                    );
                }

                uid = customer.metadata?.[stripe_uid_metadata_key];
            }

            if (!is_non_empty_string(uid)) {
                throw new InternalStripeError(
                    "invalid_argument",
                    "Invoice missing uid metadata (invoice + customer).",
                    { stripe_invoice_id, stripe_customer_id },
                );
            }

            // Invalidate subscription cache because invoice events can reflect payment status changes
            // that often accompany subscription status updates.
            delete_subscription_caches(uid);


            const currency = invoice.currency;
            assert(is_non_empty_string(currency), "api_error", "Invoice missing currency", { stripe_invoice_id });

            const hosted_invoice_url = is_non_empty_string(invoice.hosted_invoice_url) ? invoice.hosted_invoice_url : undefined;

            if (event.type === "invoice.paid") {
                const amount_paid = typeof invoice.amount_paid === "number" && Number.isFinite(invoice.amount_paid) ? invoice.amount_paid : 0;

                await await_event_trigger(opts.server.events.trigger("stripe.invoice_paid", {
                    uid,
                    stripe_invoice_id,
                    stripe_customer_id,
                    amount_paid,
                    currency,
                    hosted_invoice_url,
                }));
            } else {
                const amount_due = typeof invoice.amount_due === "number" && Number.isFinite(invoice.amount_due) ? invoice.amount_due : 0;

                await await_event_trigger(opts.server.events.trigger("stripe.invoice_payment_failed", {
                    uid,
                    stripe_invoice_id,
                    stripe_customer_id,
                    amount_due,
                    currency,
                    hosted_invoice_url,
                }));
            }

            return;
        }

        case "payment_intent.succeeded":
        case "payment_intent.payment_failed": {
            opts.server.log(1, "Stripe webhook received payment_intent event: ", { event_id: event.id, type: event.type });

            const pi = event.data.object;

            const stripe_payment_intent_id = pi.id;
            assert(is_non_empty_string(stripe_payment_intent_id), "api_error", "PaymentIntent event missing id");

            // Prefer PI metadata, fallback to customer metadata.
            let uid = pi.metadata?.[stripe_uid_metadata_key];

            const stripe_customer_id_value = pi.customer;
            const stripe_customer_id =
                typeof stripe_customer_id_value === "string"
                    ? stripe_customer_id_value
                    : stripe_customer_id_value?.id;

            if (!is_non_empty_string(uid) && is_non_empty_string(stripe_customer_id)) {
                const customer = await stripe_api_call(
                    () => client.customers.retrieve(stripe_customer_id),
                    { operation: "customers.retrieve", stripe_customer_id, reason: "resolve_uid_fallback" },
                );

                if ("deleted" in customer && customer.deleted === true) {
                    throw new InternalStripeError(
                        "customer_not_found",
                        "PaymentIntent references a deleted customer.",
                        { stripe_payment_intent_id, stripe_customer_id },
                    );
                }

                uid = customer.metadata?.[stripe_uid_metadata_key];
            }

            if (!is_non_empty_string(uid)) {
                // Some PaymentIntents can be created without our metadata (e.g., manual dashboard).
                // We avoid hard-failing webhooks for those; simply return.
                return;
            }

            const currency = pi.currency;
            if (!is_non_empty_string(currency)) {
                // Currency should always exist, but we treat missing as internal Stripe typing anomaly.
                throw new InternalStripeError(
                    "api_error",
                    "PaymentIntent missing currency.",
                    { uid, stripe_payment_intent_id },
                );
            }

            const metadata: Record<string, string> = pi.metadata ?? {};

            if (event.type === "payment_intent.succeeded") {
                const amount_received =
                    typeof pi.amount_received === "number" && Number.isFinite(pi.amount_received) ? pi.amount_received : 0;

                await await_event_trigger(opts.server.events.trigger("stripe.payment_succeeded", {
                    uid,
                    stripe_payment_intent_id,
                    stripe_customer_id,
                    amount_received,
                    currency,
                    metadata,
                }));
            } else {
                const amount = typeof pi.amount === "number" && Number.isFinite(pi.amount) ? pi.amount : 0;

                const last_payment_error_message =
                    is_non_empty_string(pi.last_payment_error?.message) ? pi.last_payment_error?.message : undefined;

                await await_event_trigger(opts.server.events.trigger("stripe.payment_failed", {
                    uid,
                    stripe_payment_intent_id,
                    stripe_customer_id,
                    amount,
                    currency,
                    last_payment_error_message,
                    metadata,
                }));
            }

            return;
        }

        case "setup_intent.succeeded": {
            opts.server.log(1, "Stripe webhook received setup_intent.succeeded: ", { event_id: event.id });

            const setup_intent = event.data.object;

            const stripe_setup_intent_id = setup_intent.id;
            assert(is_non_empty_string(stripe_setup_intent_id), "api_error", "SetupIntent event missing id");

            const stripe_customer_id_value = setup_intent.customer;
            const stripe_customer_id =
                typeof stripe_customer_id_value === "string"
                    ? stripe_customer_id_value
                    : stripe_customer_id_value?.id;

            if (!is_non_empty_string(stripe_customer_id)) {
                // SetupIntents can be created without a customer in some flows; ours always includes it.
                throw new InternalStripeError(
                    "invalid_argument",
                    "SetupIntent missing customer id.",
                    { stripe_setup_intent_id },
                );
            }

            // Resolve uid from setup_intent.metadata; fallback to customer metadata.
            let uid = setup_intent.metadata?.[stripe_uid_metadata_key];
            if (!is_non_empty_string(uid)) {
                const customer = await stripe_api_call(
                    () => client.customers.retrieve(stripe_customer_id),
                    { operation: "customers.retrieve", stripe_customer_id, reason: "resolve_uid_fallback" },
                );

                if ("deleted" in customer && customer.deleted === true) {
                    throw new InternalStripeError(
                        "customer_not_found",
                        "SetupIntent references a deleted customer.",
                        { stripe_setup_intent_id, stripe_customer_id },
                    );
                }

                uid = customer.metadata?.[stripe_uid_metadata_key];
            }

            if (!is_non_empty_string(uid)) {
                throw new InternalStripeError(
                    "invalid_argument",
                    "SetupIntent missing uid metadata (intent + customer).",
                    { stripe_setup_intent_id, stripe_customer_id },
                );
            }

            const finalized = await finalize_payment_method_setup(client, {
                uid,
                setup_intent_id: stripe_setup_intent_id,
                stripe_customer_id,
            });

            await await_event_trigger(opts.server.events.trigger("stripe.payment_method_ready", {
                uid,
                stripe_customer_id: finalized.stripe_customer_id,
                stripe_setup_intent_id: finalized.setup_intent_id,
                stripe_payment_method_id: finalized.payment_method_id,
            }));

            return;
        }

        default: {
            opts.server.log(1, "Stripe webhook received unhandled event type: ", { event_id: event.id, type: event.type });

            // For safety, ignore unknown/unhandled events.
            // You can extend this switch as new billing features are added.
            return;
        }
    }
}
