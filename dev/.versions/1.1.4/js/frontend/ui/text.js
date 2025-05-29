/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Text.
@constructor_wrapper
@register_element
class TextElement extends CreateVElementClass({
	type: "Text",
	tag: "p",
	default_style: {
		"margin": "0px 0px 0px 0px",
		"padding": "0", // 2.5px
		"font-size": "20px",
		"color": "inherit",
		"text-align": "inherit",
		"white-space": "wrap",
	},
}) {
	
	// Constructor.
	constructor(text) {
		
		// Initialize base class.
		super();
	
		// Set text.
		this.text(text); // do not use inner_html since the text might contain "<" etc.
	}
		
}