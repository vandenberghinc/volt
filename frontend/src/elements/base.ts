/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved.
 */

// Import vlib.
import * as vlib from "@vandenberghinc/vlib/frontend"

import { Utils } from "../modules/utils.js"
import { Events } from "../modules/events.js"
import { Themes } from "../modules/themes.js"
import { GradientType } from "../types/gradient.js"
import { Statics  } from "../modules/statics.js"

import type { AnyElement } from "../ui/any_element.js"
import { register_element } from "./register_element.js";
import type { PseudoElement } from "../ui/pseudo.js"

import type { None, ValueOrThis, BorderOpts } from "./types.js"
import { Attachment } from "../modules/attachment.js"

// Vars.
const elements_with_width_attribute = new Set<String>([ // elements that use the "width" etc attribute instead of the "style.width".
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
const on_render_observer = new ResizeObserver(
    (entries, observer) => {
        entries.forEach(entry => {
            const target = entry.target as any
            if (!target.rendered) {
                target._on_render_callbacks.walk((func) => { func(entry.target) });
                target.rendered = true;
                on_render_observer.unobserve(entry.target);
            }
        });
    },
);

/** Create the on resize observer for VElement. */
const on_resize_observer = new ResizeObserver(
    (entries, observer) => {
        entries.forEach(entry => {
            (entry.target as any)._on_resize_callbacks.walk((func) => { func(entry.target) });
        });
    },
);


// ------------------------------------------------------------------------------------------------
// The base VElement.

// The VElement user defined extensions.
declare global {
    export interface VElementExtensions {}
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
// const element_checked_descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'checked');// instead of getAttribute("checked")
// const element_disabled_descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'disabled');// instead of getAttribute("disabled")
// const element_selected_descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'selected');// for <option> elements
// const element_href_descriptor = Object.getOwnPropertyDescriptor(HTMLAnchorElement.prototype, 'href');// gives full URL instead of getAttribute("href") which might be relative
// const element_src_descriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');// gives full URL
// const element_id_descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'id');// instead of getAttribute("id")
// const element_value_descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');

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
/**
 * {Base element}
 * The base element of the volt frontend elements.
 * @nav FrontendVElement/Elements
 * @docs
 */
export abstract class VElement extends HTMLElement {

    // ---------------------------------------------------------
    // Static attributes.

    static element_tag: string = ""; // must also be static.
    static default_style: Record<string, any> = {};
    static default_attributes: Record<string, any> = {};
    static default_events: Record<string, any> = {};

    // ---------------------------------------------------------
    // Public attributes.
    // @warning do not use default values since they will be put inside the constructor, which should remain empty, define them in _init_velement() instead.

    /** Attachments added by the {@link on_attachment_drop} callback. */
    attachments!: Attachment[];

    /** Is rendered flag. */
    rendered!: boolean;

    /** The element name. */
    element_name!: string;

    /** The base element name @internal */
    base_element_name!: string;

    /** Remove focus method. */
    remove_focus!: HTMLElement["blur"];

    // ---------------------------------------------------------
    // Public but internal attributes.
    // @warning do not use default values since they will be put inside the constructor, which should remain empty, define them in _init_velement() instead.

    public __is_velement: boolean = true;

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
    protected _init_sys_velement(args: BaseVElementInitOptions) {  

        // Errs.
        if (!args.derived || !args.derived.element_name) {
            throw new Error("Static element attribute 'args.derived.element_name' should always be defined, create static attribute \"element_name: string\" and assign the name of the class to this attribute.")
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
    /**
     * @warning Any VElement (a derived class of VElementTagMap) must call this method in its constructor.
     */
    protected _init(args: BaseVElementInitOptions) {

        // Set name.
        if (!args.derived || !args.derived.element_name) {
            throw new Error("Static element attribute 'args.derived.element_name' should always be defined, create static attribute \"element_name: string\" and assign the name of the class to this attribute.")
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
     * {Clone}
     * Creates a deep copy of the current element, including its styles and attributes.
     * Optionally clones child nodes based on the provided parameter.
     * @parameter clone_children Indicates whether to clone child nodes of the current element.
     * @returns Returns a new instance of the element that is a clone of the current one.
     * @docs
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
     * {Pad Numeric}
     * Pads a numeric value with a specified padding unit, defaulting to "px".
     * @parameter value The numeric value to be padded.
     * @parameter padding The unit to pad the numeric value with.
     * @returns Returns the padded value as a string.
     * @docs
     */
    pad_numeric(value: None | number | string, padding: string = "px"): string {
        if (value == null) {
            return "";
        }
        if (typeof value !== "string") {
            return value + padding;
        }
        return value as unknown as string;
    }

    /**
     * {Pad Percentage}
     * Pads a numeric value with a percentage symbol. If the value is a float between 0 and 1, it is multiplied by 100 before padding.
     * @parameter value The numeric value to pad.
     * @parameter padding The string to pad the numeric value with, defaults to "%".
     * @returns Returns the padded percentage as a string, or the original value if it is not numeric.
     * @docs
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
     * {Edit Filter Wrapper}
     * Edits a filter string by replacing or removing specified types.
     * Can also append a new type if it doesn’t exist in the filter.
     * @parameter filter The original filter string that needs to be edited.
     * @parameter type The type that will be targeted for replacement or removal.
     * @parameter to The new value to replace the existing type with, or null to remove it.
     * @returns Returns the modified filter string or null if the input filter was null.
     * @docs
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
     * {Toggle Filter Wrapper}
     * Toggles a specified filter type in a string. If the type is present, it will be removed; otherwise, it will be added.
     * @parameter filter The filter string to modify.
     * @parameter type The type of filter to toggle.
     * @parameter to The value to add if the type is not present.
     * @returns Returns the modified filter string or null if the input filter was null.
     * @docs
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
     * {Append Child Elements}
     * Appends child elements to the current element. Can accept multiple child elements, including HTML nodes, functions, or strings.
     * @parameter children The child elements to append, which can be an array of elements, a single element, or a function.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {ZStack Append}
     * Appends multiple children to the ZStack element. This method can handle various types of children such as elements, functions, and text.
     * @parameter children The children to append, which can be elements, arrays, text, or functions returning elements.
     * @returns Returns the instance of the ZStack element for chaining.
     * @docs
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
     * {Append To Parent}
     * Appends the current element to a specified parent element and manages parent-child relationships.
     * @parameter parent The parent element to which the current element will be appended.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Append Children to Parent}
     * Appends the children of the current element to the specified parent element and executes a callback for each appended child.
     * @parameter parent The parent element to which the children will be appended.
     * @parameter on_append_callback A callback function that is executed for each child when it is appended.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Remove Child}
     * Removes a child element from the current element. The child can be specified
     * by passing a Node, an VElement, or an id string of the element to be removed.
     * @parameter child The child to be removed from the current element.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Remove Children}
     * Removes all child elements from the current element without using innerHTML.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    remove_children(): this {
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
    child(index: number): any {
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
     * {Text}
     * Set or get the text content of the element. If no value is provided, it retrieves the current text content.
     * @parameter value The text content to set or retrieve.
     * @returns Returns the current text content if no argument is passed, otherwise returns the instance of the element for chaining.
     * @docs
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
     * {Width}
     * Specify the width or height of the element. Returns the offset width or height when the param value is null.
     * @parameter value The width value to set or get.
     * @parameter check_attribute Indicates whether to check the element's width attribute.
     * @returns Returns the offset width when no value is provided, otherwise returns the instance of the element for chaining.
     * @docs
     */
    // @ts-ignore
    width(): string | number;
    // @ts-ignore
    width(value: string | number, check_attribute?: boolean): this;
    // @ts-ignore
    width(value?: string | number, check_attribute: boolean = true): string | number | this {
        if (check_attribute && elements_with_width_attribute.has((this.constructor.toString() as any).element_tag)) {
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
     * {Fixed Width}
     * Sets the fixed width for the element and updates min and max widths accordingly.
     * @parameter value The value to set for the width, can be a number or null to get the current width.
     * @returns If no argument is passed, returns the current width as a number. If an argument is passed, returns the instance of the element for chaining.
     * @docs
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
     * {Height}
     * Sets or retrieves the height of the element. It checks for attributes and styles based on the provided parameters.
     * @parameter value The value to set for height or retrieve the current height if null.
     * @parameter check_attribute Determines if the element's attribute should be checked.
     * @returns Returns the instance of the element for chaining when an argument is passed, otherwise returns the current height as a number.
     * @docs
     */
    // @ts-ignore
    height(): string | number;
    // @ts-ignore
    height(value: string | number, check_attribute?: boolean): this;
    // @ts-ignore
    height(value?: string | number, check_attribute?: boolean): this | string | number {
        if (check_attribute && elements_with_width_attribute.has((this.constructor.toString() as any).element_tag)) {
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
     * {Fixed Height}
     * Sets the fixed height for the element or retrieves the current height if no value is provided.
     * @parameter value The height value to set, which can be a number or null.
     * @returns When an argument is passed, this function returns the instance of the element for chaining. Otherwise, it returns the parsed float value of the current height.
     * @docs
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
     * {Min height}
     * Sets the minimum height of an element. The equivalent of CSS attribute `minHeight`.
     * Returns the attribute value when parameter `value` is `null`.
     * @parameter value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    min_height(): string | number;
    min_height(value: string | number): this;
    min_height(value?: string | number): this | string | number {
        if (value == null) { return this._try_parse_float(this.style.minHeight); }
        this.style.minHeight = this.pad_numeric(value);
        return this;
    }

    /**
     * {Min Width}
     * Sets the minimum width of an element. The equivalent of CSS attribute `minWidth`.
     * Returns the attribute value when parameter `value` is `null`.
     * @parameter value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    min_width(): string | number;
    min_width(value: string | number): this;
    min_width(value?: string | number | null): this | string | number {
        if (value == null) { return this._try_parse_float(this.style.minWidth); }
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
     * {Offset Width}
     * Retrieves the offset width of the element.
     * @returns Returns the offset width of the element.
     * @docs
     */
    offset_width(): number {
        return this.offsetWidth;
    }

    /**
     * {Offset Height}
     * Retrieves the height of the element's offset.
     * @returns Returns the height of the element including padding and border.
     * @docs
     */
    offset_height(): number {
        return this.offsetHeight;
    }

    /**
     * {Client Width}
     * Retrieves the client width of the element.
     * @returns Returns the client width of the element.
     * @docs
     */
    client_width(): number {
        return this.clientWidth;
    }

    /**
     * {Client Height}
     * Retrieves the height of the client area of the element.
     * @returns Returns the height of the client area in pixels.
     * @docs
     */
    client_height(): number {
        return this.clientHeight;
    }

    /**
     * {X Offset}
     * Retrieves the x offset of the element from its parent.
     * @returns Returns the x offset value of the element.
     * @docs
     */
    // @ts-ignore
    x(): number {
        return this.offsetLeft;
    }

    /**
     * {Y Offset}
     * Retrieves the vertical offset of the element from the top of the document.
     * @returns Returns the vertical offset value.
     * @docs
     */
    // @ts-ignore
    y(): number {
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
     * {Min Frame}
     * Sets the minimum width and height for the frame. If parameters are provided, it updates the respective properties.
     * @parameter width The minimum width to set for the frame.
     * @parameter height The minimum height to set for the frame.
     * @returns Returns the instance of the frame for chaining.
     * @docs
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
     * {Max Frame}
     * Sets the maximum width and height for the frame. If a value is provided, it updates the respective maximum dimension.
     * @parameter width The maximum width to set for the frame.
     * @parameter height The maximum height to set for the frame.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Fixed Frame}
     * Sets the width and height of the element, applying padding to the values if provided.
     * @parameter width The width to set for the element. Can be a number or null.
     * @parameter height The height to set for the element. Can be a number or null.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Get Frame While Hidden}
     * Retrieves the dimensions of the element as it would appear if it were not hidden.
     * @returns Returns an object containing the width and height of the element.
     * @docs
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
     * {Padding}
     * Sets the padding of the element based on the number of provided arguments.
     * It can accept 1, 2, or 4 values to set padding for different sides.
     * @parameter values The padding values to set. Can be a single value, two values for vertical and horizontal,
     *                   or four values for top, right, bottom, and left.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Padding Bottom}
     * Sets the bottom padding of an element. The equivalent of CSS attribute `paddingBottom`.
     * Returns the attribute value when parameter `value` is `null`.
     * @parameter value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    padding_bottom(): number;
    padding_bottom(value: string | number): this;
    padding_bottom(value?: string | number): this | number {
        if (value == null) { return this._try_parse_float(this.style.paddingBottom, 0); }
        this.style.paddingBottom = this.pad_numeric(value);
        return this;
    }

    /**
     * {Padding Left}
     * Sets the left padding of an element. The equivalent of CSS attribute `paddingLeft`.
     * Returns the attribute value when parameter `value` is `null`.
     * @parameter value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    padding_left(): number;
    padding_left(value: string | number): this;
    padding_left(value?: string | number): this | number {
        if (value == null) { return this._try_parse_float(this.style.paddingLeft, 0); }
        this.style.paddingLeft = this.pad_numeric(value);
        return this;
    }

    /**
     * {Padding Right}
     * Sets the right padding of an element, equivalent to the CSS attribute `paddingRight`.
     * Returns the attribute value when parameter `value` is `null`.
     * @parameter value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining, unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    padding_right(): number;
    padding_right(value: string | number): this;
    padding_right(value?: string | number): this | number {
        if (value == null) { return this._try_parse_float(this.style.paddingRight, 0); }
        this.style.paddingRight = this.pad_numeric(value);
        return this;
    }

    /**
     * {Padding Top}
     * Sets the top padding of an element. The equivalent of CSS attribute `paddingTop`.
     * Returns the attribute value when parameter `value` is `null`.
     * @parameter value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    padding_top(): number;
    padding_top(value: string | number): this;
    padding_top(value?: string | number): this | number {
        if (value == null) { return this._try_parse_float(this.style.paddingTop, 0); }
        this.style.paddingTop = this.pad_numeric(value);
        return this;
    }

    /**
     * {Margin}
     * Sets the margin of the element. Can accept 1, 2, or 4 values for different margin settings.
     * @parameter values The values for the margin. Can be a single value, two values for vertical and horizontal margins, or four values for each side.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Margin Bottom}
     * Sets the bottom margin of an element. The equivalent of CSS attribute `marginBottom`. Returns the attribute value when parameter `value` is `null`.
     * @parameter value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    margin_bottom(): number;
    margin_bottom(value: string | number): this;
    margin_bottom(value?: string | number): this | number {
        if (value == null) { return this._try_parse_float(this.style.marginBottom, 0); }
        this.style.marginBottom = this.pad_numeric(value);
        return this;
    }

    /**
     * {Margin Left}
     * Sets the left margin of an element, equivalent to the CSS attribute `marginLeft`.
     * Returns the attribute value when parameter `value` is `null`.
     * @parameter value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    margin_left(): number;
    margin_left(value: string | number): this;
    margin_left(value?: string | number): this | number {
        if (value == null) { return this._try_parse_float(this.style.marginLeft, 0); }
        this.style.marginLeft = this.pad_numeric(value);
        return this;
    }

    /**
     * {Margin Right}
     * Sets the right margin of an element, equivalent to the CSS attribute `marginRight`.
     * Returns the attribute value when the parameter `value` is `null`.
     * @parameter value The value to assign to the right margin. Leave `null` to retrieve the attribute's value.
     * @returns Returns the instance of the element for chaining unless the parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    margin_right(): number;
    margin_right(value: string | number): this;
    margin_right(value?: string | number): this | number {
        if (value == null) { return this._try_parse_float(this.style.marginRight, 0); }
        this.style.marginRight = this.pad_numeric(value);
        return this;
    }

    /**
     * {Margin Top}
     * Sets the top margin of an element. The equivalent of CSS attribute `marginTop`.
     * Returns the attribute value when parameter `value` is `null`.
     * @parameter value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    margin_top(): number;
    margin_top(value: string | number): this;
    margin_top(value?: string | number): this | number {
        if (value == null) { return this._try_parse_float(this.style.marginTop, 0); }
        this.style.marginTop = this.pad_numeric(value);
        return this;
    }

    /**
     * {Position}
     * Sets or retrieves the position style of the element. Can be used with 0, 1, or 4 arguments.
     * @parameter values The values for setting the position, which can be a single value or four values for top, right, bottom, and left.
     * @returns Returns the current position if no arguments are passed, or the instance of the element for chaining when arguments are provided.
     * @docs
     */
    position(): string | undefined;
    position(value: number | string): this;
    position(top?: number | string | None, right?: number | string | None, bottom?: number | string | None, left?: number | string | None): this;
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
     * {Stretch}
     * Sets the flex property of the element to control its stretching behavior.
     * @parameter value A boolean indicating whether the element should stretch or not.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Wrap}
     * Sets the wrapping behavior of an element based on the provided value.
     * @parameter value A boolean or string indicating the wrap behavior.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Z Index}
     * Sets the z-index style property of the element.
     * @parameter value The z-index value to set for the element.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    z_index(value: number | string): this {
        this.style.zIndex = (value as any).toString();
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
    side_by_side(options: {
        /** The amount of column elements that will be put on one row. */
        columns?: number;
        /** The horizontal spacing between the columns in pixels. */
        hspacing?: number;
        /** The vertical spacing between the rows in pixels. */
        vspacing?: number;
        /** Stretch the leftover columns to max width. */
        stretch?: boolean;
        /** Hide dividers when they would appear on a row. */
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
     * {Side By Side Basis}
     * Sets or retrieves the side by side basis for a node, which must be a floating percentage between 0.0 and 1.0.
     * @parameter basis The basis value to set or retrieve.
     * @returns When an argument is passed, this function returns the instance of the element for chaining. Otherwise, it returns the already set side by side basis.
     * @docs
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
     * {Ellipsis Overflow}
     * Configures the text overflow behavior with ellipsis. It can enable or disable ellipsis and set the number of lines.
     * @parameter to Indicates whether to enable or disable ellipsis. If `null`, it returns the current state.
     * @parameter after_lines The number of lines after which ellipsis should be applied. Only relevant when `to` is `true`.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    ellipsis_overflow(): boolean;
    ellipsis_overflow(to: boolean, after_lines?: number | None): this;
    ellipsis_overflow(to?: boolean, after_lines?: number | None): boolean | this {
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
     * {Align}
     * Sets or retrieves the alignment style of the element based on its type.
     * @parameter value The alignment value to set or retrieve based on the element type.
     * @returns When an argument is passed, this function returns the instance of the element for chaining. Otherwise, it returns the currently set alignment value.
     * @docs
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
     * {Leading}
     * Sets the alignment to the start position.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    leading(): this {
        return this.align("start");
    }

    /**
     * {Center Alignment}
     * Sets the alignment of the element to center.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    center(): this {
        return this.align("center");
    }

    /**
     * {Trailing}
     * Aligns the element to the end.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    trailing(): this {
        return this.align("end");
    }

    /**
     * {Align Vertical}
     * Sets or retrieves the vertical alignment style of the element based on its type.
     * @parameter value The alignment value to set or retrieve.
     * @returns Returns the instance of the element for chaining when an argument is passed. Otherwise, returns the current alignment value.
     * @docs
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
     * {Leading Vertical}
     * Sets the vertical alignment to the start position.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    leading_vertical(): this {
        return this.align_vertical("start");
    }

    /**
     * {Center Vertical}
     * Centers the element vertically, optionally only when there is no overflow.
     * @parameter only_on_no_overflow Determines whether to center only when there is no overflow.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Trailing Vertical}
     * Sets the vertical alignment to the trailing position.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    trailing_vertical(): this {
        return this.align_vertical("end");
    }

    /**
     * {Align Text}
     * Sets the text alignment using predefined shortcuts.
     * @parameter value The value representing the text alignment to set.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    align_text(value: string): this {
        return this.text_align(value);
    }

    /**
     * {Text Leading}
     * Sets the text alignment to the start position for leading text.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    text_leading(): this {
        return this.text_align("start");
    }

    /**
     * {Text Center}
     * Sets the text alignment of the element to center.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    text_center(): this {
        return this.text_align("center");
    }

    /**
     * {Text Trailing}
     * Sets the text alignment to 'end' for trailing text.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    text_trailing(): this {
        return this.text_align("end");
    }

    /**
     * {Align Height}
     * Aligns items by height inside a horizontal stack.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    align_height(): this {
        return this.align_items("stretch");
    }

    /**
     * {Text Wrap}
     * Set the text wrap value, equivalent to the CSS attribute `textWrap`.
     * Returns the attribute value when the parameter `value` is `null`.
     * @parameter value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    text_wrap(): string;
    text_wrap(value: string): this;
    text_wrap(value?: string): string | this {
        if (value == null) { return this.style.textWrap; }
        this.style.textWrap = value;
        return this;
    }

    /**
     * {Line clamp}
     * This non-standard CSS property allows you to limit the number of lines shown in a block container. When used in conjunction with `-webkit-box-orient`, it specifies the maximum number of lines to display before truncating the text. Text that exceeds this limit is cut off and typically ends with an ellipsis. This property is particularly useful for creating text overflow effects in web design where maintaining a consistent, visually manageable block of text is necessary.
     * @parameter value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, in which case the attribute's value is returned.
     * @docs
     */
    line_clamp(): string;
    line_clamp(value: string): this;
    line_clamp(value?: string): string | this {
        if (value == null) { return this.style.webkitLineClamp; }
        (this.style as any).webkitLineClamp = value;
        return this;
    }

    /**
     * {Box Orient}
     * This property is part of the old flexbox model and is used to define the orientation of the children in a flex container. In combination with `-webkit-line-clamp`, it's set to vertical to allow the line clamping effect on block containers. It dictates how the children of the box are laid out: horizontally or vertically. Note that `-webkit-box-orient` is specific to Webkit-based browsers and is not part of the standard CSS flexbox properties.
     * @parameter value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
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
     * Sets the color of text, also supports a `GradientType` element. 
     * Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned. 
     *          When the value is `null` and the color has been set using a `GradientType`, `transparent` will be returned.
     * @docs
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

    // @ts-ignore
    border(): string;
    // @ts-ignore
    border(value: string): this;
    // @ts-ignore
    border(width: string | number, color: string): this;
    // @ts-ignore
    border(width: string | number, style: string, color: string): this;
    // @ts-ignore
    border(opts: BorderOpts): this;
    // @ts-ignore
    /**
     * Assigns the border color of this node, also supports a `GradientType` element. 
     * @param value The value to assign. Leave `undefined` to retrieve the attribute's value.
     * @returns Returns the instance for chaining unless parameter `value` is `undefined`, then the attribute's value is returned. 
     * @docs
     */
    border(...values: (string | number)[]): this | string {
        if (values.length === 0) {
            return this.style.border ?? "";
        } else if (values.length === 1) {
            
            // Set by border options.
            if (typeof values[0] === "object" && values[0] !== null) {
                const opts = values[0] as BorderOpts;
                const {
                    width = "1px",
                    style = "solid",
                    color = "black",
                    radius = undefined,
                    top = true,
                    bottom = true,
                    left = true,
                    right = true,
                } = opts;
                // use explicit `true` since it may also be a string with specific color.
                if (top === true && left === true && bottom === true && right === true) {
                    this.style.border = this.pad_numeric(width) + " " + style + " " + color;
                } else {
                    if (top) {
                        this.style.borderTop = this.pad_numeric(width) + " " + style + " " + (typeof top === "boolean" ? color : top);
                    } else {
                        this.style.borderTop = "0px";
                    }
                    if (bottom) {
                        this.style.borderBottom = this.pad_numeric(width) + " " + style + " " + (typeof bottom === "boolean" ? color : bottom);
                    } else {
                        this.style.borderBottom = "0px";
                    }
                    if (left) {
                        this.style.borderLeft = this.pad_numeric(width) + " " + style + " " + (typeof left === "boolean" ? color : left);
                    } else {
                        this.style.borderLeft = "0px";
                    }
                    if (right) {
                        this.style.borderRight = this.pad_numeric(width) + " " + style + " " + (typeof right === "boolean" ? color : right);
                    } else {
                        this.style.borderRight = "0px";
                    }
                }
                if (radius != null) {
                    this.style.borderRadius = this.pad_numeric(radius);
                }
            }
            
            // Set by string.
            else {
                this.style.border = values[0] as string;
            }

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
     * {Border Top}
     * Sets the border top style for the element. Returns the current value when no parameters are provided.
     * @parameter values Values to set the border top, can include width, style, and color.
     * @returns Returns the current border top value if no parameters are provided; otherwise returns the instance of the element for chaining.
     * @docs
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
     * {Border Bottom}
     * Sets the border bottom style of the element. Returns the attribute value when no parameters are defined.
     * @parameter values A variable number of values to set the border bottom style.
     * @returns Returns the current border bottom style when no arguments are passed, otherwise returns the instance for chaining.
     * @docs
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
     * {Border Right}
     * Sets the border-right property of the element.
     * Returns the current value if no parameters are provided.
     * @parameter values The values to set for the border-right property.
     * @returns Returns the instance of the element for chaining when parameters are provided, otherwise returns the current value of the border-right property.
     * @docs
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
     * {Border Left}
     * Sets the left border style of the element. Returns the current value if no parameters are provided.
     * @parameter values The values to set for the border-left property.
     * @returns Returns the current value of the left border when no parameters are provided, otherwise returns the instance of the element for chaining.
     * @docs
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
     * {Shadow}
     * Sets the box shadow of the element. Can accept either 1 or 4 arguments for different shadow styles.
     * @parameter values The values to set the box shadow. Can be a single value or four separate values.
     * @returns Returns the current box shadow if no arguments are provided, or the instance of the element for chaining.
     * @docs
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
     * {Drop Shadow}
     * Applies a drop shadow effect to the object. Can handle 0, 1, or 4 arguments.
     * @parameter values The values for the drop shadow effect, which can be numbers or null.
     * @returns Returns the instance of the element for chaining when arguments are provided. If no arguments are passed, it returns the current filter value.
     * @docs
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
     * {Greyscale}
     * Applies a greyscale filter to the element. Returns the current filter if no value is provided.
     * @parameter value The percentage value for greyscale. Can be a number or null.
     * @returns Returns the current filter value if no argument is passed, otherwise returns the instance for chaining.
     * @docs
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
     * {Opacity}
     * Set or get the opacity of the element based on its type.
     * @parameter value The value of the opacity to set, or null to get the current opacity.
     * @returns Returns the current opacity value if no argument is passed. When an argument is passed, it returns the instance of the element for chaining.
     * @docs
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
     * {Toggle Opacity}
     * Toggles the opacity of the element between a specified value and fully opaque.
     * @parameter value The value to set the opacity to when toggling.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Blur}
     * Applies a blur effect to the element using the specified value.
     * @parameter value The amount of blur to apply, can be a number or null.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Toggle Blur}
     * Toggles the blur effect on the element with a specified value.
     * @parameter value The amount of blur to apply, defaulting to 10.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    toggle_blur(value: number = 10): this {
        return this.filter(this.toggle_filter_wrapper(this.style.filter, "blur", "blur(" + this.pad_numeric(value) + ") "));
    }

    /**
     * {Background Blur}
     * Sets or retrieves the background blur effect for the element.
     * @parameter value The value to set for the blur effect, which can be a number or null.
     * @returns Returns the current blur effect if no argument is passed, otherwise returns the instance of the element for chaining.
     * @docs
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
     * {Toggle Background Blur}
     * Toggles the background blur effect by applying a backdrop filter.
     * @parameter value The intensity of the blur effect to apply.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    toggle_background_blur(value: number = 10): this {
        return this.backdrop_filter(this.toggle_filter_wrapper(this.style.backdropFilter, "blur", "blur(" + this.pad_numeric(value) + ") "));
    }

    /**
     * {Brightness}
     * Adjusts the brightness of an element's filter. If no value is provided, it returns the current brightness filter.
     * @parameter value The brightness level to set, can be a number or null.
     * @returns Returns the instance of the element for chaining if a value is provided. Otherwise, returns the current brightness filter.
     * @docs
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
     * {Toggle Brightness}
     * Toggles the brightness of the element by applying a filter based on the provided value.
     * @parameter value The brightness value to set, defaults to 0.5 if not provided.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    toggle_brightness(value: number = 0.5): this {
        return this.filter(this.toggle_filter_wrapper(this.style.filter, "brightness", "brightness(" + this.pad_percentage(value, "%") + ") "));
    }

    /**
     * {Background Brightness}
     * Adjusts the brightness of the background using a specified value.
     * If no value is provided, it retrieves the current backdrop filter.
     * @parameter value The brightness value to set, or null to get the current value.
     * @returns Returns the instance of the element for chaining when a value is provided, or the current backdrop filter value if no value is given.
     * @docs
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
     * {Toggle Background Brightness}
     * Toggles the background brightness by applying a filter based on the provided value.
     * @parameter value The brightness value to set, defaulting to 10 if not provided.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    toggle_background_brightness(value: number = 10): this {
        return this.backdrop_filter(this.toggle_filter_wrapper(this.style.backdropFilter, "brightness", "brightness(" + this.pad_percentage(value, "%") + ") "));
    }

    /**
     * {Rotate}
     * Sets the rotation transformation for the element. When called without an argument, it retrieves the current rotation.
     * @parameter value The value to set as the rotation. It can be a number, string, or null.
     * @returns Returns the current rotation value as a string when no argument is passed. When an argument is provided, it returns the instance of the element for chaining.
     * @docs
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
     * {Delay}
     * Set the delay for keyframes in the style element.
     * @parameter value The value of the delay to set.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    delay(value: string | number): this {
        (this.style as any).delay = value as string;
        return this;
    }

    /**
     * {Duration}
     * Sets the duration style property for the element.
     * @parameter value The value to set for the duration property.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    duration(value: string | number): this {
        (this.style as any).duration = value as string;
        return this;
    }

    /**
     * {Background}
     * A shorthand property for all the background properties.
     * The equivalent of CSS attribute `background`.
     * Returns the attribute value when parameter `value` is `null`.
     * @parameter value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
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
     * {Scale Font Size}
     * Adjusts the font size based on a scaling factor relative to the current font size.
     * @parameter scale The scaling factor to apply to the current font size.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Display}
     * Sets or retrieves the display style of an HTML element.
     * If no value is provided, it returns the current display style.
     * @parameter value The value to set for the display style.
     * @docs
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
     * {Hide}
     * Hides the element by setting its display style to none.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    hide(): this {
        this.style.display = "none";
        return this;
    }

    /**
     * {Show}
     * Displays the element by setting its display style property.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    show(): this {
        this.style.display = this._element_display;
        return this;
    }

    /**
     * {Is Hidden}
     * Checks if the element is currently hidden based on its display style.
     * @returns Returns true if the element is hidden; otherwise, false.
     * @docs
     */
    is_hidden(): boolean {
        return this.style.display === "none" || typeof this.style.display === "undefined";
    }

    /**
     * {Is Visible}
     * Checks if the element is visible based on its display style.
     * @returns Returns true if the element is visible, false otherwise.
     * @docs
     */
    is_visible(): boolean {
        return !(this.style.display === "none" || typeof this.style.display === "undefined");
    }

    /**
     * {Toggle Visibility}
     * Toggles the visibility of the element by showing or hiding it based on its current state.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Inner HTML}
     * Get or set the inner HTML of an element.
     * @parameter value The HTML content to set. If no value is provided, the current inner HTML is returned.
     * @returns Returns the current inner HTML if no argument is passed, otherwise returns the instance of the element for chaining.
     * @docs
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
     * {Outer HTML}
     * Get or set the outer HTML of the element. If no argument is passed, it returns the current outer HTML.
     * @parameter value The outer HTML to set.
     * @returns Returns the instance of the element for chaining when an argument is passed, otherwise returns the current outer HTML.
     * @docs
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
     * {Styles}
     * Retrieves the CSS attributes when no parameter is provided, or sets the styles based on the provided attributes.
     * @parameter css_attr The CSS attributes to set. If null, returns the current styles.
     * @returns When no argument is passed, returns the current styles as an object. When attributes are set, returns the instance of the element for chaining.
     * @docs
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
     * {Attribute}
     * Get or set a single attribute for an element. If no value is provided, it retrieves the attribute's current value.
     * @parameter key The name of the attribute to get or set.
     * @parameter value The value to set for the attribute. If null, the current value is returned.
     * @returns Returns the current value of the attribute if no value is provided, otherwise returns the instance of the element for chaining.
     * @docs
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
     * {Attributes}
     * Sets multiple attributes for the element based on the provided dictionary.
     * @parameter html_attr A dictionary of attributes to set on the element.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    attrs(html_attr: Record<string, string | number | boolean>): this {
        for (let i in html_attr) {
            this.setAttribute(i, html_attr[i].toString());
        }
        return this;
    }

    /**
     * {Event}
     * Get or set a single event associated with the element.
     * If no value is provided, it retrieves the current event.
     * @parameter key The name of the event to get or set.
     * @parameter value The value to set for the event, if provided.
     * @docs
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
     * {Events}
     * Sets multiple event handlers on the current element using a dictionary of events.
     * @parameter html_events An object containing event names as keys and their corresponding handler functions as values.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    events(html_events: { [key: string]: EventListener }): this {
        for (let i in html_events) {
            this[i] = html_events[i];
        }
        return this;
    }

    /**
     * {Class}
     * Specifies one or more classnames for an element (refers to a class in a style sheet).
     * The equivalent of HTML attribute `class`.
     * Returns the attribute value when parameter `value` is `null`.
     * @parameter value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    class(): string;
    class(value: string): this;
    class(value?: string): string | this {
        if (value == null) { return this.className ?? ""; }
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
    toggle_class(name: string): this {
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
    remove_class(name: string): this {
        this.classList.remove(name);
        return this;
    }

    /**
     * {Remove all classes}
     * Remove all classes from the class list.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    remove_classes(): this {
        while (this.classList.length > 0) {
            this.classList.remove(this.classList.item(0) as string);
        }
        return this;
    }

    /**
     * {Hover Brightness}
     * Controls the brightness effects on hover for the element.
     * You can enable or disable the effect or specify brightness levels.
     * @parameter mouse_down_brightness The brightness value when the mouse is down, or a boolean to enable/disable.
     * @parameter mouse_over_brightness The brightness value when the mouse is over the element.
     * @returns Returns the instance of the element for chaining when setting values, or a boolean indicating if the effect is enabled when no parameters are passed.
     * @docs
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
     * {Text Width}
     * Calculates the width of the provided text or the current text content if no text is provided. This is useful for measuring text width in input elements.
     * @parameter text The text whose width is to be measured. If null, the current text content is used.
     * @returns Returns the width of the text in pixels.
     * @docs
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
     * {Media Query}
     * Creates a media query listener that triggers provided handlers based on the media query's state.
     * @parameter media_query The media query string to evaluate.
     * @parameter true_handler The function to execute when the media query matches.
     * @parameter false_handler The function to execute when the media query does not match.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Remove Media Query}
     * Removes a specified media query from the element's media queries.
     * @parameter media_query The media query string to be removed.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    remove_media(media_query: string): this {
        if (typeof this._media_queries === "object" && this._media_queries[media_query] !== undefined) {
            this._media_queries[media_query].list.removeListener(this._media_queries[media_query].callback as any);
        }
        return this;
    }

    /**
     * {Remove Media Queries}
     * Removes all media queries from the element.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Remove All Media}
     * Removes all media queries and their associated listeners from the element.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Default Animate}
     * Calls the animate function from the superclass with the provided arguments.
     * @parameter args The arguments to pass to the superclass animate function.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    default_animate(...args: any[]): this {
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
    animate(options: {
        /** An array of keyframe objects to animate. */
        keyframes: Array<any>;
        /** Delay before starting the animation in milliseconds. */
        delay?: number;
        /** Duration of each keyframe in milliseconds. */
        duration?: number;
        /** Whether the animation should repeat infinitely. */
        repeat?: boolean;
        /** Whether to keep the last keyframe when the animation ends. */
        persistent?: boolean;
        /** Callback function to execute when the animation finishes. */
        on_finish?: ((element: any) => any) | null;
        /** Easing function to use for the animation. */
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
     * {Stop Animation}
     * Stops the currently active animation by clearing the timeout.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    stop_animation(): this {
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
    async slide_out(options: {
        /**
         * The direction of the slide animation.
         * @default "top"
         */
        direction: string;
        /**
         * The distance in pixels for the slide animation.
         * @default 100
         */
        distance: number;
        /**
         * The duration of the animation in milliseconds.
         * @default 500
         */
        duration: number;
        /**
         * Whether to animate the opacity of the element.
         * @default true
         */
        opacity?: boolean;
        /**
         * The easing function for the animation.
         * @default "ease"
         */
        easing?: string;
        /**
         * Whether to hide the element after the animation completes.
         * @default true
         */
        hide?: boolean;
        /**
         * Whether to remove the element from the DOM after the animation completes.
         * @default false
         */
        remove?: boolean;
        /**
         * The display property to set when showing the element again.
         * @default null
         */
        display?: string;
        /**
         * Indicates if the animation is a slide-in animation.
         * @default false
         */
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
     * {Slide In}
     * Initiates a slide-in animation for the element with customizable parameters.
     * @parameter options Configuration options for the slide-in animation.
     * @returns Returns a promise that resolves when the slide-in animation is complete.
     * @docs
     */
    async slide_in({
        direction = "top",
        distance = 100,
        duration = 500,
        opacity = true,
        easing = "ease",
        display = undefined,
    }: {
        /** The direction from which the element will slide in (e.g., "top", "bottom", "left", "right"). */
        direction?: string;
        /** The distance in pixels the element will slide in. */
        distance?: number;
        /** The duration of the slide animation in milliseconds. */
        duration?: number;
        /** A boolean indicating whether to animate the opacity during the slide. */
        opacity?: boolean;
        /** The easing function to use for the animation. */
        easing?: string;
        /** An optional display property to use when showing the view again. */
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
     * {Dropdown Text Animation}
     * Animates the text of a dropdown element with a specified animation effect.
     * It allows for customization of distance, duration, and easing for each character.
     * @warning Causes undefined behaviour when called on a non text element.
     * @parameter options An object containing animation settings.
     * @returns Returns a promise that resolves when the animation is complete.
     * @docs
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
        /** The distance of pixels of the drop (negative) or rise (positive). */
        distance?: string,
        /** The duration of each individual character drop animation in milliseconds. */
        duration?: number,
        /** The factor for the duration in relation to the dropdown duration, 1.0 for 100%. */
        opacity_duration?: number,
        /** The total duration of the character drop animation, this parameter will overwrite the `duration` parameter. */
        total_duration?: number,
        /** The delay in milliseconds for each character drop. */
        delay?: number,
        /** The start delay of the animation in milliseconds. */
        start_delay?: number,
        /** The animation's easing. */
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
     * {On emit}
     * Registers an event callback for the specified event ID. This allows the element to respond to events.
     * @parameter id The unique identifier for the event to listen for.
     * @parameter callback The function to be executed when the event is triggered.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    on_emit(id: string, callback: (element: this, args: Record<string, any>) => any): this {
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
    remove_on_event(id: string, callback: (element: this, args: Record<string, any>) => any): this {
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
    remove_on_events(id: string): this {
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
    timeout(delay: number, callback: ElementCallback<this>, options?: {
        /** An optional identifier for the timeout. */
        id?: string;
        /** If true, clears the previous timeout with the same id. */
        debounce?: boolean;
    } | null): this {
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
     * {Clear Timeout}
     * Clears a cached timeout by its ID. If timeouts are not initialized, they will be set up.
     * @parameter id The ID of the timeout to clear.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Disable Button}
     * Disables the button element, preventing user interaction.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    disable(): this {
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
    enable(): this {
        // console.log({ disabled_cursor: this._disabled_cursor, cursor: this.style.cursor });
        if (this._disabled_cursor) {
            this.style.cursor = this._disabled_cursor;
        } else if (this.style.cursor === "not-allowed") {
            this.style.cursor = "pointer";
        }
        this._is_button_disabled = false;
        return this;
    }

    /**
     * {On Click}
     * Sets a click event handler for the element, allowing for optional simulated href behavior.
     * @parameter simulate_href The simulated href to set for the element (for SEO in SPAs).
     * @parameter callback The function to be called when the element is clicked.
     * @returns Returns the instance of the element for chaining when an argument is passed, otherwise returns the current onclick handler.
     * @docs
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
     * {On Click Redirect}
     * Sets up a click event that redirects to the specified URL when triggered.
     * @parameter url The URL to redirect to when the click event occurs.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    on_click_redirect(url: string): this {
        return this.on_click(url, () => Utils.redirect(url));
    }

    /**
     * {On Scroll}
     * Script to be run when an element's scrollbar is being scrolled.
     * The equivalent of HTML attribute `onscroll`. The first parameter of the callback is the `VElement` object.
     * Returns the attribute value when parameter `value` is `null`.
     * @parameter opts_or_callback Options or callback function to assign for the scroll event.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_scroll(): (EventListener | null);
    on_scroll(opts_or_callback: Function | {
        /** Function to be called on scroll. */
        callback: (element: any, event: Event) => any,
        /** Delay in milliseconds before executing the callback. */
        delay?: number
    }): this;
    on_scroll(opts_or_callback?: Function | {
        /** Function to be called on scroll. */
        callback: (element: any, event: Event) => any,
        /** Delay in milliseconds before executing the callback. */
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
     * {On Resize}
     * Script to be run when the browser window is being resized.
     * This allows for a callback to be executed upon resizing the window.
     * @parameter callback The function to be called when the window is resized.
     * @parameter once If true, the callback will only be executed once after the last resize event.
     * @parameter delay The delay in milliseconds before executing the callback.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
    on_attachment_drop(options: Attachment.OnDropOpts): this {
        Attachment.on_drop(this, this.attachments, options);
        return this;
    }

    /**
     * Add an attachment to the attachments array, if not already added.
     * @param attachment The attachment to add.
     * @returns The instance of the element for chaining.
     */
    add_attachment(attachment: Attachment): this {
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
    remove_attachment(attachment: Attachment): this {
        const index = this.attachments.indexOf(attachment);
        if (index > -1) {
            this.attachments.splice(index, 1);
        }
        return this;
    }

    /**
     * {On Appear}
     * Sets a callback to be executed when the element appears in the viewport.
     * @parameter callback_or_opts Can be a callback function or an options object containing callback, repeat, and threshold.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    on_appear<T = this>(callback: OnAppearCallback<T>): this;
    on_appear<T = this>(options: {
        /** The function to call when the element appears. */
        callback: OnAppearCallback<T>;
        /** If true, the callback will be called every time the element appears. */
        repeat?: boolean,
        /** The intersection ratio threshold to trigger the callback. */
        threshold?: number | null;
    }): this;
    on_appear<T = this>(callback_or_opts?: 
        OnAppearCallback<T> | 
        {
            /** The function to call when the element appears. */
            callback: OnAppearCallback<T>,
            /** If true, the callback will be called every time the element appears. */
            repeat?: boolean;
            /** The intersection ratio threshold to trigger the callback. */
            threshold?: number | null;
        }
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
     * {On Disappear}
     * Sets up an event listener that triggers a callback when the element disappears from the user's view.
     * @experimental
     * @parameter callback_or_opts Can be a callback function or an options object containing the callback and repeat settings.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    on_disappear<T = this>(callback_or_opts?: ((element: T) => any) | {
        /** The function to call when the element disappears. */
        callback?: (element: T) => any;
        /** Whether to repeat the observation after the callback is triggered. */
        repeat?: boolean;
    }): this {
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
    //             if (element._previousY != null) {
    //                 scroll_direction = currentY < element._previousY ? 'down' : 'up';
    //             }
    //             element._previousY = currentY;

    //             // Initialize previousIntersectionRatio if null
    //             if (element._previousIntersectionRatio == null) {
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
     * {On Enter}
     * Sets a callback function to be executed when the Enter key is pressed on input or textarea elements.
     * @parameter callback The function to be called when the Enter key is pressed.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {On Escape}
     * Sets a callback function to be triggered when the Escape key is pressed.
     * @parameter callback The function to be called when the Escape key is pressed.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {On Theme Update}
     * Manages theme update callbacks. If no callback is provided, it returns the current callbacks.
     * @parameter callback A function to be called on theme updates or null to retrieve existing callbacks.
     * @returns Returns the instance of the element for chaining when a callback is provided, or the array of existing callbacks if null is passed.
     * @docs
     */
    on_theme_update(): ThemeUpdateCallback<this>[];
    on_theme_update(callback: ThemeUpdateCallback<this>): this;
    on_theme_update(callback?: ThemeUpdateCallback<this>): ThemeUpdateCallback<this>[] | this {
        if (callback == null) {
            return this._on_theme_updates;
        }   

        if (!Themes.theme_elements.some(item => item.element === this)) {
            Themes.theme_elements.push({
                element: this,
            });
        }

        this._on_theme_updates.push(callback)
        return this;
    }

    /**
     * {Remove on Theme Update}
     * Removes a callback from the theme update listeners.
     * @parameter callback The callback function to be removed from the listeners.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    remove_on_theme_update(callback: ThemeUpdateCallback<this>): this {
        this._on_theme_updates = vlib.Array.drop(this._on_theme_updates, callback);
        return this;
    }

    /**
     * {Remove on Theme Updates}
     * Clears the list of theme update callbacks if they exist.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    remove_on_theme_updates(): this {
        this._on_theme_updates = [];
        return this;
    }

    /**
     * {On Render}
     * Manages callbacks that are triggered when the element is added to the body.
     * @parameter callback A function to be called when the element is rendered. If no argument is passed, it returns the current callbacks.
     * @returns When a callback is provided, returns the instance of the element for chaining. If no callback is provided, returns the array of current callbacks.
     * @docs
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
            on_render_observer.observe(this as any);
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
    remove_on_render(callback: ElementCallback<this>): this {
        this._on_render_callbacks = vlib.Array.drop(this._on_render_callbacks, callback);
        if (this._on_render_callbacks.length === 0) {
            on_render_observer.unobserve(this as any);
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
    remove_on_renders(): this {
        this._on_render_callbacks = [];
        on_render_observer.unobserve(this as any);
        this._observing_on_render = false;
        return this;
    }

    /**
     * {Is Rendered}
     * Checks whether the element has been rendered or not.
     * @returns Returns true if the element has been rendered, otherwise false.
     * @docs
     */
    is_rendered(): boolean {
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
    on_load(callback: (element: this, args: Record<string, any>) => any): this {
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
    remove_on_load(callback: (element: this, args: Record<string, any>) => any): this {
        Events.remove("volt.on_load", this, callback);
        return this;
    }

    /**
     * {Remove On Loads}
     * Removes the on_load event listener from the instance.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    remove_on_loads(): this {
        Events.remove("volt.on_load", this);
        return this;
    }

    /**
     * {On Resize}
     * Manages callbacks for the resize event. Can retrieve existing callbacks or add new ones.
     * @parameter callback The callback function to be executed on resize events.
     * @returns When a callback is provided, returns the instance for chaining. Otherwise, returns the list of existing resize callbacks.
     * @docs
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
            on_resize_observer.observe(this as any);
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
    remove_on_resize(callback: ElementCallback<this>): this {
        this._on_resize_callbacks = vlib.Array.drop(this._on_resize_callbacks, callback);
        if (this._on_resize_callbacks.length === 0) {
            on_resize_observer.unobserve(this as any);
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
    remove_on_resizes(): this {
        this._on_resize_callbacks = [];
        on_resize_observer.unobserve(this as any);
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
     * {On Shortcut}
     * Create key shortcuts for the element. This function takes an array of shortcut objects that define the key combinations and their associated actions.
     * @parameter shortcuts The array with shortcuts. Each shortcut object may have various attributes to define the key matching criteria and actions.
     * @returns This function does not return a value.
     * @docs
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
                        this._on_shortcut_time == null ||
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
                        this._on_shortcut_time == null ||
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

    // /**
    //  * MOVED docs:
    //  * @title: On Context Menu
    //  * @desc: 
    //  *     Script to be run when a context menu is triggered. This function can set or get the context menu callback.
    //  * @param:
    //  *     @name: callback
    //  *     @descr: 
    //  *         The parameter may either be a callback function, a ContextMenu object, or an Array as the ContextMenu parameter.
    //  * @return:
    //  *     @description Returns the `VElement` object. If `callback` is `null`, then the attribute's value is returned.
    //  * @funcs: 2
    //  */
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
     * {On Mouse Enter}
     * Sets a callback function to be called when the mouse enters the element.
     * @parameter callback The function to be called on mouse enter.
     * @returns When a callback is provided, returns the instance of the element for chaining. If no callback is provided, returns the current callback.
     * @docs
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
     * {On Mouse Leave}
     * Sets or retrieves the callback function to be called when the mouse leaves the element.
     * @parameter callback The function to execute when the mouse leaves the element.
     * @returns When an argument is passed this function returns the instance of the element for chaining. Otherwise, it returns the currently set callback function.
     * @docs
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
     * {On mouse over and out}
     * Set callbacks for the on mouse over and mouse out events.
     * @parameter mouse_over The mouse over callback.
     * @parameter mouse_out The mouse out callback.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {First Child}
     * Retrieves the first child of the element.
     * @returns Returns the first child node of the element, or null if there are no children.
     * @docs
     */
    first_child(): Node | null {
        return this.firstChild;
    }

    /**
     * {Last Child}
     * Retrieves the last child of the element.
     * @returns Returns the last child node of the element, or null if there are no children.
     * @docs
     */
    last_child(): ChildNode | null {
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
     * {Iterate Child Nodes}
     * Iterates over the child nodes of an element, executing a handler function for each node.
     * @parameter start The starting index for iteration, or a handler function.
     * @parameter end The ending index for iteration.
     * @parameter handler The function to execute for each child node.
     * @returns Returns the result of the handler function if not null, otherwise returns null.
     * @docs
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
     * {Set Default}
     * Sets the current element as the default, allowing for a specific type to be set.
     * @parameter Type The type to set as default, defaults to VElement if null.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Assign}
     * Assigns a function or property to the instance. This allows dynamic property assignment for elements.
     * @parameter name The name of the property or function to assign.
     * @parameter value The value to assign to the property or function.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Extend}
     * Extends the current instance by adding properties or functions from the provided object.
     * @parameter obj The object containing properties or functions to add to the current instance.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    // extend<T extends object>(props: T): this & T {
    // extend<T extends Record<string, (...args: any[]) => any>>(methods: T & ThisType<MyClass & T>): this & T {
    extend<T extends Record<string, any>>(props: T & ThisType<this & T>): this & T {
        Object.assign(this, props);
        return this as this & T;
    }

    /**
     * {Select Contents}
     * Selects the contents of the object, optionally overwriting existing selections.
     * @parameter overwrite Indicates whether to overwrite the current selection.
     * @returns Returns the instance of the element for chaining.
     * @docs
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
     * {Is Scrollable}
     * Determines whether the element is scrollable based on its dimensions.
     * @returns Returns true if the element's scroll height or width exceeds its client height or width, indicating it is scrollable.
     * @docs
     */
    is_scrollable(): boolean {
        return this.scrollHeight > this.clientHeight || this.scrollWidth > this.clientWidth;
    }

    /**
     * {Is Scrollable X}
     * Checks if the element is scrollable in the horizontal direction by comparing its scroll width with its client width.
     * @returns Returns true if the element is scrollable horizontally, otherwise false.
     * @docs
     */
    is_scrollable_x(): boolean {
        return this.scrollWidth > this.clientWidth;
    }

    /**
     * {Is Scrollable Y}
     * Checks if the element is scrollable vertically by comparing its scroll height to its client height.
     * @returns Returns true if the element is scrollable in the Y direction, otherwise false.
     * @docs
     */
    is_scrollable_y(): boolean {
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
     * {Add Pseudo}
     * Adds a pseudo element of a specified type to a node.
     * Ensures that the pseudo element is properly initialized and styled.
     * @parameter type The type of pseudo element to add (e.g., before, after).
     * @parameter node The node to which the pseudo element is added.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    pseudo(type: string, pseudo: PseudoElement): this {
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
    remove_pseudo(type: string, pseudo: PseudoElement): this {
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
    remove_pseudos(): this {
        this.classList.forEach(name => {
            if (name.startsWith("pseudo_")) {
                this.classList.remove(name);
            }
        })
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
    pseudo_on_hover(type: string, pseudo: PseudoElement, set_defaults: boolean = true): this {
        if (set_defaults) {
            pseudo.position(0, 0, 0, 0);
            const border_radius = this.border_radius();
            if (border_radius && typeof pseudo.border_radius === "function") {
                pseudo.border_radius(border_radius);
            }
            if (this.position() !== "absolute") {
                this.position("relative")
            }
        }
        this.on_mouse_over(() => pseudo.apply(this, type))
        this.on_mouse_out(() => pseudo.remove_from(this, type))
        return this;
    }

    // ---------------------------------------------------------
    // Parent functions.

    /**
     * {Parent}
     * Get or set the parent element of the current element.
     * This is particularly relevant for child elements of specific derived classes.
     * @parameter value The parent element to set or null to retrieve the current parent.
     * @docs
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
     * {Absolute Parent}
     * Sets or gets the absolute parent of the custom element.
     * When called without arguments, it returns the current absolute parent;
     * when called with an argument, it sets the absolute parent and returns the instance for chaining.
     * @parameter value The absolute parent to set.
     * @docs
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
     * {Assign to Parent As}
     * Assigns the current element to a specified attribute of the parent element.
     * @deprecated
     * @parameter name The name of the attribute to assign the current element to.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    assign_to_parent_as(name: string): this {
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
     * {Absolute Y Offset}
     * Calculates the absolute vertical offset of the element from the top of the document.
     * @returns Returns the absolute Y offset in pixels.
     * @docs
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
     * {Absolute X Offset}
     * Calculates the absolute X offset of the current element in relation to its offset parents.
     * @returns Returns the total left offset in pixels as a number.
     * @docs
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
     * {Exec}
     * Executes a provided function with the current element as its parameter.
     * @parameter callback A function to execute with the current element.
     * @returns Returns the instance of the element for chaining.
     * @docs
     */
    exec(callback: ElementCallback<this>): this {
        callback(this);
        return this;
    }

    /**
     * {Is child}
     * Check if an element is a direct child of the element or the element itself.
     * @parameter target The target element to test.
     * @returns Returns true if the target is a direct child, otherwise false.
     * @docs
     */
    is_child(target: any): boolean {
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
    is_nested_child(target: any, stop_node: any = null): boolean {
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
    toString(): string {
        this.setAttribute("created_by_html", "true");
        // console.log("Created by html:", this.outerHTML)
        return this.outerHTML;
    }

    // ---------------------------------------------------------
    // Automatically generated CSS functions. 
    
    accent_color(): string;
    accent_color(value: string): this;
    /**
     * {Accent color}
     * Specifies an accent color for user-interface controls. The equivalent of CSS attribute `accentColor`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the attribute's value if `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    accent_color(value?: string): string | this {
        if (value == null) { return this.style.accentColor; }
        this.style.accentColor = value;
        return this;
    }

    align_content(): string;
    align_content(value: string): this;
    /**
     * {Align Content}
     * Specifies the alignment between the lines inside a flexible container when the items do not use all available space.
     * The equivalent of CSS attribute `alignContent`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute value when parameter `value` is `null`. Otherwise, returns the instance of the element for chaining.
     * @docs
     */
    align_content(value?: string): string | this {
        if (value == null) { return this.style.alignContent; }
        this.style.alignContent = value;
        (this.style as any).msAlignContent = value;
        (this.style as any).webkitAlignContent = value;
        (this.style as any).MozAlignContent = value;
        (this.style as any).OAlignContent = value;
        return this;
    }

    align_items(): string;
    align_items(value: string): this;
    /**
     * {Align Items}
     * Specifies the alignment for items inside a flexible container, equivalent to the CSS attribute `alignItems`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    align_items(value?: string): string | this {
        if (value == null) { return this.style.alignItems; }
        this.style.alignItems = value;
        (this.style as any).msAlignItems = value;
        (this.style as any).webkitAlignItems = value;
        (this.style as any).MozAlignItems = value;
        (this.style as any).OAlignItems = value;
        return this;
    }

    align_self(): string;
    align_self(value: string): this;
    /**
     * {Align Self}
     * Specifies the alignment for selected items inside a flexible container. The equivalent of CSS attribute `alignSelf`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    align_self(value?: string): string | this {
        if (value == null) { return this.style.alignSelf; }
        this.style.alignSelf = value;
        (this.style as any).msAlignSelf = value;
        (this.style as any).webkitAlignSelf = value;
        (this.style as any).MozAlignSelf = value;
        (this.style as any).OAlignSelf = value;
        return this;
    }

    all(): string;
    all(value: string): this;
    /**
     * {All}
     * Resets all properties (except unicode-bidi and direction). The equivalent of CSS attribute `all`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    all(value?: string): string | this {
        if (value == null) { return this.style.all; }
        this.style.all = value;
        return this;
    }

    animation(): string;
    animation(value: string): this;
    /**
     * {Animation}
     * A shorthand property for all the animation properties.
     * The equivalent of CSS attribute `animation`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    animation(value?: string): string | this {
        if (value == null) { return this.style.animation; }
        this.style.animation = value;
        (this.style as any).msAnimation = value;
        (this.style as any).webkitAnimation = value;
        (this.style as any).MozAnimation = value;
        (this.style as any).OAnimation = value;
        return this;
    }

    animation_delay(): string;
    animation_delay(value: string | number): this;
    /**
     * {Animation Delay}
     * Specifies a delay for the start of an animation, equivalent to the CSS attribute `animationDelay`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the instance of the element for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    animation_delay(value?: string | number): string | this {
        if (value == null) { return this.style.animationDelay; }
        this.style.animationDelay = value as string;
        (this.style as any).msAnimationDelay = value as string;
        (this.style as any).webkitAnimationDelay = value as string;
        (this.style as any).MozAnimationDelay = value as string;
        (this.style as any).OAnimationDelay = value as string;
        return this;
    }

    animation_direction(): string;
    animation_direction(value: string): this;
    /**
     * {Animation Direction}
     * Specifies whether an animation should be played forwards, backwards or in alternate cycles.
     * The equivalent of CSS attribute `animationDirection`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    animation_direction(value?: string): string | this {
        if (value == null) { return this.style.animationDirection; }
        this.style.animationDirection = value as string;
        (this.style as any).msAnimationDirection = value as string;
        (this.style as any).webkitAnimationDirection = value as string;
        (this.style as any).MozAnimationDirection = value as string;
        (this.style as any).OAnimationDirection = value as string;
        return this;
    }

    animation_duration(): string;
    animation_duration(value: string | number): this;
    /**
     * {Animation Duration}
     * Specifies how long an animation should take to complete one cycle. The equivalent of CSS attribute `animationDuration`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    animation_duration(value?: string | number): string | this {
        if (value == null) { return this.style.animationDuration; }
        this.style.animationDuration = value as string;
        (this.style as any).msAnimationDuration = value as string;
        (this.style as any).webkitAnimationDuration = value as string;
        (this.style as any).MozAnimationDuration = value as string;
        (this.style as any).OAnimationDuration = value as string;
        return this;
    }

    animation_fill_mode(): string;
    animation_fill_mode(value: string): this;
    /**
     * {Animation Fill Mode}
     * Specifies a style for the element when the animation is not playing, akin to the CSS `animation-fill-mode` property.
     * Use this method to set or retrieve the current fill mode value.
     * @param value The value to assign to the animation fill mode. Pass `null` to retrieve the current value.
     * @returns Returns the instance of the element for chaining when a value is set. If `null` is passed, returns the current value of the animation fill mode.
     * @docs
     */
    animation_fill_mode(value?: string): string | this {
        if (value == null) { return this.style.animationFillMode; }
        this.style.animationFillMode = value;
        (this.style as any).msAnimationFillMode = value;
        (this.style as any).webkitAnimationFillMode = value;
        (this.style as any).MozAnimationFillMode = value;
        (this.style as any).OAnimationFillMode = value;
        return this;
    }

    animation_iteration_count(): string;
    animation_iteration_count(value: string | number): this;
    /**
     * {Animation Iteration Count}
     * Specifies the number of times an animation should be played. The equivalent of CSS attribute `animationIterationCount`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    animation_iteration_count(value?: string | number): string | this {
        if (value == null) { return this.style.animationIterationCount; }
        this.style.animationIterationCount = value as string;
        (this.style as any).msAnimationIterationCount = value as string;
        (this.style as any).webkitAnimationIterationCount = value as string;
        (this.style as any).MozAnimationIterationCount = value as string;
        (this.style as any).OAnimationIterationCount = value as string;
        return this;
    }

    animation_name(): string;
    animation_name(value: string): this;
    /**
     * {Animation Name}
     * Specifies a name for the \@keyframes animation, equivalent to the CSS attribute `animationName`.
     * When the parameter `value` is null, it retrieves the current attribute value.
     * @param value The value to assign for the animation name. Use null to retrieve the current value.
     * @returns Returns the current animation name when `value` is null, otherwise returns the instance for chaining.
     * @docs
     */
    animation_name(value?: string): string | this {
        if (value == null) { return this.style.animationName; }
        this.style.animationName = value;
        (this.style as any).msAnimationName = value;
        (this.style as any).webkitAnimationName = value;
        (this.style as any).MozAnimationName = value;
        (this.style as any).OAnimationName = value;
        return this;
    }

    animation_play_state(): string;
    animation_play_state(value: string): this;
    /**
     * {Animation Play State}
     * Specifies whether the animation is running or paused.
     * The equivalent of CSS attribute `animationPlayState`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    animation_play_state(value?: string): string | this {
        if (value == null) { return this.style.animationPlayState; }
        this.style.animationPlayState = value;
        (this.style as any).msAnimationPlayState = value;
        (this.style as any).webkitAnimationPlayState = value;
        (this.style as any).MozAnimationPlayState = value;
        (this.style as any).OAnimationPlayState = value;
        return this;
    }

    animation_timing_function(): string;
    animation_timing_function(value: string): this;
    /**
     * {Animation Timing Function}
     * Specifies the speed curve of an animation. The equivalent of CSS attribute `animationTimingFunction`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    animation_timing_function(value?: string): string | this {
        if (value == null) { return this.style.animationTimingFunction; }
        this.style.animationTimingFunction = value;
        (this.style as any).msAnimationTimingFunction = value;
        (this.style as any).webkitAnimationTimingFunction = value;
        (this.style as any).MozAnimationTimingFunction = value;
        (this.style as any).OAnimationTimingFunction = value;
        return this;
    }

    aspect_ratio(): string;
    aspect_ratio(value: string): this;
    /**
     * {Aspect ratio}
     * Specifies preferred aspect ratio of an element. The equivalent of CSS attribute `aspectRatio`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    aspect_ratio(value?: string): this | string {
        if (value == null) { return this.style.aspectRatio; }
        this.style.aspectRatio = value;
        return this;
    }

    backdrop_filter(): string;
    backdrop_filter(value: string): this;
    /**
     * {Backdrop Filter}
     * Defines a graphical effect to the area behind an element. The equivalent of CSS attribute `backdropFilter`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the instance of the element for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    backdrop_filter(value?: string): string | this {
        if (value == null) { return this.style.backdropFilter; }
        this.style.backdropFilter = value;
        (this.style as any).msBackdropFilter = value;
        (this.style as any).webkitBackdropFilter = value;
        (this.style as any).MozBackdropFilter = value;
        (this.style as any).OBackdropFilter = value;
        return this;
    }

    backface_visibility(): string;
    backface_visibility(value: string): this;
    /**
     * {Backface Visibility}
     * Defines whether or not the back face of an element should be visible when facing the user.
     * The equivalent of CSS attribute `backfaceVisibility`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    backface_visibility(value?: string): string | this {
        if (value == null) { return this.style.backfaceVisibility; }
        this.style.backfaceVisibility = value;
        (this.style as any).msBackfaceVisibility = value;
        (this.style as any).webkitBackfaceVisibility = value;
        (this.style as any).MozBackfaceVisibility = value;
        (this.style as any).OBackfaceVisibility = value;
        return this;
    }

    background_attachment(): string;
    background_attachment(value: string): this;
    /**
     * {Background Attachment}
     * Sets whether a background image scrolls with the rest of the page, or is fixed.
     * The equivalent of CSS attribute `backgroundAttachment`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    background_attachment(value?: string): string | this {
        if (value == null) { return this.style.backgroundAttachment; }
        this.style.backgroundAttachment = value;
        return this;
    }

    background_blend_mode(): string;
    background_blend_mode(value: string): this;
    /**
     * {Background Blend Mode}
     * Specifies the blending mode of each background layer (color/image). The equivalent of CSS attribute `backgroundBlendMode`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    background_blend_mode(value?: string): string | this {
        if (value == null) { return this.style.backgroundBlendMode; }
        this.style.backgroundBlendMode = value;
        return this;
    }

    background_clip(): string;
    background_clip(value: string): this;
    /**
     * {Background Clip}
     * Defines how far the background (color or image) should extend within an element.
     * The equivalent of CSS attribute `backgroundClip`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    background_clip(value?: string): string | this {
        if (value == null) { return this.style.backgroundClip; }
        this.style.backgroundClip = value;
        (this.style as any).msBackgroundClip = value;
        (this.style as any).webkitBackgroundClip = value;
        (this.style as any).MozBackgroundClip = value;
        (this.style as any).OBackgroundClip = value;
        return this;
    }

    background_color(): string;
    background_color(value: string): this;
    /**
     * {Background Color}
     * Specifies the background color of an element. The equivalent of CSS attribute `backgroundColor`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    background_color(value?: string): string | this {
        if (value == null) { return this.style.backgroundColor; }
        this.style.backgroundColor = value;
        return this;
    }

    background_image(): string;
    background_image(value: string): this;
    /**
     * {Background Image}
     * Specifies one or more background images for an element.
     * The equivalent of CSS attribute `backgroundImage`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    background_image(value?: string): string | this {
        if (value == null) { return this.style.backgroundImage; }
        this.style.backgroundImage = value;
        return this;
    }

    background_origin(): string;
    background_origin(value: string): this;
    /**
     * {Background Origin}
     * Specifies the origin position of a background image, equivalent to the CSS attribute `backgroundOrigin`.
     * @param value The value to assign for the background origin. Leave `null` to retrieve the attribute's current value.
     * @returns r: Returns the instance of the element for chaining unless `value` is `null`, then the current attribute value is returned.
     * @docs
     */
    background_origin(value?: string): string | this {
        if (value == null) { return this.style.backgroundOrigin; }
        this.style.backgroundOrigin = value;
        (this.style as any).msBackgroundOrigin = value;
        (this.style as any).webkitBackgroundOrigin = value;
        (this.style as any).MozBackgroundOrigin = value;
        (this.style as any).OBackgroundOrigin = value;
        return this;
    }

    background_position(): string;
    background_position(value: string): this;
    /**
     * {Background Position}
     * Specifies the position of a background image, equivalent to the CSS attribute `backgroundPosition`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    background_position(value?: string): string | this {
        if (value == null) { return this.style.backgroundPosition; }
        this.style.backgroundPosition = value;
        return this;
    }

    background_position_x(): string;
    background_position_x(value: string | number): this;
    /**
     * {Background Position X}
     * Specifies the position of a background image on x-axis.
     * The equivalent of CSS attribute `backgroundPositionX`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    background_position_x(value?: string | number): string | this {
        if (value == null) { return this.style.backgroundPositionX; }
        this.style.backgroundPositionX = this.pad_numeric(value);
        return this;
    }

    background_position_y(): string;
    background_position_y(value: string | number): this;
    /**
     * {Background Position Y}
     * Specifies the position of a background image on the y-axis, equivalent to the CSS attribute `backgroundPositionY`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    background_position_y(value?: string | number): this | string {
        if (value == null) { return this.style.backgroundPositionY; }
        this.style.backgroundPositionY = this.pad_numeric(value);
        return this;
    }

    background_repeat(): string;
    background_repeat(value: string): this;
    /**
     * {Background Repeat}
     * Sets if/how a background image will be repeated. This corresponds to the CSS property `backgroundRepeat`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, in which case the attribute's value is returned.
     * @docs
     */
    background_repeat(value?: string): string | this {
        if (value == null) { return this.style.backgroundRepeat; }
        this.style.backgroundRepeat = value;
        return this;
    }

    background_size(): string;
    background_size(value: string | number): this;
    /**
     * {Background Size}
     * Specifies the size of the background images. The equivalent of CSS attribute `backgroundSize`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    background_size(value?: string | number): string | this {
        if (value == null) { return this.style.backgroundSize; }
        this.style.backgroundSize = this.pad_numeric(value);
        (this.style as any).msBackgroundSize = this.pad_numeric(value);
        (this.style as any).webkitBackgroundSize = this.pad_numeric(value);
        (this.style as any).MozBackgroundSize = this.pad_numeric(value);
        (this.style as any).OBackgroundSize = this.pad_numeric(value);
        return this;
    }

    block_size(): string;
    block_size(value: string | number): this;
    /**
     * {Block size}
     * Specifies the size of an element in block direction.
     * The equivalent of CSS attribute `blockSize`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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

    border_block(): string;
    border_block(value: string): this | string;
    /**
     * {Border Block}
     * A shorthand property for border-block-width, border-block-style and border-block-color.
     * The equivalent of CSS attribute `borderBlock`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_block(value?: string): this | string {
        if (value == null) { return this.style.borderBlock; }
        this.style.borderBlock = value;
        return this;
    }

    border_block_color(): string;
    border_block_color(value: string): this;
    /**
     * {Border Block Color}
     * Sets the color of the borders at start and end in the block direction.
     * The equivalent of CSS attribute `borderBlockColor`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute's value if `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    border_block_color(value?: string): string | this {
        if (value == null) { return this.style.borderBlockColor; }
        this.style.borderBlockColor = value;
        return this;
    }

    border_block_end_color(): string;
    border_block_end_color(value: string): this;
    /**
     * {Border Block End Color}
     * Sets the color of the border at the end in the block direction. The equivalent of CSS attribute `borderBlockEndColor`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_block_end_color(value?: string): string | this {
        if (value == null) { return this.style.borderBlockEndColor; }
        this.style.borderBlockEndColor = value;
        return this;
    }

    border_block_end_style(): string;
    border_block_end_style(value: string): this;
    /**
     * {Border Block End Style}
     * Sets the style of the border at the end in the block direction.
     * The equivalent of CSS attribute `borderBlockEndStyle`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute value when parameter `value` is `null`. Otherwise, returns the instance of the element for chaining.
     * @docs
     */
    border_block_end_style(value?: string): string | this {
        if (value == null) { return this.style.borderBlockEndStyle; }
        this.style.borderBlockEndStyle = value;
        return this;
    }

    border_block_end_width(): string;
    border_block_end_width(value: string | number): this;
    /**
     * {Border Block End Width}
     * Sets the width of the border at the end in the block direction.
     * The equivalent of CSS attribute `borderBlockEndWidth`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute's value when `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    border_block_end_width(value?: string | number): string | this {
        if (value == null) { return this.style.borderBlockEndWidth; }
        this.style.borderBlockEndWidth = this.pad_numeric(value);
        return this;
    }

    border_block_start_color(): string;
    border_block_start_color(value: string): this;
    /**
     * {Border Block Start Color}
     * Sets the color of the border at the start in the block direction.
     * The equivalent of CSS attribute `borderBlockStartColor`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_block_start_color(value?: string): string | this {
        if (value == null) { return this.style.borderBlockStartColor; }
        this.style.borderBlockStartColor = value;
        return this;
    }

    border_block_start_style(): string;
    border_block_start_style(value: string): this;
    /**
     * {Border Block Start Style}
     * Sets the style of the border at the start in the block direction.
     * The equivalent of CSS attribute `borderBlockStartStyle`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute's value if `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    border_block_start_style(value?: string): string | this {
        if (value == null) { return this.style.borderBlockStartStyle; }
        this.style.borderBlockStartStyle = value;
        return this;
    }

    border_block_start_width(): string;
    border_block_start_width(value: string | number): this;
    /**
     * {Border Block Start Width}
     * Sets the width of the border at the start in the block direction. The equivalent of CSS attribute `borderBlockStartWidth`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_block_start_width(value?: string | number): string | this {
        if (value == null) { return this.style.borderBlockStartWidth; }
        this.style.borderBlockStartWidth = this.pad_numeric(value);
        return this;
    }

    border_block_style(): string;
    border_block_style(value: string): this;
    /**
     * {Border Block Style}
     * Sets the style of the borders at start and end in the block direction.
     * The equivalent of CSS attribute `borderBlockStyle`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_block_style(value?: string): string | this {
        if (value == null) { return this.style.borderBlockStyle; }
        this.style.borderBlockStyle = value;
        return this;
    }

    border_block_width(): string;
    border_block_width(value: string | number): this;
    /**
     * {Border Block Width}
     * Sets the width of the borders at start and end in the block direction.
     * The equivalent of CSS attribute `borderBlockWidth`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_block_width(value?: string | number): string | this {
        if (value == null) { return this.style.borderBlockWidth; }
        this.style.borderBlockWidth = this.pad_numeric(value);
        return this;
    }

    border_bottom_color(): string;
    border_bottom_color(value: string): this;
    /**
     * {Border Bottom Color}
     * Sets the color of the bottom border. The equivalent of CSS attribute `borderBottomColor`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_bottom_color(value?: string): string | this {
        if (value == null) { return this.style.borderBottomColor; }
        this.style.borderBottomColor = value;
        return this;
    }

    border_bottom_left_radius(): string;
    border_bottom_left_radius(value: string | number): this;
    /**
     * {Border Bottom Left Radius}
     * Defines the radius of the border of the bottom-left corner.
     * The equivalent of CSS attribute `borderBottomLeftRadius`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the attribute's value when `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    border_bottom_left_radius(value?: string | number): string | this {
        if (value == null) { return this.style.borderBottomLeftRadius; }
        this.style.borderBottomLeftRadius = this.pad_numeric(value);
        return this;
    }

    border_bottom_right_radius(): string;
    border_bottom_right_radius(value: string | number): this;
    /**
     * {Border Bottom Right Radius}
     * Defines the radius of the border of the bottom-right corner.
     * The equivalent of CSS attribute `borderBottomRightRadius`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute value when parameter `value` is `null`. Otherwise, returns the instance of the element for chaining.
     * @docs
     */
    border_bottom_right_radius(value?: string | number): string | this {
        if (value == null) { return this.style.borderBottomRightRadius; }
        this.style.borderBottomRightRadius = this.pad_numeric(value);
        return this;
    }

    border_bottom_style(): string;
    border_bottom_style(value: string): this;
    /**
     * {Border Bottom Style}
     * Sets the style of the bottom border, equivalent to the CSS attribute `borderBottomStyle`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_bottom_style(value?: string): string | this {
        if (value == null) { return this.style.borderBottomStyle; }
        this.style.borderBottomStyle = value;
        return this;
    }

    border_bottom_width(): string;
    border_bottom_width(value: string | number): this;
    /**
     * {Border Bottom Width}
     * Sets the width of the bottom border. The equivalent of CSS attribute `borderBottomWidth`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_bottom_width(value?: string | number): string | this {
        if (value == null) { return this.style.borderBottomWidth; }
        this.style.borderBottomWidth = this.pad_numeric(value);
        return this;
    }

    border_collapse(): string;
    border_collapse(value: string): this;
    /**
     * {Border Collapse}
     * Sets whether table borders should collapse into a single border or be separated.
     * The equivalent of CSS attribute `borderCollapse`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_collapse(value?: string): string | this {
        if (value == null) { return this.style.borderCollapse; }
        this.style.borderCollapse = value;
        return this;
    }

    border_color(): string;
    border_color(value: string): this;
    /**
     * {Border Color}
     * Sets the color of the four borders. This is equivalent to the CSS attribute `borderColor`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining. Unless parameter `value` is `null`,
     * then the attribute's value is returned.
     * @docs
     */
    border_color(value?: string): string | this {
        if (value == null) { return this.style.borderColor; }
        this.style.borderColor = value;
        return this;
    }

    border_image(): string;
    border_image(value: string): this;
    /**
     * {Border Image}
     * A shorthand property for all the border-image properties.
     * The equivalent of CSS attribute `borderImage`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_image(value?: string): string | this {
        if (value == null) { return this.style.borderImage; }
        this.style.borderImage = value;
        (this.style as any).msBorderImage = value;
        (this.style as any).webkitBorderImage = value;
        (this.style as any).MozBorderImage = value;
        (this.style as any).OBorderImage = value;
        return this;
    }

    border_image_outset(): string;
    border_image_outset(value: string | number): this;
    /**
     * {Border image outset}
     * Specifies the amount by which the border image area extends beyond the border box. The equivalent of CSS attribute `borderImageOutset`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_image_outset(value?: string | number): string | this {
        if (value == null) { return this.style.borderImageOutset; }
        this.style.borderImageOutset = value as string;
        return this;
    }

    border_image_repeat(): string;
    border_image_repeat(value: string): this;
    /**
     * {Border Image Repeat}
     * Specifies whether the border image should be repeated, rounded or stretched.
     * The equivalent of CSS attribute `borderImageRepeat`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_image_repeat(value?: string): string | this {
        if (value == null) { return this.style.borderImageRepeat; }
        this.style.borderImageRepeat = value;
        return this;
    }

    border_image_slice(): string;
    border_image_slice(value: string | number): this;
    /**
     * {Border Image Slice}
     * Specifies how to slice the border image, equivalent to the CSS attribute `borderImageSlice`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_image_slice(value?: string | number): string | this {
        if (value == null) { return this.style.borderImageSlice; }
        this.style.borderImageSlice = value as string;
        return this;
    }

    border_image_source(): string;
    border_image_source(value: string): this;
    /**
     * {Border Image Source}
     * Specifies the path to the image to be used as a border.
     * The equivalent of CSS attribute `borderImageSource`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_image_source(value?: string): string | this {
        if (value == null) { return this.style.borderImageSource; }
        this.style.borderImageSource = value;
        return this;
    }

    border_image_width(): string;
    border_image_width(value: string | number): this;
    /**
     * {Border Image Width}
     * Specifies the width of the border image, equivalent to the CSS attribute `borderImageWidth`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute's value if `value` is `null`, otherwise returns the instance for chaining.
     * @docs
     */
    border_image_width(value?: string | number): string | this {
        if (value == null) { return this.style.borderImageWidth; }
        this.style.borderImageWidth = this.pad_numeric(value);
        return this;
    }

    border_inline(): string;
    border_inline(value: string | number): this;
    /**
     * {Border inline}
     * A shorthand property for border-inline-width, border-inline-style and border-inline-color.
     * The equivalent of CSS attribute `borderInline`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_inline(value?: string | number): string | this {
        if (value == null) { return this.style.borderInline; }
        this.style.borderInline = value as string;
        return this;
    }

    border_inline_color(): string;
    border_inline_color(value: string): this;
    /**
     * {Border Inline Color}
     * Sets the color of the borders at start and end in the inline direction.
     * The equivalent of CSS attribute `borderInlineColor`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining, unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_inline_color(value?: string): string | this {
        if (value == null) { return this.style.borderInlineColor; }
        this.style.borderInlineColor = value;
        return this;
    }

    border_inline_end_color(): string;
    border_inline_end_color(value: string): this;
    /**
     * {Border Inline End Color}
     * Sets the color of the border at the end in the inline direction.
     * The equivalent of CSS attribute `borderInlineEndColor`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_inline_end_color(value?: string): string | this {
        if (value == null) { return this.style.borderInlineEndColor; }
        this.style.borderInlineEndColor = value;
        return this;
    }

    border_inline_end_style(): string;
    border_inline_end_style(value: string): this;
    /**
     * {Border Inline End Style}
     * Sets the style of the border at the end in the inline direction.
     * The equivalent of CSS attribute `borderInlineEndStyle`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_inline_end_style(value?: string): string | this {
        if (value == null) { return this.style.borderInlineEndStyle; }
        this.style.borderInlineEndStyle = value;
        return this;
    }

    border_inline_end_width(): string;
    border_inline_end_width(value: string | number): this;
    /**
     * {Border Inline End Width}
     * Sets the width of the border at the end in the inline direction.
     * The equivalent of CSS attribute `borderInlineEndWidth`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_inline_end_width(value?: string | number): string | this {
        if (value == null) { return this.style.borderInlineEndWidth; }
        this.style.borderInlineEndWidth = this.pad_numeric(value);
        return this;
    }

    border_inline_start_color(): string;
    border_inline_start_color(value: string): this;
    /**
     * {Border inline start color}
     * Sets the color of the border at the start in the inline direction. The equivalent of CSS attribute `borderInlineStartColor`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_inline_start_color(value?: string): string | this {
        if (value == null) { return this.style.borderInlineStartColor; }
        this.style.borderInlineStartColor = value;
        return this;
    }

    border_inline_start_style(): string;
    border_inline_start_style(value: string): this;
    /**
     * {Border inline start style}
     * Sets the style of the border at the start in the inline direction.
     * The equivalent of CSS attribute `borderInlineStartStyle`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_inline_start_style(value?: string): string | this {
        if (value == null) { return this.style.borderInlineStartStyle; }
        this.style.borderInlineStartStyle = value;
        return this;
    }

    border_inline_start_width(): string;
    border_inline_start_width(value: string | number): this;
    /**
     * {Border Inline Start Width}
     * Sets the width of the border at the start in the inline direction.
     * The equivalent of CSS attribute `borderInlineStartWidth`.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_inline_start_width(value?: string | number): string | this {
        if (value == null) { return this.style.borderInlineStartWidth; }
        this.style.borderInlineStartWidth = this.pad_numeric(value);
        return this;
    }

    border_inline_style(): string;
    border_inline_style(value: string): this;
    /**
     * {Border Inline Style}
     * Sets the style of the borders at start and end in the inline direction.
     * The equivalent of CSS attribute `borderInlineStyle`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_inline_style(value?: string): string | this {
        if (value == null) { return this.style.borderInlineStyle; }
        this.style.borderInlineStyle = value;
        return this;
    }

    border_inline_width(): string;
    border_inline_width(value: string | number): this;
    /**
     * {Border Inline Width}
     * Sets the width of the borders at start and end in the inline direction.
     * The equivalent of CSS attribute `borderInlineWidth`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_inline_width(value?: string | number): this | string {
        if (value == null) { return this.style.borderInlineWidth; }
        this.style.borderInlineWidth = this.pad_numeric(value);
        return this;
    }

    border_left_color(): string;
    border_left_color(value: string): this;
    /**
     * {Border Left Color}
     * Sets the color of the left border. The equivalent of CSS attribute `borderLeftColor`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_left_color(value?: string): string | this {
        if (value == null) { return this.style.borderLeftColor; }
        this.style.borderLeftColor = value;
        return this;
    }

    border_left_style(): string;
    border_left_style(value: string): this;
    /**
     * {Border Left Style}
     * Sets the style of the left border. The equivalent of CSS attribute `borderLeftStyle`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_left_style(value?: string): string | this {
        if (value == null) { return this.style.borderLeftStyle; }
        this.style.borderLeftStyle = value;
        return this;
    }

    border_left_width(): string;
    border_left_width(value: string | number): this;
    /**
     * {Border Left Width}
     * Sets the width of the left border. The equivalent of CSS attribute `borderLeftWidth`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_left_width(value?: string | number): string | this {
        if (value == null) { return this.style.borderLeftWidth; }
        this.style.borderLeftWidth = this.pad_numeric(value);
        return this;
    }

    border_radius(): string;
    border_radius(value: string | number): this;
    /**
     * {Border radius}
     * A shorthand property for the four border-radius properties. The equivalent of CSS attribute `borderRadius`.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_radius(value?: string | number): string | this {
        if (value == null) { return this.style.borderRadius; }
        this.style.borderRadius = this.pad_numeric(value);
        (this.style as any).msBorderRadius = this.pad_numeric(value);
        (this.style as any).webkitBorderRadius = this.pad_numeric(value);
        (this.style as any).MozBorderRadius = this.pad_numeric(value);
        (this.style as any).OBorderRadius = this.pad_numeric(value);
        return this;
    }

    border_right_color(): string;
    border_right_color(value: string): this;
    /**
     * {Border Right Color}
     * Sets the color of the right border. This is equivalent to the CSS attribute `borderRightColor`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_right_color(value?: string): string | this {
        if (value == null) { return this.style.borderRightColor; }
        this.style.borderRightColor = value;
        return this;
    }

    border_right_style(): string;
    border_right_style(value: string): this;
    /**
     * {Border Right Style}
     * Sets the style of the right border. The equivalent of CSS attribute `borderRightStyle`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_right_style(value?: string): string | this {
        if (value == null) { return this.style.borderRightStyle; }
        this.style.borderRightStyle = value;
        return this;
    }

    border_right_width(): string;
    border_right_width(value: string | number): this;
    /**
     * {Border Right Width}
     * Sets the width of the right border. The equivalent of CSS attribute `borderRightWidth`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_right_width(value?: string | number): string | this {
        if (value == null) { return this.style.borderRightWidth; }
        this.style.borderRightWidth = this.pad_numeric(value);
        return this;
    }

    border_spacing(): string;
    border_spacing(value: string | number): this;
    /**
     * {Border Spacing}
     * Sets the distance between the borders of adjacent cells.
     * The equivalent of CSS attribute `borderSpacing`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_spacing(value?: string | number): string | this {
        if (value == null) { return this.style.borderSpacing; }
        this.style.borderSpacing = value as string;
        return this;
    }

    border_style(): string;
    border_style(value: string): this;
    /**
     * {Border Style}
     * Sets the style of the four borders. The equivalent of CSS attribute `borderStyle`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining, or the attribute's value if `value` is `null`.
     * @docs
     */
    border_style(value?: string): string | this {
        if (value == null) { return this.style.borderStyle; }
        this.style.borderStyle = value;
        return this;
    }

    border_top_color(): string;
    border_top_color(value: string): this;
    /**
     * {Border Top Color}
     * Sets the color of the top border. The equivalent of CSS attribute `borderTopColor`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining, unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_top_color(value?: string): string | this {
        if (value == null) { return this.style.borderTopColor; }
        this.style.borderTopColor = value;
        return this;
    }

    border_top_left_radius(): string;
    border_top_left_radius(value: string | number): this;
    /**
     * {Border Top Left Radius}
     * Defines the radius of the border of the top-left corner. The equivalent of CSS attribute `borderTopLeftRadius`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_top_left_radius(value?: string | number): string | this {
        if (value == null) { return this.style.borderTopLeftRadius; }
        this.style.borderTopLeftRadius = this.pad_numeric(value);
        return this;
    }

    border_top_right_radius(): string;
    border_top_right_radius(value: string | number): this;
    /**
     * {Border Top Right Radius}
     * Defines the radius of the border of the top-right corner.
     * The equivalent of CSS attribute `borderTopRightRadius`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute's value if `value` is `null`, otherwise returns the instance for chaining.
     * @docs
     */
    border_top_right_radius(value?: string | number): string | this {
        if (value == null) { return this.style.borderTopRightRadius; }
        this.style.borderTopRightRadius = this.pad_numeric(value);
        return this;
    }

    border_top_style(): string;
    border_top_style(value: string): this;
    /**
     * {Border Top Style}
     * Sets the style of the top border. The equivalent of CSS attribute `borderTopStyle`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    border_top_style(value?: string): string | this {
        if (value == null) { return this.style.borderTopStyle; }
        this.style.borderTopStyle = value;
        return this;
    }

    border_top_width(): string;
    border_top_width(value: string | number): this;
    /**
     * {Border Top Width}
     * Sets the width of the top border, equivalent to the CSS attribute `borderTopWidth`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute's value if `value` is `null`, otherwise returns the instance for chaining.
     * @docs
     */
    border_top_width(value?: string | number): string | this {
        if (value == null) { return this.style.borderTopWidth; }
        this.style.borderTopWidth = this.pad_numeric(value);
        return this;
    }

    border_width(): string;
    border_width(value: string | number): this;
    /**
     * {Border Width}
     * Sets the width of the four borders, equivalent to the CSS attribute `borderWidth`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining, unless the parameter `value` is `null`,
     * then the attribute's value is returned.
     * @docs
     */
    border_width(value?: string | number): string | this {
        if (value == null) { return this.style.borderWidth; }
        this.style.borderWidth = this.pad_numeric(value);
        return this;
    }

    bottom(): string;
    bottom(value: string | number): this;
    /**
     * {Bottom}
     * Sets the elements position, from the bottom of its parent element.
     * The equivalent of CSS attribute `bottom`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    bottom(value?: string | number): string | this {
        if (value == null) { return this.style.bottom; }
        this.style.bottom = this.pad_numeric(value);
        return this;
    }

    box_decoration_break(): string;
    box_decoration_break(value: string): this;
    /**
     * {Box decoration break}
     * Sets the behavior of the background and border of an element at page-break, or, for in-line elements, at line-break. The equivalent of CSS attribute `boxDecorationBreak`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, in which case the attribute's value is returned.
     * @docs
     */
    box_decoration_break(value?: string): string | this {
        if (value == null) { return (this.style as any).boxDecorationBreak ?? ""; }
        (this.style as any).boxDecorationBreak = value;
        return this;
    }

    box_reflect(): string;
    box_reflect(value: string): this;
    /**
     * {Box reflect}
     * The box-reflect property is used to create a reflection of an element.
     * The equivalent of CSS attribute `boxReflect`.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    box_reflect(value?: string): string | this {
        if (value == null) { return (this.style as any).boxReflect; }
        (this.style as any).boxReflect = value;
        return this;
    }

    box_shadow(): string;
    box_shadow(value: string): this;
    /**
     * {Box shadow}
     * Attaches one or more shadows to an element. The equivalent of CSS attribute `boxShadow`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`,
     * then the attribute's value is returned.
     * @docs
     */
    box_shadow(value?: string): string | this {
        if (value == null) { return this.style.boxShadow; }
        this.style.boxShadow = value;
        (this.style as any).msBoxShadow = value;
        (this.style as any).webkitBoxShadow = value;
        (this.style as any).MozBoxShadow = value;
        (this.style as any).OBoxShadow = value;
        return this;
    }

    box_sizing(): string;
    box_sizing(value: string): this;
    /**
     * {Box sizing}
     * Defines how the width and height of an element are calculated: should they include padding and borders, or not. The equivalent of CSS attribute `boxSizing`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute value when parameter `value` is `null`. Otherwise, returns the instance of the element for chaining.
     * @docs
     */
    box_sizing(value?: string): string | this {
        if (value == null) { return this.style.boxSizing; }
        this.style.boxSizing = value;
        (this.style as any).msBoxSizing = value;
        (this.style as any).webkitBoxSizing = value;
        (this.style as any).MozBoxSizing = value;
        (this.style as any).OBoxSizing = value;
        return this;
    }

    break_after(): string | this;
    break_after(value: string): this;
    /**
     * {Break After}
     * Specifies whether or not a page-, column-, or region-break should occur after the specified element. The equivalent of CSS attribute `breakAfter`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute value when parameter `value` is `null`. Otherwise, returns the instance of the element for chaining.
     * @docs
     */
    break_after(value?: string): string | this {
        if (value == null) { return this.style.breakAfter; }
        this.style.breakAfter = value;
        return this;
    }

    break_before(): string;
    break_before(value: string): this;
    /**
     * {Break Before}
     * Specifies whether or not a page-, column-, or region-break should occur before the specified element.
     * The equivalent of CSS attribute `breakBefore`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    break_before(value?: string): string | this {
        if (value == null) { return this.style.breakBefore; }
        this.style.breakBefore = value;
        return this;
    }

    break_inside(): string;
    break_inside(value: string): this;
    /**
     * {Break Inside}
     * Specifies whether or not a page-, column-, or region-break should occur inside the specified element. The equivalent of CSS attribute `breakInside`. Returns the attribute value when parameter `value` is `null`.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    break_inside(value?: string): string | this {
        if (value == null) { return this.style.breakInside; }
        this.style.breakInside = value;
        return this;
    }

    caption_side(): string;
    caption_side(value: string): this;
    /**
     * {Caption Side}
     * Specifies the placement of a table caption. The equivalent of CSS attribute `captionSide`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    caption_side(value?: string): string | this {
        if (value == null) { return this.style.captionSide; }
        this.style.captionSide = value;
        return this;
    }

    caret_color(): string;
    caret_color(value: string): this;
    /**
     * {Caret color}
     * Specifies the color of the cursor (caret) in inputs, textareas, or any element that is editable.
     * The equivalent of CSS attribute `caretColor`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    caret_color(value?: string): string | this {
        if (value == null) { return this.style.caretColor; }
        this.style.caretColor = value;
        return this;
    }

    clear(): string;
    clear(value: string): this;
    /**
     * {Clear}
     * Specifies what should happen with the element that is next to a floating element.
     * The equivalent of CSS attribute `clear`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    clear(value?: string): string | this {
        if (value == null) { return this.style.clear; }
        this.style.clear = value;
        return this;
    }

    clip(): string;
    clip(value: string): this;
    /**
     * {Clip}
     * Clips an absolutely positioned element. The equivalent of CSS attribute `clip`.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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

    column_count(): null | number;
    column_count(value: string | number): this;
    /**
     * {Column Count}
     * Specifies the number of columns an element should be divided into.
     * The equivalent of CSS attribute `columnCount`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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

    column_fill(): string;
    column_fill(value: string): this;
    /**
     * {Column Fill}
     * Specifies how to fill columns, balanced or not.
     * The equivalent of CSS attribute `columnFill`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    column_fill(value?: string): string | this {
        if (value == null) { return this.style.columnFill; }
        this.style.columnFill = value;
        return this;
    }

    column_gap(): string;
    column_gap(value: string | number): this;
    /**
     * {Column Gap}
     * Specifies the gap between the columns. The equivalent of CSS attribute `columnGap`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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

    column_rule(): string;
    column_rule(value: string): this;
    /**
     * {Column Rule}
     * A shorthand property for all the column-rule properties.
     * The equivalent of CSS attribute `columnRule`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    column_rule(value?: string): string | this {
        if (value == null) { return this.style.columnRule; }
        this.style.columnRule = value;
        (this.style as any).msColumnRule = value;
        (this.style as any).webkitColumnRule = value;
        (this.style as any).MozColumnRule = value;
        (this.style as any).OColumnRule = value;
        return this;
    }

    column_rule_color(): string;
    column_rule_color(value: string): this;
    /**
     * {Column Rule Color}
     * Specifies the color of the rule between columns. This is equivalent to the CSS attribute `columnRuleColor`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    column_rule_color(value?: string): string | this {
        if (value == null) { return this.style.columnRuleColor; }
        this.style.columnRuleColor = value;
        (this.style as any).msColumnRuleColor = value;
        (this.style as any).webkitColumnRuleColor = value;
        (this.style as any).MozColumnRuleColor = value;
        (this.style as any).OColumnRuleColor = value;
        return this;
    }

    column_rule_style(): string;
    column_rule_style(value: string): this;
    /**
     * {Column Rule Style}
     * Specifies the style of the rule between columns, equivalent to the CSS attribute `columnRuleStyle`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, in which case the attribute's value is returned.
     * @docs
     */
    column_rule_style(value?: string): this | string {
        if (value == null) { return this.style.columnRuleStyle; }
        this.style.columnRuleStyle = value;
        (this.style as any).msColumnRuleStyle = value;
        (this.style as any).webkitColumnRuleStyle = value;
        (this.style as any).MozColumnRuleStyle = value;
        (this.style as any).OColumnRuleStyle = value;
        return this;
    }

    column_rule_width(): string;
    column_rule_width(value: string | number): this;
    /**
     * {Column Rule Width}
     * Specifies the width of the rule between columns. This is equivalent to the CSS attribute `columnRuleWidth`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, in which case the attribute's value is returned.
     * @docs
     */
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

    column_span(): null | number;
    column_span(value: number): this;
    /**
     * {Column Span}
     * Specifies how many columns an element should span across.
     * The equivalent of CSS attribute `columnSpan`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    column_span(value?: number): this | null | number {
        if (value == null) { return this._try_parse_float(this.style.columnSpan, null); }
        this.style.columnSpan = value.toString();
        return this;
    }

    column_width(): string;
    column_width(value: string | number): this;
    /**
     * {Column Width}
     * Specifies the column width, equivalent to the CSS attribute `columnWidth`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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

    columns(): string;
    columns(value: string | number): this;
    /**
     * {Columns}
     * A shorthand property for column-width and column-count. The equivalent of CSS attribute `columns`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    columns(value?: string | number): string | this {
        if (value == null) { return this.style.columns; }
        this.style.columns = value.toString();
        return this;
    }

    content(): string;
    content(value: string | number): this;
    /**
     * {Content}
     * Used with the :before and :after pseudo-elements, to insert generated content. The equivalent of CSS attribute `content`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    content(value?: string | number): string | this {
        if (value == null) {
            return this.style.content ?? "";
        }
        this.style.content = value.toString();
        return this;
    }

    counter_increment(): string;
    counter_increment(value: string | number): this;
    /**
     * {Counter Increment}
     * Increases or decreases the value of one or more CSS counters.
     * The equivalent of CSS attribute `counterIncrement`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    counter_increment(value?: string | number): string | this {
        if (value == null) { return this.style.counterIncrement; }
        this.style.counterIncrement = value.toString();
        return this;
    }

    counter_reset(): string;
    counter_reset(value: string): this;
    /**
     * {Counter reset}
     * Creates or resets one or more CSS counters. The equivalent of CSS attribute `counterReset`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    counter_reset(value?: string): string | this {
        if (value == null) { return this.style.counterReset; }
        this.style.counterReset = value;
        return this;
    }

    cursor(): string;
    cursor(value: string): this;
    /**
     * {Cursor}
     * Specifies the mouse cursor to be displayed when pointing over an element.
     * The equivalent of CSS attribute `cursor`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining, unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    cursor(value?: string): string | this {
        if (value == null) { return this.style.cursor; }
        this.style.cursor = value;
        return this;
    }

    direction(): string;
    direction(value: string): this;
    /**
     * {Direction}
     * Specifies the text direction/writing direction. The equivalent of CSS attribute `direction`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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

    empty_cells(): string;
    empty_cells(value: string): this;
    /**
     * {Empty Cells}
     * Specifies whether or not to display borders and background on empty cells in a table. The equivalent of CSS attribute `emptyCells`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    empty_cells(value?: string): string | this {
        if (value == null) { return this.style.emptyCells ?? ""; }
        this.style.emptyCells = value;
        return this;
    }

    filter(): string;
    filter(value: string): this;
    /**
     * {Filter}
     * Defines effects (e.g. blurring or color shifting) on an element before the element is displayed.
     * The equivalent of CSS attribute `filter`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the attribute's value if `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    filter(value?: string): string | this {
        if (value == null) { return this.style.filter; }
        this.style.filter = value;
        (this.style as any).msFilter = value;
        (this.style as any).webkitFilter = value;
        (this.style as any).MozFilter = value;
        (this.style as any).OFilter = value;
        return this;
    }

    flex(): string;
    flex(value: boolean | number | string): this;
    /**
     * {Flex}
     * A shorthand property for the flex-grow, flex-shrink, and the flex-basis properties.
     * The equivalent of CSS attribute `flex`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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

    flex_basis(): string;
    flex_basis(value: string | number): this;
    /**
     * {Flex Basis}
     * Specifies the initial length of a flexible item. The equivalent of CSS attribute `flexBasis`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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

    flex_direction(): string;
    flex_direction(value: string): this;
    /**
     * {Flex Direction}
     * Specifies the direction of the flexible items. This is the equivalent of the CSS attribute `flexDirection`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining. If `value` is `null`, returns the current attribute's value.
     * @docs
     */
    flex_direction(value?: string): string | this {
        if (value == null) { return this.style.flexDirection; }
        this.style.flexDirection = value;
        (this.style as any).msFlexDirection = value;
        (this.style as any).webkitFlexDirection = value;
        (this.style as any).MozFlexDirection = value;
        (this.style as any).OFlexDirection = value;
        return this;
    }

    flex_flow(): string;
    flex_flow(value: string): this;
    /**
     * {Flex Flow}
     * A shorthand property for the flex-direction and the flex-wrap properties.
     * The equivalent of CSS attribute `flexFlow`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    flex_flow(value?: string): string | this {
        if (value == null) { return this.style.flexFlow; }
        this.style.flexFlow = value;
        (this.style as any).msFlexFlow = value;
        (this.style as any).webkitFlexFlow = value;
        (this.style as any).MozFlexFlow = value;
        (this.style as any).OFlexFlow = value;
        return this;
    }

    flex_grow(): null | number;
    flex_grow(value: string | number): this;
    /**
     * {Flex Grow}
     * Specifies how much the item will grow relative to the rest. The equivalent of CSS attribute `flexGrow`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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

    flex_shrink(): null | number;
    flex_shrink(value: string | number): this;
    /**
     * {Flex Shrink}
     * Specifies how the item will shrink relative to the rest.
     * The equivalent of CSS attribute `flexShrink`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the attribute value when parameter `value` is `null`.
     * Otherwise, returns the instance of the element for chaining.
     * @docs
     */
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

    flex_wrap(): string;
    flex_wrap(value: string): this;
    /**
     * {Flex Wrap}
     * Specifies whether the flexible items should wrap or not. The equivalent of CSS attribute `flexWrap`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute's value if `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    flex_wrap(value?: string): string | this {
        if (value == null) { return this.style.flexWrap; }
        this.style.flexWrap = value;
        (this.style as any).msFlexWrap = value;
        (this.style as any).webkitFlexWrap = value;
        (this.style as any).MozFlexWrap = value;
        (this.style as any).OFlexWrap = value;
        return this;
    }

    float(): string;
    float(value: string): this;
    /**
     * {Float}
     * Specifies whether an element should float to the left, right, or not at all.
     * The equivalent of CSS attribute `float`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    float(value?: string): string | this {
        if (value == null) { return this.style.float; }
        this.style.float = value;
        return this;
    }

    font(): string;
    font(value: string): this;
    /**
     * {Font}
     * A shorthand property for the font-style, font-variant, font-weight, font-size/line-height, and the font-family properties.
     * The equivalent of CSS attribute `font`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the instance of the element for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    font(value?: string): string | this {
        if (value == null) { return this.style.font; }
        this.style.font = value;
        return this;
    }

    font_family(): string;
    font_family(value: string): this;
    /**
     * {Font Family}
     * Specifies the font family for text. This is the equivalent of the CSS attribute `fontFamily`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining, or the attribute's value if `value` is `null`.
     * @docs
     */
    font_family(value?: string): this | string {
        if (value == null) { return this.style.fontFamily; }
        this.style.fontFamily = value;
        return this;
    }

    font_feature_settings(): string;
    font_feature_settings(value: string): this;
    /**
     * {Font Feature Settings}
     * Allows control over advanced typographic features in OpenType fonts. The equivalent of CSS attribute `fontFeatureSettings`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    font_feature_settings(value?: string): string | this {
        if (value == null) { return this.style.fontFeatureSettings; }
        this.style.fontFeatureSettings = value;
        return this;
    }

    font_kerning(): string;
    font_kerning(value: string): this;
    /**
     * {Font Kerning}
     * Controls the usage of the kerning information (how letters are spaced). The equivalent of CSS attribute `fontKerning`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    font_kerning(value?: string): string | this {
        if (value == null) { return this.style.fontKerning; }
        this.style.fontKerning = value;
        return this;
    }

    font_language_override(): string;
    font_language_override(value: string): this;
    /**
     * {Font Language Override}
     * Controls the usage of language-specific glyphs in a typeface.
     * The equivalent of CSS attribute `fontLanguageOverride`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the attribute's value if `value` is `null`, otherwise returns the instance for chaining.
     * @docs
     */
    font_language_override(value?: string): string | this {
        if (value == null) { return (this.style as any).fontLanguageOverride; }
        (this.style as any).fontLanguageOverride = value;
        return this;
    }

    font_size(): string;
    font_size(value: string | number): this;
    /**
     * {Font size}
     * Specifies the font size of text. The equivalent of CSS attribute `fontSize`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    font_size(value?: string | number): string | this {
        if (value == null) { return this.style.fontSize; }
        this.style.fontSize = this.pad_numeric(value);
        return this;
    }

    font_size_adjust(): string;
    font_size_adjust(value: string): this;
    /**
     * {Font Size Adjust}
     * Preserves the readability of text when font fallback occurs. The equivalent of CSS attribute `fontSizeAdjust`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    font_size_adjust(value?: string): string | this {
        if (value == null) { return this.style.fontSizeAdjust; }
        this.style.fontSizeAdjust = value;
        return this;
    }

    font_stretch(): string;
    font_stretch(value: string): this;
    /**
     * {Font Stretch}
     * Selects a normal, condensed, or expanded face from a font family.
     * The equivalent of CSS attribute `fontStretch`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining, unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    font_stretch(value?: string): string | this {
        if (value == null) { return this.style.fontStretch; }
        this.style.fontStretch = value;
        return this;
    }

    font_style(): string;
    font_style(value: string): this;
    /**
     * {Font Style}
     * Specifies the font style for text. The equivalent of CSS attribute `fontStyle`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    font_style(value?: string): string | this {
        if (value == null) { return this.style.fontStyle; }
        this.style.fontStyle = value;
        return this;
    }

    font_synthesis(): string;
    font_synthesis(value: string): this;
    /**
     * {Font synthesis}
     * Controls which missing typefaces (bold or italic) may be synthesized by the browser. The equivalent of CSS attribute `fontSynthesis`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    font_synthesis(value?: string): string | this {
        if (value == null) { return this.style.fontSynthesis; }
        this.style.fontSynthesis = value;
        return this;
    }

    font_variant(): string;
    font_variant(value: string): this;
    /**
     * {Font Variant}
     * Specifies whether or not a text should be displayed in a small-caps font. The equivalent of CSS attribute `fontVariant`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    font_variant(value?: string): string | this {
        if (value == null) { return this.style.fontVariant; }
        this.style.fontVariant = value;
        return this;
    }

    font_variant_alternates(): string;
    font_variant_alternates(value: string): this;
    /**
     * {Font variant alternates}
     * Controls the usage of alternate glyphs associated to alternative names defined in \@font-feature-values.
     * The equivalent of CSS attribute `fontVariantAlternates`.
     * @returns Returns the attribute value when parameter `value` is `null`. Otherwise, returns the instance of the element for chaining.
     * @docs
     */
    font_variant_alternates(value?: string): string | this {
        if (value == null) { return this.style.fontVariantAlternates; }
        this.style.fontVariantAlternates = value;
        return this;
    }

    font_variant_caps(): string;
    font_variant_caps(value: string): this;
    /**
     * {Font Variant Caps}
     * Controls the usage of alternate glyphs for capital letters. The equivalent of CSS attribute `fontVariantCaps`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    font_variant_caps(value?: string): string | this {
        if (value == null) { return this.style.fontVariantCaps; }
        this.style.fontVariantCaps = value;
        return this;
    }

    font_variant_east_asian(): string;
    font_variant_east_asian(value: string): this;
    /**
     * {Font Variant East Asian}
     * Controls the usage of alternate glyphs for East Asian scripts (e.g Japanese and Chinese).
     * The equivalent of CSS attribute `fontVariantEastAsian`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute's value if `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    font_variant_east_asian(value?: string): string | this {
        if (value == null) { return this.style.fontVariantEastAsian; }
        this.style.fontVariantEastAsian = value;
        return this;
    }

    font_variant_ligatures(): string;
    font_variant_ligatures(value: string): this;
    /**
     * {Font Variant Ligatures}
     * Controls which ligatures and contextual forms are used in textual content of the elements it applies to. The equivalent of CSS attribute `fontVariantLigatures`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    font_variant_ligatures(value?: string): string | this {
        if (value == null) { return this.style.fontVariantLigatures; }
        this.style.fontVariantLigatures = value;
        return this;
    }

    font_variant_numeric(): string;
    font_variant_numeric(value: string): this;
    /**
     * {Font Variant Numeric}
     * Controls the usage of alternate glyphs for numbers, fractions, and ordinal markers.
     * The equivalent of CSS attribute `fontVariantNumeric`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    font_variant_numeric(value?: string): string | this {
        if (value == null) { return this.style.fontVariantNumeric; }
        this.style.fontVariantNumeric = value;
        return this;
    }

    font_variant_position(): string;
    font_variant_position(value: string): this;
    /**
     * {Font Variant Position}
     * Controls the usage of alternate glyphs of smaller size positioned as superscript or subscript regarding the baseline of the font.
     * The equivalent of CSS attribute `fontVariantPosition`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    font_variant_position(value?: string): string | this {
        if (value == null) { return this.style.fontVariantPosition; }
        this.style.fontVariantPosition = value;
        return this;
    }

    font_weight(): string;
    font_weight(value: string | number): this;
    /**
     * {Font Weight}
     * Specifies the weight of a font, equivalent to the CSS attribute `fontWeight`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute's value if `value` is `null`, otherwise returns the instance for chaining.
     * @docs
     */
    font_weight(value?: string | number): string | this {
        if (value == null) { return this.style.fontWeight; }
        this.style.fontWeight = value.toString();
        return this;
    }

    gap(): string;
    gap(value: string | number): this;
    /**
     * {Gap}
     * A shorthand property for the row-gap and the column-gap properties. The equivalent of CSS attribute `gap`.
     * @returns Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    gap(value?: string | number): string | this {
        if (value == null) { return this.style.gap; }
        this.style.gap = this.pad_numeric(value);
        return this;
    }

    grid(): string;
    grid(value: string): this;
    /**
     * {Grid}
     * A shorthand property for the grid-template-rows, grid-template-columns, grid-template-areas, grid-auto-rows, grid-auto-columns, and the grid-auto-flow properties. The equivalent of CSS attribute `grid`. Returns the attribute value when parameter `value` is `null`.
     * @returns Returns the attribute's value when `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    grid(value?: string): string | this {
        if (value == null) { return this.style.grid; }
        this.style.grid = value;
        return this;
    }

    grid_area(): string;
    grid_area(value: string): this;
    /**
     * {Grid Area}
     * Either specifies a name for the grid item, or serves as a shorthand for grid-row-start, grid-column-start, grid-row-end, and grid-column-end properties.
     * The equivalent of CSS attribute `gridArea`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless `value` is `null`, in which case the attribute's value is returned.
     * @docs
     */
    grid_area(value?: string): string | this {
        if (value == null) { return this.style.gridArea; }
        this.style.gridArea = value;
        return this;
    }

    grid_auto_columns(): string;
    grid_auto_columns(value: string | number): this;
    /**
     * {Grid Auto Columns}
     * Specifies a default column size, equivalent to the CSS attribute `gridAutoColumns`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    grid_auto_columns(value?: string | number): string | this {
        if (value == null) { return this.style.gridAutoColumns; }
        this.style.gridAutoColumns = value.toString();
        return this;
    }

    grid_auto_flow(): string;
    grid_auto_flow(value: string): this;
    /**
     * {Grid Auto Flow}
     * Specifies how auto-placed items are inserted in the grid. The equivalent of CSS attribute `gridAutoFlow`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the attribute's value when `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    grid_auto_flow(value?: string): string | this {
        if (value == null) { return this.style.gridAutoFlow; }
        this.style.gridAutoFlow = value;
        return this;
    }

    grid_auto_rows(): string;
    grid_auto_rows(value: string | number): this;
    /**
     * {Grid auto rows}
     * Specifies a default row size, equivalent to the CSS attribute `gridAutoRows`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    grid_auto_rows(value?: string | number): string | this {
        if (value == null) { return this.style.gridAutoRows; }
        this.style.gridAutoRows = value.toString();
        return this;
    }

    grid_column(): string;
    grid_column(value: string): this;
    /**
     * {Grid Column}
     * A shorthand property for the grid-column-start and the grid-column-end properties.
     * The equivalent of CSS attribute `gridColumn`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    grid_column(value?: string): string | this {
        if (value == null) { return this.style.gridColumn; }
        this.style.gridColumn = value;
        return this;
    }

    grid_column_end(): string;
    grid_column_end(value: string | number): this;
    /**
     * {Grid Column End}
     * Specifies where to end the grid item. The equivalent of CSS attribute `gridColumnEnd`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    grid_column_end(value?: string | number): string | this {
        if (value == null) { return this.style.gridColumnEnd; }
        this.style.gridColumnEnd = value.toString();
        return this;
    }

    grid_column_gap(): string;
    grid_column_gap(value: string | number): this;
    /**
     * {Grid Column Gap}
     * Specifies the size of the gap between columns. The equivalent of CSS attribute `gridColumnGap`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    grid_column_gap(value?: string | number): this | string {
        if (value == null) { return this.style.gridColumnGap; }
        this.style.gridColumnGap = this.pad_numeric(value);
        return this;
    }

    grid_column_start(): string;
    grid_column_start(value: string | number): this;
    /**
     * {Grid Column Start}
     * Specifies where to start the grid item. This is the equivalent of the CSS attribute `gridColumnStart`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the current value of the grid column start when `null` is passed, otherwise returns the instance for chaining.
     * @docs
     */
    grid_column_start(value?: string | number): string | this {
        if (value == null) { return this.style.gridColumnStart; }
        this.style.gridColumnStart = value.toString();
        return this;
    }

    grid_gap(): string;
    grid_gap(value: string | number): this;
    /**
     * {Grid Gap}
     * A shorthand property for the grid-row-gap and grid-column-gap properties.
     * The equivalent of CSS attribute `gridGap`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    grid_gap(value?: string | number): string | this {
        if (value == null) { return this.style.gridGap; }
        this.style.gridGap = this.pad_numeric(value);
        return this;
    }

    grid_row(): string;
    grid_row(value: string): this;
    /**
     * {Grid Row}
     * A shorthand property for the grid-row-start and the grid-row-end properties.
     * The equivalent of CSS attribute `gridRow`.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    grid_row(value?: string): string | this {
        if (value == null) { return this.style.gridRow; }
        this.style.gridRow = value;
        return this;
    }

    grid_row_end(): string;
    grid_row_end(value: string): this;
    /**
     * {Grid Row End}
     * Specifies where to end the grid item. The equivalent of CSS attribute `gridRowEnd`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    grid_row_end(value?: string): string | this {
        if (value == null) { return this.style.gridRowEnd; }
        this.style.gridRowEnd = value;
        return this;
    }

    grid_row_gap(): string;
    grid_row_gap(value: string | number): this;
    /**
     * {Grid Row Gap}
     * Specifies the size of the gap between rows. The equivalent of CSS attribute `gridRowGap`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    grid_row_gap(value?: string | number): string | this {
        if (value == null) { return this.style.gridRowGap; }
        this.style.gridRowGap = this.pad_numeric(value);
        return this;
    }

    grid_row_start(): string;
    grid_row_start(value: string | number): this;
    /**
     * {Grid Row Start}
     * Specifies where to start the grid item, equivalent to CSS attribute `gridRowStart`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    grid_row_start(value?: string | number): string | this {
        if (value == null) { return this.style.gridRowStart; }
        this.style.gridRowStart = value.toString();
        return this;
    }

    grid_template(): string;
    grid_template(value: string): this;
    /**
     * {Grid Template}
     * A shorthand property for the grid-template-rows, grid-template-columns and grid-areas properties.
     * The equivalent of CSS attribute `gridTemplate`.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    grid_template(value?: string): string | this {
        if (value == null) { return this.style.gridTemplate; }
        this.style.gridTemplate = value;
        return this;
    }

    grid_template_areas(): string;
    grid_template_areas(value: string): this;
    /**
     * {Grid Template Areas}
     * Specifies how to display columns and rows, using named grid items. The equivalent of CSS attribute `gridTemplateAreas`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    grid_template_areas(value?: string): string | this {
        if (value == null) { return this.style.gridTemplateAreas; }
        this.style.gridTemplateAreas = value;
        return this;
    }

    grid_template_columns(): string;
    grid_template_columns(value: string): this;
    /**
     * {Grid Template Columns}
     * Specifies the size of the columns and how many columns in a grid layout.
     * The equivalent of CSS attribute `gridTemplateColumns`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    grid_template_columns(value?: string): string | this {
        if (value == null) { return this.style.gridTemplateColumns; }
        this.style.gridTemplateColumns = value;
        return this;
    }

    grid_template_rows(): string;
    grid_template_rows(value: string | number): this;
    /**
     * {Grid Template Rows}
     * Specifies the size of the rows in a grid layout, equivalent to the CSS attribute `gridTemplateRows`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    grid_template_rows(value?: string | number): string | this {
        if (value == null) { return this.style.gridTemplateRows; }
        this.style.gridTemplateRows = value.toString();
        return this;
    }

    hanging_punctuation(): string;
    hanging_punctuation(value: string): this;
    /**
     * {Hanging punctuation}
     * Specifies whether a punctuation character may be placed outside the line box. The equivalent of CSS attribute `hangingPunctuation`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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

    hyphens(): string;
    hyphens(value: string): this;
    /**
     * {Hyphens}
     * Sets how to split words to improve the layout of paragraphs. The equivalent of CSS attribute `hyphens`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the attribute's value if `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    hyphens(value?: string): this | string {
        if (value == null) { return this.style.hyphens; }
        this.style.hyphens = value;
        return this;
    }

    image_rendering(): string;
    image_rendering(value: string): this;
    /**
     * {Image Rendering}
     * Specifies the type of algorithm to use for image scaling. The equivalent of CSS attribute `imageRendering`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    image_rendering(value?: string): string | this {
        if (value == null) { return this.style.imageRendering; }
        this.style.imageRendering = value;
        return this;
    }

    inline_size(): string;
    inline_size(value: string | number): this;
    /**
     * {Inline Size}
     * Specifies the size of an element in the inline direction.
     * The equivalent of CSS attribute `inlineSize`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    inline_size(value?: string | number): string | this {
        if (value == null) { return this.style.inlineSize; }
        this.style.inlineSize = this.pad_numeric(value);
        return this;
    }

    inset(): string;
    inset(value: string | number): this;
    /**
     * {Inset}
     * Specifies the distance between an element and the parent element.
     * The equivalent of CSS attribute `inset`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining, unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    inset(value?: string | number): string | this {
        if (value == null) { return this.style.inset; }
        this.style.inset = this.pad_numeric(value);
        return this;
    }

    inset_block(): string | undefined;
    inset_block(value: string | number): this;
    /**
     * {Inset Block}
     * Specifies the distance between an element and the parent element in the block direction.
     * The equivalent of CSS attribute `insetBlock`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    inset_block(value?: string | number): string | this | undefined {
        if (value == null) { return this.style.insetBlock; }
        this.style.insetBlock = this.pad_numeric(value);
        return this;
    }

    inset_block_end(): string;
    inset_block_end(value: string | number): this;
    /**
     * {Inset Block End}
     * Specifies the distance between the end of an element and the parent element in the block direction.
     * The equivalent of CSS attribute `insetBlockEnd`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    inset_block_end(value?: string | number): string | this {
        if (value == null) { return this.style.insetBlockEnd ?? ""; }
        this.style.insetBlockEnd = this.pad_numeric(value);
        return this;
    }

    inset_block_start(): string;
    inset_block_start(value: string | number): this;
    /**
     * {Inset Block Start}
     * Specifies the distance between the start of an element and the parent element in the block direction.
     * The equivalent of CSS attribute `insetBlockStart`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    inset_block_start(value?: string | number): string | this {
        if (value == null) { return this.style.insetBlockStart; }
        this.style.insetBlockStart = this.pad_numeric(value);
        return this;
    }

    inset_inline(): string;
    inset_inline(value: string | number): this;
    /**
     * {Inset inline}
     * Specifies the distance between an element and the parent element in the inline direction.
     * The equivalent of CSS attribute `insetInline`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    inset_inline(value?: string | number): this | string {
        if (value == null) { return this.style.insetInline; }
        this.style.insetInline = this.pad_numeric(value);
        return this;
    }

    inset_inline_end(): string;
    inset_inline_end(value: string | number): this;
    /**
     * {Inset Inline End}
     * Specifies the distance between the end of an element and the parent element in the inline direction.
     * The equivalent of CSS attribute `insetInlineEnd`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute's value when `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    inset_inline_end(value?: string | number): string | this {
        if (value == null) { return this.style.insetInlineEnd; }
        this.style.insetInlineEnd = this.pad_numeric(value);
        return this;
    }

    inset_inline_start(): string;
    inset_inline_start(value: string | number): this;
    /**
     * {Inset Inline Start}
     * Specifies the distance between the start of an element and the parent element in the inline direction.
     * The equivalent of CSS attribute `insetInlineStart`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    inset_inline_start(value?: string | number): this | string {
        if (value == null) { return this.style.insetInlineStart; }
        this.style.insetInlineStart = this.pad_numeric(value);;
        return this;
    }

    isolation(): string;
    isolation(value: string): this;
    /**
     * {Isolation}
     * Defines whether an element must create a new stacking content.
     * The equivalent of CSS attribute `isolation`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    isolation(value?: string): string | this {
        if (value == null) { return this.style.isolation; }
        this.style.isolation = value;
        return this;
    }

    justify_content(): string;
    justify_content(value: string): this;
    /**
     * {Justify Content}
     * Specifies the alignment between the items inside a flexible container when the items do not use all available space. The equivalent of CSS attribute `justifyContent`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute's value when parameter `value` is `null`. Otherwise, returns the instance of the element for chaining.
     * @docs
     */
    justify_content(value?: string): string | this {
        if (value == null) { return this.style.justifyContent; }
        this.style.justifyContent = value;
        (this.style as any).msJustifyContent = value;
        (this.style as any).webkitJustifyContent = value;
        (this.style as any).MozJustifyContent = value;
        (this.style as any).OJustifyContent = value;
        return this;
    }

    justify_items(): string;
    justify_items(value: string): this;
    /**
     * {Justify Items}
     * Sets the alignment of grid items in the inline direction on the grid container.
     * The equivalent of the CSS attribute `justify-items`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining, unless `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    justify_items(value?: string): string | this {
        if (value == null) { return this.style.justifyItems; }
        this.style.justifyItems = value;
        return this;
    }

    justify_self(): string;
    justify_self(value: string): this;
    /**
     * {Justify Self}
     * Sets the alignment of the grid item in the inline direction. This corresponds to the CSS attribute `justify-self`.
     * When the parameter `value` is `null`, it retrieves the current attribute value.
     * @param value The value to assign for alignment. Passing `null` retrieves the current value.
     * @returns Returns the current alignment value if `value` is `null`, otherwise returns the instance for chaining.
     * @docs
     */
    justify_self(value?: string): string | this {
        if (value == null) { return this.style.justifySelf; }
        this.style.justifySelf = value;
        return this;
    }

    left(): string;
    left(value: string | number): this;
    /**
     * {Left}
     * Specifies the left position of a positioned element. The equivalent of CSS attribute `left`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    left(value?: string | number): string | this {
        if (value == null) { return this.style.left; }
        this.style.left = this.pad_numeric(value);
        return this;
    }

    letter_spacing(): string;
    letter_spacing(value: string | number): this;
    /**
     * {Letter spacing}
     * Increases or decreases the space between characters in a text.
     * The equivalent of CSS attribute `letterSpacing`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    letter_spacing(value?: string | number): string | this {
        if (value == null) { return this.style.letterSpacing; }
        this.style.letterSpacing = this.pad_numeric(value);
        return this;
    }

    line_break(): string;
    line_break(value: string): this;
    /**
     * {Line Break}
     * Specifies how/if to break lines. The equivalent of CSS attribute `lineBreak`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    line_break(value?: string): string | this {
        if (value == null) { return this.style.lineBreak; }
        this.style.lineBreak = value;
        return this;
    }

    line_height(): string;
    line_height(value: string | number): this;
    /**
     * {Line Height}
     * Sets the line height, equivalent to the CSS attribute `lineHeight`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    line_height(value?: string | number): string | this {
        if (value == null) { return this.style.lineHeight; }
        this.style.lineHeight = this.pad_numeric(value);
        return this;
    }

    list_style(): string;
    list_style(value: string): this;
    /**
     * {List Style}
     * Sets all the properties for a list in one declaration. The equivalent of CSS attribute `listStyle`.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    list_style(value?: string): string | this {
        if (value == null) { return this.style.listStyle; }
        this.style.listStyle = value;
        return this;
    }

    list_style_image(): string;
    list_style_image(value: string): this;
    /**
     * {List style image}
     * Specifies an image as the list-item marker. The equivalent of CSS attribute `listStyleImage`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    list_style_image(value?: string): string | this {
        if (value == null) { return this.style.listStyleImage; }
        this.style.listStyleImage = value;
        return this;
    }

    list_style_position(): string;
    list_style_position(value: string): this;
    /**
     * {List Style Position}
     * Specifies the position of the list-item markers (bullet points).
     * The equivalent of CSS attribute `listStylePosition`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute's value when `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    list_style_position(value?: string): string | this {
        if (value == null) { return this.style.listStylePosition; }
        this.style.listStylePosition = value;
        return this;
    }

    list_style_type(): string;
    list_style_type(value: string): this;
    /**
     * {List style type}
     * Specifies the type of list-item marker. The equivalent of CSS attribute `listStyleType`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    list_style_type(value?: string): string | this {
        if (value == null) { return this.style.listStyleType; }
        this.style.listStyleType = value;
        return this;
    }

    margin_block(): string;
    margin_block(value: string | number): this;
    /**
     * {Margin Block}
     * Specifies the margin in the block direction.
     * The equivalent of CSS attribute `marginBlock`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    margin_block(value?: string | number): this | string {
        if (value == null) { return this.style.marginBlock; }
        this.style.marginBlock = this.pad_numeric(value);
        return this;
    }

    margin_block_end(): string;
    margin_block_end(value: string | number): this;
    /**
     * {Margin Block End}
     * Specifies the margin at the end in the block direction.
     * The equivalent of CSS attribute `marginBlockEnd`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    margin_block_end(value?: string | number): string | this {
        if (value == null) { return this.style.marginBlockEnd; }
        this.style.marginBlockEnd = this.pad_numeric(value);
        return this;
    }

    margin_block_start(): string;
    margin_block_start(value: string | number): this;
    /**
     * {Margin Block Start}
     * Specifies the margin at the start in the block direction.
     * The equivalent of CSS attribute `marginBlockStart`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    margin_block_start(value?: string | number): this | string {
        if (value == null) { return this.style.marginBlockStart; }
        this.style.marginBlockStart = this.pad_numeric(value);
        return this;
    }

    margin_inline(): string;
    margin_inline(value: string | number): this;
    /**
     * {Margin Inline}
     * Specifies the margin in the inline direction. The equivalent of CSS attribute `marginInline`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    margin_inline(value?: string | number): string | this {
        if (value == null) { return this.style.marginInline; }
        this.style.marginInline = this.pad_numeric(value);
        return this;
    }

    margin_inline_end(): string;
    margin_inline_end(value: string | number): this;
    /**
     * {Margin Inline End}
     * Specifies the margin at the end in the inline direction. This is the equivalent of the CSS attribute `marginInlineEnd`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    margin_inline_end(value?: string | number): string | this {
        if (value == null) { return this.style.marginInlineEnd; }
        this.style.marginInlineEnd = this.pad_numeric(value);
        return this;
    }

    margin_inline_start(): string;
    margin_inline_start(value: string | number): this;
    /**
     * {Margin Inline Start}
     * Specifies the margin at the start in the inline direction.
     * The equivalent of CSS attribute `marginInlineStart`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    margin_inline_start(value?: string | number): string | this {
        if (value == null) { return this.style.marginInlineStart; }
        this.style.marginInlineStart = this.pad_numeric(value);
        return this;
    }

    mask(): string;
    mask(value: string): this;
    /**
     * {Mask}
     * Hides parts of an element by masking or clipping an image at specific places.
     * The equivalent of CSS attribute `mask`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    mask(value?: string): string | this {
        if (value == null) { return this.style.mask; }
        this.style.mask = value;
        (this.style as any).msMask = value;
        (this.style as any).webkitMask = value;
        (this.style as any).MozMask = value;
        (this.style as any).OMask = value;
        return this;
    }

    mask_clip(): string;
    mask_clip(value: string): this;
    /**
     * {Mask clip}
     * Specifies the mask area. The equivalent of CSS attribute `maskClip`.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    mask_clip(value?: string): string | this {
        if (value == null) { return this.style.maskClip; }
        this.style.maskClip = value;
        return this;
    }

    mask_composite(): string;
    mask_composite(value: string): this;
    /**
     * {Mask Composite}
     * Represents a compositing operation used on the current mask layer with the mask layers below it.
     * The equivalent of CSS attribute `maskComposite`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    mask_composite(value?: string): string | this {
        if (value == null) { return this.style.maskComposite; }
        this.style.maskComposite = value;
        (this.style as any).msMaskComposite = value;
        (this.style as any).webkitMaskComposite = value;
        (this.style as any).MozMaskComposite = value;
        (this.style as any).OMaskComposite = value;
        return this;
    }

    mask_image(): string;
    mask_image(value: string): this;
    /**
     * {Mask Image}
     * Specifies an image to be used as a mask layer for an element.
     * The equivalent of CSS attribute `maskImage`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    mask_image(value?: string): string | this {
        if (value == null) { return this.style.maskImage; }
        this.style.maskImage = value;
        (this.style as any).msMaskImage = value;
        (this.style as any).webkitMaskImage = value;
        (this.style as any).MozMaskImage = value;
        (this.style as any).OMaskImage = value;
        return this;
    }

    mask_mode(): string;
    mask_mode(value: string): this;
    /**
     * {Mask Mode}
     * Specifies whether the mask layer image is treated as a luminance mask or as an alpha mask.
     * The equivalent of CSS attribute `maskMode`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    mask_mode(value?: string): string | this {
        if (value == null) { return this.style.maskMode; }
        this.style.maskMode = value;
        return this;
    }

    mask_origin(): string;
    mask_origin(value: string): this;
    /**
     * {Mask origin}
     * Specifies the origin position (the mask position area) of a mask layer image. The equivalent of CSS attribute `maskOrigin`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    mask_origin(value?: string): string | this {
        if (value == null) { return this.style.maskOrigin; }
        this.style.maskOrigin = value;
        return this;
    }

    mask_position(): string;
    mask_position(value: string): this;
    /**
     * {Mask Position}
     * Sets the starting position of a mask layer image (relative to the mask position area).
     * The equivalent of CSS attribute `maskPosition`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    mask_position(value?: string): string | this {
        if (value == null) { return this.style.maskPosition; }
        this.style.maskPosition = value;
        return this;
    }

    mask_repeat(): string;
    mask_repeat(value: string): this;
    /**
     * {Mask Repeat}
     * Specifies how the mask layer image is repeated. The equivalent of CSS attribute `maskRepeat`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    mask_repeat(value?: string): string | this {
        if (value == null) { return this.style.maskRepeat; }
        this.style.maskRepeat = value;
        return this;
    }

    mask_size(): string;
    mask_size(value: string | number): this;
    /**
     * {Mask Size}
     * Specifies the size of a mask layer image. The equivalent of CSS attribute `maskSize`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    mask_size(value?: string | number): this | string {
        if (value == null) { return this.style.maskSize; }
        this.style.maskSize = this.pad_numeric(value);
        return this;
    }

    mask_type(): string;
    mask_type(value: string): this;
    /**
     * {Mask type}
     * Specifies whether an SVG \<mask> element is treated as a luminance mask or as an alpha mask.
     * The equivalent of CSS attribute `maskType`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    mask_type(value?: string): string | this {
        if (value == null) { return this.style.maskType; }
        this.style.maskType = value;
        return this;
    }

    max_height(): number | string;
    max_height(value: string | number): this;
    /**
     * {Max height}
     * Sets the maximum height of an element. This is the equivalent of the CSS attribute `maxHeight`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    max_height(value?: string | number): this | number | string {
        if (value == null) { return this.style.maxHeight; }
        this.style.maxHeight = this.pad_numeric(value);
        return this;
    }

    max_width(): number | string;
    max_width(value: string | number): this;
    /**
     * {Max Width}
     * Sets the maximum width of an element. The equivalent of CSS attribute `maxWidth`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    max_width(value?: string | number): this | number | string {
        if (value == null) { return this.style.maxWidth; }
        this.style.maxWidth = this.pad_numeric(value);
        return this;
    }

    max_block_size(): string;
    max_block_size(value: string | number): this;
    /**
     * {Max Block Size}
     * Sets the maximum size of an element in the block direction.
     * The equivalent of CSS attribute `maxBlockSize`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    max_block_size(value?: string | number): this | string {
        if (value == null) { return this.style.maxBlockSize; }
        this.style.maxBlockSize = this.pad_numeric(value);
        return this;
    }

    max_inline_size(): string | number;
    max_inline_size(value: string | number): this;
    /**
     * {Max inline size}
     * Sets the maximum size of an element in the inline direction.
     * The equivalent of CSS attribute `maxInlineSize`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    max_inline_size(value?: string | number): string | number | this {
        if (value == null) { return this.style.maxInlineSize; }
        this.style.maxInlineSize = this.pad_numeric(value);
        return this;
    }

    min_block_size(): null | number;
    min_block_size(value: number): this;
    /**
     * {Min Block Size}
     * Sets the minimum size of an element in the block direction. The equivalent of CSS attribute `minBlockSize`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    min_block_size(value?: number): this | null | number {
        if (value == null) { return this._try_parse_float(this.style.minBlockSize, null); }
        this.style.minBlockSize = this.pad_numeric(value);
        return this;
    }

    min_inline_size(): string;
    min_inline_size(value: string | number): this;
    /**
     * {Min Inline Size}
     * Sets the minimum size of an element in the inline direction. The equivalent of CSS attribute `minInlineSize`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    min_inline_size(value?: string | number): string | this {
        if (value == null) { return this.style.minInlineSize; }
        this.style.minInlineSize = this.pad_numeric(value);
        return this;
    }

    mix_blend_mode(): string;
    mix_blend_mode(value: string): this;
    /**
     * {Mix Blend Mode}
     * Specifies how an element's content should blend with its direct parent background, equivalent to the CSS attribute `mixBlendMode`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    mix_blend_mode(value?: string): string | this {
        if (value == null) { return this.style.mixBlendMode; }
        this.style.mixBlendMode = value;
        return this;
    }

    object_fit(): string;
    object_fit(value: string): this;
    /**
     * {Object fit}
     * Specifies how the contents of a replaced element should be fitted to the box established by its used height and width.
     * The equivalent of CSS attribute `objectFit`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the attribute's value when `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    object_fit(value?: string): string | this {
        if (value == null) { return this.style.objectFit; }
        this.style.objectFit = value;
        return this;
    }

    object_position(): string;
    object_position(value: string): this;
    /**
     * {Object position}
     * Specifies the alignment of the replaced element inside its box. The equivalent of CSS attribute `objectPosition`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    object_position(value?: string): string | this {
        if (value == null) { return this.style.objectPosition; }
        this.style.objectPosition = value;
        return this;
    }

    offset(): string;
    offset(value: string | number): this;
    /**
     * {Offset}
     * Is a shorthand, and specifies how to animate an element along a path. The equivalent of CSS attribute `offset`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    offset(value?: string | number): this | string {
        if (value == null) { return this.style.offset; }
        this.style.offset = value.toString();
        return this;
    }

    offset_anchor(): string;
    offset_anchor(value: string): this;
    /**
     * {Offset Anchor}
     * Specifies a point on an element that is fixed to the path it is animated along. The equivalent of CSS attribute `offsetAnchor`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    offset_anchor(value?: string): string | this {
        if (value == null) { return this.style.offsetAnchor; }
        this.style.offsetAnchor = value;
        return this;
    }

    offset_distance(): string;
    offset_distance(value: string | number): this;
    /**
     * {Offset distance}
     * Specifies the position along a path where an animated element is placed.
     * The equivalent of CSS attribute `offsetDistance`.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    offset_distance(value?: string | number): string | this {
        if (value == null) { return this.style.offsetDistance; }
        this.style.offsetDistance = value.toString();
        return this;
    }

    offset_path(): string;
    offset_path(value: string): this;
    /**
     * {Offset Path}
     * Specifies the path an element is animated along.
     * The equivalent of CSS attribute `offsetPath`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    offset_path(value?: string): string | this {
        if (value == null) { return this.style.offsetPath; }
        this.style.offsetPath = value;
        return this;
    }

    offset_rotate(): string;
    offset_rotate(value: string | number): this;
    /**
     * {Offset Rotate}
     * Specifies rotation of an element as it is animated along a path.
     * The equivalent of CSS attribute `offsetRotate`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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

    order(): string;
    order(value: string | number): this;
    /**
     * {Order}
     * Sets the order of the flexible item, relative to the rest. The equivalent of CSS attribute `order`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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

    orphans(): null | number;
    orphans(value: number): this;
    /**
     * {Orphans}
     * Sets the minimum number of lines that must be left at the bottom of a page or column.
     * The equivalent of CSS attribute `orphans`. Returns the attribute value when parameter
     * `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining. If `value` is `null`, the attribute's value is returned.
     * @docs
     */
    orphans(value?: number): this | number | null {
        if (value == null) { return this._try_parse_float(this.style.orphans, null); }
        this.style.orphans = value.toString();
        return this;
    }

    outline(): string;
    outline(value: string): this;
    /**
     * {Outline}
     * A shorthand property for the outline-width, outline-style, and the outline-color properties.
     * The equivalent of CSS attribute `outline`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    outline(value?: string): string | this {
        if (value == null) { return this.style.outline; }
        this.style.outline = value;
        return this;
    }

    outline_color(): string;
    outline_color(value: string): this;
    /**
     * {Outline Color}
     * Sets the color of an outline. This is the equivalent of the CSS attribute `outlineColor`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless the parameter `value` is `null`,
     * in which case the attribute's value is returned.
     * @docs
     */
    outline_color(value?: string): string | this {
        if (value == null) { return this.style.outlineColor; }
        this.style.outlineColor = value;
        return this;
    }

    outline_offset(): string;
    outline_offset(value: string | number): this;
    /**
     * {Outline Offset}
     * Offsets an outline, and draws it beyond the border edge. The equivalent of CSS attribute `outlineOffset`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    outline_offset(value?: string | number): string | this {
        if (value == null) { return this.style.outlineOffset; }
        this.style.outlineOffset = value.toString();
        return this;
    }

    outline_style(): string;
    outline_style(value: string): this;
    /**
     * {Outline Style}
     * Sets the style of an outline. The equivalent of CSS attribute `outlineStyle`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    outline_style(value?: string): string | this {
        if (value == null) { return this.style.outlineStyle; }
        this.style.outlineStyle = value;
        return this;
    }

    outline_width(): string;
    outline_width(value: string | number): this;
    /**
     * {Outline Width}
     * Sets the width of an outline, equivalent to the CSS attribute `outlineWidth`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    outline_width(value?: string | number): string | this {
        if (value == null) { return this.style.outlineWidth; }
        this.style.outlineWidth = this.pad_numeric(value);
        return this;
    }

    overflow(): string;
    overflow(value: string): this;
    /**
     * {Overflow}
     * Specifies what happens if content overflows an element's box.
     * The equivalent of CSS attribute `overflow`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute's value if `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    overflow(value?: string): string | this {
        if (value == null) { return this.style.overflow; }
        this.style.overflow = value;
        return this;
    }

    overflow_anchor(): string;
    overflow_anchor(value: string): this;
    /**
     * {Overflow Anchor}
     * Specifies whether or not content in viewable area in a scrollable container should be pushed down when new content is loaded above.
     * The equivalent of CSS attribute `overflowAnchor`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    overflow_anchor(value?: string): string | this {
        if (value == null) { return this.style.overflowAnchor; }
        this.style.overflowAnchor = value;
        return this;
    }

    overflow_wrap(): string;
    overflow_wrap(value: string): this;
    /**
     * {Overflow Wrap}
     * Specifies whether or not the browser can break lines with long words, if they overflow the container. The equivalent of CSS attribute `overflowWrap`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    overflow_wrap(value?: string): string | this {
        if (value == null) { return this.style.overflowWrap; }
        this.style.overflowWrap = value;
        return this;
    }

    overflow_x(): string;
    overflow_x(value: string): this;
    /**
     * {Overflow x}
     * Specifies whether or not to clip the left/right edges of the content, if it overflows the element's content area.
     * The equivalent of CSS attribute `overflowX`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    overflow_x(value?: string): string | this {
        if (value == null) { return this.style.overflowX; }
        this.style.overflowX = value;
        return this;
    }

    overflow_y(): string;
    overflow_y(value: string): this;
    /**
     * {Overflow Y}
     * Specifies whether or not to clip the top/bottom edges of the content, if it overflows the element's content area.
     * The equivalent of CSS attribute `overflowY`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    overflow_y(value?: string): string | this {
        if (value == null) { return this.style.overflowY; }
        this.style.overflowY = value;
        return this;
    }

    overscroll_behavior(): string;
    overscroll_behavior(value: string): this;
    /**
     * {Overscroll behavior}
     * Specifies whether to have scroll chaining or overscroll affordance in x- and y-directions. The equivalent of CSS attribute `overscrollBehavior`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    overscroll_behavior(value?: string): string | this {
        if (value == null) { return this.style.overscrollBehavior; }
        this.style.overscrollBehavior = value;
        return this;
    }

    overscroll_behavior_block(): string;
    overscroll_behavior_block(value: string): this;
    /**
     * {Overscroll behavior block}
     * Specifies whether to have scroll chaining or overscroll affordance in the block direction.
     * The equivalent of CSS attribute `overscrollBehaviorBlock`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    overscroll_behavior_block(value?: string): string | this {
        if (value == null) { return this.style.overscrollBehaviorBlock; }
        this.style.overscrollBehaviorBlock = value;
        return this;
    }

    overscroll_behavior_inline(): string;
    overscroll_behavior_inline(value: string): this;
    /**
     * {Overscroll Behavior Inline}
     * Specifies whether to have scroll chaining or overscroll affordance in the inline direction.
     * The equivalent of CSS attribute `overscrollBehaviorInline`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining. If `value` is `null`, returns the attribute's value.
     * @docs
     */
    overscroll_behavior_inline(value?: string): string | this {
        if (value == null) { return this.style.overscrollBehaviorInline; }
        this.style.overscrollBehaviorInline = value;
        return this;
    }

    overscroll_behavior_x(): string;
    overscroll_behavior_x(value: string): this;
    /**
     * {Overscroll Behavior X}
     * Specifies whether to have scroll chaining or overscroll affordance in x-direction.
     * The equivalent of CSS attribute `overscrollBehaviorX`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    overscroll_behavior_x(value?: string): string | this {
        if (value == null) { return this.style.overscrollBehaviorX; }
        this.style.overscrollBehaviorX = value;
        return this;
    }

    overscroll_behavior_y(): string;
    overscroll_behavior_y(value: string): this;
    /**
     * {Overscroll behavior y}
     * Specifies whether to have scroll chaining or overscroll affordance in y-directions.
     * The equivalent of CSS attribute `overscrollBehaviorY`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute value when parameter `value` is `null`. Otherwise, returns the `VElement` object for chaining.
     * @docs
     */
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

    padding_block(): string | undefined;
    padding_block(value: string | number): this;
    /**
     * {Padding Block}
     * Specifies the padding in the block direction. The equivalent of CSS attribute `paddingBlock`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    padding_block(value?: string | number): string | this | undefined {
        if (value == null) { return this.style.paddingBlock; }
        this.style.paddingBlock = this.pad_numeric(value);;
        return this;
    }

    padding_block_end(): string;
    padding_block_end(value: string | number): this;
    /**
     * {Padding Block End}
     * Specifies the padding at the end in the block direction. The equivalent of CSS attribute `paddingBlockEnd`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    padding_block_end(value?: string | number): string | this {
        if (value == null) { return this.style.paddingBlockEnd; }
        this.style.paddingBlockEnd = this.pad_numeric(value);;
        return this;
    }

    padding_block_start(): string;
    padding_block_start(value: string | number): this;
    /**
     * {Padding Block Start}
     * Specifies the padding at the start in the block direction.
     * The equivalent of CSS attribute `paddingBlockStart`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    padding_block_start(value?: string | number): string | this {
        if (value == null) { return this.style.paddingBlockStart; }
        this.style.paddingBlockStart = this.pad_numeric(value);;
        return this;
    }

    padding_inline(): string;
    padding_inline(value: string | number): this;
    /**
     * {Padding Inline}
     * Specifies the padding in the inline direction. The equivalent of CSS attribute `paddingInline`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    padding_inline(value?: string | number): string | this {
        if (value == null) { return this.style.paddingInline ?? ""; }
        this.style.paddingInline = this.pad_numeric(value);;
        return this;
    }

    padding_inline_end(): string;
    padding_inline_end(value: string | number): this;
    /**
     * {Padding Inline End}
     * Specifies the padding at the end in the inline direction.
     * The equivalent of CSS attribute `paddingInlineEnd`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    padding_inline_end(value?: string | number): string | this {
        if (value == null) { return this.style.paddingInlineEnd; }
        this.style.paddingInlineEnd = this.pad_numeric(value);;
        return this;
    }

    padding_inline_start(): string;
    padding_inline_start(value: string | number): this;
    /**
     * {Padding Inline Start}
     * Specifies the padding at the start in the inline direction. The equivalent of CSS attribute `paddingInlineStart`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining, or the attribute's value if `value` is `null`.
     * @docs
     */
    padding_inline_start(value?: string | number): string | this {
        if (value == null) { return this.style.paddingInlineStart; }
        this.style.paddingInlineStart = this.pad_numeric(value);
        return this;
    }

    page_break_after(): string;
    page_break_after(value: string): this;
    /**
     * {Page break after}
     * Sets the page-break behavior after an element. The equivalent of CSS attribute `pageBreakAfter`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    page_break_after(value?: string): string | this {
        if (value == null) { return this.style.pageBreakAfter; }
        this.style.pageBreakAfter = value;
        return this;
    }

    page_break_before(): string;
    page_break_before(value: string): this;
    /**
     * {Page break before}
     * Sets the page-break behavior before an element. The equivalent of CSS attribute `pageBreakBefore`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    page_break_before(value?: string): string | this {
        if (value == null) { return this.style.pageBreakBefore; }
        this.style.pageBreakBefore = value;
        return this;
    }

    page_break_inside(): string;
    page_break_inside(value: string): this;
    /**
     * {Page Break Inside}
     * Sets the page-break behavior inside an element. The equivalent of CSS attribute `pageBreakInside`.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    page_break_inside(value?: string): string | this {
        if (value == null) { return this.style.pageBreakInside; }
        this.style.pageBreakInside = value;
        return this;
    }

    paint_order(): string;
    paint_order(value: string): this;
    /**
     * {Paint Order}
     * Sets the order of how an SVG element or text is painted. The equivalent of CSS attribute `paintOrder`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute's value when `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    paint_order(value?: string): string | this {
        if (value == null) { return this.style.paintOrder; }
        this.style.paintOrder = value;
        return this;
    }

    perspective(): string;
    perspective(value: string | number): this;
    /**
     * {Perspective}
     * Gives a 3D-positioned element some perspective. The equivalent of CSS attribute `perspective`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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

    perspective_origin(): string;
    perspective_origin(value: string): this;
    /**
     * {Perspective origin}
     * Defines at which position the user is looking at the 3D-positioned element. The equivalent of CSS attribute `perspectiveOrigin`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    perspective_origin(value?: string): string | this {
        if (value == null) { return this.style.perspectiveOrigin; }
        this.style.perspectiveOrigin = value;
        (this.style as any).msPerspectiveOrigin = value;
        (this.style as any).webkitPerspectiveOrigin = value;
        (this.style as any).MozPerspectiveOrigin = value;
        (this.style as any).OPerspectiveOrigin = value;
        return this;
    }

    place_content(): string;
    place_content(value: string): this;
    /**
     * {Place Content}
     * Specifies align-content and justify-content property values for flexbox and grid layouts.
     * The equivalent of CSS attribute `placeContent`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    place_content(value?: string): string | this {
        if (value == null) { return this.style.placeContent; }
        this.style.placeContent = value;
        return this;
    }

    place_items(): string;
    place_items(value: string): this;
    /**
     * {Place items}
     * Specifies align-items and justify-items property values for grid layouts. The equivalent of CSS attribute `placeItems`.
     * @returns Returns the attribute's value when `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    place_items(value?: string): string | this {
        if (value == null) { return this.style.placeItems; }
        this.style.placeItems = value;
        return this;
    }

    place_self(): string;
    place_self(value: string): this;
    /**
     * {Place Self}
     * Specifies align-self and justify-self property values for grid layouts.
     * The equivalent of CSS attribute `placeSelf`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute value when parameter `value` is `null`.
     * Otherwise, returns the instance of the element for chaining.
     * @docs
     */
    place_self(value?: string): string | this {
        if (value == null) { return this.style.placeSelf; }
        this.style.placeSelf = value;
        return this;
    }

    pointer_events(): string;
    pointer_events(value: string): this;
    /**
     * {Pointer events}
     * Defines whether or not an element reacts to pointer events, equivalent to the CSS attribute `pointerEvents`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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

    quotes(): string;
    quotes(value: string): this;
    /**
     * {Quotes}
     * Sets the type of quotation marks for embedded quotations. The equivalent of CSS attribute `quotes`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    quotes(value?: string): string | this {
        if (value == null) { return this.style.quotes; }
        this.style.quotes = value;
        return this;
    }

    resize(): string;
    resize(value: string): this;
    /**
     * {Resize}
     * Defines if (and how) an element is resizable by the user.
     * The equivalent of CSS attribute `resize`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the attribute's value if `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    resize(value?: string): string | this {
        if (value == null) { return this.style.resize; }
        this.style.resize = value;
        return this;
    }

    right(): string;
    right(value: number | string): this;
    /**
     * {Right}
     * Specifies the right position of a positioned element. The equivalent of CSS attribute `right`. Returns the attribute value when parameter `value` is `null`.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    right(value?: number | string): string | this {
        if (value == null) { return this.style.right; }
        this.style.right = this.pad_numeric(value);
        return this;
    }

    row_gap(): string;
    row_gap(value: string | number): this;
    /**
     * {Row Gap}
     * Specifies the gap between the grid rows. The equivalent of CSS attribute `rowGap`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    row_gap(value?: string | number): string | this {
        if (value == null) { return this.style.rowGap; }
        this.style.rowGap = this.pad_numeric(value);
        return this;
    }

    scale(): null | number;
    scale(value: number): this;
    /**
     * {Scale}
     * Specifies the size of an element by scaling up or down. The equivalent of CSS attribute `scale`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scale(value?: number): this | null | number {
        if (value == null) { return this._try_parse_float(this.style.scale, null); }
        this.style.scale = value.toString();
        return this;
    }

    scroll_behavior(): string;
    scroll_behavior(value: string): this;
    /**
     * {Scroll Behavior}
     * Specifies whether to smoothly animate the scroll position in a scrollable box, instead of a straight jump.
     * The equivalent of CSS attribute `scrollBehavior`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_behavior(value?: string): string | this {
        if (value == null) { return this.style.scrollBehavior; }
        this.style.scrollBehavior = value;
        return this;
    }

    scroll_margin(): string;
    scroll_margin(value: string | number): this;
    /**
     * {Scroll Margin}
     * Specifies the margin between the snap position and the container.
     * The equivalent of CSS attribute `scrollMargin`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_margin(value?: string | number): string | this {
        if (value == null) { return this.style.scrollMargin; }
        this.style.scrollMargin = this.pad_numeric(value);
        return this;
    }

    scroll_margin_block(): string;
    scroll_margin_block(value: string | number): this;
    /**
     * {Scroll Margin Block}
     * Specifies the margin between the snap position and the container in the block direction.
     * The equivalent of CSS attribute `scrollMarginBlock`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute value when parameter `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    scroll_margin_block(value?: string | number): string | this {
        if (value == null) { return this.style.scrollMarginBlock; }
        this.style.scrollMarginBlock = this.pad_numeric(value);
        return this;
    }

    scroll_margin_block_end(): string;
    scroll_margin_block_end(value: string | number): this;
    /**
     * {Scroll margin block end}
     * Specifies the end margin between the snap position and the container in the block direction.
     * The equivalent of CSS attribute `scrollMarginBlockEnd`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_margin_block_end(value?: string | number): string | this {
        if (value == null) { return this.style.scrollMarginBlockEnd; }
        this.style.scrollMarginBlockEnd = this.pad_numeric(value);
        return this;
    }

    scroll_margin_block_start(): string;
    scroll_margin_block_start(value: string | number): this;
    /**
     * {Scroll margin block start}
     * Specifies the start margin between the snap position and the container in the block direction.
     * The equivalent of CSS attribute `scrollMarginBlockStart`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute value when parameter `value` is `null`. Otherwise, returns the instance of the element for chaining.
     * @docs
     */
    scroll_margin_block_start(value?: string | number): string | this {
        if (value == null) { return this.style.scrollMarginBlockStart; }
        this.style.scrollMarginBlockStart = this.pad_numeric(value);
        return this;
    }

    scroll_margin_bottom(): string;
    scroll_margin_bottom(value: string | number): this;
    /**
     * {Scroll margin bottom}
     * Specifies the margin between the snap position on the bottom side and the container.
     * The equivalent of CSS attribute `scrollMarginBottom`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_margin_bottom(value?: string | number): string | this {
        if (value == null) { return this.style.scrollMarginBottom; }
        this.style.scrollMarginBottom = this.pad_numeric(value);
        return this;
    }

    scroll_margin_inline(): string;
    scroll_margin_inline(value: string | number): this;
    /**
     * {Scroll Margin Inline}
     * Specifies the margin between the snap position and the container in the inline direction.
     * The equivalent of CSS attribute `scrollMarginInline`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_margin_inline(value?: string | number): string | this {
        if (value == null) { return this.style.scrollMarginInline; }
        this.style.scrollMarginInline = this.pad_numeric(value);
        return this;
    }

    scroll_margin_inline_end(): string;
    scroll_margin_inline_end(value: string | number): this;
    /**
     * {Scroll margin inline end}
     * Specifies the end margin between the snap position and the container in the inline direction.
     * The equivalent of CSS attribute `scrollMarginInlineEnd`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_margin_inline_end(value?: string | number): this | string {
        if (value == null) { return this.style.scrollMarginInlineEnd; }
        this.style.scrollMarginInlineEnd = this.pad_numeric(value);
        return this;
    }

    scroll_margin_inline_start(): string;
    scroll_margin_inline_start(value: string): this;
    /**
     * {Scroll margin inline start}
     * Specifies the start margin between the snap position and the container in the inline direction.
     * The equivalent of CSS attribute `scrollMarginInlineStart`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_margin_inline_start(value?: string): string | this {
        if (value == null) { return this.style.scrollMarginInlineStart; }
        this.style.scrollMarginInlineStart = this.pad_numeric(value);
        return this;
    }

    scroll_margin_left(): string;
    scroll_margin_left(value: string | number): this;
    /**
     * {Scroll Margin Left}
     * Specifies the margin between the snap position on the left side and the container.
     * The equivalent of CSS attribute `scrollMarginLeft`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_margin_left(value?: string | number): string | this {
        if (value == null) { return this.style.scrollMarginLeft; }
        this.style.scrollMarginLeft = this.pad_numeric(value);
        return this;
    }

    /**
     * {Scroll Margin Right}
     * Specifies the margin between the snap position on the right side and the container.
     * The equivalent of CSS attribute `scrollMarginRight`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_margin_right(): string;
    scroll_margin_right(value: string | number): this
    scroll_margin_right(value?: string | number): this | string {
        if (value == null) { return this.style.scrollMarginRight; }
        this.style.scrollMarginRight = this.pad_numeric(value);
        return this;
    }

    scroll_margin_top(): string;
    scroll_margin_top(value: string | number): this;
    /**
     * {Scroll Margin Top}
     * Specifies the margin between the snap position on the top side and the container.
     * The equivalent of CSS attribute `scrollMarginTop`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_margin_top(value?: string | number): string | this {
        if (value == null) { return this.style.scrollMarginTop; }
        this.style.scrollMarginTop = this.pad_numeric(value);
        return this;
    }

    scroll_padding(): string;
    scroll_padding(value: string | number): this;
    /**
     * {Scroll Padding}
     * Specifies the distance from the container to the snap position on the child elements.
     * The equivalent of CSS attribute `scrollPadding`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`,
     * then the attribute's value is returned.
     * @docs
     */
    scroll_padding(value?: string | number): this | string {
        if (value == null) { return this.style.scrollPadding; }
        this.style.scrollPadding = this.pad_numeric(value);
        return this;
    }

    scroll_padding_block(): string;
    scroll_padding_block(value: string | number): this;
    /**
     * {Scroll padding block}
     * Specifies the distance in block direction from the container to the snap position on the child elements.
     * The equivalent of CSS attribute `scrollPaddingBlock`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute value when parameter `value` is `null`. Otherwise, returns the instance of the element for chaining.
     * @docs
     */
    scroll_padding_block(value?: string | number): string | this {
        if (value == null) { return this.style.scrollPaddingBlock; }
        this.style.scrollPaddingBlock = this.pad_numeric(value);
        return this;
    }

    scroll_padding_block_end(): string;
    scroll_padding_block_end(value: string | number): this;
    /**
     * {Scroll Padding Block End}
     * Specifies the distance in block direction from the end of the container to the snap position on the child elements.
     * The equivalent of CSS attribute `scrollPaddingBlockEnd`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_padding_block_end(value?: string | number): string | this {
        if (value == null) { return this.style.scrollPaddingBlockEnd; }
        this.style.scrollPaddingBlockEnd = this.pad_numeric(value);
        return this;
    }

    scroll_padding_block_start(): string;
    scroll_padding_block_start(value: string | number): this;
    /**
     * {Scroll padding block start}
     * Specifies the distance in block direction from the start of the container to the snap position on the child elements. The equivalent of CSS attribute `scrollPaddingBlockStart`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_padding_block_start(value?: string | number): string | this {
        if (value == null) { return this.style.scrollPaddingBlockStart; }
        this.style.scrollPaddingBlockStart = this.pad_numeric(value);
        return this;
    }

    scroll_padding_bottom(): string;
    scroll_padding_bottom(value: string | number): this;
    /**
     * {Scroll Padding Bottom}
     * Specifies the distance from the bottom of the container to the snap position on the child elements.
     * The equivalent of CSS attribute `scrollPaddingBottom`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_padding_bottom(value?: string | number): string | this {
        if (value == null) { return this.style.scrollPaddingBottom; }
        this.style.scrollPaddingBottom = this.pad_numeric(value);
        return this;
    }

    scroll_padding_inline(): string;
    scroll_padding_inline(value: string | number): this;
    /**
     * {Scroll Padding Inline}
     * Specifies the distance in inline direction from the container to the snap position on the child elements.
     * The equivalent of CSS attribute `scrollPaddingInline`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the attribute's value if `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    scroll_padding_inline(value?: string | number): string | this {
        if (value == null) { return this.style.scrollPaddingInline; }
        this.style.scrollPaddingInline = this.pad_numeric(value);
        return this;
    }

    scroll_padding_inline_end(): string;
    scroll_padding_inline_end(value: string | number): this;
    /**
     * {Scroll padding inline end}
     * Specifies the distance in inline direction from the end of the container to the snap position on the child elements.
     * The equivalent of CSS attribute `scrollPaddingInlineEnd`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_padding_inline_end(value?: string | number): string | this {
        if (value == null) { return this.style.scrollPaddingInlineEnd; }
        this.style.scrollPaddingInlineEnd = this.pad_numeric(value);
        return this;
    }

    scroll_padding_inline_start(): string;
    scroll_padding_inline_start(value: string | number): this;
    /**
     * {Scroll padding inline start}
     * Specifies the distance in inline direction from the start of the container to the snap position on the child elements.
     * The equivalent of CSS attribute `scrollPaddingInlineStart`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_padding_inline_start(value?: string | number): this | string {
        if (value == null) { return this.style.scrollPaddingInlineStart ?? ""; }
        this.style.scrollPaddingInlineStart = this.pad_numeric(value);
        return this;
    }

    scroll_padding_left(): string;
    scroll_padding_left(value: string | number): this;
    /**
     * {Scroll Padding Left}
     * Specifies the distance from the left side of the container to the snap position on the child elements.
     * The equivalent of CSS attribute `scrollPaddingLeft`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_padding_left(value?: string | number): string | this {
        if (value == null) { return this.style.scrollPaddingLeft; }
        this.style.scrollPaddingLeft = this.pad_numeric(value);
        return this;
    }

    scroll_padding_right(): string;
    scroll_padding_right(value: string | number): this;
    /**
     * {Scroll Padding Right}
     * Specifies the distance from the right side of the container to the snap position on the child elements.
     * The equivalent of CSS attribute `scrollPaddingRight`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_padding_right(value?: string | number): string | this {
        if (value == null) { return this.style.scrollPaddingRight; }
        this.style.scrollPaddingRight = this.pad_numeric(value);
        return this;
    }

    scroll_padding_top(): string;
    scroll_padding_top(value: string | number): this;
    /**
     * {Scroll Padding Top}
     * Specifies the distance from the top of the container to the snap position on the child elements.
     * The equivalent of CSS attribute `scrollPaddingTop`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_padding_top(value?: string | number): string | this {
        if (value == null) { return this.style.scrollPaddingTop; }
        this.style.scrollPaddingTop = this.pad_numeric(value);
        return this;
    }

    scroll_snap_align(): string;
    scroll_snap_align(value: string): this;
    /**
     * {Scroll Snap Align}
     * Specifies where to position elements when the user stops scrolling.
     * The equivalent of CSS attribute `scrollSnapAlign`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_snap_align(value?: string): string | this {
        if (value == null) { return this.style.scrollSnapAlign; }
        this.style.scrollSnapAlign = value;
        return this;
    }

    scroll_snap_stop(): string;
    scroll_snap_stop(value: string): this;
    /**
     * {Scroll Snap Stop}
     * Specifies scroll behaviour after fast swipe on trackpad or touch screen.
     * The equivalent of CSS attribute `scrollSnapStop`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_snap_stop(value?: string): string | this {
        if (value == null) { return this.style.scrollSnapStop; }
        this.style.scrollSnapStop = value;
        return this;
    }

    scroll_snap_type(): string;
    scroll_snap_type(value: string): this;
    /**
     * {Scroll Snap Type}
     * Specifies how snap behaviour should be when scrolling. The equivalent of CSS attribute `scrollSnapType`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scroll_snap_type(value?: string): string | this {
        if (value == null) { return this.style.scrollSnapType; }
        this.style.scrollSnapType = value;
        return this;
    }

    scrollbar_color(): string;
    scrollbar_color(value: string): this;
    /**
     * {Scrollbar color}
     * Specifies the color of the scrollbar of an element. The equivalent of CSS attribute `scrollbarColor`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scrollbar_color(value?: string): string | this {
        if (value == null) { return this.style.scrollbarColor; }
        this.style.scrollbarColor = value;
        return this;
    }

    tab_size(): string;
    tab_size(value: string | number): this;
    /**
     * {Tab Size}
     * Specifies the width of a tab character, equivalent to the CSS attribute `tabSize`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the instance of the element for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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

    table_layout(): string;
    table_layout(value: string): this;
    /**
     * {Table Layout}
     * Defines the algorithm used to lay out table cells, rows, and columns.
     * The equivalent of CSS attribute `tableLayout`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    table_layout(value?: string): string | this {
        if (value == null) { return this.style.tableLayout; }
        this.style.tableLayout = value;
        return this;
    }

    text_align(): string;
    text_align(value: string): this;
    /**
     * {Text Align}
     * Specifies the horizontal alignment of text, equivalent to the CSS `textAlign` attribute.
     * @param value The value to assign for text alignment. Leave `null` to retrieve the current attribute's value.
     * @returns Returns the current value of `textAlign` if no argument is provided; otherwise returns the instance for chaining.
     * @docs
     */
    text_align(value?: string): string | this {
        if (value == null) { return this.style.textAlign; }
        this.style.textAlign = value;
        return this;
    }

    text_align_last(): string;
    text_align_last(value: string): this;
    /**
     * {Text Align Last}
     * Describes how the last line of a block or a line right before a forced line break is aligned when text-align is "justify".
     * The equivalent of CSS attribute `textAlignLast`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    text_align_last(value?: string): string | this {
        if (value == null) { return this.style.textAlignLast; }
        this.style.textAlignLast = value;
        return this;
    }

    text_combine_upright(): string;
    text_combine_upright(value: string): this;
    /**
     * {Text Combine Upright}
     * Specifies the combination of multiple characters into the space of a single character.
     * The equivalent of CSS attribute `textCombineUpright`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    text_combine_upright(value?: string): string | this {
        if (value == null) { return this.style.textCombineUpright; }
        this.style.textCombineUpright = value;
        return this;
    }

    text_decoration(): string;
    text_decoration(value: string): this;
    /**
     * {Text Decoration}
     * Specifies the decoration added to text. The equivalent of CSS attribute `textDecoration`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    text_decoration(value?: string): string | this {
        if (value == null) { return this.style.textDecoration; }
        this.style.textDecoration = value;
        return this;
    }

    text_decoration_color(): string;
    text_decoration_color(value: string): this;
    /**
     * {Text Decoration Color}
     * Specifies the color of the text-decoration. The equivalent of CSS attribute `textDecorationColor`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    text_decoration_color(value?: string): this | string {
        if (value == null) { return this.style.textDecorationColor; }
        this.style.textDecorationColor = value;
        return this;
    }

    text_decoration_line(): string;
    text_decoration_line(value: string): this;
    /**
     * {Text Decoration Line}
     * Specifies the type of line in a text-decoration. The equivalent of CSS attribute `textDecorationLine`.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    text_decoration_line(value?: string): string | this {
        if (value == null) { return this.style.textDecorationLine; }
        this.style.textDecorationLine = value;
        return this;
    }

    text_decoration_style(): string;
    text_decoration_style(value: string): this;
    /**
     * {Text Decoration Style}
     * Specifies the style of the line in a text decoration, equivalent to the CSS attribute `textDecorationStyle`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    text_decoration_style(value?: string): string | this {
        if (value == null) { return this.style.textDecorationStyle; }
        this.style.textDecorationStyle = value;
        return this;
    }

    text_decoration_thickness(): string;
    text_decoration_thickness(value: string | number): this;
    /**
     * {Text Decoration Thickness}
     * Specifies the thickness of the decoration line. The equivalent of CSS attribute `textDecorationThickness`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    text_decoration_thickness(value?: string | number): string | this {
        if (value == null) { return this.style.textDecorationThickness; }
        this.style.textDecorationThickness = this.pad_numeric(value);
        return this;
    }

    text_emphasis(): string;
    text_emphasis(value: string): this;
    /**
     * {Text Emphasis}
     * Applies emphasis marks to text, equivalent to the CSS attribute `textEmphasis`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    text_emphasis(value?: string): string | this {
        if (value == null) { return this.style.textEmphasis; }
        this.style.textEmphasis = value;
        return this;
    }

    text_indent(): string;
    text_indent(value: string | number): this;
    /**
     * {Text Indent}
     * Specifies the indentation of the first line in a text-block, equivalent to the CSS `textIndent` property.
     * Retrieves the attribute value when the parameter `value` is `null`.
     * @returns Returns the instance of the element for chaining when a value is set. If `null` is passed, returns the current text indent value.
     * @docs
     */
    text_indent(value?: string | number): string | this {
        if (value == null) { return this.style.textIndent; }
        this.style.textIndent = value.toString();
        return this;
    }

    text_justify(): string;
    text_justify(value: string): this;
    /**
     * {Text Justify}
     * Specifies the justification method used when text-align is "justify". The equivalent of CSS attribute `textJustify`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    text_justify(value?: string): string | this {
        if (value == null) { return (this.style as any).textJustify; }
        (this.style as any).textJustify = value;
        return this;
    }

    text_orientation(): string;
    text_orientation(value: string): this;
    /**
     * {Text Orientation}
     * Defines the orientation of characters in a line, equivalent to the CSS attribute `textOrientation`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    text_orientation(value?: string): string | this {
        if (value == null) { return this.style.textOrientation; }
        this.style.textOrientation = value;
        return this;
    }

    text_overflow(): string;
    text_overflow(value: string): this;
    /**
     * {Text Overflow}
     * Specifies what should happen when text overflows the containing element. The equivalent of CSS attribute `textOverflow`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    text_overflow(value?: string): string | this {
        if (value == null) { return this.style.textOverflow; }
        this.style.textOverflow = value;
        return this;
    }

    text_shadow(): string;
    text_shadow(value: string): this;
    /**
     * {Text Shadow}
     * Adds shadow to text. The equivalent of CSS attribute `textShadow`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    text_shadow(value?: string): string | this {
        if (value == null) { return this.style.textShadow; }
        this.style.textShadow = value;
        return this;
    }

    text_transform(): string;
    text_transform(value: string): this;
    /**
     * {Text Transform}
     * Controls the capitalization of text. The equivalent of CSS attribute `textTransform`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    text_transform(value?: string): string | this {
        if (value == null) { return this.style.textTransform; }
        this.style.textTransform = value;
        return this;
    }

    text_underline_position(): string;
    text_underline_position(value: string): this;
    /**
     * {Text Underline Position}
     * Specifies the position of the underline which is set using the text-decoration property.
     * The equivalent of CSS attribute `textUnderlinePosition`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    text_underline_position(value?: string): string | this {
        if (value == null) { return this.style.textUnderlinePosition; }
        this.style.textUnderlinePosition = value;
        return this;
    }

    top(): string;
    top(value: string | number): this;
    /**
     * {Top}
     * Specifies the top position of a positioned element. The equivalent of CSS attribute `top`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    top(value?: string | number): string | this {
        if (value == null) { return this.style.top; }
        this.style.top = this.pad_numeric(value);
        return this;
    }

    transform(): string;
    transform(value: string): this;
    /**
     * {Transform}
     * Applies a 2D or 3D transformation to an element. The equivalent of CSS attribute `transform`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    transform(value?: string): string | this {
        if (value == null) { return this.style.transform; }
        this.style.transform = value;
        (this.style as any).msTransform = value;
        (this.style as any).webkitTransform = value;
        (this.style as any).MozTransform = value;
        (this.style as any).OTransform = value;
        return this;
    }

    transform_origin(): string;
    transform_origin(value: string): this;
    /**
     * {Transform Origin}
     * Allows you to change the position on transformed elements. The equivalent of CSS attribute `transformOrigin`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    transform_origin(value?: string): string | this {
        if (value == null) { return this.style.transformOrigin; }
        this.style.transformOrigin = value;
        (this.style as any).msTransformOrigin = value;
        (this.style as any).webkitTransformOrigin = value;
        (this.style as any).MozTransformOrigin = value;
        (this.style as any).OTransformOrigin = value;
        return this;
    }

    transform_style(): string;
    transform_style(value: string): this;
    /**
     * {Transform Style}
     * Specifies how nested elements are rendered in 3D space.
     * The equivalent of CSS attribute `transformStyle`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    transform_style(value?: string): string | this {
        if (value == null) { return this.style.transformStyle; }
        this.style.transformStyle = value;
        (this.style as any).msTransformStyle = value;
        (this.style as any).webkitTransformStyle = value;
        (this.style as any).MozTransformStyle = value;
        (this.style as any).OTransformStyle = value;
        return this;
    }

    transition(): string;
    transition(value: string): this;
    /**
     * {Transition}
     * A shorthand property for all the transition properties. The equivalent of CSS attribute `transition`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    transition(value?: string): string | this {
        if (value == null) { return this.style.transition; }
        this.style.transition = value;
        (this.style as any).msTransition = value;
        (this.style as any).webkitTransition = value;
        (this.style as any).MozTransition = value;
        (this.style as any).OTransition = value;
        return this;
    }

    transition_delay(): string;
    transition_delay(value: string | number): this;
    /**
     * {Transition Delay}
     * Specifies when the transition effect will start. This corresponds to the CSS attribute `transitionDelay`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the attribute value when parameter `value` is `null`. Otherwise, returns the instance of the element for chaining.
     * @docs
     */
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

    transition_duration(): string | undefined;
    transition_duration(value: string | number): this;
    /**
     * {Transition Duration}
     * Specifies how many seconds or milliseconds a transition effect takes to complete.
     * The equivalent of CSS attribute `transitionDuration`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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

    transition_property(): string;
    transition_property(value: string): this;
    /**
     * {Transition Property}
     * Specifies the name of the CSS property the transition effect is for.
     * The equivalent of CSS attribute `transitionProperty`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    transition_property(value?: string): string | this {
        if (value == null) { return this.style.transitionProperty; }
        this.style.transitionProperty = value;
        (this.style as any).msTransitionProperty = value;
        (this.style as any).webkitTransitionProperty = value;
        (this.style as any).MozTransitionProperty = value;
        (this.style as any).OTransitionProperty = value;
        return this;
    }

    transition_timing_function(): string;
    transition_timing_function(value: string): this;
    /**
     * {Transition Timing Function}
     * Specifies the speed curve of the transition effect.
     * The equivalent of CSS attribute `transitionTimingFunction`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the instance of the element for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
     * {Translate}
     * Specifies the position of an element. The equivalent of CSS attribute `translate`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the attribute's value if `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
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

    unicode_bidi(): string;
    unicode_bidi(value: string): this;
    /**
     * {Unicode Bidi}
     * Used together with the direction property to set or return whether the text should be overridden to support multiple languages in the same document.
     * The equivalent of CSS attribute `unicodeBidi`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    unicode_bidi(value?: string): string | this {
        if (value == null) { return this.style.unicodeBidi ?? ""; }
        this.style.unicodeBidi = value;
        return this;
    }

    user_select(): string;
    user_select(value: string): this;
    /**
     * {User Select}
     * Specifies whether the text of an element can be selected.
     * The equivalent of CSS attribute `userSelect`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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

    visibility(): string;
    visibility(value: string): this;
    /**
     * {Visibility}
     * Specifies whether or not an element is visible. The equivalent of CSS attribute `visibility`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    visibility(value?: string): string | this {
        if (value == null) { return this.style.visibility; }
        this.style.visibility = value;
        return this;
    }

    white_space(): string;
    white_space(value: string): this;
    /**
     * {White space}
     * Specifies how white-space inside an element is handled. The equivalent of CSS attribute `whiteSpace`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    white_space(value?: string): string | this {
        if (value == null) { return this.style.whiteSpace; }
        this.style.whiteSpace = value;
        return this;
    }

    widows(): string;
    widows(value: string | number): this;
    /**
     * {Widows}
     * Sets the minimum number of lines that must be left at the top of a page or column.
     * The equivalent of CSS attribute `widows`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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

    word_break(): string;
    word_break(value: string): this;
    /**
     * {Word break}
     * Specifies how words should break when reaching the end of a line.
     * The equivalent of CSS attribute `wordBreak`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    word_break(value?: string): string | this {
        if (value == null) { return this.style.wordBreak; }
        this.style.wordBreak = value;
        return this;
    }

    word_spacing(): string;
    word_spacing(value: string | number): this;
    /**
     * {Word spacing}
     * Increases or decreases the space between words in a text. The equivalent of CSS attribute `wordSpacing`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    word_spacing(value?: string | number): string | this {
        if (value == null) { return this.style.wordSpacing; }
        this.style.wordSpacing = this.pad_numeric(value);
        return this;
    }

    word_wrap(): string;
    word_wrap(value: string): this;
    /**
     * {Word wrap}
     * Allows long, unbreakable words to be broken and wrap to the next line. The equivalent of CSS attribute `wordWrap`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    word_wrap(value?: string): string | this {
        if (value == null) { return this.style.wordWrap; }
        this.style.wordWrap = value;
        return this;
    }

    writing_mode(): string;
    writing_mode(value: string): this;
    /**
     * {Writing mode}
     * Specifies whether lines of text are laid out horizontally or vertically. The equivalent of CSS attribute `writingMode`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    writing_mode(value?: string): string | this {
        if (value == null) { return this.style.writingMode; }
        this.style.writingMode = value;
        return this;
    }

    // ---------------------------------------------------------
    // Attribute functions
    // Reference: https://www.w3schools.com/tags/ref_attributes.asp. 

    focusable(): boolean;
    focusable(value: boolean): this;
    /**
     * {Focusable}
     * Sets or gets the focusable state of the element based on the `tabindex` attribute.
     * @param value Boolean value to set focusable state or null to get current state.
     * @returns When an argument is passed, this function returns the instance of the element for chaining. Otherwise, it returns the current focusable state.
     * @docs
     */
    focusable(value?: boolean | null): boolean | this {
        if (value == null) {
            return super.tabIndex !== -1;
        } else {
            super.tabIndex = -1;
            this.style.outline = "none";
        }
        return this;
    }

    alt(): string;
    alt(value: string): this;
    /**
     * {Alt}
     * Specifies an alternate text when the original element fails to display. The equivalent of HTML attribute `alt`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    alt(value?: string): string | this {
        // if (value == null) { return this.getAttribute("alt") ?? ""; }
        if (value == null) { return this.getAttribute("alt") ?? ""; }
        this.setAttribute("alt", value)
        // this.setAttribute("alt", value);
        return this;
    }

    readonly(): boolean;
    readonly(value: boolean): this;
    /**
     * {Readonly}
     * Specifies that the element is read-only, equivalent to the HTML attribute `readonly`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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

    download(): string;
    download(value: string): this;
    /**
     * {Download}
     * Specifies that the target will be downloaded when a user clicks on the hyperlink. The equivalent of HTML attribute `download`.
     * @returns Returns the attribute value when parameter `value` is `null`. Otherwise, returns the instance of the element for chaining.
     * @docs
     */
    download(value?: string): string | this {
        if (value == null) { return this.getAttribute("download") ?? ""; }
        this.setAttribute("download", value);
        return this;
    }

    accept(): string;
    accept(value: string): this;
    /**
     * {Accept}
     * Specifies the types of files that the server accepts (only for type="file"). The equivalent of HTML attribute `accept`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    accept(value?: string): string | this {
        if (value == null) { return this.getAttribute("accept") ?? ""; }
        this.setAttribute("accept", value);
        return this;
    }

    accept_charset(): string;
    accept_charset(value: string): this;
    /**
     * {Accept Charset}
     * Specifies the character encodings that are to be used for the form submission.
     * The equivalent of HTML attribute `accept_charset`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    accept_charset(value?: string): string | this {
        if (value == null) { return super.acceptCharset ?? ""; }
        super.acceptCharset = value;
        return this;
    }

    action(): string;
    action(value: string): this;
    /**
     * {Action}
     * Specifies where to send the form-data when a form is submitted.
     * The equivalent of HTML attribute `action`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the attribute value when parameter `value` is `null`. Otherwise, returns the instance of the element for chaining.
     * @docs
     */
    action(value?: string): string | this {
        if (value == null) { return this.getAttribute("action") ?? ""; }
        this.setAttribute("action", value);
        return this;
    }

    async(): boolean;
    async(value: boolean): this;
    /**
     * {Async}
     * Specifies that the script is executed asynchronously (only for external scripts).
     * The equivalent of HTML attribute `async`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    async(value?: boolean): boolean | this {
        if (value == null) { return this._try_parse_boolean(this.getAttribute("async")); }
        this.setAttribute("async", value);
        return this;
    }

    auto_complete(): "" | "on" | "off";
    auto_complete(value: "" | "on" | "off"): this;
    /**
     * {Auto complete}
     * Specifies whether the \<form> or the \<input> element should have autocomplete enabled.
     * The equivalent of HTML attribute `autocomplete`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    auto_complete(value?: "" | "on" | "off"): "" | "on" | "off" | this {
        if (value == null) { return super.autocomplete ?? ""; }
        super.autocomplete = value;
        return this;
    }

    auto_focus(): boolean;
    auto_focus(value: boolean): this;
    /**
     * {Auto Focus}
     * Specifies that the element should automatically get focus when the page loads.
     * The equivalent of HTML attribute `autofocus`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    auto_focus(value?: boolean): boolean | this {
        if (value == null) { return super.autofocus ?? false; }
        super.autofocus = value;
        return this;
    }

    auto_play(): boolean;
    auto_play(value: boolean): this;
    /**
     * {Auto Play}
     * Specifies that the audio/video will start playing as soon as it is ready.
     * The equivalent of HTML attribute `autoplay`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    auto_play(value?: boolean): this | boolean {
        if (value == null) { return this._try_parse_boolean(super.autoplay); }
        super.autoplay = value;
        return this;
    }

    charset(): string;
    charset(value: string): this;
    /**
     * {Charset}
     * Specifies the character encoding, equivalent to the HTML attribute `charset`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    charset(value?: string): this | string {
        if (value == null) { return this.getAttribute("charset") ?? ""; }
        this.setAttribute("charset", value);
        return this;
    }

    checked(): boolean;
    checked(value: boolean): this;
    /**
     * {Checked}
     * Specifies that an \<input> element should be pre-selected when the page loads (for type="checkbox" or type="radio"). The equivalent of HTML attribute `checked`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    checked(value?: boolean): this | boolean {
        // if (value == null) { return this._try_parse_boolean(super.checked); }
        // super.checked = value;
        if (value == null) { return this._try_parse_boolean(this.getAttribute("checked")); }
        this.setAttribute("checked", value);
        // if (value == null) { return this._try_parse_boolean(this._checked.get.call(this)); }
        // this._checked.set.call(this, value)
        return this;
    }

    cite(): string;
    cite(value: string): this;
    /**
     * {Cite}
     * Specifies a URL which explains the quote/deleted/inserted text. The equivalent of HTML attribute `cite`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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

    cols(): null | number;
    cols(value: number): this;
    /**
     * {Cols}
     * Specifies the visible width of a text area, equivalent to the HTML attribute `cols`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining, unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    cols(value?: number): this | null | number {
        if (value == null) { return this._try_parse_float(super.getAttribute("cols"), null); }
        this.setAttribute("cols", value);
        return this;
    }

    colspan(): null | number;
    colspan(value: number): this;
    /**
     * {Colspan}
     * Specifies the number of columns a table cell should span. The equivalent of HTML attribute `colspan`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    colspan(value?: number): this | null | number {
        if (value == null) { return this._try_parse_float(this.getAttribute("cols"), null); }
        this.setAttribute("colspan", value);
        return this;
    }

    // @duplicate
    // /**
    //     * docs:
    //     * @title: Content
    //     * @desc: Retrieves or sets the value associated with the http-equiv or name attribute. 
    //     *        When `value` is `null`, the current attribute value is returned. 
    //     * @param:
    //     *     @name: value
    //     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
    //     * @return:
    //     *     @descr: Returns the current attribute value if `value` is `null`, otherwise returns the instance for chaining.
    //     * @funcs: 2
    //     */
    // content(): string;
    // content(value: string | number): this;
    // content(value?: string | number): string | this {
    //     if (value == null) { return super.content ?? ""; }
    //     super.content = value.toString();
    //     return this;
    // }

    content_editable(): boolean;
    content_editable(value: boolean): this;
    /**
     * {Content editable}
     * Specifies whether the content of an element is editable or not.
     * The equivalent of HTML attribute `contenteditable`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    content_editable(value?: boolean): boolean | this {
        if (value == null) { return this._try_parse_boolean(super.contentEditable); }
        super.contentEditable = value ? "true" : "false";
        return this;
    }

    controls(): boolean;
    controls(value: boolean): this;
    /**
     * {Controls}
     * Specifies that audio/video controls should be displayed (such as a play/pause button etc). The equivalent of HTML attribute `controls`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    controls(value?: boolean): this | boolean {
        if (value == null) { return this._try_parse_boolean(super.getAttribute("controls")); }
        this.setAttribute("controls", value);
        return this;
    }

    coords(): string;
    coords(value: string): this;
    /**
     * {Coords}
     * Specifies the coordinates of the area, equivalent to the HTML attribute `coords`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining, or the attribute's value if `value` is `null`.
     * @docs
     */
    coords(value?: string): string | this {
        if (value == null) { return this.getAttribute("coords") ?? ""; }
        this.setAttribute("coords", value);
        return this;
    }

    data(): string;
    data(value: string | number): this;
    /**
     * {Data}
     * Specifies the URL of the resource to be used by the object.
     * The equivalent of HTML attribute `data`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    data(value?: string | number): this | string {
        if (value == null) { return this.getAttribute("data") ?? ""; }
        this.setAttribute("data", value);
        return this;
    }

    datetime(): string;
    datetime(value: string): this;
    /**
     * {Datetime}
     * Specifies the date and time. The equivalent of HTML attribute `datetime`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    datetime(value?: string): string | this {
        if (value == null) { return super.dateTime ?? ""; }
        super.dateTime = value;
        return this;
    }

    default(): boolean;
    default(value: boolean): this;
    /**
     * {Default}
     * Specifies that the track is to be enabled if the user's preferences do not indicate that another track would be more appropriate. The equivalent of HTML attribute `default`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    default(value?: boolean): boolean | this {
        if (value == null) { return this._try_parse_boolean(this.getAttribute("default")); }
        this.setAttribute("default", value);
        return this;
    }

    defer(): boolean;
    defer(value: boolean): this;
    /**
     * {Defer}
     * Specifies that the script is executed when the page has finished parsing (only for external scripts).
     * The equivalent of HTML attribute `defer`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    defer(value?: boolean): this | boolean {
        if (value == null) { return this._try_parse_boolean(this.getAttribute("defer")); }
        this.setAttribute("defer", value);
        return this;
    }

    /**
     * {Dir}
     * Specifies the text direction for the content in an element. The equivalent of HTML attribute `dir`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
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

    dirname(): string;
    dirname(value: string): this;
    /**
     * {Dirname}
     * Specifies that the text direction will be submitted. The equivalent of HTML attribute `dirname`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    dirname(value?: string): string | this {
        if (value == null) { return this.getAttribute("dirname") ?? ""; }
        this.setAttribute("dirname", value);
        return this;
    }

    disabled(): boolean;
    disabled(value: boolean): this;
    /**
     * {Disabled}
     * Specifies that the specified element/group of elements should be disabled.
     * The equivalent of HTML attribute `disabled`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    disabled(value?: boolean): boolean | this {
        // if (value == null) { return this._try_parse_boolean(super.disabled); }
        // super.disabled = value;
        if (value == null) { return this._try_parse_boolean(this.getAttribute("disabled")); }
        this.setAttribute("disabled", value);
        // if (value == null) { return this._try_parse_boolean(this._disabled.get.call(this)); }
        // this._disabled.set.call(this, value)
        return this;
    }

    /**
     * {Draggable}
     * Specifies whether an element is draggable or not. The equivalent of HTML attribute `draggable`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
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

    enctype(): string;
    enctype(value: string): this;
    /**
     * {Enctype}
     * Specifies how the form-data should be encoded when submitting it to the server (only for method="post").
     * The equivalent of HTML attribute `enctype`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    enctype(value?: string): string | this {
        if (value == null) { return this.getAttribute("enctype") ?? ""; }
        this.setAttribute("enctype", value);
        return this;
    }

    for(): string;
    for(value: string): this;
    /**
     * {For}
     * Specifies which form element(s) a label/calculation is bound to.
     * The equivalent of HTML attribute `for`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    for(value?: string): string | this {
        if (value == null) { return this.getAttribute("for") ?? ""; }
        this.setAttribute("for", value);
        return this;
    }

    /**
     * {Form}
     * Specifies the name of the form the element belongs to. The equivalent of HTML attribute `form`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object when a value is set. If `null`, returns the attribute's value.
     * @docs
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

    form_action(): string;
    form_action(value: string): this;
    /**
     * {Form Action}
     * Specifies where to send the form-data when a form is submitted. Only for type="submit".
     * The equivalent of HTML attribute `formaction`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    form_action(value?: string): string | this {
        if (value == null) { return super.formAction ?? ""; }
        super.formAction = value;
        return this;
    }

    headers(): string;
    headers(value: string): this;
    /**
     * {Headers}
     * Specifies one or more headers cells a cell is related to.
     * The equivalent of HTML attribute `headers`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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

    high(): string;
    high(value: string | number): this;
    /**
     * {High}
     * Specifies the range that is considered to be a high value. The equivalent of HTML attribute `high`.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    high(value?: string | number): string | this {
        if (value == null) { return this.getAttribute("high") ?? ""; }
        this.setAttribute("high", value);
        return this;
    }

    href(): string;
    href(value: string): this;
    /**
     * {Href}
     * Specifies the URL of the page the link goes to. The equivalent of HTML attribute `href`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    href(value?: string): string | this {
        // if (value == null) { return super.href ?? ""; }
        // super.href = value;
        if (value == null) { return this.getAttribute("href") ?? ""; }
        this.setAttribute("href", value);
        // if (value == null) { return this._href.get.call(this) ?? ""; }
        // this._href.set.call(this, value);
        return this;
    }

    href_lang(): string;
    href_lang(value: string): this;
    /**
     * {Href lang}
     * Specifies the language of the linked document. The equivalent of HTML attribute `hreflang`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    href_lang(value?: string): string | this {
        if (value == null) { return super.hreflang ?? ""; }
        super.hreflang = value;
        return this;
    }

    http_equiv(): string;
    http_equiv(value: string): this;
    /**
     * {Http Equiv}
     * Provides an HTTP header for the information/value of the content attribute.
     * The equivalent of HTML attribute `http_equiv`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining, unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    http_equiv(value?: string): this | string {
        if (value == null) { return super.httpEquiv ?? ""; }
        super.httpEquiv = value;
        return this;
    }

    /**
     * {Id}
     * Specifies a unique id for an element, equivalent to the HTML attribute `id`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    // @ts-ignore
    id(): string;
    // @ts-ignore
    id(value: string): this;
    // @ts-ignore
    id(value?: string): string | this {
        if (value == null) { return super.id ?? ""; }
        super.id = value;
        // if (value == null) { return this.getAttribute("id") ?? ""; }
        // this.setAttribute("id", value);
        // if (value == null) { return this._id.get.call(this) ?? ""; }
        // this._id.set.call(this, value);
        return this;
    }

    is_map(): boolean;
    is_map(value: boolean): this;
    /**
     * {Is Map}
     * Specifies an image as a server-side image map. The equivalent of HTML attribute `ismap`.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    is_map(value?: boolean): boolean | this {
        if (value == null) { return this._try_parse_boolean(super.isMap); }
        super.isMap = value;
        return this;
    }

    kind(): string;
    kind(value: string): this;
    /**
     * {Kind}
     * Specifies the kind of text track. The equivalent of HTML attribute `kind`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    kind(value?: string): string | this {
        if (value == null) { return this.getAttribute("kind") ?? ""; }
        this.setAttribute("kind", value);
        return this;
    }

    label(): string;
    label(value: string): this;
    /**
     * {Label}
     * Specifies the title of the text track, equivalent to the HTML attribute `label`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    label(value?: string): string | this {
        if (value == null) { return this.getAttribute("label") ?? ""; }
        this.setAttribute("label", value);
        return this;
    }

    /**
     * {Lang}
     * Specifies the language of the element's content, equivalent to the HTML attribute `lang`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
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
     * {List}
     * Refers to a \<datalist> element that contains pre-defined options for an \<input> element.
     * The equivalent of HTML attribute `list`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
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

    loop(): boolean;
    loop(value: boolean): this;
    /**
     * {Loop}
     * Specifies that the audio/video will start over again, every time it is finished.
     * The equivalent of HTML attribute `loop`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    loop(value?: boolean): this | boolean {
        if (value == null) { return this._try_parse_boolean(this.getAttribute("loop")); }
        this.setAttribute("loop", value);
        return this;
    }

    low(): string;
    low(value: string | number): this;
    /**
     * {Low}
     * Specifies the range that is considered to be a low value. The equivalent of HTML attribute `low`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining. If `value` is `null`, the attribute's value is returned.
     * @docs
     */
    low(value?: string | number): string | this {
        if (value == null) { return this.getAttribute("low") ?? ""; }
        this.setAttribute("low", value);
        return this;
    }

    max(): string;
    max(value: string): this;
    /**
     * {Max}
     * Specifies the maximum value, equivalent to the HTML attribute `max`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, in which case the attribute's value is returned.
     * @docs
     */
    max(value?: string): string | this {
        if (value == null) { return this.getAttribute("max") ?? ""; }
        this.setAttribute("max", value);
        return this;
    }

    max_length(): null | number;
    max_length(value: number): this;
    /**
     * {Max Length}
     * Specifies the maximum number of characters allowed in an element. The equivalent of HTML attribute `maxlength`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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

    method(): string;
    method(value: string): this;
    /**
     * {Method}
     * Specifies the HTTP method to use when sending form-data. The equivalent of HTML attribute `method`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    method(value?: string): this | string {
        if (value == null) { return this.getAttribute("method") ?? ""; }
        this.setAttribute("method", value);
        return this;
    }

    // @ts-ignore
    min(): string;
    // @ts-ignore
    min(value: string): this;
    /**
     * {Min}
     * Specifies a minimum value, equivalent to the HTML attribute `min`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    // @ts-ignore
    min(value?: string): string | this {
        if (value == null) { return this.getAttribute("min") ?? ""; }
        this.setAttribute("min", value);
        return this;
    }

    multiple(): boolean;
    multiple(value: boolean): this;
    /**
     * {Multiple}
     * Specifies that a user can enter more than one value. The equivalent of HTML attribute `multiple`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    multiple(value?: boolean): boolean | this {
        if (value == null) { return this._try_parse_boolean(this.getAttribute("multiple")); }
        this.setAttribute("multiple", value);
        return this;
    }

    muted(): boolean;
    muted(value: boolean): this;
    /**
     * {Muted}
     * Specifies that the audio output of the video should be muted.
     * The equivalent of HTML attribute `muted`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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

    no_validate(): boolean;
    no_validate(value: boolean): this;
    /**
     * {No validate}
     * Specifies that the form should not be validated when submitted. The equivalent of HTML attribute `novalidate`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    no_validate(value?: boolean): this | boolean {
        if (value == null) { return this._try_parse_boolean(super.novalidate); }
        super.novalidate = value;
        return this;
    }

    open(): boolean;
    open(value: boolean): this;
    /**
     * {Open}
     * Specifies that the details should be visible (open) to the user.
     * The equivalent of HTML attribute `open`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    open(value?: boolean): boolean | this {
        if (value == null) { return this._try_parse_boolean(super.getAttribute("open")); }
        this.setAttribute("open", value);
        return this;
    }

    optimum(): null | number;
    optimum(value: number): this;
    /**
     * {Optimum}
     * Specifies what value is the optimal value for the gauge. The equivalent of HTML attribute `optimum`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    optimum(value?: number): this | null | number {
        if (value == null) { return this._try_parse_float(super.getAttribute("optimum"), null); }
        this.setAttribute("optimum", value);
        return this;
    }

    pattern(): string;
    pattern(value: string): this;
    /**
     * {Pattern}
     * Specifies a regular expression that an \<input> element's value is checked against.
     * The equivalent of HTML attribute `pattern`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    pattern(value?: string): string | this {
        if (value == null) { return this.getAttribute("pattern") ?? ""; }
        this.setAttribute("pattern", value);
        return this;
    }

    placeholder(): string;
    placeholder(value: string): this;
    /**
     * {Placeholder}
     * Specifies a short hint that describes the expected value of the element.
     * The equivalent of HTML attribute `placeholder`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    placeholder(value?: string): string | this {
        if (value == null) { return this.getAttribute("placeholder") ?? ""; }
        this.setAttribute("placeholder", value);
        return this;
    }

    poster(): string;
    poster(value: string): this;
    /**
     * {Poster}
     * Specifies an image to be shown while the video is downloading, or until the user hits the play button.
     * The equivalent of HTML attribute `poster`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    poster(value?: string): string | this {
        if (value == null) { return this.getAttribute("poster") ?? ""; }
        this.setAttribute("poster", value);
        return this;
    }

    preload(): string;
    preload(value: string): this;
    /**
     * {Preload}
     * Specifies if and how the author thinks the audio/video should be loaded when the page loads.
     * The equivalent of HTML attribute `preload`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    preload(value?: string): string | this {
        if (value == null) { return this.getAttribute("preload") ?? ""; }
        this.setAttribute("preload", value);
        return this;
    }

    rel(): string;
    rel(value: string): this;
    /**
     * {Rel}
     * Specifies the relationship between the current document and the linked document.
     * The equivalent of HTML attribute `rel`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    rel(value?: string): string | this {
        if (value == null) { return this.getAttribute("rel") ?? ""; }
        this.setAttribute("rel", value);
        return this;
    }

    required(): boolean;
    required(value: boolean): this;
    /**
     * {Required}
     * Specifies that the element must be filled out before submitting the form. The equivalent of HTML attribute `required`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object when a value is assigned. Returns the attribute's value when `value` is `null`.
     * @docs
     */
    required(value?: boolean): boolean | this {
        if (value == null) { return this._try_parse_boolean(this.getAttribute("required")); }
        this.setAttribute("required", value);
        return this;
    }

    reversed(): boolean;
    reversed(value: boolean): this;
    /**
     * {Reversed}
     * Specifies that the list order should be descending (9,8,7...). This is the equivalent of the HTML attribute `reversed`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    reversed(value?: boolean): this | boolean {
        if (value == null) { return this._try_parse_boolean(this.getAttribute("reversed")); }
        this.setAttribute("reversed", value);
        return this;
    }

    rows(): null | number;
    rows(value: number): this;
    /**
     * {Rows}
     * Specifies the visible number of lines in a text area.
     * The equivalent of HTML attribute `rows`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining, unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    rows(value?: number): null | number | this {
        if (value == null) { return this._try_parse_float(this.getAttribute("rows"), null); }
        this.setAttribute("rows", value);
        return this;
    }

    row_span(): null | number;
    row_span(value: number): this;
    /**
     * {Row Span}
     * Specifies the number of rows a table cell should span.
     * The equivalent of HTML attribute `rowspan`.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`,
     * then the attribute's value is returned.
     * @docs
     */
    row_span(value?: number): this | null | number {
        if (value == null) { return this._try_parse_float(super.rowspan, null); }
        super.rowspan = value;
        return this;
    }

    sandbox(): string;
    sandbox(value: string): this;
    /**
     * {Sandbox}
     * Enables an extra set of restrictions for the content in an \<iframe>. The equivalent of HTML attribute `sandbox`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    sandbox(value?: string): string | this {
        if (value == null) { return this.getAttribute("sandbox") ?? ""; }
        this.setAttribute("sandbox", value);
        return this;
    }

    scope(): string;
    scope(value: string): this;
    /**
     * {Scope}
     * Specifies whether a header cell is a header for a column, row, or group of columns or rows.
     * The equivalent of HTML attribute `scope`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    scope(value?: string): string | this {
        if (value == null) { return this.getAttribute("scope") ?? ""; }
        this.setAttribute("scope", value);
        return this;
    }

    selected(): boolean;
    selected(value: boolean): this;
    /**
     * {Selected}
     * Specifies that an option should be pre-selected when the page loads. The equivalent of HTML attribute `selected`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    selected(value?: boolean): boolean | this {
        // if (value == null) { return this._try_parse_boolean(super.selected); }
        // super.selected = value;
        if (value == null) { return this._try_parse_boolean(this.getAttribute("selected")); }
        this.setAttribute("selected", value);
        // if (value == null) { return this._try_parse_boolean(this._selected.get.call(this)); }
        // this._selected.set.call(this, value)
        return this;
    }

    shape(): string;
    shape(value: string): this;
    /**
     * {Shape}
     * Specifies the shape of the area. The equivalent of HTML attribute `shape`.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    shape(value?: string): string | this {
        if (value == null) { return this.getAttribute("shape") ?? ""; }
        this.setAttribute("shape", value);
        return this;
    }

    size(): null | number;
    size(value: number): this;
    /**
     * {Size}
     * Specifies the width, in characters (for \<input>) or specifies the number of visible options (for \<select>).
     * The equivalent of HTML attribute `size`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the attribute's value when `value` is `null`, otherwise returns the instance of the element for chaining.
     * @docs
     */
    size(value?: number): null | number | this {
        if (value == null) { return this._try_parse_float(super.getAttribute("size"), null); }
        this.setAttribute("size", value);
        return this;
    }

    sizes(): string;
    sizes(value: string): this;
    /**
     * {Sizes}
     * Specifies the size of the linked resource. The equivalent of HTML attribute `sizes`.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    sizes(value?: string): string | this {
        if (value == null) { return this.getAttribute("sizes") ?? ""; }
        this.setAttribute("sizes", value);
        return this;
    }

    // @ts-ignore
    span(): null | number;
    // @ts-ignore
    span(value: number): this;
    /**
     * {Span}
     * Specifies the number of columns to span. The equivalent of HTML attribute `span`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    span(value?: number): this | null | number {
        if (value == null) { return this._try_parse_float(super.getAttribute("span"), null); }
        this.setAttribute("span", value);
        return this;
    }

    spell_check(): boolean;
    spell_check(value: boolean): this;
    /**
     * {Spell Check}
     * Specifies whether the element is to have its spelling and grammar checked or not.
     * The equivalent of HTML attribute `spellcheck`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    spell_check(value?: boolean): boolean | this {
        if (value == null) { return this._try_parse_boolean(super.spellcheck); }
        this.spellcheck = value;
        return this;
    }

    /**
     * {Src}
     * Specifies the URL of the media file, equivalent to the HTML attribute `src`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    // @ts-ignore
    src(): string;
    // @ts-ignore
    src(value: string, set_aspect_ratio?: boolean): this;
    // @ts-ignore
    src(value?: string, set_aspect_ratio: boolean = false): string | this {
        // if (value == null) { return this._src.get.call(this) ?? ""; }
        // this._src.set.call(this, value);
        if (value == null) { return this.getAttribute("src") ?? ""; }
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
        this.setAttribute("src", value);
        return this;
    }

    src_doc(): string;
    src_doc(value: string): this;
    /**
     * {Src doc}
     * Specifies the HTML content of the page to show in the \<iframe>. The equivalent of HTML attribute `srcdoc`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    src_doc(value?: string): string | this {
        if (value == null) { return super.srcdoc ?? ""; }
        super.srcdoc = value;
        return this;
    }

    src_lang(): string;
    src_lang(value: string): this;
    /**
     * {Src lang}
     * Specifies the language of the track text data (required if kind="subtitles"). The equivalent of HTML attribute `srclang`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    src_lang(value?: string): string | this {
        if (value == null) { return super.srclang ?? ""; }
        super.srclang = value;
        return this;
    }

    rrsrc_set(): string;
    rrsrc_set(value: string): this;
    /**
     * {Rrsrc set}
     * Specifies the URL of the image to use in different situations.
     * The equivalent of HTML attribute `srcset`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    rrsrc_set(value?: string): this | string {
        if (value == null) { return super.srcset ?? ""; }
        super.srcset = value;
        return this;
    }

    start(): null | number;
    start(value: number): this;
    /**
     * {Start}
     * Specifies the start value of an ordered list. The equivalent of HTML attribute `start`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    start(value?: number): number | null | this {
        if (value == null) { return this._try_parse_float(super.getAttribute("start"), null); }
        this.setAttribute("start", value);
        return this;
    }

    step(): string;
    step(value: string): this;
    /**
     * {Step}
     * Specifies the legal number intervals for an input field. The equivalent of HTML attribute `step`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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

    tab_index(): null | number;
    tab_index(value: number): this;
    /**
     * {Tab index}
     * Specifies the tabbing order of an element, equivalent to the HTML attribute `tabindex`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, in which case the attribute's value is returned.
     * @docs
     */
    tab_index(value?: number): this | null | number {
        if (value == null) { return this._try_parse_float(super.tabIndex, null); }
        super.tabIndex = value;
        return this;
    }

    /**
     * {Target}
     * Specifies the target for where to open the linked document or where to submit the form.
     * The equivalent of HTML attribute `target`. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
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
     * {Title}
     * Specifies extra information about an element, equivalent to the HTML attribute `title`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
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


    type(): string;
    type(value: string): this;
    /**
     * {Type}
     * Specifies the type of element, equivalent to the HTML attribute `type`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    type(value?: string): string | this {
        if (value == null) { return this.getAttribute("type") ?? ""; }
        this.setAttribute("type", value);
        return this;
    }

    use_map(): string;
    use_map(value: string): this;
    /**
     * {Use Map}
     * Specifies an image as a client-side image map, equivalent to the HTML attribute `usemap`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    use_map(value?: string): string | this {
        if (value == null) { return super.useMap ?? ""; }
        super.useMap = value;
        return this;
    }

    value(): string;
    value(value: string): this;
    /**
     * {Value}
     * Specifies the value of the element, equivalent to the HTML attribute `value`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    value(value?: string): string | this {
        /**
        * @warning
        * The actual implementation of for inputs is overriden
        * in {@link VInputElement.value} and {@link VTextAreaElement.value}, so this method is not used in those classes.
        * Otherwise the `value` attribute cant be retrieved correctly.
        */
        if (value == null) return this.getAttribute("value") ?? "";
        this.setAttribute("value", value);
        return this;
    }

    // /**
    //     * docs:
    //     * @title: On after print
    //     * @desc: Script to be run after the document is printed. The equivalent of HTML attribute `onafterprint`. 
    //     *        The first parameter of the callback is the `VElement` object. 
    //     * @param:
    //     *     @name: callback
    //     *     @descr: The callback function to execute after printing. It receives the `VElement` object and the event.
    //     * @return:
    //     *     @description Returns the `VElement` object unless the parameter `callback` is `null`, then the attribute's value is returned.
    //     * @funcs: 2
    //     */
    // on_after_print(): Function | undefined;
    // on_after_print(callback: (element: VElement, event:  Event) => any): this;
    // on_after_print(callback?: (element: VElement, event:  Event) => any): this | Function | undefined {
    //  if (callback == null) { return this.onafterprint; }
    //  const e = this;
    //  this.onafterprint = (t) => callback(e, t);
    //  return this;
    // }

    // /**
    //     * docs:
    //     * @title: On before print
    //     * @desc: Script to be run before the document is printed. The equivalent of HTML attribute `onbeforeprint`.
    //     * @param:
    //     *     @name: callback
    //     *     @descr: The function to be executed before printing, receiving the `VElement` object as the first parameter.
    //     * @return:
    //     *     @description Returns the instance of the element for chaining unless parameter `callback` is `null`, then the attribute's value is returned.
    //     * @funcs: 2
    //     */
    // on_before_print(): Function | undefined;
    // on_before_print(callback: (element: VElement, event:  Event) => any): this;
    // on_before_print(callback?: (element: VElement, event:  Event) => any): this | Function | undefined {
    //  if (callback == null) { return this.onbeforeprint; }
    //  const e = this;
    //  this.onbeforeprint = (t) => callback(e, t);
    //  return this;
    // }

    // /**
    //     * docs:
    //     * @title: On Before Unload
    //     * @desc: Script to be run when the document is about to be unloaded. 
    //     *        This is the equivalent of the HTML attribute `onbeforeunload`. 
    //     *        The first parameter of the callback is the `VElement` object.
    //     * @param:
    //     *     @name: callback
    //     *     @descr: The callback function to execute before unloading the document.
    //     * @return:
    //     *     @descr: Returns the `VElement` object. Unless parameter `callback` is `null`, then the attribute's value is returned.
    //     * @funcs: 2
    //     */
    // on_before_unload(): Function | undefined;
    // on_before_unload(callback: (element: VElement, event:  Event) => any): this;
    // on_before_unload(callback?: (element: VElement, event:  Event) => any): this | Function | undefined {
    //  if (callback == null) { return this.onbeforeunload; }
    //  const e = this;
    //  this.onbeforeunload = (t) => callback(e, t);
    //  return this;
    // }

    // /**
    //     * docs:
    //     * @title: On hash change
    //     * @desc: 
    //     *     Script to be run when there has been changes to the anchor part of a URL.
    //     *     The equivalent of HTML attribute `onhashchange`.
    //     *     
    //     *     The first parameter of the callback is the `VElement` object.
    //     *     
    //     * @param:
    //     *     @name: callback
    //     *     @descr: The callback function to execute on hash change.
    //     * @return:
    //     *     @description Returns the `VElement` object for chaining. If parameter `value` is `null`, the attribute's value is returned.
    //     * @funcs: 2
    //     */
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
        *  @descr: 
        *      Fires after the page is finished loading.
        *      The equivalent of HTML attribute `onload`.
        *      
        *      The first parameter of the callback is the `VElement` object.
        *      
        *  @return: 
        *  @parameter:
        *      @name: value
        *      @descr: The value to assign. Leave `null` to retrieve the attribute's value.
        *  @inherit: false
        */
    // on_load(callback) {
    //  if (callback == null) { return this.onload; }
    //  const e = this;
    //  this.onload = (t) => callback(e, t);
    //  return this;
    // }

    // /**
    //     * docs:
    //     * @title: On message
    //     * @desc: 
    //     *     Script to be run when the message is triggered.
    //     *     The equivalent of HTML attribute `onmessage`.
    //     *     
    //     *     The first parameter of the callback is the `VElement` object.
    //     *     
    //     * @param:
    //     *     @name: value
    //     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
    //     * @return:
    //     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
    //     * @funcs: 2
    //     */
    // on_message(): Function | undefined;
    // on_message(callback: (element: VElement, event:  Event) => any): this;
    // on_message(callback?: (element: VElement, event:  Event) => any): this | Function | undefined {
    //     if (callback == null) { return this.onmessage; }
    //     const e = this;
    //     this.onmessage = (t) => callback(e, t);
    //     return this;
    // }

    // /**
    //     * docs:
    //     * @title: On Offline
    //     * @desc: Script to be run when the browser starts to work offline. The equivalent of HTML attribute `onoffline`. 
    //     *        The first parameter of the callback is the `VElement` object. 
    //     * @param:
    //     *     @name: value
    //     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
    //     * @return:
    //     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
    //     * @funcs: 2
    //     */
    // on_offline(): Function | undefined;
    // on_offline(callback: (element: VElement, event:  Event) => any): this;
    // on_offline(callback?: (element: VElement, event:  Event) => any): this | Function | undefined {
    //  if (callback == null) { return this.onoffline; }
    //  const e = this;
    //  this.onoffline = (t) => callback(e, t);
    //  return this;
    // }

    // /**
    //     * docs:
    //     * @title: On online
    //     * @desc: Script to be run when the browser starts to work online. 
    //     *        The equivalent of HTML attribute `ononline`. 
    //     *        The first parameter of the callback is the `VElement` object.
    //     * @param:
    //     *     @name: value
    //     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
    //     * @return:
    //     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
    //     * @funcs: 2
    //     */
    // on_online(): Function | undefined;
    // on_online(callback: (element: VElement, event:  Event) => any): this;
    // on_online(callback?: (element: VElement, event:  Event) => any): this | Function | undefined {
    //  if (callback == null) { return this.ononline; }
    //  const e = this;
    //  this.ononline = (t) => callback(e, t);
    //  return this;
    // }

    // /**
    //     * docs:
    //     * @title: On page hide
    //     * @desc: 
    //     *     Script to be run when a user navigates away from a page.
    //     *     The equivalent of HTML attribute `onpagehide`.
    //     * @param:
    //     *     @name: value
    //     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
    //     * @return:
    //     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
    //     * @funcs: 2
    //     */
    // on_page_hide(): Function | undefined;
    // on_page_hide(callback: (element: VElement, event:  Event) => any): this;
    // on_page_hide(callback?: (element: VElement, event:  Event) => any): this | Function | undefined {
    //  if (callback == null) { return this.onpagehide; }
    //  const e = this;
    //  this.onpagehide = (t) => callback(e, t);
    //  return this;
    // }

    // /**
    //     * docs:
    //     * @title: On page show
    //     * @desc: 
    //     *     Script to be run when a user navigates to a page.
    //     *     The equivalent of HTML attribute `onpageshow`.
    //     *     The first parameter of the callback is the `VElement` object.
    //     * @param:
    //     *     @name: value
    //     *     @descr: The value to assign. Leave `null` to retrieve the attribute's value.
    //     * @return:
    //     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
    //     * @funcs: 2
    //     */
    // on_page_show(): Function | undefined;
    // on_page_show(callback: ElementEvent<this>): this;
    // on_page_show(callback?: ElementEvent<this>): this | Function | undefined {
    //     if (callback == null) { return this.onpageshow; }
    //     const e = this;
    //     this.onpageshow = (t) => callback(e, t);
    //     return this;
    // }

    // /**
    //     * docs:
    //     * @title: On Popstate
    //     * @desc: Script to be run when the window's history changes. The equivalent of HTML attribute `onpopstate`. 
    //     *        The first parameter of the callback is the `VElement` object. Returns the attribute value when parameter `value` is `null`.
    //     * @param:
    //     *     @name: callback
    //     *     @descr: The callback function to execute on popstate event.
    //     * @return:
    //     *     @description Returns the `VElement` object. Unless parameter `callback` is `null`, then the attribute's value is returned.
    //     * @funcs: 2
    //     */
    // on_popstate(): Function | undefined;
    // on_popstate(callback: (element: VElement, event: PopStateEvent) => any): this;
    // on_popstate(callback?: (element: VElement, event: PopStateEvent) => any): this | Function | undefined {
    //     if (callback == null) { return this.onpopstate; }
    //     const e = this;
    //     this.onpopstate = (t) => callback(e, t);
    //     return this;
    // }

    // /**
    //     * docs:
    //     * @title: On Storage
    //     * @desc: Script to be run when a Web Storage area is updated. 
    //     *        The equivalent of HTML attribute `onstorage`. 
    //     *        The first parameter of the callback is the `VElement` object.
    //     * @param:
    //     *     @name: callback
    //     *     @descr: The function to be executed when storage is updated.
    //     * @return:
    //     *     @description Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
    //     * @funcs: 2
    //     */
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

    on_blur(): Function | undefined;
    on_blur(callback: ElementEvent<this>): this;
    /**
     * {On Blur}
     * Fires the moment that the element loses focus, similar to the HTML attribute `onblur`.
     * The first parameter of the callback is the `VElement` object.
     * @param callback The function to call when the element loses focus.
     * @returns Returns the `VElement` object unless the parameter `callback` is `null`,
     * then the attribute's value is returned.
     * @docs
     */
    on_blur(callback?: ElementEvent<this>): this | Function | undefined {
        if (callback == null) { return this.onblur ?? undefined; }
        const e = this;
        this.onblur = (t) => callback(e, t);
        return this;
    }

    on_change(): Function | undefined;
    on_change(callback: ElementEvent<this>): this;
    /**
     * {On Change}
     * Fires the moment when the value of the element is changed. The equivalent of HTML attribute `onchange`. Returns the attribute value when parameter `value` is `null`.
     * @param callback The function to call when the value changes, receiving the `VElement` object and the event as parameters.
     * @returns Returns the `VElement` object for chaining. If `callback` is `null`, returns the current `onchange` value.
     * @docs
     */
    on_change(callback?: ElementEvent<this>): this | Function | undefined {
        if (callback == null) { return this.onchange ?? undefined; }
        const e = this;
        this.onchange = (t) => callback(e, t);
        return this;
    }

    on_focus(): Function | undefined;
    on_focus(callback: ElementEvent<this>): this;
    /**
     * {On Focus}
     * Fires the moment when the element gets focus. This is the equivalent of the HTML attribute `onfocus`.
     * The first parameter of the callback is the `VElement` object.
     * @param callback The function to be called when the element gets focus.
     * @returns Returns the `VElement` object unless the parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_focus(callback?: ElementEvent<this>): this | Function | undefined {
        if (callback == null) { return this.onfocus ?? undefined; }
        const e = this;
        this.onfocus = (t) => callback(e, t);
        return this;
    }

    on_input(): ElementEvent<this> | undefined;
    on_input(callback: ElementEvent<this>): this;
    /**
     * {On Input}
     * Script to be run when an element gets user input.
     * The equivalent of HTML attribute `oninput`.
     * @param callback The function to call when user input is detected.
     * @returns Returns the `VElement` object for chaining, or the attribute's value if the parameter is `null`.
     * @docs
     */
    on_input(callback?: ElementEvent<this>): this | ElementEvent<this> | undefined {
        if (callback == null) { return (this.oninput as any) ?? undefined; }
        const e = this;
        this.oninput = (t) => callback(e, t);
        return this;
    }

    on_before_input(): Function | undefined;
    on_before_input(callback: ElementEvent<this>): this;
    /**
     * {On Input}
     * Script to be run before an element gets user input. The equivalent of HTML attribute `onbeforeinput`.
     * @param callback The function to execute before user input. Receives the `VElement` object and the event as parameters.
     * @returns r: Returns the `VElement` object for chaining. If `callback` is `null`, returns the current value of `onbeforeinput`.
     * @docs
     */
    on_before_input(callback?: ElementEvent<this>): this | Function | undefined {
        if (callback == null) { return (this.onbeforeinput as any) ?? undefined; }
        const e = this;
        this.onbeforeinput = (t) => callback(e, t);
        return this;
    }

    on_invalid(): Function | undefined;
    on_invalid(callback: ElementEvent<this>): this;
    /**
     * {On Invalid}
     * Script to be run when an element is invalid. The equivalent of HTML attribute `oninvalid`.
     * The first parameter of the callback is the `VElement` object.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_invalid(callback?: ElementEvent<this>): this | Function | undefined {
        if (callback == null) { return this.oninvalid ?? undefined; }
        const e = this;
        this.oninvalid = (t) => callback(e, t);
        return this;
    }

    on_reset(): Function | undefined;
    on_reset(callback: ElementEvent<this>): this;
    /**
     * {On Reset}
     * Fires when the Reset button in a form is clicked. The equivalent of HTML attribute `onreset`.
     * The first parameter of the callback is the `VElement` object. Returns the attribute value when parameter `value` is `null`.
     * @param callback The function to call when the Reset button is clicked.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_reset(callback?: ElementEvent<this>): this | Function | undefined {
        if (callback == null) { return this.onreset ?? undefined; }
        const e = this;
        this.onreset = (t) => callback(e, t);
        return this;
    }

    // @deprecated
    // on_search();

    on_select(): Function | undefined;
    on_select(callback: ElementEvent<this>): this;
    /**
     * {On Select}
     * Fires after some text has been selected in an element. The equivalent of HTML attribute `onselect`. Returns the attribute value when parameter `value` is `null`.
     * @param callback The callback function to execute when text is selected. It receives the `VElement` object as the first parameter.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_select(callback?: ElementEvent<this>): this | Function | undefined {
        if (callback == null) { return this.onselect ?? undefined; }
        const e = this;
        this.onselect = (t) => callback(e, t);
        return this;
    }

    on_submit(): Function | undefined;
    on_submit(callback: ElementEvent<this>): this;
    /**
     * {On Submit}
     * Fires when a form is submitted, similar to the HTML attribute `onsubmit`.
     * The first parameter of the callback is the `VElement` object.
     * @param callback The callback function to execute on form submission.
     * @returns Returns the instance of the element for chaining. If `callback` is null, returns the current `onsubmit` attribute value.
     * @docs
     */
    on_submit(callback?: ElementEvent<this>): this | Function | undefined {
        if (callback == null) { return this.onsubmit ?? undefined; }
        const e = this;
        this.onsubmit = (t) => callback(e, t);
        return this;
    }

    on_key_down(): Function | undefined;
    on_key_down(callback: ElementKeyboardEvent<this>): this;
    /**
     * {On Key Down}
     * Fires when a user is pressing a key. The equivalent of HTML attribute `onkeydown`.
     * The first parameter of the callback is the `VElement` object.
     * @param callback The callback function to execute when the key is pressed.
     * @returns Returns the `VElement` object for chaining. If the parameter `callback` is `null`, the current attribute's value is returned.
     * @docs
     */
    on_key_down(callback?: ElementKeyboardEvent<this>): this | Function | undefined {
        if (callback == null) { return this.onkeydown ?? undefined; }
        const e = this;
        this.onkeydown = (t) => callback(e, t);
        return this;
    }

    on_key_press(): Function | undefined;
    on_key_press(callback: ElementKeyboardEvent<this>): this;
    /**
     * {On Key Press}
     * Fires when a user presses a key, similar to the HTML `onkeypress` attribute.
     * The first parameter of the callback is the `VElement` object, allowing for dynamic handling of key events.
     * @param callback The function to call when a key is pressed. Receives the `VElement` and event as parameters.
     * @returns Returns the `VElement` object for chaining. If `callback` is `null`, the current attribute value is returned.
     * @docs
     */
    on_key_press(callback?: ElementKeyboardEvent<this>): this | Function | undefined {
        if (callback == null) { return this.onkeypress ?? undefined; }
        const e = this;
        this.onkeypress = (t) => callback(e, t);
        return this;
    }

    on_key_up(): Function | undefined;
    on_key_up(callback: ElementKeyboardEvent<this>): this;
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
    on_key_up(callback?: ElementKeyboardEvent<this>): this | Function | undefined {
        if (callback == null) { return this.onkeyup ?? undefined; }
        const e = this;
        this.onkeyup = (t) => callback(e, t);
        return this;
    }

    on_dbl_click(): Function | undefined;
    on_dbl_click(callback: ElementMouseEvent<this>): this;
    /**
     * {On dbl click}
     * Fires on a mouse double-click on the element. The equivalent of HTML attribute `ondblclick`.
     * The first parameter of the callback is the `VElement` object.
     * @param callback The function to execute on double-click. Receives the `VElement` and the event as parameters.
     * @returns Returns the `VElement` object for chaining. If `callback` is null, returns the current attribute value.
     * @docs
     */
    on_dbl_click(callback?: ElementMouseEvent<this>): this | Function | undefined {
        if (callback == null) { return this.ondblclick ?? undefined; }
        const e = this;
        this.ondblclick = (t) => callback(e, t);
        return this;
    }

    on_mouse_down(): Function | undefined;
    on_mouse_down(callback: ElementMouseEvent<this>): this;
    /**
     * {On Mouse Down}
     * Fires when a mouse button is pressed down on an element. The equivalent of HTML attribute `onmousedown`.
     * The first parameter of the callback is the `VElement` object. Returns the attribute value when parameter `value` is `null`.
     * @param callback The function to execute when the mouse button is pressed down.
     * @returns Returns the `VElement` object for chaining. If the parameter `callback` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_mouse_down(callback?: ElementMouseEvent<this>): this | Function | undefined {
        if (callback == null) { return this.onmousedown ?? undefined; }
        const e = this;
        this.onmousedown = (t) => callback(e, t);
        return this;
    }

    on_mouse_move(): Function | undefined;
    on_mouse_move(callback: ElementMouseEvent<this>): this;
    /**
     * {On Mouse Move}
     * Fires when the mouse pointer is moving while it is over an element.
     * The equivalent of HTML attribute `onmousemove`. Invokes the callback with the element and event.
     * @param callback The function to call when the mouse moves over the element.
     * @returns Returns the instance of the element for chaining. Unless parameter `callback` is `null`, then the event is returned.
     * @docs
     */
    on_mouse_move(callback?: ElementMouseEvent<this>): this | Function | undefined {
        if (callback == null) { return this.onmousemove ?? undefined; }
        const e = this;
        this.onmousemove = (t) => callback(e, t);
        return this;
    }

    on_mouse_out(): Function | undefined;
    on_mouse_out(callback: ElementMouseEvent<this>): this;
    /**
     * {On mouse out}
     * Fires when the mouse pointer moves out of an element. The equivalent of HTML attribute `onmouseout`.
     * The first parameter of the callback is the `VElement` object.
     * @param callback The callback function to execute when the mouse moves out.
     * @returns Returns the `VElement` object for chaining, or the attribute's value if the callback is `null`.
     * @docs
     */
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

    on_mouse_over(): Function | undefined;
    on_mouse_over(callback: ElementMouseEvent<this>): this;
    /**
     * {On Mouse Over}
     * Fires when the mouse pointer moves over an element, similar to the HTML `onmouseover` attribute.
     * @param callback The callback function to execute when the mouse is over the element.
     * @returns Returns the instance of the element for chaining. If `callback` is null, returns the current `onmouseover` attribute value.
     * @docs
     */
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

    on_mouse_up(): Function | undefined;
    on_mouse_up(callback: ElementMouseEvent<this>): this;
    /**
     * {On Mouse Up}
     * Fires when a mouse button is released over an element. The equivalent of HTML attribute `onmouseup`.
     * The first parameter of the callback is the `VElement` object. Returns the attribute value when parameter `value` is `null`.
     * @param callback The callback function to execute when the mouse button is released.
     * @returns Returns the `VElement` object for chaining. If `callback` is `null`, returns the current `onmouseup` value.
     * @docs
     */
    on_mouse_up(callback?: ElementMouseEvent<this>): this | Function | undefined {
        if (callback == null) { return this.onmouseup ?? undefined; }
        const e = this;
        this.onmouseup = (t) => callback(e, t);
        return this;
    }

    // @deprecated onmousewheel.
    // on_mouse_wheel();

    on_wheel(): Function | undefined;
    on_wheel(callback: (element: this, event: WheelEvent) => any): this;
    /**
     * {On Wheel}
     * Fires when the mouse wheel rolls up or down over an element. The equivalent of HTML attribute `onwheel`.
     * The first parameter of the callback is the `VElement` object.
     * @param callback The callback function to execute on wheel event.
     * @returns Returns the instance of the element for chaining. Unless parameter `callback` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_wheel(callback?: (element: this, event: WheelEvent) => any): this | Function | undefined {
        if (callback == null) { return this.onwheel ?? undefined; }
        const e = this;
        this.onwheel = (t) => callback(e, t);
        return this;
    }

    on_drag(): Function | undefined;
    on_drag(callback: ElementDragEvent<this>): this;
    /**
     * {On Drag}
     * Script to be run when an element is dragged. The equivalent of HTML attribute `ondrag`.
     * The first parameter of the callback is the `VElement` object. Returns the attribute value when parameter `value` is `null`.
     * @param callback The callback function to execute when the element is dragged.
     * @returns Returns the instance of the element for chaining unless the parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_drag(callback?: ElementDragEvent<this>): this | Function | undefined {
        if (callback == null) { return this.ondrag ?? undefined; }
        const e = this;
        this.ondrag = (t) => callback(e, t);
        return this;
    }

    on_drag_end(): Function | undefined;
    on_drag_end(callback: ElementDragEvent<this>): this;
    /**
     * {On Drag End}
     * Script to be run at the end of a drag operation. The equivalent of HTML attribute `ondragend`.
     * The first parameter of the callback is the `VElement` object.
     * @param callback The callback function to execute at the end of the drag operation.
     * @returns Returns the `VElement` object unless the parameter `value` is `null`, in which case the attribute's value is returned.
     * @docs
     */
    on_drag_end(callback?: ElementDragEvent<this>): this | Function | undefined {
        if (callback == null) { return this.ondragend ?? undefined; }
        const e = this;
        this.ondragend = (t) => callback(e, t);
        return this;
    }

    on_drag_enter(): Function | undefined;
    on_drag_enter(callback: ElementDragEvent<this>): this;
    /**
     * {On Drag Enter}
     * Script to be run when an element has been dragged to a valid drop target.
     * The equivalent of HTML attribute `ondragenter`.
     * The first parameter of the callback is the `VElement` object.
     * @param callback The function to execute when the drag enters the target.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_drag_enter(callback?: ElementDragEvent<this>): this | Function | undefined {
        if (callback == null) { return this.ondragenter ?? undefined; }
        const e = this;
        this.ondragenter = (t) => callback(e, t);
        return this;
    }

    on_drag_leave(): Function | undefined;
    on_drag_leave(callback: ElementDragEvent<this>): this;
    /**
     * {On drag leave}
     * Script to be run when an element leaves a valid drop target.
     * The equivalent of HTML attribute `ondragleave`.
     * The first parameter of the callback is the `VElement` object.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_drag_leave(callback?: ElementDragEvent<this>): this | Function | undefined {
        if (callback == null) { return this.ondragleave ?? undefined; }
        const e = this;
        this.ondragleave = (t) => callback(e, t);
        return this;
    }

    on_drag_over(): Function | undefined;
    on_drag_over(callback: ElementDragEvent<this>): this;
    /**
     * {On drag over}
     * Script to be run when an element is being dragged over a valid drop target.
     * The equivalent of HTML attribute `ondragover`.
     * @param callback The function to execute when the drag over event occurs.
     * @returns Returns the `VElement` object. Unless parameter `callback` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_drag_over(callback?: ElementDragEvent<this>): this | Function | undefined {
        if (callback == null) { return this.ondragover ?? undefined; }
        const e = this;
        this.ondragover = (t) => callback(e, t);
        return this;
    }

    on_drag_start(): Function | undefined;
    on_drag_start(callback: ElementDragEvent<this>): this;
    /**
     * {On Drag Start}
     * Script to be run at the start of a drag operation. The equivalent of HTML attribute `ondragstart`.
     * The first parameter of the callback is the `VElement` object.
     * @param callback The function to call when the drag starts.
     * @returns Returns the `VElement` object for chaining unless parameter `callback` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_drag_start(callback?: ElementDragEvent<this>): this | Function | undefined {
        if (callback == null) { return this.ondragstart ?? undefined; }
        const e = this;
        this.ondragstart = (t) => callback(e, t);
        return this;
    }

    on_drop(): Function | undefined;
    on_drop(callback: ElementEvent<this>): this;
    /**
     * {On drop}
     * Script to be run when dragged element is being dropped. The equivalent of HTML attribute `ondrop`. The first parameter of the callback is the `VElement` object. Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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

    on_copy(): Function | undefined;
    on_copy(callback: ElementEvent<this>): this;
    /**
     * {On Copy}
     * Fires when the user copies the content of an element. The equivalent of HTML attribute `oncopy`.
     * The first parameter of the callback is the `VElement` object.
     * @param callback The function to be called when the copy event occurs.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_copy(callback?: ElementEvent<this>): this | Function | undefined {
        if (callback == null) { return this.oncopy ?? undefined; }
        const e = this;
        this.oncopy = (t) => callback(e, t);
        return this;
    }

    on_cut(): Function | undefined;
    on_cut(callback: ElementEvent<this>): this;
    /**
     * {On Cut}
     * Fires when the user cuts the content of an element, equivalent to the HTML attribute `oncut`.
     * The first parameter of the callback is the `VElement` object.
     * @param callback The function to call when the cut event occurs.
     * @returns Returns the `VElement` object unless the parameter `callback` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_cut(callback?: ElementEvent<this>): undefined | Function | this {
        if (callback == null) { return this.oncut ?? undefined; }
        const e = this;
        this.oncut = (t) => callback(e, t);
        return this;
    }

    on_paste(): Function | undefined;
    on_paste(callback: ElementEvent<this>): this;
    /**
     * {On Paste}
     * Fires when the user pastes some content in an element. The equivalent of HTML attribute `onpaste`.
     * The first parameter of the callback is the `VElement` object. Returns the attribute value when parameter `value` is `null`.
     * @param callback The function to call when the paste event occurs.
     * @returns Returns the `VElement` object for chaining. If `callback` is `null`, returns the current `onpaste` attribute value.
     * @docs
     */
    on_paste(callback?: ElementEvent<this>): undefined | Function | this {
        if (callback == null) { return this.onpaste ?? undefined; }
        const e = this;
        this.onpaste = (t) => callback(e, t);
        return this;
    }

    on_abort(): Function | undefined;
    on_abort(callback: ElementEvent<this>): this;
    /**
     * {On Abort}
     * Script to be run on abort, equivalent to the HTML attribute `onabort`.
     * The first parameter of the callback is the `VElement` object.
     * @param callback The callback function to execute on abort event.
     * @returns Returns the instance of the element for chaining. Unless parameter `callback` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_abort(callback?: ElementEvent<this>): undefined | Function | this {
        if (callback == null) { return this.onabort ?? undefined; }
        const e = this;
        this.onabort = (t) => callback(e, t);
        return this;
    }

    on_canplay(): Function | undefined;
    on_canplay(callback: ElementEvent<this>): this;
    /**
     * {On Can Play}
     * Script to be run when a file is ready to start playing (when it has buffered enough to begin).
     * The equivalent of HTML attribute `oncanplay`.
     * @param callback The callback function to execute when the event occurs.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_canplay(callback?: ElementEvent<this>): undefined | Function | this {
        if (callback == null) { return this.oncanplay ?? undefined; }
        const e = this;
        this.oncanplay = (t) => callback(e, t);
        return this;
    }

    on_canplay_through(): Function | undefined;
    on_canplay_through(callback: ElementEvent<this>): this;
    /**
     * {On Can Play Through}
     * Script to be run when a file can be played all the way to the end without pausing for buffering.
     * The equivalent of HTML attribute `oncanplaythrough`.
     * @param callback The callback function to execute when the event occurs.
     * @returns r: Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_canplay_through(callback?: ElementEvent<this>): undefined | Function | this {
        if (callback == null) { return this.oncanplaythrough ?? undefined; }
        const e = this;
        this.oncanplaythrough = (t) => callback(e, t);
        return this;
    }

    on_cue_change(): Function | undefined;
    on_cue_change(callback: ElementEvent<this>): this;
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
    on_cue_change(callback?: ElementEvent<this>): undefined | Function | this {
        if (callback == null) { return this.oncuechange ?? undefined; }
        const e = this;
        this.oncuechange = (t) => callback(e, t);
        return this;
    }

    on_duration_change(): Function | undefined;
    on_duration_change(callback: ElementEvent<this>): this;
    /**
     * {On Duration Change}
     * Script to be run when the length of the media changes. The equivalent of HTML attribute `ondurationchange`.
     * The first parameter of the callback is the `VElement` object.
     * @param callback The callback function to execute on duration change.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_duration_change(callback?: ElementEvent<this>): undefined | Function | this {
        if (callback == null) { return this.ondurationchange ?? undefined; }
        const e = this;
        this.ondurationchange = (t) => callback(e, t);
        return this;
    }

    on_emptied(): Function | undefined;
    on_emptied(callback: ElementEvent<this>): this;
    /**
     * {On Emptied}
     * Script to be run when something bad happens and the file is suddenly unavailable (like unexpectedly disconnects).
     * The equivalent of HTML attribute `onemptied`. The first parameter of the callback is the `VElement` object.
     * @param callback The callback function to execute when the event occurs.
     * @returns r: Returns the `VElement` object. Unless parameter `callback` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_emptied(callback?: ElementEvent<this>): undefined | Function | this {
        if (callback == null) { return this.onemptied ?? undefined; }
        const e = this;
        this.onemptied = (t) => callback(e, t);
        return this;
    }

    on_ended(): Function | undefined;
    on_ended(callback: ElementEvent<this>): this;
    /**
     * {On ended}
     * Script to be run when the media has reach the end (a useful event for messages like "thanks for listening").
     * The equivalent of HTML attribute `onended`.
     * @param callback The function to call when the media ends. Leave `null` to retrieve the current callback.
     * @returns Returns the instance of the element for chaining. Unless parameter `callback` is `null`, then the current callback function is returned.
     * @docs
     */
    on_ended(callback?: ElementEvent<this>): undefined | Function | this {
        if (callback == null) { return this.onended ?? undefined; }
        const e = this;
        this.onended = (t) => callback(e, t);
        return this;
    }

    on_error(): Function | undefined;
    on_error(callback: (element: this, error: string | Event) => any): this;
    /**
     * {On Error}
     * Script to be run when an error occurs while loading the file, similar to HTML's `onerror` attribute.
     * The first parameter of the callback is the `VElement` object. Returns the attribute value if `value` is `null`.
     * @param callback The callback function to execute on error. It receives the `VElement` object and the error event.
     * @returns Returns the instance of the element for chaining, unless `callback` is `null`, then the current `onerror` attribute value is returned.
     * @docs
     */
    on_error(callback?: (element: this, error: string | Event) => any): undefined | Function | this {
        if (callback == null) { return this.onerror ?? undefined; }
        const e = this;
        this.onerror = (t) => callback(e, t);
        return this;
    }

    on_loaded_data(): Function | undefined;
    on_loaded_data(callback: ElementEvent<this>): this;
    /**
     * {On Loaded Data}
     * Script to be run when media data is loaded. The equivalent of HTML attribute `onloadeddata`.
     * @param callback The callback function that receives the `VElement` object and the event.
     * @returns Returns the `VElement` object unless parameter `callback` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_loaded_data(callback?: ElementEvent<this>): undefined | Function | this {
        if (callback == null) { return this.onloadeddata ?? undefined; }
        const e = this;
        this.onloadeddata = (t) => callback(e, t);
        return this;
    }

    on_loaded_metadata(): Function | undefined;
    on_loaded_metadata(callback: ElementEvent<this>): this;
    /**
     * {On loaded metadata}
     * Script to be run when meta data (like dimensions and duration) are loaded.
     * The equivalent of HTML attribute `onloadedmetadata`.
     * The first parameter of the callback is the `VElement` object.
     * @param callback A function to be executed when metadata is loaded.
     * @returns Returns the `VElement` object. Unless parameter `callback` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_loaded_metadata(callback?: ElementEvent<this>): undefined | Function | this {
        if (callback == null) { return this.onloadedmetadata ?? undefined; }
        const e = this;
        this.onloadedmetadata = (t) => callback(e, t);
        return this;
    }

    on_load_start(): Function | undefined;
    on_load_start(callback: ElementEvent<this>): this;
    /**
     * {On load start}
     * Script to be run just as the file begins to load before anything is actually loaded.
     * The equivalent of HTML attribute `onloadstart`.
     * The first parameter of the callback is the `VElement` object.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_load_start(callback?: ElementEvent<this>): undefined | Function | this {
        if (callback == null) { return this.onloadstart ?? undefined; }
        const e = this;
        this.onloadstart = (t) => callback(e, t);
        return this;
    }

    on_pause(): Function | undefined;
    on_pause(callback: ElementEvent<this>): this;
    /**
     * {On Pause}
     * Script to be run when the media is paused either by the user or programmatically. The equivalent of HTML attribute `onpause`.
     * @param callback The callback function to execute when the media is paused. Leave `null` to retrieve the current attribute's value.
     * @returns Returns the instance of the element for chaining unless the parameter is `null`, then the current attribute's value is returned.
     * @docs
     */
    on_pause(callback?: ElementEvent<this>): undefined | Function | this {
        if (callback == null) { return this.onpause ?? undefined; }
        const e = this;
        this.onpause = (t) => callback(e, t);
        return this;
    }

    on_play(): Function | undefined;
    on_play(callback: ElementEvent<this>): this;
    /**
     * {On Play}
     * Script to be run when the media is ready to start playing. The equivalent of HTML attribute `onplay`.
     * The first parameter of the callback is the `VElement` object. Returns the attribute value when parameter `value` is `null`.
     * @param callback The function to be executed when the media starts playing.
     * @returns Returns the `VElement` object. Unless parameter `callback` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_play(callback?: ElementEvent<this>): undefined | Function | this {
        if (callback == null) { return this.onplay ?? undefined; }
        const e = this;
        this.onplay = (t) => callback(e, t);
        return this;
    }

    on_playing(): Function | undefined;
    on_playing(callback: (element: this, time: any) => any): this;
    /**
     * {On Playing}
     * Script to be run when the media actually has started playing. This is the equivalent of the HTML attribute `onplaying`.
     * @param callback The function to execute when the media starts playing. It receives the `VElement` object as the first parameter.
     * @returns Returns the instance of the element for chaining. If `null` is passed, it returns the current `onplaying` callback.
     * @docs
     */
    on_playing(callback?: (element: this, time: any) => any): this | Function | undefined {
        if (callback == null) { return this.onplaying ?? undefined; }
        const e = this;
        this.onplaying = (t) => callback(e, t);
        return this;
    }

    on_progress(): Function | undefined;
    on_progress(callback: ElementEvent<this>): this;
    /**
     * {Onprogress}
     * Script to be run when the browser is in the process of getting the media data.
     * The equivalent of HTML attribute `onprogress`. Returns the attribute value when parameter `value` is `null`.
     * @param callback The function to be executed when the media data is being loaded.
     * @returns Returns the `VElement` object. Unless parameter `callback` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_progress(callback?: ElementEvent<this>): this | Function | undefined {
        if (callback == null) { return this.onprogress ?? undefined; }
        const e = this;
        this.onprogress = (t) => callback(e, t);
        return this;
    }

    on_rate_change(): Function | undefined;
    on_rate_change(callback: ElementEvent<this>): this;
    /**
     * {On Rate Change}
     * Script to be run each time the playback rate changes (like when a user switches to a slow motion or fast forward mode).
     * The equivalent of HTML attribute `onratechange`. Returns the attribute value when parameter `value` is `null`.
     * @param callback The callback function to execute on rate change.
     * @returns Returns the `VElement` object unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_rate_change(callback?: ElementEvent<this>): undefined | this | Function {
        if (callback == null) { return this.onratechange ?? undefined; }
        const e = this;
        this.onratechange = (t) => callback(e, t);
        return this;
    }

    on_seeked(): Function | undefined;
    on_seeked(callback: (element: this, time: any) => any): this;
    /**
     * {On seeked}
     * Script to be run when the seeking attribute is set to false indicating that seeking has ended.
     * The equivalent of HTML attribute `onseeked`.
     * @param callback The callback function to execute when seeking ends.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_seeked(callback?: (element: this, time: any) => any): this | Function | undefined {
        if (callback == null) { return this.onseeked ?? undefined; }
        const e = this;
        this.onseeked = (t) => callback(e, t);
        return this;
    }

    on_seeking(): Function | undefined;
    on_seeking(callback: (element: this, time: any) => any): this;
    /**
     * {On Seeking}
     * Script to be run when the seeking attribute is set to true indicating that seeking is active.
     * The equivalent of HTML attribute `onseeking`.
     * @param callback The callback function to execute when seeking occurs.
     * @returns Returns the instance of the element for chaining. Unless parameter `callback` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_seeking(callback?: (element: this, time: any) => any): this | Function | undefined {
        if (callback == null) { return this.onseeking ?? undefined; }
        const e = this;
        this.onseeking = (t) => callback(e, t);
        return this;
    }

    on_stalled(): Function | undefined;
    on_stalled(callback: ElementEvent<this>): this;
    /**
     * {On Stalled}
     * Script to be run when the browser is unable to fetch the media data for whatever reason. This is the equivalent of the HTML attribute `onstalled`. The first parameter of the callback is the `VElement` object.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns r: Returns the `VElement` object unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_stalled(callback?: ElementEvent<this>): this | Function | undefined {
        if (callback == null) { return this.onstalled ?? undefined; }
        const e = this;
        this.onstalled = (t) => callback(e, t);
        return this;
    }

    on_suspend(): Function | undefined;
    on_suspend(callback: Function): this;
    /**
     * {On Suspend}
     * Script to be run when fetching the media data is stopped before it is completely loaded for whatever reason. The equivalent of HTML attribute `onsuspend`.
     * @param callback The function to be executed when the suspend event occurs. The first parameter of the callback is the `VElement` object.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_suspend(callback?: Function): this | Function | undefined {
        if (callback == null) { return this.onsuspend ?? undefined; }
        const e = this;
        this.onsuspend = (t) => callback(e, t);
        return this;
    }

    on_time_update(): Function | undefined;
    on_time_update(callback: ElementEvent<this>): this;
    /**
     * {On Time Update}
     * Script to be run when the playing position has changed (like when the user fast forwards to a different point in the media). The equivalent of HTML attribute `ontimeupdate`.
     * @param callback The callback function to execute when the time updates. The first parameter of the callback is the `VElement` object.
     * @returns Returns the `VElement` object. Unless parameter `callback` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_time_update(callback?: ElementEvent<this>): this | Function | undefined {
        if (callback == null) { return this.ontimeupdate ?? undefined; }
        const e = this;
        this.ontimeupdate = (t) => callback(e, t);
        return this;
    }

    on_volume_change(): Function | undefined;
    on_volume_change(callback: ElementEvent<this>): this;
    /**
     * {On Volume Change}
     * Script to be run each time the volume is changed which includes setting the volume to "mute".
     * The equivalent of HTML attribute `onvolumechange`. The first parameter of the callback is the `VElement` object.
     * @param callback The callback function to execute on volume change.
     * @returns Returns the `VElement` object for chaining unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_volume_change(callback?: ElementEvent<this>): this | Function | undefined {
        if (callback == null) { return this.onvolumechange ?? undefined; }
        const e = this;
        this.onvolumechange = (t) => callback(e, t);
        return this;
    }

    on_waiting(): Function | undefined;
    on_waiting(callback: (element: this, time: any) => any): this;
    /**
     * {On Waiting}
     * Script to be run when the media has paused but is expected to resume (like when the media pauses to buffer more data). The equivalent of HTML attribute `onwaiting`.
     * @param callback The callback function to execute when the media is waiting.
     * @returns Returns the `VElement` object unless parameter `callback` is `null`, then the attribute's value is returned.
     * @docs
     */
    on_waiting(callback?: (element: this, time: any) => any): this | Function | undefined {
        if (callback == null) { return this.onwaiting ?? undefined; }
        const e = this;
        this.onwaiting = (t) => callback(e, t);
        return this;
    }

    on_toggle(): Function | undefined;
    on_toggle(callback: ElementEvent<this>): this;
    /**
     * {On toggle}
     * Fires when the user opens or closes the \<details> element.
     * The equivalent of HTML attribute `ontoggle`.
     * The first parameter of the callback is the `VElement` object.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object. Unless parameter `value` is `null`, then the attribute's value is returned.
     * @docs
     */
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
function mixin(derived: any, opts?: {
    ignore_methods?: string[];
}) {

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
export function extend<T extends Record<string, ((this: VElement & ThisType<VElement>, ...args: any[]) => any) | any>>(extension: T) {
    Object.assign(VElement.prototype, extension);
    mixed_classes.forEach(instance => {
        Object.assign(instance.prototype, extension);
    });
};

// Post process velement.
function postprocess(type: any, opts?: {
    mixin?: {
        ignore_methods?: string[];
    }
}): void {
    mixin(type, opts?.mixin);
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
    private static value_property = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VInputElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }

    // This function MUST be defined here due to the mixin and InputElement value method override.
    value(): string;
    value(value: string): this;
    /**
     * Value
     * Specifies the value of the element, equivalent to the HTML attribute `value`.
     *        Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless `value` is `null`, then the attribute's value is returned.
     */
    value(value?: string): string | this {
        // // @ts-ignore
        // if (value == null) return super.value ?? "";
        // // @ts-ignore
        // super.value = value;
        // if (value == null) return this.getAttribute("value") ?? "";
        // this.setAttribute("value", value);
        if (value == null) return (VInputElement as any).value_property!.get!.call(this) ?? "";
        VInputElement.value_property!.set!.call(this, value); // throws an error when used on non input element but that is fine.
        return this;
    }
}
// @ts-ignore
// export interface VInputElement extends HTMLInputElement, VElement, VElementExtensions {};
postprocess(VInputElement, { mixin: { ignore_methods: ["value"] } });
export const VInput = wrapper(VInputElement);
export const NullVInput = create_null(VInputElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VInputElement: VInputElement }}

// Base class VTextAreaElement derived from HTMLTextAreaElement.
// @ts-ignore
export class VTextAreaElement extends (HTMLTextAreaElement as unknown as VElementBaseSignature2) {
    static element_name = "VTextAreaElement";
    static element_tag = "textarea";
    private static value_property = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
    constructor(args: DerivedVElementInitOptions = {}) {
        super();
        args.derived ??= VTextAreaElement;
        this._init_sys_velement(args as BaseVElementInitOptions);
    }
    
    // This function MUST be defined here due to the mixin and InputElement value method override.
    value(): string;
    value(value: string): this;
    /**
     * Value
     * Specifies the value of the element, equivalent to the HTML attribute `value`.
     *        Returns the attribute value when parameter `value` is `null`.
     * @param value The value to assign. Leave `null` to retrieve the attribute's value.
     * @returns Returns the `VElement` object for chaining unless `value` is `null`, then the attribute's value is returned.
     */
    value(value?: string): string | this {
        // @ts-ignore
        // if (value == null) return super.value ?? "";
        // @ts-ignore
        // super.value = value;
        // if (value == null) return this.getAttribute("value") ?? "";
        // this.setAttribute("value", value);
        if (value == null) return VTextAreaElement.value_property.get.call(this) ?? "";
        VTextAreaElement.value_property!.set!.call(this, value); // throws an error when used on non input element but that is fine.
        return this;
    }
}
// @ts-ignore
// export interface VTextAreaElement extends HTMLTextAreaElement, VElement, VElementExtensions {};
postprocess(VTextAreaElement, { mixin: { ignore_methods: ["value"] } });
export const VTextArea = wrapper(VTextAreaElement);
export const NullVTextArea = create_null(VTextAreaElement);
declare module '../ui/any_element.d.ts' { interface AnyElementMap { VTextAreaElement: VTextAreaElement } }


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