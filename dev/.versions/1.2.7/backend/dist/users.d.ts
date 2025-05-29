export = Users;
declare class Users {
    constructor(_server: any);
    server: any;
    avg_send_2fa_time: any[];
    _generate_code(length?: number): string;
    _generate_str(length?: number): string;
    _generate_uid(): Promise<string>;
    _generate_api_key(uid: any): string;
    _generate_token(uid: any): string;
    _verify_new_pass(pass: any, verify_pass: any): {
        error: string;
        invalid_fields: {
            password: string;
            verify_password: string;
        };
    } | {
        error: null;
        invalid_fields: null;
    };
    _create_token(uid: any): Promise<string>;
    _deactivate_token(uid: any): Promise<void>;
    _create_2fa_token(uid_or_email: any, expiration: any): Promise<string>;
    _deactivate_2fa_token(uid_or_email: any): Promise<void>;
    _authenticate(stream: any): Promise<{
        status: number;
        data: string;
        headers?: undefined;
    } | {
        status: number;
        headers: {
            Location: string;
        };
        data: string;
    } | null>;
    _sign_in_response(stream: any, uid: any): Promise<void>;
    _create_token_cookie(stream: any, token: any): void;
    _create_user_cookie(stream: any, uid: any): Promise<void>;
    _create_detailed_user_cookie(stream: any, uid: any): Promise<void>;
    _reset_cookies(stream: any): void;
    _initialize(): void;
    _tokens_db: any;
    _users_db: any;
    public: any;
    protected: any;
    private: any;
    uid_exists(uid: any): Promise<boolean>;
    username_exists(username: any): Promise<boolean>;
    email_exists(email: any): Promise<boolean>;
    is_activated(uid: any): Promise<boolean>;
    set_activated(uid: any, is_activated: any): Promise<any>;
    create({ first_name, last_name, username, email, password, phone_number, is_activated, _check_username_email, }: {
        first_name: any;
        last_name: any;
        username: any;
        email: any;
        password: any;
        phone_number?: string | undefined;
        is_activated?: null | undefined;
        _check_username_email?: boolean | undefined;
    }, ...args: any[]): Promise<string>;
    delete(uid: any): Promise<void>;
    set_first_name(uid: any, first_name: any): Promise<any>;
    set_last_name(uid: any, last_name: any): Promise<any>;
    set_username(uid: any, username: any): Promise<any>;
    set_email(uid: any, email: any): Promise<any>;
    set_password(uid: any, password: any): Promise<any>;
    set(uid: any, data: any): Promise<any>;
    get(uid: any): Promise<any>;
    get_by_username(username: any): Promise<any>;
    get_by_email(email: any): Promise<any>;
    get_by_api_key(api_key: any): Promise<any>;
    get_by_token(token: any): Promise<any>;
    get_uid(username: any): Promise<any>;
    get_uid_by_username(username: any): Promise<any>;
    get_uid_by_email(email: any): Promise<any>;
    get_uid_by_api_key(api_key: any): Promise<string | null>;
    get_uid_by_token(token: any): Promise<string | null>;
    get_support_pin(uid: any): Promise<any>;
    generate_api_key(uid: any): Promise<string>;
    revoke_api_key(uid: any): Promise<void>;
    verify_password(uid: any, password: any): Promise<boolean>;
    verify_api_key(api_key: any): Promise<boolean>;
    verify_api_key_by_uid(uid: any, api_key: any): Promise<boolean>;
    verify_token(token: any): Promise<boolean>;
    verify_token_by_uid(uid: any, token: any): Promise<boolean>;
    verify_2fa(uid: any, code: any): Promise<"Invalid UID." | "Invalid 2FA code." | "The 2FA code has expired." | "Unknown error." | null>;
    send_2fa({ uid, stream, expiration, _device, _username, _email, }: {
        uid: any;
        stream: any;
        expiration?: number | undefined;
        _device?: null | undefined;
        _username?: null | undefined;
        _email?: null | undefined;
    }): Promise<any>;
    list(): Promise<any>;
}
