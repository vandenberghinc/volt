/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Elements, VElementBaseSignature, VElement, VElementTagMap } from "../elements/module.js"
import { Utils } from "../modules/utils.js"
import { Google } from "../modules/google"

// GoogleMap.
@Elements.create({
    name: "GoogleMapElement",
    default_style: {
        "border": "0",
    },
    default_attributes: {
        "width": "100%",
        "height": "100%",
        "frameborder": "0",
        "style": "border:0",
        "referrerpolicy": "no-referrer-when-downgrade",
        "allowfullscreen": "true",
    },
})
export class GoogleMapElement extends VElementTagMap.iframe {

	
	// Constructor.
	constructor({
		location,
		mode = "place",
		api_key,
	}: {
		location: string,
		mode: string,
		api_key?: string,
	}) {
		
		// Initialize base class.
		super({
			derived: GoogleMapElement,
		});
		
		// Set source.
		this.src("https://www.google.com/maps/embed/v1/" + mode + "?key=" + (api_key ?? Google.cloud.api_key) + "&" + Utils.url_encode({"q": location.replaceAll(' ', '+')}));
	}
	
	// Update.
	// Needs to be called after initialing or changing the loader.
	update() : this {
		this.remove_children();
		const children_style = {
			"width": "calc(" + this.style.width + " * (64.0px / 80.0px))",
			"height": "calc(" + this.style.height + " * (64.0px / 80.0px))",
			"margin": "calc(" + this.style.width + " * (8.0px / 80.0px))",
			"border": "calc(" + this.style.width + " * (8.0px / 80.0px)) solid " + this.style.background,
			"border-color": this.style.background + " transparent transparent transparent",
		}
		for (let i = 0; i < 4; i++) {
			let e = document.createElement("div");
			for (let attr in children_style) {
				e.style[attr] = children_style[attr];
			}
			this.append(e);
		}
		return this;
	}		
}
export const GoogleMap = Elements.wrapper(GoogleMapElement);
export const NullGoogleMap = Elements.create_null(GoogleMapElement);
declare module './any_element.d.ts' { interface AnyElementMap { GoogleMapElement: GoogleMapElement }}