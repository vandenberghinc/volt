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
import { RateLimits } from "./rate_limit.js";
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
    params_validator;
    params_schema;
    allow_unknown_params;
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
    _dynamic_initialized = false;
    /** A reference to the server. */
    server;
    /**
     * Clone this endpoint, used to create a modified copy of the current endpoint.
     * @param override Override specific endpoint options, note that this will be shallow merged.
     *
     * @docs
     */
    static clone(endpoint, override) {
        return new Endpoint({
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
        });
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
    constructor({ method, endpoint, authenticated = false, rate_limit = undefined, params = undefined, compress = "auto", cache = true, ip_whitelist = undefined, sitemap = undefined, robots = undefined, allow_unknown_params = false, _is_static = false, 
    // mode options.
    callback = undefined, view = undefined, data = undefined, file_path = undefined, content_type, // = "text/plain",
     }) {
        // Attributes.
        this.route = new Route(method ?? "GET", endpoint);
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
            compress = Endpoint.compressed_content_types.includes(this.content_type ?? "");
        }
        else if (compress === true && this.content_type != null && Endpoint.compressed_content_types.includes(this.content_type)) {
            debug(4, this.route.id, ": ", `Overriding parameter "compress", disabling compression.`);
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
    async serve({ stream, status = 200, templates = undefined, }) {
        return await this._serve(stream, status, { templates });
    }
    // ----------------------------------------------------------
    // System methods.
    /** Initialize with server. */
    _initialize(server) {
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
            // cant compress view html here since it contains unique nonces.
            // else if (this.view != null) {
            //     this.view.raw_html = this.view.html;
            //     this.view.html = zlib.gzipSync(this.view.html as any, {level: zlib.constants.Z_BEST_COMPRESSION});
            //     this.content_length = this.view.html.length;
            // }
            debug(2, this.route.id, ": ", "Compressed - content_length:", this.content_length);
        }
        // Set cache headers.
        if (!this.server.production) {
            this._cache = false; // @todo @tmp
        }
        if (
        // (this.callback == null || this.is_image_endpoint) &&
        (typeof this._cache === "number" || this._cache === true)) {
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
        this._dynamic_initialized = true;
    }
    // Set default headers.
    _set_headers(stream) {
        this.headers.forEach((item) => {
            stream.set_header(item[0], item[1]);
        });
    }
    // Serve a client.
    async _serve_options(stream) {
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
        }
        catch (err) {
            throw err; // must have another catch block here otherwise when an error occurs in here it is somehow not catched by the try and catch block from Server._serve which will cause the program to crash.
        }
    }
    async _serve(stream, status_code = 200, opts) {
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
                    let promise;
                    if (this.params_validator != null) {
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
