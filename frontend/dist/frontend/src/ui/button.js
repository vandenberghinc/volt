/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
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
import { Elements, VElementTagMap, isVElement, VDiv } from "../elements/module.js";
import { BorderButtonElement } from "./border_button.js";
import { GradientBorder } from "./gradient.js";
import { ImageMask } from "./image.js";
import { RingLoader } from "./loaders.js";
import { Span } from "./span.js";
import { AnchorHStackElement, Frame } from "./stack.js";
/**
 * Is any button like,
 * including loader and bordered buttons.
 */
export function isButtonLike(element) {
    return (element instanceof ButtonElement
        || element instanceof LoaderButtonElement
        || element instanceof BorderButtonElement
        || element instanceof ExtendedButtonElement) || (isVElement(element) && (element.element_name === "ButtonElement"
        || element.element_name === "LoaderButtonElement"
        || element.element_name === "BorderButtonElement"
        || element.element_name === "ExtendedButtonElement"));
}
// -----------------------------------------------------------------------------
// Button.
let ButtonElement = (() => {
    let _classDecorators = [Elements.create({
            name: "ButtonElement",
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
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VElementTagMap.a;
    var ButtonElement = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ButtonElement = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        /**
         * Initializes the Button element with the provided text.
         * @param text The text to display on the button.
         * @nav Frontend/Buttons
         * @docs
         */
        constructor(text = "") {
            super({
                derived: ButtonElement,
            });
            this.text(text); // @note never assign to innerHTML, always use text()
        }
    };
    return ButtonElement = _classThis;
})();
export { ButtonElement };
export const Button = Elements.wrapper(ButtonElement);
export const NullButton = Elements.create_null(ButtonElement);
// -----------------------------------------------------------------------------
// /**
//  * Is any loader button,
//  * excluding non loader buttons,
//  * use {@link IsButtonLike} for that.
//  */
// export function isLoaderButtonLike(element: any): element is LoaderButtonElement {
//     return (
//         element instanceof LoaderButtonElement
//     ) || (isVElement(element) && (
//         element.element_name === "LoaderButtonElement"
//     ));
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
         * Initializes the LoaderButton element with the provided text and loader.
         * @param text The text to display on the loader button.
         * @param loader The loader factory function to create the loading animation.
         * @returns This constructor does not return a value.
         * @docs
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
         * Sets the default configuration for the LoaderButtonElement by calling the parent method.
         * @returns Returns the instance of the element for chaining.
         * @docs
         */
        set_default() {
            return super.set_default(LoaderButtonElement);
        }
        /**
         * Displays the loader and disables the button when clicked.
         * @returns Returns the instance of the element for chaining.
         * @docs
         */
        show_loader() {
            this.disable();
            this.nodes.text.hide();
            this.nodes.loader.update();
            this.nodes.loader.show();
            return this;
        }
        /**
         * Initiates the loading process by showing the loader.
         * @returns Returns the instance of the element for chaining.
         * @docs
         */
        // @ts-ignore
        start() {
            return this.show_loader();
        }
        /**
         * Hides the loader, enables the button, and shows the text on click event.
         * @returns Returns the instance of the element for chaining.
         * @docs
         */
        hide_loader() {
            this.enable();
            this.nodes.loader.hide();
            this.nodes.text.show();
            return this;
        }
        /**
         * Stops the loading process by hiding the loader (alias of `hide_loader`).
         * @returns Returns the instance of the element for chaining.
         */
        stop() { return this.hide_loader(); }
    };
    return LoaderButtonElement = _classThis;
})();
export { LoaderButtonElement };
export const LoaderButton = Elements.wrapper(LoaderButtonElement);
export const NullLoaderButton = Elements.create_null(LoaderButtonElement);
// -----------------------------------------------------------------------------
/**
 * The extended button element.
 * Containing a built in loader.
 * And an optional arrow that extends when hovering.
 */
