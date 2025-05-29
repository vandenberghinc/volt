/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Imports.

const CleanCSS = require('clean-css');

const View = require(`${__dirname}/view.js`);
const zlib = require('zlib');
const {vlib, vhighlight} = require("./vinc.js");
const utils = require("./utils.js");
const Status = require("./status.js");
const logger = require("./logger.js");
const {RateLimits} = require("./rate_limit.js");
const {FrontendError} = utils;

const log_source = logger.LogSource("Endpoint")

// ---------------------------------------------------------
// Endpoint.

/*  @docs:
 *  @nav: Backend
    @chapter: Endpoints
    @title: Endpoint
    @description:
        The endpoint class.
    @parameter:
        @name: method
        @description: The method type.
        @type: string
    @parameter:
        @name: endpoint
        @description: The endpoint sub url.
        @type: string
    @parameter:
        @name: authenticated
        @description: Only allow authenticated requests.
        @type: string
    @parameter:
        @name: rate_limit
        @description: 
            The rate limit settings.
            
            Rate limiting works by creating a rate limit per group of endpoints. Multiple rate limiting groups can be applied by defining an array with rate limit objects. A group's interval and limit only need to be defined once on a single endpoint. When defined again these values will override the innitial group settings.

            The rate limit parameter may be defined as three types.
            - `string`: The assign the rate limit group without any group parameters. This can be useful when the group is already defined.
            - `RateLimitObject`: As a rate limit object.
            - `RateLimitObject[]`: As an array with multiple rate limit objects.

            When left undefined no rate limiting will be applied. 
        @type: null, string, RateLimitObject, RateLimitObject[]
        @attributes_type: RateLimitObject
        @attribute:
            @name: group
            @description: The rate limit group.
            @type: string
            @default: "global"
        @attribute:
            @name: limit
            @description: The maximum requests per rate limit interval. These settings will be cached per group and only have to be assigned once. The assigned attributes will be overridden when these attributes are reassigned for the same group.
            @type: number
            @default: 50
        @attr:
            @name: interval
            @description: The rate limit interval in seconds. These settings will be cached per group and only have to be assigned once. The assigned attributes will be overridden when these attributes are reassigned for the same group.
            @type: number
            @default: 60
    @parameter:
        @name: callback
        @description:
            The callback that will be executed when a client requests this endpoint.
            Parameter `callback` precedes over parameter `data` and parameter `view`.
            The callback can take parameter `stream` assigned with the `volt.Stream` object of the request.
        @type: function
    @parameter:
        @name: view
        @description:
            The javascript view that will be executed on the client side.
            Parameter `view` precedes over parameter `data`.
        @type: View, object
    @parameter:
        @name: data
        @description:
            The data that will be returned as the response body.
        @type: number, string, array, object
    @parameter:
        @name: content_type
        @description: The content type for parameter `data` or `callback`.
        @type: string
    @parameter:
        @name: compress
        @description: Compress data, only available when initialized with one of the following parameters `view` or `data`.
        @type: boolean
    @parameter:
        @name: cache
        @description: 
            Parameter cache can define the max age of the cached response in seconds or as a boolean `true`. Anything higher than zero enables caching. When server production mode is enabled caching is done automatically unless `cache` is `false`. When production mode is disabled responses are never cached, even though the parameter is assigned. The response of an endpoint that uses parameter `callback` is never cached.
        @type: boolean, number
    @parameter:
        @name: sitemap
        @description: 
            A boolean indicating if the endpoint should show up in the sitemap. By default only when the attribute `view` is defined and the endpoint is unauthenticated, the endpoint will show up in sitemap.
        @type: boolean
    @parameter:
        @name: robots
        @description: 
            A boolean indicating if the endpoint should be crawled by search engines. By default only endpoints with `view` enabled will be crawled, unless specified otherwise.
        @type: boolean
    @parameter:
        @name: ip_whitelist
        @description: 
            An IP whitelist for the endpoint. When the parameter is defined with an `Array` type, the whitelist will become active.
        @type: boolean
    @parameter:
        @name: _path
        @ignore: true
    @parameter:
        @name: _is_static
        @ignore: true
 */
class Endpoint {

    // Static attributes.
    static rate_limits = new Map();

