/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Elements, VElementBaseSignature, VElement } from "../elements/module.js"
import { VStack, VStackElement, HStack, HStackElement } from "./stack"
import { Text, TextElement } from "./text"

// Interfaces.
interface CircleExtension {
	enabled: boolean;
	toggle(): this;
	value(to?: boolean): this;
	inner: VStackElement;
}

// Extended input.
@Elements.create({
    name: "CheckBoxElement",
    default_style: {
        ...VStackElement.default_style,
        "color": "inherit",
        "font-size": "16px",
        // Custom.
        "--circle-border-color": "gray",
        "--circle-inner-bg": "#FFFFFF",
        "--focus-color": "#8EB8EB",
        "--missing-color": "#E8454E",
    },
})
export class CheckBoxElement extends (VStackElement as any as VElementBaseSignature) {

    // Attributes.
	public _border_color: string;
	public _inner_bg: string;
	public _focus_color: string;
	public _missing_color: string;
	public _missing: boolean;
	public _required: boolean;
	private _circle: VStackElement & CircleExtension;
	// @ts-expect-error
	public text: TextElement;
	// @ts-expect-error
	public content: HStackElement;
	public error: TextElement;

	// Constructor.
	constructor(text_or_obj: string | {
		text: string,
		required: boolean,
		id?: string,
	} = {
		text: "",
		required: false,
		id: undefined,
	}) {

		// Initialize super.
		super();
		this._init({
			derived: CheckBoxElement,
		})

		// Args.
		let text: string = text_or_obj as string, required = false, id: string | undefined = undefined;
		if (typeof text_or_obj === "object" && text_or_obj != null) {
			text = text_or_obj.text;
			required = text_or_obj.required == null ? false : text_or_obj.required;
			id = text_or_obj.id == null ? undefined : text_or_obj.id;
		}

		// Attributes.
		this._border_color = CheckBoxElement.default_style["--circle-border-color"];
		this._inner_bg = CheckBoxElement.default_style["--circle-inner-bg"];
		this._focus_color = CheckBoxElement.default_style["--focus-color"];
		this._missing_color = CheckBoxElement.default_style["--missing-color"];
		this._missing = false;
		this._required = false;

		// Circle element.
		const _this = this;
		this._circle = VStack(
				VStack()
				.assign_to_parent_as("inner")
				.border_radius("50%")
				.frame("35%", "35%")
				.background(this._inner_bg)
				.flex_shrink(0)
			)
			.assign_to_parent_as("circle")
			.flex_shrink(0)
			.border_width(1)
			.border_style("solid")
			.border_color(this._border_color)
			.border_radius("50%")
			.frame(15, 15)
			.margin(2.5, 10, 0, 0)
			.background("transparent")
			.box_shadow(`0 0 0 0px transparent`)
			.transition("background 0.3s ease-in-out, box-shadow 0.2s ease-in-out")
			.center()
			.center_vertical()
			.on_mouse_over((e) => e.box_shadow(`0 0 0 2px ${this._focus_color}`))
			.on_mouse_out((e) => e.box_shadow(`0 0 0 0px transparent`))
			.on_click((e) => e.toggle())
			.extend(
				{
					enabled: false,
					toggle() {
						return this.value(!this.enabled);
					},
					value(to = null) { 
						if (to == null) { return this.enabled; }
						else if (to === true) {
							this.enabled = true;
							this.background(_this._focus_color);
							_this.missing(false);
						} else {
							this.enabled = false;
							this.background("transparent");
						}
						return this;
					},
				} as VStackElement & CircleExtension
			);

		// Text element.
		this.text = Text(text) // dont use innerHTML
			.font_size("inherit")
			.color("inherit")
			.padding(0)
			.margin(0)

		// The content.
		this.content = HStack(this._circle, this.text)
			.width("100%")

		// The error message.
		this.error = Text("Incomplete field")
			.color(this._missing_color)
			.font_size("0.8em")
			.margin(5, 0, 0, 2.5)
			.padding(0)
			.hide()

		// Append.
		this.append(this.content, this.error);

		// Set id.
		if (id !== undefined) {
			this.id(id);
		}

		// Set required.
		if (required) {
			this.required(required);
		}
	}

	// Set the focus color.
	border_color(): string;
	border_color(val: string) : this
	border_color(val?: string) : this | string {
		if (val == null) { return this._border_color; }
		this._border_color = val;
		this._circle.border_color(this._border_color);
		return this;
	}

	// Set the focus color.
	inner_bg(): string;
	inner_bg(val: string) : this
	inner_bg(val?: string) : this | string {
		if (val == null) { return this._inner_bg; }
		this._inner_bg = val;
		this._circle.inner.background(this._inner_bg);
		return this;
	}

	// Get the styling attributes.
	// The values of the children that may have been changed by the custom funcs should be added.
	styles() : Record<string, string>;
	styles(style_dict: Record<string, any>) : this;
	styles(style_dict?: Record<string, any>) : Record<string, string> | this {
		if (style_dict == null) {
			let styles = super.styles();
			styles["--circle-inner-bg"] = this._inner_bg;
			styles["--circle-border-color"] = this._border_color;
			styles["--focus-color"] = this._focus_color;
			styles["--missing-color"] = this._missing_color;
			return styles;
		} else {
			return super.styles(style_dict);
		}
	}

	// Set default since it inherits an element.
	set_default() : this {
		return super.set_default(CheckBoxElement);
	}

	// Toggle value.
	toggle() : this {
		this._circle.toggle();
		return this;
	}

	// Get or set the value.
	// @ts-expect-error
	value(): boolean;
	// @ts-expect-error
	value(to: boolean): this;
	// @ts-expect-error
	value(to?: boolean): this | boolean { 
		if (to == null) { return this._circle.enabled; }
		this._circle.value(to);
		return this;
	}

	// Get or set the value.
	required(): boolean;
	required(to: boolean): this;
	required(to?: boolean): this | boolean { 
		if (to == null) { return this._required; }
		this._required = to;
		return this;
	}

	// Set the focus color.
	focus_color(): string;
	focus_color(val: string): this;
	focus_color(val?: string): this | string {
		if (val == null) { return this._focus_color; }
		this._focus_color = val;
		return this;
	}

	// Set the missing color.
	missing_color(): string;
	missing_color(val: string): this;
	missing_color(val?: string): this | string {
		if (val == null) { return this._missing_color; }
		this._missing_color = val;
		return this;
	}

	// Set missing.
	missing(): boolean;
	missing(to: boolean): this;
	missing(to: boolean = true): this | boolean {
		if (to == null) { return this._missing; }
		else if (to === true) {
			this._missing = true;
			this._circle.outline(`1px solid ${this._missing_color}`)
			this._circle.box_shadow(`0 0 0 3px ${this._missing_color}80`)
			this.error.color(this._missing_color);
			this.error.show();
		} else {
			this._missing = false;
			this._circle.outline("0px solid transparent")
			this._circle.box_shadow(`0 0 0 0px transparent`)
			this.error.hide();
		}
		return this;
	}

	// Submit the item, throws an error when the item is not enabled.
	submit() : boolean {
		const value = this.value();
		if (value !== true) {
			this.missing(true);
			throw Error("Fill in all the required fields.");
		}
		this.missing(false);
		return value;
	}
}
export const CheckBox = Elements.wrapper(CheckBoxElement);
export const NullCheckBox = Elements.create_null(CheckBoxElement);
declare module './any_element.d.ts' { interface AnyElementMap { CheckBoxElement: CheckBoxElement }}