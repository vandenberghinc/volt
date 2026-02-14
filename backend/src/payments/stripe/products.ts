/**
 * @author Daan van den Bergh
 * @copyright © 2026 - 2026 Daan van den Bergh. All rights reserved
 */

import Stripe from "stripe";
import * as vlib from "@vandenberghinc/vlib";
import { InternalStripeError } from "./error.js";
import { assert, generate_random_idempotency_key, stable_idempotency_key, stripe_api_call } from "./utils.js";
import { Server } from "../../server.js";

// ----------------------------------------------------------------------------
// Product types.

/**
 * The recurring billing interval for subscription products.
 */
export type RecurringInterval = "day" | "week" | "month" | "year";

/**
 * The tax behaviour for a product or price.
 */
export type TaxBehavior = "inclusive" | "exclusive" | "unspecified";

/**
 * An internal product id, simple type alias for clarity.
 * 
 * @docs
 */
export type ProductId = string;

/**
 * An internal subscription plan id, simple type alias for clarity.
 * 
 * @docs
 */
export type SubscriptionPlanId = string;

/**
 * The base product interface.
 */
interface BaseProduct {
    /**
     * A unique product identifier.
     * This identifier should not be changed once set, as it is used to link the product to existing Stripe products and prices.
     * This identifier should be unique accross all products and subscription plans.
     */
    id: ProductId;
    /** The name of the product, meant to be displayable to the user. */
    name: string;
    /** The description of the product. */
    description: string;
    /** The three-letter ISO currency code (e.g., "usd", "eur"). */
    currency: string;
    /**
     * A tax code for this product.
     * See https://docs.stripe.com/tax/tax-codes for more details and to find the right tax code for your product.
     */
    tax_code: string;
    /** The tax behaviour. */
    tax_behavior: TaxBehavior;
    /** Optional product images (public URLs). */
    images?: string[];
}

/**
 * The one-time payment product interface.
 * @warning
 * A product is a public type and is accessible in the frontend,
 * through the default Volt Rest API.
 * @docs
 */
export interface OneTimePaymentProduct extends BaseProduct {
    /** The product type. */
    type: "one_time";
    /** The price for this product in cents. */
    price: number;
    /** Quantity limits for one-time purchases. */
    quantity_rules?: {
        /** Minimum quantity allowed. */
        min?: number;
        /** Maximum quantity allowed. */
        max?: number;
    };
}

/**
 * A subscription plan.
 * 
 * @warning
 * A subscription plan is a public type and is accessible in the frontend,
 * through the default Volt Rest API.
 * 
 * @docs
 */
export interface SubscriptionPlan {
    /**
     * The plan identifier.
     * This identifier should not be changed once set, as it is used to link the plan to existing Stripe prices.
     * This identifier should be unique accross all products and subscription plans.
     */
    id: SubscriptionPlanId;
    /** The name of the plan, meant to be displayable to the user. */
    name: string;
    /** The description of the plan. */
    description: string;
    /** The price in cents. */
    price: number;
    /** The billing interval (e.g., "month", "year"). */
    interval: RecurringInterval;
    /** The recurring interval count. */
    interval_count: number;
}

/**
 * A subscription based product interface.
 * 
 * @warning
 * A subscription product is a public type and is accessible in the frontend,
 * through the default Volt Rest API.
 * 
 * @docs
 */
export interface SubscriptionProduct extends BaseProduct {
    /** The product type. */
    type: "subscription";
    /** Integer representing the number of trial period days before the customer is charged for the first time. Has to be at least 1. */
    trial_days?: number;
    /**
     * Optional billing anchor strategy for subscriptions.
     * @default "immediately"
     */
    billing_anchor?: "immediately" | "first_of_month";
    /**
     * The subscription plans.
     * @warning
     * A user can only be subscribed to a single plan per subscription product,
     * even if multiple plans are defined here.
     * When a user subscribes to a subscription plan while it is already subscribed to another
     * plan of the same product, then the old plan is cancelled.
     */
    plans: SubscriptionPlan[];
}

/**
 * Supported aggregation formulas for Stripe Billing meters.
 * @see https://docs.stripe.com/api/billing/meter/create
 */
export type MeterAggregationFormula = "count" | "sum" | "last";

/**
 * Nested types for the meter product definition.
 *
 * A meter product defines:
 * - a Stripe Billing Meter (usage aggregation definition)
 * - a Stripe Product + recurring metered Price attached to that meter
 *
 * Stripe docs:
 * - Meters: https://docs.stripe.com/api/billing/meter
 * - Create meter: https://docs.stripe.com/api/billing/meter/create
 * - Prices (recurring.meter): https://docs.stripe.com/api/prices/create
 */
export namespace MeterProduct {

    /**
     * The meter product kind.
     */
    export type Kind = "units" | "money";

    /** Unit price, either by integer (smallest currency unit) or decimal string. */
    export type UnitPrice =
        | number
        | { decimals: string };

    /**
     * A **unit-based** metered billing product backed by a Stripe Billing Meter and a **metered recurring Price**.
     *
     * Use this when:
     * - you measure usage as **integer units** (requests, tokens, bytes, seconds, etc.)
     * - and you want Stripe to bill based on aggregated usage over a billing interval
     *
     * Pricing:
     * - `price: number` uses Stripe Price `unit_amount` (integer, smallest currency unit — e.g., cents)
     * - `price: { decimals: string }` uses Stripe Price `unit_amount_decimal` (string, smallest currency unit — up to 12 decimals)
     *
     * Recording usage:
     * - Call `record_meter_usage(..., { value })` with an **integer** `value`.
     * - The meter's `aggregation_formula` controls how events are aggregated (e.g., `"sum"`, `"count"`, `"last"`).
     *
     * Stripe docs:
     * - Meters: https://docs.stripe.com/api/billing/meter
     * - Create meter: https://docs.stripe.com/api/billing/meter/create
     * - Create price (recurring.meter): https://docs.stripe.com/api/prices/create
     * 
     * @warning
     * A meter product is a public type and is accessible in the frontend,
     * through the default Volt Rest API.
     *
     * @example
     * {Charge 1 cent per request}
     * ```ts
     * const products: Product[] = [{
     *   id: "api_requests",
     *   type: "meter",
     *   kind: "units",
     *   name: "API Requests",
     *   description: "Usage-based billing per request.",
     *   currency: "usd",
     *   tax_code: "txcd_10103000",
     *   tax_behavior: "unspecified",
     *   interval: "month",
     *   interval_count: 1,
     *   meter_event_name: "api_requests_v1",
     *   price: 1, // 1 cent per unit
     * }];
     *
     * await record_meter_usage(stripe, {
     *   uid,
     *   product: initialized.api_requests,
     *   value: 1,
     *   all_products: initialized_all,
     * });
     * ```
     *
     * @example
     * {Charge fractional cents per token}
     * ```ts
     * const products: Product[] = [{
     *   id: "tokens",
     *   type: "meter",
     *   kind: "units",
     *   name: "Tokens",
     *   description: "Charged per token with fractional cents.",
     *   currency: "usd",
     *   tax_code: "txcd_10103000",
     *   tax_behavior: "unspecified",
     *   interval: "month",
     *   interval_count: 1,
     *   meter_event_name: "tokens_v1",
     *   price: { decimals: "0.000001" }, // cents; $0.00000001 per token
     * }];
     * ```
     *
     * @docs
     */
    export interface UnitsMeter extends BaseProduct {
        /** The product type. */
        type: "meter";

        /**
         * Meter kind:
         * - `"units"` means you report integer usage units with `value`,
         *   and configure the price per unit here.
         * @dev_note Keep this required and not defaulted to "units"
         *           this makes code easier to maintain and avoids type casting / runtime code mistakes.
         */
        kind: "units";

