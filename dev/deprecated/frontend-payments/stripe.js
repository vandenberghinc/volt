/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Payments module.
vweb.payments = {};

// Initialize stipe.
vweb.payments._initialize_stripe = function() {
	if (this.stripe === undefined) {
		if (this.publishable_key == null) {
			throw Error("Define the \"vweb.payments.publishable_key\" attribute with your stripe publishable key.");
		}
		this.stripe = Stripe(this.publishable_key);
	}
}

// The elements object used for creating the "address" element must be created before posting the charge in order to calculate tax collection.
vweb.payments._initialize_address_elements = function(appearance = {}) {
	if (this._address_elements == null) {
		if (this.cart.items.length === 0) {
			throw Error("The shopping cart does not contain any items.");
		}
		let price = 0, currency;
		this.cart.items.iterate((item) => {
			price += parseInt(item.product.price * 100) * item.quantity;
			if (currency === undefined) {
				currency = item.product.currency;
			} else if (currency != item.product.currency) {
				throw Error("Products with different currencies can not be charged in a single request.");
			}
		})
		this._address_elements = this.stripe.elements({
			mode: "payment",
			amount: price,
			currency: currency,
			appearance: appearance,
		});
	}
}

// The elements forthe "payment" element must be attached to the client secret since some products like subscriptions require other payment methods.
vweb.payments._initialize_payment_elements = function(appearance = {}) {
	if (this._payment_elements == null) {
		if (this._client_secret == null) {
			throw Error("No payment intent was created using \"vweb.payments.charge()\" or the shopping cart has been edited after the initial charge.");
		}
		this._payment_elements = this.stripe.elements({
			clientSecret: this._client_secret,
			appearance: appearance,
		});
	}
}

// Reset the charge objects after a shopping cart edit.
vweb.payments._reset = function() {

	// Reset client secret.
	this._client_secret = null;

	// Reset address elements.
	this._address = null;
	this._address_elements = null;
	if (this._address_element != null) {
		this._address_element.stripe_element.destroy();
	}
	this._address_element = null;

	// Reset payment elements.
	this._payment_elements = null;
	if (this._payment_element != null) {
		this._payment_element.stripe_element.destroy();
	}
	this._payment_element = null;
}

// Get the currency symbol for a product currency.
// Returns `null` when the currency is not supported.
/* 	@docs:
 * 	@chapter: Client
 * 	@title: Get Currency Symbol
 *	@description: Get the currency symbol for a product currency.
 *	@type: string, null
 *	@return: Returns the currency symbol when the currency is supported, otherwise `null`
 *	@param:
 * 		@name: currency
 *		@description: The currency from the product object.
 */
