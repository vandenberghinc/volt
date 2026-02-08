/**
 * @author Daan van den Bergh
 * @copyright © 2026 - 2026 Daan van den Bergh. All rights reserved
 */

import * as vlib from "@vandenberghinc/vlib";
import StripeClient from "stripe";
import { InternalStripeError, type StripeErrorCode } from "./error.js";
import { stripe_api_call } from "./utils.js";

/**
 * A cache for resolving Stripe customer ids from our internal user IDs (`uid`).
 */
const stripe_customer_cache = new vlib.Cache<string>({
    max_size: 10_000,
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
function escape_stripe_search_value(value: string): string {
    // Stripe search values are typically embedded in single quotes; escape backslashes and single quotes defensively.
    // This prevents query breaking and reduces risk of accidental query injection from unexpected uid formats.
    return value.replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}

/**
 * Find an existing Stripe customer id for the given `uid` using Stripe's Search API.
 * Returns `null` when no customer is found.
 * @see https://docs.stripe.com/api/customers/search
 */
export async function find_stripe_customer_id(
    client: StripeClient,
    uid: string,
): Promise<string | null> {
    // Search by metadata so we never rely on PII like email for identity mapping.
    // Docs: https://docs.stripe.com/api/customers/search
    const escaped_uid = escape_stripe_search_value(uid);
    const query = `metadata['${stripe_customer_uid_metadata_key}']:'${escaped_uid}'`;

    const search_result = await stripe_api_call(
        () => client.customers.search({
            query,
            limit: 1,
        }),
        { uid, query },
    );

    const customer = search_result.data[0];
    if (!customer) {
        return null;
    }

    return customer.id;
}

/**
 * Ensure a Stripe customer exists for the given `uid`.
 * @returns The Stripe customer ID. If a customer already exists for the `uid`, it is returned. Otherwise, a new customer is created and its ID is returned.
 */
export async function ensure_stripe_customer(
    client: StripeClient,
    uid: string,
): Promise<string> {
    // Check cache first.
    const cached_customer_id = stripe_customer_cache.get(uid);
    if (cached_customer_id) {
        return cached_customer_id;
    }

    // Attempt to find an existing customer by metadata (idempotent across services/processes).
    const existing_customer_id = await find_stripe_customer_id(client, uid);
    if (existing_customer_id) {
        // Save to cache.
        stripe_customer_cache.set(uid, existing_customer_id);
        return existing_customer_id;
    }

    // If none exists, create a new customer and store uid in metadata for future lookups.
    const created_customer = await stripe_api_call(
        () => client.customers.create({
            metadata: {
                [stripe_customer_uid_metadata_key]: uid,
            },
        }),
        { uid, metadata_key: stripe_customer_uid_metadata_key },
    );
    const created_customer_id = created_customer.id;

    // Save to cache.
    stripe_customer_cache.set(uid, created_customer_id);
    return created_customer_id;
}

/**
 * Delete a Stripe customer by their `uid`.
 * This operation is best-effort and idempotent: if no Stripe customer exists for the `uid`, it returns without error.
 * @see https://docs.stripe.com/api/customers/delete
 */
export async function delete_stripe_customer(
    client: StripeClient,
    uid: string,
): Promise<void> {
    // Delete from cache first to avoid serving stale ids in concurrent flows.
    stripe_customer_cache.delete(uid);

    // Resolve the Stripe customer id (do NOT create a customer just to delete it).
    const cached_customer_id = stripe_customer_cache.get(uid);
    const customer_id = cached_customer_id ?? (await find_stripe_customer_id(client, uid));

    // If no customer exists, consider the delete successful (idempotent semantics).
    if (!customer_id) {
        return;
    }

    // Delete customer in Stripe.
    // Docs: https://docs.stripe.com/api/customers/delete
    const deleted_customer = await stripe_api_call(
        () => client.customers.del(customer_id),
        { uid, customer_id }
    );

    // Stripe returns a DeletedCustomer object with `deleted: true` on success.
    if (deleted_customer.deleted !== true) {
        throw new InternalStripeError(
            "customer_delete_error",
            "Stripe customer delete did not return a deleted confirmation.",
            { uid, customer_id },
        );
    }
}
