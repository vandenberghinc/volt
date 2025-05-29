/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 *
 */

// ---------------------------------------------------------
// Imports.

const { Checkout } = require('checkout-sdk-node');

// ---------------------------------------------------------
// Checkout.com class.
// @todo check with the provider for how long refunds can be made, otherwise when a user's api key gets hacked all of the payments in history could be refunded, resulting in catastrophe.
/* Sources:
 * - Docs: https://www.checkout.com/docs
 * - Backend: https://api-reference.checkout.com/#tag/Customers
 * - Frontend: https://www.checkout.com/docs/payments/accept-payments/accept-a-payment-on-your-website/frames-reference
 */

class CheckoutAPI {
    constructor({
        secret_key,
        public_key,
        success_url = null,
        failure_url = null,
        products = [],
        _server,
    }) {

        // Check args.
        if (typeof secret_key !== "string") {
            throw Error(`Parameter "secret_key" should be a defined value of type "string".`);
        }
        if (typeof public_key !== "string") {
            throw Error(`Parameter "public_key" should be a defined value of type "string".`);
        }
        if (typeof success_url !== "string") {
            throw Error(`Parameter "success_url" should be a defined value of type "string".`);
        }
        if (typeof failure_url !== "string") {
            throw Error(`Parameter "failure_url" should be a defined value of type "string".`);
        }

        // Attributes.
        this.client = new Checkout(secret_key, { pk: public_key });
        this.success_url = success_url;
        this.failure_url = failure_url;
        this.products = products;
        this.server = _server;

        // Full url.
        if (this.success_url.charAt(0) === "/") {
            this.success_url = `${this.server.full_domain}${this.success_url}`;
        }
        if (this.failure_url.charAt(0) === "/") {
            this.failure_url = `${this.server.full_domain}${this.failure_url}`;
        }

    }

    // ---------------------------------------------------------
    // Private.

    // Handle an error.
    _handle_error(error) {
        if (error.body) {
            return new Error(`${error.name} ${error.body.error_type}: ${error.body.error_codes.join(" ")} [${error.http_code}]: `);
        } else {
            return new Error(error.name);
        }
    }

    // Check if a uid has a customer id.
    _sys_has_cid(uid) {
        return this.server.database.join(`.sys/chk_uids/${uid}`, false).exists();
    }

    // Load, save or delete customer id by uid.
    _sys_load_cid(uid) {
        return this.server.database.join(`.sys/chk_uids/${uid}`, false).load_sync();
    }
    _sys_load_uid_by_cid(cid) {
        return this.server.database.join(`.sys/chk_cids/${cid}`, false).load_sync();
    }
    _sys_save_cid(uid, cid) {
        this.server.database.join(`.sys/chk_uids/${uid}`, false).save_sync(cid);
        this.server.database.join(`.sys/chk_cids/${cid}`, false).save_sync(uid.toString());
    }
    _sys_delete_cid(uid, cid) {
        this.server.database.join(`.sys/chk_uids/${uid}`, false).del_sync();
        this.server.database.join(`.sys/chk_cids/${cid}`, false).del_sync();
    }

    // Load the refund object of a payment.
    _sys_load_refund(payment_id, def = null) {
        const path = this.server.database.join(`.sys/chk_refunds/${payment_id}`, false);
        if (path.exists() === false) { return def; }
        return path.load_sync();
    }
    _sys_save_refund(payment_id, info) {
        return this.server.database.join(`.sys/chk_refunds/${payment_id}`, false).save_sync(JSON.stringify(info));
    }

    // Extend the refund.
    _extend_refund(refund) {
        
        // Status description.
        switch (refund.status) {
            case "pending": 
                refund.description = "The refund request is being processed.";
                break;
            case "succeeded": 
                refund.description = "The payment has successfully been refunded.";
                break;
            // case "failed": 
            //     refund.description = refund.failure_description;
            //     break;
            // case "requires_action": 
            //     refund.description = "The refund request requires action.";
            //     break;
            case "canceled": 
                refund.description = "The refund request has been cancelled.";
                break;
            case "unknown": 
            default:
                refund.description = "Unknown status.";
                break;
        }
    }

