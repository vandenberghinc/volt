import * as http from "http";
import * as http2 from "http2";
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
import { Blacklist } from "./blacklist.js";
import { logger } from "./logger.js";
declare global {
    type none = null | undefined;
}
export interface CompanyInfo {
    name: string;
    legal_name: string;
    street: string;
    house_number: string;
    postal_code: string;
    city: string;
    province: string;
    country: string;
    country_code: string;
    tax_id?: string;
    type?: string;
    icon?: string;
    icon_path?: string;
    stroke_icon?: string;
    stroke_icon_path?: string;
}
export interface TLSConfig {
    cert: string;
    key: string;
    ca?: string | null;
    passphrase?: string;
}
export interface MailStyle {
    font: string;
    title_fg: string;
    subtitle_fg: string;
    text_fg: string;
    button_fg: string;
    footer_fg: string;
    bg: string;
    widget_bg: string;
    widget_border: string;
    button_bg: string;
    divider_bg: string;
}
export interface RateLimitConfig {
    server?: {
        ip?: string | null;
        port?: number;
        https?: any | null;
    };
    client?: {
        ip?: string | null;
        port?: number;
        url?: string | null;
    };
}
export interface AdminConfig {
    password: string | null;
    ips: string[];
    tokens?: Array<{
        token: string;
        expiration: number;
    }>;
}
export interface TypeScriptConfig {
    compiler_opts: Record<string, any>;
    output?: string;
}
export interface StaticDirectory {
    path: string;
    endpoint?: string;
    cache?: number | boolean;
    endpoints_cache?: Record<string, boolean | number>;
    exclude?: Array<string | RegExp>;
}
export interface MailAttachment {
    filename: string;
    path?: string;
    content: any;
}
interface DatabaseCollections {
}
export declare class Server {
    static content_type_mimes: Array<[string, string]>;
    log: (level: number, ...args: any[]) => void;
    warn: (level: number, ...args: any[]) => void;
    error: (...errs: any[]) => void;
    static compressed_extensions: string[];
    ip: string;
    port: number;
    https_port: number;
    domain: string;
    full_domain: string;
    source: vlib.Path;
    is_primary: boolean;
    statics: Array<string | StaticDirectory | vlib.Path>;
    statics_aspect_ratios: Map<string | RegExp, any>;
    favicon?: string;
    enable_2fa: boolean;
    enable_account_activation: boolean;
    token_expiration: number;
    google_tag?: string;
    production: boolean;
    multiprocessing: boolean;
    processes: number;
    company: CompanyInfo;
    meta: Meta;
    mail_style: MailStyle;
    online: boolean;
    offline: boolean;
    private _keys;
    additional_sitemap_endpoints: string[];
    log_level: number;
    tls?: TLSConfig;
    lightweight: boolean;
    performance: vlib.Performance;
    csp: Record<string, string>;
    default_headers: Record<string, string>;
    http: http.Server;
    https: http2.Http2SecureServer;
    endpoints: Map<string, Endpoint>;
    err_endpoints: Map<number, Endpoint>;
    db: Database & DatabaseCollections;
    _sys_db: Collection;
    storage: Collection;
    smtp?: nodemailer.Transporter;
    smtp_sender?: string | [string, string];
    rate_limit?: RateLimitServer | RateLimitClient;
    blacklist?: Blacklist;
    private _hash_key;
    keys: Record<string, string>;
    private _on_start;
    private _on_initialize;
    private _on_stop;
    daemon?: vlib.Daemon;
    private _stop_tscompiler_watcher?;
    users: Users;
    payments: Paddle;
    status: typeof Status;
    rate_limits: typeof RateLimits;
    logger: typeof logger;
    constructor({ ip, port, // leave undefined for blank detection.
    domain, is_primary, source, database, statics, favicon, company, meta, tls, smtp, mail_style, rate_limit, keys, payments, default_headers, google_tag, token_expiration, enable_2fa, enable_account_activation, production, multiprocessing, processes, offline, additional_sitemap_endpoints, log_level, daemon, lightweight, }: {
        ip?: string;
        port?: number;
        domain: string;
        is_primary?: boolean;
        source: string;
        database?: string | Omit<ConstructorParameters<typeof Database>[0], "_server">;
        statics?: Array<string | vlib.Path | StaticDirectory>;
        favicon?: string;
        company: CompanyInfo;
        meta?: Meta | Record<string, any>;
        tls?: TLSConfig;
        smtp?: nodemailer.TransportOptions;
        mail_style?: Partial<MailStyle>;
        rate_limit?: false | RateLimitConfig;
        keys?: Array<string | {
            name: string;
            length: number;
        }>;
        payments?: any;
        default_headers?: Record<string, any>;
        google_tag?: string;
        token_expiration?: number;
        enable_2fa?: boolean;
        enable_account_activation?: boolean;
        production?: boolean;
        multiprocessing?: boolean;
        processes?: number;
        offline?: boolean;
        additional_sitemap_endpoints?: string[];
        log_level?: number;
        daemon?: Record<string, any> | boolean;
        lightweight?: boolean;
    });
    get_content_type(extension: string): string;
    set_log_level(level: number): void;
    generate_crypto_key(length?: number): string;
    hmac(key: string, data: string, algo?: string): string;
    _hmac(data: string): string;
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
    start(): Promise<void>;
    on_start(callback: ({ forked }: {
        forked: boolean;
    }) => void | Promise<void>): void;
    stop(): Promise<void>;
    on_stop(callback: () => void | Promise<void>): void;
    fetch_status(type?: "object" | "string"): Promise<string | Record<string, any>>;
    add_csp(key: string, value?: null | string | string[]): void;
    remove_csp(key: string, value?: null | string): void;
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
     * @param endpoint The endpoint or endpoint options to add.
     */
    endpoint<const S extends vlib.scheme.Infer.Scheme.S = {}>(endpoint: Endpoint<S> | Endpoint.Opts<S>): this;
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
    error_endpoint<const S extends vlib.scheme.Infer.Scheme.S = {}>(status_code: number, endpoint: Endpoint<S> | Endpoint.Opts<S>): this;
    send_mail({ sender, recipients, subject, body, attachments, }: {
        sender?: string | [string, string];
        recipients?: (string | [string, string])[];
        subject?: string;
        body?: string | Mail.MailElement;
        attachments?: (string | vlib.Path | MailAttachment)[];
    }): Promise<void>;
    on_delete_user({ uid }: {
        uid: string | string[];
    }): Promise<void>;
    on_payment({ product, payment }: {
        product: any;
        payment: any;
    }): Promise<void>;
    on_subscription({ product, payment }: {
        product: any;
        payment: any;
    }): Promise<void>;
    on_cancellation({ payment, line_items }: {
        payment: any;
        line_items: any[];
    }): Promise<void>;
    on_refund({ payment, line_items }: {
        payment: any;
        line_items: any[];
    }): Promise<void>;
    on_failed_refund({ payment, line_items }: {
        payment: any;
        line_items: any[];
    }): Promise<void>;
    on_chargeback({ payment, line_items }: {
        payment: any;
        line_items: any[];
    }): Promise<void>;
    on_failed_chargeback({ payment, line_items }: {
        payment: any;
        line_items: any[];
    }): Promise<void>;
    _mail_template({ max_width, children, }: {
        max_width?: number;
        children?: any[];
    }): any;
    _render_mail_payment_line_items({ payment, line_items, show_total_due }: {
        payment: any;
        line_items: any[];
        show_total_due?: boolean;
    }): any[];
    on_2fa_mail({ code, username, email, date, ip, device }: {
        code: string;
        username: string;
        email: string;
        date: string;
        ip: string;
        device: string;
    }): any;
    on_payment_mail({ payment }: {
        payment: any;
    }): any;
    on_failed_payment_mail({ payment }: {
        payment: any;
    }): any;
    on_cancellation_mail({ payment, line_items }: {
        payment: any;
        line_items: any[];
    }): any;
    on_failed_cancellation_mail({ payment }: {
        payment: any;
    }): any;
    on_refund_mail({ payment, line_items }: {
        payment: any;
        line_items: any[];
    }): any;
    on_failed_refund_mail({ payment, line_items }: {
        payment: any;
        line_items: any[];
    }): any;
    on_chargeback_mail({ payment, line_items }: {
        payment: any;
        line_items: any[];
    }): any;
    on_failed_chargeback_mail({ payment, line_items }: {
        payment: any;
        line_items: any[];
    }): any;
}
export default Server;
