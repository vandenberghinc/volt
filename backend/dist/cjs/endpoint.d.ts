import { View } from './view.js';
import * as vlib from "@vandenberghinc/vlib";
import { RateLimits, RateLimitGroup } from "./rate_limit.js";
import { Stream, AuthStream } from "./stream.js";
import type { Server } from "./server.js";
import { Route } from './route.js';
/**
 * @nav Backend
 * @chapter Endpoints
 * @title Endpoint
 * @description The endpoint class.
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
export declare class Endpoint<const S extends vlib.scheme.Infer.Scheme.S = {}> {
    static rate_limits: Map<string, any>;
    static compressed_content_types: string[];
    /** Route attributes */
    id: string;
    route: Route;
    /** Requires authentication */
    authenticated: boolean;
    /** Parameter scheme validator */
    params_val?: vlib.scheme.Validator<object, object, "object">;
    /** The default response headers */
    headers: [string, string][];
    /** Option 1) User callback - defined as method so a derived endpoint can do that as well. */
    callback?(stream: Stream, params: vlib.scheme.Infer.Scheme<S>): any;
    callback?(stream: AuthStream, params: vlib.scheme.Infer.Scheme<S>): any;
    /** Option 2) View based endpoint */
    view?: View;
    /** Option 3) Data endpoint, raw */
    data: Buffer | string | any[] | Record<any, any>;
    raw_data?: Buffer | string | any[] | Record<any, any>;
    /** Content length & type */
    content_length?: number;
    content_type?: string;
    /** Booleans */
    is_static: boolean;
    is_image_endpoint: boolean;
    allow_sitemap: boolean;
    allow_robots: boolean;
    /** Rate limit groups for internal use. */
    rate_limit_groups: ReturnType<typeof RateLimits.add>[];
    /** Private attributes */
    private _compress;
    private _cache;
    _static_path?: string;
    private _templates;
    private ip_whitelist?;
    private _is_compressed?;
    private _initialized;
    private _server?;
    constructor({ method, endpoint, authenticated, rate_limit, params, callback, view, data, content_type, // = "text/plain",
    compress, cache, ip_whitelist, sitemap, robots, allow_unknown_params, _templates, // only used in loading static files.
    _static_path, _is_static, }: {
        method?: string;
        endpoint: string | RegExp;
        authenticated?: boolean;
        rate_limit?: string | RateLimitGroup | RateLimitGroup[];
        params?: S;
        callback?: ((stream: Stream, params: vlib.scheme.Infer.Scheme<S>) => any) | ((stream: AuthStream, params: vlib.scheme.Infer.Scheme<S>) => any);
        data?: any;
        compress?: "auto" | boolean;
        cache?: boolean | number;
        ip_whitelist?: string[];
        sitemap?: boolean;
        robots?: boolean;
        _templates?: Record<string, any>;
        _static_path?: string;
        _is_static?: boolean;
        allow_unknown_params?: boolean;
    } & ({
        view: View | View.Opts;
        content_type?: string;
    } | {
        view?: null | undefined;
        content_type: string;
    }));
    /** Initialize with server. */
    _initialize(server: Server): this;
    /**
     * Convert a RegExp into a readable path:
     * - strips ^…$ anchors
     * - unescapes `\/` → `/`
     * - `(?<name>…)` → `:name`
     * - anonymous captures `(…)` → `:param1`, `:param2`, …
     */
    _stringify_endpoint_regex(re: RegExp): string;
    _load_data_by_path(server: any): this;
    _set_headers(stream: any): void;
    _refresh(server: any): Promise<void>;
    _dynamic_initialize(): Promise<void>;
    _serve_options(stream: Stream): Promise<void>;
    _serve(stream: Stream, status_code?: number): Promise<void>;
}
export declare namespace Endpoint {
    /** Constructor options without the `_server` attribute. */
    type Opts<S extends vlib.scheme.Infer.Scheme.S = {}> = ConstructorParameters<typeof Endpoint<S>>[0];
}
