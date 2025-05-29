/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// A stripe error.
// Since the stacktrace of stripe errors do not show the function calls from vweb.
class StripeError extends Error {
    constructor(message) {
        super(message);
    }
}


// The stripe class.
// @todo check with the provider for how long refunds can be made, otherwise when a user's api key gets hacked all of the payments in history could be refunded, resulting in catastrophe.
/*  @docs:
 *  @chapter: Backend
 *  @title: Stripe
 *  @description: 
 *      The stripe payments class.
 *  @parameter:
 *      @name: products
 *      @type: object
 *      @description: 
 *          The payment products or subscriptions.
 *
 *          When the payment products has a value defined for attribute `recurring` it will become a subscription instead of a one-time payment.
 *
 *          Warning: The stripe products that do not match any of the payment products' id's will be deactivated and all subscriptions cancelled.
 *
 *          Warning: The payment product objects are accessable by anyone through the backend rest api so they should not contain any sensitive data.
 *
 *          Warning: Automatic tax must be enabled at https://dashboard.stripe.com/settings/tax. Afterwards registrations must be set up at https://stripe.com/docs/tax/registering otherwise payments may be refused.
 *          
 *          A one-time payment product object looks like:
 *          ```js
 *          {
 *              id: "prod_premium",                 // an unique id across your entire stripe account. Warning: this id can never be changed. Or the old product will be deactivated from your stripe account.
 *              name: "Premium",                    // the name of the subscription.
 *              description: "...",                 // the description of the subscription.
 *              price: 9.99,                        // price in decimals.
 *              currency: "eur",                    // ISO currency code (lowercase)
 *              statement_descriptor: undefined,    // (optional) An arbitrary string to be displayed on your customer’s credit card or bank statement, max 22 chars long.
 *              icon: undefined,                    // (optional) the absolute url or the endpoint url (string that starts with a `/`) to the product's icon.
 *              tax_behavior: undefined,            // (optional) tax behavior, "inclusive" or "exclusive".
 *              tax_code: undefined,                // (optional) the product's tax code, more info can be found at https://stripe.com/docs/tax/tax-codes?type=digital.
 *          }```
 *
 *          A subscription product looks like:
 *          ```js
 *          {
 *              plans: [{
 *                  id: "prod_premium",              // an unique id across your entire stripe account. Warning: this id can never be changed. Or the old product will be deactivated from your stripe account.
 *                  name: "Premium",                // the name of the subscription.
 *                  description: "...",             // the description of the subscription.
 *                  price: 9.99,                    // price in decimals.
 *              }],
 *              currency: "eur",                    // ISO currency code (lowercase)
 *              interval: "month",                  // the recurring interval format, the following values are supported `["day", "week", "month", "year"]`.
 *              interval_count: 1,                  // (optional) the recurring interval count, by default `1`.
 *              statement_descriptor: undefined,    // (optional) An arbitrary string to be displayed on your customer’s credit card or bank statement, max 22 chars long.
 *              icon: undefined,                    // (optional) the absolute url or the endpoint url (string that starts with a `/`) to the product's icon.
 *              tax_behavior: undefined,            // (optional) tax behavior, "inclusive" or "exclusive".
 *              tax_code: undefined,                // (optional) the product's tax code, more info can be found at https://stripe.com/docs/tax/tax-codes?type=digital.
 *          }```
 *
 *          The following attributes may be defined in the subscription object and will be used for all the plan objects when the plan object's attribute is not defined.
 *          Or they may be defined for each plan to specify a unique value per plan.
 *              - name
 *              - description
 *              - currency
 *              - interval
 *              - interval_count
 *              - statement_descriptor
 *              - icon
 *              - tax_behavior
 *              - tax_code
 *
 *          When the user purchases a subscription for one of the plans, the other active plans from that subscription will automatically be cancelled.
 *
 *          Warning: 
 *              - The stripe settings should be configured to cancel subscriptions when all payment attempts on a subscription renewal have failed.
 *                It should be configured by default but it can be configered under "Manage failed payments" at https://dashboard.stripe.com/settings/billing/automatic.
 *  @parameter:
 *      @name: on_refund
 *      @type: function
 *      @description: 
 *          The event that will be triggerred when a refund has been processed successfully.
 *
 *          The callback can also be assigned later to the server object under the same attribute name as the parameter's name.
 *
 *          By default vweb sends an email to the user informing them of the event. However when the callback returns an object with `send_mail: false` assigned, vweb will not email the user.
 *
 *          The callback may accept the following paramters:
 *          ```js
 *          ({
 *              uid: <number>,          // the user id that requested the refund.
 *              cid: <string>,          // the stripe customer id of the user that requested the refund.
 *              invoice: <string>,      // the id of the invoice of the requested refund.
 *              invoice_item: <string>, // the id of the invoice item of the requested refund.
 *              refund: <object>,       // the refund object.
 *          });
 *          ```
 *  @parameter:
 *      @name: on_refund_request
 *      @type: function
 *      @description: 
 *          The event that will be triggerred when a refund request has been made with `auto_advance` disabled.
 *
 *          The callback can also be assigned later to the server object under the same attribute name as the parameter's name.
 *
 *          In this callback you can send an email to your customer with refund instructions.
 *          When the user has fulfilled all refund requirements, the refund request can be retrieved with `Server.get_open_refund(refund.id)` using the `id` attribute of the refund object.
 *          Then the refund can be confirmed with `Server.create_refund({payment: refund.payment, auto_advance: true})` using the `payment` attribute of the refund object.
 *
 *          The callback may accept the following paramters:
 *          ```js
 *          ({
 *              uid: <number>,          // the user id that requested the refund.
 *              cid: <string>,          // the stripe customer id of the user that requested the refund.
 *              payment: <object>,      // the payment object from `Server.get_payments()`.
 *              invoice: <string>,      // the id of the invoice of the requested refund.
 *              invoice_item: <string>, // the id of the invoice item of the requested refund.
 *              refund: <object>,       // the refund object.
 *          });
 *          ```
 *  @parameter:
 *      @name: on_refund_failed
 *      @type: function
 *      @description: 
 *          The event that will be triggerred when a refund has been processed successfully.
 *
 *          The callback can also be assigned later to the server object under the same attribute name as the parameter's name.
 *
 *          By default vweb sends an email to the user informing them of the event. However when the callback returns an object with `send_mail: false` assigned, vweb will not email the user.
 *
 *          The callback may accept the following paramters:
 *          ```js
 *          ({
 *              uid: <number>,              // the user id that requested the refund.
 *              cid: <string>,              // the stripe customer id of the user that requested the refund.
 *              reason: <string>,           // the failure reason string.
 *              description: <string>,      // the failure reason description.
 *              requires_action: <boolean>, // a boolean indicating whether the refund failed because it required user action.
 *              invoice: <string>,          // the id of the invoice of the requested refund.
 *              invoice_item: <string>, // the id of the invoice item of the requested refund.
 *              refund: <object>,           // the stripe refund object.  
 *          });
 *          ```
 *  @parameter:
 *      @name: on_payment_requires_action
 *      @type: function
 *      @description: 
 *          The event that will be triggerred when a refund has been processed successfully.
 *
 *          The callback can also be assigned later to the server object under the same attribute name as the parameter's name.
 *
 *          The callback may accept the following paramters:
 *          ```js
 *          ({
 *              uid: <number>,      // the user id of the user that made the payment.
 *              cid: <string>,      // the stripe customer id of the user that made the payment.
 *              invoice: <object>,  // the stripe invoice object of the payment.
 *          })
 *          ```
 *  @parameter:
 *      @name: on_payment_failed
 *      @type: function
 *      @description: 
 *          The event that will be triggerred when a refund has been processed successfully.
 *
 *          The callback can also be assigned later to the server object under the same attribute name as the parameter's name.
 *
 *          The callback may accept the following paramters:
 *          ```js
 *          ({
 *              uid: <number>,      // the user id of the user that made the payment.
 *              cid: <string>,      // the stripe customer id of the user that made the payment.
 *              invoice: <object>,  // the stripe invoice object of the payment.
 *          })
 *          ```
 *  @parameter:
 *      @name: on_payment
 *      @type: function
 *      @description: 
 *          The event that will be triggerred when a refund has been processed successfully.
 *
 *          The callback can also be assigned later to the server object under the same attribute name as the parameter's name.
 *
 *          By default vweb sends an email to the user informing them of the event. However when the callback returns an object with `send_mail: false` assigned, vweb will not email the user.
 *
 *          The callback may accept the following paramters:
 *          ```js
 *          ({
 *              uid: <number>,              // the user id of the user that made the payment.      
 *              cid: <string>,              // the stripe customer id of the user that made the payment.
 *              product: <object>,          // the user defined product that was purchased.
 *              quantity: <number>,         // the quantity of the product that was purchased.
 *              address: <object>,          // the address information of the purchase.
 *              invoice_item: <object>,     // the stripe invoice item object.
 *              invoice: <object>,          // the stripe invoice object.
 *          });
 *          ```
 *  @parameter:
 *      @name: on_susbcription
 *      @type: function
 *      @description: 
 *          The event that will be triggerred when a refund has been processed successfully.
 *
 *          The callback can also be assigned later to the server object under the same attribute name as the parameter's name.
 *
 *          By default vweb sends an email to the user informing them of the event. However when the callback returns an object with `send_mail: false` assigned, vweb will not email the user.
 *
 *          The callback may accept the following paramters:
 *          ```js
 *          ({
 *              uid: <number>,                  // the user id of the user that made the payment.      
 *              cid: <string>,                  // the stripe customer id of the user that made the payment.
 *              product: <object>,              // the user defined product that was purchased.
 *              quantity: <number>,             // the quantity of the product that was purchased.
 *              subscription_item: <object>,    // the stripe subscription item object.
 *              subscription: <object>,         // the stripe subscription object.
 *          });
 *          ```
 *  @parameter:
 *      @name: on_susbcription_cancelled
 *      @type: function
 *      @description: 
 *          The event that will be triggerred when a refund has been processed successfully.
 *
 *          The callback can also be assigned later to the server object under the same attribute name as the parameter's name.
 *
 *          By default vweb sends an email to the user informing them of the event. However when the callback returns an object with `send_mail: false` assigned, vweb will not email the user.
 *
 *          The callback may accept the following paramters:
 *          ```js
 *          ({
 *              uid: <number>,                  // the user id of the user that made the cancellation.      
 *              cid: <string>,                  // the stripe customer id of the user that made the cancellation.
 *              product: <object>,              // the user defined product that was cancelled.
 *              subscription_item: <object>,    // the stripe subscription item object.
 *              subscription: <object>,         // the stripe subscription object.
 *          })
 *          ```
 *  @attribute:
 *      @name: secret_key
 *      @type: string
 *      @description: The stripe secret key. Required to accept payments.
 *  @attribute:
 *      @name: webhook_key
 *      @type: string
 *      @description: The webhook key, only required in development mode when you are forwarding webhooks through the Stripe CLI.
 *  @attribute:
 *      @name: return_url
 *      @type: string
 *      @description: The absolute url or the endpoint url (string that starts with a `/`) where the user will be redirected to after a payment (e.g. https://mydomain.com/payments/redirect).
 *  @attribute:
 *      @name: automatic_tax
 *      @type: boolean
 *      @description: Enable automatic tax for payments.
 */

