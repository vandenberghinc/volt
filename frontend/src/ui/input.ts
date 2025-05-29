/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// External imports.
import { fuzzy } from "@vandenberghinc/vlib/frontend";

// Imports.
import { Elements, VElementBaseSignature, VElement, VElementTagMap, VInputElement, VTextAreaElement, ElementKeyboardEvent, ElementEvent } from "../elements/module.js"
import { Utils } from "../modules/utils.js"
import { HStack, HStackElement, VStack, VStackElement } from "./stack"
import { Text, TextElement } from "./text"
import { ImageMask, ImageMaskElement } from "./image"
import { GradientBorder, GradientBorderElement } from "./gradient"
import { Scroller, ScrollerElement } from "./scroller"
import { Divider } from "./divider"
import { addSyntheticLeadingComment } from "typescript"

// Input.
@Elements.create({
    name: "InputElement",
    default_style: {
        "margin": "0px 0px 0px 0px",
        "padding": "2.5px 5px 2.5px 5px",
        "font": "inherit",
        "color": "inherit",
        "background": "none",
        "outline": "none",
        "border": "none",
        "border-radius": "10px",
        "text-align": "start",
        "white-space": "nowrap",
    },
    default_attributes: {
        "spellcheck": "false",
        "autocorrect": "off",
        "autocapitalize": "none",
    },
})
export class InputElement extends VElementTagMap.input {

	// Attributes.
	private _e!: HTMLInputElement;
	
	// Constructor.
	constructor(placeholder?: string, type: string = "text", value?: string) {
		
		// Initialize base class.
		super({
			derived: InputElement,
		});

		// Safari does not render images correctly for custom elements.
		if (Utils.is_safari) {
			this.attachShadow({ mode: 'open' });
			this._e = document.createElement("input");
			this._e.style.font = "inherit";
			this._e.style.color = "inherit";
			this._e.style.background = "none";
			this._e.style.border = "none";
			this._e.style.outline = "none";
			this._e.style.whiteSpace = "nowrap";
			this._e.style.width = "100%";
			this._e.style.padding = InputElement.default_style.padding;
			(this as any).shadowRoot.appendChild(this._e);
			this.padding("0")
		}
	
		// Set src.
		this.placeholder(placeholder ?? "");
		this.type(type ?? "text");
		this.value(value ?? "");
	}	

	// Alias functions.
	value(): string;
	value(val: string | number): this;
	value(val?: string | number): this | string { if (this._e === undefined) { return super.value(val as any); } if (val == null) { return this._e.getAttribute("value") ?? ""; } this._e.setAttribute("value", val.toString()); return this; }
	required(): boolean;
	required(val: boolean): this;
	required(val?: boolean): this | boolean { if (this._e === undefined) { return super.required(val as any); } if (val == null) { return this._e.getAttribute("required") === "true"; } if (!val) { this._e.removeAttribute("required"); } else { this._e.setAttribute("required", val as any); } return this; }
	type(): string;
	type(val: string): this;
	type(val?: string): this | string { if (this._e === undefined) { return super.type(val as any); } if (val == null) { return this._e.getAttribute("type") ?? ""; } this._e.setAttribute("type", val as any); return this; }
	placeholder(): string;
	placeholder(val: string): this;
	placeholder(val?: string): this | string { if (this._e === undefined) { return super.placeholder(val as any); } if (val == null) { return this._e.getAttribute("placeholder") ?? ""; } this._e.setAttribute("placeholder", val as any); return this; }
	resize(): string;
	resize(val: string): this;
	resize(val?: string): this | string { if (this._e === undefined) { return super.resize(val as any); } if (val == null) { return this._e.getAttribute("resize") ?? ""; } this._e.setAttribute("resize", val as any); return this; }
	padding(): string;
	padding(value: undefstrnr): this;
	padding(top_bottom: undefstrnr, left_right: undefstrnr): this;
	padding(top: undefstrnr, right: undefstrnr, bottom: undefstrnr, left: undefstrnr): this;
	padding(...values) {
		if (this._e === undefined) { return super.padding(...values as [number, string]); }
		if (values.length === 0) {
			return this._e.style.padding;
		} else if (values.length === 1) {
			this._e.style.padding = this.pad_numeric(values[0]);
		} else if (values.length === 2) {	
			if (values[0] != null) {
				this._e.style.paddingTop = this.pad_numeric(values[0]);
			}
			if (values[1] != null) {
				this._e.style.paddingRight = this.pad_numeric(values[1]);
			}
			if (values[0] != null) {
				this._e.style.paddingBottom = this.pad_numeric(values[0]);
			}
			if (values[1] != null) {
				this._e.style.paddingLeft = this.pad_numeric(values[1]);
			}
		} else if (values.length === 4) {
			this._e.style.paddingTop = this.pad_numeric(values[0]);
			if (values[1] != null) {
				this._e.style.paddingRight = this.pad_numeric(values[1]);
			}
			if (values[2] != null) {
				this._e.style.paddingBottom = this.pad_numeric(values[2]);
			}
			if (values[3] != null) {
				this._e.style.paddingLeft = this.pad_numeric(values[3]);
			}
		} else {
			console.error("Invalid number of arguments for function \"padding()\".");
		}
		return this;
	}
}
export const Input = Elements.wrapper(InputElement);
export const NullInput = Elements.create_null(InputElement);
declare module './any_element.d.ts' { interface AnyElementMap { InputElement: InputElement }}

