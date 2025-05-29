/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Image.
@constructor_wrapper
@register_element
class ImageElement extends CreateVElementClass({
	type: "Image",
	tag: "img",
	default_style: {
		"margin": "0px",
		"padding": "0px",
		"object-fit": "cover",
	},
}) {

	// Static attributes.
	static default_alt = null;
	
	// Constructor.
	constructor(src, alt) {
		
		// Initialize base class.
		super();

		// Safari does not render images correctly for custom elements.
		if (vweb.is_safari) {
			this.attachShadow({ mode: 'open' });
			this._e = document.createElement("img");
			this._e.style.objectFit = "cover";
			this._e.style.width = "100%";
			this._e.style.height = "100%";
			this.shadowRoot.appendChild(this._e);
			this.position("relative"); // for img width height 100%
			this.overflow("hidden"); // for border radius.

			// Set resize event otherwise when the item resizes the shadow image does not.
			// this.on_resize(() => {
			// 	this._e.style.width = this.style.width;
			// 	this._e.style.height = this.style.height;
			// 	// this._e.style.width = "100%";
			// 	// this._e.style.height = "100%";
			// })
		}
	
		// Set src.
		this.src(src);

		// Set alt.
		if (alt != null) {
			this.alt(alt);
		} else if (ImageElement.default_alt != null) {
			this.alt(ImageElement.default_alt);
		}

		// Set default aspect ratio.
		if (src) {
			const aspect_ratio = vweb.static.aspect_ratio(src);
			if (aspect_ratio != null) {
				this.aspect_ratio(aspect_ratio)	
			} else if (!vweb.production && Object.keys(vweb.static.aspect_ratios).length > 0 && src.charAt(0) === "/") {
				console.error(new Error(`[vweb development] Unable to find the aspect ratio for source "${src}".`))
			}
			
		}
	}

	// Set the current element as the default.
	set_default() {
		super.set_default(ImageElement);
		const alt = this.alt();
		if (alt != null) {
			ImageElement.default_alt = alt;
		}
		return this;
	}

	// Source, purely for safari.
	src(value) {
		if (this._e === undefined) {
			return super.src(value);
		}
		if (value == null) {
			return this._e.src;
		}
		this._e.src = src;
		return this;
	}

	// Alt, purely for safari.
	alt(value) {
		if (this._e === undefined) {
			return super.alt(value);
		}
		if (value == null) {
			return this._e.alt;
		}
		this._e.alt = value;
		return this;
	}

	// Completed, purely for safari.
	completed(value) {
		if (this._e === undefined) {
			return super.completed;
		}
		return this._e.completed;
	}

	// Source, purely for safari.
	src(value) {
		if (this._e === undefined) {
			return super.src(value);
		}
		if (value == null) {
			return this._e.src;
		}
		this._e.src = value;
		return this;
	}

	// Height, purely for safari.
	height(value, check_attribute = true) {
		if (this._e === undefined) {
			return super.height(value, check_attribute);
		}
		if (value == null) {
			return this._e.height;
		}
		// Assign percentage values to the root.
		if (typeof value === "string" && value.includes("%")) {
			super.height(value, false); // deprecated 
		} else {
			this._e.style.height = this.pad_numeric(value, "px");
			this._e.height = this.pad_numeric(value, "");
		}
		return this;
	}
	min_height(value) {
		if (this._e === undefined) {
			return super.min_height(value);
		}
		if (value == null) {
			return this._e.style.minHeight;
		}
		// Assign percentage values to the root.
		if (typeof value === "string" && value.includes("%")) {
			super.min_height(value);
		} else {
			this._e.style.minHeight = this.pad_numeric(value, "px");
		}
		return this;
	}
	max_height(value) {
		if (this._e === undefined) {
			return super.max_height(value);
		}
		if (value == null) {
			return this._e.style.maxHeight;
		}
		// Assign percentage values to the root.
		if (typeof value === "string" && value.includes("%")) {
			super.max_height(value);
		} else {
			this._e.style.maxHeight = this.pad_numeric(value, "px");
		}
		return this;
	}

	// Width, purely for safari.
	width(value, check_attribute = true) {
		if (this._e === undefined) {
			return super.width(value, check_attribute);
		}
		if (value == null) {
			return this._e.width;
		}
		// Assign percentage values to the root.
		if (typeof value === "string" && value.includes("%")) {
			super.width(value, false);
		} else {
			this._e.style.width = this.pad_numeric(value, "px");
			this._e.width = value;
		}
		return this;
	}
	min_width(value) {
		if (this._e === undefined) {
			return super.min_width(value);
		}
		if (value == null) {
			return this._e.style.minWidth;
		}
		// Assign percentage values to the root.
		if (typeof value === "string" && value.includes("%")) {
			super.min_width(value);
		} else {
			this._e.style.minWidth = this.pad_numeric(value, "px");
		}
		return this;
	}
	max_width(value) {
		if (this._e === undefined) {
			return super.max_width(value);
		}
		if (value == null) {
			return this._e.style.maxWidth;
		}
		// Assign percentage values to the root.
		if (typeof value === "string" && value.includes("%")) {
			super.max_width(value);
		} else {
			this._e.style.maxWidth = this.pad_numeric(value, "px");
		}
		return this;
	}

	// Loading "eager" or "lazy", purely for safari.
	loading(value) {
		if (this._e === undefined) {
			if (value == null) {
				return this.loading;
			}
			this.loading = value;
			return this;
		}
		if (value == null) {
			return this._e.loading;
		}
		this._e.loading = value;
		return this;
	}		
}
// function Image(...args) {
// 	if (vweb.is_safari) {
// 		const e = document.createElement(ImageElement.element_tag, {is: "v-" + ImageElement.name.toLowerCase()})
// 		console.log("E", e.prototype);
// 		e._init(...args);
// 		return e;
// 	} else {
// 		return new ImageElement(...args);
// 	}
// }

