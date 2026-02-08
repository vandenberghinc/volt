/**
 * @author Daan van den Bergh
 * @copyright © 2026 - 2026 Daan van den Bergh. All rights reserved
 */

import { randomUUID } from "node:crypto";
import { ExternalStripeError, InternalStripeError, StripeErrorCode } from "./error.js";

/**
 * Wrap a Stripe API call to consistently attach safe context and preserve cause.
 */
export async function stripe_api_call<T>(
    fn: () => Promise<T>,
    context: Record<string, unknown>,
): Promise<T> {
    try {
        return await fn();
    } catch (error: unknown) {
        throw new InternalStripeError(
            "api_error",
            "Stripe API request failed.",
            context,
            error,
        );
    }
}

/**
 * Ensure a condition is true, otherwise throw a typed InternalStripeError.
 * Throwing internal errors not presented to the user.
 */
export function assert(
    condition: unknown,
    error_code: StripeErrorCode,
    message: string,
    context?: Record<string, unknown>,
    cause?: unknown,
): asserts condition {
    if (!condition) {
        const normalized_message = message.endsWith(".") ? message : `${message}.`;
        throw new InternalStripeError(error_code, normalized_message, context, cause);
    }
}

/**
 * Ensure a condition is true, otherwise throw a typed ExternalStripeError.
 * Throwing external errors presented to the user.
 */
export function public_assert(
    condition: unknown,
    error_code: StripeErrorCode,
    message: string,
    context?: Record<string, unknown>,
    cause?: unknown,
): asserts condition {
    if (!condition) {
        const normalized_message = message.endsWith(".") ? message : `${message}.`;
        throw new ExternalStripeError(error_code, normalized_message, context, cause);
    }
}

/**
 * Exhaustive check helper for discriminated unions.
 * Throwing internal errors not presented to the user.
 */
export function assert_never(value: never, message: string): never {
    throw new InternalStripeError("invalid_argument", message, { value });
}

/**
 * Exhaustive check helper for discriminated unions.
 * Throwing external errors presented to the user.
 */
export function public_assert_never(value: never, message: string): never {
    throw new ExternalStripeError("invalid_argument", message, { value });
}

/**
 * Type-guard: checks whether a value is a non-empty string.
 */
export function is_non_empty_string(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

/**
 * Generate a random Stripe idempotency key.
 *
 * Stripe suggests using a UUID v4 as idempotency keys are best treated as opaque unique tokens.
 * Stripe docs: https://docs.stripe.com/api/idempotent_requests
 * 
 * @param prefix A string prefix for observability and to avoid collisions with other idempotency domains in logs.
 *               This is still suffixed with a `_${randomUUID()}`.
 */
export function generate_random_idempotency_key(prefix: string): string {
    // We prefix for observability and to avoid collisions with other idempotency domains in logs.
    // randomUUID() is RFC 4122 v4.
    return `${prefix}_${randomUUID()}`;
}

/**
 * Convert a Date into a unix timestamp (seconds).
 */
export function to_unix_seconds(date: Date): number {
    // Stripe APIs typically use unix timestamps in seconds.
    return Math.floor(date.getTime() / 1000);
}

/**
 * Compute the first day of the next month at 00:00:00 UTC.
 *
 * This is used for subscription billing anchors like "first_of_month".
 */
export function first_day_of_next_month_utc(now: Date): Date {
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();

    // Move to the first day of the next month in UTC.
    // Date constructor with UTC fields avoids local timezone surprises.
    return new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0));
}

/**
 * Add N days to a date using UTC fields to avoid DST/local-time surprises.
 */
export function add_days_utc(date: Date, days: number): Date {
    // Defensive validation: caller-side bugs should never cause silent time drift.
    assert(Number.isInteger(days), "invalid_argument", "Days must be an integer.", { days });

    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();

    return new Date(Date.UTC(year, month, day + days, date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds()));
}