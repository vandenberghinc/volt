/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Elements, VElementBaseSignature, VElement, VElementTagMap } from "../elements/module.js"
import { Utils } from "../modules/utils.js"
import { GradientType } from "../types/gradient.js"

export { GradientType };
export const Gradient = Elements.wrapper(GradientType);
export const NullGradient = Elements.create_null(GradientType);

// Gradient border.
@Elements.create({
    name: "GradientBorderElement",
    default_style: {
        "--child-border-width": "1px",
        "--child-border-radius": "10px",
        "--child-border-color": "black",
    },
})
export class GradientBorderElement extends VElementTagMap.div {

	// Constructor.
	constructor() {
		
		// Initialize base classes.
		super({
			derived: GradientBorderElement,
		});
			
		// Styling.
		this
		.content("")
		.position("absolute")
		// .z_index(-1)
		.inset(0)
		.padding(GradientBorderElement.default_style["--child-border-width"] ?? "")
		.border_radius(GradientBorderElement.default_style["--child-border-radius"] ?? "")
		.background(GradientBorderElement.default_style["--child-border-color"] ?? "")
		.mask("linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)")
		.mask_composite("exclude")
		// .mask_composite((navigator.userAgent.includes("Firefox") || navigator.userAgent.includes("Mozilla")) ? "exclude" : "xor")
		.styles({
			"-webkit-mask": "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
			"-webkit-mask-composite": (navigator.userAgent.includes("Firefox") || navigator.userAgent.includes("Mozilla")) ? "exclude" : "xor",
		})
	}

	// Border color.
	border_color() : string;
	border_color(val: string) : this;
	border_color(val?: string) : string | this {
		if (val === undefined) { return this.style.background ?? ""; }
		this.style.background = val;
		return this;
	}

	// Set the border width.
	border_width() : string;
	border_width(value: number | string) : this;
	border_width(value?: number | string) : string | this {
		if (value == null) {
			return this.padding() ?? "";
		}
		this.padding(value);
		return this;
	}
}
export const GradientBorder = Elements.wrapper(GradientBorderElement);
export const NullGradientBorder = Elements.create_null(GradientBorderElement);
declare module './any_element.d.ts' { interface AnyElementMap { GradientBorderElement: GradientBorderElement }}
