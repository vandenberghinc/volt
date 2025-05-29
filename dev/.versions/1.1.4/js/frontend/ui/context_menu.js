/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Button.
@constructor_wrapper
@register_element
class ContextMenuElement extends VStackElement {

	// Constructor.
	// The content may either be an array with nodes, or an array with object like {label: ..., on_click: (element, event) => {}, on_render: (element) => {}}.
	// A node / object may also be "null" and it will be ignored.
	constructor(content) {
		
		// Initialize base classes.
		super();

		// Set element type.
        this.element_type = "ContextMenu";

        // Append content.
        content.iterate((item) => {
        	if (item == null) {
        		return null;
        	}
        	else if (typeof item === "object") {
        		const button = Button(item.label)
	                .padding(5, 10, 5, 10)
	                .margin(0)
	                .font_size(12)
	                .leading()
	                .background("#FFFFFF15")
	                .border_radius(0)
	            if (typeof item.on_click === "function") {
	                button.on_click((element, event) => item.on_click(element, event, this));
	            }
	            if (typeof item.on_render === "function") {
	                button.on_render((element) => item.on_render(element));
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
	    this.remove_child_callback = () => {
	    	if (!this.contains(event.target)) {
                this.remove();
            }
            document.body.removeEventListener("mousedown", this.remove_child_callback);
	    }
	}

	// Set default since it inherits an element.
	set_default() {
		return super.set_default(ContextMenuElement);
	}

	// Popup the context menu by a event.
	popup(event) {

		// Prevent default.
		event.preventDefault();

		// Show.
		super.show();

		// Set position.
		this.position(event.clientY, null, null, event.clientX)

		// Add child.
        document.body.appendChild(this);

        // Add event listener to body.
        document.body.addEventListener("mousedown", this.remove_child_callback);
	}

	// Close the context menu.
	close() {

		// Remove from content.
		super.remove();

		// Remove event listener from body.
        document.body.removeEventListener("mousedown", this.remove_child_callback);
	}
	remove() {

		// Remove from content.
		super.remove();

		// Remove event listener from body.
        document.body.removeEventListener("mousedown", this.remove_child_callback);
	}		
}