    // Constructor.
    constructor({
        method = "GET",
        endpoint = "/",
        authenticated = false,
        rate_limit = null,
        params = null,
        callback = null,
        view = null,
        data = null,
        content_type = "text/plain",
        compress = true,
        cache = true,
        ip_whitelist = null,
        sitemap = null,
        robots = null,
        _templates = {}, // only used in loading static files.
        _path = null,
        _is_static = false,
    }) {

        // Attributes.
        this.method = method;
        this.endpoint = endpoint;
        this.authenticated = authenticated;
        this.params = params;
        if (this.callback === undefined) { // only assign when undefined, so derived classes can also define the callback function.
            this.callback = callback;
        }
        this.data = data;
        this.content_type = content_type;
        this.compress = compress !== false;
        this.cache = cache;
        this.sitemap = sitemap;
        this.robots = robots;
        this._templates = _templates;
        this._path = _path == null ? _path : new vlib.Path(_path).abs().str(); // use abs, is automatically assigned for static files.
        this.ip_whitelist = Array.isArray(ip_whitelist) ? ip_whitelist : null;
        this.is_static = _is_static;
        this.headers = [];

        // Excluded endpoint chars
        if (typeof endpoint === "string") {
            ["\n", "\,"].iterate((c) => {
                if (this.endpoint.indexOf(c) !== -1) {
                    throw Error("The \",\" character is not allowed inside an endpoint url.");
                }
            });
        }

        // Clean endpoint url.
        this.endpoint = utils.clean_endpoint(this.endpoint);

        if (this.compress) {
            console.log(">>> compress", { endpoint: this.endpoint, content_type: this.content_type })
        }

        // Argument `view` may also be passed as an object instead of class View.
        if (view == null) {
            this.view = null;
        } else if (view instanceof View) {
            this.view = view;
        } else {
            this.view = new View(view);
        }

        // Set default visible in sutemap.
        if (this.sitemap == null) {
            if (
                this.view != null &&
                this.endpoint != "robots.txt" &&
                this.endpoint != "sitemap.xml" &&
                !this.authenticated
            ) {
                this.sitemap = true;
            } else {
                this.sitemap = false;
            }
        }

        // Set crawling by robots.
        if (this.robots == null) {
            this.robots = !this.authenticated && (this.view != null || this.endpoint == "robots.txt" || this.endpoint == "sitemap.xml");
        }

        // Assign rate limits.
        this.rate_limits = [];
        if (Array.isArray(rate_limit)) {
            rate_limit.iterate((item) => {
                this.rate_limits.append(RateLimits.add(item))
            });
        } else if (typeof rate_limit === "string") {
            this.rate_limits.append(RateLimits.add({group: rate_limit}))
        } else if (typeof rate_limit === "object" && rate_limit != null) {
            this.rate_limits.append(RateLimits.add(rate_limit))
        }

        // The endpoint parent for params verification.
        this._verify_params_parent = this.method + ":" + this.endpoint + ":";
    }

    // Load data by path.
    _load_data_by_path(server) {
        
        // Load data.
        const path = new vlib.Path(this._path);
        let data;
        if (path.extension() === ".js") {

            data = path.load_sync();
            const hash = server.hash(data);

            // Check cache for restarts by file watcher.
            const {cache_path, cache_hash, cache_data} = utils.get_compiled_cache(server.domain, "GET", path.str());
            if (cache_data && hash === cache_hash) {
                data = cache_data;
            }

            // Compile.
            else {
                const compiler = new vhighlight.JSCompiler({
                    line_breaks: true,
                    double_line_breaks: false,
                    comments: false,
                    white_space: false,
                })
                data = compiler.compile_code(data, path.str());

                // Cache for restarts.
                utils.set_compiled_cache(cache_path, data, hash);
            }
        }
        else if (path.extension() === ".css") {
            const minifier = new CleanCSS();
            data = minifier.minify(path.load_sync()).styles;
        }
        else {
            data = path.load_sync({type: null});
        }

        // Fill templates.
        if (this._templates) {
            data = utils.fill_templates(data, this._templates);
        }

        // Assign.
        this.data = data;
        return this;
    }

    // Set default headers.
    _set_headers(stream) {
        this.headers.iterate((item) => {
            stream.set_header(item[0], item[1]);
        })
    }

    // Refresh for file watcher.
    async _refresh(server) {

        // Not in production.
        if (server.production) {
            throw new Error("This function is not designed for production mode.");
        }

        // Build html code of view.
        if (this.view !== null) {
            await this.view._build_html();
        }


    }

