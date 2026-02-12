/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */

// ---------------------------------------------------------
// Imports.

import { View } from './view.js';
import * as vlib from "@vandenberghinc/vlib";
import { ExternalError, InternalError } from "./errors/internal_external.js";
import { Status } from "./status.js";
import { RateLimits, RateLimitGroup, RateLimitData } from "./rate_limit.js";
import { Stream, AuthStream } from "./stream.js";
import { Server } from "./server.js";
import { Route } from './route.js';
import Meta from './meta.js';
import { Utils } from './utils.js';
import { Request } from '../../frontend/src/modules/request.js';

const { debug } = vlib;

// ---------------------------------------------------------
// Endpoint


/**
 * The endpoint class.
 * @nav Endpoints
 * @docs
 */

export class Endpoint<
    const M extends Endpoint.Method = "GET",
    const E extends string | RegExp = string,
    const S extends vlib.Schema.Entries.Opts = {}
> {

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
    is_image_endpoint: boolean = false;
    allow_sitemap: boolean;
    allow_robots: boolean;

    /** Rate limit groups for internal use. */
    rate_limit_groups: RateLimitData[];

    /** Private attributes */
    private _compress: boolean;
    private _cache: boolean | number;
    private ip_whitelist?: string[];
    // private _is_compressed?: boolean;

    private _dynamic_initialized = false;

    /** A reference to the server. */
    server?: Server;

    /**
     * Clone this endpoint, used to create a modified copy of the current endpoint.
     * @param override Override specific endpoint options, note that this will be shallow merged.
     * 
     * @docs
     */
    static clone<
        const M extends Endpoint.Method = "GET",
        const E extends string | RegExp = string,
        const S extends vlib.Schema.Entries.Opts = {}
        >(endpoint: Endpoint<M, E, S>, override?: Partial<Endpoint.Opts<M, E, S>>): Endpoint<M, E, S> {
        return new Endpoint<M, E, S>({
            ...vlib.Object.deep_copy({
                method: endpoint.route.method,
                endpoint: endpoint.route.endpoint,
                authenticated: endpoint.authenticated,
                rate_limit: endpoint.rate_limit_groups,
                params: endpoint.params_schema,
                compress: endpoint._compress,
                cache: endpoint._cache,
                ip_whitelist: endpoint.ip_whitelist,
                sitemap: endpoint.allow_sitemap,
                robots: endpoint.allow_robots,
                allow_unknown_params: endpoint.allow_unknown_params,
                _is_static: endpoint.is_static,
                data: endpoint.data,
                file_path: endpoint.file_path,
                content_type: endpoint.content_type,
                callback: endpoint.callback,
            }),
            view: endpoint.view?.clone(),
            ...override,
        } as Endpoint.Opts<M, E, S>);
    }

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
    static method<ReqInfo extends Request.Info<Request.Method, any, any, any, any>>(
        method: ReqInfo["method"]
    ): ReqInfo["method"] {
        return method;
    }

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
    static endpoint<ReqInfo extends Request.Info<any, any, any, any, any>>(
        endpoint: ReqInfo["endpoint"]
    ): ReqInfo["endpoint"] {
        return endpoint;
    }

    /**
     * Construct an endpoint.
     * @docs
     */
    constructor({
        method,
        endpoint,
        authenticated = false,
        rate_limit = undefined,
        params = undefined,
        compress = true,
        cache = true,
        ip_whitelist = undefined,
        sitemap = undefined,
        robots = undefined,
        allow_unknown_params = false,
        _is_static = false,
        // mode options.
        callback = undefined,
        view = undefined,
        data = undefined,
        file_path = undefined,
        content_type,// = "text/plain",
    }: Endpoint.Opts<M, E, S>) {
        
        // Attributes.
        this.route = new Route(method ?? "GET", endpoint);
        this.id = this.route.id;
        this.authenticated = authenticated;
        if ((this as any).callback === undefined) { // only assign when undefined, so derived classes can also define the callback function.
            this.callback = callback;
        }
        this.data = data;
        this.content_type = content_type;
        this._cache = cache;
        this.allow_sitemap = sitemap ?? true;
        this.allow_robots = robots ?? true;
        this.file_path = file_path == null ? file_path : new vlib.Path(file_path).abs();
        this.ip_whitelist = Array.isArray(ip_whitelist) ? ip_whitelist : undefined;
        this.is_static = _is_static;
        this.headers = [];
        this.params_schema = params;
        this.allow_unknown_params = allow_unknown_params;

        // Excluded endpoint chars
        if (typeof endpoint === "string") {
            ["\n", "\,"].forEach((c) => {
                if (endpoint.indexOf(c) !== -1) {
                    throw Error("The \",\" character is not allowed inside an endpoint url.");
                }
            });
        }

        // Argument `view` may also be passed as an object instead of class View.
        if (view == null) {
            this.view = undefined;
        } else if (view instanceof View) {
            this.view = view;
        } else {
            this.view = new View(view);
        }

        // Set content type from file path.
        if (this.file_path != null && this.content_type == null) {
            this.content_type = Utils.mime_type(this.file_path.extension()) ?? "application/octet-stream";
        }
        // Set content type from defined view after view is defined.
        else if (this.view != null) {
            this.content_type = "text/html";
        }

        // Set compression after content type is defined.
        if (compress === false) {
            this._compress = false;
        } else if (this.file_path) {
            this._compress = !(Utils.is_compressed_extension(this.file_path.extension()) ?? false);
        } else if (this.content_type != null) {
            this._compress = !Utils.is_compressed_content_type(this.content_type);
        } else {
            this._compress = true;
        }

        // Set default visible in sitemap.
        if (this.allow_sitemap == null) {
            if (
                this.view != null &&
                this.route.endpoint != "robots.txt" &&
                this.route.endpoint != "sitemap.xml" &&
                !this.authenticated
            ) {
                this.allow_sitemap = true;
            } else {
                this.allow_sitemap = false;
            }
        }

        // Set crawling by robots.
        if (this.allow_robots == null) {
            this.allow_robots = !this.authenticated && (this.view != null || this.route.endpoint == "robots.txt" || this.route.endpoint == "sitemap.xml");
        }

        // Assign rate limits.
        this.rate_limit_groups = [];
        if (Array.isArray(rate_limit)) {
            rate_limit.forEach((item) => {
                if (typeof item === "string") {
                    const group = RateLimits.groups.get(item);
                    if (!group) throw new Error(`Rate limit group "${item}" does not exist.`);
                    this.rate_limit_groups.push(group);
                } else {
                    this.rate_limit_groups.push(RateLimits.add(item))
                }
            });
        } else if (typeof rate_limit === "string") {
            const group = RateLimits.groups.get(rate_limit);
            if (!group) throw new Error(`Rate limit group "${rate_limit}" does not exist.`);
            this.rate_limit_groups.push(group);
        } else if (typeof rate_limit === "object" && rate_limit != null) {
            this.rate_limit_groups.push(RateLimits.add(rate_limit))
        }

        // Add path parameters from route.
        let params_scheme: vlib.Schema.Entries.Opts | undefined = params;
        if (this.route.params.length > 0) {
            params_scheme ??= {} as any;
            this.route.params.forEach((item) => {
                if (params_scheme![item.name] == null) {
                    params_scheme![item.name] = {
                        type: "string",
                        required: item.required ?? true,
                        allow_empty: false,
                    };
                }
            });
            
        }

        // Initialize the parameter scheme validator.
        if (params_scheme != null) {
            this.params_validator = new vlib.Schema.Validator({
                schema: params_scheme,
                unknown: allow_unknown_params,
                parent: this.route.id + ":",
                throw: false,
            });
        }
    }

    /**
     * Serve this endpoint manually from a stream.
     * This can for instance be used to serve a HTML `/error` endpoint from within a callback.
     * @docs
     */
    async serve({
        stream,
        status: status_code = 200,
        templates,
    }: {
        stream: Stream;
        status?: number;
        templates?: Record<string, any>;
    }): Promise<void> {
        if (!this._dynamic_initialized) {
            await this._dynamic_initialize();
        }
        try {
            // Check IP whitelist.
            if (this.ip_whitelist && !this.ip_whitelist.includes(stream.ip)) {
                this.server?.log(2, this.route.id, ": ", "Blocking ip ", stream.ip, " per ip whitelist.");
                stream.send({
                    status: Status.unauthorized,
                    data: "Unauthorized.",
                });
                return;
            }

            // Set headers.
            this._set_headers(stream);

            // Callback.
            if (this.callback != null) {
                this.server?.log(3, this.route.id, ": ", "Serving endpoint in callback mode.");
                if (this.params_validator != null) {
                    const { error, invalid_fields } = this.params_validator.validate(stream.params ?? {});
                    if (error) {
                        stream.send({
                            status: Status.bad_request,
                            headers: { "Content-Type": "application/json" },
                            data: {
                                error,
                                invalid_fields,
                            }
                        });
                        return;
                    }
                }
                try {
                    if (this.params_validator != null) {
                        await this.callback(stream, (stream.params ?? {}) as any);
                    } else {
                        await this.callback(stream, {} as any);
                    }
                } catch (err: any) {
                    if (err instanceof ExternalError || err instanceof InternalError) {
                        err.serve(stream);
                    } else {
                        stream.error({
                            status: Status.internal_server_error,
                            headers: { "Content-Type": "application/json" },
                            message: "Internal Server Error",
                            type: "InternalServerError",
                        });
                    }
                    this.server?.log.error(`${this.id}: `, err); // after sending the response since this edits the error.
                }
                return;
            }

            // View.
            else if (this.view != null) {
                this.server?.log(3, this.route.id, ": ", "Serving endpoint in view mode.");
                await this.view._serve(
                    stream,
                    status_code,
                    { compress: this._compress, templates: templates },
                );
                return;
            }

            // Load from file.
            else if (this.file_path != null) {
                this.server?.log(3, this.route.id, ": ", "Serving endpoint in file mode.");
                stream.send({
                    status: status_code,
                    from_file: this.file_path,
                    compress: this._compress,
                    templates: templates,
                });
                return;
            }

            // Data.
            else if (this.data != null) {
                this.server?.log(3, this.route.id, ": ", "Serving endpoint in data mode.");
                stream.send({
                    status: status_code,
                    data: this.data,
                    compress: this._compress,
                    templates: templates,
                });
                return;
            }

            // Undefined.
            else {
                throw new Error(`${this.id}: Undefined behaviour, define one of the following endpoint attributes [callback, view, data].`);
            }
        } catch (err) {
            throw err; // must have another catch block here otherwise when an error occurs in here it is somehow not catched by the try and catch block from Server._serve which will cause the program to crash.
        }
    }

    // ----------------------------------------------------------
    // System methods.

    /** Initialize with server. */
    _initialize(server: Server): this {

        // Already initialized.
        if (this.server != null) {
            return this;
        }

        // Assign attribute.
        this.server = server;
        
        // Initialize view.
        if (this.view != null) {
            this.view.initialize(server, this);
        }

        // Init view meta.
        if (this.view != null) {
            if (this.view.meta == null) {
                this.view.meta = server.meta.copy();
            } else if (typeof this.view.meta === "object" && !(this.view.meta instanceof Meta)) {
                this.view.meta = new Meta(this.view.meta);
            }
        }
        return this;
    }

    // Initialize.
    async _dynamic_initialize(): Promise < void> {
        if (!this.server) {
            throw new Error(`Endpoint "${this.id}" is not initialized by the server yet.`);
        }

        // Set cache headers.
        if (!this.server.production) {
           this._cache = false; // @todo @tmp
        }
        if (typeof this._cache === "number" || this._cache === true) {
            if (this._cache === 1 || this._cache === true) {
                this.headers.push(["Cache-Control", "max-age=86400"]);
            } else {
                this.headers.push(["Cache-Control", `max-age=${this._cache}`]);
            }
        }

        // Set content type.
        if (this.content_type != null) {
            this.headers.push(["Content-Type", this.content_type]);
        }

        this._dynamic_initialized = true;
    }

    // Set default headers.
    _set_headers(stream: Stream): void {
        this.headers.forEach((item) => {
            stream.set_header(item[0], item[1]);
        })
    }

    // Serve a client.
    async _serve_options(stream: Stream): Promise<void> {
        if (!this._dynamic_initialized) {
            await this._dynamic_initialize();
        }

        try {
            // Check IP whitelist.
            if (this.ip_whitelist && !this.ip_whitelist.includes(stream.ip)) {
                stream.error({
                    status: Status.unauthorized,
                    type: "Unauthorized",
                    message: "Unauthorized.",
                });
                return;
            }

            // Set headers.
            this._set_headers(stream);

            // Send.
            stream.send({ status: Status.no_content });
            
        } catch (err) {
            throw err; // must have another catch block here otherwise when an error occurs in here it is somehow not catched by the try and catch block from Server._serve which will cause the program to crash.
        }
    }
}
export namespace Endpoint {

