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
import { RateLimits } from "./rate_limit.js";
import { Route } from './route.js';
import Meta from './meta.js';
import { Utils } from './utils.js';
const { debug } = vlib;
// ---------------------------------------------------------
// Endpoint
/**
 * The endpoint class.
 * @nav Endpoints
 * @docs
 */
export class Endpoint {
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
    // private _is_compressed?: boolean;
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
    static method(method) {
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
    static endpoint(endpoint) {
        return endpoint;
    }
    /**
     * Construct an endpoint.
     * @docs
     */
    constructor({ method, endpoint, authenticated = false, rate_limit = undefined, params = undefined, compress = true, cache = true, ip_whitelist = undefined, sitemap = undefined, robots = undefined, allow_unknown_params = false, _is_static = false, 
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
        }
        else if (this.file_path) {
            this._compress = !(Utils.is_compressed_extension(this.file_path.extension()) ?? false);
        }
        else if (this.content_type != null) {
            this._compress = !Utils.is_compressed_content_type(this.content_type);
        }
        else {
            this._compress = true;
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
    async serve({ stream, status: status_code = 200, templates, }) {
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
                        await this.callback(stream, (stream.params ?? {}));
                    }
                    else {
                        await this.callback(stream, {});
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
                await this.view._serve(stream, status_code, { compress: this._compress, templates: templates });
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
        }
        catch (err) {
            throw err; // must have another catch block here otherwise when an error occurs in here it is somehow not catched by the try and catch block from Server._serve which will cause the program to crash.
        }
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
        // Set cache headers.
        if (!this.server.production) {
            this._cache = false; // @todo @tmp
        }
        if (typeof this._cache === "number" || this._cache === true) {
            if (this._cache === 1 || this._cache === true) {
                this.headers.push(["Cache-Control", "max-age=86400"]);
            }
            else {
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
            // Send.
            stream.send({ status: Status.no_content });
        }
        catch (err) {
            throw err; // must have another catch block here otherwise when an error occurs in here it is somehow not catched by the try and catch block from Server._serve which will cause the program to crash.
        }
    }
}
