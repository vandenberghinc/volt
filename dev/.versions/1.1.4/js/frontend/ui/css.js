/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Button.
@constructor_wrapper
class CSSElement {

	// Constructor.
	constructor(data, auto_append = true) {
		this._element = document.createElement("style");
		this._element.innerHTML = data;
		if (auto_append) {
			document.head.appendChild(this._element);
		}
	}

	// Data.
	data(val) {
		if (val === null) { return this._element.innerHTML; }
		this._element.innerHTML = val;
		return this;
	}

	// Remove.
	remove() {
		this._element.remove();
		return this;
	}

	// Append to.
	append_to(parent) {
		parent.appendChild(this._element);
		return this;
	}
		
}
