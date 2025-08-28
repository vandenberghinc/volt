import { VElementTagMap } from "../elements/module.js";
import { GradientType } from "../types/gradient.js";
export { GradientType };
export declare const Gradient: <Extensions extends object = {}>(type: string, ...colors: string[]) => GradientType & Extensions;
export declare const NullGradient: <Extensions extends object = {}>() => GradientType & Extensions;
export declare class GradientBorderElement extends VElementTagMap.div {
    constructor();
    border_color(): string;
    border_color(val: string): this;
    border_width(): string;
    border_width(value: number | string): this;
}
export declare const GradientBorder: <Extensions extends object = {}>() => GradientBorderElement & Extensions;
export declare const NullGradientBorder: <Extensions extends object = {}>() => GradientBorderElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        GradientBorderElement: GradientBorderElement;
    }
}
