/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Import elements create func.
export * from "./types.js";
import { VElement } from "./types.js"
import { create as create_velement, extend as extend_velement, native_elements } from "./create.js"

export namespace Elements {

    export const NativeElements = native_elements;
    
    // Get by id.
    // @note: always use VElement as return type since this is most likely the case and avoids type casting for users.
    /*  @docs:
        @nav: Frontend
        @chapter: Elements
        @title: Get Element by ID
        @desc: Get an element by its ID.
        @param:
            @name: id
            @description The ID of the element.
    */
    export function get(id: string): VElement {
        const e = document.getElementById(id);
        if (e == null) {
            throw new Error(`Unable to find element with id "${id}".`);
        }
        return e as any as VElement;
    }

    // Get by id (alias).
    // @note: always use VElement as return type since this is most likely the case and avoids type casting for users.
    /*  @docs:
        @nav: Frontend
        @chapter: Elements
        @title: Get Element by ID (Alias)
        @desc: Alias for `get` to get an element by its ID.
        @param:
            @name: id
            @description The ID of the element.
    */
    export function get_by_id(id: string): VElement {
        return Elements.get(id);
    }

    // Click an element by id.
    /*  @docs:
        @nav: Frontend
        @chapter: Elements
        @title: Click Element by ID
        @desc: Programmatically clicks an element by its ID.
        @param:
            @name: id
            @description The ID of the element.
    */
    export function click(id: string): void {
        const element = document.getElementById(id);
        if (element) {
            element.click();
        } else {
            throw new Error(`Unable to find element with id "${id}".`);
        }
    }

    // Register a custom type.
    /*  @docs:
        @nav: Frontend
        @chapter: Elements
        @title: Register Custom Type
        @desc: Registers a custom element type.
        @param:
            @name: type
            @description The custom element type (class).
        @param:
            @name: tag
            @description Optional tag name to extend.
    */
    export function register_type(type: any, tag?: string): void {
        (type as any)._is_registered = true;
        customElements.define("v-" + type.name.toLowerCase(), type, { extends: tag || (type as any).element_tag });
    }

    // Register decorator.
    /*  @docs:
        @nav: Frontend
        @chapter: Elements
        @title: Register Decorator
        @desc: Registers a class as a custom element.
        @param:
            @name: constructor
            @description The class constructor to register.
    */
    export function register<T extends { new(...args: any[]): {} }>(constructor: T): void {
        Elements.register_type(constructor);
    }

    // Create a constructor wrapper.
    /*  @docs:
        @nav: Frontend
        @chapter: Elements
        @title: Constructor Wrapper
        @desc: Wraps a constructor function for easy instantiation.
        @param:
            @name: constructor
            @description The class constructor to wrap.
    */
    export function wrapper<T extends new (...args: any[]) => any>(
        constructor: T
    ): <Extensions extends object = {}>(...args: ConstructorParameters<T>) => InstanceType<T> & Extensions {
        return <Extensions extends object = {}>(...args: ConstructorParameters<T>) => new constructor(...args) as InstanceType<T> & Extensions;
    }

    // Create a shared null element mainly for typescript types.
    export function create_null<T extends new (...args: any[]) => any>(target_class: T): <Extensions extends object = {}>() => InstanceType<T> & Extensions {
        let instance: T | undefined;
        return <Extensions extends object = {}>(): InstanceType<T> & Extensions => {
            if (instance === undefined) {
                instance = new target_class();
            }
            return instance as unknown as InstanceType<T> & Extensions;
        };
    }

    // Submit multiple elements by id or element.
    // When one is not filled in then an error is thrown.
    // When an input is not required, no errors will be thrown.
    // An object will be returned with each input's id as the key and the input's value as value.
    // Only supported extended input elements like `ExtendedInput`.
    /*  @docs:
        @nav: Frontend
        @chapter: Elements
        @title: Submit Elements
        @desc: Submits multiple elements by ID or reference.
        @deprecated: true
        @param:
            @name: elements
            @description A list of element IDs or element references to submit.
    */
    export function submit(...elements: (string | VElement | HTMLElement)[]): Record<string, any> {
        const params: Record<string, any> = {};
        let error;
        for (let i = 0; i < elements.length; i++) {
            try {
                let element = elements[i];
                if (typeof element === "string") {
                    element = Elements.get(element);
                }
                const id = (element as any).id();
                if (id == null || id === "") {
                    continue;
                }
                if ((element as any).required() !== true) {
                    params[id] = (element as any).value();
                } else {
                    params[id] = (element as any).submit();
                }
            } catch (e) {
                error = e;
            }
        }
        if (error) {
            throw error;
        }
        return params;
    }

    // Forward a function to a child so a user can easily create functions on the parent like border_radius() which actually set the border radius of a child.
    // The new function still returns `this`.
    /*  @docs:
        @nav: Frontend
        @chapter: Elements
        @title: Forward Function to Child
        @desc: Forwards a function to a child element.
        @param:
            @name: func_name
            @description The name of the function to forward.
        @param:
            @name: child
            @description The child element or a function that returns the child element.
    */
    export function forward_func_to_child(func_name: string, child: any): (val?: any) => any {
        return function (this: any, val?: any) {
            if (typeof child === "function") {
                child = child(this);
            }
            if (val == null) {
                return child[func_name]();
            }
            child[func_name](val);
            return this;
        };
    }

    // Update the extend_velement function to use proper types
    export const extend = extend_velement;

    // Create.
    export const create = create_velement;
};
