/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Scroller.
@constructor_wrapper
@register_element
class ZStackElement extends CreateVElementClass({
	type: "ZStack",
	tag: "div",
	default_style: {
		// "position": "relative",
		"margin": "0px",
		"padding": "0px",
		"display": "grid",
		// "text-align": "start",
		"outline": "none", // otherwise the focus border might show up inside an animation when the href # hashtag id is loaded.
		"border": "none", // otherwise the focus border might show up inside an animation when the href # hashtag id is loaded.
	},
}) {
	
	// Constructor.
	constructor(...children) {
		
		// Initialize base class.
		super();
		
		// Add children.
		this.zstack_append(...children);

	}
	
	// Override append.
	append(...children) {
		return this.zstack_append(...children);
	}
	
}