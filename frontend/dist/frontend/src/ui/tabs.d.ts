import { VElementBaseSignature } from "../elements/module.js";
import { VStackElement, HStackElement } from "./stack";
import { TextElement } from "./text";
import { DividerElement } from "./divider";
/**
 * The header tab element interface used inside `TabsElement`. Extends `HStackElement` and exposes selection state and handlers for tab header items.
 */
export interface TabElement extends HStackElement {
    _header_title: TextElement;
    _header_div: VStackElement;
    _on_select?: ((TabElement: any) => any);
    _on_unselect?: ((TabElement: any) => any);
    on_select(): undefined | ((TabElement: any) => any);
    on_select(callback: ((TabElement: any) => any)): this;
    on_unselect(): undefined | ((TabElement: any) => any);
    on_unselect(callback: ((TabElement: any) => any)): this;
    select(): this;
    unselect(): this;
    is_selected(): boolean;
}
/**
 * Describes a single tab: its display title and the content node shown when the tab is selected.
 */
export interface TabContentItem {
    title: string;
    content: any;
}
type OnTabHeader = ((name: string, header: HStackElement, tab: TabsElement) => any);
declare const TabsElement_base: VElementBaseSignature;
/**
 * Create a tabs element with content that will be presented when the tab is selected.
 * @nav Frontend/Elements
 * @param content The tab contents.
 * @param content.title The tab title.
 * @param content.content The volt node to be presented when the tab is selected.
 * @param content.on_header A callback that can be set to edit the tab's header title node. The callback takes the arguments local header node and parent tabs node as `(header_node, tabs_node)`.
 * @docs
 */
export declare class TabsElement extends TabsElement_base {
    _tint: string;
    _tab_opac: number;
    _div_bg: string;
    _div_opac: number;
    _selected_node: any;
    _tab_nodes: (HStackElement & TabElement)[];
    _on_tab_header?: OnTabHeader;
    _div?: DividerElement;
    protected _animate: boolean;
    protected _duration: number;
    /**
     * Create a new `TabsElement`.
     * @param content The tab contents or an object map of title->content.
     * @param animate Enable animated show/hide transitions for tab content.
     * @param duration Transition duration in milliseconds.
     */
    constructor({ content, animate, duration, }: {
        content: TabContentItem[] | Record<string, any>;
        animate?: boolean;
        duration?: number;
    });
    /**
     * Set the default style for this element (inherits defaults from `VStackElement`).
     */
    set_default(): this;
    /**
     * Get or set the element's styles. When setting, merges provided styles and updates CSS custom properties used by tabs.
     * @param style_dict Optional style dictionary to set.
     */
    styles(): Record<string, string>;
    styles(style_dict: Record<string, any>): this;
    /**
     * Build the tab's content. This function is called automatically from the constructor.
     * @docs
     */
    build(content?: TabContentItem[] | Record<string, any>): this | undefined;
    /**
     * Selected
     *
     * Get the selected tab title, returns `null` when no tab has been selected.
     * @docs
     */
    selected(): string | null;
    select(): string | null;
    select(tab: string): this;
    tint(): string;
    tint(value: string): any;
    tab_opacity(): number;
    tab_opacity(value: number | boolean): this;
    divider_background(): string;
    divider_background(value: string): any;
    divider_opacity(): number;
    divider_opacity(value: number): this;
    on_tab_header(): OnTabHeader | undefined;
    on_tab_header(callback: OnTabHeader): any;
}
export declare const Tabs: <Extensions extends object = {}>(args_0: {
    content: TabContentItem[] | Record<string, any>;
    animate?: boolean;
    duration?: number;
}) => TabsElement & Extensions;
export declare const NullTabs: <Extensions extends object = {}>() => TabsElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        TabsElement: TabsElement;
    }
}
export {};
