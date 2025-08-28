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
import * as vlib from "@vandenberghinc/vlib/frontend";
// Imports.
import { Elements, VElementTagMap } from "../elements/module.js";
// Divider.
let PseudoElement = (() => {
    let _classDecorators = [Elements.create({
            name: "PseudoElement",
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VElementTagMap.div;
    var PseudoElement = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            PseudoElement = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        /**
         * The pseudo id used for creating a css class.
         * @note This id should be suffixed with the pseudo class type, e.g. `pseudo_1234_before`.
         */
        base_pseudo_id = "pseudo_" + vlib.String.random(24);
        /** The stylesheet per `before` `after` etc. */
        pseudo_classes = {};
        /** A list of elements this pseudo element is applied to */
        added_to_elements = [];
        constructor(...children) {
            super({ derived: PseudoElement, });
            // Append.
            this.append(...children);
        }
        /** Retrieve a pseudo id suffixed with a specific type. */
        pseudo_id(type) {
            return this.base_pseudo_id + "_" + type;
        }
        /** Apply the pseudo to a node for a specific psuedo class. */
        apply(node, type) {
            /** Add a node to the {@link added_to_elements} list, if not already added. */
            const already_added = this.added_to_elements.some(i => i.node === node && i.type === type);
            if (!already_added) {
                this.added_to_elements.push({
                    node: node,
                    type: type,
                });
            }
            /** Add a stylesheet for a given pseudo element class, or update it when already present. */
            const pseudo_id = this.pseudo_id(type);
            const css = `.${pseudo_id}::${type}{${this.style.cssText};}`;
            let style = this.pseudo_classes[type];
            if (style) {
                if (style.sheet) {
                    style.sheet.deleteRule(0);
                    style.sheet.insertRule(css, 0);
                }
            }
            else {
                style = document.createElement('style');
                style.type = 'text/css';
                document.head.appendChild(style); // append before insertRule
                if (style.sheet) {
                    style.sheet.insertRule(css, 0);
                }
                this.pseudo_classes[type] = style;
            }
            // Add class.
            node.classList.add(pseudo_id);
            // Response.
            return this;
        }
        /** Alias method for {@link apply}. */
        add(node, type) {
            return this.apply(node, type);
        }
        /** Remove the pseudo effect from a node if applied. */
        remove_from(node, type) {
            node.classList.remove(this.pseudo_id(type));
            return this;
        }
        /** Remove all pseudo effects from a given node. */
        remove_all(node) {
            node.classList.forEach(name => {
                if (name.startsWith("pseudo_")) {
                    node.classList.remove(name);
                }
            });
            return this;
        }
        /** Is added to. */
        is_applied_to(node, type) {
            return this.added_to_elements.some(i => i.node === node && i.type === type);
        }
        /** Alias method for {@link is_applied_to}. */
        is_added_to(node, type) {
            return this.added_to_elements.some(i => i.node === node && i.type === type);
        }
        /** Update the pseudo on all applied elements. */
        update() {
            for (const [type, style] of Object.entries(this.pseudo_classes)) {
                if (style.sheet == null)
                    continue;
                const css = `.${this.pseudo_id}::${type}{${this.style.cssText};}`;
                style.sheet.deleteRule(0);
                style.sheet.insertRule(css, 0);
            }
            return this;
        }
    };
    return PseudoElement = _classThis;
})();
export { PseudoElement };
export const Pseudo = Elements.wrapper(PseudoElement);
export const NullPseudo = Elements.create_null(PseudoElement);
