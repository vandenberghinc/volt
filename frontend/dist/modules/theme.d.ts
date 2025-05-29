type ThemeAttributeName = string;
type ThemeId = "dark" | "light";
type ThemesOptions<ThemeOptions extends {}> = {
    dark: ThemeOptions;
    light: ThemeOptions;
};
type OnActivateCallback<ThemeOptions extends {}> = (themes_class: Theme<ThemeOptions>, active_id: ThemeId) => void;
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
    get_active_id_cached(): string;
    activate(id: ThemeId, apply_theme_update?: boolean): this;
    on_activate(): OnActivateCallback<ThemeOptions> | undefined;
    on_activate(callback: OnActivateCallback<ThemeOptions>): this;
    toggle(apply_theme_update?: boolean): this;
    _add_attr(id: string, theme?: ThemeId): void;
    set(theme: ThemeId, key: string, value: any): this;
    get raw(): ThemeOptions;
    value(id: ThemeAttributeName): any;
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
    opacity(theme_attr: ThemeAttributeName, opacity?: number): string;
    /**
     * Create a new value by multiplying a numeric attribute.
     * @warning argument `id` should be the name of a numeric theme attribute.
     * @param theme_attr The name of a numeric attribute
     * @param x The number by which to multiply the attribute, `attribute * x`.
     */
    multiply(theme_attr: ThemeAttributeName, x?: number): string;
    /** Function to disable all transition attributes on all elements. */
    disable_transitions(): this;
    /** Function to re-enable all transition attributes on all elements. */
    enable_transitions(delay?: number): this;
}
export interface Theme<ThemeOptions extends Record<string, any>> extends ThemeOptions {
}
export {};
