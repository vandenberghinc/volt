/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */
// Utils module.
const Utils = {
    is_apple: navigator.vendor.includes('Apple'),
    is_safari: navigator.vendor.includes('Apple'),
    /* @docs:
        @nav: Frontend
        @chapter: Utils
        @title: Check if value is a string
        @desc: Determine whether the provided value is a string.
        @param:
            @name: value
            @description The value to check.
            @type: any
        @return:
            @description Returns true if the value is a string, otherwise false.
            @type: boolean
    */
    is_string(value) {
        return typeof value === 'string' || value instanceof String;
    },
    /* @docs:
        @nav: Frontend
        @chapter: Utils
        @title: Check if value is numeric
        @desc: Determine whether the provided value is a finite number.
        @param:
            @name: value
            @description The value to check.
            @type: any
        @return:
            @description Returns true if the value is a finite number, otherwise false.
            @type: boolean
    */
    is_numeric(value) {
        return typeof value === 'number' && Number.isFinite(value);
    },
    /* @docs:
        @nav: Frontend
        @chapter: Utils
        @title: Check if value is an integer
        @desc: Determine whether the provided value is an integer.
        @param:
            @name: value
            @description The value to check.
            @type: any
        @return:
            @description Returns true if the value is an integer, otherwise false.
            @type: boolean
    */
    is_int(value) {
        return typeof value === 'number' && Number.isInteger(value);
    },
    /* @docs:
        @nav: Frontend
        @chapter: Utils
        @title: Check if value is a float
        @desc: Determine whether the provided value is a floating-point number.
        @param:
            @name: value
            @description The value to check.
            @type: any
        @return:
            @description Returns true if the value is a float, otherwise false.
            @type: boolean
    */
    is_float(value) {
        return typeof value === 'number' && !Number.isNaN(value) && !Number.isInteger(value);
    },
    /* @docs:
        @nav: Frontend
        @chapter: Utils
        @title: Check if value is a function
        @desc: Determine whether the provided value is a function.
        @param:
            @name: value
            @description The value to check.
            @type: any
        @return:
            @description Returns true if the value is a function, otherwise false.
            @type: boolean
    */
    is_func(value) {
        return typeof value === 'function';
    },
    /* @docs:
        @nav: Frontend
        @chapter: Utils
        @title: Check if value is an array
        @desc: Determine whether the provided value is an array.
        @param:
            @name: value
            @description The value to check.
            @type: any
        @return:
            @description Returns true if the value is an array, otherwise false.
            @type: boolean
    */
    is_array(value) {
        return Array.isArray(value);
    },
    /* @docs:
        @nav: Frontend
        @chapter: Utils
        @title: Check if value is an object
        @desc: Determine whether the provided value is a non-array object.
        @param:
            @name: value
            @description The value to check.
            @type: any
        @return:
            @description Returns true if the value is an object and not an array, otherwise false.
            @type: boolean
    */
    is_obj(value) {
        return value != null && typeof value === 'object' && !Array.isArray(value);
    },
    /* @docs:
        @nav: Frontend
        @chapter: Utils
        @title: Check if number is even
        @desc: Determine whether the provided number is even.
        @param:
            @name: number
            @description The number to check.
            @type: number
        @return:
            @description Returns true if the number is even, otherwise false.
            @type: boolean
    */
    is_even(number) {
        return number % 2 === 0;
    },
    /*	@docs:
        @nav: Frontend
        @chapter: Utils
        @title: Is Mobile
        @desc: Check if the user agent is a mobile device.
    */
    is_mobile() {
        return (!!navigator.userAgent.match(/Android/i) ||
            !!navigator.userAgent.match(/webOS/i) ||
            !!navigator.userAgent.match(/iPhone/i) ||
            !!navigator.userAgent.match(/iPad/i) ||
            !!navigator.userAgent.match(/iPod/i) ||
            !!navigator.userAgent.match(/BlackBerry/i) ||
            !!navigator.userAgent.match(/Windows Phone/i));
    },
    /*	@docs:
        @nav: Frontend
        @chapter: Utils
        @title: Make Immutable
        @desc:
            Make all objects of an array or object immutable. All nested objects will also be made immutable recursively.
        @param:
            @name: object
            @desc: The array or object to freeze.
            @type: array | object
    */
    make_immutable(object) {
        if (Array.isArray(object)) {
            object.forEach((item, index) => {
                if (item !== null && typeof item === "object") {
                    object[index] = Utils.make_immutable(item);
                }
            });
            Object.freeze(object);
        }
        else if (object !== null && typeof object === "object") {
            Object.keys(object).forEach((key) => {
                if (object[key] !== null && typeof object[key] === "object") {
                    object[key] = Utils.make_immutable(object[key]);
                }
            });
            Object.freeze(object);
        }
        return object;
    },
    /*	@docs:
        @nav: Frontend
        @chapter: Utils
        @title: Is child
        @desc:
            Check if an element is a direct child of an element or the parent element itself.
        @param:
            @name: parent
            @desc: The parent element to test.
            @type: Node | Element
        @param:
            @name: target
            @desc: The target element to test.
            @type: Node | Element
    */
    is_child(parent, target) {
        for (let i = 0; i < parent.children.length; i++) {
            if (target === parent.children[i]) {
                return true;
            }
        }
        return false;
    },
    /*	@docs:
        @nav: Frontend
        @chapter: Utils
        @title: Is child recursively
        @desc:
            Check if an element is a recursively nested child of an element or the parent element itself.
        @param:
            @name: parent
            @desc: The parent element to test.
            @type: Node | Element
        @param:
            @name: target
            @desc: The target element to test.
            @type: Node | Element
        @param:
            @name: stop_node
            @desc: A node at which to stop checking if target is a parent of the current element.
            @type: Node | Element | null
    */
    is_nested_child(parent, target, stop_node = null) {
        let e = target instanceof Element ? target : null;
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
    },
    // Equals.
    // eq(x, y) { return x == y; }
    // not_eq(x, y) { return x != y; }
    // Greater than.
    // gt(x, y) { return x > y; }
    // gt_eq(x, y) { return x >= y; }
    // Lesser than.
    // lt(x, y) { return x < y; }
    // lt_eq(x, y) { return x <= y; }
    /* @docs:
        @nav: Frontend
        @chapter: Utils
        @title: Round to decimals
        @desc: Round a number to a specified number of decimal places.
        @param:
            @name: value
            @desc: The number to round.
            @type: number
            @name: decimals
            @desc: The number of decimal places.
            @type: number
        @return:
            @desc: The rounded number.
            @type: number
    */
    round(value, decimals) {
        const factor = 10 ** decimals;
        return Math.round(value * factor) / factor;
    },
    /* @docs:
        @nav: Frontend
        @chapter: Utils
        @title: Get device width
        @desc: Get the width of the device's viewport.
        @return:
            @desc: The width of the device's viewport.
            @type: number
    */
    device_width() {
        return (window.innerWidth > 0) ? window.innerWidth : screen.width;
    },
    /* @docs:
        @nav: Frontend
        @chapter: Utils
        @title: Get device height
        @desc: Get the height of the device's viewport.
        @return:
            @desc: The height of the device's viewport.
            @type: number
    */
    device_height() {
        return (window.innerHeight > 0) ? window.innerHeight : screen.height;
    },
    /* @docs:
        @nav: Frontend
        @chapter: Utils
        @title: Get endpoint
        @desc: Get the endpoint sub URL of a full domain URL. When parameter "url" is undefined, it uses the current URL.
        @param:
            @name: url
            @desc: The full domain URL.
            @type: string | null
        @return:
            @desc: The endpoint sub URL.
            @type: string
    */
    endpoint(url = null) {
        if (url == null) {
            return Utils.endpoint(window.location.href);
        }
        else {
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
            }
            else {
                while (endpoint.length > 1 && endpoint.endsWith('/')) {
                    endpoint = endpoint.slice(0, -1);
                }
            }
            return endpoint;
        }
    },
    // Get style name for vendor prefix.
    // get_vendor_prefix_property(property: string, style: CSSStyleDeclaration): string {
    // 	if (Utils.vendor_prefix_cache[property]) {
    // 		return Utils.vendor_prefix_cache[property];
    // 	}
    // 	const vendors = ['webkit', 'moz', 'ms', 'o'];
    // 	for (let i = 0; i < vendors.length; i++) {
    // 		let vendor_property = "-";
    // 		vendor_property += vendors[i];
    // 		vendor_property += "-";
    // 		vendor_property += property;
    // 		if (property in style) {
    // 			Utils.vendor_prefix_cache[property] = vendor_property;
    // 			return vendor_property;
    // 		}
    // 	}
    // 	Utils.vendor_prefix_cache[property] = property;
    // 	return property;
    // }
    /* @docs:
        @nav: Frontend
        @chapter: Utils
        @title: Redirect
        @desc: Redirect to a specified URL, optionally forcing the redirect even if the endpoint is the same.
        @param:
            @name: url
            @desc: The URL to redirect to.
            @type: string
            @name: forced
            @desc: Whether to force the redirect even if the current endpoint is the same as the target URL.
            @type: boolean
    */
    redirect(url, forced = false) {
        if (forced || Utils.endpoint() !== url) {
            window.location.href = url;
        }
    },
    /* @docs:
        @nav: Frontend
        @chapter: Utils
        @title: Delay
        @desc: Delay the execution of a function by a specified number of milliseconds.
        @param:
            @name: mseconds
            @desc: The number of milliseconds to delay.
            @type: number
            @name: func
            @desc: The function to execute after the delay.
            @type: () => void
    */
    delay(mseconds, func) {
        setTimeout(() => func(), mseconds);
    },
    /* @docs:
        @nav: Frontend
        @chapter: Utils
        @title: Get URL parameter
        @desc: Get a URL parameter by name, with an optional default value.
        @param:
            @name: name
            @desc: The name of the URL parameter.
            @type: string
            @name: def
            @desc: The default value to return if the parameter is not found.
            @type: any | null
        @return:
            @desc: The value of the URL parameter or the default value.
            @type: any | null
    */
    url_param(name, def = null) {
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
    },
    /* @docs:
        @nav: Frontend
        @chapter: Utils
        @title: URL Encode
        @desc: Encode an object into a URL-encoded query string.
        @param:
            @name: params
            @desc: The parameters to encode.
            @type: Record<string, any>
        @return:
            @desc: The URL-encoded query string.
            @type: string
    */
    url_encode(params) {
        const encodedParams = [];
        Object.keys(params).forEach((key) => {
            const encodedKey = encodeURIComponent(key);
            const encodedValue = encodeURIComponent(params[key]);
            encodedParams.push(`${encodedKey}=${encodedValue}`);
        });
        return encodedParams.join('&');
    },
    /* @docs:
        @nav: Frontend
        @chapter: Utils
        @title: Copy to Clipboard
        @desc: Copy text to the clipboard.
        @param:
            @name: text
            @desc: The text to copy.
            @type: string
        @return:
            @desc: A Promise that resolves when the text is copied.
            @type: Promise<void>
    */
    async copy_to_clipboard(text) {
        return new Promise((resolve, reject) => {
            navigator.clipboard.writeText(text)
                .then(() => {
                resolve();
            })
                .catch((err) => {
                reject(err);
            });
        });
    },
    // Get the brightness of a hex color (0.0 white 1.0 dark).
    // @deprecated moved to `Colors`
    hex_brightness(color) {
        // Remove the hash symbol if present
        color = color.replace(/^#/, '');
        // Convert hex to RGB
        const bigint = parseInt(color, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        // Calculate perceived brightness using the relative luminance formula
        const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return brightness;
    },
    // Hex to rgbA.
    // @deprecated moved to `Colors`
    hex_to_rgb(hex) {
        let index = hex.indexOf("#");
        if (index !== -1) {
            hex = hex.substr(index + 1);
        }
        let r = parseInt(hex.substring(0, 2), 16);
        let g = parseInt(hex.substring(2, 4), 16);
        let b = parseInt(hex.substring(4, 6), 16);
        let a = 1;
        if (hex.length > 6) {
            a = parseInt(hex.substring(6, 8)) / 100;
        }
        return { r, g, b, a };
    },
    /* @docs:
        @nav: Frontend
        @chapter: Utils
        @title: Deep copy
        @desc: Perform a deep copy on any type, it does not support classes, only primitive objects.
        @param:
            @name: obj
            @desc: The object to deep copy.
            @type: any
        @return:
            @desc: The deep copied object.
            @type: any
    */
    deep_copy(obj) {
        if (Array.isArray(obj)) {
            const copy = [];
            obj.forEach((item) => {
                copy.push(Utils.deep_copy(item));
            });
            return copy;
        }
        else if (obj !== null && obj instanceof String) {
            return new String(obj.toString());
        }
        else if (obj !== null && typeof obj === "object") {
            const copy = {};
            const keys = Object.keys(obj);
            const values = Object.values(obj);
            for (let i = 0; i < keys.length; i++) {
                copy[keys[i]] = Utils.deep_copy(values[i]);
            }
            return copy;
        }
        else {
            return obj;
        }
    },
    /** New request method. */
    async request(options) {
        const { method = 'GET', url = null, data = null, json = true, credentials = "same-origin", headers = {}, } = options;
        // — prepare headers —
        if (json && data != null && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }
        // — build URL + body —
        let finalUrl = url;
        let body;
        if (data != null && typeof data === 'object') {
            if (method.toUpperCase() === 'GET') {
                finalUrl = `${url}?${new URLSearchParams(data).toString()}`;
            }
            else {
                body = JSON.stringify(data);
            }
        }
        else if (data != null) {
            body = String(data);
        }
        const init = { method, credentials, headers };
        if (body !== undefined)
            init.body = body;
        try {
            const response = await fetch(finalUrl, init);
            const status = response.status;
            // — parse payload once —
            let payload;
            const clone = response.clone(); // @dev.
            if (json) {
                try {
                    payload = await response.json();
                }
                catch (e) {
                    // malformed JSON still counts as a “success” fetch
                    console.log("[debug] Unable to parse a json from response:", await clone.text(), "- Error: ", JSON.stringify(e, null, 4));
                    console.log("[debug] Response:", response);
                    return {
                        status,
                        error: { message: `Failed to parse JSON response: ${e.message}` },
                    };
                }
            }
            else {
                try {
                    payload = await response.text();
                }
                catch (e) {
                    return {
                        status,
                        error: { message: `Failed to parse text response: ${e.message}` },
                    };
                }
            }
            // console.log("Payload", json, payload)
            // — handle HTTP errors (4xx/5xx) by resolving with an error object —
            if (!response.ok) {
                // if server wrapped its error in { error: { message, type?, invalid_fields? }, … }
                if (payload &&
                    typeof payload === 'object' &&
                    typeof payload.error === 'object' &&
                    typeof payload.error.message === 'string') {
                    return {
                        status,
                        error: {
                            message: payload.error.message,
                            type: payload.error.type,
                            invalid_fields: payload.error.invalid_fields,
                        },
                        data: payload.data,
                    };
                }
                // otherwise fall back to a generic single‐message error
                const msg = typeof payload === 'string'
                    ? payload
                    : payload?.error?.toString() ?? JSON.stringify(payload);
                return {
                    status,
                    error: { message: msg },
                };
            }
            // — 2xx: success —
            return { status, data: payload };
        }
        catch (networkErr) {
            // genuine network / system failure
            throw networkErr;
        }
    },
    // @deprecated.
    /* @docs:
        @nav: Frontend
        @chapter: Utils
        @title: Request
        @desc: Make an HTTP request with the specified options.
        @param:
            @name: options
            @desc: The request options.
            @type: {
                method?: string,
                url?: string | null,
                data?: any,
                json?: boolean,
                credentials?: 'include' | 'same-origin' | 'omit',
                headers?: Record<string, string>,
            }
        @return:
            @desc: A Promise that resolves with the response data.
            @type: Promise<any>
    */
    request_v1(options) {
        const { method = "GET", url = null, data = null, json = true, credentials = "same-origin", headers = {}, } = options;
        // Set headers.
        // Host and User-Agent headers are restricted and set by the browser itself.
        if (json && data !== null && headers['Content-Type'] == null) {
            headers['Content-Type'] = 'application/json';
        }
        // Handle data.
        let finalUrl = url;
        let bodyData = data !== null ? data : undefined;
        if (data !== null && typeof data === "object") {
            if (method.toUpperCase() === "GET") {
                finalUrl = `${url}?${new URLSearchParams(data).toString()}`;
                bodyData = undefined;
            }
            else {
                // Stringify.
                bodyData = JSON.stringify(data);
            }
        }
        // Define options.
        const fetchOptions = {
            method,
            credentials,
            headers,
            body: bodyData,
        };
        return new Promise((resolve, reject) => {
            fetch(finalUrl, fetchOptions)
                .then(response => {
                // Handle error code.
                if (!response.ok) {
                    // Parse as json.
                    if (json) {
                        const clone = response.clone();
                        response.json().then(data => {
                            if (data.status === undefined) {
                                data.status = response.status;
                            }
                            reject(data);
                        }).catch(err => {
                            clone.text()
                                .then(data => {
                                reject({
                                    error: data,
                                    status: response.status
                                });
                            })
                                .catch(text_err => {
                                reject({
                                    error: err,
                                    status: response.status
                                });
                            });
                        });
                    }
                    // Reject.
                    else {
                        reject({
                            error: response.statusText,
                            status: response.status
                        });
                    }
                    return; // stop.
                }
                // Successful response.
                if (json) {
                    response.json().then(data => {
                        resolve(data);
                    }).catch(err => {
                        console.log("Response:", response);
                        reject({
                            error: 'Failed to parse JSON response: ' + err.message,
                            status: response.status
                        });
                    });
                }
                else {
                    response.text().then(data => {
                        resolve(data);
                    }).catch(err => {
                        console.log("Response:", response);
                        reject({
                            error: 'Failed to parse text response: ' + err.message,
                            status: response.status
                        });
                    });
                }
            })
                .catch(error => {
                reject({ error: error.message }); // Reject with error message if fetch fails
            });
        });
    },
    /*
    request(options: {
        method?: string,
        url?: string | null,
        data?: any,
        async?: boolean,
        success?: (status: number, data: any) => void,
        error?: (status: number, error: any) => void,
        before?: () => void,
    }): Promise<any> {
        // Original commented out implementation.
    }
    */
    /* @docs:
        @nav: Frontend
        @chapter: Utils
        @title: On load
        @desc: Execute a function when the content is loaded, optionally handling a splash screen.
        @param:
            @name: func
            @desc: The function to execute when the content is loaded.
            @type: () => HTMLElement | Promise<HTMLElement> | null
        @return:
            @desc: void
            @type: void
    */
    async on_load(func) {
        // document.addEventListener("DOMContentLoaded", async () => {
        const splash = document.getElementById("__volt_splash_screen");
        if (splash != null) {
            splash.remove();
        }
        let e = func();
        if (e instanceof Promise) {
            try {
                e = await e;
            }
            catch (err) {
                console.error(err);
                return;
            }
        }
        if (e != null && e instanceof HTMLElement) {
            document.body.appendChild(e);
        }
        // });
    },
    /**
     * @deprecated Use vlib.VDate instead.
     * @docs:
     
        @nav: Frontend
        @chapter: Utils
        @title: Unix to Date
        @desc: Convert a Unix timestamp in seconds or milliseconds to the user's date format.
        @param:
            @name: unix
            @desc: The Unix timestamp.
            @type: number
            @name: mseconds
            @desc: Optional. Whether the Unix timestamp is in milliseconds.
            @type: boolean | null
        @return:
            @desc: The formatted date string.
            @type: string
    */
    unix_to_date(unix, mseconds = null) {
        // Guess msec or sec.
        if (mseconds === null) {
            // As of now, Unix time in milliseconds is 13 digits and in seconds is 10 digits
            const str = unix.toString();
            if (str.length === 13) {
                mseconds = true;
            }
            else if (str.length === 10) {
                mseconds = false;
            }
            else {
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
        const lang = navigator.language || navigator.userLanguage;
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        let options = {
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
    },
    /* @docs:
        @nav: Frontend
        @chapter: Utils
        @title: Debounce
        @desc: Create a debounced version of a function that delays invoking it until after a specified delay.
        @param:
            @name: delay
            @desc: The number of milliseconds to delay.
            @type: number
            @name: func
            @desc: The function to debounce.
            @type: (...args: any[]) => void
        @return:
            @desc: The debounced function.
            @type: (...args: any[]) => void
    */
    debounce(delay, func) {
        let timeout;
        return function (...args) {
            if (timeout !== undefined) {
                clearTimeout(timeout);
            }
            timeout = window.setTimeout(() => func.apply(this, args), delay);
        };
    },
    // Create the on render observer.
    on_render_observer: new ResizeObserver((entries, observer) => {
        entries.forEach(entry => {
            const target = entry.target;
            if (!target.rendered) {
                target._on_render_callbacks.iterate((func) => { func(entry.target); });
                target.rendered = true;
                Utils.on_render_observer.unobserve(entry.target);
            }
        });
    }),
    // Create the on resize observer.
    on_resize_observer: new ResizeObserver((entries, observer) => {
        entries.forEach(entry => {
            entry.target._on_resize_callbacks.iterate((func) => { func(entry.target); });
        });
    }),
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
};
// Export.
export { Utils };
export { Utils as utils }; // also export as lowercase for compatibility.
