/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Elements, VElementBaseSignature, VElement, VElementTagMap, AppendType } from "../elements/module.js"

// Divider.
@Elements.create({
    name: "PseudoElement",
})
export class PseudoElement extends VElementTagMap.div {

	// Attributes.
	public added_to_elements: { node: VElement, type: string }[] = [];

    constructor(...children: AppendType[]) {
		super({ derived: PseudoElement, });

		// Append.
		this.append(...children);
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
export const NullPseudo = Elements.create_null(PseudoElement);
declare module './any_element.d.ts' { interface AnyElementMap { PseudoElement: PseudoElement }}