// AnchorImage.
@constructor_wrapper
@register_element
class AnchorImageElement extends AnchorElement {

	// Default styling.
	static default_style = {
		...AnchorElement.default_style,
	};

	// Constructor.
	constructor(href, src, alt) {

		// Initialize base classes.
		super();

		// Href.
		this.href(href);

		// image.
		this.image = Image(src, alt)
			.parent(this);

		// Append.
		this.append(this.image);

	}

	// Set default since it inherits AnchorElement.
	set_default() {
		return super.set_default(AnchorImage);
	}

	// ImageElement alias functions.
	src(value)				{ if (value == null) { return this.image.src(); } this.image.src(value); return this; }
	alt(value)				{ if (value == null) { return this.image.alt(); } this.image.alt(value); return this; }
	completed(value)		{ if (value == null) { return this.image.completed(); } this.image.completed(value); return this; }
	src(value)				{ if (value == null) { return this.image.src(); } this.image.src(value); return this; }
	height(value, ...args) 	{ if (value == null) { return this.image.height(); } this.image.height(value, ...args); return this; }
	min_height(value)		{ if (value == null) { return this.image.min_height(); } this.image.min_height(value); return this; }
	max_height(value)		{ if (value == null) { return this.image.max_height(); } this.image.max_height(value); return this; }
	width(value, ...args) 	{ if (value == null) { return this.image.width(); } this.image.width(value, ...args); return this; }
	min_width(value)		{ if (value == null) { return this.image.min_width(); } this.image.min_width(value); return this; }
	max_width(value)		{ if (value == null) { return this.image.max_width(); } this.image.max_width(value); return this; }
	loading(value)			{ if (value == null) { return this.image.loading(); } this.image.loading(value); return this; }
}


