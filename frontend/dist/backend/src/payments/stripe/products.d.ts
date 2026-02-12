/**
 * @author Daan van den Bergh
 * @copyright © 2026 - 2026 Daan van den Bergh. All rights reserved
 */
import Stripe from "stripe";
import { Server } from "../../server.js";
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
export declare namespace MeterProduct {
    /**
     * The meter product kind.
     */
    type Kind = "units" | "money";
    /** Unit price, either by integer (smallest currency unit) or decimal string. */
    type UnitPrice = number | {
        decimals: string;
    };
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
    interface UnitsMeter extends BaseProduct {
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
    interface MoneyMeter extends BaseProduct {
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
    const MONEY_METER_MAJOR_TO_PICO_CENTS_SHIFT = 14;
    /** Fixed Stripe unit_amount_decimal for money meters, in cents. */
    const MONEY_METER_UNIT_AMOUNT_DECIMAL_CENTS = "0.000000000001";
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
};
/** A union type of all initialized products. */
export type InitializedProduct = InitializedOneTimeProduct | InitializedSubscriptionProduct | InitializedMeterProduct;
/**
 * Resolve the subscription product (InitializedSubscriptionProduct) that owns a given plan.
 */
export declare function resolve_plan_to_parent_subscription(opts: {
    plan: InitializedSubscriptionPlan;
    all_products: InitializedProduct[];
}): InitializedSubscriptionProduct;
/**
 * Initialize a list of products through the internal initializer, using a single paginated scan
 * of Stripe products and prices which is then reused for all initializations.
 */
export declare function initialize_products(client: Stripe, server: Server, products: Product[]): Promise<InitializedProduct[]>;
export {};
