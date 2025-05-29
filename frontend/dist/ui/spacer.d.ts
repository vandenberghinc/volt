import { VElementTagMap } from "../elements/module.js";
export declare class SpacerElement extends VElementTagMap.div {
    constructor();
}
export declare const Spacer: <Extensions extends object = {}>() => SpacerElement & Extensions;
export declare const NullSpacer: <Extensions extends object = {}>() => SpacerElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        SpacerElement: SpacerElement;
    }
}
