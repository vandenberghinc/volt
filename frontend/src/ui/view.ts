/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Elements, VElementBaseSignature, VElement, VElementTagMap, AppendType } from "../elements/module.js"

// Scroller.
@Elements.create({
    name: "ViewElement",
    default_style: {
        "position": "absolute",
        "top": "0",
        "right": "0",
        "bottom": "0",
        "left": "0",
        "padding": "0px",
        "overflow": "hidden",
        "overflow-y": "none",
        "background": "none",
        "display": "flex", // to support vertical spacers.
        // "text-align": "start",
        "align-content": "flex-start", // align items at start, do not stretch / space when inside HStack.
        "flex-direction": "column",
    },
})
export class ViewElement extends VElementTagMap.div {
	
	// Constructor.
    constructor(...children: AppendType[]) {
		
		// Initialize base class.
		super({
			derived: ViewElement,
		});

		// Append children.
		this.append(...children);

	}
}
export const View = Elements.wrapper(ViewElement);
export const NullView = Elements.create_null(ViewElement);
declare module './any_element.d.ts' { interface AnyElementMap { ViewElement: ViewElement }}