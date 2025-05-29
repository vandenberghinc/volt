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
import { VStack, VStackElement, HStack } from "./stack";
import { Divider } from "./divider";
import { Span } from "./span";
import { ForEach } from "./for_each";
/*	@docs:
    @nav: Frontend
    @chapter: Elements
    @title: Steps
    @descr: Steps element.
    @param:
        @name: content
        @descr: The steps content. By default it should be an array with `Step` objects. However, when one of the items is an array, the `Step` object will automatically be initialized with the array as the `Step.content` attribute.
        @type: Step[]
        @attributes_type: Step
        @attr:
            @name: title
            @descr: The step title.
            @type: string
        @attr:
            @name: content / children
            @descr: The step children.
            @type: node[]
        @attr:
            @name: hstack
            @descr: Flag to use a hstack instead of vstack as the children container.
            @type: boolean
            @default: false
        @attr:
            @name: side_by_side_width
            @descr: The minimum pixels width of the content container (not the full screen) to show content side by side when `hstack` is enabled.
            @type: number
    @param:
        @name: spacing
        @descr: Spacing between the step content.
        @type: string, number
        @default: "1.25em"
 */
let StepsElement = (() => {
    var _a;
    let _classDecorators = [(_a = Elements).register.bind(_a)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VStackElement;
    var StepsElement = _classThis = class extends _classSuper {
        // Constructor.
        constructor({ content = [], spacing = "1.25em", }) {
            // Inherit.
            super();
            this.element_type = "Steps";
            this.styles(StepsElement.default_style);
            // Assign single array argument to content.
            if (Array.isArray(arguments[0])) {
                content = arguments[0];
            }
            for (let i = 0; i < content.length; i++) {
                if (Array.isArray(content[i])) {
                    content[i] = {
                        content: content[i],
                    };
                }
            }
            // Attributes.
            this._tint = StepsElement.default_style["--steps-tint"];
            this._tint_opac = parseFloat(StepsElement.default_style["--steps-tint-opac"]);
            this._step_bg = StepsElement.default_style["--steps-step-bg"];
            this._step_border = StepsElement.default_style["--steps-step-border"];
            this._step_border_radius = StepsElement.default_style["--steps-step-border-radius"];
            this._div_bg = StepsElement.default_style["--steps-div-bg"];
            this._step_nr_nodes = [];
            this._step_nodes = [];
            this._div_nodes = [];
            this._content_nodes = [];
            // Build.
            this.append(ForEach(content, (item, index, is_last) => {
                // Build divider.
                const divider = is_last ? null : Divider()
                    .margin(0)
                    .font_size("0.7em") // for relative distances.
                    .position("2em", null, 0, "0.875em")
                    .frame(1.5, `calc(100% + ${spacing} - 0.6em)`)
                    .background(this._div_bg)
                    .z_index(0)
                    .exec(e => this._div_nodes.append(e));
                // Build content.
                const content = (item.hstack ? HStack() : VStack())
                    .z_index(1)
                    // .width(100%)
                    .stretch(true)
                    .overflow("hidden"); // required otherwise when inside Tabs will mess up.
                if (typeof item.title === "string") {
                    content.append(Span(item.title)
                        .color("inherit")
                        .display("block") // line wrap after.
                        .margin_bottom("0.5em")
                        .font_weight(500)
                        .line_height("1.6em"));
                }
                if (item.content) {
                    content.append(item.content);
                }
                else if (item.children) {
                    content.append(item.children);
                }
                if (typeof item.side_by_side_width == "number") {
                    content.on_resize_rule(() => content.clientWidth >= item.side_by_side_width, () => content.flex_direction("row"), () => content.flex_direction("column"));
                }
                this._content_nodes.append(content);
                // Append.
                let step_nr;
                const element = HStack(step_nr = VStack(VStack() // to support opacity on background only.
                    .assign_to_parent_as("bg")
                    .background(this._step_bg)
                    .transition("background 300ms ease-in-out")
                    .position(0, 0, 0, 0)
                    .z_index(0), Span((index + 1).toString())
                    .z_index(1))
                    .position("relative")
                    .overflow("hidden")
                    .font_size("0.7em")
                    .flex_shrink(0)
                    .frame("1.8em", "1.8em")
                    .margin("0.2em", "1em", null, null)
                    // .border_radius(this._step_border_radius)
                    .border_radius(5)
                    .border(1, this._step_border)
                    .center()
                    .center_vertical()
                    .z_index(1)
                    .exec(e => this._step_nr_nodes.append(e)), divider, content)
                    .fixed_width("100%")
                    .margin_top(index > 0 ? spacing : 0)
                    .position("relative")
                    .exec(e => this._step_nodes.append(e))
                    .on_mouse_over(() => step_nr.bg.opacity(this._tint_opac).background(this._tint))
                    .on_mouse_out(() => step_nr.bg.opacity(1).background(this._step_bg));
                return element;
            }));
        }
        // Set default since it inherits another element.
        set_default() {
            return super.set_default(StepsElement);
        }
        styles(style_dict) {
            if (style_dict == null) {
                let styles = super.styles();
                styles["--steps-tint"] = this._tint;
                styles["--steps-step-bg"] = this._step_bg;
                styles["--steps-step-border"] = this._step_border;
                styles["--steps-step-border-radius"] = this._step_border_radius;
                styles["--steps-div-bg"] = this._div_bg;
                return styles;
            }
            else {
                return super.styles(style_dict);
            }
        }
        tint(value) {
            if (value == null) {
                return this._tint;
            }
            this._tint = value;
            return this;
        }
        tint_opacity(value) {
            if (value == null) {
                return this._tint_opac;
            }
            this._tint_opac = value;
            return this;
        }
        content_overflow(value) {
            if (value == null) {
                return this._content_nodes[0].overflow();
            }
            this._content_nodes.iterate(node => {
                node.overflow(value);
            });
            return this;
        }
        divider_background(value) {
            if (value == null) {
                return this._div_bg;
            }
            this._div_bg = value;
            this._div_nodes.iterate(node => {
                node.background(value);
            });
            return this;
        }
        step_number_background(value) {
            if (value == null) {
                return this._step_bg;
            }
            this._step_bg = value;
            this._step_nr_nodes.iterate(node => {
                node.bg.background(value);
            });
            return this;
        }
        step_number_border_color(value) {
            if (value == null) {
                return this._step_border;
            }
            this._step_border = value;
            this._step_nr_nodes.iterate(node => {
                node.border_color(value);
            });
            return this;
        }
        step_number_border_radius(value) {
            if (value == null) {
                return this._step_border_radius;
            }
            this._step_border_radius = value;
            this._step_nr_nodes.iterate(node => {
                node.border_radius(value);
            });
            return this;
        }
        /*	@docs:
            @title: Iterate step number nodes
            @description: Iterate the step number nodes. When the callback returns any non null value the iteration will be stopped.
         */
        iterate_step_numbers(callback) {
            this._step_nr_nodes.iterate(node => { callback(node); });
            return this;
        }
        /*	@docs:
            @title: Iterate step nodes
            @description: Iterate the step nodes. When the callback returns any non null value the iteration will be stopped.
         */
        iterate_steps(callback) {
            this._step_nodes.iterate(node => { callback(node); });
            return this;
        }
    };
    __setFunctionName(_classThis, "StepsElement");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        StepsElement = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
    })();
    // Default styling.
    _classThis.default_style = {
        ...VStackElement.default_style,
        "--steps-tint": "gray",
        "--steps-tint-opac": 1,
        "--steps-step-bg": "gray",
        "--steps-step-border": "gray",
        "--steps-step-border-radius": "50%",
        "--steps-div-bg": "gray",
    };
    (() => {
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return StepsElement = _classThis;
})();
export { StepsElement };
export const Steps = Elements.wrapper(StepsElement);
