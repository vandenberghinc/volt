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
// Imports.
import { Elements } from "../elements/module.js";
import { VStack, VStackElement, HStack } from "./stack";
import { Text } from "./text";
// Extended input.
let CheckBoxElement = (() => {
    let _classDecorators = [Elements.create({
            name: "CheckBoxElement",
            default_style: {
                ...VStackElement.default_style,
                "color": "inherit",
                "font-size": "16px",
                // Custom.
                "--circle-border-color": "gray",
                "--circle-inner-bg": "#FFFFFF",
                "--focus-color": "#8EB8EB",
                "--missing-color": "#E8454E",
            },
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VStackElement;
    var CheckBoxElement = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CheckBoxElement = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        // Attributes.
        _border_color;
        _inner_bg;
        _focus_color;
        _missing_color;
        _missing;
        _required;
        _circle;
        // @ts-expect-error
        text;
        // @ts-expect-error
        content;
        error;
        // Constructor.
        constructor(text_or_obj = {
            text: "",
            required: false,
            id: undefined,
        }) {
            // Initialize super.
            super();
            this._init({
                derived: CheckBoxElement,
            });
            // Args.
            let text = text_or_obj, required = false, id = undefined;
            if (typeof text_or_obj === "object" && text_or_obj != null) {
                text = text_or_obj.text;
                required = text_or_obj.required == null ? false : text_or_obj.required;
                id = text_or_obj.id == null ? undefined : text_or_obj.id;
            }
            // Attributes.
            this._border_color = CheckBoxElement.default_style["--circle-border-color"];
            this._inner_bg = CheckBoxElement.default_style["--circle-inner-bg"];
            this._focus_color = CheckBoxElement.default_style["--focus-color"];
            this._missing_color = CheckBoxElement.default_style["--missing-color"];
            this._missing = false;
            this._required = false;
            // Circle element.
            const _this = this;
            this._circle = VStack(VStack()
                .assign_to_parent_as("inner")
                .border_radius("50%")
                .frame("35%", "35%")
                .background(this._inner_bg)
                .flex_shrink(0))
                .assign_to_parent_as("circle")
                .flex_shrink(0)
                .border_width(1)
                .border_style("solid")
                .border_color(this._border_color)
                .border_radius("50%")
                .frame(15, 15)
                .margin(2.5, 10, 0, 0)
                .background("transparent")
                .box_shadow(`0 0 0 0px transparent`)
                .transition("background 0.3s ease-in-out, box-shadow 0.2s ease-in-out")
                .center()
                .center_vertical()
                .on_mouse_over((e) => e.box_shadow(`0 0 0 2px ${this._focus_color}`))
                .on_mouse_out((e) => e.box_shadow(`0 0 0 0px transparent`))
                .on_click((e) => e.toggle())
                .extend({
                enabled: false,
                toggle() {
                    return this.value(!this.enabled);
                },
                value(to = null) {
                    if (to == null) {
                        return this.enabled;
                    }
                    else if (to === true) {
                        this.enabled = true;
                        this.background(_this._focus_color);
                        _this.missing(false);
                    }
                    else {
                        this.enabled = false;
                        this.background("transparent");
                    }
                    return this;
                },
            });
            // Text element.
            this.text = Text(text) // dont use innerHTML
                .font_size("inherit")
                .color("inherit")
                .padding(0)
                .margin(0);
            // The content.
            this.content = HStack(this._circle, this.text)
                .width("100%");
            // The error message.
            this.error = Text("Incomplete field")
                .color(this._missing_color)
                .font_size("0.8em")
                .margin(5, 0, 0, 2.5)
                .padding(0)
                .hide();
            // Append.
            this.append(this.content, this.error);
            // Set id.
            if (id !== undefined) {
                this.id(id);
            }
            // Set required.
            if (required) {
                this.required(required);
            }
        }
        border_color(val) {
            if (val == null) {
                return this._border_color;
            }
            this._border_color = val;
            this._circle.border_color(this._border_color);
            return this;
        }
        inner_bg(val) {
            if (val == null) {
                return this._inner_bg;
            }
            this._inner_bg = val;
            this._circle.inner.background(this._inner_bg);
            return this;
        }
        styles(style_dict) {
            if (style_dict == null) {
                let styles = super.styles();
                styles["--circle-inner-bg"] = this._inner_bg;
                styles["--circle-border-color"] = this._border_color;
                styles["--focus-color"] = this._focus_color;
                styles["--missing-color"] = this._missing_color;
                return styles;
            }
            else {
                return super.styles(style_dict);
            }
        }
        // Set default since it inherits an element.
        set_default() {
            return super.set_default(CheckBoxElement);
        }
        // Toggle value.
        toggle() {
            this._circle.toggle();
            return this;
        }
        // @ts-expect-error
        value(to) {
            if (to == null) {
                return this._circle.enabled;
            }
            this._circle.value(to);
            return this;
        }
        required(to) {
            if (to == null) {
                return this._required;
            }
            this._required = to;
            return this;
        }
        focus_color(val) {
            if (val == null) {
                return this._focus_color;
            }
            this._focus_color = val;
            return this;
        }
        missing_color(val) {
            if (val == null) {
                return this._missing_color;
            }
            this._missing_color = val;
            return this;
        }
        missing(to = true) {
            if (to == null) {
                return this._missing;
            }
            else if (to === true) {
                this._missing = true;
                this._circle.outline(`1px solid ${this._missing_color}`);
                this._circle.box_shadow(`0 0 0 3px ${this._missing_color}80`);
                this.error.color(this._missing_color);
                this.error.show();
            }
            else {
                this._missing = false;
                this._circle.outline("0px solid transparent");
                this._circle.box_shadow(`0 0 0 0px transparent`);
                this.error.hide();
            }
            return this;
        }
        // Submit the item, throws an error when the item is not enabled.
        submit() {
            const value = this.value();
            if (value !== true) {
                this.missing(true);
                throw Error("Fill in all the required fields.");
            }
            this.missing(false);
            return value;
        }
    };
    return CheckBoxElement = _classThis;
})();
export { CheckBoxElement };
export const CheckBox = Elements.wrapper(CheckBoxElement);
export const NullCheckBox = Elements.create_null(CheckBoxElement);
