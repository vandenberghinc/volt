"use strict";
/** @deprecated Use `Color` from modules/color.ts instead */
// type ColorFunction = (data: any) => string;
// type ColorObject = Record<'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white', string>;
// type ColorFunctionObject = Record<'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white', ColorFunction>;
// // Colors module
// export namespace Colors {
//     // Types.
//     export type Color = string;
//     export type RGBArray = number[];
//     export interface RGBAObject {
//         r: number;
//         g: number;
//         b: number;
//         a?: number;
//     }
//     // ---------------------------------------------------------
//     // Attributes.
//     export const black = "\u001b[30m";
//     export const red = "\u001b[31m";
//     export const red_bold = "\u001b[31m\u001b[1m";
//     export const green = "\u001b[32m";
//     export const yellow = "\u001b[33m";
//     export const blue = "\u001b[34m";
//     export const magenta = "\u001b[35m";
//     export const cyan = "\u001b[36m";
//     export const light_gray = "\u001b[37m";
//     export const gray = "\u001b[90m";
//     export const bold = "\u001b[1m";
//     export const italic = "\u001b[3m";
//     export const end = "\u001b[0m";
//     export const purple = "\u001b[94m";
//     export const bg: ColorObject = {
//         black: "\u001b[40m",
//         red: "\u001b[41m",
//         green: "\u001b[42m",
//         yellow: "\u001b[43m",
//         blue: "\u001b[44m",
//         magenta: "\u001b[45m",
//         cyan: "\u001b[46m",
//         white: "\u001b[47m",
//     };
//     export const bright_bg: ColorObject = {
//         black: "\u001b[100m",
//         red: "\u001b[101m",
//         green: "\u001b[102m",
//         yellow: "\u001b[103m",
//         blue: "\u001b[104m",
//         magenta: "\u001b[105m",
//         cyan: "\u001b[106m",
//         white: "\u001b[107m",
//     };
//     // Hex module
//     export namespace hex {
//         // Get the brightness of a hex color (0.0 white, 1.0 dark)
//         export function get_brightness(color: string): number {
//             color = color.replace(/^#/, '');
//             const bigint = parseInt(color, 16);
//             const r = (bigint >> 16) & 255;
//             const g = (bigint >> 8) & 255;
//             const b = bigint & 255;
//             const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
//             return brightness;
//         }
//         // Convert hex to RGBA;
//         export function to_rgb(hex: string, as_array: true): number[];
//         export function to_rgb(hex: string, as_array?: false): RGBAObject;
//         export function to_rgb(hex: string, as_array: boolean = false): RGBAObject | number[] {
//             const index = hex.indexOf("#");
//             if (index !== -1) {
//                 hex = hex.substr(index + 1);
//             }
//             let r = parseInt(hex.substring(0, 2), 16);
//             let g = parseInt(hex.substring(2, 4), 16);
//             let b = parseInt(hex.substring(4, 6), 16);
//             let a = 1;
//             if (hex.length > 6) {
//                 a = parseInt(hex.substring(6, 8), 16) / 255;
//             }
//             if (isNaN(r)) { r = 0; }
//             if (isNaN(g)) { g = 0; }
//             if (isNaN(b)) { b = 0; }
//             if (isNaN(a)) { a = 1; }
//             if (as_array) {
//                 return [r, g, b, a];
//             }
//             return { r, g, b, a };
//         }
//         export const to_rgba = to_rgb;
//         // Adjust brightness of a hex color
//         export function adjust_brightness(color: string, adjust: number = 0): string {
//             const rgba = hex.to_rgb(color);
//             if (Array.isArray(rgba)) {
//                 rgba[0] += adjust;
//                 rgba[1] += adjust;
//                 rgba[2] += adjust;
//                 return Colors.rgb.to_hex(rgba[0], rgba[1], rgba[2], rgba[3]);
//             } else {
//                 rgba.r += adjust;
//                 rgba.g += adjust;
//                 rgba.b += adjust;
//                 return Colors.rgb.to_hex(rgba.r, rgba.g, rgba.b, rgba.a);
//             }
//         }
//         // Placeholder for aliasing
//         // export const to_rgba = null as unknown as (hex: string, as_array?: boolean) => RGBA | number[];
//     };
//     // hex.to_rgba = hex.to_rgb;
//     // RGB module
//     export const rgb = {
//         // RGB(a) to hex
//         to_hex(r: number, g: number, b: number, a: number = 1): string {
//             const hexR = Math.round(r).toString(16).padStart(2, '0');
//             const hexG = Math.round(g).toString(16).padStart(2, '0');
//             const hexB = Math.round(b).toString(16).padStart(2, '0');
//             const hexA = a === 1 ? "" : Math.round(a * 255).toString(16).padStart(2, '0');
//             return `#${hexR}${hexG}${hexB}${hexA}`;
//         },
//         // Convert a color string (e.g., "rgb(255, 0, 0)") to an RGBA object
//         to_obj(color: string): RGBAObject {
//             if (!color.startsWith("rgba(") && !color.startsWith("rgb(")) {
//                 throw new Error("Invalid color format");
//             }
//             const split = color.trim().split("(")[1].slice(0, -1).split(",");
//             const obj: RGBAObject = { r: 0, g: 0, b: 0, a: 1 };
//             obj.r = parseInt(split[0].trim());
//             obj.g = parseInt(split[1].trim());
//             obj.b = parseInt(split[2].trim());
//             if (split[3]) {
//                 obj.a = parseFloat(split[3].trim());
//             }
//             return obj;
//         },
//         // Convert RGBA values to a color string
//         to_str(r: number, g: number, b: number, a: number = 1): string {
//             if (a !== 1) {
//                 return `rgba(${isNaN(r) ? 0 : r}, ${isNaN(g) ? 0 : g}, ${isNaN(b) ? 0 : b}, ${isNaN(a) ? 1 : a})`;
//             } else {
//                 return `rgb(${isNaN(r) ? 0 : r}, ${isNaN(g) ? 0 : g}, ${isNaN(b) ? 0 : b})`;
//             }
//         },
//         // Adjust brightness of an RGB color
//         adjust_brightness(color: string, adjust: number = 0): string {
//             const rgba = this.to_obj(color);
//             rgba.r += adjust;
//             rgba.g += adjust;
//             rgba.b += adjust;
//             return this.to_str(rgba.r, rgba.g, rgba.b, rgba.a);
//         },
//     };
//     // Placeholder for aliasing
//     export const rgba = rgb;
//     // Utility function to adjust brightness
//     export function adjust_brightness(color: string, adjust: number = 0): string {
//         if (color.startsWith("rgb")) {
//             return Colors.rgb.adjust_brightness(color, adjust);
//         } else if (color.startsWith("#")) {
//             return Colors.hex.adjust_brightness(color, adjust);
//         } else {
//             throw new Error("Invalid color format");
//         }
//     }
//     // Set the opacity of a color
//     export function set_opacity(color: string, opacity: number = 1.0): string {
//         if (typeof opacity !== "number" || opacity < 0 || opacity > 1) {
//             throw new Error("Invalid opacity [0...1]: " + opacity + ".");
//         }
//         let rgba: RGBAObject;
//         let type: 'rgb' | 'hex';
//         if (color.startsWith("rgb")) {
//             type = "rgb";
//             rgba = Colors.rgb.to_obj(color);
//         } else if (color.startsWith("#")) {
//             type = "hex";
//             const result = Colors.hex.to_rgb(color);
//             rgba = Array.isArray(result) ? { r: result[0], g: result[1], b: result[2], a: result[3] } : result;
//         } else {
//             throw new Error("Invalid color format");
//         }
//         rgba.a = opacity;
//         if (type === "hex") {
//             return Colors.rgb.to_hex(rgba.r, rgba.g, rgba.b, rgba.a);
//         } else {
//             return Colors.rgb.to_str(rgba.r, rgba.g, rgba.b, rgba.a);
//         }
//     }
//     // Initialize a color wrapper.
//     function init_rgb(color: string): RGBAObject {
//         if (color.startsWith("#")) {
//             return Colors.hex.to_rgb(color);
//         } else if (color.startsWith("rgb")) {
//             return Colors.rgb.to_obj(color);
//         } else {
//             throw new Error(`Invalid input color "${color}", only hex and rgb(a) colors are supported.`);
//         }
//     }
//     // Darken the color by interpolating toward black (#000000)
//     export function darken(color: Color /*| RGBArray*/, percent: number = 0.5) {
//         if (typeof percent !== "number" || percent < 0 || percent > 1) {
//             throw new Error("Invalid percentage [0...1]: " + percent + ".");
//         }
//         // Convert input to RGB object
//         const rgb = init_rgb(color);
//         // const rgb = typeof color === 'string' ? Colors.hex.to_rgb(color) as RGBAObject : {
//         //     r: color[0],
//         //     g: color[1],
//         //     b: color[2],
//         //     a: color.length > 3 ? color[3] : 1
//         // };
//         // Interpolate toward black (0,0,0)
//         const darkened = {
//             r: Math.round(rgb.r * (1 - percent)),
//             g: Math.round(rgb.g * (1 - percent)),
//             b: Math.round(rgb.b * (1 - percent)),
//             a: rgb.a
//         };
//         // Return in same format as input
//         // if (typeof color === 'string') {
//         return Colors.rgb.to_str(darkened.r, darkened.g, darkened.b, darkened.a);
//         // } else {
//         //     return color.length > 3
//         //         ? [darkened.r, darkened.g, darkened.b, darkened.a]
//         //         : [darkened.r, darkened.g, darkened.b];
//         // }
//     }
//     // Lighten the color by interpolating toward white (#FFFFFF)
//     export function lighten(color: Color /*| RGBArray*/, percent: number = 0.5) {
//         if (typeof percent !== "number" || percent < 0 || percent > 1) {
//             throw new Error("Invalid percentage [0...1]: " + percent + ".");
//         }
//         // Convert input to RGB object
//         const rgb = init_rgb(color);
//         // const rgb = typeof color === 'string' ? Colors.hex.to_rgb(color) as RGBA : {
//         //     r: color[0],
//         //     g: color[1],
//         //     b: color[2],
//         //     a: color.length > 3 ? color[3] : 1
//         // };
//         // Interpolate toward white (255,255,255)
//         const lightened = {
//             r: Math.round(rgb.r + (255 - rgb.r) * percent),
//             g: Math.round(rgb.g + (255 - rgb.g) * percent),
//             b: Math.round(rgb.b + (255 - rgb.b) * percent),
//             a: rgb.a
//         };
//         // Return in same format as input
//         // if (typeof color === 'string') {
//             return Colors.rgb.to_str(lightened.r, lightened.g, lightened.b, lightened.a);
//         // } else {
//         //     return color.length > 3
//         //         ? [lightened.r, lightened.g, lightened.b, lightened.a]
//         //         : [lightened.r, lightened.g, lightened.b];
//         // }
//     }
//     // Interpolate.
//     export function interpolate(start: Color /*| RGBArray*/, end: Color /*| RGBArray*/, percent: number = 0.5, alpha: number = 1.0) {
//         if (typeof percent !== "number" || percent < 0 || percent > 1) {
//             throw new Error("Invalid percentage [0...1]: " + percent + ".");
//         }
//         if (typeof alpha !== "number" || alpha < 0 || alpha > 1) {
//             throw new Error("Invalid alpha [0...1]: " + alpha + ".");
//         }
//         return new ColorRangeClass(start, end).interpolate(percent, alpha)
//     }
//     // Determine the opposite (contrasting) color.
//     // Returns black (#000000) if the input color is bright, or white (#ffffff) if it is dark.
//     export function opposite(color: Color): "#000000" | "#ffffff" {
//         let brightness: number;
//         if (color.startsWith("#")) {
//             brightness = Colors.hex.get_brightness(color);
//         } else if (color.startsWith("rgb")) {
//             const rgba = Colors.rgb.to_obj(color);
//             brightness = (0.299 * rgba.r + 0.587 * rgba.g + 0.114 * rgba.b) / 255;
//         } else {
//             throw new Error("Invalid color format for opposite color");
//         }
//         // Return black for bright colors, white for dark colors.
//         return brightness > 0.5 ? "#000000" : "#ffffff";
//     }
//     export function opposite_func(color: Color): typeof lighten | typeof darken {
//         return opposite(color) === "#000000" ? darken : lighten;
//     }
// };
// import { Elements } from "../elements/module.js"
// /*	@docs:
//     @nav: Frontend
//     @chapter: Styling
//     @title: Color range
//     @description: Used to create a range between two different colors. Can be initialized using alias function `ColorRange`.
//     @param:
//         @name: start
//         @descr: The start color (lightest). May either be a HEX string or an rgb(a) array.
//         @type: string, array
//     @param:
//         @name: end
//         @descr: The end color (darkest). May either be a HEX string or an rgb(a) array.
//         @type: string, array
//  */
// export class ColorRangeClass {
//     public start: Colors.RGBAObject;
//     public end: Colors.RGBAObject;
//     constructor(start: Colors.Color | Colors.RGBArray, end: Colors.Color | Colors.RGBArray) {
//         if (Array.isArray(start)) {
//             this.start = this.array_to_rgba(start);
//         } else if (typeof start === "string") {
//             this.start = Colors.hex.to_rgb(start);
//         } else {
//             throw new Error(`Invalid type "${typeof start}" for parameter "start", the valid types are "string" or "array".`);
//         }
//         if (Array.isArray(end)) {
//             this.end = this.array_to_rgba(end);
//         } else if (typeof end === "string") {
//             this.end = Colors.hex.to_rgb(end) as Colors.RGBAObject;
//         } else {
//             throw new Error(`Invalid type "${typeof end}" for parameter "end", the valid types are "string" or "array".`);
//         }
//     }
//     // Array to rgba.
//     array_to_rgba(array: Colors.RGBArray): Colors.RGBAObject {
//         return {
//             r: isNaN(array[0]) ? 0 : array[0],
//             g: isNaN(array[1]) ? 0 : array[1],
//             b: isNaN(array[2]) ? 0 : array[2],
//             a: array.length < 4 ? 1.0 : isNaN(array[3]) ? 1.0 : array[3],
//         }
//     }
//     /*	@docs:
//         @title: Interpolate
//         @description: Interpolate between the start and end colors. When `percent` is 0 it will return the `start` color and when percent is `1` it will return the end color without computations.
//         @param:
//             @name: percent
//             @descr: The percentage to interpolate from start to end, the valid range is `0.0` till `1.0`.
//             @type: number
//         @param:
//             @name: alpha
//             @descr: The alpha channel, the valid range is `0.0` till `1.0`.
//             @type: number
//             @default: 1
//      */
//     interpolate(percent: number = 0.5, alpha: number = 1.0): Colors.Color {
//         // Validate inputs
//         percent = Math.max(0, Math.min(1, percent)); // Clamp percent between 0 and 1
//         alpha = Math.max(0, Math.min(1, alpha));     // Clamp alpha between 0 and 1
//         // Handle edge cases
//         if (percent <= 0) {
//             return Colors.rgb.to_str(
//                 this.start.r,
//                 this.start.g,
//                 this.start.b,
//                 this.start.a,
//             );
//         } else if (percent >= 1) {
//             console.log("END:", this.end)
//             return Colors.rgb.to_str(
//                 this.end.r,
//                 this.end.g,
//                 this.end.b,
//                 this.end.a,
//             );
//         }
//         // Ensure all RGB values are valid numbers (default to 0 if invalid)
//         const startR = isNaN(this.start.r) ? 0 : this.start.r;
//         const startG = isNaN(this.start.g) ? 0 : this.start.g;
//         const startB = isNaN(this.start.b) ? 0 : this.start.b;
//         const endR = isNaN(this.end.r) ? 0 : this.end.r;
//         const endG = isNaN(this.end.g) ? 0 : this.end.g;
//         const endB = isNaN(this.end.b) ? 0 : this.end.b;
//         // Perform interpolation with validated values
//         return Colors.rgba.to_str(
//             Math.round(startR + (endR - startR) * percent),
//             Math.round(startG + (endG - startG) * percent),
//             Math.round(startB + (endB - startB) * percent),
//             alpha,
//         );
//     }
//     // interpolate(percent: number = 0.5, alpha: number = 1.0): Hex {
//     //     if (percent <= 0) {
//     //         return Colors.rgb.to_str(
//     //             this.start.r,
//     //             this.start.g,
//     //             this.start.b,
//     //             this.start.a,
//     //         )
//     //     } else if (percent >= 1) {
//     //         return Colors.rgb.to_str(
//     //             this.end.r,
//     //             this.end.g,
//     //             this.end.b,
//     //             this.end.a,
//     //         )
//     //     }
//     //     return Colors.rgba.to_str(
//     //         Math.round(this.start.r + (this.end.r - this.start.r) * percent),
//     //         Math.round(this.start.g + (this.end.g - this.start.g) * percent),
//     //         Math.round(this.start.b + (this.end.b - this.start.b) * percent),
//     //         alpha,
//     //     )
//     // }
//     // RGBA to hex.
//     // rgb_to_hex(r, g, b, a = 1) {
//     // 	const hex = [r, g, b].map(x => {
//     //         const hex = x.toString(16);
//     //         return hex.length === 1 ? '0' + hex : hex;
//     //     })
//     //     if (a != null && a < 1) {
//     //     	let a = a / 100;
//     //     	if (a < 10) {
//     //     		hex.push("0" + a.toString())
//     //     	} else {
//     //     		hex.push(a.toString())
//     //     	}
//     //     }
//     //     return '#' + hex.join('');
//     // }
// }
// export const ColorRange = Elements.wrapper(ColorRangeClass);
// export const NullColorRange = Elements.create_null(ColorRangeClass);
