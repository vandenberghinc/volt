export namespace RateLimits {
    let groups: Map<any, any>;
    function add({ group, limit, interval, }: {
        group?: null | undefined;
        limit?: null | undefined;
        interval?: null | undefined;
    }): any;
}
export class RateLimitServer {
    static default_port: number;
    constructor({ port, ip, https, _server, }?: {
        port?: number | undefined;
        ip?: null | undefined;
        https?: null | undefined;
    }, ...args: any[]);
    ip: any;
    port: number;
    https_config: any;
    server: any;
    limits: Map<any, any>;
    start(): Promise<void>;
    ws: any;
    clear_caches_interval: NodeJS.Timeout | undefined;
    stop(): Promise<void>;
    limit(ip: any, groups?: {
        group: null;
        limit: null;
        interval: null;
    }[]): Promise<any>;
}
export class RateLimitClient {
    constructor({ ip, port, https, url, _server, }?: {
        ip?: null | undefined;
        port?: number | undefined;
        https?: boolean | undefined;
        url?: null | undefined;
    }, ...args: any[]);
    ip: string;
    port: number;
    https: boolean;
    url: any;
    server: any;
    start(): Promise<void>;
    ws: any;
    stop(): Promise<void>;
    limit(ip: any, groups?: {
        group: null;
        limit: null;
        interval: null;
    }[]): Promise<any>;
}
