/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Elements module.
vweb.elements = {};

// Get by id.
vweb.elements.get = function(id) {
	const e = document.getElementById(id);
	if (e == null) {
		throw Error(`Unable to find element with id "${id}".`)
	}
	return e;
}
vweb.elements.get_by_id = function(id) {
	return vweb.elements.get(id)
}

// Click an element by id.
vweb.elements.click = function(id) {
	document.getElementById(id).click();
}

// Register a custom type.
// Parameter "tag" is optional.
vweb.elements.register = function(type, tag) {

	// Prefer type.name here since that also supports inherited classes.
	customElements.define("v-" + type.name.toLowerCase(), type, {extends: tag || type.element_tag});	

}

// Submit multiple elements by id or element.
// When one is not filled in then an error is thrown.
// When an input is not required no errors will be thrown.
// An object will be returned with each input's id as the key and the input's value as value.
// Only supported extended input elements like `ExtendedInput`.
// @deprecated
vweb.elements.submit = function(...elements) {
	const params = {};
    let error;
    for (let i = 0; i < elements.length; i++) {
    	try {
    		let element = elements[i];
	    	if (typeof element === "string") {
	    		element = vweb.elements.get(element);
	    	}
	    	const id = element.id();
    		if (id == null || id === "") {
    			continue;
    		}
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


// Forward a function to a child so a user can easily create functions on the parent like border_radius() which actually set the border radius of a child.
// The new function still returns the this.
vweb.elements.forward_func_to_child = (func_name, child) => {
	return function(val) {
		console.log("OIOI")
		if (typeof child === "function") {
			child = child(this);
		}
		if (val == null) { return child[func_name]() };
		console.log("before", child[func_name]())
		child[func_name](val);
		console.log("after", child[func_name]())
		return this;
	}
}