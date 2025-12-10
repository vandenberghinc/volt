/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
import * as vlib from "@vandenberghinc/vlib/frontend";
import { VElementBaseSignature, VElementTagMap, ElementKeyboardEvent, ElementEvent } from "../elements/module.js";
import { HStackElement } from "./stack.js";
import { TextElement } from "./text.js";
import { ImageMaskElement } from "./image.js";
import { GradientBorderElement } from "./gradient.js";
import { ScrollerElement } from "./scroller.js";
import { ValueOrThis } from "../elements/types.js";
export declare class InputElement extends VElementTagMap.input {
    private _e;
    constructor(placeholder?: string, type?: string, value?: string);
    value(): string;
    value(val: string | number): this;
    required(): boolean;
    required(val: boolean): this;
    type(): string;
    type(val: string): this;
    placeholder(): string;
    placeholder(val: string): this;
    resize(): string;
    resize(val: string): this;
    padding(): string;
    padding(value: undefstrnr): this;
    padding(top_bottom: undefstrnr, left_right: undefstrnr): this;
    padding(top: undefstrnr, right: undefstrnr, bottom: undefstrnr, left: undefstrnr): this;
}
export declare const Input: <Extensions extends object = {}>(placeholder?: string | undefined, type?: string | undefined, value?: string | undefined) => InputElement & Extensions;
export declare const NullInput: <Extensions extends object = {}>() => InputElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        InputElement: InputElement;
    }
}
export declare class InputBoxElement extends VElementTagMap.textarea {
    _e?: HTMLTextAreaElement;
    constructor(placeholder?: string);
    value(): string;
    value(val: string | number): this;
    required(): boolean;
    required(val: boolean): this;
    type(): string;
    type(val: string): this;
    placeholder(): string;
    placeholder(val: string): this;
    resize(): string;
    resize(val: string): this;
    padding(): string;
    padding(value: undefstrnr): this;
    padding(top_bottom: undefstrnr, left_right: undefstrnr): this;
    padding(top: undefstrnr, right: undefstrnr, bottom: undefstrnr, left: undefstrnr): this;
}
export declare const InputBox: <Extensions extends object = {}>(placeholder?: string | undefined) => InputBoxElement & Extensions;
export declare const NullInputBox: <Extensions extends object = {}>() => InputBoxElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        InputBoxElement: InputBoxElement;
    }
}
/** Nested types for the {@link ExtendedInputElement} class. */
export declare namespace ExtendedInputElement {
    interface Opts {
        /** Label text. */
        label?: string | {
            /** The label text. */
            text: string;
            /**
             * The label color.
             * @default "inherit"
             */
            color?: string;
            /**
             * The label font size.
             * @default "inherit"
             */
            font_size?: string | number;
            /**
             * Spacing between the label and the input field.
             * @default 7.5 | 12.5
             */
            spacing?: string | number;
            /**
             * Enable wrapping behaviour, by default the label will have an ellipsis overflow behaviour.
             * @default false
             */
            wrap?: boolean;
            /**
             * The max width of the text label.
             * @default "100%"
             */
            max_width?: string | number;
        };
        /** Placeholder text. */
        placeholder?: string;
        /** Input field ID. */
        id?: string;
        /** Whether the input is read-only. */
        readonly?: boolean;
        /** Whether the input is required. */
        required?: boolean;
        /** Input type. */
        type?: string;
        /** Initial value. */
        value?: string;
        /** Input options. */
        input?: {
            /** Input field padding. */
            padding?: string | number[];
            /** Input field background color. */
            background?: string;
            /** The height of the input node, useful when `type` is `box`. */
            height?: number;
            /** Options for configuring a border. */
            border?: {
                /** Default color. */
                color?: string;
                /** Hover color. */
                hover?: string;
                /** Focused color. */
                focused?: string;
                /** Missing color. */
                missing?: string;
                /**
                 *  Border width.
                 * @default 1px
                 */
                width?: string | number;
                /**
                 * Border radius.
                 * @default 0
                 */
                radius?: string | number;
                /**
                 * Border type, either full for all sides or `bottom` for only a bottom border.
                 * @default "full"
                 */
                type?: "full" | "bottom";
            };
        };
        /** Left image url or options. */
        image?: string | {
            /** Image URL. */
            url: string;
            /** Image size. */
            size?: number | string;
            /** Image color. */
            color?: string;
            /** Image alt text. */
            alt?: string;
        };
        /** Add copy functionality */
        copy?: {
            /** Image url. */
            url: string;
            /** Image alt. */
            alt?: string;
            /** Image size. */
            size?: number | string;
            /** Image color. */
            color?: string;
            /** Image hover color. */
            hover?: string;
            /**
             * On click event.
             * By default this button does nog copy the current value to the clipboard.
             * This functionality can be added manually here, see {@link Utils.copy_to_clipboard}.
             */
            on_click?: (val: string) => void | Promise<void>;
        };
        /** Validation options. */
        validate?: vlib.Schema.Entry;
    }
}
declare const ExtendedInputElement_base: VElementBaseSignature;
export declare class ExtendedInputElement extends ExtendedInputElement_base {
    private copy_opts;
    private input_opts;
    /** The label node, always defined even when `opts.label` is undefined, so the user can still style it. */
    label: TextElement;
    /** The left image element created by the `opts.image` field. */
    image: undefined | ImageMaskElement;
    /** The clickable copy node created by the `opts.copy` field. */
    copyable: undefined | ImageMaskElement;
    /** The input element created by the `opts.input` field. */
    input: (InputElement | InputBoxElement);
    /** The (gradient) border element used for the input field. */
    input_border: GradientBorderElement;
    /** The container element for the input field. */
    container: HStackElement;
    /** The error text element shown when the input is marked as missing. */
    error_text: TextElement;
    /** Has error state. */
    has_error: boolean;
    /** Is focused state. */
    is_focused: boolean;
    /** Validation options. */
    private validation_entry;
    constructor({ label, image, placeholder, id, readonly, required, type, value, copy, input, validate, }: ExtendedInputElement.Opts);
    /** Helper to set the border color. */
    private _set_border_color;
    focus_color<V extends string | undefined = undefined>(val?: V): ValueOrThis<V, string, this>;
    set_default(): this;
    /**
     * Set the error state and message.
     * Providing a truthy value will enable the error state and return the current instance for chaining.
     * Providing a falsy value will disable the error state and return the current instance for chaining.
     * Providing no value will return the current error message or `undefined` when no error is set.
     */
    error<V extends undefined | false | string = undefined>(err?: V): ValueOrThis<V, string | undefined, this>;
    /** Remove the error state and mark as valid. */
    valid(): this;
    /** Submit the item, throws an error when the item is not defined. */
    submit(): string;
    readonly(): boolean;
    readonly(val: boolean): this;
    text(): string;
    text(val: string): this;
    value(): string;
    value(val: string): this;
    required(): boolean;
    required(val: boolean): this;
    on_enter(): undefined | ElementKeyboardEvent<this>;
    on_enter(val: ElementKeyboardEvent<this>): this;
    on_input(): undefined | ElementEvent<this>;
    on_input(val: ElementEvent<this>): this;
    background(): string;
    background(val: string): this;
    padding(): string;
    padding(value: undefstrnr): this;
    padding(top_bottom: undefstrnr, left_right: undefstrnr): this;
    padding(top: undefstrnr, right: undefstrnr, bottom: undefstrnr, left: undefstrnr): this;
}
export declare const ExtendedInput: <Extensions extends object = {}>(args_0: ExtendedInputElement.Opts) => ExtendedInputElement & Extensions;
export declare const NullExtendedInput: <Extensions extends object = {}>() => ExtendedInputElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        ExtendedInputElement: ExtendedInputElement;
    }
}
interface ExtendedSelectItem {
    id: string;
    text?: string;
    image?: null;
    stack?: HStackElement;
}
type ExtendedSelectOnChange = (element: ExtendedSelectElement, id: string) => any;
/** Nested types for the {@link ExtendedSelectElement} class. */
export declare namespace ExtendedSelectElement {
    interface Opts {
        /** Label text. */
        label?: string;
        /** Placeholder text. */
        placeholder?: string;
        /** Input field ID. */
        id?: string;
        /** Whether the input is required. */
        required?: boolean;
        /** The selectable items. */
        items: ExtendedSelectItem[] | Record<string, string> | Record<string, ExtendedSelectItem>;
        /** Input options. */
        input?: {
            /** Input field padding. */
            padding?: string | number[];
            /** Input field background color. */
            background?: string;
            /** Options for configuring a border. */
            border?: {
                /** Default color. */
                color?: string;
                /** Hover color. */
                hover?: string;
                /** Focused color. */
                focused?: string;
                /** Missing color. */
                missing?: string;
                /**
                 *  Border width.
                 * @default 1px
                 */
                width?: string | number;
                /**
                 * Border radius.
                 * @default 0
                 */
                radius?: string | number;
                /**
                 * Border type, either full for all sides or `bottom` for only a bottom border.
                 * @default "full"
                 */
                type?: "full" | "bottom";
            };
        };
        /** Left image url or options. */
        image?: string | {
            /** Image URL. */
            url: string;
            /** Image size. */
            size?: number | string;
            /** Image color. */
            color?: string;
            /** Image alt text. */
            alt?: string;
        };
        /** The hover background color of item containers inside the dropdown. */
        dropdown?: {
            hover?: string;
        };
    }
}
declare const ExtendedSelectElement_base: VElementBaseSignature;
export declare class ExtendedSelectElement extends ExtendedSelectElement_base {
    /** The selectable items. */
    items: ExtendedSelectItem[];
    /** The label node. */
    label: TextElement;
    /** The image node. */
    image: undefined | ImageMaskElement;
    /** The input node (readonly) with the selected value. */
    input: InputElement;
    /** The container node. */
    container: HStackElement;
    /** The error text node. */
    error_text: TextElement;
    /** The dropdown scroller element. */
    dropdown: ScrollerElement;
    /** Has error state. */
    has_error: boolean;
    /** Is focused state. */
    is_focused: boolean;
    private input_opts;
    private image_opts;
    private _dropdown_item_hover;
    private _on_change_callback?;
    private _on_dropdown_close;
    private _dropdown_height?;
    private _value?;
    constructor({ label, image, placeholder, id, required, items, // may also be an array with strings which will be used as the item's id and text.
    dropdown, input, }: ExtendedSelectElement.Opts);
    /** Helper to set the border color. */
    private _set_border_color;
    /** Set the focus color. */
    focus_color(): string;
    focus_color(val: string): this;
    /** Set the error color. */
    error_color(): string;
    error_color(val: string): this;
    /** Set dropdown height. */
    dropdown_height(): undefined | string | number;
    dropdown_height(val: string | number): this;
    /** Set default since it inherits an element. */
    set_default(): this;
    /**
     * Set the error state and message.
     * Providing a truthy value will enable the error state and return the current instance for chaining.
     * Providing a falsy value will disable the error state and return the current instance for chaining.
     * Providing no value will return the current error message or `undefined` when no error is set.
     */
    error<V extends undefined | false | string = undefined>(err?: V): ValueOrThis<V, string | undefined, this>;
    /** Remove the error state and mark as valid. */
    valid(): this;
    /** Submit the item, throws an error when the item is not defined. */
    submit(): string;
    /** Expand dropdown. */
    expand(): this;
    /** Get or set the value, when it is being set it should be the id of one of the items otherwise nothing happens. */
    value(): string;
    value(val: string): this;
    /** Set or get the background color. */
    background(): string;
    background(val: string): this;
    padding(): string;
    padding(value: undefstrnr): this;
    padding(top_bottom: undefstrnr, left_right: undefstrnr): this;
    padding(top: undefstrnr, right: undefstrnr, bottom: undefstrnr, left: undefstrnr): this;
    on_change(): undefined | ExtendedSelectOnChange;
    on_change(callback: ExtendedSelectOnChange): this;
    text(): string;
    text(val: string): this;
    required(): boolean;
    required(val: boolean): this;
}
export declare const ExtendedSelect: <Extensions extends object = {}>(args_0: ExtendedSelectElement.Opts) => ExtendedSelectElement & Extensions;
export declare const NullExtendedSelect: <Extensions extends object = {}>() => ExtendedSelectElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        ExtendedSelectElement: ExtendedSelectElement;
    }
}
export {};
