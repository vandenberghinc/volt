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
// Button.
let ButtonElement = (() => {
    let _classDecorators = [Elements.create({
            name: "ButtonElement",
            default_style: {
                "margin": "0px 0px 0px",
                "padding": "5px 10px 5px 10px",
                "outline": "none",
                "border": "none",
                "border-radius": "10px",
                "cursor": "pointer",
                "color": "inherit",
                "text-align": "center",
                "display": "grid",
                "align-items": "center",
                "white-space": "nowrap",
                "user-select": "none",
                "text-decoration": "none",
            },
            default_events: {
                "onmousedown": function () {
                    this.style.filter = "brightness(80%)";
                },
                "onmouseover": function () {
                    this.style.filter = "brightness(90%)";
                },
                "onmouseup": function () {
                    this.style.filter = "brightness(100%)";
                },
                "onmouseout": function () {
                    this.style.filter = "brightness(100%)";
                },
            },
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VElementTagMap.a;
    var ButtonElement = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ButtonElement = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        /**
         * @docs:
         * @nav: Frontend
         * @chapter: Buttons
         * @title: Button
         * @desc: Initializes the Button element with the provided text.
         * @param:
         *     @name: text
         *     @description The text to display on the button.
         */
        constructor(text = "") {
            super({
                derived: ButtonElement,
            });
            this.text(text); // @note never assign to innerHTML, always use text()
        }
    };
    return ButtonElement = _classThis;
})();
export { ButtonElement };
export const Button = Elements.wrapper(ButtonElement);
export const NullButton = Elements.create_null(ButtonElement);
