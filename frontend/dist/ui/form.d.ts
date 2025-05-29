import { VElementBaseSignature, VElement, AppendType } from "../elements/module.js";
import { CheckBoxElement } from "./checkbox.js";
import { ExtendedInputElement, ExtendedSelectElement } from "./input.js";
export type OnSubmit<This> = (element: This, data: Record<string, any>) => any;
export type OnSubmitError<This> = (element: This, error: Error) => any;
declare const FormElement_base: VElementBaseSignature;
export declare class FormElement extends FormElement_base {
    _button?: VElement;
    fields: Record<string, ExtendedInputElement | ExtendedSelectElement | CheckBoxElement>;
    _on_submit?: OnSubmit<this>;
    _on_submit_error?: OnSubmitError<this>;
    _on_append_callback: (child: any) => void;
    constructor(...children: AppendType[]);
    data(): Record<string, any>;
    submit(): Promise<this>;
    button<T = undefined | HTMLElement | VElement>(): T;
    button(element_or_id: VElement | string): this;
    on_submit(): undefined | OnSubmit<this>;
    on_submit(callback: OnSubmit<this>): this;
    on_submit_error(): undefined | OnSubmitError<this>;
    on_submit_error(callback: OnSubmitError<this>): this;
}
export declare const Form: <Extensions extends object = {}>(...args: AppendType[]) => FormElement & Extensions;
export declare const NullForm: <Extensions extends object = {}>() => FormElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        FormElement: FormElement;
    }
}
export {};
