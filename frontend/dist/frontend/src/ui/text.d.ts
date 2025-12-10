/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
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
