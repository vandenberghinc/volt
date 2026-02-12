/**
 * @author Daan van den Bergh
 * @copyright © 2026 - 2026 Daan van den Bergh. All rights reserved
 */
import * as vlib from "@vandenberghinc/vlib";
import { InternalStripeError } from "./error.js";
import { stable_idempotency_key, stripe_api_call } from "./utils.js";
import { Collection } from "src/database/collection.js";
/**
 * A cache for resolving Stripe customer ids from our internal user IDs (`uid`).
 */
const stripe_customer_cache = new vlib.Cache({
    max_size: 100_000,
    ttl: {
        sliding: false,
        duration: 60 * 60 * 1000, // 1 hour
    },
});
/** The Stripe customer metadata key we use to link Stripe customers to our internal users. */
const stripe_customer_uid_metadata_key = "__volt_uid";
/**
 * Escape a value for safe usage inside a Stripe Search query string.
 * @see https://docs.stripe.com/search#search-query-language
 */
function escape_stripe_search_value(value) {
    // Stripe search values are typically embedded in single quotes; escape backslashes and single quotes defensively.
    // This prevents query breaking and reduces risk of accidental query injection from unexpected uid formats.
    return value
        .replaceAll("\\", "\\\\")
        .replaceAll("'", "\\'");
}
/**
 * Assert that a `uid` is valid for use in Stripe customer mapping.
 */
function assert_uid(uid) {
    if (typeof uid !== "string" || uid.length < 16 || uid.length > 128) {
        throw new InternalStripeError("invalid_uid", "Invalid uid for Stripe customer mapping.", { uid_length: typeof uid === "string" ? uid.length : null });
    }
    // Fail closed on control characters instead of normalizing (normalizing can change identity).
    if (/[\u0000-\u001F\u007F]/.test(uid)) {
        throw new InternalStripeError("invalid_uid", "uid contains control characters.", {});
    }
}
/**
 * Create the stripe customer session database collection.
 */
function create_customer_db(server) {
    // Initialize the database connection.
    return server.db.collection({
        name: "Volt.Stripe.Customers",
        indexes: [
            {
                keys: { customer_id: 1 },
                unique: true,
            },
            {
                keys: { uid: 1 },
                unique: true,
            },
        ],
        // Ensure its not unique so we retrieve the cached collection if already created.
        unique: false,
    });
}
/**
 * Find an existing Stripe customer id for the given `uid` using Stripe's Search API.
 * Returns `null` when no customer is found.
 * @see https://docs.stripe.com/api/customers/search
 */
async function find_stripe_customer_id(client, uid) {
    assert_uid(uid);
    // Search by metadata so we never rely on PII like email for identity mapping.
    // Docs: https://docs.stripe.com/api/customers/search
    const escaped_uid = escape_stripe_search_value(uid);
    const query = `metadata['${stripe_customer_uid_metadata_key}']:'${escaped_uid}'`;
    const search_result = await stripe_api_call(() => client.customers.search({
        query,
        limit: 1,
    }), { uid, query });
    const customer = search_result.data[0];
    if (!customer) {
        return null;
    }
    return customer.id;
}
// ----------------------------------------------------------------------------
// Public API.
/**
 * Ensure a Stripe customer exists for the given `uid`.
 * @returns The Stripe customer ID. If a customer already exists for the `uid`, it is returned. Otherwise, a new customer is created and its ID is returned.
 */
export async function ensure_stripe_customer(client, server, uid) {
    assert_uid(uid);
    // Check cache first.
    const cached_customer_id = stripe_customer_cache.get(uid);
    if (cached_customer_id) {
        return cached_customer_id;
    }
    // Create collection.
    const db = create_customer_db(server);
    // The fetched customer id.
    let customer_id;
    // Attempt to load from database.
    const record = await db.load({ uid }, {
        throw: false,
        projection: { customer_id: 1 },
        retry: 3,
    });
    // Found.
    if (!(record instanceof Error)) {
        customer_id = record.customer_id;
    }
    // Not found.
    else if (record instanceof Collection.NotFoundError) {
        // Attempt to find an existing customer by metadata (idempotent across services/processes).
        const existing_customer_id = await find_stripe_customer_id(client, uid);
        if (existing_customer_id) {
            customer_id = existing_customer_id;
        }
        // If none exists, create a new customer and store uid in metadata for future lookups.
        else {
            const created_customer = await stripe_api_call(() => client.customers.create({
                metadata: {
                    [stripe_customer_uid_metadata_key]: uid,
                },
            }, {
                // Prevent duplicates across concurrent calls / processes.
                idempotencyKey: stable_idempotency_key(`customer_create_uid:${uid}`),
            }), { uid, metadata_key: stripe_customer_uid_metadata_key });
            customer_id = created_customer.id;
        }
        // Persist to database.
        await db.set({ uid }, { customer_id }, {
            upsert: true,
            retry: 3,
        });
        // Load again in case we concurrently created the same customer in another process (should not error due to upsert, but ensures we have the correct customer_id).
        const final_record = await db.load({ uid }, {
            throw: false,
            projection: { customer_id: 1 },
            retry: 3,
        });
        if (final_record instanceof Error) {
            throw new InternalStripeError("customer_not_found", "Failed to load Stripe customer from database after creation.", { uid, cause: final_record });
        }
        customer_id = final_record.customer_id;
    }
    // Error.
    else {
        throw new InternalStripeError("customer_not_found", "Failed to load Stripe customer from database.", { uid, cause: record });
    }
    // Save to cache.
    stripe_customer_cache.set(uid, customer_id);
    return customer_id;
}
/**
 * Delete a Stripe customer by their `uid`.
 * This operation is best-effort and idempotent: if no Stripe customer exists for the `uid`, it returns without error.
 * @see https://docs.stripe.com/api/customers/delete
 */
export async function delete_stripe_customer(client, server, uid) {
    assert_uid(uid);
    // Clear cache after resolving to prevent stale ids being served.
    stripe_customer_cache.delete(uid);
    // Create collection.
    const db = create_customer_db(server);
    // Load from database.
    const record = await db.load({ uid }, {
        throw: false,
        projection: { customer_id: 1 },
    });
    // Not found, consider delete successful (idempotent semantics).
    if (record instanceof Collection.NotFoundError) {
        return;
    }
    // Error.
    else if (record instanceof Error) {
        throw new InternalStripeError("customer_not_found", "Failed to load Stripe customer from database.", { uid, cause: record });
    }
    // If no customer exists, consider the delete successful (idempotent semantics).
    if (!record.customer_id) {
        return;
    }
    // Delete customer in Stripe.
    // Docs: https://docs.stripe.com/api/customers/delete
    const deleted_customer = await stripe_api_call(() => client.customers.del(record.customer_id), { uid, customer_id: record.customer_id });
    // Stripe returns a DeletedCustomer object with `deleted: true` on success.
    if (deleted_customer.deleted !== true) {
        throw new InternalStripeError("customer_delete_error", "Stripe customer delete did not return a deleted confirmation.", { uid, customer_id: record.customer_id });
    }
    // Remove from database.
    await db.delete({ uid });
}
