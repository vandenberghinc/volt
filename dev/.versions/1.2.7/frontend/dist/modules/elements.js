/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */
// Elements module.
const Elements = {
    // Get by id.
    /*  @docs:
        @nav: Frontend
        @chapter: Elements
        @title: Get Element by ID
        @desc: Get an element by its ID.
        @param:
            @name: id
            @description The ID of the element.
    */
    get(id) {
        const e = document.getElementById(id);
        if (e == null) {
            throw new Error(`Unable to find element with id "${id}".`);
        }
        return e;
    },
    // Get by id (alias).
    /*  @docs:
        @nav: Frontend
        @chapter: Elements
        @title: Get Element by ID (Alias)
        @desc: Alias for `get` to get an element by its ID.
        @param:
            @name: id
            @description The ID of the element.
    */
    get_by_id(id) {
        return this.get(id);
    },
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
    click(id) {
        const element = document.getElementById(id);
        if (element) {
            element.click();
        }
        else {
            throw new Error(`Unable to find element with id "${id}".`);
        }
    },
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
    register_type(type, tag) {
        customElements.define("v-" + type.name.toLowerCase(), type, { extends: tag || type.element_tag });
    },
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
    register(constructor) {
        this.register_type(constructor);
    },
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
    wrapper(constructor) {
        return (...args) => new constructor(...args);
    },
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
    submit(...elements) {
        const params = {};
        let error;
        for (let i = 0; i < elements.length; i++) {
            try {
                let element = elements[i];
                if (typeof element === "string") {
                    element = this.get(element);
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
    },
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
    forward_func_to_child(func_name, child) {
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
    },
    // Extend the default VElement class.
    _velement_classes: [],
    extend_velement(props = {}) {
        const names = Object.keys(props);
        this._velement_classes.iterate(Element => {
            for (let i = 0; i < names.length; i++) {
                Element.prototype[names[i]] = props[names[i]];
            }
        });
    }
};
// Export.
export { Elements };
