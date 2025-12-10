/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */

// Imports.
import { Elements, VElementBaseSignature, VElement, VElementTagMap, VHTMLElement, isVElement, BorderOpts, VDivElement, VDiv } from "../elements/module.js";
import { BorderButtonElement } from "./border_button.js";
import { GradientBorder, GradientBorderElement, GradientType } from "./gradient.js";
import { ImageMask, ImageMaskElement } from "./image.js";
import { RingLoader, RingLoaderElement } from "./loaders.js";
import { Span, SpanElement } from "./span.js";
import { AnchorHStackElement, Frame, FrameElement } from "./stack.js";

/**
 * Is any button like,
 * including loader and bordered buttons.
 */
export function isButtonLike(element: any): element is (
    | ButtonElement
    | LoaderButtonElement
    | BorderButtonElement
 ) {
    return (
        element instanceof ButtonElement
        || element instanceof LoaderButtonElement
        || element instanceof BorderButtonElement
        || element instanceof ExtendedButtonElement
    ) || (isVElement(element) && (
        element.element_name === "ButtonElement"
        || element.element_name === "LoaderButtonElement"
        || element.element_name === "BorderButtonElement"
        || element.element_name === "ExtendedButtonElement"
    ));
}

// -----------------------------------------------------------------------------

// Button.
@Elements.create({
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
        "onmousedown": function (this: any): void {
            this.style.filter = "brightness(80%)";
        },
        "onmouseover": function (this: any): void {
            this.style.filter = "brightness(90%)";
        },
        "onmouseup": function (this: any): void {
            this.style.filter = "brightness(100%)";
        },
        "onmouseout": function (this: any): void {
            this.style.filter = "brightness(100%)";
        },
    },
})
export class ButtonElement extends VElementTagMap.a {

	/**
	 * Initializes the Button element with the provided text.
	 * @param text The text to display on the button.
	 * @nav Frontend/Buttons
     * @docs
	 */
	constructor(text: string = "") {
		super({
			derived: ButtonElement,
		});
		this.text(text); // @note never assign to innerHTML, always use text()
	}
}
export const Button = Elements.wrapper(ButtonElement);
export const NullButton = Elements.create_null(ButtonElement);
declare module './any_element.d.ts' { interface AnyElementMap { ButtonElement: ButtonElement }}

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
@Elements.create({
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
})
export class LoaderButtonElement extends (AnchorHStackElement as any as VElementBaseSignature) {

    // Attributes.
    public nodes: {
        text: VDivElement;
        loader: RingLoaderElement;
        [key: string]: any;
    };
    // @ts-ignore
    public text: VDivElement;
    public loader: RingLoaderElement;

    /**
     * Initializes the LoaderButton element with the provided text and loader.
     * @param text The text to display on the loader button.
     * @param loader The loader factory function to create the loading animation.
     * @returns This constructor does not return a value.
     * @docs
     */
    constructor(text: string = "", loader: () => any = RingLoader) {

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
        this.center_vertical()

        // Children.
        this.nodes.loader
            .frame(LoaderButtonElement.default_style["--loader-width"], LoaderButtonElement.default_style["--loader-height"])
            .background("white")
            .update()
            .hide()
            .parent(this)
        this.nodes.text
            .text(text)
            .margin(0)
            .padding(0)
            .parent(this);

        // Add children.
        this.append(this.nodes.loader, this.nodes.text);

    }

    /**
     * Retrieves or sets the styling attributes for the loader element. If no argument is provided, it returns the current styles including default loader dimensions.
     * @param style_dict An optional dictionary of styles to set.
     * @returns When no argument is passed, returns the current styles including loader dimensions.
     * @returns When an argument is provided, returns the instance of the element for chaining.
     * @docs
     */
    styles(): Record<string, string>;
    styles(style_dict: Record<string, any>): this;
    styles(style_dict?: Record<string, any>): Record<string, string> | this {
        if (style_dict == null) {
            let styles = super.styles();
            styles["--loader-width"] = this.nodes.loader.style.width || "20px";
            styles["--loader-height"] = this.nodes.loader.style.height || "20px";
            return styles;
        } else {
            return super.styles(style_dict);
        }
    }

