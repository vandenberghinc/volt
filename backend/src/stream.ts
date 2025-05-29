/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Imports.

import zlib from 'zlib';
import * as vlib from "@vandenberghinc/vlib";
import { IncomingMessage, ServerResponse } from 'http';
import { ServerHttp2Stream, Http2Stream, IncomingHttpHeaders, Http2ServerRequest, Http2ServerResponse } from 'http2';
import { logger } from './logger.js';

const { debug } = vlib;

// ---------------------------------------------------------
// Types.

export type Params = any
export type Parameters = Params;

// ---------------------------------------------------------
// Request object.

/*  @docs 
    @nav: Backend
    @chapter: Stream
    @title: HTTP1/2 Stream
    @description: 
        The http2 stream wrapper object.
    @attribute:
        @name: headers
        @desc: The request headers.
 */

export class Stream {
    private s?: ServerHttp2Stream;
    public headers: IncomingHttpHeaders | IncomingMessage['headers'];
    private req?: IncomingMessage | Http2ServerRequest;
    private res?: ServerResponse | Http2ServerResponse;
    public http2: boolean;
    public http1: boolean;
    private _ip: string;
    private _port: number;
    private _method: string;
    private _params: Record<string, any> | undefined;
    private _is_query_params: boolean;
    private _endpoint: string | undefined;
    private _query_string: string | undefined;
    private _cookies: Record<string, any> | undefined;
    private _uid: string | null;
    public status_code: number | null;
    public finished: boolean;
    private res_cookies: string[];
    private res_headers: Record<string, any> | [string, any][];
    public body: string;
    private promise: Promise<void> | undefined;

    constructor(
        stream?: ServerHttp2Stream,
        headers?: IncomingHttpHeaders | IncomingMessage['headers'],
        req?: IncomingMessage | Http2ServerRequest,
        res?: ServerResponse | Http2ServerResponse,
    ) {

        // Parameters.
        this.s = stream;    
        this.headers = (headers ?? {}) as IncomingHttpHeaders | IncomingMessage['headers'];
        this.req = req;
        this.res = res;
        this.http2 = req == null;
        this.http1 = req != null;

        // HTTP1.
        if (this.http1) {
            this.headers = this.req!.headers;
        }

        // Request attributes.
        this._ip = this.http2 ? (this.s as Http2Stream).session!.socket!.remoteAddress! : this.req!.socket!.remoteAddress!;
        this._port = this.http2 ? (this.s as Http2Stream).session!.socket!.remotePort! : this.req!.socket!.remotePort!;
        this._method = this.http2 ? this.headers[':method'] as string : this.req!.method!;
        this._params = undefined;
        this._is_query_params = false;
        this._endpoint = undefined;
        this._query_string = undefined;
        this._cookies = undefined;
        this._uid = null;

        // Response attributes
        this.status_code = null; 
        this.finished = false; 
        this.res_cookies = [];
        this.res_headers = this.http1 ? [] : {};

        // Read body.
        this.body = "";
        this.promise = undefined;
        this._recv_body();
    }