    // Add or remove a subscription to the user's active subscriptions.
    _sys_add_subscription(uid, prod_id, payment_id) {
        const dir = this.server.database.join(`.sys/chk_subs/${uid}`, false);
        if (dir.exists() === false) {
            dir.mkdir_sync();
        }
        const path = dir.join(prod_id, false);
        path.save_sync(payment_id);
    }
    _sys_remove_subscription(uid, prod_id) {
        const dir = this.server.database.join(`.sys/chk_subs/${uid}`, false);
        if (dir.exists() === false) {
            return null;
        }
        const path = dir.join(prod_id, false);
        if (path.exists() === false) {
            return null;
        }
        path.del_sync();
    }
    _sys_check_subscription(uid, prod_id, load_sub_id = true) {
        const dir = this.server.database.join(`.sys/chk_subs/${uid}`, false);
        if (dir.exists() === false) {
            dir.mkdir_sync();
        }
        const path = dir.join(prod_id, false);
        let exists = true, sub_id;
        if (load_sub_id) {
            if (path.exists() === false)  {
                exists = false;
            } else {
                sub_id = path.load_sync();
            }
            return {exists, sub_id};
        } else {
            return path.exists();
        }
    }
    _sys_get_subscriptions(uid) {
        const dir = this.server.database.join(`.sys/chk_subs/${uid}`, false);
        if (dir.exists() === false) {
            dir.mkdir_sync();
        }
        const products = [];
        dir.paths_sync((path) => {
            products.push(path.name());
        })
        return products;
    }

    // Initialize the payment products.
    _initialize_products() {

        // Check a payment product / plan product.
        const product_ids = [];
        let product_index = 0;
        const check_product = (product) => {
            ++product_index;

            // Check if the product has an id.
            if (product.id == null || product.id === "") {
                throw Error(`Product ${product_index} does not have an assigned "id" attribute (string).`);
            }
            else if (product_ids.includes(product.id)) {
                throw Error(`Product ${product_index} has a non unique id "${product.id}".`);
            }
            for (let i = 0; i < product.id.length; i++) {
                if ("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_".indexOf(product.id.charAt(i)) === -1) {
                    throw Error(`Invalid product id "${product.id}", product id's may only contain lowercase characters, uppercase characters, digits and an underscore character ("_").`);
                }
            }
            product_ids.push(product.id);

            // Set the icon absolute url.
            if (typeof product.icon === "string" && product.icon.charAt(0) === "/") {
                product.icon = `${this.server.full_domain}${product.icon}`;
            }

            // Check attributes.
            if (typeof product.name !== "string" || product.name === "") {
                throw Error(`Product "${product.id}" does not have an assigned "name" attribute (string).`);
            }
            if (typeof product.description !== "string" || product.description === "") {
                throw Error(`Product "${product.id}" does not have an assigned "description" attribute (string).`);
            }
            if (typeof product.currency !== "string" || product.currency === "") {
                throw Error(`Product "${product.id}" does not have an assigned "currency" attribute (string).`);
            }
            if (typeof product.price !== "number") {
                throw Error(`Product "${product.id}" does not have an assigned "price" attribute (number).`);
            }
            if (product.is_subscription && product.frequency == null) {
                throw Error(`Product "${product.id}" does not have an assigned "frequency" attribute (number).`);   
            }
        }

        // Expand the payment products.
        let sub_products = 0;
        this.products.iterate((product) => {
            if (product.plans != null) {

                // Check plans.
                if (product.plans != null && Array.isArray(product.plans) === false) {
                    throw Error(`Product "${product_index}" has an incorrect value type for attribute "plans", the valid type is "array".`);
                }

                // Generate sub id.
                product.id = `sub_${sub_products}`
                if (product_ids.includes(product.id)) {
                    throw Error(`Another product has a reserved id "${product.id}".`);
                }
                product_ids.push(product.id);
                ++sub_products;

                // Attributes.
                product.is_subscription = true;

                // Expand plan attributes.
                product.plans.iterate((plan) => {
                    plan.is_subscription = true;
                    plan.parent_id = product.id;
                    if (plan.description == null ) { plan.description = product.description; }
                    if (plan.currency == null ) { plan.currency = product.currency; }
                    if (plan.frequency == null ) { plan.frequency = product.frequency; }
                    if (plan.icon == null ) { plan.icon = product.icon; }
                    check_product(plan);
                })
            } else {
                product.is_subscription = false;
                check_product(product);
            }
        })
    }

