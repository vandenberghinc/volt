/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */

// Imports.
import { Elements, VElementBaseSignature, VElement } from "../elements/module.js"
import type { None, BorderOpts } from "../elements/types.js"
import { VStack, VStackElement } from "./stack.js"

export namespace SwitchElement {
    export type OnChangeCallback<This> = (element: This, enabled: boolean) => void;
}

// Override signature.
// @ts-ignore
export interface SwitchElement extends Omit<VStackElement, "value"> {
    value(): boolean;
    value(value: boolean, animate?: boolean): this;
}

// Switch button.
@Elements.create({
    name: "SwitchElement",
})
export class SwitchElement extends VStackElement {
// export class SwitchElement extends (VStackElement as any as VElementBaseSignature) {

	// Attributes.
    public on_change_handler: SwitchElement.OnChangeCallback<this>;
	public _enabled: boolean;
	public _enabled_color: string;
	public _disabled_color: string
	public enabled: boolean;
	public slider: VStackElement;
	public button: VStackElement;
	public _value_timeout: any;

	// Constructor.
	constructor(enabled: boolean = false) {
		
		// Initialize base class.
		super();
		this._init({
            derived: SwitchElement,
        });
		
		// The slider background.
		this.slider = VStack()
	        .background("white")
	        // .border(`1px solid ${SETTINGS.theme.lightest_widget_background}90`)
	        .frame(35, 12.5)
	        .border_radius(10)
	        .overflow("visible")
	        .box_shadow(`0px 0px 2px #00000030`)
	        .parent(this)

	    // The button.
        this.button = VStack()
            .border_radius("50%")
            .frame(17.5, 17.5)
            .background("gray")
            .position("absolute")
            .left(0)
            .transition("left 0.15s ease-out")
            .box_shadow(`0px 0px 2px #00000060`)
            .on_click(() => this.toggle())
            .parent(this)

        // Append.
        this.append(this.slider, this.button);

        // Styling.
        this.position("relative")
        this.width(35)
        this.flex_shrink(0)
        this.center_vertical()

        // On change handler.
        this.on_change_handler = (a, b) => {};

        // Attributes.
        this._enabled = enabled;
        this._enabled_color = "green";
        this._disabled_color = "gray";

        // Alias func.
        // @ts-ignore
        this.enabled = this.value;

        // Set enabled value.
        this.value(enabled, false);

        // Set default theme update.
        this.on_theme_update(() => {
        	this.value(this._enabled, false);
        })
    }

    // Set default since it inherits an element.
	set_default() : this {
		return super.set_default(SwitchElement);
	}

    // Set width.
    width() : number | string;
    width(value: number | string) : this;
	width(value?: number | string) : this | number | string {
		if (value == null) {
			return super.width();
		}
		super.width(value);
		this.slider.width(value);
		return this;
	}
	min_width() : number | string;
	min_width(value: number | string) : this;
	min_width(value?: number | string) : this | number | string {
		if (value == null) {
			return super.min_width();
		}
		super.min_width(value);
		this.slider.min_width(value);
		return this;
	}
	max_width() : number | string;
	max_width(value: number | string) : this;
	max_width(value?: number | string) : this | number | string {
		if (value == null) {
			return super.max_width();
		}
		super.max_width(value);
		this.slider.max_width(value);
		return this;
	}

	// Set width.
	height() : number | string;
	height(value: number | string) : this;
	height(value?: number | string) : this | number | string {
		if (value == null) {
			return super.height();
		}
		super.height(value);
		this.slider.height(typeof value === "string" ? "50%" : value / 2);
		return this;
	}
	min_height() : number | string;
	min_height(value: number | string) : this;
	min_height(value?: number | string) : this | number | string {
		if (value == null) {
			return super.min_height();
		}
		super.min_height(value);
		this.slider.min_height(typeof value === "string" ? "50%" : value / 2);
		return this;
	}
	max_height() : number | string;
	max_height(value: number | string) : this;
	max_height(value?: number | string) : this | number | string {
		if (value == null) {
			return super.max_height();
		}
		super.max_height(value);
		this.slider.max_height(typeof value === "string" ? "50%" : value / 2);
		return this;
	}

	// Frame.
	frame(width?: number | string, height?: number | string) : this {
		if (width != null) {
			this.width(width);
		}
		if (height != null) {
			this.height(height);
		}
		return this;
	}
	min_frame(width?: number | string, height?: number | string) : this {
		if (width != null) {
			this.min_width(width);
		}
		if (height != null) {
			this.min_height(height);
		}
		return this;
	}
	max_frame(width?: number | string, height?: number | string) : this {
		if (width != null) {
			this.max_width(width);
		}
		if (height != null) {
			this.max_height(height);
		}
		return this;
	}

    // Forward background to slider.
    background(): string;
    background(value: string): this;
    background(value?: string): this | string {
        if (value == null) {
            return this.slider.background();
        }
        this.slider.background(value);
        return this;
    }

    // Get or set the enabled color.
    enabled_color() : string
    enabled_color(value: string) : this
    enabled_color(value?: string) : this | string {
    	if (value == null) {
    		return this._enabled_color;
    	}
    	this._enabled_color = value;
    	return this;
    }

