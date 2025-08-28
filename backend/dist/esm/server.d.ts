import * as nodemailer from 'nodemailer';
import * as vlib from "@vandenberghinc/vlib";
import { Meta } from './meta.js';
import * as Mail from './plugins/mail/ui.js';
import { Status } from "./status.js";
import { Endpoint } from "./endpoint.js";
import { Database } from "./database/database.js";
import { Collection } from "./database/collection.js";
import { Users } from "./users.js";
import { Paddle } from "./payments/paddle.js";
import { RateLimits, RateLimitServer, RateLimitClient } from "./rate_limit.js";
/** Company profile information used in invoices, emails, and branding. */
export interface CompanyInfo {
    /** The name of your company. */
    name: string;
    /** The legal name of your company. */
    legal_name: string;
    /** The street name of your company's address. */
    street: string;
    /** The house number or house name of your company's address. */
    house_number: string;
    /** The postal/zip code of your company's address. */
    postal_code: string;
    /** The city of your company's address. */
    city: string;
    /** The province or state of your company's address. */
    province: string;
    /** The country name of your company's address. */
    country: string;
    /** The two-letter ISO country code of your company's location. */
    country_code: string;
    /** The tax ID of your company. */
    tax_id?: string;
    /** The type of company. */
    type?: string;
    /** The endpoint URL path of your company's icon (PNG). Must be an endpoint URL since access to the file path is also required for creating invoices. */
    icon?: string;
    /** The endpoint URL path of your company's stroke icon (PNG). In payment invoices the stroke icon precedes the default icon. Must be an endpoint URL since access to the file path is also required for creating invoices. */
    stroke_icon?: string;
    /** The file path of your company's icon (PNG), automatically retrieved from the {@link CompanyInfo.icon} property when possible. */
    icon_path?: string;
    /** The file path of your company's stroke icon (PNG), automatically retrieved from the {@link CompanyInfo.stroke_icon} property when possible. */
    stroke_icon_path?: string;
}
/** TLS certificate configuration for enabling HTTPS. */
export interface TLSConfig {
    /** The path to the certificate. */
    cert: string;
    /** The path to the private key file. */
    key: string;
    /** The path to the CA bundle file. */
    ca?: string | null;
    /** The passphrase of the private key. */
    passphrase?: string;
}
/** Style tokens used to theme automatically generated emails. */
export interface MailStyle {
    /** The font family. */
    font: string;
    title_fg: string;
    subtitle_fg: string;
    text_fg: string;
    /** The background color of the buttons in your mails. */
    button_fg: string;
    footer_fg: string;
    bg: string;
    widget_bg: string;
    widget_border: string;
    button_bg: string;
    divider_bg: string;
}
/** Optional administrator configuration for protected endpoints. */
export interface AdminConfig {
    password: string | null;
    ips: string[];
    tokens?: Array<{
        token: string;
        expiration: number;
    }>;
}
/** TypeScript build options for endpoint source generation. */
export interface TypeScriptConfig {
    compiler_opts: Record<string, any>;
    output?: string;
}
/** Description of a static directory or file that should be served. */
export interface StaticDirectory {
    /** The path to the static directory or file. */
    path: string;
    /** The base endpoint of the static directory, by default the path's name will be used.*/
    endpoint?: string;
    /** Enable caching for the static endpoints; this value will be used for parameter `Endpoint.cache`. */
    cache?: number | boolean;
    /** Define a specific cache policy per endpoint from this static directory as `{<endpoint>: <cache>}`; the cache value will be used for parameter `Endpoint.cache`. */
    endpoints_cache?: Record<string, boolean | number>;
    /** An array of paths to exclude. The array may contain regexes. */
    exclude?: Array<string | RegExp>;
}
/** Attachment representation when sending emails. */
export interface MailAttachment {
    filename: string;
    path?: string;
    content: any;
}
/**
 * A definition of a registered endpoint, can be used to export params and response types to the frontend.
 * @prop params The inferred interface of the endpoint parameters, note that the runtime value of this property is always `undefined`.
 * @prop Params Alias for property {@link RegisteredEndpoint.params}.
 */
