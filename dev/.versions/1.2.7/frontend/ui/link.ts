/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Elements } from "../modules/elements"
import { CreateVElementClass } from "./element"

// Link.
@Elements.register
export class AnchorElement extends CreateVElementClass({
	type: "Anchor",
	tag: "a",
	default_style: {
		"font-family": "inherit",
		"font-size": "inherit",
		"color": "inherit",
		"text-decoration": "none",
		"text-underline-position": "none",
		"cursor": "pointer",
		"outline": "none",
		"border": "none",
	},
}) {
	
	// Constructor.
	constructor(href: string, alt: string, text?: string) {
		
		// Initialize base class.
		super();
		
		// Set href.
		this.href(href);
		
		// Set alt.
		this.alt(alt);

		// Set text.
		this.text(text ?? alt);
	}		
}
export const Anchor = Elements.wrapper(AnchorElement);

// Link.
@Elements.register
export class LinkElement extends CreateVElementClass({
	type: "Link",
	tag: "a",
	default_style: {
		"font-family": "inherit",
		"font-size": "1em",
		"color": "rgb(85, 108, 214)",
		"text-decoration": "underline",
		"text-underline-position": "auto",
		"cursor": "pointer",
	},
}) {
	
	// Constructor.
	constructor(text: string, href: string) {
		
		// Initialize base class.
		super();

		// Set text.
		this.text(text);
		
		// Set href.
		this.href(href);
		
	}		
}
export const Link = Elements.wrapper(LinkElement);
