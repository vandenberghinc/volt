/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Elements, VElementBaseSignature, VElement, VElementTagMap } from "../elements/module.js"

// RingLoader.
// - The width and height must be in pixels.
/**
 * @docs:
 * @chapter: Frontend
 * @title: Ring Loader
 * @desc:
 * 		The ring loader element.
 */
@Elements.create({
    name: "RingLoaderElement",
    default_style: {
        "width": "80px",
        "height": "80px",
        "--child-background": "black",
        "--border-width-factor": "1",
        "display": "inline-block",
        "position": "relative",
    },
})
export class RingLoaderElement extends VElementTagMap.div {
	
	// Constructor.
	constructor() {
		
		// Initialize base class.
		super({
			derived: RingLoaderElement,
		});

		// Set default.
		this.update();
		
	}

	/**
	 * @docs:
	 * @title: Backround
	 * @desc:
	 * 		Set the background value.
	 *		Returns the attribute value when parameter `value` is `null`.
	 * @note: Dont forget to update the loader through `update()` after calling this function.
	 * @param:
	 *     @name: value
	 *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
	 * @return:
	 *     @description Returns the `RingLoaderElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
	 * @funcs: 2
	 */
	background(): string;
	background(value: string): this;
	background(value?: string): string | this {
        if (value == null) { return this.style["--child-background"]; }
        this.style["--child-background"] = value;
        return this;
    }

    color(): string;
    color(value: string): this;
    color(value?: string): string | this {
        if (value == null) { return this.style["--child-background"]; }
        this.style["--child-background"] = value;
        return this;
    }

    /**
	 * @docs:
	 * @title: Border width by factor
	 * @desc: Set the border width by factor.
	 * @note: Dont forget to update the loader through `update()` after calling this function.
	 * @param:
	 * 		@name: number
	 * 		@descr: The float border width factor.
	 * @funcs: 2
	 */
    border_width_factor(): number;
	border_width_factor(value: number): this;
	border_width_factor(value?: number): number | this {
    	if (value == null) { return this.style["--border-width-factor"] == null ? 1.0 : parseFloat(this.style["--border-width-factor"]); }
        this.style["--border-width-factor"] = value.toString();
        return this;
    }
	
	/**
	 * @docs:
	 * @title: Update
	 * @desc: Update the loader, this function needs to be called after initialization or after changing the frame, background or border.
	 */
	update() : this {
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
export const RingLoader = Elements.wrapper(RingLoaderElement);
export const NullRingLoader = Elements.create_null(RingLoaderElement);
declare module './any_element.d.ts' { interface AnyElementMap { RingLoaderElement: RingLoaderElement }}

// Alias Spinner for RingLoader.
export const SpinnerElement = RingLoaderElement;
export const SpinnerLoader = Elements.wrapper(SpinnerElement);
export const NullSpinnerLoader = Elements.create_null(SpinnerElement);
// declare module './any_element.d.ts' { interface AnyElementMap { SpinnerElement: SpinnerElement } }