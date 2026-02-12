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
import * as vlib from "@vandenberghinc/vlib";
import { Collection } from "../../database/collection.js";
import { InternalStripeError } from "./error.js";
import { assert, is_non_empty_string, stable_idempotency_key, stripe_api_call, } from "./utils.js";
import { resolve_plan_to_parent_subscription, } from "./products.js";
import { delete_subscription_caches, enforce_single_subscription_plan, update_subscription_record, } from "./subscriptions.js";
import { finalize_payment_method_setup } from "./payment_methods.js";
// -------------------------------------------------------------------------------------------------
// Internal constants.
/** The uid metadata key we use across Stripe objects. */
const stripe_uid_metadata_key = "__volt_uid";
/**
 * Dedup cache for webhook event ids (webhooks are delivered at-least-once).
 * We keep a short TTL to avoid double-processing on transient retries.
 */
const processed_event_id_cache = new vlib.Cache({
    max_size: 250_000,
    ttl: {
        sliding: true,
        duration: 10 * 60 * 1000, // 10 minutes
    },
});
/**
 * Short-lived "inflight" lock to avoid concurrent double-processing inside this instance,
 * while still allowing retries if handling fails.
 */
const inflight_event_id_cache = new vlib.Cache({
    max_size: 250_000,
    ttl: {
        sliding: true,
        duration: 60 * 1000 * 5, // 5 minutes
    },
});
// -------------------------------------------------------------------------------------------------
// Handling webhook event helpers.
/**
 * Build a mapping from Stripe price id -> (plan | meter_product) for fast resolution.
 */
function index_products_by_stripe_price_id(all_products) {
    const plan_by_price_id = new Map();
    const meter_by_price_id = new Map();
    // const subscription_by_id = new Map<string, InitializedSubscriptionProduct>();
    for (const product of all_products) {
        if (product.type === "subscription") {
            // subscription_by_id.set(product.id, product);
            for (const plan of product.plans) {
                plan_by_price_id.set(plan.stripe_price_id, plan);
            }
        }
        else if (product.type === "meter") {
            meter_by_price_id.set(product.stripe_price_id, product);
        }
        else if (product.type === "one_time") {
            // Note: one-time products can show up in checkout sessions, but not in subscriptions.
            // We do not index them here for subscription item mapping.
            // void product;
        }
        else {
            // @ts-expect-error
            product.type.toString();
            throw new InternalStripeError("invalid_product", "Unknown product type.", { product_type: product.type });
        }
    }
    return { plan_by_price_id, meter_by_price_id };
}
/**
 * Resolve subscription item mappings from a Stripe subscription object.
 *
 * We expect `subscription.items.data[].price` to be expanded or at least present with `id`.
 */
function resolve_subscription_items(opts) {
    const { plan_by_price_id, meter_by_price_id } = index_products_by_stripe_price_id(opts.all_products);
    const resolved = [];
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
        }
        else if (meter_product) {
            resolved.push({
                stripe_price_id,
                product: meter_product,
            });
        }
        else {
            // Unknown price id (maybe created outside our initializer). We still surface the price id.
            resolved.push({ stripe_price_id });
        }
    }
    return resolved;
}
/**
 * Verify and construct a Stripe event from raw request payload.
 */
function construct_stripe_event(client, opts) {
    // Security: This is the only safe way to validate the signature and parse the event.
    // Docs: https://docs.stripe.com/webhooks/signatures#verify-signatures
    try {
        return client.webhooks.constructEvent(opts.raw_body, opts.stripe_signature_header, opts.webhook_signing_secret);
    }
    catch (error) {
        // Signature issues are user-facing *only* if exposed through an API; usually treat as internal and log.
        throw new InternalStripeError("invalid_argument", "Invalid Stripe webhook signature.", { has_signature: is_non_empty_string(opts.stripe_signature_header) }, error);
    }
}
/**
 * Await the events trigger() response concurrently.
 */
