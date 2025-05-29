/**
 * A Route encapsulates an HTTP method and an endpoint pattern (string, colon-style, or RegExp),
 * and provides a `.match()` method which returns true/false and populates `.params` on success.
 */
export class Route {
    method;
    endpoint;
    endpoint_str;
    id;
    is_regex;
    params = []; // path param names.
    matcher;
    // Inserted only when passed as arg into `match()`.
    matched_params = {};
    /**
     *
     * @param method   HTTP method (e.g. "GET", "post", etc.)
     * @param endpoint  The endpoint parameter supports the following input type.
     *                  - A regex to match against the request URL, or a string with colon-style path parameters.
     *                  - A string supporting colon-style path parameters (e.g. "/user/:id"), and simple `*` and `**` wildcards.
     *                    Ensure the wildcards are encapsulated by / or at the start of end of the string.
     */
    constructor(method, endpoint) {
        // Normalize the method (uppercase, no extra whitespace)
        this.method = method.trim().toUpperCase();
        this.endpoint = endpoint;
        this.is_regex = endpoint instanceof RegExp;
        // Clean endpoint.
        if (typeof this.endpoint === "string") {
            this.endpoint = Route.clean_endpoint(this.endpoint).replace(/\/+$/, "") || "/";
        }
        // If it's a colon-style or wildcard string, compile into matcher
        if (typeof endpoint === "string" && (endpoint.includes(":") || endpoint.includes("*"))) {
            this._create_route_matcher(endpoint);
            this.endpoint_str = endpoint.replace(/\/+$/, "") || "/";
            this.is_regex = true;
        }
        // If it's a RegExp, stringify into a colon/param form
        else if (endpoint instanceof RegExp) {
            this.matcher = undefined;
            this.endpoint_str = Route._stringify_endpoint_regex(endpoint);
        }
        // Otherwise it's a plain literal string
        else {
            this.matcher = undefined;
            this.endpoint_str = endpoint.replace(/\/+$/, "") || "/";
        }
        // Build the unique ID
        this.id = `${this.method}:${this.endpoint_str}`;
    }
    /** Create match args
      * @warning this is required for the `match()` method
      */
    static create_match_args(method, endpoint) {
        return {
            method: method.trim().toUpperCase(),
            endpoint: endpoint.replace(/\/+$/, "") || "/",
        };
    }
    /**
     * Tests this route against another Route (e.g. a “request” Route).
     * Returns true/false and on true populates other.params.
     */
    match(other) {
        // 0) reject regex-vs-regex
        if (this.endpoint instanceof RegExp && other.endpoint instanceof RegExp) {
            return false;
        }
        // 1) method must match
        if (other.method !== this.method) {
            other.matched_params = {};
            return false;
        }
        // 2) this.endpoint is a RegExp (only allowed vs string endpoint)
        if (this.endpoint instanceof RegExp) {
            // other.endpoint is guaranteed to be a string here
            const m = this.endpoint.exec(other.endpoint_str);
            if (!m) {
                other.matched_params = {};
                return false;
            }
            other.matched_params = m.groups ? { ...m.groups } : {};
            return true;
        }
        // 3) colon-style pattern
        if (this.matcher) {
            const result = this.matcher.match(other.endpoint_str);
            if (!result) {
                other.matched_params = {};
                return false;
            }
            other.matched_params = result;
            return true;
        }
        // 4) literal string compare
        other.matched_params = {};
        return this.endpoint_str === other.endpoint_str;
    }
    // ─── Helper: compile colon-style patterns ───
    _create_route_matcher(pattern) {
        const normalized = pattern.replace(/\/+$/, "") || "/";
        this.params.length = 0;
        // const source = normalized
        //     .split(/(:[A-Za-z_$][A-Za-z0-9_$]*)/)
        const source = normalized
            // capture "/:param", "/:param?", "**", or "*"
            .split(/(\/:[A-Za-z_$][A-Za-z0-9_$]*\??|\*\*|\*)/)
            .map(seg => {
            // named or optional param with leading slash
            if (seg.startsWith("/:")) {
                const optional = seg.endsWith("?");
                const name = optional ? seg.slice(2, -1) : seg.slice(2);
                this.params.push({ name, required: !optional });
                // group the slash+segment, make entire group optional if needed
                return optional
                    ? "(?:/([^/]+))?"
                    : "/([^/]+)";
            }
            // single-segment wildcard
            if (seg === "*") {
                return "(?:[^/]+)";
            }
            // multi-segment wildcard
            if (seg === "**") {
                return "(?:.*)";
            }
            // literal text
            return seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        })
            .join("");
        // const source = normalized
        //     // capture :param or :param? or ** or *
        //     .split(/(:[A-Za-z_$][A-Za-z0-9_$]*\??|\*\*|\*)/)
        //     .map(seg => {
        //         // named or optional param
        //         if (seg.startsWith(":")) {
        //             const optional = seg.endsWith("?");
        //             console.log("Raw is optional:", { seg, optional});
        //             const name = optional ? seg.slice(1, -1) : seg.slice(1);
        //             this.params.push({name, required: !optional});
        //             // capture one segment, make optional if needed
        //             return `([^/]${optional ? "*" : "+"})`;
        //         }
        //         // single-segment wildcard
        //         if (seg === "*") {
        //             return "(?:[^/]+)";
        //         }
        //         // multi-segment wildcard
        //         if (seg === "**") {
        //             return "(?:.*)";
        //         }
        //         // literal text
        //         return seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        //         // if (seg.startsWith(":")) {
        //         //     const name = seg.slice(1);
        //         //     this.params.push(name);
        //         //     return "([^/]+)";
        //         // } else {
        //         //     return seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        //         // }
        //     })
        //     .join("");
        const regex = normalized === "/"
            ? /^\/$/
            : new RegExp(`^${source}/?$`);
        this.matcher = {
            regex,
            match: (path) => {
                const m = regex.exec(path);
                if (!m)
                    return;
                const out = {};
                this.params.forEach((k, i) => {
                    out[k.name] = m[i + 1];
                });
                return out;
            },
        };
    }
    // Helper: stringify a RegExp into colon-style │:param placeholders.
    static _stringify_endpoint_regex(re) {
        let src = re.source;
        // strip ^…$ anchors
        src = src.replace(/^\^/, "").replace(/\$$/, "");
        // unescape \/ → /
        src = src.replace(/\\\//g, "/");
        // named groups → :name
        src = src.replace(/\(\?<([^>]+)>[^)]+\)/g, (_m, name) => `:${name}`);
        // anonymous groups → :param1, :param2, …
        let idx = 1;
        src = src.replace(/\((?!\?)[^)]+\)/g, () => `:param${idx++}`);
        return src;
    }
    static clean_endpoint(endpoint) {
        if (endpoint == null || endpoint instanceof RegExp) {
            return endpoint;
        }
        if (endpoint.charAt(0) != "/") {
            endpoint = "/" + endpoint;
        }
        endpoint = endpoint.replaceAll("//", "/");
        if (endpoint.length > 1 && endpoint.charAt(endpoint.length - 1) === "/") {
            endpoint = endpoint.substr(0, endpoint.length - 1);
        }
        return endpoint;
    }
}
