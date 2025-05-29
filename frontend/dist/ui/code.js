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
// @exports: CodeBlockElement, CodeBlock, CodePreElement, CodePre, CodeLineElement, CodeLine, MultiLanguageCodeBlockElement, MultiLanguageCodeBlock
// Imports.
import { Utils } from "../modules/utils.js";
import { Elements, VElementTagMap, VDiv } from "../elements/module.js";
import { Span } from "./span";
import { VStack, VStackElement, HStack } from "./stack";
import { ImageMask } from "./image";
import { ForEach } from "./for_each";
import { Spacer } from "./spacer";
import { Divider } from "./divider";
// import * as vhighlight from "/Users/administrator/persistance/private/dev/vinc/vhighlight"
import * as vhighlight from "@vandenberghinc/vhighlight";
// All codeblocks using languages.
const language_codeblocks = [];
// CodeBlock.
let CodeBlockElement = (() => {
    let _classDecorators = [Elements.create({
            name: "CodeBlockElement",
            default_style: {
                "display": "flex",
                "flex-direction": "column",
                "margin": "0px 0px 0px 0px",
                "padding": "15px 20px 15px 20px",
                "text-align": "start",
                "white-space": "pre",
                "font-family": "'Menlo', 'Consolas', monospace",
                "font-size": "13px",
                "font-weight": "500",
                "line-height": "18px",
                "border-radius": "15px",
                "color": "#FFFFFF",
                "background": "#262F3D",
                "overflow": "hidden", // only the content should scroll so the header remains fixed.
                "width": "100%",
                "min-width": "100%",
                "--header-color": "inherit",
                "--header-border": "#00000010",
                "--header-background": "inherit",
                "--selected-language-color": "inherit",
            },
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VElementTagMap.code;
    var CodeBlockElement = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CodeBlockElement = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        // Attributes.
        language;
        line_numbers;
        line_divider;
        // @ts-expect-error
        animate;
        // @ts-expect-error
        delay;
        // @ts-expect-error
        duration;
        already_highlighted;
        opts;
        pre;
        lines;
        lines_divider;
        // @ts-expect-error
        content;
        // Constructor.
        constructor(code_or_opts = {
            code: "", // the code data.
            language: undefined, // the language.
            line_numbers: false, // enable line numbers.
            line_divider: true, // enable the line divider, only an option when line numbers are enabled.
            animate: false, // animate code writing.
            delay: 25, // animation delay in milliseconds, only used when animatinos are enabled.
            duration: undefined, // animation duration in milliseconds, only used when animatinos are enabled.
            already_highlighted: false, // can be used to indicate the code is already highlighted.
            opts: {}, // special args of the language's tokenizer constructor.
        }) {
            // Initialize base class.
            super({
                derived: CodeBlockElement,
            });
            // Attributes.
            let code = code_or_opts;
            this.language = undefined;
            this.line_numbers = false;
            this.line_divider = true;
            this.animate = false;
            this.delay = 25;
            this.duration = undefined;
            this.already_highlighted = false;
            this.opts = {};
            if (typeof code_or_opts === "object") {
                if (code_or_opts.code !== undefined) {
                    code = code_or_opts.code;
                }
                if (code_or_opts.language !== undefined) {
                    this.language = code_or_opts.language;
                }
                if (code_or_opts.line_numbers !== undefined) {
                    this.line_numbers = code_or_opts.line_numbers;
                }
                if (code_or_opts.line_divider !== undefined) {
                    this.line_divider = code_or_opts.line_divider;
                }
                if (code_or_opts.already_highlighted !== undefined) {
                    this.already_highlighted = code_or_opts.already_highlighted;
                }
                if (code_or_opts.animate !== undefined) {
                    this.animate = code_or_opts.animate;
                }
                if (code_or_opts.delay !== undefined) {
                    this.delay = code_or_opts.delay;
                }
                if (code_or_opts.duration !== undefined) {
                    this.duration = code_or_opts.duration;
                }
                if (code_or_opts.opts !== undefined) {
                    this.opts = code_or_opts.opts;
                }
            }
            // Code per language.
            if (typeof code === "object") {
                console.warn("This behaviour is deprecated., use MultiLanguageCodeBlock instead.");
                code = "";
            }
            else {
                code = code.trim();
            }
            // Code pre.
            this.pre = CodePre(code)
                .parent(this)
                .color("inherit")
                .font("inherit")
                .background("none")
                .border_radius(0)
                .padding(0)
                .margin(0)
                .stretch(true)
                .overflow("visible")
                .line_height("inherit");
            // Line numbers.
            this.lines = VDiv()
                .parent(this)
                .color("var(--vhighlight-token-comment)")
                .font("inherit")
                .white_space("pre")
                .line_height("inherit")
                .flex_shrink(0)
                .hide();
            // Line numbers divider.
            this.lines_divider = VDiv()
                .parent(this)
                .background("var(--vhighlight-token-comment)")
                .fixed_width(0.5)
                .flex_shrink(0)
                .fixed_height("calc(100% - 6px)")
                .margin(3, 10, 0, 10)
                .hide();
            // The content.
            this.content = HStack(this.lines, this.lines_divider, this.pre)
                .parent(this)
                // .padding(CodeBlockElement.default_style.padding)
                .flex_wrap("nowrap")
                .overflow("auto visible");
            // Append code pre.
            this.append(this.content);
            // Set padding.
            // this.padding(0)
            this.padding(CodeBlockElement.default_style.padding);
        }
        // Hide/show the scrollbar.
        hide_scrollbar() {
            this.content.classList.add("hide_scrollbar");
            return this;
        }
        show_scrollbar() {
            this.content.classList.remove("hide_scrollbar");
            return this;
        }
        // Show.
        show() {
            this.style.display = "flex";
            return this;
        }
        // Highlight code.
        highlight({ code, // only required if the code was not provided by the constructor.
        language, // code language, precedes element attribute "language".
        line_numbers, // show line numbers.
        line_divider, // show line numbers divider.
        animate, // animate code writing.
        delay, // animation delay in milliseconds, only used when animatinos are enabled.
        duration, // animation duration in milliseconds, only used when animatinos are enabled.
        opts, // special args of the language's tokenizer constructor.
         } = {}) {
            // Update attributes.
            if (language == null) {
                language = this.language;
            }
            if (line_numbers == null) {
                line_numbers = this.line_numbers;
            }
            if (line_divider == null) {
                line_divider = this.line_divider;
            }
            if (animate == null) {
                animate = this.animate;
            }
            if (delay == null) {
                delay = this.delay;
            }
            if (duration == null) {
                duration = this.duration;
            }
            if (opts == null) {
                opts = this.opts;
            }
            // Highlight.
            this.pre.highlight({
                code: code,
                language: language,
                animate: animate,
                delay: delay,
                duration: duration,
                opts: opts,
                _post_tokenized_callback: !line_numbers ? undefined : (tokens) => {
                    // Set line numbers.
                    this.lines.show();
                    this.lines_divider.show();
                    if (line_divider) {
                        this.lines_divider.fixed_width(1);
                        this.lines_divider.margin(3, 10, 0, 10);
                    }
                    else {
                        this.lines_divider.fixed_width(0);
                        this.lines_divider.margin(3, 12.5, 0, 12.5);
                    }
                    let html = "";
                    for (var i = 0; i < tokens.length; i++) {
                        html += `${(i + 1)}\n`;
                    }
                    this.lines.innerHTML = html;
                    this.lines_divider.min_height(this.lines.offsetHeight - 6);
                },
            });
            // Response.
            return this;
        }
    };
    return CodeBlockElement = _classThis;
})();
export { CodeBlockElement };
export const CodeBlock = Elements.wrapper(CodeBlockElement);
export const NullCodeBlock = Elements.create_null(CodeBlockElement);
// CodePre.
let CodePreElement = (() => {
    let _classDecorators = [Elements.create({
            name: "CodePreElement",
            default_style: {
                "margin": "0px 0px 0px 0px",
                "padding": "15px 20px 15px 20px",
                "text-align": "start",
                "white-space": "pre",
                "font-family": "'Menlo', 'Consolas', monospace",
                "font-size": "13px",
                "font-weight": "500",
                "line-height": "16px",
                "border-radius": "15px",
                "color": "#FFFFFF",
                "background": "#262F3D",
                "tab-size": 4,
                "overflow": "scroll visible",
            },
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VElementTagMap.pre;
    var CodePreElement = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CodePreElement = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        // Attributes.
        code;
        tokens = null;
        allow_animation;
        animate_promise;
        tokenizer;
        language = "";
        // Constructor.
        constructor(code = "") {
            // Initialize base class.
            super({
                derived: CodePreElement,
            });
            // Attributes.
            this.code = code;
            // Set code.
            if (this.code != null) {
                while (this.code.length > 0 && this.code[this.code.length - 1] == "\n") {
                    this.code = this.code.slice(-this.code.length, -1);
                }
                this.text(this.code);
            }
        }
        // Animate writing.
        /** @warning This function may cause security issues if the code is unsafe provided by the user, since this assigns to innerHTML in order to perform animations. */
        // @note cant use attribute for highlighted code since that may be edited inside `highlight()` while the animation is still busy and otherwise highlight would need to be an sync func, but it has to return this, not a promise.
        async animate_writing({ code, delay = 25, duration = undefined, }) {
            // Check highlighted code.
            if (code == null) {
                throw Error(`The code must be highlighted first using "highlight()".`);
            }
            // Cancel animation.
            await this.cancel_animation();
            // Start animation.
            this.innerHTML = "";
            this.allow_animation = true;
            this.animate_promise = new Promise((resolve) => {
                // Set delay based on duration.
                if (duration != null) {
                    delay = duration / code.length;
                }
                // Set the min height otherwise the height expands while scrolling while the writing is animated then this can created unwanted behviour when scrolling up.
                const computed = window.getComputedStyle(this);
                this.style.minHeight = `${parseFloat(computed.paddingTop) + parseFloat(computed.paddingBottom) + parseFloat(computed.lineHeight) * this.tokens.length}px`;
                // Reset content.
                this.innerHTML = "";
                // Check html entity.
                const check_html_entity = (index) => {
                    let entity = "&", entity_last_index;
                    for (let i = index + 1; i < index + 1 + 5; i++) {
                        entity += code.charAt(i);
                        if (code.charAt(i) === ";") {
                            entity_last_index = i;
                            break;
                        }
                    }
                    return { entity, entity_last_index };
                };
                // Add char.
                const add_char = (index) => {
                    // Stop.
                    if (this.allow_animation !== true) {
                        resolve(undefined);
                        return;
                    }
                    // Animation finished.
                    else if (index >= code.length) {
                        resolve(undefined);
                        return;
                    }
                    // Animate.
                    else {
                        // Span opening.
                        if (code.charAt(index) === '<') {
                            // Fins span open, close and code.
                            let span_index;
                            let span_open = "";
                            let span_close = "";
                            let span_code = "";
                            let open = true;
                            let first = true;
                            let recursive = false;
                            for (span_index = index; span_index < code.length; span_index++) {
                                if (this.allow_animation !== true) {
                                    return;
                                }
                                let char = code.charAt(span_index);
                                // Add html entities in one batch.
                                if (char === "&") {
                                    let { entity, entity_last_index } = check_html_entity(span_index);
                                    if (entity_last_index !== undefined) {
                                        char = entity;
                                        span_index = entity_last_index;
                                    }
                                }
                                // Already open or start of opening.
                                if (char == '<' || open) {
                                    open = true;
                                    if (first) {
                                        span_open += char;
                                    }
                                    else {
                                        span_close += char;
                                    }
                                    if (char == '>') {
                                        open = false;
                                        if (first) {
                                            first = false;
                                            continue;
                                        }
                                        // Animate span code writing.
                                        let before = this.innerHTML;
                                        let added_span_code = "";
                                        const add_span_code = (index) => {
                                            if (index < span_code.length) {
                                                added_span_code += span_code[index];
                                                let add = before;
                                                add += span_open;
                                                add += added_span_code;
                                                add += span_close;
                                                this.innerHTML = add;
                                                setTimeout(() => add_span_code(index + 1), delay);
                                            }
                                            else {
                                                recursive = true;
                                                setTimeout(() => add_char(span_index + 1), delay);
                                            }
                                        };
                                        add_span_code(0);
                                        // Stop.
                                        break;
                                    }
                                }
                                // Add non span code.
                                else {
                                    span_code += char;
                                }
                            }
                            if (recursive === false && span_index === code.length) {
                                resolve(undefined);
                            }
                        }
                        // Non span code.
                        else {
                            // Set char.
                            let char = code.charAt(index);
                            // Add html entities in one batch.
                            if (char === "&") {
                                let { entity, entity_last_index } = check_html_entity(index);
                                if (entity_last_index !== undefined) {
                                    char = entity;
                                    index = entity_last_index;
                                }
                            }
                            // Default.
                            this.innerHTML += char;
                            setTimeout(() => add_char(index + 1), delay);
                        }
                    }
                };
                // Start animation.
                add_char(0);
            });
            // Response.
            return this.animate_promise;
        }
        // Cancel animation.
        async cancel_animation() {
            if (this.animate_promise != null) {
                this.allow_animation = false;
                await this.animate_promise;
                this.animate_promise = null;
            }
        }
        // Highlight.
        /** @warning This function may cause security issues if the code is unsafe provided by the user, since this assigns to innerHTML in order to perform animations. */
        highlight({ code = undefined, // only required if the code was not provided by the constructor.
        language = undefined, // code language, precedes element attribute "language".
        animate = false, // animate code writing.
        delay = 25, // animation delay in milliseconds, only used when animatinos are enabled.
        duration = undefined, // animation duration in milliseconds, only used when animatinos are enabled.
        opts = {}, // special args of the language's tokenizer constructor.
        _post_tokenized_callback = undefined, } = {}) {
            console.log("> Highlight");
            // Vars.
            if (code != null) {
                this.code = code;
                while (this.code.length > 0 && this.code[this.code.length - 1] == "\n") {
                    this.code = this.code.slice(-this.code.length, -1);
                }
                // this.code = this.code.replaceAll("<", "&lt;").replaceAll(">", "&gt;") // this causees errors when the CodeBlock uses multi languages for a single block.
                this.innerHTML = code;
            }
            if (language != null) {
                this.language = language;
            }
            // Stop when no language is defined.
            if (this.language === "" || this.language == null) {
                return this;
            }
            // Cancel previous animation.
            this.cancel_animation()
                .then(() => {
                console.log("> Cancelled animation");
                // Get tokenizer.
                this.tokenizer = vhighlight.init_tokenizer(this.language, opts);
                if (this.tokenizer == null) {
                    return this;
                }
                // Get the tokens.
                this.tokenizer.code = this.code;
                this.tokens = this.tokenizer.tokenize();
                // Build the html.
                const highlighted_code = this.tokenizer.build_html(this.tokens);
                console.log("> Highlighted:", highlighted_code);
                // Post tokenize callback.
                if (_post_tokenized_callback != null) {
                    _post_tokenized_callback(this.tokens);
                }
                // Set code.
                if (animate == true) {
                    this.animate_writing({ code: highlighted_code, delay, duration });
                }
                else {
                    this.innerHTML = highlighted_code;
                }
            });
            // Response.
            return this;
        }
    };
    return CodePreElement = _classThis;
})();
export { CodePreElement };
export const CodePre = Elements.wrapper(CodePreElement);
export const NullCodePre = Elements.create_null(CodePreElement);
// CodeLine.
/*	@docs:
    @nav: Frontend
    @chapter: Elements
    @title: Code Line
    @description: Create an inline code line element.
    @param:
        @name: text
        @type: string
        @descr: The code line content.
 */
let CodeLineElement = (() => {
    let _classDecorators = [Elements.create({
            name: "CodeLineElement",
            default_style: {
                "font-family": "\"Menlo\", \"Consolas\", monospace",
                "font-size": "0.90em",
                "font-style": "italic",
                "background": "#000000",
                "color": "#FFFFFF",
                "border-radius": "10px",
                "white-space": "pre",
                "padding": "2.5px 7.5px 2.5px 7.5px",
            }
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VElementTagMap.span;
    var CodeLineElement = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CodeLineElement = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        // Constructor.
        constructor(text) {
            // Initialize base class.
            super({
                derived: CodeLineElement,
            });
            // Set text.
            if (text) {
                this.text(text);
            } // never use inner html also because the text may content html entities.
        }
        /** @warning This function may cause security issues if the input is unsafe provided by the user, since this assigns to innerHTML. */
        /*	@docs:
            @title: Fill
            @descr: Fill a string with markdown style codeline elements.
         */
        static fill(text, codeline_callback = () => CodeLine()) {
            // Fill code line's.
            if (text.indexOf("`") !== -1) {
                const split = text.split("`");
                let is_code = false;
                let filled = "";
                for (let i = 0; i < split.length; i++) {
                    if (is_code) {
                        filled += codeline_callback().inner_html(split[i]);
                    }
                    else {
                        filled += split[i];
                    }
                    is_code = !is_code;
                }
                text = filled;
            }
            return text;
        }
    };
    return CodeLineElement = _classThis;
})();
export { CodeLineElement };
export const CodeLine = Elements.wrapper(CodeLineElement);
export const NullCodeLine = Elements.create_null(CodeLineElement);
// Build a code pre that optionally has different code per navigation.
/*	@docs:
    @nav: Frontend
    @chapter: Elements
    @title: Multi Language Code Block
    @description: Build a code pre that optionally has different code per navigation.
    @param:
        @name: code
        @type: CodeObject
        @descr: The array of code objects.
        @attr:
            @name: language
            @descr: The language name.
        @attr:
            @name: title
            @descr: The code title, when left undefined the language name will be used as title.
        @attr:
            @name: data
            @descr: The code data.
            @required: true
    @param:
        @name: highlight
        @type: boolean
        @descr: Highlight the code content.
 */
let MultiLanguageCodeBlockElement = (() => {
    let _classDecorators = [Elements.create({
            name: "MultiLanguageCodeBlockElement",
            default_style: {
                ...VStackElement.default_style,
                "font-family": "'Menlo', 'Consolas', monospace",
                "background": "black",
                "color": "white",
                "box-shadow": "0px 0px 5px #00000005",
                "font-size": "13px",
                "line-height": "18px",
                "border-radius": "10px",
                "tab-size": 4,
                "--mlcb-tint": "white",
                "--mlcb-div-bg": "grey",
                "--mlcb-title-opac": 0.7,
            },
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VStackElement;
    var MultiLanguageCodeBlockElement = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultiLanguageCodeBlockElement = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        // Attributes.
        _fg;
        _tint;
        _div_bg;
        _title_opac;
        _pre_nodes = [];
        _title_nodes = [];
        header;
        _copy_img;
        // @ts-expect-error
        content;
        divider;
        // Constructor.
        constructor(args) {
            // Inherit.
            super();
            this._init({
                derived: MultiLanguageCodeBlockElement,
            });
            // Specify.
            let content, highlight = true;
            if (typeof args === "object" && !Array.isArray(args) && args.content) {
                ({ content, highlight = true } = args);
            }
            else {
                content = args;
            }
            // Check code.
            let code = [];
            if (typeof content === "string") {
                code = [{ language: "__unknown__", title: undefined, data: content }];
            }
            else if (typeof content === "object" && !Array.isArray(content)) {
                code = [content];
            }
            else if (Array.isArray(content)) {
                code = content;
            }
            else {
                console.error(`Invalid value type of code block "${typeof content}".`);
            }
            // Vars.
            const main_this = this;
            this._fg = MultiLanguageCodeBlockElement.default_style.color;
            this._tint = MultiLanguageCodeBlockElement.default_style["--mlcb-tint"];
            this._div_bg = MultiLanguageCodeBlockElement.default_style["--mlcb-div-bg"];
            this._title_opac = typeof MultiLanguageCodeBlockElement.default_style["--mlcb-title-opac"] === "number"
                ? MultiLanguageCodeBlockElement.default_style["--mlcb-title-opac"]
                : parseInt(MultiLanguageCodeBlockElement.default_style["--mlcb-title-opac"]);
            // The header element.
            this.header = HStack(
            // Titles.
            HStack(ForEach(code, (item, index) => {
                const title = VStack(Span(item.title || item.language || "")
                    .font_size(12)
                    .line_height(12 + 2)
                    .font_weight(500)
                    .ellipsis_overflow(true), VStack()
                    .width("100%")
                    .height(2)
                    .border_radius(2)
                    .transition("background 300ms ease-in-out")
                    .background("transparent")
                    .assign_to_parent_as("divider")
                    .position(null, null, 0, null))
                    .transition("opacity 300ms ease-in-out")
                    .opacity(this._title_opac)
                    .padding(0, 2)
                    .flex_shrink(0)
                    .center_vertical()
                    .height("100%")
                    .position("relative")
                    .margin_right(20)
                    .on_mouse_over(() => {
                    if (this.header.selected !== index) {
                        title.opacity(1);
                        title.divider.opacity(this._title_opac).background(this._fg);
                    }
                })
                    .on_mouse_out(() => {
                    if (this.header.selected !== index) {
                        title.opacity(this._title_opac);
                        title.divider.opacity(1).background("transparent");
                    }
                });
                if (code.length > 1) {
                    title.on_click(() => this.header.select(index));
                }
                this._title_nodes.append(title);
                return title;
            }))
                .parent(this)
                .height("100%")
                .class("hide_scrollbar")
                .wrap(false)
                .overflow("visible")
                // .flex("1 1 0"),
                .width("100%"), 
            // Spacer.
            code.length > 1 ? null : Spacer(), 
            // Copy image.
            this._copy_img = ImageMask("/volt_static/icons/copy.webp")
                .frame(15, 15)
                .flex_shrink(0)
                .margin(null, null, null, 10)
                .mask_color(this._fg)
                .transform("rotate(90deg)")
                .opacity(this._title_opac)
                .transition("opacity 250ms ease-in-out")
                .on_mouse_over(e => e.opacity(1))
                .on_mouse_out(e => e.opacity(this._title_opac))
                .on_click(async () => {
                if (this.header?.selected_code_pre?.textContent) {
                    Utils.copy_to_clipboard(this.header.selected_code_pre.textContent)
                        .then(() => {
                        // @ts-expect-error
                        if (typeof RESPONSE_STATUS !== "undefined") {
                            // @ts-expect-error
                            RESPONSE_STATUS.message("Copied to clipboard");
                        }
                    })
                        .catch((error) => {
                        console.error(error);
                        // @ts-expect-error
                        if (typeof RESPONSE_STATUS !== "undefined") {
                            // @ts-expect-error
                            RESPONSE_STATUS.error("Failed to the code to the clipboard");
                        }
                    });
                }
            }))
                .width("100%")
                .overflow("hidden")
                .height(42.5)
                .padding(0, 15, 0, 15)
                .center_vertical()
                .z_index(2)
                .extend({
                selected: null,
                selected_lang: null,
                selected_code_pre: null,
                set_selected(index) {
                    // Do not check for already selected since it is used in func tint() to set divider tint.
                    // Set selected index.
                    this.selected = index;
                    this.selected_lang = code[index].language ?? "__unknown__";
                    this.selected_code_pre = main_this._pre_nodes[index];
                    // Set title.
                    main_this._title_nodes.iterate((i) => {
                        i.opacity(main_this._title_opac);
                        if (code.length > 1) {
                            i.divider
                                .opacity(1)
                                .background("transparent")
                                .remove_on_theme_updates();
                        }
                    });
                    main_this._title_nodes[index].opacity(1);
                    if (code.length > 1) {
                        main_this._title_nodes[index].divider.background(main_this._tint);
                    }
                    return this;
                },
                select(lang_or_index, recursive = true) {
                    // Extract lang and index.
                    let lang;
                    let index;
                    if (typeof lang_or_index === "string") {
                        for (let i = 0; i < code.length; i++) {
                            if (code[i].language === lang_or_index) {
                                lang = lang_or_index;
                                index = i;
                                break;
                            }
                        }
                        // Nothing found.
                        if (index === undefined) {
                            return;
                        }
                    }
                    else {
                        if (lang_or_index >= code.length) {
                            return;
                        }
                        index = lang_or_index;
                        lang = code[index].language || "__unknown__";
                    }
                    // Toggle code pre's.
                    if (recursive && lang !== "__unknown__") {
                        // localStorage.setItem("__ldoc_code_lang", lang);
                        this.select(index, false);
                        // LibrisUI.codeblock_lang_headers.iterate((h) => {
                        // 	if (h !== header) {
                        // 		h.select(lang, false)
                        // 	}
                        // })
                    }
                    else {
                        this.set_selected(index);
                        for (let i = 0; i < main_this._pre_nodes.length; i++) {
                            if (i === index) {
                                main_this._pre_nodes[i].show();
                            }
                            else {
                                main_this._pre_nodes[i].hide();
                            }
                        }
                    }
                    return this;
                }
            });
            // LibrisUI.codeblock_lang_headers.push(header);
            // Add the code items.
            this.content = HStack() // keep as hstack, for some reason the right side of the pre's will have padding as well then.
                .width("100%")
                .overflow("scroll");
            let index = 0;
            code.iterate((item) => {
                if (item.data == null) {
                    console.error("Undefined codeblock data" + (item.language === "__unknown__" ? "" : ` for language ${item.language}`) + ".");
                    return null;
                }
                if (highlight) {
                    const tokenizer = vhighlight.init_tokenizer(item.language);
                    if (tokenizer) {
                        item.data = tokenizer.tokenize({ code: item.data, build_html: true });
                    }
                }
                const pre = CodePre()
                    .padding(20, 20)
                    .margin(0)
                    .inner_html(item.data)
                    .overflow("visible")
                    .background("transparent")
                    .border_radius(0)
                    .stretch(true); // keep stretch, for some reason the right side of the pre's will have padding as well then.
                pre.hide();
                this._pre_nodes.append(pre);
                this.content.append(pre);
                ++index;
            });
            // Main container (this).
            this
                .display("block")
                .white_space("pre")
                .class("hide_scrollbar")
                .max_width("100%")
                .border(1, this._div_bg)
                .position("relative")
                .append(this.header, this.divider = Divider()
                .parent(this)
                .background(this._div_bg)
                .margin(0, 0, 0, 0), this.content);
            // Select first item.
            // @ts-ignore
            this.header.select(0, false);
        }
        // Set default since it inherits another element.
        set_default() {
            return super.set_default(MultiLanguageCodeBlockElement);
        }
        styles(style_dict) {
            if (style_dict == null) {
                let styles = super.styles();
                styles["--mlcb-tint"] = this._tint;
                styles["--mlcb-div-bg"] = this._div_bg;
                styles["--mlcb-title-opac"] = this._title_opac.toString();
                return styles;
            }
            else {
                return super.styles(style_dict);
            }
        }
        color(value) {
            if (value == null) {
                return this._fg;
            }
            this._fg = value;
            super.color(value);
            this._copy_img.mask_color(value);
            return this;
        }
        tint(value) {
            if (value == null) {
                return this._tint;
            }
            this._tint = value;
            this.header.set_selected(this.header.selected); // set tint again.
            return this;
        }
        divider_background(value) {
            if (value == null) {
                return this._div_bg;
            }
            this._div_bg = value;
            this.divider.background(value);
            return this;
        }
    };
    return MultiLanguageCodeBlockElement = _classThis;
})();
export { MultiLanguageCodeBlockElement };
export const MultiLanguageCodeBlock = Elements.wrapper(MultiLanguageCodeBlockElement);
export const NullMultiLanguageCodeBlock = Elements.create_null(MultiLanguageCodeBlockElement);
