import type { Stream } from "./stream.js";
/**
 * The base class for internal and external errors.
 */
declare class BaseError extends Error {
    type: string;
    status: number;
    data?: any[] | Record<string, any>;
    invalid_fields: Record<string, string>;
    constructor({ type, message, status, data, invalid_fields }: {
        type?: string;
        message: string;
        status?: number;
        data?: any;
        invalid_fields?: Record<string, string>;
    });
    serve(stream: Stream): this;
}
/**
 * Thrown external errors are presented to the user.
 */
export declare class ExternalError extends BaseError {
    constructor(args: ConstructorParameters<typeof BaseError>[0]);
    serve(stream: Stream): this;
}
/**
 * Thrown internal errors are not presented to the user, isntead an internal server error message is shown.
 */
export declare class InternalError extends BaseError {
    constructor(args: ConstructorParameters<typeof BaseError>[0]);
    serve(stream: Stream): this;
}
interface UtilsInt {
    "APIError": typeof ExternalError;
    fill_templates(data: string, templates: Record<string, any>, curly_style?: boolean): string;
    get_currency_symbol(currency: string): string | null;
    get_compiled_cache(domain: string, method: string, endpoint: string): {
        cache_path: any;
        cache_hash: any;
        cache_data: any;
    };
    set_compiled_cache(path: any, data: string, hash: string): void;
}
export declare const Utils: UtilsInt;
export { Utils as utils };
export default Utils;
