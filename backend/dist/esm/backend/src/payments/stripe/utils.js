/**
 * @author Daan van den Bergh
 * @copyright © 2026 - 2026 Daan van den Bergh. All rights reserved
 */
import { createHash, randomUUID } from "node:crypto";
import { ExternalStripeError, InternalStripeError } from "./error.js";
/**
 * Wrap a Stripe API call to consistently attach safe context and preserve cause.
 */
export async function stripe_api_call(fn, context) {
    try {
        return await fn();
    }
    catch (error) {
        if (error instanceof ExternalStripeError || error instanceof InternalStripeError) {
            throw error;
        }
        throw new InternalStripeError("api_error", "Stripe API request failed.", context, error);
    }
}
/**
 * Ensure a condition is true, otherwise throw a typed InternalStripeError.
 * Throwing internal errors not presented to the user.
 */
export function assert(condition, error_code, message, context, cause) {
    if (!condition) {
        const normalized_message = message.endsWith(".") ? message : `${message}.`;
        throw new InternalStripeError(error_code, normalized_message, context, cause);
    }
}
/**
 * Ensure a condition is true, otherwise throw a typed ExternalStripeError.
 * Throwing external errors presented to the user.
 */
export function public_assert(condition, error_code, message, context, cause) {
    if (!condition) {
        const normalized_message = message.endsWith(".") ? message : `${message}.`;
        throw new ExternalStripeError(error_code, normalized_message, context, cause);
    }
}
/**
 * Exhaustive check helper for discriminated unions.
 * Throwing internal errors not presented to the user.
 */
export function assert_never(value, message) {
    throw new InternalStripeError("invalid_argument", message, { value });
}
/**
 * Exhaustive check helper for discriminated unions.
 * Throwing external errors presented to the user.
 */
export function public_assert_never(value, message) {
    throw new ExternalStripeError("invalid_argument", message, { value });
}
/**
 * Type-guard: checks whether a value is a non-empty string.
 */
export function is_non_empty_string(value) {
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
export function generate_random_idempotency_key(prefix, max_length = 255) {
    if (!Number.isInteger(max_length) || max_length < 1 || max_length > 255) {
        throw new Error(`generate_random_idempotency_key: max_length must be an integer between 1 and 255 (got ${max_length})`);
    }
    const p = prefix.trim();
    if (p.length === 0) {
        throw new Error("generate_random_idempotency_key: prefix must be non-empty");
    }
    const key = `${p}_${randomUUID()}`;
    if (key.length > max_length) {
        const digest = createHash("sha256").update(key).digest("hex");
        return digest.slice(0, Math.min(max_length, digest.length));
    }
    return key;
}
/**
 * Generate a stable idempotency key by hashing a seed string if it exceeds the max length.
 * This is useful when you want idempotency based on a natural key that may be too long for Stripe's limits.
 * The seed should be unique for each distinct operation you want to dedupe.
 */
export function stable_idempotency_key(seed, max_length = 255) {
    assert(Number.isInteger(max_length) && max_length >= 1 && max_length <= 255, "invalid_argument", "Idempotency max_length must be an integer between 1 and 255.", { max_length });
    const s = seed.trim();
    assert(s.length > 0, "invalid_argument", "Idempotency seed must be non-empty.", {});
    if (s.length <= max_length)
        return s;
    // Deterministic truncation via hash.
    const digest = createHash("sha256").update(s).digest("hex"); // 64 chars
    // Respect max_length even if caller sets it < 64.
    // (Stripe max is 255, but we keep this function correct for any valid max_length.)
    return digest.slice(0, Math.min(max_length, digest.length));
}
/**
 * Convert a Date into a unix timestamp (seconds).
 */
export function to_unix_seconds(date) {
    // Stripe APIs typically use unix timestamps in seconds.
    return Math.floor(date.getTime() / 1000);
}
/**
 * Compute the first day of the next month at 00:00:00 UTC.
 *
 * This is used for subscription billing anchors like "first_of_month".
 */
export function first_day_of_next_month_utc(now) {
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    // Move to the first day of the next month in UTC.
    // Date constructor with UTC fields avoids local timezone surprises.
    return new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0));
}
/**
 * Add N days to a date using UTC fields to avoid DST/local-time surprises.
 */
export function add_days_utc(date, days) {
    // Defensive validation: caller-side bugs should never cause silent time drift.
    assert(Number.isInteger(days), "invalid_argument", "Days must be an integer.", { days });
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    return new Date(Date.UTC(year, month, day + days, date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds()));
}
