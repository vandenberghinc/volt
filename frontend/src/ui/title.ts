/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Elements, VElementBaseSignature, VElement, VElementTagMap } from "../elements/module.js"

// Title.
@Elements.create({
    name: "TitleElement",
    default_style: {
        "margin": "0px 0px 0px 0px",
        "color": "inherit",
        "white-space": "wrap",
        "text-align": "inherit",
        "font-weight": "700", // for safari since it inherits HTMLElement only.
    }
})
export class TitleElement extends VElementTagMap.h1 {
	
	// Constructor.
	constructor(text: string = "") {
		
		// Initialize base class.
		super({
			derived: TitleElement,
		});
		
		// Set text.
		this.text(text); // do not use inner_html since the text might contain "<" etc.
	}
}
export const Title = Elements.wrapper(TitleElement);
export const NullTitle = Elements.create_null(TitleElement);
declare module './any_element.d.ts' { interface AnyElementMap { TitleElement: TitleElement }}

// Subtitle.
@Elements.create({
    name: "SubtitleElement",
    tag: "h2",
    default_style: {
        "margin": "0px 0px 0px 0px",
        "color": "inherit",
        "white-space": "wrap",
        "text-align": "inherit",
        "font-weight": "700", // for safari since it inherits HTMLElement only.
    },
})
export class SubtitleElement extends VElementTagMap.h1 {
	
	// Constructor.
	constructor(text: string = "") {
		
		// Initialize base class.
		super({
			derived: SubtitleElement,
		});
		
		// Set text.
		this.text(text); // do not use inner_html since the text might contain "<" etc.
	}
}
export const Subtitle = Elements.wrapper(SubtitleElement);
export const NullSubtitle = Elements.create_null(SubtitleElement);
declare module './any_element.d.ts' { interface AnyElementMap { SubtitleElement: SubtitleElement }}