export type RegisteredEndpoint<P extends vlib.Schema.Entries.Opts = {}> = {
    params: vlib.Schema.Entries.Infer<P>;
    Params: vlib.Schema.Entries.Infer<P>;
};
/** The payment options. */
export type PaymentOpts = (Paddle.Opts & {
    /** The payment provider type. */
    type: "paddle";
});
/** Nested types for the {@link Server} class. */
export declare namespace Server {
    /** Key options for the {@link Server.Opts} interface. */
    interface KeyOpts {
        /** The name of the key. */
        name: string;
        /** The length of the key. */
        length: number;
    }
    /** Constructor options. */
    interface Opts {
        /** Whether the server is in production mode or in development mode. */
        production?: boolean;
        /** The IP address where the server will run. */
        ip?: string;
        /** The port where the server will run. Leave `null` to run on port `80` for HTTP and `443` for HTTPS. */
        port?: number;
        /** The full domain url without `http://` or `https://`. */
        domain: string;
        /** Used to indicate if the current server is the primary node. */
        is_primary?: boolean;
        /** The path to a persistent directory where some files such as logs, status info etc will be saved. */
        source: string;
        /** The database settings, see {@link Database.Opts}. */
        database: string | Database.Opts;
        /** Array with paths to static directories or static directory objects, see {@link StaticDirectory}. */
        statics?: Array<string | vlib.Path | StaticDirectory>;
        /** The path to the favicon. */
        favicon?: string;
        /** Your company information, see {@link CompanyInfo}. */
        company: CompanyInfo;
        /** The default meta object. */
        meta?: Meta | Meta.Opts;
        /** The TLS settings for HTTPS, see {@link TLSConfig}. */
        tls?: TLSConfig;
        /**
         * The SMTP nodemailer arguments object.
         * More information can be found at the nodemailer documentation.
         * @attr sender The SMTP sender address; either a string email, e.g. `your@email.com`, or `[name, email]`.
         * @attr host The mail server's host address.
         * @attr port The mail server's port.
         * @attr secure Enable secure options.
         * @attr auth The authentication settings.
         * @attr auth.user The email used for authentication.
         * @attr auth.pass The password used for authentication.
         */
        smtp?: {
            /** The SMTP sender address; either a string email, e.g. `your@email.com`, or`[name, email]`. */
            sender: string | [string, string];
            /** The mail server's host address. */
            host?: string;
            /** The mail server's port. */
            port?: number;
            /** Enable secure options. */
            secure?: boolean;
            /** The authentication settings. */
            auth?: {
                /** The email used for authentication. */
                user: string;
                /** The password used for authentication. */
                pass: string;
            };
            /** The smtp `nodemailer.createTransport` argument that override the other {@link Server.Opts.smtp} options. */
            override?: nodemailer.TransportOptions;
        };
        /** The mail settings to customize automatically generated mails, see {@link MailStyle}. */
        mail_style?: Partial<MailStyle>;
        /**
         * The rate limit server and client settings. Rate limiting works with a centralizer websocket server and secondary clients.
         * By default rate limiting is enabled but can be disabled by explicitly setting `rate_limit` to `false`.
         */
        rate_limit?: false | {
            /** The primary server rate limit settings. */
            server?: RateLimitServer.Opts;
            /** The rate limit client settings. */
            client?: RateLimitClient.Opts;
        };
        /** An array with names of crypto keys. Keys will be generated and stored in the database when they do not exist, and accessible as `Server.keys.$name`. Items may be a string (name) or an object with `name` and `length`, see {@link Server.KeyOpts}. */
        keys?: (string | Server.KeyOpts)[];
        /** The arguments for the payment class, see {@link PaymentOpts}. */
        payments?: PaymentOpts;
        /** Override the default headers generated by volt. Leave `default_headers` undefined to let volt automatically generate default headers. */
        default_headers?: Record<string, any>;
        /** The Google Tag ID. */
        google_tag?: string;
        /** Additional options for managing the {@link Users} class. */
        users?: Users.Opts;
        /** Enable threading behaviour when in production mode. */
        threading?: false | true | {
            /** Wether to enable threading behaviour. */
            enabled: boolean;
            /** The number of processes when threading is enabled. By default, the number of CPU's will be used. */
            threads?: number;
        };
        /** Boolean indicating if the development server is being run offline. */
        offline?: boolean;
        /**
         * Additional endpoints to add to the sitemap. By default all endpoints where attribute `view` is defined are added.
         * @note Regex based endpoints are not added to the default sitemap so they should perhaps they should partially be included here.
        */
        additional_sitemap_endpoints?: string[];
        /**
         * Optional settings for the service daemons. Pass `false` to disable, see {@link vlib.Daemon.Opts}.
         * The {@link vlib.Daemon.Opts.name} field will be defined with a default value of `domain.replaceAll(".", "")`.
         * The {@link vlib.Daemon.Opts.logs}, {@link vlib.Daemon.Opts.errors} fields will be defined with a default value of `<source>/daemon/<name>`.
         */
        daemon?: false | vlib.Types.Optional<vlib.Daemon.Opts, "name">;
        /** The active log level. */
        log_level?: number;
    }
}
/**
 * The backend server class.
 *
 * When the HTTPS parameters `certificate` and `private_key` are defined, the server will run automatically on HTTP and HTTPS.
 *
 * @property users The initialized {@link Users} instance.
 */
