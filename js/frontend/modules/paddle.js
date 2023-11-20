/*
 * @author: Daan van den Bergh
 * @copyright: © 2022 - 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Private.

vweb.payments = {};
vweb.payments.client_key = "{{PADDLE_CLIENT_KEY}}";
vweb.payments.sandbox = {{PADDLE_SANDBOX}};
vweb.payments.tax_inclusive = {{PADDLE_INCLUSIVE_TAX}};
vweb.payments.countries = {
	"AD": "🇦🇩  Andorra",
    "AE": "🇦🇪  United Arab Emirates",
    "AF": "🇦🇫  Afghanistan",
    "AG": "🇦🇬  Antigua and Barbuda",
    "AI": "🇦🇮  Anguilla",
    "AL": "🇦🇱  Albania",
    "AM": "🇦🇲  Armenia",
    "AO": "🇦🇴  Angola",
    "AQ": "🇦🇶  Antarctica",
    "AR": "🇦🇷  Argentina",
    "AS": "🇦🇸  American Samoa",
    "AT": "🇦🇹  Austria",
    "AU": "🇦🇺  Australia",
    "AW": "🇦🇼  Aruba",
    "AX": "🇦🇽  Åland Islands",
    "AZ": "🇦🇿  Azerbaijan",
    "BA": "🇧🇦  Bosnia and Herzegovina",
    "BB": "🇧🇧  Barbados",
    "BD": "🇧🇩  Bangladesh",
    "BE": "🇧🇪  Belgium",
    "BF": "🇧🇫  Burkina Faso",
    "BG": "🇧🇬  Bulgaria",
    "BH": "🇧🇭  Bahrain",
    "BI": "🇧🇮  Burundi",
    "BJ": "🇧🇯  Benin",
    "BL": "🇧🇱  Saint Barthélemy",
    "BM": "🇧🇲  Bermuda",
    "BN": "🇧🇳  Brunei",
    "BO": "🇧🇴  Bolivia",
    "BQ": "🇧🇶  Caribbean Netherlands",
    "BR": "🇧🇷  Brazil",
    "BS": "🇧🇸  Bahamas",
    "BT": "🇧🇹  Bhutan",
    "BV": "🇧🇻  Bouvet Island",
    "BW": "🇧🇼  Botswana",
    "BY": "🇧🇾  Belarus",
    "BZ": "🇧🇿  Belize",
    "CA": "🇨🇦  Canada",
    "CC": "🇨🇨  Cocos (Keeling) Islands",
    "CD": "🇨🇩  Congo (DRC)",
    "CF": "🇨🇫  Central African Republic",
    "CG": "🇨🇬  Congo (Republic)",
    "CH": "🇨🇭  Switzerland",
    "CI": "🇨🇮  Côte d'Ivoire",
    "CK": "🇨🇰  Cook Islands",
    "CL": "🇨🇱  Chile",
    "CM": "🇨🇲  Cameroon",
    "CN": "🇨🇳  China",
    "CO": "🇨🇴  Colombia",
    "CR": "🇨🇷  Costa Rica",
    "CU": "🇨🇺  Cuba",
    "CV": "🇨🇻  Cape Verde",
    "CW": "🇨🇼  Curaçao",
    "CX": "🇨🇽  Christmas Island",
    "CY": "🇨🇾  Cyprus",
    "CZ": "🇨🇿  Czech Republic",
    "DE": "🇩🇪  Germany",
    "DJ": "🇩🇯  Djibouti",
    "DK": "🇩🇰  Denmark",
    "DM": "🇩🇲  Dominica",
    "DO": "🇩🇴  Dominican Republic",
    "DZ": "🇩🇿  Algeria",
    "EC": "🇪🇨  Ecuador",
    "EE": "🇪🇪  Estonia",
    "EG": "🇪🇬  Egypt",
    "EH": "🇪🇭  Western Sahara",
    "ER": "🇪🇷  Eritrea",
    "ES": "🇪🇸  Spain",
    "ET": "🇪🇹  Ethiopia",
    "FI": "🇫🇮  Finland",
    "FJ": "🇫🇯  Fiji",
    "FK": "🇫🇰  Falkland Islands (Malvinas)",
    "FM": "🇫🇲  Micronesia",
    "FO": "🇫🇴  Faroe Islands",
    "FR": "🇫🇷  France",
    "GA": "🇬🇦  Gabon",
    "GB": "🇬🇧  United Kingdom",
    "GD": "🇬🇩  Grenada",
    "GE": "🇬🇪  Georgia",
    "GF": "🇬🇫  French Guiana",
    "GG": "🇬🇬  Guernsey",
    "GH": "🇬🇭  Ghana",
    "GI": "🇬🇮  Gibraltar",
    "GL": "🇬🇱  Greenland",
    "GM": "🇬🇲  Gambia",
    "GN": "🇬🇳  Guinea",
    "GP": "🇬🇵  Guadeloupe",
    "GQ": "🇬🇶  Equatorial Guinea",
    "GR": "🇬🇷  Greece",
    "GS": "🇬🇸  South Georgia and the South Sandwich Islands",
    "GT": "🇬🇹  Guatemala",
    "GU": "🇬🇺  Guam",
    "GW": "🇬🇼  Guinea-Bissau",
    "GY": "🇬🇾  Guyana",
    "HK": "🇭🇰  Hong Kong",
    "HM": "🇭🇲  Heard Island and McDonald Islands",
    "HN": "🇭🇳  Honduras",
    "HR": "🇭🇷  Croatia",
    "HT": "🇭🇹  Haiti",
    "HU": "🇭🇺  Hungary",
    "ID": "🇮🇩  Indonesia",
    "IE": "🇮🇪  Ireland",
    "IL": "🇮🇱  Israel",
    "IM": "🇮🇲  Isle of Man",
    "IN": "🇮🇳  India",
    "IO": "🇮🇴  British Indian Ocean Territory",
    "IQ": "🇮🇶  Iraq",
    "IR": "🇮🇷  Iran",
    "IS": "🇮🇸  Iceland",
    "IT": "🇮🇹  Italy",
    "JE": "🇯🇪  Jersey",
    "JM": "🇯🇲  Jamaica",
    "JO": "🇯🇴  Jordan",
    "JP": "🇯🇵  Japan",
    "KE": "🇰🇪  Kenya",
    "KG": "🇰🇬  Kyrgyzstan",
    "KH": "🇰🇭  Cambodia",
    "KI": "🇰🇮  Kiribati",
    "KM": "🇰🇲  Comoros",
    "KN": "🇰🇳  Saint Kitts and Nevis",
    "KP": "🇰🇵  North Korea",
    "KR": "🇰🇷  South Korea",
    "KW": "🇰🇼  Kuwait",
    "KY": "🇰🇾  Cayman Islands",
    "KZ": "🇰🇿  Kazakhstan",
    "LA": "🇱🇦  Laos",
    "LB": "🇱🇧  Lebanon",
    "LC": "🇱🇨  Saint Lucia",
    "LI": "🇱🇮  Liechtenstein",
    "LK": "🇱🇰  Sri Lanka",
    "LR": "🇱🇷  Liberia",
    "LS": "🇱🇸  Lesotho",
    "LT": "🇱🇹  Lithuania",
    "LU": "🇱🇺  Luxembourg",
    "LV": "🇱🇻  Latvia",
    "LY": "🇱🇾  Libya",
    "MA": "🇲🇦  Morocco",
    "MC": "🇲🇨  Monaco",
    "MD": "🇲🇩  Moldova",
    "ME": "🇲🇪  Montenegro",
    "MF": "🇲🇫  Saint Martin",
    "MG": "🇲🇬  Madagascar",
    "MH": "🇲🇭  Marshall Islands",
    "MK": "🇲🇰  North Macedonia",
    "ML": "🇲🇱  Mali",
    "MM": "🇲🇲  Myanmar (Burma)",
    "MN": "🇲🇳  Mongolia",
    "MO": "🇲🇴  Macao",
    "MP": "🇲🇵  Northern Mariana Islands",
    "MQ": "🇲🇶  Martinique",
    "MR": "🇲🇷  Mauritania",
    "MS": "🇲🇸  Montserrat",
    "MT": "🇲🇹  Malta",
    "MU": "🇲🇺  Mauritius",
    "MV": "🇲🇻  Maldives",
    "MW": "🇲🇼  Malawi",
    "MX": "🇲🇽  Mexico",
    "MY": "🇲🇾  Malaysia",
    "MZ": "🇲🇿  Mozambique",
    "NA": "🇳🇦  Namibia",
    "NC": "🇳🇨  New Caledonia",
    "NE": "🇳🇪  Niger",
    "NF": "🇳🇫  Norfolk Island",
    "NG": "🇳🇬  Nigeria",
    "NI": "🇳🇮  Nicaragua",
    "NL": "🇳🇱  Netherlands",
    "NO": "🇳🇴  Norway",
    "NP": "🇳🇵  Nepal",
    "NR": "🇳🇷  Nauru",
    "NU": "🇳🇺  Niue",
    "NZ": "🇳🇿  New Zealand",
    "OM": "🇴🇲  Oman",
    "PA": "🇵🇦  Panama",
    "PE": "🇵🇪  Peru",
    "PF": "🇵🇫  French Polynesia",
    "PG": "🇵🇬  Papua New Guinea",
    "PH": "🇵🇭  Philippines",
    "PK": "🇵🇰  Pakistan",
    "PL": "🇵🇱  Poland",
    "PM": "🇵🇲  Saint Pierre and Miquelon",
    "PN": "🇵🇳  Pitcairn Islands",
    "PR": "🇵🇷  Puerto Rico",
    "PS": "🇵🇸  Palestine",
    "PT": "🇵🇹  Portugal",
    "PW": "🇵🇼  Palau",
    "PY": "🇵🇾  Paraguay",
    "QA": "🇶🇦  Qatar",
    "RE": "🇷🇪  Réunion",
    "RO": "🇷🇴  Romania",
    "RS": "🇷🇸  Serbia",
    "RU": "🇷🇺  Russia",
    "RW": "🇷🇼  Rwanda",
    "SA": "🇸🇦  Saudi Arabia",
    "SB": "🇸🇧  Solomon Islands",
    "SC": "🇸🇨  Seychelles",
    "SD": "🇸🇩  Sudan",
    "SE": "🇸🇪  Sweden",
    "SG": "🇸🇬  Singapore",
    "SH": "🇸🇭  Saint Helena, Ascension and Tristan da Cunha",
    "SI": "🇸🇮  Slovenia",
    "SJ": "🇸🇯  Svalbard and Jan Mayen",
    "SK": "🇸🇰  Slovakia",
    "SL": "🇸🇱  Sierra Leone",
    "SM": "🇸🇲  San Marino",
    "SN": "🇸🇳  Senegal",
    "SO": "🇸🇴  Somalia",
    "SR": "🇸🇷  Suriname",
    "SS": "🇸🇸  South Sudan",
    "ST": "🇸🇹  São Tomé and Príncipe",
    "SV": "🇸🇻  El Salvador",
    "SX": "🇸🇽  Sint Maarten",
    "SY": "🇸🇾  Syria",
    "SZ": "🇸🇿  Eswatini",
    "TC": "🇹🇨  Turks and Caicos Islands",
    "TD": "🇹🇩  Chad",
    "TF": "🇹🇫  French Southern and Antarctic Lands",
    "TG": "🇹🇬  Togo",
    "TH": "🇹🇭  Thailand",
    "TJ": "🇹🇯  Tajikistan",
    "TK": "🇹🇰  Tokelau",
    "TL": "🇹🇱  Timor-Leste",
    "TM": "🇹🇲  Turkmenistan",
    "TN": "🇹🇳  Tunisia",
    "TO": "🇹🇴  Tonga",
    "TR": "🇹🇷  Turkey",
    "TT": "🇹🇹  Trinidad and Tobago",
    "TV": "🇹🇻  Tuvalu",
    "TW": "🇹🇼  Taiwan",
    "TZ": "🇹🇿  Tanzania",
    "UA": "🇺🇦  Ukraine",
    "UG": "🇺🇬  Uganda",
    "UM": "🇺🇲  U.S. Minor Outlying Islands",
    "US": "🇺🇸  United States",
    "UY": "🇺🇾  Uruguay",
    "UZ": "🇺🇿  Uzbekistan",
    "VA": "🇻🇦  Vatican City",
    "VC": "🇻🇨  Saint Vincent and the Grenadines",
    "VE": "🇻🇪  Venezuela",
    "VG": "🇻🇬  British Virgin Islands",
    "VI": "🇻🇮  U.S. Virgin Islands",
    "VN": "🇻🇳  Vietnam",
    "VU": "🇻🇺  Vanuatu",
    "WF": "🇼🇫  Wallis and Futuna",
    "WS": "🇼🇸  Samoa",
    "YE": "🇾🇪  Yemen",
    "YT": "🇾🇹  Mayotte",
    "ZA": "🇿🇦  South Africa",
    "ZM": "🇿🇲  Zambia",
    "ZW": "🇿🇼  Zimbabwe",
};
// vweb.payments.include_started = true; // will be set to true when the adyen js script has started loading. // @todo change to false.
// vweb.payments.include_finished = false; // will be set to true when the adyen js script has been loaded.

// ---------------------------------------------------------
// Private.

// Initialize paddle.
vweb.payments._initialize_paddle = function() {
	if (this._paddle_initialized !== true) {
		if (this.sandbox) {
			Paddle.Environment.set("sandbox");
		}
		Paddle.Setup({ 
			token: this.client_key,
			eventCallback: function(data) {
				if (this.sandbox) {
					console.log(data.name || data.type)
					console.log(data);
				}
				if (data.name === "checkout.loaded") {
					vweb.payments._render_payment_element_resolve();
				}
				else if (data.name === "checkout.completed") {
					vweb.payments._show_processing("success")
				}
				else if (data.name === "checkout.payment.initiated") {
					// vweb.payments._show_processing("processing")
				}
				else if (data.name === "checkout.payment.failed") {
					vweb.payments._show_processing("error")
				}
				else if (data.type === "checkout.error") {
					console.error(data)
					vweb.payments._render_payment_element_reject(data.detail.split("|")[0]);
				}
				else if (data.type === "checkout.warning") {
					if (vweb.payments.sandbox) {
						console.log("Checkout warning:", data);
					}
				}
				else {
					if (vweb.payments.sandbox) {
						console.log("Event", data);
					}
				}
			}
		});
		this._paddle_initialized = true;
	}
};

// Reset when any changes to the shopping cart have been made.
vweb.payments._reset = function() {
	if (this._payment_element !== undefined) {
		this._payment_element.remove();
	}
	this._payment_element = undefined;
	this._pay_id = undefined;
}

// Verify the order.
// Makes some checks and generates a payment id which will be attached to the transaction for the backend management.
vweb.payments._init_order = async function () {
	try {
		const response = await vweb.utils.request({
			method: "POST",
			url: "/vweb/payments/init",
			data: {
				items: this.cart.items,
			}
		})
		this._pay_id = response.pay_id;
	} catch (err) {
		if (typeof err === "object" && err.error != null) {
			err = err.error;
		}
		throw new Error(err);
	}
}

// Set step.
vweb.payments._set_step = async function() {
	switch (this._step) {

		// Order.
		case 0: {

			// Select.
			this._steps_element.select(this._step);

			// Set elements.
			this._overview_container.show();
			this._order_container.show();
			this._billing_container.hide();
			this._payment_container.hide();
			this._processing_container.hide();
			this._checkout_button.text.text("Next");
			// this._policy_checkbox.hide();
			this._prev_step_button.hide();
			break;
		}

		// Address.
		case 1: {

			// Verify the order.
			try {
				await this._init_order();
			} catch (err) {
				--this._step;
				console.error(err);
				this.on_error(err);
				return null;
			}

			// Render.
			this._render_billing_element()

			// Select.
			this._steps_element.select(this._step);

			// Set elements.
			this._overview_container.show();
			this._order_container.hide();
			this._billing_container.show();
			this._payment_container.hide();
			this._processing_container.hide();
			this._checkout_button.text.text("Next");
			// this._policy_checkbox.hide();
			this._prev_step_button.show();
			break;
		}

		// Payment.
		case 2: {

			// Check if the billing details are entered correctly.
			try {
				this._billing_details = this._billing_element.data()
				this._billing_details.phone_number = this._billing_details.phone_country_code + this._billing_details.phone_number;
				delete this._billing_details.phone_country_code;
			} catch (error) {
				--this._step;
				console.error(error);
				this.on_error(error);
				return null;
			}

			// Render.
			try {
				await this._render_payment_element()
			} catch (error) {
				--this._step;
				console.error(error);
				this.on_error(error);
				return null;
			}

			// Select.
			this._steps_element.select(this._step);

			// Set elements.
			this._overview_container.hide();
			this._order_container.hide();
			this._billing_container.hide();
			this._payment_container.show();
			this._processing_container.hide();
			this._checkout_button.text.text("Checkout");
			// this._policy_checkbox.show();
			this._prev_step_button.show();
			break;
		}
	}
}

// Go to the next step.
vweb.payments._next = async function() {
	if (this._step < 3) {
		++this._step;
		return this._set_step();
	} else if (this._step === 3) {
		return this._set_step();
	}
}

// Go to the prev step.
vweb.payments._prev = async function() {
	if (this._step > 0) {
		--this._step;
		return this._set_step();
	}
}

// Render the steps element.
vweb.payments._render_steps_element = function() {

	// Shortcuts.
	const style = this._style;

	// The previous step button.
	this._prev_step_button = HStack(
			ImageMask("/static/payments/arrow.long.webp")
				.frame(15, 15)
				.mask_color(this._style.subtext_fg)
				.transform("rotate(180deg)")
				.margin_right(10),
			Text("Previous Step")
				.color(this._style.subtext_fg)
				.padding(0)
				.margin(0)
				.font_size(14)
		)
		.hide()
		.on_click(() => {
			vweb.payments._prev()
				.catch((err) => console.error(err))
		})
		.center_vertical();

	// The steps element.
	this._steps_element = HStack(
		ForEach(
			["Order Details", "Billing Details", "Payment Details", "Processing Details"],
			(item, index) => {
				const stack = HStack(
					VStack((index + 1).toString())
						.font_size(11)
						.padding(0)
						.margin(0)
						.color(index === 0 ? this._style.selected_fg : this._style.widget_fg)
						.frame(17.5, 17.5)
						.background(index === 0 ? this._style.selected_bg : this._style.widget_bg)
						.border_radius(50%)
						.margin_right(15)
						.flex_shrink(0)
						.center()
						.center_vertical(),
					Text(item)
						.color(this._style.fg)
						.padding(0)
						.font_size(14)
						.line_height(16)
				)
				.center_vertical()
				.margin_right(25)
				return stack;
			}
		),
		Spacer().min_frame(10, 1),
		this._prev_step_button,
	)
	.overflow_x("scroll")
	.class("hide_scrollbar")
	.extend({
		selected_index: 0,
		select: function(index) {
			let e = this.child(this.selected_index).child(0);
			e.color(style.widget_fg);
			e.background(style.widget_bg);
			this.selected_index = index;
			e = this.child(this.selected_index).child(0);
			e.color(style.selected_fg);
			e.background(style.selected_bg);
		}
	})

	// Append.
	this._steps_container.append(this._steps_element);
}

// Render the overview element.
vweb.payments._render_overview_element = function() {
	
	// The subtotal price from the overview.
	this._overview_subtotal = Text(`${this._currency_symbol == null ? "$" : this._currency_symbol} 0.00`)
		.color(this._style.fg)
		.font_size(this._style.font_size)
		.flex_shrink(0)
		.margin(0)
		.padding(0)
	
	// The total price from the overview.
	this._overview_total = Text(`${this._currency_symbol == null ? "$" : this._currency_symbol} 0.00`)
		.font_weight("bold")
		.color(this._style.fg)
		.font_size(this._style.font_size)
		.flex_shrink(0)
		.margin(0)
		.padding(0)

	// The subtotal vat price from the overview.
	this._overview_subtotal_tax = Text(`${this._currency_symbol == null ? "$" : this._currency_symbol} 0.00`)
		.color(this._style.fg)
		.font_size(this._style.font_size)
		.flex_shrink(0)
		.margin(0)
		.padding(0)

	// The tax stack.
	this._overview_tax_container = HStack(
			Text("Tax:")
				.color(this._style.fg)
				.font_size(this._style.font_size)
				.stretch(true)
				.flex_shrink(0)
				.margin(0, 5, 0, 0)
				.padding(0)
				.wrap(false)
				.overflow("hidden")
				.text_overflow("ellipsis"),
			this._overview_subtotal_tax,
		)
		.margin_top(5);

	// The incl excl tax text.
	this._overview_incl_excl_tax = Text(vweb.payments.tax_inclusive ? "incl. tax" : "excl. tax")
		.color(this._style.subtext_fg)
		.font_size(this._style.font_size - 6)
		.margin(2.5, 0, 0, 0)
		.padding(0)
		.flex_shrink(0)
		.text_trailing();

	// The checkout button.
	this._checkout_button = LoaderButton("Next")
		.border_radius(this._style.button_border_radius)
		.color(this._style.button_fg)
		.background(this._style.button_bg)
		.hover_brightness(...this._style.button_brightness)
		.loader
			.background(this._style.button_fg)
			.update()
			.parent()
		.on_click(async () => {
			this._checkout_button.show_loader();
			vweb.payments._next()
				.then(() => {
					this._checkout_button.hide_loader();
				})
				.catch((err) => {
					console.error(err)
					this._checkout_button.hide_loader();
				})
		});

	// Accept agreements.
	// this._policy_checkbox = CheckBox({text: "I agree to the Terms and Conditions and the " + Link("Refund", this._refund_policy) + " and " + Link("Cancellation", this._cancellation_policy) + " policy. I agree that my payment method may be used for recurring subscriptions.", required: true}) // @todo check text.
	// 	.color(this._style.subtext_fg)
	// 	.border_color(this._style.border_bg)
	// 	.font_size(this._style.font_size - 6)
	// 	.focus_color(this._style.theme_fg)
	// 	.missing_color(this._style.missing_fg)
	// 	.inner_bg(this._style.bg)
	// 	.margin_bottom(15)
	// 	.hide();

	// Preview price for taxes.

	// The overview element.
	this._overview_element = VStack(
		Title("Overview")
			.color(this._style.title_fg)
			.width("fit-content")
			.font_size(this._style.font_size - 2)
			.flex_shrink(0)
			.margin(0, 0, 15, 0)
			.letter_spacing("1px")
			.text_transform("uppercase")
			.ellipsis_overflow(true),

		HStack(
			Text("Subtotal:")
				.color(this._style.fg)
				.font_size(this._style.font_size)
				.stretch(true)
				.flex_shrink(0)
				.margin(0, 5, 0, 0)
				.padding(0)
				.wrap(false)
				.overflow("hidden")
				.text_overflow("ellipsis"),
			this._overview_subtotal,
		),
		// HStack(
		// 	Text("Shipping:")
		// 		.color(this._style.fg)
		// 		.font_size(this._style.font_size)
		// 		.stretch(true)
		// 		.flex_shrink(0)
		// 		.margin(0, 5, 0, 0)
		// 		.padding(0)
		// 		.wrap(false)
		// 		.overflow("hidden")
		// 		.text_overflow("ellipsis"),
		// 	Text("free")
		// 		.color(this._style.fg)
		// 		.font_size(this._style.font_size)
		// 		.flex_shrink(0)
		// 		.margin(0)
		// 		.padding(0)
		// 		.wrap(false)
		// 		.overflow("hidden")
		// 		.text_overflow("ellipsis"),
		// )
		// .margin_top(5),
		this._overview_tax_container,
		Divider()
			.margin(20, 0, 20, 0)
			.background(this._style.border_bg),
		HStack(
			Text("Total:")
				.font_weight("bold")
				.color(this._style.fg)
				.font_size(this._style.font_size)
				.stretch(true)
				.flex_shrink(0)
				.margin(0, 5, 0, 0)
				.padding(0)
				.wrap(false)
				.overflow("hidden")
				.text_overflow("ellipsis"),
			VStack(
				this._overview_total,
				this._overview_incl_excl_tax,
			),
		)
		.margin_bottom(25),
		// this._policy_checkbox,
		this._checkout_button,
	)
	.extend({
		total: 0,
		tax: 0,
		unknown_tax: () => {
			this._overview_incl_excl_tax.text(vweb.payments.tax_inclusive ? "incl. tax" : "excl. tax");
			this._overview_tax_container.hide();
			this._overview_element.tax = 0;
			this._overview_total.text(`${this._currency_symbol} ${this._overview_element.total.toFixed(2)}`);
		},
		calc_tax: async (country) => {
			this._initialize_paddle();
			try {
				const result = await Paddle.PricePreview({
					items: this.cart.items.iterate_append((item) => {return {priceId: item.product.price_id, quantity: item.quantity}}),
					address: {countryCode: country},
				})
				this._overview_element.tax = 0;
				result.data.details.lineItems.iterate((item) => {
					this._overview_element.tax += parseInt(item.totals.tax) / 100;
				})
				this._overview_tax_container.show();
				this._overview_incl_excl_tax.text("incl. tax");
				this._overview_subtotal_tax.text(`${this._currency_symbol} ${this._overview_element.tax.toFixed(2)}`);
				this._overview_total.text(`${this._currency_symbol} ${(this._overview_element.total + this._overview_element.tax).toFixed(2)}`);
			} catch (error) {
				console.error(error)
				this._overview_element.unknown_tax();
			}
		},
	})

	// Append.
	this._overview_container.append(this._overview_element);
}

// Render the order element.
vweb.payments._render_order_element = function() {

	// Render.
	this._order_element = VStack()
	.extend({
		refresh: function() {
			
			// Refresh the cart.
			vweb.payments.cart.refresh();

			// Shortcuts.
			const style = vweb.payments._style;
			const cart = vweb.payments.cart;
			const cart_items = vweb.payments.cart.items;
			
			// Shopping cart view.
			let currency_symbol = undefined;
			let subtotal = 0;
			cart_items.iterate((item) => {
				if (currency_symbol === undefined) {
					currency_symbol = vweb.payments.get_currency_symbol(item.product.currency);
				}
				subtotal += item.product.price * item.quantity;
			});
			if (currency_symbol === undefined) {
				currency_symbol = "$";
			}
			vweb.payments._currency_symbol = currency_symbol;
			
			// set the overview prices.
			vweb.payments._overview_subtotal.text(`${currency_symbol} ${subtotal.toFixed(2)}`)
			vweb.payments._overview_element.total = subtotal;
			vweb.payments._overview_element.unknown_tax();
			
			// Add the products.
			this.remove_children();
			if (cart_items.length === 0) {
				this.height(160)
				this.append(
					VStack(
						Title("Empty Shopping Cart")
							.color(style.fg)
							.font_size(style.font_size - 2)
							.flex_shrink(0)
							.letter_spacing("1px")
							.text_transform("uppercase")
							.ellipsis_overflow(true)
							.margin(0)
							.padding(0)
							.assign_to_parent_as("title_e"),
						Text(`Your shopping cart is empty.`)
							.color(style.subtext_fg)
							.font_size(style.font_size - 2)
							.line_height(style.font_size)
							.margin(5, 0, 0, 0)
							.padding(0)
							.assign_to_parent_as("text_e")
							.white_space("pre")
							.line_height("1.4em")
							.center(),
						ImageMask("/static/payments/shopping_cart.webp")
							.frame(35, 35)
							.margin_bottom(15)
							.mask_color(style.theme_fg),
					)
					.frame(100%, 100%)
					.center()
					.center_vertical()
				);
			} else {
				// this.height(100%)
				this.append(
					Title("Order Details")
						.color(style.title_fg)
						.width("fit-content")
						.font_size(style.font_size - 2)
						.flex_shrink(0)
						.margin(0, 0, 0, 0)
						.letter_spacing("1px")
						.text_transform("uppercase")
						.ellipsis_overflow(true),

					Divider()
						.background(style.border_bg)
						.margin(10, 0, 20, 0),

					ForEach(cart_items, (item, index) => {
						const quantity_input = Input("Quantity")
							.value(item.quantity)
							.font_size(16)
							.color(style.input_fg)
							.font_size(style.font_size - 2)
							.border(1, style.border_bg)
							.padding(12.5, 10, 12.5, 10)
							.margin_right(10)
							.flex_shrink(0)
							.width(`calc(${item.quantity.toString().length}ch + 20px)`)
							.display("inline")
							.on_input((_, event) => {
								const value = quantity_input.value();
								quantity_input.width(`calc(${value.length}ch + 20px)`)
								clearTimeout(quantity_input.timeout);
								quantity_input.timeout = setTimeout(() => {
									const quantity = parseInt(value);
									if (isNaN(quantity)) {
										console.error(`Specified quantity "${value}" is not a number.`);
										vweb.payments.on_error(new Error(`Specified quantity "${value}" is not a number.`));
										quantity_input.value(item.quantity.toString());
										return null;
									}
									item.quantity = quantity;
									cart.save();
									this.refresh();
								}, 500)
							})
						
						let per_item = "per item" + (vweb.payments.tax_inclusive ? " incl. tax" : " excl. tax") + ".";
						let renews_every = null;
						if (item.product.interval) {
							if (item.product.frequency === 1) {
								renews_every = `renews ${item.product.interval}ly.`;
							} else {
								renews_every = `renews every ${item.product.frequency} ${item.product.interval}s.`;
							}
						}
						const stack = HStack(
							item.product.icon == null ? null : 
								Image(item.product.icon)
									.frame(30, 30)
									.flex_shrink(0)
									.margin(0, 25, 0, 0),
							VStack(
								Title(item.product.name)
									.color(style.fg)
									.font_size(style.font_size)
									.margin(0, 10, 0, 0)
									.padding(0)
									.wrap(false)
									.overflow("hidden")
									.text_overflow("ellipsis"),
								Text(item.product.description)
									.color(style.subtext_fg)
									.font_size(style.font_size - 2)
									.line_height(style.font_size)
									.margin(10, 10, 0, 0)
									.wrap(true)
									.padding(0),
								HStack(
									Text("Quantity:")
										.color(style.subtext_fg)
										.font_size(style.font_size - 2)
										// .line_height(style.font_size)
										.margin(0, 10, 2, 0)
										.padding(0)
										.flex_shrink(0),
									quantity_input,
									ImageMask("/static/payments/minus.webp")
										.frame(20, 20)
										.padding(5)
										.margin_right(5)
										.mask_color(style.widget_fg)
										.background(style.widget_bg)
										.border_radius(50%)
										.flex_shrink(0)
										.hover_brightness(...style.button_brightness)
										.on_click(async () => {
											if (item.quantity === 1) {
												await cart.remove(item.product.id, "all")
												this.refresh()
											} else {
												await cart.remove(item.product.id, 1)
												this.refresh()
											}
										}),
									ImageMask("/static/payments/plus.webp")
										.frame(20, 20)
										.padding(5)
										.margin_right(5)
										.mask_color(style.widget_fg)
										.background(style.widget_bg)
										.border_radius(50%)
										.flex_shrink(0)
										.hover_brightness(...style.button_brightness)
										.on_click(async () => {
											await cart.add(item.product.id, 1)
											this.refresh()
										}),
									ImageMask("/static/payments/trash.webp")
										.frame(20, 20)
										.padding(5)
										.margin_right(5)
										.mask_color(style.widget_fg)
										.background(style.widget_bg)
										.border_radius(50%)
										.flex_shrink(0)
										.hover_brightness(...style.button_brightness)
										.on_click(async () => {
											await cart.remove(item.product.id, "all")
											this.refresh()
										}),
								)
								.center_vertical()
								.wrap(true)
								.margin_top(10)
							)
							.stretch(true),
							VStack(
								Title(`${currency_symbol} ${(item.product.price * item.quantity).toFixed(2)}`)
									.color(style.fg)
									.font_size(style.font_size)
									.margin(0)
									.padding(0)
									.flex_shrink(0)
									.wrap(false)
									.overflow("hidden")
									.text_overflow("ellipsis"),
								Text(`${currency_symbol} ${item.product.price} ${per_item}`)
									.color(style.subtext_fg)
									.font_size(style.font_size - 6)
									.margin(5, 0, 0, 0)
									.padding(0)
									.flex_shrink(0),
								renews_every == null ? null : Text(renews_every)
									.color(style.subtext_fg)
									.font_size(style.font_size - 6)
									.margin(2.5, 0, 0, 0)
									.padding(0)
									.flex_shrink(0),
							)
						)
						.overflow_x("scroll")
						.class("hide_scrollbar")
						.width(100%)
						.media(
							"width >= 800px",
							(e) => {
								e.wrap(false);
								e.child(2).min_width("none")
									.margin(0)
							},
							(e) => {
								e.wrap(true);
								e.child(2)
									.min_width(100%)
									.margin(15, 0, 0, 30 + 25)
							},
						);
						return [
							stack,
							index === cart_items.length - 1 ? null : Divider()
								.background(style.border_bg)
								.margin(20, 0, 20, 0)
								
						];
					})
				)
			}
			return this;
		}
	})
		
	// Append.
	this._order_container.append(this._order_element.refresh());
}

// Render the refunds element.
vweb.payments._render_refunds_element = function() {

	// Render.
	const style = this._style;
	this._refunds_element = VStack()
	.extend({
		refresh: async function() {

			// Reset.
			this.inner_html("");

			// Create containers.
			let payments = await vweb.payments.get_refundable_payments({
				days: vweb.payments._days_refundable,
			});
			const refundable_container = VStack()
				.extend({
					title: "Refundable Payments",
					payments: payments,
					is_refundable: true,
				});
			payments = await vweb.payments.get_refunding_payments();
			const refunding_container = VStack()
				.hide()
				.extend({
					title: "Processing Refunds",
					payments: payments,
					is_refunding: true,
				});
			payments = await vweb.payments.get_refunded_payments();
			const refunded_container = VStack()
				.hide()
				.extend({
					title: "Refunded Payments",
					payments: payments,
					is_refunded: true,
				});

			// Option bar.
			const option_bar = HStack(
				Text("Refundable")
					.font_size(style.font_size)
					.color(style.fg)
					.background(style.widget_bg)
					.padding(8, 6)
					.margin(0)
					.stretch(true)
					.text_center()
					.transition("color 350ms ease, background 350ms ease")
					.on_mouse_over((e) => {
						if (e.background() === "transparent") {
							e.color(style.fg);
						}
					})
					.on_mouse_out((e) => {
						if (e.background() === "transparent") {
							e.color(style.subtext_fg);
						}
					})
					.on_click((e) => {
						e.color(vweb.payments._style.fg);
						e.background(vweb.payments._style.widget_bg);
						[e.parentElement.child(1), e.parentElement.child(2)].iterate((child) => {
							child.color(vweb.payments._style.subtext_fg);
							child.background("none");
						})

						refundable_container.show();
						refunding_container.hide();
						refunded_container.hide();
					}),
				Text("Processing")
					.font_size(style.font_size)
					.color(style.subtext_fg)
					.background("transparent")
					.padding(8, 6)
					.margin(0)
					.stretch(true)
					.text_center()
					.transition("color 350ms ease, background 350ms ease")
					.on_mouse_over((e) => {
						if (e.background() === "transparent") {
							e.color(style.fg);
						}
					})
					.on_mouse_out((e) => {
						if (e.background() === "transparent") {
							e.color(style.subtext_fg);
						}
					})
					.on_click((e) => {
						e.color(vweb.payments._style.fg);
						e.background(vweb.payments._style.widget_bg);
						[e.parentElement.child(0), e.parentElement.child(2)].iterate((child) => {
							child.color(vweb.payments._style.subtext_fg);
							child.background("none");
						})

						refundable_container.hide();
						refunding_container.show();
						refunded_container.hide();
					}),
				Text("Refunded")
					.font_size(style.font_size)
					.color(style.subtext_fg)
					.background("transparent")
					.padding(8, 6)
					.margin(0)
					.stretch(true)
					.text_center()
					.transition("color 350ms ease, background 350ms ease")
					.on_mouse_over((e) => {
						if (e.background() === "transparent") {
							e.color(style.fg);
						}
					})
					.on_mouse_out((e) => {
						if (e.background() === "transparent") {
							e.color(style.subtext_fg);
						}
					})
					.on_click((e) => {
						e.color(vweb.payments._style.fg);
						e.background(vweb.payments._style.widget_bg);
						[e.parentElement.child(0), e.parentElement.child(1)].iterate((child) => {
							child.color(vweb.payments._style.subtext_fg);
							child.background("none");
						})

						refundable_container.hide();
						refunding_container.hide();
						refunded_container.show();
					}),
			)
			.overflow("hidden")
			.border(1, style.border_bg)
			.border_radius(style.border_radius)
			.margin_bottom(30)
			.flex_shrink(0);

			// Assign to parent.
			this.refundable_option = option_bar.child(0);
			this.refunding_option = option_bar.child(1);
			this.refunded_option = option_bar.child(2);

			// Add elements.
			this.append(
				option_bar,
				refundable_container,
				refunding_container,
				refunded_container,
			);

			// Seperate payments.
			let currency_symbol = null;
			await [refundable_container, refunding_container, refunded_container].iterate_async_await(async (container) => {
				if (container.payments.length === 0) {
					container.append(
						VStack(
							Title("No Payments")
								.color(style.fg)
								.font_size(style.font_size - 2)
								.flex_shrink(0)
								.letter_spacing("1px")
								.text_transform("uppercase")
								.ellipsis_overflow(true)
								.margin(0)
								.padding(0)
								.assign_to_parent_as("title_e"),
							Text(`There are no ${container.title.toLowerCase()}.`)
								.color(style.subtext_fg)
								.font_size(style.font_size - 2)
								.line_height(style.font_size)
								.margin(5, 0, 0, 0)
								.padding(0)
								.assign_to_parent_as("text_e")
								.white_space("pre")
								.line_height("1.4em")
								.center(),
							Image("/static/payments/check.webp")
								.frame(30, 30)
								.margin_top(15)
								.assign_to_parent_as("success_image_e"),
						)
						.min_height(160)
						.frame(100%, 100%)
						.center()
						.center_vertical()
					);
				} else {
					await container.payments.iterate_async_await(async (payment) => {
						await payment.line_items.iterate_async_await(async (item) => {
							item.product = await vweb.payments.get_product(item.product);
						})
					})
					container.append(
						Title(container.title)
							.color(style.title_fg)
							.width("fit-content")
							.font_size(style.font_size - 2)
							.flex_shrink(0)
							.margin(0, 0, 0, 0)
							.letter_spacing("1px")
							.text_transform("uppercase")
							.ellipsis_overflow(true),

						Divider()
							.background(style.border_bg)
							.margin(10, 0, 20, 0),

						ForEach(container.payments, (payment, index) => {

							// Line items.
							const items = VStack(
								ForEach(payment.line_items, (item, index) => {
									if (currency_symbol == null) {
										currency_symbol = vweb.payments.get_currency_symbol(item.product.currency);
									}
									return [
										HStack(
											item.product.icon == null ? null : 
												Image(item.product.icon)
													.frame(25, 25)
													.flex_shrink(0)
													.margin(0, 20, 0, 0),
											VStack(
												Title(item.product.name)
													.color(style.fg)
													.font_size(style.font_size - 2)
													.line_height(style.font_size)
													.margin(0, 10, 0, 0)
													.padding(0)
													.font_weight(600)
													.ellipsis_overflow(true),
												Text(item.product.description)
													.color(style.subtext_fg)
													.font_size(style.font_size - 4)
													.line_height(style.font_size - 2)
													.margin(5, 0, 0, 0)
													.wrap(true)
													.padding(0),
											)
											.stretch(true),
											VStack(
												Text(`${currency_symbol} ${(item.total).toFixed(2)}`)
													.color(style.fg)
													.font_size(style.font_size - 4)
													.line_height(style.font_size - 2)
													.margin(0)
													.padding(0)
													.flex_shrink(0)
													.ellipsis_overflow(true),
											)
										),
										index === payment.line_items.length - 1 ? null : Divider()
											.background(style.border_bg)
											.margin(15, 0, 15, 0),						
									]
								}),
							)
							.background(style.widget_bg)
							.border_radius(style.border_radius)
							.border(1, style.border_bg)
							.padding(20)

							// Payment.
							const stack = VStack(
								HStack(
									Title("Payment")
										.color(style.fg)
										.font_size(style.font_size)
										.margin(0, 10, 0, 0)
										.padding(0)
										.wrap(false)
										.overflow("hidden")
										.text_overflow("ellipsis")
										.stretch(true),
									!container.is_refundable ? null : BorderButton("Refund")
										.border_radius(style.button_border_radius)
										.font_size(style.font_size - 4)
										.padding(7.5, 10)
										.margin(0, 5, 0, 0)
										.color(style.button_bg)
										.border_color(style.button_bg)
										.hover_brightness(...style.button_brightness)
										.font_weight("bold")
										.on_click(() => {
											document.body.appendChild(
												Popup({
													title: "Request Refund",
													text: `You are about to request a refund for payment <span style='border-radius: 7px; background: ${style.widget_bg}; padding: 1px 4px; font-size: 0.9em;'>${payment.id}</span>, do you wish to proceed?`,
													no: "No",
													yes: "Yes",
													image: "/static/payments/error.webp",
													on_yes: async () => {
														try {
															await vweb.payments.create_refund(payment);
														} catch(err) {
															console.error(err);
															vweb.payments.on_error(err);
															return null;
														}
														this.refresh().then(() => {
															this.refunding_option.click();
														})
													},
												})
												.font(window.getComputedStyle(vweb.payments._refunds_container).font)
												.widget
													.background(style.bg)
													.color(style.fg)
													.border_bottom("4px solid #E8454E")
													// .leading()
													.parent()
												.title
													.color(style.title_fg)
													.width("fit-content")
													.font_size(style.font_size)
													.flex_shrink(0)
													.margin(0, 0, 0, 10)
													.letter_spacing("1px")
													.text_transform("uppercase")
													.ellipsis_overflow(true)
													.color(style.fg)
													.center()
													.parent()
												.text
													.color(style.fg)
													.font_size(style.font_size - 2)
													.margin_left(10)
													.center()
													.parent()
												.image
													.padding(10)
													.mask_color(style.bg)
													.border_radius("50%")
													.background("#E8454E")
													.frame(40, 40)
													.box_shadow('0 0 0 4px #E8454E50')
													.parent()
												.no_button
													.padding(10, 0)
													.font_size(style.font_size)
													.background(style.widget_bg)
													.color(style.fg)
													.border(1, style.border_bg)
													.hover_brightness(...style.button_brightness)
													.box_shadow('0px 0px 5px #00000030')
													.parent()
												.yes_button
													.padding(10, 0)
													.font_size(style.font_size)
													.background("#E8454E")
													.color(style.fg)
													.border(1, style.border_bg)
													.hover_brightness(...style.button_brightness)
													.box_shadow('0px 0px 5px #00000030')
													.parent()
											);
										}),
									!container.is_refunding ? null : RingLoader()
										.frame(20, 20)
										.background(style.theme_fg)
										.margin(0, 5, 0, 0)
										.update(),
									!container.is_refunded ? null : Image("/static/payments/check.webp")
										.frame(20, 20)
										.margin(0, 5, 0, 0),
								)
								.min_height(30),
								Text(`Purchased at ${payment.timestamp.substr(0, payment.timestamp.indexOf("T"))} (${payment.id}).`)
									.color(style.subtext_fg)
									.font_size(style.font_size - 6)
									.line_height(style.font_size - 4)
									.margin(-5, 0, 10, 0)
									.wrap(true)
									.padding(0),
								items
							)
							.width(100%);

							// Elements.
							return [
								stack,
								index === container.payments.length - 1 ? null : Divider()
									.background(style.border_bg)
									.margin(20, 0, 20, 0),									
							];
						})
					)
				}
			})
			return this;
		}
	})
		
	// Append.
	this._refunds_element.refresh()
	this._refunds_container.append(this._refunds_element);
}

// Render the address element.
vweb.payments._render_billing_element = function() {
	if (this._billing_element !== undefined) { return ; }

	// Utils.
	const CreateInput = (args) => {
		return ExtendedInput(args)
			.color(this._style.fg)
			.font_size(this._style.font_size)
			.missing_color(this._style.missing_fg)
			.focus_color(this._style.theme_fg)
			.border_color(this._style.border_bg)
			.border_radius(this._style.border_radius)
			.input
				.color(this._style.input_fg)
				.parent();
	}
	const CreateSelect = (args) => {
		return ExtendedSelect(args)
			.color(this._style.fg)
			.font_size(this._style.font_size)
			.missing_color(this._style.missing_fg)
			.focus_color(this._style.theme_fg)
			.border_color(this._style.border_bg)
			.border_radius(this._style.border_radius)
			.input
				.white_space("pre")
				.color(this._style.input_fg)
				.parent();
	}

	// Create element.
	this._billing_element = Form(

		Title("Billing Details")
			.color(this._style.title_fg)
			.width("fit-content")
			.font_size(this._style.font_size - 2)
			.flex_shrink(0)
			.margin(0, 0, 0, 0)
			.letter_spacing("1px")
			.text_transform("uppercase")
			.ellipsis_overflow(true),

		Divider()
			.background(this._style.border_bg)
			.margin(10, 0, 10, 0),

		HStack(
			Text("Personal")
				.font_size(this._style.font_size)
				.color(this._style.fg)
				.background(this._style.widget_bg)
				.padding(8, 6)
				.margin(0)
				.stretch(true)
				.text_center()
				.transition("color 350ms ease, background 350ms ease")
				.on_mouse_over((e) => {
					if (e.background() === "transparent") {
						e.color(this._style.fg);
					}
				})
				.on_mouse_out((e) => {
					if (e.background() === "transparent") {
						e.color(this._style.subtext_fg);
					}
				})
				.on_click((e) => {

					e.color(this._style.fg);
					e.background(this._style.widget_bg)
					const other = e.parentElement.child(1);
					other.color(this._style.subtext_fg);
					other.background("none");

					this._billing_element.name_input.show();
					this._billing_element.name_input.required(true);
					this._billing_element.business_input.hide();
					this._billing_element.business_input.required(false);
					this._billing_element.vat_id_input.hide();
					this._billing_element.vat_id_input.required(false);
				}),
			Text("Business")
				.font_size(this._style.font_size)
				.color(this._style.subtext_fg)
				.background("transparent")
				.padding(8, 6)
				.margin(0)
				.stretch(true)
				.text_center()
				.transition("color 350ms ease, background 350ms ease")
				.on_mouse_over((e) => {
					if (e.background() === "transparent") {
						e.color(this._style.fg);
					}
				})
				.on_mouse_out((e) => {
					if (e.background() === "transparent") {
						e.color(this._style.subtext_fg);
					}
				})
				.on_click((e) => {

					e.color(this._style.fg);
					e.background(this._style.widget_bg)
					const other = e.parentElement.child(0);
					other.color(this._style.subtext_fg);
					other.background("transparent");

					this._billing_element.name_input.hide();
					this._billing_element.name_input.required(false);
					this._billing_element.business_input.show();
					this._billing_element.business_input.required(true);
					this._billing_element.vat_id_input.show();
					this._billing_element.vat_id_input.required(true);
				}),
		)
		.overflow("hidden")
		.border(1, this._style.border_bg)
		.border_radius(this._style.border_radius)
		.margin_top(10)
		.flex_shrink(0),

		CreateInput({
			label: "Full Name",
			placeholder: "John Doe",
		})
		.value(vweb.user.first_name() == null ? "" : (vweb.user.first_name() + " " + vweb.user.last_name()))
		.value("Daan van den Bergh")
		.margin_top(15)
		.required(true)
		.id("name")
		.assign_to_parent_as("name_input"),

		CreateInput({
			label: "Business Name",
			placeholder: "Company Inc.",
		})
		.margin_top(15)
		.required(false)
		.id("business")
		.hide()
		.assign_to_parent_as("business_input"),

		CreateInput({
			label: "VAT ID",
			placeholder: "VAT ID",
		})
		.margin_top(10)
		.required(false)
		.id("vat_id")
		.hide()
		.assign_to_parent_as("vat_id_input"),

		CreateInput({
			label: "Email",
			placeholder: "my@email.com",
		})
		// .value(vweb.user.email() || "")
		.value("d.vandenbergh2@gmail.com")
		.margin_top(10)
		.required(true)
		.id("email"),

		CreateInput({
			label: "Street",
			placeholder: "123 Park Avenue",
		})
		.value("Ensahlaan")
		.margin_top(10)
		.required(true)
		.id("street"),

		CreateInput({
			label: "House Number",
			placeholder: "Suite 405",
		})
		.value("25")
		.margin_top(10)
		.required(true)
		.id("house_number"),

		CreateInput({
			label: "Postal Code",
			placeholder: "10001",
		})
		.value("3723HT")
		.margin_top(10)
		.required(true)
		.id("postal_code"),

		CreateInput({
			label: "City",
			placeholder: "New York",
		})
		.value("Bilthoven")
		.margin_top(10)
		.required(true)
		.id("city"),

		CreateInput({
			label: "Province",
			placeholder: "New York",
		})
		.value("Utrecht")
		.margin_top(10)
		.required(true)
		.id("province"),

		CreateSelect({
			label: "Country",
			placeholder: "United States",
			items: vweb.payments.countries,
		})
		.on_change((_, country) => this._overview_element.calc_tax(country))
		.value("NL")
		.margin_top(10)
		.required(true)
		.id("country"),

		HStack(
			CreateInput({
				label: "Country Code",
				placeholder: "+1",
				type: PhoneNumberInput,
			})
			.value("+31")
			.max_width("fit-content")
			.margin_top(10)
			.margin_right(10)
			.required(true)
			.id("phone_country_code"),

			CreateInput({
				label: "Phone Number",
				placeholder: "123-456-7890",
				type: PhoneNumberInput,
			})
			.value("681471789")
			.margin_top(10)
			.stretch(true)
			.required(true)
			.id("phone_number"),
		)
		.width(100%)
	);

	// Append.
	this._billing_container.append(this._billing_element);
}

// Render the payment element.
// Sources: 
//  - https://developer.paddle.com/build/checkout/build-branded-inline-checkout
//  - https://developer.paddle.com/build/checkout/prefill-checkout-properties
vweb.payments._render_payment_element = async function() {
	return new Promise((resolve, reject) => {
		this._render_payment_element_resolve = resolve;
		this._render_payment_element_reject = reject;

		// Already rendered.
		if (this._payment_element !== undefined) {
			return resolve();
		}

		// Checks.
		if (this.client_key == null) {
			return reject(new Error(`No client key has been assigned to "vweb.payments.client_key".`));
		}
		if (this.cart.items.length === 0) {
			return reject(new Error("Shopping cart is empty."));
		}
		if (this._pay_id === undefined) {
			return reject(new Error(`Order is not verfied with "vweb.payments._init_order()".`));
		}

		// Check subscription or one time payment.
		let is_subscription = false;
		this.cart.items.iterate((item) => {
			if (item.is_subscription === true) {
				subscription = true;
				return false;
			}
		})

		// Initialize paddle.
		this._initialize_paddle();

		// Create element.
		this._payment_element = VStack()
			.class("checkout-container");

		// Append.
		this._payment_container.append(this._payment_element);

		// Initialize.
		let custom_data = {
			pay_id: this._pay_id,
			customer_name: this._billing_details.name,
		};
		if (vweb.user.is_authenticated()) {
			custom_data.uid = vweb.user.uid();
		}
		try {
			Paddle.Checkout.open({
				settings: {
					displayMode: "inline",
					theme: "light",
					locale: "en",
					frameTarget: "checkout-container",
					frameInitialHeight: "450",
					frameStyle: "width: 100%; min-width: 312px; background-color: transparent; border: none;",
					// successUrl: this.return_url,
					// successUrl: "http://test.vandenberghinc.com/checkout?payment_status=success",
				},
				items: this.cart.items.iterate_append((item) => {return {priceId: item.product.price_id, quantity: item.quantity}}),
				customer: {
					email: this._billing_details.email,
					address: {
						countryCode: this._billing_details.country,
						postalCode: this._billing_details.postal_code,
						region: this._billing_details.province,
						city: this._billing_details.city,
						firstLine: `${this._billing_details.street} ${this._billing_details.house_number}`,
					},
					business: {
						name: this._billing_details.business === "" ? undefined : this._billing_details.business,
						taxIdentifier: this._billing_details.vat_id === "" ? undefined : this._billing_details.vat_id,
					},
				},
				customData: custom_data,
			});
		} catch (err) {
			return reject(err);
		}

	})
}

// Render the payment element.
vweb.payments._render_processing_element = function() {

	// Already defined.
	if (this._processing_element !== undefined) {
		this._processing_element.set_processing();
		return ;
	}
	
	// Create element.
	this._processing_element = VStack(
		Title("Processing")
			.color(this._style.fg)
			.font_size(this._style.font_size - 2)
			.flex_shrink(0)
			.letter_spacing("1px")
			.text_transform("uppercase")
			.ellipsis_overflow(true)
			.margin(0)
			.padding(0)
			.assign_to_parent_as("title_e"),
		Text("Processing your payment, please wait.")
			.color(this._style.subtext_fg)
			.font_size(this._style.font_size - 2)
			.line_height(this._style.font_size)
			.margin(5, 0, 0, 0)
			.padding(0)
			.assign_to_parent_as("text_e")
			.white_space("pre")
			.line_height("1.4em")
			.center(),
		ImageMask("/static/payments/error.webp")
			.hide()
			.frame(40, 40)
			.padding(5)
			.mask_color(this._style.missing_fg)
			.margin_top(15)
			.assign_to_parent_as("error_image_e"),
		Image("/static/payments/party.webp")
			.hide()
			.frame(40, 40)
			.margin_top(15)
			.assign_to_parent_as("success_image_e"),
		RingLoader()
			.background(this._style.theme_fg)
			.frame(40, 40)
			.update()
			.margin_top(15)
			.assign_to_parent_as("loader_e"),
	)
	.padding(15, 0)
	.center()
	.center_vertical()
	.extend({
		timestamp: Date.now(),
		set_error: function (message = "The payment has failed, please check your information and try again.\n If the problem persists, contact support for assistance.") {
			// if (Date.now() - this.timestamp < 500) {
			// 	return setTimeout(() => {
			// 		this.set_error(message);
			// 	}, Date.now() - this.timestamp + 1)
			// } 
			this.loader_e.hide();
			this.error_image_e.src("/static/payments/error.webp");
			this.error_image_e.show();
			this.success_image_e.hide();
			this.title_e.text("Error")
			this.text_e.text(message);
		},
		set_cancelled: function (message = "The payment has been cancelled.") {
			// if (Date.now() - this.timestamp < 500) {
			// 	return setTimeout(() => {
			// 		this.set_cancelled(message);
			// 	}, Date.now() - this.timestamp + 1)
			// } 
			this.loader_e.hide();
			this.error_image_e.src("/static/payments/cancelled.webp");
			this.error_image_e.show();
			this.success_image_e.hide();
			this.title_e.text("Cancelled")
			this.text_e.text(message);
		},
		set_success: function (message = "The payment  has succeeded and is currently processing.\n Thank you for purchase!") {
			// if (Date.now() - this.timestamp < 500) {
			// 	return setTimeout(() => {
			// 		this.set_success(message);
			// 	}, Date.now() - this.timestamp + 1)
			// } 
			this.loader_e.hide();
			this.error_image_e.hide();
			this.success_image_e.show();
			this.title_e.text("Success")
			this.text_e.text(message);
		},
		set_processing: function (message = "Processing your payment , please wait.") {
			this.loader_e.show();
			this.error_image_e.hide();
			this.success_image_e.hide();
			this.title_e.text("Processing")
			this.text_e.text(message);
		},
	})

	// Append.
	this._processing_container.append(this._processing_element);
}

// Show the processing container.
vweb.payments._show_processing = async function(status = null) {
	
	// Select step.
	this._step = 3;
	this._steps_element.select(this._step);

	// Render the processing element.
	this._render_processing_element();

	// Set elements.
	this._order_container.hide();
	this._billing_container.hide();
	this._payment_container.hide();
	this._processing_container.show();
	this._overview_container.hide();
	this._prev_step_button.hide();

	// Update.
	if (status != null) {
		this._update_processing(status)
	}

}

// Update the processing container.
vweb.payments._update_processing = async function(status) {

	// Handle result code.
	switch (status) {
	    case "success":
	    	this._processing_element.set_success();
	    	break;
		case "processing":
	    	this._processing_element.set_processing();
	    	break;
	    case "cancelled":
	    	this._processing_element.set_cancelled();
	    	break;
	    case "error":
	    	this._processing_element.set_error();
	    	break;
	    default:
	    	console.error(`Unknown session result code "${session.resultCode}".`);
	    	this._processing_element.set_error("An unknown error has occurred.");
	    	break;
	}
}

// ---------------------------------------------------------
// Drop in.

// Initialize checkout page.
vweb.payments.style = function({
	font_size = 16,
	fg = "black",
	title_fg = "#687282",
	bg = "#FFFFFF",
	subtext_fg = "#6D6E77",
	theme_fg = "#8EB8EB",
	widget_fg = null, // by default `fg` will be used.
	widget_bg = "#00000015",
	selected_fg = null, // by default `fg` will be used.
	selected_bg = null, // by default `theme_bg` will be used.
	input_fg = "black",
	missing_fg = "#E8454E",
	button_fg = "white",
	button_bg = "blue",
	button_border_radius = 30,
	button_brightness = [1.1, 1.2],
	border_bg = "gray",
	border_radius = 10,
} = {}) {

	// Default styles.
	if (widget_fg == null) {
		widget_fg = fg;
	}
	if (selected_fg == null) {
		selected_fg = fg;
	}
	if (selected_fg == null) {
		selected_fg = fg;
	}
	if (selected_bg == null) {
		selected_bg = theme_fg;
	}

	// Save style.
	this._style = {};
	this._style.fg = fg;
	this._style.title_fg = title_fg;
	this._style.bg = bg;
	this._style.subtext_fg = subtext_fg;
	this._style.theme_fg = theme_fg;
	this._style.selected_fg = selected_fg;
	this._style.selected_bg = selected_bg;
	this._style.widget_fg = widget_fg;
	this._style.widget_bg = widget_bg;
	this._style.input_fg = input_fg;
	this._style.font_size = font_size;
	this._style.missing_fg = missing_fg;
	this._style.border_bg = border_bg;
	this._style.border_radius = border_radius;
	this._style.button_fg = button_fg;
	this._style.button_bg = button_bg;
	this._style.button_border_radius = button_border_radius;
	this._style.button_brightness = button_brightness;

	// Set css variables.
	Object.keys(this._style).iterate((key) => {
		if (typeof this._style[key] === "number") {
			document.documentElement.style.setProperty(`--vpayments_${key}`, this._style[key] + "px");
		} else {
			document.documentElement.style.setProperty(`--vpayments_${key}`, this._style[key]);
		}
	});
	document.documentElement.style.setProperty(`--vpayments_theme_fg_80`, this._style.theme_fg + "80");
	document.documentElement.style.setProperty(`--vpayments_missing_fg_80`, this._style.missing_fg + "80");
}

// Initialize checkout page.
vweb.payments.create_checkout_dropin = function({

	// The element containers.
	steps_container = null,
	order_container = null,
	billing_container = null,
	payment_container = null,
	processing_container = null,
	overview_container = null,

	// Events.
	on_error = (error) => {},
} = {}) {

	// Check args.
	if (steps_container instanceof Node === false) {
		throw Error("The \"steps_container\" must be assigned with a container node.");
	}
	if (order_container instanceof Node === false) {
		throw Error("The \"order_container\" must be assigned with a container node.");
	}
	if (billing_container instanceof Node === false) {
		throw Error("The \"billing_container\" must be assigned with a container node.");
	}
	if (payment_container instanceof Node === false) {
		throw Error("The \"payment_container\" must be assigned with a container node.");
	}
	if (processing_container instanceof Node === false) {
		throw Error("The \"processing_container\" must be assigned with a container node.");
	}
	if (overview_container instanceof Node === false) {
		throw Error("The \"overview_container\" must be assigned with a container node.");
	}
	// if (typeof refund_policy !== "string") {
	// 	throw Error("The \"refund_policy\" must be assigned with the endpoint of the refund policy.");
	// }
	// if (typeof cancellation_policy !== "string") {
	// 	throw Error("The \"cancellation_policy\" must be assigned with the endpoint of the cancellation policy.");
	// }

	// Args.
	this._steps_container = steps_container;
	this._order_container = order_container;
	this._billing_container = billing_container.hide();
	this._payment_container = payment_container.hide();
	this._processing_container = processing_container.hide();
	this._overview_container = overview_container;
	// this._refund_policy = refund_policy;
	// this._cancellation_policy = cancellation_policy;

	// Events.
	this.on_error = on_error;

	// Check style.
	if (this._style === undefined) {
		this.style();
	}

	// Other attributes.
	this._step = 0;

	// Render the steps element.
	this._render_steps_element();

	// When the user was redirected the url params are defined, if so only render the processing view.
	if (vweb.utils.url_param("payment_status", null) != null) {
		this._show_processing(vweb.utils.url_param("payment_status", null))
	}

	// No redirect.
	else {

		// Render the overview element.
		this._render_overview_element();

		// Render the order element.
		// Must be rendered after the overview element is rendered.
		this._render_order_element();

	}
}

// Initialize refund page.
vweb.payments.create_refunds_dropin = function({

	// The element containers.
	refunds_container = null,

	// Refundable settings.
	days_refundable = 30,

	// Events.
	on_error = (error) => {},
} = {}) {

	// Check args.
	if (refunds_container instanceof Node === false) {
		throw Error("The \"refunds_container\" must be assigned with a container node.");
	}

	// Args.
	this._refunds_container = refunds_container;
	this._days_refundable = days_refundable;
	
	// Events.
	this.on_error = on_error;

	// Check style.
	if (this._style === undefined) {
		this.style();
	}

	// Other attributes.
	this._step = 0;

	// Render the order element.
	this._render_refunds_element();
}

// ---------------------------------------------------------
// Backend API.

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
			return reject(`Product "${id}" does not exist.`);
		}
		resolve(product);
	})
}

// Fetch a payment object by id.
/*  @docs:
    @title: Get Payment.
    @desc: Get a payment by id.
    @param:
        @name: id
        @required: true
        @type: string
        @desc: The id of the payment.
*/
vweb.payments.get_payment = async function(id) {
	return vweb.utils.request({
		method: "GET",
		url: "/vweb/payments/payment",
		data: {
			id: id,
		}
	})
}

