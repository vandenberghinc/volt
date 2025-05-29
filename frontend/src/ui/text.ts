/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Elements, VElementBaseSignature, VElement, VElementTagMap } from "../elements/module.js"

// Text.
@Elements.create({
    name: "TextElement",
    default_style: {
        "margin": "0px 0px 0px 0px",
        "padding": "0", // 2.5px
        "font-size": "20px",
        "color": "inherit",
        "text-align": "inherit",
        "white-space": "wrap",
    }
})
export class TextElement extends VElementTagMap.p {
	
	// Constructor.
	constructor(text?: string) {
		
		// Initialize base class.
		super({
			derived: TextElement,
		});
	
		// Set text.
		if (text) {
			this.text(text); // do not use inner_html since the text might contain "<" etc.
		}
	}		
}
export const Text = Elements.wrapper(TextElement);
export const NullText = Elements.create_null(TextElement);
declare module './any_element.d.ts' { interface AnyElementMap { TextElement: TextElement }}