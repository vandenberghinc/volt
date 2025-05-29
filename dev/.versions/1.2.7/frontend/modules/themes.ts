/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Define the ThemeElement type for better type safety.
interface ThemeElement {
    element: any; // Since the element could be of various types, we use 'any' here.
}

// Themes module.
export const Themes = {
    theme_elements: [] as ThemeElement[],

    // Call the on-theme-update callbacks on all elements that have it defined.
    apply_theme_update() {
        this.theme_elements.forEach((theme) => {
            const e = theme.element;
            if (e !== undefined && Array.isArray(e._on_theme_updates)) {
                e._on_theme_updates.forEach((func: Function) => func(e));
            }
        });
    }
};