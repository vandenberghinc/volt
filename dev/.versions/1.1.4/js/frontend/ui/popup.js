/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// RingLoader.
// - The width and height must be in pixels.
@constructor_wrapper
@register_element
class PopupElement extends VStackElement {
	constructor({
		title = "",
		text = "",
		no = "No",
		yes = "Yes",
		image = false,
		image_color = "white",
		content = [],
		auto_hide = true,
		auto_remove = false,
		animation_duration = 0, // in ms.
		blur = 0,
		on_no = () => {},
		on_yes = () => {},
		on_popup = () => {},
	}) {	

		// Initialize base class.
		super();

		// Set element type.
        this.element_type = "Popup";

		// Mutex.
        this.mutex = new Mutex();

        // Args.
        this.auto_hide = auto_hide;
        this.auto_remove = auto_remove;
		this.animation_duration = animation_duration;
		this.blur = blur;
        this.on_no_handler = on_no;
        this.on_yes_handler = on_yes;
        this.on_popup_handler = on_popup;
        this.escape_handler = (event) => {
            if (event.key == "Escape") {
                this.close();
            }
        };

		// Image.
		this.image = ImageMask(image)
            .mask_color(image_color)
            .frame(35, 35)
            .position(-17.5, "calc(50% - 17.5px)", null, null)
            .parent(this)
            .abs_parent(this);
        if (image === false) {
        	this.image.hide();
        }

        // Title.
        this.title = Title()
        	.inner_html(title) // always use inner html for this for for example links and code lines.
            .font_family("inherit")
            .font_weight(500)
            .font_size(34)
            .abs_parent(this)
            .parent(this)

        // Text.
        this.text = Text()
        	.inner_html(text) // always use inner html for this for for example links and code lines.
            .font_family("inherit")
            .font_size(16)
            .line_height(22)
            .max_width(300)
            .margin(15, 20, 0, 20)
            .wrap(true)
            .abs_parent(this)
            .parent(this)

        // No button.
        this.no_button = LoaderButton(no)
            .padding(10, 10, 10, 10)
            .stretch(true)
            .margin_right(5)
            .abs_parent(this)
            .parent(this)
            .on_click(async () => {
            	this.no_button.show_loader();
            	await this.close();
            	this.no_button.hide_loader();
            })

        // Yes button.
        this.yes_button = LoaderButton(yes)
            .padding(10, 10, 10, 10)
            .stretch(true)
            .margin_left(5)
            .abs_parent(this)
            .parent(this)
            .on_click(async () => {
            	this.yes_button.show_loader();
            	let removed_escape_handler = false;
            	if (this.auto_remove || this.auto_hide) {
					this.opacity(0);
					if (this.blur != null) { this.background_blur(0); }
					if (this.auto_remove) {
						setTimeout(() => this.remove(), this.animation_duration);
					} else if (this.auto_hide) {
						setTimeout(() => this.hide(), this.animation_duration);
					}
					document.body.removeEventListener("keydown", this.escape_handler);
					removed_escape_handler = true;
				}
	            const res = this.on_yes_handler(this);
	            if (res instanceof Promise) {
	            	try { await res; }
	            	catch (err) { console.error(err); }
	            }
	            if (!removed_escape_handler && (this.display() === "none" || this.visibility() === "hidden" || this.parentElement == null)) {
	            	document.body.removeEventListener("keydown", this.escape_handler);
	            }
	            this.mutex.unlock();
	            this.yes_button.hide_loader();
            });

        // The buttons.
        this.buttons = HStack(this.no_button, this.yes_button)
	        .width("100%")
	        .margin_top(30)
	        .abs_parent(this)
	        .parent(this)

       	// The custom content.
       	this.content = VStack(...content)
       		.abs_parent(this)
       		.parent(this);

        // The content.
        this.widget = VStack(
	            this.image,
	            this.title,
	            this.text,
	            this.content,
	            this.buttons,
	        )
	        .position("relative")
	        .text_center()
	        .padding(40, 20, 20, 20)
	        .max_width(400)
	        .border_radius(10)
	        .background("black")
	        .border(1, "gray")
	        .box_shadow("0px 0px 10px #00000050")
	        .abs_parent(this)
	        .parent(this)

		// Create content.
        this.append(this.widget)

	    // Styling.
	    this.opacity(1);
	    this.transition(`opacity ${animation_duration*0.9}ms ease, backdrop-filter ${animation_duration}ms ease`)
	    this.position(0, 0, 0, 0)
	    // do not use background blur since that decreases the performance too much.
	    this.background("#00000060")
	    this.center()
	    this.center_vertical()
	    this.z_index(10000)
	    this.on_click((_, event) => {
	    	if (event.target === this.widget || this.widget.is_nested_child(event.target)) {
	    		return null;
	    	}
	    	this.close(true)
	    })
	    if (blur != null && blur > 0) {
	    	this.background_blur(blur);
	    }
	}

