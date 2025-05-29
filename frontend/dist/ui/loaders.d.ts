import { VElementTagMap } from "../elements/module.js";
/**
 * @docs:
 * @chapter: Frontend
 * @title: Ring Loader
 * @desc:
 * 		The ring loader element.
 */
export declare class RingLoaderElement extends VElementTagMap.div {
    constructor();
    /**
     * @docs:
     * @title: Backround
     * @desc:
     * 		Set the background value.
     *		Returns the attribute value when parameter `value` is `null`.
     * @note: Dont forget to update the loader through `update()` after calling this function.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `RingLoaderElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    background(): string;
    background(value: string): this;
    color(): string;
    color(value: string): this;
    /**
     * @docs:
     * @title: Border width by factor
     * @desc: Set the border width by factor.
     * @note: Dont forget to update the loader through `update()` after calling this function.
     * @param:
     * 		@name: number
     * 		@descr: The float border width factor.
     * @funcs: 2
     */
    border_width_factor(): number;
    border_width_factor(value: number): this;
    /**
     * @docs:
     * @title: Update
     * @desc: Update the loader, this function needs to be called after initialization or after changing the frame, background or border.
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
