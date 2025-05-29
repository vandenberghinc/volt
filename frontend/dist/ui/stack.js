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
// Div element
// export const VDivElement = Elements.create({type: "Div", tag: "div"}); // should always remain a "div" since some elements like LoaderButton rely on the behaviour of a div.
// export type VDivElement = InstanceType<typeof VDivElement>;
// export const VDiv = Elements.wrapper(VDivElement);
// export const NullVDiv = Elements.create_null(VDivElement);
// declare module './any_element.d.ts' { interface AnyElementMap { VDivElement: VDivElement }}
// VStack.
let FrameElement = (() => {
    let _classDecorators = [Elements.create({
            name: "FrameElement",
            default_style: {
                // "position": "relative",
                "margin": "0px",
                "padding": "0px",
                // "clear": "both",
                "display": "block",
                "overflow": "hidden",
                "width": "100%", // to ensure its passed along all children.
            }
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VElementTagMap.div;
    var FrameElement = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            FrameElement = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        // Constructor.
        constructor(...children) {
            // Initialize base class.
            super({
                derived: FrameElement,
            });
            // Add children.
            this.append(...children);
        }
    };
    return FrameElement = _classThis;
})();
export { FrameElement };
export const Frame = Elements.wrapper(FrameElement);
export const NullFrame = Elements.create_null(FrameElement);
// VStack.
let VStackElement = (() => {
    let _classDecorators = [Elements.create({
            name: "VStackElement",
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
                "width": "100%", // to ensure its passed along all children.
            }
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VElementTagMap.div;
    var VStackElement = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            VStackElement = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        // Constructor.
        constructor(...children) {
            // Initialize base class.
            super({
                derived: VStackElement,
            });
            // Add children.
            this.append(...children);
        }
    };
    return VStackElement = _classThis;
})();
export { VStackElement };
export const VStack = Elements.wrapper(VStackElement);
export const NullVStack = Elements.create_null(VStackElement);
// AnchorVStack.
let AnchorVStackElement = (() => {
    let _classDecorators = [Elements.create({
            name: "AnchorVStackElement",
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
                "width": "100%", // to ensure its passed along all children.
                // After extending VStack.
                "color": "inherit", // inherit colors since <a> does not have that and a <div> does.
            },
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VElementTagMap.a;
    var AnchorVStackElement = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AnchorVStackElement = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        // Constructor.
        constructor(...children) {
            // Initialize base class.
            super({
                derived: AnchorVStackElement,
            });
            // Add children.
            this.append(...children);
        }
    };
    return AnchorVStackElement = _classThis;
})();
export { AnchorVStackElement };
export const AnchorVStack = Elements.wrapper(AnchorVStackElement);
export const NullAnchorVStack = Elements.create_null(AnchorVStackElement);
// const stack: VElement = new AnchorVStackElement();
// HStack.
let HStackElement = (() => {
    let _classDecorators = [Elements.create({
            name: "HStackElement",
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
                "width": "100%", // to ensure its passed along all children.
            },
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VElementTagMap.div;
    var HStackElement = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            HStackElement = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        ;
        // Constructor.
        constructor(...children) {
            // Initialize base class.
            super({
                derived: HStackElement,
            });
            // Add children.
            this.append(...children);
        }
    };
    return HStackElement = _classThis;
})();
export { HStackElement };
export const HStack = Elements.wrapper(HStackElement);
export const NullHStack = Elements.create_null(HStackElement);
// AnchorHStack
let AnchorHStackElement = (() => {
    let _classDecorators = [Elements.create({
            name: "AnchorHStackElement",
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
                "width": "100%", // to ensure its passed along all children.
                // After extending VStack.
                "color": "inherit", // inherit colors since <a> does not have that and a <div> does.
            },
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VElementTagMap.a;
    var AnchorHStackElement = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AnchorHStackElement = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        // Constructor.
        constructor(...children) {
            // Initialize base class.
            super({
                derived: AnchorHStackElement,
            });
            // Add children.
            this.append(...children);
        }
    };
    return AnchorHStackElement = _classThis;
})();
export { AnchorHStackElement };
export const AnchorHStack = Elements.wrapper(AnchorHStackElement);
export const NullAnchorHStack = Elements.create_null(AnchorHStackElement);
// ZStack.
let ZStackElement = (() => {
    let _classDecorators = [Elements.create({
            name: "ZStackElement",
            default_style: {
                // "position": "relative",
                "margin": "0px",
                "padding": "0px",
                "display": "grid",
                // "text-align": "start",
                "outline": "none", // otherwise the focus border might show up inside an animation when the href # hashtag id is loaded.
                "border": "none", // otherwise the focus border might show up inside an animation when the href # hashtag id is loaded.
                "width": "100%", // to ensure its passed along all children.
            },
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VElementTagMap.div;
    var ZStackElement = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZStackElement = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        // Constructor.
        constructor(...children) {
            // Initialize base class.
            super({
                derived: ZStackElement,
            });
            // Add children.
            this.zstack_append(children);
        }
        // Override append.
        append(...children) {
            return this.zstack_append(children);
        }
    };
    return ZStackElement = _classThis;
})();
export { ZStackElement };
export const ZStack = Elements.wrapper(ZStackElement);
export const NullZStack = Elements.create_null(ZStackElement);
