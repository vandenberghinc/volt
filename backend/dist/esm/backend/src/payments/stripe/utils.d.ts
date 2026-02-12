/**
 * @author Daan van den Bergh
 * @copyright © 2026 - 2026 Daan van den Bergh. All rights reserved
 */
import { StripeErrorCode } from "./error.js";
/**
 * Wrap a Stripe API call to consistently attach safe context and preserve cause.
 */
export declare function stripe_api_call<T>(fn: () => Promise<T>, context: Record<string, unknown>): Promise<T>;
/**
 * Ensure a condition is true, otherwise throw a typed InternalStripeError.
 * Throwing internal errors not presented to the user.
 */
export declare function assert(condition: unknown, error_code: StripeErrorCode, message: string, context?: Record<string, unknown>, cause?: unknown): asserts condition;
/**
 * Ensure a condition is true, otherwise throw a typed ExternalStripeError.
 * Throwing external errors presented to the user.
 */
export declare function public_assert(condition: unknown, error_code: StripeErrorCode, message: string, context?: Record<string, unknown>, cause?: unknown): asserts condition;
/**
 * Exhaustive check helper for discriminated unions.
 * Throwing internal errors not presented to the user.
 */
export declare function assert_never(value: never, message: string): never;
/**
 * Exhaustive check helper for discriminated unions.
 * Throwing external errors presented to the user.
 */
export declare function public_assert_never(value: never, message: string): never;
/**
 * Type-guard: checks whether a value is a non-empty string.
 */
export declare function is_non_empty_string(value: unknown): value is string;
/**
 * Generate a random Stripe idempotency key.
 *
 * Stripe suggests using a UUID v4 as idempotency keys are best treated as opaque unique tokens.
 * Stripe docs: https://docs.stripe.com/api/idempotent_requests
 *
 * @param prefix A string prefix for observability and to avoid collisions with other idempotency domains in logs.
 *               This is still suffixed with a `_${randomUUID()}`.
 */
export declare function generate_random_idempotency_key(prefix: string, max_length?: number): string;
/**
 * Generate a stable idempotency key by hashing a seed string if it exceeds the max length.
 * This is useful when you want idempotency based on a natural key that may be too long for Stripe's limits.
 * The seed should be unique for each distinct operation you want to dedupe.
 */
export declare function stable_idempotency_key(seed: string, max_length?: number): string;
/**
 * Convert a Date into a unix timestamp (seconds).
 */
export declare function to_unix_seconds(date: Date): number;
/**
 * Compute the first day of the next month at 00:00:00 UTC.
 *
 * This is used for subscription billing anchors like "first_of_month".
 */
export declare function first_day_of_next_month_utc(now: Date): Date;
/**
 * Add N days to a date using UTC fields to avoid DST/local-time surprises.
 */
export declare function add_days_utc(date: Date, days: number): Date;
