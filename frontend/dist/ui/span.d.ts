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