// InputBox.
@Elements.create({
    name: "InputBoxElement",
    default_style: {
        "margin": "0px 0px 0px 0px",
        "padding": "2.5px 5px 2.5px 5px",
        "height": "20px",
        "font": "inherit",
        "color": "inherit",
        "background": "none",
        "outline": "none",
        "border": "none",
        "border-radius": "10px",
        "text-align": "start",
        "white-space": "wrap",
        "resize": "none",
    },
	default_attributes: {
        "spellcheck": "false",
        "autocorrect": "off",
        "autocapitalize": "none",
    },
})
export class InputBoxElement extends VElementTagMap.textarea {

	// Attributes.
	public _e?: HTMLTextAreaElement;
	
	// Constructor.
	constructor(placeholder?: string) {
		
		// Initialize base class.
		super({
			derived: InputBoxElement,
		});

		// Safari does not render images correctly for custom elements.
		if (Utils.is_safari) {
			this.attachShadow({ mode: 'open' });
			this._e = document.createElement("textarea");
			this._e.style.font = "inherit";
			this._e.style.color = "inherit";
			this._e.style.background = "none";
			this._e.style.border = "none";
			this._e.style.outline = "none";
			this._e.style.width = "100%";
			this._e.style.height = "100%";
			this._e.style.margin = "0";
			this._e.style.padding = InputBoxElement.default_style.padding;
			(this as any).shadowRoot.appendChild(this._e);
			this.padding("0")
		}
	
		// Set src.
		this.placeholder(placeholder ?? "");
	}

	// Alias functions.
	value(): string;
	value(val: string | number): this;
	value(val?: string | number): this | string { if (this._e === undefined) { return super.value(val as any); } if (val == null) { return this._e.getAttribute("value") ?? ""; } this._e.setAttribute("value", val.toString()); return this; }
	required(): boolean;
	required(val: boolean): this;
	required(val?: boolean): this | boolean { if (this._e === undefined) { return super.required(val as any); } if (val == null) { return this._e.getAttribute("required") === "true"; } if (!val) { this._e.removeAttribute("required"); } else { this._e.setAttribute("required", val as any); } return this; }
	type(): string;
	type(val: string): this;
	type(val?: string): this | string { if (this._e === undefined) { return super.type(val as any); } if (val == null) { return this._e.getAttribute("type") ?? ""; } this._e.setAttribute("type", val as any); return this; }
	placeholder(): string;
	placeholder(val: string): this;
	placeholder(val?: string): this | string { if (this._e === undefined) { return super.placeholder(val as any); } if (val == null) { return this._e.getAttribute("placeholder") ?? ""; } this._e.setAttribute("placeholder", val as any); return this; }
	resize(): string;
	resize(val: string): this;
	resize(val?: string): this | string { if (this._e === undefined) { return super.resize(val as any); } if (val == null) { return this._e.getAttribute("resize") ?? ""; } this._e.setAttribute("resize", val as any); return this; }
	padding(): string;
	padding(value: undefstrnr): this;
	padding(top_bottom: undefstrnr, left_right: undefstrnr): this;
	padding(top: undefstrnr, right: undefstrnr, bottom: undefstrnr, left: undefstrnr): this;
	padding(...values) {
		if (this._e === undefined) { return super.padding(...values as [number, string]); }
		if (values.length === 0) {
			return this._e.style.padding;
		} else if (values.length === 1) {
			this._e.style.padding = this.pad_numeric(values[0]);
		} else if (values.length === 2) {	
			if (values[0] != null) {
				this._e.style.paddingTop = this.pad_numeric(values[0]);
			}
			if (values[1] != null) {
				this._e.style.paddingRight = this.pad_numeric(values[1]);
			}
			if (values[0] != null) {
				this._e.style.paddingBottom = this.pad_numeric(values[0]);
			}
			if (values[1] != null) {
				this._e.style.paddingLeft = this.pad_numeric(values[1]);
			}
		} else if (values.length === 4) {
			this._e.style.paddingTop = this.pad_numeric(values[0]);
			if (values[1] != null) {
				this._e.style.paddingRight = this.pad_numeric(values[1]);
			}
			if (values[2] != null) {
				this._e.style.paddingBottom = this.pad_numeric(values[2]);
			}
			if (values[3] != null) {
				this._e.style.paddingLeft = this.pad_numeric(values[3]);
			}
		} else {
			console.error("Invalid number of arguments for function \"padding()\".");
		}
		return this;
	}
}
export const InputBox = Elements.wrapper(InputBoxElement);
export const NullInputBox = Elements.create_null(InputBoxElement);
declare module './any_element.d.ts' { interface AnyElementMap { InputBoxElement: InputBoxElement }}