        /**
         * Unit price in the smallest currency unit (e.g., cents).
         * - If number: must be an integer (Stripe `unit_amount`).
         * - If object: decimals string up to 12 decimals (Stripe `unit_amount_decimal`).
         */
        price: UnitPrice;

        /** The billing interval for the usage price (typically `"month"`). */
        interval: RecurringInterval;

        /** The recurring interval count. */
        interval_count: number;

        /**
         * The Stripe meter event name.
         * This must be stable and unique across your Stripe account.
         * @see https://docs.stripe.com/api/billing/meter/create
         */
        meter_event_name: string;

        /**
         * The meter's default aggregation formula.
         * @default "sum"
         * @see https://docs.stripe.com/api/billing/meter/create
         */
        aggregation_formula?: MeterAggregationFormula;

        /**
         * The payload key used to map usage events to a Stripe customer id.
         * Stripe currently requires customer_mapping.type="by_id".
         * @default "stripe_customer_id"
         * @see https://docs.stripe.com/api/billing/meter/create
         */
        customer_mapping_event_payload_key?: string;

        /**
         * The payload key used as the numeric value for the meter.
         * @default "value"
         * @see https://docs.stripe.com/api/billing/meter/create
         */
        value_settings_event_payload_key?: string;

        /**
         * Optional pre-aggregation time window.
         * @see https://docs.stripe.com/api/billing/meter/create
         */
        event_time_window?: "hour" | "day";
    }


    /**
     * A **money-based** meter product for charging *arbitrary per-event currency amounts*.
     *
     * Use this when:
     * - you compute a currency cost per request (e.g. OpenAI usage cost),
     * - and you want to record **that exact amount** (to supported precision) per event,
     * - without maintaining token pricing tables in Stripe.
     *
     * How it works internally:
     * - The Stripe recurring Price is created with a **fixed** `unit_amount_decimal`:
     *   `"0.000000000001"` **in cents** (10^-12 cents per unit).
     * - When you call `record_meter_usage(..., { amount })`, your library converts the
     *   major-unit amount (e.g. USD) into an integer number of these pico-cent units
     *   and records that integer as the meter event value.
     *
     * Important constraints:
     * - You must NOT set `price` on this meter.
     * - Amounts can be passed as string or number.
     * - Conversion supports up to 14 decimals in major units (because we convert to 10^14 units),
     *   and you can choose rounding behavior via `round`.
     * 
     * @warning
     * A meter product is a public type and is accessible in the frontend,
     * through the default Volt Rest API.
     *
     * @example
     * {Charge exact per-request OpenAI spend}
     * You compute the request cost in USD and report it directly.
     * ```ts
     * const products: Product[] = [{
     *   id: "ai_usage",
     *   type: "meter",
     *   kind: "money",
     *   name: "AI Usage",
     *   description: "Billed by actual AI spend per request.",
     *   currency: "usd",
     *   tax_code: "txcd_10103000",
     *   tax_behavior: "unspecified",
     *   interval: "month",
     *   interval_count: 1,
     *   meter_event_name: "ai_usage_v1",
     * }];
     *
     * // Later, when a request costs $0.007463:
     * await record_meter_usage(stripe, {
     *   uid,
     *   product: initialized.ai_usage,
     *   amount: "0.007463",
     *   round: "exact",
     *   all_products: initialized_all,
     * });
     * ```
     *
     * @example
     * {Charge using a float with rounding}
     * If you have a float, pass it and choose a rounding mode.
     * ```ts
     * await record_meter_usage(stripe, {
     *   uid,
     *   product: initialized.ai_usage,
     *   amount: 0.007463,
     *   round: "round",
     *   all_products: initialized_all,
     * });
     * ```
     * 
     * @docs
     */
    export interface MoneyMeter extends BaseProduct {
        /** The product type. */
        type: "meter";

        /**
         * Money meters fix the unit price internally; callers report arbitrary amounts.
         */
        kind: "money";

        /** No integer price is allowed for money meters. */
        price?: never;

        /** The billing interval for the usage price (typically `"month"`). */
        interval: RecurringInterval;

        /** The recurring interval count. */
        interval_count: number;

        /**
         * The Stripe meter event name.
         * This must be stable and unique across your Stripe account.
         * @see https://docs.stripe.com/api/billing/meter/create
         */
        meter_event_name: string;

        /**
         * The meter's default aggregation formula.
         * @default "sum"
         * @see https://docs.stripe.com/api/billing/meter/create
         */
        aggregation_formula?: MeterAggregationFormula;

        /**
         * The payload key used to map usage events to a Stripe customer id.
         * Stripe currently requires customer_mapping.type="by_id".
         * @default "stripe_customer_id"
         * @see https://docs.stripe.com/api/billing/meter/create
         */
        customer_mapping_event_payload_key?: string;

        /**
         * The payload key used as the numeric value for the meter.
         * @default "value"
         * @see https://docs.stripe.com/api/billing/meter/create
         */
        value_settings_event_payload_key?: string;

        /**
         * Optional pre-aggregation time window.
         * @see https://docs.stripe.com/api/billing/meter/create
         */
        event_time_window?: "hour" | "day";
    }

    /** Multiplier from major units to pico-cent units: 100 * 10^12 = 10^14. */
    export const MONEY_METER_MAJOR_TO_PICO_CENTS_SHIFT = 14;

    /** Fixed Stripe unit_amount_decimal for money meters, in cents. */
    export const MONEY_METER_UNIT_AMOUNT_DECIMAL_CENTS = "0.000000000001"; // 10^-12 cents
}

/**
 * A Stripe usage-based billing product backed by a Stripe Billing Meter and a metered recurring Price.
 *
 * This union offers two easy-to-understand variants:
 * - `UnitsMeter`: unit-based pricing where usage is recorded as integer `value` events, and the unit price is either:
 *   - integer smallest-currency pricing (`unit_amount`) via `price: number`, or
 *   - decimal smallest-currency pricing (`unit_amount_decimal`) via `price: { decimals: string }`
 * - `MoneyMeter`: fixed internal unit price with caller-specified per-event currency amounts recorded via `amount`
 * 
 * @warning
 * A meter product is a public type and is accessible in the frontend,
 * through the default Volt Rest API.
 *
 * @example
 * {Choose a meter type}
 * Pick the variant that matches how you want to report usage:
 * ```ts
 * const by_requests: MeterProduct = {
 *   type: "meter",
 *   kind: "units",
 *   id: "requests",
 *   name: "Requests",
 *   description: "Charged per request.",
 *   currency: "usd",
 *   tax_code: "txcd_10103000",
 *   tax_behavior: "unspecified",
 *   interval: "month",
 *   interval_count: 1,
 *   meter_event_name: "requests_v1",
 *   price: 1,
 * };
 *
 * const by_tokens_small_price: MeterProduct = {
 *   type: "meter",
 *   kind: "units",
 *   id: "tokens",
 *   name: "Tokens",
 *   description: "Charged per token with fractional cents.",
 *   currency: "usd",
 *   tax_code: "txcd_10103000",
 *   tax_behavior: "unspecified",
 *   interval: "month",
 *   interval_count: 1,
 *   meter_event_name: "tokens_v1",
 *   price: { decimals: "0.000001" },
 * };
 *
 * const by_actual_spend: MeterProduct = {
 *   type: "meter",
 *   kind: "money",
 *   id: "ai_spend",
 *   name: "AI Spend",
 *   description: "Charged by actual spend per request.",
 *   currency: "usd",
 *   tax_code: "txcd_10103000",
 *   tax_behavior: "unspecified",
 *   interval: "month",
 *   interval_count: 1,
 *   meter_event_name: "ai_spend_v1",
 * };
 * ```
 *
 * @see {@link MeterProduct.UnitsMeter} for unit-based pricing (integer or decimal unit price).
 * @see {@link MeterProduct.MoneyMeter} for arbitrary per-event currency amounts.
 *
 * @docs
 */
