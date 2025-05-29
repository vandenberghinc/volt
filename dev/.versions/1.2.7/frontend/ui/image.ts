/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Utils } from "../modules/utils"
import { Elements } from "../modules/elements"
import { Statics } from "../modules/statics"
import { Settings } from "../modules/settings"
import { CreateVElementClass } from "./element"
import { AnchorElement } from "./link"
import { VStack, VStackElement } from "./stack"

// Image.
@Elements.register
export class ImageElement extends CreateVElementClass({
	type: "Image",
	tag: "img",
	default_style: {
		"margin": "0px",
		"padding": "0px",
		"object-fit": "cover",
	},
}) {

	// Static attributes.
	static default_alt?: string;
	
	// Constructor.
	constructor(src?: string, alt?: string) {
		
		// Initialize base class.
		super();

		// Safari does not render images correctly for custom elements.
		if (Utils.is_safari) {
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


		// Set alt.
		if (alt != null) {
			this.alt(alt);
		} else if (ImageElement.default_alt != null) {
			this.alt(ImageElement.default_alt);
		}

		// Set default aspect ratio.
		if (src) {
			this.src(src);
			const aspect_ratio = Statics.aspect_ratio(src);
			if (aspect_ratio != null) {
				this.aspect_ratio(aspect_ratio)	
			} else if (!Settings.production && Object.keys(Statics.aspect_ratios).length > 0 && src.charAt(0) === "/") {
				console.error(new Error(`[vweb development] Unable to find the aspect ratio for source "${src}".`))
			}
			
		}
	}

	// Set the current element as the default.
	set_default() : this {
		super.set_default(ImageElement);
		const alt = this.alt();
		if (alt != null) {
			ImageElement.default_alt = alt;
		}
		return this;
	}

	// Source, purely for safari.
	src(): string
	src(value: string): this;
	src(value?: string): this | string {
		if (this._e === undefined) {
			return super.src(value as any);
		}
		if (value == null) {
			return this._e.src;
		}
		(this._e as any).src = value;
		return this;
	}

	// Alt, purely for safari.
	alt(): string
	alt(value: string): this;
	alt(value?: string): this | string {
		if (this._e === undefined) {
			return super.alt(value as any);
		}
		if (value == null) {
			return this._e.alt;
		}
		this._e.alt = value;
		return this;
	}

	// Completed, purely for safari.
	completed(): string
	completed(value: string): this;
	completed(value?: string): this | string {
		if (this._e === undefined) {
			return super.completed;
		}
		return this._e.completed;
	}

	// Height, purely for safari.
	height(): string
	height(value: string, check_attribute: boolean): this;
	height(value?: string, check_attribute: boolean = true): this | string {
		if (this._e === undefined) {
			return super.height(value as any, check_attribute);
		}
		if (value == null) {
			return this._e.height;
		}
		// Assign percentage values to the root.
		if (typeof value === "string" && value.includes("%")) {
			super.height(value as any, false); // deprecated 
		} else {
			this._e.style.height = this.pad_numeric(value, "px");
			this._e.height = this.pad_numeric(value, "");
		}
		return this;
	}
	min_height(): string
	min_height(value: string): this;
	min_height(value?: string): this | string {
		if (this._e === undefined) {
			return super.min_height(value as any);
		}
		if (value == null) {
			return this._e.style.minHeight;
		}
		// Assign percentage values to the root.
		if (typeof value === "string" && value.includes("%")) {
			super.min_height(value as any);
		} else {
			this._e.style.minHeight = this.pad_numeric(value, "px");
		}
		return this;
	}
	max_height(): string
	max_height(value: string): this;
	max_height(value?: string): this | string {
		if (this._e === undefined) {
			return super.max_height(value as any);
		}
		if (value == null) {
			return this._e.style.maxHeight;
		}
		// Assign percentage values to the root.
		if (typeof value === "string" && value.includes("%")) {
			super.max_height(value as any);
		} else {
			this._e.style.maxHeight = this.pad_numeric(value, "px");
		}
		return this;
	}

	// Width, purely for safari.
	width(): string
	width(value: string, check_attribute: boolean): this;
	width(value?: string, check_attribute: boolean = true): this | string {
		if (this._e === undefined) {
			return super.width(value as any, check_attribute);
		}
		if (value == null) {
			return this._e.width;
		}
		// Assign percentage values to the root.
		if (typeof value === "string" && value.includes("%")) {
			super.width(value as any, false);
		} else {
			this._e.style.width = this.pad_numeric(value, "px");
			this._e.width = value;
		}
		return this;
	}
	min_width(): string
	min_width(value: string): this;
	min_width(value?: string): this | string {
		if (this._e === undefined) {
			return super.min_width(value as any);
		}
		if (value == null) {
			return this._e.style.minWidth;
		}
		// Assign percentage values to the root.
		if (typeof value === "string" && value.includes("%")) {
			super.min_width(value as any);
		} else {
			this._e.style.minWidth = this.pad_numeric(value, "px");
		}
		return this;
	}
	max_width(): string
	max_width(value: string): this;
	max_width(value?: string): this | string {
		if (this._e === undefined) {
			return super.max_width(value as any);
		}
		if (value == null) {
			return this._e.style.maxWidth;
		}
		// Assign percentage values to the root.
		if (typeof value === "string" && value.includes("%")) {
			super.max_width(value as any);
		} else {
			this._e.style.maxWidth = this.pad_numeric(value, "px");
		}
		return this;
	}

	// Loading "eager" or "lazy", purely for safari.
	loading(): string
	loading(value: string): this;
	loading(value?: string): this | string {
		if (this._e === undefined) {
			if (value == null) {
				return this.getAttribute("loading") ?? "";
			}
			this.setAttribute("loading", value);
			return this;
		}
		if (value == null) {
			return this._e.getAttribute("loading") ?? "";
		}
		this._e.setAttribute("loading", value);
		return this;
	}		
}
export const Image = Elements.wrapper(ImageElement);
// function Image(...args) {
// 	if (Utils.is_safari) {
// 		const e = document.createElement(ImageElement.element_tag, {is: "v-" + ImageElement.name.toLowerCase()})
// 		console.log("E", e.prototype);
// 		e._init(...args);
// 		return e;
// 	} else {
// 		return new ImageElement(...args);
// 	}
// }

// AnchorImage.
@Elements.register
export class AnchorImageElement extends AnchorElement {

	#macro ForwardFuncToImg(attr_name) \
		attr_name(): string; \
		attr_name(value: string): this; \
		attr_name(value?: string): this | string { if (value == null) { return this.image.attr_name(); } this.image.attr_name(value); return this; }

	// Default styling.
	static default_style = {
		...AnchorElement.default_style,
	};

	// Constructor.
	constructor(href: string, src: string, alt: string) {

		// Initialize base classes.
		super(href, alt);

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
	#ForwardFuncToImg(src)
	#ForwardFuncToImg(alt)
	#ForwardFuncToImg(completed)
	#ForwardFuncToImg(height)
	#ForwardFuncToImg(min_height)
	#ForwardFuncToImg(max_height)
	#ForwardFuncToImg(width)
	#ForwardFuncToImg(min_width)
	#ForwardFuncToImg(max_width)
	#ForwardFuncToImg(loading)

	// src(value)				{ if (value == null) { return this.image.src(); } this.image.src(value); return this; }
	// alt(value)				{ if (value == null) { return this.image.alt(); } this.image.alt(value); return this; }
	// completed(value)		{ if (value == null) { return this.image.completed(); } this.image.completed(value); return this; }
	// src(value)				{ if (value == null) { return this.image.src(); } this.image.src(value); return this; }
	// height(value, ...args) 	{ if (value == null) { return this.image.height(); } this.image.height(value, ...args); return this; }
	// min_height(value)		{ if (value == null) { return this.image.min_height(); } this.image.min_height(value); return this; }
	// max_height(value)		{ if (value == null) { return this.image.max_height(); } this.image.max_height(value); return this; }
	// width(value, ...args) 	{ if (value == null) { return this.image.width(); } this.image.width(value, ...args); return this; }
	// min_width(value)		{ if (value == null) { return this.image.min_width(); } this.image.min_width(value); return this; }
	// max_width(value)		{ if (value == null) { return this.image.max_width(); } this.image.max_width(value); return this; }
	// loading(value)			{ if (value == null) { return this.image.loading(); } this.image.loading(value); return this; }
}
export const AnchorImage = Elements.wrapper(AnchorImageElement);


// ImageMask.
@Elements.register
export class ImageMaskElement extends CreateVElementClass({
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

	// Attributes.
	public mask_child: VStackElement;
	public _src?: string;
	
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
			const aspect_ratio = Statics.aspect_ratio(src);
			if (aspect_ratio != null) {
				this.aspect_ratio(aspect_ratio)	
			} else if (!Settings.production && Object.keys(Statics.aspect_ratios).length > 0 && src.charAt(0) === "/") {
				console.error(new Error(`[vweb development] Unable to find the aspect ratio for source "${src}".`))
			}
			
		}
	}

	// Image color.
	mask_color() : string;
	mask_color(value: string) : this;
	mask_color(value?: string) : string | this {
		if (value == null) {
			return this.mask_child.style.background;
		}
		this.mask_child.style.background = value;
		return this;
	}
	color() : string;
	color(value: string) : this;
	color(value?: string) : string | this {
		return this.mask_color(value as any);
	}

	// Transition mask.
	transition_mask() : string;
	transition_mask(value: string) : this;
	transition_mask(value?: string) : string | this {
		if (value == null) { return this.mask_child.transition() ?? ""; }
		this.mask_child.transition(value)
		return this;
	}

	// Override src.
	src() : string;
	src(value: string) : this;
	src(value?: string) : string | this {
		if (value == null) {
			return this._src ?? "";
		}
		this.mask_child.mask("url('" + value + "') no-repeat center/contain");
		this._src = value;
		return this;
	}

	// Override mask.
	mask() : string;
	mask(value: string) : this;
	mask(value?: string) : string | this {
		if (value == null) {
			return this.mask_child.mask();
		}
		this.mask_child.mask(value);
		return this;
	}
}
export const ImageMask = Elements.wrapper(ImageMaskElement);

// Exact copy of image mask.
@Elements.register
export class AnchorImageMaskElement extends CreateVElementClass({
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

	// Attributes.
	public mask_child: VStackElement;
	public _src?: string;
	
	// Constructor.
	constructor(src: string) {
		
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
			const aspect_ratio = Statics.aspect_ratio(src);
			if (aspect_ratio != null) {
				this.aspect_ratio(aspect_ratio)	
			} else if (!Settings.production && Object.keys(Statics.aspect_ratios).length > 0 && src.charAt(0) === "/") {
				console.error(new Error(`[vweb development] Unable to find the aspect ratio for source "${src}".`))
			}	
		}
	}

	// Image color.
	mask_color() : string;
	mask_color(value: string) : this;
	mask_color(value?: string) : string | this {
		if (value == null) {
			return this.mask_child.style.background;
		}
		this.mask_child.style.background = value;
		return this;
	}
	color() : string;
	color(value: string) : this;
	color(value?: string) : string | this {
		return this.mask_color(value as any);
	}

	// Override src.
	src() : string;
	src(value: string) : this;
	src(value?: string) : string | this {
		if (value == null) {
			return this._src ?? "";
		}
		this.mask_child.mask("url('" + value + "') no-repeat center/contain");
		this._src = value;
		return this;
	}

	// Override mask.
	mask() : string;
	mask(value: string) : this;
	mask(value?: string) : string | this {
		if (value == null) {
			return this.mask_child.mask();
		}
		this.mask_child.mask(value);
		return this;
	}
}
export const AnchorImageMask = Elements.wrapper(AnchorImageMaskElement);