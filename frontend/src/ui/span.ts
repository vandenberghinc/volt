/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Elements, VElementBaseSignature, VElement, VElementTagMap } from "../elements/module.js"

// Span.
@Elements.create({
    name: "SpanElement",
})
export class SpanElement extends VElementTagMap.span {

    // Constructor.
	constructor(text?: string) {
		
		// Initialize base class.
		super({ derived: SpanElement });
	
		// Set text.
		if (text) { this.text(text); } // never user assign to innerHTML, always use text()
	}	
}
export const Span = Elements.wrapper(SpanElement);
export const NullSpan = Elements.create_null(SpanElement);
declare module './any_element.d.ts' { interface AnyElementMap { SpanElement: SpanElement }}