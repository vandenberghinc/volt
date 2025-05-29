import { VElementBaseSignature } from "../elements/module.js";
import { VStackElement, HStackElement } from "./stack";
import { TextElement } from "./text";
import { DividerElement } from "./divider";
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
export interface TabContentItem {
    title: string;
    content: any;
}
type OnTabHeader = ((name: string, header: HStackElement, tab: TabsElement) => any);
declare const TabsElement_base: VElementBaseSignature;
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
    constructor({ content, animate, duration, }: {
        content: TabContentItem[] | Record<string, any>;
        animate?: boolean;
        duration?: number;
    });
    set_default(): this;
    styles(): Record<string, string>;
    styles(style_dict: Record<string, any>): this;
    build(content?: TabContentItem[] | Record<string, any>): this | undefined;
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