// ImageMask.
@constructor_wrapper
@register_element
class ImageMaskElement extends CreateVElementClass({
	type: "ImageMask",
	tag: "div",
	default_style: {
		"margin": "0px",
		"padding": "0px",
		"object-fit": "cover",
		"display": "inline-block",

		// Anchor.
		"font-family": "inherit",
		"font-size": "inherit",
		"color": "inherit",
		"text-decoration": "none",
		"text-underline-position": "none",
		"outline": "none",
		"border": "none",
	},
}) {
	
	// Constructor.
	constructor(src) {
		
		// Initialize base class.
		super();
	
		// Append child.
		this.mask_child = VStack()
			.parent(this)
			// .position(0, 0, 0, 0)
			.width("100%")
			.height("100%")
			.background("black")
		if (src != null) {
			this.mask_child.mask("url('" + src + "') no-repeat center/contain");
		}
		// this.position("relative");
		this.append(this.mask_child);

		// Set src.
		this.src(src);

		// Set default aspect ratio.
		if (src) {
			const aspect_ratio = vweb.static.aspect_ratio(src);
			if (aspect_ratio != null) {
				this.aspect_ratio(aspect_ratio)	
			} else if (!vweb.production && Object.keys(vweb.static.aspect_ratios).length > 0 && src.charAt(0) === "/") {
				console.error(new Error(`[vweb development] Unable to find the aspect ratio for source "${src}".`))
			}
			
		}
	}

	// Image color.
	mask_color(value) {
		if (value == null) {
			return this.mask_child.style.background;
		}
		this.mask_child.style.background = value;
		return this;
	}
	color(value) {
		return this.mask_color(value);
	}

	// Transition mask.
	transition_mask(value) {
		if (value == null) { return this.mask_child.transition(); }
		this.mask_child.transition(value)
		return this;
	}

	// Override src.
	src(value) {
		if (value == null) {
			return this._src;
		}
		this.mask_child.mask("url('" + value + "') no-repeat center/contain");
		this._src = value;
		return this;
	}

	// Override mask.
	mask(value) {
		if (value == null) {
			return this.mask_child.mask();
		}
		this.mask_child.mask(value);
		return this;
	}
		
}

// Exact copy of image mask.
@constructor_wrapper
@register_element
class AnchorImageMaskElement extends CreateVElementClass({
	type: "AnchorImageMask",
	tag: "a",
	default_style: {
		"margin": "0px",
		"padding": "0px",
		"object-fit": "cover",
		"display": "inline-block",

		// Anchor.
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
	constructor(src) {
		
		// Initialize base class.
		super();
	
		// Append child.
		this.mask_child = VStack()
			// .position(0, 0, 0, 0)
			.width("100%")
			.height("100%")
			.background("black")
		if (src != null) {
			this.mask_child.mask("url('" + src + "') no-repeat center/contain");
		}
		// this.position("relative");
		this.append(this.mask_child);

		// Set src.
		this.src(src);

		// Set default aspect ratio.
		if (src) {
			const aspect_ratio = vweb.static.aspect_ratio(src);
			if (aspect_ratio != null) {
				this.aspect_ratio(aspect_ratio)	
			} else if (!vweb.production && Object.keys(vweb.static.aspect_ratios).length > 0 && src.charAt(0) === "/") {
				console.error(new Error(`[vweb development] Unable to find the aspect ratio for source "${src}".`))
			}	
		}
	}

	// Image color.
	mask_color(value) {
		if (value == null) {
			return this.mask_child.style.background;
		}
		this.mask_child.style.background = value;
		return this;
	}
	color(value) {
		return this.mask_color(value);
	}

	// Override src.
	src(value) {
		if (value == null) {
			return this._src;
		}
		this.mask_child.mask("url('" + value + "') no-repeat center/contain");
		this._src = value;
		return this;
	}

	// Override mask.
	mask(value) {
		if (value == null) {
			return this.mask_child.mask();
		}
		this.mask_child.mask(value);
		return this;
	}
		
}