/**
 * @author Daan van den Bergh
 * @copyright © 2026 - 2026 Daan van den Bergh. All rights reserved
 */
import { ExternalError, InternalError } from "../../errors/internal_external.js";
/**
 * Custom error class to attach safe context while preserving the original cause.
 * Internal errors thrown in REST API calls will be presented to the user as
 * a generic internal server errog. Therefore the code, message and context
 * are never shown to the user.
 */
export class InternalStripeError extends InternalError {
    /** Stable error code for programmatic handling (never include secrets). */
    error_code;
    /** Optional safe context for debugging (never include secrets). */
    context;
    /** Constructs a StripeWrapperError. */
    constructor(code, message, context, cause) {
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
    error_code;
    /** Optional safe context for debugging (never include secrets). */
    context;
    /** Constructs a StripeWrapperError. */
    constructor(code, message, context, cause) {
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
