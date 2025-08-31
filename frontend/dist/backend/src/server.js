/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */
import { fileURLToPath } from 'url';
import * as path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// ---------------------------------------------------------
// Libraries.
import * as http from "http";
import * as http2 from "http2";
import * as crypto from "crypto";
import * as nodemailer from 'nodemailer';
import libcluster from 'cluster';
import * as os from 'os';
import * as vlib from "@vandenberghinc/vlib";
const { debug } = vlib;
// ---------------------------------------------------------
// Imports.
import { Utils } from "./utils.js";
import { Meta } from './meta.js';
import * as Mail from './plugins/mail/ui.js';
import { Status } from "./status.js";
import { Endpoint } from "./endpoint.js";
import { ImageEndpoint } from "./image_endpoint.js";
import { Stream } from "./stream.js";
import { Database } from "./database/database.js";
import { Users } from "./users.js";
import { Paddle } from "./payments/paddle.js";
import { RateLimits, RateLimitServer, RateLimitClient } from "./rate_limit.js";
import { Route } from "./route.js";
/**
 * The backend server class.
 *
 * When the HTTPS parameters `certificate` and `private_key` are defined, the server will run automatically on HTTP and HTTPS.
 *
 * @property users The initialized {@link Users} instance.
 */
// @tdo implement 3D secure "requires_action" status for a refund and payment intent.
// https://stripe.com/docs/payments/3d-secure
// @ts-ignore
export class Server {
    // ---------------------------------------------------------
    // Static attributes.
    // ---------------------------------------------------------
    /** Content type per mime. */
    static content_type_mimes = new Map([
        [".html", "text/html"],
        [".htm", "text/html"],
        [".shtml", "text/html"],
        [".css", "text/css"],
        [".xml", "application/xml"],
        [".gif", "image/gif"],
        [".jpeg", "image/jpeg"],
        [".jpg", "image/jpeg"],
        [".js", "application/javascript"],
        [".ts", "application/typescript"],
        [".atom", "application/atom+xml"],
        [".rss", "application/rss+xml"],
        [".mml", "text/mathml"],
        [".txt", "text/plain"],
        [".jad", "text/vnd.sun.j2me.app-descriptor"],
        [".wml", "text/vnd.wap.wml"],
        [".htc", "text/x-component"],
        [".png", "image/png"],
        [".tif", "image/tiff"],
        [".tiff", "image/tiff"],
        [".wbmp", "image/vnd.wap.wbmp"],
        [".ico", "image/x-icon"],
        [".jng", "image/x-jng"],
        [".bmp", "image/x-ms-bmp"],
        [".svg", "image/svg+xml"],
        [".svgz", "image/svg+xml"],
        [".webp", "image/webp"],
        [".woff", "font/woff"],
        [".woff2", "font/woff2"],
        [".jar", "application/java-archive"],
        [".war", "application/java-archive"],
        [".ear", "application/java-archive"],
        [".json", "application/json"],
        [".hqx", "application/mac-binhex40"],
        [".doc", "application/msword"],
        [".pdf", "application/pdf"],
        [".ps", "application/postscript"],
        [".eps", "application/postscript"],
        [".ai", "application/postscript"],
        [".rtf", "application/rtf"],
        [".m3u8", "application/vnd.apple.mpegurl"],
        [".xls", "application/vnd.ms-excel"],
        [".eot", "application/vnd.ms-fontobject"],
        [".ppt", "application/vnd.ms-powerpoint"],
        [".wmlc", "application/vnd.wap.wmlc"],
        [".kml", "application/vnd.google-earth.kml+xml"],
        [".kmz", "application/vnd.google-earth.kmz"],
        [".7z", "application/x-7z-compressed"],
        [".cco", "application/x-cocoa"],
        [".jardiff", "application/x-java-archive-diff"],
        [".jnlp", "application/x-java-jnlp-file"],
        [".run", "application/x-makeself"],
        [".pl", "application/x-perl"],
        [".pm", "application/x-perl"],
        [".prc", "application/x-pilot"],
        [".pdb", "application/x-pilot"],
        [".rar", "application/x-rar-compressed"],
        [".rpm", "application/x-redhat-package-manager"],
        [".sea", "application/x-sea"],
        [".swf", "application/x-shockwave-flash"],
        [".sit", "application/x-stuffit"],
        [".tcl", "application/x-tcl"],
        [".tk", "application/x-tcl"],
        [".der", "application/x-x509-ca-cert"],
        [".pem", "application/x-x509-ca-cert"],
        [".crt", "application/x-x509-ca-cert"],
        [".xpi", "application/x-xpinstall"],
        [".xhtml", "application/xhtml+xml"],
        [".xspf", "application/xspf+xml"],
        [".zip", "application/zip"],
        [".bin", "application/octet-stream"],
        [".exe", "application/octet-stream"],
        [".dll", "application/octet-stream"],
        [".deb", "application/octet-stream"],
        [".dmg", "application/octet-stream"],
        [".iso", "application/octet-stream"],
        [".img", "application/octet-stream"],
        [".msi", "application/octet-stream"],
        [".msp", "application/octet-stream"],
        [".msm", "application/octet-stream"],
        [".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        [".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
        [".pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
        [".mid", "audio/midi"],
        [".midi", "audio/midi"],
        [".kar", "audio/midi"],
        [".mp3", "audio/mpeg"],
        [".ogg", "audio/ogg"],
        [".m4a", "audio/x-m4a"],
        [".ra", "audio/x-realaudio"],
        [".3gpp", "video/3gpp"],
        [".3gp", "video/3gpp"],
        // [".ts", "video/mp2t"],
        [".mp4", "video/mp4"],
        [".mpeg", "video/mpeg"],
        [".mpg", "video/mpeg"],
        [".mov", "video/quicktime"],
        [".webm", "video/webm"],
        [".flv", "video/x-flv"],
        [".m4v", "video/x-m4v"],
        [".mng", "video/x-mng"],
        [".asx", "video/x-ms-asf"],
        [".asf", "video/x-ms-asf"],
        [".wmv", "video/x-ms-wmv"],
        [".avi", "video/x-msvideo"],
    ]);
    /** All file path extensions that are already compressed. */
    static compressed_extensions = new Set([
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
        ".webp",
        ".bmp",
        ".tiff",
        ".ico",
        // ".svg",
        ".svgz",
        ".mng",
        ".apng",
        ".jfif",
        ".jp2",
        ".jpx",
        ".j2k",
        ".jpm",
        ".jpf",
        ".heif",
        ".mp3",
        ".ogg",
        ".wav",
        ".flac",
        ".m4a",
        ".aac",
        ".wma",
        ".ra",
        ".mid",
        ".mp4",
        ".webm",
        ".mkv",
        ".mov",
        ".avi",
        ".wmv",
        ".mpg",
        ".mpeg",
        ".flv",
    ]);
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
    /** The smpt mailer. */
    smtp;
    smtp_sender; // is defined when `smtp` is defined.
    /** The rate limit instance. */
    rate_limit;
    /** The added endpoints. */
    endpoints = new Map();
    /** The added error endpoints. */
    err_endpoints = new Map();
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
    // Public for internal use:
    mail_style;
    csp;
    statics_aspect_ratios;
    google_tag;
    rate_limit_api_key;
    // Private.
    favicon;
    statics;
    _user_keys_opts;
    additional_sitemap_endpoints;
    tls;
    performance;
    default_headers;
    http;
    https;
    threading;
    /**
     * The master hash key.
     */
    FIX; // deprecate this key and use a key that indicates for what it is.
    master_hmac_key = null;
    // Private ollections.
    _keys_db;
    _sys_keys_db;
    _website_status_db;
    /** User defined callbacks. */
    _on_start = [];
    _on_initialize = [];
    _on_stop = [];
    constructor({ ip = "127.0.0.1", port, // leave undefined for blank detection.
    domain, is_primary = true, source, database, statics = [], favicon, company, meta = new Meta(), tls, smtp, mail_style = {
        font: '"Helvetica", sans-serif',
        title_fg: "#121B23",
        subtitle_fg: "#121B23",
        text_fg: "#1F2F3D",
        button_fg: "#FFFFFF",
        footer_fg: "#686B80",
        bg: "#EEEEEE",
        widget_bg: "#FFFFFF",
        widget_border: "#E6E6E6",
        button_bg: "#1F2F3D",
        divider_bg: "#706780",
    }, rate_limit = {
        server: {
            ip: undefined,
            port: RateLimitServer.default_port,
            https: undefined,
        },
        client: {
            ip: undefined,
            port: RateLimitServer.default_port,
            url: undefined,
        },
    }, keys = [], payments, default_headers, google_tag = undefined, users, production = false, threading = {
        enabled: false,
        threads: undefined,
    }, offline = false, additional_sitemap_endpoints = [], log_level = 0, daemon = false,
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
        // // Verify args.
        // vlib.schema.validate(arguments[0], {
        //     throw: true,
        //     error_prefix: "Server: ", unknown: false,
        //     schema: {
        //         ip: { type: "string", required: false },
        //         port: { type: "number", required: false },
        //         domain: "string",
        //         statics: { type: "array", default: [] },
        //         is_primary: { type: "boolean", default: true },
        //         source: "string",
        //         database: {
        //             type: ["string", "object"],
        //             required: true,
        //             scheme: { ...(Database.constructor_scheme as any), _server: undefined },
        //         },
        //         favicon: { type: "string", required: false },
        //         company: {
        //             type: "object",
        //             default: {},
        //             scheme: {
        //                 name: "string",
        //                 legal_name: "string",
        //                 street: "string",
        //                 house_number: "string",
        //                 postal_code: "string",
        //                 city: "string",
        //                 province: "string",
        //                 country: "string",
        //                 country_code: "string",
        //                 tax_id: { type: "string", default: null },
        //                 icon: { type: "string", default: null },
        //                 icon_path: { type: "string", default: null },
        //                 stroke_icon: { type: "string", default: null },
        //                 stroke_icon_path: { type: "string", default: null },
        //             }
        //         },
        //         meta: { type: "object", required: false },
        //         tls: {
        //             type: ["object"],
        //             required: false,
        //             scheme: {
        //                 cert: "string",
        //                 key: "string",
        //                 ca: { type: "string", default: null },
        //                 passphrase: { type: "string", default: null },
        //             }
        //         },
        //         rate_limit: {
        //             type: ["boolean", "object"],
        //             default: false,
        //             scheme: {
        //                 server: {
        //                     type: "object", default: {}, scheme: {
        //                         ip: { type: "string", default: null },
        //                         port: { type: "number", default: RateLimitServer.default_port },
        //                         https: { type: "object", default: null },
        //                     }
        //                 },
        //                 client: {
        //                     type: "object", default: {}, scheme: {
        //                         ip: { type: "string", default: null },
        //                         port: { type: "number", default: RateLimitServer.default_port },
        //                         url: { type: "string", default: null },
        //                     }
        //                 },
        //             },
        //         },
        //         keys: { type: "array", default: [] },
        //         smtp: { type: ["null", "object"], required: false },
        //         mail_style: {
        //             type: "object",
        //             required: false,
        //             scheme: {
        //                 font: { type: "string", default: '"Helvetica", sans-serif' },
        //                 title_fg: { type: "string", default: "#121B23" },
        //                 subtitle_fg: { type: "string", default: "#121B23" },
        //                 text_fg: { type: "string", default: "#1F2F3D" },
        //                 button_fg: { type: "string", default: "#FFFFFF" },
        //                 footer_fg: { type: "string", default: "#686B80" },
        //                 bg: { type: "string", default: "#EEEEEE" },
        //                 widget_bg: { type: "string", default: "#FFFFFF" },
        //                 button_bg: { type: "string", default: "#421959" },
        //                 widget_border: { type: "string", default: "#E6E6E6" },
        //                 divider_bg: { type: "string", default: "#E6E6E6" },
        //             }
        //         },
        //         payments: { type: ["null", "object"], required: false },
        //         default_headers: { type: ["null", "object"], required: false },
        //         google_tag: { type: "string", required: false },
        //         token_expiration: { type: "number", required: false },
        //         enable_2fa: { type: "boolean", required: false },
        //         enable_account_activation: { type: "boolean", required: false },
        //         production: { type: "boolean", required: false },
        //         multiprocessing: { type: "boolean", required: false, default: true },
        //         processes: { type: "number", required: false, default: null },
        //         offline: { type: "boolean", default: false },
        //         additional_sitemap_endpoints: { type: "array", default: [] },
        //         log_level: { type: "number", default: 0 },
        //         daemon: { type: ["object", "boolean"], default: {} },
        //         // admin: {type: "object", default: {}, attributes: {
        //         //     ips: {type: "array", default: []},
        //         //     password: {
        //         //         type: "string",
        //         //         verify: (param: string, attrs) => (param.length < 10 ? `Parameter "Server.admin.password" must have a length of at least 10 characters.` : undefined),
        //         //     },
        //         // }},
        //         // ts: {
        //         //     type: "object",
        //         //     required: false,
        //         //     scheme: {
        //         //         compiler_opts: {type: "object", default: {}},
        //         //         output: "string",
        //         //     },
        //         // },
        //         // browser_preview: {type: ["string", "undefined"], required: false, default: undefined},
        //     },
        // });
        // Assign attributes directly.
        if (production || port == null) {
            this.port = 80;
            this.https_port = 443;
        }
        else {
            this.port = port;
            this.https_port = port + 1;
        }
        this.ip = ip ?? "127.0.0.1";
        this.is_primary = is_primary && libcluster.isPrimary;
        this.source = new vlib.Path(source);
        this.favicon = favicon;
        this.google_tag = google_tag;
        this.production = production;
        this.company = company;
        this.mail_style = mail_style;
        this.offline = offline;
        this._user_keys_opts = keys;
        this.additional_sitemap_endpoints = additional_sitemap_endpoints;
        this.tls = tls;
        // this.admin = admin as AdminConfig;
        // Set threading.
        if (typeof threading === "boolean") {
            this.threading = {
                enabled: threading,
                threads: os.cpus().length,
            };
        }
        else {
            this.threading = {
                enabled: threading.enabled ?? true,
                threads: threading.threads ?? os.cpus().length,
            };
        }
        // Module aliases.
        this.status = Status;
        this.rate_limits = RateLimits;
        /* @performance */ this.performance = new vlib.Performance("Server performance");
        // Create logs directory.
        const log_source = this.source.join("logs");
        if (!log_source.exists()) {
            log_source.mkdir_sync({ recursive: true });
        }
        this.log = new vlib.logging.FileLogger({
            level: log_level,
            log_path: log_source.join("logs").str(),
            error_path: log_source.join("errors").str(),
        });
        // Check source.
        if (!this.source.exists()) {
            throw Error(`Source directory "${this.source.str()}" does not exist.`);
        }
        this.source = this.source.abs();
        // Set domain.
        this.domain = domain.replace("https://", "").replace("http://", "");
        while (this.domain.length > 0 && this.domain.charAt(this.domain.length - 1) === "/") {
            this.domain = this.domain.substr(0, this.domain.length - 1);
        }
        // Set full domain.
        this.full_domain = `http${this.tls ? "s" : ""}://${this.domain}`;
        while (this.full_domain.endsWith("/")) {
            this.full_domain = this.full_domain.slice(0, -1);
        }
        // Set statics.
        this.statics = statics;
        this.statics_aspect_ratios = new Map();
        // Add the default static to statics.
        this.statics.push({
            path: `${__dirname}/../../../frontend/src/static/`,
            endpoint: "/volt_static",
        });
        // Set meta.
        if (!(meta instanceof Meta)) {
            meta = new Meta(meta);
        }
        if (favicon != null && meta.favicon == null) {
            meta.favicon = this.full_domain + "/favicon.ico";
        }
        if (favicon != null && meta.image == null) {
            meta.image = this.full_domain + "/favicon.ico";
        }
        else if (meta.image != null && !meta.image.startsWith("http")) {
            meta.image = this.full_domain + meta.image;
        }
        this.meta = meta;
        // Default headers.
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
            "Permissions-Policy": "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), usb=(), hid=(), serial=(), xr-spatial-tracking=(), display-capture=(), screen-wake-lock=(), sync-xhr=(), publickey-credentials-get=(self), encrypted-media=(self), autoplay=(self 'https://www.youtube-nocookie.com') fullscreen=(self 'https://www.youtube-nocookie.com'), browsing-topics=()",
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
            "upgrade-insecure-requests": "",
        };
        if (default_headers == null) {
            this.csp = default_csp;
            this.default_headers = { ...base_default_headers };
        }
        else {
            if (default_headers["Content-Security-Policy"] != null && typeof default_headers["Content-Security-Policy"] !== "object") {
                throw Error("The Content-Security-Policy of the default headers must be an object with values for each csp key, e.g. \"{'script-src': '...'}\".");
            }
            this.csp = default_headers["Content-Security-Policy"] != null ? default_headers["Content-Security-Policy"] : default_csp;
            Object.keys(base_default_headers).forEach(key => {
                if (default_headers[key] === undefined) {
                    default_headers[key] = base_default_headers[key];
                }
            });
            this.default_headers = default_headers;
        }
        if (!this.tls) {
            // Always drop HSTS if TLS is not active.
            delete this.default_headers["Strict-Transport-Security"];
        }
        // Initialize payments.
        if (payments) {
            if (payments.type === "paddle") {
                this.payments = new Paddle({
                    _server: this,
                    ...payments,
                });
            }
            else {
                throw Error(`Invalid payment processor type "${payments.type}", valid types are ["paddle"].`);
            }
        }
        // Initialize the service daemon.
        // Must be initialized before initializing the database.
        if (daemon !== false) {
            const log_source = this.source.join("daemon");
            if (!log_source.exists()) {
                log_source.mkdir_sync({ recursive: true });
            }
            this.daemon = new vlib.Daemon({
                name: this.domain.replaceAll(".", ""),
                logs: daemon.logs || log_source.join("logs").str(),
                errors: daemon.errors || log_source.join("errors").str(),
                ...daemon,
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
        // Initialize the database class.
        if (typeof database === "string") {
            this.db = new Database({ uri: database, _server: this });
        }
        else {
            this.db = new Database({ ...database, _server: this });
        }
        // Database collections.
        this._keys_db = this.db.collection({
            name: "Volt.Keys",
            indexes: ["id"],
        });
        this._sys_keys_db = this.db.collection({
            name: "Volt.SystemKeys",
            indexes: ["id"],
        });
        this._website_status_db = this.db.collection({
            name: "Volt.WebsiteStatus",
            indexes: ["id"],
        });
        // Initialize the users class.
        this.users = new Users({
            ...users,
            _server: this,
        });
        // The smtp instance.
        if (smtp) {
            this.smtp_sender = smtp.sender;
            this.smtp = nodemailer.createTransport({
                ...smtp,
                ...(smtp.override ?? {}),
            });
        }
        // The rate limit server/client.
        if (rate_limit) {
            if (this.is_primary) {
                this.rate_limit = new RateLimitServer({ ...(rate_limit.server ?? {}), _server: this });
            }
            else {
                if (rate_limit.server?.https) {
                    rate_limit.client.https = true;
                }
                this.rate_limit = new RateLimitClient({ ...(rate_limit.client ?? {}), _server: this });
            }
        }
    }
    // ---------------------------------------------------------
    // Utils.
    /** Get a content type (MIME) from a file extension. */
    get_content_type(extension) {
        return Server.content_type_mimes.get(extension.toLowerCase()) ?? "application/octet-stream";
    }
    /** Set the logging verbosity level. */
    set_log_level(level) {
        this.log.level.set(level);
    }
    // ---------------------------------------------------------
    // Crypto (private).
    /** Generate a cryptographically secure random key as a hex string. */
    generate_crypto_key(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }
    /** Create an HMAC hash using the provided key and data. */
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
    /** Create a hash (no key) of the given data using the specified algorithm. */
    hash(data, algo = "sha256") {
        if (typeof data !== "string") {
            data = JSON.stringify(data);
        }
        return crypto.createHash(algo).update(data).digest('hex');
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
            }
            else {
                stream.set_header("Access-Control-Allow-Origin", "*");
                // Do not send Access-Control-Allow-Credentials with a wildcard origin.
            }
            // Improve preflight reflection for caches and correctness.
            const req_hdrs = stream.headers["access-control-request-headers"];
            if (req_hdrs)
                stream.set_header("Access-Control-Allow-Headers", String(req_hdrs));
            const req_method = stream.headers["access-control-request-method"];
            if (req_method)
                stream.set_header("Access-Control-Allow-Methods", String(req_method));
        }
    }
    _find_endpoint(endpoint, method) {
        let route;
        if (endpoint instanceof Route) {
            route = endpoint;
            endpoint = route.endpoint_str;
            method = route.method;
        }
        method ??= "GET";
        const result = this.endpoints.get(`${method}:${endpoint}`);
        if (!result) {
            if (!route)
                route = new Route(method, endpoint);
            for (const e of this.endpoints.values()) {
                if (e.route.is_regex && e.route.match(route)) {
                    return e;
                }
            }
        }
        return result;
    }
    // Create default endpoints.
    _create_default_endpoints() {
        // Add favicon.
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
                server: this,
            });
        }
        // Create status endpoint.
        const status_dir = this.source.join(".status");
        if (!status_dir.exists()) {
            status_dir.mkdir_sync({ recursive: true });
        }
        const status_key_path = status_dir.join("key");
        let status_key;
        if (!status_key_path.exists()) {
            status_key = this.generate_crypto_key(32);
            status_key_path.save_sync(status_key);
        }
        else {
            status_key = status_key_path.load_sync();
        }
        this.endpoint({
            method: "GET",
            endpoint: "/.status",
            content_type: "application/json",
            params: {
                key: "string",
            },
            callback: async (stream, params) => {
                // Check key.
                if (params.key !== status_key) {
                    return stream.send({
                        status: 403,
                        headers: { "Content-Type": "text/plain" },
                        data: "Access Denied",
                    });
                }
                // Default status info.
                const status = {};
                status.ip = this.ip;
                if (this.http) {
                    status.http_port = this.port;
                }
                if (this.https) {
                    status.https_port = this.https_port;
                }
                // Load data.
                const data = await this._website_status_db.load({ id: "status" }, {
                    default: {
                        id: "status",
                        running_since: undefined,
                        running_threads: 0,
                        total_threads: 0,
                    }
                });
                Object.assign(status, data);
                // Response.
                return stream.send({
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                    data: status,
                });
            },
        });
        // Default static endpoints.
        // const defaults = [
        //     {
        //         method: "GET",
        //         endpoint: "/vhighlight/vhighlight.js",
        //         content_type: "application/javascript",
        //         path: new vlib.Path(vhighlight.web_exports.js),
        //     },
        // ]
        // defaults.forEach((item) => {
        //     this.endpoint(
        //         new Endpoint({
        //             method: item.method,
        //             endpoint: item.endpoint,
        //             content_type: item.content_type,
        //             compress: (item as any).compress,
        //             _static_path: item.path.str(),
        //             _templates: (item as any).templates,
        //             _server: this,
        //         })
        //         ._load_data_by_path(this)
        //     )
        // })
    }
    // Create the sitemap endpoint.
    async _create_sitemap() {
        // Logs.
        this.log(2, "Creating sitemap.");
        let sitemap = "";
        sitemap += "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
        sitemap += "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n";
        for (const endpoint of this.endpoints.values()) {
            if (endpoint.allow_sitemap) {
                if (endpoint.route.is_regex)
                    continue; // skip regex routes
                const ep = encodeURI(endpoint.route.endpoint_str.startsWith("/")
                    ? endpoint.route.endpoint_str
                    : `/${endpoint.route.endpoint_str}`);
                sitemap += `<url>\n   <loc>${this.full_domain}${ep}</loc>\n</url>\n`;
            }
        }
        this.additional_sitemap_endpoints.forEach((endpoint) => {
            while (endpoint.length > 0 && endpoint.charAt(0) === "/") {
                endpoint = endpoint.substr(1);
            }
            sitemap += `<url>\n   <loc>${this.full_domain}/${endpoint}</loc>\n</url>\n`;
        });
        sitemap += "</urlset>\n";
        this.endpoint({
            method: "GET",
            endpoint: "/sitemap.xml",
            data: sitemap,
            content_type: "application/xml",
            _compress: false,
        });
    }
    // Create the robots.txt endpoint.
    async _create_robots_txt() {
        // Logs.
        this.log(2, "Creating robots.txt.");
        // Proceed.
        let robots = "User-agent: *\n";
        let disallowed = 0;
        for (const endpoint of this.endpoints.values()) {
            if (!endpoint.allow_robots) {
                robots += `Disallow: ${endpoint.route.endpoint_str}\n`; // @todo not compatiable with regex endpoints
                disallowed++;
            }
        }
        if (disallowed === 0) {
            robots += `Disallow: \n`;
        }
        robots += `\nSitemap: ${this.full_domain}/sitemap.xml`;
        this.endpoint({
            method: "GET",
            endpoint: "/robots.txt",
            content_type: "text/plain",
            data: robots,
            _compress: false,
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
            callback: async (stream: any, params: {password: string}) => {
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
            callback: async (stream: any, params: {token: string}) => {
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
        // Logs.
        this.log(2, "Initializing static directories.");
        // Static paths for the file watcher.
        const static_paths = [];
        // Add static file.
        const add_static_file = async (path, // vlib.Path type
        endpoint, cache = true) => {
            // Add to static paths.
            static_paths.push(path.str());
            // Get content type.
            const content_type = this.get_content_type(path.extension());
            // console.log("Add static file", endpoint, path.str())
            // Image endpoint with supported transformation.
            if (ImageEndpoint.supported_images.includes(path.extension())) {
                const e = new ImageEndpoint({
                    endpoint,
                    content_type,
                    path,
                    cache,
                    rate_limit: "global",
                    _is_static: true,
                });
                const aspect_ratio = await e.get_aspect_ratio();
                if (aspect_ratio != null) {
                    this.statics_aspect_ratios.set(e.route.endpoint_str, aspect_ratio);
                }
                this.endpoint(e);
            }
            // Default static endpoint.
            else {
                // Create endpoint.
                this.endpoint(new Endpoint({
                    method: "GET",
                    endpoint,
                    content_type,
                    compress: !Server.compressed_extensions.has(path.extension().toLowerCase()),
                    cache,
                    rate_limit: "global",
                    file_path: path,
                    _is_static: true,
                }));
            }
        };
        // Initialize statics.
        const add_static = async (opts) => {
            if (opts == null) {
                return;
            }
            if (typeof opts === "object") {
                // Check object.
                vlib.schema.validate(opts, {
                    unknown: false,
                    throw: true,
                    schema: {
                        path: "string",
                        endpoint: { type: "string", default: null },
                        cache: { type: ["boolean", "number"], default: true },
                        endpoints_cache: { type: "object", default: {} },
                        exclude: { type: "array", default: [] },
                    }
                });
                // Vars.
                const paths = []; // vlib.Path[]
                const source = new vlib.Path(opts.path).abs();
                if (!source.exists()) {
                    this.log(1, `Static path "${source.str()}" does not exist; skipping.`);
                    return;
                }
                const source_len = source.str().length;
                const is_dir = source.is_dir();
                // Is excluded.
                const exclude = [/\.DS_Store$/, /\.cache(?:\/|$)/, /\.old(?:\/|$)/, /\.ignore$/, ...(opts.exclude || [])];
                const is_excluded = (p) => {
                    const s = typeof p === "string" ? p : p.str();
                    return exclude.some(pattern => pattern instanceof RegExp ? pattern.test(s) : s === String(pattern));
                };
                // Initialize endpoint.
                opts.endpoint = opts.endpoint || `/${source.full_name()}`;
                if (opts.endpoint.charAt(0) != "/") {
                    opts.endpoint = "/" + opts.endpoint;
                }
                while (opts.endpoint.charAt(opts.endpoint.length - 1) == "/") {
                    opts.endpoint = opts.endpoint.slice(0, -1);
                }
                // Not a directory.
                if (!is_dir) {
                    return await add_static_file(source, opts.endpoint, opts.cache);
                }
                // First extract all paths recursively.
                // non recursive to ignore .old etc dirs.
                const read_dir = async (path) => {
                    const dir_paths = await path.paths();
                    const promises = [];
                    for (let i = 0; i < dir_paths.length; i++) {
                        if (!is_excluded(dir_paths[i])) {
                            // @todo excluded does not work `.old` etc is still included and DS_Store.
                            if (dir_paths[i].is_dir()) {
                                promises.push(read_dir(dir_paths[i]));
                            }
                            else {
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
                // Convert paths into a static object.
                for (const path of paths) {
                    const endpoint = `${opts.endpoint}${path.str().substr(source_len)}`;
                    await add_static_file(path, endpoint, opts.endpoints_cache === undefined ? opts.cache : opts.endpoints_cache[endpoint] ?? opts.cache);
                }
            }
            else if (typeof opts === "string") {
                await add_static({ path: opts });
            }
        };
        // Iterate.
        for (let i = 0; i < this.statics.length; i++) {
            if (this.statics[i] instanceof vlib.Path) {
                this.statics[i] = this.statics[i].str();
            }
            await add_static(this.statics[i]);
        }
        // Response.
        return static_paths;
    }
    // ---------------------------------------------------------
    // Server (private).
    // Initialize.
    // Initialize.
    async initialize() {
        // Logs.
        this.log(1, "Initializing server.");
        /* @performance */ this.performance.start();
        // Create HTTPS server.
        if (this.tls) {
            this.https = http2.createSecureServer({
                key: new vlib.Path(this.tls.key).load_sync({ encoding: 'utf8' }),
                cert: new vlib.Path(this.tls.cert).load_sync({ encoding: 'utf8' }),
                ca: this.tls.ca == null ? undefined : new vlib.Path(this.tls.ca).load_sync({ encoding: 'utf8' }),
                passphrase: this.tls.passphrase,
                allowHTTP1: true,
            });
            this.https.on('stream', (stream, headers) => {
                this._serve(stream, headers, undefined, undefined);
            });
            this.https.on('request', (req, res) => {
                this._serve(undefined, undefined, req, res);
            });
        }
        // Payments require HTTPS in production.
        else if (this.production && this.payments) {
            throw Error("Accepting payments in production mode requires HTTPS.");
        }
        // Create http server.
        if (this.tls) {
            // Redirect HTTP requests to HTTPS.
            this.http = http.createServer((request, response) => {
                const reqUrl = typeof request.url === "string" ? request.url : "/";
                // Build redirect using the canonical configured domain, not the untrusted Host header.
                const location = `https://${this.domain}${reqUrl}`;
                // 308 preserves method and body; safe for non-GET as well.
                response.writeHead(308, { Location: location });
                response.end();
            });
        }
        else {
            // Serve http.
            this.http = http.createServer((req, res) => {
                this._serve(undefined, undefined, req, res);
            });
        }
        /* @performance */ this.performance.end("create-http-server");
        // Start the database.
        if (this.db) {
            await this.db.initialize();
            /* @performance */ this.performance.end("init-db");
            // Load system keys.
            const sys_keys = await this._sys_keys_db.load({ id: "sys_keys" }, {
                default: {
                    id: "sys_keys",
                    master_hmac_key: undefined,
                    rate_limit_api_key: undefined,
                }
            });
            let perform_sys_keys_save = false;
            // Check master hash key.
            if (sys_keys.master_hmac_key == null) {
                this.master_hmac_key = this.generate_crypto_key(32);
                sys_keys.master_hmac_key = this.master_hmac_key;
                perform_sys_keys_save = true;
            }
            else {
                this.master_hmac_key = sys_keys.master_hmac_key;
            }
            // Check rate limit api key.
            if (sys_keys.rate_limit_api_key == null) {
                this.rate_limit_api_key = this.generate_crypto_key(32);
                sys_keys.rate_limit_api_key = this.rate_limit_api_key;
                perform_sys_keys_save = true;
            }
            else {
                this.rate_limit_api_key = sys_keys.rate_limit_api_key;
            }
            // Save.
            if (perform_sys_keys_save) {
                await this._sys_keys_db.set({ id: "sys_keys" }, sys_keys);
            }
            // Check user defined crypto keys.
            // const gen_user_crypto_key = (key: string | { name: string, length: number }) => {
            //     if (typeof key === "string") {
            //         sys_keys.keys[key] = this.generate_crypto_key(32);
            //     } else {
            //         if (key.length == null) {
            //             throw Error(`Crypto key object "${JSON.stringify(key)}" does not contain a "length" attribute.`);
            //         }
            //         if (typeof key.length !== "number") {
            //             throw Error(`Crypto key object "${JSON.stringify(key)}" has an invalid type fo attribute "length", the valid type is "number".`);
            //         }
            //         if (key.name == null) {
            //             throw Error(`Crypto key object "${JSON.stringify(key)}" does not contain a "name" attribute.`);
            //         }
            //         if (typeof key.name !== "string") {
            //             throw Error(`Crypto key object "${JSON.stringify(key)}" has an invalid type fo attribute "name", the valid type is "string".`);
            //         }
            //         const generated_key = this.generate_crypto_key(key.length);
            //         sys_keys.keys[key.name] = generated_key;
            //         this.keys[key.name] = generated_key;
            //     }
            // }
            const user_keys = await this._keys_db.load({ id: "user_keys" }, {
                default: {
                    id: "user_keys",
                    keys: {},
                }
            });
            let perform_user_keys_save = false;
            for (const key of this._user_keys_opts) {
                const name = typeof key === "string" ? key : key.name;
                if (user_keys[name]) {
                    this.keys[name] = user_keys[name];
                }
                else {
                    perform_user_keys_save = true;
                    if (typeof key === "string") {
                        if (!key) {
                            throw Error(`Crypto key "${key}" is an invalid key name.`);
                        }
                        const generated_key = this.generate_crypto_key(32);
                        user_keys.keys[key] = generated_key;
                        this.keys[key] = generated_key;
                    }
                    else {
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
            /* @performance */ this.performance.end("load-keys");
        }
        // Initialize default headers.
        this._init_default_headers();
        /* @performance */ this.performance.end("init-default-headers");
        // Create default endpoints.
        this._create_default_endpoints();
        /* @performance */ this.performance.end("create-default-endpoints");
        // Create admin endpoints.
        // this._create_admin_endpoint();
        // /* @performance */ this.performance.end("create-admin-endpoints");
        // Create static endpoints.
        const promises = [];
        promises.push(this._initialize_statics());
        // /* @performance */ this.performance.end("create-static-endpoints");
        // Initialize users.
        if (this.db) {
            promises.push(this.users._initialize());
            // /* @performance */ this.performance.end("init-users");
        }
        // Database preview endpoints (only when production mode is disabled).
        // if (this.db) {
        //     this.db._initialize_db_preview();
        //     /* @performance */ this.performance.end("init-db-preview");
        // }
        // Payments.
        if (this.payments !== undefined) {
            promises.push(this.payments._initialize());
        }
        // /* @performance */ this.performance.end("init-payments");
        // Create sitemap when it does not exist.
        // Must be done at the end of initialization func since some funcs might still create endpoints.
        if (this._find_endpoint("/sitemap.xml") == null) {
            promises.push(this._create_sitemap());
        }
        // /* @performance */ this.performance.end("create-sitemap");
        // Create robots.txt when it does not exist.
        // Must be done at the end of initialization func since some funcs might still create endpoints.
        if (this._find_endpoint("/robots.txt") == null) {
            promises.push(this._create_robots_txt());
        }
        // /* @performance */ this.performance.end("create-robots.txt");
        // Await all promises.
        await Promise.all(promises);
        // Get the icon and stroke icon file paths when defined.
        if (this.company.stroke_icon || this.company.icon) {
            for (const endpoint of this.endpoints.values()) {
                if (this.company.stroke_icon_path == null && endpoint.route.endpoint === this.company.stroke_icon) {
                    this.company.stroke_icon_path = endpoint.file_path?.str() || undefined;
                }
                if (this.company.icon_path == null && endpoint.route.endpoint === this.company.icon) {
                    this.company.icon_path = endpoint.file_path?.str() || undefined;
                }
            }
            if (this.company.stroke_icon != null && this.company.stroke_icon_path == null) {
                throw Error(`Unable to find the company's stroke icon endpoint "${this.company.stroke_icon}".`);
            }
            if (this.company.icon != null && this.company.icon_path == null) {
                throw Error(`Unable to find the company's icon endpoint "${this.company.icon}".`);
            }
        }
        // Initialize all endpoints.
        for (const endpoint of this.endpoints.values()) {
            endpoint._initialize(this);
        }
        for (const endpoint of this.err_endpoints.values()) {
            endpoint._initialize(this);
        }
        // On initialize callbacks.
        for (const callback of this._on_initialize) {
            const res = callback();
            if (res instanceof Promise) {
                await res;
            }
        }
    }
    /**
     * Add callback to be called when the server is initialized.
     * @param callback The callback to be called when the server is initialized.
     */
    on_initialize(callback) {
        this._on_initialize.push(callback);
    }
    // Serve a client.
    // @todo implement rate limiting.
    // @todo save internal server errors.
    async _serve(http2_stream, headers, req, res) {
        try {
            // Convert stream.
            const stream = new Stream(http2_stream, headers, req, res);
            // Vars.
            let endpoint;
            let method;
            let endpoint_url;
            // Log endpoint result.
            const log_endpoint_result = (message, status) => {
                let log_level = endpoint && endpoint.is_static ? 3 : 0;
                if (status == null) {
                    status = stream.status_code;
                }
                this.log(log_level, `${method}:${endpoint_url}: ${message ? message : Status.get_description(status ?? "unknown")} [${status}] (${stream.ip}).`);
            };
            // Serve error endpoint.
            const serve_error_endpoint = async (status_code) => {
                // Get default response.
                const is_api_endpoint = endpoint && endpoint.callback != null;
                let default_response;
                switch (status_code) {
                    case 400:
                        default_response = {
                            status: 400,
                            headers: { "Content-Type": is_api_endpoint ? "application/json" : "text/plain" },
                            data: is_api_endpoint ? { error: "Bad Request" } : "Bad Request",
                        };
                        break;
                    case 403:
                        default_response = {
                            status: 403,
                            headers: { "Content-Type": is_api_endpoint ? "application/json" : "text/plain" },
                            data: is_api_endpoint ? { error: "Access Denied" } : "Access Denied",
                        };
                        break;
                    case 404:
                        default_response = {
                            status: 404,
                            headers: { "Content-Type": is_api_endpoint ? "application/json" : "text/plain" },
                            data: is_api_endpoint ? { error: "Not Found" } : "Not Found",
                        };
                        break;
                    case 500:
                    default:
                        default_response = {
                            status: 500,
                            headers: { "Content-Type": is_api_endpoint ? "application/json" : "text/plain" },
                            data: is_api_endpoint ? { error: "Internal Server Error" } : "Internal Server Error",
                        };
                        break;
                }
                // Serve error endpoint or default response.
                if (!this.err_endpoints.has(status_code)) {
                    stream.send(default_response);
                }
                else {
                    const err_endpoint = this.err_endpoints.get(status_code);
                    if (err_endpoint) {
                        try {
                            await err_endpoint._serve(stream, status_code);
                        }
                        catch (err) {
                            this.log.error(`Error endpoint ${status_code}: `, err);
                            stream.send(default_response);
                        }
                    }
                    // @todo also serve something here.
                }
            };
            // Check ip against blacklist.
            // if (!this.offline && this.blacklist !== undefined && !this.blacklist.verify(stream.ip)) {
            //     await serve_error_endpoint(403);
            //     this.log_endpoint_result();
            //     return;
            // }
            // Check if the request matches any of the defined endpoints.
            method = stream.method;
            endpoint_url = stream.endpoint;
            // endpoint = this._find_endpoint(endpoint_url, method);
            // Find endpoint manually so the optional path params can be extracted.
            this.log(3, "Searching for endpoint: ", `${method}:${endpoint_url}`);
            endpoint = this.endpoints.get(`${method}:${endpoint_url}`);
            if (!endpoint) {
                // Check regex endpoints.
                const route = new Route(method, endpoint_url);
                for (const e of this.endpoints.values()) {
                    if (e.route.is_regex) {
                        const matched_params = e.route.match(route);
                        if (matched_params !== false) {
                            this.log(3, "Matched regex route: ", e.route.id);
                            endpoint = e;
                            // insert path params into the stream when not already defined.
                            Object.keys(matched_params).walk((k) => {
                                if (stream.params[k] == null) {
                                    stream.params[k] = matched_params[k];
                                }
                            });
                            break;
                        }
                    }
                }
            }
            else {
                this.log(3, "Matched route: ", endpoint.route.id);
            }
            // No endpoint found.
            if (!endpoint) {
                // Check OPTIONS request.
                if (method === "OPTIONS") {
                    const original_method = stream.headers['access-control-request-method'];
                    const original_endpoint = this._find_endpoint(endpoint_url, original_method);
                    if (original_endpoint) {
                        // Set headers.
                        this._set_header_defaults(stream);
                        original_endpoint._set_headers(stream);
                        // Send.
                        stream.send({ status: Status.no_content });
                        log_endpoint_result();
                        return;
                    }
                }
                // Respond with 404.
                await serve_error_endpoint(404);
                log_endpoint_result();
                return;
            }
            // ------------------------------------------
            // Header & options
            // Set all headers so we can send options.
            // Set default headers.
            this._set_header_defaults(stream);
            // Serve options request.
            if (method === "OPTIONS") {
                try {
                    await endpoint._serve_options(stream);
                }
                catch (err) {
                    this.log.error(`${method}:${endpoint_url}: `, err);
                    if (!stream.destroyed && !stream.closed) {
                        await serve_error_endpoint(500);
                        log_endpoint_result();
                    }
                    return;
                }
                log_endpoint_result();
                return;
            }
            // Check rate limit.
            if (!this.offline && this.production && this.rate_limit !== undefined && endpoint.rate_limit_groups.length > 0) {
                const result = await this.rate_limit.limit(stream.ip, endpoint.rate_limit_groups);
                if (result != null) {
                    stream.send({
                        status: 429,
                        headers: {
                            "Content-Type": "text/plain",
                            "X-RateLimit-Reset": result,
                        },
                        data: `Rate limit exceeded, please try again in ${Math.floor((result - Date.now()) / 1000)} seconds.`,
                    });
                    log_endpoint_result();
                    return;
                }
            }
            // Parse the request parameters.
            try {
                await stream.join();
            }
            catch (err) {
                this.log.error(`${method}:${endpoint_url}: `, err);
                await serve_error_endpoint(500);
                log_endpoint_result();
                return;
            }
            try {
                stream._parse_params();
            }
            catch (err) {
                this.log.error(`${method}:${endpoint_url}: `, err);
                await serve_error_endpoint(400);
                log_endpoint_result();
                return;
            }
            // Do not authenticate on static endpoints, unless "authenticated" flag is somehow enabled.
            if (!endpoint.is_static || endpoint.authenticated) {
                // Always perform authentication so the stream.uid will also be assigned even when the endpoint is not authenticated.
                const auth_result = await this.users._authenticate(stream);
                // Reset cookies when authentication has failed.
                if (auth_result != null && !endpoint.is_static) {
                    this.users._reset_cookies(stream);
                }
                // When the endpoint is authenticated and the authentication has failed then send the error response.
                if (auth_result != null && endpoint.authenticated) {
                    stream.send(auth_result);
                    log_endpoint_result();
                    return;
                }
            }
            // Serve endpoint.
            try {
                await endpoint._serve(stream);
            }
            catch (err) {
                this.log.error(`${method}:${endpoint_url}: `, err);
                if (!stream.destroyed && !stream.closed) {
                    await serve_error_endpoint(500);
                    log_endpoint_result();
                }
                return;
            }
            // Check if the response has been sent.
            if (!stream.finished) {
                this.log.error(`${method}:${endpoint_url}: `, "Unfinished response.");
                await serve_error_endpoint(500);
                log_endpoint_result();
                return;
            }
            // Log.
            log_endpoint_result();
        }
        catch (err) {
            this.log.error("Fatal error:", err);
        }
    }
    // ---------------------------------------------------------
    // Server.
    // Start the server.
    /**
     * Start the server.
     * @example
     * ...
     * server.start();
     */
    async start() {
        // Always initialize, even when forking.
        await this.initialize();
        // On production bundle all view endpoints.
        if (this.production) {
            for (const endpoint of this.endpoints.values()) {
                if (endpoint.view) {
                    await endpoint.view.ensure_bundle();
                }
            }
        }
        // Start the rate limiting client/server, also when forking.
        if (this.db && this.rate_limit) {
            /* @performance */ this.performance.start();
            await this.rate_limit.start();
            /* @performance */ this.performance.end("init-rate-limit");
        }
        // Production & Master.
        let forked = false;
        if (this.production && this.threading.enabled && libcluster.isPrimary && this.threading.threads > 1) {
            this.log(0, `Starting ${this.threading.threads} threads.`);
            // Vars.
            let active_threads = 0;
            const thread_ids = {};
            const restart_limiters = {};
            // Start thread.
            const start_thread = (thread_id, restart = false) => {
                // Fork.
                const worker = libcluster.fork();
                // Log.
                this.log(restart ? 0 : 1, `Starting thread ${worker.process.pid}.`);
                // Cache thread id.
                thread_ids[worker.process.pid] = thread_id;
                // Increment active threads.
                ++active_threads;
            };
            // Fork workers.
            for (let i = 0; i < this.threading.threads; i++) {
                // Generate thread id.
                let thread_id;
                while ((thread_id = vlib.String.random(8)) && Object.values(thread_ids).includes(thread_id)) { }
                // Create limiter.
                restart_limiters[thread_id] = new vlib.TimeLimiter({ limit: 3, duration: 60 * 1000 });
                // Start thread.
                start_thread(thread_id);
            }
            // Save status.
            await this._website_status_db.set({ id: "status" }, {
                running_since: Date.now(),
                total_threads: active_threads,
                running_threads: active_threads,
            });
            // On exit.
            libcluster.addListener('exit', async (worker, code, signal) => {
                // Fetch thread id.
                const thread_id = thread_ids[worker.process.pid];
                delete thread_ids[worker.process.pid];
                // Logs.
                this.log.error(`Thread ${worker.process.pid} crashed.`);
                // Restart with limit.
                const limiter = restart_limiters[thread_id];
                if (limiter != null && limiter.limit()) {
                    --active_threads;
                    start_thread(thread_id, true);
                }
                // Reached limit, shutdown thread.
                else {
                    this.log.error(`Thread ${worker.process.pid} is being shut down due to its periodic restart limit.`);
                    --active_threads;
                    await this._website_status_db.save({ id: "status" }, { $inc: { running_threads: -1 } });
                    if (active_threads === 0) {
                        this.log.error(`All threads died, stopping server.`);
                        process.exit(0);
                    }
                }
            });
        }
        else {
            forked = this.production && this.threading.enabled;
            // Load worker class modules.
            // if (libcluster.isWorker) {
            //     const worker = new WorkerClass();
            //     worker.start();
            // }
            // Callbacks.
            let is_running = false;
            const on_running = () => {
                if (!is_running) {
                    is_running = true;
                    if (this.https !== undefined) {
                        this.log(0, `Running on http://${this.ip}:${this.port} and https://${this.ip}:${this.https_port}.`);
                    }
                    else {
                        this.log(0, `Running on http://${this.ip}:${this.port}.`);
                    }
                }
            };
            const on_error = (error) => {
                if (error.syscall !== 'listen') {
                    throw error;
                }
                switch (error.code) {
                    case 'EACCES':
                        console.error(`Error: Address ${this.ip}:${this.port} requires elevated privileges.`);
                        process.exit(1);
                        break;
                    case 'EADDRINUSE':
                        console.error(`Error: Address ${this.ip}:${this.port} is already in use.`);
                        process.exit(1);
                        break;
                    default:
                        throw error;
                }
            };
            // Listen.
            this.http.listen(this.port, this.ip === "*" ? undefined : this.ip, on_running);
            this.http.on("error", on_error);
            if (this.https !== undefined) {
                this.https.listen(this.https_port, this.ip === "*" ? undefined : this.ip, on_running);
                this.https.on("error", on_error);
            }
            // Set signals.
            let graceful_shutdown_shutting_down = false;
            const graceful_shutdown = async () => {
                if (graceful_shutdown_shutting_down)
                    return;
                graceful_shutdown_shutting_down = true;
                try {
                    await this.stop();
                }
                catch (e) {
                    this.log.error("Shutdown error:", e);
                }
                finally {
                    process.exit(0);
                }
            };
            process.on('SIGTERM', graceful_shutdown);
            process.on('SIGINT', graceful_shutdown);
            // Send running message.
            if (process.env.VOLT_FILE_WATCHER === "1") {
                new vlib.Path(process.env.VOLT_STARTED_FILE).save_sync("1");
            }
            // Start browser.
            // if (this.browser_preview) {
            //     await this.browser_preview.start();
            //     await this.browser_preview.navigate(this.full_domain);
            // }
            /* @performance */ this.performance.end("listen");
        }
        // On start callbacks.
        for (const callback of this._on_start) {
            const res = callback({ forked });
            if (res instanceof Promise) {
                await res;
            }
        }
        // Start browser preview on primary node.
        // if (this.browser_preview && !forked) {
        //     await this.browser_preview.start();
        //     await this.browser_preview.navigate(this.full_domain);
        // }
        /* @performance */
        debug(2, () => this.performance.dump(v => v >= 50));
    }
    /**
     * Add an (async) callback executed at the end of `server.start()`. The callback may take arguments `({forked <boolean>})`.
     * @param callback The callback to run; receives `{ forked }`.
     * @example
     * ...
     * server.on_start(({forked}) => console.log("Hello World!"));
     */
    on_start(callback) {
        this._on_start.push(callback);
    }
    // Stop the server.
    /**
     * Stop the server.
     * @example
     * ...
     * server.stop();
     */
    async stop() {
        this.log(0, "Stopping the server...");
        // On stop callbacks.
        for (const callback of this._on_stop) {
            const res = callback();
            if (res instanceof Promise) {
                await res;
            }
        }
        // Stop rate limit.
        if (this.rate_limit) {
            await this.rate_limit.stop();
        }
        // Stop sockets.
        if (this.https)
            this.https.close();
        if (this.http)
            this.http.close();
        if (this.db)
            await this.db.close();
        // Stop the logger.
        this.log.stop();
        // setTimeout(() => {
        //     thread_monitor.dump_active_resources({
        //         // min_age: 5000,
        //         // exclude_types: ['TIMERWRAP'],
        //         include_internal: false
        //     });
        // }, 6000);
    }
    /**
     * Set an (async) callback which will be executed at the start of `server.stop()`.
     * @param callback The callback to run.
     * @example
     * ...
     * server.on_stop(() => console.log("Hello World!"));
     */
    on_stop(callback) {
        this._on_stop.push(callback);
    }
    // Fetch status.
    /**
     * This function is meant to be used when the server is in production mode, it will make an API request to your server through the defined `Server.domain` parameter.
     * @note This function can be called without initializing the server.
     * @param type The wanted output type. Either an `object` or a `string` type for CLI purposes.
     */
    async fetch_status(type = "object") {
        // Load key.
        const key_path = this.source.join(".status/key");
        if (!key_path.exists()) {
            throw new Error("No status key has been generated yet. Start your server first.");
        }
        const key = key_path.load_sync();
        // Make request.
        const { body: status } = await vlib.request({
            host: this.domain,
            endpoint: "/.status",
            method: "GET",
            params: { key },
            query: true,
            json: true,
        });
        // String type.
        if (type === "string") {
            if (status.running_since != null) {
                status.running_since = new vlib.Date(status.running_since).format("%d-%m-%y %H:%M:%S");
            }
            let str = `${this.domain}:\n`;
            Object.keys(status).forEach((key) => {
                str += ` * ${key}: ${status[key]}\n`;
            });
            str = str.substr(0, str.length - 1);
            return str;
        }
        // Response.
        return status;
    }
    // ---------------------------------------------------------
    // Content Security Policy.
    // Add a csp.
    /**
     * Add an url to the Content-Security-Policy. This function does not overwrite the existing key's value.
     * @warning This function no longer has any effect when `Server.start()` has been called.
     * @param key The Content-Security-Policy key, e.g. `script-src`.
     * @param value The value to add to the Content-Security-Policy key.
     * @example
     * ...
     * server.add_csp("script-src", "somewebsite.com");
     * server.add_csp("upgrade-insecure-requests");
     */
    add_csp(key, value = null) {
        if (this.csp[key] === undefined) {
            this.csp[key] = "";
        }
        if (Array.isArray(value)) {
            value.forEach((v) => {
                if (typeof v === "string" && v.length > 0) {
                    this.csp[key] += " " + v.trim();
                }
            });
        }
        else if (typeof value === "string" && value.length > 0) {
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
     */
    remove_csp(key, value = null) {
        if (this.csp[key] === undefined) {
            return;
        }
        if (typeof value === "string" && value.length > 0) {
            this.csp[key] = this.csp[key].replaceAll(value, "");
        }
        else {
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
     */
    del_csp(key) {
        delete this.csp[key];
    }
    // ---------------------------------------------------------
    // TLS.
    // Generate a key and csr for tls.
    async generate_ssl_key({ output_path, ec = true, }) {
        // Args.
        if (output_path == null) {
            throw Error("Define parameter \"path\".");
        }
        // Paths.
        const key = new vlib.Path(output_path);
        if (key.exists()) {
            throw Error(`Key path "${key.str()}" already exists, remove the file manually to continue.`);
        }
        // Generate the private key using the EC parameters file
        const proc = new vlib.Proc();
        await proc.start({
            command: "openssl",
            args: ec
                ? ["ecparam", "-genkey", "-name", "secp384r1", "-out", key.str()]
                : ["genpkey", "-algorithm", "RSA", "-pkeyopt", "rsa_keygen_bits:2048", "-out", key.str()],
            opts: { stdio: "inherit" },
        });
        if (proc.exit_status != 0) {
            throw Error(`Encountered an error while generating the private key [${proc.exit_status}]: ${proc.err}`);
        }
    }
    // Generate a csr for tls.
    async generate_csr({ output_path, key_path, name, domain, organization_unit, country_code, province, city, }) {
        // Args.
        if (key_path == null) {
            throw Error("Define parameter \"key_path\".");
        }
        if (organization_unit == null) {
            throw Error("Define parameter \"organization_unit\".");
        }
        // Paths.
        const key = new vlib.Path(key_path);
        if (!key.exists()) {
            throw Error(`Key path "${key.str()}" does not exist.`);
        }
        const csr = new vlib.Path(output_path);
        if (csr.exists()) {
            throw Error(`CSR path "${csr.str()}" already exists, remove the file manually to continue.`);
        }
        // Generate the CSR using the generated private key
        const proc = new vlib.Proc();
        await proc.start({
            command: "openssl",
            args: [
                "req", "-new", "-key", key.str(), "-out", csr.str(),
                "-subj",
                `/C=${country_code}/ST=${province}/L=${city}/O=${name}/OU=${organization_unit}/CN=${domain}`
            ],
            opts: { stdio: "inherit" },
        });
        if (proc.exit_status != 0) {
            throw Error(`Encountered an error while generating the CSR [${proc.exit_status}]: ${proc.err}`);
        }
        this.log(0, `Generated the tls key with CSR for domain "${this.domain}".`);
    }
    // ---------------------------------------------------------
    // Endpoints.
    // private registered_routes: Map<string, Array<string | RegExp>> = new Map();
    /**
     * Checks if an endpoint route already exists.
     * @param method    HTTP method
     * @param endpoint  String path or RegExp
     */
    _check_duplicate_route(route) {
        const e = this._find_endpoint(route);
        if (e) {
            throw new Error(`Duplicate "${route.method}:${route.endpoint_str}" endpoint route, it is already defined by endpoint "${e.id}".`);
        }
    }
    /**
     * Add a single endpoint.
     * Only supports a single endpoint due to parameter inference.
     * @template Response User inputted response type that will be returned as response, optionaly typing used for consistency.
     * @template S system template for inferring the endpoint callback parameters.
     * @param endpoint The endpoint or endpoint options to add.
     * @returns A registered endpoint object that can for instance be used to infer the endpoint parameters.
     */
    endpoint(endpoint) {
        const e = endpoint instanceof Endpoint ? endpoint : new Endpoint(endpoint);
        this._check_duplicate_route(e.route);
        this.endpoints.set(e.route.id, e);
        return {
            params: undefined,
            Params: undefined,
        };
    }
    // Add an error endpoint.
    /**
     *  Add an endpoint per error status code.
     * @param status_code
     *      The status code of the error.
     *
     *      The supported status codes are:
     *      * `404`
     *      * `400` (Will not be used when the endpoint uses an API callback).
     *      * `403`
     *      * `404`
     *      * `500`
     * @param endpoint The error endpoint or error endpoint options
    */
    error_endpoint(status_code, endpoint) {
        const e = endpoint instanceof Endpoint ? endpoint : new Endpoint(endpoint);
        this._check_duplicate_route(e.route);
        this.err_endpoints.set(status_code, e);
        return this;
    }
    // ---------------------------------------------------------
    // Functions.
    // Send a mail.
    /**
     * Send one or multiple mails.
     * @note Make sure the domain's DNS records SPF and DKIM are properly configured when sending attachments.
     * @returns Returns a promise that will be resolved or rejected when the mail has been sent.
     * @param sender The sender address. Either a string email (e.g. `your@email.com`) or `[name, email]`.
     * @param recipients The recipient addresses. Each item is either a string email or `[name, email]`.
     * @param subject The subject text.
     * @param body The body text or a `MailElement` instance.
     * @param attachments An array with absolute file paths for attachments, or an array with nodemailer attachment objects.
     * @example
     * ...
     * await server.send_mail({
     *   sender: ["Sender Name", "sender@email.com"],
     *   recipients: [
     *     ["Recipient Name", "recipient1@email.com"],
     *     "recipient2@email.com",
     *   ],
     *   subject: "Example Mail",
     *   body: "Hello World!",
     *   attachments: ["/path/to/image.png"]
     * });
     */
    async send_mail({ sender = undefined, recipients = [], subject = undefined, body = "", attachments = [], }) {
        // Not enabled.
        if (this.smtp === undefined) {
            throw new Error("SMTP is not enabled, define the required server argument on initialization to enable smtp.");
        }
        // Convert MailElement to html.
        if (body instanceof Mail.MailElement) {
            body = body.html();
        }
        // Check args.
        if (sender == null && this.smtp_sender != null) {
            sender = this.smtp_sender;
        }
        if (recipients.length === 0) {
            throw new Error(`The mail has no recipients.`);
        }
        if (sender == null) {
            throw new Error(`Parameter "sender" should be a defined value of type "string" or "array".`);
        }
        // Format address wrapper.
        const format_address = (address) => {
            if (Array.isArray(address)) {
                return `${address[0]} <${address[1]}>`;
            }
            return address;
        };
        // Create to array.
        const to = [];
        recipients.forEach((address) => to.push(format_address(address)));
        // Create attachments array.
        let attached_files = [];
        if (attachments != null) {
            attachments.forEach((path) => {
                if (path instanceof vlib.Path) {
                    attached_files.push({
                        filename: path.full_name(),
                        path: path.str(),
                        content: path.load_sync(),
                    });
                }
                else if (typeof path === "string") {
                    const p = new vlib.Path(path);
                    attached_files.push({
                        filename: p.full_name(),
                        path: path,
                        content: p.load_sync(),
                    });
                }
                else {
                    attached_files.push(path);
                }
            });
        }
        // Send mail.
        try {
            await this.smtp.sendMail({
                from: format_address(sender),
                to: to,
                subject: subject,
                html: body,
                attachments: attached_files,
            });
        }
        catch (error) {
            throw new Error(error.message); // to keep readable stacktrace.
        }
    }
    // ---------------------------------------------------------
    // Default callbacks.
    // These can all be overwritten by the user.
    // @todo add scheme for payment params.
    // On delete user.
    /**
     * This function can be overridden with a callback for when a user is deleted.
     * @param uid The uid of the deleted user.
     * @example
     * ...
     * server.on_delete_user = ({uid}) => {}
     */
    async on_delete_user({ uid }) { }
    /** Called for each product in a successful one-time payment. Override to implement your logic. */
    async on_payment({ product, payment }) { }
    /** Called for each product in a successful subscription. Override to implement your logic. */
    async on_subscription({ product, payment }) { }
    // On failed one-time or recurring payment.
    // async on_failed_payment({ payment }: { payment: any }): Promise<void> {}
    /** Called when a cancellation succeeds. Override to implement your logic. */
    async on_cancellation({ payment, line_items }) { }
    // On failed cancellation.
    // async on_failed_cancellation({ payment, line_items }: { payment: any; line_items: any[] }): Promise<void> {}
    /** Called when a refund succeeds. The line items array are the items that were refunded. */
    async on_refund({ payment, line_items }) { }
    /** Called when a refund fails. The line items array are the items where the refund failed. */
    async on_failed_refund({ payment, line_items }) { }
    /** Called when a chargeback occurs. The line items array are the items that were charged back. */
    async on_chargeback({ payment, line_items }) { }
    /** Called when a chargeback fails. The line items array are the items where the chargeback failed. */
    async on_failed_chargeback({ payment, line_items }) { }
    // Mail template.
    /** Build the base email layout used by the various transactional email builders. */
    _mail_template({ max_width = 400, children = [], }) {
        const style = this.mail_style;
        const { Title, Text, Image, Table, TableRow, TableData, VStack } = Mail;
        // Create header.
        let header;
        if (this.company.stroke_icon != null) {
            header = [
                Image(`${this.full_domain}${this.company.stroke_icon ?? ""}`).height(16),
            ];
        }
        else if (this.company.icon != null) {
            header = [
                Image(`${this.full_domain}${this.company.icon ?? ""}`).frame(20, 40),
            ];
        }
        if (header) {
            header = Table(TableRow(...header)
                .wrap(true)
                .center()
                .center_vertical()).margin_bottom(15);
        }
        // Create mail.
        return Mail.Mail(Table(TableData(Table(
        // Header.
        header, 
        // Widget.
        Table(...children)
            .background_color(style.widget_bg ?? "")
            .border(`1px solid ${style.widget_border ?? ""}`)
            .border_radius("10px")
            .padding(40, 25, 25, 25)
            .margin(0), 
        // Copyright.
        Table(TableRow(Text(`Copyright © ${new Date().getFullYear()} ${this.company.name}, ${this.company.legal_name} All Rights Included.\n` +
            `${this.company.street} ${this.company.house_number}, ${this.company.postal_code}, ${this.company.city}, ${this.company.province}, ${this.company.country}.\n` +
            (this.company.tax_id == null ? "" : `VAT ID ${this.company.tax_id}`))
            .white_space("pre")
            .display("inline-block")
            .font_size(11)
            .color(style.footer_fg)
            .margin(0)).center().center_vertical()).margin(0, 0, 10, 0)).max_width(max_width)).center()).padding(25, 20, 25, 20)).font_family(style.font).background(style.bg);
    }
    // Render payment line items.
    /** Helper that renders a list of payment line items for use in transactional emails. */
    _render_mail_payment_line_items({ payment, line_items, show_total_due = false }) {
        if (!this.payments)
            throw new Error("Payments not initialized");
        // Shortcuts.
        const style = this.mail_style;
        const { Title, Text, Image, Table, TableRow, TableData, VStack } = Mail;
        // Render payment line item for a mail.
        const _render_mail_payment_line_item = ({ name, desc, unit_cost, quantity, total_cost, font_weight = "normal", divider = true, color = style.text_fg, }) => {
            return [
                Table(TableRow(TableData(Text(name)
                    .color(color)
                    .font_size(14)
                    .text_wrap("wrap")
                    .overflow_wrap("break-word")
                    .word_wrap("break-word")
                    .font_weight(font_weight)).width("25%").margin_right(10), TableData(Text(desc)
                    .color(color)
                    .font_size(14)
                    .text_wrap("wrap")
                    .overflow_wrap("break-word")
                    .word_wrap("break-word")
                    .font_weight(font_weight)).width("35%").margin_right(10), TableData(Text(unit_cost)
                    .color(color)
                    .font_size(14)
                    .text_wrap("wrap")
                    .overflow_wrap("break-word")
                    .word_wrap("break-word")
                    .font_weight(font_weight)).fixed_width("13.32%").margin_right(10), TableData(Text(quantity)
                    .color(color)
                    .font_size(14)
                    .text_wrap("wrap")
                    .overflow_wrap("break-word")
                    .word_wrap("break-word")
                    .font_weight(font_weight)).fixed_width("13.32%").margin_right(10), TableData(Text(total_cost)
                    .color(color)
                    .font_size(14)
                    .text_wrap("wrap")
                    .overflow_wrap("break-word")
                    .word_wrap("break-word")
                    .font_weight(font_weight)).fixed_width("13.32%")).width("100%").styles({ "vertical-align": "baseline" })).width("100%"),
                !divider
                    ? null
                    : TableRow(TableData(VStack()
                        .background_color(style.text_fg)
                        .frame("100%", 1)
                        .margin(5, 0, 10, 0)).frame("100%", 1)).width("100%"),
            ];
        };
        // Render a divider.
        const render_divider = () => {
            return TableRow(TableData(VStack()
                .background_color(style.divider_bg)
                .frame("100%", 1)
                .margin(5, 0, 10, 0)).frame("100%", 1)).width("100%");
        };
        // Vars.
        let currency;
        let subtotal = 0;
        let subtotal_tax = 0;
        let total = 0;
        payment.line_items.walk((item) => {
            if (!this.payments)
                throw new Error("Payments not initialized");
            if (typeof item.product === "string") {
                item.product = this.payments.get_product_sync(item.product);
            }
            if (currency == null) {
                const c = Utils.get_currency_symbol(item.product.currency);
                if (c == null) {
                    this.log.error(`Failed to create a payment mail: `, new Error(`Unable to determine the currency of payment "${payment.id}".`));
                }
                currency = c ?? "?";
            }
            subtotal += item.subtotal;
            subtotal_tax += item.tax;
            total += item.total;
        });
        let total_due = payment.status === "open" ? total : 0;
        return [
            render_divider(),
            line_items.map((item, index) => {
                return Table(TableRow(TableData(Image(item.product.icon)
                    .frame(35, 35)
                    .margin_right(15)).width("auto"), TableData(Table(Text(item.product.name)
                    .color(style.title_fg)
                    .font_size(14)
                    .font_weight("bold")
                    .margin(0)
                    .ellipsis_overflow(true), Text(item.product.description)
                    .color(style.text_fg)
                    .font_size(14)
                    .margin(0)
                    .ellipsis_overflow(true))).width("100%"), TableData(Text(`${currency} ${item.subtotal.toFixed(2)}`)
                    .color(style.title_fg)
                    .font_size(14)
                    .font_weight("bold")
                    .margin(0)
                    .white_space("nowrap")).width("100%")).wrap(true).leading_vertical().width("100%")).width("100%");
            }),
            render_divider(),
            Table([
                ["Subtotal:", `${currency} ${subtotal.toFixed(2)}`],
                ["Tax:", `${currency} ${subtotal_tax.toFixed(2)}`],
                ["Total:", `${currency} ${total.toFixed(2)}`],
            ].map((item) => {
                return TableRow(TableData().width("100%"), TableData(Text(item[0])
                    .color(style.title_fg)
                    .font_size(14)
                    .ellipsis_overflow(true)
                    .font_weight("bold")).min_width(75), TableData(Text(item[1])
                    .color(style.title_fg)
                    .font_size(14)
                    .white_space("nowrap")
                    .font_weight("bold"))
                // .min_width(50)
                ).wrap(true);
                // .text_align("right")
            })),
        ];
    }
    // On 2fa mail.
    /** Build the 2FA verification email content. */
    on_2fa_mail({ code, username, email, date, ip, device }) {
        const style = this.mail_style;
        const { Title, Text, Image, Table, TableRow, TableData, VStack } = Mail;
        return this._mail_template({
            max_width: 400,
            children: [
                // Title.
                TableRow(Title("Verification Required")
                    .color(style.title_fg)
                    .width("fit-content")
                    .font_size(26)).center(),
                // Text.
                TableRow(Text("Please confirm your request with this 2FA code.")
                    .center()
                    .margin(10, 0, 20, 0)
                    .color(style.text_fg)
                    .font_size(18)),
                // Auth info.
                [
                    ["Username", username],
                    ["Email", email],
                    ["Date", date],
                    ["Ip Address", ip],
                    ["Device", device],
                ].map((item) => {
                    return [
                        TableRow(VStack()
                            .margin_right(7.5)
                            // .background("linear-gradient(135deg, #4830C4, #6E399E, #421959)")
                            .background_color(style.text_fg)
                            .border_radius("50%")
                            .frame(5, 5), Text(`<span style='font-weight: 600'>${item[0]}:</span> ${item[1]}`)
                            .color(style.text_fg)
                            .font_size(16)
                            .text_wrap("wrap")
                            .overflow_wrap("break-word")
                            .word_wrap("break-word")).wrap(true).center_vertical(),
                        TableRow().fixed_frame(5, 5),
                    ];
                }),
                // 2FA code.
                TableRow(Text(code)
                    .background(style.button_bg)
                    .border_radius("10px")
                    .padding(10, 15)
                    .center()
                    .color(style.button_fg)
                    .width("100%")
                    .margin(20, 0, 0, 0)),
                // Text.
                TableRow(Text("This 2FA code will be valid for 5 minutes.")
                    .color(style.text_fg)
                    .font_style("italic")
                    .font_size(12)
                    .margin_top(20)
                    .center()),
            ],
        });
    }
    // On successfull payment mail.
    /** Build the successful payment email content. */
    on_payment_mail({ payment }) {
        // Shortcuts.
        const style = this.mail_style;
        const { Title, Text, Image, Table, TableRow, TableData, VStack } = Mail;
        // Create mail.
        return this._mail_template({
            max_width: 600,
            children: [
                // Title.
                TableRow(Title("Successful Payment")
                    .color(style.title_fg)
                    .width("fit-content")
                    .font_size(26)).center(),
                // Text.
                TableRow(Text("We're delighted to inform you that your payment has been successfully processed. Thank you for your purchase.")
                    .margin(10, 0, 20, 0)
                    .color(style.text_fg)
                    .font_size(16)
                    .center()),
                // Image.
                TableRow(Image(`${this.full_domain}/volt_static/payments/party.png`)
                    .frame(60, 60)
                    .margin(0, 0, 30, 0)).center(),
                // Title.
                TableRow(Title("Order Summary")
                    .color(style.subtitle_fg)
                    .font_size(18)
                    .margin(0)),
                TableRow(Text("A summary of your order can be found below or in the attached invoice PDF.")
                    .margin(5, 0, 20, 0)
                    .color(style.text_fg)
                    .font_size(16)),
                // Line items.
                this._render_mail_payment_line_items({ payment, line_items: payment.line_items, show_total_due: true }),
                // Bottom spacing.
                VStack()
                    .margin_bottom(15)
            ],
        });
    }
    // On failed payment mail.
    /** Build the failed payment email content. */
    on_failed_payment_mail({ payment }) {
        // Shortcuts.
        const style = this.mail_style;
        const { Title, Text, Image, ImageMask, Table, TableRow, TableData, VStack } = Mail;
        // Create mail.
        return this._mail_template({
            max_width: 800,
            children: [
                // Title.
                TableRow(Title("Payment Failed")
                    .color(style.title_fg)
                    .width("fit-content")
                    .font_size(26)).center(),
                // Text.
                TableRow(Text("We regret to inform you that your payment could not be processed successfully. We understand the inconvenience this may cause. Please try again, or contact customer support if the problem persists.")
                    .margin(10, 0, 20, 0)
                    .color(style.text_fg)
                    .font_size(16)
                    .center()),
                // Image.
                TableRow(ImageMask(`${this.full_domain}/volt_static/payments/error.png`)
                    .frame(40, 40)
                    .mask_color("#E8454E")
                    .margin(0, 0, 30, 0)).center(),
                // Title.
                TableRow(Title("Order Summary")
                    .color(style.subtitle_fg)
                    .font_size(18)
                    .margin(0)),
                TableRow(Text("A summary of your failed order can be found below.")
                    .margin(5, 0, 20, 0)
                    .color(style.text_fg)
                    .font_size(16)),
                // Line items.
                this._render_mail_payment_line_items({ payment, line_items: payment.line_items }),
                // Bottom spacing.
                VStack()
                    .margin_bottom(15)
            ],
        });
    }
    // On cancellation mail.
    /** Build the successful cancellation email content. */
    on_cancellation_mail({ payment, line_items }) {
        // Shortcuts.
        const style = this.mail_style;
        const { Title, Text, Image, Table, TableRow, TableData, VStack } = Mail;
        // Create mail.
        return this._mail_template({
            max_width: 800,
            children: [
                // Title.
                TableRow(Title("Successful Cancellation")
                    .color(style.title_fg)
                    .width("fit-content")
                    .font_size(26)).center(),
                // Text.
                TableRow(Text("Your recent cancellation request has been successfully processed.")
                    .margin(10, 0, 20, 0)
                    .color(style.text_fg)
                    .font_size(16)
                    .center()),
                // Image.
                TableRow(Image(`${this.full_domain}/volt_static/payments/check.png`)
                    .frame(40, 40)
                    .margin(0, 0, 30, 0)).center(),
                // Title.
                TableRow(Title("Cancelled Summary")
                    .color(style.subtitle_fg)
                    .font_size(18)
                    .margin(0)),
                TableRow(Text("A summary of your cancelled products.")
                    .margin(5, 0, 20, 0)
                    .color(style.text_fg)
                    .font_size(16)),
                // Line items.
                this._render_mail_payment_line_items({ payment, line_items }),
                // Bottom spacing.
                VStack()
                    .margin_bottom(15)
            ],
        });
    }
    // On refund mail.
    /** Build the failed cancellation email content. */
    on_failed_cancellation_mail({ payment }) {
        // Shortcuts.
        const style = this.mail_style;
        const { Title, Text, Image, ImageMask, Table, TableRow, TableData, VStack } = Mail;
        // Create mail.
        return this._mail_template({
            max_width: 800,
            children: [
                // Title.
                TableRow(Title("Cancellation Failed")
                    .color(style.title_fg)
                    .width("fit-content")
                    .font_size(26)).center(),
                // Text.
                TableRow(Text("We regret to inform you that your recent cancellation request has encountered an issue and could not be processed successfully. We understand the inconvenience this may cause. If you believe you are eligible for a cancellation, please try again or contact customer support.")
                    .margin(10, 0, 20, 0)
                    .color(style.text_fg)
                    .font_size(16)
                    .center()).center(),
                // Image.
                TableRow(ImageMask(`${this.full_domain}/volt_static/payments/error.png`)
                    .frame(40, 40)
                    .mask_color("#E8454E")
                    .margin(0, 0, 30, 0)).center(),
                // Title.
                TableRow(Title("Cancellation Summary")
                    .color(style.subtitle_fg)
                    .font_size(18)
                    .margin(0)),
                TableRow(Text("A summary of your cancellation request.")
                    .margin(5, 0, 20, 0)
                    .color(style.text_fg)
                    .font_size(16)),
                // Line items.
                this._render_mail_payment_line_items({ payment, line_items: payment.line_items }),
                // Bottom spacing.
                VStack()
                    .margin_bottom(15)
            ],
        });
    }
    // On refund mail.
    /** Build the successful refund email content. */
    on_refund_mail({ payment, line_items }) {
        // Shortcuts.
        const style = this.mail_style;
        const { Title, Text, Image, Table, TableRow, TableData, VStack } = Mail;
        // Create mail.
        return this._mail_template({
            max_width: 800,
            children: [
                // Title.
                TableRow(Title("Chargeback Successful")
                    .color(style.title_fg)
                    .width("fit-content")
                    .font_size(26)).center(),
                // Text.
                TableRow(Text("We're delighted to inform you that your recent refund request has been successfully processed. The charged amount will soon be credited back to your account.")
                    .margin(10, 0, 20, 0)
                    .color(style.text_fg)
                    .font_size(16)
                    .center()),
                // Image.
                TableRow(Image(`${this.full_domain}/volt_static/payments/party.png`)
                    .frame(60, 60)
                    .margin(0, 0, 30, 0)).center(),
                // Title.
                TableRow(Title("Refund Summary")
                    .color(style.subtitle_fg)
                    .font_size(18)
                    .margin(0)),
                TableRow(Text("A summary of your refunded products.")
                    .margin(5, 0, 20, 0)
                    .color(style.text_fg)
                    .font_size(16)),
                // Line items.
                this._render_mail_payment_line_items({ payment, line_items }),
                // Bottom spacing.
                VStack()
                    .margin_bottom(15)
            ],
        });
    }
    // On refund mail.
    /** Build the failed refund email content. */
    on_failed_refund_mail({ payment, line_items }) {
        // Shortcuts.
        const style = this.mail_style;
        const { Title, Text, Image, ImageMask, Table, TableRow, TableData, VStack } = Mail;
        // Create mail.
        return this._mail_template({
            max_width: 800,
            children: [
                // Title.
                TableRow(Title("Refund Failed")
                    .color(style.title_fg)
                    .width("fit-content")
                    .font_size(26)).center(),
                // Text.
                TableRow(Text("We regret to inform you that your recent refund request has encountered an issue and could not be processed successfully. We understand the inconvenience this may cause. If you believe you are eligible for a refund, please try again or contact customer support.")
                    .margin(10, 0, 20, 0)
                    .color(style.text_fg)
                    .font_size(16)
                    .center()).center(),
                // Image.
                TableRow(ImageMask(`${this.full_domain}/volt_static/payments/error.png`)
                    .frame(40, 40)
                    .mask_color("#E8454E")
                    .margin(0, 0, 30, 0)).center(),
                // Title.
                TableRow(Title("Refund Summary")
                    .color(style.subtitle_fg)
                    .font_size(18)
                    .margin(0)),
                TableRow(Text("A summary of your refund request.")
                    .margin(5, 0, 20, 0)
                    .color(style.text_fg)
                    .font_size(16)),
                // Line items.
                this._render_mail_payment_line_items({ payment, line_items }),
                // Bottom spacing.
                VStack()
                    .margin_bottom(15)
            ],
        });
    }
    // On refund mail.
    /** Build the successful chargeback email content. */
    on_chargeback_mail({ payment, line_items }) {
        // Shortcuts.
        const style = this.mail_style;
        const { Title, Text, Image, Table, TableRow, TableData, VStack } = Mail;
        // Create mail.
        return this._mail_template({
            max_width: 800,
            children: [
                // Title.
                TableRow(Title("Successful Refund")
                    .color(style.title_fg)
                    .width("fit-content")
                    .font_size(26)).center(),
                // Text.
                TableRow(Text("We're delighted to inform you that your recent chargeback request has been successfully processed. The charged amount will soon be credited back to your account.")
                    .margin(10, 0, 20, 0)
                    .color(style.text_fg)
                    .font_size(16)
                    .center()),
                // Image.
                TableRow(Image(`${this.full_domain}/volt_static/payments/party.png`)
                    .frame(60, 60)
                    .margin(0, 0, 30, 0)).center(),
                // Title.
                TableRow(Title("Chargeback Summary")
                    .color(style.subtitle_fg)
                    .font_size(18)
                    .margin(0)),
                TableRow(Text("A summary of the items charged back.")
                    .margin(5, 0, 20, 0)
                    .color(style.text_fg)
                    .font_size(16)),
                // Line items.
                this._render_mail_payment_line_items({ payment, line_items }),
                // Bottom spacing.
                VStack()
                    .margin_bottom(15)
            ],
        });
    }
    // On refund mail.
    /** Build the failed chargeback email content. */
    on_failed_chargeback_mail({ payment, line_items }) {
        // Shortcuts.
        const style = this.mail_style;
        const { Title, Text, Image, ImageMask, Table, TableRow, TableData, VStack } = Mail;
        // Create mail.
        return this._mail_template({
            max_width: 800,
            children: [
                // Title.
                TableRow(Title("Chargeback Failed")
                    .color(style.title_fg)
                    .width("fit-content")
                    .font_size(26)).center(),
                // Text.
                TableRow(Text("We regret to inform you that your recent chargeback request has been declined.")
                    .margin(10, 0, 20, 0)
                    .color(style.text_fg)
                    .font_size(16)
                    .center()).center(),
                // Image.
                TableRow(ImageMask(`${this.full_domain}/volt_static/payments/error.png`)
                    .frame(40, 40)
                    .mask_color("#E8454E")
                    .margin(0, 0, 30, 0)).center(),
                // Title.
                TableRow(Title("Chargeback Summary")
                    .color(style.subtitle_fg)
                    .font_size(18)
                    .margin(0)),
                TableRow(Text("A summary of your chargeback request.")
                    .margin(5, 0, 20, 0)
                    .color(style.text_fg)
                    .font_size(16)),
                // Line items.
                this._render_mail_payment_line_items({ payment, line_items }),
                // Bottom spacing.
                VStack()
                    .margin_bottom(15)
            ],
        });
    }
}