class Stripe {

	// Constructor.
	constructor({
        secret_key,
        webhook_key,
        automatic_tax = true,
        return_url = null,
        products = [],
        on_refund = null,
        on_refund_request = null,
        on_refund_failed = null,
        on_payment_requires_action = null,
        on_payment_failed = null,
        on_payment = null,
        on_susbcription = null,
        on_susbcription_cancelled = null,
        _server,
	}) {

        // Check args.
        if (typeof secret_key !== "string") {
            throw Error(`Parameter "secret_key" should be a defined value of type "string".`);
        }
        if (typeof return_url !== "string") {
            throw Error(`Parameter "return_url" should be a defined value of type "string".`);
        }

        // Attributes.
        this.stripe = require("stripe")(secret_key);
        this.webhook_key = webhook_key;
        this.automatic_tax = automatic_tax;
        this.return_url = return_url;
        this.products = products;
        this.on_refund = on_refund;
        this.on_refund_request = on_refund_request;
        this.on_refund_failed = on_refund_failed;
        this.on_payment_requires_action = on_payment_requires_action;
        this.on_payment_failed = on_payment_failed;
        this.on_payment = on_payment;
        this.on_susbcription = on_susbcription;
        this.on_susbcription_cancelled = on_susbcription_cancelled;
        this.server = _server;

        // Full url.
        if (this.return_url.charAt(0) === "/") {
            this.return_url = `${this.server.full_domain}${this.return_url}`;
        }

        // Checks.
        if (this.server.production && this.server.https === undefined) {
            throw Error("Accepting payments in production mode requires HTTPS.");
        }
	}

    // ---------------------------------------------------------
    // Private.
    /* 
        Sources: 
            * https://stripe.com/docs/api/prices?lang=node
            * https://stripe.com/docs/api/subscriptions/create?lang=node
            * https://stripe.com/docs/payments/accept-a-payment?platform=web&ui=elements&client=html
            * https://stripe.com/docs/billing/subscriptions/build-subscriptions?ui=elements
     
    */

	// Parse the `data` attribute of a stripe response as a list.
    _parse_as_list(data) {
        if (Array.isArray(data) === false) {
            if (data != null && typeof data === "object") {
                data = [data];
            } else {
                data = [];
            }
        }
        return data;
    }

    // Parse the a refund object.
    _parse_refund(refund) {

        // Failure description.
        if (refund.status === "failed") {
            switch (failure_reason) {
                case "charge_for_pending_refund_disputed": 
                    refund.failure_description = "A customer disputed the charge while the refund is pending. In this case, we recommend accepting or challenging the dispute instead of refunding to avoid duplicate reimbursements to the customer.";
                    break;
                case "declined": 
                    refund.failure_description = "Refund declined by our financial partners.";
                    break;
                case "expired_or_canceled_card": 
                    refund.failure_description = "Payment method is canceled by a customer or expired by the partner.";
                    break;
                case "insufficient_funds": 
                    refund.failure_description = "Refund is pending due to insufficient funds and has crossed the pending refund expiry window.";
                    break;
                case "lost_or_stolen_card": 
                    refund.failure_description = "Refund has failed due to loss or theft of the original card.";
                    break;
                case "merchant_request": 
                    refund.failure_description = "Refund failed upon the business’s request.";
                    break;
                case "unknown": 
                default:
                    refund.failure_description = "Refund has failed due to an unknown reason.";
                    break;
            }
        }

        // Status description.
        switch (refund.status) {
            case "pending": 
                refund.status_description = "The refund request is being processed.";
                break;
            case "succeeded": 
                refund.status_description = "The payment has successfully been refunded.";
                break;
            case "failed": 
                refund.status_description = refund.failure_description;
                break;
            case "requires_action": 
                refund.status_description = "The refund request requires action.";
                break;
            case "canceled": 
                refund.status_description = "The refund request has been cancelled.";
                break;
            case "unknown": 
            default:
                refund.status_description = "Unknown status.";
                break;
        }
    }

    // Check if a uid has a stripe customer id.
    _sys_has_cid(uid) {
        return this.server.database.join(`.sys/stripe_uids/${uid}`, false).exists();
    }

    // Load, save or delete stripe customer id by uid.
    _sys_load_cid(uid) {
        return this.server.database.join(`.sys/stripe_uids/${uid}`, false).load_sync();
    }
    _sys_load_uid_by_cid(cid) {
        return this.server.database.join(`.sys/stripe_cids/${cid}`, false).load_sync();
    }
    _sys_save_cid(uid, cid) {
        this.server.database.join(`.sys/stripe_uids/${uid}`, false).save_sync(cid);
        this.server.database.join(`.sys/stripe_cids/${cid}`, false).save_sync(uid.toString());
    }
    _sys_delete_cid(uid, cid) {
        this.server.database.join(`.sys/stripe_uids/${uid}`, false).del_sync();
        this.server.database.join(`.sys/stripe_cids/${cid}`, false).del_sync();
    }

