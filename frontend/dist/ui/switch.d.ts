import { VStackElement } from "./stack";
export declare namespace SwitchElement {
    type OnChangeCallback<This> = (element: This, enabled: boolean) => void;
}
export interface SwitchElement extends Omit<VStackElement, "value"> {
    value(): boolean;
    value(value: boolean, animate?: boolean): this;
}
export declare class SwitchElement extends VStackElement {
    on_change_handler: SwitchElement.OnChangeCallback<this>;
    _enabled: boolean;
    _enabled_color: string;
    _disabled_color: string;
    enabled: boolean;
    slider: VStackElement;
    button: VStackElement;
    _value_timeout: any;
    constructor(enabled?: boolean);
    set_default(): this;
    width(): number | string;
    width(value: number | string): this;
    min_width(): number | string;
    min_width(value: number | string): this;
    max_width(): number | string;
    max_width(value: number | string): this;
    height(): number | string;
    height(value: number | string): this;
    min_height(): number | string;
    min_height(value: number | string): this;
    max_height(): number | string;
    max_height(value: number | string): this;
    frame(width?: number | string, height?: number | string): this;
    min_frame(width?: number | string, height?: number | string): this;
    max_frame(width?: number | string, height?: number | string): this;
    background(): string;
    background(value: string): this;
    enabled_color(): string;
    enabled_color(value: string): this;
    disabled_color(): string;
    disabled_color(value: string): this;
    toggle(): this;
    value(): boolean;
    value(value: boolean, animate?: boolean): this;
    on_change(): SwitchElement.OnChangeCallback<this>;
    on_change(handler: SwitchElement.OnChangeCallback<this>): this;
}
export declare const Switch: <Extensions extends object = {}>(enabled?: boolean | undefined) => SwitchElement & Extensions;
export declare const NullSwitch: <Extensions extends object = {}>() => SwitchElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        SwitchElement: SwitchElement;
    }
}
