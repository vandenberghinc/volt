/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */
// Button.
export class Stylesheet {
    // Attributes.
    _element;
    // Constructor.
    /** @warning This function may cause security issues if the data is unsafe provided by the user, since this assigns to innerHTML. */
    constructor(data, auto_append = false) {
        this._element = document.createElement("style");
        // Assign to tht element while security is paramount, dont assign to inner html
        this._element.innerHTML = data;
        if (auto_append) {
            this.attach();
        }
    }
    data(val) {
        if (val == null) {
            return this._element.innerHTML ?? "";
        }
        this._element.innerHTML = val;
        return this;
    }
    // Attach.
    attach() {
        document.head.appendChild(this._element);
        return this;
    }
    join() {
        document.head.appendChild(this._element);
        return this;
    }
    // Remove.
    remove() {
        this._element.remove();
        return this;
    }
    // Append to.
    append_to(parent) {
        parent.appendChild(this._element);
        return this;
    }
}
// export const CSS = Elements.wrapper(CSSElement);
// export const NullCSS = Elements.create_null(CSSElement);
// declare module './any_element.d.ts' { interface AnyElementMap { CSSElement: CSSElement }}
