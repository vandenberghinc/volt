export declare class Element {
    type: string;
    element_type: string;
    tag: string;
    _style: Record<string, string>;
    _attrs: Record<string, any>;
    classes: string[];
    _inner_html: string | null;
    children: any[];
    _lang?: string;
    _charset?: string;
    _viewport?: string;
    _title?: string;
    _links?: (string | Record<string, string>)[];
    _disabled?: boolean;
    constructor({ type, tag, default_style, default_attributes, default_events, }: {
        type?: string;
        tag?: string;
        default_style?: Record<string, string> | null;
        default_attributes?: Record<string, string> | null;
        default_events?: Record<string, (event: Event) => any> | null;
    });
    pad_numeric(value: string | number, padding?: string): string;
    html(): string;
    links(links: (string | Record<string, string>)[]): this;
    background_color(): string | undefined;
    background_color(value: string): this;
    display(): string | undefined;
    display(value: string): this;
    background_image(): string | undefined;
    background_image(value: string): this;
    background_repeat(): string | undefined;
    background_repeat(value: string): this;
    border_top(): string | undefined;
    border_top(value: string): this;
    border_bottom(): string | undefined;
    border_bottom(value: string): this;
    border_right(): string | undefined;
    border_right(value: string): this;
    border_left(): string | undefined;
    border_left(value: string): this;
    border_color(): string | undefined;
    border_color(value: string): this;
    border_style(): string | undefined;
    border_style(value: string): this;
    cursor(): string | undefined;
    cursor(value: string): this;
    justify_items(): string | undefined;
    justify_items(value: string): this;
    letter_spacing(): string | undefined;
    letter_spacing(value: string): this;
    line_height(): string | undefined;
    line_height(value: string): this;
    outline(): string | undefined;
    outline(value: string): this;
    overflow(): string | undefined;
    overflow(value: string): this;
    overflow_x(): string | undefined;
    overflow_x(value: string): this;
    overflow_y(): string | undefined;
    overflow_y(value: string): this;
    text_align(): string | undefined;
    text_align(value: string): this;
    text_align_last(): string | undefined;
    text_align_last(value: string): this;
    text_decoration(): string | undefined;
    text_decoration(value: string): this;
    text_decoration_color(): string | undefined;
    text_decoration_color(value: string): this;
    text_wrap(): string | undefined;
    text_wrap(value: string): this;
    white_space(): string | undefined;
    white_space(value: string): this;
    overflow_wrap(): string | undefined;
    overflow_wrap(value: string): this;
    word_wrap(): string | undefined;
    word_wrap(value: string): this;
    box_shadow(): string | undefined;
    box_shadow(value: string): this;
    drop_shadow(): string | undefined;
    drop_shadow(value: string): this;
    font_size(): string | undefined;
    font_size(value: string | number): this;
    font(): string | undefined;
    font(value: string | number): this;
    font_family(): string | undefined;
    font_family(value: string | number): this;
    font_style(): string | undefined;
    font_style(value: string | number): this;
    font_weight(): string | undefined;
    font_weight(value: string | number): this;
    width(): string | undefined;
    width(value: string | number): this;
    min_width(): string | undefined;
    min_width(value: string | number): this;
    max_width(): string | undefined;
    max_width(value: string | number): this;
    height(): string | undefined;
    height(value: string | number): this;
    min_height(): string | undefined;
    min_height(value: string | number): this;
    max_height(): string | undefined;
    max_height(value: string | number): this;
    margin_top(): string | undefined;
    margin_top(value: string | number): this;
    margin_bottom(): string | undefined;
    margin_bottom(value: string | number): this;
    margin_right(): string | undefined;
    margin_right(value: string | number): this;
    margin_left(): string | undefined;
    margin_left(value: string | number): this;
    padding_top(): string | undefined;
    padding_top(value: string | number): this;
    padding_bottom(): string | undefined;
    padding_bottom(value: string | number): this;
    padding_right(): string | undefined;
    padding_right(value: string | number): this;
    padding_left(): string | undefined;
    padding_left(value: string | number): this;
    border_width(): string | undefined;
    border_width(value: string | number): this;
    align_items(): string | undefined;
    align_items(value: string): this;
    align_content(): string | undefined;
    align_content(value: string): this;
    background_size(): string | undefined;
    background_size(value: string): this;
    box_sizing(): string | undefined;
    box_sizing(value: string): this;
    flex(): string | undefined;
    flex(value: string): this;
    flex_grow(): string | undefined;
    flex_grow(value: string): this;
    flex_shrink(): string | undefined;
    flex_shrink(value: string): this;
    justify_content(): string | undefined;
    justify_content(value: string): this;
    mask(): string | undefined;
    mask(value: string): this;
    user_select(): string | undefined;
    user_select(value: string): this;
    styles(styles: Record<string, string>): this;
    attrs(attrs: Record<string, string>): this;
    events(events: Record<string, (event: Event) => void>): this;
    add_class(name: string): this;
    remove_class(name: string): this;
    append(...children: (Element | any[] | Function | none)[]): this;
    inner_html(): string | null;
    inner_html(value: string): this;
    center(): this;
    padding(): string;
    padding(value: string | number): this;
    padding(top_bottom: string | number, left_right: string | number): this;
    padding(top: string | number, right: string | number, bottom: string | number, left: string | number): this;
    margin(): string | undefined;
    margin(value: string | number): this;
    margin(value: none | string | number, value2: none | string | number): this;
    margin(value: none | string | number, value2: none | string | number, value3: none | string | number, value4: none | string | number): this;
    fixed_width(): string | undefined;
    fixed_width(value: string | number): this;
    fixed_height(): string | undefined;
    fixed_height(value: string | number): this;
    frame(width: string | number | undefined, height: string | number | undefined): this;
    min_frame(width: string | number | undefined, height: string | number | undefined): this;
    max_frame(width: string | number | undefined, height: string | number | undefined): this;
    fixed_frame(width: string | number | undefined, height: string | number | undefined): this;
    color(): string | undefined;
    color(value: string): this;
    border(): string | undefined;
    border(a: string): this;
    border(a: string | number, b: string | number): this;
    border(a: string | number, b: string | number, c: string | number): this;
    border_radius(): string | undefined;
    border_radius(value: string | number): this;
    background(): string | undefined;
    background(value: string): this;
    ellipsis_overflow(): boolean | undefined;
    ellipsis_overflow(to: boolean): this;
    on_click(): ((e: this, t: Event) => void) | undefined;
    on_click(callback: (e: this, t: Event) => void): this;
    lang(): string | undefined;
    lang(value: string): this;
    charset(): string | undefined;
    charset(value: string): this;
    viewport(): string | undefined;
    viewport(value: string): this;
    title(): string | undefined;
    title(value: string): this;
}
export declare class TitleElement extends Element {
    constructor(text?: string);
}
export declare const Title: <Extensions extends object = {}>(text?: string | undefined) => TitleElement & Extensions;
export declare const NullTitle: <Extensions extends object = {}>() => TitleElement & Extensions;
export declare class SubtitleElement extends Element {
    constructor(text?: string);
}
export declare const Subtitle: <Extensions extends object = {}>(text?: string | undefined) => SubtitleElement & Extensions;
export declare const NullSubtitle: <Extensions extends object = {}>() => SubtitleElement & Extensions;
export declare class TextElement extends Element {
    constructor(text?: string);
}
export declare const Text: <Extensions extends object = {}>(text?: string | undefined) => TextElement & Extensions;
export declare const NullText: <Extensions extends object = {}>() => TextElement & Extensions;
export declare class ImageElement extends Element {
    constructor(src?: string);
}
export declare const Image: <Extensions extends object = {}>(src?: string | undefined) => ImageElement & Extensions;
export declare const NullImageElement: <Extensions extends object = {}>() => ImageElement & Extensions;
export declare class ImageMaskElement extends Element {
    mask_child: VStackElement;
    _src?: string;
    constructor(src?: string);
    mask_color(): string | undefined;
    mask_color(value: string): this;
    src(): string | undefined;
    src(value: string): this;
    mask(): string | undefined;
    mask(value: string): this;
}
export declare const ImageMask: <Extensions extends object = {}>(src?: string | undefined) => ImageMaskElement & Extensions;
export declare const NullImageMaskElement: <Extensions extends object = {}>() => ImageMaskElement & Extensions;
export declare class VStackElement extends Element {
    constructor(...children: any[]);
}
export declare const VStack: <Extensions extends object = {}>(...args: any[]) => VStackElement & Extensions;
export declare const NullVStackElement: <Extensions extends object = {}>() => VStackElement & Extensions;
export declare class DividerElement extends Element {
    constructor(text?: string);
}
export declare const Divider: <Extensions extends object = {}>(text?: string | undefined) => DividerElement & Extensions;
export declare const NullDividerElement: <Extensions extends object = {}>() => DividerElement & Extensions;
export declare class TableDataElement extends Element {
    constructor(...children: any[]);
    center(): this;
    center_vertical(): this;
    leading_vertical(): this;
    trailing_vertical(): this;
}
export declare const TableData: <Extensions extends object = {}>(...args: any[]) => TableDataElement & Extensions;
export declare const NullTableDataElement: <Extensions extends object = {}>() => TableDataElement & Extensions;
export declare class TableRowElement extends Element {
    private current_cell;
    private _wrap;
    constructor(...children: any[]);
    append(...children: any[]): this;
    wrap(): boolean;
    wrap(value: boolean): this;
    center(): this;
    center_vertical(): this;
    leading_vertical(): this;
    trailing_vertical(): this;
}
export declare const TableRow: <Extensions extends object = {}>(...args: any[]) => TableRowElement & Extensions;
export declare const NullTableRowElement: <Extensions extends object = {}>() => TableRowElement & Extensions;
export declare class TableElement extends Element {
    current_cell?: TableDataElement;
    current_row: TableRowElement;
    constructor(...children: any[]);
    row(...children: any[]): this;
    append(...children: any[]): this;
}
export declare const Table: <Extensions extends object = {}>(...args: any[]) => TableElement & Extensions;
export declare const NullTableElement: <Extensions extends object = {}>() => TableElement & Extensions;
export declare class CSSElement extends Element {
    constructor(style?: string);
}
export declare const CSS: <Extensions extends object = {}>(style?: string | undefined) => CSSElement & Extensions;
export declare const NullCSSElement: <Extensions extends object = {}>() => CSSElement & Extensions;
export declare class MailElement extends Element {
    private _subject?;
    constructor(...children: any[]);
    subject(): string | undefined;
    subject(subj: string): this;
}
export declare const Mail: <Extensions extends object = {}>(...args: any[]) => MailElement & Extensions;
export declare const NullMailElement: <Extensions extends object = {}>() => MailElement & Extensions;
