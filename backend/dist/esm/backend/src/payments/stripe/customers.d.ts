/**
 * @author Daan van den Bergh
 * @copyright © 2026 - 2026 Daan van den Bergh. All rights reserved
 */
import Stripe from "stripe";
import { Server } from "../../server.js";
/**
 * Ensure a Stripe customer exists for the given `uid`.
 * @returns The Stripe customer ID. If a customer already exists for the `uid`, it is returned. Otherwise, a new customer is created and its ID is returned.
 */
export declare function ensure_stripe_customer(client: Stripe, server: Server, uid: string): Promise<string>;
/**
 * Delete a Stripe customer by their `uid`.
 * This operation is best-effort and idempotent: if no Stripe customer exists for the `uid`, it returns without error.
 * @see https://docs.stripe.com/api/customers/delete
 */
export declare function delete_stripe_customer(client: Stripe, server: Server, uid: string): Promise<void>;
