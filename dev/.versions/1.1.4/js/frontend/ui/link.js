/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Link.
@constructor_wrapper
@register_element
class AnchorElement extends CreateVElementClass({
	type: "Anchor",
	tag: "a",
	default_style: {
		"font-family": "inherit",
		"font-size": "inherit",
		"color": "inherit",
		"text-decoration": "none",
		"text-underline-position": "none",
		"cursor": "pointer",
		"outline": "none",
		"border": "none",
	},
}) {
	
	// Constructor.
	constructor(href, alt, text) {
		
		// Initialize base class.
		super();
		
		// Set href.
		this.href(href);
		
		// Set alt.
		this.alt(alt);

		// Set text.
		this.text(text ?? alt);
	}		
}

// Link.
@constructor_wrapper
@register_element
class LinkElement extends CreateVElementClass({
	type: "Link",
	tag: "a",
	default_style: {
		"font-family": "inherit",
		"font-size": "1em",
		"color": "rgb(85, 108, 214)",
		"text-decoration": "underline",
		"text-underline-position": "auto",
		"cursor": "pointer",
	},
}) {
	
	// Constructor.
	constructor(text, href) {
		
		// Initialize base class.
		super();

		// Set text.
		this.text(text);
		
		// Set href.
		this.href(href);
		
	}		
}
