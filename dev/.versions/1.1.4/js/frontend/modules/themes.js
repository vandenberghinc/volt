/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Themes module.
vweb.themes = {};
vweb.themes.theme_elements = [];

// The theme should have one of the ids.
// When an element has defined the "on_theme_update()" callback then this will be called after applying the new style.
vweb.themes.set = function(theme_id) {
	vweb.themes.theme_elements.iterate((theme) => {
		if (theme.id === theme_id && theme.is_empty_theme !== true) {
			const e = theme.element;
			Object.keys(theme).iterate((key) => {
				if (key !== "id" && key !== "element") {
					if (e[key] === undefined) {
						console.error(`"${key}()" is not a valid function of type "${e.element_type}"`);
						return null;
					}
					if (Array.isArray(theme[key])) {
						e[key](...theme[key]);
					} else {
						e[key](theme[key]);
					}
				}
			})
			if (e.element_type === "RingLoader") {
				e.update(e);
			}
			if (Array.isArray(e._on_theme_updates)) {
				e._on_theme_updates.iterate((func) => func(e, theme.id));
			}
		}
	})
}

// Call the on theme update callbacks on all elements that have it defined.
vweb.themes.apply_theme_update = function() {
	vweb.themes.theme_elements.iterate((theme) => {
		const e = theme.element;
		if (e !== undefined && Array.isArray(e._on_theme_updates)) {
			e._on_theme_updates.iterate((func) => func(e, theme.id));
		}
	})
}