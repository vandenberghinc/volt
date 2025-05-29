export = Server;
declare class Server {
    static content_type_mimes: string[][];
    static compressed_extensions: string[];
    constructor({ ip, port, domain, is_primary, source, database, statics, favicon, company, meta, tls, smtp, mail_style, rate_limit, keys, payments, default_headers, google_tag, token_expiration, enable_2fa, enable_account_activation, honey_pot_key, production, multiprocessing, processes, file_watcher, offline, additional_sitemap_endpoints, log_level, daemon, admin, }: {
        ip?: string | undefined;
        port?: number | undefined;
        domain?: null | undefined;
        is_primary?: boolean | undefined;
        source?: null | undefined;
        database?: string | undefined;
        statics?: never[] | undefined;
        favicon?: null | undefined;
        company?: {} | undefined;
        meta?: Meta | undefined;
        tls?: null | undefined;
        smtp?: null | undefined;
        mail_style?: {
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
        } | undefined;
        rate_limit?: {
            server: {
                ip: null;
                port: number;
                https: null;
            };
            client: {
                ip: null;
                port: number;
                url: null;
            };
        } | undefined;
        keys?: never[] | undefined;
        payments?: null | undefined;
        default_headers?: null | undefined;
        google_tag?: null | undefined;
        token_expiration?: number | undefined;
        enable_2fa?: boolean | undefined;
        enable_account_activation?: boolean | undefined;
        honey_pot_key?: null | undefined;
        production?: boolean | undefined;
        multiprocessing?: boolean | undefined;
        processes?: null | undefined;
        file_watcher?: {} | undefined;
        offline?: boolean | undefined;
        additional_sitemap_endpoints?: never[] | undefined;
        log_level?: number | undefined;
        daemon?: {} | undefined;
        admin?: {
            password: null;
            ips: never[];
        } | undefined;
    }, ...args: any[]);
    port: number;
    ip: string;
    is_primary: boolean;
    source: any;
    favicon: any;
    enable_2fa: boolean;
    enable_account_activation: boolean;
    token_expiration: number;
    google_tag: any;
    production: boolean;
    multiprocessing: boolean;
    processes: number;
    company: {};
    mail_style: {
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
    };
    offline: boolean;
    online: boolean;
    honey_pot_key: any;
    _keys: any[];
    additional_sitemap_endpoints: any[];
    log_level: number;
    tls: any;
    file_watcher: {};
    admin: {
        password: null;
        ips: never[];
    };
    performance: any;
    status(type?: string): Promise<any>;
    logger: any;
    rate_limits: {
        groups: Map<any, any>;
        add({ group, limit, interval, }: {
            group?: null | undefined;
            limit?: null | undefined;
            interval?: null | undefined;
        }): any;
    };
    domain: any;
    full_domain: string;
    statics: any[];
    statics_aspect_ratios: {};
    meta: Meta;
    csp: {
        "default-src": string;
        "img-src": string;
        "script-src": string;
        "style-src": string;
    };
    default_headers: {
        Vary: string;
        "Referrer-Policy": string;
        "Access-Control-Allow-Methods": string;
        "Access-Control-Allow-Origin": string;
        'Access-Control-Allow-Headers': string;
        'Access-Control-Allow-Credentials': string;
        "X-XSS-Protection": string;
        "X-Content-Type-Options": string;
        "X-Frame-Options": string;
        "Strict-Transport-Security": string;
    };
    payments: any;
    endpoints: Map<any, any>;
    err_endpoints: Map<any, any>;
    static_file_watcher: StaticFileWatcher;
    is_file_watcher: boolean;
    log: any;
    error: any;
    daemon: any;
    db: Database | undefined;
    users: Users | undefined;
    smtp_sender: any;
    smtp: any;
    rate_limit: RateLimitServer | RateLimitClient | undefined;
    blacklist: Blacklist | undefined;
    _hash_key: any;
    keys: {} | undefined;
    _on_start: any[];
    _on_stop: any[];
    get_content_type(extension: any): any;
    set_log_level(level: any): void;
    generate_crypto_key(length?: number): string;
    hmac(key: any, data: any, algo?: string): string;
    _hmac(data: any): string;
    hash(data: any, algo?: string): string;
    _init_default_headers(): void;
    _set_header_defaults(stream: any): void;
    _find_endpoint(endpoint: any, method?: null): any;
    _create_default_endpoints(): any[];
    _create_sitemap(): void;
    _create_robots_txt(): void;
    _create_admin_endpoint(): void;
    _initialize_statics(): Promise<any[]>;
    initialize(): Promise<void>;
    https: http2.Http2SecureServer | undefined;
    http: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse> | undefined;
    _sys_db: {
        name: any;
        col: any;
        uid_based: boolean;
        ttl: any;
        ttl_enabled: boolean;
        _process_doc(doc: any): any;
        _load_chunked(path: any, find_opts: any): Promise<import("bson").Document | null>;
        _save_chunked(path: any, content: any): Promise<void>;
        create_index({ keys, options, commit_quorum, forced }: {
            keys: any;
            options?: null | undefined;
            commit_quorum?: null | undefined;
            forced?: boolean | undefined;
        }): Promise<any>;
        find(query: any): Promise<any>;
        exists(path: any): Promise<boolean>;
        load(path: any, opts?: null): Promise<any>;
        save(path: any, content: any, opts?: null): Promise<any>;
        list(path: any, options?: {}): Promise<any>;
        list_query(query?: {}, options?: {}): Promise<any>;
        list_all(query?: {}, options?: {}): Promise<any>;
        delete(path: any, opts?: null): Promise<{
            deleteMany: {
                filter: any;
            };
            deleteOne?: undefined;
        } | {
            deleteOne: {
                filter: any;
            };
            deleteMany?: undefined;
        } | undefined>;
        delete_query(query?: {}): Promise<any>;
        delete_all(path: any): Promise<void>;
        delete_recursive(path: any, uid?: null): Promise<any>;
        delete_collection(): Promise<void>;
        clean(doc: any): any;
        bulk_operations(operations?: any[]): Promise<any>;
    } | undefined;
    storage: {
        name: any;
        col: any;
        uid_based: boolean;
        ttl: any;
        ttl_enabled: boolean;
        _process_doc(doc: any): any;
        _load_chunked(path: any, find_opts: any): Promise<import("bson").Document | null>;
        _save_chunked(path: any, content: any): Promise<void>;
        create_index({ keys, options, commit_quorum, forced }: {
            keys: any;
            options?: null | undefined;
            commit_quorum?: null | undefined;
            forced?: boolean | undefined;
        }): Promise<any>;
        find(query: any): Promise<any>;
        exists(path: any): Promise<boolean>;
        load(path: any, opts?: null): Promise<any>;
        save(path: any, content: any, opts?: null): Promise<any>;
        list(path: any, options?: {}): Promise<any>;
        list_query(query?: {}, options?: {}): Promise<any>;
        list_all(query?: {}, options?: {}): Promise<any>;
        delete(path: any, opts?: null): Promise<{
            deleteMany: {
                filter: any;
            };
            deleteOne?: undefined;
        } | {
            deleteOne: {
                filter: any;
            };
            deleteMany?: undefined;
        } | undefined>;
        delete_query(query?: {}): Promise<any>;
        delete_all(path: any): Promise<void>;
        delete_recursive(path: any, uid?: null): Promise<any>;
        delete_collection(): Promise<void>;
        clean(doc: any): any;
        bulk_operations(operations?: any[]): Promise<any>;
    } | undefined;
    _serve(stream: any, headers: any, req: any, res: any): Promise<void>;
    start(): Promise<null | undefined>;
    on_start(callback: any): void;
    stop(): Promise<void>;
    on_stop(callback: any): void;
    add_csp(key: any, value?: null): void;
    remove_csp(key: any, value?: null): void;
    del_csp(key: any): void;
    generate_tls_key({ path, organization_unit, ec }: {
        path: any;
        organization_unit?: string | undefined;
        ec?: boolean | undefined;
    }): Promise<void>;
    endpoint(...endpoints: any[]): this;
    error_endpoint(status_code: any, endpoint: any): this;
    send_mail({ sender, recipients, subject, body, attachments, }: {
        sender?: null | undefined;
        recipients?: never[] | undefined;
        subject?: null | undefined;
        body?: string | undefined;
        attachments?: never[] | undefined;
    }): Promise<any>;
    on_delete_user({ uid }: {
        uid: any;
    }): Promise<void>;
    on_payment({ product, payment }: {
        product: any;
        payment: any;
    }): void;
    on_subscription({ product, payment }: {
        product: any;
        payment: any;
    }): void;
    on_failed_payment({ payment }: {
        payment: any;
    }): void;
    on_cancellation({ payment, line_items }: {
        payment: any;
        line_items: any;
    }): void;
    on_failed_cancellation({ payment, line_items }: {
        payment: any;
        line_items: any;
    }): void;
    on_refund({ payment, line_items }: {
        payment: any;
        line_items: any;
    }): void;
    on_failed_refund({ payment, line_items }: {
        payment: any;
        line_items: any;
    }): void;
    on_chargeback({ payment, line_items }: {
        payment: any;
        line_items: any;
    }): void;
    on_failed_chargeback({ payment, line_items }: {
        payment: any;
        line_items: any;
    }): void;
    _mail_template({ max_width, children, }: {
        max_width?: number | undefined;
        children?: never[] | undefined;
    }): any;
    _render_mail_payment_line_items({ payment, line_items, show_total_due }: {
        payment: any;
        line_items: any;
        show_total_due?: boolean | undefined;
    }): any[];
    on_2fa_mail({ code, username, email, date, ip, device }: {
        code: any;
        username: any;
        email: any;
        date: any;
        ip: any;
        device: any;
    }): any;
    on_payment_mail({ payment }: {
        payment: any;
    }): any;
    on_failed_payment_mail({ payment }: {
        payment: any;
    }): any;
    on_cancellation_mail({ payment, line_items }: {
        payment: any;
        line_items: any;
    }): any;
    on_failed_cancellation_mail({ payment }: {
        payment: any;
    }): any;
    on_refund_mail({ payment, line_items }: {
        payment: any;
        line_items: any;
    }): any;
    on_failed_refund_mail({ payment, line_items }: {
        payment: any;
        line_items: any;
    }): any;
    on_chargeback_mail({ payment, line_items }: {
        payment: any;
        line_items: any;
    }): any;
    on_failed_chargeback_mail({ payment, line_items }: {
        payment: any;
        line_items: any;
    }): any;
}
import Meta = require("./meta.js");
import { StaticFileWatcher } from "./file_watcher.js";
import Database = require("./database.js");
import Users = require("./users.js");
import { RateLimitServer } from "./rate_limit.js";
import { RateLimitClient } from "./rate_limit.js";
import Blacklist = require("./blacklist.js");
import http2 = require("http2");
import http = require("http");
