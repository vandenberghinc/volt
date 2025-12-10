/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved.
 */
import { GradientType } from "../types/gradient.js";
import type { AnyElement } from "../ui/any_element.js";
import type { PseudoElement } from "../ui/pseudo.js";
import type { None, BorderOpts } from "./types.js";
import { Attachment } from "../modules/attachment.js";
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
/**
 * {Base element}
 * The base element of the volt frontend elements.
 * @nav FrontendVElement/Elements
 * @docs
 */
export declare abstract class VElement extends HTMLElement {
    static element_tag: string;
    static default_style: Record<string, any>;
    static default_attributes: Record<string, any>;
    static default_events: Record<string, any>;
    /** Attachments added by the {@link on_attachment_drop} callback. */
    attachments: Attachment[];
    /** Is rendered flag. */
    rendered: boolean;
    /** The element name. */
    element_name: string;
    /** The base element name @internal */
    base_element_name: string;
    /** Remove focus method. */
    remove_focus: HTMLElement["blur"];
    __is_velement: boolean;
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
     * {Clone}
     * Creates a deep copy of the current element, including its styles and attributes.
     * Optionally clones child nodes based on the provided parameter.
     * @parameter clone_children Indicates whether to clone child nodes of the current element.
     * @returns Returns a new instance of the element that is a clone of the current one.
     * @docs
     */
    clone(clone_children?: boolean): this;
    /**
     * {Pad Numeric}
     * Pads a numeric value with a specified padding unit, defaulting to "px".
     * @parameter value The numeric value to be padded.
     * @parameter padding The unit to pad the numeric value with.
     * @returns Returns the padded value as a string.
     * @docs
     */
    pad_numeric(value: None | number | string, padding?: string): string;
    /**
     * {Pad Percentage}
     * Pads a numeric value with a percentage symbol. If the value is a float between 0 and 1, it is multiplied by 100 before padding.
     * @parameter value The numeric value to pad.
     * @parameter padding The string to pad the numeric value with, defaults to "%".
     * @returns Returns the padded percentage as a string, or the original value if it is not numeric.
     * @docs
     */
    pad_percentage(value: number, padding?: string): string;
    /**
     * {Edit Filter Wrapper}
     * Edits a filter string by replacing or removing specified types.
     * Can also append a new type if it doesn’t exist in the filter.
     * @parameter filter The original filter string that needs to be edited.
     * @parameter type The type that will be targeted for replacement or removal.
     * @parameter to The new value to replace the existing type with, or null to remove it.
     * @returns Returns the modified filter string or null if the input filter was null.
     * @docs
     */
    edit_filter_wrapper(filter: string | null, type: string, to?: undefstrnr): string;
    /**
     * {Toggle Filter Wrapper}
     * Toggles a specified filter type in a string. If the type is present, it will be removed; otherwise, it will be added.
     * @parameter filter The filter string to modify.
     * @parameter type The type of filter to toggle.
     * @parameter to The value to add if the type is not present.
     * @returns Returns the modified filter string or null if the input filter was null.
     * @docs
     */
    toggle_filter_wrapper(filter: string | null, type: string, to?: string | null): string;
    _convert_px_to_number_type(value: any, def?: number | null): any;
    _try_parse_float(value: any, def?: number | null): any;
    _try_parse_boolean(value: any): boolean;
    /**
     * {Append Child Elements}
     * Appends child elements to the current element. Can accept multiple child elements, including HTML nodes, functions, or strings.
     * @parameter children The child elements to append, which can be an array of elements, a single element, or a function.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    append(...children: AppendType[]): this;
    /**
     * {ZStack Append}
     * Appends multiple children to the ZStack element. This method can handle various types of children such as elements, functions, and text.
     * @parameter children The children to append, which can be elements, arrays, text, or functions returning elements.
     * @returns Returns the instance of the ZStack element for chaining.
     * @docs
     */
    zstack_append(...children: AppendType[]): this;
    /**
     * {Append To Parent}
     * Appends the current element to a specified parent element and manages parent-child relationships.
     * @parameter parent The parent element to which the current element will be appended.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    append_to(parent: any): this;
    /**
     * {Append Children to Parent}
     * Appends the children of the current element to the specified parent element and executes a callback for each appended child.
     * @parameter parent The parent element to which the children will be appended.
     * @parameter on_append_callback A callback function that is executed for each child when it is appended.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    append_children_to(parent: any, on_append_callback?: Function): this;
    /**
     * {Remove Child}
     * Removes a child element from the current element. The child can be specified
     * by passing a Node, an VElement, or an id string of the element to be removed.
     * @parameter child The child to be removed from the current element.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    remove_child(child: any): this;
    /**
     * {Remove Children}
     * Removes all child elements from the current element without using innerHTML.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    remove_children(): this;
    /**
     * {Child}
     * Retrieves a child element by its index. Supports negative indexing to access elements from the end of the list.
     * @parameter index The index of the child to retrieve. Can be a positive or negative integer.
     * @returns Returns the child element at the specified index.
     * @docs
     */
    child(index: number): any;
    /**
     * {Get Child}
     * Retrieves a child element by its index. Supports negative indexing to access elements from the end.
     * @parameter index The index of the child element to retrieve. Can be negative to access from the end.
     * @returns Returns the child element at the specified index, or undefined if the index is out of bounds.
     * @docs
     */
    get(index: number): any | undefined;
    /**
     * {Text}
     * Set or get the text content of the element. If no value is provided, it retrieves the current text content.
     * @parameter value The text content to set or retrieve.
     * @returns Returns the current text content if no argument is passed, otherwise returns the instance of the element for chaining.
     * @docs
     */
    text(): string;
    text(value: string): this;
    /**
     * {Width}
     * Specify the width or height of the element. Returns the offset width or height when the param value is null.
     * @parameter value The width value to set or get.
     * @parameter check_attribute Indicates whether to check the element's width attribute.
     * @returns Returns the offset width when no value is provided, otherwise returns the instance of the element for chaining.
     * @docs
     */
    width(): string | number;
    width(value: string | number, check_attribute?: boolean): this;
    /** Simple wrapper for .width("fit-content") */
    fit_content(): this;
    /**
     * {Fixed Width}
     * Sets the fixed width for the element and updates min and max widths accordingly.
     * @parameter value The value to set for the width, can be a number or null to get the current width.
     * @returns If no argument is passed, returns the current width as a number. If an argument is passed, returns the instance of the element for chaining.
     * @docs
     */
    fixed_width(): string | number;
    fixed_width(value: string | number): this;
    /**
     * {Height}
     * Sets or retrieves the height of the element. It checks for attributes and styles based on the provided parameters.
     * @parameter value The value to set for height or retrieve the current height if null.
     * @parameter check_attribute Determines if the element's attribute should be checked.
     * @returns Returns the instance of the element for chaining when an argument is passed, otherwise returns the current height as a number.
     * @docs
     */
    height(): string | number;
    height(value: string | number, check_attribute?: boolean): this;
    /**
     * {Fixed Height}
     * Sets the fixed height for the element or retrieves the current height if no value is provided.
     * @parameter value The height value to set, which can be a number or null.
     * @returns When an argument is passed, this function returns the instance of the element for chaining. Otherwise, it returns the parsed float value of the current height.
     * @docs
     */
    fixed_height(): string | number;
    fixed_height(value: string | number): this;
    /**
     * {Min height}
     * Sets the minimum height of an element. The equivalent of CSS attribute `minHeight`.
     * Returns the attribute value when parameter `value` is `null`.
     * @parameter value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    min_height(): string | number;
    min_height(value: string | number): this;
    /**
     * {Min Width}
     * Sets the minimum width of an element. The equivalent of CSS attribute `minWidth`.
     * Returns the attribute value when parameter `value` is `null`.
     * @parameter value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    min_width(): string | number;
    min_width(value: string | number): this;
    /**
     * {Width By Columns}
     * Sets the width of HStack children based on the number of columns specified.
     * If columns are not provided, it defaults to 1. The calculation takes into account
     * the left and right margins of the element.
     * @parameter columns The number of columns to set the width by.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    width_by_columns(columns: number): this;
    /**
     * {Offset Width}
     * Retrieves the offset width of the element.
     * @returns Returns the offset width of the element.
     * @docs
     */
    offset_width(): number;
    /**
     * {Offset Height}
     * Retrieves the height of the element's offset.
     * @returns Returns the height of the element including padding and border.
     * @docs
     */
    offset_height(): number;
    /**
     * {Client Width}
     * Retrieves the client width of the element.
     * @returns Returns the client width of the element.
     * @docs
     */
    client_width(): number;
    /**
     * {Client Height}
     * Retrieves the height of the client area of the element.
     * @returns Returns the height of the client area in pixels.
     * @docs
     */
    client_height(): number;
    /**
     * {X Offset}
     * Retrieves the x offset of the element from its parent.
     * @returns Returns the x offset value of the element.
     * @docs
     */
    x(): number;
    /**
     * {Y Offset}
     * Retrieves the vertical offset of the element from the top of the document.
     * @returns Returns the vertical offset value.
     * @docs
     */
    y(): number;
    /**
     * {Frame}
     * Sets the width and height of the frame. If width or height is not provided, it does not change that dimension.
     * @parameter width The width to set for the frame.
     * @parameter height The height to set for the frame.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    frame(width?: string | number, height?: string | number): this;
    /**
     * {Min Frame}
     * Sets the minimum width and height for the frame. If parameters are provided, it updates the respective properties.
     * @parameter width The minimum width to set for the frame.
     * @parameter height The minimum height to set for the frame.
     * @returns Returns the instance of the frame for chaining.
     * @docs
     */
    min_frame(width: string | number, height: string | number): this;
    /**
     * {Max Frame}
     * Sets the maximum width and height for the frame. If a value is provided, it updates the respective maximum dimension.
     * @parameter width The maximum width to set for the frame.
     * @parameter height The maximum height to set for the frame.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    max_frame(width: string | number, height: string | number): this;
    /**
     * {Fixed Frame}
     * Sets the width and height of the element, applying padding to the values if provided.
     * @parameter width The width to set for the element. Can be a number or null.
     * @parameter height The height to set for the element. Can be a number or null.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    fixed_frame(width: string | number, height: string | number): this;
    /**
     * {Get Frame While Hidden}
     * Retrieves the dimensions of the element as it would appear if it were not hidden.
     * @returns Returns an object containing the width and height of the element.
     * @docs
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
     * {Padding}
     * Sets the padding of the element based on the number of provided arguments.
     * It can accept 1, 2, or 4 values to set padding for different sides.
     * @parameter values The padding values to set. Can be a single value, two values for vertical and horizontal,
     *                   or four values for top, right, bottom, and left.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    padding(): string;
    padding(value: undefstrnr): this;
    padding(top_bottom: undefstrnr, left_right: undefstrnr): this;
    padding(top: undefstrnr, right: undefstrnr, bottom: undefstrnr, left: undefstrnr): this;
    /**
     * {Padding Bottom}
     * Sets the bottom padding of an element. The equivalent of CSS attribute `paddingBottom`.
     * Returns the attribute value when parameter `value` is `null`.
     * @parameter value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    padding_bottom(): number;
    padding_bottom(value: string | number): this;
    /**
     * {Padding Left}
     * Sets the left padding of an element. The equivalent of CSS attribute `paddingLeft`.
     * Returns the attribute value when parameter `value` is `null`.
     * @parameter value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    padding_left(): number;
    padding_left(value: string | number): this;
    /**
     * {Padding Right}
     * Sets the right padding of an element, equivalent to the CSS attribute `paddingRight`.
     * Returns the attribute value when parameter `value` is `null`.
     * @parameter value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining, unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    padding_right(): number;
    padding_right(value: string | number): this;
    /**
     * {Padding Top}
     * Sets the top padding of an element. The equivalent of CSS attribute `paddingTop`.
     * Returns the attribute value when parameter `value` is `null`.
     * @parameter value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    padding_top(): number;
    padding_top(value: string | number): this;
    /**
     * {Margin}
     * Sets the margin of the element. Can accept 1, 2, or 4 values for different margin settings.
     * @parameter values The values for the margin. Can be a single value, two values for vertical and horizontal margins, or four values for each side.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    margin(): string;
    margin(value: undefstrnr): this;
    margin(top_bottom: undefstrnr, left_right: undefstrnr): this;
    margin(top: undefstrnr, right: undefstrnr, bottom: undefstrnr, left: undefstrnr): this;
    /**
     * {Margin Bottom}
     * Sets the bottom margin of an element. The equivalent of CSS attribute `marginBottom`. Returns the attribute value when parameter `value` is `null`.
     * @parameter value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    margin_bottom(): number;
    margin_bottom(value: string | number): this;
    /**
     * {Margin Left}
     * Sets the left margin of an element, equivalent to the CSS attribute `marginLeft`.
     * Returns the attribute value when parameter `value` is `null`.
     * @parameter value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    margin_left(): number;
    margin_left(value: string | number): this;
    /**
     * {Margin Right}
     * Sets the right margin of an element, equivalent to the CSS attribute `marginRight`.
     * Returns the attribute value when the parameter `value` is `null`.
     * @parameter value The value to assign to the right margin. Leave `null` to retrieve the attribute's value.
     * @returns Returns the instance of the element for chaining unless the parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    margin_right(): number;
    margin_right(value: string | number): this;
    /**
     * {Margin Top}
     * Sets the top margin of an element. The equivalent of CSS attribute `marginTop`.
     * Returns the attribute value when parameter `value` is `null`.
     * @parameter value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    margin_top(): number;
    margin_top(value: string | number): this;
    /**
     * {Position}
     * Sets or retrieves the position style of the element. Can be used with 0, 1, or 4 arguments.
     * @parameter values The values for setting the position, which can be a single value or four values for top, right, bottom, and left.
     * @returns Returns the current position if no arguments are passed, or the instance of the element for chaining when arguments are provided.
     * @docs
     */
    position(): string | undefined;
    position(value: number | string): this;
    position(top?: number | string | None, right?: number | string | None, bottom?: number | string | None, left?: number | string | None): this;
    /**
     * {Stretch}
     * Sets the flex property of the element to control its stretching behavior.
     * @parameter value A boolean indicating whether the element should stretch or not.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    stretch(value: boolean): this;
    /**
     * {Wrap}
     * Sets the wrapping behavior of an element based on the provided value.
     * @parameter value A boolean or string indicating the wrap behavior.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    wrap(value: boolean | string): this;
    /**
     * {Z Index}
     * Sets the z-index style property of the element.
     * @parameter value The z-index value to set for the element.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    z_index(value: number | string): this;
    /**
     * {Side by Side}
     * Set the elements side by side till a specified width.
     * @experimental
     * @param options Configuration options for the side by side layout.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    side_by_side(options: {
        /** The amount of column elements that will be put on one row. */
        columns?: number;
        /** The horizontal spacing between the columns in pixels. */
        hspacing?: number;
        /** The vertical spacing between the rows in pixels. */
        vspacing?: number;
        /** Stretch the leftover columns to max width. */
        stretch?: boolean;
        /** Hide dividers when they would appear on a row. */
        hide_dividers?: boolean;
    }): this;
    /**
     * {Side By Side Basis}
     * Sets or retrieves the side by side basis for a node, which must be a floating percentage between 0.0 and 1.0.
     * @parameter basis The basis value to set or retrieve.
     * @returns When an argument is passed, this function returns the instance of the element for chaining. Otherwise, it returns the already set side by side basis.
     * @docs
     */
    side_by_side_basis(): number | undefined;
    side_by_side_basis(basis: number | false): this;
    /**
     * {Ellipsis Overflow}
     * Configures the text overflow behavior with ellipsis. It can enable or disable ellipsis and set the number of lines.
     * @parameter to Indicates whether to enable or disable ellipsis. If `null`, it returns the current state.
     * @parameter after_lines The number of lines after which ellipsis should be applied. Only relevant when `to` is `true`.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    ellipsis_overflow(): boolean;
    ellipsis_overflow(to: boolean, after_lines?: number | None): this;
    /**
     * {Align}
     * Sets or retrieves the alignment style of the element based on its type.
     * @parameter value The alignment value to set or retrieve based on the element type.
     * @returns When an argument is passed, this function returns the instance of the element for chaining. Otherwise, it returns the currently set alignment value.
     * @docs
     */
    align(): string;
    align(value: string): this;
    /**
     * {Leading}
     * Sets the alignment to the start position.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    leading(): this;
    /**
     * {Center Alignment}
     * Sets the alignment of the element to center.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    center(): this;
    /**
     * {Trailing}
     * Aligns the element to the end.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    trailing(): this;
    /**
     * {Align Vertical}
     * Sets or retrieves the vertical alignment style of the element based on its type.
     * @parameter value The alignment value to set or retrieve.
     * @returns Returns the instance of the element for chaining when an argument is passed. Otherwise, returns the current alignment value.
     * @docs
     */
    align_vertical(): string;
    align_vertical(value: string): this;
    /**
     * {Leading Vertical}
     * Sets the vertical alignment to the start position.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    leading_vertical(): this;
    /**
     * {Center Vertical}
     * Centers the element vertically, optionally only when there is no overflow.
     * @parameter only_on_no_overflow Determines whether to center only when there is no overflow.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    center_vertical(only_on_no_overflow?: boolean): this;
    /**
     * {Trailing Vertical}
     * Sets the vertical alignment to the trailing position.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    trailing_vertical(): this;
    /**
     * {Align Text}
     * Sets the text alignment using predefined shortcuts.
     * @parameter value The value representing the text alignment to set.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    align_text(value: string): this;
    /**
     * {Text Leading}
     * Sets the text alignment to the start position for leading text.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    text_leading(): this;
    /**
     * {Text Center}
     * Sets the text alignment of the element to center.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    text_center(): this;
    /**
     * {Text Trailing}
     * Sets the text alignment to 'end' for trailing text.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    text_trailing(): this;
    /**
     * {Align Height}
     * Aligns items by height inside a horizontal stack.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    align_height(): this;
    /**
     * {Text Wrap}
     * Set the text wrap value, equivalent to the CSS attribute `textWrap`.
     * Returns the attribute value when the parameter `value` is `null`.
     * @parameter value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    text_wrap(): string;
    text_wrap(value: string): this;
    /**
     * {Line clamp}
     * This non-standard CSS property allows you to limit the number of lines shown in a block container. When used in conjunction with `-webkit-box-orient`, it specifies the maximum number of lines to display before truncating the text. Text that exceeds this limit is cut off and typically ends with an ellipsis. This property is particularly useful for creating text overflow effects in web design where maintaining a consistent, visually manageable block of text is necessary.
     * @parameter value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, in which case the attribute's value is returned.
     * @docs
     */
    line_clamp(): string;
    line_clamp(value: string): this;
    /**
     * {Box Orient}
     * This property is part of the old flexbox model and is used to define the orientation of the children in a flex container. In combination with `-webkit-line-clamp`, it's set to vertical to allow the line clamping effect on block containers. It dictates how the children of the box are laid out: horizontally or vertically. Note that `-webkit-box-orient` is specific to Webkit-based browsers and is not part of the standard CSS flexbox properties.
     * @parameter value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    box_orient(): string;
    box_orient(value: string): this;
    /**
     * Sets the color of text, also supports a `GradientType` element.
     * Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     *          When the value is `null` and the color has been set using a `GradientType`, `transparent` will be returned.
     * @docs
     */
    color(): string;
    color(value: string | GradientType): this;
    border(): string;
    border(value: string): this;
    border(width: string | number, color: string): this;
    border(width: string | number, style: string, color: string): this;
    border(opts: BorderOpts): this;
    /**
     * {Border Top}
     * Sets the border top style for the element. Returns the current value when no parameters are provided.
     * @parameter values Values to set the border top, can include width, style, and color.
     * @returns Returns the current border top value if no parameters are provided; otherwise returns the instance of the element for chaining.
     * @docs
     */
    border_top(): string;
    border_top(value: string | number): this;
    border_top(width: string | number, color: string): this;
    border_top(width: string | number, style: string, color: string): this;
    /**
     * {Border Bottom}
     * Sets the border bottom style of the element. Returns the attribute value when no parameters are defined.
     * @parameter values A variable number of values to set the border bottom style.
     * @returns Returns the current border bottom style when no arguments are passed, otherwise returns the instance for chaining.
     * @docs
     */
    border_bottom(): string;
    border_bottom(value: string): this;
    border_bottom(width: string | number, color: string): this;
    border_bottom(width: string | number, style: string, color: string): this;
    /**
     * {Border Right}
     * Sets the border-right property of the element.
     * Returns the current value if no parameters are provided.
     * @parameter values The values to set for the border-right property.
     * @returns Returns the instance of the element for chaining when parameters are provided, otherwise returns the current value of the border-right property.
     * @docs
     */
    border_right(): string;
    border_right(value: string): this;
    border_right(width: string | number, color: string): this;
    border_right(width: string | number, style: string, color: string): this;
    /**
     * {Border Left}
     * Sets the left border style of the element. Returns the current value if no parameters are provided.
     * @parameter values The values to set for the border-left property.
     * @returns Returns the current value of the left border when no parameters are provided, otherwise returns the instance of the element for chaining.
     * @docs
     */
    border_left(): string;
    border_left(value: string): this;
    border_left(width: string | number, color: string): this;
    border_left(width: string | number, style: string, color: string): this;
    /**
     * {Shadow}
     * Sets the box shadow of the element. Can accept either 1 or 4 arguments for different shadow styles.
     * @parameter values The values to set the box shadow. Can be a single value or four separate values.
     * @returns Returns the current box shadow if no arguments are provided, or the instance of the element for chaining.
     * @docs
     */
    shadow(): string;
    shadow(value: string | number): this;
    shadow(value1: string | number, value2: string | number, value3: string | number, value4: string | string): this;
    /**
     * {Drop Shadow}
     * Applies a drop shadow effect to the object. Can handle 0, 1, or 4 arguments.
     * @parameter values The values for the drop shadow effect, which can be numbers or null.
     * @returns Returns the instance of the element for chaining when arguments are provided. If no arguments are passed, it returns the current filter value.
     * @docs
     */
    drop_shadow(): string;
    drop_shadow(value: string | number): this;
    drop_shadow(value1: string | number, value2: string | number, value3: string | number, value4: string): this;
    /**
     * {Greyscale}
     * Applies a greyscale filter to the element. Returns the current filter if no value is provided.
     * @parameter value The percentage value for greyscale. Can be a number or null.
     * @returns Returns the current filter value if no argument is passed, otherwise returns the instance for chaining.
     * @docs
     */
    greyscale(): string;
    greyscale(value: number): this;
    /**
     * {Opacity}
     * Set or get the opacity of the element based on its type.
     * @parameter value The value of the opacity to set, or null to get the current opacity.
     * @returns Returns the current opacity value if no argument is passed. When an argument is passed, it returns the instance of the element for chaining.
     * @docs
     */
    opacity(): string | number;
    opacity(value: string | number): this;
    /**
     * {Toggle Opacity}
     * Toggles the opacity of the element between a specified value and fully opaque.
     * @parameter value The value to set the opacity to when toggling.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    toggle_opacity(value: number): this;
    /**
     * {Blur}
     * Applies a blur effect to the element using the specified value.
     * @parameter value The amount of blur to apply, can be a number or null.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    blur(): string;
    blur(value: number): this;
    /**
     * {Toggle Blur}
     * Toggles the blur effect on the element with a specified value.
     * @parameter value The amount of blur to apply, defaulting to 10.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    toggle_blur(value?: number): this;
    /**
     * {Background Blur}
     * Sets or retrieves the background blur effect for the element.
     * @parameter value The value to set for the blur effect, which can be a number or null.
     * @returns Returns the current blur effect if no argument is passed, otherwise returns the instance of the element for chaining.
     * @docs
     */
    background_blur(): string;
    background_blur(value: number | null): this;
    /**
     * {Toggle Background Blur}
     * Toggles the background blur effect by applying a backdrop filter.
     * @parameter value The intensity of the blur effect to apply.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    toggle_background_blur(value?: number): this;
    /**
     * {Brightness}
     * Adjusts the brightness of an element's filter. If no value is provided, it returns the current brightness filter.
     * @parameter value The brightness level to set, can be a number or null.
     * @returns Returns the instance of the element for chaining if a value is provided. Otherwise, returns the current brightness filter.
     * @docs
     */
    brightness(): string;
    brightness(value: number): this;
    /**
     * {Toggle Brightness}
     * Toggles the brightness of the element by applying a filter based on the provided value.
     * @parameter value The brightness value to set, defaults to 0.5 if not provided.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    toggle_brightness(value?: number): this;
    /**
     * {Background Brightness}
     * Adjusts the brightness of the background using a specified value.
     * If no value is provided, it retrieves the current backdrop filter.
     * @parameter value The brightness value to set, or null to get the current value.
     * @returns Returns the instance of the element for chaining when a value is provided, or the current backdrop filter value if no value is given.
     * @docs
     */
    background_brightness(): string;
    background_brightness(value: number): this;
    /**
     * {Toggle Background Brightness}
     * Toggles the background brightness by applying a filter based on the provided value.
     * @parameter value The brightness value to set, defaulting to 10 if not provided.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    toggle_background_brightness(value?: number): this;
    /**
     * {Rotate}
     * Sets the rotation transformation for the element. When called without an argument, it retrieves the current rotation.
     * @parameter value The value to set as the rotation. It can be a number, string, or null.
     * @returns Returns the current rotation value as a string when no argument is passed. When an argument is provided, it returns the instance of the element for chaining.
     * @docs
     */
    rotate(): string;
    rotate(value: number | string): this;
    /**
     * {Delay}
     * Set the delay for keyframes in the style element.
     * @parameter value The value of the delay to set.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    delay(value: string | number): this;
    /**
     * {Duration}
     * Sets the duration style property for the element.
     * @parameter value The value to set for the duration property.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    duration(value: string | number): this;
    /**
     * {Background}
     * A shorthand property for all the background properties.
     * The equivalent of CSS attribute `background`.
     * Returns the attribute value when parameter `value` is `null`.
     * @parameter value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    background(): string;
    background(value: string): this;
    /**
     * {Scale Font Size}
     * Adjusts the font size based on a scaling factor relative to the current font size.
     * @parameter scale The scaling factor to apply to the current font size.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    scale_font_size(scale?: number): this;
    font_size_ratio(scale?: number): this;
    /**
     * {Display}
     * Sets or retrieves the display style of an HTML element.
     * If no value is provided, it returns the current display style.
     * @parameter value The value to set for the display style.
     * @docs
     */
    display(): string;
    display(value: string): this;
    /**
     * {Hide}
     * Hides the element by setting its display style to none.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    hide(): this;
    /**
     * {Show}
     * Displays the element by setting its display style property.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    show(): this;
    /**
     * {Is Hidden}
     * Checks if the element is currently hidden based on its display style.
     * @returns Returns true if the element is hidden; otherwise, false.
     * @docs
     */
    is_hidden(): boolean;
    /**
     * {Is Visible}
     * Checks if the element is visible based on its display style.
     * @returns Returns true if the element is visible, false otherwise.
     * @docs
     */
    is_visible(): boolean;
    /**
     * {Toggle Visibility}
     * Toggles the visibility of the element by showing or hiding it based on its current state.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    toggle_visibility(): this;
    /**
     * {Inner HTML}
     * Get or set the inner HTML of an element.
     * @parameter value The HTML content to set. If no value is provided, the current inner HTML is returned.
     * @returns Returns the current inner HTML if no argument is passed, otherwise returns the instance of the element for chaining.
     * @docs
     */
    inner_html(): string;
    inner_html(value: string): this;
    /**
     * {Outer HTML}
     * Get or set the outer HTML of the element. If no argument is passed, it returns the current outer HTML.
     * @parameter value The outer HTML to set.
     * @returns Returns the instance of the element for chaining when an argument is passed, otherwise returns the current outer HTML.
     * @docs
     */
    outer_html(): string;
    outer_html(value: string): this;
    /**
     * {Styles}
     * Retrieves the CSS attributes when no parameter is provided, or sets the styles based on the provided attributes.
     * @parameter css_attr The CSS attributes to set. If null, returns the current styles.
     * @returns When no argument is passed, returns the current styles as an object. When attributes are set, returns the instance of the element for chaining.
     * @docs
     */
    styles(): Record<string, string>;
    styles(css_attr: Record<string, any>): this;
    /**
     * {Attribute}
     * Get or set a single attribute for an element. If no value is provided, it retrieves the attribute's current value.
     * @parameter key The name of the attribute to get or set.
     * @parameter value The value to set for the attribute. If null, the current value is returned.
     * @returns Returns the current value of the attribute if no value is provided, otherwise returns the instance of the element for chaining.
     * @docs
     */
    attr(key: string): null | string;
    attr(key: string, value: string | number | null): this;
    /**
     * {Attributes}
     * Sets multiple attributes for the element based on the provided dictionary.
     * @parameter html_attr A dictionary of attributes to set on the element.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    attrs(html_attr: Record<string, string | number | boolean>): this;
    /**
     * {Event}
     * Get or set a single event associated with the element.
     * If no value is provided, it retrieves the current event.
     * @parameter key The name of the event to get or set.
     * @parameter value The value to set for the event, if provided.
     * @docs
     */
    event(key: string): any;
    event(key: string, value: any): this;
    /**
     * {Events}
     * Sets multiple event handlers on the current element using a dictionary of events.
     * @parameter html_events An object containing event names as keys and their corresponding handler functions as values.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    events(html_events: {
        [key: string]: EventListener;
    }): this;
    /**
     * {Class}
     * Specifies one or more classnames for an element (refers to a class in a style sheet).
     * The equivalent of HTML attribute `class`.
     * Returns the attribute value when parameter `value` is `null`.
     * @parameter value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    class(): string;
    class(value: string): this;
    /**
     * {Toggle class}
     * Toggles a class name from the class list, adding it if it's not present, or removing it if it is.
     * @parameter name The class name to toggle.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    toggle_class(name: string): this;
    /**
     * {Remove Class}
     * Remove a class name from the class list of the element.
     * @parameter name The class name to be removed from the class list.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    remove_class(name: string): this;
    /**
     * {Remove all classes}
     * Remove all classes from the class list.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    remove_classes(): this;
    /**
     * {Hover Brightness}
     * Controls the brightness effects on hover for the element.
     * You can enable or disable the effect or specify brightness levels.
     * @parameter mouse_down_brightness The brightness value when the mouse is down, or a boolean to enable/disable.
     * @parameter mouse_over_brightness The brightness value when the mouse is over the element.
     * @returns Returns the instance of the element for chaining when setting values, or a boolean indicating if the effect is enabled when no parameters are passed.
     * @docs
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
     * {Text Width}
     * Calculates the width of the provided text or the current text content if no text is provided. This is useful for measuring text width in input elements.
     * @parameter text The text whose width is to be measured. If null, the current text content is used.
     * @returns Returns the width of the text in pixels.
     * @docs
     */
    text_width(): number;
    text_width(text: string): number;
    /**
     * {Media Query}
     * Creates a media query listener that triggers provided handlers based on the media query's state.
     * @parameter media_query The media query string to evaluate.
     * @parameter true_handler The function to execute when the media query matches.
     * @parameter false_handler The function to execute when the media query does not match.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    media(media_query: string, true_handler?: ElementCallback<this>, false_handler?: ElementCallback<this>): this;
    /**
     * {Remove Media Query}
     * Removes a specified media query from the element's media queries.
     * @parameter media_query The media query string to be removed.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    remove_media(media_query: string): this;
    /**
     * {Remove Media Queries}
     * Removes all media queries from the element.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    remove_medias(): this;
    /**
     * {Remove All Media}
     * Removes all media queries and their associated listeners from the element.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    remove_all_media(): this;
    /**
     * {Default Animate}
     * Calls the animate function from the superclass with the provided arguments.
     * @parameter args The arguments to pass to the superclass animate function.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    default_animate(...args: any[]): this;
    /**
     * {Animate}
     * Starts a new animation with the specified keyframes and options. Automatically resets the active animation.
     * @parameter options Configuration options for the animation including keyframes, duration, and callbacks.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    animate(options: {
        /** An array of keyframe objects to animate. */
        keyframes: Array<any>;
        /** Delay before starting the animation in milliseconds. */
        delay?: number;
        /** Duration of each keyframe in milliseconds. */
        duration?: number;
        /** Whether the animation should repeat infinitely. */
        repeat?: boolean;
        /** Whether to keep the last keyframe when the animation ends. */
        persistent?: boolean;
        /** Callback function to execute when the animation finishes. */
        on_finish?: ((element: any) => any) | null;
        /** Easing function to use for the animation. */
        easing?: string;
    }): this;
    /**
     * {Stop Animation}
     * Stops the currently active animation by clearing the timeout.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    stop_animation(): this;
    /**
     * {Slide Out}
     * Animates the sliding out of an element in a specified direction with optional parameters for customization.
     * @parameter options Configuration options for the slide out animation.
     * @returns Returns a promise that resolves when the animation completes.
     * @docs
     */
    slide_out(options: {
        /**
         * The direction of the slide animation.
         * @default "top"
         */
        direction: string;
        /**
         * The distance in pixels for the slide animation.
         * @default 100
         */
        distance: number;
        /**
         * The duration of the animation in milliseconds.
         * @default 500
         */
        duration: number;
        /**
         * Whether to animate the opacity of the element.
         * @default true
         */
        opacity?: boolean;
        /**
         * The easing function for the animation.
         * @default "ease"
         */
        easing?: string;
        /**
         * Whether to hide the element after the animation completes.
         * @default true
         */
        hide?: boolean;
        /**
         * Whether to remove the element from the DOM after the animation completes.
         * @default false
         */
        remove?: boolean;
        /**
         * The display property to set when showing the element again.
         * @default null
         */
        display?: string;
        /**
         * Indicates if the animation is a slide-in animation.
         * @default false
         */
        _slide_in?: boolean;
    }): Promise<void>;
    /**
     * {Slide In}
     * Initiates a slide-in animation for the element with customizable parameters.
     * @parameter options Configuration options for the slide-in animation.
     * @returns Returns a promise that resolves when the slide-in animation is complete.
     * @docs
     */
    slide_in({ direction, distance, duration, opacity, easing, display, }: {
        /** The direction from which the element will slide in (e.g., "top", "bottom", "left", "right"). */
        direction?: string;
        /** The distance in pixels the element will slide in. */
        distance?: number;
        /** The duration of the slide animation in milliseconds. */
        duration?: number;
        /** A boolean indicating whether to animate the opacity during the slide. */
        opacity?: boolean;
        /** The easing function to use for the animation. */
        easing?: string;
        /** An optional display property to use when showing the view again. */
        display?: string;
    }): Promise<any>;
    /**
     * {Dropdown Text Animation}
     * Animates the text of a dropdown element with a specified animation effect.
     * It allows for customization of distance, duration, and easing for each character.
     * @warning Causes undefined behaviour when called on a non text element.
     * @parameter options An object containing animation settings.
     * @returns Returns a promise that resolves when the animation is complete.
     * @docs
     */
    dropdown_animation({ distance, duration, opacity_duration, total_duration, delay, start_delay, easing, }?: {
        /** The distance of pixels of the drop (negative) or rise (positive). */
        distance?: string;
        /** The duration of each individual character drop animation in milliseconds. */
        duration?: number;
        /** The factor for the duration in relation to the dropdown duration, 1.0 for 100%. */
        opacity_duration?: number;
        /** The total duration of the character drop animation, this parameter will overwrite the `duration` parameter. */
        total_duration?: number;
        /** The delay in milliseconds for each character drop. */
        delay?: number;
        /** The start delay of the animation in milliseconds. */
        start_delay?: number;
        /** The animation's easing. */
        easing?: string;
    }): Promise<void>;
    /**
     * {Increment Number Animation}
     * Animate incrementing a number with optional prefix and suffix.
     * @warning Causes undefined behaviour when called on a non text element.
     * @parameter start The start number for the animation.
     * @parameter end The end number, the animation will end with the number value of `end - 1`.
     * @parameter duration The duration of each individual number increment in milliseconds.
     * @parameter total_duration The total duration of the entire animation, parameter `total_duration` precedes parameter `duration`.
     * @parameter delay The delay until the animation starts in milliseconds.
     * @parameter prefix The prefix string to prepend to the animated number.
     * @parameter suffix The suffix string to append to the animated number.
     * @returns Returns a promise that resolves when the animation completes.
     * @docs
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
     * {On emit}
     * Registers an event callback for the specified event ID. This allows the element to respond to events.
     * @parameter id The unique identifier for the event to listen for.
     * @parameter callback The function to be executed when the event is triggered.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    on_emit(id: string, callback: (element: this, args: Record<string, any>) => any): this;
    /**
     * {Remove On Event}
     * Removes an event listener for the specified event ID.
     * @parameter id The identifier for the event to remove.
     * @parameter callback The function that was originally registered as the event handler.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    remove_on_event(id: string, callback: (element: this, args: Record<string, any>) => any): this;
    /**
     * {Remove On Events}
     * Removes all event callbacks associated with the given ID.
     * @parameter id The identifier for the events to be removed.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    remove_on_events(id: string): this;
    /**
     * {Timeout}
     * Sets a timeout with optional id and debounce functionality.
     * @parameter delay The time in milliseconds to wait before executing the callback.
     * @parameter callback The function to execute after the timeout.
     * @parameter options Optional settings for the timeout behavior.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    timeout(delay: number, callback: ElementCallback<this>, options?: {
        /** An optional identifier for the timeout. */
        id?: string;
        /** If true, clears the previous timeout with the same id. */
        debounce?: boolean;
    } | null): this;
    /**
     * {Clear Timeout}
     * Clears a cached timeout by its ID. If timeouts are not initialized, they will be set up.
     * @parameter id The ID of the timeout to clear.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    clear_timeout(id: string | number): this;
    private _disabled_cursor?;
    /**
     * {Disable Button}
     * Disables the button element, preventing user interaction.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    disable(): this;
    /**
     * {Enable Button}
     * Enables the button by setting the disabled state to false.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    enable(): this;
    /**
     * {On Click}
     * Sets a click event handler for the element, allowing for optional simulated href behavior.
     * @parameter simulate_href The simulated href to set for the element (for SEO in SPAs).
     * @parameter callback The function to be called when the element is clicked.
     * @returns Returns the instance of the element for chaining when an argument is passed, otherwise returns the current onclick handler.
     * @docs
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
     * {On Click Redirect}
     * Sets up a click event that redirects to the specified URL when triggered.
     * @parameter url The URL to redirect to when the click event occurs.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    on_click_redirect(url: string): this;
    /**
     * {On Scroll}
     * Script to be run when an element's scrollbar is being scrolled.
     * The equivalent of HTML attribute `onscroll`. The first parameter of the callback is the `VElement` object.
     * Returns the attribute value when parameter `value` is `null`.
     * @parameter opts_or_callback Options or callback function to assign for the scroll event.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_scroll(): (EventListener | null);
    on_scroll(opts_or_callback: Function | {
        /** Function to be called on scroll. */
        callback: (element: any, event: Event) => any;
        /** Delay in milliseconds before executing the callback. */
        delay?: number;
    }): this;
    /**
     * {On Resize}
     * Script to be run when the browser window is being resized.
     * This allows for a callback to be executed upon resizing the window.
     * @parameter callback The function to be called when the window is resized.
     * @parameter once If true, the callback will only be executed once after the last resize event.
     * @parameter delay The delay in milliseconds before executing the callback.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    on_window_resize(): null | Function;
    on_window_resize(opts: Function | {
        callback?: Function;
        once?: boolean;
        delay?: number;
    }): this;
    /**
     * {Attachment Drop}
     *
     * Custom on attachment drop event handling.
     * This function sets up event listeners for drag and drop actions.
     * Also pushes the attachment to attribute field `attachments`.
     *
     * When a directory is dropped, all files within the directory are added recursively.
     *
     * @param options Configuration options for the drop event, see {@link Attachment.OnDropOpts} for more information.
     *
     * @returns The instance of the element for chaining.
     *
     * @docs
     */
    on_attachment_drop(options: Attachment.OnDropOpts): this;
    /**
     * Add an attachment to the attachments array, if not already added.
     * @param attachment The attachment to add.
     * @returns The instance of the element for chaining.
     */
    add_attachment(attachment: Attachment): this;
    /**
     * Remove an attachment from the attachments array.
     * @param attachment The attachment to remove.
     * @returns The instance of the element for chaining.
     */
    remove_attachment(attachment: Attachment): this;
    /**
     * {On Appear}
     * Sets a callback to be executed when the element appears in the viewport.
     * @parameter callback_or_opts Can be a callback function or an options object containing callback, repeat, and threshold.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    on_appear<T = this>(callback: OnAppearCallback<T>): this;
    on_appear<T = this>(options: {
        /** The function to call when the element appears. */
        callback: OnAppearCallback<T>;
        /** If true, the callback will be called every time the element appears. */
        repeat?: boolean;
        /** The intersection ratio threshold to trigger the callback. */
        threshold?: number | null;
    }): this;
    /**
     * {On Disappear}
     * Sets up an event listener that triggers a callback when the element disappears from the user's view.
     * @experimental
     * @parameter callback_or_opts Can be a callback function or an options object containing the callback and repeat settings.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    on_disappear<T = this>(callback_or_opts?: ((element: T) => any) | {
        /** The function to call when the element disappears. */
        callback?: (element: T) => any;
        /** Whether to repeat the observation after the callback is triggered. */
        repeat?: boolean;
    }): this;
    /**
     * {On Enter}
     * Sets a callback function to be executed when the Enter key is pressed on input or textarea elements.
     * @parameter callback The function to be called when the Enter key is pressed.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    on_enter(): undefined | ElementKeyboardEvent<this>;
    on_enter(callback: ElementKeyboardEvent<this>): this;
    /**
     * {On Escape}
     * Sets a callback function to be triggered when the Escape key is pressed.
     * @parameter callback The function to be called when the Escape key is pressed.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    on_escape(): undefined | ElementKeyboardEvent<this>;
    on_escape(callback: ElementKeyboardEvent<this>): this;
    /**
     * {On Theme Update}
     * Manages theme update callbacks. If no callback is provided, it returns the current callbacks.
     * @parameter callback A function to be called on theme updates or null to retrieve existing callbacks.
     * @returns Returns the instance of the element for chaining when a callback is provided, or the array of existing callbacks if null is passed.
     * @docs
     */
    on_theme_update(): ThemeUpdateCallback<this>[];
    on_theme_update(callback: ThemeUpdateCallback<this>): this;
    /**
     * {Remove on Theme Update}
     * Removes a callback from the theme update listeners.
     * @parameter callback The callback function to be removed from the listeners.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    remove_on_theme_update(callback: ThemeUpdateCallback<this>): this;
    /**
     * {Remove on Theme Updates}
     * Clears the list of theme update callbacks if they exist.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    remove_on_theme_updates(): this;
    /**
     * {On Render}
     * Manages callbacks that are triggered when the element is added to the body.
     * @parameter callback A function to be called when the element is rendered. If no argument is passed, it returns the current callbacks.
     * @returns When a callback is provided, returns the instance of the element for chaining. If no callback is provided, returns the array of current callbacks.
     * @docs
     */
    on_render(): (ElementCallback<this>)[];
    on_render(callback: ElementCallback<this>): this;
    /**
     * {Remove on Render}
     * Removes a callback from the on render callbacks array and stops observing if empty.
     * @parameter callback The callback function to remove from the on render callbacks.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    remove_on_render(callback: ElementCallback<this>): this;
    /**
     * {Remove On Renders}
     * Clears the on render callbacks and stops observing the element for render events.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    remove_on_renders(): this;
    /**
     * {Is Rendered}
     * Checks whether the element has been rendered or not.
     * @returns Returns true if the element has been rendered, otherwise false.
     * @docs
     */
    is_rendered(): boolean;
    /**
     * {On Load}
     * Registers a callback to be executed when the entire page is fully loaded.
     * Note that this event will not fire if the `window.onload` callback is overwritten.
     * @parameter callback The function to be executed on load.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    on_load(callback: (element: this, args: Record<string, any>) => any): this;
    /**
     * {Remove on Load}
     * Removes a callback function from the "volt.on_load" event.
     * @parameter callback The function to be removed from the event listener.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    remove_on_load(callback: (element: this, args: Record<string, any>) => any): this;
    /**
     * {Remove On Loads}
     * Removes the on_load event listener from the instance.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    remove_on_loads(): this;
    /**
     * {On Resize}
     * Manages callbacks for the resize event. Can retrieve existing callbacks or add new ones.
     * @parameter callback The callback function to be executed on resize events.
     * @returns When a callback is provided, returns the instance for chaining. Otherwise, returns the list of existing resize callbacks.
     * @docs
     */
    on_resize(): (ElementCallback<this>)[];
    on_resize(callback: ElementCallback<this>): this;
    /**
     * {Remove on Resize}
     * Removes a callback from the resize event listeners. If no callbacks remain, it stops observing resize events.
     * @parameter callback The callback function to remove from the resize event listeners.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    remove_on_resize(callback: ElementCallback<this>): this;
    /**
     * {Remove on Resizes}
     * Removes all resize callbacks and stops observing resize events for this element.
     * @parameter callback A callback function to be removed from the resize callbacks.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    remove_on_resizes(): this;
    /**
     * {On Resize Rule}
     * Adds an on resize rule event that executes callbacks based on evaluation changes during a resize event.
     * @note This function adds an `on_resize` callback.
     * @parameter evaluation The function to evaluate if the statement is true, the element node is passed as the first argument.
     * @parameter on_true The callback executed if the statement is true, the element node is passed as the first argument.
     * @parameter on_false The callback executed if the statement is false, the element node is passed as the first argument.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    on_resize_rule(evaluation: (element: this) => boolean, on_true?: ElementCallback<this>, on_false?: ElementCallback<this>): this;
    /**
     * {On Shortcut}
     * Create key shortcuts for the element. This function takes an array of shortcut objects that define the key combinations and their associated actions.
     * @parameter shortcuts The array with shortcuts. Each shortcut object may have various attributes to define the key matching criteria and actions.
     * @returns This function does not return a value.
     * @docs
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
     * {On Mouse Enter}
     * Sets a callback function to be called when the mouse enters the element.
     * @parameter callback The function to be called on mouse enter.
     * @returns When a callback is provided, returns the instance of the element for chaining. If no callback is provided, returns the current callback.
     * @docs
     */
    on_mouse_enter(): ElementMouseEvent<this>;
    on_mouse_enter(callback: ElementMouseEvent<this>): this;
    /**
     * {On Mouse Leave}
     * Sets or retrieves the callback function to be called when the mouse leaves the element.
     * @parameter callback The function to execute when the mouse leaves the element.
     * @returns When an argument is passed this function returns the instance of the element for chaining. Otherwise, it returns the currently set callback function.
     * @docs
     */
    on_mouse_leave(): ElementMouseEvent<this>;
    on_mouse_leave(callback: ElementMouseEvent<this>): this;
    /**
     * {On mouse over and out}
     * Set callbacks for the on mouse over and mouse out events.
     * @parameter mouse_over The mouse over callback.
     * @parameter mouse_out The mouse out callback.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    on_mouse_over_out(mouse_over: ElementMouseEvent<this>, mouse_out: ElementMouseEvent<this>): this;
    /**
     * {First Child}
     * Retrieves the first child of the element.
     * @returns Returns the first child node of the element, or null if there are no children.
     * @docs
     */
    first_child(): Node | null;
    /**
     * {Last Child}
     * Retrieves the last child of the element.
     * @returns Returns the last child node of the element, or null if there are no children.
     * @docs
     */
    last_child(): ChildNode | null;
    /**
     * {Iterate Children}
     * Iterates over the children of an element, executing a handler function for each child.
     * @parameter start The starting index for iteration, or a handler function.
     * @parameter end The ending index for iteration.
     * @parameter handler The function to execute for each child.
     * @returns Returns the result of the handler function if not null, otherwise returns null.
     * @docs
     */
    iterate(start: number | ((child: any, index: number) => any), end?: number, handler?: (child: any, index: number) => any): any;
    /**
     * {Iterate Child Nodes}
     * Iterates over the child nodes of an element, executing a handler function for each node.
     * @parameter start The starting index for iteration, or a handler function.
     * @parameter end The ending index for iteration.
     * @parameter handler The function to execute for each child node.
     * @returns Returns the result of the handler function if not null, otherwise returns null.
     * @docs
     */
    iterate_nodes(start: number | ((node: any, index: number) => any), end?: number, handler?: (node: any, index: number) => any): any;
    /**
     * {Set Default}
     * Sets the current element as the default, allowing for a specific type to be set.
     * @parameter Type The type to set as default, defaults to VElement if null.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    set_default(Type?: any): this;
    /**
     * {Assign}
     * Assigns a function or property to the instance. This allows dynamic property assignment for elements.
     * @parameter name The name of the property or function to assign.
     * @parameter value The value to assign to the property or function.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    assign(name: string, value: any): this;
    /**
     * {Extend}
     * Extends the current instance by adding properties or functions from the provided object.
     * @parameter obj The object containing properties or functions to add to the current instance.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    extend<T extends Record<string, any>>(props: T & ThisType<this & T>): this & T;
    /**
     * {Select Contents}
     * Selects the contents of the object, optionally overwriting existing selections.
     * @parameter overwrite Indicates whether to overwrite the current selection.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    select(overwrite?: boolean): this;
    /**
     * {Is Scrollable}
     * Determines whether the element is scrollable based on its dimensions.
     * @returns Returns true if the element's scroll height or width exceeds its client height or width, indicating it is scrollable.
     * @docs
     */
    is_scrollable(): boolean;
    /**
     * {Is Scrollable X}
     * Checks if the element is scrollable in the horizontal direction by comparing its scroll width with its client width.
     * @returns Returns true if the element is scrollable horizontally, otherwise false.
     * @docs
     */
    is_scrollable_x(): boolean;
    /**
     * {Is Scrollable Y}
     * Checks if the element is scrollable vertically by comparing its scroll height to its client height.
     * @returns Returns true if the element is scrollable in the Y direction, otherwise false.
     * @docs
     */
    is_scrollable_y(): boolean;
    /**
     * {Wait Till Children Rendered}
     * Waits until the element and all its children are fully rendered.
     * This function should only be used in the `on_render` callback.
     * Note that it does not work with non-volt nodes and may not function correctly.
     * @parameter timeout The maximum time to wait for rendering in milliseconds.
     * @returns Returns a promise that resolves when all children are rendered or rejects on timeout.
     * @docs
     */
    wait_till_children_rendered(timeout?: number): Promise<void>;
    /**
     * {Add Pseudo}
     * Adds a pseudo element of a specified type to a node.
     * Ensures that the pseudo element is properly initialized and styled.
     * @parameter type The type of pseudo element to add (e.g., before, after).
     * @parameter node The node to which the pseudo element is added.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    pseudo(type: string, pseudo: PseudoElement): this;
    /**
     * {Remove Pseudo}
     * Remove a pseudo element by the specified node.
     * @parameter node The node from which the pseudo element will be removed.
     * @parameter pseudo_id Identifier for the pseudo element to be removed.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    remove_pseudo(type: string, pseudo: PseudoElement): this;
    /**
     * {Remove Pseudos}
     * Removes all pseudo classes and stylesheets associated with the element.
     * This function iterates through the class list and removes classes that start with "pseudo_".
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    remove_pseudos(): this;
    /**
     * {Add Pseudo Hover}
     * Adds a pseudo element on mouse hover. This function does not work in combination with other mouse over events.
     * @parameter type The type of pseudo element to add.
     * @parameter node The node to which the pseudo element will be applied.
     * @parameter set_defaults A flag to set default values for the node.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    pseudo_on_hover(type: string, pseudo: PseudoElement, set_defaults?: boolean): this;
    /**
     * {Parent}
     * Get or set the parent element of the current element.
     * This is particularly relevant for child elements of specific derived classes.
     * @parameter value The parent element to set or null to retrieve the current parent.
     * @docs
     */
    parent<T = undefined | VElement | HTMLElement>(): T;
    parent(value: any): this;
    /**
     * {Absolute Parent}
     * Sets or gets the absolute parent of the custom element.
     * When called without arguments, it returns the current absolute parent;
     * when called with an argument, it sets the absolute parent and returns the instance for chaining.
     * @parameter value The absolute parent to set.
     * @docs
     */
    abs_parent<T = undefined | VElement | HTMLElement>(): T;
    abs_parent(value: any): this;
    /**
     * {Assign to Parent As}
     * Assigns the current element to a specified attribute of the parent element.
     * @deprecated
     * @parameter name The name of the attribute to assign the current element to.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    assign_to_parent_as(name: string): this;
    /**
     * {Get Y Offset From Parent}
     * Calculates the vertical offset of the current node relative to a specified parent node.
     * @deprecated
     * @parameter parent The parent node from which to calculate the offset.
     * @returns Returns the accumulated vertical offset from the current node to the parent node, or null if the parent wasn't found.
     * @docs
     */
    get_y_offset_from_parent(parent: HTMLElement): number | null;
    /**
     * {Absolute Y Offset}
     * Calculates the absolute vertical offset of the element from the top of the document.
     * @returns Returns the absolute Y offset in pixels.
     * @docs
     */
    absolute_y_offset(): number;
    /**
     * {Absolute X Offset}
     * Calculates the absolute X offset of the current element in relation to its offset parents.
     * @returns Returns the total left offset in pixels as a number.
     * @docs
     */
    absolute_x_offset(): number;
    /**
     * {Exec}
     * Executes a provided function with the current element as its parameter.
     * @parameter callback A function to execute with the current element.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    exec(callback: ElementCallback<this>): this;
    /**
     * {Is child}
     * Check if an element is a direct child of the element or the element itself.
     * @parameter target The target element to test.
     * @returns Returns true if the target is a direct child, otherwise false.
     * @docs
     */
    is_child(target: any): boolean;
    /**
     * {Is Child}
     * Checks if an element is a recursively nested child of the element or the element itself.
     * @parameter target The target element to test.
     * @parameter stop_node A node at which to stop checking if target is a parent of the current element.
     * @returns Returns true if the target is a nested child, otherwise false.
     * @docs
     */
    is_nested_child(target: any, stop_node?: any): boolean;
    /**
     * {To String}
     * Converts the current element to its string representation, setting an attribute in the process.
     * @returns Returns the outer HTML of the element as a string.
     * @docs
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
    hyphens(value: string): this;
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
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
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
     * @returns Returns the `VElement` object when a value is set. If `null`, returns the attribute's value.
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
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
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
    span(): null | number;
    span(value: number): this;
    spell_check(): boolean;
    spell_check(value: boolean): this;
    /**
     * {Src}
     * Specifies the URL of the media file, equivalent to the HTML attribute `src`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
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
