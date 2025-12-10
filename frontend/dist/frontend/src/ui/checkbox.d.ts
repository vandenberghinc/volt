/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
import { VElementBaseSignature, ValueOrThis } from "../elements/module.js";
import { VStackElement, HStackElement } from "./stack.js";
import { TextElement } from "./text.js";
interface CircleExtension {
    enabled: boolean;
    toggle(): this;
    value(to?: boolean): this;
    inner: VStackElement;
}
declare const CheckBoxElement_base: VElementBaseSignature;
export declare class CheckBoxElement extends CheckBoxElement_base {
    /** Has error state. */
    has_error: boolean;
    _border_color: string;
    _inner_bg: string;
    _inner_bg_focused: string;
    _focus_color: string;
    _error_color: string;
    _required: boolean;
    _circle: VStackElement & CircleExtension;
    text: TextElement;
    container: HStackElement;
    error_text: TextElement;
    constructor(text_or_obj?: string | {
        text: string;
        required: boolean;
        id?: string;
    });
    border_color(): string;
    border_color(val: string): this;
    inner_bg(): string;
    inner_bg(val: string): this;
    inner_bg_focused(): string;
    inner_bg_focused(val: string): this;
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
    /** Set the missing color. */
    error_color(): string;
    error_color(val: string): this;
    /**
     * Set the error state and message.
     * Providing a truthy value will enable the error state and return the current instance for chaining.
     * Providing a falsy value will disable the error state and return the current instance for chaining.
     * Providing no value will return the current error message or `undefined` when no error is set.
     */
    error<V extends undefined | false | string = undefined>(err?: V): ValueOrThis<V, string | undefined, this>;
    /** Remove the error state and mark as valid. */
    valid(): this;
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
