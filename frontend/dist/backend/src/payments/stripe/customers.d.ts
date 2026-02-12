/**
 * @author Daan van den Bergh
 * @copyright © 2026 - 2026 Daan van den Bergh. All rights reserved
 */
import Stripe from "stripe";
/**
 * Find an existing Stripe customer id for the given `uid` using Stripe's Search API.
 * Returns `null` when no customer is found.
 * @see https://docs.stripe.com/api/customers/search
 */
export declare function find_stripe_customer_id(client: Stripe, uid: string): Promise<string | null>;
/**
 * Ensure a Stripe customer exists for the given `uid`.
 * @returns The Stripe customer ID. If a customer already exists for the `uid`, it is returned. Otherwise, a new customer is created and its ID is returned.
 */
export declare function ensure_stripe_customer(client: Stripe, uid: string): Promise<string>;
/**
 * Delete a Stripe customer by their `uid`.
 * This operation is best-effort and idempotent: if no Stripe customer exists for the `uid`, it returns without error.
 * @see https://docs.stripe.com/api/customers/delete
 */
export declare function delete_stripe_customer(client: Stripe, uid: string): Promise<void>;
/**
 * Retrieve a Stripe customer and ensure it is not deleted.
 * @throws InternalStripeError with code "customer_not_found" if the customer does not exist or is deleted.
 */
export declare function retrieve_active_customer(client: Stripe, stripe_customer_id: string, context: Record<string, unknown>): Promise<Stripe.Customer>;
