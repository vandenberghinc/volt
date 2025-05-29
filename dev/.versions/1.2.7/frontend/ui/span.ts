/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Elements } from "../modules/elements"
import { CreateVElementClass } from "./element"

// Text.
@Elements.register
export class SpanElement extends CreateVElementClass({
	type: "Span",
	tag: "span",
	default_style: {},
}) {
	
	// Constructor.
	constructor(inner_html: string) {
		
		// Initialize base class.
		super();
	
		// Set text.
		this.inner_html(inner_html);
	}	
}
export const Span = Elements.wrapper(SpanElement);