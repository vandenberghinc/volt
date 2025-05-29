/**
 * A utility class for color manipulation, conversion, and adjustment.
 * Accepts colors in hex (e.g. "#ff0000"), RGB/RGBA strings (e.g. "rgb(255, 0, 0)" or "rgba(255,0,0,1)"),
 * or as an array of numbers ([r, g, b] or [r, g, b, a]).
 *
 * All transformation methods (adjust_brightness, darken, lighten, interpolate, etc.) return a new Color instance,
 * so they can be chained in a single line.
 */
export declare class Color {
    static readonly black: string;
    static readonly red: string;
    static readonly red_bold: string;
    static readonly green: string;
    static readonly yellow: string;
    static readonly blue: string;
    static readonly magenta: string;
    static readonly cyan: string;
    static readonly light_gray: string;
    static readonly gray: string;
    static readonly bold: string;
    static readonly italic: string;
    static readonly end: string;
    static readonly purple: string;
    static readonly bg: Record<'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white', string>;
    static readonly bright_bg: Record<'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white', string>;
    private readonly _rgba;
    /**
     * Creates a new Color instance.
     * @param input - A hex string, an "rgb(...)" / "rgba(...)" string, or an array of numbers ([r, g, b] or [r, g, b, a]).
     * @throws an error if the input is not parsable to a color.
     */
    constructor(input: string | number[]);
    /**
     * Converts input into an RGBA object.
     * @private
     */
    private static _from_input;
    /**
     * Converts a numeric array to an RGBA object.
     * @param array - An array of numbers representing [r, g, b] or [r, g, b, a].
     */
    static array_to_rgba(array: number[]): {
        r: number;
        g: number;
        b: number;
        a: number;
    };
    /**
     * Converts a hex color string to an RGBA object or an array.
     * @param hex - The hex color string (with or without "#").
     * @param as_array - If true, returns an array [r, g, b, a]; otherwise an object.
     */
    static hex_to_rgb(hex: string, as_array: true): number[];
    static hex_to_rgb(hex: string, as_array?: false): {
        r: number;
        g: number;
        b: number;
        a: number;
    };
    /**
     * Converts an "rgb(...)" or "rgba(...)" string to an RGBA object.
     * @param color - The RGB(A) color string.
     * @throws Error if the color format is invalid.
     */
    static rgb_to_obj(color: string): {
        r: number;
        g: number;
        b: number;
        a: number;
    };
    /**
     * Converts RGBA values to a hex color string.
     * @param r - Red channel value.
     * @param g - Green channel value.
     * @param b - Blue channel value.
     * @param a - Alpha channel value (defaults to 1).
     */
    static rgb_to_hex(r: number, g: number, b: number, a?: number): string;
    /**
     * Converts RGBA values to an "rgb(...)" or "rgba(...)" string.
     * @param r - Red channel.
     * @param g - Green channel.
     * @param b - Blue channel.
     * @param a - Alpha channel (defaults to 1).
     */
    static rgb_to_str(r: number, g: number, b: number, a?: number): string;
    /**
     * Returns the hex string representation of this Color.
     */
    to_hex(): string;
    hex(): string;
    /**
     * Returns the RGB(A) string representation of this Color.
     */
    str(): string;
    to_str(): string;
    to_rgb(): string;
    rgb(): string;
    /**
     * Returns the brightness of the color.
     * Uses the formula: (0.299*R + 0.587*G + 0.114*B) / 255.
     * @returns A number between 0 (bright) and 1 (dark).
     */
    private get_brightness;
    /**
     * Adjusts the brightness of the color by adding a constant to each RGB channel.
     * @param adjust - The value to add (can be negative).
     * @returns A new Color instance with modified brightness.
     */
    adjust_brightness(adjust: number): Color;
    /** Get opacity. */
    get_opacity(): number;
    /**
     * Sets the opacity (alpha channel) of the color.
     * @param opacity - A number between 0 and 1.
     * @returns A new Color instance with the given opacity.
     * @throws Error if the opacity is not within [0,1].
     */
    opacity(opacity?: number): Color;
    /**
     * Darkens the color by interpolating toward black.
     * @param percent - The percentage to darken (between 0 and 1).
     * @returns A new Color instance darkened by the specified percentage.
     * @throws Error if the percentage is not within [0,1].
     */
    darken(percent?: number): Color;
    /**
     * Lightens the color by interpolating toward white.
     * @param percent - The percentage to lighten (between 0 and 1).
     * @returns A new Color instance lightened by the specified percentage.
     * @throws Error if the percentage is not within [0,1].
     */
    lighten(percent?: number): Color;
    /**
     * Automatically darken when the color is bright or lighten when the color is dark.
     *
     * @param evaluation When the evaluation returns true the color will be darkened.
     */
    auto_darken_lighten(percent?: number, evaluation?: (brightness: number) => boolean): Color;
    /**
     * Interpolates between this color and an end color.
     * When percent is 0 the original color is returned, and when 1 the end color is returned.
     * @param end - The target color (hex string, rgb(a) string, number array, or Color).
     * @param percent - The interpolation factor (0 to 1).
     * @param alpha - The resulting alpha value (0 to 1).
     * @returns A new Color instance representing the interpolated color.
     * @throws Error if percent or alpha are out of range.
     */
    interpolate(end: string | number[] | Color, percent?: number, alpha?: number): Color;
    /**
     * Returns the opposite (contrasting) color.
     * Returns black ("#000000") if the color is bright, or white ("#ffffff") if it is dark.
     * @returns A new Color instance that is either black or white.
     */
    opposite(): Color;
    static opposite_s(color: ConstructorParameters<typeof Color>[0]): Color;
    opposite_hex(): "#000000" | "#ffffff";
    static opposite_hex_s(color: ConstructorParameters<typeof Color>[0]): "#000000" | "#ffffff";
}
export { Color as color };
