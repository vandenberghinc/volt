import { VStackElement, HStackElement } from "./stack";
import { DividerElement } from "./divider";
interface ContentObject {
    content: any[];
    title?: string;
    hstack?: boolean;
    side_by_side_width?: number;
}
export declare class StepsElement extends VStackElement {
    static default_style: Record<string, any>;
    _tint: string;
    _tint_opac: number;
    _step_bg: string;
    _step_border: string;
    _step_border_radius: string;
    _div_bg: string;
    _step_nr_nodes: VStackElement[];
    _step_nodes: HStackElement[];
    _div_nodes: DividerElement[];
    _content_nodes: (HStackElement | VStackElement)[];
    constructor({ content, spacing, }: {
        content: any[][] | ContentObject[];
        spacing: string | number;
    });
    set_default(): this;
    styles(): this;
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
    iterate_step_numbers(callback: (element: VStackElement) => void): this;
    iterate_steps(callback: (element: HStackElement) => void): this;
}
export declare const Steps: (...args: any[]) => any;
export {};
