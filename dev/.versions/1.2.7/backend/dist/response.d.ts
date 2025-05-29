export = Response;
declare class Response {
    constructor(res: any);
    res: any;
    cookies: any[];
    cork: any;
    end: any;
    uncork: any;
    write: any;
    add_trailers: any;
    flush_headers: any;
    get_header: any;
    get_header_names: any;
    get_headers: any;
    has_header: any;
    remove_header: any;
    set_header: any;
    set_timeout: any;
    send({ status, headers, data, compress }?: {
        status?: number | undefined;
        headers?: {} | undefined;
        data?: null | undefined;
        compress?: boolean | undefined;
    }): void;
    success({ status, headers, data, compress }?: {
        status?: number | undefined;
        headers?: {} | undefined;
        data?: null | undefined;
        compress?: boolean | undefined;
    }): void;
    error({ status, headers, data, compress }?: {
        status?: number | undefined;
        headers?: {} | undefined;
        data?: null | undefined;
        compress?: boolean | undefined;
    }): void;
    set_headers(headers?: {}): null | undefined;
    set_cookie(cookie: any): void;
    set_cookies(cookies: any): void;
    set headers_sent(val: any);
    get headers_sent(): any;
    set send_date(val: any);
    get send_date(): any;
    set status_code(val: any);
    get status_code(): any;
    set status_message(val: any);
    get status_message(): any;
    set strict_content_length(val: any);
    get strict_content_length(): any;
    set writable_ended(val: any);
    get writable_ended(): any;
    get finished(): any;
    set writable_finished(val: any);
    get writable_finished(): any;
}