export type MeterProduct = MeterProduct.UnitsMeter | MeterProduct.MoneyMeter;

/** A union type of all products. */
export type Product = OneTimePaymentProduct | SubscriptionProduct | MeterProduct;

// ----------------------------------------------------------------------------
// Initialized product types.

/** An initialized one-time product. */
export interface InitializedOneTimeProduct extends OneTimePaymentProduct {
    /** The product type. */
    type: "one_time";
    /** The Stripe product id. */
    stripe_product_id: string;
    /** The Stripe price id. */
    stripe_price_id: string;
}

/** An initialized subscription plan. */
export interface InitializedSubscriptionPlan extends SubscriptionPlan {
    /** The type. */
    type: "subscription_plan";
    /** The id of the parent subscription. */
    subscription_id: string;
    /** The Stripe price id for this plan. */
    stripe_price_id: string;
}

/** An initialized subscription product with its plans. */
export interface InitializedSubscriptionProduct extends SubscriptionProduct {
    /** The product type. */
    type: "subscription";
    /** The Stripe product id. */
    stripe_product_id: string;
    /** The Stripe price ids for the plans. */
    plans: InitializedSubscriptionPlan[];
}

/**
 * An initialized meter product.
 */
export type InitializedMeterProduct<T extends MeterProduct = MeterProduct> = T & {
    /** The product type. */
    type: "meter";
    /** The Stripe meter id. */
    stripe_meter_id: string;
    /** The Stripe product id. */
    stripe_product_id: string;
    /** The Stripe price id (metered recurring price). */
    stripe_price_id: string;
}

/** A union type of all initialized products. */
export type InitializedProduct = InitializedOneTimeProduct | InitializedSubscriptionProduct | InitializedMeterProduct;

// ----------------------------------------------------------------------------
// Internal constants.

/**
 * The metadata key used to link an internal product id to a Stripe Product.
 */
const app_product_id_metadata_key = "__volt_app_product_id";

/**
 * The metadata key used to link an internal plan id (or one-time price id) to a Stripe Price.
 */
const app_price_id_metadata_key = "__volt_app_price_id";

/**
 * The metadata key storing a stable signature of price settings, used for detecting changes.
 */
const app_price_signature_metadata_key = "__volt_app_price_signature";

/**
 * The Stripe list page size (maximum allowed by Stripe for list endpoints).
 */
const stripe_list_page_size = 100;

// ----------------------------------------------------------------------------
// Internal utilities.

/**
 * Validate an integer amount in the smallest currency unit (e.g., cents).
 */
function validate_unit_amount(unit_amount: number, field_name: string): void {
    assert(
        Number.isInteger(unit_amount),
        "invalid_product",
        `Property '${field_name}' must be an integer (smallest currency unit)`,
        { field_name, unit_amount },
    );
    assert(
        unit_amount > 0,
        "invalid_product",
        `Property '${field_name}' must be > 0`,
        { field_name, unit_amount },
    );
}

/**
 * Normalize a Stripe-compatible `unit_amount_decimal` string (smallest currency unit, e.g. cents).
 *
 * Goals:
 * - Accept only Stripe-style non-negative decimals with up to 12 fractional digits.
 * - Canonicalize equivalent numeric strings so signatures/metadata comparisons are stable.
 * - Remove leading/trailing whitespace.
 * - Normalize leading zeros in the whole part:
 *     "00012.3400" -> "12.3400"
 *     "0000.5"     -> "0.5"
 *     "0.5"        -> "0.5"
 * - Normalize trailing zeros in the fractional part:
 *     "12.3400" -> "12.34"
 *     "12.000"  -> "12"
 * - Disallow zero values (matches your current pricing policy):
 *     "0", "0.0", "000.000" -> throws
 *
 * Notes:
 * - This is designed for Stripe Price `unit_amount_decimal` (string) which supports up to 12 decimals.
 * - This is intentionally strict (no "+", no "-", no scientific notation, no ".5").
 *
 * @throws {InternalStripeError} via `assert(...)` when invalid.
 */
function normalize_unit_amount_decimal(unit_amount_decimal: string, field_name: string): string {
    assert(
        typeof unit_amount_decimal === "string",
        "invalid_product",
        `Property '${field_name}' must be a string`,
        { field_name, unit_amount_decimal },
    );

    let s = unit_amount_decimal.trim();
    assert(s.length > 0, "invalid_product", `Property '${field_name}' must be non-empty`, { field_name });

    // Strict Stripe-style non-negative decimal with up to 12 fractional digits.
    // - no sign
    // - no scientific notation
    // - requires whole digits (so ".5" is rejected)
    // - allows optional fractional part with 1..12 digits
    assert(
        /^\d+(\.\d{1,12})?$/.test(s),
        "invalid_product",
        `Property '${field_name}' must be a non-negative decimal with up to 12 decimals`,
        { field_name, unit_amount_decimal: s },
    );

    // Split whole/fractional.
    const dot = s.indexOf(".");
    const whole_raw = dot >= 0 ? s.slice(0, dot) : s;
    const frac_raw = dot >= 0 ? s.slice(dot + 1) : "";

    // Normalize whole:
    // - strip all leading zeros
    // - if empty -> "0"
    let whole = whole_raw.replace(/^0+/, "");
    if (whole === "") whole = "0";

    // Normalize fractional:
    // - remove trailing zeros
    // - if becomes empty -> no fractional part
    let frac = frac_raw;
    if (frac.length > 0) {
        frac = frac.replace(/0+$/, "");
    }

    // Recompose canonical string.
    s = frac.length > 0 ? `${whole}.${frac}` : whole;

    // Reject zero values: "0" only (since "0.0" etc collapse to "0")
    assert(
        s !== "0",
        "invalid_product",
        `Property '${field_name}' must be > 0`,
        { field_name, unit_amount_decimal: s },
    );

    // Final validation to be sure the normalization didn't produce an invalid string.
    assert(/^\d+(\.\d{1,12})?$/.test(s), "invalid_product", "Normalization produced invalid decimal.", { s });

    return s;
}

/**
 * Resolve a unit price for meter products into Stripe Price create fields.
 *
 * Behavior:
 * - Money meters: fixed `unit_amount_decimal` (in cents) at 10^-12 cents per unit.
 * - Unit meters:
 *   - If `price` is a number: validate as a positive integer and return `{ unit_amount }`.
 *   - If `price` is `{ decimals: string }`: normalize to canonical form and return `{ unit_amount_decimal }`.
 *
 * Canonicalization:
 * - Decimal prices are normalized by `normalize_unit_amount_decimal` to ensure:
 *   - stable signatures (`app_price_signature`)
 *   - stable matching of existing Stripe Prices
 *
 * @throws {InternalStripeError} via `assert(...)` when invalid.
 */
