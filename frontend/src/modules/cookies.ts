/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Google } from "./google.js";

// Cookies object.
export namespace Cookies {
    let _cookies: { [key: string]: string } = {};
    let _last_cookies = '';
    export let enabled = false;

    /**
     * Checks if cookies need to be parsed again.
     * @docs
     */
    export function is_parse_required(): boolean {
        return document.cookie !== _last_cookies;
    }

    /**
     * Get cookies or a specific cookie by name.
     * @experimental true
     * @param name The name of the cookie.
     * @docs
     */
    export function get(name: string | null = null): string | { [key: string]: string } | undefined {
        if (document.cookie === _last_cookies) {
            if (name != null) {
                return _cookies[name];
            }
            return _cookies;
        }

        // Attributes.
        _cookies = {};
        _last_cookies = document.cookie;

        // Vars.
        let is_key = true, is_str: string | null = null;
        let key = "", value = "";

        // Wrapper.
        const append = () => {
            if (key.length > 0) {
                _cookies[key] = value;
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
            return _cookies[name];
        }
        return _cookies;
    }

    /**
     * Checks if the user has set a cookie preference (enabled or disabled).
     * @docs
     */
    export function has_preference(): boolean {
        const pref = localStorage.getItem("volt_cookies_enabled");
        return pref === "true" || pref === "false";
    }

    // Check if all the cookies are accepted.
    /**
     * Checks if cookies are accepted by the user.
     * @docs
     */
    export function is_accepted(): boolean {
        return localStorage.getItem("volt_cookies_enabled") === "true";
    }

    /**
     * Enables cookies (opt-in) and updates the user's preference.
     * @param _set_storage Whether to update the localStorage preference (default: true).
     * @docs
     */
    export function enable(_set_storage: boolean = true): void {
        enabled = true;
        if (_set_storage) {
            localStorage.setItem("volt_cookies_enabled", "true");
        }
        Google.disable_tracking();
    }

    /**
     * Disables cookies (opt-out) and updates the user's preference.
     * @param _set_storage Whether to update the localStorage preference (default: true).
     * @docs
     */
    export function disable(_set_storage: boolean = true): void {
        enabled = false;
        if (_set_storage) {
            localStorage.setItem("volt_cookies_enabled", "false");
        }
        Google.enable_tracking();
    }

    // Initialize cookies.
    if (is_accepted()) enable(false);
    else disable(false);
}
export { Cookies as cookies }; // also export as lowercase for compatibility.

