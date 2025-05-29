/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 *
 * DEPRECATED
 *
 * Drop in integration: https://docs.adyen.com/online-payments/build-your-integration/?platform=Web&integration=Components&tab=embed_script_and_stylesheet_2
 * Cancellation and refunds: https://docs.adyen.com/online-payments/modify-payments
 * PCI Compliance: https://docs.adyen.com/development-resources/pci-dss-compliance-guide/
 * Security Guide: https://docs.adyen.com/development-resources/integration-security-guide/
 * API Docs: https://docs.adyen.com/api-explorer/
 * NodeJS funcs: https://github.com/Adyen/adyen-node-api-library/blob/develop/src/services/checkout/paymentsApi.ts
 */

// Imports.
const fs = require("fs");
const PDFDocument = require("pdfkit");
const { Client, CheckoutAPI, hmacValidator } = require('@adyen/api-library');
const {vlib} = require("../vinc.js");
const Status = require("../status.js");
const utils = require("../utils.js");

// The adyen payments class.
// @todo create a refund page which handles an url param of the payment id, so non users can also refund payments.
// @todo still check how it is with `lineItems.taxPercentage` like attributes, should tax be manually calculated? Or is it done automatically when `amountIncludingTax` is defined?
// @todo check with the provider for how long refunds can be made, otherwise when a user's server gets hacked all of the payments in history could be refunded, resulting in catastrophe.
// @todo india subscriptions has other rules, not implemented: https://docs.adyen.com/payment-methods/cards/cards-recurring-india/

/*  @docs:
    @ignore: true
    @deprecated: true
    @nav: Backend
    @chapter: Payments
    @title: Adyen
    @description: 
        The adyen payments class.
    @warning: You must set the "Allowed Origins" sections in your Adyen Dashboard for your client key, development websites can use `http://127.0.0.1:8000` or `http://localhost:8000`. Can be set under Dashboard > Developer > API Credentials > Select API  Key > Client Settings.
    @warning: You must enable the "Standard webhook" in your adyen account with endpoint "/vweb/payments/webhook", generate a hask key and assign it to param `webhook_key`, and make sure the following events are enabled `AUTHORISATION`, `CANCELLATION`, `TECHNICAL_CANCEL`, `REFUND` and `REFUND_FAILED`.
    @warning: You must enable the `additionalData.recurring.recurringDetailReference` parameter from the `AUTHORISATION` webhook. To do this navigate to the Customer Area --> Developers --> Additional Data --> Enable "Recurring Details".
    @param:
        @name: secret_key
        @type: string
        @description: The adyen secret key.
        @required: true
    @param:
        @name: client_key
        @type: string
        @description: The adyen client key.
        @required: true
    @param:
        @name: webhook_key
        @type: string, array[string]
        @description: The webhook key(s).
        @required: true
    @param:
        @name: account_name
        @type: string
        @description: Your adyen merchant account name.
    @param:
        @name: return_url
        @type: string
        @description: The absolute url or the endpoint url where the user will be redirected to after a payment (e.g. `/payments/redirect`).
    @param:
        @name: products
        @type: object
        @warning: The payment product objects are accessable by anyone through the backend rest api so they should not contain any sensitive data.
        @description: 
            The payment products or subscriptions.

            When the payment products has a value defined for attribute `frequency` it will become a subscription instead of a one-time payment.
            
            A one-time payment product object looks like:
            ```js
            {
                id: "prod_premium",                 // an unique id across your entire stripe account. Warning: this id can never be changed. Or the old product will be deactivated from your stripe account.
                name: "Premium",                    // the name of the subscription.
                description: "...",                 // the description of the subscription.
                price: 9.99,                        // price in decimals.
                currency: "eur",                    // ISO currency code (lowercase)
                icon: undefined,                    // (optional) the absolute url or the endpoint url (string that starts with a `/`) to the product's icon.
            }```

            A subscription product looks like:
            ```js
            {
                plans: [{
                    id: "prod_premium",             // an unique id across your entire stripe account. Warning: this id can never be changed. Or the old product will be deactivated from your stripe account.
                    name: "Premium",                // the name of the subscription.
                    description: "...",             // the description of the subscription.
                    price: 9.99,                    // price in decimals.
                }],
                currency: "eur",                    // ISO currency code (lowercase)
                frequency: "monthly",               // the recurring frequency, possible values: daily, weekly, biWeekly, monthly, quarterly, halfYearly, yearly.
                icon: undefined,                    // (optional) the absolute url or the endpoint url (string that starts with a `/`) to the product's icon.
            }```
*/

class Adyen {
    constructor({
        api_key,        // your private api key.
        client_key,     // your public client key.
        webhook_key,    // your webhook hmac key.
        account_id,     // can be obtained from Adyen Dashboard > Settings -> Merchant Accounts.
        return_url = null,
        products = [],
        blocked_payment_methods = [], // id's can be found at https://docs.adyen.com/payment-methods/payment-method-types/.
        _server = null,
    }) {

        // Verify args.
        vlib.utils.verify_params({params: arguments[0], check_unknown: true, info: {
            api_key: "string",
            client_key: "string",
            webhook_key: {type: ["string", "array"]},
            account_id: "string",
            return_url: "string",
            products: "array",
            blocked_payment_methods: {type: "array", required: false},
            _server: "object",
        }});

        // Attributes.
        this.type = "adyen";
        this.client_key = client_key;
        this.webhook_keys = webhook_key;
        this.account_id = account_id;
        this.return_url = return_url;
        this.products = products;
        this.blocked_payment_methods = blocked_payment_methods;
        this.server = _server;

        // Initialize api.
        this.client = new Client({apiKey: api_key, environment: this.server.production ? "LIVE" : "TEST"}); // @todo test live string.
        this.checkout = new CheckoutAPI(this.client);

        // Set webhook keys as array.
        if (typeof this.webhook_keys === "string") {
            this.webhook_keys = [this.webhook_keys];
        }

        // Full url.
        if (this.return_url.charAt(0) === "/") {
            this.return_url = `${this.server.full_domain}${this.return_url}`;
        }

        // Extend the csp.
        this.server.csp["default-src"] += " https://*.adyen.com/";
        this.server.csp["script-src"] += " https://*.adyen.com/ https://*.payments-amazon.com https://*.paypal.com https://*.google.com";
        this.server.csp["style-src"] += " https://*.adyen.com/ https://*.media-amazon.com https://*.paypal.com https://*.google.com";
        this.server.csp["img-src"] += " https://*.adyen.com/ https://*.media-amazon.com https://*.paypal.com https://*.google.com";
    }