// Extended input.
@Elements.create({
    name: "ExtendedInputElement",
    default_style: {
        ...VStackElement.default_style,
        "color": "inherit",
        "font-size": "16px",
        // Custom.
        "--input-padding": "12px 6px",
        "--input-border-radius": "5px",
        "--input-border-color": "gray",
        "--input-hover-border-color": "gray",
        "--input-background": "transparent",
        "--image-mask-color": "#000",
        "--image-size": "20px",
        "--image-margin-right": "10px",
        "--image-margin-left": "5px",
        "--image-alt": "VWeb",
        "--focus-color": "#8EB8EB",
        "--missing-color": "#E8454E",
    },
})
export class ExtendedInputElement extends (VStackElement as any as VElementBaseSignature) {

	private _focus_color: string;
	private _missing_color: string;
	private _mask_color: string;
	private _initial_border_color: string;
    private _hover_border_color: string;

	// @ts-expect-error
	public label: TextElement;
	public image: ImageMaskElement;
	public input: (InputElement | InputBoxElement);
	public input_border: GradientBorderElement;
	public container: HStackElement;
	public error: TextElement;
    public is_missing = false;
    public is_focused = false;

	// @todo add readonly func

	// Constructor.
	constructor({
		label = undefined,
		image = undefined,
		alt = undefined,
		placeholder = "Input",
		id = undefined,
		readonly = false,
		required = false,
		type = "text",
		value = undefined,
	}: {
		label?: string,
		image?: string,
		alt?: string,
		placeholder?: string,
		id?: string,
		readonly?: boolean,
		required?: boolean,
		type?: string,
		value?: string,
	}) {

		// Initialize super.
		super();
		this._init({
			derived: ExtendedInputElement,
		})

		// Set id.
		if (id != null) {
			this.id(id);
		}

		// Attributes.
		this._focus_color = ExtendedInputElement.default_style["--focus-color"];
		this._missing_color = ExtendedInputElement.default_style["--missing-color"];
		this._mask_color = ExtendedInputElement.default_style["--image-mask-color"];
        this._initial_border_color = ExtendedInputElement.default_style["--input-border-color"];
        this._hover_border_color = ExtendedInputElement.default_style["--input-hover-border-color"];

		// Set default styling.
		this.styles(ExtendedInputElement.default_style);

		// Title element.
		this.label = Text(label)
			.parent(this)
			.font_size("inherit")
			.margin(0, 0, 7.5, 0)
			.color("inherit")
			.width("fit-content")
			.ellipsis_overflow(true)
		if (label == null) {
			this.label.hide();
		}

		// Title element.
		this.image = ImageMask(image)
			.parent(this)
            .mask_color(this._mask_color)
            .frame(ExtendedInputElement.default_style["--image-size"], ExtendedInputElement.default_style["--image-size"])
            .margin(0)
            .margin_right(ExtendedInputElement.default_style["--image-margin-right"])
            .margin_left(ExtendedInputElement.default_style["--image-margin-left"])
            .alt(alt ? alt : ExtendedInputElement.default_style["--image-alt"]);
        if (image == null) {
			this.image.hide();
		}

		// Input element.
		if (type === "box" || type === "area") {
			this.input = InputBox(placeholder)
		} else {
			this.input = Input(placeholder, type)	
		}
		(this.input as any)
			.parent(this)
			.color("inherit")
			.readonly(readonly)
			.font_size("inherit")
			.font_weight("normal")
			.margin(0)
			.width("100%")
			.stretch(true)
			.padding(0, 5)
			.line_height("1.6em")
			.box_shadow("none")
			.border("none")
			.outline("none")
			.z_index(1)
			.border_radius(0) // is required.
			.on_focus(() => {
                if (!this.is_missing) {
                    this.is_focused = true;
					this.input_border.border_color(this._focus_color)
					this.container.box_shadow(`0 0 0 3px ${this._focus_color}80`)
				}
			})
			.on_blur(() => {
                if (!this.is_missing) {
                    this.is_focused = false;
					this.input_border.border_color(this._initial_border_color)
					this.container.box_shadow(`0 0 0 0px transparent`)
				}
			})

		// The input border to support gradients.
		this.input_border = GradientBorder()
			.z_index(0)
			.position(0, 0, 0, 0)
			.border_radius(ExtendedInputElement.default_style["--input-border-radius"])
			.border_width(1)
			.border_color(ExtendedInputElement.default_style["--input-border-color"])
			.border_color("0px solid transparent")
			.box_shadow(`0 0 0 0px transparent`)
			.transition("background 200ms ease-in-out")

		// The hstack container.
		this.container = HStack(
			VStack(
				this.image,
			)
            .width("fit-content")
			.height("1.6em")
			.center_vertical(),
			this.input_border,
			this.input,
		)
		.parent(this)
		.position("relative")
		.background(ExtendedInputElement.default_style["--input-background"])
		.padding(ExtendedInputElement.default_style["--input-padding"])
		.transition("box-shadow 0.2s ease-in-out")
		.outline("0px solid transparent")
		.box_shadow(`0 0 0 0px transparent`)
		.width("100%")
        .on_mouse_over_out(
            (e) => {
                if (!this.is_missing && !this.is_focused) {
                    this.input_border.border_color(this._hover_border_color)
                }
            },
            (e) => {
                if (!this.is_missing && !this.is_focused) {
                    this.input_border.border_color(this._initial_border_color)
                }
            },    
        )

		// The error message.
		this.error = Text("Incomplete field")
			.color(this._missing_color)
			.font_size("0.8em")
			.margin(7.5, 0, 0, 2.5)
			.padding(0)
			.leading()
			.hide()

		// Set id.
		if (id != null) {
			this.id(id);
		}

		// Set required.
		if (required) {
			this.required(required);
		}

		// Append.
		this.append(this.label, this.container, this.error);

		// Set value.
		if (value) {
			this.value(value)
		}
	}