    // Register the webhook endpoint.
    async _register_webhook() {
        const url = `https://${this.server.domain}/vweb/payments/webhook`;
        const enabled_events = [
            "refund.updated",
            "invoice.payment_action_required",
            "invoice.payment_failed",
            "invoice.payment_succeeded",
            "customer.subscription.created",
            "customer.subscription.deleted",
        ];
        const result = await this.stripe.webhookEndpoints.list();
        const webhooks = this._parse_as_list(result.data);
        let secret = await webhooks.iterate_async_await(async (webhook) => {
            if (webhook.url === url) {
                if (enabled_events.eq(webhook.enabled_events)) {
                    return this.server.database.join(".sys/keys/stripe_webhook_key", false).load_sync();
                } else {
                    await this.stripe.webhookEndpoints.update(
                        webhook.id, 
                        {enabled_events: enabled_events}
                    );
                    return this.server.database.join(".sys/keys/stripe_webhook_key", false).load_sync();
                }
            }
        })
        if (secret === null) {
            const result = await this.stripe.webhookEndpoints.create({
                url: url,
                enabled_events: enabled_events,
            });
            secret = result.secret;
            this.server.database.join(".sys/keys/stripe_webhook_key", false).save_sync(secret);
        }
        if (this.webhook_key == null) {
            this.webhook_key = secret;
        }
    }

    // Initialize.
    async _initialize() {

        // Create dirs.
        [
            ".sys/chk_uids",
            ".sys/chk_cids",
            ".sys/chk_subs",
            ".sys/chk_refunds",
        ].iterate((subpath) => {
            this.server.database.join(subpath).mkdir_sync();
        })

        // Initialize products.
        this._initialize_products();

        // // Create the webohok.
        // await this._register_webhook();

        // // Add the webhook endpoint.
        // this.server.endpoint(this._create_webhook());

    }

    // ---------------------------------------------------------
    // Products.

    // Get a product by id.
    // Use async to keep it persistent with other functions.
    /*  @docs
     *  @title: Get Product
     *  @description:
     *      Get a product by id.
     *  @parameter:
     *      @name: id
     *      @description: The id of the product to retrieve. The id may either be the id of a product or a the id from a plan of a subscription product.
     *      @type: string
     *  @parameter:
     *      @name: throw_err
     *      @type: boolean
     *      @description: Throw an error when the product was not found.
     *  @type: object.
     *  @return: Returns the product object.
     *  @usage:
     *      ...
     *      const product = server.get_product("prod_basic");
     */
    async get_product(id, throw_err = false) {
        const product = this.products.iterate((p) => {
            if (p.is_subscription) {
                if (p.id === id) {
                    return p;
                }
                return p.plans.iterate((plan) => {
                    if (plan.id === id) {
                        return plan;
                    }
                })
            }
            else if (p.id === id) {
                return p;
            }
        })
        if (product == null) {
            throw Error(`Unable to find product "${id}".`);
        }
        return product;
    }

    // Get products.
    // Use async to keep it persistent with other functions.
    async get_products() {
        return this.products;
    }

    // ---------------------------------------------------------
    // Customers.

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
    async create_customer(email, first_name, last_name) {
        try {
            return await this.client.customers.create({
                email: email,
                name: `${first_name} ${last_name}`,
            });
        } catch (error) {
            throw this._handle_error(error);
        }
    }

    // Delete a customer.
    async delete_customer(uid) {
        if (this._sys_has_cid(uid)) {
            let result;
            const cid = this._sys_load_cid(uid);
            try {
                result = await this.client.customers.delete(cid);
            } catch (error) {
                throw this._handle_error(error);
            }
            this._sys_delete_cid(uid, cid);
        }
    }

    // Update the name and email address of a customer.
    async update_customer(uid, user) {
        if (this._sys_has_cid(uid)) {
            const cid = this._sys_load_cid(uid);
            try {
                await this.client.customers.update(
                    cid, 
                    {
                        email: user.email,
                        name: `${user.first_name} ${user.last_name}`,
                    }
                );
            } catch (error) {
                throw this._handle_error(error);
            }
        }
    }

    // Get a customer by uid or email, when no customer is found, null is returned.
    async get_customer(uid) {
        if (this._sys_has_cid(uid)) {
            const cid = this._sys_load_cid(uid);
            try {
                return await this.client.customers.get(cid);
            } catch (error) {
                if (error.http_code === 404) {
                    return null;
                }
                throw this._handle_error(error);
            }
        }
        return null;
    }
    async get_customer_by_email(email) {
        try {
            return await this.client.customers.get(email);
        } catch (error) {
            if (error.http_code === 404) {
                return null;
            }
            throw this._handle_error(error);
        }
        return null;
    }

