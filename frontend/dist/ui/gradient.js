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
import { Elements, VElementTagMap } from "../elements/module.js";
import { GradientType } from "../types/gradient.js";
export { GradientType };
export const Gradient = Elements.wrapper(GradientType);
export const NullGradient = Elements.create_null(GradientType);
// Gradient border.
let GradientBorderElement = (() => {
    let _classDecorators = [Elements.create({
            name: "GradientBorderElement",
            default_style: {
                "--child-border-width": "1px",
                "--child-border-radius": "10px",
                "--child-border-color": "black",
            },
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VElementTagMap.div;
    var GradientBorderElement = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            GradientBorderElement = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        // Constructor.
        constructor() {
            // Initialize base classes.
            super({
                derived: GradientBorderElement,
            });
            // Styling.
            this
                .content("")
                .position("absolute")
                // .z_index(-1)
                .inset(0)
                .padding(GradientBorderElement.default_style["--child-border-width"] ?? "")
                .border_radius(GradientBorderElement.default_style["--child-border-radius"] ?? "")
                .background(GradientBorderElement.default_style["--child-border-color"] ?? "")
                .mask("linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)")
                .mask_composite("exclude")
                // .mask_composite((navigator.userAgent.includes("Firefox") || navigator.userAgent.includes("Mozilla")) ? "exclude" : "xor")
                .styles({
                "-webkit-mask": "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                "-webkit-mask-composite": (navigator.userAgent.includes("Firefox") || navigator.userAgent.includes("Mozilla")) ? "exclude" : "xor",
            });
        }
        border_color(val) {
            if (val === undefined) {
                return this.style.background ?? "";
            }
            this.style.background = val;
            return this;
        }
        border_width(value) {
            if (value == null) {
                return this.padding() ?? "";
            }
            this.padding(value);
            return this;
        }
    };
    return GradientBorderElement = _classThis;
})();
export { GradientBorderElement };
export const GradientBorder = Elements.wrapper(GradientBorderElement);
export const NullGradientBorder = Elements.create_null(GradientBorderElement);
