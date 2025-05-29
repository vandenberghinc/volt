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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
// Imports.
import { Elements } from "../modules/elements";
import { Utils } from "../modules/utils";
import { VStackElement, HStack, AnchorHStack } from "./stack";
import { ForEach } from "./for_each";
import { ImageMask } from "./image";
import { Text } from "./text";
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
let DropdownElement = (() => {
    var _a;
    let _classDecorators = [(_a = Elements).register.bind(_a)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VStackElement;
    var DropdownElement = _classThis = class extends _classSuper {
        constructor({ target, animate = true, duration = 300, side = "left", auto_remove = false, min_width = undefined, max_width = undefined, min_height = undefined, max_height = undefined, use_target_min = false, below_target = false, x_offset = undefined, y_offset = undefined, content = undefined, }) {
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
            this.x_offset = x_offset ?? 0;
            this.y_offset = y_offset ?? 0;
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
                .max_height(0);
            // Add content.
            this.mouse_over_background = "#FFFFFF10";
            this.mouse_out_opacity = 0.8;
            this._content_padding = [7.5, 20];
            this._content_margin = [2.5, 0];
            this.content_items = [];
            if (content) {
                this.padding(10, 0);
                this.append(ForEach(content, (item) => {
                    const element = (item.href || item.on_click_redirect || item.anchor) ? AnchorHStack() : HStack();
                    element.append(item.image == null ? null : ImageMask(item.image)
                        .frame("1em", "1em")
                        .mask_color("white")
                        .margin_right("1em")
                        .flex_shrink(0)
                        .padding(item.image_padding == null ? 0 : item.image_padding)
                        .margin_top(item.image_top == null ? 0 : item.image_top), Text(item.text)
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
                        element.href(item.href);
                    }
                    else if (Array.isArray(item.on_click)) {
                        element.on_click(...item.on_click);
                    }
                    else if (item.on_click) {
                        element.on_click(item.on_click);
                    }
                    else if (Array.isArray(item.on_click_redirect)) {
                        element.on_click(...item.on_click_redirect);
                    }
                    else if (item.callback) {
                        element.on_click(item.callback);
                    }
                    this.content_items.append(element);
                    return element;
                }));
            }
        }
        // Get frame.
        _get_frame() {
            this.visibility("hidden");
            this.show();
            this.max_width("none");
            this.max_height("none");
            this.getBoundingClientRect();
            if (this.use_target_min) {
                this._frame_min_width = this.target.clientWidth;
                this._frame_min_height = this.target.clientHeight;
            }
            else {
                this._frame_min_width = this.min_width();
                if (typeof this._frame_min_width !== "number") {
                    this._frame_min_width = 0;
                }
                if (this._min_width) {
                    this._frame_min_width = Math.max(this._frame_min_width, this._min_width);
                }
                this._frame_min_height = this.min_height();
                if (typeof this._frame_min_height !== "number") {
                    this._frame_min_height = 0;
                }
                if (this._min_height) {
                    this._frame_min_height = Math.max(this._frame_min_height, this._min_height);
                }
            }
            this._frame_max_width = Math.max(this._frame_min_width, this.clientWidth);
            if (this._max_width) {
                this._frame_max_width = Math.min(this._frame_max_width, this._max_width);
            }
            this.max_width(this._frame_max_width); // so height is accurate based on width.
            this._frame_max_height = Math.max(this._frame_min_height, this.clientHeight);
            if (this._max_height) {
                this._frame_max_height = Math.min(this._frame_max_height, this._max_height);
            }
            this.hide();
            this.visibility("visible");
        }
        // Toggle.
        toggle() {
            if (this.expanded) {
                return this.minimize();
            }
            return this.expand();
        }
        // Expand dropdown.
        expand() {
            if (this.next_toggle_allowed !== undefined && Date.now() < this.next_toggle_allowed) {
                return this;
            }
            ; // otherwise it goes glitchy.
            if (this.expanded) {
                return this;
            }
            this.expanded = true;
            // Show.
            clearTimeout(this.animation_timeout);
            this.transition("");
            this._get_frame();
            this.max_width(this._frame_min_width);
            this.max_height(this._frame_min_height);
            this.opacity(0);
            this.transition(this.animate ? `opacity ${this.duration * 0.8}ms ease-in, max-height ${this.duration}ms ease-in-out, max-width ${this.duration}ms ease-in-out` : "");
            this.show().getBoundingClientRect();
            const rect = this.target.getBoundingClientRect();
            this
                .position(rect.top + this.y_offset + (this.below_target ? rect.height : 0), this.side !== "left" ? (window.innerWidth - rect.right - this.x_offset) : undefined, undefined, this.side === "left" ? (rect.left + this.x_offset) : undefined)
                .opacity(1)
                .max_width(this._frame_max_width)
                .max_height(this._frame_max_height);
            // Close handler.
            if (this.close_handler == null) {
                const _this_ = this;
                this.close_handler = (event) => {
                    if (this.expanded && !this.is_nested_child(event.target) && !Utils.is_nested_child(this.target, event.target)) { // also prevent on click on target element, otherwise it does this open close buggy thing
                        this.minimize();
                    }
                };
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
            if (!force && this.next_toggle_allowed !== undefined && Date.now() < this.next_toggle_allowed) {
                return this;
            }
            ; // otherwise it goes glitchy.
            if (!force && !this.expanded) {
                return this;
            }
            this.expanded = false;
            // Hide.
            this
                .max_width(this._frame_min_width)
                .max_height(this._frame_min_height)
                .opacity(0);
            this.animation_timeout = setTimeout(() => {
                if (this.auto_remove) {
                    this.remove();
                }
                else {
                    this.hide();
                }
            }, this.duration);
            document.body.removeEventListener("mousedown", this.close_handler);
            this.next_toggle_allowed = Date.now() + Math.max(100, this.duration);
            // Callback.
            if (this.on_minimize_callback) {
                this.on_minimize_callback(this);
            }
            return this;
        }
        on_expand(callback) {
            if (callback == null) {
                return this.on_expand_callback;
            }
            this.on_expand_callback = callback;
            return this;
        }
        on_minimize(callback) {
            if (callback == null) {
                return this.on_minimize_callback;
            }
            this.on_minimize_callback = callback;
            return this;
        }
        font_size(value) {
            if (value == null) {
                return super.font_size();
            }
            super.font_size(value);
            // all font sizes are inherited or Xem based
            return this;
        }
        color(value) {
            if (value == null) {
                return super.color();
            }
            super.color(value);
            this.content_items.iterate(e => {
                e.color(value);
                if (e.image) {
                    e.image.mask_color(value);
                }
            });
            return this;
        }
        /*	@docs:
            @title: Iterate content nodes.
            @description: Iterate content nodes created by the `content` parameter. When the callback returns any non null value the iteration will be stopped.
        */
        iterate_content(callback) {
            this.content_items.iterate((node) => { callback(node); });
            return this;
        }
        content_padding(...args) {
            if (args == null || args.length === 0) {
                return this._content_padding;
            }
            this._content_padding = args;
            this.content_items.iterate((node) => { node.padding(...args); });
            return this;
        }
        content_margin(...args) {
            if (args == null || args.length === 0) {
                return this._content_margin;
            }
            this._content_margin = args;
            this.content_items.iterate((node) => { node.margin(...args); });
            return this;
        }
        content_background(value) {
            if (value == null) {
                return this.mouse_over_background;
            }
            this.mouse_over_background = value;
            return this;
        }
        content_opacity(value) {
            if (value == null) {
                return this.mouse_out_opacity;
            }
            this.mouse_out_opacity = value;
            this.content_items.iterate((node) => { node.opacity(value); });
            return this;
        }
    };
    __setFunctionName(_classThis, "DropdownElement");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        DropdownElement = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return DropdownElement = _classThis;
})();
export { DropdownElement };
export const Dropdown = Elements.wrapper(DropdownElement);
