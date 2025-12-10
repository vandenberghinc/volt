/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */

import * as vlib from "@vandenberghinc/vlib/frontend"

// Imports.
import { Elements, VElementBaseSignature, VElement, VElementTagMap, AppendType } from "../elements/module.js"
import { AnyElement } from "./any_element.js";

// Divider.
@Elements.create({
    name: "PseudoElement",
})
export class PseudoElement extends VElementTagMap.div {

    /**
     * The pseudo id used for creating a css class.
     * @note This id should be suffixed with the pseudo class type, e.g. `pseudo_1234_before`.
     */
    base_pseudo_id: string = "pseudo_" + vlib.String.random(24);
    
    /** The stylesheet per `before` `after` etc. */
    pseudo_classes: Record<string, HTMLStyleElement> = {};
	
    /** A list of elements this pseudo element is applied to */
    added_to_elements: { node: AnyElement, type: string }[] = [];

    constructor(...children: AppendType[]) {
		super({ derived: PseudoElement, });

		// Append.
		this.append(...children);
	}

    /** Retrieve a pseudo id suffixed with a specific type. */
    pseudo_id(type: string): string {
        return this.base_pseudo_id + "_" + type;
    }

    /** Apply the pseudo to a node for a specific psuedo class. */
    apply(node: AnyElement, type: string): this {
        
        /** Add a node to the {@link added_to_elements} list, if not already added. */
        const already_added = this.added_to_elements.some(i => i.node === node && i.type === type);
        if (!already_added) {
            this.added_to_elements.push({
                node: node,
                type: type,
            });
        }

        /** Add a stylesheet for a given pseudo element class, or update it when already present. */
        const pseudo_id = this.pseudo_id(type);
        const css = `.${pseudo_id}::${type}{${this.style.cssText};}`;
        let style = this.pseudo_classes[type];
        if (style) {
            if (style.sheet) {
                style.sheet.deleteRule(0);
                style.sheet.insertRule(css, 0);
            }
        } else {
            style = document.createElement('style');
            style.type = 'text/css';
            document.head.appendChild(style); // append before insertRule
            if (style.sheet) {
                style.sheet.insertRule(css, 0);
            }
            this.pseudo_classes[type] = style;
        }

        // Add class.
        node.classList.add(pseudo_id);

        // Response.
        return this;
    }

    /** Alias method for {@link apply}. */
    add(node: AnyElement, type: string): this {
        return this.apply(node, type);
    }

    /** Remove the pseudo effect from a node if applied. */
    remove_from(node: AnyElement, type: string,): this {
        node.classList.remove(this.pseudo_id(type));
        return this;
    }

    /** Remove all pseudo effects from a given node. */
    remove_all(node: AnyElement): this {
        node.classList.forEach(name => {
            if (name.startsWith("pseudo_")) {
                node.classList.remove(name);
            }
        })
        return this;
    }

    /** Is added to. */
    is_applied_to(node: AnyElement, type: string): boolean {
        return this.added_to_elements.some(i => i.node === node && i.type === type);
    }

    /** Alias method for {@link is_applied_to}. */
    is_added_to(node: AnyElement, type: string): boolean {
        return this.added_to_elements.some(i => i.node === node && i.type === type);
    }

    /** Update the pseudo on all applied elements. */
    update(): this {
        for (const [type, style] of Object.entries(this.pseudo_classes)) {
            if (style.sheet == null) continue;
            const css = `.${this.pseudo_id}::${type}{${this.style.cssText};}`;
            style.sheet.deleteRule(0);
            style.sheet.insertRule(css, 0);
        }
        return this;
    }
}
export const Pseudo = Elements.wrapper(PseudoElement);
export const NullPseudo = Elements.create_null(PseudoElement);
declare module './any_element.d.ts' { interface AnyElementMap { PseudoElement: PseudoElement }}