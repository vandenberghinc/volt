/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

import * as vlib from "@vandenberghinc/vlib";

// ---------------------------------------------------------
// Blacklist.

export class Blacklist {

    private api_key: string;
    private cache: Map<string, boolean>;

    constructor({
    	api_key, // honey pot api key
		_server,
	}: {
        api_key: string,
        _server: any,
    }) {

		// Checks.
		vlib.Scheme.verify({object: arguments[0], check_unknown: true, scheme: {
            api_key: "string",
        }});

		// Arguments.
		this.api_key = api_key;

		// Attributes.
		this.cache = new Map();
    }

    // Verify, returns true on allowed and false on not allowed.
    async verify(ip: string): Promise<boolean> {

        throw new Error("Deprecated");

    	if (this.cache.has(ip)) {
    		return this.cache.get(ip) as boolean;
    	}
    	let result;
        await new Promise<void>((resolve) => {
            // @ts-expect-error
            dns.resolveTxt(
                `${this.api_key}.${ip.split('.').reverse().join('.')}.dnsbl.httpbl.org`,
                (error, records) => {
                    if (error) {
                        result = true;
                        console.error(error);
                    } else {
                    	result = true;
                        console.log(records);
                    }
                    resolve();
                },
            );
        })
        this.cache.set(ip, result);
        return result;
    }
}

// ---------------------------------------------------------
// Exports.

module.exports = Blacklist;
