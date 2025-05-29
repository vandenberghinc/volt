import { VElementTagMap, AppendType } from "../elements/module.js";
export declare class ViewElement extends VElementTagMap.div {
    constructor(...children: AppendType[]);
}
export declare const View: <Extensions extends object = {}>(...args: AppendType[]) => ViewElement & Extensions;
export declare const NullView: <Extensions extends object = {}>() => ViewElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        ViewElement: ViewElement;
    }
}
