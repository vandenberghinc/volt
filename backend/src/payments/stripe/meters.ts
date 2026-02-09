/**
 * @author Daan van den Bergh
 * @copyright © 2026 - 2026 Daan van den Bergh. All rights reserved
 */

import Stripe from "stripe";

import { ensure_stripe_customer } from "./customers.js";
import { ExternalStripeError, InternalStripeError } from "./error.js";
import {
    assert,
    public_assert,
    generate_random_idempotency_key,
    is_non_empty_string,
    stripe_api_call,
    to_unix_seconds,
} from "./utils.js";
import type { InitializedMeterProduct, InitializedProduct, ProductId } from "./products.js";
import { list_subscribed_meters } from "./subscriptions.js";

// -------------------------------------------------------------------------------------------------
// Internal helpers.

/**
 * Validate a meter event identifier according to Stripe constraints.
 */
function validate_meter_event_identifier(identifier: string): void {
    assert(
        identifier.length <= 100,
        "invalid_argument",
        "Meter event identifier must be <= 100 characters.",
        { identifier_length: identifier.length },
    );
    assert(identifier.trim().length > 0, "invalid_argument", "Meter event identifier must be non-empty.", {
        identifier_length: identifier.length,
    });
}

/**
 * Validate a meter event timestamp against Stripe constraints.
 *
 * Stripe requires:
 * - within the past 35 calendar days
 * - or up to 5 minutes in the future
 * @see https://docs.stripe.com/api/billing/meter-event/create
 */
function validate_meter_event_timestamp(now: Date, timestamp: Date): void {
    const now_ms = now.getTime();
    const ts_ms = timestamp.getTime();

    // 35 days is expressed as "calendar days" by Stripe; we enforce a strict 35*24h window.
    // This is slightly stricter around DST/local offsets, but we only use UTC timestamps anyway.
    const max_past_ms = 35 * 24 * 60 * 60 * 1000;
    const max_future_ms = 5 * 60 * 1000;

    assert(
        ts_ms >= now_ms - max_past_ms,
        "invalid_argument",
        "Meter event timestamp is too far in the past.",
        { now_ms, ts_ms },
    );
    assert(
        ts_ms <= now_ms + max_future_ms,
        "invalid_argument",
        "Meter event timestamp is too far in the future.",
        { now_ms, ts_ms },
    );
}

/**
 * Check whether a customer is currently entitled to record usage for a given metered price.
 * 
 * Stripe docs:
 * - List subscriptions: https://docs.stripe.com/api/subscriptions/list
 * - Expand: https://docs.stripe.com/expand
 */
async function assert_customer_entitled_for_meter_price(
    client: Stripe,
    opts: {
        uid: string;
        meter_product: InitializedMeterProduct;
        stripe_customer_id: string;
        all_products: InitializedProduct[];
    },
): Promise<void> {

    // List the subscribed meters.
    const active_meters = await list_subscribed_meters(client, {
        uid: opts.uid,
        stripe_customer_id: opts.stripe_customer_id,
        all_products: opts.all_products,
    });

    // If not entitled, this should usually be user-visible (they are not subscribed),
    // but be careful: this function can also be called internally.
    if (!active_meters.includes(opts.meter_product.id)) {
        throw new ExternalStripeError(
            "subscription_not_active",
            "You must be subscribed to use this metered feature.",
            { uid: opts.uid, stripe_customer_id: opts.stripe_customer_id, meter_product: opts.meter_product.id },
        );
    }
}

/**
 * Resolve configured payload keys for a meter product, using Stripe's defaults.
 *
 * These defaults must match the meter creation defaults in products.ts:
 * - customer_mapping.event_payload_key defaults to "stripe_customer_id"
 * - value_settings.event_payload_key defaults to "value"
 * @see https://docs.stripe.com/api/billing/meter/create
 */
