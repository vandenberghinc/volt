import { VElementBaseSignature } from "../elements/module.js";
import { VStackElement, HStackElement } from "./stack";
import { DividerElement } from "./divider";
export interface StepContentOptions {
    content: any[];
    title?: string;
    hstack?: boolean;
    side_by_side_width?: number;
}
declare const StepsElement_base: VElementBaseSignature;
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
    constructor({ content, }: {
        content: any[] | any[][] | StepContentOptions[];
    });
    set_default(): this;
    styles(): Record<string, string>;
    styles(style_dict: Record<string, any>): this;
    tint(): string;
    tint(value: string): this;
    tint_opacity(): number;
    tint_opacity(value: number): this;
    content_overflow(): string;
    content_overflow(value: string): this;
    divider_background(): string;
    divider_background(value: string): this;
    step_number_background(): string;
    step_number_background(value: string): this;
    step_number_border_color(): string;
    step_number_border_color(value: string): this;
    step_number_border_radius(): string;
    step_number_border_radius(value: string): this;
    step_number_margin_right(): string;
    step_number_margin_right(value: string): this;
    iterate_step_numbers(callback: (element: VStackElement) => void): this;
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
