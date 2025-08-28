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
import { VStack, VStackElement } from "./stack";
// Switch button.
let SwitchElement = (() => {
    let _classDecorators = [Elements.create({
            name: "SwitchElement",
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VStackElement;
    var SwitchElement = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SwitchElement = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        // export class SwitchElement extends (VStackElement as any as VElementBaseSignature) {
        // Attributes.
        on_change_handler;
        _enabled;
        _enabled_color;
        _disabled_color;
        enabled;
        slider;
        button;
        _value_timeout;
        // Constructor.
        constructor(enabled = false) {
            // Initialize base class.
            super();
            this._init({
                derived: SwitchElement,
            });
            // The slider background.
            this.slider = VStack()
                .background("white")
                // .border(`1px solid ${SETTINGS.theme.lightest_widget_background}90`)
                .frame(35, 12.5)
                .border_radius(10)
                .overflow("visible")
                .box_shadow(`0px 0px 2px #00000030`)
                .parent(this);
            // The button.
            this.button = VStack()
                .border_radius("50%")
                .frame(17.5, 17.5)
                .background("gray")
                .position("absolute")
                .left(0)
                .transition("left 0.15s ease-out")
                .box_shadow(`0px 0px 2px #00000060`)
                .on_click(() => this.toggle())
                .parent(this);
            // Append.
            this.append(this.slider, this.button);
            // Styling.
            this.position("relative");
            this.width(35);
            this.flex_shrink(0);
            this.center_vertical();
            // On change handler.
            this.on_change_handler = (a, b) => { };
            // Attributes.
            this._enabled = enabled;
            this._enabled_color = "green";
            this._disabled_color = "gray";
            // Alias func.
            // @ts-ignore
            this.enabled = this.value;
            // Set enabled value.
            this.value(enabled, false);
            // Set default theme update.
            this.on_theme_update(() => {
                this.value(this._enabled, false);
            });
        }
        // Set default since it inherits an element.
        set_default() {
            return super.set_default(SwitchElement);
        }
        width(value) {
            if (value == null) {
                return super.width();
            }
            super.width(value);
            this.slider.width(value);
            return this;
        }
        min_width(value) {
            if (value == null) {
                return super.min_width();
            }
            super.min_width(value);
            this.slider.min_width(value);
            return this;
        }
        max_width(value) {
            if (value == null) {
                return super.max_width();
            }
            super.max_width(value);
            this.slider.max_width(value);
            return this;
        }
        height(value) {
            if (value == null) {
                return super.height();
            }
            super.height(value);
            this.slider.height(typeof value === "string" ? "50%" : value / 2);
            return this;
        }
        min_height(value) {
            if (value == null) {
                return super.min_height();
            }
            super.min_height(value);
            this.slider.min_height(typeof value === "string" ? "50%" : value / 2);
            return this;
        }
        max_height(value) {
            if (value == null) {
                return super.max_height();
            }
            super.max_height(value);
            this.slider.max_height(typeof value === "string" ? "50%" : value / 2);
            return this;
        }
        // Frame.
        frame(width, height) {
            if (width != null) {
                this.width(width);
            }
            if (height != null) {
                this.height(height);
            }
            return this;
        }
        min_frame(width, height) {
            if (width != null) {
                this.min_width(width);
            }
            if (height != null) {
                this.min_height(height);
            }
            return this;
        }
        max_frame(width, height) {
            if (width != null) {
                this.max_width(width);
            }
            if (height != null) {
                this.max_height(height);
            }
            return this;
        }
        background(value) {
            if (value == null) {
                return this.slider.background();
            }
            this.slider.background(value);
            return this;
        }
        enabled_color(value) {
            if (value == null) {
                return this._enabled_color;
            }
            this._enabled_color = value;
            return this;
        }
        disabled_color(value) {
            if (value == null) {
                return this._disabled_color;
            }
            this._disabled_color = value;
            return this;
        }
        // Toggle the value.
        toggle() {
            return this.value(!this._enabled);
        }
        // @ts-ignore
        value(value, animate = true) {
            if (value == null) {
                return this._enabled;
            }
            else if (value === true) {
                this._enabled = value;
                if (animate) {
                    clearTimeout(this._value_timeout);
                    this._value_timeout = setTimeout(() => this.button.background(this._enabled_color), 140);
                }
                else {
                    this.button.background(this._enabled_color);
                }
                const slider_width = this.slider.getBoundingClientRect().width;
                const button_width = this.button.getBoundingClientRect().width;
                if (slider_width && button_width) {
                    this.button.style.left = `${slider_width - button_width}px`;
                    this.button.style.right = "auto";
                }
                else {
                    this.button.style.left = "auto";
                    this.button.style.right = "0px";
                }
                this.on_change_handler(this, this._enabled);
            }
            else if (value === false) {
                this._enabled = value;
                if (animate) {
                    clearTimeout(this._value_timeout);
                    this._value_timeout = setTimeout(() => this.button.background(this._disabled_color), 140);
                }
                else {
                    this.button.background(this._disabled_color);
                }
                const slider_width = this.slider.getBoundingClientRect().width;
                const button_width = this.button.getBoundingClientRect().width;
                if (slider_width && button_width) {
                    if (this.button.style.left === "auto") { // otherwise the transition does not show when it was initialized as true.
                        this.button.style.left = `${slider_width - button_width}px`;
                        setTimeout(() => {
                            this.button.style.right = "auto";
                            this.button.style.left = "0px";
                        }, 10);
                    }
                    else {
                        this.button.style.right = "auto";
                        this.button.style.left = "0px";
                    }
                }
                else {
                    this.button.style.left = "0px";
                    this.button.style.right = "auto";
                }
                this.on_change_handler(this, this._enabled);
            }
            return this;
        }
        // @ts-ignore
        on_change(handler) {
            if (handler == null) {
                return this.on_change_handler;
            }
            this.on_change_handler = handler;
            return this;
        }
    };
    return SwitchElement = _classThis;
})();
export { SwitchElement };
export const Switch = Elements.wrapper(SwitchElement);
export const NullSwitch = Elements.create_null(SwitchElement);