vweb.payments.get_currency_symbol = function(currency) {
	switch (currency.toLowerCase()) {
		case "aed": return "د.إ";
    	case "afn": return "Af";
    	case "all": return "L";
    	case "amd": return "֏";
    	case "ang": return "ƒ";
    	case "aoa": return "Kz";
    	case "ars": return "$";
    	case "aud": return "$";
    	case "awg": return "ƒ";
    	case "azn": return "₼";
    	case "bam": return "KM";
    	case "bbd": return "Bds$";
    	case "bdt": return "৳";
    	case "bgn": return "лв";
    	case "bhd": return ".د.ب";
    	case "bif": return "FBu";
    	case "bmd": return "BD$";
    	case "bnd": return "B$";
    	case "bob": return "Bs";
    	case "brl": return "R$";
    	case "bsd": return "B$";
    	case "btn": return "Nu.";
    	case "bwp": return "P";
    	case "byn": return "Br";
    	case "bzd": return "BZ$";
    	case "cad": return "$";
    	case "cdf": return "FC";
    	case "chf": return "Fr";
    	case "clf": return "UF";
    	case "clp": return "$";
    	case "cny": return "¥";
    	case "cop": return "$";
    	case "crc": return "₡";
    	case "cuc": return "CUC$";
    	case "cup": return "CUP$";
    	case "cve": return "$";
    	case "czk": return "Kč";
    	case "djf": return "Fdj";
    	case "dkk": return "kr";
    	case "dop": return "RD$";
    	case "dzd": return "دج";
    	case "egp": return "E£";
    	case "ern": return "Nfk";
    	case "etb": return "Br";
    	case "eur": return "€";
    	case "fjd": return "FJ$";
    	case "fkp": return "£";
    	case "fok": return "F$";
    	case "gbp": return "£";
    	case "gel": return "₾";
    	case "ghc": return "₵";
    	case "gip": return "£";
    	case "gmd": return "D";
    	case "gnf": return "FG";
    	case "gtq": return "Q";
    	case "gyd": return "GY$";
    	case "hkd": return "HK$";
    	case "hnl": return "L";
    	case "hrk": return "kn";
    	case "htg": return "G";
    	case "huf": return "Ft";
    	case "idr": return "Rp";
    	case "ils": return "₪";
    	case "inr": return "₹";
    	case "iqd": return "د.ع";
    	case "irr": return "﷼";
    	case "isk": return "kr";
    	case "jmd": return "J$";
    	case "jod": return "JD";
    	case "jpy": return "¥";
    	case "kes": return "Ksh";
    	case "kgs": return "с";
    	case "khr": return "៛";
    	case "kmf": return "CF";
    	case "kpw": return "₩";
    	case "krw": return "₩";
    	case "kwd": return "KD";
    	case "kyd": return "CI$";
    	case "kzt": return "₸";
    	case "lak": return "₭";
    	case "lbp": return "L£";
    	case "lkr": return "Rs";
    	case "lrd": return "L$";
    	case "lsl": return "L";
    	case "lyd": return "ل.د";
    	case "mad": return "د.م.";
    	case "mdl": return "L";
    	case "mnt": return "₮";
    	case "mop": return "MOP$";
    	case "mur": return "Rs";
    	case "mvr": return "Rf";
    	case "mwk": return "MK";
    	case "mxn": return "$";
    	case "myr": return "RM";
    	case "mzn": return "MTn";
    	case "nad": return "N$";
    	case "ngn": return "₦";
    	case "nio": return "C$";
    	case "nok": return "kr";
    	case "npr": return "रू";
    	case "nzd": return "$";
    	case "omr": return "ر.ع.";
    	case "pab": return "B/.";
    	case "pen": return "S/.";
    	case "pgk": return "K";
    	case "php": return "₱";
    	case "pkr": return "Rs";
    	case "pln": return "zł";
    	case "pyg": return "₲";
    	case "qar": return "ر.ق";
    	case "ron": return "lei";
    	case "rsd": return "din.";
    	case "rub": return "₽";
    	case "rwf": return "FRw";
    	case "sar": return "ر.س";
    	case "sbd": return "SI$";
    	case "scr": return "Sr";
    	case "sdg": return "ج.س.";
    	case "sek": return "kr";
    	case "sgd": return "S$";
    	case "shp": return "£";
    	case "sll": return "Le";
    	case "sos": return "S";
    	case "srd": return "SRD$";
    	case "ssp": return "£";
    	case "std": return "Db";
    	case "sek": return "kr";
    	case "syp": return "S£";
    	case "szl": return "L";
    	case "thb": return "฿";
    	case "tjs": return "ЅМ";
    	case "tmt": return "m";
    	case "tnd": return "د.ت";
    	case "top": return "T$";
    	case "try": return "₺";
    	case "ttd": return "TT$";
    	case "twd": return "NT$";
    	case "tzs": return "TSh";
    	case "uah": return "₴";
    	case "ugx": return "USh";
    	case "usd": return "$";
    	case "uyu": return "$U";
    	case "uzs": return "лв";
    	case "ves": return "Bs.S.";
    	case "vnd": return "₫";
    	case "vuv": return "VT";
    	case "wst": return "WS$";
    	case "xaf": return "FCFA";
    	case "xcd": return "EC$";
    	case "xof": return "CFA";
    	case "xpf": return "CFP";
    	case "yer": return "﷼";
    	case "zar": return "R";
    	case "zmw": return "ZK";
	}
	return null;
}

// Fetch the payment products.
/* 	@docs:
 * 	@chapter: Client
 * 	@title: Payment Products
 *	@description: Get the backend defined payment products asynchronously.
 *	@type: array[object]
 *	@return: Returns the backend defined payment products.
 */
vweb.payments.get_products = async function() {
	return new Promise((resolve, reject) => {
		if (this._products !== undefined) {
			return resolve(this._products);
		}
		vweb.utils.request({
			method: "GET",
			url: "/vweb/payments/products",
		})
		.then((products) => {
			this._products = products;
			resolve(this._products);
		})
		.catch((err) => {
			reject(err);
		})
	})
}

