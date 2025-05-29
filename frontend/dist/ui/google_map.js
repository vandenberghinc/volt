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
import { Utils } from "../modules/utils.js";
import { Google } from "../modules/google";
// GoogleMap.
let GoogleMapElement = (() => {
    let _classDecorators = [Elements.create({
            name: "GoogleMapElement",
            default_style: {
                "border": "0",
            },
            default_attributes: {
                "width": "100%",
                "height": "100%",
                "frameborder": "0",
                "style": "border:0",
                "referrerpolicy": "no-referrer-when-downgrade",
                "allowfullscreen": "true",
            },
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VElementTagMap.iframe;
    var GoogleMapElement = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            GoogleMapElement = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        // Constructor.
        constructor({ location, mode = "place", api_key, }) {
            // Initialize base class.
            super({
                derived: GoogleMapElement,
            });
            // Set source.
            this.src("https://www.google.com/maps/embed/v1/" + mode + "?key=" + (api_key ?? Google.cloud.api_key) + "&" + Utils.url_encode({ "q": location.replaceAll(' ', '+') }));
        }
        // Update.
        // Needs to be called after initialing or changing the loader.
        update() {
            this.remove_children();
            const children_style = {
                "width": "calc(" + this.style.width + " * (64.0px / 80.0px))",
                "height": "calc(" + this.style.height + " * (64.0px / 80.0px))",
                "margin": "calc(" + this.style.width + " * (8.0px / 80.0px))",
                "border": "calc(" + this.style.width + " * (8.0px / 80.0px)) solid " + this.style.background,
                "border-color": this.style.background + " transparent transparent transparent",
            };
            for (let i = 0; i < 4; i++) {
                let e = document.createElement("div");
                for (let attr in children_style) {
                    e.style[attr] = children_style[attr];
                }
                this.append(e);
            }
            return this;
        }
    };
    return GoogleMapElement = _classThis;
})();
export { GoogleMapElement };
export const GoogleMap = Elements.wrapper(GoogleMapElement);
export const NullGoogleMap = Elements.create_null(GoogleMapElement);