async function await_event_trigger(response) {
    const promises = response.filter((r) => Boolean(r));
    await Promise.all(promises);
}
// -------------------------------------------------------------------------------------------------
// Registering webhook helpers.
/**
 * The full set of event types used by `handle_stripe_webhook()`.
 * Keep this list in lockstep with the switch cases in the webhook handler.
 */
const required_stripe_webhook_events = [
    "checkout.session.completed",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "invoice.paid",
    "invoice.payment_failed",
    "payment_intent.succeeded",
    "payment_intent.payment_failed",
    "setup_intent.succeeded",
];
/** The metadata app id key name. */
const webhook_metadata_app_id = "__volt_webhook_app_id";
/**
 * Create (or fetch cached) database collection used to pin a Stripe webhook endpoint per app id.
 */
function create_stripe_webhook_endpoints_db(server) {
    return server.db.collection({
        name: "Volt.Stripe.WebhookEndpoints",
        indexes: [
            {
                keys: { webhook_app_id: 1 },
                unique: true,
            },
        ],
        // No TTL: webhook endpoints are long-lived configuration.
        unique: false,
    });
}
/**
 * Assert a provided URL is an absolute https URL.
 */
function assert_https_webhook_url(webhook_url) {
    assert(is_non_empty_string(webhook_url), "invalid_argument", "Property 'webhook_url' must be a non-empty string.");
    let parsed;
    try {
        parsed = new URL(webhook_url);
    }
    catch (error) {
        throw new InternalStripeError("invalid_argument", "Property 'webhook_url' must be a valid absolute URL.", { webhook_url }, error);
    }
    assert(parsed.protocol === "https:", "invalid_argument", "Property 'webhook_url' must use https.", { webhook_url });
}
/**
 * Compare two event lists as sets (order-independent).
 */
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
/**
 * Safely extract a webhook signing secret from a Stripe WebhookEndpoint object.
 * Stripe returns the `secret` only at creation time (and not reliably on retrieve/update),
 * so we must persist it at creation.
 */
function extract_webhook_secret(endpoint) {
    const secret = endpoint.secret;
    return is_non_empty_string(secret) ? secret : undefined;
}
/**
 * Find an existing Stripe webhook endpoint matching our URL by listing endpoints and filtering.
 * Stripe does not provide a direct "retrieve by url" API.
 */
async function find_stripe_webhook_by_app_id(client, webhook_app_id) {
    // Docs: https://docs.stripe.com/api/webhook_endpoints/list
    let starting_after;
    for (;;) {
        const page = await stripe_api_call(() => client.webhookEndpoints.list({ limit: 100, ...(starting_after ? { starting_after } : {}) }), { operation: "webhookEndpoints.list", webhook_app_id });
        for (const endpoint of page.data) {
            if (endpoint.metadata?.[webhook_metadata_app_id] === webhook_app_id) {
                return endpoint;
            }
        }
        if (!page.has_more)
            return undefined;
        const last = page.data[page.data.length - 1];
        if (!last)
            return undefined;
        starting_after = last.id;
    }
}
// -------------------------------------------------------------------------------------------------
// Public API.
/**
 * Register or update the Stripe Webhook Endpoint for our billing system.
 *
 * - Creates a webhook endpoint if it does not exist.
 * - Ensures all required billing events are enabled.
 * - Persists endpoint id + signing secret in our DB for later signature verification config.
 *
 * Stripe docs:
 * - Create: https://docs.stripe.com/api/webhook_endpoints/create
 * - Update: https://docs.stripe.com/api/webhook_endpoints/update
 */
