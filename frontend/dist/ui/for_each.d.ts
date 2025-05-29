import { VElementTagMap } from "../elements/module.js";
type ArrayCallback = ((item: any, index: number, is_last: boolean) => any);
type ArrayCallback1 = ((item: any, index: number) => any);
type ArrayCallback2 = ((item: any) => any);
type ObjectCallback = ((value: any, key: string, index: number, is_last: boolean) => any);
type ObjectCallback1 = ((value: any, key: string, index: number) => any);
type ObjectCallback2 = ((value: any, key: string) => any);
type ObjectCallback3 = ((value: any) => any);
export declare class ForEachElement extends VElementTagMap.section {
    constructor(items: Array<any>, func: ArrayCallback);
    constructor(items: Array<any>, func: ArrayCallback1);
    constructor(items: Array<any>, func: ArrayCallback2);
    constructor(items: Record<string, any>, func: ObjectCallback);
    constructor(items: Record<string, any>, func: ObjectCallback1);
    constructor(items: Record<string, any>, func: ObjectCallback2);
    constructor(items: Record<string, any>, func: ObjectCallback3);
}
export declare const ForEach: {
    (items: Array<any>, func: ArrayCallback): ArrayCallback;
    (items: Array<any>, func: ArrayCallback): ArrayCallback1;
    (items: Array<any>, func: ArrayCallback): ArrayCallback2;
    (items: Record<string, any>, func: ObjectCallback): ObjectCallback;
    (items: Record<string, any>, func: ObjectCallback): ObjectCallback1;
    (items: Record<string, any>, func: ObjectCallback): ObjectCallback2;
    (items: Record<string, any>, func: ObjectCallback): ObjectCallback3;
};
export declare const NullForEach: <Extensions extends object = {}>() => ForEachElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        ForEachElement: ForEachElement;
    }
}
export {};