	// Set default since it inherits HStackElement.
	set_default() {
		return super.set_default(PopupElement);
	}

	// Await the previous popup.
	async await() {
		await this.mutex.lock();
		this.mutex.unlock();
	}

	// Remove with animation.
	async remove_animation() {
		return new Promise((resolve) => {
			this.opacity(0);
			if (this.blur != null) { this.background_blur(0); }
			document.body.removeEventListener("keydown", this.escape_handler);
			setTimeout(() => {this.remove(); resolve()}, this.animation_duration);
		});
	}

	// Hide with animation.
	async hide_animation() {
		return new Promise((resolve) => {
			this.opacity(0);
			if (this.blur != null) { this.background_blur(0); }
			document.body.removeEventListener("keydown", this.escape_handler);
			setTimeout(() => {this.hide(); resolve()}, this.animation_duration);
		});
	}

	// Close the popup.
	async close() {
		const promise = new Promise(async (resolve) => {
			if (this.auto_remove) {
				await this.remove_animation();
			} else if (this.auto_hide) {
				await this.hide_animation();
			}
			resolve()
		})
		if (this._on_no_called !== true) { // since this could also be called from the on no handler.
			this._on_no_called = true;
			const res = this.on_no_handler(this);
			if (res instanceof Promise) {
            	try { await res; }
            	catch (err) { console.error(err); }
            }
		}
        this.mutex.unlock();
        await promise;
	}

	// Set image color.
	image_color(value) {
		if (value == null) {
			return this.image.mask_color();
		}
		this.image.mask_color(value);
		return this;
	}

	// Default popup function.
	async popup ({
        title = null,
        text = null,
        image = null,
        image_color = null,
        content = null,
        on_no = null,
        on_yes = null,
        auto_close = true,
    } = {}) {

    	// Call on popup.
		this.on_popup_handler(this);

		this.opacity(0);
		if (this.blur != null) { this.background_blur(0); }
		this.show();
		this.getBoundingClientRect();
		this.opacity(1);
		if (this.blur != null) { this.background_blur(this.blur); }

		// Reset flags.
		this._on_no_called = false;

    	// Set args.
    	this.auto_close = auto_close;
    	if (title !== null) {
    		this.title.inner_html(title);
    	}
    	if (text !== null) {
    		this.text.inner_html(text);
    	}
    	if (image !== null) {
    		this.image.src(image);
    		this.image.show();
    	}
    	if (image_color !== null) {
    		this.image.mask_color(image_color);
    	}
    	if (on_no !== null) {
    		this.on_no_handler = on_no;
    	}
    	if (on_yes !== null) {
    		this.on_yes_handler = on_yes;
    	}

    	// Await mutex.
        await this.mutex.lock();

        // Create content.
        if (content !== null) {
	        this.content.inner_html("");
	        this.content.append(...content);
	    }

        // Focus.
        this.show();
        this.focus();

        // Bind event listener close by escape.
        document.body.addEventListener("keydown", this.escape_handler); // for some reason on_key_down on main element is not catched.
	}
}
// vweb.elements.register(Popup);