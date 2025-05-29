/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Utils } from "../modules/utils.js"
import { Elements, VElement, VElementBaseSignature, VElementTagMap, VDivElement, VAnchorElement } from "../elements/module.js"
import { Statics } from "../modules/statics.js"
import { Settings } from "../modules/settings.js"
import { AnchorElement } from "./link.js"
import { VStack, VStackElement } from "./stack.js"

// Image.
@Elements.create({
    name: "ImageElement",
    default_style: {
        "margin": "0px",
        "padding": "0px",
        "object-fit": "cover",
    },
})
export class ImageElement extends VElementTagMap.img {;

	// Static attributes.
	static default_alt?: string;
	public _e?: HTMLImageElement;
	
	// Constructor.
	constructor(src?: string, alt?: string) {
		
		// Initialize base class.
		super({
			derived: ImageElement,
		});

		// Safari does not render images correctly for custom elements.
		if (Utils.is_safari) {
			this.attachShadow({ mode: 'open' });
			this._e = document.createElement("img");
			this._e.style.objectFit = "cover";
			this._e.style.width = "100%";
			this._e.style.height = "100%";
			(this as any).shadowRoot.appendChild(this._e);
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
				console.error(new Error(`[volt development] Unable to find the aspect ratio for source "${src}".`))
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
    src(value: string, set_aspect_ratio?: boolean): this;
	src(value?: string, set_aspect_ratio: boolean = false): this | string {
		if (this._e === undefined) {
            return super.src(value as any, set_aspect_ratio);
		}
		if (value == null) {
			return this._e.src;
		}
		(this._e as any).src = value;
        console.log("Set aspect ratio?", set_aspect_ratio, "from src", value)
        if (set_aspect_ratio) {
            const aspect_ratio = Statics.aspect_ratio(value);
            if (aspect_ratio != null) {
                console.log("Set aspect ratio",aspect_ratio, "from src",value)
                this.aspect_ratio(aspect_ratio)
            } else {
                console.log("Unknown aspect ratio from src", value)
            }
        }
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

	// Complete, purely for safari.
	// complete(): string
	// complete(value: string): this;
	// complete(value?: string): this | string {
	// 	if (this._e === undefined) {
	// 		return super.complete;
	// 	}
	// 	return this._e.complete;
	// }

	// Height, purely for safari.
	height(): string | number
	height(value: string | number, check_attribute?: boolean): this;
	height(value?: string | number, check_attribute: boolean = true): this | string | number {
		if (this._e === undefined) {
			return super.height(value as any, check_attribute);
		}
		if (value == null) {
			return this._e.height.toString();
		}
		// Assign percentage values to the root.
		if (typeof value === "string" && value.includes("%")) {
			super.height(value as any, false); // deprecated 
		} else {
			this._e.style.height = this.pad_numeric(value, "px");
			this._e.height = value as any;
		}
		return this;
	}
	min_height(): string | number
	min_height(value: string | number): this;
	min_height(value?: string | number): this | string | number {
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
	max_height(): string | number
	max_height(value: string | number): this;
	max_height(value?: string | number): this | string | number {
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
	width(): string | number;
	width(value: string | number, check_attribute?: boolean): this;
	width(value?: string | number, check_attribute: boolean = true): this | number | string {
		if (this._e === undefined) {
			return super.width(value as any, check_attribute);
		}
		if (value == null) {
			return this._e.width.toString();
		}
		// Assign percentage values to the root.
		if (typeof value === "string" && value.includes("%")) {
			super.width(value as any, false);
		} else {
			this._e.style.width = this.pad_numeric(value, "px");
			this._e.width = value as any;
		}
		return this;
	}
	min_width(): string | number
	min_width(value: string | number): this;
	min_width(value?: string | number): this | string | number {
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
	max_width(): string | number
	max_width(value: string | number): this;
	max_width(value?: string | number): this | string | number {
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
	// @ts-ignore
	loading(): string
	// @ts-ignore
	loading(value: string): this;
	// @ts-ignore
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
export const NullImage = Elements.create_null(ImageElement);
declare module './any_element.d.ts' { interface AnyElementMap { ImageElement: ImageElement }}
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
@Elements.create({
    name: "AnchorImageElement",
})
export class AnchorImageElement extends (AnchorElement as any as VElementBaseSignature) {

	// Default styling.
	public image: ImageElement;

	// Constructor.
	constructor(href: string, src: string, alt: string) {

		// Initialize base classes.
		super(href, alt);
		this._init({
			derived: AnchorImageElement,
		})

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
    src(): string;
    src(value: string): this;
    src(value?: string): this | string { if (value == null) { return this.image.src(); } this.image.src(value); return this; }

    alt(): string;
    alt(value: string): this;
    alt(value?: string): this | string { if (value == null) { return this.image.alt(); } this.image.alt(value); return this; }

    // completed(): string;
    // completed(value: string): this;
    // completed(value?: string): this | string { if (value == null) { return this.image.completed(); } this.image.completed(value); return this; }

    height(): string | number;
    height(value: string | number): this;
    height(value?: string | number): this | string | number { if (value == null) { return this.image.height(); } this.image.height(value); return this; }

    min_height(): string | number;
    min_height(value: string | number): this;
    min_height(value?: string | number): this | string | number { if (value == null) { return this.image.min_height(); } this.image.min_height(value); return this; }

    max_height(): string | number;
    max_height(value: string | number): this;
    max_height(value?: string | number): this | string | number { if (value == null) { return this.image.max_height(); } this.image.max_height(value); return this; }

    width(): string | number;
    width(value: string | number): this;
    width(value?: string | number): this | string | number { if (value == null) { return this.image.width(); } this.image.width(value); return this; }

    min_width(): string | number;
    min_width(value: string | number): this;
    min_width(value?: string | number): this | string | number { if (value == null) { return this.image.min_width(); } this.image.min_width(value); return this; }

    max_width(): string | number;
    max_width(value: string | number): this;
    max_width(value?: string | number): this | string | number { if (value == null) { return this.image.max_width(); } this.image.max_width(value); return this; }
	
	// @ts-ignore
	loading(): string;
	// @ts-ignore
	loading(value: string): this;
	// @ts-ignore
	loading(value?: string): this | string { if (value == null) { return this.image.loading(); } this.image.loading(value); return this; }

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
export const NullAnchorImage = Elements.create_null(AnchorImageElement);
declare module './any_element.d.ts' { interface AnyElementMap { AnchorImageElement: AnchorImageElement }}


// ImageMask.
@Elements.create({
    name: "ImageMaskElement",
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
})
export class ImageMaskElement extends VElementTagMap.div {

	// Attributes.
	public mask_child: VStackElement;
	public _img_src?: string;
	
	// Constructor.
	constructor(src?: string) {
		
		// Initialize base class.
		super({
			derived: ImageMaskElement,
		})
	
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

		if (src) {

			// Set src.
			this.src(src);

			// Set default aspect ratio.
			const aspect_ratio = Statics.aspect_ratio(src);
			if (aspect_ratio != null) {
				this.aspect_ratio(aspect_ratio)	
			} else if (!Settings.production && Object.keys(Statics.aspect_ratios).length > 0 && src.charAt(0) === "/") {
				console.error(new Error(`[volt development] Unable to find the aspect ratio for source "${src}".`))
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
    src(value: string, set_aspect_ratio?: boolean) : this;
    src(value?: string, set_aspect_ratio: boolean = false) : string | this {
		if (value == null) {
			return this._img_src ?? "";
		}
		this.mask_child.mask("url('" + value + "') no-repeat center/contain");
		this._img_src = value;
        if (set_aspect_ratio) {
            const aspect_ratio = Statics.aspect_ratio(value);
            if (aspect_ratio != null) {
                // console.log("Set aspect ratio", aspect_ratio, "from src", value)
                this.aspect_ratio(aspect_ratio)
            }
            // else {
            //     console.log("Unknown aspect ratio from src", value)
            // }
        }
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
export const NullImageMask = Elements.create_null(ImageMaskElement);
declare module './any_element.d.ts' { interface AnyElementMap { ImageMaskElement: ImageMaskElement }}

// Exact copy of image mask.
@Elements.create({
    name: "AnchorImageMaskElement",
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
})
export class AnchorImageMaskElement extends VElementTagMap.a {

	// Attributes.
	public mask_child: VStackElement;
	public _img_src?: string;
	
	// Constructor.
	constructor(src?: string) {
		
		// Initialize base class.
		super({
			derived: AnchorImageMaskElement,
		});
	
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

		if (src) {

			// Set src.
			this.src(src);

			// Set default aspect ratio.
			const aspect_ratio = Statics.aspect_ratio(src);
			if (aspect_ratio != null) {
				this.aspect_ratio(aspect_ratio)	
			} else if (!Settings.production && Object.keys(Statics.aspect_ratios).length > 0 && src.charAt(0) === "/") {
				console.error(new Error(`[volt development] Unable to find the aspect ratio for source "${src}".`))
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
    src(): string;
    src(value: string, set_aspect_ratio?: boolean): this;
    src(value?: string, set_aspect_ratio: boolean = false): string | this {
        if (value == null) {
            return this._img_src ?? "";
        }
        this.mask_child.mask("url('" + value + "') no-repeat center/contain");
        this._img_src = value;
        if (set_aspect_ratio) {
            const aspect_ratio = Statics.aspect_ratio(value);
            if (aspect_ratio != null) {
                // console.log("Set aspect ratio", aspect_ratio, "from src", value)
                this.aspect_ratio(aspect_ratio)
            }
            // else {
            //     console.log("Unknown aspect ratio from src", value)
            // }
        }
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
export const NullAnchorImageMask = Elements.create_null(AnchorImageMaskElement);
declare module './any_element.d.ts' { interface AnyElementMap { AnchorImageMaskElement: AnchorImageMaskElement }}