function resolve_meter_payload_keys(product: InitializedMeterProduct): {
    customer_key: string;
    value_key: string;
} {
    const customer_key = product.customer_mapping_event_payload_key ?? "stripe_customer_id";
    const value_key = product.value_settings_event_payload_key ?? "value";

    assert(customer_key.trim().length > 0, "invalid_product", "Meter customer payload key must be non-empty.", {
        product_id: product.id,
        customer_key,
    });
    assert(value_key.trim().length > 0, "invalid_product", "Meter value payload key must be non-empty.", {
        product_id: product.id,
        value_key,
    });

    // Stripe API docs specify max length 100 for these keys.
    // @see https://docs.stripe.com/api/billing/meter/create
    assert(customer_key.length <= 100, "invalid_product", "Meter customer payload key must be <= 100 characters.", {
        product_id: product.id,
        customer_key_length: customer_key.length,
    });
    assert(value_key.length <= 100, "invalid_product", "Meter value payload key must be <= 100 characters.", {
        product_id: product.id,
        value_key_length: value_key.length,
    });

    return { customer_key, value_key };
}

// -------------------------------------------------------------------------------------------------
// Public API.

/**
 * Record usage for a metered subscription by creating a Stripe Billing Meter Event.
 *
 * Security & correctness guarantees:
 * - Requires that the user has an active-ish subscription containing the meter product's price id.
 * - Uses the meter's configured payload keys for customer/value mapping.
 * - Allows caller-provided `identifier` to dedupe retries; otherwise generates a stable identifier.
 *
 * Stripe docs:
 * - Create meter event: https://docs.stripe.com/api/billing/meter-event/create
 * - Record usage guide: https://docs.stripe.com/billing/subscriptions/usage-based/recording-usage-api
 */
export async function record_meter_usage(
    client: Stripe,
    opts: {
        /** The internal user id (uid) whose usage should be recorded. */
        uid: string;
        /** The initialized meter product to record usage for. */
        product: InitializedMeterProduct;
        /**
         * The numeric usage value to record.
         * For "sum"/"last" meters this is the numeric value.
         * For "count" meters this can be 1 per event (but we still send a value).
         */
        value: number;
        /**
         * Optional event timestamp.
         * Must be within the past 35 calendar days or up to 5 minutes in the future.
         * @see https://docs.stripe.com/api/billing/meter-event/create
         */
        timestamp?: Date;
        /**
         * Optional event identifier to deduplicate accidental retries.
         * Stripe enforces uniqueness within a rolling >=24h window.
         * @see https://docs.stripe.com/api/billing/meter-event/create
         */
        identifier?: string;
        /**
         * Optional Stripe customer id (avoids re-resolving).
         * If provided, we still verify subscription entitlement.
         */
        customer_id?: string;
        /**
         * Optional: attach safe payload fields for debugging/analytics (never secrets).
         * Note: payload keys used for customer/value mapping are controlled by the meter configuration.
         */
        extra_payload?: Record<string, string>;
        /** All products. */
        all_products: InitializedProduct[];
    },
): Promise<{
    /** The Stripe billing meter event id. */
    meter_id: string;
    /** The meter event name used. */
    event_name: string;
    /** The unix timestamp (seconds) used for the event, if provided. */
    timestamp: number;
}> {
    // -------------------------------------------------------------------------
    // Validate inputs.

    public_assert(is_non_empty_string(opts.uid), "invalid_argument", "Property 'uid' must be a non-empty string.");
    assert(opts.product.type === "meter", "invalid_argument", "Property 'product' must be a meter product.", {
        product_type: opts.product.type,
    });

    // Validate event name (Stripe limit 100).
    // @see https://docs.stripe.com/api/billing/meter-event/create
    assert(
        is_non_empty_string(opts.product.meter_event_name) && opts.product.meter_event_name.length <= 100,
        "invalid_product",
        "Meter product meter_event_name is invalid.",
        { product_id: opts.product.id, meter_event_name: opts.product.meter_event_name },
    );

    // Validate value. We require a finite non-negative number.
    // Negative usage can be handled via adjustments (cancel) rather than negative values.
    assert(Number.isFinite(opts.value), "invalid_argument", "Property 'value' must be a finite number.", { value: opts.value });
    assert(opts.value >= 0, "invalid_argument", "Property 'value' must be >= 0.", { value: opts.value });

    // Determine identifier (dedupe) and validate.
    const identifier = opts.identifier ?? generate_random_idempotency_key(`meter_evt_${opts.uid}_${opts.product.id}`);
    validate_meter_event_identifier(identifier);

    // Timestamp validation (if provided).
    const now = new Date();
    const timestamp_seconds = opts.timestamp ? to_unix_seconds(opts.timestamp) : null;
    if (opts.timestamp) {
        validate_meter_event_timestamp(now, opts.timestamp);
    }

    // Resolve Stripe customer.
    const stripe_customer_id = opts.customer_id ?? (await ensure_stripe_customer(client, opts.uid));

    // Enforce entitlement: only record usage for subscribed users.
    await assert_customer_entitled_for_meter_price(client, {
        uid: opts.uid,
        meter_product: opts.product,
        stripe_customer_id,
        all_products: opts.all_products,
    });

    // Resolve meter payload keys (must match the meter configuration).
    const { customer_key, value_key } = resolve_meter_payload_keys(opts.product);

    // -------------------------------------------------------------------------
    // Build payload.

    // Stripe expects payload values as strings in many examples; we send a stringified numeric value.
    // @see https://docs.stripe.com/api/billing/meter-event/create
    const payload: Record<string, string> = {
        [customer_key]: stripe_customer_id,
        [value_key]: `${opts.value}`,
        ...(opts.extra_payload ?? {}),
    };

    // Defensive: prevent caller from overriding the required keys via extra_payload.
    // (If a caller tries, we treat it as an internal bug rather than silently accept.)
    assert(
        payload[customer_key] === stripe_customer_id,
        "invalid_argument",
        "extra_payload attempted to override the meter customer mapping key.",
        { customer_key },
    );
    assert(
        payload[value_key] === `${opts.value}`,
        "invalid_argument",
        "extra_payload attempted to override the meter value key.",
        { value_key },
    );

    // -------------------------------------------------------------------------
    // Create meter event.

    // Stripe docs: https://docs.stripe.com/api/billing/meter-event/create
    const meter_event = await stripe_api_call(
        () =>
            client.billing.meterEvents.create(
                {
                    event_name: opts.product.meter_event_name,
                    payload,
                    identifier,
                    ...(timestamp_seconds !== null ? { timestamp: timestamp_seconds } : {}),
                },
                // Idempotency at the HTTP layer in addition to Stripe's identifier dedupe helps during transient retries.
                { idempotencyKey: `meter_event_create_${identifier}` },
            ),
        {
            operation: "billing.meterEvents.create",
            uid: opts.uid,
            stripe_customer_id,
            stripe_price_id: opts.product.stripe_price_id,
            meter_event_name: opts.product.meter_event_name,
            identifier,
            timestamp_seconds,
        },
    );

    // We only expose minimal safe fields.
    return {
        meter_id: meter_event.identifier,
        event_name: meter_event.event_name,
        timestamp: meter_event.timestamp,
    };
}

