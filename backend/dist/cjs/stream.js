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
  Stream: () => Stream,
  default: () => stdin_default
});
module.exports = __toCommonJS(stdin_exports);
var import_zlib = __toESM(require("zlib"));
var vlib = __toESM(require("@vandenberghinc/vlib"));
const { debug } = vlib;
class Stream {
  s;
  headers;
  req;
  res;
  http2;
  http1;
  _ip;
  _port;
  _method;
  _params;
  _is_query_params;
  _endpoint;
  _query_string;
  _cookies;
  _uid;
  status_code;
  finished;
  res_cookies;
  res_headers;
  body;
  promise;
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
    this._uid = null;
    this.status_code = null;
    this.finished = false;
    this.res_cookies = [];
    this.res_headers = this.http1 ? [] : {};
    this.body = "";
    this.promise = void 0;
    this._recv_body();
  }
  // Receve the body.
  _recv_body() {
    this.promise = new Promise((resolve, reject) => {
      const buffs = [];
      let decompress_stream;
      const content_encoding = this.headers["content-encoding"];
      if (content_encoding === "gzip") {
        decompress_stream = import_zlib.default.createGunzip();
      } else if (content_encoding === "deflate") {
        decompress_stream = import_zlib.default.createInflate();
      }
      const cleanup = () => {
        if (decompress_stream) {
          decompress_stream.close();
        }
      };
      if (this.http2) {
        let stream = this.s;
        if (decompress_stream) {
          stream = this.s.pipe(decompress_stream);
        }
        stream.on("error", (e) => {
          cleanup();
          reject(e);
        });
        stream.on("data", (chunk) => {
          buffs.push(chunk);
        });
        stream.on("end", () => {
          this.body = Buffer.concat(buffs).toString();
          cleanup();
          resolve();
        });
      } else {
        let stream = this.req;
        if (decompress_stream) {
          this.req.pipe(decompress_stream);
          stream = decompress_stream;
        }
        stream.on("error", (e) => {
          cleanup();
          reject(e);
        });
        stream.on("data", (data) => {
          buffs.push(data);
        });
        stream.on("end", () => {
          this.body = Buffer.concat(buffs).toString();
          cleanup();
          resolve();
        });
      }
    });
  }
  // Parse endpoint.
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
  // Parse the parameters.
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
  // Parse cookies.
  _parse_cookies() {
    this._cookies = {};
    const cookie_str = this.http2 ? this.headers["cookie"] : this.req.headers.cookie;
    if (cookie_str === void 0) {
      return null;
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
  }
  // ---------------------------------------------------------
  // Functions.
  // Wait till the request body is fully received.
  async join() {
    await this.promise;
  }
  // Get the requests ip.
  /*  @docs:
   *  @title: IP
   *  @description: Get the request's ip.
   *  @property: true
   *  @usage:
   *      ...
   *      const ip = stream.ip;
   */
  get ip() {
    return this._ip;
  }
  // Get the requests port.
  /*  @docs:
   *  @title: Port
   *  @description: Get the request's port.
   *  @property: true
   *  @usage:
   *      ...
   *      const port = stream.port;
   */
  get port() {
    return this._port;
  }
  // Get the method.
  /*  @docs:
   *  @title: Method
   *  @description: Get the request method.
   *  @property: true
   *  @usage:
   *      ...
   *      const method = stream.method;
   */
  get method() {
    return this._method;
  }
  // Get the endpoint.
  /*  @docs:
   *  @title: Endpoint
   *  @description: Get the request's endpoint. This will not include the query string.
   *  @property: true
   *  @type: string
   *  @usage:
   *      ...
   *      const endpoint = stream.endpoint;
   */
  get endpoint() {
    if (this._endpoint !== void 0) {
      return this._endpoint;
    }
    this._parse_endoint();
    return this._endpoint;
  }
  // Get the params.
  /*  @docs:
   *  @title: Parameters
   *  @description: Get the request's query or body params.
   *  property: true
   *  @type: object
   *  @usage:
   *      ...
   *      const params = stream.params;
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
  /*  @docs:
   *  @title: Parameter
   *  @description: Get a single query or body parameter with an optional type cast.
   *  @warning: Throws an error when the parameter does not exist or when the type is different from the specified type(s), unless parameter `def` is defined.
   *  @param:
   *      @name: name
   *      @desc: The name of the parameter.
   *      @type: string
   *  @param:
   *      @name: type
   *      @desc: The type cast of the parameters, valid types are `[null, "boolean", "number", "string", "array", "object"]`.
   *      @type: string
   *  @param:
   *      @name: def
   *      @desc:
   *          The default value to return when the parameter does not exist.
   *
   *          If the parameter is not defined and `def` is `undefined` then this function will throw an error.
   *          When `def` is `undefined` errors will be thrown, when `def` is `null` and the parameter is undefined then `null` will be returned as the default value.
   *
   *          Errors will always be thrown when the incorrect type has been sent by the user.
   *      @type: any
   *  @usage:
   *      ...
   *      const param = stream.param("myparameter", "number", 10);
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
  /*  @docs:
   *  @title: Cookies
   *  @description: Get the request's cookies
   *  property: true
   *  @type: object
   *  @usage:
   *      ...
   *      const cookies = stream.cookies;
   */
  get cookies() {
    if (this._cookies !== void 0) {
      return this._cookies;
    }
    this._parse_cookies();
    return this._cookies;
  }
  // Check if the stream is closed
  /*  @docs:
   *  @title: Closed
   *  @description: Check if the stream is closed.
   *  @property: true
   *  @usage:
   *      ...
   *      const ip = stream.closed;
   */
  get closed() {
    if (!this.http2) {
      throw new Error("This function is only supported for http2 streams.");
    }
    return this.s.closed;
  }
  // Check if the stream is destroyed
  /*  @docs:
   *  @title: Destroyed
   *  @description: Check if the stream is destroyed.
   *  @property: true
   *  @usage:
   *      ...
   *      const ip = stream.destroyed;
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
  /*  @docs:
   *  @title: UID
   *  @description: Get the authenticated uid, is `null` when the request was not authenticated.
   *  @property: true
   *  @type: string
   *  @usage:
   *      ...
   *      const uid = stream.uid;
   */
  get uid() {
    return this._uid;
  }
  set uid(value) {
    this._uid = value;
  }
  // Send a response.
  /*  @docs:
   *  @title: Send
   *  @description: Send a response
   *  @parameter:
   *      @name: status
   *      @description: The response status.
   *      @type: number
   *  @parameter:
   *      @name: headers
   *      @description: The response headers.
   *      @type: object
   *  @parameter:
   *      @name: body
   *      @description: The response body.
   *      @type: any
   *  @parameter:
   *      @name: data
   *      @description: The response data.
   *      @type: undefined, string
   *      @deprecated: true
   *  @parameter:
   *      @name: compress
   *      @description: A boolean indicating if the response data should be compressed.
   *      @type: boolean
   *  @usage:
   *      ...
   *      stream.send({status: 200, data: "Hello World!"});
   */
  send({
    status = 200,
    headers = {},
    // data,
    // body = data,    // zero-copy pull in data
    body,
    data,
    compress = false
  } = {}) {
    if (data) {
      body = data;
    }
    this.status_code = status;
    const has_body = body != null && body !== "";
    if (this.http2) {
      const stream = this.s;
      this.res_headers[":status"] = status;
      this.set_headers(headers);
      if (this.res_cookies.length > 0) {
        this.res_headers["set-cookie"] = this.res_cookies;
      }
      if (compress && has_body) {
        this.res_headers["Content-Encoding"] = "gzip";
        this.res_headers["Vary"] = "Accept-Encoding";
      }
      if (has_body && typeof body === "object" && Buffer.isBuffer(body) === false && body instanceof Uint8Array === false) {
        this.res_headers["Content-Type"] = "application/json";
        body = JSON.stringify(body);
      }
      if (compress && has_body) {
        body = import_zlib.default.gzipSync(body, { level: import_zlib.default.constants.Z_BEST_COMPRESSION });
      }
      stream.respond(this.res_headers);
      debug(3, "Sending response: ", status, " - has body: ", has_body);
      if (has_body) {
        stream.end(Buffer.from(body));
      } else {
        stream.end();
      }
    } else {
      const req = this.req;
      const res = this.res;
      res.statusCode = status;
      for (let i = 0; i < this.res_headers.length; i++) {
        res.setHeader(this.res_headers[i][0], this.res_headers[i][1]);
      }
      Object.keys(headers).forEach((key) => {
        res.setHeader(key, headers[key]);
      });
      if (this.cookies.length > 0) {
        res.setHeader("Set-Cookie", this.res_cookies);
      }
      if (has_body && typeof body === "object" && Buffer.isBuffer(body) === false && body instanceof Uint8Array === false) {
        res.setHeader("Content-Type", "application/json");
        body = JSON.stringify(body);
      }
      if (compress && has_body) {
        res.setHeader("Content-Encoding", "gzip");
        res.setHeader("Vary", "Accept-Encoding");
        body = import_zlib.default.gzipSync(body, { level: import_zlib.default.constants.Z_BEST_COMPRESSION });
      }
      if (has_body) {
        res.end(body);
      } else {
        res.end();
      }
    }
    this.finished = true;
    return this;
  }
  // Send a successs response.
  /*  @docs:
   *  @title: Send Successs
   *  @description: Send a response
   *  @parameter:
   *      @name: status
   *      @description: The response status.
   *      @type: number
   *  @parameter:
   *      @name: headers
   *      @description: The response headers.
   *      @type: object
   *  @parameter:
   *      @name: body
   *      @description: The response data.
   *      @type: any
   *  @parameter:
   *      @name: data
   *      @description: The response data.
   *      @type: undefined, string
   *      @deprecated: true
   *  @parameter:
   *      @name: compress
   *      @description: A boolean indicating if the response data should be compressed.
   *      @type: boolean
   *  @usage:
   *      ...
   *      stream.success({data: "Hello World!"});
   */
  success({ status = 200, headers = {}, body = void 0, data = void 0, compress = false } = {}) {
    debug(3, "Sending [success] response: ", status, " - body: ", body ?? data);
    return this.send({ status, headers, body: body ?? data, compress });
  }
  // Send an error response.
  /*  @docs:
   *  @title: Send Error
   *  @description: Send an error response
   *  @parameter:
   *      @name: status
   *      @description: The response status.
   *      @type: number
   *  @parameter:
   *      @name: headers
   *      @description: The response headers.
   *      @type: object
   *  @parameter:
   *      @name: body
   *      @description: The response data.
   *      @type: any
   *  @parameter:
   *      @name: data
   *      @description: The response data.
   *      @type: undefined, string
   *      @deprecated: true
   *  @parameter:
   *      @name: compress
   *      @description: A boolean indicating if the response data should be compressed.
   *      @type: boolean
   *  @usage:
   *      ...
   *      stream.error({data: "Some error occured"});
   */
  error({ message, type = "APIError", invalid_fields = {}, status = 500, headers = {}, compress = false, data = void 0 }) {
    debug(3, "Sending [error] response: ", status, " - message: ", message);
    return this.send({ status, headers, compress, body: {
      error: {
        type,
        message,
        status,
        invalid_fields
      },
      data
    } });
  }
  // Set headers.
  /*  @docs:
   *  @title: Set header
   *  @description: Add a new header to the response data.
   *  @parameter:
   *      @name: name
   *      @description: The header name.
   *      @type: string
   *  @parameter:
   *      @name: value
   *      @description: The header value.
   *      @type: string
   *  @usage:
   *      ...
   *      stream.set_header("Connection", "close");
   */
  set_header(name, value) {
    if (this.http2) {
      this.res_headers[name] = value;
    } else {
      this.res_headers.append([name, value]);
    }
    return this;
  }
  // Set headers.
  /*  @docs:
   *  @title: Set headers
   *  @description: Add new headers to the response data.
   *  @parameter:
   *      @name: headers
   *      @description: The new response headers.
   *      @type: object
   *  @usage:
   *      ...
   *      stream.set_headers({"Connection": "close"});
   */
  set_headers(headers = {}) {
    if (headers == null) {
      return this;
    }
    if (this.http2) {
      Object.keys(headers).forEach((key) => {
        this.res_headers[key] = headers[key];
      });
    } else {
      Object.keys(headers).forEach((key) => {
        this.res_headers.append([key, headers[key]]);
      });
    }
    return this;
  }
  // Remove header.
  /*  @docs:
   *  @title: Remove headers
   *  @description: Remove header names from the response data.
   *  @parameter:
   *      @name: ...names
   *      @description: The header names to remove.
   *      @type: ...string
   *  @usage:
   *      ...
   *      stream.remove_header("Connection", "User-Agent");
   *  @funcs: 2
   */
  remove_header(...names) {
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
  remove_headers(...names) {
    return this.remove_header(...names);
  }
  // Set a cookie.
  /*  @docs:
   *  @title: Set cookie.
   *  @description: Set a cookie that will be sent with the response.
   *  @warning: Will only be added to the response when the user uses `send()`, `success()` or `error()`.
   *  @parameter:
   *      @name: cookie
   *      @description: The cookie string.
   *      @type: string
   *  @usage:
   *      ...
   *      stream.set_cookie("MyCookie=Hello World;");
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
  /*  @docs:
   *  @title: Set Cookies
   *  @description: Set a cookie that will be sent with the response.
   *  @warning: Will only be added to the response when the user uses `send()`, `success()` or `error()`.
   *  @parameter:
   *      @name: cookies
   *      @description: The cookie strings.
   *      @type: ...string
   *  @usage:
   *      ...
   *      stream.set_cookies("MyCookie1=Hello World;", "MyCookie2=Hello Universe;");
   */
  set_cookies(...cookies) {
    for (let i = 0; i < cookies.length; i++) {
      this.set_cookie(cookies[i]);
    }
    return this;
  }
}
var stdin_default = Stream;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Stream
});
