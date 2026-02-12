// meters.ts
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
    stable_idempotency_key,
} from "./utils.js";
import { InitializedMeterProduct, InitializedProduct, MeterProduct } from "./products.js";
import { list_subscribed_meters } from "./subscriptions.js";
import { Server } from "../../server.js";

// -------------------------------------------------------------------------------------------------
// Internal helpers.

type AmountRounding = "exact" | "floor" | "ceil" | "round";

/**
 * Convert a money amount in major units (e.g. USD "0.007463") into pico-cents units (10^-12 cents) as an integer string.
 *
 * We fix the Stripe price for money meters at:
 *   unit_amount_decimal (in cents) = "0.000000000001" => 10^-12 cents per unit
 *
 * Therefore:
 *   units = amount_major * 100 (cents) * 10^12 = amount_major * 10^14
 *
 * This function never uses float math for the actual scaling; it uses string + BigInt.
 */
function money_major_to_pico_cents_units(amount: string, round: AmountRounding): string {
    const s = amount.trim();
    assert(s.length > 0, "invalid_argument", "Property 'amount' must be a non-empty string.", { amount });

    // Only non-negative numbers.
    assert(/^\d+(\.\d+)?$/.test(s), "invalid_argument", "Property 'amount' must be a non-negative decimal.", { amount });

    const [whole_raw, frac_raw = ""] = s.split(".");
    const whole = whole_raw ?? "0";
    const frac = frac_raw ?? "";

    const SHIFT = MeterProduct.MONEY_METER_MAJOR_TO_PICO_CENTS_SHIFT;
    const frac_padded = (frac + "0".repeat(SHIFT));
    const frac_keep = frac_padded.slice(0, SHIFT);
    const frac_rest = frac_padded.slice(SHIFT);

    // Determine if remainder is non-zero.
    const remainder_nonzero = /[1-9]/.test(frac_rest);

    let increment = false;
    if (frac.length > SHIFT || remainder_nonzero) {
        if (round === "exact") {
            assert(!remainder_nonzero, "invalid_argument", "Property 'amount' has more precision than supported for exact conversion.", {
                amount,
                max_decimals: SHIFT,
            });
        } else if (round === "floor") {
            // do nothing
        } else if (round === "ceil") {
            increment = remainder_nonzero;
        } else if (round === "round") {
            increment = frac_rest.length > 0 && frac_rest[0] >= "5";
        } else {
            // @ts-expect-error exhaustive
            round.toString();
            throw new InternalStripeError("invalid_argument", `Invalid rounding: ${round}`, { round });
        }
    }

    const raw_int_str = (whole + frac_keep).replace(/^0+/, "") || "0";
    let units = BigInt(raw_int_str);

    if (increment) {
        units += 1n;
    }

    return units.toString();
}

/**
 * Normalize an amount input (string or number) to a decimal string.
 * For numbers: use a high-precision fixed representation and trim.
 */
