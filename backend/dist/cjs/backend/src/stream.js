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
  Stream: () => Stream
});
module.exports = __toCommonJS(stdin_exports);
var vlib = __toESM(require("@vandenberghinc/vlib"));
var import_node_stream = require("node:stream");
var fs = __toESM(require("node:fs"));
var import_node_stream2 = require("node:stream");
var zlib = __toESM(require("node:zlib"));
var import_rate_limit = __toESM(require("./rate_limit.js"));
var import_utils = require("./utils.js");
const { debug } = vlib;
class Stream {
  /** The request headers. */
  headers;
  /** Whether this stream is an HTTP/2 stream. */
  http2;
  /** Whether this stream is an HTTP/1.1 stream (when false, it's an HTTP/2 stream). */
  http1;
  /** The status code of the sent response. */
  status_code;
  /** Whether the response has been finished. */
  finished;
  /** The received body potentially decompressed as string. */
  body;
  /** The raw body as a Buffer, potentially decompressed. */
  raw_body;
  /** The body wired exactly as is, not decompressed etc. */
  wire_body;
  /** The internal promise that resolves when the body is fully received. */
  promise;
  /** The cached value of {@link normalize_ip} */
  _normalized_ip;
  s;
  req;
  res;
  _ip;
  _port;
  _method;
  _params;
  _is_query_params;
  _endpoint;
  _query_string;
  _cookies;
  _uid;
  res_cookies;
  res_headers;
  /**
   * Create a new Stream wrapper for HTTP/1.1 or HTTP/2.
   *
   * @param stream The HTTP/2 stream (when using HTTP/2).
   * @param headers The request headers.
   * @param req The HTTP/1.1 request (when using HTTP/1.1).
   * @param res The HTTP/1.1/HTTP/2 response object.
   */
  constructor(stream, headers, req, res) {
    this.s = stream;
    this.headers = headers ?? {};
    this.req = req;
    this.res = res;
    this.http2 = req == null;
    this.http1 = req != null;
    if (this.http1) {
      this.headers = this.req.headers;
    }
    this._ip = this.http2 ? this.s.session.socket.remoteAddress : this.req.socket.remoteAddress;
    this._port = this.http2 ? this.s.session.socket.remotePort : this.req.socket.remotePort;
    this._method = this.http2 ? this.headers[":method"] : this.req.method;
    this._params = void 0;
    this._is_query_params = false;
    this._endpoint = void 0;
    this._query_string = void 0;
    this._cookies = void 0;
    this._uid = void 0;
    this.status_code = void 0;
    this.finished = false;
    this.res_cookies = [];
    this.res_headers = this.http1 ? [] : {};
    this.body = "";
    this.raw_body = Buffer.alloc(0);
    this.wire_body = Buffer.alloc(0);
    this.promise = void 0;
    this._recv_body();
  }
  /**
   * Receive and buffer the request body, handling optional gzip/deflate decompression.
   * Sets {@link body} and resolves the internal promise used by {@link join}.
   */
  _recv_body() {
    this.promise = new Promise((resolve, reject) => {
      const buffs = [];
      const wire_buffs = [];
      let decompress_stream;
      const content_encoding = this.headers["content-encoding"];
      if (content_encoding === "gzip") {
        decompress_stream = zlib.createGunzip();
      } else if (content_encoding === "deflate") {
        decompress_stream = zlib.createInflate();
      }
      const cleanup = () => {
        if (decompress_stream) {
          decompress_stream.close();
        }
      };
      const on_error = (e) => {
        cleanup();
        reject(e);
      };
      if (this.http2) {
        const source2 = this.s;
        source2.on("data", (chunk) => {
          wire_buffs.push(chunk);
        });
        let decoded2 = source2;
        if (decompress_stream) {
          decoded2 = source2.pipe(decompress_stream);
        }
        source2.on("error", on_error);
        decoded2.on("error", on_error);
        decoded2.on("data", (chunk) => {
          buffs.push(chunk);
        });
        decoded2.on("end", () => {
          try {
            this.wire_body = Buffer.concat(wire_buffs);
            this.raw_body = Buffer.concat(buffs);
            this.body = this.raw_body.toString("utf8");
            cleanup();
            resolve();
          } catch (e) {
            on_error(e);
          }
        });
        return;
      }
      const source = this.req;
      source.on("data", (chunk) => {
        wire_buffs.push(chunk);
      });
      let decoded = source;
      if (decompress_stream) {
        decoded = source.pipe(decompress_stream);
      }
      source.on("error", on_error);
      decoded.on("error", on_error);
      decoded.on("data", (chunk) => {
        buffs.push(chunk);
      });
      decoded.on("end", () => {
        try {
          this.wire_body = Buffer.concat(wire_buffs);
          this.raw_body = Buffer.concat(buffs);
          this.body = this.raw_body.toString("utf8");
          cleanup();
          resolve();
        } catch (e) {
          on_error(e);
        }
      });
    });
  }
  /**
   * Parse and cache the request endpoint and query string.
   * Populates {@link _endpoint} and {@link _query_string}.
   * @private
   */
  _parse_endoint() {
    if (this._endpoint !== void 0) {
      return;
    }
    this._endpoint = this.http2 ? this.headers[":path"] : this.req.url;
    let index;
    if ((index = this._endpoint.indexOf("?")) !== -1) {
      this._query_string = this._endpoint.substr(index + 1);
      this._endpoint = this._endpoint.substr(0, index);
    }
    this._endpoint = this._endpoint.replace(/\/\//g, "/");
    if (this._endpoint.length > 1 && this._endpoint.charAt(this._endpoint.length - 1) === "/") {
      this._endpoint = this._endpoint.substr(0, this._endpoint.length - 1);
    }
  }
  /**
   * Parse and cache request parameters from the query string or JSON body.
   * Returns the parsed params map.
   */
  _parse_params() {
    this._parse_endoint();
    if (this._params !== void 0) {
      return;
    }
    this._params = {};
    if (this._query_string !== void 0) {
      if (this._query_string.charAt(0) === "{") {
        try {
          this._params = JSON.parse(decodeURIComponent(this._query_string));
        } catch (err) {
          throw Error(`Invalid json request query: ${err}.`);
        }
      } else {
        this._is_query_params = true;
        let is_key = true, key = "", value = "";
        const number_regex = /^-?\d+(\.\d+)?$/;
        const add_value = () => {
          let output_value;
          switch (value) {
            case "true":
            case "True":
              output_value = true;
              break;
            case "false":
            case "False":
              output_value = false;
              break;
            case "null":
            case "None":
            case "undefined":
              output_value = null;
              break;
            default:
              output_value = decodeURIComponent(value.replaceAll("+", " "));
              if (number_regex.test(output_value)) {
                if (output_value.indexOf(".") !== -1) {
                  output_value = parseFloat(output_value);
                } else {
                  output_value = parseInt(output_value);
                }
              }
              break;
          }
          this._params[decodeURIComponent(key.replaceAll("+", " "))] = output_value;
          key = "";
          value = "";
          is_key = true;
        };
        for (let i = 0; i < this._query_string.length; i++) {
          const c = this._query_string.charAt(i);
          if (is_key && c === "=") {
            is_key = false;
            continue;
          } else if (is_key === false && c === "&") {
            add_value();
            continue;
          }
          if (is_key) {
            key += c;
          } else {
            value += c;
          }
        }
        if (key.length > 0) {
          add_value();
        }
      }
    } else if (this.body.trim().charAt(0) === "{") {
      try {
        this._params = JSON.parse(this.body);
      } catch (err) {
        throw Error(`Invalid json request body: ${err}.`);
      }
    }
    return this._params;
  }
  /**
   * Parses & returns the cookies  cookies,
   * while assigning it to {@link _cookies}
   *
   * @warning On subsequent calls cookies will be parsed again.
  */
  _parse_cookies() {
    this._cookies = {};
    const cookie_str = this.http2 ? this.headers["cookie"] : this.req.headers.cookie;
    if (cookie_str == null) {
      return this._cookies;
    }
    let key = "";
    let value = "";
    let cookie = {};
    let cookie_length = 0;
    let cookie_key = null;
    let is_value = false;
    let is_str = null;
    const append_to_cookie = () => {
      if (key.length > 0) {
        if (cookie_length === 0) {
          cookie.value = value;
        } else {
          cookie[key] = value;
        }
        ++cookie_length;
      }
      key = "";
      value = "";
      is_value = false;
      is_str = null;
    };
    const append_cookie = () => {
      if (cookie_key != null) {
        this._cookies[cookie_key] = cookie;
        cookie_key = null;
        cookie = {};
        cookie_length = 0;
      }
    };
    for (let x = 0; x < cookie_str.length; x++) {
      const c = cookie_str.charAt(x);
      if (is_value) {
        if (is_str === c) {
          value = value.substr(1, value.length - 1);
          append_to_cookie();
        } else if (is_str == null && c === " ") {
          append_to_cookie();
        } else if (is_str == null && c === ";") {
          append_to_cookie();
          append_cookie();
        } else {
          value += c;
          if (value.length === 1 && (c === '"' || c === "'")) {
            is_str = c;
          }
        }
      } else if (c == " " || c == "	") {
        continue;
      } else if (c == "=") {
        if (cookie_key == null) {
          cookie_key = key;
        }
        is_value = true;
      } else {
        key += c;
      }
    }
    append_to_cookie();
    append_cookie();
    return this._cookies;
  }
  // ---------------------------------------------------------
  // Functions.
  /**
   * Wait until the request body is fully received.
   * Resolves when the internal receive promise completes.
   */
  async join() {
    await this.promise;
  }
  // Get the requests ip.
  /**
   * Get the request's ip.
   *
   * @example
   * ```ts
   * const ip = stream.ip;
   * ```
   * @docs
   */
  get ip() {
    return this._ip;
  }
  /**
   * Retrieve the normalized IP address, suitable for rate limiting and logging.
   * @throws {Error} If the IP is invalid.
   * @returns The normalized IP.
   * @docs
   */
  normalized_ip() {
    if (this._normalized_ip != null) {
      return this._normalized_ip;
    }
    return this._normalized_ip = import_rate_limit.default.normalize_ip(this._ip);
  }
  // Get the requests port.
  /**
   * Get the request's port.
   *
   * @example
   * ```ts
   * const port = stream.port;
   * ```
   * @docs
   */
  get port() {
    return this._port;
  }
  // Get the method.
  /**
   * Get the request method.
   *
   * @example
   * ```ts
   * const method = stream.method;
   * ```
   * @docs
   */
  get method() {
    return this._method;
  }
  // Get the endpoint.
  /**
   * Get the request's endpoint. This will not include the query string.
   *
   * @example
   * ```ts
   * const endpoint = stream.endpoint;
   * ```
   * @docs
   */
  get endpoint() {
    if (this._endpoint !== void 0) {
      return this._endpoint;
    }
    this._parse_endoint();
    return this._endpoint;
  }
  // Get the params.
  /**
   * Get the request's query or body params.
   *
   * @example
   * ```ts
   * const params = stream.params;
   * ```
   * @docs
   */
  get params() {
    if (this._params !== void 0) {
      return this._params;
    }
    this._parse_params();
    return this._params;
  }
  /** Add a param (used by the server backend for path parameters). */
  add_param(name, value) {
    if (!this._params) {
      this._params = {};
    }
    this._params[name] = value;
  }
  // Get a param by name and optionally by type.
  /**
   * Get a single query or body parameter with an optional type cast.
   *
   * @warning Throws an error when the parameter does not exist or when the type is different from the specified type(s), unless parameter `def` is defined.
   *
   * @param name The name of the parameter.
   * @param type The type cast of the parameters, valid types are `[null, "boolean", "number", "string", "array", "object"]`.
   * @param def
   *          The default value to return when the parameter does not exist.
   *
   *          If the parameter is not defined and `def` is `undefined` then this function will throw an error.
   *          When `def` is `undefined` errors will be thrown, when `def` is `null` and the parameter is undefined then `null` will be returned as the default value.
   *
   *          Errors will always be thrown when the incorrect type has been sent by the user.
   * @example
   * ```ts
   * const param = stream.param("myparameter", "number", 10);
   * ```
   * @docs
   */
  param(name, type = null, def = void 0) {
    this._parse_params();
    let value = this._params[name];
    if (type != null) {
      let is_type_array = Array.isArray(type);
      const type_str = () => {
        let str = "";
        if (type != null) {
          str += " type ";
          if (is_type_array) {
            let i = 0, one_but_last_i = type.length - 2;
            type.forEach((item, i2) => {
              str += `"${item}"`;
              if (i2 < one_but_last_i) {
                str += ", ";
              } else if (i2 === one_but_last_i) {
                str += " or ";
              }
            });
          } else {
            str += `"${type}"`;
          }
        }
        return str;
      };
      const type_eq_or_includes = (match) => {
        if (is_type_array) {
          return type.includes(match);
        }
        return match === type;
      };
      if (value == null || value === "") {
        if (def !== void 0) {
          return def;
        }
        throw Error(`Define parameter "${name}"${type_str()}.`);
      }
      if (this._is_query_params && type_eq_or_includes("string") === false) {
        if (is_type_array === false) {
          type = [type];
        }
        const success = type.some((type2) => {
          if (type2 === "string") {
            return true;
          }
          if (type2 === "null" && value === "null") {
            value = null;
            return true;
          }
          const is_boolean = type2 === "boolean";
          if (is_boolean && value === "true") {
            value = true;
            return true;
          }
          if (is_boolean && value === "false") {
            value = false;
            return true;
          }
          if (type2 === "array") {
            value = value.split(",");
            return true;
          }
          if (type2 === "object") {
            const split = value.split(",");
            value = {};
            split.forEach((item) => {
              const pair = item.split(":");
              value[pair[0]] = pair[1];
            });
            return true;
          }
          if (type2 === "number" && /^-?\d+(\.\d+)?$/.test(value)) {
            value = parseFloat(value);
            return true;
          }
        });
        if (!success) {
          throw Error(`Parameter "${name}" should be of${type_str()}.`);
        }
      } else if (!this._is_query_params) {
        const value_type = typeof value;
        if (!is_type_array) {
          type = [type];
        }
        const success = type.some((type2) => {
          const l_is_array = type2 === "array";
          const l_is_null = type2 === "null";
          if (!l_is_array && !l_is_null && type2 === value_type) {
            return true;
          }
          if (l_is_null && value == null) {
            return true;
          }
          if (l_is_array && Array.isArray(value)) {
            return true;
          }
        });
        if (!success) {
          throw Error(`Parameter "${name}" should be of${type_str()}.`);
        }
      }
    } else if (value == null || value === "") {
      if (def !== void 0) {
        return def;
      }
      throw Error(`Define parameter "${name}".`);
    }
    return value;
  }
  // Get the request cookies.
  /**
   * Get the request's cookies
   *
   * @example
   * ```ts
   * const cookies = stream.cookies;
   * ```
   * @docs
   */
  get cookies() {
    if (this._cookies != null)
      return this._cookies;
    return this._parse_cookies();
  }
  // DEPRECATED since its only available for http2.
  // /**
  //  * Check if the stream is closed.
  //  *
  //  * @example
  //  * ```ts
  //  * const ip = stream.closed;
  //  * ```
  //  * @docs
  //  */
  // get closed(): boolean {
  //     if (!this.http2) { throw new Error("This function is only supported for http2 streams."); }
  //     return this.s!.closed;
  // }
  // Check if the stream is destroyed
  /**
   * Check if the stream is destroyed.
   *
   * @example
   * ```ts
   * const ip = stream.destroyed;
   * ```
   * @docs
   */
  get destroyed() {
    if (this.http2) {
      return this.s.destroyed;
    } else {
      return this.req.destroyed;
    }
  }
  // ---------------------------------------------------------
  // Functions.
  // Get the authenticated uid.
  /**
   * Get the authenticated uid; `undefined` when the request was not authenticated.
   *
   * @example
   * ```ts
   * const uid = stream.uid;
   * ```
   * @docs
   */
  get uid() {
    return this._uid;
  }
  set uid(value) {
    this._uid = value;
  }
  /**
   * Apply templates to an in-memory body.
   * Only applies to string bodies to avoid corrupting binary payloads.
   */
  apply_templates_to_body(input, templates) {
    if (templates == null || Object.keys(templates).length === 0) {
      return input;
    }
    if (typeof input !== "string") {
      return input;
    }
    let out = input;
    for (const key of Object.keys(templates)) {
      const value = templates[key];
      const value_str = typeof value === "string" ? value : JSON.stringify(value);
      out = out.split(`{{${key}}}`).join(value_str);
    }
    return out;
  }
  /**
   * Create a transform stream that applies templates across chunk boundaries.
   * This avoids missing replacements when a template key is split between chunks.
   */
  create_template_replace_transform(templates) {
    const keys = Object.keys(templates);
    const max_key_len = keys.reduce((max, k) => Math.max(max, k.length), 0);
    const keep_len = Math.max(0, max_key_len - 1);
    let carry = "";
    return new import_node_stream.Transform({
      transform(chunk, _enc, cb) {
        try {
          const str = carry + chunk.toString("utf8");
          const cut_idx = Math.max(0, str.length - keep_len);
          const safe_head = str.slice(0, cut_idx);
          carry = str.slice(cut_idx);
          let out = safe_head;
          for (const key of keys) {
            const value = templates[key];
            const value_str = typeof value === "string" ? value : JSON.stringify(value);
            out = out.split(`{{${key}}}`).join(value_str);
          }
          cb(null, out);
        } catch (err) {
          cb(err);
        }
      },
      flush(cb) {
        try {
          let out = carry;
          for (const key of keys) {
            const value = templates[key];
            const value_str = typeof value === "string" ? value : JSON.stringify(value);
            out = out.split(`{{${key}}}`).join(value_str);
          }
          cb(null, out);
        } catch (err) {
          cb(err);
        }
      }
    });
  }
  /** Create output headers for http2. */
  create_http2_headers(status, new_headers) {
    const normalize_header_value = (v) => {
      if (v == null)
        return void 0;
      if (typeof v === "boolean")
        return v ? "true" : "false";
      if (typeof v === "number")
        return v;
      if (typeof v === "string")
        return v;
      return String(v);
    };
    const out_headers = {
      ":status": status
    };
    if (!Array.isArray(this.res_headers)) {
      for (const [k, v] of Object.entries(this.res_headers)) {
        const nv = normalize_header_value(v);
        if (nv !== void 0)
          out_headers[k.toLowerCase()] = nv;
      }
    }
    for (const [k, v] of Object.entries(new_headers)) {
      const nv = normalize_header_value(v);
      if (nv !== void 0)
        out_headers[k.toLowerCase()] = nv;
    }
    if (this.res_cookies.length > 0) {
      out_headers["set-cookie"] = this.res_cookies;
    }
    return out_headers;
  }
  /** Assign http headers to response. */
  set_http1_headers(status, headers) {
    if (!this.res) {
      throw new Error("HTTP/1.1 response is missing.");
    }
    this.res.statusCode = status;
    for (let i = 0; i < this.res_headers.length; i++) {
      this.res.setHeader(this.res_headers[i][0].toLowerCase(), this.res_headers[i][1]);
    }
    Object.keys(headers).forEach((key) => {
      const v = headers[key];
      if (v != null) {
        this.res?.setHeader(key.toLowerCase(), typeof v === "boolean" ? v.toString() : v);
      }
    });
  }
  /**
   * Send a response.
   * @example
   * ```ts
   * stream.send({status: 200, data: "Hello World!"});
   * ```
   * @docs
   */
  send({ status = 200, headers = {}, data, compress = false, from_file, templates }) {
    this.status_code = status;
    let body = data;
    if (typeof body === "boolean" || typeof body === "number") {
      body = body.toString();
    }
    const get_accept_encoding = () => {
      const accept_encoding = this.headers?.["accept-encoding"];
      if (typeof accept_encoding === "string") {
        return accept_encoding;
      }
      if (Array.isArray(accept_encoding) && accept_encoding.length > 0) {
        return accept_encoding.join(", ");
      }
      const req_accept_encoding = this.req?.headers?.["accept-encoding"];
      if (typeof req_accept_encoding === "string") {
        return req_accept_encoding;
      }
      if (Array.isArray(req_accept_encoding) && req_accept_encoding.length > 0) {
        return req_accept_encoding.join(", ");
      }
      return "";
    };
    body = this.apply_templates_to_body(body, templates);
    if (this.http2) {
      const stream = this.s;
      const out_headers = this.create_http2_headers(status, headers);
      if (from_file) {
        const from_path = from_file instanceof vlib.Path ? from_file : new vlib.Path(from_file);
        const needs_template_replace = templates != null && Object.keys(templates).length > 0;
        const should_gzip = compress && get_accept_encoding().includes("gzip") && !(import_utils.Utils.is_compressed_extension(from_path.extension()) ?? false);
        const content_type = import_utils.Utils.mime_type(from_path.extension());
        if (content_type && out_headers["content-type"] == null) {
          out_headers["content-type"] = content_type;
        }
        const is_text_response = typeof content_type === "string" && (content_type.startsWith("text/") || content_type === "application/javascript" || content_type === "application/json" || content_type === "image/svg+xml" || content_type === "application/xml" || content_type === "text/xml");
        const should_apply_templates = needs_template_replace && is_text_response;
        if (should_gzip) {
          out_headers["content-encoding"] = "gzip";
          out_headers["vary"] = "Accept-Encoding";
          delete out_headers["content-length"];
        }
        if (should_apply_templates) {
          delete out_headers["content-length"];
        }
        if (!should_gzip && !should_apply_templates && typeof stream.respondWithFile === "function") {
          stream.respondWithFile(from_path.toString(), out_headers, {});
          if (debug.on(3))
            debug("Sending http2 file response: ", status, " - file: ", from_path.toString());
          this.finished = true;
          return this;
        }
        stream.respond(out_headers);
        const file_read_stream = fs.createReadStream(from_path.toString());
        const transforms = [];
        if (should_apply_templates) {
          transforms.push(this.create_template_replace_transform(templates));
        }
        if (should_gzip) {
          transforms.push(zlib.createGzip({ level: zlib.constants.Z_BEST_COMPRESSION }));
        }
        (0, import_node_stream2.pipeline)(file_read_stream, ...transforms, stream, (err) => {
          if (err) {
            try {
              stream.close();
            } catch {
            }
          }
        });
        if (debug.on(3))
          debug("Sending http2 streamed file response: ", status, " - file: ", from_path.toString());
        this.finished = true;
        return this;
      } else {
        if (body && typeof body === "object" && Buffer.isBuffer(body) === false && body instanceof Uint8Array === false) {
          out_headers["content-type"] = "application/json";
          body = JSON.stringify(body);
          body = this.apply_templates_to_body(body, templates);
        }
        if (body && typeof body === "object" && !(body instanceof Buffer) && !(body instanceof Uint8Array)) {
          body = JSON.stringify(body);
          body = this.apply_templates_to_body(body, templates);
        }
        const should_gzip_body = compress && !!body && get_accept_encoding().includes("gzip");
        if (should_gzip_body) {
          out_headers["content-encoding"] = "gzip";
          out_headers["vary"] = "Accept-Encoding";
          delete out_headers["content-length"];
        }
        console.log("Out headers: ", out_headers);
        stream.respond(out_headers);
        if (debug.on(3))
          debug("Sending response: ", status, " - has body: ", !!body);
        if (!body) {
          stream.end();
          this.finished = true;
          return this;
        } else if (should_gzip_body) {
          const raw_buffer = typeof body === "string" ? Buffer.from(body) : Buffer.isBuffer(body) || body instanceof Uint8Array ? Buffer.from(body) : Buffer.from(JSON.stringify(body));
          zlib.gzip(raw_buffer, { level: zlib.constants.Z_BEST_COMPRESSION }, (err, gz_buffer) => {
            if (err) {
              stream.end(raw_buffer);
              return;
            }
            stream.end(gz_buffer);
          });
          this.finished = true;
          return this;
        } else {
          if (Buffer.isBuffer(body) || body instanceof Uint8Array) {
            stream.end(body);
          } else {
            stream.end(Buffer.from(body));
          }
          this.finished = true;
          return this;
        }
      }
    } else {
      const req = this.req;
      const res = this.res;
      this.set_http1_headers(status, headers);
      if (from_file) {
        const from_path = from_file instanceof vlib.Path ? from_file : new vlib.Path(from_file);
        const content_type = import_utils.Utils.mime_type(from_path.extension());
        if (content_type) {
          res.setHeader("Content-Type", content_type);
        }
        const needs_template_replace = templates != null && Object.keys(templates).length > 0;
        const is_text_response = typeof content_type === "string" && (content_type.startsWith("text/") || content_type === "application/javascript" || content_type === "application/json" || content_type === "image/svg+xml" || content_type === "application/xml" || content_type === "text/xml");
        const should_apply_templates = needs_template_replace && is_text_response;
        const should_gzip = compress && get_accept_encoding().includes("gzip") && !(import_utils.Utils.is_compressed_extension(from_path.extension()) ?? false);
        if (should_gzip) {
          res.setHeader("Content-Encoding", "gzip");
          res.setHeader("Vary", "Accept-Encoding");
          res.removeHeader("Content-Length");
        } else if (!should_apply_templates) {
          try {
            if (from_path.is_file()) {
              res.setHeader("Content-Length", from_path.size);
            }
          } catch {
          }
        }
        if (should_apply_templates) {
          res.removeHeader("Content-Length");
        }
        const file_read_stream = fs.createReadStream(from_path.toString());
        const transforms = [];
        if (should_apply_templates) {
          transforms.push(this.create_template_replace_transform(templates));
        }
        if (should_gzip) {
          transforms.push(zlib.createGzip({ level: zlib.constants.Z_BEST_COMPRESSION }));
        }
        (0, import_node_stream2.pipeline)(file_read_stream, ...transforms, res, (err) => {
          if (err) {
            try {
              res.destroy(err);
            } catch {
            }
          }
        });
        if (debug.on(3))
          debug("Sending http1 streamed file response: ", status, " - file: ", from_path.toString());
        this.finished = true;
        return this;
      } else {
        if (body && typeof body === "object" && Buffer.isBuffer(body) === false && body instanceof Uint8Array === false) {
          res.setHeader("Content-Type", "application/json");
          body = JSON.stringify(body);
          body = this.apply_templates_to_body(body, templates);
        }
        const should_gzip_body = compress && !!body && get_accept_encoding().includes("gzip");
        if (should_gzip_body) {
          res.setHeader("Content-Encoding", "gzip");
          res.setHeader("Vary", "Accept-Encoding");
          res.removeHeader("Content-Length");
          const raw_buffer = typeof body === "string" ? Buffer.from(body) : Buffer.isBuffer(body) || body instanceof Uint8Array ? Buffer.from(body) : Buffer.from(JSON.stringify(body));
          zlib.gzip(raw_buffer, { level: zlib.constants.Z_BEST_COMPRESSION }, (err, gz_buffer) => {
            if (err) {
              res.end(raw_buffer);
              return;
            }
            res.end(gz_buffer);
          });
          if (debug.on(3))
            debug("Sending http1 response: ", status, " - has body: ", !!body, " - gzip: true");
        } else if (body) {
          res.end(body);
        } else {
          res.end();
        }
        this.finished = true;
        return this;
      }
    }
  }
  // Send a successs response.
  /**
   * Send a response
   *
   * @param options The response options.
   * @param options.status The response status.
   * @param options.headers The response headers.
   * @param options.data The data of the response body to send.
   * @param options.compress Whether the response should be gzip-compressed.
   * @example
   * ```ts
   * stream.success({data: "Hello World!"});
   * ```
   * @docs
   */
  success({ status = 200, headers = {}, data, from_file, compress = false } = {}) {
    if (debug.on(3))
      debug("Sending [success] response: ", status, " - body: ", data);
    return this.send({ status, headers, data, compress, from_file });
  }
  // Send an error response.
  /**
   * Send an error response
   *
   * @param options The error response options.
   * @param options.message The error message.
   * @param options.type The error type.
   * @param options.invalid_fields The invalid fields when validation fails.
   * @param options.status The response status.
   * @param options.headers The response headers.
   * @param options.compress Whether the response should be gzip-compressed.
   * @param options.data Optional data to include in the error response, nested in the JSON response under field `data`.
   * @example
   * ```ts
   * stream.error({ message: "Some error occurred", status: 400 });
   * ```
   * @docs
   */
  error({ message, type = "APIError", invalid_fields = {}, status = 500, headers = {}, compress = false, data }) {
    if (debug.on(3))
      debug("Sending [error] response: ", status, " - message: ", message);
    const api_error = {
      error: {
        type,
        message,
        status,
        invalid_fields
      },
      data
    };
    return this.send({ status, headers, compress, data: api_error });
  }
  /**
   * Stream a response through a transform pipeline with an optional gzip step and a hard byte limit.
   *
   * @param options Pipeline options.
   * @param options.status The HTTP status code to send.
   * @param options.headers The response headers to send.
   * @param options.body The readable stream to pipe into the response.
   * @param options.transforms Optional transform streams applied in order.
   * @param options.compress When true, gzip-compresses the streamed response if the client supports it.
   * @param options.max_bytes The maximum number of bytes allowed to be written to the client.
   *                          Set to `-1` for unlimited (use with caution).
   */
  pipeline({ status = 200, headers = {}, body, transforms = [], compress = false, max_bytes = 10 * 1024 * 1024 }) {
    if (this.finished) {
      throw new Error("Cannot pipeline a response that has already been finished.");
    }
    if (!Number.isInteger(status) || status < 100 || status > 599) {
      throw new Error("Invalid status code.");
    }
    if (!Number.isFinite(max_bytes)) {
      throw new Error("Invalid max_bytes value.");
    }
    if (!Array.isArray(transforms) || transforms.length > 32) {
      throw new Error("Invalid transforms configuration.");
    }
    this.status_code = status;
    this.finished = true;
    const all_streams = [body, ...transforms];
    const accept_encoding_header = this.headers?.["accept-encoding"];
    const accept_encoding = typeof accept_encoding_header === "string" ? accept_encoding_header : Array.isArray(accept_encoding_header) ? accept_encoding_header.join(", ") : "";
    const has_content_encoding = (() => {
      for (const k of Object.keys(headers ?? {})) {
        if (k.toLowerCase() === "content-encoding")
          return true;
      }
      const existing = this.get_header("content-encoding");
      return existing != null;
    })();
    const should_gzip = compress === true && accept_encoding.includes("gzip") && !has_content_encoding;
    if (should_gzip) {
      all_streams.push(zlib.createGzip({ level: zlib.constants.Z_BEST_COMPRESSION }));
    }
    if (max_bytes >= 0) {
      let written = 0;
      const limiter = new import_node_stream.Transform({
        transform(chunk, _enc, cb) {
          written += chunk.length;
          if (written > max_bytes) {
            cb(new Error("Response exceeded max_bytes."));
            return;
          }
          cb(null, chunk);
        }
      });
      all_streams.push(limiter);
    }
    const cleanup = (err) => {
      for (const s of all_streams) {
        if ("destroy" in s && typeof s.destroy === "function") {
          s.destroy(err);
        }
      }
    };
    if (this.http2) {
      const h2 = this.s;
      if (!h2) {
        throw new Error("HTTP/2 stream is missing.");
      }
      const out_headers = this.create_http2_headers(status, headers);
      if (should_gzip) {
        out_headers["content-encoding"] = "gzip";
        out_headers["vary"] = "Accept-Encoding";
      }
      delete out_headers["content-length"];
      h2.respond(out_headers);
      h2.once("close", () => {
        cleanup(new Error("Client disconnected."));
      });
      (0, import_node_stream2.pipeline)(...all_streams, h2, (err) => {
        if (err) {
          cleanup(err instanceof Error ? err : new Error("Pipeline failed."));
          try {
            h2.close();
          } catch {
          }
        }
      });
      return this;
    } else {
      const res = this.res;
      if (!res) {
        throw new Error("HTTP/1.1 response is missing.");
      }
      this.set_http1_headers(status, headers);
      if (should_gzip) {
        res.setHeader("Content-Encoding", "gzip");
        res.setHeader("Vary", "Accept-Encoding");
      }
      res.removeHeader("Content-Length");
      res.once("close", () => {
        cleanup(new Error("Client disconnected."));
      });
      (0, import_node_stream2.pipeline)(...all_streams, res, (err) => {
        if (err) {
          cleanup(err instanceof Error ? err : new Error("Pipeline failed."));
          try {
            res.destroy();
          } catch {
          }
        }
      });
    }
    return this;
  }
  // Set headers.
  /**
   * Add a new header to the response data.
   *
   * @param name The header name.
   * @param value The header value.
   * @example
   * ```ts
   * stream.set_header("Connection", "close");
   * ```
   * @docs
   */
  set_header(name, value) {
    name = name.toLowerCase();
    if (this.http2) {
      this.res_headers[name] = value;
    } else {
      this.res_headers.append([name, value]);
    }
    return this;
  }
  // Set headers.
  /**
   * Add new headers to the response data.
   *
   * @param headers The new response headers.
   * @example
   * ```ts
   * stream.set_headers({"Connection": "close"});
   * ```
   * @docs
   */
  set_headers(headers = {}) {
    if (headers == null) {
      return this;
    }
    if (this.http2) {
      Object.keys(headers).forEach((key) => {
        this.res_headers[key.toLowerCase()] = headers[key];
      });
    } else {
      Object.keys(headers).forEach((key) => {
        this.res_headers.append([key.toLowerCase(), headers[key]]);
      });
    }
    return this;
  }
  /**
   * Get an added response header.
   *
   * @param name The header name.
   * @example
   * ```ts
   * stream.get_header("Connection");
   * ```
   * @docs
   */
  get_header(name) {
    name = name.toLowerCase();
    if (this.http2) {
      return this.res_headers[name];
    } else {
      return this.res_headers.find((h) => h[0] === name)?.[1];
    }
  }
  /**
   * Remove header names from the response data.
   *
   * @param names The header names to remove.
   * @example
   * ```ts
   * stream.remove_header("Connection", "User-Agent");
   * ```
   * @docs
   */
  remove_header(...names) {
    names = names.map((n) => n.toLowerCase());
    if (this.http1) {
      const headers = [];
      for (let i = 0; i < this.res_headers.length; i++) {
        if (!names.includes(this.res_headers[i][0])) {
          headers.push(this.res_headers[i]);
        }
      }
      this.res_headers = headers;
    } else {
      for (let i = 0; i < names.length; i++) {
        delete this.res_headers[names[i]];
      }
    }
    return this;
  }
  /**
   * Alias of {@link remove_header}.
   *
   * @param names The header names to remove.
   */
  remove_headers(...names) {
    return this.remove_header(...names);
  }
  // Set a cookie.
  /**
   * Set a cookie that will be sent with the response.
   *
   * @warning Will only be added to the response when the user uses `send()`, `success()` or `error()`.
   * @param cookie The cookie string.
   * @example
   * ```ts
   * stream.set_cookie("MyCookie=Hello World;");
   * ```
   * @docs
   */
  set_cookie(cookie) {
    cookie = cookie.trim();
    const name_end = cookie.indexOf("=");
    if (name_end !== -1) {
      const name = cookie.substr(0, name_end);
      for (let i = 0; i < this.res_cookies.length; i++) {
        if (this.res_cookies[i].startsWith(name)) {
          this.res_cookies[i] = cookie;
          return this;
        }
      }
    }
    this.res_cookies.push(cookie);
    return this;
  }
  // Set cookies.
  /**
   * Set cookies that will be sent with the response.
   *
   * @warning Will only be added to the response when the user uses `send()`, `success()` or `error()`.
   * @param cookies The cookie strings.
   * @example
   * ```ts
   * stream.set_cookies("MyCookie1=Hello World;", "MyCookie2=Hello Universe;");
   * ```
   * @docs
   */
  set_cookies(...cookies) {
    for (let i = 0; i < cookies.length; i++) {
      this.set_cookie(cookies[i]);
    }
    return this;
  }
}
;
;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Stream
});
