/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */
// Themes module.
export const Themes = {
    theme_elements: [],
    // Call the on-theme-update callbacks on all elements that have it defined.
    apply_theme_update() {
        this.theme_elements.forEach((theme) => {
            const e = theme.element;
            if (e !== undefined && Array.isArray(e._on_theme_updates)) {
                e._on_theme_updates.forEach((func) => func(e));
            }
        });
    }
};
