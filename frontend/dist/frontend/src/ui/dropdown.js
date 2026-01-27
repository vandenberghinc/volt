/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
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
import { Utils } from "../modules/utils.js";
import { VStackElement, HStack, AnchorHStack } from "./stack.js";
import { ForEach } from "./for_each.js";
import { ImageMask } from "./image.js";
import { Text } from "./text.js";
// Dropdown element. 
/**
 * Easily create a dropdown element.
 * @nav Frontend/Elements
 * @param target The target element for where the dropdown will be placed.
 * @param animate Enable animations.
 * @param duration The animation duration in milliseconds.
 * @param side Expand to the `"left"` or `"right"` side relative to the target element.
 * @param auto_remove Auto remove the dropdown when it is closed.
 * @param use_target_min Use the target element for a minimum width of the dropdown.
 * @param below_target Place the dropdown below the target with by default an `y_offset` of `10`, unless `y_offset` is defined as `false`.
 * @param x_offset The additional x offset of the dropdown's position, this value will be added the computed x position.
 * @param y_offset The additional y offset of the dropdown's position, this value will be added the computed y position.
 * @param content Optional content array to easily create a context-menu like dropdown menu.
 * @param content.text The content text. Required.
 * @param content.image The content image source.
 * @param content.image_padding The image padding.
 * @param content.image_top The image margin top.
 * @param content.href The href redirect on click.
 * @param content.callback The on click callback.
 * @param content.on_click The on click callback.
 * @param content.on_click_redirect The on click redirect function arguments.
 * @param content.anchor Flag indicating if the content node should be an anchor. Default: false.
 * @docs
 */
