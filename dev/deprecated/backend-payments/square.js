/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 *
 * DEPRECATED
 */

// ---------------------------------------------------------
// Imports.

// ---------------------------------------------------------
// Square class.
// @todo check with the provider for how long refunds can be made, otherwise when a user's api key gets hacked all of the payments in history could be refunded, resulting in catastrophe.

class Square {
    constructor({
        api_key,
        application_id,
        location_id,
    }) {
        this.application_id = application_id;
        this.location_id = location_id;
        this.api_key = api_key;
        this.server = server;
        if (this.return_url.charAt(0) === "/") {
            this.return_url = `${this.server.full_domain}${this.return_url}`;
        }
        if (this.server.production && this.server.https === undefined) {
            throw Error("Accepting payments in production mode requires HTTPS.");
        }
    }
}

// ---------------------------------------------------------
// Exports.

module.exports = Square;