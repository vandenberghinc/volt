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
import { Utils, ExternalError, InternalError } from "./utils.js";
import { Status } from "./status.js";
import { logger } from "./logger.js";
import { RateLimits } from "./rate_limit.js";
import { Route } from './route.js';
import Meta from './meta.js';
const { log, error, warn } = logger;
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
    static rate_limits = new Map();
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
    params_val;
    /** The default response headers */
    headers;
    /** Option 2) View based endpoint */
    view;
    /** Option 3) Data endpoint, raw */
    data;
    raw_data;
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
    _static_path;
    _templates;
    ip_whitelist;
    _is_compressed;
    _initialized = false;
    _server;
    constructor({ method = "GET", endpoint = "/", authenticated = false, rate_limit = undefined, params = undefined, callback = undefined, view = undefined, data = undefined, content_type, // = "text/plain",
    compress = "auto", cache = true, ip_whitelist = undefined, sitemap = undefined, robots = undefined, allow_unknown_params = false, _templates = {}, // only used in loading static files.
    _static_path = undefined, _is_static = false, }) {
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
        this._templates = _templates;
        this._static_path = _static_path == null ? undefined : new vlib.Path(_static_path).abs().str(); // use abs, is automatically assigned for static files.
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
                this.rate_limit_groups.push(RateLimits.add(item));
            });
        }
        else if (typeof rate_limit === "string") {
            this.rate_limit_groups.push(RateLimits.add({ group: rate_limit }));
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
            this.params_val = new vlib.scheme.Validator("object", {
                scheme: params,
                strict: !allow_unknown_params,
                parent: this.route.id + ":",
                throw: false,
            });
        }
    }
    /** Initialize with server. */
    _initialize(server) {
        // Assign attribute.
        this._server = server;
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
    /**
     * Convert a RegExp into a readable path:
     * - strips ^…$ anchors
     * - unescapes `\/` → `/`
     * - `(?<name>…)` → `:name`
     * - anonymous captures `(…)` → `:param1`, `:param2`, …
     */
    _stringify_endpoint_regex(re) {
        let src = re.source;
        // 1) strip anchors
        src = src.replace(/^\^/, "").replace(/\$$/, "");
        // 2) unescape slashes
        src = src.replace(/\\\//g, "/");
        // 3) named capture groups → :name
        src = src.replace(/\(\?<([^>]+)>[^)]+\)/g, (_match, name) => `:${name}`);
        // 4) anonymous captures → :paramN
        let idx = 1;
        src = src.replace(/\((?!\?)[^)]+\)/g, () => `:param${idx++}`);
        return src;
    }
    // Load data by path.
    _load_data_by_path(server) {
        // Load data.
        const path = new vlib.Path(this._static_path);
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
        // Fill templates.
        if (this._templates && typeof data === "string") {
            data = Utils.fill_templates(data, this._templates);
        }
        // Assign.
        this.data = data;
        return this;
    }
    // Set default headers.
    _set_headers(stream) {
        this.headers.forEach((item) => {
            stream.set_header(item[0], item[1]);
        });
    }
    // Refresh for file watcher.
    async _refresh(server) {
        // Not in production.
        if (server.production) {
            throw new Error("This function is not designed for production mode.");
        }
        // Build html code of view.
        if (this.view != null) {
            await this.view._build_html();
        }
    }
    // Initialize.
    async _dynamic_initialize() {
        if (!this._server) {
            throw new Error(`Endpoint "${this.id}" is not initialized by the server yet.`);
        }
        // Build html code of view.
        if (this.view != null) {
            await this.view._build_html();
        }
        // Compression enabled.
        if (this._server.production && this.callback == null && this._compress) {
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
    // Serve a client.
    async _serve_options(stream) {
        if (!this._initialized) {
            await this._dynamic_initialize();
        }
        try {
            // Check IP whitelist.
            if (this.ip_whitelist && !this.ip_whitelist.includes(stream.ip)) {
                stream.send({
                    status: Status.unauthorized,
                    body: "Unauthorized.",
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
                log(2, this.route.id, ": ", "Blocking ip ", stream.ip, " per ip whitelist.");
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
                log(3, this.route.id, ": ", "Serving endpoint in callback mode.");
                if (this.params_val != null) {
                    const { error, invalid_fields } = this.params_val.validate(stream.param);
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
                    if (this.params_val != null) {
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
                    error(`${this.id}: `, err); // after sending the response since this edits the error.
                }
                return;
            }
            // View.
            else if (this.view != null) {
                log(3, this.route.id, ": ", "Serving endpoint in view mode.");
                this.view._serve(stream, status_code);
                return;
            }
            // Data.
            else if (this.data != null) {
                log(3, this.route.id, ": ", "Serving endpoint in data mode.");
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
}
