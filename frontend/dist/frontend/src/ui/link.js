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
// Link.
let AnchorElement = (() => {
    let _classDecorators = [Elements.create({
            name: "AnchorElement",
            default_style: {
                "font-family": "inherit",
                "font-size": "inherit",
                "color": "inherit",
                "text-decoration": "none",
                "text-underline-position": "none",
                "cursor": "pointer",
                "outline": "none",
                "border": "none",
            },
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VElementTagMap.a;
    var AnchorElement = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AnchorElement = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        // Constructor.
        constructor(text, href, alt) {
            // Initialize base class.
            super({
                derived: AnchorElement,
            });
            // Set href.
            if (href !== undefined) {
                this.href(href);
            }
            // Set alt.
            if (alt !== undefined) {
                this.alt(alt);
            }
            // Set text.
            if (text !== undefined || alt !== undefined) {
                this.text((text ?? alt));
            }
        }
    };
    return AnchorElement = _classThis;
})();
export { AnchorElement };
export const Anchor = Elements.wrapper(AnchorElement);
export const NullAnchor = Elements.create_null(AnchorElement);
// Link.
let LinkElement = (() => {
    let _classDecorators = [Elements.create({
            name: "LinkElement",
            default_style: {
                "font-family": "inherit",
                "font-size": "1em",
                "color": "rgb(85, 108, 214)",
                "text-decoration": "underline",
                "text-underline-position": "auto",
                "cursor": "pointer",
            },
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VElementTagMap.a;
    var LinkElement = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            LinkElement = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        // Constructor.
        constructor(text, href) {
            // Initialize base class.
            super({
                derived: LinkElement,
            });
            // Set text.
            if (text !== undefined) {
                this.text(text);
            }
            // Set href.
            if (href !== undefined) {
                this.href(href);
            }
        }
    };
    return LinkElement = _classThis;
})();
export { LinkElement };
export const Link = Elements.wrapper(LinkElement);
export const NullLink = Elements.create_null(LinkElement);
