/**
 * @author Daan van den Bergh
 * @copyright © 2026 - 2026 Daan van den Bergh. All rights reserved
 */

import Stripe from "stripe";
import { InternalStripeError } from "./error.js";
import { assert, stripe_api_call } from "./utils.js";

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
 */
export type ProductId = string;

/**
 * An internal subscription plan id, simple type alias for clarity.
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
    /** The subscription plans. */
    plans: SubscriptionPlan[];
}

/**
 * Supported aggregation formulas for Stripe Billing meters.
 * @see https://docs.stripe.com/api/billing/meter/create
 */
export type MeterAggregationFormula = "count" | "sum" | "last";

/**
 * A meter product.
 *
 * This defines:
 * - a Stripe Billing Meter (usage aggregation definition)
 * - a Stripe Product + recurring metered Price attached to that meter
 *
 * Stripe docs:
 * - Meters: https://docs.stripe.com/api/billing/meter
 * - Create meter: https://docs.stripe.com/api/billing/meter/create
 * - Prices (recurring.meter): https://docs.stripe.com/api/prices/create
 */
export interface MeterProduct extends BaseProduct {
    /** The product type. */
    type: "meter";
    /** The price per usage unit in the smallest currency unit (e.g., cents). */
    price: number;
    /** The billing interval for the usage price (typically "month"). */
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

/** An initialized meter product. */
export interface InitializedMeterProduct extends MeterProduct {
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
        `${field_name} must be an integer (smallest currency unit)`,
        { field_name, unit_amount },
    );
    assert(
        unit_amount >= 0,
        "invalid_product",
        `${field_name} must be >= 0`,
        { field_name, unit_amount },
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

    for (const image of images) {
        assert(
            typeof image === "string" && image.trim().length > 0,
            "invalid_product",
            "Image URL must be a non-empty string",
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
    unit_amount: number;
    tax_behavior: TaxBehavior;
    interval: RecurringInterval;
    interval_count: number;
    usage_type: "licensed" | "metered";
    meter_id?: string;
}): string {
    const meter_part = opts.usage_type === "metered" ? `|meter:${opts.meter_id ?? ""}` : "|meter:";
    return `v1|recurring|${opts.currency}|${opts.unit_amount}|${opts.tax_behavior}|${opts.interval}|${opts.interval_count}|usage:${opts.usage_type}${meter_part}`;
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
async function list_all_stripe_products(stripe: Stripe): Promise<Stripe.Product[]> {
    const all_products: Stripe.Product[] = [];
    let starting_after: string | undefined;

    for (; ;) {
        const page = await stripe_api_call(
            () =>
                stripe.products.list({
                    limit: stripe_list_page_size,
                    starting_after,
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
async function list_all_stripe_prices(stripe: Stripe): Promise<Stripe.Price[]> {
    const all_prices: Stripe.Price[] = [];
    let starting_after: string | undefined;

    for (; ;) {
        const page = await stripe_api_call(
            () =>
                stripe.prices.list({
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
async function list_all_stripe_meters(stripe: Stripe): Promise<Array<Stripe.Billing.Meter>> {
    const all_meters: Array<Stripe.Billing.Meter> = [];
    let starting_after: string | undefined;

    for (; ;) {
        // Stripe docs: https://docs.stripe.com/api/billing/meter/list
        const page = await stripe_api_call(
            () =>
                stripe.billing.meters.list({
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

/**
 * Deactivate all active Stripe Prices that match the internal price id but have different signatures.
 *
 * Docs: https://docs.stripe.com/api/prices/update
 */
async function deactivate_stale_prices_for_app_price_id(
    stripe: Stripe,
    active_prices: Stripe.Price[],
    app_price_id: string,
    expected_signature: string,
): Promise<void> {
    const stale_prices = active_prices.filter((p) => {
        const meta_price_id = p.metadata?.[app_price_id_metadata_key];
        const meta_signature = p.metadata?.[app_price_signature_metadata_key];
        return meta_price_id === app_price_id && meta_signature !== expected_signature;
    });

    await Promise.all(
        stale_prices.map((p) =>
            stripe_api_call(
                () =>
                    stripe.prices.update(
                        p.id,
                        { active: false },
                        { idempotencyKey: `init_price_deactivate_${app_price_id}_${p.id}` },
                    ),
                { operation: "prices.update", app_price_id, stripe_price_id: p.id, action: "deactivate" },
            ),
        ),
    );
}

/**
 * Create a Stripe Product for a given internal Product.
 *
 * Docs: https://docs.stripe.com/api/products/create
 * Tax code docs: https://docs.stripe.com/tax/tax-codes
 */
async function create_stripe_product(
    stripe: Stripe,
    product: Product,
): Promise<Stripe.Product> {
    return await stripe_api_call(
        () =>
            stripe.products.create(
                {
                    name: product.name,
                    description: product.description,
                    tax_code: product.tax_code,
                    images: product.images,
                    metadata: {
                        [app_product_id_metadata_key]: product.id,
                    },
                },
                { idempotencyKey: `init_product_create_${product.id}` },
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
    stripe: Stripe,
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

    return await stripe_api_call(
        () =>
            stripe.products.update(
                stripe_product.id,
                {
                    name: product.name,
                    description: product.description,
                    tax_code: product.tax_code,
                    images: product.images,
                },
                { idempotencyKey: `init_product_update_${product.id}` },
            ),
        { operation: "products.update", app_product_id: product.id, stripe_product_id: stripe_product.id },
    );
}

/**
 * Create a Stripe one-time Price for a product.
 *
 * Docs: https://docs.stripe.com/api/prices/create
 */
async function create_one_time_price(
    stripe: Stripe,
    opts: {
        stripe_product_id: string;
        app_price_id: string;
        currency: string;
        unit_amount: number;
        tax_behavior: TaxBehavior;
        nickname: string;
    },
): Promise<Stripe.Price> {
    return await stripe_api_call(
        () =>
            stripe.prices.create(
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
                { idempotencyKey: `init_price_create_one_time_${opts.app_price_id}` },
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
    stripe: Stripe,
    opts: {
        stripe_product_id: string;
        app_price_id: string;
        currency: string;
        unit_amount: number;
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
        unit_amount: opts.unit_amount,
        tax_behavior: opts.tax_behavior,
        interval: opts.interval,
        interval_count: opts.interval_count,
        usage_type: opts.recurring_usage.usage_type,
        meter_id: opts.recurring_usage.usage_type === "metered" ? opts.recurring_usage.meter_id : undefined,
    });

    return await stripe_api_call(
        () =>
            stripe.prices.create(
                {
                    product: opts.stripe_product_id,
                    currency: opts.currency,
                    unit_amount: opts.unit_amount,
                    tax_behavior: opts.tax_behavior,
                    nickname: opts.nickname,
                    // Docs: https://docs.stripe.com/billing/prices-guide#create-prices
                    recurring,
                    metadata: {
                        [app_price_id_metadata_key]: opts.app_price_id,
                        [app_price_signature_metadata_key]: signature,
                    },
                },
                { idempotencyKey: `init_price_create_recurring_${opts.app_price_id}` },
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
    stripe: Stripe,
    product: MeterProduct,
): Promise<Stripe.Billing.Meter> {
    const aggregation_formula = product.aggregation_formula ?? "sum";
    const customer_mapping_event_payload_key = product.customer_mapping_event_payload_key ?? "stripe_customer_id";
    const value_settings_event_payload_key = product.value_settings_event_payload_key ?? "value";

    return await stripe_api_call(
        () =>
            stripe.billing.meters.create(
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
                { idempotencyKey: `init_meter_create_${product.id}_${product.meter_event_name}` },
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

    const worker = async (): Promise<void> => {
        for (; ;) {
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

            results[current_index] = await mapper(current_item, current_index);
        }
    };

    const worker_count = Math.min(concurrency, items.length);
    await Promise.all(Array.from({ length: worker_count }, () => worker()));

    return results;
}

// ----------------------------------------------------------------------------
// Private initializer.

/**
 * Initialize a product using pre-fetched Stripe products/prices indexes.
 */
async function initialize_product(
    stripe: Stripe,
    product: Product,
    stripe_products_by_app_id: Map<string, Stripe.Product>,
    active_prices_by_stripe_product_id: Map<string, Stripe.Price[]>,
    stripe_meters_by_event_name: Map<string, Stripe.Billing.Meter>,
): Promise<InitializedProduct> {
    assert(product.id.trim().length > 0, "invalid_product", "Product.id must be non-empty", { product_id: product.id });
    assert(product.name.trim().length > 0, "invalid_product", "Product.name must be non-empty", { product_id: product.id });
    assert(product.currency.trim().length > 0, "invalid_product", "Product.currency must be non-empty", { product_id: product.id });
    assert(product.tax_code.trim().length > 0, "invalid_product", "Product.tax_code must be non-empty", { product_id: product.id });

    validate_images(product.images);

    const normalized_currency = product.currency.trim().toLowerCase();
    assert(
        /^[a-z]{3}$/.test(normalized_currency),
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
        }
    }
    else if (product.type === "meter") {
        validate_unit_amount(product.price, "MeterProduct.price");

        assert(
            Number.isInteger(product.interval_count) && product.interval_count >= 1,
            "invalid_product",
            "MeterProduct.interval_count must be >= 1",
            { product_id: product.id, interval_count: product.interval_count },
        );

        assert(product.meter_event_name.trim().length > 0, "invalid_product", "MeterProduct.meter_event_name must be non-empty", {
            product_id: product.id,
            meter_event_name: product.meter_event_name,
        });

        // Stripe meter event_name max length is 100 chars.
        // Docs: https://docs.stripe.com/api/billing/meter/create
        assert(
            product.meter_event_name.length <= 100,
            "invalid_product",
            "MeterProduct.meter_event_name must be <= 100 characters",
            { product_id: product.id, meter_event_name_length: product.meter_event_name.length },
        );

        if (product.aggregation_formula !== undefined) {
            const formula = product.aggregation_formula;
            assert(
                formula === "count" || formula === "sum" || formula === "last",
                "invalid_product",
                "MeterProduct.aggregation_formula is invalid",
                { product_id: product.id, aggregation_formula: formula },
            );
        }

        if (product.customer_mapping_event_payload_key !== undefined) {
            assert(
                product.customer_mapping_event_payload_key.trim().length > 0,
                "invalid_product",
                "MeterProduct.customer_mapping_event_payload_key must be non-empty",
                { product_id: product.id, customer_mapping_event_payload_key: product.customer_mapping_event_payload_key },
            );
        }

        if (product.value_settings_event_payload_key !== undefined) {
            assert(
                product.value_settings_event_payload_key.trim().length > 0,
                "invalid_product",
                "MeterProduct.value_settings_event_payload_key must be non-empty",
                { product_id: product.id, value_settings_event_payload_key: product.value_settings_event_payload_key },
            );
        }

        if (product.event_time_window !== undefined) {
            const window = product.event_time_window;
            assert(
                window === "hour" || window === "day",
                "invalid_product",
                "MeterProduct.event_time_window is invalid",
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
            stripe_meter = await create_stripe_meter(stripe, product);
            stripe_meters_by_event_name.set(product.meter_event_name, stripe_meter);
        }
    }

    // 1) Ensure Stripe Product exists (or create it), linked by metadata.
    let stripe_product = stripe_products_by_app_id.get(product.id) ?? null;
    if (!stripe_product) {
        stripe_product = await create_stripe_product(stripe, product);
        stripe_products_by_app_id.set(product.id, stripe_product);
    } else {
        stripe_product = await update_stripe_product_if_needed(stripe, stripe_product, product);
        stripe_products_by_app_id.set(product.id, stripe_product);
    }

    // 2) Resolve active prices for this Stripe product (from pre-fetched index).
    const active_prices = active_prices_by_stripe_product_id.get(stripe_product.id) ?? [];

    if (product.type === "one_time") {
        const app_price_id = make_price_app_id(product.id, undefined);
        const signature = make_one_time_price_signature({
            currency: normalized_currency,
            unit_amount: product.price,
            tax_behavior: product.tax_behavior,
        });

        let stripe_price = find_matching_active_price(active_prices, app_price_id, signature);
        if (!stripe_price) {
            await deactivate_stale_prices_for_app_price_id(stripe, active_prices, app_price_id, signature);

            stripe_price = await create_one_time_price(stripe, {
                stripe_product_id: stripe_product.id,
                app_price_id,
                currency: normalized_currency,
                unit_amount: product.price,
                tax_behavior: product.tax_behavior,
                nickname: product.name,
            });

            const updated_prices = [...active_prices, stripe_price];
            active_prices_by_stripe_product_id.set(stripe_product.id, updated_prices);
        }

        if (stripe_product.default_price !== stripe_price.id) {
            stripe_product = await stripe_api_call(
                () =>
                    stripe.products.update(
                        stripe_product!.id,
                        { default_price: stripe_price.id },
                        { idempotencyKey: `init_product_default_price_${product.id}_${stripe_price.id}` },
                    ),
                { operation: "products.update", app_product_id: product.id, stripe_product_id: stripe_product.id, action: "set_default_price" },
            );
            stripe_products_by_app_id.set(product.id, stripe_product);
        }

        return {
            ...product,
            currency: normalized_currency,
            stripe_product_id: stripe_product.id,
            stripe_price_id: stripe_price.id,
        };
    } else if (product.type === "subscription") {
        const initialized_plans: InitializedSubscriptionProduct["plans"] = [];

        for (const plan of product.plans) {
            const app_price_id = make_price_app_id(product.id, plan.id);
            const signature = make_recurring_price_signature({
                currency: normalized_currency,
                unit_amount: plan.price,
                tax_behavior: product.tax_behavior,
                interval: plan.interval,
                interval_count: plan.interval_count,
                usage_type: "licensed",
            });

            let stripe_price = find_matching_active_price(active_prices, app_price_id, signature);
            if (!stripe_price) {
                await deactivate_stale_prices_for_app_price_id(stripe, active_prices, app_price_id, signature);

                stripe_price = await create_recurring_price(stripe, {
                    stripe_product_id: stripe_product.id,
                    app_price_id,
                    currency: normalized_currency,
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

            initialized_plans.push({
                ...plan,
                type: "subscription_plan",
                subscription_id: product.id,
                stripe_price_id: stripe_price.id,
            });
        }

        return {
            ...product,
            currency: normalized_currency,
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
        const signature = make_recurring_price_signature({
            currency: normalized_currency,
            unit_amount: product.price,
            tax_behavior: product.tax_behavior,
            interval: product.interval,
            interval_count: product.interval_count,
            usage_type: "metered",
            meter_id: stripe_meter.id,
        });

        let stripe_price = find_matching_active_price(active_prices, app_price_id, signature);
        if (!stripe_price) {
            await deactivate_stale_prices_for_app_price_id(stripe, active_prices, app_price_id, signature);

            stripe_price = await create_recurring_price(stripe, {
                stripe_product_id: stripe_product.id,
                app_price_id,
                currency: normalized_currency,
                unit_amount: product.price,
                tax_behavior: product.tax_behavior,
                nickname: product.name,
                interval: product.interval,
                interval_count: product.interval_count,
                recurring_usage: { usage_type: "metered", meter_id: stripe_meter.id },
            });

            const updated_prices = [...active_prices, stripe_price];
            active_prices_by_stripe_product_id.set(stripe_product.id, updated_prices);
        }

        if (stripe_product.default_price !== stripe_price.id) {
            stripe_product = await stripe_api_call(
                () =>
                    stripe.products.update(
                        stripe_product!.id,
                        { default_price: stripe_price.id },
                        { idempotencyKey: `init_product_default_price_${product.id}_${stripe_price.id}` },
                    ),
                { operation: "products.update", app_product_id: product.id, stripe_product_id: stripe_product.id, action: "set_default_price" },
            );
            stripe_products_by_app_id.set(product.id, stripe_product);
        }

        return {
            ...product,
            currency: normalized_currency,
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
    stripe: Stripe,
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
        list_all_stripe_products(stripe),
        list_all_stripe_prices(stripe),
        list_all_stripe_meters(stripe),
    ]);

    const stripe_products_by_app_id = index_stripe_products_by_app_id(all_stripe_products);
    const active_prices_by_stripe_product_id = index_active_prices_by_stripe_product_id(all_active_stripe_prices);
    const stripe_meters_by_event_name = index_stripe_meters_by_event_name(all_stripe_meters);

    // Initialize with limited concurrency to reduce latency while avoiding Stripe rate spikes.
    const concurrency = 5;
    const initialized_products = await map_with_concurrency(products, concurrency, async (product) => {
        return await initialize_product(
            stripe,
            product,
            stripe_products_by_app_id,
            active_prices_by_stripe_product_id,
            stripe_meters_by_event_name,
        );
    });

    // Response.
    return initialized_products;
}
