var __dirname = typeof __dirname !== 'undefined' ? __dirname : import.meta.dirname;
// ---------------------------------------------------------
// Libraries.
import * as http from "http";
import * as http2 from "http2";
import * as crypto from "crypto";
import * as nodemailer from 'nodemailer';
// import * as libcluster from 'cluster';
import libcluster from 'cluster';
import * as os from 'os';
// ---------------------------------------------------------
// Imports.
import * as vlib from "@vandenberghinc/vlib";
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
import { logger } from "./logger.js";
// import { BrowserPreview } from "./plugins/browser.js";
const { log, error, warn } = logger;
const { debug } = vlib;
// import { ThreadMonitor } from "./plugins/thread_monitor.js";
// const thread_monitor = new ThreadMonitor()
// thread_monitor.start();
import { Route } from "./route.js";
// ---------------------------------------------------------
// The server object.
// @todo redirect to https on http also important for seo.
// @todo convert throw new Error to frontend errors.
// @todo figure out with what settings nodejs should be started for heavy servers, for example larger memory size `--max-old-space-size`
// @todo implement usage of multiple cpu's using lib `cluster`.
// @todo when rendering pages the user could use a special OptimizeText() function which will be optimized for copy writing and seo when adding loading static files. Quite hard but would be sublime (writesonic is a good platform).
/*  @docs:
    @nav: Backend
    @chapter: Server
    @title: Server
    @description:
        The backend server class.
        When the https parameters `certificate` and `private_key` are defined, the server will run automatically on http and https.
    @parameter:
        @name: production
        @description: Whether the server is in production more, or in development mode.
        @type: boolean
        @required: true
    @parameter:
        @name: localhost
        @description: Wether to run on localhost. This overrides the given `ip` parameter, and makes the `ip` parameter optional.
        @type: boolean
    @parameter:
        @name: ip
        @description: The ip where the server will run on.
        @type: string
        @required: true
    @parameter:
        @name: port
        @description: The port where the server will run on. Leave the port `null` to run on port `80` for http and on port `443` for https.
        @type: number
    @parameter:
        @name: tls
        @description: The tls settings for HTTPS.
        @type: object
        @attribute:
            @name: cert
            @description: The path to the certificate.
            @type: string
        @attribute:
            @name: key
            @description: The path to the private key file.
            @type: string
        @attribute:
            @name: ca
            @description: The path to the ca bundle file.
            @type: null, string
        @attribute:
            @name: passphrase
            @description: The passphrase of the private key.
            @type: string
    @parameter:
        @name: domain
        @description: The full domain url without `http://` or `https://`.
        @type: string
        @required: true
    @parameter:
        @name: source
        @description: The path to the source directory of your website. This may either be the source directory of your code, or the source directory where files will be stored for your website.
        @type: string
        @required: true
    @parameter:
        @name: is_primary
        @description: Used to indicate if the current server is the primary node.
        @type: string
        @required: true
    @parameter:
        @name: statics
        @description: Array with paths to static directories or static directory objects.
        @type: string[], vlib.Path[], StaticDirectory
        @required: true
        @attributes_type: StaticDirectory
        @attr:
            @name: path
            @descr: The path to the static directory or file.
            @required: true
        @attr:
            @name: endpoint
            @descr: The base endpoint of the static directory, by default the path's name will be used.
            @required: false
        @attr:
            @name: cache
            @descr: Enable caching for the static endpoints, this value will be used for parameter `Endpoint.cache`.
            @type: boolean | number
            @default: true
            @required: false
        @attr:
            @name: endpoints_cache
            @descr: This attribute can be used to define a specific cache policy per endpoint from this static directory. Must be formatted as `{<endpoint>: <cache>}`, the cache value will be used for parameter `Endpoint.cache`.
            @default: {}
            @required: false
        @attr:
            @name: exclude
            @descr: An array of paths to exlude. The array may contain regexes.
            @default: {}
            @required: false
    @parameter:
        @name: database
        @description:
            The database settings.
        @type: string, object, boolean
        @required: true
    @parameter:
        @name: default_headers
        @description: Used to override the default headers generated by volt. Leave parameter `default_headers` as `null` to let volt automatically generate the default headers.
        @type: object
    @parameter:
        @name: favicon
        @description: The path to the favicon.
        @type: string
    @parameter:
        @name: token_expiration
        @description: The token a sign in token will be valid in seconds.
        @type: number
    @parameter:
        @name: enable_2fa
        @description: Enable 2fa for user authentication.
        @type: boolean
        @required: true
    @parameter:
        @name: enable_account_activation
        @description: Enable account activation by email after a user signs up.
        @type: boolean
        @required: true
    @parameter:
        @name: meta
        @description: The default meta object.
        @type: object, volt.Meta
    @parameter:
        @name: company
        @type: object
        @description: Your company information.
        @attribute:
            @name: name
            @type: string
            @required: true
            @description: The name of your company.
        @attribute:
            @name: legal_name
            @type: string
            @required: true
            @description: The legal name of your company.
        @attribute:
            @name: street
            @type: string
            @required: true
            @description: The street name of your company's address.
        @attribute:
            @name: house_number
            @type: string
            @required: true
            @description: The house number or house name of your company's address.
        @attribute:
            @name: postal_code
            @type: string
            @required: true
            @description: The postal code or zip code of your company's address.
        @attribute:
            @name: city
            @type: string
            @required: true
            @description: The city of your company's address.
        @attribute:
            @name: province
            @type: string
            @required: true
            @description: The province or state of your company's address.
        @attribute:
            @name: country
            @type: string
            @required: true
            @description: The country name of your company's address.
        @attribute:
            @name: country_code
            @type: string
            @required: true
            @description: The two-letter ISO country code of your company's location.
        @attribute:
            @name: tax_id
            @type: string
            @required: false
            @description: The tax id of your company.
        @attribute:
            @name: type
            @type: string
            @description: The type of company.
        @attribute:
            @name: icon
            @type: string
            @required: true
            @description: The endpoint url path of your company's icon, png format. This must be an endpoint url since access to the file path is also required for creating invoices.
        @attribute:
            @name: stroke_icon
            @type: string
            @required: true
            @description: The endpoint url path of your company's stroke icon, png format. In payment invoices the stroke icon precedes the default icon. This must be an endpoint url since access to the file path is also required for creating invoices.
    @parameter:
        @name: smtp
        @description:
            The smpt arguments object.
            More information about the arguments can be found at the nodemailer <Link https://nodemailer.com/smtp/>documentation</Link>.
        @type: object
        @attribute:
            @name: sender
            @description:
                The smtp sender address may either be a string with the email address, e.g. `your@email.com`.
                Or an array with the sender name and email address, e.g. `["Sender", "your@email.com"]`.
            @type: string, array
        @attribute:
            @name: host
            @description: The mail server's host address.
            @type: string
        @attribute:
            @name: port
            @description: The mail server's port.
            @type: number
        @attribute:
            @name: secure
            @description: Enable secure options.
            @type: boolean
        @attr:
            @name: auth
            @description: The authentication settings.
            @type: object
            @attribute:
                @name: user
                @description: The email used for authentication.
                @type: string
            @attribute:
                @name: pass
                @description: The password used for authentication.
                @type: string
    @parameter:
        @name: payments
        @type: object
        @description: The arguments for the payment class. The `type` attribute is used to indicate the payment provider, the other attributes are arguments for the payment class <Link #Paddle>Paddle</Link>.
        @attribute:
            @name: type
            @type: string
            @description: The payment provider name.
            @required: true
            @enum:
                @value: paddle
                @desc: Payment provider Paddle.
    @parameter:
        @name: google_tag
        @description: The google tag id.
        @type: string
    @parameter:
        @name: mail_style
        @description: The mail settings to customize automatically generated mails.
        @type: object
        @attribute:
            @name: font
            @description: The font family.
            @type: string
        @attribute:
            @name: button_bg
            @description: The background color of the button's in your mails.
            @type: string
    @parameter:
        @name: offline
        @description: Boolean indicating if the development server is being run offline.
        @type: boolean
    @parameter:
        @name: multiprocessing
        @description: Enable multiprocessing when in production mode.
        @type: boolean
        @def: true
    @parameter:
        @name: processes
        @description: The number of processes when multiprocessing is enabled. By default the number of CPU's will be used for the amount of processes.
        @type: null, number
        @def: null
    @parameter:
        @name: rate_limit
        @description:
            The rate limit server and client settings. Rate limiting works with a centralizer websocket server and secondary clients.
        @type: object
        @required: false
        @attribute:
            @name: server
            @type: object
            @description:
                The server configuration.

                By default the primary server instance will start the rate limit service.

                However, when parameter `rate_limit.server` is `false`. All rate limit instances will use a client to connect to an already running rate limit instance. If so, you must manually set up this rate limt server.
            @attribute:
                @name: ip
                @description:
                    The ip to which the rate limiting server will bind. By default the rate limit server will run on localhost only.
                @type: null, string
            @attribute:
                @name: port
                @description:
                    The port to which the rate limiting server will bind. The default port is `51234`.
                @type: number
                @def: 51234
            @attribute:
                @name: https
                @description:
                    To enable https on the server you must define a `https.createServer` configuration. Otherwise, the rate limit server will run on http.
                @type: null, object
        @attribute:
            @name: client
            @description:
                The client configuration.
            @attribute:
                @name: ip
                @description:
                    The ip address of the primary node with the rate limiting server. The primary node is indicated by the `Server.is_primary` parameter.

                    When `Server.is_primary` is true, the rate limiting server will listen on the private ip address of your current machine.
                @type: null, string
            @attribute:
                @name: port
                @description:
                    The port of the primary node with the rate limiting server. The default port is `51234`.
                @type: number
                @def: 51234
            @attribute:
                @name: url
                @description:
                    The full websocket url of the server. If defined this takes precedence over parameters `ip` and `port`.

                    This can be useful when `rate_limit.server` is `false`.
                @type: null, string
    @parameter:
        @name: keys
        @description:
            The array with names of crypto keys. The keys will be generated and stored in the database when they do not exist. The keys will be accessable as `Server.keys.$name`.

            The array items may be a string representing the name of the key, or an object containing the name and the length of the key.
        @type: array[string], array[object]
        @required: false
        @attribute:
            @name: name
            @description:
                The name of the key.
            @type: string
        @attribute:
            @name: length
            @description:
                The length of the key.
            @type: number
    @parameter:
        @name: additional_sitemap_endpoints
        @description:
            An array with additional endpoints that will be added to the sitemap. By default all endpoints where attribute `view` is defined will be added the sitemap.
        @type: array[string]
    @parameter:
        @name: daemon
        @description:
            The optional settings for the service daemons. The service daemons can be disabled by passing value `false` to parameter `daemon`.

            By default this settings will also partially be used for the database service daemon.
        @type: object
        @attr:
            @name: user
            @desc: The executing user of the service daemon.
            @type: string
        @attr:
            @name: group
            @desc: The executing group of the service daemon.
            @type: string
        @attr:
            @name: args
            @desc: The arguments for the start command.
            @type: array[string]
        @attr:
            @name: env
            @desc: The environment variables for the service daemon.
            @type: object
        @attr:
            @name: description
            @desc: The description of the service daemon.
            @type: string
        @attr:
            @name: logs
            @desc: The path to the log file.
            @type: string
        @attr:
            @name: errors
            @desc: The path to the error log file.
            @type: string
    @parameter:
        @name: admin
        @description:
            Administrator settings used for protected administrator endpoints.
        @type: object
        @attr:
            @name: password
            @desc: The password used for administrator endpoints.
            @type: string
        @attr:
            @name: ips
            @desc: IP addresses used by the website administrator. These ip's will be used to create a whitelist for administrator endpoints.
            @type: string[]
    @parameter:
        @name: ts
        @description:
            Specify typescript options.
        @type: object
        @attr:
            @name: output
            @desc: The output directory for typescript endpoint source files.
            @type: string
        @attr:
            @name: compiler_options
            @desc: The compiler options for the typescript files.
            @type: object
            @required: false

    @attribute:
        @name: users
        @type: object
        @attribute:
            @name: public
            @type: UIDCollection
            @desc:
                The database collection for public data of users.
                
                More information about the collection's functions can be found at <Type>UIDCollection</Type>
            @warning:
                The authenticated user always has read and write access to all data inside the user's protected directory through the backend rest api. Any other users or unauthenticated users do not have access to this data.
        @attribute:
            @name: protected
            @type: UIDCollection
            @desc:
                The database collection for public data of users.
                
                More information about the collection's functions can be found at <Type>UIDCollection</Type>
            @warning:
                The authenticated user always has read access to all data inside the user's protected directory through the backend rest api. Any other users or unauthenticated users do not have access to this data.
        @attribute:
            @name: private
            @type: UIDCollection
            @desc:
                The database collection for public data of users.
                
                More information about the collection's functions can be found at <Type>UIDCollection</Type>
            @note:
                The user has no read or write access to the private directory.
    @attribute:
        @name: storage
        @type: Collection
        @desc:
            The database storage collection for the website's system backend data.
            
            More information about the collection's functions can be found at <Type>Collection</Type>

 */
