/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
// Imports.
import { Elements } from "../modules/elements";
import { isVElement } from "./element";
import { VStackElement } from "./stack";
// Extended input.
let FormElement = (() => {
    var _a;
    let _classDecorators = [(_a = Elements).register.bind(_a)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VStackElement;
    var FormElement = _classThis = class extends _classSuper {
        // Constructor.
        constructor(...children) {
            // Initialize super.
            super();
            // Attributes.
            this.element_type = "Form";
            // Set default styling.
            this.styles(FormElement.default_style);
            // Attributes.
            this._button = undefined;
            this.fields = {};
            // Set the on append callback.
            const _this = this;
            this._on_append_callback = (child) => {
                // Initialize field.
                if (child.element_type === "ExtendedInput" || child.element_type === "ExtendedSelect" || child.element_type === "CheckBox") {
                    const id = child.id();
                    if (id != null && id !== "") {
                        _this.fields[id] = child;
                        child.on_input(() => {
                            if (child.missing() === true) {
                                child.missing(false);
                            }
                        });
                        child.on_enter(() => _this.submit());
                    }
                }
                // Initialize button.
                else if ( /*_this._button === undefined &&*/(child.element_type === "Button" || child.element_type === "LoaderButton") && child.on_click() == null) { //  && child.attr("submit_button") != "false"
                    if (_this._button !== undefined) {
                        _this._button.on_click(() => { });
                    }
                    _this.button(child);
                }
                // Parse children.
                if (child.children != null) {
                    for (let i = 0; i < child.children.length; i++) {
                        _this._on_append_callback(child.children[i]);
                    }
                }
            };
            // Append.
            this.append(...children);
        }
        // Submit all input elements and get the data inside an object.
        // When a required input is not filled in then an error is thrown.
        // An object will be returned with each input's id as the key and the input's value as value.
        // When an input field does not have an assigned id it will be skipped.
        // Only supported extended input elements like `ExtendedInput`.
        // @ts-expect-error
        data() {
            const params = {};
            let error;
            const ids = Object.keys(this.fields);
            for (let i = 0; i < ids.length; i++) {
                try {
                    const id = ids[i];
                    const element = this.fields[id];
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
        // Submit.
        async submit() {
            // Init.
            if (this._button === undefined) {
                throw Error("No submit button has been found, add a button to the form or attach a button using \"Form.button()\".");
            }
            if (this._button.show_loader !== undefined) {
                this._button.show_loader();
            }
            // Submit.
            try {
                const data = this.data();
                if (this._on_submit !== undefined) {
                    const res = this._on_submit(this, data);
                    if (res instanceof Promise) {
                        await res;
                    }
                }
                if (this._button.hide_loader !== undefined) {
                    this._button.hide_loader();
                }
            }
            // Handle rror.
            catch (error) {
                // Defined callback.
                if (this._on_submit_error !== undefined) {
                    const res = this._on_submit_error(this, error);
                    if (res instanceof Promise) {
                        await res;
                    }
                    if (this._button.hide_loader !== undefined) {
                        this._button.hide_loader();
                    }
                }
                // No callback so rethrow.
                else {
                    if (this._button.hide_loader !== undefined) {
                        this._button.hide_loader();
                    }
                    throw error;
                }
            }
            return this;
        }
        button(element_or_id) {
            if (element_or_id == null) {
                return this._button;
            }
            else if (typeof element_or_id === "string") {
                const node = document.getElementById(element_or_id);
                if (!isVElement(node)) {
                    throw Error(`Specified element is not a VElement.`);
                }
                element_or_id = node;
                if (element_or_id == null) {
                    throw Error(`Unable to find element "${element_or_id}".`);
                }
            }
            this._button = element_or_id;
            const _this = this;
            this._button.on_click(() => {
                _this.submit().catch(console.error);
            });
            return this;
        }
        // @ts-expect-error
        on_submit(callback) {
            if (callback == null) {
                return this._on_submit;
            }
            this._on_submit = callback;
            return this;
        }
        on_submit_error(callback) {
            if (callback == null) {
                return this._on_submit_error;
            }
            this._on_submit_error = callback;
            return this;
        }
    };
    __setFunctionName(_classThis, "FormElement");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        FormElement = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
    })();
    // Macros.
    // Default styling.
    // static default_style = Object.assign({}, HStackElement.default_style, {
    _classThis.default_style = {
        ...VStackElement.default_style,
    };
    (() => {
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return FormElement = _classThis;
})();
export { FormElement };
export const Form = Elements.wrapper(FormElement);