// Get all payments.
/*  @docs:
    @title: Get Refunded Payments.
    @desc:
        Get all payments of the authenticated user

        All failed payments are no longer stored in the database.
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
vweb.payments.get_payments = async function({
    days = 30,
    limit = null,
    status = null,
} = {}) {
	return vweb.utils.request({
		method: "GET",
		url: "/vweb/payments/payments",
		data: {
			days,
			limit,
			status,
		}
	})
}

// Get refundable payments.
/*  @docs:
    @title: Get Refundable Payments.
    @desc: Get all payments that are refundable for the authenticated user.
    @param:
        @name: days
        @type: number
        @desc: Retrieve payments from the last amount of days.
    @param:
        @name: limit
        @type: number
        @desc: Limit the amount of response payment objects.
*/
vweb.payments.get_refundable_payments = async function({
    days = 30,
    limit = null,
} = {}) {
	return vweb.utils.request({
		method: "GET",
		url: "/vweb/payments/payments/refundable",
		data: {
			days,
			limit,
		}
	})
}

// Get refunded payments.
/*  @docs:
    @title: Get Refunded Payments.
    @desc: Get all successfully refunded payments of the authenticated user.
    @param:
        @name: days
        @type: number
        @desc: Retrieve payments from the last amount of days.
    @param:
        @name: limit
        @type: number
        @desc: Limit the amount of response payment objects.
*/
vweb.payments.get_refunded_payments = async function({
    days = 30,
    limit = null,
} = {}) {
	return vweb.utils.request({
		method: "GET",
		url: "/vweb/payments/payments/refunded",
		data: {
			days,
			limit,
		}
	})
}

