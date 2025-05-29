import { Scheme } from "@vandenberghinc/vlib/frontend";

/**
 * A utility class for color manipulation, conversion, and adjustment.
 * Accepts colors in hex (e.g. "#ff0000"), RGB/RGBA strings (e.g. "rgb(255, 0, 0)" or "rgba(255,0,0,1)"),
 * or as an array of numbers ([r, g, b] or [r, g, b, a]).
 *
 * All transformation methods (adjust_brightness, darken, lighten, interpolate, etc.) return a new Color instance,
 * so they can be chained in a single line.
 */
export class Color {
    // ANSI color escape codes (foreground)
    public static readonly black: string = "\u001b[30m";
    public static readonly red: string = "\u001b[31m";
    public static readonly red_bold: string = "\u001b[31m\u001b[1m";
    public static readonly green: string = "\u001b[32m";
    public static readonly yellow: string = "\u001b[33m";
    public static readonly blue: string = "\u001b[34m";
    public static readonly magenta: string = "\u001b[35m";
    public static readonly cyan: string = "\u001b[36m";
    public static readonly light_gray: string = "\u001b[37m";
    public static readonly gray: string = "\u001b[90m";
    public static readonly bold: string = "\u001b[1m";
    public static readonly italic: string = "\u001b[3m";
    public static readonly end: string = "\u001b[0m";
    public static readonly purple: string = "\u001b[94m";

    // ANSI background color objects
    public static readonly bg: Record<'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white', string> = {
        black: "\u001b[40m",
        red: "\u001b[41m",
        green: "\u001b[42m",
        yellow: "\u001b[43m",
        blue: "\u001b[44m",
        magenta: "\u001b[45m",
        cyan: "\u001b[46m",
        white: "\u001b[47m",
    };

    public static readonly bright_bg: Record<'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white', string> = {
        black: "\u001b[100m",
        red: "\u001b[101m",
        green: "\u001b[102m",
        yellow: "\u001b[103m",
        blue: "\u001b[104m",
        magenta: "\u001b[105m",
        cyan: "\u001b[106m",
        white: "\u001b[107m",
    };

    // Internal RGBA representation
    private readonly _rgba: { r: number; g: number; b: number; a: number };

    /**
     * Creates a new Color instance.
     * @param input - A hex string, an "rgb(...)" / "rgba(...)" string, or an array of numbers ([r, g, b] or [r, g, b, a]).
     * @throws an error if the input is not parsable to a color.
     */
    constructor(input: string | number[]) {
        this._rgba = Color._from_input(input);
    }

    /**
     * Converts input into an RGBA object.
     * @private
     */
    private static _from_input(input: string | number[]): { r: number; g: number; b: number; a: number } {
        if (typeof input === "string") {
            if (input.startsWith("#")) {
                return Color.hex_to_rgb(input) as { r: number; g: number; b: number; a: number };
            } else if (input.startsWith("rgb")) {
                return Color.rgb_to_obj(input);
            } else {
                throw new Error(`Invalid color string "${input}"`);
            }
        } else if (Array.isArray(input)) {
            return Color.array_to_rgba(input);
        }
        throw new Error(`Invalid color input "${input}" with type "${Scheme.value_type(input)}". Ensure the input is a hex or rgb(a) color.`);
    }

    /**
     * Converts a numeric array to an RGBA object.
     * @param array - An array of numbers representing [r, g, b] or [r, g, b, a].
     */
    public static array_to_rgba(array: number[]): { r: number; g: number; b: number; a: number } {
        return {
            r: isNaN(array[0]) ? 0 : array[0],
            g: isNaN(array[1]) ? 0 : array[1],
            b: isNaN(array[2]) ? 0 : array[2],
            a: array.length < 4 ? 1.0 : isNaN(array[3]) ? 1.0 : array[3],
        };
    }

    /**
     * Converts a hex color string to an RGBA object or an array.
     * @param hex - The hex color string (with or without "#").
     * @param as_array - If true, returns an array [r, g, b, a]; otherwise an object.
     */
    public static hex_to_rgb(hex: string, as_array: true): number[];
    public static hex_to_rgb(hex: string, as_array?: false): { r: number; g: number; b: number; a: number };
    public static hex_to_rgb(hex: string, as_array: boolean = false): { r: number; g: number; b: number; a: number } | number[] {
        let clean_hex = hex;
        const index = clean_hex.indexOf("#");
        if (index !== -1) {
            clean_hex = clean_hex.substr(index + 1);
        }
        let r = parseInt(clean_hex.substring(0, 2), 16);
        let g = parseInt(clean_hex.substring(2, 4), 16);
        let b = parseInt(clean_hex.substring(4, 6), 16);
        let a = 1;
        if (clean_hex.length > 6) {
            a = parseInt(clean_hex.substring(6, 8), 16) / 255;
        }
        if (isNaN(r)) { r = 0; }
        if (isNaN(g)) { g = 0; }
        if (isNaN(b)) { b = 0; }
        if (isNaN(a)) { a = 1; }

        if (as_array) {
            return [r, g, b, a];
        }
        return { r, g, b, a };
    }

