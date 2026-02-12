/**
 * @author Daan van den Bergh
 * @copyright © 2026 - 2026 Daan van den Bergh. All rights reserved
 */
import Stripe from "stripe";
/**
 * Create a Stripe SetupIntent so the client can add a payment method and prepare it for off-session billing.
 *
 * Client flow:
 * - Call this endpoint to get `client_secret`.
 * - Confirm SetupIntent on the client (e.g. Stripe.js / mobile SDK).
 * - Call `finalize_payment_method_setup` with the returned `setup_intent_id`.
 *
 * Stripe docs:
 * - SetupIntents overview: https://docs.stripe.com/payments/setup-intents
 * - Create SetupIntent: https://docs.stripe.com/api/setup_intents/create
 */
export declare function create_payment_method_setup_intent(client: Stripe, opts: {
    /** The internal user id, used to resolve/ensure Stripe customer. */
    uid: string;
    /** An optional idempotency key. */
    idempotency_key?: string;
}): Promise<{
    /** The SetupIntent id. */
    id: string;
    /** The client secret used by the client to confirm the SetupIntent. */
    client_secret: string;
    /** The Stripe customer id. */
    stripe_customer_id: string;
}>;
/**
 * Finalize a confirmed SetupIntent by setting its payment method as the customer's default for invoices/subscriptions.
 *
 * This ensures future subscription invoices can be charged automatically.
 *
 * Stripe docs:
 * - Retrieve SetupIntent: https://docs.stripe.com/api/setup_intents/retrieve
 * - Update customer invoice_settings.default_payment_method: https://docs.stripe.com/api/customers/update
 */
export declare function finalize_payment_method_setup(client: Stripe, opts: {
    /** The internal user id, used to resolve/ensure Stripe customer. */
    uid: string;
    /**
     * The SetupIntent id after client confirmation.
     * The client should send this to the backend once confirmation succeeded.
     */
    setup_intent_id: string;
    /** Optional idempotency key. */
    idempotency_key?: string;
}): Promise<{
    /** The Stripe customer id. */
    stripe_customer_id: string;
    /** The payment method id that is now set as default. */
    payment_method_id: string;
    /** The SetupIntent id used to finalize. */
    setup_intent_id: string;
}>;
