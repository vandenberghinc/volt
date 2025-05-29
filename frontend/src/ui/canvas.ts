/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Utils } from "../modules/utils.js"
import { Elements, VElementBaseSignature, VElement, VElementTagMap } from "../elements/module.js"
import { GradientType } from "../types/gradient.js"

// Types.
type PointObject = {x: number, y: number, tension?: number};
type DotObject = {x: number, y: number, tension?: number};

// Canvas.
/*	@docs:
 *	@nav: Frontend
 *	@chapter: Elements
 *	@title: Canvas
 *	@description:
 *		Canvas element.
 *	@experimental: true
 *	@warning:
 *		This class is still experimental and may be subject to future change.
 */
@Elements.create({
    name: "CanvasElement",
})
export class CanvasElement extends VElementTagMap.canvas {

    // Attributes.
	public _e: any;
	public ctx_2d: any;

	// ---------------------------------------------------------
	// Constructors.
	
	constructor() {
		super({
			derived: CanvasElement,
		});

		// Safari does not render images correctly for custom elements.
		if (Utils.is_safari) {
			this.attachShadow({ mode: 'open' });
			this._e = document.createElement("canvas");
			this._e.style.objectFit = "cover";
			this.shadowRoot?.appendChild(this._e);
			this.position("relative"); // for img width height 100%
			this.overflow("hidden"); // for border radius.

			// Set resize event otherwise when the item resizes the shadow image does not.
			this.on_resize(() => {
				this._e.style.width = this.style.width;
				this._e.width = this.width;
				this._e.style.height = this.style.height;
				this._e.height = this.height;
			})
		}


		this.ctx_2d = this.getContext("2d");
	}

	// ---------------------------------------------------------
	// Override functions.

	// Height, purely for safari.
	height(): string | number;
	height(value: string | number, check_attribute?: boolean): this;
	height(value?: string | number, check_attribute?: boolean): this | string | number {
		if (this._e === undefined) {
			return super.height(value as string | number, check_attribute);
		}
		if (value == null) {
			return this._e.height;
		}
		super.height(value as string | number, false);
		this._e.style.height = this.pad_numeric(value, "px");
		this._e.height = this.pad_numeric(value, "");
		return this;
	}
	min_height(): string | number;
	min_height(value: string | number): this;
	min_height(value?: string | number): this | string | number {
		if (this._e === undefined) {
			return super.min_height(value as string | number);
		}
		if (value == null) {
			return this._e.style.minHeight;
		}
		this._e.style.minHeight = this.pad_numeric(value, "px");
		return this;
	}
	max_height(): string;
	max_height(value: string | number): this;
	max_height(value?: string | number): this | string {
		if (this._e === undefined) {
			return super.max_height(value as string | number);
		}
		if (value == null) {
			return this._e.style.maxHeight;
		}
		this._e.style.maxHeight = this.pad_numeric(value, "px");
		return this;
	}

	// Width, purely for safari.
	width(): string | number;
	width(value: string | number, check_attribute?: boolean): this;
	width(value?: string | number, check_attribute: boolean = true): string | number | this {
		if (this._e === undefined) {
			return super.width(value as string | number, check_attribute);
		}
		if (value == null) {
			return this._e.width;
		}
		super.width(value as string | number, false);
		this._e.style.width = this.pad_numeric(value, "px");
		this._e.width = value;
		return this;
	}
	min_width(): string | number;
	min_width(value: string | number): this;
	min_width(value?: string | number | null): this | string | number {
		if (this._e === undefined) {
			return super.min_width(value as string | number);
		}
		if (value == null) {
			return this._e.style.minWidth;
		}
		this._e.style.minWidth = this.pad_numeric(value, "px");
		return this;
	}
	max_width(): string;
	max_width(value: string | number): this;
	max_width(value?: string | number): string | this {
		if (this._e === undefined) {
			return super.max_width(value as string | number);
		}
		if (value == null) {
			return this._e.style.maxWidth;
		}
		this._e.style.maxWidth = this.pad_numeric(value, "px");
		return this;
	}

	// ---------------------------------------------------------
	// Utility functions.

	getContext(...args) {
		if (Utils.is_safari) {
			return this._e.getContext(...args as [any, any]);
		}
		// @ts-ignore
		return super.getContext(...args as [any, any]);
	}