function resolve_unit_price_fields(
    product: MeterProduct,
): { unit_amount: number } | { unit_amount_decimal: string } {

    if (product.kind === "money") {
        // Fixed Stripe unit_amount_decimal for money meters, in cents (10^-12 cents).
        return { unit_amount_decimal: MeterProduct.MONEY_METER_UNIT_AMOUNT_DECIMAL_CENTS };
    }

    if (product.kind === "units") {
        const p: unknown = (product as MeterProduct.UnitsMeter).price;

        if (typeof p === "number") {
            // Positive integer in smallest currency unit (e.g., cents).
            assert(
                Number.isInteger(p),
                "invalid_product",
                "Property 'price' must be an integer (smallest currency unit)",
                { field_name: "price", unit_amount: p },
            );
            assert(
                p > 0,
                "invalid_product",
                "Property 'price' must be > 0",
                { field_name: "price", unit_amount: p },
            );
            return { unit_amount: p };
        }

        // Validate object shape defensively.
        assert(
            p !== null && typeof p === "object",
            "invalid_product",
            "Property 'price' must be a number or { decimals: string }",
            { price: p },
        );

        const decimals = (p as any).decimals;
        assert(
            typeof decimals === "string",
            "invalid_product",
            "Property 'price.decimals' must be a string",
            { price: p },
        );

        return { unit_amount_decimal: normalize_unit_amount_decimal(decimals, "price.decimals") };
    }

    // Exhaustiveness guard.
    // @ts-expect-error exhaustive
    product.kind.toString();
    throw new InternalStripeError(
        "invalid_product",
        `Unsupported meter product kind: ${(product as MeterProduct).kind}`,
        { kind: (product as MeterProduct).kind },
    );
}

/**
 * Validate quantity rules.
 */
function validate_quantity_rules(
    quantity_rules: OneTimePaymentProduct["quantity_rules"],
): void {
    if (!quantity_rules) {
        return;
    }

    const { min, max } = quantity_rules;

    if (min !== undefined) {
        assert(Number.isInteger(min) && min >= 1, "invalid_product", "Quantity_rules.min must be an integer >= 1", {
            min,
        });
    }

    if (max !== undefined) {
        assert(Number.isInteger(max) && max >= 1, "invalid_product", "Quantity_rules.max must be an integer >= 1", {
            max,
        });
    }

    if (min !== undefined && max !== undefined) {
        assert(min <= max, "invalid_product", "Quantity_rules.min must be <= quantity_rules.max", { min, max });
    }
}

/**
 * Validate product images.
 */
function validate_images(images: string[] | undefined): void {
    if (!images) {
        return;
    }

    assert(Array.isArray(images), "invalid_product", "Images must be an array", { images });
    assert(images.length <= 8, "invalid_product", "Images must contain at most 8 URLs", { count: images.length });

    for (const image of images) {
        assert(
            typeof image === "string" && image.trim().length > 0,
            "invalid_product",
            "Image URL must be a non-empty string",
            { image },
        );
        // Require https URLs to avoid weird schemes ending up in Stripe/user-facing UIs.
        assert(
            /^https:\/\/\S+$/i.test(image.trim()),
            "invalid_product",
            "Image URL must be an https URL",
            { image },
        );
    }
}

/**
 * Create a stable signature for a one-time price.
 * This signature is stored in Stripe Price metadata to detect config changes.
 * @warning Never change this signature since it is used to link Stripe Prices to internal price definitions.
 *          Changing the signature format would cause all existing Stripe Prices to be considered stale and deactivated on the next initialization.
 */
function make_one_time_price_signature(opts: {
    currency: string;
    unit_amount: number;
    tax_behavior: TaxBehavior;
}): string {
    return `v1|one_time|${opts.currency}|${opts.unit_amount}|${opts.tax_behavior}`;
}

/**
 * Create a stable signature for a recurring price.
 * This signature is stored in Stripe Price metadata to detect config changes.
 * @warning Never change this signature since it is used to link Stripe Prices to internal price definitions.
 *          Changing the signature format would cause all existing Stripe Prices to be considered stale and deactivated on the next initialization.
 */
function make_recurring_price_signature(opts: {
    currency: string;
    unit_amount?: number;
    unit_amount_decimal?: string;
    tax_behavior: TaxBehavior;
    interval: RecurringInterval;
    interval_count: number;
    usage_type: "licensed" | "metered";
    meter_id?: string;
}): string {
    const meter_part = opts.usage_type === "metered" ? `|meter:${opts.meter_id ?? ""}` : "|meter:";
    const amount_part =
        opts.unit_amount_decimal !== undefined ? opts.unit_amount_decimal : (opts.unit_amount ?? 0);
    return `v1|recurring|${opts.currency}|${amount_part}|${opts.tax_behavior}|${opts.interval}|${opts.interval_count}|usage:${opts.usage_type}${meter_part}`;
}

/**
 * Create a unique app id for the price's metadata.
 * @warning This should not be changed, since this is used to link Stripe Prices to internal price definitions.
 */
function make_price_app_id(product_id: ProductId, plan_id: SubscriptionPlanId | undefined): string {
    return plan_id ? `${product_id}__plan__${plan_id}` : `${product_id}__one_time`;
}

/**
 * List all Stripe products, paginated.
 *
 * Docs: https://docs.stripe.com/api/products/list
 */
async function list_all_stripe_products(client: Stripe): Promise<Stripe.Product[]> {
    const all_products: Stripe.Product[] = [];
    let starting_after: string | undefined;

    for (; ;) {
        const page = await stripe_api_call(
            () =>
                client.products.list({
                    limit: stripe_list_page_size,
                    starting_after,
                    expand: ["data.default_price"],
                }),
            { operation: "products.list_all", starting_after },
        );

        all_products.push(...page.data);

        if (!page.has_more || page.data.length === 0) {
            break;
        }

        const last = page.data[page.data.length - 1];
        assert(last !== undefined, "api_error", "Stripe products pagination returned an empty last item", {
            returned: page.data.length,
        });

        starting_after = last.id;
    }

    return all_products;
}

/**
 * List all Stripe prices, paginated.
 *
 * Docs: https://docs.stripe.com/api/prices/list
 */
async function list_all_stripe_prices(client: Stripe): Promise<Stripe.Price[]> {
    const all_prices: Stripe.Price[] = [];
    let starting_after: string | undefined;

    for (; ;) {
        const page = await stripe_api_call(
            () =>
                client.prices.list({
                    limit: stripe_list_page_size,
                    // We list only active prices because inactive ones are not usable for new purchases,
                    // and we only need active ones for initialization comparisons.
                    active: true,
                    starting_after,
                }),
            { operation: "prices.list_all", starting_after },
        );

        all_prices.push(...page.data);

        if (!page.has_more || page.data.length === 0) {
            break;
        }

        const last = page.data[page.data.length - 1];
        assert(last !== undefined, "api_error", "Stripe prices pagination returned an empty last item", {
            returned: page.data.length,
        });

        starting_after = last.id;
    }

    return all_prices;
}

/**
 * List all Stripe billing meters, paginated.
 *
 * Docs: https://docs.stripe.com/api/billing/meter/list
 */
async function list_all_stripe_meters(client: Stripe): Promise<Array<Stripe.Billing.Meter>> {
    const all_meters: Array<Stripe.Billing.Meter> = [];
    let starting_after: string | undefined;

    for (; ;) {
        // Stripe docs: https://docs.stripe.com/api/billing/meter/list
        const page = await stripe_api_call(
            () =>
                client.billing.meters.list({
                    limit: stripe_list_page_size,
                    starting_after,
                }),
            { operation: "billing.meters.list_all", starting_after },
        );

        all_meters.push(...page.data);

        if (!page.has_more || page.data.length === 0) {
            break;
        }

        const last = page.data[page.data.length - 1];
        assert(last !== undefined, "api_error", "Stripe meters pagination returned an empty last item", {
            returned: page.data.length,
        });

        starting_after = last.id;
    }

    return all_meters;
}

/**
 * Build a lookup table from app product id -> Stripe Product.
 */
