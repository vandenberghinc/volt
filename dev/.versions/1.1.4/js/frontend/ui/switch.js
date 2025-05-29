/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Switch button.
@constructor_wrapper
@register_element
class SwitchElement extends VStackElement {

	// Constructor.
	constructor(enabled = false) {
		
		// Initialize base class.
		super();

		// Set element type.
        this.element_type = "Switch";
		
		// The slider background.
		this.slider = VStack()
	        .background("white")
	        // .border(`1px solid ${SETTINGS.theme.lightest_widget_background}90`)
	        .frame(35, 12.5)
	        .border_radius(10)
	        .overflow("visible")
	        .box_shadow(`0px 0px 2px #00000030`)
	        .parent(this)

	    // The button.
        this.button = VStack()
            .border_radius("50%")
            .frame(17.5, 17.5)
            .background("gray")
            .position("absolute")
            .left(0)
            .transition("left 0.15s ease-out")
            .box_shadow(`0px 0px 2px #00000060`)
            .on_click(() => this.toggle())
            .parent(this)

        // Append.
        this.append(this.slider, this.button);

        // Styling.
        this.position("relative")
        this.width(35)
        this.flex_shrink(0)
        this.center_vertical()

        // On change handler.
        this.on_change_handler = () => {};

        // Attributes.
        this._enabled = enabled;
        this._enabled_color = "green";
        this._disabled_color = "gray";

        // Alias func.
        this.enabled = this.value;

        // Set enabled value.
        this.value(enabled, false);

        // Set default theme update.
        this.on_theme_update(() => {
        	this.value(this._enabled, false);
        })
    }

    // Set default since it inherits an element.
	set_default() {
		return super.set_default(SwitchElement);
	}

    // Set width.
	width(value) {
		if (value == null) {
			return super.width();
		}
		super.width(value);
		this.slider.width(value);
		return this;
	}
	min_width(value) {
		if (value == null) {
			return super.min_width();
		}
		super.min_width(value);
		this.slider.min_width(value);
		return this;
	}
	max_width(value) {
		if (value == null) {
			return super.max_width();
		}
		super.max_width(value);
		this.slider.max_width(value);
		return this;
	}

	// Set width.
	height(value) {
		if (value == null) {
			return super.height();
		}
		super.height(value);
		this.slider.height(value / 2);
		return this;
	}
	min_height(value) {
		if (value == null) {
			return super.min_height();
		}
		super.min_height(value);
		this.slider.min_height(value / 2);
		return this;
	}
	max_height(value) {
		if (value == null) {
			return super.max_height();
		}
		super.max_height(value);
		this.slider.max_height(value / 2);
		return this;
	}

	// Frame.
	frame(width, height) {
		if (width != null) {
			this.width(width);
		}
		if (height != null) {
			this.height(height);
		}
		return this;
	}
	min_frame(width, height) {
		if (width != null) {
			this.min_width(width);
		}
		if (height != null) {
			this.min_height(height);
		}
		return this;
	}
	max_frame(width, height) {
		if (width != null) {
			this.max_width(width);
		}
		if (height != null) {
			this.max_height(height);
		}
		return this;
	}

    // Get or set the enabled color.
    enabled_color(value) {
    	if (value == null) {
    		return this._enabled_color;
    	}
    	this._enabled_color = value;
    	return this;
    }

    // Get or set the disabled color.
    disabled_color(value) {
    	if (value == null) {
    		return this._disabled_color;
    	}
    	this._disabled_color = value;
    	return this;
    }

    // Toggle the value.
    toggle() {
    	return this.value(!this._enabled);
    }

    // Get or set the enabled boolean value.
    value(value, animate = true) {
        if (value == null) {
            return this._enabled;
        }
        else if (value === true) {
            this._enabled = value;
            if (animate) {
            	clearTimeout(this.timeout);
            	this.timeout = setTimeout(() => this.button.background(this._enabled_color), 140);
            } else {
            	this.button.background(this._enabled_color);
            }
            const slider_width = this.slider.getBoundingClientRect().width;
            const button_width = this.button.getBoundingClientRect().width;
            if (slider_width && button_width) {
            	this.button.style.left = `${slider_width - button_width}px`;
            	this.button.style.right = "auto";
            } else {
            	this.button.style.left = "auto";
            	this.button.style.right = "0px";
            }
            this.on_change_handler(this, this._enabled);
        }
        else if (value === false) {
            this._enabled = value;
            if (animate) {
            	clearTimeout(this.timeout);
            	this.timeout = setTimeout(() => this.button.background(this._disabled_color), 140);
            } else {
            	this.button.background(this._disabled_color);
            }
        	const slider_width = this.slider.getBoundingClientRect().width;
            const button_width = this.button.getBoundingClientRect().width;
            if (slider_width && button_width) {
            	if (this.button.style.left === "auto") { // otherwise the transition does not show when it was initialized as true.
            		this.button.style.left = `${slider_width - button_width}px`; 
            		setTimeout(() => {
            			this.button.style.right = "auto"; 
	            		this.button.style.left = "0px";	
            		}, 10)
            	} else {
            		this.button.style.right = "auto"; 
            		this.button.style.left = "0px";	
            	}
            } else {
            	this.button.style.left = "0px";
            	this.button.style.right = "auto";
            }
            this.on_change_handler(this, this._enabled);
        }
        return this;
    }

    // Set the on change handler.
    on_change(handler) {
    	if (handler == null) {
    		return this.on_change_handler;
    	}
    	this.on_change_handler = handler;
    	return this;
    }
		
}