// Fetch a payment product by id.
/* 	@docs:
 * 	@chapter: Client
 * 	@title: Get Payment Product
 *	@description: Get the backend defined payment product by id asynchronously.
 *	@type: object
 *	@return: Returns the backend defined payment product.
 */
vweb.payments.get_product = async function(id) {
	return new Promise(async (resolve, reject) => {
		const products = await this.get_products();
		let product;
		products.iterate((p) => {
			if (p.id === id) {
				product = p;
				return true;
			}
			if (p.is_subscription) {
				return p.plans.iterate((plan) => {
					if (plan.id === id) {
						product = plan;
						return true;
					}
				});
			}
		})
		if (product == null) {
			return reject(new Error(`Product "${id}" does not exist.`));
		}
		resolve(product);
	})
}

// Get the user's payments.
/* 	@docs:
 * 	@chapter: Client
 * 	@title: Get Payments
 *	@description: Get the user's made payments.
 *	@type: Promise
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
 *  @parameter:
 *      @name: status
 *      @description: Filter the list by status, possible values are `[null, "draft", "open", "void", "paid", "uncollectible"]`.
 *      @type: null, string
 *  @parameter:
 *      @name: days
 *      @description: Since the amount of last days back, so `days: 30` will retrieve the payments of the last 30 days.
 *      @type: null, number
 *  @parameter:
 *      @name: refunded
 *      @description: Filter the payments by a refund request, `refunded: null` will both non refunded and refunded payments, `refunded: true` will retrieve all refunded payments and `refunded: false` will retrieve all non refunded payments.
 *      @type: null, boolean
 *  @parameter:
 *      @name: limit
 *      @description: A limit on the number of objects to be returned. Leave the limit `null` to disable the limit.
 *      @type: null, number
 */
vweb.payments.get_payments = function({status = "paid", days = 30, refunded = null, limit = null} = {}) {
	return vweb.utils.request({
		method: "GET",
		url: "/vweb/payments/payments",
		data: {
			status: status,
			days: days,
			refunded: refunded,
			limit: limit,
		},
	});
}

// Get the user's subscriptions.
/* 	@docs:
 * 	@chapter: Client
 * 	@title: Get Subscriptions
 *	@description: Get the user's active subscription id's.
 *	@type: Promise
 *	@return: Returns a promise to the list of product id's the user is subscribed.
 */
vweb.payments.get_subscriptions = function() {
	return vweb.utils.request({
		method: "GET",
		url: "/vweb/payments/subscriptions",
	});
}

// Is subscribed
/* 	@docs:
 * 	@chapter: Client
 * 	@title: Is Subscribed
 *	@description: Check if the user is subscribed to a certain product.
 *	@type: Promise
 *	@return: Returns a promise to a an object holding boolean attribute `subscribed` indicating if the user is subscribed to the product or not.
 *  @parameter:
 *      @name: id
 *      @description: The id of product to check.
 *      @type: string
 */
vweb.payments.is_subscribed = function(id) {
	return vweb.utils.request({
		method: "POST",
		url: "/vweb/payments/subscribed",
		data: {
			product: id,
		}
	});
}

// Cancel subscription
/* 	@docs:
 * 	@chapter: Client
 * 	@title: Cancel Subscription
 *	@description: Cancel an active subscription of a product. 
 *  @parameter:
 *      @name: id
 *      @description: The product's plan id of the user defined subscription product.
 *      @type: string
 *      @required: true
 */
vweb.payments.cancel_subscription = function(id) {
	return vweb.utils.request({
		method: "DELETE",
		url: "/vweb/payments/subscription",
		data: {
			product: id,
		}
	});
}

// Get the user's refundable payments.
/* 	@docs:
 * 	@chapter: Client
 * 	@title: Get Refundable Payments
 *	@description: Get the user's refundable payments.
 *	@type: Promise
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
 */
vweb.payments.get_refundable_payments = function({days = 30, refunded = null, limit = null} = {}) {
	return vweb.utils.request({
		method: "GET",
		url: "/vweb/payments/refundable",
		data: {
			days: days,
			refunded: refunded,
			limit: limit,
		},
	});
}

