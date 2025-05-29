/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Elements } from "../modules/elements"
import { CreateVElementClass } from "./element"

// Spacer.
@Elements.register
export class SpacerElement extends CreateVElementClass({
	type: "Spacer",
	tag: "div",
	default_style: {
		"margin": "0px",
		"padding": "0px",
		"flex": "1",
		"flex-grow": "1",
		"background": "#00000000",
		"filter": "opacity(0)",
		"justify-content": "stretch",
	},
}) {
	constructor() { super(); }	
}
export const Spacer = Elements.wrapper(SpacerElement);