    /**
     * Sets the default configuration for the LoaderButtonElement by calling the parent method.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    set_default(): this {
        return super.set_default(LoaderButtonElement);
    }

    /**
     * Displays the loader and disables the button when clicked.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    show_loader(): this {
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
    start(): this {
        return this.show_loader();
    }

    /**
     * Hides the loader, enables the button, and shows the text on click event.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    hide_loader(): this {
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
}
export const LoaderButton = Elements.wrapper(LoaderButtonElement);
export const NullLoaderButton = Elements.create_null(LoaderButtonElement);
declare module './any_element.d.ts' { interface AnyElementMap { LoaderButtonElement: LoaderButtonElement } }

// -----------------------------------------------------------------------------

/**
 * The extended button element.
 * Containing a built in loader.
 * And an optional arrow that extends when hovering.
 */
// Button.
@Elements.create({
    name: "ExtendedButtonElement",
})
export class ExtendedButtonElement extends AnchorHStackElement {

    /** The hover background. */
    private _hover_background: undefined | string;
    
    /** The hover text color. */
    private _hover_color: undefined | string;

    /** The hover border color. */
    private _hover_border_color: undefined | string;

    /** The minimum wait promise for the show/hide loader. */
    private _min_wait: Promise<void> | undefined;

    /** The nested nodes. */
    nodes: {
        image: ImageMaskElement;
        image_stripe: FrameElement;
        border: GradientBorderElement;
        background: FrameElement;
        hover: FrameElement;
        text: SpanElement;
        loader: RingLoaderElement;
    };

    /**
     * Initializes the Button element with the provided text.
     * @param text The text to display on the button.
     * @nav Frontend/Buttons
     * @docs
     */
    constructor(button_text: string, opts: ExtendedButtonElement.Opts = {}) {
        
        // Initialize super.
        super();
        this._init({
            derived: ExtendedButtonElement,
        })

        // Unpack options.
        let {
            size_ratio = 1,
            hover = undefined,
        } = opts;
        this._hover_background = hover?.background;
        this._hover_color = hover?.color;
        this._hover_border_color = hover?.border_color;

        // Assign nodes.
        // Assign every property that will be assigned later as `undefined as any` for convenience.
        this.nodes = {
            border: undefined as any,
            background: undefined as any,
            hover: undefined as any,
            text: undefined as any,
            image: undefined as any,
            image_stripe: undefined as any,
            loader: undefined as any,
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
                : opts.arrow?.rotate
            ) || "0deg";
        const image_animation = opts.arrow === false ? false : (opts.arrow?.animate ?? true);
        let before_hover_color: undefined | string;
        let before_hover_border_color: undefined | string;

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
                    .z_index(2),
                this.nodes.text = Span(button_text)
                    .wrap(false)
                    .transition("color 300ms ease-in-out")
                    .z_index(3),
                this.nodes.image = ImageMask(image_src)
                    .mask_color(color)
                    .frame("0.6em", "0.6em")
                    .margin_left("0.6em")
                    .position("relative")
                    .transition_mask("background 300ms ease-in-out")
                    .transform(`rotate(${image_rotation})`)
                    .append(
                        this.nodes.image_stripe = Frame()
                            .background(color)
                            .frame(0, 1)
                            .position("calc(50% - (1px / 2))", "25%", null, null)
                            .border_radius(2)
                            .transition("width 500ms ease-in-out, background 300ms ease-in-out")
                    )
                    .z_index(3),
                this.nodes.loader = RingLoader()
                    .background(color)
                    .square(20 * size_ratio)
                    .update()
                    .hide()
                    .z_index(3),
            )
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
            .on_mouse_over_out(
                e => {
                    if (image_animation && this.nodes.image_stripe.parentElement) {
                        this.nodes.image_stripe.width(this.nodes.image_stripe.parentElement.clientWidth);
                    }
                    if (this._hover_background) {
                        this.nodes.hover.background(this._hover_background) // use a hover node so we can also use a #FFFFFF90 with opactify as hover bg to hover a gradient background for instance.
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
                },
                e => {
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
                },
            );

        // Hide the image.
        if (opts.arrow === false) {
            this.nodes.image.hide();
            this.nodes.image_stripe.hide();
        }
    }

    font_size(): string;
    font_size(value: number): this;
    /**
     * {Font size}
     * Specifies the font size of text. The equivalent of CSS attribute `fontSize`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    font_size(value?: number): string | this {
        if (value == null) { return super.font_size(); }
        super.font_size(value);
        this.nodes.loader.square(value * (20/14)).update();
        return this;
    }

    hover_color(): string;
    hover_color(value: string): this;
    /**
     * Specify the text color when hovering this node.
     * @note This method has no effect if called once already hovering.
     * @param value The value to assign. Leave `undefined` to retrieve the attribute's value.
     * @returns Returns the current hover text color when no value is provided, otherwise returns the instance of the element for chaining.
     * @docs
     */
    hover_color(value?: string): string | this {
        if (value == null) { return this._hover_color ?? ""; }
        this._hover_color = value;
        return this;
    }

