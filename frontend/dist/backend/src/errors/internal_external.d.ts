/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh.
 */
import type { Stream } from "../stream.js";
/**
 * The base class for internal and external errors.
 */
declare class BaseError extends Error {
    type: string;
    status: number;
    data?: any[] | Record<string, any>;
    invalid_fields: Record<string, string>;
    constructor({ type, message, status, data, invalid_fields, cause }: {
        message: string;
        type?: string;
        status?: number;
        data?: any[] | Record<string, any>;
        invalid_fields?: Record<string, string>;
        cause?: unknown;
    });
    serve(stream: Stream): this;
}
/**
 * Thrown internal errors are not presented to the user, isntead an internal server error message is shown.
 */
export declare class InternalError extends BaseError {
    constructor(args: ConstructorParameters<typeof BaseError>[0]);
    serve(stream: Stream): this;
}
/**
 * Thrown external errors are presented to the user.
 */
export declare class ExternalError extends BaseError {
    constructor(args: ConstructorParameters<typeof BaseError>[0]);
    serve(stream: Stream): this;
}
export {};