    // ---------------------------------------------------------
    // Payments.

    // Retrieve the created payment quotes of a user.
    async get_payments({
        uid,  
        days = 30,
        status = null,
        limit = null,
    }) {

        // Check uid.
        this.server._check_uid_within_range(uid);

        // Get cid.
        const cid = this.get_cid(uid);

        // Get the since time.
        let since_timestamp = null;
        if (days != null) {
            since_timestamp = new Date();
            since_timestamp.setHours(0, 0, 0, 0)
            since_timestamp = Math.floor(created.getTime() - (3600 * 24 * 1000 * days));
        }

        // Create subscription.
        let response, payments = [], skip = 0, resume = true;
        while (resume) {
            try {
                response = await this.checkout.payments.list({
                    reference: cid,
                    limit: 100,
                    skip: skip,
                    status: status,
                });
            }

            // Handle error.
            catch (error) {
                throw this._handle_error(error);
            }

            // No data so stop.
            if (response.total_count === 0) {
                break;
            }

            // Parse data.
            skip += response.data.length;
            response.data.iterate((item) => {

                // Skip by refunded.
                if (refunded === true && item.status !== "Refunded" && item.status !== "Partially Refunded") {
                    return null;
                }

                // Skip by status.
                if (
                    status != null && 
                    (
                        (typeof status === "string" && item.status !== status) ||
                        (typeof status === "function" && status(item.status) === false)
                    )
                ) {
                    return null;
                }

                // Check since timestamp.
                if (since_timestamp !== null && item.metadata.timestamp != null && item.metadata.timestamp < since_timestamp) {
                    resume = false;
                    return false;
                }

                // Stop by limit.
                if (limit != null && payments.length >= limit) {
                    resume = false;
                    return false;   
                }

                // Add to items.
                payments.append(item);
            })
        }

        // Handler.
        return payments;
    }

    // Create a payment.
    async create_payment({
        uid,
        token = null,
        cart = [],
        ip = null,
    }) {

        // Check args.
        if (typeof token !== "string") {
            throw Error(`Parameter "token" has an invalid value type "${typeof token}", the valid value type is "string".`);
        }
        if (typeof ip !== "string") {
            throw Error(`Parameter "ip" has an invalid value type "${typeof ip}", the valid value type is "string".`);
        }
        if (Array.isArray(cart) === false) {
            throw Error(`Parameter "cart" has an invalid value type "${typeof cart}", the valid value type is "array".`);
        } else if (cart.length === 0) {
            throw Error(`No product cart was specified.`);
        }

        // Check uid.
        this.server._check_uid_within_range(uid);

        // Get cid.
        const cid = this.get_cid(uid);

        // Check products.
        let payment_plan = undefined;
        let is_subscription = null;
        let currency = null;
        const line_items = [];
        const plan_count_per_product = {};
        await cart.iterate_async_await(async (i) => {

            // Get product.
            let product = i.product;
            if (product == null) {
                product = await this.get_product(i.id, true);
            }

            // Check currency.
            if (currency === null) {
                currency = product.currency;
            } else if (currency != product.currency) {
                throw Error(`You can not multiple products with different currencies in one request.`);
            }

            // Check subscription.
            if (is_subscription === null) {
                is_subscription = product.is_subscription;
            } else if (is_subscription != product.is_subscription) {
                throw Error(`You can not charge both subscriptions and one-time payments in one request.`);
            }

            // Check subscriptions.
            if (product.is_subscription) {

                // Check quantity.
                if (product.is_subscription && i.quantity > 0) {
                    throw Error(`A subscription product can not have a quantity higher than 1.`);   
                }

                // Only allow one plan per transaction.
                if (plan_count_per_product[product.parent_id] === undefined) {
                    plan_count_per_product[product.parent_id] = 1;
                } else if (plan_count_per_product[product.parent_id] >= 1) {
                    throw Error(`You can not charge multiple subscription plans of the same subscription product in one request.`);
                }

                // Check if the user is already subscribed to this product.
                if (uid != null) {
                    if (this._sys_check_subscription(uid, product.id, false)) {
                        throw Error(`You are already subscribed to product "${product.id}".`);
                    }
                }

                // Create the payment plan info, if it was already created throw an error since two subs in one request are not allowed.
                if (payment_plan !== undefined) {
                    throw Error(`You can only charge a single subscription per request.`);
                } else {
                    payment_plan = {
                        amount_variability: "Fixed",
                        days_between_payment: product.frequency,
                        // @todo check if other attrs are required such as expiry and the amount of agreed frequencies.
                    }
                }
            }

            // Add to line items.
            line_items.push({
                name: product.name,
                unit_price: parseInt(product.price * 100),
                quantity: i.quantity == null ? 1 : i.quantity,
                image_url: product.icon,
            })
        })

        // Make request.
        try {
            await this.client.payments.request({
                source: {
                    type: "token",
                    token: token,
                    // billing address should already be captured into the token by the frontend.
                },
                currency: currency,
                payment_type: is_subscription ? "Subscription" : "Regular",
                payment_plan: payment_plan,
                authorization_type: "Final",
                capture: true,
                customer: {
                    id: cid,
                },
                success_url: this.success_url,
                failure_url: this.failure_url,
                payment_ip: ip,
            })
        }
        
        // Handle error.
        catch (error) {
            throw this._handle_error(error);
        }
    }