	// Draw lines.
	draw_lines(
		ctx,
		points: PointObject[] = [],
		tension?: number,
	): this {
		ctx.beginPath();
		ctx.moveTo(points[0].x, points[0].y);
		let t;
		for (let i = 0; i < points.length - 1; i++) {
			if (points[i].tension != undefined) {
				t = points[i].tension;
			} else {
				t = (tension != undefined) ? tension : 0;
			}

			let p0 = (i > 0) ? points[i - 1] : points[0];
			let p1 = points[i];
			let p2 = points[i + 1];
			let p3 = (i != points.length - 2) ? points[i + 2] : p2;

			let cp1x = p1.x + (p2.x - p0.x) / 6 * t;
			let cp1y = p1.y + (p2.y - p0.y) / 6 * t;

			let cp2x = p2.x - (p3.x - p1.x) / 6 * t;
			let cp2y = p2.y - (p3.y - p1.y) / 6 * t;

			ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);

		}
		return this;
	}

	// Create gradient.
	create_gradient(
		ctx,
		gradient: GradientType,
		start_x: number,
		start_y: number,
		end_x: number,
		end_y: number,
	) {
		if (!(gradient instanceof GradientType)) {
			console.error("Invalid usage, parameter \"gradient\" should be type \"GradientType\".");
			return null;
		}
		if (gradient.colors === undefined) {
			console.error("Invalid usage, gradient attribute \"colors\" is undefined.");
			return null;
		}
		let value;
		if (gradient.type == "linear") {
			value = ctx.createLinearGradient(start_x, start_y, end_x, end_y)
		} else if (gradient.type == "radial") {
			value = ctx.createRadialGradient(start_x, start_y, end_x, end_y) // @TODO.
		} else {
			value = ctx.createLinearGradient(start_x, start_y, end_x, end_y)
		}
		for (let i = 0; i < gradient.colors.length; i++) {
			let stop: any = gradient.colors[i].stop;
			if (Utils.is_string(stop) && stop.includes("%")) {
				stop = parseFloat(stop.substr(0, stop.length - 1)) / 100;
			} else if (Utils.is_string(stop) && stop.includes("px")) {
				stop = parseFloat(stop.substr(0, stop.length - 2));
			}
			value.addColorStop(stop, gradient.colors[i].color);
		}
		return value;
	}

	// ---------------------------------------------------------
	// Functions.

	// Create a line.
	/*	@docs:
	 *	@title: Line.
	 *	@description: 
	 *		Create a line, optionally curved and with custom styling.
	 *	@return: 
	 *		Returns the `Canvas` object.
	 *	@parameter:
	 *		@name: points
	 *		@description: The line points, an array with objects with `x` and `y` values.
	 *	@parameter:
	 *		@name: tension
	 *		@description: The smoothness of the line, use `null` or `0` for a straight line and {0.0, 2.0} for a smooth line.
	 *	@parameter:
	 *		@name: color
	 *		@description: The line color.
	 *	@parameter:
	 *		@name: fill
	 *		@description: The fill color, supports a `GradientType` class. leave `null` to ignore.
	 *	@parameter:
	 *		@name: scale
	 *		@type: boolean
	 *		@description: When enabled all x and y coordinates are treated as a 0.0 till 1.0 scale in relation to the canvas' width and height.
	 *	@parameter:
	 *		@name: dots
	 *		@type: object
	 *		@description: 
	 *			Place dots at each coordinate, leave `null` to ignore.
	 *			Fields:
	 *			```{
	 *				width: 0.01, // Dot width in pixels when `scale` is `false`, and dot width in percentage `{0.0,1.0}` when `scale` is `true`.
	 *				color: "black", // Fill color.
	 *			}```
	 */ 
	lines({
		points,
		tension,
		color = "black",
		width,
		fill,
		scale = false,
		dots,
	}: {
		points: PointObject[],
		tension?: number,
		color?: string,
		width?: number,
		fill?: string | GradientType,
		scale?: boolean,
		dots?: {
			width?: number,
			color?: string | GradientType,
		},
	}) : this {

		// Create context.
		let ctx = this.ctx_2d;

		// Scale.
		if (scale) {
			let width = this.width() ?? 1;
			if (typeof width !== "number") { width = 1; }
			let height = this.height() ?? 1;
			if (typeof height !== "number") { height = 1; }
			for (let i = 0; i < points.length; i++) {
				points[i].x = width * points[i].x;
				points[i].y = height * points[i].y;
			}
		}

		// Draw.
		this.draw_lines(ctx, points, tension);
		// ctx.beginPath();
		// ctx.moveTo(points[0].x, points[0].y);
		// for (let i = 1; i < points.length; i++) {
		// 	ctx.lineTo(points[i].x, points[i].y);
		// }

		// Stroke style.
		if (width != null) {
			ctx.lineWidth = width;
		}
		if (color != null) {
			ctx.strokeStyle = color;
		} else {
			ctx.strokeStyle = "transparent";
		}
		ctx.stroke();

		// Fill style.
		if (fill != null) {

			// Gradient.
			if (fill instanceof GradientType) {
				let minX = Infinity;
				let maxX = -Infinity;
				let minY = Infinity;
				let maxY = -Infinity;
				points.forEach((point) => {
				  minX = Math.min(minX, point.x);
				  maxX = Math.max(maxX, point.x);
				  minY = Math.min(minY, point.y);
				  maxY = Math.max(maxY, point.y);
				});
				ctx.fillStyle = this.create_gradient(ctx, fill, minX, minY, maxX, maxY);
			}

			// Default color.
			else {
				ctx.fillStyle = fill;
			}

			// Fill.
			ctx.fill();
		}

		// Draw dots.
		if (dots != null) {
			if (dots.width == null) {
				if (scale) {
					dots.width = 0.01;
				} else {
					dots.width = 5;
				}
			}
			if (scale) {
				let width = this.width() ?? 1;
				if (typeof width !== "number") { width = 1; }
				dots.width = dots.width * width;
			}
			let is_gradient = false;
			if (dots.color != null) {
				if (dots.color instanceof GradientType) {
					is_gradient = true;
				} else {
					ctx.fillStyle = dots.color;
				}
			}
			for (let i = 0; i < points.length; i++) {
				ctx.beginPath();
				ctx.arc(points[i].x, points[i].y, dots.width, 0, 2 * Math.PI);
				if (is_gradient) {
					const gradient = this.create_gradient(ctx, dots.color as GradientType, points[i].x - dots.width, points[i].y, points[i].x + dots.width, points[i].y);
					ctx.fillStyle = gradient;
				}
				ctx.fill();
				// ctx.fillRect(points[i].x - dots.width / 2, points[i].y - dots.width / 2, dots.width, dots.width);
			}
		}

		return this;
	}

	// Remove all contexts.
	// @ts-ignore
	clear() : this {
		this.ctx_2d.clearRect(0, 0, this.width, this.height);
		return this;
	}

	shadow_color(): string;
	shadow_color(val: string) : this;
	shadow_color(val?: string) : string | this {
		if (val === undefined) { return this.ctx_2d.shadowColor ?? ""; }
		this.ctx_2d.shadowColor = val;
		return this;
	}
	shadow_blur(): string;
	shadow_blur(val: string) : this;
	shadow_blur(val?: string) : string | this {
		if (val === undefined) { return this.ctx_2d.shadowBlur ?? ""; }
		this.ctx_2d.shadowBlur = val;
		return this;
	}
	shadow_offset_x(): string;
	shadow_offset_x(val: number | string) : this;
	shadow_offset_x(val?: number | string) : string | this {
		if (val === undefined) { return this.ctx_2d.shadowOffsetX ?? ""; }
		this.ctx_2d.shadowOffsetX = this.pad_numeric(val);
		return this;
	}
	shadow_offset_y(): string;
	shadow_offset_y(val: number | string) : this;
	shadow_offset_y(val?: number | string) : string | this {
		if (val === undefined) { return this.ctx_2d.shadowOffsetY ?? ""; }
		this.ctx_2d.shadowOffsetY = this.pad_numeric(val);
		return this;
	}
};
export const Canvas = Elements.wrapper(CanvasElement);
export const NullCanvas = Elements.create_null(CanvasElement);
declare module './any_element.d.ts' { interface AnyElementMap { CanvasElement: CanvasElement }}

// function Canvas(...args) {
// 	if (Utils.is_safari) {
// 		const e = document.createElement(CanvasElement.element_tag, {is: "v-" + CanvasElement.name.toLowerCase()})
// 		console.log("E", e);
// 		e._init(...args);
// 		return e;
// 	} else {
// 		return new CanvasElement(...args);
// 	}
// }
