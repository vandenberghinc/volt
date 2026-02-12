/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
import { View } from './view.js';
import * as vlib from "@vandenberghinc/vlib";
import { RateLimitGroup, RateLimitData } from "./rate_limit.js";
import { Stream, AuthStream } from "./stream.js";
import { Server } from "./server.js";
import { Route } from './route.js';
import { Request } from '../../frontend/src/modules/request.js';
/**
 * The endpoint class.
 * @nav Endpoints
 * @docs
 */
export declare class Endpoint<const M extends Endpoint.Method = "GET", const E extends string | RegExp = string, const S extends vlib.Schema.Entries.Opts = {}> {
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
    private _dynamic_initialized;
    /** A reference to the server. */
    server?: Server;
    /**
     * Clone this endpoint, used to create a modified copy of the current endpoint.
     * @param override Override specific endpoint options, note that this will be shallow merged.
     *
     * @docs
     */
    static clone<const M extends Endpoint.Method = "GET", const E extends string | RegExp = string, const S extends vlib.Schema.Entries.Opts = {}>(endpoint: Endpoint<M, E, S>, override?: Partial<Endpoint.Opts<M, E, S>>): Endpoint<M, E, S>;
    /**
     * Static function to create a very strict method.
     * This is a utility type that can be used when defining frontend `Request.Info` types.
     * With this function we can enforce that the method matches the method defined in the `Request.Info` type,
     * which can be useful to prevent mistakes when defining endpoints.
     *
     * @example
     * {Create Strict Endpoint}
     * Create a strict endpoint based on a frontend request info type.
     * If there are any mismatches between the defined method,
     * endpoint or result data with the `Request.Info` type,
     * a TypeScript compile-time error will be thrown.
     *
     * ```ts
     * import { Request } from "@vandenberghinc/volt/frontend";
     * import * as volt from "@vandenberghinc/volt";
     *
     * type MyRequestInfo = Request.Info<
     *   "POST", // method
     *   "/api/my-endpoint", // endpoint
     *   { id: string } // params
     *   { name: string } // result
     *   undefined // error
     * >;
     *
     * server.endpoint({
     *     method: volt.Endpoint.method<MyRequestInfo>("POST"),
     *     endpoint: volt.Endpoint.endpoint<MyRequestInfo>("/api/my-endpoint"),
     *     params: { id: "string" },
     *     callback: async (stream, params) => {
     *         // Send a success response.
     *         stream.send<MyRequestInfo["result"]>({
     *             status: 200,
     *             data: { name: "John Doe" },
     *         });
     *.    },
     * })
     * ```
     */
    static method<ReqInfo extends Request.Info<Request.Method, any, any, any, any>>(method: ReqInfo["method"]): ReqInfo["method"];
    /**
     * Static function to create a very strict endpoint.
     * This is a utility type that can be used when defining frontend `Request.Info` types.
     * With this function we can enforce that the endpoint matches the endpoint defined in the `Request.Info` type,
     * which can be useful to prevent mistakes when defining endpoints.
     *
     * @example
     * {Create Strict Endpoint}
     * Create a strict endpoint based on a frontend request info type.
     * If there are any mismatches between the defined method,
     * endpoint or result data with the `Request.Info` type,
     * a TypeScript compile-time error will be thrown.
     *
     * ```ts
     * import { Request } from "@vandenberghinc/volt/frontend";
     * import * as volt from "@vandenberghinc/volt";
     *
     * type MyRequestInfo = Request.Info<
     *   "POST", // method
     *   "/api/my-endpoint", // endpoint
     *   { id: string } // params
     *   { name: string } // result
     *   undefined // error
     * >;
     *
     * server.endpoint({
     *     method: volt.Endpoint.method<MyRequestInfo>("POST"),
     *     endpoint: volt.Endpoint.endpoint<MyRequestInfo>("/api/my-endpoint"),
     *     params: { id: "string" },
     *     callback: async (stream, params) => {
     *         // Send a success response.
     *         stream.send<MyRequestInfo["result"]>({
     *             status: 200,
     *             data: { name: "John Doe" },
     *         });
     *.    },
     * })
     * ```
     */
    static endpoint<ReqInfo extends Request.Info<any, any, any, any, any>>(endpoint: ReqInfo["endpoint"]): ReqInfo["endpoint"];
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
    serve({ stream, status: status_code, templates, }: {
        stream: Stream;
        status?: number;
        templates?: Record<string, any>;
    }): Promise<void>;
    /** Initialize with server. */
    _initialize(server: Server): this;
    _dynamic_initialize(): Promise<void>;
    _set_headers(stream: Stream): void;
    _serve_options(stream: Stream): Promise<void>;
}
export declare namespace Endpoint {
    /**
     * The endpoint method.
     * @docs
     */
    type Method = "GET" | "POST" | "DELETE" | "PUT" | "PATCH" | "OPTIONS";
    /**
     * Options for constructing an endpoint.
     * For more information on the different options see the nested types:
     * - {@link Opts.ByData}
     * - {@link Opts.ByFilePath}
     * - {@link Opts.ByCallback}
     * - {@link Opts.ByAuthCallback}
     * - {@link Opts.ByView}
     * @docs
     */
    type Opts<M extends Method = Method, E extends string | RegExp = string, S extends vlib.Schema.Entries.Opts = {}> = Opts.ByData<M, E, S> | Opts.ByFilePath<M, E, S> | Opts.ByCallback<M, E, S> | Opts.ByAuthCallback<M, E, S> | Opts.ByView<M, E, S>;
    /** Nested types for the {@link Opts} type. */
    namespace Opts {
        /**
         * The base options for constructing an endpoint.
         */
        interface Base<M extends Method = Method, E extends string | RegExp = string, S extends vlib.Schema.Entries.Opts = {}> {
            /**
             * The endpoint method.
             * @default "GET"
             */
            method?: M extends undefined ? "GET" : M;
            /** The endpoint sub url. */
            endpoint: E;
            /**
             * The rate limit settings.
             *
             * Rate limiting works by creating a rate limit per group of endpoints. Multiple
             * rate limiting groups can be applied by defining an array with rate limit objects.
             * A group's interval and limit only need to be defined once on a single endpoint.
             * When defined again these values will override the initial group settings.
             *
             * The rate limit parameter may be defined as three types:
             * - `string`: Assign the rate limit group without any group parameters. Useful when the group is already defined.
             * - `RateLimitGroup`: As a rate limit object.
             * - An array with multiple rate limit objects.
             *
             * When left undefined no rate limiting will be applied.
             */
            rate_limit?: string | RateLimitGroup | (string | RateLimitGroup)[];
            /**
             * The parameter schema for validating request parameters.
             */
            params?: S;
            /**
             * Allow unknown parameters to be passed to the endpoint that are not
             * defined in the parameter schema.
             * @default false
             */
            allow_unknown_params?: boolean;
            /** Compress data sent body. */
            compress?: boolean;
            /**
             * Parameter cache can define the max age of the cached response in seconds or as a boolean `true`.
             * Anything higher than zero enables caching.
             *
             * When server production mode is enabled caching is done automatically unless `cache` is `false`.
             * When production mode is disabled responses are never cached, even though the parameter is assigned.
             * The response of an endpoint that uses parameter `callback` is never cached.
             */
            cache?: boolean | number;
            /**
             * An IP whitelist for the endpoint. When the parameter is defined with an Array,
             * the whitelist will become active.
             */
            ip_whitelist?: string[];
            /**
             * A boolean indicating if the endpoint should show up in the sitemap.
             * By default only when the attribute `view` is defined and the endpoint is unauthenticated,
             * the endpoint will show up in sitemap.
             */
            sitemap?: boolean;
            /**
             * A boolean indicating if the endpoint should be crawled by search engines.
             * By default only endpoints with `view` enabled will be crawled, unless specified otherwise.
             */
            robots?: boolean;
            /** System reserved property indicating whether the endpoint is from static files. */
            _is_static?: boolean;
        }
        /**
         * Options for constructing an endpoint by data & content type.
         * @docs
         */
        interface ByData<M extends Method = Method, E extends string | RegExp = string, S extends vlib.Schema.Entries.Opts = {}> extends Base<M, E, S> {
            /** The data that will be returned as the response body. */
            data: Buffer | string | any[] | Record<any, any>;
            /** Not allowed in this variant. */
            file_path?: never;
            /** Not allowed in this variant. */
            view?: never;
            /** Only allow authenticated requests. */
            authenticated?: boolean;
            /** Not allowed in this variant. */
            callback?: never;
            /** The content type. */
            content_type: string;
        }
        /**
         * Options for constructing an endpoint by file path & content type.
         * @docs
         */
        interface ByFilePath<M extends Method = Method, E extends string | RegExp = string, S extends vlib.Schema.Entries.Opts = {}> extends Base<M, E, S> {
            /** Not allowed in this variant. */
            data?: never;
            /** The file path to load the data from. */
            file_path: string | vlib.Path;
            /** Only allow authenticated requests. */
            authenticated?: boolean;
            /** Not allowed in this variant. */
            callback?: never;
            /** Not allowed in this variant. */
            view?: never;
            /** The content type. */
            content_type?: never;
        }
        /**
         * Options for constructing an endpoint by unauthenticated callback.
         * @docs
         */
        interface ByCallback<M extends Method = Method, E extends string | RegExp = string, S extends vlib.Schema.Entries.Opts = {}> extends Base<M, E, S> {
            /** Not allowed in this variant. */
            data?: never;
            /** Not allowed in this variant. */
            file_path?: never;
            /** Only allow authenticated requests. */
            authenticated?: false;
            /** The callback that will be executed when a client requests this endpoint. */
            callback: ((stream: Stream, params: vlib.Schema.Entries.Infer<S>) => any);
            /** Not allowed in this variant. */
            view?: never;
            /**
             * The content type.
             * Not required since a callback could have multiple different content types.
             */
            content_type?: string;
        }
        /**
         * Options for constructing an endpoint by authenticated callback.
         * @docs
         */
        interface ByAuthCallback<M extends Method = Method, E extends string | RegExp = string, S extends vlib.Schema.Entries.Opts = {}> extends Base<M, E, S> {
            /** Not allowed in this variant. */
            data?: never;
            /** Not allowed in this variant. */
            file_path?: never;
            /** Only allow authenticated requests. */
            authenticated: true;
            /** The callback that will be executed when a client requests this endpoint. */
            callback: ((stream: AuthStream, params: vlib.Schema.Entries.Infer<S>) => any);
            /** Not allowed in this variant. */
            view?: never;
            /**
             * The content type.
             * Not required since a callback could have multiple different content types.
             */
            content_type?: string;
        }
        /**
         * Options for constructing an endpoint by authenticated view.
         * @docs
         */
        interface ByView<M extends Method = Method, E extends string | RegExp = string, S extends vlib.Schema.Entries.Opts = {}> extends Base<M, E, S> {
            /** Not allowed in this variant. */
            data?: never;
            /** Not allowed in this variant. */
            file_path?: never;
            /** Only allow authenticated requests. */
            authenticated?: boolean;
            /** Not allowed in this variant. */
            callback?: never;
            /** The JavaScript view that will be executed on the client side. */
            view: View | View.Opts;
            /** The content type. */
            content_type?: never;
        }
    }
}
