export declare class Blacklist {
    private api_key;
    private cache;
    constructor({ api_key, // honey pot api key
    _server, }: {
        api_key: string;
        _server: any;
    });
    verify(ip: string): Promise<boolean>;
}