// @tdo implement 3D secure "requires_action" status for a refund and payment intent.
// https://stripe.com/docs/payments/3d-secure
// @ts-ignore
export class Server {
    // Static attributes.
    static content_type_mimes = [
        [".html", "text/html"],
        [".htm", "text/html"],
        [".shtml", "text/html"],
        [".css", "text/css"],
        [".xml", "application/xml"],
        [".gif", "image/gif"],
        [".jpeg", "image/jpeg"],
        [".jpg", "image/jpeg"],
        [".js", "application/javascript"],
        [".ts", "application/javascript"],
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
    ];
    log;
    warn;
    error;
    static compressed_extensions = [
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
        ".webp",
        ".bmp",
        ".tiff",
        ".ico",
        ".svg",
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
    ];
    // Instance properties
    ip;
    port;
    https_port;
    domain;
    full_domain;
    source; // vlib.Path type
    is_primary;
    statics;
    statics_aspect_ratios;
    favicon;
    enable_2fa;
    enable_account_activation;
    token_expiration;
    google_tag;
    production;
    // public localhost: boolean;
    multiprocessing;
    processes;
    company;
    meta;
    mail_style;
    online;
    offline;
    // private honey_pot_key: string | null;
    _keys;
    additional_sitemap_endpoints;
    log_level;
    tls;
    // public admin: AdminConfig;
    // public ts: TypeScriptConfig;
    lightweight;
    performance;
    csp;
    default_headers;
    http;
    https;
    endpoints;
    err_endpoints;
    db;
    _sys_db; // needs to be public for the RateLimit classes.
    storage;
    smtp;
    smtp_sender;
    rate_limit;
    blacklist;
    _hash_key = null;
    keys = {};
    _on_start = [];
    _on_initialize = [];
    _on_stop = [];
    // public browser_preview?: BrowserPreview;
    daemon;
    _stop_tscompiler_watcher;
    users;
    payments;
    status;
    rate_limits;
    logger;
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
            ip: null,
            port: RateLimitServer.default_port,
            https: null,
        },
        client: {
            ip: null,
            port: RateLimitServer.default_port,
            url: null,
        },
    }, keys = [], payments, default_headers, google_tag = undefined, token_expiration = 86400, enable_2fa = false, enable_account_activation = true, production = false, multiprocessing = true, processes, offline = false, additional_sitemap_endpoints = [], log_level = 0, daemon = {}, 
    // admin = {
    //     password: null,
    //     ips: [],
    // },
    // ts = {
    //     compiler_opts: {},
    //     output: undefined,
    // },
    // browser_preview = undefined,
    lightweight = false, }) {
        // @debug
        // Async hook for tracking active processes during stop().
        // const async_resource_map = new Map();
        // this.async_hook = require('async_hooks').createHook({
        //     init(async_id, type, trigger_async_id, resource) {
        //         const ignoredTypes = ['TickObject', 'PROMISE'];
        //         if (ignoredTypes.includes(type)) {
        //             return; // Skip logging for these async types
        //         }
        //         // Capture the stack trace of the function that initiated the async operation
        //         const stack = new Error("SKIPAFTER").stack.split("SKIPAFTER")[1].trim();
        //         // Log async_id and initiating function call stack
        //         // console.log(`Init async_id: ${async_id}`)
        //         // console.log(`Init async_id: ${async_id}, type: ${type}, trigger: ${trigger_async_id}\nStack: ${stack}`);
        //         // Store the async resource and stack trace
        //         async_resource_map.set(async_id, { type, stack });
        //     },
        //     destroy(async_id) {
        //         // When an async resource is destroyed, remove it from the map
        //         // console.log(`Destroy async_id: ${async_id}`);
        //         async_resource_map.delete(async_id);
        //     },
        //     // before(async_id) {
        //     //     console.log(`Before async_id: ${async_id}`);
        //     // },
        //     // after(async_id) {
        //     //     console.log(`After async_id: ${async_id}`);
        //     // },
        // })
        // this.async_hook.resource_map = async_resource_map;
        // this.async_hook.enable();
        // Verify args.
        vlib.Scheme.verify({ object: arguments[0], err_prefix: "Server: ", check_unknown: true, scheme: {
                ip: { type: "string", required: false },
                port: { type: "number", required: false },
                domain: "string",
                statics: { type: "array", default: [] },
                is_primary: { type: "boolean", default: true },
                source: "string",
                database: {
                    type: ["string", "object"],
                    required: false,
                    scheme: { ...Database.constructor_scheme, _server: undefined },
                },
                favicon: { type: "string", required: false },
                // honey_pot_key: {type: "string", default: null},
                company: {
                    type: "object",
                    default: {},
                    scheme: {
                        name: "string",
                        legal_name: "string",
                        street: "string",
                        house_number: "string",
                        postal_code: "string",
                        city: "string",
                        province: "string",
                        country: "string",
                        country_code: "string",
                        tax_id: { type: "string", default: null },
                        icon: { type: "string", default: null },
                        icon_path: { type: "string", default: null },
                        stroke_icon: { type: "string", default: null },
                        stroke_icon_path: { type: "string", default: null },
                    }
                },
                meta: { type: "object", required: false },
                tls: {
                    type: ["object"],
                    required: false,
                    scheme: {
                        cert: "string",
                        key: "string",
                        ca: { type: "string", default: null },
                        passphrase: { type: "string", default: null },
                    }
                },
                rate_limit: {
                    type: ["boolean", "object"],
                    default: false,
                    scheme: {
                        server: { type: "object", default: {}, scheme: {
                                ip: { type: "string", default: null },
                                port: { type: "number", default: RateLimitServer.default_port },
                                https: { type: "object", default: null },
                            } },
                        client: { type: "object", default: {}, scheme: {
                                ip: { type: "string", default: null },
                                port: { type: "number", default: RateLimitServer.default_port },
                                url: { type: "string", default: null },
                            } },
                    },
                },
                keys: { type: "array", default: [] },
                smtp: { type: ["null", "object"], required: false },
                mail_style: {
                    type: "object",
                    required: false,
                    scheme: {
                        font: { type: "string", default: '"Helvetica", sans-serif' },
                        title_fg: { type: "string", default: "#121B23" },
                        subtitle_fg: { type: "string", default: "#121B23" },
                        text_fg: { type: "string", default: "#1F2F3D" },
                        button_fg: { type: "string", default: "#FFFFFF" },
                        footer_fg: { type: "string", default: "#686B80" },
                        bg: { type: "string", default: "#EEEEEE" },
                        widget_bg: { type: "string", default: "#FFFFFF" },
                        button_bg: { type: "string", default: "#421959" },
                        widget_border: { type: "string", default: "#E6E6E6" },
                        divider_bg: { type: "string", default: "#E6E6E6" },
                    }
                },
                payments: { type: ["null", "object"], required: false },
                default_headers: { type: ["null", "object"], required: false },
                google_tag: { type: "string", required: false },
                token_expiration: { type: "number", required: false },
                enable_2fa: { type: "boolean", required: false },
                enable_account_activation: { type: "boolean", required: false },
                production: { type: "boolean", required: false },
                // localhost: { type: "boolean", required: false },
                multiprocessing: { type: "boolean", required: false, default: true },
                processes: { type: "number", required: false, default: null },
                offline: { type: "boolean", default: false },
                additional_sitemap_endpoints: { type: "array", default: [] },
                log_level: { type: "number", default: 0 },
                daemon: { type: ["object", "boolean"], default: {} },
                // admin: {type: "object", default: {}, attributes: {
                //     ips: {type: "array", default: []},
                //     password: {
                //         type: "string",
                //         verify: (param: string, attrs) => (param.length < 10 ? `Parameter "Server.admin.password" must have a length of at least 10 characters.` : undefined),
                //     },
                // }},
                // ts: {
                //     type: "object",
                //     required: false,
                //     scheme: {
                //         compiler_opts: {type: "object", default: {}},
                //         output: "string",
                //     },
                // },
                // browser_preview: {type: ["string", "undefined"], required: false, default: undefined},
                lightweight: { type: "boolean", required: false },
            } });
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
        this.enable_2fa = enable_2fa;
        this.enable_account_activation = enable_account_activation;
        this.token_expiration = token_expiration;
        this.google_tag = google_tag;
        this.production = production;
        // this.localhost = localhost;
        this.lightweight = lightweight;
        this.multiprocessing = multiprocessing;
        this.processes = processes == null ? os.cpus().length : processes;
        this.company = company;
        this.mail_style = mail_style;
        this.offline = offline;
        this.online = !offline;
        // this.honey_pot_key = honey_pot_key;
        this._keys = keys;
        this.additional_sitemap_endpoints = additional_sitemap_endpoints;
        this.log_level = log_level;
        this.tls = tls;
        // this.admin = admin as AdminConfig;
        // this.ts = ts as TypeScriptConfig;
        this.endpoints = new Map();
        this.err_endpoints = new Map();
        /* @performance */ this.performance = new vlib.Performance("Server performance");
        // Assign objects to server so it is easy to access.
        this.status = Status;
        this.logger = logger;
        this.rate_limits = RateLimits;
        // Add global rate limit.
        this.rate_limits.add({ group: "global", interval: 60, limit: 1000 });
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
        this.full_domain = `http${tls == null || tls.key == null ? "" : "s"}://${domain}`; // also required for Stripe.
        while (this.full_domain.charAt(this.full_domain.length - 1) === "/") {
            this.full_domain = this.full_domain.substr(0, this.full_domain.length - 1);
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
            "Vary": "Origin",
            "Referrer-Policy": "same-origin",
            "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
            "Access-Control-Allow-Origin": "*",
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials': 'true',
            "X-XSS-Protection": "1; mode=block",
            "X-Content-Type-Options": "nosniff",
            "frame-ancestors": 'none',
            "X-Frame-Options": "DENY",
            "Strict-Transport-Security": "max-age=31536000",
        };
        const default_csp = {
            "default-src": "'self' https://*.google-analytics.com",
            "img-src": `'self' http://${this.domain} https://${this.domain} https://*.google-analytics.com https://raw.githubusercontent.com/vandenberghinc/ `,
            "script-src": "'self' 'unsafe-inline' https://ajax.googleapis.com https://www.googletagmanager.com https://googletagmanager.com https://*.google-analytics.com https://code.jquery.com https://cdn.jsdelivr.net/npm/@vandenberghinc/",
            "style-src": "'self' 'unsafe-inline' https://cdn.jsdelivr.net/npm/@vandenberghinc/",
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
        // Define your list of endpoints
        this.endpoints = new Map();
        this.err_endpoints = new Map();
        // Browser preview.
        // if (browser_preview) {
        //     this.browser_preview = new BrowserPreview(browser_preview);
        // }
        // Create logs directory.
        const log_source = this.source.join("logs");
        if (!log_source.exists()) {
            log_source.mkdir_sync();
        }
        // Configure the logger.
        logger.log_level.set(this.log_level);
        if (daemon === false) {
            logger.assign_paths(log_source.join("logs").str(), log_source.join("errors").str());
        }
        this.log = logger.log.bind(logger);
        this.warn = logger.warn.bind(logger);
        this.error = logger.error.bind(logger);
        // Initialize the service daemon.
        // Must be initialized before initializing the database.
        if (daemon !== false) {
            const log_source = this.source.join("daemon");
            if (!log_source.exists()) {
                log_source.mkdir_sync();
            }
            this.daemon = new vlib.Daemon({
                name: this.domain.replaceAll(".", ""),
                user: daemon.user || os.userInfo().username,
                group: daemon.group || null,
                command: "volt --service --start",
                cwd: this.source.str(),
                args: daemon.args || [],
                env: daemon.env || {},
                description: daemon.description || `Service daemon for website ${this.domain}.`,
                auto_restart: true,
                logs: daemon.logs || log_source.join("logs").str(),
                errors: daemon.errors || log_source.join("errors").str(),
            });
        }
        // Initialize the database class.
        if (typeof database === "string") {
            this.db = new Database({ uri: database, _server: this });
        }
        else if (database != null) {
            this.db = new Database({ ...database, _server: this });
        }
        // Initialize the users class.
        this.users = new Users(this);
        // The smtp instance.
        if (smtp) {
            this.smtp_sender = smtp.sender;
            this.smtp = nodemailer.createTransport(smtp);
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
        // Blacklist class.
        // if (this.honey_pot_key) {
        //     this.blacklist = new Blacklist({api_key: this.honey_pot_key});
        // }
    }
    // ---------------------------------------------------------
    // Utils.
    // Get a content type from an extension.
    get_content_type(extension) {
        let content_type = Server.content_type_mimes.find((item) => {
            if (item[0] == extension) {
                return item[1];
            }
        })?.[1];
        if (content_type == null) {
            content_type = "application/octet-stream";
        }
        return content_type;
    }
    // Set log level.
    set_log_level(level) {
        this.log_level = level;
        logger.log_level.set(level);
    }
    // ---------------------------------------------------------
    // Crypto (private).
    // Generate a crypto key.
    generate_crypto_key(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }
    // Create a sha hmac with the master key.
    hmac(key, data, algo = "sha256") {
        const hmac = crypto.createHmac(algo, key);
        hmac.update(data);
        return hmac.digest("hex");
    }
    _hmac(data) {
        if (!this._hash_key) {
            throw new Error("Hash key not initialized");
        }
        const hmac = crypto.createHmac("sha256", this._hash_key);
        hmac.update(data);
        return hmac.digest("hex");
    }
    // Hash without a key.
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
    }
    // ---------------------------------------------------------
    // Endpoints (private).
    // Find endpoint.
    _find_endpoint(endpoint, method = null) {
        method ??= "GET";
        const result = this.endpoints.get(`${method}:${endpoint}`);
        if (!result) {
            const route = new Route(method, endpoint);
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
                _server: this,
            });
        }
        // Create status endpoint.
        const status_dir = this.source.join(".status");
        if (!status_dir.exists()) {
            status_dir.mkdir_sync();
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
            _server: this,
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
                const data = await this._sys_db.load("status", {
                    default: {
                        running_since: null,
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
        if (this.lightweight) {
            return;
        }
        log(2, "Creating sitemap.");
        let sitemap = "";
        sitemap += "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
        sitemap += "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n";
        for (const endpoint of this.endpoints.values()) {
            if (endpoint.allow_sitemap) {
                sitemap += `<url>\n   <loc>${this.full_domain}/${endpoint.route.endpoint_str}</loc>\n</url>\n`; // @todo not compatiable with regex endpoints
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
        if (this.lightweight) {
            return;
        }
        log(2, "Creating robots.txt.");
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
        if (this.lightweight) { return; }
        log(2, "Creating admin endpoint.");

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
        log(2, "Initializing static directories.");
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
                    _server: this,
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
                    compress: !Server.compressed_extensions.includes(path.extension()),
                    cache,
                    rate_limit: "global",
                    _static_path: path.str(),
                    _is_static: true,
                    _server: this,
                })
                    ._load_data_by_path(this));
            }
        };
        // Initialize statics.
        const add_static = async (opts) => {
            if (opts == null) {
                return;
            }
            if (typeof opts === "object") {
                // Check object.
                vlib.Scheme.verify({
                    object: opts,
                    check_unknown: true,
                    scheme: {
                        path: "string",
                        endpoint: { type: "string", default: null },
                        cache: { type: ["boolean", "number"], default: true },
                        endpoints_cache: { type: "object", default: {} },
                        exclude: { type: "array", default: [] },
                    }
                });
                // Vars.
                const exclude = [/.*\.DS_Store/, /.*\.cache/, /.*\.old/, /.*\.ignore/, ...opts.exclude || []];
                const paths = []; // vlib.Path[]
                const source = new vlib.Path(opts.path).abs();
                const source_len = source.str().length;
                const is_dir = source.is_dir();
                // Is excluded.
                const is_excluded = (path) => {
                    return exclude.some(pattern => {
                        if (path instanceof RegExp) {
                            if (pattern instanceof RegExp) {
                                return pattern.source === path.source;
                            }
                            else {
                                return path.test(String(pattern));
                            }
                        }
                        else {
                            if (pattern instanceof RegExp) {
                                return pattern.test(String(path));
                            }
                            else {
                                return path === pattern;
                            }
                        }
                    });
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
        log(1, "Initializing server.");
        /* @performance */ this.performance.start();
        // Create HTTPS server.
        if (this.tls) {
            this.https = http2.createSecureServer({
                key: new vlib.Path(this.tls.key).load_sync({ encoding: 'utf8' }),
                cert: new vlib.Path(this.tls.cert).load_sync({ encoding: 'utf8' }),
                ca: this.tls.ca == null ? undefined : new vlib.Path(this.tls.ca).load_sync({ encoding: 'utf8' }),
                passphrase: this.tls.passphrase,
                allowHTTP1: true,
            }, 
            // Support for http1.
            // Does not work, requests get triggered on the stream and on this callback.
            (req, res) => {
                if (req.httpVersion.charAt(0) !== "2") {
                    this._serve(undefined, undefined, req, res);
                }
            });
            this.https.on('stream', (stream, headers) => {
                this._serve(stream, headers, undefined, undefined);
            });
        }
        // Payments require HTTPS in production.
        else if (this.production && this.payments) {
            throw Error("Accepting payments in production mode requires HTTPS.");
        }
        // Redirect HTTP requests to HTTPS.
        if (this.tls) {
            this.http = http.createServer((request, response) => {
                response.writeHead(301, { Location: `https://${request.headers.host}${request.url}` });
                response.end();
            });
        }
        else {
            this.http = http.createServer((req, res) => {
                this._serve(undefined, undefined, req, res);
            });
        }
        /* @performance */ this.performance.end("create-http-server");
        // Start the database.
        if (this.db) {
            await this.db.initialize();
            /* @performance */ this.performance.end("init-db");
            // Database collections.
            this._sys_db = await this.db.collection({
                name: "Volt.System",
                indexes: ["_path"],
            });
            /* @performance */ this.performance.end("init-sys-collection");
            // Load keys.
            const keys_document = await this._sys_db.load("keys");
            const gen_user_crypto_key = (doc, key) => {
                if (typeof key === "string") {
                    doc[key] = this.generate_crypto_key(32);
                }
                else {
                    if (key.length == null) {
                        throw Error(`Crypto key object "${JSON.stringify(key)}" does not contain a "length" attribute.`);
                    }
                    if (typeof key.length !== "number") {
                        throw Error(`Crypto key object "${JSON.stringify(key)}" has an invalid type fo attribute "length", the valid type is "number".`);
                    }
                    if (key.name == null) {
                        throw Error(`Crypto key object "${JSON.stringify(key)}" does not contain a "name" attribute.`);
                    }
                    if (typeof key.name !== "string") {
                        throw Error(`Crypto key object "${JSON.stringify(key)}" has an invalid type fo attribute "name", the valid type is "string".`);
                    }
                    doc[key.name] = this.generate_crypto_key(key.length);
                    this.keys[key.name] = doc[key.name];
                }
            };
            if (keys_document == null) {
                this._hash_key = this.generate_crypto_key(32);
                const doc = {
                    _master_sha256: this._hash_key,
                };
                this._keys.forEach((key) => {
                    gen_user_crypto_key(doc, key);
                });
                await this._sys_db.save("keys", doc);
            }
            else {
                // Check hash key.
                this._hash_key = keys_document._master_sha256;
                let perform_save = false;
                if (this._hash_key === undefined) {
                    this._hash_key = this.generate_crypto_key(32);
                    keys_document._master_sha256 = this._hash_key;
                    perform_save = true;
                }
                // Check crypto keys.
                this._keys.forEach((key) => {
                    let name = typeof key === "string" ? key : key.name;
                    if (keys_document[name] == null) {
                        gen_user_crypto_key(keys_document, key);
                        perform_save = true;
                    }
                    this.keys[name] = keys_document[name];
                });
                // Save.
                if (perform_save) {
                    await this._sys_db.save("keys", keys_document);
                }
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
        if (this._find_endpoint("sitemap.xml") == null) {
            promises.push(this._create_sitemap());
        }
        // /* @performance */ this.performance.end("create-sitemap");
        // Create robots.txt when it does not exist.
        // Must be done at the end of initialization func since some funcs might still create endpoints.
        if (this._find_endpoint("robots.txt") == null) {
            promises.push(this._create_robots_txt());
        }
        // /* @performance */ this.performance.end("create-robots.txt");
        // Await all promises.
        await Promise.all(promises);
        // Get the icon and stroke icon file paths when defined.
        if (this.company.stroke_icon || this.company.icon) {
            for (const endpoint of this.endpoints.values()) {
                if (this.company.stroke_icon_path == null && endpoint.route.endpoint === this.company.stroke_icon) {
                    this.company.stroke_icon_path = endpoint._static_path ?? undefined;
                }
                if (this.company.icon_path == null && endpoint.route.endpoint === this.company.icon) {
                    this.company.icon_path = endpoint._static_path ?? undefined;
                }
            }
            if (this.company.stroke_icon != null && this.company.stroke_icon_path == null) {
                throw Error(`Unable to find the company's stroke icon endpoint "${this.company.stroke_icon}".`);
            }
            if (this.company.icon != null && this.company.icon_path == null) {
                throw Error(`Unable to find the company's icon endpoint "${this.company.icon}".`);
            }
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
        this._on_initialize.append(callback);
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
            const log_endpoint_result = (message = null, status = null) => {
                let log_level = endpoint && endpoint.is_static ? 3 : 0;
                if (status == null) {
                    status = stream.status_code;
                }
                log(log_level, `${method}:${endpoint_url}: ${message ? message : Status.get_description(status)} [${status}] (${stream.ip}).`);
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
                            error(`Error endpoint ${status_code}: `, err);
                            stream.send(default_response);
                        }
                    }
                    // @todo also serve something here.
                }
            };
            // Check ip against blacklist.
            if (this.online && this.blacklist !== undefined && !this.blacklist.verify(stream.ip)) {
                await serve_error_endpoint(403);
                log_endpoint_result();
                return;
            }
            // Check if the request matches any of the defined endpoints.
            method = stream.method;
            endpoint_url = stream.endpoint;
            // endpoint = this._find_endpoint(endpoint_url, method);
            // Find endpoint manually so the optional path params can be extracted.
            log(3, "Searching for endpoint: ", `${method}:${endpoint_url}`);
            endpoint = this.endpoints.get(`${method}:${endpoint_url}`);
            if (!endpoint) {
                // Check regex endpoints.
                const route = new Route(method, endpoint_url);
                for (const e of this.endpoints.values()) {
                    if (e.route.is_regex) {
                        if (e.route.match(route)) {
                            log(3, "Matched regex route: ", e.route.id);
                            endpoint = e;
                            // insert path params into the stream when not already defined.
                            Object.keys(route.matched_params).walk((k) => {
                                if (stream.params[k] == null) {
                                    stream.params[k] = route.matched_params[k];
                                }
                            });
                            break;
                        }
                    }
                }
            }
            else {
                log(3, "Matched route: ", endpoint.route.id);
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
                        // When any cors origin is allowed and origin is present then respond with that origin.
                        if (stream.headers.origin && this.default_headers["Access-Control-Allow-Origin"] === "*") {
                            stream.remove_header("Access-Control-Allow-Origin", "access-control-allow-origin");
                            stream.set_header("Access-Control-Allow-Origin", stream.headers.origin);
                        }
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
            // When any cors origin is allowed and origin is present then respond with that origin.
            if (stream.headers.origin && this.default_headers["Access-Control-Allow-Origin"] === "*") {
                stream.remove_header("Access-Control-Allow-Origin", "access-control-allow-origin");
                stream.set_header("Access-Control-Allow-Origin", stream.headers.origin);
            }
            // Serve options request.
            if (method === "OPTIONS") {
                try {
                    await endpoint._serve_options(stream);
                }
                catch (err) {
                    error(`${method}:${endpoint_url}: `, err);
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
            if (this.online && this.production && this.rate_limit !== undefined && endpoint.rate_limit_groups.length > 0) {
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
                error(`${method}:${endpoint_url}: `, err);
                await serve_error_endpoint(500);
                log_endpoint_result();
                return;
            }
            try {
                stream._parse_params();
            }
            catch (err) {
                error(`${method}:${endpoint_url}: `, err);
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
                error(`${method}:${endpoint_url}: `, err);
                if (!stream.destroyed && !stream.closed) {
                    await serve_error_endpoint(500);
                    log_endpoint_result();
                }
                return;
            }
            // Check if the response has been sent.
            if (!stream.finished) {
                error(`${method}:${endpoint_url}: `, "Unfinished response.");
                await serve_error_endpoint(500);
                log_endpoint_result();
                return;
            }
            // Log.
            log_endpoint_result();
        }
        catch (err) {
            error("Fatal error:", err);
        }
    }
    // ---------------------------------------------------------
    // Server.
    // Start the server.
    /*  @docs:
     *  @title: Start
     *  @description:
     *      Start the server.
     *  @usage:
     *      ...
     *      server.start();
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
        if (this.production && this.multiprocessing && libcluster.isPrimary && this.processes > 1) {
            this.log(0, `Starting ${this.processes} threads.`);
            // Vars.
            let active_threads = 0;
            const thread_ids = {};
            const restart_limiters = {};
            // Start thread.
            const start_thread = (thread_id, restart = false) => {
                // Fork.
                const worker = libcluster.fork();
                // Log.
                log(restart ? 0 : 1, `Starting thread ${worker.process.pid}.`);
                // Cache thread id.
                thread_ids[worker.process.pid] = thread_id;
                // Increment active threads.
                ++active_threads;
            };
            // Fork workers.
            for (let i = 0; i < this.processes; i++) {
                // Generate thread id.
                let thread_id;
                while ((thread_id = vlib.String.random(8)) && Object.values(thread_ids).includes(thread_id)) { }
                // Create limiter.
                restart_limiters[thread_id] = new vlib.TimeLimiter({ limit: 3, duration: 60 * 1000 });
                // Start thread.
                start_thread(thread_id);
            }
            // Save status.
            await this._sys_db.save("status", {
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
                error(`Thread ${worker.process.pid} crashed.`);
                // Restart with limit.
                const limiter = restart_limiters[thread_id];
                if (limiter != null && limiter.limit()) {
                    --active_threads;
                    start_thread(thread_id, true);
                }
                // Reached limit, shutdown thread.
                else {
                    error(`Thread ${worker.process.pid} is being shut down due too its periodic restart limit.`);
                    --active_threads;
                    await this._sys_db.save("status", { running_threads: active_threads });
                    if (active_threads === 0) {
                        error(`All threads died, stopping server.`);
                        process.exit(0);
                    }
                }
            });
        }
        else {
            forked = this.production && this.multiprocessing;
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
                        log(0, `Running on http://${this.ip}:${this.port} and https://${this.ip}:${this.https_port}.`);
                    }
                    else {
                        log(0, `Running on http://${this.ip}:${this.port}.`);
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
            process.on('SIGTERM', () => process.exit(0));
            process.on('SIGINT', () => process.exit(0));
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
    /*  @docs:
     *  @title: On start
     *  @description:
     *      Add an (async) callback which will be executed at the end of `server.start()`.
     *      The callback may take arguments `({forked <boolean>})`.
     *  @usage:
     *      ...
     *      server.on_start(({forked}) => console.log("Hello World!"));
     */
    on_start(callback) {
        this._on_start.append(callback);
    }
    // Stop the server.
    /*  @docs:
     *  @title: Stop
     *  @description:
     *      Stop the server.
     *  @usage:
     *      ...
     *      server.stop();
     */
    async stop() {
        log(0, "Stopping the server...");
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
        // Stop view source file watcher.
        if (this._stop_tscompiler_watcher) {
            log(0, "Stopping typescript watcher.");
            this._stop_tscompiler_watcher();
        }
        // Stop sockets.
        if (this.https) {
            await this.https.close();
        }
        if (this.http) {
            await this.http.close();
        }
        if (this.db) {
            await this.db.close();
        }
        // Stop the logger.
        logger.stop();
        // setTimeout(() => {
        //     thread_monitor.dump_active_resources({
        //         // min_age: 5000,
        //         // exclude_types: ['TIMERWRAP'],
        //         include_internal: false
        //     });
        // }, 6000);
    }
    /*  @docs:
     *  @title: On stop
     *  @description:
     *      Set an (async) callback which will be executed at the start of `server.stop()`.
     *  @usage:
     *      ...
     *      server.on_stop(() => console.log("Hello World!"));
     */
    on_stop(callback) {
        this._on_stop.append(callback);
    }
    // Fetch status.
    /*  @docs:
        @title: Fetch status.
        @desc: This function is meant to be used when the server is in production mode, it will make an API request to your server through the defined `Server.domain` parameter.
        @note: This function can be called without initializing the server.
        @param:
            @name: type
            @desc: The wanted output type. Either an `object` or a `string` type for CLI purposes.
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
    /*  @docs:
     *  @title: Add CSP
     *  @description: Add an url to the Content-Security-Policy. This function does not overwrite the existing key's value.
     *  @warning: This function no longer has any effect when `Server.start()` has been called.
     *  @parameter:
     *      @name: key
     *      @description: The Content-Security-Policy key, e.g. `script-src`.
     *      @type: string
     *  @parameter:
     *      @name: value
     *      @description: The value to add to the Content-Security-Policy key.
     *      @type: null, string, string[]
     *  @usage:
     *      ...
     *      server.add_csp("script-src", "somewebsite.com");
     *      server.add_csp("upgrade-insecure-requests");
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
    /*  @docs:
     *  @title: Remove CSP
     *  @description: Remove an url from the Content-Security-Policy. This function does not overwrite the existing key's value.
     *  @warning: This function no longer has any effect when `Server.start()` has been called.
     *  @parameter:
     *      @name: key
     *      @description: The Content-Security-Policy key, e.g. `script-src`.
     *      @type: string
     *  @parameter:
     *      @name: value
     *      @description: The value to remove from the Content-Security-Policy key.
     *      @type: null, string
     *  @usage:
     *      ...
     *      server.remove_csp("script-src", "somewebsite.com");
     *      server.remove_csp("upgrade-insecure-requests");
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
    /*  @docs:
     *  @title: Delete CSP
     *  @description: Delete an key from the Content-Security-Policy.
     *  @warning: This function no longer has any effect when `Server.start()` has been called.
     *  @parameter:
     *      @name: key
     *      @description: The Content-Security-Policy key, e.g. `script-src`.
     *      @type: string
     *  @usage:
     *      ...
     *      server.del_csp("script-src");
     *      server.del_csp("upgrade-insecure-requests");
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
            throw Error(`Key path "${key.str()}" already exists, remove the file manually to continue.`);
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
                "\"" +
                    "/C=" + country_code +
                    "/ST=" + province +
                    "/L=" + city +
                    "/O=" + name +
                    "/OU=" + organization_unit +
                    "/CN=" + domain +
                    "\""
            ],
            opts: { stdio: "inherit" },
        });
        if (proc.exit_status != 0) {
            throw Error(`Encountered an error while generating the CSR [${proc.exit_status}]: ${proc.err}`);
        }
        log(0, `Generated the tls key with CSR for domain "${this.domain}".`);
    }
    // ---------------------------------------------------------
    // Endpoints.
    // private registered_routes: Map<string, Array<string | RegExp>> = new Map();
    /**
     * Registers a new method+endpoint pair, throwing if it already exists.
     * @param method    HTTP method
     * @param endpoint  String path or RegExp
     */
    _register_endpoint(method, endpoint) {
        if (!(endpoint instanceof RegExp)) {
            const e = this._find_endpoint(method, endpoint);
            if (e) {
                throw new Error(`Duplicate "${method}:${endpoint}" endpoint route, it is already defined by endpoint "${e.id}".`);
            }
        }
    }
    // Add one or multiple endpoints.
    /*  @docs:
        @title: Add endpoint(s)
        @description: Add one or multiple endpoints.
        @parameter:
            @name: ...endpoints
            @description:
                The endpoint parameters.

                An endpoint parameter can either be a `Endpoint` class or an `object` with the `Endpoint` arguments.
            @type: Endpoint, object
        */
    endpoint(...endpoints) {
        for (let i = 0; i < endpoints.length; i++) {
            // Skip.
            if (endpoints[i] == null) {
                continue;
            }
            // Is array of endpoints.
            if (Array.isArray(endpoints[i])) {
                this.endpoint(...endpoints[i]);
                continue;
            }
            // Initialize endpoint.
            let init_endpoint = endpoints[i];
            if (!(init_endpoint instanceof Endpoint)) {
                init_endpoint._server = this;
                init_endpoint = new Endpoint(init_endpoint);
            }
            const endpoint = init_endpoint;
            // Build view.
            if (endpoint.view != null) {
                if (endpoint.view.meta == null) {
                    endpoint.view.meta = this.meta.copy();
                }
                else if (typeof endpoint.view.meta === "object" && !(endpoint.view.meta instanceof Meta)) {
                    endpoint.view.meta = new Meta(endpoint.view.meta);
                }
            }
            // Register endpoint.
            this._register_endpoint(endpoint.route.method, endpoint.route.endpoint);
            // Add endpoint.
            this.endpoints.set(endpoint.route.id, endpoint);
        }
        return this;
    }
    // Add an error endpoint.
    /*  @docs:
        @title: Add error endpoint
        @description:
            Add an endpoint per error status code.
        @parameter:
            @name: status_code
            @type: number
            @description:
                The status code of the error.

                The supported status codes are:
                * `404`
                * `400` (Will not be used when the endpoint uses an API callback).
                * `403`
                * `404`
                * `500`
        @parameter:
            @name: endpoint
            @description:
                The endpoint parameters.

                An endpoint parameter can either be a `Endpoint` class or an `object` with the `Endpoint` arguments.
            @type: Endpoint, object
    */
    error_endpoint(status_code, endpoint) {
        this.err_endpoints.set(status_code, endpoint instanceof Endpoint ? endpoint : new Endpoint({ ...endpoint, _server: this }));
        return this;
    }
    // ---------------------------------------------------------
    // Functions.
    // Send a mail.
    /*  @docs:
     *  @title: Send Mail
     *  @description: Send one or multiple mails.
     *  @note: Make sure the domain's DNS records SPF and DKIM are properly configured when sending attachments.
     *  @return:
     *      Returns a promise that will be resolved or rejected when the mail has been sent.
     *  @parameter:
     *      @name: sender
     *      @description:
     *          The sender address.
     *          A sender address may either be a string with the email address, e.g. `your@email.com`.
     *          Or an array with the sender name and email address, e.g. `["Sender", "your@email.com"]`.
     *      @type: string, array
     *  @parameter:
     *      @name: recipients
     *      @description:
     *          The recipient addresses.
     *          A reciepient address may either be a string with the email address, e.g. `your@email.com`.
     *          Or an array with the sender name and email address, e.g. `["Sender", "your@email.com"]`.
     *      @type: array[string, array]
     *  @parameter:
     *      @name: subject
     *      @description: The subject text.
     *      @type: string
     *  @parameter:
     *      @name: body
     *      @description: The body text.
     *      @type: string
     *  @parameter:
     *      @name: attachments
     *      @description: An array with absolute file paths for attachments, or an array with nodemailer attachment objects.
     *      @type: array[string], array[object]
     *  @usage:
     *      ...
     *      await server.send_mail({
     *          sender: ["Sender Name", "sender\@email.com"],
     *          recipients: [
     *              ["Recipient Name", "recipient1\@email.com"],
     *              "recipient2\@email.com",
     *          },
     *          subject: "Example Mail",
     *          body: "Hello World!",
     *          attachments: ["/path/to/image.png"]
     *      });
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
    /*  @docs:
     *  @title: On delete user
     *  @description: This function can be overridden with a callback for when a user is deleted.
     *  @parameter:
     *      @name: uid
     *      @description: The uid of the deleted user.
     *      @type: string, array
     *  @usage:
     *      ...
     *      server.on_delete_user = ({uid}) => {}
     */
    async on_delete_user({ uid }) { }
    // On successfull one-time payment.
    // This gets called for every product in the payment.
    async on_payment({ product, payment }) { }
    // On successfull subscription.
    // This gets called for every product in the payment.
    async on_subscription({ product, payment }) { }
    // On failed one-time or recurring payment.
    // async on_failed_payment({ payment }: { payment: any }): Promise<void> {}
    // On successfull cancellation.
    async on_cancellation({ payment, line_items }) { }
    // On failed cancellation.
    // async on_failed_cancellation({ payment, line_items }: { payment: any; line_items: any[] }): Promise<void> {}
    // On successfull refund.
    // The line items array are the items were refunded.
    async on_refund({ payment, line_items }) { }
    // On failed refund.
    // The line items array are the items were the refund failed.
    async on_failed_refund({ payment, line_items }) { }
    // On chargeback.
    // The line items array are the items were charged back.
    async on_chargeback({ payment, line_items }) { }
    // On failed chargeback.
    // The line items array are the items were the chargeback failed.
    async on_failed_chargeback({ payment, line_items }) { }
    // Mail template.
    _mail_template({ max_width = 400, children = [], }) {
        const style = this.mail_style;
        const { Title, Text, Image, Table, TableRow, TableData, VStack } = Mail;
        // Create header.
        let header;
        if (this.company.stroke_icon != null) {
            header = [
                Image(`${this.full_domain}/${this.company.stroke_icon}`).height(16),
            ];
        }
        else if (this.company.icon != null) {
            header = [
                Image(`${this.full_domain}/${this.company.icon}`).frame(20, 40),
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
    _render_mail_payment_line_items({ payment, line_items, show_total_due = false }) {
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
        payment.line_items.iterate((item) => {
            if (typeof item.product === "string") {
                item.product = this.payments.get_product_sync(item.product);
            }
            if (currency == null) {
                const c = Utils.get_currency_symbol(item.product.currency);
                if (c == null) {
                    error(`Failed to create a payment mail: `, new Error(`Unable to determine the currency of payment "${payment.id}".`));
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
                TableRow(Text("A summary of your order can be found below or in the attachmed invoice pdf.")
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
                TableRow(Text("We regret to inform you that your payment has encountered an issue and could not be processed successfully. We understand the inconvenience this may cause. Please try again, please contact customer support if the problem persists.")
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
    on_cancellation_mail({ payment, line_items }) {
        // Shortcuts.
        const style = this.mail_style;
        const { Title, Text, Image, Table, TableRow, TableData, VStack } = Mail;
        // Create mail.
        return this._mail_template({
            max_width: 800,
            children: [
                // Title.
                TableRow(Title("Successfull Cancellation")
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
    on_refund_mail({ payment, line_items }) {
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
                TableRow(Text("A summary of your refundend products.")
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
export default Server;
