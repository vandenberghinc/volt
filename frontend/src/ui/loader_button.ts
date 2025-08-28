/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// Imports.
import { Elements, VElementBaseSignature, VElement, VDivElement, VDiv, VElementTagMap } from "../elements/module.js";
import { AnchorHStackElement } from "./stack";
import { RingLoader, RingLoaderElement } from "./loaders"
import { AnyElement } from "./any_element.js";

// export class myClass extends AnchorHStackElement {
//     constructor() { super(); }
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