export declare class Server {
    /** Content type per mime. */
    static content_type_mimes: Map<string, string>;
    /** All file path extensions that are already compressed. */
    static compressed_extensions: Set<string>;
    /** The binded ip address. */
    ip: string;
    /** The binded http port. */
    port: number;
    /** The binded https port. */
    https_port: number;
    /** The raw domain. */
    domain: string;
    /** The full domain name with http/https depending if tls is enabled. */
    full_domain: string;
    /** The persistent storage source directory. */
    source: vlib.Path;
    /** Is the primary thread. */
    is_primary: boolean;
    /** Is in production mode. */
    production: boolean;
    /** The company information. */
    company: CompanyInfo;
    /** The default meta information. */
    meta: Meta;
    /** Is running in offline mode. */
    offline: boolean;
    /** The database instance. */
    db: Database;
    /** The smpt mailer. */
    smtp?: nodemailer.Transporter;
    smtp_sender?: string | [string, string];
    /** The rate limit instance. */
    rate_limit?: RateLimitServer | RateLimitClient;
    /** The added endpoints. */
    endpoints: Map<string, Endpoint>;
    /** The added error endpoints. */
    err_endpoints: Map<number, Endpoint>;
    /** A record of keys used for hashing. */
    keys: Record<string, string>;
    /** Alias for the `Status` module. */
    status: typeof Status;
    /** Alias for the `RateLimits` module. */
    rate_limits: typeof RateLimits;
    /** The file logger. */
    log: vlib.logging.FileLogger;
    /** The users instance. */
    users: Users;
    /** The payments instance. */
    payments?: Paddle;
    /** Daemon instance to manage a live daemon. */
    daemon?: vlib.Daemon;
    _sys_db: Collection;
    mail_style: MailStyle;
    csp: Record<string, string>;
    statics_aspect_ratios: Map<string | RegExp, any>;
    google_tag?: string;
    private favicon?;
    private statics;
    private _keys;
    private additional_sitemap_endpoints;
    private tls?;
    private performance;
    private default_headers;
    private http;
    private https;
    private threading;
    /** The master hash key. */
    private _master_hash_key;
    /** User defined callbacks. */
    private _on_start;
    private _on_initialize;
    private _on_stop;
    constructor({ ip, port, // leave undefined for blank detection.
    domain, is_primary, source, database, statics, favicon, company, meta, tls, smtp, mail_style, rate_limit, keys, payments, default_headers, google_tag, users, production, threading, offline, additional_sitemap_endpoints, log_level, daemon, }: Server.Opts);
    /** Get a content type (MIME) from a file extension. */
    get_content_type(extension: string): string;
    /** Set the logging verbosity level. */
    set_log_level(level: number): void;
    /** Generate a cryptographically secure random key as a hex string. */
    generate_crypto_key(length?: number): string;
    /** Create an HMAC hash using the provided key and data. */
    hmac(key: string, data: string, algo?: string): string;
    /** Create an HMAC hash using the server's master hash key. */
    _hmac(data: string): string;
    /** Create a hash (no key) of the given data using the specified algorithm. */
    hash(data: string | object, algo?: string): string;
    private _init_default_headers;
    private _set_header_defaults;
    private _find_endpoint;
    private _create_default_endpoints;
    private _create_sitemap;
    private _create_robots_txt;
    private _initialize_statics;
    initialize(): Promise<void>;
    /**
     * Add callback to be called when the server is initialized.
     * @param callback The callback to be called when the server is initialized.
     */
    on_initialize(callback: () => void | Promise<void>): void;
    private _serve;
    /**
     * Start the server.
     * @example
     * ...
     * server.start();
     */
    start(): Promise<void>;
    /**
     * Add an (async) callback executed at the end of `server.start()`. The callback may take arguments `({forked <boolean>})`.
     * @param callback The callback to run; receives `{ forked }`.
     * @example
     * ...
     * server.on_start(({forked}) => console.log("Hello World!"));
     */
    on_start(callback: ({ forked }: {
        forked: boolean;
    }) => void | Promise<void>): void;
    /**
     * Stop the server.
     * @example
     * ...
     * server.stop();
     */
    stop(): Promise<void>;
    /**
     * Set an (async) callback which will be executed at the start of `server.stop()`.
     * @param callback The callback to run.
     * @example
     * ...
     * server.on_stop(() => console.log("Hello World!"));
     */
    on_stop(callback: () => void | Promise<void>): void;
    /**
     * This function is meant to be used when the server is in production mode, it will make an API request to your server through the defined `Server.domain` parameter.
     * @note This function can be called without initializing the server.
     * @param type The wanted output type. Either an `object` or a `string` type for CLI purposes.
     */
    fetch_status(type?: "object" | "string"): Promise<string | Record<string, any>>;
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
    add_csp(key: string, value?: null | string | string[]): void;
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
    remove_csp(key: string, value?: null | string): void;
    /**
     * Delete an key from the Content-Security-Policy.
     * @warning This function no longer has any effect when `Server.start()` has been called.
     * @param key The Content-Security-Policy key, e.g. `script-src`.
     * @example
     * ...
     * server.del_csp("script-src");
     * server.del_csp("upgrade-insecure-requests");
     */
    del_csp(key: string): void;
    generate_ssl_key({ output_path, ec, }: {
        output_path: string;
        ec?: boolean;
    }): Promise<void>;
    generate_csr({ output_path, key_path, name, domain, organization_unit, country_code, province, city, }: {
        output_path: string;
        key_path: string;
        name: string;
        domain: string;
        organization_unit: string;
        country_code: string;
        province: string;
        city: string;
    }): Promise<void>;
    /**
     * Checks if an endpoint route already exists.
     * @param method    HTTP method
     * @param endpoint  String path or RegExp
     */
    private _check_duplicate_route;
    /**
     * Add a single endpoint.
     * Only supports a single endpoint due to parameter inference.
     * @template Response User inputted response type that will be returned as response, optionaly typing used for consistency.
     * @template S system template for inferring the endpoint callback parameters.
     * @param endpoint The endpoint or endpoint options to add.
     * @returns A registered endpoint object that can for instance be used to infer the endpoint parameters.
     */
    endpoint<const S extends vlib.Schema.Entries.Opts = {}>(endpoint: Endpoint<S> | ConstructorParameters<typeof Endpoint<S>>[0]): RegisteredEndpoint<S>;
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
    error_endpoint<const S extends vlib.Schema.Entries.Opts = {}>(status_code: number, endpoint: Endpoint<S> | Endpoint.Opts<S>): this;
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
    send_mail({ sender, recipients, subject, body, attachments, }: {
        sender?: string | [string, string];
        recipients?: (string | [string, string])[];
        subject?: string;
        body?: string | Mail.MailElement;
        attachments?: (string | vlib.Path | MailAttachment)[];
    }): Promise<void>;
    /**
     * This function can be overridden with a callback for when a user is deleted.
     * @param uid The uid of the deleted user.
     * @example
     * ...
     * server.on_delete_user = ({uid}) => {}
     */
    on_delete_user({ uid }: {
        uid: string | string[];
    }): Promise<void>;
    /** Called for each product in a successful one-time payment. Override to implement your logic. */
    on_payment({ product, payment }: {
        product: any;
        payment: any;
    }): Promise<void>;
    /** Called for each product in a successful subscription. Override to implement your logic. */
    on_subscription({ product, payment }: {
        product: any;
        payment: any;
    }): Promise<void>;
    /** Called when a cancellation succeeds. Override to implement your logic. */
    on_cancellation({ payment, line_items }: {
        payment: any;
        line_items: any[];
    }): Promise<void>;
    /** Called when a refund succeeds. The line items array are the items that were refunded. */
    on_refund({ payment, line_items }: {
        payment: any;
        line_items: any[];
    }): Promise<void>;
    /** Called when a refund fails. The line items array are the items where the refund failed. */
    on_failed_refund({ payment, line_items }: {
        payment: any;
        line_items: any[];
    }): Promise<void>;
    /** Called when a chargeback occurs. The line items array are the items that were charged back. */
    on_chargeback({ payment, line_items }: {
        payment: any;
        line_items: any[];
    }): Promise<void>;
    /** Called when a chargeback fails. The line items array are the items where the chargeback failed. */
    on_failed_chargeback({ payment, line_items }: {
        payment: any;
        line_items: any[];
    }): Promise<void>;
    /** Build the base email layout used by the various transactional email builders. */
    _mail_template({ max_width, children, }: {
        max_width?: number;
        children?: any[];
    }): any;
    /** Helper that renders a list of payment line items for use in transactional emails. */
    _render_mail_payment_line_items({ payment, line_items, show_total_due }: {
        payment: any;
        line_items: any[];
        show_total_due?: boolean;
    }): any[];
    /** Build the 2FA verification email content. */
    on_2fa_mail({ code, username, email, date, ip, device }: {
        code: string;
        username: string;
        email: string;
        date: string;
        ip: string;
        device: string;
    }): any;
    /** Build the successful payment email content. */
    on_payment_mail({ payment }: {
        payment: any;
    }): any;
    /** Build the failed payment email content. */
    on_failed_payment_mail({ payment }: {
        payment: any;
    }): any;
    /** Build the successful cancellation email content. */
    on_cancellation_mail({ payment, line_items }: {
        payment: any;
        line_items: any[];
    }): any;
    /** Build the failed cancellation email content. */
    on_failed_cancellation_mail({ payment }: {
        payment: any;
    }): any;
    /** Build the successful refund email content. */
    on_refund_mail({ payment, line_items }: {
        payment: any;
        line_items: any[];
    }): any;
    /** Build the failed refund email content. */
    on_failed_refund_mail({ payment, line_items }: {
        payment: any;
        line_items: any[];
    }): any;
    /** Build the successful chargeback email content. */
    on_chargeback_mail({ payment, line_items }: {
        payment: any;
        line_items: any[];
    }): any;
    /** Build the failed chargeback email content. */
    on_failed_chargeback_mail({ payment, line_items }: {
        payment: any;
        line_items: any[];
    }): any;
}
