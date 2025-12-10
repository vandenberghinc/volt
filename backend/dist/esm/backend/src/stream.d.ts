/**
 * @author Daan van den Bergh
 * @copyright © 2025 - 2025 Daan van den Bergh. All rights reserved.
 */
import { IncomingMessage, ServerResponse } from 'http';
import { ServerHttp2Stream, IncomingHttpHeaders, Http2ServerRequest, Http2ServerResponse } from 'http2';
/** A generic map of request parameters. */
export type Params = Record<string, any>;
/** Alias for {@link Params}. */
export type Parameters = Params;
/** Allowed values for an HTTP response header. */
export type ResponseHeaderValue = string | number | boolean | null | undefined;
/** A map of HTTP response headers. */
export type ResponseHeaders = Record<string, ResponseHeaderValue>;
/** Supported response body shapes. */
type ResponseBody = undefined | string | boolean | number | any[] | Record<string, any> | Buffer<ArrayBufferLike> | Uint8Array<ArrayBufferLike>;
/**
 * The http2 stream wrapper object.
 *
 * @property headers The request headers.
 * @docs
 */
export declare class Stream {
    private s?;
    headers: IncomingHttpHeaders | IncomingMessage['headers'];
    private req?;
    private res?;
    http2: boolean;
    http1: boolean;
    private _ip;
    private _port;
    private _method;
    private _params;
    private _is_query_params;
    private _endpoint;
    private _query_string;
    private _cookies;
    private _uid;
    status_code: number | undefined;
    finished: boolean;
    private res_cookies;
    private res_headers;
    body: string;
    private promise;
    /** The cached value of {@link normalize_ip} */
    private _normalized_ip;
    /**
     * Create a new Stream wrapper for HTTP/1.1 or HTTP/2.
     *
     * @param stream The HTTP/2 stream (when using HTTP/2).
     * @param headers The request headers.
     * @param req The HTTP/1.1 request (when using HTTP/1.1).
     * @param res The HTTP/1.1/HTTP/2 response object.
     */
    constructor(stream?: ServerHttp2Stream, headers?: IncomingHttpHeaders | IncomingMessage['headers'], req?: IncomingMessage | Http2ServerRequest, res?: ServerResponse | Http2ServerResponse);
    /**
     * Receive and buffer the request body, handling optional gzip/deflate decompression.
     * Sets {@link body} and resolves the internal promise used by {@link join}.
     * @private
     */
    private _recv_body;
    /**
     * Parse and cache the request endpoint and query string.
     * Populates {@link _endpoint} and {@link _query_string}.
     * @private
     */
    private _parse_endoint;
    /**
     * Parse and cache request parameters from the query string or JSON body.
     * Returns the parsed params map.
     */
    _parse_params(): Record<string, any> | undefined;
    /**
     * Parses & returns the cookies  cookies,
     * while assigning it to {@link _cookies}
     *
     * @warning On subsequent calls cookies will be parsed again.
    */
    private _parse_cookies;
    /**
     * Wait until the request body is fully received.
     * Resolves when the internal receive promise completes.
     */
    join(): Promise<void>;
    /**
     * Get the request's ip.
     *
     * @example
     * ```ts
     * const ip = stream.ip;
     * ```
     * @docs
     */
    get ip(): string;
    /**
     * Retrieve the normalized IP address, suitable for rate limiting and logging.
     * @throws {Error} If the IP is invalid.
     * @returns The normalized IP.
     */
    normalized_ip(): string;
    /**
     * Get the request's port.
     *
     * @example
     * ```ts
     * const port = stream.port;
     * ```
     * @docs
     */
    get port(): number;
    /**
     * Get the request method.
     *
     * @example
     * ```ts
     * const method = stream.method;
     * ```
     * @docs
     */
    get method(): string;
    /**
     * Get the request's endpoint. This will not include the query string.
     *
     * @example
     * ```ts
     * const endpoint = stream.endpoint;
     * ```
     * @docs
     */
    get endpoint(): string;
    /**
     * Get the request's query or body params.
     *
     * @example
     * ```ts
     * const params = stream.params;
     * ```
     * @docs
     */
    get params(): Record<string, any>;
    /** Add a param (used by the server backend for path parameters). */
    add_param(name: string, value: any): void;
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
    param<T = any>(name: string, type?: string | string[] | null, def?: any): T;
    /**
     * Get the request's cookies
     *
     * @example
     * ```ts
     * const cookies = stream.cookies;
     * ```
     * @docs
     */
    get cookies(): Record<string, any>;
    /**
     * Check if the stream is destroyed.
     *
     * @example
     * ```ts
     * const ip = stream.destroyed;
     * ```
     * @docs
     */
    get destroyed(): boolean;
    /**
     * Get the authenticated uid; `undefined` when the request was not authenticated.
     *
     * @example
     * ```ts
     * const uid = stream.uid;
     * ```
     * @docs
     */
    get uid(): string | undefined;
    set uid(value: string | undefined);
    /**
     * Send a response.
     *
     * @param options The response options.
     * @param options.status The response status.
     * @param options.headers The response headers.
     * @param options.data The data of the response body to send.
     * @param options.compress Whether the response should be gzip-compressed.
     * @example
     * ```ts
     * stream.send({status: 200, data: "Hello World!"});
     * ```
     * @docs
     */
    send<Data extends ResponseBody = ResponseBody>({ status, headers, data, compress, }?: {
        status?: number;
        headers?: ResponseHeaders;
        data?: Data;
        compress?: boolean;
    }): this;
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
    success<Data extends ResponseBody = ResponseBody>({ status, headers, data, compress }?: {
        status?: number;
        headers?: ResponseHeaders;
        data?: Data;
        compress?: boolean;
    }): this;
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
    error<ErrorData extends ResponseBody = ResponseBody>({ message, type, invalid_fields, status, headers, compress, data, }: {
        message: string;
        type?: string;
        invalid_fields?: Record<string, string>;
        status?: number;
        headers?: ResponseHeaders;
        compress?: boolean;
        data?: ErrorData;
    }): this;
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
    set_header(name: string, value: ResponseHeaderValue): this;
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
    set_headers(headers?: ResponseHeaders): this;
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
    get_header(name: string): ResponseHeaderValue | undefined;
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
    remove_header(...names: string[]): this;
    /**
     * Alias of {@link remove_header}.
     *
     * @param names The header names to remove.
     */
    remove_headers(...names: string[]): this;
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
    set_cookie(cookie: string): this;
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
    set_cookies(...cookies: string[]): this;
}
/** A stream that passed the `authenticated: true` attribute of an {@link Endpoint}. */
export type AuthStream = Stream & {
    get uid(): string;
};
/**
 * The API error field from {@link APIErrorResult}.
 *
 * @note This should be compatible with the frontend {@link Utils.RequestResult} interface.
 */
export interface APIError {
    /** The error message. */
    message: string;
    /** The error type. */
    type?: string;
    /** The error status code. */
    status?: number;
    /** The invalid fields, when the error is a validation error. */
    invalid_fields?: Record<string, string>;
}
/** The request data template base. */
type RequestDataBase = unknown | null | undefined | number | boolean | string | any[] | Record<string, any>;
/**
 * The error response received by the frontend generated by the {@link Stream.error} method from the backend.
 * This interface can be used to create response interfaces in the backend, imported by the frontend.
 *
 * @note This should be compatible with the frontend {@link Utils.RequestResult} interface.
 */
export interface APIErrorResult<ErrorData extends RequestDataBase = unknown> {
    /** The error object. */
    error: APIError;
    /** The data that was sent with the error response, always optional in case of body parsing failure */
    data?: ErrorData;
}
/**
 * The request result from {@link Stream.error}, {@link Stream.success} or {@link Stream.send}.
 *
 * @note This should be compatible with the frontend {@link Utils.RequestResult} interface.
 */
export type APIResult<SuccessData extends RequestDataBase = unknown, ErrorData extends RequestDataBase = unknown> = APIErrorResult<ErrorData> | SuccessData;
export default Stream;
