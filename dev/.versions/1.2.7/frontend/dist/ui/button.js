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
import { VDiv, CreateVElementClass } from "./element";
import { AnchorHStackElement } from "./stack";
import { RingLoader } from "./loaders";
// Button.
let ButtonElement = (() => {
    var _a;
    let _classDecorators = [(_a = Elements).register.bind(_a)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CreateVElementClass({
        type: "Button",
        tag: "a",
        // tag: "button",
        default_style: {
            "margin": "0px 0px 0px",
            "padding": "5px 10px 5px 10px",
            "outline": "none",
            "border": "none",
            "border-radius": "10px",
            "cursor": "pointer",
            "color": "inherit",
            "text-align": "center",
            "display": "grid",
            "align-items": "center",
            "white-space": "nowrap",
            "user-select": "none",
            "text-decoration": "none",
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
    });
    var ButtonElement = _classThis = class extends _classSuper {
        /**
         * @docs:
         * @nav: Frontend
         * @chapter: Buttons
         * @title: Button
         * @desc: Initializes the Button element with the provided text.
         * @param:
         *     @name: text
         *     @description The text to display on the button.
         */
        constructor(text) {
            super();
            this.inner_html(text);
        }
    };
    __setFunctionName(_classThis, "ButtonElement");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ButtonElement = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ButtonElement = _classThis;
})();
export { ButtonElement };
export const Button = Elements.wrapper(ButtonElement);
// BorderButton.
/**
 * Supports a gradient color for the border combined with border radius.
 * Warning: this class is still experimental and may be subject to future change.
 */
let BorderButtonElement = (() => {
    var _a;
    let _classDecorators = [(_a = Elements).register.bind(_a)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CreateVElementClass({
        type: "BorderButton",
        tag: "a",
        // tag: "button",
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
    });
    var BorderButtonElement = _classThis = class extends _classSuper {
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
        constructor(text) {
            // Initialize base classes.
            super();
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
            this.nodes.border.transition(typeof val !== "string" ? val : val.replace("border-color ", "background "));
            return this;
        }
    };
    __setFunctionName(_classThis, "BorderButtonElement");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        BorderButtonElement = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return BorderButtonElement = _classThis;
})();
export { BorderButtonElement };
export const BorderButton = Elements.wrapper(BorderButtonElement);
// Loader button.
/**
 * Warning: you should not use function "LoaderButton.loader.hide() / LoaderButton.loader.show()" use "LoaderButton.hide_loader() / LoaderButton.show_loader()" instead.
 * Warning: This class is still experimental and may be subject to future change.
 */
let LoaderButtonElement = (() => {
    var _a;
    let _classDecorators = [(_a = Elements).register.bind(_a)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = AnchorHStackElement;
    var LoaderButtonElement = _classThis = class extends _classSuper {
        /**
         * @docs:
         * @title: Loader Button Constructor
         * @desc: Initializes the LoaderButton element with the provided text and loader.
         * @param:
         *     @name: text
         *     @descr: The text to display on the loader button.
         *     @type: string
         * @param:
         *     @name: loader
         *     @descr: The loader function to create the loading animation.
         *     @type: Function
         * @return:
         *     @type: void
         *     @description This constructor does not return a value.
         */
        constructor(text = "", loader = RingLoader) {
            // Initialize base classes.
            super();
            // Set element type (must also be non member attr).
            this.element_type = "LoaderButton";
            // Set nodes type.
            this.nodes = {
                text: VDiv(),
                loader: loader(),
            };
            // Set default styling.
            this.styles(LoaderButtonElement.default_style);
            // Set style.
            this.wrap(false);
            this.center();
            this.center_vertical();
            // Children.
            this.nodes.loader
                .frame(LoaderButtonElement.default_style["--loader-width"], LoaderButtonElement.default_style["--loader-height"])
                .background("white")
                .update()
                .hide()
                .parent(this);
            this.nodes.text
                .text(text)
                .margin(0)
                .padding(0)
                .parent(this);
            // Add children.
            this.append(this.nodes.loader, this.nodes.text);
        }
        styles(style_dict) {
            if (style_dict == null) {
                let styles = super.styles();
                styles["--loader-width"] = this.nodes.loader.style.width || "20px";
                styles["--loader-height"] = this.nodes.loader.style.height || "20px";
                return styles;
            }
            else {
                return super.styles(style_dict);
            }
        }
        /**
         * @docs:
         * @title: Set Default
         * @desc: Sets the default configuration for the LoaderButtonElement by calling the parent method.
         * @return:
         *     @type: this
         *     @description Returns the instance of the element for chaining.
         */
        set_default() {
            return super.set_default(LoaderButtonElement);
        }
        /**
         * @docs:
         * @title: Show Loader
         * @desc: Displays the loader and disables the button when clicked.
         * @return:
         *     @type: this
         *     @description Returns the instance of the element for chaining.
         */
        show_loader() {
            this.disable();
            this.nodes.text.hide();
            this.nodes.loader.update();
            this.nodes.loader.show();
            return this;
        }
        /**
         * @docs:
         * @title: Start
         * @desc: Initiates the loading process by showing the loader.
         * @return:
         *     @type: this
         *     @description Returns the instance of the element for chaining.
         */
        // @ts-ignore
        start() {
            return this.show_loader();
        }
        /**
         * @docs:
         * @title: Hide Loader
         * @desc: Hides the loader, enables the button, and shows the text on click event.
         * @return:
         *     @type: this
         *     @description Returns the instance of the element for chaining.
         */
        hide_loader() {
            this.enable();
            this.nodes.loader.hide();
            this.nodes.text.show();
            return this;
        }
        stop() { return this.hide_loader(); }
    };
    __setFunctionName(_classThis, "LoaderButtonElement");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        LoaderButtonElement = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
    })();
    // Default styling.
    // static default_style = Object.assign({}, AnchorHStackElement.default_style, {
    _classThis.default_style = {
        ...AnchorHStackElement.default_style,
        "margin": "0px",
        "padding": "12.5px 10px 12.5px 10px",
        "border-radius": "25px",
        "cursor": "pointer",
        "background": "black",
        "color": "inherit",
        "font-size": "16px",
        "user-select": "none",
        "text-decoration": "none",
        // Custom.
        "--loader-width": "20px",
        "--loader-height": "20px",
    };
    _classThis.element_tag = "LoaderButton";
    (() => {
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return LoaderButtonElement = _classThis;
})();
export { LoaderButtonElement };
export const LoaderButton = Elements.wrapper(LoaderButtonElement);
