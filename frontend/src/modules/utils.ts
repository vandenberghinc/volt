/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */


import { AnyElement } from "../ui/any_element.js";

/** Utils module.  */
export namespace Utils {
    /** True if the current browser's vendor string indicates Apple (e.g., Safari on iOS/macOS). */
    export const is_apple = navigator?.vendor?.includes('Apple');
    /** True if the current browser is identified via vendor as Safari/Apple (same check as {@link is_apple}). */
    export const is_safari = navigator?.vendor?.includes('Apple');

    /**
     * Determine whether the provided value is a string.
     * @param value The value to check.
     * @returns Returns true if the value is a string, otherwise false.
     * @docs
     */
    export function is_string(value: any): value is string {
        return typeof value === 'string' || value instanceof String;
    };

    /**
     * Determine whether the provided value is a finite number.
     * @param value The value to check.
     * @returns Returns true if the value is a finite number, otherwise false.
     * @docs
     */
    export function is_numeric(value: any): value is number {
        return typeof value === 'number' && Number.isFinite(value);
    };

    /**
     * Determine whether the provided value is an integer.
     * @param value The value to check.
     * @returns Returns true if the value is an integer, otherwise false.
     * @docs
     */
    export function is_int(value: any): value is number {
        return typeof value === 'number' && Number.isInteger(value);
    };

    /**
     * Determine whether the provided value is a floating-point number.
     * @param value The value to check.
     * @returns Returns true if the value is a float, otherwise false.
     * @docs
     */
    export function is_float(value: any): value is number {
        return typeof value === 'number' && !Number.isNaN(value) && !Number.isInteger(value);
    };

    /**
     * Determine whether the provided value is a function.
     * @param value The value to check.
     * @returns Returns true if the value is a function, otherwise false.
     * @docs
     */
    export function is_func(value: any): value is Function {
        return typeof value === 'function';
    };

    /**
     * Determine whether the provided value is an array.
     * @param value The value to check.
     * @returns Returns true if the value is an array, otherwise false.
     * @docs
     */
    export function is_array(value: any): value is Array<any> {
        return Array.isArray(value);
    };

    /**
     * Determine whether the provided value is a non-array object.
     * @param value The value to check.
     * @returns Returns true if the value is an object and not an array, otherwise false.
     * @docs
     */
    export function is_obj(value: any): value is object {
        return value != null && typeof value === 'object' && !Array.isArray(value);
    };

    /**
     * Determine whether the provided number is even.
     * @param number The number to check.
     * @returns Returns true if the number is even, otherwise false.
     * @docs
     */
    export function is_even(number: number): boolean {
        return number % 2 === 0;
    };

    /**
     * Check if the user agent is a mobile device.
     * @returns Returns true when a mobile user agent is detected.
     * @docs
     */
    export function is_mobile(): boolean {
        return (
            !!navigator.userAgent.match(/Android/i) ||
            !!navigator.userAgent.match(/webOS/i) ||
            !!navigator.userAgent.match(/iPhone/i) ||
            !!navigator.userAgent.match(/iPad/i) ||
            !!navigator.userAgent.match(/iPod/i) ||
            !!navigator.userAgent.match(/BlackBerry/i) ||
            !!navigator.userAgent.match(/Windows Phone/i)
        );
    };

    /**
     * Make all objects of an array or object immutable. All nested objects will also be made immutable recursively.
     * @param object The array or object to freeze.
     * @docs
     */
    export function make_immutable(object: any): any {
        if (Array.isArray(object)) {
            object.forEach((item, index) => {
                if (item != null && typeof item === "object") {
                    object[index] = Utils.make_immutable(item);
                }
            });
            Object.freeze(object);
        }
        else if (object != null && typeof object === "object") {
            Object.keys(object).forEach((key) => {
                if (object[key] != null && typeof object[key] === "object") {
                    object[key] = Utils.make_immutable(object[key]);
                }
            });
            Object.freeze(object);
        }
        return object;
    };

    /**
     * Check if an element is a direct child of an element or the parent element itself.
     * @param parent The parent element to test.
     * @param target The target element to test.
     * @docs
     */
    export function is_child(parent: any, target: any): boolean {
        for (let i = 0; i < parent.children.length; i++) {
            if (target === parent.children[i]) {
                return true;
            }
        }
        return false;
    };

