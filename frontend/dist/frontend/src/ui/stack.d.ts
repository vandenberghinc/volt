import { VElementTagMap, AppendType } from "../elements/module.js";
export declare class FrameElement extends VElementTagMap.div {
    constructor(...children: AppendType[]);
}
export declare const Frame: <Extensions extends object = {}>(...args: AppendType[]) => FrameElement & Extensions;
export declare const NullFrame: <Extensions extends object = {}>() => FrameElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        FrameElement: FrameElement;
    }
}
export declare class VStackElement extends VElementTagMap.div {
    constructor(...children: AppendType[]);
}
export declare const VStack: <Extensions extends object = {}>(...args: AppendType[]) => VStackElement & Extensions;
export declare const NullVStack: <Extensions extends object = {}>() => VStackElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        VStackElement: VStackElement;
    }
}
export declare class AnchorVStackElement extends VElementTagMap.a {
    constructor(...children: AppendType[]);
}
export declare const AnchorVStack: <Extensions extends object = {}>(...args: AppendType[]) => AnchorVStackElement & Extensions;
export declare const NullAnchorVStack: <Extensions extends object = {}>() => AnchorVStackElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        AnchorVStackElement: AnchorVStackElement;
    }
}
export declare class HStackElement extends VElementTagMap.div {
    constructor(...children: AppendType[]);
}
export declare const HStack: <Extensions extends object = {}>(...args: AppendType[]) => HStackElement & Extensions;
export declare const NullHStack: <Extensions extends object = {}>() => HStackElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        HStackElement: HStackElement;
    }
}
export declare class AnchorHStackElement extends VElementTagMap.a {
    constructor(...children: AppendType[]);
}
export declare const AnchorHStack: <Extensions extends object = {}>(...args: AppendType[]) => AnchorHStackElement & Extensions;
export declare const NullAnchorHStack: <Extensions extends object = {}>() => AnchorHStackElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        AnchorHStackElement: AnchorHStackElement;
    }
}
export declare class ZStackElement extends VElementTagMap.div {
    constructor(...children: AppendType[]);
    append(...children: AppendType[]): this;
}
export declare const ZStack: <Extensions extends object = {}>(...args: AppendType[]) => ZStackElement & Extensions;
export declare const NullZStack: <Extensions extends object = {}>() => ZStackElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        ZStackElement: ZStackElement;
    }
}