// Get refunding payments.
/*  @docs:
    @title: Get Refunding Payments.
    @desc: Get all payments that are currently in the refunding process of the authenticated user.
    @param:
        @name: days
        @type: number
        @desc: Retrieve payments from the last amount of days.
    @param:
        @name: limit
        @type: number
        @desc: Limit the amount of response payment objects.
*/
vweb.payments.get_refunding_payments = async function({
    days = null,
    limit = null,
} = {}) {
	return vweb.utils.request({
		method: "GET",
		url: "/vweb/payments/payments/refunding",
		data: {
			days,
			limit,
		}
	})
}

// Create refund.
/*  @docs:
    @title: Refund Payment.
    @desc: Refund a payment based on the payment id for the authenticated user.
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
    @param:
        @name: reason
        @type: string
        @desc: The refund reason.
*/
vweb.payments.create_refund = async function(payment, line_items = null, reason = "refund") {
	return vweb.utils.request({
		method: "POST",
		url: "/vweb/payments/refund",
		data: {
			payment,
			line_items,
			reason,
		}
	})
}

// Cancel subscription.
/*  @docs:
    @title: Cancel Subscription.
    @desc: Cancel a subscription based on the product id.
    @warning: Cancelling a subscription will also cancel all other subscriptions that were created by the same payment request.
    @param:
        @name: product
        @required: true
        @type: string
        @desc: The product id.
*/
vweb.payments.cancel_subscription = async function(product) {
	return vweb.utils.request({
		method: "DELETE",
		url: "/vweb/payments/subscription",
		data: {
			product,
		}
	})
}

