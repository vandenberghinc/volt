import { VElementTagMap } from "../elements/module.js";
export declare class TextElement extends VElementTagMap.p {
    constructor(text?: string);
}
export declare const Text: <Extensions extends object = {}>(text?: string | undefined) => TextElement & Extensions;
export declare const NullText: <Extensions extends object = {}>() => TextElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        TextElement: TextElement;
    }
}
