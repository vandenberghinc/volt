var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  Route: () => Route
});
module.exports = __toCommonJS(stdin_exports);
class Route {
  method;
  endpoint;
  endpoint_str;
  id;
  is_regex;
  params = [];
  // path param names.
  matcher;
  // Inserted only when passed as arg into `match()`.
  matched_params = {};
  /**
   *
   * @param method   HTTP method (e.g. "GET", "post", etc.)
   * @param endpoint  The endpoint parameter supports the following input type.
   *                  - A regex to match against the request URL, or a string with colon-style path parameters.
   *                  - A string supporting colon-style path parameters (e.g. "/user/:id"), and simple `*` and `**` wildcards.
   *                    Ensure the wildcards are encapsulated by / or at the start of end of the string.
   */
  constructor(method, endpoint) {
    this.method = method.trim().toUpperCase();
    this.endpoint = endpoint;
    this.is_regex = endpoint instanceof RegExp;
    if (typeof this.endpoint === "string") {
      this.endpoint = Route.clean_endpoint(this.endpoint).replace(/\/+$/, "") || "/";
    }
    if (typeof endpoint === "string" && (endpoint.includes(":") || endpoint.includes("*"))) {
      this._create_route_matcher(endpoint);
      this.endpoint_str = endpoint.replace(/\/+$/, "") || "/";
      this.is_regex = true;
    } else if (endpoint instanceof RegExp) {
      this.matcher = void 0;
      this.endpoint_str = Route._stringify_endpoint_regex(endpoint);
    } else {
      this.matcher = void 0;
      this.endpoint_str = endpoint.replace(/\/+$/, "") || "/";
    }
    this.id = `${this.method}:${this.endpoint_str}`;
  }
  /** Create match args
    * @warning this is required for the `match()` method
    */
  static create_match_args(method, endpoint) {
    return {
      method: method.trim().toUpperCase(),
      endpoint: endpoint.replace(/\/+$/, "") || "/"
    };
  }
  /**
   * Tests this route against another Route (e.g. a “request” Route).
   * Returns true/false and on true populates other.params.
   */
  match(other) {
    if (this.endpoint instanceof RegExp && other.endpoint instanceof RegExp) {
      return false;
    }
    if (other.method !== this.method) {
      other.matched_params = {};
      return false;
    }
    if (this.endpoint instanceof RegExp) {
      const m = this.endpoint.exec(other.endpoint_str);
      if (!m) {
        other.matched_params = {};
        return false;
      }
      other.matched_params = m.groups ? { ...m.groups } : {};
      return true;
    }
    if (this.matcher) {
      const result = this.matcher.match(other.endpoint_str);
      if (!result) {
        other.matched_params = {};
        return false;
      }
      other.matched_params = result;
      return true;
    }
    other.matched_params = {};
    return this.endpoint_str === other.endpoint_str;
  }
  // ─── Helper: compile colon-style patterns ───
  _create_route_matcher(pattern) {
    const normalized = pattern.replace(/\/+$/, "") || "/";
    this.params.length = 0;
    const source = normalized.split(/(\/:[A-Za-z_$][A-Za-z0-9_$]*\??|\*\*|\*)/).map((seg) => {
      if (seg.startsWith("/:")) {
        const optional = seg.endsWith("?");
        const name = optional ? seg.slice(2, -1) : seg.slice(2);
        this.params.push({ name, required: !optional });
        return optional ? "(?:/([^/]+))?" : "/([^/]+)";
      }
      if (seg === "*") {
        return "(?:[^/]+)";
      }
      if (seg === "**") {
        return "(?:.*)";
      }
      return seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }).join("");
    const regex = normalized === "/" ? /^\/$/ : new RegExp(`^${source}/?$`);
    this.matcher = {
      regex,
      match: (path) => {
        const m = regex.exec(path);
        if (!m)
          return;
        const out = {};
        this.params.forEach((k, i) => {
          out[k.name] = m[i + 1];
        });
        return out;
      }
    };
  }
  // Helper: stringify a RegExp into colon-style │:param placeholders.
  static _stringify_endpoint_regex(re) {
    let src = re.source;
    src = src.replace(/^\^/, "").replace(/\$$/, "");
    src = src.replace(/\\\//g, "/");
    src = src.replace(/\(\?<([^>]+)>[^)]+\)/g, (_m, name) => `:${name}`);
    let idx = 1;
    src = src.replace(/\((?!\?)[^)]+\)/g, () => `:param${idx++}`);
    return src;
  }
  static clean_endpoint(endpoint) {
    if (endpoint == null || endpoint instanceof RegExp) {
      return endpoint;
    }
    if (endpoint.charAt(0) != "/") {
      endpoint = "/" + endpoint;
    }
    endpoint = endpoint.replaceAll("//", "/");
    if (endpoint.length > 1 && endpoint.charAt(endpoint.length - 1) === "/") {
      endpoint = endpoint.substr(0, endpoint.length - 1);
    }
    return endpoint;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Route
});
