/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
export declare class Blacklist {
    private api_key;
    private cache;
    constructor({ api_key, }: {
        api_key: string;
    });
    verify(ip: string): Promise<boolean>;
}
