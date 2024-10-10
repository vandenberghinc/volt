/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// Dropdown element. 
/*	@docs:
	@nav: Frontend
	@chapter: Elements
	@title: Dropdown element
	@descr: Easily create a dropdown element.
	@param:
		@name: target
		@descr: The target element for where the dropdown will be placed.
		@type: Node
	@param:
		@name: animate
		@descr: Enable animations.
		@type: boolean
	@param:
		@name: duration
		@descr: The animation duration in milliseconds.
		@type: number
	@param:
		@name: side
		@descr: Expand to the `"left"` or `"right"` side relative to the target element.
		@type: string
	@param:
		@name: auto_remove
		@descr: Auto remove the dropdown when it is closed.
		@type: boolean
	@param:
		@name: use_target_min
		@descr: Use the target element for a minimum width of the dropdown.
		@type: boolean
	@param:
		@name: below_target
		@descr: Place the dropdown below the target with by default an `y_offset` of `10`, unless `y_offset` is defined as `false`.
		@type: boolean
	@param:
		@name: x_offset
		@descr: The additional x offset of the dropdown's position, this value will be added the computed x position.
		@type: number
	@param:
		@name: y_offset
		@descr: The additional y offset of the dropdown's position, this value will be added the computed y position.
		@type: number
	@param:
		@name: content
		@descr: Optional content array to easily create a context-menu like dropdown menu.
		@type: object[]
		@attributes_type: Content
		@attr:
			@name: text
			@descr: The content text.
			@required: true
			@type: string
		@attr:
			@name: image
			@descr: The content image source.
			@type: string
		@attr:
			@name: image_padding
			@descr: The image padding.
			@type: number
		@attr:
			@name: image_top
			@descr: The image margin top.
			@type: number
		@attr:
			@name: href
			@descr: The href redirect on click.
			@type: string
		@attr:
			@name: callback / on_click
			@descr: The on click callback.
			@type: function
		@attr:
			@name: on_click_redirect
			@descr: The on click redirect function arguments.
			@type: string
		@attr:
			@name: anchor
			@descr: Flag indicating if the content node should be an anchor.
			@type: boolean
			@default: false
 */
@constructor_wrapper
@register_element
class DropdownElement extends VStackElement {
	constructor({
		target = null,
		animate = true,
		duration = 300,
		side = "left",
		auto_remove = false,
		min_width = null,
		max_width = null,
		min_height = null,
		max_height = null,
		use_target_min = false,
		below_target = false,
		x_offset = null,
		y_offset = null,
		content = null,
	} = {}) {

		// Base.
		super();

		// Parameters.
		this.target = target;
		this.animate = animate;
		this.duration = duration;
		this.side = side;
		this.use_target_min = use_target_min;
		this.auto_remove = auto_remove;
		this._min_width = min_width;
		this._max_width = max_width;
		this._min_height = min_height;
		this._max_height = max_height;
		this.below_target = below_target;
		this.x_offset = typeof x_offset !== "number" ? 0 : x_offset;
		this.y_offset = typeof y_offset !== "number" ? 0 : y_offset;
		if (!this.animate) {
			this.duration = 0;
		}
		if (this.below_target && y_offset == null) {
			this.y_offset = 10;
		}

		// Styling.
		this
		.hide()
		.overflow("hidden")
		.background("black")
		.border_radius(10)
		.padding(5, 15)
		.border(1, "grey")
		.z_index(10)
		.position("absolute")
		.box_shadow("0px 0px 5px #00000030")
		.opacity(0)
		.transition(this.animate ? `opacity ${this.duration * 0.8}ms ease-in, max-height ${this.duration}ms ease-in-out, max-width ${this.duration}ms ease-in-out` : "")
		.max_width(0)
		.max_height(0)

		// Add content.
		this.content_items = [];
		if (content) {
			this.mouse_over_background = "#FFFFFF10";
			this.mouse_out_opacity = 0.8;
			this._content_padding = [7.5, 20];
			this._content_margin = [2.5, 0];
			this.padding(10, 0)
			this.append(ForEach(content, (item) => {
				const element = (item.href || item.on_click_redirect || item.anchor) ? AnchorHStack() : HStack();
				element.append(
					item.image == null ? null : ImageMask(item.image)
						.frame("1em", "1em")
						.mask_color("white")
						.margin_right("1em")
						.flex_shrink(0)
						.padding(item.image_padding == null ? 0 : item.image_padding)
						.margin_top(item.image_top == null ? 0 : item.image_top),
					Text(item.text)
						.color("white")
						.font_size("inherit")
						.wrap(false)
						// .ellipsis_overflow(true)
				)
				.text_decoration("none")
				.border("none")
				.outline("none")
				.padding(...this._content_padding)
				.margin(...this._content_margin)
				.transition("background 250ms ease-in-out, opacity 250ms ease-in-out")
				.on_mouse_over(e => e.background(this.mouse_over_background).opacity(1))
				.on_mouse_out(e => e.background("transparent").opacity(this.mouse_out_opacity))
				.parent(this);
				if (item.href) {
					element.href(item.href)
				} else if (Array.isArray(item.on_click)) {
					element.on_click(...item.on_click);
				} else if (item.on_click) {
					element.on_click(item.on_click);
				} else if (Array.isArray(item.on_click_redirect)) {
					element.on_click(...item.on_click_redirect);
				} else if (item.callback) {
					element.on_click(item.callback);
				}
				this.content_items.append(element);
				return element;
			}))
		}
	}

