import { VStackElement, HStackElement } from "./stack";
export declare class TabsElement extends VStackElement {
    static default_style: Record<string, any>;
    _tint: string;
    _tab_opac: number;
    _div_bg: string;
    _div_opac: number;
    _selected_node: any;
    _tab_nodes: any[];
    _on_tab_header?: ((name: string, header: HStackElement, tab: TabsElement) => void);
    constructor({ content, animate, duration, }: {
        content: {
            title: string;
            content: any;
        }[];
        animate: boolean;
        duration: number;
    });
    set_default(): this;
    styles(): Record<string, string>;
    styles(style_dict: Record<string, any>): this;
    build(content?: {
        title: string;
        content: any;
    }[]): this | undefined;
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
    on_tab_header(): ((name: string, header: HStackElement, tab: TabsElement) => void) | undefined;
    on_tab_header(callback: ((name: string, header: HStackElement, tab: TabsElement) => void)): any;
}
export declare const Tabs: (...args: any[]) => any;