    // ---------------------------------------------------------
    // Utils (private).

    // Handle an error.
    _handle_error(error) {
        if (error.statusCode) {
            const info = JSON.parse(error.responseBody);
            return new Error(`${info.message} (${info.errorType}:${info.errorCode}) [${info.status}].`);
        } else {
            return new Error(error);
        }
    }

    // Create customer id.
    _create_customer_id(uid) {
        if (uid == null) {
            return `cus_${Date.now()}${String.random(4)}`;
        } else {
            let cus_id = uid.toString();
            while (cus_id.length < 3) { cus_id += "X"; } // min length is 3.
            return cus_id;
        }
    }

    // ---------------------------------------------------------
    // Database (private).

    // Add or remove a subscription to the user's active subscriptions.
    _sys_add_subscription(uid, prod_id, pay_id, sub_id) {
        const dir = this.server.database.join(`.sys/pym_subs/${uid}`, false);
        if (dir.exists() === false) {
            dir.mkdir_sync();
        }
        const path = dir.join(prod_id, false);
        path.save_sync(`${pay_id}\n${sub_id}`);
    }
    _sys_delete_subscription(uid, prod_id) {
        const dir = this.server.database.join(`.sys/pym_subs/${uid}`, false);
        if (dir.exists() === false) {
            return null;
        }
        const path = dir.join(prod_id, false);
        if (path.exists() === false) {
            return null;
        }
        path.del_sync();
    }
    _sys_check_subscription(uid, prod_id, load_data = true) {
        const dir = this.server.database.join(`.sys/pym_subs/${uid}`, false);
        if (dir.exists() === false) {
            dir.mkdir_sync();
        }
        const path = dir.join(prod_id, false);
        let exists = true, data;
        if (load_data) {
            let pay_id, sub_id;
            if (path.exists() === false)  {
                exists = false;
            } else {
                data = path.load_sync();
                const split = data.split("\n")
                pay_id = split[0];
                sub_id = split[1];
            }
            return {exists, sub_id, pay_id};
        } else {
            return path.exists();
        }
    }
    _sys_get_subscriptions(uid) {
        const dir = this.server.database.join(`.sys/pym_subs/${uid}`, false);
        if (dir.exists() === false) {
            dir.mkdir_sync();
        }
        const products = [];
        dir.paths_sync((path) => {
            products.push(path.name());
        })
        return products;
    }

    // Save and delete payments, all failed payments should be deleted from the database.
    _sys_save_payment(payment) {
        const dir = this.server.database.join(`.sys/pym_p/${payment.uid == null ? "unauth" : payment.uid}/`, false);
        if (dir.exists() === false) {
            dir.mkdir_sync();
        }
        dir.join(payment.id, false).save_sync(JSON.stringify(payment));
    }
    _sys_load_payment(id) {
        const uid = id.split("_")[1];
        const dir = this.server.database.join(`.sys/pym_p/${uid}/`, false);
        if (dir.exists() === false) {
            dir.mkdir_sync();
        }
        const path = dir.join(id, false);
        if (path.exists() === false) {
            throw Error(`Unable to find payment "${id}".`);
        }
        return path.load_sync({type: "object"});
    }
    _sys_update_payment(uid, id, data) {
        if (uid == null) { uid = "unauth"; }
        const dir = this.server.database.join(`.sys/pym_p/${uid}/`, false);
        if (dir.exists() === false) {
            dir.mkdir_sync();
        }
        const path = dir.join(id, false);
        path.save_sync({...path.load_sync({type: "object"}), ...data})
    }
    _sys_delete_payment(uid, id) {
        if (uid == null) { uid = "unauth"; }
        const dir = this.server.database.join(`.sys/pym_p/${uid}/`, false);
        if (dir.exists() === false) {
            dir.mkdir_sync();
        }
        dir.join(id, false).del_sync();
    }

    // Delete all info of a user.
    _sys_delete_user(user) {
        this.server.database.join(`.sys/pym_p/${user.uid}/`, false).del_sync();
        this.server.database.join(`.sys/pym_s/${user.uid}/`, false).del_sync();
    }

    // ---------------------------------------------------------
    // Requests (private).

    // Refund a payment, all created subscriptions within the original payment will be cancelled.
    // Do not use `refundOrCancel` since that would initiate a different webhook event for a combined refund or cancel event, which needs to be seperated for the webhook logic.
    // https://github.com/Adyen/adyen-node-api-library/blob/develop/src/services/checkout/modificationsApi.ts
    async _refund_payment(payment, line_items = null) {
        try {

            // Load payment.
            // The payment must be loaded from the database in case the line items or anything were eedited by the user, such as dropping all non refundable line items.
            if (typeof payment === "string") {
                payment = this._sys_load_payment(payment);
            } else {
                payment = this._sys_load_payment(payment.id);
            }

            // When no line items are defined than refund everything.
            if (line_items == null) {
                line_items = payment.line_items;
            }

            // Check empty line items.
            if (line_items.length === 0) {
                throw Error("No refund line items array is empty.")
            }

            // Create an id to recognize the refund.
            const ref_id = `ref_${Date.now()}${String.random(4)}`;

            // Parse line items.
            let currency;
            let amount = 0;
            const structured_line_items = [];
            line_items.iterate((item) => {

                // Skip when the item is already being refunded.
                if (item.status === "refunded" || item.status === "refunding") {
                    return null;
                }

                // Get product.
                if (typeof item.product === "string") {
                    product = this.get_product_sync(item.product);
                }

                // Get currency.
                if (currency === undefined) {
                    currency = product.currency;
                } else if (currency !== product.currency) {
                    throw Error(`You can not refund multiple products with different currencies in one request.`);
                }

                // Add amount.
                amount += parseInt(product.price * 100) * quantity;

                // Add to structured line items.
                structured_line_items.push({
                    id: product.id,
                    description: product.description,
                    amountIncludingTax: parseInt(product.price * 100),
                    quantity: item.quantity,
                    imageUrl: product.icon,
                })
            })

            // Check empty line items.
            if (structured_line_items.length === 0) {
                throw Error("This payment no longer has any refundable line items.")
            }

            // Make request.
            const response = await this.checkout.ModificationsApi.refundCapturedPayment(payment.psp_id, {
                merchantAccount: this.account_id,
                recurringDetailReference: sub_id,
                reference: ref_id,
                amount: {
                    currency, 
                    amount,
                },
                lineItems: structured_line_items,
                metadata
            });

            // Update the payment object.
            line_items.iterare((item) => {
                item.ref_id = ref_id;
                item.status = "refunding";
            })
            this._sys_save_payment(payment);

            // Response.
            return response;
        }

        // Handle error.
        catch (error) {
            throw this._handle_error(error);
        }
    }