	// Get frame.
	_get_frame() {
		this.visibility("hidden");
		this.show();
		this.max_width("none")
		this.max_height("none")
		this.getBoundingClientRect();
		if (this.use_target_min) {
			this._frame_min_width = this.target.clientWidth;
			this._frame_min_height = this.target.clientHeight;
		} else {
			this._frame_min_width = this.min_width();
			if (typeof this._frame_min_width !== "number") {
				this._frame_min_width = 0;
			}
			if (this._min_width) {
				this._frame_min_width = Math.max(this._frame_min_width, this._min_width)
			}
			this._frame_min_height = this.min_height();
			if (typeof this._frame_min_height !== "number") {
				this._frame_min_height = 0;
			}
			if (this._min_height) {
				this._frame_min_height = Math.max(this._frame_min_height, this._min_height)
			}
		}
		this._frame_max_width = Math.max(this._frame_min_width, this.clientWidth);
		if (this._max_width) { this._frame_max_width = Math.min(this._frame_max_width, this._max_width); }
		this.max_width(this._frame_max_width) // so height is accurate based on width.
		this._frame_max_height = Math.max(this._frame_min_height, this.clientHeight);
		if (this._max_height) { this._frame_max_height = Math.min(this._frame_max_height, this._max_height); }
		this.hide();
		this.visibility("visible");
	}

	// Toggle.
	toggle() {
		if (this.expanded) { return this.minimize(); }
		return this.expand();
	}

	// Expand dropdown.
	expand() {
		if (this.next_toggle_allowed !== undefined && Date.now() < this.next_toggle_allowed) { return this; }; // otherwise it goes glitchy.
		if (this.expanded) { return this; }
		this.expanded = true;

		// Show.
		clearTimeout(this.animation_timeout);
		this.transition("");
		this._get_frame();
		this.max_width(this._frame_min_width)
		this.max_height(this._frame_min_height)
		this.opacity(0)
		this.transition(this.animate ? `opacity ${this.duration * 0.8}ms ease-in, max-height ${this.duration}ms ease-in-out, max-width ${this.duration}ms ease-in-out` : "")
		this.show().getBoundingClientRect();
		const rect = this.target.getBoundingClientRect();
		this
			.position(
				rect.top + this.y_offset + (this.below_target ? rect.height : 0),
				this.side !== "left" ? (window.innerWidth - rect.right - this.x_offset) : null,
				null,
				this.side === "left" ? (rect.left + this.x_offset) : null
			)
			.opacity(1)
			.max_width(this._frame_max_width)
			.max_height(this._frame_max_height)

		// Close handler.
		if (this.close_handler == null) {
			this.close_handler = (event) => {
				if (this.expanded && !this.is_nested_child(event.target) && !this.target.is_nested_child(event.target)) { // also prevent on click on target element, otherwise it does this open close buggy thing
					this.minimize();
				}
			}
		}
		document.body.addEventListener("mousedown", this.close_handler);
		this.next_toggle_allowed = Date.now() + Math.max(100, this.duration);

		// Callback.
		if (this.on_expand_callback) {
			this.on_expand_callback(this);
		}

		return this;
	}