	// Get the styling attributes.
	// The values of the children that may have been changed by the custom funcs should be added.
	styles() : Record<string, string>;
	styles(style_dict: Record<string, any>) : this;
	styles(style_dict?: Record<string, any>) : this | Record<string, string> {
		if (style_dict == null) {
			let styles = super.styles();
			styles["--input-background"] = this.container.background();
			styles["--input-padding"] = this.container.padding();
			styles["--input-border-radius"] = this.container.border_radius();
			styles["--input-border-color"] = this.container.border_color();
            styles["--input-hover-border-color"] = this._hover_border_color;
			styles["--image-mask-color"] = this._mask_color;
			styles["--image-size"] = this.image.width().toString();
			styles["--image-margin-right"] = this.image.margin_right().toString();
			styles["--image-margin-left"] = this.image.margin_left().toString();
			styles["--image-alt"] = this.image.alt() || "VWeb";
			styles["--focus-color"] = this._focus_color;
			styles["--missing-color"] = this._missing_color;
			return styles;
		} else {
			return super.styles(style_dict);
		}
	}

	// Set default since it inherits an element.
	set_default() : this {
		return super.set_default(ExtendedInputElement);
	}

	// Set the focus color.
	focus_color(): string; 
	focus_color(val: string): this;
	focus_color(val?: string): string | this {
		if (val == null) { return this._focus_color ?? ""; }
		this._focus_color = val;
		return this;
	}

	// Set the missing color.
	missing_color(): string; 
	missing_color(val: string): this;
	missing_color(val?: string): string | this {
		if (val == null) { return this._missing_color ?? ""; }
		this._missing_color = val;
		this.error.color(this._missing_color);
		return this;
	}

	// Set missing.
	missing(): boolean;
	missing(to: boolean, err?: string): this;
	missing(to?: boolean, err: string = "Incomplete field"): boolean | this {
        if (to == null) { return this.is_missing; }
		else if (to === true) {
            this.is_missing = true;
			this.input_border.border_color(this._missing_color)
			// this.container.outline(`1px solid ${this._missing_color}`)
			this.container.box_shadow(`0 0 0 3px ${this._missing_color}80`)
			// this.image.mask_color(this._missing_color)
			this.error.show();
			if (err) {
				this.error.text(err);
			}
		} else {
            this.is_missing = false;
			this.input_border.border_color(this._initial_border_color)
			// this.container.outline("0px solid transparent")
			this.container.box_shadow(`0 0 0 0px transparent`)
			// this.image.mask_color(this._mask_color)
			this.error.hide();
		}
		return this;
	}
	set_error(err: string = "Incomplete field"): this {
		return this.missing(true, err);
	}

	// Submit the item, throws an error when the item is not defined.
	submit(): string {
		const value = this.value();
		console.log("id:", this.id(), "value:", value)
		if (value == null || value === "") {
			this.missing(true);
			throw Error("Fill in all the required fields.");
		}
		this.missing(false);
		return value;
	}

	// Set or get the mask color.
	mask_color(): string;
	mask_color(val: string): this;
	mask_color(val?: string): this | string {
		if (val == null) { return this._mask_color ?? ""; }
		this._mask_color = val;
		this.image.mask_color(this._mask_color);
		return this;
	}

	// Show error.
	show_error(err: string = "Incomplete field"): this {
		this.missing(true, err);
		return this;
	}

	// Hide error.
	hide_error(): this {
		this.missing(false);
		return this;
	}

	// ---------------------------------------------------------
	// Relay functions.

    readonly(): boolean;
    readonly(val: boolean): this;
    readonly(val?: boolean): boolean | this { if (val == null) { return this.input.readonly(); } this.input.readonly(val); return this; }

	text(): string;
	text(val: string): this;
	text(val?: string): string | this { if (val == null) { return this.label.text(); } this.label.text(val); return this; }

	value(): string;
	value(val: string): this;
	value(val?: string): string | this { if (val == null) { return this.input.value(); } this.input.value(val); return this; }

	required(): boolean;
	required(val: boolean): this;
	required(val?: boolean): boolean | this { if (val == null) { return this.input.required(); } this.input.required(val); return this; }

	on_enter(): undefined | ElementKeyboardEvent<this>;
	on_enter(val: ElementKeyboardEvent<this>): this;
	on_enter(val?: ElementKeyboardEvent<this>): this | undefined | ElementKeyboardEvent<this> {
		if (val == null) { return this.input.on_enter() as undefined | ElementKeyboardEvent<this>; }
		this.input.on_enter((x, y) => val(this, y));
		return this;
	}

