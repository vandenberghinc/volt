/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */

// Imports.
import { Elements, VElementBaseSignature, VElement, VHTMLElement, VElementTagMap } from "../elements/module.js"

// Divider.
@Elements.create({
    name: "DividerElement",
    default_style: {
        "margin": "0px",
        "padding": "0px",
        "width": "100%",
        "height": "1px",
        "min-height": "1px",
        // "background": "black",
    },
})
export class DividerElement extends VElementTagMap.div {
    

    // Constructor.
	constructor() {
		super({
			derived: DividerElement,
		});
	}	
}
export const Divider = Elements.wrapper(DividerElement);
export const NullDivider = Elements.create_null(DividerElement);
declare module './any_element.d.ts' { interface AnyElementMap { DividerElement: DividerElement }}