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
import Stripe from "stripe";
import { Server } from "../../server.js";
import { Stream } from "../../stream.js";
import type { InitializedMeterProduct, InitializedProduct, InitializedSubscriptionPlan, InitializedSubscriptionProduct } from "./products.js";
/**
 * A resolved subscription item mapping that we expose to event consumers.
 */
export type StripeResolvedSubscriptionItem = {
    /** The Stripe price id on the subscription item. */
    stripe_price_id: string;
} | {
    /** The Stripe price id on the subscription item. */
    stripe_price_id: string;
    /** The resolved subscription product (when price maps to a known plan). */
    product: InitializedSubscriptionProduct;
    /** The resolved subscription plan (licensed) when applicable. */
    plan: InitializedSubscriptionPlan;
} | {
    /** The Stripe price id on the subscription item. */
    stripe_price_id: string;
    /** The resolved subscription product (when price maps to a known plan). */
    product: InitializedMeterProduct;
};
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
export declare function register_or_update_stripe_webhook_endpoint(client: Stripe, server: Server, opts: {
    /** An internal identifier for the webhook endpoint, stored in the webhook's metadata. */
    webhook_app_id: string;
    /** The public HTTPS URL Stripe should POST webhooks to. */
    webhook_url: string;
    /**
     * A human-readable description shown in Stripe Dashboard.
     * Keep it non-sensitive (no secrets).
     */
    description?: string;
    /**
     * Whether to force-enable the endpoint if it is disabled in Stripe.
     * Defaults to true.
     */
    ensure_enabled?: boolean;
}): Promise<{
    /** The Stripe Webhook Endpoint id (we_...). */
    stripe_webhook_endpoint_id: string;
    /** The webhook signing secret used to verify signatures (whsec_...). */
    webhook_signing_secret: string;
    /** The enabled event types we configured on the endpoint. */
    enabled_events: Stripe.WebhookEndpointUpdateParams.EnabledEvent[];
}>;
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
export declare function handle_stripe_webhook(client: Stripe, opts: {
    /** The running server instance (used for event emission). */
    server: Server;
    /** The current request stream. */
    stream: Stream;
    /** The Stripe webhook signing secret for this endpoint. */
    webhook_signing_secret: string;
    /**
     * The raw request body (unparsed) as received from Stripe.
     * Security: signature verification requires the exact raw bytes.
     */
    raw_body: Buffer;
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
}): Promise<void>;
