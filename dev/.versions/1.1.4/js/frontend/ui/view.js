/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Scroller.
@constructor_wrapper
@register_element
class ViewElement extends CreateVElementClass({
	type: "View",
	tag: "div",
	default_style: {
		"position": "absolute",
		"top": "0",
		"right": "0",
		"bottom": "0",
		"left": "0",
		"padding": "0px",
		"display": "block",
		"overflow": "hidden",
		"overflow-y": "none",
		"background": "none",
		"display": "flex", // to support vertical spacers.
		// "text-align": "start",
		"align-content": "flex-start", // align items at start, do not stretch / space when inside HStack.
		"flex-direction": "column",
	},
}) {
	
	// Constructor.
	constructor(...children) {
		
		// Initialize base class.
		super();

		// Append children.
		this.append(...children);

	}
	
}