    // ---------------------------------------------------------
    // Subscriptions.

    // Get the subscriptions of a user.
    // Use async to keep it persistent with other functions.
    /*  @docs:
     *  @title: Get Subscriptions
     *  @description:
     *      Get the subscriptions of a user.
     *  @parameter:
     *      @name: uid
     *      @description: The id of the user you want to retrieve the subscriptions from.
     *      @type: number
     *  @type: array[string]
     *  @return: Returns a list with the product id's the user is subscribed to.
     *  @usage:
     *      ...
     *      const subscriptions = server.get_subscriptions(1);
     */
    async get_subscriptions(uid) {
        this.server._check_uid_within_range(uid);
        return this._sys_get_subscriptions(uid);
    }

    // Check if a user is subscribed to a specific product.
    // Use async to keep it persistent with other functions.
    /*  @docs:
     *  @title: Is Subscribed
     *  @description:
     *      Check if a user is subscribed to a specific product.
     *  @parameter:
     *      @name: uid
     *      @description: The id of the user to check.
     *      @type: number
     *  @parameter:
     *      @name: id
     *      @description: The id of product to check.
     *      @type: string
     *  @type: boolean
     *  @return: Returns a boolean indicating if the user is subscribed to that product or not.
     *  @usage:
     *      ...
     *      const subscriptions = await server.is_subscribed(0, "sub_basic");
     */
    async is_subscribed(uid, id) {
        this.server._check_uid_within_range(uid);
        return this._sys_check_subscription(uid, id, false);
    }

    // Get the subscriptions of a user.
    // Use async to keep it persistent with other functions.
    /*  @docs:
     *  @title: Get Subscription Id
     *  @description:
     *      Get the subscription id from a user's subscription by product id.
     *  @parameter:
     *      @name: uid
     *      @description: The id of the user to retrieve the subscription id from.
     *      @type: number
     *  @parameter:
     *      @name: id
     *      @description: The id of product to retrieve the subscription id from.
     *      @type: string
     *  @type: null, string
     *  @return: When the user is not subscribed to the product `null` will be returned. When the user is subscribed to the product the subscription id will be returned.
     *  @usage:
     *      ...
     *      const id = await server.get_subscription(1, "sub_basic");
     */
    async get_subscription(uid, id) {
        this.server._check_uid_within_range(uid);
        const {exists, sub_id} = this._sys_check_subscription(uid, id);
        if (exists) {
            return sub_id;
        }
        return null;
    }

