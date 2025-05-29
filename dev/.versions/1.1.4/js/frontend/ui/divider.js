/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Divider.
@constructor_wrapper
@register_element
class DividerElement extends CreateVElementClass({
	type: "Divider",
	tag: "div",
	default_style: {
		"margin": "0px",
		"padding": "0px",
		"width": "100%",
		"height": "1px",
		"min-height": "1px",
		// "background": "black",
	},
}) {
	constructor() { super(); }	
}