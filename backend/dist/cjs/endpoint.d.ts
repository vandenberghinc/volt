import { View } from './view.js';
import * as vlib from "@vandenberghinc/vlib";
import { RateLimits, RateLimitGroup } from "./rate_limit.js";
import { Stream, AuthStream, Params } from "./stream.js";
import type { Server } from "./server.js";
import { Route } from './route.js';
type EndpointCallback = ((stream: Stream, params: Params) => any) | ((stream: AuthStream, params: Params) => any);
interface BaseEndpointOptions {
    method?: string;
    endpoint: string | RegExp;
    authenticated?: boolean;
    rate_limit?: string | RateLimitGroup | RateLimitGroup[];
    params?: Record<string, any>;
    callback?: EndpointCallback;
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
}
interface EndpointOptionsWithView extends Omit<BaseEndpointOptions, "content_type" | "view"> {
    view: View | Record<string, any>;
    content_type?: string;
}
interface EndpointOptionsWithoutView extends BaseEndpointOptions {
    view?: null | undefined;
    content_type: string;
}
export type EndpointOptions = EndpointOptionsWithView | EndpointOptionsWithoutView;
declare class Endpoint {
    static rate_limits: Map<string, any>;
    static compressed_content_types: string[];
    /** Route attributes */
    id: string;
    route: Route;
    /** Requires authentication */
    authenticated: boolean;
    /** Parameter scheme */
    params?: vlib.Scheme.Scheme;
    /** The default response headers */
    headers: [string, string][];
    /** Option 1) User callback - defined as method so a derived endpoint can do that as well. */
    callback?(stream: Stream, params: Params): any;
    callback?(stream: AuthStream, params: Params): any;
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
    private _verify_params_parent;
    private _is_compressed?;
    private _allow_unknown_params;
    private _initialized;
    private _server;
    constructor({ method, endpoint, authenticated, rate_limit, params, callback, view, data, content_type, // = "text/plain",
    compress, cache, ip_whitelist, sitemap, robots, allow_unknown_params, _templates, // only used in loading static files.
    _static_path, _is_static, _server, }: EndpointOptions & {
        _server: Server;
    });
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
export { Endpoint };
