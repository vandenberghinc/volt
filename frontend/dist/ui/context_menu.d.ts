import { VElementBaseSignature } from "../elements/module.js";
declare const ContextMenuElement_base: VElementBaseSignature;
export declare class ContextMenuElement extends ContextMenuElement_base {
    remove_child_callback: any;
    constructor(content: {
        label: string;
        on_click?: Function;
        on_render?: Function;
    }[] | HTMLElement[]);
    popup(event: any): this;
    close(): this;
    remove(): this;
}
export declare const ContextMenu: <Extensions extends object = {}>(content: {
    label: string;
    on_click?: Function;
    on_render?: Function;
}[] | HTMLElement[]) => ContextMenuElement & Extensions;
export declare const NullContextMenu: <Extensions extends object = {}>() => ContextMenuElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        ContextMenuElement: ContextMenuElement;
    }
}
declare global {
    interface VElementExtensions {
        _context_menu: ContextMenuElement | undefined;
        on_context_menu(): Function | undefined;
        on_context_menu(callback?: Function | ContextMenuElement | any[]): this;
    }
}
export {};