// Create a refund.
/* 	@docs:
 * 	@chapter: Client
 * 	@title: Create Refund
 *	@description: Create a refund payment request for a certain payment from `vweb.payments.get_refundable_payments`.
 *	@type: Promise
 *  @return:
 *      Returns a promise to the stripe refund object.
 *  @parameter:
 *      @name: payment
 *      @description: The retrieved payment object from `vweb.payments.get_payments()` or `vweb.payments.get_refundable_payments()`.
 *      @type: object
 *  @parameter:
 *      @name: auto_advance
 *      @description:
 *          When auto advance is enabled the refund will be initiated, when auto advance is disabled the refund is added to the database and must still be confirmed with `Server.create_refund({payment: ..., auto_advance: true})`.
 *          This may be required when a user should return a product before confirming the refund.
 *      @type: boolean
 */
vweb.payments.create_refund = function({payment, auto_advance = true}) {
	return vweb.utils.request({
		method: "POST",
		url: "/vweb/payments/refund",
		data: {
			payment: payment,
			auto_advance: auto_advance,
		},
	});
}

// Create a address element.
/* 	@docs:
 * 	@chapter: Client
 * 	@title: Create Address Element
 *	@description: Create an address element to collect the payment's address details.
 *	@warning: This element should be created each time the page renders or updated after a shopping cart update. This function automatically returns the cached element when this function has been called twice without any updates to the shopping cart.
 *	@param:
 * 		@name: billing
 *		@description: The address mode either `"billing"` or `"shipping"`.
 */
vweb.payments.create_address_element = function(mode = "billing") {

	// Return the already created object.
	if (this._address_element != null) {
		return this._address_element;
	}

	// Initialize stripe.
	this._initialize_stripe();

	// Initialize the elements.
	this._initialize_address_elements();

	// Create the stack and mount the stripe object.
	this._address_element = VStack();
	this._address_element.stripe_element = this._address_elements.create("address", {
		mode: mode,
	});
	this._address_element.stripe_element.mount(this._address_element);

	// Return the mounted element.
	return this._address_element;
}

// Create a payment element.
/* 	@docs:
 * 	@chapter: Client
 * 	@title: Create Payment Element
 *	@description: Create a payment element to collect the payment details.
 *	@warning: This element should be created each time the page renders or updated after a shopping cart update. This function automatically returns the cached element when this function has been called twice without any updates to the shopping cart.
 */
vweb.payments.create_payment_element = function() {

	// Return the already created object.
	if (this._payment_element != null) {
		return this._payment_element;
	}

	// Initialize stripe.
	this._initialize_stripe();

	// Initialize the elements.
	this._initialize_payment_elements();

	// Create the stack and mount the stripe object.
	this._payment_element = VStack();
	this._payment_element.stripe_element = this._payment_elements.create("payment");
	this._payment_element.stripe_element.mount(this._payment_element);

	// Return the mounted element.
	return this._payment_element;
}

// Create a payment element.
/* 	@docs:
 * 	@chapter: Client
 * 	@title: Has Pending Charge
 *	@description: Check if there is a pending charge payment intent. This can be used to detect if a new charge request should be made in order to initialize the payment elements.
 */
vweb.payments.has_pending_charge = function() {
	return this._client_secret != null;
}

// Charge the shopping cart.
/* 	@docs:
 * 	@chapter: Client
 * 	@title: Charge Shopping Cart
 *	@description: 
 *		Create a payment intent to charge the shopping cart asynchronously. 
 *
 *		A payment can be charged after the following conditions are met:
 *			1) Products must be added to the shopping cart using `vweb.payments.cart.add()`.
 *			2) The address element must have been filled in and created using `vweb.payments.create_address_element()`. This is required for automatic tax.
 *
 *		The charge must still be confirmed using `vweb.payment.confirm_charge()`.
 *
 *		Throws an error when no products are added to the shopping cart.
 */
vweb.payments.charge = async function() {
	return new Promise(async (resolve, reject) => {
		
		// Reset vars.
		this._client_secret = null;
		this._return_url = null;
		this._payment_elements = null;
		this._payment_element = null;
		
		// Check shopping cart.
		if (vweb.payments.cart.items.length === 0) {
			return reject(new Error("No products were added to the shopping cart."));
		}

		// Check the address object.
		if (this._address_elements == null) {
			return reject(new Error("No address element was created using \"vweb.payments.create_address_element()\"."));
		}

		// Submit the address elements.
		const {error} = await this._address_elements.submit();
		if (error) {
			return reject(error);
		}

		// Get address.
		const address_info = await this._address_element.stripe_element.getValue();
		this._address = address_info.value;
		if (address_info.complete !== true) {
			return reject(new Error("Incomplete address information."));	
		}

		// Create a backend request.
		try {
			const result = await vweb.utils.request({
				method: "POST",
				url: "/vweb/payments/charge",
				data: {
					cart: vweb.payments.cart.items,
					name: this._address.name,
					phone: this._address.phone,
					address: this._address.address,
				}
			})
			this._client_secret = result.client_secret;
			this._return_url = result.return_url;
			resolve();
		} catch (error) {
			return reject(error);
		}
	})
}

