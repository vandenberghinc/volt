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
import { VStackElement, VStack } from "./stack";
// Slider.
let SliderElement = (() => {
    let _classDecorators = [Elements.create({
            name: "SliderElement",
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VStackElement;
    var SliderElement = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SliderElement = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        // Attributes.
        _type;
        _value;
        _enabled_color;
        _disabled_color;
        slider;
        button;
        dragging = false;
        slider_on_mouse_down_handler;
        on_mouse_down_handler;
        on_mouse_move_handler;
        on_mouse_up_handler;
        on_change_handler;
        rect;
        button_rect;
        slider_rect;
        constructor(value = 0.0) {
            // Initialize base class.
            super();
            this._init({
                derived: SliderElement,
            });
            // Attributes.
            this._type = "SliderElement";
            this._value = value;
            this._enabled_color = "green";
            this._disabled_color = "none";
            // The slider background.
            this.slider = VStack(VStack()
                .position(0, null, 0, 0)
                .background(this._enabled_color)
                .transition("right 0.05s ease-out"), VStack()
                .position(0, 0, 0, 0)
                .background(this._disabled_color)
                .transition("left 0.05s ease-out"))
                .background("white")
                .position("relative")
                // .border(`1px solid ${SETTINGS.theme.lightest_widget_background}90`)
                .frame("100%", 5)
                .border_radius(10)
                .overflow("hidden")
                .box_shadow(`0px 0px 2px #00000030`)
                .on_click((element, event) => this.slider_on_mouse_down_handler(event))
                .parent(this)
                .abs_parent(this);
            // The button.
            this.button = VStack()
                .border_radius("50%")
                .frame(15, 15)
                .background("gray")
                .position("absolute")
                .left(0)
                .top(0)
                .transition("left 0.05s ease-out")
                .box_shadow(`0px 0px 2px #00000060`)
                .cursor("pointer")
                .on_mouse_down(() => this.on_mouse_down_handler())
                .parent(this)
                .abs_parent(this);
            // Append.
            this.append(this.slider, this.button);
            // Styling.
            this.min_height(15);
            this.position("relative");
            this.flex_shrink(0);
            this.center_vertical();
            this.height("fit-content");
            // On mouse down handler for the button.
            this.slider_on_mouse_down_handler = (event) => {
                this.rect = this.getBoundingClientRect();
                this.button_rect = this.button.getBoundingClientRect();
                const min = this.rect.left;
                const max = this.rect.left + this.rect.width;
                const x = Math.max(min, Math.min(event.clientX, max));
                this.value((x - min) / (max - min));
            };
            // On mouse down handler for the button.
            this.on_mouse_down_handler = () => {
                this.dragging = true;
                this.rect = this.getBoundingClientRect();
                this.button_rect = this.button.getBoundingClientRect();
                document.body.addEventListener("mouseup", this.on_mouse_up_handler);
                document.body.addEventListener("mousemove", this.on_mouse_move_handler);
            };
            // On mouse move handler for the button.
            this.on_mouse_move_handler = (event) => {
                this.rect = this.getBoundingClientRect();
                this.button_rect = this.button.getBoundingClientRect();
                const min = this.rect.left;
                const max = this.rect.left + this.rect.width;
                const x = Math.max(min, Math.min(event.clientX, max));
                this.value((x - min) / (max - min));
            };
            // On mouse up handler for the button.
            this.on_mouse_up_handler = () => {
                this.dragging = false;
                document.body.removeEventListener("mouseup", this.on_mouse_up_handler);
                document.body.removeEventListener("mousemove", this.on_mouse_move_handler);
            };
            // On change handler.
            this.on_change_handler = (a, b) => { };
            // Set value.
            if (value != 0.0) {
                this.on_render(() => {
                    this.value(value);
                });
            }
        }
        // Set default since it inherits HStackElement.
        set_default() {
            return super.set_default(SliderElement);
        }
        enabled_color(value) {
            if (value == null) {
                return this._enabled_color;
            }
            this._enabled_color = value;
            this.slider.child(0).background(this._enabled_color);
            return this;
        }
        disabled_color(value) {
            if (value == null) {
                return this._disabled_color;
            }
            this._disabled_color = value;
            this.slider.child(1).background(this.disabled_color);
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
        // @ts-ignore
        value(value) {
            if (value == null) {
                return this._value;
            }
            this._value = Math.max(0.0, Math.min(1.0, value));
            this.rect = this.getBoundingClientRect();
            this.button_rect = this.button.getBoundingClientRect();
            this.slider_rect = this.slider.getBoundingClientRect();
            const left = Math.min(this.rect.width - this.button_rect.width, Math.max(0, (this._value * this.rect.width) - (this.button_rect.width / 2)));
            this.button.style.left = `${left}px`;
            this.slider.child(0).right(this.slider_rect.width - left);
            this.slider.child(1).left(left);
            this.on_change_handler(this, this._value);
            return this;
        }
    };
    return SliderElement = _classThis;
})();
export { SliderElement };
export const Slider = Elements.wrapper(SliderElement);
export const NullSlider = Elements.create_null(SliderElement);
