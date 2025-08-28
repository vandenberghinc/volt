import { VDivElement, VElementTagMap } from "../elements/module.js";
/**
 * Supports a gradient color for the border combined with border radius.
 * Warning: this class is still experimental and may be subject to future change.
 */
export declare class BorderButtonElement extends VElementTagMap.a {
    nodes: {
        border: VDivElement;
        text: VDivElement;
        [key: string]: any;
    };
    /**
     * Initializes a new instance of the BorderButton element with the provided text.
     * @param text The text to be displayed on the BorderButton.
     * @returns This constructor does not return a value.
     * @docs
     */
    constructor(text?: string);
    /**
     * Sets or gets the gradient color for the border element. If no value is provided, the current background is returned.
     * @param value The color value to set for the gradient.
     * @returns When a value is provided, returns this for chaining; otherwise, returns the current background value.
     * @docs
     */
    gradient(): string;
    gradient(value: string | null): this;
    /**
     * Sets or gets the border color of the element. If no value is provided, the current border color is returned.
     * @param value The color value to set for the border.
     * @returns When a value is provided, returns this for chaining; otherwise, returns the current border color.
     * @docs
     */
    border_color(): string;
    border_color(value: string | null): this;
    /**
     * Sets or retrieves the border width of the element. If no argument is passed, the current border width (padding) is returned.
     * @param value The value of the border width to set.
     * @returns When a value is provided, returns this for chaining; otherwise, returns the current border width.
     * @docs
     */
    border_width(): string;
    border_width(value: string | number): this;
    /**
     * Sets or gets the border radius for the element. If no value is provided, the current border radius is returned.
     * @param value The value for the border radius to set.
     * @returns Returns the current border radius if no value is provided; otherwise, returns this for chaining.
     * @docs
     */
    border_radius(): string;
    border_radius(value: string | number): this;
    /**
     * Sets or retrieves the color of the child text. When a value is provided, it updates the color; when omitted, it returns the current color.
     * @param value The color value to set for the child text.
     * @returns Returns the current color if no value is provided; otherwise, returns this for chaining.
     * @docs
     */
    color(): string;
    color(value: string): this;
    /**
     * Retrieves or sets the styling attributes for the element. If no argument is provided, styles are computed from child elements.
     * @param style_dict A dictionary of styles to set. If omitted, the method computes styles based on child elements.
     * @returns Returns the computed styles when no argument is passed, or the result of the super method when an argument is provided.
     * @docs
     */
    styles(): Record<string, string>;
    styles(style_dict: Record<string, any>): this;
    /**
     * Sets or gets the text of the element. If a value is provided, it sets the text; otherwise, it returns the current text.
     * @param val The value to set as text or omitted to retrieve the current text.
     * @returns When a value is provided, returns this for chaining; otherwise, returns the current text.
     * @docs
     */
    text(): string;
    text(val: string): this;
    /**
     * Sets or retrieves the transition for the border color of the element.
     * @param val The value to set for the transition or omit to retrieve the current transition.
     * @returns When a value is provided, returns this for chaining; otherwise, returns the already set transition value.
     * @docs
     */
    transition_border_color(): string;
    transition_border_color(val: string): this;
}
export declare const BorderButton: <Extensions extends object = {}>(text?: string | undefined) => BorderButtonElement & Extensions;
export declare const NullBorderButton: <Extensions extends object = {}>() => BorderButtonElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        BorderButtonElement: BorderButtonElement;
    }
}
