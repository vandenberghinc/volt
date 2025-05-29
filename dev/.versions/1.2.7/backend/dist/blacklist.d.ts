export = Blacklist;
declare class Blacklist {
    constructor({ api_key, _server, }: {
        api_key?: null | undefined;
        _server: any;
    }, ...args: any[]);
    api_key: any;
    cache: Map<any, any>;
    verify(ip: any): Promise<any>;
}