let DropdownElement = (() => {
    let _classDecorators = [Elements.create({
            name: "DropdownElement",
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VStackElement;
    var DropdownElement = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            DropdownElement = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        // Static attributes.
        static element_name = "DropdownElement";
        _target;
        _animate;
        _duration;
        _side;
        _use_target_min;
        _auto_remove;
        _min_width;
        _max_width;
        _min_height;
        _max_height;
        _below_target;
        // Keep as public so they can be edited later.
        x_offset;
        y_offset;
        content_items;
        on_expand_callback;
        on_minimize_callback;
        mouse_over_background;
        mouse_out_opacity;
        _content_padding;
        _content_margin;
        _frame_min_width = 0;
        _frame_min_height = 0;
        _frame_max_width = 0;
        _frame_max_height = 0;
        next_toggle_allowed;
        expanded = false;
        animation_timeout;
        close_handler;
        /**
         * Create a new dropdown instance. See the class documentation for available options.
         */
        constructor({ target, animate = true, duration = 300, side = "left", auto_remove = false, min_width = undefined, max_width = undefined, min_height = undefined, max_height = undefined, use_target_min = false, below_target = false, x_offset = undefined, y_offset = undefined, content = undefined, }) {
            // Base.
            super();
            this._init({
                derived: DropdownElement,
            });
            // Parameters.
            this._target = target;
            this._animate = animate;
            this._duration = duration;
            this._side = side;
            this._use_target_min = use_target_min;
            this._auto_remove = auto_remove;
            this._min_width = min_width;
            this._max_width = max_width;
            this._min_height = min_height;
            this._max_height = max_height;
            this._below_target = below_target;
            this.x_offset = x_offset ?? 0;
            this.y_offset = y_offset ?? 0;
            if (!this._animate) {
                this._duration = 0;
            }
            if (this._below_target && y_offset == null) {
                this.y_offset = 10;
            }
            // Styling.
            this
                .hide()
                .fit_content()
                .overflow("hidden")
                .background("black")
                .border_radius(10)
                .padding(5, 15)
                .border(1, "grey")
                .z_index(10)
                .position("absolute")
                .box_shadow("0px 0px 5px #00000030")
                .opacity(0)
                .transition(this._animate ? `opacity ${this._duration * 0.8}ms ease-in, max-height ${this._duration}ms ease-in-out, max-width ${this._duration}ms ease-in-out` : "")
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
                        .margin_top(item.image_top == null ? 0 : item.image_top)
                        .assign_to_parent_as("image"), Text(item.text)
                        .color("white")
                        .font_size("inherit")
                        .wrap(false)
                        .margin(0)
                        .exec(e => {
                        if (item.ellipsis_overflow) {
                            e.ellipsis_overflow(item.ellipsis_overflow);
                        }
                    }))
                        .text_decoration("none")
                        .border("none")
                        .outline("none")
                        .padding(...this._content_padding)
                        .margin(...this._content_margin)
                        .transition("background 250ms ease-in-out, opacity 250ms ease-in-out")
                        .on_mouse_over(e => e.background(this.mouse_over_background).opacity(1));
                    element.on_mouse_out(e => e.background("transparent").opacity(this.mouse_out_opacity));
                    element.parent(this);
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
        /**
         * Measure the dropdown to compute and cache min/max frame sizes based on current content and constraints.
         * @private
         */
        _get_frame() {
            this.visibility("hidden");
            this.show();
            this.max_width("none");
            this.max_height("none");
            this.getBoundingClientRect();
            if (this._use_target_min) {
                this._frame_min_width = this._target.clientWidth;
                this._frame_min_height = this._target.clientHeight;
            }
            else {
                this._frame_min_width = parseFloat(this.min_width());
                if (typeof this._frame_min_width !== "number") {
                    this._frame_min_width = 0;
                }
                if (this._min_width) {
                    this._frame_min_width = Math.max(this._frame_min_width, this._min_width);
                }
                this._frame_min_height = parseFloat(this.min_height());
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
        /**
         * Toggle the dropdown: expands when minimized, minimizes when expanded.
         */
        toggle() {
            if (this.expanded) {
                return this.minimize();
            }
            return this.expand();
        }
        /**
         * Expand (open) the dropdown and position it relative to the target.
         * Triggers the `on_expand` callback when set.
         */
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
            this.hide();
            this.max_width(this._frame_min_width);
            this.max_height(this._frame_min_height);
            this.opacity(0);
            this.transition(this._animate ? `opacity ${this._duration * 0.8}ms ease-in, max-height ${this._duration}ms ease-in-out, max-width ${this._duration}ms ease-in-out` : "").getBoundingClientRect();
            this.show();
            const rect = this._target.getBoundingClientRect();
            this.position(rect.top + this.y_offset + (this._below_target ? rect.height : 0), this._side !== "left" ? (window.innerWidth - rect.right - this.x_offset) : undefined, undefined, this._side === "left" ? (rect.left + this.x_offset) : undefined);
            this.getBoundingClientRect();
            setTimeout(() => {
                this
                    .opacity(1)
                    .max_width(this._frame_max_width)
                    .max_height(this._frame_max_height);
            }, 25);
            // Close handler.
            if (this.close_handler == null) {
                const _this_ = this;
                this.close_handler = (event) => {
                    if (this.expanded && !this.is_nested_child(event.target) && !Utils.is_nested_child(this._target, event.target)) { // also prevent on click on target element, otherwise it does this open close buggy thing
                        this.minimize();
                    }
                };
            }
            document.body.addEventListener("mousedown", this.close_handler);
            this.next_toggle_allowed = Date.now() + Math.max(100, this._duration);
            // Callback.
            if (this.on_expand_callback) {
                this.on_expand_callback(this);
            }
            return this;
        }
        /**
         * Minimize (close) the dropdown.
         * When `force` is true, skips the debounce guard to close immediately.
         * @param force Force closing even if toggling is temporarily blocked.
         */
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
                if (this._auto_remove) {
                    this.remove();
                }
                else {
                    this.hide();
                }
            }, this._duration);
            document.body.removeEventListener("mousedown", this.close_handler);
            this.next_toggle_allowed = Date.now() + Math.max(100, this._duration);
            // Callback.
            if (this.on_minimize_callback) {
                this.on_minimize_callback(this);
            }
            return this;
        }
        /**
         * Get or set the callback invoked when the dropdown expands.
         * @param callback The callback to set.
         */
        on_expand(callback) {
            if (callback == null) {
                return this.on_expand_callback;
            }
            this.on_expand_callback = callback;
            return this;
        }
        /**
         * Get or set the callback invoked when the dropdown minimizes.
         * @param callback The callback to set.
         */
        on_minimize(callback) {
            if (callback == null) {
                return this.on_minimize_callback;
            }
            this.on_minimize_callback = callback;
            return this;
        }
        /**
         * Get or set font size.
         * Should mainly be used to set the font size and image size on the content nodes created by the `content` parameter.
         * @docs
        */
        font_size(value) {
            if (value == null) {
                return super.font_size();
            }
            super.font_size(value);
            // all font sizes are inherited or Xem based
            return this;
        }
        /**
         * Get or set color.
         * Should mainly be used to set the foreground color on the content nodes created by the `content` parameter.
         * @docs
        */
        color(value) {
            if (value == null) {
                return super.color();
            }
            super.color(value);
            for (const e of this.content_items) {
                e.color(value);
                if (e.image) {
                    e.image.mask_color(value);
                }
            }
            return this;
        }
        /**
         * Iterate content nodes created by the `content` parameter. When the callback returns any non null value the iteration will be stopped.
         * @param callback The callback invoked for each content element.
         * @docs
        */
        iterate_content(callback) {
            for (const node of this.content_items) {
                callback(node);
            }
            return this;
        }
        /**
         * Set padding on the content nodes created by the `content` parameter.
         * @docs
         */
        content_padding(...args) {
            if (args == null || args.length === 0) {
                return this._content_padding;
            }
            this._content_padding = args;
            for (const node of this.content_items) {
                node.padding(...args);
            }
            // this.content_items.iterate((node) => { node.padding(...(args as [number, string])); })
            return this;
        }
        /**
         * Set margin on the content nodes created by the `content` parameter.
         * @docs
         */
        content_margin(...args) {
            if (args == null || args.length === 0) {
                return this._content_margin;
            }
            this._content_margin = args;
            for (const node of this.content_items) {
                node.margin(...args);
            }
            // this.content_items.iterate((node) => { node.margin(...(args as [number, string])); })
            return this;
        }
        /**
         * Set the mouse over background from the content nodes created by the `content` parameter. In the mouse out event the background will always be `transparent`.
         * @docs
        */
        content_background(value) {
            if (value == null) {
                return this.mouse_over_background;
            }
            this.mouse_over_background = value;
            return this;
        }
        /**
         * Set opacity on the content nodes created by the `content` parameter. In the mouse over event the opacity will always be `1`.
         * @docs
        */
        content_opacity(value) {
            if (value == null) {
                return this.mouse_out_opacity;
            }
            this.mouse_out_opacity = value;
            for (const node of this.content_items) {
                node.opacity(value);
            }
            return this;
        }
        static {
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return DropdownElement = _classThis;
})();
export { DropdownElement };
export const Dropdown = Elements.wrapper(DropdownElement);
export const NullDropdown = Elements.create_null(DropdownElement);