    // ---------------------------------------------------------
    // Webhooks (private).

    // Execute a webhook user defined callback.
    async _exec_user_callback(callback, args) {
        if (callback != null) {
            const res = callback(args);
            if (res instanceof Promise) { res = await res; }
        }
    }

    // Send a payment mail.
    async _send_payment_mail({payment, subject, attachments = [], mail}) {
        this.server.send_mail({
            recipients: [`${payment.billing_details.first_name} ${payment.billing_details.last_name}`, payment.billing_details.email],
            subject,
            body: mail.html(),
            attachments,
        })
    }

    // On a successfull payment webhook event.
    async _payment_webhook(data) {

        // Get the payment id.
        const id = data.merchantReference;

        // Successfull payment.
        if (data.success === "true" || data.success === true) {

            // Load the payment.
            const payment = this._sys_load_payment(id);
            const {uid, cus_id} = payment;

            // Update the payment object in the database.
            payment.status = "paid";
            payment.psp_id = data.pspReference;
            if (data.additionalData["recurring.recurringDetailReference"] != null) {
                payment.sub_id = data.additionalData["recurring.recurringDetailReference"];
            }
            this._sys_save_payment(payment);

            // Check the payments line items.
            await payment.line_items.iterate_async_await(async (item) => {
                const product = this.get_product_sync(item.product, false);

                // @todo REFUND PAYMENT SINCE PRODUCT WAS NOT FOUND SO NO WAY OF DELIVERY.
                // Refund the payment since there is no way of delivery.
                // 1) Product not found.
                // 2) No subscription id found from the webhook data.
                if ((product == null) || (product.is_subscription && payment.sub_id == null)) {
                    return null;
                }

                // Subscription.
                else if (product.is_subscription) {

                    // Active the user's subscription in the database.
                    this._sys_add_subscription(uid, product.id, payment.sub_id);

                    // Cancel the other subscriptions plans that are part of this product.
                    // The `create_payment()` function makes sure there are not multiple subscription plans of the same subscription product charged in a single request.
                    const subscription = await this.get_product(product.parent_id, true);
                    await subscription.plans.iterate_async_await(async (plan) => {
                        if (plan.id != product.id) {
                            const {exists, pay_id} = this._sys_check_subscription(uid, plan.id);
                            if (exists) {
                                await this.cancel_subscription(pay_id);
                            }
                        }
                    })

                    // Execute callback.
                    await this._exec_user_callback(this.server.on_susbcription, {product, payment});
                }

                // One time payment.
                else {

                    // Execute callback.
                    await this._exec_user_callback(this.server.on_payment, {product, payment});
                }
            })

            // Send an email to the user.
            await this._send_payment_mail({
                payment, 
                subject: "Payment Successful",
                mail: this.server.on_payment_mail({payment}),
                attachments: [this.generate_invoice_sync({payment})],
            });
        }

        // Failed payment.
        else {

            // Remove from database.
            this._sys_delete_payment(id);

            // Execute callback.
            await this._exec_user_callback(this.server.on_failed_payment, {product, payment});

            // Send an email to the user.
            await this._send_payment_mail({
                payment, 
                subject: "Payment Failed",
                mail: this.server.on_failed_payment_mail({payment}),
            });

        }
    }

    // On a cancellation webhook event.
    // Mainly gets called when a non paid payments gets cancelled, not when a subscription gets cancelled.
    // https://docs.adyen.com/online-payments/cancel/
    // @todo check if the entire order will be cancelled or if cancelling line items is possible as well.
    async _cancellation_webhook(data) {

        // Vars.
        const id = data.merchantReference;
        const payment = this._sys_load_payment(id);
        const {uid, cus_id} = payment;

        // Successfull cancellation.
        if (data.success === "true" || data.success === true) {

            // Delete subscriptions made by this payment.
            if (payment.sub_id != null) {
                payment.line_items.iterate((item) => {
                    const product = this.get_product_sync(item.product, false);
                    if (product != null && product.is_subscription) {
                        this._sys_delete_subscription(uid, product.id);
                    }
                })
            }

            // Do not delete from dabase since possibly recurring payments that are cancelled could still be refunded.
            //

            // Update the payment object.
            payment.status = "cancelled";
            this._sys_save_payment(payment);

            // Execute callback.
            await this._exec_user_callback(this.server.on_cancellation, {payment});

            // Send an email to the user.
            await this._send_payment_mail({
                payment, 
                subject: "Cancellation Successful",
                mail: this.server.on_cancellation_mail({payment}),
            });
        }

        // Failed cancellation.
        else {

            // Update the payment object.
            payment.status = "paid";
            this._sys_save_payment(payment);

            // Execute callback.
            await this._exec_user_callback(this.server.on_failed_cancellation, {payment});

            // Send an email to the user.
            await this._send_payment_mail({
                payment, 
                subject: "Cancellation Failed",
                mail: this.server.on_failed_cancellation_mail({payment}),
            });
        }
    }

    // On a successfull refund webhook event.
    // https://docs.adyen.com/online-payments/refund/
    // @todo still check if originalReference or merchantReference should be used to retrieve the payment.
    async _refund_webhook(data) {

        // Vars.
        const id = data.originalReference;
        const ref_id = data.merchantReference;
        const payment = this._sys_load_payment(id);
        const {uid, cus_id} = payment;

        // Cancel subscriptions made by this payment.
        if (payment.sub_id != null) {
            try { await this.cancel_subscription(payment); } 
            catch (err) {}
        }

        // Do not remove the payment from the database since it is possible for a refund to fail after a succes=true on the REFUND webhook, see REFUND_FAILED.
        //

        // Update the payment object.
        const line_items = [];
        payment.line_items.iterate((item) => {
            if (item.ref_id === ref_id) {
                payment.status = "refunded";
                line_items.append(item);
            }
        })
        this._sys_save_payment(payment);

        // Execute callback.
        await this._exec_user_callback(this.server.on_refund, {line_items, payment});

        // Send an email to the user.
        await this._send_payment_mail({
            payment, 
            subject: "Refund Successful",
            mail: this.server.on_refund_mail({line_items, payment}),
        });
    }

