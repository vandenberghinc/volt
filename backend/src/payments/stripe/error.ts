/**
 * @author Daan van den Bergh
 * @copyright © 2026 - 2026 Daan van den Bergh. All rights reserved
 */

import { ExternalError, InternalError } from "src/errors/internal_external.js";

/** The available stripe error code. */
export type StripeErrorCode = (
    /** An error code indicating a generic failure. */
    | "generic_error"
    /** An error code indicating a failure to create a Stripe customer. */
    | "customer_create_error"
    /** An error code indicating a failure to find a Stripe customer. */
    | "customer_not_found"
    /** An error code indicating a failure to delete a Stripe customer. */
    | "customer_delete_failed"
    | "customer_delete_error"
    /** An error code indicating a failure to search for a Stripe customer. */
    | "customer_search_error"
    /** Invalid argument error code. */
    | "invalid_argument"
    /** Error code for an invalid product. */
    | "invalid_product"
    /** An error code indicating a generic Stripe API failure. */
    | "api_error"
    /** An error code indicating a failure during checkout session creation. */
    | "checkout_create_error"
    /** An error code indicating an invalid product reference during checkout session creation. */
    | "checkout_invalid_product_ref"
    /** An error code indicating a mixed currency error during checkout session creation. */        
    | "checkout_mixed_currency"
    /** An error code indicating an ambiguous subscription plan reference during checkout session creation. */
    | "checkout_subscription_plan_ambiguous"
    /** An error code indicating an invalid quantity during checkout session creation. */
    | "checkout_invalid_quantity"
    /** An error code indicating an invalid mode during checkout session creation. */
    | "checkout_invalid_mode"
);


/**
 * Custom error class to attach safe context while preserving the original cause.
 * Internal errors thrown in REST API calls will be presented to the user as
 * a generic internal server errog. Therefore the code, message and context
 * are never shown to the user.
 */
export class InternalStripeError extends InternalError {
    /** Stable error code for programmatic handling (never include secrets). */
    public readonly error_code: StripeErrorCode;

    /** Optional safe context for debugging (never include secrets). */
    public readonly context?: Record<string, unknown>;

    /** Constructs a StripeWrapperError. */
    public constructor(
        code: StripeErrorCode,
        message: string,
        context?: Record<string, unknown>,
        cause?: unknown,
    ) {
        super({
            message,
            type: code,
            cause,
        });
        this.name = "StripeError";
        this.error_code = code;
        this.context = context;
        this.cause = cause;
    }
}

/**
 * Custom error class to attach safe context while preserving the original cause.
 * External errors thrown in REST API calls will be presented to the user with the message and code,
 * but context is never shown to the user.
 */
export class ExternalStripeError extends ExternalError {
    /** Stable error code for programmatic handling (never include secrets). */
    public readonly error_code: StripeErrorCode;

    /** Optional safe context for debugging (never include secrets). */
    public readonly context?: Record<string, unknown>;

    /** Constructs a StripeWrapperError. */
    public constructor(
        code: StripeErrorCode,
        message: string,
        context?: Record<string, unknown>,
        cause?: unknown,
    ) {
        super({
            message,
            type: code,
            cause,
        });
        this.name = "StripeError";
        this.error_code = code;
        this.context = context;
    }
}