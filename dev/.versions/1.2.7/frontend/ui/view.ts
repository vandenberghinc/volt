/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Elements } from "../modules/elements"
import { CreateVElementClass } from "./element"

// Scroller.
@Elements.register
export class ViewElement extends CreateVElementClass({
	type: "View",
	tag: "div",
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
}) {
	
	// Constructor.
	constructor(...children: any[]) {
		
		// Initialize base class.
		super();

		// Append children.
		this.append(...children);

	}
}
export const View = Elements.wrapper(ViewElement);