    /**
     * The endpoint method.
     * @docs
     */
    export type Method = "GET" | "POST" | "DELETE" | "PUT" | "PATCH" | "OPTIONS";

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
    export type Opts<
        M extends Method = Method,
        E extends string | RegExp = string,
        S extends vlib.Schema.Entries.Opts = {},
    > =
        | Opts.ByData<M, E, S>
        | Opts.ByFilePath<M, E, S>
        | Opts.ByCallback<M, E, S>
        | Opts.ByAuthCallback<M, E, S>
        | Opts.ByView<M, E, S>

    /** Nested types for the {@link Opts} type. */
    export namespace Opts {

        /**
         * The base options for constructing an endpoint.
         */
        export interface Base<
            M extends Method = Method,
            E extends string | RegExp = string,
            S extends vlib.Schema.Entries.Opts = {},
        > {
            /**
             * The endpoint method.
             * @default "GET"
             */
            method?: M extends undefined ? "GET" : M,
            /** The endpoint sub url. */
            endpoint: E,
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
            rate_limit?: string | RateLimitGroup | (string | RateLimitGroup)[],
            /**
             * The parameter schema for validating request parameters.
             */
            params?: S,
            /**
             * Allow unknown parameters to be passed to the endpoint that are not
             * defined in the parameter schema.
             * @default false
             */
            allow_unknown_params?: boolean;
            /** Compress data sent body. */
            compress?: boolean,
            /**
             * Parameter cache can define the max age of the cached response in seconds or as a boolean `true`.
             * Anything higher than zero enables caching.
             * 
             * When server production mode is enabled caching is done automatically unless `cache` is `false`.
             * When production mode is disabled responses are never cached, even though the parameter is assigned.
             * The response of an endpoint that uses parameter `callback` is never cached.
             */
            cache?: boolean | number,
            /**
             * An IP whitelist for the endpoint. When the parameter is defined with an Array,
             * the whitelist will become active.
             */
            ip_whitelist?: string[],
            /**
             * A boolean indicating if the endpoint should show up in the sitemap.
             * By default only when the attribute `view` is defined and the endpoint is unauthenticated,
             * the endpoint will show up in sitemap.
             */
            sitemap?: boolean,
            /**
             * A boolean indicating if the endpoint should be crawled by search engines.
             * By default only endpoints with `view` enabled will be crawled, unless specified otherwise.
             */
            robots?: boolean,
            /** System reserved property indicating whether the endpoint is from static files. */
            _is_static?: boolean,
        }

