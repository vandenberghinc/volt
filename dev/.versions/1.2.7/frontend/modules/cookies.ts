/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Google } from "./google";

// Cookies object.
const Cookies = {
    _cookies: {} as { [key: string]: string },
    _last_cookies: '',
    _disabled: false,

    // Check if the cookies need to be parsed again.
    /*  @docs:
        @nav: Frontend
        @chapter: Cookies
        @title: Is Parse Required
        @desc: Checks if cookies need to be parsed again.
    */
    is_parse_required(): boolean {
        return document.cookie !== this._last_cookies;
    },

    // Get the cookies or a cookie by name.
    /*  @docs:
        @nav: Frontend
        @chapter: Cookies
        @title: Get cookie
        @desc: Get a cookie by name.
        @experimental: true
        @param: 
            @name: name
            @description The name of the cookie.
    */
    get(name: string | null = null): string | { [key: string]: string } | undefined {
        if (document.cookie === this._last_cookies) {
            if (name != null) {
                return this._cookies[name];
            }
            return this._cookies;
        }

        // Attributes.
        this._cookies = {};
        this._last_cookies = document.cookie;

        // Vars.
        let is_key = true, is_str: string | null = null;
        let key = "", value = "";

        // Wrapper.
        const append = () => {
            if (key.length > 0) {
                this._cookies[key] = value;
            }
            value = "";
            key = "";
            is_key = true;
            is_str = null;
        };

        // Parse.
        for (let i = 0; i < document.cookie.length; i++) {
            const c = document.cookie.charAt(i);

            // Is key.
            if (is_key) {
                if (c === " " || c === "\t") {
                    continue;
                } else if (c === "=") {
                    is_key = false;
                } else {
                    key += c;
                }
            }

            // Is value.
            else {
                // End of string.
                if (is_str != null && is_str === c) {
                    value = value.substr(1, value.length - 1);
                    append();
                }

                // End of cookie.
                else if (c === ";") {
                    append();
                }

                // Append to value.
                else {
                    // Start of string.
                    if (value.length === 0 && (c === "\"" || c === "'")) {
                        is_str = c;
                    }
                    value += c;
                }
            }
        }
        append();
        if (name != null) {
            return this._cookies[name];
        }
        return this._cookies;
    },

    // Check if all the cookies are accepted.
    /*  @docs:
        @nav: Frontend
        @chapter: Cookies
        @title: Has Preference
        @desc: Checks if the user has set a cookie preference (enabled or disabled).
    */
    has_preference(): boolean {
        const pref = localStorage.getItem("vweb_cookies_enabled");
        return pref === "true" || pref === "false";
    },

    // Check if all the cookies are accepted.
    /*  @docs:
        @nav: Frontend
        @chapter: Cookies
        @title: Is Accepted
        @desc: Checks if cookies are accepted by the user.
    */
    is_accepted(): boolean {
        return localStorage.getItem("vweb_cookies_enabled") === "true";
    },

    // Enable cookies (opt-in).
    /*  @docs:
        @nav: Frontend
        @chapter: Cookies
        @title: Enable Cookies
        @desc: Enables cookies (opt-in) and updates the user's preference.
        @param:
            @name: _set_storage
            @description Whether to update the localStorage preference (default: true).
    */
    enable(_set_storage: boolean = true): void {
        this._disabled = true;
        if (_set_storage) {
            localStorage.setItem("vweb_cookies_enabled", "true");
        }
        Google.disable_tracking();
    },

    // Disable cookies (opt-out).
    /*  @docs:
        @nav: Frontend
        @chapter: Cookies
        @title: Disable Cookies
        @desc: Disables cookies (opt-out) and updates the user's preference.
        @param:
            @name: _set_storage
            @description Whether to update the localStorage preference (default: true).
    */
    disable(_set_storage: boolean = true): void {
        this._disabled = false;
        if (_set_storage) {
            localStorage.setItem("vweb_cookies_enabled", "false");
        }
        Google.enable_tracking();
    },

    // Initialize the cookies.
    _init(): void {
        if (this.is_accepted()) {
            this.enable(false);
        } else {
            this.disable(false);
        }
    }
};

// Initialize cookies on load.
Cookies._init();

// Export.
export { Cookies };
