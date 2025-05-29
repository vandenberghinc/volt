export * from "./base.js";
import { VElement, extend as extend_velement, wrapper as _wrapper, create_null as _create_null } from "./base.js";
import { register_element as _register_element } from "./register_element.js";
export declare namespace Elements {
    export const register_element: typeof _register_element;
    export function get(id: string): VElement;
    export function get_by_id(id: string): VElement;
    export function click(id: string): void;
    type Constructor<T = any> = new (...args: any[]) => T;
    interface CreateOpts {
        name: string;
        tag?: string;
        default_style?: Record<string, any>;
        default_attributes?: Record<string, any>;
        default_events?: Record<string, any>;
    }
    /**
     * Class decorator factory.
     * @example
     *   @create({ name: "Foo", tag?: "section", base: HTMLElement })
     *   class Foo extends HTMLElement { … }
     */
    export function create(opts: CreateOpts): <T extends Constructor>(constructor: T) => T;
    export const wrapper: typeof _wrapper;
    export const create_null: typeof _create_null;
    export function submit(...elements: (string | VElement | HTMLElement)[]): Record<string, any>;
    export function forward_func_to_child(func_name: string, child: any): (val?: any) => any;
    export const extend: typeof extend_velement;
    export {};
}
