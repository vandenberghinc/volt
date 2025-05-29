/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

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
				if (typeof stop === "number" && stop <= 1.0) {
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