    hover_background(): string;
    hover_background(value: string): this;
    /**
     * Specify the background color when hovering this node.
     * @note This method has no effect if called once already hovering.
     * @param value The value to assign. Leave `undefined` to retrieve the attribute's value.
     * @returns Returns the current hover background when no value is provided, otherwise returns the instance of the element for chaining.
     * @docs
     */
    hover_background(value?: string): string | this {
        if (value == null) { return this._hover_background ?? ""; }
        this._hover_background = value;
        return this;
    }

    hover_opacity(): string | number;
    hover_opacity(value: number): this;
    /**
     * Specify the opacity of the background color when hovering this node.
     * The opacity is not transitioned and is purely to edit the appearance
     * of the background color while hovering.
     * @param value The value to assign [0...1]. Leave `undefined` to retrieve the attribute's value.
     * @returns Returns the current hover opacity when no value is provided, otherwise returns the instance of the element for chaining.
     * @docs
     */
    hover_opacity(value?: number): string | number | this {
        if (value == null) {
            return this.nodes.hover.opacity();
        }
        this.nodes.hover.opacity(value);
        return this;
    }

    text(): string;
    text(value: string): this;
    /**
     * Set or get the text content of the element. If no value is provided, it retrieves the current text content.
     * @param value The value to assign. Leave `undefined` to retrieve the attribute's value.
     * @returns Returns the text content when no value is provided, otherwise returns the instance of the element for chaining.
     * @docs
     */
    text(value?: string) {
        if (value == null) { return this.nodes.text.text(); }
        this.nodes.text.text(value);
        return this;
    }

    background(): string;
    background(value: string): this;
    /**
     * Set or get the background color of this node.
     * @param value The value to assign. Leave `undefined` to retrieve the attribute's value.
     * @returns Returns the instance for chaining unless parameter `value` is `undefined`, then the attribute's value is returned. 
     * @docs
     */
    background(value?: string): string | this {
        if (value == null) { return this.nodes.background.background(); }
        this.nodes.background.background(value);
        return this;
    }

    background_opacity(): string | number;
    background_opacity(value: string | number): this;
    /**
     * Set or get the opacity of the background color of this node.
     * @param value The value to assign [0...1]. Leave `undefined` to retrieve the attribute's value.
     * @returns Returns the instance for chaining unless parameter `value` is `undefined`, then the attribute's value is returned. 
     * @docs
     */
    background_opacity(value?: string | number): string | number | this {
        if (value == null) { return this.nodes.background.opacity(); }
        this.nodes.background.opacity(value);
        return this;
    }

    color(): string;
    color(value: string): this;
    /**
     * Assigns the color of text, also supports a `GradientType` element. 
     * @param value The value to assign. Leave `undefined` to retrieve the attribute's value.
     * @returns Returns the instance for chaining unless parameter `value` is `undefined`, then the attribute's value is returned. 
     * @docs
     */
    color(value?: string): string | this {
        if (value == null) { return super.color(); }
        super.color(value)
        this.nodes.image.mask_color(value)
        this.nodes.image_stripe.background(value)
        this.nodes.loader.background(value).update();
        return this;
    }

    // @ts-ignore different signature than base.
    border(): string;
    // @ts-ignore different signature than base.
    border(width: string | number, color: string): this;
    /**
     * Assigns the border color of this node, also supports a `GradientType` element. 
     * @param value The value to assign. Leave `undefined` to retrieve the attribute's value.
     * @returns Returns the instance for chaining unless parameter `value` is `undefined`, then the attribute's value is returned. 
     * @docs
     */
    // @ts-ignore different signature than base.
    border(width?: string | number, color?: string): this | string {
        if (width == null || color == null) {
            return this.nodes.border.border();
        }
        this.nodes.border.border(width, color);
        return this;
    }

