/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
import { View } from './view.js';
import * as vlib from "@vandenberghinc/vlib";
import { RateLimitGroup, RateLimitData } from "./rate_limit.js";
import { Stream, AuthStream } from "./stream.js";
import type { Server } from "./server.js";
import { Route } from './route.js';
/**
 * The endpoint class.
 * @nav Endpoints
 *
 * @param method
 *   The method type.
 *
 * @param endpoint
 *   The endpoint sub url.
 *
 * @param authenticated
 *   Only allow authenticated requests.
 *
 * @param rate_limit
 *   The rate limit settings.
 *
 *   Rate limiting works by creating a rate limit per group of endpoints. Multiple
 *   rate limiting groups can be applied by defining an array with rate limit objects.
 *   A group's interval and limit only need to be defined once on a single endpoint.
 *   When defined again these values will override the initial group settings.
 *
 *   The rate limit parameter may be defined as three types:
 *   - `string`: Assign the rate limit group without any group parameters. Useful when the group is already defined.
 *   - `RateLimitGroup`: As a rate limit object.
 *   - An array with multiple rate limit objects.
 *
 *   When left undefined no rate limiting will be applied.
 *
 * @param callback
 *   The callback that will be executed when a client requests this endpoint.
 *   Parameter `callback` precedes over parameter `data` and parameter `view`.
 *   The callback can take parameter `stream` assigned with the `volt.Stream` object of the request.
 *
 * @param view
 *   The JavaScript view that will be executed on the client side.
 *   Parameter `view` precedes over parameter `data`.
 *
 * @param data
 *   The data that will be returned as the response body.
 *
 * @param content_type
 *   The content type for parameter `data` or `callback`.
 *
 * @param compress
 *   Compress data, only available when initialized with one of the following parameters `view` or `data`.
 *
 * @param cache
 *   Parameter cache can define the max age of the cached response in seconds or as a boolean `true`.
 *   Anything higher than zero enables caching.
 *
 *   When server production mode is enabled caching is done automatically unless `cache` is `false`.
 *   When production mode is disabled responses are never cached, even though the parameter is assigned.
 *   The response of an endpoint that uses parameter `callback` is never cached.
 *
 * @param sitemap
 *   A boolean indicating if the endpoint should show up in the sitemap.
 *   By default only when the attribute `view` is defined and the endpoint is unauthenticated,
 *   the endpoint will show up in sitemap.
 *
 * @param robots
 *   A boolean indicating if the endpoint should be crawled by search engines.
 *   By default only endpoints with `view` enabled will be crawled, unless specified otherwise.
 *
 * @param ip_whitelist
 *   An IP whitelist for the endpoint. When the parameter is defined with an Array,
 *   the whitelist will become active.
 *
 * @param _path
 *   Internal parameter (ignored).
 *
 * @param _is_static
 *   Internal parameter (ignored).
 *
 * @typedef RateLimitGroup
 * @property group
 *   The rate limit group.
 *
 * @property limit
 *   The maximum requests per rate limit interval. These settings will be cached per group
 *   and only have to be assigned once. The assigned attributes will be overridden when
 *   these attributes are reassigned for the same group.
 *
 * @property interval
 *   The rate limit interval in seconds. These settings will be cached per group
 *   and only have to be assigned once. The assigned attributes will be overridden when
 *   these attributes are reassigned for the same group.
 */