    // Add or remove a subscription to the user's active subscriptions.
    _sys_add_subscription(uid, prod_id, sub_id) {
        const dir = this.server.database.join(`.sys/stripe_subs/${uid}`, false);
        if (dir.exists() === false) {
            dir.mkdir_sync();
        }
        const path = dir.join(prod_id, false);
        path.save_sync(sub_id);
    }
    _sys_remove_subscription(uid, prod_id) {
        const dir = this.server.database.join(`.sys/stripe_subs/${uid}`, false);
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
        const dir = this.server.database.join(`.sys/stripe_subs/${uid}`, false);
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
        const dir = this.server.database.join(`.sys/stripe_subs/${uid}`, false);
        if (dir.exists() === false) {
            dir.mkdir_sync();
        }
        const products = [];
        dir.paths_sync((path) => {
            products.push(path.name());
        })
        return products;
    }

    // Add an open refund request to the database.
    _sys_add_open_refund(uid, id, payment) {
        const dir = this.server.database.join(`.sys/stripe_refunds/${uid}`, false);
        if (dir.exists() === false) {
            dir.mkdir_sync();
        }
        dir.join(id, false).save_sync(JSON.stringify(payment));
    }
    _sys_remove_open_refund(uid, id) {
        const dir = this.server.database.join(`.sys/stripe_refunds/${uid}`, false);
        if (dir.exists() === false) {
            return ;
        }
        const path = dir.join(id, false);
        if (path.exists()) {
            path.del_sync();
        }
    }
    _sys_get_open_refund(uid, id) {
        const dir = this.server.database.join(`.sys/stripe_refunds/${uid}`, false);
        if (dir.exists() === false) {
            throw Error(`User "${uid}" does not have an open refund "${id}".`)
        }
        const path = dir.join(id, false);
        if (path.exists() === false) {
            throw Error(`User "${uid}" does not have an open refund "${id}".`)
        }
        return path.load_sync({type: "object"});
    }
    _sys_get_open_refunds(uid = null) {
        const refunds = [];
        const base = this.server.database.join(`.sys/stripe_refunds/`, false);
        if (base.exists() === false) {
            return refunds;
        }
        if (uid == null) {
            base.paths_sync().iterate((uid_refunds) => {
                uid_refunds.paths_sync().iterate((refund) => {
                    refunds.push(refund.load_sync({type: "object"}));
                })    
            })
        } else {
            const uid_refunds = base.join(uid, false);
            if (base.exists() === false) {
                return refunds;
            }
            uid_refunds.paths_sync().iterate((refund) => {
                refunds.push(refund.load_sync({type: "object"}));
            })    
        }
        return refunds;
    }

    // Get a price.
    async _get_price(price_id) {
        try {
            return await this.stripe.prices.retrieve(price_id);
        } catch (error) {
            throw new StripeError(error.message); // since the default stripe errors do not have a stacktrace.
        }
    }

    // Deactivate a price.
    // Prices cant be correctly updated with recurring or prices so when a product price has been edited a new price object should be created.
    // @note: When a price is deactivated all subscriptions linked to this price will automatically be cancelled.
    async _deactivate_price(price_id) {
        await this._cancel_all_subscriptions(price_id)
        try {
            return await this.stripe.prices.update(price_id, {
                active: false,
            });
        } catch (error) {
            throw new StripeError(error.message); // since the default stripe errors do not have a stacktrace.
        }
    }

    // Create a price for a product.
    async _create_price(product) {
        try {
            const result = await this.stripe.prices.create({
                currency: product.currency,
                unit_amount_decimal: parseInt(product.price * 100),
                tax_behavior: product.tax_behavior,
                recurring: product.is_subscription ? {
                    interval: product.interval,
                    interval_count: product.interval_count,
                } : undefined,
                product: product.id,
            });
            product.price_id = result.id;
        } catch (error) {
            throw new StripeError(error.message); // since the default stripe errors do not have a stacktrace.
        }
    }

    // Get a product by stripe subscription id.
    async _get_product(product_id) {
        try {
            return await this.stripe.products.retrieve(product_id);
        } catch (error) {
            throw new StripeError(error.message); // since the default stripe errors do not have a stacktrace.
        }
    }

    // Get all products.
    async _get_products() {
        try {
            const result = await this.stripe.products.list();
            return this._parse_as_list(result.data);
        } catch (error) {
            throw new StripeError(error.message); // since the default stripe errors do not have a stacktrace.
        }
    }

    // Create a product.
    async _create_product(product) {
        try {
            const result = await this.stripe.products.create({
                id: product.id,
                name: product.name,
                description: product.description,
                statement_descriptor: product.statement_descriptor,
                tax_code: product.tax_code,
                default_price_data: {
                    currency: product.currency,
                    unit_amount_decimal: parseInt(product.price * 100),
                    tax_behavior: product.tax_behavior,
                    recurring: product.is_subscription ? {
                        interval: product.interval,
                        interval_count: product.interval_count,
                    } : undefined,
                },
            });
            product.price_id = result.default_price;
        } catch (error) {
            throw new StripeError(error.message); // since the default stripe errors do not have a stacktrace.
        }
    }

    // Update a product.
    // @warning: When the second argument "stripe_product" is undefined, then this function will assume the stripe product does not exist and a new product will be created.
    async _update_product(product, stripe_product) {

        // When the stripe product does not yet exist.
        if (stripe_product == null) {
            await this._create_product(product);
        }

        // When the stripe product already exists.
        else {

            // Vars.
            let stripe_price;
            const has_no_price = stripe_product.default_price == null;
            let update_price = false;

            // Check if the price object should be updated.
            if (has_no_price === false) {
                update_price = await (async () => {

                    // Fetch the price object.
                    stripe_price = await this._get_price(stripe_product.default_price);

                    // Not active.
                    if (stripe_price.active !== true)  {
                        return true;
                    }

                    // Changed price.
                    if (parseFloat(stripe_price.unit_amount_decimal) / 100 !== product.price) {
                        return true;
                    }

                    // Changed currency.
                    if (stripe_price.currency !== product.currency) {
                        return true;
                    }

                    // Changed recurring status.
                    if (
                        (stripe_price.type === "recurring" && !product.is_subscription) ||
                        (stripe_price.type !== "recurring" && product.is_subscription)
                    ) {
                        return true;
                    }

                    // Changed tax behavior.
                    if (stripe_price.tax_behavior !== product.tax_behavior) {
                        return true;
                    }

                    // Changed recurring interval.
                    if (product.is_subscription && (product.interval_count !== stripe_price.recurring.interval_count || product.interval !== stripe_price.recurring.interval)) {
                        return true;
                    }

                    // Should not be updated.
                    return false;

                })();

            }

            // Create a price object.
            if (has_no_price) {
                await this._create_price(product); // automatically assigns the price id.
            }

            // Update the price object.
            else if (update_price) {
                try {
                    await this.stripe.products.update(product.id, {
                        default_price: null,
                    });
                } catch (error) {
                    throw new StripeError(error.message); // since the default stripe errors do not have a stacktrace.
                }
                await this._deactivate_price(stripe_price.id);
                await this._create_price(product); // automatically assigns the price id.
            }

            // Set price id.
            else {
                product.price_id = stripe_price.id;
            }

            // Check if the name or description has changed.
            if (
                has_no_price ||
                update_price ||
                (stripe_product.name !== product.name) ||
                (stripe_product.description !== product.description) ||
                (product.statement_descriptor != null && stripe_product.statement_descriptor !== product.statement_descriptor) ||
                (product.icon != null && (stripe_product.images.length === 0 || stripe_product.images[0] !== product.icon)) ||
                (product.tax_code != stripe_product.tax_code)
            ) {
                try {
                    await this.stripe.products.update(product.id, {
                        // id: product.id,
                        name: product.name,
                        description: product.description,
                        statement_descriptor: product.statement_descriptor,
                        default_price: product.price_id,
                        tax_code: product.tax_code,
                        images: [product.icon],
                        active: true, // to prevent nasty bug then the user had it disabled.
                    });
                } catch (error) {
                    throw new StripeError(error.message); // since the default stripe errors do not have a stacktrace.
                }
            }

        }
    }

