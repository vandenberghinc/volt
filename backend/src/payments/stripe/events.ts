/**
 * @author Daan van den Bergh
 * @copyright © 2026 - 2026 Daan van den Bergh. All rights reserved
 */

import Stripe from "stripe";
import { StripeResolvedSubscriptionItem } from "./webhooks.js";

/**
 * Stripe webhook-driven events emitted by this module.
 *
 * These event names are intentionally explicit and stable.
 * Consumers can subscribe via `server.on("<event-type>", cb)` if your Server supports it,
 * or you can route them via `server.events.trigger("<event-type>", args)` as done below.
 */
export type StripeEvents = {
    /**
     * Fired when a Stripe Checkout Session is completed.
     * 
     * Docs: https://docs.stripe.com/api/events/types#event_types-checkout.session.completed
     * 
     * @note The defined events are executed in parallel and are awaited inside the webhook handler.
     */
    "stripe.checkout_session_completed": (opts: {
        /** The internal user id resolved from metadata. */
        uid: string;
        /** Stripe checkout session id. */
        stripe_session_id: string;
        /** Stripe checkout mode. */
        mode: "payment" | "subscription" | "setup";
        /** Stripe customer id. */
        stripe_customer_id: string;
        /** Stripe subscription id (only for mode="subscription"). */
        stripe_subscription_id?: string;
        /** Currency if available on the session. */
        currency?: string;
        /** Session metadata (safe). */
        metadata: Stripe.Metadata;
    }) => void | Promise<void>;

    /**
     * Fired when a Stripe subscription is created.
     * Docs: https://docs.stripe.com/api/events/types#event_types-customer.subscription.created
     * 
     * @note The defined events are executed in parallel and are awaited inside the webhook handler.
     */
    "stripe.subscription_created": (opts: {
        /** The internal user id. */
        uid: string;
        /** Stripe subscription id. */
        stripe_subscription_id: string;
        /** Stripe customer id. */
        stripe_customer_id: string;
        /** Stripe subscription status. */
        status: Stripe.Subscription.Status;
        /**
         * Matched subscription items (price -> plan/product mapping when resolvable).
         * This can contain multiple items if the subscription has multiple prices.
         */
        items: StripeResolvedSubscriptionItem[];
    }) => void | Promise<void>;

    /**
     * Fired when a Stripe subscription is updated.
     * Docs: https://docs.stripe.com/api/events/types#event_types-customer.subscription.updated
     * 
     * @note The defined events are executed in parallel and are awaited inside the webhook handler.
     */
    "stripe.subscription_updated": (opts: {
        uid: string;
        stripe_subscription_id: string;
        stripe_customer_id: string;
        status: Stripe.Subscription.Status;
        items: StripeResolvedSubscriptionItem[];
        cancel_at_period_end?: boolean;
    }) => void | Promise<void>;

    /**
     * Fired when a Stripe subscription is deleted/canceled.
     * Docs: https://docs.stripe.com/api/events/types#event_types-customer.subscription.deleted
     * 
     * @note The defined events are executed in parallel and are awaited inside the webhook handler.
     */
    "stripe.subscription_deleted": (opts: {
        uid: string;
        stripe_subscription_id: string;
        stripe_customer_id: string;
        status: Stripe.Subscription.Status;
        items: StripeResolvedSubscriptionItem[];
    }) => void | Promise<void>;

    /**
     * Fired when an invoice is paid successfully.
     * Docs: https://docs.stripe.com/api/events/types#event_types-invoice.paid
     * 
     * @note The defined events are executed in parallel and are awaited inside the webhook handler.
     */
    "stripe.invoice_paid": (opts: {
        uid: string;
        stripe_invoice_id: string;
        stripe_customer_id: string;
        amount_paid: number;
        currency: string;
        hosted_invoice_url?: string;
    }) => void | Promise<void>;

    /**
     * Fired when an invoice payment fails.
     * Docs: https://docs.stripe.com/api/events/types#event_types-invoice.payment_failed
     * 
     * @note The defined events are executed in parallel and are awaited inside the webhook handler.
     */
    "stripe.invoice_payment_failed": (opts: {
        uid: string;
        stripe_invoice_id: string;
        stripe_customer_id: string;
        amount_due: number;
        currency: string;
        hosted_invoice_url?: string;
    }) => void | Promise<void>;

    /**
     * Fired when a PaymentIntent succeeds (covers one-time and some subscription flows).
     * Docs: https://docs.stripe.com/api/events/types#event_types-payment_intent.succeeded
     * 
     * @note The defined events are executed in parallel and are awaited inside the webhook handler.
     */
    "stripe.payment_succeeded": (opts: {
        uid: string;
        stripe_payment_intent_id: string;
        stripe_customer_id?: string;
        amount_received: number;
        currency: string;
        metadata: Stripe.Metadata;
    }) => void | Promise<void>;

    /**
     * Fired when a PaymentIntent fails.
     * Docs: https://docs.stripe.com/api/events/types#event_types-payment_intent.payment_failed
     * 
     * @note The defined events are executed in parallel and are awaited inside the webhook handler.
     */
    "stripe.payment_failed": (opts: {
        uid: string;
        stripe_payment_intent_id: string;
        stripe_customer_id?: string;
        amount: number;
        currency: string;
        last_payment_error_message?: string;
        metadata: Stripe.Metadata;
    }) => void | Promise<void>;

    /**
     * Fired when a SetupIntent succeeds and we (best-effort) set the default payment method.
     * Docs: https://docs.stripe.com/api/events/types#event_types-setup_intent.succeeded
     * 
     * @note The defined events are executed in parallel and are awaited inside the webhook handler.
     */
    "stripe.payment_method_ready": (opts: {
        uid: string;
        stripe_customer_id: string;
        stripe_setup_intent_id: string;
        stripe_payment_method_id: string;
    }) => void | Promise<void>;
};