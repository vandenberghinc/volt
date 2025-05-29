/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// VStack.
@constructor_wrapper
@register_element
class FrameElement extends CreateVElementClass({
	type: "Frame",
	tag: "div",
	default_style: {
		// "position": "relative",
		"margin": "0px",
		"padding": "0px",
		// "clear": "both",
		"display": "block",
		"overflow": "visible",
	},
}) {
	
	// Constructor.
	constructor(...children) {
		
		// Initialize base class.
		super();

		// Add children.
		this.append(...children);

	}
		
}

// VStack.
@constructor_wrapper
@register_element
class VStackElement extends CreateVElementClass({
	type: "VStack",
	tag: "div",
	default_style: {
		// "position": "relative",
		"margin": "0px",
		"padding": "0px",
		// "clear": "both",
		"display": "flex", // to support vertical spacers.
		"overflow": "visible",
		// "flex": "1", // disabled to support horizontal spacers in VStacks.
		"align-content": "flex-start", // align items at start, do not stretch / space when inside HStack.
		// "align-items": "flex-start", // otherwise the children automatically expand width to match the vstacks width.
		"flex-direction": "column",
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
		this.append(...children);

	}
		
}

// AnchorVStack.
@constructor_wrapper
@register_element
class AnchorVStackElement extends CreateVElementClass({
	type: "AnchorVStack",
	tag: "a",
	default_style: {
		// "position": "relative",
		"margin": "0px",
		"padding": "0px",
		// "clear": "both",
		"display": "flex", // to support vertical spacers.
		"overflow": "visible",
		// "flex": "1", // disabled to support horizontal spacers in VStacks.
		"align-content": "flex-start", // align items at start, do not stretch / space when inside HStack.
		// "align-items": "flex-start", // otherwise the children automatically expand width to match the vstacks width.
		"flex-direction": "column",
		// "text-align": "start",
		"outline": "none", // otherwise the focus border might show up inside an animation when the href # hashtag id is loaded.
		"border": "none", // otherwise the focus border might show up inside an animation when the href # hashtag id is loaded.
		"text-decoration": "none",

		// After extending VStack.
		"color": "inherit", // inherit colors since <a> does not have that and a <div> does.
	},
}) {
	
	// Constructor.
	constructor(...children) {
		
		// Initialize base class.
		super();

		// Add children.
		this.append(...children);

	}
		
}
