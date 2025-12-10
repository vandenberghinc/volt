/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
import { VElementBaseSignature, VElementTagMap, VDivElement } from "../elements/module.js";
import { VStackElement, HStackElement } from "./stack.js";
import { ImageMaskElement } from "./image.js";
import { DividerElement } from "./divider.js";
export declare class CodeBlockElement extends VElementTagMap.code {
    language?: string;
    line_numbers?: boolean;
    line_divider?: boolean;
    animate?: boolean;
    delay?: number;
    duration?: number;
    already_highlighted?: boolean;
    opts?: Record<string, any>;
    pre: CodePreElement;
    lines: VDivElement;
    lines_divider: VDivElement;
    content: HStackElement;
    constructor(code_or_opts?: string | {
        code: string;
        language?: string;
        line_numbers?: boolean;
        line_divider?: boolean;
        animate?: boolean;
        delay?: number;
        duration?: number;
        already_highlighted?: boolean;
        opts?: Record<string, any>;
    });
    /**
     * Hide the content scrollbars.
     */
    hide_scrollbar(): this;
    /**
     * Show the content scrollbars.
     */
    show_scrollbar(): this;
    /**
     * Make the element visible by setting `display: flex`.
     */
    show(): this;
    /**
     * Highlight the code content and optionally animate writing, show line numbers, and set a divider.
     * @param code The code to highlight; when omitted the constructor value is used.
     * @param language The language used for tokenization.
     * @param line_numbers Show line numbers in a left column.
     * @param line_divider Show a divider between line numbers and code.
     * @param animate Animate the writing of highlighted code.
     * @param delay Delay in milliseconds between characters when animating.
     * @param duration Total animation duration in milliseconds; overrides delay if provided.
     * @param opts Extra tokenizer options.
     */
    highlight({ code, // only required if the code was not provided by the constructor.
    language, // code language, precedes element attribute "language".
    line_numbers, // show line numbers.
    line_divider, // show line numbers divider.
    animate, // animate code writing.
    delay, // animation delay in milliseconds, only used when animatinos are enabled.
    duration, // animation duration in milliseconds, only used when animatinos are enabled.
    opts, }?: {
        code?: string;
        language?: string;
        line_numbers?: boolean;
        line_divider?: boolean;
        animate?: boolean;
        delay?: number;
        duration?: number;
        opts?: Record<string, any>;
    }): this;
}
export declare const CodeBlock: <Extensions extends object = {}>(code_or_opts?: string | {
    code: string;
    language?: string;
    line_numbers?: boolean;
    line_divider?: boolean;
    animate?: boolean;
    delay?: number;
    duration?: number;
    already_highlighted?: boolean;
    opts?: Record<string, any>;
} | undefined) => CodeBlockElement & Extensions;
export declare const NullCodeBlock: <Extensions extends object = {}>() => CodeBlockElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        CodeBlockElement: CodeBlockElement;
    }
}
export declare class CodePreElement extends VElementTagMap.pre {
    code: string;
    tokens: any;
    allow_animation: any;
    animate_promise: any;
    tokenizer: any;
    language: string;
    constructor(code?: string);
    /** @warning This function may cause security issues if the code is unsafe provided by the user, since this assigns to innerHTML in order to perform animations. */
    animate_writing({ code, delay, duration, }: {
        code: string;
        delay?: number;
        duration?: number;
    }): Promise<void>;
    /**
     * Cancel any ongoing typing animation and wait for it to finish.
     */
    cancel_animation(): Promise<void>;
    /** @warning This function may cause security issues if the code is unsafe provided by the user, since this assigns to innerHTML in order to perform animations. */
    highlight({ code, // only required if the code was not provided by the constructor.
    language, // code language, precedes element attribute "language".
    animate, // animate code writing.
    delay, // animation delay in milliseconds, only used when animatinos are enabled.
    duration, // animation duration in milliseconds, only used when animatinos are enabled.
    opts, // special args of the language's tokenizer constructor.
    _post_tokenized_callback, }?: {
        code?: string;
        language?: string;
        animate?: boolean;
        delay?: number;
        duration?: number;
        opts?: Record<string, any>;
        _post_tokenized_callback?: Function;
    }): this;
}
export declare const CodePre: <Extensions extends object = {}>(code?: string | undefined) => CodePreElement & Extensions;
export declare const NullCodePre: <Extensions extends object = {}>() => CodePreElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        CodePreElement: CodePreElement;
    }
}
/**
 * Create an inline code line element.
 * @nav Frontend/Elements
 * @param text The code line content.
 * @docs
 */
export declare class CodeLineElement extends VElementTagMap.span {
    constructor(text?: string);
    /** @warning This function may cause security issues if the input is unsafe provided by the user, since this assigns to innerHTML. */
    /**
     * Fill a string with markdown style codeline elements.
     * @docs
     */
    static fill(text: any, codeline_callback?: () => CodeLineElement): string;
}
export declare const CodeLine: <Extensions extends object = {}>(text?: string | undefined) => CodeLineElement & Extensions;
export declare const NullCodeLine: <Extensions extends object = {}>() => CodeLineElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        CodeLineElement: CodeLineElement;
    }
}
/**
 * Content object used by multi-language code blocks.
 */
interface MLContentObject {
    language: string;
    title?: string;
    data: string;
}
/**
 * Header state and helpers for the multi-language code block.
 */
interface HeaderExtension {
    selected: null | undefined | number;
    selected_lang: null | undefined | string;
    selected_code_pre: null | undefined | CodePreElement;
    set_selected(index: number): this;
    select(lang_or_index: number | string, recursive?: boolean): this;
}
declare const MultiLanguageCodeBlockElement_base: VElementBaseSignature;
/**
 * Build a code pre that optionally has different code per navigation.
 * @nav Frontend/Elements
 * @docs
 */
export declare class MultiLanguageCodeBlockElement extends MultiLanguageCodeBlockElement_base {
    _fg: string;
    _tint: string;
    _div_bg: string;
    _title_opac: number;
    _pre_nodes: CodePreElement[];
    _title_nodes: (VStackElement & {
        divider: VStackElement;
    })[];
    header: HStackElement & HeaderExtension;
    _copy_img: ImageMaskElement;
    content: HStackElement;
    divider: DividerElement;
    constructor(args: MLContentObject | MLContentObject[] | {
        content: string | MLContentObject | MLContentObject[];
        highlight?: boolean;
    });
    /**
     * Apply the default style for this derived element and return `this`.
     */
    set_default(): this;
    /**
     * Get or set style properties.
     * @param style_dict A style object to set; when omitted, returns the current styles.
     */
    styles(): Record<string, string>;
    styles(style_dict: Record<string, any>): this;
    /**
     * Set or get foreground tint color.
     * @docs
     */
    color(): string;
    color(value: string): this;
    /**
     * Set or get the tint color, mainly used for the divider below the active tab.
     * @docs
     */
    tint(): string;
    tint(value: string): this;
    /**
     * Set the background of the divider.
     * @docs
     */
    divider_background(): string;
    divider_background(value: string): this;
}
export declare const MultiLanguageCodeBlock: <Extensions extends object = {}>(args: MLContentObject | MLContentObject[] | {
    content: string | MLContentObject | MLContentObject[];
    highlight?: boolean;
}) => MultiLanguageCodeBlockElement & Extensions;
export declare const NullMultiLanguageCodeBlock: <Extensions extends object = {}>() => MultiLanguageCodeBlockElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        MultiLanguageCodeBlockElement: MultiLanguageCodeBlockElement;
    }
}
export {};
