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
  Server: () => Server
});
module.exports = __toCommonJS(stdin_exports);
var import_url = require("url");
var path = __toESM(require("path"));
var http = __toESM(require("http"));
var http2 = __toESM(require("http2"));
var crypto = __toESM(require("crypto"));
var import_cluster = __toESM(require("cluster"));
var os = __toESM(require("os"));
var vlib = __toESM(require("@vandenberghinc/vlib"));
var import_utils = require("./utils.js");
var import_meta2 = require("./meta.js");
var import_mail = require("./plugins/mail/mail.js");
var import_status = require("./status.js");
var import_endpoint = require("./endpoint.js");
var import_image_endpoint = require("./image_endpoint.js");
var import_stream = require("./stream.js");
var import_database = require("./database/database.js");
var import_users = require("./users.js");
var import_rate_limit = require("./rate_limit.js");
var import_route = require("./route.js");
var import_internal_external = require("./errors/internal_external.js");
var import_stripe = require("./payments/stripe/stripe.js");
const import_meta = {};
const __filename = (0, import_url.fileURLToPath)(import_meta.url);
const __dirname = path.dirname(__filename);
const { debug } = vlib;
class Server {
  // ---------------------------------------------------------
  // Static attributes.
  // ---------------------------------------------------------
  /**
   * A temporary directory which holds the cached endpoint data.
   * For instance if we bundle JS then we save it to file and serve it from the file,
   * similar for transformed image endpoints.
   *
   * Note that upon each server start, we should clear this cache and remove all files inside this dir.
   */
  endpoint_cache_dir;
  // ---------------------------------------------------------
  // Attributes.
  // ---------------------------------------------------------
  /** The binded ip address. */
  ip;
  /** The binded http port. */
  port;
  /** The binded https port. */
  https_port;
  /** The raw domain. */
  domain;
  /** The full domain name with http/https depending if tls is enabled. */
  full_domain;
  /** The persistent storage source directory. */
  source;
  /** Is the primary thread. */
  is_primary;
  /** Is in production mode. */
  production;
  /** The company information. */
  company;
  /** The default meta information. */
  meta;
  /** Is running in offline mode. */
  offline;
  /** The database instance. */
  db;
  /** The rate limit instance. */
  rate_limit;
  /** The added endpoints. */
  endpoints = /* @__PURE__ */ new Map();
  /** The added error endpoints. */
  err_endpoints = /* @__PURE__ */ new Map();
  /** A record of keys used for hashing. */
  keys = {};
  /** Alias for the `Status` module. */
  status;
  /** Alias for the `RateLimits` module. */
  rate_limits;
  /** The file logger. */
  log;
  /** The users instance. */
  users;
  /** The payments instance. */
  payments;
  /** Daemon instance to manage a live daemon. */
  daemon;
  /** The mail instance. */
  mail;
  // Public for internal use:
  csp;
  statics_aspect_ratios;
  google_tag;
  rate_limit_api_key;
  performance;
  https_enabled;
  /** The events map @internal */
  events = new vlib.Events({
    single_events: ["2fa_mail"]
  });
  // Private.
  favicon;
  statics;
  _user_keys_opts;
  additional_sitemap_endpoints;
  tls;
  default_headers;
  http;
  https;
  threading;
  // Private ollections.
  _keys_db;
  _sys_keys_db;
  _website_status_db;
  /**
   * Construct a new server instance.
   * @docs
   */
  constructor({
    ip = "127.0.0.1",
    port,
    // leave undefined for blank detection.
    domain,
    is_primary = true,
    source,
    database,
    statics = [],
    favicon,
    company,
    meta = new import_meta2.Meta(),
    tls,
    mail,
    rate_limit = {
      server: {
        ip: void 0,
        port: import_rate_limit.RateLimitServer.default_port,
        https: void 0
      },
      client: {
        ip: void 0,
        port: import_rate_limit.RateLimitServer.default_port,
        url: void 0
      }
    },
    keys = [],
    payments,
    default_headers,
    google_tag = void 0,
    users,
    production = false,
    threading = {
      enabled: false,
      threads: void 0
    },
    offline = false,
    additional_sitemap_endpoints = [],
    log_level = 0,
    daemon = false
    // admin = {
    //     password: null,
    //     ips: [],
    // },
    // ts = {
    //     compiler_opts: {},
    //     output: undefined,
    // },
    // browser_preview = undefined,
  }) {
    if (production || port == null) {
      this.port = 80;
      this.https_port = 443;
    } else {
      this.port = port;
      this.https_port = port + 1;
    }
    this.ip = ip ?? "127.0.0.1";
    this.is_primary = is_primary && import_cluster.default.isPrimary;
    this.source = new vlib.Path(source);
    this.favicon = favicon;
    this.google_tag = google_tag;
    this.production = production;
    this.company = company;
    this.offline = offline;
    this._user_keys_opts = keys;
    this.additional_sitemap_endpoints = additional_sitemap_endpoints;
    this.tls = tls;
    this.https_enabled = tls != null;
    if (typeof threading === "boolean") {
      this.threading = {
        enabled: threading,
        threads: os.cpus().length
      };
    } else {
      this.threading = {
        enabled: threading.enabled ?? true,
        threads: threading.threads ?? os.cpus().length
      };
    }
    this.status = import_status.Status;
    this.rate_limits = import_rate_limit.RateLimits;
    this.performance = new vlib.Performance("Server performance");
    const log_source = this.source.join("logs");
    if (!log_source.exists()) {
      log_source.mkdir_sync({ recursive: true });
    }
    this.log = new vlib.logging.FileLogger({
      level: log_level,
      log_path: log_source.join("logs").str(),
      error_path: log_source.join("errors").str()
    });
    if (!this.source.exists()) {
      throw Error(`Source directory "${this.source.str()}" does not exist.`);
    }
    this.source = this.source.abs();
    this.domain = domain.replace("https://", "").replace("http://", "");
    while (this.domain.length > 0 && this.domain.charAt(this.domain.length - 1) === "/") {
      this.domain = this.domain.substr(0, this.domain.length - 1);
    }
    this.full_domain = `http${this.tls ? "s" : ""}://${this.domain}`;
    while (this.full_domain.endsWith("/")) {
      this.full_domain = this.full_domain.slice(0, -1);
    }
    this.endpoint_cache_dir = new vlib.Path("/tmp/volt_server_endpoint_cache/" + this.hash(this.domain));
    this.statics = statics;
    this.statics_aspect_ratios = /* @__PURE__ */ new Map();
    const volt_assets_path = new vlib.Path(`${__dirname}/../../../../../frontend/src/assets/`);
    if (!volt_assets_path.exists()) {
      this.log.warning(`${vlib.Color.yellow_bold("Warning")}: Could not find volt assets directory at "${volt_assets_path.abs().str()}". Please create a GitHub issue to report this.`);
    }
    this.statics.push({
      path: volt_assets_path.str(),
      endpoint: "/volt/assets"
    });
    if (!(meta instanceof import_meta2.Meta)) {
      meta = new import_meta2.Meta(meta);
    }
    if (favicon != null && meta.favicon == null) {
      meta.favicon = this.full_domain + "/favicon.ico";
    }
    if (favicon != null && meta.image == null) {
      meta.image = this.full_domain + "/favicon.ico";
    } else if (meta.image != null && !meta.image.startsWith("http")) {
      meta.image = this.full_domain + meta.image;
    }
    this.meta = meta;
    const base_default_headers = {
      // Cache correctness for CORS/preflight:
      "Vary": "Origin, Access-Control-Request-Method, Access-Control-Request-Headers",
      // Safer default than same-origin, still keeps useful referrers:
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      // Let browsers read our rate-limit hint:
      "Access-Control-Expose-Headers": "X-RateLimit-Reset",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      // Helpful isolation defaults (safe for most apps):
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Resource-Policy": "same-site",
      // If you need SharedArrayBuffer, add COEP below (can break some embeds):
      // "Cross-Origin-Embedder-Policy": "require-corp",
      "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
      // Lock down powerful APIs by default.
      // If you need one on a third-party origin, add it beside (self).
      "Permissions-Policy": "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), usb=(), hid=(), serial=(), xr-spatial-tracking=(), display-capture=(), screen-wake-lock=(), sync-xhr=(), publickey-credentials-get=(self), encrypted-media=(self), autoplay=(self 'https://www.youtube-nocookie.com') fullscreen=(self 'https://www.youtube-nocookie.com'), browsing-topics=()"
      // Do NOT set Allow-Origin / Credentials statically; set them per-request below.
      // "X-XSS-Protection": "1; mode=block", // deprecated
    };
    const default_csp = {
      "default-src": "'self'",
      "base-uri": "'none'",
      "object-src": "'none'",
      "form-action": "'self'",
      "frame-ancestors": "'none'",
      // Keep GA images; drop explicit http:// to avoid mixed content.
      "img-src": "'self' data: blob: https://*.google-analytics.com",
      "script-src": "'self' https://ajax.googleapis.com https://www.googletagmanager.com https://*.google-analytics.com",
      // Needed for GA/GTAG beacons/fetch:
      "connect-src": "'self' https://*.google-analytics.com",
      "style-src": "'self'",
      "font-src": "'self' data:",
      // Auto-upgrade stray http URLs where possible:
      "upgrade-insecure-requests": ""
    };
    if (default_headers == null) {
      this.csp = default_csp;
      this.default_headers = { ...base_default_headers };
    } else {
      if (default_headers["Content-Security-Policy"] != null && typeof default_headers["Content-Security-Policy"] !== "object") {
        throw Error(`The Content-Security-Policy of the default headers must be an object with values for each csp key, e.g. "{'script-src': '...'}".`);
      }
      this.csp = default_headers["Content-Security-Policy"] != null ? default_headers["Content-Security-Policy"] : default_csp;
      Object.keys(base_default_headers).forEach((key) => {
        if (default_headers[key] === void 0) {
          default_headers[key] = base_default_headers[key];
        }
      });
      this.default_headers = default_headers;
    }
    if (!this.tls) {
      delete this.default_headers["Strict-Transport-Security"];
    }
    if (payments) {
      if (payments.type === "stripe") {
        this.payments = new import_stripe.Stripe(this, payments);
      } else {
        throw Error(`Invalid payment processor type "${payments.type}", valid types are ["paddle"].`);
      }
    }
    if (daemon !== false) {
      const log_source2 = this.source.join("daemon");
      if (!log_source2.exists()) {
        log_source2.mkdir_sync({ recursive: true });
      }
      this.daemon = new vlib.Daemon({
        name: this.domain.replaceAll(".", ""),
        logs: daemon.logs || log_source2.join("logs").str(),
        errors: daemon.errors || log_source2.join("errors").str(),
        ...daemon
        // user: (daemon as Record<string, any>).user || os.userInfo().username,
        // group: (daemon as Record<string, any>).group || null,
        // command: "volt --service --start",
        // cwd: this.source.str(),
        // args: (daemon as Record<string, any>).args || [],
        // env: (daemon as Record<string, any>).env || {},
        // description: (daemon as Record<string, any>).description || `Service daemon for website ${this.domain}.`,
        // auto_restart: true,
      });
    }
    if (typeof database === "string") {
      this.db = new import_database.Database({ uri: database, _server: this });
    } else {
      this.db = new import_database.Database({ ...database, _server: this });
    }
    this._keys_db = this.db.collection({
      name: "Volt.Keys",
      indexes: ["id"]
    });
    this._sys_keys_db = this.db.collection({
      name: "Volt.SystemKeys",
      indexes: ["id"]
    });
    this._website_status_db = this.db.collection({
      name: "Volt.WebsiteStatus",
      indexes: ["id"]
    });
    this.users = new import_users.Users({
      support_recipient: mail?.smtp.sender,
      // ensure we assign the support recipient, so we dont need to define `this.mail` beforehand.
      ...users,
      // override support recipient if provided,
      _server: this
    });
    if (mail) {
      this.mail = new import_mail.Mail(mail);
    }
    if (rate_limit) {
      if (this.is_primary) {
        this.rate_limit = new import_rate_limit.RateLimitServer({ ...rate_limit.server ?? {}, _server: this });
      } else {
        if (rate_limit.server?.https) {
          rate_limit.client.https = true;
        }
        this.rate_limit = new import_rate_limit.RateLimitClient({ ...rate_limit.client ?? {}, _server: this });
      }
    }
  }
  // ---------------------------------------------------------
  // Utils.
  /** Get a content type (MIME) from a file extension. */
  /**
   * Get a content type (MIME) from a file extension. The file extension should include the leading dot, e.g. ".html".
   * @docs
   */
  get_content_type(extension) {
    return import_utils.Utils.mime_type(extension) ?? "application/octet-stream";
  }
  /**
   * Set the logging verbosity level.
   * @docs
   */
  set_log_level(level) {
    this.log.level.set(level);
  }
  // ---------------------------------------------------------
  // Crypto (private).
  /**
   * Generate a cryptographically secure random key as a hex string.
   * @docs
   */
  generate_crypto_key(length = 32) {
    return crypto.randomBytes(length).toString("hex");
  }
  /**
   * Create an HMAC hash using the provided key and data.
   * @docs
   */
  hmac(key, data, algo = "sha256") {
    const hmac = crypto.createHmac(algo, key);
    hmac.update(data);
    return hmac.digest("hex");
  }
  // /** Create an HMAC hash using the server's master hash key. */
  // hmac_with_master(data: string): string {
  //     if (!this._master_hash_key) {
  //         throw new Error("Hash key not initialized");
  //     }
  //     const hmac = crypto.createHmac("sha256", this._master_hash_key);
  //     hmac.update(data);
  //     return hmac.digest("hex");
  // }
  /**
   * Create a hash (no key) of the given data using the specified algorithm.
   * @docs
   */
  hash(data, algo = "sha256") {
    if (typeof data !== "string") {
      data = JSON.stringify(data);
    }
    return crypto.createHash(algo).update(data).digest("hex");
  }
  // ---------------------------------------------------------
  // Headers (private).
  // Initialize the default headers.
  _init_default_headers() {
    let csp = [];
    Object.entries(this.csp).forEach(([key, value]) => {
      csp.push(key);
      if (typeof value === "string" && value.length > 0) {
        csp.push(" ");
        csp.push(value);
      }
      csp.push(";");
    });
    this.default_headers["Content-Security-Policy"] = csp.join("");
  }
  // Add header defaults.
  _set_header_defaults(stream) {
    stream.set_headers(this.default_headers);
    const origin = stream.headers.origin;
    if (origin) {
      const same_http = `http://${this.domain}`;
      const same_https = `https://${this.domain}`;
      if (origin === same_http || origin === same_https) {
        stream.set_header("Access-Control-Allow-Origin", origin);
        stream.set_header("Access-Control-Allow-Credentials", "true");
      } else {
        stream.set_header("Access-Control-Allow-Origin", "*");
      }
      const req_hdrs = stream.headers["access-control-request-headers"];
      if (req_hdrs)
        stream.set_header("Access-Control-Allow-Headers", String(req_hdrs));
      const req_method = stream.headers["access-control-request-method"];
      if (req_method)
        stream.set_header("Access-Control-Allow-Methods", String(req_method));
    }
  }
  // ---------------------------------------------------------
  // Endpoints (private).
  // Create default endpoints.
  _create_default_endpoints() {
    if (this.favicon != null) {
      const favicon = new vlib.Path(this.favicon);
      if (favicon.exists() === false) {
        throw Error(`Specified favicon path "${favicon}" does not exist.`);
      }
      this.endpoint({
        method: "GET",
        endpoint: "/favicon.ico",
        data: favicon.load_sync({ type: "buffer" }),
        content_type: this.get_content_type(favicon.extension()),
        _is_static: true,
        server: this
      });
    }
    const status_dir = this.source.join(".status");
    if (!status_dir.exists()) {
      status_dir.mkdir_sync({ recursive: true });
    }
    const status_key_path = status_dir.join("key");
    let status_key;
    if (!status_key_path.exists()) {
      status_key = this.generate_crypto_key(32);
      status_key_path.save_sync(status_key);
    } else {
      status_key = status_key_path.load_sync();
    }
    this.endpoint({
      method: "GET",
      endpoint: "/.status",
      content_type: "application/json",
      params: {
        key: "string"
      },
      callback: async (stream, params) => {
        if (params.key !== status_key) {
          return stream.send({
            status: 403,
            headers: { "Content-Type": "text/plain" },
            data: "Access Denied"
          });
        }
        const status = {};
        status.ip = this.ip;
        if (this.http) {
          status.http_port = this.port;
        }
        if (this.https) {
          status.https_port = this.https_port;
        }
        const data = await this._website_status_db.load({ id: "status" }, {
          default: {
            id: "status",
            running_since: void 0,
            running_threads: 0,
            total_threads: 0
          }
        });
        Object.assign(status, data);
        return stream.send({
          status: 200,
          headers: { "Content-Type": "application/json" },
          data: status
        });
      }
    });
  }
  // Create the sitemap endpoint.
  async _create_sitemap() {
    this.log(2, "Creating sitemap.");
    let sitemap = "";
    sitemap += '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    for (const endpoint of this.endpoints.values()) {
      if (endpoint.allow_sitemap) {
        if (endpoint.route.is_regex)
          continue;
        const ep = encodeURI(endpoint.route.endpoint_str.startsWith("/") ? endpoint.route.endpoint_str : `/${endpoint.route.endpoint_str}`);
        sitemap += `<url>
   <loc>${this.full_domain}${ep}</loc>
</url>
`;
      }
    }
    this.additional_sitemap_endpoints.forEach((endpoint) => {
      while (endpoint.length > 0 && endpoint.charAt(0) === "/") {
        endpoint = endpoint.substr(1);
      }
      sitemap += `<url>
   <loc>${this.full_domain}/${endpoint}</loc>
</url>
`;
    });
    sitemap += "</urlset>\n";
    this.endpoint({
      method: "GET",
      endpoint: "/sitemap.xml",
      data: sitemap,
      content_type: "application/xml",
      _compress: false
    });
  }
  // Create the robots.txt endpoint.
  async _create_robots_txt() {
    this.log(2, "Creating robots.txt.");
    let robots = "User-agent: *\n";
    let disallowed = 0;
    for (const endpoint of this.endpoints.values()) {
      if (!endpoint.allow_robots) {
        robots += `Disallow: ${endpoint.route.endpoint_str}
`;
        disallowed++;
      }
    }
    if (disallowed === 0) {
      robots += `Disallow: 
`;
    }
    robots += `
Sitemap: ${this.full_domain}/sitemap.xml`;
    this.endpoint({
      method: "GET",
      endpoint: "/robots.txt",
      content_type: "text/plain",
      data: robots,
      _compress: false
    });
  }
  // Create admin endpoint.
  // @deprecated use MongoDB Atlas instead!
  /* private _create_admin_endpoint(): void {
  
          // Logs.
          this.log(2, "Creating admin endpoint.");
  
          // Add admin tokens.
          this.admin.tokens = [];
  
          // Verify token.
          const verify_token = (token: string): boolean => {
              const now = Date.now();
              let new_tokens: Array<{token: string, expiration: number}> = [];
              let verified = false;
              this.admin.tokens!.forEach((i) => {
                  if (now < i.expiration) {
                      if (i.token === token) {
                          verified = true;
                      }
                      new_tokens.push(i);
                  }
              })
              this.admin.tokens = new_tokens;
              return verified;
          }
  
          // Admin data.
          this.endpoint({
              method: "POST",
              endpoint: "/admin/auth",
              content_type: "application/json",
              rate_limit: {
                  group: "volt.admin.auth",
                  limit: 5,
                  interval: 60,
              },
              params: {
                  password: "string",
              },
              ip_whitelist: this.admin.ips,
              callback: async (stream: Stream, params: {password: string}) => {
                  // Check key.
                  if (params.password !== this.admin.password) {
                      return stream.send({
                          status: 403,
                          headers: {"Content-Type": "text/plain"},
                          data: "Access Denied",
                      })
                  }
  
                  // Generate token.
                  const token = {
                      token: String.random(32),
                      expiration: Date.now() + 3600 * 1000,
                  };
                  this.admin.tokens!.push(token)
  
                  // Response.
                  return stream.send({
                      status: 200,
                      headers: {"Content-Type": "application/json"},
                      data: token,
                  })
              },
          })
  
          // Admin data.
          this.endpoint({
              method: "GET",
              endpoint: "/admin/data",
              content_type: "application/json",
              rate_limit: "global",
              params: {
                  token: "string",
              },
              ip_whitelist: this.admin.ips,
              callback: async (stream: Stream, params: {token: string}) => {
                  // Verify token.
                  if (!verify_token(params.token)) {
                      return stream.send({
                          status: 403,
                          headers: {"Content-Type": "text/plain"},
                          data: "Access Denied",
                      })
                  }
  
                  // Data.
                  const data: Record<string, any> = {};
  
                  // Parse subscriptions.
                  const subscriptions = await this.payments._get_all_active_subscriptions();
                  data.subscriptions = subscriptions.length;
  
                  // Load data.
                  const status = await this._sys_db.load("status", {
                      default: {
                          running_since: null,
                          running_threads: 0,
                          total_threads: 0,
                      }
                  });
                  Object.assign(data, status);
  
                  // System data.
                  data.cpu_usage = vlib.System.cpu_usage();
                  data.memory_usage = vlib.System.memory_usage();
                  data.network_usage = await vlib.System.network_usage();
  
                  // Users.
                  data.users = (await this.users.list()).length;
  
                  // Response.
                  return stream.send({
                      status: 200,
                      headers: {"Content-Type": "application/json"},
                      data: data,
                  })
              },
          })
  
          // Admin view.
          this.endpoint({
              method: "GET",
              endpoint: "/admin",
              content_type: "application/json",
              rate_limit: "global",
              params: {
                  password: "string",
              },
              ip_whitelist: this.admin.ips,
              sitemap: false,
              robots: false,
              view: {
                  templates: {
                      DOMAIN: this.domain,
                  },
                  callback: () => {
                      // Style.
                      const style = {
                          bg: "#F2F3F6",
                          sub_bg: "#FAFAFA",
                          fg: "#000000",
                          sub_fg: "#9099B4",
                          border: "#D6D6D6",
                          tint: "#64B878", //"#8EB8EB", //"#4E9CF7",
                      }
  
                      // ... rest of the admin view implementation remains the same as it's client-side JavaScript ...
                  },
              },
          })
      } */
  // Initialize statics.
  async _initialize_statics() {
    this.log(2, "Initializing static directories.");
    const static_paths = [];
    const add_static_file = async (path2, endpoint, cache = true) => {
      static_paths.push(path2.str());
      if (import_image_endpoint.ImageEndpoint.supported_images.has(path2.extension())) {
        const e = new import_image_endpoint.ImageEndpoint({
          endpoint,
          path: path2,
          cache,
          rate_limit: "global",
          _is_static: true
        });
        const aspect_ratio = await e.get_aspect_ratio();
        if (aspect_ratio != null) {
          this.statics_aspect_ratios.set(e.route.endpoint_str, aspect_ratio);
        }
        this.endpoint(e);
      } else {
        this.endpoint(new import_endpoint.Endpoint({
          method: "GET",
          endpoint,
          cache,
          rate_limit: "global",
          file_path: path2,
          _is_static: true
        }));
      }
    };
    const add_static = async (opts) => {
      if (opts == null) {
        return;
      }
      if (typeof opts === "object") {
        this.log(3, "Adding static directory " + opts.path);
        vlib.schema.validate(opts, {
          unknown: false,
          throw: true,
          schema: {
            path: "string",
            endpoint: { type: "string", default: null },
            cache: { type: ["boolean", "number"], default: true },
            endpoints_cache: { type: "object", default: {} },
            exclude: { type: "array", default: [] }
          }
        });
        const paths = [];
        const source = new vlib.Path(opts.path).abs();
        if (!source.exists()) {
          this.log(1, `Static path "${source.str()}" does not exist; skipping.`);
          return;
        }
        const source_len = source.str().length;
        const is_dir = source.is_dir();
        const exclude = [/\.DS_Store$/, /\.cache(?:\/|$)/, /\.old(?:\/|$)/, /\.ignore$/, ...opts.exclude || []];
        const is_excluded = (p) => {
          const s = typeof p === "string" ? p : p.str();
          return exclude.some((pattern) => pattern instanceof RegExp ? pattern.test(s) : s === String(pattern));
        };
        opts.endpoint = opts.endpoint || `/${source.full_name()}`;
        if (opts.endpoint.charAt(0) != "/") {
          opts.endpoint = "/" + opts.endpoint;
        }
        while (opts.endpoint.charAt(opts.endpoint.length - 1) == "/") {
          opts.endpoint = opts.endpoint.slice(0, -1);
        }
        if (!is_dir) {
          return await add_static_file(source, opts.endpoint, opts.cache);
        }
        const read_dir = async (path2) => {
          const dir_paths = await path2.paths();
          const promises = [];
          for (let i = 0; i < dir_paths.length; i++) {
            if (!is_excluded(dir_paths[i])) {
              if (dir_paths[i].is_dir()) {
                promises.push(read_dir(dir_paths[i]));
              } else {
                paths.push(dir_paths[i]);
              }
            }
          }
          ;
          await Promise.all(promises);
        };
        if (is_dir) {
          await read_dir(source);
        }
        for (const path2 of paths) {
          const endpoint = `${opts.endpoint}${path2.str().substr(source_len)}`;
          await add_static_file(path2, endpoint, opts.endpoints_cache === void 0 ? opts.cache : opts.endpoints_cache[endpoint] ?? opts.cache);
        }
      } else if (typeof opts === "string") {
        await add_static({ path: opts });
      }
    };
    for (let i = 0; i < this.statics.length; i++) {
      if (this.statics[i] instanceof vlib.Path) {
        this.statics[i] = this.statics[i].str();
      }
      await add_static(this.statics[i]);
    }
    return static_paths;
  }
  /** Initialize the system and user defined keys. */
  async _initialize_keys() {
    const start = Date.now();
    await this._db_init_promise;
    this.performance.end("_initialize_keys():await-db-init", start);
    const sys_keys = await this._sys_keys_db.load({ id: "sys_keys" }, {
      default: {
        id: "sys_keys",
        rate_limit_api_key: void 0
      }
    });
    let perform_sys_keys_save = false;
    if (sys_keys.rate_limit_api_key == null) {
      this.rate_limit_api_key = this.generate_crypto_key(32);
      sys_keys.rate_limit_api_key = this.rate_limit_api_key;
      perform_sys_keys_save = true;
    } else {
      this.rate_limit_api_key = sys_keys.rate_limit_api_key;
    }
    if (perform_sys_keys_save) {
      await this._sys_keys_db.set({ id: "sys_keys" }, sys_keys);
    }
    const user_keys = await this._keys_db.load({ id: "user_keys" }, {
      default: {
        id: "user_keys",
        keys: {}
      }
    });
    let perform_user_keys_save = false;
    for (const key of this._user_keys_opts) {
      const name = typeof key === "string" ? key : key.name;
      if (user_keys[name]) {
        this.keys[name] = user_keys[name];
      } else {
        perform_user_keys_save = true;
        if (typeof key === "string") {
          if (!key) {
            throw Error(`Crypto key "${key}" is an invalid key name.`);
          }
          const generated_key = this.generate_crypto_key(32);
          user_keys.keys[key] = generated_key;
          this.keys[key] = generated_key;
        } else {
          if (!key.name) {
            throw Error(`Crypto key "${key.name}" is an invalid key name.`);
          }
          if (key.length == null) {
            throw Error(`Crypto key "${key.name}" does not contain a "length" attribute.`);
          }
          if (typeof key.length !== "number") {
            throw Error(`Crypto key "${key.name}" has an invalid type for attribute "length", the valid type is "number".`);
          }
          const generated_key = this.generate_crypto_key(key.length);
          user_keys.keys[key.name] = generated_key;
          this.keys[key.name] = generated_key;
        }
      }
    }
    if (perform_user_keys_save) {
      await this._keys_db.set({ id: "user_keys" }, user_keys);
    }
  }
  /**
   * Checks if an endpoint route already exists.
   * @param method    HTTP method
   * @param endpoint  String path or RegExp
   */
  _check_duplicate_route(route) {
    const e = this.find_endpoint(route);
    if (e) {
      throw new Error(`Duplicate "${route.method}:${route.endpoint_str}" endpoint route, it is already defined by endpoint "${e.id}".`);
    }
  }
  // Serve a client.
  // @todo implement rate limiting.
  // @todo save internal server errors.
  async _serve(http2_stream, headers, req, res) {
    try {
      const stream = new import_stream.Stream(http2_stream, headers, req, res);
      let endpoint;
      let method;
      let endpoint_url;
      const log_endpoint_result = (message, status) => {
        let log_level = endpoint && endpoint.is_static ? 3 : 0;
        if (status == null) {
          status = stream.status_code;
        }
        this.log(log_level, `${method}:${endpoint_url}: ${message ? message : import_status.Status.get_description(status ?? "unknown")} [${status}] (${stream.ip}).`);
      };
      const serve_error_endpoint = async (status_code) => {
        const is_api_endpoint = endpoint && endpoint.callback != null;
        let default_response;
        switch (status_code) {
          case 400:
            default_response = {
              status: 400,
              headers: { "Content-Type": is_api_endpoint ? "application/json" : "text/plain" },
              data: is_api_endpoint ? { error: "Bad Request" } : "Bad Request"
            };
            break;
          case 403:
            default_response = {
              status: 403,
              headers: { "Content-Type": is_api_endpoint ? "application/json" : "text/plain" },
              data: is_api_endpoint ? { error: "Access Denied" } : "Access Denied"
            };
            break;
          case 404:
            default_response = {
              status: 404,
              headers: { "Content-Type": is_api_endpoint ? "application/json" : "text/plain" },
              data: is_api_endpoint ? { error: "Not Found" } : "Not Found"
            };
            break;
          case 500:
          default:
            default_response = {
              status: 500,
              headers: { "Content-Type": is_api_endpoint ? "application/json" : "text/plain" },
              data: is_api_endpoint ? { error: "Internal Server Error" } : "Internal Server Error"
            };
            break;
        }
        if (!this.err_endpoints.has(status_code)) {
          stream.send(default_response);
        } else {
          const err_endpoint = this.err_endpoints.get(status_code);
          try {
            await err_endpoint.serve({ stream, status: status_code });
          } catch (err) {
            this.log.error(`Error endpoint ${status_code}: `, err);
            stream.send(default_response);
          }
        }
      };
      method = stream.method;
      endpoint_url = stream.endpoint;
      this.log(3, "Searching for endpoint: ", `${method}:${endpoint_url}`);
      endpoint = this.endpoints.get(`${method}:${endpoint_url}`);
      if (!endpoint) {
        const route = new import_route.Route(method, endpoint_url);
        for (const e of this.endpoints.values()) {
          if (e.route.is_regex) {
            const matched_params = e.route.match(route);
            if (matched_params !== false) {
              this.log(3, "Matched regex route: ", e.route.id);
              endpoint = e;
              Object.keys(matched_params).walk((k) => {
                if (stream.params[k] == null) {
                  stream.params[k] = matched_params[k];
                }
              });
              break;
            }
          }
        }
      } else {
        this.log(3, "Matched route: ", endpoint.route.id);
      }
      if (!endpoint) {
        if (method === "OPTIONS") {
          const original_method = stream.headers["access-control-request-method"];
          const original_endpoint = this.find_endpoint(endpoint_url, original_method);
          if (original_endpoint) {
            this._set_header_defaults(stream);
            original_endpoint._set_headers(stream);
            stream.send({ status: import_status.Status.no_content });
            log_endpoint_result();
            return;
          }
        }
        await serve_error_endpoint(404);
        log_endpoint_result();
        return;
      }
      this._set_header_defaults(stream);
      if (method === "OPTIONS") {
        try {
          await endpoint._serve_options(stream);
        } catch (err) {
          this.log.error(`${method}:${endpoint_url}: `, err);
          if (!stream.destroyed && !stream.finished) {
            await serve_error_endpoint(500);
            log_endpoint_result();
          }
          return;
        }
        log_endpoint_result();
        return;
      }
      if (!this.offline && this.production && this.rate_limit !== void 0 && endpoint.rate_limit_groups.length > 0) {
        const result = await this.rate_limit.limit(stream.ip, endpoint.rate_limit_groups);
        if (result != null) {
          stream.send({
            status: 429,
            headers: {
              "Content-Type": "text/plain",
              "X-RateLimit-Reset": result
            },
            data: `Rate limit exceeded, please try again in ${Math.floor((result - Date.now()) / 1e3)} seconds.`
          });
          log_endpoint_result();
          return;
        }
      }
      try {
        await stream.join();
      } catch (err) {
        this.log.error(`${method}:${endpoint_url}: `, err);
        await serve_error_endpoint(500);
        log_endpoint_result();
        return;
      }
      try {
        stream._parse_params();
      } catch (err) {
        this.log.error(`${method}:${endpoint_url}: `, err);
        await serve_error_endpoint(400);
        log_endpoint_result();
        return;
      }
      if (!endpoint.is_static || endpoint.authenticated) {
        const auth_result = await this.users._authenticate(stream);
        if (auth_result != null && !endpoint.is_static) {
          this.users._reset_cookies(stream);
        }
        if (auth_result != null && !endpoint.is_static && (endpoint.view != null || endpoint.content_type === "text/html")) {
          stream.set_header("Location", `/signin?next=${encodeURIComponent(stream.endpoint)}`);
        }
        if (auth_result != null && endpoint.authenticated) {
          stream.send(auth_result);
          log_endpoint_result();
          return;
        }
      }
      try {
        await endpoint.serve({ stream });
      } catch (err) {
        this.log.error(`${method}:${endpoint_url}: `, err);
        if (!stream.destroyed && !stream.finished) {
          await serve_error_endpoint(500);
          log_endpoint_result();
        }
        return;
      }
      if (!stream.finished) {
        this.log.error(`${method}:${endpoint_url}: `, "Unfinished response.");
        await serve_error_endpoint(500);
        log_endpoint_result();
        return;
      }
      log_endpoint_result();
    } catch (err) {
      this.log.error(err);
    }
  }
  // ---------------------------------------------------------
  // Utilities.
  /** The promise of database initialization and connecting. */
  _db_init_promise;
  /** Is initialized. */
  _initialized = false;
  /** Is initialized by a worker. */
  _initialized_by_worker = false;
  /**
   * Initialize the server.
   * @returns A promise that resolves when the server has been initialized.
   * @docs
   */
  async initialize({ worker = false } = {}) {
    if (this._initialized) {
      return;
    }
    this._initialized = true;
    this._initialized_by_worker = worker;
    this.log(1, "Initializing server.");
    const initialize_start = Date.now();
    this.performance.start();
    this._db_init_promise = (async () => {
      let start = Date.now();
      await this.db.initialize();
      this.performance.end("init-db", start);
      start = Date.now();
      await this.db.connect();
      this.performance.end("connect-db", start);
    })();
    if (this.endpoint_cache_dir.exists()) {
      await this.endpoint_cache_dir.del({ recursive: true });
    }
    await this.endpoint_cache_dir.mkdir({ recursive: true });
    if (!worker) {
      if (this.tls) {
        this.https = http2.createSecureServer({
          key: new vlib.Path(this.tls.key).load_sync({ encoding: "utf8" }),
          cert: new vlib.Path(this.tls.cert).load_sync({ encoding: "utf8" }),
          ca: this.tls.ca == null ? void 0 : new vlib.Path(this.tls.ca).load_sync({ encoding: "utf8" }),
          passphrase: this.tls.passphrase,
          allowHTTP1: true
        });
        this.https.on("stream", (stream, headers) => {
          this._serve(stream, headers, void 0, void 0);
        });
        this.https.on("request", (req, res) => {
          if (req.httpVersionMajor === 1) {
            this._serve(void 0, void 0, req, res);
          }
        });
      } else if (this.production && this.payments) {
        throw Error("Accepting payments in production mode requires HTTPS.");
      }
      this.performance.end("create-https-server");
      if (this.tls) {
        this.http = http.createServer((request, response) => {
          const reqUrl = typeof request.url === "string" ? request.url : "/";
          const location = `https://${this.domain}${reqUrl}`;
          response.writeHead(308, { Location: location });
          response.end();
        });
      } else {
        this.http = http.createServer((req, res) => {
          this._serve(void 0, void 0, req, res);
        });
      }
      this.performance.end("create-http-server");
      this._init_default_headers();
      this.performance.end("init-default-headers");
      this._create_default_endpoints();
      this.performance.end("create-default-endpoints");
      await this._initialize_statics();
      this.performance.end("_initialize_statics()");
    }
    await this._initialize_keys();
    this.performance.end("load-keys");
    const promises = [];
    this.performance.start();
    promises.push(this.users._initialize({ worker }));
    if (this.payments !== void 0) {
      if (this.payments.type === "stripe") {
        promises.push(this.payments.initialize({ worker }));
      } else {
        this.payments.type.toString();
        throw Error(`Unsupported payments provider "${this.payments.type}".`);
      }
    }
    if (!worker) {
      if (this.find_endpoint("/sitemap.xml") == null) {
        promises.push(this._create_sitemap());
      }
      if (this.find_endpoint("/robots.txt") == null) {
        promises.push(this._create_robots_txt());
      }
    }
    if (this.company.stroke_icon || this.company.icon) {
      for (const endpoint of this.endpoints.values()) {
        if (this.company.stroke_icon_path == null && endpoint.route.endpoint === this.company.stroke_icon) {
          this.company.stroke_icon_path = endpoint.file_path?.str() || void 0;
        }
        if (this.company.icon_path == null && endpoint.route.endpoint === this.company.icon) {
          this.company.icon_path = endpoint.file_path?.str() || void 0;
        }
      }
      if (this.company.stroke_icon != null && this.company.stroke_icon_path == null) {
        throw Error(`Unable to find the company's stroke icon endpoint "${this.company.stroke_icon}", consider defining the "company.stroke_icon_path" property.`);
      }
      if (this.company.icon != null && this.company.icon_path == null) {
        throw Error(`Unable to find the company's icon endpoint "${this.company.icon}", consider defining the "company.icon_path" property.`);
      }
    }
    await Promise.all(promises);
    this.performance.end("awaiting-promise-list");
    if (!worker) {
      this.performance.start();
      for (const endpoint of this.endpoints.values()) {
        endpoint._initialize(this);
      }
      for (const endpoint of this.err_endpoints.values()) {
        endpoint._initialize(this);
      }
      this.performance.end("initialize-endpoints");
    }
    for (const callback of this.events.get("initialize")) {
      await callback({ worker });
    }
    this.performance.end("on-initialize-callbacks");
    this.performance.end("initialize()", initialize_start);
  }
  find_endpoint(endpoint, method) {
    let route;
    if (endpoint instanceof import_route.Route) {
      route = endpoint;
      endpoint = route.endpoint_str;
      method = route.method;
    }
    method ??= "GET";
    const result = this.endpoints.get(`${method}:${endpoint}`);
    if (!result) {
      if (!route)
        route = new import_route.Route(method, endpoint);
      for (const e of this.endpoints.values()) {
        if (e.route.is_regex && e.route.match(route)) {
          return e;
        }
      }
    }
    return result;
  }
  /** Assert mail is configured. */
  assert_mail() {
    if (!this.mail) {
      throw new import_internal_external.ExternalError({ message: "Mail is not configured." });
    }
  }
  // ---------------------------------------------------------
  // Server.
  /**
   * Start the server.
   *
   * @example
   * {Start}
   * Start the server.
   * ```
   * const server = new volt.Server({ ... });
   * await server.start();
   * ```
   * @docs
   */
  async start() {
    if (this._initialized_by_worker) {
      throw Error("Cannot start the server when it is initialized as a worker by 'Server.initialize({ worker: true })'.");
    }
    await this.initialize();
    if (this.production) {
      for (const endpoint of this.endpoints.values()) {
        if (endpoint.view) {
          await endpoint.view.production_initialize();
        }
      }
    }
    if (this.rate_limit) {
      this.performance.start();
      await this.rate_limit.start();
      this.performance.end("init-rate-limit");
    }
    let forked = false;
    if (this.production && this.threading.enabled && import_cluster.default.isPrimary && this.threading.threads > 1) {
      this.log(0, `Starting ${this.threading.threads} threads.`);
      let active_threads = 0;
      const thread_ids = {};
      const restart_limiters = {};
      const start_thread = (thread_id, restart = false) => {
        const worker = import_cluster.default.fork();
        this.log(restart ? 0 : 1, `Starting thread ${worker.process.pid}.`);
        thread_ids[worker.process.pid] = thread_id;
        ++active_threads;
      };
      for (let i = 0; i < this.threading.threads; i++) {
        let thread_id;
        while ((thread_id = vlib.String.random(8)) && Object.values(thread_ids).includes(thread_id)) {
        }
        restart_limiters[thread_id] = new vlib.TimeLimiter({ limit: 3, duration: 60 * 1e3 });
        start_thread(thread_id);
      }
      await this._website_status_db.set({ id: "status" }, {
        running_since: Date.now(),
        total_threads: active_threads,
        running_threads: active_threads
      });
      import_cluster.default.addListener("exit", async (worker, code, signal) => {
        const thread_id = thread_ids[worker.process.pid];
        delete thread_ids[worker.process.pid];
        this.log.error(`Thread ${worker.process.pid} crashed.`);
        const limiter = restart_limiters[thread_id];
        if (limiter != null && limiter.limit()) {
          --active_threads;
          start_thread(thread_id, true);
        } else {
          this.log.error(`Thread ${worker.process.pid} is being shut down due to its periodic restart limit.`);
          --active_threads;
          await this._website_status_db.save({ id: "status" }, { $inc: { running_threads: -1 } });
          if (active_threads === 0) {
            this.log.error(`All threads died, stopping server.`);
            process.exit(0);
          }
        }
      });
      await this.db.close();
    } else {
      forked = this.production && this.threading.enabled;
      let is_running = false;
      const on_running = () => {
        if (!is_running) {
          is_running = true;
          if (this.https !== void 0) {
            this.log(0, `Running on http://${this.ip}:${this.port} and https://${this.ip}:${this.https_port}.`);
          } else {
            this.log(0, `Running on http://${this.ip}:${this.port}.`);
          }
        }
      };
      const on_error = (error) => {
        if (error.syscall !== "listen") {
          throw error;
        }
        switch (error.code) {
          case "EACCES":
            console.error(`Error: Address ${this.ip}:${this.port} requires elevated privileges.`);
            process.exit(1);
            break;
          case "EADDRINUSE":
            console.error(`Error: Address ${this.ip}:${this.port} is already in use.`);
            process.exit(1);
            break;
          default:
            throw error;
        }
      };
      this.http.listen(this.port, this.ip === "*" ? void 0 : this.ip, on_running);
      this.http.on("error", on_error);
      if (this.https !== void 0) {
        this.https.listen(this.https_port, this.ip === "*" ? void 0 : this.ip, on_running);
        this.https.on("error", on_error);
      }
      let graceful_shutdown_shutting_down = false;
      const graceful_shutdown = async () => {
        if (graceful_shutdown_shutting_down)
          return;
        graceful_shutdown_shutting_down = true;
        try {
          await this.stop();
        } catch (e) {
          this.log.error("Shutdown error:", e);
        } finally {
          process.exit(0);
        }
      };
      process.on("SIGTERM", graceful_shutdown);
      process.on("SIGINT", graceful_shutdown);
      if (process.env.VOLT_FILE_WATCHER === "1") {
        new vlib.Path(process.env.VOLT_STARTED_FILE).save_sync("1");
      }
      this.performance.end("listen");
    }
    this.performance.start();
    for (const callback of this.events.get("start")) {
      const res = callback({ forked });
      if (res instanceof Promise) {
        await res;
      }
    }
    this.performance.end("on-start-callbacks");
    console.log(this.performance.dump());
  }
  /**
   * Stop the server.
   * @note After stopping the server we can no longer restart the server.
   *
   * @example
   * {Stop}
   * Stop the server.
   * ```
   * const server = new volt.Server({ ... });
   * await server.start();
   * ...
   * await server.stop();
   * ```
   *
   * @docs
   */
  async stop() {
    this.log(0, "Stopping the server...");
    for (const callback of this.events.get("stop")) {
      const res = callback();
      if (res instanceof Promise) {
        await res;
      }
    }
    if (this.rate_limit) {
      await this.rate_limit.stop();
    }
    if (this.https)
      this.https.close();
    if (this.http)
      this.http.close();
    await this.db.close();
    this.log.stop();
    this._initialized = false;
  }
  // ---------------------------------------------------------
  // Events.
  /**
   * Add an event callback.
   * See {@link Events} for more info.
   * @docs
   */
  on(name, callback) {
    this.events.add(name, callback);
    return this;
  }
  /**
   * Remove an event callback.
   * See {@link Events} for more info.
   * @docs
   */
  off(name, callback) {
    this.events.remove(name, callback);
    return this;
  }
  // ---------------------------------------------------------
  // Endpoints.
  /**
   * Add a single endpoint.
   * Only supports a single endpoint due to parameter inference.
   * @note An error is thrown when the endpoint route already exists.
   * @template Response User inputted response type that will be returned as response, optionaly typing used for consistency.
   * @template S system template for inferring the endpoint callback parameters.
   * @param endpoint The endpoint or endpoint options to add.
   * @returns A registered endpoint object that can for instance be used to infer the endpoint parameters.
   *
   * @docs
   */
  endpoint(endpoint) {
    const e = endpoint instanceof import_endpoint.Endpoint ? endpoint : new import_endpoint.Endpoint(endpoint);
    this._check_duplicate_route(e.route);
    this.endpoints.set(e.route.id, e);
    return {
      Params: void 0,
      method: e.route.method,
      Method: e.route.method,
      endpoint: e.route.endpoint,
      Endpoint: e.route.endpoint,
      route: e.route
    };
  }
  /**
   *  Add an endpoint per error status code.
   * @param status_code
   *      The status code of the error.
   *
   *      The supported status codes are:
   *      * `*` For all errors not specifically defined.
   *      * `status >= 400`
   * @param endpoint The error endpoint or error endpoint options.
   *
   * @note
   * Best practice is to define a universal `/error` endpoint using `Endpoint.templates` to render the error details.
   * Then this endpoint can be cloned using `Endpoint.clone()` and defined with specific template values per status code.
   *
   * @docs
   */
  error_endpoint(status_code, endpoint) {
    let e;
    if (endpoint instanceof import_endpoint.Endpoint) {
      e = endpoint;
    } else {
      e = new import_endpoint.Endpoint({
        ...endpoint,
        method: "GET",
        endpoint: `/error/${status_code}`
      });
    }
    if (status_code === "*") {
      Object.values(import_status.Status).forEach((status) => {
        if (typeof status === "number" && status >= 400 && !this.err_endpoints.has(status)) {
          this.err_endpoints.set(status, e);
        }
      });
    } else {
      this.err_endpoints.set(status_code, e);
    }
    return this;
  }
  // ---------------------------------------------------------
  // Content Security Policy.
  /**
   * Add an url to the Content-Security-Policy. This function does not overwrite the existing key's value.
   * @warning This function no longer has any effect when `Server.start()` has been called.
   * @param key The Content-Security-Policy key, e.g. `script-src`.
   * @param value The value to add to the Content-Security-Policy key.
   * @example
   * ...
   * server.add_csp("script-src", "somewebsite.com");
   * server.add_csp("upgrade-insecure-requests");
   * @docs
   */
  add_csp(key, value = null) {
    if (this.csp[key] === void 0) {
      this.csp[key] = "";
    }
    if (Array.isArray(value)) {
      value.forEach((v) => {
        if (typeof v === "string" && v.length > 0) {
          this.csp[key] += " " + v.trim();
        }
      });
    } else if (typeof value === "string" && value.length > 0) {
      this.csp[key] += " " + value.trim();
    }
  }
  // Remove a csp.
  /**
   * Remove an url from the Content-Security-Policy. This function does not overwrite the existing key's value.
   * @warning This function no longer has any effect when `Server.start()` has been called.
   * @param key The Content-Security-Policy key, e.g. `script-src`.
   * @param value The value to remove from the Content-Security-Policy key.
   * @example
   * ...
   * server.remove_csp("script-src", "somewebsite.com");
   * server.remove_csp("upgrade-insecure-requests");
   * @docs
   */
  remove_csp(key, value = null) {
    if (this.csp[key] === void 0) {
      return;
    }
    if (typeof value === "string" && value.length > 0) {
      this.csp[key] = this.csp[key].replaceAll(value, "");
    } else {
      delete this.csp[key];
    }
  }
  // Delete a csp key.
  /**
   * Delete an key from the Content-Security-Policy.
   * @warning This function no longer has any effect when `Server.start()` has been called.
   * @param key The Content-Security-Policy key, e.g. `script-src`.
   * @example
   * ...
   * server.del_csp("script-src");
   * server.del_csp("upgrade-insecure-requests");
   * @docs
   */
  del_csp(key) {
    delete this.csp[key];
  }
  // ---------------------------------------------------------
  // Status.
  /**
   * This function is meant to be used when the server is in production mode, it will make an API request to your server through the defined `Server.domain` parameter.
   * @note This function can be called without initializing the server.
   * @param type The wanted output type. Either an `object` or a `string` type for CLI purposes.
   * @docs
   */
  async fetch_status(type = "object") {
    const key_path = this.source.join(".status/key");
    if (!key_path.exists()) {
      throw new Error("No status key has been generated yet. Start your server first.");
    }
    const key = key_path.load_sync();
    const { body: status } = await vlib.request({
      host: this.domain,
      endpoint: "/.status",
      method: "GET",
      params: { key },
      query: true,
      json: true
    });
    if (type === "string") {
      if (status.running_since != null) {
        status.running_since = new vlib.Date(status.running_since).format("%d-%m-%y %H:%M:%S");
      }
      let str = `${this.domain}:
`;
      Object.keys(status).forEach((key2) => {
        str += ` * ${key2}: ${status[key2]}
`;
      });
      str = str.substr(0, str.length - 1);
      return str;
    }
    return status;
  }
  // ---------------------------------------------------------
  // TLS.
  /**
   * Generate a key and csr for tls.
   * @docs
   */
  async generate_ssl_key({ output_path, ec = true }) {
    if (output_path == null) {
      throw Error('Define parameter "path".');
    }
    const key = new vlib.Path(output_path);
    if (key.exists()) {
      throw Error(`Key path "${key.str()}" already exists, remove the file manually to continue.`);
    }
    const proc = new vlib.Proc();
    await proc.start({
      command: "openssl",
      args: ec ? ["ecparam", "-genkey", "-name", "secp384r1", "-out", key.str()] : ["genpkey", "-algorithm", "RSA", "-pkeyopt", "rsa_keygen_bits:2048", "-out", key.str()],
      opts: { stdio: "inherit" }
    });
    if (proc.exit_status != 0) {
      throw Error(`Encountered an error while generating the private key [${proc.exit_status}]: ${proc.err}`);
    }
  }
  /**
   * Generate a csr for tls.
   * @docs
   */
  async generate_csr({ output_path, key_path, name, domain, organization_unit, country_code, province, city }) {
    if (key_path == null) {
      throw Error('Define parameter "key_path".');
    }
    if (organization_unit == null) {
      throw Error('Define parameter "organization_unit".');
    }
    const key = new vlib.Path(key_path);
    if (!key.exists()) {
      throw Error(`Key path "${key.str()}" does not exist.`);
    }
    const csr = new vlib.Path(output_path);
    if (csr.exists()) {
      throw Error(`CSR path "${csr.str()}" already exists, remove the file manually to continue.`);
    }
    const proc = new vlib.Proc();
    await proc.start({
      command: "openssl",
      args: [
        "req",
        "-new",
        "-key",
        key.str(),
        "-out",
        csr.str(),
        "-subj",
        `/C=${country_code}/ST=${province}/L=${city}/O=${name}/OU=${organization_unit}/CN=${domain}`
      ],
      opts: { stdio: "inherit" }
    });
    if (proc.exit_status != 0) {
      throw Error(`Encountered an error while generating the CSR [${proc.exit_status}]: ${proc.err}`);
    }
    this.log(0, `Generated the tls key with CSR for domain "${this.domain}".`);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Server
});
