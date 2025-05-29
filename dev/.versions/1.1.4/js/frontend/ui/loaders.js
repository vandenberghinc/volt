/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// RingLoader.
// - The width and height must be in pixels.
@constructor_wrapper
@register_element
class RingLoaderElement extends CreateVElementClass({
	type: "RingLoader",
	tag: "div",
	default_style:  {
		"width": "80px",
		"height": "80px",
		"--child-background": "black",
		"--border-width-factor": "1",
		"display": "inline-block",
		"position": "relative",
	},
}) {
	
	// Constructor.
	constructor() {
		
		// Initialize base class.
		super();

		// Set element type.
        this.element_type = "RingLoader";

		// Set default.
		this.update();
		
	}

	// Overwrite the set background function.
	background(value) {
        if (value == null) { return this.style["--child-background"]; }
        this.style["--child-background"] = value;
        return this;
    }

    // Border width by factor.
    border_width_factor(value) {
    	if (value == null) { return this.style["--border-width-factor"]; }
        this.style["--border-width-factor"] = value;
        return this;
    }
	
	// Update.
	// Needs to be called after initialing or changing the loader.
	update() {
		this.remove_children();
		const width = parseFloat(this.style.width.replace("px", ""));
		const height = parseFloat(this.style.height.replace("px", ""));
		const background = this.style["--child-background"];
		const border_width_factor = parseFloat(this.style["--border-width-factor"])
		const children_style = {
			"box-sizing": "border-box",
			"display": "block",
			"position": "absolute",
			"width": `${width * (64.0 / 80.0)}px`,
			"height": `${height * (64.0 / 80.0)}px`,
			"margin": `${width * (8.0 / 80.0)}px`,
			// "border": `${width * (8.0 / 80.0)}px solid ${background}`,
			"border": `${width * (8.0 / 80.0 * border_width_factor)}px solid ${background}`,
			"border-color": `${background} transparent transparent transparent`,
			"border-radius": "50%",
			"animation": "RingLoader 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite",
		};
		for (let i = 0; i < 4; i++) {
			let e = document.createElement("div");
			for (let attr in children_style) {
				e.style[attr] = children_style[attr];
			}
			if (i == 1) {
				e.style.animationDelay = "-0.45s";
			} else if (i == 2) {
				e.style.animationDelay = "-0.3s";
			} else if (i == 3) {
				e.style.animationDelay = "-0.15s";
			}
			this.append(e);
		}
		return this;
	}
}