// Cancel subscription.
/*  @docs:
    @title: Cancel Subscription by Payment.
    @desc: Cancel a subscription based on the retrieved payment object or id.
    @warning: Cancelling a subscription will also cancel all other subscriptions that were created by the same payment request.
    @param:
        @name: payment
        @required: true
        @type: string, object
        @desc: The payment id or the retrieved payment object.
*/
vweb.payments.cancel_subscription_by_payment = async function(payment) {
	return vweb.utils.request({
		method: "DELETE",
		url: "/vweb/payments/subscription_by_payment",
		data: {
			payment,
		}
	})
}

// Is subscribed.
/*  @docs:
    @title: Is Subscribed.
    @desc: Check if the authenticated user is subscribed to a product plan.
    @param:
        @name: product
        @required: true
        @type: string
        @desc: The product id.
*/
vweb.payments.is_subscribed = async function(product) {
	return vweb.utils.request({
		method: "GET",
		url: "/vweb/payments/subscribed",
		data: {
			product,
		}
	})
}

// Get subscriptions.
/*  @docs:
    @title: Get Subscriptions
    @desc: Get the active subscriptions of the authenticated user.
*/
vweb.payments.get_subscriptions = async function(product) {
	return vweb.utils.request({
		method: "GET",
		url: "/vweb/payments/subscriptions",
	})
}

// ---------------------------------------------------------
// Shopping cart.

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