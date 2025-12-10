/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
import { VElementBaseSignature, VDivElement } from "../elements/module.js";
import { RingLoaderElement } from "./loaders.js";
/**
 * Is any loader button,
 * excluding non loader buttons,
 * use {@link IsButtonLike} for that.
 */
export declare function isLoaderButtonLike(element: any): element is LoaderButtonElement;
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
export {};
