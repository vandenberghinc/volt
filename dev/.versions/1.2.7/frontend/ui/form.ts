/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Elements } from "../modules/elements"
import { CreateVElementClass, VElement, isVElement } from "./element"
import { VStack, VStackElement } from "./stack"

// Extended input.
@Elements.register
export class FormElement extends VStackElement {

	// Macros.
	#macro OnSubmit ((element: FormElement, data: Record<string, any>) => any)
	#macro OnSubmitError ((element: FormElement, error: Error | string) => any)

	// Default styling.
	// static default_style = Object.assign({}, HStackElement.default_style, {
	static default_style: Record<string, any> = {
		...VStackElement.default_style,
	};

	// Attributes.
	public _button?: VElement;
	public fields: Record<string, any>;
	public _on_submit?: OnSubmit;
	public _on_submit_error?: OnSubmitError;
	public _on_append_callback: (child: any) => void;

	// Constructor.
	constructor(...children: any[]) {

		// Initialize super.
		super();

		// Attributes.
		this.element_type = "Form";
		
		// Set default styling.
		this.styles(FormElement.default_style);

		// Attributes.
		this._button = undefined;
		this.fields = {};

		// Set the on append callback.
		const _this = this;
		this._on_append_callback = (child: any) => {
			
			// Initialize field.
			if (child.element_type === "ExtendedInput" || child.element_type === "ExtendedSelect" || child.element_type === "CheckBox") {
				const id = child.id();
				if (id != null && id !== "") {
					_this.fields[id] = child;
					child.on_input(() => {
						if (child.missing() === true) {
							child.missing(false);
						}
					})
					child.on_enter(() => _this.submit())
				}
			}

			// Initialize button.
			else if (/*_this._button === undefined &&*/ (child.element_type === "Button" || child.element_type === "LoaderButton") && child.on_click() == null) { //  && child.attr("submit_button") != "false"
				if (_this._button !== undefined) {
					_this._button.on_click(() => {})
				}
				_this.button(child);
			}

			// Parse children.
			if (child.children != null) {
				for (let i = 0; i < child.children.length; i++) {
					_this._on_append_callback(child.children[i]);
				}
			}
		};

		// Append.
		this.append(...children);
	}

	// Submit all input elements and get the data inside an object.
	// When a required input is not filled in then an error is thrown.
	// An object will be returned with each input's id as the key and the input's value as value.
	// When an input field does not have an assigned id it will be skipped.
	// Only supported extended input elements like `ExtendedInput`.
	// @ts-expect-error
	data() : Record<string, any> {
		const params: Record<string, any> = {};
	    let error;
	    const ids = Object.keys(this.fields);
	    for (let i = 0; i < ids.length; i++) {
	    	try {
	    		const id = ids[i];
	    		const element = this.fields[id];
		    	if (element.required() !== true) {
		    		params[id] = element.value();
		    	} else {
		    		params[id] = element.submit();
		    	}
		    } catch(e) {
	            error = e;
	        }
	    }
	    if (error) {
	    	throw error;
	    }
	    return params;
	}

	// Submit.
	async submit(): Promise<this> {

		// Init.
		if (this._button === undefined) {
			throw Error("No submit button has been found, add a button to the form or attach a button using \"Form.button()\".");
		}
		if ((this._button as any).show_loader !== undefined) {
			(this._button as any).show_loader();
		}

		// Submit.
		try {
			const data = this.data();
			if (this._on_submit !== undefined) {
				const res = this._on_submit(this, data);
				if (res instanceof Promise) {
					await res;
				}
			}
			if ((this._button as any).hide_loader !== undefined) {
				(this._button as any).hide_loader();
			}
		}

		// Handle rror.
		catch (error) {

			// Defined callback.
			if (this._on_submit_error !== undefined) {
				const res = this._on_submit_error(this, error as Error | string);
				if (res instanceof Promise) {
					await res;
				}
				if ((this._button as any).hide_loader !== undefined) {
					(this._button as any).hide_loader();
				}
			}

			// No callback so rethrow.
			else {
				if (this._button.hide_loader !== undefined) {
					this._button.hide_loader();
				}
				throw error;
			}
		}

		return this;
	}

	// Set the submit button, by default the last button without a defined callback is used as the submit button.
	button() : undefined | VElement;
	button(element_or_id: VElement | string) : this;
	button(element_or_id?: VElement | string) : this | undefined | VElement {
		if (element_or_id == null) { return this._button; }
		else if (typeof element_or_id === "string") {
			const node = document.getElementById(element_or_id);
			if (!isVElement(node)) {
				throw Error(`Specified element is not a VElement.`);
			}
			element_or_id = node;
			if (element_or_id == null) {
				throw Error(`Unable to find element "${element_or_id}".`);
			}
		}
		this._button = element_or_id as any as VElement;
		const _this = this;
		this._button.on_click(() => {
			_this.submit().catch(console.error)
		})
		return this;
	}

	// Set the on submit callback, the params for the callback are `(element, data) => {}`.
	// @ts-expect-error
	on_submit() : undefined | OnSubmit
	// @ts-expect-error
	on_submit(callback: OnSubmit) : this;
	// @ts-expect-error
	on_submit(callback?: OnSubmit) : this | undefined | OnSubmit {
		if (callback == null) { return this._on_submit; }
		this._on_submit = callback;
		return this;
	}

	// Set the on submit error callback, the params for the callback are `(element, error) => {}`.
	on_submit_error() : undefined | OnSubmitError
	on_submit_error(callback: OnSubmitError) : this;
	on_submit_error(callback?: OnSubmitError) : this | undefined | OnSubmitError {
		if (callback == null) { return this._on_submit_error; }
		this._on_submit_error = callback;
		return this;
	}
}
export const Form = Elements.wrapper(FormElement);