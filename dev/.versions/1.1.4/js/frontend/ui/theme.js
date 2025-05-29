/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Themes class.
/* 	@docs:
	@nav: Frontend
    @chapter: Themes
    @note: The `ThemesClass` is also initializable under function `Themes`.
	@desc:
		A themes class to efficiently style the site using themes.

		The constructor arguments must be a theme style per theme name. Every theme variable should exist in all themes or it may cause undefined behaviour. The theme name that is passed first will be the active theme by default.
		```
		Theme("main-theme", {
			light: {
				text_fg: "#000000",
			},
			dark: {
				text_fg: "#FFFFFF",
			},
		})
		```

		When theme attributes are retrieved, by default they will be the active theme's attribute as a css variable. So this can be passed to an element.
		However, some element functions do not accept css variables, in this case the `value()` function can be used to retrieve the raw value. Do not forget to apply an `on_theme_update()` callback on the elements where you use this.
 */
@constructor_wrapper(suffix="Class")
class ThemesClass {
	constructor(
		id,
		themes = {},
	) {

		// Attributes.
		this.active_id = null;
		this.active = null;
		this._themes = [];
		this._theme_ids = [];
		this._attrs = [];
		this._css_vars = {};
		this._id = id;

		// Assign themes.
		Object.keys(themes).iterate((theme) => {

			// Initialize.
			const theme_style = themes[theme];
			this._themes.append(theme);
			this._theme_ids.append(theme);
			this[theme] = theme_style;

			// Activate first theme.
			if (this.active_id === null) {
				this.active_id = theme;
				this.active = theme_style;
				Object.keys(this.active).iterate((id) => {
					document.documentElement.style.setProperty(`--${this._id}_${id}`, this.active[id]);
				});
			}

			// Initialize attr funcs.
			Object.keys(theme_style).iterate((id) => {
				this._add_attr(id, theme);
			})
		})
	}

	// Add a new attribute.
	_add_attr(id, theme) {
		if (theme == null) {
			this._css_vars[id] = `var(--${this._id}_${id})`;
		} else {
			const theme_style = this[theme];
			if (
				typeof theme_style[id] === "string" &&
				(
					theme_style[id].indexOf("linear-gradient") !== -1 ||
					theme_style[id].indexOf("radial-gradient") !== -1
				)
			) {
				theme_style[id] = new String(theme_style[id]);
				theme_style[id]._is_gradient = true;
				this._css_vars[id] = new String(`var(--${this._id}_${id})`);
				this._css_vars[id]._is_gradient = true;
			} else {
				this._css_vars[id] = `var(--${this._id}_${id})`;
			}
		}
		Object.defineProperty(this, id, {
			get: function() {
				return this._css_vars[id];
			},
			enumerable: true,
			configurable: true,
		});
		this._attrs.append(id);
	}

	// Assign a new value.
	set(theme, key, value) {

		// Update theme.
		const theme_style = this[theme];
		if (typeof value === "string" && (value.indexOf("linear-gradient") !== -1 || value.indexOf("radial-gradient") !== -1)) {
			theme_style[key] = new String(value);
			theme_style[key]._is_gradient = true;
			this._css_vars[key] = new String(`var(--${this._id}_${key})`);
			this._css_vars[key]._is_gradient = true;
		} else {
			theme_style[key] = value;
			this._css_vars[key] = `var(--${this._id}_${key})`;
		}

		// Set property.
		if (this.active_id === theme) {
			document.documentElement.style.setProperty(`--${this._id}_${key}`, this.active[key]);
		}

		// Response.
		return this;
	}

	get id() {
		return `${this._id}.${this.active_id}`
	}

	// Initialize by cached.
	initialize(id = null) {
		if (id == null) {
			id = localStorage.getItem(this._id);
		}
		if (id != null && this._themes.includes(id)) {
			this.activate(id);
		}
		return this;
	}

	// Get raw value.
	value(id) {
		return this.active[id];
	}

	// Opacity.
	// Opacity must be a number `0.0` till `1.0`, and may also be an object with opacity pet theme `{dark: 0.2, light: 0.35}`.
	opacity(id, opacity = 1.0) {

		// Create full id.
		let full_id;
		if (typeof opacity === "number") {
			full_id = `${id}_opac_${opacity}`;
		} else {
			full_id = `${id}_opac_${Object.values(opacity).join("_")}`;
		}
		full_id = full_id.replaceAll(".", "_");

		// Alreadh created.
		if (this._css_vars[full_id]) {
			return this._css_vars[full_id];
		}

		// Iterate.
		let index = 0;
		for (const theme_id of this._themes) {
			const theme = this[theme_id];

			// Checks.
			if (theme[id] == null) {
				console.error(new Error(`Theme attribute "${id}" does not exist.`));
				return; 
			}
			if (theme[id]._is_gradient) {
				console.error(new Error(`Unable to set the opacity on gradient color "${id}".`));
				return; 
			}

			// Create new color.
			let theme_opac = opacity;
			if (typeof theme_opac === "object") {
				theme_opac = theme_opac[this._theme_ids[index]];
				if (theme_opac === undefined) {
					console.error(new Error(`Unable to find the opacity on for theme id "${this._theme_ids[index]}".`));
				}
			}
			theme[full_id] = vweb.colors.set_opacity(theme[id], theme_opac);

			// Add css var.
			if (index === 0) {
				this._add_attr(full_id);
			}

			// Set property.
			if (this.active_id === theme_id) {
				document.documentElement.style.setProperty(`--${this._id}_${full_id}`, theme[full_id]);
			}

			// Incr index
			++index;
		}

		return this._css_vars[full_id];
	}

	// Activate a theme.
	activate(id, apply_theme_update = true) {
		if (this._themes.includes(id) === false) {
			throw Error(`Theme "${id}" does not exist.`);
		}
		this.active_id = id;
		this.active = this[id];
		Object.keys(this.active).iterate((id) => {
			document.documentElement.style.setProperty(`--${this._id}_${id}`, this.active[id]);
		});
		if (this._on_activate_callback != null) {
			this._on_activate_callback(this, this.active_id);
		}
		if (apply_theme_update) {
			vweb.themes.apply_theme_update();
		}
		localStorage.setItem(this._id, this.active_id);
		return this;
	}

	// Set an on activate callback.
	on_activate(callback) {
		if (callback == null) { return this._on_activate_callback; }
		this._on_activate_callback = callback;
		return this;
	}

	// Get cached active subtheme id.
	get_active_id_cached() {
		return localStorage.getItem(this._id);
	}

	// Toggle themes.
	toggle(apply_theme_update = true) {
		if (this._theme_ids.length > 1) {
			let active_index = null;
			for (let i = 0; i < this._theme_ids.length; i++) {
				if (this._theme_ids[i] === this.active_id) {
					active_index = i;
					break;
				}
			}
			if (active_index + 1 < this._theme_ids.length) {
				this.activate(this._theme_ids[active_index + 1], apply_theme_update);
			} else {
				this.activate(this._theme_ids[0], apply_theme_update);
			}
		}
		return this;
	}
}