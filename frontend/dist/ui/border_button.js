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
import { Elements, VDiv, VElementTagMap } from "../elements/module.js";
// BorderButton.
/**
 * Supports a gradient color for the border combined with border radius.
 * Warning: this class is still experimental and may be subject to future change.
 */
let BorderButtonElement = (() => {
    let _classDecorators = [Elements.create({
            name: "BorderButtonElement",
            default_style: {
                "margin": "0px 0px 0px 0px",
                "display": "inline-block",
                "color": "inherit",
                "text-align": "center",
                "cursor": "pointer",
                "position": "relative",
                "z-index": "0",
                "background": "none",
                "user-select": "none",
                "outline": "none",
                "border": "none",
                "text-decoration": "none",
                // Custom.
                "--child-color": "black",
                "--child-background": "black",
                "--child-border-width": "2px",
                "--child-border-radius": "10px",
                "--child-padding": "5px 10px 5px 10px",
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
    var BorderButtonElement = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BorderButtonElement = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        nodes;
        /**
         * @docs:
         * @title: Constructor
         * @desc: Initializes a new instance of the BorderButton element with the provided text.
         * @param:
         *     @name: text
         *     @descr: The text to be displayed on the BorderButton.
         *     @type: string
         * @return:
         *     @type: void
         *     @description This constructor does not return a value.
         */
        constructor(text = "") {
            // Initialize base classes.
            super({
                derived: BorderButtonElement,
            });
            // Set nodes type.
            this.nodes = {
                border: VDiv(),
                text: VDiv(),
            };
            // Set default styling.
            // let styles = { ...BorderButton.default_style };
            // delete styles["--child-color"];
            // delete styles["--child-background"];
            // delete styles["--child-border-width"];
            // delete styles["--child-padding"];
            // delete styles["--child-background-image"];
            // delete styles["--child-background-clip"];
            // delete styles["--child-webkit-background-clip"];
            // this.styles(styles);
            // Border child so it can support border gradients.
            this.nodes.border
                .content("")
                .position("absolute")
                // .z_index(-1)
                .inset(0)
                .padding(BorderButtonElement.default_style["--child-border-width"])
                .border_radius(BorderButtonElement.default_style["--child-border-radius"])
                .background(BorderButtonElement.default_style["--child-background"])
                .mask("linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)")
                .mask_composite("exclude")
                // .mask_composite((navigator.userAgent.includes("Firefox") || navigator.userAgent.includes("Mozilla")) ? "exclude" : "xor")
                .styles({
                "-webkit-mask": "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                "-webkit-mask-composite": (navigator.userAgent.includes("Firefox") || navigator.userAgent.includes("Mozilla")) ? "exclude" : "xor",
            });
            // Text child.
            // do not use a Text object since inheritance of text styling is required.
            this.nodes.text
                .color(BorderButtonElement.default_style["--child-color"])
                .append(text);
            if (BorderButtonElement.default_style["--child-color"] == "transparent") {
                this.nodes.text.style.backgroundImage = BorderButtonElement.default_style["--child-background-image"];
                this.nodes.text.style.backgroundClip = BorderButtonElement.default_style["--child-background-clip"];
                this.nodes.text.style["-webkit-background-clip"] = BorderButtonElement.default_style["--child-webkit-background-clip"];
            }
            // Append.
            this.append(this.nodes.border, this.nodes.text);
        }
        gradient(value) {
            if (value == null) {
                return this.nodes.border.background();
            }
            this.nodes.border.background(value);
            return this;
        }
        border_color(value) {
            if (value == null) {
                return this.nodes.border.background();
            }
            this.nodes.border.background(value);
            return this;
        }
        border_width(value) {
            if (value == null) {
                return this.nodes.border.padding();
            }
            this.nodes.border.padding(value);
            return this;
        }
        border_radius(value) {
            if (value == null) {
                return this.nodes.border.border_radius();
            }
            super.border_radius(value);
            this.nodes.border.border_radius(value);
            return this;
        }
        color(value) {
            if (value == null) {
                return this.nodes.text.color() ?? "";
            }
            this.nodes.text.color(value);
            return this;
        }
        styles(style_dict) {
            if (style_dict == null) {
                let styles = super.styles();
                styles["--child-background"] = this.nodes.border.background();
                styles["--child-border-width"] = this.nodes.border.padding();
                styles["--child-border-radius"] = this.nodes.border.border_radius();
                styles["--child-color"] = this.nodes.text.color();
                styles["--child-background-image"] = this.nodes.text.style.backgroundImage;
                styles["--child-background-clip"] = this.nodes.text.style.backgroundClip;
                styles["--child-webkit-background-clip"] = this.nodes.text.style["-webkit-background-clip"];
                return styles;
            }
            else {
                return super.styles(style_dict);
            }
        }
        // @ts-ignore
        text(val) {
            if (val == null) {
                return this.nodes.text.text();
            }
            this.nodes.text.text(val);
            return this;
        }
        transition_border_color(val) {
            if (val == null) {
                return this.nodes.border.transition();
            }
            else if (/[0-9]/.test(val.charAt(0))) {
                val = "border-color " + val;
            }
            this.nodes.border.transition(typeof val !== "string" ? val : val.replace("border-color ", "background "));
            return this;
        }
    };
    return BorderButtonElement = _classThis;
})();
export { BorderButtonElement };
export const BorderButton = Elements.wrapper(BorderButtonElement);
export const NullBorderButton = Elements.create_null(BorderButtonElement);
