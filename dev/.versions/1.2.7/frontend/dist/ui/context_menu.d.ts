import { VStackElement } from "./stack";
export declare class ContextMenuElement extends VStackElement {
    remove_child_callback: any;
    constructor(content: {
        label: string;
        on_click?: Function;
        on_render?: Function;
    }[] | HTMLElement[]);
    set_default(): this;
    popup(event: any): this;
    close(): this;
    remove(): this;
}
export declare const ContextMenu: (...args: any[]) => any;
