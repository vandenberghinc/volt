/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Elements } from "../modules/elements"
import { Utils } from "../modules/utils"
import { CreateVElementClass } from "./element"

// Gradient.
/*	@docs:
 *	@nav: Frontend
 *	@chapter: Styling
 *	@title: Gradient
 *	@description: 
 *		Create a gradient object.
 *
 *		Can also be constructed with wrapper function `Gradient`.
 *	@return: 
 *		Returns the `GradientType` object.
 *	@parameter:
 *		@name: ...args
 *		@description: 
 *			The arguments can either be of length 1, containing the full gradient string `new GradientType ("linear-gradient(...)")`.
 *			Or the arguments can be as `new GradientType("linear", "black", "0%", "white", "100%")`.
 */ 
export class GradientType {

	public gradient?: string;
	public type?: string;
	public degree?: string;
	public colors?: {color: string, stop?: string}[];

	// Constructor.
	constructor(gradient: string);
	constructor(type: string, ...colors: string[]);
	constructor(...args) {
		if (args.length === 1) {
			this.gradient = args[0];
		}
		else if (args.length > 1) {
			this.type = args[0];
			this.colors = [];
			for (let i = 1; i < args.length; i++) {
				if (args[i].endsWith("deg")) {
					this.degree = args[i];
					continue;
				}
				if (typeof args[i+1] === "string" && args[i+1].includes("%")) {
					this.colors.push({
						color: args[i],
						stop: args[i + 1],
					})
					i++;
				} else {
					this.colors.push({
						color: args[i],
						stop: undefined,
					})
				}
			}
		} else {
			console.error("Invalid number of arguments for class \"Gradient()\".");
		}
	}

	// Cast to string.
	toString() :  string {
		if (this.gradient == null && this.colors !== undefined) {
			this.gradient = `${this.type}-gradient(`;
			if (this.degree) {
				this.gradient += this.degree + ", ";
			}
			for (let i = 0; i < this.colors.length; i++) {
				this.gradient += this.colors[i].color;
				this.gradient += " ";
				let stop = this.colors[i].stop;
				if (Utils.is_numeric(stop) && stop <= 1.0) {
					stop = (stop * 100) + "%";
				}
				this.gradient += stop;
				if (i + 1 < this.colors.length) {
					this.gradient += ", ";
				}
			}
			this.gradient += ")";
			return this.gradient;
		}
		return this.gradient ?? "";
	}	
};
export const Gradient = Elements.wrapper(GradientType);

// Gradient border.
@Elements.register
export class GradientBorderElement extends CreateVElementClass({
	type: "GradientBorder",
	tag: "div",
	default_style: {
		"border-width": "1px",
		"border-radius": "10px",
		// "border-color": "black",
	},
}) {

	// Constructor.
	constructor(text: string) {
		
		// Initialize base classes.
		super();
			
		// Styling.
		this
		.content("")
		.position("absolute")
		// .z_index(-1)
		.inset(0)
		.padding(GradientBorderElement.default_style["--child-border-width"])
		.border_radius(GradientBorderElement.default_style["--child-border-radius"])
		.background(GradientBorderElement.default_style["--child-background"])
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
	border_width(value: string) : this;
	border_width(value?: string) : string | this {
		if (value == null) {
			return this.padding() ?? "";
		}
		this.padding(value);
		return this;
	}
}
export const GradientBorder = Elements.wrapper(GradientBorderElement);
