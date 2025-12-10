/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
/** Name of a theme attribute key. */
type ThemeAttributeName = string;
/** Identifier of a theme variant. */
type ThemeId = "dark" | "light";
/** Theme options for dark and light variants. */
type ThemesOptions<ThemeOptions extends {}> = {
    dark: ThemeOptions;
    light: ThemeOptions;
};
/** Callback invoked when a theme is activated. */
type OnActivateCallback<ThemeOptions extends {}> = (themes_class: Theme<ThemeOptions>, active_id: ThemeId) => void;
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
export declare class Theme<ThemeOptions extends Record<string, any>> {
    active_id: ThemeId;
    active: ThemeOptions;
    _dark: ThemeOptions;
    _light: ThemeOptions;
    _attrs: string[];
    _css_vars: Record<string, string | String>;
    _id: string;
    _on_activate_callback?: OnActivateCallback<ThemeOptions>;
    _linked_themes?: Theme<any>[];
    /**
     *
     * @param id The name of the theme, this will be used as a prefix for the css variables and for the cached theme id.
     * @param themes The themes to be used, this should be a dictionary with the theme name as key and the theme style as value.
     * @param linked_themes A list of linked themes, when this theme is changed, the linked themes will also be changed.
     */
    constructor(id: string, themes: ThemesOptions<ThemeOptions>, linked_themes?: Theme<any>[]);
    /**
     * Initialize a specific theme.
     * @note This function should be called after the constructor to ensure the most recent theme is activated, argument "id" can be left undefined.
     */
    initialize(id?: ThemeId): this;
    /** Get full active theme id. */
    get id(): string;
    /** Get cached active subtheme id from localStorage. */
    get_active_id_cached(): string;
    /**
     * Activate a theme and update CSS variables.
     * @param id The theme id to activate.
     * @param apply_theme_update Whether to call the global theme update hook after activation.
     */
    activate(id: ThemeId, apply_theme_update?: boolean): this;
    on_activate(): OnActivateCallback<ThemeOptions> | undefined;
    on_activate(callback: OnActivateCallback<ThemeOptions>): this;
    /**
     * Toggle the active theme between "dark" and "light".
     * @param apply_theme_update Whether to call the global theme update hook after toggling.
     */
    toggle(apply_theme_update?: boolean): this;
    /**
     * Internal: add a theme attribute and expose it as a CSS variable-backed property.
     * @param id The attribute name to add.
     * @param theme Optional theme id used for initialization and gradient detection.
     */
    _add_attr(id: string, theme?: ThemeId): void;
    /**
     * Assign a new value to a theme attribute and update its CSS variable for the active theme.
     * @param theme The theme id to modify.
     * @param key The attribute name.
     * @param value The new value for the attribute.
     */
    set(theme: ThemeId, key: string, value: any): this;
    /** Get the raw active theme object. */
    get raw(): ThemeOptions;
    /**
     * Get the raw (non-CSS-variable) value of an attribute from the active theme.
     * @param id The attribute name.
     */
    value(id: ThemeAttributeName): any;
    /**
     * Create a new attribute for each theme using a callback and expose it as a CSS variable.
     * @param id The new attribute name to create.
     * @param create_theme_value Callback that returns the value for each theme.
     */
    create<T = string>(id: string, create_theme_value: (theme_id: ThemeId, theme: ThemeOptions) => T): void;
    /**
     * Auto darken lighten a color from the theme
     * Safe to call multiple times, caching is implemented.
     *
     * @warning The input color must be a hex / rgb(a) string.
     * @param theme_attr The name of the original theme color.
     * @param percent Percentage between 0. and 1.0.
     */
    auto_darken_lighten(theme_attr: ThemeAttributeName, percent?: number, reversed?: boolean): string;
    /**
     * Set the opacity on a theme color, creating a derived CSS variable.
     * Opacity must be a number `0.0` till `1.0`, and may also be an object with opacity per theme `{dark: 0.2, light: 0.35}`.
     * @param theme_attr The source theme color attribute.
     * @param opacity The opacity value or per-theme map.
     */
    opacity(theme_attr: ThemeAttributeName, opacity?: number): string;
    /**
     * Create a new value by multiplying a numeric attribute.
     * @warning argument `id` should be the name of a numeric theme attribute.
     * @param theme_attr The name of a numeric attribute
     * @param x The number by which to multiply the attribute, `attribute * x`.
     */
    multiply(theme_attr: ThemeAttributeName, x?: number): string;
    /** Function to disable all transition attributes on all elements. */
    static disable_transitions(): void;
    /** Function to re-enable all transition attributes on all elements. */
    static enable_transitions(delay?: number): void;
}
/** Interface merge to expose theme attributes as properties from ThemeOptions on Theme instances. */
export interface Theme<ThemeOptions extends Record<string, any>> extends ThemeOptions {
}
export {};
