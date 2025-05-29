/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 *
 * Docs: https://developer.fastspring.com/reference/
 */

// ---------------------------------------------------------
// Imports.

// ---------------------------------------------------------
// FastSpring class.
// @todo check with the provider for how long refunds can be made, otherwise when a user's api key gets hacked all of the payments in history could be refunded, resulting in catastrophe.

class FastSpringError extends Error {
    constructor(message) {
        super(message);
    }
}

class FastSpring {
    constructor({
        username,
        password,
        server,
    }) {
        this.client = require('api')('@fastspring/v1.0#dbxu2plnwdrfd5');
        this.client.auth(username, password);
        this.server = server;
        if (this.server.production && this.server.https === undefined) {
            throw Error("Accepting payments in production mode requires HTTPS.");
        }

        this.client.createanaccount({
            contact: {
                email: "test@gmail.com",
                first: "John",
                last: "Doe",
            },
            language: "en",
        });
    }

    // ---------------------------------------------------------
    // Private.

    // Check if a uid has a customer id.
    _sys_has_cid(uid) {
        return this.server.database.join(`.sys/fp_uids/${uid}`, false).exists();
    }

    // Load, save or delete customer id by uid.
    _sys_load_cid(uid) {
        return this.server.database.join(`.sys/fp_uids/${uid}`, false).load_sync();
    }
    _sys_load_uid_by_cid(cid) {
        return this.server.database.join(`.sys/fp_cids/${cid}`, false).load_sync();
    }
    _sys_save_cid(uid, cid) {
        this.server.database.join(`.sys/fp_uids/${uid}`, false).save_sync(cid);
        this.server.database.join(`.sys/fp_cids/${cid}`, false).save_sync(uid.toString());
    }
    _sys_delete_cid(uid, cid) {
        this.server.database.join(`.sys/fp_uids/${uid}`, false).del_sync();
        this.server.database.join(`.sys/fp_cids/${cid}`, false).del_sync();
    }

    // ---------------------------------------------------------
    // Public.

    // Get the customer id of a uid, or a create a customer when the uid does not yet have a customer id.
    async get_cid(uid) {
        if (this._sys_has_cid(uid)) {
            return this._sys_load_cid(uid);
        }
        const user = await this.server.get_user(uid);
        const customer = await this.create_customer(user.email, user.first_name, user.last_name);
        this._sys_save_cid(uid, customer.id);
        return customer.id;
    }

    // Create a customer without any user attached.
    // @todo the country field is required for payments so the create_payment must update the customer account.
    async create_customer(email, first_name, last_name) {
        try {
            return await this.client.createanaccount({
                contact: {
                    email: email,
                    first: first_name,
                    last: last_name,
                },
                language: "en",
            });
        } catch (error) {
            throw new FastSpringError(error.message); // since the default errors do not have a stacktrace.
        }
    }

    // Delete a customer.
    async delete_customer() {}

    // Update the customer.
    async update_customer(uid, user, country) {
        if (this._sys_has_cid(uid)) {
            const cid = this._sys_load_cid(uid);
            try {
                const args = {
                    contact: {
                        email: email,
                        first: first_name,
                        last: last_name,
                    },
                    language: "en",     
                }
                if (country != null) {
                    args.country = country;
                }
                await this.stripe.customers.update(
                    cid, 
                    args
                );
            } catch (error) {
                throw new FastSpringError(error.message); // since the default errors do not have a stacktrace.
            }
        }
    }
}

// ---------------------------------------------------------
// Exports.

module.exports = FastSpring;