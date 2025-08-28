/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */
// Imports.
import { Color } from "./color.js";
import { Themes as ThemesModule } from "./themes.js";
/** List of supported theme identifiers. */
const ThemeIdList = ["dark", "light"];
/**
 * A themes class to efficiently style the site using themes.
 *
 * The constructor arguments must be a theme style per theme name. Every theme variable should exist in all themes or it may cause undefined behaviour. The theme name that is passed first will be the active theme by default.
 * ```
 * Theme("main-theme", {
 *     light: {
 *         text_fg: "#000000",
 *     },
 *     dark: {
 *         text_fg: "#FFFFFF",
 *     },
 * })
 * ```
 *
 * When theme attributes are retrieved, by default they will be the active theme's attribute as a css variable. So this can be passed to an element.
 * However, some element functions do not accept css variables, in this case the `value()` function can be used to retrieve the raw value. Do not forget to apply an `on_theme_update()` callback on the elements where you use this.
 * @nav Frontend/Themes
 * @note The `ThemesClass` is also initializable under function `Themes`.
 * @docs
 */
export class Theme {
    // Attributes.
    active_id;
    active;
    _dark;
    _light;
    _attrs;
    _css_vars;
    _id;
    _on_activate_callback;
    _linked_themes;
    /**
     *
     * @param id The name of the theme, this will be used as a prefix for the css variables and for the cached theme id.
     * @param themes The themes to be used, this should be a dictionary with the theme name as key and the theme style as value.
     * @param linked_themes A list of linked themes, when this theme is changed, the linked themes will also be changed.
     */
    constructor(id, themes, linked_themes) {
        // Attributes.
        this._attrs = [];
        this._css_vars = {};
        this._id = id;
        this._dark = themes.dark;
        this._light = themes.light;
        this._linked_themes = linked_themes;
        // Assign themes.
        Object.keys(themes).iterate((theme) => {
            // Initialize.
            const theme_style = themes[theme];
            this[theme] = theme_style;
            // Activate first theme.
            if (this.active_id === undefined) {
                this.active_id = theme;
                this.active = theme_style;
                Object.keys(this.active).iterate((id) => {
                    document.documentElement.style.setProperty(`--${this._id}_${id}`, this.active[id] ?? "");
                });
            }
            // Initialize attr funcs.
            Object.keys(theme_style).iterate((id) => {
                this._add_attr(id, theme);
            });
        });
        // Ensure type.
        if (this.active_id == null || this.active == null) {
            throw new Error("No themes were specified in parameter \"themes\".");
        }
    }
    /**
     * Initialize a specific theme.
     * @note This function should be called after the constructor to ensure the most recent theme is activated, argument "id" can be left undefined.
     */
    initialize(id) {
        if (id == null) {
            id = (localStorage.getItem(this._id) ?? undefined);
        }
        if (id != null && ThemeIdList.includes(id)) {
            this.activate(id);
        }
        return this;
    }
    // ---------------------------------------------------------------------
    // Theme selection methods.
    /** Get full active theme id. */
    get id() {
        return `${this._id}.${String(this.active_id)}`;
    }
    /** Get cached active subtheme id from localStorage. */
    get_active_id_cached() {
        return localStorage.getItem(this._id) ?? "";
    }
    /**
     * Activate a theme and update CSS variables.
     * @param id The theme id to activate.
     * @param apply_theme_update Whether to call the global theme update hook after activation.
     */
    activate(id, apply_theme_update = true) {
        if (ThemeIdList.includes(id) === false || this[id] === undefined) {
            throw Error(`Theme "${id}" does not exist.`);
        }
        this.active_id = id;
        this.active = this[id];
        Object.keys(this.active).iterate((id) => {
            document.documentElement.style.setProperty(`--${this._id}_${id}`, this.active[id] ?? "");
        });
        if (this._on_activate_callback != null) {
            this._on_activate_callback(this, this.active_id);
        }
        if (this._linked_themes?.length) {
            this._linked_themes.iterate((theme) => {
                theme.activate(id, false);
            });
        }
        if (apply_theme_update) {
            ThemesModule.apply_theme_update();
        }
        localStorage.setItem(this._id, String(this.active_id));
        return this;
    }
    /**
     * Get or set the callback invoked after a theme is activated.
     * When called without a callback, returns the currently set callback.
     * @param callback The callback to invoke with the theme instance and active id after activation.
     */
    on_activate(callback) {
        if (callback == null) {
            return this._on_activate_callback;
        }
        this._on_activate_callback = callback;
        return this;
    }
    /**
     * Toggle the active theme between "dark" and "light".
     * @param apply_theme_update Whether to call the global theme update hook after toggling.
     */
    toggle(apply_theme_update = true) {
        const other = this.active_id === "dark" ? "light" : "dark";
        this.activate(other, apply_theme_update);
        return this;
    }
    // ---------------------------------------------------------------------
    // Adding values.
    /**
     * Internal: add a theme attribute and expose it as a CSS variable-backed property.
     * @param id The attribute name to add.
     * @param theme Optional theme id used for initialization and gradient detection.
     */
    _add_attr(id, theme) {
        if (theme == null) {
            this._css_vars[id] = `var(--${this._id}_${id})`;
        }
        else {
            const theme_style = this[theme];
            if (typeof theme_style[id] === "string" &&
                (theme_style[id].indexOf("linear-gradient") !== -1 ||
                    theme_style[id].indexOf("radial-gradient") !== -1)) {
                theme_style[id] = new String(theme_style[id]);
                theme_style[id]._is_gradient = true;
                this._css_vars[id] = new String(`var(--${this._id}_${id})`);
                this._css_vars[id]._is_gradient = true;
            }
            else {
                this._css_vars[id] = `var(--${this._id}_${id})`;
            }
        }
        Object.defineProperty(this, id, {
            get: function () {
                return this._css_vars[id];
            },
            set: function (v) {
                // only for support this does not work however.
                // document.documentElement.style.setProperty(`--${this._id}_${id}`, (this.active as any)[id] ?? "");
                // return this;
            },
            enumerable: true,
            configurable: true,
        });
        this._attrs.append(id);
    }
    /**
     * Assign a new value to a theme attribute and update its CSS variable for the active theme.
     * @param theme The theme id to modify.
     * @param key The attribute name.
     * @param value The new value for the attribute.
     */
    set(theme, key, value) {
        // Update theme.
        const theme_style = this[theme];
        if (typeof value === "string" && (value.indexOf("linear-gradient") !== -1 || value.indexOf("radial-gradient") !== -1)) {
            theme_style[key] = new String(value);
            theme_style[key]._is_gradient = true;
            this._css_vars[key] = new String(`var(--${this._id}_${key})`);
            this._css_vars[key]._is_gradient = true;
        }
        else {
            theme_style[key] = value;
            this._css_vars[key] = `var(--${this._id}_${key})`;
        }
        // Set property.
        if (this.active_id === theme) {
            document.documentElement.style.setProperty(`--${this._id}_${key}`, this.active[key] ?? "");
        }
        // Response.
        return this;
    }
    /** Get the raw active theme object. */
    get raw() {
        return this.active;
    }
    /**
     * Get the raw (non-CSS-variable) value of an attribute from the active theme.
     * @param id The attribute name.
     */
    value(id) {
        if (this.active === undefined) {
            return;
        }
        return this.active[id];
    }
    // ---------------------------------------------------------------------
    // Color manipulation methods.
    /**
     * Create a new attribute for each theme using a callback and expose it as a CSS variable.
     * @param id The new attribute name to create.
     * @param create_theme_value Callback that returns the value for each theme.
     */
    create(id, create_theme_value) {
        // Already created.
        if (this._css_vars[id]) {
            throw new Error(`Color "${id}" already exists.`);
        }
        // Iterate.
        let index = 0;
        for (const theme_id of ThemeIdList) {
            const theme = this[theme_id];
            const value = create_theme_value(theme_id, theme);
            theme[id] = value;
            // Add attribute to document on first call.
            if (index === 0) {
                this._add_attr(id);
            }
            // Set property.
            if (this.active_id === theme_id) {
                document.documentElement.style.setProperty(`--${this._id}_${id}`, theme[id]);
            }
            // Incr index
            ++index;
        }
    }
    /**
     * Auto darken lighten a color from the theme
     * Safe to call multiple times, caching is implemented.
     *
     * @warning The input color must be a hex / rgb(a) string.
     * @param theme_attr The name of the original theme color.
     * @param percent Percentage between 0. and 1.0.
     */
    auto_darken_lighten(theme_attr, percent = 0.5, reversed = false) {
        let full_id = `${String(theme_attr)}_adl_${percent}`;
        full_id = full_id.replaceAll(".", "_");
        if (this._css_vars[full_id]) {
            return this._css_vars[full_id];
        }
        const process = reversed === true ? (x => x < 0.5) : (x => x > 0.5);
        this.create(full_id, (theme_id, theme) => {
            if (!theme[theme_attr]) {
                throw new Error(`Theme attribute "${String(theme_attr)}" does not exist.`);
            }
            return new Color(theme[theme_attr]).auto_darken_lighten(percent, process).str();
        });
        return this._css_vars[full_id];
    }
    /**
     * Set the opacity on a theme color, creating a derived CSS variable.
     * Opacity must be a number `0.0` till `1.0`, and may also be an object with opacity per theme `{dark: 0.2, light: 0.35}`.
     * @param theme_attr The source theme color attribute.
     * @param opacity The opacity value or per-theme map.
     */
    opacity(theme_attr, opacity = 1.0) {
        // Create full id.
        let full_id;
        if (typeof opacity === "number") {
            full_id = `${String(theme_attr)}_opac_${opacity}`;
        }
        else {
            full_id = `${String(theme_attr)}_opac_${Object.values(opacity).join("_")}`;
        }
        full_id = full_id.replaceAll(".", "_");
        // Already created.
        if (this._css_vars[full_id]) {
            return this._css_vars[full_id];
        }
        // Iterate.
        let index = 0;
        for (const theme_id of ThemeIdList) {
            const theme = this[theme_id];
            // Checks.
            if (theme[theme_attr] == null) {
                console.error(new Error(`Theme attribute "${String(theme_attr)}" does not exist.`));
                return "";
            }
            if (theme[theme_attr]._is_gradient) {
                console.error(new Error(`Unable to set the opacity on gradient color "${String(theme_attr)}".`));
                return "";
            }
            // Create new color.
            let theme_opac = opacity;
            if (typeof theme_opac === "object") {
                theme_opac = theme_opac[theme_attr];
                if (theme_opac === undefined) {
                    console.error(new Error(`Unable to find the opacity on for theme id "${theme_attr}".`));
                }
            }
            theme[full_id] = new Color(theme[theme_attr]).opacity(theme_opac).rgb();
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
    // ---------------------------------------------------------------------
    // Font size manipulation methods.
    /**
     * Create a new value by multiplying a numeric attribute.
     * @warning argument `id` should be the name of a numeric theme attribute.
     * @param theme_attr The name of a numeric attribute
     * @param x The number by which to multiply the attribute, `attribute * x`.
     */
    multiply(theme_attr, x = 1.0) {
        let full_id = `${String(theme_attr)}_fsr_${x}`;
        full_id = full_id.replaceAll(".", "_");
        if (this._css_vars[full_id]) {
            return this._css_vars[full_id];
        }
        const process = (x => x < 0.5);
        this.create(full_id, (_, theme) => {
            if (!theme[theme_attr]) {
                throw new Error(`Theme attribute "${String(theme_attr)}" does not exist.`);
            }
            if (typeof theme[theme_attr] !== "number") {
                throw new Error(`Theme attribute "${String(theme_attr)}" is not a number.`);
            }
            return theme[theme_attr] * x;
        });
        return this._css_vars[full_id];
    }
    // ---------------------------------------------------------------------
    // Animation methods.
    /** Function to disable all transition attributes on all elements. */
    disable_transitions() {
        // const style = document.createElement('style');
        //     style.id = '__libris_thme_disable_transitions__';
        //     style.innerHTML = `
        //     * { transition: none !important; }
        //     *::after { transition: none !important; }
        //     *::before { transition: none !important; }
        // `.dedent();
        // document.head.appendChild(style);
        document.body.classList.add("volt_notransition");
        // Force a reflow to apply the new styles immediately
        // document.head.getBoundingClientRect();
        void document.body.offsetHeight;
        return this;
    }
    /** Function to re-enable all transition attributes on all elements. */
    enable_transitions(delay = 0) {
        if (delay > 0) {
            setTimeout(() => this.enable_transitions(0), delay);
            return this;
        }
        document.body.classList.remove("volt_notransition");
        // const style = document.getElementById('__libris_thme_disable_transitions__');
        // if (style) {
        //     style.remove();
        // }
        document.head.getBoundingClientRect();
        return this;
    }
}
