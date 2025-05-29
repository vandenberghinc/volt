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
     * @docs:
     * @title: Constructor
     * @desc: Initializes a new instance of the BorderButton element with the provided text.
     * @param:
     *     @name: text
     *     @descr: The text to be displayed on the BorderButton.
     *     @type: string
     * @return:
     *     @type: void
     *     @description This constructor does not return a value.
     */
    constructor(text?: string);
    /**
     * @docs:
     * @title: Gradient
     * @desc: Set the gradient color for the border element. If no value is provided, it retrieves the current background.
     * @param:
     *     @name: value
     *     @descr: The color value to set for the gradient.
     *     @type: string, null
     * @return:
     *     @type: string | this
     *     @description When an argument is passed this function returns the instance of the element for chaining. Otherwise, it returns the current background value.
     * @funcs: 2
     */
    gradient(): string;
    gradient(value: string | null): this;
    /**
     * @docs:
     * @title: Border Color
     * @desc: Sets the border color of the element. If no value is provided, it retrieves the current border color.
     * @param:
     *     @name: value
     *     @descr: The color value to set for the border.
     *     @type: string, null
     * @return:
     *     @type: string | this
     *     @description When an argument is passed, this function returns the instance of the element for chaining. Otherwise, it returns the current border color.
     * @funcs: 2
     */
    border_color(): string;
    border_color(value: string | null): this;
    /**
     * @docs:
     * @title: Border Width
     * @desc: Sets or retrieves the border width of the element. If no argument is passed, it returns the current padding.
     * @param:
     *     @name: value
     *     @descr: The value of the border width to set.
     *     @type: number, null
     * @return:
     *     @type: number | this
     *     @description When an argument is passed, this function returns the instance of the element for chaining. Otherwise, it returns the current border width.
     * @funcs: 2
     */
    border_width(): string;
    border_width(value: string | number): this;
    /**
     * @docs:
     * @title: Border Radius
     * @desc: Sets the border radius for the element. If no value is provided, it retrieves the current border radius.
     * @param:
     *     @name: value
     *     @descr: The value for the border radius to set.
     *     @type: number, null
     * @return:
     *     @type: number | this
     *     @description Returns the current border radius if no argument is passed, otherwise returns the instance for chaining.
     * @funcs: 2
     */
    border_radius(): string;
    border_radius(value: string | number): this;
    /**
     * @docs:
     * @title: Color
     * @desc: Sets or retrieves the color of the child text. When a value is provided, it updates the color; when no value is provided, it returns the current color.
     * @param:
     *     @name: value
     *     @descr: The color value to set for the child text.
     *     @type: string, null
     * @return:
     *     @type: string | this
     *     @description Returns the current color if no argument is passed; otherwise, returns the instance of the element for chaining.
     * @funcs: 2
     */
    color(): string;
    color(value: string): this;
    /**
     * @docs:
     * @title: Styles
     * @desc: Retrieves or sets the styling attributes for the element. If no argument is provided, it computes styles based on child elements.
     * @param:
     *     @name: style_dict
     *     @descr: A dictionary of styles to set. If null, the method computes styles based on child elements.
     *     @type: object | null
     * @return:
     *     @type: object
     *     @description Returns the computed styles when no argument is passed, or the result of the super method when an argument is provided.
     * @funcs: 2
     */
    styles(): Record<string, string>;
    styles(style_dict: Record<string, any>): this;
    /**
     * @docs:
     * @title: Text
     * @desc: Set or get the text of the element. If a value is provided, it sets the text; otherwise, it retrieves the current text.
     * @param:
     *     @name: val
     *     @descr: The value to set as text or null to retrieve the current text.
     *     @type: string, null
     * @return:
     *     @type: string | this
     *     @description When a value is passed, this function returns the instance for chaining. If no value is passed, it returns the current text.
     * @funcs: 2
     */
    text(): string;
    text(val: string): this;
    /**
     * @docs:
     * @title: Transition Border Color
     * @desc: Sets or retrieves the transition for the border color of the element.
     * @param:
     *     @name: val
     *     @descr: The value to set for the transition or to retrieve the current transition.
     *     @type: string, number, null
     * @return:
     *     @type: this | string
     *     @description When an argument is passed, this function returns the instance of the element for chaining. Otherwise, it returns the already set transition value.
     * @funcs: 2
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
