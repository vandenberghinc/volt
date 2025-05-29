/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Elements, VElementBaseSignature, VElement, VHTMLElement } from "../elements/module.js"

// Span.
@Elements.create({
    name: "StyleElement",
    tag: "section",
})
export class StyleElement extends (VHTMLElement as any as VElementBaseSignature) {

	constructor(style?: CSSStyleDeclaration) {
		
		// Initialize base class.
		super({ derived: StyleElement });
	
		// Set style.
		if (style != null) {
			this.styles(style);
		}
	}	
}
export const Style = Elements.wrapper(StyleElement);
export const NullStyle = Elements.create_null(StyleElement);
declare module './any_element.d.ts' { interface AnyElementMap { StyleElement: StyleElement }}