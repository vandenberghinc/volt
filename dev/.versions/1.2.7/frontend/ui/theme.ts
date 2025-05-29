/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Elements } from "../modules/elements"
import { Colors } from "../modules/colors"
import { Themes as ThemesModule } from "../modules/themes"

type OnActivateCallback = (element: ThemeClass, theme: string) => void;

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
export class ThemeClass {

	// Attributes.
	public active_id?: string;
	public active?: Record<string, any>;
	public _theme_ids: string[];
	public _attrs: string[];
	public _css_vars: Record<string, string | String>;
	public _id: string;
	public _on_activate_callback?: OnActivateCallback;

	constructor(
		id: string,
		themes: Record<string, any> = {},
	) {

		// Attributes.
		this.active_id = undefined;
		this.active = undefined;
		this._theme_ids = [];
		this._attrs = [];
		this._css_vars = {};
		this._id = id;

		// Assign themes.
		Object.keys(themes).iterate((theme) => {

			// Initialize.
			const theme_style = themes[theme] as Record<string, any>;
			this._theme_ids.append(theme);
			this[theme] = theme_style;

			// Activate first theme.
			if (this.active_id === undefined) {
				this.active_id = theme;
				this.active = theme_style;
				Object.keys(this.active as any).iterate((id) => {
					document.documentElement.style.setProperty(`--${this._id}_${id}`, (this.active as any)[id] ?? "");
				});
			}

			// Initialize attr funcs.
			Object.keys(theme_style).iterate((id) => {
				this._add_attr(id, theme);
			})
		})
	}

	// Add a new attribute.
	_add_attr(id: string, theme?: string) : void {
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
				(this._css_vars[id] as any)._is_gradient = true;
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
	set(theme: string, key: string, value: any) : this {

		// Update theme.
		const theme_style = this[theme];
		if (typeof value === "string" && (value.indexOf("linear-gradient") !== -1 || value.indexOf("radial-gradient") !== -1)) {
			theme_style[key] = new String(value);
			theme_style[key]._is_gradient = true;
			this._css_vars[key] = new String(`var(--${this._id}_${key})`);
			(this._css_vars[key] as any)._is_gradient = true;
		} else {
			theme_style[key] = value;
			this._css_vars[key] = `var(--${this._id}_${key})`;
		}

		// Set property.
		if (this.active_id === theme) {
			document.documentElement.style.setProperty(`--${this._id}_${key}`, (this.active as any)[key] ?? "");
		}

		// Response.
		return this;
	}

	get id(): string {
		return `${this._id}.${this.active_id}`
	}

	// Initialize by cached.
	initialize(id?: string) : this {
		if (id == null) {
			id = localStorage.getItem(this._id) ?? undefined;
		}
		if (id != null && this._theme_ids.includes(id)) {
			this.activate(id);
		}
		return this;
	}

	// Get raw value.
	value(id) : any {
		if (this.active === undefined) { return ; }
		return this.active[id];
	}

	// Opacity.
	// Opacity must be a number `0.0` till `1.0`, and may also be an object with opacity pet theme `{dark: 0.2, light: 0.35}`.
	opacity(id: string, opacity: number = 1.0): string | String {

		// Create full id.
		let full_id;
		if (typeof opacity === "number") {
			full_id = `${id}_opac_${opacity}`;
		} else {
			full_id = `${id}_opac_${Object.values(opacity).join("_")}`;
		}
		full_id = full_id.replaceAll(".", "_");

		// Already created.
		if (this._css_vars[full_id]) {
			return this._css_vars[full_id];
		}

		// Iterate.
		let index = 0;
		for (const theme_id of this._theme_ids) {
			const theme = this[theme_id];

			// Checks.
			if (theme[id] == null) {
				console.error(new Error(`Theme attribute "${id}" does not exist.`));
				return ""; 
			}
			if (theme[id]._is_gradient) {
				console.error(new Error(`Unable to set the opacity on gradient color "${id}".`));
				return ""; 
			}

			// Create new color.
			let theme_opac = opacity;
			if (typeof theme_opac === "object") {
				theme_opac = theme_opac[this._theme_ids[index]];
				if (theme_opac === undefined) {
					console.error(new Error(`Unable to find the opacity on for theme id "${this._theme_ids[index]}".`));
				}
			}
			theme[full_id] = Colors.set_opacity(theme[id], theme_opac);

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
	activate(id: string, apply_theme_update: boolean = true) : this {
		if (this._theme_ids.includes(id) === false || this[id] === undefined) {
			throw Error(`Theme "${id}" does not exist.`);
		}
		this.active_id = id;
		this.active = this[id];
		Object.keys(this.active as any).iterate((id) => {
			document.documentElement.style.setProperty(`--${this._id}_${id}`, (this.active as any)[id] ?? "");
		});
		if (this._on_activate_callback != null) {
			this._on_activate_callback(this, this.active_id);
		}
		if (apply_theme_update) {
			ThemesModule.apply_theme_update();
		}
		localStorage.setItem(this._id, this.active_id);
		return this;
	}

	// Set an on activate callback.
	on_activate() : OnActivateCallback | undefined;
	on_activate(callback: OnActivateCallback) : this;
	on_activate(callback?: OnActivateCallback) : this | OnActivateCallback | undefined {
		if (callback == null) { return this._on_activate_callback; }
		this._on_activate_callback = callback;
		return this;
	}

	// Get cached active subtheme id.
	get_active_id_cached() : string {
		return localStorage.getItem(this._id) ?? "";
	}

	// Toggle themes.
	toggle(apply_theme_update: boolean = true) : this {
		if (this._theme_ids.length > 1) {
			let active_index = -1;
			for (let i = 0; i < this._theme_ids.length; i++) {
				if (this._theme_ids[i] === this.active_id) {
					active_index = i;
					break;
				}
			}
			if (active_index !== -1 && active_index + 1 < this._theme_ids.length) {
				this.activate(this._theme_ids[active_index + 1], apply_theme_update);
			} else {
				this.activate(this._theme_ids[0], apply_theme_update);
			}
		}
		return this;
	}
}
export const Theme = Elements.wrapper(ThemeClass); //@todo duplicate name from Themes