    border_color(): string;
    border_color(value: string): this;
    /**
     * Assigns the border color of this node, also supports a `GradientType` element. 
     * @param value The value to assign. Leave `undefined` to retrieve the attribute's value.
     * @returns Returns the instance for chaining unless parameter `value` is `undefined`, then the attribute's value is returned. 
     * @docs
     */
    border_color(value?: string): string | this {
        if (value == null) { return this.nodes.border.border_color(); }
        this.nodes.border.border_color(value)
        return this;
    }

    border_width(): string;
    border_width(value: string | number): this;
    /**
     * Assigns the border color of this node, also supports a `GradientType` element. 
     * @param value The value to assign. Leave `undefined` to retrieve the attribute's value.
     * @returns Returns the instance for chaining unless parameter `value` is `undefined`, then the attribute's value is returned. 
     * @docs
     */
    border_width(value?: string | number): string | this {
        if (value == null) { return this.nodes.border.border_width(); }
        this.nodes.border.border_width(value)
        return this;
    }

    border_radius(): string;
    border_radius(value?: string | number): this;
    /**
     * A shorthand property for the four border-radius properties. The equivalent of CSS attribute `borderRadius`.
     * @returns The current instance for chaining.
     * @docs
     */
    border_radius(value?: string | number): this | string {
        if (value == null) { return super.border_radius(); }
        super.border_radius(value)
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
    show_loader({ opacity = 0.75, min_wait = 500 }: { opacity?: number, min_wait?: number } = {}): this {
        this._min_wait = min_wait ? new Promise(resolve => setTimeout(resolve, min_wait)) : undefined;
        this.disable().opacity(opacity).cursor("auto");
        this.nodes.loader.show();
        this.nodes.text.hide();
        this.nodes.image.hide();
        this.getBoundingClientRect()
        return this;
    }
    /**
     * Hide the loader, restoring the button to its normal state.
     * By default it awaits the `min_wait` duration assigned in {@link show_loader}, before hiding the loader.
     * This is to ensure the loader is visible for a minimum amount of time, improving user experience.
     * @returns The current instance for chaining.
     * @docs
     */
    async hide_loader(): Promise<this> {
        if (this._min_wait) {
            await this._min_wait;
        }
        this.enable().opacity(1).cursor("pointer");
        this.nodes.loader.hide();
        this.nodes.text.show();
        this.nodes.image.show();
        this.getBoundingClientRect()
        return this;
    }
    /**
     * Hide the loader, restoring the button to its normal state.
     * @note This does not await the `min_wait` duration assigned in {@link show_loader}, before hiding the loader.
     * @returns The current instance for chaining.
     * @docs
     */
    hide_loader_sync(): this {
        this.enable().opacity(1).cursor("pointer");
        this.nodes.loader.hide();
        this.nodes.text.show();
        this.nodes.image.show();
        this.getBoundingClientRect()
        return this;
    }
}
export const ExtendedButton = Elements.wrapper(ExtendedButtonElement);
export const NullExtendedButton = Elements.create_null(ExtendedButtonElement);
declare module './any_element.d.ts' { interface AnyElementMap { ExtendedButtonElement: ExtendedButtonElement } }

/**
 * Nested types for the {@link ExtendedButtonElement} class.
 */
export namespace ExtendedButtonElement {

    /** The argument options for the extended button element. */
    export interface Opts {
        /** Set specific hover options. */
        hover?: {
            /** The background color on hover. */
            background?: string;
            /** The text color on hover. */
            color?: string;
            /** The border color on hover. */
            border_color?: string;
            /**
             * The background color opacity on hover.
             * @note The opacity is not transitioned, this is purely to edit the background color appearance.
             */
            opacity?: number;
        };
        /**
         * Scale the font size and padding of the button, font size is by default 16px.
         * This should be a positive number, where `1` represents the default size.
         * @note The size ratio is merely a quick way of editing the button size and spacing.
         *       However, the font size and padding can also be manually assigned.
         */
        size_ratio?: number;
        /**
         * Specific settings for the arrow button.
         * The arrow functionality can be disabled by specifically defining this as `false`.
         */
        arrow?: false | {
            /**
             * The source of the arrow image.
             * @note Using a different image might cause issues with the image stripe, stored under `nodes.image_stripe`.
             * @default "/volt/assets/icons/arrow.v1.webp"
             */
            source?: string;
            /**
             * The image rotation [0..360].
             * Either formatted as a string suffixed with `deg` or a number representing degrees.
             * @default "0deg"
             */
            rotate?: string | number;
            /**
             * Enable or disable animation for the arrow image.
             * @default true
             */
            animate?: boolean;
        };
    };
}