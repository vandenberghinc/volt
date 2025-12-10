/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
import { AnyElement } from "../ui/any_element.js";
/** Utils module.  */
export declare namespace Utils {
    /** True if the current browser's vendor string indicates Apple (e.g., Safari on iOS/macOS). */
    const is_apple: boolean;
    /** True if the current browser is identified via vendor as Safari/Apple (same check as {@link is_apple}). */
    const is_safari: boolean;
    /**
     * Determine whether the provided value is a string.
     * @param value The value to check.
     * @returns Returns true if the value is a string, otherwise false.
     * @docs
     */
    function is_string(value: any): value is string;
    /**
     * Determine whether the provided value is a finite number.
     * @param value The value to check.
     * @returns Returns true if the value is a finite number, otherwise false.
     * @docs
     */
    function is_numeric(value: any): value is number;
    /**
     * Determine whether the provided value is an integer.
     * @param value The value to check.
     * @returns Returns true if the value is an integer, otherwise false.
     * @docs
     */
    function is_int(value: any): value is number;
    /**
     * Determine whether the provided value is a floating-point number.
     * @param value The value to check.
     * @returns Returns true if the value is a float, otherwise false.
     * @docs
     */
    function is_float(value: any): value is number;
    /**
     * Determine whether the provided value is a function.
     * @param value The value to check.
     * @returns Returns true if the value is a function, otherwise false.
     * @docs
     */
    function is_func(value: any): value is Function;
    /**
     * Determine whether the provided value is an array.
     * @param value The value to check.
     * @returns Returns true if the value is an array, otherwise false.
     * @docs
     */
    function is_array(value: any): value is Array<any>;
    /**
     * Determine whether the provided value is a non-array object.
     * @param value The value to check.
     * @returns Returns true if the value is an object and not an array, otherwise false.
     * @docs
     */
    function is_obj(value: any): value is object;
    /**
     * Determine whether the provided number is even.
     * @param number The number to check.
     * @returns Returns true if the number is even, otherwise false.
     * @docs
     */
    function is_even(number: number): boolean;
    /**
     * Check if the user agent is a mobile device.
     * @returns Returns true when a mobile user agent is detected.
     * @docs
     */
    function is_mobile(): boolean;
    /**
     * Make all objects of an array or object immutable. All nested objects will also be made immutable recursively.
     * @param object The array or object to freeze.
     * @docs
     */
    function make_immutable(object: any): any;
    /**
     * Check if an element is a direct child of an element or the parent element itself.
     * @param parent The parent element to test.
     * @param target The target element to test.
     * @docs
     */
    function is_child(parent: any, target: any): boolean;
    /**
     * Check if an element is a recursively nested child of an element or the parent element itself.
     * @param parent The parent element to test.
     * @param target The target element to test.
     * @param stop_node A node at which to stop checking if target is a parent of the current element.
     * @docs
     */
    function is_nested_child(parent: any, target: any, stop_node?: any): boolean;
    /**
     * Round a number to a specified number of decimal places.
     * @param value The number to round.
     * @param decimals The number of decimal places.
     * @returns The rounded number.
     * @docs
     */
    function round(value: number, decimals: number): number;
    /**
     * Get the width of the device's viewport.
     * @returns The width of the device's viewport.
     * @docs
     */
    function device_width(): number;
    /**
     * Get the height of the device's viewport.
     * @returns The height of the device's viewport.
     * @docs
     */
    function device_height(): number;
    /**
     * Get the endpoint sub URL of a full domain URL. When parameter "url" is undefined, it uses the current URL.
     * @param url The full domain URL.
     * @returns The endpoint sub URL.
     * @docs
     */
    function endpoint(url?: string | null): string;
    /**
     * Execute a function when the content is loaded, optionally handling a splash screen.
     * @param func The function to execute when the content is loaded.
     * @returns void
     * @docs
     */
    function on_load(func: () => HTMLElement | AnyElement | Promise<HTMLElement | AnyElement> | null | undefined): Promise<void>;
    /**
     * Redirect to a specified URL, optionally forcing the redirect even if the endpoint is the same.
     * @param url The URL to redirect to.
     * @param forced Whether to force the redirect even if the current endpoint is the same as the target URL.
     * @docs
     */
    function redirect(url: string, forced?: boolean): void;
    /**
     * Get a URL parameter by name, with an optional default value.
     * @param name The name of the URL parameter.
     * @param def The default value to return if the parameter is not found.
     * @returns The value of the URL parameter or the default value.
     * @docs
     */
    function url_param(name: string, def?: any): any | null;
    /**
     * Encode an object into a URL-encoded query string.
     * @param params The parameters to encode.
     * @returns The URL-encoded query string.
     * @docs
     */
    function url_encode(params: Record<string, any>): string;
    /**
     * Copy text to the clipboard.
     * @param text The text to copy.
     * @returns A Promise that resolves when the text is copied.
     * @docs
     */
    function copy_to_clipboard(text: string): Promise<void>;
    /**
     * Create a debounced version of a function that delays invoking it until after a specified delay.
     * @param delay The number of milliseconds to delay.
     * @param func The function to debounce.
     * @returns The debounced function.
     * @docs
     */
    function debounce(delay: number, func: (...args: any[]) => void): (...args: any[]) => void;
    /**
     * @deprecated Use vlib.VDate instead.
     * Convert a Unix timestamp in seconds or milliseconds to the user's date format.
     * @param unix The Unix timestamp.
     * @param mseconds Optional. Whether the Unix timestamp is in milliseconds.
     * @returns The formatted date string.
     * @docs
     */
    function unix_to_date(unix: number, mseconds?: boolean | null): string;
}
export { Utils as utils };
