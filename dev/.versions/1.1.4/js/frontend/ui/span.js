/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Text.
@constructor_wrapper
@register_element
class SpanElement extends CreateVElementClass({
	type: "Span",
	tag: "span",
	default_style: {},
}) {
	
	// Constructor.
	constructor(inner_html) {
		
		// Initialize base class.
		super();
	
		// Set text.
		this.inner_html(inner_html);
	}
		
}