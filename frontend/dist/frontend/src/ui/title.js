/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
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
// Title.
const default_title_style = {
    "margin": "0px 0px 0px 0px",
    "color": "inherit",
    "white-space": "wrap",
    "text-align": "inherit",
    "font-weight": "700", // for safari since it inherits HTMLElement only.
};
let TitleElement = (() => {
    let _classDecorators = [Elements.create({
            name: "TitleElement",
            default_style: { ...default_title_style },
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VElementTagMap.h1;
    var TitleElement = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TitleElement = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        // Constructor.
        constructor(text = "") {
            // Initialize base class.
            super({
                derived: TitleElement,
            });
            // Set text.
            this.text(text); // do not use inner_html since the text might contain "<" etc.
        }
    };
    return TitleElement = _classThis;
})();
export { TitleElement };
export const Title = Elements.wrapper(TitleElement);
export const NullTitle = Elements.create_null(TitleElement);
// Subtitle.
let SubtitleElement = (() => {
    let _classDecorators = [Elements.create({
            name: "SubtitleElement",
            tag: "h2",
            default_style: { ...default_title_style },
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VElementTagMap.h1;
    var SubtitleElement = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SubtitleElement = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        // Constructor.
        constructor(text = "") {
            // Initialize base class.
            super({
                derived: SubtitleElement,
            });
            // Set text.
            this.text(text); // do not use inner_html since the text might contain "<" etc.
        }
    };
    return SubtitleElement = _classThis;
})();
export { SubtitleElement };
export const Subtitle = Elements.wrapper(SubtitleElement);
export const NullSubtitle = Elements.create_null(SubtitleElement);
/** A specific title ensured to use the `h1` html tag. */
let H1Element = (() => {
    let _classDecorators = [Elements.create({ name: "H1Element", tag: "h1", default_style: { ...default_title_style } })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VElementTagMap.h1;
    var H1Element = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            H1Element = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(text = "") {
            super({ derived: H1Element });
            this.text(text); // do not use inner_html since the text might contain "<" etc.
        }
    };
    return H1Element = _classThis;
})();
export { H1Element };
export const H1 = Elements.wrapper(H1Element);
export const NullH1 = Elements.create_null(H1Element);
/** A specific title ensured to use the `h2` html tag. */
let H2Element = (() => {
    let _classDecorators = [Elements.create({ name: "H2Element", tag: "h2", default_style: { ...default_title_style } })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VElementTagMap.h1;
    var H2Element = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            H2Element = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(text = "") {
            super({ derived: H2Element });
            this.text(text); // do not use inner_html since the text might contain "<" etc.
        }
    };
    return H2Element = _classThis;
})();
export { H2Element };
export const H2 = Elements.wrapper(H2Element);
export const NullH2 = Elements.create_null(H2Element);
/** A specific title ensured to use the `h3` html tag. */
let H3Element = (() => {
    let _classDecorators = [Elements.create({ name: "H3Element", tag: "h3", default_style: { ...default_title_style } })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VElementTagMap.h1;
    var H3Element = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            H3Element = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(text = "") {
            super({ derived: H3Element });
            this.text(text); // do not use inner_html since the text might contain "<" etc.
        }
    };
    return H3Element = _classThis;
})();
export { H3Element };
export const H3 = Elements.wrapper(H3Element);
export const NullH3 = Elements.create_null(H3Element);
/** A specific title ensured to use the `h4` html tag. */
let H4Element = (() => {
    let _classDecorators = [Elements.create({ name: "H4Element", tag: "h4", default_style: { ...default_title_style } })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VElementTagMap.h1;
    var H4Element = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            H4Element = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(text = "") {
            super({ derived: H4Element });
            this.text(text); // do not use inner_html since the text might contain "<" etc.
        }
    };
    return H4Element = _classThis;
})();
export { H4Element };
export const H4 = Elements.wrapper(H4Element);
export const NullH4 = Elements.create_null(H4Element);
/** A specific title ensured to use the `h5` html tag. */
let H5Element = (() => {
    let _classDecorators = [Elements.create({ name: "H5Element", tag: "h5", default_style: { ...default_title_style } })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VElementTagMap.h1;
    var H5Element = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            H5Element = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(text = "") {
            super({ derived: H5Element });
            this.text(text); // do not use inner_html since the text might contain "<" etc.
        }
    };
    return H5Element = _classThis;
})();
export { H5Element };
export const H5 = Elements.wrapper(H5Element);
export const NullH5 = Elements.create_null(H5Element);
/** A specific title ensured to use the `h6` html tag. */
let H6Element = (() => {
    let _classDecorators = [Elements.create({ name: "H6Element", tag: "h6", default_style: { ...default_title_style } })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VElementTagMap.h1;
    var H6Element = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            H6Element = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(text = "") {
            super({ derived: H6Element });
            this.text(text); // do not use inner_html since the text might contain "<" etc.
        }
    };
    return H6Element = _classThis;
})();
export { H6Element };
export const H6 = Elements.wrapper(H6Element);
export const NullH6 = Elements.create_null(H6Element);