export async function register_or_update_stripe_webhook_endpoint(client, server, opts) {
    // Validate inputs early.
    assert_https_webhook_url(opts.webhook_url);
    assert(is_non_empty_string(opts.webhook_app_id), "invalid_argument", "Property 'webhook_app_id' must be a non-empty string.");
    const ensure_enabled = opts.ensure_enabled !== false;
    const enabled_events = Array.from(required_stripe_webhook_events);
    // Init db collection (cached by server db layer).
    const webhook_endpoints_db = create_stripe_webhook_endpoints_db(server);
    // First: check our DB pin (fast path).
    const loaded = await webhook_endpoints_db.load({ webhook_app_id: opts.webhook_app_id }, { throw: false, retry: 3 });
    // If the DB already knows the endpoint, still ensure Stripe config is correct.
    if (!(loaded instanceof Error)) {
        // Load endpoint.
        let endpoint;
        try {
            endpoint = await stripe_api_call(() => client.webhookEndpoints.retrieve(loaded.stripe_webhook_endpoint_id), {
                operation: "webhookEndpoints.retrieve",
                stripe_webhook_endpoint_id: loaded.stripe_webhook_endpoint_id,
                webhook_url: opts.webhook_url,
            });
        }
        catch (error) {
            // If the pinned endpoint id is stale (deleted/rotated), try resolving by app id.
            const by_app_id = await find_stripe_webhook_by_app_id(client, opts.webhook_app_id);
            if (!by_app_id)
                throw error;
            endpoint = by_app_id;
        }
        // Check metadata app id match.
        if (endpoint.metadata?.[webhook_metadata_app_id] !== opts.webhook_app_id) {
            // The URL-keyed DB record may be stale if the webhook URL changed.
            // Fall back to resolving the "default" endpoint by app id.
            const by_app_id = await find_stripe_webhook_by_app_id(client, opts.webhook_app_id);
            if (!by_app_id) {
                throw new InternalStripeError("webhook_endpoint_app_id_mismatch", "Webhook endpoint app id does not match and no endpoint was found for webhook_app_id.", { webhook_url: opts.webhook_url, webhook_app_id: opts.webhook_app_id });
            }
            // Continue by treating this as the "existing" branch: enforce config (including URL).
            // We cannot rely on Stripe to return the secret here; must be stored at creation time.
            throw new InternalStripeError("webhook_endpoint_secret_missing", "Stripe webhook endpoint for webhook_app_id exists but signing secret is not available via DB lookup. Store the whsec_ value at creation time.", { webhook_url: opts.webhook_url, stripe_webhook_endpoint_id: by_app_id.id, webhook_app_id: opts.webhook_app_id });
        }
        const needs_event_update = !same_event_set(endpoint.enabled_events ?? [], enabled_events);
        // Stripe's WebhookEndpoint has `status` (enabled/disabled).
        const needs_enable = ensure_enabled && endpoint.status !== "enabled";
        if (needs_event_update || needs_enable) {
            const update_params = {
                enabled_events,
                ...(needs_enable ? { disabled: false } : {}),
                ...(is_non_empty_string(opts.description) ? { description: opts.description.trim() } : {}),
                metadata: {
                    ...(endpoint.metadata ?? {}),
                    [webhook_metadata_app_id]: opts.webhook_app_id,
                },
            };
            await stripe_api_call(() => client.webhookEndpoints.update(endpoint.id, update_params, {
                // Stable idempotency ensures safe retries without duplicating config writes.
                idempotencyKey: stable_idempotency_key(`webhook_endpoints.update:${endpoint.id}:${opts.webhook_url}`, 255),
            }), {
                operation: "webhookEndpoints.update",
                stripe_webhook_endpoint_id: endpoint.id,
                webhook_url: opts.webhook_url,
            });
        }
        // Persist the events we *intend* to be enabled (source of truth for our integration).
        const updated_record = {
            webhook_url: opts.webhook_url,
            stripe_webhook_endpoint_id: loaded.stripe_webhook_endpoint_id,
            webhook_signing_secret: loaded.webhook_signing_secret,
            enabled_events: enabled_events.slice(),
            updated_at_ms: Date.now(),
            webhook_app_id: opts.webhook_app_id,
        };
        await webhook_endpoints_db.set({ webhook_app_id: opts.webhook_app_id }, updated_record, { throw: true, retry: 3 });
        return {
            stripe_webhook_endpoint_id: updated_record.stripe_webhook_endpoint_id,
            webhook_signing_secret: updated_record.webhook_signing_secret,
            enabled_events: updated_record.enabled_events,
        };
    }
    if (loaded instanceof Error && !(loaded instanceof Collection.NotFoundError)) {
        throw new InternalStripeError("webhook_endpoint_load_error", "Failed to access webhook endpoints record.", { webhook_url: opts.webhook_url }, loaded);
    }
    // Second: DB has no record. Try to find an existing endpoint in Stripe by URL.
    const existing = await find_stripe_webhook_by_app_id(client, opts.webhook_app_id);
    if (existing) {
        // Ensure it has the right configuration.
        const needs_event_update = !same_event_set(existing.enabled_events ?? [], enabled_events);
        const needs_enable = ensure_enabled && existing.status !== "enabled";
        const needs_url_update = existing.url !== opts.webhook_url;
        if (needs_event_update || needs_enable || needs_url_update) {
            const update_params = {
                enabled_events,
                ...(needs_enable ? { disabled: false } : {}),
                ...(is_non_empty_string(opts.description) ? { description: opts.description.trim() } : {}),
                ...(needs_url_update ? { url: opts.webhook_url } : {}),
                metadata: {
                    ...(existing.metadata ?? {}),
                    [webhook_metadata_app_id]: opts.webhook_app_id,
                },
            };
            await stripe_api_call(() => client.webhookEndpoints.update(existing.id, update_params, {
                idempotencyKey: stable_idempotency_key(`webhook_endpoints.update:${existing.id}:${opts.webhook_url}`, 255),
            }), {
                operation: "webhookEndpoints.update",
                stripe_webhook_endpoint_id: existing.id,
                webhook_url: opts.webhook_url,
            });
        }
        // We cannot rely on Stripe to return the secret here; we must have it stored.
        // If you reached this branch without a DB record, you must provide the secret out-of-band.
        throw new InternalStripeError("webhook_endpoint_secret_missing", "Stripe webhook endpoint exists but signing secret is not available. Store the whsec_ value at creation time.", { webhook_url: opts.webhook_url, stripe_webhook_endpoint_id: existing.id });
    }
    // Third: create a new endpoint in Stripe.
    const create_params = {
        // Docs: https://docs.stripe.com/api/webhook_endpoints/create
        url: opts.webhook_url,
        enabled_events,
        ...(is_non_empty_string(opts.description) ? { description: opts.description.trim() } : {}),
        metadata: {
            [webhook_metadata_app_id]: opts.webhook_app_id,
        },
    };
    const created = await stripe_api_call(() => client.webhookEndpoints.create(create_params, {
        // Stable idempotency ensures safe retries without creating multiple endpoints.
        idempotencyKey: stable_idempotency_key(`webhook_endpoints.create:${opts.webhook_app_id}:${opts.webhook_url}`, 255),
    }), { operation: "webhookEndpoints.create", webhook_app_id: opts.webhook_app_id });
    const webhook_signing_secret = extract_webhook_secret(created);
    if (!webhook_signing_secret) {
        // Without a signing secret, we cannot securely verify webhook signatures.
        throw new InternalStripeError("webhook_endpoint_secret_missing", "Stripe did not return a webhook signing secret on endpoint creation.", { webhook_url: opts.webhook_url, stripe_webhook_endpoint_id: created.id });
    }
    // Optionally enforce enabled state (Stripe defaults to enabled, but we harden this anyway).
    if (ensure_enabled && created.status !== "enabled") {
        await stripe_api_call(() => client.webhookEndpoints.update(created.id, { disabled: false }, {
            idempotencyKey: stable_idempotency_key(`webhook_endpoints.enable:${created.id}:${opts.webhook_url}`, 255),
        }), {
            operation: "webhookEndpoints.update",
            stripe_webhook_endpoint_id: created.id,
            webhook_url: opts.webhook_url,
        });
    }
    // Persist endpoint id + secret so the webhook handler can verify signatures.
    const record = {
        webhook_url: opts.webhook_url,
        stripe_webhook_endpoint_id: created.id,
        webhook_signing_secret,
        enabled_events: enabled_events.slice(),
        updated_at_ms: Date.now(),
        webhook_app_id: opts.webhook_app_id,
    };
    await webhook_endpoints_db.set({ webhook_app_id: opts.webhook_app_id }, record, { throw: true, retry: 3 });
    return {
        stripe_webhook_endpoint_id: record.stripe_webhook_endpoint_id,
        webhook_signing_secret: record.webhook_signing_secret,
        enabled_events: record.enabled_events,
    };
}
/**
 * Handle a Stripe webhook call:
 * - verifies signature
 * - deduplicates event ids briefly
 * - routes event types to handlers
 * - emits application events via `server.events.trigger`
 *
 * Sending a response through the stream automatically.
 *
 * @note This function expects the caller to provide the raw body and Stripe-Signature header.
 */
