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
import { Mutex } from "../modules/mutex";
import { HStack, VStack, VStackElement } from "./stack";
import { Text } from "./text";
import { Title } from "./title";
import { LoaderButton } from "./loader_button";
import { ImageMask } from "./image";
// RingLoader.
// - The width and height must be in pixels.
let YesNoPopupElement = (() => {
    let _classDecorators = [Elements.create({
            name: "YesNoPopupElement",
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VStackElement;
    var YesNoPopupElement = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            YesNoPopupElement = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        // Attributes.
        p_mutex;
        p_auto_hide;
        p_auto_remove;
        p_animation_duration;
        p_blur;
        p_on_no_handler;
        p_on_yes_handler;
        p_on_popup_handler;
        p_escape_handler;
        image;
        // @ts-ignore
        title;
        // @ts-ignore
        text;
        no_button;
        yes_button;
        buttons;
        // @ts-ignore
        content;
        widget;
        _on_no_called = false;
        constructor({ title, text, no = "No", yes = "Yes", image = false, image_color = "white", content = [], auto_hide = true, auto_remove = false, animation_duration = 0, // in ms.
        blur = 0, on_no = () => { }, on_yes = () => { }, on_popup = () => { }, }) {
            // Initialize base class.
            super();
            this._init({
                derived: YesNoPopupElement,
            });
            // Mutex.
            this.p_mutex = new Mutex();
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
            this.title = Title(text) // never user inner html instead use append incase of links or code lines.
                .font_family("inherit")
                .font_weight(500)
                .font_size(34)
                .abs_parent(this)
                .parent(this);
            // Text.
            this.text = Text(text) // never user inner html instead use append incase of links or code lines.
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
            return super.set_default(YesNoPopupElement);
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
                this.title.remove_children().append(title); // never inner html
            }
            if (text != null) {
                this.text.remove_children().append(text); // never inner html
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
    return YesNoPopupElement = _classThis;
})();
export { YesNoPopupElement };
export const YesNoPopup = Elements.wrapper(YesNoPopupElement);
export const NullYesNoPopup = Elements.create_null(YesNoPopupElement);
// /** Custom popup */
// @Elements.create({
//     name: "CustomPopupElement",
// })
// export class CustomPopupElement extends (VStackElement as any as VElementBaseSignature) {
//     public content: FrameElement;
//     public close: 
//     close_border(...args) {
//         this.close.border(...args);
//         return this;
//     }
//     constructor(...children: AppendType[]) {
//         // Initialize base class.
//         super();
//         this._init({
//             derived: CustomPopupElement,
//         })
//         const close_handler = (event) => {
//             if (event.key === "Escape") {
//                 popup.close();
//             }
//         }
//         this.append(
//             this.content = UI.Widget(...children)
//                 .background(Theme.bg_1)
//                 .max_width(400)
//                 .parent(this),
//             Frame(
//                 close = ImageMask("/static/icons/close.webp")
//                     .frame(10, 10)
//                     .flex(0)
//                     .transition_mask("background 300ms ease-in-out")
//                     .color(Theme.bg),
//             )
//                 .background(Theme.auto_darken_lighten("fg", 0.5))
//                 .border_radius("50%")
//                 .border(1, Theme.div_bg)
//                 .frame(30, 30)
//                 .center().center_vertical()
//                 .position(25, 25, null, null)
//                 .on_click(() => popup.close())
//                 .hover_transitions([
//                     { target: "this", selected: Theme.auto_darken_lighten("fg", 0.6), unselected: Theme.auto_darken_lighten("fg", 0.5), methods: ["background"] },
//                     { target: close, selected: Theme.bg_hover, unselected: Theme.bg, methods: ["color"] },
//                     // { target: "this", selected: Theme.fg, unselected: Theme.fg_2, methods: ["color"] },
//                     // { target: "this", selected: Theme.fg, unselected: Theme.fg_2, methods: ["color"] },
//                 ])
//         )
//             .position(0, 0, 0, 0)
//             .center()
//             .center_vertical()
//             .background("#00000008")
//             .padding(25)
//             .background_blur(5)
//             .transition("opacity 300ms ease-in-out")
//             .on_click((e, event) => {
//                 if (event.target === content || content.is_nested_child(event.target)) {
//                     return;
//                 }
//                 e.close()
//             })
//         }
//     // Set width on content instead of parent.
//     width(): string | number;
//     width(value: string | number, check_attribute?: boolean): this;
//     width(value?: string | number, check_attribute: boolean = true): this | number | string {
//         if (this._e === undefined) {
//             return super.width(value as any, check_attribute);
//         }
//         if (value == null) {
//             return this._e.width.toString();
//         }
//         // Assign percentage values to the root.
//         if (typeof value === "string" && value.includes("%")) {
//             super.width(value as any, false);
//         } else {
//             this._e.style.width = this.pad_numeric(value, "px");
//             this._e.width = value as any;
//         }
//         return this;
//     }
//     min_width(): string | number
//     min_width(value: string | number): this;
//     min_width(value?: string | number): this | string | number {
//         if (this._e === undefined) {
//             return super.min_width(value as any);
//         }
//         if (value == null) {
//             return this._e.style.minWidth;
//         }
//         // Assign percentage values to the root.
//         if (typeof value === "string" && value.includes("%")) {
//             super.min_width(value as any);
//         } else {
//             this._e.style.minWidth = this.pad_numeric(value, "px");
//         }
//         return this;
//     }
//     max_width(): string | number
//     max_width(value: string | number): this;
//     max_width(value?: string | number): this | string | number {
//         if (this._e === undefined) {
//             return super.max_width(value as any);
//         }
//         if (value == null) {
//             return this._e.style.maxWidth;
//         }
//         // Assign percentage values to the root.
//         if (typeof value === "string" && value.includes("%")) {
//             super.max_width(value as any);
//         } else {
//             this._e.style.maxWidth = this.pad_numeric(value, "px");
//         }
//         return this;
//     }
//         max_width(value: number) {
//             content.max_width(value);
//             return this;
//         }
//         open() {
//             document.body.addEventListener("keydown", close_handler);
//             UI.view.append(this);
//             this.opacity(0)
//             this.show();
//             this.getBoundingClientRect();
//             this.opacity(1);
//             return this;
//         }
//         close() {
//             document.body.removeEventListener("keydown", close_handler);
//             this.opacity(0)
//             setTimeout(() => this.remove(), 300)
//             return this;
//         }
//     }
// }
// export const CustomPopup = Elements.wrapper(CustomPopupElement);
// export const NullCustomPopup = Elements.create_null(CustomPopupElement);
// declare module './any_element.d.ts' { interface AnyElementMap { CustomPopupElement: CustomPopupElement } }
