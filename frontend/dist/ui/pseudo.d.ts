import { VElement, VElementTagMap, AppendType } from "../elements/module.js";
export declare class PseudoElement extends VElementTagMap.div {
    added_to_elements: {
        node: VElement;
        type: string;
    }[];
    constructor(...children: AppendType[]);
    update(): this;
}
export declare const Pseudo: <Extensions extends object = {}>(...args: AppendType[]) => PseudoElement & Extensions;
export declare const NullPseudo: <Extensions extends object = {}>() => PseudoElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        PseudoElement: PseudoElement;
    }
}
