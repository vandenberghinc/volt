/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */


// Cookies object.
vweb.cookies = {};

// Check if the cookies need to be parsed again.
vweb.cookies.is_parse_required = function() {
    return document.cookie !== this._last_cookies;
    //
}

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
vweb.cookies.get = function(name = null) {
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
    let is_key = true, is_str = null;
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
    }

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
                if (value.length === 0 && (c === "\"" || c=== "'")) {
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
}

// Check if all the cookies are accepted.
vweb.cookies.has_preference = function() {
    const pref = localStorage.getItem("vweb_cookies_enabled");
    return pref === "true" || pref === "false";
}

// Check if all the cookies are accepted.
vweb.cookies.is_accepted = function() {
    return localStorage.getItem("vweb_cookies_enabled") === "true";
}

// Enable cookies (opt-in).
vweb.cookies.enable = function(_set_storage = true) {
    this._disabled = true;
    if (_set_storage) {
        localStorage.setItem("vweb_cookies_enabled", "true");
    }
    vweb.google.disable_tracking();
}

// Disable cookies (opt-out).
vweb.cookies.disable = function(_set_storage = true) {
    this._disabled = false;
    if (_set_storage) {
        localStorage.setItem("vweb_cookies_enabled", "false");
    }
    vweb.google.enable_tracking();
}

// Initialize the cookies.
vweb.cookies._init = function() {
    if (this.is_accepted()) {
        vweb.cookies.enable(false);
    } else {
        vweb.cookies.disable(false);
    }
}
vweb.cookies._init();