/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */
// Imports.
import { Elements } from "../modules/elements";
// Button.
export class CSSElement {
    // Constructor.
    constructor(data, auto_append = true) {
        this._element = document.createElement("style");
        this._element.innerHTML = data;
        if (auto_append) {
            document.head.appendChild(this._element);
        }
    }
    data(val) {
        if (val == null) {
            return this._element.innerHTML ?? "";
        }
        this._element.innerHTML = val;
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
export const CSS = Elements.wrapper(CSSElement);
