/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
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
/** A specific title ensured to use the `h1` html tag. */
export declare class H1Element extends VElementTagMap.h1 {
    constructor(text?: string);
}
export declare const H1: <Extensions extends object = {}>(text?: string | undefined) => H1Element & Extensions;
export declare const NullH1: <Extensions extends object = {}>() => H1Element & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        H1Element: H1Element;
    }
}
/** A specific title ensured to use the `h2` html tag. */
export declare class H2Element extends VElementTagMap.h1 {
    constructor(text?: string);
}
export declare const H2: <Extensions extends object = {}>(text?: string | undefined) => H2Element & Extensions;
export declare const NullH2: <Extensions extends object = {}>() => H2Element & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        H2Element: H2Element;
    }
}
/** A specific title ensured to use the `h3` html tag. */
export declare class H3Element extends VElementTagMap.h1 {
    constructor(text?: string);
}
export declare const H3: <Extensions extends object = {}>(text?: string | undefined) => H3Element & Extensions;
export declare const NullH3: <Extensions extends object = {}>() => H3Element & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        H3Element: H3Element;
    }
}
/** A specific title ensured to use the `h4` html tag. */
export declare class H4Element extends VElementTagMap.h1 {
    constructor(text?: string);
}
export declare const H4: <Extensions extends object = {}>(text?: string | undefined) => H4Element & Extensions;
export declare const NullH4: <Extensions extends object = {}>() => H4Element & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        H4Element: H4Element;
    }
}
/** A specific title ensured to use the `h5` html tag. */
export declare class H5Element extends VElementTagMap.h1 {
    constructor(text?: string);
}
export declare const H5: <Extensions extends object = {}>(text?: string | undefined) => H5Element & Extensions;
export declare const NullH5: <Extensions extends object = {}>() => H5Element & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        H5Element: H5Element;
    }
}
/** A specific title ensured to use the `h6` html tag. */
export declare class H6Element extends VElementTagMap.h1 {
    constructor(text?: string);
}
export declare const H6: <Extensions extends object = {}>(text?: string | undefined) => H6Element & Extensions;
export declare const NullH6: <Extensions extends object = {}>() => H6Element & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        H6Element: H6Element;
    }
}
