/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Button.
@constructor_wrapper
@register_element
class ButtonElement extends CreateVElementClass({
	type: "Button",
	tag: "a",
	// tag: "button",
	default_style: {
		"margin": "0px 0px 0px",
		"padding": "5px 10px 5px 10px",
		"outline":"none",
		"border":"none",
		"border-radius": "10px",
		"cursor": "pointer",
		"text-decoration": "none",
		"color": "inherit",
		"text-align": "center",
		"display": "grid",
		"align-items": "center",
		"white-space": "nowrap",
		"user-select": "none",
		"text-decoration": "none",
	},
	default_events: {
		"onmousedown": function() { this.style.filter = "brightness(80%)"; },
		"onmouseover": function() { this.style.filter = "brightness(90%)"; },
		"onmouseup": function() { this.style.filter = "brightness(100%)"; },
		"onmouseout": function() { this.style.filter = "brightness(100%)"; },
	},
}) {

	// Constructor.
	constructor(text) {
		
		// Initialize base classes.
		super();
		
		// Set text.
		this.inner_html(text);
	}		
}

// BorderButton.
// Supports a gradient color for the border combined with border radius.
// Warning: this class is still experimental and may be subject to future change.
@constructor_wrapper
@register_element
class BorderButtonElement extends CreateVElementClass({
	type: "BorderButton",
	tag: "a",
	// tag: "button",
	default_style: {
		"margin": "0px 0px 0px 0px",
		"display": "inline-block",
		"color": "inherit",
		"text-align": "center",
		"cursor": "pointer",
		"text-decoration": "none",
		"position": "relative",
		"z-index": 0,
		"background": "none",
		"user-select": "none",
		"outline":"none",
		"border":"none",
		"text-decoration": "none",
		// Custom.
		"--child-color": "black",
		"--child-background": "black",
		"--child-border-width": "2px",
		"--child-border-radius": "10px",
		"--child-padding": "5px 10px 5px 10px",
	},
	default_events: {
		"onmousedown": function() { this.style.filter = "brightness(80%)"; },
		"onmouseover": function() { this.style.filter = "brightness(90%)"; },
		"onmouseup": function() { this.style.filter = "brightness(100%)"; },
		"onmouseout": function() { this.style.filter = "brightness(100%)"; },
	},
}) {
	
	// Constructor.
	constructor(text) {
		
		// Initialize base classes.
		super();
		
		// Set default styling.
		// let styles = { ...BorderButton.default_style };
		// delete styles["--child-color"];
		// delete styles["--child-background"];
		// delete styles["--child-border-width"];
		// delete styles["--child-padding"];
		// delete styles["--child-background-image"];
		// delete styles["--child-background-clip"];
		// delete styles["--child-webkit-background-clip"];
		// this.styles(styles);

		// Border child so it can support border gradients.
		this.border_e = VElement()
			.content("")
			.position("absolute")
			// .z_index(-1)
			.inset(0)
			.padding(BorderButtonElement.default_style["--child-border-width"])
			.border_radius(BorderButtonElement.default_style["--child-border-radius"])
			.background(BorderButtonElement.default_style["--child-background"])
			.mask("linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)")
			.mask_composite("exclude")
			// .mask_composite((navigator.userAgent.includes("Firefox") || navigator.userAgent.includes("Mozilla")) ? "exclude" : "xor")
			.styles({
				"-webkit-mask": "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
				"-webkit-mask-composite": (navigator.userAgent.includes("Firefox") || navigator.userAgent.includes("Mozilla")) ? "exclude" : "xor",
			})

		// Text child.
		// do not use a Text object since inheritance of text styling is required.
		this.text_e = VElement()
			.color(BorderButtonElement.default_style["--child-color"])
			.append(text);
		if (BorderButtonElement.default_style["--child-color"] == "transparent") {
			this.text_e.style.backgroundImage = BorderButtonElement.default_style["--child-background-image"];
	    	this.text_e.style.backgroundClip = BorderButtonElement.default_style["--child-background-clip"];
	    	this.text_e.style["-webkit-background-clip"] = BorderButtonElement.default_style["--child-webkit-background-clip"];
	    }

	    // Append.
		this.append(this.border_e, this.text_e);
		
	}

	// Set the gradient color.
	gradient(value) {
		if (value == null) {
			return this.border_e.background();
		}
		this.border_e.background(value);
		return this;
	}

	// Set the border color.
	border_color(value) {
		if (value == null) {
			return this.border_e.background();
		}
		this.border_e.background(value);
		return this;
	}

	// Set the border width.
	border_width(value) {
		if (value == null) {
			return this.border_e.padding();
		}
		this.border_e.padding(value);
		return this;
	}

	// Set the border radius.
	border_radius(value) {
		if (value == null) {
			return this.border_e.border_radius();
		}
		super.border_radius(value);
		this.border_e.border_radius(value);
		return this;
	}

	// Set color of child text so the background of the parent can be set when using a gradient color.
	color(value) {
		if (value == null) {
			return this.text_e.color();
		}
		this.text_e.color(value);
		return this;
	}

	// Get the styling attributes.
	// The values of the children that may have been changed by the custom funcs should be added.
	styles(style_dict) {
		if (style_dict == null) {
			let styles = super.styles(null);
			styles["--child-background"] = this.border_e.background();
			styles["--child-border-width"] = this.border_e.padding();
			styles["--child-border-radius"] = this.border_e.border_radius();
			styles["--child-color"] = this.text_e.color();
			styles["--child-background-image"] = this.text_e.style.backgroundImage;
			styles["--child-background-clip"] = this.text_e.style.backgroundClip;
			styles["--child-webkit-background-clip"] = this.text_e.style["-webkit-background-clip"];
			return styles;
		} else {
			return super.styles(style_dict);
		}
	}

	// Set text.
	text(val) {
		if (val == null) { return this.text_e.text(); }
		this.text_e.text(val);
		return this;
	}

	// Transition border color.
	transition_border_color(val) {
		if (val == null) { return this.border_e.transition(); }
		this.border_e.transition(typeof val !== "string" ? val : val.replace("border-color ", "background "));
		return this;
	}
		
}

