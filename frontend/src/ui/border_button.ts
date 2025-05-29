/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Elements, VElement, VElementBaseSignature, VAnchorElement, VDivElement, VDiv, VElementTagMap } from "../elements/module.js";

// BorderButton.
/**
 * Supports a gradient color for the border combined with border radius.
 * Warning: this class is still experimental and may be subject to future change.
 */
@Elements.create({
    name: "BorderButtonElement",
    default_style: {
        "margin": "0px 0px 0px 0px",
        "display": "inline-block",
        "color": "inherit",
        "text-align": "center",
        "cursor": "pointer",
        "position": "relative",
        "z-index": "0",
        "background": "none",
        "user-select": "none",
        "outline": "none",
        "border": "none",
        "text-decoration": "none",
        // Custom.
        "--child-color": "black",
        "--child-background": "black",
        "--child-border-width": "2px",
        "--child-border-radius": "10px",
        "--child-padding": "5px 10px 5px 10px",
    },
    default_events: {
        "onmousedown": function (this: any): void {
            this.style.filter = "brightness(80%)";
        },
        "onmouseover": function (this: any): void {
            this.style.filter = "brightness(90%)";
        },
        "onmouseup": function (this: any): void {
            this.style.filter = "brightness(100%)";
        },
        "onmouseout": function (this: any): void {
            this.style.filter = "brightness(100%)";
        },
    },
})
export class BorderButtonElement extends VElementTagMap.a {

	public nodes: {
	    border: VDivElement;
	    text: VDivElement;
	    [key: string]: any;
	}

	/**
	 * @docs:
	 * @title: Constructor
	 * @desc: Initializes a new instance of the BorderButton element with the provided text.
	 * @param:
	 *     @name: text
	 *     @descr: The text to be displayed on the BorderButton.
	 *     @type: string
	 * @return:
	 *     @type: void
	 *     @description This constructor does not return a value.
	 */
	constructor(text: string = "") {
		
		// Initialize base classes.
		super({
			derived: BorderButtonElement,
		});

		// Set nodes type.
		this.nodes = {
			border: VDiv(),
			text: VDiv(),
		};
		
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
		this.nodes.border
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
		this.nodes.text
			.color(BorderButtonElement.default_style["--child-color"])
			.append(text);
		if (BorderButtonElement.default_style["--child-color"] == "transparent") {
			this.nodes.text.style.backgroundImage = BorderButtonElement.default_style["--child-background-image"];
	    	this.nodes.text.style.backgroundClip = BorderButtonElement.default_style["--child-background-clip"];
	    	this.nodes.text.style["-webkit-background-clip"] = BorderButtonElement.default_style["--child-webkit-background-clip"];
	    }

	    // Append.
		this.append(this.nodes.border, this.nodes.text);
	}

	/**
	 * @docs:
	 * @title: Gradient
	 * @desc: Set the gradient color for the border element. If no value is provided, it retrieves the current background.
	 * @param:
	 *     @name: value
	 *     @descr: The color value to set for the gradient.
	 *     @type: string, null
	 * @return:
	 *     @type: string | this
	 *     @description When an argument is passed this function returns the instance of the element for chaining. Otherwise, it returns the current background value.
	 * @funcs: 2
	 */
	gradient(): string;
	gradient(value: string | null): this;
	gradient(value?: string | null): string | this {
		if (value == null) {
			return this.nodes.border.background();
		}
		this.nodes.border.background(value);
		return this;
	}

	/**
	 * @docs:
	 * @title: Border Color
	 * @desc: Sets the border color of the element. If no value is provided, it retrieves the current border color.
	 * @param:
	 *     @name: value
	 *     @descr: The color value to set for the border.
	 *     @type: string, null
	 * @return:
	 *     @type: string | this
	 *     @description When an argument is passed, this function returns the instance of the element for chaining. Otherwise, it returns the current border color.
	 * @funcs: 2
	 */
	border_color(): string;
	border_color(value: string | null): this;
	border_color(value?: string | null): string | this {
		if (value == null) {
			return this.nodes.border.background();
		}
		this.nodes.border.background(value);
		return this;
	}

	/**
	 * @docs:
	 * @title: Border Width
	 * @desc: Sets or retrieves the border width of the element. If no argument is passed, it returns the current padding.
	 * @param:
	 *     @name: value
	 *     @descr: The value of the border width to set.
	 *     @type: number, null
	 * @return:
	 *     @type: number | this
	 *     @description When an argument is passed, this function returns the instance of the element for chaining. Otherwise, it returns the current border width.
	 * @funcs: 2
	 */
	border_width(): string;
	border_width(value: string | number): this;
	border_width(value?: string | number | null): string | this {
		if (value == null) {
			return this.nodes.border.padding();
		}
		this.nodes.border.padding(value);
		return this;
	}

