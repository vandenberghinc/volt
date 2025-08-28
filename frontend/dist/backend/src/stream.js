/**
 * @author Daan van den Bergh
 * @copyright © 2025 - 2025 Daan van den Bergh. All rights reserved.
 */
// ---------------------------------------------------------
// Imports.
import zlib from 'zlib';
import * as vlib from "@vandenberghinc/vlib";
const { debug } = vlib;
// ---------------------------------------------------------
// Request object.
/**
 * The http2 stream wrapper object.
 *
 * @property headers The request headers.
 * @docs
 */
export class Stream {
    s;
    headers;
    req;
    res;
    http2;
    http1;
    _ip;
    _port;
    _method;
    _params;
    _is_query_params;
    _endpoint;
    _query_string;
    _cookies;
    _uid;
    status_code;
    finished;
    res_cookies;
    res_headers;
    body;
    promise;
    /**
     * Create a new Stream wrapper for HTTP/1.1 or HTTP/2.
     *
     * @param stream The HTTP/2 stream (when using HTTP/2).
     * @param headers The request headers.
     * @param req The HTTP/1.1 request (when using HTTP/1.1).
     * @param res The HTTP/1.1/HTTP/2 response object.
     */
    constructor(stream, headers, req, res) {
        // Parameters.
        this.s = stream;
        this.headers = (headers ?? {});
        this.req = req;
        this.res = res;
        this.http2 = req == null;
        this.http1 = req != null;
        // HTTP1.
        if (this.http1) {
            this.headers = this.req.headers;
        }
        // Request attributes.
        this._ip = this.http2 ? this.s.session.socket.remoteAddress : this.req.socket.remoteAddress;
        this._port = this.http2 ? this.s.session.socket.remotePort : this.req.socket.remotePort;
        this._method = this.http2 ? this.headers[':method'] : this.req.method;
        this._params = undefined;
        this._is_query_params = false;
        this._endpoint = undefined;
        this._query_string = undefined;
        this._cookies = undefined;
        this._uid = undefined;
        // Response attributes
        this.status_code = undefined;
        this.finished = false;
        this.res_cookies = [];
        this.res_headers = this.http1 ? [] : {};
        // Read body.
        this.body = "";
        this.promise = undefined;
        this._recv_body();
    }
    /**
     * Receive and buffer the request body, handling optional gzip/deflate decompression.
     * Sets {@link body} and resolves the internal promise used by {@link join}.
     * @private
     */
    _recv_body() {
        this.promise = new Promise((resolve, reject) => {
            // Buffers.
            const buffs = [];
            // Get decompress stream.
            let decompress_stream;
            const content_encoding = this.headers['content-encoding'];
            if (content_encoding === 'gzip') {
                decompress_stream = zlib.createGunzip();
            }
            else if (content_encoding === 'deflate') {
                decompress_stream = zlib.createInflate();
            }
            const cleanup = () => {
                if (decompress_stream) {
                    decompress_stream.close();
                }
            };
            // HTTP2.
            if (this.http2) {
                let stream = this.s;
                // If decompression is needed, pipe the stream through the decompression stream
                if (decompress_stream) {
                    stream = this.s.pipe(decompress_stream);
                    // decompress_stream.on('error', (e) => { cleanup(); reject(e); });
                }
                // On error.
                stream.on('error', (e) => { cleanup(); reject(e); });
                // Receive data.
                stream.on('data', (chunk) => {
                    buffs.push(chunk);
                });
                stream.on('end', () => {
                    this.body = Buffer.concat(buffs).toString();
                    cleanup();
                    resolve();
                });
            }
            // HTTP1.
            else {
                let stream = this.req;
                // Decompress data.
                if (decompress_stream) {
                    this.req.pipe(decompress_stream);
                    stream = decompress_stream;
                }
                // On error.
                stream.on('error', (e) => { cleanup(); reject(e); });
                // Receive data.
                stream.on("data", (data) => {
                    buffs.push(data);
                });
                stream.on("end", () => {
                    this.body = Buffer.concat(buffs).toString();
                    cleanup();
                    resolve();
                });
            }
        });
    }
    /**
     * Parse and cache the request endpoint and query string.
     * Populates {@link _endpoint} and {@link _query_string}.
     * @private
     */
    _parse_endoint() {
        if (this._endpoint !== undefined) {
            return;
        }
        this._endpoint = this.http2 ? this.headers[":path"] : this.req.url;
        let index;
        if ((index = this._endpoint.indexOf("?")) !== -1) {
            this._query_string = this._endpoint.substr(index + 1);
            this._endpoint = this._endpoint.substr(0, index);
        }
        this._endpoint = this._endpoint.replace(/\/\//g, "/");
        if (this._endpoint.length > 1 && this._endpoint.charAt(this._endpoint.length - 1) === "/") {
            this._endpoint = this._endpoint.substr(0, this._endpoint.length - 1);
        }
    }
    /**
     * Parse and cache request parameters from the query string or JSON body.
     * Returns the parsed params map.
     */
    _parse_params() {
        // Parse query string.
        this._parse_endoint();
        // Already parsed.
        if (this._params !== undefined) {
            return;
        }
        // Initialize.
        this._params = {};
        // By query string.
        if (this._query_string !== undefined) {
            // As encoded json.
            if (this._query_string.charAt(0) === "{") {
                try {
                    this._params = JSON.parse(decodeURIComponent(this._query_string));
                }
                catch (err) {
                    throw Error(`Invalid json request query: ${err}.`);
                }
            }
            // As query string.
            else {
                // Assign.
                this._is_query_params = true;
                // Variables.
                let is_key = true, key = "", value = "";
                const number_regex = /^-?\d+(\.\d+)?$/;
                // Callback.
                const add_value = () => {
                    let output_value;
                    switch (value) {
                        case "true":
                        case "True":
                            output_value = true;
                            break;
                        case "false":
                        case "False":
                            output_value = false;
                            break;
                        case "null":
                        case "None":
                        case "undefined":
                            output_value = null;
                            break;
                        default:
                            output_value = decodeURIComponent(value.replaceAll("+", " "));
                            if (number_regex.test(output_value)) {
                                if (output_value.indexOf(".") !== -1) {
                                    output_value = parseFloat(output_value);
                                }
                                else {
                                    output_value = parseInt(output_value);
                                }
                            }
                            break;
                    }
                    this._params[decodeURIComponent(key.replaceAll("+", " "))] = output_value;
                    key = "";
                    value = "";
                    is_key = true;
                };
                // Iterate
                for (let i = 0; i < this._query_string.length; i++) {
                    const c = this._query_string.charAt(i);
                    if (is_key && c === "=") {
                        is_key = false;
                        continue;
                    }
                    else if (is_key === false && c === "&") {
                        add_value();
                        continue;
                    }
                    if (is_key) {
                        key += c;
                    }
                    else {
                        value += c;
                    }
                }
                if (key.length > 0) {
                    add_value();
                }
            }
        }
        // By body.
        else if (this.body.trim().charAt(0) === "{") {
            try {
                this._params = JSON.parse(this.body);
            }
            catch (err) {
                throw Error(`Invalid json request body: ${err}.`);
            }
        }
        // Handler.
        return this._params;
    }
    /**
     * Parses & returns the cookies  cookies,
     * while assigning it to {@link _cookies}
     *
     * @warning On subsequent calls cookies will be parsed again.
    */
    _parse_cookies() {
        // Reset cookies.
        this._cookies = {};
        // Vars.
        const cookie_str = this.http2 ? this.headers["cookie"] : this.req.headers.cookie;
        if (cookie_str == null) {
            return this._cookies;
        }
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
                }
                else {
                    cookie[key] = value;
                }
                ++cookie_length;
            }
            key = "";
            value = "";
            is_value = false;
            is_str = null;
        };
        // Append cookie.
        const append_cookie = () => {
            if (cookie_key != null) {
                this._cookies[cookie_key] = cookie;
                cookie_key = null;
                cookie = {};
                cookie_length = 0;
            }
        };
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
                else if (is_str == null && c === " ") {
                    append_to_cookie();
                }
                // End of cookie.
                else if (is_str == null && c === ";") {
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
                if (cookie_key == null) {
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
        return this._cookies;
    }
    // ---------------------------------------------------------
    // Functions.
    /**
     * Wait until the request body is fully received.
     * Resolves when the internal receive promise completes.
     */
    async join() {
        await this.promise;
    }
    // Get the requests ip.
    /**
     * Get the request's ip.
     *
     * @example
     * ```ts
     * const ip = stream.ip;
     * ```
     * @docs
     */
    get ip() {
        return this._ip;
    }
    // Get the requests port.
    /**
     * Get the request's port.
     *
     * @example
     * ```ts
     * const port = stream.port;
     * ```
     * @docs
     */
    get port() {
        return this._port;
    }
    // Get the method.
    /**
     * Get the request method.
     *
     * @example
     * ```ts
     * const method = stream.method;
     * ```
     * @docs
     */
    get method() {
        return this._method;
    }
    // Get the endpoint.
    /**
     * Get the request's endpoint. This will not include the query string.
     *
     * @example
     * ```ts
     * const endpoint = stream.endpoint;
     * ```
     * @docs
     */
    get endpoint() {
        if (this._endpoint !== undefined) {
            return this._endpoint;
        }
        this._parse_endoint();
        return this._endpoint;
    }
    // Get the params.
    /**
     * Get the request's query or body params.
     *
     * @example
     * ```ts
     * const params = stream.params;
     * ```
     * @docs
     */
    get params() {
        if (this._params !== undefined) {
            return this._params;
        }
        this._parse_params();
        return this._params;
    }
    /** Add a param (used by the server backend for path parameters). */
    add_param(name, value) {
        if (!this._params) {
            this._params = {};
        }
        this._params[name] = value;
    }
    // Get a param by name and optionally by type.
    /**
     * Get a single query or body parameter with an optional type cast.
     *
     * @warning Throws an error when the parameter does not exist or when the type is different from the specified type(s), unless parameter `def` is defined.
     *
     * @param name The name of the parameter.
     * @param type The type cast of the parameters, valid types are `[null, "boolean", "number", "string", "array", "object"]`.
     * @param def
     *          The default value to return when the parameter does not exist.
     *
     *          If the parameter is not defined and `def` is `undefined` then this function will throw an error.
     *          When `def` is `undefined` errors will be thrown, when `def` is `null` and the parameter is undefined then `null` will be returned as the default value.
     *
     *          Errors will always be thrown when the incorrect type has been sent by the user.
     * @example
     * ```ts
     * const param = stream.param("myparameter", "number", 10);
     * ```
     * @docs
     */
    param(name, type = null, def = undefined) {
        // Parse params.
        this._parse_params();
        // Get value.
        let value = this._params[name];
        // Check type.
        if (type != null) {
            // Vars.
            let is_type_array = Array.isArray(type);
            // Wrapper funcs.
            const type_str = () => {
                let str = "";
                if (type != null) {
                    str += " type ";
                    if (is_type_array) {
                        let i = 0, one_but_last_i = type.length - 2;
                        type.forEach((item, i) => {
                            str += `"${item}"`;
                            if (i < one_but_last_i) {
                                str += ", ";
                            }
                            else if (i === one_but_last_i) {
                                str += " or ";
                            }
                        });
                    }
                    else {
                        str += `"${type}"`;
                    }
                }
                return str;
            };
            const type_eq_or_includes = (match) => {
                if (is_type_array) {
                    return type.includes(match);
                }
                return match === type;
            };
            // Check undefined.
            if (value == null || value === "") {
                if (def !== undefined) {
                    return def;
                }
                throw Error(`Define parameter "${name}"${type_str()}.`);
            }
            // Cast the value to another type when a query string was used.
            if (this._is_query_params && type_eq_or_includes("string") === false) {
                if (is_type_array === false) {
                    type = [type];
                }
                const success = type.some((type) => {
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
                    const is_boolean = type === "boolean";
                    if (is_boolean && value === "true") {
                        value = true;
                        return true;
                    }
                    if (is_boolean && value === "false") {
                        value = false;
                        return true;
                    }
                    // Convert to array.
                    if (type === "array") {
                        value = value.split(",");
                        return true;
                    }
                    // Convert to object.
                    if (type === "object") {
                        const split = value.split(",");
                        value = {};
                        split.forEach((item) => {
                            const pair = item.split(":");
                            value[pair[0]] = pair[1];
                        });
                        return true;
                    }
                    // Convert to numeric.
                    if (type === "number" && /^-?\d+(\.\d+)?$/.test(value)) {
                        value = parseFloat(value);
                        return true;
                    }
                });
                if (!success) {
                    throw Error(`Parameter "${name}" should be of${type_str()}.`);
                }
            }
            // Check the type when no query params are defined since JSON.parse already parsed the types.
            else if (!this._is_query_params) {
                const value_type = typeof value;
                if (!is_type_array) {
                    type = [type];
                }
                const success = type.some((type) => {
                    const l_is_array = type === "array";
                    const l_is_null = type === "null";
                    // Same type.
                    if (!l_is_array && !l_is_null && type === value_type) {
                        return true;
                    }
                    // Check to null.
                    if (l_is_null && value == null) {
                        return true;
                    }
                    // Convert to array.
                    if (l_is_array && Array.isArray(value)) {
                        return true;
                    }
                });
                if (!success) {
                    throw Error(`Parameter "${name}" should be of${type_str()}.`);
                }
            }
        }
        // Check undefined.
        else if (value == null || value === "") {
            if (def !== undefined) {
                return def;
            }
            throw Error(`Define parameter "${name}".`);
        }
        // Return value.
        return value;
    }
    // Get the request cookies.
    /**
     * Get the request's cookies
     *
     * @example
     * ```ts
     * const cookies = stream.cookies;
     * ```
     * @docs
     */
    get cookies() {
        if (this._cookies != null)
            return this._cookies;
        return this._parse_cookies();
    }
    // Check if the stream is closed
    /**
     * Check if the stream is closed.
     *
     * @example
     * ```ts
     * const ip = stream.closed;
     * ```
     * @docs
     */
    get closed() {
        if (!this.http2) {
            throw new Error("This function is only supported for http2 streams.");
        }
        return this.s.closed;
    }
    // Check if the stream is destroyed
    /**
     * Check if the stream is destroyed.
     *
     * @example
     * ```ts
     * const ip = stream.destroyed;
     * ```
     * @docs
     */
    get destroyed() {
        if (this.http2) {
            return this.s.destroyed;
        }
        else {
            return this.req.destroyed;
        }
    }
    // ---------------------------------------------------------
    // Functions.
    // Get the authenticated uid.
    /**
     * Get the authenticated uid; `undefined` when the request was not authenticated.
     *
     * @example
     * ```ts
     * const uid = stream.uid;
     * ```
     * @docs
     */
    get uid() {
        return this._uid;
    }
    set uid(value) {
        this._uid = value;
    }
    // Send a response.
    /**
     * Send a response.
     *
     * @param options The response options.
     * @param options.status The response status.
     * @param options.headers The response headers.
     * @param options.body The response body.
     * @param options.data The response data. (Deprecated.)
     * @param options.compress Whether the response should be gzip-compressed.
     * @example
     * ```ts
     * stream.send({status: 200, data: "Hello World!"});
     * ```
     * @docs
     */
    send({ status = 200, headers = {}, data, body = data, // zero-copy pull in data
    // body,data,
    compress = false, } = {}) {
        // if (data) {
        //     body = data;
        // }
        /** @warning @todo  */
        // compress = false; // @todo @tmp
        // Assign sent status code.
        this.status_code = status;
        // Convert body primitivies to string.
        if (typeof body === 'boolean' || typeof body === 'number') {
            body = body.toString();
        }
        // HTTP2.
        if (this.http2) {
            const stream = this.s;
            // Headers.
            this.res_headers[":status"] = status;
            this.set_headers(headers);
            if (this.res_cookies.length > 0) {
                this.res_headers["set-cookie"] = this.res_cookies;
            }
            if (compress && body) {
                this.res_headers["Content-Encoding"] = "gzip";
                this.res_headers["Vary"] = "Accept-Encoding";
            }
            // Is json.
            if (body && typeof body === 'object' && Buffer.isBuffer(body) === false && (body instanceof Uint8Array) === false) {
                this.res_headers["Content-Type"] = "application/json";
                body = JSON.stringify(body);
            }
            // Compress.
            if (body
                && typeof body === "object"
                && !(body instanceof Buffer)
                && !(body instanceof Uint8Array)) {
                // Convert to string.
                body = JSON.stringify(body);
            }
            if (compress
                && body) {
                if (typeof body === 'string'
                    || Buffer.isBuffer(body)
                    || body instanceof Uint8Array) {
                    body = zlib.gzipSync(body, { level: zlib.constants.Z_BEST_COMPRESSION });
                }
                else {
                    body = zlib.gzipSync(JSON.stringify(body), { level: zlib.constants.Z_BEST_COMPRESSION });
                }
            }
            // Respond.
            stream.respond(this.res_headers);
            // End.
            debug(3, "Sending response: ", status, " - has body: ", !!body);
            if (body) {
                if (Buffer.isBuffer(body) || body instanceof Uint8Array) {
                    stream.end(body);
                }
                else {
                    stream.end(Buffer.from(body));
                }
                // stream.end(body); // do not use toString() here or it will cause issues with writing binary data.
            }
            else {
                stream.end();
            }
        }
        // HTTP1.
        else {
            const req = this.req;
            const res = this.res;
            // Set status code.
            res.statusCode = status;
            // Set headers.
            for (let i = 0; i < this.res_headers.length; i++) {
                res.setHeader(this.res_headers[i][0], this.res_headers[i][1]);
            }
            Object.keys(headers).forEach((key) => {
                const v = headers[key];
                if (v != null) {
                    if (typeof v === "boolean") {
                        res.setHeader(key, v.toString());
                    }
                    else {
                        res.setHeader(key, v);
                    }
                }
            });
            // Set cookies.
            if (this.cookies.length > 0) {
                res.setHeader('Set-Cookie', this.res_cookies);
            }
            // Convert data.
            if (body && typeof body === 'object' && Buffer.isBuffer(body) === false && (body instanceof Uint8Array) === false) {
                res.setHeader("Content-Type", "application/json");
                body = JSON.stringify(body);
            }
            // @todo compress.
            if (compress && body) {
                res.setHeader("Content-Encoding", "gzip");
                res.setHeader("Vary", "Accept-Encoding");
                body = zlib.gzipSync(body, { level: zlib.constants.Z_BEST_COMPRESSION });
            }
            // Set data.
            if (body) {
                res.end(body); // do not use toString() here or it will cause issues with writing binary data.
            }
            // End.
            else {
                res.end();
            }
        }
        // Set as finished.
        this.finished = true;
        return this;
    }
    // Send a successs response.
    /**
     * Send a response
     *
     * @param options The response options.
     * @param options.status The response status.
     * @param options.headers The response headers.
     * @param options.body The response data.
     * @param options.data The response data. (Deprecated.)
     * @param options.compress Whether the response should be gzip-compressed.
     * @example
     * ```ts
     * stream.success({data: "Hello World!"});
     * ```
     * @docs
     */
    success({ status = 200, headers = {}, body = undefined, data = undefined, compress = false } = {}) {
        debug(3, "Sending [success] response: ", status, " - body: ", body ?? data);
        return this.send({ status: status, headers: headers, body: body ?? data, compress: compress });
    }
    // Send an error response.
    /**
     * Send an error response
     *
     * @param options The error response options.
     * @param options.message The error message.
     * @param options.type The error type.
     * @param options.invalid_fields The invalid fields when validation fails.
     * @param options.status The response status.
     * @param options.headers The response headers.
     * @param options.compress Whether the response should be gzip-compressed.
     * @param options.data Optional data to include in the error response.
     * @example
     * ```ts
     * stream.error({ message: "Some error occurred", status: 400 });
     * ```
     * @docs
     */
    error({ message, type = "APIError", invalid_fields = {}, status = 500, headers = {}, compress = false, data = undefined, }) {
        debug(3, "Sending [error] response: ", status, " - message: ", message);
        const api_error = {
            error: {
                type,
                message,
                status,
                invalid_fields,
            },
            data: data,
        };
        return this.send({ status: status, headers: headers, compress: compress, body: api_error });
    }
    // Set headers.
    /**
     * Add a new header to the response data.
     *
     * @param name The header name.
     * @param value The header value.
     * @example
     * ```ts
     * stream.set_header("Connection", "close");
     * ```
     * @docs
     */
    set_header(name, value) {
        if (this.http2) {
            this.res_headers[name] = value;
        }
        else {
            this.res_headers.append([name, value]);
        }
        return this;
    }
    // Set headers.
    /**
     * Add new headers to the response data.
     *
     * @param headers The new response headers.
     * @example
     * ```ts
     * stream.set_headers({"Connection": "close"});
     * ```
     * @docs
     */
    set_headers(headers = {}) {
        if (headers == null) {
            return this;
        }
        if (this.http2) {
            Object.keys(headers).forEach((key) => {
                this.res_headers[key] = headers[key];
            });
        }
        else {
            Object.keys(headers).forEach((key) => {
                this.res_headers.append([key, headers[key]]);
            });
        }
        return this;
    }
    // Remove header.
    /**
     * Remove header names from the response data.
     *
     * @param names The header names to remove.
     * @example
     * ```ts
     * stream.remove_header("Connection", "User-Agent");
     * ```
     * @docs
     */
    remove_header(...names) {
        if (this.http1) {
            const headers = [];
            for (let i = 0; i < this.res_headers.length; i++) {
                if (!names.includes(this.res_headers[i][0])) {
                    headers.push(this.res_headers[i]);
                }
            }
            this.res_headers = headers;
        }
        else {
            for (let i = 0; i < names.length; i++) {
                delete this.res_headers[names[i]];
            }
        }
        return this;
    }
    /**
     * Alias of {@link remove_header}.
     *
     * @param names The header names to remove.
     */
    remove_headers(...names) {
        return this.remove_header(...names);
    }
    // Set a cookie.
    /**
     * Set a cookie that will be sent with the response.
     *
     * @warning Will only be added to the response when the user uses `send()`, `success()` or `error()`.
     * @param cookie The cookie string.
     * @example
     * ```ts
     * stream.set_cookie("MyCookie=Hello World;");
     * ```
     * @docs
     */
    set_cookie(cookie) {
        cookie = cookie.trim();
        const name_end = cookie.indexOf("=");
        if (name_end !== -1) {
            const name = cookie.substr(0, name_end);
            for (let i = 0; i < this.res_cookies.length; i++) {
                if (this.res_cookies[i].startsWith(name)) {
                    this.res_cookies[i] = cookie;
                    return this;
                }
            }
        }
        this.res_cookies.push(cookie);
        return this;
    }
    // Set cookies.
    /**
     * Set cookies that will be sent with the response.
     *
     * @warning Will only be added to the response when the user uses `send()`, `success()` or `error()`.
     * @param cookies The cookie strings.
     * @example
     * ```ts
     * stream.set_cookies("MyCookie1=Hello World;", "MyCookie2=Hello Universe;");
     * ```
     * @docs
     */
    set_cookies(...cookies) {
        for (let i = 0; i < cookies.length; i++) {
            this.set_cookie(cookies[i]);
        }
        return this;
    }
}
;
;
// ---------------------------------------------------------
// Exports.
export default Stream;
