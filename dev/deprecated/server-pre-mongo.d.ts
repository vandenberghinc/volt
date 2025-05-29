export = Server;
declare class Server {
    static content_type_mimes: string[][];
    static compressed_extensions: string[];
    constructor({ ip, port, domain, statics, database, favicon, company, meta, tls, smtp, mail_style, payments, default_headers, google_tag, token_expiration, enable_2fa, enable_account_activation, production, file_watcher, }: {
        ip?: string | undefined;
        port?: number | undefined;
        domain?: null | undefined;
        statics?: never[] | undefined;
        database?: null | undefined;
        favicon?: null | undefined;
        company?: null | undefined;
        meta?: any;
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
        payments?: null | undefined;
        default_headers?: null | undefined;
        google_tag?: null | undefined;
        token_expiration?: number | undefined;
        enable_2fa?: boolean | undefined;
        enable_account_activation?: boolean | undefined;
        production?: boolean | undefined;
        file_watcher?: null | undefined;
    }, ...args: any[]);
    port: number;
    ip: string;
    favicon: any;
    enable_2fa: boolean;
    enable_account_activation: boolean;
    token_expiration: number;
    google_tag: any;
    production: boolean;
    company: any;
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
    domain: any;
    full_domain: string;
    statics: any[];
    database: any;
    meta: any;
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
        "X-XSS-Protection": string;
        "X-Content-Type-Options": string;
        "X-Frame-Options": string;
        "Strict-Transport-Security": string;
    };
    payments: any;
    endpoints: any[];
    file_watcher: any;
    smtp_sender: any;
    smtp: any;
    https: https.Server<typeof http.IncomingMessage, typeof http.ServerResponse> | undefined;
    http: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse> | undefined;
    max_uid: number | null;
    edit_max_uid_mutex: any;
    hash_key: any;
    _initialize_default_headers(): void;
    _iter_db_dir(subpath: any, callback: any): Promise<any>;
    _check_uid_within_range(uid: any): void;
    _sys_get_content_type(extension: any): any;
    _sys_generate_key(path: any): string;
    _sys_generate_crypto_key(length?: number): string;
    _sys_generate_2fa(): string;
    _sys_load_data_into_obj(path: any, obj?: {}, keys?: any[]): {};
    _sys_save_data_into_obj(path: any, obj: any, keys: any): void;
    _sys_save_uid_by_username(uid: any, username: any): void;
    _sys_delete_uid_by_username(username: any): void;
    _sys_save_uid_by_email(uid: any, email: any): void;
    _sys_delete_uid_by_email(email: any): void;
    _sys_load_user(uid: any): {};
    _sys_save_user(uid: any, user: any): void;
    _sys_load_detailed_user(uid: any): any;
    _sys_save_detailed_user(uid: any, data: any): void;
    _sys_delete_user(user: any): void;
    _sys_load_user_token(uid: any): {};
    _sys_save_user_token(uid: any, token: any): void;
    _sys_delete_user_token(uid: any): void;
    _sys_load_user_2fa(uid: any): {};
    _sys_save_user_2fa(uid: any, token: any): void;
    _sys_delete_user_2fa(uid: any): void;
    _sys_load_user_data(uid: any, subpath: any, def: any, privacy: any): any;
    _sys_save_user_data(uid: any, subpath: any, privacy: any): any;
    _sys_load_sys_data(subpath: any, def: any): any;
    _hmac(data: any): string;
    _verify_new_pass(pass: any, verify_pass: any): "Passwords do not match." | "The password should at least include eight characters." | "The password should at least include one capital letter." | "The password should at least include one numeric or special character." | undefined;
    _generate_token(uid: any): string;
    _authenticate(request: any): Promise<{
        status: any;
        data: string;
        headers?: undefined;
    } | {
        status: number;
        headers: {
            Location: string;
        };
        data: string;
    } | null>;
    _sign_in_response(response: any, uid: any): Promise<void>;
    _set_header_defaults(response: any): void;
    _create_token_cookie(response: any, token: any): void;
    _create_user_cookie(response: any, uid: any): Promise<void>;
    _create_detailed_user_cookie(response: any, uid: any): Promise<void>;
    _reset_cookies(response: any): void;
    _find_endpoint(endpoint: any, method?: null): any;
    _create_static_endpoints(base: any, dir: any): any[];
    _create_default_endpoints(): any[];
    _create_sitemap(): void;
    _create_robots_txt(): void;
    _initialize(): Promise<void>;
    _serve(request: any, response: any): Promise<any>;
    start(): Promise<null | undefined>;
    stop(exit?: boolean): null | undefined;
    add_csp(key: any, value?: null): void;
    remove_csp(key: any, value?: null): void;
    del_csp(key: any): void;
    endpoint(...endpoints: any[]): this;
    username_exists(username: any): Promise<any>;
    email_exists(email: any): Promise<any>;
    is_activated(uid: any): Promise<boolean>;
    set_activated(uid: any, activated: any): Promise<void>;
    create_user({ first_name, last_name, username, email, password, phone_number, }: {
        first_name: any;
        last_name: any;
        username: any;
        email: any;
        password: any;
        phone_number?: string | undefined;
    }): Promise<number | null>;
    delete_user(uid: any): Promise<void>;
    set_first_name(uid: any, first_name: any): Promise<void>;
    set_last_name(uid: any, last_name: any): Promise<void>;
    set_username(uid: any, username: any): Promise<void>;
    set_email(uid: any, email: any): Promise<void>;
    set_password(uid: any, password: any): Promise<void>;
    set_user(uid: any, user: any): Promise<void>;
    get_uid(username: any): Promise<number | null>;
    get_uid_by_email(email: any): Promise<number | null>;
    get_uid_by_api_key(api_key: any): Promise<number | null>;
    get_uid_by_token(token: any): Promise<number | null>;
    get_user(uid: any, detailed?: boolean): Promise<{}>;
    get_user_by_username(username: any): Promise<{}>;
    get_user_by_email(email: any): Promise<{}>;
    get_user_by_api_key(api_key: any): Promise<{}>;
    get_support_pin(uid: any): Promise<any>;
    get_user_by_token(token: any): Promise<{}>;
    load_user_data(uid: any, subpath: any, def?: null): Promise<any>;
    save_user_data(uid: any, subpath: any, data: any): Promise<void>;
    load_protected_user_data(uid: any, subpath: any, def?: null): Promise<any>;
    save_protected_user_data(uid: any, subpath: any, data: any): Promise<void>;
    load_private_user_data(uid: any, subpath: any, def?: null): Promise<any>;
    save_private_user_data(uid: any, subpath: any, data: any): Promise<void>;
    load_sys_data(subpath: any, def?: null): Promise<any>;
    save_sys_data(subpath: any, data: any): Promise<void>;
    generate_api_key(uid: any): Promise<string>;
    revoke_api_key(uid: any): Promise<void>;
    verify_password(uid: any, password: any): Promise<boolean>;
    verify_api_key(api_key: any): Promise<boolean>;
    verify_api_key_by_uid(uid: any, api_key: any): Promise<boolean>;
    verify_token(token: any): Promise<boolean>;
    verify_token_by_uid(uid: any, token: any): Promise<boolean>;
    verify_2fa(uid: any, code: any): Promise<boolean>;
    send_mail({ sender, recipients, subject, body, attachments, }: {
        sender?: null | undefined;
        recipients?: never[] | undefined;
        subject?: null | undefined;
        body?: string | undefined;
        attachments?: never[] | undefined;
    }): Promise<any>;
    send_2fa({ uid, request, expiration, _device, }: {
        uid: any;
        request: any;
        expiration?: number | undefined;
        _device?: null | undefined;
    }): Promise<any>;
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
import http = require("http");
import https = require("https");
