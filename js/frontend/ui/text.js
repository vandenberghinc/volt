/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// Text.
@vweb_constructor_wrapper
@vweb_register_element
class TextElement extends CreateVElementClass({
	type: "Text",
	tag: "p",
	default_style: {
		"margin": "0px 0px 0px 0px",
		"padding": "2.5px",
		"padding": "2.5px",
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
		this.inner_html(text);
	}
		
}