/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// List item.
@constructor_wrapper
@register_element
class ListItemElement extends CreateVElementClass({
	type: "ListItem",
	tag: "li",
	default_style: {},
}) {
	
	// Constructor.
	constructor(...content) {
		
		// Initialize base class.
		super();
	
		// Append content.
		this.append(...content);
	}
}

// Unordered List.
@constructor_wrapper
@register_element
class UnorderedListElement extends CreateVElementClass({
	type: "UnorderedList",
	tag: "ul",
	default_style: {},
}) {
	
	// Constructor.
	constructor(items = []) {
		
		// Initialize base class.
		super();
	
		// Add items.
		if (Array.isArray(items)) {
			items.iterate(node => {this.append_item(node)})
		} else {
			console.error(`Invalid type "${vweb.scheme.value_type(items)}" for parameter "items" the valid type is "array".`)
		}
	}

	// Append item.
	append_item(content) {
		if (!(content instanceof ListItemElement)) {
			content = ListItem(content);
		}
		this.append(content)
		return this;
	}
}

// Ordered List.
@constructor_wrapper
@register_element
class OrderedListElement extends CreateVElementClass({
	type: "OrderedList",
	tag: "ol",
	default_style: {},
}) {
	
	// Constructor.
	constructor(items = []) {
		
		// Initialize base class.
		super();
	
		// Add items.
		if (Array.isArray(items)) {
			items.iterate(node => {this.append_item(node)})
		} else {
			console.error(`Invalid type "${vweb.scheme.value_type(items)}" for parameter "items" the valid type is "array".`)
		}
	}

	// Append item.
	append_item(content) {
		if (!(content instanceof ListItemElement)) {
			content = ListItem(content);
		}
		this.append(content)
		return this;
	}		
}