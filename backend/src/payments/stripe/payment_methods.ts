/**
 * @author Daan van den Bergh
 * @copyright © 2026 - 2026 Daan van den Bergh. All rights reserved
 */

import Stripe from "stripe";
import { ensure_stripe_customer } from "./customers.js";
import { ExternalStripeError, InternalStripeError } from "./error.js";
import { assert, public_assert, stripe_api_call, is_non_empty_string } from "./utils.js";

// -------------------------------------------------------------------------------------------------
// Internal helpers.

/**
 * Resolve a payment method id from a SetupIntent safely.
 */
function resolve_payment_method_id_from_setup_intent(setup_intent: Stripe.SetupIntent): string {
    const payment_method = setup_intent.payment_method;

    // SetupIntent.payment_method is string | PaymentMethod | null.
    if (!payment_method) {
        throw new ExternalStripeError(
            "payment_method_missing",
            "No payment method was provided. Please try again.",
            { setup_intent_id: setup_intent.id, status: setup_intent.status },
        );
    }

    if (typeof payment_method === "string") {
        return payment_method;
    }

    // If expanded, it is a PaymentMethod object with an id.
    return payment_method.id;
}

/**
 * Ensure a SetupIntent belongs to the expected customer.
 */
function assert_setup_intent_belongs_to_customer(opts: {
    setup_intent: Stripe.SetupIntent;
    expected_customer_id: string;
    uid: string;
}): void {
    const { setup_intent, expected_customer_id, uid } = opts;

    // SetupIntent.customer is string | Customer | null.
    const setup_intent_customer = setup_intent.customer;

    // If missing, the intent is not usable for our flow.
    public_assert(
        setup_intent_customer !== null,
        "invalid_argument",
        "Setup intent is missing a customer association.",
        { uid, setup_intent_id: setup_intent.id },
    );

    const setup_customer_id = typeof setup_intent_customer === "string" ? setup_intent_customer : setup_intent_customer.id;

    // Security: prevent a user from finalizing an intent that belongs to someone else.
    public_assert(
        setup_customer_id === expected_customer_id,
        "invalid_argument",
        "Setup intent does not belong to this customer.",
        { uid, setup_intent_id: setup_intent.id, expected_customer_id, setup_customer_id },
    );
}

// -------------------------------------------------------------------------------------------------
// Public API.

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
export async function create_payment_method_setup_intent(
    client: Stripe,
    opts: {
        /** The internal user id, used to resolve/ensure Stripe customer. */
        uid: string;
        /** Optional: attach safe metadata to the SetupIntent (never secrets). */
        metadata?: Record<string, string>;
    },
): Promise<{
    /** The SetupIntent id. */
    id: string;
    /** The client secret used by the client to confirm the SetupIntent. */
    client_secret: string;
    /** The Stripe customer id. */
    stripe_customer_id: string;
}> {
    public_assert(is_non_empty_string(opts.uid), "invalid_argument", "Property 'uid' must be a non-empty string.");

    // Ensure a Stripe customer exists for this user.
    const stripe_customer_id = await ensure_stripe_customer(client, opts.uid);

    // Create a SetupIntent for off-session usage so the resulting payment method can be used for subscriptions/invoices.
    // Stripe docs: https://docs.stripe.com/api/setup_intents/create
    let setup_intent: Stripe.SetupIntent;
    try {
        setup_intent = await stripe_api_call(
            () =>
                client.setupIntents.create(
                    {
                        customer: stripe_customer_id,
                        // off_session indicates we plan to charge when the customer is not actively in-session.
                        usage: "off_session",
                        // Attach safe metadata only.
                        metadata: {
                            ...(opts.metadata ?? {}),
                            __volt_uid: opts.uid,
                        },
                    },
                    // Idempotency here is optional; if you want, you can pass your own idempotency key upstream.
                ),
            { operation: "setupIntents.create", uid: opts.uid, stripe_customer_id },
        );
    } catch (error: unknown) {
        throw new InternalStripeError(
            "api_error",
            "Failed to create a payment method setup intent.",
            { uid: opts.uid, stripe_customer_id },
            error,
        );
    }

    const client_secret = setup_intent.client_secret;

    // SetupIntents should always return a client_secret for confirmation.
    assert(
        is_non_empty_string(client_secret),
        "api_error",
        "Stripe did not return a SetupIntent client_secret.",
        { uid: opts.uid, stripe_customer_id, setup_intent_id: setup_intent.id },
    );

    return {
        id: setup_intent.id,
        client_secret,
        stripe_customer_id,
    };
}