    // On a refund failed webhook event.
    // This can occur when:
    // 1) A normal refund event has success false, on webhook event REFUND_FAILED.
    // 2) An refunded item that already had success true, has become invalid, on webhook event REFUND_FAILED.
    // https://docs.adyen.com/online-payments/refund/
    async _failed_refund_webhook(data) {

        // Vars.
        const id = data.originalReference;
        const ref_id = data.merchantReference;
        const payment = this._sys_load_payment(id);

        // Update the payment object.
        const line_items = [];
        payment.line_items.iterate((item) => {
            if (item.ref_id === ref_id) {
                delete payment.status;
                line_items.append(item);
            }
        })
        this._sys_save_payment(payment);

        // Execute callback.
        await this._exec_user_callback(this.server.on_failed_refund, {line_items, payment});

        // Send an email to the user.
        // Send an email to the user.
        await this._send_payment_mail({
            payment, 
            subject: "Refund Failed",
            mail: this.server.on_failed_refund_mail({line_items, payment}),
        });
    }

    // Create the webhook endpoint.
    // The "Standard webhook" must be enabled in your adyen account with endpoint "/vweb/payments/webhook". Use the HMAC key from your `database/.sys/keys` file.
    _create_webhook_endpoint(data) {
        const validator = new hmacValidator();
        return  {
            method: "POST",
            endpoint: "/vweb/payments/webhook",
            content_type: "application/json",
            rate_limit: 100000,
            rate_limit_duration: 60,
            callback: async (request, response) => {
                const items = request.params.notificationItems;
                let validation_error = false;
                await items.iterate_async_await(async (item) => {
                    console.log("Webhook", item.NotificationRequestItem);

                    // Get data.
                    const data = item.NotificationRequestItem;
                    
                    // Validate hmac signature.
                    let validated = false;
                    for (let i = 0; i < this.webhook_keys.length; i++) {
                        if (validator.validateHMAC(data, this.webhook_keys[i])) {
                            validated = true;
                            break;
                        }
                    }
                    if (validated === false) {
                        console.error(`Error: Webhook signature verification failed.`);
                        validation_error = true;
                        return null;
                    }

                    // Handle.
                    try {
                        switch (data.eventCode) {

                            // Handle payments.
                            case "AUTHORISATION":
                                await this._payment_webhook(data);
                                break;

                            // Handle cancellation.
                            case "CANCELLATION":
                            case "TECHNICAL_CANCEL":
                                await this._cancellation_webhook(data);
                                break;

                            // Handle refund.
                            case "REFUND":
                                if (data.success === "true" || data.success === true) {
                                    await this._refund_webhook(data);
                                } else {
                                    await this._failed_refund_webhook(data);
                                }
                                break;
                            case "REFUND_FAILED": // this can happen after a refund webhook has success "true".
                                await this._failed_refund_webhook(data);
                                break;

                            // Default.
                            default: break;

                        }
                    } catch (error) {
                        console.error(`Encountered an error while processing a payment webhook. This issue is severe, the issue should be resolved immediately. Afterwards manually take care of the webhook event. Webhook event: ${data}`);
                        console.error(error);
                    }
                });
                if (validation_error) {
                    return response.error({status: Status.unauthorized, data: {error: "Webhook signature verification failed."}});
                } else {
                    return response.success({data: {notificationResponse: "accepted"}});
                }
            },
        };
    }