    // Cancel a subscription.
    /*  @docs:
     *  @title: Cancel Subscription
     *  @description: Cancel an active subscription.
     *  @warning: All the subscriptions that were purchased by the charge request in which the user bought the subscription will also be cancelled.
     *  @parameter:
     *      @name: uid
     *      @description: The user id.
     *      @type: number
     *      @required: true
     *  @parameter:
     *      @name: id
     *      @description: The product's plan id of the user defined subscription product.
     *      @type: string
     *      @required: true
     *  @parameter:
     *      @name: sub_id
     *      @description: This parameter is optional, it can be passed to cancel a specific subscription by subscription id. When parameter `id` is passed, the subscription id will automatically be retrieved.
     *      @type: string
     *  @usage:
     *      ...
     *      server.cancel_subscription({uid: 0, id: "sub_basic"});
     */
    async cancel_subscription(uid, id, sub_id = null) {

        // Check params.
        if (typeof uid !== "number") {
            throw Error(`Parameter "uid" has an invalid value type "${typeof uid}", the valid value type is "number".`);
        }
        if (typeof id !== "string") {
            throw Error(`Parameter "id" has an invalid value type "${typeof id}", the valid value type is "string".`);
        }

        // Check uid.
        this.server._check_uid_within_range(uid);

        // Get the sub id.
        if (sub_id == null) {
            const result = this._sys_check_subscription(uid, id);
            if (result.exists === false) {
                throw Error(`User "${uid}" does not have a subscription on product "${id}".`);
            }
            sub_id = result.sub_id;
        }

        // Cancel the subscriptions.
        try {
            await this.client.payments.void(sub_id)
        }
        catch (error) {
            throw this._handle_error(error);
        }

        // Remove from subscriptions.
        this._sys_remove_subscription(uid, id);
    }

    // ---------------------------------------------------------
    // Refunds.
    
    // Get all refundable payments within an amount of days.
    async get_refundable_payments({uid, days = 14, limit = null}) {
        const items = [];
        await this.get_payments({
            uid: uid, 
            days: days, 
            limit: limit, 
            status: (status) => status === "Paid" || status === "Partially Refunded",
        }).iterate((payment) => {
            let refund;
            if (payment.status === "Partially Refunded") {
                refund = this._sys_load_refund(payment.id);
            }
            payment.items.iterate((item) => {
                for (let i = 0; i < item.quantity; i++) {
                    if (refund == null || refund[`${item.reference}.${i}`] === undefined) {
                        items.append({
                            id: payment.id,
                            uid: uid,
                            cid: payment.customer.id,
                            name: item.name,
                            amount: parseInt(item.unit_price / 100) - parseInt(item.discount_amount / 100),
                            icon: item.image_url,
                        })
                    }
                }
            })
        });
        return items;
    }

    // Get all refunded payments within an amount of days.
    async get_refunded_payments({uid, days = 14, limit = null}) {
        const items = [];
        await this.get_payments({
            uid: uid, 
            days: days, 
            limit: limit, 
            status: (status) => status === "Refunded" || status === "Partially Refunded",
        }).iterate((payment) => {
            const refund = this._sys_load_refund(payment.id);
            payment.items.iterate((item) => {
                for (let i = 0; i < item.quantity; i++) {
                    const rid = `${item.reference}.${i}`;
                    if (refund !== null && refund[rid] !== undefined) {
                        items.append(
                            this._extend_refund({
                                pid: payment.id,
                                uid: uid,
                                cid: payment.customer.id,
                                rid: rid,
                                name: item.name,
                                amount: parseInt(item.unit_price / 100) - parseInt(item.discount_amount / 100),
                                icon: item.image_url,
                                status: refund[rid],
                            })
                        );
                    }
                }
            })
        });
        return items;
    }

    // Refund a by a refund object
    // @todo should still remove active subscriptions in the database after a refund.
    async create_refund(refund) {

        // Check attributes.
        if (typeof refund.pid !== "string") {
            throw Error(`Invalid refund object, the refund object must be retrieved using "Server.checkout.get_refundable_payments()".`);
        }
        if (typeof refund.rid !== "string") {
            throw Error(`Invalid refund object, the refund object must be retrieved using "Server.checkout.get_refundable_payments()".`);
        }
        if (typeof refund.name !== "string") {
            throw Error(`Invalid refund object, the refund object must be retrieved using "Server.checkout.get_refundable_payments()".`);
        }
        if (typeof refund.amount !== "number") {
            throw Error(`Invalid refund object, the refund object must be retrieved using "Server.checkout.get_refundable_payments()".`);
        }

        // Make request.
        try {
            await this.client.payments.refund(refund.pid, {
                name: refund.name, 
                amount: refund.amount, 
            })
        }
        catch (error) {
            throw this._handle_error(error);
        }

        // Save refund.
        const saved = _sys_load_refund(refund.pid, {});
        saved[refund.rid] = "pending";
        this._sys_save_refund(refund.pid, refund);
    }

}

// ---------------------------------------------------------
// Exports.

module.exports = CheckoutAPI;