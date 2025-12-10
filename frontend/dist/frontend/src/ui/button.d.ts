/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
import { VElementBaseSignature, VElementTagMap, VDivElement } from "../elements/module.js";
import { BorderButtonElement } from "./border_button.js";
import { GradientBorderElement } from "./gradient.js";
import { ImageMaskElement } from "./image.js";
import { RingLoaderElement } from "./loaders.js";
import { SpanElement } from "./span.js";
import { AnchorHStackElement, FrameElement } from "./stack.js";
/**
 * Is any button like,
 * including loader and bordered buttons.
 */
export declare function isButtonLike(element: any): element is (ButtonElement | LoaderButtonElement | BorderButtonElement);
export declare class ButtonElement extends VElementTagMap.a {
    /**
     * Initializes the Button element with the provided text.
     * @param text The text to display on the button.
     * @nav Frontend/Buttons
     * @docs
     */
    constructor(text?: string);
}
export declare const Button: <Extensions extends object = {}>(text?: string | undefined) => ButtonElement & Extensions;
export declare const NullButton: <Extensions extends object = {}>() => ButtonElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        ButtonElement: ButtonElement;
    }
}
declare const LoaderButtonElement_base: VElementBaseSignature;
/**
 * @warning: you should not use function "LoaderButton.loader.hide() / LoaderButton.loader.show()" use "LoaderButton.hide_loader() / LoaderButton.show_loader()" instead.
 * @warning: This class is still experimental and may be subject to future change.
 */
export declare class LoaderButtonElement extends LoaderButtonElement_base {
    nodes: {
        text: VDivElement;
        loader: RingLoaderElement;
        [key: string]: any;
    };
    text: VDivElement;
    loader: RingLoaderElement;
    /**
     * Initializes the LoaderButton element with the provided text and loader.
     * @param text The text to display on the loader button.
     * @param loader The loader factory function to create the loading animation.
     * @returns This constructor does not return a value.
     * @docs
     */
    constructor(text?: string, loader?: () => any);
    /**
     * Retrieves or sets the styling attributes for the loader element. If no argument is provided, it returns the current styles including default loader dimensions.
     * @param style_dict An optional dictionary of styles to set.
     * @returns When no argument is passed, returns the current styles including loader dimensions.
     * @returns When an argument is provided, returns the instance of the element for chaining.
     * @docs
     */
    styles(): Record<string, string>;
    styles(style_dict: Record<string, any>): this;
    /**
     * Sets the default configuration for the LoaderButtonElement by calling the parent method.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    set_default(): this;
    /**
     * Displays the loader and disables the button when clicked.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    show_loader(): this;
    /**
     * Initiates the loading process by showing the loader.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    start(): this;
    /**
     * Hides the loader, enables the button, and shows the text on click event.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    hide_loader(): this;
    /**
     * Stops the loading process by hiding the loader (alias of `hide_loader`).
     * @returns Returns the instance of the element for chaining.
     */
    stop(): this;
}
export declare const LoaderButton: <Extensions extends object = {}>(text?: string | undefined, loader?: (() => any) | undefined) => LoaderButtonElement & Extensions;
export declare const NullLoaderButton: <Extensions extends object = {}>() => LoaderButtonElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        LoaderButtonElement: LoaderButtonElement;
    }
}
/**
 * The extended button element.
 * Containing a built in loader.
 * And an optional arrow that extends when hovering.
 */
export declare class ExtendedButtonElement extends AnchorHStackElement {
    /** The hover background. */
    private _hover_background;
    /** The hover text color. */
    private _hover_color;
    /** The hover border color. */
    private _hover_border_color;
    /** The minimum wait promise for the show/hide loader. */
    private _min_wait;
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
    constructor(button_text: string, opts?: ExtendedButtonElement.Opts);
    font_size(): string;
    font_size(value: number): this;
    hover_color(): string;
    hover_color(value: string): this;
    hover_background(): string;
    hover_background(value: string): this;
    hover_opacity(): string | number;
    hover_opacity(value: number): this;
    text(): string;
    text(value: string): this;
    background(): string;
    background(value: string): this;
    background_opacity(): string | number;
    background_opacity(value: string | number): this;
    color(): string;
    color(value: string): this;
    border(): string;
    border(width: string | number, color: string): this;
    border_color(): string;
    border_color(value: string): this;
    border_width(): string;
    border_width(value: string | number): this;
    border_radius(): string;
    border_radius(value?: string | number): this;
    /**
     * Show the loader, disabling the button and adding an opacity of 0.75 by default.
     * @param opacity The opacity to apply to the button while the loader is shown, this is to indicate the button is disabled.
     * @param min_wait The minimum amount of time in milliseconds to show the loader, this is to improve user experience by ensuring the loader is visible for a minimum duration.
     * @returns The current instance for chaining.
     * @docs
     */
    show_loader({ opacity, min_wait }?: {
        opacity?: number;
        min_wait?: number;
    }): this;
    /**
     * Hide the loader, restoring the button to its normal state.
     * By default it awaits the `min_wait` duration assigned in {@link show_loader}, before hiding the loader.
     * This is to ensure the loader is visible for a minimum amount of time, improving user experience.
     * @returns The current instance for chaining.
     * @docs
     */
    hide_loader(): Promise<this>;
    /**
     * Hide the loader, restoring the button to its normal state.
     * @note This does not await the `min_wait` duration assigned in {@link show_loader}, before hiding the loader.
     * @returns The current instance for chaining.
     * @docs
     */
    hide_loader_sync(): this;
}
export declare const ExtendedButton: <Extensions extends object = {}>(button_text: string, opts?: ExtendedButtonElement.Opts | undefined) => ExtendedButtonElement & Extensions;
export declare const NullExtendedButton: <Extensions extends object = {}>() => ExtendedButtonElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        ExtendedButtonElement: ExtendedButtonElement;
    }
}
/**
 * Nested types for the {@link ExtendedButtonElement} class.
 */
export declare namespace ExtendedButtonElement {
    /** The argument options for the extended button element. */
    interface Opts {
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
    }
}
export {};
