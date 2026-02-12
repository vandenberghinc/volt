/**
 * @author Daan van den Bergh
 * @copyright © 2026 - 2026 Daan van den Bergh. All rights reserved
 */

import { ExternalError, InternalError } from "../../errors/internal_external.js";

/** The available stripe error code. */
export type StripeErrorCode = (
    /** An error code indicating an invalid uid for Stripe customer mapping. */
    | "invalid_uid"
    /** An error code indicating a failure to delete a Stripe customer. */
    | "customer_delete_error"
    /** An error code indicating a Stripe customer was not found. */
    | "customer_not_found"
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
    /** An error code indicating the user is already subscribed to the plan. */
    | "checkout_already_subscribed"
    /** An error code indicating a subscription is not active and can not be billed. */
    | "subscription_not_active"
    /** An error code indicating a failure during subscription creation. */
    | "subscription_create_error"
    /** An error code indicating a subscription payment action is required. */
    | "subscription_payment_action_required"
    /** An error code indicating a missing payment method. */
    | "payment_method_missing"
    /** An error code indicating a subscription resolution error */
    | "subscription_resolution_error"
    /** An error code indicating a missing webhook endpoint secret. */
    | "webhook_endpoint_secret_missing"
    /** An error code indicating a failure to load webhook endpoint configuration. */
    | "webhook_endpoint_load_error"
    /** An error code indicating a mismatch between the webhook event's app id and the expected app id. */
    | "webhook_endpoint_app_id_mismatch"

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