    /**
     * Check if an element is a recursively nested child of an element or the parent element itself.
     * @param parent The parent element to test.
     * @param target The target element to test.
     * @param stop_node A node at which to stop checking if target is a parent of the current element.
     * @docs
     */
    export function is_nested_child(parent: any, target: any, stop_node: any = null): boolean {
        let e: Element | null = target instanceof Element ? target : null;
        while (e != null) {
            if (e === parent) {
                return true;
            }
            else if (e === stop_node) {
                return false;
            }
            e = e.parentElement;
        }
        return false;
    };

    // Equals.
    // eq(x, y) { return x == y; }
    // not_eq(x, y) { return x != y; }

    // Greater than.
    // gt(x, y) { return x > y; }
    // gt_eq(x, y) { return x >= y; }

    // Lesser than.
    // lt(x, y) { return x < y; }
    // lt_eq(x, y) { return x <= y; }

    /**
     * Round a number to a specified number of decimal places.
     * @param value The number to round.
     * @param decimals The number of decimal places.
     * @returns The rounded number.
     * @docs
     */
    export function round(value: number, decimals: number): number {
        const factor = 10 ** decimals;
        return Math.round(value * factor) / factor;
    };

    /**
     * Get the width of the device's viewport.
     * @returns The width of the device's viewport.
     * @docs
     */
    export function device_width(): number {
        return (window.innerWidth > 0) ? window.innerWidth : screen.width;
    };

    /**
     * Get the height of the device's viewport.
     * @returns The height of the device's viewport.
     * @docs
     */
    export function device_height(): number {
        return (window.innerHeight > 0) ? window.innerHeight : screen.height;
    };