function index_stripe_products_by_app_id(
    stripe_products: Stripe.Product[],
): Map<string, Stripe.Product> {
    const map = new Map<string, Stripe.Product>();

    for (const product of stripe_products) {
        const app_id = product.metadata?.[app_product_id_metadata_key];
        if (app_id) {
            assert(!map.has(app_id), "api_error", "Duplicate Stripe product metadata app id", {
                app_id,
                existing_stripe_product_id: map.get(app_id)?.id,
                duplicate_stripe_product_id: product.id,
            });
            map.set(app_id, product);
        }
    }

    return map;
}

/**
 * Build a lookup table from Stripe product id -> active Stripe prices for that product.
 */
function index_active_prices_by_stripe_product_id(
    stripe_prices: Stripe.Price[],
): Map<string, Stripe.Price[]> {
    const map = new Map<string, Stripe.Price[]>();

    for (const price of stripe_prices) {
        // Stripe.Price.product can be string | Stripe.Product | Stripe.DeletedProduct
        // We only index when it is a string id.
        if (typeof price.product !== "string") {
            continue;
        }

        const list = map.get(price.product) ?? [];
        list.push(price);
        map.set(price.product, list);
    }

    return map;
}

/**
 * Build a lookup table from meter event_name -> Stripe Billing Meter.
 *
 * Note: Stripe Billing Meters do not currently expose metadata in the API reference,
 * so we link by stable event_name (which must be unique in the Stripe account).
 * Docs: https://docs.stripe.com/api/billing/meter/object
 */
function index_stripe_meters_by_event_name(
    stripe_meters: Array<Stripe.Billing.Meter>,
): Map<string, Stripe.Billing.Meter> {
    const map = new Map<string, Stripe.Billing.Meter>();

    for (const meter of stripe_meters) {
        const event_name = meter.event_name;
        if (event_name) {
            assert(!map.has(event_name), "api_error", "Duplicate Stripe meter event_name", {
                event_name,
                existing_stripe_meter_id: map.get(event_name)?.id,
                duplicate_stripe_meter_id: meter.id,
            });
            map.set(event_name, meter);
        }
    }

    return map;
}

/**
 * Find an active Stripe Price by internal price id and signature.
 *
 * Docs: https://docs.stripe.com/api/prices
 */
function find_matching_active_price(
    active_prices: Stripe.Price[],
    app_price_id: string,
    expected_signature: string,
): Stripe.Price | null {
    const match = active_prices.find((p) => {
        const meta_price_id = p.metadata?.[app_price_id_metadata_key];
        const meta_signature = p.metadata?.[app_price_signature_metadata_key];
        return meta_price_id === app_price_id && meta_signature === expected_signature;
    });
    return match ?? null;
}

// /**
//  * Deactivate all active Stripe Prices that match the internal price id but have different signatures.
//  *
//  * Docs: https://docs.stripe.com/api/prices/update
//  */
// async function deactivate_stale_prices_for_app_price_id(
//     client: Stripe,
//     server: Server,
//     active_prices: Stripe.Price[],
//     app_price_id: string,
//     expected_signature: string,
// ): Promise<void> {
//     const stale_prices = active_prices.filter((p) => {
//         const meta_price_id = p.metadata?.[app_price_id_metadata_key];
//         const meta_signature = p.metadata?.[app_price_signature_metadata_key];
//         return meta_price_id === app_price_id && meta_signature !== expected_signature;
//     });
//     await Promise.all(
//         stale_prices.map((p) =>
//             stripe_api_call(
//                 () =>
//                     client.prices.update(
//                         p.id,
//                         { active: false },
//                         { idempotencyKey: stable_idempotency_key(`init|prices.update|deactivate|${app_price_id}|${p.id}`) },
//                     ),
//                 { operation: "prices.update", app_price_id, stripe_price_id: p.id, action: "deactivate" },
//             ),
//         ),
//     );
// }

/**
 * Create a Stripe Product for a given internal Product.
 *
 * Docs: https://docs.stripe.com/api/products/create
 * Tax code docs: https://docs.stripe.com/tax/tax-codes
 */
async function create_stripe_product(
    client: Stripe,
    server: Server,
    product: Product,
): Promise<Stripe.Product> {
    server.log(1, `Creating Stripe product for product '${product.id}'`);

    return await stripe_api_call(
        () =>
            client.products.create(
                {
                    name: product.name,
                    description: product.description,
                    tax_code: product.tax_code,
                    images: product.images,
                    metadata: {
                        [app_product_id_metadata_key]: product.id,
                    },
                    expand: ["default_price"],
                },
                { idempotencyKey: generate_random_idempotency_key(`create_product_${product.id}`) },
            ),
        { operation: "products.create", app_product_id: product.id },
    );
}

/**
 * Update a Stripe Product if user-facing fields changed.
 *
 * Docs: https://docs.stripe.com/api/products/update
 */
async function update_stripe_product_if_needed(
    client: Stripe,
    server: Server,
    stripe_product: Stripe.Product,
    product: Product,
): Promise<Stripe.Product> {
    const stripe_images = stripe_product.images ?? [];
    const app_images = product.images ?? [];

    const images_equal =
        stripe_images.length === app_images.length &&
        stripe_images.every((url, index) => url === app_images[index]);

    const needs_update =
        stripe_product.name !== product.name ||
        (stripe_product.description ?? "") !== (product.description ?? "") ||
        (stripe_product.tax_code ?? "") !== (product.tax_code ?? "") ||
        !images_equal;

    if (!needs_update) {
        return stripe_product;
    }

    server.log(1, `Updating Stripe product '${stripe_product.id}' to match app product '${product.id}'`);

    return await stripe_api_call(
        () =>
            client.products.update(
                stripe_product.id,
                {
                    name: product.name,
                    description: product.description,
                    tax_code: product.tax_code,
                    images: product.images,
                    expand: ["default_price"],
                },
                { idempotencyKey: generate_random_idempotency_key(`update_product_${product.id}_${stripe_product.id}`) },
            ),
        { operation: "products.update", app_product_id: product.id, stripe_product_id: stripe_product.id },
    );
}

/**
 * Update default price on a stripe product if needed.
 */
async function update_stripe_product_default_price_if_needed(
    client: Stripe,
    server: Server,
    stripe_product: Stripe.Product,
    default_price: Stripe.Price,
    other_plans_from_parent_subscription?: InitializedSubscriptionPlan[],
): Promise<void> {

    // Extract default price.
    let default_price_id: string | null = null;
    if (typeof stripe_product.default_price === "string") {
        default_price_id = stripe_product.default_price;
    } else if (stripe_product.default_price && typeof stripe_product.default_price === "object") {
        default_price_id = stripe_product.default_price.id;
    }

    // If its still undefined, fetch the product to get the default_price expanded (this should be rare since we expand it on list/create/update).
    if (!default_price_id) {
        const fetched = await stripe_api_call(
            () =>
                client.products.retrieve(stripe_product.id, {
                    expand: ["default_price"],
                }),
            { operation: "products.retrieve_for_default_price", stripe_product_id: stripe_product.id },
        );
        default_price_id = typeof fetched.default_price === "string" ? fetched.default_price : fetched.default_price?.id ?? null;
    }

    // If the default price is already correct, do nothing.
    if (
        default_price_id === default_price.id
        // For subscription products, the default_price may be shared across multiple plans, so we also check if any other plan from the same subscription is using the price. If so, we should not update the default_price since it would affect those plans as well.
        || other_plans_from_parent_subscription?.some((plan) => plan.stripe_price_id === default_price_id)
    ) {
        return;
    }

    server.log(1, `Updating default price for Stripe product '${stripe_product.id}' to price '${default_price.id}'`);
    await stripe_api_call(
        () =>
            client.products.update(
                stripe_product.id,
                {
                    default_price: default_price.id,
                },
                { idempotencyKey: generate_random_idempotency_key(`update_product_default_price_${stripe_product.id}_${default_price.id}`) },
            ),
        { operation: "products.update", app_product_id: stripe_product.metadata?.[app_product_id_metadata_key], stripe_product_id: stripe_product.id, action: "update_default_price" },
    );
}