    /**
     * Converts an "rgb(...)" or "rgba(...)" string to an RGBA object.
     * @param color - The RGB(A) color string.
     * @throws Error if the color format is invalid.
     */
    public static rgb_to_obj(color: string): { r: number; g: number; b: number; a: number } {
        if (!color.startsWith("rgba(") && !color.startsWith("rgb(")) {
            throw new Error("Invalid color format");
        }
        const content = color.trim().split("(")[1].slice(0, -1);
        const split = content.split(",");
        return {
            r: parseInt(split[0].trim()),
            g: parseInt(split[1].trim()),
            b: parseInt(split[2].trim()),
            a: split[3] ? parseFloat(split[3].trim()) : 1,
        };
    }

    /**
     * Converts RGBA values to a hex color string.
     * @param r - Red channel value.
     * @param g - Green channel value.
     * @param b - Blue channel value.
     * @param a - Alpha channel value (defaults to 1).
     */
    public static rgb_to_hex(r: number, g: number, b: number, a: number = 1): string {
        const hex_r = Math.round(r).toString(16).padStart(2, "0");
        const hex_g = Math.round(g).toString(16).padStart(2, "0");
        const hex_b = Math.round(b).toString(16).padStart(2, "0");
        const hex_a = a === 1 ? "" : Math.round(a * 255).toString(16).padStart(2, "0");
        return `#${hex_r}${hex_g}${hex_b}${hex_a}`;
    }

    /**
     * Converts RGBA values to an "rgb(...)" or "rgba(...)" string.
     * @param r - Red channel.
     * @param g - Green channel.
     * @param b - Blue channel.
     * @param a - Alpha channel (defaults to 1).
     */
    public static rgb_to_str(r: number, g: number, b: number, a: number = 1): string {
        if (a !== 1) {
            return `rgba(${isNaN(r) ? 0 : r}, ${isNaN(g) ? 0 : g}, ${isNaN(b) ? 0 : b}, ${isNaN(a) ? 1 : a})`;
        }
        return `rgb(${isNaN(r) ? 0 : r}, ${isNaN(g) ? 0 : g}, ${isNaN(b) ? 0 : b})`;
    }
    

    /**
     * Returns the hex string representation of this Color.
     */
    public to_hex(): string {
        return Color.rgb_to_hex(this._rgba.r, this._rgba.g, this._rgba.b, this._rgba.a);
    }
    public hex(): string {
        return Color.rgb_to_hex(this._rgba.r, this._rgba.g, this._rgba.b, this._rgba.a);
    }

    /**
     * Returns the RGB(A) string representation of this Color.
     */
    public str(): string {
        return Color.rgb_to_str(this._rgba.r, this._rgba.g, this._rgba.b, this._rgba.a);
    }
    public to_str(): string {
        return Color.rgb_to_str(this._rgba.r, this._rgba.g, this._rgba.b, this._rgba.a);
    }
    public to_rgb(): string {
        return Color.rgb_to_str(this._rgba.r, this._rgba.g, this._rgba.b, this._rgba.a);
    }
    public rgb(): string {
        return Color.rgb_to_str(this._rgba.r, this._rgba.g, this._rgba.b, this._rgba.a);
    }

    /**
     * Returns the brightness of the color.
     * Uses the formula: (0.299*R + 0.587*G + 0.114*B) / 255.
     * @returns A number between 0 (bright) and 1 (dark).
     */
    private get_brightness(): number {
        return (0.299 * this._rgba.r + 0.587 * this._rgba.g + 0.114 * this._rgba.b) / 255;
    }

    /**
     * Adjusts the brightness of the color by adding a constant to each RGB channel.
     * @param adjust - The value to add (can be negative).
     * @returns A new Color instance with modified brightness.
     */
    public adjust_brightness(adjust: number): Color {
        const new_rgba = {
            r: this._rgba.r + adjust,
            g: this._rgba.g + adjust,
            b: this._rgba.b + adjust,
            a: this._rgba.a,
        };
        return new Color([new_rgba.r, new_rgba.g, new_rgba.b, new_rgba.a]);
    }  

    /** Get opacity. */
    public get_opacity(): number {
        return this._rgba.a;
    }

    /**
     * Sets the opacity (alpha channel) of the color.
     * @param opacity - A number between 0 and 1.
     * @returns A new Color instance with the given opacity.
     * @throws Error if the opacity is not within [0,1].
     */
    public opacity(opacity: number = 1.0): Color {
        if (typeof opacity !== "number" || opacity < 0 || opacity > 1) {
            throw new Error("Invalid opacity [0...1]: " + opacity + ".");
        }
        return new Color([this._rgba.r, this._rgba.g, this._rgba.b, opacity]);
    }