    // Deactivate a product.
    // When the product is a subscription all active subscriptions will be cancelled.
    async _deactivate_product(stripe_product) {

        // Deactivate the price object.
        // Also cancels all the active subscriptions.
        if (stripe_product.default_price != null) {
            try {
                await this.stripe.products.update(stripe_product.id, {
                    default_price: null,
                });
            } catch (error) {
                throw new StripeError(error.message); // since the default stripe errors do not have a stacktrace.
            }
            await this._deactivate_price(stripe_product.default_price);
        }

        // Delete the product.
        try {
            await this.stripe.products.update(stripe_product.id, {
                active: false,
            });
        } catch (error) {
            throw new StripeError(error.message); // since the default stripe errors do not have a stacktrace.
        }
    }

    // Get a subscription by stripe subscription id.
    async _get_subscription(sub_id) {
        try {
            return await this.stripe.products.retrieve(sub_id);
        } catch (error) {
            throw new StripeError(error.message); // since the default stripe errors do not have a stacktrace.
        }
    }

    // Cancel all subscriptions for a price id.
    async _cancel_subscription(sub_id) {
        try {
            await this.stripe.subscriptions.cancel(sub_id);
        } catch (error) {
            console.error(new StripeError(error.message))
            throw new StripeError(error.message); // since the default stripe errors do not have a stacktrace.
        }
    }

    // Cancel all subscriptions for a price id.
    async _cancel_all_subscriptions(price_id) {
        const price = await this._get_price(price_id);
        // console.error("Cancel subscriptions:", price_id, price);
        if (price.type === "recurring") {
            let data;
            try {
                const result = await this.stripe.subscriptions.list({
                    price: price_id,
                })
                data = this._parse_as_list(result.data);
            } catch (error) {
                throw new StripeError(error.message); // since the default stripe errors do not have a stacktrace.
            }
            await data.iterate_async_await(async (subscription) => {
                const items = subscription.items;
                if (subscription.status === "active" || subscription.status === "trialing") {
                    await this.stripe.subscriptions.cancel(subscription.id);
                }
            })
        }
    }

