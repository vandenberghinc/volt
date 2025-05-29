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
	 * @docs:
	 * @title: Set Default
	 * @desc: Sets the default configuration for the LoaderButtonElement by calling the parent method.
	 * @return:
	 *     @type: this
	 *     @description Returns the instance of the element for chaining.
	 */
	set_default(): this {
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
	show_loader(): this {
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
	start(): this {
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
	hide_loader(): this {
	    this.enable();
	    this.nodes.loader.hide();
	    this.nodes.text.show();
	    return this;
	}
	stop() { return this.hide_loader(); }
}
export const LoaderButton = Elements.wrapper(LoaderButtonElement);
export const NullLoaderButton = Elements.create_null(LoaderButtonElement);
declare module './any_element.d.ts' { interface AnyElementMap { LoaderButtonElement: LoaderButtonElement }}


