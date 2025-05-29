import { VElementBaseSignature } from "../elements/module.js";
declare const StyleElement_base: VElementBaseSignature;
export declare class StyleElement extends StyleElement_base {
    constructor(style?: CSSStyleDeclaration);
}
export declare const Style: <Extensions extends object = {}>(style?: CSSStyleDeclaration | undefined) => StyleElement & Extensions;
export declare const NullStyle: <Extensions extends object = {}>() => StyleElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        StyleElement: StyleElement;
    }
}
export {};
