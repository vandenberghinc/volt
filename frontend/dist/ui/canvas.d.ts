import { VElementTagMap } from "../elements/module.js";
import { GradientType } from "../types/gradient.js";
type PointObject = {
    x: number;
    y: number;
    tension?: number;
};
export declare class CanvasElement extends VElementTagMap.canvas {
    _e: any;
    ctx_2d: any;
    constructor();
    height(): string | number;
    height(value: string | number, check_attribute?: boolean): this;
    min_height(): string | number;
    min_height(value: string | number): this;
    max_height(): string;
    max_height(value: string | number): this;
    width(): string | number;
    width(value: string | number, check_attribute?: boolean): this;
    min_width(): string | number;
    min_width(value: string | number): this;
    max_width(): string;
    max_width(value: string | number): this;
    getContext(...args: any[]): any;
    draw_lines(ctx: any, points?: PointObject[], tension?: number): this;
    create_gradient(ctx: any, gradient: GradientType, start_x: number, start_y: number, end_x: number, end_y: number): any;
    lines({ points, tension, color, width, fill, scale, dots, }: {
        points: PointObject[];
        tension?: number;
        color?: string;
        width?: number;
        fill?: string | GradientType;
        scale?: boolean;
        dots?: {
            width?: number;
            color?: string | GradientType;
        };
    }): this;
    clear(): this;
    shadow_color(): string;
    shadow_color(val: string): this;
    shadow_blur(): string;
    shadow_blur(val: string): this;
    shadow_offset_x(): string;
    shadow_offset_x(val: number | string): this;
    shadow_offset_y(): string;
    shadow_offset_y(val: number | string): this;
}
export declare const Canvas: <Extensions extends object = {}>() => CanvasElement & Extensions;
export declare const NullCanvas: <Extensions extends object = {}>() => CanvasElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        CanvasElement: CanvasElement;
    }
}
export {};