    /**
     * Darkens the color by interpolating toward black.
     * @param percent - The percentage to darken (between 0 and 1).
     * @returns A new Color instance darkened by the specified percentage.
     * @throws Error if the percentage is not within [0,1].
     */
    public darken(percent: number = 0.5): Color {
        if (typeof percent !== "number" || percent < 0 || percent > 1) {
            throw new Error("Invalid percentage [0...1]: " + percent + ".");
        }
        const new_rgba = {
            r: Math.round(this._rgba.r * (1 - percent)),
            g: Math.round(this._rgba.g * (1 - percent)),
            b: Math.round(this._rgba.b * (1 - percent)),
            a: this._rgba.a,
        };
        return new Color([new_rgba.r, new_rgba.g, new_rgba.b, new_rgba.a]);
    }

    /**
     * Lightens the color by interpolating toward white.
     * @param percent - The percentage to lighten (between 0 and 1).
     * @returns A new Color instance lightened by the specified percentage.
     * @throws Error if the percentage is not within [0,1].
     */
    public lighten(percent: number = 0.5): Color {
        if (typeof percent !== "number" || percent < 0 || percent > 1) {
            throw new Error("Invalid percentage [0...1]: " + percent + ".");
        }
        const new_rgba = {
            r: Math.round(this._rgba.r + (255 - this._rgba.r) * percent),
            g: Math.round(this._rgba.g + (255 - this._rgba.g) * percent),
            b: Math.round(this._rgba.b + (255 - this._rgba.b) * percent),
            a: this._rgba.a,
        };
        return new Color([new_rgba.r, new_rgba.g, new_rgba.b, new_rgba.a]);
    }

    /**
     * Automatically darken when the color is bright or lighten when the color is dark.
     * 
     * @param evaluation When the evaluation returns true the color will be darkened.
     */
    public auto_darken_lighten(percent: number = 0.5, evaluation: (brightness: number) => boolean = (b)=> b > 0.5): Color {
        if (evaluation(this.get_brightness())) {
            return this.darken(percent);
        } else {
            return this.lighten(percent);
        }
    }

    /**
     * Interpolates between this color and an end color.
     * When percent is 0 the original color is returned, and when 1 the end color is returned.
     * @param end - The target color (hex string, rgb(a) string, number array, or Color).
     * @param percent - The interpolation factor (0 to 1).
     * @param alpha - The resulting alpha value (0 to 1).
     * @returns A new Color instance representing the interpolated color.
     * @throws Error if percent or alpha are out of range.
     */
    public interpolate(end: string | number[] | Color, percent: number = 0.5, alpha: number = 1.0): Color {
        if (typeof percent !== "number" || percent < 0 || percent > 1) {
            throw new Error("Invalid percentage [0...1]: " + percent + ".");
        }
        if (typeof alpha !== "number" || alpha < 0 || alpha > 1) {
            throw new Error("Invalid alpha [0...1]: " + alpha + ".");
        }
        const end_color: Color = end instanceof Color ? end : new Color(end);
        const new_r = Math.round(this._rgba.r + (end_color._rgba.r - this._rgba.r) * percent);
        const new_g = Math.round(this._rgba.g + (end_color._rgba.g - this._rgba.g) * percent);
        const new_b = Math.round(this._rgba.b + (end_color._rgba.b - this._rgba.b) * percent);
        return new Color([new_r, new_g, new_b, alpha]);
    }

    /**
     * Returns the opposite (contrasting) color.
     * Returns black ("#000000") if the color is bright, or white ("#ffffff") if it is dark.
     * @returns A new Color instance that is either black or white.
     */
    public opposite(): Color {
        return this.get_brightness() > 0.5 ? new Color("#000000") : new Color("#ffffff");
    }
    public static opposite_s(color: ConstructorParameters<typeof Color>[0]): Color {
        return new Color(color).opposite();
    }
    public opposite_hex(): "#000000" | "#ffffff" {
        return this.get_brightness() > 0.5 ? "#000000" : "#ffffff";
    }
    public static opposite_hex_s(color: ConstructorParameters<typeof Color>[0]): "#000000" | "#ffffff" {
        return new Color(color).opposite_hex();
    }

    /**
     * Returns a function reference: if the color is bright, returns a darken function;
     * otherwise returns a lighten function.
     * The returned function accepts an optional percentage.
     * @returns A function that takes an optional percent and returns a new Color instance.
     */
    // public opposite_func(): (percent?: number) => Color {
    //     if (this.get_brightness() > 0.5) {
    //         return (percent: number = 0.5) => this.darken(percent);
    //     } else {
    //         return (percent: number = 0.5) => this.lighten(percent);
    //     }
    // }
}
export { Color as color }; // also export as lowercase for compatibility.