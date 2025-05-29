/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
// Imports.
import { Elements } from "../elements/module.js";
import { Scheme } from "@vandenberghinc/vlib/frontend";
import { VStack, VStackElement, HStack, ZStack } from "./stack";
import { ForEach } from "./for_each";
import { Text } from "./text";
import { Divider } from "./divider";
/*	@docs:
    @nav: Frontend
    @chapter: Elements
    @title: Tabs
    @description: Create a tabs element with content that will be presented when the tab is selected.
    @param:
        @name: content
        @descr: The tab contents.
        @type: Tab[]
        @attributes_type: Tab
        @attr:
            @name: title
            @descr: The tab title.
        @attr:
            @name: content
            @descr: The volt node to be presented when the tab is selected.
        @attr:
            @name: on_header
            @descr:
                A callback that can be set to edit the tab's header title node.
                The callback takes the arguments local header node and parent tabs node as `(header_node, tabs_node)`.
 */
let TabsElement = (() => {
    let _classDecorators = [Elements.create({
            name: "TabsElement",
            default_style: {
                ...VStackElement.default_style,
                "font-size": "16px",
                "font-weight": "500",
                "overflow-x": "hidden",
                "width": "100%",
                "--tabs-tint": "blue",
                "--tabs-tab-opac": 0.8,
                "--tabs-div-bg": "gray",
                "--tabs-div-opac": 0.5,
            },
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VStackElement;
    var TabsElement = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TabsElement = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        // Attributes.
        _tint;
        _tab_opac;
        _div_bg;
        _div_opac;
        _selected_node;
        _tab_nodes;
        _on_tab_header;
        _div;
        _animate;
        _duration;
        // Constructor.
        constructor({ content = [], animate = true, duration = 300, }) {
            // Inherit.
            super();
            this._init({
                derived: TabsElement,
            });
            // Params.
            this._animate = animate;
            this._duration = duration;
            // Attributes.
            this._tint = TabsElement.default_style["--tabs-tint"];
            this._tab_opac = TabsElement.default_style["--tabs-tab-opac"];
            if (this._tab_opac === false) {
                this._tab_opac = -1;
            }
            this._div_bg = TabsElement.default_style["--tabs-div-bg"];
            this._div_opac = TabsElement.default_style["--tabs-div-opac"];
            this._selected_node = undefined;
            this._tab_nodes = [];
            // Build.
            this.color("white");
            this.build(content);
        }
        // Set default since it inherits another element.
        set_default() {
            return super.set_default(TabsElement);
        }
        styles(style_dict) {
            if (style_dict == null) {
                let styles = super.styles();
                styles["--tabs-tint"] = this._tint;
                styles["--tabs-tab-opac"] = this._tab_opac.toString();
                styles["--tabs-div-bg"] = this._div_bg;
                styles["--tabs-div-opac"] = this._div_opac.toString();
                return styles;
            }
            else {
                return super.styles(style_dict);
            }
        }
        // Build.
        /*	@docs:
            @title: Build
            @description:
                Build the tab's content. This function is called automatically from the constructor.
         */
        build(content = []) {
            // Convert conent object to array.
            if (content && typeof content === "object" && !Array.isArray(content)) {
                const old = content;
                content = Object.keys(old).map(key => ({
                    title: key,
                    content: old[key],
                }));
            }
            else if (!Array.isArray(content)) {
                console.error(`Invalid parameter type "${Scheme.value_type(content)}" for parameter "content", the valid type is "array" or "object".`);
                return this;
            }
            content = content;
            // Build.
            this.remove_children();
            const main_this = this;
            let zstack;
            this.append(HStack(ForEach(content, (content_item, index, is_last) => {
                const name = content_item.title;
                const content_stack = content_item.content;
                if (typeof name !== "string") {
                    console.error(`Invalid parameter type "${Scheme.value_type(name)}" for parameter "content.${index}.title", the valid type is "string".`);
                }
                else if (content_stack == null) {
                    console.error(`Invalid parameter type "${Scheme.value_type(content_stack)}" for parameter "content.${index}.content", the valid type is "Node". or "Array"`);
                }
                const item = HStack(// use an hstack so the user can still add flexed elements through the on_tab_header callback.
                Text(name)
                    .assign_to_parent_as("_header_title") // use unique name since more elements might be added by the user.
                    .flex_shrink(0)
                    .width("fit-content")
                    .margin_bottom(5)
                    .font_weight("inherit")
                    .font_size("inherit")
                    .color(index === 0 ? this._tint : "inherit")
                    .transition("color 250ms ease-in-out, background 250ms ease-in-out"), // also background animation for gradient colors.
                VStack()
                    .assign_to_parent_as("_header_div") // use unique name since more elements might be added by the user.
                    .position(null, 0, -1, 0)
                    .height(2)
                    .border_radius(2)
                    .background(index === 0 ? this._tint : "transparent")
                    .transition("background 250ms ease-in-out, opacity 250ms ease-in-out"))
                    .center_vertical() // so the user can still add flexed elements through the on_tab_header callback.
                    .transition("opacity 250ms ease-in-out")
                    .display("inline-flex")
                    .padding(0, 2)
                    .flex_shrink(0)
                    .margin_right(is_last ? 0 : 25)
                    .position("relative")
                    .wrap(false)
                    .opacity(this._tab_opac === -1 ? 1 : this._tab_opac)
                    .extend({
                    on_select(callback) {
                        if (callback == null) {
                            return this._on_select;
                        }
                        this._on_select = callback;
                        return this;
                    },
                    select() {
                        this._header_title.color(main_this._tint);
                        this._header_div.background(main_this._tint).opacity(1);
                        if (main_this._tab_opac !== -1) {
                            this.opacity(1);
                        }
                        if (main_this._selected_node && main_this._selected_node != this) {
                            main_this._selected_node.unselect();
                        }
                        if (main_this._animate) {
                            content_stack.show().getBoundingClientRect();
                            content_stack.opacity(1);
                        }
                        else {
                            content_stack.show();
                        }
                        if (typeof this._on_select === "function") {
                            this._on_select(this);
                        }
                        main_this._selected_node = this;
                        return this;
                    },
                    on_unselect(callback) {
                        if (callback == null) {
                            return this._on_unselect;
                        }
                        this._on_unselect = callback;
                        return this;
                    },
                    unselect() {
                        this._header_title.color("inherit");
                        this._header_div.background("transparent");
                        if (main_this._tab_opac !== -1) {
                            this.opacity(main_this._tab_opac);
                        }
                        if (main_this._animate) {
                            content_stack.opacity(0).timeout(main_this._duration, e => e.hide());
                        }
                        else {
                            content_stack.hide();
                        }
                        if (typeof this._on_unselect === "function") {
                            this._on_unselect(this);
                        }
                        return this;
                    },
                    is_selected() {
                        return this === main_this._selected_node;
                    }
                })
                    .on_mouse_over(e => {
                    if (e !== main_this._selected_node) {
                        if (this._tab_opac !== -1) {
                            e.opacity(1);
                        }
                        const color = window.getComputedStyle(e).color;
                        e._header_div.opacity(this._div_opac).background(color);
                    }
                })
                    .on_mouse_out(e => {
                    if (e !== main_this._selected_node) {
                        if (this._tab_opac !== -1) {
                            e.opacity(this._tab_opac);
                        }
                        e._header_div.background("transparent").opacity(1);
                    }
                })
                    .on_click(e => e.select())
                    .exec(e => {
                    if (index === 0) {
                        main_this._selected_node = e;
                    }
                    this._tab_nodes.append(e);
                });
                if (typeof content_item.on_header === "function") {
                    content_item.on_header(item, this);
                }
                if (typeof this._on_tab_header === "function") {
                    this._on_tab_header(name, item, this);
                }
                return item;
            }))
                .width("100%"), this._div = Divider()
                .frame("100%", 1)
                .background(this._div_bg)
                .margin(1, 0, 25, 0), zstack = ZStack());
            let index = 0;
            content.iterate(item => {
                const content_stack = item.content;
                if (index === 0) {
                    content_stack.show();
                }
                else {
                    content_stack.hide();
                    if (this._animate) {
                        content_stack.opacity(0);
                    }
                }
                if (content_stack.overflow_x() === "visible") {
                    content_stack.overflow_x("hidden");
                }
                content_stack.width("100%");
                content_stack.transition(`opacity ${this._duration}ms ease-in-out`);
                zstack.append(content_stack);
                ++index;
            });
        }
        /*	@docs:
            @title: Selected
            @description: Get the selected tab title, returns `null` when no tab has been selected.
         */
        // @ts-ignore
        selected() {
            return this._selected_node ? this._selected_node.textContent : null;
        }
        // @ts-ignore
        select(tab) {
            if (tab == null) {
                return this._selected_node ? this._selected_node.textContent : null;
            }
            this._tab_nodes.iterate(node => {
                if (node.textContent === tab) {
                    node.select();
                    return true;
                }
            });
            return this;
        }
        tint(value) {
            if (value == null) {
                return this._tint ?? "";
            }
            this._tint = value;
            if (this._selected_node) {
                this._selected_node.select();
            }
            return this;
        }
        tab_opacity(value) {
            if (value == null) {
                return this._tab_opac;
            }
            if (value === false) {
                value = -1;
            }
            else if (value === true) {
                value = 0.8;
            }
            this._tab_opac = value;
            this._tab_nodes.iterate(node => {
                if (this._selected_node !== node) {
                    node.opacity(value);
                }
            });
            return this;
        }
        divider_background(value) {
            if (value == null) {
                return this._div_bg;
            }
            this._div_bg = value;
            this._div?.background(this._div_bg);
            return this;
        }
        divider_opacity(value) {
            if (value == null) {
                return this._div_opac;
            }
            this._div_opac = value;
            return this;
        }
        on_tab_header(callback) {
            if (callback == null) {
                return this._on_tab_header;
            }
            this._on_tab_header = callback;
            return this;
        }
    };
    return TabsElement = _classThis;
})();
export { TabsElement };
export const Tabs = Elements.wrapper(TabsElement);
export const NullTabs = Elements.create_null(TabsElement);
