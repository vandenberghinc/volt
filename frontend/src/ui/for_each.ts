/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Elements, VElementBaseSignature, VElement, VElementTagMap } from "../elements/module.js"

// Marcros.
type ArrayCallback = ((item: any, index: number, is_last: boolean) => any);
type ArrayCallback1 = ((item: any, index: number) => any);
type ArrayCallback2 = ((item: any) => any);
type ObjectCallback = ((value: any, key: string, index: number, is_last: boolean) => any);
type ObjectCallback1 = ((value: any, key: string, index: number) => any);
type ObjectCallback2 = ((value: any, key: string) => any);
type ObjectCallback3 = ((value: any) => any);

// ForEach.
@Elements.create({
    name: "ForEachElement",
    default_style: {
        "border": "none",
        "outline": "none",
        "background": "transparent",
    },
})
export class ForEachElement extends VElementTagMap.section {

	// Constructor.
	constructor(items: Array<any>, func: ArrayCallback);
	constructor(items: Array<any>, func: ArrayCallback1);
	constructor(items: Array<any>, func: ArrayCallback2);
	constructor(items: Record<string, any>, func: ObjectCallback);
	constructor(items: Record<string, any>, func: ObjectCallback1);
	constructor(items: Record<string, any>, func: ObjectCallback2);
	constructor(items: Record<string, any>, func: ObjectCallback3);
	constructor(items, func) {
		
		// Initialize base class.
		super({
			derived: ForEachElement,
		});
		
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
export const ForEach = Elements.wrapper(ForEachElement) as {
    (items: Array<any>, func: ArrayCallback): ArrayCallback;
    (items: Array<any>, func: ArrayCallback): ArrayCallback1;
    (items: Array<any>, func: ArrayCallback): ArrayCallback2;
    (items: Record<string, any>, func: ObjectCallback): ObjectCallback;
    (items: Record<string, any>, func: ObjectCallback): ObjectCallback1;
    (items: Record<string, any>, func: ObjectCallback): ObjectCallback2;
    (items: Record<string, any>, func: ObjectCallback): ObjectCallback3;
};
export const NullForEach = Elements.create_null(ForEachElement);
declare module './any_element.d.ts' { interface AnyElementMap { ForEachElement: ForEachElement }}