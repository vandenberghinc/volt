/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Elements } from "../modules/elements"
import { Scheme } from "../modules/scheme"
import { CreateVElementClass } from "./element"

// List item.
@Elements.register
export class ListItemElement extends CreateVElementClass({
	type: "ListItem",
	tag: "li",
	default_style: {},
}) {
	
	// Constructor.
	constructor(...content: any[]) {
		
		// Initialize base class.
		super();
	
		// Append content.
		this.append(...content);
	}
}
export const ListItem = Elements.wrapper(ListItemElement);

// Unordered List.
@Elements.register
export class UnorderedListElement extends CreateVElementClass({
	type: "UnorderedList",
	tag: "ul",
	default_style: {},
}) {
	
	// Constructor.
	constructor(items: (ListItemElement | any | any[])[] = []) {
		
		// Initialize base class.
		super();
	
		// Add items.
		if (Array.isArray(items)) {
			items.iterate(node => {this.append_item(node)})
		} else {
			console.error(`Invalid type "${Scheme.value_type(items)}" for parameter "items" the valid type is "array".`)
		}
	}

	// Append item.
	append_item(content: ListItemElement | any | any[]) : this {
		if (!(content instanceof ListItemElement)) {
			content = ListItem(content);
		}
		this.append(content)
		return this;
	}
}
export const UnorderedList = Elements.wrapper(UnorderedListElement);

// Ordered List.
@Elements.register
export class OrderedListElement extends CreateVElementClass({
	type: "OrderedList",
	tag: "ol",
	default_style: {},
}) {
	
	// Constructor.
	constructor(items: (ListItemElement | any | any[])[] = []) {
		
		// Initialize base class.
		super();
	
		// Add items.
		if (Array.isArray(items)) {
			items.iterate(node => {this.append_item(node)})
		} else {
			console.error(`Invalid type "${Scheme.value_type(items)}" for parameter "items" the valid type is "array".`)
		}
	}

	// Append item.
	append_item(content: ListItemElement | any | any[]) : this {
		if (!(content instanceof ListItemElement)) {
			content = ListItem(content);
		}
		this.append(content)
		return this;
	}		
}
export const OrderedList = Elements.wrapper(OrderedListElement);