	/**
	 * @docs:
	 * @title: Border Radius
	 * @desc: Sets the border radius for the element. If no value is provided, it retrieves the current border radius.
	 * @param:
	 *     @name: value
	 *     @descr: The value for the border radius to set.
	 *     @type: number, null
	 * @return:
	 *     @type: number | this
	 *     @description Returns the current border radius if no argument is passed, otherwise returns the instance for chaining.
	 * @funcs: 2
	 */
	border_radius(): string;
	border_radius(value: string | number): this;
	border_radius(value?: string | number | null): string | this {
		if (value == null) {
			return this.nodes.border.border_radius();
		}
		super.border_radius(value);
		this.nodes.border.border_radius(value);
		return this;
	}

	/**
	 * @docs:
	 * @title: Color
	 * @desc: Sets or retrieves the color of the child text. When a value is provided, it updates the color; when no value is provided, it returns the current color.
	 * @param:
	 *     @name: value
	 *     @descr: The color value to set for the child text.
	 *     @type: string, null
	 * @return:
	 *     @type: string | this
	 *     @description Returns the current color if no argument is passed; otherwise, returns the instance of the element for chaining.
	 * @funcs: 2
	 */
	color(): string;
	color(value: string): this;
	color(value?: string | null): string | this {
		if (value == null) {
			return this.nodes.text.color() ?? "";
		}
		this.nodes.text.color(value);
		return this;
	}

	/**
	 * @docs:
	 * @title: Styles
	 * @desc: Retrieves or sets the styling attributes for the element. If no argument is provided, it computes styles based on child elements.
	 * @param:
	 *     @name: style_dict
	 *     @descr: A dictionary of styles to set. If null, the method computes styles based on child elements.
	 *     @type: object | null
	 * @return:
	 *     @type: object
	 *     @description Returns the computed styles when no argument is passed, or the result of the super method when an argument is provided.
	 * @funcs: 2
	 */
	styles(): Record<string, string>;
	styles(style_dict: Record<string, any>): this;
	styles(style_dict?: Record<string, any>): Record<string, string> | this {
		if (style_dict == null) {
			let styles = super.styles();
			styles["--child-background"] = this.nodes.border.background();
			styles["--child-border-width"] = this.nodes.border.padding();
			styles["--child-border-radius"] = this.nodes.border.border_radius();
			styles["--child-color"] = this.nodes.text.color();
			styles["--child-background-image"] = this.nodes.text.style.backgroundImage;
			styles["--child-background-clip"] = this.nodes.text.style.backgroundClip;
			styles["--child-webkit-background-clip"] = this.nodes.text.style["-webkit-background-clip"];
			return styles;
		} else {
			return super.styles(style_dict);
		}
	}

	/**
	 * @docs:
	 * @title: Text
	 * @desc: Set or get the text of the element. If a value is provided, it sets the text; otherwise, it retrieves the current text.
	 * @param:
	 *     @name: val
	 *     @descr: The value to set as text or null to retrieve the current text.
	 *     @type: string, null
	 * @return:
	 *     @type: string | this
	 *     @description When a value is passed, this function returns the instance for chaining. If no value is passed, it returns the current text.
	 * @funcs: 2
	 */
	// @ts-ignore
	text(): string;
	// @ts-ignore
	text(val: string): this;
	// @ts-ignore
	text(val?: string): string | this {
		if (val == null) { return this.nodes.text.text(); }
		this.nodes.text.text(val);
		return this;
	}

	/**
	 * @docs:
	 * @title: Transition Border Color
	 * @desc: Sets or retrieves the transition for the border color of the element.
	 * @param:
	 *     @name: val
	 *     @descr: The value to set for the transition or to retrieve the current transition.
	 *     @type: string, number, null
	 * @return:
	 *     @type: this | string
	 *     @description When an argument is passed, this function returns the instance of the element for chaining. Otherwise, it returns the already set transition value.
	 * @funcs: 2
	 */
	transition_border_color(): string;
	transition_border_color(val: string): this;
	transition_border_color(val?: string): string | this {
		if (val == null) { return this.nodes.border.transition(); }
        else if (/[0-9]/.test(val.charAt(0))) {
            val = "border-color " + val;
        }
		this.nodes.border.transition(typeof val !== "string" ? val : val.replace("border-color ", "background "));
		return this;
	}
}
export const BorderButton = Elements.wrapper(BorderButtonElement);
export const NullBorderButton = Elements.create_null(BorderButtonElement);
declare module './any_element.d.ts' { interface AnyElementMap { BorderButtonElement: BorderButtonElement }}