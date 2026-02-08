/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved.
 */
// Import vlib.
import * as vlib from "@vandenberghinc/vlib/frontend";
import { Utils } from "../modules/utils.js";
import { Events } from "../modules/events.js";
import { Themes } from "../modules/themes.js";
import { GradientType } from "../types/gradient.js";
import { Statics } from "../modules/statics.js";
import { register_element } from "./register_element.js";
import { Attachment } from "../modules/attachment.js";
// import { ResizeQueryManager } from "./resize_query_manager.js"
// Vars.
const elements_with_width_attribute = new Set([
    'canvas',
    'embed',
    'iframe',
    'img',
    'object',
    'progress',
    'video',
]);
// // Add some html properties since VBaseElement wants properties of them all since is is mixed in.
// interface HTMLElement extends VElementExtensions {
//     setAttribute(name: string, value: string | number | boolean): void;
//     acceptCharset: any;
//     name: any;
//     hreflang: any;
//     // readOnly: any;
//     autoplay: any;
//     maxlength: any;
//     minlength: any;
//     dateTime: any;
//     srcset?: string
//     srclang?: string;
//     srcdoc?: string;
//     novalidate?: boolean;
//     isMap?: boolean;
//     httpEquiv?: string;
//     formAction?: string;
//     rowspan?: number;
//     autocomplete?: "" | "on" | "off";
//     useMap?: string;
//     // value(): string; 
//     // value(value: string): this;
//     // type(): string; 
//     // type(value: string): this;
//     // title(): string; 
//     // title(value: string): this;
//     // target(): string; 
//     // target(value: string): this;
//     // pattern(): string; 
//     // pattern(value: string): this;
//     // step(): string; 
//     // step(value: string): this;
//     // start(): number | null; 
//     // start(value: number): this;
//     // multiple(): boolean; 
//     // multiple(value: boolean): this;
//     // checked(): boolean; 
//     // checked(value: boolean): this;
//     // required(): boolean; 
//     // required(value: boolean): this;
//     // rows(): null | number 
//     // rows(value: number): this;
//     // span(): null | number 
//     // span(value: number): this;
//     // 
//     // alt(): string; 
//     // alt(value: string): this;
//     // accept(): string; 
//     // accept(value: string): this;
//     // action(): string; 
//     // action(value: string): this;
//     // enctype(): string; 
//     // enctype(value: string): this;
//     // id(): string; 
//     // id(value: string): this;
//     // lang(): string; 
//     // lang(value: string): this;
//     // max(): string; 
//     // max(value: string): this;
//     // method(): string; 
//     // method(value: string): this;
//     // min(): string; 
//     // min(value: string): this;
//     // placeholder(): string; 
//     // placeholder(value: string): this;
//     // rel(): string; 
//     // rel(value: string): this;
//     // shape(): string; 
//     // shape(value: string): this;
//     // download(): string; 
//     // download(value: string): this;
//     // charset(): string;
//     // charset(value: string): this;
//     // cite(): string;
//     // cite(value: string): this;
//     // cols(): null | number 
//     // cols(value: number): this;
//     // colspan(): null | number 
//     // colspan; (value: number): this;
//     // controls(): boolean;
//     // controls(value: boolean): this;
//     // coords(): string;
//     // coords(value: string): this;
//     // data(): string;
//     // data(value: string): this;
//     // async(): boolean;
//     // async(value: boolean): this;
//     // default(): boolean;
//     // default(value: boolean): this;
//     // defer(): boolean;
//     // defer(value: boolean): this;
//     // dir(): string;
//     // dir(value: string): this;
//     // dirname(): string;
//     // dirname(value: string): this;
//     // disabled(): boolean;
//     // disabled(value: boolean): this;
//     // draggable(): boolean;
//     // draggable(value: boolean): this;
//     // for(): string;
//     // for(value: string): this;
//     // headers(): string;
//     // headers(value: string): this;
//     // high(): string;
//     // high(value: string | number): this;
//     // href(): string;
//     // href(value: string): this;
//     // kind(): string;
//     // kind(value: string): this;
//     // label(): string;
//     // label(value: string): this;
//     // loop(): boolean;
//     // loop(value: boolean): this;
//     // low(): string;
//     // low(value: string | number): this;
//     // muted(): boolean;
//     // muted(value: boolean): this;
//     // open(): boolean;
//     // open(value: boolean): this;
//     // optimum(): null | number 
//     // optimum(value: number): this;
//     // poster(): string;
//     // poster(value: string): this;
//     // preload(): string;
//     // preload(value: string): this;
//     // reversed(): boolean;
//     // reversed(value: boolean): this;
//     // sandbox(): string;
//     // sandbox(value: string): this;
//     // scope(): string;
//     // scope(value: string): this;
//     // selected(): boolean;
//     // selected(value: boolean): this;
//     // shape(): string;
//     // shape(value: string): this;
//     // span(): null | number;
//     // span(value: number): this;
//     // size(): null | number;
//     // size(value: number): this;
//     // sizes(): string; 
//     // sizes(value: string): this;
//     // span(): string; 
//     // span(value: string): this;
//     // src(): string; 
//     // src(value: string): this;
// }
// ------------------------------------------------------------------------------------------------
// The observers for VElement
/** Create the on render observer for VElement. */
const on_render_observer = new ResizeObserver((entries, observer) => {
    entries.forEach(entry => {
        const target = entry.target;
        if (!target.rendered) {
            target._on_render_callbacks.walk((func) => { func(entry.target); });
            target.rendered = true;
            on_render_observer.unobserve(entry.target);
        }
    });
});
/** Create the on resize observer for VElement. */
const on_resize_observer = new ResizeObserver((entries, observer) => {
    entries.forEach(entry => {
        entry.target._on_resize_callbacks.walk((func) => { func(entry.target); });
    });
});
// Base element.
// @note: this.tagName can not be used since they have different values on safari and other browsers.
/**
 * {Base element}
 * The base element of the volt frontend elements.
 * @nav FrontendVElement/Elements
 * @docs
 */