function normalize_amount_to_string(amount: string | number): string {
    if (typeof amount === "string") {
        return amount;
    }

    assert(Number.isFinite(amount), "invalid_argument", "Property 'amount' must be a finite number.", { amount });
    assert(Math.abs(amount) < 1e21, "invalid_argument", "Property 'amount' number is too large.", { amount });

    // Avoid scientific notation / locale formatting.
    // Using 20 decimals gives enough headroom; final conversion trunc/rounds to SHIFT anyway.
    const s = amount.toFixed(20);
    // Trim trailing zeros and optional dot.
    return s.replace(/\.?0+$/, "");
}

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
    assert(
        /^[a-zA-Z0-9._-]+$/.test(identifier),
        "invalid_argument",
        "Meter event identifier contains invalid characters.",
        {},
    );
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
    assert(Number.isFinite(ts_ms), "invalid_argument", "Meter event timestamp is invalid.", {});

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
    server: Server,
    opts: {
        uid: string;
        meter_product: InitializedMeterProduct;
        stripe_customer_id: string;
        all_products: InitializedProduct[];
    },
): Promise<void> {

    // List the subscribed meters.
    const active_meters = await list_subscribed_meters(client, server, {
        uid: opts.uid,
        stripe_customer_id: opts.stripe_customer_id,
        all_products: opts.all_products,
    });

    // If not entitled, this should usually be user-visible (they are not subscribed),
    // but be careful: this function can also be called internally.
    if (!active_meters[opts.meter_product.id]) {
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
 * The options for recording meter usage.
 */
export type RecordMeterUsageOpts<Kind extends MeterProduct.Kind> = {
    /** The internal user id (uid) whose usage should be recorded. */
    uid: string;
    /** The initialized meter product to record usage for. */
    product: InitializedMeterProduct<Kind extends "units"
        ? MeterProduct.UnitsMeter
        : Kind extends "money"
            ? MeterProduct.MoneyMeter
            : never>;
    /**
     * Optional event timestamp.
     * Must be within the past 35 calendar days or up to 5 minutes in the future.
     * @see https://docs.stripe.com/api/billing/meter-event/create
     */
    timestamp?: Date;
    /**
     * Event identifier to deduplicate accidental retries.
     * Stripe enforces uniqueness within a rolling >=24h window.
     * Must be non-empty, max 100 chars, and contain only letters, numbers, dots, underscores or hyphens.
     * @see https://docs.stripe.com/api/billing/meter-event/create
     */
    identifier: string;
} & (Kind extends "units"
    ? {
        /**
         * The numeric usage value to record (integer).
         * For "sum"/"last" meters this is the numeric value.
         * For "count" meters this can be 1 per event (but we still send a value).
         */
        value: number;
    }
    : Kind extends "money" ? {
        /**
         * Money amount in major units (e.g., "0.007463" USD), used only when product.kind === "money".
         * Can be string or number (number is normalized to string).
         */
        amount: string | number;
        /**
         * Rounding mode used when converting amount to internal integer units.
         * @default "exact"
         * @warning When round is `exact`, amounts with more precision than supported will be rejected by a thrown error, to prevent silent rounding bugs. Use an explicit rounding mode to allow lossy conversions.
         */
        round?: AmountRounding;
    } : never
);

/**
 * The result of recording meter usage.
 */
export interface RecordMeterUsageResult {
    /** The Stripe billing meter event id. */
    meter_event_identifier: string;
    /** The meter event name used. */
    event_name: string;
    /** The unix timestamp (seconds) used for the event, if provided. */
    timestamp: number;
}

/**
 * Record usage for a metered subscription by creating a Stripe Billing Meter Event.
 *
 * Security & correctness guarantees:
 * - Requires that the user has an active-ish subscription containing the meter product's price id.
 * - Uses the meter's configured payload keys for customer/value mapping.
 * - Allows caller-provided `identifier` to dedupe retries.
 *
 * Stripe docs:
 * - Create meter event: https://docs.stripe.com/api/billing/meter-event/create
 * - Record usage guide: https://docs.stripe.com/billing/subscriptions/usage-based/recording-usage-api
 * 
 * @throws {InternalStripeError} When round mode is `exact` and the amount has more precision than supported.
 * @throws {InternalStripeError} On internal errors.
 * @throws {ExternalStripeError} On external errors such as the customer not being entitled to record usage for the meter product.
 */
export async function record_meter_usage<Kind extends MeterProduct.Kind>(
    client: Stripe,
    server: Server,
    all_products: InitializedProduct[],
    opts: RecordMeterUsageOpts<Kind>
): Promise<RecordMeterUsageResult> {
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

    // Determine the value to send to Stripe.
    let value_str: string;

    const meter_kind = opts.product.kind ?? "units";
    if (meter_kind === "money") {
        assert("amount" in opts, "invalid_argument", "Property 'amount' must be provided for money meters.", {
            product_id: opts.product.id,
        });

        const rounding: AmountRounding = opts.round ?? "exact";
        const amount_str = normalize_amount_to_string(opts.amount);
        value_str = money_major_to_pico_cents_units(amount_str, rounding);

        // Keep legacy >=0 behavior (0 is allowed); Stripe may effectively ignore it depending on config.
        // If you want to enforce positive-only, change this to > 0.
        assert(BigInt(value_str) >= 0n, "invalid_argument", "Property 'amount' must be >= 0.", {
            amount: amount_str,
            value_str,
        });
    } else if (meter_kind === "units") {
        assert("value" in opts, "invalid_argument", "Property 'value' must be provided for unit meters.", {
            product_id: opts.product.id,
        });

        // Validate value. We require a finite non-negative integer.
        assert(Number.isFinite(opts.value), "invalid_argument", "Property 'value' must be a finite number.", { value: opts.value });
        assert(opts.value >= 0, "invalid_argument", "Property 'value' must be >= 0.", { value: opts.value });
        assert(Number.isInteger(opts.value), "invalid_argument", "Property 'value' must be an integer.", { value: opts.value });

        value_str = `${opts.value}`;
    } else {
        // @ts-expect-error exhaustive
        meter_kind.toString();
        throw new InternalStripeError("invalid_product", `Invalid MeterProduct kind: ${meter_kind}`, {
            product_id: opts.product.id,
            meter_kind,
        });
    }

    // Determine identifier (dedupe) and validate.
    const identifier = opts.identifier;
    validate_meter_event_identifier(identifier);

    // Timestamp validation (if provided).
    const now = new Date();
    const timestamp_seconds = opts.timestamp ? to_unix_seconds(opts.timestamp) : null;
    if (opts.timestamp) {
        validate_meter_event_timestamp(now, opts.timestamp);
    }

    // Resolve Stripe customer.
    const stripe_customer_id = await ensure_stripe_customer(client, server, opts.uid);

    // Enforce entitlement: only record usage for subscribed users.
    await assert_customer_entitled_for_meter_price(client, server, {
        uid: opts.uid,
        meter_product: opts.product,
        stripe_customer_id,
        all_products: all_products,
    });

    // Resolve meter payload keys (must match the meter configuration).
    const { customer_key, value_key } = resolve_meter_payload_keys(opts.product);

    // -------------------------------------------------------------------------
    // Build payload.

    // Stripe expects payload values as strings in many examples; we send a stringified numeric value.
    // @see https://docs.stripe.com/api/billing/meter-event/create
    const payload: Record<string, string> = {
        [customer_key]: stripe_customer_id,
        [value_key]: value_str,
    };

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
                { idempotencyKey: stable_idempotency_key(`meter_event_create_${identifier}`, 255) },
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
        meter_event_identifier: meter_event.identifier,
        event_name: meter_event.event_name,
        timestamp: meter_event.timestamp,
    };
}

/** The options for {@link cancel_meter_usage_event} */
export interface CancelMeterUsageEventOpts {
    /** The user id. */
    uid: string;
    /** The meter product whose event stream the event belongs to. */
    product: InitializedMeterProduct;
    /** The identifier of the meter event to cancel. */
    meter_event_identifier: string;
}

/** The result type of {@link cancel_meter_usage_event} */
export interface CancelMeterUsageEventResult {
    /** The identifier of the canceled meter event. */
    meter_event_identifier: string;
    /** The status of the adjustment created to cancel the event. Typically "pending". */
    status: string;
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
    server: Server,
    all_products: InitializedProduct[],
    opts: CancelMeterUsageEventOpts,
): Promise<CancelMeterUsageEventResult> {
    public_assert(opts.product.type === "meter", "invalid_argument", "Property 'product' must be a meter product.", {
        product_type: opts.product.type,
    });
    public_assert(is_non_empty_string(opts.uid), "invalid_argument", "Property 'uid' must be a non-empty string.");

    public_assert(
        is_non_empty_string(opts.meter_event_identifier),
        "invalid_argument",
        "Property 'identifier' must be a non-empty string.",
    );

    validate_meter_event_identifier(opts.meter_event_identifier);

    // Resolve Stripe customer and enforce entitlement before canceling usage.
    const stripe_customer_id = await ensure_stripe_customer(client, server, opts.uid);
    await assert_customer_entitled_for_meter_price(client, server, {
        uid: opts.uid,
        meter_product: opts.product,
        stripe_customer_id,
        all_products: all_products,
    });

    // Stripe docs: https://docs.stripe.com/api/billing/meter-event-adjustment/create
    const adjustment = await stripe_api_call(
        () =>
            client.billing.meterEventAdjustments.create(
                {
                    event_name: opts.product.meter_event_name,
                    type: "cancel",
                    cancel: { identifier: opts.meter_event_identifier },
                },
                { idempotencyKey: stable_idempotency_key(`meter_event_cancel_${opts.meter_event_identifier}`, 255) },
            ),
        {
            operation: "billing.meterEventAdjustments.create",
            meter_event_name: opts.product.meter_event_name,
            identifier: opts.meter_event_identifier,
        },
    );

    // The adjustment status is typically "pending" initially.
    // We keep the response minimal and safe.
    return {
        meter_event_identifier: opts.meter_event_identifier,
        status: adjustment.status,
    };
}
