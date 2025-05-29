import { IncomingMessage, ServerResponse } from 'http';
import { ServerHttp2Stream, IncomingHttpHeaders, Http2ServerRequest, Http2ServerResponse } from 'http2';
export type Params = any;
export type Parameters = Params;
export declare class Stream {
    private s?;
    headers: IncomingHttpHeaders | IncomingMessage['headers'];
    private req?;
    private res?;
    http2: boolean;
    http1: boolean;
    private _ip;
    private _port;
    private _method;
    private _params;
    private _is_query_params;
    private _endpoint;
    private _query_string;
    private _cookies;
    private _uid;
    status_code: number | null;
    finished: boolean;
    private res_cookies;
    private res_headers;
    body: string;
    private promise;
    constructor(stream?: ServerHttp2Stream, headers?: IncomingHttpHeaders | IncomingMessage['headers'], req?: IncomingMessage | Http2ServerRequest, res?: ServerResponse | Http2ServerResponse);
    private _recv_body;
    private _parse_endoint;
    _parse_params(): Record<string, any> | undefined;
    private _parse_cookies;
    join(): Promise<void>;
    get ip(): string;
    get port(): number;
    get method(): string;
    get endpoint(): string;
    get params(): Record<string, any>;
    /** Add a param (used by the server backend for path parameters). */
    add_param(name: string, value: any): void;
    param<T = any>(name: string, type?: string | string[] | null, def?: any): T;
    get cookies(): Record<string, any>;
    get closed(): boolean;
    get destroyed(): boolean;
    get uid(): string | null;
    set uid(value: string | null);
    send({ status, headers, body, data, compress, }?: {
        status?: number;
        headers?: Record<string, any>;
        body?: any;
        data?: any;
        compress?: boolean;
    }): this;
    success({ status, headers, body, data, compress }?: {
        status?: number;
        headers?: Record<string, any>;
        body?: any;
        data?: any;
        compress?: boolean;
    }): this;
    error({ message, type, invalid_fields, status, headers, compress, data, }: {
        message: string;
        type?: string;
        invalid_fields?: Record<string, string>;
        status?: number;
        headers?: Record<string, any>;
        compress?: boolean;
        data?: any[] | Record<string, any>;
    }): this;
    set_header(name: string, value: any): this;
    set_headers(headers?: Record<string, any>): this;
    remove_header(...names: string[]): this;
    remove_headers(...names: string[]): this;
    set_cookie(cookie: string): this;
    set_cookies(...cookies: string[]): this;
}
export type AuthStream = Stream & {
    get uid(): string;
};
export default Stream;
