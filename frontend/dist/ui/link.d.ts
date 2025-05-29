import { VElementTagMap } from "../elements/module.js";
export declare class AnchorElement extends VElementTagMap.a {
    constructor(text?: string, href?: string, alt?: string);
}
export declare const Anchor: <Extensions extends object = {}>(text?: string | undefined, href?: string | undefined, alt?: string | undefined) => AnchorElement & Extensions;
export declare const NullAnchor: <Extensions extends object = {}>() => AnchorElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        AnchorElement: AnchorElement;
    }
}
export declare class LinkElement extends VElementTagMap.a {
    constructor(text?: string, href?: string);
}
export declare const Link: <Extensions extends object = {}>(text?: string | undefined, href?: string | undefined) => LinkElement & Extensions;
export declare const NullLink: <Extensions extends object = {}>() => LinkElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        LinkElement: LinkElement;
    }
}
