/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Utils module.
const Utils = {
    is_apple: navigator.vendor.includes('Apple') as boolean,
    is_safari: navigator.vendor.includes('Apple') as boolean,

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
    is_string(value: any): value is string {
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
    is_numeric(value: any): value is number {
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
    is_int(value: any): value is number {
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
    is_float(value: any): value is number {
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
    is_func(value: any): value is Function {
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
    is_array(value: any): value is Array<any> {
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
    is_obj(value: any): value is object {
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
    is_even(number: number): boolean {
        return number % 2 === 0;
    },

    /*	@docs:
       	@nav: Frontend
       	@chapter: Utils
      	@title: Is Mobile
      	@desc: Check if the user agent is a mobile device.
    */
    is_mobile(): boolean {
        return (
            !!navigator.userAgent.match(/Android/i) ||
            !!navigator.userAgent.match(/webOS/i) ||
            !!navigator.userAgent.match(/iPhone/i) ||
            !!navigator.userAgent.match(/iPad/i) ||
            !!navigator.userAgent.match(/iPod/i) ||
            !!navigator.userAgent.match(/BlackBerry/i) ||
            !!navigator.userAgent.match(/Windows Phone/i)
        );
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
    make_immutable(object: any): any {
        if (Array.isArray(object)) {
            Object.freeze(object);
            object.forEach((item, index) => {
                if (item !== null && typeof item === "object") {
                    object[index] = Utils.make_immutable(item);
                }
            });
        }
        else if (object !== null && typeof object === "object") {
            Object.freeze(object);
            Object.keys(object).forEach((key) => {
                if (object[key] !== null && typeof object[key] === "object") {
                    object[key] = Utils.make_immutable(object[key]);
                }
            });
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
    is_child(parent: any, target: any): boolean {
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
    is_nested_child(parent: any, target: any, stop_node: any = null): boolean {
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
    round(value: number, decimals: number): number {
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
    device_width(): number {
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
    device_height(): number {
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
    endpoint(url: string | null = null): string {
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
    redirect(url: string, forced: boolean = false): void {
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
    delay(mseconds: number, func: () => void): void {
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
    url_param(name: string, def: any = null): any | null {
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
    url_encode(params: Record<string, any>): string {
        const encodedParams: string[] = [];
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
    async copy_to_clipboard(text: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
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
    hex_brightness(color: string): number {
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
    hex_to_rgb(hex: string): { r: number, g: number, b: number, a: number } {
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
    deep_copy(obj: any): any {
        if (Array.isArray(obj)) {
            const copy: any[] = [];
            obj.forEach((item) => {
                copy.push(Utils.deep_copy(item));
            });
            return copy;
        }
        else if (obj !== null && obj instanceof String) {
            return new String(obj.toString());
        }
        else if (obj !== null && typeof obj === "object") {
            const copy: Record<string, any> = {};
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
    request(options: {
        method?: string,
        url?: string | null,
        data?: any,
        json?: boolean,
        credentials?: 'include' | 'same-origin' | 'omit',
        headers?: Record<string, string>,
    }): Promise<any> {
        const {
            method = "GET",
            url = null,
            data = null,
            json = true,
            credentials = "same-origin",
            headers = {},
        } = options;

        // Set headers.
        // Host and User-Agent headers are restricted and set by the browser itself.
        if (json && data !== null && headers['Content-Type'] == null) {
            headers['Content-Type'] = 'application/json';
        }

        // Handle data.
        let finalUrl = url;
        let bodyData: string | undefined = data !== null ? data : undefined;

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
        const fetchOptions: RequestInit = {
            method,
            credentials,
            headers,
            body: bodyData,
        };

        return new Promise<any>((resolve, reject) => {
            fetch(finalUrl!, fetchOptions)
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
                    } else {
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
    async on_load(func: () => HTMLElement | Promise<HTMLElement> | null): Promise<void> {
        // document.addEventListener("DOMContentLoaded", async () => {
            const splash = document.getElementById("__vweb_splash_screen");
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
    },

    /* @docs:
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
    unix_to_date(unix: number, mseconds: boolean | null = null): string {
        // Guess msec or sec.
        if (mseconds === null) {
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
    },

    /* @docs:
        @nav: Frontend
        @chapter: Utils
        @title: Fuzzy Search
        @description:
            Perform a fuzzy similarity match between a query and an array of targets.
        @type: number
        @return:
            Returns an array with the targets sorted from best match to lowest match, unless parameter `get_matches` is enabled.
        @param:
            @name: query
            @description: The search query.
            @type: string
            @name: targets
            @description: 
                The targets to search through.
                When the nested items are objects, define the parameter `key` to specify the query string key.
                When the nested items are arrays, the first value of the array will be used as the query string.
            @type: Array<string | object | any[]>
            @name: limit
            @description: Limit the number of results. Define the limit as `null` or `-1` to set no limit.
            @type: number
            @name: case_match
            @description:
                When the `case_match` flag is enabled, the similarity match is case sensitive.
            @type: boolean
            @name: allow_exceeding_chars
            @description: 
                Allow matches where the single character count of the search query exceeds that of the target.
                For example, when the query is "aa" and the target is "a", no match will be given since the "a" count of the target (2) is higher than the query (1).
            @type: boolean
            @name: get_matches
            @description:
                When the `get_matches` flag is enabled, the function returns an array with nested arrays containing the similarity match `[similarity <number>, <target>]`.
            @type: boolean
            @name: key
            @description: The key for the query string when the array's target items are objects. The key may also be an array with keys to use the best match of the key's value.
            @type: string | string[] | null
            @name: nested_key
            @description:
                When the target items are objects and the object may have nested children that also should be searched, define the `nested_key` parameter to specify the key used for the nested children.
                The value for the nested key should also be an array of objects and use the same structure for the `key` parameter, otherwise it will cause undefined behavior.
                The nested key will be ignored if the nested key does not exist in a target object.
            @type: string | null
    */
    fuzzy_search({
        query, 
        targets = [], 
        limit = 25,
        case_match = false,
        allow_exceeding_chars = true,
        get_matches = false,
        key = null, 
        nested_key = null,
    }: {
        query: string,
        targets?: Array<string | object | any[]>,
        limit?: number,
        case_match?: boolean,
        allow_exceeding_chars?: boolean,
        get_matches?: boolean,
        key?: string | string[] | null,
        nested_key?: string | null,
    }): Array<any> | Array<[number, any]> {
        // Checks.
        if (query == null) {
            throw new Error("Define parameter \"query\".");
        }

        // Vars.
        const is_obj = targets.length > 0 && typeof targets[0] === "object" && !Array.isArray(targets[0]);
        const is_array = targets.length > 0 && Array.isArray(targets[0]);
        if (is_obj && key == null) { key = "query"; }
        const is_key_array = Array.isArray(key);
        const results: Array<[number, any]> = [];
        if (!case_match) { query = query.toLowerCase(); }

        // Calculate the similarities.
        const calc_sims = (current_targets: Array<any> = []) => {
            current_targets.forEach(target => {
                let match: number | null;
                if (is_array) {
                    match = Utils.fuzzy_match(
                        query,
                        case_match ? target[0] : (typeof target[0] === 'string' ? target[0].toLowerCase() : target[0]),
                        allow_exceeding_chars
                    );
                } else if (is_obj) {
                    if (is_key_array && Array.isArray(key)) {
                        let min_match: number | null = null;
                        (key as string[]).forEach(k => {
                            if (target[k] == null) { return; }
                            const current_match = Utils.fuzzy_match(
                                query, 
                                case_match ? target[k] : (typeof target[k] === 'string' ? target[k].toLowerCase() : target[k]),
                                allow_exceeding_chars
                            );
                            if (current_match != null && (min_match === null || current_match < min_match)) {
                                min_match = current_match;
                            }
                        });
                        match = min_match;
                    } else {
                        if (target[key as string] == null) { return; }
                        match = Utils.fuzzy_match(
                            query,
                            case_match ? target[key as string] : (typeof target[key as string] === 'string' ? target[key as string].toLowerCase() : target[key as string]),
                            allow_exceeding_chars
                        );
                    }
                    if (nested_key !== null && (target as any)[nested_key] != null) {
                        calc_sims((target as any)[nested_key]);
                    }
                } else {
                    if (target == null) { return; }
                    match = Utils.fuzzy_match(
                        query, 
                        case_match ? target : (typeof target === 'string' ? target.toLowerCase() : target),
                        allow_exceeding_chars
                    );
                }
                if (match !== null) {
                    results.push([match, target]);
                }
            });
        };

        // Calculate the similarities.
        calc_sims(targets);

        // Sort the results.
        results.sort((a, b) => a[0] - b[0]); // Lower score is better

        // Limit the results.
        if (limit !== null && limit >= 0 && results.length > limit) {
            results.length = limit;
        }

        // Convert the results to targets only.
        if (!get_matches) {
            return results.map(item => item[1]);
        }

        // Return the results.
        return results;
    },

    /* @docs:
        @nav: Frontend
        @chapter: Utils
        @title: Fuzzy Match
        @desc: Perform a fuzzy similarity match between a query and a target.
        @param:
            @name: search
            @desc: The search query.
            @type: string
            @name: target
            @desc: The target string.
            @type: string
            @name: allow_exceeding_chars
            @desc: 
                Allow matches where the single character count of the search query exceeds that of the target.
                So when the query is "aa" and the target is "a" then no match will be given since the "a" count of the target (2) is higher than the query (1).
                The function returns `null` when this flag is enabled and detected.
            @type: boolean
        @return:
            @desc: Returns a floating number indicating the similarity; a lower value represents a better match.
            @type: number | null
    */
    fuzzy_match(search: string, target: string, allow_exceeding_chars: boolean = true): number | null {
        // Check exceeding chars.
        if (!allow_exceeding_chars) {
            // Exceeding length.
            if (search.length > target.length) {
                return null;
            }

            // Create the target count.
            const text_count: Record<string, number> = {};
            for (let i = 0; i < target.length; i++) {
                const c = target.charAt(i);
                text_count[c] = (text_count[c] || 0) + 1;
            }

            // Create the query count.
            const query_count: Record<string, number> = {};
            for (let i = 0; i < search.length; i++) {
                const c = search.charAt(i);
                query_count[c] = (query_count[c] || 0) + 1;
                if (text_count[c] == null || query_count[c] > text_count[c]) {
                    return null;
                }
            }
        }

        // Wrappers.
        const get_search_code = (index: number): number => {
            if (index >= 0 && index < search.length) {
                return search.charCodeAt(index);
            }
            return -1;
        };
        const get_target_code = (index: number): number => {
            if (index >= 0 && index < target.length) {
                return target.charCodeAt(index);
            }
            return -1;
        };
        const prepareBeginningIndexes = (targetStr: string): number[] => {
            const targetLen = targetStr.length;
            const beginningIndexes: number[] = [];
            let wasUpper = false;
            let wasAlphanum = false;
            for (let i = 0; i < targetLen; ++i) {
                const targetCode = targetStr.charCodeAt(i);
                const isUpper = targetCode >= 65 && targetCode <= 90;
                const isAlphanum = isUpper || (targetCode >= 97 && targetCode <= 122) || (targetCode >= 48 && targetCode <= 57);
                const isBeginning = (isUpper && !wasUpper) || !wasAlphanum || !isAlphanum;
                wasUpper = isUpper;
                wasAlphanum = isAlphanum;
                if (isBeginning) beginningIndexes.push(i);
            }
            return beginningIndexes;
        };
        const prepareNextBeginningIndexes = (targetStr: string): number[] => {
            const targetLen = targetStr.length;
            const beginningIndexes = prepareBeginningIndexes(targetStr);
            const nextBeginningIndexes: number[] = [];
            let lastIsBeginning = beginningIndexes[0];
            let lastIsBeginningI = 0;
            for (let i = 0; i < targetLen; ++i) {
                if (lastIsBeginning > i) {
                    nextBeginningIndexes[i] = lastIsBeginning;
                } else {
                    lastIsBeginning = beginningIndexes[++lastIsBeginningI];
                    nextBeginningIndexes[i] = lastIsBeginning === undefined ? targetLen : lastIsBeginning;
                }
            }
            return nextBeginningIndexes;
        };

        // Vars.
        let searchI = 0;
        const searchLen = search.length;
        let searchCode = get_search_code(searchI);
        let searchLower = search.toLowerCase();
        let targetI = 0;
        const targetLen = target.length;
        let targetCode = get_target_code(targetI);
        const targetLower = target.toLowerCase();
        const matchesSimple: number[] = [];
        let matchesSimpleLen = 0;
        let successStrict = false;
        const matchesStrict: number[] = [];
        let matchesStrictLen = 0;

        // Very basic fuzzy match; to remove non-matching targets ASAP!
        // Walk through target. Find sequential matches.
        // If all chars aren't found then exit
        while (true) {
            const isMatch = searchCode === get_target_code(targetI);
            if (isMatch) {
                matchesSimple[matchesSimpleLen++] = targetI;
                searchI++;
                if (searchI === searchLen) break;
                searchCode = get_search_code(searchI);
            }
            targetI++;
            if (targetI >= targetLen) {
                return null; // Failed to find searchI
            }
        }

        searchI = 0;
        targetI = 0;

        const nextBeginningIndexes = prepareNextBeginningIndexes(target);
        targetI = matchesSimple[0] === 0 ? 0 : (nextBeginningIndexes[matchesSimple[0] - 1] || 0);

        // More advanced and strict test to improve the score
        let backtrackCount = 0;
        if (targetI !== targetLen) {
            while (true) {
                if (targetI >= targetLen) {
                    // We failed to find a good spot for this search char, go back to the previous search char and force it forward
                    if (searchI <= 0) break; // We failed to push chars forward for a better match
                    backtrackCount++;
                    if (backtrackCount > 200) break; // Prevent excessive backtracking
                    searchI--;
                    const lastMatch = matchesStrict[--matchesStrictLen];
                    targetI = nextBeginningIndexes[lastMatch] || 0;
                } else {
                    const isMatch = get_search_code(searchI) === get_target_code(targetI);
                    if (isMatch) {
                        matchesStrict[matchesStrictLen++] = targetI;
                        searchI++;
                        if (searchI === searchLen) { successStrict = true; break; }
                        targetI++;
                    } else {
                        targetI = nextBeginningIndexes[targetI] || targetLen;
                    }
                }
            }
        }

        // Check if it's a substring match
        const substringIndex = targetLower.indexOf(searchLower, matchesSimple[0]); // Performance: this is slow
        const isSubstring = substringIndex !== -1;
        let isSubstringBeginning = false;
        if (isSubstring && !successStrict) { // Rewrite the indexes from basic to the substring
            for (let i = 0; i < matchesSimpleLen; ++i) {
                matchesSimple[i] = substringIndex + i;
            }
        }
        if (isSubstring) {
            isSubstringBeginning = nextBeginningIndexes[substringIndex - 1] === substringIndex;
        }

        // Tally up the score & keep track of matches for highlighting later
        let score = 0;
        let matchesBest: number[];
        let matchesBestLen: number;

        if (successStrict) { 
            matchesBest = matchesStrict; 
            matchesBestLen = matchesStrictLen; 
        }
        else { 
            matchesBest = matchesSimple; 
            matchesBestLen = matchesSimpleLen; 
        }

        let extraMatchGroupCount = 0;
        for (let i = 1; i < searchLen; ++i) {
            if (matchesBest[i] - matchesBest[i - 1] !== 1) {
                score -= matchesBest[i]; 
                extraMatchGroupCount++;
            }
        }
        const unmatchedDistance = matchesBest[searchLen - 1] - matchesBest[0] - (searchLen - 1);
        score -= (12 + unmatchedDistance) * extraMatchGroupCount; // Penalty for more groups

        if (matchesBest[0] !== 0) score -= Math.pow(matchesBest[0], 2) * 0.2; // Penalty for not starting near the beginning

        if (!successStrict) {
            score *= 1000;
        } else {
            // successStrict on a target with too many beginning indexes loses points for being a bad target
            let uniqueBeginningIndexes = 1;
            for (let i = nextBeginningIndexes[0]; i < targetLen; i = nextBeginningIndexes[i]) {
                uniqueBeginningIndexes++;
            }
            if (uniqueBeginningIndexes > 24) score *= (uniqueBeginningIndexes - 24) * 10; // Arbitrary penalty
        }

        if (isSubstring)          score /= 1 + Math.pow(searchLen, 2); // Bonus for being a full substring
        if (isSubstringBeginning) score /= 1 + Math.pow(searchLen, 2); // Bonus for substring starting on a beginningIndex

        score -= targetLen - searchLen; // Penalty for longer targets

        return score;
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
    debounce(delay: number, func: (...args: any[]) => void): (...args: any[]) => void {
        let timeout: number | undefined;
        return function(this: any, ...args: any[]) {
            if (timeout !== undefined) {
                clearTimeout(timeout);
            }
            timeout = window.setTimeout(() => func.apply(this, args), delay);
        };
    },

    // Create the on render observer.
    on_render_observer: new ResizeObserver(
        (entries, observer) => {
            entries.forEach(entry => {
                const target = entry.target as any
                if (!target.rendered) {
                    target._on_render_callbacks.iterate((func) => {func(entry.target)});
                    target.rendered = true;
                    (Utils.on_render_observer as ResizeObserver).unobserve(entry.target);
                }
            });
        },
    ),

    // Create the on resize observer.
    on_resize_observer: new ResizeObserver(
        (entries, observer) => {
            entries.forEach(entry => {
                (entry.target as any)._on_resize_callbacks.iterate((func) => {func(entry.target)});
            });
        },
    ),
};

// Export.
export { Utils };
