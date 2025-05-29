/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Title.
@constructor_wrapper
@register_element
class TitleElement extends CreateVElementClass({
	type: "Title",
	tag: "h1",
	default_style: {
		"margin": "0px 0px 0px 0px",
		"color": "inherit",
		"white-space": "wrap",
		"text-align": "inherit",
		"font-weight": "700", // for safari since it inherits HTMLElement only.
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

// Subtitle.
@constructor_wrapper
@register_element
class SubtitleElement extends CreateVElementClass({
	type: "Subtitle",
	tag: "h1",
	default_style: {
		"margin": "0px 0px 0px 0px",
		"color": "inherit",
		"white-space": "wrap",
		"text-align": "inherit",
		"font-weight": "700", // for safari since it inherits HTMLElement only.
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