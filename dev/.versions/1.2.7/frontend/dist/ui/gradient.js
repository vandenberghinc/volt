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
import { Utils } from "../modules/utils";
import { CreateVElementClass } from "./element";
// Gradient.
/*	@docs:
 *	@nav: Frontend
 *	@chapter: Styling
 *	@title: Gradient
 *	@description:
 *		Create a gradient object.
 *
 *		Can also be constructed with wrapper function `Gradient`.
 *	@return:
 *		Returns the `GradientType` object.
 *	@parameter:
 *		@name: ...args
 *		@description:
 *			The arguments can either be of length 1, containing the full gradient string `new GradientType ("linear-gradient(...)")`.
 *			Or the arguments can be as `new GradientType("linear", "black", "0%", "white", "100%")`.
 */
export class GradientType {
    constructor(...args) {
        if (args.length === 1) {
            this.gradient = args[0];
        }
        else if (args.length > 1) {
            this.type = args[0];
            this.colors = [];
            for (let i = 1; i < args.length; i++) {
                if (args[i].endsWith("deg")) {
                    this.degree = args[i];
                    continue;
                }
                if (typeof args[i + 1] === "string" && args[i + 1].includes("%")) {
                    this.colors.push({
                        color: args[i],
                        stop: args[i + 1],
                    });
                    i++;
                }
                else {
                    this.colors.push({
                        color: args[i],
                        stop: undefined,
                    });
                }
            }
        }
        else {
            console.error("Invalid number of arguments for class \"Gradient()\".");
        }
    }
    // Cast to string.
    toString() {
        if (this.gradient == null && this.colors !== undefined) {
            this.gradient = `${this.type}-gradient(`;
            if (this.degree) {
                this.gradient += this.degree + ", ";
            }
            for (let i = 0; i < this.colors.length; i++) {
                this.gradient += this.colors[i].color;
                this.gradient += " ";
                let stop = this.colors[i].stop;
                if (Utils.is_numeric(stop) && stop <= 1.0) {
                    stop = (stop * 100) + "%";
                }
                this.gradient += stop;
                if (i + 1 < this.colors.length) {
                    this.gradient += ", ";
                }
            }
            this.gradient += ")";
            return this.gradient;
        }
        return this.gradient ?? "";
    }
}
;
export const Gradient = Elements.wrapper(GradientType);
// Gradient border.
let GradientBorderElement = (() => {
    var _a;
    let _classDecorators = [(_a = Elements).register.bind(_a)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CreateVElementClass({
        type: "GradientBorder",
        tag: "div",
        default_style: {
            "border-width": "1px",
            "border-radius": "10px",
            // "border-color": "black",
        },
    });
    var GradientBorderElement = _classThis = class extends _classSuper {
        // Constructor.
        constructor(text) {
            // Initialize base classes.
            super();
            // Styling.
            this
                .content("")
                .position("absolute")
                // .z_index(-1)
                .inset(0)
                .padding(GradientBorderElement.default_style["--child-border-width"])
                .border_radius(GradientBorderElement.default_style["--child-border-radius"])
                .background(GradientBorderElement.default_style["--child-background"])
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
    __setFunctionName(_classThis, "GradientBorderElement");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        GradientBorderElement = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return GradientBorderElement = _classThis;
})();
export { GradientBorderElement };
export const GradientBorder = Elements.wrapper(GradientBorderElement);
