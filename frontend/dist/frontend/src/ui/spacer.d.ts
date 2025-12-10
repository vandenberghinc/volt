/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
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
