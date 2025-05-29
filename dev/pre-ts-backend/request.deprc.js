/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 *
 * DEPRECATED
 */

// ---------------------------------------------------------
// Imports.

const zlib = require('zlib');

// ---------------------------------------------------------
// Request object.
/*  @docs 
 *  @nav: Backend
 *  @chapter: Stream
 *  @title: Request
 *  @description: The request object.
 *  @deprecated: true
 */
class Request {

    // Constructor.
    constructor(req) {

        // Arguments.
        this.req = req;

        // Body.
        this.body = "";

        // Decompress data.
        const content_encoding = req.headers['content-encoding'];
        if (content_encoding === "gzip" || content_encoding === "deflate") {
            let stream;
            if (content_encoding === "gzip") {
                stream = zlib.createGunzip();
            } else if (content_encoding === "deflate") {
                stream = zlib.createInflate();
            }
            req.pipe(stream)
            stream.on("data", (data) => {
                this.body += data.toString();
            })
            this.promise = new Promise((resolve) => {
                stream.on("end", () => {
                    resolve();
                })
            })
        }

        // Create a promise to await the incoming data.
        else {
            this.req.on("data", (data) => {
                this.body += data.toString();
            })
            this.promise = new Promise((resolve) => {
                this.req.on("end", () => {
                    resolve();
                })
            })
        }

        // Copy all lowercase functions.
        this.on = this.req.on.bind(this.req);
        // this.cork = this.req.cork.bind(this.req);
        this.destroy = this.req.destroy.bind(this.req);
        // this.uncork = this.req.uncork.bind(this.req);
        // this.write = this.req.write.bind(this.req);

        // Create lowercase functions.
        // this.flush_headers = this.req.flushHeaders.bind(this.req);
        // this.get_header = this.req.getHeader.bind(this.req);
        // this.get_header_names = this.req.getHeaderNames.bind(this.req);
        // this.get_headers = this.req.getHeaders.bind(this.req);
        // this.get_raw_header_names = this.req.getRawHeaderNames.bind(this.req);
        // this.has_header = this.req.hasHeader.bind(this.req);
        // this.max_headers_count = this.req.maxHeadersCount.bind(this.req);
        // this.remove_header = this.req.removeHeader.bind(this.req);
        // this.set_header = this.req.setHeader.bind(this.req);
        // this.set_no_delay = this.req.setNoDelay.bind(this.req);
        // this.set_socket_keep_alive = this.req.setSocketKeepAlive.bind(this.req);
        this.set_timeout = this.req.setTimeout;

        // Attributes.
        this._params = undefined;
        this._is_query_params = false;
        this._endpoint = undefined;
        this._query_string = undefined;
        this._cookies = undefined;
        this._uid = null;
    }

    // ---------------------------------------------------------
    // Utils.

    // Parse endpoint.
    _parse_endoint() {
        if (this._endpoint !== undefined) {return}
        this._endpoint = this.req.url;
        let index;
        if ((index = this._endpoint.indexOf("?")) !== -1) {
            this._query_string =  this._endpoint.substr(index + 1);
            this._endpoint =  this._endpoint.substr(0, index);
        }
        this._endpoint = this._endpoint.replaceAll("//", "/");
        if (this._endpoint.length > 1 && this._endpoint.charAt(this._endpoint.length - 1) === "/") {
            this._endpoint = this._endpoint.substr(0, this._endpoint.length - 1);
        }
    }

    // Parse the parameters.
    _parse_params() {

        // Parse query string.
        this._parse_endoint();

        // Already parsed.
        if (this._params !== undefined) {return}

        // Initialize.
        this._params = {};

        // By query string.
        if (this._query_string !== undefined) {

            // As encoded json.
            if (this._query_string.charAt(0) === "{") {
                try {
                    this._params = JSON.parse(decodeURIComponent(this._query_string));
                } catch(err) {
                    throw Error(`Invalid json request query: ${err}.`)
                }
            }

            // As query string.
            else {
                this._is_query_params = true;
                let is_key = true, key = "", value = "";
                for (let i = 0; i < this._query_string.length; i++) {
                    const c = this._query_string.charAt(i);
                    if (is_key && c === "=") {
                        is_key = false;
                        continue;
                    } else if (is_key === false && c === "&") {
                        this._params[decodeURIComponent(key)] = decodeURIComponent(value);
                        key = "";
                        value = "";
                        is_key = true;
                        continue;
                    }
                    if (is_key) {
                        key += c;
                    } else {
                        value += c;
                    }
                }
                if (key.length > 0) {
                    this._params[decodeURIComponent(key)] = decodeURIComponent(value);
                }
            }
        }

        // By body.
        else if (this.body.first_not_of([" ", "\t", "\n", "\r"]) === "{") {
            try {
                this._params = JSON.parse(this.body);
            } catch(err) {
                throw Error(`Invalid json request body: ${err}.`)
            }
        }

        // Handler.
        return this._params;
    }

