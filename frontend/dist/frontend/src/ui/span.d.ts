/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
import { VElementTagMap } from "../elements/module.js";
export declare class SpanElement extends VElementTagMap.span {
    constructor(text?: string);
}
export declare const Span: <Extensions extends object = {}>(text?: string | undefined) => SpanElement & Extensions;
export declare const NullSpan: <Extensions extends object = {}>() => SpanElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        SpanElement: SpanElement;
    }
}
