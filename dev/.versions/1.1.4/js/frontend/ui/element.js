/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Elements that use the "width" etc attribute instead of the "style.width".
vweb.elements.elements_with_width_attribute = [
	'canvas',
	'embed',
	'iframe',
	'img',
	'object',
	'progress',
	'video',
];

// Is apple.
vweb.is_safari = navigator.vendor.includes('Apple');

// Extend the default VElement class.
vweb._velement_classes = [];
vweb.extend_velement = (props = {}) => {
	const names = Object.keys(props);
	vweb._velement_classes.iterate(Element => {
		for (let i = 0; i < names.length; i++) {
			Element.prototype[names[i]] = props[names[i]];
		}
	})
}

// Create the on render observer.
vweb.utils.on_render_observer = new ResizeObserver(
	(entries, observer) => {
		entries.forEach(entry => {
			if (!entry.target.rendered) {
				entry.target._on_render_callbacks.iterate((func) => func(entry.target));
				entry.target.rendered = true;
				vweb.utils.on_render_observer.unobserve(entry.target);
			}
		});
	},
);

// Create the on resize observer.
vweb.utils.on_resize_observer = new ResizeObserver(
	(entries, observer) => {
		entries.forEach(entry => {
			entry.target._on_resize_callbacks.iterate((func) => func(entry.target));
		});
	},
);