	on_input(): undefined | ElementEvent<this>;
	on_input(val: ElementEvent<this>): this;
	on_input(val?: ElementEvent<this>): undefined | ElementEvent<this> | this {
		if (val == null) { return this.input.on_input() as undefined | ElementEvent<this>; }
		this.input.on_input((x, y) => val(this, y));
		return this;
	}

	border_radius(): string;
	border_radius(val: string): this;
	border_radius(val?: string): string | this { if (val == null) { return this.container.border_radius(); } this.container.border_radius(val); this.input_border.border_radius(val); return this; }

	border_color(): string;
	border_color(val: string): this;
	border_color(val?: string): string | this {
		if (val == null) { return this.container.border_color(); }
		this._initial_border_color = val;
		this.container.border_color(val);
		this.input_border.border_color(val);
		return this;
	}

    hover_border_color(): string;
    hover_border_color(val: string): this;
    hover_border_color(val ?: string): string | this {
        if (val == null) { return this._hover_border_color; }
        this._hover_border_color = val;
        return this;
    }

	border_width(): string;
	border_width(val: string): this;
	border_width(val?: string): string | this { if (val == null) { return this.container.border_width(); } this.container.border_width(val); this.input_border.border_width(val); return this; }

	border_style(): string;
	border_style(val: string): this;
	border_style(val?: string): string | this { if (val == null) { return this.container.border_style(); } this.container.border_style(val); this.input_border.border_style(val); return this; }

	background(): string;
	background(val: string): this;
	background(val?: string): string | this { if (val == null) { return this.container.background(); } this.container.background(val); return this; }

	padding(): string;
	padding(value: undefstrnr): this;
	padding(top_bottom: undefstrnr, left_right: undefstrnr): this;
	padding(top: undefstrnr, right: undefstrnr, bottom: undefstrnr, left: undefstrnr): this;
	padding(...values) {
		if (values.length === 0 || (values.length === 1 && values[0] == null)) { return this.container.padding(); }
		this.container.padding(...values as [number, string]);
		return this;
	}

	border(): string;
	border(value: string): this;
	border(width: string | number, color: string): this;
	border(width: string | number, style: string, color: string): this;
	border(...args: (string | number)[]): this | string {
		if (args.length === 0 || (args.length === 1 && args[0] == null)) { return this.input_border.border(); }
		this.input_border.border(...args as [number, string]);
		return this;
	}
}
export const ExtendedInput = Elements.wrapper(ExtendedInputElement);
export const NullExtendedInput = Elements.create_null(ExtendedInputElement);
declare module './any_element.d.ts' { interface AnyElementMap { ExtendedInputElement: ExtendedInputElement }}

interface ExtendedSelectItem {
	id: string;
	text?: string;
	image?: null;
	stack?: HStackElement;
}
type ExtendedSelectOnChange = (element: ExtendedSelectElement, id: string) => any;

// Extended input.
@Elements.create({
    name: "ExtendedSelectElement",
    default_style: {
        ...VStackElement.default_style,
        "color": "inherit",
        "font-size": "16px",
        "background": "#FFFFFF",
        // Custom.
        "--input-padding": "12px 6px",
        "--input-border-radius": "5px",
        "--input-border-color": "gray",
        "--image-mask-color": "#000",
        "--image-size": "20px",
        "--image-margin-right": "10px",
        "--image-margin-left": "5px",
        "--image-alt": "VWeb",
        "--hover-bg": "#00000007",
        "--focus-color": "#8EB8EB",
        "--missing-color": "#E8454E",
    }
})
export class ExtendedSelectElement extends (VStackElement as any as VElementBaseSignature) {

	public _focus_color: string;
	public _missing_color: string;
	public _mask_color: string;
	public _border_color: string;
	public _hover_bg: string;

	public items: ExtendedSelectItem[];

	// @ts-expect-error
	public label: TextElement;
	public image: ImageMaskElement;
	public input: InputElement;
	public container: HStackElement;
	public error: TextElement;
	public dropdown: ScrollerElement;
    public is_missing = false;

	public _on_change_callback?: ExtendedSelectOnChange;

	private _on_dropdown_close: any;

	public _dropdown_height?: string | number;
	public _value?: string;

