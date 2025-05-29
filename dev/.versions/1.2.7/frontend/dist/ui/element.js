/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */
// Imports.
import "../modules/string";
import "../modules/array";
import "../modules/number";
import { Utils } from "../modules/utils";
import { Events } from "../modules/events";
import { Themes } from "../modules/themes";
import { Elements } from "../modules/elements";
import { Compression } from "../modules/compression";
import { Span } from "./span";
import { GradientType } from "./gradient";
import { ContextMenu, ContextMenuElement } from "./context_menu";
import { FrameModesType } from "./frame_modes";
// Elements that use the "width" etc attribute instead of the "style.width".
const elements_with_width_attribute = [
    'canvas',
    'embed',
    'iframe',
    'img',
    'object',
    'progress',
    'video',
];
;
// Create VElement class.
export function CreateVElementClass({ type, tag, default_style, default_attributes, default_events, }) {
    // Determine the base element based on the tag.
    let Base;
    if (tag === "style") {
        // Base = class B {
        // 	public style: Record<string, string>;
        // 	constructor() {
        // 		this.style = {};
        // 	}
        // }
        Base = HTMLElement;
    }
    else if (Utils.is_safari) {
        // Safari can only inherit HTMLElement.
        Base = HTMLElement;
    }
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
            case "h2":
            case "h3":
            case "h4":
            case "h5":
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
            case "tbody":
            case "tfoot":
                Base = HTMLTableSectionElement;
                break;
            case "th":
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
        }
    }
    // Macros.
    // Build class.
    // @note: this.tagName can not be used since they have different values on safari and other browsers.
    /*	@docs:
        @nav: FrontendVElement
        @chapter: Elements
        @title: Base element
        @desc: The base element of the vweb frontend elements.
    */
    class VBaseElement extends Base {
        // ---------------------------------------------------------
        // Constructor.
        constructor() {
            // Super base.
            super();
            // ---------------------------------------------------------
            // Attributes.
            this.__is_velement = true;
            this._v_children = [];
            this._disabled = false;
            this._timeouts = {};
            this._pseudo_stylesheets = {};
            this._on_resize_rule_evals = {};
            this._observing_on_resize = false;
            this._observing_on_render = false;
            this._on_resize_callbacks = [];
            this._on_render_callbacks = [];
            this._on_theme_updates = [];
            this._on_mouse_leave_callback = (element, event) => { };
            this._on_mouse_enter_callback = (element, event) => { };
            this._on_shortcut_time = 0;
            this._on_shortcut_key = "";
            this._on_shortcut_keycode = 0;
            this._on_keypress_set = false;
            this._on_appear_callbacks = [];
            this._context_menu = undefined;
            this._media_queries = {};
            // Attributes.
            this.element_type = type; // must also be a member attribute.
            this.base_element_type = type; // this must remain the element type of the base class, element type may be overwritten when an element extends a base element.
            this._element_display = "block";
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
                if (VBaseElement.default_style != null) {
                    this.styles(VBaseElement.default_style);
                }
                // Default attributes.
                if (VBaseElement.default_attributes != null) {
                    this.attrs(VBaseElement.default_attributes);
                }
                // Default events.
                if (VBaseElement.default_events != null) {
                    this.events(VBaseElement.default_events);
                }
            }
            // Attributes.
            this._is_connected = false;
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
        /**
         * @docs:
         * @title: Clone
         * @desc: Creates a deep copy of the current element, including its styles and attributes.
         *         Optionally clones child nodes based on the provided parameter.
         * @param:
         *     @name: clone_children
         *     @descr: Indicates whether to clone child nodes of the current element.
         *     @default: true
         * @return:
         *     @description Returns a new instance of the element that is a clone of the current one.
         */
        clone(clone_children = true) {
            // @ts-ignore
            const clone = new this.constructor();
            if (clone.element_type !== undefined) {
                clone.inner_html("");
            }
            const styles = window.getComputedStyle(this);
            clone.style.cssText = Array.from(styles).reduce((str, property) => {
                return `${str}${property}:${styles.getPropertyValue(property)};`;
            }, '');
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
            for (const attr of this.getAttributeNames()) {
                if (attr != "style") {
                    clone.setAttribute(attr, this.getAttribute(attr));
                }
            }
            for (const prop in this) {
                if (this.hasOwnProperty(prop) || typeof this[prop] === "function") {
                    clone[prop] = this[prop];
                }
            }
            if (clone_children && this.childNodes != undefined) {
                for (let i = 0; i < this.childNodes.length; i++) {
                    const child = this.childNodes[i];
                    if (isVElement(child) && child.element_type !== undefined) {
                        clone.appendChild(child.clone());
                    }
                    else {
                        clone.appendChild(child.cloneNode(true));
                    }
                }
            }
            return clone;
        }
        /**
         * @docs:
         * @title: Pad Numeric
         * @desc: Pads a numeric value with a specified padding unit, defaulting to "px".
         * @param:
         *     @name: value
         *     @descr: The numeric value to be padded.
         * @param:
         *     @name: padding
         *     @descr: The unit to pad the numeric value with.
         *     @default: "px"
         * @return:
         *     @description Returns the padded value as a string.
         */
        pad_numeric(value, padding = "px") {
            if (value === null) {
                return "";
            }
            if (typeof value !== "string") {
                return value + padding;
            }
            return value;
        }
        /**
         * @docs:
         * @title: Pad Percentage
         * @desc: Pads a numeric value with a percentage symbol. If the value is a float between 0 and 1, it is multiplied by 100 before padding.
         * @param:
         *     @name: value
         *     @descr: The numeric value to pad.
         * @param:
         *     @name: padding
         *     @descr: The string to pad the numeric value with, defaults to "%".
         * @return:
         *     @description Returns the padded percentage as a string, or the original value if it is not numeric.
         */
        pad_percentage(value, padding = "%") {
            if (Utils.is_float(value) && value <= 1.0) {
                return (value * 100) + padding;
            }
            else if (Utils.is_numeric(value)) {
                return value + padding;
            }
            return value;
        }
        /**
         * @docs:
         * @title: Edit Filter Wrapper
         * @desc: Edits a filter string by replacing or removing specified types.
         * Can also append a new type if it doesn’t exist in the filter.
         * @param:
         *     @name: filter
         *     @descr: The original filter string that needs to be edited.
         *     @name: type
         *     @descr: The type that will be targeted for replacement or removal.
         *     @name: to
         *     @descr: The new value to replace the existing type with, or null to remove it.
         * @return:
         *     @description Returns the modified filter string or null if the input filter was null.
         */
        edit_filter_wrapper(filter, type, to = null) {
            if (filter == null) {
                return to ?? "";
            }
            const pattern = new RegExp(`${type}\\([^)]*\\)\\s*`, "g");
            if (pattern.test(filter)) {
                if (to == null) {
                    return pattern[1];
                }
                else {
                    return filter.replace(pattern, to);
                }
            }
            else if (to != null) {
                return `${filter} ${to}`;
            }
            return filter;
        }
        /**
         * @docs:
         * @title: Toggle Filter Wrapper
         * @desc: Toggles a specified filter type in a string. If the type is present, it will be removed; otherwise, it will be added.
         * @param:
         *     @name: filter
         *     @descr: The filter string to modify.
         *     @name: type
         *     @descr: The type of filter to toggle.
         *     @name: to
         *     @descr: The value to add if the type is not present.
         * @return:
         *     @description Returns the modified filter string or null if the input filter was null.
         */
        toggle_filter_wrapper(filter, type, to = null) {
            if (filter == null) {
                return to ?? "";
            }
            const pattern = new RegExp(`${type}\\([^)]*\\)\\s*`, "g");
            if (pattern.test(filter)) {
                return filter.replace(pattern, "");
            }
            else if (to != null) {
                return `${filter} ${to}`;
            }
            return filter;
        }
        // Convert a px string to number type.
        _convert_px_to_number_type(value, def = 0) {
            if (value == null || value === "") {
                return def;
            }
            else if (typeof value === "string" && value.endsWith("px")) {
                value = parseFloat(value);
                if (isNaN(value)) {
                    return def;
                }
            }
            return value;
        }
        // Try and parse to float otherwise return original.
        _try_parse_float(value, def) {
            if (typeof value === "string" && (value.endsWith("em") || value.endsWith("rem"))) {
                return value;
            }
            const float = parseFloat(value);
            if (!isNaN(float)) {
                return float;
            }
            if (def !== undefined) {
                return def;
            }
            return value;
        }
        // ---------------------------------------------------------
        // Children functions.
        /**
         * @docs:
         * @title: Append Child Elements
         * @desc: Appends child elements to the current element. Can accept multiple child elements, including HTML nodes, functions, or strings.
         * @param:
         *     @name: children
         *     @descr: The child elements to append, which can be an array of elements, a single element, or a function.
         * @return:
         *     @descr: Returns the instance of the element for chaining.
         */
        append(...children) {
            for (let i = 0; i < children.length; i++) {
                let child = children[i];
                if (child != null) {
                    // Array.
                    if (Array.isArray(child)) {
                        this.append(...child);
                    }
                    // VWeb element.
                    else if (isVElement(child) && child.element_type != null) {
                        if (child.element_type == "ForEach" ||
                            child.element_type == "If" ||
                            child.element_type == "IfDeviceWith") {
                            child.append_children_to(this, this._on_append_callback);
                        }
                        else {
                            if (child._assign_to_parent_as !== undefined) {
                                this[child._assign_to_parent_as] = child;
                                child._parent = this;
                            }
                            if (this._on_append_callback !== undefined) {
                                this._on_append_callback(child);
                            }
                            this.appendChild(child);
                        }
                    }
                    // Execute function.
                    else if (Utils.is_func(child)) {
                        this.append(child(this));
                    }
                    // Node element.
                    else if (child instanceof HTMLElement || child instanceof Node) {
                        // if (child._assign_to_parent_as !== undefined) {
                        // 	this[child._assign_to_parent_as] = child;
                        // 	child._parent = this;
                        // }
                        if (this._on_append_callback !== undefined) {
                            this._on_append_callback(child);
                        }
                        this.appendChild(child);
                    }
                    // Append text.
                    else if (Utils.is_string(child)) {
                        const node = document.createTextNode(child);
                        if (this._on_append_callback !== undefined) {
                            this._on_append_callback(node);
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
        /**
         * @docs:
         * @title: ZStack Append
         * @desc: Appends multiple children to the ZStack element. This method can handle various types of children such as elements, functions, and text.
         * @param:
         *     @name: children
         *     @descr: The children to append, which can be elements, arrays, text, or functions returning elements.
         * @return:
         *     @description Returns the instance of the ZStack element for chaining.
         */
        zstack_append(...children) {
            for (let i = 0; i < children.length; i++) {
                let child = children[i];
                if (child != null) {
                    // Array.
                    if (Array.isArray(child)) {
                        this.zstack_append(...child);
                    }
                    // VWeb element.
                    else if (isVElement(child) && child.element_type != null) {
                        child.style.gridArea = "1 / 1 / 2 / 2";
                        if (child.element_type == "ForEach" ||
                            child.element_type == "If" ||
                            child.element_type == "IfDeviceWith") {
                            child.append_children_to(this, this._on_append_callback);
                        }
                        else {
                            if (child._assign_to_parent_as !== undefined) {
                                this[child._assign_to_parent_as] = child;
                                child._parent = this;
                            }
                            if (this._on_append_callback !== undefined) {
                                this._on_append_callback(child);
                            }
                            this.appendChild(child);
                        }
                    }
                    // Execute function.
                    else if (Utils.is_func(child)) {
                        this.append(child(this));
                    }
                    // Node element.
                    else if (child instanceof Node || child instanceof HTMLElement) {
                        if (child instanceof HTMLElement) {
                            child.style.gridArea = "1 / 1 / 2 / 2";
                        }
                        // if (child._assign_to_parent_as !== undefined) {
                        // 	this[child._assign_to_parent_as] = child;
                        // 	child._parent = this;
                        // }
                        if (this._on_append_callback !== undefined) {
                            this._on_append_callback(child);
                        }
                        this.appendChild(child);
                    }
                    // Append text.
                    else if (Utils.is_string(child)) {
                        const node = document.createTextNode(child);
                        if (this._on_append_callback !== undefined) {
                            this._on_append_callback(node);
                        }
                        this.appendChild(node);
                    }
                }
            }
            return this;
        }
        /**
         * @docs:
         * @title: Append To Parent
         * @desc: Appends the current element to a specified parent element and manages parent-child relationships.
         * @param:
         *     @name: parent
         *     @descr: The parent element to which the current element will be appended.
         * @return:
         *     @descr: Returns the instance of the element for chaining.
         */
        append_to(parent) {
            if (this._assign_to_parent_as !== undefined) {
                parent[this._assign_to_parent_as] = this;
                this._parent = parent;
            }
            if (parent._on_append_callback !== undefined) {
                parent._on_append_callback(this);
            }
            parent.appendChild(this);
            return this;
        }
        /**
         * @docs:
         * @title: Append Children to Parent
         * @desc: Appends the children of the current element to the specified parent element and executes a callback for each appended child.
         * @param:
         *     @name: parent
         *     @descr: The parent element to which the children will be appended.
         *     @name: on_append_callback
         *     @descr: A callback function that is executed for each child when it is appended.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        append_children_to(parent, on_append_callback) {
            if (isVElement(parent) && this.base_element_type === "VirtualScroller") {
                for (let i = 0; i < parent.children.length; i++) {
                    parent._v_children.push(parent.children[i]);
                }
                this.innerHTML = "";
            }
            else {
                while (this.firstChild) {
                    if (this.firstChild._assign_to_parent_as !== undefined) {
                        parent[this.firstChild._assign_to_parent_as] = this.firstChild;
                        this.firstChild._parent = parent;
                    }
                    if (on_append_callback !== undefined) {
                        on_append_callback(this.firstChild);
                    }
                    parent.appendChild(this.firstChild);
                }
            }
            return this;
        }
        /**
         * @docs:
         * @title: Remove Child
         * @desc: Removes a child element from the current element. The child can be specified
         *        by passing a Node, an VElement, or an id string of the element to be removed.
         * @param:
         *     @name: child
         *     @descr: The child to be removed from the current element.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        remove_child(child) {
            if (isVElement(child) && child.element_type != null) {
                this.removeChild(child);
            }
            else if (child instanceof Node) {
                this.removeChild(child);
            }
            else if (typeof child === "string") {
                let res;
                if ((res = document.getElementById(child)) != null) {
                    this.removeChild(res);
                }
            }
            else {
                console.error("Invalid parameter type for function \"remove_child()\".");
            }
            return this;
        }
        /**
         * @docs:
         * @title: Remove Children
         * @desc: Removes all child elements from the current element without using innerHTML.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        remove_children() {
            this.inner_html("");
            return this;
        }
        /**
         * @docs:
         * @title: Child
         * @desc: Retrieves a child element by its index. Supports negative indexing to access elements from the end of the list.
         * @param:
         *     @name: index
         *     @descr: The index of the child to retrieve. Can be a positive or negative integer.
         * @return:
         *     @description Returns the child element at the specified index.
         */
        child(index) {
            if (index < 0) {
                return this.children[this.children.length - index];
            }
            return this.children[index];
        }
        /**
         * @docs:
         * @title: Get Child
         * @desc: Retrieves a child element by its index. Supports negative indexing to access elements from the end.
         * @param:
         *     @name: index
         *     @descr: The index of the child element to retrieve. Can be negative to access from the end.
         * @return:
         *     @description Returns the child element at the specified index, or undefined if the index is out of bounds.
         */
        get(index) {
            if (index < 0) {
                return this.children[this.children.length - index];
            }
            else if (index >= this.children.length) {
                return undefined;
            }
            return this.children[index];
        }
        text(value) {
            if (value == null) {
                return this.textContent ?? "";
            }
            this.textContent = value;
            return this;
        }
        width(value, check_attribute = true) {
            if (check_attribute && elements_with_width_attribute.includes(VBaseElement.element_tag)) {
                if (value == null) {
                    return this._try_parse_float(this.getAttribute("width"));
                }
                this.setAttribute("width", value.toString());
            }
            else {
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
        height(value, check_attribute) {
            if (check_attribute && elements_with_width_attribute.includes(VBaseElement.element_tag)) {
                if (value == null) {
                    return this._try_parse_float(this.getAttribute("height"));
                }
                this.setAttribute("height", value.toString());
            }
            else {
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
        min_height(value) {
            if (value == null) {
                return this._try_parse_float(this.style.minHeight);
            }
            this.style.minHeight = this.pad_numeric(value);
            return this;
        }
        min_width(value) {
            if (value == null) {
                return this._try_parse_float(this.style.minWidth);
            }
            this.style.minWidth = this.pad_numeric(value);
            return this;
        }
        /**
         * @docs:
         * @title: Width By Columns
         * @desc: Sets the width of HStack children based on the number of columns specified.
         * If columns are not provided, it defaults to 1. The calculation takes into account
         * the left and right margins of the element.
         * @param:
         *     @name: columns
         *     @descr: The number of columns to set the width by.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
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
        /**
         * @docs:
         * @title: Offset Width
         * @desc: Retrieves the offset width of the element.
         * @return:
         *     @description Returns the offset width of the element.
         */
        offset_width() {
            return this.offsetWidth;
        }
        /**
         * @docs:
         * @title: Offset Height
         * @desc: Retrieves the height of the element's offset.
         * @return:
         *     @description Returns the height of the element including padding and border.
         */
        offset_height() {
            return this.offsetHeight;
        }
        /**
         * @docs:
         * @title: Client Width
         * @desc: Retrieves the client width of the element.
         * @return:
         *     @description Returns the client width of the element.
         */
        client_width() {
            return this.clientWidth;
        }
        /**
         * @docs:
         * @title: Client Height
         * @desc: Retrieves the height of the client area of the element.
         * @return:
         *     @description Returns the height of the client area in pixels.
         */
        client_height() {
            return this.clientHeight;
        }
        /**
         * @docs:
         * @title: X Offset
         * @desc: Retrieves the x offset of the element from its parent.
         * @return:
         *     @description Returns the x offset value of the element.
         */
        x() {
            return this.offsetLeft;
        }
        /**
         * @docs:
         * @title: Y Offset
         * @desc: Retrieves the vertical offset of the element from the top of the document.
         * @return:
         *     @description Returns the vertical offset value.
         */
        y() {
            return this.offsetTop;
        }
        /**
         * @docs:
         * @title: Frame
         * @desc: Sets the width and height of the frame. If width or height is not provided, it does not change that dimension.
         * @param:
         *     @name: width
         *     @descr: The width to set for the frame.
         * @param:
         *     @name: height
         *     @descr: The height to set for the frame.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        frame(width, height) {
            if (width != null) {
                this.width(width);
            }
            if (height != null) {
                this.height(height);
            }
            return this;
        }
        /**
         * @docs:
         * @title: Min Frame
         * @desc: Sets the minimum width and height for the frame. If parameters are provided, it updates the respective properties.
         * @param:
         *     @name: width
         *     @descr: The minimum width to set for the frame.
         * @param:
         *     @name: height
         *     @descr: The minimum height to set for the frame.
         * @return:
         *     @descr: Returns the instance of the frame for chaining.
         */
        min_frame(width, height) {
            if (width != null) {
                this.min_width(width);
            }
            if (height != null) {
                this.min_height(height);
            }
            return this;
        }
        /**
         * @docs:
         * @title: Max Frame
         * @desc: Sets the maximum width and height for the frame. If a value is provided, it updates the respective maximum dimension.
         * @param:
         *     @name: width
         *     @descr: The maximum width to set for the frame.
         *     @name: height
         *     @descr: The maximum height to set for the frame.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        max_frame(width, height) {
            if (width != null) {
                this.max_width(width);
            }
            if (height != null) {
                this.max_height(height);
            }
            return this;
        }
        /**
         * @docs:
         * @title: Fixed Frame
         * @desc: Sets the width and height of the element, applying padding to the values if provided.
         * @param:
         *     @name: width
         *     @descr: The width to set for the element. Can be a number or null.
         *     @name: height
         *     @descr: The height to set for the element. Can be a number or null.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
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
        /**
         * @docs:
         * @title: Get Frame While Hidden
         * @desc: Retrieves the dimensions of the element as it would appear if it were not hidden.
         * @return:
         *     @description Returns an object containing the width and height of the element.
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
            const response = { width: this.clientWidth, height: this.clientHeight };
            this.hide();
            this.visibility("visible");
            this.max_width(max_width);
            this.max_height(max_height);
            this.transition(transition);
            this.overflow(overflow);
            return response;
        }
        padding(...values) {
            if (values.length === 0) {
                return this.style.padding;
            }
            else if (values.length === 1) {
                this.style.padding = this.pad_numeric(values[0]);
            }
            else if (values.length === 2) {
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
            }
            else if (values.length === 4) {
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
            }
            else {
                console.error("Invalid number of arguments for function \"padding()\".");
            }
            return this;
        }
        padding_bottom(value) {
            if (value == null) {
                return this._try_parse_float(this.style.paddingBottom, 0);
            }
            this.style.paddingBottom = this.pad_numeric(value);
            return this;
        }
        padding_left(value) {
            if (value == null) {
                return this._try_parse_float(this.style.paddingLeft, 0);
            }
            this.style.paddingLeft = this.pad_numeric(value);
            return this;
        }
        padding_right(value) {
            if (value == null) {
                return this._try_parse_float(this.style.paddingRight, 0);
            }
            this.style.paddingRight = this.pad_numeric(value);
            return this;
        }
        padding_top(value) {
            if (value == null) {
                return this._try_parse_float(this.style.paddingTop, 0);
            }
            this.style.paddingTop = this.pad_numeric(value);
            return this;
        }
        margin(...values) {
            if (values.length === 0) {
                return this.style.margin;
            }
            else if (values.length === 1) {
                this.style.margin = this.pad_numeric(values[0]);
            }
            else if (values.length === 2) {
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
            }
            else if (values.length === 4) {
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
            }
            else {
                console.error("Invalid number of arguments for function \"margin()\".");
            }
            return this;
        }
        margin_bottom(value) {
            if (value == null) {
                return this._try_parse_float(this.style.marginBottom, 0);
            }
            this.style.marginBottom = this.pad_numeric(value);
            return this;
        }
        margin_left(value) {
            if (value == null) {
                return this._try_parse_float(this.style.marginLeft, 0);
            }
            this.style.marginLeft = this.pad_numeric(value);
            return this;
        }
        margin_right(value) {
            if (value == null) {
                return this._try_parse_float(this.style.marginRight, 0);
            }
            this.style.marginRight = this.pad_numeric(value);
            return this;
        }
        margin_top(value) {
            if (value == null) {
                return this._try_parse_float(this.style.marginTop, 0);
            }
            this.style.marginTop = this.pad_numeric(value);
            return this;
        }
        position(...values) {
            if (values.length === 0) {
                return this.style.position;
            }
            else if (values.length === 1) {
                this.style.position = values[0];
            }
            else if (values.length === 4) {
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
            }
            else {
                console.error("Invalid number of arguments for function \"position()\".");
            }
            return this;
        }
        /**
         * @docs:
         * @title: Stretch
         * @desc: Sets the flex property of the element to control its stretching behavior.
         * @param:
         *     @name: value
         *     @descr: A boolean indicating whether the element should stretch or not.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        stretch(value) {
            if (value == true) {
                this.style.flex = "1";
            }
            else {
                this.style.flex = "0";
            }
            return this;
        }
        /**
         * @docs:
         * @title: Wrap
         * @desc: Sets the wrapping behavior of an element based on the provided value.
         * @param:
         *     @name: value
         *     @descr: A boolean or string indicating the wrap behavior.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        wrap(value) {
            switch (VBaseElement.element_tag) {
                case "div":
                    if (value === true) {
                        this.flex_wrap("wrap");
                    }
                    else if (value === false) {
                        this.flex_wrap("nowrap");
                    }
                    else {
                        this.flex_wrap(value);
                    }
                    break;
                default:
                    if (value === true) {
                        this.style.whiteSpace = "wrap";
                        this.style.textWrap = "wrap";
                        this.style.overflowWrap = "break-word";
                    }
                    else if (value === false) {
                        this.style.whiteSpace = "nowrap";
                        this.style.textWrap = "nowrap";
                        this.style.overflowWrap = "normal";
                    }
                    else {
                        this.style.textWrap = value;
                        this.style.textWrap = value;
                        this.style.overflowWrap = value;
                    }
                    break;
            }
            return this;
        }
        /**
         * @docs:
         * @title: Z Index
         * @desc: Sets the z-index style property of the element.
         * @param:
         *     @name: value
         *     @descr: The z-index value to set for the element.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        z_index(value) {
            this.style.zIndex = value.toString();
            return this;
        }
        /**
         * @docs:
         * @experimental: true
         * @title: Side by Side
         * @description: Set the elements side by side till a specified width.
         * @param:
         *     @name: options
         *     @descr: Configuration options for the side by side layout.
         *     @attr:
         *         @name: columns
         *         @description The amount of column elements that will be put on one row.
         *         @name: hspacing
         *         @description The horizontal spacing between the columns in pixels.
         *         @name: vspacing
         *         @description The vertical spacing between the rows in pixels.
         *         @name: stretch
         *         @description Stretch the leftover columns to max width.
         *         @name: hide_dividers
         *         @description Hide dividers when they would appear on a row.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        side_by_side(options) {
            const { columns = 2, hspacing = 10, vspacing = 10, stretch = true, hide_dividers = false, } = options;
            if (this.element_type !== "HStack" && this.element_type !== "AnchorHStack") {
                throw Error("This function is only supported for element \"HStackElement\".");
            }
            // Vars.
            let col_children = [];
            let row_width = 0;
            let row = 0;
            let highest_margin = undefined;
            // Styling.
            this.box_sizing("border-box");
            // Set flex basis.
            const flex_basis = (child, basis, margin) => {
                if (margin === 0) {
                    child.width(`${basis * 100}%`);
                    child.min_width(`${basis * 100}%`);
                    child.max_width(`${basis * 100}%`);
                }
                else {
                    child.width(`calc(${basis * 100}% - ${margin}px)`);
                    child.min_width(`calc(${basis * 100}% - ${margin}px)`);
                    child.max_width(`calc(${basis * 100}% - ${margin}px)`);
                }
            };
            // Set flex on the columns.
            const set_flex = () => {
                const margin = (columns - 1) * hspacing;
                let index = 0;
                col_children.forEach((i) => {
                    const child = i[0];
                    if (index > 0) {
                        child.margin_left(hspacing);
                    }
                    if (stretch && index + 1 === col_children.length) {
                        let basis = i[1] == null ? (1 - ((col_children.length - 1) / columns)) : i[1];
                        if (col_children.length === 1) {
                            basis = 1.0;
                        }
                        flex_basis(child, basis, margin / columns);
                    }
                    else {
                        flex_basis(child, i[1] == null ? 1 / columns : i[1], margin / columns);
                    }
                    ++index;
                });
            };
            // Check if the child is the last non-divider child.
            const is_last_non_divider = (child) => {
                if (child.nextElementSibling == null) {
                    return true;
                }
                else if (child.nextElementSibling.element_type !== "Divider") {
                    return false;
                }
                else {
                    return is_last_non_divider(child.nextElementSibling);
                }
            };
            // Iterate children.
            this.iterate((child) => {
                // Divider element.
                if (child.element_type === "Divider") {
                    if (col_children.length > 0 && hide_dividers) {
                        child.hide();
                    }
                    else {
                        child.show();
                        child.margin_top(vspacing);
                        child.margin_bottom(0);
                        flex_basis(child, 1.0, 0);
                    }
                }
                else {
                    // Only one column.
                    if (columns === 1) {
                        child.fixed_width("100%");
                        child.stretch(true);
                        child.box_sizing("border-box");
                        child.margin_left(0); // reset for when it is called inside @media.
                        if (row > 0) {
                            child.margin_top(vspacing);
                        }
                        else {
                            child.margin_top(0); // reset for when it is called inside @media.
                        }
                        ++row;
                    }
                    else {
                        const is_last_node = is_last_non_divider(child);
                        const child_custom_basis = child._side_by_side_basis;
                        const basis = child_custom_basis == null ? 1 / columns : child_custom_basis;
                        child.stretch(true);
                        child.box_sizing("border-box");
                        child.margin_left(0); // reset for when it is called inside @media.
                        if (row > 0) {
                            child.margin_top(vspacing);
                        }
                        else {
                            child.margin_top(0); // reset for when it is called inside @media.
                        }
                        if (row_width + basis > 1) {
                            set_flex();
                            ++row;
                            row_width = 0;
                            col_children = [];
                            col_children.push([child, child_custom_basis]);
                        }
                        else if (row_width + basis === 1 || is_last_node) {
                            col_children.push([child, child_custom_basis]);
                            set_flex();
                            ++row;
                            row_width = 0;
                            col_children = [];
                        }
                        else {
                            col_children.push([child, child_custom_basis]);
                            row_width += basis;
                        }
                    }
                }
            });
            return this;
        }
        side_by_side_basis(basis) {
            if (basis == null) {
                return this._side_by_side_basis;
            }
            else if (basis === false) {
                this._side_by_side_basis = undefined;
            }
            else {
                this._side_by_side_basis = basis;
            }
            return this;
        }
        ellipsis_overflow(to, after_lines) {
            if (to == null) {
                return this.style.textOverflow === "ellipsis";
            }
            else if (to === true) {
                this.style.textOverflow = "ellipsis";
                this.style.overflow = "hidden";
                this.style.textWrap = "wrap";
                this.style.overflowWrap = "break-word";
                if (after_lines != null) {
                    this.style.webkitLineClamp = after_lines.toString();
                    this.style.webkitBoxOrient = "vertical";
                    this.style.display = "-webkit-box";
                }
                else {
                    this.style.whiteSpace = "nowrap";
                }
            }
            else if (to === false) {
                this.style.textOverflow = "default";
                this.style.whiteSpace = "default";
                this.style.overflow = "default";
                this.style.textWrap = "default";
                this.style.overflowWrap = "default";
            }
            return this;
        }
        align(value) {
            switch (this.base_element_type) {
                case "HStack":
                case "AnchorHStack":
                case "ZStack":
                    if (value == null) {
                        return this.style.justifyContent;
                    }
                    if (value === "default") {
                        value = "";
                    }
                    if (this.style.justifyContent !== value) {
                        this.style.justifyContent = value ?? "";
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
                    if (value == null) {
                        return this.style.alignItems;
                    }
                    if (value === "default") {
                        value = "normal";
                    }
                    if (this.style.alignItems !== value) {
                        this.style.alignItems = value ?? "";
                    }
                    return this;
                default:
                    if (value == null) {
                        return this.style.textAlign;
                    }
                    if (value === "default") {
                        value = "normal";
                    }
                    if (this.style.textAlign !== value) {
                        this.style.textAlign = value ?? "";
                    }
                    return this;
            }
        }
        /**
         * @docs:
         * @title: Leading
         * @desc: Sets the alignment to the start position.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        leading() {
            return this.align("start");
        }
        /**
         * @docs:
         * @title: Center Alignment
         * @desc: Sets the alignment of the element to center.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        center() {
            return this.align("center");
        }
        /**
         * @docs:
         * @title: Trailing
         * @desc: Aligns the element to the end.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        trailing() {
            return this.align("end");
        }
        align_vertical(value) {
            switch (this.base_element_type) {
                case "HStack":
                case "AnchorHStack":
                case "ZStack":
                    if (value == null) {
                        return this.style.alignItems;
                    }
                    if (value === "default") {
                        value = "normal";
                    }
                    if (value !== this.style.alignItems) {
                        this.style.alignItems = value ?? "";
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
                    if (value == null) {
                        return this.style.justifyContent;
                    }
                    if (value === "default") {
                        value = "";
                    }
                    if (value !== this.style.justifyContent) {
                        this.style.justifyContent = value ?? "";
                    }
                    return this;
                case "Text":
                    if (value == null) {
                        return this.style.alignItems;
                    }
                    if (this.style.display == null || !this.style.display.includes("flex")) {
                        this.display("flex");
                    }
                    if (value !== this.style.alignItems) {
                        this.style.alignItems = value ?? "";
                    }
                    return this;
                default:
                    if (value == null) {
                        return this.style.justifyContent;
                    }
                    if (value !== this.style.justifyContent) {
                        this.style.justifyContent = value ?? "";
                    }
                    return this;
            }
        }
        /**
         * @docs:
         * @title: Leading Vertical
         * @desc: Sets the vertical alignment to the start position.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        leading_vertical() {
            return this.align_vertical("start");
        }
        /**
         * @docs:
         * @title: Center Vertical
         * @desc: Centers the element vertically, optionally only when there is no overflow.
         * @param:
         *     @name: only_on_no_overflow
         *     @descr: Determines whether to center only when there is no overflow.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        center_vertical(only_on_no_overflow = false) {
            if (only_on_no_overflow) {
                this.on_render((e) => {
                    setTimeout(() => {
                        if (e.scrollHeight > e.clientHeight) {
                            e.align_vertical("default");
                        }
                        else {
                            e.center_vertical();
                        }
                    }, 50);
                });
                this.on_resize((e) => {
                    if (e.scrollHeight > e.clientHeight) {
                        e.align_vertical("default");
                    }
                    else {
                        e.center_vertical();
                    }
                });
            }
            return this.align_vertical("center");
        }
        /**
         * @docs:
         * @title: Trailing Vertical
         * @desc: Sets the vertical alignment to the trailing position.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        trailing_vertical() {
            return this.align_vertical("end");
        }
        /**
         * @docs:
         * @title: Align Text
         * @desc: Sets the text alignment using predefined shortcuts.
         * @param:
         *     @name: value
         *     @descr: The value representing the text alignment to set.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        align_text(value) {
            return this.text_align(value);
        }
        /**
         * @docs:
         * @title: Text Leading
         * @desc: Sets the text alignment to the start position for leading text.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        text_leading() {
            return this.text_align("start");
        }
        /**
         * @docs:
         * @title: Text Center
         * @desc: Sets the text alignment of the element to center.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        text_center() {
            return this.text_align("center");
        }
        /**
         * @docs:
         * @title: Text Trailing
         * @desc: Sets the text alignment to 'end' for trailing text.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        text_trailing() {
            return this.text_align("end");
        }
        /**
         * @docs:
         * @title: Align Height
         * @desc: Aligns items by height inside a horizontal stack.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        align_height() {
            return this.align_items("stretch");
        }
        text_wrap(value) {
            if (value == null) {
                return this.style.textWrap;
            }
            this.style.textWrap = value;
            return this;
        }
        line_clamp(value) {
            if (value == null) {
                return this.style.webkitLineClamp;
            }
            this.style.webkitLineClamp = value;
            return this;
        }
        box_orient(value) {
            if (value == null) {
                return this.style.webkitBoxOrient;
            }
            this.style.webkitBoxOrient = value;
            return this;
        }
        color(value) {
            if (value == null) {
                return this.style.color ?? "";
            }
            if (value instanceof GradientType) {
                this.style.backgroundImage = value.gradient;
                this.style.backgroundClip = "text";
                this.style["-webkit-background-clip"] = "text";
                this.style.color = "transparent";
            }
            else if (value._is_gradient || value.startsWith("linear-gradient(") || value.startsWith("radial-gradient(")) {
                this.style.backgroundImage = value;
                this.style.backgroundClip = "text";
                this.style["-webkit-background-clip"] = "text";
                this.style.color = "transparent";
            }
            else {
                this.style.color = value;
            }
            return this;
        }
        border(...values) {
            if (values.length === 0) {
                return this.style.border ?? "";
            }
            else if (values.length === 1) {
                this.style.border = values[0];
            }
            else if (values.length === 2) {
                this.style.border = this.pad_numeric(values[0]) + " solid " + values[1].toString();
            }
            else if (values.length === 3) {
                this.style.border = this.pad_numeric(values[0]) + " " + values[1].toString() + " " + values[2].toString();
            }
            else {
                console.error("Invalid number of arguments for function \"border()\".");
            }
            return this;
        }
        border_top(...values) {
            if (values.length === 0) {
                return this.style.borderTop;
            }
            else if (values.length === 1) {
                this.style.borderTop = values[0];
            }
            else if (values.length === 2) {
                this.style.borderTop = this.pad_numeric(values[0]) + " solid " + values[1].toString();
            }
            else if (values.length === 3) {
                this.style.borderTop = this.pad_numeric(values[0]) + " " + values[1].toString() + " " + values[2].toString();
            }
            else {
                console.error("Invalid number of arguments for function \"border_top()\".");
            }
            return this;
        }
        border_bottom(...values) {
            if (values.length === 0) {
                return this.style.borderBottom;
            }
            else if (values.length === 1) {
                this.style.borderBottom = values[0];
            }
            else if (values.length === 2) {
                this.style.borderBottom = this.pad_numeric(values[0]) + " solid " + values[1].toString();
            }
            else if (values.length === 3) {
                this.style.borderBottom = this.pad_numeric(values[0]) + " " + values[1].toString() + " " + values[2].toString();
            }
            else {
                console.error("Invalid number of arguments for function \"border_bottom()\".");
            }
            return this;
        }
        border_right(...values) {
            if (values.length === 0) {
                return this.style.borderRight;
            }
            else if (values.length === 1) {
                this.style.borderRight = values[0];
            }
            else if (values.length === 2) {
                this.style.borderRight = this.pad_numeric(values[0]) + " solid " + values[1].toString();
            }
            else if (values.length === 3) {
                this.style.borderRight = this.pad_numeric(values[0]) + " " + values[1].toString() + " " + values[2].toString();
            }
            else {
                console.error("Invalid number of arguments for function \"border_right()\".");
            }
            return this;
        }
        border_left(...values) {
            if (values.length === 0) {
                return this.style.borderLeft;
            }
            else if (values.length === 1) {
                this.style.borderLeft = values[0];
            }
            else if (values.length === 2) {
                this.style.borderLeft = this.pad_numeric(values[0]) + " solid " + values[1].toString();
            }
            else if (values.length === 3) {
                this.style.borderLeft = this.pad_numeric(values[0]) + " " + values[1].toString() + " " + values[2].toString();
            }
            else {
                console.error("Invalid number of arguments for function \"border_left()\".");
            }
            return this;
        }
        shadow(...values) {
            if (values.length === 0) {
                return this.style.boxShadow ?? "";
            }
            else if (values.length === 1) {
                return this.box_shadow(this.pad_numeric(values[0]));
            }
            else if (values.length === 4) {
                return this.box_shadow(this.pad_numeric(values[0]) + " " +
                    this.pad_numeric(values[1]) + " " +
                    this.pad_numeric(values[2]) + " " +
                    values[3]);
            }
            else {
                console.error("Invalid number of arguments for function \"shadow()\".");
                return "";
            }
        }
        drop_shadow(...values) {
            if (values.length === 0 || values.length === 1 && values[0] == null) {
                return this.filter();
            }
            else if (values.length === 1) {
                return this.filter("drop-shadow(" + this.pad_numeric(values[0]) + ") ");
            }
            else if (values.length === 4) {
                return this.filter("drop-shadow(" +
                    this.pad_numeric(values[0]) + " " +
                    this.pad_numeric(values[1]) + " " +
                    this.pad_numeric(values[2]) + " " +
                    values[3] + ") ");
            }
            else {
                console.error("Invalid number of arguments for function \"drop_shadow()\".");
                return "";
            }
        }
        greyscale(value) {
            if (value == null) {
                return this.filter();
            }
            else {
                return this.filter("grayscale(" + this.pad_percentage(value, "") + ") ");
            }
        }
        opacity(value) {
            switch (this.base_element_type) {
                case "Style":
                    if (value == null) {
                        return this._try_parse_float(this.filter(this.edit_filter_wrapper(this.style.filter, "opacity", value)), 1);
                    }
                    else {
                        if (value <= 1.0) {
                            value *= 100;
                        }
                        return this.filter(this.edit_filter_wrapper(this.style.filter, "opacity", "opacity(" + value + ") "));
                    }
                default:
                    if (value == null) {
                        return this._try_parse_float(this.style.opacity, 1);
                    }
                    this.style.opacity = value.toString();
                    return this;
            }
        }
        /**
         * @docs:
         * @title: Toggle Opacity
         * @desc: Toggles the opacity of the element between a specified value and fully opaque.
         * @param:
         *     @name: value
         *     @descr: The value to set the opacity to when toggling.
         *     @default: 0.25
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        toggle_opacity(value) {
            if (typeof this.style.opacity === "undefined" || this.style.opacity == "" || this.style.opacity == "1.0") {
                this.style.opacity = value.toString();
            }
            else {
                this.style.opacity = "1.0";
            }
            return this;
        }
        blur(value) {
            if (value == null) {
                return this.filter(this.edit_filter_wrapper(this.style.filter, "blur", value));
            }
            else {
                return this.filter(this.edit_filter_wrapper(this.style.filter, "blur", "blur(" + this.pad_numeric(value) + ") "));
            }
        }
        /**
         * @docs:
         * @title: Toggle Blur
         * @desc: Toggles the blur effect on the element with a specified value.
         * @param:
         *     @name: value
         *     @descr: The amount of blur to apply, defaulting to 10.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        toggle_blur(value = 10) {
            return this.filter(this.toggle_filter_wrapper(this.style.filter, "blur", "blur(" + this.pad_numeric(value) + ") "));
        }
        background_blur(value) {
            if (value == null) {
                return this.backdrop_filter(this.edit_filter_wrapper(this.style.backdropFilter, "blur", value));
            }
            else {
                return this.backdrop_filter(this.edit_filter_wrapper(this.style.backdropFilter, "blur", "blur(" + this.pad_numeric(value) + ") "));
            }
        }
        /**
         * @docs:
         * @title: Toggle Background Blur
         * @desc: Toggles the background blur effect by applying a backdrop filter.
         * @param:
         *     @name: value
         *     @descr: The intensity of the blur effect to apply.
         *     @default: 10
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        toggle_background_blur(value = 10) {
            return this.backdrop_filter(this.toggle_filter_wrapper(this.style.backdropFilter, "blur", "blur(" + this.pad_numeric(value) + ") "));
        }
        brightness(value) {
            if (value == null) {
                return this.filter(this.edit_filter_wrapper(this.style.filter, "brightness", value));
            }
            else {
                return this.filter(this.edit_filter_wrapper(this.style.filter, "brightness", "brightness(" + this.pad_percentage(value, "%") + ") "));
            }
        }
        /**
         * @docs:
         * @title: Toggle Brightness
         * @desc: Toggles the brightness of the element by applying a filter based on the provided value.
         * @param:
         *     @name: value
         *     @descr: The brightness value to set, defaults to 0.5 if not provided.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        toggle_brightness(value = 0.5) {
            return this.filter(this.toggle_filter_wrapper(this.style.filter, "brightness", "brightness(" + this.pad_percentage(value, "%") + ") "));
        }
        background_brightness(value) {
            if (value == null) {
                return this.backdrop_filter(this.edit_filter_wrapper(this.style.backdropFilter, "brightness", value));
            }
            else {
                return this.backdrop_filter(this.edit_filter_wrapper(this.style.backdropFilter, "brightness", "brightness(" + this.pad_percentage(value, "%") + ") "));
            }
        }
        /**
         * @docs:
         * @title: Toggle Background Brightness
         * @desc: Toggles the background brightness by applying a filter based on the provided value.
         * @param:
         *     @name: value
         *     @descr: The brightness value to set, defaulting to 10 if not provided.
         * @return:
         *     @descr: Returns the instance of the element for chaining.
         */
        toggle_background_brightness(value = 10) {
            return this.backdrop_filter(this.toggle_filter_wrapper(this.style.backdropFilter, "brightness", "brightness(" + this.pad_percentage(value, "%") + ") "));
        }
        rotate(value) {
            if (value == null) {
                return this.transform(this.edit_filter_wrapper(this.style.transform, "rotate", value));
            }
            else {
                let degree = 0;
                if (Utils.is_float(value)) {
                    degree = Math.round(360 * value);
                }
                else if (Utils.is_numeric(value)) {
                    degree = value.toString();
                }
                else if (typeof value === "string" && value.charAt(value.length - 1) === "%") {
                    // degree = Math.round(360 * parseFloat(value.substr(0, (value as string).length - 1) / 100));
                    degree = Math.round(360 * (parseFloat(value.substr(0, value.length - 1)) / 100));
                }
                else {
                    degree = value;
                }
                return this.transform(this.edit_filter_wrapper(this.style.transform, "rotate", `rotate(${degree}deg) `));
            }
        }
        /**
         * @docs:
         * @title: Delay
         * @desc: Set the delay for keyframes in the style element.
         * @param:
         *     @name: value
         *     @descr: The value of the delay to set.
         * @return:
         *     @descr: Returns the instance of the element for chaining.
         */
        delay(value) {
            this.style.delay = value;
            return this;
        }
        /**
         * @docs:
         * @title: Duration
         * @desc: Sets the duration style property for the element.
         * @param:
         *     @name: value
         *     @descr: The value to set for the duration property.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        duration(value) {
            this.style.duration = value;
            return this;
        }
        background(value) {
            if (value == null) {
                return this.style.background;
            }
            if (typeof value === "string" && (value.startsWith("linear-gradient") || value.startsWith("radial-gradient"))) {
                this.style.background = value;
                this.style.backgroundImage = value;
                this.style.backgroundRepeat = "no-repeat";
                this.style.backgroundSize = "cover";
            }
            else {
                this.style.background = value;
            }
            return this;
        }
        /**
         * @docs:
         * @title: Scale Font Size
         * @desc: Adjusts the font size based on a scaling factor relative to the current font size.
         * @param:
         *     @name: scale
         *     @descr: The scaling factor to apply to the current font size.
         *     @default: 1.0
         * @return:
         *     @descr: Returns the instance of the element for chaining.
         */
        scale_font_size(scale = 1.0) {
            const size = parseFloat(this.style.fontSize);
            if (!isNaN(size)) {
                this.font_size(size * scale);
            }
            return this;
        }
        display(value) {
            if (value == null) {
                return this.style.display;
            }
            if (value != null && value != "none") {
                this._element_display = value;
            }
            this.style.display = value;
            return this;
        }
        /**
         * @docs:
         * @title: Hide
         * @desc: Hides the element by setting its display style to none.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        hide() {
            this.style.display = "none";
            return this;
        }
        /**
         * @docs:
         * @title: Show
         * @desc: Displays the element by setting its display style property.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        show() {
            this.style.display = this._element_display;
            return this;
        }
        /**
         * @docs:
         * @title: Is Hidden
         * @desc: Checks if the element is currently hidden based on its display style.
         * @return:
         *     @description Returns true if the element is hidden; otherwise, false.
         */
        is_hidden() {
            return this.style.display === "none" || typeof this.style.display === "undefined";
        }
        /**
         * @docs:
         * @title: Is Visible
         * @desc: Checks if the element is visible based on its display style.
         * @return:
         *     @description Returns true if the element is visible, false otherwise.
         */
        is_visible() {
            return !(this.style.display === "none" || typeof this.style.display === "undefined");
        }
        /**
         * @docs:
         * @title: Toggle Visibility
         * @desc: Toggles the visibility of the element by showing or hiding it based on its current state.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        toggle_visibility() {
            if (this.is_hidden()) {
                this.show();
            }
            else {
                this.hide();
            }
            return this;
        }
        inner_html(value) {
            if (value == null) {
                return this.innerHTML;
            }
            this.innerHTML = value;
            return this;
        }
        outer_html(value) {
            if (value == null) {
                return this.outerHTML;
            }
            this.outerHTML = value;
            return this;
        }
        styles(css_attr) {
            if (css_attr == null) {
                let dict = {};
                for (let property in this.style) {
                    let value = this.style[property];
                    // Check for css styles assigned with "var(...)" otherwise they will not be added to the dict.
                    if (typeof value === 'string' &&
                        value !== undefined &&
                        value.startsWith("var(")) {
                        dict[property] = value;
                    }
                    // Check property.
                    else if (this.style.hasOwnProperty(property)) {
                        const is_index = (/^\d+$/).test(property);
                        // Custom css styles will be a direct key instead of the string index.
                        if (property[0] == "-" && is_index === false && value != '' && typeof value !== 'function') {
                            dict[property] = value;
                        }
                        // Default styles will be an index string instead of the key.
                        else if (is_index) {
                            const key = this.style[property];
                            const value = this.style[key];
                            if (key !== '' && key !== undefined && typeof key !== 'function' &&
                                value !== '' && value !== undefined && typeof value !== 'function') {
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
                if (i === "display" && value != null && value !== "none") {
                    this._element_display = value;
                }
                this.style[i] = value;
            }
            return this;
        }
        attr(key, value) {
            if (value == null) {
                return this.getAttribute(key);
            }
            this.setAttribute(key, value.toString());
            return this;
        }
        /**
         * @docs:
         * @title: Attributes
         * @desc: Sets multiple attributes for the element based on the provided dictionary.
         * @param:
         *     @name: html_attr
         *     @descr: A dictionary of attributes to set on the element.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        attrs(html_attr) {
            for (let i in html_attr) {
                this.setAttribute(i, html_attr[i].toString());
            }
            return this;
        }
        event(key, value) {
            if (value == null) {
                return this[key];
            }
            this[key] = value;
            return this;
        }
        /**
         * @docs:
         * @title: Events
         * @desc: Sets multiple event handlers on the current element using a dictionary of events.
         * @param:
         *     @name: html_events
         *     @descr: An object containing event names as keys and their corresponding handler functions as values.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        events(html_events) {
            for (let i in html_events) {
                this[i] = html_events[i];
            }
            return this;
        }
        class(value) {
            if (value == null) {
                return this.className ?? "";
            }
            this.className = value;
            return this;
        }
        /**
         * @docs:
         * @title: Toggle class
         * @description: Toggles a class name from the class list, adding it if it's not present, or removing it if it is.
         * @param:
         *     @name: name
         *     @descr: The class name to toggle.
         * @return:
         *     @description: Returns the instance of the element for chaining.
         */
        toggle_class(name) {
            this.classList.toggle(name);
            return this;
        }
        /**
         * @docs:
         * @title: Remove Class
         * @desc: Remove a class name from the class list of the element.
         * @param:
         *     @name: name
         *     @descr: The class name to be removed from the class list.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        remove_class(name) {
            this.classList.remove(name);
            return this;
        }
        /**
         * @docs:
         * @title: Remove all classes
         * @desc: Remove all classes from the class list.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        remove_classes() {
            while (this.classList.length > 0) {
                this.classList.remove(this.classList.item(0));
            }
            return this;
        }
        hover_brightness(mouse_down_brightness, mouse_over_brightness = 0.9) {
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
                this.onmousedown = () => { this.style.filter = `brightness(${mouse_down_brightness * 100}%)`; };
                this.onmouseover = () => { this.style.filter = `brightness(${mouse_over_brightness * 100}%)`; };
                this.onmouseup = () => { this.style.filter = "brightness(100%)"; };
                this.onmouseout = () => { this.style.filter = "brightness(100%)"; };
                return this;
            }
            // Retrieve enabled.
            else {
                return this.onmousedown != null;
            }
        }
        text_width(text) {
            const width_measurer = document.createElement("canvas").getContext("2d");
            if (width_measurer == null) {
                throw new Error("Unable to create a 2d canvas context.");
            }
            const computed = window.getComputedStyle(this);
            width_measurer.font = `${computed.fontStyle} ${computed.fontVariant} ${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`;
            if (text == null) {
                return width_measurer.measureText(this.textContent ?? "").width;
            }
            else {
                return width_measurer.measureText(text).width;
            }
        }
        frame_mode(...args) {
            if (args.length === 1) {
                args[0].push(this);
            }
            else if (args.length === 2 && args[0] instanceof FrameModesType) {
                if (args[1] !== args[0].active) {
                    this.hide();
                }
                args[0][args[1]].push(this);
            }
            return this;
        }
        // ---------------------------------------------------------
        // Media query functions.
        /**
         * @docs:
         * @title: Media Query
         * @desc: Creates a media query listener that triggers provided handlers based on the media query's state.
         * @param:
         *     @name: media_query
         *     @descr: The media query string to evaluate.
         *     @name: true_handler
         *     @descr: The function to execute when the media query matches.
         *     @name: false_handler
         *     @descr: The function to execute when the media query does not match.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        media(media_query, true_handler, false_handler) {
            // Edit query.
            if (media_query.first() !== "(") {
                media_query = "(" + media_query;
            }
            let c;
            while ((c = media_query.last()) === " " || c === "\t" || c === "\n") {
                media_query = media_query.substr(0, media_query.length - 1);
            }
            if (media_query.last() !== ")") {
                media_query = media_query + ")";
            }
            // Remove duplicates.
            if (this._media_queries[media_query] !== undefined) {
                this._media_queries[media_query].list.removeListener(this._media_queries[media_query].callback);
            }
            // Create query.
            const e = this;
            const query = {
                list: window.matchMedia(media_query),
                listener: undefined,
                callback: (query) => {
                    if (query.matches) {
                        if (true_handler !== undefined) {
                            true_handler(e);
                        }
                    }
                    else if (false_handler !== undefined) {
                        false_handler(e);
                    }
                }
            };
            // Watch media.
            query.callback(query.list); // Initialize the style based on the initial media query state
            query.list.addListener(query.callback); // Update the style when the media query state changes
            // Cache query.
            this._media_queries[media_query] = query;
            // Response.
            return this;
        }
        /**
         * @docs:
         * @title: Remove Media Query
         * @desc: Removes a specified media query from the element's media queries.
         * @param:
         *     @name: media_query
         *     @descr: The media query string to be removed.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        remove_media(media_query) {
            if (typeof this._media_queries === "object" && this._media_queries[media_query] !== undefined) {
                this._media_queries[media_query].list.removeListener(this._media_queries[media_query].callback);
            }
            return this;
        }
        /**
         * @docs:
         * @title: Remove Media Queries
         * @desc: Removes all media queries from the element.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        remove_medias() {
            if (typeof this._media_queries === "object") {
                Object.values(this._media_queries).forEach((query) => {
                    query.list.removeListener(query.callback);
                });
            }
            return this;
        }
        /**
         * @docs:
         * @title: Remove All Media
         * @desc: Removes all media queries and their associated listeners from the element.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        remove_all_media() {
            if (typeof this._media_queries === "object") {
                Object.values(this._media_queries).forEach((query) => {
                    query.list.removeListener(query.callback);
                });
            }
            return this;
        }
        // ---------------------------------------------------------
        // Animations.
        /**
         * @docs:
         * @title: Default Animate
         * @desc: Calls the animate function from the superclass with the provided arguments.
         * @param:
         *     @name: args
         *     @descr: The arguments to pass to the superclass animate function.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        default_animate(...args) {
            // @ts-ignore
            super.animate(...args);
            return this;
        }
        /**
         * @docs:
         * @title: Animate
         * @desc: Starts a new animation with the specified keyframes and options. Automatically resets the active animation.
         * @param:
         *     @name: options
         *     @descr: Configuration options for the animation including keyframes, duration, and callbacks.
         *     @attr:
         *         @name: keyframes
         *         @description An array of keyframe objects to animate.
         *         @name: delay
         *         @description Delay before starting the animation in milliseconds.
         *         @name: duration
         *         @description Duration of each keyframe in milliseconds.
         *         @name: repeat
         *         @description Whether the animation should repeat infinitely.
         *         @name: persistent
         *         @description Whether to keep the last keyframe when the animation ends.
         *         @name: on_finish
         *         @description Callback function to execute when the animation finishes.
         *         @name: easing
         *         @description Easing function to use for the animation.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        // @ts-ignore
        animate(options) {
            const e = this;
            options.repeat ??= false;
            options.persistent ??= false;
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
            for (let i = 0; i < options.keyframes.length; i++) {
                if (isVElement(options.keyframes[i])) {
                    options.keyframes[i] = options.keyframes[i].styles();
                }
                else {
                    for (let key in options.keyframes[i]) {
                        if (Utils.is_numeric(options.keyframes[i][key]) && convert.includes(key)) {
                            options.keyframes[i][key] = this.pad_numeric(options.keyframes[i][key]);
                        }
                    }
                }
            }
            function do_animation(index) {
                if (index + 1 < options.keyframes.length) {
                    const from = options.keyframes[index];
                    const to = options.keyframes[index + 1];
                    let opts = {
                        duration: options.duration,
                        fill: undefined,
                    };
                    if (from.duration != null) {
                        opts.duration = from.duration;
                    }
                    if ((index + 2 == options.keyframes.length && options.persistent && !options.repeat) ||
                        (to.delay != null && to.delay > 0)) {
                        opts.fill = "forwards";
                    }
                    e.default_animate([from, to], opts);
                    if (to.delay != null && to.delay > 0) {
                        clearTimeout(e._animate_timeout);
                        e._animate_timeout = setTimeout(() => do_animation(index + 1), (from.duration || options.duration) + (to.delay || 0));
                    }
                    else {
                        clearTimeout(e._animate_timeout);
                        e._animate_timeout = setTimeout(() => do_animation(index + 1), from.duration || options.duration);
                    }
                }
                else if (options.repeat) {
                    if (options.delay > 0) {
                        clearTimeout(e._animate_timeout);
                        e._animate_timeout = setTimeout(() => do_animation(0), options.delay);
                    }
                    else {
                        const delay = options.keyframes[options.keyframes.length - 1].duration || options.duration;
                        clearTimeout(e._animate_timeout);
                        e._animate_timeout = setTimeout(() => do_animation(0), delay);
                    }
                }
                else if (options.on_finish != null) {
                    options.on_finish(e);
                }
            }
            clearTimeout(this._animate_timeout);
            this._animate_timeout = setTimeout(() => do_animation(0), options.delay || 0);
            return this;
        }
        /**
         * @docs:
         * @title: Stop Animation
         * @desc: Stops the currently active animation by clearing the timeout.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        stop_animation() {
            clearTimeout(this._animate_timeout);
            return this;
        }
        /**
         * @docs:
         * @title: Slide Out
         * @desc: Animates the sliding out of an element in a specified direction with optional parameters for customization.
         * @param:
         *     @name: options
         *     @descr: Configuration options for the slide out animation.
         *     @attr:
         *         @name: direction
         *         @description The direction of the slide animation.
         *         @default: "top"
         *         @name: distance
         *         @description The distance in pixels for the slide animation.
         *         @default: 100
         *         @name: duration
         *         @description The duration of the animation in milliseconds.
         *         @default: 500
         *         @name: opacity
         *         @description Whether to animate the opacity of the element.
         *         @default: true
         *         @name: easing
         *         @description The easing function for the animation.
         *         @default: "ease"
         *         @name: hide
         *         @description Whether to hide the element after the animation completes.
         *         @default: true
         *         @name: remove
         *         @description Whether to remove the element from the DOM after the animation completes.
         *         @default: false
         *         @name: display
         *         @description The display property to set when showing the element again.
         *         @default: null
         *         @name: _slide_in
         *         @description Indicates if the animation is a slide-in animation.
         *         @default: false
         * @return:
         *     @description Returns a promise that resolves when the animation completes.
         */
        async slide_out(options) {
            const element = this;
            return new Promise((resolve, reject) => {
                // Vars.
                const old_transform = element.transform() || "";
                const old_transition = element.transition();
                let transform, initial_transform;
                if (options._slide_in) {
                    if (options.direction === "top") {
                        transform = `translateY(0)`;
                        initial_transform = `translateY(${-options.distance}px)`;
                    }
                    else if (options.direction === "bottom") {
                        transform = `translateY(0)`;
                        initial_transform = `translateY(${options.distance}px)`;
                    }
                    else if (options.direction === "right") {
                        transform = `translateX(0)`;
                        initial_transform = `translateX(${options.distance}px)`;
                    }
                    else if (options.direction === "left") {
                        transform = `translateX(0)`;
                        initial_transform = `translateX(${-options.distance}px)`;
                    }
                    else {
                        return reject(new Error(`Invalid direction "${options.direction}", the valid directions are "top", "bottom", "right", "left".`));
                    }
                }
                else {
                    if (options.direction === "top") {
                        transform = `translateY(${-options.distance}px)`;
                        initial_transform = "translateY(0)";
                    }
                    else if (options.direction === "bottom") {
                        transform = `translateY(${options.distance}px)`;
                        initial_transform = "translateY(0)";
                    }
                    else if (options.direction === "right") {
                        transform = `translateX(${options.distance}px)`;
                        initial_transform = "translateX(0)";
                    }
                    else if (options.direction === "left") {
                        transform = `translateX(${-options.distance}px)`;
                        initial_transform = "translateX(0)";
                    }
                    else {
                        return reject(new Error(`Invalid direction "${options.direction}", the valid directions are "top", "bottom", "right", "left".`));
                    }
                }
                initial_transform = old_transform + initial_transform;
                transform = old_transform + transform;
                // Set initial state.
                if (options._slide_in) {
                    if (options.display !== undefined) {
                        element.display(options.display);
                    }
                    else {
                        element.show();
                    }
                }
                element.transition("none");
                element.getBoundingClientRect(); // reflow.
                element.transform(initial_transform);
                element.opacity(options._slide_in ? 0 : 1);
                element.getBoundingClientRect(); // reflow.
                element.transition(`transform ${options.duration}ms ${options.easing ?? "ease-in-out"}, opacity ${options.duration}ms ease-in`);
                element.getBoundingClientRect(); // reflow.
                // Transition.
                if (options.opacity === false) {
                    element.transform(transform);
                }
                else {
                    element.opacity(options._slide_in ? 1 : 0);
                    element.transform(transform);
                }
                // Resolve animation.
                setTimeout(() => {
                    // Hide element.
                    if (options.hide && options._slide_in !== true) {
                        element.hide();
                    }
                    else if (options.remove && options._slide_in !== true) {
                        element.remove();
                    }
                    // Restore old transition.
                    element.transition(old_transition);
                    element.transform(old_transform);
                    // Resolve.
                    resolve();
                }, options.duration);
            });
        }
        /**
         * @docs:
         * @title: Slide In
         * @desc: Initiates a slide-in animation for the element with customizable parameters.
         * @param:
         *     @name: options
         *     @descr: Configuration options for the slide-in animation.
         *     @attr:
         *         @name: direction
         *         @description The direction from which the element will slide in (e.g., "top", "bottom", "left", "right").
         *         @name: distance
         *         @description The distance in pixels the element will slide in.
         *         @name: duration
         *         @description The duration of the slide animation in milliseconds.
         *         @name: opacity
         *         @description A boolean indicating whether to animate the opacity during the slide.
         *         @name: easing
         *         @description The easing function to use for the animation.
         *         @name: display
         *         @description An optional display property to use when showing the view again.
         * @return:
         *     @description Returns a promise that resolves when the slide-in animation is complete.
         */
        async slide_in({ direction = "top", distance = 100, duration = 500, opacity = true, easing = "ease", display = undefined, }) {
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
        /**
         * @docs:
         * @title: Dropdown Text Animation
         * @desc: Animates the text of a dropdown element with a specified animation effect.
         *         It allows for customization of distance, duration, and easing for each character.
         * @warning: Causes undefined behaviour when called on a non text element.
         * @param:
         *     @name: options
         *     @descr: An object containing animation settings.
         *     @attr:
         *         @name: distance
         *         @description The distance of pixels of the drop (negative) or rise (positive).
         *         @name: duration
         *         @description The duration of each individual character drop animation in milliseconds.
         *         @name: opacity_duration
         *         @description The factor for the duration in relation to the dropdown duration, 1.0 for 100%.
         *         @name: total_duration
         *         @description The total duration of the character drop animation, this parameter will overwrite the `duration` parameter.
         *         @name: delay
         *         @description The delay in milliseconds for each character drop.
         *         @name: start_delay
         *         @description The start delay of the animation in milliseconds.
         *         @name: easing
         *         @description The animation's easing.
         * @return:
         *     @description Returns a promise that resolves when the animation is complete.
         */
        async dropdown_animation({ distance = "-20px", duration = 150, opacity_duration = 1.25, total_duration = undefined, delay = 60, start_delay = 50, easing = "ease-in-out", } = {}) {
            return new Promise((resolve) => {
                // Initialize.
                const word_spans = [];
                const spans = [];
                const nodes = this.childNodes;
                // Args.
                if (typeof distance === "number") {
                    distance = `${distance}px`;
                }
                if (total_duration !== undefined) {
                    if (typeof this.textContent === "string") {
                        delay = total_duration / this.textContent.length;
                    }
                    else {
                        delay = total_duration;
                    }
                }
                // Convert each character into a span.
                const split_text = (text, text_style = null) => {
                    const words = text.split(" ");
                    for (let w = 0; w < words.length; w++) {
                        const word_span = Span()
                            .display("inline-block")
                            .white_space("nowrap");
                        if (text_style != null) {
                            word_span.style.cssText = text_style;
                        }
                        for (let c = 0; c < words[w].length; c++) {
                            const span = Span(words[w][c])
                                .white_space("pre")
                                .display("inline-block")
                                .opacity(0)
                                .transform(`translateY(${distance})`)
                                .transition(`transform ${duration}ms ${easing}, opacity ${Math.floor(duration * opacity_duration)}ms ${easing}`);
                            spans.append(span);
                            word_span.append(span);
                        }
                        if (w < words.length - 1) {
                            word_span.append(Span(" ").white_space("pre"));
                        }
                        word_spans.append(word_span);
                    }
                };
                const traverse = (nodes, text_style = "") => {
                    for (let n = 0; n < nodes.length; n++) {
                        const node = nodes[n];
                        if (node.nodeType === Node.TEXT_NODE) {
                            split_text(node.textContent, text_style);
                        }
                        else {
                            traverse(node.childNodes, text_style + node.style.cssText);
                        }
                    }
                };
                traverse(nodes);
                // Append word spans after the traversing.
                this.innerHTML = "";
                for (let i = 0; i < word_spans.length; i++) {
                    this.append(word_spans[i]);
                }
                // Perform animation.
                let index = 0;
                const animate_span = () => {
                    spans[index].opacity(1);
                    spans[index].transform("translateY(0px)");
                    ++index;
                    if (index === spans.length) {
                        resolve();
                    }
                    else {
                        setTimeout(animate_span, delay);
                    }
                };
                setTimeout(animate_span, start_delay);
            });
        }
        /**
         * @docs:
         * @title: Increment Number Animation
         * @desc: Animate incrementing a number with optional prefix and suffix.
         * @warning: Causes undefined behaviour when called on a non text element.
         * @param:
         *     @name: start
         *     @descr: The start number for the animation.
         * @param:
         *     @name: end
         *     @descr: The end number, the animation will end with the number value of `end - 1`.
         * @param:
         *     @name: duration
         *     @descr: The duration of each individual number increment in milliseconds.
         * @param:
         *     @name: total_duration
         *     @descr: The total duration of the entire animation, parameter `total_duration` precedes parameter `duration`.
         * @param:
         *     @name: delay
         *     @descr: The delay until the animation starts in milliseconds.
         * @param:
         *     @name: prefix
         *     @descr: The prefix string to prepend to the animated number.
         * @param:
         *     @name: suffix
         *     @descr: The suffix string to append to the animated number.
         * @return:
         *     @descr: Returns a promise that resolves when the animation completes.
         */
        async increment_number_animation({ start = 0, end = 100, duration = 150, total_duration = undefined, delay = 0, prefix = "", suffix = "", } = {}) {
            if (total_duration !== undefined) {
                duration = total_duration / (this.textContent?.length ?? 1);
            }
            return new Promise((resolve) => {
                let value = start;
                const animate = () => {
                    this.textContent = `${prefix}${value}${suffix}`;
                    ++value;
                    if (value < end) {
                        setTimeout(animate, duration);
                    }
                    else {
                        resolve();
                    }
                };
                setTimeout(animate, delay);
            });
        }
        // ---------------------------------------------------------
        // Events.
        /**
         * @docs:
         * @title: On Event
         * @desc: Registers an event callback for the specified event ID. This allows the element to respond to events.
         * @param:
         *     @name: id
         *     @descr: The unique identifier for the event to listen for.
         *     @name: callback
         *     @descr: The function to be executed when the event is triggered.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        on_event(id, callback) {
            Events.on(id, this, callback);
            return this;
        }
        /**
         * @docs:
         * @title: Remove On Event
         * @desc: Removes an event listener for the specified event ID.
         * @param:
         *     @name: id
         *     @descr: The identifier for the event to remove.
         * @param:
         *     @name: callback
         *     @descr: The function that was originally registered as the event handler.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        remove_on_event(id, callback) {
            Events.remove(id, this, callback);
            return this;
        }
        /**
         * @docs:
         * @title: Remove On Events
         * @desc: Removes all event callbacks associated with the given ID.
         * @param:
         *     @name: id
         *     @descr: The identifier for the events to be removed.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        remove_on_events(id) {
            Events.remove(id, this);
            return this;
        }
        /**
         * @docs:
         * @title: Timeout
         * @desc: Sets a timeout with optional id and debounce functionality.
         * @param:
         *     @name: delay
         *     @descr: The time in milliseconds to wait before executing the callback.
         *     @name: callback
         *     @descr: The function to execute after the timeout.
         *     @name: options
         *     @descr: Optional settings for the timeout behavior.
         *     @attr:
         *         @name: id
         *         @description An optional identifier for the timeout.
         *         @name: debounce
         *         @description If true, clears the previous timeout with the same id.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        timeout(delay, callback, options) {
            if (options != null && options.id != null) {
                if (options.debounce === true) {
                    clearTimeout(this._timeouts[options.id]);
                }
                this._timeouts[options.id] = setTimeout(() => callback(this), delay);
            }
            else {
                setTimeout(() => callback(this), delay);
            }
            return this;
        }
        /**
         * @docs:
         * @title: Clear Timeout
         * @desc: Clears a cached timeout by its ID. If timeouts are not initialized, they will be set up.
         * @param:
         *     @name: id
         *     @descr: The ID of the timeout to clear.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        clear_timeout(id) {
            if (this._timeouts === undefined) {
                this._timeouts = {};
            }
            clearTimeout(this._timeouts[id]);
            return this;
        }
        /**
         * @docs:
         * @title: Disable Button
         * @desc: Disables the button element, preventing user interaction.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        disable() {
            this._disabled = true;
            return this;
        }
        /**
         * @docs:
         * @title: Enable Button
         * @desc: Enables the button by setting the disabled state to false.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        enable() {
            this._disabled = false;
            return this;
        }
        on_click(...args) {
            let simulate_href, callback;
            if (args.length === 0) {
                return this.onclick;
            }
            else if (args.length === 1) {
                callback = args[0];
            }
            else if (args.length === 2 && args[0] == null) {
                callback = args[1];
            }
            else {
                simulate_href = args[0];
                callback = args[1];
                if (typeof simulate_href === "string") {
                    this.href(simulate_href);
                }
            }
            if (callback == null) {
                return this.onclick;
            }
            this.style.cursor = "pointer";
            this.user_select("none");
            const e = this;
            this.onclick = (event) => {
                if (simulate_href) {
                    event.preventDefault();
                }
                if (this._disabled !== true) {
                    callback(e, event);
                }
            };
            // deprecated, buttons now use <button>
            // if (this.element_type === "Button" || this.element_type === "LoaderButton" || this.element_type === "BorderButton") {
            // 	this.attr("rel", "noopener noreferrer"); // for seo.
            // }
            return this;
        }
        /**
         * @docs:
         * @title: On Click Redirect
         * @desc: Sets up a click event that redirects to the specified URL when triggered.
         * @param:
         *     @name: url
         *     @descr: The URL to redirect to when the click event occurs.
         * @return:
         *     @descr: Returns the instance of the element for chaining.
         */
        on_click_redirect(url) {
            return this.on_click(url, () => Utils.redirect(url));
        }
        on_scroll(opts_or_callback) {
            if (opts_or_callback == null) {
                return this.onscroll;
            }
            if (typeof opts_or_callback === "function") {
                const e = this;
                this.onscroll = (event) => opts_or_callback(e, event);
            }
            else {
                if (typeof opts_or_callback.delay === "number") {
                    let timer;
                    const e = this;
                    this.onscroll = function (t) {
                        clearTimeout(timer);
                        setTimeout(() => opts_or_callback.callback(e, t), opts_or_callback.delay);
                    };
                }
                else {
                    this.onscroll = (e) => opts_or_callback.callback(this, e);
                }
            }
            return this;
        }
        on_window_resize(opts) {
            // Set defaults.
            if (typeof opts === "function") {
                opts = { callback: opts };
            }
            else if (typeof opts !== "object") {
                opts = {};
            }
            opts.once ??= false;
            opts.delay ??= 25;
            // Get.
            if (opts.callback == null) {
                return window.onresize;
            }
            const e = this;
            window.addEventListener('resize', () => {
                if (opts.once && e._on_window_resize_timer != null) {
                    clearTimeout(e._on_window_resize_timer);
                }
                e._on_window_resize_timer = setTimeout(() => opts.callback(e), opts.delay);
            });
            return this;
        }
        /**
         * @docs:
         * @title: Attachment Drop
         * @desc: Custom on attachment drop event handling. This function sets up event listeners for drag and drop actions.
         * @param:
         *     @name: options
         *     @descr: Configuration options for the drop event.
         *     @attr:
         *         @name: callback
         *         @description Function to be called with the attachment details.
         *         @name: read
         *         @description Indicates whether to read the file data.
         *         @name: compress
         *         @description Indicates whether to compress the file data.
         *         @name: on_start
         *         @description Function to be called when the drag starts.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        on_attachment_drop(options) {
            const { callback, read = true, compress = false, on_start = () => { } } = options;
            this.ondragover = (event) => {
                event.preventDefault();
                if (event.dataTransfer) {
                    event.dataTransfer.dropEffect = "copy";
                }
                on_start(event);
            };
            this.ondrop = (event) => {
                event.preventDefault();
                const items = event.dataTransfer?.items;
                if (Array.isArray(items)) {
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
                                if (item.webkitGetAsEntry) {
                                    const entry = item.webkitGetAsEntry();
                                    if (entry && entry.isDirectory) {
                                        args.is_dir = true;
                                    }
                                }
                                if (args.is_dir === false && read) {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                        if (event.target) {
                                            if (compress) {
                                                args.data = Compression.compress(event.target.result);
                                                args.compressed = true;
                                            }
                                            else {
                                                args.data = event.target?.result;
                                                args.compressed = false;
                                            }
                                        }
                                        callback(args);
                                    };
                                    reader.readAsText(file);
                                }
                                else {
                                    callback(args);
                                }
                            }
                        }
                    }
                }
            };
            return this;
        }
        on_appear(callback_or_opts) {
            let callback = callback_or_opts, repeat = false, threshold = null;
            if (typeof callback_or_opts === "object") {
                callback = callback_or_opts.callback;
                if (callback_or_opts.repeat !== undefined) {
                    repeat = callback_or_opts.repeat;
                }
                if (callback_or_opts.threshold !== undefined) {
                    threshold = callback_or_opts.threshold;
                }
            }
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(async (entry) => {
                    const element = entry.target;
                    const currentY = entry.boundingClientRect.top;
                    const previousY = element._previousY !== undefined ? element._previousY : currentY;
                    const is_scrolling_down = currentY <= previousY;
                    const scroll_direction = is_scrolling_down ? 'down' : 'up';
                    element._previousY = currentY;
                    if (entry.isIntersecting && element._on_appear_callbacks) {
                        const intersection_ratio = entry.intersectionRatio;
                        let found;
                        for (let i = 0; i < element._on_appear_callbacks.length; i++) {
                            if (element._on_appear_callbacks[i].callback === callback) {
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            observer.unobserve(element);
                            return;
                        }
                        let matched = false;
                        if ((threshold == null || intersection_ratio >= threshold)) {
                            matched = true;
                            callback(element, { scroll_direction });
                        }
                        if (matched === false) {
                            observer.unobserve(element);
                            observer.observe(element);
                        }
                        else if (repeat === false) {
                            observer.unobserve(element);
                            observer.disconnect();
                        }
                    }
                });
            });
            // Push.
            this._on_appear_callbacks.push({ callback, threshold, repeat });
            observer.observe(this);
            return this;
        }
        /**
         * @docs:
         * @title: On Disappear
         * @desc: Sets up an event listener that triggers a callback when the element disappears from the user's view.
         * @experimental: true
         * @param:
         *     @name: callback_or_opts
         *     @descr: Can be a callback function or an options object containing the callback and repeat settings.
         *     @attr:
         *         @name: callback
         *         @description The function to call when the element disappears.
         *         @name: repeat
         *         @description Whether to repeat the observation after the callback is triggered.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        on_disappear(callback_or_opts) {
            const element = this; // Assuming 'this' is the element
            let callback = null;
            let repeat = false;
            if (typeof callback_or_opts === 'object') {
                callback = callback_or_opts.callback || null;
                if (callback_or_opts.repeat !== undefined)
                    repeat = callback_or_opts.repeat;
                // if (callback_or_opts.threshold !== undefined) {
                //     console.error(`Invalid parameter "threshold".`);
                // }
            }
            else if (typeof callback_or_opts === 'function') {
                callback = callback_or_opts;
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
                        // VBaseElement is about to disappear
                        if (callback) {
                            callback(element);
                        }
                        if (!repeat) {
                            observer.unobserve(element);
                        }
                    }
                });
            });
            observer.observe(element);
            return this;
        }
        on_enter(callback) {
            if (callback == null) {
                return this._on_enter_callback;
            }
            this._on_enter_callback = callback;
            if (this._on_keypress_set !== true) {
                this._on_keypress_set = true;
                const e = this;
                super.onkeypress = (event) => {
                    if (this._on_enter_callback !== undefined && event.key === "Enter" && event.shiftKey === false) {
                        this._on_enter_callback(e, event);
                    }
                    else if (this._on_escape_callback !== undefined && event.key === "Escape") {
                        this._on_escape_callback(e, event);
                    }
                };
            }
            return this;
        }
        on_escape(callback) {
            if (callback == null) {
                return this._on_escape_callback;
            }
            this._on_escape_callback = callback;
            if (this._on_keypress_set !== true) {
                this._on_keypress_set = true;
                const e = this;
                super.onkeypress = (event) => {
                    if (this._on_enter_callback !== undefined && event.key === "Enter" && event.shiftKey === false) {
                        this._on_enter_callback(e, event);
                    }
                    else if (this._on_escape_callback !== undefined && event.key === "Escape") {
                        this._on_escape_callback(e, event);
                    }
                };
            }
            return this;
        }
        on_theme_update(callback) {
            if (callback == null) {
                return this._on_theme_updates;
            }
            const found = Themes.theme_elements.iterate((item) => {
                if (item.element === this) {
                    return true;
                }
            });
            if (found !== true) {
                Themes.theme_elements.push({
                    element: this,
                });
            }
            this._on_theme_updates.push(callback);
            return this;
        }
        /**
         * @docs:
         * @title: Remove on Theme Update
         * @desc: Removes a callback from the theme update listeners.
         * @param:
         *     @name: callback
         *     @descr: The callback function to be removed from the listeners.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        remove_on_theme_update(callback) {
            this._on_theme_updates = this._on_theme_updates.drop(callback);
            return this;
        }
        /**
         * @docs:
         * @title: Remove on Theme Updates
         * @desc: Clears the list of theme update callbacks if they exist.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        remove_on_theme_updates() {
            this._on_theme_updates = [];
            return this;
        }
        on_render(callback) {
            if (callback == null) {
                return this._on_render_callbacks;
            }
            this._on_render_callbacks.push(callback);
            if (!this._observing_on_render) {
                this._observing_on_render = true;
                Utils.on_render_observer.observe(this);
            }
            return this;
        }
        /**
         * @docs:
         * @title: Remove on Render
         * @desc: Removes a callback from the on render callbacks array and stops observing if empty.
         * @param:
         *     @name: callback
         *     @descr: The callback function to remove from the on render callbacks.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        remove_on_render(callback) {
            this._on_render_callbacks = this._on_render_callbacks.drop(callback);
            if (this._on_render_callbacks.length === 0) {
                Utils.on_render_observer.unobserve(this);
                this._observing_on_render = false;
            }
            return this;
        }
        /**
         * @docs:
         * @title: Remove On Renders
         * @desc: Clears the on render callbacks and stops observing the element for render events.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        remove_on_renders() {
            this._on_render_callbacks = [];
            Utils.on_render_observer.unobserve(this);
            this._observing_on_render = false;
            return this;
        }
        /**
         * @docs:
         * @title: Is Rendered
         * @desc: Checks whether the element has been rendered or not.
         * @return:
         *     @description Returns true if the element has been rendered, otherwise false.
         */
        is_rendered() {
            return this.rendered;
        }
        /**
         * @docs:
         * @title: On Load
         * @desc: Registers a callback to be executed when the entire page is fully loaded.
         *          Note that this event will not fire if the `window.onload` callback is overwritten.
         * @param:
         *     @name: callback
         *     @descr: The function to be executed on load.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        on_load(callback) {
            Events.on("vweb.on_load", this, callback);
            return this;
        }
        /**
         * @docs:
         * @title: Remove on Load
         * @desc: Removes a callback function from the "vweb.on_load" event.
         * @param:
         *     @name: callback
         *     @descr: The function to be removed from the event listener.
         * @return:
         *     @descr: Returns the instance of the element for chaining.
         */
        remove_on_load(callback) {
            Events.remove("vweb.on_load", this, callback);
            return this;
        }
        /**
         * @docs:
         * @title: Remove On Loads
         * @desc: Removes the on_load event listener from the instance.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        remove_on_loads() {
            Events.remove("vweb.on_load", this);
            return this;
        }
        on_resize(callback) {
            if (callback == null) {
                return this._on_resize_callbacks;
            }
            this._on_resize_callbacks.push(callback);
            if (!this._observing_on_resize) {
                this._observing_on_resize = true;
                Utils.on_resize_observer.observe(this);
            }
            return this;
        }
        /**
         * @docs:
         * @title: Remove on Resize
         * @desc: Removes a callback from the resize event listeners. If no callbacks remain, it stops observing resize events.
         * @param:
         *     @name: callback
         *     @descr: The callback function to remove from the resize event listeners.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        remove_on_resize(callback) {
            this._on_resize_callbacks = this._on_resize_callbacks.drop(callback);
            if (this._on_resize_callbacks.length === 0) {
                Utils.on_resize_observer.unobserve(this);
                this._observing_on_resize = false;
            }
            return this;
        }
        /**
         * @docs:
         * @title: Remove on Resizes
         * @desc: Removes all resize callbacks and stops observing resize events for this element.
         * @param:
         *     @name: callback
         *     @descr: A callback function to be removed from the resize callbacks.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        remove_on_resizes() {
            this._on_resize_callbacks = [];
            Utils.on_resize_observer.unobserve(this);
            this._observing_on_resize = false;
            return this;
        }
        /**
         * @docs:
         * @title: On Resize Rule
         * @desc: Adds an on resize rule event that executes callbacks based on evaluation changes during a resize event.
         * @note: This function adds an `on_resize` callback.
         * @param:
         *     @name: evaluation
         *     @descr: The function to evaluate if the statement is true, the element node is passed as the first argument.
         * @param:
         *     @name: on_true
         *     @descr: The callback executed if the statement is true, the element node is passed as the first argument.
         * @param:
         *     @name: on_false
         *     @descr: The callback executed if the statement is false, the element node is passed as the first argument.
         * @return:
         *     @descr: Returns the instance of the element for chaining.
         */
        on_resize_rule(evaluation, on_true, on_false) {
            const eval_index = this._on_resize_rule_evals.length;
            this._on_resize_rule_evals[eval_index] = null;
            this.on_resize(() => {
                const result = evaluation(this);
                if (result !== this._on_resize_rule_evals[eval_index]) {
                    this._on_resize_rule_evals[eval_index] = result;
                    if (result && on_true) {
                        on_true(this);
                    }
                    else if (!result && on_false) {
                        on_false(this);
                    }
                }
            });
            return this;
        }
        /**
         * @docs:
         * @title: On Shortcut
         * @desc: Create key shortcuts for the element. This function takes an array of shortcut objects that define the key combinations and their associated actions.
         * @param:
         *     @name: shortcuts
         *     @descr: The array with shortcuts. Each shortcut object may have various attributes to define the key matching criteria and actions.
         * @return:
         *     @descr: This function does not return a value.
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
                        if (found === false) {
                            return false;
                        }
                    }
                    else {
                        const duration = shortcut.duration || 150;
                        if (this._on_shortcut_time === null ||
                            Date.now() - this._on_shortcut_time > duration) {
                            return false;
                        }
                        if (!((this._on_shortcut_key === keys[0] && key === keys[1]) ||
                            (this._on_shortcut_key === keys[1] && key === keys[0]))) {
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
                        if (found === false) {
                            return false;
                        }
                    }
                    else {
                        const duration = shortcut.duration || 150;
                        if (this._on_shortcut_time === null ||
                            Date.now() - this._on_shortcut_time > duration) {
                            return false;
                        }
                        if (!(this._on_shortcut_keycode === keys[0] && event.keyCode === keys[1] ||
                            this._on_shortcut_keycode === keys[1] && event.keyCode === keys[0])) {
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
            };
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
                const matched = shortcuts.some((shortcut) => {
                    if (is_match(key, event, shortcut)) {
                        shortcut.callback(this, event);
                        return true;
                    }
                });
                // Set previous key when there was no match.
                if (matched !== true) {
                    this._on_shortcut_time = Date.now();
                    this._on_shortcut_key = event.key;
                    this._on_shortcut_keycode = event.keyCode;
                }
            };
            return this;
        }
        on_context_menu(callback) {
            if (callback == null) {
                if (this._context_menu !== undefined) {
                    return this._context_menu;
                }
                else {
                    return this.oncontextmenu ?? undefined;
                }
            }
            if (callback instanceof ContextMenuElement || callback.element_type === "ContextMenu") {
                this._context_menu = callback;
                const _this_ = this;
                this.oncontextmenu = (event) => {
                    if (this._context_menu instanceof ContextMenuElement) {
                        this._context_menu.popup(event);
                    }
                };
            }
            else if (Array.isArray(callback)) {
                this._context_menu = ContextMenu(callback);
                const _this_ = this;
                this.oncontextmenu = (event) => {
                    if (this._context_menu instanceof ContextMenuElement) {
                        this._context_menu.popup(event);
                    }
                };
            }
            else {
                const _this_ = this;
                this.oncontextmenu = (event) => callback(_this_, event);
            }
            return this;
        }
        on_mouse_enter(callback) {
            if (callback == null) {
                return this._on_mouse_enter_callback;
            }
            this._on_mouse_enter_callback = callback;
            const e = this;
            this.addEventListener("mouseenter", (t) => callback(e, t));
            return this;
        }
        on_mouse_leave(callback) {
            if (callback == null) {
                return this._on_mouse_leave_callback;
            }
            this._on_mouse_leave_callback = callback;
            const e = this;
            this.addEventListener("mouseleave", (t) => callback(e, t));
            return this;
        }
        /**
         * @docs:
         * @title: On mouse over and out
         * @desc: Set callbacks for the on mouse over and mouse out events.
         * @param:
         *     @name: mouse_over
         *     @descr: The mouse over callback.
         * @param:
         *     @name: mouse_out
         *     @descr: The mouse out callback.
         * @return:
         *     @description Returns the instance of the element for chaining.
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
        // Other functions.
        // Get the children.
        // children() {
        // 	return this.children;
        // }
        // Get a child by index.
        // child(index) {
        // 	return this.children[index];
        // }
        /**
         * @docs:
         * @title: First Child
         * @desc: Retrieves the first child of the element.
         * @return:
         *     @description Returns the first child node of the element, or null if there are no children.
         */
        first_child() {
            return this.firstChild;
        }
        /**
         * @docs:
         * @title: Last Child
         * @desc: Retrieves the last child of the element.
         * @return:
         *     @description Returns the last child node of the element, or null if there are no children.
         */
        last_child() {
            return this.lastChild;
        }
        /**
         * @docs:
         * @title: Iterate Children
         * @desc: Iterates over the children of an element, executing a handler function for each child.
         * @param:
         *     @name: start
         *     @descr: The starting index for iteration, or a handler function.
         *     @name: end
         *     @descr: The ending index for iteration.
         *     @name: handler
         *     @descr: The function to execute for each child.
         * @return:
         *     @description Returns the result of the handler function if not null, otherwise returns null.
         * @funcs: 2
         */
        iterate(start, end, handler) {
            if (typeof start === "function") {
                handler = start;
                start = 0;
            }
            if (typeof start !== "number") {
                start = 0;
            }
            if (typeof end !== "number") {
                end = this.children.length;
            }
            if (handler == undefined) {
                throw new Error("Parameter 'handler' is undefined.");
            }
            // @ts-ignore
            for (let i = start; i < end; i++) {
                const res = handler(this.children[i], i);
                if (res != null) {
                    return res;
                }
            }
            return null;
        }
        /**
         * @docs:
         * @title: Iterate Child Nodes
         * @desc: Iterates over the child nodes of an element, executing a handler function for each node.
         * @param:
         *     @name: start
         *     @descr: The starting index for iteration, or a handler function.
         *     @name: end
         *     @descr: The ending index for iteration.
         *     @name: handler
         *     @descr: The function to execute for each child node.
         * @return:
         *     @description Returns the result of the handler function if not null, otherwise returns null.
         * @funcs: 2
         */
        iterate_nodes(start, end, handler) {
            if (typeof start === "function") {
                handler = start;
                start = 0;
            }
            if (typeof start !== "number") {
                start = 0;
            }
            if (end == null) {
                end = this.childNodes.length;
            }
            if (handler == undefined) {
                throw new Error("Parameter 'handler' is undefined.");
            }
            // @ts-ignore
            for (let i = start; i < end; i++) {
                const res = handler(this.childNodes[i], i);
                if (res != null) {
                    return res;
                }
            }
            return null;
        }
        /**
         * @docs:
         * @title: Set Default
         * @desc: Sets the current element as the default, allowing for a specific type to be set.
         * @param:
         *     @name: Type
         *     @descr: The type to set as default, defaults to VBaseElement if null.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        set_default(Type) {
            if (Type == null) {
                // @ts-ignore
                Type = VBaseElement;
            }
            if (Type != null) {
                Type.default_style = this.styles();
            }
            return this;
        }
        /**
         * @docs:
         * @title: Assign
         * @desc: Assigns a function or property to the instance. This allows dynamic property assignment for elements.
         * @param:
         *     @name: name
         *     @descr: The name of the property or function to assign.
         *     @name: value
         *     @descr: The value to assign to the property or function.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        assign(name, value) {
            this[name] = value;
            // This below does not always work somehow.
            // if (Utils.is_func(value)) {
            // 	VBaseElement.prototype[name] = value;
            // } else {
            // 	Object.defineProperty(VBaseElement.prototype, name, { value });
            // }
            return this;
        }
        /**
         * @docs:
         * @title: Extend
         * @desc: Extends the current instance by adding properties or functions from the provided object.
         * @param:
         *     @name: obj
         *     @descr: The object containing properties or functions to add to the current instance.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        extend(methods) {
            // for (let name in obj) {
            // 	this.assign(name, obj[name]);
            // }
            Object.assign(this, methods);
            return this;
        }
        /**
         * @docs:
         * @title: Select Contents
         * @desc: Selects the contents of the object, optionally overwriting existing selections.
         * @param:
         *     @name: overwrite
         *     @descr: Indicates whether to overwrite the current selection.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        select(overwrite = true) {
            // @ts-ignore
            if (super.select != undefined) {
                // @ts-ignore
                super.select();
                return this;
            }
            this.focus();
            const range = document.createRange();
            range.selectNodeContents(this);
            const selection = window.getSelection();
            if (selection != null) {
                if (overwrite) {
                    selection.removeAllRanges();
                }
                selection.addRange(range);
            }
            return this;
        }
        /**
         * @docs:
         * @title: Is Scrollable
         * @desc: Determines whether the element is scrollable based on its dimensions.
         * @return:
         *     @description Returns true if the element's scroll height or width exceeds its client height or width, indicating it is scrollable.
         */
        is_scrollable() {
            return this.scrollHeight > this.clientHeight || this.scrollWidth > this.clientWidth;
        }
        /**
         * @docs:
         * @title: Is Scrollable X
         * @desc: Checks if the element is scrollable in the horizontal direction by comparing its scroll width with its client width.
         * @return:
         *     @description Returns true if the element is scrollable horizontally, otherwise false.
         */
        is_scrollable_x() {
            return this.scrollWidth > this.clientWidth;
        }
        /**
         * @docs:
         * @title: Is Scrollable Y
         * @desc: Checks if the element is scrollable vertically by comparing its scroll height to its client height.
         * @return:
         *     @description Returns true if the element is scrollable in the Y direction, otherwise false.
         */
        is_scrollable_y() {
            return this.scrollHeight > this.clientHeight;
        }
        /**
         * @docs:
         * @title: Wait Till Children Rendered
         * @desc: Waits until the element and all its children are fully rendered.
         * This function should only be used in the `on_render` callback.
         * Note that it does not work with non-vweb nodes and may not function correctly.
         * @param:
         *     @name: timeout
         *     @descr: The maximum time to wait for rendering in milliseconds.
         *     @default: 10000
         * @return:
         *     @description Returns a promise that resolves when all children are rendered or rejects on timeout.
         */
        async wait_till_children_rendered(timeout = 10000) {
            return new Promise((resolve, reject) => {
                // Vars.
                let elapsed = 0;
                let step = 25;
                let nodes = [];
                // Map all nodes.
                const map_nodes = (node) => {
                    nodes.push(node);
                    for (let i = 0; i < node.children.length; i++) {
                        map_nodes(node.children[i]);
                    }
                };
                map_nodes(this);
                console.log(nodes);
                // Wait.
                const wait = () => {
                    const rendered = nodes.every(node => {
                        if (!node._is_connected) {
                            return false;
                        }
                        console.log(node._is_connected);
                        return true;
                    });
                    if (rendered) {
                        console.log("resolve", rendered);
                        resolve();
                    }
                    else {
                        if (elapsed > timeout) {
                            return reject(new Error("Timeout error."));
                        }
                        elapsed += step;
                        setTimeout(wait, step);
                    }
                };
                wait();
            });
        }
        // ---------------------------------------------------------
        // Pseudo-element functions.
        /**
         * @docs:
         * @title: Add Pseudo
         * @desc: Adds a pseudo element of a specified type to a node.
         *         Ensures that the pseudo element is properly initialized and styled.
         * @param:
         *     @name: type
         *     @descr: The type of pseudo element to add (e.g., before, after).
         *     @name: node
         *     @descr: The node to which the pseudo element is added.
         * @return:
         *     @descr: Returns the instance of the element for chaining.
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
            });
            if (alread_added !== true) {
                node.added_to_elements.append({
                    node: this,
                    type: type,
                });
            }
            // Initialize cache object.
            // Add/edit stylesheet.
            const css = `.${node.pseudo_id}::${type}{${node.style.cssText};content:"";}`;
            if (this._pseudo_stylesheets[node.pseudo_id] === undefined) {
                const style = document.createElement('style');
                style.type = 'text/css';
                document.head.appendChild(style); // append before insertRule
                if (style.sheet) {
                    style.sheet.insertRule(css, 0);
                }
                this._pseudo_stylesheets[node.pseudo_id] = style;
            }
            else {
                const style = this._pseudo_stylesheets[node.pseudo_id];
                if (style) {
                    style.sheet.deleteRule(0);
                    style.sheet.insertRule(css, 0);
                }
            }
            // Add class.
            this.classList.add(node.pseudo_id);
            // Response.
            return this;
        }
        /**
         * @docs:
         * @title: Remove Pseudo
         * @desc: Remove a pseudo element by the specified node.
         * @param:
         *     @name: node
         *     @descr: The node from which the pseudo element will be removed.
         *     @attr:
         *         @name: pseudo_id
         *         @description Identifier for the pseudo element to be removed.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        remove_pseudo(node) {
            if (node && node.pseudo_id) {
                this.classList.remove(node.pseudo_id);
            }
            this._pseudo_stylesheets[node.pseudo_id].remove();
            delete this._pseudo_stylesheets[node.pseudo_id];
            return this;
        }
        /**
         * @docs:
         * @title: Remove Pseudos
         * @desc:
         * 		Removes all pseudo classes and stylesheets associated with the element.
         * 		This function iterates through the class list and removes classes that start with "pseudo_".
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        remove_pseudos() {
            this.classList.forEach(name => {
                if (name.startsWith("pseudo_")) {
                    this.classList.remove(name);
                }
            });
            Object.values(this._pseudo_stylesheets).forEach(stylesheet => { stylesheet.remove(); });
            this._pseudo_stylesheets = {};
            return this;
        }
        /**
         * @docs:
         * @title: Add Pseudo Hover
         * @desc: Adds a pseudo element on mouse hover. This function does not work in combination with other mouse over events.
         * @param:
         *     @name: type
         *     @descr: The type of pseudo element to add.
         *     @name: node
         *     @descr: The node to which the pseudo element will be applied.
         *     @name: set_defaults
         *     @descr: A flag to set default values for the node.
         *     @default: true
         * @return:
         *     @descr: Returns the instance of the element for chaining.
         */
        pseudo_on_hover(type, node, set_defaults = true) {
            if (set_defaults) {
                node.position(0, 0, 0, 0);
                const border_radius = this.border_radius();
                if (border_radius && typeof node.border_radius === "function") {
                    node.border_radius(border_radius);
                }
                if (this.position() !== "absolute") {
                    this.position("relative");
                }
            }
            this.on_mouse_over(() => this.pseudo(type, node));
            this.on_mouse_out(() => this.remove_pseudo(node));
            return this;
        }
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
        abs_parent(value) {
            if (value == null) {
                return this._abs_parent;
            }
            this._abs_parent = value;
            return this;
        }
        /**
         * @docs:
         * @title: Assign to Parent As
         * @desc: Assigns the current element to a specified attribute of the parent element.
         * @param:
         *     @name: name
         *     @descr: The name of the attribute to assign the current element to.
         * @return:
         *     @descr: Returns the instance of the element for chaining.
         */
        assign_to_parent_as(name) {
            this._assign_to_parent_as = name;
            return this;
        }
        /**
         * @docs:
         * @title: Get Y Offset From Parent
         * @desc: Calculates the vertical offset of the current node relative to a specified parent node.
         * @param:
         *     @name: parent
         *     @descr: The parent node from which to calculate the offset.
         * @return:
         *     @description Returns the accumulated vertical offset from the current node to the parent node, or null if the parent wasn't found.
         *     @deprecated: This function may not work properly in all cases.
         */
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
        /**
         * @docs:
         * @title: Absolute Y Offset
         * @desc: Calculates the absolute vertical offset of the element from the top of the document.
         * @return:
         *     @description Returns the absolute Y offset in pixels.
         */
        absolute_y_offset() {
            let element = this;
            let top = 0;
            do {
                top += element.offsetTop || 0;
                element = element.offsetParent;
            } while (element);
            return top;
        }
        /**
         * @docs:
         * @title: Absolute X Offset
         * @desc: Calculates the absolute X offset of the current element in relation to its offset parents.
         * @return:
         *     @description Returns the total left offset in pixels as a number.
         */
        absolute_x_offset() {
            let element = this;
            let left = 0;
            do {
                left += element.offsetLeft || 0;
                element = element.offsetParent;
            } while (element);
            return left;
        }
        /**
         * @docs:
         * @title: Exec
         * @desc: Executes a provided function with the current element as its parameter.
         * @param:
         *     @name: callback
         *     @descr: A function to execute with the current element.
         * @return:
         *     @description Returns the instance of the element for chaining.
         */
        exec(callback) {
            callback(this);
            return this;
        }
        /**
         * @docs:
         * @title: Is child
         * @desc: Check if an element is a direct child of the element or the element itself.
         * @param:
         *     @name: target
         *     @descr: The target element to test.
         * @return:
         *     @description Returns true if the target is a direct child, otherwise false.
         */
        is_child(target) {
            return Utils.is_child(this, target);
        }
        /**
         * @docs:
         * @title: Is Child
         * @desc: Checks if an element is a recursively nested child of the element or the element itself.
         * @param:
         *     @name: target
         *     @descr: The target element to test.
         * @param:
         *     @name: stop_node
         *     @descr: A node at which to stop checking if target is a parent of the current element.
         * @return:
         *     @descr: Returns true if the target is a nested child, otherwise false.
         */
        is_nested_child(target, stop_node = null) {
            return Utils.is_nested_child(this, target, stop_node);
        }
        // ---------------------------------------------------------
        // Cast functions.
        /**
         * @docs:
         * @title: To String
         * @desc: Converts the current element to its string representation, setting an attribute in the process.
         * @return:
         *     @description Returns the outer HTML of the element as a string.
         */
        toString() {
            this.setAttribute("created_by_html", "true");
            return this.outerHTML;
        }
        accent_color(value) {
            if (value == null) {
                return this.style.accentColor;
            }
            this.style.accentColor = value;
            return this;
        }
        align_content(value) {
            if (value == null) {
                return this.style.alignContent;
            }
            this.style.alignContent = value;
            this.style.msAlignContent = value;
            this.style.webkitAlignContent = value;
            this.style.MozAlignContent = value;
            this.style.OAlignContent = value;
            return this;
        }
        align_items(value) {
            if (value == null) {
                return this.style.alignItems;
            }
            this.style.alignItems = value;
            this.style.msAlignItems = value;
            this.style.webkitAlignItems = value;
            this.style.MozAlignItems = value;
            this.style.OAlignItems = value;
            return this;
        }
        align_self(value) {
            if (value == null) {
                return this.style.alignSelf;
            }
            this.style.alignSelf = value;
            this.style.msAlignSelf = value;
            this.style.webkitAlignSelf = value;
            this.style.MozAlignSelf = value;
            this.style.OAlignSelf = value;
            return this;
        }
        all(value) {
            if (value == null) {
                return this.style.all;
            }
            this.style.all = value;
            return this;
        }
        animation(value) {
            if (value == null) {
                return this.style.animation;
            }
            this.style.animation = value;
            this.style.msAnimation = value;
            this.style.webkitAnimation = value;
            this.style.MozAnimation = value;
            this.style.OAnimation = value;
            return this;
        }
        animation_delay(value) {
            if (value == null) {
                return this.style.animationDelay;
            }
            this.style.animationDelay = value;
            this.style.msAnimationDelay = value;
            this.style.webkitAnimationDelay = value;
            this.style.MozAnimationDelay = value;
            this.style.OAnimationDelay = value;
            return this;
        }
        animation_direction(value) {
            if (value == null) {
                return this.style.animationDirection;
            }
            this.style.animationDirection = value;
            this.style.msAnimationDirection = value;
            this.style.webkitAnimationDirection = value;
            this.style.MozAnimationDirection = value;
            this.style.OAnimationDirection = value;
            return this;
        }
        animation_duration(value) {
            if (value == null) {
                return this.style.animationDuration;
            }
            this.style.animationDuration = value;
            this.style.msAnimationDuration = value;
            this.style.webkitAnimationDuration = value;
            this.style.MozAnimationDuration = value;
            this.style.OAnimationDuration = value;
            return this;
        }
        animation_fill_mode(value) {
            if (value == null) {
                return this.style.animationFillMode;
            }
            this.style.animationFillMode = value;
            this.style.msAnimationFillMode = value;
            this.style.webkitAnimationFillMode = value;
            this.style.MozAnimationFillMode = value;
            this.style.OAnimationFillMode = value;
            return this;
        }
        animation_iteration_count(value) {
            if (value == null) {
                return this.style.animationIterationCount;
            }
            this.style.animationIterationCount = value;
            this.style.msAnimationIterationCount = value;
            this.style.webkitAnimationIterationCount = value;
            this.style.MozAnimationIterationCount = value;
            this.style.OAnimationIterationCount = value;
            return this;
        }
        animation_name(value) {
            if (value == null) {
                return this.style.animationName;
            }
            this.style.animationName = value;
            this.style.msAnimationName = value;
            this.style.webkitAnimationName = value;
            this.style.MozAnimationName = value;
            this.style.OAnimationName = value;
            return this;
        }
        animation_play_state(value) {
            if (value == null) {
                return this.style.animationPlayState;
            }
            this.style.animationPlayState = value;
            this.style.msAnimationPlayState = value;
            this.style.webkitAnimationPlayState = value;
            this.style.MozAnimationPlayState = value;
            this.style.OAnimationPlayState = value;
            return this;
        }
        animation_timing_function(value) {
            if (value == null) {
                return this.style.animationTimingFunction;
            }
            this.style.animationTimingFunction = value;
            this.style.msAnimationTimingFunction = value;
            this.style.webkitAnimationTimingFunction = value;
            this.style.MozAnimationTimingFunction = value;
            this.style.OAnimationTimingFunction = value;
            return this;
        }
        aspect_ratio(value) {
            if (value == null) {
                return this.style.aspectRatio;
            }
            this.style.aspectRatio = value;
            return this;
        }
        backdrop_filter(value) {
            if (value == null) {
                return this.style.backdropFilter;
            }
            this.style.backdropFilter = value;
            this.style.msBackdropFilter = value;
            this.style.webkitBackdropFilter = value;
            this.style.MozBackdropFilter = value;
            this.style.OBackdropFilter = value;
            return this;
        }
        backface_visibility(value) {
            if (value == null) {
                return this.style.backfaceVisibility;
            }
            this.style.backfaceVisibility = value;
            this.style.msBackfaceVisibility = value;
            this.style.webkitBackfaceVisibility = value;
            this.style.MozBackfaceVisibility = value;
            this.style.OBackfaceVisibility = value;
            return this;
        }
        background_attachment(value) {
            if (value == null) {
                return this.style.backgroundAttachment;
            }
            this.style.backgroundAttachment = value;
            return this;
        }
        background_blend_mode(value) {
            if (value == null) {
                return this.style.backgroundBlendMode;
            }
            this.style.backgroundBlendMode = value;
            return this;
        }
        background_clip(value) {
            if (value == null) {
                return this.style.backgroundClip;
            }
            this.style.backgroundClip = value;
            this.style.msBackgroundClip = value;
            this.style.webkitBackgroundClip = value;
            this.style.MozBackgroundClip = value;
            this.style.OBackgroundClip = value;
            return this;
        }
        background_color(value) {
            if (value == null) {
                return this.style.backgroundColor;
            }
            this.style.backgroundColor = value;
            return this;
        }
        background_image(value) {
            if (value == null) {
                return this.style.backgroundImage;
            }
            this.style.backgroundImage = value;
            return this;
        }
        background_origin(value) {
            if (value == null) {
                return this.style.backgroundOrigin;
            }
            this.style.backgroundOrigin = value;
            this.style.msBackgroundOrigin = value;
            this.style.webkitBackgroundOrigin = value;
            this.style.MozBackgroundOrigin = value;
            this.style.OBackgroundOrigin = value;
            return this;
        }
        background_position(value) {
            if (value == null) {
                return this.style.backgroundPosition;
            }
            this.style.backgroundPosition = value;
            return this;
        }
        background_position_x(value) {
            if (value == null) {
                return this.style.backgroundPositionX;
            }
            this.style.backgroundPositionX = this.pad_numeric(value);
            return this;
        }
        background_position_y(value) {
            if (value == null) {
                return this.style.backgroundPositionY;
            }
            this.style.backgroundPositionY = this.pad_numeric(value);
            return this;
        }
        background_repeat(value) {
            if (value == null) {
                return this.style.backgroundRepeat;
            }
            this.style.backgroundRepeat = value;
            return this;
        }
        background_size(value) {
            if (value == null) {
                return this.style.backgroundSize;
            }
            this.style.backgroundSize = this.pad_numeric(value);
            this.style.msBackgroundSize = this.pad_numeric(value);
            this.style.webkitBackgroundSize = this.pad_numeric(value);
            this.style.MozBackgroundSize = this.pad_numeric(value);
            this.style.OBackgroundSize = this.pad_numeric(value);
            return this;
        }
        block_size(value) {
            if (value == null) {
                return this.style.blockSize;
            }
            this.style.blockSize = this.pad_numeric(value);
            return this;
        }
        border_block(value) {
            if (value == null) {
                return this.style.borderBlock;
            }
            this.style.borderBlock = value;
            return this;
        }
        border_block_color(value) {
            if (value == null) {
                return this.style.borderBlockColor;
            }
            this.style.borderBlockColor = value;
            return this;
        }
        border_block_end_color(value) {
            if (value == null) {
                return this.style.borderBlockEndColor;
            }
            this.style.borderBlockEndColor = value;
            return this;
        }
        border_block_end_style(value) {
            if (value == null) {
                return this.style.borderBlockEndStyle;
            }
            this.style.borderBlockEndStyle = value;
            return this;
        }
        border_block_end_width(value) {
            if (value == null) {
                return this.style.borderBlockEndWidth;
            }
            this.style.borderBlockEndWidth = this.pad_numeric(value);
            return this;
        }
        border_block_start_color(value) {
            if (value == null) {
                return this.style.borderBlockStartColor;
            }
            this.style.borderBlockStartColor = value;
            return this;
        }
        border_block_start_style(value) {
            if (value == null) {
                return this.style.borderBlockStartStyle;
            }
            this.style.borderBlockStartStyle = value;
            return this;
        }
        border_block_start_width(value) {
            if (value == null) {
                return this.style.borderBlockStartWidth;
            }
            this.style.borderBlockStartWidth = this.pad_numeric(value);
            return this;
        }
        border_block_style(value) {
            if (value == null) {
                return this.style.borderBlockStyle;
            }
            this.style.borderBlockStyle = value;
            return this;
        }
        border_block_width(value) {
            if (value == null) {
                return this.style.borderBlockWidth;
            }
            this.style.borderBlockWidth = this.pad_numeric(value);
            return this;
        }
        border_bottom_color(value) {
            if (value == null) {
                return this.style.borderBottomColor;
            }
            this.style.borderBottomColor = value;
            return this;
        }
        border_bottom_left_radius(value) {
            if (value == null) {
                return this.style.borderBottomLeftRadius;
            }
            this.style.borderBottomLeftRadius = this.pad_numeric(value);
            return this;
        }
        border_bottom_right_radius(value) {
            if (value == null) {
                return this.style.borderBottomRightRadius;
            }
            this.style.borderBottomRightRadius = this.pad_numeric(value);
            return this;
        }
        border_bottom_style(value) {
            if (value == null) {
                return this.style.borderBottomStyle;
            }
            this.style.borderBottomStyle = value;
            return this;
        }
        border_bottom_width(value) {
            if (value == null) {
                return this.style.borderBottomWidth;
            }
            this.style.borderBottomWidth = this.pad_numeric(value);
            return this;
        }
        border_collapse(value) {
            if (value == null) {
                return this.style.borderCollapse;
            }
            this.style.borderCollapse = value;
            return this;
        }
        border_color(value) {
            if (value == null) {
                return this.style.borderColor;
            }
            this.style.borderColor = value;
            return this;
        }
        border_image(value) {
            if (value == null) {
                return this.style.borderImage;
            }
            this.style.borderImage = value;
            this.style.msBorderImage = value;
            this.style.webkitBorderImage = value;
            this.style.MozBorderImage = value;
            this.style.OBorderImage = value;
            return this;
        }
        border_image_outset(value) {
            if (value == null) {
                return this.style.borderImageOutset;
            }
            this.style.borderImageOutset = value;
            return this;
        }
        border_image_repeat(value) {
            if (value == null) {
                return this.style.borderImageRepeat;
            }
            this.style.borderImageRepeat = value;
            return this;
        }
        border_image_slice(value) {
            if (value == null) {
                return this.style.borderImageSlice;
            }
            this.style.borderImageSlice = value;
            return this;
        }
        border_image_source(value) {
            if (value == null) {
                return this.style.borderImageSource;
            }
            this.style.borderImageSource = value;
            return this;
        }
        border_image_width(value) {
            if (value == null) {
                return this.style.borderImageWidth;
            }
            this.style.borderImageWidth = this.pad_numeric(value);
            return this;
        }
        border_inline(value) {
            if (value == null) {
                return this.style.borderInline;
            }
            this.style.borderInline = value;
            return this;
        }
        border_inline_color(value) {
            if (value == null) {
                return this.style.borderInlineColor;
            }
            this.style.borderInlineColor = value;
            return this;
        }
        border_inline_end_color(value) {
            if (value == null) {
                return this.style.borderInlineEndColor;
            }
            this.style.borderInlineEndColor = value;
            return this;
        }
        border_inline_end_style(value) {
            if (value == null) {
                return this.style.borderInlineEndStyle;
            }
            this.style.borderInlineEndStyle = value;
            return this;
        }
        border_inline_end_width(value) {
            if (value == null) {
                return this.style.borderInlineEndWidth;
            }
            this.style.borderInlineEndWidth = this.pad_numeric(value);
            return this;
        }
        border_inline_start_color(value) {
            if (value == null) {
                return this.style.borderInlineStartColor;
            }
            this.style.borderInlineStartColor = value;
            return this;
        }
        border_inline_start_style(value) {
            if (value == null) {
                return this.style.borderInlineStartStyle;
            }
            this.style.borderInlineStartStyle = value;
            return this;
        }
        border_inline_start_width(value) {
            if (value == null) {
                return this.style.borderInlineStartWidth;
            }
            this.style.borderInlineStartWidth = this.pad_numeric(value);
            return this;
        }
        border_inline_style(value) {
            if (value == null) {
                return this.style.borderInlineStyle;
            }
            this.style.borderInlineStyle = value;
            return this;
        }
        border_inline_width(value) {
            if (value == null) {
                return this.style.borderInlineWidth;
            }
            this.style.borderInlineWidth = this.pad_numeric(value);
            return this;
        }
        border_left_color(value) {
            if (value == null) {
                return this.style.borderLeftColor;
            }
            this.style.borderLeftColor = value;
            return this;
        }
        border_left_style(value) {
            if (value == null) {
                return this.style.borderLeftStyle;
            }
            this.style.borderLeftStyle = value;
            return this;
        }
        border_left_width(value) {
            if (value == null) {
                return this.style.borderLeftWidth;
            }
            this.style.borderLeftWidth = this.pad_numeric(value);
            return this;
        }
        border_radius(value) {
            if (value == null) {
                return this.style.borderRadius;
            }
            this.style.borderRadius = this.pad_numeric(value);
            this.style.msBorderRadius = this.pad_numeric(value);
            this.style.webkitBorderRadius = this.pad_numeric(value);
            this.style.MozBorderRadius = this.pad_numeric(value);
            this.style.OBorderRadius = this.pad_numeric(value);
            return this;
        }
        border_right_color(value) {
            if (value == null) {
                return this.style.borderRightColor;
            }
            this.style.borderRightColor = value;
            return this;
        }
        border_right_style(value) {
            if (value == null) {
                return this.style.borderRightStyle;
            }
            this.style.borderRightStyle = value;
            return this;
        }
        border_right_width(value) {
            if (value == null) {
                return this.style.borderRightWidth;
            }
            this.style.borderRightWidth = this.pad_numeric(value);
            return this;
        }
        border_spacing(value) {
            if (value == null) {
                return this.style.borderSpacing;
            }
            this.style.borderSpacing = value;
            return this;
        }
        border_style(value) {
            if (value == null) {
                return this.style.borderStyle;
            }
            this.style.borderStyle = value;
            return this;
        }
        border_top_color(value) {
            if (value == null) {
                return this.style.borderTopColor;
            }
            this.style.borderTopColor = value;
            return this;
        }
        border_top_left_radius(value) {
            if (value == null) {
                return this.style.borderTopLeftRadius;
            }
            this.style.borderTopLeftRadius = this.pad_numeric(value);
            return this;
        }
        border_top_right_radius(value) {
            if (value == null) {
                return this.style.borderTopRightRadius;
            }
            this.style.borderTopRightRadius = this.pad_numeric(value);
            return this;
        }
        border_top_style(value) {
            if (value == null) {
                return this.style.borderTopStyle;
            }
            this.style.borderTopStyle = value;
            return this;
        }
        border_top_width(value) {
            if (value == null) {
                return this.style.borderTopWidth;
            }
            this.style.borderTopWidth = this.pad_numeric(value);
            return this;
        }
        border_width(value) {
            if (value == null) {
                return this.style.borderWidth;
            }
            this.style.borderWidth = this.pad_numeric(value);
            return this;
        }
        bottom(value) {
            if (value == null) {
                return this.style.bottom;
            }
            this.style.bottom = this.pad_numeric(value);
            return this;
        }
        box_decoration_break(value) {
            if (value == null) {
                return this.style.boxDecorationBreak ?? "";
            }
            this.style.boxDecorationBreak = value;
            return this;
        }
        box_reflect(value) {
            if (value == null) {
                return this.style.boxReflect;
            }
            this.style.boxReflect = value;
            return this;
        }
        box_shadow(value) {
            if (value == null) {
                return this.style.boxShadow;
            }
            this.style.boxShadow = value;
            this.style.msBoxShadow = value;
            this.style.webkitBoxShadow = value;
            this.style.MozBoxShadow = value;
            this.style.OBoxShadow = value;
            return this;
        }
        box_sizing(value) {
            if (value == null) {
                return this.style.boxSizing;
            }
            this.style.boxSizing = value;
            this.style.msBoxSizing = value;
            this.style.webkitBoxSizing = value;
            this.style.MozBoxSizing = value;
            this.style.OBoxSizing = value;
            return this;
        }
        break_after(value) {
            if (value == null) {
                return this.style.breakAfter;
            }
            this.style.breakAfter = value;
            return this;
        }
        break_before(value) {
            if (value == null) {
                return this.style.breakBefore;
            }
            this.style.breakBefore = value;
            return this;
        }
        break_inside(value) {
            if (value == null) {
                return this.style.breakInside;
            }
            this.style.breakInside = value;
            return this;
        }
        caption_side(value) {
            if (value == null) {
                return this.style.captionSide;
            }
            this.style.captionSide = value;
            return this;
        }
        caret_color(value) {
            if (value == null) {
                return this.style.caretColor;
            }
            this.style.caretColor = value;
            return this;
        }
        clear(value) {
            if (value == null) {
                return this.style.clear;
            }
            this.style.clear = value;
            return this;
        }
        clip(value) {
            if (value == null) {
                return this.style.clip;
            }
            this.style.clip = value;
            return this;
        }
        column_count(value) {
            if (value == null) {
                return this._try_parse_float(this.style.columnCount, null);
            }
            value = value.toString();
            this.style.columnCount = value;
            this.style.msColumnCount = value;
            this.style.webkitColumnCount = value;
            this.style.MozColumnCount = value;
            this.style.OColumnCount = value;
            return this;
        }
        column_fill(value) {
            if (value == null) {
                return this.style.columnFill;
            }
            this.style.columnFill = value;
            return this;
        }
        column_gap(value) {
            if (value == null) {
                return this.style.columnGap;
            }
            value = this.pad_numeric(value);
            this.style.columnGap = value;
            this.style.msColumnGap = value;
            this.style.webkitColumnGap = value;
            this.style.MozColumnGap = value;
            this.style.OColumnGap = value;
            return this;
        }
        column_rule(value) {
            if (value == null) {
                return this.style.columnRule;
            }
            this.style.columnRule = value;
            this.style.msColumnRule = value;
            this.style.webkitColumnRule = value;
            this.style.MozColumnRule = value;
            this.style.OColumnRule = value;
            return this;
        }
        column_rule_color(value) {
            if (value == null) {
                return this.style.columnRuleColor;
            }
            this.style.columnRuleColor = value;
            this.style.msColumnRuleColor = value;
            this.style.webkitColumnRuleColor = value;
            this.style.MozColumnRuleColor = value;
            this.style.OColumnRuleColor = value;
            return this;
        }
        column_rule_style(value) {
            if (value == null) {
                return this.style.columnRuleStyle;
            }
            this.style.columnRuleStyle = value;
            this.style.msColumnRuleStyle = value;
            this.style.webkitColumnRuleStyle = value;
            this.style.MozColumnRuleStyle = value;
            this.style.OColumnRuleStyle = value;
            return this;
        }
        column_rule_width(value) {
            if (value == null) {
                return this.style.columnRuleWidth;
            }
            value = this.pad_numeric(value);
            this.style.columnRuleWidth = value;
            this.style.msColumnRuleWidth = value;
            this.style.webkitColumnRuleWidth = value;
            this.style.MozColumnRuleWidth = value;
            this.style.OColumnRuleWidth = value;
            return this;
        }
        column_span(value) {
            if (value == null) {
                return this._try_parse_float(this.style.columnSpan, null);
            }
            this.style.columnSpan = value.toString();
            return this;
        }
        column_width(value) {
            if (value == null) {
                return this.style.columnWidth;
            }
            value = this.pad_numeric(value);
            this.style.columnWidth = value;
            this.style.msColumnWidth = value;
            this.style.webkitColumnWidth = value;
            this.style.MozColumnWidth = value;
            this.style.OColumnWidth = value;
            return this;
        }
        columns(value) {
            if (value == null) {
                return this.style.columns;
            }
            this.style.columns = value.toString();
            return this;
        }
        content(value) {
            if (value == null) {
                return this.style.content ?? "";
            }
            this.style.content = value.toString();
            return this;
        }
        counter_increment(value) {
            if (value == null) {
                return this.style.counterIncrement;
            }
            this.style.counterIncrement = value.toString();
            return this;
        }
        counter_reset(value) {
            if (value == null) {
                return this.style.counterReset;
            }
            this.style.counterReset = value;
            return this;
        }
        cursor(value) {
            if (value == null) {
                return this.style.cursor;
            }
            this.style.cursor = value;
            return this;
        }
        direction(value) {
            if (value == null) {
                return this.style.direction;
            }
            this.style.direction = value;
            return this;
        }
        empty_cells(value) {
            if (value == null) {
                return this.style.emptyCells ?? "";
            }
            this.style.emptyCells = value;
            return this;
        }
        filter(value) {
            if (value == null) {
                return this.style.filter;
            }
            this.style.filter = value;
            this.style.msFilter = value;
            this.style.webkitFilter = value;
            this.style.MozFilter = value;
            this.style.OFilter = value;
            return this;
        }
        flex(value) {
            if (value == null) {
                return this.style.flex;
            }
            this.style.flex = value;
            this.style.msFlex = value;
            this.style.webkitFlex = value;
            this.style.MozFlex = value;
            this.style.OFlex = value;
            return this;
        }
        flex_basis(value) {
            if (value == null) {
                return this.style.flexBasis;
            }
            value = value.toString();
            this.style.flexBasis = value;
            this.style.msFlexBasis = value;
            this.style.webkitFlexBasis = value;
            this.style.MozFlexBasis = value;
            this.style.OFlexBasis = value;
            return this;
        }
        flex_direction(value) {
            if (value == null) {
                return this.style.flexDirection;
            }
            this.style.flexDirection = value;
            this.style.msFlexDirection = value;
            this.style.webkitFlexDirection = value;
            this.style.MozFlexDirection = value;
            this.style.OFlexDirection = value;
            return this;
        }
        flex_flow(value) {
            if (value == null) {
                return this.style.flexFlow;
            }
            this.style.flexFlow = value;
            this.style.msFlexFlow = value;
            this.style.webkitFlexFlow = value;
            this.style.MozFlexFlow = value;
            this.style.OFlexFlow = value;
            return this;
        }
        flex_grow(value) {
            if (value == null) {
                return this._try_parse_float(this.style.flexGrow, null);
            }
            value = value.toString();
            this.style.flexGrow = value;
            this.style.msFlexGrow = value;
            this.style.webkitFlexGrow = value;
            this.style.MozFlexGrow = value;
            this.style.OFlexGrow = value;
            return this;
        }
        flex_shrink(value) {
            if (value == null) {
                return this._try_parse_float(this.style.flexShrink, null);
            }
            value = value.toString();
            this.style.flexShrink = value;
            this.style.msFlexShrink = value;
            this.style.webkitFlexShrink = value;
            this.style.MozFlexShrink = value;
            this.style.OFlexShrink = value;
            return this;
        }
        flex_wrap(value) {
            if (value == null) {
                return this.style.flexWrap;
            }
            this.style.flexWrap = value;
            this.style.msFlexWrap = value;
            this.style.webkitFlexWrap = value;
            this.style.MozFlexWrap = value;
            this.style.OFlexWrap = value;
            return this;
        }
        float(value) {
            if (value == null) {
                return this.style.float;
            }
            this.style.float = value;
            return this;
        }
        font(value) {
            if (value == null) {
                return this.style.font;
            }
            this.style.font = value;
            return this;
        }
        font_family(value) {
            if (value == null) {
                return this.style.fontFamily;
            }
            this.style.fontFamily = value;
            return this;
        }
        font_feature_settings(value) {
            if (value == null) {
                return this.style.fontFeatureSettings;
            }
            this.style.fontFeatureSettings = value;
            return this;
        }
        font_kerning(value) {
            if (value == null) {
                return this.style.fontKerning;
            }
            this.style.fontKerning = value;
            return this;
        }
        font_language_override(value) {
            if (value == null) {
                return this.style.fontLanguageOverride;
            }
            this.style.fontLanguageOverride = value;
            return this;
        }
        font_size(value) {
            if (value == null) {
                return this.style.fontSize;
            }
            this.style.fontSize = this.pad_numeric(value);
            return this;
        }
        font_size_adjust(value) {
            if (value == null) {
                return this.style.fontSizeAdjust;
            }
            this.style.fontSizeAdjust = value;
            return this;
        }
        font_stretch(value) {
            if (value == null) {
                return this.style.fontStretch;
            }
            this.style.fontStretch = value;
            return this;
        }
        font_style(value) {
            if (value == null) {
                return this.style.fontStyle;
            }
            this.style.fontStyle = value;
            return this;
        }
        font_synthesis(value) {
            if (value == null) {
                return this.style.fontSynthesis;
            }
            this.style.fontSynthesis = value;
            return this;
        }
        font_variant(value) {
            if (value == null) {
                return this.style.fontVariant;
            }
            this.style.fontVariant = value;
            return this;
        }
        font_variant_alternates(value) {
            if (value == null) {
                return this.style.fontVariantAlternates;
            }
            this.style.fontVariantAlternates = value;
            return this;
        }
        font_variant_caps(value) {
            if (value == null) {
                return this.style.fontVariantCaps;
            }
            this.style.fontVariantCaps = value;
            return this;
        }
        font_variant_east_asian(value) {
            if (value == null) {
                return this.style.fontVariantEastAsian;
            }
            this.style.fontVariantEastAsian = value;
            return this;
        }
        font_variant_ligatures(value) {
            if (value == null) {
                return this.style.fontVariantLigatures;
            }
            this.style.fontVariantLigatures = value;
            return this;
        }
        font_variant_numeric(value) {
            if (value == null) {
                return this.style.fontVariantNumeric;
            }
            this.style.fontVariantNumeric = value;
            return this;
        }
        font_variant_position(value) {
            if (value == null) {
                return this.style.fontVariantPosition;
            }
            this.style.fontVariantPosition = value;
            return this;
        }
        font_weight(value) {
            if (value == null) {
                return this.style.fontWeight;
            }
            this.style.fontWeight = value.toString();
            return this;
        }
        gap(value) {
            if (value == null) {
                return this.style.gap;
            }
            this.style.gap = this.pad_numeric(value);
            return this;
        }
        grid(value) {
            if (value == null) {
                return this.style.grid;
            }
            this.style.grid = value;
            return this;
        }
        grid_area(value) {
            if (value == null) {
                return this.style.gridArea;
            }
            this.style.gridArea = value;
            return this;
        }
        grid_auto_columns(value) {
            if (value == null) {
                return this.style.gridAutoColumns;
            }
            this.style.gridAutoColumns = value.toString();
            return this;
        }
        grid_auto_flow(value) {
            if (value == null) {
                return this.style.gridAutoFlow;
            }
            this.style.gridAutoFlow = value;
            return this;
        }
        grid_auto_rows(value) {
            if (value == null) {
                return this.style.gridAutoRows;
            }
            this.style.gridAutoRows = value.toString();
            return this;
        }
        grid_column(value) {
            if (value == null) {
                return this.style.gridColumn;
            }
            this.style.gridColumn = value;
            return this;
        }
        grid_column_end(value) {
            if (value == null) {
                return this.style.gridColumnEnd;
            }
            this.style.gridColumnEnd = value.toString();
            return this;
        }
        grid_column_gap(value) {
            if (value == null) {
                return this.style.gridColumnGap;
            }
            this.style.gridColumnGap = this.pad_numeric(value);
            return this;
        }
        grid_column_start(value) {
            if (value == null) {
                return this.style.gridColumnStart;
            }
            this.style.gridColumnStart = value.toString();
            return this;
        }
        grid_gap(value) {
            if (value == null) {
                return this.style.gridGap;
            }
            this.style.gridGap = this.pad_numeric(value);
            return this;
        }
        grid_row(value) {
            if (value == null) {
                return this.style.gridRow;
            }
            this.style.gridRow = value;
            return this;
        }
        grid_row_end(value) {
            if (value == null) {
                return this.style.gridRowEnd;
            }
            this.style.gridRowEnd = value;
            return this;
        }
        grid_row_gap(value) {
            if (value == null) {
                return this.style.gridRowGap;
            }
            this.style.gridRowGap = this.pad_numeric(value);
            return this;
        }
        grid_row_start(value) {
            if (value == null) {
                return this.style.gridRowStart;
            }
            this.style.gridRowStart = value.toString();
            return this;
        }
        grid_template(value) {
            if (value == null) {
                return this.style.gridTemplate;
            }
            this.style.gridTemplate = value;
            return this;
        }
        grid_template_areas(value) {
            if (value == null) {
                return this.style.gridTemplateAreas;
            }
            this.style.gridTemplateAreas = value;
            return this;
        }
        grid_template_columns(value) {
            if (value == null) {
                return this.style.gridTemplateColumns;
            }
            this.style.gridTemplateColumns = value;
            return this;
        }
        grid_template_rows(value) {
            if (value == null) {
                return this.style.gridTemplateRows;
            }
            this.style.gridTemplateRows = value.toString();
            return this;
        }
        hanging_punctuation(value) {
            if (value == null) {
                return this.style.hangingPunctuation;
            }
            this.style.hangingPunctuation = value;
            return this;
        }
        hyphens(value) {
            if (value == null) {
                return this.style.hyphens;
            }
            this.style.hyphens = value;
            return this;
        }
        image_rendering(value) {
            if (value == null) {
                return this.style.imageRendering;
            }
            this.style.imageRendering = value;
            return this;
        }
        inline_size(value) {
            if (value == null) {
                return this.style.inlineSize;
            }
            this.style.inlineSize = this.pad_numeric(value);
            return this;
        }
        inset(value) {
            if (value == null) {
                return this.style.inset;
            }
            this.style.inset = this.pad_numeric(value);
            return this;
        }
        inset_block(value) {
            if (value == null) {
                return this.style.insetBlock;
            }
            this.style.insetBlock = this.pad_numeric(value);
            return this;
        }
        inset_block_end(value) {
            if (value == null) {
                return this.style.insetBlockEnd ?? "";
            }
            this.style.insetBlockEnd = this.pad_numeric(value);
            return this;
        }
        inset_block_start(value) {
            if (value == null) {
                return this.style.insetBlockStart;
            }
            this.style.insetBlockStart = this.pad_numeric(value);
            return this;
        }
        inset_inline(value) {
            if (value == null) {
                return this.style.insetInline;
            }
            this.style.insetInline = this.pad_numeric(value);
            return this;
        }
        inset_inline_end(value) {
            if (value == null) {
                return this.style.insetInlineEnd;
            }
            this.style.insetInlineEnd = this.pad_numeric(value);
            return this;
        }
        inset_inline_start(value) {
            if (value == null) {
                return this.style.insetInlineStart;
            }
            this.style.insetInlineStart = this.pad_numeric(value);
            ;
            return this;
        }
        isolation(value) {
            if (value == null) {
                return this.style.isolation;
            }
            this.style.isolation = value;
            return this;
        }
        justify_content(value) {
            if (value == null) {
                return this.style.justifyContent;
            }
            this.style.justifyContent = value;
            this.style.msJustifyContent = value;
            this.style.webkitJustifyContent = value;
            this.style.MozJustifyContent = value;
            this.style.OJustifyContent = value;
            return this;
        }
        justify_items(value) {
            if (value == null) {
                return this.style.justifyItems;
            }
            this.style.justifyItems = value;
            return this;
        }
        justify_self(value) {
            if (value == null) {
                return this.style.justifySelf;
            }
            this.style.justifySelf = value;
            return this;
        }
        left(value) {
            if (value == null) {
                return this.style.left;
            }
            this.style.left = this.pad_numeric(value);
            return this;
        }
        letter_spacing(value) {
            if (value == null) {
                return this.style.letterSpacing;
            }
            this.style.letterSpacing = this.pad_numeric(value);
            return this;
        }
        line_break(value) {
            if (value == null) {
                return this.style.lineBreak;
            }
            this.style.lineBreak = value;
            return this;
        }
        line_height(value) {
            if (value == null) {
                return this.style.lineHeight;
            }
            this.style.lineHeight = this.pad_numeric(value);
            return this;
        }
        list_style(value) {
            if (value == null) {
                return this.style.listStyle;
            }
            this.style.listStyle = value;
            return this;
        }
        list_style_image(value) {
            if (value == null) {
                return this.style.listStyleImage;
            }
            this.style.listStyleImage = value;
            return this;
        }
        list_style_position(value) {
            if (value == null) {
                return this.style.listStylePosition;
            }
            this.style.listStylePosition = value;
            return this;
        }
        list_style_type(value) {
            if (value == null) {
                return this.style.listStyleType;
            }
            this.style.listStyleType = value;
            return this;
        }
        margin_block(value) {
            if (value == null) {
                return this.style.marginBlock;
            }
            this.style.marginBlock = this.pad_numeric(value);
            return this;
        }
        margin_block_end(value) {
            if (value == null) {
                return this.style.marginBlockEnd;
            }
            this.style.marginBlockEnd = this.pad_numeric(value);
            return this;
        }
        margin_block_start(value) {
            if (value == null) {
                return this.style.marginBlockStart;
            }
            this.style.marginBlockStart = this.pad_numeric(value);
            return this;
        }
        margin_inline(value) {
            if (value == null) {
                return this.style.marginInline;
            }
            this.style.marginInline = this.pad_numeric(value);
            return this;
        }
        margin_inline_end(value) {
            if (value == null) {
                return this.style.marginInlineEnd;
            }
            this.style.marginInlineEnd = this.pad_numeric(value);
            return this;
        }
        margin_inline_start(value) {
            if (value == null) {
                return this.style.marginInlineStart;
            }
            this.style.marginInlineStart = this.pad_numeric(value);
            return this;
        }
        mask(value) {
            if (value == null) {
                return this.style.mask;
            }
            this.style.mask = value;
            this.style.msMask = value;
            this.style.webkitMask = value;
            this.style.MozMask = value;
            this.style.OMask = value;
            return this;
        }
        mask_clip(value) {
            if (value == null) {
                return this.style.maskClip;
            }
            this.style.maskClip = value;
            return this;
        }
        mask_composite(value) {
            if (value == null) {
                return this.style.maskComposite;
            }
            this.style.maskComposite = value;
            this.style.msMaskComposite = value;
            this.style.webkitMaskComposite = value;
            this.style.MozMaskComposite = value;
            this.style.OMaskComposite = value;
            return this;
        }
        mask_image(value) {
            if (value == null) {
                return this.style.maskImage;
            }
            this.style.maskImage = value;
            this.style.msMaskImage = value;
            this.style.webkitMaskImage = value;
            this.style.MozMaskImage = value;
            this.style.OMaskImage = value;
            return this;
        }
        mask_mode(value) {
            if (value == null) {
                return this.style.maskMode;
            }
            this.style.maskMode = value;
            return this;
        }
        mask_origin(value) {
            if (value == null) {
                return this.style.maskOrigin;
            }
            this.style.maskOrigin = value;
            return this;
        }
        mask_position(value) {
            if (value == null) {
                return this.style.maskPosition;
            }
            this.style.maskPosition = value;
            return this;
        }
        mask_repeat(value) {
            if (value == null) {
                return this.style.maskRepeat;
            }
            this.style.maskRepeat = value;
            return this;
        }
        mask_size(value) {
            if (value == null) {
                return this.style.maskSize;
            }
            this.style.maskSize = this.pad_numeric(value);
            return this;
        }
        mask_type(value) {
            if (value == null) {
                return this.style.maskType;
            }
            this.style.maskType = value;
            return this;
        }
        max_height(value) {
            if (value == null) {
                return this.style.maxHeight;
            }
            this.style.maxHeight = this.pad_numeric(value);
            return this;
        }
        max_width(value) {
            if (value == null) {
                return this.style.maxWidth;
            }
            this.style.maxWidth = this.pad_numeric(value);
            return this;
        }
        max_block_size(value) {
            if (value == null) {
                return this.style.maxBlockSize;
            }
            this.style.maxBlockSize = this.pad_numeric(value);
            return this;
        }
        max_inline_size(value) {
            if (value == null) {
                return this.style.maxInlineSize;
            }
            this.style.maxInlineSize = this.pad_numeric(value);
            return this;
        }
        min_block_size(value) {
            if (value == null) {
                return this._try_parse_float(this.style.minBlockSize, null);
            }
            this.style.minBlockSize = this.pad_numeric(value);
            return this;
        }
        min_inline_size(value) {
            if (value == null) {
                return this.style.minInlineSize;
            }
            this.style.minInlineSize = this.pad_numeric(value);
            return this;
        }
        mix_blend_mode(value) {
            if (value == null) {
                return this.style.mixBlendMode;
            }
            this.style.mixBlendMode = value;
            return this;
        }
        object_fit(value) {
            if (value == null) {
                return this.style.objectFit;
            }
            this.style.objectFit = value;
            return this;
        }
        object_position(value) {
            if (value == null) {
                return this.style.objectPosition;
            }
            this.style.objectPosition = value;
            return this;
        }
        offset(value) {
            if (value == null) {
                return this.style.offset;
            }
            this.style.offset = value.toString();
            return this;
        }
        offset_anchor(value) {
            if (value == null) {
                return this.style.offsetAnchor;
            }
            this.style.offsetAnchor = value;
            return this;
        }
        offset_distance(value) {
            if (value == null) {
                return this.style.offsetDistance;
            }
            this.style.offsetDistance = value.toString();
            return this;
        }
        offset_path(value) {
            if (value == null) {
                return this.style.offsetPath;
            }
            this.style.offsetPath = value;
            return this;
        }
        offset_rotate(value) {
            if (value == null) {
                return this.style.offsetRotate;
            }
            this.style.offsetRotate = value;
            return this;
        }
        order(value) {
            if (value == null) {
                return this.style.order ?? "";
            }
            value = value.toString();
            this.style.order = value;
            this.style.msOrder = value;
            this.style.webkitOrder = value;
            this.style.MozOrder = value;
            this.style.OOrder = value;
            return this;
        }
        orphans(value) {
            if (value == null) {
                return this._try_parse_float(this.style.orphans, null);
            }
            this.style.orphans = value.toString();
            return this;
        }
        outline(value) {
            if (value == null) {
                return this.style.outline;
            }
            this.style.outline = value;
            return this;
        }
        outline_color(value) {
            if (value == null) {
                return this.style.outlineColor;
            }
            this.style.outlineColor = value;
            return this;
        }
        outline_offset(value) {
            if (value == null) {
                return this.style.outlineOffset;
            }
            this.style.outlineOffset = value.toString();
            return this;
        }
        outline_style(value) {
            if (value == null) {
                return this.style.outlineStyle;
            }
            this.style.outlineStyle = value;
            return this;
        }
        outline_width(value) {
            if (value == null) {
                return this.style.outlineWidth;
            }
            this.style.outlineWidth = this.pad_numeric(value);
            return this;
        }
        overflow(value) {
            if (value == null) {
                return this.style.overflow;
            }
            this.style.overflow = value;
            return this;
        }
        overflow_anchor(value) {
            if (value == null) {
                return this.style.overflowAnchor;
            }
            this.style.overflowAnchor = value;
            return this;
        }
        overflow_wrap(value) {
            if (value == null) {
                return this.style.overflowWrap;
            }
            this.style.overflowWrap = value;
            return this;
        }
        overflow_x(value) {
            if (value == null) {
                return this.style.overflowX;
            }
            this.style.overflowX = value;
            return this;
        }
        overflow_y(value) {
            if (value == null) {
                return this.style.overflowY;
            }
            this.style.overflowY = value;
            return this;
        }
        overscroll_behavior(value) {
            if (value == null) {
                return this.style.overscrollBehavior;
            }
            this.style.overscrollBehavior = value;
            return this;
        }
        overscroll_behavior_block(value) {
            if (value == null) {
                return this.style.overscrollBehaviorBlock;
            }
            this.style.overscrollBehaviorBlock = value;
            return this;
        }
        overscroll_behavior_inline(value) {
            if (value == null) {
                return this.style.overscrollBehaviorInline;
            }
            this.style.overscrollBehaviorInline = value;
            return this;
        }
        overscroll_behavior_x(value) {
            if (value == null) {
                return this.style.overscrollBehaviorX;
            }
            this.style.overscrollBehaviorX = value;
            return this;
        }
        overscroll_behavior_y(value) {
            if (value == null) {
                return this.style.overscrollBehaviorY;
            }
            this.style.overscrollBehaviorY = value;
            return this;
        }
        padding_block(value) {
            if (value == null) {
                return this.style.paddingBlock;
            }
            this.style.paddingBlock = this.pad_numeric(value);
            ;
            return this;
        }
        padding_block_end(value) {
            if (value == null) {
                return this.style.paddingBlockEnd;
            }
            this.style.paddingBlockEnd = this.pad_numeric(value);
            ;
            return this;
        }
        padding_block_start(value) {
            if (value == null) {
                return this.style.paddingBlockStart;
            }
            this.style.paddingBlockStart = this.pad_numeric(value);
            ;
            return this;
        }
        padding_inline(value) {
            if (value == null) {
                return this.style.paddingInline ?? "";
            }
            this.style.paddingInline = this.pad_numeric(value);
            ;
            return this;
        }
        padding_inline_end(value) {
            if (value == null) {
                return this.style.paddingInlineEnd;
            }
            this.style.paddingInlineEnd = this.pad_numeric(value);
            ;
            return this;
        }
        padding_inline_start(value) {
            if (value == null) {
                return this.style.paddingInlineStart;
            }
            this.style.paddingInlineStart = this.pad_numeric(value);
            return this;
        }
        page_break_after(value) {
            if (value == null) {
                return this.style.pageBreakAfter;
            }
            this.style.pageBreakAfter = value;
            return this;
        }
        page_break_before(value) {
            if (value == null) {
                return this.style.pageBreakBefore;
            }
            this.style.pageBreakBefore = value;
            return this;
        }
        page_break_inside(value) {
            if (value == null) {
                return this.style.pageBreakInside;
            }
            this.style.pageBreakInside = value;
            return this;
        }
        paint_order(value) {
            if (value == null) {
                return this.style.paintOrder;
            }
            this.style.paintOrder = value;
            return this;
        }
        perspective(value) {
            if (value == null) {
                return this.style.perspective;
            }
            value = this.pad_numeric(value);
            this.style.perspective = value;
            this.style.msPerspective = value;
            this.style.webkitPerspective = value;
            this.style.MozPerspective = value;
            this.style.OPerspective = value;
            return this;
        }
        perspective_origin(value) {
            if (value == null) {
                return this.style.perspectiveOrigin;
            }
            this.style.perspectiveOrigin = value;
            this.style.msPerspectiveOrigin = value;
            this.style.webkitPerspectiveOrigin = value;
            this.style.MozPerspectiveOrigin = value;
            this.style.OPerspectiveOrigin = value;
            return this;
        }
        place_content(value) {
            if (value == null) {
                return this.style.placeContent;
            }
            this.style.placeContent = value;
            return this;
        }
        place_items(value) {
            if (value == null) {
                return this.style.placeItems;
            }
            this.style.placeItems = value;
            return this;
        }
        place_self(value) {
            if (value == null) {
                return this.style.placeSelf;
            }
            this.style.placeSelf = value;
            return this;
        }
        pointer_events(value) {
            if (value == null) {
                return this.style.pointerEvents;
            }
            this.style.pointerEvents = value;
            return this;
        }
        quotes(value) {
            if (value == null) {
                return this.style.quotes;
            }
            this.style.quotes = value;
            return this;
        }
        resize(value) {
            if (value == null) {
                return this.style.resize;
            }
            this.style.resize = value;
            return this;
        }
        right(value) {
            if (value == null) {
                return this.style.right;
            }
            this.style.right = this.pad_numeric(value);
            return this;
        }
        row_gap(value) {
            if (value == null) {
                return this.style.rowGap;
            }
            this.style.rowGap = this.pad_numeric(value);
            return this;
        }
        scale(value) {
            if (value == null) {
                return this._try_parse_float(this.style.scale, null);
            }
            this.style.scale = value.toString();
            return this;
        }
        scroll_behavior(value) {
            if (value == null) {
                return this.style.scrollBehavior;
            }
            this.style.scrollBehavior = value;
            return this;
        }
        scroll_margin(value) {
            if (value == null) {
                return this.style.scrollMargin;
            }
            this.style.scrollMargin = this.pad_numeric(value);
            return this;
        }
        scroll_margin_block(value) {
            if (value == null) {
                return this.style.scrollMarginBlock;
            }
            this.style.scrollMarginBlock = this.pad_numeric(value);
            return this;
        }
        scroll_margin_block_end(value) {
            if (value == null) {
                return this.style.scrollMarginBlockEnd;
            }
            this.style.scrollMarginBlockEnd = this.pad_numeric(value);
            return this;
        }
        scroll_margin_block_start(value) {
            if (value == null) {
                return this.style.scrollMarginBlockStart;
            }
            this.style.scrollMarginBlockStart = this.pad_numeric(value);
            return this;
        }
        scroll_margin_bottom(value) {
            if (value == null) {
                return this.style.scrollMarginBottom;
            }
            this.style.scrollMarginBottom = this.pad_numeric(value);
            return this;
        }
        scroll_margin_inline(value) {
            if (value == null) {
                return this.style.scrollMarginInline;
            }
            this.style.scrollMarginInline = this.pad_numeric(value);
            return this;
        }
        scroll_margin_inline_end(value) {
            if (value == null) {
                return this.style.scrollMarginInlineEnd;
            }
            this.style.scrollMarginInlineEnd = this.pad_numeric(value);
            return this;
        }
        scroll_margin_inline_start(value) {
            if (value == null) {
                return this.style.scrollMarginInlineStart;
            }
            this.style.scrollMarginInlineStart = this.pad_numeric(value);
            return this;
        }
        scroll_margin_left(value) {
            if (value == null) {
                return this.style.scrollMarginLeft;
            }
            this.style.scrollMarginLeft = this.pad_numeric(value);
            return this;
        }
        scroll_margin_right(value) {
            if (value == null) {
                return this.style.scrollMarginRight;
            }
            this.style.scrollMarginRight = this.pad_numeric(value);
            return this;
        }
        scroll_margin_top(value) {
            if (value == null) {
                return this.style.scrollMarginTop;
            }
            this.style.scrollMarginTop = this.pad_numeric(value);
            return this;
        }
        scroll_padding(value) {
            if (value == null) {
                return this.style.scrollPadding;
            }
            this.style.scrollPadding = this.pad_numeric(value);
            return this;
        }
        scroll_padding_block(value) {
            if (value == null) {
                return this.style.scrollPaddingBlock;
            }
            this.style.scrollPaddingBlock = this.pad_numeric(value);
            return this;
        }
        scroll_padding_block_end(value) {
            if (value == null) {
                return this.style.scrollPaddingBlockEnd;
            }
            this.style.scrollPaddingBlockEnd = this.pad_numeric(value);
            return this;
        }
        scroll_padding_block_start(value) {
            if (value == null) {
                return this.style.scrollPaddingBlockStart;
            }
            this.style.scrollPaddingBlockStart = this.pad_numeric(value);
            return this;
        }
        scroll_padding_bottom(value) {
            if (value == null) {
                return this.style.scrollPaddingBottom;
            }
            this.style.scrollPaddingBottom = this.pad_numeric(value);
            return this;
        }
        scroll_padding_inline(value) {
            if (value == null) {
                return this.style.scrollPaddingInline;
            }
            this.style.scrollPaddingInline = this.pad_numeric(value);
            return this;
        }
        scroll_padding_inline_end(value) {
            if (value == null) {
                return this.style.scrollPaddingInlineEnd;
            }
            this.style.scrollPaddingInlineEnd = this.pad_numeric(value);
            return this;
        }
        scroll_padding_inline_start(value) {
            if (value == null) {
                return this.style.scrollPaddingInlineStart ?? "";
            }
            this.style.scrollPaddingInlineStart = this.pad_numeric(value);
            return this;
        }
        scroll_padding_left(value) {
            if (value == null) {
                return this.style.scrollPaddingLeft;
            }
            this.style.scrollPaddingLeft = this.pad_numeric(value);
            return this;
        }
        scroll_padding_right(value) {
            if (value == null) {
                return this.style.scrollPaddingRight;
            }
            this.style.scrollPaddingRight = this.pad_numeric(value);
            return this;
        }
        scroll_padding_top(value) {
            if (value == null) {
                return this.style.scrollPaddingTop;
            }
            this.style.scrollPaddingTop = this.pad_numeric(value);
            return this;
        }
        scroll_snap_align(value) {
            if (value == null) {
                return this.style.scrollSnapAlign;
            }
            this.style.scrollSnapAlign = value;
            return this;
        }
        scroll_snap_stop(value) {
            if (value == null) {
                return this.style.scrollSnapStop;
            }
            this.style.scrollSnapStop = value;
            return this;
        }
        scroll_snap_type(value) {
            if (value == null) {
                return this.style.scrollSnapType;
            }
            this.style.scrollSnapType = value;
            return this;
        }
        scrollbar_color(value) {
            if (value == null) {
                return this.style.scrollbarColor;
            }
            this.style.scrollbarColor = value;
            return this;
        }
        tab_size(value) {
            if (value == null) {
                return this.style.tabSize;
            }
            value = value.toString();
            this.style.tabSize = value;
            this.style.msTabSize = value;
            this.style.webkitTabSize = value;
            this.style.MozTabSize = value;
            this.style.OTabSize = value;
            return this;
        }
        table_layout(value) {
            if (value == null) {
                return this.style.tableLayout;
            }
            this.style.tableLayout = value;
            return this;
        }
        text_align(value) {
            if (value == null) {
                return this.style.textAlign;
            }
            this.style.textAlign = value;
            return this;
        }
        text_align_last(value) {
            if (value == null) {
                return this.style.textAlignLast;
            }
            this.style.textAlignLast = value;
            return this;
        }
        text_combine_upright(value) {
            if (value == null) {
                return this.style.textCombineUpright;
            }
            this.style.textCombineUpright = value;
            return this;
        }
        text_decoration(value) {
            if (value == null) {
                return this.style.textDecoration;
            }
            this.style.textDecoration = value;
            return this;
        }
        text_decoration_color(value) {
            if (value == null) {
                return this.style.textDecorationColor;
            }
            this.style.textDecorationColor = value;
            return this;
        }
        text_decoration_line(value) {
            if (value == null) {
                return this.style.textDecorationLine;
            }
            this.style.textDecorationLine = value;
            return this;
        }
        text_decoration_style(value) {
            if (value == null) {
                return this.style.textDecorationStyle;
            }
            this.style.textDecorationStyle = value;
            return this;
        }
        text_decoration_thickness(value) {
            if (value == null) {
                return this.style.textDecorationThickness;
            }
            this.style.textDecorationThickness = this.pad_numeric(value);
            return this;
        }
        text_emphasis(value) {
            if (value == null) {
                return this.style.textEmphasis;
            }
            this.style.textEmphasis = value;
            return this;
        }
        text_indent(value) {
            if (value == null) {
                return this.style.textIndent;
            }
            this.style.textIndent = value.toString();
            return this;
        }
        text_justify(value) {
            if (value == null) {
                return this.style.textJustify;
            }
            this.style.textJustify = value;
            return this;
        }
        text_orientation(value) {
            if (value == null) {
                return this.style.textOrientation;
            }
            this.style.textOrientation = value;
            return this;
        }
        text_overflow(value) {
            if (value == null) {
                return this.style.textOverflow;
            }
            this.style.textOverflow = value;
            return this;
        }
        text_shadow(value) {
            if (value == null) {
                return this.style.textShadow;
            }
            this.style.textShadow = value;
            return this;
        }
        text_transform(value) {
            if (value == null) {
                return this.style.textTransform;
            }
            this.style.textTransform = value;
            return this;
        }
        text_underline_position(value) {
            if (value == null) {
                return this.style.textUnderlinePosition;
            }
            this.style.textUnderlinePosition = value;
            return this;
        }
        top(value) {
            if (value == null) {
                return this.style.top;
            }
            this.style.top = this.pad_numeric(value);
            return this;
        }
        transform(value) {
            if (value == null) {
                return this.style.transform;
            }
            this.style.transform = value;
            this.style.msTransform = value;
            this.style.webkitTransform = value;
            this.style.MozTransform = value;
            this.style.OTransform = value;
            return this;
        }
        transform_origin(value) {
            if (value == null) {
                return this.style.transformOrigin;
            }
            this.style.transformOrigin = value;
            this.style.msTransformOrigin = value;
            this.style.webkitTransformOrigin = value;
            this.style.MozTransformOrigin = value;
            this.style.OTransformOrigin = value;
            return this;
        }
        transform_style(value) {
            if (value == null) {
                return this.style.transformStyle;
            }
            this.style.transformStyle = value;
            this.style.msTransformStyle = value;
            this.style.webkitTransformStyle = value;
            this.style.MozTransformStyle = value;
            this.style.OTransformStyle = value;
            return this;
        }
        transition(value) {
            if (value == null) {
                return this.style.transition;
            }
            this.style.transition = value;
            this.style.msTransition = value;
            this.style.webkitTransition = value;
            this.style.MozTransition = value;
            this.style.OTransition = value;
            return this;
        }
        transition_delay(value) {
            if (value == null) {
                return this.style.transitionDelay;
            }
            value = value.toString();
            this.style.transitionDelay = value;
            this.style.msTransitionDelay = value;
            this.style.webkitTransitionDelay = value;
            this.style.MozTransitionDelay = value;
            this.style.OTransitionDelay = value;
            return this;
        }
        transition_duration(value) {
            if (value == null) {
                return this.style.transitionDuration;
            }
            value = value.toString();
            this.style.transitionDuration = value;
            this.style.msTransitionDuration = value;
            this.style.webkitTransitionDuration = value;
            this.style.MozTransitionDuration = value;
            this.style.OTransitionDuration = value;
            return this;
        }
        transition_property(value) {
            if (value == null) {
                return this.style.transitionProperty;
            }
            this.style.transitionProperty = value;
            this.style.msTransitionProperty = value;
            this.style.webkitTransitionProperty = value;
            this.style.MozTransitionProperty = value;
            this.style.OTransitionProperty = value;
            return this;
        }
        transition_timing_function(value) {
            if (value == null) {
                return this.style.transitionTimingFunction;
            }
            this.style.transitionTimingFunction = value;
            this.style.msTransitionTimingFunction = value;
            this.style.webkitTransitionTimingFunction = value;
            this.style.MozTransitionTimingFunction = value;
            this.style.OTransitionTimingFunction = value;
            return this;
        }
        // @ts-ignore
        translate(value) {
            if (value == null) {
                return this.style.translate;
            }
            this.style.translate = value.toString();
            return this;
        }
        unicode_bidi(value) {
            if (value == null) {
                return this.style.unicodeBidi ?? "";
            }
            this.style.unicodeBidi = value;
            return this;
        }
        user_select(value) {
            if (value == null) {
                return this.style.userSelect;
            }
            this.style.userSelect = value;
            this.style.msUserSelect = value;
            this.style.webkitUserSelect = value;
            this.style.MozUserSelect = value;
            this.style.OUserSelect = value;
            return this;
        }
        visibility(value) {
            if (value == null) {
                return this.style.visibility;
            }
            this.style.visibility = value;
            return this;
        }
        white_space(value) {
            if (value == null) {
                return this.style.whiteSpace;
            }
            this.style.whiteSpace = value;
            return this;
        }
        widows(value) {
            if (value == null) {
                return this.style.widows;
            }
            this.style.widows = value.toString();
            return this;
        }
        word_break(value) {
            if (value == null) {
                return this.style.wordBreak;
            }
            this.style.wordBreak = value;
            return this;
        }
        word_spacing(value) {
            if (value == null) {
                return this.style.wordSpacing;
            }
            this.style.wordSpacing = this.pad_numeric(value);
            return this;
        }
        word_wrap(value) {
            if (value == null) {
                return this.style.wordWrap;
            }
            this.style.wordWrap = value;
            return this;
        }
        writing_mode(value) {
            if (value == null) {
                return this.style.writingMode;
            }
            this.style.writingMode = value;
            return this;
        }
        focusable(value) {
            if (value == null) {
                return this.getAttribute("tabindex") !== "-1";
            }
            else {
                this.setAttribute('tabindex', '-1');
                this.style.outline = "none";
            }
            return this;
        }
        alt(value) {
            if (value == null) {
                return this.getAttribute("alt") ?? "";
            }
            this.setAttribute("alt", value);
            return this;
        }
        readonly(value) {
            if (value == null) {
                return this.getAttribute("readonly") === "true";
            }
            if (!value) {
                this.removeAttribute("readonly");
            }
            else {
                this.setAttribute("readonly", value);
            }
            return this;
        }
        download(value) {
            if (value == null) {
                return this.getAttribute("download") ?? "";
            }
            if (!value) {
                this.removeAttribute("download");
            }
            else {
                this.setAttribute("download", value);
            }
            return this;
        }
        accept(value) {
            if (value == null) {
                return this.getAttribute("accept") ?? "";
            }
            if (!value) {
                this.removeAttribute("accept");
            }
            this.setAttribute("accept", value);
            return this;
        }
        accept_charset(value) {
            if (value == null) {
                return this.getAttribute("accept_charset") ?? "";
            }
            if (!value) {
                this.removeAttribute("accept_charset");
            }
            this.setAttribute("accept_charset", value);
            return this;
        }
        action(value) {
            if (value == null) {
                return this.getAttribute("action") ?? "";
            }
            if (!value) {
                this.removeAttribute("action");
            }
            this.setAttribute("action", value);
            return this;
        }
        async(value) {
            if (value == null) {
                return this.getAttribute("async") === "true";
            }
            if (!value) {
                this.removeAttribute("async");
            }
            this.setAttribute("async", value.toString());
            return this;
        }
        auto_complete(value) {
            if (value == null) {
                return this.getAttribute("autocomplete") ?? "";
            }
            if (!value) {
                this.removeAttribute("autocomplete");
            }
            this.setAttribute("autocomplete", value);
            return this;
        }
        auto_focus(value) {
            if (value == null) {
                return this.getAttribute("autofocus") ?? "";
            }
            if (!value) {
                this.removeAttribute("autofocus");
            }
            this.setAttribute("autofocus", value);
            return this;
        }
        auto_play(value) {
            if (value == null) {
                return this.getAttribute("autoplay") === "true";
            }
            if (!value) {
                this.removeAttribute("autoplay");
            }
            this.setAttribute("autoplay", value.toString());
            return this;
        }
        charset(value) {
            if (value == null) {
                return this.getAttribute("charset") ?? "";
            }
            if (!value) {
                this.removeAttribute("charset");
            }
            this.setAttribute("charset", value);
            return this;
        }
        checked(value) {
            if (value == null) {
                return this.getAttribute("checked") === "true";
            }
            if (!value) {
                this.removeAttribute("checked");
            }
            this.setAttribute("checked", value.toString());
            return this;
        }
        cite(value) {
            if (value == null) {
                return this.getAttribute("cite") ?? "";
            }
            if (!value) {
                this.removeAttribute("cite");
            }
            this.setAttribute("cite", value);
            return this;
        }
        cols(value) {
            if (value == null) {
                return this._try_parse_float(this.getAttribute("cols"), null);
            }
            if (!value) {
                this.removeAttribute("cols");
            }
            this.setAttribute("cols", value.toString());
            return this;
        }
        colspan(value) {
            if (value == null) {
                return this._try_parse_float(this.getAttribute("colspan"), null);
            }
            if (!value) {
                this.removeAttribute("colspan");
            }
            this.setAttribute("colspan", value.toString());
            return this;
        }
        content_editable(value) {
            if (value == null) {
                return this.getAttribute("contenteditable") === "true";
            }
            if (!value) {
                this.removeAttribute("contenteditable");
            }
            this.setAttribute("contenteditable", value.toString());
            return this;
        }
        controls(value) {
            if (value == null) {
                return this.getAttribute("controls") === "true";
            }
            if (!value) {
                this.removeAttribute("controls");
            }
            this.setAttribute("controls", value.toString());
            return this;
        }
        coords(value) {
            if (value == null) {
                return this.getAttribute("coords") ?? "";
            }
            if (!value) {
                this.removeAttribute("coords");
            }
            this.setAttribute("coords", value);
            return this;
        }
        data(value) {
            if (value == null) {
                return this.getAttribute("data") ?? "";
            }
            if (!value) {
                this.removeAttribute("data");
            }
            this.setAttribute("data", value.toString());
            return this;
        }
        datetime(value) {
            if (value == null) {
                return this.getAttribute("datetime") ?? "";
            }
            if (!value) {
                this.removeAttribute("datetime");
            }
            this.setAttribute("datetime", value.toString());
            return this;
        }
        default(value) {
            if (value == null) {
                return this.getAttribute("default") ?? "";
            }
            if (!value) {
                this.removeAttribute("default");
            }
            this.setAttribute("default", value.toString());
            return this;
        }
        defer(value) {
            if (value == null) {
                return this.getAttribute("defer") ?? "";
            }
            if (!value) {
                this.removeAttribute("defer");
            }
            this.setAttribute("defer", value);
            return this;
        }
        // @ts-ignore
        dir(value) {
            if (value == null) {
                return this.getAttribute("dir") ?? "";
            }
            if (!value) {
                this.removeAttribute("dir");
            }
            this.setAttribute("dir", value);
            return this;
        }
        dirname(value) {
            if (value == null) {
                return this.getAttribute("dirname") ?? "";
            }
            if (!value) {
                this.removeAttribute("dirname");
            }
            this.setAttribute("dirname", value);
            return this;
        }
        disabled(value) {
            if (value == null) {
                return this.getAttribute("disabled") === "true";
            }
            if (!value) {
                this.removeAttribute("disabled");
            }
            this.setAttribute("disabled", value.toString());
            return this;
        }
        // @ts-ignore
        draggable(value) {
            if (value == null) {
                return this.getAttribute("draggable") === "true";
            }
            if (!value) {
                this.removeAttribute("draggable");
            }
            this.setAttribute("draggable", value.toString());
            return this;
        }
        enctype(value) {
            if (value == null) {
                return this.getAttribute("enctype") ?? "";
            }
            if (!value) {
                this.removeAttribute("enctype");
            }
            this.setAttribute("enctype", value);
            return this;
        }
        for(value) {
            if (value == null) {
                return this.getAttribute("for") ?? "";
            }
            if (!value) {
                this.removeAttribute("for");
            }
            this.setAttribute("for", value);
            return this;
        }
        form(value) {
            if (value == null) {
                return this.getAttribute("form") ?? "";
            }
            if (!value) {
                this.removeAttribute("form");
            }
            this.setAttribute("form", value);
            return this;
        }
        form_action(value) {
            if (value == null) {
                return this.getAttribute("formaction") ?? "";
            }
            if (!value) {
                this.removeAttribute("formaction");
            }
            this.setAttribute("formaction", value);
            return this;
        }
        headers(value) {
            if (value == null) {
                return this.getAttribute("headers") ?? "";
            }
            if (!value) {
                this.removeAttribute("headers");
            }
            this.setAttribute("headers", value);
            return this;
        }
        high(value) {
            if (value == null) {
                return this.getAttribute("high") ?? "";
            }
            if (!value) {
                this.removeAttribute("high");
            }
            this.setAttribute("high", value.toString());
            return this;
        }
        href(value) {
            if (value == null) {
                return this.getAttribute("href") ?? "";
            }
            if (!value) {
                this.removeAttribute("href");
            }
            this.setAttribute("href", value);
            return this;
        }
        href_lang(value) {
            if (value == null) {
                return this.getAttribute("hreflang") ?? "";
            }
            if (!value) {
                this.removeAttribute("hreflang");
            }
            this.setAttribute("hreflang", value);
            return this;
        }
        http_equiv(value) {
            if (value == null) {
                return this.getAttribute("http_equiv") ?? "";
            }
            if (!value) {
                this.removeAttribute("http_equiv");
            }
            this.setAttribute("http_equiv", value.toString());
            return this;
        }
        // @ts-ignore
        id(value) {
            if (value == null) {
                return this.getAttribute("id") ?? "";
            }
            if (!value) {
                this.removeAttribute("id");
            }
            this.setAttribute("id", value);
            return this;
        }
        is_map(value) {
            if (value == null) {
                return this.getAttribute("ismap") === "true";
            }
            if (!value) {
                this.removeAttribute("ismap");
            }
            this.setAttribute("ismap", value.toString());
            return this;
        }
        kind(value) {
            if (value == null) {
                return this.getAttribute("kind") ?? "";
            }
            if (!value) {
                this.removeAttribute("kind");
            }
            this.setAttribute("kind", value);
            return this;
        }
        label(value) {
            if (value == null) {
                return this.getAttribute("label") ?? "";
            }
            if (!value) {
                this.removeAttribute("label");
            }
            this.setAttribute("label", value);
            return this;
        }
        // @ts-ignore
        lang(value) {
            if (value == null) {
                return this.getAttribute("lang") ?? "";
            }
            if (!value) {
                this.removeAttribute("lang");
            }
            this.setAttribute("lang", value);
            return this;
        }
        list(value) {
            if (value == null) {
                return this.getAttribute("list") ?? "";
            }
            if (!value) {
                this.removeAttribute("list");
            }
            this.setAttribute("list", value);
            return this;
        }
        loop(value) {
            if (value == null) {
                return this.getAttribute("loop") === "true";
            }
            if (!value) {
                this.removeAttribute("loop");
            }
            this.setAttribute("loop", value.toString());
            return this;
        }
        low(value) {
            if (value == null) {
                return this.getAttribute("low") ?? "";
            }
            if (!value) {
                this.removeAttribute("low");
            }
            this.setAttribute("low", value.toString());
            return this;
        }
        max(value) {
            if (value == null) {
                return this.getAttribute("max") ?? "";
            }
            if (!value) {
                this.removeAttribute("max");
            }
            this.setAttribute("max", value.toString());
            return this;
        }
        max_length(value) {
            if (value == null) {
                return this._try_parse_float(this.getAttribute("maxlength"), null);
            }
            if (!value) {
                this.removeAttribute("maxlength");
            }
            this.setAttribute("maxlength", value.toString());
            return this;
        }
        method(value) {
            if (value == null) {
                return this.getAttribute("method") ?? "";
            }
            if (!value) {
                this.removeAttribute("method");
            }
            this.setAttribute("method", value);
            return this;
        }
        min(value) {
            if (value == null) {
                return this.getAttribute("min") ?? "";
            }
            if (!value) {
                this.removeAttribute("min");
            }
            this.setAttribute("min", value.toString());
            return this;
        }
        multiple(value) {
            if (value == null) {
                return this.getAttribute("multiple") ?? "";
            }
            if (!value) {
                this.removeAttribute("multiple");
            }
            this.setAttribute("multiple", value);
            return this;
        }
        muted(value) {
            if (value == null) {
                return this.getAttribute("muted") === "true";
            }
            if (!value) {
                this.removeAttribute("muted");
            }
            this.setAttribute("muted", value.toString());
            return this;
        }
        no_validate(value) {
            if (value == null) {
                return this.getAttribute("novalidate") === "true";
            }
            if (!value) {
                this.removeAttribute("novalidate");
            }
            this.setAttribute("novalidate", value.toString());
            return this;
        }
        open(value) {
            if (value == null) {
                return this.getAttribute("open") === "true";
            }
            if (!value) {
                this.removeAttribute("open");
            }
            this.setAttribute("open", value.toString());
            return this;
        }
        optimum(value) {
            if (value == null) {
                return this._try_parse_float(this.getAttribute("optimum"), null);
            }
            if (!value) {
                this.removeAttribute("optimum");
            }
            this.setAttribute("optimum", value.toString());
            return this;
        }
        pattern(value) {
            if (value == null) {
                return this.getAttribute("pattern") ?? "";
            }
            if (!value) {
                this.removeAttribute("pattern");
            }
            this.setAttribute("pattern", value);
            return this;
        }
        placeholder(value) {
            if (value == null) {
                return this.getAttribute("placeholder") ?? "";
            }
            if (!value) {
                this.removeAttribute("placeholder");
            }
            this.setAttribute("placeholder", value);
            return this;
        }
        poster(value) {
            if (value == null) {
                return this.getAttribute("poster") ?? "";
            }
            if (!value) {
                this.removeAttribute("poster");
            }
            this.setAttribute("poster", value);
            return this;
        }
        preload(value) {
            if (value == null) {
                return this.getAttribute("preload") ?? "";
            }
            if (!value) {
                this.removeAttribute("preload");
            }
            this.setAttribute("preload", value);
            return this;
        }
        rel(value) {
            if (value == null) {
                return this.getAttribute("rel") ?? "";
            }
            if (!value) {
                this.removeAttribute("rel");
            }
            this.setAttribute("rel", value);
            return this;
        }
        required(value) {
            if (value == null) {
                return this.getAttribute("required") === "true";
            }
            if (!value) {
                this.removeAttribute("required");
            }
            this.setAttribute("required", value.toString());
            return this;
        }
        reversed(value) {
            if (value == null) {
                return this.getAttribute("reversed") === "true";
            }
            if (!value) {
                this.removeAttribute("reversed");
            }
            this.setAttribute("reversed", value.toString());
            return this;
        }
        rows(value) {
            if (value == null) {
                return this._try_parse_float(this.getAttribute("rows"), null);
            }
            if (!value) {
                this.removeAttribute("rows");
            }
            this.setAttribute("rows", value.toString());
            return this;
        }
        row_span(value) {
            if (value == null) {
                return this._try_parse_float(this.getAttribute("rowspan"), null);
            }
            if (!value) {
                this.removeAttribute("rowspan");
            }
            this.setAttribute("rowspan", value.toString());
            return this;
        }
        sandbox(value) {
            if (value == null) {
                return this.getAttribute("sandbox") ?? "";
            }
            if (!value) {
                this.removeAttribute("sandbox");
            }
            this.setAttribute("sandbox", value);
            return this;
        }
        scope(value) {
            if (value == null) {
                return this.getAttribute("scope") ?? "";
            }
            if (!value) {
                this.removeAttribute("scope");
            }
            this.setAttribute("scope", value);
            return this;
        }
        selected(value) {
            if (value == null) {
                return this.getAttribute("selected") === "true";
            }
            if (!value) {
                this.removeAttribute("selected");
            }
            this.setAttribute("selected", value);
            return this;
        }
        shape(value) {
            if (value == null) {
                return this.getAttribute("shape") ?? "";
            }
            if (!value) {
                this.removeAttribute("shape");
            }
            this.setAttribute("shape", value);
            return this;
        }
        size(value) {
            if (value == null) {
                return this._try_parse_float(this.getAttribute("size"), null);
            }
            if (!value) {
                this.removeAttribute("size");
            }
            this.setAttribute("size", value.toString());
            return this;
        }
        sizes(value) {
            if (value == null) {
                return this.getAttribute("sizes") ?? "";
            }
            if (!value) {
                this.removeAttribute("sizes");
            }
            this.setAttribute("sizes", value.toString());
            return this;
        }
        span(value) {
            if (value == null) {
                return this._try_parse_float(this.getAttribute("span"), null);
            }
            if (!value) {
                this.removeAttribute("span");
            }
            this.setAttribute("span", value.toString());
            return this;
        }
        spell_check(value) {
            if (value == null) {
                return this.getAttribute("spellcheck") === "true";
            }
            if (!value) {
                this.removeAttribute("spellcheck");
            }
            this.setAttribute("spellcheck", value);
            return this;
        }
        src(value) {
            if (value == null) {
                return this.getAttribute("src") ?? "";
            }
            if (!value) {
                this.removeAttribute("src");
            }
            this.setAttribute("src", value);
            return this;
        }
        src_doc(value) {
            if (value == null) {
                return this.getAttribute("srcdoc") ?? "";
            }
            if (!value) {
                this.removeAttribute("srcdoc");
            }
            this.setAttribute("srcdoc", value);
            return this;
        }
        src_lang(value) {
            if (value == null) {
                return this.getAttribute("srclang") ?? "";
            }
            if (!value) {
                this.removeAttribute("srclang");
            }
            this.setAttribute("srclang", value);
            return this;
        }
        rrsrc_set(value) {
            if (value == null) {
                return this.getAttribute("srcset") ?? "";
            }
            if (!value) {
                this.removeAttribute("srcset");
            }
            this.setAttribute("srcset", value);
            return this;
        }
        start(value) {
            if (value == null) {
                return this._try_parse_float(this.getAttribute("start"), null);
            }
            if (!value) {
                this.removeAttribute("start");
            }
            this.setAttribute("start", value.toString());
            return this;
        }
        step(value) {
            if (value == null) {
                return this._try_parse_float(this.getAttribute("step"), null);
            }
            if (!value) {
                this.removeAttribute("step");
            }
            this.setAttribute("step", value.toString());
            return this;
        }
        tab_index(value) {
            if (value == null) {
                return this._try_parse_float(this.getAttribute("tabindex"), null);
            }
            if (!value) {
                this.removeAttribute("tabindex");
            }
            this.setAttribute("tabindex", value.toString());
            return this;
        }
        target(value) {
            if (value == null) {
                return this.getAttribute("target") ?? "";
            }
            if (!value) {
                this.removeAttribute("target");
            }
            this.setAttribute("target", value);
            return this;
        }
        // @ts-ignore
        title(value) {
            if (value == null) {
                return this.getAttribute("title") ?? "";
            }
            if (!value) {
                this.removeAttribute("title");
            }
            this.setAttribute("title", value);
            return this;
        }
        type(value) {
            if (value == null) {
                return this.getAttribute("type") ?? "";
            }
            if (!value) {
                this.removeAttribute("type");
            }
            this.setAttribute("type", value);
            return this;
        }
        use_map(value) {
            if (value == null) {
                return this.getAttribute("usemap") ?? "";
            }
            if (!value) {
                this.removeAttribute("usemap");
            }
            this.setAttribute("usemap", value);
            return this;
        }
        value(value) {
            if (value == null) {
                return this.getAttribute("value") ?? "";
            }
            if (!value) {
                this.removeAttribute("value");
            }
            this.setAttribute("value", value.toString());
            return this;
        }
        on_blur(callback) {
            if (callback == null) {
                return this.onblur;
            }
            const e = this;
            this.onblur = (t) => callback(e, t);
            return this;
        }
        on_change(callback) {
            if (callback == null) {
                return this.onchange;
            }
            const e = this;
            this.onchange = (t) => callback(e, t);
            return this;
        }
        on_focus(callback) {
            if (callback == null) {
                return this.onfocus;
            }
            const e = this;
            this.onfocus = (t) => callback(e, t);
            return this;
        }
        on_input(callback) {
            if (callback == null) {
                return this.oninput;
            }
            const e = this;
            this.oninput = (t) => callback(e, t);
            return this;
        }
        on_before_input(callback) {
            if (callback == null) {
                return this.onbeforeinput;
            }
            const e = this;
            this.onbeforeinput = (t) => callback(e, t);
            return this;
        }
        on_invalid(callback) {
            if (callback == null) {
                return this.oninvalid;
            }
            const e = this;
            this.oninvalid = (t) => callback(e, t);
            return this;
        }
        on_reset(callback) {
            if (callback == null) {
                return this.onreset;
            }
            const e = this;
            this.onreset = (t) => callback(e, t);
            return this;
        }
        on_select(callback) {
            if (callback == null) {
                return this.onselect;
            }
            const e = this;
            this.onselect = (t) => callback(e, t);
            return this;
        }
        on_submit(callback) {
            if (callback == null) {
                return this.onsubmit;
            }
            const e = this;
            this.onsubmit = (t) => callback(e, t);
            return this;
        }
        on_key_down(callback) {
            if (callback == null) {
                return this.onkeydown;
            }
            const e = this;
            this.onkeydown = (t) => callback(e, t);
            return this;
        }
        on_key_press(callback) {
            if (callback == null) {
                return this.onkeypress;
            }
            const e = this;
            this.onkeypress = (t) => callback(e, t);
            return this;
        }
        on_key_up(callback) {
            if (callback == null) {
                return this.onkeyup;
            }
            const e = this;
            this.onkeyup = (t) => callback(e, t);
            return this;
        }
        on_dbl_click(callback) {
            if (callback == null) {
                return this.ondblclick;
            }
            const e = this;
            this.ondblclick = (t) => callback(e, t);
            return this;
        }
        on_mouse_down(callback) {
            if (callback == null) {
                return this.onmousedown;
            }
            const e = this;
            this.onmousedown = (t) => callback(e, t);
            return this;
        }
        on_mouse_move(callback) {
            if (callback == null) {
                return this.onmousemove;
            }
            const e = this;
            this.onmousemove = (t) => callback(e, t);
            return this;
        }
        on_mouse_out(callback) {
            if (callback == null) {
                return this.onmouseout;
            }
            const e = this;
            this.onmouseout = (t) => callback(e, t);
            return this;
        }
        on_mouse_over(callback) {
            if (callback == null) {
                return this.onmouseover;
            }
            const e = this;
            this.onmouseover = (t) => callback(e, t);
            return this;
        }
        on_mouse_up(callback) {
            if (callback == null) {
                return this.onmouseup;
            }
            const e = this;
            this.onmouseup = (t) => callback(e, t);
            return this;
        }
        on_wheel(callback) {
            if (callback == null) {
                return this.onwheel;
            }
            const e = this;
            this.onwheel = (t) => callback(e, t);
            return this;
        }
        on_drag(callback) {
            if (callback == null) {
                return this.ondrag;
            }
            const e = this;
            this.ondrag = (t) => callback(e, t);
            return this;
        }
        on_drag_end(callback) {
            if (callback == null) {
                return this.ondragend;
            }
            const e = this;
            this.ondragend = (t) => callback(e, t);
            return this;
        }
        on_drag_enter(callback) {
            if (callback == null) {
                return this.ondragenter;
            }
            const e = this;
            this.ondragenter = (t) => callback(e, t);
            return this;
        }
        on_drag_leave(callback) {
            if (callback == null) {
                return this.ondragleave;
            }
            const e = this;
            this.ondragleave = (t) => callback(e, t);
            return this;
        }
        on_drag_over(callback) {
            if (callback == null) {
                return this.ondragover;
            }
            const e = this;
            this.ondragover = (t) => callback(e, t);
            return this;
        }
        on_drag_start(callback) {
            if (callback == null) {
                return this.ondragstart;
            }
            const e = this;
            this.ondragstart = (t) => callback(e, t);
            return this;
        }
        on_drop(callback) {
            if (callback == null) {
                return this.ondrop;
            }
            const e = this;
            this.ondrop = (t) => callback(e, t);
            return this;
        }
        on_copy(callback) {
            if (callback == null) {
                return this.oncopy;
            }
            const e = this;
            this.oncopy = (t) => callback(e, t);
            return this;
        }
        on_cut(callback) {
            if (callback == null) {
                return this.oncut;
            }
            const e = this;
            this.oncut = (t) => callback(e, t);
            return this;
        }
        on_paste(callback) {
            if (callback == null) {
                return this.onpaste;
            }
            const e = this;
            this.onpaste = (t) => callback(e, t);
            return this;
        }
        on_abort(callback) {
            if (callback == null) {
                return this.onabort;
            }
            const e = this;
            this.onabort = (t) => callback(e, t);
            return this;
        }
        on_canplay(callback) {
            if (callback == null) {
                return this.oncanplay;
            }
            const e = this;
            this.oncanplay = (t) => callback(e, t);
            return this;
        }
        on_canplay_through(callback) {
            if (callback == null) {
                return this.oncanplaythrough;
            }
            const e = this;
            this.oncanplaythrough = (t) => callback(e, t);
            return this;
        }
        on_cue_change(callback) {
            if (callback == null) {
                return this.oncuechange;
            }
            const e = this;
            this.oncuechange = (t) => callback(e, t);
            return this;
        }
        on_duration_change(callback) {
            if (callback == null) {
                return this.ondurationchange;
            }
            const e = this;
            this.ondurationchange = (t) => callback(e, t);
            return this;
        }
        on_emptied(callback) {
            if (callback == null) {
                return this.onemptied;
            }
            const e = this;
            this.onemptied = (t) => callback(e, t);
            return this;
        }
        on_ended(callback) {
            if (callback == null) {
                return this.onended;
            }
            const e = this;
            this.onended = (t) => callback(e, t);
            return this;
        }
        on_error(callback) {
            if (callback == null) {
                return this.onerror;
            }
            const e = this;
            this.onerror = (t) => callback(e, t);
            return this;
        }
        on_loaded_data(callback) {
            if (callback == null) {
                return this.onloadeddata;
            }
            const e = this;
            this.onloadeddata = (t) => callback(e, t);
            return this;
        }
        on_loaded_metadata(callback) {
            if (callback == null) {
                return this.onloadedmetadata;
            }
            const e = this;
            this.onloadedmetadata = (t) => callback(e, t);
            return this;
        }
        on_load_start(callback) {
            if (callback == null) {
                return this.onloadstart;
            }
            const e = this;
            this.onloadstart = (t) => callback(e, t);
            return this;
        }
        on_pause(callback) {
            if (callback == null) {
                return this.onpause;
            }
            const e = this;
            this.onpause = (t) => callback(e, t);
            return this;
        }
        on_play(callback) {
            if (callback == null) {
                return this.onplay;
            }
            const e = this;
            this.onplay = (t) => callback(e, t);
            return this;
        }
        on_playing(callback) {
            if (callback == null) {
                return this.onplaying;
            }
            const e = this;
            this.onplaying = (t) => callback(e, t);
            return this;
        }
        on_progress(callback) {
            if (callback == null) {
                return this.onprogress;
            }
            const e = this;
            this.onprogress = (t) => callback(e, t);
            return this;
        }
        on_rate_change(callback) {
            if (callback == null) {
                return this.onratechange;
            }
            const e = this;
            this.onratechange = (t) => callback(e, t);
            return this;
        }
        on_seeked(callback) {
            if (callback == null) {
                return this.onseeked;
            }
            const e = this;
            this.onseeked = (t) => callback(e, t);
            return this;
        }
        on_seeking(callback) {
            if (callback == null) {
                return this.onseeking;
            }
            const e = this;
            this.onseeking = (t) => callback(e, t);
            return this;
        }
        on_stalled(callback) {
            if (callback == null) {
                return this.onstalled;
            }
            const e = this;
            this.onstalled = (t) => callback(e, t);
            return this;
        }
        on_suspend(callback) {
            if (callback == null) {
                return this.onsuspend;
            }
            const e = this;
            this.onsuspend = (t) => callback(e, t);
            return this;
        }
        on_time_update(callback) {
            if (callback == null) {
                return this.ontimeupdate;
            }
            const e = this;
            this.ontimeupdate = (t) => callback(e, t);
            return this;
        }
        on_volume_change(callback) {
            if (callback == null) {
                return this.onvolumechange;
            }
            const e = this;
            this.onvolumechange = (t) => callback(e, t);
            return this;
        }
        on_waiting(callback) {
            if (callback == null) {
                return this.onwaiting;
            }
            const e = this;
            this.onwaiting = (t) => callback(e, t);
            return this;
        }
        on_toggle(callback) {
            if (callback == null) {
                return this.ontoggle;
            }
            const e = this;
            this.ontoggle = (t) => callback(e, t);
            return this;
        }
    }
    VBaseElement.element_tag = tag; // must also be static.
    VBaseElement.default_style = default_style ?? {};
    VBaseElement.default_attributes = default_attributes ?? {};
    VBaseElement.default_events = default_events ?? {};
    ;
    // Support extending.
    Elements._velement_classes.push(VBaseElement);
    // Register.
    customElements.define("v-base-" + type.toLowerCase(), VBaseElement, { extends: tag });
    // Return class.
    return VBaseElement;
}
;
// is VElement.
export class VElement extends CreateVElementClass({ type: "VElement", tag: "div" }) {
    constructor() { super(); }
}
;
export function is_velement(obj) {
    return obj && typeof obj === 'object' && obj.__is_velement === true;
}
export function isVElement(obj) {
    return obj && typeof obj === 'object' && obj.__is_velement === true;
}
// VBaseElement class.
export const VDivElement = CreateVElementClass({ type: "VElement", tag: "div" }); // should always remain a "div" since some elements like LoaderButton rely on the behaviour of a div.
export const VDiv = Elements.wrapper(VDivElement);
// Style class.
// Used to create styles without an element, for example for animations.
export const StyleElement = CreateVElementClass({ type: "Style", tag: "style" });
export const Style = Elements.wrapper(StyleElement);
// Fire the onload event.
window.onload = () => {
    Events.emit("vweb.on_load");
};
