import { VElementTagMap } from "../elements/module.js";
export declare class TitleElement extends VElementTagMap.h1 {
    constructor(text?: string);
}
export declare const Title: <Extensions extends object = {}>(text?: string | undefined) => TitleElement & Extensions;
export declare const NullTitle: <Extensions extends object = {}>() => TitleElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        TitleElement: TitleElement;
    }
}
export declare class SubtitleElement extends VElementTagMap.h1 {
    constructor(text?: string);
}
export declare const Subtitle: <Extensions extends object = {}>(text?: string | undefined) => SubtitleElement & Extensions;
export declare const NullSubtitle: <Extensions extends object = {}>() => SubtitleElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        SubtitleElement: SubtitleElement;
    }
}