    /**
     * Get the endpoint sub URL of a full domain URL. When parameter "url" is undefined, it uses the current URL.
     * @param url The full domain URL.
     * @returns The endpoint sub URL.
     * @docs
     */
    export function endpoint(url: string | null = null): string {
        if (url == null) {
            return Utils.endpoint(window.location.href);
        } else {
            // Strip http:// or https://
            let endpoint = url.replace(/^https?:\/\//, "");

            // Remove domain.
            const firstSlash = endpoint.indexOf('/');
            endpoint = firstSlash !== -1 ? endpoint.substring(firstSlash) : '/';

            // Strip query.
            const queryIndex = endpoint.indexOf("?");
            if (queryIndex !== -1) {
                endpoint = endpoint.substring(0, queryIndex);
            }

            // Clean.
            endpoint = endpoint.replaceAll("//", "/");

            // Remove trailing slashes.
            if (endpoint.length === 0) {
                return '/';
            } else {
                while (endpoint.length > 1 && endpoint.endsWith('/')) {
                    endpoint = endpoint.slice(0, -1);
                }
            }
            return endpoint;
        }
    };

    /**
     * Execute a function when the content is loaded, optionally handling a splash screen.
     * @param func The function to execute when the content is loaded.
     * @returns void
     * @docs
     */
    export async function on_load(func: () => HTMLElement | AnyElement | Promise<HTMLElement | AnyElement> | null | undefined): Promise<void> {
        // document.addEventListener("DOMContentLoaded", async () => {
        const splash = document.getElementById("__volt_splash_screen");
        if (splash != null) {
            splash.remove();
        }
        let e = func();
        if (e instanceof Promise) {
            try {
                e = await e;
            } catch (err) {
                console.error(err);
                return;
            }
        }
        if (e != null && e instanceof HTMLElement) {
            document.body.appendChild(e);
        }
        // });
    }

    /**
     * Redirect to a specified URL, optionally forcing the redirect even if the endpoint is the same.
     * @param url The URL to redirect to.
     * @param forced Whether to force the redirect even if the current endpoint is the same as the target URL.
     * @docs
     */
    export function redirect(url: string, forced: boolean = false): void {
        if (forced || Utils.endpoint() !== url) {
            window.location.href = url;
        }
    }

    /**
     * Get a URL parameter by name, with an optional default value.
     * @param name The name of the URL parameter.
     * @param def The default value to return if the parameter is not found.
     * @returns The value of the URL parameter or the default value.
     * @docs
     */
    export function url_param(name: string, def: any = null): any | null {
        const params = new URLSearchParams(window.location.search);
        const param = params.get(name);
        if (param == null || param === "") {
            return def;
        }
        switch (param.toLowerCase()) {
            case "true": return true;
            case "false": return false;
            case "null": return null;
            default: return param;
        }
    }

    /**
     * Encode an object into a URL-encoded query string.
     * @param params The parameters to encode.
     * @returns The URL-encoded query string.
     * @docs
     */
    export function url_encode(params: Record<string, any>): string {
        const encodedParams: string[] = [];
        Object.keys(params).forEach((key) => {
            const encodedKey = encodeURIComponent(key);
            const encodedValue = encodeURIComponent(params[key]);
            encodedParams.push(`${encodedKey}=${encodedValue}`);
        });
        return encodedParams.join('&');
    }

    /**
     * Copy text to the clipboard.
     * @param text The text to copy.
     * @returns A Promise that resolves when the text is copied.
     * @docs
     */
    export async function copy_to_clipboard(text: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            navigator.clipboard.writeText(text)
                .then(() => {
                    resolve();
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    // /**
    //  * Make a request with a specific generic typing, optionally passing
    //  * the request method, endpoint, request body and response body types.
    //  */
    // export function request<Info extends RequestInfo>(
    //     options: Info extends RequestInfo<infer M, infer E, infer P>
    //         ? RequestOpts<M, E, P>
    //         : never
    // ): Promise<Info extends RequestInfo<any, any, any, infer S, infer E> ? RequestResult<S, E> : never>;

    // /** Request with success body. */
    // export function request<
    //     SuccessBody extends ResponseBodyBase,
    // >(
    //     options: RequestOpts<Utils.Method, string, unknown>
    // ): Promise<RequestResult<SuccessBody, unknown>>;
    // /** Request with success body & request body generics. */
    // export function request<
    //     SuccessBody extends ResponseBodyBase,
    //     RequestBody extends RequestBodyBase
    // >(
    //     options: RequestOpts<Utils.Method, string, RequestBody>
    // ): Promise<RequestResult<SuccessBody, unknown>>;
    // /** Request with success body & request info generics. */
    // export function request<
    //     SuccessBody extends ResponseBodyBase,
    //     RequestInfo extends RegisteredEndpoint,
    // >(
    //     options: RequestInfo extends RegisteredEndpoint<infer M, infer E, infer P>
    //         ? RequestOpts<M extends undefined ? "GET" : M, E, P>
    //         : RequestOpts<Utils.Method, string, unknown>
    // ): Promise<RequestResult<SuccessBody, unknown>>;
    // /** Request with success body, error body & request body generics. */
    // export function request<
    //     SuccessBody extends ResponseBodyBase,
    //     ErrorBody extends ResponseBodyBase,
    //     RequestBody extends RequestBodyBase
    // >(
    //     options: RequestOpts<Utils.Method, string, RequestBody>
    // ): Promise<RequestResult<SuccessBody, ErrorBody>>;
    // /** New request method. */
    // export async function request(options: RequestOpts<Utils.Method, string, any>): Promise<RequestResult<any, any>> {


    /**
     * Create a debounced version of a function that delays invoking it until after a specified delay.
     * @param delay The number of milliseconds to delay.
     * @param func The function to debounce.
     * @returns The debounced function.
     * @docs
     */
    export function debounce(delay: number, func: (...args: any[]) => void): (...args: any[]) => void {
        let timeout: number | undefined;
        return function (this: any, ...args: any[]) {
            if (timeout !== undefined) {
                clearTimeout(timeout);
            }
            timeout = window.setTimeout(() => func.apply(this, args), delay);
        };
    }

    /**
     * @deprecated Use vlib.VDate instead.
     * Convert a Unix timestamp in seconds or milliseconds to the user's date format.
     * @param unix The Unix timestamp.
     * @param mseconds Optional. Whether the Unix timestamp is in milliseconds.
     * @returns The formatted date string.
     * @docs
     */
    export function unix_to_date(unix: number, mseconds: boolean | null = null): string {
        // Guess msec or sec.
        if (mseconds == null) {
            // As of now, Unix time in milliseconds is 13 digits and in seconds is 10 digits
            const str = unix.toString();
            if (str.length === 13) {
                mseconds = true;
            } else if (str.length === 10) {
                mseconds = false;
            } else {
                // Future-proofing: When second-based timestamps eventually reach 11 digits
                if (str.length > 10 && str.length < 13) {
                    // Check if adding three zeroes (to simulate milliseconds) results in a plausible future date
                    // This is a rough estimation and might not be accurate
                    const futureCheck = new Date(parseInt(str + "000", 10));
                    if (futureCheck.getFullYear() > new Date().getFullYear() && futureCheck.getFullYear() < 3000) {
                        mseconds = false;
                    }
                }
            }
        }

        // Format.
        const date = new Date(mseconds ? unix : unix * 1000);
        const lang = navigator.language || (navigator as any).userLanguage;
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        let options: Intl.DateTimeFormatOptions = {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            timeZone: tz,
        };
        const date_format = new Intl.DateTimeFormat(lang, options).format(date);
        options = {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: lang.toLowerCase().includes("en"),
            timeZone: tz,
        };
        const time_format = new Intl.DateTimeFormat(lang, options).format(date);
        return `${date_format} ${time_format}`;
    }



    

    // Get the brightness of a hex color (0.0 white 1.0 dark).
    // @deprecated moved to `Colors`
    // hex_brightness(color: string): number {
    //     // Remove the hash symbol if present
    //     color = color.replace(/^#/, '');

    //     // Convert hex to RGB
    //     const bigint = parseInt(color, 16);
    //     const r = (bigint >> 16) & 255;
    //     const g = (bigint >> 8) & 255;
    //     const b = bigint & 255;

    //     // Calculate perceived brightness using the relative luminance formula
    //     const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    //     return brightness;
    // },

    // Hex to rgbA.
    // @deprecated moved to `Colors`
    // hex_to_rgb(hex: string): { r: number, g: number, b: number, a: number } {
    //     let index = hex.indexOf("#");
    //     if (index !== -1) {
    //         hex = hex.substr(index + 1);
    //     }
    //     let r = parseInt(hex.substring(0, 2), 16);
    //     let g = parseInt(hex.substring(2, 4), 16);
    //     let b = parseInt(hex.substring(4, 6), 16);
    //     let a = 1;
    //     if (hex.length > 6) {
    //         a = parseInt(hex.substring(6, 8)) / 100;
    //     }
    //     return { r, g, b, a };
    // },


    // Aggregate multiple classes into a single class, can be used to extend more than one class.
    // aggregate(
    //     BaseClass: new (...args: any[]) => any,
    //     ...Mixins: Array<new (...args: any[]) => any>
    // ) {
    //     class AggregatedClass extends BaseClass {
    //         constructor(...args: any[]) {
    //             super(...args);
    //             // Additional initialization if needed
    //         }
    //     }

    //     // Copy methods and properties from mixin classes to the AggregatedClass prototype
    //     Mixins.forEach(MixinClass => {

    //         // Copy instance methods and properties
    //         Object.getOwnPropertyNames(MixinClass.prototype).forEach(name => {
    //             if (name !== 'constructor') {
    //                 Object.defineProperty(
    //                     AggregatedClass.prototype,
    //                     name,
    //                     Object.getOwnPropertyDescriptor(MixinClass.prototype, name)!
    //                 );
    //             }
    //         });

    //         // Copy static methods and properties if needed
    //         Object.getOwnPropertyNames(MixinClass).forEach(name => {
    //             if (name !== 'prototype' && name !== 'name' && name !== 'length') {
    //                 Object.defineProperty(
    //                     AggregatedClass,
    //                     name,
    //                     Object.getOwnPropertyDescriptor(MixinClass, name)!
    //                 );
    //             }
    //         });
    //     });

    //     return AggregatedClass;
    // },
}
export { Utils as utils }; // also export as lowercase for compatibility.





// // ---------------------------------------
// // SMALL REQUESTS TESTS

// // 2 generics: <Success, Body>  -> Error = unknown
// const res_1 = await Utils.request<
//     { uid: string },
//     { name: string }
// >({ method: 'POST', url: '/users', data: { name: 'Ada' } });
// if (res_1.error) {
//     const e = res_1.error;
// } else {
//     const d = res_1.data;
// }

// // 3 generics: <Success, Error, Body>
// const res_2 = await Utils.request<{ uid: string }, { unknown_uid: string }, { name: string }>({ method: 'POST', url: '/users', data: { name: 'Ada' } });
// if (res_2.error) {
//     const e = res_2.error;
//     const d = res_2.data;
// } else {
//     const d = res_2.data;
// }

// // 1 generic: <Success>  -> Body inferred from `data`, Error = unknown
// const res_3 = await Utils.request<{ uid: string }>({ method: 'POST', url: '/users', data: { name: 'Ada' } });
// if (res_3.error) {
//     const e = res_3.error;
// } else {
//     const d = res_3.data;
// }


// // missing data attr
// const res_4 = await Utils.request<
//     { uid: string },
//     { name: string, age: number }
// >({
//     method: 'POST',
//     url: '/users',
//     // @ts-expect-error
//     data: { name: 'Ada' }
// });