	// Constructor.
	constructor({
		label = undefined,
		image = undefined,
		alt = "",
		placeholder = "Placeholder",
		id = undefined,
		required = false,
		items = [{id: "option", text: "Option", image: undefined}], // may also be an array with strings which will be used as the item's id and text.
	}: {
		label?: string,
		image?: string,
		alt?: string,
		placeholder?: string,
		id?: string,
		required?: boolean,
		items: ExtendedSelectItem[] | Record<string, string> | Record<string, ExtendedSelectItem>,
	}) {

		// Initialize super.
		super();
		this._init({
			derived: ExtendedSelectElement,
		})

		// Arguments.
		if (Array.isArray(items)) {
			this.items = [];
			items.iterate((item) => {
				if (typeof item === "string") {
					this.items.append({
						id: item,
						text: item,
					})
				} else {
					if (item.text == null) {
						item.text = item.id;
					}
					this.items.append(item)
				}
			});
		} else if (typeof items === "object" && items != null) {
			this.items = [];
			Object.keys(items).iterate((key) => {
				if (typeof items[key] === "string") {
					this.items.append({
						id: key,
						text: items[key],
					});
				} else {
					this.items.append({
						...items[key],
						id: key, 
					});
				}
			})
		} else {
            throw Error(`Parameter "items" should be a defined value of type "array" or "object".`);
		}

		// Attributes.
		this._focus_color = ExtendedSelectElement.default_style["--focus-color"];
		this._missing_color = ExtendedSelectElement.default_style["--missing-color"];
		this._mask_color = ExtendedSelectElement.default_style["--image-mask-color"];
		this._border_color = ExtendedSelectElement.default_style["--input-border-color"];
		this._hover_bg = ExtendedSelectElement.default_style["--hover-bg"]

		// Set default styling.
		this.styles(ExtendedSelectElement.default_style);

		// Title element.
		this.label = Text(label)
			.parent(this)
			.font_size("inherit")
			.margin(0, 0, 7.5, 0)
			.color("inherit")
			.width("fit-content")
			.ellipsis_overflow(true)
		if (label == null) {
			this.label.hide();
		}

		// Title element.
		this.image = ImageMask(image)
			.parent(this)
            .mask_color(this._mask_color)
            .frame(ExtendedSelectElement.default_style["--image-size"], ExtendedSelectElement.default_style["--image-size"])
            .margin(0)
            .margin_right(ExtendedSelectElement.default_style["--image-margin-right"])
            .margin_left(ExtendedSelectElement.default_style["--image-margin-left"])
            .alt(alt ? alt : ExtendedSelectElement.default_style["--image-alt"]);
        if (image == null) {
			this.image.hide();
		}

		// Input element.
		this.input = Input(placeholder)
			.parent(this)
			.color("inherit")
			.readonly(true)
			.font_size("inherit")
			.margin(0)
			.width("100%")
			.stretch(true)
			.outline("none")
			.padding(0, 5)
			.line_height("1.6em")
			.box_shadow("none")
			.cursor("pointer")
			.border_radius(0) // is required

		// The hstack container.
		this.container = HStack(
			VStack(
				this.image,
			)
            .width("fit-content")
			.height("1.6em")
			.center_vertical(),
			this.input,
		)
		.parent(this)
		.background(ExtendedSelectElement.default_style["background"])
		.padding(ExtendedSelectElement.default_style["--input-padding"])
		.border_radius(ExtendedSelectElement.default_style["--input-border-radius"])
		.border_width(1)
		.border_style("solid")
		.border_color(this._border_color)
		.transition("outline 0.2s ease-in-out, box-shadow 0.2s ease-in-out")
		.outline("0px solid transparent")
		.box_shadow(`0 0 0 0px transparent`)
		.width("100%")
		.on_click(() => {
			if (this.dropdown.is_hidden()) {
				this.expand();
			}
		})

		// The error message.
		this.error = Text("Incomplete field")
			.color(this._missing_color)
			.font_size("0.8em")
			.margin(7.5, 0, 0, 2.5)
			.padding(0)
			.leading()
			.hide()

		// The dropdown menu.
		this.dropdown = Scroller()
			.parent(this)
			.position(0, null, null, null)
			.background(ExtendedSelectElement.default_style["background"])
			.border_radius(ExtendedSelectElement.default_style["--input-border-radius"])
			.border_width(1)
			.border_style("solid")
			.border_color(this._border_color)
			.box_shadow("0px 0px 5px #00000050")
			.frame("100%", "100%")
			.z_index(10)
			.hide()

		// Append.
		this.append(this.label, this.container, this.error, this.dropdown);

		// Styling.
		this.position("relative")
		this.overflow("visible");
		super.background("none")

		// Set id.
		if (id != null) {
			this.id(id);
		}

		// Set required.
		if (required) {
			this.required(required);
		}

		// On dropdown close event by mouse down.
		this._on_dropdown_close = (event) => {
			let parent = event.target.parentElement;
			let stop = true;
			for (let i = 0; i < 4; i++) {
				if (parent == null) { break; }
				else if (parent === this.dropdown) {
					stop = false; break;
				}
				parent = parent.parentElement;
			}
			if (stop) {
				this.dropdown.hide();
				window.removeEventListener("mousedown", this._on_dropdown_close)
			}
		}
	}

    // readonly(): boolean;
    // readonly(val: boolean): this;
    // readonly(val?: boolean): boolean | this { if (val == null) { return this.input.readonly(); } this.input.readonly(val); return this; }

	// Set dropdown height.
	dropdown_height(): undefined | string | number;
	dropdown_height(val: string | number): this;
	dropdown_height(val?: string | number): this | undefined | string | number {
		if (val === undefined) {
			return this._dropdown_height;	
		}
		this._dropdown_height = val;
		return this;
	}

