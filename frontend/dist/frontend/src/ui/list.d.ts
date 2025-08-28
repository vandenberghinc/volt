import { VElementTagMap } from "../elements/module.js";
export declare class ListItemElement extends VElementTagMap.li {
    constructor(...content: any[]);
}
export declare const ListItem: <Extensions extends object = {}>(...args: any[]) => ListItemElement & Extensions;
export declare const NullListItem: <Extensions extends object = {}>() => ListItemElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        ListItemElement: ListItemElement;
    }
}
export declare class UnorderedListElement extends VElementTagMap.ul {
    constructor(items?: (ListItemElement | any | any[])[]);
    append_item(content: ListItemElement | any | any[]): this;
}
export declare const UnorderedList: <Extensions extends object = {}>(items?: any[] | undefined) => UnorderedListElement & Extensions;
export declare const NullUnorderedList: <Extensions extends object = {}>() => UnorderedListElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        UnorderedListElement: UnorderedListElement;
    }
}
export declare class OrderedListElement extends VElementTagMap.ol {
    constructor(items?: (ListItemElement | any | any[])[]);
    append_item(content: ListItemElement | any | any[]): this;
}
export declare const OrderedList: <Extensions extends object = {}>(items?: any[] | undefined) => OrderedListElement & Extensions;
export declare const NullOrderedList: <Extensions extends object = {}>() => OrderedListElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        OrderedListElement: OrderedListElement;
    }
}