export class VElement extends HTMLElement {
    // ---------------------------------------------------------
    // Static attributes.
    static element_tag = ""; // must also be static.
    static default_style = {};
    static default_attributes = {};
    static default_events = {};
    // ---------------------------------------------------------
    // Public attributes.
    // @warning do not use default values since they will be put inside the constructor, which should remain empty, define them in _init_velement() instead.
    /** Attachments added by the {@link on_attachment_drop} callback. */
    attachments;
    /** Is rendered flag. */
    rendered;
    /** The element name. */
    element_name;
    /** The base element name @internal */
    base_element_name;
    /** Remove focus method. */
    remove_focus;
    // ---------------------------------------------------------
    // Public but internal attributes.
    // @warning do not use default values since they will be put inside the constructor, which should remain empty, define them in _init_velement() instead.
    __is_velement = true;
    _v_children;
    _element_display;
    _is_connected;
    _on_append_callback;
    _assign_to_parent_as;
    _parent;
    _side_by_side_basis;
    _animate_timeout;
    _is_button_disabled;
    _timeouts;
    _on_window_resize_timer;
    _abs_parent;
    _on_resize_rule_evals;
    _observing_on_resize;
    _observing_on_render;
    _on_resize_callbacks;
    _on_render_callbacks;
    _on_theme_updates;
    _on_mouse_leave_callback;
    _on_mouse_enter_callback;
    _on_shortcut_time;
    _on_shortcut_key;
    _on_shortcut_keycode;
    _on_keypress_set;
    _on_enter_callback;
    _on_escape_callback;
    _on_appear_callbacks;
    // public _context_menu?: ContextMenuElement;
    _media_queries;
    /** Resize query manager queries (allows same predicate for multiple targets). */
    // private _resize_query_queries!: Map<
    //     ResizeQueryManager.Predicate<this>,
    //     Set<ResizeQueryManager.Subscription<this>>
    // >;
    // private _checked: any;// {get(x: any): void, set(x: any, y: any): void};
    // private _disabled: any;// {get(x: any): void, set(x: any, y: any): void};
    // private _selected: any;// {get(x: any): void, set(x: any, y: any): void};
    // private _href: any;// {get(x: any): void, set(x: any, y: any): void};
    // private _src: any;// {get(x: any): void, set(x: any, y: any): void};
    // private _id: any;// {get(x: any): void, set(x: any, y: any): void};
    // private _value: any;// {get(x: any): void, set(x: any, y: any): void};
    // ---------------------------------------------------------
    // Constructor.
    constructor() {
        // @warning do not use the constructor to define any member props, use _init_velement() instead.
        super();
    }
    /**
     * @warning This method should only be used by the direct types declared in this file e.g. VSpanElement.
     * @note This method is always called in the constructor of the base elements defined in VElementTagMap.
     */
    _init_sys_velement(args) {
        // Errs.
        if (!args.derived || !args.derived.element_name) {
            throw new Error("Static element attribute 'args.derived.element_name' should always be defined, create static attribute \"element_name: string\" and assign the name of the class to this attribute.");
        }
        // Attributes.
        this._is_connected = false;
        // Defaults.
        this.attachments = [];
        this.rendered = false;
        this.element_name = args.derived.element_name;
        this.base_element_name = args.derived.element_name;
        this.remove_focus = super.blur;
        // Defaults.
        this._v_children = [];
        this.__is_velement = true;
        this._element_display = "block";
        this._is_connected = false;
        this._on_append_callback = undefined;
        this._assign_to_parent_as = undefined;
        this._parent = undefined;
        this._side_by_side_basis = undefined;
        this._animate_timeout = undefined;
        this._is_button_disabled = false;
        this._timeouts = {};
        this._on_window_resize_timer = undefined;
        this._abs_parent = undefined;
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
        this._on_enter_callback = undefined;
        this._on_escape_callback = undefined;
        this._on_appear_callbacks = [];
        this._media_queries = {};
        // this._resize_query_queries = new Map();
        // Constructed by html code.
        if (this.hasAttribute !== undefined && this.hasAttribute("created_by_html")) {
        }
        // Constructed by js code.
        else {
            // Default style.
            if (args.default_style != null) {
                this.styles({
                    ...(args.derived.default_style ?? {}),
                    ...args.default_style,
                });
            }
            else if (args.derived?.default_style != null) {
                this.styles(args.derived?.default_style);
            }
            // Default attributes.
            if (args.default_attributes != null) {
                this.attrs({
                    ...(args.derived.default_attributes ?? {}),
                    ...args.default_attributes,
                });
            }
            else if (args.derived?.default_attributes != null) {
                this.attrs(args.derived?.default_attributes);
            }
            // Default events.
            if (args.default_events != null) {
                this.events({
                    ...(args.derived.default_events ?? {}),
                    ...args.default_events,
                });
            }
            else if (args.derived?.default_events != null) {
                this.events(args.derived?.default_events);
            }
        }
    }
    /**
     * @warning Any VElement (a derived class of VElementTagMap) must call this method in its constructor.
     */
    _init(args) {
        // Set name.
        if (!args.derived || !args.derived.element_name) {
            throw new Error("Static element attribute 'args.derived.element_name' should always be defined, create static attribute \"element_name: string\" and assign the name of the class to this attribute.");
        }
        // Set type/name, keep base type the same.
        this.element_name = args.derived.element_name;
        // Constructed by html code.
        if (this.hasAttribute !== undefined && this.hasAttribute("created_by_html")) {
        }
        // Constructed by js code.
        else {
            // Default style.
            if (args.default_style != null) {
                this.styles({
                    ...(args.derived.default_style ?? {}),
                    ...args.default_style,
                });
            }
            else if (args.derived?.default_style != null) {
                this.styles(args.derived?.default_style);
            }
            // Default attributes.
            if (args.default_attributes != null) {
                this.attrs({
                    ...(args.derived.default_attributes ?? {}),
                    ...args.default_attributes,
                });
            }
            else if (args.derived?.default_attributes != null) {
                this.attrs(args.derived?.default_attributes);
            }
            // Default events.
            if (args.default_events != null) {
                this.events({
                    ...(args.derived.default_events ?? {}),
                    ...args.default_events,
                });
            }
            else if (args.derived?.default_events != null) {
                this.events(args.derived?.default_events);
            }
        }
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
    // Is util.
    static is(type) {
        return type.__is_velement ?? false;
    }
    /**
     * {Clone}
     * Creates a deep copy of the current element, including its styles and attributes.
     * Optionally clones child nodes based on the provided parameter.
     * @parameter clone_children Indicates whether to clone child nodes of the current element.
     * @returns Returns a new instance of the element that is a clone of the current one.
     * @docs
     */
    clone(clone_children = true) {
        // @ts-ignore
        const clone = new this.constructor();
        if (clone.element_name != null) {
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
                if (isVElement(child) && child.element_name != null) {
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
     * {Pad Numeric}
     * Pads a numeric value with a specified padding unit, defaulting to "px".
     * @parameter value The numeric value to be padded.
     * @parameter padding The unit to pad the numeric value with.
     * @returns Returns the padded value as a string.
     * @docs
     */
    pad_numeric(value, padding = "px") {
        if (value == null) {
            return "";
        }
        if (typeof value !== "string") {
            return value + padding;
        }
        return value;
    }
    /**
     * {Pad Percentage}
     * Pads a numeric value with a percentage symbol. If the value is a float between 0 and 1, it is multiplied by 100 before padding.
     * @parameter value The numeric value to pad.
     * @parameter padding The string to pad the numeric value with, defaults to "%".
     * @returns Returns the padded percentage as a string, or the original value if it is not numeric.
     * @docs
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
     * {Edit Filter Wrapper}
     * Edits a filter string by replacing or removing specified types.
     * Can also append a new type if it doesn’t exist in the filter.
     * @parameter filter The original filter string that needs to be edited.
     * @parameter type The type that will be targeted for replacement or removal.
     * @parameter to The new value to replace the existing type with, or null to remove it.
     * @returns Returns the modified filter string or null if the input filter was null.
     * @docs
     */
    edit_filter_wrapper(filter, type, to = undefined) {
        const to_str = (typeof to === "number") ? to.toString() : (to ?? "");
        if (filter == null) {
            return to_str;
        }
        const pattern = new RegExp(`${type}\\([^)]*\\)\\s*`, "g");
        if (pattern.test(filter)) {
            if (to == null) {
                return pattern[1];
            }
            else {
                return filter.replace(pattern, to_str);
            }
        }
        else if (to != null) {
            return `${filter} ${to_str}`;
        }
        return filter;
    }
    /**
     * {Toggle Filter Wrapper}
     * Toggles a specified filter type in a string. If the type is present, it will be removed; otherwise, it will be added.
     * @parameter filter The filter string to modify.
     * @parameter type The type of filter to toggle.
     * @parameter to The value to add if the type is not present.
     * @returns Returns the modified filter string or null if the input filter was null.
     * @docs
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
    // Try and parse a boolean.
    _try_parse_boolean(value) {
        return typeof value === "boolean" ? value : (value === "true" || value === "True" || value === "TRUE" || value === "1");
    }
    // ---------------------------------------------------------
    // Children functions.
    /**
     * {Append Child Elements}
     * Appends child elements to the current element. Can accept multiple child elements, including HTML nodes, functions, or strings.
     * @parameter children The child elements to append, which can be an array of elements, a single element, or a function.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
                else if (isVElement(child) && child.element_name != null) {
                    if (child.element_name == "ForEachElement") {
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
                    //  this[child._assign_to_parent_as] = child;
                    //  child._parent = this;
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
     * {ZStack Append}
     * Appends multiple children to the ZStack element. This method can handle various types of children such as elements, functions, and text.
     * @parameter children The children to append, which can be elements, arrays, text, or functions returning elements.
     * @returns Returns the instance of the ZStack element for chaining.
     * @docs
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
                else if (isVElement(child) && child.element_name != null) {
                    child.style.gridArea = "1 / 1 / 2 / 2";
                    if (child.element_name == "ForEachElement") {
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
                else if ((child instanceof Node) || child instanceof HTMLElement) {
                    if (child instanceof HTMLElement) {
                        child.style.gridArea = "1 / 1 / 2 / 2";
                    }
                    // if (child._assign_to_parent_as !== undefined) {
                    //  this[child._assign_to_parent_as] = child;
                    //  child._parent = this;
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
     * {Append To Parent}
     * Appends the current element to a specified parent element and manages parent-child relationships.
     * @parameter parent The parent element to which the current element will be appended.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Append Children to Parent}
     * Appends the children of the current element to the specified parent element and executes a callback for each appended child.
     * @parameter parent The parent element to which the children will be appended.
     * @parameter on_append_callback A callback function that is executed for each child when it is appended.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    append_children_to(parent, on_append_callback) {
        if (isVElement(parent) && this.base_element_name === "VirtualScrollerElement") {
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
     * {Remove Child}
     * Removes a child element from the current element. The child can be specified
     * by passing a Node, an VElement, or an id string of the element to be removed.
     * @parameter child The child to be removed from the current element.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    remove_child(child) {
        if (isVElement(child) && child.element_name != null) {
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
     * {Remove Children}
     * Removes all child elements from the current element without using innerHTML.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    remove_children() {
        this.inner_html("");
        return this;
    }
    /**
     * {Child}
     * Retrieves a child element by its index. Supports negative indexing to access elements from the end of the list.
     * @parameter index The index of the child to retrieve. Can be a positive or negative integer.
     * @returns Returns the child element at the specified index.
     * @docs
     */
    child(index) {
        if (index < 0) {
            return this.children[this.children.length - index];
        }
        return this.children[index];
    }
    /**
     * {Get Child}
     * Retrieves a child element by its index. Supports negative indexing to access elements from the end.
     * @parameter index The index of the child element to retrieve. Can be negative to access from the end.
     * @returns Returns the child element at the specified index, or undefined if the index is out of bounds.
     * @docs
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
    // @ts-ignore
    width(value, check_attribute = true) {
        if (check_attribute && elements_with_width_attribute.has(this.constructor.toString().element_tag)) {
            if (value == null) {
                return this._try_parse_float(super.getAttribute("width"));
                // return this._try_parse_float(super.width);
            }
            super.setAttribute("width", value.toString());
            // super.width = value.toString();
        }
        else {
            if (value == null) {
                return this._try_parse_float(this.style.width);
            }
            this.style.width = this.pad_numeric(value);
        }
        return this;
    }
    /** Simple wrapper for .width("fit-content") */
    fit_content() { return this.width("fit-content"); }
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
    // @ts-ignore
    height(value, check_attribute) {
        if (check_attribute && elements_with_width_attribute.has(this.constructor.toString().element_tag)) {
            if (value == null) {
                return this._try_parse_float(super.getAttribute("height"));
                // return this._try_parse_float(super.height);
            }
            super.setAttribute("height", value.toString());
            // super.height = value.toString();
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
     * {Width By Columns}
     * Sets the width of HStack children based on the number of columns specified.
     * If columns are not provided, it defaults to 1. The calculation takes into account
     * the left and right margins of the element.
     * @parameter columns The number of columns to set the width by.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Offset Width}
     * Retrieves the offset width of the element.
     * @returns Returns the offset width of the element.
     * @docs
     */
    offset_width() {
        return this.offsetWidth;
    }
    /**
     * {Offset Height}
     * Retrieves the height of the element's offset.
     * @returns Returns the height of the element including padding and border.
     * @docs
     */
    offset_height() {
        return this.offsetHeight;
    }
    /**
     * {Client Width}
     * Retrieves the client width of the element.
     * @returns Returns the client width of the element.
     * @docs
     */
    client_width() {
        return this.clientWidth;
    }
    /**
     * {Client Height}
     * Retrieves the height of the client area of the element.
     * @returns Returns the height of the client area in pixels.
     * @docs
     */
    client_height() {
        return this.clientHeight;
    }
    /**
     * {X Offset}
     * Retrieves the x offset of the element from its parent.
     * @returns Returns the x offset value of the element.
     * @docs
     */
    // @ts-ignore
    x() {
        return this.offsetLeft;
    }
    /**
     * {Y Offset}
     * Retrieves the vertical offset of the element from the top of the document.
     * @returns Returns the vertical offset value.
     * @docs
     */
    // @ts-ignore
    y() {
        return this.offsetTop;
    }
    /**
     * {Frame}
     * Sets the width and height of the frame. If width or height is not provided, it does not change that dimension.
     * @parameter width The width to set for the frame.
     * @parameter height The height to set for the frame.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Min Frame}
     * Sets the minimum width and height for the frame. If parameters are provided, it updates the respective properties.
     * @parameter width The minimum width to set for the frame.
     * @parameter height The minimum height to set for the frame.
     * @returns Returns the instance of the frame for chaining.
     * @docs
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
     * {Max Frame}
     * Sets the maximum width and height for the frame. If a value is provided, it updates the respective maximum dimension.
     * @parameter width The maximum width to set for the frame.
     * @parameter height The maximum height to set for the frame.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Fixed Frame}
     * Sets the width and height of the element, applying padding to the values if provided.
     * @parameter width The width to set for the element. Can be a number or null.
     * @parameter height The height to set for the element. Can be a number or null.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Get Frame While Hidden}
     * Retrieves the dimensions of the element as it would appear if it were not hidden.
     * @returns Returns an object containing the width and height of the element.
     * @docs
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
    // Sync height from another node.
    sync_height_from(node, process) {
        if (node._sync_height_info === undefined) {
            node._sync_height_info = {
                sync_to: [this],
                on_resize(e) {
                    for (const to_node of node._sync_height_info.sync_to) {
                        to_node.height(process === undefined ? node.clientHeight : process(node.clientHeight));
                    }
                },
            };
            node.on_resize(node._sync_height_info.on_resize);
        }
        else {
            node._sync_height_info.sync_to.push(this);
        }
        return this;
    }
    sync_height_to(node, process) {
        if (Array.isArray(node)) {
            for (const n of node) {
                this.sync_height_to(n, process);
            }
            return this;
        }
        if (this._sync_height_info === undefined) {
            this._sync_height_info = {
                sync_to: [node],
                on_resize: (e) => {
                    for (const to_node of this._sync_height_info.sync_to) {
                        to_node.height(process === undefined ? this.clientHeight : process(this.clientHeight));
                    }
                },
            };
            this.on_resize(this._sync_height_info.on_resize);
        }
        else {
            this._sync_height_info.sync_to.push(this);
        }
        return this;
    }
    /**
     * Set a square frame width and height.
     */
    square(size = "100%") {
        this.flex(0).fixed_frame(size, size);
        return this;
    }
    /** Set circle border radius */
    circle() {
        this.border_radius("50%");
        return this;
    }
    // padding(...values: [] | [undefstrnr] | [undefstrnr, undefstrnr] | [undefstrnr, undefstrnr, undefstrnr, undefstrnr]): string | this {
    // padding(...values: any[]): string | this {
    padding(...values) {
        if (values.length === 0) {
            return this.style.padding ?? "";
        }
        else if (values.length === 1) {
            this.style.padding = this.pad_numeric(values[0] ?? "");
        }
        else if (values.length === 2) {
            if (values[0] != null) {
                this.style.paddingTop = this.pad_numeric(values[0] ?? "");
            }
            if (values[1] != null) {
                this.style.paddingRight = this.pad_numeric(values[1] ?? "");
            }
            if (values[0] != null) {
                this.style.paddingBottom = this.pad_numeric(values[0] ?? "");
            }
            if (values[1] != null) {
                this.style.paddingLeft = this.pad_numeric(values[1] ?? "");
            }
        }
        else if (values.length === 4) {
            this.style.paddingTop = this.pad_numeric(values[0] ?? "");
            if (values[1] != null) {
                this.style.paddingRight = this.pad_numeric(values[1] ?? "");
            }
            if (values[2] != null) {
                this.style.paddingBottom = this.pad_numeric(values[2] ?? "");
            }
            if (values[3] != null) {
                this.style.paddingLeft = this.pad_numeric(values[3] ?? "");
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
     * {Stretch}
     * Sets the flex property of the element to control its stretching behavior.
     * @parameter value A boolean indicating whether the element should stretch or not.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Wrap}
     * Sets the wrapping behavior of an element based on the provided value.
     * @parameter value A boolean or string indicating the wrap behavior.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    wrap(value) {
        switch (this.constructor.element_tag) {
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
     * {Z Index}
     * Sets the z-index style property of the element.
     * @parameter value The z-index value to set for the element.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    z_index(value) {
        this.style.zIndex = value.toString();
        return this;
    }
    /**
     * {Side by Side}
     * Set the elements side by side till a specified width.
     * @experimental
     * @param options Configuration options for the side by side layout.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    side_by_side(options) {
        const { columns = 2, hspacing = 10, vspacing = 10, stretch = true, hide_dividers = false, } = options;
        if (this.element_name !== "HStackElement" && this.element_name !== "AnchorHStackElement") {
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
            else if (child.nextElementSibling.element_name !== "DividerElement") {
                return false;
            }
            else {
                return is_last_non_divider(child.nextElementSibling);
            }
        };
        // Iterate children.
        this.iterate((child) => {
            // Divider element.
            if (child.element_name === "DividerElement") {
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
    // @ts-ignore
    align(value) {
        switch (this.base_element_name) {
            case "HStackElement":
            case "AnchorHStackElement":
            case "ZStackElement":
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
            case "FrameElement":
                this.style.display = "flex";
                this.style.flexDirection = "column";
            // fallthrough.
            case "VStackElement":
            case "AnchorVStackElement":
            case "ScrollerElement":
            case "ViewElement":
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
     * {Leading}
     * Sets the alignment to the start position.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    leading() {
        return this.align("start");
    }
    /**
     * {Center Alignment}
     * Sets the alignment of the element to center.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    center() {
        return this.align("center");
    }
    /**
     * {Trailing}
     * Aligns the element to the end.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    trailing() {
        return this.align("end");
    }
    align_vertical(value) {
        switch (this.base_element_name) {
            case "HStackElement":
            case "AnchorHStackElement":
            case "ZStackElement":
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
            case "FrameElement":
                this.style.display = "flex";
                this.style.flexDirection = "column";
            // fallthrough.
            case "VStackElement":
            case "AnchorVStackElement":
            case "ScrollerElement":
            case "ViewElement":
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
            case "TextElement":
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
     * {Leading Vertical}
     * Sets the vertical alignment to the start position.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    leading_vertical() {
        return this.align_vertical("start");
    }
    /**
     * {Center Vertical}
     * Centers the element vertically, optionally only when there is no overflow.
     * @parameter only_on_no_overflow Determines whether to center only when there is no overflow.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Trailing Vertical}
     * Sets the vertical alignment to the trailing position.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    trailing_vertical() {
        return this.align_vertical("end");
    }
    /**
     * {Align Text}
     * Sets the text alignment using predefined shortcuts.
     * @parameter value The value representing the text alignment to set.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    align_text(value) {
        return this.text_align(value);
    }
    /**
     * {Text Leading}
     * Sets the text alignment to the start position for leading text.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    text_leading() {
        return this.text_align("start");
    }
    /**
     * {Text Center}
     * Sets the text alignment of the element to center.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    text_center() {
        return this.text_align("center");
    }
    /**
     * {Text Trailing}
     * Sets the text alignment to 'end' for trailing text.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    text_trailing() {
        return this.text_align("end");
    }
    /**
     * {Align Height}
     * Aligns items by height inside a horizontal stack.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
            this.style.backgroundImage = value.gradient ?? "";
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
    // @ts-ignore
    /**
     * Assigns the border color of this node, also supports a `GradientType` element.
     * @param value The value to assign. Leave `undefined` to retrieve the attribute's value.
     * @returns Returns the instance for chaining unless parameter `value` is `undefined`, then the attribute's value is returned.
     * @docs
     */
    border(...values) {
        if (values.length === 0) {
            return this.style.border ?? "";
        }
        else if (values.length === 1) {
            // Set by border options.
            if (typeof values[0] === "object" && values[0] !== null) {
                const opts = values[0];
                const { width = "1px", style = "solid", color = "black", radius = undefined, top = true, bottom = true, left = true, right = true, } = opts;
                // use explicit `true` since it may also be a string with specific color.
                if (top === true && left === true && bottom === true && right === true) {
                    this.style.border = this.pad_numeric(width) + " " + style + " " + color;
                }
                else {
                    if (top) {
                        this.style.borderTop = this.pad_numeric(width) + " " + style + " " + (typeof top === "boolean" ? color : top);
                    }
                    else {
                        this.style.borderTop = "0px";
                    }
                    if (bottom) {
                        this.style.borderBottom = this.pad_numeric(width) + " " + style + " " + (typeof bottom === "boolean" ? color : bottom);
                    }
                    else {
                        this.style.borderBottom = "0px";
                    }
                    if (left) {
                        this.style.borderLeft = this.pad_numeric(width) + " " + style + " " + (typeof left === "boolean" ? color : left);
                    }
                    else {
                        this.style.borderLeft = "0px";
                    }
                    if (right) {
                        this.style.borderRight = this.pad_numeric(width) + " " + style + " " + (typeof right === "boolean" ? color : right);
                    }
                    else {
                        this.style.borderRight = "0px";
                    }
                }
                if (radius != null) {
                    this.style.borderRadius = this.pad_numeric(radius);
                }
            }
            // Set by string.
            else {
                this.style.border = values[0];
            }
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
        switch (this.base_element_name) {
            case "StyleElement":
                if (value == null) {
                    return this._try_parse_float(this.filter(this.edit_filter_wrapper(this.style.filter, "opacity", value)), 1);
                }
                else {
                    if (typeof value === "number" && value <= 1.0) {
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
     * {Toggle Opacity}
     * Toggles the opacity of the element between a specified value and fully opaque.
     * @parameter value The value to set the opacity to when toggling.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Toggle Blur}
     * Toggles the blur effect on the element with a specified value.
     * @parameter value The amount of blur to apply, defaulting to 10.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Toggle Background Blur}
     * Toggles the background blur effect by applying a backdrop filter.
     * @parameter value The intensity of the blur effect to apply.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Toggle Brightness}
     * Toggles the brightness of the element by applying a filter based on the provided value.
     * @parameter value The brightness value to set, defaults to 0.5 if not provided.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Toggle Background Brightness}
     * Toggles the background brightness by applying a filter based on the provided value.
     * @parameter value The brightness value to set, defaulting to 10 if not provided.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Delay}
     * Set the delay for keyframes in the style element.
     * @parameter value The value of the delay to set.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    delay(value) {
        this.style.delay = value;
        return this;
    }
    /**
     * {Duration}
     * Sets the duration style property for the element.
     * @parameter value The value to set for the duration property.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Scale Font Size}
     * Adjusts the font size based on a scaling factor relative to the current font size.
     * @parameter scale The scaling factor to apply to the current font size.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    scale_font_size(scale = 1.0) {
        const size = parseFloat(this.style.fontSize);
        if (!isNaN(size)) {
            this.font_size(size * scale);
        }
        return this;
    }
    font_size_ratio(scale = 1.0) {
        return this.scale_font_size(scale);
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
     * {Hide}
     * Hides the element by setting its display style to none.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    hide() {
        this.style.display = "none";
        return this;
    }
    /**
     * {Show}
     * Displays the element by setting its display style property.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    show() {
        this.style.display = this._element_display;
        return this;
    }
    /**
     * {Is Hidden}
     * Checks if the element is currently hidden based on its display style.
     * @returns Returns true if the element is hidden; otherwise, false.
     * @docs
     */
    is_hidden() {
        return this.style.display === "none" || typeof this.style.display === "undefined";
    }
    /**
     * {Is Visible}
     * Checks if the element is visible based on its display style.
     * @returns Returns true if the element is visible, false otherwise.
     * @docs
     */
    is_visible() {
        return !(this.style.display === "none" || typeof this.style.display === "undefined");
    }
    /**
     * {Toggle Visibility}
     * Toggles the visibility of the element by showing or hiding it based on its current state.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
                    else if (this.element_name === "StyleElement") {
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
     * {Attributes}
     * Sets multiple attributes for the element based on the provided dictionary.
     * @parameter html_attr A dictionary of attributes to set on the element.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Events}
     * Sets multiple event handlers on the current element using a dictionary of events.
     * @parameter html_events An object containing event names as keys and their corresponding handler functions as values.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Toggle class}
     * Toggles a class name from the class list, adding it if it's not present, or removing it if it is.
     * @parameter name The class name to toggle.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    toggle_class(name) {
        this.classList.toggle(name);
        return this;
    }
    /**
     * {Remove Class}
     * Remove a class name from the class list of the element.
     * @parameter name The class name to be removed from the class list.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    remove_class(name) {
        this.classList.remove(name);
        return this;
    }
    /**
     * {Remove all classes}
     * Remove all classes from the class list.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
    // track last pointer position globally
    static _lastPointerPos = { x: 0, y: 0 };
    static {
        window.addEventListener("pointermove", e => {
            VElement._lastPointerPos.x = e.clientX;
            VElement._lastPointerPos.y = e.clientY;
        }, { passive: true });
    }
    /**
     * Returns true if the mouse’s last known position lies within
     * this element’s bounding rectangle (including borders).
     */
    is_mouse_over_frame() {
        const { x, y } = VElement._lastPointerPos;
        const rect = this.getBoundingClientRect();
        return (x >= rect.left &&
            x <= rect.right &&
            y >= rect.top &&
            y <= rect.bottom);
    }
    /**
     * Apply on hover transitions.
     * @note This function also automatically sets the `transition` property for the target element. However, only when the transition attribute hasnt been set yet.
     * @param target The target node of which to apply
     * @param methods The methods to call and pass the `selected` value as arg to.
     * @param selected The selected hover argument value of the selected `methods`.
     * @param unselected The default non hover argument value of the selected `methods`.
     * @param methods The methods to call and pass the `selected` value as arg to.
     */
    hover_transitions(items) {
        // Set transitions.
        for (let item of items) {
            const target = item.target === "this" || item.target === "self" ? this : item.target;
            item.target = target; // for onmouseover/out
            let transition_mask = false;
            const transition = item.methods
                .map(prop => {
                let css_prop = prop.replace(/_/g, "-");
                // if you really want to animate the mask-color on an ImageMask,
                // animate its `background-color` instead of `color`
                if (target?.element_name?.includes("ImageMask") && css_prop === "color") {
                    css_prop = "background-color";
                    transition_mask = true;
                }
                const dur = item.duration ?? 300;
                const ease = item.easing ?? "ease-in-out";
                return `${css_prop} ${dur}ms ${ease}`;
            })
                .join(", ");
            const a_target = target;
            if (transition_mask && a_target.transition_mask) {
                // console.log("[volt] transition:", transition, a_target.transition_mask);
                a_target.transition_mask(transition);
            }
            else if (a_target.transition) {
                // console.log("[volt] transition:", transition, a_target.transition);
                a_target.transition(transition);
            }
        }
        // Set hover.
        this.on_mouse_over(() => {
            if (!this._is_button_disabled) {
                for (let item of items) {
                    for (const method of item.methods) {
                        item.target[method](item.selected);
                    }
                    ;
                }
            }
        });
        this.on_mouse_out(() => {
            if (!this._is_button_disabled) {
                for (let item of items) {
                    for (const method of item.methods) {
                        item.target[method](item.unselected);
                    }
                    ;
                }
            }
        });
        return this;
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
    // ---------------------------------------------------------
    // Media query functions.
    /**
     * {Media Query}
     * Creates a media query listener that triggers provided handlers based on the media query's state.
     * @parameter media_query The media query string to evaluate.
     * @parameter true_handler The function to execute when the media query matches.
     * @parameter false_handler The function to execute when the media query does not match.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Remove Media Query}
     * Removes a specified media query from the element's media queries.
     * @parameter media_query The media query string to be removed.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    remove_media(media_query) {
        if (typeof this._media_queries === "object" && this._media_queries[media_query] !== undefined) {
            this._media_queries[media_query].list.removeListener(this._media_queries[media_query].callback);
        }
        return this;
    }
    /**
     * {Remove Media Queries}
     * Removes all media queries from the element.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Remove All Media}
     * Removes all media queries and their associated listeners from the element.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
    // Container query functions using a global ResizeObserver.
    // /**
    //  * Subscribe a on resize query predicate.
    //  * The predicate is called if the target element or container resizes.
    //  *
    //  * @param predicate predicate callback (no strings required).
    //  * @param true_handler fired when predicate becomes true.
    //  * @param false_handler fired when predicate becomes false.
    //  * @param container_target optional container element or VElement; defaults to this element's HTMLElement.
    //  */
    // resize_query(
    //     predicate: ResizeQueryManager.Predicate<AnyElement>,
    //     true_handler?: ResizeQueryManager.Callback<AnyElement>,
    //     false_handler?: ResizeQueryManager.Callback<AnyElement>,
    //     container_target?: AnyElement,
    // ): this {
    //     const target = container_target || this;
    //     const record: ResizeQueryManager.Record<this> = {
    //         owner: this,
    //         predicate,
    //         on_true: true_handler,
    //         on_false: false_handler,
    //         last_match: undefined,
    //     };
    //     // Register with the global manager.
    //     ResizeQueryManager.observe_target(target, record);
    //     // Create a subscription handle so we can remove later.
    //     const subscription: ResizeQueryManager.Subscription<this> = {
    //         target,
    //         record,
    //         remove: () => ResizeQueryManager.unobserve_target(target, record),
    //     };
    //     // Store by predicate to support remove_container(predicate).
    //     let set = this._resize_query_queries.get(predicate);
    //     if (set === undefined) {
    //         set = new Set();
    //         this._resize_query_queries.set(predicate, set);
    //     }
    //     // Prevent duplicates for the same predicate+target pair.
    //     for (const existing of set) {
    //         if (existing.target === target) {
    //             existing.remove();
    //             set.delete(existing);
    //             break;
    //         }
    //     }
    //     set.add(subscription);
    //     return this;
    // }
    // /**
    //  * Remove all subscriptions for a predicate (across any targets).
    //  */
    // remove_resize_query(predicate: ResizeQueryManager.Predicate<AnyElement>): this {
    //     const set = this._resize_query_queries.get(predicate);
    //     if (set === undefined) return this;
    //     for (const sub of set) sub.remove();
    //     this._resize_query_queries.delete(predicate);
    //     return this;
    // }
    // /**
    //  * Remove all container subscriptions for this element.
    //  */
    // remove_resize_queries(): this {
    //     for (const set of this._resize_query_queries.values()) {
    //         for (const sub of set) sub.remove();
    //     }
    //     this._resize_query_queries.clear();
    //     return this;
    // }
    // /**
    //  * Alias for remove_resize_queries().
    //  */
    // remove_all_resize_queries(): this {
    //     return this.remove_resize_queries();
    // }
    // ---------------------------------------------------------
    // Animations.
    /**
     * {Default Animate}
     * Calls the animate function from the superclass with the provided arguments.
     * @parameter args The arguments to pass to the superclass animate function.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    default_animate(...args) {
        // @ts-ignore
        super.animate(...args);
        return this;
    }
    /**
     * {Animate}
     * Starts a new animation with the specified keyframes and options. Automatically resets the active animation.
     * @parameter options Configuration options for the animation including keyframes, duration, and callbacks.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
                if (options.delay !== undefined && options.delay > 0) {
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
     * {Stop Animation}
     * Stops the currently active animation by clearing the timeout.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    stop_animation() {
        clearTimeout(this._animate_timeout);
        return this;
    }
    /**
     * {Slide Out}
     * Animates the sliding out of an element in a specified direction with optional parameters for customization.
     * @parameter options Configuration options for the slide out animation.
     * @returns Returns a promise that resolves when the animation completes.
     * @docs
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
     * {Slide In}
     * Initiates a slide-in animation for the element with customizable parameters.
     * @parameter options Configuration options for the slide-in animation.
     * @returns Returns a promise that resolves when the slide-in animation is complete.
     * @docs
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
     * {Dropdown Text Animation}
     * Animates the text of a dropdown element with a specified animation effect.
     * It allows for customization of distance, duration, and easing for each character.
     * @warning Causes undefined behaviour when called on a non text element.
     * @parameter options An object containing animation settings.
     * @returns Returns a promise that resolves when the animation is complete.
     * @docs
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
                    const word_span = new VSpanElement()
                        .display("inline-block")
                        .white_space("nowrap");
                    if (text_style != null) {
                        word_span.style.cssText = text_style;
                    }
                    for (let c = 0; c < words[w].length; c++) {
                        const span = new VSpanElement()
                            .text(words[w][c])
                            .white_space("pre")
                            .display("inline-block")
                            .opacity(0)
                            .transform(`translateY(${distance})`)
                            .transition(`transform ${duration}ms ${easing}, opacity ${Math.floor(duration * opacity_duration)}ms ${easing}`);
                        spans.append(span);
                        word_span.append(span);
                    }
                    if (w < words.length - 1) {
                        word_span.append(new VSpanElement().text(" ").white_space("pre"));
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
     * {Increment Number Animation}
     * Animate incrementing a number with optional prefix and suffix.
     * @warning Causes undefined behaviour when called on a non text element.
     * @parameter start The start number for the animation.
     * @parameter end The end number, the animation will end with the number value of `end - 1`.
     * @parameter duration The duration of each individual number increment in milliseconds.
     * @parameter total_duration The total duration of the entire animation, parameter `total_duration` precedes parameter `duration`.
     * @parameter delay The delay until the animation starts in milliseconds.
     * @parameter prefix The prefix string to prepend to the animated number.
     * @parameter suffix The suffix string to append to the animated number.
     * @returns Returns a promise that resolves when the animation completes.
     * @docs
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
    // Fade out.
    fade_out_top(size = 0.05) {
        this.mask_image(`linear-gradient(0deg, #000 ${100.0 - size * 100}%, transparent)`);
        return this;
    }
    fade_out_right(size = 0.05) {
        this.mask_image(`linear-gradient(90deg, #000 ${100.0 - size * 100}%, transparent)`);
        return this;
    }
    fade_out_bottom(size = 0.05) {
        this.mask_image(`linear-gradient(180deg, #000 ${100.0 - size * 100}%, transparent)`);
        return this;
    }
    fade_out_left(size = 0.05) {
        this.mask_image(`linear-gradient(270deg, #000 ${100.0 - size * 100}%, transparent)`);
        return this;
    }
    on_resize(callback) {
        if (callback == null) {
            return this._on_resize_callbacks;
        }
        this._on_resize_callbacks.push(callback);
        if (!this._observing_on_resize) {
            this._observing_on_resize = true;
            on_resize_observer.observe(this);
        }
        return this;
    }
    /**
     * {Remove on Resize}
     * Removes a callback from the resize event listeners. If no callbacks remain, it stops observing resize events.
     * @parameter callback The callback function to remove from the resize event listeners.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    remove_on_resize(callback) {
        this._on_resize_callbacks = vlib.Array.drop(this._on_resize_callbacks, callback);
        if (this._on_resize_callbacks.length === 0) {
            on_resize_observer.unobserve(this);
            this._observing_on_resize = false;
        }
        return this;
    }
    /**
     * {Remove on Resizes}
     * Removes all resize callbacks and stops observing resize events for this element.
     * @parameter callback A callback function to be removed from the resize callbacks.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    remove_on_resizes() {
        this._on_resize_callbacks = [];
        on_resize_observer.unobserve(this);
        this._observing_on_resize = false;
        return this;
    }
    /**
     * {On Resize Rule}
     * Adds an on resize rule event that executes callbacks based on evaluation changes during a resize event.
     * @note This function adds an `on_resize` callback.
     * @parameter evaluation The function to evaluate if the statement is true, the element node is passed as the first argument.
     * @parameter on_true The callback executed if the statement is true, the element node is passed as the first argument.
     * @parameter on_false The callback executed if the statement is false, the element node is passed as the first argument.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
    // ---------------------------------------------------------
    // Events.
    // Set on event.
    // 
    on(type, callback, options) {
        this.addEventListener(type, (event) => callback(this, event), options);
        return this;
    }
    on_event_listener(type, callback, options) {
        this.addEventListener(type, (event) => callback(this, event), options);
        return this;
    }
    /**
     * {On emit}
     * Registers an event callback for the specified event ID. This allows the element to respond to events.
     * @parameter id The unique identifier for the event to listen for.
     * @parameter callback The function to be executed when the event is triggered.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    on_emit(id, callback) {
        Events.on(id, this, callback);
        return this;
    }
    /**
     * {Remove On Event}
     * Removes an event listener for the specified event ID.
     * @parameter id The identifier for the event to remove.
     * @parameter callback The function that was originally registered as the event handler.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    remove_on_event(id, callback) {
        Events.remove(id, this, callback);
        return this;
    }
    /**
     * {Remove On Events}
     * Removes all event callbacks associated with the given ID.
     * @parameter id The identifier for the events to be removed.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    remove_on_events(id) {
        Events.remove(id, this);
        return this;
    }
    /**
     * {Timeout}
     * Sets a timeout with optional id and debounce functionality.
     * @parameter delay The time in milliseconds to wait before executing the callback.
     * @parameter callback The function to execute after the timeout.
     * @parameter options Optional settings for the timeout behavior.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Clear Timeout}
     * Clears a cached timeout by its ID. If timeouts are not initialized, they will be set up.
     * @parameter id The ID of the timeout to clear.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    clear_timeout(id) {
        if (this._timeouts === undefined) {
            this._timeouts = {};
        }
        clearTimeout(this._timeouts[id]);
        return this;
    }
    _disabled_cursor;
    /**
     * {Disable Button}
     * Disables the button element, preventing user interaction.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    disable() {
        if (this.style.cursor !== "not-allowed") {
            this._disabled_cursor = this.style.cursor;
        }
        this.style.cursor = "not-allowed";
        this._is_button_disabled = true;
        return this;
    }
    /**
     * {Enable Button}
     * Enables the button by setting the disabled state to false.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    enable() {
        // console.log({ disabled_cursor: this._disabled_cursor, cursor: this.style.cursor });
        if (this._disabled_cursor) {
            this.style.cursor = this._disabled_cursor;
        }
        else if (this.style.cursor === "not-allowed") {
            this.style.cursor = "pointer";
        }
        this._is_button_disabled = false;
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
                if (this.constructor.element_tag !== "a") {
                    console.error(new Error("The on click href can only be set on anchor elements."));
                }
                else {
                    this.href(simulate_href);
                }
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
            if (this._is_button_disabled !== true) {
                callback(e, event);
            }
        };
        // deprecated, buttons now use <button>
        // if (this.element_name === "ButtonElement" || this.element_name === "LoaderButtonElement" || this.element_name === "BorderButtonElement") {
        //  this.attr("rel", "noopener noreferrer"); // for seo.
        // }
        return this;
    }
    /**
     * {On Click Redirect}
     * Sets up a click event that redirects to the specified URL when triggered.
     * @parameter url The URL to redirect to when the click event occurs.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Attachment Drop}
     *
     * Custom on attachment drop event handling.
     * This function sets up event listeners for drag and drop actions.
     * Also pushes the attachment to attribute field `attachments`.
     *
     * When a directory is dropped, all files within the directory are added recursively.
     *
     * @param options Configuration options for the drop event, see {@link Attachment.OnDropOpts} for more information.
     *
     * @returns The instance of the element for chaining.
     *
     * @docs
     */
    on_attachment_drop(options) {
        Attachment.on_drop(this, this.attachments, options);
        return this;
    }
    /**
     * Add an attachment to the attachments array, if not already added.
     * @param attachment The attachment to add.
     * @returns The instance of the element for chaining.
     */
    add_attachment(attachment) {
        const index = this.attachments.indexOf(attachment);
        if (index === -1) {
            this.attachments.push(attachment);
        }
        return this;
    }
    /**
     * Remove an attachment from the attachments array.
     * @param attachment The attachment to remove.
     * @returns The instance of the element for chaining.
     */
    remove_attachment(attachment) {
        const index = this.attachments.indexOf(attachment);
        if (index > -1) {
            this.attachments.splice(index, 1);
        }
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
     * {On Disappear}
     * Sets up an event listener that triggers a callback when the element disappears from the user's view.
     * @experimental
     * @parameter callback_or_opts Can be a callback function or an options object containing the callback and repeat settings.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
                    // VElement is about to disappear
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
        if (!Themes.theme_elements.some(item => item.element === this)) {
            Themes.theme_elements.push({
                element: this,
            });
        }
        this._on_theme_updates.push(callback);
        return this;
    }
    /**
     * {Remove on Theme Update}
     * Removes a callback from the theme update listeners.
     * @parameter callback The callback function to be removed from the listeners.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    remove_on_theme_update(callback) {
        this._on_theme_updates = vlib.Array.drop(this._on_theme_updates, callback);
        return this;
    }
    /**
     * {Remove on Theme Updates}
     * Clears the list of theme update callbacks if they exist.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
            on_render_observer.observe(this);
        }
        return this;
    }
    /**
     * {Remove on Render}
     * Removes a callback from the on render callbacks array and stops observing if empty.
     * @parameter callback The callback function to remove from the on render callbacks.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    remove_on_render(callback) {
        this._on_render_callbacks = vlib.Array.drop(this._on_render_callbacks, callback);
        if (this._on_render_callbacks.length === 0) {
            on_render_observer.unobserve(this);
            this._observing_on_render = false;
        }
        return this;
    }
    /**
     * {Remove On Renders}
     * Clears the on render callbacks and stops observing the element for render events.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    remove_on_renders() {
        this._on_render_callbacks = [];
        on_render_observer.unobserve(this);
        this._observing_on_render = false;
        return this;
    }
    /**
     * {Is Rendered}
     * Checks whether the element has been rendered or not.
     * @returns Returns true if the element has been rendered, otherwise false.
     * @docs
     */
    is_rendered() {
        return this.rendered;
    }
    /**
     * {On Load}
     * Registers a callback to be executed when the entire page is fully loaded.
     * Note that this event will not fire if the `window.onload` callback is overwritten.
     * @parameter callback The function to be executed on load.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    on_load(callback) {
        Events.on("volt.on_load", this, callback);
        return this;
    }
    /**
     * {Remove on Load}
     * Removes a callback function from the "volt.on_load" event.
     * @parameter callback The function to be removed from the event listener.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    remove_on_load(callback) {
        Events.remove("volt.on_load", this, callback);
        return this;
    }
    /**
     * {Remove On Loads}
     * Removes the on_load event listener from the instance.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    remove_on_loads() {
        Events.remove("volt.on_load", this);
        return this;
    }
    /**
     * {On Shortcut}
     * Create key shortcuts for the element. This function takes an array of shortcut objects that define the key combinations and their associated actions.
     * @parameter shortcuts The array with shortcuts. Each shortcut object may have various attributes to define the key matching criteria and actions.
     * @returns This function does not return a value.
     * @docs
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
                    if (this._on_shortcut_time == null ||
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
                    if (this._on_shortcut_time == null ||
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
            super.tabIndex = 0;
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
     * {On mouse over and out}
     * Set callbacks for the on mouse over and mouse out events.
     * @parameter mouse_over The mouse over callback.
     * @parameter mouse_out The mouse out callback.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
    //  return this.children;
    // }
    // Get a child by index.
    // child(index) {
    //  return this.children[index];
    // }
    /**
     * {First Child}
     * Retrieves the first child of the element.
     * @returns Returns the first child node of the element, or null if there are no children.
     * @docs
     */
    first_child() {
        return this.firstChild;
    }
    /**
     * {Last Child}
     * Retrieves the last child of the element.
     * @returns Returns the last child node of the element, or null if there are no children.
     * @docs
     */
    last_child() {
        return this.lastChild;
    }
    /**
     * {Iterate Children}
     * Iterates over the children of an element, executing a handler function for each child.
     * @parameter start The starting index for iteration, or a handler function.
     * @parameter end The ending index for iteration.
     * @parameter handler The function to execute for each child.
     * @returns Returns the result of the handler function if not null, otherwise returns null.
     * @docs
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
     * {Iterate Child Nodes}
     * Iterates over the child nodes of an element, executing a handler function for each node.
     * @parameter start The starting index for iteration, or a handler function.
     * @parameter end The ending index for iteration.
     * @parameter handler The function to execute for each child node.
     * @returns Returns the result of the handler function if not null, otherwise returns null.
     * @docs
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
     * {Set Default}
     * Sets the current element as the default, allowing for a specific type to be set.
     * @parameter Type The type to set as default, defaults to VElement if null.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    set_default(Type) {
        if (Type == null) {
            // @ts-ignore
            Type = this.constructor;
        }
        if (Type != null) {
            Type.default_style = this.styles();
        }
        return this;
    }
    /**
     * {Assign}
     * Assigns a function or property to the instance. This allows dynamic property assignment for elements.
     * @parameter name The name of the property or function to assign.
     * @parameter value The value to assign to the property or function.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    assign(name, value) {
        this[name] = value;
        // This below does not always work somehow.
        // if (Utils.is_func(value)) {
        //  VElement.prototype[name] = value;
        // } else {
        //  Object.defineProperty(VElement.prototype, name, { value });
        // }
        return this;
    }
    /**
     * {Extend}
     * Extends the current instance by adding properties or functions from the provided object.
     * @parameter obj The object containing properties or functions to add to the current instance.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    // extend<T extends object>(props: T): this & T {
    // extend<T extends Record<string, (...args: any[]) => any>>(methods: T & ThisType<MyClass & T>): this & T {
    extend(props) {
        Object.assign(this, props);
        return this;
    }
    /**
     * {Select Contents}
     * Selects the contents of the object, optionally overwriting existing selections.
     * @parameter overwrite Indicates whether to overwrite the current selection.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Is Scrollable}
     * Determines whether the element is scrollable based on its dimensions.
     * @returns Returns true if the element's scroll height or width exceeds its client height or width, indicating it is scrollable.
     * @docs
     */
    is_scrollable() {
        return this.scrollHeight > this.clientHeight || this.scrollWidth > this.clientWidth;
    }
    /**
     * {Is Scrollable X}
     * Checks if the element is scrollable in the horizontal direction by comparing its scroll width with its client width.
     * @returns Returns true if the element is scrollable horizontally, otherwise false.
     * @docs
     */
    is_scrollable_x() {
        return this.scrollWidth > this.clientWidth;
    }
    /**
     * {Is Scrollable Y}
     * Checks if the element is scrollable vertically by comparing its scroll height to its client height.
     * @returns Returns true if the element is scrollable in the Y direction, otherwise false.
     * @docs
     */
    is_scrollable_y() {
        return this.scrollHeight > this.clientHeight;
    }
    /**
     * {Wait Till Children Rendered}
     * Waits until the element and all its children are fully rendered.
     * This function should only be used in the `on_render` callback.
     * Note that it does not work with non-volt nodes and may not function correctly.
     * @parameter timeout The maximum time to wait for rendering in milliseconds.
     * @returns Returns a promise that resolves when all children are rendered or rejects on timeout.
     * @docs
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
            // console.log(nodes);
            // Wait.
            const wait = () => {
                const rendered = nodes.every(node => {
                    if (!node._is_connected) {
                        return false;
                    }
                    // console.log(node._is_connected);
                    return true;
                });
                if (rendered) {
                    // console.log("resolve", rendered);
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
     * {Add Pseudo}
     * Adds a pseudo element of a specified type to a node.
     * Ensures that the pseudo element is properly initialized and styled.
     * @parameter type The type of pseudo element to add (e.g., before, after).
     * @parameter node The node to which the pseudo element is added.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    pseudo(type, pseudo) {
        pseudo.apply(this, type);
        return this;
    }
    /**
     * {Remove Pseudo}
     * Remove a pseudo element by the specified node.
     * @parameter node The node from which the pseudo element will be removed.
     * @parameter pseudo_id Identifier for the pseudo element to be removed.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    remove_pseudo(type, pseudo) {
        pseudo.remove_from(this, type);
        return this;
    }
    /**
     * {Remove Pseudos}
     * Removes all pseudo classes and stylesheets associated with the element.
     * This function iterates through the class list and removes classes that start with "pseudo_".
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    remove_pseudos() {
        this.classList.forEach(name => {
            if (name.startsWith("pseudo_")) {
                this.classList.remove(name);
            }
        });
        return this;
    }
    /**
     * {Add Pseudo Hover}
     * Adds a pseudo element on mouse hover. This function does not work in combination with other mouse over events.
     * @parameter type The type of pseudo element to add.
     * @parameter node The node to which the pseudo element will be applied.
     * @parameter set_defaults A flag to set default values for the node.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    pseudo_on_hover(type, pseudo, set_defaults = true) {
        if (set_defaults) {
            pseudo.position(0, 0, 0, 0);
            const border_radius = this.border_radius();
            if (border_radius && typeof pseudo.border_radius === "function") {
                pseudo.border_radius(border_radius);
            }
            if (this.position() !== "absolute") {
                this.position("relative");
            }
        }
        this.on_mouse_over(() => pseudo.apply(this, type));
        this.on_mouse_out(() => pseudo.remove_from(this, type));
        return this;
    }
    parent(value) {
        if (value == null) {
            if (this._parent == null || this._parent === undefined) {
                return (this.parentElement ?? undefined);
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
     * {Assign to Parent As}
     * Assigns the current element to a specified attribute of the parent element.
     * @deprecated
     * @parameter name The name of the attribute to assign the current element to.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    assign_to_parent_as(name) {
        this._assign_to_parent_as = name;
        return this;
    }
    /**
     * {Get Y Offset From Parent}
     * Calculates the vertical offset of the current node relative to a specified parent node.
     * @deprecated
     * @parameter parent The parent node from which to calculate the offset.
     * @returns Returns the accumulated vertical offset from the current node to the parent node, or null if the parent wasn't found.
     * @docs
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
     * {Absolute Y Offset}
     * Calculates the absolute vertical offset of the element from the top of the document.
     * @returns Returns the absolute Y offset in pixels.
     * @docs
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
     * {Absolute X Offset}
     * Calculates the absolute X offset of the current element in relation to its offset parents.
     * @returns Returns the total left offset in pixels as a number.
     * @docs
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
     * {Exec}
     * Executes a provided function with the current element as its parameter.
     * @parameter callback A function to execute with the current element.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    exec(callback) {
        try {
            callback(this);
        }
        catch (e) {
            console.error("Error in exec callback:", e);
        }
        return this;
    }
    /**
     * {Is child}
     * Check if an element is a direct child of the element or the element itself.
     * @parameter target The target element to test.
     * @returns Returns true if the target is a direct child, otherwise false.
     * @docs
     */
    is_child(target) {
        return Utils.is_child(this, target);
    }
    /**
     * {Is Child}
     * Checks if an element is a recursively nested child of the element or the element itself.
     * @parameter target The target element to test.
     * @parameter stop_node A node at which to stop checking if target is a parent of the current element.
     * @returns Returns true if the target is a nested child, otherwise false.
     * @docs
     */
    is_nested_child(target, stop_node = null) {
        return Utils.is_nested_child(this, target, stop_node);
    }
    // ---------------------------------------------------------
    // Cast functions.
    /**
     * {To String}
     * Converts the current element to its string representation, setting an attribute in the process.
     * @returns Returns the outer HTML of the element as a string.
     * @docs
     */
    toString() {
        this.setAttribute("created_by_html", "true");
        // console.log("Created by html:", this.outerHTML)
        return this.outerHTML;
    }
    /**
     * {Accent color}
     * Specifies an accent color for user-interface controls. The equivalent of CSS attribute `accentColor`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the attribute's value if `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    accent_color(value) {
        if (value == null) {
            return this.style.accentColor;
        }
        this.style.accentColor = value;
        return this;
    }
    /**
     * {Align Content}
     * Specifies the alignment between the lines inside a flexible container when the items do not use all available space.
     * The equivalent of CSS attribute `alignContent`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute value when parameter `value` is `null`. Otherwise, returns the instance of the element for chaining.
     * @docs
     */
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
    /**
     * {Align Items}
     * Specifies the alignment for items inside a flexible container, equivalent to the CSS attribute `alignItems`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Align Self}
     * Specifies the alignment for selected items inside a flexible container. The equivalent of CSS attribute `alignSelf`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
    /**
     * {All}
     * Resets all properties (except unicode-bidi and direction). The equivalent of CSS attribute `all`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    all(value) {
        if (value == null) {
            return this.style.all;
        }
        this.style.all = value;
        return this;
    }
    /**
     * {Animation}
     * A shorthand property for all the animation properties.
     * The equivalent of CSS attribute `animation`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Animation Delay}
     * Specifies a delay for the start of an animation, equivalent to the CSS attribute `animationDelay`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the instance of the element for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Animation Direction}
     * Specifies whether an animation should be played forwards, backwards or in alternate cycles.
     * The equivalent of CSS attribute `animationDirection`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Animation Duration}
     * Specifies how long an animation should take to complete one cycle. The equivalent of CSS attribute `animationDuration`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Animation Fill Mode}
     * Specifies a style for the element when the animation is not playing, akin to the CSS `animation-fill-mode` property.
     * Use this method to set or retrieve the current fill mode value.
     * @param value The value to assign to the animation fill mode. Pass `null` to retrieve the current value.
     * @returns Returns the instance of the element for chaining when a value is set. If `null` is passed, returns the current value of the animation fill mode.
     * @docs
     */
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
    /**
     * {Animation Iteration Count}
     * Specifies the number of times an animation should be played. The equivalent of CSS attribute `animationIterationCount`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Animation Name}
     * Specifies a name for the \@keyframes animation, equivalent to the CSS attribute `animationName`.
     * When the parameter `value` is null, it retrieves the current attribute value.
     * @param value The value to assign for the animation name. Use null to retrieve the current value.
     * @returns Returns the current animation name when `value` is null, otherwise returns the instance for chaining.
     * @docs
     */
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
    /**
     * {Animation Play State}
     * Specifies whether the animation is running or paused.
     * The equivalent of CSS attribute `animationPlayState`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Animation Timing Function}
     * Specifies the speed curve of an animation. The equivalent of CSS attribute `animationTimingFunction`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Aspect ratio}
     * Specifies preferred aspect ratio of an element. The equivalent of CSS attribute `aspectRatio`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    aspect_ratio(value) {
        if (value == null) {
            return this.style.aspectRatio;
        }
        this.style.aspectRatio = value;
        return this;
    }
    /**
     * {Backdrop Filter}
     * Defines a graphical effect to the area behind an element. The equivalent of CSS attribute `backdropFilter`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the instance of the element for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Backface Visibility}
     * Defines whether or not the back face of an element should be visible when facing the user.
     * The equivalent of CSS attribute `backfaceVisibility`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Background Attachment}
     * Sets whether a background image scrolls with the rest of the page, or is fixed.
     * The equivalent of CSS attribute `backgroundAttachment`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    background_attachment(value) {
        if (value == null) {
            return this.style.backgroundAttachment;
        }
        this.style.backgroundAttachment = value;
        return this;
    }
    /**
     * {Background Blend Mode}
     * Specifies the blending mode of each background layer (color/image). The equivalent of CSS attribute `backgroundBlendMode`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    background_blend_mode(value) {
        if (value == null) {
            return this.style.backgroundBlendMode;
        }
        this.style.backgroundBlendMode = value;
        return this;
    }
    /**
     * {Background Clip}
     * Defines how far the background (color or image) should extend within an element.
     * The equivalent of CSS attribute `backgroundClip`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Background Color}
     * Specifies the background color of an element. The equivalent of CSS attribute `backgroundColor`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    background_color(value) {
        if (value == null) {
            return this.style.backgroundColor;
        }
        this.style.backgroundColor = value;
        return this;
    }
    /**
     * {Background Image}
     * Specifies one or more background images for an element.
     * The equivalent of CSS attribute `backgroundImage`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    background_image(value) {
        if (value == null) {
            return this.style.backgroundImage;
        }
        this.style.backgroundImage = value;
        return this;
    }
    /**
     * {Background Origin}
     * Specifies the origin position of a background image, equivalent to the CSS attribute `backgroundOrigin`.
     * @param value The value to assign for the background origin. Leave `null` to retrieve the attribute's current value.
     * @returns r: Returns the instance of the element for chaining unless `value` is `null`, then the current attribute value is returned.
     * @docs
     */
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
    /**
     * {Background Position}
     * Specifies the position of a background image, equivalent to the CSS attribute `backgroundPosition`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    background_position(value) {
        if (value == null) {
            return this.style.backgroundPosition;
        }
        this.style.backgroundPosition = value;
        return this;
    }
    /**
     * {Background Position X}
     * Specifies the position of a background image on x-axis.
     * The equivalent of CSS attribute `backgroundPositionX`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    background_position_x(value) {
        if (value == null) {
            return this.style.backgroundPositionX;
        }
        this.style.backgroundPositionX = this.pad_numeric(value);
        return this;
    }
    /**
     * {Background Position Y}
     * Specifies the position of a background image on the y-axis, equivalent to the CSS attribute `backgroundPositionY`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    background_position_y(value) {
        if (value == null) {
            return this.style.backgroundPositionY;
        }
        this.style.backgroundPositionY = this.pad_numeric(value);
        return this;
    }
    /**
     * {Background Repeat}
     * Sets if/how a background image will be repeated. This corresponds to the CSS property `backgroundRepeat`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, in which case the attribute's value is returned.
     * @docs
     */
    background_repeat(value) {
        if (value == null) {
            return this.style.backgroundRepeat;
        }
        this.style.backgroundRepeat = value;
        return this;
    }
    /**
     * {Background Size}
     * Specifies the size of the background images. The equivalent of CSS attribute `backgroundSize`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Block size}
     * Specifies the size of an element in block direction.
     * The equivalent of CSS attribute `blockSize`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    block_size(value) {
        if (value == null) {
            return this.style.blockSize;
        }
        this.style.blockSize = this.pad_numeric(value);
        return this;
    }
    /**
     * {Border Block}
     * A shorthand property for border-block-width, border-block-style and border-block-color.
     * The equivalent of CSS attribute `borderBlock`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_block(value) {
        if (value == null) {
            return this.style.borderBlock;
        }
        this.style.borderBlock = value;
        return this;
    }
    /**
     * {Border Block Color}
     * Sets the color of the borders at start and end in the block direction.
     * The equivalent of CSS attribute `borderBlockColor`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute's value if `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    border_block_color(value) {
        if (value == null) {
            return this.style.borderBlockColor;
        }
        this.style.borderBlockColor = value;
        return this;
    }
    /**
     * {Border Block End Color}
     * Sets the color of the border at the end in the block direction. The equivalent of CSS attribute `borderBlockEndColor`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_block_end_color(value) {
        if (value == null) {
            return this.style.borderBlockEndColor;
        }
        this.style.borderBlockEndColor = value;
        return this;
    }
    /**
     * {Border Block End Style}
     * Sets the style of the border at the end in the block direction.
     * The equivalent of CSS attribute `borderBlockEndStyle`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute value when parameter `value` is `null`. Otherwise, returns the instance of the element for chaining.
     * @docs
     */
    border_block_end_style(value) {
        if (value == null) {
            return this.style.borderBlockEndStyle;
        }
        this.style.borderBlockEndStyle = value;
        return this;
    }
    /**
     * {Border Block End Width}
     * Sets the width of the border at the end in the block direction.
     * The equivalent of CSS attribute `borderBlockEndWidth`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute's value when `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    border_block_end_width(value) {
        if (value == null) {
            return this.style.borderBlockEndWidth;
        }
        this.style.borderBlockEndWidth = this.pad_numeric(value);
        return this;
    }
    /**
     * {Border Block Start Color}
     * Sets the color of the border at the start in the block direction.
     * The equivalent of CSS attribute `borderBlockStartColor`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_block_start_color(value) {
        if (value == null) {
            return this.style.borderBlockStartColor;
        }
        this.style.borderBlockStartColor = value;
        return this;
    }
    /**
     * {Border Block Start Style}
     * Sets the style of the border at the start in the block direction.
     * The equivalent of CSS attribute `borderBlockStartStyle`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute's value if `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    border_block_start_style(value) {
        if (value == null) {
            return this.style.borderBlockStartStyle;
        }
        this.style.borderBlockStartStyle = value;
        return this;
    }
    /**
     * {Border Block Start Width}
     * Sets the width of the border at the start in the block direction. The equivalent of CSS attribute `borderBlockStartWidth`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_block_start_width(value) {
        if (value == null) {
            return this.style.borderBlockStartWidth;
        }
        this.style.borderBlockStartWidth = this.pad_numeric(value);
        return this;
    }
    /**
     * {Border Block Style}
     * Sets the style of the borders at start and end in the block direction.
     * The equivalent of CSS attribute `borderBlockStyle`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_block_style(value) {
        if (value == null) {
            return this.style.borderBlockStyle;
        }
        this.style.borderBlockStyle = value;
        return this;
    }
    /**
     * {Border Block Width}
     * Sets the width of the borders at start and end in the block direction.
     * The equivalent of CSS attribute `borderBlockWidth`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_block_width(value) {
        if (value == null) {
            return this.style.borderBlockWidth;
        }
        this.style.borderBlockWidth = this.pad_numeric(value);
        return this;
    }
    /**
     * {Border Bottom Color}
     * Sets the color of the bottom border. The equivalent of CSS attribute `borderBottomColor`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_bottom_color(value) {
        if (value == null) {
            return this.style.borderBottomColor;
        }
        this.style.borderBottomColor = value;
        return this;
    }
    /**
     * {Border Bottom Left Radius}
     * Defines the radius of the border of the bottom-left corner.
     * The equivalent of CSS attribute `borderBottomLeftRadius`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the attribute's value when `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    border_bottom_left_radius(value) {
        if (value == null) {
            return this.style.borderBottomLeftRadius;
        }
        this.style.borderBottomLeftRadius = this.pad_numeric(value);
        return this;
    }
    /**
     * {Border Bottom Right Radius}
     * Defines the radius of the border of the bottom-right corner.
     * The equivalent of CSS attribute `borderBottomRightRadius`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute value when parameter `value` is `null`. Otherwise, returns the instance of the element for chaining.
     * @docs
     */
    border_bottom_right_radius(value) {
        if (value == null) {
            return this.style.borderBottomRightRadius;
        }
        this.style.borderBottomRightRadius = this.pad_numeric(value);
        return this;
    }
    /**
     * {Border Bottom Style}
     * Sets the style of the bottom border, equivalent to the CSS attribute `borderBottomStyle`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_bottom_style(value) {
        if (value == null) {
            return this.style.borderBottomStyle;
        }
        this.style.borderBottomStyle = value;
        return this;
    }
    /**
     * {Border Bottom Width}
     * Sets the width of the bottom border. The equivalent of CSS attribute `borderBottomWidth`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_bottom_width(value) {
        if (value == null) {
            return this.style.borderBottomWidth;
        }
        this.style.borderBottomWidth = this.pad_numeric(value);
        return this;
    }
    /**
     * {Border Collapse}
     * Sets whether table borders should collapse into a single border or be separated.
     * The equivalent of CSS attribute `borderCollapse`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_collapse(value) {
        if (value == null) {
            return this.style.borderCollapse;
        }
        this.style.borderCollapse = value;
        return this;
    }
    /**
     * {Border Color}
     * Sets the color of the four borders. This is equivalent to the CSS attribute `borderColor`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining. Unless parameter `value` is `null`,
     * then the attribute's value is returned.
     * @docs
     */
    border_color(value) {
        if (value == null) {
            return this.style.borderColor;
        }
        this.style.borderColor = value;
        return this;
    }
    /**
     * {Border Image}
     * A shorthand property for all the border-image properties.
     * The equivalent of CSS attribute `borderImage`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Border image outset}
     * Specifies the amount by which the border image area extends beyond the border box. The equivalent of CSS attribute `borderImageOutset`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_image_outset(value) {
        if (value == null) {
            return this.style.borderImageOutset;
        }
        this.style.borderImageOutset = value;
        return this;
    }
    /**
     * {Border Image Repeat}
     * Specifies whether the border image should be repeated, rounded or stretched.
     * The equivalent of CSS attribute `borderImageRepeat`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_image_repeat(value) {
        if (value == null) {
            return this.style.borderImageRepeat;
        }
        this.style.borderImageRepeat = value;
        return this;
    }
    /**
     * {Border Image Slice}
     * Specifies how to slice the border image, equivalent to the CSS attribute `borderImageSlice`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_image_slice(value) {
        if (value == null) {
            return this.style.borderImageSlice;
        }
        this.style.borderImageSlice = value;
        return this;
    }
    /**
     * {Border Image Source}
     * Specifies the path to the image to be used as a border.
     * The equivalent of CSS attribute `borderImageSource`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_image_source(value) {
        if (value == null) {
            return this.style.borderImageSource;
        }
        this.style.borderImageSource = value;
        return this;
    }
    /**
     * {Border Image Width}
     * Specifies the width of the border image, equivalent to the CSS attribute `borderImageWidth`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute's value if `value` is `null`, otherwise returns the instance for chaining.
     * @docs
     */
    border_image_width(value) {
        if (value == null) {
            return this.style.borderImageWidth;
        }
        this.style.borderImageWidth = this.pad_numeric(value);
        return this;
    }
    /**
     * {Border inline}
     * A shorthand property for border-inline-width, border-inline-style and border-inline-color.
     * The equivalent of CSS attribute `borderInline`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_inline(value) {
        if (value == null) {
            return this.style.borderInline;
        }
        this.style.borderInline = value;
        return this;
    }
    /**
     * {Border Inline Color}
     * Sets the color of the borders at start and end in the inline direction.
     * The equivalent of CSS attribute `borderInlineColor`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining, unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_inline_color(value) {
        if (value == null) {
            return this.style.borderInlineColor;
        }
        this.style.borderInlineColor = value;
        return this;
    }
    /**
     * {Border Inline End Color}
     * Sets the color of the border at the end in the inline direction.
     * The equivalent of CSS attribute `borderInlineEndColor`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_inline_end_color(value) {
        if (value == null) {
            return this.style.borderInlineEndColor;
        }
        this.style.borderInlineEndColor = value;
        return this;
    }
    /**
     * {Border Inline End Style}
     * Sets the style of the border at the end in the inline direction.
     * The equivalent of CSS attribute `borderInlineEndStyle`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_inline_end_style(value) {
        if (value == null) {
            return this.style.borderInlineEndStyle;
        }
        this.style.borderInlineEndStyle = value;
        return this;
    }
    /**
     * {Border Inline End Width}
     * Sets the width of the border at the end in the inline direction.
     * The equivalent of CSS attribute `borderInlineEndWidth`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_inline_end_width(value) {
        if (value == null) {
            return this.style.borderInlineEndWidth;
        }
        this.style.borderInlineEndWidth = this.pad_numeric(value);
        return this;
    }
    /**
     * {Border inline start color}
     * Sets the color of the border at the start in the inline direction. The equivalent of CSS attribute `borderInlineStartColor`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_inline_start_color(value) {
        if (value == null) {
            return this.style.borderInlineStartColor;
        }
        this.style.borderInlineStartColor = value;
        return this;
    }
    /**
     * {Border inline start style}
     * Sets the style of the border at the start in the inline direction.
     * The equivalent of CSS attribute `borderInlineStartStyle`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_inline_start_style(value) {
        if (value == null) {
            return this.style.borderInlineStartStyle;
        }
        this.style.borderInlineStartStyle = value;
        return this;
    }
    /**
     * {Border Inline Start Width}
     * Sets the width of the border at the start in the inline direction.
     * The equivalent of CSS attribute `borderInlineStartWidth`.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_inline_start_width(value) {
        if (value == null) {
            return this.style.borderInlineStartWidth;
        }
        this.style.borderInlineStartWidth = this.pad_numeric(value);
        return this;
    }
    /**
     * {Border Inline Style}
     * Sets the style of the borders at start and end in the inline direction.
     * The equivalent of CSS attribute `borderInlineStyle`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_inline_style(value) {
        if (value == null) {
            return this.style.borderInlineStyle;
        }
        this.style.borderInlineStyle = value;
        return this;
    }
    /**
     * {Border Inline Width}
     * Sets the width of the borders at start and end in the inline direction.
     * The equivalent of CSS attribute `borderInlineWidth`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_inline_width(value) {
        if (value == null) {
            return this.style.borderInlineWidth;
        }
        this.style.borderInlineWidth = this.pad_numeric(value);
        return this;
    }
    /**
     * {Border Left Color}
     * Sets the color of the left border. The equivalent of CSS attribute `borderLeftColor`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_left_color(value) {
        if (value == null) {
            return this.style.borderLeftColor;
        }
        this.style.borderLeftColor = value;
        return this;
    }
    /**
     * {Border Left Style}
     * Sets the style of the left border. The equivalent of CSS attribute `borderLeftStyle`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_left_style(value) {
        if (value == null) {
            return this.style.borderLeftStyle;
        }
        this.style.borderLeftStyle = value;
        return this;
    }
    /**
     * {Border Left Width}
     * Sets the width of the left border. The equivalent of CSS attribute `borderLeftWidth`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_left_width(value) {
        if (value == null) {
            return this.style.borderLeftWidth;
        }
        this.style.borderLeftWidth = this.pad_numeric(value);
        return this;
    }
    /**
     * {Border radius}
     * A shorthand property for the four border-radius properties. The equivalent of CSS attribute `borderRadius`.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Border Right Color}
     * Sets the color of the right border. This is equivalent to the CSS attribute `borderRightColor`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_right_color(value) {
        if (value == null) {
            return this.style.borderRightColor;
        }
        this.style.borderRightColor = value;
        return this;
    }
    /**
     * {Border Right Style}
     * Sets the style of the right border. The equivalent of CSS attribute `borderRightStyle`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_right_style(value) {
        if (value == null) {
            return this.style.borderRightStyle;
        }
        this.style.borderRightStyle = value;
        return this;
    }
    /**
     * {Border Right Width}
     * Sets the width of the right border. The equivalent of CSS attribute `borderRightWidth`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_right_width(value) {
        if (value == null) {
            return this.style.borderRightWidth;
        }
        this.style.borderRightWidth = this.pad_numeric(value);
        return this;
    }
    /**
     * {Border Spacing}
     * Sets the distance between the borders of adjacent cells.
     * The equivalent of CSS attribute `borderSpacing`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_spacing(value) {
        if (value == null) {
            return this.style.borderSpacing;
        }
        this.style.borderSpacing = value;
        return this;
    }
    /**
     * {Border Style}
     * Sets the style of the four borders. The equivalent of CSS attribute `borderStyle`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining, or the attribute's value if `value` is `null`.
     * @docs
     */
    border_style(value) {
        if (value == null) {
            return this.style.borderStyle;
        }
        this.style.borderStyle = value;
        return this;
    }
    /**
     * {Border Top Color}
     * Sets the color of the top border. The equivalent of CSS attribute `borderTopColor`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining, unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_top_color(value) {
        if (value == null) {
            return this.style.borderTopColor;
        }
        this.style.borderTopColor = value;
        return this;
    }
    /**
     * {Border Top Left Radius}
     * Defines the radius of the border of the top-left corner. The equivalent of CSS attribute `borderTopLeftRadius`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_top_left_radius(value) {
        if (value == null) {
            return this.style.borderTopLeftRadius;
        }
        this.style.borderTopLeftRadius = this.pad_numeric(value);
        return this;
    }
    /**
     * {Border Top Right Radius}
     * Defines the radius of the border of the top-right corner.
     * The equivalent of CSS attribute `borderTopRightRadius`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute's value if `value` is `null`, otherwise returns the instance for chaining.
     * @docs
     */
    border_top_right_radius(value) {
        if (value == null) {
            return this.style.borderTopRightRadius;
        }
        this.style.borderTopRightRadius = this.pad_numeric(value);
        return this;
    }
    /**
     * {Border Top Style}
     * Sets the style of the top border. The equivalent of CSS attribute `borderTopStyle`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_top_style(value) {
        if (value == null) {
            return this.style.borderTopStyle;
        }
        this.style.borderTopStyle = value;
        return this;
    }
    /**
     * {Border Top Width}
     * Sets the width of the top border, equivalent to the CSS attribute `borderTopWidth`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute's value if `value` is `null`, otherwise returns the instance for chaining.
     * @docs
     */
    border_top_width(value) {
        if (value == null) {
            return this.style.borderTopWidth;
        }
        this.style.borderTopWidth = this.pad_numeric(value);
        return this;
    }
    /**
     * {Border Width}
     * Sets the width of the four borders, equivalent to the CSS attribute `borderWidth`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining, unless the parameter `value` is `null`,
     * then the attribute's value is returned.
     * @docs
     */
    border_width(value) {
        if (value == null) {
            return this.style.borderWidth;
        }
        this.style.borderWidth = this.pad_numeric(value);
        return this;
    }
    /**
     * {Bottom}
     * Sets the elements position, from the bottom of its parent element.
     * The equivalent of CSS attribute `bottom`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    bottom(value) {
        if (value == null) {
            return this.style.bottom;
        }
        this.style.bottom = this.pad_numeric(value);
        return this;
    }
    /**
     * {Box decoration break}
     * Sets the behavior of the background and border of an element at page-break, or, for in-line elements, at line-break. The equivalent of CSS attribute `boxDecorationBreak`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, in which case the attribute's value is returned.
     * @docs
     */
    box_decoration_break(value) {
        if (value == null) {
            return this.style.boxDecorationBreak ?? "";
        }
        this.style.boxDecorationBreak = value;
        return this;
    }
    /**
     * {Box reflect}
     * The box-reflect property is used to create a reflection of an element.
     * The equivalent of CSS attribute `boxReflect`.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    box_reflect(value) {
        if (value == null) {
            return this.style.boxReflect;
        }
        this.style.boxReflect = value;
        return this;
    }
    /**
     * {Box shadow}
     * Attaches one or more shadows to an element. The equivalent of CSS attribute `boxShadow`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`,
     * then the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Box sizing}
     * Defines how the width and height of an element are calculated: should they include padding and borders, or not. The equivalent of CSS attribute `boxSizing`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute value when parameter `value` is `null`. Otherwise, returns the instance of the element for chaining.
     * @docs
     */
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
    /**
     * {Break After}
     * Specifies whether or not a page-, column-, or region-break should occur after the specified element. The equivalent of CSS attribute `breakAfter`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute value when parameter `value` is `null`. Otherwise, returns the instance of the element for chaining.
     * @docs
     */
    break_after(value) {
        if (value == null) {
            return this.style.breakAfter;
        }
        this.style.breakAfter = value;
        return this;
    }
    /**
     * {Break Before}
     * Specifies whether or not a page-, column-, or region-break should occur before the specified element.
     * The equivalent of CSS attribute `breakBefore`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    break_before(value) {
        if (value == null) {
            return this.style.breakBefore;
        }
        this.style.breakBefore = value;
        return this;
    }
    /**
     * {Break Inside}
     * Specifies whether or not a page-, column-, or region-break should occur inside the specified element. The equivalent of CSS attribute `breakInside`. Returns the attribute value when parameter `value` is `null`.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    break_inside(value) {
        if (value == null) {
            return this.style.breakInside;
        }
        this.style.breakInside = value;
        return this;
    }
    /**
     * {Caption Side}
     * Specifies the placement of a table caption. The equivalent of CSS attribute `captionSide`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    caption_side(value) {
        if (value == null) {
            return this.style.captionSide;
        }
        this.style.captionSide = value;
        return this;
    }
    /**
     * {Caret color}
     * Specifies the color of the cursor (caret) in inputs, textareas, or any element that is editable.
     * The equivalent of CSS attribute `caretColor`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    caret_color(value) {
        if (value == null) {
            return this.style.caretColor;
        }
        this.style.caretColor = value;
        return this;
    }
    /**
     * {Clear}
     * Specifies what should happen with the element that is next to a floating element.
     * The equivalent of CSS attribute `clear`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    clear(value) {
        if (value == null) {
            return this.style.clear;
        }
        this.style.clear = value;
        return this;
    }
    /**
     * {Clip}
     * Clips an absolutely positioned element. The equivalent of CSS attribute `clip`.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    clip(value) {
        if (value == null) {
            return this.style.clip;
        }
        this.style.clip = value;
        return this;
    }
    /**
     * {Column Count}
     * Specifies the number of columns an element should be divided into.
     * The equivalent of CSS attribute `columnCount`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Column Fill}
     * Specifies how to fill columns, balanced or not.
     * The equivalent of CSS attribute `columnFill`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    column_fill(value) {
        if (value == null) {
            return this.style.columnFill;
        }
        this.style.columnFill = value;
        return this;
    }
    /**
     * {Column Gap}
     * Specifies the gap between the columns. The equivalent of CSS attribute `columnGap`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Column Rule}
     * A shorthand property for all the column-rule properties.
     * The equivalent of CSS attribute `columnRule`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Column Rule Color}
     * Specifies the color of the rule between columns. This is equivalent to the CSS attribute `columnRuleColor`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Column Rule Style}
     * Specifies the style of the rule between columns, equivalent to the CSS attribute `columnRuleStyle`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, in which case the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Column Rule Width}
     * Specifies the width of the rule between columns. This is equivalent to the CSS attribute `columnRuleWidth`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, in which case the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Column Span}
     * Specifies how many columns an element should span across.
     * The equivalent of CSS attribute `columnSpan`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    column_span(value) {
        if (value == null) {
            return this._try_parse_float(this.style.columnSpan, null);
        }
        this.style.columnSpan = value.toString();
        return this;
    }
    /**
     * {Column Width}
     * Specifies the column width, equivalent to the CSS attribute `columnWidth`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Columns}
     * A shorthand property for column-width and column-count. The equivalent of CSS attribute `columns`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    columns(value) {
        if (value == null) {
            return this.style.columns;
        }
        this.style.columns = value.toString();
        return this;
    }
    /**
     * {Content}
     * Used with the :before and :after pseudo-elements, to insert generated content. The equivalent of CSS attribute `content`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    content(value) {
        if (value == null) {
            return this.style.content ?? "";
        }
        this.style.content = value.toString();
        return this;
    }
    /**
     * {Counter Increment}
     * Increases or decreases the value of one or more CSS counters.
     * The equivalent of CSS attribute `counterIncrement`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    counter_increment(value) {
        if (value == null) {
            return this.style.counterIncrement;
        }
        this.style.counterIncrement = value.toString();
        return this;
    }
    /**
     * {Counter reset}
     * Creates or resets one or more CSS counters. The equivalent of CSS attribute `counterReset`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    counter_reset(value) {
        if (value == null) {
            return this.style.counterReset;
        }
        this.style.counterReset = value;
        return this;
    }
    /**
     * {Cursor}
     * Specifies the mouse cursor to be displayed when pointing over an element.
     * The equivalent of CSS attribute `cursor`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining, unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    cursor(value) {
        if (value == null) {
            return this.style.cursor;
        }
        this.style.cursor = value;
        return this;
    }
    /**
     * {Direction}
     * Specifies the text direction/writing direction. The equivalent of CSS attribute `direction`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    direction(value) {
        if (value == null) {
            return this.style.direction;
        }
        this.style.direction = value;
        return this;
    }
    /**
     * {Empty Cells}
     * Specifies whether or not to display borders and background on empty cells in a table. The equivalent of CSS attribute `emptyCells`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    empty_cells(value) {
        if (value == null) {
            return this.style.emptyCells ?? "";
        }
        this.style.emptyCells = value;
        return this;
    }
    /**
     * {Filter}
     * Defines effects (e.g. blurring or color shifting) on an element before the element is displayed.
     * The equivalent of CSS attribute `filter`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the attribute's value if `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
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
    /**
     * {Flex}
     * A shorthand property for the flex-grow, flex-shrink, and the flex-basis properties.
     * The equivalent of CSS attribute `flex`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    flex(value) {
        if (value == null) {
            return this.style.flex;
        }
        if (value === true) {
            value = 1;
        }
        else if (value === false) {
            value = 0;
        }
        if (typeof value !== "string") {
            value = value.toString();
        }
        this.style.flex = value.toString();
        this.style.msFlex = value.toString();
        this.style.webkitFlex = value.toString();
        this.style.MozFlex = value.toString();
        this.style.OFlex = value.toString();
        return this;
    }
    /**
     * {Flex Basis}
     * Specifies the initial length of a flexible item. The equivalent of CSS attribute `flexBasis`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Flex Direction}
     * Specifies the direction of the flexible items. This is the equivalent of the CSS attribute `flexDirection`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining. If `value` is `null`, returns the current attribute's value.
     * @docs
     */
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
    /**
     * {Flex Flow}
     * A shorthand property for the flex-direction and the flex-wrap properties.
     * The equivalent of CSS attribute `flexFlow`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Flex Grow}
     * Specifies how much the item will grow relative to the rest. The equivalent of CSS attribute `flexGrow`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Flex Shrink}
     * Specifies how the item will shrink relative to the rest.
     * The equivalent of CSS attribute `flexShrink`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the attribute value when parameter `value` is `null`.
     * Otherwise, returns the instance of the element for chaining.
     * @docs
     */
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
    /**
     * {Flex Wrap}
     * Specifies whether the flexible items should wrap or not. The equivalent of CSS attribute `flexWrap`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute's value if `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
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
    /**
     * {Float}
     * Specifies whether an element should float to the left, right, or not at all.
     * The equivalent of CSS attribute `float`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    float(value) {
        if (value == null) {
            return this.style.float;
        }
        this.style.float = value;
        return this;
    }
    /**
     * {Font}
     * A shorthand property for the font-style, font-variant, font-weight, font-size/line-height, and the font-family properties.
     * The equivalent of CSS attribute `font`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the instance of the element for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    font(value) {
        if (value == null) {
            return this.style.font;
        }
        this.style.font = value;
        return this;
    }
    /**
     * {Font Family}
     * Specifies the font family for text. This is the equivalent of the CSS attribute `fontFamily`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining, or the attribute's value if `value` is `null`.
     * @docs
     */
    font_family(value) {
        if (value == null) {
            return this.style.fontFamily;
        }
        this.style.fontFamily = value;
        return this;
    }
    /**
     * {Font Feature Settings}
     * Allows control over advanced typographic features in OpenType fonts. The equivalent of CSS attribute `fontFeatureSettings`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    font_feature_settings(value) {
        if (value == null) {
            return this.style.fontFeatureSettings;
        }
        this.style.fontFeatureSettings = value;
        return this;
    }
    /**
     * {Font Kerning}
     * Controls the usage of the kerning information (how letters are spaced). The equivalent of CSS attribute `fontKerning`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    font_kerning(value) {
        if (value == null) {
            return this.style.fontKerning;
        }
        this.style.fontKerning = value;
        return this;
    }
    /**
     * {Font Language Override}
     * Controls the usage of language-specific glyphs in a typeface.
     * The equivalent of CSS attribute `fontLanguageOverride`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the attribute's value if `value` is `null`, otherwise returns the instance for chaining.
     * @docs
     */
    font_language_override(value) {
        if (value == null) {
            return this.style.fontLanguageOverride;
        }
        this.style.fontLanguageOverride = value;
        return this;
    }
    /**
     * {Font size}
     * Specifies the font size of text. The equivalent of CSS attribute `fontSize`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    font_size(value) {
        if (value == null) {
            return this.style.fontSize;
        }
        this.style.fontSize = this.pad_numeric(value);
        return this;
    }
    /**
     * {Font Size Adjust}
     * Preserves the readability of text when font fallback occurs. The equivalent of CSS attribute `fontSizeAdjust`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    font_size_adjust(value) {
        if (value == null) {
            return this.style.fontSizeAdjust;
        }
        this.style.fontSizeAdjust = value;
        return this;
    }
    /**
     * {Font Stretch}
     * Selects a normal, condensed, or expanded face from a font family.
     * The equivalent of CSS attribute `fontStretch`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining, unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    font_stretch(value) {
        if (value == null) {
            return this.style.fontStretch;
        }
        this.style.fontStretch = value;
        return this;
    }
    /**
     * {Font Style}
     * Specifies the font style for text. The equivalent of CSS attribute `fontStyle`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    font_style(value) {
        if (value == null) {
            return this.style.fontStyle;
        }
        this.style.fontStyle = value;
        return this;
    }
    /**
     * {Font synthesis}
     * Controls which missing typefaces (bold or italic) may be synthesized by the browser. The equivalent of CSS attribute `fontSynthesis`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    font_synthesis(value) {
        if (value == null) {
            return this.style.fontSynthesis;
        }
        this.style.fontSynthesis = value;
        return this;
    }
    /**
     * {Font Variant}
     * Specifies whether or not a text should be displayed in a small-caps font. The equivalent of CSS attribute `fontVariant`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    font_variant(value) {
        if (value == null) {
            return this.style.fontVariant;
        }
        this.style.fontVariant = value;
        return this;
    }
    /**
     * {Font variant alternates}
     * Controls the usage of alternate glyphs associated to alternative names defined in \@font-feature-values.
     * The equivalent of CSS attribute `fontVariantAlternates`.
     * @returns Returns the attribute value when parameter `value` is `null`. Otherwise, returns the instance of the element for chaining.
     * @docs
     */
    font_variant_alternates(value) {
        if (value == null) {
            return this.style.fontVariantAlternates;
        }
        this.style.fontVariantAlternates = value;
        return this;
    }
    /**
     * {Font Variant Caps}
     * Controls the usage of alternate glyphs for capital letters. The equivalent of CSS attribute `fontVariantCaps`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    font_variant_caps(value) {
        if (value == null) {
            return this.style.fontVariantCaps;
        }
        this.style.fontVariantCaps = value;
        return this;
    }
    /**
     * {Font Variant East Asian}
     * Controls the usage of alternate glyphs for East Asian scripts (e.g Japanese and Chinese).
     * The equivalent of CSS attribute `fontVariantEastAsian`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute's value if `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    font_variant_east_asian(value) {
        if (value == null) {
            return this.style.fontVariantEastAsian;
        }
        this.style.fontVariantEastAsian = value;
        return this;
    }
    /**
     * {Font Variant Ligatures}
     * Controls which ligatures and contextual forms are used in textual content of the elements it applies to. The equivalent of CSS attribute `fontVariantLigatures`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    font_variant_ligatures(value) {
        if (value == null) {
            return this.style.fontVariantLigatures;
        }
        this.style.fontVariantLigatures = value;
        return this;
    }
    /**
     * {Font Variant Numeric}
     * Controls the usage of alternate glyphs for numbers, fractions, and ordinal markers.
     * The equivalent of CSS attribute `fontVariantNumeric`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    font_variant_numeric(value) {
        if (value == null) {
            return this.style.fontVariantNumeric;
        }
        this.style.fontVariantNumeric = value;
        return this;
    }
    /**
     * {Font Variant Position}
     * Controls the usage of alternate glyphs of smaller size positioned as superscript or subscript regarding the baseline of the font.
     * The equivalent of CSS attribute `fontVariantPosition`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    font_variant_position(value) {
        if (value == null) {
            return this.style.fontVariantPosition;
        }
        this.style.fontVariantPosition = value;
        return this;
    }
    /**
     * {Font Weight}
     * Specifies the weight of a font, equivalent to the CSS attribute `fontWeight`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute's value if `value` is `null`, otherwise returns the instance for chaining.
     * @docs
     */
    font_weight(value) {
        if (value == null) {
            return this.style.fontWeight;
        }
        this.style.fontWeight = value.toString();
        return this;
    }
    /**
     * {Gap}
     * A shorthand property for the row-gap and the column-gap properties. The equivalent of CSS attribute `gap`.
     * @returns Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    gap(value) {
        if (value == null) {
            return this.style.gap;
        }
        this.style.gap = this.pad_numeric(value);
        return this;
    }
    /**
     * {Grid}
     * A shorthand property for the grid-template-rows, grid-template-columns, grid-template-areas, grid-auto-rows, grid-auto-columns, and the grid-auto-flow properties. The equivalent of CSS attribute `grid`. Returns the attribute value when parameter `value` is `null`.
     * @returns Returns the attribute's value when `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    grid(value) {
        if (value == null) {
            return this.style.grid;
        }
        this.style.grid = value;
        return this;
    }
    /**
     * {Grid Area}
     * Either specifies a name for the grid item, or serves as a shorthand for grid-row-start, grid-column-start, grid-row-end, and grid-column-end properties.
     * The equivalent of CSS attribute `gridArea`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless `value` is `null`, in which case the attribute's value is returned.
     * @docs
     */
    grid_area(value) {
        if (value == null) {
            return this.style.gridArea;
        }
        this.style.gridArea = value;
        return this;
    }
    /**
     * {Grid Auto Columns}
     * Specifies a default column size, equivalent to the CSS attribute `gridAutoColumns`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    grid_auto_columns(value) {
        if (value == null) {
            return this.style.gridAutoColumns;
        }
        this.style.gridAutoColumns = value.toString();
        return this;
    }
    /**
     * {Grid Auto Flow}
     * Specifies how auto-placed items are inserted in the grid. The equivalent of CSS attribute `gridAutoFlow`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the attribute's value when `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    grid_auto_flow(value) {
        if (value == null) {
            return this.style.gridAutoFlow;
        }
        this.style.gridAutoFlow = value;
        return this;
    }
    /**
     * {Grid auto rows}
     * Specifies a default row size, equivalent to the CSS attribute `gridAutoRows`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    grid_auto_rows(value) {
        if (value == null) {
            return this.style.gridAutoRows;
        }
        this.style.gridAutoRows = value.toString();
        return this;
    }
    /**
     * {Grid Column}
     * A shorthand property for the grid-column-start and the grid-column-end properties.
     * The equivalent of CSS attribute `gridColumn`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    grid_column(value) {
        if (value == null) {
            return this.style.gridColumn;
        }
        this.style.gridColumn = value;
        return this;
    }
    /**
     * {Grid Column End}
     * Specifies where to end the grid item. The equivalent of CSS attribute `gridColumnEnd`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    grid_column_end(value) {
        if (value == null) {
            return this.style.gridColumnEnd;
        }
        this.style.gridColumnEnd = value.toString();
        return this;
    }
    /**
     * {Grid Column Gap}
     * Specifies the size of the gap between columns. The equivalent of CSS attribute `gridColumnGap`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    grid_column_gap(value) {
        if (value == null) {
            return this.style.gridColumnGap;
        }
        this.style.gridColumnGap = this.pad_numeric(value);
        return this;
    }
    /**
     * {Grid Column Start}
     * Specifies where to start the grid item. This is the equivalent of the CSS attribute `gridColumnStart`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the current value of the grid column start when `null` is passed, otherwise returns the instance for chaining.
     * @docs
     */
    grid_column_start(value) {
        if (value == null) {
            return this.style.gridColumnStart;
        }
        this.style.gridColumnStart = value.toString();
        return this;
    }
    /**
     * {Grid Gap}
     * A shorthand property for the grid-row-gap and grid-column-gap properties.
     * The equivalent of CSS attribute `gridGap`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    grid_gap(value) {
        if (value == null) {
            return this.style.gridGap;
        }
        this.style.gridGap = this.pad_numeric(value);
        return this;
    }
    /**
     * {Grid Row}
     * A shorthand property for the grid-row-start and the grid-row-end properties.
     * The equivalent of CSS attribute `gridRow`.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    grid_row(value) {
        if (value == null) {
            return this.style.gridRow;
        }
        this.style.gridRow = value;
        return this;
    }
    /**
     * {Grid Row End}
     * Specifies where to end the grid item. The equivalent of CSS attribute `gridRowEnd`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    grid_row_end(value) {
        if (value == null) {
            return this.style.gridRowEnd;
        }
        this.style.gridRowEnd = value;
        return this;
    }
    /**
     * {Grid Row Gap}
     * Specifies the size of the gap between rows. The equivalent of CSS attribute `gridRowGap`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    grid_row_gap(value) {
        if (value == null) {
            return this.style.gridRowGap;
        }
        this.style.gridRowGap = this.pad_numeric(value);
        return this;
    }
    /**
     * {Grid Row Start}
     * Specifies where to start the grid item, equivalent to CSS attribute `gridRowStart`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    grid_row_start(value) {
        if (value == null) {
            return this.style.gridRowStart;
        }
        this.style.gridRowStart = value.toString();
        return this;
    }
    /**
     * {Grid Template}
     * A shorthand property for the grid-template-rows, grid-template-columns and grid-areas properties.
     * The equivalent of CSS attribute `gridTemplate`.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    grid_template(value) {
        if (value == null) {
            return this.style.gridTemplate;
        }
        this.style.gridTemplate = value;
        return this;
    }
    /**
     * {Grid Template Areas}
     * Specifies how to display columns and rows, using named grid items. The equivalent of CSS attribute `gridTemplateAreas`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    grid_template_areas(value) {
        if (value == null) {
            return this.style.gridTemplateAreas;
        }
        this.style.gridTemplateAreas = value;
        return this;
    }
    /**
     * {Grid Template Columns}
     * Specifies the size of the columns and how many columns in a grid layout.
     * The equivalent of CSS attribute `gridTemplateColumns`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    grid_template_columns(value) {
        if (value == null) {
            return this.style.gridTemplateColumns;
        }
        this.style.gridTemplateColumns = value;
        return this;
    }
    /**
     * {Grid Template Rows}
     * Specifies the size of the rows in a grid layout, equivalent to the CSS attribute `gridTemplateRows`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    grid_template_rows(value) {
        if (value == null) {
            return this.style.gridTemplateRows;
        }
        this.style.gridTemplateRows = value.toString();
        return this;
    }
    /**
     * {Hanging punctuation}
     * Specifies whether a punctuation character may be placed outside the line box. The equivalent of CSS attribute `hangingPunctuation`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    hanging_punctuation(value) {
        if (value == null) {
            return this.style.hangingPunctuation;
        }
        this.style.hangingPunctuation = value;
        return this;
    }
    /**
     * {Hyphens}
     * Sets how to split words to improve the layout of paragraphs. The equivalent of CSS attribute `hyphens`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the attribute's value if `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    hyphens(value) {
        if (value == null) {
            return this.style.hyphens;
        }
        this.style.hyphens = value;
        return this;
    }
    /**
     * {Image Rendering}
     * Specifies the type of algorithm to use for image scaling. The equivalent of CSS attribute `imageRendering`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    image_rendering(value) {
        if (value == null) {
            return this.style.imageRendering;
        }
        this.style.imageRendering = value;
        return this;
    }
    /**
     * {Inline Size}
     * Specifies the size of an element in the inline direction.
     * The equivalent of CSS attribute `inlineSize`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    inline_size(value) {
        if (value == null) {
            return this.style.inlineSize;
        }
        this.style.inlineSize = this.pad_numeric(value);
        return this;
    }
    /**
     * {Inset}
     * Specifies the distance between an element and the parent element.
     * The equivalent of CSS attribute `inset`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining, unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    inset(value) {
        if (value == null) {
            return this.style.inset;
        }
        this.style.inset = this.pad_numeric(value);
        return this;
    }
    /**
     * {Inset Block}
     * Specifies the distance between an element and the parent element in the block direction.
     * The equivalent of CSS attribute `insetBlock`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    inset_block(value) {
        if (value == null) {
            return this.style.insetBlock;
        }
        this.style.insetBlock = this.pad_numeric(value);
        return this;
    }
    /**
     * {Inset Block End}
     * Specifies the distance between the end of an element and the parent element in the block direction.
     * The equivalent of CSS attribute `insetBlockEnd`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    inset_block_end(value) {
        if (value == null) {
            return this.style.insetBlockEnd ?? "";
        }
        this.style.insetBlockEnd = this.pad_numeric(value);
        return this;
    }
    /**
     * {Inset Block Start}
     * Specifies the distance between the start of an element and the parent element in the block direction.
     * The equivalent of CSS attribute `insetBlockStart`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    inset_block_start(value) {
        if (value == null) {
            return this.style.insetBlockStart;
        }
        this.style.insetBlockStart = this.pad_numeric(value);
        return this;
    }
    /**
     * {Inset inline}
     * Specifies the distance between an element and the parent element in the inline direction.
     * The equivalent of CSS attribute `insetInline`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    inset_inline(value) {
        if (value == null) {
            return this.style.insetInline;
        }
        this.style.insetInline = this.pad_numeric(value);
        return this;
    }
    /**
     * {Inset Inline End}
     * Specifies the distance between the end of an element and the parent element in the inline direction.
     * The equivalent of CSS attribute `insetInlineEnd`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute's value when `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    inset_inline_end(value) {
        if (value == null) {
            return this.style.insetInlineEnd;
        }
        this.style.insetInlineEnd = this.pad_numeric(value);
        return this;
    }
    /**
     * {Inset Inline Start}
     * Specifies the distance between the start of an element and the parent element in the inline direction.
     * The equivalent of CSS attribute `insetInlineStart`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    inset_inline_start(value) {
        if (value == null) {
            return this.style.insetInlineStart;
        }
        this.style.insetInlineStart = this.pad_numeric(value);
        ;
        return this;
    }
    /**
     * {Isolation}
     * Defines whether an element must create a new stacking content.
     * The equivalent of CSS attribute `isolation`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    isolation(value) {
        if (value == null) {
            return this.style.isolation;
        }
        this.style.isolation = value;
        return this;
    }
    /**
     * {Justify Content}
     * Specifies the alignment between the items inside a flexible container when the items do not use all available space. The equivalent of CSS attribute `justifyContent`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute's value when parameter `value` is `null`. Otherwise, returns the instance of the element for chaining.
     * @docs
     */
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
    /**
     * {Justify Items}
     * Sets the alignment of grid items in the inline direction on the grid container.
     * The equivalent of the CSS attribute `justify-items`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining, unless `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    justify_items(value) {
        if (value == null) {
            return this.style.justifyItems;
        }
        this.style.justifyItems = value;
        return this;
    }
    /**
     * {Justify Self}
     * Sets the alignment of the grid item in the inline direction. This corresponds to the CSS attribute `justify-self`.
     * When the parameter `value` is `null`, it retrieves the current attribute value.
     * @param value The value to assign for alignment. Passing `null` retrieves the current value.
     * @returns Returns the current alignment value if `value` is `null`, otherwise returns the instance for chaining.
     * @docs
     */
    justify_self(value) {
        if (value == null) {
            return this.style.justifySelf;
        }
        this.style.justifySelf = value;
        return this;
    }
    /**
     * {Left}
     * Specifies the left position of a positioned element. The equivalent of CSS attribute `left`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    left(value) {
        if (value == null) {
            return this.style.left;
        }
        this.style.left = this.pad_numeric(value);
        return this;
    }
    /**
     * {Letter spacing}
     * Increases or decreases the space between characters in a text.
     * The equivalent of CSS attribute `letterSpacing`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    letter_spacing(value) {
        if (value == null) {
            return this.style.letterSpacing;
        }
        this.style.letterSpacing = this.pad_numeric(value);
        return this;
    }
    /**
     * {Line Break}
     * Specifies how/if to break lines. The equivalent of CSS attribute `lineBreak`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    line_break(value) {
        if (value == null) {
            return this.style.lineBreak;
        }
        this.style.lineBreak = value;
        return this;
    }
    /**
     * {Line Height}
     * Sets the line height, equivalent to the CSS attribute `lineHeight`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    line_height(value) {
        if (value == null) {
            return this.style.lineHeight;
        }
        this.style.lineHeight = this.pad_numeric(value);
        return this;
    }
    /**
     * {List Style}
     * Sets all the properties for a list in one declaration. The equivalent of CSS attribute `listStyle`.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    list_style(value) {
        if (value == null) {
            return this.style.listStyle;
        }
        this.style.listStyle = value;
        return this;
    }
    /**
     * {List style image}
     * Specifies an image as the list-item marker. The equivalent of CSS attribute `listStyleImage`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    list_style_image(value) {
        if (value == null) {
            return this.style.listStyleImage;
        }
        this.style.listStyleImage = value;
        return this;
    }
    /**
     * {List Style Position}
     * Specifies the position of the list-item markers (bullet points).
     * The equivalent of CSS attribute `listStylePosition`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute's value when `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    list_style_position(value) {
        if (value == null) {
            return this.style.listStylePosition;
        }
        this.style.listStylePosition = value;
        return this;
    }
    /**
     * {List style type}
     * Specifies the type of list-item marker. The equivalent of CSS attribute `listStyleType`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    list_style_type(value) {
        if (value == null) {
            return this.style.listStyleType;
        }
        this.style.listStyleType = value;
        return this;
    }
    /**
     * {Margin Block}
     * Specifies the margin in the block direction.
     * The equivalent of CSS attribute `marginBlock`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    margin_block(value) {
        if (value == null) {
            return this.style.marginBlock;
        }
        this.style.marginBlock = this.pad_numeric(value);
        return this;
    }
    /**
     * {Margin Block End}
     * Specifies the margin at the end in the block direction.
     * The equivalent of CSS attribute `marginBlockEnd`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    margin_block_end(value) {
        if (value == null) {
            return this.style.marginBlockEnd;
        }
        this.style.marginBlockEnd = this.pad_numeric(value);
        return this;
    }
    /**
     * {Margin Block Start}
     * Specifies the margin at the start in the block direction.
     * The equivalent of CSS attribute `marginBlockStart`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    margin_block_start(value) {
        if (value == null) {
            return this.style.marginBlockStart;
        }
        this.style.marginBlockStart = this.pad_numeric(value);
        return this;
    }
    /**
     * {Margin Inline}
     * Specifies the margin in the inline direction. The equivalent of CSS attribute `marginInline`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    margin_inline(value) {
        if (value == null) {
            return this.style.marginInline;
        }
        this.style.marginInline = this.pad_numeric(value);
        return this;
    }
    /**
     * {Margin Inline End}
     * Specifies the margin at the end in the inline direction. This is the equivalent of the CSS attribute `marginInlineEnd`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    margin_inline_end(value) {
        if (value == null) {
            return this.style.marginInlineEnd;
        }
        this.style.marginInlineEnd = this.pad_numeric(value);
        return this;
    }
    /**
     * {Margin Inline Start}
     * Specifies the margin at the start in the inline direction.
     * The equivalent of CSS attribute `marginInlineStart`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    margin_inline_start(value) {
        if (value == null) {
            return this.style.marginInlineStart;
        }
        this.style.marginInlineStart = this.pad_numeric(value);
        return this;
    }
    /**
     * {Mask}
     * Hides parts of an element by masking or clipping an image at specific places.
     * The equivalent of CSS attribute `mask`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Mask clip}
     * Specifies the mask area. The equivalent of CSS attribute `maskClip`.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    mask_clip(value) {
        if (value == null) {
            return this.style.maskClip;
        }
        this.style.maskClip = value;
        return this;
    }
    /**
     * {Mask Composite}
     * Represents a compositing operation used on the current mask layer with the mask layers below it.
     * The equivalent of CSS attribute `maskComposite`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Mask Image}
     * Specifies an image to be used as a mask layer for an element.
     * The equivalent of CSS attribute `maskImage`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Mask Mode}
     * Specifies whether the mask layer image is treated as a luminance mask or as an alpha mask.
     * The equivalent of CSS attribute `maskMode`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    mask_mode(value) {
        if (value == null) {
            return this.style.maskMode;
        }
        this.style.maskMode = value;
        return this;
    }
    /**
     * {Mask origin}
     * Specifies the origin position (the mask position area) of a mask layer image. The equivalent of CSS attribute `maskOrigin`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    mask_origin(value) {
        if (value == null) {
            return this.style.maskOrigin;
        }
        this.style.maskOrigin = value;
        return this;
    }
    /**
     * {Mask Position}
     * Sets the starting position of a mask layer image (relative to the mask position area).
     * The equivalent of CSS attribute `maskPosition`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    mask_position(value) {
        if (value == null) {
            return this.style.maskPosition;
        }
        this.style.maskPosition = value;
        return this;
    }
    /**
     * {Mask Repeat}
     * Specifies how the mask layer image is repeated. The equivalent of CSS attribute `maskRepeat`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    mask_repeat(value) {
        if (value == null) {
            return this.style.maskRepeat;
        }
        this.style.maskRepeat = value;
        return this;
    }
    /**
     * {Mask Size}
     * Specifies the size of a mask layer image. The equivalent of CSS attribute `maskSize`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    mask_size(value) {
        if (value == null) {
            return this.style.maskSize;
        }
        this.style.maskSize = this.pad_numeric(value);
        return this;
    }
    /**
     * {Mask type}
     * Specifies whether an SVG \<mask> element is treated as a luminance mask or as an alpha mask.
     * The equivalent of CSS attribute `maskType`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    mask_type(value) {
        if (value == null) {
            return this.style.maskType;
        }
        this.style.maskType = value;
        return this;
    }
    /**
     * {Max height}
     * Sets the maximum height of an element. This is the equivalent of the CSS attribute `maxHeight`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    max_height(value) {
        if (value == null) {
            return this.style.maxHeight;
        }
        this.style.maxHeight = this.pad_numeric(value);
        return this;
    }
    /**
     * {Max Width}
     * Sets the maximum width of an element. The equivalent of CSS attribute `maxWidth`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    max_width(value) {
        if (value == null) {
            return this.style.maxWidth;
        }
        this.style.maxWidth = this.pad_numeric(value);
        return this;
    }
    /**
     * {Max Block Size}
     * Sets the maximum size of an element in the block direction.
     * The equivalent of CSS attribute `maxBlockSize`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    max_block_size(value) {
        if (value == null) {
            return this.style.maxBlockSize;
        }
        this.style.maxBlockSize = this.pad_numeric(value);
        return this;
    }
    /**
     * {Max inline size}
     * Sets the maximum size of an element in the inline direction.
     * The equivalent of CSS attribute `maxInlineSize`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    max_inline_size(value) {
        if (value == null) {
            return this.style.maxInlineSize;
        }
        this.style.maxInlineSize = this.pad_numeric(value);
        return this;
    }
    /**
     * {Min Block Size}
     * Sets the minimum size of an element in the block direction. The equivalent of CSS attribute `minBlockSize`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    min_block_size(value) {
        if (value == null) {
            return this._try_parse_float(this.style.minBlockSize, null);
        }
        this.style.minBlockSize = this.pad_numeric(value);
        return this;
    }
    /**
     * {Min Inline Size}
     * Sets the minimum size of an element in the inline direction. The equivalent of CSS attribute `minInlineSize`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    min_inline_size(value) {
        if (value == null) {
            return this.style.minInlineSize;
        }
        this.style.minInlineSize = this.pad_numeric(value);
        return this;
    }
    /**
     * {Mix Blend Mode}
     * Specifies how an element's content should blend with its direct parent background, equivalent to the CSS attribute `mixBlendMode`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    mix_blend_mode(value) {
        if (value == null) {
            return this.style.mixBlendMode;
        }
        this.style.mixBlendMode = value;
        return this;
    }
    /**
     * {Object fit}
     * Specifies how the contents of a replaced element should be fitted to the box established by its used height and width.
     * The equivalent of CSS attribute `objectFit`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the attribute's value when `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    object_fit(value) {
        if (value == null) {
            return this.style.objectFit;
        }
        this.style.objectFit = value;
        return this;
    }
    /**
     * {Object position}
     * Specifies the alignment of the replaced element inside its box. The equivalent of CSS attribute `objectPosition`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    object_position(value) {
        if (value == null) {
            return this.style.objectPosition;
        }
        this.style.objectPosition = value;
        return this;
    }
    /**
     * {Offset}
     * Is a shorthand, and specifies how to animate an element along a path. The equivalent of CSS attribute `offset`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    offset(value) {
        if (value == null) {
            return this.style.offset;
        }
        this.style.offset = value.toString();
        return this;
    }
    /**
     * {Offset Anchor}
     * Specifies a point on an element that is fixed to the path it is animated along. The equivalent of CSS attribute `offsetAnchor`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    offset_anchor(value) {
        if (value == null) {
            return this.style.offsetAnchor;
        }
        this.style.offsetAnchor = value;
        return this;
    }
    /**
     * {Offset distance}
     * Specifies the position along a path where an animated element is placed.
     * The equivalent of CSS attribute `offsetDistance`.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    offset_distance(value) {
        if (value == null) {
            return this.style.offsetDistance;
        }
        this.style.offsetDistance = value.toString();
        return this;
    }
    /**
     * {Offset Path}
     * Specifies the path an element is animated along.
     * The equivalent of CSS attribute `offsetPath`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    offset_path(value) {
        if (value == null) {
            return this.style.offsetPath;
        }
        this.style.offsetPath = value;
        return this;
    }
    /**
     * {Offset Rotate}
     * Specifies rotation of an element as it is animated along a path.
     * The equivalent of CSS attribute `offsetRotate`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    offset_rotate(value) {
        if (value == null) {
            return this.style.offsetRotate;
        }
        this.style.offsetRotate = value;
        return this;
    }
    /**
     * {Order}
     * Sets the order of the flexible item, relative to the rest. The equivalent of CSS attribute `order`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Orphans}
     * Sets the minimum number of lines that must be left at the bottom of a page or column.
     * The equivalent of CSS attribute `orphans`. Returns the attribute value when parameter
     * `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining. If `value` is `null`, the attribute's value is returned.
     * @docs
     */
    orphans(value) {
        if (value == null) {
            return this._try_parse_float(this.style.orphans, null);
        }
        this.style.orphans = value.toString();
        return this;
    }
    /**
     * {Outline}
     * A shorthand property for the outline-width, outline-style, and the outline-color properties.
     * The equivalent of CSS attribute `outline`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    outline(value) {
        if (value == null) {
            return this.style.outline;
        }
        this.style.outline = value;
        return this;
    }
    /**
     * {Outline Color}
     * Sets the color of an outline. This is the equivalent of the CSS attribute `outlineColor`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless the parameter `value` is `null`,
     * in which case the attribute's value is returned.
     * @docs
     */
    outline_color(value) {
        if (value == null) {
            return this.style.outlineColor;
        }
        this.style.outlineColor = value;
        return this;
    }
    /**
     * {Outline Offset}
     * Offsets an outline, and draws it beyond the border edge. The equivalent of CSS attribute `outlineOffset`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    outline_offset(value) {
        if (value == null) {
            return this.style.outlineOffset;
        }
        this.style.outlineOffset = value.toString();
        return this;
    }
    /**
     * {Outline Style}
     * Sets the style of an outline. The equivalent of CSS attribute `outlineStyle`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    outline_style(value) {
        if (value == null) {
            return this.style.outlineStyle;
        }
        this.style.outlineStyle = value;
        return this;
    }
    /**
     * {Outline Width}
     * Sets the width of an outline, equivalent to the CSS attribute `outlineWidth`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    outline_width(value) {
        if (value == null) {
            return this.style.outlineWidth;
        }
        this.style.outlineWidth = this.pad_numeric(value);
        return this;
    }
    /**
     * {Overflow}
     * Specifies what happens if content overflows an element's box.
     * The equivalent of CSS attribute `overflow`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute's value if `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    overflow(value) {
        if (value == null) {
            return this.style.overflow;
        }
        this.style.overflow = value;
        return this;
    }
    /**
     * {Overflow Anchor}
     * Specifies whether or not content in viewable area in a scrollable container should be pushed down when new content is loaded above.
     * The equivalent of CSS attribute `overflowAnchor`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    overflow_anchor(value) {
        if (value == null) {
            return this.style.overflowAnchor;
        }
        this.style.overflowAnchor = value;
        return this;
    }
    /**
     * {Overflow Wrap}
     * Specifies whether or not the browser can break lines with long words, if they overflow the container. The equivalent of CSS attribute `overflowWrap`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    overflow_wrap(value) {
        if (value == null) {
            return this.style.overflowWrap;
        }
        this.style.overflowWrap = value;
        return this;
    }
    /**
     * {Overflow x}
     * Specifies whether or not to clip the left/right edges of the content, if it overflows the element's content area.
     * The equivalent of CSS attribute `overflowX`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    overflow_x(value) {
        if (value == null) {
            return this.style.overflowX;
        }
        this.style.overflowX = value;
        return this;
    }
    /**
     * {Overflow Y}
     * Specifies whether or not to clip the top/bottom edges of the content, if it overflows the element's content area.
     * The equivalent of CSS attribute `overflowY`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    overflow_y(value) {
        if (value == null) {
            return this.style.overflowY;
        }
        this.style.overflowY = value;
        return this;
    }
    /**
     * {Overscroll behavior}
     * Specifies whether to have scroll chaining or overscroll affordance in x- and y-directions. The equivalent of CSS attribute `overscrollBehavior`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    overscroll_behavior(value) {
        if (value == null) {
            return this.style.overscrollBehavior;
        }
        this.style.overscrollBehavior = value;
        return this;
    }
    /**
     * {Overscroll behavior block}
     * Specifies whether to have scroll chaining or overscroll affordance in the block direction.
     * The equivalent of CSS attribute `overscrollBehaviorBlock`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    overscroll_behavior_block(value) {
        if (value == null) {
            return this.style.overscrollBehaviorBlock;
        }
        this.style.overscrollBehaviorBlock = value;
        return this;
    }
    /**
     * {Overscroll Behavior Inline}
     * Specifies whether to have scroll chaining or overscroll affordance in the inline direction.
     * The equivalent of CSS attribute `overscrollBehaviorInline`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining. If `value` is `null`, returns the attribute's value.
     * @docs
     */
    overscroll_behavior_inline(value) {
        if (value == null) {
            return this.style.overscrollBehaviorInline;
        }
        this.style.overscrollBehaviorInline = value;
        return this;
    }
    /**
     * {Overscroll Behavior X}
     * Specifies whether to have scroll chaining or overscroll affordance in x-direction.
     * The equivalent of CSS attribute `overscrollBehaviorX`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    overscroll_behavior_x(value) {
        if (value == null) {
            return this.style.overscrollBehaviorX;
        }
        this.style.overscrollBehaviorX = value;
        return this;
    }
    /**
     * {Overscroll behavior y}
     * Specifies whether to have scroll chaining or overscroll affordance in y-directions.
     * The equivalent of CSS attribute `overscrollBehaviorY`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute value when parameter `value` is `null`. Otherwise, returns the `VElement` object for chaining.
     * @docs
     */
    overscroll_behavior_y(value) {
        if (value == null) {
            return this.style.overscrollBehaviorY;
        }
        this.style.overscrollBehaviorY = value;
        return this;
    }
    /**
     * {Padding Block}
     * Specifies the padding in the block direction. The equivalent of CSS attribute `paddingBlock`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    padding_block(value) {
        if (value == null) {
            return this.style.paddingBlock;
        }
        this.style.paddingBlock = this.pad_numeric(value);
        ;
        return this;
    }
    /**
     * {Padding Block End}
     * Specifies the padding at the end in the block direction. The equivalent of CSS attribute `paddingBlockEnd`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    padding_block_end(value) {
        if (value == null) {
            return this.style.paddingBlockEnd;
        }
        this.style.paddingBlockEnd = this.pad_numeric(value);
        ;
        return this;
    }
    /**
     * {Padding Block Start}
     * Specifies the padding at the start in the block direction.
     * The equivalent of CSS attribute `paddingBlockStart`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    padding_block_start(value) {
        if (value == null) {
            return this.style.paddingBlockStart;
        }
        this.style.paddingBlockStart = this.pad_numeric(value);
        ;
        return this;
    }
    /**
     * {Padding Inline}
     * Specifies the padding in the inline direction. The equivalent of CSS attribute `paddingInline`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    padding_inline(value) {
        if (value == null) {
            return this.style.paddingInline ?? "";
        }
        this.style.paddingInline = this.pad_numeric(value);
        ;
        return this;
    }
    /**
     * {Padding Inline End}
     * Specifies the padding at the end in the inline direction.
     * The equivalent of CSS attribute `paddingInlineEnd`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    padding_inline_end(value) {
        if (value == null) {
            return this.style.paddingInlineEnd;
        }
        this.style.paddingInlineEnd = this.pad_numeric(value);
        ;
        return this;
    }
    /**
     * {Padding Inline Start}
     * Specifies the padding at the start in the inline direction. The equivalent of CSS attribute `paddingInlineStart`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining, or the attribute's value if `value` is `null`.
     * @docs
     */
    padding_inline_start(value) {
        if (value == null) {
            return this.style.paddingInlineStart;
        }
        this.style.paddingInlineStart = this.pad_numeric(value);
        return this;
    }
    /**
     * {Page break after}
     * Sets the page-break behavior after an element. The equivalent of CSS attribute `pageBreakAfter`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    page_break_after(value) {
        if (value == null) {
            return this.style.pageBreakAfter;
        }
        this.style.pageBreakAfter = value;
        return this;
    }
    /**
     * {Page break before}
     * Sets the page-break behavior before an element. The equivalent of CSS attribute `pageBreakBefore`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    page_break_before(value) {
        if (value == null) {
            return this.style.pageBreakBefore;
        }
        this.style.pageBreakBefore = value;
        return this;
    }
    /**
     * {Page Break Inside}
     * Sets the page-break behavior inside an element. The equivalent of CSS attribute `pageBreakInside`.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    page_break_inside(value) {
        if (value == null) {
            return this.style.pageBreakInside;
        }
        this.style.pageBreakInside = value;
        return this;
    }
    /**
     * {Paint Order}
     * Sets the order of how an SVG element or text is painted. The equivalent of CSS attribute `paintOrder`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute's value when `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    paint_order(value) {
        if (value == null) {
            return this.style.paintOrder;
        }
        this.style.paintOrder = value;
        return this;
    }
    /**
     * {Perspective}
     * Gives a 3D-positioned element some perspective. The equivalent of CSS attribute `perspective`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Perspective origin}
     * Defines at which position the user is looking at the 3D-positioned element. The equivalent of CSS attribute `perspectiveOrigin`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Place Content}
     * Specifies align-content and justify-content property values for flexbox and grid layouts.
     * The equivalent of CSS attribute `placeContent`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    place_content(value) {
        if (value == null) {
            return this.style.placeContent;
        }
        this.style.placeContent = value;
        return this;
    }
    /**
     * {Place items}
     * Specifies align-items and justify-items property values for grid layouts. The equivalent of CSS attribute `placeItems`.
     * @returns Returns the attribute's value when `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    place_items(value) {
        if (value == null) {
            return this.style.placeItems;
        }
        this.style.placeItems = value;
        return this;
    }
    /**
     * {Place Self}
     * Specifies align-self and justify-self property values for grid layouts.
     * The equivalent of CSS attribute `placeSelf`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute value when parameter `value` is `null`.
     * Otherwise, returns the instance of the element for chaining.
     * @docs
     */
    place_self(value) {
        if (value == null) {
            return this.style.placeSelf;
        }
        this.style.placeSelf = value;
        return this;
    }
    /**
     * {Pointer events}
     * Defines whether or not an element reacts to pointer events, equivalent to the CSS attribute `pointerEvents`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    pointer_events(value) {
        if (value == null) {
            return this.style.pointerEvents;
        }
        this.style.pointerEvents = value;
        return this;
    }
    /**
     * {Quotes}
     * Sets the type of quotation marks for embedded quotations. The equivalent of CSS attribute `quotes`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    quotes(value) {
        if (value == null) {
            return this.style.quotes;
        }
        this.style.quotes = value;
        return this;
    }
    /**
     * {Resize}
     * Defines if (and how) an element is resizable by the user.
     * The equivalent of CSS attribute `resize`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the attribute's value if `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    resize(value) {
        if (value == null) {
            return this.style.resize;
        }
        this.style.resize = value;
        return this;
    }
    /**
     * {Right}
     * Specifies the right position of a positioned element. The equivalent of CSS attribute `right`. Returns the attribute value when parameter `value` is `null`.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    right(value) {
        if (value == null) {
            return this.style.right;
        }
        this.style.right = this.pad_numeric(value);
        return this;
    }
    /**
     * {Row Gap}
     * Specifies the gap between the grid rows. The equivalent of CSS attribute `rowGap`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    row_gap(value) {
        if (value == null) {
            return this.style.rowGap;
        }
        this.style.rowGap = this.pad_numeric(value);
        return this;
    }
    /**
     * {Scale}
     * Specifies the size of an element by scaling up or down. The equivalent of CSS attribute `scale`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scale(value) {
        if (value == null) {
            return this._try_parse_float(this.style.scale, null);
        }
        this.style.scale = value.toString();
        return this;
    }
    /**
     * {Scroll Behavior}
     * Specifies whether to smoothly animate the scroll position in a scrollable box, instead of a straight jump.
     * The equivalent of CSS attribute `scrollBehavior`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_behavior(value) {
        if (value == null) {
            return this.style.scrollBehavior;
        }
        this.style.scrollBehavior = value;
        return this;
    }
    /**
     * {Scroll Margin}
     * Specifies the margin between the snap position and the container.
     * The equivalent of CSS attribute `scrollMargin`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_margin(value) {
        if (value == null) {
            return this.style.scrollMargin;
        }
        this.style.scrollMargin = this.pad_numeric(value);
        return this;
    }
    /**
     * {Scroll Margin Block}
     * Specifies the margin between the snap position and the container in the block direction.
     * The equivalent of CSS attribute `scrollMarginBlock`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute value when parameter `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    scroll_margin_block(value) {
        if (value == null) {
            return this.style.scrollMarginBlock;
        }
        this.style.scrollMarginBlock = this.pad_numeric(value);
        return this;
    }
    /**
     * {Scroll margin block end}
     * Specifies the end margin between the snap position and the container in the block direction.
     * The equivalent of CSS attribute `scrollMarginBlockEnd`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_margin_block_end(value) {
        if (value == null) {
            return this.style.scrollMarginBlockEnd;
        }
        this.style.scrollMarginBlockEnd = this.pad_numeric(value);
        return this;
    }
    /**
     * {Scroll margin block start}
     * Specifies the start margin between the snap position and the container in the block direction.
     * The equivalent of CSS attribute `scrollMarginBlockStart`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute value when parameter `value` is `null`. Otherwise, returns the instance of the element for chaining.
     * @docs
     */
    scroll_margin_block_start(value) {
        if (value == null) {
            return this.style.scrollMarginBlockStart;
        }
        this.style.scrollMarginBlockStart = this.pad_numeric(value);
        return this;
    }
    /**
     * {Scroll margin bottom}
     * Specifies the margin between the snap position on the bottom side and the container.
     * The equivalent of CSS attribute `scrollMarginBottom`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_margin_bottom(value) {
        if (value == null) {
            return this.style.scrollMarginBottom;
        }
        this.style.scrollMarginBottom = this.pad_numeric(value);
        return this;
    }
    /**
     * {Scroll Margin Inline}
     * Specifies the margin between the snap position and the container in the inline direction.
     * The equivalent of CSS attribute `scrollMarginInline`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_margin_inline(value) {
        if (value == null) {
            return this.style.scrollMarginInline;
        }
        this.style.scrollMarginInline = this.pad_numeric(value);
        return this;
    }
    /**
     * {Scroll margin inline end}
     * Specifies the end margin between the snap position and the container in the inline direction.
     * The equivalent of CSS attribute `scrollMarginInlineEnd`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_margin_inline_end(value) {
        if (value == null) {
            return this.style.scrollMarginInlineEnd;
        }
        this.style.scrollMarginInlineEnd = this.pad_numeric(value);
        return this;
    }
    /**
     * {Scroll margin inline start}
     * Specifies the start margin between the snap position and the container in the inline direction.
     * The equivalent of CSS attribute `scrollMarginInlineStart`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_margin_inline_start(value) {
        if (value == null) {
            return this.style.scrollMarginInlineStart;
        }
        this.style.scrollMarginInlineStart = this.pad_numeric(value);
        return this;
    }
    /**
     * {Scroll Margin Left}
     * Specifies the margin between the snap position on the left side and the container.
     * The equivalent of CSS attribute `scrollMarginLeft`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Scroll Margin Top}
     * Specifies the margin between the snap position on the top side and the container.
     * The equivalent of CSS attribute `scrollMarginTop`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_margin_top(value) {
        if (value == null) {
            return this.style.scrollMarginTop;
        }
        this.style.scrollMarginTop = this.pad_numeric(value);
        return this;
    }
    /**
     * {Scroll Padding}
     * Specifies the distance from the container to the snap position on the child elements.
     * The equivalent of CSS attribute `scrollPadding`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`,
     * then the attribute's value is returned.
     * @docs
     */
    scroll_padding(value) {
        if (value == null) {
            return this.style.scrollPadding;
        }
        this.style.scrollPadding = this.pad_numeric(value);
        return this;
    }
    /**
     * {Scroll padding block}
     * Specifies the distance in block direction from the container to the snap position on the child elements.
     * The equivalent of CSS attribute `scrollPaddingBlock`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute value when parameter `value` is `null`. Otherwise, returns the instance of the element for chaining.
     * @docs
     */
    scroll_padding_block(value) {
        if (value == null) {
            return this.style.scrollPaddingBlock;
        }
        this.style.scrollPaddingBlock = this.pad_numeric(value);
        return this;
    }
    /**
     * {Scroll Padding Block End}
     * Specifies the distance in block direction from the end of the container to the snap position on the child elements.
     * The equivalent of CSS attribute `scrollPaddingBlockEnd`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_padding_block_end(value) {
        if (value == null) {
            return this.style.scrollPaddingBlockEnd;
        }
        this.style.scrollPaddingBlockEnd = this.pad_numeric(value);
        return this;
    }
    /**
     * {Scroll padding block start}
     * Specifies the distance in block direction from the start of the container to the snap position on the child elements. The equivalent of CSS attribute `scrollPaddingBlockStart`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_padding_block_start(value) {
        if (value == null) {
            return this.style.scrollPaddingBlockStart;
        }
        this.style.scrollPaddingBlockStart = this.pad_numeric(value);
        return this;
    }
    /**
     * {Scroll Padding Bottom}
     * Specifies the distance from the bottom of the container to the snap position on the child elements.
     * The equivalent of CSS attribute `scrollPaddingBottom`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_padding_bottom(value) {
        if (value == null) {
            return this.style.scrollPaddingBottom;
        }
        this.style.scrollPaddingBottom = this.pad_numeric(value);
        return this;
    }
    /**
     * {Scroll Padding Inline}
     * Specifies the distance in inline direction from the container to the snap position on the child elements.
     * The equivalent of CSS attribute `scrollPaddingInline`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the attribute's value if `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    scroll_padding_inline(value) {
        if (value == null) {
            return this.style.scrollPaddingInline;
        }
        this.style.scrollPaddingInline = this.pad_numeric(value);
        return this;
    }
    /**
     * {Scroll padding inline end}
     * Specifies the distance in inline direction from the end of the container to the snap position on the child elements.
     * The equivalent of CSS attribute `scrollPaddingInlineEnd`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_padding_inline_end(value) {
        if (value == null) {
            return this.style.scrollPaddingInlineEnd;
        }
        this.style.scrollPaddingInlineEnd = this.pad_numeric(value);
        return this;
    }
    /**
     * {Scroll padding inline start}
     * Specifies the distance in inline direction from the start of the container to the snap position on the child elements.
     * The equivalent of CSS attribute `scrollPaddingInlineStart`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_padding_inline_start(value) {
        if (value == null) {
            return this.style.scrollPaddingInlineStart ?? "";
        }
        this.style.scrollPaddingInlineStart = this.pad_numeric(value);
        return this;
    }
    /**
     * {Scroll Padding Left}
     * Specifies the distance from the left side of the container to the snap position on the child elements.
     * The equivalent of CSS attribute `scrollPaddingLeft`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_padding_left(value) {
        if (value == null) {
            return this.style.scrollPaddingLeft;
        }
        this.style.scrollPaddingLeft = this.pad_numeric(value);
        return this;
    }
    /**
     * {Scroll Padding Right}
     * Specifies the distance from the right side of the container to the snap position on the child elements.
     * The equivalent of CSS attribute `scrollPaddingRight`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_padding_right(value) {
        if (value == null) {
            return this.style.scrollPaddingRight;
        }
        this.style.scrollPaddingRight = this.pad_numeric(value);
        return this;
    }
    /**
     * {Scroll Padding Top}
     * Specifies the distance from the top of the container to the snap position on the child elements.
     * The equivalent of CSS attribute `scrollPaddingTop`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_padding_top(value) {
        if (value == null) {
            return this.style.scrollPaddingTop;
        }
        this.style.scrollPaddingTop = this.pad_numeric(value);
        return this;
    }
    /**
     * {Scroll Snap Align}
     * Specifies where to position elements when the user stops scrolling.
     * The equivalent of CSS attribute `scrollSnapAlign`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_snap_align(value) {
        if (value == null) {
            return this.style.scrollSnapAlign;
        }
        this.style.scrollSnapAlign = value;
        return this;
    }
    /**
     * {Scroll Snap Stop}
     * Specifies scroll behaviour after fast swipe on trackpad or touch screen.
     * The equivalent of CSS attribute `scrollSnapStop`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_snap_stop(value) {
        if (value == null) {
            return this.style.scrollSnapStop;
        }
        this.style.scrollSnapStop = value;
        return this;
    }
    /**
     * {Scroll Snap Type}
     * Specifies how snap behaviour should be when scrolling. The equivalent of CSS attribute `scrollSnapType`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_snap_type(value) {
        if (value == null) {
            return this.style.scrollSnapType;
        }
        this.style.scrollSnapType = value;
        return this;
    }
    /**
     * {Scrollbar color}
     * Specifies the color of the scrollbar of an element. The equivalent of CSS attribute `scrollbarColor`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scrollbar_color(value) {
        if (value == null) {
            return this.style.scrollbarColor;
        }
        this.style.scrollbarColor = value;
        return this;
    }
    /**
     * {Tab Size}
     * Specifies the width of a tab character, equivalent to the CSS attribute `tabSize`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the instance of the element for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Table Layout}
     * Defines the algorithm used to lay out table cells, rows, and columns.
     * The equivalent of CSS attribute `tableLayout`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    table_layout(value) {
        if (value == null) {
            return this.style.tableLayout;
        }
        this.style.tableLayout = value;
        return this;
    }
    /**
     * {Text Align}
     * Specifies the horizontal alignment of text, equivalent to the CSS `textAlign` attribute.
     * @param value The value to assign for text alignment. Leave `null` to retrieve the current attribute's value.
     * @returns Returns the current value of `textAlign` if no argument is provided; otherwise returns the instance for chaining.
     * @docs
     */
    text_align(value) {
        if (value == null) {
            return this.style.textAlign;
        }
        this.style.textAlign = value;
        return this;
    }
    /**
     * {Text Align Last}
     * Describes how the last line of a block or a line right before a forced line break is aligned when text-align is "justify".
     * The equivalent of CSS attribute `textAlignLast`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    text_align_last(value) {
        if (value == null) {
            return this.style.textAlignLast;
        }
        this.style.textAlignLast = value;
        return this;
    }
    /**
     * {Text Combine Upright}
     * Specifies the combination of multiple characters into the space of a single character.
     * The equivalent of CSS attribute `textCombineUpright`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    text_combine_upright(value) {
        if (value == null) {
            return this.style.textCombineUpright;
        }
        this.style.textCombineUpright = value;
        return this;
    }
    /**
     * {Text Decoration}
     * Specifies the decoration added to text. The equivalent of CSS attribute `textDecoration`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    text_decoration(value) {
        if (value == null) {
            return this.style.textDecoration;
        }
        this.style.textDecoration = value;
        return this;
    }
    /**
     * {Text Decoration Color}
     * Specifies the color of the text-decoration. The equivalent of CSS attribute `textDecorationColor`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    text_decoration_color(value) {
        if (value == null) {
            return this.style.textDecorationColor;
        }
        this.style.textDecorationColor = value;
        return this;
    }
    /**
     * {Text Decoration Line}
     * Specifies the type of line in a text-decoration. The equivalent of CSS attribute `textDecorationLine`.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    text_decoration_line(value) {
        if (value == null) {
            return this.style.textDecorationLine;
        }
        this.style.textDecorationLine = value;
        return this;
    }
    /**
     * {Text Decoration Style}
     * Specifies the style of the line in a text decoration, equivalent to the CSS attribute `textDecorationStyle`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    text_decoration_style(value) {
        if (value == null) {
            return this.style.textDecorationStyle;
        }
        this.style.textDecorationStyle = value;
        return this;
    }
    /**
     * {Text Decoration Thickness}
     * Specifies the thickness of the decoration line. The equivalent of CSS attribute `textDecorationThickness`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    text_decoration_thickness(value) {
        if (value == null) {
            return this.style.textDecorationThickness;
        }
        this.style.textDecorationThickness = this.pad_numeric(value);
        return this;
    }
    /**
     * {Text Emphasis}
     * Applies emphasis marks to text, equivalent to the CSS attribute `textEmphasis`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    text_emphasis(value) {
        if (value == null) {
            return this.style.textEmphasis;
        }
        this.style.textEmphasis = value;
        return this;
    }
    /**
     * {Text Indent}
     * Specifies the indentation of the first line in a text-block, equivalent to the CSS `textIndent` property.
     * Retrieves the attribute value when the parameter `value` is `null`.
     * @returns Returns the instance of the element for chaining when a value is set. If `null` is passed, returns the current text indent value.
     * @docs
     */
    text_indent(value) {
        if (value == null) {
            return this.style.textIndent;
        }
        this.style.textIndent = value.toString();
        return this;
    }
    /**
     * {Text Justify}
     * Specifies the justification method used when text-align is "justify". The equivalent of CSS attribute `textJustify`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    text_justify(value) {
        if (value == null) {
            return this.style.textJustify;
        }
        this.style.textJustify = value;
        return this;
    }
    /**
     * {Text Orientation}
     * Defines the orientation of characters in a line, equivalent to the CSS attribute `textOrientation`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    text_orientation(value) {
        if (value == null) {
            return this.style.textOrientation;
        }
        this.style.textOrientation = value;
        return this;
    }
    /**
     * {Text Overflow}
     * Specifies what should happen when text overflows the containing element. The equivalent of CSS attribute `textOverflow`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    text_overflow(value) {
        if (value == null) {
            return this.style.textOverflow;
        }
        this.style.textOverflow = value;
        return this;
    }
    /**
     * {Text Shadow}
     * Adds shadow to text. The equivalent of CSS attribute `textShadow`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    text_shadow(value) {
        if (value == null) {
            return this.style.textShadow;
        }
        this.style.textShadow = value;
        return this;
    }
    /**
     * {Text Transform}
     * Controls the capitalization of text. The equivalent of CSS attribute `textTransform`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    text_transform(value) {
        if (value == null) {
            return this.style.textTransform;
        }
        this.style.textTransform = value;
        return this;
    }
    /**
     * {Text Underline Position}
     * Specifies the position of the underline which is set using the text-decoration property.
     * The equivalent of CSS attribute `textUnderlinePosition`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    text_underline_position(value) {
        if (value == null) {
            return this.style.textUnderlinePosition;
        }
        this.style.textUnderlinePosition = value;
        return this;
    }
    /**
     * {Top}
     * Specifies the top position of a positioned element. The equivalent of CSS attribute `top`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    top(value) {
        if (value == null) {
            return this.style.top;
        }
        this.style.top = this.pad_numeric(value);
        return this;
    }
    /**
     * {Transform}
     * Applies a 2D or 3D transformation to an element. The equivalent of CSS attribute `transform`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Transform Origin}
     * Allows you to change the position on transformed elements. The equivalent of CSS attribute `transformOrigin`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Transform Style}
     * Specifies how nested elements are rendered in 3D space.
     * The equivalent of CSS attribute `transformStyle`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Transition}
     * A shorthand property for all the transition properties. The equivalent of CSS attribute `transition`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Transition Delay}
     * Specifies when the transition effect will start. This corresponds to the CSS attribute `transitionDelay`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute value when parameter `value` is `null`. Otherwise, returns the instance of the element for chaining.
     * @docs
     */
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
    /**
     * {Transition Duration}
     * Specifies how many seconds or milliseconds a transition effect takes to complete.
     * The equivalent of CSS attribute `transitionDuration`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Transition Property}
     * Specifies the name of the CSS property the transition effect is for.
     * The equivalent of CSS attribute `transitionProperty`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Transition Timing Function}
     * Specifies the speed curve of the transition effect.
     * The equivalent of CSS attribute `transitionTimingFunction`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the instance of the element for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Unicode Bidi}
     * Used together with the direction property to set or return whether the text should be overridden to support multiple languages in the same document.
     * The equivalent of CSS attribute `unicodeBidi`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    unicode_bidi(value) {
        if (value == null) {
            return this.style.unicodeBidi ?? "";
        }
        this.style.unicodeBidi = value;
        return this;
    }
    /**
     * {User Select}
     * Specifies whether the text of an element can be selected.
     * The equivalent of CSS attribute `userSelect`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
    /**
     * {Visibility}
     * Specifies whether or not an element is visible. The equivalent of CSS attribute `visibility`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    visibility(value) {
        if (value == null) {
            return this.style.visibility;
        }
        this.style.visibility = value;
        return this;
    }
    /**
     * {White space}
     * Specifies how white-space inside an element is handled. The equivalent of CSS attribute `whiteSpace`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    white_space(value) {
        if (value == null) {
            return this.style.whiteSpace;
        }
        this.style.whiteSpace = value;
        return this;
    }
    /**
     * {Widows}
     * Sets the minimum number of lines that must be left at the top of a page or column.
     * The equivalent of CSS attribute `widows`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    widows(value) {
        if (value == null) {
            return this.style.widows;
        }
        this.style.widows = value.toString();
        return this;
    }
    /**
     * {Word break}
     * Specifies how words should break when reaching the end of a line.
     * The equivalent of CSS attribute `wordBreak`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    word_break(value) {
        if (value == null) {
            return this.style.wordBreak;
        }
        this.style.wordBreak = value;
        return this;
    }
    /**
     * {Word spacing}
     * Increases or decreases the space between words in a text. The equivalent of CSS attribute `wordSpacing`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    word_spacing(value) {
        if (value == null) {
            return this.style.wordSpacing;
        }
        this.style.wordSpacing = this.pad_numeric(value);
        return this;
    }
    /**
     * {Word wrap}
     * Allows long, unbreakable words to be broken and wrap to the next line. The equivalent of CSS attribute `wordWrap`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    word_wrap(value) {
        if (value == null) {
            return this.style.wordWrap;
        }
        this.style.wordWrap = value;
        return this;
    }
    /**
     * {Writing mode}
     * Specifies whether lines of text are laid out horizontally or vertically. The equivalent of CSS attribute `writingMode`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    writing_mode(value) {
        if (value == null) {
            return this.style.writingMode;
        }
        this.style.writingMode = value;
        return this;
    }
    /**
     * {Focusable}
     * Sets or gets the focusable state of the element based on the `tabindex` attribute.
     * @param value Boolean value to set focusable state or null to get current state.
     * @returns When an argument is passed, this function returns the instance of the element for chaining. Otherwise, it returns the current focusable state.
     * @docs
     */
    focusable(value) {
        if (value == null) {
            return super.tabIndex !== -1;
        }
        else {
            super.tabIndex = -1;
            this.style.outline = "none";
        }
        return this;
    }
    /**
     * {Alt}
     * Specifies an alternate text when the original element fails to display. The equivalent of HTML attribute `alt`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    alt(value) {
        // if (value == null) { return this.getAttribute("alt") ?? ""; }
        if (value == null) {
            return this.getAttribute("alt") ?? "";
        }
        this.setAttribute("alt", value);
        // this.setAttribute("alt", value);
        return this;
    }
    /**
     * {Readonly}
     * Specifies that the element is read-only, equivalent to the HTML attribute `readonly`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    readonly(value) {
        if (value == null) {
            return this._try_parse_boolean(this.getAttribute("readonly"));
        }
        if (!value) {
            this.removeAttribute("readonly");
        }
        else {
            this.setAttribute("readonly", value);
        }
        // Had some bugs with code below.
        // if (value == null) { return this._try_parse_boolean((this as any as HTMLInputElement).readOnly); }
        // (this as any as HTMLInputElement).readOnly = value;
        return this;
    }
    /**
     * {Download}
     * Specifies that the target will be downloaded when a user clicks on the hyperlink. The equivalent of HTML attribute `download`.
     * @returns Returns the attribute value when parameter `value` is `null`. Otherwise, returns the instance of the element for chaining.
     * @docs
     */
    download(value) {
        if (value == null) {
            return this.getAttribute("download") ?? "";
        }
        this.setAttribute("download", value);
        return this;
    }
    /**
     * {Accept}
     * Specifies the types of files that the server accepts (only for type="file"). The equivalent of HTML attribute `accept`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    accept(value) {
        if (value == null) {
            return this.getAttribute("accept") ?? "";
        }
        this.setAttribute("accept", value);
        return this;
    }
    /**
     * {Accept Charset}
     * Specifies the character encodings that are to be used for the form submission.
     * The equivalent of HTML attribute `accept_charset`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    accept_charset(value) {
        if (value == null) {
            return super.acceptCharset ?? "";
        }
        super.acceptCharset = value;
        return this;
    }
    /**
     * {Action}
     * Specifies where to send the form-data when a form is submitted.
     * The equivalent of HTML attribute `action`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the attribute value when parameter `value` is `null`. Otherwise, returns the instance of the element for chaining.
     * @docs
     */
    action(value) {
        if (value == null) {
            return this.getAttribute("action") ?? "";
        }
        this.setAttribute("action", value);
        return this;
    }
    /**
     * {Async}
     * Specifies that the script is executed asynchronously (only for external scripts).
     * The equivalent of HTML attribute `async`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    async(value) {
        if (value == null) {
            return this._try_parse_boolean(this.getAttribute("async"));
        }
        this.setAttribute("async", value);
        return this;
    }
    /**
     * {Auto complete}
     * Specifies whether the \<form> or the \<input> element should have autocomplete enabled.
     * The equivalent of HTML attribute `autocomplete`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    auto_complete(value) {
        if (value == null) {
            return super.autocomplete ?? "";
        }
        super.autocomplete = value;
        return this;
    }
    /**
     * {Auto Focus}
     * Specifies that the element should automatically get focus when the page loads.
     * The equivalent of HTML attribute `autofocus`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    auto_focus(value) {
        if (value == null) {
            return super.autofocus ?? false;
        }
        super.autofocus = value;
        return this;
    }
    /**
     * {Auto Play}
     * Specifies that the audio/video will start playing as soon as it is ready.
     * The equivalent of HTML attribute `autoplay`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    auto_play(value) {
        if (value == null) {
            return this._try_parse_boolean(super.autoplay);
        }
        super.autoplay = value;
        return this;
    }
    /**
     * {Charset}
     * Specifies the character encoding, equivalent to the HTML attribute `charset`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    charset(value) {
        if (value == null) {
            return this.getAttribute("charset") ?? "";
        }
        this.setAttribute("charset", value);
        return this;
    }
    /**
     * {Checked}
     * Specifies that an \<input> element should be pre-selected when the page loads (for type="checkbox" or type="radio"). The equivalent of HTML attribute `checked`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    checked(value) {
        // if (value == null) { return this._try_parse_boolean(super.checked); }
        // super.checked = value;
        if (value == null) {
            return this._try_parse_boolean(this.getAttribute("checked"));
        }
        this.setAttribute("checked", value);
        // if (value == null) { return this._try_parse_boolean(this._checked.get.call(this)); }
        // this._checked.set.call(this, value)
        return this;
    }
    /**
     * {Cite}
     * Specifies a URL which explains the quote/deleted/inserted text. The equivalent of HTML attribute `cite`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    cite(value) {
        if (value == null) {
            return this.getAttribute("cite") ?? "";
        }
        this.setAttribute("cite", value);
        return this;
    }
    /**
     * {Cols}
     * Specifies the visible width of a text area, equivalent to the HTML attribute `cols`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining, unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    cols(value) {
        if (value == null) {
            return this._try_parse_float(super.getAttribute("cols"), null);
        }
        this.setAttribute("cols", value);
        return this;
    }
    /**
     * {Colspan}
     * Specifies the number of columns a table cell should span. The equivalent of HTML attribute `colspan`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    colspan(value) {
        if (value == null) {
            return this._try_parse_float(this.getAttribute("cols"), null);
        }
        this.setAttribute("colspan", value);
        return this;
    }
    /**
     * {Content editable}
     * Specifies whether the content of an element is editable or not.
     * The equivalent of HTML attribute `contenteditable`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    content_editable(value) {
        if (value == null) {
            return this._try_parse_boolean(super.contentEditable);
        }
        super.contentEditable = value ? "true" : "false";
        return this;
    }
    /**
     * {Controls}
     * Specifies that audio/video controls should be displayed (such as a play/pause button etc). The equivalent of HTML attribute `controls`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    controls(value) {
        if (value == null) {
            return this._try_parse_boolean(super.getAttribute("controls"));
        }
        this.setAttribute("controls", value);
        return this;
    }
    /**
     * {Coords}
     * Specifies the coordinates of the area, equivalent to the HTML attribute `coords`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining, or the attribute's value if `value` is `null`.
     * @docs
     */
    coords(value) {
        if (value == null) {
            return this.getAttribute("coords") ?? "";
        }
        this.setAttribute("coords", value);
        return this;
    }
    /**
     * {Data}
     * Specifies the URL of the resource to be used by the object.
     * The equivalent of HTML attribute `data`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    data(value) {
        if (value == null) {
            return this.getAttribute("data") ?? "";
        }
        this.setAttribute("data", value);
        return this;
    }
    /**
     * {Datetime}
     * Specifies the date and time. The equivalent of HTML attribute `datetime`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    datetime(value) {
        if (value == null) {
            return super.dateTime ?? "";
        }
        super.dateTime = value;
        return this;
    }
    /**
     * {Default}
     * Specifies that the track is to be enabled if the user's preferences do not indicate that another track would be more appropriate. The equivalent of HTML attribute `default`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    default(value) {
        if (value == null) {
            return this._try_parse_boolean(this.getAttribute("default"));
        }
        this.setAttribute("default", value);
        return this;
    }
    /**
     * {Defer}
     * Specifies that the script is executed when the page has finished parsing (only for external scripts).
     * The equivalent of HTML attribute `defer`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    defer(value) {
        if (value == null) {
            return this._try_parse_boolean(this.getAttribute("defer"));
        }
        this.setAttribute("defer", value);
        return this;
    }
    // @ts-ignore
    dir(value) {
        if (value == null) {
            return this.getAttribute("dir") ?? "";
        }
        this.setAttribute("dir", value);
        return this;
    }
    /**
     * {Dirname}
     * Specifies that the text direction will be submitted. The equivalent of HTML attribute `dirname`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    dirname(value) {
        if (value == null) {
            return this.getAttribute("dirname") ?? "";
        }
        this.setAttribute("dirname", value);
        return this;
    }
    /**
     * {Disabled}
     * Specifies that the specified element/group of elements should be disabled.
     * The equivalent of HTML attribute `disabled`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    disabled(value) {
        // if (value == null) { return this._try_parse_boolean(super.disabled); }
        // super.disabled = value;
        if (value == null) {
            return this._try_parse_boolean(this.getAttribute("disabled"));
        }
        this.setAttribute("disabled", value);
        // if (value == null) { return this._try_parse_boolean(this._disabled.get.call(this)); }
        // this._disabled.set.call(this, value)
        return this;
    }
    // @ts-ignore
    draggable(value) {
        if (value == null) {
            return this._try_parse_boolean(this.getAttribute("draggable"));
        }
        this.setAttribute("draggable", value);
        return this;
    }
    /**
     * {Enctype}
     * Specifies how the form-data should be encoded when submitting it to the server (only for method="post").
     * The equivalent of HTML attribute `enctype`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    enctype(value) {
        if (value == null) {
            return this.getAttribute("enctype") ?? "";
        }
        this.setAttribute("enctype", value);
        return this;
    }
    /**
     * {For}
     * Specifies which form element(s) a label/calculation is bound to.
     * The equivalent of HTML attribute `for`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    for(value) {
        if (value == null) {
            return this.getAttribute("for") ?? "";
        }
        this.setAttribute("for", value);
        return this;
    }
    /**
     * {Form Action}
     * Specifies where to send the form-data when a form is submitted. Only for type="submit".
     * The equivalent of HTML attribute `formaction`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    form_action(value) {
        if (value == null) {
            return super.formAction ?? "";
        }
        super.formAction = value;
        return this;
    }
    /**
     * {Headers}
     * Specifies one or more headers cells a cell is related to.
     * The equivalent of HTML attribute `headers`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    headers(value) {
        if (value == null) {
            return this.getAttribute("headers") ?? "";
        }
        this.setAttribute("headers", value);
        return this;
    }
    /**
     * {High}
     * Specifies the range that is considered to be a high value. The equivalent of HTML attribute `high`.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    high(value) {
        if (value == null) {
            return this.getAttribute("high") ?? "";
        }
        this.setAttribute("high", value);
        return this;
    }
    /**
     * {Href}
     * Specifies the URL of the page the link goes to. The equivalent of HTML attribute `href`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    href(value) {
        // if (value == null) { return super.href ?? ""; }
        // super.href = value;
        if (value == null) {
            return this.getAttribute("href") ?? "";
        }
        this.setAttribute("href", value);
        // if (value == null) { return this._href.get.call(this) ?? ""; }
        // this._href.set.call(this, value);
        return this;
    }
    /**
     * {Href lang}
     * Specifies the language of the linked document. The equivalent of HTML attribute `hreflang`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    href_lang(value) {
        if (value == null) {
            return super.hreflang ?? "";
        }
        super.hreflang = value;
        return this;
    }
    /**
     * {Http Equiv}
     * Provides an HTTP header for the information/value of the content attribute.
     * The equivalent of HTML attribute `http_equiv`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining, unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    http_equiv(value) {
        if (value == null) {
            return super.httpEquiv ?? "";
        }
        super.httpEquiv = value;
        return this;
    }
    // @ts-ignore
    id(value) {
        if (value == null) {
            return super.id ?? "";
        }
        super.id = value;
        // if (value == null) { return this.getAttribute("id") ?? ""; }
        // this.setAttribute("id", value);
        // if (value == null) { return this._id.get.call(this) ?? ""; }
        // this._id.set.call(this, value);
        return this;
    }
    /**
     * {Is Map}
     * Specifies an image as a server-side image map. The equivalent of HTML attribute `ismap`.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    is_map(value) {
        if (value == null) {
            return this._try_parse_boolean(super.isMap);
        }
        super.isMap = value;
        return this;
    }
    /**
     * {Kind}
     * Specifies the kind of text track. The equivalent of HTML attribute `kind`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    kind(value) {
        if (value == null) {
            return this.getAttribute("kind") ?? "";
        }
        this.setAttribute("kind", value);
        return this;
    }
    /**
     * {Label}
     * Specifies the title of the text track, equivalent to the HTML attribute `label`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    label(value) {
        if (value == null) {
            return this.getAttribute("label") ?? "";
        }
        this.setAttribute("label", value);
        return this;
    }
    // @ts-ignore
    lang(value) {
        if (value == null) {
            return this.getAttribute("lang") ?? "";
        }
        this.setAttribute("lang", value);
        return this;
    }
    /**
     * {Loop}
     * Specifies that the audio/video will start over again, every time it is finished.
     * The equivalent of HTML attribute `loop`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    loop(value) {
        if (value == null) {
            return this._try_parse_boolean(this.getAttribute("loop"));
        }
        this.setAttribute("loop", value);
        return this;
    }
    /**
     * {Low}
     * Specifies the range that is considered to be a low value. The equivalent of HTML attribute `low`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining. If `value` is `null`, the attribute's value is returned.
     * @docs
     */
    low(value) {
        if (value == null) {
            return this.getAttribute("low") ?? "";
        }
        this.setAttribute("low", value);
        return this;
    }
    /**
     * {Max}
     * Specifies the maximum value, equivalent to the HTML attribute `max`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, in which case the attribute's value is returned.
     * @docs
     */
    max(value) {
        if (value == null) {
            return this.getAttribute("max") ?? "";
        }
        this.setAttribute("max", value);
        return this;
    }
    /**
     * {Max Length}
     * Specifies the maximum number of characters allowed in an element. The equivalent of HTML attribute `maxlength`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    max_length(value) {
        if (value == null) {
            return this._try_parse_float(super.maxlength, null);
        }
        super.maxlength = value;
        return this;
    }
    /**
     * {Method}
     * Specifies the HTTP method to use when sending form-data. The equivalent of HTML attribute `method`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    method(value) {
        if (value == null) {
            return this.getAttribute("method") ?? "";
        }
        this.setAttribute("method", value);
        return this;
    }
    /**
     * {Min}
     * Specifies a minimum value, equivalent to the HTML attribute `min`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    // @ts-ignore
    min(value) {
        if (value == null) {
            return this.getAttribute("min") ?? "";
        }
        this.setAttribute("min", value);
        return this;
    }
    /**
     * {Multiple}
     * Specifies that a user can enter more than one value. The equivalent of HTML attribute `multiple`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    multiple(value) {
        if (value == null) {
            return this._try_parse_boolean(this.getAttribute("multiple"));
        }
        this.setAttribute("multiple", value);
        return this;
    }
    /**
     * {Muted}
     * Specifies that the audio output of the video should be muted.
     * The equivalent of HTML attribute `muted`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    muted(value) {
        if (value == null) {
            return this._try_parse_boolean(super.getAttribute("muted"));
        }
        this.setAttribute("muted", value);
        return this;
    }
    /**
     * {No validate}
     * Specifies that the form should not be validated when submitted. The equivalent of HTML attribute `novalidate`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    no_validate(value) {
        if (value == null) {
            return this._try_parse_boolean(super.novalidate);
        }
        super.novalidate = value;
        return this;
    }
    /**
     * {Open}
     * Specifies that the details should be visible (open) to the user.
     * The equivalent of HTML attribute `open`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    open(value) {
        if (value == null) {
            return this._try_parse_boolean(super.getAttribute("open"));
        }
        this.setAttribute("open", value);
        return this;
    }
    /**
     * {Optimum}
     * Specifies what value is the optimal value for the gauge. The equivalent of HTML attribute `optimum`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    optimum(value) {
        if (value == null) {
            return this._try_parse_float(super.getAttribute("optimum"), null);
        }
        this.setAttribute("optimum", value);
        return this;
    }
    /**
     * {Pattern}
     * Specifies a regular expression that an \<input> element's value is checked against.
     * The equivalent of HTML attribute `pattern`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    pattern(value) {
        if (value == null) {
            return this.getAttribute("pattern") ?? "";
        }
        this.setAttribute("pattern", value);
        return this;
    }
    /**
     * {Placeholder}
     * Specifies a short hint that describes the expected value of the element.
     * The equivalent of HTML attribute `placeholder`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    placeholder(value) {
        if (value == null) {
            return this.getAttribute("placeholder") ?? "";
        }
        this.setAttribute("placeholder", value);
        return this;
    }
    /**
     * {Poster}
     * Specifies an image to be shown while the video is downloading, or until the user hits the play button.
     * The equivalent of HTML attribute `poster`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    poster(value) {
        if (value == null) {
            return this.getAttribute("poster") ?? "";
        }
        this.setAttribute("poster", value);
        return this;
    }
    /**
     * {Preload}
     * Specifies if and how the author thinks the audio/video should be loaded when the page loads.
     * The equivalent of HTML attribute `preload`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    preload(value) {
        if (value == null) {
            return this.getAttribute("preload") ?? "";
        }
        this.setAttribute("preload", value);
        return this;
    }
    /**
     * {Rel}
     * Specifies the relationship between the current document and the linked document.
     * The equivalent of HTML attribute `rel`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    rel(value) {
        if (value == null) {
            return this.getAttribute("rel") ?? "";
        }
        this.setAttribute("rel", value);
        return this;
    }
    /**
     * {Required}
     * Specifies that the element must be filled out before submitting the form. The equivalent of HTML attribute `required`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object when a value is assigned. Returns the attribute's value when `value` is `null`.
     * @docs
     */
    required(value) {
        if (value == null) {
            return this._try_parse_boolean(this.getAttribute("required"));
        }
        this.setAttribute("required", value);
        return this;
    }
    /**
     * {Reversed}
     * Specifies that the list order should be descending (9,8,7...). This is the equivalent of the HTML attribute `reversed`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    reversed(value) {
        if (value == null) {
            return this._try_parse_boolean(this.getAttribute("reversed"));
        }
        this.setAttribute("reversed", value);
        return this;
    }
    /**
     * {Rows}
     * Specifies the visible number of lines in a text area.
     * The equivalent of HTML attribute `rows`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining, unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    rows(value) {
        if (value == null) {
            return this._try_parse_float(this.getAttribute("rows"), null);
        }
        this.setAttribute("rows", value);
        return this;
    }
    /**
     * {Row Span}
     * Specifies the number of rows a table cell should span.
     * The equivalent of HTML attribute `rowspan`.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`,
     * then the attribute's value is returned.
     * @docs
     */
    row_span(value) {
        if (value == null) {
            return this._try_parse_float(super.rowspan, null);
        }
        super.rowspan = value;
        return this;
    }
    /**
     * {Sandbox}
     * Enables an extra set of restrictions for the content in an \<iframe>. The equivalent of HTML attribute `sandbox`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    sandbox(value) {
        if (value == null) {
            return this.getAttribute("sandbox") ?? "";
        }
        this.setAttribute("sandbox", value);
        return this;
    }
    /**
     * {Scope}
     * Specifies whether a header cell is a header for a column, row, or group of columns or rows.
     * The equivalent of HTML attribute `scope`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scope(value) {
        if (value == null) {
            return this.getAttribute("scope") ?? "";
        }
        this.setAttribute("scope", value);
        return this;
    }
    /**
     * {Selected}
     * Specifies that an option should be pre-selected when the page loads. The equivalent of HTML attribute `selected`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    selected(value) {
        // if (value == null) { return this._try_parse_boolean(super.selected); }
        // super.selected = value;
        if (value == null) {
            return this._try_parse_boolean(this.getAttribute("selected"));
        }
        this.setAttribute("selected", value);
        // if (value == null) { return this._try_parse_boolean(this._selected.get.call(this)); }
        // this._selected.set.call(this, value)
        return this;
    }
    /**
     * {Shape}
     * Specifies the shape of the area. The equivalent of HTML attribute `shape`.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    shape(value) {
        if (value == null) {
            return this.getAttribute("shape") ?? "";
        }
        this.setAttribute("shape", value);
        return this;
    }
    /**
     * {Size}
     * Specifies the width, in characters (for \<input>) or specifies the number of visible options (for \<select>).
     * The equivalent of HTML attribute `size`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the attribute's value when `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    size(value) {
        if (value == null) {
            return this._try_parse_float(super.getAttribute("size"), null);
        }
        this.setAttribute("size", value);
        return this;
    }
    /**
     * {Sizes}
     * Specifies the size of the linked resource. The equivalent of HTML attribute `sizes`.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    sizes(value) {
        if (value == null) {
            return this.getAttribute("sizes") ?? "";
        }
        this.setAttribute("sizes", value);
        return this;
    }
    /**
     * {Span}
     * Specifies the number of columns to span. The equivalent of HTML attribute `span`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    span(value) {
        if (value == null) {
            return this._try_parse_float(super.getAttribute("span"), null);
        }
        this.setAttribute("span", value);
        return this;
    }
    /**
     * {Spell Check}
     * Specifies whether the element is to have its spelling and grammar checked or not.
     * The equivalent of HTML attribute `spellcheck`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    spell_check(value) {
        if (value == null) {
            return this._try_parse_boolean(super.spellcheck);
        }
        this.spellcheck = value;
        return this;
    }
    // @ts-ignore
    src(value, set_aspect_ratio = false) {
        // if (value == null) { return this._src.get.call(this) ?? ""; }
        // this._src.set.call(this, value);
        if (value == null) {
            return this.getAttribute("src") ?? "";
        }
        // console.log("Set aspect ratio?", set_aspect_ratio, "from src", value)
        if (set_aspect_ratio) {
            const aspect_ratio = Statics.aspect_ratio(value);
            if (aspect_ratio != null) {
                // console.log("Set aspect ratio", aspect_ratio, "from src", value)
                this.aspect_ratio(aspect_ratio);
            }
            // else {
            //     console.log("Unknown aspect ratio from src", value)
            // }
        }
        this.setAttribute("src", value);
        return this;
    }
    /**
     * {Src doc}
     * Specifies the HTML content of the page to show in the \<iframe>. The equivalent of HTML attribute `srcdoc`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    src_doc(value) {
        if (value == null) {
            return super.srcdoc ?? "";
        }
        super.srcdoc = value;
        return this;
    }
    /**
     * {Src lang}
     * Specifies the language of the track text data (required if kind="subtitles"). The equivalent of HTML attribute `srclang`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    src_lang(value) {
        if (value == null) {
            return super.srclang ?? "";
        }
        super.srclang = value;
        return this;
    }
    /**
     * {Rrsrc set}
     * Specifies the URL of the image to use in different situations.
     * The equivalent of HTML attribute `srcset`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    rrsrc_set(value) {
        if (value == null) {
            return super.srcset ?? "";
        }
        super.srcset = value;
        return this;
    }
    /**
     * {Start}
     * Specifies the start value of an ordered list. The equivalent of HTML attribute `start`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    start(value) {
        if (value == null) {
            return this._try_parse_float(super.getAttribute("start"), null);
        }
        this.setAttribute("start", value);
        return this;
    }
    /**
     * {Step}
     * Specifies the legal number intervals for an input field. The equivalent of HTML attribute `step`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    step(value) {
        if (value == null) {
            return this.getAttribute("step") ?? "";
        }
        this.setAttribute("step", value);
        return this;
    }
    /**
     * {Tab index}
     * Specifies the tabbing order of an element, equivalent to the HTML attribute `tabindex`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, in which case the attribute's value is returned.
     * @docs
     */
    tab_index(value) {
        if (value == null) {
            return this._try_parse_float(super.tabIndex, null);
        }
        super.tabIndex = value;
        return this;
    }
    // @ts-ignore
    target(value) {
        if (value == null) {
            return this.getAttribute("target") ?? "";
        }
        this.setAttribute("target", value);
        return this;
    }
    // @ts-ignore
    title(value) {
        if (value == null) {
            return this.getAttribute("title") ?? "";
        }
        this.setAttribute("title", value);
        return this;
    }
    /**
     * {Type}
     * Specifies the type of element, equivalent to the HTML attribute `type`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    type(value) {
        if (value == null) {
            return this.getAttribute("type") ?? "";
        }
        this.setAttribute("type", value);
        return this;
    }
    /**
     * {Use Map}
     * Specifies an image as a client-side image map, equivalent to the HTML attribute `usemap`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    use_map(value) {
        if (value == null) {
            return super.useMap ?? "";
        }
        super.useMap = value;
        return this;
    }
    /**
     * {Value}
     * Specifies the value of the element, equivalent to the HTML attribute `value`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    value(value) {
        /**
        * @warning
        * The actual implementation of for inputs is overriden
        * in {@link VInputElement.value} and {@link VTextAreaElement.value}, so this method is not used in those classes.
        * Otherwise the `value` attribute cant be retrieved correctly.
        */
        if (value == null)
            return this.getAttribute("value") ?? "";
        this.setAttribute("value", value);
        return this;
    }
    /**
     * {On Blur}
     * Fires the moment that the element loses focus, similar to the HTML attribute `onblur`.
     * The first parameter of the callback is the `VElement` object.
     * @param callback The function to call when the element loses focus.
     * @returns Returns the `VElement` object unless the parameter `callback` is `null`,
     * then the attribute's value is returned.
     * @docs
     */
    on_blur(callback) {
        if (callback == null) {
            return this.onblur ?? undefined;
        }
        const e = this;
        this.onblur = (t) => callback(e, t);
        return this;
    }
    /**
     * {On Change}
     * Fires the moment when the value of the element is changed. The equivalent of HTML attribute `onchange`. Returns the attribute value when parameter `value` is `null`.
     * @param callback The function to call when the value changes, receiving the `VElement` object and the event as parameters.
     * @returns Returns the `VElement` object for chaining. If `callback` is `null`, returns the current `onchange` value.
     * @docs
     */
    on_change(callback) {
        if (callback == null) {
            return this.onchange ?? undefined;
        }
        const e = this;
        this.onchange = (t) => callback(e, t);
        return this;
    }
    /**
     * {On Focus}
     * Fires the moment when the element gets focus. This is the equivalent of the HTML attribute `onfocus`.
     * The first parameter of the callback is the `VElement` object.
     * @param callback The function to be called when the element gets focus.
     * @returns Returns the `VElement` object unless the parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_focus(callback) {
        if (callback == null) {
            return this.onfocus ?? undefined;
        }
        const e = this;
        this.onfocus = (t) => callback(e, t);
        return this;
    }
    /**
     * {On Input}
     * Script to be run when an element gets user input.
     * The equivalent of HTML attribute `oninput`.
     * @param callback The function to call when user input is detected.
     * @returns Returns the `VElement` object for chaining, or the attribute's value if the parameter is `null`.
     * @docs
     */
    on_input(callback) {
        if (callback == null) {
            return this.oninput ?? undefined;
        }
        const e = this;
        this.oninput = (t) => callback(e, t);
        return this;
    }
    /**
     * {On Input}
     * Script to be run before an element gets user input. The equivalent of HTML attribute `onbeforeinput`.
     * @param callback The function to execute before user input. Receives the `VElement` object and the event as parameters.
     * @returns r: Returns the `VElement` object for chaining. If `callback` is `null`, returns the current value of `onbeforeinput`.
     * @docs
     */
    on_before_input(callback) {
        if (callback == null) {
            return this.onbeforeinput ?? undefined;
        }
        const e = this;
        this.onbeforeinput = (t) => callback(e, t);
        return this;
    }
    /**
     * {On Invalid}
     * Script to be run when an element is invalid. The equivalent of HTML attribute `oninvalid`.
     * The first parameter of the callback is the `VElement` object.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_invalid(callback) {
        if (callback == null) {
            return this.oninvalid ?? undefined;
        }
        const e = this;
        this.oninvalid = (t) => callback(e, t);
        return this;
    }
    /**
     * {On Reset}
     * Fires when the Reset button in a form is clicked. The equivalent of HTML attribute `onreset`.
     * The first parameter of the callback is the `VElement` object. Returns the attribute value when parameter `value` is `null`.
     * @param callback The function to call when the Reset button is clicked.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_reset(callback) {
        if (callback == null) {
            return this.onreset ?? undefined;
        }
        const e = this;
        this.onreset = (t) => callback(e, t);
        return this;
    }
    /**
     * {On Select}
     * Fires after some text has been selected in an element. The equivalent of HTML attribute `onselect`. Returns the attribute value when parameter `value` is `null`.
     * @param callback The callback function to execute when text is selected. It receives the `VElement` object as the first parameter.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_select(callback) {
        if (callback == null) {
            return this.onselect ?? undefined;
        }
        const e = this;
        this.onselect = (t) => callback(e, t);
        return this;
    }
    /**
     * {On Submit}
     * Fires when a form is submitted, similar to the HTML attribute `onsubmit`.
     * The first parameter of the callback is the `VElement` object.
     * @param callback The callback function to execute on form submission.
     * @returns Returns the instance of the element for chaining. If `callback` is null, returns the current `onsubmit` attribute value.
     * @docs
     */
    on_submit(callback) {
        if (callback == null) {
            return this.onsubmit ?? undefined;
        }
        const e = this;
        this.onsubmit = (t) => callback(e, t);
        return this;
    }
    /**
     * {On Key Down}
     * Fires when a user is pressing a key. The equivalent of HTML attribute `onkeydown`.
     * The first parameter of the callback is the `VElement` object.
     * @param callback The callback function to execute when the key is pressed.
     * @returns Returns the `VElement` object for chaining. If the parameter `callback` is `null`, the current attribute's value is returned.
     * @docs
     */
    on_key_down(callback) {
        if (callback == null) {
            return this.onkeydown ?? undefined;
        }
        const e = this;
        this.onkeydown = (t) => callback(e, t);
        return this;
    }
    /**
     * {On Key Press}
     * Fires when a user presses a key, similar to the HTML `onkeypress` attribute.
     * The first parameter of the callback is the `VElement` object, allowing for dynamic handling of key events.
     * @param callback The function to call when a key is pressed. Receives the `VElement` and event as parameters.
     * @returns Returns the `VElement` object for chaining. If `callback` is `null`, the current attribute value is returned.
     * @docs
     */
    on_key_press(callback) {
        if (callback == null) {
            return this.onkeypress ?? undefined;
        }
        const e = this;
        this.onkeypress = (t) => callback(e, t);
        return this;
    }
    /**
     * {On Key Up}
     * Fires when a user releases a key, similar to the HTML attribute `onkeyup`.
     * The first parameter of the callback is the `VElement` object.
     * @param callback The function to call when the key is released.
     * Leave `null` to retrieve the current attribute's value.
     * @returns Returns the `VElement` object for chaining, unless `callback` is `null`,
     * in which case the current attribute's value is returned.
     * @docs
     */
    on_key_up(callback) {
        if (callback == null) {
            return this.onkeyup ?? undefined;
        }
        const e = this;
        this.onkeyup = (t) => callback(e, t);
        return this;
    }
    /**
     * {On dbl click}
     * Fires on a mouse double-click on the element. The equivalent of HTML attribute `ondblclick`.
     * The first parameter of the callback is the `VElement` object.
     * @param callback The function to execute on double-click. Receives the `VElement` and the event as parameters.
     * @returns Returns the `VElement` object for chaining. If `callback` is null, returns the current attribute value.
     * @docs
     */
    on_dbl_click(callback) {
        if (callback == null) {
            return this.ondblclick ?? undefined;
        }
        const e = this;
        this.ondblclick = (t) => callback(e, t);
        return this;
    }
    /**
     * {On Mouse Down}
     * Fires when a mouse button is pressed down on an element. The equivalent of HTML attribute `onmousedown`.
     * The first parameter of the callback is the `VElement` object. Returns the attribute value when parameter `value` is `null`.
     * @param callback The function to execute when the mouse button is pressed down.
     * @returns Returns the `VElement` object for chaining. If the parameter `callback` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_mouse_down(callback) {
        if (callback == null) {
            return this.onmousedown ?? undefined;
        }
        const e = this;
        this.onmousedown = (t) => callback(e, t);
        return this;
    }
    /**
     * {On Mouse Move}
     * Fires when the mouse pointer is moving while it is over an element.
     * The equivalent of HTML attribute `onmousemove`. Invokes the callback with the element and event.
     * @param callback The function to call when the mouse moves over the element.
     * @returns Returns the instance of the element for chaining. Unless parameter `callback` is `null`, then the event is returned.
     * @docs
     */
    on_mouse_move(callback) {
        if (callback == null) {
            return this.onmousemove ?? undefined;
        }
        const e = this;
        this.onmousemove = (t) => callback(e, t);
        return this;
    }
    /**
     * {On mouse out}
     * Fires when the mouse pointer moves out of an element. The equivalent of HTML attribute `onmouseout`.
     * The first parameter of the callback is the `VElement` object.
     * @param callback The callback function to execute when the mouse moves out.
     * @returns Returns the `VElement` object for chaining, or the attribute's value if the callback is `null`.
     * @docs
     */
    on_mouse_out(callback) {
        if (callback == null) {
            return this.onmouseout ?? undefined;
        }
        const e = this;
        this.onmouseout = (t) => {
            if (!this._is_button_disabled) {
                callback(e, t);
            }
        };
        return this;
    }
    /**
     * {On Mouse Over}
     * Fires when the mouse pointer moves over an element, similar to the HTML `onmouseover` attribute.
     * @param callback The callback function to execute when the mouse is over the element.
     * @returns Returns the instance of the element for chaining. If `callback` is null, returns the current `onmouseover` attribute value.
     * @docs
     */
    on_mouse_over(callback) {
        if (callback == null) {
            return this.onmouseover ?? undefined;
        }
        const e = this;
        this.onmouseover = (t) => {
            if (!this._is_button_disabled) {
                callback(e, t);
            }
        };
        return this;
    }
    /**
     * {On Mouse Up}
     * Fires when a mouse button is released over an element. The equivalent of HTML attribute `onmouseup`.
     * The first parameter of the callback is the `VElement` object. Returns the attribute value when parameter `value` is `null`.
     * @param callback The callback function to execute when the mouse button is released.
     * @returns Returns the `VElement` object for chaining. If `callback` is `null`, returns the current `onmouseup` value.
     * @docs
     */
    on_mouse_up(callback) {
        if (callback == null) {
            return this.onmouseup ?? undefined;
        }
        const e = this;
        this.onmouseup = (t) => callback(e, t);
        return this;
    }
    /**
     * {On Wheel}
     * Fires when the mouse wheel rolls up or down over an element. The equivalent of HTML attribute `onwheel`.
     * The first parameter of the callback is the `VElement` object.
     * @param callback The callback function to execute on wheel event.
     * @returns Returns the instance of the element for chaining. Unless parameter `callback` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_wheel(callback) {
        if (callback == null) {
            return this.onwheel ?? undefined;
        }
        const e = this;
        this.onwheel = (t) => callback(e, t);
        return this;
    }
    /**
     * {On Drag}
     * Script to be run when an element is dragged. The equivalent of HTML attribute `ondrag`.
     * The first parameter of the callback is the `VElement` object. Returns the attribute value when parameter `value` is `null`.
     * @param callback The callback function to execute when the element is dragged.
     * @returns Returns the instance of the element for chaining unless the parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_drag(callback) {
        if (callback == null) {
            return this.ondrag ?? undefined;
        }
        const e = this;
        this.ondrag = (t) => callback(e, t);
        return this;
    }
    /**
     * {On Drag End}
     * Script to be run at the end of a drag operation. The equivalent of HTML attribute `ondragend`.
     * The first parameter of the callback is the `VElement` object.
     * @param callback The callback function to execute at the end of the drag operation.
     * @returns Returns the `VElement` object unless the parameter `value` is `null`, in which case the attribute's value is returned.
     * @docs
     */
    on_drag_end(callback) {
        if (callback == null) {
            return this.ondragend ?? undefined;
        }
        const e = this;
        this.ondragend = (t) => callback(e, t);
        return this;
    }
    /**
     * {On Drag Enter}
     * Script to be run when an element has been dragged to a valid drop target.
     * The equivalent of HTML attribute `ondragenter`.
     * The first parameter of the callback is the `VElement` object.
     * @param callback The function to execute when the drag enters the target.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_drag_enter(callback) {
        if (callback == null) {
            return this.ondragenter ?? undefined;
        }
        const e = this;
        this.ondragenter = (t) => callback(e, t);
        return this;
    }
    /**
     * {On drag leave}
     * Script to be run when an element leaves a valid drop target.
     * The equivalent of HTML attribute `ondragleave`.
     * The first parameter of the callback is the `VElement` object.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_drag_leave(callback) {
        if (callback == null) {
            return this.ondragleave ?? undefined;
        }
        const e = this;
        this.ondragleave = (t) => callback(e, t);
        return this;
    }
    /**
     * {On drag over}
     * Script to be run when an element is being dragged over a valid drop target.
     * The equivalent of HTML attribute `ondragover`.
     * @param callback The function to execute when the drag over event occurs.
     * @returns Returns the `VElement` object. Unless parameter `callback` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_drag_over(callback) {
        if (callback == null) {
            return this.ondragover ?? undefined;
        }
        const e = this;
        this.ondragover = (t) => callback(e, t);
        return this;
    }
    /**
     * {On Drag Start}
     * Script to be run at the start of a drag operation. The equivalent of HTML attribute `ondragstart`.
     * The first parameter of the callback is the `VElement` object.
     * @param callback The function to call when the drag starts.
     * @returns Returns the `VElement` object for chaining unless parameter `callback` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_drag_start(callback) {
        if (callback == null) {
            return this.ondragstart ?? undefined;
        }
        const e = this;
        this.ondragstart = (t) => callback(e, t);
        return this;
    }
    /**
     * {On drop}
     * Script to be run when dragged element is being dropped. The equivalent of HTML attribute `ondrop`. The first parameter of the callback is the `VElement` object. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_drop(callback) {
        if (callback == null) {
            return this.ondrop ?? undefined;
        }
        const e = this;
        this.ondrop = (t) => callback(e, t);
        return this;
    }
    /**
     * {On Copy}
     * Fires when the user copies the content of an element. The equivalent of HTML attribute `oncopy`.
     * The first parameter of the callback is the `VElement` object.
     * @param callback The function to be called when the copy event occurs.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_copy(callback) {
        if (callback == null) {
            return this.oncopy ?? undefined;
        }
        const e = this;
        this.oncopy = (t) => callback(e, t);
        return this;
    }
    /**
     * {On Cut}
     * Fires when the user cuts the content of an element, equivalent to the HTML attribute `oncut`.
     * The first parameter of the callback is the `VElement` object.
     * @param callback The function to call when the cut event occurs.
     * @returns Returns the `VElement` object unless the parameter `callback` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_cut(callback) {
        if (callback == null) {
            return this.oncut ?? undefined;
        }
        const e = this;
        this.oncut = (t) => callback(e, t);
        return this;
    }
    /**
     * {On Paste}
     * Fires when the user pastes some content in an element. The equivalent of HTML attribute `onpaste`.
     * The first parameter of the callback is the `VElement` object. Returns the attribute value when parameter `value` is `null`.
     * @param callback The function to call when the paste event occurs.
     * @returns Returns the `VElement` object for chaining. If `callback` is `null`, returns the current `onpaste` attribute value.
     * @docs
     */
    on_paste(callback) {
        if (callback == null) {
            return this.onpaste ?? undefined;
        }
        const e = this;
        this.onpaste = (t) => callback(e, t);
        return this;
    }
    /**
     * {On Abort}
     * Script to be run on abort, equivalent to the HTML attribute `onabort`.
     * The first parameter of the callback is the `VElement` object.
     * @param callback The callback function to execute on abort event.
     * @returns Returns the instance of the element for chaining. Unless parameter `callback` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_abort(callback) {
        if (callback == null) {
            return this.onabort ?? undefined;
        }
        const e = this;
        this.onabort = (t) => callback(e, t);
        return this;
    }
    /**
     * {On Can Play}
     * Script to be run when a file is ready to start playing (when it has buffered enough to begin).
     * The equivalent of HTML attribute `oncanplay`.
     * @param callback The callback function to execute when the event occurs.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_canplay(callback) {
        if (callback == null) {
            return this.oncanplay ?? undefined;
        }
        const e = this;
        this.oncanplay = (t) => callback(e, t);
        return this;
    }
    /**
     * {On Can Play Through}
     * Script to be run when a file can be played all the way to the end without pausing for buffering.
     * The equivalent of HTML attribute `oncanplaythrough`.
     * @param callback The callback function to execute when the event occurs.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_canplay_through(callback) {
        if (callback == null) {
            return this.oncanplaythrough ?? undefined;
        }
        const e = this;
        this.oncanplaythrough = (t) => callback(e, t);
        return this;
    }
    /**
     * {On Cue Change}
     * Script to be run when the cue changes in a \<track> element.
     * The equivalent of HTML attribute `oncuechange`.
     * The first parameter of the callback is the `VElement` object.
     * @param callback The function to call when the cue changes.
     * @returns Returns the instance of the element for chaining.
     * Unless the parameter `callback` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_cue_change(callback) {
        if (callback == null) {
            return this.oncuechange ?? undefined;
        }
        const e = this;
        this.oncuechange = (t) => callback(e, t);
        return this;
    }
    /**
     * {On Duration Change}
     * Script to be run when the length of the media changes. The equivalent of HTML attribute `ondurationchange`.
     * The first parameter of the callback is the `VElement` object.
     * @param callback The callback function to execute on duration change.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_duration_change(callback) {
        if (callback == null) {
            return this.ondurationchange ?? undefined;
        }
        const e = this;
        this.ondurationchange = (t) => callback(e, t);
        return this;
    }
    /**
     * {On Emptied}
     * Script to be run when something bad happens and the file is suddenly unavailable (like unexpectedly disconnects).
     * The equivalent of HTML attribute `onemptied`. The first parameter of the callback is the `VElement` object.
     * @param callback The callback function to execute when the event occurs.
     * @returns r: Returns the `VElement` object. Unless parameter `callback` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_emptied(callback) {
        if (callback == null) {
            return this.onemptied ?? undefined;
        }
        const e = this;
        this.onemptied = (t) => callback(e, t);
        return this;
    }
    /**
     * {On ended}
     * Script to be run when the media has reach the end (a useful event for messages like "thanks for listening").
     * The equivalent of HTML attribute `onended`.
     * @param callback The function to call when the media ends. Leave `null` to retrieve the current callback.
     * @returns Returns the instance of the element for chaining. Unless parameter `callback` is `null`, then the current callback function is returned.
     * @docs
     */
    on_ended(callback) {
        if (callback == null) {
            return this.onended ?? undefined;
        }
        const e = this;
        this.onended = (t) => callback(e, t);
        return this;
    }
    /**
     * {On Error}
     * Script to be run when an error occurs while loading the file, similar to HTML's `onerror` attribute.
     * The first parameter of the callback is the `VElement` object. Returns the attribute value if `value` is `null`.
     * @param callback The callback function to execute on error. It receives the `VElement` object and the error event.
     * @returns Returns the instance of the element for chaining, unless `callback` is `null`, then the current `onerror` attribute value is returned.
     * @docs
     */
    on_error(callback) {
        if (callback == null) {
            return this.onerror ?? undefined;
        }
        const e = this;
        this.onerror = (t) => callback(e, t);
        return this;
    }
    /**
     * {On Loaded Data}
     * Script to be run when media data is loaded. The equivalent of HTML attribute `onloadeddata`.
     * @param callback The callback function that receives the `VElement` object and the event.
     * @returns Returns the `VElement` object unless parameter `callback` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_loaded_data(callback) {
        if (callback == null) {
            return this.onloadeddata ?? undefined;
        }
        const e = this;
        this.onloadeddata = (t) => callback(e, t);
        return this;
    }
    /**
     * {On loaded metadata}
     * Script to be run when meta data (like dimensions and duration) are loaded.
     * The equivalent of HTML attribute `onloadedmetadata`.
     * The first parameter of the callback is the `VElement` object.
     * @param callback A function to be executed when metadata is loaded.
     * @returns Returns the `VElement` object. Unless parameter `callback` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_loaded_metadata(callback) {
        if (callback == null) {
            return this.onloadedmetadata ?? undefined;
        }
        const e = this;
        this.onloadedmetadata = (t) => callback(e, t);
        return this;
    }
    /**
     * {On load start}
     * Script to be run just as the file begins to load before anything is actually loaded.
     * The equivalent of HTML attribute `onloadstart`.
     * The first parameter of the callback is the `VElement` object.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_load_start(callback) {
        if (callback == null) {
            return this.onloadstart ?? undefined;
        }
        const e = this;
        this.onloadstart = (t) => callback(e, t);
        return this;
    }
    /**
     * {On Pause}
     * Script to be run when the media is paused either by the user or programmatically. The equivalent of HTML attribute `onpause`.
     * @param callback The callback function to execute when the media is paused. Leave `null` to retrieve the current attribute's value.
     * @returns Returns the instance of the element for chaining unless the parameter is `null`, then the current attribute's value is returned.
     * @docs
     */
    on_pause(callback) {
        if (callback == null) {
            return this.onpause ?? undefined;
        }
        const e = this;
        this.onpause = (t) => callback(e, t);
        return this;
    }
    /**
     * {On Play}
     * Script to be run when the media is ready to start playing. The equivalent of HTML attribute `onplay`.
     * The first parameter of the callback is the `VElement` object. Returns the attribute value when parameter `value` is `null`.
     * @param callback The function to be executed when the media starts playing.
     * @returns Returns the `VElement` object. Unless parameter `callback` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_play(callback) {
        if (callback == null) {
            return this.onplay ?? undefined;
        }
        const e = this;
        this.onplay = (t) => callback(e, t);
        return this;
    }
    /**
     * {On Playing}
     * Script to be run when the media actually has started playing. This is the equivalent of the HTML attribute `onplaying`.
     * @param callback The function to execute when the media starts playing. It receives the `VElement` object as the first parameter.
     * @returns Returns the instance of the element for chaining. If `null` is passed, it returns the current `onplaying` callback.
     * @docs
     */
    on_playing(callback) {
        if (callback == null) {
            return this.onplaying ?? undefined;
        }
        const e = this;
        this.onplaying = (t) => callback(e, t);
        return this;
    }
    /**
     * {Onprogress}
     * Script to be run when the browser is in the process of getting the media data.
     * The equivalent of HTML attribute `onprogress`. Returns the attribute value when parameter `value` is `null`.
     * @param callback The function to be executed when the media data is being loaded.
     * @returns Returns the `VElement` object. Unless parameter `callback` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_progress(callback) {
        if (callback == null) {
            return this.onprogress ?? undefined;
        }
        const e = this;
        this.onprogress = (t) => callback(e, t);
        return this;
    }
    /**
     * {On Rate Change}
     * Script to be run each time the playback rate changes (like when a user switches to a slow motion or fast forward mode).
     * The equivalent of HTML attribute `onratechange`. Returns the attribute value when parameter `value` is `null`.
     * @param callback The callback function to execute on rate change.
     * @returns Returns the `VElement` object unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_rate_change(callback) {
        if (callback == null) {
            return this.onratechange ?? undefined;
        }
        const e = this;
        this.onratechange = (t) => callback(e, t);
        return this;
    }
    /**
     * {On seeked}
     * Script to be run when the seeking attribute is set to false indicating that seeking has ended.
     * The equivalent of HTML attribute `onseeked`.
     * @param callback The callback function to execute when seeking ends.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_seeked(callback) {
        if (callback == null) {
            return this.onseeked ?? undefined;
        }
        const e = this;
        this.onseeked = (t) => callback(e, t);
        return this;
    }
    /**
     * {On Seeking}
     * Script to be run when the seeking attribute is set to true indicating that seeking is active.
     * The equivalent of HTML attribute `onseeking`.
     * @param callback The callback function to execute when seeking occurs.
     * @returns Returns the instance of the element for chaining. Unless parameter `callback` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_seeking(callback) {
        if (callback == null) {
            return this.onseeking ?? undefined;
        }
        const e = this;
        this.onseeking = (t) => callback(e, t);
        return this;
    }
    /**
     * {On Stalled}
     * Script to be run when the browser is unable to fetch the media data for whatever reason. This is the equivalent of the HTML attribute `onstalled`. The first parameter of the callback is the `VElement` object.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_stalled(callback) {
        if (callback == null) {
            return this.onstalled ?? undefined;
        }
        const e = this;
        this.onstalled = (t) => callback(e, t);
        return this;
    }
    /**
     * {On Suspend}
     * Script to be run when fetching the media data is stopped before it is completely loaded for whatever reason. The equivalent of HTML attribute `onsuspend`.
     * @param callback The function to be executed when the suspend event occurs. The first parameter of the callback is the `VElement` object.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_suspend(callback) {
        if (callback == null) {
            return this.onsuspend ?? undefined;
        }
        const e = this;
        this.onsuspend = (t) => callback(e, t);
        return this;
    }
    /**
     * {On Time Update}
     * Script to be run when the playing position has changed (like when the user fast forwards to a different point in the media). The equivalent of HTML attribute `ontimeupdate`.
     * @param callback The callback function to execute when the time updates. The first parameter of the callback is the `VElement` object.
     * @returns Returns the `VElement` object. Unless parameter `callback` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_time_update(callback) {
        if (callback == null) {
            return this.ontimeupdate ?? undefined;
        }
        const e = this;
        this.ontimeupdate = (t) => callback(e, t);
        return this;
    }
    /**
     * {On Volume Change}
     * Script to be run each time the volume is changed which includes setting the volume to "mute".
     * The equivalent of HTML attribute `onvolumechange`. The first parameter of the callback is the `VElement` object.
     * @param callback The callback function to execute on volume change.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_volume_change(callback) {
        if (callback == null) {
            return this.onvolumechange ?? undefined;
        }
        const e = this;
        this.onvolumechange = (t) => callback(e, t);
        return this;
    }
    /**
     * {On Waiting}
     * Script to be run when the media has paused but is expected to resume (like when the media pauses to buffer more data). The equivalent of HTML attribute `onwaiting`.
     * @param callback The callback function to execute when the media is waiting.
     * @returns Returns the `VElement` object unless parameter `callback` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_waiting(callback) {
        if (callback == null) {
            return this.onwaiting ?? undefined;
        }
        const e = this;
        this.onwaiting = (t) => callback(e, t);
        return this;
    }
    /**
     * {On toggle}
     * Fires when the user opens or closes the \<details> element.
     * The equivalent of HTML attribute `ontoggle`.
     * The first parameter of the callback is the `VElement` object.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_toggle(callback) {
        if (callback == null) {
            return this.ontoggle ?? undefined;
        }
        const e = this;
        this.ontoggle = (t) => callback(e, t);
        return this;
    }
}
;
// @test
// new VElement().myexect(); // should throw error.
// Test.
export function isVElement(type) {
    return type.__is_velement ?? false;
}
export function is_velement(type) {
    return type.__is_velement ?? false;
}
// ------------------------------------------------------------------------------------------------
// Wrapper functions.
// Mixin function.
const mixed_classes = [];
function mixin(derived, opts) {
    Object.getOwnPropertyNames(VElement.prototype).forEach((name) => {
        if (name !== "constructor" && (!opts?.ignore_methods || !opts.ignore_methods.includes(name))) {
            const descriptor = Object.getOwnPropertyDescriptor(VElement.prototype, name);
            if (descriptor) {
                Object.defineProperty(derived.prototype, name, descriptor);
            }
        }
    });
    // Object.assign(derived.prototype, VElement.prototype);
    // Get existing properties of the derived class to preserve overrides
    // const existingProps = Object.getOwnPropertyNames(derived.prototype);
    // Object.getOwnPropertyNames(VElement.prototype).forEach((name) => {
    //     if (name !== "constructor" && !existingProps.includes(name)) {
    //         derived.prototype[name] = VElement.prototype[name];
    //         // Object.defineProperty(
    //         //     derived.prototype,
    //         //     name,
    //         //     Object.getOwnPropertyDescriptor(VElement.prototype, name)!
    //         // );
    //     }
    // });
    // Object.getOwnPropertyNames(VElement.prototype).forEach(name => {
    //     if (name !== 'constructor') {
    //         derived.prototype[name] = VElement.prototype[name];
    //     }
    // });
    // Copy specific props.
    derived.is = VElement.is;
    // No static props need to be copied.
    // Object.getOwnPropertyNames(VElement).forEach(name => {
    //     if (
    //         name !== 'name' &&
    //         name !== 'length' &&
    //         name !== 'prototype' &&
    //         name !== 'element_tag' &&
    //         name !== 'default_style' &&
    //         name !== 'default_events' &&
    //         name !== 'default_attributes'
    //     ) {
    //         derived[name] = VElement[name];
    //     }
    // });
    mixed_classes.push(derived);
}
// Extend VElements.
export function extend(extension) {
    Object.assign(VElement.prototype, extension);
    mixed_classes.forEach(instance => {
        Object.assign(instance.prototype, extension);
    });
}
;
// Post process velement.
function postprocess(type, opts) {
    mixin(type, opts?.mixin);
    register_element(type);
}
// Create a constructor wrapper.
export function wrapper(constructor) {
    return (...args) => new constructor(...args);
}
// Create a shared null element mainly for typescript types.
export function create_null(target_class) {
    let instance;
    return () => {
        if (instance === undefined) {
            instance = new target_class();
        }
        return instance;
    };
}
// type _SafeVBaseElement = typeof VElement & typeof HTMLElement & {
//    new(): VElement & HTMLElement & VElementExtensions,
//    prototype: VElement & HTMLElement & VElementExtensions,
// }
// ---
// generated by dev/automate_types.js:
// Base class VHTMLElement derived from HTMLElement.
// @ts-ignore
export class VHTMLElement extends HTMLElement {
    static element_name = "VHTMLElement";
    constructor(args = {}) {
        super();
        args.derived ??= VHTMLElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VHTMLElement extends HTMLElement, VElement, VElementExtensions {};
postprocess(VHTMLElement);
export const VHTML = wrapper(VHTMLElement);
export const NullVHTML = create_null(VHTMLElement);
// Base class VAnchorElement derived from HTMLAnchorElement.
// @ts-ignore
export class VAnchorElement extends HTMLAnchorElement {
    static element_name = "VAnchorElement";
    static element_tag = "a";
    constructor(args = {}) {
        super();
        args.derived ??= VAnchorElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VAnchorElement extends HTMLAnchorElement, VElement, VElementExtensions {};
postprocess(VAnchorElement);
export const VAnchor = wrapper(VAnchorElement);
export const NullVAnchor = create_null(VAnchorElement);
// Base class VAreaElement derived from HTMLAreaElement.
// @ts-ignore
export class VAreaElement extends HTMLAreaElement {
    static element_name = "VAreaElement";
    static element_tag = "area";
    constructor(args = {}) {
        super();
        args.derived ??= VAreaElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VAreaElement extends HTMLAreaElement, VElement, VElementExtensions {};
postprocess(VAreaElement);
export const VArea = wrapper(VAreaElement);
export const NullVArea = create_null(VAreaElement);
// Base class VAudioElement derived from HTMLAudioElement.
// @ts-ignore
export class VAudioElement extends HTMLAudioElement {
    static element_name = "VAudioElement";
    static element_tag = "audio";
    constructor(args = {}) {
        super();
        args.derived ??= VAudioElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VAudioElement extends HTMLAudioElement, VElement, VElementExtensions {};
postprocess(VAudioElement);
export const VAudio = wrapper(VAudioElement);
export const NullVAudio = create_null(VAudioElement);
// Base class VBlockQuoteElement derived from HTMLQuoteElement.
// @ts-ignore
export class VBlockQuoteElement extends HTMLQuoteElement {
    static element_name = "VBlockQuoteElement";
    static element_tag = "blockquote";
    constructor(args = {}) {
        super();
        args.derived ??= VBlockQuoteElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VBlockQuoteElement extends HTMLQuoteElement, VElement, VElementExtensions {};
postprocess(VBlockQuoteElement);
export const VBlockQuote = wrapper(VBlockQuoteElement);
export const NullVBlockQuote = create_null(VBlockQuoteElement);
// Base class VBodyElement derived from HTMLBodyElement.
// @ts-ignore
export class VBodyElement extends HTMLBodyElement {
    static element_name = "VBodyElement";
    static element_tag = "body";
    constructor(args = {}) {
        super();
        args.derived ??= VBodyElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VBodyElement extends HTMLBodyElement, VElement, VElementExtensions {};
postprocess(VBodyElement);
export const VBody = wrapper(VBodyElement);
export const NullVBody = create_null(VBodyElement);
// Base class VBRElement derived from HTMLBRElement.
// @ts-ignore
export class VBRElement extends HTMLBRElement {
    static element_name = "VBRElement";
    static element_tag = "br";
    constructor(args = {}) {
        super();
        args.derived ??= VBRElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VBRElement extends HTMLBRElement, VElement, VElementExtensions {};
postprocess(VBRElement);
export const VBR = wrapper(VBRElement);
export const NullVBR = create_null(VBRElement);
// Base class VButtonElement derived from HTMLButtonElement.
// @ts-ignore
export class VButtonElement extends HTMLButtonElement {
    static element_name = "VButtonElement";
    static element_tag = "button";
    constructor(args = {}) {
        super();
        args.derived ??= VButtonElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VButtonElement extends HTMLButtonElement, VElement, VElementExtensions {};
postprocess(VButtonElement);
export const VButton = wrapper(VButtonElement);
export const NullVButton = create_null(VButtonElement);
// Base class VCanvasElement derived from HTMLCanvasElement.
// @ts-ignore
export class VCanvasElement extends HTMLCanvasElement {
    static element_name = "VCanvasElement";
    static element_tag = "canvas";
    constructor(args = {}) {
        super();
        args.derived ??= VCanvasElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VCanvasElement extends HTMLCanvasElement, VElement, VElementExtensions {};
postprocess(VCanvasElement);
export const VCanvas = wrapper(VCanvasElement);
export const NullVCanvas = create_null(VCanvasElement);
// Base class VTableCaptionElement derived from HTMLTableCaptionElement.
// @ts-ignore
export class VTableCaptionElement extends HTMLTableCaptionElement {
    static element_name = "VTableCaptionElement";
    static element_tag = "caption";
    constructor(args = {}) {
        super();
        args.derived ??= VTableCaptionElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VTableCaptionElement extends HTMLTableCaptionElement, VElement, VElementExtensions {};
postprocess(VTableCaptionElement);
export const VTableCaption = wrapper(VTableCaptionElement);
export const NullVTableCaption = create_null(VTableCaptionElement);
// Base class VTableColElement derived from HTMLTableColElement.
// @ts-ignore
export class VTableColElement extends HTMLTableColElement {
    static element_name = "VTableColElement";
    static element_tag = "col";
    constructor(args = {}) {
        super();
        args.derived ??= VTableColElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VTableColElement extends HTMLTableColElement, VElement, VElementExtensions {};
postprocess(VTableColElement);
export const VTableCol = wrapper(VTableColElement);
export const NullVTableCol = create_null(VTableColElement);
// Base class VDataElement derived from HTMLDataElement.
// @ts-ignore
export class VDataElement extends HTMLDataElement {
    static element_name = "VDataElement";
    static element_tag = "data";
    constructor(args = {}) {
        super();
        args.derived ??= VDataElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VDataElement extends HTMLDataElement, VElement, VElementExtensions {};
postprocess(VDataElement);
export const VData = wrapper(VDataElement);
export const NullVData = create_null(VDataElement);
// Base class VDataListElement derived from HTMLDataListElement.
// @ts-ignore
export class VDataListElement extends HTMLDataListElement {
    static element_name = "VDataListElement";
    static element_tag = "datalist";
    constructor(args = {}) {
        super();
        args.derived ??= VDataListElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VDataListElement extends HTMLDataListElement, VElement, VElementExtensions {};
postprocess(VDataListElement);
export const VDataList = wrapper(VDataListElement);
export const NullVDataList = create_null(VDataListElement);
// Base class VDListElement derived from HTMLDListElement.
// @ts-ignore
export class VDListElement extends HTMLDListElement {
    static element_name = "VDListElement";
    static element_tag = "dl";
    constructor(args = {}) {
        super();
        args.derived ??= VDListElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VDListElement extends HTMLDListElement, VElement, VElementExtensions {};
postprocess(VDListElement);
export const VDList = wrapper(VDListElement);
export const NullVDList = create_null(VDListElement);
// Base class VDirectoryElement derived from HTMLDirectoryElement.
// @ts-ignore
export class VDirectoryElement extends HTMLDirectoryElement {
    static element_name = "VDirectoryElement";
    static element_tag = "dir";
    constructor(args = {}) {
        super();
        args.derived ??= VDirectoryElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VDirectoryElement extends HTMLDirectoryElement, VElement, VElementExtensions {};
postprocess(VDirectoryElement);
export const VDirectory = wrapper(VDirectoryElement);
export const NullVDirectory = create_null(VDirectoryElement);
// Base class VDivElement derived from HTMLDivElement.
// @ts-ignore
export class VDivElement extends HTMLDivElement {
    static element_name = "VDivElement";
    static element_tag = "div";
    constructor(args = {}) {
        super();
        args.derived ??= VDivElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VDivElement extends HTMLDivElement, VElement, VElementExtensions {};
postprocess(VDivElement);
export const VDiv = wrapper(VDivElement);
export const NullVDiv = create_null(VDivElement);
// Base class VEmbedElement derived from HTMLEmbedElement.
// @ts-ignore
export class VEmbedElement extends HTMLEmbedElement {
    static element_name = "VEmbedElement";
    static element_tag = "embed";
    constructor(args = {}) {
        super();
        args.derived ??= VEmbedElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VEmbedElement extends HTMLEmbedElement, VElement, VElementExtensions {};
postprocess(VEmbedElement);
export const VEmbed = wrapper(VEmbedElement);
export const NullVEmbed = create_null(VEmbedElement);
// Base class VFieldSetElement derived from HTMLFieldSetElement.
// @ts-ignore
export class VFieldSetElement extends HTMLFieldSetElement {
    static element_name = "VFieldSetElement";
    static element_tag = "fieldset";
    constructor(args = {}) {
        super();
        args.derived ??= VFieldSetElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VFieldSetElement extends HTMLFieldSetElement, VElement, VElementExtensions {};
postprocess(VFieldSetElement);
export const VFieldSet = wrapper(VFieldSetElement);
export const NullVFieldSet = create_null(VFieldSetElement);
// Base class VFormElement derived from HTMLFormElement.
// @ts-ignore
export class VFormElement extends HTMLFormElement {
    static element_name = "VFormElement";
    static element_tag = "form";
    constructor(args = {}) {
        super();
        args.derived ??= VFormElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VFormElement extends HTMLFormElement, VElement, VElementExtensions {};
postprocess(VFormElement);
export const VForm = wrapper(VFormElement);
export const NullVForm = create_null(VFormElement);
// Base class VHeadingElement derived from HTMLHeadingElement.
// @ts-ignore
export class VHeadingElement extends HTMLHeadingElement {
    static element_name = "VHeadingElement";
    static element_tag = "h1";
    constructor(args = {}) {
        super();
        args.derived ??= VHeadingElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VHeadingElement extends HTMLHeadingElement, VElement, VElementExtensions {};
postprocess(VHeadingElement);
export const VHeading = wrapper(VHeadingElement);
export const NullVHeading = create_null(VHeadingElement);
// Base class VHeadElement derived from HTMLHeadElement.
// @ts-ignore
export class VHeadElement extends HTMLHeadElement {
    static element_name = "VHeadElement";
    static element_tag = "head";
    constructor(args = {}) {
        super();
        args.derived ??= VHeadElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VHeadElement extends HTMLHeadElement, VElement, VElementExtensions {};
postprocess(VHeadElement);
export const VHead = wrapper(VHeadElement);
export const NullVHead = create_null(VHeadElement);
// Base class VHRElement derived from HTMLHRElement.
// @ts-ignore
export class VHRElement extends HTMLHRElement {
    static element_name = "VHRElement";
    static element_tag = "hr";
    constructor(args = {}) {
        super();
        args.derived ??= VHRElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VHRElement extends HTMLHRElement, VElement, VElementExtensions {};
postprocess(VHRElement);
export const VHR = wrapper(VHRElement);
export const NullVHR = create_null(VHRElement);
// Base class VImageElement derived from HTMLImageElement.
// @ts-ignore
export class VImageElement extends HTMLImageElement {
    static element_name = "VImageElement";
    static element_tag = "img";
    constructor(args = {}) {
        super();
        args.derived ??= VImageElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VImageElement extends HTMLImageElement, VElement, VElementExtensions {};
postprocess(VImageElement);
export const VImage = wrapper(VImageElement);
export const NullVImage = create_null(VImageElement);
// Base class VInputElement derived from HTMLInputElement.
// @ts-ignore
export class VInputElement extends HTMLInputElement {
    static element_name = "VInputElement";
    static element_tag = "input";
    static value_property = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    constructor(args = {}) {
        super();
        args.derived ??= VInputElement;
        this._init_sys_velement(args);
    }
    /**
     * Value
     * Specifies the value of the element, equivalent to the HTML attribute `value`.
     *        Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless `value` is `null`, then the attribute's value is returned.
     */
    value(value) {
        // // @ts-ignore
        // if (value == null) return super.value ?? "";
        // // @ts-ignore
        // super.value = value;
        // if (value == null) return this.getAttribute("value") ?? "";
        // this.setAttribute("value", value);
        if (value == null)
            return VInputElement.value_property.get.call(this) ?? "";
        VInputElement.value_property.set.call(this, value); // throws an error when used on non input element but that is fine.
        return this;
    }
}
// @ts-ignore
// export interface VInputElement extends HTMLInputElement, VElement, VElementExtensions {};
postprocess(VInputElement, { mixin: { ignore_methods: ["value"] } });
export const VInput = wrapper(VInputElement);
export const NullVInput = create_null(VInputElement);
// Base class VTextAreaElement derived from HTMLTextAreaElement.
// @ts-ignore
export class VTextAreaElement extends HTMLTextAreaElement {
    static element_name = "VTextAreaElement";
    static element_tag = "textarea";
    static value_property = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
    constructor(args = {}) {
        super();
        args.derived ??= VTextAreaElement;
        this._init_sys_velement(args);
    }
    /**
     * Value
     * Specifies the value of the element, equivalent to the HTML attribute `value`.
     *        Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless `value` is `null`, then the attribute's value is returned.
     */
    value(value) {
        // @ts-ignore
        // if (value == null) return super.value ?? "";
        // @ts-ignore
        // super.value = value;
        // if (value == null) return this.getAttribute("value") ?? "";
        // this.setAttribute("value", value);
        if (value == null)
            return VTextAreaElement.value_property.get.call(this) ?? "";
        VTextAreaElement.value_property.set.call(this, value); // throws an error when used on non input element but that is fine.
        return this;
    }
}
// @ts-ignore
// export interface VTextAreaElement extends HTMLTextAreaElement, VElement, VElementExtensions {};
postprocess(VTextAreaElement, { mixin: { ignore_methods: ["value"] } });
export const VTextArea = wrapper(VTextAreaElement);
export const NullVTextArea = create_null(VTextAreaElement);
// Base class VModElement derived from HTMLModElement.
// @ts-ignore
export class VModElement extends HTMLModElement {
    static element_name = "VModElement";
    static element_tag = "ins";
    constructor(args = {}) {
        super();
        args.derived ??= VModElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VModElement extends HTMLModElement, VElement, VElementExtensions {};
postprocess(VModElement);
export const VMod = wrapper(VModElement);
export const NullVMod = create_null(VModElement);
// Base class VLabelElement derived from HTMLLabelElement.
// @ts-ignore
export class VLabelElement extends HTMLLabelElement {
    static element_name = "VLabelElement";
    static element_tag = "label";
    constructor(args = {}) {
        super();
        args.derived ??= VLabelElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VLabelElement extends HTMLLabelElement, VElement, VElementExtensions {};
postprocess(VLabelElement);
export const VLabel = wrapper(VLabelElement);
export const NullVLabel = create_null(VLabelElement);
// Base class VLegendElement derived from HTMLLegendElement.
// @ts-ignore
export class VLegendElement extends HTMLLegendElement {
    static element_name = "VLegendElement";
    static element_tag = "legend";
    constructor(args = {}) {
        super();
        args.derived ??= VLegendElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VLegendElement extends HTMLLegendElement, VElement, VElementExtensions {};
postprocess(VLegendElement);
export const VLegend = wrapper(VLegendElement);
export const NullVLegend = create_null(VLegendElement);
// Base class VLIElement derived from HTMLLIElement.
// @ts-ignore
export class VLIElement extends HTMLLIElement {
    static element_name = "VLIElement";
    static element_tag = "li";
    constructor(args = {}) {
        super();
        args.derived ??= VLIElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VLIElement extends HTMLLIElement, VElement, VElementExtensions {};
postprocess(VLIElement);
export const VLI = wrapper(VLIElement);
export const NullVLI = create_null(VLIElement);
// Base class VLinkElement derived from HTMLLinkElement.
// @ts-ignore
export class VLinkElement extends HTMLLinkElement {
    static element_name = "VLinkElement";
    static element_tag = "link";
    constructor(args = {}) {
        super();
        args.derived ??= VLinkElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VLinkElement extends HTMLLinkElement, VElement, VElementExtensions {};
postprocess(VLinkElement);
export const VLink = wrapper(VLinkElement);
export const NullVLink = create_null(VLinkElement);
// Base class VMapElement derived from HTMLMapElement.
// @ts-ignore
export class VMapElement extends HTMLMapElement {
    static element_name = "VMapElement";
    static element_tag = "map";
    constructor(args = {}) {
        super();
        args.derived ??= VMapElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VMapElement extends HTMLMapElement, VElement, VElementExtensions {};
postprocess(VMapElement);
export const VMap = wrapper(VMapElement);
export const NullVMap = create_null(VMapElement);
// Base class VMetaElement derived from HTMLMetaElement.
// @ts-ignore
export class VMetaElement extends HTMLMetaElement {
    static element_name = "VMetaElement";
    static element_tag = "meta";
    constructor(args = {}) {
        super();
        args.derived ??= VMetaElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VMetaElement extends HTMLMetaElement, VElement, VElementExtensions {};
postprocess(VMetaElement);
export const VMeta = wrapper(VMetaElement);
export const NullVMeta = create_null(VMetaElement);
// Base class VMeterElement derived from HTMLMeterElement.
// @ts-ignore
export class VMeterElement extends HTMLMeterElement {
    static element_name = "VMeterElement";
    static element_tag = "meter";
    constructor(args = {}) {
        super();
        args.derived ??= VMeterElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VMeterElement extends HTMLMeterElement, VElement, VElementExtensions {};
postprocess(VMeterElement);
export const VMeter = wrapper(VMeterElement);
export const NullVMeter = create_null(VMeterElement);
// Base class VObjectElement derived from HTMLObjectElement.
// @ts-ignore
export class VObjectElement extends HTMLObjectElement {
    static element_name = "VObjectElement";
    static element_tag = "object";
    constructor(args = {}) {
        super();
        args.derived ??= VObjectElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VObjectElement extends HTMLObjectElement, VElement, VElementExtensions {};
postprocess(VObjectElement);
export const VObject = wrapper(VObjectElement);
export const NullVObject = create_null(VObjectElement);
// Base class VOListElement derived from HTMLOListElement.
// @ts-ignore
export class VOListElement extends HTMLOListElement {
    static element_name = "VOListElement";
    static element_tag = "ol";
    constructor(args = {}) {
        super();
        args.derived ??= VOListElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VOListElement extends HTMLOListElement, VElement, VElementExtensions {};
postprocess(VOListElement);
export const VOList = wrapper(VOListElement);
export const NullVOList = create_null(VOListElement);
// Base class VOptGroupElement derived from HTMLOptGroupElement.
// @ts-ignore
export class VOptGroupElement extends HTMLOptGroupElement {
    static element_name = "VOptGroupElement";
    static element_tag = "optgroup";
    constructor(args = {}) {
        super();
        args.derived ??= VOptGroupElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VOptGroupElement extends HTMLOptGroupElement, VElement, VElementExtensions {};
postprocess(VOptGroupElement);
export const VOptGroup = wrapper(VOptGroupElement);
export const NullVOptGroup = create_null(VOptGroupElement);
// Base class VOptionElement derived from HTMLOptionElement.
// @ts-ignore
export class VOptionElement extends HTMLOptionElement {
    static element_name = "VOptionElement";
    static element_tag = "option";
    constructor(args = {}) {
        super();
        args.derived ??= VOptionElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VOptionElement extends HTMLOptionElement, VElement, VElementExtensions {};
postprocess(VOptionElement);
export const VOption = wrapper(VOptionElement);
export const NullVOption = create_null(VOptionElement);
// Base class VOutputElement derived from HTMLOutputElement.
// @ts-ignore
export class VOutputElement extends HTMLOutputElement {
    static element_name = "VOutputElement";
    static element_tag = "output";
    constructor(args = {}) {
        super();
        args.derived ??= VOutputElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VOutputElement extends HTMLOutputElement, VElement, VElementExtensions {};
postprocess(VOutputElement);
export const VOutput = wrapper(VOutputElement);
export const NullVOutput = create_null(VOutputElement);
// Base class VParagraphElement derived from HTMLParagraphElement.
// @ts-ignore
export class VParagraphElement extends HTMLParagraphElement {
    static element_name = "VParagraphElement";
    static element_tag = "p";
    constructor(args = {}) {
        super();
        args.derived ??= VParagraphElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VParagraphElement extends HTMLParagraphElement, VElement, VElementExtensions {};
postprocess(VParagraphElement);
export const VParagraph = wrapper(VParagraphElement);
export const NullVParagraph = create_null(VParagraphElement);
// Base class VParamElement derived from HTMLParamElement.
// @ts-ignore
export class VParamElement extends HTMLParamElement {
    static element_name = "VParamElement";
    static element_tag = "param";
    constructor(args = {}) {
        super();
        args.derived ??= VParamElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VParamElement extends HTMLParamElement, VElement, VElementExtensions {};
postprocess(VParamElement);
export const VParam = wrapper(VParamElement);
export const NullVParam = create_null(VParamElement);
// Base class VPictureElement derived from HTMLPictureElement.
// @ts-ignore
export class VPictureElement extends HTMLPictureElement {
    static element_name = "VPictureElement";
    static element_tag = "picture";
    constructor(args = {}) {
        super();
        args.derived ??= VPictureElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VPictureElement extends HTMLPictureElement, VElement, VElementExtensions {};
postprocess(VPictureElement);
export const VPicture = wrapper(VPictureElement);
export const NullVPicture = create_null(VPictureElement);
// Base class VPreElement derived from HTMLPreElement.
// @ts-ignore
export class VPreElement extends HTMLPreElement {
    static element_name = "VPreElement";
    static element_tag = "pre";
    constructor(args = {}) {
        super();
        args.derived ??= VPreElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VPreElement extends HTMLPreElement, VElement, VElementExtensions {};
postprocess(VPreElement);
export const VPre = wrapper(VPreElement);
export const NullVPre = create_null(VPreElement);
// Base class VProgressElement derived from HTMLProgressElement.
// @ts-ignore
export class VProgressElement extends HTMLProgressElement {
    static element_name = "VProgressElement";
    static element_tag = "progress";
    constructor(args = {}) {
        super();
        args.derived ??= VProgressElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VProgressElement extends HTMLProgressElement, VElement, VElementExtensions {};
postprocess(VProgressElement);
export const VProgress = wrapper(VProgressElement);
export const NullVProgress = create_null(VProgressElement);
// Base class VScriptElement derived from HTMLScriptElement.
// @ts-ignore
export class VScriptElement extends HTMLScriptElement {
    static element_name = "VScriptElement";
    static element_tag = "script";
    constructor(args = {}) {
        super();
        args.derived ??= VScriptElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VScriptElement extends HTMLScriptElement, VElement, VElementExtensions {};
postprocess(VScriptElement);
export const VScript = wrapper(VScriptElement);
export const NullVScript = create_null(VScriptElement);
// Base class VSelectElement derived from HTMLSelectElement.
// @ts-ignore
export class VSelectElement extends HTMLSelectElement {
    static element_name = "VSelectElement";
    static element_tag = "select";
    constructor(args = {}) {
        super();
        args.derived ??= VSelectElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VSelectElement extends HTMLSelectElement, VElement, VElementExtensions {};
postprocess(VSelectElement);
export const VSelect = wrapper(VSelectElement);
export const NullVSelect = create_null(VSelectElement);
// Base class VSlotElement derived from HTMLSlotElement.
// @ts-ignore
export class VSlotElement extends HTMLSlotElement {
    static element_name = "VSlotElement";
    static element_tag = "slot";
    constructor(args = {}) {
        super();
        args.derived ??= VSlotElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VSlotElement extends HTMLSlotElement, VElement, VElementExtensions {};
postprocess(VSlotElement);
export const VSlot = wrapper(VSlotElement);
export const NullVSlot = create_null(VSlotElement);
// Base class VSourceElement derived from HTMLSourceElement.
// @ts-ignore
export class VSourceElement extends HTMLSourceElement {
    static element_name = "VSourceElement";
    static element_tag = "source";
    constructor(args = {}) {
        super();
        args.derived ??= VSourceElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VSourceElement extends HTMLSourceElement, VElement, VElementExtensions {};
postprocess(VSourceElement);
export const VSource = wrapper(VSourceElement);
export const NullVSource = create_null(VSourceElement);
// Base class VSpanElement derived from HTMLSpanElement.
// @ts-ignore
export class VSpanElement extends HTMLSpanElement {
    static element_name = "VSpanElement";
    static element_tag = "span";
    constructor(args = {}) {
        super();
        args.derived ??= VSpanElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VSpanElement extends HTMLSpanElement, VElement, VElementExtensions {};
postprocess(VSpanElement);
export const VSpan = wrapper(VSpanElement);
export const NullVSpan = create_null(VSpanElement);
// Base class VTableElement derived from HTMLTableElement.
// @ts-ignore
export class VTableElement extends HTMLTableElement {
    static element_name = "VTableElement";
    static element_tag = "table";
    constructor(args = {}) {
        super();
        args.derived ??= VTableElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VTableElement extends HTMLTableElement, VElement, VElementExtensions {};
postprocess(VTableElement);
export const VTable = wrapper(VTableElement);
export const NullVTable = create_null(VTableElement);
// Base class VTHeadElement derived from HTMLTableSectionElement.
// @ts-ignore
export class VTHeadElement extends HTMLTableSectionElement {
    static element_name = "VTHeadElement";
    static element_tag = "thead";
    constructor(args = {}) {
        super();
        args.derived ??= VTHeadElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VTHeadElement extends HTMLTableSectionElement, VElement, VElementExtensions {};
postprocess(VTHeadElement);
export const VTHead = wrapper(VTHeadElement);
export const NullVTHead = create_null(VTHeadElement);
// Base class VTBodyElement derived from HTMLTableSectionElement.
// @ts-ignore
export class VTBodyElement extends HTMLTableSectionElement {
    static element_name = "VTBodyElement";
    static element_tag = "tbody";
    constructor(args = {}) {
        super();
        args.derived ??= VTBodyElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VTBodyElement extends HTMLTableSectionElement, VElement, VElementExtensions {};
postprocess(VTBodyElement);
export const VTBody = wrapper(VTBodyElement);
export const NullVTBody = create_null(VTBodyElement);
// Base class VTFootElement derived from HTMLTableSectionElement.
// @ts-ignore
export class VTFootElement extends HTMLTableSectionElement {
    static element_name = "VTFootElement";
    static element_tag = "tfoot";
    constructor(args = {}) {
        super();
        args.derived ??= VTFootElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VTFootElement extends HTMLTableSectionElement, VElement, VElementExtensions {};
postprocess(VTFootElement);
export const VTFoot = wrapper(VTFootElement);
export const NullVTFoot = create_null(VTFootElement);
// Base class VTHElement derived from HTMLTableCellElement.
// @ts-ignore
export class VTHElement extends HTMLTableCellElement {
    static element_name = "VTHElement";
    static element_tag = "th";
    constructor(args = {}) {
        super();
        args.derived ??= VTHElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VTHElement extends HTMLTableCellElement, VElement, VElementExtensions {};
postprocess(VTHElement);
export const VTH = wrapper(VTHElement);
export const NullVTH = create_null(VTHElement);
// Base class VTDElement derived from HTMLTableCellElement.
// @ts-ignore
export class VTDElement extends HTMLTableCellElement {
    static element_name = "VTDElement";
    static element_tag = "td";
    constructor(args = {}) {
        super();
        args.derived ??= VTDElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VTDElement extends HTMLTableCellElement, VElement, VElementExtensions {};
postprocess(VTDElement);
export const VTD = wrapper(VTDElement);
export const NullVTD = create_null(VTDElement);
// Base class VTemplateElement derived from HTMLTemplateElement.
// @ts-ignore
export class VTemplateElement extends HTMLTemplateElement {
    static element_name = "VTemplateElement";
    static element_tag = "template";
    constructor(args = {}) {
        super();
        args.derived ??= VTemplateElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VTemplateElement extends HTMLTemplateElement, VElement, VElementExtensions {};
postprocess(VTemplateElement);
export const VTemplate = wrapper(VTemplateElement);
export const NullVTemplate = create_null(VTemplateElement);
// Base class VTimeElement derived from HTMLTimeElement.
// @ts-ignore
export class VTimeElement extends HTMLTimeElement {
    static element_name = "VTimeElement";
    static element_tag = "time";
    constructor(args = {}) {
        super();
        args.derived ??= VTimeElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VTimeElement extends HTMLTimeElement, VElement, VElementExtensions {};
postprocess(VTimeElement);
export const VTime = wrapper(VTimeElement);
export const NullVTime = create_null(VTimeElement);
// Base class VTitleElement derived from HTMLTitleElement.
// @ts-ignore
export class VTitleElement extends HTMLTitleElement {
    static element_name = "VTitleElement";
    static element_tag = "title";
    constructor(args = {}) {
        super();
        args.derived ??= VTitleElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VTitleElement extends HTMLTitleElement, VElement, VElementExtensions {};
postprocess(VTitleElement);
export const VTitle = wrapper(VTitleElement);
export const NullVTitle = create_null(VTitleElement);
// Base class VTableRowElement derived from HTMLTableRowElement.
// @ts-ignore
export class VTableRowElement extends HTMLTableRowElement {
    static element_name = "VTableRowElement";
    static element_tag = "tr";
    constructor(args = {}) {
        super();
        args.derived ??= VTableRowElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VTableRowElement extends HTMLTableRowElement, VElement, VElementExtensions {};
postprocess(VTableRowElement);
export const VTableRow = wrapper(VTableRowElement);
export const NullVTableRow = create_null(VTableRowElement);
// Base class VTrackElement derived from HTMLTrackElement.
// @ts-ignore
export class VTrackElement extends HTMLTrackElement {
    static element_name = "VTrackElement";
    static element_tag = "track";
    constructor(args = {}) {
        super();
        args.derived ??= VTrackElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VTrackElement extends HTMLTrackElement, VElement, VElementExtensions {};
postprocess(VTrackElement);
export const VTrack = wrapper(VTrackElement);
export const NullVTrack = create_null(VTrackElement);
// Base class VUListElement derived from HTMLUListElement.
// @ts-ignore
export class VUListElement extends HTMLUListElement {
    static element_name = "VUListElement";
    static element_tag = "ul";
    constructor(args = {}) {
        super();
        args.derived ??= VUListElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VUListElement extends HTMLUListElement, VElement, VElementExtensions {};
postprocess(VUListElement);
export const VUList = wrapper(VUListElement);
export const NullVUList = create_null(VUListElement);
// Base class VIFrameElement derived from HTMLIFrameElement.
// @ts-ignore
export class VIFrameElement extends HTMLIFrameElement {
    static element_name = "VIFrameElement";
    static element_tag = "iframe";
    constructor(args = {}) {
        super();
        args.derived ??= VIFrameElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VIFrameElement extends HTMLIFrameElement, VElement, VElementExtensions {};
postprocess(VIFrameElement);
export const VIFrame = wrapper(VIFrameElement);
export const NullVIFrame = create_null(VIFrameElement);
// Base class VCodeElement derived from HTMLElement.
// @ts-ignore
export class VCodeElement extends HTMLElement {
    static element_name = "VCodeElement";
    static element_tag = "code";
    constructor(args = {}) {
        super();
        args.derived ??= VCodeElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VCodeElement extends HTMLElement, VElement, VElementExtensions {};
postprocess(VCodeElement);
export const VCode = wrapper(VCodeElement);
export const NullVCode = create_null(VCodeElement);
// Base class VSectionElement derived from HTMLElement.
// @ts-ignore
export class VSectionElement extends HTMLElement {
    static element_name = "VSectionElement";
    static element_tag = "section";
    constructor(args = {}) {
        super();
        args.derived ??= VSectionElement;
        this._init_sys_velement(args);
    }
}
// @ts-ignore
// export interface VSectionElement extends HTMLElement, VElement, VElementExtensions {};
postprocess(VSectionElement);
export const VSection = wrapper(VSectionElement);
export const NullVSection = create_null(VSectionElement);
// The VElement map per html tag.
export const VElementTagMap = {
    _base: VHTMLElement,
    a: VAnchorElement,
    area: VAreaElement,
    audio: VAudioElement,
    blockquote: VBlockQuoteElement,
    body: VBodyElement,
    br: VBRElement,
    button: VButtonElement,
    canvas: VCanvasElement,
    caption: VTableCaptionElement,
    col: VTableColElement,
    data: VDataElement,
    datalist: VDataListElement,
    dl: VDListElement,
    dir: VDirectoryElement,
    div: VDivElement,
    embed: VEmbedElement,
    fieldset: VFieldSetElement,
    form: VFormElement,
    h1: VHeadingElement,
    head: VHeadElement,
    hr: VHRElement,
    img: VImageElement,
    input: VInputElement,
    ins: VModElement,
    label: VLabelElement,
    legend: VLegendElement,
    li: VLIElement,
    link: VLinkElement,
    map: VMapElement,
    meta: VMetaElement,
    meter: VMeterElement,
    object: VObjectElement,
    ol: VOListElement,
    optgroup: VOptGroupElement,
    option: VOptionElement,
    output: VOutputElement,
    p: VParagraphElement,
    param: VParamElement,
    picture: VPictureElement,
    pre: VPreElement,
    progress: VProgressElement,
    script: VScriptElement,
    select: VSelectElement,
    slot: VSlotElement,
    source: VSourceElement,
    span: VSpanElement,
    table: VTableElement,
    thead: VTHeadElement,
    tbody: VTBodyElement,
    tfoot: VTFootElement,
    th: VTHElement,
    td: VTDElement,
    template: VTemplateElement,
    textarea: VTextAreaElement,
    time: VTimeElement,
    title: VTitleElement,
    tr: VTableRowElement,
    track: VTrackElement,
    ul: VUListElement,
    iframe: VIFrameElement,
    code: VCodeElement,
    section: VSectionElement,
};
