/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Color } from "./color.js"
import { Themes as ThemesModule } from "./themes.js"

// Types.
type ThemeAttributeName = string;
type ThemeId = "dark" | "light";
const ThemeIdList = ["dark", "light"] as const;
type ThemesOptions<ThemeOptions extends {}> = { dark: ThemeOptions, light: ThemeOptions };
type OnActivateCallback<ThemeOptions extends {}> = (themes_class: Theme<ThemeOptions>, active_id: ThemeId) => void;

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
export class Theme<ThemeOptions extends Record<string, any>> {

    // helper: union of all keys across all themes

    // Attributes.
    public active_id!: ThemeId;
    public active!: ThemeOptions;
    public _dark: ThemeOptions;
    public _light: ThemeOptions;
    public _attrs: string[];
    public _css_vars: Record<string, string | String>;
    public _id: string;
    public _on_activate_callback?: OnActivateCallback<ThemeOptions>;
    public _linked_themes?: Theme<any>[];

    /**
     * 
     * @param id The name of the theme, this will be used as a prefix for the css variables and for the cached theme id.
     * @param themes The themes to be used, this should be a dictionary with the theme name as key and the theme style as value.
     * @param linked_themes A list of linked themes, when this theme is changed, the linked themes will also be changed.
     */
    constructor(
        id: string,
        themes: ThemesOptions<ThemeOptions>,
        linked_themes?: Theme<any>[]
    ) {

        // Attributes.
        this._attrs = [];
        this._css_vars = {};
        this._id = id;
        this._dark = themes.dark;
        this._light = themes.light;
        this._linked_themes = linked_themes

        // Assign themes.
        Object.keys(themes).iterate((theme) => {

            // Initialize.
            const theme_style = themes[theme] as Record<string, any>;
            this[theme] = theme_style;

            // Activate first theme.
            if (this.active_id === undefined) {
                this.active_id = theme as ThemeId;
                this.active = theme_style as any;
                Object.keys(this.active as any).iterate((id) => {
                    document.documentElement.style.setProperty(`--${this._id}_${id}`, (this.active as any)[id] ?? "");
                });
            }

            // Initialize attr funcs.
            Object.keys(theme_style).iterate((id) => {
                this._add_attr(id, theme as ThemeId);
            })
        })

        // Ensure type.
        if (this.active_id == null || this.active == null) {
            throw new Error("No themes were specified in parameter \"themes\".");
        }
    }

    /**
     * Initialize a specific theme.
     * @note This function should be called after the constructor to ensure the most recent theme is activated, argument "id" can be left undefined.
     */
    initialize(id?: ThemeId): this {
        if (id == null) {
            id = (localStorage.getItem(this._id) ?? undefined) as any;
        }
        if (id != null && ThemeIdList.includes(id as any)) {
            this.activate(id);
        }
        return this;
    }

    // ---------------------------------------------------------------------
    // Theme selection methods.

    /** Get full active theme id. */
    get id(): string {
        return `${this._id}.${String(this.active_id)}`
    }

    // Get cached active subtheme id.
    get_active_id_cached(): string {
        return localStorage.getItem(this._id) ?? "";
    }

