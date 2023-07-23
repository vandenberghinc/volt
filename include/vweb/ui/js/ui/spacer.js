/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// Scroller.
class Spacer extends VElement {
	
	// Default vars.
	static s_type = "Spacer";
	static s_tag = "div";

	// Default styling.
	static default_styling = {
		"margin": "0px",
		"padding": "0px",
		"flex": "1",
		"flex-grow": "1",
		"background": "#00000000",
		"filter": "opacity(0)",
		"justify-content": "stretch",
	};
	
	// Constructor.
	constructor() {
		
		// Initialize base class.
		super(Spacer.s_type, Spacer.s_tag, Spacer.default_styling);
		
	}
	
}

// Register custom type.
vweb.utils.register_custom_type(Spacer);