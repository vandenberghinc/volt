/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Divider.
@constructor_wrapper
@register_element
class PseudoElement extends CreateVElementClass({
	type: "Psuedo",
	tag: "div",
	default_style: {},
}) {
	constructor(...children) {
		super();

		// Append.
		this.append(...children);

		// Attributes.
		this.added_to_elements = [];
	}

	// Update the pseudo on all applied elements.
	update() {
		this.added_to_elements.iterate(item => {
			item.node.pseudo(item.type, this);
		})
		return this;
	}
}