    // Parse cookies.
    _parse_cookies(name, request) {

        // Reset cookies.
        this._cookies = {};

        // Vars.
        const cookie_str = this.req.headers.cookie;
        if (cookie_str === undefined) { return null; }
        let key = "";
        let value = "";
        let cookie = {};
        let cookie_length = 0;
        let cookie_key = null;
        let is_value = false;
        let is_str = null;

        // Append to cookie.
        const append_to_cookie = () => {
            if (key.length > 0) {
                if (cookie_length === 0) {
                    cookie.value = value;
                } else {
                    cookie[key] = value;
                }
                ++cookie_length;
            }
            key = "";
            value = "";
            is_value = false;
            is_str = null;
        }

        // Append cookie.
        const append_cookie = () => {
            if (cookie_key !== null) {
                this._cookies[cookie_key] = cookie;
                cookie_key = null;
                cookie = {};
                cookie_length = 0;
            }
        }

        // Iterate.
        for (let x = 0; x < cookie_str.length; x++) {
            const c = cookie_str.charAt(x);

            // Add char to value.
            if (is_value) {

                // End of cookie string.
                if (is_str === c) {
                    value = value.substr(1, value.length - 1);
                    append_to_cookie();
                }

                // Cookie seperator.
                else if (is_str === null && c === " ") {
                    append_to_cookie();
                }

                // End of cookie.
                else if (is_str === null && c === ";") {
                    append_to_cookie();
                    append_cookie();

                }
                
                // Append to value.
                else {
                    value += c;
                    if (value.length === 1 && (c === "\"" || c === "'")) {
                        is_str = c;
                    }
                }
            }

            // Skip whitespace in keys.
            else if (c == " " || c == "\t") {
                continue;
            }

            // End of cookie key.
            else if (c == "=") {
                if (cookie_key === null) {
                    cookie_key = key;
                }
                is_value = true;
            }

            // Add char to key.
            else {
                key += c;
            }
        }
        append_to_cookie();
        append_cookie();
    }

    // ---------------------------------------------------------
    // Functions.

    // Get the requests ip.
	/*  @docs:
     *  @title: IP
     *  @description: Get the request's ip.
	 *  @property: true
     *  @usage:
     *      ...
     *      const ip = request.ip;
     */
    get ip() {
        return this.req.socket.remoteAddress;
    }

    // Get the requests port.
	/*  @docs:
     *  @title: Port
     *  @description: Get the request's port.
	 *  @property: true
     *  @usage:
     *      ...
     *      const port = request.port;
     */
    get port() {
        return this.req.socket.remotePort;
    }

    // Get the authenticated uid.
    /*  @docs:
     *  @title: UID
     *  @description: Get the authenticated uid, is `null` when the request was not authenticated.
     *  @property: true
     *  @type: number
     *  @usage:
     *      ...
     *      const uid = request.uid;
     */
    get uid() {
        return this._uid;
    }
    set uid(value) {
        this._uid = value;
    }

    // Get the endpoint.
	/*  @docs:
     *  @title: Endpoint
     *  @description: Get the request's endpoint. This will not include the query string.
	 *  @property: true
	 *  @type: string
     *  @usage:
     *      ...
     *      const endpoint = request.endpoint;
     */
    get endpoint() {
        if (this._endpoint !== undefined) {
            return this._endpoint;
        }
        this._parse_endoint();
        return this._endpoint;
    }

    // Get the params.
	/*  @docs:
     *  @title: Parameters
     *  @description: Get the request's query or body params.
	 *  property: true
	 *  @type: object
     *  @usage:
     *      ...
     *      const params = request.params;
     */
    get params() {
        if (this._params !== undefined) {
            return this._params;
        }
        this._parse_params();
        return this._params;
    }

