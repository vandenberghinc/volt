/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
import { VElementTagMap } from "../elements/module.js";
/**
 * The ring loader element.
 * @chapter Frontend
 * @docs
 */
export declare class RingLoaderElement extends VElementTagMap.div {
    /**
     * Create a new ring loader element and initialize it with default styles, then call `update()` to render.
     */
    constructor();
    /**
     * Background.
     *
     * Set the background value. Returns the attribute value when parameter `value` is `null`.
     * @note Dont forget to update the loader through `update()` after calling this function.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `RingLoaderElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    background(): string;
    background(value: string): this;
    /**
     * Get or set the color, which maps to the internal `--child-background` style variable.
     * @param value The color to assign. Leave `null`/`undefined` to retrieve the current value.
     * @returns Returns the `RingLoaderElement` object for chaining unless parameter `value` is `null`/`undefined`, then the current value is returned.
     */
    color(): string;
    color(value: string): this;
    /**
     * Set the border width by factor.
     * @note Dont forget to update the loader through `update()` after calling this function.
     * @param value The float border width factor.
     * @docs
     */
    border_width_factor(): number;
    border_width_factor(value: number): this;
    /**
     * Update the loader, this function needs to be called after initialization or after changing the frame, background or border.
     * @docs
     */
    update(): this;
}
export declare const RingLoader: <Extensions extends object = {}>() => RingLoaderElement & Extensions;
export declare const NullRingLoader: <Extensions extends object = {}>() => RingLoaderElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        RingLoaderElement: RingLoaderElement;
    }
}
export declare const SpinnerElement: typeof RingLoaderElement;
export declare const SpinnerLoader: <Extensions extends object = {}>() => RingLoaderElement & Extensions;
export declare const NullSpinnerLoader: <Extensions extends object = {}>() => RingLoaderElement & Extensions;
