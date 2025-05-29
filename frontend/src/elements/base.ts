/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Import vlib.
import * as vlib from "@vandenberghinc/vlib/frontend"

// Imports.
import "../modules//string.js"
import "../modules//array.js"
import "../modules//number.js"

import { Utils } from "../modules/utils.js"
import { Events } from "../modules/events.js"
import { Themes } from "../modules/themes.js"
import { GradientType } from "../types/gradient.js"
import { Statics  } from "../modules/statics.js"

import type { AnyElement } from "../ui/any_element.js"
import { register_element } from "./register_element.js";

// Vars.
const elements_with_width_attribute = [ // elements that use the "width" etc attribute instead of the "style.width".
    'canvas',
    'embed',
    'iframe',
    'img',
    'object',
    'progress',
    'video',
];

// ------------------------------------------------------------------------------------------------
// The base VElement.

// The VElement user defined extensions.
declare global {
    export interface VElementExtensions {}
    // export type none = null | undefined;
}

// VElement options.
interface BaseVElementInitOptions {
    derived: any,
    // name: string, // replaced with assigning element_name on each element. @warning required since class names are renamed on bundled file so class.name cant be used.
    // tag: string,
    default_style?: Record<string, any>;
    default_attributes?: Record<string, any>;
    default_events?: Record<string, any>;
}
interface DerivedVElementInitOptions {
    derived?: any,
    name?: string,
    // tag?: string,
    default_style?: Record<string, any>;
    default_attributes?: Record<string, any>;
    default_events?: Record<string, any>;
}

// Get/Set methods.
const element_checked_descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'checked');// instead of getAttribute("checked")
const element_disabled_descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'disabled');// instead of getAttribute("disabled")
const element_selected_descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'selected');// for <option> elements
const element_href_descriptor = Object.getOwnPropertyDescriptor(HTMLAnchorElement.prototype, 'href');// gives full URL instead of getAttribute("href") which might be relative
const element_src_descriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');// gives full URL
const element_id_descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'id');// instead of getAttribute("id")
const element_value_descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');

// Types.
export type AppendType = null | undefined | string | Node | VElement | Function | AppendType[];
export type ElementCallback<This> = (element: This) => any;
export type ElementEvent<This> = (element: This, event: Event) => any;
export type ElementMouseEvent<This> = (element: This, event: MouseEvent) => any;
export type ElementDragEvent<This> = (element: This, event: MouseEvent) => any;
export type ElementKeyboardEvent<This> = (element: This, event: KeyboardEvent) => any;
export type ThemeUpdateCallback<This> = (element: This) => any;
export type OnAppearCallback<This> = (element: This, options: { scroll_direction: string }) => any;
export type undefstrnr = null | undefined | string | number;

// Base element.
// @note: this.tagName can not be used since they have different values on safari and other browsers.
/*  @docs:
    @nav: FrontendVElement
    @chapter: Elements
    @title: Base element
    @desc: The base element of the volt frontend elements.
*/
// export class VElement extends (HTMLElement as {new(): VBaseElementInterface, prototype: VBaseElementInterface}) {
export abstract class VElement extends HTMLElement {

    // ---------------------------------------------------------
    // Attributes.
    // @warning do not use default values since they will be put inside the constructor, which should remain empty, define them in _init_velement() instead.

    public __is_velement: boolean = true;

    static element_tag: string = ""; // must also be static.
    static default_style: Record<string, any> = {};
    static default_attributes: Record<string, any> = {};
    static default_events: Record<string, any> = {};

    public rendered!: boolean;
    public element_name!: string;
    public base_element_name!: string;
    public remove_focus!: HTMLElement["blur"];
    public _v_children!: any[];

    public _element_display!: string;
    public _is_connected!: boolean;
    public _on_append_callback?: Function;
    public _assign_to_parent_as?: string;
    public _parent?: any;
    public _side_by_side_basis?: number;
    public _animate_timeout?: ReturnType<typeof setTimeout>;
    public _is_button_disabled!: boolean;
    public _timeouts!: Record<string, any>;
    public _on_window_resize_timer!: any;
    public _abs_parent!: any;
    public _pseudo_stylesheets!: Record<string, any>;
    public _on_resize_rule_evals!: Record<string, any>;
    public _observing_on_resize!: boolean;
    public _observing_on_render!: boolean;
    public _on_resize_callbacks!: ElementCallback<this>[];
    public _on_render_callbacks!: ElementCallback<this>[];
    public _on_theme_updates!: ThemeUpdateCallback<this>[];
    public _on_mouse_leave_callback!: ElementMouseEvent<this>;
    public _on_mouse_enter_callback!: ElementMouseEvent<this>;
    public _on_shortcut_time!: number;
    public _on_shortcut_key!: string;
    public _on_shortcut_keycode!: number;
    public _on_keypress_set!: boolean;
    public _on_enter_callback?: ElementKeyboardEvent<this>;
    public _on_escape_callback?: ElementKeyboardEvent<this>;
    public _on_appear_callbacks!: Record<string, any>[];
    // public _context_menu?: ContextMenuElement;
    public _media_queries!: {
        [key: string]: {
            list: MediaQueryList,
            callback: (query: MediaQueryList) => any,
        },
    };

    private _checked: any;// {get(x: any): void, set(x: any, y: any): void};
    private _disabled: any;// {get(x: any): void, set(x: any, y: any): void};
    private _selected: any;// {get(x: any): void, set(x: any, y: any): void};
    private _href: any;// {get(x: any): void, set(x: any, y: any): void};
    private _src: any;// {get(x: any): void, set(x: any, y: any): void};
    private _id: any;// {get(x: any): void, set(x: any, y: any): void};
    private _value: any;// {get(x: any): void, set(x: any, y: any): void};

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
    protected _init_sys_velement(args: BaseVElementInitOptions) {  

        // Errs.
        if (!args.derived || !args.derived.element_name) {
            throw new Error("Static element attribute 'args.derived.element_name' should always be defined, create static attribute \"element_name: string\" and assign the name of the class to this attribute.")
        }
        // if (!args.name) {
        //     throw new Error("Attribute 'args.name' should always be defined.")
        // }

        // Attributes.
        this._is_connected = false;

        // Defaults.
        this.__is_velement = true;

        this.rendered = false;
        this.element_name = args.derived.element_name;
        this.base_element_name = args.derived.element_name;
        this.remove_focus = super.blur;
        this._v_children = [];

        this._element_display = "block"
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
        this._pseudo_stylesheets = {};
        this._on_resize_rule_evals = {};
        this._observing_on_resize = false;
        this._observing_on_render = false;
        this._on_resize_callbacks = []; 
        this._on_render_callbacks = []; 
        this._on_theme_updates = []; 
        this._on_mouse_leave_callback = (element, event): void => {};
        this._on_mouse_enter_callback = (element, event): void => {};
        this._on_shortcut_time = 0;
        this._on_shortcut_key = "";
        this._on_shortcut_keycode = 0;
        this._on_keypress_set = false;
        this._on_enter_callback = undefined;
        this._on_escape_callback = undefined;
        this._on_appear_callbacks = [];
        this._media_queries = {};

        // Copied properties where this.getAttribtue() returns the original instead of the current.
        this._checked = element_checked_descriptor;
        this._disabled = element_disabled_descriptor;
        this._selected = element_selected_descriptor;
        this._href = element_href_descriptor;
        this._src = element_src_descriptor;
        this._id = element_id_descriptor;
        this._value = element_value_descriptor;

        // Constructed by html code.
        if (this.hasAttribute !== undefined && this.hasAttribute("created_by_html")) {
        }

        // Constructed by js code.
        else {

            // Always use border-box for all elements.
            // Defined in css.
            // this.box_sizing("border-box");

            // Default style.
            if (args.default_style != null) {
                this.styles({
                    ...(args.derived.default_style ?? {}),
                    ...args.default_style,
                });
            } else if (args.derived?.default_style != null) {
                this.styles(args.derived?.default_style);
            }

            // Default attributes.
            if (args.default_attributes != null) {
                this.attrs({
                    ...(args.derived.default_attributes ?? {}),
                    ...args.default_attributes,
                });
            } else if (args.derived?.default_attributes != null) {
                this.attrs(args.derived?.default_attributes);
            }

            // Default events.
            if (args.default_events != null) {
                this.events({
                    ...(args.derived.default_events ?? {}),
                    ...args.default_events,
                });
            } else if (args.derived?.default_events != null) {
                this.events(args.derived?.default_events);
            }
        }
    }
    /**
     * @warning Any VElement (a derived class of VElementTagMap) must call this method in its constructor.
     */
    protected _init(args: BaseVElementInitOptions) {

        // Set name.
        if (!args.derived || !args.derived.element_name) {
            throw new Error("Static element attribute 'args.derived.element_name' should always be defined, create static attribute \"element_name: string\" and assign the name of the class to this attribute.")
        }
        // if (!args.name) {
        //     throw new Error("Attribute 'args.name' should always be defined.")
        // }
        // if (args.name == null && !args.derived.name.endsWith("Element")) {
        //     throw new Error("Attribute 'args.name' should be defined when the derived class name does not end with 'Element'.")
        // } else if (args.name == null) {
        //     args.name = args.derived.name.slice(0, -7);
        // }

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
            } else if (args.derived?.default_style != null) {
                this.styles(args.derived?.default_style);
            }

            // Default attributes.
            if (args.default_attributes != null) {
                this.attrs({
                    ...(args.derived.default_attributes ?? {}),
                    ...args.default_attributes,
                });
            } else if (args.derived?.default_attributes != null) {
                this.attrs(args.derived?.default_attributes);
            }

            // Default events.
            if (args.default_events != null) {
                this.events({
                    ...(args.derived.default_events ?? {}),
                    ...args.default_events,
                });
            } else if (args.derived?.default_events != null) {
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
    static is(type: any): type is VElement {
        return type.__is_velement ?? false;
    }

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
    clone(clone_children: boolean = true): this {

        // @ts-ignore
        const clone = new this.constructor();

        if (clone.element_name != null) {
            clone.inner_html("");
        }

        const styles = window.getComputedStyle(this as any);
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
                    clone.appendChild((child as any).clone());
                } else {
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
    pad_numeric(value: none | number | string, padding: string = "px"): string {
        if (value == null) {
            return "";
        }
        if (typeof value !== "string") {
            return value + padding;
        }
        return value as unknown as string;
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
    pad_percentage(value: number, padding: string = "%"): string {
        if (Utils.is_float(value) && value <= 1.0) {
            return (value * 100) + padding;
        } else if (Utils.is_numeric(value)) {
            return value + padding;
        }
        return value as unknown as string;
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
    edit_filter_wrapper(filter: string | null, type: string, to: undefstrnr = undefined): string {
        const to_str: string = (typeof to === "number") ? to.toString() : (to ?? "");
        if (filter == null) {
            return to_str;
        }
        const pattern = new RegExp(`${type}\\([^)]*\\)\\s*`, "g");
        if (pattern.test(filter!)) {
            if (to == null) {
                return pattern[1];
            } else {
                return filter!.replace(pattern, to_str);
            }
        } else if (to != null) {
            return `${filter} ${to_str}`;
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
    toggle_filter_wrapper(filter: string | null, type: string, to: string | null = null): string {
        if (filter == null) {
            return to ?? "";
        }
        const pattern = new RegExp(`${type}\\([^)]*\\)\\s*`, "g");
        if (pattern.test(filter)) {
            return filter.replace(pattern, "");
        } else if (to != null) {
            return `${filter} ${to}`;
        }
        return filter;
    }

    // Convert a px string to number type.
    _convert_px_to_number_type(value, def: number | null = 0) {
        if (value == null || value === "") { return def; }
        else if (typeof value === "string" && value.endsWith("px")) {
            value = parseFloat(value)
            if (isNaN(value)) { return def; }
        }
        return value;
    }

    // Try and parse to float otherwise return original.
    _try_parse_float(value, def?: number | null): any {
        if (typeof value === "string" && (value.endsWith("em") || value.endsWith("rem"))) { return value; }
        const float = parseFloat(value);
        if (!isNaN(float)) { return float; }
        if (def !== undefined) { return def; }
        return value;
    }

    // Try and parse a boolean.
    _try_parse_boolean(value) {
        return typeof value === "boolean" ? value : (value === "true" || value === "True" || value === "TRUE" || value === "1");
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
    append(...children: AppendType[]): this {
        for (let i = 0; i < children.length; i++) {
            let child = children[i];
            if (child != null) {

                // Array.
                if (Array.isArray(child)) {
                    this.append(...child);
                }

                // VWeb element.
                else if (isVElement(child) && child.element_name != null) {
                    if (
                        child.element_name == "ForEachElement"
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
                        this.appendChild(child as any);
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
                        this._on_append_callback(child)
                    }
                    this.appendChild(child as any);
                }

                // Append text.
                else if (Utils.is_string(child)) {
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
    zstack_append(...children: AppendType[]): this {
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
                    if (
                        child.element_name == "ForEachElement"
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
                        this.appendChild(child as any);
                    }
                }

                // Execute function.
                else if (Utils.is_func(child)) {
                    this.append(child(this));
                }

                // Node element.
                else if ((child instanceof Node) || (child as any) instanceof HTMLElement) {
                    if (child instanceof HTMLElement) {
                        child.style.gridArea = "1 / 1 / 2 / 2";
                    }
                    // if (child._assign_to_parent_as !== undefined) {
                    //  this[child._assign_to_parent_as] = child;
                    //  child._parent = this;
                    // }
                    if (this._on_append_callback !== undefined) {
                        this._on_append_callback(child)
                    }
                    this.appendChild(child as any);
                }

                // Append text.
                else if (Utils.is_string(child)) {
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
    append_to(parent: any): this {
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
    append_children_to(parent: any, on_append_callback?: Function): this {
        if (isVElement(parent) && this.base_element_name === "VirtualScrollerElement") {
            for (let i = 0; i < parent.children.length; i++) {
                parent._v_children.push(parent.children[i]);
            }
            this.innerHTML = "";
        } else {
            while (this.firstChild) {
                if ((this.firstChild as any)._assign_to_parent_as !== undefined) {
                    parent[(this.firstChild as any)._assign_to_parent_as] = this.firstChild;
                    (this.firstChild as any)._parent = parent;
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
    remove_child(child: any): this {
        if (isVElement(child) && child.element_name != null) {
            this.removeChild(child as any);
        } else if (child instanceof Node) {
            this.removeChild(child as any);
        } else if (typeof child === "string") {
            let res;
            if ((res = document.getElementById(child)) != null) {
                this.removeChild(res as any);
            }
        } else {
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
    remove_children(): this {
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
    child(index: number): any {
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
    get(index: number): any | undefined {
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

    /**
     * @docs:
     * @title: Text
     * @desc: Set or get the text content of the element. If no value is provided, it retrieves the current text content.
     * @param:
     *     @name: value
     *     @descr: The text content to set or retrieve.
     * @return:
     *     @description Returns the current text content if no argument is passed, otherwise returns the instance of the element for chaining.
     * @funcs: 2
     */
    text(): string;
    text(value: string): this;
    text(value?: string): string | this {
        if (value == null) {
            return this.textContent ?? "";    
        }
        this.textContent = value;
        return this;
    }

    // ---------------------------------------------------------
    // Framing functions.

    /**
     * @docs:
     * @title: Width
     * @desc: Specify the width or height of the element. Returns the offset width or height when the param value is null.
     * @param:
     *     @name: value
     *     @descr: The width value to set or get.
     * @param:
     *     @name: check_attribute
     *     @descr: Indicates whether to check the element's width attribute.
     * @return:
     *     @description Returns the offset width when no value is provided, otherwise returns the instance of the element for chaining.
     * @funcs: 2
     */
    // @ts-ignore
    width(): string | number;
    // @ts-ignore
    width(value: string | number, check_attribute?: boolean): this;
    // @ts-ignore
    width(value?: string | number, check_attribute: boolean = true): string | number | this {
        if (check_attribute && elements_with_width_attribute.includes((this.constructor as any).element_tag)) {
            if (value == null) {
                return this._try_parse_float(super.getAttribute("width"));
                // return this._try_parse_float(super.width);
            }
            super.setAttribute("width", value.toString());
            // super.width = value.toString();
        } else {
            if (value == null) {
                return this._try_parse_float(this.style.width);
            }
            this.style.width = this.pad_numeric(value);
        }
        return this;
    }

    /** Simple wrapper for .width("fit-content") */
    fit_content(): this { return this.width("fit-content"); }

    /**
     * @docs:
     * @title: Fixed Width
     * @desc: Sets the fixed width for the element and updates min and max widths accordingly.
     * @param:
     *     @name: value
     *     @descr: The value to set for the width, can be a number or null to get the current width.
     * @return:
     *     @description If no argument is passed, returns the current width as a number. If an argument is passed, returns the instance of the element for chaining.
     * @funcs: 2
     */
    fixed_width(): string | number;
    fixed_width(value: string | number): this;
    fixed_width(value?: string | number): string | number | this {
        if (value == null) {
            return this._try_parse_float(this.style.width);
        }
        value = this.pad_numeric(value);
        this.style.width = value; // also required for for example image masks.
        this.style.minWidth = value;
        this.style.maxWidth = value;
        return this;
    }

    /**
     * @docs:
     * @title: Height
     * @desc: Sets or retrieves the height of the element. It checks for attributes and styles based on the provided parameters.
     * @param:
     *     @name: value
     *     @descr: The value to set for height or retrieve the current height if null.
     * @param:
     *     @name: check_attribute
     *     @descr: Determines if the element's attribute should be checked.
     * @return:
     *     @description Returns the instance of the element for chaining when an argument is passed, otherwise returns the current height as a number.
     * @funcs: 2
     */
    // @ts-ignore
    height(): string | number;
    // @ts-ignore
    height(value: string | number, check_attribute?: boolean): this;
    // @ts-ignore
    height(value?: string | number, check_attribute?: boolean): this | string | number {
        if (check_attribute && elements_with_width_attribute.includes((this.constructor as any).element_tag)) {
            if (value == null) {
                return this._try_parse_float(super.getAttribute("height"));
                // return this._try_parse_float(super.height);
            }
            super.setAttribute("height", value.toString());
            // super.height = value.toString();
        } else {
            if (value == null) {
                return this._try_parse_float(this.style.height);
            }
            this.style.height = this.pad_numeric(value);
        }
        return this;
    }

    /**
     * @docs:
     * @title: Fixed Height
     * @desc: Sets the fixed height for the element or retrieves the current height if no value is provided.
     * @param:
     *     @name: value
     *     @descr: The height value to set, which can be a number or null.
     * @return:
     *     @descr: When an argument is passed, this function returns the instance of the element for chaining. Otherwise, it returns the parsed float value of the current height.
     * @funcs: 2
     */
    fixed_height(): string | number;
    fixed_height(value: string | number): this;
    fixed_height(value?: string | number): string | number | this {
        if (value == null) {
            return this._try_parse_float(this.style.height);
        }
        value = this.pad_numeric(value);
        this.style.height = value; // also required for for example image masks.
        this.style.minHeight = value;
        this.style.maxHeight = value;
        return this;
    }

    /**
     * @docs:
     * @title: Min height
     * @desc: Sets the minimum height of an element. The equivalent of CSS attribute `minHeight`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    min_height(): string | number;
    min_height(value: string | number): this;
    min_height(value?: string | number): this | string | number {
        if (value == null) { return this._try_parse_float(this.style.minHeight); }
        this.style.minHeight = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Min Width
     * @desc: Sets the minimum width of an element. The equivalent of CSS attribute `minWidth`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @descr: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    min_width(): string | number;
    min_width(value: string | number): this;
    min_width(value?: string | number | null): this | string | number {
        if (value == null) { return this._try_parse_float(this.style.minWidth); }
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
    width_by_columns(columns: number): this {
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
    offset_width(): number {
        return this.offsetWidth;
    }

    /**
     * @docs:
     * @title: Offset Height
     * @desc: Retrieves the height of the element's offset.
     * @return:
     *     @description Returns the height of the element including padding and border.
     */
    offset_height(): number {
        return this.offsetHeight;
    }

    /**
     * @docs:
     * @title: Client Width
     * @desc: Retrieves the client width of the element.
     * @return:
     *     @description Returns the client width of the element.
     */
    client_width(): number {
        return this.clientWidth;
    }

    /**
     * @docs:
     * @title: Client Height
     * @desc: Retrieves the height of the client area of the element.
     * @return:
     *     @description Returns the height of the client area in pixels.
     */
    client_height(): number {
        return this.clientHeight;
    }

    /**
     * @docs:
     * @title: X Offset
     * @desc: Retrieves the x offset of the element from its parent.
     * @return:
     *     @description Returns the x offset value of the element.
     */
    // @ts-ignore
    x(): number {
        return this.offsetLeft;
    }

    /**
     * @docs:
     * @title: Y Offset
     * @desc: Retrieves the vertical offset of the element from the top of the document.
     * @return:
     *     @description Returns the vertical offset value.
     */
    // @ts-ignore
    y(): number {
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
    frame(width?: string | number, height?: string | number): this {
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
    min_frame(width: string | number, height: string | number): this {
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
    max_frame(width: string | number, height: string | number): this {
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
    fixed_frame(width: string | number, height: string | number): this {
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
    get_frame_while_hidden(): { width: number; height: number } {
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
    sync_height_from(node: AnyElement, process?: (height: number) => number): this {
        if ((node as any)._sync_height_info === undefined) {
            (node as any)._sync_height_info = {
                sync_to: [this],
                on_resize(e: VElement) {
                    for (const to_node of (node as any)._sync_height_info.sync_to) {
                        to_node.height(process === undefined ? node.clientHeight : process(node.clientHeight))
                    }
                },
            };
            node.on_resize((node as any)._sync_height_info.on_resize)
        } else {
            (node as any)._sync_height_info.sync_to.push(this);
        }
        return this;
    }
    sync_height_to(node: AnyElement | AnyElement[], process?: (height: number) => number): this {
        if (Array.isArray(node)) {
            for (const n of node) {
                this.sync_height_to(n, process);
            }
            return this;
        }
        if ((this as any)._sync_height_info === undefined) {
            (this as any)._sync_height_info = {
                sync_to: [node],
                on_resize: (e: VElement) => {
                    for (const to_node of (this as any)._sync_height_info.sync_to) {
                        to_node.height(process === undefined ? this.clientHeight : process(this.clientHeight))
                    }
                },
            };
            this.on_resize((this as any)._sync_height_info.on_resize)
        } else {
            (this as any)._sync_height_info.sync_to.push(this);
        }
        return this;
    }

    /**
     * Set a square frame width and height.
     */
    square(size: string | number = "100%"): this {
        this.flex(0).fixed_frame(size, size);
        return this;
    }

    /** Set circle border radius */
    circle(): this {
        this.border_radius("50%");
        return this;
    }

    /**
     * @docs:
     * @title: Padding
     * @desc: Sets the padding of the element based on the number of provided arguments. 
     *        It can accept 1, 2, or 4 values to set padding for different sides.
     * @param:
     *     @name: values
     *     @descr: The padding values to set. Can be a single value, two values for vertical and horizontal, 
     *              or four values for top, right, bottom, and left.
     * @return:
     *     @description Returns the instance of the element for chaining.
     * @funcs: 4
     */
    padding(): string;
    padding(value: undefstrnr): this;
    padding(top_bottom: undefstrnr, left_right: undefstrnr): this;
    padding(top: undefstrnr, right: undefstrnr, bottom: undefstrnr, left: undefstrnr): this;
    // padding(...values: [] | [undefstrnr] | [undefstrnr, undefstrnr] | [undefstrnr, undefstrnr, undefstrnr, undefstrnr]): string | this {
    // padding(...values: any[]): string | this {
    padding(...values) {
        if (values.length === 0) {
            return this.style.padding ?? "";
        } else if (values.length === 1) {
            this.style.padding = this.pad_numeric(values[0] ?? "");
        } else if (values.length === 2) {   
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
        } else if (values.length === 4) {
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
        } else {
            console.error("Invalid number of arguments for function \"padding()\".");
        }
        return this;
    }

    /**
     * @docs:
     * @title: Padding Bottom
     * @desc: Sets the bottom padding of an element. The equivalent of CSS attribute `paddingBottom`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @descr: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    padding_bottom(): number;
    padding_bottom(value: string | number): this;
    padding_bottom(value?: string | number): this | number {
        if (value == null) { return this._try_parse_float(this.style.paddingBottom, 0); }
        this.style.paddingBottom = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Padding Left
     * @desc: Sets the left padding of an element. The equivalent of CSS attribute `paddingLeft`.
     * Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    padding_left(): number;
    padding_left(value: string | number): this;
    padding_left(value?: string | number): this | number {
        if (value == null) { return this._try_parse_float(this.style.paddingLeft, 0); }
        this.style.paddingLeft = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Padding Right
     * @desc: Sets the right padding of an element, equivalent to the CSS attribute `paddingRight`.
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining, unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    padding_right(): number;
    padding_right(value: string | number): this;
    padding_right(value?: string | number): this | number {
        if (value == null) { return this._try_parse_float(this.style.paddingRight, 0); }
        this.style.paddingRight = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Padding Top
     * @desc: Sets the top padding of an element. The equivalent of CSS attribute `paddingTop`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @descr: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    padding_top(): number;
    padding_top(value: string | number): this;
    padding_top(value?: string | number): this | number {
        if (value == null) { return this._try_parse_float(this.style.paddingTop, 0); }
        this.style.paddingTop = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Margin
     * @desc: Sets the margin of the element. Can accept 1, 2, or 4 values for different margin settings.
     * @param:
     *     @name: values
     *     @descr: The values for the margin. Can be a single value, two values for vertical and horizontal margins, or four values for each side.
     * @return:
     *     @description Returns the instance of the element for chaining.
     * @funcs: 4
     */
    margin(): string;
    margin(value: undefstrnr): this;
    margin(
        top_bottom: undefstrnr, 
        left_right: undefstrnr
    ): this;
    margin(
        top: undefstrnr,
        right: undefstrnr,
        bottom: undefstrnr,
        left: undefstrnr,
    ): this;
    margin(...values: [] | [undefstrnr] | [undefstrnr, undefstrnr] | [undefstrnr, undefstrnr, undefstrnr, undefstrnr]): string | this {
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

    /**
     * @docs:
     * @title: Margin Bottom
     * @desc: Sets the bottom margin of an element. The equivalent of CSS attribute `marginBottom`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    margin_bottom(): number;
    margin_bottom(value: string | number): this;
    margin_bottom(value?: string | number): this | number {
        if (value == null) { return this._try_parse_float(this.style.marginBottom, 0); }
        this.style.marginBottom = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Margin Left
     * @desc: Sets the left margin of an element, equivalent to the CSS attribute `marginLeft`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    margin_left(): number;
    margin_left(value: string | number): this;
    margin_left(value?: string | number): this | number {
        if (value == null) { return this._try_parse_float(this.style.marginLeft, 0); }
        this.style.marginLeft = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Margin Right
     * @desc: Sets the right margin of an element, equivalent to the CSS attribute `marginRight`. 
     *        Returns the attribute value when the parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign to the right margin. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the instance of the element for chaining unless the parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    margin_right(): number;
    margin_right(value: string | number): this;
    margin_right(value?: string | number): this | number {
        if (value == null) { return this._try_parse_float(this.style.marginRight, 0); }
        this.style.marginRight = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Margin Top
     * @desc: Sets the top margin of an element. The equivalent of CSS attribute `marginTop`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    margin_top(): number;
    margin_top(value: string | number): this;
    margin_top(value?: string | number): this | number {
        if (value == null) { return this._try_parse_float(this.style.marginTop, 0); }
        this.style.marginTop = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Position
     * @desc: Sets or retrieves the position style of the element. Can be used with 0, 1, or 4 arguments.
     * @param:
     *     @name: values
     *     @descr: The values for setting the position, which can be a single value or four values for top, right, bottom, and left.
     * @return:
     *     @description Returns the current position if no arguments are passed, or the instance of the element for chaining when arguments are provided.
     * @funcs: 3
     */
    position(): string | undefined;
    position(value: number | string): this;
    position(top?: number | string | none, right?: number | string | none, bottom?: number | string | none, left?: number | string | none): this;
    position(...values): string | undefined | this {
        if (values.length === 0) {
            return this.style.position;
        } else if (values.length === 1) {
            this.style.position = values[0] as string;
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
    stretch(value: boolean): this {
        if (value == true) {
            this.style.flex = "1";
        } else {
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
    wrap(value: boolean | string): this {
        switch ((this.constructor as any).element_tag) {
            case "div":
                if (value === true) {
                    this.flex_wrap("wrap")
                } else if (value === false) {
                    this.flex_wrap("nowrap")
                } else {
                    this.flex_wrap(value)
                }
                break;
            default:
                if (value === true) {
                    this.style.whiteSpace = "wrap";
                    this.style.textWrap = "wrap";
                    this.style.overflowWrap = "break-word";
                } else if (value === false) {
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
    z_index(value: number | string): this {
        this.style.zIndex = (value as any).toString();
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
    side_by_side(options: {
        columns?: number;
        hspacing?: number;
        vspacing?: number;
        stretch?: boolean;
        hide_dividers?: boolean;
    }): this {
        const {
            columns = 2,
            hspacing = 10,
            vspacing = 10,
            stretch = true,
            hide_dividers = false,
        } = options;

        if (this.element_name !== "HStackElement" && this.element_name !== "AnchorHStackElement") {
            throw Error("This function is only supported for element \"HStackElement\".");
        }

        // Vars.
        let col_children: any[] = [];
        let row_width = 0;
        let row = 0;
        let highest_margin: number | undefined = undefined;

        // Styling.
        this.box_sizing("border-box");

        // Set flex basis.
        const flex_basis = (child: any, basis: number, margin: number) => {
            if (margin === 0) {
                child.width(`${basis * 100}%`);
                child.min_width(`${basis * 100}%`);
                child.max_width(`${basis * 100}%`);
            } else {
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
                } else {
                    flex_basis(child, i[1] == null ? 1 / columns : i[1], margin / columns);
                }
                ++index;
            });
        };

        // Check if the child is the last non-divider child.
        const is_last_non_divider = (child: any) => {
            if (child.nextElementSibling == null) {
                return true;
            } else if (child.nextElementSibling.element_name !== "DividerElement") {
                return false;
            } else {
                return is_last_non_divider(child.nextElementSibling);
            }
        };

        // Iterate children.
        this.iterate((child: any) => {
            // Divider element.
            if (child.element_name === "DividerElement") {
                if (col_children.length > 0 && hide_dividers) {
                    child.hide();
                } else {
                    child.show();
                    child.margin_top(vspacing);
                    child.margin_bottom(0);
                    flex_basis(child, 1.0, 0);
                }
            } else {
                // Only one column.
                if (columns === 1) {
                    child.fixed_width("100%");
                    child.stretch(true);
                    child.box_sizing("border-box");
                    child.margin_left(0); // reset for when it is called inside @media.
                    if (row > 0) {
                        child.margin_top(vspacing);
                    } else {
                        child.margin_top(0); // reset for when it is called inside @media.
                    }
                    ++row;
                } else {
                    const is_last_node = is_last_non_divider(child);
                    const child_custom_basis = child._side_by_side_basis;
                    const basis = child_custom_basis == null ? 1 / columns : child_custom_basis;

                    child.stretch(true);
                    child.box_sizing("border-box");
                    child.margin_left(0); // reset for when it is called inside @media.
                    if (row > 0) {
                        child.margin_top(vspacing);
                    } else {
                        child.margin_top(0); // reset for when it is called inside @media.
                    }

                    if (row_width + basis > 1) {
                        set_flex();
                        ++row;
                        row_width = 0;
                        col_children = [];
                        col_children.push([child, child_custom_basis]);
                    } else if (row_width + basis === 1 || is_last_node) {
                        col_children.push([child, child_custom_basis]);
                        set_flex();
                        ++row;
                        row_width = 0;
                        col_children = [];
                    } else {
                        col_children.push([child, child_custom_basis]);
                        row_width += basis;
                    }
                }
            }
        });
        return this;
    }

    /**
     * @docs:
     * @title: Side By Side Basis
     * @desc: Sets or retrieves the side by side basis for a node, which must be a floating percentage between 0.0 and 1.0.
     * @param:
     *     @name: basis
     *     @descr: The basis value to set or retrieve.
     * @return:
     *     @description When an argument is passed, this function returns the instance of the element for chaining. Otherwise, it returns the already set side by side basis.
     * @funcs: 2
     */
    side_by_side_basis(): number | undefined;
    side_by_side_basis(basis: number | false): this;
    side_by_side_basis(basis?: number | false | null): number | undefined | this {
        if (basis == null) { return this._side_by_side_basis; }
        else if (basis === false) {
            this._side_by_side_basis = undefined;
        } else {
            this._side_by_side_basis = basis;
        }
        return this;
    }

    /**
     * @docs:
     * @title: Ellipsis Overflow
     * @desc: Configures the text overflow behavior with ellipsis. It can enable or disable ellipsis and set the number of lines.
     * @param:
     *     @name: to
     *     @descr: Indicates whether to enable or disable ellipsis. If `null`, it returns the current state.
     * @param:
     *     @name: after_lines
     *     @descr: The number of lines after which ellipsis should be applied. Only relevant when `to` is `true`.
     * @return:
     *     @description Returns the instance of the element for chaining.
     * @funcs: 2
     */
    ellipsis_overflow(): boolean;
    ellipsis_overflow(to: boolean, after_lines?: number | none): this;
    ellipsis_overflow(to?: boolean, after_lines?: number | none): boolean | this {
        if (to == null) {
            return this.style.textOverflow === "ellipsis";
        } else if (to === true) {
            this.style.textOverflow = "ellipsis";
            this.style.overflow = "hidden";
            this.style.textWrap = "wrap";
            this.style.overflowWrap = "break-word";
            if (after_lines != null) {
                (this.style as any).webkitLineClamp = after_lines.toString();
                (this.style as any).webkitBoxOrient = "vertical";
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

    /**
     * @docs:
     * @title: Align
     * @desc: Sets or retrieves the alignment style of the element based on its type.
     * @param:
     *     @name: value
     *     @descr: The alignment value to set or retrieve based on the element type.
     * @return:
     *     @description When an argument is passed, this function returns the instance of the element for chaining. Otherwise, it returns the currently set alignment value.
     * @funcs: 2
     */
    // @ts-ignore
    align(): string;
    // @ts-ignore
    align(value: string): this;
    // @ts-ignore
    align(value?: string): string | this {
        switch (this.base_element_name) {
            case "HStackElement":
            case "AnchorHStackElement":
            case "ZStackElement":
                if (value == null) { return this.style.justifyContent; }
                if (value === "default") { value = ""; }
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
                if (value == null) { return this.style.alignItems; }
                if (value === "default") { value = "normal"; }
                if (this.style.alignItems !== value) {
                    this.style.alignItems = value ?? "";
                }
                return this;
            default:
                if (value == null) { return this.style.textAlign; }
                if (value === "default") { value = "normal"; }
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
    leading(): this {
        return this.align("start");
    }

    /**
     * @docs:
     * @title: Center Alignment
     * @desc: Sets the alignment of the element to center.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    center(): this {
        return this.align("center");
    }

    /**
     * @docs:
     * @title: Trailing
     * @desc: Aligns the element to the end.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    trailing(): this {
        return this.align("end");
    }

    /**
     * @docs:
     * @title: Align Vertical
     * @desc: Sets or retrieves the vertical alignment style of the element based on its type.
     * @param:
     *     @name: value
     *     @descr: The alignment value to set or retrieve.
     * @return:
     *     @description Returns the instance of the element for chaining when an argument is passed. Otherwise, returns the current alignment value.
     * @funcs: 2
     */
    align_vertical(): string;
    align_vertical(value: string): this;
    align_vertical(value?: string): string | this {
        switch (this.base_element_name) {
            case "HStackElement":
            case "AnchorHStackElement":
            case "ZStackElement":
                if (value == null) { return this.style.alignItems; }
                if (value === "default") { value = "normal"; }
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
                if (value == null) { return this.style.justifyContent; }
                if (value === "default") { value = ""; }
                if (value !== this.style.justifyContent) {
                    this.style.justifyContent = value ?? "";
                }
                return this;
            case "TextElement":
                if (value == null) { return this.style.alignItems; }
                if (this.style.display == null || !this.style.display.includes("flex")) {
                    this.display("flex");
                }
                if (value !== this.style.alignItems) {
                    this.style.alignItems = value ?? "";
                }
                return this;
            default:
                if (value == null) { return this.style.justifyContent; }
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
    leading_vertical(): this {
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
    center_vertical(only_on_no_overflow: boolean = false): this {
        if (only_on_no_overflow) {
            this.on_render((e: any) => {
                setTimeout(() => {
                    if (e.scrollHeight > e.clientHeight) {
                        e.align_vertical("default");
                    } else {
                        e.center_vertical();
                    }
                }, 50)
            })
            this.on_resize((e: any) => {
                if (e.scrollHeight > e.clientHeight) {
                    e.align_vertical("default");
                } else {
                    e.center_vertical();
                }
            })
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
    trailing_vertical(): this {
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
    align_text(value: string): this {
        return this.text_align(value);
    }

    /**
     * @docs:
     * @title: Text Leading
     * @desc: Sets the text alignment to the start position for leading text.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    text_leading(): this {
        return this.text_align("start");
    }

    /**
     * @docs:
     * @title: Text Center
     * @desc: Sets the text alignment of the element to center.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    text_center(): this {
        return this.text_align("center");
    }

    /**
     * @docs:
     * @title: Text Trailing
     * @desc: Sets the text alignment to 'end' for trailing text.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    text_trailing(): this {
        return this.text_align("end");
    }

    /**
     * @docs:
     * @title: Align Height
     * @desc: Aligns items by height inside a horizontal stack.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    align_height(): this {
        return this.align_items("stretch");
    }

    /**
     * @docs:
     * @title: Text Wrap
     * @desc: Set the text wrap value, equivalent to the CSS attribute `textWrap`. 
     *        Returns the attribute value when the parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    text_wrap(): string;
    text_wrap(value: string): this;
    text_wrap(value?: string): string | this {
        if (value == null) { return this.style.textWrap; }
        this.style.textWrap = value;
        return this;
    }

    /**
     * @docs:
     * @title: Line clamp
     * @desc: This non-standard CSS property allows you to limit the number of lines shown in a block container. When used in conjunction with `-webkit-box-orient`, it specifies the maximum number of lines to display before truncating the text. Text that exceeds this limit is cut off and typically ends with an ellipsis. This property is particularly useful for creating text overflow effects in web design where maintaining a consistent, visually manageable block of text is necessary.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object for chaining unless parameter `value` is `null`, in which case the attribute's value is returned.
     * @funcs: 2
     */
    line_clamp(): string;
    line_clamp(value: string): this;
    line_clamp(value?: string): string | this {
        if (value == null) { return this.style.webkitLineClamp; }
        (this.style as any).webkitLineClamp = value;
        return this;
    }

    /**
     * @docs:
     * @title: Box Orient
     * @desc: This property is part of the old flexbox model and is used to define the orientation of the children in a flex container. In combination with `-webkit-line-clamp`, it's set to vertical to allow the line clamping effect on block containers. It dictates how the children of the box are laid out: horizontally or vertically. Note that `-webkit-box-orient` is specific to Webkit-based browsers and is not part of the standard CSS flexbox properties.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    box_orient(): string;
    box_orient(value: string): this;
    box_orient(value?: string): string | this {
        if (value == null) { return this.style.webkitBoxOrient; }
        (this.style as any).webkitBoxOrient = value;
        return this;
    }

    // ---------------------------------------------------------
    // Styling functions.

    /**
     * @docs:
     * @title: Color
     * @desc: Sets the color of text, also supports a `GradientType` element. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned. 
     *                   When the value is `null` and the color has been set using a `GradientType`, `transparent` will be returned.
     * @funcs: 2
     */
    color(): string;
    color(value: string | GradientType): this;
    color(value?: string | GradientType): string | this {
        if (value == null) { return this.style.color ?? ""; }
        if (value instanceof GradientType) {
            this.style.backgroundImage = value.gradient ?? "";
            this.style.backgroundClip = "text";
            this.style["-webkit-background-clip"] = "text";
            this.style.color = "transparent";
        } else if ((value as any)._is_gradient || value.startsWith("linear-gradient(") || value.startsWith("radial-gradient(")) {
            this.style.backgroundImage = value;
            this.style.backgroundClip = "text";
            this.style["-webkit-background-clip"] = "text";
            this.style.color = "transparent";
        } else {
            this.style.color = value;
        }
        return this;
    }

    /**
     * @docs:
     * @title: Border
     * @desc: Sets the border style of the element. Can accept one to three arguments to define border properties.
     * @param:
     *     @name: values
     *     @descr: The values to set the border style.
     * @return:
     *     @description When no arguments are passed, returns the current border style. When arguments are passed, returns the instance of the element for chaining.
     * @funcs: 4
     */
    // @ts-ignore
    border(): string;
    // @ts-ignore
    border(value: string): this;
    // @ts-ignore
    border(width: string | number, color: string): this;
    // @ts-ignore
    border(width: string | number, style: string, color: string): this;
    // @ts-ignore
    border(...values: (string | number)[]): this | string {
        if (values.length === 0) {
            return this.style.border ?? "";
        } else if (values.length === 1) {
            this.style.border = values[0] as string;
        } else if (values.length === 2) {
            this.style.border = this.pad_numeric(values[0]) + " solid " + values[1].toString();
        } else if (values.length === 3) {
            this.style.border = this.pad_numeric(values[0]) + " " + values[1].toString() + " " + values[2].toString();
        } else {
            console.error("Invalid number of arguments for function \"border()\".");
        }
        return this;
    }

    /**
     * @docs:
     * @title: Border Top
     * @desc: Sets the border top style for the element. Returns the current value when no parameters are provided.
     * @param:
     *     @name: values
     *     @descr: Values to set the border top, can include width, style, and color.
     * @return:
     *     @description Returns the current border top value if no parameters are provided; otherwise returns the instance of the element for chaining.
     * @funcs: 4
     */
    border_top(): string;
    border_top(value: string | number): this;
    border_top(width: string | number, color: string): this;
    border_top(width: string | number, style: string, color: string): this;
    border_top(...values: (string | number)[]): this | string {
        if (values.length === 0) {
            return this.style.borderTop;
        } else if (values.length === 1) {
            this.style.borderTop = values[0] as string;
        } else if (values.length === 2) {
            this.style.borderTop = this.pad_numeric(values[0]) + " solid " + values[1].toString();
        } else if (values.length === 3) {
            this.style.borderTop = this.pad_numeric(values[0]) + " " + values[1].toString() + " " + values[2].toString();
        } else {
            console.error("Invalid number of arguments for function \"border_top()\".");
        }
        return this;
    }

    /**
     * @docs:
     * @title: Border Bottom
     * @desc: Sets the border bottom style of the element. Returns the attribute value when no parameters are defined.
     * @param:
     *     @name: values
     *     @descr: A variable number of values to set the border bottom style.
     * @return:
     *     @description Returns the current border bottom style when no arguments are passed, otherwise returns the instance for chaining.
     * @funcs: 4
     */
    border_bottom(): string;
    border_bottom(value: string): this;
    border_bottom(width: string | number, color: string): this;
    border_bottom(width: string | number, style: string, color: string): this;
    border_bottom(...values: (string | number)[]): this | string {
        if (values.length === 0) {
            return this.style.borderBottom;
        } else if (values.length === 1) {
            this.style.borderBottom = values[0] as string;
        } else if (values.length === 2) {
            this.style.borderBottom = this.pad_numeric(values[0]) + " solid " + values[1].toString();
        } else if (values.length === 3) {
            this.style.borderBottom = this.pad_numeric(values[0]) + " " + values[1].toString() + " " + values[2].toString();
        } else {
            console.error("Invalid number of arguments for function \"border_bottom()\".");
        }
        return this;
    }

    /**
     * @docs:
     * @title: Border Right
     * @desc: Sets the border-right property of the element. 
     *        Returns the current value if no parameters are provided.
     * @param:
     *     @name: values
     *     @descr: The values to set for the border-right property.
     * @return:
     *     @description Returns the instance of the element for chaining when parameters are provided, 
     *                  otherwise returns the current value of the border-right property.
     * @funcs: 4
     */
    border_right(): string;
    border_right(value: string): this;
    border_right(width: string | number, color: string): this;
    border_right(width: string | number, style: string, color: string): this;
    border_right(...values: (string | number)[]): this | string {
        if (values.length === 0) {
            return this.style.borderRight;
        } else if (values.length === 1) {
            this.style.borderRight = values[0] as string;
        } else if (values.length === 2) {
            this.style.borderRight = this.pad_numeric(values[0]) + " solid " + values[1].toString();
        } else if (values.length === 3) {
            this.style.borderRight = this.pad_numeric(values[0]) + " " + values[1].toString() + " " + values[2].toString();
        } else {
            console.error("Invalid number of arguments for function \"border_right()\".");
        }
        return this;
    }

    /**
     * @docs:
     * @title: Border Left
     * @desc: Sets the left border style of the element. Returns the current value if no parameters are provided.
     * @param:
     *     @name: values
     *     @descr: The values to set for the border-left property.
     * @return:
     *     @description Returns the current value of the left border when no parameters are provided, otherwise returns the instance of the element for chaining.
     * @funcs: 2
     */
    border_left(): string;
    border_left(value: string): this;
    border_left(width: string | number, color: string): this;
    border_left(width: string | number, style: string, color: string): this;
    border_left(...values: (string | number)[]): this | string {
        if (values.length === 0) {
            return this.style.borderLeft;
        } else if (values.length === 1) {
            this.style.borderLeft = values[0] as string;
        } else if (values.length === 2) {
            this.style.borderLeft = this.pad_numeric(values[0]) + " solid " + values[1].toString();
        } else if (values.length === 3) {
            this.style.borderLeft = this.pad_numeric(values[0]) + " " + values[1].toString() + " " + values[2].toString();
        } else {
            console.error("Invalid number of arguments for function \"border_left()\".");
        }
        return this;
    }


    /**
     * @docs:
     * @title: Shadow
     * @desc: Sets the box shadow of the element. Can accept either 1 or 4 arguments for different shadow styles.
     * @param:
     *     @name: values
     *     @descr: The values to set the box shadow. Can be a single value or four separate values.
     * @return:
     *     @description Returns the current box shadow if no arguments are provided, or the instance of the element for chaining.
     * @funcs: 2
     */
    shadow(): string;
    shadow(value: string | number): this;
    shadow(value1: string | number, value2: string | number, value3: string | number, value4: string | string): this;
    shadow(...values: (number | string)[]): string | this {
        if (values.length === 0) {
            return this.style.boxShadow ?? "";
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
            return "";
        }
    }

    /**
     * @docs:
     * @title: Drop Shadow
     * @desc: Applies a drop shadow effect to the object. Can handle 0, 1, or 4 arguments.
     * @param:
     *     @name: values
     *     @descr: The values for the drop shadow effect, which can be numbers or null.
     * @return:
     *     @description Returns the instance of the element for chaining when arguments are provided. If no arguments are passed, it returns the current filter value.
     * @funcs: 3
     */
    drop_shadow(): string;
    drop_shadow(value: string | number): this;
    drop_shadow(value1: string | number, value2: string | number, value3: string | number, value4: string): this;
    drop_shadow(...values: (number | string)[]): string | this {
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
            return "";
        }
    }

    /**
     * @docs:
     * @title: Greyscale
     * @desc: Applies a greyscale filter to the element. Returns the current filter if no value is provided.
     * @param:
     *     @name: value
     *     @descr: The percentage value for greyscale. Can be a number or null.
     * @return:
     *     @description Returns the current filter value if no argument is passed, otherwise returns the instance for chaining.
     * @funcs: 2
     */
    greyscale(): string;
    greyscale(value: number): this;
    greyscale(value?: number): string | this {
        if (value == null) {
            return this.filter();
        } else {
            return this.filter("grayscale(" + this.pad_percentage(value, "") + ") ");
        }
    }

    /**
     * @docs:
     * @title: Opacity
     * @desc: Set or get the opacity of the element based on its type.
     * @param:
     *     @name: value
     *     @descr: The value of the opacity to set, or null to get the current opacity.
     * @return:
     *     @description Returns the current opacity value if no argument is passed. When an argument is passed, it returns the instance of the element for chaining.
     * @funcs: 2
     */
    opacity(): string | number;
    opacity(value: string | number): this;
    opacity(value?: string | number): this | string | number {
        switch (this.base_element_name) {
            case "StyleElement":
                if (value == null) {
                    return this._try_parse_float(this.filter(this.edit_filter_wrapper(this.style.filter, "opacity", value)), 1);
                } else {
                    if (typeof value === "number" && value <= 1.0) {
                        value *= 100;
                    }
                    return this.filter(this.edit_filter_wrapper(this.style.filter, "opacity", "opacity(" + value + ") "));
                }
            default:
                if (value == null) { return this._try_parse_float(this.style.opacity, 1); }
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
    toggle_opacity(value: number): this {
        if (typeof this.style.opacity === "undefined" || this.style.opacity == "" || this.style.opacity == "1.0") {
            this.style.opacity = value.toString()
        } else {
            this.style.opacity = "1.0"
        }
        return this;
    }

    /**
     * @docs:
     * @title: Blur
     * @desc: Applies a blur effect to the element using the specified value.
     * @param:
     *     @name: value
     *     @descr: The amount of blur to apply, can be a number or null.
     * @return:
     *     @description Returns the instance of the element for chaining.
     * @funcs: 2
     */
    blur(): string;
    blur(value: number): this;
    blur(value?: number): string | this {
        if (value == null) {
            return this.filter(this.edit_filter_wrapper(this.style.filter, "blur", value));
        } else {
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
    toggle_blur(value: number = 10): this {
        return this.filter(this.toggle_filter_wrapper(this.style.filter, "blur", "blur(" + this.pad_numeric(value) + ") "));
    }

    /**
     * @docs:
     * @title: Background Blur
     * @desc: Sets or retrieves the background blur effect for the element.
     * @param:
     *     @name: value
     *     @descr: The value to set for the blur effect, which can be a number or null.
     * @return:
     *     @description Returns the current blur effect if no argument is passed, otherwise returns the instance of the element for chaining.
     * @funcs: 2
     */
    background_blur(): string;
    background_blur(value: number | null): this;
    background_blur(value?: number | null): string | this {
        if (value == null) {
            return this.backdrop_filter(this.edit_filter_wrapper(this.style.backdropFilter, "blur", value));
        } else {
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
    toggle_background_blur(value: number = 10): this {
        return this.backdrop_filter(this.toggle_filter_wrapper(this.style.backdropFilter, "blur", "blur(" + this.pad_numeric(value) + ") "));
    }

    /**
     * @docs:
     * @title: Brightness
     * @desc: Adjusts the brightness of an element's filter. If no value is provided, it returns the current brightness filter.
     * @param:
     *     @name: value
     *     @descr: The brightness level to set, can be a number or null.
     * @return:
     *     @description Returns the instance of the element for chaining if a value is provided. Otherwise, returns the current brightness filter.
     * @funcs: 2
     */
    brightness(): string;
    brightness(value: number): this;
    brightness(value?: number): string | this {
        if (value == null) {
            return this.filter(this.edit_filter_wrapper(this.style.filter, "brightness", value));
        } else {
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
    toggle_brightness(value: number = 0.5): this {
        return this.filter(this.toggle_filter_wrapper(this.style.filter, "brightness", "brightness(" + this.pad_percentage(value, "%") + ") "));
    }

    /**
     * @docs:
     * @title: Background Brightness
     * @desc: Adjusts the brightness of the background using a specified value. 
     * If no value is provided, it retrieves the current backdrop filter.
     * @param:
     *     @name: value
     *     @descr: The brightness value to set, or null to get the current value.
     * @return:
     *     @description Returns the instance of the element for chaining when a value is provided, or the current backdrop filter value if no value is given.
     * @funcs: 2
     */
    background_brightness(): string;
    background_brightness(value: number): this;
    background_brightness(value?: number): string | this {
        if (value == null) {
            return this.backdrop_filter(this.edit_filter_wrapper(this.style.backdropFilter, "brightness", value));
        } else {
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
    toggle_background_brightness(value: number = 10): this {
        return this.backdrop_filter(this.toggle_filter_wrapper(this.style.backdropFilter, "brightness", "brightness(" + this.pad_percentage(value, "%") + ") "));
    }

    /**
     * @docs:
     * @title: Rotate
     * @desc: Sets the rotation transformation for the element. When called without an argument, it retrieves the current rotation.
     * @param:
     *     @name: value
     *     @descr: The value to set as the rotation. It can be a number, string, or null.
     * @return:
     *     @description Returns the current rotation value as a string when no argument is passed. When an argument is provided, it returns the instance of the element for chaining.
     * @funcs: 2
     */
    rotate(): string;
    rotate(value: number | string): this;
    rotate(value?: number | string): string | this {
        if (value == null) {
            return this.transform(this.edit_filter_wrapper(this.style.transform, "rotate", value));
        } else {
            let degree: any = 0;
            if (Utils.is_float(value)) {
                degree = Math.round(360 * (value as number));
            } else if (Utils.is_numeric(value)) {
                degree = (value as any).toString();
            } else if (typeof value === "string" && value.charAt(value.length - 1) === "%") {
                // degree = Math.round(360 * parseFloat(value.substr(0, (value as string).length - 1) / 100));
                degree = Math.round(360 * (parseFloat(value.substr(0, (value as string).length - 1)) / 100));
            } else {
                degree = value;
            }
            return this.transform(this.edit_filter_wrapper(this.style.transform, "rotate", `rotate(${degree as string}deg) `));
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
    delay(value: string | number): this {
        (this.style as any).delay = value as string;
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
    duration(value: string | number): this {
        (this.style as any).duration = value as string;
        return this;
    }

    /**
     * @docs:
     * @title: Background
     * @desc: A shorthand property for all the background properties. 
     *        The equivalent of CSS attribute `background`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    background(): string;
    background(value: string): this;
    background(value?: string): string | this {
        if (value == null) { return this.style.background; }
        if (typeof value === "string" && (value.startsWith("linear-gradient") || value.startsWith("radial-gradient"))) {
            this.style.background = value;
            this.style.backgroundImage = value;
            this.style.backgroundRepeat = "no-repeat";
            this.style.backgroundSize = "cover";
        } else {
            this.style.background = value as string;
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
    scale_font_size(scale: number = 1.0): this {
        const size = parseFloat(this.style.fontSize);
        if (!isNaN(size)) {
            this.font_size(size * scale);
        }
        return this;
    }
    font_size_ratio(scale: number = 1.0) {
        return this.scale_font_size(scale);
    }


    // ---------------------------------------------------------
    // Visibility functions.

    /**
     * @docs:
     * @title: Display
     * @desc: Sets or retrieves the display style of an HTML element. 
     *         If no value is provided, it returns the current display style.
     * @param:
     *     @name: value
     *     @descr: The value to set for the display style.
     * @return:
     *     @descr: Returns the current display style if no argument is passed, 
     *              otherwise returns the instance of the element for chaining.
     * @funcs: 2
     */
    display(): string;
    display(value: string): this;
    display(value?: string): string | this {
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
    hide(): this {
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
    show(): this {
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
    is_hidden(): boolean {
        return this.style.display === "none" || typeof this.style.display === "undefined";
    }

    /**
     * @docs:
     * @title: Is Visible
     * @desc: Checks if the element is visible based on its display style.
     * @return:
     *     @description Returns true if the element is visible, false otherwise.
     */
    is_visible(): boolean {
        return !(this.style.display === "none" || typeof this.style.display === "undefined");
    }

    /**
     * @docs:
     * @title: Toggle Visibility
     * @desc: Toggles the visibility of the element by showing or hiding it based on its current state.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    toggle_visibility(): this {
        if (this.is_hidden()) {
            this.show();
        } else {
            this.hide();
        }
        return this;
    }

    // ---------------------------------------------------------
    // General attribute functions.

    /**
     * @docs:
     * @title: Inner HTML
     * @desc: Get or set the inner HTML of an element.
     * @param:
     *     @name: value
     *     @descr: The HTML content to set. If no value is provided, the current inner HTML is returned.
     * @return:
     *     @description Returns the current inner HTML if no argument is passed, otherwise returns the instance of the element for chaining.
     * @funcs: 2
     */
    inner_html(): string;
    inner_html(value: string): this;
    inner_html(value?: string): string | this {
        if (value == null) {
            return this.innerHTML;
        }
        this.innerHTML = value;
        return this;
    }

    /**
     * @docs:
     * @title: Outer HTML
     * @desc: Get or set the outer HTML of the element. If no argument is passed, it returns the current outer HTML.
     * @param:
     *     @name: value
     *     @descr: The outer HTML to set.
     * @return:
     *     @description Returns the instance of the element for chaining when an argument is passed, otherwise returns the current outer HTML.
     * @funcs: 2
     */
    outer_html(): string;
    outer_html(value: string): this;
    outer_html(value?: string): string | this {
        if (value == null) {
            return this.outerHTML;
        }
        this.outerHTML = value;
        return this;
    }

    /**
     * @docs:
     * @title: Styles
     * @desc: Retrieves the CSS attributes when no parameter is provided, or sets the styles based on the provided attributes.
     * @param:
     *     @name: css_attr
     *     @descr: The CSS attributes to set. If null, returns the current styles.
     * @return:
     *     @description When no argument is passed, returns the current styles as an object. When attributes are set, returns the instance of the element for chaining.
     * @funcs: 2
     */
    styles(): Record<string, string>;
    styles(css_attr: Record<string, any>): this;
    styles(css_attr?: Record<string, any>): Record<string, string> | this {
        if (css_attr == null) {
            let dict: { [key: string]: string } = {};
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
                    else if (this.element_name === "StyleElement") {
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
                this._element_display = value;
            }
            this.style[i] = value;
        }   
        return this;
    }

    /**
     * @docs:
     * @title: Attribute
     * @desc: Get or set a single attribute for an element. If no value is provided, it retrieves the attribute's current value.
     * @param:
     *     @name: key
     *     @descr: The name of the attribute to get or set.
     * @param:
     *     @name: value
     *     @descr: The value to set for the attribute. If null, the current value is returned.
     * @return:
     *     @description Returns the current value of the attribute if no value is provided, otherwise returns the instance of the element for chaining.
     * @funcs: 2
     */
    attr(key: string): null | string;
    attr(key: string, value: string | number | null): this;
    attr(key: string, value?: string | number | null): null | string | this {
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
    attrs(html_attr: Record<string, string | number | boolean>): this {
        for (let i in html_attr) {
            this.setAttribute(i, html_attr[i].toString());
        }
        return this;
    }

    /**
     * @docs:
     * @title: Event
     * @desc: Get or set a single event associated with the element. 
     *         If no value is provided, it retrieves the current event.
     * @param:
     *     @name: key
     *     @descr: The name of the event to get or set.
     * @param:
     *     @name: value
     *     @descr: The value to set for the event, if provided.
     * @return:
     *     @description Returns the instance of the element for chaining when setting, 
     *                  or the current value of the event when getting.
     * @funcs: 2
     */
    event(key: string): any;
    event(key: string, value: any): this;
    event(key: string, value?: any): this | any {
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
    events(html_events: { [key: string]: EventListener }): this {
        for (let i in html_events) {
            this[i] = html_events[i];
        }
        return this;
    }

    /**
     * @docs:
     * @title: Class
     * @description: 
     *     Specifies one or more classnames for an element (refers to a class in a style sheet).
     *     The equivalent of HTML attribute `class`.
     *     Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    class(): string;
    class(value: string): this;
    class(value?: string): string | this {
        if (value == null) { return this.className ?? ""; }
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
    toggle_class(name: string): this {
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
    remove_class(name: string): this {
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
    remove_classes(): this {
        while (this.classList.length > 0) {
            this.classList.remove(this.classList.item(0) as string);
        }
        return this;
    }

    /**
     * @docs:
     * @title: Hover Brightness
     * @desc: Controls the brightness effects on hover for the element. 
     * You can enable or disable the effect or specify brightness levels.
     * @param:
     *     @name: mouse_down_brightness
     *     @descr: The brightness value when the mouse is down, or a boolean to enable/disable.
     * @param:
     *     @name: mouse_over_brightness
     *     @descr: The brightness value when the mouse is over the element.
     * @return:
     *     @description Returns the instance of the element for chaining when setting values, or a boolean indicating if the effect is enabled when no parameters are passed.
     * @funcs: 3
     */
    hover_brightness(): boolean;
    hover_brightness(mouse_down_brightness: boolean): this;
    hover_brightness(mouse_down_brightness: number, mouse_over_brightness: number): this;
    hover_brightness(mouse_down_brightness?: boolean | number, mouse_over_brightness: number = 0.9): this | boolean {
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
            this.onmousedown = () => { this.style.filter = `brightness(${mouse_down_brightness as number * 100}%)`; }
            this.onmouseover = () => { this.style.filter = `brightness(${mouse_over_brightness as number * 100}%)`; }
            this.onmouseup = () => { this.style.filter = "brightness(100%)"; }
            this.onmouseout = () => { this.style.filter = "brightness(100%)"; }
            return this;
        }

        // Retrieve enabled.
        else {
            return this.onmousedown != null;
        }
    }

    // track last pointer position globally
    private static _lastPointerPos = { x: 0, y: 0 };
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
    public is_mouse_over_frame(): boolean {
        const { x, y } = VElement._lastPointerPos;
        const rect = this.getBoundingClientRect();
        return (
            x >= rect.left &&
            x <= rect.right &&
            y >= rect.top &&
            y <= rect.bottom
        );
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
    hover_transitions(items: {
        target: "this" | "self" | AnyElement,
        selected: any,
        unselected: any,
        methods: string[]
        duration?: number,
        easing?: string,
    }[]): this {

        // Set transitions.
        for (let item of items) {
            const target = item.target === "this" || item.target === "self" ? this : item.target
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
            const a_target = target as any
            if (transition_mask && a_target.transition_mask) {
                // console.log("[volt] transition:", transition, a_target.transition_mask);
                a_target.transition_mask(transition);
            } else if (a_target.transition) {
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
                    };
                }
            }
        });
        this.on_mouse_out(() => {
            if (!this._is_button_disabled) {
                for (let item of items) {
                    for (const method of item.methods) {
                        item.target[method](item.unselected);
                    };
                }
            }
        })
        return this;
    }

    /**
     * @docs:
     * @title: Text Width
     * @desc: Calculates the width of the provided text or the current text content if no text is provided. This is useful for measuring text width in input elements.
     * @param:
     *     @name: text
     *     @descr: The text whose width is to be measured. If null, the current text content is used.
     * @return:
     *     @description Returns the width of the text in pixels.
     */
    text_width(): number;
    text_width(text: string): number;
    text_width(text?: string): number {
        const width_measurer = document.createElement("canvas").getContext("2d");
        if (width_measurer == null) { throw new Error("Unable to create a 2d canvas context."); }
        const computed = window.getComputedStyle(this as any);
        width_measurer.font = `${computed.fontStyle} ${computed.fontVariant} ${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`;
        if (text == null) {
            return width_measurer.measureText(this.textContent ?? "").width;
        } else {
            return width_measurer.measureText(text).width;
        }
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
    media(
        media_query: string,
        true_handler?: ElementCallback<this>,
        false_handler?: ElementCallback<this>
    ): this {
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
            this._media_queries[media_query].list.removeListener(this._media_queries[media_query].callback as any);
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
                } else if (false_handler !== undefined) {
                    false_handler(e);
                }
            }
        }

        // Watch media.
        query.callback(query.list as unknown as MediaQueryList); // Initialize the style based on the initial media query state
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
    remove_media(media_query: string): this {
        if (typeof this._media_queries === "object" && this._media_queries[media_query] !== undefined) {
            this._media_queries[media_query].list.removeListener(this._media_queries[media_query].callback as any);
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
    remove_medias(): this {
        if (typeof this._media_queries === "object") {
            Object.values(this._media_queries).forEach((query) => {
                query.list.removeListener(query.callback as any);
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
    remove_all_media(): this {
        if (typeof this._media_queries === "object") {
            Object.values(this._media_queries).forEach((query) => {
                query.list.removeListener(query.callback as any);
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
    default_animate(...args: any[]): this {
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
    animate(options: {
        keyframes: Array<any>;
        delay?: number;
        duration?: number;
        repeat?: boolean;
        persistent?: boolean;
        on_finish?: ((element: any) => any) | null;
        easing?: string;
    }): this {
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
                options.keyframes[i] = (options.keyframes[i] as VElement).styles();
            } else {
                for (let key in options.keyframes[i]) {
                    if (Utils.is_numeric(options.keyframes[i][key]) && convert.includes(key)) {
                        options.keyframes[i][key] = this.pad_numeric(options.keyframes[i][key]);
                    }
                }
            }
        }

        function do_animation(index: number) {
            if (index + 1 < options.keyframes.length) {
                const from = options.keyframes[index];
                const to = options.keyframes[index + 1];
                let opts = {
                    duration: options.duration,
                    fill: undefined as undefined | string,
                };
                if ((from as any).duration != null) {
                    opts.duration = (from as any).duration;
                }
                if (
                    (index + 2 == options.keyframes.length && options.persistent && !options.repeat) ||
                    ((to as any).delay != null && (to as any).delay > 0)
                ) {
                    opts.fill = "forwards";
                }
                e.default_animate(
                    [from, to],
                    opts,
                );
                if (to.delay != null && to.delay > 0) {
                    clearTimeout(e._animate_timeout);
                    e._animate_timeout = setTimeout(() => do_animation(index + 1), ((from as any).duration || options.duration) + (to.delay || 0));
                } else {
                    clearTimeout(e._animate_timeout);
                    e._animate_timeout = setTimeout(() => do_animation(index + 1), (from as any).duration || options.duration);
                }
            } else if (options.repeat) {
                if (options.delay !== undefined && options.delay > 0) {
                    clearTimeout(e._animate_timeout);
                    e._animate_timeout = setTimeout(() => do_animation(0), options.delay);
                } else {
                    const delay = (options.keyframes[options.keyframes.length - 1] as any).duration || options.duration;
                    clearTimeout(e._animate_timeout);
                    e._animate_timeout = setTimeout(() => do_animation(0), delay);
                }
            } else if (options.on_finish != null) {
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
    stop_animation(): this {
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
    async slide_out(options: {
        direction: string;
        distance: number;
        duration: number;
        opacity?: boolean;
        easing?: string;
        hide?: boolean;
        remove?: boolean;
        display?: string;
        _slide_in?: boolean;
    }): Promise<void> {
        const element = this;
        return new Promise((resolve, reject) => {

            // Vars.
            const old_transform = element.transform() || "";
            const old_transition = element.transition();
            let transform, initial_transform;
            if (options._slide_in) {
                if (options.direction === "top") {
                    transform = `translateY(0)`;
                    initial_transform = `translateY(${-options.distance}px)`
                } else if (options.direction === "bottom") {
                    transform = `translateY(0)`;
                    initial_transform = `translateY(${options.distance}px)`
                } else if (options.direction === "right") {
                    transform = `translateX(0)`;
                    initial_transform = `translateX(${options.distance}px)`
                } else if (options.direction === "left") {
                    transform = `translateX(0)`;
                    initial_transform = `translateX(${-options.distance}px)`
                } else {
                    return reject(new Error(`Invalid direction "${options.direction}", the valid directions are "top", "bottom", "right", "left".`));
                }
            } else {
                if (options.direction === "top") {
                    transform = `translateY(${-options.distance}px)`;
                    initial_transform = "translateY(0)";
                } else if (options.direction === "bottom") {
                    transform = `translateY(${options.distance}px)`;
                    initial_transform = "translateY(0)";
                } else if (options.direction === "right") {
                    transform = `translateX(${options.distance}px)`;
                    initial_transform = "translateX(0)";
                } else if (options.direction === "left") {
                    transform = `translateX(${-options.distance}px)`;
                    initial_transform = "translateX(0)";
                } else {
                    return reject(new Error(`Invalid direction "${options.direction}", the valid directions are "top", "bottom", "right", "left".`));
                }
            }
            initial_transform = old_transform + initial_transform;
            transform = old_transform + transform;

            // Set initial state.
            if (options._slide_in) {
                if (options.display !== undefined) {
                    element.display(options.display);
                } else {
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
            } else {
                element.opacity(options._slide_in ? 1 : 0)
                element.transform(transform);
            }
            
            // Resolve animation.
            setTimeout(() => {

                // Hide element.
                if (options.hide && options._slide_in !== true) {
                    element.hide()
                } else if (options.remove && options._slide_in !== true) {
                    element.remove();
                }

                // Restore old transition.
                element.transition(old_transition);
                element.transform(old_transform);

                // Resolve.
                resolve()
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
    async slide_in({
        direction = "top",
        distance = 100,
        duration = 500,
        opacity = true,
        easing = "ease",
        display = undefined,
    }: {
        direction?: string;
        distance?: number;
        duration?: number;
        opacity?: boolean;
        easing?: string;
        display?: string;
    }): Promise<any> {
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
    async dropdown_animation({
        distance = "-20px",
        duration = 150,
        opacity_duration = 1.25,
        total_duration = undefined,
        delay = 60,
        start_delay = 50,
        easing = "ease-in-out",
    }: {
        distance?: string,
        duration?: number,
        opacity_duration?: number,
        total_duration?: number,
        delay?: number,
        start_delay?: number,
        easing?: string,
    } = {}): Promise<void> {
        return new Promise((resolve) => {

            // Initialize.
            const word_spans: any[] = [];
            const spans: any[] = [];
            const nodes = this.childNodes;

            // Args.
            if (typeof distance === "number") {
                distance = `${distance}px`;
            }
            if (total_duration !== undefined) {
                if (typeof this.textContent === "string") {
                    delay = total_duration / this.textContent.length;
                } else {
                    delay = total_duration;
                }
            }

            // Convert each character into a span.
            const split_text = (text: string, text_style: string | null = null) => {
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
            }
            const traverse = (nodes: NodeList, text_style: string = "") => {
                for (let n = 0; n < nodes.length; n++) {
                    const node = nodes[n] as any;
                    if (node.nodeType === Node.TEXT_NODE) {
                        split_text(node.textContent, text_style);
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
    async increment_number_animation({
        start = 0,
        end = 100,
        duration = 150,
        total_duration = undefined,
        delay = 0,
        prefix = "",
        suffix = "",
    }: {
        start?: number;
        end?: number;
        duration?: number;
        total_duration?: number;
        delay?: number;
        prefix?: string;
        suffix?: string;
    } = {}): Promise<void> {
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
                } else {
                    resolve();
                }
            }
            setTimeout(animate, delay);
        })
    }

    // Fade out.
    fade_out_top(size: number = 0.05) {
        this.mask_image(`linear-gradient(0deg, #000 ${100.0 - size*100}%, transparent)`);
        return this;
    }
    fade_out_right(size: number = 0.05) {
        this.mask_image(`linear-gradient(90deg, #000 ${100.0 - size*100}%, transparent)`);
        return this;
    }
    fade_out_bottom(size: number = 0.05) {
        this.mask_image(`linear-gradient(180deg, #000 ${100.0 - size*100}%, transparent)`);
        return this;
    }
    fade_out_left(size: number = 0.05) {
        this.mask_image(`linear-gradient(270deg, #000 ${100.0 - size*100}%, transparent)`);
        return this;
    }

    // ---------------------------------------------------------
    // Events.

    // Set on event.
    // 
    on(
        type: keyof HTMLElementEventMap,
        callback: (element: this, event: HTMLElementEventMap[keyof HTMLElementEventMap]) => any,
        options?: boolean | AddEventListenerOptions
    ): this {
        this.addEventListener(type, (event) => callback(this, event), options);
        return this;
    }
    on_event_listener<K extends keyof HTMLElementEventMap>(
        type: K,
        callback: (element: this, event: HTMLElementEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions
    ): this {
        this.addEventListener(type, (event) => callback(this, event), options);
        return this;
    }

    /**
     * @docs:
     * @title: On emit
     * @desc: Registers an event callback for the specified event ID. This allows the element to respond to events.
     * @param:
     *     @name: id
     *     @descr: The unique identifier for the event to listen for.
     *     @name: callback
     *     @descr: The function to be executed when the event is triggered.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    on_emit(id: string, callback: (element: this, args: Record<string, any>) => any): this {
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
    remove_on_event(id: string, callback: (element: this, args: Record<string, any>) => any): this {
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
    remove_on_events(id: string): this {
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
    timeout(delay: number, callback: ElementCallback<this>, options?: { id?: string; debounce?: boolean } | null): this {
        if (options != null && options.id != null) {
            if (options.debounce === true) {
                clearTimeout(this._timeouts[options.id]);
            }
            this._timeouts[options.id] = setTimeout(() => callback(this), delay);
        } else {
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
    clear_timeout(id: string | number): this {
        if (this._timeouts === undefined) {
            this._timeouts = {};
        }
        clearTimeout(this._timeouts[id]);
        return this;
    }

    private _disabled_cursor?: string;
    /**
     * @docs:
     * @title: Disable Button
     * @desc: Disables the button element, preventing user interaction.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    disable(): this {
        this._disabled_cursor = this.style.cursor;
        this.style.cursor = "not-allowed";
        this._is_button_disabled = true;
        return this;
    }

    /**
     * @docs:
     * @title: Enable Button
     * @desc: Enables the button by setting the disabled state to false.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    enable(): this {
        if (this._disabled_cursor) {
            this.style.cursor = this._disabled_cursor;
        } else if (this.style.cursor === "not-allowed") {
            this.style.cursor = "pointer";
        }
        this._is_button_disabled = false;
        return this;
    }

    /**
     * @docs:
     * @title: On Click
     * @desc: Sets a click event handler for the element, allowing for optional simulated href behavior.
     * @param:
     *     @name: simulate_href
     *     @descr: The simulated href to set for the element (for SEO in SPAs).
     *     @name: callback
     *     @descr: The function to be called when the element is clicked.
     * @return:
     *     @description Returns the instance of the element for chaining when an argument is passed, otherwise returns the current onclick handler.
     * @funcs: 2
     */
    /**
     * @warning NEVER change that this overrides the last on click callback
     *          Volt & libris depend on this behaviour.
     *          Let users add multiple etc using the `on()` method.
     */
    on_click(): null | Function;
    on_click(simulate_href: string | null, callback: Function): this;
    on_click(callback?: Function): this;
    on_click(...args: any[]): this | null | Function {
        let simulate_href: string | null, callback: Function | undefined;
        if (args.length === 0) {
            return this.onclick;
        } else if (args.length === 1) {
            callback = args[0];
        } else if (args.length === 2 && args[0] == null) {
            callback = args[1];
        } else {
            simulate_href = args[0];
            callback = args[1];
            if (typeof simulate_href === "string") {
                if ((this.constructor as any).element_tag !== "a") {
                    console.error(new Error("The on click href can only be set on anchor elements."))
                } else {
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
     * @docs:
     * @title: On Click Redirect
     * @desc: Sets up a click event that redirects to the specified URL when triggered.
     * @param:
     *     @name: url
     *     @descr: The URL to redirect to when the click event occurs.
     * @return:
     *     @descr: Returns the instance of the element for chaining.
     */
    on_click_redirect(url: string): this {
        return this.on_click(url, () => Utils.redirect(url));
    }

    /**
     * @docs:
     * @title: On Scroll
     * @description: 
     *     Script to be run when an element's scrollbar is being scrolled.
     *     The equivalent of HTML attribute `onscroll`. The first parameter of the callback is the `VElement` object.
     *     Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: opts_or_callback
     *     @description: Options or callback function to assign for the scroll event.
     *     @attr:
     *         @name: callback
     *         @description Function to be called on scroll.
     *         @name: delay
     *         @description Delay in milliseconds before executing the callback.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     */
    on_scroll(): (EventListener | null);
    on_scroll(opts_or_callback: Function | {
        callback: (element: any, event: Event) => any,
        delay?: number
    }): this;
    on_scroll(opts_or_callback?: Function | {
        callback: (element: any, event: Event) => any,
        delay?: number
    }): this | EventListener | null {
        if (opts_or_callback == null) { return this.onscroll; }

        if (typeof opts_or_callback === "function") {
            const e = this;
            this.onscroll = (event) => opts_or_callback(e, event);
        }

        else {
            if (typeof opts_or_callback.delay === "number") {
                let timer;
                const e = this;
                this.onscroll = function(t) {
                    clearTimeout(timer);
                    setTimeout(() => opts_or_callback.callback(e, t), opts_or_callback.delay);
                }
            } else {
                this.onscroll = (e) => opts_or_callback.callback(this, e);
            }
        }
        return this;
    }

    /**
     * @docs:
     * @title: On Resize
     * @desc: Script to be run when the browser window is being resized. 
     *        This allows for a callback to be executed upon resizing the window.
     * @param:
     *     @name: callback
     *     @descr: The function to be called when the window is resized.
     * @param:
     *     @name: once
     *     @descr: If true, the callback will only be executed once after the last resize event.
     * @param:
     *     @name: delay
     *     @descr: The delay in milliseconds before executing the callback.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    on_window_resize(): null | Function;
    on_window_resize(opts: Function | {callback?: Function, once?: boolean, delay?: number}): this;
    on_window_resize(opts?: Function | {callback?: Function, once?: boolean, delay?: number}): this | null | Function {

        // Set defaults.
        if (typeof opts === "function") {
            opts = {callback: opts};
        } else if (typeof opts !== "object") {
            opts = {};
        }
        opts.once ??= false;
        opts.delay ??= 25;

        // Get.
        if (opts.callback == null) { return window.onresize; }

        const e = this;
        window.addEventListener('resize', () => {
            if (opts.once && e._on_window_resize_timer != null) {
                clearTimeout(e._on_window_resize_timer)
            }
            e._on_window_resize_timer = setTimeout(() => (opts.callback as Function)(e), opts.delay);
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
     *     @attr:
     *         @name: read
     *         @description Indicates whether to read the file data.
     *     @attr:
     *         @name: compress
     *         @description Function to compress the data, `Compression.compress` is advised.
     *     @attr:
     *         @name: on_start
     *         @description Function to be called when the drag starts.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    on_attachment_drop(options: {
        callback: (args: { name: string; path: string; is_dir: boolean; data: any; compressed: boolean; file: File; size: number; }) => any;
        read?: boolean;
        compress?: (string) => any;
        on_start?: (event: DragEvent) => any;
    }): this {
        const { callback, read = true, compress = undefined, on_start = () => {} } = options;
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
                                data: null as null | string | Uint8Array,
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
                                            args.data = compress(event.target.result as any as string);
                                            args.compressed = true;
                                        } else {
                                            args.data = event.target?.result as any;
                                            args.compressed = false;
                                        }
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
        }

        return this;
    }

    /**
     * @docs:
     * @title: On Appear
     * @desc: Sets a callback to be executed when the element appears in the viewport.
     * @param:
     *     @name: callback_or_opts
     *     @descr: Can be a callback function or an options object containing callback, repeat, and threshold.
     *     @attr:
     *         @name: callback
     *         @description The function to call when the element appears.
     *         @name: repeat
     *         @description If true, the callback will be called every time the element appears.
     *         @name: threshold
     *         @description The intersection ratio threshold to trigger the callback.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    on_appear<T = this>(callback: OnAppearCallback<T>): this;
    on_appear<T = this>(options: { callback: OnAppearCallback<T>; repeat?: boolean, threshold?: number | null }): this;
    on_appear<T = this>(callback_or_opts?: 
        OnAppearCallback<T> | 
        { callback: OnAppearCallback<T>, repeat?: boolean; threshold?: number | null }
    ): this {
        let callback = callback_or_opts, repeat = false, threshold: number | null = null;
        if (typeof callback_or_opts === "object") {
            callback = callback_or_opts.callback;
            if (callback_or_opts.repeat !== undefined) { repeat = callback_or_opts.repeat; }
            if (callback_or_opts.threshold !== undefined) { threshold = callback_or_opts.threshold; }
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(async (entry) => {
                const element = entry.target as any;
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
                        observer.unobserve(element as any);
                        return;
                    }

                    let matched = false;
                    if ((threshold == null || intersection_ratio >= threshold)) {
                        matched = true;
                        (callback as Function)(element, { scroll_direction });
                    }

                    if (matched === false) {
                        observer.unobserve(element as any);
                        observer.observe(element as any);
                    } else if (repeat === false) {
                        observer.unobserve(element as any);
                        observer.disconnect();
                    }
                }
            });
        });

        // Push.
        this._on_appear_callbacks.push({ callback, threshold, repeat });

        observer.observe(this as any);
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
    on_disappear<T = this>(callback_or_opts?: ((element: T) => any) | { callback?: (element: T) => any; repeat?: boolean }): this {
        const element = this; // Assuming 'this' is the element
        let callback: ((element: T) => any) | null = null;
        let repeat = false;

        if (typeof callback_or_opts === 'object') {
            callback = callback_or_opts.callback || null;
            if (callback_or_opts.repeat !== undefined) repeat = callback_or_opts.repeat;
            // if (callback_or_opts.threshold !== undefined) {
            //     console.error(`Invalid parameter "threshold".`);
            // }
        } else if (typeof callback_or_opts === 'function') {
            callback = callback_or_opts;
        }

        // Store previous values per element
        (element as any)._on_disappear_is_visible = false;

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                // Check if the intersection ratio has crossed below the threshold while scrolling down
                if (entry.isIntersecting) {
                    (element as any)._on_disappear_is_visible = true;
                } else if ((element as any)._on_disappear_is_visible && !entry.isIntersecting) {
                    (element as any)._on_disappear_is_visible = false;

                    // VElement is about to disappear
                    if (callback) {
                        (callback as Function)(element);
                    }

                    if (!repeat) {
                        observer.unobserve(element as any);
                    }
                }
            });
        });

        observer.observe(element as any);

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
    //              (
    //                  element._previousIntersectionRatio > threshold &&
    //                  currentIntersectionRatio <= threshold &&
    //                  scroll_direction === 'down'
    //              ) ||
    //              (
    //                  element._previousIntersectionRatio < (1 - threshold) &&
    //                  currentIntersectionRatio >= (1 - threshold) &&
    //                  scroll_direction === 'up'
    //              )
    //             ) {
    //              console.log("Dissapear by threshold", currentIntersectionRatio, element)
    //                 // VElement is about to disappear
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


    /**
     * @docs:
     * @title: On Enter
     * @desc: Sets a callback function to be executed when the Enter key is pressed on input or textarea elements.
     * @param:
     *     @name: callback
     *     @descr: The function to be called when the Enter key is pressed.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    on_enter(): undefined | ElementKeyboardEvent<this>;
    on_enter(callback: ElementKeyboardEvent<this>): this;
    on_enter(callback?: ElementKeyboardEvent<this>): this | undefined | ElementKeyboardEvent<this> {
        if (callback == null) {
            return this._on_enter_callback;
        }
        this._on_enter_callback = callback;
        if (this._on_keypress_set !== true) {
            this._on_keypress_set = true;
            const e = this;
            super.onkeypress = (event: KeyboardEvent) => {
                if (this._on_enter_callback !== undefined && event.key === "Enter" && event.shiftKey === false) {
                    this._on_enter_callback(e, event);
                } else if (this._on_escape_callback !== undefined && event.key === "Escape") {
                    this._on_escape_callback(e, event);
                }
            }   
        }
        return this;
    }

    /**
     * @docs:
     * @title: On Escape
     * @desc: Sets a callback function to be triggered when the Escape key is pressed.
     * @param:
     *     @name: callback
     *     @descr: The function to be called when the Escape key is pressed.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    on_escape(): undefined | ElementKeyboardEvent<this>;
    on_escape(callback: ElementKeyboardEvent<this>): this;
    on_escape(callback?: ElementKeyboardEvent<this>): this | undefined | ElementKeyboardEvent<this> {
        if (callback == null) {
            return this._on_escape_callback;
        }
        this._on_escape_callback = callback;
        if (this._on_keypress_set !== true) {
            this._on_keypress_set = true;
            const e = this;
            super.onkeypress = (event: KeyboardEvent) => {
                if (this._on_enter_callback !== undefined && event.key === "Enter" && event.shiftKey === false) {
                    this._on_enter_callback(e, event);
                } else if (this._on_escape_callback !== undefined && event.key === "Escape") {
                    this._on_escape_callback(e, event);
                }
            }   
        }
        return this;
    }

    /**
     * @docs:
     * @title: On Theme Update
     * @desc: Manages theme update callbacks. If no callback is provided, it returns the current callbacks.
     * @param:
     *     @name: callback
     *     @descr: A function to be called on theme updates or null to retrieve existing callbacks.
     * @return:
     *     @description Returns the instance of the element for chaining when a callback is provided, or the array of existing callbacks if null is passed.
     * @funcs: 2
     */
    on_theme_update(): ThemeUpdateCallback<this>[];
    on_theme_update(callback: ThemeUpdateCallback<this>): this;
    on_theme_update(callback?: ThemeUpdateCallback<this>): ThemeUpdateCallback<this>[] | this {
        if (callback == null) {
            return this._on_theme_updates;
        }   

        const found = Themes.theme_elements.iterate((item) => {
            if (item.element === this) {
                return true;
            }
        })
        if (found !== true) {
            Themes.theme_elements.push({
                element: this,
            });
        }

        this._on_theme_updates.push(callback)
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
    remove_on_theme_update(callback: ThemeUpdateCallback<this>): this {
        this._on_theme_updates = vlib.Array.drop(this._on_theme_updates, callback);
        return this;
    }

    /**
     * @docs:
     * @title: Remove on Theme Updates
     * @desc: Clears the list of theme update callbacks if they exist.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    remove_on_theme_updates(): this {
        this._on_theme_updates = [];
        return this;
    }

    /**
     * @docs:
     * @title: On Render
     * @desc: Manages callbacks that are triggered when the element is added to the body.
     * @param:
     *     @name: callback
     *     @descr: A function to be called when the element is rendered. If no argument is passed, it returns the current callbacks.
     * @return:
     *     @description When a callback is provided, returns the instance of the element for chaining. If no callback is provided, returns the array of current callbacks.
     * @funcs: 2
     */
    on_render(): (ElementCallback<this>)[];
    on_render(callback: ElementCallback<this>): this;
    on_render(callback?: ElementCallback<this>): (ElementCallback<this>)[] | this {
        if (callback == null) {
            return this._on_render_callbacks;
        }
        this._on_render_callbacks.push(callback);
        if (!this._observing_on_render) {
            this._observing_on_render = true;
            Utils.on_render_observer.observe(this as any);
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
    remove_on_render(callback: ElementCallback<this>): this {
        this._on_render_callbacks = vlib.Array.drop(this._on_render_callbacks, callback);
        if (this._on_render_callbacks.length === 0) {
            Utils.on_render_observer.unobserve(this as any);
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
    remove_on_renders(): this {
        this._on_render_callbacks = [];
        Utils.on_render_observer.unobserve(this as any);
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
    is_rendered(): boolean {
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
    on_load(callback: (element: this, args: Record<string, any>) => any): this {
        Events.on("volt.on_load", this, callback);
        return this;
    }

    /**
     * @docs:
     * @title: Remove on Load
     * @desc: Removes a callback function from the "volt.on_load" event.
     * @param:
     *     @name: callback
     *     @descr: The function to be removed from the event listener.
     * @return:
     *     @descr: Returns the instance of the element for chaining.
     */
    remove_on_load(callback: (element: this, args: Record<string, any>) => any): this {
        Events.remove("volt.on_load", this, callback);
        return this;
    }

    /**
     * @docs:
     * @title: Remove On Loads
     * @desc: Removes the on_load event listener from the instance.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    remove_on_loads(): this {
        Events.remove("volt.on_load", this);
        return this;
    }

    /**
     * @docs:
     * @title: On Resize
     * @desc: Manages callbacks for the resize event. Can retrieve existing callbacks or add new ones.
     * @param:
     *     @name: callback
     *     @descr: The callback function to be executed on resize events.
     * @return:
     *     @descr: When a callback is provided, returns the instance for chaining. Otherwise, returns the list of existing resize callbacks.
     * @funcs: 2
     */
    on_resize(): (ElementCallback<this>)[];
    on_resize(callback: ElementCallback<this>): this;
    on_resize(callback?: ElementCallback<this>): (ElementCallback<this>)[] | this {
        if (callback == null) {
            return this._on_resize_callbacks;
        }
        this._on_resize_callbacks.push(callback);
        if (!this._observing_on_resize) {
            this._observing_on_resize = true;
            Utils.on_resize_observer.observe(this as any);
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
    remove_on_resize(callback: ElementCallback<this>): this {
        this._on_resize_callbacks = vlib.Array.drop(this._on_resize_callbacks, callback);
        if (this._on_resize_callbacks.length === 0) {
            Utils.on_resize_observer.unobserve(this as any);
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
    remove_on_resizes(): this {
        this._on_resize_callbacks = [];
        Utils.on_resize_observer.unobserve(this as any);
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
    on_resize_rule(
        evaluation: (element: this) => boolean,
        on_true?: ElementCallback<this>,
        on_false?: ElementCallback<this>,
    ): this {
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
    on_shortcut(shortcuts: {
        match?: (event: KeyboardEvent, key: string, shortcut: any) => boolean;
        key?: string;
        keys?: string[];
        keycode?: number;
        keycodes?: number[];
        or?: boolean;
        duration?: number;
        shift?: boolean;
        alt?: boolean;
        ctrl?: boolean;
        allow_other_modifiers?: boolean;
        callback: (element: any, event: KeyboardEvent) => any;
    }[] = []): this {

        // Check if a shortcut was matched.
        const is_match = (key: string, event: KeyboardEvent, shortcut: any): boolean => {   

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
                        (this._on_shortcut_key === keys[0] && key === keys[1]) ||
                        (this._on_shortcut_key === keys[1] && key === keys[0])
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
                        this._on_shortcut_keycode === keys[0] && event.keyCode === keys[1] ||
                        this._on_shortcut_keycode === keys[1] && event.keyCode === keys[0]
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
            super.tabIndex = 0;
            this.outline("none");
            this.border("none");
        }
        
        // Set key down handler.
        this.onkeydown = (event: KeyboardEvent) => {

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
        }

        return this;
    }

    /**
     * MOVED docs:
     * @title: On Context Menu
     * @desc: 
     *     Script to be run when a context menu is triggered. This function can set or get the context menu callback.
     * @param:
     *     @name: callback
     *     @descr: 
     *         The parameter may either be a callback function, a ContextMenu object, or an Array as the ContextMenu parameter.
     * @return:
     *     @description Returns the `VElement` object. If `callback` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    // on_context_menu(): ContextMenuElement | Function | undefined;
    // on_context_menu(callback: Function | ContextMenuElement | any[]): this;
    // on_context_menu(callback?: Function | ContextMenuElement | any[]): this | ContextMenuElement | Function | undefined {
    //  if (callback == null) {
    //      if (this._context_menu !== undefined) {
    //          return this._context_menu;
    //      } else {
    //          return this.oncontextmenu ?? undefined;
    //      }
    //  }
    //  if (callback instanceof ContextMenuElement || (callback as any).element_name === "ContextMenuElement") {
    //      this._context_menu = callback as ContextMenuElement;
    //      const _this_ = this;
    //      this.oncontextmenu = (event) => {
    //          if (this._context_menu instanceof ContextMenuElement) {
    //              this._context_menu.popup(event);
    //          }
    //      };
    //  } else if (Array.isArray(callback)) {
    //      this._context_menu = ContextMenu(callback);
    //      const _this_ = this;
    //      this.oncontextmenu = (event) => {
    //          if (this._context_menu instanceof ContextMenuElement) {
    //              this._context_menu.popup(event);
    //          }
    //      };
    //  } else {
    //      const _this_ = this;
    //      this.oncontextmenu = (event) => callback(_this_, event);
    //  }
    //  return this;
    // }

    /**
     * @docs:
     * @title: On Mouse Enter
     * @desc: Sets a callback function to be called when the mouse enters the element.
     * @param:
     *     @name: callback
     *     @descr: The function to be called on mouse enter.
     * @return:
     *     @descr: When a callback is provided, returns the instance of the element for chaining. If no callback is provided, returns the current callback.
     * @funcs: 2
     */
    on_mouse_enter(): ElementMouseEvent<this>;
    on_mouse_enter(callback: ElementMouseEvent<this>): this;
    on_mouse_enter(callback?: ElementMouseEvent<this>): this | ElementMouseEvent<this> {
        if (callback == null) { return this._on_mouse_enter_callback; }
        this._on_mouse_enter_callback = callback;
        const e = this;
        this.addEventListener("mouseenter", (t) => callback(e, t));
        return this;
    }

    /**
     * @docs:
     * @title: On Mouse Leave
     * @desc: Sets or retrieves the callback function to be called when the mouse leaves the element.
     * @param:
     *     @name: callback
     *     @descr: The function to execute when the mouse leaves the element.
     * @return:
     *     @description When an argument is passed this function returns the instance of the element for chaining. Otherwise, it returns the currently set callback function.
     * @funcs: 2
     */
    on_mouse_leave(): ElementMouseEvent<this>;
    on_mouse_leave(callback: ElementMouseEvent<this>): this;
    on_mouse_leave(callback?: ElementMouseEvent<this>): this | ElementMouseEvent<this> {
        if (callback == null) { return this._on_mouse_leave_callback; }
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
    on_mouse_over_out(mouse_over: ElementMouseEvent<this>, mouse_out: ElementMouseEvent<this>): this {
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
     * @docs:
     * @title: First Child
     * @desc: Retrieves the first child of the element.
     * @return:
     *     @description Returns the first child node of the element, or null if there are no children.
     */
    first_child(): Node | null {
        return this.firstChild;
    }

    /**
     * @docs:
     * @title: Last Child
     * @desc: Retrieves the last child of the element.
     * @return:
     *     @description Returns the last child node of the element, or null if there are no children.
     */
    last_child(): ChildNode | null {
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
    iterate(start: number | ((child: any, index: number) => any), end?: number, handler?: (child: any, index: number) => any): any {
        if (typeof start === "function") {
            handler = start as (node: any, index: number) => any;
            start = 0;
        }
        if (typeof start !== "number") {
            start = 0;
        }
        if (typeof end !== "number") {
            end = this.children.length as any;
        }
        if (handler == undefined) {
            throw new Error("Parameter 'handler' is undefined.");
        }
        // @ts-ignore
        for (let i: number = start; i < end; i++) {    
            const res = handler(this.children[i] as any, i);
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
    iterate_nodes(start: number | ((node: any, index: number) => any), end?: number, handler?: (node: any, index: number) => any): any {
        if (typeof start === "function") {
            handler = start as (node: any, index: number) => any;
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
        for (let i: number = start; i < end; i++) {    
            const res = handler(this.childNodes[i] as any, i);
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
     *     @descr: The type to set as default, defaults to VElement if null.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    set_default(Type?: any): this {
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
    assign(name: string, value: any): this {
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
     * @docs:
     * @title: Extend
     * @desc: Extends the current instance by adding properties or functions from the provided object.
     * @param:
     *     @name: obj
     *     @descr: The object containing properties or functions to add to the current instance.
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    // extend<T extends object>(props: T): this & T {
    // extend<T extends Record<string, (...args: any[]) => any>>(methods: T & ThisType<MyClass & T>): this & T {
    extend<T extends Record<string, any>>(props: T & ThisType<this & T>): this & T {
        Object.assign(this, props);
        return this as this & T;
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
    select(overwrite: boolean = true): this {
        // @ts-ignore
        if (super.select != undefined) {
            // @ts-ignore
            super.select();
            return this;
        }
        this.focus();
        const range = document.createRange();
        range.selectNodeContents(this as any);
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
    is_scrollable(): boolean {
        return this.scrollHeight > this.clientHeight || this.scrollWidth > this.clientWidth;
    }

    /**
     * @docs:
     * @title: Is Scrollable X
     * @desc: Checks if the element is scrollable in the horizontal direction by comparing its scroll width with its client width.
     * @return:
     *     @description Returns true if the element is scrollable horizontally, otherwise false.
     */
    is_scrollable_x(): boolean {
        return this.scrollWidth > this.clientWidth;
    }

    /**
     * @docs:
     * @title: Is Scrollable Y
     * @desc: Checks if the element is scrollable vertically by comparing its scroll height to its client height.
     * @return:
     *     @description Returns true if the element is scrollable in the Y direction, otherwise false.
     */
    is_scrollable_y(): boolean {
        return this.scrollHeight > this.clientHeight;
    }

    /**
     * @docs:
     * @title: Wait Till Children Rendered
     * @desc: Waits until the element and all its children are fully rendered. 
     * This function should only be used in the `on_render` callback. 
     * Note that it does not work with non-volt nodes and may not function correctly.
     * @param:
     *     @name: timeout
     *     @descr: The maximum time to wait for rendering in milliseconds.
     *     @default: 10000
     * @return:
     *     @description Returns a promise that resolves when all children are rendered or rejects on timeout.
     */
    async wait_till_children_rendered(timeout: number = 10000): Promise<void> {
        return new Promise((resolve, reject) => {
            // Vars.
            let elapsed = 0;
            let step = 25;
            let nodes: any[] = [];

            // Map all nodes.
            const map_nodes = (node: any) => {
                nodes.push(node);
                for (let i = 0; i < node.children.length; i++) {
                    map_nodes(node.children[i]);
                }
            }
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
                })
                if (rendered) {
                    // console.log("resolve", rendered);
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
    pseudo(type: string, node: any): this {
        // @note: The node type does not strictly have to be a PseudoElement.

        // Gen id.
        if (node.pseudo_id === undefined) {
            node.pseudo_id = "pseudo_" + vlib.String.random(24);
        }

        // Set content.
        if (node.style.content == null) {
            node.style.content = "";
        }

        // Add the current element to the pseudo's added to elements.
        if (node.added_to_elements === undefined) {
            node.added_to_elements = [];
        }
        const alread_added = node.added_to_elements.iterate((item: any) => {
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
        } else {
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
    remove_pseudo(node: any): this {
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
     *      Removes all pseudo classes and stylesheets associated with the element. 
     *      This function iterates through the class list and removes classes that start with "pseudo_".
     * @return:
     *     @description Returns the instance of the element for chaining.
     */
    remove_pseudos(): this {
        this.classList.forEach(name => {
            if (name.startsWith("pseudo_")) {
                this.classList.remove(name);
            }
        })
        Object.values(this._pseudo_stylesheets).forEach(stylesheet => { stylesheet.remove(); })
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
    pseudo_on_hover(type: string, node: any, set_defaults: boolean = true): this {
        if (set_defaults) {
            node.position(0, 0, 0, 0);
            const border_radius = this.border_radius();
            if (border_radius && typeof node.border_radius === "function") {
                node.border_radius(border_radius);
            }
            if (this.position() !== "absolute") {
                this.position("relative")
            }
        }
        this.on_mouse_over(() => this.pseudo(type, node))
        this.on_mouse_out(() => this.remove_pseudo(node))
        return this;
    }

    // ---------------------------------------------------------
    // Parent functions.

    /**
     * @docs:
     * @title: Parent
     * @desc: Get or set the parent element of the current element. 
     *         This is particularly relevant for child elements of specific derived classes.
     * @param:
     *     @name: value
     *     @descr: The parent element to set or null to retrieve the current parent.
     * @return:
     *     @description If a value is provided, it sets the parent and returns the instance for chaining. 
     *                  If no value is provided, it returns the current parent element or null if not set.
     * @funcs: 2
     */
    parent<T = undefined | VElement | HTMLElement>(): T;
    parent(value: any): this;
    parent<T = undefined | VElement | HTMLElement>(value?: any): T | this {
        if (value == null) {
            if (this._parent == null || this._parent === undefined) {
                return (this.parentElement ?? undefined) as T;
            }
            return this._parent as T;
        }
        this._parent = value;
        return this;
    }

    /**
     * @docs:
     * @title: Absolute Parent
     * @desc: Sets or gets the absolute parent of the custom element. 
     * When called without arguments, it returns the current absolute parent; 
     * when called with an argument, it sets the absolute parent and returns the instance for chaining.
     * @param:
     *     @name: value
     *     @descr: The absolute parent to set.
     * @return:
     *     @descr: Returns the instance of the element for chaining when an argument is passed; 
     * otherwise, returns the current absolute parent.
     * @funcs: 2
     */
    abs_parent<T = undefined | VElement | HTMLElement>(): T;
    abs_parent(value: any): this;
    abs_parent<T = undefined | VElement | HTMLElement>(value?: any): T | this {
        if (value == null) {
            return this._abs_parent as T;
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
    assign_to_parent_as(name: string): this {
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
     * @deprecated: true
     */
    get_y_offset_from_parent(parent: HTMLElement): number | null {
        let offset = 0;
        let node: any = this;

        // Get the bounding rect of the parent
        const parentRect = parent.getBoundingClientRect();

        // Loop up the DOM tree
        while (node && node !== parent && node !== document.body) {
            // Get the bounding rect of the current node
            const nodeRect = node.getBoundingClientRect();

            // Calculate the offset relative to the parent
            offset += nodeRect.top - parentRect.top;

            // Move to the parent element
            node = node.parentElement as any;
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
    absolute_y_offset(): number {
        let element: any = this;
        let top = 0;
        do {
            top += element.offsetTop || 0;
            element = element.offsetParent as any;
        } while(element);
        return top;
    }

    /**
     * @docs:
     * @title: Absolute X Offset
     * @desc: Calculates the absolute X offset of the current element in relation to its offset parents.
     * @return:
     *     @description Returns the total left offset in pixels as a number.
     */
    absolute_x_offset(): number {
        let element: any = this;
        let left = 0;
        do {
            left += element.offsetLeft || 0;
            element = element.offsetParent as any;
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
    exec(callback: ElementCallback<this>): this {
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
    is_child(target: any): boolean {
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
    is_nested_child(target: any, stop_node: any = null): boolean {
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
    toString(): string {
        this.setAttribute("created_by_html", "true");
        // console.log("Created by html:", this.outerHTML)
        return this.outerHTML;
    }

    // ---------------------------------------------------------
    // Automatically generated CSS functions. 
    // Reference: https://www.w3schools.com/cssref/index.php. 

    /**
     * @docs:
     * @title: Accent color
     * @desc: Specifies an accent color for user-interface controls. The equivalent of CSS attribute `accentColor`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the attribute's value if `value` is `null`, otherwise returns the instance of the element for chaining.
     * @funcs: 2
     */
    accent_color(): string;
    accent_color(value: string): this;
    accent_color(value?: string): string | this {
        if (value == null) { return this.style.accentColor; }
        this.style.accentColor = value;
        return this;
    }

    /**
     * @docs:
     * @title: Align Content
     * @desc: Specifies the alignment between the lines inside a flexible container when the items do not use all available space. 
     *        The equivalent of CSS attribute `alignContent`. 
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the attribute value when parameter `value` is `null`. Otherwise, returns the instance of the element for chaining.
     * @funcs: 2
     */
    align_content(): string;
    align_content(value: string): this;
    align_content(value?: string): string | this {
        if (value == null) { return this.style.alignContent; }
        this.style.alignContent = value;
        (this.style as any).msAlignContent = value;
        (this.style as any).webkitAlignContent = value;
        (this.style as any).MozAlignContent = value;
        (this.style as any).OAlignContent = value;
        return this;
    }

    /**
     * @docs:
     * @title: Align Items
     * @desc: Specifies the alignment for items inside a flexible container, equivalent to the CSS attribute `alignItems`. 
     *        Returns the attribute value when the parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    align_items(): string;
    align_items(value: string): this;
    align_items(value?: string): string | this {
        if (value == null) { return this.style.alignItems; }
        this.style.alignItems = value;
        (this.style as any).msAlignItems = value;
        (this.style as any).webkitAlignItems = value;
        (this.style as any).MozAlignItems = value;
        (this.style as any).OAlignItems = value;
        return this;
    }

    /**
     * @docs:
     * @title: Align Self
     * @desc: Specifies the alignment for selected items inside a flexible container. The equivalent of CSS attribute `alignSelf`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    align_self(): string;
    align_self(value: string): this;
    align_self(value?: string): string | this {
        if (value == null) { return this.style.alignSelf; }
        this.style.alignSelf = value;
        (this.style as any).msAlignSelf = value;
        (this.style as any).webkitAlignSelf = value;
        (this.style as any).MozAlignSelf = value;
        (this.style as any).OAlignSelf = value;
        return this;
    }

    /**
     * @docs:
     * @title: All
     * @desc: Resets all properties (except unicode-bidi and direction). The equivalent of CSS attribute `all`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    all(): string;
    all(value: string): this;
    all(value?: string): string | this {
        if (value == null) { return this.style.all; }
        this.style.all = value;
        return this;
    }

    /**
     * @docs:
     * @title: Animation
     * @desc: A shorthand property for all the animation properties. 
     *        The equivalent of CSS attribute `animation`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    animation(): string;
    animation(value: string): this;
    animation(value?: string): string | this {
        if (value == null) { return this.style.animation; }
        this.style.animation = value;
        (this.style as any).msAnimation = value;
        (this.style as any).webkitAnimation = value;
        (this.style as any).MozAnimation = value;
        (this.style as any).OAnimation = value;
        return this;
    }

    /**
     * @docs:
     * @title: Animation Delay
     * @desc: Specifies a delay for the start of an animation, equivalent to the CSS attribute `animationDelay`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the instance of the element for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    animation_delay(): string;
    animation_delay(value: string | number): this;
    animation_delay(value?: string | number): string | this {
        if (value == null) { return this.style.animationDelay; }
        this.style.animationDelay = value as string;
        (this.style as any).msAnimationDelay = value as string;
        (this.style as any).webkitAnimationDelay = value as string;
        (this.style as any).MozAnimationDelay = value as string;
        (this.style as any).OAnimationDelay = value as string;
        return this;
    }

    /**
     * @docs:
     * @title: Animation Direction
     * @description: 
     *     Specifies whether an animation should be played forwards, backwards or in alternate cycles.
     *     The equivalent of CSS attribute `animationDirection`.
     *     
     *     Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     *     @type string, null
     * @return:
     *     @description: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    animation_direction(): string;
    animation_direction(value: string): this;
    animation_direction(value?: string): string | this {
        if (value == null) { return this.style.animationDirection; }
        this.style.animationDirection = value as string;
        (this.style as any).msAnimationDirection = value as string;
        (this.style as any).webkitAnimationDirection = value as string;
        (this.style as any).MozAnimationDirection = value as string;
        (this.style as any).OAnimationDirection = value as string;
        return this;
    }

    /**
     * @docs:
     * @title: Animation Duration
     * @desc: Specifies how long an animation should take to complete one cycle. The equivalent of CSS attribute `animationDuration`. 
     * Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    animation_duration(): string;
    animation_duration(value: string | number): this;
    animation_duration(value?: string | number): string | this {
        if (value == null) { return this.style.animationDuration; }
        this.style.animationDuration = value as string;
        (this.style as any).msAnimationDuration = value as string;
        (this.style as any).webkitAnimationDuration = value as string;
        (this.style as any).MozAnimationDuration = value as string;
        (this.style as any).OAnimationDuration = value as string;
        return this;
    }

    /**
     * @docs:
     * @title: Animation Fill Mode
     * @desc: Specifies a style for the element when the animation is not playing, akin to the CSS `animation-fill-mode` property. 
     *        Use this method to set or retrieve the current fill mode value.
     * @param:
     *     @name: value
     *     @descr: The value to assign to the animation fill mode. Pass `null` to retrieve the current value.
     * @return:
     *     @description Returns the instance of the element for chaining when a value is set. If `null` is passed, returns the current value of the animation fill mode.
     * @funcs: 2
     */
    animation_fill_mode(): string;
    animation_fill_mode(value: string): this;
    animation_fill_mode(value?: string): string | this {
        if (value == null) { return this.style.animationFillMode; }
        this.style.animationFillMode = value;
        (this.style as any).msAnimationFillMode = value;
        (this.style as any).webkitAnimationFillMode = value;
        (this.style as any).MozAnimationFillMode = value;
        (this.style as any).OAnimationFillMode = value;
        return this;
    }

    /**
     * @docs:
     * @title: Animation Iteration Count
     * @desc: Specifies the number of times an animation should be played. The equivalent of CSS attribute `animationIterationCount`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    animation_iteration_count(): string;
    animation_iteration_count(value: string | number): this;
    animation_iteration_count(value?: string | number): string | this {
        if (value == null) { return this.style.animationIterationCount; }
        this.style.animationIterationCount = value as string;
        (this.style as any).msAnimationIterationCount = value as string;
        (this.style as any).webkitAnimationIterationCount = value as string;
        (this.style as any).MozAnimationIterationCount = value as string;
        (this.style as any).OAnimationIterationCount = value as string;
        return this;
    }

    /**
     * @docs:
     * @title: Animation Name
     * @desc: Specifies a name for the \@keyframes animation, equivalent to the CSS attribute `animationName`. 
     *        When the parameter `value` is null, it retrieves the current attribute value.
     * @param:
     *     @name: value
     *     @descr: The value to assign for the animation name. Use null to retrieve the current value.
     * @return:
     *     @description Returns the current animation name when `value` is null, otherwise returns the instance for chaining.
     * @funcs: 2
     */
    animation_name(): string;
    animation_name(value: string): this;
    animation_name(value?: string): string | this {
        if (value == null) { return this.style.animationName; }
        this.style.animationName = value;
        (this.style as any).msAnimationName = value;
        (this.style as any).webkitAnimationName = value;
        (this.style as any).MozAnimationName = value;
        (this.style as any).OAnimationName = value;
        return this;
    }

    /**
     * @docs:
     * @title: Animation Play State
     * @desc: Specifies whether the animation is running or paused. 
     *        The equivalent of CSS attribute `animationPlayState`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    animation_play_state(): string;
    animation_play_state(value: string): this;
    animation_play_state(value?: string): string | this {
        if (value == null) { return this.style.animationPlayState; }
        this.style.animationPlayState = value;
        (this.style as any).msAnimationPlayState = value;
        (this.style as any).webkitAnimationPlayState = value;
        (this.style as any).MozAnimationPlayState = value;
        (this.style as any).OAnimationPlayState = value;
        return this;
    }

    /**
     * @docs:
     * @title: Animation Timing Function
     * @desc: Specifies the speed curve of an animation. The equivalent of CSS attribute `animationTimingFunction`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    animation_timing_function(): string;
    animation_timing_function(value: string): this;
    animation_timing_function(value?: string): string | this {
        if (value == null) { return this.style.animationTimingFunction; }
        this.style.animationTimingFunction = value;
        (this.style as any).msAnimationTimingFunction = value;
        (this.style as any).webkitAnimationTimingFunction = value;
        (this.style as any).MozAnimationTimingFunction = value;
        (this.style as any).OAnimationTimingFunction = value;
        return this;
    }

    /**
     * @docs:
     * @title: Aspect ratio
     * @desc: Specifies preferred aspect ratio of an element. The equivalent of CSS attribute `aspectRatio`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    aspect_ratio(): string;
    aspect_ratio(value: string): this;
    aspect_ratio(value?: string): this | string {
        if (value == null) { return this.style.aspectRatio; }
        this.style.aspectRatio = value;
        return this;
    }

    /**
     * @docs:
     * @title: Backdrop Filter
     * @desc: Defines a graphical effect to the area behind an element. The equivalent of CSS attribute `backdropFilter`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the instance of the element for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    backdrop_filter(): string;
    backdrop_filter(value: string): this;
    backdrop_filter(value?: string): string | this {
        if (value == null) { return this.style.backdropFilter; }
        this.style.backdropFilter = value;
        (this.style as any).msBackdropFilter = value;
        (this.style as any).webkitBackdropFilter = value;
        (this.style as any).MozBackdropFilter = value;
        (this.style as any).OBackdropFilter = value;
        return this;
    }

    /**
     * @docs:
     * @title: Backface Visibility
     * @desc: Defines whether or not the back face of an element should be visible when facing the user. 
     *        The equivalent of CSS attribute `backfaceVisibility`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    backface_visibility(): string;
    backface_visibility(value: string): this;
    backface_visibility(value?: string): string | this {
        if (value == null) { return this.style.backfaceVisibility; }
        this.style.backfaceVisibility = value;
        (this.style as any).msBackfaceVisibility = value;
        (this.style as any).webkitBackfaceVisibility = value;
        (this.style as any).MozBackfaceVisibility = value;
        (this.style as any).OBackfaceVisibility = value;
        return this;
    }

    /**
     * @docs:
     * @title: Background Attachment
     * @desc: Sets whether a background image scrolls with the rest of the page, or is fixed. 
     *        The equivalent of CSS attribute `backgroundAttachment`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    background_attachment(): string;
    background_attachment(value: string): this;
    background_attachment(value?: string): string | this {
        if (value == null) { return this.style.backgroundAttachment; }
        this.style.backgroundAttachment = value;
        return this;
    }

    /**
     * @docs:
     * @title: Background Blend Mode
     * @desc: Specifies the blending mode of each background layer (color/image). The equivalent of CSS attribute `backgroundBlendMode`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    background_blend_mode(): string;
    background_blend_mode(value: string): this;
    background_blend_mode(value?: string): string | this {
        if (value == null) { return this.style.backgroundBlendMode; }
        this.style.backgroundBlendMode = value;
        return this;
    }

    /**
     * @docs:
     * @title: Background Clip
     * @desc: Defines how far the background (color or image) should extend within an element. 
     *        The equivalent of CSS attribute `backgroundClip`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    background_clip(): string;
    background_clip(value: string): this;
    background_clip(value?: string): string | this {
        if (value == null) { return this.style.backgroundClip; }
        this.style.backgroundClip = value;
        (this.style as any).msBackgroundClip = value;
        (this.style as any).webkitBackgroundClip = value;
        (this.style as any).MozBackgroundClip = value;
        (this.style as any).OBackgroundClip = value;
        return this;
    }

    /**
     * @docs:
     * @title: Background Color
     * @desc: Specifies the background color of an element. The equivalent of CSS attribute `backgroundColor`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    background_color(): string;
    background_color(value: string): this;
    background_color(value?: string): string | this {
        if (value == null) { return this.style.backgroundColor; }
        this.style.backgroundColor = value;
        return this;
    }

    /**
     * @docs:
     * @title: Background Image
     * @desc: Specifies one or more background images for an element. 
     *        The equivalent of CSS attribute `backgroundImage`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    background_image(): string;
    background_image(value: string): this;
    background_image(value?: string): string | this {
        if (value == null) { return this.style.backgroundImage; }
        this.style.backgroundImage = value;
        return this;
    }

    /**
     * @docs:
     * @title: Background Origin
     * @desc: Specifies the origin position of a background image, equivalent to the CSS attribute `backgroundOrigin`. 
     *        Returns the attribute value when the parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign for the background origin. Leave `null` to retrieve the attribute's current value.
     * @return:
     *     @descr: Returns the instance of the element for chaining unless `value` is `null`, then the current attribute value is returned.
     * @funcs: 2
     */
    background_origin(): string;
    background_origin(value: string): this;
    background_origin(value?: string): string | this {
        if (value == null) { return this.style.backgroundOrigin; }
        this.style.backgroundOrigin = value;
        (this.style as any).msBackgroundOrigin = value;
        (this.style as any).webkitBackgroundOrigin = value;
        (this.style as any).MozBackgroundOrigin = value;
        (this.style as any).OBackgroundOrigin = value;
        return this;
    }

    /**
     * @docs:
     * @title: Background Position
     * @desc: Specifies the position of a background image, equivalent to the CSS attribute `backgroundPosition`. 
     *        Returns the attribute value when the parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    background_position(): string;
    background_position(value: string): this;
    background_position(value?: string): string | this {
        if (value == null) { return this.style.backgroundPosition; }
        this.style.backgroundPosition = value;
        return this;
    }

    /**
     * @docs:
     * @title: Background Position X
     * @desc: Specifies the position of a background image on x-axis. 
     *        The equivalent of CSS attribute `backgroundPositionX`.
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    background_position_x(): string;
    background_position_x(value: string | number): this;
    background_position_x(value?: string | number): string | this {
        if (value == null) { return this.style.backgroundPositionX; }
        this.style.backgroundPositionX = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Background Position Y
     * @desc: Specifies the position of a background image on the y-axis, equivalent to the CSS attribute `backgroundPositionY`.
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    background_position_y(): string;
    background_position_y(value: string | number): this;
    background_position_y(value?: string | number): this | string {
        if (value == null) { return this.style.backgroundPositionY; }
        this.style.backgroundPositionY = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Background Repeat
     * @desc: Sets if/how a background image will be repeated. This corresponds to the CSS property `backgroundRepeat`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, in which case the attribute's value is returned.
     * @funcs: 2
     */
    background_repeat(): string;
    background_repeat(value: string): this;
    background_repeat(value?: string): string | this {
        if (value == null) { return this.style.backgroundRepeat; }
        this.style.backgroundRepeat = value;
        return this;
    }

    /**
     * @docs:
     * @title: Background Size
     * @desc: Specifies the size of the background images. The equivalent of CSS attribute `backgroundSize`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    background_size(): string;
    background_size(value: string | number): this;
    background_size(value?: string | number): string | this {
        if (value == null) { return this.style.backgroundSize; }
        this.style.backgroundSize = this.pad_numeric(value);
        (this.style as any).msBackgroundSize = this.pad_numeric(value);
        (this.style as any).webkitBackgroundSize = this.pad_numeric(value);
        (this.style as any).MozBackgroundSize = this.pad_numeric(value);
        (this.style as any).OBackgroundSize = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Block size
     * @desc: Specifies the size of an element in block direction. 
     *        The equivalent of CSS attribute `blockSize`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    block_size(): string;
    block_size(value: string | number): this;
    block_size(value?: string | number): string | this {
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

    /**
     * @docs:
     * @title: Border Block
     * @desc: A shorthand property for border-block-width, border-block-style and border-block-color.
     *        The equivalent of CSS attribute `borderBlock`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    border_block(): string;
    border_block(value: string): this | string;
    border_block(value?: string): this | string {
        if (value == null) { return this.style.borderBlock; }
        this.style.borderBlock = value;
        return this;
    }

    /**
     * @docs:
     * @title: Border Block Color
     * @desc: Sets the color of the borders at start and end in the block direction. 
     *        The equivalent of CSS attribute `borderBlockColor`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the attribute's value if `value` is `null`, otherwise returns the instance of the element for chaining.
     * @funcs: 2
     */
    border_block_color(): string;
    border_block_color(value: string): this;
    border_block_color(value?: string): string | this {
        if (value == null) { return this.style.borderBlockColor; }
        this.style.borderBlockColor = value;
        return this;
    }

    /**
     * @docs:
     * @title: Border Block End Color
     * @desc: Sets the color of the border at the end in the block direction. The equivalent of CSS attribute `borderBlockEndColor`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    border_block_end_color(): string;
    border_block_end_color(value: string): this;
    border_block_end_color(value?: string): string | this {
        if (value == null) { return this.style.borderBlockEndColor; }
        this.style.borderBlockEndColor = value;
        return this;
    }

    /**
     * @docs:
     * @title: Border Block End Style
     * @desc: Sets the style of the border at the end in the block direction. 
     *        The equivalent of CSS attribute `borderBlockEndStyle`. 
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the attribute value when parameter `value` is `null`. Otherwise, returns the instance of the element for chaining.
     * @funcs: 2
     */
    border_block_end_style(): string;
    border_block_end_style(value: string): this;
    border_block_end_style(value?: string): string | this {
        if (value == null) { return this.style.borderBlockEndStyle; }
        this.style.borderBlockEndStyle = value;
        return this;
    }

    /**
     * @docs:
     * @title: Border Block End Width
     * @desc: Sets the width of the border at the end in the block direction. 
     *        The equivalent of CSS attribute `borderBlockEndWidth`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the attribute's value when `value` is `null`, otherwise returns the instance of the element for chaining.
     * @funcs: 2
     */
    border_block_end_width(): string;
    border_block_end_width(value: string | number): this;
    border_block_end_width(value?: string | number): string | this {
        if (value == null) { return this.style.borderBlockEndWidth; }
        this.style.borderBlockEndWidth = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Border Block Start Color
     * @desc: Sets the color of the border at the start in the block direction. 
     *        The equivalent of CSS attribute `borderBlockStartColor`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    border_block_start_color(): string;
    border_block_start_color(value: string): this;
    border_block_start_color(value?: string): string | this {
        if (value == null) { return this.style.borderBlockStartColor; }
        this.style.borderBlockStartColor = value;
        return this;
    }

    /**
     * @docs:
     * @title: Border Block Start Style
     * @desc: Sets the style of the border at the start in the block direction. 
     * The equivalent of CSS attribute `borderBlockStartStyle`. 
     * Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the attribute's value if `value` is `null`, otherwise returns the instance of the element for chaining.
     * @funcs: 2
     */
    border_block_start_style(): string;
    border_block_start_style(value: string): this;
    border_block_start_style(value?: string): string | this {
        if (value == null) { return this.style.borderBlockStartStyle; }
        this.style.borderBlockStartStyle = value;
        return this;
    }

    /**
     * @docs:
     * @title: Border Block Start Width
     * @desc: Sets the width of the border at the start in the block direction. The equivalent of CSS attribute `borderBlockStartWidth`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    border_block_start_width(): string;
    border_block_start_width(value: string | number): this;
    border_block_start_width(value?: string | number): string | this {
        if (value == null) { return this.style.borderBlockStartWidth; }
        this.style.borderBlockStartWidth = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Border Block Style
     * @desc: Sets the style of the borders at start and end in the block direction. 
     *        The equivalent of CSS attribute `borderBlockStyle`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    border_block_style(): string;
    border_block_style(value: string): this;
    border_block_style(value?: string): string | this {
        if (value == null) { return this.style.borderBlockStyle; }
        this.style.borderBlockStyle = value;
        return this;
    }

    /**
     * @docs:
     * @title: Border Block Width
     * @desc: Sets the width of the borders at start and end in the block direction. 
     *        The equivalent of CSS attribute `borderBlockWidth`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    border_block_width(): string;
    border_block_width(value: string | number): this;
    border_block_width(value?: string | number): string | this {
        if (value == null) { return this.style.borderBlockWidth; }
        this.style.borderBlockWidth = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Border Bottom Color
     * @desc: Sets the color of the bottom border. The equivalent of CSS attribute `borderBottomColor`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    border_bottom_color(): string;
    border_bottom_color(value: string): this;
    border_bottom_color(value?: string): string | this {
        if (value == null) { return this.style.borderBottomColor; }
        this.style.borderBottomColor = value;
        return this;
    }

    /**
     * @docs:
     * @title: Border Bottom Left Radius
     * @desc: Defines the radius of the border of the bottom-left corner. 
     *        The equivalent of CSS attribute `borderBottomLeftRadius`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the attribute's value when `value` is `null`, otherwise returns the instance of the element for chaining.
     * @funcs: 2
     */
    border_bottom_left_radius(): string;
    border_bottom_left_radius(value: string | number): this;
    border_bottom_left_radius(value?: string | number): string | this {
        if (value == null) { return this.style.borderBottomLeftRadius; }
        this.style.borderBottomLeftRadius = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Border Bottom Right Radius
     * @desc: Defines the radius of the border of the bottom-right corner. 
     *        The equivalent of CSS attribute `borderBottomRightRadius`. 
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the attribute value when parameter `value` is `null`. Otherwise, returns the instance of the element for chaining.
     * @funcs: 2
     */
    border_bottom_right_radius(): string;
    border_bottom_right_radius(value: string | number): this;
    border_bottom_right_radius(value?: string | number): string | this {
        if (value == null) { return this.style.borderBottomRightRadius; }
        this.style.borderBottomRightRadius = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Border Bottom Style
     * @desc: Sets the style of the bottom border, equivalent to the CSS attribute `borderBottomStyle`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    border_bottom_style(): string;
    border_bottom_style(value: string): this;
    border_bottom_style(value?: string): string | this {
        if (value == null) { return this.style.borderBottomStyle; }
        this.style.borderBottomStyle = value;
        return this;
    }

    /**
     * @docs:
     * @title: Border Bottom Width
     * @desc: Sets the width of the bottom border. The equivalent of CSS attribute `borderBottomWidth`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    border_bottom_width(): string;
    border_bottom_width(value: string | number): this;
    border_bottom_width(value?: string | number): string | this {
        if (value == null) { return this.style.borderBottomWidth; }
        this.style.borderBottomWidth = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Border Collapse
     * @desc: Sets whether table borders should collapse into a single border or be separated. 
     * The equivalent of CSS attribute `borderCollapse`. 
     * Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    border_collapse(): string;
    border_collapse(value: string): this;
    border_collapse(value?: string): string | this {
        if (value == null) { return this.style.borderCollapse; }
        this.style.borderCollapse = value;
        return this;
    }

    /**
     * @docs:
     * @title: Border Color
     * @desc: Sets the color of the four borders. This is equivalent to the CSS attribute `borderColor`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining. Unless parameter `value` is `null`, 
     *                  then the attribute's value is returned.
     * @funcs: 2
     */
    border_color(): string;
    border_color(value: string): this;
    border_color(value?: string): string | this {
        if (value == null) { return this.style.borderColor; }
        this.style.borderColor = value;
        return this;
    }

    /**
     * @docs:
     * @title: Border Image
     * @desc: A shorthand property for all the border-image properties. 
     *        The equivalent of CSS attribute `borderImage`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    border_image(): string;
    border_image(value: string): this;
    border_image(value?: string): string | this {
        if (value == null) { return this.style.borderImage; }
        this.style.borderImage = value;
        (this.style as any).msBorderImage = value;
        (this.style as any).webkitBorderImage = value;
        (this.style as any).MozBorderImage = value;
        (this.style as any).OBorderImage = value;
        return this;
    }

    /**
     * @docs:
     * @title: Border image outset
     * @desc: Specifies the amount by which the border image area extends beyond the border box. The equivalent of CSS attribute `borderImageOutset`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    border_image_outset(): string;
    border_image_outset(value: string | number): this;
    border_image_outset(value?: string | number): string | this {
        if (value == null) { return this.style.borderImageOutset; }
        this.style.borderImageOutset = value as string;
        return this;
    }

    /**
     * @docs:
     * @title: Border Image Repeat
     * @desc: Specifies whether the border image should be repeated, rounded or stretched. 
     *        The equivalent of CSS attribute `borderImageRepeat`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     *     @type string, null
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    border_image_repeat(): string;
    border_image_repeat(value: string): this;
    border_image_repeat(value?: string): string | this {
        if (value == null) { return this.style.borderImageRepeat; }
        this.style.borderImageRepeat = value;
        return this;
    }

    /**
     * @docs:
     * @title: Border Image Slice
     * @desc: Specifies how to slice the border image, equivalent to the CSS attribute `borderImageSlice`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    border_image_slice(): string;
    border_image_slice(value: string | number): this;
    border_image_slice(value?: string | number): string | this {
        if (value == null) { return this.style.borderImageSlice; }
        this.style.borderImageSlice = value as string;
        return this;
    }

    /**
     * @docs:
     * @title: Border Image Source
     * @desc: Specifies the path to the image to be used as a border. 
     *        The equivalent of CSS attribute `borderImageSource`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    border_image_source(): string;
    border_image_source(value: string): this;
    border_image_source(value?: string): string | this {
        if (value == null) { return this.style.borderImageSource; }
        this.style.borderImageSource = value;
        return this;
    }

    /**
     * @docs:
     * @title: Border Image Width
     * @desc: Specifies the width of the border image, equivalent to the CSS attribute `borderImageWidth`.
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the attribute's value if `value` is `null`, otherwise returns the instance for chaining.
     * @funcs: 2
     */
    border_image_width(): string;
    border_image_width(value: string | number): this;
    border_image_width(value?: string | number): string | this {
        if (value == null) { return this.style.borderImageWidth; }
        this.style.borderImageWidth = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Border inline
     * @desc: A shorthand property for border-inline-width, border-inline-style and border-inline-color. 
     *        The equivalent of CSS attribute `borderInline`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    border_inline(): string;
    border_inline(value: string | number): this;
    border_inline(value?: string | number): string | this {
        if (value == null) { return this.style.borderInline; }
        this.style.borderInline = value as string;
        return this;
    }

    /**
     * @docs:
     * @title: Border Inline Color
     * @desc: Sets the color of the borders at start and end in the inline direction. 
     *        The equivalent of CSS attribute `borderInlineColor`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining, unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    border_inline_color(): string;
    border_inline_color(value: string): this;
    border_inline_color(value?: string): string | this {
        if (value == null) { return this.style.borderInlineColor; }
        this.style.borderInlineColor = value;
        return this;
    }

    /**
     * @docs:
     * @title: Border Inline End Color
     * @desc: Sets the color of the border at the end in the inline direction. 
     * The equivalent of CSS attribute `borderInlineEndColor`. 
     * Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    border_inline_end_color(): string;
    border_inline_end_color(value: string): this;
    border_inline_end_color(value?: string): string | this {
        if (value == null) { return this.style.borderInlineEndColor; }
        this.style.borderInlineEndColor = value;
        return this;
    }

    /**
     * @docs:
     * @title: Border Inline End Style
     * @desc: Sets the style of the border at the end in the inline direction. 
     *        The equivalent of CSS attribute `borderInlineEndStyle`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    border_inline_end_style(): string;
    border_inline_end_style(value: string): this;
    border_inline_end_style(value?: string): string | this {
        if (value == null) { return this.style.borderInlineEndStyle; }
        this.style.borderInlineEndStyle = value;
        return this;
    }

    /**
     * @docs:
     * @title: Border Inline End Width
     * @desc: Sets the width of the border at the end in the inline direction. 
     * The equivalent of CSS attribute `borderInlineEndWidth`. 
     * Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    border_inline_end_width(): string;
    border_inline_end_width(value: string | number): this;
    border_inline_end_width(value?: string | number): string | this {
        if (value == null) { return this.style.borderInlineEndWidth; }
        this.style.borderInlineEndWidth = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Border inline start color
     * @desc: Sets the color of the border at the start in the inline direction. The equivalent of CSS attribute `borderInlineStartColor`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    border_inline_start_color(): string;
    border_inline_start_color(value: string): this;
    border_inline_start_color(value?: string): string | this {
        if (value == null) { return this.style.borderInlineStartColor; }
        this.style.borderInlineStartColor = value;
        return this;
    }

    /**
     * @docs:
     * @title: Border inline start style
     * @desc: Sets the style of the border at the start in the inline direction.
     *        The equivalent of CSS attribute `borderInlineStartStyle`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    border_inline_start_style(): string;
    border_inline_start_style(value: string): this;
    border_inline_start_style(value?: string): string | this {
        if (value == null) { return this.style.borderInlineStartStyle; }
        this.style.borderInlineStartStyle = value;
        return this;
    }

    /**
     * @docs:
     * @title: Border Inline Start Width
     * @desc: Sets the width of the border at the start in the inline direction. 
     * The equivalent of CSS attribute `borderInlineStartWidth`. 
     * Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description The value to assign. Leave `null` to retrieve the attribute's value.
     *     @type number | null
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    border_inline_start_width(): string;
    border_inline_start_width(value: string | number): this;
    border_inline_start_width(value?: string | number): string | this {
        if (value == null) { return this.style.borderInlineStartWidth; }
        this.style.borderInlineStartWidth = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Border Inline Style
     * @desc: Sets the style of the borders at start and end in the inline direction. 
     * The equivalent of CSS attribute `borderInlineStyle`. 
     * Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     *     @type string, null
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    border_inline_style(): string;
    border_inline_style(value: string): this;
    border_inline_style(value?: string): string | this {
        if (value == null) { return this.style.borderInlineStyle; }
        this.style.borderInlineStyle = value;
        return this;
    }

    /**
     * @docs:
     * @title: Border Inline Width
     * @desc: Sets the width of the borders at start and end in the inline direction. 
     *        The equivalent of CSS attribute `borderInlineWidth`. 
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    border_inline_width(): string;
    border_inline_width(value: string | number): this;
    border_inline_width(value?: string | number): this | string {
        if (value == null) { return this.style.borderInlineWidth; }
        this.style.borderInlineWidth = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Border Left Color
     * @desc: Sets the color of the left border. The equivalent of CSS attribute `borderLeftColor`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    border_left_color(): string;
    border_left_color(value: string): this;
    border_left_color(value?: string): string | this {
        if (value == null) { return this.style.borderLeftColor; }
        this.style.borderLeftColor = value;
        return this;
    }

    /**
     * @docs:
     * @title: Border Left Style
     * @desc: Sets the style of the left border. The equivalent of CSS attribute `borderLeftStyle`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    border_left_style(): string;
    border_left_style(value: string): this;
    border_left_style(value?: string): string | this {
        if (value == null) { return this.style.borderLeftStyle; }
        this.style.borderLeftStyle = value;
        return this;
    }

    /**
     * @docs:
     * @title: Border Left Width
     * @desc: Sets the width of the left border. The equivalent of CSS attribute `borderLeftWidth`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    border_left_width(): string;
    border_left_width(value: string | number): this;
    border_left_width(value?: string | number): string | this {
        if (value == null) { return this.style.borderLeftWidth; }
        this.style.borderLeftWidth = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Border radius
     * @desc: A shorthand property for the four border-radius properties. The equivalent of CSS attribute `borderRadius`. 
     * Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    border_radius(): string;
    border_radius(value: string | number): this;
    border_radius(value?: string | number): string | this {
        if (value == null) { return this.style.borderRadius; }
        this.style.borderRadius = this.pad_numeric(value);
        (this.style as any).msBorderRadius = this.pad_numeric(value);
        (this.style as any).webkitBorderRadius = this.pad_numeric(value);
        (this.style as any).MozBorderRadius = this.pad_numeric(value);
        (this.style as any).OBorderRadius = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Border Right Color
     * @desc: Sets the color of the right border. This is equivalent to the CSS attribute `borderRightColor`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    border_right_color(): string;
    border_right_color(value: string): this;
    border_right_color(value?: string): string | this {
        if (value == null) { return this.style.borderRightColor; }
        this.style.borderRightColor = value;
        return this;
    }

    /**
     * @docs:
     * @title: Border Right Style
     * @desc: Sets the style of the right border. The equivalent of CSS attribute `borderRightStyle`.
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    border_right_style(): string;
    border_right_style(value: string): this;
    border_right_style(value?: string): string | this {
        if (value == null) { return this.style.borderRightStyle; }
        this.style.borderRightStyle = value;
        return this;
    }

    /**
     * @docs:
     * @title: Border Right Width
     * @desc: Sets the width of the right border. The equivalent of CSS attribute `borderRightWidth`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    border_right_width(): string;
    border_right_width(value: string | number): this;
    border_right_width(value?: string | number): string | this {
        if (value == null) { return this.style.borderRightWidth; }
        this.style.borderRightWidth = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Border Spacing
     * @desc: Sets the distance between the borders of adjacent cells. 
     * The equivalent of CSS attribute `borderSpacing`. 
     * Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    border_spacing(): string;
    border_spacing(value: string | number): this;
    border_spacing(value?: string | number): string | this {
        if (value == null) { return this.style.borderSpacing; }
        this.style.borderSpacing = value as string;
        return this;
    }

    /**
     * @docs:
     * @title: Border Style
     * @desc: Sets the style of the four borders. The equivalent of CSS attribute `borderStyle`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining, or the attribute's value if `value` is `null`.
     * @funcs: 2
     */
    border_style(): string;
    border_style(value: string): this;
    border_style(value?: string): string | this {
        if (value == null) { return this.style.borderStyle; }
        this.style.borderStyle = value;
        return this;
    }

    /**
     * @docs:
     * @title: Border Top Color
     * @desc: Sets the color of the top border. The equivalent of CSS attribute `borderTopColor`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining, unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    border_top_color(): string;
    border_top_color(value: string): this;
    border_top_color(value?: string): string | this {
        if (value == null) { return this.style.borderTopColor; }
        this.style.borderTopColor = value;
        return this;
    }

    /**
     * @docs:
     * @title: Border Top Left Radius
     * @desc: Defines the radius of the border of the top-left corner. The equivalent of CSS attribute `borderTopLeftRadius`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    border_top_left_radius(): string;
    border_top_left_radius(value: string | number): this;
    border_top_left_radius(value?: string | number): string | this {
        if (value == null) { return this.style.borderTopLeftRadius; }
        this.style.borderTopLeftRadius = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Border Top Right Radius
     * @desc: Defines the radius of the border of the top-right corner. 
     *        The equivalent of CSS attribute `borderTopRightRadius`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the attribute's value if `value` is `null`, otherwise returns the instance for chaining.
     * @funcs: 2
     */
    border_top_right_radius(): string;
    border_top_right_radius(value: string | number): this;
    border_top_right_radius(value?: string | number): string | this {
        if (value == null) { return this.style.borderTopRightRadius; }
        this.style.borderTopRightRadius = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Border Top Style
     * @desc: Sets the style of the top border. The equivalent of CSS attribute `borderTopStyle`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    border_top_style(): string;
    border_top_style(value: string): this;
    border_top_style(value?: string): string | this {
        if (value == null) { return this.style.borderTopStyle; }
        this.style.borderTopStyle = value;
        return this;
    }

    /**
     * @docs:
     * @title: Border Top Width
     * @desc: Sets the width of the top border, equivalent to the CSS attribute `borderTopWidth`.
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the attribute's value if `value` is `null`, otherwise returns the instance for chaining.
     * @funcs: 2
     */
    border_top_width(): string;
    border_top_width(value: string | number): this;
    border_top_width(value?: string | number): string | this {
        if (value == null) { return this.style.borderTopWidth; }
        this.style.borderTopWidth = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Border Width
     * @desc: Sets the width of the four borders, equivalent to the CSS attribute `borderWidth`. 
     *        Returns the attribute value when the parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining, unless the parameter `value` is `null`, 
     *                  then the attribute's value is returned.
     * @funcs: 2
     */
    border_width(): string;
    border_width(value: string | number): this;
    border_width(value?: string | number): string | this {
        if (value == null) { return this.style.borderWidth; }
        this.style.borderWidth = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Bottom
     * @desc: Sets the elements position, from the bottom of its parent element. 
     *        The equivalent of CSS attribute `bottom`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    bottom(): string;
    bottom(value: string | number): this;
    bottom(value?: string | number): string | this {
        if (value == null) { return this.style.bottom; }
        this.style.bottom = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Box decoration break
     * @desc: Sets the behavior of the background and border of an element at page-break, or, for in-line elements, at line-break. The equivalent of CSS attribute `boxDecorationBreak`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, in which case the attribute's value is returned.
     * @funcs: 2
     */
    box_decoration_break(): string;
    box_decoration_break(value: string): this;
    box_decoration_break(value?: string): string | this {
        if (value == null) { return (this.style as any).boxDecorationBreak ?? ""; }
        (this.style as any).boxDecorationBreak = value;
        return this;
    }

    /**
     * @docs:
     * @title: Box reflect
     * @desc: The box-reflect property is used to create a reflection of an element. 
     *        The equivalent of CSS attribute `boxReflect`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    box_reflect(): string;
    box_reflect(value: string): this;
    box_reflect(value?: string): string | this {
        if (value == null) { return (this.style as any).boxReflect; }
        (this.style as any).boxReflect = value;
        return this;
    }

    /**
     * @docs:
     * @title: Box shadow
     * @desc: Attaches one or more shadows to an element. The equivalent of CSS attribute `boxShadow`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     *     @type string, null
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, 
     *                  then the attribute's value is returned.
     * @funcs: 2
     */
    box_shadow(): string;
    box_shadow(value: string): this;
    box_shadow(value?: string): string | this {
        if (value == null) { return this.style.boxShadow; }
        this.style.boxShadow = value;
        (this.style as any).msBoxShadow = value;
        (this.style as any).webkitBoxShadow = value;
        (this.style as any).MozBoxShadow = value;
        (this.style as any).OBoxShadow = value;
        return this;
    }

    /**
     * @docs:
     * @title: Box sizing
     * @desc: Defines how the width and height of an element are calculated: should they include padding and borders, or not. The equivalent of CSS attribute `boxSizing`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the attribute value when parameter `value` is `null`. Otherwise, returns the instance of the element for chaining.
     * @funcs: 2
     */
    box_sizing(): string;
    box_sizing(value: string): this;
    box_sizing(value?: string): string | this {
        if (value == null) { return this.style.boxSizing; }
        this.style.boxSizing = value;
        (this.style as any).msBoxSizing = value;
        (this.style as any).webkitBoxSizing = value;
        (this.style as any).MozBoxSizing = value;
        (this.style as any).OBoxSizing = value;
        return this;
    }

    /**
     * @docs:
     * @title: Break After
     * @desc: Specifies whether or not a page-, column-, or region-break should occur after the specified element. The equivalent of CSS attribute `breakAfter`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the attribute value when parameter `value` is `null`. Otherwise, returns the instance of the element for chaining.
     * @funcs: 2
     */
    break_after(): string | this;
    break_after(value: string): this;
    break_after(value?: string): string | this {
        if (value == null) { return this.style.breakAfter; }
        this.style.breakAfter = value;
        return this;
    }

    /**
     * @docs:
     * @title: Break Before
     * @description: 
     *     Specifies whether or not a page-, column-, or region-break should occur before the specified element.
     *     The equivalent of CSS attribute `breakBefore`.
     *     
     *     Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    break_before(): string;
    break_before(value: string): this;
    break_before(value?: string): string | this {
        if (value == null) { return this.style.breakBefore; }
        this.style.breakBefore = value;
        return this;
    }

    /**
     * @docs:
     * @title: Break Inside
     * @desc: Specifies whether or not a page-, column-, or region-break should occur inside the specified element. The equivalent of CSS attribute `breakInside`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description The value to assign. Leave `null` to retrieve the attribute's value.
     *     @type string, null
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    break_inside(): string;
    break_inside(value: string): this;
    break_inside(value?: string): string | this {
        if (value == null) { return this.style.breakInside; }
        this.style.breakInside = value;
        return this;
    }

    /**
     * @docs:
     * @title: Caption Side
     * @desc: Specifies the placement of a table caption. The equivalent of CSS attribute `captionSide`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    caption_side(): string;
    caption_side(value: string): this;
    caption_side(value?: string): string | this {
        if (value == null) { return this.style.captionSide; }
        this.style.captionSide = value;
        return this;
    }

    /**
     * @docs:
     * @title: Caret color
     * @desc: Specifies the color of the cursor (caret) in inputs, textareas, or any element that is editable. 
     *        The equivalent of CSS attribute `caretColor`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    caret_color(): string;
    caret_color(value: string): this;
    caret_color(value?: string): string | this {
        if (value == null) { return this.style.caretColor; }
        this.style.caretColor = value;
        return this;
    }

    /**
     * @docs:
     * @title: Clear
     * @desc: Specifies what should happen with the element that is next to a floating element. 
     *        The equivalent of CSS attribute `clear`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    clear(): string;
    clear(value: string): this;
    clear(value?: string): string | this {
        if (value == null) { return this.style.clear; }
        this.style.clear = value;
        return this;
    }

    /**
     * @docs:
     * @title: Clip
     * @desc: Clips an absolutely positioned element. The equivalent of CSS attribute `clip`.
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description The value to assign. Leave `null` to retrieve the attribute's value.
     *     @type string, null
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    clip(): string;
    clip(value: string): this;
    clip(value?: string): string | this {
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

    /**
     * @docs:
     * @title: Column Count
     * @desc: Specifies the number of columns an element should be divided into. 
     *        The equivalent of CSS attribute `columnCount`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    column_count(): null | number;
    column_count(value: string | number): this;
    column_count(value?: string | number): this | null | number {
        if (value == null) { return this._try_parse_float(this.style.columnCount, null); }
        value = value.toString();
        this.style.columnCount = value;
        (this.style as any).msColumnCount = value;
        (this.style as any).webkitColumnCount = value;
        (this.style as any).MozColumnCount = value;
        (this.style as any).OColumnCount = value;
        return this;
    }

    /**
     * @docs:
     * @title: Column Fill
     * @description: 
     *     Specifies how to fill columns, balanced or not. 
     *     The equivalent of CSS attribute `columnFill`. 
     *     Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    column_fill(): string;
    column_fill(value: string): this;
    column_fill(value?: string): string | this {
        if (value == null) { return this.style.columnFill; }
        this.style.columnFill = value;
        return this;
    }

    /**
     * @docs:
     * @title: Column Gap
     * @desc: Specifies the gap between the columns. The equivalent of CSS attribute `columnGap`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object for chaining unless `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    column_gap(): string;
    column_gap(value: string | number): this;
    column_gap(value?: string | number): string | this {
        if (value == null) { return this.style.columnGap; }
        value = this.pad_numeric(value);
        this.style.columnGap = value;
        (this.style as any).msColumnGap = value;
        (this.style as any).webkitColumnGap = value;
        (this.style as any).MozColumnGap = value;
        (this.style as any).OColumnGap = value;
        return this;
    }

    /**
     * @docs:
     * @title: Column Rule
     * @description: 
     *     A shorthand property for all the column-rule properties.
     *     The equivalent of CSS attribute `columnRule`.
     *      
     *     Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    column_rule(): string;
    column_rule(value: string): this;
    column_rule(value?: string): string | this {
        if (value == null) { return this.style.columnRule; }
        this.style.columnRule = value;
        (this.style as any).msColumnRule = value;
        (this.style as any).webkitColumnRule = value;
        (this.style as any).MozColumnRule = value;
        (this.style as any).OColumnRule = value;
        return this;
    }

    /**
     * @docs:
     * @title: Column Rule Color
     * @desc: Specifies the color of the rule between columns. This is equivalent to the CSS attribute `columnRuleColor`. 
     *         Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    column_rule_color(): string;
    column_rule_color(value: string): this;
    column_rule_color(value?: string): string | this {
        if (value == null) { return this.style.columnRuleColor; }
        this.style.columnRuleColor = value;
        (this.style as any).msColumnRuleColor = value;
        (this.style as any).webkitColumnRuleColor = value;
        (this.style as any).MozColumnRuleColor = value;
        (this.style as any).OColumnRuleColor = value;
        return this;
    }

    /**
     * @docs:
     * @title: Column Rule Style
     * @desc: Specifies the style of the rule between columns, equivalent to the CSS attribute `columnRuleStyle`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object for chaining unless parameter `value` is `null`, in which case the attribute's value is returned.
     * @funcs: 2
     */
    column_rule_style(): string;
    column_rule_style(value: string): this;
    column_rule_style(value?: string): this | string {
        if (value == null) { return this.style.columnRuleStyle; }
        this.style.columnRuleStyle = value;
        (this.style as any).msColumnRuleStyle = value;
        (this.style as any).webkitColumnRuleStyle = value;
        (this.style as any).MozColumnRuleStyle = value;
        (this.style as any).OColumnRuleStyle = value;
        return this;
    }

    /**
     * @docs:
     * @title: Column Rule Width
     * @desc: Specifies the width of the rule between columns. This is equivalent to the CSS attribute `columnRuleWidth`. 
     *         Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, in which case the attribute's value is returned.
     * @funcs: 2
     */
    column_rule_width(): string;
    column_rule_width(value: string | number): this;
    column_rule_width(value?: string | number): string | this {
        if (value == null) { return this.style.columnRuleWidth; }
        value = this.pad_numeric(value);
        this.style.columnRuleWidth = value;
        (this.style as any).msColumnRuleWidth = value;
        (this.style as any).webkitColumnRuleWidth = value;
        (this.style as any).MozColumnRuleWidth = value;
        (this.style as any).OColumnRuleWidth = value;
        return this;
    }

    /**
     * @docs:
     * @title: Column Span
     * @desc: Specifies how many columns an element should span across. 
     *        The equivalent of CSS attribute `columnSpan`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    column_span(): null | number;
    column_span(value: number): this;
    column_span(value?: number): this | null | number {
        if (value == null) { return this._try_parse_float(this.style.columnSpan, null); }
        this.style.columnSpan = value.toString();
        return this;
    }

    /**
     * @docs:
     * @title: Column Width
     * @desc: Specifies the column width, equivalent to the CSS attribute `columnWidth`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    column_width(): string;
    column_width(value: string | number): this;
    column_width(value?: string | number): string | this {
        if (value == null) { return this.style.columnWidth; }
        value = this.pad_numeric(value);
        this.style.columnWidth = value;
        (this.style as any).msColumnWidth = value;
        (this.style as any).webkitColumnWidth = value;
        (this.style as any).MozColumnWidth = value;
        (this.style as any).OColumnWidth = value;
        return this;
    }

    /**
     * @docs:
     * @title: Columns
     * @desc: A shorthand property for column-width and column-count. The equivalent of CSS attribute `columns`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    columns(): string;
    columns(value: string | number): this;
    columns(value?: string | number): string | this {
        if (value == null) { return this.style.columns; }
        this.style.columns = value.toString();
        return this;
    }

    /**
     * @docs:
     * @title: Content
     * @desc: Used with the :before and :after pseudo-elements, to insert generated content. The equivalent of CSS attribute `content`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    content(): string;
    content(value: string | number): this;
    content(value?: string | number): string | this {
        if (value == null) {
            return this.style.content ?? "";
        }
        this.style.content = value.toString();
        return this;
    }

    /**
     * @docs:
     * @title: Counter Increment
     * @desc: Increases or decreases the value of one or more CSS counters. 
     *        The equivalent of CSS attribute `counterIncrement`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    counter_increment(): string;
    counter_increment(value: string | number): this;
    counter_increment(value?: string | number): string | this {
        if (value == null) { return this.style.counterIncrement; }
        this.style.counterIncrement = value.toString();
        return this;
    }

    /**
     * @docs:
     * @title: Counter reset
     * @desc: Creates or resets one or more CSS counters. The equivalent of CSS attribute `counterReset`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    counter_reset(): string;
    counter_reset(value: string): this;
    counter_reset(value?: string): string | this {
        if (value == null) { return this.style.counterReset; }
        this.style.counterReset = value;
        return this;
    }

    /**
     * @docs:
     * @title: Cursor
     * @desc: Specifies the mouse cursor to be displayed when pointing over an element. 
     *        The equivalent of CSS attribute `cursor`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining, unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    cursor(): string;
    cursor(value: string): this;
    cursor(value?: string): string | this {
        if (value == null) { return this.style.cursor; }
        this.style.cursor = value;
        return this;
    }

    /**
     * @docs:
     * @title: Direction
     * @desc: Specifies the text direction/writing direction. The equivalent of CSS attribute `direction`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    direction(): string;
    direction(value: string): this;
    direction(value?: string): string | this {
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

    /**
     * @docs:
     * @title: Empty Cells
     * @desc: Specifies whether or not to display borders and background on empty cells in a table. The equivalent of CSS attribute `emptyCells`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    empty_cells(): string;
    empty_cells(value: string): this;
    empty_cells(value?: string): string | this {
        if (value == null) { return this.style.emptyCells ?? ""; }
        this.style.emptyCells = value;
        return this;
    }

    /**
     * @docs:
     * @title: Filter
     * @desc: 
     * Defines effects (e.g. blurring or color shifting) on an element before the element is displayed.
     * The equivalent of CSS attribute `filter`.
     * 
     * Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the attribute's value if `value` is `null`, otherwise returns the instance of the element for chaining.
     * @funcs: 2
     */
    filter(): string;
    filter(value: string): this;
    filter(value?: string): string | this {
        if (value == null) { return this.style.filter; }
        this.style.filter = value;
        (this.style as any).msFilter = value;
        (this.style as any).webkitFilter = value;
        (this.style as any).MozFilter = value;
        (this.style as any).OFilter = value;
        return this;
    }

    /**
     * @docs:
     * @title: Flex
     * @description: 
     *     A shorthand property for the flex-grow, flex-shrink, and the flex-basis properties.
     *     The equivalent of CSS attribute `flex`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    flex(): string;
    flex(value: boolean | number | string): this;
    flex(value?: boolean | number | string): string | this {
        if (value == null) { return this.style.flex; }
        if (value === true) { value = 1; }
        else if (value === false) { value = 0; }
        if (typeof value !== "string") { value = value.toString(); }
        this.style.flex = value.toString();
        (this.style as any).msFlex = value.toString();
        (this.style as any).webkitFlex = value.toString();
        (this.style as any).MozFlex = value.toString();
        (this.style as any).OFlex = value.toString();
        return this;
    }

    /**
     * @docs:
     * @title: Flex Basis
     * @desc: Specifies the initial length of a flexible item. The equivalent of CSS attribute `flexBasis`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    flex_basis(): string;
    flex_basis(value: string | number): this;
    flex_basis(value?: string | number): string | this {
        if (value == null) { return this.style.flexBasis; }
        value = value.toString();
        this.style.flexBasis = value;
        (this.style as any).msFlexBasis = value;
        (this.style as any).webkitFlexBasis = value;
        (this.style as any).MozFlexBasis = value;
        (this.style as any).OFlexBasis = value;
        return this;
    }

    /**
     * @docs:
     * @title: Flex Direction
     * @desc: Specifies the direction of the flexible items. This is the equivalent of the CSS attribute `flexDirection`.
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining. If `value` is `null`, returns the current attribute's value.
     * @funcs: 2
     */
    flex_direction(): string;
    flex_direction(value: string): this;
    flex_direction(value?: string): string | this {
        if (value == null) { return this.style.flexDirection; }
        this.style.flexDirection = value;
        (this.style as any).msFlexDirection = value;
        (this.style as any).webkitFlexDirection = value;
        (this.style as any).MozFlexDirection = value;
        (this.style as any).OFlexDirection = value;
        return this;
    }

    /**
     * @docs:
     * @title: Flex Flow
     * @desc: A shorthand property for the flex-direction and the flex-wrap properties. 
     *        The equivalent of CSS attribute `flexFlow`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    flex_flow(): string;
    flex_flow(value: string): this;
    flex_flow(value?: string): string | this {
        if (value == null) { return this.style.flexFlow; }
        this.style.flexFlow = value;
        (this.style as any).msFlexFlow = value;
        (this.style as any).webkitFlexFlow = value;
        (this.style as any).MozFlexFlow = value;
        (this.style as any).OFlexFlow = value;
        return this;
    }

    /**
     * @docs:
     * @title: Flex Grow
     * @desc: Specifies how much the item will grow relative to the rest. The equivalent of CSS attribute `flexGrow`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    flex_grow(): null | number;
    flex_grow(value: string | number): this;
    flex_grow(value?: string | number): null | number | this {
        if (value == null) { return this._try_parse_float(this.style.flexGrow, null); }
        value = value.toString();
        this.style.flexGrow = value;
        (this.style as any).msFlexGrow = value;
        (this.style as any).webkitFlexGrow = value;
        (this.style as any).MozFlexGrow = value;
        (this.style as any).OFlexGrow = value;
        return this;
    }

    /**
     * @docs:
     * @title: Flex Shrink
     * @desc: Specifies how the item will shrink relative to the rest. 
     *        The equivalent of CSS attribute `flexShrink`. 
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the attribute value when parameter `value` is `null`. 
     *                   Otherwise, returns the instance of the element for chaining.
     * @funcs: 2
     */
    flex_shrink(): null | number;
    flex_shrink(value: string | number): this;
    flex_shrink(value?: string | number): null | number | this {
        if (value == null) { return this._try_parse_float(this.style.flexShrink, null); }
        value = value.toString();
        this.style.flexShrink = value;
        (this.style as any).msFlexShrink = value;
        (this.style as any).webkitFlexShrink = value;
        (this.style as any).MozFlexShrink = value;
        (this.style as any).OFlexShrink = value;
        return this;
    }

    /**
     * @docs:
     * @title: Flex Wrap
     * @desc: Specifies whether the flexible items should wrap or not. The equivalent of CSS attribute `flexWrap`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the attribute's value if `value` is `null`, otherwise returns the instance of the element for chaining.
     * @funcs: 2
     */
    flex_wrap(): string;
    flex_wrap(value: string): this;
    flex_wrap(value?: string): string | this {
        if (value == null) { return this.style.flexWrap; }
        this.style.flexWrap = value;
        (this.style as any).msFlexWrap = value;
        (this.style as any).webkitFlexWrap = value;
        (this.style as any).MozFlexWrap = value;
        (this.style as any).OFlexWrap = value;
        return this;
    }

    /**
     * @docs:
     * @title: Float
     * @desc: Specifies whether an element should float to the left, right, or not at all. 
     *        The equivalent of CSS attribute `float`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    float(): string;
    float(value: string): this;
    float(value?: string): string | this {
        if (value == null) { return this.style.float; }
        this.style.float = value;
        return this;
    }

    /**
     * @docs:
     * @title: Font
     * @desc: A shorthand property for the font-style, font-variant, font-weight, font-size/line-height, and the font-family properties. 
     *        The equivalent of CSS attribute `font`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the instance of the element for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    font(): string;
    font(value: string): this;
    font(value?: string): string | this {
        if (value == null) { return this.style.font; }
        this.style.font = value;
        return this;
    }

    /**
     * @docs:
     * @title: Font Family
     * @desc: Specifies the font family for text. This is the equivalent of the CSS attribute `fontFamily`. 
     *         Returns the attribute value when the parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining, or the attribute's value if `value` is `null`.
     * @funcs: 2
     */
    font_family(): string;
    font_family(value: string): this;
    font_family(value?: string): this | string {
        if (value == null) { return this.style.fontFamily; }
        this.style.fontFamily = value;
        return this;
    }

    /**
     * @docs:
     * @title: Font Feature Settings
     * @desc: Allows control over advanced typographic features in OpenType fonts. The equivalent of CSS attribute `fontFeatureSettings`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    font_feature_settings(): string;
    font_feature_settings(value: string): this;
    font_feature_settings(value?: string): string | this {
        if (value == null) { return this.style.fontFeatureSettings; }
        this.style.fontFeatureSettings = value;
        return this;
    }

    /**
     * @docs:
     * @title: Font Kerning
     * @desc: Controls the usage of the kerning information (how letters are spaced). The equivalent of CSS attribute `fontKerning`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    font_kerning(): string;
    font_kerning(value: string): this;
    font_kerning(value?: string): string | this {
        if (value == null) { return this.style.fontKerning; }
        this.style.fontKerning = value;
        return this;
    }

    /**
     * @docs:
     * @title: Font Language Override
     * @description: 
     *     Controls the usage of language-specific glyphs in a typeface.
     *     The equivalent of CSS attribute `fontLanguageOverride`.
     *     
     *     Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the attribute's value if `value` is `null`, otherwise returns the instance for chaining.
     * @funcs: 2
     */
    font_language_override(): string;
    font_language_override(value: string): this;
    font_language_override(value?: string): string | this {
        if (value == null) { return (this.style as any).fontLanguageOverride; }
        (this.style as any).fontLanguageOverride = value;
        return this;
    }

    /**
     * @docs:
     * @title: Font size
     * @desc: Specifies the font size of text. The equivalent of CSS attribute `fontSize`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    font_size(): string;
    font_size(value: string | number): this;
    font_size(value?: string | number): string | this {
        if (value == null) { return this.style.fontSize; }
        this.style.fontSize = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Font Size Adjust
     * @desc: Preserves the readability of text when font fallback occurs. The equivalent of CSS attribute `fontSizeAdjust`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    font_size_adjust(): string;
    font_size_adjust(value: string): this;
    font_size_adjust(value?: string): string | this {
        if (value == null) { return this.style.fontSizeAdjust; }
        this.style.fontSizeAdjust = value;
        return this;
    }

    /**
     * @docs:
     * @title: Font Stretch
     * @desc: Selects a normal, condensed, or expanded face from a font family. 
     *        The equivalent of CSS attribute `fontStretch`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining, unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    font_stretch(): string;
    font_stretch(value: string): this;
    font_stretch(value?: string): string | this {
        if (value == null) { return this.style.fontStretch; }
        this.style.fontStretch = value;
        return this;
    }

    /**
     * @docs:
     * @title: Font Style
     * @desc: Specifies the font style for text. The equivalent of CSS attribute `fontStyle`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    font_style(): string;
    font_style(value: string): this;
    font_style(value?: string): string | this {
        if (value == null) { return this.style.fontStyle; }
        this.style.fontStyle = value;
        return this;
    }

    /**
     * @docs:
     * @title: Font synthesis
     * @desc: Controls which missing typefaces (bold or italic) may be synthesized by the browser. The equivalent of CSS attribute `fontSynthesis`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    font_synthesis(): string;
    font_synthesis(value: string): this;
    font_synthesis(value?: string): string | this {
        if (value == null) { return this.style.fontSynthesis; }
        this.style.fontSynthesis = value;
        return this;
    }

    /**
     * @docs:
     * @title: Font Variant
     * @desc: Specifies whether or not a text should be displayed in a small-caps font. The equivalent of CSS attribute `fontVariant`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    font_variant(): string;
    font_variant(value: string): this;
    font_variant(value?: string): string | this {
        if (value == null) { return this.style.fontVariant; }
        this.style.fontVariant = value;
        return this;
    }

    /**
     * @docs:
     * @title: Font variant alternates
     * @desc: Controls the usage of alternate glyphs associated to alternative names defined in \@font-feature-values. 
     *        The equivalent of CSS attribute `fontVariantAlternates`. 
     * @param:
     *     @name: value
     *     @description The value to assign. Leave `null` to retrieve the attribute's value.
     *     @type string, null
     * @return:
     *     @description Returns the attribute value when parameter `value` is `null`. Otherwise, returns the instance of the element for chaining.
     * @funcs: 2
     */
    font_variant_alternates(): string;
    font_variant_alternates(value: string): this;
    font_variant_alternates(value?: string): string | this {
        if (value == null) { return this.style.fontVariantAlternates; }
        this.style.fontVariantAlternates = value;
        return this;
    }

    /**
     * @docs:
     * @title: Font Variant Caps
     * @desc: Controls the usage of alternate glyphs for capital letters. The equivalent of CSS attribute `fontVariantCaps`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    font_variant_caps(): string;
    font_variant_caps(value: string): this;
    font_variant_caps(value?: string): string | this {
        if (value == null) { return this.style.fontVariantCaps; }
        this.style.fontVariantCaps = value;
        return this;
    }

    /**
     * @docs:
     * @title: Font Variant East Asian
     * @desc: Controls the usage of alternate glyphs for East Asian scripts (e.g Japanese and Chinese).
     *        The equivalent of CSS attribute `fontVariantEastAsian`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the attribute's value if `value` is `null`, otherwise returns the instance of the element for chaining.
     * @funcs: 2
     */
    font_variant_east_asian(): string;
    font_variant_east_asian(value: string): this;
    font_variant_east_asian(value?: string): string | this {
        if (value == null) { return this.style.fontVariantEastAsian; }
        this.style.fontVariantEastAsian = value;
        return this;
    }

    /**
     * @docs:
     * @title: Font Variant Ligatures
     * @desc: Controls which ligatures and contextual forms are used in textual content of the elements it applies to. The equivalent of CSS attribute `fontVariantLigatures`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    font_variant_ligatures(): string;
    font_variant_ligatures(value: string): this;
    font_variant_ligatures(value?: string): string | this {
        if (value == null) { return this.style.fontVariantLigatures; }
        this.style.fontVariantLigatures = value;
        return this;
    }

    /**
     * @docs:
     * @title: Font Variant Numeric
     * @description: 
     *      Controls the usage of alternate glyphs for numbers, fractions, and ordinal markers.
     *      The equivalent of CSS attribute `fontVariantNumeric`.
     *      
     *      Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    font_variant_numeric(): string;
    font_variant_numeric(value: string): this;
    font_variant_numeric(value?: string): string | this {
        if (value == null) { return this.style.fontVariantNumeric; }
        this.style.fontVariantNumeric = value;
        return this;
    }

    /**
     * @docs:
     * @title: Font Variant Position
     * @description: 
     *     Controls the usage of alternate glyphs of smaller size positioned as superscript or subscript regarding the baseline of the font.
     *     The equivalent of CSS attribute `fontVariantPosition`.
     *     Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    font_variant_position(): string;
    font_variant_position(value: string): this;
    font_variant_position(value?: string): string | this {
        if (value == null) { return this.style.fontVariantPosition; }
        this.style.fontVariantPosition = value;
        return this;
    }

    /**
     * @docs:
     * @title: Font Weight
     * @desc: Specifies the weight of a font, equivalent to the CSS attribute `fontWeight`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the attribute's value if `value` is `null`, otherwise returns the instance for chaining.
     * @funcs: 2
     */
    font_weight(): string;
    font_weight(value: string | number): this;
    font_weight(value?: string | number): string | this {
        if (value == null) { return this.style.fontWeight; }
        this.style.fontWeight = value.toString();
        return this;
    }

    /**
     * @docs:
     * @title: Gap
     * @desc: A shorthand property for the row-gap and the column-gap properties. The equivalent of CSS attribute `gap`. 
     * Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    gap(): string;
    gap(value: string | number): this;
    gap(value?: string | number): string | this {
        if (value == null) { return this.style.gap; }
        this.style.gap = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Grid
     * @desc: A shorthand property for the grid-template-rows, grid-template-columns, grid-template-areas, grid-auto-rows, grid-auto-columns, and the grid-auto-flow properties. The equivalent of CSS attribute `grid`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description The value to assign. Leave `null` to retrieve the attribute's value.
     *     @type string, null
     * @return:
     *     @description Returns the attribute's value when `value` is `null`, otherwise returns the instance of the element for chaining.
     * @funcs: 2
     */
    grid(): string;
    grid(value: string): this;
    grid(value?: string): string | this {
        if (value == null) { return this.style.grid; }
        this.style.grid = value;
        return this;
    }

    /**
     * @docs:
     * @title: Grid Area
     * @desc: Either specifies a name for the grid item, or serves as a shorthand for grid-row-start, grid-column-start, grid-row-end, and grid-column-end properties. 
     *        The equivalent of CSS attribute `gridArea`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object for chaining unless `value` is `null`, in which case the attribute's value is returned.
     * @funcs: 2
     */
    grid_area(): string;
    grid_area(value: string): this;
    grid_area(value?: string): string | this {
        if (value == null) { return this.style.gridArea; }
        this.style.gridArea = value;
        return this;
    }

    /**
     * @docs:
     * @title: Grid Auto Columns
     * @desc: Specifies a default column size, equivalent to the CSS attribute `gridAutoColumns`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    grid_auto_columns(): string;
    grid_auto_columns(value: string | number): this;
    grid_auto_columns(value?: string | number): string | this {
        if (value == null) { return this.style.gridAutoColumns; }
        this.style.gridAutoColumns = value.toString();
        return this;
    }

    /**
     * @docs:
     * @title: Grid Auto Flow
     * @desc: Specifies how auto-placed items are inserted in the grid. The equivalent of CSS attribute `gridAutoFlow`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the attribute's value when `value` is `null`, otherwise returns the instance of the element for chaining.
     * @funcs: 2
     */
    grid_auto_flow(): string;
    grid_auto_flow(value: string): this;
    grid_auto_flow(value?: string): string | this {
        if (value == null) { return this.style.gridAutoFlow; }
        this.style.gridAutoFlow = value;
        return this;
    }

    /**
     * @docs:
     * @title: Grid auto rows
     * @desc: Specifies a default row size, equivalent to the CSS attribute `gridAutoRows`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    grid_auto_rows(): string;
    grid_auto_rows(value: string | number): this;
    grid_auto_rows(value?: string | number): string | this {
        if (value == null) { return this.style.gridAutoRows; }
        this.style.gridAutoRows = value.toString();
        return this;
    }

    /**
     * @docs:
     * @title: Grid Column
     * @description: 
     *     A shorthand property for the grid-column-start and the grid-column-end properties.
     *     The equivalent of CSS attribute `gridColumn`.
     *     
     *     Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    grid_column(): string;
    grid_column(value: string): this;
    grid_column(value?: string): string | this {
        if (value == null) { return this.style.gridColumn; }
        this.style.gridColumn = value;
        return this;
    }

    /**
     * @docs:
     * @title: Grid Column End
     * @desc: Specifies where to end the grid item. The equivalent of CSS attribute `gridColumnEnd`.
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    grid_column_end(): string;
    grid_column_end(value: string | number): this;
    grid_column_end(value?: string | number): string | this {
        if (value == null) { return this.style.gridColumnEnd; }
        this.style.gridColumnEnd = value.toString();
        return this;
    }

    /**
     * @docs:
     * @title: Grid Column Gap
     * @desc: Specifies the size of the gap between columns. The equivalent of CSS attribute `gridColumnGap`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    grid_column_gap(): string;
    grid_column_gap(value: string | number): this;
    grid_column_gap(value?: string | number): this | string {
        if (value == null) { return this.style.gridColumnGap; }
        this.style.gridColumnGap = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Grid Column Start
     * @desc: Specifies where to start the grid item. This is the equivalent of the CSS attribute `gridColumnStart`. 
     *         Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the current value of the grid column start when `null` is passed, otherwise returns the instance for chaining.
     * @funcs: 2
     */
    grid_column_start(): string;
    grid_column_start(value: string | number): this;
    grid_column_start(value?: string | number): string | this {
        if (value == null) { return this.style.gridColumnStart; }
        this.style.gridColumnStart = value.toString();
        return this;
    }

    /**
     * @docs:
     * @title: Grid Gap
     * @desc: A shorthand property for the grid-row-gap and grid-column-gap properties. 
     *        The equivalent of CSS attribute `gridGap`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    grid_gap(): string;
    grid_gap(value: string | number): this;
    grid_gap(value?: string | number): string | this {
        if (value == null) { return this.style.gridGap; }
        this.style.gridGap = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Grid Row
     * @description: 
     * A shorthand property for the grid-row-start and the grid-row-end properties.
     * The equivalent of CSS attribute `gridRow`.
     * 
     * Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description The value to assign. Leave `null` to retrieve the attribute's value.
     *     @type string, null
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    grid_row(): string;
    grid_row(value: string): this;
    grid_row(value?: string): string | this {
        if (value == null) { return this.style.gridRow; }
        this.style.gridRow = value;
        return this;
    }

    /**
     * @docs:
     * @title: Grid Row End
     * @desc: Specifies where to end the grid item. The equivalent of CSS attribute `gridRowEnd`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    grid_row_end(): string;
    grid_row_end(value: string): this;
    grid_row_end(value?: string): string | this {
        if (value == null) { return this.style.gridRowEnd; }
        this.style.gridRowEnd = value;
        return this;
    }

    /**
     * @docs:
     * @title: Grid Row Gap
     * @desc: Specifies the size of the gap between rows. The equivalent of CSS attribute `gridRowGap`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    grid_row_gap(): string;
    grid_row_gap(value: string | number): this;
    grid_row_gap(value?: string | number): string | this {
        if (value == null) { return this.style.gridRowGap; }
        this.style.gridRowGap = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Grid Row Start
     * @desc: Specifies where to start the grid item, equivalent to CSS attribute `gridRowStart`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    grid_row_start(): string;
    grid_row_start(value: string | number): this;
    grid_row_start(value?: string | number): string | this {
        if (value == null) { return this.style.gridRowStart; }
        this.style.gridRowStart = value.toString();
        return this;
    }

    /**
     * @docs:
     * @title: Grid Template
     * @desc: A shorthand property for the grid-template-rows, grid-template-columns and grid-areas properties. 
     *        The equivalent of CSS attribute `gridTemplate`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description The value to assign. Leave `null` to retrieve the attribute's value.
     *     @type string, null
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    grid_template(): string;
    grid_template(value: string): this;
    grid_template(value?: string): string | this {
        if (value == null) { return this.style.gridTemplate; }
        this.style.gridTemplate = value;
        return this;
    }

    /**
     * @docs:
     * @title: Grid Template Areas
     * @desc: Specifies how to display columns and rows, using named grid items. The equivalent of CSS attribute `gridTemplateAreas`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    grid_template_areas(): string;
    grid_template_areas(value: string): this;
    grid_template_areas(value?: string): string | this {
        if (value == null) { return this.style.gridTemplateAreas; }
        this.style.gridTemplateAreas = value;
        return this;
    }

    /**
     * @docs:
     * @title: Grid Template Columns
     * @desc: Specifies the size of the columns and how many columns in a grid layout. 
     *        The equivalent of CSS attribute `gridTemplateColumns`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    grid_template_columns(): string;
    grid_template_columns(value: string): this;
    grid_template_columns(value?: string): string | this {
        if (value == null) { return this.style.gridTemplateColumns; }
        this.style.gridTemplateColumns = value;
        return this;
    }

    /**
     * @docs:
     * @title: Grid Template Rows
     * @desc: Specifies the size of the rows in a grid layout, equivalent to the CSS attribute `gridTemplateRows`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    grid_template_rows(): string;
    grid_template_rows(value: string | number): this;
    grid_template_rows(value?: string | number): string | this {
        if (value == null) { return this.style.gridTemplateRows; }
        this.style.gridTemplateRows = value.toString();
        return this;
    }

    /**
     * @docs:
     * @title: Hanging punctuation
     * @desc: Specifies whether a punctuation character may be placed outside the line box. The equivalent of CSS attribute `hangingPunctuation`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    hanging_punctuation(): string;
    hanging_punctuation(value: string): this;
    hanging_punctuation(value?: string): string | this {
        if (value == null) { return (this.style as any).hangingPunctuation; }
        (this.style as any).hangingPunctuation = value;
        return this;
    }

    // Sets the height of an element.
    // height(value) {
    //     if (value == null) { return this.style.height; }
    //     this.style.height = this.pad_numeric(value);
    //     return this;
    // }

    /**
     * @docs:
     * @title: Hyphens
     * @desc: Sets how to split words to improve the layout of paragraphs. The equivalent of CSS attribute `hyphens`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the attribute's value if `value` is `null`, otherwise returns the instance of the element for chaining.
     * @funcs: 2
     */
    hyphens(): string;
    hyphens(value: string): this | string;
    hyphens(value?: string): this | string {
        if (value == null) { return this.style.hyphens; }
        this.style.hyphens = value;
        return this;
    }

    /**
     * @docs:
     * @title: Image Rendering
     * @desc: Specifies the type of algorithm to use for image scaling. The equivalent of CSS attribute `imageRendering`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    image_rendering(): string;
    image_rendering(value: string): this;
    image_rendering(value?: string): string | this {
        if (value == null) { return this.style.imageRendering; }
        this.style.imageRendering = value;
        return this;
    }

    /**
     * @docs:
     * @title: Inline Size
     * @desc: Specifies the size of an element in the inline direction. 
     *        The equivalent of CSS attribute `inlineSize`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    inline_size(): string;
    inline_size(value: string | number): this;
    inline_size(value?: string | number): string | this {
        if (value == null) { return this.style.inlineSize; }
        this.style.inlineSize = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Inset
     * @desc: Specifies the distance between an element and the parent element. 
     *        The equivalent of CSS attribute `inset`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining, unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    inset(): string;
    inset(value: string | number): this;
    inset(value?: string | number): string | this {
        if (value == null) { return this.style.inset; }
        this.style.inset = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Inset Block
     * @desc: Specifies the distance between an element and the parent element in the block direction. 
     *        The equivalent of CSS attribute `insetBlock`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    inset_block(): string | undefined;
    inset_block(value: string | number): this;
    inset_block(value?: string | number): string | this | undefined {
        if (value == null) { return this.style.insetBlock; }
        this.style.insetBlock = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Inset Block End
     * @desc: Specifies the distance between the end of an element and the parent element in the block direction.
     *        The equivalent of CSS attribute `insetBlockEnd`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    inset_block_end(): string;
    inset_block_end(value: string | number): this;
    inset_block_end(value?: string | number): string | this {
        if (value == null) { return this.style.insetBlockEnd ?? ""; }
        this.style.insetBlockEnd = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Inset Block Start
     * @desc: Specifies the distance between the start of an element and the parent element in the block direction. 
     *        The equivalent of CSS attribute `insetBlockStart`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    inset_block_start(): string;
    inset_block_start(value: string | number): this;
    inset_block_start(value?: string | number): string | this {
        if (value == null) { return this.style.insetBlockStart; }
        this.style.insetBlockStart = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Inset inline
     * @desc: Specifies the distance between an element and the parent element in the inline direction. 
     *        The equivalent of CSS attribute `insetInline`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    inset_inline(): string;
    inset_inline(value: string | number): this;
    inset_inline(value?: string | number): this | string {
        if (value == null) { return this.style.insetInline; }
        this.style.insetInline = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Inset Inline End
     * @desc: Specifies the distance between the end of an element and the parent element in the inline direction.
     *        The equivalent of CSS attribute `insetInlineEnd`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the attribute's value when `value` is `null`, otherwise returns the instance of the element for chaining.
     * @funcs: 2
     */
    inset_inline_end(): string;
    inset_inline_end(value: string | number): this;
    inset_inline_end(value?: string | number): string | this {
        if (value == null) { return this.style.insetInlineEnd; }
        this.style.insetInlineEnd = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Inset Inline Start
     * @desc: Specifies the distance between the start of an element and the parent element in the inline direction. 
     *        The equivalent of CSS attribute `insetInlineStart`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    inset_inline_start(): string;
    inset_inline_start(value: string | number): this;
    inset_inline_start(value?: string | number): this | string {
        if (value == null) { return this.style.insetInlineStart; }
        this.style.insetInlineStart = this.pad_numeric(value);;
        return this;
    }

    /**
     * @docs:
     * @title: Isolation
     * @description: 
     *     Defines whether an element must create a new stacking content.
     *     The equivalent of CSS attribute `isolation`. 
     *     Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    isolation(): string;
    isolation(value: string): this;
    isolation(value?: string): string | this {
        if (value == null) { return this.style.isolation; }
        this.style.isolation = value;
        return this;
    }

    /**
     * @docs:
     * @title: Justify Content
     * @desc: Specifies the alignment between the items inside a flexible container when the items do not use all available space. The equivalent of CSS attribute `justifyContent`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the attribute's value when parameter `value` is `null`. Otherwise, returns the instance of the element for chaining.
     * @funcs: 2
     */
    justify_content(): string;
    justify_content(value: string): this;
    justify_content(value?: string): string | this {
        if (value == null) { return this.style.justifyContent; }
        this.style.justifyContent = value;
        (this.style as any).msJustifyContent = value;
        (this.style as any).webkitJustifyContent = value;
        (this.style as any).MozJustifyContent = value;
        (this.style as any).OJustifyContent = value;
        return this;
    }

    /**
     * @docs:
     * @title: Justify Items
     * @desc: Sets the alignment of grid items in the inline direction on the grid container.
     * The equivalent of the CSS attribute `justify-items`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining, unless `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    justify_items(): string;
    justify_items(value: string): this;
    justify_items(value?: string): string | this {
        if (value == null) { return this.style.justifyItems; }
        this.style.justifyItems = value;
        return this;
    }

    /**
     * @docs:
     * @title: Justify Self
     * @desc: Sets the alignment of the grid item in the inline direction. This corresponds to the CSS attribute `justify-self`. 
     *          When the parameter `value` is `null`, it retrieves the current attribute value.
     * @param:
     *     @name: value
     *     @descr: The value to assign for alignment. Passing `null` retrieves the current value.
     * @return:
     *     @description Returns the current alignment value if `value` is `null`, otherwise returns the instance for chaining.
     * @funcs: 2
     */
    justify_self(): string;
    justify_self(value: string): this;
    justify_self(value?: string): string | this {
        if (value == null) { return this.style.justifySelf; }
        this.style.justifySelf = value;
        return this;
    }

    /**
     * @docs:
     * @title: Left
     * @desc: Specifies the left position of a positioned element. The equivalent of CSS attribute `left`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    left(): string;
    left(value: string | number): this;
    left(value?: string | number): string | this {
        if (value == null) { return this.style.left; }
        this.style.left = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Letter spacing
     * @desc: Increases or decreases the space between characters in a text. 
     *        The equivalent of CSS attribute `letterSpacing`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    letter_spacing(): string;
    letter_spacing(value: string | number): this;
    letter_spacing(value?: string | number): string | this {
        if (value == null) { return this.style.letterSpacing; }
        this.style.letterSpacing = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Line Break
     * @desc: Specifies how/if to break lines. The equivalent of CSS attribute `lineBreak`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    line_break(): string;
    line_break(value: string): this;
    line_break(value?: string): string | this {
        if (value == null) { return this.style.lineBreak; }
        this.style.lineBreak = value;
        return this;
    }

    /**
     * @docs:
     * @title: Line Height
     * @desc: Sets the line height, equivalent to the CSS attribute `lineHeight`. 
     *        Returns the attribute value when the parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    line_height(): string;
    line_height(value: string | number): this;
    line_height(value?: string | number): string | this {
        if (value == null) { return this.style.lineHeight; }
        this.style.lineHeight = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: List Style
     * @desc: Sets all the properties for a list in one declaration. The equivalent of CSS attribute `listStyle`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description The value to assign. Leave `null` to retrieve the attribute's value.
     *     @type string, null
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    list_style(): string;
    list_style(value: string): this;
    list_style(value?: string): string | this {
        if (value == null) { return this.style.listStyle; }
        this.style.listStyle = value;
        return this;
    }

    /**
     * @docs:
     * @title: List style image
     * @desc: Specifies an image as the list-item marker. The equivalent of CSS attribute `listStyleImage`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    list_style_image(): string;
    list_style_image(value: string): this;
    list_style_image(value?: string): string | this {
        if (value == null) { return this.style.listStyleImage; }
        this.style.listStyleImage = value;
        return this;
    }

    /**
     * @docs:
     * @title: List Style Position
     * @desc: Specifies the position of the list-item markers (bullet points). 
     *        The equivalent of CSS attribute `listStylePosition`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the attribute's value when `value` is `null`, otherwise returns the instance of the element for chaining.
     * @funcs: 2
     */
    list_style_position(): string;
    list_style_position(value: string): this;
    list_style_position(value?: string): string | this {
        if (value == null) { return this.style.listStylePosition; }
        this.style.listStylePosition = value;
        return this;
    }

    /**
     * @docs:
     * @title: List style type
     * @desc: Specifies the type of list-item marker. The equivalent of CSS attribute `listStyleType`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    list_style_type(): string;
    list_style_type(value: string): this;
    list_style_type(value?: string): string | this {
        if (value == null) { return this.style.listStyleType; }
        this.style.listStyleType = value;
        return this;
    }

    /**
     * @docs:
     * @title: Margin Block
     * @desc: Specifies the margin in the block direction. 
     *        The equivalent of CSS attribute `marginBlock`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    margin_block(): string;
    margin_block(value: string | number): this;
    margin_block(value?: string | number): this | string {
        if (value == null) { return this.style.marginBlock; }
        this.style.marginBlock = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Margin Block End
     * @desc: Specifies the margin at the end in the block direction. 
     *        The equivalent of CSS attribute `marginBlockEnd`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    margin_block_end(): string;
    margin_block_end(value: string | number): this;
    margin_block_end(value?: string | number): string | this {
        if (value == null) { return this.style.marginBlockEnd; }
        this.style.marginBlockEnd = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Margin Block Start
     * @desc: Specifies the margin at the start in the block direction. 
     *        The equivalent of CSS attribute `marginBlockStart`. 
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    margin_block_start(): string;
    margin_block_start(value: string | number): this;
    margin_block_start(value?: string | number): this | string {
        if (value == null) { return this.style.marginBlockStart; }
        this.style.marginBlockStart = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Margin Inline
     * @desc: Specifies the margin in the inline direction. The equivalent of CSS attribute `marginInline`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    margin_inline(): string;
    margin_inline(value: string | number): this;
    margin_inline(value?: string | number): string | this {
        if (value == null) { return this.style.marginInline; }
        this.style.marginInline = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Margin Inline End
     * @desc: Specifies the margin at the end in the inline direction. This is the equivalent of the CSS attribute `marginInlineEnd`. 
     * Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    margin_inline_end(): string;
    margin_inline_end(value: string | number): this;
    margin_inline_end(value?: string | number): string | this {
        if (value == null) { return this.style.marginInlineEnd; }
        this.style.marginInlineEnd = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Margin Inline Start
     * @desc: Specifies the margin at the start in the inline direction. 
     *        The equivalent of CSS attribute `marginInlineStart`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    margin_inline_start(): string;
    margin_inline_start(value: string | number): this;
    margin_inline_start(value?: string | number): string | this {
        if (value == null) { return this.style.marginInlineStart; }
        this.style.marginInlineStart = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Mask
     * @desc: Hides parts of an element by masking or clipping an image at specific places. 
     *        The equivalent of CSS attribute `mask`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    mask(): string;
    mask(value: string): this;
    mask(value?: string): string | this {
        if (value == null) { return this.style.mask; }
        this.style.mask = value;
        (this.style as any).msMask = value;
        (this.style as any).webkitMask = value;
        (this.style as any).MozMask = value;
        (this.style as any).OMask = value;
        return this;
    }

    /**
     * @docs:
     * @title: Mask clip
     * @desc: Specifies the mask area. The equivalent of CSS attribute `maskClip`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description The value to assign. Leave `null` to retrieve the attribute's value.
     *     @type string, null
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    mask_clip(): string;
    mask_clip(value: string): this;
    mask_clip(value?: string): string | this {
        if (value == null) { return this.style.maskClip; }
        this.style.maskClip = value;
        return this;
    }

    /**
     * @docs:
     * @title: Mask Composite
     * @desc: Represents a compositing operation used on the current mask layer with the mask layers below it. 
     *        The equivalent of CSS attribute `maskComposite`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    mask_composite(): string;
    mask_composite(value: string): this;
    mask_composite(value?: string): string | this {
        if (value == null) { return this.style.maskComposite; }
        this.style.maskComposite = value;
        (this.style as any).msMaskComposite = value;
        (this.style as any).webkitMaskComposite = value;
        (this.style as any).MozMaskComposite = value;
        (this.style as any).OMaskComposite = value;
        return this;
    }

    /**
     * @docs:
     * @title: Mask Image
     * @desc: Specifies an image to be used as a mask layer for an element. 
     *        The equivalent of CSS attribute `maskImage`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    mask_image(): string;
    mask_image(value: string): this;
    mask_image(value?: string): string | this {
        if (value == null) { return this.style.maskImage; }
        this.style.maskImage = value;
        (this.style as any).msMaskImage = value;
        (this.style as any).webkitMaskImage = value;
        (this.style as any).MozMaskImage = value;
        (this.style as any).OMaskImage = value;
        return this;
    }

    /**
     * @docs:
     * @title: Mask Mode
     * @description: 
     *     Specifies whether the mask layer image is treated as a luminance mask or as an alpha mask.
     *     The equivalent of CSS attribute `maskMode`.
     *     Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    mask_mode(): string;
    mask_mode(value: string): this;
    mask_mode(value?: string): string | this {
        if (value == null) { return this.style.maskMode; }
        this.style.maskMode = value;
        return this;
    }

    /**
     * @docs:
     * @title: Mask origin
     * @desc: Specifies the origin position (the mask position area) of a mask layer image. The equivalent of CSS attribute `maskOrigin`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    mask_origin(): string;
    mask_origin(value: string): this;
    mask_origin(value?: string): string | this {
        if (value == null) { return this.style.maskOrigin; }
        this.style.maskOrigin = value;
        return this;
    }

    /**
     * @docs:
     * @title: Mask Position
     * @desc: Sets the starting position of a mask layer image (relative to the mask position area).
     *        The equivalent of CSS attribute `maskPosition`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    mask_position(): string;
    mask_position(value: string): this;
    mask_position(value?: string): string | this {
        if (value == null) { return this.style.maskPosition; }
        this.style.maskPosition = value;
        return this;
    }

    /**
     * @docs:
     * @title: Mask Repeat
     * @desc: Specifies how the mask layer image is repeated. The equivalent of CSS attribute `maskRepeat`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    mask_repeat(): string;
    mask_repeat(value: string): this;
    mask_repeat(value?: string): string | this {
        if (value == null) { return this.style.maskRepeat; }
        this.style.maskRepeat = value;
        return this;
    }

    /**
     * @docs:
     * @title: Mask Size
     * @desc: Specifies the size of a mask layer image. The equivalent of CSS attribute `maskSize`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    mask_size(): string;
    mask_size(value: string | number): this;
    mask_size(value?: string | number): this | string {
        if (value == null) { return this.style.maskSize; }
        this.style.maskSize = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Mask type
     * @desc: Specifies whether an SVG \<mask> element is treated as a luminance mask or as an alpha mask. 
     *        The equivalent of CSS attribute `maskType`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    mask_type(): string;
    mask_type(value: string): this;
    mask_type(value?: string): string | this {
        if (value == null) { return this.style.maskType; }
        this.style.maskType = value;
        return this;
    }

    /**
     * @docs:
     * @title: Max height
     * @desc: Sets the maximum height of an element. This is the equivalent of the CSS attribute `maxHeight`. 
     * Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @descr: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    max_height(): number | string;
    max_height(value: string | number): this;
    max_height(value?: string | number): this | number | string {
        if (value == null) { return this.style.maxHeight; }
        this.style.maxHeight = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Max Width
     * @desc: Sets the maximum width of an element. The equivalent of CSS attribute `maxWidth`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    max_width(): number | string;
    max_width(value: string | number): this;
    max_width(value?: string | number): this | number | string {
        if (value == null) { return this.style.maxWidth; }
        this.style.maxWidth = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Max Block Size
     * @desc: Sets the maximum size of an element in the block direction. 
     * The equivalent of CSS attribute `maxBlockSize`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    max_block_size(): string;
    max_block_size(value: string | number): this;
    max_block_size(value?: string | number): this | string {
        if (value == null) { return this.style.maxBlockSize; }
        this.style.maxBlockSize = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Max inline size
     * @desc: Sets the maximum size of an element in the inline direction. 
     *        The equivalent of CSS attribute `maxInlineSize`. 
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    max_inline_size(): string | number;
    max_inline_size(value: string | number): this;
    max_inline_size(value?: string | number): string | number | this {
        if (value == null) { return this.style.maxInlineSize; }
        this.style.maxInlineSize = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Min Block Size
     * @desc: Sets the minimum size of an element in the block direction. The equivalent of CSS attribute `minBlockSize`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    min_block_size(): null | number;
    min_block_size(value: number): this;
    min_block_size(value?: number): this | null | number {
        if (value == null) { return this._try_parse_float(this.style.minBlockSize, null); }
        this.style.minBlockSize = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Min Inline Size
     * @desc: Sets the minimum size of an element in the inline direction. The equivalent of CSS attribute `minInlineSize`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    min_inline_size(): string;
    min_inline_size(value: string | number): this;
    min_inline_size(value?: string | number): string | this {
        if (value == null) { return this.style.minInlineSize; }
        this.style.minInlineSize = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Mix Blend Mode
     * @desc: Specifies how an element's content should blend with its direct parent background, equivalent to the CSS attribute `mixBlendMode`.
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    mix_blend_mode(): string;
    mix_blend_mode(value: string): this;
    mix_blend_mode(value?: string): string | this {
        if (value == null) { return this.style.mixBlendMode; }
        this.style.mixBlendMode = value;
        return this;
    }

    /**
     * @docs:
     * @title: Object fit
     * @desc: Specifies how the contents of a replaced element should be fitted to the box established by its used height and width. 
     *        The equivalent of CSS attribute `objectFit`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the attribute's value when `value` is `null`, otherwise returns the instance of the element for chaining.
     * @funcs: 2
     */
    object_fit(): string;
    object_fit(value: string): this;
    object_fit(value?: string): string | this {
        if (value == null) { return this.style.objectFit; }
        this.style.objectFit = value;
        return this;
    }

    /**
     * @docs:
     * @title: Object position
     * @desc: Specifies the alignment of the replaced element inside its box. The equivalent of CSS attribute `objectPosition`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    object_position(): string;
    object_position(value: string): this;
    object_position(value?: string): string | this {
        if (value == null) { return this.style.objectPosition; }
        this.style.objectPosition = value;
        return this;
    }

    /**
     * @docs:
     * @title: Offset
     * @desc: Is a shorthand, and specifies how to animate an element along a path. The equivalent of CSS attribute `offset`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    offset(): string;
    offset(value: string | number): this;
    offset(value?: string | number): this | string {
        if (value == null) { return this.style.offset; }
        this.style.offset = value.toString();
        return this;
    }

    /**
     * @docs:
     * @title: Offset Anchor
     * @desc: Specifies a point on an element that is fixed to the path it is animated along. The equivalent of CSS attribute `offsetAnchor`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    offset_anchor(): string;
    offset_anchor(value: string): this;
    offset_anchor(value?: string): string | this {
        if (value == null) { return this.style.offsetAnchor; }
        this.style.offsetAnchor = value;
        return this;
    }

    /**
     * @docs:
     * @title: Offset distance
     * @desc: Specifies the position along a path where an animated element is placed. 
     *        The equivalent of CSS attribute `offsetDistance`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description The value to assign. Leave `null` to retrieve the attribute's value.
     *     @type string, number, null
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    offset_distance(): string;
    offset_distance(value: string | number): this;
    offset_distance(value?: string | number): string | this {
        if (value == null) { return this.style.offsetDistance; }
        this.style.offsetDistance = value.toString();
        return this;
    }

    /**
     * @docs:
     * @title: Offset Path
     * @desc: Specifies the path an element is animated along. 
     *        The equivalent of CSS attribute `offsetPath`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    offset_path(): string;
    offset_path(value: string): this;
    offset_path(value?: string): string | this {
        if (value == null) { return this.style.offsetPath; }
        this.style.offsetPath = value;
        return this;
    }

    /**
     * @docs:
     * @title: Offset Rotate
     * @desc: Specifies rotation of an element as it is animated along a path. 
     *        The equivalent of CSS attribute `offsetRotate`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    offset_rotate(): string;
    offset_rotate(value: string | number): this;
    offset_rotate(value?: string | number): string | this {
        if (value == null) { return this.style.offsetRotate; }
        this.style.offsetRotate = value as string;
        return this;
    }

    // Sets the opacity level for an element.
    // opacity(value) {
    //     if (value == null) { return this.style.opacity; }
    //     this.style.opacity = value;
    //     return this;
    // }

    /**
     * @docs:
     * @title: Order
     * @desc: Sets the order of the flexible item, relative to the rest. The equivalent of CSS attribute `order`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    order(): string;
    order(value: string | number): this;
    order(value?: string | number): string | this {
        if (value == null) { return this.style.order ?? ""; }
        value = value.toString();
        this.style.order = value;
        (this.style as any).msOrder = value;
        (this.style as any).webkitOrder = value;
        (this.style as any).MozOrder = value;
        (this.style as any).OOrder = value;
        return this;
    }

    /**
     * @docs:
     * @title: Orphans
     * @desc: Sets the minimum number of lines that must be left at the bottom of a page or column. 
     *        The equivalent of CSS attribute `orphans`. Returns the attribute value when parameter 
     *        `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining. If `value` is `null`, the attribute's value is returned.
     * @funcs: 2
     */
    orphans(): null | number;
    orphans(value: number): this;
    orphans(value?: number): this | number | null {
        if (value == null) { return this._try_parse_float(this.style.orphans, null); }
        this.style.orphans = value.toString();
        return this;
    }

    /**
     * @docs:
     * @title: Outline
     * @desc: A shorthand property for the outline-width, outline-style, and the outline-color properties. 
     *        The equivalent of CSS attribute `outline`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    outline(): string;
    outline(value: string): this;
    outline(value?: string): string | this {
        if (value == null) { return this.style.outline; }
        this.style.outline = value;
        return this;
    }

    /**
     * @docs:
     * @title: Outline Color
     * @desc: Sets the color of an outline. This is the equivalent of the CSS attribute `outlineColor`. 
     *        Returns the attribute value when the parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless the parameter `value` is `null`, 
     *                  in which case the attribute's value is returned.
     * @funcs: 2
     */
    outline_color(): string;
    outline_color(value: string): this;
    outline_color(value?: string): string | this {
        if (value == null) { return this.style.outlineColor; }
        this.style.outlineColor = value;
        return this;
    }

    /**
     * @docs:
     * @title: Outline Offset
     * @desc: Offsets an outline, and draws it beyond the border edge. The equivalent of CSS attribute `outlineOffset`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    outline_offset(): string;
    outline_offset(value: string | number): this;
    outline_offset(value?: string | number): string | this {
        if (value == null) { return this.style.outlineOffset; }
        this.style.outlineOffset = value.toString();
        return this;
    }

    /**
     * @docs:
     * @title: Outline Style
     * @desc: Sets the style of an outline. The equivalent of CSS attribute `outlineStyle`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    outline_style(): string;
    outline_style(value: string): this;
    outline_style(value?: string): string | this {
        if (value == null) { return this.style.outlineStyle; }
        this.style.outlineStyle = value;
        return this;
    }

    /**
     * @docs:
     * @title: Outline Width
     * @desc: Sets the width of an outline, equivalent to the CSS attribute `outlineWidth`.
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    outline_width(): string;
    outline_width(value: string | number): this;
    outline_width(value?: string | number): string | this {
        if (value == null) { return this.style.outlineWidth; }
        this.style.outlineWidth = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Overflow
     * @desc: Specifies what happens if content overflows an element's box. 
     *        The equivalent of CSS attribute `overflow`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the attribute's value if `value` is `null`, otherwise returns the instance of the element for chaining.
     * @funcs: 2
     */
    overflow(): string;
    overflow(value: string): this;
    overflow(value?: string): string | this {
        if (value == null) { return this.style.overflow; }
        this.style.overflow = value;
        return this;
    }

    /**
     * @docs:
     * @title: Overflow Anchor
     * @desc: Specifies whether or not content in viewable area in a scrollable container should be pushed down when new content is loaded above. 
     *        The equivalent of CSS attribute `overflowAnchor`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    overflow_anchor(): string;
    overflow_anchor(value: string): this;
    overflow_anchor(value?: string): string | this {
        if (value == null) { return this.style.overflowAnchor; }
        this.style.overflowAnchor = value;
        return this;
    }

    /**
     * @docs:
     * @title: Overflow Wrap
     * @desc: Specifies whether or not the browser can break lines with long words, if they overflow the container. The equivalent of CSS attribute `overflowWrap`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    overflow_wrap(): string;
    overflow_wrap(value: string): this;
    overflow_wrap(value?: string): string | this {
        if (value == null) { return this.style.overflowWrap; }
        this.style.overflowWrap = value;
        return this;
    }

    /**
     * @docs:
     * @title: Overflow x
     * @desc: Specifies whether or not to clip the left/right edges of the content, if it overflows the element's content area. 
     *        The equivalent of CSS attribute `overflowX`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    overflow_x(): string;
    overflow_x(value: string): this;
    overflow_x(value?: string): string | this {
        if (value == null) { return this.style.overflowX; }
        this.style.overflowX = value;
        return this;
    }

    /**
     * @docs:
     * @title: Overflow Y
     * @desc: Specifies whether or not to clip the top/bottom edges of the content, if it overflows the element's content area. 
     *        The equivalent of CSS attribute `overflowY`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    overflow_y(): string;
    overflow_y(value: string): this;
    overflow_y(value?: string): string | this {
        if (value == null) { return this.style.overflowY; }
        this.style.overflowY = value;
        return this;
    }

    /**
     * @docs:
     * @title: Overscroll behavior
     * @desc: Specifies whether to have scroll chaining or overscroll affordance in x- and y-directions. The equivalent of CSS attribute `overscrollBehavior`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    overscroll_behavior(): string;
    overscroll_behavior(value: string): this;
    overscroll_behavior(value?: string): string | this {
        if (value == null) { return this.style.overscrollBehavior; }
        this.style.overscrollBehavior = value;
        return this;
    }

    /**
     * @docs:
     * @title: Overscroll behavior block
     * @desc: Specifies whether to have scroll chaining or overscroll affordance in the block direction.
     *        The equivalent of CSS attribute `overscrollBehaviorBlock`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    overscroll_behavior_block(): string;
    overscroll_behavior_block(value: string): this;
    overscroll_behavior_block(value?: string): string | this {
        if (value == null) { return this.style.overscrollBehaviorBlock; }
        this.style.overscrollBehaviorBlock = value;
        return this;
    }

    /**
     * @docs:
     * @title: Overscroll Behavior Inline
     * @desc: Specifies whether to have scroll chaining or overscroll affordance in the inline direction. 
     *        The equivalent of CSS attribute `overscrollBehaviorInline`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining. If `value` is `null`, returns the attribute's value.
     * @funcs: 2
     */
    overscroll_behavior_inline(): string;
    overscroll_behavior_inline(value: string): this;
    overscroll_behavior_inline(value?: string): string | this {
        if (value == null) { return this.style.overscrollBehaviorInline; }
        this.style.overscrollBehaviorInline = value;
        return this;
    }

    /**
     * @docs:
     * @title: Overscroll Behavior X
     * @description: 
     *     Specifies whether to have scroll chaining or overscroll affordance in x-direction.
     *     The equivalent of CSS attribute `overscrollBehaviorX`.
     *     
     *     Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    overscroll_behavior_x(): string;
    overscroll_behavior_x(value: string): this;
    overscroll_behavior_x(value?: string): string | this {
        if (value == null) { return this.style.overscrollBehaviorX; }
        this.style.overscrollBehaviorX = value;
        return this;
    }

    /**
     * @docs:
     * @title: Overscroll behavior y
     * @desc: 
     *     Specifies whether to have scroll chaining or overscroll affordance in y-directions.
     *     The equivalent of CSS attribute `overscrollBehaviorY`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the attribute value when parameter `value` is `null`. Otherwise, returns the `VElement` object for chaining.
     * @funcs: 2
     */
    overscroll_behavior_y(): string;
    overscroll_behavior_y(value: string): this;
    overscroll_behavior_y(value?: string): string | this {
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

    /**
     * @docs:
     * @title: Padding Block
     * @desc: Specifies the padding in the block direction. The equivalent of CSS attribute `paddingBlock`. 
     *         Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    padding_block(): string | undefined;
    padding_block(value: string | number): this;
    padding_block(value?: string | number): string | this | undefined {
        if (value == null) { return this.style.paddingBlock; }
        this.style.paddingBlock = this.pad_numeric(value);;
        return this;
    }

    /**
     * @docs:
     * @title: Padding Block End
     * @desc: Specifies the padding at the end in the block direction. The equivalent of CSS attribute `paddingBlockEnd`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    padding_block_end(): string;
    padding_block_end(value: string | number): this;
    padding_block_end(value?: string | number): string | this {
        if (value == null) { return this.style.paddingBlockEnd; }
        this.style.paddingBlockEnd = this.pad_numeric(value);;
        return this;
    }

    /**
     * @docs:
     * @title: Padding Block Start
     * @desc: Specifies the padding at the start in the block direction. 
     *        The equivalent of CSS attribute `paddingBlockStart`. 
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    padding_block_start(): string;
    padding_block_start(value: string | number): this;
    padding_block_start(value?: string | number): string | this {
        if (value == null) { return this.style.paddingBlockStart; }
        this.style.paddingBlockStart = this.pad_numeric(value);;
        return this;
    }

    /**
     * @docs:
     * @title: Padding Inline
     * @desc: Specifies the padding in the inline direction. The equivalent of CSS attribute `paddingInline`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    padding_inline(): string;
    padding_inline(value: string | number): this;
    padding_inline(value?: string | number): string | this {
        if (value == null) { return this.style.paddingInline ?? ""; }
        this.style.paddingInline = this.pad_numeric(value);;
        return this;
    }

    /**
     * @docs:
     * @title: Padding Inline End
     * @desc: Specifies the padding at the end in the inline direction. 
     *        The equivalent of CSS attribute `paddingInlineEnd`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    padding_inline_end(): string;
    padding_inline_end(value: string | number): this;
    padding_inline_end(value?: string | number): string | this {
        if (value == null) { return this.style.paddingInlineEnd; }
        this.style.paddingInlineEnd = this.pad_numeric(value);;
        return this;
    }

    /**
     * @docs:
     * @title: Padding Inline Start
     * @desc: Specifies the padding at the start in the inline direction. The equivalent of CSS attribute `paddingInlineStart`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining, or the attribute's value if `value` is `null`.
     * @funcs: 2
     */
    padding_inline_start(): string;
    padding_inline_start(value: string | number): this;
    padding_inline_start(value?: string | number): string | this {
        if (value == null) { return this.style.paddingInlineStart; }
        this.style.paddingInlineStart = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Page break after
     * @desc: Sets the page-break behavior after an element. The equivalent of CSS attribute `pageBreakAfter`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    page_break_after(): string;
    page_break_after(value: string): this;
    page_break_after(value?: string): string | this {
        if (value == null) { return this.style.pageBreakAfter; }
        this.style.pageBreakAfter = value;
        return this;
    }

    /**
     * @docs:
     * @title: Page break before
     * @desc: Sets the page-break behavior before an element. The equivalent of CSS attribute `pageBreakBefore`.
     * Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    page_break_before(): string;
    page_break_before(value: string): this;
    page_break_before(value?: string): string | this {
        if (value == null) { return this.style.pageBreakBefore; }
        this.style.pageBreakBefore = value;
        return this;
    }

    /**
     * @docs:
     * @title: Page Break Inside
     * @desc: Sets the page-break behavior inside an element. The equivalent of CSS attribute `pageBreakInside`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description The value to assign. Leave `null` to retrieve the attribute's value.
     *     @type string, null
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    page_break_inside(): string;
    page_break_inside(value: string): this;
    page_break_inside(value?: string): string | this {
        if (value == null) { return this.style.pageBreakInside; }
        this.style.pageBreakInside = value;
        return this;
    }

    /**
     * @docs:
     * @title: Paint Order
     * @desc: Sets the order of how an SVG element or text is painted. The equivalent of CSS attribute `paintOrder`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the attribute's value when `value` is `null`, otherwise returns the instance of the element for chaining.
     * @funcs: 2
     */
    paint_order(): string;
    paint_order(value: string): this;
    paint_order(value?: string): string | this {
        if (value == null) { return this.style.paintOrder; }
        this.style.paintOrder = value;
        return this;
    }

    /**
     * @docs:
     * @title: Perspective
     * @desc: Gives a 3D-positioned element some perspective. The equivalent of CSS attribute `perspective`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    perspective(): string;
    perspective(value: string | number): this;
    perspective(value?: string | number): string | this {
        if (value == null) { return this.style.perspective; }
        value = this.pad_numeric(value);
        this.style.perspective = value;
        (this.style as any).msPerspective = value;
        (this.style as any).webkitPerspective = value;
        (this.style as any).MozPerspective = value;
        (this.style as any).OPerspective = value;
        return this;
    }

    /**
     * @docs:
     * @title: Perspective origin
     * @desc: Defines at which position the user is looking at the 3D-positioned element. The equivalent of CSS attribute `perspectiveOrigin`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    perspective_origin(): string;
    perspective_origin(value: string): this;
    perspective_origin(value?: string): string | this {
        if (value == null) { return this.style.perspectiveOrigin; }
        this.style.perspectiveOrigin = value;
        (this.style as any).msPerspectiveOrigin = value;
        (this.style as any).webkitPerspectiveOrigin = value;
        (this.style as any).MozPerspectiveOrigin = value;
        (this.style as any).OPerspectiveOrigin = value;
        return this;
    }

    /**
     * @docs:
     * @title: Place Content
     * @desc: Specifies align-content and justify-content property values for flexbox and grid layouts.
     *        The equivalent of CSS attribute `placeContent`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    place_content(): string;
    place_content(value: string): this;
    place_content(value?: string): string | this {
        if (value == null) { return this.style.placeContent; }
        this.style.placeContent = value;
        return this;
    }

    /**
     * @docs:
     * @title: Place items
     * @desc: Specifies align-items and justify-items property values for grid layouts. The equivalent of CSS attribute `placeItems`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description The value to assign. Leave `null` to retrieve the attribute's value.
     *     @type string, null
     * @return:
     *     @description Returns the attribute's value when `value` is `null`, otherwise returns the instance of the element for chaining.
     * @funcs: 2
     */
    place_items(): string;
    place_items(value: string): this;
    place_items(value?: string): string | this {
        if (value == null) { return this.style.placeItems; }
        this.style.placeItems = value;
        return this;
    }

    /**
     * @docs:
     * @title: Place Self
     * @desc: Specifies align-self and justify-self property values for grid layouts. 
     *        The equivalent of CSS attribute `placeSelf`. 
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the attribute value when parameter `value` is `null`. 
     *                  Otherwise, returns the instance of the element for chaining.
     * @funcs: 2
     */
    place_self(): string;
    place_self(value: string): this;
    place_self(value?: string): string | this {
        if (value == null) { return this.style.placeSelf; }
        this.style.placeSelf = value;
        return this;
    }

    /**
     * @docs:
     * @title: Pointer events
     * @desc: Defines whether or not an element reacts to pointer events, equivalent to the CSS attribute `pointerEvents`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    pointer_events(): string;
    pointer_events(value: string): this;
    pointer_events(value?: string): string | this {
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

    /**
     * @docs:
     * @title: Quotes
     * @desc: Sets the type of quotation marks for embedded quotations. The equivalent of CSS attribute `quotes`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    quotes(): string;
    quotes(value: string): this;
    quotes(value?: string): string | this {
        if (value == null) { return this.style.quotes; }
        this.style.quotes = value;
        return this;
    }

    /**
     * @docs:
     * @title: Resize
     * @desc: Defines if (and how) an element is resizable by the user. 
     *        The equivalent of CSS attribute `resize`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the attribute's value if `value` is `null`, otherwise returns the instance of the element for chaining.
     * @funcs: 2
     */
    resize(): string;
    resize(value: string): this;
    resize(value?: string): string | this {
        if (value == null) { return this.style.resize; }
        this.style.resize = value;
        return this;
    }

    /**
     * @docs:
     * @title: Right
     * @desc: Specifies the right position of a positioned element. The equivalent of CSS attribute `right`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description The value to assign. Leave `null` to retrieve the attribute's value.
     *     @type number, string, null
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    right(): string;
    right(value: number | string): this;
    right(value?: number | string): string | this {
        if (value == null) { return this.style.right; }
        this.style.right = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Row Gap
     * @desc: Specifies the gap between the grid rows. The equivalent of CSS attribute `rowGap`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    row_gap(): string;
    row_gap(value: string | number): this;
    row_gap(value?: string | number): string | this {
        if (value == null) { return this.style.rowGap; }
        this.style.rowGap = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Scale
     * @desc: Specifies the size of an element by scaling up or down. The equivalent of CSS attribute `scale`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    scale(): null | number;
    scale(value: number): this;
    scale(value?: number): this | null | number {
        if (value == null) { return this._try_parse_float(this.style.scale, null); }
        this.style.scale = value.toString();
        return this;
    }

    /**
     * @docs:
     * @title: Scroll Behavior
     * @desc: Specifies whether to smoothly animate the scroll position in a scrollable box, instead of a straight jump. 
     *        The equivalent of CSS attribute `scrollBehavior`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    scroll_behavior(): string;
    scroll_behavior(value: string): this;
    scroll_behavior(value?: string): string | this {
        if (value == null) { return this.style.scrollBehavior; }
        this.style.scrollBehavior = value;
        return this;
    }

    /**
     * @docs:
     * @title: Scroll Margin
     * @desc: Specifies the margin between the snap position and the container. 
     *        The equivalent of CSS attribute `scrollMargin`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    scroll_margin(): string;
    scroll_margin(value: string | number): this;
    scroll_margin(value?: string | number): string | this {
        if (value == null) { return this.style.scrollMargin; }
        this.style.scrollMargin = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Scroll Margin Block
     * @desc: Specifies the margin between the snap position and the container in the block direction. 
     *        The equivalent of CSS attribute `scrollMarginBlock`. 
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the attribute value when parameter `value` is `null`, otherwise returns the instance of the element for chaining.
     * @funcs: 2
     */
    scroll_margin_block(): string;
    scroll_margin_block(value: string | number): this;
    scroll_margin_block(value?: string | number): string | this {
        if (value == null) { return this.style.scrollMarginBlock; }
        this.style.scrollMarginBlock = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Scroll margin block end
     * @desc: Specifies the end margin between the snap position and the container in the block direction.
     * The equivalent of CSS attribute `scrollMarginBlockEnd`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    scroll_margin_block_end(): string;
    scroll_margin_block_end(value: string | number): this;
    scroll_margin_block_end(value?: string | number): string | this {
        if (value == null) { return this.style.scrollMarginBlockEnd; }
        this.style.scrollMarginBlockEnd = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Scroll margin block start
     * @desc: Specifies the start margin between the snap position and the container in the block direction.
     *        The equivalent of CSS attribute `scrollMarginBlockStart`. 
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the attribute value when parameter `value` is `null`. Otherwise, returns the instance of the element for chaining.
     * @funcs: 2
     */
    scroll_margin_block_start(): string;
    scroll_margin_block_start(value: string | number): this;
    scroll_margin_block_start(value?: string | number): string | this {
        if (value == null) { return this.style.scrollMarginBlockStart; }
        this.style.scrollMarginBlockStart = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Scroll margin bottom
     * @desc: Specifies the margin between the snap position on the bottom side and the container.
     * The equivalent of CSS attribute `scrollMarginBottom`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    scroll_margin_bottom(): string;
    scroll_margin_bottom(value: string | number): this;
    scroll_margin_bottom(value?: string | number): string | this {
        if (value == null) { return this.style.scrollMarginBottom; }
        this.style.scrollMarginBottom = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Scroll Margin Inline
     * @desc: Specifies the margin between the snap position and the container in the inline direction.
     *        The equivalent of CSS attribute `scrollMarginInline`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    scroll_margin_inline(): string;
    scroll_margin_inline(value: string | number): this;
    scroll_margin_inline(value?: string | number): string | this {
        if (value == null) { return this.style.scrollMarginInline; }
        this.style.scrollMarginInline = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Scroll margin inline end
     * @desc: Specifies the end margin between the snap position and the container in the inline direction.
     *        The equivalent of CSS attribute `scrollMarginInlineEnd`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    scroll_margin_inline_end(): string;
    scroll_margin_inline_end(value: string | number): this;
    scroll_margin_inline_end(value?: string | number): this | string {
        if (value == null) { return this.style.scrollMarginInlineEnd; }
        this.style.scrollMarginInlineEnd = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Scroll margin inline start
     * @desc: Specifies the start margin between the snap position and the container in the inline direction. 
     *        The equivalent of CSS attribute `scrollMarginInlineStart`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    scroll_margin_inline_start(): string;
    scroll_margin_inline_start(value: string): this;
    scroll_margin_inline_start(value?: string): string | this {
        if (value == null) { return this.style.scrollMarginInlineStart; }
        this.style.scrollMarginInlineStart = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Scroll Margin Left
     * @desc: Specifies the margin between the snap position on the left side and the container. 
     *        The equivalent of CSS attribute `scrollMarginLeft`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    scroll_margin_left(): string;
    scroll_margin_left(value: string | number): this;
    scroll_margin_left(value?: string | number): string | this {
        if (value == null) { return this.style.scrollMarginLeft; }
        this.style.scrollMarginLeft = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Scroll Margin Right
     * @desc: Specifies the margin between the snap position on the right side and the container.
     *        The equivalent of CSS attribute `scrollMarginRight`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    scroll_margin_right(): string;
    scroll_margin_right(value: string | number): this 
    scroll_margin_right(value?: string | number): this | string {
        if (value == null) { return this.style.scrollMarginRight; }
        this.style.scrollMarginRight = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Scroll Margin Top
     * @desc: Specifies the margin between the snap position on the top side and the container.
     *        The equivalent of CSS attribute `scrollMarginTop`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @descr: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    scroll_margin_top(): string;
    scroll_margin_top(value: string | number): this;
    scroll_margin_top(value?: string | number): string | this {
        if (value == null) { return this.style.scrollMarginTop; }
        this.style.scrollMarginTop = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Scroll Padding
     * @desc: Specifies the distance from the container to the snap position on the child elements. 
     *        The equivalent of CSS attribute `scrollPadding`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, 
     *                  then the attribute's value is returned.
     * @funcs: 2
     */
    scroll_padding(): string;
    scroll_padding(value: string | number): this;
    scroll_padding(value?: string | number): this | string {
        if (value == null) { return this.style.scrollPadding; }
        this.style.scrollPadding = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Scroll padding block
     * @desc: Specifies the distance in block direction from the container to the snap position on the child elements. 
     *        The equivalent of CSS attribute `scrollPaddingBlock`. 
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     *     @type string, number, null
     * @return:
     *     @description Returns the attribute value when parameter `value` is `null`. Otherwise, returns the instance of the element for chaining.
     * @funcs: 2
     */
    scroll_padding_block(): string;
    scroll_padding_block(value: string | number): this;
    scroll_padding_block(value?: string | number): string | this {
        if (value == null) { return this.style.scrollPaddingBlock; }
        this.style.scrollPaddingBlock = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Scroll Padding Block End
     * @desc: Specifies the distance in block direction from the end of the container to the snap position on the child elements. 
     *        The equivalent of CSS attribute `scrollPaddingBlockEnd`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    scroll_padding_block_end(): string;
    scroll_padding_block_end(value: string | number): this;
    scroll_padding_block_end(value?: string | number): string | this {
        if (value == null) { return this.style.scrollPaddingBlockEnd; }
        this.style.scrollPaddingBlockEnd = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Scroll padding block start
     * @desc: Specifies the distance in block direction from the start of the container to the snap position on the child elements. The equivalent of CSS attribute `scrollPaddingBlockStart`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    scroll_padding_block_start(): string;
    scroll_padding_block_start(value: string | number): this;
    scroll_padding_block_start(value?: string | number): string | this {
        if (value == null) { return this.style.scrollPaddingBlockStart; }
        this.style.scrollPaddingBlockStart = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Scroll Padding Bottom
     * @desc: Specifies the distance from the bottom of the container to the snap position on the child elements.
     *        The equivalent of CSS attribute `scrollPaddingBottom`. 
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    scroll_padding_bottom(): string;
    scroll_padding_bottom(value: string | number): this;
    scroll_padding_bottom(value?: string | number): string | this {
        if (value == null) { return this.style.scrollPaddingBottom; }
        this.style.scrollPaddingBottom = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Scroll Padding Inline
     * @desc: Specifies the distance in inline direction from the container to the snap position on the child elements.
     *        The equivalent of CSS attribute `scrollPaddingInline`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the attribute's value if `value` is `null`, otherwise returns the instance of the element for chaining.
     * @funcs: 2
     */
    scroll_padding_inline(): string;
    scroll_padding_inline(value: string | number): this;
    scroll_padding_inline(value?: string | number): string | this {
        if (value == null) { return this.style.scrollPaddingInline; }
        this.style.scrollPaddingInline = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Scroll padding inline end
     * @desc: Specifies the distance in inline direction from the end of the container to the snap position on the child elements.
     *        The equivalent of CSS attribute `scrollPaddingInlineEnd`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    scroll_padding_inline_end(): string;
    scroll_padding_inline_end(value: string | number): this;
    scroll_padding_inline_end(value?: string | number): string | this {
        if (value == null) { return this.style.scrollPaddingInlineEnd; }
        this.style.scrollPaddingInlineEnd = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Scroll padding inline start
     * @desc: Specifies the distance in inline direction from the start of the container to the snap position on the child elements.
     *        The equivalent of CSS attribute `scrollPaddingInlineStart`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    scroll_padding_inline_start(): string;
    scroll_padding_inline_start(value: string | number): this;
    scroll_padding_inline_start(value?: string | number): this | string {
        if (value == null) { return this.style.scrollPaddingInlineStart ?? ""; }
        this.style.scrollPaddingInlineStart = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Scroll Padding Left
     * @desc: Specifies the distance from the left side of the container to the snap position on the child elements.
     * The equivalent of CSS attribute `scrollPaddingLeft`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    scroll_padding_left(): string;
    scroll_padding_left(value: string | number): this;
    scroll_padding_left(value?: string | number): string | this {
        if (value == null) { return this.style.scrollPaddingLeft; }
        this.style.scrollPaddingLeft = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Scroll Padding Right
     * @desc: Specifies the distance from the right side of the container to the snap position on the child elements.
     * The equivalent of CSS attribute `scrollPaddingRight`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    scroll_padding_right(): string;
    scroll_padding_right(value: string | number): this;
    scroll_padding_right(value?: string | number): string | this {
        if (value == null) { return this.style.scrollPaddingRight; }
        this.style.scrollPaddingRight = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Scroll Padding Top
     * @desc: Specifies the distance from the top of the container to the snap position on the child elements. 
     *        The equivalent of CSS attribute `scrollPaddingTop`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    scroll_padding_top(): string;
    scroll_padding_top(value: string | number): this;
    scroll_padding_top(value?: string | number): string | this {
        if (value == null) { return this.style.scrollPaddingTop; }
        this.style.scrollPaddingTop = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Scroll Snap Align
     * @desc: Specifies where to position elements when the user stops scrolling. 
     *        The equivalent of CSS attribute `scrollSnapAlign`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    scroll_snap_align(): string;
    scroll_snap_align(value: string): this;
    scroll_snap_align(value?: string): string | this {
        if (value == null) { return this.style.scrollSnapAlign; }
        this.style.scrollSnapAlign = value;
        return this;
    }

    /**
     * @docs:
     * @title: Scroll Snap Stop
     * @desc: Specifies scroll behaviour after fast swipe on trackpad or touch screen. 
     *        The equivalent of CSS attribute `scrollSnapStop`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    scroll_snap_stop(): string;
    scroll_snap_stop(value: string): this;
    scroll_snap_stop(value?: string): string | this {
        if (value == null) { return this.style.scrollSnapStop; }
        this.style.scrollSnapStop = value;
        return this;
    }

    /**
     * @docs:
     * @title: Scroll Snap Type
     * @desc: Specifies how snap behaviour should be when scrolling. The equivalent of CSS attribute `scrollSnapType`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    scroll_snap_type(): string;
    scroll_snap_type(value: string): this;
    scroll_snap_type(value?: string): string | this {
        if (value == null) { return this.style.scrollSnapType; }
        this.style.scrollSnapType = value;
        return this;
    }

    /**
     * @docs:
     * @title: Scrollbar color
     * @desc: Specifies the color of the scrollbar of an element. The equivalent of CSS attribute `scrollbarColor`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    scrollbar_color(): string;
    scrollbar_color(value: string): this;
    scrollbar_color(value?: string): string | this {
        if (value == null) { return this.style.scrollbarColor; }
        this.style.scrollbarColor = value;
        return this;
    }

    /**
     * @docs:
     * @title: Tab Size
     * @desc: Specifies the width of a tab character, equivalent to the CSS attribute `tabSize`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the instance of the element for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    tab_size(): string;
    tab_size(value: string | number): this;
    tab_size(value?: string | number): string | this {
        if (value == null) { return this.style.tabSize; }
        value = value.toString();
        this.style.tabSize = value;
        (this.style as any).msTabSize = value;
        (this.style as any).webkitTabSize = value;
        (this.style as any).MozTabSize = value;
        (this.style as any).OTabSize = value;
        return this;
    }

    /**
     * @docs:
     * @title: Table Layout
     * @desc: Defines the algorithm used to lay out table cells, rows, and columns. 
     *        The equivalent of CSS attribute `tableLayout`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    table_layout(): string;
    table_layout(value: string): this;
    table_layout(value?: string): string | this {
        if (value == null) { return this.style.tableLayout; }
        this.style.tableLayout = value;
        return this;
    }

    /**
     * @docs:
     * @title: Text Align
     * @desc: Specifies the horizontal alignment of text, equivalent to the CSS `textAlign` attribute. 
     *        Returns the attribute value when the parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign for text alignment. Leave `null` to retrieve the current attribute's value.
     * @return:
     *     @description Returns the current value of `textAlign` if no argument is provided; otherwise returns the instance for chaining.
     * @funcs: 2
     */
    text_align(): string;
    text_align(value: string): this;
    text_align(value?: string): string | this {
        if (value == null) { return this.style.textAlign; }
        this.style.textAlign = value;
        return this;
    }

    /**
     * @docs:
     * @title: Text Align Last
     * @desc: Describes how the last line of a block or a line right before a forced line break is aligned when text-align is "justify". 
     *        The equivalent of CSS attribute `textAlignLast`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    text_align_last(): string;
    text_align_last(value: string): this;
    text_align_last(value?: string): string | this {
        if (value == null) { return this.style.textAlignLast; }
        this.style.textAlignLast = value;
        return this;
    }

    /**
     * @docs:
     * @title: Text Combine Upright
     * @desc: Specifies the combination of multiple characters into the space of a single character.
     *        The equivalent of CSS attribute `textCombineUpright`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    text_combine_upright(): string;
    text_combine_upright(value: string): this;
    text_combine_upright(value?: string): string | this {
        if (value == null) { return this.style.textCombineUpright; }
        this.style.textCombineUpright = value;
        return this;
    }

    /**
     * @docs:
     * @title: Text Decoration
     * @desc: Specifies the decoration added to text. The equivalent of CSS attribute `textDecoration`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    text_decoration(): string;
    text_decoration(value: string): this;
    text_decoration(value?: string): string | this {
        if (value == null) { return this.style.textDecoration; }
        this.style.textDecoration = value;
        return this;
    }

    /**
     * @docs:
     * @title: Text Decoration Color
     * @desc: Specifies the color of the text-decoration. The equivalent of CSS attribute `textDecorationColor`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    text_decoration_color(): string;
    text_decoration_color(value: string): this;
    text_decoration_color(value?: string): this | string {
        if (value == null) { return this.style.textDecorationColor; }
        this.style.textDecorationColor = value;
        return this;
    }

    /**
     * @docs:
     * @title: Text Decoration Line
     * @desc: Specifies the type of line in a text-decoration. The equivalent of CSS attribute `textDecorationLine`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description The value to assign. Leave `null` to retrieve the attribute's value.
     *     @type string, null
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    text_decoration_line(): string;
    text_decoration_line(value: string): this;
    text_decoration_line(value?: string): string | this {
        if (value == null) { return this.style.textDecorationLine; }
        this.style.textDecorationLine = value;
        return this;
    }

    /**
     * @docs:
     * @title: Text Decoration Style
     * @desc: Specifies the style of the line in a text decoration, equivalent to the CSS attribute `textDecorationStyle`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    text_decoration_style(): string;
    text_decoration_style(value: string): this;
    text_decoration_style(value?: string): string | this {
        if (value == null) { return this.style.textDecorationStyle; }
        this.style.textDecorationStyle = value;
        return this;
    }

    /**
     * @docs:
     * @title: Text Decoration Thickness
     * @desc: Specifies the thickness of the decoration line. The equivalent of CSS attribute `textDecorationThickness`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    text_decoration_thickness(): string;
    text_decoration_thickness(value: string | number): this;
    text_decoration_thickness(value?: string | number): string | this {
        if (value == null) { return this.style.textDecorationThickness; }
        this.style.textDecorationThickness = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Text Emphasis
     * @desc: Applies emphasis marks to text, equivalent to the CSS attribute `textEmphasis`. 
     *        Returns the attribute value when the parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    text_emphasis(): string;
    text_emphasis(value: string): this;
    text_emphasis(value?: string): string | this {
        if (value == null) { return this.style.textEmphasis; }
        this.style.textEmphasis = value;
        return this;
    }

    /**
     * @docs:
     * @title: Text Indent
     * @desc: Specifies the indentation of the first line in a text-block, equivalent to the CSS `textIndent` property. 
     *        Retrieves the attribute value when the parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description The value to assign for the text indent. Pass `null` to retrieve the current value.
     * @return:
     *     @description Returns the instance of the element for chaining when a value is set. If `null` is passed, returns the current text indent value.
     * @funcs: 2
     */
    text_indent(): string;
    text_indent(value: string | number): this;
    text_indent(value?: string | number): string | this {
        if (value == null) { return this.style.textIndent; }
        this.style.textIndent = value.toString();
        return this;
    }

    /**
     * @docs:
     * @title: Text Justify
     * @desc: Specifies the justification method used when text-align is "justify". The equivalent of CSS attribute `textJustify`. 
     * Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    text_justify(): string;
    text_justify(value: string): this;
    text_justify(value?: string): string | this {
        if (value == null) { return (this.style as any).textJustify; }
        (this.style as any).textJustify = value;
        return this;
    }

    /**
     * @docs:
     * @title: Text Orientation
     * @desc: Defines the orientation of characters in a line, equivalent to the CSS attribute `textOrientation`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    text_orientation(): string;
    text_orientation(value: string): this;
    text_orientation(value?: string): string | this {
        if (value == null) { return this.style.textOrientation; }
        this.style.textOrientation = value;
        return this;
    }

    /**
     * @docs:
     * @title: Text Overflow
     * @desc: Specifies what should happen when text overflows the containing element. The equivalent of CSS attribute `textOverflow`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    text_overflow(): string;
    text_overflow(value: string): this;
    text_overflow(value?: string): string | this {
        if (value == null) { return this.style.textOverflow; }
        this.style.textOverflow = value;
        return this;
    }

    /**
     * @docs:
     * @title: Text Shadow
     * @desc: Adds shadow to text. The equivalent of CSS attribute `textShadow`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    text_shadow(): string;
    text_shadow(value: string): this;
    text_shadow(value?: string): string | this {
        if (value == null) { return this.style.textShadow; }
        this.style.textShadow = value;
        return this;
    }

    /**
     * @docs:
     * @title: Text Transform
     * @desc: Controls the capitalization of text. The equivalent of CSS attribute `textTransform`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    text_transform(): string;
    text_transform(value: string): this;
    text_transform(value?: string): string | this {
        if (value == null) { return this.style.textTransform; }
        this.style.textTransform = value;
        return this;
    }

    /**
     * @docs:
     * @title: Text Underline Position
     * @desc: Specifies the position of the underline which is set using the text-decoration property. 
     *        The equivalent of CSS attribute `textUnderlinePosition`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    text_underline_position(): string;
    text_underline_position(value: string): this;
    text_underline_position(value?: string): string | this {
        if (value == null) { return this.style.textUnderlinePosition; }
        this.style.textUnderlinePosition = value;
        return this;
    }

    /**
     * @docs:
     * @title: Top
     * @desc: Specifies the top position of a positioned element. The equivalent of CSS attribute `top`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    top(): string;
    top(value: string | number): this;
    top(value?: string | number): string | this {
        if (value == null) { return this.style.top; }
        this.style.top = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Transform
     * @desc: Applies a 2D or 3D transformation to an element. The equivalent of CSS attribute `transform`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    transform(): string;
    transform(value: string): this;
    transform(value?: string): string | this {
        if (value == null) { return this.style.transform; }
        this.style.transform = value;
        (this.style as any).msTransform = value;
        (this.style as any).webkitTransform = value;
        (this.style as any).MozTransform = value;
        (this.style as any).OTransform = value;
        return this;
    }

    /**
     * @docs:
     * @title: Transform Origin
     * @desc: Allows you to change the position on transformed elements. The equivalent of CSS attribute `transformOrigin`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    transform_origin(): string;
    transform_origin(value: string): this;
    transform_origin(value?: string): string | this {
        if (value == null) { return this.style.transformOrigin; }
        this.style.transformOrigin = value;
        (this.style as any).msTransformOrigin = value;
        (this.style as any).webkitTransformOrigin = value;
        (this.style as any).MozTransformOrigin = value;
        (this.style as any).OTransformOrigin = value;
        return this;
    }

    /**
     * @docs:
     * @title: Transform Style
     * @desc: Specifies how nested elements are rendered in 3D space. 
     *        The equivalent of CSS attribute `transformStyle`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    transform_style(): string;
    transform_style(value: string): this;
    transform_style(value?: string): string | this {
        if (value == null) { return this.style.transformStyle; }
        this.style.transformStyle = value;
        (this.style as any).msTransformStyle = value;
        (this.style as any).webkitTransformStyle = value;
        (this.style as any).MozTransformStyle = value;
        (this.style as any).OTransformStyle = value;
        return this;
    }

    /**
     * @docs:
     * @title: Transition
     * @desc: A shorthand property for all the transition properties. The equivalent of CSS attribute `transition`. 
     * Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    transition(): string;
    transition(value: string): this;
    transition(value?: string): string | this {
        if (value == null) { return this.style.transition; }
        this.style.transition = value;
        (this.style as any).msTransition = value;
        (this.style as any).webkitTransition = value;
        (this.style as any).MozTransition = value;
        (this.style as any).OTransition = value;
        return this;
    }

    /**
     * @docs:
     * @title: Transition Delay
     * @desc: Specifies when the transition effect will start. This corresponds to the CSS attribute `transitionDelay`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the attribute value when parameter `value` is `null`. Otherwise, returns the instance of the element for chaining.
     * @funcs: 2
     */
    transition_delay(): string;
    transition_delay(value: string | number): this;
    transition_delay(value?: string | number): string | this {
        if (value == null) { return this.style.transitionDelay; }
        value = value.toString();
        this.style.transitionDelay = value;
        (this.style as any).msTransitionDelay = value;
        (this.style as any).webkitTransitionDelay = value;
        (this.style as any).MozTransitionDelay = value;
        (this.style as any).OTransitionDelay = value;
        return this;
    }

    /**
     * @docs:
     * @title: Transition Duration
     * @desc: Specifies how many seconds or milliseconds a transition effect takes to complete. 
     *        The equivalent of CSS attribute `transitionDuration`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    transition_duration(): string | undefined;
    transition_duration(value: string | number): this;
    transition_duration(value?: string | number): string | this | undefined {
        if (value == null) { return this.style.transitionDuration; }
        value = value.toString();
        this.style.transitionDuration = value;
        (this.style as any).msTransitionDuration = value;
        (this.style as any).webkitTransitionDuration = value;
        (this.style as any).MozTransitionDuration = value;
        (this.style as any).OTransitionDuration = value;
        return this;
    }

    /**
     * @docs:
     * @title: Transition Property
     * @desc: Specifies the name of the CSS property the transition effect is for. 
     *        The equivalent of CSS attribute `transitionProperty`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    transition_property(): string;
    transition_property(value: string): this;
    transition_property(value?: string): string | this {
        if (value == null) { return this.style.transitionProperty; }
        this.style.transitionProperty = value;
        (this.style as any).msTransitionProperty = value;
        (this.style as any).webkitTransitionProperty = value;
        (this.style as any).MozTransitionProperty = value;
        (this.style as any).OTransitionProperty = value;
        return this;
    }

    /**
     * @docs:
     * @title: Transition Timing Function
     * @desc: Specifies the speed curve of the transition effect. 
     *        The equivalent of CSS attribute `transitionTimingFunction`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the instance of the element for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    transition_timing_function(): string;
    transition_timing_function(value: string): this;
    transition_timing_function(value?: string): string | this {
        if (value == null) { return this.style.transitionTimingFunction; }
        this.style.transitionTimingFunction = value;
        (this.style as any).msTransitionTimingFunction = value;
        (this.style as any).webkitTransitionTimingFunction = value;
        (this.style as any).MozTransitionTimingFunction = value;
        (this.style as any).OTransitionTimingFunction = value;
        return this;
    }

    /**
     * @docs:
     * @title: Translate
     * @desc: Specifies the position of an element. The equivalent of CSS attribute `translate`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the attribute's value if `value` is `null`, otherwise returns the instance of the element for chaining.
     * @funcs: 2
     */
    // @ts-ignore
    translate(): string;
    // @ts-ignore
    translate(value: string | number): this;
    // @ts-ignore
    translate(value?: string | number): string | this {
        if (value == null) { return this.style.translate; }
        this.style.translate = value.toString();
        return this;
    }

    /**
     * @docs:
     * @title: Unicode Bidi
     * @desc: 
     *     Used together with the direction property to set or return whether the text should be overridden to support multiple languages in the same document.
     *     The equivalent of CSS attribute `unicodeBidi`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    unicode_bidi(): string;
    unicode_bidi(value: string): this;
    unicode_bidi(value?: string): string | this {
        if (value == null) { return this.style.unicodeBidi ?? ""; }
        this.style.unicodeBidi = value;
        return this;
    }

    /**
     * @docs:
     * @title: User Select
     * @description: 
     *     Specifies whether the text of an element can be selected.
     *     The equivalent of CSS attribute `userSelect`.
     *     Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    user_select(): string;
    user_select(value: string): this;
    user_select(value?: string): string | this {
        if (value == null) { return this.style.userSelect; }
        this.style.userSelect = value;
        (this.style as any).msUserSelect = value;
        (this.style as any).webkitUserSelect = value;
        (this.style as any).MozUserSelect = value;
        (this.style as any).OUserSelect = value;
        return this;
    }

    // Sets the vertical alignment of an element.
    // vertical_align(value) {
    //     if (value == null) { return this.style.verticalAlign; }
    //     this.style.verticalAlign = value;
    //     return this;
    // }

    /**
     * @docs:
     * @title: Visibility
     * @desc: Specifies whether or not an element is visible. The equivalent of CSS attribute `visibility`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    visibility(): string;
    visibility(value: string): this;
    visibility(value?: string): string | this {
        if (value == null) { return this.style.visibility; }
        this.style.visibility = value;
        return this;
    }

    /**
     * @docs:
     * @title: White space
     * @desc: Specifies how white-space inside an element is handled. The equivalent of CSS attribute `whiteSpace`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    white_space(): string;
    white_space(value: string): this;
    white_space(value?: string): string | this {
        if (value == null) { return this.style.whiteSpace; }
        this.style.whiteSpace = value;
        return this;
    }

    /**
     * @docs:
     * @title: Widows
     * @desc: Sets the minimum number of lines that must be left at the top of a page or column. 
     *        The equivalent of CSS attribute `widows`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    widows(): string;
    widows(value: string | number): this;
    widows(value?: string | number): string | this {
        if (value == null) { return this.style.widows; }
        this.style.widows = value.toString();
        return this;
    }

    // Sets the width of an element.
    // width(value) {
    //     if (value == null) { return this.style.width; }
    //     this.style.width = this.pad_numeric(value);
    //     return this;
    // }

    /**
     * @docs:
     * @title: Word break
     * @desc: Specifies how words should break when reaching the end of a line. 
     *        The equivalent of CSS attribute `wordBreak`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    word_break(): string;
    word_break(value: string): this;
    word_break(value?: string): string | this {
        if (value == null) { return this.style.wordBreak; }
        this.style.wordBreak = value;
        return this;
    }

    /**
     * @docs:
     * @title: Word spacing
     * @desc: Increases or decreases the space between words in a text. The equivalent of CSS attribute `wordSpacing`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    word_spacing(): string;
    word_spacing(value: string | number): this;
    word_spacing(value?: string | number): string | this {
        if (value == null) { return this.style.wordSpacing; }
        this.style.wordSpacing = this.pad_numeric(value);
        return this;
    }

    /**
     * @docs:
     * @title: Word wrap
     * @desc: Allows long, unbreakable words to be broken and wrap to the next line. The equivalent of CSS attribute `wordWrap`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    word_wrap(): string;
    word_wrap(value: string): this;
    word_wrap(value?: string): string | this {
        if (value == null) { return this.style.wordWrap; }
        this.style.wordWrap = value;
        return this;
    }

    /**
     * @docs:
     * @title: Writing mode
     * @desc: Specifies whether lines of text are laid out horizontally or vertically. The equivalent of CSS attribute `writingMode`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    writing_mode(): string;
    writing_mode(value: string): this;
    writing_mode(value?: string): string | this {
        if (value == null) { return this.style.writingMode; }
        this.style.writingMode = value;
        return this;
    }

    // ---------------------------------------------------------
    // Attribute functions
    // Reference: https://www.w3schools.com/tags/ref_attributes.asp. 

    /**
     * @docs:
     * @title: Focusable
     * @desc: Sets or gets the focusable state of the element based on the `tabindex` attribute.
     * @param:
     *     @name: value
     *     @descr: Boolean value to set focusable state or null to get current state.
     * @return:
     *     @description When an argument is passed, this function returns the instance of the element for chaining. Otherwise, it returns the current focusable state.
     * @funcs: 2
     */
    focusable(): boolean;
    focusable(value: boolean): this;
    focusable(value?: boolean | null): boolean | this {
        if (value == null) {
            return super.tabIndex !== -1;
        } else {
            super.tabIndex = -1;
            this.style.outline = "none";
        }
        return this;
    }

    /**
     * @docs:
     * @title: Alt
     * @desc: Specifies an alternate text when the original element fails to display. The equivalent of HTML attribute `alt`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    alt(): string;
    alt(value: string): this;
    alt(value?: string): string | this {
        // if (value == null) { return this.getAttribute("alt") ?? ""; }
        if (value == null) { return this.getAttribute("alt") ?? ""; }
        this.setAttribute("alt", value)
        // this.setAttribute("alt", value);
        return this;
    }

    /**
     * @docs:
     * @title: Readonly
     * @desc: Specifies that the element is read-only, equivalent to the HTML attribute `readonly`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    readonly(): boolean;
    readonly(value: boolean): this;
    readonly(value?: boolean): boolean | this {
        if (value == null) { return this._try_parse_boolean(this.getAttribute("readonly")); }
        if (!value) {
            this.removeAttribute("readonly");
        } else {
            this.setAttribute("readonly", value)
        }

        // Had some bugs with code below.
        // if (value == null) { return this._try_parse_boolean((this as any as HTMLInputElement).readOnly); }
        // (this as any as HTMLInputElement).readOnly = value;
        
        return this;
    }

    /**
     * @docs:
     * @title: Download
     * @desc: Specifies that the target will be downloaded when a user clicks on the hyperlink. The equivalent of HTML attribute `download`.
     * @param:
     *     @name: value
     *     @description The value to assign. Leave `null` to retrieve the attribute's value.
     *     @type string, null
     * @return:
     *     @description Returns the attribute value when parameter `value` is `null`. Otherwise, returns the instance of the element for chaining.
     * @funcs: 2
     */
    download(): string;
    download(value: string): this;
    download(value?: string): string | this {
        if (value == null) { return this.getAttribute("download") ?? ""; }
        this.setAttribute("download", value);
        return this;
    }

    /**
     * @docs:
     * @title: Accept
     * @desc: Specifies the types of files that the server accepts (only for type="file"). The equivalent of HTML attribute `accept`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    accept(): string;
    accept(value: string): this;
    accept(value?: string): string | this {
        if (value == null) { return this.getAttribute("accept") ?? ""; }
        this.setAttribute("accept", value);
        return this;
    }

    /**
     * @docs:
     * @title: Accept Charset
     * @desc: Specifies the character encodings that are to be used for the form submission. 
     *        The equivalent of HTML attribute `accept_charset`. 
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     *     @type string, null
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    accept_charset(): string;
    accept_charset(value: string): this;
    accept_charset(value?: string): string | this {
        if (value == null) { return super.acceptCharset ?? ""; }
        super.acceptCharset = value;
        return this;
    }

    /**
     * @docs:
     * @title: Action
     * @desc: Specifies where to send the form-data when a form is submitted. 
     *        The equivalent of HTML attribute `action`. 
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the attribute value when parameter `value` is `null`. Otherwise, returns the instance of the element for chaining.
     * @funcs: 2
     */
    action(): string;
    action(value: string): this;
    action(value?: string): string | this {
        if (value == null) { return this.getAttribute("action") ?? ""; }
        this.setAttribute("action", value);
        return this;
    }

    /**
     * @docs:
     * @title: Async
     * @desc: Specifies that the script is executed asynchronously (only for external scripts). 
     *        The equivalent of HTML attribute `async`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    async(): boolean;
    async(value: boolean): this;
    async(value?: boolean): boolean | this {
        if (value == null) { return this._try_parse_boolean(this.getAttribute("async")); }
        this.setAttribute("async", value);
        return this;
    }

    /**
     * @docs:
     * @title: Auto complete
     * @desc: Specifies whether the \<form> or the \<input> element should have autocomplete enabled. 
     *        The equivalent of HTML attribute `autocomplete`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    auto_complete(): "" | "on" | "off";
    auto_complete(value: "" | "on" | "off"): this;
    auto_complete(value?: "" | "on" | "off"): "" | "on" | "off" | this {
        if (value == null) { return super.autocomplete ?? ""; }
        super.autocomplete = value;
        return this;
    }

    /**
     * @docs:
     * @title: Auto Focus
     * @desc: Specifies that the element should automatically get focus when the page loads. 
     *        The equivalent of HTML attribute `autofocus`. 
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    auto_focus(): boolean;
    auto_focus(value: boolean): this;
    auto_focus(value?: boolean): boolean | this {
        if (value == null) { return super.autofocus ?? false; }
        super.autofocus = value;
        return this;
    }

    /**
     * @docs:
     * @title: Auto Play
     * @desc: Specifies that the audio/video will start playing as soon as it is ready. 
     *        The equivalent of HTML attribute `autoplay`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    auto_play(): boolean;
    auto_play(value: boolean): this;
    auto_play(value?: boolean): this | boolean {
        if (value == null) { return this._try_parse_boolean(super.autoplay); }
        super.autoplay = value;
        return this;
    }

    /**
     * @docs:
     * @title: Charset
     * @desc: Specifies the character encoding, equivalent to the HTML attribute `charset`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    charset(): string;
    charset(value: string): this;
    charset(value?: string): this | string {
        if (value == null) { return this.getAttribute("charset") ?? ""; }
        this.setAttribute("charset", value);
        return this;
    }

    /**
     * @docs:
     * @title: Checked
     * @desc: Specifies that an \<input> element should be pre-selected when the page loads (for type="checkbox" or type="radio"). The equivalent of HTML attribute `checked`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    checked(): boolean;
    checked(value: boolean): this;
    checked(value?: boolean): this | boolean {
        if (value == null) { return this._try_parse_boolean(this._checked.get.call(this)); }
        this._checked.set.call(this, value)
        // if (value == null) { return this._try_parse_boolean(this.getAttribute("checked")); }
        // this.setAttribute("checked", value);
        return this;
    }

    /**
     * @docs:
     * @title: Cite
     * @desc: Specifies a URL which explains the quote/deleted/inserted text. The equivalent of HTML attribute `cite`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    cite(): string;
    cite(value: string): this;
    cite(value?: string): string | this {
        if (value == null) { return this.getAttribute("cite") ?? ""; }
        this.setAttribute("cite", value);
        return this;
    }

    // Specifies one or more classnames for an element (refers to a class in a style sheet).
    // class(value) {
    //     if (value == null) { return super.class; }
    //  super.class = value;
    //  return this;
    // }

    /**
     * @docs:
     * @title: Cols
     * @desc: Specifies the visible width of a text area, equivalent to the HTML attribute `cols`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining, unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    cols(): null | number;
    cols(value: number): this;
    cols(value?: number): this | null | number {
        if (value == null) { return this._try_parse_float(super.getAttribute("cols"), null); }
        this.setAttribute("cols", value);
        return this;
    }

    /**
     * @docs:
     * @title: Colspan
     * @desc: Specifies the number of columns a table cell should span. The equivalent of HTML attribute `colspan`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    colspan(): null | number;
    colspan(value: number): this;
    colspan(value?: number): this | null | number {
        if (value == null) { return this._try_parse_float(this.getAttribute("cols"), null); }
        this.setAttribute("colspan", value);
        return this;
    }

    // @duplicate
    /**
     * docs:
     * @title: Content
     * @desc: Retrieves or sets the value associated with the http-equiv or name attribute. 
     *        When `value` is `null`, the current attribute value is returned. 
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the current attribute value if `value` is `null`, otherwise returns the instance for chaining.
     * @funcs: 2
     */
    // content(): string;
    // content(value: string | number): this;
    // content(value?: string | number): string | this {
    //     if (value == null) { return super.content ?? ""; }
    //     super.content = value.toString();
    //     return this;
    // }

    /**
     * @docs:
     * @title: Content editable
     * @desc: Specifies whether the content of an element is editable or not. 
     *        The equivalent of HTML attribute `contenteditable`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    content_editable(): boolean;
    content_editable(value: boolean): this;
    content_editable(value?: boolean): boolean | this {
        if (value == null) { return this._try_parse_boolean(super.contentEditable); }
        super.contentEditable = value ? "true" : "false";
        return this;
    }

    /**
     * @docs:
     * @title: Controls
     * @desc: Specifies that audio/video controls should be displayed (such as a play/pause button etc). The equivalent of HTML attribute `controls`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    controls(): boolean;
    controls(value: boolean): this;
    controls(value?: boolean): this | boolean {
        if (value == null) { return this._try_parse_boolean(super.getAttribute("controls")); }
        this.setAttribute("controls", value);
        return this;
    }

    /**
     * @docs:
     * @title: Coords
     * @desc: Specifies the coordinates of the area, equivalent to the HTML attribute `coords`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining, or the attribute's value if `value` is `null`.
     * @funcs: 2
     */
    coords(): string;
    coords(value: string): this;
    coords(value?: string): string | this {
        if (value == null) { return this.getAttribute("coords") ?? ""; }
        this.setAttribute("coords", value);
        return this;
    }

    /**
     * @docs:
     * @title: Data
     * @desc: Specifies the URL of the resource to be used by the object. 
     *        The equivalent of HTML attribute `data`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    data(): string;
    data(value: string | number): this;
    data(value?: string | number): this | string {
        if (value == null) { return this.getAttribute("data") ?? ""; }
        this.setAttribute("data", value);
        return this;
    }

    /**
     * @docs:
     * @title: Datetime
     * @desc: Specifies the date and time. The equivalent of HTML attribute `datetime`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    datetime(): string;
    datetime(value: string): this;
    datetime(value?: string): string | this {
        if (value == null) { return super.dateTime ?? ""; }
        super.dateTime = value;
        return this;
    }

    /**
     * @docs:
     * @title: Default
     * @desc: Specifies that the track is to be enabled if the user's preferences do not indicate that another track would be more appropriate. The equivalent of HTML attribute `default`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    default(): boolean;
    default(value: boolean): this;
    default(value?: boolean): boolean | this {
        if (value == null) { return this._try_parse_boolean(this.getAttribute("default")); }
        this.setAttribute("default", value);
        return this;
    }

    /**
     * @docs:
     * @title: Defer
     * @desc: Specifies that the script is executed when the page has finished parsing (only for external scripts). 
     *        The equivalent of HTML attribute `defer`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    defer(): boolean;
    defer(value: boolean): this;
    defer(value?: boolean): this | boolean {
        if (value == null) { return this._try_parse_boolean(this.getAttribute("defer")); }
        this.setAttribute("defer", value);
        return this;
    }

    /**
     * @docs:
     * @title: Dir
     * @desc: Specifies the text direction for the content in an element. The equivalent of HTML attribute `dir`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    // @ts-ignore
    dir(): string;
    // @ts-ignore
    dir(value: string): this;
    // @ts-ignore
    dir(value?: string): string | this {
        if (value == null) { return this.getAttribute("dir") ?? ""; }
        this.setAttribute("dir", value);
        return this;
    }

    /**
     * @docs:
     * @title: Dirname
     * @desc: Specifies that the text direction will be submitted. The equivalent of HTML attribute `dirname`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    dirname(): string;
    dirname(value: string): this;
    dirname(value?: string): string | this {
        if (value == null) { return this.getAttribute("dirname") ?? ""; }
        this.setAttribute("dirname", value);
        return this;
    }

    /**
     * @docs:
     * @title: Disabled
     * @desc: Specifies that the specified element/group of elements should be disabled. 
     *        The equivalent of HTML attribute `disabled`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    disabled(): boolean;
    disabled(value: boolean): this;
    disabled(value?: boolean): boolean | this {
        if (value == null) { return this._try_parse_boolean(this._disabled.get.call(this)); }
        this._disabled.set.call(this, value)
        // if (value == null) { return this._try_parse_boolean(this.getAttribute("disabled")); }
        // this.setAttribute("disabled", value);
        return this;
    }

    /**
     * @docs:
     * @title: Draggable
     * @desc: Specifies whether an element is draggable or not. The equivalent of HTML attribute `draggable`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    // @ts-ignore
    draggable(): boolean;
    // @ts-ignore
    draggable(value: boolean): this;
    // @ts-ignore
    draggable(value?: boolean): boolean | this {
        if (value == null) { return this._try_parse_boolean(this.getAttribute("draggable")); }
        this.setAttribute("draggable", value);
        return this;
    }

    /**
     * @docs:
     * @title: Enctype
     * @desc: Specifies how the form-data should be encoded when submitting it to the server (only for method="post"). 
     *        The equivalent of HTML attribute `enctype`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    enctype(): string;
    enctype(value: string): this;
    enctype(value?: string): string | this {
        if (value == null) { return this.getAttribute("enctype") ?? ""; }
        this.setAttribute("enctype", value);
        return this;
    }

    /**
     * @docs:
     * @title: For
     * @desc: Specifies which form element(s) a label/calculation is bound to. 
     *        The equivalent of HTML attribute `for`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    for(): string;
    for(value: string): this;
    for(value?: string): string | this {
        if (value == null) { return this.getAttribute("for") ?? ""; }
        this.setAttribute("for", value);
        return this;
    }

    /**
     * @docs:
     * @title: Form
     * @desc: Specifies the name of the form the element belongs to. The equivalent of HTML attribute `form`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object when a value is set. If `null`, returns the attribute's value.
     * @funcs: 2
     */
    // @ts-ignore
    // form(): undefined | HTMLFormElement;
    // // @ts-ignore
    // form(value: HTMLFormElement): this;
    // // @ts-ignore
    // form(value?: HTMLFormElement): this | undefinde | HTMLFormElement {
    //     if (value == null) { return super.form; }
    //     super.form = value;
    //     return this;
    // }

    /**
     * @docs:
     * @title: Form Action
     * @desc: Specifies where to send the form-data when a form is submitted. Only for type="submit". 
     *        The equivalent of HTML attribute `formaction`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    form_action(): string;
    form_action(value: string): this;
    form_action(value?: string): string | this {
        if (value == null) { return super.formAction ?? ""; }
        super.formAction = value;
        return this;
    }

    /**
     * @docs:
     * @title: Headers
     * @desc: Specifies one or more headers cells a cell is related to. 
     *        The equivalent of HTML attribute `headers`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    headers(): string;
    headers(value: string): this;
    headers(value?: string): this | string {
        if (value == null) { return this.getAttribute("headers") ?? ""; }
        this.setAttribute("headers", value);
        return this;
    }

    // Specifies the height of the element.
    // height(value) {
    //     if (value == null) { return super.height; }
    //  super.height = this.pad_numeric(value);
    //  return this;
    // }

    // Specifies that an element is not yet, or is no longer, relevant.
    // hidden(value) {
    //     if (value == null) { return super.hidden; }
    //  super.hidden = value;
    //  return this;
    // }

    /**
     * @docs:
     * @title: High
     * @desc: Specifies the range that is considered to be a high value. The equivalent of HTML attribute `high`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    high(): string;
    high(value: string | number): this;
    high(value?: string | number): string | this {
        if (value == null) { return this.getAttribute("high") ?? ""; }
        this.setAttribute("high", value);
        return this;
    }

    /**
     * @docs:
     * @title: Href
     * @desc: Specifies the URL of the page the link goes to. The equivalent of HTML attribute `href`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    href(): string;
    href(value: string): this;
    href(value?: string): string | this {
        if (value == null) { return this._href.get.call(this) ?? ""; }
        this._href.set.call(this, value);
        // if (value == null) { return this.getAttribute("href") ?? ""; }
        // this.setAttribute("href", value);
        return this;
    }

    /**
     * @docs:
     * @title: Href lang
     * @desc: Specifies the language of the linked document. The equivalent of HTML attribute `hreflang`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    href_lang(): string;
    href_lang(value: string): this;
    href_lang(value?: string): string | this {
        if (value == null) { return super.hreflang ?? ""; }
        super.hreflang = value;
        return this;
    }

    /**
     * @docs:
     * @title: Http Equiv
     * @desc: Provides an HTTP header for the information/value of the content attribute. 
     *        The equivalent of HTML attribute `http_equiv`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining, unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    http_equiv(): string;
    http_equiv(value: string): this;
    http_equiv(value?: string): this | string {
        if (value == null) { return super.httpEquiv ?? ""; }
        super.httpEquiv = value;
        return this;
    }

    /**
     * @docs:
     * @title: Id
     * @desc: Specifies a unique id for an element, equivalent to the HTML attribute `id`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    // @ts-ignore
    id(): string;
    // @ts-ignore
    id(value: string): this;
    // @ts-ignore
    id(value?: string): string | this {
        if (value == null) { return this._id.get.call(this) ?? ""; }
        this._id.set.call(this, value);
        // if (value == null) { return this.getAttribute("id") ?? ""; }
        // this.setAttribute("id", value);
        return this;
    }

    /**
     * @docs:
     * @title: Is Map
     * @desc: Specifies an image as a server-side image map. The equivalent of HTML attribute `ismap`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description The value to assign. Leave `null` to retrieve the attribute's value.
     *     @type boolean, null
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    is_map(): boolean;
    is_map(value: boolean): this;
    is_map(value?: boolean): boolean | this {
        if (value == null) { return this._try_parse_boolean(super.isMap); }
        super.isMap = value;
        return this;
    }

    /**
     * @docs:
     * @title: Kind
     * @desc: Specifies the kind of text track. The equivalent of HTML attribute `kind`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    kind(): string;
    kind(value: string): this;
    kind(value?: string): string | this {
        if (value == null) { return this.getAttribute("kind") ?? ""; }
        this.setAttribute("kind", value);
        return this;
    }

    /**
     * @docs:
     * @title: Label
     * @desc: Specifies the title of the text track, equivalent to the HTML attribute `label`. 
     *        Returns the attribute value when the parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    label(): string;
    label(value: string): this;
    label(value?: string): string | this {
        if (value == null) { return this.getAttribute("label") ?? ""; }
        this.setAttribute("label", value);
        return this;
    }

    /**
     * @docs:
     * @title: Lang
     * @desc: Specifies the language of the element's content, equivalent to the HTML attribute `lang`. 
     *        Returns the attribute value when the parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    // @ts-ignore
    lang(): string;
    // @ts-ignore
    lang(value: string): this;
    // @ts-ignore
    lang(value?: string): string | this {
        if (value == null) { return this.getAttribute("lang") ?? ""; }
        this.setAttribute("lang", value);
        return this;
    }

    /**
     * @docs:
     * @title: List
     * @desc: Refers to a \<datalist> element that contains pre-defined options for an \<input> element. 
     *        The equivalent of HTML attribute `list`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    // // @ts-ignore
    // list(): string;
    // // @ts-ignore
    // list(value: string): this;
    // // @ts-ignore
    // list(value?: string): string | this {
    //     if (value == null) { return super.list ?? ""; }
    //     super.list = value;
    //     return this;
    // }

    /**
     * @docs:
     * @title: Loop
     * @desc: Specifies that the audio/video will start over again, every time it is finished. 
     *        The equivalent of HTML attribute `loop`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    loop(): boolean;
    loop(value: boolean): this;
    loop(value?: boolean): this | boolean {
        if (value == null) { return this._try_parse_boolean(this.getAttribute("loop")); }
        this.setAttribute("loop", value);
        return this;
    }

    /**
     * @docs:
     * @title: Low
     * @desc: Specifies the range that is considered to be a low value. The equivalent of HTML attribute `low`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @descr: Returns the `VElement` object for chaining. If `value` is `null`, the attribute's value is returned.
     * @funcs: 2
     */
    low(): string;
    low(value: string | number): this;
    low(value?: string | number): string | this {
        if (value == null) { return this.getAttribute("low") ?? ""; }
        this.setAttribute("low", value);
        return this;
    }

    /**
     * @docs:
     * @title: Max
     * @desc: Specifies the maximum value, equivalent to the HTML attribute `max`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, in which case the attribute's value is returned.
     * @funcs: 2
     */
    max(): string;
    max(value: string): this;
    max(value?: string): string | this {
        if (value == null) { return this.getAttribute("max") ?? ""; }
        this.setAttribute("max", value);
        return this;
    }

    /**
     * @docs:
     * @title: Max Length
     * @desc: Specifies the maximum number of characters allowed in an element. The equivalent of HTML attribute `maxlength`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    max_length(): null | number;
    max_length(value: number): this;
    max_length(value?: number): this | null | number {
        if (value == null) { return this._try_parse_float(super.maxlength, null); }
        super.maxlength = value;
        return this;
    }

    // Specifies what media/device the linked document is optimized for.
    // media(value) {
    //     if (value == null) { return super.media; }
    //  super.media = value;
    //  return this;
    // }

    /**
     * @docs:
     * @title: Method
     * @desc: Specifies the HTTP method to use when sending form-data. The equivalent of HTML attribute `method`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    method(): string;
    method(value: string): this;
    method(value?: string): this | string {
        if (value == null) { return this.getAttribute("method") ?? ""; }
        this.setAttribute("method", value);
        return this;
    }

    /**
     * @docs:
     * @title: Min
     * @desc: Specifies a minimum value, equivalent to the HTML attribute `min`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    // @ts-ignore
    min(): string;
    // @ts-ignore
    min(value: string): this;
    // @ts-ignore
    min(value?: string): string | this {
        if (value == null) { return this.getAttribute("min") ?? ""; }
        this.setAttribute("min", value);
        return this;
    }

    /**
     * @docs:
     * @title: Multiple
     * @desc: Specifies that a user can enter more than one value. The equivalent of HTML attribute `multiple`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    multiple(): boolean;
    multiple(value: boolean): this;
    multiple(value?: boolean): boolean | this {
        if (value == null) { return this._try_parse_boolean(this.getAttribute("multiple")); }
        this.setAttribute("multiple", value);
        return this;
    }

    /**
     * @docs:
     * @title: Muted
     * @desc: Specifies that the audio output of the video should be muted. 
     *        The equivalent of HTML attribute `muted`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     *     @type boolean, null
     * @return:
     *     @description: Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    muted(): boolean;
    muted(value: boolean): this;
    muted(value?: boolean): boolean | this {
        if (value == null) { return this._try_parse_boolean(super.getAttribute("muted")); }
        this.setAttribute("muted", value);
        return this;
    }

    // Specifies the name of the element.
    // name(value) {
    //     if (value == null) { return super.name; }
    //  super.name = value;
    //  return this;
    // }

    /**
     * @docs:
     * @title: No validate
     * @desc: Specifies that the form should not be validated when submitted. The equivalent of HTML attribute `novalidate`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    no_validate(): boolean;
    no_validate(value: boolean): this;
    no_validate(value?: boolean): this | boolean {
        if (value == null) { return this._try_parse_boolean(super.novalidate); }
        super.novalidate = value;
        return this;
    }

    /**
     * @docs:
     * @title: Open
     * @desc: Specifies that the details should be visible (open) to the user. 
     *        The equivalent of HTML attribute `open`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     *     @type boolean, null
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    open(): boolean;
    open(value: boolean): this;
    open(value?: boolean): boolean | this {
        if (value == null) { return this._try_parse_boolean(super.getAttribute("open")); }
        this.setAttribute("open", value);
        return this;
    }

    /**
     * @docs:
     * @title: Optimum
     * @desc: Specifies what value is the optimal value for the gauge. The equivalent of HTML attribute `optimum`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    optimum(): null | number;
    optimum(value: number): this;
    optimum(value?: number): this | null | number {
        if (value == null) { return this._try_parse_float(super.getAttribute("optimum"), null); }
        this.setAttribute("optimum", value);
        return this;
    }

    /**
     * @docs:
     * @title: Pattern
     * @desc: Specifies a regular expression that an \<input> element's value is checked against. 
     *        The equivalent of HTML attribute `pattern`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    pattern(): string;
    pattern(value: string): this;
    pattern(value?: string): string | this {
        if (value == null) { return this.getAttribute("pattern") ?? ""; }
        this.setAttribute("pattern", value);
        return this;
    }

    /**
     * @docs:
     * @title: Placeholder
     * @desc: Specifies a short hint that describes the expected value of the element. 
     *        The equivalent of HTML attribute `placeholder`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    placeholder(): string;
    placeholder(value: string): this;
    placeholder(value?: string): string | this {
        if (value == null) { return this.getAttribute("placeholder") ?? ""; }
        this.setAttribute("placeholder", value);
        return this;
    }

    /**
     * @docs:
     * @title: Poster
     * @desc: Specifies an image to be shown while the video is downloading, or until the user hits the play button. 
     *        The equivalent of HTML attribute `poster`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    poster(): string;
    poster(value: string): this;
    poster(value?: string): string | this {
        if (value == null) { return this.getAttribute("poster") ?? ""; }
        this.setAttribute("poster", value);
        return this;
    }

    /**
     * @docs:
     * @title: Preload
     * @desc: Specifies if and how the author thinks the audio/video should be loaded when the page loads. 
     *        The equivalent of HTML attribute `preload`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    preload(): string;
    preload(value: string): this;
    preload(value?: string): string | this {
        if (value == null) { return this.getAttribute("preload") ?? ""; }
        this.setAttribute("preload", value);
        return this;
    }

    /**
     * @docs:
     * @title: Rel
     * @desc: Specifies the relationship between the current document and the linked document. 
     *        The equivalent of HTML attribute `rel`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    rel(): string;
    rel(value: string): this;
    rel(value?: string): string | this {
        if (value == null) { return this.getAttribute("rel") ?? ""; }
        this.setAttribute("rel", value);
        return this;
    }

    /**
     * @docs:
     * @title: Required
     * @desc: Specifies that the element must be filled out before submitting the form. The equivalent of HTML attribute `required`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object when a value is assigned. Returns the attribute's value when `value` is `null`.
     * @funcs: 2
     */
    required(): boolean;
    required(value: boolean): this;
    required(value?: boolean): boolean | this {
        if (value == null) { return this._try_parse_boolean(this.getAttribute("required")); }
        this.setAttribute("required", value);
        return this;
    }

    /**
     * @docs:
     * @title: Reversed
     * @desc: Specifies that the list order should be descending (9,8,7...). This is the equivalent of the HTML attribute `reversed`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    reversed(): boolean;
    reversed(value: boolean): this;
    reversed(value?: boolean): this | boolean {
        if (value == null) { return this._try_parse_boolean(this.getAttribute("reversed")); }
        this.setAttribute("reversed", value);
        return this;
    }

    /**
     * @docs:
     * @title: Rows
     * @desc: Specifies the visible number of lines in a text area. 
     *        The equivalent of HTML attribute `rows`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining, unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    rows(): null | number;
    rows(value: number): this;
    rows(value?: number): null | number | this {
        if (value == null) { return this._try_parse_float(this.getAttribute("rows"), null); }
        this.setAttribute("rows", value);
        return this;
    }

    /**
     * @docs:
     * @title: Row Span
     * @desc: Specifies the number of rows a table cell should span. 
     *        The equivalent of HTML attribute `rowspan`. 
     * @param:
     *     @name: value
     *     @description The value to assign. Leave `null` to retrieve the attribute's value.
     *     @type number, null
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, 
     *                  then the attribute's value is returned.
     * @funcs: 2
     */
    row_span(): null | number;
    row_span(value: number): this;
    row_span(value?: number): this | null | number {
        if (value == null) { return this._try_parse_float(super.rowspan, null); }
        super.rowspan = value;
        return this;
    }

    /**
     * @docs:
     * @title: Sandbox
     * @desc: Enables an extra set of restrictions for the content in an \<iframe>. The equivalent of HTML attribute `sandbox`. 
     * Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    sandbox(): string;
    sandbox(value: string): this;
    sandbox(value?: string): string | this {
        if (value == null) { return this.getAttribute("sandbox") ?? ""; }
        this.setAttribute("sandbox", value);
        return this;
    }

    /**
     * @docs:
     * @title: Scope
     * @desc: Specifies whether a header cell is a header for a column, row, or group of columns or rows. 
     *        The equivalent of HTML attribute `scope`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    scope(): string;
    scope(value: string): this;
    scope(value?: string): string | this {
        if (value == null) { return  this.getAttribute("scope") ?? ""; }
        this.setAttribute("scope", value);
        return this;
    }

    /**
     * @docs:
     * @title: Selected
     * @desc: Specifies that an option should be pre-selected when the page loads. The equivalent of HTML attribute `selected`. 
     *         Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    selected(): boolean;
    selected(value: boolean): this;
    selected(value?: boolean): boolean | this {
        if (value == null) { return this._try_parse_boolean(this._selected.get.call(this)); }
        this._selected.set.call(this, value)
        // if (value == null) { return this._try_parse_boolean(this.getAttribute("selected")); }
        // this.setAttribute("selected", value);
        return this;
    }

    /**
     * @docs:
     * @title: Shape
     * @desc: Specifies the shape of the area. The equivalent of HTML attribute `shape`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description The value to assign. Leave `null` to retrieve the attribute's value.
     *     @type string, null
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    shape(): string;
    shape(value: string): this;
    shape(value?: string): string | this {
        if (value == null) { return this.getAttribute("shape") ?? ""; }
        this.setAttribute("shape", value);
        return this;
    }

    /**
     * @docs:
     * @title: Size
     * @desc: Specifies the width, in characters (for \<input>) or specifies the number of visible options (for \<select>). 
     *        The equivalent of HTML attribute `size`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the attribute's value when `value` is `null`, otherwise returns the instance of the element for chaining.
     * @funcs: 2
     */
    size(): null | number;
    size(value: number): this;
    size(value?: number): null | number | this {
        if (value == null) { return this._try_parse_float(super.getAttribute("size"), null); }
        this.setAttribute("size", value);
        return this;
    }

    /**
     * @docs:
     * @title: Sizes
     * @desc: Specifies the size of the linked resource. The equivalent of HTML attribute `sizes`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    sizes(): string;
    sizes(value: string): this;
    sizes(value?: string): string | this {
        if (value == null) { return this.getAttribute("sizes") ?? ""; }
        this.setAttribute("sizes", value);
        return this;
    }

    /**
     * @docs:
     * @title: Span
     * @desc: Specifies the number of columns to span. The equivalent of HTML attribute `span`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     *     @type number, null
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    // @ts-ignore
    span(): null | number;
    // @ts-ignore
    span(value: number): this;
    // @ts-ignore
    span(value?: number): this | null | number {
        if (value == null) { return this._try_parse_float(super.getAttribute("span"), null); }
        this.setAttribute("span", value);
        return this;
    }

    /**
     * @docs:
     * @title: Spell Check
     * @desc: Specifies whether the element is to have its spelling and grammar checked or not. 
     *        The equivalent of HTML attribute `spellcheck`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    spell_check(): boolean;
    spell_check(value: boolean): this;
    spell_check(value?: boolean): boolean | this {
        if (value == null) { return this._try_parse_boolean(super.spellcheck); }
        this.spellcheck = value;
        return this;
    }

    /**
     * @docs:
     * @title: Src
     * @desc: Specifies the URL of the media file, equivalent to the HTML attribute `src`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    // @ts-ignore
    src(): string;
    // @ts-ignore
    src(value: string, set_aspect_ratio?: boolean): this;
    // @ts-ignore
    src(value ?: string, set_aspect_ratio: boolean = false): string | this {
        if (value == null) { return this._src.get.call(this) ?? ""; }
        this._src.set.call(this, value);
        // if (value == null) { return this.getAttribute("src") ?? ""; }
        // console.log("Set aspect ratio?", set_aspect_ratio, "from src", value)
        if (set_aspect_ratio) {
            const aspect_ratio = Statics.aspect_ratio(value);
            if (aspect_ratio != null) {
                // console.log("Set aspect ratio", aspect_ratio, "from src", value)
                this.aspect_ratio(aspect_ratio)
            }
            // else {
            //     console.log("Unknown aspect ratio from src", value)
            // }
        }
        // this.setAttribute("src", value);
        return this;
    }

    /**
     * @docs:
     * @title: Src doc
     * @desc: Specifies the HTML content of the page to show in the \<iframe>. The equivalent of HTML attribute `srcdoc`.
     *         Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    src_doc(): string;
    src_doc(value: string): this;
    src_doc(value?: string): string | this {
        if (value == null) { return super.srcdoc ?? ""; }
        super.srcdoc = value;
        return this;
    }

    /**
     * @docs:
     * @title: Src lang
     * @desc: Specifies the language of the track text data (required if kind="subtitles"). The equivalent of HTML attribute `srclang`. 
     *          Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    src_lang(): string;
    src_lang(value: string): this;
    src_lang(value?: string): string | this {
        if (value == null) { return super.srclang ?? ""; }
        super.srclang = value;
        return this;
    }

    /**
     * @docs:
     * @title: Rrsrc set
     * @desc: Specifies the URL of the image to use in different situations. 
     *        The equivalent of HTML attribute `srcset`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    rrsrc_set(): string;
    rrsrc_set(value: string): this;
    rrsrc_set(value?: string): this | string {
        if (value == null) { return super.srcset ?? ""; }
        super.srcset = value;
        return this;
    }

    /**
     * @docs:
     * @title: Start
     * @desc: Specifies the start value of an ordered list. The equivalent of HTML attribute `start`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     *     @type number, null
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    start(): null | number;
    start(value: number): this;
    start(value?: number): number | null | this {
        if (value == null) { return this._try_parse_float(super.getAttribute("start"), null); }
        this.setAttribute("start", value);
        return this;
    }

    /**
     * @docs:
     * @title: Step
     * @desc: Specifies the legal number intervals for an input field. The equivalent of HTML attribute `step`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    step(): string;
    step(value: string): this;
    step(value?: string): this | string {
        if (value == null) { return this.getAttribute("step") ?? ""; }
        this.setAttribute("step", value);
        return this;
    }

    // Specifies an inline CSS style for an element.
    // style(value) {
    //     if (value == null) { return super.style; }
    //  super.style = value;
    //  return this;
    // }

    /**
     * @docs:
     * @title: Tab index
     * @desc: Specifies the tabbing order of an element, equivalent to the HTML attribute `tabindex`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, in which case the attribute's value is returned.
     * @funcs: 2
     */
    tab_index(): null | number;
    tab_index(value: number): this;
    tab_index(value?: number): this | null | number {
        if (value == null) { return this._try_parse_float(super.tabIndex, null); }
        super.tabIndex = value;
        return this;
    }

    /**
     * @docs:
     * @title: Target
     * @desc: Specifies the target for where to open the linked document or where to submit the form. 
     *        The equivalent of HTML attribute `target`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    // @ts-ignore
    target(): string;
    // @ts-ignore
    target(value: string): this;
    // @ts-ignore
    target(value?: string): string | this {
        if (value == null) { return this.getAttribute("target") ?? ""; }
        this.setAttribute("target", value);
        return this;
    }

    /**
     * @docs:
     * @title: Title
     * @desc: Specifies extra information about an element, equivalent to the HTML attribute `title`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    // @ts-ignore
    title(): string;
    // @ts-ignore
    title(value: string): this;
    // @ts-ignore
    title(value?: string): this | string {
        if (value == null) { return this.getAttribute("title") ?? ""; }
        this.setAttribute("title", value);
        return this;
    }


    /**
     * @docs:
     * @title: Type
     * @desc: Specifies the type of element, equivalent to the HTML attribute `type`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    type(): string;
    type(value: string): this;
    type(value?: string): string | this {
        if (value == null) { return this.getAttribute("type") ?? ""; }
        this.setAttribute("type", value);
        return this;
    }

    /**
     * @docs:
     * @title: Use Map
     * @desc: Specifies an image as a client-side image map, equivalent to the HTML attribute `usemap`.
     *         Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    use_map(): string;
    use_map(value: string): this;
    use_map(value?: string): string | this {
        if (value == null) { return super.useMap ?? ""; }
        super.useMap = value;
        return this;
    }

    /**
     * @docs:
     * @title: Value
     * @desc: Specifies the value of the element, equivalent to the HTML attribute `value`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining unless `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    value(): string;
    value(value: string): this;
    value(value?: string): string | this {
        if (value == null) {
            return this._value.get.call(this) ?? "";
        }
        this._value.set.call(this, value); // throws an error when used on non input element but that is fine.
        // if (value == null) {
        //     return this.getAttribute("value") ?? "";
        // }
        // this.setAttribute("value", value);
        return this;
    }

    /**
     * docs:
     * @title: On after print
     * @desc: Script to be run after the document is printed. The equivalent of HTML attribute `onafterprint`. 
     *        The first parameter of the callback is the `VElement` object. 
     * @param:
     *     @name: callback
     *     @descr: The callback function to execute after printing. It receives the `VElement` object and the event.
     * @return:
     *     @description Returns the `VElement` object unless the parameter `callback` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    // on_after_print(): Function | undefined;
    // on_after_print(callback: (element: VElement, event:  Event) => any): this;
    // on_after_print(callback?: (element: VElement, event:  Event) => any): this | Function | undefined {
    //  if (callback == null) { return this.onafterprint; }
    //  const e = this;
    //  this.onafterprint = (t) => callback(e, t);
    //  return this;
    // }

    /**
     * docs:
     * @title: On before print
     * @desc: Script to be run before the document is printed. The equivalent of HTML attribute `onbeforeprint`.
     * @param:
     *     @name: callback
     *     @descr: The function to be executed before printing, receiving the `VElement` object as the first parameter.
     * @return:
     *     @description Returns the instance of the element for chaining unless parameter `callback` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    // on_before_print(): Function | undefined;
    // on_before_print(callback: (element: VElement, event:  Event) => any): this;
    // on_before_print(callback?: (element: VElement, event:  Event) => any): this | Function | undefined {
    //  if (callback == null) { return this.onbeforeprint; }
    //  const e = this;
    //  this.onbeforeprint = (t) => callback(e, t);
    //  return this;
    // }

    /**
     * docs:
     * @title: On Before Unload
     * @desc: Script to be run when the document is about to be unloaded. 
     *        This is the equivalent of the HTML attribute `onbeforeunload`. 
     *        The first parameter of the callback is the `VElement` object.
     * @param:
     *     @name: callback
     *     @description: The callback function to execute before unloading the document.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `callback` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    // on_before_unload(): Function | undefined;
    // on_before_unload(callback: (element: VElement, event:  Event) => any): this;
    // on_before_unload(callback?: (element: VElement, event:  Event) => any): this | Function | undefined {
    //  if (callback == null) { return this.onbeforeunload; }
    //  const e = this;
    //  this.onbeforeunload = (t) => callback(e, t);
    //  return this;
    // }

    /**
     * docs:
     * @title: On hash change
     * @desc: 
     *     Script to be run when there has been changes to the anchor part of a URL.
     *     The equivalent of HTML attribute `onhashchange`.
     *     
     *     The first parameter of the callback is the `VElement` object.
     *     
     *     Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: callback
     *     @descr: The callback function to execute on hash change.
     * @return:
     *     @description Returns the `VElement` object for chaining. If parameter `value` is `null`, the attribute's value is returned.
     * @funcs: 2
     */
    // on_hash_change(): Function | undefined;
    // on_hash_change(callback: (element: VElement, event:  Event) => any): this;
    // on_hash_change(callback?: (element: VElement, event:  Event) => any): this | Function | undefined {
    //     if (callback == null) { return this.onhashchange; }
    //     const e = this;
    //     this.onhashchange = (t) => callback(e, t);
    //     return this;
    // }

    // Fires after the page is finished loading.
    /*  DEPRC docs:
     *  @title: On load
     *  @description: 
     *      Fires after the page is finished loading.
     *      The equivalent of HTML attribute `onload`.
     *      
     *      The first parameter of the callback is the `VElement` object.
     *      
     *      Returns the attribute value when parameter `value` is `null`.
     *  @return: 
     *      Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     *  @parameter:
     *      @name: value
     *      @description: The value to assign. Leave `null` to retrieve the attribute's value.
     *  @inherit: false
     */ 
    // on_load(callback) {
    //  if (callback == null) { return this.onload; }
    //  const e = this;
    //  this.onload = (t) => callback(e, t);
    //  return this;
    // }

    /**
     * docs:
     * @title: On message
     * @desc: 
     *     Script to be run when the message is triggered.
     *     The equivalent of HTML attribute `onmessage`.
     *     
     *     The first parameter of the callback is the `VElement` object.
     *     
     *     Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    // on_message(): Function | undefined;
    // on_message(callback: (element: VElement, event:  Event) => any): this;
    // on_message(callback?: (element: VElement, event:  Event) => any): this | Function | undefined {
    //     if (callback == null) { return this.onmessage; }
    //     const e = this;
    //     this.onmessage = (t) => callback(e, t);
    //     return this;
    // }

    /**
     * docs:
     * @title: On Offline
     * @desc: Script to be run when the browser starts to work offline. The equivalent of HTML attribute `onoffline`. 
     *        The first parameter of the callback is the `VElement` object. 
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    // on_offline(): Function | undefined;
    // on_offline(callback: (element: VElement, event:  Event) => any): this;
    // on_offline(callback?: (element: VElement, event:  Event) => any): this | Function | undefined {
    //  if (callback == null) { return this.onoffline; }
    //  const e = this;
    //  this.onoffline = (t) => callback(e, t);
    //  return this;
    // }

    /**
     * docs:
     * @title: On online
     * @desc: Script to be run when the browser starts to work online. 
     *        The equivalent of HTML attribute `ononline`. 
     *        The first parameter of the callback is the `VElement` object.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    // on_online(): Function | undefined;
    // on_online(callback: (element: VElement, event:  Event) => any): this;
    // on_online(callback?: (element: VElement, event:  Event) => any): this | Function | undefined {
    //  if (callback == null) { return this.ononline; }
    //  const e = this;
    //  this.ononline = (t) => callback(e, t);
    //  return this;
    // }

    /**
     * docs:
     * @title: On page hide
     * @desc: 
     *     Script to be run when a user navigates away from a page.
     *     The equivalent of HTML attribute `onpagehide`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    // on_page_hide(): Function | undefined;
    // on_page_hide(callback: (element: VElement, event:  Event) => any): this;
    // on_page_hide(callback?: (element: VElement, event:  Event) => any): this | Function | undefined {
    //  if (callback == null) { return this.onpagehide; }
    //  const e = this;
    //  this.onpagehide = (t) => callback(e, t);
    //  return this;
    // }

    /**
     * docs:
     * @title: On page show
     * @desc: 
     *     Script to be run when a user navigates to a page.
     *     The equivalent of HTML attribute `onpageshow`.
     *     The first parameter of the callback is the `VElement` object.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    // on_page_show(): Function | undefined;
    // on_page_show(callback: ElementEvent<this>): this;
    // on_page_show(callback?: ElementEvent<this>): this | Function | undefined {
    //     if (callback == null) { return this.onpageshow; }
    //     const e = this;
    //     this.onpageshow = (t) => callback(e, t);
    //     return this;
    // }

    /**
     * docs:
     * @title: On Popstate
     * @desc: Script to be run when the window's history changes. The equivalent of HTML attribute `onpopstate`. 
     *        The first parameter of the callback is the `VElement` object. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: callback
     *     @descr: The callback function to execute on popstate event.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `callback` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    // on_popstate(): Function | undefined;
    // on_popstate(callback: (element: VElement, event: PopStateEvent) => any): this;
    // on_popstate(callback?: (element: VElement, event: PopStateEvent) => any): this | Function | undefined {
    //     if (callback == null) { return this.onpopstate; }
    //     const e = this;
    //     this.onpopstate = (t) => callback(e, t);
    //     return this;
    // }

    /**
     * docs:
     * @title: On Storage
     * @desc: Script to be run when a Web Storage area is updated. 
     *        The equivalent of HTML attribute `onstorage`. 
     *        The first parameter of the callback is the `VElement` object.
     * @param:
     *     @name: callback
     *     @descr: The function to be executed when storage is updated.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    // on_storage(): Function | undefined;
    // on_storage(callback: (element: VElement, event:  Event) => any): this;
    // on_storage(callback?: (element: VElement, event:  Event) => any): this | Function | undefined {
    //     if (callback == null) { return this.onstorage; }
    //     const e = this;
    //     this.onstorage = (t) => callback(e, t);
    //     return this;
    // }

    // @deprecated
    // on_unload();

    /**
     * @docs:
     * @title: On Blur
     * @desc: Fires the moment that the element loses focus, similar to the HTML attribute `onblur`. 
     *        The first parameter of the callback is the `VElement` object. 
     * @param:
     *     @name: callback
     *     @descr: The function to call when the element loses focus.
     * @return:
     *     @description Returns the `VElement` object unless the parameter `callback` is `null`, 
     *                  then the attribute's value is returned.
     * @funcs: 2
     */
    on_blur(): Function | undefined;
    on_blur(callback: ElementEvent<this>): this;
    on_blur(callback?: ElementEvent<this>): this | Function | undefined {
        if (callback == null) { return this.onblur ?? undefined; }
        const e = this;
        this.onblur = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On Change
     * @desc: Fires the moment when the value of the element is changed. The equivalent of HTML attribute `onchange`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: callback
     *     @descr: The function to call when the value changes, receiving the `VElement` object and the event as parameters.
     * @return:
     *     @description Returns the `VElement` object for chaining. If `callback` is `null`, returns the current `onchange` value.
     * @funcs: 2
     */
    on_change(): Function | undefined;
    on_change(callback: ElementEvent<this>): this;
    on_change(callback?: ElementEvent<this>): this | Function | undefined {
        if (callback == null) { return this.onchange ?? undefined; }
        const e = this;
        this.onchange = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On Focus
     * @desc: Fires the moment when the element gets focus. This is the equivalent of the HTML attribute `onfocus`. 
     *        The first parameter of the callback is the `VElement` object. 
     * @param:
     *     @name: callback
     *     @descr: The function to be called when the element gets focus.
     * @return:
     *     @description Returns the `VElement` object unless the parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    on_focus(): Function | undefined;
    on_focus(callback: ElementEvent<this>): this;
    on_focus(callback?: ElementEvent<this>): this | Function | undefined {
        if (callback == null) { return this.onfocus ?? undefined; }
        const e = this;
        this.onfocus = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On Input
     * @desc: 
     *     Script to be run when an element gets user input.
     *     The equivalent of HTML attribute `oninput`. 
     *     Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: callback
     *     @descr: The function to call when user input is detected.
     * @return:
     *     @description Returns the `VElement` object for chaining, or the attribute's value if the parameter is `null`.
     * @funcs: 2
     */
    on_input(): ElementEvent<this> | undefined;
    on_input(callback: ElementEvent<this>): this;
    on_input(callback?: ElementEvent<this>): this | ElementEvent<this> | undefined {
        if (callback == null) { return (this.oninput as any) ?? undefined; }
        const e = this;
        this.oninput = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On Input
     * @desc: Script to be run before an element gets user input. The equivalent of HTML attribute `onbeforeinput`.
     * @param:
     *     @name: callback
     *     @description: The function to execute before user input. Receives the `VElement` object and the event as parameters.
     * @return:
     *     @description: Returns the `VElement` object for chaining. If `callback` is `null`, returns the current value of `onbeforeinput`.
     * @funcs: 2
     */
    on_before_input(): Function | undefined;
    on_before_input(callback: ElementEvent<this>): this;
    on_before_input(callback?: ElementEvent<this>): this | Function | undefined {
        if (callback == null) { return (this.onbeforeinput as any) ?? undefined; }
        const e = this;
        this.onbeforeinput = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On Invalid
     * @desc: Script to be run when an element is invalid. The equivalent of HTML attribute `oninvalid`. 
     *        The first parameter of the callback is the `VElement` object. 
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    on_invalid(): Function | undefined;
    on_invalid(callback: ElementEvent<this>): this;
    on_invalid(callback?: ElementEvent<this>): this | Function | undefined {
        if (callback == null) { return this.oninvalid ?? undefined; }
        const e = this;
        this.oninvalid = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On Reset
     * @desc: Fires when the Reset button in a form is clicked. The equivalent of HTML attribute `onreset`.
     *         The first parameter of the callback is the `VElement` object. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: callback
     *     @descr: The function to call when the Reset button is clicked.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    on_reset(): Function | undefined;
    on_reset(callback: ElementEvent<this>): this;
    on_reset(callback?: ElementEvent<this>): this | Function | undefined {
        if (callback == null) { return this.onreset ?? undefined; }
        const e = this;
        this.onreset = (t) => callback(e, t);
        return this;
    }

    // @deprecated
    // on_search();

    /**
     * @docs:
     * @title: On Select
     * @desc: Fires after some text has been selected in an element. The equivalent of HTML attribute `onselect`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: callback
     *     @descr: The callback function to execute when text is selected. It receives the `VElement` object as the first parameter.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    on_select(): Function | undefined;
    on_select(callback: ElementEvent<this>): this;
    on_select(callback?: ElementEvent<this>): this | Function | undefined {
        if (callback == null) { return this.onselect ?? undefined; }
        const e = this;
        this.onselect = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On Submit
     * @desc: Fires when a form is submitted, similar to the HTML attribute `onsubmit`. 
     *        The first parameter of the callback is the `VElement` object. 
     * @param:
     *     @name: callback
     *     @descr: The callback function to execute on form submission.
     * @return:
     *     @description Returns the instance of the element for chaining. If `callback` is null, returns the current `onsubmit` attribute value.
     * @funcs: 2
     */
    on_submit(): Function | undefined;
    on_submit(callback: ElementEvent<this>): this;
    on_submit(callback?: ElementEvent<this>): this | Function | undefined {
        if (callback == null) { return this.onsubmit ?? undefined; }
        const e = this;
        this.onsubmit = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On Key Down
     * @desc: Fires when a user is pressing a key. The equivalent of HTML attribute `onkeydown`. 
     * The first parameter of the callback is the `VElement` object. 
     * Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: callback
     *     @descr: The callback function to execute when the key is pressed.
     * @return:
     *     @description Returns the `VElement` object for chaining. If the parameter `callback` is `null`, the current attribute's value is returned.
     * @funcs: 2
     */
    on_key_down(): Function | undefined;
    on_key_down(callback: ElementKeyboardEvent<this>): this;
    on_key_down(callback?: ElementKeyboardEvent<this>): this | Function | undefined {
        if (callback == null) { return this.onkeydown ?? undefined; }
        const e = this;
        this.onkeydown = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On Key Press
     * @desc: Fires when a user presses a key, similar to the HTML `onkeypress` attribute.
     * The first parameter of the callback is the `VElement` object, allowing for dynamic handling of key events.
     * @param:
     *     @name: callback
     *     @descr: The function to call when a key is pressed. Receives the `VElement` and event as parameters.
     * @return:
     *     @description Returns the `VElement` object for chaining. If `callback` is `null`, the current attribute value is returned.
     * @funcs: 2
     */
    on_key_press(): Function | undefined;
    on_key_press(callback: ElementKeyboardEvent<this>): this;
    on_key_press(callback?: ElementKeyboardEvent<this>): this | Function | undefined {
        if (callback == null) { return this.onkeypress ?? undefined; }
        const e = this;
        this.onkeypress = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On Key Up
     * @desc: Fires when a user releases a key, similar to the HTML attribute `onkeyup`. 
     *        The first parameter of the callback is the `VElement` object.
     * @param:
     *     @name: callback
     *     @descr: The function to call when the key is released. 
     *              Leave `null` to retrieve the current attribute's value.
     * @return:
     *     @description Returns the `VElement` object for chaining, unless `callback` is `null`, 
     *                  in which case the current attribute's value is returned.
     * @funcs: 2
     */
    on_key_up(): Function | undefined;
    on_key_up(callback: ElementKeyboardEvent<this>): this;
    on_key_up(callback?: ElementKeyboardEvent<this>): this | Function | undefined {
        if (callback == null) { return this.onkeyup ?? undefined; }
        const e = this;
        this.onkeyup = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On dbl click
     * @desc: Fires on a mouse double-click on the element. The equivalent of HTML attribute `ondblclick`. 
     *        The first parameter of the callback is the `VElement` object. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: callback
     *     @descr: The function to execute on double-click. Receives the `VElement` and the event as parameters.
     * @return:
     *     @description Returns the `VElement` object for chaining. If `callback` is null, returns the current attribute value.
     * @funcs: 2
     */
    on_dbl_click(): Function | undefined;
    on_dbl_click(callback: ElementMouseEvent<this>): this;
    on_dbl_click(callback?: ElementMouseEvent<this>): this | Function | undefined {
        if (callback == null) { return this.ondblclick ?? undefined; }
        const e = this;
        this.ondblclick = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On Mouse Down
     * @desc: Fires when a mouse button is pressed down on an element. The equivalent of HTML attribute `onmousedown`. 
     *        The first parameter of the callback is the `VElement` object. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: callback
     *     @descr: The function to execute when the mouse button is pressed down.
     * @return:
     *     @description Returns the `VElement` object for chaining. If the parameter `callback` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    on_mouse_down(): Function | undefined;
    on_mouse_down(callback: ElementMouseEvent<this>): this;
    on_mouse_down(callback?: ElementMouseEvent<this>): this | Function | undefined {
        if (callback == null) { return this.onmousedown ?? undefined; }
        const e = this;
        this.onmousedown = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On Mouse Move
     * @desc: Fires when the mouse pointer is moving while it is over an element. 
     *        The equivalent of HTML attribute `onmousemove`. Invokes the callback with the element and event.
     * @param:
     *     @name: callback
     *     @descr: The function to call when the mouse moves over the element.
     * @return:
     *     @description Returns the instance of the element for chaining. Unless parameter `callback` is `null`, then the event is returned.
     * @funcs: 2
     */
    on_mouse_move(): Function | undefined;
    on_mouse_move(callback: ElementMouseEvent<this>): this;
    on_mouse_move(callback?: ElementMouseEvent<this>): this | Function | undefined  {
        if (callback == null) { return this.onmousemove ?? undefined; }
        const e = this;
        this.onmousemove = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On mouse out
     * @desc: Fires when the mouse pointer moves out of an element. The equivalent of HTML attribute `onmouseout`. 
     *         The first parameter of the callback is the `VElement` object. 
     *         Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: callback
     *     @description: The callback function to execute when the mouse moves out.
     * @return:
     *     @description Returns the `VElement` object for chaining, or the attribute's value if the callback is `null`.
     * @funcs: 2
     */
    on_mouse_out(): Function | undefined;
    on_mouse_out(callback: ElementMouseEvent<this>): this;
    on_mouse_out(callback?: ElementMouseEvent<this>): this | Function | undefined {
        if (callback == null) { return this.onmouseout ?? undefined; }
        const e = this;
        this.onmouseout = (t) => {
            if (!this._is_button_disabled) {
                callback(e, t)
            }
        };
        return this;
    }

    /**
     * @docs:
     * @title: On Mouse Over
     * @desc: Fires when the mouse pointer moves over an element, similar to the HTML `onmouseover` attribute.
     * @param:
     *     @name: callback
     *     @descr: The callback function to execute when the mouse is over the element.
     * @return:
     *     @description Returns the instance of the element for chaining. If `callback` is null, returns the current `onmouseover` attribute value.
     * @funcs: 2
     */
    on_mouse_over(): Function | undefined;
    on_mouse_over(callback: ElementMouseEvent<this>): this;
    on_mouse_over(callback?: ElementMouseEvent<this>): this | Function | undefined {
        if (callback == null) { return this.onmouseover ?? undefined; }
        const e = this;
        this.onmouseover = (t) => {
            if (!this._is_button_disabled) {
                callback(e, t)
            }
        };
        return this;
    }

    /**
     * @docs:
     * @title: On Mouse Up
     * @desc: Fires when a mouse button is released over an element. The equivalent of HTML attribute `onmouseup`.
     *         The first parameter of the callback is the `VElement` object. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: callback
     *     @descr: The callback function to execute when the mouse button is released.
     * @return:
     *     @description Returns the `VElement` object for chaining. If `callback` is `null`, returns the current `onmouseup` value.
     * @funcs: 2
     */
    on_mouse_up(): Function | undefined;
    on_mouse_up(callback: ElementMouseEvent<this>): this;
    on_mouse_up(callback?: ElementMouseEvent<this>): this | Function | undefined {
        if (callback == null) { return this.onmouseup ?? undefined; }
        const e = this;
        this.onmouseup = (t) => callback(e, t);
        return this;
    }

    // @deprecated onmousewheel.
    // on_mouse_wheel();

    /**
     * @docs:
     * @title: On Wheel
     * @desc: Fires when the mouse wheel rolls up or down over an element. The equivalent of HTML attribute `onwheel`. 
     *        The first parameter of the callback is the `VElement` object. 
     * @param:
     *     @name: callback
     *     @descr: The callback function to execute on wheel event.
     * @return:
     *     @description Returns the instance of the element for chaining. Unless parameter `callback` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    on_wheel(): Function | undefined;
    on_wheel(callback: (element: this, event: WheelEvent) => any): this;
    on_wheel(callback?: (element: this, event: WheelEvent) => any): this | Function | undefined {
        if (callback == null) { return this.onwheel ?? undefined; }
        const e = this;
        this.onwheel = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On Drag
     * @desc: Script to be run when an element is dragged. The equivalent of HTML attribute `ondrag`. 
     *        The first parameter of the callback is the `VElement` object. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: callback
     *     @descr: The callback function to execute when the element is dragged.
     * @return:
     *     @description Returns the instance of the element for chaining unless the parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    on_drag(): Function | undefined;
    on_drag(callback: ElementDragEvent<this>): this;
    on_drag(callback?: ElementDragEvent<this>): this | Function | undefined {
        if (callback == null) { return this.ondrag ?? undefined; }
        const e = this;
        this.ondrag = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On Drag End
     * @desc: Script to be run at the end of a drag operation. The equivalent of HTML attribute `ondragend`. 
     *        The first parameter of the callback is the `VElement` object. 
     * @param:
     *     @name: callback
     *     @descr: The callback function to execute at the end of the drag operation.
     * @return:
     *     @description Returns the `VElement` object unless the parameter `value` is `null`, in which case the attribute's value is returned.
     * @funcs: 2
     */
    on_drag_end(): Function | undefined;
    on_drag_end(callback: ElementDragEvent<this>): this;
    on_drag_end(callback?: ElementDragEvent<this>): this | Function | undefined {
        if (callback == null) { return this.ondragend ?? undefined; }
        const e = this;
        this.ondragend = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On Drag Enter
     * @desc: 
     *     Script to be run when an element has been dragged to a valid drop target.
     *     The equivalent of HTML attribute `ondragenter`.
     *     
     *     The first parameter of the callback is the `VElement` object.
     *     
     *     Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: callback
     *     @descr: The function to execute when the drag enters the target.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    on_drag_enter(): Function | undefined;
    on_drag_enter(callback: ElementDragEvent<this>): this;
    on_drag_enter(callback?: ElementDragEvent<this>): this | Function | undefined{
        if (callback == null) { return this.ondragenter ?? undefined; }
        const e = this;
        this.ondragenter = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On drag leave
     * @desc: 
     *     Script to be run when an element leaves a valid drop target.
     *     The equivalent of HTML attribute `ondragleave`.
     *     
     *     The first parameter of the callback is the `VElement` object.
     *     
     *     Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    on_drag_leave(): Function | undefined;
    on_drag_leave(callback: ElementDragEvent<this>): this;
    on_drag_leave(callback?: ElementDragEvent<this>): this | Function | undefined {
        if (callback == null) { return this.ondragleave ?? undefined; }
        const e = this;
        this.ondragleave = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On drag over
     * @desc: 
     *     Script to be run when an element is being dragged over a valid drop target.
     *     The equivalent of HTML attribute `ondragover`.
     * @param:
     *     @name: callback
     *     @descr: The function to execute when the drag over event occurs.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `callback` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    on_drag_over(): Function | undefined;
    on_drag_over(callback: ElementDragEvent<this>): this;
    on_drag_over(callback?: ElementDragEvent<this>): this | Function | undefined{
        if (callback == null) { return this.ondragover ?? undefined; }
        const e = this;
        this.ondragover = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On Drag Start
     * @desc: Script to be run at the start of a drag operation. The equivalent of HTML attribute `ondragstart`. 
     *        The first parameter of the callback is the `VElement` object. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: callback
     *     @descr: The function to call when the drag starts.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `callback` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    on_drag_start(): Function | undefined;
    on_drag_start(callback: ElementDragEvent<this>): this;
    on_drag_start(callback?: ElementDragEvent<this>): this | Function | undefined{
        if (callback == null) { return this.ondragstart ?? undefined; }
        const e = this;
        this.ondragstart = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On drop
     * @desc: Script to be run when dragged element is being dropped. The equivalent of HTML attribute `ondrop`. The first parameter of the callback is the `VElement` object. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    on_drop(): Function | undefined;
    on_drop(callback: ElementEvent<this>): this;
    on_drop(callback?: ElementEvent<this>): this | Function | undefined {
        if (callback == null) { return this.ondrop ?? undefined; }
        const e = this;
        this.ondrop = (t) => callback(e, t);
        return this;
    }

    // Script to be run when an element's scrollbar is being scrolled.
    // on_scroll(callback) {
    //     if (callback == null) { return this.onscroll; }
    //  const e = this;
    //  this.onscroll = (t) => callback(e, t);
    //  return this;
    // }

    /**
     * @docs:
     * @title: On Copy
     * @desc: Fires when the user copies the content of an element. The equivalent of HTML attribute `oncopy`. 
     *        The first parameter of the callback is the `VElement` object. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: callback
     *     @descr: The function to be called when the copy event occurs.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     */
    on_copy(): Function | undefined;
    on_copy(callback: ElementEvent<this>): this;
    on_copy(callback?: ElementEvent<this>): this | Function | undefined {
        if (callback == null) { return this.oncopy ?? undefined; }
        const e = this;
        this.oncopy = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On Cut
     * @desc: Fires when the user cuts the content of an element, equivalent to the HTML attribute `oncut`.
     *        The first parameter of the callback is the `VElement` object.
     * @param:
     *     @name: callback
     *     @descr: The function to call when the cut event occurs.
     * @return:
     *     @description Returns the `VElement` object unless the parameter `callback` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    on_cut(): Function | undefined;
    on_cut(callback: ElementEvent<this>): this;
    on_cut(callback?: ElementEvent<this>): undefined | Function | this {
        if (callback == null) { return this.oncut ?? undefined; }
        const e = this;
        this.oncut = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On Paste
     * @desc: Fires when the user pastes some content in an element. The equivalent of HTML attribute `onpaste`. 
     *        The first parameter of the callback is the `VElement` object. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: callback
     *     @descr: The function to call when the paste event occurs.
     * @return:
     *     @description Returns the `VElement` object for chaining. If `callback` is `null`, returns the current `onpaste` attribute value.
     * @funcs: 2
     */
    on_paste(): Function | undefined;
    on_paste(callback: ElementEvent<this>): this;
    on_paste(callback?: ElementEvent<this>): undefined | Function | this {
        if (callback == null) { return this.onpaste ?? undefined; }
        const e = this;
        this.onpaste = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On Abort
     * @desc: Script to be run on abort, equivalent to the HTML attribute `onabort`. 
     *        The first parameter of the callback is the `VElement` object. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: callback
     *     @descr: The callback function to execute on abort event.
     * @return:
     *     @description Returns the instance of the element for chaining. Unless parameter `callback` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    on_abort(): Function | undefined;
    on_abort(callback: ElementEvent<this>): this;
    on_abort(callback?: ElementEvent<this>): undefined | Function | this {
        if (callback == null) { return this.onabort ?? undefined; }
        const e = this;
        this.onabort = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On Can Play
     * @desc: Script to be run when a file is ready to start playing (when it has buffered enough to begin). 
     *        The equivalent of HTML attribute `oncanplay`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: callback
     *     @descr: The callback function to execute when the event occurs.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    on_canplay(): Function | undefined;
    on_canplay(callback: ElementEvent<this>): this;
    on_canplay(callback?: ElementEvent<this>): undefined | Function | this {
        if (callback == null) { return this.oncanplay ?? undefined; }
        const e = this;
        this.oncanplay = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On Can Play Through
     * @desc: Script to be run when a file can be played all the way to the end without pausing for buffering. 
     *        The equivalent of HTML attribute `oncanplaythrough`.
     * @param:
     *     @name: callback
     *     @description: The callback function to execute when the event occurs.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    on_canplay_through(): Function | undefined;
    on_canplay_through(callback: ElementEvent<this>): this;
    on_canplay_through(callback?: ElementEvent<this>): undefined | Function | this {
        if (callback == null) { return this.oncanplaythrough ?? undefined; }
        const e = this;
        this.oncanplaythrough = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On Cue Change
     * @desc: Script to be run when the cue changes in a \<track> element. 
     *        The equivalent of HTML attribute `oncuechange`. 
     *        The first parameter of the callback is the `VElement` object.
     * @param:
     *     @name: callback
     *     @descr: The function to call when the cue changes.
     * @return:
     *     @description Returns the instance of the element for chaining. 
     *                  Unless the parameter `callback` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    on_cue_change(): Function | undefined;
    on_cue_change(callback: ElementEvent<this>): this;
    on_cue_change(callback?: ElementEvent<this>): undefined | Function | this {
        if (callback == null) { return this.oncuechange ?? undefined; }
        const e = this;
        this.oncuechange = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On Duration Change
     * @desc: Script to be run when the length of the media changes. The equivalent of HTML attribute `ondurationchange`. 
     *        The first parameter of the callback is the `VElement` object. 
     * @param:
     *     @name: callback
     *     @descr: The callback function to execute on duration change.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
    * @funcs: 2
     */
    on_duration_change(): Function | undefined;
    on_duration_change(callback: ElementEvent<this>): this;
    on_duration_change(callback?: ElementEvent<this>): undefined | Function | this {
        if (callback == null) { return this.ondurationchange ?? undefined; }
        const e = this;
        this.ondurationchange = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On Emptied
     * @desc: Script to be run when something bad happens and the file is suddenly unavailable (like unexpectedly disconnects).
     *        The equivalent of HTML attribute `onemptied`. The first parameter of the callback is the `VElement` object.
     * @param:
     *     @name: callback
     *     @description: The callback function to execute when the event occurs.
     * @return:
     *     @description: Returns the `VElement` object. Unless parameter `callback` is `null`, then the attribute's value is returned.
    * @funcs: 2
     */
    on_emptied(): Function | undefined;
    on_emptied(callback: ElementEvent<this>): this;
    on_emptied(callback?: ElementEvent<this>): undefined | Function | this {
        if (callback == null) { return this.onemptied ?? undefined; }
        const e = this;
        this.onemptied = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On ended
     * @desc: 
     *     Script to be run when the media has reach the end (a useful event for messages like "thanks for listening").
     *     The equivalent of HTML attribute `onended`.
     * @param:
     *     @name: callback
     *     @descr: The function to call when the media ends. Leave `null` to retrieve the current callback.
     * @return:
     *     @description Returns the instance of the element for chaining. Unless parameter `callback` is `null`, then the current callback function is returned.
     * @funcs: 2
     */
    on_ended(): Function | undefined;
    on_ended(callback: ElementEvent<this>): this;
    on_ended(callback?: ElementEvent<this>): undefined | Function | this {
        if (callback == null) { return this.onended ?? undefined; }
        const e = this;
        this.onended = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On Error
     * @desc: Script to be run when an error occurs while loading the file, similar to HTML's `onerror` attribute. 
     *        The first parameter of the callback is the `VElement` object. Returns the attribute value if `value` is `null`.
     * @param:
     *     @name: callback
     *     @descr: The callback function to execute on error. It receives the `VElement` object and the error event.
     * @return:
     *     @description Returns the instance of the element for chaining, unless `callback` is `null`, then the current `onerror` attribute value is returned.
     * @funcs: 2
     */
    on_error(): Function | undefined;
    on_error(callback: (element: this, error: string | Event) => any): this;
    on_error(callback?: (element: this, error: string | Event) => any): undefined | Function | this {
        if (callback == null) { return this.onerror ?? undefined; }
        const e = this;
        this.onerror = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On Loaded Data
     * @desc: Script to be run when media data is loaded. The equivalent of HTML attribute `onloadeddata`. 
     *        Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: callback
     *     @descr: The callback function that receives the `VElement` object and the event.
     * @return:
     *     @description Returns the `VElement` object unless parameter `callback` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    on_loaded_data(): Function | undefined;
    on_loaded_data(callback: ElementEvent<this>): this;
    on_loaded_data(callback?: ElementEvent<this>): undefined | Function | this {
        if (callback == null) { return this.onloadeddata ?? undefined; }
        const e = this;
        this.onloadeddata = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On loaded metadata
     * @desc: Script to be run when meta data (like dimensions and duration) are loaded. 
     *        The equivalent of HTML attribute `onloadedmetadata`. 
     *        The first parameter of the callback is the `VElement` object.
     * @param:
     *     @name: callback
     *     @descr: A function to be executed when metadata is loaded.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `callback` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    on_loaded_metadata(): Function | undefined;
    on_loaded_metadata(callback: ElementEvent<this>): this;
    on_loaded_metadata(callback?: ElementEvent<this>): undefined | Function | this {
        if (callback == null) { return this.onloadedmetadata ?? undefined; }
        const e = this;
        this.onloadedmetadata = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On load start
     * @desc: 
     *     Script to be run just as the file begins to load before anything is actually loaded.
     *     The equivalent of HTML attribute `onloadstart`.
     *     
     *     The first parameter of the callback is the `VElement` object.
     *     
     *     Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    on_load_start(): Function | undefined;
    on_load_start(callback: ElementEvent<this>): this;
    on_load_start(callback?: ElementEvent<this>): undefined | Function | this {
        if (callback == null) { return this.onloadstart ?? undefined; }
        const e = this;
        this.onloadstart = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On Pause
     * @desc: Script to be run when the media is paused either by the user or programmatically. The equivalent of HTML attribute `onpause`.
     * @param:
     *     @name: callback
     *     @descr: The callback function to execute when the media is paused. Leave `null` to retrieve the current attribute's value.
     * @return:
     *     @description Returns the instance of the element for chaining unless the parameter is `null`, then the current attribute's value is returned.
     * @funcs: 2
     */
    on_pause(): Function | undefined;
    on_pause(callback: ElementEvent<this>): this;
    on_pause(callback?: ElementEvent<this>): undefined | Function | this {
        if (callback == null) { return this.onpause ?? undefined; }
        const e = this;
        this.onpause = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On Play
     * @desc: Script to be run when the media is ready to start playing. The equivalent of HTML attribute `onplay`. 
     *        The first parameter of the callback is the `VElement` object. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: callback
     *     @descr: The function to be executed when the media starts playing.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `callback` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    on_play(): Function | undefined;
    on_play(callback: ElementEvent<this>): this;
    on_play(callback?: ElementEvent<this>): undefined | Function | this {
        if (callback == null) { return this.onplay ?? undefined; }
        const e = this;
        this.onplay = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On Playing
     * @desc: Script to be run when the media actually has started playing. This is the equivalent of the HTML attribute `onplaying`.
     * @param:
     *     @name: callback
     *     @descr: The function to execute when the media starts playing. It receives the `VElement` object as the first parameter.
     * @return:
     *     @description Returns the instance of the element for chaining. If `null` is passed, it returns the current `onplaying` callback.
     * @funcs: 2
     */
    on_playing() : Function | undefined;
    on_playing(callback: (element: this, time: any) => any) : this;
    on_playing(callback?: (element: this, time: any) => any): this | Function | undefined {
        if (callback == null) { return this.onplaying ?? undefined; }
        const e = this;
        this.onplaying = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: Onprogress
     * @desc: 
     *     Script to be run when the browser is in the process of getting the media data.
     *     The equivalent of HTML attribute `onprogress`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: callback
     *     @descr: The function to be executed when the media data is being loaded.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `callback` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    on_progress(): Function | undefined;
    on_progress(callback: ElementEvent<this>): this;
    on_progress(callback?: ElementEvent<this>): this | Function | undefined {
        if (callback == null) { return this.onprogress ?? undefined; }
        const e = this;
        this.onprogress = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On Rate Change
     * @desc: Script to be run each time the playback rate changes (like when a user switches to a slow motion or fast forward mode). 
     *        The equivalent of HTML attribute `onratechange`. Returns the attribute value when parameter `value` is `null`.
     * @param:
     *     @name: callback
     *     @descr: The callback function to execute on rate change.
     * @return:
     *     @description Returns the `VElement` object unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    on_rate_change(): Function | undefined;
    on_rate_change(callback: ElementEvent<this>): this;
    on_rate_change(callback?: ElementEvent<this>): undefined | this | Function {
        if (callback == null) { return this.onratechange ?? undefined; }
        const e = this;
        this.onratechange = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On seeked
     * @desc: 
     *     Script to be run when the seeking attribute is set to false indicating that seeking has ended.
     *     The equivalent of HTML attribute `onseeked`.
     * @param:
     *     @name: callback
     *     @descr: The callback function to execute when seeking ends.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    on_seeked(): Function | undefined;
    on_seeked(callback: (element: this, time: any) => any): this;
    on_seeked(callback?: (element: this, time: any) => any): this | Function | undefined {
        if (callback == null) { return this.onseeked ?? undefined; }
        const e = this;
        this.onseeked = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On Seeking
     * @desc: Script to be run when the seeking attribute is set to true indicating that seeking is active. 
     *        The equivalent of HTML attribute `onseeking`. 
     * @param:
     *     @name: callback
     *     @descr: The callback function to execute when seeking occurs.
     * @return:
     *     @description Returns the instance of the element for chaining. Unless parameter `callback` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    on_seeking(): Function | undefined;
    on_seeking(callback: (element: this, time: any) => any): this;
    on_seeking(callback?: (element: this, time: any) => any): this | Function | undefined {
        if (callback == null) { return this.onseeking ?? undefined; }
        const e = this;
        this.onseeking = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On Stalled
     * @desc: Script to be run when the browser is unable to fetch the media data for whatever reason. This is the equivalent of the HTML attribute `onstalled`. The first parameter of the callback is the `VElement` object.
     * @param:
     *     @name: value
     *     @description: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description: Returns the `VElement` object unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    on_stalled(): Function | undefined;
    on_stalled(callback: ElementEvent<this>): this;
    on_stalled(callback?: ElementEvent<this>): this | Function | undefined {
        if (callback == null) { return this.onstalled ?? undefined; }
        const e = this;
        this.onstalled = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On Suspend
     * @desc: Script to be run when fetching the media data is stopped before it is completely loaded for whatever reason. The equivalent of HTML attribute `onsuspend`.
     * @param:
     *     @name: callback
     *     @descr: The function to be executed when the suspend event occurs. The first parameter of the callback is the `VElement` object.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    on_suspend(): Function | undefined;
    on_suspend(callback: Function): this;
    on_suspend(callback?: Function): this | Function | undefined {
        if (callback == null) { return this.onsuspend ?? undefined; }
        const e = this;
        this.onsuspend = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On Time Update
     * @desc: Script to be run when the playing position has changed (like when the user fast forwards to a different point in the media). The equivalent of HTML attribute `ontimeupdate`.
     * @param:
     *     @name: callback
     *     @descr: The callback function to execute when the time updates. The first parameter of the callback is the `VElement` object.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `callback` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    on_time_update(): Function | undefined;
    on_time_update(callback: ElementEvent<this>): this;
    on_time_update(callback?: ElementEvent<this>): this | Function | undefined {
        if (callback == null) { return this.ontimeupdate ?? undefined; }
        const e = this;
        this.ontimeupdate = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On Volume Change
     * @desc: Script to be run each time the volume is changed which includes setting the volume to "mute". 
     *        The equivalent of HTML attribute `onvolumechange`. The first parameter of the callback is the `VElement` object.
     * @param:
     *     @name: callback
     *     @descr: The callback function to execute on volume change.
     * @return:
     *     @description Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    on_volume_change(): Function | undefined;
    on_volume_change(callback: ElementEvent<this>): this;
    on_volume_change(callback?: ElementEvent<this>): this | Function | undefined {
        if (callback == null) { return this.onvolumechange ?? undefined; }
        const e = this;
        this.onvolumechange = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On Waiting
     * @desc: Script to be run when the media has paused but is expected to resume (like when the media pauses to buffer more data). The equivalent of HTML attribute `onwaiting`.
     * @param:
     *     @name: callback
     *     @descr: The callback function to execute when the media is waiting.
     * @return:
     *     @description Returns the `VElement` object unless parameter `callback` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    on_waiting(): Function | undefined;
    on_waiting(callback: (element: this, time: any) => any): this;
    on_waiting(callback?: (element: this, time: any) => any): this | Function | undefined {
        if (callback == null) { return this.onwaiting ?? undefined; }
        const e = this;
        this.onwaiting = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On toggle
     * @desc: Fires when the user opens or closes the \<details> element. 
     *        The equivalent of HTML attribute `ontoggle`. 
     *        The first parameter of the callback is the `VElement` object.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
     * @return:
     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @funcs: 2
     */
    on_toggle() : Function | undefined;
    on_toggle(callback: ElementEvent<this>): this;
    on_toggle(callback?: ElementEvent<this>): this | Function | undefined {
        if (callback == null) { return this.ontoggle ?? undefined; }
        const e = this;
        this.ontoggle = (t) => callback(e, t);
        return this;
    }
};

// @test
// new VElement().myexect(); // should throw error.

// Test.
export function isVElement(type: any): type is VElement {
    return type.__is_velement ?? false;
}
export function is_velement(type: any): type is VElement {
    return type.__is_velement ?? false;
}

// ------------------------------------------------------------------------------------------------
// Wrapper functions.

// Mixin function.
const mixed_classes = [] as any[];
function mixin(derived: any) {

    Object.getOwnPropertyNames(VElement.prototype).forEach((name) => {
        if (name !== "constructor") {
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
export function extend<T extends Record<string, ((this: VElement & ThisType<VElement>, ...args: any[]) => any) | any>>(extension: T) {
    Object.assign(VElement.prototype, extension);
    mixed_classes.forEach(instance => {
        Object.assign(instance.prototype, extension);
    });
};

// Post process velement.
function postprocess(type: any): void {
    mixin(type);
    register_element(type);
}

// Create a constructor wrapper.
export function wrapper<T extends new (...args: any[]) => any>(
    constructor: T
): <Extensions extends object = {}>(...args: ConstructorParameters<T>) => InstanceType<T> & Extensions {
    return <Extensions extends object = {}>(...args: ConstructorParameters<T>) => new constructor(...args) as InstanceType<T> & Extensions;
}

// Create a shared null element mainly for typescript types.
export function create_null<T extends new (...args: any[]) => any>(target_class: T): <Extensions extends object = {}>() => InstanceType<T> & Extensions {
    let instance: T | undefined;
    return <Extensions extends object = {}>(): InstanceType<T> & Extensions => {
        if (instance === undefined) {
            instance = new target_class();
        }
        return instance as unknown as InstanceType<T> & Extensions;
    };
}

// ------------------------------------------------------------------------------------------------
// Types
// These types must be defined as v2 in order to extend all base html elements properly and still keep VElement as common base class without using dynamic classes.
// v1 used a dynamic class which caused a lot of typescript issues regarding extended type & method hierarchy.

// The signature types used to cast `class X extends (VStackElement as VElementBaseSignature)`.
// 1. Done to add the extensions to the classes so the class types can be used and still include the extensions instead of `ReturnType<typeof volt.Text>` because that already had the extensions.
// 2. Done because sometimes when extending a class typescript doesnt infer and detec the original VElement methods, this cast also fixes that.
export type VElementBaseSignature = {
    new(...args: any[]): VElement & VElementExtensions;
    element_tag: string;
    default_style: Record<string, any>;
    default_attributes: Record<string, any>;
    default_events: Record<string, any>;
}
type VElementBaseSignature2 = VElementBaseSignature;

// type _SafeVBaseElement = typeof VElement & typeof HTMLElement & {
//    new(): VElement & HTMLElement & VElementExtensions,
//    prototype: VElement & HTMLElement & VElementExtensions,
// }

// ---
// generated by dev/automate_types.js:

// Base class VHTMLElement derived from HTMLElement.
// @ts-ignore
export class VHTMLElement extends (HTMLElement as unknown as VElementBaseSignature2) {
    static element_name = "VHTMLElement";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VHTMLElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VHTMLElement extends HTMLElement, VElement, VElementExtensions {};
postprocess(VHTMLElement);
export const VHTML = wrapper(VHTMLElement);
export const NullVHTML = create_null(VHTMLElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VHTMLElement: VHTMLElement }}

// Base class VAnchorElement derived from HTMLAnchorElement.
// @ts-ignore
export class VAnchorElement extends (HTMLAnchorElement as unknown as VElementBaseSignature2) {
    static element_name = "VAnchorElement";
    static element_tag = "a";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VAnchorElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VAnchorElement extends HTMLAnchorElement, VElement, VElementExtensions {};
postprocess(VAnchorElement);
export const VAnchor = wrapper(VAnchorElement);
export const NullVAnchor = create_null(VAnchorElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VAnchorElement: VAnchorElement }}

// Base class VAreaElement derived from HTMLAreaElement.
// @ts-ignore
export class VAreaElement extends (HTMLAreaElement as unknown as VElementBaseSignature2) {
    static element_name = "VAreaElement";
    static element_tag = "area";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VAreaElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VAreaElement extends HTMLAreaElement, VElement, VElementExtensions {};
postprocess(VAreaElement);
export const VArea = wrapper(VAreaElement);
export const NullVArea = create_null(VAreaElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VAreaElement: VAreaElement }}

// Base class VAudioElement derived from HTMLAudioElement.
// @ts-ignore
export class VAudioElement extends (HTMLAudioElement as unknown as VElementBaseSignature2) {
    static element_name = "VAudioElement";
    static element_tag = "audio";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VAudioElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VAudioElement extends HTMLAudioElement, VElement, VElementExtensions {};
postprocess(VAudioElement);
export const VAudio = wrapper(VAudioElement);
export const NullVAudio = create_null(VAudioElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VAudioElement: VAudioElement }}

// Base class VBlockQuoteElement derived from HTMLQuoteElement.
// @ts-ignore
export class VBlockQuoteElement extends (HTMLQuoteElement as unknown as VElementBaseSignature2) {
    static element_name = "VBlockQuoteElement";
    static element_tag = "blockquote";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VBlockQuoteElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VBlockQuoteElement extends HTMLQuoteElement, VElement, VElementExtensions {};
postprocess(VBlockQuoteElement);
export const VBlockQuote = wrapper(VBlockQuoteElement);
export const NullVBlockQuote = create_null(VBlockQuoteElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VBlockQuoteElement: VBlockQuoteElement }}

// Base class VBodyElement derived from HTMLBodyElement.
// @ts-ignore
export class VBodyElement extends (HTMLBodyElement as unknown as VElementBaseSignature2) {
    static element_name = "VBodyElement";
    static element_tag = "body";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VBodyElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VBodyElement extends HTMLBodyElement, VElement, VElementExtensions {};
postprocess(VBodyElement);
export const VBody = wrapper(VBodyElement);
export const NullVBody = create_null(VBodyElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VBodyElement: VBodyElement }}

// Base class VBRElement derived from HTMLBRElement.
// @ts-ignore
export class VBRElement extends (HTMLBRElement as unknown as VElementBaseSignature2) {
    static element_name = "VBRElement";
    static element_tag = "br";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VBRElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VBRElement extends HTMLBRElement, VElement, VElementExtensions {};
postprocess(VBRElement);
export const VBR = wrapper(VBRElement);
export const NullVBR = create_null(VBRElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VBRElement: VBRElement }}

// Base class VButtonElement derived from HTMLButtonElement.
// @ts-ignore
export class VButtonElement extends (HTMLButtonElement as unknown as VElementBaseSignature2) {
    static element_name = "VButtonElement";
    static element_tag = "button";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VButtonElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VButtonElement extends HTMLButtonElement, VElement, VElementExtensions {};
postprocess(VButtonElement);
export const VButton = wrapper(VButtonElement);
export const NullVButton = create_null(VButtonElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VButtonElement: VButtonElement }}

// Base class VCanvasElement derived from HTMLCanvasElement.
// @ts-ignore
export class VCanvasElement extends (HTMLCanvasElement as unknown as VElementBaseSignature2) {
    static element_name = "VCanvasElement";
    static element_tag = "canvas";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VCanvasElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VCanvasElement extends HTMLCanvasElement, VElement, VElementExtensions {};
postprocess(VCanvasElement);
export const VCanvas = wrapper(VCanvasElement);
export const NullVCanvas = create_null(VCanvasElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VCanvasElement: VCanvasElement }}

// Base class VTableCaptionElement derived from HTMLTableCaptionElement.
// @ts-ignore
export class VTableCaptionElement extends (HTMLTableCaptionElement as unknown as VElementBaseSignature2) {
    static element_name = "VTableCaptionElement";
    static element_tag = "caption";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VTableCaptionElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VTableCaptionElement extends HTMLTableCaptionElement, VElement, VElementExtensions {};
postprocess(VTableCaptionElement);
export const VTableCaption = wrapper(VTableCaptionElement);
export const NullVTableCaption = create_null(VTableCaptionElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VTableCaptionElement: VTableCaptionElement }}

// Base class VTableColElement derived from HTMLTableColElement.
// @ts-ignore
export class VTableColElement extends (HTMLTableColElement as unknown as VElementBaseSignature2) {
    static element_name = "VTableColElement";
    static element_tag = "col";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VTableColElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VTableColElement extends HTMLTableColElement, VElement, VElementExtensions {};
postprocess(VTableColElement);
export const VTableCol = wrapper(VTableColElement);
export const NullVTableCol = create_null(VTableColElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VTableColElement: VTableColElement }}

// Base class VDataElement derived from HTMLDataElement.
// @ts-ignore
export class VDataElement extends (HTMLDataElement as unknown as VElementBaseSignature2) {
    static element_name = "VDataElement";
    static element_tag = "data";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VDataElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VDataElement extends HTMLDataElement, VElement, VElementExtensions {};
postprocess(VDataElement);
export const VData = wrapper(VDataElement);
export const NullVData = create_null(VDataElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VDataElement: VDataElement }}

// Base class VDataListElement derived from HTMLDataListElement.
// @ts-ignore
export class VDataListElement extends (HTMLDataListElement as unknown as VElementBaseSignature2) {
    static element_name = "VDataListElement";
    static element_tag = "datalist";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VDataListElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VDataListElement extends HTMLDataListElement, VElement, VElementExtensions {};
postprocess(VDataListElement);
export const VDataList = wrapper(VDataListElement);
export const NullVDataList = create_null(VDataListElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VDataListElement: VDataListElement }}

// Base class VDListElement derived from HTMLDListElement.
// @ts-ignore
export class VDListElement extends (HTMLDListElement as unknown as VElementBaseSignature2) {
    static element_name = "VDListElement";
    static element_tag = "dl";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VDListElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VDListElement extends HTMLDListElement, VElement, VElementExtensions {};
postprocess(VDListElement);
export const VDList = wrapper(VDListElement);
export const NullVDList = create_null(VDListElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VDListElement: VDListElement }}

// Base class VDirectoryElement derived from HTMLDirectoryElement.
// @ts-ignore
export class VDirectoryElement extends (HTMLDirectoryElement as unknown as VElementBaseSignature2) {
    static element_name = "VDirectoryElement";
    static element_tag = "dir";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VDirectoryElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VDirectoryElement extends HTMLDirectoryElement, VElement, VElementExtensions {};
postprocess(VDirectoryElement);
export const VDirectory = wrapper(VDirectoryElement);
export const NullVDirectory = create_null(VDirectoryElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VDirectoryElement: VDirectoryElement }}

// Base class VDivElement derived from HTMLDivElement.
// @ts-ignore
export class VDivElement extends (HTMLDivElement as unknown as VElementBaseSignature2) {
    static element_name = "VDivElement";
    static element_tag = "div";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VDivElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VDivElement extends HTMLDivElement, VElement, VElementExtensions {};
postprocess(VDivElement);
export const VDiv = wrapper(VDivElement);
export const NullVDiv = create_null(VDivElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VDivElement: VDivElement }}

// Base class VEmbedElement derived from HTMLEmbedElement.
// @ts-ignore
export class VEmbedElement extends (HTMLEmbedElement as unknown as VElementBaseSignature2) {
    static element_name = "VEmbedElement";
    static element_tag = "embed";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VEmbedElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VEmbedElement extends HTMLEmbedElement, VElement, VElementExtensions {};
postprocess(VEmbedElement);
export const VEmbed = wrapper(VEmbedElement);
export const NullVEmbed = create_null(VEmbedElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VEmbedElement: VEmbedElement }}

// Base class VFieldSetElement derived from HTMLFieldSetElement.
// @ts-ignore
export class VFieldSetElement extends (HTMLFieldSetElement as unknown as VElementBaseSignature2) {
    static element_name = "VFieldSetElement";
    static element_tag = "fieldset";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VFieldSetElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VFieldSetElement extends HTMLFieldSetElement, VElement, VElementExtensions {};
postprocess(VFieldSetElement);
export const VFieldSet = wrapper(VFieldSetElement);
export const NullVFieldSet = create_null(VFieldSetElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VFieldSetElement: VFieldSetElement }}

// Base class VFormElement derived from HTMLFormElement.
// @ts-ignore
export class VFormElement extends (HTMLFormElement as unknown as VElementBaseSignature2) {
    static element_name = "VFormElement";
    static element_tag = "form";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VFormElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VFormElement extends HTMLFormElement, VElement, VElementExtensions {};
postprocess(VFormElement);
export const VForm = wrapper(VFormElement);
export const NullVForm = create_null(VFormElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VFormElement: VFormElement }}

// Base class VHeadingElement derived from HTMLHeadingElement.
// @ts-ignore
export class VHeadingElement extends (HTMLHeadingElement as unknown as VElementBaseSignature2) {
    static element_name = "VHeadingElement";
    static element_tag = "h1";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VHeadingElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VHeadingElement extends HTMLHeadingElement, VElement, VElementExtensions {};
postprocess(VHeadingElement);
export const VHeading = wrapper(VHeadingElement);
export const NullVHeading = create_null(VHeadingElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VHeadingElement: VHeadingElement }}

// Base class VHeadElement derived from HTMLHeadElement.
// @ts-ignore
export class VHeadElement extends (HTMLHeadElement as unknown as VElementBaseSignature2) {
    static element_name = "VHeadElement";
    static element_tag = "head";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VHeadElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VHeadElement extends HTMLHeadElement, VElement, VElementExtensions {};
postprocess(VHeadElement);
export const VHead = wrapper(VHeadElement);
export const NullVHead = create_null(VHeadElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VHeadElement: VHeadElement }}

// Base class VHRElement derived from HTMLHRElement.
// @ts-ignore
export class VHRElement extends (HTMLHRElement as unknown as VElementBaseSignature2) {
    static element_name = "VHRElement";
    static element_tag = "hr";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VHRElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VHRElement extends HTMLHRElement, VElement, VElementExtensions {};
postprocess(VHRElement);
export const VHR = wrapper(VHRElement);
export const NullVHR = create_null(VHRElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VHRElement: VHRElement }}

// Base class VImageElement derived from HTMLImageElement.
// @ts-ignore
export class VImageElement extends (HTMLImageElement as unknown as VElementBaseSignature2) {
    static element_name = "VImageElement";
    static element_tag = "img";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VImageElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VImageElement extends HTMLImageElement, VElement, VElementExtensions {};
postprocess(VImageElement);
export const VImage = wrapper(VImageElement);
export const NullVImage = create_null(VImageElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VImageElement: VImageElement }}

// Base class VInputElement derived from HTMLInputElement.
// @ts-ignore
export class VInputElement extends (HTMLInputElement as unknown as VElementBaseSignature2) {
    static element_name = "VInputElement";
    static element_tag = "input";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VInputElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VInputElement extends HTMLInputElement, VElement, VElementExtensions {};
postprocess(VInputElement);
export const VInput = wrapper(VInputElement);
export const NullVInput = create_null(VInputElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VInputElement: VInputElement }}

// Base class VModElement derived from HTMLModElement.
// @ts-ignore
export class VModElement extends (HTMLModElement as unknown as VElementBaseSignature2) {
    static element_name = "VModElement";
    static element_tag = "ins";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VModElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VModElement extends HTMLModElement, VElement, VElementExtensions {};
postprocess(VModElement);
export const VMod = wrapper(VModElement);
export const NullVMod = create_null(VModElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VModElement: VModElement }}

// Base class VLabelElement derived from HTMLLabelElement.
// @ts-ignore
export class VLabelElement extends (HTMLLabelElement as unknown as VElementBaseSignature2) {
    static element_name = "VLabelElement";
    static element_tag = "label";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VLabelElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VLabelElement extends HTMLLabelElement, VElement, VElementExtensions {};
postprocess(VLabelElement);
export const VLabel = wrapper(VLabelElement);
export const NullVLabel = create_null(VLabelElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VLabelElement: VLabelElement }}

// Base class VLegendElement derived from HTMLLegendElement.
// @ts-ignore
export class VLegendElement extends (HTMLLegendElement as unknown as VElementBaseSignature2) {
    static element_name = "VLegendElement";
    static element_tag = "legend";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VLegendElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VLegendElement extends HTMLLegendElement, VElement, VElementExtensions {};
postprocess(VLegendElement);
export const VLegend = wrapper(VLegendElement);
export const NullVLegend = create_null(VLegendElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VLegendElement: VLegendElement }}

// Base class VLIElement derived from HTMLLIElement.
// @ts-ignore
export class VLIElement extends (HTMLLIElement as unknown as VElementBaseSignature2) {
    static element_name = "VLIElement";
    static element_tag = "li";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VLIElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VLIElement extends HTMLLIElement, VElement, VElementExtensions {};
postprocess(VLIElement);
export const VLI = wrapper(VLIElement);
export const NullVLI = create_null(VLIElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VLIElement: VLIElement }}

// Base class VLinkElement derived from HTMLLinkElement.
// @ts-ignore
export class VLinkElement extends (HTMLLinkElement as unknown as VElementBaseSignature2) {
    static element_name = "VLinkElement";
    static element_tag = "link";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VLinkElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VLinkElement extends HTMLLinkElement, VElement, VElementExtensions {};
postprocess(VLinkElement);
export const VLink = wrapper(VLinkElement);
export const NullVLink = create_null(VLinkElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VLinkElement: VLinkElement }}

// Base class VMapElement derived from HTMLMapElement.
// @ts-ignore
export class VMapElement extends (HTMLMapElement as unknown as VElementBaseSignature2) {
    static element_name = "VMapElement";
    static element_tag = "map";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VMapElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VMapElement extends HTMLMapElement, VElement, VElementExtensions {};
postprocess(VMapElement);
export const VMap = wrapper(VMapElement);
export const NullVMap = create_null(VMapElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VMapElement: VMapElement }}

// Base class VMetaElement derived from HTMLMetaElement.
// @ts-ignore
export class VMetaElement extends (HTMLMetaElement as unknown as VElementBaseSignature2) {
    static element_name = "VMetaElement";
    static element_tag = "meta";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VMetaElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VMetaElement extends HTMLMetaElement, VElement, VElementExtensions {};
postprocess(VMetaElement);
export const VMeta = wrapper(VMetaElement);
export const NullVMeta = create_null(VMetaElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VMetaElement: VMetaElement }}

// Base class VMeterElement derived from HTMLMeterElement.
// @ts-ignore
export class VMeterElement extends (HTMLMeterElement as unknown as VElementBaseSignature2) {
    static element_name = "VMeterElement";
    static element_tag = "meter";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VMeterElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VMeterElement extends HTMLMeterElement, VElement, VElementExtensions {};
postprocess(VMeterElement);
export const VMeter = wrapper(VMeterElement);
export const NullVMeter = create_null(VMeterElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VMeterElement: VMeterElement }}

// Base class VObjectElement derived from HTMLObjectElement.
// @ts-ignore
export class VObjectElement extends (HTMLObjectElement as unknown as VElementBaseSignature2) {
    static element_name = "VObjectElement";
    static element_tag = "object";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VObjectElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VObjectElement extends HTMLObjectElement, VElement, VElementExtensions {};
postprocess(VObjectElement);
export const VObject = wrapper(VObjectElement);
export const NullVObject = create_null(VObjectElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VObjectElement: VObjectElement }}

// Base class VOListElement derived from HTMLOListElement.
// @ts-ignore
export class VOListElement extends (HTMLOListElement as unknown as VElementBaseSignature2) {
    static element_name = "VOListElement";
    static element_tag = "ol";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VOListElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VOListElement extends HTMLOListElement, VElement, VElementExtensions {};
postprocess(VOListElement);
export const VOList = wrapper(VOListElement);
export const NullVOList = create_null(VOListElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VOListElement: VOListElement }}

// Base class VOptGroupElement derived from HTMLOptGroupElement.
// @ts-ignore
export class VOptGroupElement extends (HTMLOptGroupElement as unknown as VElementBaseSignature2) {
    static element_name = "VOptGroupElement";
    static element_tag = "optgroup";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VOptGroupElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VOptGroupElement extends HTMLOptGroupElement, VElement, VElementExtensions {};
postprocess(VOptGroupElement);
export const VOptGroup = wrapper(VOptGroupElement);
export const NullVOptGroup = create_null(VOptGroupElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VOptGroupElement: VOptGroupElement }}

// Base class VOptionElement derived from HTMLOptionElement.
// @ts-ignore
export class VOptionElement extends (HTMLOptionElement as unknown as VElementBaseSignature2) {
    static element_name = "VOptionElement";
    static element_tag = "option";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VOptionElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VOptionElement extends HTMLOptionElement, VElement, VElementExtensions {};
postprocess(VOptionElement);
export const VOption = wrapper(VOptionElement);
export const NullVOption = create_null(VOptionElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VOptionElement: VOptionElement }}

// Base class VOutputElement derived from HTMLOutputElement.
// @ts-ignore
export class VOutputElement extends (HTMLOutputElement as unknown as VElementBaseSignature2) {
    static element_name = "VOutputElement";
    static element_tag = "output";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VOutputElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VOutputElement extends HTMLOutputElement, VElement, VElementExtensions {};
postprocess(VOutputElement);
export const VOutput = wrapper(VOutputElement);
export const NullVOutput = create_null(VOutputElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VOutputElement: VOutputElement }}

// Base class VParagraphElement derived from HTMLParagraphElement.
// @ts-ignore
export class VParagraphElement extends (HTMLParagraphElement as unknown as VElementBaseSignature2) {
    static element_name = "VParagraphElement";
    static element_tag = "p";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VParagraphElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VParagraphElement extends HTMLParagraphElement, VElement, VElementExtensions {};
postprocess(VParagraphElement);
export const VParagraph = wrapper(VParagraphElement);
export const NullVParagraph = create_null(VParagraphElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VParagraphElement: VParagraphElement }}

// Base class VParamElement derived from HTMLParamElement.
// @ts-ignore
export class VParamElement extends (HTMLParamElement as unknown as VElementBaseSignature2) {
    static element_name = "VParamElement";
    static element_tag = "param";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VParamElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VParamElement extends HTMLParamElement, VElement, VElementExtensions {};
postprocess(VParamElement);
export const VParam = wrapper(VParamElement);
export const NullVParam = create_null(VParamElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VParamElement: VParamElement }}

// Base class VPictureElement derived from HTMLPictureElement.
// @ts-ignore
export class VPictureElement extends (HTMLPictureElement as unknown as VElementBaseSignature2) {
    static element_name = "VPictureElement";
    static element_tag = "picture";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VPictureElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VPictureElement extends HTMLPictureElement, VElement, VElementExtensions {};
postprocess(VPictureElement);
export const VPicture = wrapper(VPictureElement);
export const NullVPicture = create_null(VPictureElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VPictureElement: VPictureElement }}

// Base class VPreElement derived from HTMLPreElement.
// @ts-ignore
export class VPreElement extends (HTMLPreElement as unknown as VElementBaseSignature2) {
    static element_name = "VPreElement";
    static element_tag = "pre";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VPreElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VPreElement extends HTMLPreElement, VElement, VElementExtensions {};
postprocess(VPreElement);
export const VPre = wrapper(VPreElement);
export const NullVPre = create_null(VPreElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VPreElement: VPreElement }}

// Base class VProgressElement derived from HTMLProgressElement.
// @ts-ignore
export class VProgressElement extends (HTMLProgressElement as unknown as VElementBaseSignature2) {
    static element_name = "VProgressElement";
    static element_tag = "progress";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VProgressElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VProgressElement extends HTMLProgressElement, VElement, VElementExtensions {};
postprocess(VProgressElement);
export const VProgress = wrapper(VProgressElement);
export const NullVProgress = create_null(VProgressElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VProgressElement: VProgressElement }}

// Base class VScriptElement derived from HTMLScriptElement.
// @ts-ignore
export class VScriptElement extends (HTMLScriptElement as unknown as VElementBaseSignature2) {
    static element_name = "VScriptElement";
    static element_tag = "script";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VScriptElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VScriptElement extends HTMLScriptElement, VElement, VElementExtensions {};
postprocess(VScriptElement);
export const VScript = wrapper(VScriptElement);
export const NullVScript = create_null(VScriptElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VScriptElement: VScriptElement }}

// Base class VSelectElement derived from HTMLSelectElement.
// @ts-ignore
export class VSelectElement extends (HTMLSelectElement as unknown as VElementBaseSignature2) {
    static element_name = "VSelectElement";
    static element_tag = "select";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VSelectElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VSelectElement extends HTMLSelectElement, VElement, VElementExtensions {};
postprocess(VSelectElement);
export const VSelect = wrapper(VSelectElement);
export const NullVSelect = create_null(VSelectElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VSelectElement: VSelectElement }}

// Base class VSlotElement derived from HTMLSlotElement.
// @ts-ignore
export class VSlotElement extends (HTMLSlotElement as unknown as VElementBaseSignature2) {
    static element_name = "VSlotElement";
    static element_tag = "slot";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VSlotElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VSlotElement extends HTMLSlotElement, VElement, VElementExtensions {};
postprocess(VSlotElement);
export const VSlot = wrapper(VSlotElement);
export const NullVSlot = create_null(VSlotElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VSlotElement: VSlotElement }}

// Base class VSourceElement derived from HTMLSourceElement.
// @ts-ignore
export class VSourceElement extends (HTMLSourceElement as unknown as VElementBaseSignature2) {
    static element_name = "VSourceElement";
    static element_tag = "source";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VSourceElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VSourceElement extends HTMLSourceElement, VElement, VElementExtensions {};
postprocess(VSourceElement);
export const VSource = wrapper(VSourceElement);
export const NullVSource = create_null(VSourceElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VSourceElement: VSourceElement }}

// Base class VSpanElement derived from HTMLSpanElement.
// @ts-ignore
export class VSpanElement extends (HTMLSpanElement as unknown as VElementBaseSignature2) {
    static element_name = "VSpanElement";
    static element_tag = "span";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VSpanElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VSpanElement extends HTMLSpanElement, VElement, VElementExtensions {};
postprocess(VSpanElement);
export const VSpan = wrapper(VSpanElement);
export const NullVSpan = create_null(VSpanElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VSpanElement: VSpanElement }}

// Base class VTableElement derived from HTMLTableElement.
// @ts-ignore
export class VTableElement extends (HTMLTableElement as unknown as VElementBaseSignature2) {
    static element_name = "VTableElement";
    static element_tag = "table";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VTableElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VTableElement extends HTMLTableElement, VElement, VElementExtensions {};
postprocess(VTableElement);
export const VTable = wrapper(VTableElement);
export const NullVTable = create_null(VTableElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VTableElement: VTableElement }}

// Base class VTHeadElement derived from HTMLTableSectionElement.
// @ts-ignore
export class VTHeadElement extends (HTMLTableSectionElement as unknown as VElementBaseSignature2) {
    static element_name = "VTHeadElement";
    static element_tag = "thead";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VTHeadElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VTHeadElement extends HTMLTableSectionElement, VElement, VElementExtensions {};
postprocess(VTHeadElement);
export const VTHead = wrapper(VTHeadElement);
export const NullVTHead = create_null(VTHeadElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VTHeadElement: VTHeadElement }}

// Base class VTBodyElement derived from HTMLTableSectionElement.
// @ts-ignore
export class VTBodyElement extends (HTMLTableSectionElement as unknown as VElementBaseSignature2) {
    static element_name = "VTBodyElement";
    static element_tag = "tbody";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VTBodyElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VTBodyElement extends HTMLTableSectionElement, VElement, VElementExtensions {};
postprocess(VTBodyElement);
export const VTBody = wrapper(VTBodyElement);
export const NullVTBody = create_null(VTBodyElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VTBodyElement: VTBodyElement }}

// Base class VTFootElement derived from HTMLTableSectionElement.
// @ts-ignore
export class VTFootElement extends (HTMLTableSectionElement as unknown as VElementBaseSignature2) {
    static element_name = "VTFootElement";
    static element_tag = "tfoot";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VTFootElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VTFootElement extends HTMLTableSectionElement, VElement, VElementExtensions {};
postprocess(VTFootElement);
export const VTFoot = wrapper(VTFootElement);
export const NullVTFoot = create_null(VTFootElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VTFootElement: VTFootElement }}

// Base class VTHElement derived from HTMLTableCellElement.
// @ts-ignore
export class VTHElement extends (HTMLTableCellElement as unknown as VElementBaseSignature2) {
    static element_name = "VTHElement";
    static element_tag = "th";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VTHElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VTHElement extends HTMLTableCellElement, VElement, VElementExtensions {};
postprocess(VTHElement);
export const VTH = wrapper(VTHElement);
export const NullVTH = create_null(VTHElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VTHElement: VTHElement }}

// Base class VTDElement derived from HTMLTableCellElement.
// @ts-ignore
export class VTDElement extends (HTMLTableCellElement as unknown as VElementBaseSignature2) {
    static element_name = "VTDElement";
    static element_tag = "td";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VTDElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VTDElement extends HTMLTableCellElement, VElement, VElementExtensions {};
postprocess(VTDElement);
export const VTD = wrapper(VTDElement);
export const NullVTD = create_null(VTDElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VTDElement: VTDElement }}

// Base class VTemplateElement derived from HTMLTemplateElement.
// @ts-ignore
export class VTemplateElement extends (HTMLTemplateElement as unknown as VElementBaseSignature2) {
    static element_name = "VTemplateElement";
    static element_tag = "template";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VTemplateElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VTemplateElement extends HTMLTemplateElement, VElement, VElementExtensions {};
postprocess(VTemplateElement);
export const VTemplate = wrapper(VTemplateElement);
export const NullVTemplate = create_null(VTemplateElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VTemplateElement: VTemplateElement }}

// Base class VTextAreaElement derived from HTMLTextAreaElement.
// @ts-ignore
export class VTextAreaElement extends (HTMLTextAreaElement as unknown as VElementBaseSignature2) {
    static element_name = "VTextAreaElement";
    static element_tag = "textarea";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VTextAreaElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VTextAreaElement extends HTMLTextAreaElement, VElement, VElementExtensions {};
postprocess(VTextAreaElement);
export const VTextArea = wrapper(VTextAreaElement);
export const NullVTextArea = create_null(VTextAreaElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VTextAreaElement: VTextAreaElement }}

// Base class VTimeElement derived from HTMLTimeElement.
// @ts-ignore
export class VTimeElement extends (HTMLTimeElement as unknown as VElementBaseSignature2) {
    static element_name = "VTimeElement";
    static element_tag = "time";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VTimeElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VTimeElement extends HTMLTimeElement, VElement, VElementExtensions {};
postprocess(VTimeElement);
export const VTime = wrapper(VTimeElement);
export const NullVTime = create_null(VTimeElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VTimeElement: VTimeElement }}

// Base class VTitleElement derived from HTMLTitleElement.
// @ts-ignore
export class VTitleElement extends (HTMLTitleElement as unknown as VElementBaseSignature2) {
    static element_name = "VTitleElement";
    static element_tag = "title";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VTitleElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VTitleElement extends HTMLTitleElement, VElement, VElementExtensions {};
postprocess(VTitleElement);
export const VTitle = wrapper(VTitleElement);
export const NullVTitle = create_null(VTitleElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VTitleElement: VTitleElement }}

// Base class VTableRowElement derived from HTMLTableRowElement.
// @ts-ignore
export class VTableRowElement extends (HTMLTableRowElement as unknown as VElementBaseSignature2) {
    static element_name = "VTableRowElement";
    static element_tag = "tr";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VTableRowElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VTableRowElement extends HTMLTableRowElement, VElement, VElementExtensions {};
postprocess(VTableRowElement);
export const VTableRow = wrapper(VTableRowElement);
export const NullVTableRow = create_null(VTableRowElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VTableRowElement: VTableRowElement }}

// Base class VTrackElement derived from HTMLTrackElement.
// @ts-ignore
export class VTrackElement extends (HTMLTrackElement as unknown as VElementBaseSignature2) {
    static element_name = "VTrackElement";
    static element_tag = "track";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VTrackElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VTrackElement extends HTMLTrackElement, VElement, VElementExtensions {};
postprocess(VTrackElement);
export const VTrack = wrapper(VTrackElement);
export const NullVTrack = create_null(VTrackElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VTrackElement: VTrackElement }}

// Base class VUListElement derived from HTMLUListElement.
// @ts-ignore
export class VUListElement extends (HTMLUListElement as unknown as VElementBaseSignature2) {
    static element_name = "VUListElement";
    static element_tag = "ul";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VUListElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VUListElement extends HTMLUListElement, VElement, VElementExtensions {};
postprocess(VUListElement);
export const VUList = wrapper(VUListElement);
export const NullVUList = create_null(VUListElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VUListElement: VUListElement }}

// Base class VIFrameElement derived from HTMLIFrameElement.
// @ts-ignore
export class VIFrameElement extends (HTMLIFrameElement as unknown as VElementBaseSignature2) {
    static element_name = "VIFrameElement";
    static element_tag = "iframe";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VIFrameElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VIFrameElement extends HTMLIFrameElement, VElement, VElementExtensions {};
postprocess(VIFrameElement);
export const VIFrame = wrapper(VIFrameElement);
export const NullVIFrame = create_null(VIFrameElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VIFrameElement: VIFrameElement }}

// Base class VCodeElement derived from HTMLElement.
// @ts-ignore
export class VCodeElement extends (HTMLElement as unknown as VElementBaseSignature2) {
    static element_name = "VCodeElement";
    static element_tag = "code";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VCodeElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VCodeElement extends HTMLElement, VElement, VElementExtensions {};
postprocess(VCodeElement);
export const VCode = wrapper(VCodeElement);
export const NullVCode = create_null(VCodeElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VCodeElement: VCodeElement }}

// Base class VSectionElement derived from HTMLElement.
// @ts-ignore
export class VSectionElement extends (HTMLElement as unknown as VElementBaseSignature2) {
    static element_name = "VSectionElement";
    static element_tag = "section";
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VSectionElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
}
// @ts-ignore
// export interface VSectionElement extends HTMLElement, VElement, VElementExtensions {};
postprocess(VSectionElement);
export const VSection = wrapper(VSectionElement);
export const NullVSection = create_null(VSectionElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VSectionElement: VSectionElement }}

// Base class VDefaultElement derived from HTMLElement.
// @ts-ignore
// export class VDefaultElement extends (HTMLElement as unknown as VElementBaseSignature2) {
//     static element_tag = "default";
//     constructor(args: DerivedConstructorOptions = {}) {
//         super();
//         args.derived ??= VDefaultElement;
//         this._init_velement(args as VBaseElementOptions);
//     }
// }
// // @ts-ignore
// // export interface VDefaultElement extends HTMLElement, VElement, VElementExtensions {};
// postprocess(VDefaultElement);
// export const VDefault = wrapper(VDefaultElement);
// export const NullVDefault = create_null(VDefaultElement);
// declare module '../ui/any_element.d.ts' { interface AnyElementMap { VDefaultElement: VDefaultElement }}

// All base elements.
export type VBaseElements =
    VHTMLElement |
    VAnchorElement |
    VAreaElement |
    VAudioElement |
    VBlockQuoteElement |
    VBodyElement |
    VBRElement |
    VButtonElement |
    VCanvasElement |
    VTableCaptionElement |
    VTableColElement |
    VDataElement |
    VDataListElement |
    VDListElement |
    VDirectoryElement |
    VDivElement |
    VEmbedElement |
    VFieldSetElement |
    VFormElement |
    VHeadingElement |
    VHeadElement |
    VHRElement |
    VImageElement |
    VInputElement |
    VModElement |
    VLabelElement |
    VLegendElement |
    VLIElement |
    VLinkElement |
    VMapElement |
    VMetaElement |
    VMeterElement |
    VObjectElement |
    VOListElement |
    VOptGroupElement |
    VOptionElement |
    VOutputElement |
    VParagraphElement |
    VParamElement |
    VPictureElement |
    VPreElement |
    VProgressElement |
    VScriptElement |
    VSelectElement |
    VSlotElement |
    VSourceElement |
    VSpanElement |
    VTableElement |
    VTHeadElement |
    VTBodyElement |
    VTFootElement |
    VTHElement |
    VTDElement |
    VTemplateElement |
    VTextAreaElement |
    VTimeElement |
    VTitleElement |
    VTableRowElement |
    VTrackElement |
    VUListElement |
    VIFrameElement |
    VCodeElement |
    VSectionElement;

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
} as const;