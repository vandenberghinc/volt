/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh.
 */

import { Status } from "../status.js";
import type { Stream } from "../stream.js";

/**
 * The base class for internal and external errors.
 */
class BaseError extends Error {
    public type: string;
    public status: number;
    public data?: any[] | Record<string, any>;
    public invalid_fields: Record<string, string>;
    constructor({ type = "BaseError", message, status, data, invalid_fields, cause }: {
        message: string,
        type?: string,
        status?: number,
        data?: any[] | Record<string, any>,
        invalid_fields?: Record<string, string>,
        cause?: unknown
    }) {
        super(message);
        this.name = "BaseError";
        this.type = type;
        this.status = status ?? Status.internal_server_error;
        this.data = data;
        this.invalid_fields = invalid_fields ?? {};
        this.cause = cause;
    }
    serve(stream: Stream) {
        stream.error({
            status: this.status ?? Status.internal_server_error, 
            headers: {"Content-Type": "application/json"},
            message: this.message, 
            type: this.type,
            invalid_fields: this.invalid_fields,
        });
        return this;
    }
}

/**
 * Thrown internal errors are not presented to the user, isntead an internal server error message is shown.
 */
export class InternalError extends BaseError {
    constructor(args: ConstructorParameters<typeof BaseError>[0]) {
        args.type ??= "InternalError";
        super(args);
        this.name = "InternalError";
    }
    serve(stream: Stream) {
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
 * Thrown external errors are presented to the user.
 */
export class ExternalError extends BaseError {
    constructor(args: ConstructorParameters<typeof BaseError>[0]) {
        args.type ??= "ExternalError";
        super(args);
        this.name = "ExternalError";
    }
    serve(stream: Stream) {
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