	// Get the styling attributes.
	// The values of the children that may have been changed by the custom funcs should be added.
	styles() : Record<string, string>;
	styles(style_dict: Record<string, any>) : this;
	styles(style_dict?: Record<string, any>) : this | Record<string, string> {
		if (style_dict == null) {
			let styles = super.styles();
			styles["--input-padding"] = this.container.padding();
			styles["--input-border-radius"] = this.container.border_radius();
			styles["--input-border-color"] = this._border_color;
			styles["--image-mask-color"] = this._mask_color;
			styles["--image-size"] = this.image.width().toString();
			styles["--image-margin-right"] = this.image.margin_right().toString();
			styles["--image-margin-left"] = this.image.margin_left().toString();
			styles["--image-alt"] = this.image.alt() || "VWeb";
			styles["--focus-color"] = this._focus_color;
			styles["--missing-color"] = this._missing_color;
			return styles;
		} else {
			return super.styles(style_dict);
		}
	}

	// Set default since it inherits an element.
	set_default(): this {
		return super.set_default(ExtendedSelectElement);
	}

	// Set the focus color.
	focus_color(): string; 
	focus_color(val: string): this;
	focus_color(val?: string): string | this {
		if (val == null) { return this._focus_color ?? ""; }
		this._focus_color = val;
		return this;
	}

	// Set the missing color.
	missing_color(): string; 
	missing_color(val: string): this;
	missing_color(val?: string): string | this {
		if (val == null) { return this._missing_color ?? ""; }
		this._missing_color = val;
		this.error.color(this._missing_color);
		return this;
	}

	// Set missing.
	missing(): boolean;
	missing(to: boolean, err?: string): this;
	missing(to?: boolean, err: string = "Incomplete field"): boolean | this {
        if (to == null) { return this.is_missing; }
		else if (to === true) {
            this.is_missing = true;
			this.container.outline(`1px solid ${this._missing_color}`)
			this.container.box_shadow(`0 0 0 3px ${this._missing_color}80`)
			this.image.mask_color(this._missing_color)
			this.error.show();
			if (err) {
				this.error.text(err);
			}
		} else {
            this.is_missing = false;
			this.container.outline("0px solid transparent")
			this.container.box_shadow(`0 0 0 0px transparent`)
			this.image.mask_color(this._mask_color)
			this.error.hide();
		}
		return this;
	}
	set_error(err: string = "Incomplete field"): this {
		return this.missing(true, err);
	}

	// Submit the item, throws an error when the item is not defined.
	submit(): string {
		const value = this.value();
		if (value == null || value === "") {
			this.missing(true);
			throw Error("Fill in all the required fields.");
		}
		this.missing(false);
		return value;
	}

	// Expand dropdown.
	expand(): this {

		// Add event listener.
		window.addEventListener("mousedown", this._on_dropdown_close);

		// Clear.
		this.dropdown.remove_children();

		// Set top.
		// this.dropdown.top(this.label.clientHeight + this.container.clientHeight + (this.label.is_hidden() ? 0 : 5) + 5)
		this.dropdown.top(this.label.clientHeight + (this.label.is_hidden() ? 0 : 5))

		// Search bar.
		const search = Input("Search")
			.color("inherit")
			.font_size("inherit")
			.margin(10)
			.padding(0)
			.width("calc(100% - 20px)")
			.outline("none")
			.box_shadow("none")
			.border_radius(0)
			.on_input((e, event) => {
				const query = e.value();
				if (query.length === 0) {
					content.inner_html("");
					this.items.iterate((item) => {
						content.append(item.stack);
					})
				} else {
					const results = fuzzy.search({
						query, 
						targets: this.items, 
						limit: undefined,
						case_match: false,
						allow_exceeding_chars: true,
						key: ["id", "text"], 
					});
					content.inner_html("");
					results.iterate((item) => {
						content.append(item.stack);
					})
				}
			})

		// The content.
		const content = VStack()
			.frame("100%")
			.padding(5, 0)

		// Add children.
		let i = 0;
		let min_height;
		// this.dropdown.items = [];
		this.items.iterate((item) => {

			// Image.
			let img;
			if (item.image != null) {
				img = ImageMask(item.image)
		            .mask_color(this._mask_color)
		            .frame(ExtendedSelectElement.default_style["--image-size"], ExtendedSelectElement.default_style["--image-size"])
		            .margin(0)
		            .margin_right(ExtendedSelectElement.default_style["--image-margin-right"])
		            .margin_left(ExtendedSelectElement.default_style["--image-margin-left"])
		            .alt(ExtendedSelectElement.default_style["--image-alt"])
		            .pointer_events("none") // so target element of mouse down is easier.
		    }

		    // Text.
		    const text = Text(item.text)
		    	.color("inherit")
				.font_size("inherit")
				.white_space("pre")
				.margin(0)
				.width("100%")
				.stretch(true)
				.pointer_events("none") // so target element of mouse down is easier.

			// Stack.
			const stack = HStack(img, text)
				.width("100%")
				.padding(5, 10)
				.background("transparent")
				.transition("background 0.2 ease-in-out")
				.on_click(() => {
					this.dropdown.hide();
					this._value = item.id;
					this.input.value(item.text ?? item.id);
					if (this._on_change_callback != null) {
						this._on_change_callback(this, item.id);
					}
					window.removeEventListener("mousedown", this._on_dropdown_close)
				})
				.on_mouse_over((e) => e.background(this._hover_bg))
				.on_mouse_out((e) => e.background("transparent"))

			// Update the item with the stack for searches.
			item.stack = stack;

			// Append.
			content.append(stack);

			// Increment.
			++i;

		})

		// Show search bar or just show everything.
		if (this.items.length > 15) {
			this.dropdown.append(
				search,
				Divider()
					.margin(0)
					.background(this._border_color),
				content,
			);
		} else {
			this.dropdown.append(content);
		}

		// Show dropdown.
		this.dropdown.show();

		// Select
		if (this.items.length > 15) {
			search.select();
		}

		// Set min height.
		if (this._dropdown_height !== undefined) {
			this.dropdown.fixed_height(this._dropdown_height);
		}
		else if (this.items.length > 15) {
			this.dropdown.fixed_height((this.dropdown.content.child(0).clientHeight) * Math.min(this.items.length, 10) + 10)
		}
		else {
			this.dropdown.fixed_height((this.dropdown.content.child(0).child(0).clientHeight) * Math.min(this.items.length, 10) + 10)
		}
		// this.dropdown.min_height((this.dropdown.content.child(0).clientHeight + 10) * Math.min(this.items.length, 10) + 10) // old.

		// Response.
		return this;
	}

