/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh.
 */
import { Status } from "../status.js";
/**
 * The base class for internal and external errors.
 */
class BaseError extends Error {
    type;
    status;
    data;
    invalid_fields;
    constructor({ type = "BaseError", message, status, data, invalid_fields, cause }) {
        super(message);
        this.name = "BaseError";
        this.type = type;
        this.status = status ?? Status.internal_server_error;
        this.data = data;
        this.invalid_fields = invalid_fields ?? {};
        this.cause = cause;
    }
    serve(stream) {
        stream.error({
            status: this.status ?? Status.internal_server_error,
            headers: { "Content-Type": "application/json" },
            message: this.message,
            type: this.type,
            invalid_fields: this.invalid_fields,
        });
        return this;
    }
}
/**
 * Thrown internal errors are not presented to the user, instead an internal server error message is shown.
 *
 * @nav Errors
 * @docs
 */
export class InternalError extends BaseError {
    constructor(args) {
        args.type ??= "InternalError";
        super(args);
        this.name = "InternalError";
    }
    /**
     * Serve a generic internal server error response.
     * @docs
     */
    serve(stream) {
        stream.error({
            status: Status.internal_server_error,
            headers: { "Content-Type": "application/json" },
            message: "Internal Server Error",
            type: "InternalServerError",
        });
        return this;
    }
}
/**
 * Thrown external errors are presented to the user when caused inside a request context.
 *
 * @nav Errors
 * @docs
 */
export class ExternalError extends BaseError {
    constructor(args) {
        args.type ??= "ExternalError";
        super(args);
        this.name = "ExternalError";
    }
    /**
     * Serve the external error response.
     * @docs
     */
    serve(stream) {
        stream.error({
            status: this.status ?? Status.internal_server_error,
            headers: { "Content-Type": "application/json" },
            message: this.message,
            type: this.type,
            invalid_fields: this.invalid_fields,
        });
        return this;
    }
}