/**
 * Create a Stripe one-time Price for a product.
 *
 * Docs: https://docs.stripe.com/api/prices/create
 */
async function create_one_time_price(
    client: Stripe,
    server: Server,
    opts: {
        product_id: string;
        stripe_product_id: string;
        app_price_id: string;
        currency: string;
        unit_amount: number;
        tax_behavior: TaxBehavior;
        nickname: string;
    },
): Promise<Stripe.Price> {
    server.log(1, `Creating stripe one-time price for product: ${opts.product_id}`);

    return await stripe_api_call(
        () =>
            client.prices.create(
                {
                    product: opts.stripe_product_id,
                    currency: opts.currency,
                    unit_amount: opts.unit_amount,
                    // Docs: https://docs.stripe.com/tax/tax-behavior
                    tax_behavior: opts.tax_behavior,
                    nickname: opts.nickname,
                    metadata: {
                        [app_price_id_metadata_key]: opts.app_price_id,
                        [app_price_signature_metadata_key]: make_one_time_price_signature({
                            currency: opts.currency,
                            unit_amount: opts.unit_amount,
                            tax_behavior: opts.tax_behavior,
                        }),
                    },
                },
                { idempotencyKey: generate_random_idempotency_key(`create_one_time_price_${opts.app_price_id}_${opts.stripe_product_id}`) },
            ),
        { operation: "prices.create", app_price_id: opts.app_price_id, stripe_product_id: opts.stripe_product_id },
    );
}

/**
 * Create a Stripe recurring Price.
 *
 * Docs: https://docs.stripe.com/api/prices/create
 */
async function create_recurring_price(
    client: Stripe,
    server: Server,
    opts:
        | {
            product_id: string
            stripe_product_id: string;
            app_price_id: string;
            currency: string;
            unit_amount: number;
            unit_amount_decimal?: never;
            tax_behavior: TaxBehavior;
            nickname: string;
            interval: RecurringInterval;
            interval_count: number;
            recurring_usage:
            | { usage_type: "licensed" }
            | { usage_type: "metered"; meter_id: string };
        }
        | {
            product_id: string
            stripe_product_id: string;
            app_price_id: string;
            currency: string;
            unit_amount?: never;
            unit_amount_decimal: string;
            tax_behavior: TaxBehavior;
            nickname: string;
            interval: RecurringInterval;
            interval_count: number;
            recurring_usage:
            | { usage_type: "licensed" }
            | { usage_type: "metered"; meter_id: string };
        },
): Promise<Stripe.Price> {
    // Build recurring fields with optional metered settings.
    const recurring: Stripe.PriceCreateParams.Recurring = {
        interval: opts.interval,
        interval_count: opts.interval_count,
        // "metered" links the price to a billing meter; "licensed" is standard recurring.
        // Docs: https://docs.stripe.com/api/prices/create (recurring.usage_type)
        usage_type: opts.recurring_usage.usage_type,
        // For metered prices, connect the Stripe price to a meter id.
        // Docs: https://docs.stripe.com/api/prices/create (recurring.meter)
        ...(opts.recurring_usage.usage_type === "metered" ? { meter: opts.recurring_usage.meter_id } : {}),
    };

    const signature = make_recurring_price_signature({
        currency: opts.currency,
        ...(("unit_amount_decimal" in opts)
            ? { unit_amount_decimal: opts.unit_amount_decimal }
            : { unit_amount: opts.unit_amount }),
        tax_behavior: opts.tax_behavior,
        interval: opts.interval,
        interval_count: opts.interval_count,
        usage_type: opts.recurring_usage.usage_type,
        meter_id: opts.recurring_usage.usage_type === "metered" ? opts.recurring_usage.meter_id : undefined,
    });

    server.log(1, `Creating stripe recurring price for product: ${opts.product_id}`);
    return await stripe_api_call(
        () =>
            client.prices.create(
                {
                    product: opts.stripe_product_id,
                    currency: opts.currency,
                    ...(("unit_amount_decimal" in opts)
                        ? { unit_amount_decimal: opts.unit_amount_decimal }
                        : { unit_amount: opts.unit_amount }),
                    tax_behavior: opts.tax_behavior,
                    nickname: opts.nickname,
                    // Docs: https://docs.stripe.com/billing/prices-guide#create-prices
                    recurring,
                    metadata: {
                        [app_price_id_metadata_key]: opts.app_price_id,
                        [app_price_signature_metadata_key]: signature,
                    },
                },
                { idempotencyKey: generate_random_idempotency_key(`create_recurring_price_${opts.app_price_id}_${opts.stripe_product_id}`) },
            ),
        { operation: "prices.create", app_price_id: opts.app_price_id, stripe_product_id: opts.stripe_product_id },
    );
}

/**
 * Create a Stripe Billing Meter.
 *
 * Docs: https://docs.stripe.com/api/billing/meter/create
 */
async function create_stripe_meter(
    client: Stripe,
    server: Server,
    product: MeterProduct,
): Promise<Stripe.Billing.Meter> {
    const aggregation_formula = product.aggregation_formula ?? "sum";
    const customer_mapping_event_payload_key = product.customer_mapping_event_payload_key ?? "stripe_customer_id";
    const value_settings_event_payload_key = product.value_settings_event_payload_key ?? "value";
    
    server.log(1, `Creating stripe billing meter for product: ${product.id}`);

    return await stripe_api_call(
        () =>
            client.billing.meters.create(
                {
                    display_name: product.name,
                    event_name: product.meter_event_name,
                    default_aggregation: {
                        formula: aggregation_formula,
                    },
                    // Stripe currently requires by_id mapping and a payload key that contains the customer id.
                    // Docs: https://docs.stripe.com/api/billing/meter/create#billing_meter_create-customer_mapping
                    customer_mapping: {
                        type: "by_id",
                        event_payload_key: customer_mapping_event_payload_key,
                    },
                    // Value key used as the numeric value for "sum"/"last" aggregation.
                    // Docs: https://docs.stripe.com/api/billing/meter/create#billing_meter_create-value_settings
                    value_settings: {
                        event_payload_key: value_settings_event_payload_key,
                    },
                    ...(product.event_time_window ? { event_time_window: product.event_time_window } : {}),
                },
                { idempotencyKey: generate_random_idempotency_key(`create_billing_meter_${product.id}_${product.meter_event_name}`) },
            ),
        {
            operation: "billing.meters.create",
            app_meter_product_id: product.id,
            event_name: product.meter_event_name,
            aggregation_formula,
            customer_mapping_event_payload_key,
            value_settings_event_payload_key,
            event_time_window: product.event_time_window ?? null,
        },
    );
}

/**
 * Run async work with limited concurrency, preserving input order.
 */
async function map_with_concurrency<T_in, T_out>(
    items: T_in[],
    concurrency: number,
    mapper: (item: T_in, index: number) => Promise<T_out>,
): Promise<T_out[]> {
    assert(
        Number.isInteger(concurrency) && concurrency >= 1,
        "invalid_argument",
        "Concurrency must be an integer >= 1",
        { concurrency },
    );

    const results: T_out[] = new Array(items.length);
    let next_index = 0;
    let first_error: unknown = null;

    const worker = async (): Promise<void> => {
        for (; ;) {
            if (first_error) return;
            const current_index = next_index;
            next_index += 1;
            if (current_index >= items.length) {
                return;
            }

            const current_item = items[current_index];
            assert(
                current_item !== undefined,
                "invalid_argument",
                "Missing item for concurrency worker index",
                { current_index, items_length: items.length },
            );

            try {
                results[current_index] = await mapper(current_item, current_index);
            } catch (e) {
                // Stop other workers ASAP; rethrow after all workers settle.
                if (!first_error) first_error = e;
                return;
            }
        }
    };

    const worker_count = Math.min(concurrency, items.length);
    await Promise.allSettled(Array.from({ length: worker_count }, () => worker()));
    if (first_error) throw first_error;

    return results;
}