// Charge the shopping cart.
/* 	@docs:
 * 	@chapter: Client
 * 	@title: Confirm Charge Shopping Cart
 *	@description: 
 *		Confirm the charge of the shopping cart asynchronously.
 *
 *		A charge can be confirmed after the following conditions are met:
 *			1) Products must be added to the shopping cart using `vweb.payments.cart.add()`.
 *			2) The address element must have been filled in and created using `vweb.payments.create_address_element()`. This is required for automatic tax.
 *			3) A charge was created using `vweb.payments.charge()`.
 *			4) The payment element must have been filled in and created using `vweb.payments.create_payment_element()`.
 */
vweb.payments.confirm_charge = async function() {
	return new Promise(async (resolve, reject) => {

		// Checks.
		if (this._client_secret == null) {
			return reject(new Error("No payment intent was created using \"vweb.payments.charge()\" or the shopping cart has been edited after the initial charge."));
		}
		if (this._return_url == null) {
			return reject(new Error("No payment intent was created using \"vweb.payments.charge()\"."));
		}
		if (this._payment_element == null) {
			return reject(new Error("No payment element was created using \"vweb.payments.create_payment_element()\"."));
		}
		if (this._address == null) {
			return reject(new Error("No address element was defined using \"vweb.payments.create_payment_element()\"."));
		}

		// Initialize stripe.
		this._initialize_stripe();

		// Submit the elements.
		const {error} = await this._payment_elements.submit();
		if (error) {
			return reject(error);
		}

		// Confirm the payment intent.
		let result = await this.stripe.confirmPayment({
			elements: this._payment_elements,
			clientSecret: this._client_secret,
			shipping: {
				name: this._address.name,
				phone: this._address.phone,
				address: this._address.address,
			},
			redirect: "always",
			confirmParams: {
				return_url: this._return_url,
			},
		});

		// Handle error.
		if (result.error) {
			return reject(result.error.message);
		}

		// Clear the cart and charge session.
		this.cart.clear();

		// Resolve.
		resolve();
	})
}

// Get the status of the payment intent.
/* 	@docs:
 * 	@chapter: Client
 * 	@title: Charge Status
 *	@description: 
 *		Get the status of the payment intent.
 *
 *		The client secret of the payment intent can be retrieved from query parameter `payment_intent_client_secret` on the endpoint of the specified `return_url`.
 *	@param:
 * 		@title: client_secret
 *		@description: The client secret of the payment intent.
 *	@type: Promise
 *	@return:
 *		A promise will be returned with a rejected error message or a resolved response object.
 *
 *		The resolved response object will have the following attributes:
 *		```js
 *		{
 *			status: <string>,			// the status of the payment intent, possible status values are ["requires_payment_method", "requires_confirmation", "requires_action", "processing", "requires_capture", "canceled", "succeeded"].
 *			charged: <boolean>,			// a boolean indiciating whether the payment has successfully been charged.
 *			cancelled: <boolean>,		// a boolean indiciating whether the payment has been cancelled.
 *			processing: <boolean>,		// a boolean indiciating whether the payment is still proceessing.
 *			message: <string>,			// the message string of the status.
 *			payment_intent: <object>,	// the payment intent object.
 *		}
 *		```
 */
vweb.payments.charge_status = async function(client_secret) {
	return new Promise(async (resolve, reject) => {

		// Initialize stripe.
		this._initialize_stripe();

		// Get the payment intent.
		const result = await this.stripe.retrievePaymentIntent(client_secret);
		if (result.error) {
			return reject(response.error);
		}

		// Create the message.
		let message, charged = false, cancelled = false, processing = false;
		switch (result.paymentIntent.status) {
			case "requires_payment_method":
				message = "The payment requires a payment method.";
				break;
			case "requires_confirmation":
				message = "The payment requires confirmation.";
				break;
			case "requires_action":
				message = "The payment requires action.";
				break;
			case "processing":
				processing = true;
				message = "The payment is still processing.";
				break;
			case "requires_capture":
				message = "The payment requires capture.";
				break;
			case "canceled":
				cancelled = true;
				message = "The payment has been cancelled.";
				break;
			case "succeeded":
				charged = true;
				message = "The payment has succeeded.";
				break;
		}

		// Resolve.
		resolve({
			status: result.paymentIntent.status,
			charged: charged,
			cancelled: cancelled,
			processing: processing,
			message: message,
			payment_intent: result.paymentIntent,
		});
	})
}

