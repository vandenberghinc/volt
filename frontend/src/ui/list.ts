/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */

// Imports.
import { Elements, VElementBaseSignature, VElement, VElementTagMap } from "../elements/module.js"
import { Schema } from "@vandenberghinc/vlib/frontend";

// List item.
@Elements.create({
    name: "ListItemElement",
})
export class ListItemElement extends VElementTagMap.li {
    
	// Constructor.
	constructor(...content: any[]) {
		
		// Initialize base class.
		super({ derived: ListItemElement });
	
		// Append content.
		this.append(...content);
	}
}
export const ListItem = Elements.wrapper(ListItemElement);
export const NullListItem = Elements.create_null(ListItemElement);
declare module './any_element.d.ts' { interface AnyElementMap { ListItemElement: ListItemElement }}

// Unordered List.
@Elements.create({
    name: "UnorderedListElement",
    default_style: {
        "padding-left": "1.5em", // add some left padding to ensure the ::marker is visible.
    }
})
export class UnorderedListElement extends VElementTagMap.ul {
	
	// Constructor.
	constructor(items: (ListItemElement | any | any[])[] = []) {
		
		// Initialize base class.
		super({ derived: UnorderedListElement });
	
		// Add items.
		if (Array.isArray(items)) {
			items.iterate(node => {this.append_item(node)})
		} else {
			console.error(`Invalid type "${Schema.value_type(items)}" for parameter "items" the valid type is "array".`)
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
export const NullUnorderedList = Elements.create_null(UnorderedListElement);
declare module './any_element.d.ts' { interface AnyElementMap { UnorderedListElement: UnorderedListElement }}

// Ordered List.
@Elements.create({
    name: "OrderedListElement",
    default_style: {
        "padding-left": "1.5em", // add some left padding to ensure the ::marker is visible.
    }
})
export class OrderedListElement extends VElementTagMap.ol {

	// Constructor.
	constructor(items: (ListItemElement | any | any[])[] = []) {
		
		// Initialize base class.
		super({ derived: OrderedListElement });
	
		// Add items.
		if (Array.isArray(items)) {
			items.iterate(node => {this.append_item(node)})
		} else {
			console.error(`Invalid type "${Schema.value_type(items)}" for parameter "items" the valid type is "array".`)
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
export const NullOrderedList = Elements.create_null(OrderedListElement);
declare module './any_element.d.ts' { interface AnyElementMap { OrderedListElement: OrderedListElement }}