	// Get or set the value, when it is being set it should be the id of one of the items otherwise nothing happens.
	value(): string;
	value(val: string): this;
	value(val?: string): string | this {
		if (val == null) { return this._value ?? ""; }
		this.items.iterate((item) => {
			if (item.id === val) {
				this._value = val;
				this.input.value(item.text ?? item.id);
				if (this._on_change_callback != null) {
					this._on_change_callback(this, val);
				}
			}
		})
		return this;
	}

	// Styling.
	mask_color(): string;
	mask_color(val: string): this;
	mask_color(val?: string): string | this {
		if (val == null) { return this._mask_color; }
		this._mask_color = val;
		this.image.mask_color(this._mask_color);
		return this;
	}

	background(): string;
	background(val: string): this;
	background(val?: string): string | this {
		if (val == null) { return this.background(); }
		this.container.background(val)
		this.dropdown.background(val)
		return this;
	}

	border_radius(): string;
	border_radius(val: string | number): this;
	border_radius(val?: string | number): string | this {
		if (val == null) { return this.container.border_radius(); }
		this.container.border_radius(val);
		this.dropdown.border_radius(val);
		return this;
	}

	border_color(): string;
	border_color(val: string): this;
	border_color(val?: string): string | this {
		if (val == null) { return this._border_color; }
		this._border_color = val;
		this.container.border_color(this._border_color);
		this.dropdown.border_color(this._border_color);
		return this;
	}

	border_width(): string;
	border_width(val: number | string): this;
	border_width(val?: number | string): string | this {
		if (val == null) { return this.container.border_width(); }
		this.container.border_width(val);
		this.dropdown.border_width(val);
		return this;
	}

	border_style(): string;
	border_style(val: string): this;
	border_style(val?: string): string | this {
		if (val == null) { return this.container.border_style(); }
		this.container.border_style(val);
		this.dropdown.border_style(val);
		return this;
	}

	padding(): string;
	padding(value: undefstrnr): this;
	padding(top_bottom: undefstrnr, left_right: undefstrnr): this;
	padding(top: undefstrnr, right: undefstrnr, bottom: undefstrnr, left: undefstrnr): this;
	padding(...values) {
		if (values.length === 0 || (values.length === 1 && values[0] == null)) { return this.container.padding(); }
		this.container.padding(...values as [number, string]);
		this.dropdown.padding(...values as [number, string]);
		return this;
	}

	border(): string;
	border(value: string): this;
	border(width: string | number, color: string): this;
	border(width: string | number, style: string, color: string): this;
	border(...args: (string | number)[]): this | string {
		if (args.length === 0 || (args.length === 1 && args[0] == null)) { return this.container.border(); }
		this.container.border(...args as [number, string]);
		this.dropdown.border(...args as [number, string]);
		return this;
	}

	// On change event.
	// @ts-expect-error
	on_change() : undefined | ExtendedSelectOnChange;
	// @ts-expect-error
	on_change(callback: ExtendedSelectOnChange) : this;
	// @ts-expect-error
	on_change(callback?: ExtendedSelectOnChange) : undefined | ExtendedSelectOnChange | this {
		if (callback == null) { return this._on_change_callback; }
		this._on_change_callback = callback;
		return this;
	}

	// ---------------------------------------------------------
	// Relay functions.

	text(): string;
	text(val: string): this;
	text(val?: string): string | this { if (val == null) { return this.label.text(); } this.label.text(val); return this; }

	required(): boolean;
	required(val: boolean): this;
	required(val?: boolean): boolean | this { if (val == null) { return this.input.required(); } this.input.required(val); return this; }
}
export const ExtendedSelect = Elements.wrapper(ExtendedSelectElement);
export const NullExtendedSelect = Elements.create_null(ExtendedSelectElement);
declare module './any_element.d.ts' { interface AnyElementMap { ExtendedSelectElement: ExtendedSelectElement }}