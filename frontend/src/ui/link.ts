/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Elements, VElementBaseSignature, VElement, VElementTagMap } from "../elements/module.js"

// Link.
@Elements.create({
    name: "AnchorElement",
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
})
export class AnchorElement extends VElementTagMap.a {
	
	// Constructor.
	constructor(text?: string, href?: string, alt?: string) {
		
		// Initialize base class.
		super({
			derived: AnchorElement,
		});
		
		// Set href.
		if (href !== undefined) { this.href(href); }
		
		// Set alt.
		if (alt !== undefined) { this.alt(alt); }

		// Set text.
		if (text !== undefined || alt !== undefined) { this.text((text ?? alt) as string); }
	}		
}
export const Anchor = Elements.wrapper(AnchorElement);
export const NullAnchor = Elements.create_null(AnchorElement);
declare module './any_element.d.ts' { interface AnyElementMap { AnchorElement: AnchorElement }}

// Link.
@Elements.create({
    name: "LinkElement",
    default_style: {
        "font-family": "inherit",
        "font-size": "1em",
        "color": "rgb(85, 108, 214)",
        "text-decoration": "underline",
        "text-underline-position": "auto",
        "cursor": "pointer",
    },
})
export class LinkElement extends VElementTagMap.a {
	
	// Constructor.
	constructor(text?: string, href?: string) {
		
		// Initialize base class.
		super({
			derived: LinkElement,
		});

		// Set text.
		if (text !== undefined) { this.text(text); }
		
		// Set href.
		if (href !== undefined) { this.href(href); }
		
	}		
}
export const Link = Elements.wrapper(LinkElement);
export const NullLink = Elements.create_null(LinkElement);
declare module './any_element.d.ts' { interface AnyElementMap { LinkElement: LinkElement }}