    // Receve the body.
    private _recv_body() {
        this.promise = new Promise<void>((resolve, reject) => {

            // Buffers.
            const buffs: Buffer[] = [];

            // Get decompress stream.
            let decompress_stream: zlib.Gunzip | zlib.Inflate | undefined;
            const content_encoding = this.headers['content-encoding'];
            if (content_encoding === 'gzip') {
                decompress_stream = zlib.createGunzip();
            } else if (content_encoding === 'deflate') {
                decompress_stream = zlib.createInflate();
            }
            const cleanup = () => {
                if (decompress_stream) {
                    decompress_stream.close();
                }
            };
            
            // HTTP2.
            if (this.http2) {
                let stream: any = this.s;

                // If decompression is needed, pipe the stream through the decompression stream
                if (decompress_stream) {
                    stream = (this.s as Http2Stream).pipe(decompress_stream);
                    // decompress_stream.on('error', (e) => { cleanup(); reject(e); });
                }

                // On error.
                stream.on('error', (e) => { cleanup(); reject(e); });

                // Receive data.
                stream.on('data', (chunk: Buffer) => {
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
                let stream: any = this.req!;
            
                // Decompress data.
                if (decompress_stream) {
                    this.req!.pipe(decompress_stream)
                    stream = decompress_stream;
                }

                // On error.
                stream.on('error', (e) => { cleanup(); reject(e); });

                // Receive data.
                stream.on("data", (data: Buffer) => {
                    buffs.push(data);
                })
                stream.on("end", () => {
                    this.body = Buffer.concat(buffs).toString();
                    cleanup();
                    resolve();
                })
            }
        })
    }

    // Parse endpoint.
    private _parse_endoint() {
        if (this._endpoint !== undefined) { return }
        this._endpoint = this.http2 ? this.headers[":path"] as string : this.req!.url!;
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

    // Parse the parameters.
    public _parse_params() {

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

                // Assign.
                this._is_query_params = true;

                // Variables.
                let is_key = true, key = "", value = "";
                const number_regex = /^-?\d+(\.\d+)?$/;

                // Callback.
                const add_value = () => {
                    let output_value: any;
                    switch (value) {
                        case "true": case "True":
                            output_value = true;
                            break;
                        case "false": case "False":
                            output_value = false;
                            break;
                        case "null": case "None": case "undefined":
                            output_value = null;
                            break;
                        default:
                            output_value = decodeURIComponent(value.replaceAll("+", " "))
                            if (number_regex.test(output_value)) {
                                if (output_value.indexOf(".") !== -1) {
                                    output_value = parseFloat(output_value);
                                } else {
                                    output_value = parseInt(output_value);
                                }
                            }
                            break;
                    }
                    this._params![decodeURIComponent(key.replaceAll("+", " "))] = output_value;
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
                    } else if (is_key === false && c === "&") {
                        add_value();
                        continue;
                    }
                    if (is_key) {
                        key += c;
                    } else {
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
            } catch(err) {
                throw Error(`Invalid json request body: ${err}.`)
            }
        }

        // Handler.
        return this._params;
    }

    // Parse cookies.
    private _parse_cookies() {

        // Reset cookies.
        this._cookies = {};

        // Vars.
        const cookie_str = this.http2 ? this.headers["cookie"] : this.req!.headers.cookie;
        if (cookie_str === undefined) { return null; }
        let key = "";
        let value = "";
        let cookie: Record<string, any> = {};
        let cookie_length = 0;
        let cookie_key: string | null = null;
        let is_value = false;
        let is_str: string | null = null;

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
            if (cookie_key != null) {
                this._cookies![cookie_key] = cookie;
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
    }

    // ---------------------------------------------------------
    // Functions.

    // Wait till the request body is fully received.
    async join(): Promise<void> {
        await this.promise;
    }

    // Get the requests ip.
    /*  @docs:
     *  @title: IP
     *  @description: Get the request's ip.
     *  @property: true
     *  @usage:
     *      ...
     *      const ip = stream.ip;
     */
    get ip(): string {
        return this._ip;
    }

    // Get the requests port.
    /*  @docs:
     *  @title: Port
     *  @description: Get the request's port.
     *  @property: true
     *  @usage:
     *      ...
     *      const port = stream.port;
     */
    get port(): number {
        return this._port;
    }

    // Get the method.
    /*  @docs:
     *  @title: Method
     *  @description: Get the request method.
     *  @property: true
     *  @usage:
     *      ...
     *      const method = stream.method;
     */
    get method(): string {
        return this._method;
    }

    // Get the endpoint.
    /*  @docs:
     *  @title: Endpoint
     *  @description: Get the request's endpoint. This will not include the query string.
     *  @property: true
     *  @type: string
     *  @usage:
     *      ...
     *      const endpoint = stream.endpoint;
     */
    get endpoint(): string {
        if (this._endpoint !== undefined) {
            return this._endpoint;
        }
        this._parse_endoint();
        return this._endpoint as unknown as string;
    }

    // Get the params.
    /*  @docs:
     *  @title: Parameters
     *  @description: Get the request's query or body params.
     *  property: true
     *  @type: object
     *  @usage:
     *      ...
     *      const params = stream.params;
     */
    get params(): Record<string, any> {
        if (this._params !== undefined) {
            return this._params;
        }
        this._parse_params();
        return this._params as unknown as Record<string, any>;
    }

    /** Add a param (used by the server backend for path parameters). */
    add_param(name: string, value: any): void {
        if (!this._params) {
            this._params = {};
        }
        this._params[name] = value;
    }

    // Get a param by name and optionally by type.
    /*  @docs:
     *  @title: Parameter
     *  @description: Get a single query or body parameter with an optional type cast.
     *  @warning: Throws an error when the parameter does not exist or when the type is different from the specified type(s), unless parameter `def` is defined.
     *  @param:
     *      @name: name
     *      @desc: The name of the parameter.
     *      @type: string
     *  @param:
     *      @name: type
     *      @desc: The type cast of the parameters, valid types are `[null, "boolean", "number", "string", "array", "object"]`.
     *      @type: string
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
     *      const param = stream.param("myparameter", "number", 10);
     */
    param<T = any>(name: string, type: string | string[] | null = null, def: any = undefined): T {

        // Parse params.
        this._parse_params();

        // Get value.
        let value = this._params![name];

        // Check type.
        if (type != null) {

            // Vars.
            let is_type_array = Array.isArray(type);

            // Wrapper funcs.
            const type_str = () => {
                let str = "";
                if (type != null) {
                    str += " type "
                    if (is_type_array) {
                        let i = 0, one_but_last_i = (type as any).length - 2;
                        (type as any).forEach((item, i) => {
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
            const type_eq_or_includes = (match: string) => {
                if (is_type_array) {
                    return (type as any).includes(match);
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
                    type = [type as string];
                }
                const success = (type as any).some((type) => {
                    
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
                        value = (value as string).split(",");
                        return true;
                    }

                    // Convert to object.
                    if (type === "object") {
                        const split: string[] = (value as string).split(",");
                        value = {};
                        split.forEach((item) => {
                            const pair = item.split(":");
                            (value as Record<string, any>)[pair[0]] = pair[1];
                        })
                        return true;
                    }

                    // Convert to numeric.
                    if (type === "number" && /^-?\d+(\.\d+)?$/.test(value)) {
                        value = parseFloat(value);
                        return true;
                    }
                })
                if (!success) {
                    throw Error(`Parameter "${name}" should be of${type_str()}.`)
                }

            }

            // Check the type when no query params are defined since JSON.parse already parsed the types.
            else if (!this._is_query_params) {
                const value_type = typeof value;
                if (!is_type_array) {
                    type = [type as string];
                }
                const success = (type as any).some((type) => {
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
                })
                if (!success) {
                    throw Error(`Parameter "${name}" should be of${type_str()}.`)
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

    // Get the request cookies.
    /*  @docs:
     *  @title: Cookies
     *  @description: Get the request's cookies
     *  property: true
     *  @type: object
     *  @usage:
     *      ...
     *      const cookies = stream.cookies;
     */
    get cookies(): Record<string, any> {
        if (this._cookies !== undefined) {
            return this._cookies;
        }
        this._parse_cookies();
        return this._cookies as unknown as Record<string, any>;
    }

    // Check if the stream is closed
    /*  @docs:
     *  @title: Closed
     *  @description: Check if the stream is closed.
     *  @property: true
     *  @usage:
     *      ...
     *      const ip = stream.closed;
     */
    get closed(): boolean {
        if (!this.http2) { throw new Error("This function is only supported for http2 streams."); }
        return this.s!.closed;
    }

    // Check if the stream is destroyed
    /*  @docs:
     *  @title: Destroyed
     *  @description: Check if the stream is destroyed.
     *  @property: true
     *  @usage:
     *      ...
     *      const ip = stream.destroyed;
     */
    get destroyed(): boolean {
        if (this.http2) {
            return this.s!.destroyed;
        } else {
            return this.req!.destroyed;
        }
    }

    // ---------------------------------------------------------
    // Functions.

    // Get the authenticated uid.
    /*  @docs:
     *  @title: UID
     *  @description: Get the authenticated uid, is `null` when the request was not authenticated.
     *  @property: true
     *  @type: string
     *  @usage:
     *      ...
     *      const uid = stream.uid;
     */
    get uid(): string | null {
        return this._uid;
    }
    set uid(value: string | null) {
        this._uid = value;
    }
    
    // Send a response.
    /*  @docs:
     *  @title: Send
     *  @description: Send a response
     *  @parameter:
     *      @name: status
     *      @description: The response status.
     *      @type: number
     *  @parameter:
     *      @name: headers
     *      @description: The response headers.
     *      @type: object
     *  @parameter:
     *      @name: body
     *      @description: The response body.
     *      @type: any
     *  @parameter:
     *      @name: data
     *      @description: The response data.
     *      @type: undefined, string
     *      @deprecated: true
     *  @parameter:
     *      @name: compress
     *      @description: A boolean indicating if the response data should be compressed.
     *      @type: boolean
     *  @usage:
     *      ...
     *      stream.send({status: 200, data: "Hello World!"});
     */
    send({
        status = 200,
        headers = {},
        // data,
        // body = data,    // zero-copy pull in data
        body,data,
        compress = false,
    }: {
        status?: number,
        headers?: Record<string, any>,
        body?: any,
        data?: any,
        compress?: boolean
    } = {}): this {

        if (data) {
            body = data;
        }

        /** @warning @todo  */
        // compress = false; // @todo @tmp

        // Assign sent status code.
        this.status_code = status;
        const has_body = body != null && body !== "";

        // HTTP2.
        if (this.http2) {
            const stream = this.s as ServerHttp2Stream;

            // Headers.
            this.res_headers[":status"] = status;
            this.set_headers(headers);
            if (this.res_cookies.length > 0) {
                this.res_headers["set-cookie"] = this.res_cookies;
            }
            if (compress && has_body) {
                this.res_headers["Content-Encoding"] = "gzip";
                this.res_headers["Vary"] = "Accept-Encoding";
            }

            // Is json.
            if (has_body && typeof body === 'object' && Buffer.isBuffer(body) === false && (body instanceof Uint8Array) === false) {
                this.res_headers["Content-Type"] = "application/json";
                body = JSON.stringify(body);
            }

            // Compress.
            if (compress && has_body) {
                body = zlib.gzipSync(body, {level: zlib.constants.Z_BEST_COMPRESSION});
            }

            // Respond.
            stream.respond(this.res_headers as any)

            // End.
            debug(3, "Sending response: ", status, " - has body: ", has_body);
            if (has_body) {
                stream.end(Buffer.from(body));
                // stream.end(body); // do not use toString() here or it will cause issues with writing binary data.
            } else {
                stream.end();
            }
        }

        // HTTP1.
        else {
            const req = this.req as IncomingMessage;
            const res = this.res as ServerResponse;

            // Set status code.
            res.statusCode = status;

            // Set headers.
            for (let i = 0; i < this.res_headers.length; i++) {
                res.setHeader(this.res_headers[i][0], this.res_headers[i][1]);
            }
            Object.keys(headers).forEach((key) => {
                res.setHeader(key, headers[key]);
            });

            // Set cookies.
            if (this.cookies.length > 0) {
                res.setHeader('Set-Cookie', this.res_cookies);
            }

            // Convert data.
            if (has_body && typeof body === 'object' && Buffer.isBuffer(body) === false && (body instanceof Uint8Array) === false) {
                res.setHeader("Content-Type", "application/json");
                body = JSON.stringify(body);
            }

            // @todo compress.
            if (compress && has_body) {
                res.setHeader("Content-Encoding", "gzip");
                res.setHeader("Vary", "Accept-Encoding");
                body = zlib.gzipSync(body, {level: zlib.constants.Z_BEST_COMPRESSION});
            }

            // Set data.
            if (has_body) {
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
    /*  @docs:
     *  @title: Send Successs
     *  @description: Send a response
     *  @parameter:
     *      @name: status
     *      @description: The response status.
     *      @type: number
     *  @parameter:
     *      @name: headers
     *      @description: The response headers.
     *      @type: object
     *  @parameter:
     *      @name: body
     *      @description: The response data.
     *      @type: any
     *  @parameter:
     *      @name: data
     *      @description: The response data.
     *      @type: undefined, string
     *      @deprecated: true
     *  @parameter:
     *      @name: compress
     *      @description: A boolean indicating if the response data should be compressed.
     *      @type: boolean
     *  @usage:
     *      ...
     *      stream.success({data: "Hello World!"});
     */
    success({status = 200, headers = {}, body = undefined, data = undefined, compress = false}: {
        status?: number,
        headers?: Record<string, any>,
        body?: any,
        data?: any,
        compress?: boolean
    } = {}): this {
        debug(3, "Sending [success] response: ", status, " - body: ", body ?? data);
        return this.send({status: status, headers: headers, body: body ?? data, compress: compress});
    }
    
    // Send an error response.
    /*  @docs:
     *  @title: Send Error
     *  @description: Send an error response
     *  @parameter:
     *      @name: status
     *      @description: The response status.
     *      @type: number
     *  @parameter:
     *      @name: headers
     *      @description: The response headers.
     *      @type: object
     *  @parameter:
     *      @name: body
     *      @description: The response data.
     *      @type: any
     *  @parameter:
     *      @name: data
     *      @description: The response data.
     *      @type: undefined, string
     *      @deprecated: true
     *  @parameter:
     *      @name: compress
     *      @description: A boolean indicating if the response data should be compressed.
     *      @type: boolean
     *  @usage:
     *      ...
     *      stream.error({data: "Some error occured"});
     */
    error({
        message,
        type = "APIError",
        invalid_fields = {},
        status = 500,
        headers = {},
        compress = false,
        data = undefined,
    }: {
        message: string,
        type?: string,
        invalid_fields?: Record<string, string>,
        status?: number,
        headers?: Record<string, any>,
        compress?: boolean
        data?: any[] | Record<string, any>,
    }): this {
        debug(3, "Sending [error] response: ", status, " - message: ", message);
        return this.send({ status: status, headers: headers, compress: compress, body: {
            error: {
                type,
                message,
                status,
                invalid_fields,
            },
            data: data,
        }});
    }

    // Set headers.
    /*  @docs:
     *  @title: Set header
     *  @description: Add a new header to the response data.
     *  @parameter:
     *      @name: name
     *      @description: The header name.
     *      @type: string
     *  @parameter:
     *      @name: value
     *      @description: The header value.
     *      @type: string
     *  @usage:
     *      ...
     *      stream.set_header("Connection", "close");
     */
    set_header(name: string, value: any): this {
        if (this.http2) {
            this.res_headers[name] = value;
        } else {
            this.res_headers.append([name, value]);
        }
        return this;
    }

    // Set headers.
    /*  @docs:
     *  @title: Set headers
     *  @description: Add new headers to the response data.
     *  @parameter:
     *      @name: headers
     *      @description: The new response headers.
     *      @type: object
     *  @usage:
     *      ...
     *      stream.set_headers({"Connection": "close"});
     */
    set_headers(headers: Record<string, any> = {}): this {
        if (headers == null) { return this; }
        if (this.http2) {
            Object.keys(headers).forEach((key) => {
                this.res_headers[key] = headers[key];
            });
        } else {
            Object.keys(headers).forEach((key) => {
                this.res_headers.append([key, headers[key]]);
            });
        }
        return this;
    }

    // Remove header.
    /*  @docs:
     *  @title: Remove headers
     *  @description: Remove header names from the response data.
     *  @parameter:
     *      @name: ...names
     *      @description: The header names to remove.
     *      @type: ...string
     *  @usage:
     *      ...
     *      stream.remove_header("Connection", "User-Agent");
     *  @funcs: 2
     */
    remove_header(...names: string[]): this {
        if (this.http1) {
            const headers: [string, string][] = [];
            for (let i = 0; i < this.res_headers.length; i++) {
                if (!names.includes(this.res_headers[i][0])) {
                    headers.push(this.res_headers[i]);
                }
            }
            this.res_headers = headers;
        } else {
            for (let i = 0; i < names.length; i++) {
                delete this.res_headers[names[i]]
            }
        }
        return this;
    }
    remove_headers(...names: string[]): this {
        return this.remove_header(...names);
    }

    // Set a cookie.
    /*  @docs:
     *  @title: Set cookie.
     *  @description: Set a cookie that will be sent with the response.
     *  @warning: Will only be added to the response when the user uses `send()`, `success()` or `error()`.
     *  @parameter:
     *      @name: cookie
     *      @description: The cookie string.
     *      @type: string
     *  @usage:
     *      ...
     *      stream.set_cookie("MyCookie=Hello World;");
     */
    set_cookie(cookie: string): this {
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
    /*  @docs:
     *  @title: Set Cookies
     *  @description: Set a cookie that will be sent with the response.
     *  @warning: Will only be added to the response when the user uses `send()`, `success()` or `error()`.
     *  @parameter:
     *      @name: cookies
     *      @description: The cookie strings.
     *      @type: ...string
     *  @usage:
     *      ...
     *      stream.set_cookies("MyCookie1=Hello World;", "MyCookie2=Hello Universe;");
     */
    set_cookies(...cookies: string[]): this {
        for (let i = 0; i < cookies.length; i++) {
            this.set_cookie(cookies[i]);
        }
        return this;
    }
}


// A stream that passed the `authenticated: true` attribute of an Enpdoint.
export type AuthStream = Stream & {
    // private _uid: string;
    get uid(): string;
}

// ---------------------------------------------------------
// Exports.

export default Stream;