// Button.
let ExtendedButtonElement = (() => {
    let _classDecorators = [Elements.create({
            name: "ExtendedButtonElement",
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = AnchorHStackElement;
    var ExtendedButtonElement = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ExtendedButtonElement = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        /** The hover background. */
        _hover_background;
        /** The hover text color. */
        _hover_color;
        /** The hover border color. */
        _hover_border_color;
        /** The minimum wait promise for the show/hide loader. */
        _min_wait;
        /** The nested nodes. */
        nodes;
        /**
         * Initializes the Button element with the provided text.
         * @param text The text to display on the button.
         * @nav Frontend/Buttons
         * @docs
         */
        constructor(button_text, opts = {}) {
            // Initialize super.
            super();
            this._init({
                derived: ExtendedButtonElement,
            });
            // Unpack options.
            let { size_ratio = 1, hover = undefined, } = opts;
            this._hover_background = hover?.background;
            this._hover_color = hover?.color;
            this._hover_border_color = hover?.border_color;
            // Assign nodes.
            // Assign every property that will be assigned later as `undefined as any` for convenience.
            this.nodes = {
                border: undefined,
                background: undefined,
                hover: undefined,
                text: undefined,
                image: undefined,
                image_stripe: undefined,
                loader: undefined,
            };
            // Local vars.
            const color = "black";
            const background = "transparent";
            const border_radius = 10;
            const image_src = (opts.arrow === false ? undefined : opts.arrow?.source) || "/volt/assets/icons/arrow.v1.webp";
            const image_rotation = (opts.arrow === false
                ? undefined
                : typeof opts.arrow?.rotate === "number"
                    ? `${opts.arrow.rotate}deg`
                    : opts.arrow?.rotate) || "0deg";
            const image_animation = opts.arrow === false ? false : (opts.arrow?.animate ?? true);
            let before_hover_color;
            let before_hover_border_color;
            this
                .remove_children()
                // .letter_spacing(UI.letter_spacing_1)
                .append(
            // use a separate bg node so we can set opacity on the background color for gradients.
            this.nodes.background = Frame()
                .position(0, 0, 0, 0)
                .background(background)
                .border_radius(border_radius)
                .transition("background 300ms ease-in-out")
                .z_index(1), 
            // gradient border for gradient support.
            this.nodes.border = GradientBorder()
                .position(0, 0, 0, 0)
                .background("transparent")
                .border_radius(border_radius)
                .transition("background 300ms ease-in-out")
                .z_index(2), 
            // use a hover node so we can use an opacity color as hover effect over for instance a gradient bg.
            this.nodes.hover = Frame()
                .position(0, 0, 0, 0)
                .border_radius(border_radius)
                .opacity(hover?.opacity ?? 1)
                // we dont transition the opacity, this is purely to edit the color.
                .transition("background 300ms ease-in-out")
                .z_index(2), this.nodes.text = Span(button_text)
                .wrap(false)
                .transition("color 300ms ease-in-out")
                .z_index(3), this.nodes.image = ImageMask(image_src)
                .mask_color(color)
                .frame("0.6em", "0.6em")
                .margin_left("0.6em")
                .position("relative")
                .transition_mask("background 300ms ease-in-out")
                .transform(`rotate(${image_rotation})`)
                .append(this.nodes.image_stripe = Frame()
                .background(color)
                .frame(0, 1)
                .position("calc(50% - (1px / 2))", "25%", null, null)
                .border_radius(2)
                .transition("width 500ms ease-in-out, background 300ms ease-in-out"))
                .z_index(3), this.nodes.loader = RingLoader()
                .background(color)
                .square(20 * size_ratio)
                .update()
                .hide()
                .z_index(3))
                .position("relative")
                .margin(0)
                .hover_brightness(false)
                .font_size(14 * size_ratio)
                .font_weight("500 !important")
                .center()
                .center_vertical()
                .padding(10 * size_ratio, 20 * size_ratio, 10 * size_ratio, 20 * size_ratio)
                .background("transparent")
                .color(color)
                .border_radius(border_radius)
                .border(1, "grey")
                // .shadow(Theme.button_shadow)
                .transition("background 300ms ease-in-out")
                .on_mouse_over_out(e => {
                if (image_animation && this.nodes.image_stripe.parentElement) {
                    this.nodes.image_stripe.width(this.nodes.image_stripe.parentElement.clientWidth);
                }
                if (this._hover_background) {
                    this.nodes.hover.background(this._hover_background); // use a hover node so we can also use a #FFFFFF90 with opactify as hover bg to hover a gradient background for instance.
                }
                if (this._hover_color) {
                    before_hover_color = this.color();
                    this.color(this._hover_color);
                }
                if (this._hover_border_color) {
                    before_hover_border_color = this.border_color();
                    this.border_color(this._hover_border_color);
                }
                // (e as any).__background(hover_bg);
            }, e => {
                if (image_animation) {
                    this.nodes.image_stripe.width(0);
                }
                if (this._hover_background) {
                    this.nodes.hover.background("transparent");
                }
                if (this._hover_color && before_hover_color) {
                    this.color(before_hover_color);
                }
                if (this._hover_border_color && before_hover_border_color) {
                    this.border_color(before_hover_border_color);
                }
                // (e as any).__background(bg_color);
            });
            // Hide the image.
            if (opts.arrow === false) {
                this.nodes.image.hide();
                this.nodes.image_stripe.hide();
            }
        }
        /**
         * {Font size}
         * Specifies the font size of text. The equivalent of CSS attribute `fontSize`.
         * @param value The value to assign. Leave `null` to retrieve the attribute's value.
         * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
         * @docs
         */
        font_size(value) {
            if (value == null) {
                return super.font_size();
            }
            super.font_size(value);
            this.nodes.loader.square(value * (20 / 14)).update();
            return this;
        }
        /**
         * Specify the text color when hovering this node.
         * @note This method has no effect if called once already hovering.
         * @param value The value to assign. Leave `undefined` to retrieve the attribute's value.
         * @returns Returns the current hover text color when no value is provided, otherwise returns the instance of the element for chaining.
         * @docs
         */
        hover_color(value) {
            if (value == null) {
                return this._hover_color ?? "";
            }
            this._hover_color = value;
            return this;
        }
        /**
         * Specify the background color when hovering this node.
         * @note This method has no effect if called once already hovering.
         * @param value The value to assign. Leave `undefined` to retrieve the attribute's value.
         * @returns Returns the current hover background when no value is provided, otherwise returns the instance of the element for chaining.
         * @docs
         */
        hover_background(value) {
            if (value == null) {
                return this._hover_background ?? "";
            }
            this._hover_background = value;
            return this;
        }
        /**
         * Specify the opacity of the background color when hovering this node.
         * The opacity is not transitioned and is purely to edit the appearance
         * of the background color while hovering.
         * @param value The value to assign [0...1]. Leave `undefined` to retrieve the attribute's value.
         * @returns Returns the current hover opacity when no value is provided, otherwise returns the instance of the element for chaining.
         * @docs
         */
        hover_opacity(value) {
            if (value == null) {
                return this.nodes.hover.opacity();
            }
            this.nodes.hover.opacity(value);
            return this;
        }
        /**
         * Set or get the text content of the element. If no value is provided, it retrieves the current text content.
         * @param value The value to assign. Leave `undefined` to retrieve the attribute's value.
         * @returns Returns the text content when no value is provided, otherwise returns the instance of the element for chaining.
         * @docs
         */
        text(value) {
            if (value == null) {
                return this.nodes.text.text();
            }
            this.nodes.text.text(value);
            return this;
        }
        /**
         * Set or get the background color of this node.
         * @param value The value to assign. Leave `undefined` to retrieve the attribute's value.
         * @returns Returns the instance for chaining unless parameter `value` is `undefined`, then the attribute's value is returned.
         * @docs
         */
        background(value) {
            if (value == null) {
                return this.nodes.background.background();
            }
            this.nodes.background.background(value);
            return this;
        }
        /**
         * Set or get the opacity of the background color of this node.
         * @param value The value to assign [0...1]. Leave `undefined` to retrieve the attribute's value.
         * @returns Returns the instance for chaining unless parameter `value` is `undefined`, then the attribute's value is returned.
         * @docs
         */
        background_opacity(value) {
            if (value == null) {
                return this.nodes.background.opacity();
            }
            this.nodes.background.opacity(value);
            return this;
        }
        /**
         * Assigns the color of text, also supports a `GradientType` element.
         * @param value The value to assign. Leave `undefined` to retrieve the attribute's value.
         * @returns Returns the instance for chaining unless parameter `value` is `undefined`, then the attribute's value is returned.
         * @docs
         */
        color(value) {
            if (value == null) {
                return super.color();
            }
            super.color(value);
            this.nodes.image.mask_color(value);
            this.nodes.image_stripe.background(value);
            this.nodes.loader.background(value).update();
            return this;
        }
        /**
         * Assigns the border color of this node, also supports a `GradientType` element.
         * @param value The value to assign. Leave `undefined` to retrieve the attribute's value.
         * @returns Returns the instance for chaining unless parameter `value` is `undefined`, then the attribute's value is returned.
         * @docs
         */
        // @ts-ignore different signature than base.
        border(width, color) {
            if (width == null || color == null) {
                return this.nodes.border.border();
            }
            this.nodes.border.border(width, color);
            return this;
        }
        /**
         * Assigns the border color of this node, also supports a `GradientType` element.
         * @param value The value to assign. Leave `undefined` to retrieve the attribute's value.
         * @returns Returns the instance for chaining unless parameter `value` is `undefined`, then the attribute's value is returned.
         * @docs
         */
        border_color(value) {
            if (value == null) {
                return this.nodes.border.border_color();
            }
            this.nodes.border.border_color(value);
            return this;
        }
        /**
         * Assigns the border color of this node, also supports a `GradientType` element.
         * @param value The value to assign. Leave `undefined` to retrieve the attribute's value.
         * @returns Returns the instance for chaining unless parameter `value` is `undefined`, then the attribute's value is returned.
         * @docs
         */
        border_width(value) {
            if (value == null) {
                return this.nodes.border.border_width();
            }
            this.nodes.border.border_width(value);
            return this;
        }
        /**
         * A shorthand property for the four border-radius properties. The equivalent of CSS attribute `borderRadius`.
         * @returns The current instance for chaining.
         * @docs
         */
        border_radius(value) {
            if (value == null) {
                return super.border_radius();
            }
            super.border_radius(value);
            this.nodes.border.border_radius(value);
            this.nodes.background.border_radius(value);
            this.nodes.hover.border_radius(value);
            return this;
        }
        /**
         * Show the loader, disabling the button and adding an opacity of 0.75 by default.
         * @param opacity The opacity to apply to the button while the loader is shown, this is to indicate the button is disabled.
         * @param min_wait The minimum amount of time in milliseconds to show the loader, this is to improve user experience by ensuring the loader is visible for a minimum duration.
         * @returns The current instance for chaining.
         * @docs
         */
        show_loader({ opacity = 0.75, min_wait = 500 } = {}) {
            this._min_wait = min_wait ? new Promise(resolve => setTimeout(resolve, min_wait)) : undefined;
            this.disable().opacity(opacity).cursor("auto");
            this.nodes.loader.show();
            this.nodes.text.hide();
            this.nodes.image.hide();
            this.getBoundingClientRect();
            return this;
        }
        /**
         * Hide the loader, restoring the button to its normal state.
         * By default it awaits the `min_wait` duration assigned in {@link show_loader}, before hiding the loader.
         * This is to ensure the loader is visible for a minimum amount of time, improving user experience.
         * @returns The current instance for chaining.
         * @docs
         */
        async hide_loader() {
            if (this._min_wait) {
                await this._min_wait;
            }
            this.enable().opacity(1).cursor("pointer");
            this.nodes.loader.hide();
            this.nodes.text.show();
            this.nodes.image.show();
            this.getBoundingClientRect();
            return this;
        }
        /**
         * Hide the loader, restoring the button to its normal state.
         * @note This does not await the `min_wait` duration assigned in {@link show_loader}, before hiding the loader.
         * @returns The current instance for chaining.
         * @docs
         */
        hide_loader_sync() {
            this.enable().opacity(1).cursor("pointer");
            this.nodes.loader.hide();
            this.nodes.text.show();
            this.nodes.image.show();
            this.getBoundingClientRect();
            return this;
        }
    };
    return ExtendedButtonElement = _classThis;
})();
export { ExtendedButtonElement };
export const ExtendedButton = Elements.wrapper(ExtendedButtonElement);
export const NullExtendedButton = Elements.create_null(ExtendedButtonElement);
/**
 * Nested types for the {@link ExtendedButtonElement} class.
 */
(function (ExtendedButtonElement) {
    ;
})(ExtendedButtonElement || (ExtendedButtonElement = {}));
