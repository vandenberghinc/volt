import { VElementBaseSignature } from "../elements/module.js";
import { HStackElement } from "./stack";
import { TextElement } from "./text";
declare const CheckBoxElement_base: VElementBaseSignature;
export declare class CheckBoxElement extends CheckBoxElement_base {
    _border_color: string;
    _inner_bg: string;
    _focus_color: string;
    _missing_color: string;
    _missing: boolean;
    _required: boolean;
    private _circle;
    text: TextElement;
    content: HStackElement;
    error: TextElement;
    constructor(text_or_obj?: string | {
        text: string;
        required: boolean;
        id?: string;
    });
    border_color(): string;
    border_color(val: string): this;
    inner_bg(): string;
    inner_bg(val: string): this;
    styles(): Record<string, string>;
    styles(style_dict: Record<string, any>): this;
    set_default(): this;
    toggle(): this;
    value(): boolean;
    value(to: boolean): this;
    required(): boolean;
    required(to: boolean): this;
    focus_color(): string;
    focus_color(val: string): this;
    missing_color(): string;
    missing_color(val: string): this;
    missing(): boolean;
    missing(to: boolean): this;
    submit(): boolean;
}
export declare const CheckBox: <Extensions extends object = {}>(text_or_obj?: string | {
    text: string;
    required: boolean;
    id?: string;
} | undefined) => CheckBoxElement & Extensions;
export declare const NullCheckBox: <Extensions extends object = {}>() => CheckBoxElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        CheckBoxElement: CheckBoxElement;
    }
}
export {};