	// Minimize dropdown.	
	minimize(force = false) {
		if (!force && this.next_toggle_allowed !== undefined && Date.now() < this.next_toggle_allowed) { return this; };  // otherwise it goes glitchy.
		if (!force && !this.expanded) { return this; }
		this.expanded = false;

		// Hide.
		this
			.max_width(this._frame_min_width)
			.max_height(this._frame_min_height)
			.opacity(0)
		this.animation_timeout = setTimeout(() => {
			if (this.auto_remove) {
				this.remove();
			} else {
				this.hide()
			}
		}, this.duration)
		document.body.removeEventListener("mousedown", this.close_handler);
		this.next_toggle_allowed = Date.now() + Math.max(100, this.duration);

		// Callback.
		if (this.on_minimize_callback) {
			this.on_minimize_callback(this);
		}
		return this;
	}

	// On expand.
	on_expand(callback) {
		if (callback == null) { return this.on_expand_callback; }
		this.on_expand_callback = callback;
		return this;
	}

	// On minimize.
	on_minimize(callback) {
		if (callback == null) { return this.on_minimize_callback; }
		this.on_minimize_callback = callback;
		return this;
	}

	/*	@docs:
		@title: Get or set font size.
		@description: Should mainly be used to set the font size and image size on the content nodes created by the `content` parameter.
	*/
	font_size(value) {
		if (value == null) { return super.font_size(); }
		super.font_size(value);
		// all font sizes are inherited or Xem based
		return this;
	}

	/*	@docs:
		@title: Get or set color.
		@description: Should mainly be used to set the foreground color's on the content nodes created by the `content` parameter.
	*/
	color(value) {
		if (value == null) { return super.color(); }
		super.color(value);
		this.content_items.iterate(e => {
			e.color(value);
			if (e.image) {
				e.image.mask_color(value);
			}
		})
		return this;
	}

	/*	@docs:
		@title: Iterate content nodes.
		@description: Iterate content nodes created by the `content` parameter. When the callback returns any non null value the iteration will be stopped.
	*/
	iterate_content(callback) {
		this.content_items.iterate((node) => callback(node))
		return this;
	}

	/*	@docs:
		@title: Set padding on content nodes.
		@description: Set padding on the content nodes created by the `content` parameter.
	*/
	content_padding(...args) {
		if (args.length === 0) { return this._content_padding; }
		this._content_padding = [...args];
		this.content_items.iterate((node) => { node.padding(...args); })
		return this;
	}

	/*	@docs:
		@title: Set margin on content nodes.
		@description: Set margin on the content nodes created by the `content` parameter.
	*/
	content_margin(...args) {
		if (args.length === 0) { return this._content_margin; }
		this._content_margin = [...args];
		this.content_items.iterate((node) => { node.margin(...args); })
		return this;
	}

	/*	@docs:
		@title: Set background on content nodes.
		@description: Set the mouse over background from the content nodes created by the `content` parameter. In the mouse out event the background will always be `transparent`.
	*/
	content_background(value) {
		if (value == null) { return this.mouse_over_background; }
		this.mouse_over_background = value;
		return this;
	}

	/*	@docs:
		@title: Set opacity content nodes.
		@description: Set opacity on the content nodes created by the `content` parameter. In the mouse over event the opacity will always be `1`.
	*/
	content_opacity(value) {
		if (value == null) { return this.mouse_out_opacity; }
		this.mouse_out_opacity = value;
		this.content_items.iterate((node) => { node.opacity(value); })
		return this;
	}
}