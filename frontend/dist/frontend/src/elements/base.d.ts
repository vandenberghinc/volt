import "../modules//string.js";
import "../modules//array.js";
import "../modules//number.js";
import { GradientType } from "../types/gradient.js";
import type { AnyElement } from "../ui/any_element.js";
import type { PseudoElement } from "../ui/pseudo.js";
type none = undefined | null;
declare global {
    export interface VElementExtensions {
    }
}
interface BaseVElementInitOptions {
    derived: any;
    default_style?: Record<string, any>;
    default_attributes?: Record<string, any>;
    default_events?: Record<string, any>;
}
interface DerivedVElementInitOptions {
    derived?: any;
    name?: string;
    default_style?: Record<string, any>;
    default_attributes?: Record<string, any>;
    default_events?: Record<string, any>;
}
export type AppendType = null | undefined | string | Node | VElement | Function | AppendType[];
export type ElementCallback<This> = (element: This) => any;
export type ElementEvent<This> = (element: This, event: Event) => any;
export type ElementMouseEvent<This> = (element: This, event: MouseEvent) => any;
export type ElementDragEvent<This> = (element: This, event: MouseEvent) => any;
export type ElementKeyboardEvent<This> = (element: This, event: KeyboardEvent) => any;
export type ThemeUpdateCallback<This> = (element: This) => any;
export type OnAppearCallback<This> = (element: This, options: {
    scroll_direction: string;
}) => any;
export type undefstrnr = null | undefined | string | number;
export declare abstract class VElement extends HTMLElement {
    __is_velement: boolean;
    static element_tag: string;
    static default_style: Record<string, any>;
    static default_attributes: Record<string, any>;
    static default_events: Record<string, any>;
    rendered: boolean;
    element_name: string;
    base_element_name: string;
    remove_focus: HTMLElement["blur"];
    _v_children: any[];
    _element_display: string;
    _is_connected: boolean;
    _on_append_callback?: Function;
    _assign_to_parent_as?: string;
    _parent?: any;
    _side_by_side_basis?: number;
    _animate_timeout?: ReturnType<typeof setTimeout>;
    _is_button_disabled: boolean;
    _timeouts: Record<string, any>;
    _on_window_resize_timer: any;
    _abs_parent: any;
    _on_resize_rule_evals: Record<string, any>;
    _observing_on_resize: boolean;
    _observing_on_render: boolean;
    _on_resize_callbacks: ElementCallback<this>[];
    _on_render_callbacks: ElementCallback<this>[];
    _on_theme_updates: ThemeUpdateCallback<this>[];
    _on_mouse_leave_callback: ElementMouseEvent<this>;
    _on_mouse_enter_callback: ElementMouseEvent<this>;
    _on_shortcut_time: number;
    _on_shortcut_key: string;
    _on_shortcut_keycode: number;
    _on_keypress_set: boolean;
    _on_enter_callback?: ElementKeyboardEvent<this>;
    _on_escape_callback?: ElementKeyboardEvent<this>;
    _on_appear_callbacks: Record<string, any>[];
    _media_queries: {
        [key: string]: {
            list: MediaQueryList;
            callback: (query: MediaQueryList) => any;
        };
    };
    constructor();
    /**
     * @warning This method should only be used by the direct types declared in this file e.g. VSpanElement.
     * @note This method is always called in the constructor of the base elements defined in VElementTagMap.
     */
    protected _init_sys_velement(args: BaseVElementInitOptions): void;
    /**
     * @warning Any VElement (a derived class of VElementTagMap) must call this method in its constructor.
     */
    protected _init(args: BaseVElementInitOptions): void;
    connectedCallback(): void;
    static is(type: any): type is VElement;
    /**
     * @docs:
     * @title: Clone
     * @desc: Creates a deep copy of the current element, including its styles and attributes.
     *         Optionally clones child nodes based on the provided parameter.
     * @param:
     *     @name: clone_children
     *     @descr: Indicates whether to clone child nodes of the current element.
     *     @default: true
     * @return:
     *     @description Returns a new instance of the element that is a clone of the current one.
     */
    clone(clone_children?: boolean): this;
    /**
     * @docs:
     * @title: Pad Numeric
     * @desc: Pads a numeric value with a specified padding unit, defaulting to "px".
     * @param:
     *     @name: value
     *     @descr: The numeric value to be padded.
     * @param:
     *     @name: padding
     *     @descr: The unit to pad the numeric value with.
     *     @default: "px"
     * @return:
     *     @description Returns the padded value as a string.
     */
    pad_numeric(value: none | number | string, padding?: string): string;
    /**
     * @docs:
     * @title: Pad Percentage
     * @desc: Pads a numeric value with a percentage symbol. If the value is a float between 0 and 1, it is multiplied by 100 before padding.
     * @param:
     *     @name: value
     *     @descr: The numeric value to pad.
     * @param:
     *     @name: padding
     *     @descr: The string to pad the numeric value with, defaults to "%".
     * @return:
     *     @description Returns the padded percentage as a string, or the original value if it is not numeric.
     */
    pad_percentage(value: number, padding?: string): string;
    /**
     * @docs:
     * @title: Edit Filter Wrapper
     * @desc: Edits a filter string by replacing or removing specified types.
     * Can also append a new type if it doesn’t exist in the filter.
     * @param:
     *     @name: filter
     *     @descr: The original filter string that needs to be edited.
     *     @name: type
     *     @descr: The type that will be targeted for replacement or removal.
     *     @name: to
     *     @descr: The new value to replace the existing type with, or null to remove it.
     * @return:
     *     @description Returns the modified filter string or null if the input filter was null.
     */
    edit_filter_wrapper(filter: string | null, type: string, to?: undefstrnr): string;
    /**
     * @docs:
     * @title: Toggle Filter Wrapper
     * @desc: Toggles a specified filter type in a string. If the type is present, it will be removed; otherwise, it will be added.
     * @param:
     *     @name: filter
     *     @descr: The filter string to modify.
     *     @name: type
     *     @descr: The type of filter to toggle.
     *     @name: to
     *     @descr: The value to add if the type is not present.
     * @return:
     *     @description Returns the modified filter string or null if the input filter was null.
     */
    toggle_filter_wrapper(filter: string | null, type: string, to?: string | null): string;
    _convert_px_to_number_type(value: any, def?: number | null): any;
    _try_parse_float(value: any, def?: number | null): any;
    _try_parse_boolean(value: any): boolean;
    /**
     * @docs:
     * @title: Append Child Elements
     * @desc: Appends child elements to the current element. Can accept multiple child elements, including HTML nodes, functions, or strings.
     * @param:
     *     @name: children
     *     @descr: The child elements to append, which can be an array of elements, a single element, or a function.
     * @return:
     *     @descr: Returns the instance of the element for chaining.
     */
    append(...children: AppendType[]): this;
    /**
     * @docs:
     * @title: ZStack Append
     * @desc: Appends multiple children to the ZStack element. This method can handle various types of children such as elements, functions, and text.
     * @param:
     *     @name: children
     *     @descr: The children to append, which can be elements, arrays, text, or functions returning elements.
     * @return:
     *     @description Returns the instance of the ZStack element for chaining.
     */
    zstack_append(...children: AppendType[]): this;
    /**
     * @docs:
     * @title: Append To Parent
     * @desc: Appends the current element to a specified parent element and manages parent-child relationships.
     * @param:
     *     @name: parent
     *     @descr: The parent element to which the current element will be appended.
     * @return:
     *     @descr: Returns the instance of the element for chaining.
     */
    append_to(parent: any): this;
    /**
     * @docs:
     * @title: Append Children to Parent
     * @desc: Appends the children of the current element to the specified parent element and executes a callback for each appended child.
     * @param:
     *     @name: parent
     *     @descr: The parent element to which the children will be appended.
     *     @name: on_append_callback
     *     @descr: A callback function that is executed for each child when it is appended.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    append_children_to(parent: any, on_append_callback?: Function): this;
    /**
     * @docs:
     * @title: Remove Child
     * @desc: Removes a child element from the current element. The child can be specified
     *        by passing a Node, an VElement, or an id string of the element to be removed.
     * @param:
     *     @name: child
     *     @descr: The child to be removed from the current element.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    remove_child(child: any): this;
    /**
     * @docs:
     * @title: Remove Children
     * @desc: Removes all child elements from the current element without using innerHTML.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    remove_children(): this;
    /**
     * @docs:
     * @title: Child
     * @desc: Retrieves a child element by its index. Supports negative indexing to access elements from the end of the list.
     * @param:
     *     @name: index
     *     @descr: The index of the child to retrieve. Can be a positive or negative integer.
     * @return:
     *     @description Returns the child element at the specified index.
     */
    child(index: number): any;
    /**
     * @docs:
     * @title: Get Child
     * @desc: Retrieves a child element by its index. Supports negative indexing to access elements from the end.
     * @param:
     *     @name: index
     *     @descr: The index of the child element to retrieve. Can be negative to access from the end.
     * @return:
     *     @description Returns the child element at the specified index, or undefined if the index is out of bounds.
     */
    get(index: number): any | undefined;
    /**
     * @docs:
     * @title: Text
     * @desc: Set or get the text content of the element. If no value is provided, it retrieves the current text content.
     * @param:
     *     @name: value
     *     @descr: The text content to set or retrieve.
     * @return:
     *     @description Returns the current text content if no argument is passed, otherwise returns the instance of the element for chaining.
     * @funcs: 2
     */
    text(): string;
    text(value: string): this;
    /**
     * @docs:
     * @title: Width
     * @desc: Specify the width or height of the element. Returns the offset width or height when the param value is null.
     * @param:
     *     @name: value
     *     @descr: The width value to set or get.
     * @param:
     *     @name: check_attribute
     *     @descr: Indicates whether to check the element's width attribute.
     * @return:
     *     @description Returns the offset width when no value is provided, otherwise returns the instance of the element for chaining.
     * @funcs: 2
     */
    width(): string | number;
    width(value: string | number, check_attribute?: boolean): this;
    /** Simple wrapper for .width("fit-content") */
    fit_content(): this;
    /**
     * @docs:
     * @title: Fixed Width
     * @desc: Sets the fixed width for the element and updates min and max widths accordingly.
     * @param:
     *     @name: value
     *     @descr: The value to set for the width, can be a number or null to get the current width.
     * @return:
     *     @description If no argument is passed, returns the current width as a number. If an argument is passed, returns the instance of the element for chaining.
     * @funcs: 2
     */
    fixed_width(): string | number;
    fixed_width(value: string | number): this;
    /**
     * @docs:
     * @title: Height
     * @desc: Sets or retrieves the height of the element. It checks for attributes and styles based on the provided parameters.
     * @param:
     *     @name: value
     *     @descr: The value to set for height or retrieve the current height if null.
     * @param:
     *     @name: check_attribute
     *     @descr: Determines if the element's attribute should be checked.
     * @return:
     *     @description Returns the instance of the element for chaining when an argument is passed, otherwise returns the current height as a number.
     * @funcs: 2
     */
    height(): string | number;
    height(value: string | number, check_attribute?: boolean): this;
    /**
     * @docs:
     * @title: Fixed Height
     * @desc: Sets the fixed height for the element or retrieves the current height if no value is provided.
     * @param:
     *     @name: value
     *     @descr: The height value to set, which can be a number or null.
     * @return:
     *     @descr: When an argument is passed, this function returns the instance of the element for chaining. Otherwise, it returns the parsed float value of the current height.
     * @funcs: 2
     */
    fixed_height(): string | number;
    fixed_height(value: string | number): this;
    /**
     * @docs:
     * @title: Min height
     * @desc: Sets the minimum height of an element. The equivalent of CSS attribute `minHeight`.
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    min_height(): string | number;
    min_height(value: string | number): this;
    /**
     * @docs:
     * @title: Min Width
     * @desc: Sets the minimum width of an element. The equivalent of CSS attribute `minWidth`.
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @descr: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    min_width(): string | number;
    min_width(value: string | number): this;
    /**
     * @docs:
     * @title: Width By Columns
     * @desc: Sets the width of HStack children based on the number of columns specified.
     * If columns are not provided, it defaults to 1. The calculation takes into account
     * the left and right margins of the element.
     * @param:
     *     @name: columns
     *     @descr: The number of columns to set the width by.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    width_by_columns(columns: number): this;
    /**
     * @docs:
     * @title: Offset Width
     * @desc: Retrieves the offset width of the element.
     * @return:
     *     @description Returns the offset width of the element.
     */
    offset_width(): number;
    /**
     * @docs:
     * @title: Offset Height
     * @desc: Retrieves the height of the element's offset.
     * @return:
     *     @description Returns the height of the element including padding and border.
     */
    offset_height(): number;
    /**
     * @docs:
     * @title: Client Width
     * @desc: Retrieves the client width of the element.
     * @return:
     *     @description Returns the client width of the element.
     */
    client_width(): number;
    /**
     * @docs:
     * @title: Client Height
     * @desc: Retrieves the height of the client area of the element.
     * @return:
     *     @description Returns the height of the client area in pixels.
     */
    client_height(): number;
    /**
     * @docs:
     * @title: X Offset
     * @desc: Retrieves the x offset of the element from its parent.
     * @return:
     *     @description Returns the x offset value of the element.
     */
    x(): number;
    /**
     * @docs:
     * @title: Y Offset
     * @desc: Retrieves the vertical offset of the element from the top of the document.
     * @return:
     *     @description Returns the vertical offset value.
     */
    y(): number;
    /**
     * @docs:
     * @title: Frame
     * @desc: Sets the width and height of the frame. If width or height is not provided, it does not change that dimension.
     * @param:
     *     @name: width
     *     @descr: The width to set for the frame.
     * @param:
     *     @name: height
     *     @descr: The height to set for the frame.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    frame(width?: string | number, height?: string | number): this;
    /**
     * @docs:
     * @title: Min Frame
     * @desc: Sets the minimum width and height for the frame. If parameters are provided, it updates the respective properties.
     * @param:
     *     @name: width
     *     @descr: The minimum width to set for the frame.
     * @param:
     *     @name: height
     *     @descr: The minimum height to set for the frame.
     * @return:
     *     @descr: Returns the instance of the frame for chaining.
     */
    min_frame(width: string | number, height: string | number): this;
    /**
     * @docs:
     * @title: Max Frame
     * @desc: Sets the maximum width and height for the frame. If a value is provided, it updates the respective maximum dimension.
     * @param:
     *     @name: width
     *     @descr: The maximum width to set for the frame.
     *     @name: height
     *     @descr: The maximum height to set for the frame.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    max_frame(width: string | number, height: string | number): this;
    /**
     * @docs:
     * @title: Fixed Frame
     * @desc: Sets the width and height of the element, applying padding to the values if provided.
     * @param:
     *     @name: width
     *     @descr: The width to set for the element. Can be a number or null.
     *     @name: height
     *     @descr: The height to set for the element. Can be a number or null.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    fixed_frame(width: string | number, height: string | number): this;
    /**
     * @docs:
     * @title: Get Frame While Hidden
     * @desc: Retrieves the dimensions of the element as it would appear if it were not hidden.
     * @return:
     *     @description Returns an object containing the width and height of the element.
     */
    get_frame_while_hidden(): {
        width: number;
        height: number;
    };
    sync_height_from(node: AnyElement, process?: (height: number) => number): this;
    sync_height_to(node: AnyElement | AnyElement[], process?: (height: number) => number): this;
    /**
     * Set a square frame width and height.
     */
    square(size?: string | number): this;
    /** Set circle border radius */
    circle(): this;
    /**
     * @docs:
     * @title: Padding
     * @desc: Sets the padding of the element based on the number of provided arguments.
     *        It can accept 1, 2, or 4 values to set padding for different sides.
     * @param:
     *     @name: values
     *     @descr: The padding values to set. Can be a single value, two values for vertical and horizontal,
     *              or four values for top, right, bottom, and left.
     * @return:
     *     @description Returns the instance of the element for chaining.
     * @funcs: 4
     */
    padding(): string;
    padding(value: undefstrnr): this;
    padding(top_bottom: undefstrnr, left_right: undefstrnr): this;
    padding(top: undefstrnr, right: undefstrnr, bottom: undefstrnr, left: undefstrnr): this;
    /**
     * @docs:
     * @title: Padding Bottom
     * @desc: Sets the bottom padding of an element. The equivalent of CSS attribute `paddingBottom`.
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @descr: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    padding_bottom(): number;
    padding_bottom(value: string | number): this;
    /**
     * @docs:
     * @title: Padding Left
     * @desc: Sets the left padding of an element. The equivalent of CSS attribute `paddingLeft`.
     * Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    padding_left(): number;
    padding_left(value: string | number): this;
    /**
     * @docs:
     * @title: Padding Right
     * @desc: Sets the right padding of an element, equivalent to the CSS attribute `paddingRight`.
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining, unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    padding_right(): number;
    padding_right(value: string | number): this;
    /**
     * @docs:
     * @title: Padding Top
     * @desc: Sets the top padding of an element. The equivalent of CSS attribute `paddingTop`.
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @descr: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    padding_top(): number;
    padding_top(value: string | number): this;
    /**
     * @docs:
     * @title: Margin
     * @desc: Sets the margin of the element. Can accept 1, 2, or 4 values for different margin settings.
     * @param:
     *     @name: values
     *     @descr: The values for the margin. Can be a single value, two values for vertical and horizontal margins, or four values for each side.
     * @return:
     *     @description Returns the instance of the element for chaining.
     * @funcs: 4
     */
    margin(): string;
    margin(value: undefstrnr): this;
    margin(top_bottom: undefstrnr, left_right: undefstrnr): this;
    margin(top: undefstrnr, right: undefstrnr, bottom: undefstrnr, left: undefstrnr): this;
    /**
     * @docs:
     * @title: Margin Bottom
     * @desc: Sets the bottom margin of an element. The equivalent of CSS attribute `marginBottom`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    margin_bottom(): number;
    margin_bottom(value: string | number): this;
    /**
     * @docs:
     * @title: Margin Left
     * @desc: Sets the left margin of an element, equivalent to the CSS attribute `marginLeft`.
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    margin_left(): number;
    margin_left(value: string | number): this;
    /**
     * @docs:
     * @title: Margin Right
     * @desc: Sets the right margin of an element, equivalent to the CSS attribute `marginRight`.
     *        Returns the attribute value when the parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign to the right margin. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the instance of the element for chaining unless the parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    margin_right(): number;
    margin_right(value: string | number): this;
    /**
     * @docs:
     * @title: Margin Top
     * @desc: Sets the top margin of an element. The equivalent of CSS attribute `marginTop`.
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    margin_top(): number;
    margin_top(value: string | number): this;
    /**
     * @docs:
     * @title: Position
     * @desc: Sets or retrieves the position style of the element. Can be used with 0, 1, or 4 arguments.
     * @param:
     *     @name: values
     *     @descr: The values for setting the position, which can be a single value or four values for top, right, bottom, and left.
     * @return:
     *     @description Returns the current position if no arguments are passed, or the instance of the element for chaining when arguments are provided.
     * @funcs: 3
     */
    position(): string | undefined;
    position(value: number | string): this;
    position(top?: number | string | none, right?: number | string | none, bottom?: number | string | none, left?: number | string | none): this;
    /**
     * @docs:
     * @title: Stretch
     * @desc: Sets the flex property of the element to control its stretching behavior.
     * @param:
     *     @name: value
     *     @descr: A boolean indicating whether the element should stretch or not.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    stretch(value: boolean): this;
    /**
     * @docs:
     * @title: Wrap
     * @desc: Sets the wrapping behavior of an element based on the provided value.
     * @param:
     *     @name: value
     *     @descr: A boolean or string indicating the wrap behavior.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    wrap(value: boolean | string): this;
    /**
     * @docs:
     * @title: Z Index
     * @desc: Sets the z-index style property of the element.
     * @param:
     *     @name: value
     *     @descr: The z-index value to set for the element.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    z_index(value: number | string): this;
    /**
     * @docs:
     * @experimental: true
     * @title: Side by Side
     * @description: Set the elements side by side till a specified width.
     * @param:
     *     @name: options
     *     @descr: Configuration options for the side by side layout.
     *     @attr:
     *         @name: columns
     *         @description The amount of column elements that will be put on one row.
     *         @name: hspacing
     *         @description The horizontal spacing between the columns in pixels.
     *         @name: vspacing
     *         @description The vertical spacing between the rows in pixels.
     *         @name: stretch
     *         @description Stretch the leftover columns to max width.
     *         @name: hide_dividers
     *         @description Hide dividers when they would appear on a row.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    side_by_side(options: {
        columns?: number;
        hspacing?: number;
        vspacing?: number;
        stretch?: boolean;
        hide_dividers?: boolean;
    }): this;
    /**
     * @docs:
     * @title: Side By Side Basis
     * @desc: Sets or retrieves the side by side basis for a node, which must be a floating percentage between 0.0 and 1.0.
     * @param:
     *     @name: basis
     *     @descr: The basis value to set or retrieve.
     * @return:
     *     @description When an argument is passed, this function returns the instance of the element for chaining. Otherwise, it returns the already set side by side basis.
     * @funcs: 2
     */
    side_by_side_basis(): number | undefined;
    side_by_side_basis(basis: number | false): this;
    /**
     * @docs:
     * @title: Ellipsis Overflow
     * @desc: Configures the text overflow behavior with ellipsis. It can enable or disable ellipsis and set the number of lines.
     * @param:
     *     @name: to
     *     @descr: Indicates whether to enable or disable ellipsis. If `null`, it returns the current state.
     * @param:
     *     @name: after_lines
     *     @descr: The number of lines after which ellipsis should be applied. Only relevant when `to` is `true`.
     * @return:
     *     @description Returns the instance of the element for chaining.
     * @funcs: 2
     */
    ellipsis_overflow(): boolean;
    ellipsis_overflow(to: boolean, after_lines?: number | none): this;
    /**
     * @docs:
     * @title: Align
     * @desc: Sets or retrieves the alignment style of the element based on its type.
     * @param:
     *     @name: value
     *     @descr: The alignment value to set or retrieve based on the element type.
     * @return:
     *     @description When an argument is passed, this function returns the instance of the element for chaining. Otherwise, it returns the currently set alignment value.
     * @funcs: 2
     */
    align(): string;
    align(value: string): this;
    /**
     * @docs:
     * @title: Leading
     * @desc: Sets the alignment to the start position.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    leading(): this;
    /**
     * @docs:
     * @title: Center Alignment
     * @desc: Sets the alignment of the element to center.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    center(): this;
    /**
     * @docs:
     * @title: Trailing
     * @desc: Aligns the element to the end.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    trailing(): this;
    /**
     * @docs:
     * @title: Align Vertical
     * @desc: Sets or retrieves the vertical alignment style of the element based on its type.
     * @param:
     *     @name: value
     *     @descr: The alignment value to set or retrieve.
     * @return:
     *     @description Returns the instance of the element for chaining when an argument is passed. Otherwise, returns the current alignment value.
     * @funcs: 2
     */
    align_vertical(): string;
    align_vertical(value: string): this;
    /**
     * @docs:
     * @title: Leading Vertical
     * @desc: Sets the vertical alignment to the start position.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    leading_vertical(): this;
    /**
     * @docs:
     * @title: Center Vertical
     * @desc: Centers the element vertically, optionally only when there is no overflow.
     * @param:
     *     @name: only_on_no_overflow
     *     @descr: Determines whether to center only when there is no overflow.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    center_vertical(only_on_no_overflow?: boolean): this;
    /**
     * @docs:
     * @title: Trailing Vertical
     * @desc: Sets the vertical alignment to the trailing position.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    trailing_vertical(): this;
    /**
     * @docs:
     * @title: Align Text
     * @desc: Sets the text alignment using predefined shortcuts.
     * @param:
     *     @name: value
     *     @descr: The value representing the text alignment to set.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    align_text(value: string): this;
    /**
     * @docs:
     * @title: Text Leading
     * @desc: Sets the text alignment to the start position for leading text.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    text_leading(): this;
    /**
     * @docs:
     * @title: Text Center
     * @desc: Sets the text alignment of the element to center.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    text_center(): this;
    /**
     * @docs:
     * @title: Text Trailing
     * @desc: Sets the text alignment to 'end' for trailing text.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    text_trailing(): this;
    /**
     * @docs:
     * @title: Align Height
     * @desc: Aligns items by height inside a horizontal stack.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    align_height(): this;
    /**
     * @docs:
     * @title: Text Wrap
     * @desc: Set the text wrap value, equivalent to the CSS attribute `textWrap`.
     *        Returns the attribute value when the parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    text_wrap(): string;
    text_wrap(value: string): this;
    /**
     * @docs:
     * @title: Line clamp
     * @desc: This non-standard CSS property allows you to limit the number of lines shown in a block container. When used in conjunction with `-webkit-box-orient`, it specifies the maximum number of lines to display before truncating the text. Text that exceeds this limit is cut off and typically ends with an ellipsis. This property is particularly useful for creating text overflow effects in web design where maintaining a consistent, visually manageable block of text is necessary.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object for chaining unless parameter `value` is `null`, in which case the attribute's value is returned.
     * @funcs: 2
     */
    line_clamp(): string;
    line_clamp(value: string): this;
    /**
     * @docs:
     * @title: Box Orient
     * @desc: This property is part of the old flexbox model and is used to define the orientation of the children in a flex container. In combination with `-webkit-line-clamp`, it's set to vertical to allow the line clamping effect on block containers. It dictates how the children of the box are laid out: horizontally or vertically. Note that `-webkit-box-orient` is specific to Webkit-based browsers and is not part of the standard CSS flexbox properties.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    box_orient(): string;
    box_orient(value: string): this;
    /**
     * @docs:
     * @title: Color
     * @desc: Sets the color of text, also supports a `GradientType` element.
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     *                   When the value is `null` and the color has been set using a `GradientType`, `transparent` will be returned.
     * @funcs: 2
     */
    color(): string;
    color(value: string | GradientType): this;
    /**
     * @docs:
     * @title: Border
     * @desc: Sets the border style of the element. Can accept one to three arguments to define border properties.
     * @param:
     *     @name: values
     *     @descr: The values to set the border style.
     * @return:
     *     @description When no arguments are passed, returns the current border style. When arguments are passed, returns the instance of the element for chaining.
     * @funcs: 4
     */
    border(): string;
    border(value: string): this;
    border(width: string | number, color: string): this;
    border(width: string | number, style: string, color: string): this;
    /**
     * @docs:
     * @title: Border Top
     * @desc: Sets the border top style for the element. Returns the current value when no parameters are provided.
     * @param:
     *     @name: values
     *     @descr: Values to set the border top, can include width, style, and color.
     * @return:
     *     @description Returns the current border top value if no parameters are provided; otherwise returns the instance of the element for chaining.
     * @funcs: 4
     */
    border_top(): string;
    border_top(value: string | number): this;
    border_top(width: string | number, color: string): this;
    border_top(width: string | number, style: string, color: string): this;
    /**
     * @docs:
     * @title: Border Bottom
     * @desc: Sets the border bottom style of the element. Returns the attribute value when no parameters are defined.
     * @param:
     *     @name: values
     *     @descr: A variable number of values to set the border bottom style.
     * @return:
     *     @description Returns the current border bottom style when no arguments are passed, otherwise returns the instance for chaining.
     * @funcs: 4
     */
    border_bottom(): string;
    border_bottom(value: string): this;
    border_bottom(width: string | number, color: string): this;
    border_bottom(width: string | number, style: string, color: string): this;
    /**
     * @docs:
     * @title: Border Right
     * @desc: Sets the border-right property of the element.
     *        Returns the current value if no parameters are provided.
     * @param:
     *     @name: values
     *     @descr: The values to set for the border-right property.
     * @return:
     *     @description Returns the instance of the element for chaining when parameters are provided,
     *                  otherwise returns the current value of the border-right property.
     * @funcs: 4
     */
    border_right(): string;
    border_right(value: string): this;
    border_right(width: string | number, color: string): this;
    border_right(width: string | number, style: string, color: string): this;
    /**
     * @docs:
     * @title: Border Left
     * @desc: Sets the left border style of the element. Returns the current value if no parameters are provided.
     * @param:
     *     @name: values
     *     @descr: The values to set for the border-left property.
     * @return:
     *     @description Returns the current value of the left border when no parameters are provided, otherwise returns the instance of the element for chaining.
     * @funcs: 2
     */
    border_left(): string;
    border_left(value: string): this;
    border_left(width: string | number, color: string): this;
    border_left(width: string | number, style: string, color: string): this;
    /**
     * @docs:
     * @title: Shadow
     * @desc: Sets the box shadow of the element. Can accept either 1 or 4 arguments for different shadow styles.
     * @param:
     *     @name: values
     *     @descr: The values to set the box shadow. Can be a single value or four separate values.
     * @return:
     *     @description Returns the current box shadow if no arguments are provided, or the instance of the element for chaining.
     * @funcs: 2
     */
    shadow(): string;
    shadow(value: string | number): this;
    shadow(value1: string | number, value2: string | number, value3: string | number, value4: string | string): this;
    /**
     * @docs:
     * @title: Drop Shadow
     * @desc: Applies a drop shadow effect to the object. Can handle 0, 1, or 4 arguments.
     * @param:
     *     @name: values
     *     @descr: The values for the drop shadow effect, which can be numbers or null.
     * @return:
     *     @description Returns the instance of the element for chaining when arguments are provided. If no arguments are passed, it returns the current filter value.
     * @funcs: 3
     */
    drop_shadow(): string;
    drop_shadow(value: string | number): this;
    drop_shadow(value1: string | number, value2: string | number, value3: string | number, value4: string): this;
    /**
     * @docs:
     * @title: Greyscale
     * @desc: Applies a greyscale filter to the element. Returns the current filter if no value is provided.
     * @param:
     *     @name: value
     *     @descr: The percentage value for greyscale. Can be a number or null.
     * @return:
     *     @description Returns the current filter value if no argument is passed, otherwise returns the instance for chaining.
     * @funcs: 2
     */
    greyscale(): string;
    greyscale(value: number): this;
    /**
     * @docs:
     * @title: Opacity
     * @desc: Set or get the opacity of the element based on its type.
     * @param:
     *     @name: value
     *     @descr: The value of the opacity to set, or null to get the current opacity.
     * @return:
     *     @description Returns the current opacity value if no argument is passed. When an argument is passed, it returns the instance of the element for chaining.
     * @funcs: 2
     */
    opacity(): string | number;
    opacity(value: string | number): this;
    /**
     * @docs:
     * @title: Toggle Opacity
     * @desc: Toggles the opacity of the element between a specified value and fully opaque.
     * @param:
     *     @name: value
     *     @descr: The value to set the opacity to when toggling.
     *     @default: 0.25
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    toggle_opacity(value: number): this;
    /**
     * @docs:
     * @title: Blur
     * @desc: Applies a blur effect to the element using the specified value.
     * @param:
     *     @name: value
     *     @descr: The amount of blur to apply, can be a number or null.
     * @return:
     *     @description Returns the instance of the element for chaining.
     * @funcs: 2
     */
    blur(): string;
    blur(value: number): this;
    /**
     * @docs:
     * @title: Toggle Blur
     * @desc: Toggles the blur effect on the element with a specified value.
     * @param:
     *     @name: value
     *     @descr: The amount of blur to apply, defaulting to 10.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    toggle_blur(value?: number): this;
    /**
     * @docs:
     * @title: Background Blur
     * @desc: Sets or retrieves the background blur effect for the element.
     * @param:
     *     @name: value
     *     @descr: The value to set for the blur effect, which can be a number or null.
     * @return:
     *     @description Returns the current blur effect if no argument is passed, otherwise returns the instance of the element for chaining.
     * @funcs: 2
     */
    background_blur(): string;
    background_blur(value: number | null): this;
    /**
     * @docs:
     * @title: Toggle Background Blur
     * @desc: Toggles the background blur effect by applying a backdrop filter.
     * @param:
     *     @name: value
     *     @descr: The intensity of the blur effect to apply.
     *     @default: 10
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    toggle_background_blur(value?: number): this;
    /**
     * @docs:
     * @title: Brightness
     * @desc: Adjusts the brightness of an element's filter. If no value is provided, it returns the current brightness filter.
     * @param:
     *     @name: value
     *     @descr: The brightness level to set, can be a number or null.
     * @return:
     *     @description Returns the instance of the element for chaining if a value is provided. Otherwise, returns the current brightness filter.
     * @funcs: 2
     */
    brightness(): string;
    brightness(value: number): this;
    /**
     * @docs:
     * @title: Toggle Brightness
     * @desc: Toggles the brightness of the element by applying a filter based on the provided value.
     * @param:
     *     @name: value
     *     @descr: The brightness value to set, defaults to 0.5 if not provided.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    toggle_brightness(value?: number): this;
    /**
     * @docs:
     * @title: Background Brightness
     * @desc: Adjusts the brightness of the background using a specified value.
     * If no value is provided, it retrieves the current backdrop filter.
     * @param:
     *     @name: value
     *     @descr: The brightness value to set, or null to get the current value.
     * @return:
     *     @description Returns the instance of the element for chaining when a value is provided, or the current backdrop filter value if no value is given.
     * @funcs: 2
     */
    background_brightness(): string;
    background_brightness(value: number): this;
    /**
     * @docs:
     * @title: Toggle Background Brightness
     * @desc: Toggles the background brightness by applying a filter based on the provided value.
     * @param:
     *     @name: value
     *     @descr: The brightness value to set, defaulting to 10 if not provided.
     * @return:
     *     @descr: Returns the instance of the element for chaining.
     */
    toggle_background_brightness(value?: number): this;
    /**
     * @docs:
     * @title: Rotate
     * @desc: Sets the rotation transformation for the element. When called without an argument, it retrieves the current rotation.
     * @param:
     *     @name: value
     *     @descr: The value to set as the rotation. It can be a number, string, or null.
     * @return:
     *     @description Returns the current rotation value as a string when no argument is passed. When an argument is provided, it returns the instance of the element for chaining.
     * @funcs: 2
     */
    rotate(): string;
    rotate(value: number | string): this;
    /**
     * @docs:
     * @title: Delay
     * @desc: Set the delay for keyframes in the style element.
     * @param:
     *     @name: value
     *     @descr: The value of the delay to set.
     * @return:
     *     @descr: Returns the instance of the element for chaining.
     */
    delay(value: string | number): this;
    /**
     * @docs:
     * @title: Duration
     * @desc: Sets the duration style property for the element.
     * @param:
     *     @name: value
     *     @descr: The value to set for the duration property.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    duration(value: string | number): this;
    /**
     * @docs:
     * @title: Background
     * @desc: A shorthand property for all the background properties.
     *        The equivalent of CSS attribute `background`.
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    background(): string;
    background(value: string): this;
    /**
     * @docs:
     * @title: Scale Font Size
     * @desc: Adjusts the font size based on a scaling factor relative to the current font size.
     * @param:
     *     @name: scale
     *     @descr: The scaling factor to apply to the current font size.
     *     @default: 1.0
     * @return:
     *     @descr: Returns the instance of the element for chaining.
     */
    scale_font_size(scale?: number): this;
    font_size_ratio(scale?: number): this;
    /**
     * @docs:
     * @title: Display
     * @desc: Sets or retrieves the display style of an HTML element.
     *         If no value is provided, it returns the current display style.
     * @param:
     *     @name: value
     *     @descr: The value to set for the display style.
     * @return:
     *     @descr: Returns the current display style if no argument is passed,
     *              otherwise returns the instance of the element for chaining.
     * @funcs: 2
     */
    display(): string;
    display(value: string): this;
    /**
     * @docs:
     * @title: Hide
     * @desc: Hides the element by setting its display style to none.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    hide(): this;
    /**
     * @docs:
     * @title: Show
     * @desc: Displays the element by setting its display style property.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    show(): this;
    /**
     * @docs:
     * @title: Is Hidden
     * @desc: Checks if the element is currently hidden based on its display style.
     * @return:
     *     @description Returns true if the element is hidden; otherwise, false.
     */
    is_hidden(): boolean;
    /**
     * @docs:
     * @title: Is Visible
     * @desc: Checks if the element is visible based on its display style.
     * @return:
     *     @description Returns true if the element is visible, false otherwise.
     */
    is_visible(): boolean;
    /**
     * @docs:
     * @title: Toggle Visibility
     * @desc: Toggles the visibility of the element by showing or hiding it based on its current state.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    toggle_visibility(): this;
    /**
     * @docs:
     * @title: Inner HTML
     * @desc: Get or set the inner HTML of an element.
     * @param:
     *     @name: value
     *     @descr: The HTML content to set. If no value is provided, the current inner HTML is returned.
     * @return:
     *     @description Returns the current inner HTML if no argument is passed, otherwise returns the instance of the element for chaining.
     * @funcs: 2
     */
    inner_html(): string;
    inner_html(value: string): this;
    /**
     * @docs:
     * @title: Outer HTML
     * @desc: Get or set the outer HTML of the element. If no argument is passed, it returns the current outer HTML.
     * @param:
     *     @name: value
     *     @descr: The outer HTML to set.
     * @return:
     *     @description Returns the instance of the element for chaining when an argument is passed, otherwise returns the current outer HTML.
     * @funcs: 2
     */
    outer_html(): string;
    outer_html(value: string): this;
    /**
     * @docs:
     * @title: Styles
     * @desc: Retrieves the CSS attributes when no parameter is provided, or sets the styles based on the provided attributes.
     * @param:
     *     @name: css_attr
     *     @descr: The CSS attributes to set. If null, returns the current styles.
     * @return:
     *     @description When no argument is passed, returns the current styles as an object. When attributes are set, returns the instance of the element for chaining.
     * @funcs: 2
     */
    styles(): Record<string, string>;
    styles(css_attr: Record<string, any>): this;
    /**
     * @docs:
     * @title: Attribute
     * @desc: Get or set a single attribute for an element. If no value is provided, it retrieves the attribute's current value.
     * @param:
     *     @name: key
     *     @descr: The name of the attribute to get or set.
     * @param:
     *     @name: value
     *     @descr: The value to set for the attribute. If null, the current value is returned.
     * @return:
     *     @description Returns the current value of the attribute if no value is provided, otherwise returns the instance of the element for chaining.
     * @funcs: 2
     */
    attr(key: string): null | string;
    attr(key: string, value: string | number | null): this;
    /**
     * @docs:
     * @title: Attributes
     * @desc: Sets multiple attributes for the element based on the provided dictionary.
     * @param:
     *     @name: html_attr
     *     @descr: A dictionary of attributes to set on the element.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    attrs(html_attr: Record<string, string | number | boolean>): this;
    /**
     * @docs:
     * @title: Event
     * @desc: Get or set a single event associated with the element.
     *         If no value is provided, it retrieves the current event.
     * @param:
     *     @name: key
     *     @descr: The name of the event to get or set.
     * @param:
     *     @name: value
     *     @descr: The value to set for the event, if provided.
     * @return:
     *     @description Returns the instance of the element for chaining when setting,
     *                  or the current value of the event when getting.
     * @funcs: 2
     */
    event(key: string): any;
    event(key: string, value: any): this;
    /**
     * @docs:
     * @title: Events
     * @desc: Sets multiple event handlers on the current element using a dictionary of events.
     * @param:
     *     @name: html_events
     *     @descr: An object containing event names as keys and their corresponding handler functions as values.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    events(html_events: {
        [key: string]: EventListener;
    }): this;
    /**
     * @docs:
     * @title: Class
     * @description:
     *     Specifies one or more classnames for an element (refers to a class in a style sheet).
     *     The equivalent of HTML attribute `class`.
     *     Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    class(): string;
    class(value: string): this;
    /**
     * @docs:
     * @title: Toggle class
     * @description: Toggles a class name from the class list, adding it if it's not present, or removing it if it is.
     * @param:
     *     @name: name
     *     @descr: The class name to toggle.
     * @return:
     *     @description: Returns the instance of the element for chaining.
     */
    toggle_class(name: string): this;
    /**
     * @docs:
     * @title: Remove Class
     * @desc: Remove a class name from the class list of the element.
     * @param:
     *     @name: name
     *     @descr: The class name to be removed from the class list.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    remove_class(name: string): this;
    /**
     * @docs:
     * @title: Remove all classes
     * @desc: Remove all classes from the class list.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    remove_classes(): this;
    /**
     * @docs:
     * @title: Hover Brightness
     * @desc: Controls the brightness effects on hover for the element.
     * You can enable or disable the effect or specify brightness levels.
     * @param:
     *     @name: mouse_down_brightness
     *     @descr: The brightness value when the mouse is down, or a boolean to enable/disable.
     * @param:
     *     @name: mouse_over_brightness
     *     @descr: The brightness value when the mouse is over the element.
     * @return:
     *     @description Returns the instance of the element for chaining when setting values, or a boolean indicating if the effect is enabled when no parameters are passed.
     * @funcs: 3
     */
    hover_brightness(): boolean;
    hover_brightness(mouse_down_brightness: boolean): this;
    hover_brightness(mouse_down_brightness: number, mouse_over_brightness: number): this;
    private static _lastPointerPos;
    /**
     * Returns true if the mouse’s last known position lies within
     * this element’s bounding rectangle (including borders).
     */
    is_mouse_over_frame(): boolean;
    /**
     * Apply on hover transitions.
     * @note This function also automatically sets the `transition` property for the target element. However, only when the transition attribute hasnt been set yet.
     * @param target The target node of which to apply
     * @param methods The methods to call and pass the `selected` value as arg to.
     * @param selected The selected hover argument value of the selected `methods`.
     * @param unselected The default non hover argument value of the selected `methods`.
     * @param methods The methods to call and pass the `selected` value as arg to.
     */
    hover_transitions(items: {
        target: "this" | "self" | AnyElement;
        selected: any;
        unselected: any;
        methods: string[];
        duration?: number;
        easing?: string;
    }[]): this;
    /**
     * @docs:
     * @title: Text Width
     * @desc: Calculates the width of the provided text or the current text content if no text is provided. This is useful for measuring text width in input elements.
     * @param:
     *     @name: text
     *     @descr: The text whose width is to be measured. If null, the current text content is used.
     * @return:
     *     @description Returns the width of the text in pixels.
     */
    text_width(): number;
    text_width(text: string): number;
    /**
     * @docs:
     * @title: Media Query
     * @desc: Creates a media query listener that triggers provided handlers based on the media query's state.
     * @param:
     *     @name: media_query
     *     @descr: The media query string to evaluate.
     *     @name: true_handler
     *     @descr: The function to execute when the media query matches.
     *     @name: false_handler
     *     @descr: The function to execute when the media query does not match.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    media(media_query: string, true_handler?: ElementCallback<this>, false_handler?: ElementCallback<this>): this;
    /**
     * @docs:
     * @title: Remove Media Query
     * @desc: Removes a specified media query from the element's media queries.
     * @param:
     *     @name: media_query
     *     @descr: The media query string to be removed.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    remove_media(media_query: string): this;
    /**
     * @docs:
     * @title: Remove Media Queries
     * @desc: Removes all media queries from the element.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    remove_medias(): this;
    /**
     * @docs:
     * @title: Remove All Media
     * @desc: Removes all media queries and their associated listeners from the element.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    remove_all_media(): this;
    /**
     * @docs:
     * @title: Default Animate
     * @desc: Calls the animate function from the superclass with the provided arguments.
     * @param:
     *     @name: args
     *     @descr: The arguments to pass to the superclass animate function.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    default_animate(...args: any[]): this;
    /**
     * @docs:
     * @title: Animate
     * @desc: Starts a new animation with the specified keyframes and options. Automatically resets the active animation.
     * @param:
     *     @name: options
     *     @descr: Configuration options for the animation including keyframes, duration, and callbacks.
     *     @attr:
     *         @name: keyframes
     *         @description An array of keyframe objects to animate.
     *         @name: delay
     *         @description Delay before starting the animation in milliseconds.
     *         @name: duration
     *         @description Duration of each keyframe in milliseconds.
     *         @name: repeat
     *         @description Whether the animation should repeat infinitely.
     *         @name: persistent
     *         @description Whether to keep the last keyframe when the animation ends.
     *         @name: on_finish
     *         @description Callback function to execute when the animation finishes.
     *         @name: easing
     *         @description Easing function to use for the animation.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    animate(options: {
        keyframes: Array<any>;
        delay?: number;
        duration?: number;
        repeat?: boolean;
        persistent?: boolean;
        on_finish?: ((element: any) => any) | null;
        easing?: string;
    }): this;
    /**
     * @docs:
     * @title: Stop Animation
     * @desc: Stops the currently active animation by clearing the timeout.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    stop_animation(): this;
    /**
     * @docs:
     * @title: Slide Out
     * @desc: Animates the sliding out of an element in a specified direction with optional parameters for customization.
     * @param:
     *     @name: options
     *     @descr: Configuration options for the slide out animation.
     *     @attr:
     *         @name: direction
     *         @description The direction of the slide animation.
     *         @default: "top"
     *         @name: distance
     *         @description The distance in pixels for the slide animation.
     *         @default: 100
     *         @name: duration
     *         @description The duration of the animation in milliseconds.
     *         @default: 500
     *         @name: opacity
     *         @description Whether to animate the opacity of the element.
     *         @default: true
     *         @name: easing
     *         @description The easing function for the animation.
     *         @default: "ease"
     *         @name: hide
     *         @description Whether to hide the element after the animation completes.
     *         @default: true
     *         @name: remove
     *         @description Whether to remove the element from the DOM after the animation completes.
     *         @default: false
     *         @name: display
     *         @description The display property to set when showing the element again.
     *         @default: null
     *         @name: _slide_in
     *         @description Indicates if the animation is a slide-in animation.
     *         @default: false
     * @return:
     *     @description Returns a promise that resolves when the animation completes.
     */
    slide_out(options: {
        direction: string;
        distance: number;
        duration: number;
        opacity?: boolean;
        easing?: string;
        hide?: boolean;
        remove?: boolean;
        display?: string;
        _slide_in?: boolean;
    }): Promise<void>;
    /**
     * @docs:
     * @title: Slide In
     * @desc: Initiates a slide-in animation for the element with customizable parameters.
     * @param:
     *     @name: options
     *     @descr: Configuration options for the slide-in animation.
     *     @attr:
     *         @name: direction
     *         @description The direction from which the element will slide in (e.g., "top", "bottom", "left", "right").
     *         @name: distance
     *         @description The distance in pixels the element will slide in.
     *         @name: duration
     *         @description The duration of the slide animation in milliseconds.
     *         @name: opacity
     *         @description A boolean indicating whether to animate the opacity during the slide.
     *         @name: easing
     *         @description The easing function to use for the animation.
     *         @name: display
     *         @description An optional display property to use when showing the view again.
     * @return:
     *     @description Returns a promise that resolves when the slide-in animation is complete.
     */
    slide_in({ direction, distance, duration, opacity, easing, display, }: {
        direction?: string;
        distance?: number;
        duration?: number;
        opacity?: boolean;
        easing?: string;
        display?: string;
    }): Promise<any>;
    /**
     * @docs:
     * @title: Dropdown Text Animation
     * @desc: Animates the text of a dropdown element with a specified animation effect.
     *         It allows for customization of distance, duration, and easing for each character.
     * @warning: Causes undefined behaviour when called on a non text element.
     * @param:
     *     @name: options
     *     @descr: An object containing animation settings.
     *     @attr:
     *         @name: distance
     *         @description The distance of pixels of the drop (negative) or rise (positive).
     *         @name: duration
     *         @description The duration of each individual character drop animation in milliseconds.
     *         @name: opacity_duration
     *         @description The factor for the duration in relation to the dropdown duration, 1.0 for 100%.
     *         @name: total_duration
     *         @description The total duration of the character drop animation, this parameter will overwrite the `duration` parameter.
     *         @name: delay
     *         @description The delay in milliseconds for each character drop.
     *         @name: start_delay
     *         @description The start delay of the animation in milliseconds.
     *         @name: easing
     *         @description The animation's easing.
     * @return:
     *     @description Returns a promise that resolves when the animation is complete.
     */
    dropdown_animation({ distance, duration, opacity_duration, total_duration, delay, start_delay, easing, }?: {
        distance?: string;
        duration?: number;
        opacity_duration?: number;
        total_duration?: number;
        delay?: number;
        start_delay?: number;
        easing?: string;
    }): Promise<void>;
    /**
     * @docs:
     * @title: Increment Number Animation
     * @desc: Animate incrementing a number with optional prefix and suffix.
     * @warning: Causes undefined behaviour when called on a non text element.
     * @param:
     *     @name: start
     *     @descr: The start number for the animation.
     * @param:
     *     @name: end
     *     @descr: The end number, the animation will end with the number value of `end - 1`.
     * @param:
     *     @name: duration
     *     @descr: The duration of each individual number increment in milliseconds.
     * @param:
     *     @name: total_duration
     *     @descr: The total duration of the entire animation, parameter `total_duration` precedes parameter `duration`.
     * @param:
     *     @name: delay
     *     @descr: The delay until the animation starts in milliseconds.
     * @param:
     *     @name: prefix
     *     @descr: The prefix string to prepend to the animated number.
     * @param:
     *     @name: suffix
     *     @descr: The suffix string to append to the animated number.
     * @return:
     *     @descr: Returns a promise that resolves when the animation completes.
     */
    increment_number_animation({ start, end, duration, total_duration, delay, prefix, suffix, }?: {
        start?: number;
        end?: number;
        duration?: number;
        total_duration?: number;
        delay?: number;
        prefix?: string;
        suffix?: string;
    }): Promise<void>;
    fade_out_top(size?: number): this;
    fade_out_right(size?: number): this;
    fade_out_bottom(size?: number): this;
    fade_out_left(size?: number): this;
    on(type: keyof HTMLElementEventMap, callback: (element: this, event: HTMLElementEventMap[keyof HTMLElementEventMap]) => any, options?: boolean | AddEventListenerOptions): this;
    on_event_listener<K extends keyof HTMLElementEventMap>(type: K, callback: (element: this, event: HTMLElementEventMap[K]) => any, options?: boolean | AddEventListenerOptions): this;
    /**
     * @docs:
     * @title: On emit
     * @desc: Registers an event callback for the specified event ID. This allows the element to respond to events.
     * @param:
     *     @name: id
     *     @descr: The unique identifier for the event to listen for.
     *     @name: callback
     *     @descr: The function to be executed when the event is triggered.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    on_emit(id: string, callback: (element: this, args: Record<string, any>) => any): this;
    /**
     * @docs:
     * @title: Remove On Event
     * @desc: Removes an event listener for the specified event ID.
     * @param:
     *     @name: id
     *     @descr: The identifier for the event to remove.
     * @param:
     *     @name: callback
     *     @descr: The function that was originally registered as the event handler.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    remove_on_event(id: string, callback: (element: this, args: Record<string, any>) => any): this;
    /**
     * @docs:
     * @title: Remove On Events
     * @desc: Removes all event callbacks associated with the given ID.
     * @param:
     *     @name: id
     *     @descr: The identifier for the events to be removed.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    remove_on_events(id: string): this;
    /**
     * @docs:
     * @title: Timeout
     * @desc: Sets a timeout with optional id and debounce functionality.
     * @param:
     *     @name: delay
     *     @descr: The time in milliseconds to wait before executing the callback.
     *     @name: callback
     *     @descr: The function to execute after the timeout.
     *     @name: options
     *     @descr: Optional settings for the timeout behavior.
     *     @attr:
     *         @name: id
     *         @description An optional identifier for the timeout.
     *         @name: debounce
     *         @description If true, clears the previous timeout with the same id.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    timeout(delay: number, callback: ElementCallback<this>, options?: {
        id?: string;
        debounce?: boolean;
    } | null): this;
    /**
     * @docs:
     * @title: Clear Timeout
     * @desc: Clears a cached timeout by its ID. If timeouts are not initialized, they will be set up.
     * @param:
     *     @name: id
     *     @descr: The ID of the timeout to clear.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    clear_timeout(id: string | number): this;
    private _disabled_cursor?;
    /**
     * @docs:
     * @title: Disable Button
     * @desc: Disables the button element, preventing user interaction.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    disable(): this;
    /**
     * @docs:
     * @title: Enable Button
     * @desc: Enables the button by setting the disabled state to false.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    enable(): this;
    /**
     * @docs:
     * @title: On Click
     * @desc: Sets a click event handler for the element, allowing for optional simulated href behavior.
     * @param:
     *     @name: simulate_href
     *     @descr: The simulated href to set for the element (for SEO in SPAs).
     *     @name: callback
     *     @descr: The function to be called when the element is clicked.
     * @return:
     *     @description Returns the instance of the element for chaining when an argument is passed, otherwise returns the current onclick handler.
     * @funcs: 2
     */
    /**
     * @warning NEVER change that this overrides the last on click callback
     *          Volt & libris depend on this behaviour.
     *          Let users add multiple etc using the `on()` method.
     */
    on_click(): null | Function;
    on_click(simulate_href: string | null, callback: Function): this;
    on_click(callback?: Function): this;
    /**
     * @docs:
     * @title: On Click Redirect
     * @desc: Sets up a click event that redirects to the specified URL when triggered.
     * @param:
     *     @name: url
     *     @descr: The URL to redirect to when the click event occurs.
     * @return:
     *     @descr: Returns the instance of the element for chaining.
     */
    on_click_redirect(url: string): this;
    /**
     * @docs:
     * @title: On Scroll
     * @description:
     *     Script to be run when an element's scrollbar is being scrolled.
     *     The equivalent of HTML attribute `onscroll`. The first parameter of the callback is the `VElement` object.
     *     Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: opts_or_callback
     *     @description: Options or callback function to assign for the scroll event.
     *     @attr:
     *         @name: callback
     *         @description Function to be called on scroll.
     *         @name: delay
     *         @description Delay in milliseconds before executing the callback.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     */
    on_scroll(): (EventListener | null);
    on_scroll(opts_or_callback: Function | {
        callback: (element: any, event: Event) => any;
        delay?: number;
    }): this;
    /**
     * @docs:
     * @title: On Resize
     * @desc: Script to be run when the browser window is being resized.
     *        This allows for a callback to be executed upon resizing the window.
     * @param:
     *     @name: callback
     *     @descr: The function to be called when the window is resized.
     * @param:
     *     @name: once
     *     @descr: If true, the callback will only be executed once after the last resize event.
     * @param:
     *     @name: delay
     *     @descr: The delay in milliseconds before executing the callback.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    on_window_resize(): null | Function;
    on_window_resize(opts: Function | {
        callback?: Function;
        once?: boolean;
        delay?: number;
    }): this;
    /**
     * @docs:
     * @title: Attachment Drop
     * @desc: Custom on attachment drop event handling. This function sets up event listeners for drag and drop actions.
     * @param:
     *     @name: options
     *     @descr: Configuration options for the drop event.
     *     @attr:
     *         @name: callback
     *         @description Function to be called with the attachment details.
     *     @attr:
     *         @name: read
     *         @description Indicates whether to read the file data.
     *     @attr:
     *         @name: compress
     *         @description Function to compress the data, `Compression.compress` is advised.
     *     @attr:
     *         @name: on_start
     *         @description Function to be called when the drag starts.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    on_attachment_drop(options: {
        callback: (args: {
            name: string;
            path: string;
            is_dir: boolean;
            data: any;
            compressed: boolean;
            file: File;
            size: number;
        }) => any;
        read?: boolean;
        compress?: (string: any) => any;
        on_start?: (event: DragEvent) => any;
    }): this;
    /**
     * @docs:
     * @title: On Appear
     * @desc: Sets a callback to be executed when the element appears in the viewport.
     * @param:
     *     @name: callback_or_opts
     *     @descr: Can be a callback function or an options object containing callback, repeat, and threshold.
     *     @attr:
     *         @name: callback
     *         @description The function to call when the element appears.
     *         @name: repeat
     *         @description If true, the callback will be called every time the element appears.
     *         @name: threshold
     *         @description The intersection ratio threshold to trigger the callback.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    on_appear<T = this>(callback: OnAppearCallback<T>): this;
    on_appear<T = this>(options: {
        callback: OnAppearCallback<T>;
        repeat?: boolean;
        threshold?: number | null;
    }): this;
    /**
     * @docs:
     * @title: On Disappear
     * @desc: Sets up an event listener that triggers a callback when the element disappears from the user's view.
     * @experimental: true
     * @param:
     *     @name: callback_or_opts
     *     @descr: Can be a callback function or an options object containing the callback and repeat settings.
     *     @attr:
     *         @name: callback
     *         @description The function to call when the element disappears.
     *         @name: repeat
     *         @description Whether to repeat the observation after the callback is triggered.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    on_disappear<T = this>(callback_or_opts?: ((element: T) => any) | {
        callback?: (element: T) => any;
        repeat?: boolean;
    }): this;
    /**
     * @docs:
     * @title: On Enter
     * @desc: Sets a callback function to be executed when the Enter key is pressed on input or textarea elements.
     * @param:
     *     @name: callback
     *     @descr: The function to be called when the Enter key is pressed.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    on_enter(): undefined | ElementKeyboardEvent<this>;
    on_enter(callback: ElementKeyboardEvent<this>): this;
    /**
     * @docs:
     * @title: On Escape
     * @desc: Sets a callback function to be triggered when the Escape key is pressed.
     * @param:
     *     @name: callback
     *     @descr: The function to be called when the Escape key is pressed.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    on_escape(): undefined | ElementKeyboardEvent<this>;
    on_escape(callback: ElementKeyboardEvent<this>): this;
    /**
     * @docs:
     * @title: On Theme Update
     * @desc: Manages theme update callbacks. If no callback is provided, it returns the current callbacks.
     * @param:
     *     @name: callback
     *     @descr: A function to be called on theme updates or null to retrieve existing callbacks.
     * @return:
     *     @description Returns the instance of the element for chaining when a callback is provided, or the array of existing callbacks if null is passed.
     * @funcs: 2
     */
    on_theme_update(): ThemeUpdateCallback<this>[];
    on_theme_update(callback: ThemeUpdateCallback<this>): this;
    /**
     * @docs:
     * @title: Remove on Theme Update
     * @desc: Removes a callback from the theme update listeners.
     * @param:
     *     @name: callback
     *     @descr: The callback function to be removed from the listeners.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    remove_on_theme_update(callback: ThemeUpdateCallback<this>): this;
    /**
     * @docs:
     * @title: Remove on Theme Updates
     * @desc: Clears the list of theme update callbacks if they exist.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    remove_on_theme_updates(): this;
    /**
     * @docs:
     * @title: On Render
     * @desc: Manages callbacks that are triggered when the element is added to the body.
     * @param:
     *     @name: callback
     *     @descr: A function to be called when the element is rendered. If no argument is passed, it returns the current callbacks.
     * @return:
     *     @description When a callback is provided, returns the instance of the element for chaining. If no callback is provided, returns the array of current callbacks.
     * @funcs: 2
     */
    on_render(): (ElementCallback<this>)[];
    on_render(callback: ElementCallback<this>): this;
    /**
     * @docs:
     * @title: Remove on Render
     * @desc: Removes a callback from the on render callbacks array and stops observing if empty.
     * @param:
     *     @name: callback
     *     @descr: The callback function to remove from the on render callbacks.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    remove_on_render(callback: ElementCallback<this>): this;
    /**
     * @docs:
     * @title: Remove On Renders
     * @desc: Clears the on render callbacks and stops observing the element for render events.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    remove_on_renders(): this;
    /**
     * @docs:
     * @title: Is Rendered
     * @desc: Checks whether the element has been rendered or not.
     * @return:
     *     @description Returns true if the element has been rendered, otherwise false.
     */
    is_rendered(): boolean;
    /**
     * @docs:
     * @title: On Load
     * @desc: Registers a callback to be executed when the entire page is fully loaded.
     *          Note that this event will not fire if the `window.onload` callback is overwritten.
     * @param:
     *     @name: callback
     *     @descr: The function to be executed on load.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    on_load(callback: (element: this, args: Record<string, any>) => any): this;
    /**
     * @docs:
     * @title: Remove on Load
     * @desc: Removes a callback function from the "volt.on_load" event.
     * @param:
     *     @name: callback
     *     @descr: The function to be removed from the event listener.
     * @return:
     *     @descr: Returns the instance of the element for chaining.
     */
    remove_on_load(callback: (element: this, args: Record<string, any>) => any): this;
    /**
     * @docs:
     * @title: Remove On Loads
     * @desc: Removes the on_load event listener from the instance.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    remove_on_loads(): this;
    /**
     * @docs:
     * @title: On Resize
     * @desc: Manages callbacks for the resize event. Can retrieve existing callbacks or add new ones.
     * @param:
     *     @name: callback
     *     @descr: The callback function to be executed on resize events.
     * @return:
     *     @descr: When a callback is provided, returns the instance for chaining. Otherwise, returns the list of existing resize callbacks.
     * @funcs: 2
     */
    on_resize(): (ElementCallback<this>)[];
    on_resize(callback: ElementCallback<this>): this;
    /**
     * @docs:
     * @title: Remove on Resize
     * @desc: Removes a callback from the resize event listeners. If no callbacks remain, it stops observing resize events.
     * @param:
     *     @name: callback
     *     @descr: The callback function to remove from the resize event listeners.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    remove_on_resize(callback: ElementCallback<this>): this;
    /**
     * @docs:
     * @title: Remove on Resizes
     * @desc: Removes all resize callbacks and stops observing resize events for this element.
     * @param:
     *     @name: callback
     *     @descr: A callback function to be removed from the resize callbacks.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    remove_on_resizes(): this;
    /**
     * @docs:
     * @title: On Resize Rule
     * @desc: Adds an on resize rule event that executes callbacks based on evaluation changes during a resize event.
     * @note: This function adds an `on_resize` callback.
     * @param:
     *     @name: evaluation
     *     @descr: The function to evaluate if the statement is true, the element node is passed as the first argument.
     * @param:
     *     @name: on_true
     *     @descr: The callback executed if the statement is true, the element node is passed as the first argument.
     * @param:
     *     @name: on_false
     *     @descr: The callback executed if the statement is false, the element node is passed as the first argument.
     * @return:
     *     @descr: Returns the instance of the element for chaining.
     */
    on_resize_rule(evaluation: (element: this) => boolean, on_true?: ElementCallback<this>, on_false?: ElementCallback<this>): this;
    /**
     * @docs:
     * @title: On Shortcut
     * @desc: Create key shortcuts for the element. This function takes an array of shortcut objects that define the key combinations and their associated actions.
     * @param:
     *     @name: shortcuts
     *     @descr: The array with shortcuts. Each shortcut object may have various attributes to define the key matching criteria and actions.
     * @return:
     *     @descr: This function does not return a value.
     */
    on_shortcut(shortcuts?: {
        match?: (event: KeyboardEvent, key: string, shortcut: any) => boolean;
        key?: string;
        keys?: string[];
        keycode?: number;
        keycodes?: number[];
        or?: boolean;
        duration?: number;
        shift?: boolean;
        alt?: boolean;
        ctrl?: boolean;
        allow_other_modifiers?: boolean;
        callback: (element: any, event: KeyboardEvent) => any;
    }[]): this;
    /**
     * MOVED docs:
     * @title: On Context Menu
     * @desc:
     *     Script to be run when a context menu is triggered. This function can set or get the context menu callback.
     * @param:
     *     @name: callback
     *     @descr:
     *         The parameter may either be a callback function, a ContextMenu object, or an Array as the ContextMenu parameter.
     * @return:
     *     @description Returns the `VElement` object. If `callback` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    /**
     * @docs:
     * @title: On Mouse Enter
     * @desc: Sets a callback function to be called when the mouse enters the element.
     * @param:
     *     @name: callback
     *     @descr: The function to be called on mouse enter.
     * @return:
     *     @descr: When a callback is provided, returns the instance of the element for chaining. If no callback is provided, returns the current callback.
     * @funcs: 2
     */
    on_mouse_enter(): ElementMouseEvent<this>;
    on_mouse_enter(callback: ElementMouseEvent<this>): this;
    /**
     * @docs:
     * @title: On Mouse Leave
     * @desc: Sets or retrieves the callback function to be called when the mouse leaves the element.
     * @param:
     *     @name: callback
     *     @descr: The function to execute when the mouse leaves the element.
     * @return:
     *     @description When an argument is passed this function returns the instance of the element for chaining. Otherwise, it returns the currently set callback function.
     * @funcs: 2
     */
    on_mouse_leave(): ElementMouseEvent<this>;
    on_mouse_leave(callback: ElementMouseEvent<this>): this;
    /**
     * @docs:
     * @title: On mouse over and out
     * @desc: Set callbacks for the on mouse over and mouse out events.
     * @param:
     *     @name: mouse_over
     *     @descr: The mouse over callback.
     * @param:
     *     @name: mouse_out
     *     @descr: The mouse out callback.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    on_mouse_over_out(mouse_over: ElementMouseEvent<this>, mouse_out: ElementMouseEvent<this>): this;
    /**
     * @docs:
     * @title: First Child
     * @desc: Retrieves the first child of the element.
     * @return:
     *     @description Returns the first child node of the element, or null if there are no children.
     */
    first_child(): Node | null;
    /**
     * @docs:
     * @title: Last Child
     * @desc: Retrieves the last child of the element.
     * @return:
     *     @description Returns the last child node of the element, or null if there are no children.
     */
    last_child(): ChildNode | null;
    /**
     * @docs:
     * @title: Iterate Children
     * @desc: Iterates over the children of an element, executing a handler function for each child.
     * @param:
     *     @name: start
     *     @descr: The starting index for iteration, or a handler function.
     *     @name: end
     *     @descr: The ending index for iteration.
     *     @name: handler
     *     @descr: The function to execute for each child.
     * @return:
     *     @description Returns the result of the handler function if not null, otherwise returns null.
     * @funcs: 2
     */
    iterate(start: number | ((child: any, index: number) => any), end?: number, handler?: (child: any, index: number) => any): any;
    /**
     * @docs:
     * @title: Iterate Child Nodes
     * @desc: Iterates over the child nodes of an element, executing a handler function for each node.
     * @param:
     *     @name: start
     *     @descr: The starting index for iteration, or a handler function.
     *     @name: end
     *     @descr: The ending index for iteration.
     *     @name: handler
     *     @descr: The function to execute for each child node.
     * @return:
     *     @description Returns the result of the handler function if not null, otherwise returns null.
     * @funcs: 2
     */
    iterate_nodes(start: number | ((node: any, index: number) => any), end?: number, handler?: (node: any, index: number) => any): any;
    /**
     * @docs:
     * @title: Set Default
     * @desc: Sets the current element as the default, allowing for a specific type to be set.
     * @param:
     *     @name: Type
     *     @descr: The type to set as default, defaults to VElement if null.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    set_default(Type?: any): this;
    /**
     * @docs:
     * @title: Assign
     * @desc: Assigns a function or property to the instance. This allows dynamic property assignment for elements.
     * @param:
     *     @name: name
     *     @descr: The name of the property or function to assign.
     *     @name: value
     *     @descr: The value to assign to the property or function.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    assign(name: string, value: any): this;
    /**
     * @docs:
     * @title: Extend
     * @desc: Extends the current instance by adding properties or functions from the provided object.
     * @param:
     *     @name: obj
     *     @descr: The object containing properties or functions to add to the current instance.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    extend<T extends Record<string, any>>(props: T & ThisType<this & T>): this & T;
    /**
     * @docs:
     * @title: Select Contents
     * @desc: Selects the contents of the object, optionally overwriting existing selections.
     * @param:
     *     @name: overwrite
     *     @descr: Indicates whether to overwrite the current selection.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    select(overwrite?: boolean): this;
    /**
     * @docs:
     * @title: Is Scrollable
     * @desc: Determines whether the element is scrollable based on its dimensions.
     * @return:
     *     @description Returns true if the element's scroll height or width exceeds its client height or width, indicating it is scrollable.
     */
    is_scrollable(): boolean;
    /**
     * @docs:
     * @title: Is Scrollable X
     * @desc: Checks if the element is scrollable in the horizontal direction by comparing its scroll width with its client width.
     * @return:
     *     @description Returns true if the element is scrollable horizontally, otherwise false.
     */
    is_scrollable_x(): boolean;
    /**
     * @docs:
     * @title: Is Scrollable Y
     * @desc: Checks if the element is scrollable vertically by comparing its scroll height to its client height.
     * @return:
     *     @description Returns true if the element is scrollable in the Y direction, otherwise false.
     */
    is_scrollable_y(): boolean;
    /**
     * @docs:
     * @title: Wait Till Children Rendered
     * @desc: Waits until the element and all its children are fully rendered.
     * This function should only be used in the `on_render` callback.
     * Note that it does not work with non-volt nodes and may not function correctly.
     * @param:
     *     @name: timeout
     *     @descr: The maximum time to wait for rendering in milliseconds.
     *     @default: 10000
     * @return:
     *     @description Returns a promise that resolves when all children are rendered or rejects on timeout.
     */
    wait_till_children_rendered(timeout?: number): Promise<void>;
    /**
     * @docs:
     * @title: Add Pseudo
     * @desc: Adds a pseudo element of a specified type to a node.
     *         Ensures that the pseudo element is properly initialized and styled.
     * @param:
     *     @name: type
     *     @descr: The type of pseudo element to add (e.g., before, after).
     *     @name: node
     *     @descr: The node to which the pseudo element is added.
     * @return:
     *     @descr: Returns the instance of the element for chaining.
     */
    pseudo(type: string, pseudo: PseudoElement): this;
    /**
     * @docs:
     * @title: Remove Pseudo
     * @desc: Remove a pseudo element by the specified node.
     * @param:
     *     @name: node
     *     @descr: The node from which the pseudo element will be removed.
     *     @attr:
     *         @name: pseudo_id
     *         @description Identifier for the pseudo element to be removed.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    remove_pseudo(type: string, pseudo: PseudoElement): this;
    /**
     * @docs:
     * @title: Remove Pseudos
     * @desc:
     *      Removes all pseudo classes and stylesheets associated with the element.
     *      This function iterates through the class list and removes classes that start with "pseudo_".
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    remove_pseudos(): this;
    /**
     * @docs:
     * @title: Add Pseudo Hover
     * @desc: Adds a pseudo element on mouse hover. This function does not work in combination with other mouse over events.
     * @param:
     *     @name: type
     *     @descr: The type of pseudo element to add.
     *     @name: node
     *     @descr: The node to which the pseudo element will be applied.
     *     @name: set_defaults
     *     @descr: A flag to set default values for the node.
     *     @default: true
     * @return:
     *     @descr: Returns the instance of the element for chaining.
     */
    pseudo_on_hover(type: string, pseudo: PseudoElement, set_defaults?: boolean): this;
    /**
     * @docs:
     * @title: Parent
     * @desc: Get or set the parent element of the current element.
     *         This is particularly relevant for child elements of specific derived classes.
     * @param:
     *     @name: value
     *     @descr: The parent element to set or null to retrieve the current parent.
     * @return:
     *     @description If a value is provided, it sets the parent and returns the instance for chaining.
     *                  If no value is provided, it returns the current parent element or null if not set.
     * @funcs: 2
     */
    parent<T = undefined | VElement | HTMLElement>(): T;
    parent(value: any): this;
    /**
     * @docs:
     * @title: Absolute Parent
     * @desc: Sets or gets the absolute parent of the custom element.
     * When called without arguments, it returns the current absolute parent;
     * when called with an argument, it sets the absolute parent and returns the instance for chaining.
     * @param:
     *     @name: value
     *     @descr: The absolute parent to set.
     * @return:
     *     @descr: Returns the instance of the element for chaining when an argument is passed;
     * otherwise, returns the current absolute parent.
     * @funcs: 2
     */
    abs_parent<T = undefined | VElement | HTMLElement>(): T;
    abs_parent(value: any): this;
    /**
     * @docs:
     * @title: Assign to Parent As
     * @desc: Assigns the current element to a specified attribute of the parent element.
     * @param:
     *     @name: name
     *     @descr: The name of the attribute to assign the current element to.
     * @return:
     *     @descr: Returns the instance of the element for chaining.
     */
    assign_to_parent_as(name: string): this;
    /**
     * @docs:
     * @title: Get Y Offset From Parent
     * @desc: Calculates the vertical offset of the current node relative to a specified parent node.
     * @param:
     *     @name: parent
     *     @descr: The parent node from which to calculate the offset.
     * @return:
     *     @description Returns the accumulated vertical offset from the current node to the parent node, or null if the parent wasn't found.
     * @deprecated: true
     */
    get_y_offset_from_parent(parent: HTMLElement): number | null;
    /**
     * @docs:
     * @title: Absolute Y Offset
     * @desc: Calculates the absolute vertical offset of the element from the top of the document.
     * @return:
     *     @description Returns the absolute Y offset in pixels.
     */
    absolute_y_offset(): number;
    /**
     * @docs:
     * @title: Absolute X Offset
     * @desc: Calculates the absolute X offset of the current element in relation to its offset parents.
     * @return:
     *     @description Returns the total left offset in pixels as a number.
     */
    absolute_x_offset(): number;
    /**
     * @docs:
     * @title: Exec
     * @desc: Executes a provided function with the current element as its parameter.
     * @param:
     *     @name: callback
     *     @descr: A function to execute with the current element.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    exec(callback: ElementCallback<this>): this;
    /**
     * @docs:
     * @title: Is child
     * @desc: Check if an element is a direct child of the element or the element itself.
     * @param:
     *     @name: target
     *     @descr: The target element to test.
     * @return:
     *     @description Returns true if the target is a direct child, otherwise false.
     */
    is_child(target: any): boolean;
    /**
     * @docs:
     * @title: Is Child
     * @desc: Checks if an element is a recursively nested child of the element or the element itself.
     * @param:
     *     @name: target
     *     @descr: The target element to test.
     * @param:
     *     @name: stop_node
     *     @descr: A node at which to stop checking if target is a parent of the current element.
     * @return:
     *     @descr: Returns true if the target is a nested child, otherwise false.
     */
    is_nested_child(target: any, stop_node?: any): boolean;
    /**
     * @docs:
     * @title: To String
     * @desc: Converts the current element to its string representation, setting an attribute in the process.
     * @return:
     *     @description Returns the outer HTML of the element as a string.
     */
    toString(): string;
    accent_color(): string;
    accent_color(value: string): this;
    align_content(): string;
    align_content(value: string): this;
    align_items(): string;
    align_items(value: string): this;
    align_self(): string;
    align_self(value: string): this;
    all(): string;
    all(value: string): this;
    animation(): string;
    animation(value: string): this;
    animation_delay(): string;
    animation_delay(value: string | number): this;
    animation_direction(): string;
    animation_direction(value: string): this;
    animation_duration(): string;
    animation_duration(value: string | number): this;
    animation_fill_mode(): string;
    animation_fill_mode(value: string): this;
    animation_iteration_count(): string;
    animation_iteration_count(value: string | number): this;
    animation_name(): string;
    animation_name(value: string): this;
    animation_play_state(): string;
    animation_play_state(value: string): this;
    animation_timing_function(): string;
    animation_timing_function(value: string): this;
    aspect_ratio(): string;
    aspect_ratio(value: string): this;
    backdrop_filter(): string;
    backdrop_filter(value: string): this;
    backface_visibility(): string;
    backface_visibility(value: string): this;
    background_attachment(): string;
    background_attachment(value: string): this;
    background_blend_mode(): string;
    background_blend_mode(value: string): this;
    background_clip(): string;
    background_clip(value: string): this;
    background_color(): string;
    background_color(value: string): this;
    background_image(): string;
    background_image(value: string): this;
    background_origin(): string;
    background_origin(value: string): this;
    background_position(): string;
    background_position(value: string): this;
    background_position_x(): string;
    background_position_x(value: string | number): this;
    background_position_y(): string;
    background_position_y(value: string | number): this;
    background_repeat(): string;
    background_repeat(value: string): this;
    background_size(): string;
    background_size(value: string | number): this;
    block_size(): string;
    block_size(value: string | number): this;
    border_block(): string;
    border_block(value: string): this | string;
    border_block_color(): string;
    border_block_color(value: string): this;
    border_block_end_color(): string;
    border_block_end_color(value: string): this;
    border_block_end_style(): string;
    border_block_end_style(value: string): this;
    border_block_end_width(): string;
    border_block_end_width(value: string | number): this;
    border_block_start_color(): string;
    border_block_start_color(value: string): this;
    border_block_start_style(): string;
    border_block_start_style(value: string): this;
    border_block_start_width(): string;
    border_block_start_width(value: string | number): this;
    border_block_style(): string;
    border_block_style(value: string): this;
    border_block_width(): string;
    border_block_width(value: string | number): this;
    border_bottom_color(): string;
    border_bottom_color(value: string): this;
    border_bottom_left_radius(): string;
    border_bottom_left_radius(value: string | number): this;
    border_bottom_right_radius(): string;
    border_bottom_right_radius(value: string | number): this;
    border_bottom_style(): string;
    border_bottom_style(value: string): this;
    border_bottom_width(): string;
    border_bottom_width(value: string | number): this;
    border_collapse(): string;
    border_collapse(value: string): this;
    border_color(): string;
    border_color(value: string): this;
    border_image(): string;
    border_image(value: string): this;
    border_image_outset(): string;
    border_image_outset(value: string | number): this;
    border_image_repeat(): string;
    border_image_repeat(value: string): this;
    border_image_slice(): string;
    border_image_slice(value: string | number): this;
    border_image_source(): string;
    border_image_source(value: string): this;
    border_image_width(): string;
    border_image_width(value: string | number): this;
    border_inline(): string;
    border_inline(value: string | number): this;
    border_inline_color(): string;
    border_inline_color(value: string): this;
    border_inline_end_color(): string;
    border_inline_end_color(value: string): this;
    border_inline_end_style(): string;
    border_inline_end_style(value: string): this;
    border_inline_end_width(): string;
    border_inline_end_width(value: string | number): this;
    border_inline_start_color(): string;
    border_inline_start_color(value: string): this;
    border_inline_start_style(): string;
    border_inline_start_style(value: string): this;
    border_inline_start_width(): string;
    border_inline_start_width(value: string | number): this;
    border_inline_style(): string;
    border_inline_style(value: string): this;
    border_inline_width(): string;
    border_inline_width(value: string | number): this;
    border_left_color(): string;
    border_left_color(value: string): this;
    border_left_style(): string;
    border_left_style(value: string): this;
    border_left_width(): string;
    border_left_width(value: string | number): this;
    border_radius(): string;
    border_radius(value: string | number): this;
    border_right_color(): string;
    border_right_color(value: string): this;
    border_right_style(): string;
    border_right_style(value: string): this;
    border_right_width(): string;
    border_right_width(value: string | number): this;
    border_spacing(): string;
    border_spacing(value: string | number): this;
    border_style(): string;
    border_style(value: string): this;
    border_top_color(): string;
    border_top_color(value: string): this;
    border_top_left_radius(): string;
    border_top_left_radius(value: string | number): this;
    border_top_right_radius(): string;
    border_top_right_radius(value: string | number): this;
    border_top_style(): string;
    border_top_style(value: string): this;
    border_top_width(): string;
    border_top_width(value: string | number): this;
    border_width(): string;
    border_width(value: string | number): this;
    bottom(): string;
    bottom(value: string | number): this;
    box_decoration_break(): string;
    box_decoration_break(value: string): this;
    box_reflect(): string;
    box_reflect(value: string): this;
    box_shadow(): string;
    box_shadow(value: string): this;
    box_sizing(): string;
    box_sizing(value: string): this;
    break_after(): string | this;
    break_after(value: string): this;
    break_before(): string;
    break_before(value: string): this;
    break_inside(): string;
    break_inside(value: string): this;
    caption_side(): string;
    caption_side(value: string): this;
    caret_color(): string;
    caret_color(value: string): this;
    clear(): string;
    clear(value: string): this;
    clip(): string;
    clip(value: string): this;
    column_count(): null | number;
    column_count(value: string | number): this;
    column_fill(): string;
    column_fill(value: string): this;
    column_gap(): string;
    column_gap(value: string | number): this;
    column_rule(): string;
    column_rule(value: string): this;
    column_rule_color(): string;
    column_rule_color(value: string): this;
    column_rule_style(): string;
    column_rule_style(value: string): this;
    column_rule_width(): string;
    column_rule_width(value: string | number): this;
    column_span(): null | number;
    column_span(value: number): this;
    column_width(): string;
    column_width(value: string | number): this;
    columns(): string;
    columns(value: string | number): this;
    content(): string;
    content(value: string | number): this;
    counter_increment(): string;
    counter_increment(value: string | number): this;
    counter_reset(): string;
    counter_reset(value: string): this;
    cursor(): string;
    cursor(value: string): this;
    direction(): string;
    direction(value: string): this;
    empty_cells(): string;
    empty_cells(value: string): this;
    filter(): string;
    filter(value: string): this;
    flex(): string;
    flex(value: boolean | number | string): this;
    flex_basis(): string;
    flex_basis(value: string | number): this;
    flex_direction(): string;
    flex_direction(value: string): this;
    flex_flow(): string;
    flex_flow(value: string): this;
    flex_grow(): null | number;
    flex_grow(value: string | number): this;
    flex_shrink(): null | number;
    flex_shrink(value: string | number): this;
    flex_wrap(): string;
    flex_wrap(value: string): this;
    float(): string;
    float(value: string): this;
    font(): string;
    font(value: string): this;
    font_family(): string;
    font_family(value: string): this;
    font_feature_settings(): string;
    font_feature_settings(value: string): this;
    font_kerning(): string;
    font_kerning(value: string): this;
    font_language_override(): string;
    font_language_override(value: string): this;
    font_size(): string;
    font_size(value: string | number): this;
    font_size_adjust(): string;
    font_size_adjust(value: string): this;
    font_stretch(): string;
    font_stretch(value: string): this;
    font_style(): string;
    font_style(value: string): this;
    font_synthesis(): string;
    font_synthesis(value: string): this;
    font_variant(): string;
    font_variant(value: string): this;
    font_variant_alternates(): string;
    font_variant_alternates(value: string): this;
    font_variant_caps(): string;
    font_variant_caps(value: string): this;
    font_variant_east_asian(): string;
    font_variant_east_asian(value: string): this;
    font_variant_ligatures(): string;
    font_variant_ligatures(value: string): this;
    font_variant_numeric(): string;
    font_variant_numeric(value: string): this;
    font_variant_position(): string;
    font_variant_position(value: string): this;
    font_weight(): string;
    font_weight(value: string | number): this;
    gap(): string;
    gap(value: string | number): this;
    grid(): string;
    grid(value: string): this;
    grid_area(): string;
    grid_area(value: string): this;
    grid_auto_columns(): string;
    grid_auto_columns(value: string | number): this;
    grid_auto_flow(): string;
    grid_auto_flow(value: string): this;
    grid_auto_rows(): string;
    grid_auto_rows(value: string | number): this;
    grid_column(): string;
    grid_column(value: string): this;
    grid_column_end(): string;
    grid_column_end(value: string | number): this;
    grid_column_gap(): string;
    grid_column_gap(value: string | number): this;
    grid_column_start(): string;
    grid_column_start(value: string | number): this;
    grid_gap(): string;
    grid_gap(value: string | number): this;
    grid_row(): string;
    grid_row(value: string): this;
    grid_row_end(): string;
    grid_row_end(value: string): this;
    grid_row_gap(): string;
    grid_row_gap(value: string | number): this;
    grid_row_start(): string;
    grid_row_start(value: string | number): this;
    grid_template(): string;
    grid_template(value: string): this;
    grid_template_areas(): string;
    grid_template_areas(value: string): this;
    grid_template_columns(): string;
    grid_template_columns(value: string): this;
    grid_template_rows(): string;
    grid_template_rows(value: string | number): this;
    hanging_punctuation(): string;
    hanging_punctuation(value: string): this;
    hyphens(): string;
    hyphens(value: string): this | string;
    image_rendering(): string;
    image_rendering(value: string): this;
    inline_size(): string;
    inline_size(value: string | number): this;
    inset(): string;
    inset(value: string | number): this;
    inset_block(): string | undefined;
    inset_block(value: string | number): this;
    inset_block_end(): string;
    inset_block_end(value: string | number): this;
    inset_block_start(): string;
    inset_block_start(value: string | number): this;
    inset_inline(): string;
    inset_inline(value: string | number): this;
    inset_inline_end(): string;
    inset_inline_end(value: string | number): this;
    inset_inline_start(): string;
    inset_inline_start(value: string | number): this;
    isolation(): string;
    isolation(value: string): this;
    justify_content(): string;
    justify_content(value: string): this;
    justify_items(): string;
    justify_items(value: string): this;
    justify_self(): string;
    justify_self(value: string): this;
    left(): string;
    left(value: string | number): this;
    letter_spacing(): string;
    letter_spacing(value: string | number): this;
    line_break(): string;
    line_break(value: string): this;
    line_height(): string;
    line_height(value: string | number): this;
    list_style(): string;
    list_style(value: string): this;
    list_style_image(): string;
    list_style_image(value: string): this;
    list_style_position(): string;
    list_style_position(value: string): this;
    list_style_type(): string;
    list_style_type(value: string): this;
    margin_block(): string;
    margin_block(value: string | number): this;
    margin_block_end(): string;
    margin_block_end(value: string | number): this;
    margin_block_start(): string;
    margin_block_start(value: string | number): this;
    margin_inline(): string;
    margin_inline(value: string | number): this;
    margin_inline_end(): string;
    margin_inline_end(value: string | number): this;
    margin_inline_start(): string;
    margin_inline_start(value: string | number): this;
    mask(): string;
    mask(value: string): this;
    mask_clip(): string;
    mask_clip(value: string): this;
    mask_composite(): string;
    mask_composite(value: string): this;
    mask_image(): string;
    mask_image(value: string): this;
    mask_mode(): string;
    mask_mode(value: string): this;
    mask_origin(): string;
    mask_origin(value: string): this;
    mask_position(): string;
    mask_position(value: string): this;
    mask_repeat(): string;
    mask_repeat(value: string): this;
    mask_size(): string;
    mask_size(value: string | number): this;
    mask_type(): string;
    mask_type(value: string): this;
    max_height(): number | string;
    max_height(value: string | number): this;
    max_width(): number | string;
    max_width(value: string | number): this;
    max_block_size(): string;
    max_block_size(value: string | number): this;
    max_inline_size(): string | number;
    max_inline_size(value: string | number): this;
    min_block_size(): null | number;
    min_block_size(value: number): this;
    min_inline_size(): string;
    min_inline_size(value: string | number): this;
    mix_blend_mode(): string;
    mix_blend_mode(value: string): this;
    object_fit(): string;
    object_fit(value: string): this;
    object_position(): string;
    object_position(value: string): this;
    offset(): string;
    offset(value: string | number): this;
    offset_anchor(): string;
    offset_anchor(value: string): this;
    offset_distance(): string;
    offset_distance(value: string | number): this;
    offset_path(): string;
    offset_path(value: string): this;
    offset_rotate(): string;
    offset_rotate(value: string | number): this;
    order(): string;
    order(value: string | number): this;
    orphans(): null | number;
    orphans(value: number): this;
    outline(): string;
    outline(value: string): this;
    outline_color(): string;
    outline_color(value: string): this;
    outline_offset(): string;
    outline_offset(value: string | number): this;
    outline_style(): string;
    outline_style(value: string): this;
    outline_width(): string;
    outline_width(value: string | number): this;
    overflow(): string;
    overflow(value: string): this;
    overflow_anchor(): string;
    overflow_anchor(value: string): this;
    overflow_wrap(): string;
    overflow_wrap(value: string): this;
    overflow_x(): string;
    overflow_x(value: string): this;
    overflow_y(): string;
    overflow_y(value: string): this;
    overscroll_behavior(): string;
    overscroll_behavior(value: string): this;
    overscroll_behavior_block(): string;
    overscroll_behavior_block(value: string): this;
    overscroll_behavior_inline(): string;
    overscroll_behavior_inline(value: string): this;
    overscroll_behavior_x(): string;
    overscroll_behavior_x(value: string): this;
    overscroll_behavior_y(): string;
    overscroll_behavior_y(value: string): this;
    padding_block(): string | undefined;
    padding_block(value: string | number): this;
    padding_block_end(): string;
    padding_block_end(value: string | number): this;
    padding_block_start(): string;
    padding_block_start(value: string | number): this;
    padding_inline(): string;
    padding_inline(value: string | number): this;
    padding_inline_end(): string;
    padding_inline_end(value: string | number): this;
    padding_inline_start(): string;
    padding_inline_start(value: string | number): this;
    page_break_after(): string;
    page_break_after(value: string): this;
    page_break_before(): string;
    page_break_before(value: string): this;
    page_break_inside(): string;
    page_break_inside(value: string): this;
    paint_order(): string;
    paint_order(value: string): this;
    perspective(): string;
    perspective(value: string | number): this;
    perspective_origin(): string;
    perspective_origin(value: string): this;
    place_content(): string;
    place_content(value: string): this;
    place_items(): string;
    place_items(value: string): this;
    place_self(): string;
    place_self(value: string): this;
    pointer_events(): string;
    pointer_events(value: string): this;
    quotes(): string;
    quotes(value: string): this;
    resize(): string;
    resize(value: string): this;
    right(): string;
    right(value: number | string): this;
    row_gap(): string;
    row_gap(value: string | number): this;
    scale(): null | number;
    scale(value: number): this;
    scroll_behavior(): string;
    scroll_behavior(value: string): this;
    scroll_margin(): string;
    scroll_margin(value: string | number): this;
    scroll_margin_block(): string;
    scroll_margin_block(value: string | number): this;
    scroll_margin_block_end(): string;
    scroll_margin_block_end(value: string | number): this;
    scroll_margin_block_start(): string;
    scroll_margin_block_start(value: string | number): this;
    scroll_margin_bottom(): string;
    scroll_margin_bottom(value: string | number): this;
    scroll_margin_inline(): string;
    scroll_margin_inline(value: string | number): this;
    scroll_margin_inline_end(): string;
    scroll_margin_inline_end(value: string | number): this;
    scroll_margin_inline_start(): string;
    scroll_margin_inline_start(value: string): this;
    scroll_margin_left(): string;
    scroll_margin_left(value: string | number): this;
    /**
     * {Scroll Margin Right}
     * Specifies the margin between the snap position on the right side and the container.
     * The equivalent of CSS attribute `scrollMarginRight`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_margin_right(): string;
    scroll_margin_right(value: string | number): this;
    scroll_margin_top(): string;
    scroll_margin_top(value: string | number): this;
    scroll_padding(): string;
    scroll_padding(value: string | number): this;
    scroll_padding_block(): string;
    scroll_padding_block(value: string | number): this;
    scroll_padding_block_end(): string;
    scroll_padding_block_end(value: string | number): this;
    scroll_padding_block_start(): string;
    scroll_padding_block_start(value: string | number): this;
    scroll_padding_bottom(): string;
    scroll_padding_bottom(value: string | number): this;
    scroll_padding_inline(): string;
    scroll_padding_inline(value: string | number): this;
    scroll_padding_inline_end(): string;
    scroll_padding_inline_end(value: string | number): this;
    scroll_padding_inline_start(): string;
    scroll_padding_inline_start(value: string | number): this;
    scroll_padding_left(): string;
    scroll_padding_left(value: string | number): this;
    scroll_padding_right(): string;
    scroll_padding_right(value: string | number): this;
    scroll_padding_top(): string;
    scroll_padding_top(value: string | number): this;
    scroll_snap_align(): string;
    scroll_snap_align(value: string): this;
    scroll_snap_stop(): string;
    scroll_snap_stop(value: string): this;
    scroll_snap_type(): string;
    scroll_snap_type(value: string): this;
    scrollbar_color(): string;
    scrollbar_color(value: string): this;
    tab_size(): string;
    tab_size(value: string | number): this;
    table_layout(): string;
    table_layout(value: string): this;
    text_align(): string;
    text_align(value: string): this;
    text_align_last(): string;
    text_align_last(value: string): this;
    text_combine_upright(): string;
    text_combine_upright(value: string): this;
    text_decoration(): string;
    text_decoration(value: string): this;
    text_decoration_color(): string;
    text_decoration_color(value: string): this;
    text_decoration_line(): string;
    text_decoration_line(value: string): this;
    text_decoration_style(): string;
    text_decoration_style(value: string): this;
    text_decoration_thickness(): string;
    text_decoration_thickness(value: string | number): this;
    text_emphasis(): string;
    text_emphasis(value: string): this;
    text_indent(): string;
    text_indent(value: string | number): this;
    text_justify(): string;
    text_justify(value: string): this;
    text_orientation(): string;
    text_orientation(value: string): this;
    text_overflow(): string;
    text_overflow(value: string): this;
    text_shadow(): string;
    text_shadow(value: string): this;
    text_transform(): string;
    text_transform(value: string): this;
    text_underline_position(): string;
    text_underline_position(value: string): this;
    top(): string;
    top(value: string | number): this;
    transform(): string;
    transform(value: string): this;
    transform_origin(): string;
    transform_origin(value: string): this;
    transform_style(): string;
    transform_style(value: string): this;
    transition(): string;
    transition(value: string): this;
    transition_delay(): string;
    transition_delay(value: string | number): this;
    transition_duration(): string | undefined;
    transition_duration(value: string | number): this;
    transition_property(): string;
    transition_property(value: string): this;
    transition_timing_function(): string;
    transition_timing_function(value: string): this;
    /**
     * {Translate}
     * Specifies the position of an element. The equivalent of CSS attribute `translate`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the attribute's value if `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    translate(): string;
    translate(value: string | number): this;
    unicode_bidi(): string;
    unicode_bidi(value: string): this;
    user_select(): string;
    user_select(value: string): this;
    visibility(): string;
    visibility(value: string): this;
    white_space(): string;
    white_space(value: string): this;
    widows(): string;
    widows(value: string | number): this;
    word_break(): string;
    word_break(value: string): this;
    word_spacing(): string;
    word_spacing(value: string | number): this;
    word_wrap(): string;
    word_wrap(value: string): this;
    writing_mode(): string;
    writing_mode(value: string): this;
    focusable(): boolean;
    focusable(value: boolean): this;
    alt(): string;
    alt(value: string): this;
    readonly(): boolean;
    readonly(value: boolean): this;
    download(): string;
    download(value: string): this;
    accept(): string;
    accept(value: string): this;
    accept_charset(): string;
    accept_charset(value: string): this;
    action(): string;
    action(value: string): this;
    async(): boolean;
    async(value: boolean): this;
    auto_complete(): "" | "on" | "off";
    auto_complete(value: "" | "on" | "off"): this;
    auto_focus(): boolean;
    auto_focus(value: boolean): this;
    auto_play(): boolean;
    auto_play(value: boolean): this;
    charset(): string;
    charset(value: string): this;
    checked(): boolean;
    checked(value: boolean): this;
    cite(): string;
    cite(value: string): this;
    cols(): null | number;
    cols(value: number): this;
    colspan(): null | number;
    colspan(value: number): this;
    /**
        * docs:
        * @title: Content
        * @desc: Retrieves or sets the value associated with the http-equiv or name attribute.
        *        When `value` is `null`, the current attribute value is returned.
        * @param:
        *     @name: value
        *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
        * @return:
        *     @descr: Returns the current attribute value if `value` is `null`, otherwise returns the instance for chaining.
        * @funcs: 2
        */
    content_editable(): boolean;
    content_editable(value: boolean): this;
    controls(): boolean;
    controls(value: boolean): this;
    coords(): string;
    coords(value: string): this;
    data(): string;
    data(value: string | number): this;
    datetime(): string;
    datetime(value: string): this;
    default(): boolean;
    default(value: boolean): this;
    defer(): boolean;
    defer(value: boolean): this;
    /**
     * {Dir}
     * Specifies the text direction for the content in an element. The equivalent of HTML attribute `dir`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    dir(): string;
    dir(value: string): this;
    dirname(): string;
    dirname(value: string): this;
    disabled(): boolean;
    disabled(value: boolean): this;
    /**
     * {Draggable}
     * Specifies whether an element is draggable or not. The equivalent of HTML attribute `draggable`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns ription Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    draggable(): boolean;
    draggable(value: boolean): this;
    enctype(): string;
    enctype(value: string): this;
    for(): string;
    for(value: string): this;
    /**
     * {Form}
     * Specifies the name of the form the element belongs to. The equivalent of HTML attribute `form`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns ription Returns the `VElement` object when a value is set. If `null`, returns the attribute's value.
     * @docs
     */
    form_action(): string;
    form_action(value: string): this;
    headers(): string;
    headers(value: string): this;
    high(): string;
    high(value: string | number): this;
    href(): string;
    href(value: string): this;
    href_lang(): string;
    href_lang(value: string): this;
    http_equiv(): string;
    http_equiv(value: string): this;
    /**
     * {Id}
     * Specifies a unique id for an element, equivalent to the HTML attribute `id`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    id(): string;
    id(value: string): this;
    is_map(): boolean;
    is_map(value: boolean): this;
    kind(): string;
    kind(value: string): this;
    label(): string;
    label(value: string): this;
    /**
     * {Lang}
     * Specifies the language of the element's content, equivalent to the HTML attribute `lang`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns ription Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    lang(): string;
    lang(value: string): this;
    /**
     * {List}
     * Refers to a \<datalist> element that contains pre-defined options for an \<input> element.
     * The equivalent of HTML attribute `list`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    loop(): boolean;
    loop(value: boolean): this;
    low(): string;
    low(value: string | number): this;
    max(): string;
    max(value: string): this;
    max_length(): null | number;
    max_length(value: number): this;
    method(): string;
    method(value: string): this;
    /**
     * {Min}
     * Specifies a minimum value, equivalent to the HTML attribute `min`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns ription Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    min(): string;
    min(value: string): this;
    multiple(): boolean;
    multiple(value: boolean): this;
    muted(): boolean;
    muted(value: boolean): this;
    no_validate(): boolean;
    no_validate(value: boolean): this;
    open(): boolean;
    open(value: boolean): this;
    optimum(): null | number;
    optimum(value: number): this;
    pattern(): string;
    pattern(value: string): this;
    placeholder(): string;
    placeholder(value: string): this;
    poster(): string;
    poster(value: string): this;
    preload(): string;
    preload(value: string): this;
    rel(): string;
    rel(value: string): this;
    required(): boolean;
    required(value: boolean): this;
    reversed(): boolean;
    reversed(value: boolean): this;
    rows(): null | number;
    rows(value: number): this;
    row_span(): null | number;
    row_span(value: number): this;
    sandbox(): string;
    sandbox(value: string): this;
    scope(): string;
    scope(value: string): this;
    selected(): boolean;
    selected(value: boolean): this;
    shape(): string;
    shape(value: string): this;
    size(): null | number;
    size(value: number): this;
    sizes(): string;
    sizes(value: string): this;
    /**
     * {Span}
     * Specifies the number of columns to span. The equivalent of HTML attribute `span`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    span(): null | number;
    span(value: number): this;
    spell_check(): boolean;
    spell_check(value: boolean): this;
    /**
     * {Src}
     * Specifies the URL of the media file, equivalent to the HTML attribute `src`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns ription Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    src(): string;
    src(value: string, set_aspect_ratio?: boolean): this;
    src_doc(): string;
    src_doc(value: string): this;
    src_lang(): string;
    src_lang(value: string): this;
    rrsrc_set(): string;
    rrsrc_set(value: string): this;
    start(): null | number;
    start(value: number): this;
    step(): string;
    step(value: string): this;
    tab_index(): null | number;
    tab_index(value: number): this;
    /**
     * {Target}
     * Specifies the target for where to open the linked document or where to submit the form.
     * The equivalent of HTML attribute `target`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    target(): string;
    target(value: string): this;
    /**
     * {Title}
     * Specifies extra information about an element, equivalent to the HTML attribute `title`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    title(): string;
    title(value: string): this;
    type(): string;
    type(value: string): this;
    use_map(): string;
    use_map(value: string): this;
    value(): string;
    value(value: string): this;
    /**
        * docs:
        * @title: On after print
        * @desc: Script to be run after the document is printed. The equivalent of HTML attribute `onafterprint`.
        *        The first parameter of the callback is the `VElement` object.
        * @param:
        *     @name: callback
        *     @descr: The callback function to execute after printing. It receives the `VElement` object and the event.
        * @return:
        *     @description Returns the `VElement` object unless the parameter `callback` is `null`, then the attribute's value is returned.
        * @funcs: 2
        */
    /**
        * docs:
        * @title: On before print
        * @desc: Script to be run before the document is printed. The equivalent of HTML attribute `onbeforeprint`.
        * @param:
        *     @name: callback
        *     @descr: The function to be executed before printing, receiving the `VElement` object as the first parameter.
        * @return:
        *     @description Returns the instance of the element for chaining unless parameter `callback` is `null`, then the attribute's value is returned.
        * @funcs: 2
        */
    /**
        * docs:
        * @title: On Before Unload
        * @desc: Script to be run when the document is about to be unloaded.
        *        This is the equivalent of the HTML attribute `onbeforeunload`.
        *        The first parameter of the callback is the `VElement` object.
        * @param:
        *     @name: callback
        *     @descr: The callback function to execute before unloading the document.
        * @return:
        *     @descr: Returns the `VElement` object. Unless parameter `callback` is `null`, then the attribute's value is returned.
        * @funcs: 2
        */
    /**
        * docs:
        * @title: On hash change
        * @desc:
        *     Script to be run when there has been changes to the anchor part of a URL.
        *     The equivalent of HTML attribute `onhashchange`.
        *
        *     The first parameter of the callback is the `VElement` object.
        *
        * @param:
        *     @name: callback
        *     @descr: The callback function to execute on hash change.
        * @return:
        *     @description Returns the `VElement` object for chaining. If parameter `value` is `null`, the attribute's value is returned.
        * @funcs: 2
        */
    /**
        * docs:
        * @title: On message
        * @desc:
        *     Script to be run when the message is triggered.
        *     The equivalent of HTML attribute `onmessage`.
        *
        *     The first parameter of the callback is the `VElement` object.
        *
        * @param:
        *     @name: value
        *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
        * @return:
        *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
        * @funcs: 2
        */
    /**
        * docs:
        * @title: On Offline
        * @desc: Script to be run when the browser starts to work offline. The equivalent of HTML attribute `onoffline`.
        *        The first parameter of the callback is the `VElement` object.
        * @param:
        *     @name: value
        *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
        * @return:
        *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
        * @funcs: 2
        */
    /**
        * docs:
        * @title: On online
        * @desc: Script to be run when the browser starts to work online.
        *        The equivalent of HTML attribute `ononline`.
        *        The first parameter of the callback is the `VElement` object.
        * @param:
        *     @name: value
        *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
        * @return:
        *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
        * @funcs: 2
        */
    /**
        * docs:
        * @title: On page hide
        * @desc:
        *     Script to be run when a user navigates away from a page.
        *     The equivalent of HTML attribute `onpagehide`.
        * @param:
        *     @name: value
        *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
        * @return:
        *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
        * @funcs: 2
        */
    /**
        * docs:
        * @title: On page show
        * @desc:
        *     Script to be run when a user navigates to a page.
        *     The equivalent of HTML attribute `onpageshow`.
        *     The first parameter of the callback is the `VElement` object.
        * @param:
        *     @name: value
        *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
        * @return:
        *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
        * @funcs: 2
        */
    /**
        * docs:
        * @title: On Popstate
        * @desc: Script to be run when the window's history changes. The equivalent of HTML attribute `onpopstate`.
        *        The first parameter of the callback is the `VElement` object. Returns the attribute value when parameter `value` is `null`.
        * @param:
        *     @name: callback
        *     @descr: The callback function to execute on popstate event.
        * @return:
        *     @description Returns the `VElement` object. Unless parameter `callback` is `null`, then the attribute's value is returned.
        * @funcs: 2
        */
    /**
        * docs:
        * @title: On Storage
        * @desc: Script to be run when a Web Storage area is updated.
        *        The equivalent of HTML attribute `onstorage`.
        *        The first parameter of the callback is the `VElement` object.
        * @param:
        *     @name: callback
        *     @descr: The function to be executed when storage is updated.
        * @return:
        *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
        * @funcs: 2
        */
    on_blur(): Function | undefined;
    on_blur(callback: ElementEvent<this>): this;
    on_change(): Function | undefined;
    on_change(callback: ElementEvent<this>): this;
    on_focus(): Function | undefined;
    on_focus(callback: ElementEvent<this>): this;
    on_input(): ElementEvent<this> | undefined;
    on_input(callback: ElementEvent<this>): this;
    on_before_input(): Function | undefined;
    on_before_input(callback: ElementEvent<this>): this;
    on_invalid(): Function | undefined;
    on_invalid(callback: ElementEvent<this>): this;
    on_reset(): Function | undefined;
    on_reset(callback: ElementEvent<this>): this;
    on_select(): Function | undefined;
    on_select(callback: ElementEvent<this>): this;
    on_submit(): Function | undefined;
    on_submit(callback: ElementEvent<this>): this;
    on_key_down(): Function | undefined;
    on_key_down(callback: ElementKeyboardEvent<this>): this;
    on_key_press(): Function | undefined;
    on_key_press(callback: ElementKeyboardEvent<this>): this;
    on_key_up(): Function | undefined;
    on_key_up(callback: ElementKeyboardEvent<this>): this;
    on_dbl_click(): Function | undefined;
    on_dbl_click(callback: ElementMouseEvent<this>): this;
    on_mouse_down(): Function | undefined;
    on_mouse_down(callback: ElementMouseEvent<this>): this;
    on_mouse_move(): Function | undefined;
    on_mouse_move(callback: ElementMouseEvent<this>): this;
    on_mouse_out(): Function | undefined;
    on_mouse_out(callback: ElementMouseEvent<this>): this;
    on_mouse_over(): Function | undefined;
    on_mouse_over(callback: ElementMouseEvent<this>): this;
    on_mouse_up(): Function | undefined;
    on_mouse_up(callback: ElementMouseEvent<this>): this;
    on_wheel(): Function | undefined;
    on_wheel(callback: (element: this, event: WheelEvent) => any): this;
    on_drag(): Function | undefined;
    on_drag(callback: ElementDragEvent<this>): this;
    on_drag_end(): Function | undefined;
    on_drag_end(callback: ElementDragEvent<this>): this;
    on_drag_enter(): Function | undefined;
    on_drag_enter(callback: ElementDragEvent<this>): this;
    on_drag_leave(): Function | undefined;
    on_drag_leave(callback: ElementDragEvent<this>): this;
    on_drag_over(): Function | undefined;
    on_drag_over(callback: ElementDragEvent<this>): this;
    on_drag_start(): Function | undefined;
    on_drag_start(callback: ElementDragEvent<this>): this;
    on_drop(): Function | undefined;
    on_drop(callback: ElementEvent<this>): this;
    on_copy(): Function | undefined;
    on_copy(callback: ElementEvent<this>): this;
    on_cut(): Function | undefined;
    on_cut(callback: ElementEvent<this>): this;
    on_paste(): Function | undefined;
    on_paste(callback: ElementEvent<this>): this;
    on_abort(): Function | undefined;
    on_abort(callback: ElementEvent<this>): this;
    on_canplay(): Function | undefined;
    on_canplay(callback: ElementEvent<this>): this;
    on_canplay_through(): Function | undefined;
    on_canplay_through(callback: ElementEvent<this>): this;
    on_cue_change(): Function | undefined;
    on_cue_change(callback: ElementEvent<this>): this;
    on_duration_change(): Function | undefined;
    on_duration_change(callback: ElementEvent<this>): this;
    on_emptied(): Function | undefined;
    on_emptied(callback: ElementEvent<this>): this;
    on_ended(): Function | undefined;
    on_ended(callback: ElementEvent<this>): this;
    on_error(): Function | undefined;
    on_error(callback: (element: this, error: string | Event) => any): this;
    on_loaded_data(): Function | undefined;
    on_loaded_data(callback: ElementEvent<this>): this;
    on_loaded_metadata(): Function | undefined;
    on_loaded_metadata(callback: ElementEvent<this>): this;
    on_load_start(): Function | undefined;
    on_load_start(callback: ElementEvent<this>): this;
    on_pause(): Function | undefined;
    on_pause(callback: ElementEvent<this>): this;
    on_play(): Function | undefined;
    on_play(callback: ElementEvent<this>): this;
    on_playing(): Function | undefined;
    on_playing(callback: (element: this, time: any) => any): this;
    on_progress(): Function | undefined;
    on_progress(callback: ElementEvent<this>): this;
    on_rate_change(): Function | undefined;
    on_rate_change(callback: ElementEvent<this>): this;
    on_seeked(): Function | undefined;
    on_seeked(callback: (element: this, time: any) => any): this;
    on_seeking(): Function | undefined;
    on_seeking(callback: (element: this, time: any) => any): this;
    on_stalled(): Function | undefined;
    on_stalled(callback: ElementEvent<this>): this;
    on_suspend(): Function | undefined;
    on_suspend(callback: Function): this;
    on_time_update(): Function | undefined;
    on_time_update(callback: ElementEvent<this>): this;
    on_volume_change(): Function | undefined;
    on_volume_change(callback: ElementEvent<this>): this;
    on_waiting(): Function | undefined;
    on_waiting(callback: (element: this, time: any) => any): this;
    on_toggle(): Function | undefined;
    on_toggle(callback: ElementEvent<this>): this;
}
export declare function isVElement(type: any): type is VElement;
export declare function is_velement(type: any): type is VElement;
export declare function extend<T extends Record<string, ((this: VElement & ThisType<VElement>, ...args: any[]) => any) | any>>(extension: T): void;
export declare function wrapper<T extends new (...args: any[]) => any>(constructor: T): <Extensions extends object = {}>(...args: ConstructorParameters<T>) => InstanceType<T> & Extensions;
export declare function create_null<T extends new (...args: any[]) => any>(target_class: T): <Extensions extends object = {}>() => InstanceType<T> & Extensions;
export type VElementBaseSignature = {
    new (...args: any[]): VElement & VElementExtensions;
    element_tag: string;
    default_style: Record<string, any>;
    default_attributes: Record<string, any>;
    default_events: Record<string, any>;
};
type VElementBaseSignature2 = VElementBaseSignature;
declare const VHTMLElement_base: VElementBaseSignature2;
export declare class VHTMLElement extends VHTMLElement_base {
    static element_name: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VHTML: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VHTMLElement & Extensions;
export declare const NullVHTML: <Extensions extends object = {}>() => VHTMLElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VHTMLElement: VHTMLElement;
    }
}
declare const VAnchorElement_base: VElementBaseSignature2;
export declare class VAnchorElement extends VAnchorElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VAnchor: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VAnchorElement & Extensions;
export declare const NullVAnchor: <Extensions extends object = {}>() => VAnchorElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VAnchorElement: VAnchorElement;
    }
}
declare const VAreaElement_base: VElementBaseSignature2;
export declare class VAreaElement extends VAreaElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VArea: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VAreaElement & Extensions;
export declare const NullVArea: <Extensions extends object = {}>() => VAreaElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VAreaElement: VAreaElement;
    }
}
declare const VAudioElement_base: VElementBaseSignature2;
export declare class VAudioElement extends VAudioElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VAudio: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VAudioElement & Extensions;
export declare const NullVAudio: <Extensions extends object = {}>() => VAudioElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VAudioElement: VAudioElement;
    }
}
declare const VBlockQuoteElement_base: VElementBaseSignature2;
export declare class VBlockQuoteElement extends VBlockQuoteElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VBlockQuote: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VBlockQuoteElement & Extensions;
export declare const NullVBlockQuote: <Extensions extends object = {}>() => VBlockQuoteElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VBlockQuoteElement: VBlockQuoteElement;
    }
}
declare const VBodyElement_base: VElementBaseSignature2;
export declare class VBodyElement extends VBodyElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VBody: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VBodyElement & Extensions;
export declare const NullVBody: <Extensions extends object = {}>() => VBodyElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VBodyElement: VBodyElement;
    }
}
declare const VBRElement_base: VElementBaseSignature2;
export declare class VBRElement extends VBRElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VBR: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VBRElement & Extensions;
export declare const NullVBR: <Extensions extends object = {}>() => VBRElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VBRElement: VBRElement;
    }
}
declare const VButtonElement_base: VElementBaseSignature2;
export declare class VButtonElement extends VButtonElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VButton: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VButtonElement & Extensions;
export declare const NullVButton: <Extensions extends object = {}>() => VButtonElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VButtonElement: VButtonElement;
    }
}
declare const VCanvasElement_base: VElementBaseSignature2;
export declare class VCanvasElement extends VCanvasElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VCanvas: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VCanvasElement & Extensions;
export declare const NullVCanvas: <Extensions extends object = {}>() => VCanvasElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VCanvasElement: VCanvasElement;
    }
}
declare const VTableCaptionElement_base: VElementBaseSignature2;
export declare class VTableCaptionElement extends VTableCaptionElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VTableCaption: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VTableCaptionElement & Extensions;
export declare const NullVTableCaption: <Extensions extends object = {}>() => VTableCaptionElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VTableCaptionElement: VTableCaptionElement;
    }
}
declare const VTableColElement_base: VElementBaseSignature2;
export declare class VTableColElement extends VTableColElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VTableCol: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VTableColElement & Extensions;
export declare const NullVTableCol: <Extensions extends object = {}>() => VTableColElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VTableColElement: VTableColElement;
    }
}
declare const VDataElement_base: VElementBaseSignature2;
export declare class VDataElement extends VDataElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VData: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VDataElement & Extensions;
export declare const NullVData: <Extensions extends object = {}>() => VDataElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VDataElement: VDataElement;
    }
}
declare const VDataListElement_base: VElementBaseSignature2;
export declare class VDataListElement extends VDataListElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VDataList: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VDataListElement & Extensions;
export declare const NullVDataList: <Extensions extends object = {}>() => VDataListElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VDataListElement: VDataListElement;
    }
}
declare const VDListElement_base: VElementBaseSignature2;
export declare class VDListElement extends VDListElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VDList: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VDListElement & Extensions;
export declare const NullVDList: <Extensions extends object = {}>() => VDListElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VDListElement: VDListElement;
    }
}
declare const VDirectoryElement_base: VElementBaseSignature2;
export declare class VDirectoryElement extends VDirectoryElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VDirectory: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VDirectoryElement & Extensions;
export declare const NullVDirectory: <Extensions extends object = {}>() => VDirectoryElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VDirectoryElement: VDirectoryElement;
    }
}
declare const VDivElement_base: VElementBaseSignature2;
export declare class VDivElement extends VDivElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VDiv: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VDivElement & Extensions;
export declare const NullVDiv: <Extensions extends object = {}>() => VDivElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VDivElement: VDivElement;
    }
}
declare const VEmbedElement_base: VElementBaseSignature2;
export declare class VEmbedElement extends VEmbedElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VEmbed: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VEmbedElement & Extensions;
export declare const NullVEmbed: <Extensions extends object = {}>() => VEmbedElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VEmbedElement: VEmbedElement;
    }
}
declare const VFieldSetElement_base: VElementBaseSignature2;
export declare class VFieldSetElement extends VFieldSetElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VFieldSet: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VFieldSetElement & Extensions;
export declare const NullVFieldSet: <Extensions extends object = {}>() => VFieldSetElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VFieldSetElement: VFieldSetElement;
    }
}
declare const VFormElement_base: VElementBaseSignature2;
export declare class VFormElement extends VFormElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VForm: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VFormElement & Extensions;
export declare const NullVForm: <Extensions extends object = {}>() => VFormElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VFormElement: VFormElement;
    }
}
declare const VHeadingElement_base: VElementBaseSignature2;
export declare class VHeadingElement extends VHeadingElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VHeading: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VHeadingElement & Extensions;
export declare const NullVHeading: <Extensions extends object = {}>() => VHeadingElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VHeadingElement: VHeadingElement;
    }
}
declare const VHeadElement_base: VElementBaseSignature2;
export declare class VHeadElement extends VHeadElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VHead: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VHeadElement & Extensions;
export declare const NullVHead: <Extensions extends object = {}>() => VHeadElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VHeadElement: VHeadElement;
    }
}
declare const VHRElement_base: VElementBaseSignature2;
export declare class VHRElement extends VHRElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VHR: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VHRElement & Extensions;
export declare const NullVHR: <Extensions extends object = {}>() => VHRElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VHRElement: VHRElement;
    }
}
declare const VImageElement_base: VElementBaseSignature2;
export declare class VImageElement extends VImageElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VImage: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VImageElement & Extensions;
export declare const NullVImage: <Extensions extends object = {}>() => VImageElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VImageElement: VImageElement;
    }
}
declare const VInputElement_base: VElementBaseSignature2;
export declare class VInputElement extends VInputElement_base {
    static element_name: string;
    static element_tag: string;
    private static value_property;
    constructor(args?: DerivedVElementInitOptions);
    value(): string;
    value(value: string): this;
}
export declare const VInput: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VInputElement & Extensions;
export declare const NullVInput: <Extensions extends object = {}>() => VInputElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VInputElement: VInputElement;
    }
}
declare const VTextAreaElement_base: VElementBaseSignature2;
export declare class VTextAreaElement extends VTextAreaElement_base {
    static element_name: string;
    static element_tag: string;
    private static value_property;
    constructor(args?: DerivedVElementInitOptions);
    value(): string;
    value(value: string): this;
}
export declare const VTextArea: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VTextAreaElement & Extensions;
export declare const NullVTextArea: <Extensions extends object = {}>() => VTextAreaElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VTextAreaElement: VTextAreaElement;
    }
}
declare const VModElement_base: VElementBaseSignature2;
export declare class VModElement extends VModElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VMod: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VModElement & Extensions;
export declare const NullVMod: <Extensions extends object = {}>() => VModElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VModElement: VModElement;
    }
}
declare const VLabelElement_base: VElementBaseSignature2;
export declare class VLabelElement extends VLabelElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VLabel: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VLabelElement & Extensions;
export declare const NullVLabel: <Extensions extends object = {}>() => VLabelElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VLabelElement: VLabelElement;
    }
}
declare const VLegendElement_base: VElementBaseSignature2;
export declare class VLegendElement extends VLegendElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VLegend: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VLegendElement & Extensions;
export declare const NullVLegend: <Extensions extends object = {}>() => VLegendElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VLegendElement: VLegendElement;
    }
}
declare const VLIElement_base: VElementBaseSignature2;
export declare class VLIElement extends VLIElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VLI: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VLIElement & Extensions;
export declare const NullVLI: <Extensions extends object = {}>() => VLIElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VLIElement: VLIElement;
    }
}
declare const VLinkElement_base: VElementBaseSignature2;
export declare class VLinkElement extends VLinkElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VLink: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VLinkElement & Extensions;
export declare const NullVLink: <Extensions extends object = {}>() => VLinkElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VLinkElement: VLinkElement;
    }
}
declare const VMapElement_base: VElementBaseSignature2;
export declare class VMapElement extends VMapElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VMap: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VMapElement & Extensions;
export declare const NullVMap: <Extensions extends object = {}>() => VMapElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VMapElement: VMapElement;
    }
}
declare const VMetaElement_base: VElementBaseSignature2;
export declare class VMetaElement extends VMetaElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VMeta: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VMetaElement & Extensions;
export declare const NullVMeta: <Extensions extends object = {}>() => VMetaElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VMetaElement: VMetaElement;
    }
}
declare const VMeterElement_base: VElementBaseSignature2;
export declare class VMeterElement extends VMeterElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VMeter: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VMeterElement & Extensions;
export declare const NullVMeter: <Extensions extends object = {}>() => VMeterElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VMeterElement: VMeterElement;
    }
}
declare const VObjectElement_base: VElementBaseSignature2;
export declare class VObjectElement extends VObjectElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VObject: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VObjectElement & Extensions;
export declare const NullVObject: <Extensions extends object = {}>() => VObjectElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VObjectElement: VObjectElement;
    }
}
declare const VOListElement_base: VElementBaseSignature2;
export declare class VOListElement extends VOListElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VOList: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VOListElement & Extensions;
export declare const NullVOList: <Extensions extends object = {}>() => VOListElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VOListElement: VOListElement;
    }
}
declare const VOptGroupElement_base: VElementBaseSignature2;
export declare class VOptGroupElement extends VOptGroupElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VOptGroup: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VOptGroupElement & Extensions;
export declare const NullVOptGroup: <Extensions extends object = {}>() => VOptGroupElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VOptGroupElement: VOptGroupElement;
    }
}
declare const VOptionElement_base: VElementBaseSignature2;
export declare class VOptionElement extends VOptionElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VOption: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VOptionElement & Extensions;
export declare const NullVOption: <Extensions extends object = {}>() => VOptionElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VOptionElement: VOptionElement;
    }
}
declare const VOutputElement_base: VElementBaseSignature2;
export declare class VOutputElement extends VOutputElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VOutput: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VOutputElement & Extensions;
export declare const NullVOutput: <Extensions extends object = {}>() => VOutputElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VOutputElement: VOutputElement;
    }
}
declare const VParagraphElement_base: VElementBaseSignature2;
export declare class VParagraphElement extends VParagraphElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VParagraph: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VParagraphElement & Extensions;
export declare const NullVParagraph: <Extensions extends object = {}>() => VParagraphElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VParagraphElement: VParagraphElement;
    }
}
declare const VParamElement_base: VElementBaseSignature2;
export declare class VParamElement extends VParamElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VParam: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VParamElement & Extensions;
export declare const NullVParam: <Extensions extends object = {}>() => VParamElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VParamElement: VParamElement;
    }
}
declare const VPictureElement_base: VElementBaseSignature2;
export declare class VPictureElement extends VPictureElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VPicture: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VPictureElement & Extensions;
export declare const NullVPicture: <Extensions extends object = {}>() => VPictureElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VPictureElement: VPictureElement;
    }
}
declare const VPreElement_base: VElementBaseSignature2;
export declare class VPreElement extends VPreElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VPre: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VPreElement & Extensions;
export declare const NullVPre: <Extensions extends object = {}>() => VPreElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VPreElement: VPreElement;
    }
}
declare const VProgressElement_base: VElementBaseSignature2;
export declare class VProgressElement extends VProgressElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VProgress: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VProgressElement & Extensions;
export declare const NullVProgress: <Extensions extends object = {}>() => VProgressElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VProgressElement: VProgressElement;
    }
}
declare const VScriptElement_base: VElementBaseSignature2;
export declare class VScriptElement extends VScriptElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VScript: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VScriptElement & Extensions;
export declare const NullVScript: <Extensions extends object = {}>() => VScriptElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VScriptElement: VScriptElement;
    }
}
declare const VSelectElement_base: VElementBaseSignature2;
export declare class VSelectElement extends VSelectElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VSelect: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VSelectElement & Extensions;
export declare const NullVSelect: <Extensions extends object = {}>() => VSelectElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VSelectElement: VSelectElement;
    }
}
declare const VSlotElement_base: VElementBaseSignature2;
export declare class VSlotElement extends VSlotElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VSlot: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VSlotElement & Extensions;
export declare const NullVSlot: <Extensions extends object = {}>() => VSlotElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VSlotElement: VSlotElement;
    }
}
declare const VSourceElement_base: VElementBaseSignature2;
export declare class VSourceElement extends VSourceElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VSource: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VSourceElement & Extensions;
export declare const NullVSource: <Extensions extends object = {}>() => VSourceElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VSourceElement: VSourceElement;
    }
}
declare const VSpanElement_base: VElementBaseSignature2;
export declare class VSpanElement extends VSpanElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VSpan: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VSpanElement & Extensions;
export declare const NullVSpan: <Extensions extends object = {}>() => VSpanElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VSpanElement: VSpanElement;
    }
}
declare const VTableElement_base: VElementBaseSignature2;
export declare class VTableElement extends VTableElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VTable: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VTableElement & Extensions;
export declare const NullVTable: <Extensions extends object = {}>() => VTableElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VTableElement: VTableElement;
    }
}
declare const VTHeadElement_base: VElementBaseSignature2;
export declare class VTHeadElement extends VTHeadElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VTHead: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VTHeadElement & Extensions;
export declare const NullVTHead: <Extensions extends object = {}>() => VTHeadElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VTHeadElement: VTHeadElement;
    }
}
declare const VTBodyElement_base: VElementBaseSignature2;
export declare class VTBodyElement extends VTBodyElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VTBody: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VTBodyElement & Extensions;
export declare const NullVTBody: <Extensions extends object = {}>() => VTBodyElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VTBodyElement: VTBodyElement;
    }
}
declare const VTFootElement_base: VElementBaseSignature2;
export declare class VTFootElement extends VTFootElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VTFoot: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VTFootElement & Extensions;
export declare const NullVTFoot: <Extensions extends object = {}>() => VTFootElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VTFootElement: VTFootElement;
    }
}
declare const VTHElement_base: VElementBaseSignature2;
export declare class VTHElement extends VTHElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VTH: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VTHElement & Extensions;
export declare const NullVTH: <Extensions extends object = {}>() => VTHElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VTHElement: VTHElement;
    }
}
declare const VTDElement_base: VElementBaseSignature2;
export declare class VTDElement extends VTDElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VTD: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VTDElement & Extensions;
export declare const NullVTD: <Extensions extends object = {}>() => VTDElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VTDElement: VTDElement;
    }
}
declare const VTemplateElement_base: VElementBaseSignature2;
export declare class VTemplateElement extends VTemplateElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VTemplate: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VTemplateElement & Extensions;
export declare const NullVTemplate: <Extensions extends object = {}>() => VTemplateElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VTemplateElement: VTemplateElement;
    }
}
declare const VTimeElement_base: VElementBaseSignature2;
export declare class VTimeElement extends VTimeElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VTime: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VTimeElement & Extensions;
export declare const NullVTime: <Extensions extends object = {}>() => VTimeElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VTimeElement: VTimeElement;
    }
}
declare const VTitleElement_base: VElementBaseSignature2;
export declare class VTitleElement extends VTitleElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VTitle: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VTitleElement & Extensions;
export declare const NullVTitle: <Extensions extends object = {}>() => VTitleElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VTitleElement: VTitleElement;
    }
}
declare const VTableRowElement_base: VElementBaseSignature2;
export declare class VTableRowElement extends VTableRowElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VTableRow: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VTableRowElement & Extensions;
export declare const NullVTableRow: <Extensions extends object = {}>() => VTableRowElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VTableRowElement: VTableRowElement;
    }
}
declare const VTrackElement_base: VElementBaseSignature2;
export declare class VTrackElement extends VTrackElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VTrack: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VTrackElement & Extensions;
export declare const NullVTrack: <Extensions extends object = {}>() => VTrackElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VTrackElement: VTrackElement;
    }
}
declare const VUListElement_base: VElementBaseSignature2;
export declare class VUListElement extends VUListElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VUList: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VUListElement & Extensions;
export declare const NullVUList: <Extensions extends object = {}>() => VUListElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VUListElement: VUListElement;
    }
}
declare const VIFrameElement_base: VElementBaseSignature2;
export declare class VIFrameElement extends VIFrameElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VIFrame: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VIFrameElement & Extensions;
export declare const NullVIFrame: <Extensions extends object = {}>() => VIFrameElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VIFrameElement: VIFrameElement;
    }
}
declare const VCodeElement_base: VElementBaseSignature2;
export declare class VCodeElement extends VCodeElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VCode: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VCodeElement & Extensions;
export declare const NullVCode: <Extensions extends object = {}>() => VCodeElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VCodeElement: VCodeElement;
    }
}
declare const VSectionElement_base: VElementBaseSignature2;
export declare class VSectionElement extends VSectionElement_base {
    static element_name: string;
    static element_tag: string;
    constructor(args?: DerivedVElementInitOptions);
}
export declare const VSection: <Extensions extends object = {}>(args?: DerivedVElementInitOptions | undefined) => VSectionElement & Extensions;
export declare const NullVSection: <Extensions extends object = {}>() => VSectionElement & Extensions;
declare module '../ui/any_element.d.ts' {
    interface AnyElementMap {
        VSectionElement: VSectionElement;
    }
}
export type VBaseElements = VHTMLElement | VAnchorElement | VAreaElement | VAudioElement | VBlockQuoteElement | VBodyElement | VBRElement | VButtonElement | VCanvasElement | VTableCaptionElement | VTableColElement | VDataElement | VDataListElement | VDListElement | VDirectoryElement | VDivElement | VEmbedElement | VFieldSetElement | VFormElement | VHeadingElement | VHeadElement | VHRElement | VImageElement | VInputElement | VModElement | VLabelElement | VLegendElement | VLIElement | VLinkElement | VMapElement | VMetaElement | VMeterElement | VObjectElement | VOListElement | VOptGroupElement | VOptionElement | VOutputElement | VParagraphElement | VParamElement | VPictureElement | VPreElement | VProgressElement | VScriptElement | VSelectElement | VSlotElement | VSourceElement | VSpanElement | VTableElement | VTHeadElement | VTBodyElement | VTFootElement | VTHElement | VTDElement | VTemplateElement | VTextAreaElement | VTimeElement | VTitleElement | VTableRowElement | VTrackElement | VUListElement | VIFrameElement | VCodeElement | VSectionElement;
export declare const VElementTagMap: {
    readonly _base: typeof VHTMLElement;
    readonly a: typeof VAnchorElement;
    readonly area: typeof VAreaElement;
    readonly audio: typeof VAudioElement;
    readonly blockquote: typeof VBlockQuoteElement;
    readonly body: typeof VBodyElement;
    readonly br: typeof VBRElement;
    readonly button: typeof VButtonElement;
    readonly canvas: typeof VCanvasElement;
    readonly caption: typeof VTableCaptionElement;
    readonly col: typeof VTableColElement;
    readonly data: typeof VDataElement;
    readonly datalist: typeof VDataListElement;
    readonly dl: typeof VDListElement;
    readonly dir: typeof VDirectoryElement;
    readonly div: typeof VDivElement;
    readonly embed: typeof VEmbedElement;
    readonly fieldset: typeof VFieldSetElement;
    readonly form: typeof VFormElement;
    readonly h1: typeof VHeadingElement;
    readonly head: typeof VHeadElement;
    readonly hr: typeof VHRElement;
    readonly img: typeof VImageElement;
    readonly input: typeof VInputElement;
    readonly ins: typeof VModElement;
    readonly label: typeof VLabelElement;
    readonly legend: typeof VLegendElement;
    readonly li: typeof VLIElement;
    readonly link: typeof VLinkElement;
    readonly map: typeof VMapElement;
    readonly meta: typeof VMetaElement;
    readonly meter: typeof VMeterElement;
    readonly object: typeof VObjectElement;
    readonly ol: typeof VOListElement;
    readonly optgroup: typeof VOptGroupElement;
    readonly option: typeof VOptionElement;
    readonly output: typeof VOutputElement;
    readonly p: typeof VParagraphElement;
    readonly param: typeof VParamElement;
    readonly picture: typeof VPictureElement;
    readonly pre: typeof VPreElement;
    readonly progress: typeof VProgressElement;
    readonly script: typeof VScriptElement;
    readonly select: typeof VSelectElement;
    readonly slot: typeof VSlotElement;
    readonly source: typeof VSourceElement;
    readonly span: typeof VSpanElement;
    readonly table: typeof VTableElement;
    readonly thead: typeof VTHeadElement;
    readonly tbody: typeof VTBodyElement;
    readonly tfoot: typeof VTFootElement;
    readonly th: typeof VTHElement;
    readonly td: typeof VTDElement;
    readonly template: typeof VTemplateElement;
    readonly textarea: typeof VTextAreaElement;
    readonly time: typeof VTimeElement;
    readonly title: typeof VTitleElement;
    readonly tr: typeof VTableRowElement;
    readonly track: typeof VTrackElement;
    readonly ul: typeof VUListElement;
    readonly iframe: typeof VIFrameElement;
    readonly code: typeof VCodeElement;
    readonly section: typeof VSectionElement;
};
export {};
