/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Elements, VElementBaseSignature, VElement, VElementTagMap } from "../elements/module.js"

// Spacer.
@Elements.create({
    name: "SpacerElement",
    default_style: {
        "margin": "0px",
        "padding": "0px",
        "flex": "1",
        "flex-grow": "1",
        "background": "#00000000",
        "filter": "opacity(0)",
        "justify-content": "stretch",
    }
})
export class SpacerElement extends VElementTagMap.div {

	constructor() {
		super({
			derived: SpacerElement,
		});
	}	
}
export const Spacer = Elements.wrapper(SpacerElement);
export const NullSpacer = Elements.create_null(SpacerElement);
declare module './any_element.d.ts' { interface AnyElementMap { SpacerElement: SpacerElement }}