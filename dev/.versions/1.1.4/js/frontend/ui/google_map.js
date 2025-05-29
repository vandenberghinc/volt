/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// GoogleMap.
@constructor_wrapper
@register_element
class GoogleMapElement extends CreateVElementClass({
	type: "GoogleMap",
	tag: "iframe",
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
}) {
	
	// Constructor.
	constructor(location, mode = "place") {
		
		// Initialize base class.
		super();
		
		// Set source.
		this.src("https://www.google.com/maps/embed/v1/" + mode + "?key=" + google_cloud_api_key + "&" + vweb.utils.url_encode({"q": location.replaceAll(' ', '+')}));
		
	}
	
	// Update.
	// Needs to be called after initialing or changing the loader.
	update() {
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
	}
		
}
