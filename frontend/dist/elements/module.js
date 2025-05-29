/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */
// Import elements create func.
export * from "./base.js";
import { extend as extend_velement, wrapper as _wrapper, create_null as _create_null, } from "./base.js";
import { register_element as _register_element } from "./register_element.js";
// Elements module.
export var Elements;
(function (Elements) {
    Elements.register_element = _register_element;
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
    function get(id) {
        const e = document.getElementById(id);
        if (e == null) {
            throw new Error(`Unable to find element with id "${id}".`);
        }
        return e;
    }
    Elements.get = get;
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
    function get_by_id(id) {
        return Elements.get(id);
    }
    Elements.get_by_id = get_by_id;
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
    function click(id) {
        const element = document.getElementById(id);
        if (element) {
            element.click();
        }
        else {
            throw new Error(`Unable to find element with id "${id}".`);
        }
    }
    Elements.click = click;
    /**
     * Class decorator factory.
     * @example
     *   @create({ name: "Foo", tag?: "section", base: HTMLElement })
     *   class Foo extends HTMLElement { … }
     */
    function create(opts) {
        // Validate required options at factory time
        if (typeof opts.name !== "string" || opts.name.trim() === "") {
            throw new Error(`@Elements.create requires a non-empty string “name”`);
        }
        // Factory function
        return function (constructor) {
            const any_ctor = constructor;
            // Define readonly static attributes.
            any_ctor.element_name = opts.name;
            // Object.defineProperty(any_ctor, "element_name", { value: opts.name, writable: false, enumerable: true, configurable: false });
            if (opts.tag != null) {
                any_ctor.element_tag = opts.tag;
                // Object.defineProperty(any_ctor, "element_tag", { value: opts.tag, writable: false, enumerable: true, configurable: false });
            }
            if (opts.default_style != null) {
                any_ctor.default_style = opts.default_style;
                // Object.defineProperty(any_ctor, "default_style", { value: opts.default_style, writable: false, enumerable: true, configurable: false });
            }
            if (opts.default_attributes != null) {
                any_ctor.default_attributes = opts.default_attributes;
                // Object.defineProperty(any_ctor, "default_attributes", { value: opts.default_attributes, writable: false, enumerable: true, configurable: false });
            }
            if (opts.default_events != null) {
                any_ctor.default_events = opts.default_events;
                // Object.defineProperty(any_ctor, "default_events", { value: opts.default_events, writable: false, enumerable: true, configurable: false });
            }
            // Register custom element exactly once
            _register_element(constructor);
            return constructor;
        };
    }
    Elements.create = create;
    // export function create<T extends { new(...args: any[]): {} }>(constructor: T): void {
    //     const any_con = constructor as any;
    //     // Register new html element.
    //     if (!any_con._volt_is_registered) {
    //         console.log({ type: constructor })
    //         if (!any_con.element_name) {
    //             throw new Error(`Static element attribute '${any_con.name}.element_name' should always be defined, create static attribute \"element_name: string\" and assign the name of the class to this attribute.`)
    //         }
    //         const name = any_con.element_name || any_con.name;
    //         let new_xml_name = "", count = 0;
    //         do {
    //             new_xml_name = "v-" + name.toLowerCase() + (count > 0 ? "-" + count : "");
    //         } while (registered_type_names.has(new_xml_name) && ++count);
    //         registered_type_names.add(new_xml_name);
    //         const ext = tag || any_con.element_tag;
    //         // @debug
    //         console.log("Registering custom element: ", {
    //             name,
    //             type: constructor,
    //             new_xml_name,
    //             extends: ext,
    //             element_name: any_con.element_name,
    //         });
    //         any_con._volt_is_registered = true;
    //         // customElements.define(type.name, type, { extends: tag || (type as any).element_tag });
    //         customElements.define(new_xml_name, any_con, { extends: ext });
    //     }
    // }
    // Create a constructor wrapper.
    Elements.wrapper = _wrapper;
    // Create a shared null element mainly for typescript types.
    Elements.create_null = _create_null;
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
    function submit(...elements) {
        const params = {};
        let error;
        for (let i = 0; i < elements.length; i++) {
            try {
                let element = elements[i];
                if (typeof element === "string") {
                    element = Elements.get(element);
                }
                const id = element.id();
                if (id == null || id === "") {
                    continue;
                }
                if (element.required() !== true) {
                    params[id] = element.value();
                }
                else {
                    params[id] = element.submit();
                }
            }
            catch (e) {
                error = e;
            }
        }
        if (error) {
            throw error;
        }
        return params;
    }
    Elements.submit = submit;
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
    function forward_func_to_child(func_name, child) {
        return function (val) {
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
    Elements.forward_func_to_child = forward_func_to_child;
    // Update the extend_velement function to use proper types
    Elements.extend = extend_velement;
    // Create.
    // export const create = create_velement;
})(Elements || (Elements = {}));
;