export async function handle_stripe_webhook(client, opts) {
    try {
        // Validate critical inputs early.
        assert(is_non_empty_string(opts.webhook_signing_secret), "invalid_argument", "webhook_signing_secret must be provided.");
        assert(is_non_empty_string(opts.stripe_signature_header), "invalid_argument", "stripe_signature_header must be provided.");
        assert(Array.isArray(opts.all_products), "invalid_argument", "all_products must be an array.");
        assert(Buffer.isBuffer(opts.raw_body), "invalid_argument", "raw_body must be a Buffer.");
        // 1) Verify signature + parse event.
        const event = construct_stripe_event(client, {
            webhook_signing_secret: opts.webhook_signing_secret,
            raw_body: opts.raw_body,
            stripe_signature_header: opts.stripe_signature_header,
        });
        // 2) Deduplicate best-effort (webhooks are at-least-once).
        // Only mark as processed AFTER successful handling.
        if (processed_event_id_cache.get(event.id) === true) {
            opts.server.log(1, "Stripe webhook deduplicated event: ", { event_id: event.id, type: event.type });
            opts.stream.success({ status: 200, data: { received: true, deduplicated: true } });
            return;
        }
        if (inflight_event_id_cache.get(event.id) === true) {
            opts.server.log(1, "Stripe webhook already inflight: ", { event_id: event.id, type: event.type });
            // Respond 200 to avoid retry storms; the in-flight handler will complete.
            opts.stream.success({ status: 200, data: { received: true, inflight: true } });
            return;
        }
        inflight_event_id_cache.set(event.id, true);
        try {
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
                        throw new InternalStripeError("invalid_argument", "Checkout session missing uid metadata.", { stripe_session_id });
                    }
                    const mode = session.mode === "subscription"
                        ? "subscription"
                        : session.mode === "setup"
                            ? "setup"
                            : "payment";
                    const stripe_customer_id = typeof session.customer === "string"
                        ? session.customer
                        : session.customer && typeof session.customer === "object"
                            ? session.customer.id
                            : undefined;
                    assert(is_non_empty_string(stripe_customer_id), "api_error", "Checkout session missing customer id.", {
                        uid,
                        stripe_session_id,
                    });
                    const stripe_subscription_id = typeof session.subscription === "string" ? session.subscription : undefined;
                    const currency = is_non_empty_string(session.currency) ? session.currency : undefined;
                    const metadata = session.metadata ?? {};
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
                    assert(is_non_empty_string(stripe_subscription_id), "api_error", "Subscription event missing subscription.id");
                    const stripe_customer_id_value = subscription.customer;
                    const stripe_customer_id = typeof stripe_customer_id_value === "string" ? stripe_customer_id_value : stripe_customer_id_value.id;
                    assert(is_non_empty_string(stripe_customer_id), "api_error", "Subscription event missing customer id", {
                        stripe_subscription_id,
                    });
                    let uid = subscription.metadata?.[stripe_uid_metadata_key];
                    if (!is_non_empty_string(uid)) {
                        const customer = await stripe_api_call(() => client.customers.retrieve(stripe_customer_id), { operation: "customers.retrieve", stripe_customer_id, reason: "resolve_uid_fallback" });
                        if ("deleted" in customer && customer.deleted === true) {
                            throw new InternalStripeError("customer_not_found", "Subscription references a deleted customer.", { stripe_subscription_id, stripe_customer_id });
                        }
                        uid = customer.metadata?.[stripe_uid_metadata_key];
                    }
                    if (!is_non_empty_string(uid)) {
                        throw new InternalStripeError("invalid_argument", "Subscription missing uid metadata (subscription + customer).", { stripe_subscription_id, stripe_customer_id });
                    }
                    const typed_subscription = await stripe_api_call(() => client.subscriptions.retrieve(stripe_subscription_id, {
                        expand: ["items.data.price"],
                    }), {
                        operation: "subscriptions.retrieve",
                        stripe_subscription_id,
                        stripe_customer_id,
                        uid,
                    });
                    delete_subscription_caches(uid);
                    if (event.type === "customer.subscription.created"
                        || event.type === "customer.subscription.updated") {
                        await enforce_single_subscription_plan(client, opts.server, {
                            uid,
                            stripe_customer_id: stripe_customer_id,
                            new_subscription: typed_subscription,
                            all_products: opts.all_products,
                            idempotency_key: stable_idempotency_key(`enforce_single_subscription_plan:${event.id}`),
                        });
                    }
                    // Update the subscription record.
                    await update_subscription_record(client, opts.server, {
                        uid,
                        all_products: opts.all_products,
                    });
                    // Trigger event.
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
                    }
                    else if (event.type === "customer.subscription.updated") {
                        await await_event_trigger(opts.server.events.trigger("stripe.subscription_updated", {
                            uid,
                            stripe_subscription_id: typed_subscription.id,
                            stripe_customer_id,
                            status: typed_subscription.status,
                            items,
                            cancel_at_period_end,
                        }));
                    }
                    else {
                        await await_event_trigger(opts.server.events.trigger("stripe.subscription_deleted", {
                            uid,
                            stripe_subscription_id: typed_subscription.id,
                            stripe_customer_id,
                            status: typed_subscription.status,
                            items,
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
                    assert(is_non_empty_string(stripe_invoice_id), "api_error", "Invoice event missing invoice.id");
                    const stripe_customer_id_value = invoice.customer;
                    const stripe_customer_id = typeof stripe_customer_id_value === "string"
                        ? stripe_customer_id_value
                        : stripe_customer_id_value?.id;
                    assert(is_non_empty_string(stripe_customer_id), "api_error", "Invoice event missing customer id", {
                        stripe_invoice_id,
                    });
                    let uid = invoice.metadata?.[stripe_uid_metadata_key];
                    if (!is_non_empty_string(uid)) {
                        const customer = await stripe_api_call(() => client.customers.retrieve(stripe_customer_id), { operation: "customers.retrieve", stripe_customer_id, reason: "resolve_uid_fallback" });
                        if ("deleted" in customer && customer.deleted === true) {
                            throw new InternalStripeError("customer_not_found", "Invoice references a deleted customer.", { stripe_invoice_id, stripe_customer_id });
                        }
                        uid = customer.metadata?.[stripe_uid_metadata_key];
                    }
                    if (!is_non_empty_string(uid)) {
                        throw new InternalStripeError("invalid_argument", "Invoice missing uid metadata (invoice + customer).", { stripe_invoice_id, stripe_customer_id });
                    }
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
                    }
                    else {
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
                    processed_event_id_cache.set(event.id, true);
                    opts.stream.success({ status: 200, data: { received: true } });
                    return;
                }
                case "payment_intent.succeeded":
                case "payment_intent.payment_failed": {
                    opts.server.log(1, "Stripe webhook received payment_intent event: ", { event_id: event.id, type: event.type });
                    const pi = event.data.object;
                    const stripe_payment_intent_id = pi.id;
                    assert(is_non_empty_string(stripe_payment_intent_id), "api_error", "PaymentIntent event missing id");
                    let uid = pi.metadata?.[stripe_uid_metadata_key];
                    const stripe_customer_id_value = pi.customer;
                    const stripe_customer_id = typeof stripe_customer_id_value === "string"
                        ? stripe_customer_id_value
                        : stripe_customer_id_value?.id;
                    if (!is_non_empty_string(uid) && is_non_empty_string(stripe_customer_id)) {
                        const customer = await stripe_api_call(() => client.customers.retrieve(stripe_customer_id), { operation: "customers.retrieve", stripe_customer_id, reason: "resolve_uid_fallback" });
                        if ("deleted" in customer && customer.deleted === true) {
                            throw new InternalStripeError("customer_not_found", "PaymentIntent references a deleted customer.", { stripe_payment_intent_id, stripe_customer_id });
                        }
                        uid = customer.metadata?.[stripe_uid_metadata_key];
                    }
                    if (!is_non_empty_string(uid)) {
                        processed_event_id_cache.set(event.id, true);
                        opts.stream.success({ status: 200, data: { received: true } });
                        return;
                    }
                    const currency = pi.currency;
                    if (!is_non_empty_string(currency)) {
                        throw new InternalStripeError("api_error", "PaymentIntent missing currency.", { uid, stripe_payment_intent_id });
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
                            metadata,
                        }));
                    }
                    else {
                        const amount = typeof pi.amount === "number" && Number.isFinite(pi.amount) ? pi.amount : 0;
                        const last_payment_error_message = is_non_empty_string(pi.last_payment_error?.message) ? pi.last_payment_error?.message : undefined;
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
                    processed_event_id_cache.set(event.id, true);
                    opts.stream.success({ status: 200, data: { received: true } });
                    return;
                }
                case "setup_intent.succeeded": {
                    opts.server.log(1, "Stripe webhook received setup_intent.succeeded: ", { event_id: event.id });
                    const setup_intent = event.data.object;
                    const stripe_setup_intent_id = setup_intent.id;
                    assert(is_non_empty_string(stripe_setup_intent_id), "api_error", "SetupIntent event missing id");
                    const stripe_customer_id_value = setup_intent.customer;
                    const stripe_customer_id = typeof stripe_customer_id_value === "string"
                        ? stripe_customer_id_value
                        : stripe_customer_id_value?.id;
                    if (!is_non_empty_string(stripe_customer_id)) {
                        throw new InternalStripeError("invalid_argument", "SetupIntent missing customer id.", { stripe_setup_intent_id });
                    }
                    let uid = setup_intent.metadata?.[stripe_uid_metadata_key];
                    if (!is_non_empty_string(uid)) {
                        const customer = await stripe_api_call(() => client.customers.retrieve(stripe_customer_id), { operation: "customers.retrieve", stripe_customer_id, reason: "resolve_uid_fallback" });
                        if ("deleted" in customer && customer.deleted === true) {
                            throw new InternalStripeError("customer_not_found", "SetupIntent references a deleted customer.", { stripe_setup_intent_id, stripe_customer_id });
                        }
                        uid = customer.metadata?.[stripe_uid_metadata_key];
                    }
                    if (!is_non_empty_string(uid)) {
                        throw new InternalStripeError("invalid_argument", "SetupIntent missing uid metadata (intent + customer).", { stripe_setup_intent_id, stripe_customer_id });
                    }
                    const finalized = await finalize_payment_method_setup(client, opts.server, {
                        uid,
                        setup_intent_id: stripe_setup_intent_id,
                        idempotency_key: stable_idempotency_key(`finalize_payment_method_setup:${event.id}`),
                    });
                    await await_event_trigger(opts.server.events.trigger("stripe.payment_method_ready", {
                        uid,
                        stripe_customer_id: finalized.stripe_customer_id,
                        stripe_setup_intent_id: finalized.setup_intent_id,
                        stripe_payment_method_id: finalized.payment_method_id,
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
        }
        finally {
            inflight_event_id_cache.delete(event.id);
        }
    }
    catch (error) {
        // Always respond so Stripe can decide whether to retry.
        // 2xx => success, non-2xx => retry.
        let status = 500;
        let type = "api_error";
        let message = "Stripe webhook handling failed.";
        if (error instanceof InternalStripeError) {
            type = error.error_code ?? type;
            // Treat argument/signature issues as 4xx to prevent pointless retries.
            if (type === "invalid_argument") {
                status = 400;
            }
        }
        // Avoid double-send if caller already responded for some reason.
        if (!opts.stream.finished) {
            opts.stream.error({ status, type, message });
        }
        return;
    }
}