/**
 * Cancel a previously recorded meter event by identifier (best-effort within 24 hours).
 *
 * This is useful for:
 * - reverting accidental double-reporting
 * - compensating failed internal workflows
 *
 * Stripe docs:
 * - Create meter event adjustment: https://docs.stripe.com/api/billing/meter-event-adjustment/create
 */
export async function cancel_meter_usage_event(
    client: Stripe,
    opts: {
        /** The meter product whose event stream the event belongs to. */
        product: InitializedMeterProduct;
        /** The identifier of the meter event to cancel. */
        meter_id: string;
        /**
         * Optional: attach safe metadata to the adjustment request context only (not sent to Stripe).
         * Never include secrets.
         */
        context?: Record<string, unknown>;
    },
): Promise<{ meter_id: string; status: string }> {
    assert(opts.product.type === "meter", "invalid_argument", "Property 'product' must be a meter product.", {
        product_type: opts.product.type,
    });

    public_assert(
        is_non_empty_string(opts.meter_id),
        "invalid_argument",
        "Property 'identifier' must be a non-empty string.",
    );

    validate_meter_event_identifier(opts.meter_id);

    // Stripe docs: https://docs.stripe.com/api/billing/meter-event-adjustment/create
    const adjustment = await stripe_api_call(
        () =>
            client.billing.meterEventAdjustments.create(
                {
                    event_name: opts.product.meter_event_name,
                    type: "cancel",
                    cancel: { identifier: opts.meter_id },
                },
                { idempotencyKey: `meter_event_cancel_${opts.meter_id}` },
            ),
        {
            operation: "billing.meterEventAdjustments.create",
            meter_event_name: opts.product.meter_event_name,
            identifier: opts.meter_id,
            ...(opts.context ?? {}),
        },
    );

    // The adjustment status is typically "pending" initially.
    // We keep the response minimal and safe.
    return {
        meter_id: opts.meter_id,
        status: adjustment.status,
    };
}
