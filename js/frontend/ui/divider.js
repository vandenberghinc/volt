/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

@vweb_constructor_wrapper
const DividerElement = CreateVElementClass({
	type: "Divider",
	tag: "div",
	default_style: {
		"margin": "0px",
		"padding": "0px",
		"width": "100%",
		"height": "1px",
		"min-height": "1px",
		"background": "black",
	},
});
