/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Elements, VElementBaseSignature, VElement, VElementTagMap, VHTMLElement } from "../elements/module.js";

// Button.
@Elements.create({
    name: "ButtonElement",
    default_style: {
        "margin": "0px 0px 0px",
        "padding": "5px 10px 5px 10px",
        "outline": "none",
        "border": "none",
        "border-radius": "10px",
        "cursor": "pointer",
        "color": "inherit",
        "text-align": "center",
        "display": "grid",
        "align-items": "center",
        "white-space": "nowrap",
        "user-select": "none",
        "text-decoration": "none",
    },
    default_events: {
        "onmousedown": function (this: any): void {
            this.style.filter = "brightness(80%)";
        },
        "onmouseover": function (this: any): void {
            this.style.filter = "brightness(90%)";
        },
        "onmouseup": function (this: any): void {
            this.style.filter = "brightness(100%)";
        },
        "onmouseout": function (this: any): void {
            this.style.filter = "brightness(100%)";
        },
    },
})
export class ButtonElement extends VElementTagMap.a {

	/**
	 * @docs:
	 * @nav: Frontend
	 * @chapter: Buttons
	 * @title: Button
	 * @desc: Initializes the Button element with the provided text.
	 * @param:
	 *     @name: text
	 *     @description The text to display on the button.
	 */
	constructor(text: string = "") {
		super({
			derived: ButtonElement,
		});
		this.text(text); // @note never assign to innerHTML, always use text()
	}
}
export const Button = Elements.wrapper(ButtonElement);
export const NullButton = Elements.create_null(ButtonElement);
declare module './any_element.d.ts' { interface AnyElementMap { ButtonElement: ButtonElement }}