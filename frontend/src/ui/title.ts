/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */

// Imports.
import { Elements, VElementBaseSignature, VElement, VElementTagMap } from "../elements/module.js"

// Title.
const default_title_style = {
    "margin": "0px 0px 0px 0px",
    "color": "inherit",
    "white-space": "wrap",
    "text-align": "inherit",
    "font-weight": "700", // for safari since it inherits HTMLElement only.
}
@Elements.create({
    name: "TitleElement",
    default_style: { ...default_title_style },
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
    default_style: { ...default_title_style },
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

/** A specific title ensured to use the `h1` html tag. */
@Elements.create({ name: "H1Element", tag: "h1", default_style: { ...default_title_style} })
export class H1Element extends VElementTagMap.h1 {
    constructor(text: string = "") {
        super({ derived: H1Element });
        this.text(text); // do not use inner_html since the text might contain "<" etc.
    }
}
export const H1 = Elements.wrapper(H1Element);
export const NullH1 = Elements.create_null(H1Element);
declare module './any_element.d.ts' { interface AnyElementMap { H1Element: H1Element } }

/** A specific title ensured to use the `h2` html tag. */
@Elements.create({ name: "H2Element", tag: "h2", default_style: { ...default_title_style } })
export class H2Element extends VElementTagMap.h1 {
    constructor(text: string = "") {
        super({ derived: H2Element });
        this.text(text); // do not use inner_html since the text might contain "<" etc.
    }
}
export const H2 = Elements.wrapper(H2Element);
export const NullH2 = Elements.create_null(H2Element);
declare module './any_element.d.ts' { interface AnyElementMap { H2Element: H2Element } }

/** A specific title ensured to use the `h3` html tag. */
@Elements.create({ name: "H3Element", tag: "h3", default_style: { ...default_title_style } })
export class H3Element extends VElementTagMap.h1 {
    constructor(text: string = "") {
        super({ derived: H3Element });
        this.text(text); // do not use inner_html since the text might contain "<" etc.
    }
}
export const H3 = Elements.wrapper(H3Element);
export const NullH3 = Elements.create_null(H3Element);
declare module './any_element.d.ts' { interface AnyElementMap { H3Element: H3Element } }

/** A specific title ensured to use the `h4` html tag. */
@Elements.create({ name: "H4Element", tag: "h4", default_style: { ...default_title_style } })
export class H4Element extends VElementTagMap.h1 {
    constructor(text: string = "") {
        super({ derived: H4Element });
        this.text(text); // do not use inner_html since the text might contain "<" etc.
    }
}
export const H4 = Elements.wrapper(H4Element);
export const NullH4 = Elements.create_null(H4Element);
declare module './any_element.d.ts' { interface AnyElementMap { H4Element: H4Element } }

/** A specific title ensured to use the `h5` html tag. */
@Elements.create({ name: "H5Element", tag: "h5", default_style: { ...default_title_style } })
export class H5Element extends VElementTagMap.h1 {
    constructor(text: string = "") {
        super({ derived: H5Element });
        this.text(text); // do not use inner_html since the text might contain "<" etc.
    }
}
export const H5 = Elements.wrapper(H5Element);
export const NullH5 = Elements.create_null(H5Element);
declare module './any_element.d.ts' { interface AnyElementMap { H5Element: H5Element } }

/** A specific title ensured to use the `h6` html tag. */
@Elements.create({ name: "H6Element", tag: "h6", default_style: { ...default_title_style } })
export class H6Element extends VElementTagMap.h1 {
    constructor(text: string = "") {
        super({ derived: H6Element });
        this.text(text); // do not use inner_html since the text might contain "<" etc.
    }
}
export const H6 = Elements.wrapper(H6Element);
export const NullH6 = Elements.create_null(H6Element);
declare module './any_element.d.ts' { interface AnyElementMap { H6Element: H6Element } }