// Element.
function CreateVElementClass({
	type = "VElement", 
	tag = "div",
	default_style = null, 
	default_attributes = null, 
	default_events = null, 
}) {

	// Get base.
	let Base;

	// Style.
	// Can be used for animation keyframes or other funcs to set a style without accessing the target element's style.
	if (tag === "style") {
		class B {
			constructor() {
				this.style = {};
			}
		}
		Base = B;
	}

	// Safari can only inherit HTMLElement.
	else if (vweb.is_safari) {
		// switch (tag) {
		// 	case "img": 
		// 		Base = HTMLImageElement;
		// 		break;
		// 	case "canvas": 
		// 		Base = HTMLCanvasElement;
		// 		break;
		// 	default:
				Base = HTMLElement;
		// 		break;
		// }
	}

	// Other browsers.
	else {
		switch (tag) {
			case "a": 
				Base = HTMLAnchorElement;
				break;
			case "area": 
				Base = HTMLAreaElement;
				break;
			case "audio": 
				Base = HTMLAudioElement;
				break;
			case "base": 
				Base = HTMLBaseElement;
				break;
			case "blockquote": 
				Base = HTMLQuoteElement;
				break;
			case "body": 
				Base = HTMLBodyElement;
				break;
			case "br": 
				Base = HTMLBRElement;
				break;
			case "button": 
				Base = HTMLButtonElement;
				break;
			case "canvas": 
				Base = HTMLCanvasElement;
				break;
			case "caption": 
				Base = HTMLTableCaptionElement;
				break;
			case "col": 
				Base = HTMLTableColElement;
				break;
			case "data": 
				Base = HTMLDataElement;
				break;
			case "datalist": 
				Base = HTMLDataListElement;
				break;
			case "dl": 
				Base = HTMLDListElement;
				break;
			case "dir": 
				Base = HTMLDirectoryElement;
				break;
			case "div": 
				Base = HTMLDivElement;
				break;
			case "html": 
				Base = HTMLHtmlElement;
				break;
			case "embed": 
				Base = HTMLEmbedElement;
				break;
			case "fieldset": 
				Base = HTMLFieldSetElement;
				break;
			case "form": 
				Base = HTMLFormElement;
				break;
			case "h1": 
				Base = HTMLHeadingElement;
				break;
			case "h2": 
				Base = HTMLHeadingElement;
				break;
			case "h3": 
				Base = HTMLHeadingElement;
				break;
			case "h4": 
				Base = HTMLHeadingElement;
				break;
			case "h5": 
				Base = HTMLHeadingElement;
				break;
			case "h6": 
				Base = HTMLHeadingElement;
				break;
			case "head": 
				Base = HTMLHeadElement;
				break;
			case "hr": 
				Base = HTMLHRElement;
				break;
			case "img": 
				Base = HTMLImageElement;
				break;
			case "input": 
				Base = HTMLInputElement;
				break;
			case "ins": 
				Base = HTMLModElement;
				break;
			case "label": 
				Base = HTMLLabelElement;
				break;
			case "legend": 
				Base = HTMLLegendElement;
				break;
			case "li": 
				Base = HTMLLIElement;
				break;
			case "link": 
				Base = HTMLLinkElement;
				break;
			case "map": 
				Base = HTMLMapElement;
				break;
			case "meta": 
				Base = HTMLMetaElement;
				break;
			case "meter": 
				Base = HTMLMeterElement;
				break;
			case "object": 
				Base = HTMLObjectElement;
				break;
			case "ol": 
				Base = HTMLOListElement;
				break;
			case "optgroup": 
				Base = HTMLOptGroupElement;
				break;
			case "option": 
				Base = HTMLOptionElement;
				break;
			case "output": 
				Base = HTMLOutputElement;
				break;
			case "p": 
				Base = HTMLParagraphElement;
				break;
			case "param": 
				Base = HTMLParamElement;
				break;
			case "picture": 
				Base = HTMLPictureElement;
				break;
			case "pre": 
				Base = HTMLPreElement;
				break;
			case "progress": 
				Base = HTMLProgressElement;
				break;
			case "q": 
				Base = HTMLQuoteElement;
				break;
			case "script": 
				Base = HTMLScriptElement;
				break;
			case "select": 
				Base = HTMLSelectElement;
				break;
			case "slot": 
				Base = HTMLSlotElement;
				break;
			case "source": 
				Base = HTMLSourceElement;
				break;
			case "span": 
				Base = HTMLSpanElement;
				break;
			case "table": 
				Base = HTMLTableElement;
				break;
			case "thead": 
				Base = HTMLTableSectionElement;
				break;
			case "tbody": 
				Base = HTMLTableSectionElement;
				break;
			case "tfoot": 
				Base = HTMLTableSectionElement;
				break;
			case "th": 
				Base = HTMLTableCellElement;
				break;
			case "td": 
				Base = HTMLTableCellElement;
				break;
			case "template": 
				Base = HTMLTemplateElement;
				break;
			case "textarea": 
				Base = HTMLTextAreaElement;
				break;
			case "time": 
				Base = HTMLTimeElement;
				break;
			case "title": 
				Base = HTMLTitleElement;
				break;
			case "tr": 
				Base = HTMLTableRowElement;
				break;
			case "track": 
				Base = HTMLTrackElement;
				break;
			case "ul": 
				Base = HTMLUListElement;
				break;
			default:
				Base = HTMLElement;
				break;
		};
	}

	// Build class.
	// @note: this.tagName can not be used since they have different values on safari and other browsers.
	/*	@docs:
		@nav: Frontend
		@chapter: Elements
		@title: Base element
		@desc: The base element of the vweb frontend elements.
	*/
	class Element extends Base {

		// ---------------------------------------------------------
		// Attributes.

		static element_tag = tag; // must also be static.
		static default_style = default_style;
		static default_attributes = default_attributes;
		static default_events = default_events;

		// ---------------------------------------------------------
		// Constructor.
		
		constructor() {

			// Super base.
			super();

			// Attributes.
			this.element_type = type; // must also be a member attribute.
			this.base_element_type = type; // this must remain the element type of the base class, element type may be overwritten when an element extends a base element.
			this.element_display = "block";

			// Rename some funcs.
			this.remove_focus = super.blur;

			// On render event handler.
			this.rendered = false;

			// Constructed by html code.
			if (this.hasAttribute !== undefined && this.hasAttribute("created_by_html")) {
			}

			// Constructed by js code.
			else {
			

				// Default style.
				if (Element.default_style != null) {
					this.styles(Element.default_style);
				}

				// Default attributes.
				if (Element.default_attributes != null) {
					this.attrs(Element.default_attributes);
				}

				// Default events.
				if (Element.default_events != null) {
					this.events(Element.default_events);
				}
			}

			// Append children.
			// this.append(...children);
		}
		
		// ---------------------------------------------------------
		// default callbacks.

		// Connected callback.
		// Do not use this for the on_render func since that is not reliable.
		// This is only used to set the `_is_connected` flag.
		connectedCallback() {
			this._is_connected = true;
		}

		// ---------------------------------------------------------
		// Utils.

		// Clone.
		// Best to use "clone()" over "cloneNode()" since the "cloneNode()" cloned node may have the default styling applied.
		// Warning: for now only the frame attributes are set to "auto" when they are not assigned on the original, perhaps some more are required as well.
		clone(clone_children = true) {
			// return this.cloneNode(clone_children);

			// Create a new instance of the same class.
			// const clone = this.cloneNode(false);

			// Create a new instance of the same custom element class
			const clone = new this.constructor();

			// Remove inner html when since some vweb constructors add elements in the constructor.
			// And since the target children will also be added none of the constructor elements are required.
			if (clone.element_type !== undefined) {
				clone.inner_html("");
			}

			// Apply computed styles since with cloneNode the styling defined in the constructor will override the cloneNode styling.
			const styles = window.getComputedStyle(this);
			clone.style.cssText = Array.from(styles).reduce((str, property) => {
				return `${str}${property}:${styles.getPropertyValue(property)};`;
			}, '');
			// v1.
			// clone.style.cssText = document.defaultView.getComputedStyle(this, "").cssText;
			// v2.
			// const styles = window.getComputedStyle(this);
			// for (let i = 0; i < styles.length; i++) {
			// 	const property = styles[i];
			// 	const value = styles.getPropertyValue(property);
			// 	clone.style.setProperty(property, value);
			// }


			// Set frame properties.
			const auto_keys = [
				"width",
				"minWidth",
				"maxWidth",
				"height",
				"minHeight",
				"maxHeight",
			];
			for (let i = 0; i < auto_keys.length; i++) {
				if (this.style[auto_keys[i]] == "auto" || this.style[auto_keys[i]] == "") {
					clone.style[auto_keys[i]] = "auto";
				}
			}

			// Copy attributes and properties from the original element to the clone
			for (const attr of this.getAttributeNames()) {
				if (attr != "style") {
					clone.setAttribute(attr, this.getAttribute(attr));
				}
			}

			// Copy properties from the original element to the clone
			for (const prop in this) {
				if (this.hasOwnProperty(prop) || typeof this[prop] === "function") {
					clone[prop] = this[prop];
				}
			}

			// Clone children.
			if (clone_children && this.childNodes != undefined) {
				for (let i = 0; i < this.childNodes.length; i++) {
					const child = this.childNodes[i];
					if (child.element_type === undefined) {
						clone.appendChild(child.cloneNode(true));
					} else {
						clone.appendChild(child.clone());
					}
				}
			}
			return clone;
		}
		
		// Padd a numeric with px.
		pad_numeric(value, padding = "px") {
			if (vweb.utils.is_numeric(value)) {
				return value + padding;
			}
			return value;
		}

		// Padd a numeric percentage with %.
		// When the numeric is a float and between 0 and 1 it is also multiplied by 100.
		pad_percentage(value, padding = "%") {
			if (vweb.utils.is_float(value) && value <= 1.0) {
				return (value * 100) + padding;
			} else if (vweb.utils.is_numeric(value)) {
				return value + padding;
			}
			return value;
		}

		// Edit a x() from a filter or transform string.
		// Can also be used for similair string that use "x() y()".
		// When to is null the type will be removed.
		edit_filter_wrapper(filter, type, to = null) {
			if (filter == null) {
				return to;
			}
			const pattern = new RegExp(`${type}\\([^)]*\\)\\s*`, "g");
			if (pattern.test(filter)) {
				if (to == null) {
					return filter.replace(pattern, "");
				} else {
					return filter.replace(pattern, to);
				}
			} else if (to != null) {
				return `${filter} ${to}`;
			}
			return value;
		}

		// Toggle a x() from a filter or transform string.
		// Can also be used for similair string that use "x() y()".
		// When the type is present the item will be removed, otherwise the to will be added.
		toggle_filter_wrapper(filter, type, to = null) {
			if (filter == null) {
				return to;
			}
			const pattern = new RegExp(`${type}\\([^)]*\\)\\s*`, "g");
			if (pattern.test(filter)) {
				return filter.replace(pattern, "");
			} else if (to != null) {
				return `${filter} ${to}`;
			}
			return value;
		}

		// Convert a px string to number type.
		_convert_px_to_number_type(value) {
			if (value == null || value === "") { return 0; }
			else if (typeof value === "string" && value.eq_last("px")) {
				value = parseFloat(value)
				if (isNaN(value)) { return 0; }
			}
			return value;
		}

		// Try and parse to float otherwise return original.
		_try_parse_float(value) {
			if (typeof value === "string" && (value.endsWith("em") || value.endsWith("rem"))) { return value; }
			const float = parseFloat(value);
			if (!isNaN(float)) { return float; }
			return value;
		}
		
		// ---------------------------------------------------------
		// Children functions.
		
		// Append child elements.
		// Can be called with multiple arguments.
		// A direct HTML Node is also accepted.
		// A function is also accepted and will be executed.
		append(...children) {
			for (let i = 0; i < children.length; i++) {
				let child = children[i];
				if (child != null) {

					// Array.
					if (Array.isArray(child)) {
						this.append(...child);
					}

					// VWeb element.
					else if (child.element_type != null) {
						if (
							child.element_type == "ForEach" ||
							child.element_type == "If" ||
							child.element_type == "IfDeviceWith"
						) {
							child.append_children_to(this, this._on_append_callback);
						} else {
							if (child._assign_to_parent_as !== undefined) {
								this[child._assign_to_parent_as] = child;
								child._parent = this;
							}
							if (this._on_append_callback !== undefined) {
								this._on_append_callback(child)
							}
							this.appendChild(child);
						}
					}

					// Execute function.
					else if (vweb.utils.is_func(child)) {
						this.append(child(this));
					}

					// Node element.
					else if (child instanceof Node) {
						if (child._assign_to_parent_as !== undefined) {
							this[child._assign_to_parent_as] = child;
							child._parent = this;
						}
						if (this._on_append_callback !== undefined) {
							this._on_append_callback(child)
						}
						this.appendChild(child);
					}

					// Append text.
					else if (vweb.utils.is_string(child)) {
						const node = document.createTextNode(child);
						if (this._on_append_callback !== undefined) {
							this._on_append_callback(node)
						}
						this.appendChild(node);
					}

					// else {
					// 	console.log("UNKOWN CHILD: ", child);
					// }

				}
			}
			return this;
		}
		zstack_append(...children) {
			for (let i = 0; i < children.length; i++) {
				let child = children[i];
				if (child != null) {

					// Array.
					if (Array.isArray(child)) {
						this.zstack_append(...child);
					}

					// VWeb element.
					else if (child.element_type != null) {
						child.style.gridArea = "1 / 1 / 2 / 2";
						if (
							child.element_type == "ForEach" ||
							child.element_type == "If" ||
							child.element_type == "IfDeviceWith"
						) {
							child.append_children_to(this, this._on_append_callback);
						} else {
							if (child._assign_to_parent_as !== undefined) {
								this[child._assign_to_parent_as] = child;
								child._parent = this;
							}
							if (this._on_append_callback !== undefined) {
								this._on_append_callback(child)
							}
							this.appendChild(child);
						}
					}

					// Execute function.
					else if (vweb.utils.is_func(child)) {
						this.append(child(this));
					}

					// Node element.
					else if (child instanceof Node) {
						child.style.gridArea = "1 / 1 / 2 / 2";
						if (child._assign_to_parent_as !== undefined) {
							this[child._assign_to_parent_as] = child;
							child._parent = this;
						}
						if (this._on_append_callback !== undefined) {
							this._on_append_callback(child)
						}
						this.appendChild(child);
					}

					// Append text.
					else if (vweb.utils.is_string(child)) {
						const node = document.createTextNode(child);
						if (this._on_append_callback !== undefined) {
							this._on_append_callback(node)
						}
						this.appendChild(node);	
					}
				}
			}
			return this;
		}

		// Append to parent element.
		append_to(parent) {
			if (this._assign_to_parent_as !== undefined) {
				parent[this._assign_to_parent_as] = this;
				child._parent = this;
			}
			if (parent._on_append_callback !== undefined) {
				parent._on_append_callback(this);
			}
			parent.appendChild(this);
			return this;
		}

		// Append the children to parent element.
		append_children_to(parent, on_append_callback) {
			if (this.base_element_type == "VirtualScroller") {
				for (let i = 0; i < parent.children.length; i++) {
					parent.v_children.push(parent.children[i]);
				}
				this.innerHTML = "";
			} else {
				while (this.firstChild) {
					if (this.firstChild._assign_to_parent_as !== undefined) {
						parent[this.firstChild._assign_to_parent_as] = this.firstChild;
						this.firstChild._parent = parent;
					}
					if (on_append_callback !== undefined) {
						on_append_callback(this.firstChild);
					}
					parent.appendChild(this.firstChild)
				}
			}
			return this;
		}

		// Remove child.
		// Can either be a Node object an Element derived object or an id.
		remove_child(child) {
			if (child.element_type != null) {
				this.removeChild(child);
			} else if (child instanceof Node) {
				this.removeChild(child);
			} else if (vweb.utils.is_string(child)) {
				this.removeChild(document.getElementById(child));
			} else {
				console.error("Invalid parameter type for function \"remove_child()\".");
			}
			return this;
		}

		// Remove children.
		// Do not use `this.inner_html("")` when a scrollbar has been added.
		remove_children() {
			this.inner_html("");
			return this;
		}

		// Get child by index.
		child(index) {
			if (index < 0) {
				return this.children[this.children.length - index];	
			}
			return this.children[index];
		}

		// Get child by index.
		get(index) {
			if (index < 0) {
				return this.children[this.children.length - index];	
			}
			else if (index >= this.children.length) {
				return undefined;
			}
			return this.children[index];
		}

		// ---------------------------------------------------------
		// Text attribute functions.
		
		// Set or get the text.
		// Leave value "null" to get the text.
		text(value) {
			if (value == null) {
				return this.textContent;	
			}
			this.textContent = value;
			return this;
		}

		// ---------------------------------------------------------
		// Framing functions.
		
		// Specify the width or height of the element
		// Returns the offset width or height when the param value is null.
		width(value, check_attribute = true) {
			if (check_attribute && vweb.elements.elements_with_width_attribute.includes(Element.element_tag)) {
				if (value == null) {
					return this._try_parse_float(this.getAttribute("width"));
				}
				this.setAttribute("width", value);
			} else {
				if (value == null) {
					return this._try_parse_float(this.style.width);
				}
				this.style.width = this.pad_numeric(value);
			}
			return this;
		}
		fixed_width(value) {
			if (value == null) {
				return this._try_parse_float(this.style.width);
			}
			value = this.pad_numeric(value);
			this.style.width = value; // also required for for example image masks.
			this.style.minWidth = value;
			this.style.maxWidth = value;
			return this;
		}
		height(value, check_attribute = true) {
			if (check_attribute && vweb.elements.elements_with_width_attribute.includes(Element.element_tag)) {
				if (value == null) {
					return this._try_parse_float(this.getAttribute("height"));
				}
				this.setAttribute("height", value);
			} else {
				if (value == null) {
					return this._try_parse_float(this.style.height);
				}
				this.style.height = this.pad_numeric(value);
			}
			return this;
		}
		fixed_height(value) {
			if (value == null) {
				return this._try_parse_float(this.style.height);
			}
			value = this.pad_numeric(value);
			this.style.height = value; // also required for for example image masks.
			this.style.minHeight = value;
			this.style.maxHeight = value;
			return this;
		}

		// Sets the minimum height of an element.
		/*	@docs:
		 *	@title: Min height
		 *	@description: 
		 *		Sets the minimum height of an element.
		 *		The equivalent of CSS attribute `minHeight`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		min_height(value) {
			if (value == null) { return this._try_parse_float(this.style.minHeight); }
			this.style.minHeight = this.pad_numeric(value);
			return this;
		}

		// Sets the minimum width of an element.
		/*	@docs:
		 *	@title: Min width
		 *	@description: 
		 *		Sets the minimum width of an element.
		 *		The equivalent of CSS attribute `minWidth`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		min_width(value) {
			if (value == null) { return this._try_parse_float(this.style.minWidth); }
			this.style.minWidth = this.pad_numeric(value);
			return this;
		}

		// Set width by columns for HStack children.
		width_by_columns(columns) {
			let margin_left = this.style.marginLeft;
			let margin_right = this.style.marginRight;
			if (!margin_left) {
				margin_left = "0px";
			}
			if (!margin_right) {
				margin_right = "0px";
			}
			if (columns == null) {
				columns = 1;
			}
			this.style.flexBasis = "calc(100% / " + columns + " - (" + margin_left + " + " + margin_right + "))";
			return this;
		}

		// Get the offset width and height.
		offset_width() {
			return this.offsetWidth;
		}
		offset_height() {
			return this.offsetHeight;
		}

		// Get the client width and height.
		client_width() {
			return this.clientWidth;
		}
		client_height() {
			return this.clientHeight;
		}

		// Get the x and y offset
		x() {
			return this.offsetLeft;
		}
		y() {
			return this.offsetTop;
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
		fixed_frame(width, height) {
			if (width != null) {
				width = this.pad_numeric(width);
				this.style.width = width; // also required for for example image masks.
				this.style.minWidth = width;
				this.style.maxWidth = width;
			}
			if (height != null) {
				height = this.pad_numeric(height);
				this.style.height = height; // also required for for example image masks.
				this.style.minHeight = height;
				this.style.maxHeight = height;
			}
			return this;
		}

		// Get frame while hidden.
		/*	@docs:
			@title: Get frame while hidden.
			@descr: Get the would be rendered frame of the element if it is no longer hidden.
			@return: Returns a `{width, height}` object.
		*/
		get_frame_while_hidden() {
			const transition = this.transition();
			this.transition("none");
			const max_width = this.max_width();
			this.max_width("none");
			const max_height = this.max_height();
			this.max_height("none");
			const overflow = this.overflow();
			this.overflow("visible");
			this.visibility("hidden");
			this.show();
			const rect = this.getBoundingClientRect();
			// const response = {width: rect.width, height: rect.height};
			const response = {width: this.clientWidth, height: this.clientHeight};
			this.hide();
			this.visibility("visible");
			this.max_width(max_width)
			this.max_height(max_height)
			this.transition(transition)
			this.overflow(overflow)
			return response;
		}

		// Padding, 1 or 4 args.
		padding(...values) {
			if (values.length === 0) {
				return this.style.padding;
			} else if (values.length === 1) {
				this.style.padding = this.pad_numeric(values[0]);
			} else if (values.length === 2) {	
				if (values[0] != null) {
					this.style.paddingTop = this.pad_numeric(values[0]);
				}
				if (values[1] != null) {
					this.style.paddingRight = this.pad_numeric(values[1]);
				}
				if (values[0] != null) {
					this.style.paddingBottom = this.pad_numeric(values[0]);
				}
				if (values[1] != null) {
					this.style.paddingLeft = this.pad_numeric(values[1]);
				}
			} else if (values.length === 4) {
				this.style.paddingTop = this.pad_numeric(values[0]);
				if (values[1] != null) {
					this.style.paddingRight = this.pad_numeric(values[1]);
				}
				if (values[2] != null) {
					this.style.paddingBottom = this.pad_numeric(values[2]);
				}
				if (values[3] != null) {
					this.style.paddingLeft = this.pad_numeric(values[3]);
				}
			} else {
				console.error("Invalid number of arguments for function \"padding()\".");
			}
			return this;
		}

		// Sets the bottom padding of an element.
		/*	@docs:
		 *	@title: Padding bottom
		 *	@description: 
		 *		Sets the bottom padding of an element.
		 *		The equivalent of CSS attribute `paddingBottom`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		padding_bottom(value) {
			if (value == null) { return this._convert_px_to_number_type(this.style.paddingBottom); }
			this.style.paddingBottom = this.pad_numeric(value);
			return this;
		}
		
		// Sets the left padding of an element.
		/*	@docs:
		 *	@title: Padding left
		 *	@description: 
		 *		Sets the left padding of an element.
		 *		The equivalent of CSS attribute `paddingLeft`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		padding_left(value) {
			if (value == null) { return this._convert_px_to_number_type(this.style.paddingLeft); }
			this.style.paddingLeft = this.pad_numeric(value);
			return this;
		}

		// Sets the right padding of an element.
		/*	@docs:
		 *	@title: Padding right
		 *	@description: 
		 *		Sets the right padding of an element.
		 *		The equivalent of CSS attribute `paddingRight`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		padding_right(value) {
			if (value == null) { return this._convert_px_to_number_type(this.style.paddingRight); }
			this.style.paddingRight = this.pad_numeric(value);
			return this;
		}

		// Sets the top padding of an element.
		/*	@docs:
		 *	@title: Padding top
		 *	@description: 
		 *		Sets the top padding of an element.
		 *		The equivalent of CSS attribute `paddingTop`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		padding_top(value) {
			if (value == null) { return this._convert_px_to_number_type(this.style.paddingTop); }
			this.style.paddingTop = this.pad_numeric(value);
			return this;
		}
		
		// Margin, 1 or 4 args.
		margin(...values) {
			if (values.length === 0) {
				return this.style.margin;
			} else if (values.length === 1) {
				this.style.margin = this.pad_numeric(values[0]);
			} else if (values.length === 2) {		
				this.style.marginTop = this.pad_numeric(values[0]);
				if (values[1] != null) {
					this.style.marginRight = this.pad_numeric(values[1]);
				}
				if (values[0] != null) {
					this.style.marginBottom = this.pad_numeric(values[0]);
				}
				if (values[1] != null) {
					this.style.marginLeft = this.pad_numeric(values[1]);
				}
			} else if (values.length === 4) {
				this.style.marginTop = this.pad_numeric(values[0]);
				if (values[1] != null) {
					this.style.marginRight = this.pad_numeric(values[1]);
				}
				if (values[2] != null) {
					this.style.marginBottom = this.pad_numeric(values[2]);
				}
				if (values[3] != null) {
					this.style.marginLeft = this.pad_numeric(values[3]);
				}
			} else {
				console.error("Invalid number of arguments for function \"margin()\".");
			}
			return this;
		}

		// Sets the bottom margin of an element.
		/*	@docs:
		 *	@title: Margin bottom
		 *	@description: 
		 *		Sets the bottom margin of an element.
		 *		The equivalent of CSS attribute `marginBottom`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		margin_bottom(value) {
			if (value == null) { return this._convert_px_to_number_type(this.style.marginBottom); }
			this.style.marginBottom = this.pad_numeric(value);
			return this;
		}
		
		// Sets the left margin of an element.
		/*	@docs:
		 *	@title: Margin left
		 *	@description: 
		 *		Sets the left margin of an element.
		 *		The equivalent of CSS attribute `marginLeft`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		margin_left(value) {
			if (value == null) { return this._convert_px_to_number_type(this.style.marginLeft); }
			this.style.marginLeft = this.pad_numeric(value);
			return this;
		}

		// Sets the right margin of an element.
		/*	@docs:
		 *	@title: Margin right
		 *	@description: 
		 *		Sets the right margin of an element.
		 *		The equivalent of CSS attribute `marginRight`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		margin_right(value) {
			if (value == null) { return this._convert_px_to_number_type(this.style.marginRight); }
			this.style.marginRight = this.pad_numeric(value);
			return this;
		}

		// Sets the top margin of an element.
		/*	@docs:
		 *	@title: Margin top
		 *	@description: 
		 *		Sets the top margin of an element.
		 *		The equivalent of CSS attribute `marginTop`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		margin_top(value) {
			if (value == null) { return this._convert_px_to_number_type(this.style.marginTop); }
			this.style.marginTop = this.pad_numeric(value);
			return this;
		}
		
		// Position, 1 or 4 args.
		position(...values) {
			if (values.length === 0) {
				return this.style.position;
			} else if (values.length === 1) {
				this.style.position = values[0];
			} else if (values.length === 4) {
				this.style.position = "absolute";
				if (values[0] != null) {
					this.style.top = this.pad_numeric(values[0]);
				}
				if (values[1] != null) {
					this.style.right = this.pad_numeric(values[1]);
				}
				if (values[2] != null) {
					this.style.bottom = this.pad_numeric(values[2]);
				}
				if (values[3] != null) {
					this.style.left = this.pad_numeric(values[3]);
				}
			} else {
				console.error("Invalid number of arguments for function \"position()\".");
			}
			return this;
		}

		// Stretch (flex).
		stretch(value) {
			if (value == true) {
				this.style.flex = 1;
			} else {
				this.style.flex = 0;
			}
			return this;
		}

		// Wrap.
		wrap(value) {
			switch (Element.element_tag) {
				case "div":
					if (value == true) {
						// this.style.flexFlow = "wrap";
						this.flex_wrap("wrap")
					} else if (value == false) {
						// this.style.flexFlow = "nowrap";
						this.flex_wrap("nowrap")
					} else {
						// this.style.flexFlow = value;
						this.flex_wrap(value)
					}
					break;
				default:
					if (value == true) {
						this.style.whiteSpace = "wrap";
						this.style.textWrap = "wrap";
						this.style.overflowWrap = "break-word";
					} else if (value == false) {
						this.style.whiteSpace = "nowrap";
						this.style.textWrap = "nowrap";
						this.style.overflowWrap = "normal";
					} else {
						this.style.textWrap = value;
						this.style.textWrap = value;
						this.style.overflowWrap = value;
					}
				break;
			}
			return this;
		}

		// Z Index.
		z_index(value) {
			this.style.zIndex = value;
			return this;
		}

		// Set the elements side by side till a specified width.
		/* 	@docs:
		 * 	@experimental: true
		 * 	@title: Side by Side
		 * 	@description: Set the elements side by side till a specified width.
		 * 	@param: 
		 * 		@name: columns 
		 * 		@type: number 
		 *		@desc: The amount of column elements that will be put on one row.
		 * 	@param: 
		 * 		@name: hspacing 
		 * 		@type: number 
		 *		@desc: The horizontal spacing between the columns in pixels.
		 * 	@param: 
		 * 		@name: vspacing 
		 * 		@type: number 
		 *		@desc: The vertical spacing between the rows in pixels.
		 * 	@param: 
		 * 		@name: stretch
		 * 		@type: boolean
		 *		@desc: Stretch the leftover columns to max width.
		 * 	@param: 
		 * 		@name: hide_dividers 
		 * 		@type: boolean 
		 *		@desc: Hide dividers when they would appear on a row.
		 */
		side_by_side({
			columns = 2,			
			hspacing = 10,			
			vspacing = 10,			
			stretch = true,
			hide_dividers = false,	
		}) {
			if (this.element_type !== "HStack" && this.element_type !== "AnchorHStack") {
				throw Error("This function os only supported for element \"HStackElement\".");
			}

			// Vars.
			let col_children = [];
			let row_width = 0;
			let row = 0;
			let highest_margin = undefined;

			// Styling.
			// this.justify_content("space-between")
			this.box_sizing("border-box")

			// Set flex basis.
			const flex_basis = (child, basis, margin) => {
				if (margin === 0) {
					child.width(`${basis*100}%`);
					child.min_width(`${basis*100}%`);
					child.max_width(`${basis*100}%`);
				} else {
					child.width(`calc(${basis*100}% - ${margin}px)`);
					child.min_width(`calc(${basis*100}% - ${margin}px)`);
					child.max_width(`calc(${basis*100}% - ${margin}px)`);
				}
			}

			// Set flex on the columns.
			const set_flex = () => {
				// let index = 0;
				// let margin = 0;
				// let full_basis = 0;
				// col_children.iterate((i) => {
				// 	let basis = i[1] == null ? ((col_children.length - 1) / columns) : i[1];
				// 	if (col_children.length === 1) {
				// 		basis = 1.0;
				// 	}
				// 	full_basis += basis;
				// 	const child = i[0];
				// 	if (index > 0) {
				// 		child.margin_left(hspacing);
				// 		margin += hspacing;
				// 	}
				// 	++index;
				// });
				// if (full_basis !== undefined && full_basis < 1) {
				// 	console.log("MARGIN:", margin);
				// 	margin /= full_basis; // use a full basis (1.0) based margin, so when the user has set side_by_side_basis it will use the full divided margin, resulting in aligned elements when they are stacked. otherwise they wont stack.
				// 	console.log("MARGIN POST:", margin);
				// } else {
				// 	console.log("MARGIN NO:", full_basis, margin);
				// }

				const margin = (columns - 1) * hspacing; // always use a full margin otherwise margin / columns will result in a smaller margin when cols is smaller than defined columns on a wrapped line. Resulting in unaligned stacks.

				let index = 0;
				col_children.iterate((i) => {
					const child = i[0];
					if (index > 0) {
						child.margin_left(hspacing)
					}
					// child.overflow("hidden") // do not set overflow to hidden since this causes issues when the user wants overflow for something like box shadow etc.
					if (stretch && index + 1 === col_children.length) {
						let basis = i[1] == null ? (1 - ((col_children.length - 1) / columns)) : i[1];
						if (col_children.length === 1) {
							basis = 1.0;
						}
						flex_basis(
							child, 
							basis, 
							margin / columns,
							// hspacing / col_children.length
							// Math.max(margin, hspacing * (columns - 2)),
						);
					} else {
						flex_basis(
							child, 
							i[1] == null ? 1 / columns : i[1], 
							margin / columns,
							// hspacing
							// hspacing * (columns - 1),
							// Math.max(margin, hspacing * (columns - 2)), // causes non aligned width when uneven items, resulting in 3 and 2 cols.
							// margin,
							// hspacing * (columns - 2)
						);
					}
					++index;
				})
				// col_children.iterate((i) => {
				// 	const child = i[0];
				// 	child.overflow("hidden") // do not set overflow to hidden since this causes issues when the user wants overflow for something like box shadow etc.
				// 	if (stretch || col_children.length === columns) {
				// 		flex_basis(
				// 			child, 
				// 			i[1] == null ? 1 / col_children.length : i[1], 
				// 			margin / col_children.length,
				// 		);
				// 	} else {
				// 		flex_basis(
				// 			child, 
				// 			i[1] == null ? 1 / columns : i[1], 
				// 			hspacing * (columns - 2),
				// 		);
				// 	}
				// })
			}

			// Check if the child is the last non divider child.
			const is_last_non_divider = (child) => {
				if (child.nextElementSibling == null) {
					return true;
				} else if (child.nextElementSibling.element_type !== "Divider") {
					return false;
				} else {
					return is_last_non_divider(child.nextElementSibling);
				}
			}

			// Iterate children.
			this.iterate((child) => {

				// Divider element.
				if (child.element_type === "Divider") {
					if (col_children.length > 0 && hide_dividers) {
						child.hide();
					} else {
						child.show();
						child.margin_top(vspacing)
						child.margin_bottom(0)
						flex_basis(child, 1.0, 0);
					}
				}

				// No divider.
				else {

					// Only one column.
					if (columns === 1) {
						child.fixed_width("100%");
						child.stretch(true);
						child.box_sizing("border-box")
						child.margin_left(0); // reset for when it is called inside @media.
						if (row > 0) {
							child.margin_top(vspacing);
						} else {
							child.margin_top(0); // reset for when it is called inside @media.
						}
						++row;
					}

					// 1+ columns
					else {

						// Is last non divider node.
						const is_last_node = is_last_non_divider(child)

						// Get the child's custom basis.
						const child_custom_basis = child._side_by_side_basis;
						const basis = child_custom_basis == null ? 1 / columns : child_custom_basis;

						// Set margins.
						child.stretch(true);
						child.box_sizing("border-box")
						child.margin_left(0); // reset for when it is called inside @media.
						if (row > 0) {
							child.margin_top(vspacing);
						} else {
							child.margin_top(0); // reset for when it is called inside @media.
						}

						// When the childs basis + the row width would overflow 1 then add it to the next line.
						if (row_width + basis > 1) {
							set_flex();
							++row;
							row_width = 0;
							col_children = [];
							col_children.push([child, child_custom_basis]);
						}

						// When the child basis + the row width would equal 1 or the node is the last node item then add the columns.
						else if (row_width + basis === 1 || is_last_node) {
							col_children.push([child, child_custom_basis]);
							set_flex();
							++row;
							row_width = 0;
							col_children = [];	
						}

						// Otherwise add to the colums.
						else {
							col_children.push([child, child_custom_basis]);
							row_width += basis;
						}
					}
				}
			})
			return this;
		}

		// Set the side by side basis for a node.
		// Must be set in floating percentages so 0.0 till 1.0.
		side_by_side_basis(basis) {
			if (basis == null) { return this._side_by_side_basis; }
			else if (basis === false) {
				this._side_by_side_basis = undefined;
			} else {
				this._side_by_side_basis = basis;
			}
			return this;
		}

		// Set text ellipsis overflow.
		ellipsis_overflow(to = true, after_lines = null) {
			if (to === null) {
				return this.style.textOverflow === "ellipsis";
			} else if (to === true) {
				this.style.textOverflow = "ellipsis";
				this.style.overflow = "hidden";
				this.style.textWrap = "wrap";
				this.style.overflowWrap = "break-word";
				if (after_lines != null) {
					this.style.webkitLineClamp = after_lines;
					this.style.webkitBoxOrient = "vertical";
					this.style.display = "-webkit-box";
				} else {
					this.style.whiteSpace = "nowrap";
				}
			} else if (to === false) {
				this.style.textOverflow = "default";
				this.style.whiteSpace = "default";
				this.style.overflow = "default";
				this.style.textWrap = "default";
				this.style.overflowWrap = "default";
			}
			return this;
		}

		// ---------------------------------------------------------
		// Alignment functions.
		
		// Alignment.
		align(value) {
			switch (this.base_element_type) {
				case "HStack":
				case "AnchorHStack":
				case "ZStack":
					if (value == null) { return this.style.justifyContent; }
					if (value === "default") { value = ""; }
					if (this.style.justifyContent !== value) {
						this.style.justifyContent = value;
					}
					return this;
				case "Frame":
					this.style.display = "flex";
					this.style.flexDirection = "column";
					// fallthrough.
				case "VStack":
				case "AnchorVStack":
				case "Scroller":
				case "View":
					if (value == null) { return this.style.alignItems; }
					if (value === "default") { value = "normal"; }
					if (this.style.alignItems !== value) {
						this.style.alignItems = value;
					}
					return this;
				default:
					if (value == null) { return this.style.textAlign; }
					if (value === "default") { value = "normal"; }
					if (this.style.textAlign !== value) {
						this.style.textAlign = value;
					}
				return this;
			}
		}
		leading() {
			return this.align("start");
		}
		center() {
			return this.align("center");
		}
		trailing() {
			return this.align("end");
		}
		
		// Align.
		align_vertical(value) {
			switch (this.base_element_type) {
				case "HStack":
				case "AnchorHStack":
				case "ZStack":
					if (value == null) { return this.style.alignItems; }
					if (value === "default") { value = "normal"; }
					if (value !== this.style.alignItems) {
						this.style.alignItems = value;
					}
					return this;
				case "Frame":
					this.style.display = "flex";
					this.style.flexDirection = "column";
					// fallthrough.
				case "VStack":
				case "AnchorVStack":
				case "Scroller":
				case "View":
					if (value == null) { return this.style.justifyContent; }
					if (value === "default") { value = ""; }
					if (value !== this.style.justifyContent) {
						this.style.justifyContent = value;
					}
					return this;
				case "Text":
					if (value == null) { return this.style.alignItems; }
					if (this.style.display == null || !this.style.display.includes("flex")) {
						this.display("flex");
					}
					if (value !== this.style.alignItems) {
						this.style.alignItems = value;
					}
					return this;
				default:
					if (value == null) { return this.style.justifyContent; }
					if (value !== this.style.justifyContent) {
						this.style.justifyContent = value;
					}
					return this;
			}
		}
		leading_vertical() {
			return this.align_vertical("start");
		}
		center_vertical(only_on_no_overflow = false) {
			if (only_on_no_overflow) {
				this.on_render((e) => {
					setTimeout(() => {
						if (e.scrollHeight > e.clientHeight) {
							e.align_vertical("default");
						} else {
							e.center_vertical();
						}
					}, 50)
				})
				this.on_resize((e) => {
					if (e.scrollHeight > e.clientHeight) {
						e.align_vertical("default");
					} else {
						e.center_vertical();
					}
				})
			}
			return this.align_vertical("center");
		}
		trailing_vertical() {
			return this.align_vertical("end");
		}
		
		// Text align shortcuts.
		align_text(value) {
			return this.text_align(value);
		}
		text_leading() {
			return this.text_align("start");
		}
		text_center() {
			return this.text_align("center");
		}
		text_trailing() {
			return this.text_align("end");
		}

		// Align items by height inside a hstack.
		align_height() {
			return this.align_items("stretch");
		}

		// Text wrap.
		/*	@docs:
		 *	@title: Text wrap
		 *	@description: 
		 *		Set the text wrap value.
		 *		The equivalent of CSS attribute `textWrap`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		text_wrap(value) {
			if (value == null) { return this.style.textWrap; }
			this.style.textWrap = value;
			return this;
		}

		// Webkit line clamp
		/*	@docs:
		 *	@title: Line clamp
		 *	@description: 
		 *		This non-standard CSS property allows you to limit the number of lines shown in a block container. When used in conjunction with `-webkit-box-orient`, it specifies the maximum number of lines to display before truncating the text. Text that exceeds this limit is cut off and typically ends with an ellipsis. This property is particularly useful for creating text overflow effects in web design where maintaining a consistent, visually manageable block of text is necessary.
		 *
		 *		The equivalent of CSS attribute `-webkit-line-clamp`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		line_clamp(value) {
			if (value == null) { return this.style.webkitLineClamp; }
			this.style.webkitLineClamp = value;
			return this;
		}

		// Webkit box orient.
		/*	@docs:
		 *	@title: Box orient
		 *	@description: 
		 *		This property is part of the old flexbox model and is used to define the orientation of the children in a flex container. In combination with `-webkit-line-clamp`, it's set to vertical to allow the line clamping effect on block containers. It dictates how the children of the box are laid out: horizontally or vertically. Note that `-webkit-box-orient` is specific to Webkit-based browsers and is not part of the standard CSS flexbox properties.
		 *
		 *		The equivalent of CSS attribute `-webkit-line-clamp`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		box_orient(value) {
			if (value == null) { return this.style.webkitBoxOrient; }
			this.style.webkitBoxOrient = value;
			return this;
		}
		
		// ---------------------------------------------------------
		// Styling functions.

		/*	@docs:
		 *	@title: Color
		 *	@description: 
		 *		Sets the color of text, also supports a `GradientType` element.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. 
		 *		Unless parameter `value` is `null`, then the attribute's value is returned. 
		 *		When the value is `null` and the color has been set using a `GradientType`, `transparent` will be returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		color(value) {
			if (value == null) { return this.style.color; }
			if (value instanceof GradientType) {
				this.style.backgroundImage = value.gradient;
				this.style.backgroundClip = "text";
				this.style["-webkit-background-clip"] = "text";
				this.style.color = "transparent";
			} else if (value._is_gradient || value.eq_first("linear-gradient(") || value.eq_first("radial-gradient(")) {
				this.style.backgroundImage = value;
				this.style.backgroundClip = "text";
				this.style["-webkit-background-clip"] = "text";
				this.style.color = "transparent";
			} else {
				this.style.color = value;
			}
			return this;
		}

		// Border, 1 till 3 args.
		border(...values) {
			if (values.length === 0) {
				return this.style.border;
			} else if (values.length === 1) {
				this.style.border = values[0];
			} else if (values.length === 2) {
				this.style.border = this.pad_numeric(values[0]) + " solid " + values[1];
			} else if (values.length === 3) {
				this.style.border = this.pad_numeric(values[0]) + " ", values[1] + " " + values[2];
			} else {
				console.error("Invalid number of arguments for function \"border()\".");
			}
			return this;
		}

		// Border top.
		/*	@docs:
		 *	@title: Border top
		 *	@description: 
		 *		Set the border top.
		 *		
		 *		Returns the attribute value when no parameters are defined.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@inherit: false
		 */ 
		border_top(...values) {
			if (values.length === 0) {
				return this.style.borderTop;
			} else if (values.length === 1) {
				this.style.borderTop = values[0];
			} else if (values.length === 2) {
				this.style.borderTop = this.pad_numeric(values[0]) + " solid " + values[1];
			} else if (values.length === 3) {
				this.style.borderTop = this.pad_numeric(values[0]) + " ", values[1] + " " + values[2];
			} else {
				console.error("Invalid number of arguments for function \"border_top()\".");
			}
			return this;
		}

		// Border bottom.
		/*	@docs:
		 *	@title: Border bottom
		 *	@description: 
		 *		Set the border bottom.
		 *		
		 *		Returns the attribute value when no parameters are defined.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@inherit: false
		 */ 
		border_bottom(...values) {
			if (values.length === 0) {
				return this.style.borderBottom;
			} else if (values.length === 1) {
				this.style.borderBottom = values[0];
			} else if (values.length === 2) {
				this.style.borderBottom = this.pad_numeric(values[0]) + " solid " + values[1];
			} else if (values.length === 3) {
				this.style.borderBottom = this.pad_numeric(values[0]) + " ", values[1] + " " + values[2];
			} else {
				console.error("Invalid number of arguments for function \"border_bottom()\".");
			}
			return this;
		}

		// Border right.
		/*	@docs:
		 *	@title: Border right
		 *	@description: 
		 *		Set the border right.
		 *		
		 *		Returns the attribute value when no parameters are defined.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@inherit: false
		 */ 
		border_right(...values) {
			if (values.length === 0) {
				return this.style.borderRight;
			} else if (values.length === 1) {
				this.style.borderRight = values[0];
			} else if (values.length === 2) {
				this.style.borderRight = this.pad_numeric(values[0]) + " solid " + values[1];
			} else if (values.length === 3) {
				this.style.borderRight = this.pad_numeric(values[0]) + " ", values[1] + " " + values[2];
			} else {
				console.error("Invalid number of arguments for function \"border_right()\".");
			}
			return this;
		}
		
		// Border left.
		/*	@docs:
		 *	@title: Border left
		 *	@description: 
		 *		Set the border left.
		 *		
		 *		Returns the attribute value when no parameters are defined.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@inherit: false
		 */ 
		border_left(...values) {
			if (values.length === 0) {
				return this.style.borderLeft;
			} else if (values.length === 1) {
				this.style.borderLeft = values[0];
			} else if (values.length === 2) {
				this.style.borderLeft = this.pad_numeric(values[0]) + " solid " + values[1];
			} else if (values.length === 3) {
				this.style.borderLeft = this.pad_numeric(values[0]) + " ", values[1] + " " + values[2];
			} else {
				console.error("Invalid number of arguments for function \"border_left()\".");
			}
			return this;
		}


		// Adds shadow to the object, 1 or 4 args.
		shadow(...values) {
			if (values.length === 0) {
				return this.style.boxShadow;
			}
			else if (values.length === 1) {
				return this.box_shadow(this.pad_numeric(values[0]));
			} else if (values.length === 4) {
				return this.box_shadow(
					this.pad_numeric(values[0]) + " " +
					this.pad_numeric(values[1]) + " " +
					this.pad_numeric(values[2]) + " " +
					values[3]
					);
			} else {
				console.error("Invalid number of arguments for function \"shadow()\".");
			}
		}

		// Adds drop shadow to the object, 0 or 4 args.
		drop_shadow(...values) {
			if (values.length === 0 || values.length === 1 && values[0] == null) {
				return this.filter();
			} else if (values.length === 1) {
				return this.filter("drop-shadow(" + this.pad_numeric(values[0]) + ") ");
			} else if (values.length === 4) {
				return this.filter(
					"drop-shadow(" + 
					this.pad_numeric(values[0]) + " " +
					this.pad_numeric(values[1]) + " " +
					this.pad_numeric(values[2]) + " " +
					values[3] + ") "
					);
			} else {
				console.error("Invalid number of arguments for function \"drop_shadow()\".");
			}
		}

		// Greyscale.
		greyscale(value) {
			if (value == null) {
				return this.filter();
			} else {
				return this.filter("grayscale(" + this.pad_percentage(value, "") + ") ");
			}
		}

		// Opacity.
		opacity(value) {
			switch (this.base_element_type) {

				// Use filter since that also supports keyframes for class StyleElement.
				case "Style":
					if (value == null) {
						return this.filter(this.edit_filter_wrapper(this.style.filter, "opacity", value));
					} else {
						if (value <= 1.0) {
							value *= 100;
						}
						return this.filter(this.edit_filter_wrapper(this.style.filter, "opacity", "opacity(" + value + ") "));
					}

				// Default.
				default:
					if (value == null) { return this.style.opacity; }
					this.style.opacity = value;
					return this;
			}
		}

		// Toggle opacity.
		// Can be used to darken and normalize a view.
		// Not supported for element "StyleElement" because of "opacity()".
		toggle_opacity(value = 0.25) {
			if (typeof this.style.opacity === "undefined" || this.style.opacity == "" || this.style.opacity == 1.0) {
				this.style.opacity = value;
			} else {
				this.style.opacity = 1.0;
			}
			return this;
		}

		// Blur.
		blur(value) {
			if (value == null) {
				return this.filter(this.edit_filter_wrapper(this.style.filter, "blur", value));
			} else {
				return this.filter(this.edit_filter_wrapper(this.style.filter, "blur", "blur(" + this.pad_numeric(value) + ") "));
			}
		}

		// Toggle blur.
		toggle_blur(value = 10) {
			return this.filter(this.toggle_filter_wrapper(this.style.filter, "blur", "blur(" + this.pad_numeric(value) + ") "));
		}
		
		// Background blur.
		background_blur(value) {
			if (value == null) {
				return this.backdrop_filter(this.edit_filter_wrapper(this.style.backdropFilter, "blur", value));
			} else {
				return this.backdrop_filter(this.edit_filter_wrapper(this.style.backdropFilter, "blur", "blur(" + this.pad_numeric(value) + ") "));
			}
		}

		// Toggle background blur.
		toggle_background_blur(value = 10) {
			return this.backdrop_filter(this.toggle_filter_wrapper(this.style.backdropFilter, "blur", "blur(" + this.pad_numeric(value) + ") "));
		}

		// Brightness.
		brightness(value) {
			if (value == null) {
				return this.filter(this.edit_filter_wrapper(this.style.filter, "brightness", value));
			} else {
				return this.filter(this.edit_filter_wrapper(this.style.filter, "brightness", "brightness(" + this.pad_percentage(value, "%") + ") "));
			}
		}

		// Toggle brightness.
		toggle_brightness(value = 0.5) {
			return this.filter(this.toggle_filter_wrapper(this.style.filter, "brightness", "brightness(" + this.pad_percentage(value, "%") + ") "));
		}

		// Background brightness.
		background_brightness(value) {
			if (value == null) {
				return this.backdrop_filter(this.edit_filter_wrapper(this.style.backdropFilter, "brightness", value));
			} else {
				return this.backdrop_filter(this.edit_filter_wrapper(this.style.backdropFilter, "brightness", "brightness(" + this.pad_percentage(value, "%") + ") "));
			}
		}

		// Toggle brightness.
		toggle_background_brightness(value = 10) {
			return this.backdrop_filter(this.toggle_filter_wrapper(this.style.backdropFilter, "brightness", "brightness(" + this.pad_percentage(value, "%") + ") "));
		}

		// Rotate.
		rotate(value) {
			if (value == null) {
				return this.transform(this.edit_filter_wrapper(this.style.transform, "rotate", value));
			} else {
				let degree;
				if (vweb.utils.is_float(value)) {
					degree = Math.round(360 * value);
				} else if (vweb.utils.is_numeric(value)) {
					degree = value.toString();
				} else if (value.charAt(value.length - 1) === "%") {
					degree = Math.round(360 * parseFloat(value.substr(0, value.length - 1) / 100));
				} else {
					degree = value;
				}
				return this.transform(this.edit_filter_wrapper(this.style.transform, "rotate", `rotate(${degree}deg) `));
			}
		}

		// Delay and duration used for keyframes for class StyleElement.
		delay(value) {
			this.style.delay = value;
			return this;
		}
		duration(value) {
			this.style.duration = value;
			return this;
		}

		// A shorthand property for all the background properties.
		/*	@docs:
		 *	@title: Background
		 *	@description: 
		 *		A shorthand property for all the background properties.
		 *		The equivalent of CSS attribute `background`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		background(value) {
			if (value == null) { return this.style.background; }
			if (typeof value === "string" && (value.eq_first("linear-gradient") || value.eq_first("radial-gradient"))) {
				this.style.background = value;
				this.style.backgroundImage = value
				this.style.backgroundRepeat = "no-repeat"
				this.style.backgroundSize = "cover"
			} else {
				this.style.background = value;
			}
			return this;
		}


		// Assign font size by scale in relation to the current assigned font size.
		scale_font_size(scale = 1.0) {
			const size = parseFloat(this.style.fontSize)
			if (!isNaN(size)) {
				this.font_size(size * scale);
			}
			return this;
		}


		// ---------------------------------------------------------
		// Visibility functions.

		// Specifies how a certain HTML element should be displayed
		display(value) {
			if (value == null) {
				return this.style.display;
			}
			if (value != null && value != "none") {
				this.element_display = value;
			}
			this.style.display = value;
			return this;
		}

		// Hide the element.
		hide() {
			this.style.display = "none";
			return this;
		}

		// Show.
		show() {
			this.style.display = this.element_display;
			return this;
		}

		// Specify if the element is hidden.
		// Should not be used with an argument, rather use hide() and show().
		is_hidden() {
			return this.style.display === "none" || typeof this.style.display === "undefined";
		}
		is_visible() {
			return !(this.style.display === "none" || typeof this.style.display === "undefined");
		}

		// Toggle visibility.
		toggle_visibility() {
			if (this.is_hidden()) {
				this.show();
			} else {
				this.hide();
			}
			return this;
		}

		// ---------------------------------------------------------
		// General attribute functions.
		
		// Inner html.
		inner_html(value) {
			if (value == null) {
				return this.innerHTML;
			}
			this.innerHTML = value;
			return this;
		}

		// Outer html.
		outer_html(value) {
			if (value == null) {
				return this.outerHTML;
			}
			this.outerHTML = value;
			return this;
		}
		
		// Style dictionary.
		// - Returns the css attributes when param css_attr is null.
		// - When this function returns all the default styles that where not assigned to the object it will cause nasty behaviour with `set_defaults()`.
		styles(css_attr) {
			if (css_attr == null) {
				let dict = {};
				for (let property in this.style) {
					let value = this.style[property];
					
					// Check for css styles assigned with "var(...)" otherwise they will not be added to the dict.
					if (
						typeof value === 'string' && 
						value !== undefined && 
						value.startsWith("var(")
					) {
						dict[property] = value;
					}

					// Check property.
					else if (
						this.style.hasOwnProperty(property)
					) {
						const is_index = (/^\d+$/).test(property);

						// Custom css styles will be a direct key instead of the string index.
						if (property[0] == "-" && is_index === false && value != '' && typeof value !== 'function') { 
							dict[property] = value;
						}

						// Default styles will be an index string instead of the key.
						else if (is_index) { 
							const key = this.style[property];
							const value = this.style[key];
							if (
								key !== '' && key !== undefined && typeof key !== 'function' &&
								value !== '' && value !== undefined && typeof value !== 'function'
							) {
								dict[key] = value;
							}
						}

						// When the object is a style object it does not seem to work correctly.
						else if (this.element_type === "Style") {
							dict[property] = value;
						}
					}
				}
				return dict;
			}
			for (const i in css_attr) {
				const value = css_attr[i];
				if (
					i === "display" && value != null && value !== "none"
				) {
					this.element_display = value;
				}
				this.style[i] = value;
			}	
			return this;
		}

		// Get or set a single attribute.
		// leave value null to get the attribute.
		attr(key, value = null) {
			if (value == null) {
				return this.getAttribute(key);
			}
			this.setAttribute(key, value);
			return this;
		}

		// Set attributes by dict.
		attrs(html_attr) {
			for (let i in html_attr) {
				this.setAttribute(i, html_attr[i]);
			}
			return this;
		}

		// Get or set a single events.
		// leave value null to get the events.
		event(key, value = null) {
			if (value == null) {
				return this[key];
			}
			this[key] = value;
			return this;
		}

		// Set events by dict.
		events(html_events) {
			for (let i in html_events) {
				this[i] = html_events[i];
			}
			return this;
		}

		// Specifies one or more classnames for an element (refers to a class in a style sheet).
		/*	@docs:
		 *	@title: Class
		 *	@description: 
		 *		Specifies one or more classnames for an element (refers to a class in a style sheet).
		 *		The equivalent of HTML attribute `class`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		} */ 
		class(value) {
			if (value == null) { return this.class; }
			this.className = value;
			return this;
		}

		/*	@docs:
			@title: Toggle class
			@description: Toggle a class name from the class list.
			@param:
				@name: name
				@descr: The class name.
		 */
		toggle_class(name) {
			this.classList.toggle(name);
			return this;
		}

		/*	@docs:
			@title: Remove class
			@description: Remove a class name from the class list.
			@param:
				@name: name
				@descr: The class name.
		 */
		remove_class(name) {
			this.classList.remove(name);
			return this;
		}

		/*	@docs:
			@title: Remove all classes
			@description: Remove all classes from the class list.
		 */
		remove_classes() {
			while (this.classList.length > 0) {
				this.classList.remove(this.classList.item(0));
			}
			return this;
		}

		// Themes.
		// - A theme should have an id.
		//   Other attributes should be an elements function name as key with parameters as value.
		//   Arrays can be used for functions with multiple parameters.
		themes(...themes) {
			if (themes.length === 1 && Array.isArray(themes[0])) {
				themes = themes[0];
				for (let i = 0; i < themes.length; i++) {
					themes[i].element = this;
					vweb.themes.theme_elements.push(themes[i]);
				}
			} else {
				for (let i = 0; i < themes.length; i++) {
					themes[i].element = this;
					vweb.themes.theme_elements.push(themes[i]);
				}
			}
			return this;
		}

		// On hover brightness.
		// Check if button behaviour is enabled with `const enabled = x.button_behavior();`.
		// Enable button behaviour like `x.hover_brightness(true)` and disable it like `x.hover_brightness(false)`.
		// You can also specify the brightness values of the mouse down and mouse over like `x.hover_brightness(0.8, 0.9)`, the first parameter is for mouse down.
		hover_brightness(mouse_down_brightness = null, mouse_over_brightness = 0.9) {

			// Disable.
			if (mouse_down_brightness === false) {
				this.onmousedown = null;
				this.onmouseover = null;
				this.onmouseup = null;
				this.onmouseout = null;
				return this;
			}

			// Enable.
			if (mouse_down_brightness === true || typeof mouse_down_brightness === "number") {
				if (mouse_down_brightness === true) {
					mouse_down_brightness = 0.8;
				}
				this.onmousedown = function() { this.style.filter = `brightness(${mouse_down_brightness*100}%)`; }
				this.onmouseover = function() { this.style.filter = `brightness(${mouse_over_brightness*100}%)`; }
				this.onmouseup = function() { this.style.filter = "brightness(100%)"; }
				this.onmouseout = function() { this.style.filter = "brightness(100%)"; }
				return this;
			}

			// Retrieve enabled.
			else {
				return this.onmousedown != null;
			}
		}

		// Get the text width of the entire text as one line, useful for input elements.
		// @warning: Only reliable when the element has been rendered.
		text_width(text = null) {
			const width_measurer = document.createElement("canvas").getContext("2d");
			const computed = window.getComputedStyle(this);
		    width_measurer.font = `${computed.fontStyle} ${computed.fontVariant} ${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`;
			if (text == null) {
				return width_measurer.measureText(this.textContent).width;
			} else {
				return width_measurer.measureText(text).width;
			}
		}

		// Function to add a node to a FrameMode.
		frame_mode(...args) {
			if (args.length === 1) {
				args[0].push(this);
			} else if (args.length === 2 && args[0] instanceof FrameModesType) {
				if (args[1] !== args[0].active) {
					this.hide();
				}
				args[0][args[1]].push(this);
			}
			return this;
		}

		// ---------------------------------------------------------
		// Media query functions.

		// Create media query.
		media(media_query, true_handler, false_handler) {

			// Edit query.
			if (media_query.first() !== "(") {
				media_query = "(" + media_query;
			}
			let c;
			while ((c = media_query.last()) === " " || c === "\t" || c === "\n") {
				media_query = media_query.substr(0, media_query.length - 1)
			}
			if (media_query.last() !== ")") {
				media_query = media_query + ")";
			}

			// Create query.
			const e = this;
			const query = {
				list: null,
				callback: (query) => {
					if (query.matches) {
						true_handler(e);
					} else if (false_handler != null) {
						false_handler(e);
					}
				}
			}

			// Remove duplicates.
			if (this.media_queries === undefined) {
				this.media_queries = {};
			} else if (this.media_queries[media_query] !== undefined) {
				this.media_queries[media_query].list.removeListener(this.media_queries[media_query].callback);
			}

			// Watch media.
			query.list = window.matchMedia(media_query);
			query.callback(query.list); // Initialize the style based on the initial media query state
			query.list.addListener(query.callback); // Update the style when the media query state changes

			// Cache query.
			this.media_queries[media_query] = query;

			// Response.
			return this;
		}

		// Remove a media query.
		remove_media(media_query) {
			if (typeof this.media_queries === "object" && this.media_queries[media_query] !== undefined) {
				this.media_queries[media_query].list.removeListener(this.media_queries[media_query].callback);
			}
			return this;
		}

		// Remove all media queries.
		remove_medias() {
			if (typeof this.media_queries === "object") {
				Object.values(this.media_queries).iterate((query) => {
					query.list.removeListener(query.callback);
				})
			}
			return this;
		}
		remove_all_media() {
			if (typeof this.media_queries === "object") {
				Object.values(this.media_queries).iterate((query) => {
					query.list.removeListener(query.callback);
				})
			}
			return this;
		}

		// ---------------------------------------------------------
		// Animations.

		// Default html animate function.
		default_animate(...args) {
			super.animate(...args);
			return this;
		}

		// Animation.
		// Starting a new animation automatically resets the active animation.
		animate({
			keyframes = [], 		// keyframe objects.
			delay = 0,				// start delay.
			duration = 0,			// duration per keyframe.
			repeat = false,			// infinite repeat,
			persistent = false,		// keep the last keyframe when the animation ends.
			on_finish = null,		// on finish callback function.
			easing = "ease-in-out",	// easing.
		}) {
			const e = this;

			// Padd numeric values like "top" with "px".
			const convert = [
				"width",
				"height",
				"top",
				"right",
				"bottom",
				"left",
				"margin",
				"margin-top",
				"margin-right",
				"margin-bottom",
				"margin-left",
				"padding",
				"padding-top",
				"padding-right",
				"padding-bottom",
				"padding-left",
				"border-width",
				"border-top-width",
				"border-right-width",
				"border-bottom-width",
				"border-left-width",
				"min-width",
				"min-height",
				"max-width",
				"max-height",
				"outline-width",
				"column-width",
				"column-gap",
				"row-gap",

				"marginTop",
				"marginRight",
				"marginBottom",
				"marginLeft",
				"paddingTop",
				"paddingRight",
				"paddingBottom",
				"paddingLeft",
				"borderWidth",
				"borderTopWidth",
				"borderRightWidth",
				"borderBottomWidth",
				"borderLeftWidth",
				"minWidth",
				"minHeight",
				"maxWidth",
				"maxHeight",
				"outlineWidth",
				"columnWidth",
				"columnGap",
				"rowGap",
			];
			for (let i = 0; i < keyframes.length; i++) {
				if (keyframes[i] instanceof StyleElement) {
					keyframes[i] = keyframes[i].styles();
				} else {
					for (let key in keyframes[i]) {
						if (vweb.utils.is_numeric(keyframes[i][key]) && convert.includes(key)) {
							keyframes[i][key] = this.pad_numeric(keyframes[i][key]);
						}
					}
				}
			}

			// Keep a single keyframe state for delays.
			// function keep_state(index) {
			// 	e.default_animate(
			// 		[
			// 		keyframes[index],
			// 		keyframes[index],
			// 		], 
			// 		{
			// 			duration: delay,
			// 		}
			// 		);
			// }

			// Do an animation.
			function do_animation(index) {

				// Animate.
				if (index + 1 < keyframes.length) {
					const from = keyframes[index];
					const to = keyframes[index + 1];
					let opts = {
						duration: duration,
						// easing: from.easing || easing,
					};
					if (from.duration != null) {
						opts.duration = from.duration;
					}
					if (
						(index + 2 == keyframes.length && persistent && !repeat) || // keep by persistant.
						(to.delay != null && to.delay > 0) // keep by delay.
					) {
						opts.fill = "forwards";
					}
					e.default_animate(
						[from, to], 
						opts,
					);
					if (to.delay != null && to.delay > 0) {
						// clearTimeout(e.animate_timeout);
						// e.animate_timeout = setTimeout(() => keep_state(index + 1), from.duration || duration);
						clearTimeout(e.animate_timeout);
						e.animate_timeout = setTimeout(() => do_animation(index + 1), (from.duration || duration) + (to.delay || 0));
					} else {
						clearTimeout(e.animate_timeout);
						e.animate_timeout = setTimeout(() => do_animation(index + 1), from.duration || duration);
					}
				}

				// Repeat when finished.
				else if (repeat) {

					// Keep last state till delay.
					if (delay > 0) {
						// keep_state(keyframes.length - 1);
						clearTimeout(e.animate_timeout);
						e.animate_timeout = setTimeout(() => do_animation(0), delay);

					}

					// No delay.
					else {
						const delay = keyframes[keyframes.length - 1].duration || duration;
						clearTimeout(e.animate_timeout);
						e.animate_timeout = setTimeout(() => do_animation(0), delay);
					}

				}

				// Finished.
				else if (on_finish != null) {
					on_finish(e);
				}
			}

			// Start.
			clearTimeout(this.animate_timeout);
			this.animate_timeout = setTimeout(() => do_animation(0), delay || 0);
			return this;

			// ============================================
			// v1.
			/*

			// Use default animation when the keyframes do not contain key "duration" or "delay".
			const default_animation = true;
			for (let i = 0; i < keyframes.length; i++) {
				if (keyframes[i].duration != null || keyframes[i].delay != null) {
					default_animation = false;
					break;
				}
			}

			// Default animation.
			if (default_animation) {
				if (options.iterations == "infinite") {
					options.iterations = Infinity;
				}
				if (options.iterations == "infinite") {
					options.iterations = Infinity;
				}
				const animation = this.animate(keyframes, options);
				if (on_finish !== null) {
					const e = this;
					animation.onfinish = function() {
						on_finish(e);
					}
				}
				return this;
			}

			// const { keyframes, options: animationOptions, on_finish } = options;

			// List of properties that require the "px" unit
			const padded_properties = [
				"top",
				"left",
				"right",
				"bottom",
				"width",
				"height",
				"margin",
				"margin-top",
				"margin-bottom",
				"margin-left",
				"margin-right",
				"padding",
				"padding-top",
				"padding-bottom",
				"padding-left",
				"padding-right",
				"border-width",
				"border-top-width",
				"border-bottom-width",
				"border-left-width",
				"border-right-width",
				"border-radius",
			];

			const animate_frame = (index) => {
				if (index >= keyframes.length) {
					if (options.iterations === "infinite") {
						// Repeat the animation if iterations are set to "infinite"
						requestAnimationFrame(() => animate_frame(0));
					} else if (typeof options.iterations === "number" && options.iterations > 1) {
						// Repeat the animation a finite number of times
						requestAnimationFrame(() => animate_frame(0));
						options.iterations--;
					} else if (on_finish) {
						// Animation finished, call the on_finish callback
						on_finish();
					}
					return;
				}

				const keyframe = keyframes[index];
				const next_keyframe = keyframes[index + 1] || keyframes[0];

				const duration = keyframe.duration || options.duration || 1000; // Default duration if not provided
				const delay = keyframe.delay || options.delay || 0; // Default duration if not provided
				const start_time = Date.now();

				const animate_step = () => {
					const elapsed = Date.now() - start_time;
					const delay_progress = delay == 0 ? 1 : Math.min(elapsed / delay, 1);
					const progress = duration == 0 ? 1 : Math.min((elapsed - delay) / duration, 1);

					if (delay_progress >= 1) {
						for (let property in keyframe) {
							const from = keyframe[property];
							const to = next_keyframe[property];

							// Apply "px" unit to properties that require it.
							if (padded_properties.includes(property)) {
								let padding;
								if (vweb.utils.is_string(from)) {
									if (from.includes("px")) {
										from = parseFloat(from.substr(0, from.length - 2));
										padding = "px";
									} else if (from.includes("%")) {
										from = parseFloat(from.substr(0, from.length - 1));
										padding = "%";
									}
								} else {
									padding = "px";
								}
								const current = (to - from) * progress + from;
								this.style[property] = current + padding;
							}

							// Apply non-numeric animation directly.
							else if (progress >= 1){
								this.style[property] = to;
							}

						}
					 }

					if (delay_progress < 1 || progress < 1) {
						requestAnimationFrame(animate_step);
					} else {
						requestAnimationFrame(() => animate_frame(index + 1));
					}
				};

				animate_step();
			};

			animate_frame(0);

			return this;
			*/
		}

		// Stop the active animation.
		stop_animation() {
			clearTimeout(this.animate_timeout);
			return this;
		}

		// Slide out.
		async slide_out({
			direction = "top",		// the slide direction.
			distance = 100,			// the slide distance.
			duration = 500,			// the duration of the slide animation.
			opacity = true,			// animate opacity.
			easing = "ease",		// easing.
			hide = true,			// hide the element when animation complete.
			remove = false,			// remove the element when animation complete.
			display = null,			// the optional display to use for when showing the view again.
			_slide_in = false,
		}) {
			const element = this;
			return new Promise((resolve, reject) => {

				// Vars.
				const old_transform = element.transform() || "";
				const old_transition = element.transition();
				let transform, initial_transform;
				if (_slide_in) {
					if (direction === "top") {
						transform = `translateY(0)`;
						initial_transform = `translateY(${-distance}px)`
					} else if (direction === "bottom") {
						transform = `translateY(0)`;
						initial_transform = `translateY(${distance}px)`
					} else if (direction === "right") {
						transform = `translateX(0)`;
						initial_transform = `translateX(${distance}px)`
					} else if (direction === "left") {
						transform = `translateX(0)`;
						initial_transform = `translateX(${-distance}px)`
					} else {
						return reject(new Error(`Invalid direction "${direction}", the valid directions are "top", "bottom", "right", "left".`));
					}
				} else {
					if (direction === "top") {
						transform = `translateY(${-distance}px)`;
						initial_transform = "translateY(0)";
					} else if (direction === "bottom") {
						transform = `translateY(${distance}px)`;
						initial_transform = "translateY(0)";
					} else if (direction === "right") {
						transform = `translateX(${distance}px)`;
						initial_transform = "translateX(0)";
					} else if (direction === "left") {
						transform = `translateX(${-distance}px)`;
						initial_transform = "translateX(0)";
					} else {
						return reject(new Error(`Invalid direction "${direction}", the valid directions are "top", "bottom", "right", "left".`));
					}
				}
				initial_transform = old_transform + initial_transform;
				transform = old_transform + transform;

				// Set initial state.
				if (_slide_in) {
					if (display != null) {
						element.display(display);
					} else {
						element.show();
					}
				}
				element.transition("none");
				element.getBoundingClientRect(); // reflow.
				element.transform(initial_transform);
				element.opacity(_slide_in ? 0 : 1);
				element.getBoundingClientRect(); // reflow.
				element.transition(`transform ${duration}ms ${easing}, opacity ${duration}ms ease-in`);
				element.getBoundingClientRect(); // reflow.

				// Transition.
				if (opacity === false) {
					element.transform(transform);
				} else {
					element.opacity(_slide_in ? 1 : 0)
					element.transform(transform);
				}
				
				// Resolve animation.
				setTimeout(() => {

					// Hide element.
					if (hide && _slide_in !== true) {
						element.hide()
					} else if (remove && _slide_in !== true) {
						element.remove();
					}

					// Restore old transition.
					element.transition(old_transition);
					element.transform(old_transform);

					// Resolve.
					resolve()
				}, duration);


			});
		}

		// Slide in.
		async slide_in({
			direction = "top",		// the slide direction.
			distance = 100,			// the slide distance.
			duration = 500,			// the duration of the slide animation.
			opacity = true,			// animate opacity.
			easing = "ease",		// easing.
			display = null,			// the optional display to use for when showing the view again.
		}) {
			return this.slide_out({
				direction: direction,
				distance: distance,
				duration: duration,
				opacity: opacity,
				easing: easing,
				display: display,
				hide: false,
				_slide_in: true,
			});
		}

		/*  @docs:
			@title: Dropdown text animation
			@desc: Dropdown text animation
			@warning: Causes undefined behaviour when called on a non text element.
			@param:
				@name: distance
				@type: number
				@desc: The distance of pixels of the drop (negative) or rise (positive).
			@param:
				@name: duration
				@type: number
				@desc: The duration of each individual character drop animation in milliseconds.
			@param:
				@name: opacity_duration
				@type: number
				@desc: The factor for the duration in relation to the dropdown duration, 1.0 for 100%.
			@param:
				@name: total_duration
				@type: number
				@desc: The total duration of the character drop animation, this parameter will overwrite the `duration` parameter.
			@param:
				@name: delay
				@type: number
				@desc: The delay in millseconds for each character drop.
			@param:
				@name: start_delay
				@type: number
				@desc: The start delay of the animation in milliseconds.
			@param:
				@name: easing
				@type: string
				@desc: The animation's easing.
		 */
		async dropdown_animation({
			distance = "-20px",
			duration = 150,
			opacity_duration = 1.25,
			total_duration = null,
			delay = 60,
			start_delay = 50,
			easing = "ease-in-out",
		} = {}) {
			return new Promise((resolve) => {

				// Initialize.
				const word_spans = [];
				const spans = [];
				const nodes = this.childNodes;

				// Args.
				if (typeof distance === "number") {
					distance = `${distance}px`;
				}
				if (total_duration != null) {
					delay = total_duration / this.textContent.length;
				}

				// Convert each character into a span.
				const split_text = (text, text_style = null) => {
					const words = text.split(" ");
					for (let w = 0; w < words.length; w++) {
						const word_span = Span()
							.display("inline-block")
							.white_space("nowrap")
						if (text_style != null) {
							word_span.style.cssText = text_style;
						}
						for (let c = 0; c < words[w].length; c++) {
							const span = Span(words[w][c])
								.white_space("pre")
								.display("inline-block")
								.opacity(0)
								.transform(`translateY(${distance})`)
								.transition(`transform ${duration}ms ${easing}, opacity ${parseInt(duration * opacity_duration)}ms ${easing}`);
							spans.append(span);
							word_span.append(span);
						}
						if (w < words.length - 1) {
							word_span.append(Span(" ").white_space("pre"));
						}
						word_spans.append(word_span);
					}
				}
				const traverse = (nodes, text_style = "") => {
					for (let n = 0; n < nodes.length; n++) {
						const node = nodes[n];
						if (node.nodeType === Node.TEXT_NODE) {
							split_text(node.textContent, text_style)
						} else {
							traverse(node.childNodes, text_style + node.style.cssText);
						}
					}
				}
				traverse(nodes);

				// Append word spans after the traversing.
				this.innerHTML = "";
				for (let i = 0; i < word_spans.length; i++) {
					this.append(word_spans[i]);
				}


				// this.textContent = "";
				

				// Perform animation.
				let index = 0;
				const animate_span = () => {
					spans[index].opacity(1);
					spans[index].transform("translateY(0px)");
					++index;
					if (index === spans.length) {
						resolve();
					} else {
						setTimeout(animate_span, delay);
					}
				}
				setTimeout(animate_span, start_delay);
			})
		}

		/*  @docs:
			@title: Increment Number Animation
			@desc: Animate incrementing a number.
			@warning: Causes undefined behaviour when called on a non text element.
			@param:
				@name: start
				@type: number
				@desc: The start number.
			@param:
				@name: end
				@type: number
				@desc: The end number, the animation will end with the number value of `end - 1`.
			@param:
				@name: duration
				@type: number
				@desc: The duration of each individual number increment in milliseconds.
			@param:
				@name: total_duration
				@type: number
				@desc: The total duration of the entire animation, parameter `total_duration` precedes parameter `duration`.
			@param:
				@name: delay
				@type: number
				@desc: The delay until the animation starts in milliseconds.
			@param:
				@name: prefix
				@type: string
				@desc: The prefix string.
			@param:
				@name: suffix
				@type: string
				@desc: The suffix string.
		 */
		async increment_number_animation({
			start = 0,
			end = 100,
			duration = 150,
			total_duration = null,
			delay = 0,
			prefix = "",
			suffix = "",
		} = {}) {
			if (total_duration != null) {
				duration = total_duration / this.textContent.length;
			}
			return new Promise((resolve) => {
				let value = start;
				const animate = () => {
					this.textContent = `${prefix}${value}${suffix}`;
					++value;
					if (value < end) {
						setTimeout(animate, duration);
					} else {
						resolve();
					}
				}
				setTimeout(animate, delay);
			})
		}

		// ---------------------------------------------------------
		// Events.

		// Register event callback from `vweb.events`.
		on_event(id, callback) {
			vweb.events.on(id, this, callback);
			return this;
		}

		// Remove on event.
		remove_on_event(id, callback) {
			vweb.events.remove(id, this, callback);
			return this;
		}

		// Remove all on event callbacks.
		remove_on_events(id) {
			vweb.events.remove(id, this);
			return this;
		}

		// Set timeout.
		// Valid options attributes are `id` and `debounce`.
		timeout(delay, callback, options = null) {
			if (options != null && options.id != null) {
				if (this._timeouts === undefined) {
					this._timeouts = {};
				}
				if (options.debounce === true) {
					clearTimeout(this._timeouts[options.id]);
				}
				this._timeouts[options.id] = setTimeout(() => callback(this), delay);
			} else {
				setTimeout(() => callback(this), delay);
			}
			return this;
		}

		// Clear a cached timeout.
		clear_timeout(id) {
			if (this._timeouts === undefined) {
				this._timeouts = {};
			}
			clearTimeout(this._timeouts[id]);
			return this;
		}

		// Disable a button.
		disable() {
			this._disabled = true;
			return this;
		}

		// Enable a button.
		enable() {
			this._disabled = false;
			return this;
		}

		// Script to be run when the element is being clicked
		// Either 1 param can be passed the callback.
		// Or 2 params, first is the emulated href and second the callback. The href will be set and the default behaviour of the event will be prevented. This can emulate a href for SEO in SPA's. Dont forget to use pushState() though.
		on_click(...args) {
			let simulate_href, callback;
			if (args.length === 0) {
				return this.onclick;
			} else if (args.length === 1) {
				callback = args[0];
			} else if (args.length === 2 && args[0] == null) {
				callback = args[1];
			} else {
				simulate_href = args[0];
				callback = args[1];
				this.href(simulate_href);
			}
			if (callback == null) {
				return this.onclick;
			}
			this.style.cursor = "pointer";
			this.user_select("none");
			const e = this;
			this.onclick = (t) => {
				if (simulate_href) {
					event.preventDefault();
				}
				if (this._disabled !== true) {
					callback(e, t);
				}
			};
			// deprecated, buttons now use <button>
			// if (this.element_type === "Button" || this.element_type === "LoaderButton" || this.element_type === "BorderButton") {
			// 	this.attr("rel", "noopener noreferrer"); // for seo.
			// }
			return this;
		}

		// On click redirect.
		on_click_redirect(url) {
			return this.on_click(url, () => vweb.utils.redirect(url));
		}

		// Script to be run when an element's scrollbar is being scrolled.
		/*	@docs:
		 *	@title: On scroll
		 *	@description: 
		 *		Script to be run when an element's scrollbar is being scrolled.
		 *		The equivalent of HTML attribute `onscroll`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_scroll(opts_or_callback = {callback: null, delay: null}) {
			if (opts_or_callback == null) { return this.onscroll; }
			if (vweb.utils.is_func(opts_or_callback)) {
				const e = this;
				this.onscroll = (event) => opts_or_callback(e, event);
			} else {
				if (opts_or_callback.delay == null) {
					this.onscroll = opts_or_callback.callback;
				} else {
					let timer;
					const e = this;
					this.onscroll = function(t) {
						clearTimeout(timer);
						setTimeout(() => opts_or_callback.callback(e, t), opts_or_callback.delay);
					}
				}
			}
			return this;
		}

		// Script to be run when the browser window is being resized.
		/*	@docs:
		 *	@title: On resize
		 *	@description: 
		 *		Script to be run when the browser window is being resized.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_window_resize({callback, once = false, delay = 25}) {
			if (callback == null) { return window.onresize; }
			const e = this;
			window.addEventListener('resize', () => {
				if (once && e.on_window_resize_timer != null) {
					clearTimeout(e.on_window_resize_timer)
				}
				e.on_window_resize_timer = setTimeout(() => callback(e), delay);
			});
			return this;
		}

		// Custom on attachment drop event.
		// Callback parameters are ({name: ..., path: ..., is_dir: ..., data: ..., file: ..., size: ...}). The size is in MB.
		on_attachment_drop({callback, read = true, compress = false, on_start = () => {}}) {
			this.ondragover = (event) => {
				event.preventDefault();
				event.dataTransfer.dropEffect = "copy";
				on_start(event);
			};

			// v2.
			// Iterate through dataTransfer.items to gather information about each item.
			this.ondrop = (event) => {
				event.preventDefault();
				const items = event.dataTransfer.items;
				for (let i = 0; i < items.length; i++) {
					const item = items[i];
					if (item.kind === 'file') {
						const file = item.getAsFile();
						if (file) {
							const args = {
								name: file.name,
								path: file.path,
								is_dir: false,
								data: null,
								compressed: false,
								file: file,
								size: file.size / (1024 * 1024),
							};

							// Check if it's a directory item (e.g., from a folder).
							if (item.webkitGetAsEntry) {
								const entry = item.webkitGetAsEntry();
								if (entry && entry.isDirectory) {
									args.is_dir = true;
								}
							}

							// Read the file.
							if (args.is_dir === false && read) {
								const reader = new FileReader();
								reader.onload = (event) => {
									if (compress) {
										args.data = vweb.utils.compress(event.target.result);
										args.compressed = true;
									} else {
										args.data = event.target.result;
										args.compressed = false;
									}
									callback(args);
								};
								reader.readAsText(file);
							} else {
								callback(args);
							}
						}
					}
				}
			}

			/* v1 uses files but is_dir cant be retrieved with this method.
			this.ondrop = (event) => {
				event.preventDefault();
				const files = event.dataTransfer.files;
				for (let i = 0; i < files.length; i++) {
					const file = files[i];
					const args = {
						name: file.name,
						path: file.path,
						is_dir: event.dataTransfer.items[i].webkitGetAsEntry() == null, // does not work in firefox for android.
						data: null,
						compressed: false,
						file: file,
					}
					console.log(args);
					if (read) { // @todo does not support dirs with read.
						const reader = new FileReader();
						reader.onload = (event) => {
							if (compress == true) {
								args.data = vweb.utils.compress(event.target.result);
								args.compressed = true;
							} else {
								args.data = event.target.result;
								args.compressed = false;
							}
							callback(args);
						};
						reader.readAsText(file);
					} else {
						callback(args);
					}
				}	
			};
			*/
			return this;
		}

		// Event when a element appears to the user.
		on_appear(callback_or_opts = {callback: null, repeat: false, threshold: null}) {

			/*
			const observer = new IntersectionObserver((entries) => {
				entries.forEach(async (entry) => {
					const element = entry.target;

					// Get current and previous Y positions
		            const currentY = entry.boundingClientRect.top;
		            const previousY = element._previousY !== undefined ? element._previousY : currentY;
		            const is_scrolling_down = currentY <= previousY;
		            const scroll_direction = is_scrolling_down ? 'down' : 'up';
		            element._previousY = currentY; // Update the previous Y position

					// Intersecting.
					if (entry.isIntersecting && Array.isArray(element._on_appear_callbacks)) {

						// When a threshold is used on very large elements the intersect ratio should be set by a max of the screen height, not element height.
						// @todo calc is wrong.
						const intersection_ratio = entry.intersectionRatio;
						// const viewport_height = window.innerHeight || document.documentElement.clientHeight;
						// const viewport_width = window.innerWidth || document.documentElement.clientWidth;
						// const intersection_ratio = (entry.intersectionRect.width * entry.intersectionRect.height) / (viewport_width * viewport_height);


						// Iterate callbacks.
						let matched = false, repeat = false;
						for (let i = 0; i < element._on_appear_callbacks.length; i++) {
							const callback = element._on_appear_callbacks[i];
							if (
								// (callback.repeat || callback.called !== true) &&
								(callback.threshold == null || intersection_ratio >= callback.threshold)    	
							) {
								matched = true;
								callback.callback(element, {scroll_direction});
								if (callback.repeat) {
									repeat = true;
								} else {
									callback.called = true;
								}
							}
						}

						// Not matched, add again since it was intersecting but no threshold success.
						// So unobserve and observe otherwise it wont get called again till it is fully out of visible viewport.
						if (matched === false) {
							observer.unobserve(element);
							observer.observe(element);
						}

						// Stop observing.
						else if (repeat === false) {
							observer.unobserve(element);
						}
					}
				});
			});
			*/

			// Observe.
			let callback = callback_or_opts, repeat = false, threshold = null;
			if (typeof callback_or_opts === "object") {
				callback = callback_or_opts.callback;
				if (callback_or_opts.repeat !== undefined) { repeat = callback_or_opts.repeat; }
				if (callback_or_opts.threshold !== undefined) { threshold = callback_or_opts.threshold; }
			}

			// Create individual obersver per request.
			// So a user can define different callbacks per 0.0 threshold and 0.25 threshold etc.
			// Otherwise in v1 it would execute all callbacks inside the single observer, and multiple observers for same callbacks array which was a dumb fault.
			const observer = new IntersectionObserver((entries) => {
				entries.forEach(async (entry) => {
					const element = entry.target;

					// Get current and previous Y positions
		            const currentY = entry.boundingClientRect.top;
		            const previousY = element._previousY !== undefined ? element._previousY : currentY;
		            const is_scrolling_down = currentY <= previousY;
		            const scroll_direction = is_scrolling_down ? 'down' : 'up';
		            element._previousY = currentY; // Update the previous Y position

					// Intersecting.
					if (entry.isIntersecting && Array.isArray(element._on_appear_callbacks)) {

						// When a threshold is used on very large elements the intersect ratio should be set by a max of the screen height, not element height.
						// @todo calc is wrong.
						const intersection_ratio = entry.intersectionRatio;
						// const viewport_height = window.innerHeight || document.documentElement.clientHeight;
						// const viewport_width = window.innerWidth || document.documentElement.clientWidth;
						// const intersection_ratio = (entry.intersectionRect.width * entry.intersectionRect.height) / (viewport_width * viewport_height);

						// No longer observed.
						let found;
						for (let i = 0; i < element._on_appear_callbacks.length; i++) {
							if (element._on_appear_callbacks[i].callback === callback) {
								found = true;
								break;
							}
						}
						if (!found) {
							observer.unobserve(element);
							return ;
						}


						// Iterate callbacks.
						let matched = false;
						if (
							(threshold == null || intersection_ratio >= threshold)    	
						) {
							matched = true;
							callback(element, {scroll_direction});
						}

						// Not matched, add again since it was intersecting but no threshold success.
						// So unobserve and observe otherwise it wont get called again till it is fully out of visible viewport.
						if (matched === false) {
							observer.unobserve(element);
							observer.observe(element);
						}

						// Stop observing.
						else if (repeat === false) {
							observer.unobserve(element);
							observer.disconnect();
						}
					}
				});
			});

			// Add callback.
			// Always add to callback so the user can also manually iterate and perhaps call the callbacks.
			if (Array.isArray(this._on_appear_callbacks)) {
				this._on_appear_callbacks.push({callback, threshold, repeat});
			} else {
				this._on_appear_callbacks = [{callback, threshold, repeat}];
			}

			// It seems the observer also works when the item is already visible.
			observer.observe(this);

			// Check if the element is already visible, since the observer will not execute on already visible elements.
			// const rect = this.getBoundingClientRect();
			// if (
			//   rect.top >= 0 &&
			//   rect.left >= 0 &&
			//   rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
			//   rect.right <= (window.innerWidth || document.documentElement.clientWidth)
			// ) {
			// 	callback(this);
			// 	// if (repeat === true) {
			// 		observer.observe(this);
			// 	// }
			// }
			// else {
			// 	observer.observe(this);
			// }
			return this;
		}

		// Event when an element disappears from the user's view.
		on_disappear(callback_or_opts = { callback: null, repeat: false}) {
		    const element = this; // Assuming 'this' is the element
		    let callback = callback_or_opts;
		    let repeat = false;

		    if (typeof callback_or_opts === 'object') {
		        callback = callback_or_opts.callback;
		        if (callback_or_opts.repeat !== undefined) repeat = callback_or_opts.repeat;
		        if (callback_or_opts.threshold !== undefined) {
		        	console.error(`Invalid parameter "threshold".`);
		        }
		    }

		    // Store previous values per element
		    element._on_disappear_is_visible = false;

		    const observer = new IntersectionObserver((entries, observer) => {
		        entries.forEach((entry) => {

		            // Check if the intersection ratio has crossed below the threshold while scrolling down
		            if (entry.isIntersecting) {
		            	element._on_disappear_is_visible = true;
		            }
		            else if (element._on_disappear_is_visible && !entry.isIntersecting) {
		            	element._on_disappear_is_visible = false;
		            	
		                // Element is about to disappear
		                callback(element);

		                if (!repeat) {
		                    observer.unobserve(element);
		                }
		            }
		        });
		    });

		    observer.observe(element);

		    return this;
		}

		// Event when an element disappears from the user's view.
		// on_disappear(callback_or_opts = { callback: null, repeat: false, threshold: 0.05 }) {
		//     const element = this; // Assuming 'this' is the element
		//     let callback = callback_or_opts;
		//     let repeat = false;
		//     let threshold = 0.05; // Default threshold is 0.05

		//     if (typeof callback_or_opts === 'object') {
		//         callback = callback_or_opts.callback;
		//         if (callback_or_opts.repeat !== undefined) repeat = callback_or_opts.repeat;
		//         if (callback_or_opts.threshold !== undefined) threshold = callback_or_opts.threshold;
		//     }

		//     // Ensure the threshold is between 0 and 1
		//     if (threshold < 0) threshold = 0;
		//     if (threshold > 1) threshold = 1;

		//     // Prepare observer options with thresholds around the desired value
		//     const observerOptions = {
		//         threshold: [threshold, threshold - 0.001, threshold + 0.001].filter(
		//             (t) => t >= 0 && t <= 1
		//         ),
		//     };

		//     // Store previous values per element
		//     element._previousIntersectionRatio = null;
		//     element._previousY = null;

		//     const observer = new IntersectionObserver((entries, observer) => {
		//         entries.forEach((entry) => {
		//             const currentIntersectionRatio = entry.intersectionRatio;
		//             const currentY = entry.boundingClientRect.top;

		//             // Determine scroll direction
		//             let scroll_direction = 'unknown';
		//             if (element._previousY !== null) {
		//                 scroll_direction = currentY < element._previousY ? 'down' : 'up';
		//             }
		//             element._previousY = currentY;

		//             // Initialize previousIntersectionRatio if null
		//             if (element._previousIntersectionRatio === null) {
		//                 element._previousIntersectionRatio = currentIntersectionRatio;
		//                 return; // Skip processing on the first observation
		//             }

		//             // Check if the intersection ratio has crossed below the threshold while scrolling down
		//             if (
		//             	(
		// 	                element._previousIntersectionRatio > threshold &&
		// 	                currentIntersectionRatio <= threshold &&
		// 	                scroll_direction === 'down'
		// 	            ) ||
		// 	            (
		// 	                element._previousIntersectionRatio < (1 - threshold) &&
		// 	                currentIntersectionRatio >= (1 - threshold) &&
		// 	                scroll_direction === 'up'
		// 	            )
		//             ) {
		//             	console.log("Dissapear by threshold", currentIntersectionRatio, element)
		//                 // Element is about to disappear
		//                 callback(element, scroll_direction);

		//                 if (!repeat) {
		//                     observer.unobserve(element);
		//                 }
		//             }

		//             // Update previous intersection ratio
		//             element._previousIntersectionRatio = currentIntersectionRatio;
		//         });
		//     }, observerOptions);

		//     observer.observe(element);

		//     return this;
		// }


		// On enter event.
		// Mainly used for input and textarea elements.
		// Can not me combined "on_key_press()".
		on_enter(callback) {
			this._on_enter_callback = callback;
			if (this._on_keypress_set !== true) {
				this._on_keypress_set = true;
				const e = this;
				super.onkeypress = function(event) {
					if (this._on_enter_callback !== undefined && event.key === "Enter" && event.shiftKey === false) {
						this._on_enter_callback(e, event);
					} else if (this._on_escape_callback !== undefined && event.key === "Escape") {
						this._on_escape_callback(e, event);
					}
				}	
			}
			return this;
		}

		// On escape event.
		// Mainly used for input and textarea elements.
		// Can not be combined with "on_key_press()".
		on_escape(callback) {
			this._on_escape_callback = callback;
			if (this._on_keypress_set !== true) {
				this._on_keypress_set = true;
				const e = this;
				super.onkeypress = function(event) {
					if (this._on_enter_callback !== undefined && event.key === "Enter" && event.shiftKey === false) {
						this._on_enter_callback(e, event);
					} else if (this._on_escape_callback !== undefined && event.key === "Escape") {
						this._on_escape_callback(e, event);
					}
				}	
			}
			return this;
		}

		// On theme update.
		on_theme_update(callback) {
			if (callback == null) {
				return this._on_theme_updates;
			}	

			// Add the item to the theme object when not yet added.
			// So the user can also call `vweb.themes.apply_theme_update()` without using `this.themes()`.
			const found = vweb.themes.theme_elements.iterate((item) => {
				if (item.element === this) {
					return true;
				}
			})
			if (found !== true) {
				vweb.themes.theme_elements.push({
					element: this,
					is_empty_theme: true,
				});
			}

			// Set callback.
			if (Array.isArray(this._on_theme_updates)) {
				this._on_theme_updates.push(callback)
			} else {
				this._on_theme_updates = [callback];
			}
			return this;
		}
		remove_on_theme_update(callback) {
			if (Array.isArray(this._on_theme_updates)) {
				this._on_theme_updates = this._on_theme_updates.drop(callback);
			}
			return this;
		}
		remove_on_theme_updates() {
			if (Array.isArray(this._on_theme_updates)) {
				this._on_theme_updates = [];
			}
			return this;
		}

		// On render event.
		// Is called when the element is added to the body.
		on_render(callback) {
			if (callback == null) {
				return this._on_render_callbacks;
			}
			if (Array.isArray(this._on_render_callbacks)) {
				this._on_render_callbacks.push(callback);
			} else {
				this.rendered = false;
				this._on_render_callbacks = [callback];
				if (!this._observing_on_render) {
					this._observing_on_render = true;
					vweb.utils.on_render_observer.observe(this);
				}
			}
			return this;
		}
		remove_on_render(callback) {
			if (Array.isArray(this._on_render_callbacks)) {
				this._on_render_callbacks = this._on_render_callbacks.drop(callback);
				if (this._on_render_callbacks.length === 0) {
					vweb.utils.on_render_observer.unobserve(this);
					this._observing_on_render = false;
				}
			}
			return this;
		}
		remove_on_renders() {
			if (Array.isArray(this._on_render_callbacks)) {
				this._on_render_callbacks = [];
				vweb.utils.on_render_observer.unobserve(this);
				this._observing_on_render = false;
			}
			return this;
		}
		is_rendered() {
			return this.rendered;
		}

		// On load.
		// This event is executed when te entire page is fully loaded.
		// Register event callback from `vweb.events`.
		// @warning: This event will not be fired if you overwrite the `window.onload` callback.
		on_load(callback) {
			vweb.events.on("vweb.on_load", this, callback);
			return this;
		}
		remove_on_load(callback) {
			vweb.events.remove("vweb.on_load", this, callback);
			return this;
		}
		remove_on_loads() {
			vweb.events.remove("vweb.on_load", this);
			return this;
		}

		// On resize event.
		on_resize(callback) {
			if (callback == null) {
				return this._on_resize_callbacks;
			}
			if (Array.isArray(this._on_resize_callbacks)) {
				this._on_resize_callbacks.push(callback);
			} else {
				this._on_resize_callbacks = [callback];
				if (!this._observing_on_resize) {
					this._observing_on_resize = true;
					vweb.utils.on_resize_observer.observe(this);
				}
			}
			return this;
		}
		remove_on_resize(callback) {
			if (Array.isArray(this._on_resize_callbacks)) {
				this._on_resize_callbacks = this._on_resize_callbacks.drop(callback);
				if (this._on_resize_callbacks.length === 0) {
					vweb.utils.on_resize_observer.unobserve(this);
					this._observing_on_resize = false;
				}
			}
			return this;
		}
		remove_on_resizes(callback) {
			if (Array.isArray(this._on_resize_callbacks)) {
				this._on_resize_callbacks = [];
				vweb.utils.on_resize_observer.unobserve(this);
				this._observing_on_resize = false;
			}
			return this;
		}

		/*	@docs:
			@title: On resize rule
			@descr:
				Add an on resize rule event.
				The callbacks are only executed when the evaluation changes during a resize event.
			@note:
				This function add's a `on_resize` callback.
			@param:
				@name: evaluation
				@type: function
				@descr: The function to evaluate if the statement is true, the element node is passed as the first argument.
			@param:
				@name: on_true
				@type: function
				@descr: The on true callback if the statement is true, the element node is passed as the first argument.
			@param:
				@name: on_false
				@type: function
				@descr: The on false callback, the element node is passed as the first argument.
		 */
		on_resize_rule(evaluation, on_true, on_false) {
			if (this._on_resize_rule_evals === undefined) {
				this._on_resize_rule_evals = [];
			}
			const eval_index = this._on_resize_rule_evals.length;
			this._on_resize_rule_evals[eval_index] = null;
			this.on_resize(() => {
				const result = evaluation(this);
				if (result !== this._on_resize_rule_evals[eval_index]) {
					this._on_resize_rule_evals[eval_index] = result;
					if (result && on_true) {
						on_true(this);
					} else if (!result && on_false) {
						on_false(this);
					}
				}
			})
			return this;
		}

		/* 	@docs:
		 * 	@title: On shortcut
		 * 	@description: Create key shortcuts for the element.
		 * 	@parameter:
		 * 		@name: shortcuts
		 * 		@description: 
		 * 			The array with shortcuts.
		 * 			Each shortcut object may have the following attributes:
		 * 			```{
		 *				match: (event) => false 		// (optionally required) (precedence 1) a callback function to determine if a event matches.
		 * 				key: "a",                       // (optionally required) (precedence 2) the key to match, event keys are always in lowercase.
		 *              keys: [],                       // (optionally required) (precedence 3) an array with max two strings when `or` is `false`, or an array with unlimited strings when `or` is `true`, event keys are always in lowercase.
		 *              keycode: 0,                  	// (optionally required) (precedence 4) an array with max two strings when `or` is `false`, or an array with unlimited strings when `or` is `true`, event keys are always in lowercase.
		 *              keycodes: []                    // (optionally required) (precedence 5) an array with allowed keycodes, when `or` is `false` the shorcut will be matched when all the keycodes are matched after each other, and when `or` is `true` the shortcut will match when one of the keycodes is pressed.
		 *              or: false,                      // (optional) used to determine a "and" / "or" when the keys attribute is defined, `false` means the shorcut will match if one of the keys in the array was pressed. And `true` means the shorcut will be matched after the keys have been pressed after each other within the specified duration.
		 *              duration: null,                 // (optional) the duration in milliseconds that is allowed between the two keys when the keys attribute with `or` `false` is used, default value is `150`.
		 *              shift: false,                   // (optional) the shift modifier.
		 *              alt: false,                     // (optional) the alt modifier, allows alt or option for apple devices.
		 *              ctrl: false,                    // (optional) the control modifier, allows control or command for apple devices.
		 *              allow_other_modifiers: false,   // (optional) allow a shortcut match when there are other modifiers present in the event than the pre-defined modifiers.
		 * 				callback: () => {},             // (required).
		 *			}```
		 */
		on_shortcut(shortcuts = []) {

			// Check if a shortcut was matched.
			const is_match = (key, event, shortcut) => {   

				// Check by match handler.
				if (typeof shortcut.match === "function") {
					return shortcut.match(event, key, shortcut);
				}

				// Check single key.
				else if (shortcut.key !== undefined) {
					if (key !== shortcut.key) {
						return false;
					}
				}
				
				// Check multiple keys.
				else if (shortcut.keys !== undefined) {
					const keys = shortcut.keys;
					const or = shortcut.or === undefined ? true : shortcut.or;
					if (or) {
						let found = false;
						for (let i = 0; i < keys.length; i++) {
							if (keys[i] === key) {
								found = true;
								break;
							}
						}
						if (found === false) { return false; }
					} else {
						const duration = shortcut.duration || 150;
						if (
							this._on_shortcut_time === null ||
							Date.now() - this._on_shortcut_time > duration
						) {
							return false;
						}
						if (!(
							(this.on_shortcut_key === keys[0] && key === keys[1]) ||
							(this.on_shortcut_key === keys[1] && key === keys[0])
						)) {
							return false;
						}
					}
				}

				// Check keycode.
				else if (shortcut.keycode !== undefined) {
					if (event.keyCode !== shortcut.keycode) {
						return false;
					}
				}

				// Check keycodes.
				else if (shortcut.keycodes !== undefined) {
					const keys = shortcut.keycodes;
					const or = shortcut.or === undefined ? true : shortcut.or;
					if (or) {
						let found = false;
						for (let i = 0; i < keys.length; i++) {
							if (keys[i] === event.keyCode) {
								found = true;
								break;
							}
						}
						if (found === false) { return false; }
					} else {
						const duration = shortcut.duration || 150;
						if (
							this._on_shortcut_time === null ||
							Date.now() - this._on_shortcut_time > duration
						) {
							return false;
						}
						if (!(
							this.on_shortcut_keycode === keys[0] && event.keyCode === keys[1] ||
							this.on_shortcut_keycode === keys[1] && event.keyCode === keys[0]
						)) {
							return false;
						}
					}
				}

				// Error.
				else {
					console.error("At least one of the following shortcut attributes must be defined: [key, keys, keycode, keycodes].");
					return false;
				}

				// Check modifiers.
				const allow_other_modifiers = shortcut.allow_other_modifiers === undefined ? false : shortcut.allow_other_modifiers;
				const shift = shortcut.shift === undefined ? false : shortcut.shift;
				const alt = shortcut.alt === undefined ? false : shortcut.alt;
				const ctrl = shortcut.ctrl === undefined ? false : shortcut.ctrl;
				if (event.shiftKey !== shift && (shift || allow_other_modifiers === false)) {
					return false;
				}
				if (event.altKey !== alt && (alt || allow_other_modifiers === false)) {
					return false;
				}
				if ((event.ctrlKey || event.metaKey) !== ctrl && (ctrl || allow_other_modifiers === false)) {
					return false;
				}

				// Matched.
				return true;
			}

			// Set tab index so the content is always focusable.
			if (this.hasAttribute("tabindex") === false) {
				this.setAttribute("tabindex", "0");
				this.outline("none");
				this.border("none");
			}
			
			// Set key down handler.
			this.onkeydown = (event) => {

				// Convert to lowercase.
				const key = event.key.toLowerCase();

				// Iterate shortcuts.
				const matched = shortcuts.iterate((shortcut) => {
					if (is_match(key, event, shortcut)) {
						shortcut.callback(this, event);
						return true;
					}
				});

				// Set previous key when there was no match.
				if (matched !== true) {
					this.on_shortcut_time = Date.now();
					this.on_shortcut_key = event.key;
					this.on_shortcut_keycode = event.keyCode;
				}
			}
		}

		// Script to be run when a context menu is triggered.
		/*	@docs:
		 *	@title: On context menu
		 *	@description: 
		 *		Script to be run when a context menu is triggered.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: callback
		 *		@description: 
		 *			The parameter may either be a callback function, a ContextMenu object or an Array as the ContextMenu parameter.
		 *		@name: function, ContextMenu, array
		 *	@inherit: false
		 */ 
		on_context_menu(callback) {
			if (callback == null) {
				if (this._context_menu !== undefined) {
					return this._context_menu;
				} else {
					return this.oncontextmenu;
				}
			}
			if (callback instanceof ContextMenuElement || callback.element_type === "ContextMenu") {
				this._context_menu = callback;
				const _this_ = this;
				this.oncontextmenu = (event) => {
					this._context_menu.popup(event);
				};
			} else if (Array.isArray(callback)) {
				this._context_menu = callback;
				const _this_ = this;
				this.oncontextmenu = (event) => {
					ContextMenu(callback).popup(event);
				};
			} else {
				const _this_ = this;
				this.oncontextmenu = (event) => callback(_this_, event);
			}
			return this;
		}

		// On mouse enter.
		on_mouse_enter(callback) {
			if (callback == null) { return this._on_mouse_enter_callback; }
			this._on_mouse_enter_callback = callback;
			const e = this;
			this.addEventListener("mouseenter", (t) => callback(e, t))
			return this;
		}

		// On mouse leave.
		on_mouse_leave(callback) {
			if (callback == null) { return this._on_mouse_leave_callback; }
			this._on_mouse_leave_callback = callback;
			const e = this;
			this.addEventListener("mouseleave", (t) => callback(e, t))
			return this;
		}

		/*	@docs:
		 	@title: On mouse over and out
		 	@description: 
		 		Set callbacks for the on mouse over and mouse out events.
		 	@return: 
		 		Returns the `Element` object.
		 	@parameter:
		 		@name: mouse_over
		 		@description: The mouse over callback.
		 	@parameter:
		 		@name: mouse_out
		 		@description: The mouse out callback.
		 */ 
		on_mouse_over_out(mouse_over, mouse_out) {
			this.on_mouse_over(mouse_over);
			this.on_mouse_out(mouse_out);
			return this;
		}

		/*  docs:
		 *  @title: On gesture
		 *  @description: Create touch gesture events.
		 *  @parameter:
		 *      @name: gestures
		 *      @description:
		 *          The array with gesture objects.
		 *          A gesture object may have the following attributes:
		 *          ```{
		 *              direction: "left",
		 *              touches: 2,
		 *              callback: (element) => {
		 *                  
		 *              },
		 *          }```
		 *          Possible values for `direction` are `top`, `right`, `bottom` and `left`.
		 *          Possible values for `touches` are `1`, till `3`.
		 *  }
		 */
		// function on_gesture (element, gestures = []) {

		//     // Vars.
		//     let start_x = 0, end_x = 0;
		//     let start_y = 0, end_y = 0;
		//     let touches = 0;

		//     // Touch start event.
		//     const touch_start = (event) => {

		//         // Set start pos.
		//         start_x = event.touches[0].clientX;
		//         start_y = event.touches[0].clientY;
		//         touches = event.touches.length;

		//         console.log({start_x:start_x, start_y:start_y, touches:touches})

		//         // Add event listeners.
		//         document.addEventListener("touchmove", touch_move);
		//         document.addEventListener("touchend", touch_end);
		//     }

		//     // Touch move event.
		//     const touch_move = (event) => {

		//         // Set end pos.
		//         end_x = event.touches[0].clientX;
		//         end_y = event.touches[0].clientY;   
		//     }

		//     // Touch end event.
		//     const touch_end = () => {

		//         console.log({end_x:end_x, end_y:end_y})

		//         // Remove event listeners.
		//         document.removeEventListener("touchmove", touch_move);
		//         document.removeEventListener("touchend", touch_end);

		//         const gestureDistance = touchEndX - touchStartX;
		//         if (gestureDistance > 0) {
		//             // User swiped right
		//             console.log('Swipe right');
		//         } else if (gestureDistance < 0) {
		//             // User swiped left
		//             console.log('Swipe left');
		//         }
		//     }

		//     // Bind touch start event to element.
		//     // window.addEventListener("touchstart", touch_start)
		//     // element.ontouchstart = touch_start;
		//     element.addEventListener("touchstart", (event) => {
		//         console.log(event.pointerType)
		//     }, false)
		// }

		// ---------------------------------------------------------
		// Pseudo element styles.

		// Style the before object.
		// Returns style object of the pseudo-element.
		// before() {
		// 	const pseudo = getComputedStyle(this, '::before');
		// 	const e = new VElement();
		// 	e.element = pseudo;
		// 	return e;
		// }

		// Style the after object.
		// Returns style object of the pseudo-element.
		// after() {
		// 	const pseudo = getComputedStyle(this, '::after');
		// 	const e = new Element();
		// 	e.element = pseudo;
		// 	return e;
		// }

		// ---------------------------------------------------------
		// Other functions.

		// Get the children.
		// children() {
		// 	return this.children;
		// }

		// Get a child by index.
		// child(index) {
		// 	return this.children[index];
		// }

		// Get the first child.
		first_child() {
			return this.firstChild;
		}

		// Get the last child.
		last_child() {
			return this.lastChild;
		}

		// Iterate children.
		iterate(start, end, handler) {
			if (typeof start === "function") {
				handler = start;
				start = null;
			}
			if (start == null) {
				start = 0;
			}
			if (end == null) {
				end = this.children.length;
			}
			for (let i = start; i < end; i++) {    
				const res = handler(this.children[i], i);
				if (res != null) {
					return res;
				}
			}
			return null;
		};

		// Iterate child nodes.
		iterate_nodes(start, end, handler) {
			if (typeof start === "function") {
				handler = start;
				start = null;
			}
			if (start == null) {
				start = 0;
			}
			if (end == null) {
				end = this.childNodes.length;
			}
			for (let i = start; i < end; i++) {    
				const res = handler(this.childNodes[i], i);
				if (res != null) {
					return res;
				}
			}
			return null;
		};

		// Set the current element as the default.
		set_default(Type) {
			if (Type == null) {
				Type = Element;
			}
			Type.default_style = this.styles();
			return this;
		}

		// Assign a function or property.
		// You must use function syntax "function() {}" not "() => {}".
		assign(name, value) {
			this[name] = value;
			// This below does not always work somehow.
			// if (vweb.utils.is_func(value)) {
			// 	Element.prototype[name] = value;
			// } else {
			// 	Object.defineProperty(Element.prototype, name, { value });
			// }
			return this;
		}

		// Extend with functions or properties.
		// You must use function syntax "function() {}" not "() => {}".
		extend(obj) {
			for (let name in obj) {
				this.assign(name, obj[name]);
			}
			return this;
		}

		// Selec the contents of the object.
		select(overwrite = true) {
			if (super.select != undefined) {
				super.select();
				return this;
			}
			this.focus();
			const range = document.createRange();
			range.selectNodeContents(this);
			const selection = window.getSelection();
			if (overwrite) {
				selection.removeAllRanges();
			}
			selection.addRange(range);
			return this;
		}

		// Set focusable.
		focusable(value) {
			if (value == null) {
				return this.getAttribute("tabindex") !== "-1";
			} else if (value === true) {
				this.setAttribute('tabindex', '-1');
				this.style.outline = "none";
			} else {
				this.setAttribute('tabindex', '-1');
				this.style.outline = "none";
			}
			return this;
		}

		// Specifies an alternate text when the original element fails to display.
		/*	@docs:
		 *	@title: Alt
		 *	@description: 
		 *		Specifies an alternate text when the original element fails to display.
		 *		The equivalent of HTML attribute `alt`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		alt(value) {
			if (value == null) { return this.getAttribute("alt"); }
			this.setAttribute("alt", value)
			return this;
		}

		// Is scrollable.
		is_scrollable() {
			return this.scrollHeight > this.clientHeight || this.scrollWidth > this.clientWidth;
		}
		is_scrollable_x() {
			return this.scrollWidth > this.clientWidth;
		}
		is_scrollable_y() {
			return this.scrollHeight > this.clientHeight;
		}

		// Wait till the element and all it's children are fully rendered.
		// This should only be used in the `on_render` callback.
		// Since nodes appended after calling this function will not be checked.
		// @warning: Does not work with non vweb nodes.
		// @warning: Does not work currectly.
		async wait_till_children_rendered(timeout = 10000) {
			return new Promise((resolve, reject) => {

				// Vars.
				let elapsed = 0;
				let step = 25;
				let nodes = [];

				// Map all nodes.
				const map_nodes = (node) => {
					nodes.append(node);
					for (let i = 0; i < node.children.length; i++) {
						map_nodes(node.children[i]);
					}
				}
				map_nodes(this);
				console.log(nodes);
				
				// Wait.
				const wait = () => {
					const rendered = nodes.iterate(node => {
						if (!node._is_connected) {
							return false;
						}
						console.log(node._is_connected);
					})
					if (rendered !== false) {
						console.log("resolve", rendered);
						resolve();
					} else {
						if (elapsed > timeout) {
							return reject(new Error("Timeout error."));
						}
						elapsed += step;
						setTimeout(wait, step);
					}
				}
				wait();
			})
		}

		// ---------------------------------------------------------
		// Pseudo-element functions.


		/*	@docs:
			@title: Add pseudo element
			@descr: Add a pseudo element.
		 */
		pseudo(type, node) {

			// @note: The node type does not strictly have to be a PseudoElement.

			// Gen id.
			if (node.pseudo_id === undefined) {
				node.pseudo_id = "pseudo_" + String.random(24);
			}

			// Set content.
			if (node.style.content == null) {
				node.style.content = "";
			}

			// Add the current element to the pseudo's added to elements.
			if (node.added_to_elements === undefined) {
				node.added_to_elements = [];
			}
			const alread_added = node.added_to_elements.iterate((item) => {
				if (item.node === this && item.type === type) {
					return true;
				}
			})
			if (alread_added !== true) {
				node.added_to_elements.append({
					node: this,
					type: type,
				})
			}

			// Initialize cache object.
			if (this.pseudo_stylesheets === undefined) {
				this.pseudo_stylesheets = {};
			}

			// Add/edit stylesheet.
			const css = `.${node.pseudo_id}::${type}{${node.style.cssText};content:"";}`
			if (this.pseudo_stylesheets[node.pseudo_id] === undefined) {
				const style = document.createElement('style');
				style.type = 'text/css';
				document.head.appendChild(style); // append before insertRule
				style.sheet.insertRule(css, 0);
				this.pseudo_stylesheets[node.pseudo_id] = style;
			} else {
				const style = this.pseudo_stylesheets[node.pseudo_id];
				style.sheet.deleteRule(0);
				style.sheet.insertRule(css, 0);
			}

			// Add class.
			this.classList.add(node.pseudo_id);

			// Response.
			return this;
		}

		/*	@docs:
			@title: Remove pseudo element
			@descr: Remove a pseudo element by node.
		 */
		remove_pseudo(node) {
			if (node && node.pseudo_id) {
				this.classList.remove(node.pseudo_id);
			}
			this.pseudo_stylesheets[node.pseudo_id].remove();
			delete this.pseudo_stylesheets[node.pseudo_id];
			return this;
		}
		remove_pseudos() {
			this.classList.forEach(name => {
				if (name.startsWith("pseudo_")) {
					this.classList.remove(name);
				}
			})
			Object.values(this.pseudo_stylesheets).iterate(stylesheet => { stylesheet.remove(); })
			this.pseudo_stylesheets = {};
			return this;
		}

		/*	@docs:
			@title: Add pseudo hover
			@descr:
				Add a pseudo element on mouse hover.
				Does not work in combinatino with other mouse over events.
		 */
		pseudo_on_hover(type, node, set_defaults = true) {
			if (set_defaults) {
				node.position(0, 0, 0, 0);
				const border_radius = this.border_radius();
				if (border_radius) {
					node.border_radius(border_radius);
				}
	    		this.position("relative")
	    	}
			this.on_mouse_over(() => this.pseudo("after", node))
            this.on_mouse_out(() => this.remove_pseudo(node))
            return this;
		}

		// ---------------------------------------------------------
		// Parent functions.

		// Get or set the parent element.
		// Only assigned when this is a child element of a specific Element derived class, such as LoaderButton.
		parent(value) {
			if (value == null) {
				if (this._parent == null || this._parent === undefined) {
					return this.parentElement;
				}
				return this._parent;
			}
			this._parent = value;
			return this;
		}

		// Absolute parent used for custom elements that have multiple nested children to get the custom element itself.
		abs_parent(value) {
			if (value == null) {
				return this._abs_parent;
			}
			this._abs_parent = value;
			return this;
		}

		// Assign the current element to an attribute of the parent by calling this function.
		assign_to_parent_as(name) {
			this._assign_to_parent_as = name;
			return this;
		}

		// Get the offset from a node in relation to a parent node.
		// @deprecated doesnt work properly
		get_y_offset_from_parent(parent) {
			let offset = 0;
			let node = this;

		    // Get the bounding rect of the parent
		    const parentRect = parent.getBoundingClientRect();

		    // Loop up the DOM tree
		    while (node && node !== parent && node !== document.body) {
		        // Get the bounding rect of the current node
		        const nodeRect = node.getBoundingClientRect();
		        
		        // Calculate the offset relative to the parent
		        offset += nodeRect.top - parentRect.top;
		        
		        // Move to the parent element
		        node = node.parentElement;
		    }

		    // If we reached the specified parent, return the accumulated offset
		    if (node === parent) {
		        return offset;
		    }

		    // If the parent wasn't found, return null or undefined
		    return null;
		}

		// Absolute offset.
		absolute_y_offset() {
			let element = this;
		    let top = 0;
		    do {
		        top += element.offsetTop || 0;
		        element = element.offsetParent;
		    } while(element);

		    return top;
		}
		absolute_x_offset() {
			let element = this;
		    let left = 0;
		    do {
		        left += element.offsetLeft || 0;
		        element = element.offsetParent;
		    } while(element);

		    return left;
		}

		// Execute a function with this element as parameter and return the current object.
		exec(callback) {
			callback(this);
			return this;
		}

		// Check if an element is a direct child of this element.
		/* 	@docs:
		 * 	@nav: Frontend
		 *	@title: Is child
		 *	@desc: 
		 * 		Check if an element is a direct child of the element or the element itself.
		 *	@param:
		 *		@name: target
		 *		@desc: The target element to test.
		 *		@type: Node, Element
		 */
		is_child(target) {
			return vweb.utils.is_child(this, target);
		}

		// Check if an element is a nested child of this element.
		/* 	@docs:
		 * 	@nav: Frontend
		 *	@title: Is child
		 *	@desc: 
		 * 		Check if an element is a recursively nested child of the element or the element itself.
		 *	@param:
		 *		@name: target
		 *		@desc: The target element to test.
		 *		@type: Node, Element
		 *	@param:
		 *		@name: stop_node
		 *		@desc: A node at which to stop checking if target is a parent of the current element.
		 *		@type: Node, Element
		 */
		is_nested_child(target, stop_node = null) {
			return vweb.utils.is_nested_child(this, target, stop_node);
		}

		// ---------------------------------------------------------
		// Cast functions.
		
		// Cast to string.
		toString() {
			this.setAttribute("created_by_html", "true");
			return this.outerHTML;
		}

		// ---------------------------------------------------------
		// Attr Functions

		// Specifies that the element is read-only.
		/*	@docs:
		 *	@title: Readonly
		 *	@description: 
		 *		Specifies that the element is read-only.
		 *		The equivalent of HTML attribute `readonly`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		readonly(value) {
			if (value == null) { return super.readOnly; }
			if (!value) {
				super.removeAttribute("readOnly");
			} else {
				super.readOnly = value;
			}
			return this;
		}

		// Specifies that the target will be downloaded when a user clicks on the hyperlink.
		/*	@docs:
		 *	@title: Download
		 *	@description: 
		 *		Specifies that the target will be downloaded when a user clicks on the hyperlink.
		 *		The equivalent of HTML attribute `download`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		download(value) {
			if (value == null) { return super.download; }
			if (!value) {
				super.removeAttribute("download");
			} else {
				super.download = value;
			}
			return this;
		}

		// ---------------------------------------------------------
		// Automatically generated CSS functions. 
		// Reference: https://www.w3schools.com/cssref/index.php. 

		// Specifies an accent color for user-interface controls.
		/*	@docs:
		 *	@title: Accent color
		 *	@description: 
		 *		Specifies an accent color for user-interface controls.
		 *		The equivalent of CSS attribute `accentColor`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		accent_color(value) {
			if (value == null) { return this.style.accentColor; }
			this.style.accentColor = value;
			return this;
		}

		// Specifies the alignment between the lines inside a flexible container when the items do not use all available space.
		/*	@docs:
		 *	@title: Align content
		 *	@description: 
		 *		Specifies the alignment between the lines inside a flexible container when the items do not use all available space.
		 *		The equivalent of CSS attribute `alignContent`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		align_content(value) {
			if (value == null) { return this.style.alignContent; }
			this.style.alignContent = value;
			this.style.msAlignContent = value;
			this.style.webkitAlignContent = value;
			this.style.MozAlignContent = value;
			this.style.OAlignContent = value;
			return this;
		}

		// Specifies the alignment for items inside a flexible container.
		/*	@docs:
		 *	@title: Align items
		 *	@description: 
		 *		Specifies the alignment for items inside a flexible container.
		 *		The equivalent of CSS attribute `alignItems`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		align_items(value) {
			if (value == null) { return this.style.alignItems; }
			this.style.alignItems = value;
			this.style.msAlignItems = value;
			this.style.webkitAlignItems = value;
			this.style.MozAlignItems = value;
			this.style.OAlignItems = value;
			return this;
		}

		// Specifies the alignment for selected items inside a flexible container.
		/*	@docs:
		 *	@title: Align self
		 *	@description: 
		 *		Specifies the alignment for selected items inside a flexible container.
		 *		The equivalent of CSS attribute `alignSelf`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		align_self(value) {
			if (value == null) { return this.style.alignSelf; }
			this.style.alignSelf = value;
			this.style.msAlignSelf = value;
			this.style.webkitAlignSelf = value;
			this.style.MozAlignSelf = value;
			this.style.OAlignSelf = value;
			return this;
		}

		// Resets all properties (except unicode-bidi and direction).
		/*	@docs:
		 *	@title: All
		 *	@description: 
		 *		Resets all properties (except unicode-bidi and direction).
		 *		The equivalent of CSS attribute `all`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		all(value) {
			if (value == null) { return this.style.all; }
			this.style.all = value;
			return this;
		}

		// A shorthand property for all the animation properties.
		/*	@docs:
		 *	@title: Animation
		 *	@description: 
		 *		A shorthand property for all the animation properties.
		 *		The equivalent of CSS attribute `animation`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		animation(value) {
			if (value == null) { return this.style.animation; }
			this.style.animation = value;
			this.style.msAnimation = value;
			this.style.webkitAnimation = value;
			this.style.MozAnimation = value;
			this.style.OAnimation = value;
			return this;
		}

		// Specifies a delay for the start of an animation.
		/*	@docs:
		 *	@title: Animation delay
		 *	@description: 
		 *		Specifies a delay for the start of an animation.
		 *		The equivalent of CSS attribute `animationDelay`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		animation_delay(value) {
			if (value == null) { return this.style.animationDelay; }
			this.style.animationDelay = value;
			this.style.msAnimationDelay = value;
			this.style.webkitAnimationDelay = value;
			this.style.MozAnimationDelay = value;
			this.style.OAnimationDelay = value;
			return this;
		}

		// Specifies whether an animation should be played forwards, backwards or in alternate cycles.
		/*	@docs:
		 *	@title: Animation direction
		 *	@description: 
		 *		Specifies whether an animation should be played forwards, backwards or in alternate cycles.
		 *		The equivalent of CSS attribute `animationDirection`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		animation_direction(value) {
			if (value == null) { return this.style.animationDirection; }
			this.style.animationDirection = value;
			this.style.msAnimationDirection = value;
			this.style.webkitAnimationDirection = value;
			this.style.MozAnimationDirection = value;
			this.style.OAnimationDirection = value;
			return this;
		}

		// Specifies how long an animation should take to complete one cycle.
		/*	@docs:
		 *	@title: Animation duration
		 *	@description: 
		 *		Specifies how long an animation should take to complete one cycle.
		 *		The equivalent of CSS attribute `animationDuration`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		animation_duration(value) {
			if (value == null) { return this.style.animationDuration; }
			this.style.animationDuration = value;
			this.style.msAnimationDuration = value;
			this.style.webkitAnimationDuration = value;
			this.style.MozAnimationDuration = value;
			this.style.OAnimationDuration = value;
			return this;
		}

		// Specifies a style for the element when the animation is not playing (before it starts, after it ends, or both).
		/*	@docs:
		 *	@title: Animation fill mode
		 *	@description: 
		 *		Specifies a style for the element when the animation is not playing (before it starts, after it ends, or both).
		 *		The equivalent of CSS attribute `animationFillMode`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		animation_fill_mode(value) {
			if (value == null) { return this.style.animationFillMode; }
			this.style.animationFillMode = value;
			this.style.msAnimationFillMode = value;
			this.style.webkitAnimationFillMode = value;
			this.style.MozAnimationFillMode = value;
			this.style.OAnimationFillMode = value;
			return this;
		}

		// Specifies the number of times an animation should be played.
		/*	@docs:
		 *	@title: Animation iteration count
		 *	@description: 
		 *		Specifies the number of times an animation should be played.
		 *		The equivalent of CSS attribute `animationIterationCount`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		animation_iteration_count(value) {
			if (value == null) { return this.style.animationIterationCount; }
			this.style.animationIterationCount = value;
			this.style.msAnimationIterationCount = value;
			this.style.webkitAnimationIterationCount = value;
			this.style.MozAnimationIterationCount = value;
			this.style.OAnimationIterationCount = value;
			return this;
		}

		// Specifies a name for the @keyframes animation.
		/*	@docs:
		 *	@title: Animation name
		 *	@description: 
		 *		Specifies a name for the \@keyframes animation.
		 *		The equivalent of CSS attribute `animationName`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		animation_name(value) {
			if (value == null) { return this.style.animationName; }
			this.style.animationName = value;
			this.style.msAnimationName = value;
			this.style.webkitAnimationName = value;
			this.style.MozAnimationName = value;
			this.style.OAnimationName = value;
			return this;
		}

		// Specifies whether the animation is running or paused.
		/*	@docs:
		 *	@title: Animation play state
		 *	@description: 
		 *		Specifies whether the animation is running or paused.
		 *		The equivalent of CSS attribute `animationPlayState`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		animation_play_state(value) {
			if (value == null) { return this.style.animationPlayState; }
			this.style.animationPlayState = value;
			this.style.msAnimationPlayState = value;
			this.style.webkitAnimationPlayState = value;
			this.style.MozAnimationPlayState = value;
			this.style.OAnimationPlayState = value;
			return this;
		}

		// Specifies the speed curve of an animation.
		/*	@docs:
		 *	@title: Animation timing function
		 *	@description: 
		 *		Specifies the speed curve of an animation.
		 *		The equivalent of CSS attribute `animationTimingFunction`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		animation_timing_function(value) {
			if (value == null) { return this.style.animationTimingFunction; }
			this.style.animationTimingFunction = value;
			this.style.msAnimationTimingFunction = value;
			this.style.webkitAnimationTimingFunction = value;
			this.style.MozAnimationTimingFunction = value;
			this.style.OAnimationTimingFunction = value;
			return this;
		}

		// Specifies preferred aspect ratio of an element.
		/*	@docs:
		 *	@title: Aspect ratio
		 *	@description: 
		 *		Specifies preferred aspect ratio of an element.
		 *		The equivalent of CSS attribute `aspectRatio`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		aspect_ratio(value) {
			if (value == null) { return this.style.aspectRatio; }
			this.style.aspectRatio = value;
			return this;
		}

		// Defines a graphical effect to the area behind an element.
		/*	@docs:
		 *	@title: Backdrop filter
		 *	@description: 
		 *		Defines a graphical effect to the area behind an element.
		 *		The equivalent of CSS attribute `backdropFilter`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		backdrop_filter(value) {
			if (value == null) { return this.style.backdropFilter; }
			this.style.backdropFilter = value;
			this.style.msBackdropFilter = value;
			this.style.webkitBackdropFilter = value;
			this.style.MozBackdropFilter = value;
			this.style.OBackdropFilter = value;
			return this;
		}

		// Defines whether or not the back face of an element should be visible when facing the user.
		/*	@docs:
		 *	@title: Backface visibility
		 *	@description: 
		 *		Defines whether or not the back face of an element should be visible when facing the user.
		 *		The equivalent of CSS attribute `backfaceVisibility`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		backface_visibility(value) {
			if (value == null) { return this.style.backfaceVisibility; }
			this.style.backfaceVisibility = value;
			this.style.msBackfaceVisibility = value;
			this.style.webkitBackfaceVisibility = value;
			this.style.MozBackfaceVisibility = value;
			this.style.OBackfaceVisibility = value;
			return this;
		}

		// Sets whether a background image scrolls with the rest of the page, or is fixed.
		/*	@docs:
		 *	@title: Background attachment
		 *	@description: 
		 *		Sets whether a background image scrolls with the rest of the page, or is fixed.
		 *		The equivalent of CSS attribute `backgroundAttachment`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		background_attachment(value) {
			if (value == null) { return this.style.backgroundAttachment; }
			this.style.backgroundAttachment = value;
			return this;
		}

		// Specifies the blending mode of each background layer (color/image).
		/*	@docs:
		 *	@title: Background blend mode
		 *	@description: 
		 *		Specifies the blending mode of each background layer (color/image).
		 *		The equivalent of CSS attribute `backgroundBlendMode`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		background_blend_mode(value) {
			if (value == null) { return this.style.backgroundBlendMode; }
			this.style.backgroundBlendMode = value;
			return this;
		}

		// Defines how far the background (color or image) should extend within an element.
		/*	@docs:
		 *	@title: Background clip
		 *	@description: 
		 *		Defines how far the background (color or image) should extend within an element.
		 *		The equivalent of CSS attribute `backgroundClip`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		background_clip(value) {
			if (value == null) { return this.style.backgroundClip; }
			this.style.backgroundClip = value;
			this.style.msBackgroundClip = value;
			this.style.webkitBackgroundClip = value;
			this.style.MozBackgroundClip = value;
			this.style.OBackgroundClip = value;
			return this;
		}

		// Specifies the background color of an element.
		/*	@docs:
		 *	@title: Background color
		 *	@description: 
		 *		Specifies the background color of an element.
		 *		The equivalent of CSS attribute `backgroundColor`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		background_color(value) {
			if (value == null) { return this.style.backgroundColor; }
			this.style.backgroundColor = value;
			return this;
		}

		// Specifies one or more background images for an element.
		/*	@docs:
		 *	@title: Background image
		 *	@description: 
		 *		Specifies one or more background images for an element.
		 *		The equivalent of CSS attribute `backgroundImage`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		background_image(value) {
			if (value == null) { return this.style.backgroundImage; }
			this.style.backgroundImage = value;
			return this;
		}

		// Specifies the origin position of a background image.
		/*	@docs:
		 *	@title: Background origin
		 *	@description: 
		 *		Specifies the origin position of a background image.
		 *		The equivalent of CSS attribute `backgroundOrigin`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		background_origin(value) {
			if (value == null) { return this.style.backgroundOrigin; }
			this.style.backgroundOrigin = value;
			this.style.msBackgroundOrigin = value;
			this.style.webkitBackgroundOrigin = value;
			this.style.MozBackgroundOrigin = value;
			this.style.OBackgroundOrigin = value;
			return this;
		}

		// Specifies the position of a background image.
		/*	@docs:
		 *	@title: Background position
		 *	@description: 
		 *		Specifies the position of a background image.
		 *		The equivalent of CSS attribute `backgroundPosition`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		background_position(value) {
			if (value == null) { return this.style.backgroundPosition; }
			this.style.backgroundPosition = value;
			return this;
		}

		// Specifies the position of a background image on x-axis.
		/*	@docs:
		 *	@title: Background position x
		 *	@description: 
		 *		Specifies the position of a background image on x-axis.
		 *		The equivalent of CSS attribute `backgroundPositionX`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		background_position_x(value) {
			if (value == null) { return this.style.backgroundPositionX; }
			this.style.backgroundPositionX = value;
			return this;
		}

		// Specifies the position of a background image on y-axis.
		/*	@docs:
		 *	@title: Background position y
		 *	@description: 
		 *		Specifies the position of a background image on y-axis.
		 *		The equivalent of CSS attribute `backgroundPositionY`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		background_position_y(value) {
			if (value == null) { return this.style.backgroundPositionY; }
			this.style.backgroundPositionY = value;
			return this;
		}

		// Sets if/how a background image will be repeated.
		/*	@docs:
		 *	@title: Background repeat
		 *	@description: 
		 *		Sets if/how a background image will be repeated.
		 *		The equivalent of CSS attribute `backgroundRepeat`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		background_repeat(value) {
			if (value == null) { return this.style.backgroundRepeat; }
			this.style.backgroundRepeat = value;
			return this;
		}

		// Specifies the size of the background images.
		/*	@docs:
		 *	@title: Background size
		 *	@description: 
		 *		Specifies the size of the background images.
		 *		The equivalent of CSS attribute `backgroundSize`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		background_size(value) {
			if (value == null) { return this.style.backgroundSize; }
			this.style.backgroundSize = this.pad_numeric(value);
			this.style.msBackgroundSize = this.pad_numeric(value);
			this.style.webkitBackgroundSize = this.pad_numeric(value);
			this.style.MozBackgroundSize = this.pad_numeric(value);
			this.style.OBackgroundSize = this.pad_numeric(value);
			return this;
		}

		// Specifies the size of an element in block direction.
		/*	@docs:
		 *	@title: Block size
		 *	@description: 
		 *		Specifies the size of an element in block direction.
		 *		The equivalent of CSS attribute `blockSize`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		block_size(value) {
			if (value == null) { return this.style.blockSize; }
			this.style.blockSize = this.pad_numeric(value);
			return this;
		}

		// A shorthand property for border-width, border-style and border-color.
		// border(value) {
		//     if (value == null) { return this.style.border; }
		//     this.style.border = value;
		//     return this;
		// }

		// A shorthand property for border-block-width, border-block-style and border-block-color.
		/*	@docs:
		 *	@title: Border block
		 *	@description: 
		 *		A shorthand property for border-block-width, border-block-style and border-block-color.
		 *		The equivalent of CSS attribute `borderBlock`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_block(value) {
			if (value == null) { return this.style.borderBlock; }
			this.style.borderBlock = value;
			return this;
		}

		// Sets the color of the borders at start and end in the block direction.
		/*	@docs:
		 *	@title: Border block color
		 *	@description: 
		 *		Sets the color of the borders at start and end in the block direction.
		 *		The equivalent of CSS attribute `borderBlockColor`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_block_color(value) {
			if (value == null) { return this.style.borderBlockColor; }
			this.style.borderBlockColor = value;
			return this;
		}

		// Sets the color of the border at the end in the block direction.
		/*	@docs:
		 *	@title: Border block end color
		 *	@description: 
		 *		Sets the color of the border at the end in the block direction.
		 *		The equivalent of CSS attribute `borderBlockEndColor`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_block_end_color(value) {
			if (value == null) { return this.style.borderBlockEndColor; }
			this.style.borderBlockEndColor = value;
			return this;
		}

		// Sets the style of the border at the end in the block direction.
		/*	@docs:
		 *	@title: Border block end style
		 *	@description: 
		 *		Sets the style of the border at the end in the block direction.
		 *		The equivalent of CSS attribute `borderBlockEndStyle`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_block_end_style(value) {
			if (value == null) { return this.style.borderBlockEndStyle; }
			this.style.borderBlockEndStyle = value;
			return this;
		}

		// Sets the width of the border at the end in the block direction.
		/*	@docs:
		 *	@title: Border block end width
		 *	@description: 
		 *		Sets the width of the border at the end in the block direction.
		 *		The equivalent of CSS attribute `borderBlockEndWidth`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_block_end_width(value) {
			if (value == null) { return this.style.borderBlockEndWidth; }
			this.style.borderBlockEndWidth = this.pad_numeric(value);
			return this;
		}

		// Sets the color of the border at the start in the block direction.
		/*	@docs:
		 *	@title: Border block start color
		 *	@description: 
		 *		Sets the color of the border at the start in the block direction.
		 *		The equivalent of CSS attribute `borderBlockStartColor`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_block_start_color(value) {
			if (value == null) { return this.style.borderBlockStartColor; }
			this.style.borderBlockStartColor = value;
			return this;
		}

		// Sets the style of the border at the start in the block direction.
		/*	@docs:
		 *	@title: Border block start style
		 *	@description: 
		 *		Sets the style of the border at the start in the block direction.
		 *		The equivalent of CSS attribute `borderBlockStartStyle`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_block_start_style(value) {
			if (value == null) { return this.style.borderBlockStartStyle; }
			this.style.borderBlockStartStyle = value;
			return this;
		}

		// Sets the width of the border at the start in the block direction.
		/*	@docs:
		 *	@title: Border block start width
		 *	@description: 
		 *		Sets the width of the border at the start in the block direction.
		 *		The equivalent of CSS attribute `borderBlockStartWidth`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_block_start_width(value) {
			if (value == null) { return this.style.borderBlockStartWidth; }
			this.style.borderBlockStartWidth = this.pad_numeric(value);
			return this;
		}

		// Sets the style of the borders at start and end in the block direction.
		/*	@docs:
		 *	@title: Border block style
		 *	@description: 
		 *		Sets the style of the borders at start and end in the block direction.
		 *		The equivalent of CSS attribute `borderBlockStyle`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_block_style(value) {
			if (value == null) { return this.style.borderBlockStyle; }
			this.style.borderBlockStyle = value;
			return this;
		}

		// Sets the width of the borders at start and end in the block direction.
		/*	@docs:
		 *	@title: Border block width
		 *	@description: 
		 *		Sets the width of the borders at start and end in the block direction.
		 *		The equivalent of CSS attribute `borderBlockWidth`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_block_width(value) {
			if (value == null) { return this.style.borderBlockWidth; }
			this.style.borderBlockWidth = this.pad_numeric(value);
			return this;
		}

		// Sets the color of the bottom border.
		/*	@docs:
		 *	@title: Border bottom color
		 *	@description: 
		 *		Sets the color of the bottom border.
		 *		The equivalent of CSS attribute `borderBottomColor`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_bottom_color(value) {
			if (value == null) { return this.style.borderBottomColor; }
			this.style.borderBottomColor = value;
			return this;
		}

		// Defines the radius of the border of the bottom-left corner.
		/*	@docs:
		 *	@title: Border bottom left radius
		 *	@description: 
		 *		Defines the radius of the border of the bottom-left corner.
		 *		The equivalent of CSS attribute `borderBottomLeftRadius`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_bottom_left_radius(value) {
			if (value == null) { return this.style.borderBottomLeftRadius; }
			this.style.borderBottomLeftRadius = this.pad_numeric(value);
			return this;
		}

		// Defines the radius of the border of the bottom-right corner.
		/*	@docs:
		 *	@title: Border bottom right radius
		 *	@description: 
		 *		Defines the radius of the border of the bottom-right corner.
		 *		The equivalent of CSS attribute `borderBottomRightRadius`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_bottom_right_radius(value) {
			if (value == null) { return this.style.borderBottomRightRadius; }
			this.style.borderBottomRightRadius = this.pad_numeric(value);
			return this;
		}

		// Sets the style of the bottom border.
		/*	@docs:
		 *	@title: Border bottom style
		 *	@description: 
		 *		Sets the style of the bottom border.
		 *		The equivalent of CSS attribute `borderBottomStyle`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_bottom_style(value) {
			if (value == null) { return this.style.borderBottomStyle; }
			this.style.borderBottomStyle = value;
			return this;
		}

		// Sets the width of the bottom border.
		/*	@docs:
		 *	@title: Border bottom width
		 *	@description: 
		 *		Sets the width of the bottom border.
		 *		The equivalent of CSS attribute `borderBottomWidth`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_bottom_width(value) {
			if (value == null) { return this.style.borderBottomWidth; }
			this.style.borderBottomWidth = this.pad_numeric(value);
			return this;
		}

		// Sets whether table borders should collapse into a single border or be separated.
		/*	@docs:
		 *	@title: Border collapse
		 *	@description: 
		 *		Sets whether table borders should collapse into a single border or be separated.
		 *		The equivalent of CSS attribute `borderCollapse`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_collapse(value) {
			if (value == null) { return this.style.borderCollapse; }
			this.style.borderCollapse = value;
			return this;
		}

		// Sets the color of the four borders.
		/*	@docs:
		 *	@title: Border color
		 *	@description: 
		 *		Sets the color of the four borders.
		 *		The equivalent of CSS attribute `borderColor`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_color(value) {
			if (value == null) { return this.style.borderColor; }
			this.style.borderColor = value;
			return this;
		}

		// A shorthand property for all the border-image properties.
		/*	@docs:
		 *	@title: Border image
		 *	@description: 
		 *		A shorthand property for all the border-image properties.
		 *		The equivalent of CSS attribute `borderImage`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_image(value) {
			if (value == null) { return this.style.borderImage; }
			this.style.borderImage = value;
			this.style.msBorderImage = value;
			this.style.webkitBorderImage = value;
			this.style.MozBorderImage = value;
			this.style.OBorderImage = value;
			return this;
		}

		// Specifies the amount by which the border image area extends beyond the border box.
		/*	@docs:
		 *	@title: Border image outset
		 *	@description: 
		 *		Specifies the amount by which the border image area extends beyond the border box.
		 *		The equivalent of CSS attribute `borderImageOutset`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_image_outset(value) {
			if (value == null) { return this.style.borderImageOutset; }
			this.style.borderImageOutset = value;
			return this;
		}

		// Specifies whether the border image should be repeated, rounded or stretched.
		/*	@docs:
		 *	@title: Border image repeat
		 *	@description: 
		 *		Specifies whether the border image should be repeated, rounded or stretched.
		 *		The equivalent of CSS attribute `borderImageRepeat`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_image_repeat(value) {
			if (value == null) { return this.style.borderImageRepeat; }
			this.style.borderImageRepeat = value;
			return this;
		}

		// Specifies how to slice the border image.
		/*	@docs:
		 *	@title: Border image slice
		 *	@description: 
		 *		Specifies how to slice the border image.
		 *		The equivalent of CSS attribute `borderImageSlice`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_image_slice(value) {
			if (value == null) { return this.style.borderImageSlice; }
			this.style.borderImageSlice = value;
			return this;
		}

		// Specifies the path to the image to be used as a border.
		/*	@docs:
		 *	@title: Border image source
		 *	@description: 
		 *		Specifies the path to the image to be used as a border.
		 *		The equivalent of CSS attribute `borderImageSource`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_image_source(value) {
			if (value == null) { return this.style.borderImageSource; }
			this.style.borderImageSource = value;
			return this;
		}

		// Specifies the width of the border image.
		/*	@docs:
		 *	@title: Border image width
		 *	@description: 
		 *		Specifies the width of the border image.
		 *		The equivalent of CSS attribute `borderImageWidth`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_image_width(value) {
			if (value == null) { return this.style.borderImageWidth; }
			this.style.borderImageWidth = this.pad_numeric(value);
			return this;
		}

		// A shorthand property for border-inline-width, border-inline-style and border-inline-color.
		/*	@docs:
		 *	@title: Border inline
		 *	@description: 
		 *		A shorthand property for border-inline-width, border-inline-style and border-inline-color.
		 *		The equivalent of CSS attribute `borderInline`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_inline(value) {
			if (value == null) { return this.style.borderInline; }
			this.style.borderInline = value;
			return this;
		}

		// Sets the color of the borders at start and end in the inline direction.
		/*	@docs:
		 *	@title: Border inline color
		 *	@description: 
		 *		Sets the color of the borders at start and end in the inline direction.
		 *		The equivalent of CSS attribute `borderInlineColor`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_inline_color(value) {
			if (value == null) { return this.style.borderInlineColor; }
			this.style.borderInlineColor = value;
			return this;
		}

		// Sets the color of the border at the end in the inline direction.
		/*	@docs:
		 *	@title: Border inline end color
		 *	@description: 
		 *		Sets the color of the border at the end in the inline direction.
		 *		The equivalent of CSS attribute `borderInlineEndColor`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_inline_end_color(value) {
			if (value == null) { return this.style.borderInlineEndColor; }
			this.style.borderInlineEndColor = value;
			return this;
		}

		// Sets the style of the border at the end in the inline direction.
		/*	@docs:
		 *	@title: Border inline end style
		 *	@description: 
		 *		Sets the style of the border at the end in the inline direction.
		 *		The equivalent of CSS attribute `borderInlineEndStyle`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_inline_end_style(value) {
			if (value == null) { return this.style.borderInlineEndStyle; }
			this.style.borderInlineEndStyle = value;
			return this;
		}

		// Sets the width of the border at the end in the inline direction.
		/*	@docs:
		 *	@title: Border inline end width
		 *	@description: 
		 *		Sets the width of the border at the end in the inline direction.
		 *		The equivalent of CSS attribute `borderInlineEndWidth`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_inline_end_width(value) {
			if (value == null) { return this.style.borderInlineEndWidth; }
			this.style.borderInlineEndWidth = this.pad_numeric(value);
			return this;
		}

		// Sets the color of the border at the start in the inline direction.
		/*	@docs:
		 *	@title: Border inline start color
		 *	@description: 
		 *		Sets the color of the border at the start in the inline direction.
		 *		The equivalent of CSS attribute `borderInlineStartColor`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_inline_start_color(value) {
			if (value == null) { return this.style.borderInlineStartColor; }
			this.style.borderInlineStartColor = value;
			return this;
		}

		// Sets the style of the border at the start in the inline direction.
		/*	@docs:
		 *	@title: Border inline start style
		 *	@description: 
		 *		Sets the style of the border at the start in the inline direction.
		 *		The equivalent of CSS attribute `borderInlineStartStyle`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_inline_start_style(value) {
			if (value == null) { return this.style.borderInlineStartStyle; }
			this.style.borderInlineStartStyle = value;
			return this;
		}

		// Sets the width of the border at the start in the inline direction.
		/*	@docs:
		 *	@title: Border inline start width
		 *	@description: 
		 *		Sets the width of the border at the start in the inline direction.
		 *		The equivalent of CSS attribute `borderInlineStartWidth`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_inline_start_width(value) {
			if (value == null) { return this.style.borderInlineStartWidth; }
			this.style.borderInlineStartWidth = this.pad_numeric(value);
			return this;
		}

		// Sets the style of the borders at start and end in the inline direction.
		/*	@docs:
		 *	@title: Border inline style
		 *	@description: 
		 *		Sets the style of the borders at start and end in the inline direction.
		 *		The equivalent of CSS attribute `borderInlineStyle`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_inline_style(value) {
			if (value == null) { return this.style.borderInlineStyle; }
			this.style.borderInlineStyle = value;
			return this;
		}

		// Sets the width of the borders at start and end in the inline direction.
		/*	@docs:
		 *	@title: Border inline width
		 *	@description: 
		 *		Sets the width of the borders at start and end in the inline direction.
		 *		The equivalent of CSS attribute `borderInlineWidth`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_inline_width(value) {
			if (value == null) { return this.style.borderInlineWidth; }
			this.style.borderInlineWidth = this.pad_numeric(value);
			return this;
		}

		// Sets the color of the left border.
		/*	@docs:
		 *	@title: Border left color
		 *	@description: 
		 *		Sets the color of the left border.
		 *		The equivalent of CSS attribute `borderLeftColor`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_left_color(value) {
			if (value == null) { return this.style.borderLeftColor; }
			this.style.borderLeftColor = value;
			return this;
		}

		// Sets the style of the left border.
		/*	@docs:
		 *	@title: Border left style
		 *	@description: 
		 *		Sets the style of the left border.
		 *		The equivalent of CSS attribute `borderLeftStyle`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_left_style(value) {
			if (value == null) { return this.style.borderLeftStyle; }
			this.style.borderLeftStyle = value;
			return this;
		}

		// Sets the width of the left border.
		/*	@docs:
		 *	@title: Border left width
		 *	@description: 
		 *		Sets the width of the left border.
		 *		The equivalent of CSS attribute `borderLeftWidth`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_left_width(value) {
			if (value == null) { return this.style.borderLeftWidth; }
			this.style.borderLeftWidth = this.pad_numeric(value);
			return this;
		}

		// A shorthand property for the four border-radius properties.
		/*	@docs:
		 *	@title: Border radius
		 *	@description: 
		 *		A shorthand property for the four border-radius properties.
		 *		The equivalent of CSS attribute `borderRadius`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_radius(value) {
			if (value == null) { return this.style.borderRadius; }
			this.style.borderRadius = this.pad_numeric(value);
			this.style.msBorderRadius = this.pad_numeric(value);
			this.style.webkitBorderRadius = this.pad_numeric(value);
			this.style.MozBorderRadius = this.pad_numeric(value);
			this.style.OBorderRadius = this.pad_numeric(value);
			return this;
		}

		// Sets the color of the right border.
		/*	@docs:
		 *	@title: Border right color
		 *	@description: 
		 *		Sets the color of the right border.
		 *		The equivalent of CSS attribute `borderRightColor`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_right_color(value) {
			if (value == null) { return this.style.borderRightColor; }
			this.style.borderRightColor = value;
			return this;
		}

		// Sets the style of the right border.
		/*	@docs:
		 *	@title: Border right style
		 *	@description: 
		 *		Sets the style of the right border.
		 *		The equivalent of CSS attribute `borderRightStyle`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_right_style(value) {
			if (value == null) { return this.style.borderRightStyle; }
			this.style.borderRightStyle = value;
			return this;
		}

		// Sets the width of the right border.
		/*	@docs:
		 *	@title: Border right width
		 *	@description: 
		 *		Sets the width of the right border.
		 *		The equivalent of CSS attribute `borderRightWidth`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_right_width(value) {
			if (value == null) { return this.style.borderRightWidth; }
			this.style.borderRightWidth = this.pad_numeric(value);
			return this;
		}

		// Sets the distance between the borders of adjacent cells.
		/*	@docs:
		 *	@title: Border spacing
		 *	@description: 
		 *		Sets the distance between the borders of adjacent cells.
		 *		The equivalent of CSS attribute `borderSpacing`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_spacing(value) {
			if (value == null) { return this.style.borderSpacing; }
			this.style.borderSpacing = value;
			return this;
		}

		// Sets the style of the four borders.
		/*	@docs:
		 *	@title: Border style
		 *	@description: 
		 *		Sets the style of the four borders.
		 *		The equivalent of CSS attribute `borderStyle`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_style(value) {
			if (value == null) { return this.style.borderStyle; }
			this.style.borderStyle = value;
			return this;
		}

		// Sets the color of the top border.
		/*	@docs:
		 *	@title: Border top color
		 *	@description: 
		 *		Sets the color of the top border.
		 *		The equivalent of CSS attribute `borderTopColor`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_top_color(value) {
			if (value == null) { return this.style.borderTopColor; }
			this.style.borderTopColor = value;
			return this;
		}

		// Defines the radius of the border of the top-left corner.
		/*	@docs:
		 *	@title: Border top left radius
		 *	@description: 
		 *		Defines the radius of the border of the top-left corner.
		 *		The equivalent of CSS attribute `borderTopLeftRadius`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_top_left_radius(value) {
			if (value == null) { return this.style.borderTopLeftRadius; }
			this.style.borderTopLeftRadius = this.pad_numeric(value);
			return this;
		}

		// Defines the radius of the border of the top-right corner.
		/*	@docs:
		 *	@title: Border top right radius
		 *	@description: 
		 *		Defines the radius of the border of the top-right corner.
		 *		The equivalent of CSS attribute `borderTopRightRadius`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_top_right_radius(value) {
			if (value == null) { return this.style.borderTopRightRadius; }
			this.style.borderTopRightRadius = this.pad_numeric(value);
			return this;
		}

		// Sets the style of the top border.
		/*	@docs:
		 *	@title: Border top style
		 *	@description: 
		 *		Sets the style of the top border.
		 *		The equivalent of CSS attribute `borderTopStyle`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_top_style(value) {
			if (value == null) { return this.style.borderTopStyle; }
			this.style.borderTopStyle = value;
			return this;
		}

		// Sets the width of the top border.
		/*	@docs:
		 *	@title: Border top width
		 *	@description: 
		 *		Sets the width of the top border.
		 *		The equivalent of CSS attribute `borderTopWidth`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_top_width(value) {
			if (value == null) { return this.style.borderTopWidth; }
			this.style.borderTopWidth = this.pad_numeric(value);
			return this;
		}

		// Sets the width of the four borders.
		/*	@docs:
		 *	@title: Border width
		 *	@description: 
		 *		Sets the width of the four borders.
		 *		The equivalent of CSS attribute `borderWidth`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		border_width(value) {
			if (value == null) { return this.style.borderWidth; }
			this.style.borderWidth = this.pad_numeric(value);
			return this;
		}

		// Sets the elements position, from the bottom of its parent element.
		/*	@docs:
		 *	@title: Bottom
		 *	@description: 
		 *		Sets the elements position, from the bottom of its parent element.
		 *		The equivalent of CSS attribute `bottom`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		bottom(value) {
			if (value == null) { return this.style.bottom; }
			this.style.bottom = this.pad_numeric(value);
			return this;
		}

		// Sets the behavior of the background and border of an element at page-break, or, for in-line elements, at line-break.
		/*	@docs:
		 *	@title: Box decoration break
		 *	@description: 
		 *		Sets the behavior of the background and border of an element at page-break, or, for in-line elements, at line-break.
		 *		The equivalent of CSS attribute `boxDecorationBreak`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		box_decoration_break(value) {
			if (value == null) { return this.style.boxDecorationBreak; }
			this.style.boxDecorationBreak = value;
			return this;
		}

		// The box-reflect property is used to create a reflection of an element.
		/*	@docs:
		 *	@title: Box reflect
		 *	@description: 
		 *		The box-reflect property is used to create a reflection of an element.
		 *		The equivalent of CSS attribute `boxReflect`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		box_reflect(value) {
			if (value == null) { return this.style.boxReflect; }
			this.style.boxReflect = value;
			return this;
		}

		// Attaches one or more shadows to an element.
		/*	@docs:
		 *	@title: Box shadow
		 *	@description: 
		 *		Attaches one or more shadows to an element.
		 *		The equivalent of CSS attribute `boxShadow`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		box_shadow(value) {
			if (value == null) { return this.style.boxShadow; }
			this.style.boxShadow = value;
			this.style.msBoxShadow = value;
			this.style.webkitBoxShadow = value;
			this.style.MozBoxShadow = value;
			this.style.OBoxShadow = value;
			return this;
		}

		// Defines how the width and height of an element are calculated: should they include padding and borders, or not.
		/*	@docs:
		 *	@title: Box sizing
		 *	@description: 
		 *		Defines how the width and height of an element are calculated: should they include padding and borders, or not.
		 *		The equivalent of CSS attribute `boxSizing`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		box_sizing(value) {
			if (value == null) { return this.style.boxSizing; }
			this.style.boxSizing = value;
			this.style.msBoxSizing = value;
			this.style.webkitBoxSizing = value;
			this.style.MozBoxSizing = value;
			this.style.OBoxSizing = value;
			return this;
		}

		// Specifies whether or not a page-, column-, or region-break should occur after the specified element.
		/*	@docs:
		 *	@title: Break after
		 *	@description: 
		 *		Specifies whether or not a page-, column-, or region-break should occur after the specified element.
		 *		The equivalent of CSS attribute `breakAfter`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		break_after(value) {
			if (value == null) { return this.style.breakAfter; }
			this.style.breakAfter = value;
			return this;
		}

		// Specifies whether or not a page-, column-, or region-break should occur before the specified element.
		/*	@docs:
		 *	@title: Break before
		 *	@description: 
		 *		Specifies whether or not a page-, column-, or region-break should occur before the specified element.
		 *		The equivalent of CSS attribute `breakBefore`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		break_before(value) {
			if (value == null) { return this.style.breakBefore; }
			this.style.breakBefore = value;
			return this;
		}

		// Specifies whether or not a page-, column-, or region-break should occur inside the specified element.
		/*	@docs:
		 *	@title: Break inside
		 *	@description: 
		 *		Specifies whether or not a page-, column-, or region-break should occur inside the specified element.
		 *		The equivalent of CSS attribute `breakInside`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		break_inside(value) {
			if (value == null) { return this.style.breakInside; }
			this.style.breakInside = value;
			return this;
		}

		// Specifies the placement of a table caption.
		/*	@docs:
		 *	@title: Caption side
		 *	@description: 
		 *		Specifies the placement of a table caption.
		 *		The equivalent of CSS attribute `captionSide`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		caption_side(value) {
			if (value == null) { return this.style.captionSide; }
			this.style.captionSide = value;
			return this;
		}

		// Specifies the color of the cursor (caret) in inputs, textareas, or any element that is editable.
		/*	@docs:
		 *	@title: Caret color
		 *	@description: 
		 *		Specifies the color of the cursor (caret) in inputs, textareas, or any element that is editable.
		 *		The equivalent of CSS attribute `caretColor`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		caret_color(value) {
			if (value == null) { return this.style.caretColor; }
			this.style.caretColor = value;
			return this;
		}

		// Specifies what should happen with the element that is next to a floating element.
		/*	@docs:
		 *	@title: Clear
		 *	@description: 
		 *		Specifies what should happen with the element that is next to a floating element.
		 *		The equivalent of CSS attribute `clear`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		clear(value) {
			if (value == null) { return this.style.clear; }
			this.style.clear = value;
			return this;
		}

		// Clips an absolutely positioned element.
		/*	@docs:
		 *	@title: Clip
		 *	@description: 
		 *		Clips an absolutely positioned element.
		 *		The equivalent of CSS attribute `clip`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		clip(value) {
			if (value == null) { return this.style.clip; }
			this.style.clip = value;
			return this;
		}

		// Sets the color of text.
		// color(value) {
		//     if (value == null) { return this.style.color; }
		//     this.style.color = value;
		//     return this;
		// }

		// Specifies the number of columns an element should be divided into.
		/*	@docs:
		 *	@title: Column count
		 *	@description: 
		 *		Specifies the number of columns an element should be divided into.
		 *		The equivalent of CSS attribute `columnCount`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		column_count(value) {
			if (value == null) { return this.style.columnCount; }
			this.style.columnCount = value;
			this.style.msColumnCount = value;
			this.style.webkitColumnCount = value;
			this.style.MozColumnCount = value;
			this.style.OColumnCount = value;
			return this;
		}

		// Specifies how to fill columns, balanced or not.
		/*	@docs:
		 *	@title: Column fill
		 *	@description: 
		 *		Specifies how to fill columns, balanced or not.
		 *		The equivalent of CSS attribute `columnFill`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		column_fill(value) {
			if (value == null) { return this.style.columnFill; }
			this.style.columnFill = value;
			return this;
		}

		// Specifies the gap between the columns.
		/*	@docs:
		 *	@title: Column gap
		 *	@description: 
		 *		Specifies the gap between the columns.
		 *		The equivalent of CSS attribute `columnGap`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		column_gap(value) {
			if (value == null) { return this.style.columnGap; }
			this.style.columnGap = value;
			this.style.msColumnGap = value;
			this.style.webkitColumnGap = value;
			this.style.MozColumnGap = value;
			this.style.OColumnGap = value;
			return this;
		}

		// A shorthand property for all the column-rule properties.
		/*	@docs:
		 *	@title: Column rule
		 *	@description: 
		 *		A shorthand property for all the column-rule properties.
		 *		The equivalent of CSS attribute `columnRule`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		column_rule(value) {
			if (value == null) { return this.style.columnRule; }
			this.style.columnRule = value;
			this.style.msColumnRule = value;
			this.style.webkitColumnRule = value;
			this.style.MozColumnRule = value;
			this.style.OColumnRule = value;
			return this;
		}

		// Specifies the color of the rule between columns.
		/*	@docs:
		 *	@title: Column rule color
		 *	@description: 
		 *		Specifies the color of the rule between columns.
		 *		The equivalent of CSS attribute `columnRuleColor`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		column_rule_color(value) {
			if (value == null) { return this.style.columnRuleColor; }
			this.style.columnRuleColor = value;
			this.style.msColumnRuleColor = value;
			this.style.webkitColumnRuleColor = value;
			this.style.MozColumnRuleColor = value;
			this.style.OColumnRuleColor = value;
			return this;
		}

		// Specifies the style of the rule between columns.
		/*	@docs:
		 *	@title: Column rule style
		 *	@description: 
		 *		Specifies the style of the rule between columns.
		 *		The equivalent of CSS attribute `columnRuleStyle`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		column_rule_style(value) {
			if (value == null) { return this.style.columnRuleStyle; }
			this.style.columnRuleStyle = value;
			this.style.msColumnRuleStyle = value;
			this.style.webkitColumnRuleStyle = value;
			this.style.MozColumnRuleStyle = value;
			this.style.OColumnRuleStyle = value;
			return this;
		}

		// Specifies the width of the rule between columns.
		/*	@docs:
		 *	@title: Column rule width
		 *	@description: 
		 *		Specifies the width of the rule between columns.
		 *		The equivalent of CSS attribute `columnRuleWidth`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		column_rule_width(value) {
			if (value == null) { return this.style.columnRuleWidth; }
			this.style.columnRuleWidth = this.pad_numeric(value);
			this.style.msColumnRuleWidth = this.pad_numeric(value);
			this.style.webkitColumnRuleWidth = this.pad_numeric(value);
			this.style.MozColumnRuleWidth = this.pad_numeric(value);
			this.style.OColumnRuleWidth = this.pad_numeric(value);
			return this;
		}

		// Specifies how many columns an element should span across.
		/*	@docs:
		 *	@title: Column span
		 *	@description: 
		 *		Specifies how many columns an element should span across.
		 *		The equivalent of CSS attribute `columnSpan`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		column_span(value) {
			if (value == null) { return this.style.columnSpan; }
			this.style.columnSpan = value;
			return this;
		}

		// Specifies the column width.
		/*	@docs:
		 *	@title: Column width
		 *	@description: 
		 *		Specifies the column width.
		 *		The equivalent of CSS attribute `columnWidth`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		column_width(value) {
			if (value == null) { return this.style.columnWidth; }
			this.style.columnWidth = this.pad_numeric(value);
			this.style.msColumnWidth = this.pad_numeric(value);
			this.style.webkitColumnWidth = this.pad_numeric(value);
			this.style.MozColumnWidth = this.pad_numeric(value);
			this.style.OColumnWidth = this.pad_numeric(value);
			return this;
		}

		// A shorthand property for column-width and column-count.
		/*	@docs:
		 *	@title: Columns
		 *	@description: 
		 *		A shorthand property for column-width and column-count.
		 *		The equivalent of CSS attribute `columns`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		columns(value) {
			if (value == null) { return this.style.columns; }
			this.style.columns = value;
			return this;
		}

		// Used with the :before and :after pseudo-elements, to insert generated content.
		/*	@docs:
		 *	@title: Content
		 *	@description: 
		 *		Used with the :before and :after pseudo-elements, to insert generated content.
		 *		The equivalent of CSS attribute `content`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		content(value) {
			if (value == null) { return this.style.content; }
			this.style.content = value;
			return this;
		}

		// Increases or decreases the value of one or more CSS counters.
		/*	@docs:
		 *	@title: Counter increment
		 *	@description: 
		 *		Increases or decreases the value of one or more CSS counters.
		 *		The equivalent of CSS attribute `counterIncrement`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		counter_increment(value) {
			if (value == null) { return this.style.counterIncrement; }
			this.style.counterIncrement = value;
			return this;
		}

		// Creates or resets one or more CSS counters.
		/*	@docs:
		 *	@title: Counter reset
		 *	@description: 
		 *		Creates or resets one or more CSS counters.
		 *		The equivalent of CSS attribute `counterReset`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		counter_reset(value) {
			if (value == null) { return this.style.counterReset; }
			this.style.counterReset = value;
			return this;
		}

		// Specifies the mouse cursor to be displayed when pointing over an element.
		/*	@docs:
		 *	@title: Cursor
		 *	@description: 
		 *		Specifies the mouse cursor to be displayed when pointing over an element.
		 *		The equivalent of CSS attribute `cursor`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		cursor(value) {
			if (value == null) { return this.style.cursor; }
			this.style.cursor = value;
			return this;
		}

		// Specifies the text direction/writing direction.
		/*	@docs:
		 *	@title: Direction
		 *	@description: 
		 *		Specifies the text direction/writing direction.
		 *		The equivalent of CSS attribute `direction`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		direction(value) {
			if (value == null) { return this.style.direction; }
			this.style.direction = value;
			return this;
		}

		// Specifies how a certain HTML element should be displayed.
		// display(value) {
		//     if (value == null) { return this.style.display; }
		//     this.style.display = value;
		//     return this;
		// }

		// Specifies whether or not to display borders and background on empty cells in a table.
		/*	@docs:
		 *	@title: Empty cells
		 *	@description: 
		 *		Specifies whether or not to display borders and background on empty cells in a table.
		 *		The equivalent of CSS attribute `emptyCells`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		empty_cells(value) {
			if (value == null) { return this.style.emptyCells; }
			this.style.emptyCells = value;
			return this;
		}

		// Defines effects (e.g. blurring or color shifting) on an element before the element is displayed.
		/*	@docs:
		 *	@title: Filter
		 *	@description: 
		 *		Defines effects (e.g. blurring or color shifting) on an element before the element is displayed.
		 *		The equivalent of CSS attribute `filter`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		filter(value) {
			if (value == null) { return this.style.filter; }
			this.style.filter = value;
			this.style.msFilter = value;
			this.style.webkitFilter = value;
			this.style.MozFilter = value;
			this.style.OFilter = value;
			return this;
		}

		// A shorthand property for the flex-grow, flex-shrink, and the flex-basis properties.
		/*	@docs:
		 *	@title: Flex
		 *	@description: 
		 *		A shorthand property for the flex-grow, flex-shrink, and the flex-basis properties.
		 *		The equivalent of CSS attribute `flex`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		flex(value) {
			if (value == null) { return this.style.flex; }
			this.style.flex = value;
			this.style.msFlex = value;
			this.style.webkitFlex = value;
			this.style.MozFlex = value;
			this.style.OFlex = value;
			return this;
		}

		// Specifies the initial length of a flexible item.
		/*	@docs:
		 *	@title: Flex basis
		 *	@description: 
		 *		Specifies the initial length of a flexible item.
		 *		The equivalent of CSS attribute `flexBasis`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		flex_basis(value) {
			if (value == null) { return this.style.flexBasis; }
			this.style.flexBasis = value;
			this.style.msFlexBasis = value;
			this.style.webkitFlexBasis = value;
			this.style.MozFlexBasis = value;
			this.style.OFlexBasis = value;
			return this;
		}

		// Specifies the direction of the flexible items.
		/*	@docs:
		 *	@title: Flex direction
		 *	@description: 
		 *		Specifies the direction of the flexible items.
		 *		The equivalent of CSS attribute `flexDirection`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		flex_direction(value) {
			if (value == null) { return this.style.flexDirection; }
			this.style.flexDirection = value;
			this.style.msFlexDirection = value;
			this.style.webkitFlexDirection = value;
			this.style.MozFlexDirection = value;
			this.style.OFlexDirection = value;
			return this;
		}

		// A shorthand property for the flex-direction and the flex-wrap properties.
		/*	@docs:
		 *	@title: Flex flow
		 *	@description: 
		 *		A shorthand property for the flex-direction and the flex-wrap properties.
		 *		The equivalent of CSS attribute `flexFlow`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		flex_flow(value) {
			if (value == null) { return this.style.flexFlow; }
			this.style.flexFlow = value;
			this.style.msFlexFlow = value;
			this.style.webkitFlexFlow = value;
			this.style.MozFlexFlow = value;
			this.style.OFlexFlow = value;
			return this;
		}

		// Specifies how much the item will grow relative to the rest.
		/*	@docs:
		 *	@title: Flex grow
		 *	@description: 
		 *		Specifies how much the item will grow relative to the rest.
		 *		The equivalent of CSS attribute `flexGrow`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		flex_grow(value) {
			if (value == null) { return this.style.flexGrow; }
			this.style.flexGrow = value;
			this.style.msFlexGrow = value;
			this.style.webkitFlexGrow = value;
			this.style.MozFlexGrow = value;
			this.style.OFlexGrow = value;
			return this;
		}

		// Specifies how the item will shrink relative to the rest.
		/*	@docs:
		 *	@title: Flex shrink
		 *	@description: 
		 *		Specifies how the item will shrink relative to the rest.
		 *		The equivalent of CSS attribute `flexShrink`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		flex_shrink(value) {
			if (value == null) { return this.style.flexShrink; }
			this.style.flexShrink = value;
			this.style.msFlexShrink = value;
			this.style.webkitFlexShrink = value;
			this.style.MozFlexShrink = value;
			this.style.OFlexShrink = value;
			return this;
		}

		// Specifies whether the flexible items should wrap or not.
		/*	@docs:
		 *	@title: Flex wrap
		 *	@description: 
		 *		Specifies whether the flexible items should wrap or not.
		 *		The equivalent of CSS attribute `flexWrap`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		flex_wrap(value) {
			if (value == null) { return this.style.flexWrap; }
			this.style.flexWrap = value;
			this.style.msFlexWrap = value;
			this.style.webkitFlexWrap = value;
			this.style.MozFlexWrap = value;
			this.style.OFlexWrap = value;
			return this;
		}

		// Specifies whether an element should float to the left, right, or not at all.
		/*	@docs:
		 *	@title: Float
		 *	@description: 
		 *		Specifies whether an element should float to the left, right, or not at all.
		 *		The equivalent of CSS attribute `float`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		float(value) {
			if (value == null) { return this.style.float; }
			this.style.float = value;
			return this;
		}

		// A shorthand property for the font-style, font-variant, font-weight, font-size/line-height, and the font-family properties.
		/*	@docs:
		 *	@title: Font
		 *	@description: 
		 *		A shorthand property for the font-style, font-variant, font-weight, font-size/line-height, and the font-family properties.
		 *		The equivalent of CSS attribute `font`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		font(value) {
			if (value == null) { return this.style.font; }
			this.style.font = value;
			return this;
		}

		// Specifies the font family for text.
		/*	@docs:
		 *	@title: Font family
		 *	@description: 
		 *		Specifies the font family for text.
		 *		The equivalent of CSS attribute `fontFamily`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		font_family(value) {
			if (value == null) { return this.style.fontFamily; }
			this.style.fontFamily = value;
			return this;
		}

		// Allows control over advanced typographic features in OpenType fonts.
		/*	@docs:
		 *	@title: Font feature settings
		 *	@description: 
		 *		Allows control over advanced typographic features in OpenType fonts.
		 *		The equivalent of CSS attribute `fontFeatureSettings`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		font_feature_settings(value) {
			if (value == null) { return this.style.fontFeatureSettings; }
			this.style.fontFeatureSettings = value;
			return this;
		}

		// Controls the usage of the kerning information (how letters are spaced).
		/*	@docs:
		 *	@title: Font kerning
		 *	@description: 
		 *		Controls the usage of the kerning information (how letters are spaced).
		 *		The equivalent of CSS attribute `fontKerning`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		font_kerning(value) {
			if (value == null) { return this.style.fontKerning; }
			this.style.fontKerning = value;
			return this;
		}

		// Controls the usage of language-specific glyphs in a typeface.
		/*	@docs:
		 *	@title: Font language override
		 *	@description: 
		 *		Controls the usage of language-specific glyphs in a typeface.
		 *		The equivalent of CSS attribute `fontLanguageOverride`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		font_language_override(value) {
			if (value == null) { return this.style.fontLanguageOverride; }
			this.style.fontLanguageOverride = value;
			return this;
		}

		// Specifies the font size of text.
		/*	@docs:
		 *	@title: Font size
		 *	@description: 
		 *		Specifies the font size of text.
		 *		The equivalent of CSS attribute `fontSize`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		font_size(value) {
			if (value == null) { return this.style.fontSize; }
			this.style.fontSize = this.pad_numeric(value);
			return this;
		}

		// Preserves the readability of text when font fallback occurs.
		/*	@docs:
		 *	@title: Font size adjust
		 *	@description: 
		 *		Preserves the readability of text when font fallback occurs.
		 *		The equivalent of CSS attribute `fontSizeAdjust`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		font_size_adjust(value) {
			if (value == null) { return this.style.fontSizeAdjust; }
			this.style.fontSizeAdjust = value;
			return this;
		}

		// Selects a normal, condensed, or expanded face from a font family.
		/*	@docs:
		 *	@title: Font stretch
		 *	@description: 
		 *		Selects a normal, condensed, or expanded face from a font family.
		 *		The equivalent of CSS attribute `fontStretch`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		font_stretch(value) {
			if (value == null) { return this.style.fontStretch; }
			this.style.fontStretch = value;
			return this;
		}

		// Specifies the font style for text.
		/*	@docs:
		 *	@title: Font style
		 *	@description: 
		 *		Specifies the font style for text.
		 *		The equivalent of CSS attribute `fontStyle`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		font_style(value) {
			if (value == null) { return this.style.fontStyle; }
			this.style.fontStyle = value;
			return this;
		}

		// Controls which missing typefaces (bold or italic) may be synthesized by the browser.
		/*	@docs:
		 *	@title: Font synthesis
		 *	@description: 
		 *		Controls which missing typefaces (bold or italic) may be synthesized by the browser.
		 *		The equivalent of CSS attribute `fontSynthesis`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		font_synthesis(value) {
			if (value == null) { return this.style.fontSynthesis; }
			this.style.fontSynthesis = value;
			return this;
		}

		// Specifies whether or not a text should be displayed in a small-caps font.
		/*	@docs:
		 *	@title: Font variant
		 *	@description: 
		 *		Specifies whether or not a text should be displayed in a small-caps font.
		 *		The equivalent of CSS attribute `fontVariant`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		font_variant(value) {
			if (value == null) { return this.style.fontVariant; }
			this.style.fontVariant = value;
			return this;
		}

		// Controls the usage of alternate glyphs associated to alternative names defined in @font-feature-values.
		/*	@docs:
		 *	@title: Font variant alternates
		 *	@description: 
		 *		Controls the usage of alternate glyphs associated to alternative names defined in \@font-feature-values.
		 *		The equivalent of CSS attribute `fontVariantAlternates`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		font_variant_alternates(value) {
			if (value == null) { return this.style.fontVariantAlternates; }
			this.style.fontVariantAlternates = value;
			return this;
		}

		// Controls the usage of alternate glyphs for capital letters.
		/*	@docs:
		 *	@title: Font variant caps
		 *	@description: 
		 *		Controls the usage of alternate glyphs for capital letters.
		 *		The equivalent of CSS attribute `fontVariantCaps`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		font_variant_caps(value) {
			if (value == null) { return this.style.fontVariantCaps; }
			this.style.fontVariantCaps = value;
			return this;
		}

		// Controls the usage of alternate glyphs for East Asian scripts (e.g Japanese and Chinese).
		/*	@docs:
		 *	@title: Font variant east asian
		 *	@description: 
		 *		Controls the usage of alternate glyphs for East Asian scripts (e.g Japanese and Chinese).
		 *		The equivalent of CSS attribute `fontVariantEastAsian`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		font_variant_east_asian(value) {
			if (value == null) { return this.style.fontVariantEastAsian; }
			this.style.fontVariantEastAsian = value;
			return this;
		}

		// Controls which ligatures and contextual forms are used in textual content of the elements it applies to.
		/*	@docs:
		 *	@title: Font variant ligatures
		 *	@description: 
		 *		Controls which ligatures and contextual forms are used in textual content of the elements it applies to.
		 *		The equivalent of CSS attribute `fontVariantLigatures`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		font_variant_ligatures(value) {
			if (value == null) { return this.style.fontVariantLigatures; }
			this.style.fontVariantLigatures = value;
			return this;
		}

		// Controls the usage of alternate glyphs for numbers, fractions, and ordinal markers.
		/*	@docs:
		 *	@title: Font variant numeric
		 *	@description: 
		 *		Controls the usage of alternate glyphs for numbers, fractions, and ordinal markers.
		 *		The equivalent of CSS attribute `fontVariantNumeric`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		font_variant_numeric(value) {
			if (value == null) { return this.style.fontVariantNumeric; }
			this.style.fontVariantNumeric = value;
			return this;
		}

		// Controls the usage of alternate glyphs of smaller size positioned as superscript or subscript regarding the baseline of the font.
		/*	@docs:
		 *	@title: Font variant position
		 *	@description: 
		 *		Controls the usage of alternate glyphs of smaller size positioned as superscript or subscript regarding the baseline of the font.
		 *		The equivalent of CSS attribute `fontVariantPosition`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		font_variant_position(value) {
			if (value == null) { return this.style.fontVariantPosition; }
			this.style.fontVariantPosition = value;
			return this;
		}

		// Specifies the weight of a font.
		/*	@docs:
		 *	@title: Font weight
		 *	@description: 
		 *		Specifies the weight of a font.
		 *		The equivalent of CSS attribute `fontWeight`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		font_weight(value) {
			if (value == null) { return this.style.fontWeight; }
			this.style.fontWeight = value;
			return this;
		}

		// A shorthand property for the row-gap and the column-gap properties.
		/*	@docs:
		 *	@title: Gap
		 *	@description: 
		 *		A shorthand property for the row-gap and the column-gap properties.
		 *		The equivalent of CSS attribute `gap`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		gap(value) {
			if (value == null) { return this.style.gap; }
			this.style.gap = value;
			return this;
		}

		// A shorthand property for the grid-template-rows, grid-template-columns, grid-template-areas, grid-auto-rows, grid-auto-columns, and the grid-auto-flow properties.
		/*	@docs:
		 *	@title: Grid
		 *	@description: 
		 *		A shorthand property for the grid-template-rows, grid-template-columns, grid-template-areas, grid-auto-rows, grid-auto-columns, and the grid-auto-flow properties.
		 *		The equivalent of CSS attribute `grid`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		grid(value) {
			if (value == null) { return this.style.grid; }
			this.style.grid = value;
			return this;
		}

		// Either specifies a name for the grid item, or this property is a shorthand property for the grid-row-start, grid-column-start, grid-row-end, and grid-column-end properties.
		/*	@docs:
		 *	@title: Grid area
		 *	@description: 
		 *		Either specifies a name for the grid item, or this property is a shorthand property for the grid-row-start, grid-column-start, grid-row-end, and grid-column-end properties.
		 *		The equivalent of CSS attribute `gridArea`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		grid_area(value) {
			if (value == null) { return this.style.gridArea; }
			this.style.gridArea = value;
			return this;
		}

		// Specifies a default column size.
		/*	@docs:
		 *	@title: Grid auto columns
		 *	@description: 
		 *		Specifies a default column size.
		 *		The equivalent of CSS attribute `gridAutoColumns`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		grid_auto_columns(value) {
			if (value == null) { return this.style.gridAutoColumns; }
			this.style.gridAutoColumns = value;
			return this;
		}

		// Specifies how auto-placed items are inserted in the grid.
		/*	@docs:
		 *	@title: Grid auto flow
		 *	@description: 
		 *		Specifies how auto-placed items are inserted in the grid.
		 *		The equivalent of CSS attribute `gridAutoFlow`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		grid_auto_flow(value) {
			if (value == null) { return this.style.gridAutoFlow; }
			this.style.gridAutoFlow = value;
			return this;
		}

		// Specifies a default row size.
		/*	@docs:
		 *	@title: Grid auto rows
		 *	@description: 
		 *		Specifies a default row size.
		 *		The equivalent of CSS attribute `gridAutoRows`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		grid_auto_rows(value) {
			if (value == null) { return this.style.gridAutoRows; }
			this.style.gridAutoRows = value;
			return this;
		}

		// A shorthand property for the grid-column-start and the grid-column-end properties.
		/*	@docs:
		 *	@title: Grid column
		 *	@description: 
		 *		A shorthand property for the grid-column-start and the grid-column-end properties.
		 *		The equivalent of CSS attribute `gridColumn`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		grid_column(value) {
			if (value == null) { return this.style.gridColumn; }
			this.style.gridColumn = value;
			return this;
		}

		// Specifies where to end the grid item.
		/*	@docs:
		 *	@title: Grid column end
		 *	@description: 
		 *		Specifies where to end the grid item.
		 *		The equivalent of CSS attribute `gridColumnEnd`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		grid_column_end(value) {
			if (value == null) { return this.style.gridColumnEnd; }
			this.style.gridColumnEnd = value;
			return this;
		}

		// Specifies the size of the gap between columns.
		/*	@docs:
		 *	@title: Grid column gap
		 *	@description: 
		 *		Specifies the size of the gap between columns.
		 *		The equivalent of CSS attribute `gridColumnGap`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		grid_column_gap(value) {
			if (value == null) { return this.style.gridColumnGap; }
			this.style.gridColumnGap = value;
			return this;
		}

		// Specifies where to start the grid item.
		/*	@docs:
		 *	@title: Grid column start
		 *	@description: 
		 *		Specifies where to start the grid item.
		 *		The equivalent of CSS attribute `gridColumnStart`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		grid_column_start(value) {
			if (value == null) { return this.style.gridColumnStart; }
			this.style.gridColumnStart = value;
			return this;
		}

		// A shorthand property for the grid-row-gap and grid-column-gap properties.
		/*	@docs:
		 *	@title: Grid gap
		 *	@description: 
		 *		A shorthand property for the grid-row-gap and grid-column-gap properties.
		 *		The equivalent of CSS attribute `gridGap`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		grid_gap(value) {
			if (value == null) { return this.style.gridGap; }
			this.style.gridGap = value;
			return this;
		}

		// A shorthand property for the grid-row-start and the grid-row-end properties.
		/*	@docs:
		 *	@title: Grid row
		 *	@description: 
		 *		A shorthand property for the grid-row-start and the grid-row-end properties.
		 *		The equivalent of CSS attribute `gridRow`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		grid_row(value) {
			if (value == null) { return this.style.gridRow; }
			this.style.gridRow = value;
			return this;
		}

		// Specifies where to end the grid item.
		/*	@docs:
		 *	@title: Grid row end
		 *	@description: 
		 *		Specifies where to end the grid item.
		 *		The equivalent of CSS attribute `gridRowEnd`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		grid_row_end(value) {
			if (value == null) { return this.style.gridRowEnd; }
			this.style.gridRowEnd = value;
			return this;
		}

		// Specifies the size of the gap between rows.
		/*	@docs:
		 *	@title: Grid row gap
		 *	@description: 
		 *		Specifies the size of the gap between rows.
		 *		The equivalent of CSS attribute `gridRowGap`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		grid_row_gap(value) {
			if (value == null) { return this.style.gridRowGap; }
			this.style.gridRowGap = value;
			return this;
		}

		// Specifies where to start the grid item.
		/*	@docs:
		 *	@title: Grid row start
		 *	@description: 
		 *		Specifies where to start the grid item.
		 *		The equivalent of CSS attribute `gridRowStart`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		grid_row_start(value) {
			if (value == null) { return this.style.gridRowStart; }
			this.style.gridRowStart = value;
			return this;
		}

		// A shorthand property for the grid-template-rows, grid-template-columns and grid-areas properties.
		/*	@docs:
		 *	@title: Grid template
		 *	@description: 
		 *		A shorthand property for the grid-template-rows, grid-template-columns and grid-areas properties.
		 *		The equivalent of CSS attribute `gridTemplate`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		grid_template(value) {
			if (value == null) { return this.style.gridTemplate; }
			this.style.gridTemplate = value;
			return this;
		}

		// Specifies how to display columns and rows, using named grid items.
		/*	@docs:
		 *	@title: Grid template areas
		 *	@description: 
		 *		Specifies how to display columns and rows, using named grid items.
		 *		The equivalent of CSS attribute `gridTemplateAreas`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		grid_template_areas(value) {
			if (value == null) { return this.style.gridTemplateAreas; }
			this.style.gridTemplateAreas = value;
			return this;
		}

		// Specifies the size of the columns, and how many columns in a grid layout.
		/*	@docs:
		 *	@title: Grid template columns
		 *	@description: 
		 *		Specifies the size of the columns, and how many columns in a grid layout.
		 *		The equivalent of CSS attribute `gridTemplateColumns`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		grid_template_columns(value) {
			if (value == null) { return this.style.gridTemplateColumns; }
			this.style.gridTemplateColumns = value;
			return this;
		}

		// Specifies the size of the rows in a grid layout.
		/*	@docs:
		 *	@title: Grid template rows
		 *	@description: 
		 *		Specifies the size of the rows in a grid layout.
		 *		The equivalent of CSS attribute `gridTemplateRows`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		grid_template_rows(value) {
			if (value == null) { return this.style.gridTemplateRows; }
			this.style.gridTemplateRows = value;
			return this;
		}

		// Specifies whether a punctuation character may be placed outside the line box.
		/*	@docs:
		 *	@title: Hanging punctuation
		 *	@description: 
		 *		Specifies whether a punctuation character may be placed outside the line box.
		 *		The equivalent of CSS attribute `hangingPunctuation`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		hanging_punctuation(value) {
			if (value == null) { return this.style.hangingPunctuation; }
			this.style.hangingPunctuation = value;
			return this;
		}

		// Sets the height of an element.
		// height(value) {
		//     if (value == null) { return this.style.height; }
		//     this.style.height = this.pad_numeric(value);
		//     return this;
		// }

		// Sets how to split words to improve the layout of paragraphs.
		/*	@docs:
		 *	@title: Hyphens
		 *	@description: 
		 *		Sets how to split words to improve the layout of paragraphs.
		 *		The equivalent of CSS attribute `hyphens`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		hyphens(value) {
			if (value == null) { return this.style.hyphens; }
			this.style.hyphens = value;
			return this;
		}

		// Specifies the type of algorithm to use for image scaling.
		/*	@docs:
		 *	@title: Image rendering
		 *	@description: 
		 *		Specifies the type of algorithm to use for image scaling.
		 *		The equivalent of CSS attribute `imageRendering`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		image_rendering(value) {
			if (value == null) { return this.style.imageRendering; }
			this.style.imageRendering = value;
			return this;
		}

		// Specifies the size of an element in the inline direction.
		/*	@docs:
		 *	@title: Inline size
		 *	@description: 
		 *		Specifies the size of an element in the inline direction.
		 *		The equivalent of CSS attribute `inlineSize`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		inline_size(value) {
			if (value == null) { return this.style.inlineSize; }
			this.style.inlineSize = this.pad_numeric(value);
			return this;
		}

		// Specifies the distance between an element and the parent element.
		/*	@docs:
		 *	@title: Inset
		 *	@description: 
		 *		Specifies the distance between an element and the parent element.
		 *		The equivalent of CSS attribute `inset`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		inset(value) {
			if (value == null) { return this.style.inset; }
			this.style.inset = value;
			return this;
		}

		// Specifies the distance between an element and the parent element in the block direction.
		/*	@docs:
		 *	@title: Inset block
		 *	@description: 
		 *		Specifies the distance between an element and the parent element in the block direction.
		 *		The equivalent of CSS attribute `insetBlock`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		inset_block(value) {
			if (value == null) { return this.style.insetBlock; }
			this.style.insetBlock = value;
			return this;
		}

		// Specifies the distance between the end of an element and the parent element in the block direction.
		/*	@docs:
		 *	@title: Inset block end
		 *	@description: 
		 *		Specifies the distance between the end of an element and the parent element in the block direction.
		 *		The equivalent of CSS attribute `insetBlockEnd`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		inset_block_end(value) {
			if (value == null) { return this.style.insetBlockEnd; }
			this.style.insetBlockEnd = value;
			return this;
		}

		// Specifies the distance between the start of an element and the parent element in the block direction.
		/*	@docs:
		 *	@title: Inset block start
		 *	@description: 
		 *		Specifies the distance between the start of an element and the parent element in the block direction.
		 *		The equivalent of CSS attribute `insetBlockStart`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		inset_block_start(value) {
			if (value == null) { return this.style.insetBlockStart; }
			this.style.insetBlockStart = value;
			return this;
		}

		// Specifies the distance between an element and the parent element in the inline direction.
		/*	@docs:
		 *	@title: Inset inline
		 *	@description: 
		 *		Specifies the distance between an element and the parent element in the inline direction.
		 *		The equivalent of CSS attribute `insetInline`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		inset_inline(value) {
			if (value == null) { return this.style.insetInline; }
			this.style.insetInline = value;
			return this;
		}

		// Specifies the distance between the end of an element and the parent element in the inline direction.
		/*	@docs:
		 *	@title: Inset inline end
		 *	@description: 
		 *		Specifies the distance between the end of an element and the parent element in the inline direction.
		 *		The equivalent of CSS attribute `insetInlineEnd`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		inset_inline_end(value) {
			if (value == null) { return this.style.insetInlineEnd; }
			this.style.insetInlineEnd = value;
			return this;
		}

		// Specifies the distance between the start of an element and the parent element in the inline direction.
		/*	@docs:
		 *	@title: Inset inline start
		 *	@description: 
		 *		Specifies the distance between the start of an element and the parent element in the inline direction.
		 *		The equivalent of CSS attribute `insetInlineStart`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		inset_inline_start(value) {
			if (value == null) { return this.style.insetInlineStart; }
			this.style.insetInlineStart = value;
			return this;
		}

		// Defines whether an element must create a new stacking content.
		/*	@docs:
		 *	@title: Isolation
		 *	@description: 
		 *		Defines whether an element must create a new stacking content.
		 *		The equivalent of CSS attribute `isolation`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		isolation(value) {
			if (value == null) { return this.style.isolation; }
			this.style.isolation = value;
			return this;
		}

		// Specifies the alignment between the items inside a flexible container when the items do not use all available space.
		/*	@docs:
		 *	@title: Justify content
		 *	@description: 
		 *		Specifies the alignment between the items inside a flexible container when the items do not use all available space.
		 *		The equivalent of CSS attribute `justifyContent`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		justify_content(value) {
			if (value == null) { return this.style.justifyContent; }
			this.style.justifyContent = value;
			this.style.msJustifyContent = value;
			this.style.webkitJustifyContent = value;
			this.style.MozJustifyContent = value;
			this.style.OJustifyContent = value;
			return this;
		}

		// Is set on the grid container. Specifies the alignment of grid items in the inline direction.
		/*	@docs:
		 *	@title: Justify items
		 *	@description: 
		 *		Is set on the grid container. Specifies the alignment of grid items in the inline direction.
		 *		The equivalent of CSS attribute `justifyItems`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		justify_items(value) {
			if (value == null) { return this.style.justifyItems; }
			this.style.justifyItems = value;
			return this;
		}

		// Is set on the grid item. Specifies the alignment of the grid item in the inline direction.
		/*	@docs:
		 *	@title: Justify self
		 *	@description: 
		 *		Is set on the grid item. Specifies the alignment of the grid item in the inline direction.
		 *		The equivalent of CSS attribute `justifySelf`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		justify_self(value) {
			if (value == null) { return this.style.justifySelf; }
			this.style.justifySelf = value;
			return this;
		}

		// Specifies the left position of a positioned element.
		/*	@docs:
		 *	@title: Left
		 *	@description: 
		 *		Specifies the left position of a positioned element.
		 *		The equivalent of CSS attribute `left`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		left(value) {
			if (value == null) { return this.style.left; }
			this.style.left = this.pad_numeric(value);
			return this;
		}

		// Increases or decreases the space between characters in a text.
		/*	@docs:
		 *	@title: Letter spacing
		 *	@description: 
		 *		Increases or decreases the space between characters in a text.
		 *		The equivalent of CSS attribute `letterSpacing`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		letter_spacing(value) {
			if (value == null) { return this.style.letterSpacing; }
			this.style.letterSpacing = value;
			return this;
		}

		// Specifies how/if to break lines.
		/*	@docs:
		 *	@title: Line break
		 *	@description: 
		 *		Specifies how/if to break lines.
		 *		The equivalent of CSS attribute `lineBreak`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		line_break(value) {
			if (value == null) { return this.style.lineBreak; }
			this.style.lineBreak = value;
			return this;
		}

		// Sets the line height.
		/*	@docs:
		 *	@title: Line height
		 *	@description: 
		 *		Sets the line height.
		 *		The equivalent of CSS attribute `lineHeight`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		line_height(value) {
			if (value == null) { return this.style.lineHeight; }
			this.style.lineHeight = this.pad_numeric(value);
			return this;
		}

		// Sets all the properties for a list in one declaration.
		/*	@docs:
		 *	@title: List style
		 *	@description: 
		 *		Sets all the properties for a list in one declaration.
		 *		The equivalent of CSS attribute `listStyle`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		list_style(value) {
			if (value == null) { return this.style.listStyle; }
			this.style.listStyle = value;
			return this;
		}

		// Specifies an image as the list-item marker.
		/*	@docs:
		 *	@title: List style image
		 *	@description: 
		 *		Specifies an image as the list-item marker.
		 *		The equivalent of CSS attribute `listStyleImage`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		list_style_image(value) {
			if (value == null) { return this.style.listStyleImage; }
			this.style.listStyleImage = value;
			return this;
		}

		// Specifies the position of the list-item markers (bullet points).
		/*	@docs:
		 *	@title: List style position
		 *	@description: 
		 *		Specifies the position of the list-item markers (bullet points).
		 *		The equivalent of CSS attribute `listStylePosition`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		list_style_position(value) {
			if (value == null) { return this.style.listStylePosition; }
			this.style.listStylePosition = value;
			return this;
		}

		// Specifies the type of list-item marker.
		/*	@docs:
		 *	@title: List style type
		 *	@description: 
		 *		Specifies the type of list-item marker.
		 *		The equivalent of CSS attribute `listStyleType`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		list_style_type(value) {
			if (value == null) { return this.style.listStyleType; }
			this.style.listStyleType = value;
			return this;
		}

		// Sets all the margin properties in one declaration.
		// margin(value) {
		//     if (value == null) { return this.style.margin; }
		//     this.style.margin = value;
		//     return this;
		// }

		// Specifies the margin in the block direction.
		/*	@docs:
		 *	@title: Margin block
		 *	@description: 
		 *		Specifies the margin in the block direction.
		 *		The equivalent of CSS attribute `marginBlock`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		margin_block(value) {
			if (value == null) { return this.style.marginBlock; }
			this.style.marginBlock = value;
			return this;
		}

		// Specifies the margin at the end in the block direction.
		/*	@docs:
		 *	@title: Margin block end
		 *	@description: 
		 *		Specifies the margin at the end in the block direction.
		 *		The equivalent of CSS attribute `marginBlockEnd`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		margin_block_end(value) {
			if (value == null) { return this.style.marginBlockEnd; }
			this.style.marginBlockEnd = value;
			return this;
		}

		// Specifies the margin at the start in the block direction.
		/*	@docs:
		 *	@title: Margin block start
		 *	@description: 
		 *		Specifies the margin at the start in the block direction.
		 *		The equivalent of CSS attribute `marginBlockStart`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		margin_block_start(value) {
			if (value == null) { return this.style.marginBlockStart; }
			this.style.marginBlockStart = value;
			return this;
		}

		// Specifies the margin in the inline direction.
		/*	@docs:
		 *	@title: Margin inline
		 *	@description: 
		 *		Specifies the margin in the inline direction.
		 *		The equivalent of CSS attribute `marginInline`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		margin_inline(value) {
			if (value == null) { return this.style.marginInline; }
			this.style.marginInline = value;
			return this;
		}

		// Specifies the margin at the end in the inline direction.
		/*	@docs:
		 *	@title: Margin inline end
		 *	@description: 
		 *		Specifies the margin at the end in the inline direction.
		 *		The equivalent of CSS attribute `marginInlineEnd`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		margin_inline_end(value) {
			if (value == null) { return this.style.marginInlineEnd; }
			this.style.marginInlineEnd = value;
			return this;
		}

		// Specifies the margin at the start in the inline direction.
		/*	@docs:
		 *	@title: Margin inline start
		 *	@description: 
		 *		Specifies the margin at the start in the inline direction.
		 *		The equivalent of CSS attribute `marginInlineStart`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		margin_inline_start(value) {
			if (value == null) { return this.style.marginInlineStart; }
			this.style.marginInlineStart = value;
			return this;
		}

		// Hides parts of an element by masking or clipping an image at specific places.
		/*	@docs:
		 *	@title: Mask
		 *	@description: 
		 *		Hides parts of an element by masking or clipping an image at specific places.
		 *		The equivalent of CSS attribute `mask`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		mask(value) {
			if (value == null) { return this.style.mask; }
			this.style.mask = value;
			this.style.msMask = value;
			this.style.webkitMask = value;
			this.style.MozMask = value;
			this.style.OMask = value;
			return this;
		}

		// Specifies the mask area.
		/*	@docs:
		 *	@title: Mask clip
		 *	@description: 
		 *		Specifies the mask area.
		 *		The equivalent of CSS attribute `maskClip`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		mask_clip(value) {
			if (value == null) { return this.style.maskClip; }
			this.style.maskClip = value;
			return this;
		}

		// Represents a compositing operation used on the current mask layer with the mask layers below it.
		/*	@docs:
		 *	@title: Mask composite
		 *	@description: 
		 *		Represents a compositing operation used on the current mask layer with the mask layers below it.
		 *		The equivalent of CSS attribute `maskComposite`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		mask_composite(value) {
			if (value == null) { return this.style.maskComposite; }
			this.style.maskComposite = value;
			this.style.msMaskComposite = value;
			this.style.webkitMaskComposite = value;
			this.style.MozMaskComposite = value;
			this.style.OMaskComposite = value;
			return this;
		}

		// Specifies an image to be used as a mask layer for an element.
		/*	@docs:
		 *	@title: Mask image
		 *	@description: 
		 *		Specifies an image to be used as a mask layer for an element.
		 *		The equivalent of CSS attribute `maskImage`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		mask_image(value) {
			if (value == null) { return this.style.maskImage; }
			this.style.maskImage = value;
			this.style.msMaskImage = value;
			this.style.webkitMaskImage = value;
			this.style.MozMaskImage = value;
			this.style.OMaskImage = value;
			return this;
		}

		// Specifies whether the mask layer image is treated as a luminance mask or as an alpha mask.
		/*	@docs:
		 *	@title: Mask mode
		 *	@description: 
		 *		Specifies whether the mask layer image is treated as a luminance mask or as an alpha mask.
		 *		The equivalent of CSS attribute `maskMode`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		mask_mode(value) {
			if (value == null) { return this.style.maskMode; }
			this.style.maskMode = value;
			return this;
		}

		// Specifies the origin position (the mask position area) of a mask layer image.
		/*	@docs:
		 *	@title: Mask origin
		 *	@description: 
		 *		Specifies the origin position (the mask position area) of a mask layer image.
		 *		The equivalent of CSS attribute `maskOrigin`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		mask_origin(value) {
			if (value == null) { return this.style.maskOrigin; }
			this.style.maskOrigin = value;
			return this;
		}

		// Sets the starting position of a mask layer image (relative to the mask position area).
		/*	@docs:
		 *	@title: Mask position
		 *	@description: 
		 *		Sets the starting position of a mask layer image (relative to the mask position area).
		 *		The equivalent of CSS attribute `maskPosition`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		mask_position(value) {
			if (value == null) { return this.style.maskPosition; }
			this.style.maskPosition = value;
			return this;
		}

		// Specifies how the mask layer image is repeated.
		/*	@docs:
		 *	@title: Mask repeat
		 *	@description: 
		 *		Specifies how the mask layer image is repeated.
		 *		The equivalent of CSS attribute `maskRepeat`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		mask_repeat(value) {
			if (value == null) { return this.style.maskRepeat; }
			this.style.maskRepeat = value;
			return this;
		}

		// Specifies the size of a mask layer image.
		/*	@docs:
		 *	@title: Mask size
		 *	@description: 
		 *		Specifies the size of a mask layer image.
		 *		The equivalent of CSS attribute `maskSize`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		mask_size(value) {
			if (value == null) { return this.style.maskSize; }
			this.style.maskSize = this.pad_numeric(value);
			return this;
		}

		// Specifies whether an SVG \<mask> element is treated as a luminance mask or as an alpha mask.
		/*	@docs:
		 *	@title: Mask type
		 *	@description: 
		 *		Specifies whether an SVG \<mask> element is treated as a luminance mask or as an alpha mask.
		 *		The equivalent of CSS attribute `maskType`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		mask_type(value) {
			if (value == null) { return this.style.maskType; }
			this.style.maskType = value;
			return this;
		}

		// Sets the maximum height of an element.
		/*	@docs:
		 *	@title: Max height
		 *	@description: 
		 *		Sets the maximum height of an element.
		 *		The equivalent of CSS attribute `maxHeight`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		max_height(value) {
			if (value == null) { return this.style.maxHeight; }
			this.style.maxHeight = this.pad_numeric(value);
			return this;
		}

		// Sets the maximum width of an element.
		/*	@docs:
		 *	@title: Max width
		 *	@description: 
		 *		Sets the maximum width of an element.
		 *		The equivalent of CSS attribute `maxWidth`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		max_width(value) {
			if (value == null) { return this.style.maxWidth; }
			this.style.maxWidth = this.pad_numeric(value);
			return this;
		}

		// Sets the maximum size of an element in the block direction.
		/*	@docs:
		 *	@title: Max block size
		 *	@description: 
		 *		Sets the maximum size of an element in the block direction.
		 *		The equivalent of CSS attribute `maxBlockSize`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		max_block_size(value) {
			if (value == null) { return this.style.maxBlockSize; }
			this.style.maxBlockSize = this.pad_numeric(value);
			return this;
		}

		// Sets the maximum size of an element in the inline direction.
		/*	@docs:
		 *	@title: Max inline size
		 *	@description: 
		 *		Sets the maximum size of an element in the inline direction.
		 *		The equivalent of CSS attribute `maxInlineSize`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		max_inline_size(value) {
			if (value == null) { return this.style.maxInlineSize; }
			this.style.maxInlineSize = this.pad_numeric(value);
			return this;
		}

		// Sets the minimum size of an element in the block direction.
		/*	@docs:
		 *	@title: Min block size
		 *	@description: 
		 *		Sets the minimum size of an element in the block direction.
		 *		The equivalent of CSS attribute `minBlockSize`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		min_block_size(value) {
			if (value == null) { return this.style.minBlockSize; }
			this.style.minBlockSize = this.pad_numeric(value);
			return this;
		}

		// Sets the minimum size of an element in the inline direction.
		/*	@docs:
		 *	@title: Min inline size
		 *	@description: 
		 *		Sets the minimum size of an element in the inline direction.
		 *		The equivalent of CSS attribute `minInlineSize`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		min_inline_size(value) {
			if (value == null) { return this.style.minInlineSize; }
			this.style.minInlineSize = this.pad_numeric(value);
			return this;
		}

		// Specifies how an element's content should blend with its direct parent background.
		/*	@docs:
		 *	@title: Mix blend mode
		 *	@description: 
		 *		Specifies how an element's content should blend with its direct parent background.
		 *		The equivalent of CSS attribute `mixBlendMode`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		mix_blend_mode(value) {
			if (value == null) { return this.style.mixBlendMode; }
			this.style.mixBlendMode = value;
			return this;
		}

		// Specifies how the contents of a replaced element should be fitted to the box established by its used height and width.
		/*	@docs:
		 *	@title: Object fit
		 *	@description: 
		 *		Specifies how the contents of a replaced element should be fitted to the box established by its used height and width.
		 *		The equivalent of CSS attribute `objectFit`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		object_fit(value) {
			if (value == null) { return this.style.objectFit; }
			this.style.objectFit = value;
			return this;
		}

		// Specifies the alignment of the replaced element inside its box.
		/*	@docs:
		 *	@title: Object position
		 *	@description: 
		 *		Specifies the alignment of the replaced element inside its box.
		 *		The equivalent of CSS attribute `objectPosition`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		object_position(value) {
			if (value == null) { return this.style.objectPosition; }
			this.style.objectPosition = value;
			return this;
		}

		// Is a shorthand, and specifies how to animate an element along a path.
		/*	@docs:
		 *	@title: Offset
		 *	@description: 
		 *		Is a shorthand, and specifies how to animate an element along a path.
		 *		The equivalent of CSS attribute `offset`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		offset(value) {
			if (value == null) { return this.style.offset; }
			this.style.offset = value;
			return this;
		}

		// Specifies a point on an element that is fixed to the path it is animated along.
		/*	@docs:
		 *	@title: Offset anchor
		 *	@description: 
		 *		Specifies a point on an element that is fixed to the path it is animated along.
		 *		The equivalent of CSS attribute `offsetAnchor`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		offset_anchor(value) {
			if (value == null) { return this.style.offsetAnchor; }
			this.style.offsetAnchor = value;
			return this;
		}

		// Specifies the position along a path where an animated element is placed.
		/*	@docs:
		 *	@title: Offset distance
		 *	@description: 
		 *		Specifies the position along a path where an animated element is placed.
		 *		The equivalent of CSS attribute `offsetDistance`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		offset_distance(value) {
			if (value == null) { return this.style.offsetDistance; }
			this.style.offsetDistance = value;
			return this;
		}

		// Specifies the path an element is animated along.
		/*	@docs:
		 *	@title: Offset path
		 *	@description: 
		 *		Specifies the path an element is animated along.
		 *		The equivalent of CSS attribute `offsetPath`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		offset_path(value) {
			if (value == null) { return this.style.offsetPath; }
			this.style.offsetPath = value;
			return this;
		}

		// Specifies rotation of an element as it is animated along a path.
		/*	@docs:
		 *	@title: Offset rotate
		 *	@description: 
		 *		Specifies rotation of an element as it is animated along a path.
		 *		The equivalent of CSS attribute `offsetRotate`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		offset_rotate(value) {
			if (value == null) { return this.style.offsetRotate; }
			this.style.offsetRotate = value;
			return this;
		}

		// Sets the opacity level for an element.
		// opacity(value) {
		//     if (value == null) { return this.style.opacity; }
		//     this.style.opacity = value;
		//     return this;
		// }

		// Sets the order of the flexible item, relative to the rest.
		/*	@docs:
		 *	@title: Order
		 *	@description: 
		 *		Sets the order of the flexible item, relative to the rest.
		 *		The equivalent of CSS attribute `order`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		order(value) {
			if (value == null) { return this.style.order; }
			this.style.order = value;
			this.style.msOrder = value;
			this.style.webkitOrder = value;
			this.style.MozOrder = value;
			this.style.OOrder = value;
			return this;
		}

		// Sets the minimum number of lines that must be left at the bottom of a page or column.
		/*	@docs:
		 *	@title: Orphans
		 *	@description: 
		 *		Sets the minimum number of lines that must be left at the bottom of a page or column.
		 *		The equivalent of CSS attribute `orphans`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		orphans(value) {
			if (value == null) { return this.style.orphans; }
			this.style.orphans = value;
			return this;
		}

		// A shorthand property for the outline-width, outline-style, and the outline-color properties.
		/*	@docs:
		 *	@title: Outline
		 *	@description: 
		 *		A shorthand property for the outline-width, outline-style, and the outline-color properties.
		 *		The equivalent of CSS attribute `outline`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		outline(value) {
			if (value == null) { return this.style.outline; }
			this.style.outline = value;
			return this;
		}

		// Sets the color of an outline.
		/*	@docs:
		 *	@title: Outline color
		 *	@description: 
		 *		Sets the color of an outline.
		 *		The equivalent of CSS attribute `outlineColor`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		outline_color(value) {
			if (value == null) { return this.style.outlineColor; }
			this.style.outlineColor = value;
			return this;
		}

		// Offsets an outline, and draws it beyond the border edge.
		/*	@docs:
		 *	@title: Outline offset
		 *	@description: 
		 *		Offsets an outline, and draws it beyond the border edge.
		 *		The equivalent of CSS attribute `outlineOffset`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		outline_offset(value) {
			if (value == null) { return this.style.outlineOffset; }
			this.style.outlineOffset = value;
			return this;
		}

		// Sets the style of an outline.
		/*	@docs:
		 *	@title: Outline style
		 *	@description: 
		 *		Sets the style of an outline.
		 *		The equivalent of CSS attribute `outlineStyle`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		outline_style(value) {
			if (value == null) { return this.style.outlineStyle; }
			this.style.outlineStyle = value;
			return this;
		}

		// Sets the width of an outline.
		/*	@docs:
		 *	@title: Outline width
		 *	@description: 
		 *		Sets the width of an outline.
		 *		The equivalent of CSS attribute `outlineWidth`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		outline_width(value) {
			if (value == null) { return this.style.outlineWidth; }
			this.style.outlineWidth = this.pad_numeric(value);
			return this;
		}

		// Specifies what happens if content overflows an element's box.
		/*	@docs:
		 *	@title: Overflow
		 *	@description: 
		 *		Specifies what happens if content overflows an element's box.
		 *		The equivalent of CSS attribute `overflow`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		overflow(value) {
			if (value == null) { return this.style.overflow; }
			this.style.overflow = value;
			return this;
		}

		// Specifies whether or not content in viewable area in a scrollable contianer should be pushed down when new content is loaded above.
		/*	@docs:
		 *	@title: Overflow anchor
		 *	@description: 
		 *		Specifies whether or not content in viewable area in a scrollable contianer should be pushed down when new content is loaded above.
		 *		The equivalent of CSS attribute `overflowAnchor`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		overflow_anchor(value) {
			if (value == null) { return this.style.overflowAnchor; }
			this.style.overflowAnchor = value;
			return this;
		}

		// Specifies whether or not the browser can break lines with long words, if they overflow the container.
		/*	@docs:
		 *	@title: Overflow wrap
		 *	@description: 
		 *		Specifies whether or not the browser can break lines with long words, if they overflow the container.
		 *		The equivalent of CSS attribute `overflowWrap`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		overflow_wrap(value) {
			if (value == null) { return this.style.overflowWrap; }
			this.style.overflowWrap = value;
			return this;
		}

		// Specifies whether or not to clip the left/right edges of the content, if it overflows the element's content area.
		/*	@docs:
		 *	@title: Overflow x
		 *	@description: 
		 *		Specifies whether or not to clip the left/right edges of the content, if it overflows the element's content area.
		 *		The equivalent of CSS attribute `overflowX`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		overflow_x(value) {
			if (value == null) { return this.style.overflowX; }
			this.style.overflowX = value;
			return this;
		}

		// Specifies whether or not to clip the top/bottom edges of the content, if it overflows the element's content area.
		/*	@docs:
		 *	@title: Overflow y
		 *	@description: 
		 *		Specifies whether or not to clip the top/bottom edges of the content, if it overflows the element's content area.
		 *		The equivalent of CSS attribute `overflowY`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		overflow_y(value) {
			if (value == null) { return this.style.overflowY; }
			this.style.overflowY = value;
			return this;
		}

		// Specifies whether to have scroll chaining or overscroll affordance in x- and y-directions.
		/*	@docs:
		 *	@title: Overscroll behavior
		 *	@description: 
		 *		Specifies whether to have scroll chaining or overscroll affordance in x- and y-directions.
		 *		The equivalent of CSS attribute `overscrollBehavior`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		overscroll_behavior(value) {
			if (value == null) { return this.style.overscrollBehavior; }
			this.style.overscrollBehavior = value;
			return this;
		}

		// Specifies whether to have scroll chaining or overscroll affordance in the block direction.
		/*	@docs:
		 *	@title: Overscroll behavior block
		 *	@description: 
		 *		Specifies whether to have scroll chaining or overscroll affordance in the block direction.
		 *		The equivalent of CSS attribute `overscrollBehaviorBlock`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		overscroll_behavior_block(value) {
			if (value == null) { return this.style.overscrollBehaviorBlock; }
			this.style.overscrollBehaviorBlock = value;
			return this;
		}

		// Specifies whether to have scroll chaining or overscroll affordance in the inline direction.
		/*	@docs:
		 *	@title: Overscroll behavior inline
		 *	@description: 
		 *		Specifies whether to have scroll chaining or overscroll affordance in the inline direction.
		 *		The equivalent of CSS attribute `overscrollBehaviorInline`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		overscroll_behavior_inline(value) {
			if (value == null) { return this.style.overscrollBehaviorInline; }
			this.style.overscrollBehaviorInline = value;
			return this;
		}

		// Specifies whether to have scroll chaining or overscroll affordance in x-direction.
		/*	@docs:
		 *	@title: Overscroll behavior x
		 *	@description: 
		 *		Specifies whether to have scroll chaining or overscroll affordance in x-direction.
		 *		The equivalent of CSS attribute `overscrollBehaviorX`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		overscroll_behavior_x(value) {
			if (value == null) { return this.style.overscrollBehaviorX; }
			this.style.overscrollBehaviorX = value;
			return this;
		}

		// Specifies whether to have scroll chaining or overscroll affordance in y-directions.
		/*	@docs:
		 *	@title: Overscroll behavior y
		 *	@description: 
		 *		Specifies whether to have scroll chaining or overscroll affordance in y-directions.
		 *		The equivalent of CSS attribute `overscrollBehaviorY`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		overscroll_behavior_y(value) {
			if (value == null) { return this.style.overscrollBehaviorY; }
			this.style.overscrollBehaviorY = value;
			return this;
		}

		// A shorthand property for all the padding properties.
		// padding(value) {
		//     if (value == null) { return this.style.padding; }
		//     this.style.padding = value;
		//     return this;
		// }

		// Specifies the padding in the block direction.
		/*	@docs:
		 *	@title: Padding block
		 *	@description: 
		 *		Specifies the padding in the block direction.
		 *		The equivalent of CSS attribute `paddingBlock`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		padding_block(value) {
			if (value == null) { return this.style.paddingBlock; }
			this.style.paddingBlock = value;
			return this;
		}

		// Specifies the padding at the end in the block direction.
		/*	@docs:
		 *	@title: Padding block end
		 *	@description: 
		 *		Specifies the padding at the end in the block direction.
		 *		The equivalent of CSS attribute `paddingBlockEnd`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		padding_block_end(value) {
			if (value == null) { return this.style.paddingBlockEnd; }
			this.style.paddingBlockEnd = value;
			return this;
		}

		// Specifies the padding at the start in the block direction.
		/*	@docs:
		 *	@title: Padding block start
		 *	@description: 
		 *		Specifies the padding at the start in the block direction.
		 *		The equivalent of CSS attribute `paddingBlockStart`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		padding_block_start(value) {
			if (value == null) { return this.style.paddingBlockStart; }
			this.style.paddingBlockStart = value;
			return this;
		}

		// Specifies the padding in the inline direction.
		/*	@docs:
		 *	@title: Padding inline
		 *	@description: 
		 *		Specifies the padding in the inline direction.
		 *		The equivalent of CSS attribute `paddingInline`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		padding_inline(value) {
			if (value == null) { return this.style.paddingInline; }
			this.style.paddingInline = value;
			return this;
		}

		// Specifies the padding at the end in the inline direction.
		/*	@docs:
		 *	@title: Padding inline end
		 *	@description: 
		 *		Specifies the padding at the end in the inline direction.
		 *		The equivalent of CSS attribute `paddingInlineEnd`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		padding_inline_end(value) {
			if (value == null) { return this.style.paddingInlineEnd; }
			this.style.paddingInlineEnd = value;
			return this;
		}

		// Specifies the padding at the start in the inline direction.
		/*	@docs:
		 *	@title: Padding inline start
		 *	@description: 
		 *		Specifies the padding at the start in the inline direction.
		 *		The equivalent of CSS attribute `paddingInlineStart`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		padding_inline_start(value) {
			if (value == null) { return this.style.paddingInlineStart; }
			this.style.paddingInlineStart = value;
			return this;
		}

		// Sets the page-break behavior after an element.
		/*	@docs:
		 *	@title: Page break after
		 *	@description: 
		 *		Sets the page-break behavior after an element.
		 *		The equivalent of CSS attribute `pageBreakAfter`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		page_break_after(value) {
			if (value == null) { return this.style.pageBreakAfter; }
			this.style.pageBreakAfter = value;
			return this;
		}

		// Sets the page-break behavior before an element.
		/*	@docs:
		 *	@title: Page break before
		 *	@description: 
		 *		Sets the page-break behavior before an element.
		 *		The equivalent of CSS attribute `pageBreakBefore`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		page_break_before(value) {
			if (value == null) { return this.style.pageBreakBefore; }
			this.style.pageBreakBefore = value;
			return this;
		}

		// Sets the page-break behavior inside an element.
		/*	@docs:
		 *	@title: Page break inside
		 *	@description: 
		 *		Sets the page-break behavior inside an element.
		 *		The equivalent of CSS attribute `pageBreakInside`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		page_break_inside(value) {
			if (value == null) { return this.style.pageBreakInside; }
			this.style.pageBreakInside = value;
			return this;
		}

		// Sets the order of how an SVG element or text is painted.
		/*	@docs:
		 *	@title: Paint order
		 *	@description: 
		 *		Sets the order of how an SVG element or text is painted.
		 *		The equivalent of CSS attribute `paintOrder`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		paint_order(value) {
			if (value == null) { return this.style.paintOrder; }
			this.style.paintOrder = value;
			return this;
		}

		// Gives a 3D-positioned element some perspective.
		/*	@docs:
		 *	@title: Perspective
		 *	@description: 
		 *		Gives a 3D-positioned element some perspective.
		 *		The equivalent of CSS attribute `perspective`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		perspective(value) {
			if (value == null) { return this.style.perspective; }
			this.style.perspective = value;
			this.style.msPerspective = value;
			this.style.webkitPerspective = value;
			this.style.MozPerspective = value;
			this.style.OPerspective = value;
			return this;
		}

		// Defines at which position the user is looking at the 3D-positioned element.
		/*	@docs:
		 *	@title: Perspective origin
		 *	@description: 
		 *		Defines at which position the user is looking at the 3D-positioned element.
		 *		The equivalent of CSS attribute `perspectiveOrigin`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		perspective_origin(value) {
			if (value == null) { return this.style.perspectiveOrigin; }
			this.style.perspectiveOrigin = value;
			this.style.msPerspectiveOrigin = value;
			this.style.webkitPerspectiveOrigin = value;
			this.style.MozPerspectiveOrigin = value;
			this.style.OPerspectiveOrigin = value;
			return this;
		}

		// Specifies align-content and justify-content property values for flexbox and grid layouts.
		/*	@docs:
		 *	@title: Place content
		 *	@description: 
		 *		Specifies align-content and justify-content property values for flexbox and grid layouts.
		 *		The equivalent of CSS attribute `placeContent`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		place_content(value) {
			if (value == null) { return this.style.placeContent; }
			this.style.placeContent = value;
			return this;
		}

		// Specifies align-items and justify-items property values for grid layouts.
		/*	@docs:
		 *	@title: Place items
		 *	@description: 
		 *		Specifies align-items and justify-items property values for grid layouts.
		 *		The equivalent of CSS attribute `placeItems`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		place_items(value) {
			if (value == null) { return this.style.placeItems; }
			this.style.placeItems = value;
			return this;
		}

		// Specifies align-self and justify-self property values for grid layouts.
		/*	@docs:
		 *	@title: Place self
		 *	@description: 
		 *		Specifies align-self and justify-self property values for grid layouts.
		 *		The equivalent of CSS attribute `placeSelf`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		place_self(value) {
			if (value == null) { return this.style.placeSelf; }
			this.style.placeSelf = value;
			return this;
		}

		// Defines whether or not an element reacts to pointer events.
		/*	@docs:
		 *	@title: Pointer events
		 *	@description: 
		 *		Defines whether or not an element reacts to pointer events.
		 *		The equivalent of CSS attribute `pointerEvents`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		pointer_events(value) {
			if (value == null) { return this.style.pointerEvents; }
			this.style.pointerEvents = value;
			return this;
		}

		// Specifies the type of positioning method used for an element (static, relative, absolute or fixed).
		// position(value) {
		//     if (value == null) { return this.style.position; }
		//     this.style.position = value;
		//     return this;
		// }

		// Sets the type of quotation marks for embedded quotations.
		/*	@docs:
		 *	@title: Quotes
		 *	@description: 
		 *		Sets the type of quotation marks for embedded quotations.
		 *		The equivalent of CSS attribute `quotes`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		quotes(value) {
			if (value == null) { return this.style.quotes; }
			this.style.quotes = value;
			return this;
		}

		// Defines if (and how) an element is resizable by the user.
		/*	@docs:
		 *	@title: Resize
		 *	@description: 
		 *		Defines if (and how) an element is resizable by the user.
		 *		The equivalent of CSS attribute `resize`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		resize(value) {
			if (value == null) { return this.style.resize; }
			this.style.resize = value;
			return this;
		}

		// Specifies the right position of a positioned element.
		/*	@docs:
		 *	@title: Right
		 *	@description: 
		 *		Specifies the right position of a positioned element.
		 *		The equivalent of CSS attribute `right`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		right(value) {
			if (value == null) { return this.style.right; }
			this.style.right = this.pad_numeric(value);
			return this;
		}

		// Specifies the gap between the grid rows.
		/*	@docs:
		 *	@title: Row gap
		 *	@description: 
		 *		Specifies the gap between the grid rows.
		 *		The equivalent of CSS attribute `rowGap`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		row_gap(value) {
			if (value == null) { return this.style.rowGap; }
			this.style.rowGap = value;
			return this;
		}

		// Specifies the size of an element by scaling up or down.
		/*	@docs:
		 *	@title: Scale
		 *	@description: 
		 *		Specifies the size of an element by scaling up or down.
		 *		The equivalent of CSS attribute `scale`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		scale(value) {
			if (value == null) { return this.style.scale; }
			this.style.scale = value;
			return this;
		}

		// Specifies whether to smoothly animate the scroll position in a scrollable box, instead of a straight jump.
		/*	@docs:
		 *	@title: Scroll behavior
		 *	@description: 
		 *		Specifies whether to smoothly animate the scroll position in a scrollable box, instead of a straight jump.
		 *		The equivalent of CSS attribute `scrollBehavior`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		scroll_behavior(value) {
			if (value == null) { return this.style.scrollBehavior; }
			this.style.scrollBehavior = value;
			return this;
		}

		// Specifies the margin between the snap position and the container.
		/*	@docs:
		 *	@title: Scroll margin
		 *	@description: 
		 *		Specifies the margin between the snap position and the container.
		 *		The equivalent of CSS attribute `scrollMargin`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		scroll_margin(value) {
			if (value == null) { return this.style.scrollMargin; }
			this.style.scrollMargin = value;
			return this;
		}

		// Specifies the margin between the snap position and the container in the block direction.
		/*	@docs:
		 *	@title: Scroll margin block
		 *	@description: 
		 *		Specifies the margin between the snap position and the container in the block direction.
		 *		The equivalent of CSS attribute `scrollMarginBlock`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		scroll_margin_block(value) {
			if (value == null) { return this.style.scrollMarginBlock; }
			this.style.scrollMarginBlock = value;
			return this;
		}

		// Specifies the end margin between the snap position and the container in the block direction.
		/*	@docs:
		 *	@title: Scroll margin block end
		 *	@description: 
		 *		Specifies the end margin between the snap position and the container in the block direction.
		 *		The equivalent of CSS attribute `scrollMarginBlockEnd`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		scroll_margin_block_end(value) {
			if (value == null) { return this.style.scrollMarginBlockEnd; }
			this.style.scrollMarginBlockEnd = value;
			return this;
		}

		// Specifies the start margin between the snap position and the container in the block direction.
		/*	@docs:
		 *	@title: Scroll margin block start
		 *	@description: 
		 *		Specifies the start margin between the snap position and the container in the block direction.
		 *		The equivalent of CSS attribute `scrollMarginBlockStart`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		scroll_margin_block_start(value) {
			if (value == null) { return this.style.scrollMarginBlockStart; }
			this.style.scrollMarginBlockStart = value;
			return this;
		}

		// Specifies the margin between the snap position on the bottom side and the container.
		/*	@docs:
		 *	@title: Scroll margin bottom
		 *	@description: 
		 *		Specifies the margin between the snap position on the bottom side and the container.
		 *		The equivalent of CSS attribute `scrollMarginBottom`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		scroll_margin_bottom(value) {
			if (value == null) { return this.style.scrollMarginBottom; }
			this.style.scrollMarginBottom = this.pad_numeric(value);
			return this;
		}

		// Specifies the margin between the snap position and the container in the inline direction.
		/*	@docs:
		 *	@title: Scroll margin inline
		 *	@description: 
		 *		Specifies the margin between the snap position and the container in the inline direction.
		 *		The equivalent of CSS attribute `scrollMarginInline`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		scroll_margin_inline(value) {
			if (value == null) { return this.style.scrollMarginInline; }
			this.style.scrollMarginInline = value;
			return this;
		}

		// Specifies the end margin between the snap position and the container in the inline direction.
		/*	@docs:
		 *	@title: Scroll margin inline end
		 *	@description: 
		 *		Specifies the end margin between the snap position and the container in the inline direction.
		 *		The equivalent of CSS attribute `scrollMarginInlineEnd`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		scroll_margin_inline_end(value) {
			if (value == null) { return this.style.scrollMarginInlineEnd; }
			this.style.scrollMarginInlineEnd = value;
			return this;
		}

		// Specifies the start margin between the snap position and the container in the inline direction.
		/*	@docs:
		 *	@title: Scroll margin inline start
		 *	@description: 
		 *		Specifies the start margin between the snap position and the container in the inline direction.
		 *		The equivalent of CSS attribute `scrollMarginInlineStart`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		scroll_margin_inline_start(value) {
			if (value == null) { return this.style.scrollMarginInlineStart; }
			this.style.scrollMarginInlineStart = value;
			return this;
		}

		// Specifies the margin between the snap position on the left side and the container.
		/*	@docs:
		 *	@title: Scroll margin left
		 *	@description: 
		 *		Specifies the margin between the snap position on the left side and the container.
		 *		The equivalent of CSS attribute `scrollMarginLeft`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		scroll_margin_left(value) {
			if (value == null) { return this.style.scrollMarginLeft; }
			this.style.scrollMarginLeft = this.pad_numeric(value);
			return this;
		}

		// Specifies the margin between the snap position on the right side and the container.
		/*	@docs:
		 *	@title: Scroll margin right
		 *	@description: 
		 *		Specifies the margin between the snap position on the right side and the container.
		 *		The equivalent of CSS attribute `scrollMarginRight`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		scroll_margin_right(value) {
			if (value == null) { return this.style.scrollMarginRight; }
			this.style.scrollMarginRight = this.pad_numeric(value);
			return this;
		}

		// Specifies the margin between the snap position on the top side and the container.
		/*	@docs:
		 *	@title: Scroll margin top
		 *	@description: 
		 *		Specifies the margin between the snap position on the top side and the container.
		 *		The equivalent of CSS attribute `scrollMarginTop`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		scroll_margin_top(value) {
			if (value == null) { return this.style.scrollMarginTop; }
			this.style.scrollMarginTop = this.pad_numeric(value);
			return this;
		}

		// Specifies the distance from the container to the snap position on the child elements.
		/*	@docs:
		 *	@title: Scroll padding
		 *	@description: 
		 *		Specifies the distance from the container to the snap position on the child elements.
		 *		The equivalent of CSS attribute `scrollPadding`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		scroll_padding(value) {
			if (value == null) { return this.style.scrollPadding; }
			this.style.scrollPadding = value;
			return this;
		}

		// Specifies the distance in block direction from the container to the snap position on the child elements.
		/*	@docs:
		 *	@title: Scroll padding block
		 *	@description: 
		 *		Specifies the distance in block direction from the container to the snap position on the child elements.
		 *		The equivalent of CSS attribute `scrollPaddingBlock`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		scroll_padding_block(value) {
			if (value == null) { return this.style.scrollPaddingBlock; }
			this.style.scrollPaddingBlock = value;
			return this;
		}

		// Specifies the distance in block direction from the end of the container to the snap position on the child elements.
		/*	@docs:
		 *	@title: Scroll padding block end
		 *	@description: 
		 *		Specifies the distance in block direction from the end of the container to the snap position on the child elements.
		 *		The equivalent of CSS attribute `scrollPaddingBlockEnd`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		scroll_padding_block_end(value) {
			if (value == null) { return this.style.scrollPaddingBlockEnd; }
			this.style.scrollPaddingBlockEnd = value;
			return this;
		}

		// Specifies the distance in block direction from the start of the container to the snap position on the child elements.
		/*	@docs:
		 *	@title: Scroll padding block start
		 *	@description: 
		 *		Specifies the distance in block direction from the start of the container to the snap position on the child elements.
		 *		The equivalent of CSS attribute `scrollPaddingBlockStart`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		scroll_padding_block_start(value) {
			if (value == null) { return this.style.scrollPaddingBlockStart; }
			this.style.scrollPaddingBlockStart = value;
			return this;
		}

		// Specifies the distance from the bottom of the container to the snap position on the child elements.
		/*	@docs:
		 *	@title: Scroll padding bottom
		 *	@description: 
		 *		Specifies the distance from the bottom of the container to the snap position on the child elements.
		 *		The equivalent of CSS attribute `scrollPaddingBottom`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		scroll_padding_bottom(value) {
			if (value == null) { return this.style.scrollPaddingBottom; }
			this.style.scrollPaddingBottom = this.pad_numeric(value);
			return this;
		}

		// Specifies the distance in inline direction from the container to the snap position on the child elements.
		/*	@docs:
		 *	@title: Scroll padding inline
		 *	@description: 
		 *		Specifies the distance in inline direction from the container to the snap position on the child elements.
		 *		The equivalent of CSS attribute `scrollPaddingInline`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		scroll_padding_inline(value) {
			if (value == null) { return this.style.scrollPaddingInline; }
			this.style.scrollPaddingInline = value;
			return this;
		}

		// Specifies the distance in inline direction from the end of the container to the snap position on the child elements.
		/*	@docs:
		 *	@title: Scroll padding inline end
		 *	@description: 
		 *		Specifies the distance in inline direction from the end of the container to the snap position on the child elements.
		 *		The equivalent of CSS attribute `scrollPaddingInlineEnd`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		scroll_padding_inline_end(value) {
			if (value == null) { return this.style.scrollPaddingInlineEnd; }
			this.style.scrollPaddingInlineEnd = value;
			return this;
		}

		// Specifies the distance in inline direction from the start of the container to the snap position on the child elements.
		/*	@docs:
		 *	@title: Scroll padding inline start
		 *	@description: 
		 *		Specifies the distance in inline direction from the start of the container to the snap position on the child elements.
		 *		The equivalent of CSS attribute `scrollPaddingInlineStart`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		scroll_padding_inline_start(value) {
			if (value == null) { return this.style.scrollPaddingInlineStart; }
			this.style.scrollPaddingInlineStart = value;
			return this;
		}

		// Specifies the distance from the left side of the container to the snap position on the child elements.
		/*	@docs:
		 *	@title: Scroll padding left
		 *	@description: 
		 *		Specifies the distance from the left side of the container to the snap position on the child elements.
		 *		The equivalent of CSS attribute `scrollPaddingLeft`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		scroll_padding_left(value) {
			if (value == null) { return this.style.scrollPaddingLeft; }
			this.style.scrollPaddingLeft = this.pad_numeric(value);
			return this;
		}

		// Specifies the distance from the right side of the container to the snap position on the child elements.
		/*	@docs:
		 *	@title: Scroll padding right
		 *	@description: 
		 *		Specifies the distance from the right side of the container to the snap position on the child elements.
		 *		The equivalent of CSS attribute `scrollPaddingRight`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		scroll_padding_right(value) {
			if (value == null) { return this.style.scrollPaddingRight; }
			this.style.scrollPaddingRight = this.pad_numeric(value);
			return this;
		}

		// Specifies the distance from the top of the container to the snap position on the child elements.
		/*	@docs:
		 *	@title: Scroll padding top
		 *	@description: 
		 *		Specifies the distance from the top of the container to the snap position on the child elements.
		 *		The equivalent of CSS attribute `scrollPaddingTop`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		scroll_padding_top(value) {
			if (value == null) { return this.style.scrollPaddingTop; }
			this.style.scrollPaddingTop = this.pad_numeric(value);
			return this;
		}

		// Specifies where to position elements when the user stops scrolling.
		/*	@docs:
		 *	@title: Scroll snap align
		 *	@description: 
		 *		Specifies where to position elements when the user stops scrolling.
		 *		The equivalent of CSS attribute `scrollSnapAlign`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		scroll_snap_align(value) {
			if (value == null) { return this.style.scrollSnapAlign; }
			this.style.scrollSnapAlign = value;
			return this;
		}

		// Specifies scroll behaviour after fast swipe on trackpad or touch screen.
		/*	@docs:
		 *	@title: Scroll snap stop
		 *	@description: 
		 *		Specifies scroll behaviour after fast swipe on trackpad or touch screen.
		 *		The equivalent of CSS attribute `scrollSnapStop`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		scroll_snap_stop(value) {
			if (value == null) { return this.style.scrollSnapStop; }
			this.style.scrollSnapStop = value;
			return this;
		}

		// Specifies how snap behaviour should be when scrolling.
		/*	@docs:
		 *	@title: Scroll snap type
		 *	@description: 
		 *		Specifies how snap behaviour should be when scrolling.
		 *		The equivalent of CSS attribute `scrollSnapType`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		scroll_snap_type(value) {
			if (value == null) { return this.style.scrollSnapType; }
			this.style.scrollSnapType = value;
			return this;
		}

		// Specifies the color of the scrollbar of an element.
		/*	@docs:
		 *	@title: Scrollbar color
		 *	@description: 
		 *		Specifies the color of the scrollbar of an element.
		 *		The equivalent of CSS attribute `scrollbarColor`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		scrollbar_color(value) {
			if (value == null) { return this.style.scrollbarColor; }
			this.style.scrollbarColor = value;
			return this;
		}

		// Specifies the width of a tab character.
		/*	@docs:
		 *	@title: Tab size
		 *	@description: 
		 *		Specifies the width of a tab character.
		 *		The equivalent of CSS attribute `tabSize`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		tab_size(value) {
			if (value == null) { return this.style.tabSize; }
			this.style.tabSize = value;
			this.style.msTabSize = value;
			this.style.webkitTabSize = value;
			this.style.MozTabSize = value;
			this.style.OTabSize = value;
			return this;
		}

		// Defines the algorithm used to lay out table cells, rows, and columns.
		/*	@docs:
		 *	@title: Table layout
		 *	@description: 
		 *		Defines the algorithm used to lay out table cells, rows, and columns.
		 *		The equivalent of CSS attribute `tableLayout`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		table_layout(value) {
			if (value == null) { return this.style.tableLayout; }
			this.style.tableLayout = value;
			return this;
		}

		// Specifies the horizontal alignment of text.
		/*	@docs:
		 *	@title: Text align
		 *	@description: 
		 *		Specifies the horizontal alignment of text.
		 *		The equivalent of CSS attribute `textAlign`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		text_align(value) {
			if (value == null) { return this.style.textAlign; }
			this.style.textAlign = value;
			return this;
		}

		// Describes how the last line of a block or a line right before a forced line break is aligned when text-align is "justify".
		/*	@docs:
		 *	@title: Text align last
		 *	@description: 
		 *		Describes how the last line of a block or a line right before a forced line break is aligned when text-align is "justify".
		 *		The equivalent of CSS attribute `textAlignLast`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		text_align_last(value) {
			if (value == null) { return this.style.textAlignLast; }
			this.style.textAlignLast = value;
			return this;
		}

		// Specifies the combination of multiple characters into the space of a single character.
		/*	@docs:
		 *	@title: Text combine upright
		 *	@description: 
		 *		Specifies the combination of multiple characters into the space of a single character.
		 *		The equivalent of CSS attribute `textCombineUpright`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		text_combine_upright(value) {
			if (value == null) { return this.style.textCombineUpright; }
			this.style.textCombineUpright = value;
			return this;
		}

		// Specifies the decoration added to text.
		/*	@docs:
		 *	@title: Text decoration
		 *	@description: 
		 *		Specifies the decoration added to text.
		 *		The equivalent of CSS attribute `textDecoration`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		text_decoration(value) {
			if (value == null) { return this.style.textDecoration; }
			this.style.textDecoration = value;
			return this;
		}

		// Specifies the color of the text-decoration.
		/*	@docs:
		 *	@title: Text decoration color
		 *	@description: 
		 *		Specifies the color of the text-decoration.
		 *		The equivalent of CSS attribute `textDecorationColor`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		text_decoration_color(value) {
			if (value == null) { return this.style.textDecorationColor; }
			this.style.textDecorationColor = value;
			return this;
		}

		// Specifies the type of line in a text-decoration.
		/*	@docs:
		 *	@title: Text decoration line
		 *	@description: 
		 *		Specifies the type of line in a text-decoration.
		 *		The equivalent of CSS attribute `textDecorationLine`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		text_decoration_line(value) {
			if (value == null) { return this.style.textDecorationLine; }
			this.style.textDecorationLine = value;
			return this;
		}

		// Specifies the style of the line in a text decoration.
		/*	@docs:
		 *	@title: Text decoration style
		 *	@description: 
		 *		Specifies the style of the line in a text decoration.
		 *		The equivalent of CSS attribute `textDecorationStyle`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		text_decoration_style(value) {
			if (value == null) { return this.style.textDecorationStyle; }
			this.style.textDecorationStyle = value;
			return this;
		}

		// Specifies the thickness of the decoration line.
		/*	@docs:
		 *	@title: Text decoration thickness
		 *	@description: 
		 *		Specifies the thickness of the decoration line.
		 *		The equivalent of CSS attribute `textDecorationThickness`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		text_decoration_thickness(value) {
			if (value == null) { return this.style.textDecorationThickness; }
			this.style.textDecorationThickness = value;
			return this;
		}

		// Applies emphasis marks to text.
		/*	@docs:
		 *	@title: Text emphasis
		 *	@description: 
		 *		Applies emphasis marks to text.
		 *		The equivalent of CSS attribute `textEmphasis`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		text_emphasis(value) {
			if (value == null) { return this.style.textEmphasis; }
			this.style.textEmphasis = value;
			return this;
		}

		// Specifies the indentation of the first line in a text-block.
		/*	@docs:
		 *	@title: Text indent
		 *	@description: 
		 *		Specifies the indentation of the first line in a text-block.
		 *		The equivalent of CSS attribute `textIndent`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		text_indent(value) {
			if (value == null) { return this.style.textIndent; }
			this.style.textIndent = value;
			return this;
		}

		// Specifies the justification method used when text-align is "justify".
		/*	@docs:
		 *	@title: Text justify
		 *	@description: 
		 *		Specifies the justification method used when text-align is "justify".
		 *		The equivalent of CSS attribute `textJustify`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		text_justify(value) {
			if (value == null) { return this.style.textJustify; }
			this.style.textJustify = value;
			return this;
		}

		// Defines the orientation of characters in a line.
		/*	@docs:
		 *	@title: Text orientation
		 *	@description: 
		 *		Defines the orientation of characters in a line.
		 *		The equivalent of CSS attribute `textOrientation`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		text_orientation(value) {
			if (value == null) { return this.style.textOrientation; }
			this.style.textOrientation = value;
			return this;
		}

		// Specifies what should happen when text overflows the containing element.
		/*	@docs:
		 *	@title: Text overflow
		 *	@description: 
		 *		Specifies what should happen when text overflows the containing element.
		 *		The equivalent of CSS attribute `textOverflow`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		text_overflow(value) {
			if (value == null) { return this.style.textOverflow; }
			this.style.textOverflow = value;
			return this;
		}

		// Adds shadow to text.
		/*	@docs:
		 *	@title: Text shadow
		 *	@description: 
		 *		Adds shadow to text.
		 *		The equivalent of CSS attribute `textShadow`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		text_shadow(value) {
			if (value == null) { return this.style.textShadow; }
			this.style.textShadow = value;
			return this;
		}

		// Controls the capitalization of text.
		/*	@docs:
		 *	@title: Text transform
		 *	@description: 
		 *		Controls the capitalization of text.
		 *		The equivalent of CSS attribute `textTransform`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		text_transform(value) {
			if (value == null) { return this.style.textTransform; }
			this.style.textTransform = value;
			return this;
		}

		// Specifies the position of the underline which is set using the text-decoration property.
		/*	@docs:
		 *	@title: Text underline position
		 *	@description: 
		 *		Specifies the position of the underline which is set using the text-decoration property.
		 *		The equivalent of CSS attribute `textUnderlinePosition`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		text_underline_position(value) {
			if (value == null) { return this.style.textUnderlinePosition; }
			this.style.textUnderlinePosition = value;
			return this;
		}

		// Specifies the top position of a positioned element.
		/*	@docs:
		 *	@title: Top
		 *	@description: 
		 *		Specifies the top position of a positioned element.
		 *		The equivalent of CSS attribute `top`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		top(value) {
			if (value == null) { return this.style.top; }
			this.style.top = this.pad_numeric(value);
			return this;
		}

		// Applies a 2D or 3D transformation to an element.
		/*	@docs:
		 *	@title: Transform
		 *	@description: 
		 *		Applies a 2D or 3D transformation to an element.
		 *		The equivalent of CSS attribute `transform`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		transform(value) {
			if (value == null) { return this.style.transform; }
			this.style.transform = value;
			this.style.msTransform = value;
			this.style.webkitTransform = value;
			this.style.MozTransform = value;
			this.style.OTransform = value;
			return this;
		}

		// Allows you to change the position on transformed elements.
		/*	@docs:
		 *	@title: Transform origin
		 *	@description: 
		 *		Allows you to change the position on transformed elements.
		 *		The equivalent of CSS attribute `transformOrigin`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		transform_origin(value) {
			if (value == null) { return this.style.transformOrigin; }
			this.style.transformOrigin = value;
			this.style.msTransformOrigin = value;
			this.style.webkitTransformOrigin = value;
			this.style.MozTransformOrigin = value;
			this.style.OTransformOrigin = value;
			return this;
		}

		// Specifies how nested elements are rendered in 3D space.
		/*	@docs:
		 *	@title: Transform style
		 *	@description: 
		 *		Specifies how nested elements are rendered in 3D space.
		 *		The equivalent of CSS attribute `transformStyle`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		transform_style(value) {
			if (value == null) { return this.style.transformStyle; }
			this.style.transformStyle = value;
			this.style.msTransformStyle = value;
			this.style.webkitTransformStyle = value;
			this.style.MozTransformStyle = value;
			this.style.OTransformStyle = value;
			return this;
		}

		// A shorthand property for all the transition properties.
		/*	@docs:
		 *	@title: Transition
		 *	@description: 
		 *		A shorthand property for all the transition properties.
		 *		The equivalent of CSS attribute `transition`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		transition(value) {
			if (value == null) { return this.style.transition; }
			this.style.transition = value;
			this.style.msTransition = value;
			this.style.webkitTransition = value;
			this.style.MozTransition = value;
			this.style.OTransition = value;
			return this;
		}

		// Specifies when the transition effect will start.
		/*	@docs:
		 *	@title: Transition delay
		 *	@description: 
		 *		Specifies when the transition effect will start.
		 *		The equivalent of CSS attribute `transitionDelay`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		transition_delay(value) {
			if (value == null) { return this.style.transitionDelay; }
			this.style.transitionDelay = value;
			this.style.msTransitionDelay = value;
			this.style.webkitTransitionDelay = value;
			this.style.MozTransitionDelay = value;
			this.style.OTransitionDelay = value;
			return this;
		}

		// Specifies how many seconds or milliseconds a transition effect takes to complete.
		/*	@docs:
		 *	@title: Transition duration
		 *	@description: 
		 *		Specifies how many seconds or milliseconds a transition effect takes to complete.
		 *		The equivalent of CSS attribute `transitionDuration`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		transition_duration(value) {
			if (value == null) { return this.style.transitionDuration; }
			this.style.transitionDuration = value;
			this.style.msTransitionDuration = value;
			this.style.webkitTransitionDuration = value;
			this.style.MozTransitionDuration = value;
			this.style.OTransitionDuration = value;
			return this;
		}

		// Specifies the name of the CSS property the transition effect is for.
		/*	@docs:
		 *	@title: Transition property
		 *	@description: 
		 *		Specifies the name of the CSS property the transition effect is for.
		 *		The equivalent of CSS attribute `transitionProperty`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		transition_property(value) {
			if (value == null) { return this.style.transitionProperty; }
			this.style.transitionProperty = value;
			this.style.msTransitionProperty = value;
			this.style.webkitTransitionProperty = value;
			this.style.MozTransitionProperty = value;
			this.style.OTransitionProperty = value;
			return this;
		}

		// Specifies the speed curve of the transition effect.
		/*	@docs:
		 *	@title: Transition timing function
		 *	@description: 
		 *		Specifies the speed curve of the transition effect.
		 *		The equivalent of CSS attribute `transitionTimingFunction`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		transition_timing_function(value) {
			if (value == null) { return this.style.transitionTimingFunction; }
			this.style.transitionTimingFunction = value;
			this.style.msTransitionTimingFunction = value;
			this.style.webkitTransitionTimingFunction = value;
			this.style.MozTransitionTimingFunction = value;
			this.style.OTransitionTimingFunction = value;
			return this;
		}

		// Specifies the position of an element.
		/*	@docs:
		 *	@title: Translate
		 *	@description: 
		 *		Specifies the position of an element.
		 *		The equivalent of CSS attribute `translate`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		translate(value) {
			if (value == null) { return this.style.translate; }
			this.style.translate = value;
			return this;
		}

		// Used together with the direction property to set or return whether the text should be overridden to support multiple languages in the same document.
		/*	@docs:
		 *	@title: Unicode bidi
		 *	@description: 
		 *		Used together with the direction property to set or return whether the text should be overridden to support multiple languages in the same document.
		 *		The equivalent of CSS attribute `unicodeBidi`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		unicode_bidi(value) {
			if (value == null) { return this.style.unicodeBidi; }
			this.style.unicodeBidi = value;
			return this;
		}

		// Specifies whether the text of an element can be selected.
		/*	@docs:
		 *	@title: User select
		 *	@description: 
		 *		Specifies whether the text of an element can be selected.
		 *		The equivalent of CSS attribute `userSelect`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		user_select(value) {
			if (value == null) { return this.style.userSelect; }
			this.style.userSelect = value;
			this.style.msUserSelect = value;
			this.style.webkitUserSelect = value;
			this.style.MozUserSelect = value;
			this.style.OUserSelect = value;
			return this;
		}

		// Sets the vertical alignment of an element.
		// vertical_align(value) {
		//     if (value == null) { return this.style.verticalAlign; }
		//     this.style.verticalAlign = value;
		//     return this;
		// }

		// Specifies whether or not an element is visible.
		/*	@docs:
		 *	@title: Visibility
		 *	@description: 
		 *		Specifies whether or not an element is visible.
		 *		The equivalent of CSS attribute `visibility`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		visibility(value) {
			if (value == null) { return this.style.visibility; }
			this.style.visibility = value;
			return this;
		}

		// Specifies how white-space inside an element is handled.
		/*	@docs:
		 *	@title: White space
		 *	@description: 
		 *		Specifies how white-space inside an element is handled.
		 *		The equivalent of CSS attribute `whiteSpace`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		white_space(value) {
			if (value == null) { return this.style.whiteSpace; }
			this.style.whiteSpace = value;
			return this;
		}

		// Sets the minimum number of lines that must be left at the top of a page or column.
		/*	@docs:
		 *	@title: Widows
		 *	@description: 
		 *		Sets the minimum number of lines that must be left at the top of a page or column.
		 *		The equivalent of CSS attribute `widows`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		widows(value) {
			if (value == null) { return this.style.widows; }
			this.style.widows = value;
			return this;
		}

		// Sets the width of an element.
		// width(value) {
		//     if (value == null) { return this.style.width; }
		//     this.style.width = this.pad_numeric(value);
		//     return this;
		// }

		// Specifies how words should break when reaching the end of a line.
		/*	@docs:
		 *	@title: Word break
		 *	@description: 
		 *		Specifies how words should break when reaching the end of a line.
		 *		The equivalent of CSS attribute `wordBreak`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		word_break(value) {
			if (value == null) { return this.style.wordBreak; }
			this.style.wordBreak = value;
			return this;
		}

		// Increases or decreases the space between words in a text.
		/*	@docs:
		 *	@title: Word spacing
		 *	@description: 
		 *		Increases or decreases the space between words in a text.
		 *		The equivalent of CSS attribute `wordSpacing`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		word_spacing(value) {
			if (value == null) { return this.style.wordSpacing; }
			this.style.wordSpacing = value;
			return this;
		}

		// Allows long, unbreakable words to be broken and wrap to the next line.
		/*	@docs:
		 *	@title: Word wrap
		 *	@description: 
		 *		Allows long, unbreakable words to be broken and wrap to the next line.
		 *		The equivalent of CSS attribute `wordWrap`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		word_wrap(value) {
			if (value == null) { return this.style.wordWrap; }
			this.style.wordWrap = value;
			return this;
		}

		// Specifies whether lines of text are laid out horizontally or vertically.
		/*	@docs:
		 *	@title: Writing mode
		 *	@description: 
		 *		Specifies whether lines of text are laid out horizontally or vertically.
		 *		The equivalent of CSS attribute `writingMode`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		writing_mode(value) {
			if (value == null) { return this.style.writingMode; }
			this.style.writingMode = value;
			return this;
		}

		// ---------------------------------------------------------
		// Automatically generated HTML attribute functions. 
		// Reference: https://www.w3schools.com/tags/ref_attributes.asp. 

		// Specifies the types of files that the server accepts (only for type="file").
		/*	@docs:
		 *	@title: Accept
		 *	@description: 
		 *		Specifies the types of files that the server accepts (only for type="file").
		 *		The equivalent of HTML attribute `accept`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		accept(value) {
			if (value == null) { return super.accept; }
			super.accept = value;
			return this;
		}

		// Specifies the character encodings that are to be used for the form submission.
		/*	@docs:
		 *	@title: Accept charset
		 *	@description: 
		 *		Specifies the character encodings that are to be used for the form submission.
		 *		The equivalent of HTML attribute `accept_charset`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		accept_charset(value) {
			if (value == null) { return super.accept_charset; }
			super.accept_charset = value;
			return this;
		}

		// Specifies where to send the form-data when a form is submitted.
		/*	@docs:
		 *	@title: Action
		 *	@description: 
		 *		Specifies where to send the form-data when a form is submitted.
		 *		The equivalent of HTML attribute `action`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		action(value) {
			if (value == null) { return super.action; }
			super.action = value;
			return this;
		}

		// Specifies that the script is executed asynchronously (only for external scripts).
		/*	@docs:
		 *	@title: Async
		 *	@description: 
		 *		Specifies that the script is executed asynchronously (only for external scripts).
		 *		The equivalent of HTML attribute `async`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		async(value) {
			if (value == null) { return super.async; }
			super.async = value;
			return this;
		}

		// Specifies whether the \<form> or the \<input> element should have autocomplete enabled.
		/*	@docs:
		 *	@title: Auto complete
		 *	@description: 
		 *		Specifies whether the \<form> or the \<input> element should have autocomplete enabled.
		 *		The equivalent of HTML attribute `autocomplete`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		auto_complete(value) {
			if (value == null) { return super.autocomplete; }
			super.autocomplete = value;
			return this;
		}

		// Specifies that the element should automatically get focus when the page loads.
		/*	@docs:
		 *	@title: Auto focus
		 *	@description: 
		 *		Specifies that the element should automatically get focus when the page loads.
		 *		The equivalent of HTML attribute `autofocus`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		auto_focus(value) {
			if (value == null) { return super.autofocus; }
			super.autofocus = value;
			return this;
		}

		// Specifies that the audio/video will start playing as soon as it is ready.
		/*	@docs:
		 *	@title: Auto play
		 *	@description: 
		 *		Specifies that the audio/video will start playing as soon as it is ready.
		 *		The equivalent of HTML attribute `autoplay`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		auto_play(value) {
			if (value == null) { return super.autoplay; }
			super.autoplay = value;
			return this;
		}

		// Specifies the character encoding.
		/*	@docs:
		 *	@title: Charset
		 *	@description: 
		 *		Specifies the character encoding.
		 *		The equivalent of HTML attribute `charset`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		charset(value) {
			if (value == null) { return super.charset; }
			super.charset = value;
			return this;
		}

		// Specifies that an \<input> element should be pre-selected when the page loads (for type="checkbox" or type="radio").
		/*	@docs:
		 *	@title: Checked
		 *	@description: 
		 *		Specifies that an \<input> element should be pre-selected when the page loads (for type="checkbox" or type="radio").
		 *		The equivalent of HTML attribute `checked`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		checked(value) {
			if (value == null) { return super.checked; }
			super.checked = value;
			return this;
		}

		// Specifies a URL which explains the quote/deleted/inserted text.
		/*	@docs:
		 *	@title: Cite
		 *	@description: 
		 *		Specifies a URL which explains the quote/deleted/inserted text.
		 *		The equivalent of HTML attribute `cite`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		cite(value) {
			if (value == null) { return super.cite; }
			super.cite = value;
			return this;
		}

		// Specifies one or more classnames for an element (refers to a class in a style sheet).
		// class(value) {
		//     if (value == null) { return super.class; }
		// 	super.class = value;
		// 	return this;
		// }

		// Specifies the visible width of a text area.
		/*	@docs:
		 *	@title: Cols
		 *	@description: 
		 *		Specifies the visible width of a text area.
		 *		The equivalent of HTML attribute `cols`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		cols(value) {
			if (value == null) { return super.cols; }
			super.cols = value;
			return this;
		}

		// Specifies the number of columns a table cell should span.
		/*	@docs:
		 *	@title: Colspan
		 *	@description: 
		 *		Specifies the number of columns a table cell should span.
		 *		The equivalent of HTML attribute `colspan`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		colspan(value) {
			if (value == null) { return super.colspan; }
			super.colspan = value;
			return this;
		}

		// Gives the value associated with the http-equiv or name attribute.
		/*	@docs:
		 *	@title: Content
		 *	@description: 
		 *		Gives the value associated with the http-equiv or name attribute.
		 *		The equivalent of HTML attribute `content`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		content(value) {
			if (value == null) { return super.content; }
			super.content = value;
			return this;
		}

		// Specifies whether the content of an element is editable or not.
		/*	@docs:
		 *	@title: Content editable
		 *	@description: 
		 *		Specifies whether the content of an element is editable or not.
		 *		The equivalent of HTML attribute `contenteditable`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		content_editable(value) {
			if (value == null) { return super.contenteditable; }
			super.contenteditable = value;
			return this;
		}

		// Specifies that audio/video controls should be displayed (such as a play/pause button etc).
		/*	@docs:
		 *	@title: Controls
		 *	@description: 
		 *		Specifies that audio/video controls should be displayed (such as a play/pause button etc).
		 *		The equivalent of HTML attribute `controls`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		controls(value) {
			if (value == null) { return super.controls; }
			super.controls = value;
			return this;
		}

		// Specifies the coordinates of the area.
		/*	@docs:
		 *	@title: Coords
		 *	@description: 
		 *		Specifies the coordinates of the area.
		 *		The equivalent of HTML attribute `coords`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		coords(value) {
			if (value == null) { return super.coords; }
			super.coords = value;
			return this;
		}

		// Specifies the URL of the resource to be used by the object.
		/*	@docs:
		 *	@title: Data
		 *	@description: 
		 *		Specifies the URL of the resource to be used by the object.
		 *		The equivalent of HTML attribute `data`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		data(value) {
			if (value == null) { return super.data; }
			super.data = value;
			return this;
		}

		// Specifies the date and time.
		/*	@docs:
		 *	@title: Datetime
		 *	@description: 
		 *		Specifies the date and time.
		 *		The equivalent of HTML attribute `datetime`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		datetime(value) {
			if (value == null) { return super.datetime; }
			super.datetime = value;
			return this;
		}

		// Specifies that the track is to be enabled if the user's preferences do not indicate that another track would be more appropriate.
		/*	@docs:
		 *	@title: Default
		 *	@description: 
		 *		Specifies that the track is to be enabled if the user's preferences do not indicate that another track would be more appropriate.
		 *		The equivalent of HTML attribute `default`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		default(value) {
			if (value == null) { return super.default; }
			super.default = value;
			return this;
		}

		// Specifies that the script is executed when the page has finished parsing (only for external scripts).
		/*	@docs:
		 *	@title: Defer
		 *	@description: 
		 *		Specifies that the script is executed when the page has finished parsing (only for external scripts).
		 *		The equivalent of HTML attribute `defer`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		defer(value) {
			if (value == null) { return super.defer; }
			super.defer = value;
			return this;
		}

		// Specifies the text direction for the content in an element.
		/*	@docs:
		 *	@title: Dir
		 *	@description: 
		 *		Specifies the text direction for the content in an element.
		 *		The equivalent of HTML attribute `dir`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		dir(value) {
			if (value == null) { return super.dir; }
			super.dir = value;
			return this;
		}

		// Specifies that the text direction will be submitted.
		/*	@docs:
		 *	@title: Dirname
		 *	@description: 
		 *		Specifies that the text direction will be submitted.
		 *		The equivalent of HTML attribute `dirname`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		dirname(value) {
			if (value == null) { return super.dirname; }
			super.dirname = value;
			return this;
		}

		// Specifies that the specified element/group of elements should be disabled.
		/*	@docs:
		 *	@title: Disabled
		 *	@description: 
		 *		Specifies that the specified element/group of elements should be disabled.
		 *		The equivalent of HTML attribute `disabled`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		disabled(value) {
			if (value == null) { return super.disabled; }
			super.disabled = value;
			return this;
		}

		// Specifies whether an element is draggable or not.
		/*	@docs:
		 *	@title: Draggable
		 *	@description: 
		 *		Specifies whether an element is draggable or not.
		 *		The equivalent of HTML attribute `draggable`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		draggable(value) {
			if (value == null) { return super.draggable; }
			super.draggable = value;
			return this;
		}

		// Specifies how the form-data should be encoded when submitting it to the server (only for method="post").
		/*	@docs:
		 *	@title: Enctype
		 *	@description: 
		 *		Specifies how the form-data should be encoded when submitting it to the server (only for method="post").
		 *		The equivalent of HTML attribute `enctype`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		enctype(value) {
			if (value == null) { return super.enctype; }
			super.enctype = value;
			return this;
		}

		// Specifies which form element(s) a label/calculation is bound to.
		/*	@docs:
		 *	@title: For
		 *	@description: 
		 *		Specifies which form element(s) a label/calculation is bound to.
		 *		The equivalent of HTML attribute `for`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		for(value) {
			if (value == null) { return super.for; }
			super.for = value;
			return this;
		}

		// Specifies the name of the form the element belongs to.
		/*	@docs:
		 *	@title: Form
		 *	@description: 
		 *		Specifies the name of the form the element belongs to.
		 *		The equivalent of HTML attribute `form`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		form(value) {
			if (value == null) { return super.form; }
			super.form = value;
			return this;
		}

		// Specifies where to send the form-data when a form is submitted. Only for type="submit".
		/*	@docs:
		 *	@title: Form action
		 *	@description: 
		 *		Specifies where to send the form-data when a form is submitted. Only for type="submit".
		 *		The equivalent of HTML attribute `formaction`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		form_action(value) {
			if (value == null) { return super.formaction; }
			super.formaction = value;
			return this;
		}

		// Specifies one or more headers cells a cell is related to.
		/*	@docs:
		 *	@title: Headers
		 *	@description: 
		 *		Specifies one or more headers cells a cell is related to.
		 *		The equivalent of HTML attribute `headers`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		headers(value) {
			if (value == null) { return super.headers; }
			super.headers = value;
			return this;
		}

		// Specifies the height of the element.
		// height(value) {
		//     if (value == null) { return super.height; }
		// 	super.height = this.pad_numeric(value);
		// 	return this;
		// }

		// Specifies that an element is not yet, or is no longer, relevant.
		// hidden(value) {
		//     if (value == null) { return super.hidden; }
		// 	super.hidden = value;
		// 	return this;
		// }

		// Specifies the range that is considered to be a high value.
		/*	@docs:
		 *	@title: High
		 *	@description: 
		 *		Specifies the range that is considered to be a high value.
		 *		The equivalent of HTML attribute `high`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		high(value) {
			if (value == null) { return super.high; }
			super.high = value;
			return this;
		}

		// Specifies the URL of the page the link goes to.
		/*	@docs:
		 *	@title: Href
		 *	@description: 
		 *		Specifies the URL of the page the link goes to.
		 *		The equivalent of HTML attribute `href`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		href(value) {
			if (value == null) { return super.href; }
			super.href = value;
			return this;
		}

		// Specifies the language of the linked document.
		/*	@docs:
		 *	@title: Href lang
		 *	@description: 
		 *		Specifies the language of the linked document.
		 *		The equivalent of HTML attribute `hreflang`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		href_lang(value) {
			if (value == null) { return super.hreflang; }
			super.hreflang = value;
			return this;
		}

		// Provides an HTTP header for the information/value of the content attribute.
		/*	@docs:
		 *	@title: Http equiv
		 *	@description: 
		 *		Provides an HTTP header for the information/value of the content attribute.
		 *		The equivalent of HTML attribute `http_equiv`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		http_equiv(value) {
			if (value == null) { return super.http_equiv; }
			super.http_equiv = value;
			return this;
		}

		// Specifies a unique id for an element.
		/*	@docs:
		 *	@title: Id
		 *	@description: 
		 *		Specifies a unique id for an element.
		 *		The equivalent of HTML attribute `id`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		id(value) {
			if (value == null) { return super.id; }
			super.id = value;
			return this;
		}

		// Specifies an image as a server-side image map.
		/*	@docs:
		 *	@title: Is map
		 *	@description: 
		 *		Specifies an image as a server-side image map.
		 *		The equivalent of HTML attribute `ismap`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		is_map(value) {
			if (value == null) { return super.ismap; }
			super.ismap = value;
			return this;
		}

		// Specifies the kind of text track.
		/*	@docs:
		 *	@title: Kind
		 *	@description: 
		 *		Specifies the kind of text track.
		 *		The equivalent of HTML attribute `kind`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		kind(value) {
			if (value == null) { return super.kind; }
			super.kind = value;
			return this;
		}

		// Specifies the title of the text track.
		/*	@docs:
		 *	@title: Label
		 *	@description: 
		 *		Specifies the title of the text track.
		 *		The equivalent of HTML attribute `label`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		label(value) {
			if (value == null) { return super.label; }
			super.label = value;
			return this;
		}

		// Specifies the language of the element's content.
		/*	@docs:
		 *	@title: Lang
		 *	@description: 
		 *		Specifies the language of the element's content.
		 *		The equivalent of HTML attribute `lang`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		lang(value) {
			if (value == null) { return super.lang; }
			super.lang = value;
			return this;
		}

		// Refers to a \<datalist> element that contains pre-defined options for an \<input> element.
		/*	@docs:
		 *	@title: List
		 *	@description: 
		 *		Refers to a \<datalist> element that contains pre-defined options for an \<input> element.
		 *		The equivalent of HTML attribute `list`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		list(value) {
			if (value == null) { return super.list; }
			super.list = value;
			return this;
		}

		// Specifies that the audio/video will start over again, every time it is finished.
		/*	@docs:
		 *	@title: Loop
		 *	@description: 
		 *		Specifies that the audio/video will start over again, every time it is finished.
		 *		The equivalent of HTML attribute `loop`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		loop(value) {
			if (value == null) { return super.loop; }
			super.loop = value;
			return this;
		}

		// Specifies the range that is considered to be a low value.
		/*	@docs:
		 *	@title: Low
		 *	@description: 
		 *		Specifies the range that is considered to be a low value.
		 *		The equivalent of HTML attribute `low`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		low(value) {
			if (value == null) { return super.low; }
			super.low = value;
			return this;
		}

		// Specifies the maximum value.
		/*	@docs:
		 *	@title: Max
		 *	@description: 
		 *		Specifies the maximum value.
		 *		The equivalent of HTML attribute `max`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		max(value) {
			if (value == null) { return super.max; }
			super.max = value;
			return this;
		}

		// Specifies the maximum number of characters allowed in an element.
		/*	@docs:
		 *	@title: Max length
		 *	@description: 
		 *		Specifies the maximum number of characters allowed in an element.
		 *		The equivalent of HTML attribute `maxlength`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		max_length(value) {
			if (value == null) { return super.maxlength; }
			super.maxlength = value;
			return this;
		}

		// Specifies what media/device the linked document is optimized for.
		// media(value) {
		//     if (value == null) { return super.media; }
		// 	super.media = value;
		// 	return this;
		// }

		// Specifies the HTTP method to use when sending form-data.
		/*	@docs:
		 *	@title: Method
		 *	@description: 
		 *		Specifies the HTTP method to use when sending form-data.
		 *		The equivalent of HTML attribute `method`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		method(value) {
			if (value == null) { return super.method; }
			super.method = value;
			return this;
		}

		// Specifies a minimum value.
		/*	@docs:
		 *	@title: Min
		 *	@description: 
		 *		Specifies a minimum value.
		 *		The equivalent of HTML attribute `min`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		min(value) {
			if (value == null) { return super.min; }
			super.min = value;
			return this;
		}

		// Specifies that a user can enter more than one value.
		/*	@docs:
		 *	@title: Multiple
		 *	@description: 
		 *		Specifies that a user can enter more than one value.
		 *		The equivalent of HTML attribute `multiple`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		multiple(value) {
			if (value == null) { return super.multiple; }
			super.multiple = value;
			return this;
		}

		// Specifies that the audio output of the video should be muted.
		/*	@docs:
		 *	@title: Muted
		 *	@description: 
		 *		Specifies that the audio output of the video should be muted.
		 *		The equivalent of HTML attribute `muted`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		muted(value) {
			if (value == null) { return super.muted; }
			super.muted = value;
			return this;
		}

		// Specifies the name of the element.
		// name(value) {
		//     if (value == null) { return super.name; }
		// 	super.name = value;
		// 	return this;
		// }

		// Specifies that the form should not be validated when submitted.
		/*	@docs:
		 *	@title: No validate
		 *	@description: 
		 *		Specifies that the form should not be validated when submitted.
		 *		The equivalent of HTML attribute `novalidate`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		no_validate(value) {
			if (value == null) { return super.novalidate; }
			super.novalidate = value;
			return this;
		}

		// Specifies that the details should be visible (open) to the user.
		/*	@docs:
		 *	@title: Open
		 *	@description: 
		 *		Specifies that the details should be visible (open) to the user.
		 *		The equivalent of HTML attribute `open`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		open(value) {
			if (value == null) { return super.open; }
			super.open = value;
			return this;
		}

		// Specifies what value is the optimal value for the gauge.
		/*	@docs:
		 *	@title: Optimum
		 *	@description: 
		 *		Specifies what value is the optimal value for the gauge.
		 *		The equivalent of HTML attribute `optimum`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		optimum(value) {
			if (value == null) { return super.optimum; }
			super.optimum = value;
			return this;
		}

		// Specifies a regular expression that an \<input> element's value is checked against.
		/*	@docs:
		 *	@title: Pattern
		 *	@description: 
		 *		Specifies a regular expression that an \<input> element's value is checked against.
		 *		The equivalent of HTML attribute `pattern`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		pattern(value) {
			if (value == null) { return super.pattern; }
			super.pattern = value;
			return this;
		}

		// Specifies a short hint that describes the expected value of the element.
		/*	@docs:
		 *	@title: Placeholder
		 *	@description: 
		 *		Specifies a short hint that describes the expected value of the element.
		 *		The equivalent of HTML attribute `placeholder`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		placeholder(value) {
			if (value == null) { return super.placeholder; }
			super.placeholder = value;
			return this;
		}

		// Specifies an image to be shown while the video is downloading, or until the user hits the play button.
		/*	@docs:
		 *	@title: Poster
		 *	@description: 
		 *		Specifies an image to be shown while the video is downloading, or until the user hits the play button.
		 *		The equivalent of HTML attribute `poster`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		poster(value) {
			if (value == null) { return super.poster; }
			super.poster = value;
			return this;
		}

		// Specifies if and how the author thinks the audio/video should be loaded when the page loads.
		/*	@docs:
		 *	@title: Preload
		 *	@description: 
		 *		Specifies if and how the author thinks the audio/video should be loaded when the page loads.
		 *		The equivalent of HTML attribute `preload`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		preload(value) {
			if (value == null) { return super.preload; }
			super.preload = value;
			return this;
		}

		// Specifies the relationship between the current document and the linked document.
		/*	@docs:
		 *	@title: Rel
		 *	@description: 
		 *		Specifies the relationship between the current document and the linked document.
		 *		The equivalent of HTML attribute `rel`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		rel(value) {
			if (value == null) { return super.rel; }
			super.rel = value;
			return this;
		}

		// Specifies that the element must be filled out before submitting the form.
		/*	@docs:
		 *	@title: Required
		 *	@description: 
		 *		Specifies that the element must be filled out before submitting the form.
		 *		The equivalent of HTML attribute `required`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		required(value) {
			if (value == null) { return super.required; }
			super.required = value;
			return this;
		}

		// Specifies that the list order should be descending (9,8,7...).
		/*	@docs:
		 *	@title: Reversed
		 *	@description: 
		 *		Specifies that the list order should be descending (9,8,7...).
		 *		The equivalent of HTML attribute `reversed`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		reversed(value) {
			if (value == null) { return super.reversed; }
			super.reversed = value;
			return this;
		}

		// Specifies the visible number of lines in a text area.
		/*	@docs:
		 *	@title: Rows
		 *	@description: 
		 *		Specifies the visible number of lines in a text area.
		 *		The equivalent of HTML attribute `rows`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		rows(value) {
			if (value == null) { return super.rows; }
			super.rows = value;
			return this;
		}

		// Specifies the number of rows a table cell should span.
		/*	@docs:
		 *	@title: Row span
		 *	@description: 
		 *		Specifies the number of rows a table cell should span.
		 *		The equivalent of HTML attribute `rowspan`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		row_span(value) {
			if (value == null) { return super.rowspan; }
			super.rowspan = value;
			return this;
		}

		// Enables an extra set of restrictions for the content in an \<iframe>.
		/*	@docs:
		 *	@title: Sandbox
		 *	@description: 
		 *		Enables an extra set of restrictions for the content in an \<iframe>.
		 *		The equivalent of HTML attribute `sandbox`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		sandbox(value) {
			if (value == null) { return super.sandbox; }
			super.sandbox = value;
			return this;
		}

		// Specifies whether a header cell is a header for a column, row, or group of columns or rows.
		/*	@docs:
		 *	@title: Scope
		 *	@description: 
		 *		Specifies whether a header cell is a header for a column, row, or group of columns or rows.
		 *		The equivalent of HTML attribute `scope`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		scope(value) {
			if (value == null) { return super.scope; }
			super.scope = value;
			return this;
		}

		// Specifies that an option should be pre-selected when the page loads.
		/*	@docs:
		 *	@title: Selected
		 *	@description: 
		 *		Specifies that an option should be pre-selected when the page loads.
		 *		The equivalent of HTML attribute `selected`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		selected(value) {
			if (value == null) { return super.selected; }
			super.selected = value;
			return this;
		}

		// Specifies the shape of the area.
		/*	@docs:
		 *	@title: Shape
		 *	@description: 
		 *		Specifies the shape of the area.
		 *		The equivalent of HTML attribute `shape`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		shape(value) {
			if (value == null) { return super.shape; }
			super.shape = value;
			return this;
		}

		// Specifies the width, in characters (for \<input>) or specifies the number of visible options (for \<select>).
		/*	@docs:
		 *	@title: Size
		 *	@description: 
		 *		Specifies the width, in characters (for \<input>) or specifies the number of visible options (for \<select>).
		 *		The equivalent of HTML attribute `size`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		size(value) {
			if (value == null) { return super.size; }
			super.size = value;
			return this;
		}

		// Specifies the size of the linked resource.
		/*	@docs:
		 *	@title: Sizes
		 *	@description: 
		 *		Specifies the size of the linked resource.
		 *		The equivalent of HTML attribute `sizes`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		sizes(value) {
			if (value == null) { return super.sizes; }
			super.sizes = value;
			return this;
		}

		// Specifies the number of columns to span.
		/*	@docs:
		 *	@title: Span
		 *	@description: 
		 *		Specifies the number of columns to span.
		 *		The equivalent of HTML attribute `span`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		span(value) {
			if (value == null) { return super.span; }
			super.span = value;
			return this;
		}

		// Specifies whether the element is to have its spelling and grammar checked or not.
		/*	@docs:
		 *	@title: Spell check
		 *	@description: 
		 *		Specifies whether the element is to have its spelling and grammar checked or not.
		 *		The equivalent of HTML attribute `spellcheck`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		spell_check(value) {
			if (value == null) { return super.spellcheck; }
			super.spellcheck = value;
			return this;
		}

		// Specifies the URL of the media file.
		/*	@docs:
		 *	@title: Src
		 *	@description: 
		 *		Specifies the URL of the media file.
		 *		The equivalent of HTML attribute `src`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		src(value) {
			if (value == null) { return super.src; }
			super.src = value;
			return this;
		}

		// Specifies the HTML content of the page to show in the \<iframe>.
		/*	@docs:
		 *	@title: Src doc
		 *	@description: 
		 *		Specifies the HTML content of the page to show in the \<iframe>.
		 *		The equivalent of HTML attribute `srcdoc`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		src_doc(value) {
			if (value == null) { return super.srcdoc; }
			super.srcdoc = value;
			return this;
		}

		// Specifies the language of the track text data (required if kind="subtitles").
		/*	@docs:
		 *	@title: Src lang
		 *	@description: 
		 *		Specifies the language of the track text data (required if kind="subtitles").
		 *		The equivalent of HTML attribute `srclang`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		src_lang(value) {
			if (value == null) { return super.srclang; }
			super.srclang = value;
			return this;
		}

		// Specifies the URL of the image to use in different situations.
		/*	@docs:
		 *	@title: Rrsrc set
		 *	@description: 
		 *		Specifies the URL of the image to use in different situations.
		 *		The equivalent of HTML attribute `srcset`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		rrsrc_set(value) {
			if (value == null) { return super.srcset; }
			super.srcset = value;
			return this;
		}

		// Specifies the start value of an ordered list.
		/*	@docs:
		 *	@title: Start
		 *	@description: 
		 *		Specifies the start value of an ordered list.
		 *		The equivalent of HTML attribute `start`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		start(value) {
			if (value == null) { return super.start; }
			super.start = value;
			return this;
		}

		// Specifies the legal number intervals for an input field.
		/*	@docs:
		 *	@title: Step
		 *	@description: 
		 *		Specifies the legal number intervals for an input field.
		 *		The equivalent of HTML attribute `step`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		step(value) {
			if (value == null) { return super.step; }
			super.step = value;
			return this;
		}

		// Specifies an inline CSS style for an element.
		// style(value) {
		//     if (value == null) { return super.style; }
		// 	super.style = value;
		// 	return this;
		// }

		// Specifies the tabbing order of an element.
		/*	@docs:
		 *	@title: Tab index
		 *	@description: 
		 *		Specifies the tabbing order of an element.
		 *		The equivalent of HTML attribute `tabindex`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		tab_index(value) {
			if (value == null) { return super.tabindex; }
			super.tabindex = value;
			return this;
		}

		// Specifies the target for where to open the linked document or where to submit the form.
		/*	@docs:
		 *	@title: Target
		 *	@description: 
		 *		Specifies the target for where to open the linked document or where to submit the form.
		 *		The equivalent of HTML attribute `target`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		target(value) {
			if (value == null) { return super.target; }
			super.target = value;
			return this;
		}

		// Specifies extra information about an element.
		/*	@docs:
		 *	@title: Title
		 *	@description: 
		 *		Specifies extra information about an element.
		 *		The equivalent of HTML attribute `title`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		title(value) {
			if (value == null) { return super.title; }
			super.title = value;
			return this;
		}

		// Specifies whether the content of an element should be translated or not.
		/*	@docs:
		 *	@title: Translate
		 *	@description: 
		 *		Specifies whether the content of an element should be translated or not.
		 *		The equivalent of HTML attribute `translate`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		translate(value) {
			if (value == null) { return super.translate; }
			super.translate = value;
			return this;
		}

		// Specifies the type of element.
		/*	@docs:
		 *	@title: Type
		 *	@description: 
		 *		Specifies the type of element.
		 *		The equivalent of HTML attribute `type`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		type(value) {
			if (value == null) { return super.type; }
			super.type = value;
			return this;
		}

		// Specifies an image as a client-side image map.
		/*	@docs:
		 *	@title: Use map
		 *	@description: 
		 *		Specifies an image as a client-side image map.
		 *		The equivalent of HTML attribute `usemap`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		use_map(value) {
			if (value == null) { return super.usemap; }
			super.usemap = value;
			return this;
		}

		// Specifies the value of the element.
		/*	@docs:
		 *	@title: Value
		 *	@description: 
		 *		Specifies the value of the element.
		 *		The equivalent of HTML attribute `value`.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		value(value) {
			if (value == null) { return super.value; }
			super.value = value;
			return this;
		}

		// Specifies the width of the element.
		// width(value) {
		//     if (value == null) { return super.width; }
		// 	super.width = this.pad_numeric(value);
		// 	return this;
		// }

		// Specifies how the text in a text area is to be wrapped when submitted in a form.
		// wrap(value) {
		//     if (value == null) { return super.wrap; }
		// 	super.wrap = value;
		// 	return this;
		// }

		// Script to be run after the document is printed.
		/*	@docs:
		 *	@title: On after print
		 *	@description: 
		 *		Script to be run after the document is printed.
		 *		The equivalent of HTML attribute `onafterprint`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_after_print(callback) {
			if (callback == null) { return this.onafterprint; }
			const e = this;
			this.onafterprint = (t) => callback(e, t);
			return this;
		}

		// Script to be run before the document is printed.
		/*	@docs:
		 *	@title: On before print
		 *	@description:
		 *		Script to be run before the document is printed.
		 *		The equivalent of HTML attribute `onbeforeprint`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_before_print(callback) {
			if (callback == null) { return this.onbeforeprint; }
			const e = this;
			this.onbeforeprint = (t) => callback(e, t);
			return this;
		}

		// Script to be run when the document is about to be unloaded.
		/*	@docs:
		 *	@title: On before unload
		 *	@description: 
		 *		Script to be run when the document is about to be unloaded.
		 *		The equivalent of HTML attribute `onbeforeunload`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_before_unload(callback) {
			if (callback == null) { return this.onbeforeunload; }
			const e = this;
			this.onbeforeunload = (t) => callback(e, t);
			return this;
		}

		// Script to be run when an error occurs.
		/*	@docs:
		 *	@title: On error
		 *	@description: 
		 *		Script to be run when an error occurs.
		 *		The equivalent of HTML attribute `onerror`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_error(callback) {
			if (callback == null) { return this.onerror; }
			const e = this;
			this.onerror = (t) => callback(e, t);
			return this;
		}

		// Script to be run when there has been changes to the anchor part of the a URL.
		/*	@docs:
		 *	@title: On hash change
		 *	@description: 
		 *		Script to be run when there has been changes to the anchor part of the a URL.
		 *		The equivalent of HTML attribute `onhashchange`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_hash_change(callback) {
			if (callback == null) { return this.onhashchange; }
			const e = this;
			this.onhashchange = (t) => callback(e, t);
			return this;
		}

		// Fires after the page is finished loading.
		/*	DEPRC docs:
		 *	@title: On load
		 *	@description: 
		 *		Fires after the page is finished loading.
		 *		The equivalent of HTML attribute `onload`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		// on_load(callback) {
		// 	if (callback == null) { return this.onload; }
		// 	const e = this;
		// 	this.onload = (t) => callback(e, t);
		// 	return this;
		// }

		// Script to be run when the message is triggered.
		/*	@docs:
		 *	@title: On message
		 *	@description: 
		 *		Script to be run when the message is triggered.
		 *		The equivalent of HTML attribute `onmessage`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_message(callback) {
			if (callback == null) { return this.onmessage; }
			const e = this;
			this.onmessage = (t) => callback(e, t);
			return this;
		}

		// Script to be run when the browser starts to work offline.
		/*	@docs:
		 *	@title: On offline
		 *	@description: 
		 *		Script to be run when the browser starts to work offline.
		 *		The equivalent of HTML attribute `onoffline`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_offline(callback) {
			if (callback == null) { return this.onoffline; }
			const e = this;
			this.onoffline = (t) => callback(e, t);
			return this;
		}

		// Script to be run when the browser starts to work online.
		/*	@docs:
		 *	@title: On online
		 *	@description: 
		 *		Script to be run when the browser starts to work online.
		 *		The equivalent of HTML attribute `ononline`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_online(callback) {
			if (callback == null) { return this.ononline; }
			const e = this;
			this.ononline = (t) => callback(e, t);
			return this;
		}

		// Script to be run when a user navigates away from a page.
		/*	@docs:
		 *	@title: On page hide
		 *	@description: 
		 *		Script to be run when a user navigates away from a page.
		 *		The equivalent of HTML attribute `onpagehide`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_page_hide(callback) {
			if (callback == null) { return this.onpagehide; }
			const e = this;
			this.onpagehide = (t) => callback(e, t);
			return this;
		}

		// Script to be run when a user navigates to a page.
		/*	@docs:
		 *	@title: On page show
		 *	@description: 
		 *		Script to be run when a user navigates to a page.
		 *		The equivalent of HTML attribute `onpageshow`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_page_show(callback) {
			if (callback == null) { return this.onpageshow; }
			const e = this;
			this.onpageshow = (t) => callback(e, t);
			return this;
		}

		// Script to be run when the window's history changes.
		/*	@docs:
		 *	@title: On popstate
		 *	@description: 
		 *		Script to be run when the window's history changes.
		 *		The equivalent of HTML attribute `onpopstate`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_popstate(callback) {
			if (callback == null) { return this.onpopstate; }
			const e = this;
			this.onpopstate = (t) => callback(e, t);
			return this;
		}

		// Script to be run when a Web Storage area is updated.
		/*	@docs:
		 *	@title: On storage
		 *	@description: 
		 *		Script to be run when a Web Storage area is updated.
		 *		The equivalent of HTML attribute `onstorage`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_storage(callback) {
			if (callback == null) { return this.onstorage; }
			const e = this;
			this.onstorage = (t) => callback(e, t);
			return this;
		}

		// Fires once a page has unloaded (or the browser window has been closed).
		/*	@docs:
		 *	@title: On unload
		 *	@description: 
		 *		Fires once a page has unloaded (or the browser window has been closed).
		 *		The equivalent of HTML attribute `onunload`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_unload(callback) {
			if (callback == null) { return this.onunload; }
			const e = this;
			this.onunload = (t) => callback(e, t);
			return this;
		}

		// Fires the moment that the element loses focus.
		/*	@docs:
		 *	@title: On blur
		 *	@description: 
		 *		Fires the moment that the element loses focus.
		 *		The equivalent of HTML attribute `onblur`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_blur(callback) {
			if (callback == null) { return this.onblur; }
			const e = this;
			this.onblur = (t) => callback(e, t);
			return this;
		}

		// Fires the moment when the value of the element is changed.
		/*	@docs:
		 *	@title: On change
		 *	@description: 
		 *		Fires the moment when the value of the element is changed.
		 *		The equivalent of HTML attribute `onchange`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_change(callback) {
			if (callback == null) { return this.onchange; }
			const e = this;
			this.onchange = (t) => callback(e, t);
			return this;
		}

		// Fires the moment when the element gets focus.
		/*	@docs:
		 *	@title: On focus
		 *	@description: 
		 *		Fires the moment when the element gets focus.
		 *		The equivalent of HTML attribute `onfocus`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_focus(callback) {
			if (callback == null) { return this.onfocus; }
			const e = this;
			this.onfocus = (t) => callback(e, t);
			return this;
		}

		// Script to be run when an element gets user input.
		/*	@docs:
		 *	@title: On input
		 *	@description: 
		 *		Script to be run when an element gets user input.
		 *		The equivalent of HTML attribute `oninput`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_input(callback) {
			if (callback == null) { return this.oninput; }
			const e = this;
			this.oninput = (t) => callback(e, t);
			return this;
		}

		// Script to be run before an element gets user input.
		/*	@docs:
		 *	@title: On input
		 *	@description: 
		 *		Script to be run before an element gets user input.
		 *		The equivalent of HTML attribute `onbeforeinput`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_before_input(callback) {
			if (callback == null) { return this.onbeforeinput; }
			const e = this;
			this.onbeforeinput = (t) => callback(e, t);
			return this;
		}

		// Script to be run when an element is invalid.
		/*	@docs:
		 *	@title: On invalid
		 *	@description: 
		 *		Script to be run when an element is invalid.
		 *		The equivalent of HTML attribute `oninvalid`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_invalid(callback) {
			if (callback == null) { return this.oninvalid; }
			const e = this;
			this.oninvalid = (t) => callback(e, t);
			return this;
		}

		// Fires when the Reset button in a form is clicked.
		/*	@docs:
		 *	@title: On reset
		 *	@description: 
		 *		Fires when the Reset button in a form is clicked.
		 *		The equivalent of HTML attribute `onreset`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_reset(callback) {
			if (callback == null) { return this.onreset; }
			const e = this;
			this.onreset = (t) => callback(e, t);
			return this;
		}

		// Fires when the user writes something in a search field (for \<input="search">).
		/*	@docs:
		 *	@title: On search
		 *	@description: 
		 *		Fires when the user writes something in a search field (for \<input="search">).
		 *		The equivalent of HTML attribute `onsearch`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_search(callback) {
			if (callback == null) { return this.onsearch; }
			const e = this;
			this.onsearch = (t) => callback(e, t);
			return this;
		}

		// Fires after some text has been selected in an element.
		/*	@docs:
		 *	@title: On select
		 *	@description: 
		 *		Fires after some text has been selected in an element.
		 *		The equivalent of HTML attribute `onselect`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_select(callback) {
			if (callback == null) { return this.onselect; }
			const e = this;
			this.onselect = (t) => callback(e, t);
			return this;
		}

		// Fires when a form is submitted.
		/*	@docs:
		 *	@title: On submit
		 *	@description: 
		 *		Fires when a form is submitted.
		 *		The equivalent of HTML attribute `onsubmit`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_submit(callback) {
			if (callback == null) { return this.onsubmit; }
			const e = this;
			this.onsubmit = (t) => callback(e, t);
			return this;
		}

		// Fires when a user is pressing a key.
		/*	@docs:
		 *	@title: On key down
		 *	@description: 
		 *		Fires when a user is pressing a key.
		 *		The equivalent of HTML attribute `onkeydown`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_key_down(callback) {
			if (callback == null) { return this.onkeydown; }
			const e = this;
			this.onkeydown = (t) => callback(e, t);
			return this;
		}

		// Fires when a user presses a key.
		/*	@docs:
		 *	@title: On key press
		 *	@description: 
		 *		Fires when a user presses a key.
		 *		The equivalent of HTML attribute `onkeypress`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_key_press(callback) {
			if (callback == null) { return this.onkeypress; }
			const e = this;
			this.onkeypress = (t) => callback(e, t);
			return this;
		}

		// Fires when a user releases a key.
		/*	@docs:
		 *	@title: On key up
		 *	@description: 
		 *		Fires when a user releases a key.
		 *		The equivalent of HTML attribute `onkeyup`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_key_up(callback) {
			if (callback == null) { return this.onkeyup; }
			const e = this;
			this.onkeyup = (t) => callback(e, t);
			return this;
		}

		// Fires on a mouse click on the element.
		// on_click(callback) {
		//     if (callback == null) { return this.onclick; }
		// 	const e = this;
		// 	this.onclick = (t) => callback(e, t);
		// 	return this;
		// }

		// Fires on a mouse double-click on the element.
		/*	@docs:
		 *	@title: On dbl click
		 *	@description: 
		 *		Fires on a mouse double-click on the element.
		 *		The equivalent of HTML attribute `ondblclick`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_dbl_click(callback) {
			if (callback == null) { return this.ondblclick; }
			const e = this;
			this.ondblclick = (t) => callback(e, t);
			return this;
		}

		// Fires when a mouse button is pressed down on an element.
		/*	@docs:
		 *	@title: On mouse down
		 *	@description: 
		 *		Fires when a mouse button is pressed down on an element.
		 *		The equivalent of HTML attribute `onmousedown`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_mouse_down(callback) {
			if (callback == null) { return this.onmousedown; }
			const e = this;
			this.onmousedown = (t) => callback(e, t);
			return this;
		}

		// Fires when the mouse pointer is moving while it is over an element.
		/*	@docs:
		 *	@title: On mouse move
		 *	@description: 
		 *		Fires when the mouse pointer is moving while it is over an element.
		 *		The equivalent of HTML attribute `onmousemove`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_mouse_move(callback) {
			if (callback == null) { return this.onmousemove; }
			const e = this;
			this.onmousemove = (t) => callback(e, t);
			return this;
		}

		// Fires when the mouse pointer moves out of an element.
		/*	@docs:
		 *	@title: On mouse out
		 *	@description: 
		 *		Fires when the mouse pointer moves out of an element.
		 *		The equivalent of HTML attribute `onmouseout`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_mouse_out(callback) {
			if (callback == null) { return this.onmouseout; }
			const e = this;
			this.onmouseout = (t) => callback(e, t);
			return this;
		}

		// Fires when the mouse pointer moves over an element.
		/*	@docs:
		 *	@title: On mouse over
		 *	@description: 
		 *		Fires when the mouse pointer moves over an element.
		 *		The equivalent of HTML attribute `onmouseover`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_mouse_over(callback) {
			if (callback == null) { return this.onmouseover; }
			const e = this;
			this.onmouseover = (t) => callback(e, t);
			return this;
		}

		// Fires when a mouse button is released over an element.
		/*	@docs:
		 *	@title: On mouse up
		 *	@description: 
		 *		Fires when a mouse button is released over an element.
		 *		The equivalent of HTML attribute `onmouseup`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_mouse_up(callback) {
			if (callback == null) { return this.onmouseup; }
			const e = this;
			this.onmouseup = (t) => callback(e, t);
			return this;
		}

		// Deprecated. Use the onwheel attribute instead.
		/*	@docs:
		 *	@title: On mouse wheel
		 *	@description: 
		 *		Deprecated. Use the onwheel attribute instead.
		 *		The equivalent of HTML attribute `onmousewheel`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_mouse_wheel(callback) {
			if (callback == null) { return this.onmousewheel; }
			const e = this;
			this.onmousewheel = (t) => callback(e, t);
			return this;
		}

		// Fires when the mouse wheel rolls up or down over an element.
		/*	@docs:
		 *	@title: On wheel
		 *	@description: 
		 *		Fires when the mouse wheel rolls up or down over an element.
		 *		The equivalent of HTML attribute `onwheel`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_wheel(callback) {
			if (callback == null) { return this.onwheel; }
			const e = this;
			this.onwheel = (t) => callback(e, t);
			return this;
		}

		// Script to be run when an element is dragged.
		/*	@docs:
		 *	@title: On drag
		 *	@description: 
		 *		Script to be run when an element is dragged.
		 *		The equivalent of HTML attribute `ondrag`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_drag(callback) {
			if (callback == null) { return this.ondrag; }
			const e = this;
			this.ondrag = (t) => callback(e, t);
			return this;
		}

		// Script to be run at the end of a drag operation.
		/*	@docs:
		 *	@title: On drag end
		 *	@description: 
		 *		Script to be run at the end of a drag operation.
		 *		The equivalent of HTML attribute `ondragend`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_drag_end(callback) {
			if (callback == null) { return this.ondragend; }
			const e = this;
			this.ondragend = (t) => callback(e, t);
			return this;
		}

		// Script to be run when an element has been dragged to a valid drop target.
		/*	@docs:
		 *	@title: On drag enter
		 *	@description: 
		 *		Script to be run when an element has been dragged to a valid drop target.
		 *		The equivalent of HTML attribute `ondragenter`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_drag_enter(callback) {
			if (callback == null) { return this.ondragenter; }
			const e = this;
			this.ondragenter = (t) => callback(e, t);
			return this;
		}

		// Script to be run when an element leaves a valid drop target.
		/*	@docs:
		 *	@title: On drag leave
		 *	@description: 
		 *		Script to be run when an element leaves a valid drop target.
		 *		The equivalent of HTML attribute `ondragleave`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_drag_leave(callback) {
			if (callback == null) { return this.ondragleave; }
			const e = this;
			this.ondragleave = (t) => callback(e, t);
			return this;
		}

		// Script to be run when an element is being dragged over a valid drop target.
		/*	@docs:
		 *	@title: On drag over
		 *	@description: 
		 *		Script to be run when an element is being dragged over a valid drop target.
		 *		The equivalent of HTML attribute `ondragover`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_drag_over(callback) {
			if (callback == null) { return this.ondragover; }
			const e = this;
			this.ondragover = (t) => callback(e, t);
			return this;
		}

		// Script to be run at the start of a drag operation.
		/*	@docs:
		 *	@title: On drag start
		 *	@description: 
		 *		Script to be run at the start of a drag operation.
		 *		The equivalent of HTML attribute `ondragstart`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_drag_start(callback) {
			if (callback == null) { return this.ondragstart; }
			const e = this;
			this.ondragstart = (t) => callback(e, t);
			return this;
		}

		// Script to be run when dragged element is being dropped.
		/*	@docs:
		 *	@title: On drop
		 *	@description: 
		 *		Script to be run when dragged element is being dropped.
		 *		The equivalent of HTML attribute `ondrop`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_drop(callback) {
			if (callback == null) { return this.ondrop; }
			const e = this;
			this.ondrop = (t) => callback(e, t);
			return this;
		}

		// Script to be run when an element's scrollbar is being scrolled.
		// on_scroll(callback) {
		//     if (callback == null) { return this.onscroll; }
		// 	const e = this;
		// 	this.onscroll = (t) => callback(e, t);
		// 	return this;
		// }

		// Fires when the user copies the content of an element.
		/*	@docs:
		 *	@title: On copy
		 *	@description: 
		 *		Fires when the user copies the content of an element.
		 *		The equivalent of HTML attribute `oncopy`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_copy(callback) {
			if (callback == null) { return this.oncopy; }
			const e = this;
			this.oncopy = (t) => callback(e, t);
			return this;
		}

		// Fires when the user cuts the content of an element.
		/*	@docs:
		 *	@title: On cut
		 *	@description: 
		 *		Fires when the user cuts the content of an element.
		 *		The equivalent of HTML attribute `oncut`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_cut(callback) {
			if (callback == null) { return this.oncut; }
			const e = this;
			this.oncut = (t) => callback(e, t);
			return this;
		}

		// Fires when the user pastes some content in an element.
		/*	@docs:
		 *	@title: On paste
		 *	@description: 
		 *		Fires when the user pastes some content in an element.
		 *		The equivalent of HTML attribute `onpaste`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_paste(callback) {
			if (callback == null) { return this.onpaste; }
			const e = this;
			this.onpaste = (t) => callback(e, t);
			return this;
		}

		// Script to be run on abort.
		/*	@docs:
		 *	@title: On abort
		 *	@description: 
		 *		Script to be run on abort.
		 *		The equivalent of HTML attribute `onabort`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_abort(callback) {
			if (callback == null) { return this.onabort; }
			const e = this;
			this.onabort = (t) => callback(e, t);
			return this;
		}

		// Script to be run when a file is ready to start playing (when it has buffered enough to begin).
		/*	@docs:
		 *	@title: On canplay
		 *	@description: 
		 *		Script to be run when a file is ready to start playing (when it has buffered enough to begin).
		 *		The equivalent of HTML attribute `oncanplay`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_canplay(callback) {
			if (callback == null) { return this.oncanplay; }
			const e = this;
			this.oncanplay = (t) => callback(e, t);
			return this;
		}

		// Script to be run when a file can be played all the way to the end without pausing for buffering.
		/*	@docs:
		 *	@title: On canplay through
		 *	@description: 
		 *		Script to be run when a file can be played all the way to the end without pausing for buffering.
		 *		The equivalent of HTML attribute `oncanplaythrough`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_canplay_through(callback) {
			if (callback == null) { return this.oncanplaythrough; }
			const e = this;
			this.oncanplaythrough = (t) => callback(e, t);
			return this;
		}

		// Script to be run when the cue changes in a \<track> element.
		/*	@docs:
		 *	@title: On cue change
		 *	@description: 
		 *		Script to be run when the cue changes in a \<track> element.
		 *		The equivalent of HTML attribute `oncuechange`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_cue_change(callback) {
			if (callback == null) { return this.oncuechange; }
			const e = this;
			this.oncuechange = (t) => callback(e, t);
			return this;
		}

		// Script to be run when the length of the media changes.
		/*	@docs:
		 *	@title: On duration change
		 *	@description: 
		 *		Script to be run when the length of the media changes.
		 *		The equivalent of HTML attribute `ondurationchange`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_duration_change(callback) {
			if (callback == null) { return this.ondurationchange; }
			const e = this;
			this.ondurationchange = (t) => callback(e, t);
			return this;
		}

		// Script to be run when something bad happens and the file is suddenly unavailable (like unexpectedly disconnects).
		/*	@docs:
		 *	@title: On emptied
		 *	@description: 
		 *		Script to be run when something bad happens and the file is suddenly unavailable (like unexpectedly disconnects).
		 *		The equivalent of HTML attribute `onemptied`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_emptied(callback) {
			if (callback == null) { return this.onemptied; }
			const e = this;
			this.onemptied = (t) => callback(e, t);
			return this;
		}

		// Script to be run when the media has reach the end (a useful event for messages like "thanks for listening").
		/*	@docs:
		 *	@title: On ended
		 *	@description: 
		 *		Script to be run when the media has reach the end (a useful event for messages like "thanks for listening").
		 *		The equivalent of HTML attribute `onended`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_ended(callback) {
			if (callback == null) { return this.onended; }
			const e = this;
			this.onended = (t) => callback(e, t);
			return this;
		}

		// Script to be run when an error occurs when the file is being loaded.
		/*	@docs:
		 *	@title: On error
		 *	@description: 
		 *		Script to be run when an error occurs when the file is being loaded.
		 *		The equivalent of HTML attribute `onerror`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_error(callback) {
			if (callback == null) { return this.onerror; }
			const e = this;
			this.onerror = (t) => callback(e, t);
			return this;
		}

		// Script to be run when media data is loaded.
		/*	@docs:
		 *	@title: On loaded data
		 *	@description: 
		 *		Script to be run when media data is loaded.
		 *		The equivalent of HTML attribute `onloadeddata`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_loaded_data(callback) {
			if (callback == null) { return this.onloadeddata; }
			const e = this;
			this.onloadeddata = (t) => callback(e, t);
			return this;
		}

		// Script to be run when meta data (like dimensions and duration) are loaded.
		/*	@docs:
		 *	@title: On loaded metadata
		 *	@description: 
		 *		Script to be run when meta data (like dimensions and duration) are loaded.
		 *		The equivalent of HTML attribute `onloadedmetadata`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_loaded_metadata(callback) {
			if (callback == null) { return this.onloadedmetadata; }
			const e = this;
			this.onloadedmetadata = (t) => callback(e, t);
			return this;
		}

		// Script to be run just as the file begins to load before anything is actually loaded.
		/*	@docs:
		 *	@title: On load start
		 *	@description: 
		 *		Script to be run just as the file begins to load before anything is actually loaded.
		 *		The equivalent of HTML attribute `onloadstart`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_load_start(callback) {
			if (callback == null) { return this.onloadstart; }
			const e = this;
			this.onloadstart = (t) => callback(e, t);
			return this;
		}

		// Script to be run when the media is paused either by the user or programmatically.
		/*	@docs:
		 *	@title: On pause
		 *	@description: 
		 *		Script to be run when the media is paused either by the user or programmatically.
		 *		The equivalent of HTML attribute `onpause`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_pause(callback) {
			if (callback == null) { return this.onpause; }
			const e = this;
			this.onpause = (t) => callback(e, t);
			return this;
		}

		// Script to be run when the media is ready to start playing.
		/*	@docs:
		 *	@title: On play
		 *	@description: 
		 *		Script to be run when the media is ready to start playing.
		 *		The equivalent of HTML attribute `onplay`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_play(callback) {
			if (callback == null) { return this.onplay; }
			const e = this;
			this.onplay = (t) => callback(e, t);
			return this;
		}

		// Script to be run when the media actually has started playing.
		/*	@docs:
		 *	@title: On playing
		 *	@description: 
		 *		Script to be run when the media actually has started playing.
		 *		The equivalent of HTML attribute `onplaying`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_playing(callback) {
			if (callback == null) { return this.onplaying; }
			const e = this;
			this.onplaying = (t) => callback(e, t);
			return this;
		}

		// Script to be run when the browser is in the process of getting the media data.
		/*	@docs:
		 *	@title: Onprogress
		 *	@description: 
		 *		Script to be run when the browser is in the process of getting the media data.
		 *		The equivalent of HTML attribute `onprogress`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		onprogress(callback) {
			if (callback == null) { return this.onprogress; }
			const e = this;
			this.onprogress = (t) => callback(e, t);
			return this;
		}

		// Script to be run each time the playback rate changes (like when a user switches to a slow motion or fast forward mode).
		/*	@docs:
		 *	@title: On rate change
		 *	@description: 
		 *		Script to be run each time the playback rate changes (like when a user switches to a slow motion or fast forward mode).
		 *		The equivalent of HTML attribute `onratechange`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_rate_change(callback) {
			if (callback == null) { return this.onratechange; }
			const e = this;
			this.onratechange = (t) => callback(e, t);
			return this;
		}

		// Script to be run when the seeking attribute is set to false indicating that seeking has ended.
		/*	@docs:
		 *	@title: On seeked
		 *	@description: 
		 *		Script to be run when the seeking attribute is set to false indicating that seeking has ended.
		 *		The equivalent of HTML attribute `onseeked`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_seeked(callback) {
			if (callback == null) { return this.onseeked; }
			const e = this;
			this.onseeked = (t) => callback(e, t);
			return this;
		}

		// Script to be run when the seeking attribute is set to true indicating that seeking is active.
		/*	@docs:
		 *	@title: On seeking
		 *	@description: 
		 *		Script to be run when the seeking attribute is set to true indicating that seeking is active.
		 *		The equivalent of HTML attribute `onseeking`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_seeking(callback) {
			if (callback == null) { return this.onseeking; }
			const e = this;
			this.onseeking = (t) => callback(e, t);
			return this;
		}

		// Script to be run when the browser is unable to fetch the media data for whatever reason.
		/*	@docs:
		 *	@title: On stalled
		 *	@description: 
		 *		Script to be run when the browser is unable to fetch the media data for whatever reason.
		 *		The equivalent of HTML attribute `onstalled`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_stalled(callback) {
			if (callback == null) { return this.onstalled; }
			const e = this;
			this.onstalled = (t) => callback(e, t);
			return this;
		}

		// Script to be run when fetching the media data is stopped before it is completely loaded for whatever reason.
		/*	@docs:
		 *	@title: On suspend
		 *	@description: 
		 *		Script to be run when fetching the media data is stopped before it is completely loaded for whatever reason.
		 *		The equivalent of HTML attribute `onsuspend`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_suspend(callback) {
			if (callback == null) { return this.onsuspend; }
			const e = this;
			this.onsuspend = (t) => callback(e, t);
			return this;
		}

		// Script to be run when the playing position has changed (like when the user fast forwards to a different point in the media).
		/*	@docs:
		 *	@title: On time update
		 *	@description: 
		 *		Script to be run when the playing position has changed (like when the user fast forwards to a different point in the media).
		 *		The equivalent of HTML attribute `ontimeupdate`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_time_update(callback) {
			if (callback == null) { return this.ontimeupdate; }
			const e = this;
			this.ontimeupdate = (t) => callback(e, t);
			return this;
		}

		// Script to be run each time the volume is changed which (includes setting the volume to "mute").
		/*	@docs:
		 *	@title: On volume change
		 *	@description: 
		 *		Script to be run each time the volume is changed which (includes setting the volume to "mute").
		 *		The equivalent of HTML attribute `onvolumechange`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_volume_change(callback) {
			if (callback == null) { return this.onvolumechange; }
			const e = this;
			this.onvolumechange = (t) => callback(e, t);
			return this;
		}

		// Script to be run when the media has paused but is expected to resume (like when the media pauses to buffer more data).
		/*	@docs:
		 *	@title: On waiting
		 *	@description: 
		 *		Script to be run when the media has paused but is expected to resume (like when the media pauses to buffer more data).
		 *		The equivalent of HTML attribute `onwaiting`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_waiting(callback) {
			if (callback == null) { return this.onwaiting; }
			const e = this;
			this.onwaiting = (t) => callback(e, t);
			return this;
		}

		// Fires when the user opens or closes the \<details> element.
		/*	@docs:
		 *	@title: On toggle
		 *	@description: 
		 *		Fires when the user opens or closes the \<details> element.
		 *		The equivalent of HTML attribute `ontoggle`.
		 *		
		 *		The first parameter of the callback is the `Element` object.
		 *		
		 *		Returns the attribute value when parameter `value` is `null`.
		 *	@return: 
		 *		Returns the `Element` object. Unless parameter `value` is `null`, then the attribute's value is returned.
		 *	@parameter:
		 *		@name: value
		 *		@description: The value to assign. Leave `null` to retrieve the attribute's value.
		 *	@inherit: false
		 */ 
		on_toggle(callback) {
			if (callback == null) { return this.ontoggle; }
			const e = this;
			this.ontoggle = (t) => callback(e, t);
			return this;
		}

	};

	// Support extending.
	vweb._velement_classes.push(Element);

	// Register.
	customElements.define("v-base-" + type.toLowerCase(), Element, {extends: tag});

	// Return class.
	return Element;
};

// Element class.
const VElementElement = CreateVElementClass({type: "VElement", tag: "div"}); // should always remain a "div" since some elements like LoaderButton rely on the behaviour of a div.
function VElement(...args) { return new VElementElement(...args); }

// Style class.
// Used to create styles without an element, for example for animations.
const StyleElement = CreateVElementClass({type: "Style", tag: "style"});
function Style(...args) { return new StyleElement(...args); }

// Fire the onload event.
window.onload = () => {
	vweb.events.emit("vweb.on_load");
}