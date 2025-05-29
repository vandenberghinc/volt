/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Elements } from "../modules/elements"
import { CreateVElementClass } from "./element"

// Marcros.
type ArrayCallback = ((item: any, index: number, is_last: boolean) => any);
type ObjectCallback = ((value: any, key: string, index: number, is_last: boolean) => any);

// ForEach.
@Elements.register
export class ForEachElement extends CreateVElementClass({
	type: "ForEach",
	tag: "section",
	default_style: {
		"border": "none",
		"outline": "none",
		"background": "transparent",
	},
}) {
	
	// Constructor.
	constructor(items: any[], func: ArrayCallback);
	constructor(items: Record<string, any>, func: ObjectCallback);
	constructor(
		items: any[] | Record<string, any>,
		func: ArrayCallback | ObjectCallback,
	) {
		
		// Initialize base class.
		super();
		
		// Iterate.
		if (Array.isArray(items)) {
			for (let i = 0; i < items.length; i++) {
				this.append((func as ArrayCallback)(items[i], i, i === items.length - 1));
			}
		} else if (typeof items === "object") {
			let index = 0;
			const keys = Object.keys(items);
			keys.iterate((key) => {
				this.append((func as ObjectCallback)(key, items[key], index, index === keys.length - 1));
				++index;
			})
		} else {
			throw Error(`Parameter "items" has an invalid value type, the valid value types are "array" or "object".`);
		}
		
	}
}
export const ForEach = Elements.wrapper(ForEachElement);