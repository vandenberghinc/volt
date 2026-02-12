/**
 * @author Daan van den Bergh
 * @copyright © 2026 - 2026 Daan van den Bergh. All rights reserved
 *
 * Persistent shopping cart for Stripe checkout (frontend).
 *
 * - Stores product ids and/or subscription plan ids (strings).
 * - Persists across reloads using localStorage.
 */
/**
 * Shopping cart module for Stripe checkout, managing product ids and subscription plan ids with quantities.
 */
export declare namespace Cart {
    /**
     * Internal persisted cart schema (versioned).
     */
    interface PersistedCart {
        /** Schema version for future migrations. */
        version: number;
        /** Stored cart items. */
        items: Cart.CartItem[];
    }
    /** Nested types for the {@link PersistedCart} type. */
    namespace PersistedCart {
        /** Type guard. */
        function is(value: unknown): value is PersistedCart;
    }
    /**
     * A single cart line item (product id or subscription plan id).
     */
    interface CartItem {
        /** The product id or subscription plan id to purchase/subscribe to. */
        product_id: string;
        /** The quantity (>= 1). For subscription plans, backend enforces quantity === 1. */
        quantity: number;
    }
    /** Nested types for the {@link CartItem} type. */
    namespace CartItem {
        /** Type guard. */
        function is(value: unknown): value is CartItem;
    }
    /** The cart storage version. */
    const version: number;
    /** Cached items in memory for fast access. */
    let items: Cart.CartItem[];
    /**
     * Add an item to the cart (or increment quantity if it already exists).
     * @param product_id The product id or subscription plan id.
     * @param quantity Quantity to add (defaults to 1).
     */
    function add(product_id: string, quantity?: number): Promise<void>;
    /**
     * Set an absolute quantity for an item.
     * If the item doesn't exist yet, it will be added.
     * @param product_id The product id or subscription plan id.
     * @param quantity The absolute quantity (>= 1).
     */
    function set_quantity(product_id: string, quantity: number): Promise<void>;
    /**
     * Remove an item entirely from the cart.
     * @param product_id The product id or subscription plan id.
     */
    function remove(product_id: string): void;
    /**
     * Clear the cart.
     */
    function clear(): void;
    /**
     * Start a Stripe hosted Checkout Session for the current cart and redirect the browser.
     *
     * This function is intentionally small and opinionated:
     * - validates the cart locally (fail fast)
     * - creates a backend session id first (idempotency)
     * - creates the Stripe Checkout Session on the backend
     * - redirects to the hosted URL
     *
     * @throws {Error} When validation fails or the backend returns an error.
     */
    function checkout(opts: {
        /**
         * The success URL after payment completes.
         * You may pass an absolute https URL, or a relative path (e.g. "/billing/success").
         */
        success_url: string;
        /**
         * The cancel URL when the user cancels out of Stripe Checkout.
         * You may pass an absolute https URL, or a relative path (e.g. "/pricing").
         */
        cancel_url: string;
        /**
         * Whether to require tax ID collection in Checkout.
         * This is useful for B2B (e.g. VAT ID).
         */
        tax_id_collection_enabled?: boolean;
        /**
         * Whether to clear the cart after a successful session creation + redirect.
         * Defaults to true (safe, since checkout is now owned by Stripe).
         */
        clear_cart_on_redirect?: boolean;
    }): Promise<{
        /**
         * The Stripe Checkout Session id created on the backend.
         */
        checkout_session_id: string;
        /**
         * The Stripe hosted Checkout URL the browser will be redirected to.
         */
        checkout_url: string;
    }>;
}
/** Snake case compatibility. */
export { Cart as cart };
