import { VElementTagMap } from "../elements/module.js";
export declare class DividerElement extends VElementTagMap.div {
    constructor();
}
export declare const Divider: <Extensions extends object = {}>() => DividerElement & Extensions;
export declare const NullDivider: <Extensions extends object = {}>() => DividerElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        DividerElement: DividerElement;
    }
}