// Loader button.
// Warning: you should not use function "LoaderButton.loader.hide() / LoaderButton.loader.show()" use "LoaderButton.hide_loader() / LoaderButton.show_loader()" instead.
// Warning: This class is still experimental and may be subject to future change.
@constructor_wrapper
@register_element
class LoaderButtonElement extends AnchorHStackElement {

	// Default styling.
	// static default_style = Object.assign({}, AnchorHStackElement.default_style, {
	static default_style = {
		...AnchorHStackElement.default_style,
		"margin": "0px",
		"padding": "12.5px 10px 12.5px 10px",
		"border-radius": "25px",
		"cursor": "pointer",
		"background": "black",
		"color": "inherit",
		"font-size": "16px",
		"user-select": "none",
		"text-decoration": "none",
		// Custom.
		"--loader-width": "20px",
		"--loader-height": "20px",
	};

	// Constructor.
	constructor(text = "", loader = RingLoader) {

		// Initialize base classes.
		super();

		// Set element type.
        this.element_type = "LoaderButton";

		// Set default styling.
		this.styles(LoaderButtonElement.default_style);

		// Set style.
		this.wrap(false);
		this.center();
		this.center_vertical()

		// Children.
		this.loader = loader()
			.frame(LoaderButtonElement.default_style["--loader-width"], LoaderButtonElement.default_style["--loader-height"])
			.background("white")
			.update()
			.hide()
			.parent(this)
		this.text = VElement() // use div to inherit text styles.
			.text(text)
			.margin(0)
			.padding(0)
			.parent(this);
		
		// Add children.
		this.append(this.loader, this.text);

	}

	// Get the styling attributes.
	// The values of the children that may have been changed by the custom funcs should be added.
	styles(style_dict) {
		if (style_dict == null) {
			let styles = super.styles();
			styles["--loader-width"] = this.loader.style.width || "20px";
			styles["--loader-height"] = this.loader.style.height || "20px";
			return styles;
		} else {
			return super.styles(style_dict);
		}
	}

	// Set default since it inherits AnchorHStackElement.
	set_default() {
		return super.set_default(LoaderButtonElement);
	}

	// Show the loader and disable the button on click event.
	show_loader() {
		this.disable();
		this.text.hide();
		this.loader.update();
		this.loader.show();
		return this;
	}
	start() { return this.show_loader(); }

	// Hide the loader and enable the button on click event.
	hide_loader() {
		this.enable();
		this.loader.hide();
		this.text.show();
		return this;
	}
	stop() { return this.hide_loader(); }

}
