/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
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
