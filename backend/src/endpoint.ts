/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */

// ---------------------------------------------------------
// Imports.

import CleanCSS from 'clean-css';
import zlib from 'zlib';
import { View } from './view.js';
import * as vlib from "@vandenberghinc/vlib";
import { ExternalError, InternalError } from "./errors/internal_external.js";
import { Status } from "./status.js";
import { RateLimits, RateLimitGroup, RateLimitData } from "./rate_limit.js";
import { Stream, AuthStream } from "./stream.js";
import type { Server } from "./server.js";
import { Route } from './route.js';
import Meta from './meta.js';

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

    // Static attributes.
    static compressed_content_types: string[] = [
        // Image formats (often already compressed)
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/bmp",
        "image/tiff",
        "image/vnd.microsoft.icon", // ICO
        // Audio formats (usually compressed)
        "audio/mpeg",     // MP3
        "audio/mp3",
        "audio/ogg",
        "audio/wav",
        "audio/x-wav",
        "audio/flac",
        "audio/aac",
        "audio/midi",
        // Video formats (typically compressed)
        "video/mp4",
        "video/mpeg",
        "video/ogg",
        "video/webm",
        "video/x-msvideo", // AVI
        "video/quicktime", // MOV
        // Archive / Compressed file formats
        "application/zip",
        "application/x-7z-compressed",
        "application/x-rar-compressed",
        "application/x-tar",
        "application/gzip",
        "application/x-gzip",
        "application/x-bzip",
        "application/x-bzip2",
        "application/x-xz",
        // Documents that are usually compressed internally
        "application/pdf",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        // Font files
        "font/woff",
        "font/woff2",
        "application/font-sfnt",
        "application/vnd.ms-fontobject",
        // Other binary data
        "application/octet-stream",
    ];

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
    is_image_endpoint: boolean = false;
    allow_sitemap: boolean;
    allow_robots: boolean;

    /** Rate limit groups for internal use. */
    rate_limit_groups: RateLimitData[];

    /** Private attributes */
    private _compress: boolean;
    private _cache: boolean | number;
    private ip_whitelist?: string[];
    private _is_compressed?: boolean;

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

    // /**
    //  * Clone this endpoint, used to create a modified copy of the current endpoint.
    //  * @param override Override specific endpoint options, note that this will be shallow merged.
    //  * 
    //  * @docs
    //  */
    // clone<
    //     const M extends Endpoint.Method = "GET",
    //     const E extends string | RegExp = string,
    //     const S extends vlib.Schema.Entries.Opts = {}
    // >(this: Endpoint<M, E, S>, override?: Partial<Endpoint.Opts<M, E, S>>): Endpoint<M, E, S> {
    //     return new Endpoint({
    //         ...vlib.Object.deep_copy({
    //             method: this.route.method,
    //             endpoint: this.route.endpoint,
    //             authenticated: this.authenticated,
    //             rate_limit: this.rate_limit_groups,
    //             params: this.params_schema,
    //             compress: this._compress,
    //             cache: this._cache,
    //             ip_whitelist: this.ip_whitelist,
    //             sitemap: this.allow_sitemap,
    //             robots: this.allow_robots,
    //             allow_unknown_params: this.allow_unknown_params,
    //             _is_static: this.is_static,
    //             data: this.data,
    //             file_path: this.file_path,
    //             content_type: this.content_type,
    //             callback: this.callback,
    //         }),
    //         view: this.view?.clone(),
    //         ...override,
    //     } as Endpoint.Opts<M, E, S>);
    // }

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
        compress = "auto",
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

        // Set compress.
        if (compress === "auto" || typeof compress !== "boolean") {
            compress = Endpoint.compressed_content_types.includes(this.content_type??"")
        } else if (compress === true && this.content_type != null && Endpoint.compressed_content_types.includes(this.content_type)) {
            debug(4, this.route.id, ": ", `Overriding parameter "compress", disabling compression.`)
            compress = false;
        }
        this._compress = compress;
        this._compress = false;
        if (this._compress) {
            debug(3, this.route.id, ": ", "Compression enabled.", { content_type: this.content_type })
        }

        // Argument `view` may also be passed as an object instead of class View.
        if (view == null) {
            this.view = undefined;
        } else if (view instanceof View) {
            this.view = view;
        } else {
            this.view = new View(view);
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
        status = 200,
        templates = undefined,
    }: {
        stream: Stream;
        status: number;
        /** Add new templates when rendering a `View`, overriding the default `View` templates. */
        templates?: Record<string, any>;
    }): Promise<void> {
        return await this._serve(stream, status, { templates });
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

        /**
         * Load data by file path
         * @todo in the future we should not load all of the data but just send it to the client in chunks
         *       but we need to account for compression and content length when implementing this.
         */
        if (this.file_path != null) {
            this._load_data_by_path(this.server);
        }

        // Compression enabled.
        if (this.server.production && this.callback == null && this._compress) {
            this._is_compressed = true;
            if (this.data != null && (this.data instanceof Buffer || typeof this.data === "string")) {
                this.raw_data = this.data;
                this.data = zlib.gzipSync(this.data, {level: zlib.constants.Z_BEST_COMPRESSION});
                this.content_length = this.data.length;
            }
            // cant compress view html here since it contains unique nonces.
            // else if (this.view != null) {
            //     this.view.raw_html = this.view.html;
            //     this.view.html = zlib.gzipSync(this.view.html as any, {level: zlib.constants.Z_BEST_COMPRESSION});
            //     this.content_length = this.view.html.length;
            // }
            debug(2, this.route.id, ": ", "Compressed - content_length:",this.content_length)
        }

        // Set cache headers.
        if (!this.server.production) {
           this._cache = false; // @todo @tmp
        }
        if (
            // (this.callback == null || this.is_image_endpoint) &&
            (typeof this._cache === "number" || this._cache === true)
        ) {
            if (this._cache === 1 || this._cache === true) {
                this.headers.push(["Cache-Control", "max-age=86400"]);
            } else {
                this.headers.push(["Cache-Control", `max-age=${this._cache}`]);
            }
        }

        // Set compression headers.
        if (this._is_compressed) {
            this.headers.push(["Content-Encoding", "gzip"]);
            this.headers.push(["Vary", "Accept-Encoding"]);
        }

        // Set content length.
        if (this.content_length != null) {
            this.headers.push(["Content-Length", this.content_length.toString()]);
        }

        // Set content type.
        if (this.content_type != null) {
            this.headers.push(["Content-Type", this.content_type]);
        }
        if (this._is_compressed) {
            debug(2, this.route.id,": ", "Compressed headers:", this.headers)
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

            // Compute content length on view & when not defined.
            if (this.content_length == null && this.view != null) {
                stream.set_header("Content-Length", (await this.view.content_length()).toString());
            }

            // Send.
            stream.send({ status: Status.no_content });
            
        } catch (err) {
            throw err; // must have another catch block here otherwise when an error occurs in here it is somehow not catched by the try and catch block from Server._serve which will cause the program to crash.
        }
    }
    async _serve(stream: Stream, status_code: number = 200, opts?: {
        /** Add new templates when rendering a `View`, overriding the default `View` templates. */
        templates?: Record<string, any>
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
                            headers: {"Content-Type": "application/json"},
                            data: {
                                error,
                                invalid_fields,
                            }
                        });
                        return;
                    }
                }
                try {
                    let promise;
                    if (this.params_validator != null) {
                        promise = this.callback(stream, (stream.params ?? {}) as any);
                    } else {
                        promise = this.callback(stream, {} as any);
                    }
                    if (promise instanceof Promise) {
                        await promise;
                    }
                } catch (err: any) {
                    if (err instanceof ExternalError || err instanceof InternalError) { 
                        err.serve(stream);
                    } else {
                        stream.error({
                            status: Status.internal_server_error, 
                            headers: {"Content-Type": "application/json"},
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
                await this.view._serve(stream, status_code, { compress: this._compress, templates: opts?.templates });
                return;
            }

            // Data.
            else if (this.data != null) {
                this.server?.log(3, this.route.id, ": ", "Serving endpoint in data mode.");
                stream.send({
                    status: status_code, 
                    data: this.data,
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

    // Load data by path.
    private _load_data_by_path(server: Server): this {
        if (!this.file_path) {
            throw new Error(`Endpoint "${this.id}" has no file path assigned.`);
        }
        
        // Load data.
        const path = new vlib.Path(this.file_path);
        let data: string | Buffer;
        if (path.extension() === ".js") {
            data = path.load_sync();
        }
        else if (path.extension() === ".css") {
            const minifier = new CleanCSS();
            data = minifier.minify(path.load_sync()).styles;
        }
        else {
            data = path.load_sync({type: "buffer"});
        }

        // Assign.
        this.data = data;
        return this;
    }

    // Refresh for file watcher.
    // async _refresh(server: Server): Promise<void> {
    //     // Not in production.
    //     if (server.production) {
    //         throw new Error("This function is not designed for production mode.");
    //     }

    //     // Build html code of view.
    //     if (this.view != null) {
    //         await this.view._build_html();
    //     }
    // }
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
            /** Compress data, only available when initialized with one of the following parameters `view` or `data`. */
            compress?: "auto" | boolean,
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
            data?: Buffer | string | any[] | Record<any, any>;
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
            content_type: string;
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
            /** The content type. */
            content_type: string;
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
            /** The content type. */
            content_type: string;
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
            content_type?: string;
        }
    }
}

// const e = new Endpoint({
//     method: "POST",
//     endpoint: "/api/docs/feedback",
//     content_type: "application/json",
//     params: {
//         /** The user id. */
//         uid: "string",
//         /** The project name. */
//         project: "string",
//         /** The project version. */
//         version: "string",
//         /** The document id. */
//         id: "string",
//         /** Whether the feedback is positive or negative. */
//         positive: "boolean",
//     },
//     rate_limit: "global",
//     async callback(stream, params) {
//     }
// })