// ----------------------------------------------------------------------------
// Private initializer.

/**
 * Initialize a product using pre-fetched Stripe products/prices indexes.
 */
async function initialize_product(
    client: Stripe,
    server: Server,
    product: Product,
    stripe_products_by_app_id: Map<string, Stripe.Product>,
    active_prices_by_stripe_product_id: Map<string, Stripe.Price[]>,
    stripe_meters_by_event_name: Map<string, Stripe.Billing.Meter>,
): Promise<InitializedProduct> {
    assert(product.id.trim().length > 0, "invalid_product", "Product.id must be non-empty", { product_id: product.id });
    assert(product.name.trim().length > 0, "invalid_product", "Product.name must be non-empty", { product_id: product.id });
    assert(product.currency.trim().length > 0, "invalid_product", "Product.currency must be non-empty", { product_id: product.id });
    assert(product.tax_code.trim().length > 0, "invalid_product", "Product.tax_code must be non-empty", { product_id: product.id });
    assert(
        product.tax_behavior === "inclusive" ||
        product.tax_behavior === "exclusive" ||
        product.tax_behavior === "unspecified",
        "invalid_product",
        "Product.tax_behavior is invalid",
        { product_id: product.id, tax_behavior: product.tax_behavior },
    );

    validate_images(product.images);

    // Normalize currency code to lowercase for consistent matching and Stripe API usage.
    product.currency = product.currency.trim().toLowerCase();
    assert(
        /^[a-z]{3}$/.test(product.currency),
        "invalid_product",
        `Invalid currency code: "${product.currency}"`,
        { currency: product.currency },
    );

    if (product.type === "one_time") {
        validate_unit_amount(product.price, "Product.price");
        validate_quantity_rules(product.quantity_rules);
    }
    else if (product.type === "subscription") {
        assert(Array.isArray(product.plans) && product.plans.length > 0, "invalid_product", "Subscription product must have plans", { product_id: product.id });

        if (product.trial_days !== undefined) {
            assert(
                Number.isInteger(product.trial_days) && product.trial_days >= 1,
                "invalid_product",
                "Subscription.trial_days must be an integer >= 1",
                { product_id: product.id, trial_days: product.trial_days },
            );
        }
        
        if (product.billing_anchor !== undefined) {
            const anchor = product.billing_anchor;
            assert(
                anchor === "immediately" || anchor === "first_of_month",
                "invalid_product",
                "Subscription.billing_anchor is invalid",
                { product_id: product.id, billing_anchor: anchor },
            );
        } else {
            // Default to "immediately" if not set.
            product.billing_anchor = "immediately";
        }

        for (const plan of product.plans) {
            assert(plan.id.trim().length > 0, "invalid_product", "Plan.id must be non-empty", { product_id: product.id });
            assert(plan.name.trim().length > 0, "invalid_product", "Plan.name must be non-empty", { product_id: product.id, plan_id: plan.id });
            validate_unit_amount(plan.price, "Plan.price");
            assert(
                Number.isInteger(plan.interval_count) && plan.interval_count >= 1,
                "invalid_product",
                "Plan.interval_count must be >= 1",
                { product_id: product.id, plan_id: plan.id, interval_count: plan.interval_count },
            );
            assert(
                plan.interval === "day" || plan.interval === "week" || plan.interval === "month" || plan.interval === "year",
                "invalid_product",
                "Plan.interval is invalid",
                { product_id: product.id, plan_id: plan.id, interval: plan.interval },
            );
        }
    }
    else if (product.type === "meter") {
        assert(
            product.interval === "day" || product.interval === "week" || product.interval === "month" || product.interval === "year",
            "invalid_product",
            "Property 'interval' is invalid",
            { product_id: product.id, interval: product.interval },
        );
        if (product.kind === "units") {
            assert(
                product.price !== undefined,
                "invalid_product",
                "MeterProduct with kind='units' must define 'price'.",
                { product_id: product.id },
            );
            // validates + normalizes shape
            resolve_unit_price_fields(product);
        } else if (product.kind === "money") {
            // money meter: no price is allowed
            assert(
                product.price === undefined,
                "invalid_product",
                "MeterProduct with kind='money' must not define 'price'.",
                { product_id: product.id },
            );
        } else {
            // @ts-expect-error
            product.kind.toString();
            throw new InternalStripeError(
                "invalid_product",
                `Invalid 'kind': ${(product as MeterProduct).kind}`,
                { product_id: (product as MeterProduct).id, kind: (product as MeterProduct).kind },
            );
        }

        assert(
            Number.isInteger(product.interval_count) && product.interval_count >= 1,
            "invalid_product",
            "Property 'interval_count' must be >= 1",
            { product_id: product.id, interval_count: product.interval_count },
        );

        assert(product.meter_event_name.trim().length > 0, "invalid_product", "Property 'meter_event_name' must be non-empty", {
            product_id: product.id,
            meter_event_name: product.meter_event_name,
        });

        // Stripe meter event_name max length is 100 chars.
        // Docs: https://docs.stripe.com/api/billing/meter/create
        assert(
            product.meter_event_name.length <= 100,
            "invalid_product",
            "Property 'meter_event_name' must be <= 100 characters",
            { product_id: product.id, meter_event_name_length: product.meter_event_name.length },
        );

        if (product.aggregation_formula !== undefined) {
            const formula = product.aggregation_formula;
            assert(
                formula === "count" || formula === "sum" || formula === "last",
                "invalid_product",
                "Property 'aggregation_formula' is invalid",
                { product_id: product.id, aggregation_formula: formula },
            );
        }

        if (product.customer_mapping_event_payload_key !== undefined) {
            assert(
                product.customer_mapping_event_payload_key.trim().length > 0,
                "invalid_product",
                "Property 'customer_mapping_event_payload_key' must be non-empty",
                { product_id: product.id, customer_mapping_event_payload_key: product.customer_mapping_event_payload_key },
            );
        }

        if (product.value_settings_event_payload_key !== undefined) {
            assert(
                product.value_settings_event_payload_key.trim().length > 0,
                "invalid_product",
                "Property 'value_settings_event_payload_key' must be non-empty",
                { product_id: product.id, value_settings_event_payload_key: product.value_settings_event_payload_key },
            );
        }

        if (product.event_time_window !== undefined) {
            const window = product.event_time_window;
            assert(
                window === "hour" || window === "day",
                "invalid_product",
                "Property 'event_time_window' is invalid",
                { product_id: product.id, event_time_window: window },
            );
        }
    }
    else {
        //@ts-expect-error product.type should be never here
        product.type.toString();
        throw new InternalStripeError(
            "invalid_product",
            `Invalid product type: ${(product as Product).type}`,
            {
                product_id: (product as Product).id, product_type: (product as Product).type

            }
        );
    }

    // 0) If this is a meter product, ensure the Stripe Billing Meter exists (or create it).
    let stripe_meter: Stripe.Billing.Meter | null = null;
    if (product.type === "meter") {
        stripe_meter = stripe_meters_by_event_name.get(product.meter_event_name) ?? null;
        if (!stripe_meter) {
            stripe_meter = await create_stripe_meter(client, server, product);
            stripe_meters_by_event_name.set(product.meter_event_name, stripe_meter);
        }
    }

    // 1) Ensure Stripe Product exists (or create it), linked by metadata.
    let stripe_product = stripe_products_by_app_id.get(product.id) ?? null;
    if (!stripe_product) {
        stripe_product = await create_stripe_product(client, server, product);
        stripe_products_by_app_id.set(product.id, stripe_product);
    } else {
        stripe_product = await update_stripe_product_if_needed(client, server, stripe_product, product);
        stripe_products_by_app_id.set(product.id, stripe_product);
    }

    // 2) Resolve active prices for this Stripe product (from pre-fetched index).
    const active_prices = active_prices_by_stripe_product_id.get(stripe_product.id) ?? [];

    if (product.type === "one_time") {
        const app_price_id = make_price_app_id(product.id, undefined);
        const signature = make_one_time_price_signature({
            currency: product.currency,
            unit_amount: product.price,
            tax_behavior: product.tax_behavior,
        });

        let stripe_price = find_matching_active_price(active_prices, app_price_id, signature);
        if (!stripe_price) {

            stripe_price = await create_one_time_price(client, server, {
                product_id: product.id,
                stripe_product_id: stripe_product.id,
                app_price_id,
                currency: product.currency,
                unit_amount: product.price,
                tax_behavior: product.tax_behavior,
                nickname: product.name,
            });

            const updated_prices = [...active_prices, stripe_price];
            active_prices_by_stripe_product_id.set(stripe_product.id, updated_prices);
        }

        await update_stripe_product_default_price_if_needed(
            client,
            server,
            stripe_product,
            stripe_price,
        );

        return {
            ...product,
            stripe_product_id: stripe_product.id,
            stripe_price_id: stripe_price.id,
        };
    } else if (product.type === "subscription") {
        const initialized_plans: InitializedSubscriptionProduct["plans"] = [];

        for (const plan of product.plans) {
            const app_price_id = make_price_app_id(product.id, plan.id);
            const signature = make_recurring_price_signature({
                currency: product.currency,
                unit_amount: plan.price,
                tax_behavior: product.tax_behavior,
                interval: plan.interval,
                interval_count: plan.interval_count,
                usage_type: "licensed",
            });

            let stripe_price = find_matching_active_price(active_prices, app_price_id, signature);
            if (!stripe_price) {
                stripe_price = await create_recurring_price(client, server, {
                    product_id: product.id,
                    stripe_product_id: stripe_product.id,
                    app_price_id,
                    currency: product.currency,
                    unit_amount: plan.price,
                    tax_behavior: product.tax_behavior,
                    nickname: `${product.name} - ${plan.name}`,
                    interval: plan.interval,
                    interval_count: plan.interval_count,
                    recurring_usage: { usage_type: "licensed" },
                });
                const updated_prices = [...active_prices, stripe_price];
                active_prices_by_stripe_product_id.set(stripe_product.id, updated_prices);
            }

            await update_stripe_product_default_price_if_needed(
                client,
                server,
                stripe_product,
                stripe_price,
                initialized_plans,
            );

            initialized_plans.push({
                ...plan,
                type: "subscription_plan",
                subscription_id: product.id,
                stripe_price_id: stripe_price.id,
            });
        }

        return {
            ...product,
            stripe_product_id: stripe_product.id,
            plans: initialized_plans,
        };
    }
    else if (product.type === "meter") {
        assert(stripe_meter !== null, "api_error", "Stripe meter must be resolved for meter product initialization", {
            product_id: product.id,
            meter_event_name: product.meter_event_name,
        });

        const app_price_id = `${product.id}__meter`;

        const unit_price_fields = resolve_unit_price_fields(product);

        const signature = make_recurring_price_signature({
            currency: product.currency,
            ...unit_price_fields,
            tax_behavior: product.tax_behavior,
            interval: product.interval,
            interval_count: product.interval_count,
            usage_type: "metered",
            meter_id: stripe_meter.id,
        });

        let stripe_price = find_matching_active_price(active_prices, app_price_id, signature);
        if (!stripe_price) {
            const new_price = await create_recurring_price(client, server, {
                product_id: product.id,
                stripe_product_id: stripe_product.id,
                app_price_id,
                currency: product.currency,
                ...unit_price_fields,
                tax_behavior: product.tax_behavior,
                nickname: product.name,
                interval: product.interval,
                interval_count: product.interval_count,
                recurring_usage: { usage_type: "metered", meter_id: stripe_meter.id },
            });
            stripe_price = new_price;
            active_prices_by_stripe_product_id.set(stripe_product.id, [...active_prices, new_price]);
        }

        await update_stripe_product_default_price_if_needed(
            client,
            server,
            stripe_product,
            stripe_price,
        );

        return {
            ...product,
            stripe_meter_id: stripe_meter.id,
            stripe_product_id: stripe_product.id,
            stripe_price_id: stripe_price.id,
        };
    }
    else {
        //@ts-expect-error product.type should be never here
        product.type.toString();
        throw new InternalStripeError(
            "invalid_product",
            `Invalid product type: ${(product as Product).type}`,
            {
                product_id: (product as Product).id, product_type: (product as Product).type

            }
        );
    }
}

