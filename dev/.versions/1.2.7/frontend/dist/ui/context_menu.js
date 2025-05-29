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
import { VStackElement } from "./stack";
import { Button } from "./button";
// Button.
let ContextMenuElement = (() => {
    var _a;
    let _classDecorators = [(_a = Elements).register.bind(_a)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VStackElement;
    var ContextMenuElement = _classThis = class extends _classSuper {
        // Constructor.
        // The content may either be an array with nodes, or an array with object like {label: ..., on_click: (element, event) => {}, on_render: (element) => {}}.
        // A node / object may also be "null" and it will be ignored.
        constructor(content) {
            // Initialize base classes.
            super();
            // Set element type.
            this.element_type = "ContextMenu";
            // Append content.
            content.iterate((item) => {
                if (item == null) {
                    return null;
                }
                else if (!(item instanceof HTMLElement)) {
                    const button = Button(item.label)
                        .padding(5, 10, 5, 10)
                        .margin(0)
                        .font_size(12)
                        .leading()
                        .background("#FFFFFF15")
                        .border_radius(0);
                    if (typeof item.on_click === "function") {
                        button.on_click((element, event) => item.on_click(element, event, this));
                    }
                    if (typeof item.on_render === "function") {
                        button.on_render((element) => item.on_render(element));
                    }
                    this.append(button);
                }
                else {
                    this.append(item);
                }
            });
            // Set styling
            this
                .z_index(2) // one higher than sidebar.
                .padding(5, 0, 5, 0)
                .color("white")
                .background("gray")
                .box_shadow("0px 0px 10px #00000050")
                .border_radius(10)
                .min_width(150);
            // Remove child callback.
            this.remove_child_callback = (event) => {
                if (!this.contains(event.target)) {
                    this.remove();
                }
                document.body.removeEventListener("mousedown", this.remove_child_callback);
            };
        }
        // Set default since it inherits an element.
        set_default() {
            return super.set_default(ContextMenuElement);
        }
        // Popup the context menu by a event.
        popup(event) {
            // Prevent default.
            event.preventDefault();
            // Show.
            super.show();
            // Set position.
            this.position(event.clientY, undefined, undefined, event.clientX);
            // Add child.
            document.body.appendChild(this);
            // Add event listener to body.
            document.body.addEventListener("mousedown", this.remove_child_callback);
            // Response.
            return this;
        }
        // Close the context menu.
        close() {
            // Remove from content.
            super.remove();
            // Remove event listener from body.
            document.body.removeEventListener("mousedown", this.remove_child_callback);
            // Response.
            return this;
        }
        remove() {
            // Remove from content.
            super.remove();
            // Remove event listener from body.
            document.body.removeEventListener("mousedown", this.remove_child_callback);
            // Response.
            return this;
        }
    };
    __setFunctionName(_classThis, "ContextMenuElement");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ContextMenuElement = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ContextMenuElement = _classThis;
})();
export { ContextMenuElement };
export const ContextMenu = Elements.wrapper(ContextMenuElement);
