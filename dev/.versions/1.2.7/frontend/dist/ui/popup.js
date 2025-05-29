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
import { Mutex } from "../modules/mutex";
import { HStack, VStack, VStackElement } from "./stack";
import { Text } from "./text";
import { Title } from "./title";
import { LoaderButton } from "./button";
import { ImageMask } from "./image";
// RingLoader.
// - The width and height must be in pixels.
let PopupElement = (() => {
    var _a;
    let _classDecorators = [(_a = Elements).register.bind(_a)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VStackElement;
    var PopupElement = _classThis = class extends _classSuper {
        constructor({ title = "", text = "", no = "No", yes = "Yes", image = false, image_color = "white", content = [], auto_hide = true, auto_remove = false, animation_duration = 0, // in ms.
        blur = 0, on_no = () => { }, on_yes = () => { }, on_popup = () => { }, }) {
            // Initialize base class.
            super();
            // Set element type.
            this.element_type = "Popup";
            // Mutex.
            this.p_mutex = Mutex();
            // Args.
            this.p_auto_hide = auto_hide;
            this.p_auto_remove = auto_remove;
            this.p_animation_duration = animation_duration;
            this.p_blur = blur;
            this.p_on_no_handler = on_no;
            this.p_on_yes_handler = on_yes;
            this.p_on_popup_handler = on_popup;
            this.p_escape_handler = (event) => {
                if (event.key == "Escape") {
                    this.close();
                }
            };
            // Image.
            this.image = ImageMask(typeof image === "boolean" ? undefined : image)
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
                .parent(this);
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
                .parent(this);
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
            });
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
                if (this.p_auto_remove || this.p_auto_hide) {
                    this.opacity(0);
                    if (this.p_blur != null) {
                        this.background_blur(0);
                    }
                    if (this.p_auto_remove) {
                        setTimeout(() => this.remove(), this.p_animation_duration);
                    }
                    else if (this.p_auto_hide) {
                        setTimeout(() => this.hide(), this.p_animation_duration);
                    }
                    document.body.removeEventListener("keydown", this.p_escape_handler);
                    removed_escape_handler = true;
                }
                const res = this.p_on_yes_handler(this);
                if (res instanceof Promise) {
                    try {
                        await res;
                    }
                    catch (err) {
                        console.error(err);
                    }
                }
                if (!removed_escape_handler && (this.display() === "none" || this.visibility() === "hidden" || this.parentElement == null)) {
                    document.body.removeEventListener("keydown", this.p_escape_handler);
                }
                this.p_mutex.unlock();
                this.yes_button.hide_loader();
            });
            // The buttons.
            this.buttons = HStack(this.no_button, this.yes_button)
                .width("100%")
                .margin_top(30)
                .abs_parent(this)
                .parent(this);
            // The custom content.
            this.content = VStack(...content)
                .abs_parent(this)
                .parent(this);
            // The content.
            this.widget = VStack(this.image, this.title, this.text, this.content, this.buttons)
                .position("relative")
                .text_center()
                .padding(40, 20, 20, 20)
                .max_width(400)
                .border_radius(10)
                .background("black")
                .border(1, "gray")
                .box_shadow("0px 0px 10px #00000050")
                .abs_parent(this)
                .parent(this);
            // Create content.
            this.append(this.widget);
            // Styling.
            this.opacity(1);
            this.transition(`opacity ${animation_duration * 0.9}ms ease, backdrop-filter ${animation_duration}ms ease`);
            this.position(0, 0, 0, 0);
            // do not use background blur since that decreases the performance too much.
            this.background("#00000060");
            this.center();
            this.center_vertical();
            this.z_index(10000);
            this.on_click((_, event) => {
                if (event.target === this.widget || this.widget.is_nested_child(event.target)) {
                    return null;
                }
                this.close();
            });
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
            await this.p_mutex.lock();
            this.p_mutex.unlock();
        }
        // Remove with animation.
        async remove_animation() {
            return new Promise((resolve) => {
                this.opacity(0);
                if (this.p_blur != null) {
                    this.background_blur(0);
                }
                document.body.removeEventListener("keydown", this.p_escape_handler);
                setTimeout(() => { this.remove(); resolve(); }, this.p_animation_duration);
            });
        }
        // Hide with animation.
        async hide_animation() {
            return new Promise((resolve) => {
                this.opacity(0);
                if (this.p_blur != null) {
                    this.background_blur(0);
                }
                document.body.removeEventListener("keydown", this.p_escape_handler);
                setTimeout(() => { this.hide(); resolve(); }, this.p_animation_duration);
            });
        }
        // Close the popup.
        async close() {
            const promise = new Promise(async (resolve) => {
                if (this.p_auto_remove) {
                    await this.remove_animation();
                }
                else if (this.p_auto_hide) {
                    await this.hide_animation();
                }
                resolve();
            });
            if (this._on_no_called !== true) { // since this could also be called from the on no handler.
                this._on_no_called = true;
                const res = this.p_on_no_handler(this);
                if (res instanceof Promise) {
                    try {
                        await res;
                    }
                    catch (err) {
                        console.error(err);
                    }
                }
            }
            this.p_mutex.unlock();
            await promise;
        }
        image_color(value) {
            if (value == null) {
                return this.image.mask_color();
            }
            this.image.mask_color(value);
            return this;
        }
        // Default popup function.
        async popup({ title = undefined, text = undefined, image = undefined, image_color = undefined, content = undefined, on_no = undefined, on_yes = undefined, } = {}) {
            // Call on popup.
            this.p_on_popup_handler(this);
            this.opacity(0);
            if (this.p_blur != null) {
                this.background_blur(0);
            }
            this.show();
            this.getBoundingClientRect();
            this.opacity(1);
            if (this.p_blur != null) {
                this.background_blur(this.p_blur);
            }
            // Reset flags.
            this._on_no_called = false;
            // Set args.
            if (title != null) {
                this.title.inner_html(title);
            }
            if (text != null) {
                this.text.inner_html(text);
            }
            if (typeof image === "string") {
                this.image.src(image);
                this.image.show();
            }
            if (image_color != null) {
                this.image.mask_color(image_color);
            }
            if (on_no != null) {
                this.p_on_no_handler = on_no;
            }
            if (on_yes != null) {
                this.p_on_yes_handler = on_yes;
            }
            // Await mutex.
            await this.p_mutex.lock();
            // Create content.
            if (content != null) {
                this.content.inner_html("");
                this.content.append(...content);
            }
            // Focus.
            this.show();
            this.focus();
            // Bind event listener close by escape.
            document.body.addEventListener("keydown", this.p_escape_handler); // for some reason on_key_down on main element is not catched.
        }
    };
    __setFunctionName(_classThis, "PopupElement");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        PopupElement = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return PopupElement = _classThis;
})();
export { PopupElement };
export const Popup = Elements.wrapper(PopupElement);
