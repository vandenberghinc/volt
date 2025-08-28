import { APIError } from "../../../backend/src/stream";
import { AnyElement } from "../ui/any_element";
/** Utils module.  */
export declare namespace Utils {
    /** True if the current browser's vendor string indicates Apple (e.g., Safari on iOS/macOS). */
    export const is_apple: boolean;
    /** True if the current browser is identified via vendor as Safari/Apple (same check as {@link is_apple}). */
    export const is_safari: boolean;
    /**
     * Determine whether the provided value is a string.
     * @param value The value to check.
     * @returns Returns true if the value is a string, otherwise false.
     * @docs
     */
    export function is_string(value: any): value is string;
    /**
     * Determine whether the provided value is a finite number.
     * @param value The value to check.
     * @returns Returns true if the value is a finite number, otherwise false.
     * @docs
     */
    export function is_numeric(value: any): value is number;
    /**
     * Determine whether the provided value is an integer.
     * @param value The value to check.
     * @returns Returns true if the value is an integer, otherwise false.
     * @docs
     */
    export function is_int(value: any): value is number;
    /**
     * Determine whether the provided value is a floating-point number.
     * @param value The value to check.
     * @returns Returns true if the value is a float, otherwise false.
     * @docs
     */
    export function is_float(value: any): value is number;
    /**
     * Determine whether the provided value is a function.
     * @param value The value to check.
     * @returns Returns true if the value is a function, otherwise false.
     * @docs
     */
    export function is_func(value: any): value is Function;
    /**
     * Determine whether the provided value is an array.
     * @param value The value to check.
     * @returns Returns true if the value is an array, otherwise false.
     * @docs
     */
    export function is_array(value: any): value is Array<any>;
    /**
     * Determine whether the provided value is a non-array object.
     * @param value The value to check.
     * @returns Returns true if the value is an object and not an array, otherwise false.
     * @docs
     */
    export function is_obj(value: any): value is object;
    /**
     * Determine whether the provided number is even.
     * @param number The number to check.
     * @returns Returns true if the number is even, otherwise false.
     * @docs
     */
    export function is_even(number: number): boolean;
    /**
     * Check if the user agent is a mobile device.
     * @returns Returns true when a mobile user agent is detected.
     * @docs
     */
    export function is_mobile(): boolean;
    /**
     * Make all objects of an array or object immutable. All nested objects will also be made immutable recursively.
     * @param object The array or object to freeze.
     * @docs
     */
    export function make_immutable(object: any): any;
    /**
     * Check if an element is a direct child of an element or the parent element itself.
     * @param parent The parent element to test.
     * @param target The target element to test.
     * @docs
     */
    export function is_child(parent: any, target: any): boolean;
    /**
     * Check if an element is a recursively nested child of an element or the parent element itself.
     * @param parent The parent element to test.
     * @param target The target element to test.
     * @param stop_node A node at which to stop checking if target is a parent of the current element.
     * @docs
     */
    export function is_nested_child(parent: any, target: any, stop_node?: any): boolean;
    /**
     * Round a number to a specified number of decimal places.
     * @param value The number to round.
     * @param decimals The number of decimal places.
     * @returns The rounded number.
     * @docs
     */
    export function round(value: number, decimals: number): number;
    /**
     * Get the width of the device's viewport.
     * @returns The width of the device's viewport.
     * @docs
     */
    export function device_width(): number;
    /**
     * Get the height of the device's viewport.
     * @returns The height of the device's viewport.
     * @docs
     */
    export function device_height(): number;
    /**
     * Get the endpoint sub URL of a full domain URL. When parameter "url" is undefined, it uses the current URL.
     * @param url The full domain URL.
     * @returns The endpoint sub URL.
     * @docs
     */
    export function endpoint(url?: string | null): string;
    /**
     * Execute a function when the content is loaded, optionally handling a splash screen.
     * @param func The function to execute when the content is loaded.
     * @returns void
     * @docs
     */
    export function on_load(func: () => HTMLElement | AnyElement | Promise<HTMLElement | AnyElement> | null | undefined): Promise<void>;
    /**
     * Redirect to a specified URL, optionally forcing the redirect even if the endpoint is the same.
     * @param url The URL to redirect to.
     * @param forced Whether to force the redirect even if the current endpoint is the same as the target URL.
     * @docs
     */
    export function redirect(url: string, forced?: boolean): void;
    /**
     * Get a URL parameter by name, with an optional default value.
     * @param name The name of the URL parameter.
     * @param def The default value to return if the parameter is not found.
     * @returns The value of the URL parameter or the default value.
     * @docs
     */
    export function url_param(name: string, def?: any): any | null;
    /**
     * Encode an object into a URL-encoded query string.
     * @param params The parameters to encode.
     * @returns The URL-encoded query string.
     * @docs
     */
    export function url_encode(params: Record<string, any>): string;
    /**
     * Copy text to the clipboard.
     * @param text The text to copy.
     * @returns A Promise that resolves when the text is copied.
     * @docs
     */
    export function copy_to_clipboard(text: string): Promise<void>;
    /** The request options. */
    export interface RequestOpts<RequestBody extends RequestBodyBase = unknown> {
        method?: string;
        url?: string | null;
        data?: RequestBody;
        json?: boolean;
        credentials?: RequestCredentials;
        headers?: Record<string, string>;
    }
    /** The response data template base. */
    type ResponseBodyBase = unknown | null | undefined | number | boolean | string | any[] | Record<string, any>;
    /** The request data template base. */
    type RequestBodyBase = unknown | null | undefined | string | Record<string, any>;
    /** The returned result */
    export type RequestResult<SuccessBody extends ResponseBodyBase = unknown, ErrorBody extends ResponseBodyBase = unknown> = {
        /** The request status. */
        status: number;
    } & ({
        /** The api error from the backend {@link Stream.error}. */
        error: APIError;
        /** The error response body, always optional in case of body parsing failure. */
        data?: ErrorBody;
    } | {
        /** The success response body. */
        data: SuccessBody;
        /** No API error from the backend {@link Stream.error} was found. */
        error?: never;
    });
    /** A promise to {@link RequestResult}, for convenience. */
    export type RequestResultPromise<SuccessBody extends ResponseBodyBase = unknown, ErrorBody extends ResponseBodyBase = unknown> = Promise<RequestResult<SuccessBody, ErrorBody>>;
    /** Request with success body. */
    export function request<SuccessBody extends ResponseBodyBase>(options: RequestOpts<unknown>): Promise<RequestResult<SuccessBody, unknown>>;
    /** Request with success body & request body generics. */
    export function request<SuccessBody extends ResponseBodyBase, RequestBody extends RequestBodyBase>(options: RequestOpts<RequestBody>): Promise<RequestResult<SuccessBody, unknown>>;
    /** Request with success body, error body & request body generics. */
    export function request<SuccessBody extends ResponseBodyBase, ErrorBody extends ResponseBodyBase, RequestBody extends RequestBodyBase>(options: RequestOpts<RequestBody>): Promise<RequestResult<SuccessBody, ErrorBody>>;
    /**
     * Create a debounced version of a function that delays invoking it until after a specified delay.
     * @param delay The number of milliseconds to delay.
     * @param func The function to debounce.
     * @returns The debounced function.
     * @docs
     */
    export function debounce(delay: number, func: (...args: any[]) => void): (...args: any[]) => void;
    /**
     * @deprecated Use vlib.VDate instead.
     * Convert a Unix timestamp in seconds or milliseconds to the user's date format.
     * @param unix The Unix timestamp.
     * @param mseconds Optional. Whether the Unix timestamp is in milliseconds.
     * @returns The formatted date string.
     * @docs
     */
    export function unix_to_date(unix: number, mseconds?: boolean | null): string;
    export {};
}
export { Utils as utils };
