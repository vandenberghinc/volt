/**
 * @author Daan van den Bergh
 * @copyright © 2025 - 2025 Daan van den Bergh. All rights reserved.
 */
// ---------------------------------------------------------
// Imports.
import * as vlib from "@vandenberghinc/vlib";
import { Transform } from "node:stream";
import * as fs from "node:fs";
import { pipeline } from "node:stream";
import * as zlib from "node:zlib";
import RateLimits from './rate_limit.js';
import { Utils } from "./utils.js";
const { debug } = vlib;
// ---------------------------------------------------------
// Request object.
/**
 * The http2 stream wrapper object.
 *
 * @property headers The request headers.
 *
 * @nav Stream
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
    /** The cached value of {@link normalize_ip} */
    _normalized_ip;
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
    /**
     * Retrieve the normalized IP address, suitable for rate limiting and logging.
     * @throws {Error} If the IP is invalid.
     * @returns The normalized IP.
     * @docs
     */
    normalized_ip() {
        if (this._normalized_ip != null) {
            return this._normalized_ip;
        }
        return this._normalized_ip = RateLimits.normalize_ip(this._ip);
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
    // DEPRECATED since its only available for http2.
    // /**
    //  * Check if the stream is closed.
    //  *
    //  * @example
    //  * ```ts
    //  * const ip = stream.closed;
    //  * ```
    //  * @docs
    //  */
    // get closed(): boolean {
    //     if (!this.http2) { throw new Error("This function is only supported for http2 streams."); }
    //     return this.s!.closed;
    // }
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
    /**
     * Apply templates to an in-memory body.
     * Only applies to string bodies to avoid corrupting binary payloads.
     */
    apply_templates_to_body(input, templates) {
        // Skip when there are no templates.
        if (templates == null || Object.keys(templates).length === 0) {
            return input;
        }
        // Only apply templates to string bodies.
        if (typeof input !== "string") {
            return input;
        }
        // Replace all template keys with their stringified values.
        let out = input;
        for (const key of Object.keys(templates)) {
            const value = templates[key];
            // Convert non-string template values to a string.
            const value_str = typeof value === "string" ? value : JSON.stringify(value);
            // Replace all occurrences of the key.
            out = out.split(`{{${key}}}`).join(value_str);
        }
        return out;
    }
    /**
     * Create a transform stream that applies templates across chunk boundaries.
     * This avoids missing replacements when a template key is split between chunks.
     */
    create_template_replace_transform(templates) {
        // Precompute keys and the longest key length for boundary-safe streaming.
        const keys = Object.keys(templates);
        const max_key_len = keys.reduce((max, k) => Math.max(max, k.length), 0);
        // Keep enough tail bytes to cover a key split between chunks.
        const keep_len = Math.max(0, max_key_len - 1);
        // Carry tail across chunks.
        let carry = "";
        return new Transform({
            transform(chunk, _enc, cb) {
                try {
                    // Merge with carry to handle split keys across chunks.
                    const str = carry + chunk.toString("utf8");
                    // Keep a tail so we don't split a key.
                    const cut_idx = Math.max(0, str.length - keep_len);
                    const safe_head = str.slice(0, cut_idx);
                    // Persist the tail for the next chunk.
                    carry = str.slice(cut_idx);
                    // Replace templates in the safe head.
                    let out = safe_head;
                    for (const key of keys) {
                        const value = templates[key];
                        const value_str = typeof value === "string" ? value : JSON.stringify(value);
                        out = out.split(`{{${key}}}`).join(value_str);
                    }
                    cb(null, out);
                }
                catch (err) {
                    cb(err);
                }
            },
            flush(cb) {
                try {
                    // Flush remaining carry.
                    let out = carry;
                    for (const key of keys) {
                        const value = templates[key];
                        const value_str = typeof value === "string" ? value : JSON.stringify(value);
                        out = out.split(`{{${key}}}`).join(value_str);
                    }
                    cb(null, out);
                }
                catch (err) {
                    cb(err);
                }
            },
        });
    }
    /** Remove content length header from headers. */
    remove_content_length_header(headers) {
    }
    /** Create output headers for http2. */
    create_http2_headers(status, new_headers) {
        // Convert ResponseHeaderValue to Node-compatible header values.
        const normalize_header_value = (v) => {
            if (v == null)
                return undefined;
            if (typeof v === "boolean")
                return v ? "true" : "false";
            if (typeof v === "number")
                return v;
            if (typeof v === "string")
                return v;
            return String(v);
        };
        // Start with any headers set earlier via set_header/set_headers.
        const out_headers = {
            ":status": status,
        };
        // Merge previously queued headers for http2.
        if (!Array.isArray(this.res_headers)) {
            for (const [k, v] of Object.entries(this.res_headers)) {
                const nv = normalize_header_value(v);
                if (nv !== undefined)
                    out_headers[k] = nv;
            }
        }
        // Merge call-specific headers last so they win.
        for (const [k, v] of Object.entries(new_headers)) {
            const nv = normalize_header_value(v);
            if (nv !== undefined)
                out_headers[k] = nv;
        }
        // Attach any cookies staged via set_cookie/set_cookies.
        if (this.res_cookies.length > 0) {
            out_headers["set-cookie"] = this.res_cookies;
        }
        return out_headers;
    }
    /** Assign http headers to response. */
    set_http1_headers(status, headers) {
        if (!this.res) {
            throw new Error("HTTP/1.1 response is missing.");
        }
        // Set status code.
        this.res.statusCode = status;
        // Set headers.
        for (let i = 0; i < this.res_headers.length; i++) {
            this.res.setHeader(this.res_headers[i][0], this.res_headers[i][1]);
        }
        Object.keys(headers).forEach((key) => {
            const v = headers[key];
            if (v != null) {
                this.res?.setHeader(key, typeof v === "boolean" ? v.toString() : v);
            }
        });
    }
    /**
     * Send a response.
     * @example
     * ```ts
     * stream.send({status: 200, data: "Hello World!"});
     * ```
     * @docs
     */
    send({ status = 200, headers = {}, data, compress = false, from_file, templates, }) {
        // Assign sent status code.
        this.status_code = status;
        // The body to send as non `ResponseBody` type.
        let body = data;
        // Convert body primitivies to string.
        if (typeof body === "boolean" || typeof body === "number") {
            body = body.toString();
        }
        // -----------------------------------------
        // Helpers.
        /** Get the accept-encoding header from the request. */
        const get_accept_encoding = () => {
            // Prefer the cached request headers on the stream wrapper.
            // For http2 these are the real pseudo/header map; for http1 this is req.headers.
            const accept_encoding = this.headers?.["accept-encoding"];
            if (typeof accept_encoding === "string") {
                return accept_encoding;
            }
            // Node can sometimes provide a string[] header shape.
            if (Array.isArray(accept_encoding) && accept_encoding.length > 0) {
                return accept_encoding.join(", ");
            }
            // Fallback to the raw http1 request headers if present.
            const req_accept_encoding = this.req?.headers?.["accept-encoding"];
            if (typeof req_accept_encoding === "string") {
                return req_accept_encoding;
            }
            if (Array.isArray(req_accept_encoding) && req_accept_encoding.length > 0) {
                return req_accept_encoding.join(", ");
            }
            // Default when header is absent.
            return "";
        };
        // Apply templates to in-memory bodies before any compression.
        body = this.apply_templates_to_body(body, templates);
        // -----------------------------------------
        // HTTP2
        // -----------------------------------------
        if (this.http2) {
            const stream = this.s;
            // Create http headers.
            const out_headers = this.create_http2_headers(status, headers);
            // -------------------------------------------------------
            // From_file fast path (http2)
            // -------------------------------------------------------
            if (from_file) {
                const from_path = from_file instanceof vlib.Path ? from_file : new vlib.Path(from_file);
                // Only apply templates when defined.
                const needs_template_replace = templates != null && Object.keys(templates).length > 0;
                const should_gzip = compress
                    && get_accept_encoding().includes("gzip")
                    && !(Utils.is_compressed_extension(from_path.extension()) ?? false);
                // Add content type.
                const content_type = Utils.mime_type(from_path.extension());
                if (content_type && out_headers["Content-Type"] == null && out_headers["content-type"] == null) {
                    out_headers["content-type"] = content_type;
                }
                // Only apply templates to text-like responses.
                const is_text_response = typeof content_type === "string"
                    && (content_type.startsWith("text/")
                        || content_type === "application/javascript"
                        || content_type === "application/json"
                        || content_type === "image/svg+xml"
                        || content_type === "application/xml"
                        || content_type === "text/xml");
                const should_apply_templates = needs_template_replace && is_text_response;
                // Only set gzip headers if we actually gzip.
                if (should_gzip) {
                    out_headers["content-encoding"] = "gzip";
                    out_headers["vary"] = "Accept-Encoding";
                    // Do not set content-length when streaming gzip.
                    delete out_headers["content-length"];
                    delete out_headers["Content-Length"];
                }
                // Do not set content-length when template replacement is enabled.
                if (should_apply_templates) {
                    delete out_headers["content-length"];
                    delete out_headers["Content-Length"];
                }
                // If we are NOT gzipping and NOT replacing, use respondWithFile for best performance.
                if (!should_gzip && !should_apply_templates && typeof stream.respondWithFile === "function") {
                    // respondWithFile handles opening/streaming internally.
                    stream.respondWithFile(from_path.toString(), out_headers, {});
                    if (debug.on(3))
                        debug("Sending http2 file response: ", status, " - file: ", from_path.toString());
                    this.finished = true;
                    return this;
                }
                // Manual stream for gzip and/or template replacement.
                stream.respond(out_headers);
                const file_read_stream = fs.createReadStream(from_path.toString());
                const transforms = [];
                // Replace templates on-the-fly for text-like responses.
                if (should_apply_templates) {
                    transforms.push(this.create_template_replace_transform(templates));
                }
                // Stream gzip to avoid blocking the event loop.
                if (should_gzip) {
                    transforms.push(zlib.createGzip({ level: zlib.constants.Z_BEST_COMPRESSION }));
                }
                // Pipe: file -> (template_replace?) -> (gzip?) -> http2 stream.
                pipeline(file_read_stream, ...transforms, stream, (err) => {
                    if (err) {
                        // Close the stream to avoid leaking resources on pipeline error.
                        try {
                            stream.close();
                        }
                        catch { }
                    }
                });
                if (debug.on(3))
                    debug("Sending http2 streamed file response: ", status, " - file: ", from_path.toString());
                this.finished = true;
                return this;
            }
            // -------------------------------------------------------
            // Normal body path (http2)
            // -------------------------------------------------------
            else {
                // Is json.
                if (body && typeof body === "object" && Buffer.isBuffer(body) === false && (body instanceof Uint8Array) === false) {
                    out_headers["content-type"] = "application/json";
                    body = JSON.stringify(body);
                    // Apply templates after stringify, since body just became a string.
                    body = this.apply_templates_to_body(body, templates);
                }
                // Convert objects to string (kept from your logic).
                if (body
                    && typeof body === "object"
                    && !(body instanceof Buffer)
                    && !(body instanceof Uint8Array)) {
                    body = JSON.stringify(body);
                    // Apply templates after stringify.
                    body = this.apply_templates_to_body(body, templates);
                }
                const should_gzip_body = compress
                    && !!body
                    && get_accept_encoding().includes("gzip");
                if (should_gzip_body) {
                    out_headers["content-encoding"] = "gzip";
                    out_headers["vary"] = "Accept-Encoding";
                    // No content-length if we compress asynchronously.
                    delete out_headers["content-length"];
                    delete out_headers["Content-Length"];
                }
                // Respond.
                stream.respond(out_headers);
                // End.
                if (debug.on(3))
                    debug("Sending response: ", status, " - has body: ", !!body);
                if (!body) {
                    stream.end();
                    this.finished = true;
                    return this;
                }
                // gzip async (non-blocking) for in-memory bodies.
                else if (should_gzip_body) {
                    const raw_buffer = (typeof body === "string")
                        ? Buffer.from(body)
                        : (Buffer.isBuffer(body) || body instanceof Uint8Array)
                            ? Buffer.from(body)
                            : Buffer.from(JSON.stringify(body));
                    zlib.gzip(raw_buffer, { level: zlib.constants.Z_BEST_COMPRESSION }, (err, gz_buffer) => {
                        if (err) {
                            // Fallback: send uncompressed if gzip fails.
                            stream.end(raw_buffer);
                            return;
                        }
                        stream.end(gz_buffer);
                    });
                    this.finished = true;
                    return this;
                }
                // Non-gzipped body path.
                else {
                    if (Buffer.isBuffer(body) || body instanceof Uint8Array) {
                        stream.end(body);
                    }
                    else {
                        stream.end(Buffer.from(body));
                    }
                    this.finished = true;
                    return this;
                }
            }
        }
        // -----------------------------------------
        // HTTP1
        // -----------------------------------------
        else {
            const req = this.req;
            const res = this.res;
            // Set http1 headers.
            this.set_http1_headers(status, headers);
            // -------------------------------------------------------
            // From_file path (http1)
            // -------------------------------------------------------
            if (from_file) {
                // Ensure we dont create a new path if not needed, to use caching.
                const from_path = from_file instanceof vlib.Path ? from_file : new vlib.Path(from_file);
                // Add content type.
                const content_type = Utils.mime_type(from_path.extension());
                if (content_type) {
                    res.setHeader("Content-Type", content_type);
                }
                // Only apply templates when defined.
                const needs_template_replace = templates != null && Object.keys(templates).length > 0;
                // Only apply templates to text-like responses.
                const is_text_response = typeof content_type === "string"
                    && (content_type.startsWith("text/")
                        || content_type === "application/javascript"
                        || content_type === "application/json"
                        || content_type === "image/svg+xml"
                        || content_type === "application/xml"
                        || content_type === "text/xml");
                const should_apply_templates = needs_template_replace && is_text_response;
                const should_gzip = compress
                    && get_accept_encoding().includes("gzip")
                    && !(Utils.is_compressed_extension(from_path.extension()) ?? false);
                // If we gzip, do not set content-length (streaming).
                if (should_gzip) {
                    res.setHeader("Content-Encoding", "gzip");
                    res.setHeader("Vary", "Accept-Encoding");
                    res.removeHeader("Content-Length");
                }
                else if (!should_apply_templates) {
                    // Only set content-length when no transforms are applied.
                    try {
                        if (from_path.is_file()) {
                            res.setHeader("Content-Length", from_path.size);
                        }
                    }
                    catch {
                        // Ignore stat errors, stream will error if file missing.
                    }
                }
                // If we replace templates, content-length is not reliable.
                if (should_apply_templates) {
                    res.removeHeader("Content-Length");
                }
                const file_read_stream = fs.createReadStream(from_path.toString());
                const transforms = [];
                // Replace templates on-the-fly for text-like responses.
                if (should_apply_templates) {
                    transforms.push(this.create_template_replace_transform(templates));
                }
                // Stream gzip to avoid blocking event loop.
                if (should_gzip) {
                    transforms.push(zlib.createGzip({ level: zlib.constants.Z_BEST_COMPRESSION }));
                }
                // Pipe: file -> (template_replace?) -> (gzip?) -> http1 response.
                pipeline(file_read_stream, ...transforms, res, (err) => {
                    if (err) {
                        // Destroy the response to stop work on error.
                        try {
                            res.destroy(err);
                        }
                        catch { }
                    }
                });
                if (debug.on(3))
                    debug("Sending http1 streamed file response: ", status, " - file: ", from_path.toString());
                this.finished = true;
                return this;
            }
            // -------------------------------------------------------
            // Normal body path (http1)
            // -------------------------------------------------------
            else {
                // Convert data.
                if (body && typeof body === "object" && Buffer.isBuffer(body) === false && (body instanceof Uint8Array) === false) {
                    res.setHeader("Content-Type", "application/json");
                    body = JSON.stringify(body);
                    // Apply templates after stringify.
                    body = this.apply_templates_to_body(body, templates);
                }
                const should_gzip_body = compress
                    && !!body
                    && get_accept_encoding().includes("gzip");
                // gzip async (non-blocking)
                if (should_gzip_body) {
                    res.setHeader("Content-Encoding", "gzip");
                    res.setHeader("Vary", "Accept-Encoding");
                    res.removeHeader("Content-Length");
                    const raw_buffer = (typeof body === "string")
                        ? Buffer.from(body)
                        : (Buffer.isBuffer(body) || body instanceof Uint8Array)
                            ? Buffer.from(body)
                            : Buffer.from(JSON.stringify(body));
                    zlib.gzip(raw_buffer, { level: zlib.constants.Z_BEST_COMPRESSION }, (err, gz_buffer) => {
                        if (err) {
                            res.end(raw_buffer);
                            return;
                        }
                        res.end(gz_buffer);
                    });
                    if (debug.on(3))
                        debug("Sending http1 response: ", status, " - has body: ", !!body, " - gzip: true");
                }
                // Set data.
                else if (body) {
                    res.end(body); // Do not use toString() here or it will cause issues with writing binary data.
                }
                else {
                    res.end();
                }
                // Set as finished.
                this.finished = true;
                return this;
            }
        }
    }
    // send<Data extends ResponseBody = ResponseBody>({
    //     status = 200,
    //     headers = {},
    //     data,
    //     compress = false,
    // }: {
    //     status?: number,
    //     headers?: ResponseHeaders,
    //     data?: Data,
    //     compress?: boolean
    // } = {}): this {
    //     // Assign sent status code.
    //     this.status_code = status;
    //     // The body to send as non `ResponseBody` type.
    //     let body = data as ResponseBody;
    //     // Convert body primitivies to string.
    //     if (typeof body === 'boolean' || typeof body === 'number') {
    //         body = body.toString();
    //     }
    //     // HTTP2.
    //     if (this.http2) {
    //         const stream = this.s as ServerHttp2Stream;
    //         // Headers.
    //         this.res_headers[":status"] = status;
    //         this.set_headers(headers);
    //         if (this.res_cookies.length > 0) {
    //             this.res_headers["set-cookie"] = this.res_cookies;
    //         }
    //         if (compress && body) {
    //             this.res_headers["Content-Encoding"] = "gzip";
    //             this.res_headers["Vary"] = "Accept-Encoding";
    //         }
    //         // Is json.
    //         if (body && typeof body === 'object' && Buffer.isBuffer(body) === false && (body instanceof Uint8Array) === false) {
    //             this.res_headers["Content-Type"] = "application/json";
    //             body = JSON.stringify(body);
    //         }
    //         // Compress.
    //         if (
    //             body
    //             && typeof body === "object"
    //             && !(body instanceof Buffer)
    //             && !(body instanceof Uint8Array)
    //         ) {
    //             // Convert to string.
    //             body = JSON.stringify(body);
    //         }
    //         if (
    //             compress
    //             && body
    //         ) {
    //             if (
    //                 typeof body === 'string'
    //                 || Buffer.isBuffer(body)
    //                 || body instanceof Uint8Array
    //             ) {
    //                 body = zlib.gzipSync(body, { level: zlib.constants.Z_BEST_COMPRESSION });
    //             } else {
    //                 body = zlib.gzipSync(JSON.stringify(body), { level: zlib.constants.Z_BEST_COMPRESSION });
    //             }
    //         }
    //         // Respond.
    //         stream.respond(this.res_headers as any)
    //         // End.
    //         debug(3, "Sending response: ", status, " - has body: ", !!body);
    //         if (body) {
    //             if (Buffer.isBuffer(body) || body instanceof Uint8Array) {
    //                 stream.end(body);
    //             } else {
    //                 stream.end(Buffer.from(body as any));
    //             }
    //             // stream.end(body); // do not use toString() here or it will cause issues with writing binary data.
    //         } else {
    //             stream.end();
    //         }
    //     }
    //     // HTTP1.
    //     else {
    //         const req = this.req as IncomingMessage;
    //         const res = this.res as ServerResponse;
    //         // Set status code.
    //         res.statusCode = status;
    //         // Set headers.
    //         for (let i = 0; i < this.res_headers.length; i++) {
    //             res.setHeader(this.res_headers[i][0], this.res_headers[i][1]);
    //         }
    //         Object.keys(headers).forEach((key) => {
    //             const v = headers[key];
    //             if (v != null) {
    //                 if (typeof v === "boolean") {
    //                     res.setHeader(key, v.toString());
    //                 } else {
    //                     res.setHeader(key, v);
    //                 }
    //             }
    //         });
    //         // Set cookies.
    //         if (this.cookies.length > 0) {
    //             res.setHeader('Set-Cookie', this.res_cookies);
    //         }
    //         // Convert data.
    //         if (body && typeof body === 'object' && Buffer.isBuffer(body) === false && (body instanceof Uint8Array) === false) {
    //             res.setHeader("Content-Type", "application/json");
    //             body = JSON.stringify(body);
    //         }
    //         // @todo compress.
    //         if (compress && body) {
    //             res.setHeader("Content-Encoding", "gzip");
    //             res.setHeader("Vary", "Accept-Encoding");
    //             body = zlib.gzipSync(body, { level: zlib.constants.Z_BEST_COMPRESSION });
    //         }
    //         // Set data.
    //         if (body) {
    //             res.end(body); // do not use toString() here or it will cause issues with writing binary data.
    //         }
    //         // End.
    //         else {
    //             res.end();
    //         }
    //     }
    //     // Set as finished.
    //     this.finished = true;
    //     return this;
    // }
    // Send a successs response.
    /**
     * Send a response
     *
     * @param options The response options.
     * @param options.status The response status.
     * @param options.headers The response headers.
     * @param options.data The data of the response body to send.
     * @param options.compress Whether the response should be gzip-compressed.
     * @example
     * ```ts
     * stream.success({data: "Hello World!"});
     * ```
     * @docs
     */
    success({ status = 200, headers = {}, data, from_file, compress = false } = {}) {
        if (debug.on(3))
            debug("Sending [success] response: ", status, " - body: ", data);
        return this.send({ status, headers, data, compress, from_file });
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
     * @param options.data Optional data to include in the error response, nested in the JSON response under field `data`.
     * @example
     * ```ts
     * stream.error({ message: "Some error occurred", status: 400 });
     * ```
     * @docs
     */
    error({ message, type = "APIError", invalid_fields = {}, status = 500, headers = {}, compress = false, data, }) {
        if (debug.on(3))
            debug("Sending [error] response: ", status, " - message: ", message);
        const api_error = {
            error: {
                type,
                message,
                status,
                invalid_fields,
            },
            data,
        };
        return this.send({ status, headers, compress, data: api_error });
    }
    /**
     * Stream a response through a transform pipeline with an optional gzip step and a hard byte limit.
     *
     * @param options Pipeline options.
     * @param options.status The HTTP status code to send.
     * @param options.headers The response headers to send.
     * @param options.body The readable stream to pipe into the response.
     * @param options.transforms Optional transform streams applied in order.
     * @param options.compress When true, gzip-compresses the streamed response if the client supports it.
     * @param options.max_bytes The maximum number of bytes allowed to be written to the client.
     *                          Set to `-1` for unlimited (use with caution).
     */
    pipeline({ status = 200, headers = {}, body, transforms = [], compress = false, max_bytes = 10 * 1024 * 1024, }) {
        // Prevent double-sending on the same stream wrapper.
        if (this.finished) {
            throw new Error("Cannot pipeline a response that has already been finished.");
        }
        // Validate the status code early for predictable responses.
        if (!Number.isInteger(status) || status < 100 || status > 599) {
            throw new Error("Invalid status code.");
        }
        // Validate the max_bytes limit to prevent unbounded streaming.
        if (!Number.isFinite(max_bytes)) {
            throw new Error("Invalid max_bytes value.");
        }
        // Validate transform list to avoid accidental misuse and runaway pipelines.
        if (!Array.isArray(transforms) || transforms.length > 32) {
            throw new Error("Invalid transforms configuration.");
        }
        // Assign the sent status code for bookkeeping.
        this.status_code = status;
        // Mark as finished once we start writing headers and streaming.
        this.finished = true;
        // Create all streams list in the order they should be applied.
        const all_streams = [body, ...transforms];
        // Resolve accept-encoding from request headers for gzip negotiation.
        const accept_encoding_header = this.headers?.["accept-encoding"];
        const accept_encoding = typeof accept_encoding_header === "string"
            ? accept_encoding_header
            : Array.isArray(accept_encoding_header)
                ? accept_encoding_header.join(", ")
                : "";
        // Detect if a content-encoding is already set to avoid double-compressing.
        const has_content_encoding = (() => {
            for (const k of Object.keys(headers ?? {})) {
                if (k.toLowerCase() === "content-encoding")
                    return true;
            }
            const existing = this.get_header("Content-Encoding") ?? this.get_header("content-encoding");
            return existing != null;
        })();
        // Decide whether to gzip based on client support and existing encoding.
        const should_gzip = compress === true && accept_encoding.includes("gzip") && !has_content_encoding;
        // Append gzip as a transform so we stream-compress without buffering.
        if (should_gzip) {
            all_streams.push(zlib.createGzip({ level: zlib.constants.Z_BEST_COMPRESSION }));
        }
        // Create a hard byte limiter to protect memory/bandwidth and stop abuse.
        if (max_bytes >= 0) {
            let written = 0;
            const limiter = new Transform({
                transform(chunk, _enc, cb) {
                    written += chunk.length;
                    if (written > max_bytes) {
                        cb(new Error("Response exceeded max_bytes."));
                        return;
                    }
                    cb(null, chunk);
                },
            });
            all_streams.push(limiter);
        }
        // Prepare a cleanup routine to stop work when the client disconnects or a stream errors.
        const cleanup = (err) => {
            for (const s of all_streams) {
                if ("destroy" in s && typeof s.destroy === "function") {
                    s.destroy(err);
                }
            }
        };
        // Send headers and start piping depending on protocol.
        if (this.http2) {
            // Ensure the underlying HTTP/2 stream exists.
            const h2 = this.s;
            if (!h2) {
                throw new Error("HTTP/2 stream is missing.");
            }
            // Start with any headers set earlier via set_header/set_headers.
            const out_headers = this.create_http2_headers(status, headers);
            // Set gzip headers only when we actually gzip.
            if (should_gzip) {
                out_headers["content-encoding"] = "gzip";
                out_headers["vary"] = "Accept-Encoding";
            }
            // Strip content-length because streaming/transforms make it unreliable.
            delete out_headers["content-length"];
            delete out_headers["Content-Length"];
            // Write headers once, before streaming data.
            h2.respond(out_headers);
            // Abort work when the client disconnects.
            h2.once("close", () => { cleanup(new Error("Client disconnected.")); });
            // Pipe: body -> transforms... -> (gzip?) -> (limiter?) -> http2 stream.
            pipeline(...all_streams, h2, (err) => {
                if (err) {
                    // Destroy the stream to stop further writes on error.
                    cleanup(err instanceof Error ? err : new Error("Pipeline failed."));
                    try {
                        h2.close();
                    }
                    catch { }
                }
            });
            return this;
        }
        else {
            // HTTP/1.1 response path.
            const res = this.res;
            if (!res) {
                throw new Error("HTTP/1.1 response is missing.");
            }
            // Set http1 headers.
            this.set_http1_headers(status, headers);
            // Set gzip headers only when we actually gzip.
            if (should_gzip) {
                res.setHeader("Content-Encoding", "gzip");
                res.setHeader("Vary", "Accept-Encoding");
            }
            // Strip content-length because streaming/transforms make it unreliable.
            res.removeHeader("Content-Length");
            // Abort work when the client disconnects.
            res.once("close", () => { cleanup(new Error("Client disconnected.")); });
            // Pipe: body -> transforms... -> (gzip?) -> (limiter?) -> http1 response.
            pipeline(...all_streams, res, (err) => {
                if (err) {
                    // Destroy the response to stop further writes on error.
                    cleanup(err instanceof Error ? err : new Error("Pipeline failed."));
                    try {
                        res.destroy();
                    }
                    catch { }
                }
            });
        }
        return this;
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
    /**
     * Get an added header.
     *
     * @param name The header name.
     * @example
     * ```ts
     * stream.get_header("Connection");
     * ```
     * @docs
     */
    get_header(name) {
        if (this.http2) {
            return this.res_headers[name];
        }
        else {
            return this.res_headers.find((header) => header[0] === name)?.[1];
        }
    }
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
