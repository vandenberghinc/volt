/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
import { VElementBaseSignature } from "../elements/module.js";
import { VStackElement, HStackElement } from "./stack.js";
import { DividerElement } from "./divider.js";
/**
 * Options for a single step's content in the Steps element.
 * @property content The step nodes/children.
 * @property title Optional step title.
 * @property hstack Use an HStack instead of a VStack as the children container (default: false).
 * @property side_by_side_width Minimum width (px) of the content container (not the full screen) to show content side by side when `hstack` is enabled.
 */
export interface StepContentOptions {
    content: any[];
    title?: string;
    hstack?: boolean;
    side_by_side_width?: number;
}
declare const StepsElement_base: VElementBaseSignature;
/**
 * Steps element.
 * @nav Frontend/Elements
 * @param content The steps content. By default it should be an array with `Step` objects. However, when one of the items is an array, the `Step` object will automatically be initialized with the array as the `Step.content` attribute.
 * @param content.title The step title.
 * @param content.content The step children.
 * @param content.children The step children.
 * @param content.hstack Flag to use a hstack instead of vstack as the children container (default: false).
 * @param content.side_by_side_width The minimum pixels width of the content container (not the full screen) to show content side by side when `hstack` is enabled.
 * @docs
 */
export declare class StepsElement extends StepsElement_base {
    _tint: string;
    _tint_opac: number;
    _step_bg: string;
    _step_border: string;
    _step_border_radius: string;
    _step_margin_right: string;
    _div_bg: string;
    _step_nr_nodes: (VStackElement & {
        bg: VStackElement;
    })[];
    _step_nodes: HStackElement[];
    _div_nodes: DividerElement[];
    _content_nodes: (HStackElement | VStackElement)[];
    /**
     * Create a `StepsElement`.
     * @param content The steps content. Accepts arrays of nodes/VElements or `StepContentOptions`; array items are coerced into steps automatically.
     */
    constructor({ content, }: {
        content: any[] | any[][] | StepContentOptions[];
    });
    /**
     * Set default since it inherits another element.
     */
    set_default(): this;
    /**
     * Get or set the styling attributes.
     */
    styles(): Record<string, string>;
    styles(style_dict: Record<string, any>): this;
    /**
     * Set or get the step number tint color.
     * @docs
     */
    tint(): string;
    tint(value: string): this;
    /**
     * Set or get the step number tint opacity.
     * @docs
     */
    tint_opacity(): number;
    tint_opacity(value: number): this;
    /**
     * Set or get the step's content overflow.
     * @docs
     */
    content_overflow(): string;
    content_overflow(value: string): this;
    /**
     * Set the divider background between the steps.
     * @docs
     */
    divider_background(): string;
    divider_background(value: string): this;
    /**
     * Set or get the step number background.
     * @docs
     */
    step_number_background(): string;
    step_number_background(value: string): this;
    /**
     * Set or get the step number border color.
     * @docs
     */
    step_number_border_color(): string;
    step_number_border_color(value: string): this;
    /**
     * Set or get the step number border radius.
     * @docs
     */
    step_number_border_radius(): string;
    step_number_border_radius(value: string): this;
    /**
     * Set or get the step number border radius.
     * @docs
     */
    step_number_margin_right(): string;
    step_number_margin_right(value: string): this;
    /**
     * Iterate the step number nodes. When the callback returns any non null value the iteration will be stopped.
     * @docs
     */
    iterate_step_numbers(callback: (element: VStackElement) => void): this;
    /**
     * Iterate the step nodes. When the callback returns any non null value the iteration will be stopped.
     * @docs
     */
    iterate_steps(callback: (element: HStackElement) => void): this;
}
export declare const Steps: <Extensions extends object = {}>(args_0: {
    content: any[] | any[][] | StepContentOptions[];
}) => StepsElement & Extensions;
export declare const NullSteps: <Extensions extends object = {}>() => StepsElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        StepsElement: StepsElement;
    }
}
export {};
