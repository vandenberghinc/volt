import { VElementBaseSignature } from "../elements/module.js";
import { VStackElement } from "./stack";
export declare namespace SliderElement {
    type OnChangeCallback<This> = (element: This, value: number) => void;
}
declare const SliderElement_base: VElementBaseSignature;
export declare class SliderElement extends SliderElement_base {
    _type: string;
    _value: number;
    _enabled_color: string;
    _disabled_color: string;
    slider: VStackElement;
    button: VStackElement;
    dragging: boolean;
    protected slider_on_mouse_down_handler: any;
    protected on_mouse_down_handler: any;
    protected on_mouse_move_handler: any;
    protected on_mouse_up_handler: any;
    protected on_change_handler: any;
    protected rect?: DOMRect;
    protected button_rect?: DOMRect;
    protected slider_rect?: DOMRect;
    constructor(value?: number);
    set_default(): this;
    enabled_color(): string;
    enabled_color(value: string): this;
    disabled_color(): string;
    disabled_color(value: string): this;
    on_change(): SwitchElement.OnChangeCallback<this>;
    on_change(handler: SwitchElement.OnChangeCallback<this>): this;
    value(): number;
    value(value: number): this;
}
export declare const Slider: <Extensions extends object = {}>(value?: number | undefined) => SliderElement & Extensions;
export declare const NullSlider: <Extensions extends object = {}>() => SliderElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        SliderElement: SliderElement;
    }
}
export {};
