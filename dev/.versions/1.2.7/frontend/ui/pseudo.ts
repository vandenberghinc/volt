/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Elements } from "../modules/elements"
import { CreateVElementClass } from "./element"

// Divider.
@Elements.register
export class PseudoElement extends CreateVElementClass({
	type: "Psuedo",
	tag: "div",
	default_style: {},
}) {
	constructor(...children: any[]) {
		super();

		// Append.
		this.append(...children);

		// Attributes.
		this.added_to_elements = [];
	}

	// Update the pseudo on all applied elements.
	update() : this {
		this.added_to_elements.iterate(item => {
			item.node.pseudo(item.type, this);
		})
		return this;
	}
}
export const Pseudo = Elements.wrapper(PseudoElement);