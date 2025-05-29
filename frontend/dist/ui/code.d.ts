import { VElementBaseSignature, VElementTagMap, VDivElement } from "../elements/module.js";
import { VStackElement, HStackElement } from "./stack";
import { ImageMaskElement } from "./image";
import { DividerElement } from "./divider";
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
    hide_scrollbar(): this;
    show_scrollbar(): this;
    show(): this;
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
export declare class CodeLineElement extends VElementTagMap.span {
    constructor(text?: string);
    /** @warning This function may cause security issues if the input is unsafe provided by the user, since this assigns to innerHTML. */
    static fill(text: any, codeline_callback?: () => CodeLineElement): string;
}
export declare const CodeLine: <Extensions extends object = {}>(text?: string | undefined) => CodeLineElement & Extensions;
export declare const NullCodeLine: <Extensions extends object = {}>() => CodeLineElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        CodeLineElement: CodeLineElement;
    }
}
interface MLContentObject {
    language: string;
    title?: string;
    data: string;
}
interface HeaderExtension {
    selected: none | number;
    selected_lang: none | string;
    selected_code_pre: none | CodePreElement;
    set_selected(index: number): this;
    select(lang_or_index: number | string, recursive?: boolean): this;
}
declare const MultiLanguageCodeBlockElement_base: VElementBaseSignature;
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
    set_default(): this;
    styles(): Record<string, string>;
    styles(style_dict: Record<string, any>): this;
    color(): string;
    color(value: string): this;
    tint(): string;
    tint(value: string): this;
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
