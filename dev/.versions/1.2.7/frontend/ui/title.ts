/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Elements } from "../modules/elements"
import { CreateVElementClass } from "./element"

// Title.
@Elements.register
export class TitleElement extends CreateVElementClass({
	type: "Title",
	tag: "h1",
	default_style: {
		"margin": "0px 0px 0px 0px",
		"color": "inherit",
		"white-space": "wrap",
		"text-align": "inherit",
		"font-weight": "700", // for safari since it inherits HTMLElement only.
	},
}) {
	
	// Constructor.
	constructor(text: string) {
		
		// Initialize base class.
		super();
		
		// Set text.
		this.text(text); // do not use inner_html since the text might contain "<" etc.
	}
}
export const Title = Elements.wrapper(TitleElement);

// Subtitle.
@Elements.register
export class SubtitleElement extends CreateVElementClass({
	type: "Subtitle",
	tag: "h1",
	default_style: {
		"margin": "0px 0px 0px 0px",
		"color": "inherit",
		"white-space": "wrap",
		"text-align": "inherit",
		"font-weight": "700", // for safari since it inherits HTMLElement only.
	},
}) {
	
	// Constructor.
	constructor(text: string) {
		
		// Initialize base class.
		super();
		
		// Set text.
		this.text(text); // do not use inner_html since the text might contain "<" etc.
	}
}
export const Subtitle = Elements.wrapper(SubtitleElement);