/**
 * Finalize a confirmed SetupIntent by setting its payment method as the customer's default for invoices/subscriptions.
 *
 * This ensures future subscription invoices can be charged automatically.
 *
 * Stripe docs:
 * - Retrieve SetupIntent: https://docs.stripe.com/api/setup_intents/retrieve
 * - Update customer invoice_settings.default_payment_method: https://docs.stripe.com/api/customers/update
 */
export async function finalize_payment_method_setup(
    client: Stripe,
    opts: {
        /** The internal user id, used to resolve/ensure Stripe customer. */
        uid: string;
        /**
         * The SetupIntent id after client confirmation.
         * The client should send this to the backend once confirmation succeeded.
         */
        setup_intent_id: string;
        /**
         * The stripe customer id.
         */
        stripe_customer_id: string;
    },
): Promise<{
    /** The Stripe customer id. */
    stripe_customer_id: string;
    /** The payment method id that is now set as default. */
    payment_method_id: string;
    /** The SetupIntent id used to finalize. */
    setup_intent_id: string;
}> {
    public_assert(is_non_empty_string(opts.uid), "invalid_argument", "Property 'uid' must be a non-empty string.");
    public_assert(
        is_non_empty_string(opts.setup_intent_id),
        "invalid_argument",
        "Property 'setup_intent_id' must be a non-empty string.",
    );

    // // Ensure customer exists and retrieve to verify it is active.
    // const stripe_customer_id = await ensure_stripe_customer(stripe, opts.uid);

    // Retrieve the SetupIntent (expand payment_method to avoid extra round-trips if needed).
    // Stripe docs: https://docs.stripe.com/api/setup_intents/retrieve
    const setup_intent = await stripe_api_call(
        () =>
            client.setupIntents.retrieve(opts.setup_intent_id, {
                expand: ["payment_method"],
            }),
        { operation: "setupIntents.retrieve", uid: opts.uid, setup_intent_id: opts.setup_intent_id },
    );

    // Security: ensure this SetupIntent is for the expected customer.
    assert_setup_intent_belongs_to_customer({
        setup_intent,
        expected_customer_id: opts.stripe_customer_id,
        uid: opts.uid,
    });

    // The SetupIntent must be succeeded before we can safely set defaults.
    // SetupIntent statuses: https://docs.stripe.com/api/setup_intents/object#setup_intent_object-status
    public_assert(
        setup_intent.status === "succeeded",
        "invalid_argument",
        "Payment method setup is not complete. Please finish adding your payment method.",
        { uid: opts.uid, setup_intent_id: setup_intent.id, status: setup_intent.status },
    );

    // Extract the payment method id (string or expanded object).
    const payment_method_id = resolve_payment_method_id_from_setup_intent(setup_intent);

    // Set as default payment method for invoices/subscriptions.
    // Stripe docs: https://docs.stripe.com/api/customers/update
    await stripe_api_call(
        () =>
            client.customers.update(
                opts.stripe_customer_id,
                {
                    invoice_settings: {
                        default_payment_method: payment_method_id,
                    },
                },
            ),
        {
            operation: "customers.update",
            uid: opts.uid,
            stripe_customer_id: opts.stripe_customer_id,
            setup_intent_id: setup_intent.id,
            payment_method_id,
            action: "set_default_payment_method",
        },
    );

    return {
        stripe_customer_id: opts.stripe_customer_id,
        payment_method_id,
        setup_intent_id: setup_intent.id,
    };
}
