/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */
import * as vlib from "@vandenberghinc/vlib";
// ---------------------------------------------------------
// Blacklist.
export class Blacklist {
    api_key;
    cache;
    constructor({ api_key, // honey pot api key
    _server, }) {
        // Checks.
        vlib.Scheme.validate(arguments[0], { strict: true, scheme: {
                api_key: "string",
            } });
        // Arguments.
        this.api_key = api_key;
        // Attributes.
        this.cache = new Map();
    }
    // Verify, returns true on allowed and false on not allowed.
    async verify(ip) {
        throw new Error("Deprecated");
        if (this.cache.has(ip)) {
            return this.cache.get(ip);
        }
        let result;
        await new Promise((resolve) => {
            // @ts-expect-error
            dns.resolveTxt(`${this.api_key}.${ip.split('.').reverse().join('.')}.dnsbl.httpbl.org`, (error, records) => {
                if (error) {
                    result = true;
                    console.error(error);
                }
                else {
                    result = true;
                    console.log(records);
                }
                resolve();
            });
        });
        this.cache.set(ip, result);
        return result;
    }
}
// ---------------------------------------------------------
// Exports.
module.exports = Blacklist;
