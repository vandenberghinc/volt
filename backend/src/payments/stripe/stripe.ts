/**
 * @author Daan van den Bergh
 * @copyright © 2026 - 2026 Daan van den Bergh. All rights reserved
 */

import StripeClient from "stripe";
import { delete_stripe_customer, ensure_stripe_customer, find_stripe_customer_id } from "./customers.js";
import { initialize_products, InitializedMeterProduct, InitializedOneTimeProduct, InitializedProduct, InitializedSubscriptionPlan, InitializedSubscriptionProduct, Product, ProductId, SubscriptionPlan, SubscriptionPlanId } from "./products.js";
import { assert } from "./utils.js";
import { is_user_subscribed_to } from "./subscriptions.js";

/**
 * The stripe payments class.
 */
export class Stripe {

    /** The payments type. */
    type: "stripe" = "stripe";

    /** The initialized stripe client. */
    client: StripeClient;

    /** The uninitialized products. */
    raw_products: Product[];

    /** The initialized stripe products. */
    products: InitializedProduct[] = [];

    /** Constructs the Stripe payments instance. */
    constructor(opts: {
        /** The stripe API key. */
        api_key: string;
        /** The stripe products. */
        products: Product[];
    }) {
        this.raw_products = opts.products;
        this.client = new StripeClient(opts.api_key, {
            typescript: true,
            maxNetworkRetries: 5,
        });
    }

    /**
     * Initialize the stripe class.
     */
    async initialize(): Promise<void> {

        // Initialize products.
        this.products = await initialize_products(this.client, this.raw_products);

    }

    // -------------------------------------------------------------------------
    // Users API.

    /**
     * A callback to delete a user from the payments provider when the user is deleted from our system.
     */
    async delete_user(uid: string): Promise<void> {
        await delete_stripe_customer(this.client, uid);
    }

    /**
     * Get the stripe customer id for a given user id (uid).
     * @returns The stripe customer id, or `undefined` if no customer exists for the uid.
     */
    async get_stripe_customer_id(uid: string): Promise<string | undefined> {
        const customer_id = await find_stripe_customer_id(this.client, uid);
        return customer_id ?? undefined;
    }

    /**
     * Get the stripe customer id for a given user id (uid), if a customer does
     * not exist, it is automatically created and the new customer id is returned.
     * @returns The stripe customer id.
     */
    async ensure_stripe_customer(uid: string): Promise<string> {
        return await ensure_stripe_customer(this.client, uid);
    }

    // -------------------------------------------------------------------------
    // Products API.

    /**
     * Fetch an initialized product by its id.
     * @throws {InternalStripeError} When the product is not found.
     */
    get_product(product_id: ProductId): InitializedProduct {
        const product = this.products.find((p) => p.id === product_id);
        assert(product, "invalid_product", `Product with id '${product_id}' not found.`, { product_id });
        return product;
    }

    /**
     * Fetch an initialized subscription or subscription plan by its id.
     * @throws {InternalStripeError} When the product is not found.
     */
    get_subscription_or_plan(product_or_plan_id: ProductId | SubscriptionPlanId): InitializedSubscriptionProduct | InitializedSubscriptionPlan {
        for (const product of this.products) {
            if (product.type !== "subscription") {
                continue;
            }
            if (product.id === product_or_plan_id) {
                return product;
            }
            if (product.type === "subscription") {
                const plan = product.plans.find((p) => p.id === product_or_plan_id);
                if (plan) {
                    return product;
                }
            }
        }
        assert(false, "invalid_product", `Product or subscription plan with id '${product_or_plan_id}' not found.`, { product_id: product_or_plan_id });
    }

    /**
     * Get a one-time product by its id.
     * @throws {InternalStripeError} When the product is not found or is not a one-time product.
     */
    get_one_time_product(product_id: ProductId): InitializedOneTimeProduct {
        const product = this.get_product(product_id);
        assert(product.type === "one_time", "invalid_product", `Product with id '${product_id}' is not a one-time product.`, { product_id, product_type: product.type });
        return product;
    }

    /**
     * Get a subscription product by its id.
     * @throws {InternalStripeError} When the product is not found or is not a subscription product.
     */
    get_subscription_product(product_id: ProductId): InitializedSubscriptionProduct {
        const product = this.get_product(product_id);
        assert(product.type === "subscription", "invalid_product", `Product with id '${product_id}' is not a subscription product.`, { product_id, product_type: product.type });
        return product;
    }

    /**
     * Get a subscription plan by its id.
     * @throws {InternalStripeError} When the plan is not found.
     */
    get_subscription_plan(plan_id: SubscriptionPlanId): InitializedSubscriptionPlan {
        for (const product of this.products) {
            if (product.type !== "subscription") {
                continue;
            }
            const plan = product.plans.find((p) => p.id === plan_id);
            if (plan) {
                return plan;
            }
        }
        assert(false, "invalid_product", `Subscription plan with id '${plan_id}' not found.`, { plan_id });
    }

    /**
     * Resolve a subscription plan to its parent subscription product.
     * @throws {InternalStripeError} When the plan or parent subscription is not found.
     */
    get_subscription_product_by_plan(plan: SubscriptionPlanId | SubscriptionPlan): InitializedSubscriptionProduct {
        const plan_id = typeof plan === "string" ? plan : plan.id;
        for (const product of this.products) {
            if (product.type !== "subscription") {
                continue;
            }
            const found_plan = product.plans.find((p) => p.id === plan_id);
            if (found_plan) {
                return product;
            }
        }
        assert(false, "invalid_product", `Subscription plan with id '${plan_id}' not found.`, { plan_id });
    }

    /**
     * Get a meter product by its id.
     * @throws {InternalStripeError} When the product is not found or is not a meter product.
     */
    get_meter_product(product_id: ProductId): InitializedMeterProduct {
        const product = this.get_product(product_id);
        assert(product.type === "meter", "invalid_product", `Product with id '${product_id}' is not a meter product.`, { product_id, product_type: product.type });
        return product;
    }

    // -------------------------------------------------------------------------
    // Subscriptions API.

    /**
     * Check if a user is subscribed to a subscription (plan).
     */
    async is_user_subscribed(uid: string, opts: {
        /** The user id */
        uid: string;
        /** The subcription (plan) or its id to check. */
        plan:
            | InitializedSubscriptionPlan
            | SubscriptionPlanId
            | InitializedSubscriptionProduct
            | ProductId;
        /** The user's customer id, can be provided for optimization. */
        customer_id?: string;
    }): Promise<boolean> {
        return await is_user_subscribed_to(this.client, {
            uid: opts.uid,
            plan: typeof opts.plan === "string"
                ? this.get_subscription_or_plan(opts.plan)
                : opts.plan,
            customer_id: opts.customer_id,
            all_products: this.products,
        });
    }
    
}