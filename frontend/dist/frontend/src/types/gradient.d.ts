/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
/**
 * Create a gradient object.
 *
 * Can also be constructed with wrapper function `Gradient`.
 * @nav Frontend/Styling
 * @returns Returns the `GradientType` object.
 * @param ...args The arguments can either be of length 1, containing the full gradient string `new GradientType("linear-gradient(...)")`. Or the arguments can be as `new GradientType("linear", "black", "0%", "white", "100%")`.
 * @docs
 */
export declare class GradientType {
    gradient?: string;
    type?: string;
    degree?: string;
    colors?: {
        color: string;
        stop?: string;
    }[];
    constructor(gradient: string);
    constructor(type: string, ...colors: string[]);
    /**
     * Cast to a CSS `*-gradient(...)` string. If `gradient` is unset but `colors` exist, it is built from `type`, `degree`, and `colors`, then cached.
     * @returns The CSS gradient string, or an empty string when insufficient data is available.
     */
    toString(): string;
}
