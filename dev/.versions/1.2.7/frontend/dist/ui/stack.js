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
import { CreateVElementClass } from "./element";
// VStack.
let FrameElement = (() => {
    var _a;
    let _classDecorators = [(_a = Elements).register.bind(_a)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CreateVElementClass({
        type: "Frame",
        tag: "div",
        default_style: {
            // "position": "relative",
            "margin": "0px",
            "padding": "0px",
            // "clear": "both",
            "display": "block",
            "overflow": "visible",
        },
    });
    var FrameElement = _classThis = class extends _classSuper {
        // Constructor.
        constructor(...children) {
            // Initialize base class.
            super();
            // Add children.
            this.append(...children);
        }
    };
    __setFunctionName(_classThis, "FrameElement");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        FrameElement = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return FrameElement = _classThis;
})();
export { FrameElement };
export const Frame = Elements.wrapper(FrameElement);
// VStack.
let VStackElement = (() => {
    var _a;
    let _classDecorators = [(_a = Elements).register.bind(_a)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CreateVElementClass({
        type: "VStack",
        tag: "div",
        default_style: {
            // "position": "relative",
            "margin": "0px",
            "padding": "0px",
            // "clear": "both",
            "display": "flex", // to support vertical spacers.
            "overflow": "visible",
            // "flex": "1", // disabled to support horizontal spacers in VStacks.
            "align-content": "flex-start", // align items at start, do not stretch / space when inside HStack.
            // "align-items": "flex-start", // otherwise the children automatically expand width to match the vstacks width.
            "flex-direction": "column",
            // "text-align": "start",
            "outline": "none", // otherwise the focus border might show up inside an animation when the href # hashtag id is loaded.
            "border": "none", // otherwise the focus border might show up inside an animation when the href # hashtag id is loaded.
        },
    });
    var VStackElement = _classThis = class extends _classSuper {
        // Constructor.
        constructor(...children) {
            // Initialize base class.
            super();
            // Add children.
            this.append(...children);
        }
    };
    __setFunctionName(_classThis, "VStackElement");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        VStackElement = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return VStackElement = _classThis;
})();
export { VStackElement };
export const VStack = Elements.wrapper(VStackElement);
// AnchorVStack.
let AnchorVStackElement = (() => {
    var _a;
    let _classDecorators = [(_a = Elements).register.bind(_a)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CreateVElementClass({
        type: "AnchorVStack",
        tag: "a",
        default_style: {
            // "position": "relative",
            "margin": "0px",
            "padding": "0px",
            // "clear": "both",
            "display": "flex", // to support vertical spacers.
            "overflow": "visible",
            // "flex": "1", // disabled to support horizontal spacers in VStacks.
            "align-content": "flex-start", // align items at start, do not stretch / space when inside HStack.
            // "align-items": "flex-start", // otherwise the children automatically expand width to match the vstacks width.
            "flex-direction": "column",
            // "text-align": "start",
            "outline": "none", // otherwise the focus border might show up inside an animation when the href # hashtag id is loaded.
            "border": "none", // otherwise the focus border might show up inside an animation when the href # hashtag id is loaded.
            "text-decoration": "none",
            // After extending VStack.
            "color": "inherit", // inherit colors since <a> does not have that and a <div> does.
        },
    });
    var AnchorVStackElement = _classThis = class extends _classSuper {
        // Constructor.
        constructor(...children) {
            // Initialize base class.
            super();
            // Add children.
            this.append(...children);
        }
    };
    __setFunctionName(_classThis, "AnchorVStackElement");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AnchorVStackElement = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AnchorVStackElement = _classThis;
})();
export { AnchorVStackElement };
export const AnchorVStack = Elements.wrapper(AnchorVStackElement);
// HStack.
let HStackElement = (() => {
    var _a;
    let _classDecorators = [(_a = Elements).register.bind(_a)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CreateVElementClass({
        type: "HStack",
        tag: "div",
        default_style: {
            // "position": "relative",
            "margin": "0px",
            "padding": "0px",
            // "clear": "both",
            "overflow-x": "visible",
            "overflow-y": "visible",
            // "text-align": "start",
            "display": "flex",
            "flex-direction": "row",
            "align-items": "flex-start", // disable the auto extending of the childs height to the max child height.
            // "flex": "1", // disabled to support horizontal spacers in VStacks.
            "flex:": "1 1 auto", // prevent children from exceeding its max width, @warning do not remove this cause it can produce some nasty overflow bugs, so if you want to remove it create an function to optionally remove it.
            "outline": "none", // otherwise the focus border might show up inside an animation when the href # hashtag id is loaded.
            "border": "none", // otherwise the focus border might show up inside an animation when the href # hashtag id is loaded.
        },
    });
    var HStackElement = _classThis = class extends _classSuper {
        // Constructor.
        constructor(...children) {
            // Initialize base class.
            super();
            // Add children.
            this.append(...children);
        }
    };
    __setFunctionName(_classThis, "HStackElement");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        HStackElement = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return HStackElement = _classThis;
})();
export { HStackElement };
export const HStack = Elements.wrapper(HStackElement);
// AnchorHStack.
let AnchorHStackElement = (() => {
    var _a;
    let _classDecorators = [(_a = Elements).register.bind(_a)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CreateVElementClass({
        type: "AnchorHStack",
        tag: "a",
        default_style: {
            // "position": "relative",
            "margin": "0px",
            "padding": "0px",
            // "clear": "both",
            "overflow-x": "visible",
            "overflow-y": "visible",
            // "text-align": "start",
            "display": "flex",
            "flex-direction": "row",
            "align-items": "flex-start", // disable the auto extending of the childs height to the max child height.
            // "flex": "1", // disabled to support horizontal spacers in VStacks.
            "flex:": "1 1 auto", // prevent children from exceeding its max width, @warning do not remove this cause it can produce some nasty overflow bugs, so if you want to remove it create an function to optionally remove it.
            "outline": "none", // otherwise the focus border might show up inside an animation when the href # hashtag id is loaded.
            "border": "none", // otherwise the focus border might show up inside an animation when the href # hashtag id is loaded.
            "text-decoration": "none",
            // After extending VStack.
            "color": "inherit", // inherit colors since <a> does not have that and a <div> does.
        },
    });
    var AnchorHStackElement = _classThis = class extends _classSuper {
        // Constructor.
        constructor(...children) {
            // Initialize base class.
            super();
            // Add children.
            this.append(...children);
        }
    };
    __setFunctionName(_classThis, "AnchorHStackElement");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AnchorHStackElement = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AnchorHStackElement = _classThis;
})();
export { AnchorHStackElement };
export const AnchorHStack = Elements.wrapper(AnchorHStackElement);
// ZStack.
let ZStackElement = (() => {
    var _a;
    let _classDecorators = [(_a = Elements).register.bind(_a)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CreateVElementClass({
        type: "ZStack",
        tag: "div",
        default_style: {
            // "position": "relative",
            "margin": "0px",
            "padding": "0px",
            "display": "grid",
            // "text-align": "start",
            "outline": "none", // otherwise the focus border might show up inside an animation when the href # hashtag id is loaded.
            "border": "none", // otherwise the focus border might show up inside an animation when the href # hashtag id is loaded.
        },
    });
    var ZStackElement = _classThis = class extends _classSuper {
        // Constructor.
        constructor(...children) {
            // Initialize base class.
            super();
            // Add children.
            this.zstack_append(...children);
        }
        // Override append.
        append(...children) {
            return this.zstack_append(...children);
        }
    };
    __setFunctionName(_classThis, "ZStackElement");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ZStackElement = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ZStackElement = _classThis;
})();
export { ZStackElement };
export const ZStack = Elements.wrapper(ZStackElement);
