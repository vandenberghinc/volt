/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
import { VElementTagMap } from "../elements/module.js";
import { GradientType } from "../types/gradient.js";
/**
 * A point in 2D space used for drawing lines.
 * Optional `tension` overrides curve smoothing for that segment.
 */
type PointObject = {
    x: number;
    y: number;
    tension?: number;
};
/**
 * Canvas element.
 * @nav Frontend/Elements
 * @experimental true
 * @warning This class is still experimental and may be subject to future change.
 * @docs
 */
export declare class CanvasElement extends VElementTagMap.canvas {
    _e: any;
    ctx_2d: any;
    /**
     * Initialize the canvas element and, on Safari, create a shadow DOM
     * canvas to work around rendering issues.
     */
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
    /**
     * Get a rendering context for the canvas.
     * In Safari, forwards to the shadow canvas element.
     * @param args Arguments forwarded to `HTMLCanvasElement.getContext`.
     * @returns The rendering context.
     */
    getContext(...args: any[]): any;
    /**
     * Draw a smoothed path through the given points on the provided context.
     * Uses a Catmull–Rom style bezier approximation controlled by `tension`.
     * @param ctx Canvas 2D context.
     * @param points Ordered list of points to draw through.
     * @param tension Optional smoothing factor; 0 for straight segments.
     * @returns this
     */
    draw_lines(ctx: any, points?: PointObject[], tension?: number): this;
    /**
     * Create a canvas gradient from a `GradientType` definition.
     * Supports linear and (placeholder) radial gradients.
     * @param ctx Canvas 2D context.
     * @param gradient The gradient definition (`GradientType`).
     * @param start_x Start x coordinate.
     * @param start_y Start y coordinate.
     * @param end_x End x coordinate.
     * @param end_y End y coordinate.
     * @returns The created gradient or null when invalid.
     */
    create_gradient(ctx: any, gradient: GradientType, start_x: number, start_y: number, end_x: number, end_y: number): any;
    /**
     * Create a line, optionally curved and with custom styling.
     * @returns Returns the `Canvas` object.
     * @param points The line points, an array with objects with `x` and `y` values.
     * @param tension The smoothness of the line, use `null` or `0` for a straight line and {0.0, 2.0} for a smooth line.
     * @param color The line color.
     * @param width The line width in pixels.
     * @param fill The fill color, supports a `GradientType` class. leave `null` to ignore.
     * @param scale When enabled all x and y coordinates are treated as a 0.0 till 1.0 scale in relation to the canvas' width and height.
     * @param dots Place dots at each coordinate, leave `null` to ignore.
     * @param dots.width Dot width in pixels when `scale` is `false`, and dot width in percentage `{0.0,1.0}` when `scale` is `true`.
     * @param dots.color Fill color.
     * @docs
     */
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
    /**
     * Clear the entire canvas.
     * @returns this
     */
    clear(): this;
    /**
     * Get or set the shadow color used for drawing operations.
     * @param val The CSS color value.
     * @returns The current shadow color or this.
     */
    shadow_color(): string;
    shadow_color(val: string): this;
    /**
     * Get or set the shadow blur radius.
     * @param val The blur amount.
     * @returns The current shadow blur or this.
     */
    shadow_blur(): string;
    shadow_blur(val: string): this;
    /**
     * Get or set the horizontal shadow offset.
     * @param val The offset value.
     * @returns The current shadow offset X or this.
     */
    shadow_offset_x(): string;
    shadow_offset_x(val: number | string): this;
    /**
     * Get or set the vertical shadow offset.
     * @param val The offset value.
     * @returns The current shadow offset Y or this.
     */
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
