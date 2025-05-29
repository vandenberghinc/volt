import { VElementBaseSignature, VDivElement } from "../elements/module.js";
import { RingLoaderElement } from "./loaders";
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
    constructor(text?: string, loader?: () => any);
    /**
     * @docs:
     * @title: Styles
     * @desc: Retrieves or sets the styling attributes for the loader element. If no argument is provided, it returns the current styles including default loader dimensions.
     * @param:
     *     @name: style_dict
     *     @descr: An optional dictionary of styles to set.
     *     @type: object | null
     * @return:
     *     @type: object
     *     @description When no argument is passed, returns the current styles including loader dimensions. When an argument is provided, returns the result of the super class's styles method.
     * @funcs: 2
     */
    styles(): Record<string, string>;
    styles(style_dict: Record<string, any>): this;
    /**
     * @docs:
     * @title: Set Default
     * @desc: Sets the default configuration for the LoaderButtonElement by calling the parent method.
     * @return:
     *     @type: this
     *     @description Returns the instance of the element for chaining.
     */
    set_default(): this;
    /**
     * @docs:
     * @title: Show Loader
     * @desc: Displays the loader and disables the button when clicked.
     * @return:
     *     @type: this
     *     @description Returns the instance of the element for chaining.
     */
    show_loader(): this;
    /**
     * @docs:
     * @title: Start
     * @desc: Initiates the loading process by showing the loader.
     * @return:
     *     @type: this
     *     @description Returns the instance of the element for chaining.
     */
    start(): this;
    /**
     * @docs:
     * @title: Hide Loader
     * @desc: Hides the loader, enables the button, and shows the text on click event.
     * @return:
     *     @type: this
     *     @description Returns the instance of the element for chaining.
     */
    hide_loader(): this;
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