    // Initialize the payment products.
    async _initialize_products() {

        // Fetch all current stripe products.
        const stripe_products = await this._get_products();

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
            if (product.is_subscription && product.interval == null) {
                throw Error(`Product "${product.id}" does not have an assigned "interval" attribute (string).`);   
            }
            if (product.is_subscription && product.interval_count == null) {
                product.interval_count = 1;
            }
            if (product.interval_count != null && typeof product.interval_count !== "number") {
                throw Error(`Product "${product.id}" has an incorrect value type for attribute "interval_count", the valid type is "number".`);
            }
            if (product.interval != null && product.interval !== "day" && product.interval !== "week" && product.interval !== "month" && product.interval !== "year") {
                throw Error(`Product "${product.id}" has an incorrect "interval" attribute, the interval string should be "day", "week", "month" or "year" not "${product.interval}".`);
            }
            if (product.statement_descriptor != null && typeof product.statement_descriptor !== "string") {
                throw Error(`Product "${product.id}" has an incorrect value type for attribute "statement_descriptor", the valid type is "string" (max 22 characters).`);
            }
            if (product.statement_descriptor != null && product.statement_descriptor.length > 22) {
                throw Error(`Product "${product.id}" has a too long string value for attribute "statement_descriptor" (max 22 characters).`);
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
                    if (plan.name == null ) { plan.name = product.name; }
                    if (plan.description == null ) { plan.description = product.description; }
                    if (plan.currency == null ) { plan.currency = product.currency; }
                    if (plan.interval == null ) { plan.interval = product.interval; }
                    if (plan.interval_count == null ) { plan.interval_count = product.interval_count; }
                    if (plan.statement_descriptor == null ) { plan.statement_descriptor = product.statement_descriptor; }
                    if (plan.icon == null ) { plan.icon = product.icon; }
                    if (plan.tax_behavior == null ) { plan.tax_behavior = product.tax_behavior; }
                    if (plan.tax_code == null ) { plan.tax_code = product.tax_code; }
                    check_product(plan);
                })
            } else {
                product.is_subscription = false;
                check_product(product);
            }
        })

        // When the products are the same only retrieve the price id's of the products.
        // Since deactivating the old prices may take some time which is not good for the filewatcher.
        const last_checked_products = this.server.database.join(".sys/.last_checked_products", false);
        let null_default_price = false;
        if (last_checked_products.exists() && last_checked_products.load_sync() === JSON.stringify(this.products)) {
            await this.products.iterate_async_await(async (product) => {
                const set_price_id = (product) => {
                    const found = stripe_products.iterate((item) => {
                        if (item.id == product.id && item.active) {
                            product.price_id = item.default_price;
                            if (null_default_price === false && product.price_id == null) {
                                null_default_price = true;
                            }
                            return true;
                        }
                    })
                    if (found !== true) {
                        null_default_price = true;
                    }
                }
                if (product.is_subscription) {
                    product.plans.iterate(set_price_id);
                } else {
                    set_price_id(product);
                }
            });
            if (null_default_price === false) {
                return null;
            }
        }

        // Copy last checked products without the price id's.
        const copy = (value) => {
            if (Array.isArray(value)) {
                let copied = [];
                value.iterate((v) => {
                    copied.push(copy(v));
                })
                return copied;
            } else if (value != null && typeof value === "object") {
                let copied = {};
                Object.keys(value).iterate((k) => {
                    if (k !== "price_id") {
                        copied[k] = copy(value[k]);
                    }
                })
                return copied;
            } else {
                return value;
            }
        }
        const last_checked = copy(this.products);

        // Delete all stripe products that are not part of the payment products.
        await stripe_products.iterate_async_await((stripe_product) => {
            const found = this.products.iterate((product) => {
                if (product.is_subscription) {
                    return product.plans.iterate((plan) => {
                        if (plan.id === stripe_product.id) {
                            return true;  
                        }
                    })
                } else if (product.id === stripe_product.id) {
                    return true;
                }
            })
            if (found !== true) {
                return this._deactivate_product(stripe_product);
            }
        })

        // Iterate the payment products.
        await this.products.iterate_async_await(async (product) => {
            const check_product = async (product) => {

                // Check if the stripe product exists.
                let stripe_product;
                stripe_products.iterate((x) => {
                    if (x.id === product.id) {
                        stripe_product = x;
                        return false;
                    }
                })

                // Update the stripe product when required.
                await this._update_product(product, stripe_product);
            }

            // Check plans or one-time product.
            if (product.is_subscription) {
                await product.plans.iterate_async_await(check_product);
            } else {
                await check_product(product);
            }
        })

        // Save last checked products.
        last_checked_products.save_sync(JSON.stringify(last_checked));
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

    // Create the webhook endpoint.
    _create_webhook() {
        // Stripe Webhook.
        // Can be tested with cli command `stripe listen --events refund.updated,invoice.payment_action_required,invoice.payment_failed,invoice.payment_succeeded,customer.subscription.created,customer.subscription.deleted --skip-verify --forward-to localhost:8000/vweb/payments/webhook`
        return  {
            method: "POST",
            endpoint: "/vweb/payments/webhook",
            content_type: "application/json",
            rate_limit: 10000,
            rate_limit_duration: 60,
            callback: async (request, response) => {

                // Get the event.
                let event;
                try {
                    event = await this.stripe.webhooks.constructEvent(
                        request.body,
                        request.headers['stripe-signature'],
                        this.webhook_key,
                    );
                } catch (err) {
                    console.error(`Error: Webhook signature verification failed: ${err.message}`);
                    return response.error({status: Status.unauthorized, data: {error: "Webhook signature verification failed."}});
                }

                // Extract the object from the event.
                const obj = event.data.object;

                // Get the uid of the customer.
                let uid, cid;
                if (obj.customer) {
                    uid = this._sys_load_uid_by_cid(obj.customer);
                    cid = obj.customer;
                }

                console.log(event);

                // Save the users payment method.
                // Already handled in `create_subscription()`.
                // if (obj['billing_reason'] === 'subscription_create') {
                //     const payment_intent = await this.stripe.paymentIntents.retrieve(obj['payment_intent']);
                //     await this.stripe.subscriptions.update(obj['subscription'], {default_payment_method: payment_intent.payment_method});
                //     await this.stripe.customers.update(payment_intent.customer, {invoice_settings: {default_payment_method: payment_intent.payment_method}});
                // };

                // Switch the status.
                // All event types are documented at https://stripe.com/docs/api/events/types.
                switch (event.type) {

                    // Type: refund.updated
                    // Occurs whenever a refund from a customer’s cash balance is updated.
                    // data.object is a refund
                    case "refund.updated": {

                        // Set the status description.
                        this._parse_refund(obj)

                        // Update the invoice's line item to set the refund status for `get_products()`.
                        const metadata = {};
                        metadata[obj.metadata.invoice_item] = `${obj.id} ${obj.status} ${obj.status_description}`;
                        await this.stripe.invoices.update(obj.metadata.invoice, {
                            metadata: metadata,
                        });

                        // Successful refund.
                        if (obj.status === "succeeded") {

                            // Check if a mail should be sent.
                            // When the user returns an object with {send_mail: false} then no mail will be sent.
                            let send_mail = true;

                            // Callback.
                            if (this.on_refund != null) {
                                const result = this.on_refund({
                                    uid: uid,
                                    cid: cid,
                                    invoice: obj.metadata.invoice,
                                    invoice_item: obj.metadata.invoice_item,
                                    refund: obj,
                                });
                                if (result instanceof Promise) {
                                    result = await result;
                                }
                                if (send_mail && result != null && typeof result === "object" && result.send_mail === false) {
                                    send_mail = false;
                                }
                            }

                            // Send an email to the user of a successfull refund.
                            // @todo.

                        }

                        // Failed refund.
                        else if (obj.status === "failed" || obj.status === "requires_action") {

                            // Check if a mail should be sent.
                            // When the user returns an object with {send_mail: false} then no mail will be sent.
                            let send_mail = true;
                            
                            // Set failure reason and description.
                            if (obj.status === "requires_action") {
                                obj.failure_reason = "requires_action";
                                obj.failure_description = "The refund requires user action.";
                            }

                            // Callback.
                            if (this.on_refund_failed != null) {
                                const result = this.on_refund_failed({
                                    uid: uid,
                                    cid: cid,
                                    reason: obj.failure_reason,
                                    description: obj.failure_description,
                                    requires_action: obj.status === "requires_action",
                                    invoice: obj.metadata.invoice,
                                    invoice_item: obj.metadata.invoice_item,
                                    refund: obj,
                                });
                                if (result instanceof Promise) {
                                    result = await result;
                                }
                                if (send_mail && result != null && typeof result === "object" && result.send_mail === false) {
                                    send_mail = false;
                                }
                            }

                            // Send an email to the user of a failed refund telling them to contact the website.
                            // @todo.

                        }

                        // Break.
                        break; 
                    }                           
                    

                    // Type: invoice.payment_action_required
                    // Occurs whenever an invoice payment attempt requires further user action to complete.
                    // data.object is an invoice
                    case "invoice.payment_action_required": {
                        if (this.on_payment_requires_action != null) {
                            this.on_payment_requires_action({
                                uid: uid,
                                cid: cid,
                                invoice: obj,
                            })
                        }
                        break;
                    }

                    // Type: invoice.payment_failed
                    // Occurs whenever an invoice payment attempt fails, due either to a declined payment or to the lack of a stored payment method.
                    // data.object is an invoice
                    case "invoice.payment_failed": {
                        if (this.on_payment_failed != null) {
                            this.on_payment_failed({
                                uid: uid,
                                cid: cid,
                                invoice: obj,
                            })
                        }
                        break;
                    }

                    // Type: invoice.payment_succeeded
                    // Occurs whenever an invoice payment attempt succeeds.
                    // data.object is an invoice
                    case "invoice.payment_succeeded": {

                        // Only the non subscription line items of the invoice need to be handled.
                        // Subscription events are catched by "customer.subscription.created".
                        
                        // Check if a mail should be sent.
                        // When the user returns an object with {send_mail: false} then no mail will be sent.
                        let send_mail = true;

                        // Iterate the line items.
                        const data = this._parse_as_list(obj.lines.data);
                        for (let i = 0; i < data.length; i++) {
                            const item = data[i];

                            // Skip recurring.
                            if (item.price.type === "recurring") {
                                continue;
                            }

                            // Callback.
                            if (this.on_payment != null) {
                                const result = this.on_payment({
                                    uid: uid,
                                    cid: cid,
                                    product: await this.get_product(item.price.product),
                                    quantity: item.quantity,
                                    address: obj.customer_address,
                                    invoice_item: item,
                                    invoice: obj,
                                });
                                if (result instanceof Promise) {
                                    result = await result;
                                }
                                if (send_mail && result != null && typeof result === "object" && result.send_mail === false) {
                                    send_mail = false;
                                }
                            }
                        }

                        // Send an email of the invoice pdf.
                        // @todo.

                        // Break.
                        break;
                    }

                    // Type: customer.subscription.created
                    // Occurs whenever a customer is signed up for a new plan.
                    // data.object is a subscription
                    case "customer.subscription.created": {

                        // Check if a mail should be sent.
                        // When the user returns an object with {send_mail: false} then no mail will be sent.
                        let send_mail = true;

                        // Get the line items of the subscription.
                        const data = this._parse_as_list(obj.items.data);
                        for (let i = 0; i < data.length; i++) {
                            const item = data[i];

                            // Skip non recurring.
                            if (item.price.type !== "recurring") {
                                continue;
                            }

                            // Get the product.
                            const product = await this.get_product(item.price.product, true);

                            // Active the user's subscription in the database.
                            this._sys_add_subscription(uid, product.id, item.subscription); // the item's sub id is the same as the main object's sub id.

                            // Cancel the other subscriptions plans that are part of this product.
                            // The `create_payment()` function makes sure there are not multiple subscription plans of the same subscription product charged in a single request.
                            const parent_product = await this.get_product(product.parent_id, true);
                            for (let p = 0; p < parent_product.plans.length; p++) {
                                const plan = parent_product.plans[p];
                                if (plan.id != product.id) {
                                    const {exists, sub_id} = this._sys_check_subscription(uid, plan.id);
                                    if (exists) {
                                        await this._cancel_subscription(sub_id);
                                        this._sys_remove_subscription(uid, plan.id);
                                    }
                                }
                            }

                            // Callback.
                            if (this.on_susbcription != null) {
                                const result = this.on_susbcription({
                                    uid: uid,
                                    cid: cid,
                                    product: product,
                                    quantity: item.quantity,
                                    subscription_item: item,
                                    subscription: obj,
                                });
                                if (result instanceof Promise) {
                                    result = await result;
                                }
                                if (send_mail && result != null && typeof result === "object" && result.send_mail === false) {
                                    send_mail = false;
                                }
                            }
                            
                        }

                        // Send mail of subscription confirmation.
                        // @todo

                        // Break.
                        break;
                    }

                    // Type: customer.subscription.deleted
                    // Occurs whenever a customer’s subscription ends.
                    // data.object is a subscription.
                    case "customer.subscription.deleted": {

                        // Check uid.
                        this.server._check_uid_within_range(uid);

                        // Check if a mail should be sent.
                        // When the user returns an object with {send_mail: false} then no mail will be sent.
                        let send_mail = true;

                        // Get the line items of the subscription.
                        const data = this._parse_as_list(obj.items.data);
                        for (let i = 0; i < data.length; i++) {
                            const item = data[i];

                            // Skip non recurring.
                            if (item.price.type !== "recurring") {
                                continue;
                            }

                            // Get the product.
                            const product = await this.get_product(item.price.product, true);

                            // Deactivate the user's subscription in the database.
                            this._sys_remove_subscription(uid, product.id);

                            // Callback.
                            if (this.on_susbcription_cancelled != null) {
                                const result = this.on_susbcription_cancelled({
                                    uid: uid,
                                    cid: cid,
                                    product: product,
                                    subscription_item: item,
                                    subscription: obj,
                                });
                                if (result instanceof Promise) {
                                    result = await result;
                                }
                                if (send_mail && result != null && typeof result === "object" && result.send_mail === false) {
                                    send_mail = false;
                                }
                            }
                            
                        }

                        // Send an email of cancelled subscription.
                        // @todo.

                        // Break.
                        break;
                    }

                    // Default.
                    default: break;

                }

                // Send response to avoid unfinished response.
                return response.success();
            }
        };
    }

    // Initialize.
    async _initialize() {

        // Create dirs.
        [
            ".sys/stripe_uids",
            ".sys/stripe_cids",
            ".sys/stripe_subs",
            ".sys/stripe_refunds",
        ].iterate((subpath) => {
            this.server.database.join(subpath).mkdir_sync();
        })

        // Initialize products.
        await this._initialize_products()

        // Create the webohok.
        await this._register_webhook();

        // Add the webhook endpoint.
        this.server.endpoint(this._create_webhook());

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

    // Get the stripe customer id of a uid, or a create a stripe customer when the uid does not yet have a stripe customer id.
    async get_cid(uid) {
        if (this._sys_has_cid(uid)) {
            return this._sys_load_cid(uid);
        }
        const user = await this.server.get_user(uid);
        const customer = await this.create_customer(user.email, user.first_name, user.last_name);
        this._sys_save_cid(uid, customer.id);
        return customer.id;
    }

    // Create a stripe customer without any user attached.
    async create_customer(email, first_name, last_name) {
        try {
            return await this.stripe.customers.create({
                email: email,
                name: `${first_name} ${last_name}`,
            });
        } catch (error) {
            throw new StripeError(error.message); // since the default stripe errors do not have a stacktrace.
        }
    }

    // Delete a stripe customer.
    async delete_customer(uid) {
        if (this._sys_has_cid(uid)) {
            let result;
            const cid = this._sys_load_cid(uid);
            try {
                result = await this.stripe.customers.del(cid);
            } catch (error) {
                throw new StripeError(error.message); // since the default stripe errors do not have a stacktrace.
            }
            if (result.deleted !== true) {
                throw Error(`Failed to delete the stripe customer object for user "${uid}".`);
            }
            this._sys_delete_cid(uid, cid);
        }
    }

    // Update the name and email address of a stripe customer.
    async update_customer(uid, user) {
        if (this._sys_has_cid(uid)) {
            const cid = this._sys_load_cid(uid);
            try {
                await this.stripe.customers.update(
                    cid, 
                    {
                        email: user.email,
                        name: `${user.first_name} ${user.last_name}`,
                    }
                );
            } catch (error) {
                throw new StripeError(error.message); // since the default stripe errors do not have a stacktrace.
            }
        }
    }

    // Create a payment
    // @todo when the user has a saved payment method and purchases eg an subscription then the invoice will automatically be charged without requiring the confirmPaymentIntent in the frontend, which is a problem.
    /*  @docs
     *  @title: Create Payment.
     *  @description:
     *      Create a payment for multiple products.
     *  @parameter:
     *      @name: uid
     *      @description: The user id.
     *      @type: number
     *  @parameter:
     *      @name: cart
     *      @type: array[object]
     *      @description: 
     *          The shopping cart to charge, each cart item looks like `{id: <plan or product id>, quantity: <number>}`.
     *
     *          When attribute `quantity` is undefined value `1` will be used as quantity.
     *          Optionally the `product` attribute can be assigned with the user defined product object.
     *  @parameter:
     *      @name: address
     *      @type: object
     *      @description: 
     *          The billing address of the customer, only required when `automatic_tax` is enabled.
     *
     *          An address objects has the following attributes:
     *          ```js
     *          {
     *              line1: "",
     *              line2: null,
     *              city: "",
     *              state: "",
     *              country: 'US',
     *              postal_code: ""
     *          }```
     *  @type: object.
     *  @return: Returns an object with the client secret that should be passed to the frontend.
     *  @usage:
     *      ...
     *      await server.create_payment({uid: 0, cart: [{id: "prod_basic", quantity: 1}]});
     */
    async create_payment({uid, cart = [], address = null, cid = null, email = null, first_name = null, last_name = null}) {

        // Create a customer when the uid is not defined.
        if (uid == null) {
            if (typeof email !== "string") {
                throw Error(`Parameter "email" has an invalid value type "${typeof email}", the valid value type is "string".`);
            }
            if (typeof first_name !== "string") {
                throw Error(`Parameter "first_name" has an invalid value type "${typeof first_name}", the valid value type is "first_name".`);
            }
            if (typeof last_name !== "string") {
                throw Error(`Parameter "last_name" has an invalid value type "${typeof last_name}", the valid value type is "last_name".`);
            }
            cid = await this.create_customer(email, `${first_name} ${last_name}`).id;
        }

        // Check uid.
        else {
            this.server._check_uid_within_range(uid);
        }

        // Vars.
        let line_items = [];

        // Check args.
        if (Array.isArray(cart) === false) {
            throw Error(`Parameter "cart" has an invalid value type "${typeof cart}", the valid value type is "array".`);
        } else if (cart.length === 0) {
            throw Error(`No product cart was specified.`);
        }
        if (this.automatic_tax && typeof address !== "object") {
            throw Error(`Parameter "address" has an invalid value type "${typeof address}", the valid value type is "object".`);
        }

        // Check products.
        const plan_count_per_product = {};
        await cart.iterate_async_await(async (i) => {

            // Get product.
            let product = i.product;
            if (product == null) {
                product = await this.get_product(i.id, true);
            }

            // Check subscriptions.
            if (product.is_subscription) {

                // Check quantity.
                if (product.is_subscription && i.quantity > 0) {
                    throw Error(`A subscription product ("${i.id}") can not have a quantity of more than 1.`);   
                }

                // Check if the id of the product was not passed instead of the id of the product's plan.
                if (product.price_id == null) {
                    throw Error(`You can only charge one of the subscription's plans, not the subscription product itself "${product.id}".`);
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
            }

            // Add to line items.
            line_items.push({
                price: product.price_id,
                quantity: i.quantity == null ? 1 : i.quantity,
            })
        })

        // Retrieve the cid from the user.
        if (cid == null) {

            // Check uid.
            if (uid == null) {
                throw Error("One of the following parameters must be defined \"uid\" or \"cid\".");
            }

            // Load the user's email.
            email = (await this.server.get_user(uid)).email

            // Get the customer id.
            cid = await this.get_cid(uid);

        }

        // Retrieve the email when both the cid and uid are defined.
        else if (uid != null && email == null) {
            email = (await this.server.get_user(uid)).email
        }

        // Check the email.
        if (email == null) {
            throw Error("Define parameter \"email\".");
        }

        // Stripe requests.
        let customer, quote, invoice, payment_intent;
        try {

            // The address of the customer must be included to calculate automatic tax https://stripe.com/docs/billing/taxes/collect-taxes.
            if (this.automatic_tax) {
                customer = await this.stripe.customers.update(
                    cid,
                    {address: address}
                );    
            }

            // Create the quote
            quote = await this.stripe.quotes.create({
                customer: cid,
                description: "Invoice summary for your recent order.",
                line_items: line_items,
                collection_method: "charge_automatically",
                automatic_tax: {enabled: this.automatic_tax},
            });

            // Finalize the quote.
            quote = await this.stripe.quotes.finalizeQuote(quote.id);

            // Accept the quote.
            quote = await this.stripe.quotes.accept(quote.id, {
                expand: ["invoice"]
            });

            // Accept the invoice.
            invoice = await this.stripe.invoices.finalizeInvoice(
                quote.invoice.id,
                {
                    auto_advance: false,
                    expand: ["payment_intent"],
                }
            );

            // Update the payment intent.
            payment_intent = await this.stripe.paymentIntents.update(
                invoice.payment_intent.id,
                {
                    setup_future_usage: "off_session", // required to save this payment method for renewals on subscriptions.
                    metadata: {
                        invoice: invoice.id,
                    },
                }
            );
        } catch (error) {
            throw new StripeError(error.message); // since the default stripe errors do not have a stacktrace.
        }

        // Response for frontend.
        return {
            id: quote.id,
            client_secret: payment_intent.client_secret,
        };
    }

    // Retrieve the created payment quotes of a user.
    /*  @docs:
     *  @title: Get Payments
     *  @description:
     *      Retrieve the created payment quotes of a user.
     *  @parameter:
     *      @name: uid
     *      @description: The uid of the user.
     *      @type: number
     *  @parameter:
     *      @name: status
     *      @description: Filter the list by status, possible values are `[null, "draft", "open", "void", "paid", "uncollectible"]`.
     *      @type: null, string
     *  @parameter:
     *      @name: days
     *      @description: Since the amount of last days back, so `days: 30` will retrieve the payments of the last 30 days.
     *      @type: null, number
     *  @parameter:
     *      @name: ending_before
     *      @description: A cursor for use in pagination. `ending_before` is an object ID that defines your place in the list. For instance, if you make a list request and receive 100 objects, starting with `obj_bar`, your subsequent call can include `ending_before=obj_bar` in order to fetch the previous page of the list.
     *      @type: null, string
     *  @parameter:
     *      @name: starting_after
     *      @description: A cursor for use in pagination. `starting_after` is an object ID that defines your place in the list. For instance, if you make a list request and receive 100 objects, ending with `obj_foo`, your subsequent call can include `starting_after=obj_foo` in order to fetch the next page of the list.
     *      @type: null, string
     *  @parameter:
     *      @name: refunded
     *      @description: Filter the payments by a refund request, `refunded: null` will both non refunded and refunded payments, `refunded: true` will retrieve all refunded payments and `refunded: false` will retrieve all non refunded payments.
     *      @type: null, boolean
     *  @parameter:
     *      @name: limit
     *      @description: A limit on the number of objects to be returned. Leave the limit `null` to disable the limit.
     *      @type: null, number
     *  @type: Promise
     *  @return:
     *      Returns a promise to a list of payments or a rejection with an error.
     *
     *      A payment product has the following attributes:
     *      ```js
     *      {
     *          timestamp: <number>,            // the unix timestamp in seconds of the purchase.
     *          product: <object>,              // the user defined product that was purchased.
     *          quantity: <number>,             // the quantity of the purchased product.
     *          amount: <number>,               // the total charged amount by this purchase.
     *          refund: {                       // the refund object when a refund request has been made. This value will be `null` when no refund request has been made for this payment.
     *              id: <string>,               // the id of the refund request.
     *              status: <string>,           // the status of the refund request, the status can be "processing", "succeeded", "failed", "requires_action", "canceled".
     *              description: <string>,      // the status description of the refund request.
     *          },
     *          pdf: <string>,                  // the url string to the pdf download link.
     *          invoice: <string>,              // the invoice's id of the purchase.
     *          invoice_item: <string>,         // the invoice item's id of the purchase.
     *          payment_intent: <string>,       // the payment intent's id of the purchase.
     *      }
     *      ```
     *  @usage:
     *      ...
     *      const payments = await server.get_payments("...");
     */
    async get_payments({
        uid,  
        status = null,
        days = null,
        ending_before = null,
        starting_after = null,
        refunded = null,
        limit = null,
    }) {

        // Check uid.
        this.server._check_uid_within_range(uid);

        // Get stripe cid.
        const cid = this.get_cid(uid);

        // Create subscription.
        let payments = [];
        let first = true;
        let result;
        while (true) {
            try {

                // First request.
                if (first) {

                    // By since days.
                    if (days != null) {
                        let created = new Date();
                        created.setHours(0, 0, 0, 0)
                        created.setDate(created.getDate() - days);
                        created = Math.floor(created.getTime() / 1000);
                        result = await this.stripe.invoices.list({
                            customer: cid,
                            limit: 100,
                            status: status,
                            created: {
                                gte: created,
                            },
                        });
                    }

                    // By starting after, ending before or no filters.
                    else {
                        result = await this.stripe.invoices.list({
                            customer: cid,
                            limit: 100,
                            status: status,
                            ending_before: ending_before,
                            starting_after: starting_after,
                        });
                    }
                    first = false;
                }

                // Later requests.
                else {
                    result = await this.stripe.invoices.list({
                        customer: cid,
                        limit: 100,
                        status: status,
                        starting_after: payments.length > 0 ? payments.last().invoice : undefined,
                        created: {
                            gte: created,
                        },
                    });
                }
            }

            // Handle error.
            catch (error) {
                throw new StripeError(error.message); // since the default stripe errors do not have a stacktrace.
            }

            // Parse invoices.
            await this._parse_as_list(result.data).iterate_async_await(async (item) => {
                const items = this._parse_as_list(item.lines.data);
                await items.iterate_async_await(async (line_item) => {
                    let refund = null;
                    if (item.metadata[line_item.id]) {
                        const split = item.metadata[line_item.id].split(" ");
                        refund = {
                            id: split[0],
                            status: split[1],
                            description: split.slice(2).join(" "),
                        };
                    }
                    if (
                        refunded == null ||
                        (refunded === false && refund == null) ||
                        (refunded === true && refund != null)
                    ) {
                        payments.push({
                            timestamp: item.created,
                            product: await this.get_product(line_item.price.product),
                            quantity: line_item.quantity,
                            amount: parseFloat(line_item.amount) / 100,
                            refund: refund,
                            pdf: item.invoice_pdf,
                            invoice: item.id,
                            invoice_item: line_item.id,
                            payment_intent: item.payment_intent,
                            uid: uid, // required for `_sys_add_open_refund()`.
                        });
                    }
                })
            })

            // Stop.
            if (result.has_more !== true || ending_before != null) {
                break;
            }
        }

        // Sort from newest till oldest.
        payments.sort((a, b) => b.timestamp - a.timestamp)
        if (limit != null && limit !== -1 && payments.length > limit) {
            payments.length = limit;
        }

        // Handler.
        return payments;
    }

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

    // Get the subscriptions of a user.
    /*  @docs:
     *  @title: Get Subscription Object
     *  @description:
     *      Get the stripe subscription object by a subscription id.
     *  @parameter:
     *      @name: id
     *      @description: The subscription id.
     *      @type: string
     *  @type: object
     *  @return: The stripe subscription object will be returned. more info about the object can be found at https://stripe.com/docs/api/subscriptions/object.
     *  @usage:
     *      ...
     *      const subscription = await server.get_subscription_obj("sub_xxxxxxxx");
     */
    async get_subscription_obj(id) {
        try {
            return await this.stripe.subscriptions.retrieve(id);
        } catch (error) {
            throw new StripeError(error.message); // since the default stripe errors do not have a stacktrace.
        }
    }

    // Cancel a subscription
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
        await this._cancel_subscription(sub_id);

        // Remove from subscriptions.
        this._sys_remove_subscription(uid, id);
    }

    // Create a refund for a payment intent.
    /*  @docs:
     *  @title: Get Refunable Payments
     *  @description:
     *      Get a list of the user's payments that are refundable.
     *  @type: Promise
     *  @return:
     *      Returns a promise to a list of refundable payments or a rejection with an error.
     *
     *      A payment product has the following attributes:
     *      ```js
     *      {
     *          timestamp: <number>,            // the unix timestamp in seconds of the purchase.
     *          product: <object>,              // the user defined product that was purchased.
     *          quantity: <number>,             // the quantity of the purchased product.
     *          amount: <number>,               // the total charged amount by this purchase.
     *          refund: {                       // the refund object when a refund request has been made. This value will be `null` when no refund request has been made for this payment.
     *              id: <string>,               // the id of the refund request.
     *              status: <string>,           // the status of the refund request, the status can be "processing", "succeeded", "failed", "requires_action", "canceled".
     *              description: <string>,      // the status description of the refund request.
     *          },
     *          pdf: <string>,                  // the url string to the pdf download link.
     *          invoice: <string>,              // the invoice's id of the purchase.
     *          invoice_item: <string>,         // the invoice item's id of the purchase.
     *          payment_intent: <string>,       // the payment intent's id of the purchase.
     *      }
     *      ```
     *  @parameter:
     *      @name: uid
     *      @description: The id of the user.
     *      @type: number
     *  @parameter:
     *      @name: days
     *      @description: The number of days for which the payment is still refundable.
     *      @type: null, number
     *  @parameter:
     *      @name: refunded
     *      @description: Filter the payments by a refund request, `refunded: null` will both non refunded and refunded payments, `refunded: true` will retrieve all refunded payments and `refunded: false` will retrieve all non refunded payments.
     *      @type: null, boolean
     *  @parameter:
     *      @name: limit
     *      @description: A limit on the number of objects to be returned. The limit can range between 1 and 100, the default is 100.
     *      @type: number
     *  @usage:
     *      ...
     *      const payments = await server.get_refundable_payments({uid: 1, days: 14});
     */
    async get_refundable_payments({uid, days = 14, refunded = null, limit = null}) {
        return await this.get_payments({uid: uid, days: days, refunded: null, limit: limit, status: "paid"})
    }

    // Create a refund for a payment intent.
    /*  @docs:
     *  @title: Create Refund
     *  @description:
     *      Create a refund for a payment intent.
     *
     *      When the payment intent is part of a subscription, the active subscription will automatically be cancelled.
     *  @type: object
     *  @usage: Returns the stripe refund object.
     *  @parameter:
     *      @name: payment
     *      @description: The retrieved payment object from `Server.get_payments()` or `Server.get_refundable_payments()`.
     *      @type: object
     *  @parameter:
     *      @name: auto_advance
     *      @description:
     *          When auto advance is enabled the refund will be initiated, when auto_advance is disabled the refund is added to the database and must still be confirmed with `Server.create_refund({payment: ..., auto_advance: true})`.
     *          This may be required when a user should return a product before confirming the refund.
     *          The open refund requests can be retrieved with `Server.get_open_refunds()`.
     *      @type: boolean
     *  @usage:
     *      ...
     *      const payment = ...;
     *      await server.create_refund(payment);
     */
    async create_refund({payment = null, auto_advance = true}) {

        // Vars.
        let invoice, invoice_obj, invoice_item, invoice_item_obj, payment_intent, amount, uid;

        // Check args.
        if (typeof payment !== "object") {
            throw Error(`Parameter "payment" has an incorrect type "${typeof payment}", the valid type is "object".`);
        }
        if (typeof payment.amount !== "number") {
            throw Error(`Parameter "payment.amount" has an incorrect type "${typeof payment.amount}", the valid type is "number".`);
        }
        if (typeof payment.invoice !== "string") {
            throw Error(`Parameter "payment.invoice" has an incorrect type "${typeof payment.invoice}", the valid type is "string".`);
        }
        if (typeof payment.invoice_item !== "string") {
            throw Error(`Parameter "payment.invoice_item" has an incorrect type "${typeof payment.invoice_item}", the valid type is "string".`);
        }
        if (typeof payment.payment_intent !== "string") {
            throw Error(`Parameter "payment.payment_intent" has an incorrect type "${typeof payment.payment_intent}", the valid type is "string".`);
        }
        if (typeof payment.uid !== "number") {
            throw Error(`Parameter "payment.uid" has an incorrect type "${typeof payment.uid}", the valid type is "number".`);
        }

        // Already refunded.
        if (payment.refund_status === "succeeded") {
            throw Error(`This payment was already successfully refunded.`);   
        } else if (payment.refund_status != null && payment.refund_status !== "processing") {
            throw Error(`A refund request has already been made for this payment.`);
        }

        // Assign.
        invoice = payment.invoice;
        invoice_item = payment.invoice_item;
        payment_intent = payment.payment_intent;
        amount = payment.amount;
        uid = payment.uid;

        // Set the refund metadata on the invoice.
        // Update the line item's metadata to set the refund id.
        // This status will be updated by the webhook.
        // Therefore the `Server.get_products()` can indicate if the payment was already refunded and add the status.
        const update_invoice_metadata = async (refund) => {
            try {
                const metadata = {};
                metadata[invoice_item] = `${refund.id} ${refund.status} ${refund.status_description}`;
                await this.stripe.invoices.update(invoice, {
                    metadata: metadata,
                });
            } catch (error) {
                throw new StripeError(error.message); // since the default stripe errors do not have a stacktrace.
            }
        }

        // Do not advance.
        if (auto_advance !== true) {

            // Create a refund object for the frontend.
            const refund = {
                id: invoice_item,
                status: "processing",
                status_description: "The refund request is being processed.",
            };

            // Uppdate metadata on the invoice.
            await update_invoice_metadata(refund);

            // Add to database.
            this._sys_add_open_refund(uid, invoice_item, payment);

            // On refund requrest callback.
            if (this.server.on_refund_request != null) {
                this.server.on_refund_request({
                    uid: uid,
                    cid: cid,
                    payment: payment,
                    invoice: invoice,
                    invoice_item: invoice_item,
                    refund: refund,
                });
            }
            return refund;
        }

        // By invoice.
        try {
            invoice_obj = await this.stripe.invoices.retrieve(invoice);
        } catch (error) {
            throw new StripeError(error.message); // since the default stripe errors do not have a stacktrace.
        }

        // Get the uid of the invoice.
        if (uid == null) {
            try {
                uid = this._sys_load_uid_by_cid(invoice_obj.customer);
            } catch (err) {
                uid = null;
            }
        } else {
            this.server._check_uid_within_range(uid);
        }

        // Get the invoice item object.
        try {
            invoice_item_obj = await this.stripe.invoiceItems.retrieve(invoice_item);
        } catch (error) {
            throw new StripeError(error.message); // since the default stripe errors do not have a stacktrace.
        }

        // Cancel the subscription.
        if (uid != null && invoice_item_obj.price.type === "recurring") {
            const {exists, sub_id} = this._sys_check_subscription(uid, invoice_item_obj.price.product);
            if (exists) {
                await this._cancel_subscription(sub_id);
                this._sys_remove_subscription(uid, invoice_item_obj.price.product);
                if (typeof invoice_item_obj.subscription === "string" && sub_id !== invoice_item_obj.subscription) {
                    await this._cancel_subscription(invoice_item_obj.subscription);    
                }
            } else if (typeof invoice_item_obj.subscription === "string") {
                try {
                    await this._cancel_subscription(invoice_item_obj.subscription);
                } catch (err) {}
            }
        }

        // Create refund.
        let refund;
        try {
            refund = await this.stripe.refunds.create({
                id: refund_id,
                payment_intent: payment_intent,
                amount: amount == null ? undefined : parseInt(amount * 100),
                metadata: {
                    invoice: invoice,
                    invoice_item: invoice_item,
                    payment_intent: payment_intent,
                },
            });
        } catch (error) {
            throw new StripeError(error.message); // since the default stripe errors do not have a stacktrace.
        }

        // Parse the failed status.
        this._parse_refund(refund);

        // Update the line item's metadata to set the refund id.
        // This status will be updated by the webhook.
        // Therefore the `Server.get_products()` can indicate if the payment was already refunded and add the status.
        await update_invoice_metadata(refund);

        // Remove the open refund from the database.
        this._sys_remove_open_refund(uid, invoice_item);

        // Return the refund info.
        return refund;
    }

    // Get all open and unconfirmed refund requests.
    /*  @docs:
     *  @title: Get Open Refunds
     *  @description:
     *      Get all requested but unconfirmed refund payments.
     *
     *      An requested but unconfirmed refund payment must still be confirmed with `Server.create_refund({payment: ..., auto_advance: true})`.
     *  @type: array[object]
     *  @usage: Returns a list of requested refund payments.
     *  @parameter:
     *      @name: uid
     *      @description: Filter the open refund requests by uid (optional).
     *      @type: number
     *  @usage:
     *      ...
     *      const refund_payments = await server.get_open_refunds();
     */
    async get_open_refunds(uid = null) {
        if (uid != null && typeof uid !== "number") {
            throw Error(`Parameter "uid" has an incorrect type "${typeof uid}", the valid type is "number".`);
        }
        return this._sys_get_open_refunds(uid);
    }

    // Get an open and unconfirmed refund request.
    /*  @docs:
     *  @title: Get Open Refunds
     *  @description:
     *      Get a requested but unconfirmed refund payment by id.
     *
     *      An requested but unconfirmed refund payment must still be confirmed with `Server.create_refund({payment: ..., auto_advance: true})`.
     *  @type: object
     *  @usage: Returns the requested refund payment.
     *  @parameter:
     *      @name: uid
     *      @description: The uid of the user that requested the refund.
     *      @type: number
     *  @parameter:
     *      @name: id
     *      @description: The id of payment's unconfirmed refund request.
     *      @type: string
     *  @usage:
     *      ...
     *      const refund_payment = await server.get_open_refund("...");
     */
    async get_open_refund(uid, id) {
        if (typeof uid !== "number") {
            throw Error(`Parameter "uid" has an incorrect type "${typeof uid}", the valid type is "number".`);
        }
        if (typeof id !== "string") {
            throw Error(`Parameter "id" has an incorrect type "${typeof id}", the valid type is "string".`);
        }
        return this._sys_get_open_refund(uid, id);
    }

}

// Exports.
module.exports = Stripe;