export declare class Endpoint<const M extends Endpoint.Method = "GET", const E extends string | RegExp = string, const S extends vlib.Schema.Entries.Opts = {}> {
    static compressed_content_types: string[];
    /** Route attributes */
    id: string;
    route: Route;
    /** Requires authentication */
    authenticated: boolean;
    /** Parameter scheme validator */
    params_validator: undefined | vlib.Schema.Validator<object>;
    params_schema: undefined | vlib.Schema.Entries.Opts;
    allow_unknown_params: undefined | boolean;
    /** The default response headers */
    headers: [string, string][];
    /** Option 1) User callback - defined as method so a derived endpoint can do that as well. */
    callback?(stream: Stream, params: vlib.Schema.Entries.Infer<S>): any;
    callback?(stream: AuthStream, params: vlib.Schema.Entries.Infer<S>): any;
    /** Option 2) View based endpoint */
    view?: View;
    /** Option 3) Data endpoint, raw */
    data?: Buffer | string | any[] | Record<any, any>;
    raw_data?: Buffer | string | any[] | Record<any, any>;
    /** Option 4 Data endpoint by file path. */
    file_path?: vlib.Path;
    /** Content length & type */
    content_length?: number;
    content_type?: string;
    /** Booleans */
    is_static: boolean;
    is_image_endpoint: boolean;
    allow_sitemap: boolean;
    allow_robots: boolean;
    /** Rate limit groups for internal use. */
    rate_limit_groups: RateLimitData[];
    /** Private attributes */
    private _compress;
    private _cache;
    private ip_whitelist?;
    private _is_compressed?;
    private _dynamic_initialized;
    /** A reference to the server. */
    server?: Server;
    /**
     * Clone this endpoint, used to create a modified copy of the current endpoint.
     * @param override Override specific endpoint options, note that this will be shallow merged.
     *
     * @docs
     */
    clone<const M extends Endpoint.Method = "GET", const E extends string | RegExp = string, const S extends vlib.Schema.Entries.Opts = {}>(this: Endpoint<M, E, S>, override?: Partial<Endpoint.Opts<M, E, S>>): Endpoint<M, E, S>;
    /**
     * Construct an endpoint.
     * @docs
     */
    constructor({ method, endpoint, authenticated, rate_limit, params, compress, cache, ip_whitelist, sitemap, robots, allow_unknown_params, _is_static, callback, view, data, file_path, content_type, }: Endpoint.Opts<M, E, S>);
    /**
     * Serve this endpoint manually from a stream.
     * This can for instance be used to serve a HTML `/error` endpoint from within a callback.
     * @docs
     */
    serve({ stream, status, templates, }: {
        stream: Stream;
        status: number;
        /** Add new templates when rendering a `View`, overriding the default `View` templates. */
        templates?: Record<string, any>;
    }): Promise<void>;
    /** Initialize with server. */
    _initialize(server: Server): this;
    _dynamic_initialize(): Promise<void>;
    _set_headers(stream: Stream): void;
    _serve_options(stream: Stream): Promise<void>;
    _serve(stream: Stream, status_code?: number, opts?: {
        /** Add new templates when rendering a `View`, overriding the default `View` templates. */
        templates?: Record<string, any>;
    }): Promise<void>;
    private _load_data_by_path;
}
export declare namespace Endpoint {
    /**
     * The endpoint method.
     * @docs
     */
    type Method = "GET" | "POST" | "DELETE" | "PUT" | "PATCH" | "OPTIONS";
    /**
     * Options for constructing an endpoint.
     * @docs
     */
    type Opts<M extends Method = Method, E extends string | RegExp = string, S extends vlib.Schema.Entries.Opts = {}> = {
        /**
         * The endpoint method.
         * @default "GET"
         */
        method?: M extends undefined ? "GET" : M;
        endpoint: E;
        rate_limit?: string | RateLimitGroup | (string | RateLimitGroup)[];
        params?: S;
        compress?: "auto" | boolean;
        cache?: boolean | number;
        ip_whitelist?: string[];
        sitemap?: boolean;
        robots?: boolean;
        _is_static?: boolean;
        allow_unknown_params?: boolean;
    } & ({
        data?: Buffer | string | any[] | Record<any, any>;
        file_path?: never;
        view?: never;
        authenticated?: boolean;
        callback?: never;
        content_type: string;
    } | {
        data?: never;
        file_path: string | vlib.Path;
        authenticated?: boolean;
        callback?: never;
        view?: never;
        content_type: string;
    } | {
        data?: never;
        file_path?: never;
        authenticated?: false;
        callback: ((stream: Stream, params: vlib.Schema.Entries.Infer<S>) => any);
        view?: never;
        content_type: string;
    } | {
        data?: never;
        file_path?: never;
        authenticated: true;
        callback: ((stream: AuthStream, params: vlib.Schema.Entries.Infer<S>) => any);
        view?: never;
        content_type: string;
    } | {
        data?: never;
        file_path?: never;
        authenticated?: boolean;
        callback?: never;
        view: View | View.Opts;
        content_type?: string;
    });
}
