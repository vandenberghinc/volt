/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Elements } from "../modules/elements"
import { CreateVElementClass } from "./element"
import { VStack, VStackElement } from "./stack"
import { Button } from "./button"

// Button.
@Elements.register
export class ContextMenuElement extends VStackElement {

	// Attributes.
	public remove_child_callback: any;

	// Constructor.
	// The content may either be an array with nodes, or an array with object like {label: ..., on_click: (element, event) => {}, on_render: (element) => {}}.
	// A node / object may also be "null" and it will be ignored.
	constructor(content: {
		label: string,
		on_click?: Function,
		on_render?: Function,
	}[] | HTMLElement[]) {
		
		// Initialize base classes.
		super();

		// Set element type.
        this.element_type = "ContextMenu";

        // Append content.
        content.iterate((item) => {
        	if (item == null) {
        		return null;
        	}
        	else if (!(item instanceof HTMLElement)) {
        		const button = Button(item.label)
	                .padding(5, 10, 5, 10)
	                .margin(0)
	                .font_size(12)
	                .leading()
	                .background("#FFFFFF15")
	                .border_radius(0)
	            if (typeof item.on_click === "function") {
	                button.on_click((element, event) => (item.on_click as Function)(element, event, this));
	            }
	            if (typeof item.on_render === "function") {
	                button.on_render((element) => (item.on_render as Function)(element));
	            }
        		this.append(button);
        	} else {
        		this.append(item);
        	}
        })

		// Set styling
		this
	        .z_index(2) // one higher than sidebar.
	        .padding(5, 0, 5, 0)
	        .color("white")
	        .background("gray")
	        .box_shadow("0px 0px 10px #00000050")
	        .border_radius(10)
	        .min_width(150)

	    // Remove child callback.
	    this.remove_child_callback = (event) => {
	    	if (!this.contains(event.target)) {
                this.remove();
            }
            document.body.removeEventListener("mousedown", this.remove_child_callback);
	    }
	}

	// Set default since it inherits an element.
	set_default() : this {
		return super.set_default(ContextMenuElement);
	}

	// Popup the context menu by a event.
	popup(event) : this {

		// Prevent default.
		event.preventDefault();

		// Show.
		super.show();

		// Set position.
		this.position(event.clientY, undefined, undefined, event.clientX)

		// Add child.
        document.body.appendChild(this as any);

        // Add event listener to body.
        document.body.addEventListener("mousedown", this.remove_child_callback);

        // Response.
        return this;
	}

	// Close the context menu.
	close() : this {

		// Remove from content.
		super.remove();

		// Remove event listener from body.
        document.body.removeEventListener("mousedown", this.remove_child_callback);

        // Response.
        return this;
	}
	remove() : this {

		// Remove from content.
		super.remove();

		// Remove event listener from body.
        document.body.removeEventListener("mousedown", this.remove_child_callback);

        // Response.
        return this;
	}		
}
export const ContextMenu = Elements.wrapper(ContextMenuElement);