        /**
         * Options for constructing an endpoint by data & content type.
         * @docs
         */
        export interface ByData<
            M extends Method = Method,
            E extends string | RegExp = string,
            S extends vlib.Schema.Entries.Opts = {},
        > extends Base<M, E, S> {
            /** The data that will be returned as the response body. */
            data: Buffer | string | any[] | Record<any, any>;
            /** Not allowed in this variant. */
            file_path?: never;
            /** Not allowed in this variant. */
            view?: never;
            /** Only allow authenticated requests. */
            authenticated?: boolean,
            /** Not allowed in this variant. */
            callback?: never;
            /** The content type. */
            content_type: string;
        }

        /**
         * Options for constructing an endpoint by file path & content type.
         * @docs
         */
        export interface ByFilePath<
            M extends Method = Method,
            E extends string | RegExp = string,
            S extends vlib.Schema.Entries.Opts = {},
        > extends Base<M, E, S> {
            /** Not allowed in this variant. */
            data?: never;
            /** The file path to load the data from. */
            file_path: string | vlib.Path;
            /** Only allow authenticated requests. */
            authenticated?: boolean,
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
        export interface ByCallback<
            M extends Method = Method,
            E extends string | RegExp = string,
            S extends vlib.Schema.Entries.Opts = {},
        > extends Base<M, E, S> {
            /** Not allowed in this variant. */
            data?: never;
            /** Not allowed in this variant. */
            file_path?: never;
            /** Only allow authenticated requests. */
            authenticated?: false,
            /** The callback that will be executed when a client requests this endpoint. */
            callback: ((stream: Stream, params: vlib.Schema.Entries.Infer<S>) => any)
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
        export interface ByAuthCallback<
            M extends Method = Method,
            E extends string | RegExp = string,
            S extends vlib.Schema.Entries.Opts = {},
        > extends Base<M, E, S> {
            /** Not allowed in this variant. */
            data?: never;
            /** Not allowed in this variant. */
            file_path?: never;
            /** Only allow authenticated requests. */
            authenticated: true,
            /** The callback that will be executed when a client requests this endpoint. */
            callback: ((stream: AuthStream, params: vlib.Schema.Entries.Infer<S>) => any),
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
        export interface ByView<
            M extends Method = Method,
            E extends string | RegExp = string,
            S extends vlib.Schema.Entries.Opts = {},
        > extends Base<M, E, S> {
            /** Not allowed in this variant. */
            data?: never;
            /** Not allowed in this variant. */
            file_path?: never;
            /** Only allow authenticated requests. */
            authenticated?: boolean,
            /** Not allowed in this variant. */
            callback?: never;
            /** The JavaScript view that will be executed on the client side. */
            view: View | View.Opts;
            /** The content type. */
            content_type?: never;
        }
    }
}