    // Get or set the disabled color.
    disabled_color() : string
    disabled_color(value: string) : this
    disabled_color(value?: string) : this | string {
    	if (value == null) {
    		return this._disabled_color;
    	}
    	this._disabled_color = value;
    	return this;
    }

    // Toggle the value.
    toggle() : this {
    	return this.value(!this._enabled);
    }

    // Get or set the enabled boolean value.
    // @deprecated when used outside this class TS doesnt detect it and VElement.value is used instead, resulting in an error.
    // @ts-ignore
    value() : boolean;
    // @ts-ignore
    value(value: boolean, animate: boolean = true) : this;
    // @ts-ignore
    value(value?: boolean, animate: boolean = true) : this | boolean {
        if (value == null) {
            return this._enabled;
        }
        else if (value === true) {
            this._enabled = value;
            if (animate) {
            	clearTimeout(this._value_timeout);
            	this._value_timeout = setTimeout(() => this.button.background(this._enabled_color), 140);
            } else {
            	this.button.background(this._enabled_color);
            }
            const slider_width = this.slider.getBoundingClientRect().width;
            const button_width = this.button.getBoundingClientRect().width;
            if (slider_width && button_width) {
            	this.button.style.left = `${slider_width - button_width}px`;
            	this.button.style.right = "auto";
            } else {
            	this.button.style.left = "auto";
            	this.button.style.right = "0px";
            }
            this.on_change_handler(this, this._enabled);
        }
        else if (value === false) {
            this._enabled = value;
            if (animate) {
            	clearTimeout(this._value_timeout);
            	this._value_timeout = setTimeout(() => this.button.background(this._disabled_color), 140);
            } else {
            	this.button.background(this._disabled_color);
            }
        	const slider_width = this.slider.getBoundingClientRect().width;
            const button_width = this.button.getBoundingClientRect().width;
            if (slider_width && button_width) {
            	if (this.button.style.left === "auto") { // otherwise the transition does not show when it was initialized as true.
            		this.button.style.left = `${slider_width - button_width}px`; 
            		setTimeout(() => {
            			this.button.style.right = "auto"; 
	            		this.button.style.left = "0px";	
            		}, 10)
            	} else {
            		this.button.style.right = "auto"; 
            		this.button.style.left = "0px";	
            	}
            } else {
            	this.button.style.left = "0px";
            	this.button.style.right = "auto";
            }
            this.on_change_handler(this, this._enabled);
        }
        return this;
    }

    // Set the on change handler.
    // @ts-expect-error
    on_change(): SwitchElement.OnChangeCallback<this>;
    // @ts-ignore
    on_change(handler: SwitchElement.OnChangeCallback<this>) : this;
    // @ts-ignore
    on_change(handler?: SwitchElement.OnChangeCallback<this>): SwitchElement.OnChangeCallback<this> | this {
    	if (handler == null) {
    		return this.on_change_handler;
    	}
    	this.on_change_handler = handler;
    	return this;
    }		

    border_color(): string;
    border_color(value: string): this;
    /**
     * {Border Color}
     * Sets the color of the four borders. This is equivalent to the CSS attribute `borderColor`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining. Unless parameter `value` is `null`,
     * then the attribute's value is returned.
     * @docs
     */
    border_color(value?: string): string | this {
        if (value == null) { return this.slider.border_color(); }
        this.slider.border_color(value);
        this.button.border_color(value);
        return this;
    }

    border_width(): string;
    border_width(value: string | number): this;
    /**
     * {Border Width}
     * Sets the width of the four borders, equivalent to the CSS attribute `borderWidth`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining, unless the parameter `value` is `null`,
     * then the attribute's value is returned.
     * @docs
     */
    border_width(value?: string | number): string | this {
        if (value == null) { return this.slider.border_width(); }
        this.slider.border_width(value);
        this.button.border_width(value);
        return this;
    }

    border_style(): string;
    border_style(value: string): this;
    /**
     * {Border Style}
     * Sets the style of the four borders. The equivalent of CSS attribute `borderStyle`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining, or the attribute's value if `value` is `null`.
     * @docs
     */
    border_style(value?: string): string | this {
        if (value == null) { return this.slider.border_style(); }
        this.slider.border_style(value);
        this.button.border_style(value);
        return this;
    }

    border(): string;
    border(value: string): this;
    border(width: string | number, color: string): this;
    border(width: string | number, style: string, color: string): this;
    border(opts: BorderOpts): this;
    /**
     * Assigns the border color of this node, also supports a `GradientType` element. 
     * @param value The value to assign. Leave `undefined` to retrieve the attribute's value.
     * @returns Returns the instance for chaining unless parameter `value` is `undefined`, then the attribute's value is returned. 
     * @docs
     */
    border(...values: any[]): this | string {
        if (values.length === 0) {
            return this.slider.border();
        }
        this.slider.border(...values as [any]);
        this.button.border(...values as [any]);
        return this;
    }
}
export const Switch = Elements.wrapper(SwitchElement);
export const NullSwitch = Elements.create_null(SwitchElement);
declare module './any_element.d.ts' { interface AnyElementMap { SwitchElement: SwitchElement }}