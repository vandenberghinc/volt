export * from "./base.js";
import { VElement, extend as extend_velement, wrapper as _wrapper, create_null as _create_null } from "./base.js";
import { register_element as _register_element } from "./register_element.js";
export declare namespace Elements {
    /**
     * Re-exports the `register_element` helper for registering custom elements.
     */
    export const register_element: typeof _register_element;
    /**
     * Get an element by its ID.
     * @nav Frontend
     * @chapter Elements
     * @param id The ID of the element.
     * @docs
     */
    export function get(id: string): VElement;
    /**
     * Alias for `get` to retrieve an element by its ID.
     * @nav Frontend
     * @chapter Elements
     * @param id The ID of the element.
     * @docs
     */
    export function get_by_id(id: string): VElement;
    /**
     * Programmatically clicks an element by its ID.
     * @nav Frontend
     * @chapter Elements
     * @param id The ID of the element.
     * @docs
     */
    export function click(id: string): void;
    /**
     * Generic constructor signature used for class decorators and factories.
     */
    type Constructor<T = any> = new (...args: any[]) => T;
    /**
     * Options for the `Elements.create` class decorator.
     * @property name The name to use for this element (becomes the “v-…” tag)
     * @property tag Optional host tag to extend (defaults to constructor.tag if set)
     * @property default_style Default inline styles for the element.
     * @property default_attributes Default attributes for the element.
     * @property default_events Default event handlers for the element.
     */
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
    /**
     * Re-exported constructor wrapper from the base module.
     */
    export const wrapper: typeof _wrapper;
    /**
     * Shared null element mainly for TypeScript typing convenience.
     */
    export const create_null: typeof _create_null;
    /**
     * Submits multiple elements by ID or reference.
     * @nav Frontend
     * @chapter Elements
     * @deprecated
     * @param elements A list of element IDs or element references to submit.
     * @docs
     */
    export function submit(...elements: (string | VElement | HTMLElement)[]): Record<string, any>;
    /**
     * Forwards a function to a child element.
     * @nav Frontend
     * @chapter Elements
     * @param func_name The name of the function to forward.
     * @param child The child element or a function that returns the child element.
     * @docs
     */
    export function forward_func_to_child(func_name: string, child: any): (val?: any) => any;
    /**
     * Typed re-export of `extend` to augment a `VElement` with additional helpers.
     */
    export const extend: typeof extend_velement;
    export {};
}