// The shopping cart object.
vweb.payments.cart = {};

// Refresh the shopping cart.
/* 	@docs:
 * 	@chapter: Client
 * 	@title: Refresh Cart
 *	@description:
 *		Refresh the shopping cart.
 *
 *		The current cart items are accessable as `vweb.payments.cart.items`.
 */
vweb.payments.cart.refresh = function() {

	// Load from local storage.
	try {
		this.items = JSON.parse(localStorage.getItem("vweb_shopping_cart")) || [];
	} catch(err) {
		this.items = [];
	}

	// Reset the charge objects.
	vweb.payments._reset();
}
vweb.payments.cart.refresh();

// Get the shopping cart.
/* 	@docs:
 * 	@chapter: Client
 * 	@title: Save Cart
 *	@description:
 *		Save the shopping cart in the local storage.
 *
 *		The current cart items are accessable as `vweb.payments.cart.items`.
 */
vweb.payments.cart.save = function(cart) {

	// Save to local storage.
	localStorage.setItem("vweb_shopping_cart", JSON.stringify(this.items));

	// Reset the charge objects.
	vweb.payments._reset();
}

// Add a product to the shopping cart.
/* 	@docs:
 * 	@chapter: Client
 * 	@title: Add to Cart
 *	@description: 
 *		Add a product to the shopping cart.
 *
 *		When the product was already added to the shopping cart only the quantity will be incremented.
 *
 *		An error will be thrown the product id does not exist.
 *
 *		The current cart items are accessable as `vweb.payments.cart.items`.
 *	@parameter:
 * 		@name: id
 *		@description: The product's id.
 * 		@type: string
 *	@parameter:
 * 		@name: quantity
 *		@description: The quantity to add.
 * 		@type: number
 */
vweb.payments.cart.add = async function(id, quantity = 1) {
	this.refresh(); // update for if another window has updated the cart.
	const found = this.items.iterate((item) => {
		if (item.product.id === id) {
			item.quantity += quantity;
			return true;
		}
	})
	if (found !== true) {
		const product = await vweb.payments.get_product(id);
		this.items.push({
			product: product,
			quantity: quantity,
		});
	}
	this.save();
}

// Remove a product from the shopping cart.
/* 	@docs:
 * 	@chapter: Client
 * 	@title: Add to Cart
 *	@description: 
 *		Remove a product from the shopping cart.
 *
 *		Does not throw an error when the product was not added to the shopping cart.
 *
 *		The current cart items are accessable as `vweb.payments.cart.items`.
 *	@parameter:
 * 		@name: id
 *		@description: The product's id.
 * 		@type: string
 *	@parameter:
 * 		@name: quantity
 *		@description: The quantity to remove. When the quantity value is "all" entire product will be removed from the shopping cart.
 * 		@type: number, string
 */
vweb.payments.cart.remove = async function(id, quantity = 1) {
	this.refresh(); // update for if another window has updated the cart.
	let new_cart = [];
	this.items.iterate((item) => {
		if (item.product.id === id) {
			if (quantity === "all") {
				item.quantity = 0;
			} else {
				item.quantity -= quantity;
			}
		}
		if (item.quantity > 0) {
			new_cart.push(item);
		}
	})
	this.items.length = 0;
	new_cart.iterate((item) => {
		this.items.push(item);
	})
	this.save();
}

// Clear the shopping cart.
/* 	@docs:
 * 	@chapter: Client
 * 	@title: Clear Cart
 *	@description: 
 *		Clear the shopping cart.
 *
 *		Will automatically be called if `vweb.payments.confirm_charge()` finished without any errors.
 *
 *		The current cart items are accessable as `vweb.payments.cart.items`.
 */
vweb.payments.cart.clear = async function(id, quantity = 1) {
	this.items = [];
	this.save();
}