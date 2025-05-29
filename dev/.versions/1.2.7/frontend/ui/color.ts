
// Imports.
import { Colors } from "../modules/colors"
import { Elements } from "../modules/elements"
import { CreateVElementClass } from "./element"

// Types.
type Hex = string;
type RGBArray = number[];
interface RGBObject {
	r: number;
	g: number;
	b: number;
	a: number;
}

/*	@docs:
	@nav: Frontend
	@chapter: Styling
	@title: Color range
	@description: Used to create a range between two different colors. Can be initialized using alias function `ColorRange`.
	@param:
		@name: start
		@descr: The start color (lightest). May either be a HEX string or an rgb(a) array.
		@type: string, array
	@param:
		@name: end
		@descr: The end color (darkest). May either be a HEX string or an rgb(a) array.
		@type: string, array
 */
export class ColorRangeClass {

	public start: RGBObject;
	public end: RGBObject;

    constructor(start: Hex | RGBArray, end: Hex | RGBArray) {
    	if (Array.isArray(start)) {
    		this.start = this.array_to_rgba(start);
    	} else if (typeof start === "string") {
    		this.start = Colors.hex.to_rgb(start);
    	} else {
    		throw new Error(`Invalid type "${typeof start}" for parameter "start", the valid types are "string" or "array".`);
    	}
    	if (Array.isArray(end)) {
    		this.end = this.array_to_rgba(end);
    	} else if (typeof end === "string") {
    		this.end = Colors.hex.to_rgb(end);
    	} else {
    		throw new Error(`Invalid type "${typeof end}" for parameter "end", the valid types are "string" or "array".`);
    	}
    }

    // Array to rgba.
    array_to_rgba(array: RGBArray): RGBObject {
    	return {
			r: array[0],
			g: array[1],
			b: array[2],
			a: array.length < 4 ? 1 : array[3],
		}
    }

    /*	@docs:
		@title: Interpolate
		@description: Interpolate between the start and end colors. When `percent` is 0 it will return the `start` color and when percent is `1` it will return the end color without computations.
		@param:
			@name: percent
			@descr: The percentage to interpolate from start to end, the valid range is `0.0` till `1.0`.
			@type: number
		@param:
			@name: alpha
			@descr: The alpha channel, the valid range is `0.0` till `1.0`.
			@type: number
			@default: 1
	 */
    interpolate(percent: number = 0.5, alpha: number = 1.0) : Hex {
    	if (percent <= 0) {
    		return Colors.rgb.to_str(
				this.start.r,
				this.start.g,
				this.start.b,
				this.start.a,
			)
    	} else if (percent >= 1) {
    		return Colors.rgb.to_str(
				this.end.r,
				this.end.g,
				this.end.b,
				this.end.a,
			)
    	}
    	return Colors.rgba.to_str(
			Math.round(this.start.r + (this.end.r - this.start.r) * percent),
			Math.round(this.start.g + (this.end.g - this.start.g) * percent),
			Math.round(this.start.b + (this.end.b - this.start.b) * percent),
			alpha,
		)
    }

    // RGBA to hex.
    // rgb_to_hex(r, g, b, a = 1) {
    // 	const hex = [r, g, b].map(x => {
    //         const hex = x.toString(16);
    //         return hex.length === 1 ? '0' + hex : hex;
    //     })
    //     if (a != null && a < 1) {
    //     	let a = a / 100;
    //     	if (a < 10) {
    //     		hex.push("0" + a.toString())
    //     	} else {
    //     		hex.push(a.toString())
    //     	}
    //     }
    //     return '#' + hex.join('');
    // }
}
export const ColorRange = Elements.wrapper(ColorRangeClass);