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
// RingLoader.
// - The width and height must be in pixels.
/**
 * @docs:
 * @chapter: Frontend
 * @title: Ring Loader
 * @desc:
 * 		The ring loader element.
 */
let RingLoaderElement = (() => {
    let _classDecorators = [Elements.create({
            name: "RingLoaderElement",
            default_style: {
                "width": "80px",
                "height": "80px",
                "--child-background": "black",
                "--border-width-factor": "1",
                "display": "inline-block",
                "position": "relative",
            },
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VElementTagMap.div;
    var RingLoaderElement = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            RingLoaderElement = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        // Constructor.
        constructor() {
            // Initialize base class.
            super({
                derived: RingLoaderElement,
            });
            // Set default.
            this.update();
        }
        background(value) {
            if (value == null) {
                return this.style["--child-background"];
            }
            this.style["--child-background"] = value;
            return this;
        }
        color(value) {
            if (value == null) {
                return this.style["--child-background"];
            }
            this.style["--child-background"] = value;
            return this;
        }
        border_width_factor(value) {
            if (value == null) {
                return this.style["--border-width-factor"] == null ? 1.0 : parseFloat(this.style["--border-width-factor"]);
            }
            this.style["--border-width-factor"] = value.toString();
            return this;
        }
        /**
         * @docs:
         * @title: Update
         * @desc: Update the loader, this function needs to be called after initialization or after changing the frame, background or border.
         */
        update() {
            this.remove_children();
            const width = parseFloat(this.style.width.replace("px", ""));
            const height = parseFloat(this.style.height.replace("px", ""));
            const background = this.style["--child-background"];
            const border_width_factor = parseFloat(this.style["--border-width-factor"]);
            const children_style = {
                "box-sizing": "border-box",
                "display": "block",
                "position": "absolute",
                "width": `${width * (64.0 / 80.0)}px`,
                "height": `${height * (64.0 / 80.0)}px`,
                "margin": `${width * (8.0 / 80.0)}px`,
                // "border": `${width * (8.0 / 80.0)}px solid ${background}`,
                "border": `${width * (8.0 / 80.0 * border_width_factor)}px solid ${background}`,
                "border-color": `${background} transparent transparent transparent`,
                "border-radius": "50%",
                "animation": "RingLoader 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite",
            };
            for (let i = 0; i < 4; i++) {
                let e = document.createElement("div");
                for (let attr in children_style) {
                    e.style[attr] = children_style[attr];
                }
                if (i == 1) {
                    e.style.animationDelay = "-0.45s";
                }
                else if (i == 2) {
                    e.style.animationDelay = "-0.3s";
                }
                else if (i == 3) {
                    e.style.animationDelay = "-0.15s";
                }
                this.append(e);
            }
            return this;
        }
    };
    return RingLoaderElement = _classThis;
})();
export { RingLoaderElement };
export const RingLoader = Elements.wrapper(RingLoaderElement);
export const NullRingLoader = Elements.create_null(RingLoaderElement);
// Alias Spinner for RingLoader.
export const SpinnerElement = RingLoaderElement;
export const SpinnerLoader = Elements.wrapper(SpinnerElement);
export const NullSpinnerLoader = Elements.create_null(SpinnerElement);
// declare module './any_element.d.ts' { interface AnyElementMap { SpinnerElement: SpinnerElement } }