    // Activate a theme.
    activate(id: ThemeId, apply_theme_update: boolean = true): this {
        if (ThemeIdList.includes(id) === false || (this as any)[id] === undefined) {
            throw Error(`Theme "${id as string}" does not exist.`);
        }
        this.active_id = id;
        this.active = (this as any)[id];
        Object.keys(this.active as any).iterate((id) => {
            document.documentElement.style.setProperty(`--${this._id}_${id}`, (this.active as any)[id] ?? "");
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

    // Set an on activate callback.
    on_activate(): OnActivateCallback<ThemeOptions> | undefined;
    on_activate(callback: OnActivateCallback<ThemeOptions>): this;
    on_activate(callback?: OnActivateCallback<ThemeOptions>): this | OnActivateCallback<ThemeOptions> | undefined {
        if (callback == null) { return this._on_activate_callback; }
        this._on_activate_callback = callback;
        return this;
    }

    // Toggle themes.
    toggle(apply_theme_update: boolean = true): this {
        const other: ThemeId = this.active_id === "dark" ? "light" : "dark";
        this.activate(other, apply_theme_update);
        return this;
    }

    // ---------------------------------------------------------------------
    // Adding values.

    // Add a new attribute.
    _add_attr(id: string, theme?: ThemeId): void {
        if (theme == null) {
            this._css_vars[id] = `var(--${this._id}_${id})`;
        } else {
            const theme_style = (this as any)[theme];
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
            get: function () {
                return this._css_vars[id];
            },
            set: function (v: any) {
                // only for support this does not work however.
                // document.documentElement.style.setProperty(`--${this._id}_${id}`, (this.active as any)[id] ?? "");
                // return this;
            },
            enumerable: true,
            configurable: true,
        });
        this._attrs.append(id);
    }

    // Assign a new value.
    set(theme: ThemeId, key: string, value: any): this {

        // Update theme.
        const theme_style = (this as any)[theme];
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

    get raw(): ThemeOptions {
        return this.active;
    }

    // Get raw value.
    value(id: ThemeAttributeName): any {
        if (this.active === undefined) { return; }
        return this.active![id];
    }

    // ---------------------------------------------------------------------
    // Color manipulation methods.

    // Create a new color for each theme.
    create<T = string>(id: string, create_theme_value: (theme_id: ThemeId, theme: ThemeOptions) => T): void {

        // Already created.
        if (this._css_vars[id]) {
            throw new Error(`Color "${id}" already exists.`);
        }

        // Iterate.
        let index = 0;
        for (const theme_id of ThemeIdList) {
            const theme = (this as any)[theme_id];
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
    auto_darken_lighten(
        theme_attr: ThemeAttributeName,
        percent: number = 0.5,
        reversed: boolean = false,
    ) {
        let full_id = `${String(theme_attr)}_adl_${percent}`;
        full_id = full_id.replaceAll(".", "_");
        if (this._css_vars[full_id]) {
            return this._css_vars[full_id] as string;
        }
        const process = reversed === true ? (x => x < 0.5) : (x => x > 0.5)
        this.create(full_id, (theme_id, theme) => {
            if (!theme[theme_attr]) {
                throw new Error(`Theme attribute "${String(theme_attr)}" does not exist.`);
            }
            return new Color(theme[theme_attr]).auto_darken_lighten(percent, process).str()
        });
        return this._css_vars[full_id] as string;
    }

    // Opacity.
    // Opacity must be a number `0.0` till `1.0`, and may also be an object with opacity pet theme `{dark: 0.2, light: 0.35}`.
    opacity(theme_attr: ThemeAttributeName, opacity: number = 1.0): string {

        // Create full id.
        let full_id;
        if (typeof opacity === "number") {
            full_id = `${String(theme_attr)}_opac_${opacity}`;
        } else {
            full_id = `${String(theme_attr)}_opac_${Object.values(opacity).join("_")}`;
        }
        full_id = full_id.replaceAll(".", "_");

        // Already created.
        if (this._css_vars[full_id]) {
            return this._css_vars[full_id] as string;
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

        return this._css_vars[full_id] as string;
    }

    // ---------------------------------------------------------------------
    // Font size manipulation methods.

    /**
     * Create a new value by multiplying a numeric attribute.
     * @warning argument `id` should be the name of a numeric theme attribute.
     * @param theme_attr The name of a numeric attribute
     * @param x The number by which to multiply the attribute, `attribute * x`.
     */
    multiply(theme_attr: ThemeAttributeName, x: number = 1.0): string {
        let full_id = `${String(theme_attr)}_fsr_${x}`;
        full_id = full_id.replaceAll(".", "_");
        if (this._css_vars[full_id]) {
            return this._css_vars[full_id] as string;
        }
        const process = (x => x < 0.5)
        this.create<number>(full_id, (_, theme) => {
            if (!theme[theme_attr]) {
                throw new Error(`Theme attribute "${String(theme_attr)}" does not exist.`);
            }
            if (typeof theme[theme_attr] !== "number") {
                throw new Error(`Theme attribute "${String(theme_attr)}" is not a number.`);
            }
            return theme[theme_attr] * x;
        });
        return this._css_vars[full_id] as string;
    }

    // ---------------------------------------------------------------------
    // Animation methods.

    /** Function to disable all transition attributes on all elements. */
    disable_transitions(): this {
        // const style = document.createElement('style');
        //     style.id = '__libris_thme_disable_transitions__';
        //     style.innerHTML = `
        //     * { transition: none !important; }
        //     *::after { transition: none !important; }
        //     *::before { transition: none !important; }
        // `.dedent();
        // document.head.appendChild(style);

        document.body.classList.add("notransition");

        // Force a reflow to apply the new styles immediately
        // document.head.getBoundingClientRect();
        void document.body.offsetHeight;

        return this;
    }

    /** Function to re-enable all transition attributes on all elements. */
    enable_transitions(delay = 0): this {
        if (delay > 0) {
            setTimeout(() => this.enable_transitions(0), delay);
            return this;
        }
        document.body.classList.remove("notransition");
        // const style = document.getElementById('__libris_thme_disable_transitions__');
        // if (style) {
        //     style.remove();
        // }
        document.head.getBoundingClientRect();
        return this;
    }
}
// @ts-ignore
export interface Theme<ThemeOptions extends Record<string, any>> extends ThemeOptions {}
// export type ExtendTheme<ThemeOptions extends Record<string, any>> = Theme<any>;
