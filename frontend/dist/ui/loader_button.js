/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
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
import { Elements, VDiv } from "../elements/module.js";
import { AnchorHStackElement } from "./stack";
import { RingLoader } from "./loaders";
// export class myClass extends AnchorHStackElement {
//     constructor() { super(); }
// }
// Loader button.
/**
 * @warning: you should not use function "LoaderButton.loader.hide() / LoaderButton.loader.show()" use "LoaderButton.hide_loader() / LoaderButton.show_loader()" instead.
 * @warning: This class is still experimental and may be subject to future change.
 */
let LoaderButtonElement = (() => {
    let _classDecorators = [Elements.create({
            name: "LoaderButtonElement",
            default_style: {
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
            }
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = AnchorHStackElement;
    var LoaderButtonElement = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            LoaderButtonElement = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        // Attributes.
        nodes;
        // @ts-ignore
        text;
        loader;
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
            this._init({
                derived: LoaderButtonElement,
            });
            // Set nodes type.
            this.text = VDiv();
            this.loader = loader();
            this.nodes = {
                // @deprecated the `nodes` object is deprecated but keep for backward compatability.
                text: this.text,
                loader: this.loader,
            };
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
    return LoaderButtonElement = _classThis;
})();
export { LoaderButtonElement };
export const LoaderButton = Elements.wrapper(LoaderButtonElement);
export const NullLoaderButton = Elements.create_null(LoaderButtonElement);
