import { VElement } from "./element";
import { VStackElement } from "./stack";
export declare class FormElement extends VStackElement {
    static default_style: Record<string, any>;
    _button?: VElement;
    fields: Record<string, any>;
    _on_submit?: ((element: FormElement, data: Record<string, any>) => any);
    _on_submit_error?: ((element: FormElement, error: Error | string) => any);
    _on_append_callback: (child: any) => void;
    constructor(...children: any[]);
    data(): Record<string, any>;
    submit(): Promise<this>;
    button(): undefined | VElement;
    button(element_or_id: VElement | string): this;
    on_submit(): undefined | ((element: FormElement, data: Record<string, any>) => any);
    on_submit(callback: ((element: FormElement, data: Record<string, any>) => any)): this;
    on_submit_error(): undefined | ((element: FormElement, error: Error | string) => any);
    on_submit_error(callback: ((element: FormElement, error: Error | string) => any)): this;
}
export declare const Form: (...args: any[]) => any;
