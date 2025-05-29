import { VStackElement } from "./stack";
export declare class SliderElement extends VStackElement {
    _type: string;
    _value: number;
    _enabled_color: string;
    _disabled_color: string;
    slider: VStackElement;
    button: VStackElement;
    protected slider_on_mouse_down_handler: any;
    protected on_mouse_down_handler: any;
    protected on_mouse_move_handler: any;
    protected on_mouse_up_handler: any;
    constructor(value?: number);
    set_default(): this;
    enabled_color(): string;
    enabled_color(value: string): this;
    disabled_color(): string;
    disabled_color(value: string): this;
    on_change(): ((element: SliderElement, value: number) => void);
    on_change(handler: ((element: SliderElement, value: number) => void)): this;
    value(): number;
    value(value: number): this;
}
export declare const Slider: (...args: any[]) => any;
