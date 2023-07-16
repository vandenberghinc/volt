/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// Scroller.
class Divider extends Element {
	
	// Default styling.
	static default_styling = {
		"margin": "0px",
		"padding": "0px",
		"width": "100%",
		"height": "1px",
		"min-height": "1px",
		"background": "black",
	};
	
	// Constructor.
	constructor() {
		
		// Initialize base class.
		super("Divider", "div");
		
		// Set default styling
		this.style(Divider.default_styling);
		
	}
	
}
