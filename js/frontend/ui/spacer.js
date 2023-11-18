/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// Spacer.
@constructor_wrapper
@register_element
class SpacerElement extends CreateVElementClass({
	type: "Spacer",
	tag: "div",
	default_style: {
		"margin": "0px",
		"padding": "0px",
		"flex": "1",
		"flex-grow": "1",
		"background": "#00000000",
		"filter": "opacity(0)",
		"justify-content": "stretch",
	},
}) {
	constructor() { super(); }	
}