var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  Endpoint: () => Endpoint
});
module.exports = __toCommonJS(stdin_exports);
var import_view = require("./view.js");
var vlib = __toESM(require("@vandenberghinc/vlib"));
var import_internal_external = require("./errors/internal_external.js");
var import_status = require("./status.js");
var import_rate_limit = require("./rate_limit.js");
var import_route = require("./route.js");
var import_meta = __toESM(require("./meta.js"));
var import_utils = require("./utils.js");
const { debug } = vlib;
class Endpoint {
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
        callback: endpoint.callback
      }),
      view: endpoint.view?.clone(),
      ...override
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
  constructor({
    method,
    endpoint,
    authenticated = false,
    rate_limit = void 0,
    params = void 0,
    compress = true,
    cache = true,
    ip_whitelist = void 0,
    sitemap = void 0,
    robots = void 0,
    allow_unknown_params = false,
    _is_static = false,
    // mode options.
    callback = void 0,
    view = void 0,
    data = void 0,
    file_path = void 0,
    content_type
    // = "text/plain",
  }) {
    this.route = new import_route.Route(method ?? "GET", endpoint);
    this.id = this.route.id;
    this.authenticated = authenticated;
    if (this.callback === void 0) {
      this.callback = callback;
    }
    this.data = data;
    this.content_type = content_type;
    this._cache = cache;
    this.allow_sitemap = sitemap ?? true;
    this.allow_robots = robots ?? true;
    this.file_path = file_path == null ? file_path : new vlib.Path(file_path).abs();
    this.ip_whitelist = Array.isArray(ip_whitelist) ? ip_whitelist : void 0;
    this.is_static = _is_static;
    this.headers = [];
    this.params_schema = params;
    this.allow_unknown_params = allow_unknown_params;
    if (typeof endpoint === "string") {
      ["\n", ","].forEach((c) => {
        if (endpoint.indexOf(c) !== -1) {
          throw Error('The "," character is not allowed inside an endpoint url.');
        }
      });
    }
    if (view == null) {
      this.view = void 0;
    } else if (view instanceof import_view.View) {
      this.view = view;
    } else {
      this.view = new import_view.View(view);
    }
    if (this.file_path != null && this.content_type == null) {
      this.content_type = import_utils.Utils.mime_type(this.file_path.extension()) ?? "application/octet-stream";
    } else if (this.view != null) {
      this.content_type = "text/html";
    }
    if (compress === false) {
      this._compress = false;
    } else if (this.file_path) {
      this._compress = !(import_utils.Utils.is_compressed_extension(this.file_path.extension()) ?? false);
    } else if (this.content_type != null) {
      this._compress = !import_utils.Utils.is_compressed_content_type(this.content_type);
    } else {
      this._compress = true;
    }
    if (this.allow_sitemap == null) {
      if (this.view != null && this.route.endpoint != "robots.txt" && this.route.endpoint != "sitemap.xml" && !this.authenticated) {
        this.allow_sitemap = true;
      } else {
        this.allow_sitemap = false;
      }
    }
    if (this.allow_robots == null) {
      this.allow_robots = !this.authenticated && (this.view != null || this.route.endpoint == "robots.txt" || this.route.endpoint == "sitemap.xml");
    }
    this.rate_limit_groups = [];
    if (Array.isArray(rate_limit)) {
      rate_limit.forEach((item) => {
        if (typeof item === "string") {
          const group = import_rate_limit.RateLimits.groups.get(item);
          if (!group)
            throw new Error(`Rate limit group "${item}" does not exist.`);
          this.rate_limit_groups.push(group);
        } else {
          this.rate_limit_groups.push(import_rate_limit.RateLimits.add(item));
        }
      });
    } else if (typeof rate_limit === "string") {
      const group = import_rate_limit.RateLimits.groups.get(rate_limit);
      if (!group)
        throw new Error(`Rate limit group "${rate_limit}" does not exist.`);
      this.rate_limit_groups.push(group);
    } else if (typeof rate_limit === "object" && rate_limit != null) {
      this.rate_limit_groups.push(import_rate_limit.RateLimits.add(rate_limit));
    }
    let params_scheme = params;
    if (this.route.params.length > 0) {
      params_scheme ??= {};
      this.route.params.forEach((item) => {
        if (params_scheme[item.name] == null) {
          params_scheme[item.name] = {
            type: "string",
            required: item.required ?? true,
            allow_empty: false
          };
        }
      });
    }
    if (params_scheme != null) {
      this.params_validator = new vlib.Schema.Validator({
        schema: params_scheme,
        unknown: allow_unknown_params,
        parent: this.route.id + ":",
        throw: false
      });
    }
  }
  /**
   * Serve this endpoint manually from a stream.
   * This can for instance be used to serve a HTML `/error` endpoint from within a callback.
   * @docs
   */
  async serve({ stream, status: status_code = 200, templates }) {
    if (!this._dynamic_initialized) {
      await this._dynamic_initialize();
    }
    try {
      if (this.ip_whitelist && !this.ip_whitelist.includes(stream.ip)) {
        this.server?.log(2, this.route.id, ": ", "Blocking ip ", stream.ip, " per ip whitelist.");
        stream.send({
          status: import_status.Status.unauthorized,
          data: "Unauthorized."
        });
        return;
      }
      this._set_headers(stream);
      if (this.callback != null) {
        this.server?.log(3, this.route.id, ": ", "Serving endpoint in callback mode.");
        if (this.params_validator != null) {
          const { error, invalid_fields } = this.params_validator.validate(stream.params ?? {});
          if (error) {
            stream.send({
              status: import_status.Status.bad_request,
              headers: { "Content-Type": "application/json" },
              data: {
                error,
                invalid_fields
              }
            });
            return;
          }
        }
        try {
          if (this.params_validator != null) {
            await this.callback(stream, stream.params ?? {});
          } else {
            await this.callback(stream, {});
          }
        } catch (err) {
          if (err instanceof import_internal_external.ExternalError || err instanceof import_internal_external.InternalError) {
            err.serve(stream);
          } else {
            stream.error({
              status: import_status.Status.internal_server_error,
              headers: { "Content-Type": "application/json" },
              message: "Internal Server Error",
              type: "InternalServerError"
            });
          }
          this.server?.log.error(`${this.id}: `, err);
        }
        return;
      } else if (this.view != null) {
        this.server?.log(3, this.route.id, ": ", "Serving endpoint in view mode.");
        await this.view._serve(stream, status_code, { compress: this._compress, templates });
        return;
      } else if (this.file_path != null) {
        this.server?.log(3, this.route.id, ": ", "Serving endpoint in file mode.");
        stream.send({
          status: status_code,
          from_file: this.file_path,
          compress: this._compress,
          templates
        });
        return;
      } else if (this.data != null) {
        this.server?.log(3, this.route.id, ": ", "Serving endpoint in data mode.");
        stream.send({
          status: status_code,
          data: this.data,
          compress: this._compress,
          templates
        });
        return;
      } else {
        throw new Error(`${this.id}: Undefined behaviour, define one of the following endpoint attributes [callback, view, data].`);
      }
    } catch (err) {
      throw err;
    }
  }
  // ----------------------------------------------------------
  // System methods.
  /** Initialize with server. */
  _initialize(server) {
    if (this.server != null) {
      return this;
    }
    this.server = server;
    if (this.view != null) {
      this.view.initialize(server, this);
    }
    if (this.view != null) {
      if (this.view.meta == null) {
        this.view.meta = server.meta.copy();
      } else if (typeof this.view.meta === "object" && !(this.view.meta instanceof import_meta.default)) {
        this.view.meta = new import_meta.default(this.view.meta);
      }
    }
    return this;
  }
  // Initialize.
  async _dynamic_initialize() {
    if (!this.server) {
      throw new Error(`Endpoint "${this.id}" is not initialized by the server yet.`);
    }
    if (!this.server.production) {
      this._cache = false;
    }
    if (typeof this._cache === "number" || this._cache === true) {
      if (this._cache === 1 || this._cache === true) {
        this.headers.push(["Cache-Control", "max-age=86400"]);
      } else {
        this.headers.push(["Cache-Control", `max-age=${this._cache}`]);
      }
    }
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
      if (this.ip_whitelist && !this.ip_whitelist.includes(stream.ip)) {
        stream.error({
          status: import_status.Status.unauthorized,
          type: "Unauthorized",
          message: "Unauthorized."
        });
        return;
      }
      this._set_headers(stream);
      stream.send({ status: import_status.Status.no_content });
    } catch (err) {
      throw err;
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Endpoint
});
