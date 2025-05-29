/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Blacklist.

export class Blacklist {
    constructor({
    	api_key = null,
		_server,
	}: {
        api_key: string,
        _server: any,
    }) {

		// Checks.
		vlib.scheme.verify({object: arguments[0], check_unknown: true, scheme: {
            api_key: "string",
        }});

		// Arguments.
		this.api_key = api_key;

		// Attributes.
		this.cache = new Map();
    }

    // Verify, returns true on allowed and false on not allowed.
    async verify(ip: string): Promise<boolean> {

    	if (this.cache.has(ip)) {
    		return this.cache.get(ip);
    	}
    	let result;
        await new Promise((resolve) => {
            dns.resolveTxt(
                `${this.honey_pot_key}.${ip.split('.').reverse().join('.')}.dnsbl.httpbl.org`,
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
