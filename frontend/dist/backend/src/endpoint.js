/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */
// ---------------------------------------------------------
// Imports.
import CleanCSS from 'clean-css';
import zlib from 'zlib';
import { View } from './view.js';
import * as vlib from "@vandenberghinc/vlib";
import { ExternalError, InternalError } from "./utils.js";
import { Status } from "./status.js";
import { RateLimits } from "./rate_limit.js";
import { Route } from './route.js';
import Meta from './meta.js';
const { debug } = vlib;
// ---------------------------------------------------------
// Endpoint
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
export class Endpoint {
    // Static attributes.
    static compressed_content_types = [
        // Image formats (often already compressed)
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/bmp",
        "image/tiff",
        "image/vnd.microsoft.icon", // ICO
        // Audio formats (usually compressed)
        "audio/mpeg", // MP3
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
    id;
    route;
    /** Requires authentication */
    authenticated;
    /** Parameter scheme validator */
    params_schema;
    /** The default response headers */
    headers;
    /** Option 2) View based endpoint */
    view;
    /** Option 3) Data endpoint, raw */
    data;
    raw_data;
    /** Option 4 Data endpoint by file path. */
    file_path;
    /** Content length & type */
    content_length;
    content_type;
    /** Booleans */
    is_static;
    is_image_endpoint = false;
    allow_sitemap;
    allow_robots;
    /** Rate limit groups for internal use. */
    rate_limit_groups;
    /** Private attributes */
    _compress;
    _cache;
    ip_whitelist;
    _is_compressed;
    _initialized = false;
    /** A reference to the server. */
    server;
    constructor({ method = "GET", endpoint = "/", authenticated = false, rate_limit = undefined, params = undefined, compress = "auto", cache = true, ip_whitelist = undefined, sitemap = undefined, robots = undefined, allow_unknown_params = false, _is_static = false, 
    // mode options.
    callback = undefined, view = undefined, data = undefined, file_path = undefined, content_type, // = "text/plain",
     }) {
        // Attributes.
        this.route = new Route(method, endpoint);
        this.id = this.route.id;
        this.authenticated = authenticated;
        if (this.callback === undefined) { // only assign when undefined, so derived classes can also define the callback function.
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
            compress = Endpoint.compressed_content_types.includes(this.content_type ?? "");
        }
        else if (compress === true && this.content_type != null && Endpoint.compressed_content_types.includes(this.content_type)) {
            debug(3, this.route.id, ": ", `Overriding parameter "compress", disabling compression.`);
            compress = false;
        }
        this._compress = compress;
        this._compress = false;
        if (this._compress) {
            debug(3, this.route.id, ": ", "Compression enabled.", { content_type: this.content_type });
        }
        // Argument `view` may also be passed as an object instead of class View.
        if (view == null) {
            this.view = undefined;
        }
        else if (view instanceof View) {
            this.view = view;
        }
        else {
            this.view = new View(view);
        }
        // Set default visible in sitemap.
        if (this.allow_sitemap == null) {
            if (this.view != null &&
                this.route.endpoint != "robots.txt" &&
                this.route.endpoint != "sitemap.xml" &&
                !this.authenticated) {
                this.allow_sitemap = true;
            }
            else {
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
                    if (!group)
                        throw new Error(`Rate limit group "${item}" does not exist.`);
                    this.rate_limit_groups.push(group);
                }
                else {
                    this.rate_limit_groups.push(RateLimits.add(item));
                }
            });
        }
        else if (typeof rate_limit === "string") {
            const group = RateLimits.groups.get(rate_limit);
            if (!group)
                throw new Error(`Rate limit group "${rate_limit}" does not exist.`);
            this.rate_limit_groups.push(group);
        }
        else if (typeof rate_limit === "object" && rate_limit != null) {
            this.rate_limit_groups.push(RateLimits.add(rate_limit));
        }
        // Add path parameters from route.
        let params_scheme = params;
        if (this.route.params.length > 0) {
            params_scheme ??= {};
            this.route.params.forEach((item) => {
                if (params_scheme[item.name] == null) {
                    params_scheme[item.name] = {
                        type: "string",
                        required: item.required ?? true,
                        allow_empty: false,
                    };
                }
            });
        }
        // Initialize the parameter scheme validator.
        if (params_scheme != null) {
            this.params_schema = new vlib.Schema.Validator({
                schema: params_scheme,
                unknown: !allow_unknown_params,
                parent: this.route.id + ":",
                throw: false,
            });
        }
    }
    /** Initialize with server. */
    _initialize(server) {
        // Assign attribute.
        this.server = server;
        // Initialize view.
        if (this.view != null) {
            this.view._initialize(server, this);
        }
        // Init view meta.
        if (this.view != null) {
            if (this.view.meta == null) {
                this.view.meta = server.meta.copy();
            }
            else if (typeof this.view.meta === "object" && !(this.view.meta instanceof Meta)) {
                this.view.meta = new Meta(this.view.meta);
            }
        }
        return this;
    }
    // Initialize.
    async _dynamic_initialize() {
        if (!this.server) {
            throw new Error(`Endpoint "${this.id}" is not initialized by the server yet.`);
        }
        // Build html code of view.
        if (this.view != null) {
            await this.view._build_html();
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
                this.data = zlib.gzipSync(this.data, { level: zlib.constants.Z_BEST_COMPRESSION });
                this.content_length = this.data.length;
            }
            else if (this.view != null) {
                this.view.raw_html = this.view.html;
                this.view.html = zlib.gzipSync(this.view.html, { level: zlib.constants.Z_BEST_COMPRESSION });
                this.content_length = this.view.html.length;
            }
            debug(2, this.route.id, ": ", "Compressed - content_length:", this.content_length);
        }
        // Set cache headers.
        // if (!this._server.production) {
        this._cache = false; // @todo @tmp
        // }
        if ((this.callback == null || this.is_image_endpoint) && (typeof this._cache === "number" || this._cache === true)) {
            if (this._cache === 1 || this._cache === true) {
                this.headers.push(["Cache-Control", "max-age=86400"]);
            }
            else {
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
            debug(2, this.route.id, ": ", "Compressed headers:", this.headers);
        }
        this._initialized = true;
    }
    // Set default headers.
    _set_headers(stream) {
        this.headers.forEach((item) => {
            stream.set_header(item[0], item[1]);
        });
    }
    // Serve a client.
    async _serve_options(stream) {
        if (!this._initialized) {
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
        }
        catch (err) {
            throw err; // must have another catch block here otherwise when an error occurs in here it is somehow not catched by the try and catch block from Server._serve which will cause the program to crash.
        }
    }
    async _serve(stream, status_code = 200) {
        if (!this._initialized) {
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
                if (this.params_schema != null) {
                    const { error, invalid_fields } = this.params_schema.validate(stream.params ?? {});
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
                    let promise;
                    if (this.params_schema != null) {
                        promise = this.callback(stream, (stream.params ?? {}));
                    }
                    else {
                        promise = this.callback(stream, {});
                    }
                    if (promise instanceof Promise) {
                        await promise;
                    }
                }
                catch (err) {
                    if (err instanceof ExternalError || err instanceof InternalError) {
                        err.serve(stream);
                    }
                    else {
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
                this.view._serve(stream, status_code);
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
        }
        catch (err) {
            throw err; // must have another catch block here otherwise when an error occurs in here it is somehow not catched by the try and catch block from Server._serve which will cause the program to crash.
        }
    }
    // Load data by path.
    _load_data_by_path(server) {
        if (!this.file_path) {
            throw new Error(`Endpoint "${this.id}" has no file path assigned.`);
        }
        // Load data.
        const path = new vlib.Path(this.file_path);
        let data;
        if (path.extension() === ".js") {
            data = path.load_sync();
            // @deprecated compile using vhighlight, now esbuild is used for bundling, callback is not supported yet.
            // const hash = server.hash(data);
            // // Check cache for restarts by file watcher.
            // const {cache_path, cache_hash, cache_data} = Utils.get_compiled_cache(server.domain, "GET", path.str());
            // if (cache_data && hash === cache_hash) {
            //     data = cache_data;
            // }
            // // Compile.
            // else {
            //     const compiler = new vhighlight.JSCompiler({
            //         line_breaks: true,
            //         double_line_breaks: false,
            //         comments: false,
            //         white_space: false,
            //     })
            //     data = compiler.compile_code(data, path.str());
            //     // Cache for restarts.
            //     Utils.set_compiled_cache(cache_path, data, hash);
            // }
        }
        else if (path.extension() === ".css") {
            const minifier = new CleanCSS();
            data = minifier.minify(path.load_sync()).styles;
        }
        else {
            data = path.load_sync({ type: "buffer" });
        }
        // Assign.
        this.data = data;
        return this;
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