    // ---------------------------------------------------------
    // Initialization (private).

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
            }
            else if (product.frequency != null) {
                throw Error(`Subscription products should be nested as plans of a subscription "{... plans: [...]}". Not as a direct product without a subscription parent.`);
            }
            else {
                product.is_subscription = false;
                check_product(product);
            }
        })
    }

    // Initialize.
    async _initialize() {

        // Create dirs.
        [
            ".sys/pym_p", // payments.
            ".sys/pym_s", // subscriptions.
        ].iterate((subpath) => {
            this.server.database.join(subpath).mkdir_sync();
        })

        // Initialize products.
        this._initialize_products();

        // Add endpoints.
        this.server.endpoint(
            
            // Get products.
            {
                method: "GET",
                endpoint: "/vweb/payments/products",
                content_type: "application/json",
                rate_limit: 100,
                rate_limit_duration: 60,
                callback: (request, response) => {
                    return response.success({data: this.products});
                }
            },

            // Get payment by id.
            {
                method: "GET",
                endpoint: "/vweb/payments/payment",
                content_type: "application/json",
                rate_limit: 100,
                rate_limit_duration: 60,
                params: {
                    id: "string",
                },
                callback: async (request, response, params) => {
                    const payment = this._sys_load_payment(params.id);
                    const payment_uid = id.split("_")[1];
                    if (payment_uid !== request.uid) {
                        payment.billing_details = {};
                    }
                    return response.success({data: payment});
                }
            },

            // Get payments.
            {
                method: "GET",
                endpoint: "/vweb/payments/payments",
                content_type: "application/json",
                authenticated: true,
                rate_limit: 100,
                rate_limit_duration: 60,
                params: {
                    days: {type: "number", default: 30},
                    limit: {type: "number", default: null},
                    status: {type: "string", default: null},
                },
                callback: async (request, response, params) => {
                    const result = await this.get_payments({
                        uid: request.uid,
                        days: params.days,
                        limit: params.limit,
                        status: params.status,
                    })
                    return response.success({data: result});
                }
            },

            // Get refundale payments.
            {
                method: "GET",
                endpoint: "/vweb/payments/payments/refundable",
                content_type: "application/json",
                authenticated: true,
                rate_limit: 100,
                rate_limit_duration: 60,
                params: {
                    days: {type: "number", default: 30},
                    limit: {type: "number", default: null},
                    status: {type: "string", default: null},
                },
                callback: async (request, response, params) => {
                    const result = await this.get_refundable_payments({
                        uid: request.uid,
                        days: params.days,
                        limit: params.limit,
                    })
                    return response.success({data: result});
                }
            },

            // Get refunded payments.
            {
                method: "GET",
                endpoint: "/vweb/payments/payments/refunded",
                content_type: "application/json",
                authenticated: true,
                rate_limit: 100,
                rate_limit_duration: 60,
                params: {
                    days: {type: "number", default: 30},
                    limit: {type: "number", default: null},
                },
                callback: async (request, response, params) => {
                    const result = await this.get_refunded_payments({
                        uid: request.uid,
                        days: params.days,
                        limit: params.limit,
                    })
                    return response.success({data: result});
                }
            },

            // Get refunding payments.
            {
                method: "GET",
                endpoint: "/vweb/payments/payments/refunding",
                content_type: "application/json",
                authenticated: true,
                rate_limit: 100,
                rate_limit_duration: 60,
                params: {
                    days: {type: "number", default: null},
                    limit: {type: "number", default: null},
                },
                callback: async (request, response, params) => {
                    const result = await this.get_refunding_payments({
                        uid: request.uid,
                        days: params.days,
                        limit: params.limit,
                    })
                    return response.success({data: result});
                }
            },

            // Create payment session.
            {
                method: "POST",
                endpoint: "/vweb/payments/session",
                content_type: "application/json",
                rate_limit: 100,
                rate_limit_duration: 60,
                params: {
                    billing_details: "object",
                    cart: "array",
                },
                callback: async (request, response, params) => {
                    const result = await this.create_payment({
                        uid: request.uid,
                        cart: params.cart,
                        billing_details: params.billing_details,
                        ip: request.ip,
                    });
                    return response.success({data: result});
                }
            },

            // Get payment session details.
            {
                method: "GET",
                endpoint: "/vweb/payments/session",
                content_type: "application/json",
                rate_limit: 100,
                rate_limit_duration: 60,
                params: {
                    details: "object",
                },
                callback: async (request, response, params) => {
                    const result = await this.checkout.PaymentsApi.paymentsDetails(params);
                    return response.success({data: result});
                }
            },

            // Create a refund.
            {
                method: "POST",
                endpoint: "/vweb/payments/refund",
                content_type: "application/json",
                rate_limit: 100,
                rate_limit_duration: 60,
                params: {
                    payment: {type: ["string", "object"]},
                    line_items: {type: ["array", "null"], default: null},
                },
                callback: async (request, response, params) => {
                    const result = await this.create_refund(params.payment, params.line_items);
                    return response.success({data: result});
                }
            },

            // Cancel a subscription.
            {
                method: "DELETE",
                endpoint: "/vweb/payments/subscription",
                content_type: "application/json",
                rate_limit: 100,
                rate_limit_duration: 60,
                params: {
                    payment: {type: ["string", "object"]},
                },
                callback: async (request, response, params) => {
                    const result = await this.cancel_subscription(params.payment);
                    return response.success({data: result});
                }
            },

            // Get session details.
            // DEPRECATED.
            // {
            //     method: "GET",
            //     endpoint: "/vweb/payments/session",
            //     content_type: "application/json",
            //     rate_limit: 100,
            //     rate_limit_duration: 60,
            //     callback: async (request, response) => {
            //         let session_id, session_result;
            //         try {
            //             session_id = request.param("session_id", "string");
            //             session_result = request.param("session_result", "string");
            //         } catch (error) {
            //             return response.error({status: Status.bad_request, data: {error: error.message}});
            //         }
            //         try {
            //             const session = await this.checkout.PaymentsApi.getResultOfPaymentSession(session_id, {params: {sessionResult: session_result}});
            //             return response.success({data: session});
            //         } catch (error) {
            //             return response.error({data: {error: this._handle_error(error).message}});
            //         }
            //     }
            // },

            // Handle webhook.
            this._create_webhook_endpoint(),
        );
    }

    // ---------------------------------------------------------
    // Public.

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
     *  @funcs: 2
     */
    async get_product(id, throw_err = false) {
        return this.get_product_sync(
            id,
            throw_err
        );
    }
    get_product_sync(id, throw_err = false) {
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
        if (product == null && throw_err) {
            throw Error(`Unable to find product "${id}".`);
        }
        return product;
    }

    // Get a payment by id.
    /*  @docs:
        @title: Get Payment.
        @desc: Get a payment by id.
        @param:
            @name: id
            @required: true
            @type: string
            @desc: The id of the payment.
        @funcs: 2
    */
    async get_payment(id) {
        return this._sys_load_payment(id);
    }
    get_payment_sync(id) {
        return this._sys_load_payment(id);
    }

    // Get payments.
    /*  @docs:
        @title: Get Refunded Payments.
        @desc:
            Get all payments.

            All failed payments are no longer stored in the database.
        @param:
            @name: uid
            @cached: Users:uid:param
        @param:
            @name: days
            @type: number
            @desc: Retrieve payments from the last amount of days.
        @param:
            @name: limit
            @type: number
            @desc: Limit the amount of response payment objects.
        @param:
            @name: status
            @type: string
            @desc: Filter the payments by status. Be aware that the line items of a payment also have a status with possible values of `open`, `cancelled`, `refunding` or `refunded.`
            @enum:
                @value: "open"
                @desc: Payments that are still open and unpaid.
            @enum:
                @value: "paid"
                @desc: Payments that are paid.
    */
    async get_payments({
        uid,  
        days = 30,
        limit = null,
        status = null,
    }) {

        // Get path.
        const dir = this.server.database.join(`.sys/pym_p/${uid}/`, false);
        if (dir.exists() === false) {
            return [];
        }

        // Get the since time.
        let since = null;
        if (days != null) {
            since = new Date();
            since.setHours(0, 0, 0, 0)
            since = Math.floor(created.getTime() - (3600 * 24 * 1000 * days));
        }

        // Iterate dir.
        const payments = [];
        dir.paths_sync((path) => {
            if (since == null || path.ctime >= since) {
                const payment = path.load_sync({type: "object"});
                if (status == null || status === payment.status) {
                    payments.append(payment);
                }
            }
            if (payments.length >= limit) {
                return false;
            }
        })

        // Response.
        return payments;
    }

    // Get all refundable payments.
    /*  @docs:
        @title: Get Refundable Payments.
        @desc: Get all payments that are refundable.
        @param:
            @name: uid
            @cached: Users:uid:param
        @param:
            @name: days
            @type: number
            @desc: Retrieve payments from the last amount of days.
        @param:
            @name: limit
            @type: number
            @desc: Limit the amount of response payment objects.
    */
    async get_refundable_payments({
        uid,  
        days = 30,
        limit = null,
    }) {
        const payments = [];
        const all_payments = await this.get_payments({uid, days, limit, status: "paid"});
        all_payments.iterate((payment) => {
            line_items = [];
            payment.line_items.iterate((item) => {
                if (item.status !== "cancelled" && item.status !== "refunded" && item.status !== "refunding") {
                    line_items.push(item);
                }
            })
            payment.line_items = line_items;
            payments.push(payment);
        })
        return payments;
    }

    // Get all refunded payments.
    /*  @docs:
        @title: Get Refunded Payments.
        @desc: Get all payments that are successfully refunded.
        @param:
            @name: uid
            @cached: Users:uid:param
        @param:
            @name: days
            @type: number
            @desc: Retrieve payments from the last amount of days.
        @param:
            @name: limit
            @type: number
            @desc: Limit the amount of response payment objects.
    */
    async get_refunded_payments({
        uid,  
        days = 30,
        limit = null,
    }) {
        const payments = [];
        const all_payments = await this.get_payments({uid, days, limit, status: "paid"});
        all_payments.iterate((payment) => {
            line_items = [];
            payment.line_items.iterate((item) => {
                if (item.status === "refunded") {
                    line_items.push(item);
                }
            })
            payment.line_items = line_items;
            payments.push(payment);
        })
        return payments;
    }

    // Get all payments that are currently in the refunding process.
    /*  @docs:
        @title: Get Refunding Payments.
        @desc: Get all payments that are currently in the refunding process.
        @param:
            @name: uid
            @cached: Users:uid:param
        @param:
            @name: days
            @type: number
            @desc: Retrieve payments from the last amount of days.
        @param:
            @name: limit
            @type: number
            @desc: Limit the amount of response payment objects.
    */
    async get_refunding_payments({
        uid,  
        days = null,
        limit = null,
    }) {
        const payments = [];
        const all_payments = await this.get_payments({uid, days, limit, status: "paid"});
        all_payments.iterate((payment) => {
            line_items = [];
            payment.line_items.iterate((item) => {
                if (item.status === "refunding") {
                    line_items.push(item);
                }
            })
            payment.line_items = line_items;
            payments.push(payment);
        })
        return payments;
    }

    // Create a payment session for the drop-in integration.
    // 3D secure 2: https://docs.adyen.com/online-payments/3d-secure/native-3ds2/web-drop-in/
    /*  @docs:
        @title: Create Payment.
        @desc: Create a payment from the a shopping cart.
        @param:
            @name: uid
            @cached: Users:uid:param
        @param:
            @name: cart
            @type: array[object]
            @required: true
            @desc: The shopping cart.
        @param:
            @name: billing_details
            @type: object
            @required: true
            @desc: The billing details cart.
        @param:
            @name: ip
            @type: string
            @required: true
            @desc: The client ip.
    */
    async create_payment({
        uid = null,
        cart = [],
        billing_details = {},
        ip = "",
    }) {

        // Check args.
        vlib.scheme.verify({object: {uid, cart, billing_details, ip}, scheme: {
            uid: {type: "number", required: false},
            cart: "array",
            billing_details: {
                type: "object",
                scheme: {
                    billing_details: "string",
                    first_name: "string",
                    last_name: "string",
                    email: "string",
                    street: "string",
                    house_number: "string",
                    postal_code: "string",
                    city: "string",
                    province: "string",
                    country: "string",
                    phone_number: "string",
                }
            },
            ip: "string",
        }})

        // Vars.
        const id = `pym_${uid == null ? "unauth" : uid}_${Date.now()}${String.random(4)}`;
        const cus_id = this._create_customer_id(uid);
        let statement_descriptor = undefined;
        let amount = 0;
        let currency = null;
        let is_subscription = null;
        let subscription_mandate = undefined;
        const line_items = [];
        const payment_obj = {
            id: id,                 // payment id.
            uid: uid,               // user id,
            cus_id: cus_id,         // customer id.
            sub_id: null,           // subscription id.
            psp_id: null,           // the psp id from adyen, required for refund.
            timestamp: Date.now(),  // timestamp in ms.
            status: "open",         // payment status, possible values are "open" or "paid".
            line_items: [],         // cart line items as {quantity: 1, product: "prod_xxx"}.
            billing_details,        // billing details.
        }

        // Check products.
        const plan_count_per_product = {};
        cart.iterate((item) => {
            console.log(item);

            // Get product.
            let product = item.product;
            if (product == null) {
                product = this.get_product_sync(item.id, true);
            }

            // Set default quantity.
            if (item.quantity == null) {
                item.quantity = 1;
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
                payment_obj.is_subscription = is_subscription;
                if (is_subscription === true && uid == null) {
                    throw Error(`You must be authenticated to purchase a subscription, please sign in.`);
                }
            } else if (is_subscription != product.is_subscription) {
                throw Error(`You can not charge both subscriptions and one-time payments in one request.`);
            }

            // Check subscriptions.
            if (product.is_subscription) {

                // Check if plan was passed and not the product.
                if (product.parent_id == null) {
                    throw Error(`A subscription product can't be charged, instead add a subscription plan to your cart.`);
                }

                // Check quantity.
                if (item.quantity > 1) {
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
                if (subscription_mandate !== undefined) {
                    throw Error(`You can only charge a single subscription per request.`);
                } else {
                    subscription_mandate = {
                        amount: parseInt(product.price * 100).toString(),
                        amountRule: "exact", // Exact price.
                        billingAttemptsRule: "on", // On exact date.
                        billingDay: "1", // First day of the month.
                        endsAt: "", // End date of the billing plan, in YYYY-MM-DD format.
                        frequency: product.frequency, // The frequency with which a shopper should be charged. Possible values: daily, weekly, biWeekly, monthly, quarterly, halfYearly, yearly.
                    };
                }
            }

            // Set statement descriptor.
            if (statement_descriptor === undefined && product.statement_descriptor != null) {
                statement_descriptor = product.statement_descriptor;
            }

            // Add line item to payment object.
            payment_obj.line_items.push({
                status: "paid", // payment status, possible values are "paid", "cancelled", "refunding" or "refunded".
                product: product.id, 
                quantity: item.quantity,
            });

            // Add to line items.
            amount += parseInt(product.price * 100) * item.quantity;
            line_items.push({
                id: product.id,
                description: product.description,
                // amountIncludingTax: parseInt(product.price * 100),
                amountExcludingTax: parseInt(product.price * 100),
                quantity: item.quantity,
                imageUrl: product.icon,
                receiverEmail: billing_details.email,
            })
        })

        // Arguments.
        const args = {
            reference: id,
            returnUrl: this.return_url,
            merchantAccount: this.account_id,
            channel: "web",
            mode: "embedded",
            countryCode: billing_details.country,
            shopperEmail: billing_details.email,
            shopperIP: ip,
            shopperStatement: statement_descriptor,
            shopperReference: cus_id,
            telephoneNumber: billing_details.phone_number,
            // storePaymentMethod: is_subscription, // cant be used in combination with enableRecurring.
            lineItems: line_items,
            blockedPaymentMethods: this.blockedPaymentMethods,
            billingAddress: {
                city: billing_details.city,
                country: billing_details.country,
                houseNumberOrName: billing_details.house_number,
                postalCode: billing_details.postal_code,
                stateOrProvince: billing_details.province,
                street: billing_details.street,
            },
            deliveryAddress: {
                city: billing_details.city,
                country: billing_details.country,
                firstName: billing_details.first_name,
                houseNumberOrName: billing_details.house_number,
                lastName: billing_details.last_name,
                postalCode: billing_details.postal_code,
                stateOrProvince: billing_details.province,
                street: billing_details.street,
            },
            shopperName: {
                firstName: billing_details.first_name,
                lastName: billing_details.last_name,
            },
            company: {
                homePage: `${this.server.full_domain}/`,
                name: this.server.company.legal_name,
                registrationNumber: this.server.company.registration_id,
                registryLocation: `${this.server.company.street} ${this.server.company.house_number}, ${this.server.company.postal_code}, ${this.server.company.city}, ${this.server.company.province}, ${this.server.company.country}`,
                taxId: this.server.company.tax_id,
                type: this.server.company.type,
            },
            // accountInfo: {} // @todo still add for 3D Secure 2.
        }

        // Recurring.
        if (is_subscription) {
            args.enableRecurring = true;
            args.recurringProcessingModel = "Subscription";
            args.mandate = subscription_mandate;
        }

        // Non recurring.
        args.amount = {
            currency: currency.toUpperCase(),
            value: amount,
        }

        // Create payment.
        try {

            // Make request.
            const response = await this.checkout.PaymentsApi.sessions(args);
            console.log(response);

            // Save to database.
            this._sys_save_payment(payment_obj);

            // Response.
            return response;
        }

        // Handle error.
        catch (error) {
            throw this._handle_error(error);
        }
    }

    // Refund a payment.
    /*  @docs:
        @title: Refund Payment.
        @desc: Refund a payment based on the payment id.
        @warning: Refunding a subscription will also cancel all other subscriptions that were created by the same payment request.
        @param:
            @name: payment
            @required: true
            @type: number
            @desc: The id of the payment object or the payment object itself.
        @param:
            @name: line_items
            @required: true
            @type: array[object]
            @desc: The line items to refund, these must be retrieved from the original payment line items otherwise it may cause undefined behaviour. When undefined the entire payment will be refunded.
    */
    async create_refund(payment, line_items = null) {
        return this._refund_payment(
            payment,
            line_items,
        );
    }

    // Cancel a subscription.
    /*  @docs:
        @title: Cancel Subscription.
        @desc: Cancel a subscription based on the retrieved payment object or id.
        @warning: Cancelling a subscription will also cancel all other subscriptions that were created by the same payment request.
        @param:
            @name: payment
            @required: true
            @type: string, object
            @desc: The payment id or the retrieved payment object.
    */
    async cancel_subscription(payment) {
        if (typeof payment === "string") {
            payment = this._sys_load_payment(payment);
        }
        if (payment.cus_id == null) {
            throw Error(`Payment "${payment.id}" does not have an assigned customer id attribute.`);
        }
        if (payment.sub_id == null) {
            throw Error(`Payment "${payment.id}" does not have an assigned subscription id attribute, it may not be a subscription payment.`);
        }
        edits = 0;
        await payment.line_items.iterate_async_await(async (item) => {
            if (item.status !== "cancelled" && item.status !== "refunding" && item.status !== "refunded") {
                const {exists, sub_id} = this._sys_check_subscription(uid, item.id, true);
                if (exists) {
                    try {
                        await this.checkout.RecurringApi.disable({
                            merchantAccount: this.account_id,
                            recurringDetailReference: sub_id,
                            shopperReference: cus_id,
                        });
                    } catch (error) {
                        throw this._handle_error(error);
                    }
                    this._sys_delete_subscription(uid, item.id);
                    item.status = "cancelled";
                    ++edits;
                }
            }
        })
        if (edits === 0) {
            throw Error("This payment does not contain any cancellable subscriptions.");
        }
        this._sys_save_payment(payment);
    }

    // Get the invoice path of a payment.
    /*  @docs:
        @title: Get Invoice Path
        @desc:
            Get the invoice path of a paid payment.

            When no invoice exists, one will be created.
        @param:
            @name: payment
            @required: true
            @type: object
            @desc: The payment object.
        @return:
            @type: Promise
            @desc: This function returns a promise to the invoice path with type `vlib.Path`.
        @funcs: 2
    */
    async get_invoice(payment) {
        return this.get_invoice_sync(payment);
    }
    get_invoice_sync(payment) {
        const uid = payment.id.split("_")[1];
        const dir = this.server.database.join(`.sys/pym_p/${uid}/`, false);
        if (dir.exists() === false) {
            dir.mkdir_sync();
        }
        const path = dir.join(`${payment.id}.invoice.pdf`, false);
        if (path.exists() === false) {
            return this.generate_invoice_sync({payment, path});
        }
        return path;
    }

    // Generate an invoice.
    // Source: https://github.com/PSPDFKit-labs/pdfkit-invoice/blob/master/createInvoice.js
    /*  @docs:
        @title: Generate Invoice
        @desc:
            Generate an invoice for a paid payment.

            By default an invoice is already generated when a payment has been paid.
        @param:
            @name: payment
            @required: true
            @type: object
            @desc: The payment object.
        @param:
            @name: icon
            @required: false
            @type: string
            @desc: The file path of the icon.
        @param:
            @name: path
            @required: false
            @type: string, vlib.Path
            @desc: The export path of the invoice.
        @return:
            @type: Promise
            @desc: This function returns a promise to the invoice export path with type `vlib.Path`.
        @funcs: 2
    */
    async generate_invoice({payment, icon = null, path = null}) {
        return this.generate_invoice_sync({payment, icon, path});
    }
    generate_invoice_sync({payment, icon = null, path = null}) {

        // Args.
        if (payment == null || typeof payment !== "object") {
            throw Error(`Parameter "payment" should be a defined value of type "object".`);
        }
        if (icon == null) {
            icon = this.server.company.icon;
        }
        if (path == null) {
            const uid = payment.id.split("_")[1];
            const dir = this.server.database.join(`.sys/pym_p/${uid}/`, false);
            if (dir.exists() === false) {
                dir.mkdir_sync();
            }
            path = dir.join(`${payment.id}.invoice.pdf`, false);
        } else {
            path = vlib.Path(path);
        }


        // Vars.
        let currency = null;
        let subtotal = 0;
        let vat_subtotal = 0;
        payment.line_items.iterate((item) => {
            if (typeof item.product === "string") {
                item.product = this.get_product_sync(item.product);
            }
            if (currency == null) {
                currency = utils.get_currency_symbol(item.product.currency);
            }
            subtotal += item.product.price * item.quantity;
        })
        let balance_due = payment.status === "open" ? subtotal : 0;
        let doc = new PDFDocument({ size: "A4", margin: 50 });


        /* Doc vars. */
        let top_offset = 57;
        let spacing = 10;

        // Wrapper func.
        const gen_text = (text, x, y = null, opts = null, _spacing = null) => {
            if (y == null) {
                y = top_offset;
            } else {
                top_offset = y;
            }
            if (_spacing == null) {
                _spacing = spacing;
            }
            doc.text(text, x, y, opts);
            top_offset += doc.heightOfString(text, x, y, opts) + (_spacing == null ? spacing : _spacing);
        }
        const gen_col_text = (text, x, opts = null, is_last = false, _spacing = 2) => {
            doc.text(text, x, top_offset, opts);
            if (is_last) {
                top_offset += doc.heightOfString(text, x, top_offset, opts) + (_spacing == null ? spacing : _spacing);
            } else {
                return doc.heightOfString(text, x, top_offset, opts);
            }
        }
        const gen_divider = (_spacing = null) => {
            doc
                .strokeColor("#aaaaaa")
                .lineWidth(1)
                .moveTo(50, top_offset)
                .lineTo(550, top_offset)
                .stroke();
            top_offset += 1 + (_spacing == null ? spacing : _spacing);
        }
        const gen_line_item = ({name = "", desc = "", unit_cost = "", quantity = "", total_cost = ""}) => {
            const items = [
                [0.25, name],
                [0.35, desc],
                [0.4 / 3, unit_cost],
                [0.4 / 3, quantity],
                [0.4 / 3, total_cost],
            ];

            let x = 50;
            let max_height = 0;
            const full_width = (550 - 50) - (10 * 4);

            // Get max height.
            items.iterate((item) => {
                max_height = Math.max(max_height, doc.heightOfString(item[1], x, top_offset, { width: full_width * item[0], align: "left" }));
                x += (full_width * item[0]) + 10;
            })

            // Check if a new page should be added.
            if (top_offset + max_height + 10 > doc.page.height - 50) {
                doc.addPage();
                top_offset = 50;
            }

            // Add items.
            x = 50;
            items.iterate((item) => {
                gen_col_text(item[1], x, { width: full_width * item[0], align: "left" })
                x += (full_width * item[0]) + 10;
            })

            // Add top offset.
            top_offset += max_height + spacing;
        }
        const format_date = (date) => {
            return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
        }

        // Header.
        doc.fillColor("#444444")
        doc.fontSize(20)
        if (icon != null) {
            doc.image(icon, 50, top_offset - 2, { width: 18 })
        }
        gen_text(this.server.company.legal_name, 50 + 18 + 10)
        top_offset += 15;

        // From (left).
        const start_top_offset = top_offset;
        doc.fillColor("#444444")
        doc.fontSize(10)
        doc.font("Helvetica-Bold")
        gen_text("From", 50, null, null, 3);
        doc.font("Helvetica")
        gen_text(this.server.company.legal_name, 50, null, { align: "left" }, 2)
        gen_text(`${this.server.company.street} ${this.server.company.house_number}, ${this.server.company.postal_code}`, 50, null, { align: "left" }, 2)
        gen_text(`${this.server.company.city}, ${this.server.company.province}, ${this.server.company.country}`, 50, null, { align: "left" }, 2)
        gen_text(`VAT ID: ${this.server.company.tax_id}`, 50, null, { align: "left" }, 2)
        const left_top_offset = top_offset;

        // Invoice details (right).
        top_offset = start_top_offset
        doc.fillColor("#444444")
        doc.fontSize(10)
        doc.font("Helvetica-Bold")
        gen_text("Invoice details", 550 - (150 + 10 + 80), null, null, 3);
        doc.font("Helvetica");
        [
            ["Invoice number:", payment.id],
            ["Date of issue:", format_date(new Date())],
        ].iterate((item) => {
            gen_col_text(item[0], 550 - (150 + 10 + 80), {width: 80})
            gen_col_text(item[1], 550 - 150, {width: 150}, true)
        })

        // Go down.
        top_offset = Math.max(top_offset, left_top_offset) + 25;

        // Billing details.
        doc.fillColor("#444444")
        doc.fontSize(10)
        doc.font("Helvetica-Bold")
        gen_text("Billing Details", 50, null, null, 3);
        doc.font("Helvetica")
        gen_text(`${payment.billing_details.first_name} ${payment.billing_details.last_name}`, 50, null, { align: "left" }, 2);
        gen_text(payment.billing_details.email, 50, null, { align: "left" }, 2);
        gen_text(`${payment.billing_details.street} ${payment.billing_details.house_number}`, 50, null, { align: "left" }, 2);
        gen_text(`${payment.billing_details.city}, ${payment.billing_details.province}, ${payment.billing_details.country}`, 50, null, { align: "left" }, 2);

        // Go down.
        top_offset += 35;

        // Line items.
        doc.font("Helvetica-Bold");
        gen_line_item({
            name: "Item",
            desc: "Description",
            unit_cost: "Unit Cost",
            quantity: "Quantity",
            total_cost: "Line Total",
        });
        top_offset -= spacing * 0.5;
        doc.font("Helvetica");
        gen_divider();
        for (let i = 0; i < 25; i++) {
            payment.line_items.iterate((item) => {
                gen_line_item({
                    name: item.product.name,
                    desc: item.product.description,
                    unit_cost: `${currency} ${item.product.price.toFixed(2)}`,
                    quantity: item.quantity.toString(),
                    total_cost: `${currency} ${(item.product.price * item.quantity).toFixed(2)}`,
                });
                top_offset += 10;
                gen_divider();
            });
        }
        gen_line_item({unit_cost: "Subtotal:", total_cost: `${currency} ${subtotal.toFixed(2)}`});
        top_offset -= (spacing - 3);
        gen_line_item({unit_cost: "Taxes:", total_cost: `${currency} ${vat_subtotal.toFixed(2)}`});
        top_offset -= (spacing - 3);
        doc.font("Helvetica-Bold");
        gen_line_item({unit_cost: "Total Due:", total_cost: `${currency} ${balance_due.toFixed(2)}`});
        top_offset -= (spacing - 3);

        // Create invoice.
        doc.end();
        doc.pipe(fs.createWriteStream(path.str()));

        // Return the path.
        return path;
    }
}

// Exports.
module.exports = Adyen;
