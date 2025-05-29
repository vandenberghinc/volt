/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Elements, VElementBaseSignature, VElement } from "../elements/module.js"
import { Button } from "./button"
import { VStackElement, VStack } from "./stack"

// Context Menu.
@Elements.create({
    name: "ContextMenuElement",
})
export class ContextMenuElement extends (VStackElement as any as VElementBaseSignature) {

	// Attributes.
	public remove_child_callback: any;

	// Constructor.
	// The content may either be an array with nodes, or an array with object like {label: ..., on_click: (element, event) => {}, on_render: (element) => {}}.
	// A node / object may also be "null" and it will be ignored.
	constructor(content: {
		label: string,
		on_click?: Function,
		on_render?: Function,
	}[] | HTMLElement[]) {
		
		// Initialize base classes.
		super();
        this._init({
			derived: ContextMenuElement,
		})

        // Append content.
        content.iterate((item) => {
        	if (item == null) {
        		return null;
        	}
        	else if (!(item instanceof HTMLElement)) {
        		const button = Button(item.label)
	                .padding(5, 10, 5, 10)
	                .margin(0)
	                .font_size(12)
	                .leading()
	                .background("#FFFFFF15")
	                .border_radius(0)
	            if (typeof item.on_click === "function") {
	                button.on_click((element, event) => (item.on_click as Function)(element, event, this));
	            }
	            if (typeof item.on_render === "function") {
	                button.on_render((element) => (item.on_render as Function)(element));
	            }
        		this.append(button);
        	} else {
        		this.append(item);
        	}
        })

		// Set styling
		this
	        .z_index(2) // one higher than sidebar.
	        .padding(5, 0, 5, 0)
	        .color("white")
	        .background("gray")
	        .box_shadow("0px 0px 10px #00000050")
	        .border_radius(10)
	        .min_width(150)

	    // Remove child callback.
	    this.remove_child_callback = (event) => {
	    	if (!this.contains(event.target)) {
                this.remove();
            }
            document.body.removeEventListener("mousedown", this.remove_child_callback);
	    }
	}

	// Set default since it inherits an element.
	// set_default() : this {
	// 	return super.set_default(ContextMenuElement);
	// }

	// Popup the context menu by a event.
	popup(event) : this {

		// Prevent default.
		event.preventDefault();

		// Show.
		super.show();

		// Set position.
		this.position(event.clientY, undefined, undefined, event.clientX)

		// Add child.
        document.body.appendChild(this as any);

        // Add event listener to body.
        document.body.addEventListener("mousedown", this.remove_child_callback);

        // Response.
        return this;
	}

	// Close the context menu.
	close() : this {

		// Remove from content.
		super.remove();

		// Remove event listener from body.
        document.body.removeEventListener("mousedown", this.remove_child_callback);

        // Response.
        return this;
	}
	// @ts-ignore
	remove() : this {

		// Remove from content.
		super.remove();

		// Remove event listener from body.
        document.body.removeEventListener("mousedown", this.remove_child_callback);

        // Response.
        return this;
	}		
}
export const ContextMenu = Elements.wrapper(ContextMenuElement);
export const NullContextMenu = Elements.create_null(ContextMenuElement);
declare module './any_element.d.ts' { interface AnyElementMap { ContextMenuElement: ContextMenuElement }}

// Extend.
declare global {
    interface VElementExtensions {
        _context_menu: ContextMenuElement | undefined;
        on_context_menu(): Function | undefined;
        on_context_menu(callback?: Function | ContextMenuElement | any[]): this;
    }
}
Elements.extend({
	_context_menu: undefined as any,

	/**
	 * @docs:
	 * @parent: VElement
	 * @title: On Context Menu
	 * @desc: 
	 *     Script to be run when a context menu is triggered. This function can set or get the context menu callback.
	 * @param:
	 *     @name: callback
	 *     @descr: 
	 *         The parameter may either be a callback function, a ContextMenu object, or an Array as the ContextMenu parameter.
	 * @return:
	 *     @description Returns the `VElement` object. If `callback` is `null`, then the attribute's value is returned.
	 * @funcs: 2
	 */
	on_context_menu(this, callback) {
		if (callback == null) {
			if (this._context_menu !== undefined) {
				return this._context_menu;
			} else {
				return this.oncontextmenu ?? undefined;
			}
		}
        if (callback instanceof ContextMenuElement || (callback as any).element_name === "ContextMenuElement") {
			this._context_menu = callback as ContextMenuElement;
			const _this_ = this;
			this.oncontextmenu = (event) => {
				if (this._context_menu instanceof ContextMenuElement) {
					this._context_menu.popup(event);
				}
			};
		} else if (Array.isArray(callback)) {
			this._context_menu = ContextMenu(callback);
			const _this_ = this;
			this.oncontextmenu = (event) => {
				if (this._context_menu instanceof ContextMenuElement) {
					this._context_menu.popup(event);
				}
			};
		} else {
			const _this_ = this;
			this.oncontextmenu = (event) => callback(_this_, event);
		}
		return this;
	},
})

// @test
// new VStackElement().on_context_menu();
// VStack().on_context_menu();
// VStack().on_context_menu_UNKNOWN();

