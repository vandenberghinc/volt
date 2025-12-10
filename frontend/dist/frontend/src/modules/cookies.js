/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
// Imports.
import { Google } from "./google.js";
// Cookies object.
export var Cookies;
(function (Cookies) {
    let _cookies = {};
    let _last_cookies = '';
    Cookies.enabled = false;
    /**
     * Checks if cookies need to be parsed again.
     * @docs
     */
    function is_parse_required() {
        return document.cookie !== _last_cookies;
    }
    Cookies.is_parse_required = is_parse_required;
    /**
     * Get cookies or a specific cookie by name.
     * @experimental true
     * @param name The name of the cookie.
     * @docs
     */
    function get(name = null) {
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
        let is_key = true, is_str = null;
        let key = "", value = "";
        // Wrapper.
        const append = () => {
            if (key.length > 0) {
                _cookies[key] = decodeURIComponent(value);
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
                }
                else if (c === "=") {
                    is_key = false;
                }
                else {
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
    Cookies.get = get;
    /**
     * Checks if the user has set a cookie preference (enabled or disabled).
     * @docs
     */
    function has_preference() {
        const pref = localStorage.getItem("volt_cookies_enabled");
        return pref === "true" || pref === "false";
    }
    Cookies.has_preference = has_preference;
    // Check if all the cookies are accepted.
    /**
     * Checks if cookies are accepted by the user.
     * @docs
     */
    function is_accepted() {
        return localStorage.getItem("volt_cookies_enabled") === "true";
    }
    Cookies.is_accepted = is_accepted;
    /**
     * Enables cookies (opt-in) and updates the user's preference.
     * @param _set_storage Whether to update the localStorage preference (default: true).
     * @docs
     */
    function enable(_set_storage = true) {
        Cookies.enabled = true;
        if (_set_storage) {
            localStorage.setItem("volt_cookies_enabled", "true");
        }
        Google.disable_tracking();
    }
    Cookies.enable = enable;
    /**
     * Disables cookies (opt-out) and updates the user's preference.
     * @param _set_storage Whether to update the localStorage preference (default: true).
     * @docs
     */
    function disable(_set_storage = true) {
        Cookies.enabled = false;
        if (_set_storage) {
            localStorage.setItem("volt_cookies_enabled", "false");
        }
        Google.enable_tracking();
    }
    Cookies.disable = disable;
    // Initialize cookies.
    if (is_accepted())
        enable(false);
    else
        disable(false);
})(Cookies || (Cookies = {}));
export { Cookies as cookies }; // also export as lowercase for compatibility.
