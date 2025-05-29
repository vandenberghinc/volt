import { VElementBaseSignature, VElementTagMap, ElementKeyboardEvent, ElementEvent } from "../elements/module.js";
import { HStackElement } from "./stack";
import { TextElement } from "./text";
import { ImageMaskElement } from "./image";
import { GradientBorderElement } from "./gradient";
import { ScrollerElement } from "./scroller";
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
declare const ExtendedInputElement_base: VElementBaseSignature;
export declare class ExtendedInputElement extends ExtendedInputElement_base {
    private _focus_color;
    private _missing_color;
    private _mask_color;
    private _initial_border_color;
    private _hover_border_color;
    label: TextElement;
    image: ImageMaskElement;
    input: (InputElement | InputBoxElement);
    input_border: GradientBorderElement;
    container: HStackElement;
    error: TextElement;
    is_missing: boolean;
    is_focused: boolean;
    constructor({ label, image, alt, placeholder, id, readonly, required, type, value, }: {
        label?: string;
        image?: string;
        alt?: string;
        placeholder?: string;
        id?: string;
        readonly?: boolean;
        required?: boolean;
        type?: string;
        value?: string;
    });
    styles(): Record<string, string>;
    styles(style_dict: Record<string, any>): this;
    set_default(): this;
    focus_color(): string;
    focus_color(val: string): this;
    missing_color(): string;
    missing_color(val: string): this;
    missing(): boolean;
    missing(to: boolean, err?: string): this;
    set_error(err?: string): this;
    submit(): string;
    mask_color(): string;
    mask_color(val: string): this;
    show_error(err?: string): this;
    hide_error(): this;
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
    border_radius(): string;
    border_radius(val: string): this;
    border_color(): string;
    border_color(val: string): this;
    hover_border_color(): string;
    hover_border_color(val: string): this;
    border_width(): string;
    border_width(val: string): this;
    border_style(): string;
    border_style(val: string): this;
    background(): string;
    background(val: string): this;
    padding(): string;
    padding(value: undefstrnr): this;
    padding(top_bottom: undefstrnr, left_right: undefstrnr): this;
    padding(top: undefstrnr, right: undefstrnr, bottom: undefstrnr, left: undefstrnr): this;
    border(): string;
    border(value: string): this;
    border(width: string | number, color: string): this;
    border(width: string | number, style: string, color: string): this;
}
export declare const ExtendedInput: <Extensions extends object = {}>(args_0: {
    label?: string;
    image?: string;
    alt?: string;
    placeholder?: string;
    id?: string;
    readonly?: boolean;
    required?: boolean;
    type?: string;
    value?: string;
}) => ExtendedInputElement & Extensions;
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
declare const ExtendedSelectElement_base: VElementBaseSignature;
export declare class ExtendedSelectElement extends ExtendedSelectElement_base {
    _focus_color: string;
    _missing_color: string;
    _mask_color: string;
    _border_color: string;
    _hover_bg: string;
    items: ExtendedSelectItem[];
    label: TextElement;
    image: ImageMaskElement;
    input: InputElement;
    container: HStackElement;
    error: TextElement;
    dropdown: ScrollerElement;
    is_missing: boolean;
    _on_change_callback?: ExtendedSelectOnChange;
    private _on_dropdown_close;
    _dropdown_height?: string | number;
    _value?: string;
    constructor({ label, image, alt, placeholder, id, required, items, }: {
        label?: string;
        image?: string;
        alt?: string;
        placeholder?: string;
        id?: string;
        required?: boolean;
        items: ExtendedSelectItem[] | Record<string, string> | Record<string, ExtendedSelectItem>;
    });
    dropdown_height(): undefined | string | number;
    dropdown_height(val: string | number): this;
    styles(): Record<string, string>;
    styles(style_dict: Record<string, any>): this;
    set_default(): this;
    focus_color(): string;
    focus_color(val: string): this;
    missing_color(): string;
    missing_color(val: string): this;
    missing(): boolean;
    missing(to: boolean, err?: string): this;
    set_error(err?: string): this;
    submit(): string;
    expand(): this;
    value(): string;
    value(val: string): this;
    mask_color(): string;
    mask_color(val: string): this;
    background(): string;
    background(val: string): this;
    border_radius(): string;
    border_radius(val: string | number): this;
    border_color(): string;
    border_color(val: string): this;
    border_width(): string;
    border_width(val: number | string): this;
    border_style(): string;
    border_style(val: string): this;
    padding(): string;
    padding(value: undefstrnr): this;
    padding(top_bottom: undefstrnr, left_right: undefstrnr): this;
    padding(top: undefstrnr, right: undefstrnr, bottom: undefstrnr, left: undefstrnr): this;
    border(): string;
    border(value: string): this;
    border(width: string | number, color: string): this;
    border(width: string | number, style: string, color: string): this;
    on_change(): undefined | ExtendedSelectOnChange;
    on_change(callback: ExtendedSelectOnChange): this;
    text(): string;
    text(val: string): this;
    required(): boolean;
    required(val: boolean): this;
}
export declare const ExtendedSelect: <Extensions extends object = {}>(args_0: {
    label?: string;
    image?: string;
    alt?: string;
    placeholder?: string;
    id?: string;
    required?: boolean;
    items: ExtendedSelectItem[] | Record<string, string> | Record<string, ExtendedSelectItem>;
}) => ExtendedSelectElement & Extensions;
export declare const NullExtendedSelect: <Extensions extends object = {}>() => ExtendedSelectElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        ExtendedSelectElement: ExtendedSelectElement;
    }
}
export {};
