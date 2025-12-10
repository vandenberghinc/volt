/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */

// Imports.
import { Elements, VElementBaseSignature, VElement, VElementTagMap, BorderOpts } from "../elements/module.js"
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

    // @ts-ignore different signature than base.
    border(): string;
    // @ts-ignore different signature than base.
    border(width: string | number, color: string): this;
    /**
     * Assigns the border color of this node, also supports a `GradientType` element. 
     * @note This method supports a different set of parameters than the standard `VElement.border` method.
     * @param width The width of the border.
     * @param color The color of the border.
     * @returns Returns the instance for chaining unless parameter `value` is `undefined`, then the attribute's value is returned. 
     * @docs
     */
    // @ts-ignore different signature than base.
    border(width?: string | number, color?: string): this | string {
        if (width == null) {
            return `${this.border_width().split(" ")[0]} ${this.border_color()}`;
        }
        else {
            this.border_width(width);
            if (color) {
                this.border_color(color);
            }
        }
        return this;
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
