import { VStackElement, HStackElement } from "./stack";
import { TextElement } from "./text";
export declare class CheckBoxElement extends VStackElement {
    static default_style: {
        color: string;
        "font-size": string;
        "--circle-border-color": string;
        "--circle-inner-bg": string;
        "--focus-color": string;
        "--missing-color": string;
    };
    _border_color: string;
    _inner_bg: string;
    _focus_color: string;
    _missing_color: string;
    _missing: boolean;
    _required: boolean;
    circle: VStackElement;
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
export declare const CheckBox: (...args: any[]) => any;
