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
import { Scheme } from "../modules/scheme";
import { CreateVElementClass } from "./element";
// List item.
let ListItemElement = (() => {
    var _a;
    let _classDecorators = [(_a = Elements).register.bind(_a)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CreateVElementClass({
        type: "ListItem",
        tag: "li",
        default_style: {},
    });
    var ListItemElement = _classThis = class extends _classSuper {
        // Constructor.
        constructor(...content) {
            // Initialize base class.
            super();
            // Append content.
            this.append(...content);
        }
    };
    __setFunctionName(_classThis, "ListItemElement");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ListItemElement = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ListItemElement = _classThis;
})();
export { ListItemElement };
export const ListItem = Elements.wrapper(ListItemElement);
// Unordered List.
let UnorderedListElement = (() => {
    var _a;
    let _classDecorators = [(_a = Elements).register.bind(_a)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CreateVElementClass({
        type: "UnorderedList",
        tag: "ul",
        default_style: {},
    });
    var UnorderedListElement = _classThis = class extends _classSuper {
        // Constructor.
        constructor(items = []) {
            // Initialize base class.
            super();
            // Add items.
            if (Array.isArray(items)) {
                items.iterate(node => { this.append_item(node); });
            }
            else {
                console.error(`Invalid type "${Scheme.value_type(items)}" for parameter "items" the valid type is "array".`);
            }
        }
        // Append item.
        append_item(content) {
            if (!(content instanceof ListItemElement)) {
                content = ListItem(content);
            }
            this.append(content);
            return this;
        }
    };
    __setFunctionName(_classThis, "UnorderedListElement");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        UnorderedListElement = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return UnorderedListElement = _classThis;
})();
export { UnorderedListElement };
export const UnorderedList = Elements.wrapper(UnorderedListElement);
// Ordered List.
let OrderedListElement = (() => {
    var _a;
    let _classDecorators = [(_a = Elements).register.bind(_a)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CreateVElementClass({
        type: "OrderedList",
        tag: "ol",
        default_style: {},
    });
    var OrderedListElement = _classThis = class extends _classSuper {
        // Constructor.
        constructor(items = []) {
            // Initialize base class.
            super();
            // Add items.
            if (Array.isArray(items)) {
                items.iterate(node => { this.append_item(node); });
            }
            else {
                console.error(`Invalid type "${Scheme.value_type(items)}" for parameter "items" the valid type is "array".`);
            }
        }
        // Append item.
        append_item(content) {
            if (!(content instanceof ListItemElement)) {
                content = ListItem(content);
            }
            this.append(content);
            return this;
        }
    };
    __setFunctionName(_classThis, "OrderedListElement");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        OrderedListElement = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return OrderedListElement = _classThis;
})();
export { OrderedListElement };
export const OrderedList = Elements.wrapper(OrderedListElement);
