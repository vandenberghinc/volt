/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
import { VElementTagMap, AppendType } from "../elements/module.js";
import { AnyElement } from "./any_element.js";
export declare class PseudoElement extends VElementTagMap.div {
    /**
     * The pseudo id used for creating a css class.
     * @note This id should be suffixed with the pseudo class type, e.g. `pseudo_1234_before`.
     */
    base_pseudo_id: string;
    /** The stylesheet per `before` `after` etc. */
    pseudo_classes: Record<string, HTMLStyleElement>;
    /** A list of elements this pseudo element is applied to */
    added_to_elements: {
        node: AnyElement;
        type: string;
    }[];
    constructor(...children: AppendType[]);
    /** Retrieve a pseudo id suffixed with a specific type. */
    pseudo_id(type: string): string;
    /** Apply the pseudo to a node for a specific psuedo class. */
    apply(node: AnyElement, type: string): this;
    /** Alias method for {@link apply}. */
    add(node: AnyElement, type: string): this;
    /** Remove the pseudo effect from a node if applied. */
    remove_from(node: AnyElement, type: string): this;
    /** Remove all pseudo effects from a given node. */
    remove_all(node: AnyElement): this;
    /** Is added to. */
    is_applied_to(node: AnyElement, type: string): boolean;
    /** Alias method for {@link is_applied_to}. */
    is_added_to(node: AnyElement, type: string): boolean;
    /** Update the pseudo on all applied elements. */
    update(): this;
}
export declare const Pseudo: <Extensions extends object = {}>(...args: AppendType[]) => PseudoElement & Extensions;
export declare const NullPseudo: <Extensions extends object = {}>() => PseudoElement & Extensions;
declare module './any_element.d.ts' {
    interface AnyElementMap {
        PseudoElement: PseudoElement;
    }
}
