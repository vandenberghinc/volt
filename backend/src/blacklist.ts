/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */

import * as vlib from "@vandenberghinc/vlib";
import { Server } from "./server.js";

// ---------------------------------------------------------
// Blacklist.

export class Blacklist {

    private api_key: string;
    private cache: Map<string, boolean>;

    constructor({
    	api_key, // honey pot api key
	}: {
        api_key: string,
    }) {

		// Checks.
        vlib.schema.validate(arguments[0], {
            unknown: false, throw: true,
            schema: {
                api_key: "string",
            }
        });

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