    // Initialize.
    async _initialize(server) {

        // Build html code of view.
        if (this.view !== null) {
            this.view._initialize(server, this);
            await this.view._build_html();
        }

        // Compression enabled.
        if (server.production && this.callback == null && this.compress) {
            this._is_compressed = true;
            if (this.data !== null) {
                this.data = "Hello World!";
                this.raw_data = this.data;
                this.data = zlib.gzipSync(this.data, {level: zlib.constants.Z_BEST_COMPRESSION});;
            } else if (this.view !== null) {
                this.view.html = "Hello World!";
                this.view.raw_html = this.view.html;
                this.view.html = zlib.gzipSync(this.view.html, {level: zlib.constants.Z_BEST_COMPRESSION});
            }
        }

        // Set content length.
        // this.content_length = null;
        // if (this.data !== null) {
        //     this.content_length = this.data.length;
        // }
        // else if (this.view !== null) {
        //     this.content_length = this.view.html.length;
        // }

        // Set cache headers.
        if (!server.production) {
            this.cache = false;
        }
        if ((this.callback === null || this.is_image_endpoint) && (typeof this.cache === "number" || this.cache === true)) {
            if (this.cache === 1 || this.cache === true) {
                this.headers.append(["Cache-Control", "max-age=86400"]);
            } else {
                this.headers.append(["Cache-Control", `max-age=${this.cache}`]);
            }
        }

        // Set compression headers.
        if (this._is_compressed) {
            this.headers.append(["Content-Encoding", "gzip"]);
            this.headers.append(["Vary", "Accept-Encoding"]);
        }

        // Set content length.
        if (this.content_length != null) {
            this.headers.append(["Content-Length", this.content_length]);
        }

        // Set content type.
        if (this.content_type != null) {
            this.headers.append(["Content-Type", this.content_type]);
        }
    }

    // Serve a client.
    async _serve(stream, status_code = 200) {
        try {

            // Check IP whitelist.
            if (this.ip_whitelist && !this.ip_whitelist.includes(stream.ip)) {
                stream.send({
                    status: Status.unauthorized, 
                    data: "Unauthorized.",
                });
                return ;
            }

            // Set headers.
            this._set_headers(stream);

            // Callback.
            if (this.callback !== null) {
                if (this.params != null) {
                    const {error, invalid_fields} = vlib.scheme.verify({
                        object: stream.params, 
                        scheme: this.params, 
                        check_unknown: true, 
                        parent: this._verify_params_parent, 
                        throw_err: false,
                    });
                    if (error) {
                        stream.send({
                            status: Status.bad_request, 
                            headers: {"Content-Type": "application/json"},
                            data: {
                                error,
                                invalid_fields,
                            }
                        });
                        return ;
                    }
                }
                try {
                    let promise;
                    if (this.params != null) {
                        promise = this.callback(stream, stream.params);
                    } else {
                        promise = this.callback(stream);
                    }
                    if (promise instanceof Promise) {
                        await promise;
                    }
                } catch (err) {
                    if (err instanceof FrontendError) { 
                        let data = {error: err.message != null ? err.message : "Internal Server Error"};
                        if (err.data != null && typeof err.data === "object") {
                            Object.expand(data, err.data);
                        }
                        stream.send({
                            status: err.status != null ? err.status : Status.internal_server_error, 
                            headers: {"Content-Type": "application/json"},
                            data,
                        });
                    } else {
                        stream.send({
                            status: Status.internal_server_error, 
                            headers: {"Content-Type": "application/json"},
                            data: {error: "Internal Server Error"},
                        });
                    }
                    logger.error(log_source, `${this.method}:${this.endpoint}: `, err); // after sending the response since this edits the error.
                }
                return ;
            }

            // View.
            else if (this.view !== null) {
                this.view._serve(stream, status_code);
                return ;
            }

            // Data.
            else if (this.data !== null) {
                stream.send({
                    status: status_code, 
                    data: this.data,
                });
                return ;
            }

            // Undefined.
            else {
                throw new Error(`${this.method} ${this.endpoint}: Undefined behaviour, define one of the following endpoint attributes [callback, view, data].`);
            }
        } catch (err) {
            throw err; // must have another catch block here otherwise when an error occurs in here it is somehow not catched by the try and catch block from Server._serve which will cause the program to crash.
        }
    }
}

// ---------------------------------------------------------
// Exports.

module.exports = Endpoint;
