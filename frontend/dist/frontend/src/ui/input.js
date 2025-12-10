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
// External imports.
import * as vlib from "@vandenberghinc/vlib/frontend";
// Imports.
import { Elements, VElementTagMap } from "../elements/module.js";
import { Utils } from "../modules/utils.js";
import { HStack, VStack, VStackElement } from "./stack.js";
import { Text } from "./text.js";
import { ImageMask } from "./image.js";
import { GradientBorder } from "./gradient.js";
import { Scroller } from "./scroller.js";
import { Divider } from "./divider.js";
// Input.
let InputElement = (() => {
    let _classDecorators = [Elements.create({
            name: "InputElement",
            default_style: {
                "margin": "0px 0px 0px 0px",
                "padding": "2.5px 5px 2.5px 5px",
                "font": "inherit",
                "color": "inherit",
                "background": "none",
                "outline": "none",
                "border": "none",
                "border-radius": "10px",
                "text-align": "start",
                "white-space": "nowrap",
            },
            default_attributes: {
                "spellcheck": "false",
                "autocorrect": "off",
                "autocapitalize": "none",
            },
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VElementTagMap.input;
    var InputElement = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            InputElement = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        // Attributes.
        _e;
        // Constructor.
        constructor(placeholder, type = "text", value) {
            // Initialize base class.
            super({
                derived: InputElement,
            });
            // Safari does not render images correctly for custom elements.
            if (Utils.is_safari) {
                this.attachShadow({ mode: 'open' });
                this._e = document.createElement("input");
                this._e.style.font = "inherit";
                this._e.style.color = "inherit";
                this._e.style.background = "none";
                this._e.style.border = "none";
                this._e.style.outline = "none";
                this._e.style.whiteSpace = "nowrap";
                this._e.style.width = "100%";
                this._e.style.padding = InputElement.default_style.padding;
                this.shadowRoot.appendChild(this._e);
                this.padding("0");
            }
            // Set src.
            this.placeholder(placeholder ?? "");
            this.type(type ?? "text");
            this.value(value ?? "");
        }
        value(val) {
            if (this._e === undefined) {
                return super.value(val);
            }
            if (val == null) {
                return this._e.value ?? "";
            }
            this._e.value = val.toString();
            // if (val == null) { return this._e.getAttribute("value") ?? ""; }
            // this._e.setAttribute("value", val.toString());
            return this;
        }
        required(val) { if (this._e === undefined) {
            return super.required(val);
        } if (val == null) {
            return this._e.getAttribute("required") === "true";
        } if (!val) {
            this._e.removeAttribute("required");
        }
        else {
            this._e.setAttribute("required", val);
        } return this; }
        type(val) { if (this._e === undefined) {
            return super.type(val);
        } if (val == null) {
            return this._e.getAttribute("type") ?? "";
        } this._e.setAttribute("type", val); return this; }
        placeholder(val) { if (this._e === undefined) {
            return super.placeholder(val);
        } if (val == null) {
            return this._e.getAttribute("placeholder") ?? "";
        } this._e.setAttribute("placeholder", val); return this; }
        resize(val) { if (this._e === undefined) {
            return super.resize(val);
        } if (val == null) {
            return this._e.getAttribute("resize") ?? "";
        } this._e.setAttribute("resize", val); return this; }
        padding(...values) {
            if (this._e === undefined) {
                return super.padding(...values);
            }
            if (values.length === 0) {
                return this._e.style.padding;
            }
            else if (values.length === 1) {
                this._e.style.padding = this.pad_numeric(values[0]);
            }
            else if (values.length === 2) {
                if (values[0] != null) {
                    this._e.style.paddingTop = this.pad_numeric(values[0]);
                }
                if (values[1] != null) {
                    this._e.style.paddingRight = this.pad_numeric(values[1]);
                }
                if (values[0] != null) {
                    this._e.style.paddingBottom = this.pad_numeric(values[0]);
                }
                if (values[1] != null) {
                    this._e.style.paddingLeft = this.pad_numeric(values[1]);
                }
            }
            else if (values.length === 4) {
                this._e.style.paddingTop = this.pad_numeric(values[0]);
                if (values[1] != null) {
                    this._e.style.paddingRight = this.pad_numeric(values[1]);
                }
                if (values[2] != null) {
                    this._e.style.paddingBottom = this.pad_numeric(values[2]);
                }
                if (values[3] != null) {
                    this._e.style.paddingLeft = this.pad_numeric(values[3]);
                }
            }
            else {
                console.error("Invalid number of arguments for function \"padding()\".");
            }
            return this;
        }
    };
    return InputElement = _classThis;
})();
export { InputElement };
export const Input = Elements.wrapper(InputElement);
export const NullInput = Elements.create_null(InputElement);
// InputBox.
let InputBoxElement = (() => {
    let _classDecorators = [Elements.create({
            name: "InputBoxElement",
            default_style: {
                "margin": "0px 0px 0px 0px",
                "padding": "2.5px 5px 2.5px 5px",
                "height": "20px",
                "font": "inherit",
                "color": "inherit",
                "background": "none",
                "outline": "none",
                "border": "none",
                "border-radius": "10px",
                "text-align": "start",
                "white-space": "wrap",
                "resize": "none",
            },
            default_attributes: {
                "spellcheck": "false",
                "autocorrect": "off",
                "autocapitalize": "none",
            },
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VElementTagMap.textarea;
    var InputBoxElement = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            InputBoxElement = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        // Attributes.
        _e;
        // Constructor.
        constructor(placeholder) {
            // Initialize base class.
            super({
                derived: InputBoxElement,
            });
            // Safari does not render images correctly for custom elements.
            if (Utils.is_safari) {
                this.attachShadow({ mode: 'open' });
                this._e = document.createElement("textarea");
                this._e.style.font = "inherit";
                this._e.style.color = "inherit";
                this._e.style.background = "none";
                this._e.style.border = "none";
                this._e.style.outline = "none";
                this._e.style.width = "100%";
                this._e.style.height = "100%";
                this._e.style.margin = "0";
                this._e.style.padding = InputBoxElement.default_style.padding;
                this.shadowRoot.appendChild(this._e);
                this.padding("0");
            }
            // Set src.
            this.placeholder(placeholder ?? "");
        }
        value(val) { if (this._e === undefined) {
            return super.value(val);
        } if (val == null) {
            return this._e.getAttribute("value") ?? "";
        } this._e.setAttribute("value", val.toString()); return this; }
        required(val) { if (this._e === undefined) {
            return super.required(val);
        } if (val == null) {
            return this._e.getAttribute("required") === "true";
        } if (!val) {
            this._e.removeAttribute("required");
        }
        else {
            this._e.setAttribute("required", val);
        } return this; }
        type(val) { if (this._e === undefined) {
            return super.type(val);
        } if (val == null) {
            return this._e.getAttribute("type") ?? "";
        } this._e.setAttribute("type", val); return this; }
        placeholder(val) { if (this._e === undefined) {
            return super.placeholder(val);
        } if (val == null) {
            return this._e.getAttribute("placeholder") ?? "";
        } this._e.setAttribute("placeholder", val); return this; }
        resize(val) { if (this._e === undefined) {
            return super.resize(val);
        } if (val == null) {
            return this._e.getAttribute("resize") ?? "";
        } this._e.setAttribute("resize", val); return this; }
        padding(...values) {
            if (this._e === undefined) {
                return super.padding(...values);
            }
            if (values.length === 0) {
                return this._e.style.padding;
            }
            else if (values.length === 1) {
                this._e.style.padding = this.pad_numeric(values[0]);
            }
            else if (values.length === 2) {
                if (values[0] != null) {
                    this._e.style.paddingTop = this.pad_numeric(values[0]);
                }
                if (values[1] != null) {
                    this._e.style.paddingRight = this.pad_numeric(values[1]);
                }
                if (values[0] != null) {
                    this._e.style.paddingBottom = this.pad_numeric(values[0]);
                }
                if (values[1] != null) {
                    this._e.style.paddingLeft = this.pad_numeric(values[1]);
                }
            }
            else if (values.length === 4) {
                this._e.style.paddingTop = this.pad_numeric(values[0]);
                if (values[1] != null) {
                    this._e.style.paddingRight = this.pad_numeric(values[1]);
                }
                if (values[2] != null) {
                    this._e.style.paddingBottom = this.pad_numeric(values[2]);
                }
                if (values[3] != null) {
                    this._e.style.paddingLeft = this.pad_numeric(values[3]);
                }
            }
            else {
                console.error("Invalid number of arguments for function \"padding()\".");
            }
            return this;
        }
    };
    return InputBoxElement = _classThis;
})();
export { InputBoxElement };
export const InputBox = Elements.wrapper(InputBoxElement);
export const NullInputBox = Elements.create_null(InputBoxElement);
// Extended input.
let ExtendedInputElement = (() => {
    let _classDecorators = [Elements.create({
            name: "ExtendedInputElement",
            default_style: {
                ...VStackElement.default_style,
                "color": "inherit",
                "font-size": "16px",
            },
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VStackElement;
    var ExtendedInputElement = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ExtendedInputElement = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        copy_opts;
        input_opts;
        /** The label node, always defined even when `opts.label` is undefined, so the user can still style it. */
        // @ts-expect-error
        label;
        /** The left image element created by the `opts.image` field. */
        image;
        /** The clickable copy node created by the `opts.copy` field. */
        copyable;
        /** The input element created by the `opts.input` field. */
        input;
        /** The (gradient) border element used for the input field. */
        input_border;
        /** The container element for the input field. */
        container;
        /** The error text element shown when the input is marked as missing. */
        error_text;
        /** Has error state. */
        has_error = false;
        /** Is focused state. */
        is_focused = false;
        /** Validation options. */
        validation_entry;
        // Constructor.
        constructor({ label, image, placeholder = "Input", id, readonly = false, required = false, type = "text", value, copy, input, validate, }) {
            // Initialize super.
            super();
            this._init({
                derived: ExtendedInputElement,
            });
            // Cast image.
            if (typeof image === "string") {
                image = { url: image };
            }
            // Cast label.
            if (typeof label === "string") {
                label = { text: label };
            }
            // Direct attributes.
            this.validation_entry = validate;
            // Set id.
            if (id != null) {
                this.id(id);
            }
            // Set input options..
            this.input_opts = {
                ...(input ?? {}),
                border: {
                    color: input?.border?.color ?? "gray",
                    hover: input?.border?.hover ?? "gray",
                    focused: input?.border?.focused ?? "#8EB8EB",
                    missing: input?.border?.missing ?? "#E8454E",
                    width: input?.border?.width ?? "1px",
                    radius: input?.border?.radius ?? "5px",
                    type: input?.border?.type ?? "full",
                },
            };
            // Set copy options.
            this.copy_opts = copy;
            // Set default styling.
            this.styles(ExtendedInputElement.default_style);
            // Title element.
            this.label = Text(label?.text)
                .parent(this)
                .font_size(label?.font_size ?? "inherit")
                .margin(0, 0, label?.spacing ?? (input?.border?.type === "bottom" ? 12.5 : 7.5), 0)
                .color(label?.color ?? "inherit");
            if (!label) {
                // always keep label present so uses can still style it with single-line code when needed.
                this.label.hide();
            }
            else {
                if (label.wrap) {
                    this.label
                        .width("fit-content")
                        .overflow_wrap("break-word") // or "anywhere" for more aggressive breaking
                        .hyphens("auto")
                        .display("inline-block") // so width constraints apply
                        .max_width(label.max_width ?? "100%"); // ensure there’s something to wrap to
                }
                else {
                    this.label.ellipsis_overflow(true)
                        .width("fit-content")
                        .max_width(label.max_width ?? "100%"); // ensure there’s something to wrap to
                }
            }
            // Input left image.
            this.image = !image ? undefined : ImageMask(image.url)
                .parent(this)
                .mask_color(image.color ?? "#000")
                .square(image.size ?? 20)
                .margin(0, 10, 0, 5)
                .alt(image?.alt ?? "Volt");
            // Copyable right image.
            this.copyable = !this.copy_opts ? undefined : ImageMask(this.copy_opts.url)
                .parent(this)
                .mask_color(this.copy_opts?.color ?? image?.color ?? "#000")
                .square(this.copy_opts.size ?? 20)
                .margin(0, 5, 0, 10)
                .alt(this.copy_opts?.alt ?? "Copy")
                .on_click(() => {
                if (this.copy_opts?.on_click) {
                    this.copy_opts.on_click(this.input.value());
                }
            })
                .transition_mask("background 200ms ease-in-out")
                .on_mouse_over_out(e => e.mask_color(this.copy_opts?.hover ?? image?.color ?? "#000"), e => e.mask_color(this.copy_opts?.color ?? image?.color ?? "#000"));
            // Input element.
            if (type === "box" || type === "area") {
                this.input = InputBox(placeholder);
            }
            else {
                this.input = Input(placeholder, type);
            }
            this.input
                .parent(this)
                .color("inherit")
                .readonly(readonly)
                .font_size("inherit")
                .font_weight("normal")
                .margin(0)
                .width("100%")
                .stretch(true)
                // .padding(0, 5)
                .padding(0)
                .line_height("1.6em")
                .box_shadow("none")
                .border("none")
                .outline("none")
                .z_index(1)
                .border_radius(0) // is required.
                .on_focus(() => {
                if (!this.has_error) {
                    this.is_focused = true;
                    this._set_border_color(this.input_opts.border.focused, true);
                }
            })
                .on_blur(() => {
                if (!this.has_error) {
                    this.is_focused = false;
                    this._set_border_color(this.input_opts.border.color);
                }
            });
            // Set input height.
            if (input?.height != null) {
                console.log("Setting fixed height to", input.height);
                this.input.fixed_height(input.height);
            }
            // The input border to support gradients.
            this.input_border = GradientBorder()
                .z_index(0)
                .position(0, 0, 0, 0)
                .border_width(this.input_opts.border.width)
                .border_radius(this.input_opts.border.radius)
                .border_color(this.input_opts.border.color)
                .box_shadow(`0 0 0 0px transparent`)
                .transition("background 200ms ease-in-out")
                .pointer_events("none");
            if (this.input_opts.border.type === "bottom") {
                this.input_border.hide();
            }
            // The hstack container.
            this.container = HStack(!this.image ? undefined : VStack(this.image) // wrap in container for height.
                .width("fit-content")
                .height("1.6em")
                .center_vertical(), this.input, !this.copyable ? undefined : VStack(this.copyable) // wrap in container for height.
                .width("fit-content")
                .height("1.6em")
                .center_vertical(), this.input_border)
                .parent(this)
                .position("relative")
                .background(input?.background ?? "transparent")
                .padding((input?.padding ?? "12px 6px"))
                .border_radius(this.input_opts.border.radius) // for outline when focused or missing etc.
                .transition("box-shadow 0.2s ease-in-out")
                .outline("0px solid transparent")
                .box_shadow(`0 0 0 0px transparent`)
                .width("100%")
                .on_mouse_over_out((e) => {
                if (!this.has_error && !this.is_focused) {
                    this._set_border_color(this.input_opts.border.hover);
                }
            }, (e) => {
                if (!this.has_error && !this.is_focused) {
                    this._set_border_color(this.input_opts.border.color);
                }
            });
            if (this.input_opts.border.type === "bottom") {
                this._set_border_color(this.input_opts.border.color);
                this.container.padding_left(0).padding_right(0);
            }
            // The error message.
            this.error_text = Text("Incomplete field")
                .color(this.input_opts.border.missing)
                .font_size("0.8em")
                .margin(7.5, 0, 0, 2.5)
                .padding(0)
                .leading()
                .hide();
            // Set id.
            if (id != null) {
                this.id(id);
            }
            // Set required.
            this.required(required);
            // Append.
            this.append(this.label, this.container, this.error_text);
            // Set value.
            if (value) {
                this.value(value);
            }
        }
        /** Helper to set the border color. */
        _set_border_color(color, set_outline = false) {
            if (this.input_opts.border.type === "full") {
                this.input_border.border_color(color);
                if (set_outline) {
                    this.container.box_shadow(`0 0 0 3px ${color}80`);
                }
                else {
                    this.container.box_shadow(`0 0 0 0px transparent`);
                }
            }
            else {
                this.container.border_bottom(this.input_opts.border.width, color);
            }
        }
        // Set the focus color.
        focus_color(val) {
            if (val == null) {
                return (this.input_opts.border.focused ?? "");
            }
            this.input_opts.border.focused = val;
            return this;
        }
        // Set default since it inherits an element.
        set_default() {
            return super.set_default(ExtendedInputElement);
        }
        /**
         * Set the error state and message.
         * Providing a truthy value will enable the error state and return the current instance for chaining.
         * Providing a falsy value will disable the error state and return the current instance for chaining.
         * Providing no value will return the current error message or `undefined` when no error is set.
         */
        error(err) {
            if (err == null) {
                return (this.has_error ? this.error_text.text() : undefined);
            }
            else if (err) {
                this.has_error = true;
                this._set_border_color(this.input_opts.border.missing, true);
                // this.image.mask_color(this._border_opts.missing)
                this.error_text.show();
                this.error_text.text(err);
            }
            else {
                this.has_error = false;
                this._set_border_color(this.input_opts.border.color);
                this.error_text.hide();
            }
            return this;
        }
        /** Remove the error state and mark as valid. */
        valid() {
            return this.error(false);
        }
        /** Submit the item, throws an error when the item is not defined. */
        submit() {
            // Get value.
            const value = this.value();
            if (value == null || value === "") {
                this.error("Incomplete field");
                throw Error("Fill in all the required fields.");
            }
            // Validate.
            if (this.validation_entry) {
                const res = vlib.Schema.validate_entry(value, this.validation_entry, { throw: false, field_type: "field" });
                if (res.error) {
                    // use raw error for showing.
                    this.error(res.raw_error ?? "Invalid value");
                    // use full error for throwing.
                    throw Error(res.error);
                }
            }
            // Success.
            this.valid();
            return value;
        }
        readonly(val) { if (val == null) {
            return this.input.readonly();
        } this.input.readonly(val); return this; }
        text(val) { if (val == null) {
            return this.label?.text() ?? "";
        } this.label?.text(val); return this; }
        value(val) {
            if (val == null) {
                return this.input.value();
            }
            this.input.value(val);
            return this;
        }
        required(val) { if (val == null) {
            return this.input.required();
        } this.input.required(val); return this; }
        on_enter(val) {
            if (val == null) {
                return this.input.on_enter();
            }
            this.input.on_enter((x, y) => val(this, y));
            return this;
        }
        on_input(val) {
            if (val == null) {
                return this.input.on_input();
            }
            this.input.on_input((x, y) => val(this, y));
            return this;
        }
        background(val) { if (val == null) {
            return this.container.background();
        } this.container.background(val); return this; }
        padding(...values) {
            if (values.length === 0 || (values.length === 1 && values[0] == null)) {
                return this.container.padding();
            }
            this.container.padding(...values);
            return this;
        }
    };
    return ExtendedInputElement = _classThis;
})();
export { ExtendedInputElement };
export const ExtendedInput = Elements.wrapper(ExtendedInputElement);
export const NullExtendedInput = Elements.create_null(ExtendedInputElement);
// Extended input.
let ExtendedSelectElement = (() => {
    let _classDecorators = [Elements.create({
            name: "ExtendedSelectElement",
            default_style: {
                ...VStackElement.default_style,
                "color": "inherit",
                "font-size": "16px",
                "background": "#FFFFFF",
            }
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VStackElement;
    var ExtendedSelectElement = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ExtendedSelectElement = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        /** The selectable items. */
        items;
        /** The label node. */
        // @ts-expect-error
        label;
        /** The image node. */
        image;
        /** The input node (readonly) with the selected value. */
        input;
        /** The container node. */
        container;
        /** The error text node. */
        error_text;
        /** The dropdown scroller element. */
        dropdown;
        /** Has error state. */
        has_error = false;
        /** Is focused state. */
        is_focused = false;
        // Internal attributes.
        input_opts;
        image_opts;
        _dropdown_item_hover;
        _on_change_callback;
        _on_dropdown_close;
        _dropdown_height;
        _value;
        // Constructor.
        constructor({ label = undefined, image = undefined, placeholder = "Placeholder", id = undefined, required = false, items = [{ id: "option", text: "Option", image: undefined }], // may also be an array with strings which will be used as the item's id and text.
        dropdown, input, }) {
            // Initialize super.
            super();
            this._init({
                derived: ExtendedSelectElement,
            });
            // Cast image.
            if (typeof image === "string") {
                image = { url: image };
            }
            this.image_opts = image;
            // Set input options..
            this.input_opts = {
                ...(input ?? {}),
                border: {
                    color: input?.border?.color ?? "gray",
                    hover: input?.border?.hover ?? "gray",
                    focused: input?.border?.focused ?? "#8EB8EB",
                    missing: input?.border?.missing ?? "#E8454E",
                    width: input?.border?.width ?? "1px",
                    radius: input?.border?.radius ?? "5px",
                    type: input?.border?.type ?? "full",
                },
            };
            // Arguments.
            if (Array.isArray(items)) {
                this.items = [];
                items.iterate((item) => {
                    if (typeof item === "string") {
                        this.items.append({
                            id: item,
                            text: item,
                        });
                    }
                    else {
                        if (item.text == null) {
                            item.text = item.id;
                        }
                        this.items.append(item);
                    }
                });
            }
            else if (typeof items === "object" && items != null) {
                this.items = [];
                Object.keys(items).iterate((key) => {
                    if (typeof items[key] === "string") {
                        this.items.append({
                            id: key,
                            text: items[key],
                        });
                    }
                    else {
                        this.items.append({
                            ...items[key],
                            id: key,
                        });
                    }
                });
            }
            else {
                throw Error(`Parameter "items" should be a defined value of type "array" or "object".`);
            }
            // Attributes.
            this._dropdown_item_hover = dropdown?.hover ?? "#00000007";
            // Set default styling.
            this.styles(ExtendedSelectElement.default_style);
            // Title element.
            this.label = Text(label)
                .parent(this)
                .font_size("inherit")
                .margin(0, 0, 7.5, 0)
                .color("inherit")
                .width("fit-content")
                .ellipsis_overflow(true);
            if (label == null) {
                this.label.hide();
            }
            // Title element.
            this.image = !image ? undefined : ImageMask(image.url)
                .parent(this)
                .mask_color(image?.color ?? "#000")
                .square(image?.size ?? 20)
                .margin(0, 10, 0, 5)
                .alt(image?.alt ?? "Volt");
            // Input element.
            this.input = Input(placeholder)
                .parent(this)
                .color("inherit")
                .readonly(true)
                .font_size("inherit")
                .margin(0)
                .width("100%")
                .stretch(true)
                .outline("none")
                .padding(0, 5)
                .line_height("1.6em")
                .box_shadow("none")
                .cursor("pointer")
                .border_radius(0); // is required
            // The hstack container.
            this.container = HStack(!this.image ? undefined : VStack(this.image)
                .width("fit-content")
                .height("1.6em")
                .center_vertical(), this.input)
                .parent(this)
                .background(input?.background ?? "transparent")
                .padding((input?.padding ?? "12px 6px"))
                .border_radius(this.input_opts.border.radius)
                .border_width(this.input_opts.border.width)
                .border_style("solid")
                .transition("border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out")
                .box_shadow(`0 0 0 0px transparent`)
                .width("100%")
                .on_mouse_over_out((e) => {
                if (!this.has_error && !this.is_focused) {
                    this._set_border_color(this.input_opts.border.hover);
                }
            }, (e) => {
                if (!this.has_error && !this.is_focused) {
                    this._set_border_color(this.input_opts.border.color);
                }
            })
                .on_click(() => {
                if (this.dropdown.is_hidden()) {
                    this.expand();
                }
            });
            this._set_border_color(this.input_opts.border.color);
            if (this.input_opts.border.type === "bottom") {
                this.container.padding_left(0).padding_right(0);
            }
            // The error message.
            this.error_text = Text("Incomplete field")
                .color(this.input_opts.border.missing)
                .font_size("0.8em")
                .margin(7.5, 0, 0, 2.5)
                .padding(0)
                .leading()
                .hide();
            // The dropdown menu.
            this.dropdown = Scroller()
                .parent(this)
                .position(0, null, null, null)
                .background(ExtendedSelectElement.default_style["background"])
                .border_radius(this.input_opts.border.radius)
                .border_width(this.input_opts.border.width)
                .border_style("solid")
                .border_color(this.input_opts.border.color)
                .box_shadow("0px 0px 5px #00000050")
                .frame("100%", "100%")
                .z_index(10)
                .hide();
            // Append.
            this.append(this.label, this.container, this.error_text, this.dropdown);
            // Styling.
            this.position("relative");
            this.overflow("visible");
            super.background("none");
            // Set id.
            if (id != null) {
                this.id(id);
            }
            // Set required.
            if (required) {
                this.required(required);
            }
            // On dropdown close event by mouse down.
            this._on_dropdown_close = (event) => {
                let parent = event.target.parentElement;
                let stop = true;
                for (let i = 0; i < 4; i++) {
                    if (parent == null) {
                        break;
                    }
                    else if (parent === this.dropdown) {
                        stop = false;
                        break;
                    }
                    parent = parent.parentElement;
                }
                if (stop) {
                    this.dropdown.hide();
                    window.removeEventListener("mousedown", this._on_dropdown_close);
                    // Unfocus.
                    if (!this.has_error) {
                        this.is_focused = false;
                        this._set_border_color(this.input_opts.border.color);
                    }
                }
            };
        }
        /** Helper to set the border color. */
        _set_border_color(color, set_outline = false) {
            if (this.input_opts.border.type === "full") {
                this.container.border_color(color);
                if (set_outline) {
                    this.container.box_shadow(`0 0 0 3px ${color}80`);
                }
                else {
                    this.container.box_shadow(`0 0 0 0px transparent`);
                }
            }
            else {
                this.container.border_bottom(this.input_opts.border.width, color);
            }
        }
        focus_color(val) {
            if (val == null) {
                return this.input_opts.border.focused ?? "";
            }
            this.input_opts.border.focused = val;
            return this;
        }
        error_color(val) {
            if (val == null) {
                return this.input_opts.border.missing ?? "";
            }
            this.input_opts.border.missing = val;
            this.error_text.color(this.input_opts.border.missing);
            return this;
        }
        dropdown_height(val) {
            if (val === undefined) {
                return this._dropdown_height;
            }
            this._dropdown_height = val;
            return this;
        }
        /** Set default since it inherits an element. */
        set_default() {
            return super.set_default(ExtendedSelectElement);
        }
        /**
         * Set the error state and message.
         * Providing a truthy value will enable the error state and return the current instance for chaining.
         * Providing a falsy value will disable the error state and return the current instance for chaining.
         * Providing no value will return the current error message or `undefined` when no error is set.
         */
        error(err) {
            if (err == null) {
                return (this.has_error ? this.error_text.text() : undefined);
            }
            else if (err) {
                this.has_error = true;
                this._set_border_color(this.input_opts.border.missing, true);
                this.image?.mask_color(this.input_opts.border.missing);
                this.error_text.show();
                if (err) {
                    this.error_text.text(err);
                }
            }
            else {
                this.has_error = false;
                this._set_border_color(this.input_opts.border.color);
                this.image?.mask_color(this.image_opts?.color ?? "#000");
                this.error_text.hide();
            }
            return this;
        }
        /** Remove the error state and mark as valid. */
        valid() {
            return this.error(false);
        }
        /** Submit the item, throws an error when the item is not defined. */
        submit() {
            const value = this.value();
            if (value == null || value === "") {
                this.error("Incomplete field");
                throw Error("Fill in all the required fields.");
            }
            this.valid();
            return value;
        }
        /** Expand dropdown. */
        expand() {
            // Set focus.
            if (!this.has_error) {
                this.is_focused = true;
                this._set_border_color(this.input_opts.border.focused, true);
            }
            // Add event listener.
            window.addEventListener("mousedown", this._on_dropdown_close);
            // Clear.
            this.dropdown.remove_children();
            // Set top.
            // this.dropdown.top(this.label.clientHeight + this.container.clientHeight + (this.label.is_hidden() ? 0 : 5) + 5)
            this.dropdown.top(this.label.clientHeight + (this.label.is_hidden() ? 0 : 5));
            // Search bar.
            const search = Input("Search")
                .color("inherit")
                .font_size("inherit")
                .margin(10)
                .padding(0)
                .width("calc(100% - 20px)")
                .outline("none")
                .box_shadow("none")
                .border_radius(0)
                .on_input((e, event) => {
                const query = e.value();
                if (query.length === 0) {
                    content.inner_html("");
                    this.items.iterate((item) => {
                        content.append(item.stack);
                    });
                }
                else {
                    const results = vlib.fuzzy.search({
                        query,
                        targets: this.items,
                        limit: undefined,
                        case_match: false,
                        allow_exceeding_chars: true,
                        key: ["id", "text"],
                    });
                    content.inner_html("");
                    results.iterate((item) => {
                        content.append(item.stack);
                    });
                }
            });
            // The content.
            const content = VStack()
                .frame("100%")
                .padding(5, 0);
            // Add children.
            let i = 0;
            let min_height;
            // this.dropdown.items = [];
            this.items.iterate((item) => {
                // Image.
                let img;
                if (item.image != null) {
                    img = ImageMask(item.image)
                        .mask_color(this.image_opts?.color ?? "#000")
                        .square(this.image_opts?.size ?? 20)
                        .margin(0, 10, 0, 5)
                        .alt(this.image_opts?.alt ?? "Volt")
                        .pointer_events("none"); // so target element of mouse down is easier.
                }
                // Text.
                const text = Text(item.text)
                    .color("inherit")
                    .font_size("inherit")
                    .white_space("pre")
                    .margin(0)
                    .width("100%")
                    .stretch(true)
                    .pointer_events("none"); // so target element of mouse down is easier.
                // Stack.
                const stack = HStack(img, text)
                    .width("100%")
                    .padding(5, 10)
                    .background("transparent")
                    .transition("background 0.2 ease-in-out")
                    .on_click(() => {
                    this.dropdown.hide();
                    this._value = item.id;
                    this.input.value(item.text ?? item.id);
                    if (this._on_change_callback != null) {
                        this._on_change_callback(this, item.id);
                    }
                    window.removeEventListener("mousedown", this._on_dropdown_close);
                })
                    .on_mouse_over((e) => e.background(this._dropdown_item_hover))
                    .on_mouse_out((e) => e.background("transparent"));
                // Update the item with the stack for searches.
                item.stack = stack;
                // Append.
                content.append(stack);
                // Increment.
                ++i;
            });
            // Show search bar or just show everything.
            if (this.items.length > 15) {
                this.dropdown.append(search, Divider()
                    .margin(0)
                    .background(this.input_opts.border.color), content);
            }
            else {
                this.dropdown.append(content);
            }
            // Show dropdown.
            this.dropdown.show();
            // Select
            if (this.items.length > 15) {
                search.select();
            }
            // Set min height.
            if (this._dropdown_height !== undefined) {
                this.dropdown.fixed_height(this._dropdown_height);
            }
            else if (this.items.length > 15) {
                this.dropdown.fixed_height((this.dropdown.content.child(0).clientHeight) * Math.min(this.items.length, 10) + 10);
            }
            else {
                this.dropdown.fixed_height((this.dropdown.content.child(0).child(0).clientHeight) * Math.min(this.items.length, 10) + 10);
            }
            // this.dropdown.min_height((this.dropdown.content.child(0).clientHeight + 10) * Math.min(this.items.length, 10) + 10) // old.
            // Response.
            return this;
        }
        value(val) {
            if (val == null) {
                return this._value ?? "";
            }
            this.items.iterate((item) => {
                if (item.id === val) {
                    this._value = val;
                    this.input.value(item.text ?? item.id);
                    if (this._on_change_callback != null) {
                        this._on_change_callback(this, val);
                    }
                }
            });
            return this;
        }
        background(val) {
            if (val == null) {
                return this.background();
            }
            this.container.background(val);
            this.dropdown.background(val);
            return this;
        }
        padding(...values) {
            if (values.length === 0 || (values.length === 1 && values[0] == null)) {
                return this.container.padding();
            }
            this.container.padding(...values);
            this.dropdown.padding(...values);
            return this;
        }
        // @ts-expect-error
        on_change(callback) {
            if (callback == null) {
                return this._on_change_callback;
            }
            this._on_change_callback = callback;
            return this;
        }
        text(val) { if (val == null) {
            return this.label.text();
        } this.label.text(val); return this; }
        required(val) { if (val == null) {
            return this.input.required();
        } this.input.required(val); return this; }
    };
    return ExtendedSelectElement = _classThis;
})();
export { ExtendedSelectElement };
export const ExtendedSelect = Elements.wrapper(ExtendedSelectElement);
export const NullExtendedSelect = Elements.create_null(ExtendedSelectElement);
