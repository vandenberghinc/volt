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
var import_clean_css = __toESM(require("clean-css"));
var import_zlib = __toESM(require("zlib"));
var import_view = require("./view.js");
var vlib = __toESM(require("@vandenberghinc/vlib"));
var import_utils = require("./utils.js");
var import_status = require("./status.js");
var import_rate_limit = require("./rate_limit.js");
var import_route = require("./route.js");
var import_meta = __toESM(require("./meta.js"));
const { debug } = vlib;
class Endpoint {
  // Static attributes.
  static compressed_content_types = [
    // Image formats (often already compressed)
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/tiff",
    "image/vnd.microsoft.icon",
    // ICO
    // Audio formats (usually compressed)
    "audio/mpeg",
    // MP3
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
    "video/x-msvideo",
    // AVI
    "video/quicktime",
    // MOV
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
    "application/octet-stream"
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
  constructor({
    method = "GET",
    endpoint = "/",
    authenticated = false,
    rate_limit = void 0,
    params = void 0,
    compress = "auto",
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
    this.route = new import_route.Route(method, endpoint);
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
    if (typeof endpoint === "string") {
      ["\n", ","].forEach((c) => {
        if (endpoint.indexOf(c) !== -1) {
          throw Error('The "," character is not allowed inside an endpoint url.');
        }
      });
    }
    if (compress === "auto" || typeof compress !== "boolean") {
      compress = Endpoint.compressed_content_types.includes(this.content_type ?? "");
    } else if (compress === true && this.content_type != null && Endpoint.compressed_content_types.includes(this.content_type)) {
      debug(3, this.route.id, ": ", `Overriding parameter "compress", disabling compression.`);
      compress = false;
    }
    this._compress = compress;
    this._compress = false;
    if (this._compress) {
      debug(3, this.route.id, ": ", "Compression enabled.", { content_type: this.content_type });
    }
    if (view == null) {
      this.view = void 0;
    } else if (view instanceof import_view.View) {
      this.view = view;
    } else {
      this.view = new import_view.View(view);
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
      this.params_schema = new vlib.Schema.Validator({
        schema: params_scheme,
        unknown: !allow_unknown_params,
        parent: this.route.id + ":",
        throw: false
      });
    }
  }
  /** Initialize with server. */
  _initialize(server) {
    this.server = server;
    if (this.view != null) {
      this.view._initialize(server, this);
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
    if (this.view != null) {
      await this.view._build_html();
    }
    if (this.file_path != null) {
      this._load_data_by_path(this.server);
    }
    if (this.server.production && this.callback == null && this._compress) {
      this._is_compressed = true;
      if (this.data != null && (this.data instanceof Buffer || typeof this.data === "string")) {
        this.raw_data = this.data;
        this.data = import_zlib.default.gzipSync(this.data, { level: import_zlib.default.constants.Z_BEST_COMPRESSION });
        this.content_length = this.data.length;
      } else if (this.view != null) {
        this.view.raw_html = this.view.html;
        this.view.html = import_zlib.default.gzipSync(this.view.html, { level: import_zlib.default.constants.Z_BEST_COMPRESSION });
        this.content_length = this.view.html.length;
      }
      debug(2, this.route.id, ": ", "Compressed - content_length:", this.content_length);
    }
    this._cache = false;
    if ((this.callback == null || this.is_image_endpoint) && (typeof this._cache === "number" || this._cache === true)) {
      if (this._cache === 1 || this._cache === true) {
        this.headers.push(["Cache-Control", "max-age=86400"]);
      } else {
        this.headers.push(["Cache-Control", `max-age=${this._cache}`]);
      }
    }
    if (this._is_compressed) {
      this.headers.push(["Content-Encoding", "gzip"]);
      this.headers.push(["Vary", "Accept-Encoding"]);
    }
    if (this.content_length != null) {
      this.headers.push(["Content-Length", this.content_length.toString()]);
    }
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
  async _serve(stream, status_code = 200) {
    if (!this._initialized) {
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
        if (this.params_schema != null) {
          const { error, invalid_fields } = this.params_schema.validate(stream.params ?? {});
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
          let promise;
          if (this.params_schema != null) {
            promise = this.callback(stream, stream.params ?? {});
          } else {
            promise = this.callback(stream, {});
          }
          if (promise instanceof Promise) {
            await promise;
          }
        } catch (err) {
          if (err instanceof import_utils.ExternalError || err instanceof import_utils.InternalError) {
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
        this.view._serve(stream, status_code);
        return;
      } else if (this.data != null) {
        this.server?.log(3, this.route.id, ": ", "Serving endpoint in data mode.");
        stream.send({
          status: status_code,
          data: this.data
        });
        return;
      } else {
        throw new Error(`${this.id}: Undefined behaviour, define one of the following endpoint attributes [callback, view, data].`);
      }
    } catch (err) {
      throw err;
    }
  }
  // Load data by path.
  _load_data_by_path(server) {
    if (!this.file_path) {
      throw new Error(`Endpoint "${this.id}" has no file path assigned.`);
    }
    const path = new vlib.Path(this.file_path);
    let data;
    if (path.extension() === ".js") {
      data = path.load_sync();
    } else if (path.extension() === ".css") {
      const minifier = new import_clean_css.default();
      data = minifier.minify(path.load_sync()).styles;
    } else {
      data = path.load_sync({ type: "buffer" });
    }
    this.data = data;
    return this;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Endpoint
});
