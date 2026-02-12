/**
 * @author Daan van den Bergh
 * @copyright © 2026 - 2026 Daan van den Bergh. All rights reserved
 *
 * Persistent shopping cart for Stripe checkout (frontend).
 *
 * - Stores product ids and/or subscription plan ids (strings).
 * - Persists across reloads using localStorage.
 */
import { create_checkout_session, create_checkout_session_id } from "./payments";
/**
 * Shopping cart module for Stripe checkout, managing product ids and subscription plan ids with quantities.
 */
export var Cart;
(function (Cart) {
    // ------------------------------------------------------------
    // Types.
    /** Nested types for the {@link PersistedCart} type. */
    let PersistedCart;
    (function (PersistedCart) {
        /** Type guard. */
        function is(value) {
            if (!value || typeof value !== "object" || Array.isArray(value)) {
                return false;
            }
            const record = value;
            const version = record["version"];
            const items = record["items"];
            if (version !== Cart.version || !Array.isArray(items)) {
                return false;
            }
            for (const item of items) {
                if (!Cart.CartItem.is(item)) {
                    return false;
                }
            }
            return true;
        }
        PersistedCart.is = is;
    })(PersistedCart = Cart.PersistedCart || (Cart.PersistedCart = {}));
    /** Nested types for the {@link CartItem} type. */
    let CartItem;
    (function (CartItem) {
        /** Type guard. */
        function is(value) {
            if (!value || typeof value !== "object" || Array.isArray(value)) {
                return false;
            }
            const record = value;
            return (typeof record.product_id === "string" &&
                typeof record.quantity === "number" && Number.isInteger(record.quantity) && record.quantity >= 1);
        }
        CartItem.is = is;
    })(CartItem = Cart.CartItem || (Cart.CartItem = {}));
    // ------------------------------------------------------------
    // Attributes.
    /** Storage key used for persistence. */
    const storage_key = "Volt.Stripe.Cart";
    /** The cart storage version. */
    Cart.version = 1;
    /** Cached items in memory for fast access. */
    Cart.items = load();
    /** The checkout session id. */
    let checkout_session_id;
    // ------------------------------------------------------------
    // Public API.
    /**
     * Add an item to the cart (or increment quantity if it already exists).
     * @param product_id The product id or subscription plan id.
     * @param quantity Quantity to add (defaults to 1).
     */
    async function add(product_id, quantity = 1) {
        validate_quantity(quantity);
        // Merge with existing line item if present.
        const existing_index = Cart.items.findIndex((item) => item.product_id === product_id);
        if (existing_index >= 0) {
            const existing_item = Cart.items[existing_index];
            if (!existing_item) {
                throw new Error("cart_corrupted_state");
            }
            const next_quantity = existing_item.quantity + quantity;
            if (!Number.isSafeInteger(next_quantity) || next_quantity < 1) {
                throw new Error("cart_invalid_quantity");
            }
            Cart.items = Cart.items.map((item, index) => {
                if (index !== existing_index) {
                    return item;
                }
                return { product_id: item.product_id, quantity: next_quantity };
            });
        }
        else {
            Cart.items = [...Cart.items, { product_id: product_id, quantity: quantity }];
        }
        persist();
        await ensure_session_id();
    }
    Cart.add = add;
    /**
     * Set an absolute quantity for an item.
     * If the item doesn't exist yet, it will be added.
     * @param product_id The product id or subscription plan id.
     * @param quantity The absolute quantity (>= 1).
     */
    async function set_quantity(product_id, quantity) {
        validate_quantity(quantity);
        const existing_index = Cart.items.findIndex((item) => item.product_id === product_id);
        // If missing, treat as add (common UX).
        if (existing_index < 0) {
            Cart.items = [...Cart.items, { product_id: product_id, quantity }];
        }
        else {
            Cart.items = Cart.items.map((item, index) => {
                if (index !== existing_index) {
                    return item;
                }
                return { product_id: item.product_id, quantity };
            });
        }
        persist();
        await ensure_session_id();
    }
    Cart.set_quantity = set_quantity;
    /**
     * Remove an item entirely from the cart.
     * @param product_id The product id or subscription plan id.
     */
    function remove(product_id) {
        Cart.items = Cart.items.filter((item) => item.product_id !== product_id);
        persist();
    }
    Cart.remove = remove;
    /**
     * Clear the cart.
     */
    function clear() {
        Cart.items = [];
        persist();
        checkout_session_id = undefined;
    }
    Cart.clear = clear;
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
    async function checkout(opts) {
        // Validate + normalize URLs up-front so we never send dangerous redirects to the backend.
        const normalized_success_url = to_absolute_https_url(opts.success_url, "success_url");
        const normalized_cancel_url = to_absolute_https_url(opts.cancel_url, "cancel_url");
        // Fail fast on empty carts (avoid creating sessions we cannot complete).
        if (Cart.items.length === 0) {
            throw new Error("Checkout cart is empty. Please add an item to the cart first.");
        }
        else if (Cart.items.length > 50) {
            throw new Error("Checkout cart cannot have more than 50 items. Please reduce the number of items in the cart.");
        }
        // If no session id, throw error, should not happen.
        if (!checkout_session_id) {
            throw new Error("Checkout session id is missing. Please add an item to the cart first.");
        }
        // Create a checkout session on the backend (Stripe Tax + pricing logic is server-owned).
        const checkout_res = await create_checkout_session({
            session_id: checkout_session_id,
            line_items: Cart.items.map((item) => ({ product: item.product_id, quantity: item.quantity })),
            success_url: normalized_success_url,
            cancel_url: normalized_cancel_url,
            tax_id_collection_enabled: opts.tax_id_collection_enabled === true,
        });
        if ("error" in checkout_res && checkout_res.error) {
            throw new Error(checkout_res.error.message || "checkout_failed_to_create_session");
        }
        // Backend returns: { id, url, mode, currency }
        const checkout_url = checkout_res.data.url;
        if (!is_non_empty_string(checkout_url)) {
            throw new Error("Checkout session creation failed: invalid URL returned from backend.");
        }
        // Ensure the returned URL is a safe absolute https URL before redirecting.
        // Stripe-hosted URLs are https; if anything else, treat it as compromised/untrusted.
        assert_is_https_absolute_url(checkout_url, "checkout_url");
        // Optionally clear cart before redirect (default true).
        // This avoids “duplicate checkout” confusion if the user comes back.
        if (opts.clear_cart_on_redirect !== false) {
            Cart.clear();
        }
        // Step 3) Redirect to Stripe hosted Checkout.
        // Stripe docs: Redirect to Checkout: https://docs.stripe.com/payments/checkout/how-checkout-works
        window.location.assign(checkout_url);
        return {
            checkout_session_id,
            checkout_url,
        };
    }
    Cart.checkout = checkout;
    // ------------------------------------------------------------
    // Internal utilities.
    /**
     * Normalize and validate a quantity.
     * @param quantity The raw quantity.
     */
    function validate_quantity(quantity) {
        if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1) {
            throw new Error("cart_invalid_quantity");
        }
    }
    /**
     * Load items from localStorage, validating shape strictly.
     */
    function load() {
        // localStorage access can throw in some environments; fail closed to empty cart.
        let raw = null;
        try {
            raw = localStorage.getItem(storage_key);
        }
        catch {
            return [];
        }
        if (Cart.PersistedCart.is(raw)) {
            return raw.items;
        }
        return [];
    }
    /**
     * Persist current items to localStorage using a versioned schema.
     */
    function persist() {
        const payload = {
            version: Cart.version,
            items: Cart.items.map((item) => ({ product_id: item.product_id, quantity: item.quantity })),
        };
        // Persistence must never crash the UI; ignore storage failures.
        try {
            localStorage.setItem(storage_key, JSON.stringify(payload));
        }
        catch {
            // Ignore (quota exceeded, blocked storage, etc.).
        }
    }
    /**
     * Ensure a checkout session id exists by creating one if needed.
     */
    async function ensure_session_id() {
        if (checkout_session_id) {
            return;
        }
        const res = await create_checkout_session_id(undefined);
        if ("error" in res && res.error) {
            throw new Error(`Failed to create a checkout session id: ${res.error.message}`);
        }
        checkout_session_id = res.data.session_id;
    }
    /**
     * Normalize a user-provided URL to an absolute https URL.
     *
     * Supports:
     * - absolute https URLs (kept as-is)
     * - relative paths (resolved against the current origin, forced to https if origin is https)
     *
     * @throws {Error} When the URL is invalid or not https.
     */
    function to_absolute_https_url(raw, field) {
        if (!is_non_empty_string(raw)) {
            throw new Error(`checkout_missing_${field}`);
        }
        // If it's already absolute, validate directly.
        const trimmed = raw.trim();
        if (looks_like_absolute_url(trimmed)) {
            assert_is_https_absolute_url(trimmed, field);
            return trimmed;
        }
        // Treat as a relative path and resolve against the current origin.
        // This avoids accidental open redirects and keeps the API simple for callers.
        const origin = window.location.origin;
        // If your app is served over https (production), this yields https URLs.
        // If served over http (local dev), this yields http URLs and will be rejected below
        // to match the backend's `https` enforcement for redirects.
        const resolved = new URL(trimmed, origin).toString();
        assert_is_https_absolute_url(resolved, field);
        return resolved;
    }
    /**
     * Assert that a string is a valid absolute https URL.
     *
     * @throws {Error} When invalid or not https.
     */
    function assert_is_https_absolute_url(raw, field) {
        // Use URL parser for correctness.
        let parsed;
        try {
            parsed = new URL(raw);
        }
        catch {
            throw new Error(`checkout_invalid_${field}`);
        }
        // Fail closed: only allow https redirects to reduce risk.
        if (parsed.protocol !== "https:") {
            throw new Error(`checkout_${field}_must_be_https`);
        }
    }
    /**
     * Check if a string looks like an absolute URL (scheme://...).
     */
    function looks_like_absolute_url(value) {
        // Minimal scheme check; final validation is done by `new URL(...)`.
        return value.includes("://");
    }
    /**
     * Check that a value is a non-empty string.
     */
    function is_non_empty_string(value) {
        return typeof value === "string" && value.trim().length > 0;
    }
})(Cart || (Cart = {}));
/** Snake case compatibility. */
export { Cart as cart };