    // Get a param by name and optionally by type.
	/*  @docs:
     *  @title: Parameter
     *  @description: Get a single query or body parameter with an optional type cast.
	 *  @warning: Throws an error when the parameter does not exist or when the type is different from the specified type(s), unless parameter `def` is defined.
	 *  @param:
	 *  	@name: name
	 *  	@desc: The name of the parameter.
	 *  	@type: string
	 *  @param:
	 *  	@name: type
	 *  	@desc: The type cast of the parameters, valid types are `[null, "boolean", "number", "string", "array", "object"]`.
	 *  	@type: string
     *  @param:
     *      @name: def
     *      @desc: 
     *          The default value to return when the parameter does not exist. 
     *
     *          If the parameter is not defined and `def` is `undefined` then this function will throw an error. 
     *          When `def` is `undefined` errors will be thrown, when `def` is `null` and the parameter is undefined then `null` will be returned as the default value.
     *
     *          Errors will always be thrown when the incorrect type has been sent by the user.
     *      @type: any
     *  @usage:
     *      ...
     *      const param = request.param("myparameter", "number", 10);
     */
    param(name, type = null, def = undefined) {

        // Parse params.
        this._parse_params();

        // Get value.
        let value = this._params[name];

        // Check type.
        if (type !== null) {

            // Vars.
            let is_type_array = Array.isArray(type);

            // Wrapper funcs.
            const type_str = () => {
                let str = "";
                if (type !== null) {
                    str += " type "
                    if (is_type_array) {
                        let i = 0, one_but_last_i = type.length - 2;
                        type.iterate((item) => {
                            str += `"${item}"`;
                            if (i < one_but_last_i) {
                                str += ", ";
                            } else if (i === one_but_last_i) {
                                str += " or ";
                            }
                        })
                    } else {
                        str += `"${type}"`;
                    }
                }
                return str;
            }
            const type_eq_or_includes = (match) => {
                if (is_type_array) {
                    return type.includes(match);
                }
                return match === type;
            }

            // Check undefined.
            if (value == null || value === "") {
                if (def !== undefined) {
                    return def;
                }
                throw Error(`Define parameter "${name}"${type_str()}.`)
            }

            // Cast the value to another type when a query string was used.
            if (this._is_query_params && type_eq_or_includes("string") === false) {
                if (is_type_array === false) {
                    type = [type];
                }
                const success = type.iterate((type) => {
                    
                    // Convert to string.
                    if (type === "string") {
                        return true;
                    }

                    // Convert to null.
                    if (type === "null" && value === "null") {
                        value = null;
                        return true;
                    }

                    // Convert to boolean.
                    const is_bool = type === "boolean";
                    if (is_boolean && value === "true") {
                        value = true;
                        return true;
                    }
                    if (is_boolean && value === "false") {
                        value = false;
                        return true;
                    }

                    // Convert to array.
                    if (value === "array") {
                        value = value.split(",");
                        return true;
                    }

                    // Convert to object.
                    if (value === "object") {
                        const split = value.split(",");
                        value = {};
                        split.iterate((item) => {
                            const pair = item.split(":")
                            value[pair[0]] = pair[1];
                        })
                        return true;
                    }

                    // Convert to numeric.
                    if (type === "number" && value.is_numeric_string()) {
                        value = parseFloat(value);
                        return true;
                    }
                })
                if (success !== true) {
                    throw Error(`Parameter "${name} should be of"${type_str()}.`)
                }

            }

            // Check the type when no query params are defined since JSON.parse already parsed the types.
            else if (this._is_query_params === false) {
                const value_type = typeof value;
                if (is_type_array === false) {
                    type = [type];
                }
                const success = type.iterate((type) => {
                    const l_is_array = type === "array";
                    const l_is_null = type === "null";

                    // Same type.
                    if (l_is_array === false && l_is_null === false && type === value_type) {
                        return true;
                    }

                    // Check to null.
                    if (l_is_null && value === null) {
                        return true;
                    }

                    // Convert to array.
                    if (l_is_array && Array.isArray(value)) {
                        return true;
                    }
                })
                if (success !== true) {
                    throw Error(`Parameter "${name} should be of"${type_str()}.`)
                }
            }
        }

        // Check undefined.
        else if (value == null || value === "") {
            if (def !== undefined) {
                return def;
            }
            throw Error(`Define parameter "${name}".`)
        }

        // Return value.
        return value;
    }

    // Get the cookies.
    /*  @docs:
     *  @title: Cookies
     *  @description: Get the request's cookies
     *  property: true
     *  @type: object
     *  @usage:
     *      ...
     *      const cookies = request.cookies;
     */
    get cookies() {
        if (this._cookies !== undefined) {
            return this._cookies;
        }
        this._parse_cookies();
        return this._cookies;
    }

    // ---------------------------------------------------------
    // Inherit get and set functions.

    get headers() {
        return this.req.headers;
    }
    get destroyed() {
        return this.req.destroyed;
    }
    set destroyed(val) {
        this.req.destroyed = val;
    }
    get path() {
        return this.req.path;
    }
    set path(val) {
        this.req.path = val;
    }
    get method() {
        return this.req.method;
    }
    set method(val) {
        this.req.method = val;
    }
    get url() {
        return this.req.url;
    }
    set url(val) {
        this.req.url = val;
    }
    get host() {
        return this.req.host;
    }
    set host(val) {
        this.req.host = val;
    }
    get protocol() {
        return this.req.protocol;
    }
    set protocol(val) {
        this.req.protocol = val;
    }
    get reused_socket() {
        return this.req.reusedSocket;
    }
    set reused_socket(val) {
        this.req.reusedSocket = val;
    }
    get socket() {
        return this.req.socket;
    }
    set socket(val) {
        this.req.socket = val;
    }
    get writable_ended() {
        return this.req.writableEnded;
    }
    set writable_ended(val) {
        this.req.writableEnded = val;
    }
    get writable_finished() {
        return this.req.writableFinished;
    }
    set writable_finished(val) {
        this.req.writableFinished = val;
    }
}

// ---------------------------------------------------------
// Exports.

module.exports = Request;
