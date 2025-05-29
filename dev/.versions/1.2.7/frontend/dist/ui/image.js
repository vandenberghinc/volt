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
import { Utils } from "../modules/utils";
import { Elements } from "../modules/elements";
import { Statics } from "../modules/statics";
import { Settings } from "../modules/settings";
import { CreateVElementClass } from "./element";
import { AnchorElement } from "./link";
import { VStack } from "./stack";
// Image.
let ImageElement = (() => {
    var _a;
    let _classDecorators = [(_a = Elements).register.bind(_a)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CreateVElementClass({
        type: "Image",
        tag: "img",
        default_style: {
            "margin": "0px",
            "padding": "0px",
            "object-fit": "cover",
        },
    });
    var ImageElement = _classThis = class extends _classSuper {
        // Constructor.
        constructor(src, alt) {
            // Initialize base class.
            super();
            // Safari does not render images correctly for custom elements.
            if (Utils.is_safari) {
                this.attachShadow({ mode: 'open' });
                this._e = document.createElement("img");
                this._e.style.objectFit = "cover";
                this._e.style.width = "100%";
                this._e.style.height = "100%";
                this.shadowRoot.appendChild(this._e);
                this.position("relative"); // for img width height 100%
                this.overflow("hidden"); // for border radius.
                // Set resize event otherwise when the item resizes the shadow image does not.
                // this.on_resize(() => {
                // 	this._e.style.width = this.style.width;
                // 	this._e.style.height = this.style.height;
                // 	// this._e.style.width = "100%";
                // 	// this._e.style.height = "100%";
                // })
            }
            // Set alt.
            if (alt != null) {
                this.alt(alt);
            }
            else if (ImageElement.default_alt != null) {
                this.alt(ImageElement.default_alt);
            }
            // Set default aspect ratio.
            if (src) {
                this.src(src);
                const aspect_ratio = Statics.aspect_ratio(src);
                if (aspect_ratio != null) {
                    this.aspect_ratio(aspect_ratio);
                }
                else if (!Settings.production && Object.keys(Statics.aspect_ratios).length > 0 && src.charAt(0) === "/") {
                    console.error(new Error(`[vweb development] Unable to find the aspect ratio for source "${src}".`));
                }
            }
        }
        // Set the current element as the default.
        set_default() {
            super.set_default(ImageElement);
            const alt = this.alt();
            if (alt != null) {
                ImageElement.default_alt = alt;
            }
            return this;
        }
        src(value) {
            if (this._e === undefined) {
                return super.src(value);
            }
            if (value == null) {
                return this._e.src;
            }
            this._e.src = value;
            return this;
        }
        alt(value) {
            if (this._e === undefined) {
                return super.alt(value);
            }
            if (value == null) {
                return this._e.alt;
            }
            this._e.alt = value;
            return this;
        }
        completed(value) {
            if (this._e === undefined) {
                return super.completed;
            }
            return this._e.completed;
        }
        height(value, check_attribute = true) {
            if (this._e === undefined) {
                return super.height(value, check_attribute);
            }
            if (value == null) {
                return this._e.height;
            }
            // Assign percentage values to the root.
            if (typeof value === "string" && value.includes("%")) {
                super.height(value, false); // deprecated 
            }
            else {
                this._e.style.height = this.pad_numeric(value, "px");
                this._e.height = this.pad_numeric(value, "");
            }
            return this;
        }
        min_height(value) {
            if (this._e === undefined) {
                return super.min_height(value);
            }
            if (value == null) {
                return this._e.style.minHeight;
            }
            // Assign percentage values to the root.
            if (typeof value === "string" && value.includes("%")) {
                super.min_height(value);
            }
            else {
                this._e.style.minHeight = this.pad_numeric(value, "px");
            }
            return this;
        }
        max_height(value) {
            if (this._e === undefined) {
                return super.max_height(value);
            }
            if (value == null) {
                return this._e.style.maxHeight;
            }
            // Assign percentage values to the root.
            if (typeof value === "string" && value.includes("%")) {
                super.max_height(value);
            }
            else {
                this._e.style.maxHeight = this.pad_numeric(value, "px");
            }
            return this;
        }
        width(value, check_attribute = true) {
            if (this._e === undefined) {
                return super.width(value, check_attribute);
            }
            if (value == null) {
                return this._e.width;
            }
            // Assign percentage values to the root.
            if (typeof value === "string" && value.includes("%")) {
                super.width(value, false);
            }
            else {
                this._e.style.width = this.pad_numeric(value, "px");
                this._e.width = value;
            }
            return this;
        }
        min_width(value) {
            if (this._e === undefined) {
                return super.min_width(value);
            }
            if (value == null) {
                return this._e.style.minWidth;
            }
            // Assign percentage values to the root.
            if (typeof value === "string" && value.includes("%")) {
                super.min_width(value);
            }
            else {
                this._e.style.minWidth = this.pad_numeric(value, "px");
            }
            return this;
        }
        max_width(value) {
            if (this._e === undefined) {
                return super.max_width(value);
            }
            if (value == null) {
                return this._e.style.maxWidth;
            }
            // Assign percentage values to the root.
            if (typeof value === "string" && value.includes("%")) {
                super.max_width(value);
            }
            else {
                this._e.style.maxWidth = this.pad_numeric(value, "px");
            }
            return this;
        }
        loading(value) {
            if (this._e === undefined) {
                if (value == null) {
                    return this.getAttribute("loading") ?? "";
                }
                this.setAttribute("loading", value);
                return this;
            }
            if (value == null) {
                return this._e.getAttribute("loading") ?? "";
            }
            this._e.setAttribute("loading", value);
            return this;
        }
    };
    __setFunctionName(_classThis, "ImageElement");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ImageElement = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ImageElement = _classThis;
})();
export { ImageElement };
export const Image = Elements.wrapper(ImageElement);
// function Image(...args) {
// 	if (Utils.is_safari) {
// 		const e = document.createElement(ImageElement.element_tag, {is: "v-" + ImageElement.name.toLowerCase()})
// 		console.log("E", e.prototype);
// 		e._init(...args);
// 		return e;
// 	} else {
// 		return new ImageElement(...args);
// 	}
// }
// AnchorImage.
let AnchorImageElement = (() => {
    var _a;
    let _classDecorators = [(_a = Elements).register.bind(_a)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = AnchorElement;
    var AnchorImageElement = _classThis = class extends _classSuper {
        // Constructor.
        constructor(href, src, alt) {
            // Initialize base classes.
            super(href, alt);
            // image.
            this.image = Image(src, alt)
                .parent(this);
            // Append.
            this.append(this.image);
        }
        // Set default since it inherits AnchorElement.
        set_default() {
            return super.set_default(AnchorImage);
        }
        src(value) { if (value == null) {
            return this.image.src();
        } this.image.src(value); return this; }
        alt(value) { if (value == null) {
            return this.image.alt();
        } this.image.alt(value); return this; }
        completed(value) { if (value == null) {
            return this.image.completed();
        } this.image.completed(value); return this; }
        height(value) { if (value == null) {
            return this.image.height();
        } this.image.height(value); return this; }
        min_height(value) { if (value == null) {
            return this.image.min_height();
        } this.image.min_height(value); return this; }
        max_height(value) { if (value == null) {
            return this.image.max_height();
        } this.image.max_height(value); return this; }
        width(value) { if (value == null) {
            return this.image.width();
        } this.image.width(value); return this; }
        min_width(value) { if (value == null) {
            return this.image.min_width();
        } this.image.min_width(value); return this; }
        max_width(value) { if (value == null) {
            return this.image.max_width();
        } this.image.max_width(value); return this; }
        loading(value) { if (value == null) {
            return this.image.loading();
        } this.image.loading(value); return this; }
    };
    __setFunctionName(_classThis, "AnchorImageElement");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AnchorImageElement = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
    })();
    // Default styling.
    _classThis.default_style = {
        ...AnchorElement.default_style,
    };
    (() => {
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AnchorImageElement = _classThis;
})();
export { AnchorImageElement };
export const AnchorImage = Elements.wrapper(AnchorImageElement);
// ImageMask.
let ImageMaskElement = (() => {
    var _a;
    let _classDecorators = [(_a = Elements).register.bind(_a)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CreateVElementClass({
        type: "ImageMask",
        tag: "div",
        default_style: {
            "margin": "0px",
            "padding": "0px",
            "object-fit": "cover",
            "display": "inline-block",
            // Anchor.
            "font-family": "inherit",
            "font-size": "inherit",
            "color": "inherit",
            "text-decoration": "none",
            "text-underline-position": "none",
            "outline": "none",
            "border": "none",
        },
    });
    var ImageMaskElement = _classThis = class extends _classSuper {
        // Constructor.
        constructor(src) {
            // Initialize base class.
            super();
            // Append child.
            this.mask_child = VStack()
                .parent(this)
                // .position(0, 0, 0, 0)
                .width("100%")
                .height("100%")
                .background("black");
            if (src != null) {
                this.mask_child.mask("url('" + src + "') no-repeat center/contain");
            }
            // this.position("relative");
            this.append(this.mask_child);
            // Set src.
            this.src(src);
            // Set default aspect ratio.
            if (src) {
                const aspect_ratio = Statics.aspect_ratio(src);
                if (aspect_ratio != null) {
                    this.aspect_ratio(aspect_ratio);
                }
                else if (!Settings.production && Object.keys(Statics.aspect_ratios).length > 0 && src.charAt(0) === "/") {
                    console.error(new Error(`[vweb development] Unable to find the aspect ratio for source "${src}".`));
                }
            }
        }
        mask_color(value) {
            if (value == null) {
                return this.mask_child.style.background;
            }
            this.mask_child.style.background = value;
            return this;
        }
        color(value) {
            return this.mask_color(value);
        }
        transition_mask(value) {
            if (value == null) {
                return this.mask_child.transition() ?? "";
            }
            this.mask_child.transition(value);
            return this;
        }
        src(value) {
            if (value == null) {
                return this._src ?? "";
            }
            this.mask_child.mask("url('" + value + "') no-repeat center/contain");
            this._src = value;
            return this;
        }
        mask(value) {
            if (value == null) {
                return this.mask_child.mask();
            }
            this.mask_child.mask(value);
            return this;
        }
    };
    __setFunctionName(_classThis, "ImageMaskElement");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ImageMaskElement = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ImageMaskElement = _classThis;
})();
export { ImageMaskElement };
export const ImageMask = Elements.wrapper(ImageMaskElement);
// Exact copy of image mask.
let AnchorImageMaskElement = (() => {
    var _a;
    let _classDecorators = [(_a = Elements).register.bind(_a)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CreateVElementClass({
        type: "AnchorImageMask",
        tag: "a",
        default_style: {
            "margin": "0px",
            "padding": "0px",
            "object-fit": "cover",
            "display": "inline-block",
            // Anchor.
            "font-family": "inherit",
            "font-size": "inherit",
            "color": "inherit",
            "text-decoration": "none",
            "text-underline-position": "none",
            "cursor": "pointer",
            "outline": "none",
            "border": "none",
        },
    });
    var AnchorImageMaskElement = _classThis = class extends _classSuper {
        // Constructor.
        constructor(src) {
            // Initialize base class.
            super();
            // Append child.
            this.mask_child = VStack()
                // .position(0, 0, 0, 0)
                .width("100%")
                .height("100%")
                .background("black");
            if (src != null) {
                this.mask_child.mask("url('" + src + "') no-repeat center/contain");
            }
            // this.position("relative");
            this.append(this.mask_child);
            // Set src.
            this.src(src);
            // Set default aspect ratio.
            if (src) {
                const aspect_ratio = Statics.aspect_ratio(src);
                if (aspect_ratio != null) {
                    this.aspect_ratio(aspect_ratio);
                }
                else if (!Settings.production && Object.keys(Statics.aspect_ratios).length > 0 && src.charAt(0) === "/") {
                    console.error(new Error(`[vweb development] Unable to find the aspect ratio for source "${src}".`));
                }
            }
        }
        mask_color(value) {
            if (value == null) {
                return this.mask_child.style.background;
            }
            this.mask_child.style.background = value;
            return this;
        }
        color(value) {
            return this.mask_color(value);
        }
        src(value) {
            if (value == null) {
                return this._src ?? "";
            }
            this.mask_child.mask("url('" + value + "') no-repeat center/contain");
            this._src = value;
            return this;
        }
        mask(value) {
            if (value == null) {
                return this.mask_child.mask();
            }
            this.mask_child.mask(value);
            return this;
        }
    };
    __setFunctionName(_classThis, "AnchorImageMaskElement");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AnchorImageMaskElement = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AnchorImageMaskElement = _classThis;
})();
export { AnchorImageMaskElement };
export const AnchorImageMask = Elements.wrapper(AnchorImageMaskElement);