// ----------------------------------------------------------------------------
// Public API.

/**
 * Resolve the subscription product (InitializedSubscriptionProduct) that owns a given plan.
 */
export function resolve_plan_to_parent_subscription(opts: {
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
 * Initialize a list of products through the internal initializer, using a single paginated scan
 * of Stripe products and prices which is then reused for all initializations.
 */
export async function initialize_products(
    client: Stripe,
    server: Server,
    products: Product[],
): Promise<InitializedProduct[]> {
    assert(Array.isArray(products), "invalid_argument", "Products must be an array");

    // Verify that all `id` attributes from Products and Plans are unique.
    const seen_ids = new Set<string>();
    const seen_meter_event_names = new Set<string>();
    for (const product of products) {
        assert(!seen_ids.has(product.id), "invalid_product", `Duplicate product id: ${product.id}`, { product_id: product.id });
        seen_ids.add(product.id);

        if (product.type === "subscription") {
            for (const plan of product.plans) {
                assert(!seen_ids.has(plan.id), "invalid_product", `Duplicate plan id: ${plan.id} in product ${product.id}`, { product_id: product.id, plan_id: plan.id });
                seen_ids.add(plan.id);
            }
        }

        if (product.type === "meter") {
            assert(
                !seen_meter_event_names.has(product.meter_event_name),
                "invalid_product",
                `Duplicate meter_event_name: ${product.meter_event_name}`,
                { product_id: product.id, meter_event_name: product.meter_event_name },
            );
            seen_meter_event_names.add(product.meter_event_name);
        }
    }

    // High-performance: list all products, prices, and meters once, then reuse indexes.
    const [all_stripe_products, all_active_stripe_prices, all_stripe_meters] = await Promise.all([
        list_all_stripe_products(client),
        list_all_stripe_prices(client),
        list_all_stripe_meters(client),
    ]);

    const stripe_products_by_app_id = index_stripe_products_by_app_id(all_stripe_products);
    const active_prices_by_stripe_product_id = index_active_prices_by_stripe_product_id(all_active_stripe_prices);
    const stripe_meters_by_event_name = index_stripe_meters_by_event_name(all_stripe_meters);

    // Initialize with limited concurrency to reduce latency while avoiding Stripe rate spikes.
    const concurrency = 5;
    const initialized_products = await map_with_concurrency(products, concurrency, async (product) => {
        return await initialize_product(
            client,
            server,
            product,
            stripe_products_by_app_id,
            active_prices_by_stripe_product_id,
            stripe_meters_by_event_name,
        );
    });

    // Response.
    return initialized_products;
}
