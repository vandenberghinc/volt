/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Elements } from "../modules/elements"

// Button.
export class CSSElement {

	// Attributes.
	public _element: HTMLElement;

	// Constructor.
	constructor(data, auto_append = true) {
		this._element = document.createElement("style");
		this._element.innerHTML = data;
		if (auto_append) {
			document.head.appendChild(this._element);
		}
	}

	// Data.
	data() : string;
	data(val: string) : this;
	data(val?: string) : this | string {
		if (val == null) { return this._element.innerHTML ?? ""; }
		this._element.innerHTML = val;
		return this;
	}

	// Remove.
	remove() : this {
		this._element.remove();
		return this;
	}

	// Append to.
	append_to(parent: any) : this  {
		parent.appendChild(this._element);
		return this;
	}
}
export const CSS = Elements.wrapper(CSSElement);
