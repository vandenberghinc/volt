/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */

// Define the ThemeElement type for better type safety.
interface ThemeElement {
    element: any; // Since the element could be of various types, we use 'any' here.
}

// Themes module.
export namespace Themes {
    export const theme_elements: ThemeElement[] = [];

    // Call the on-theme-update callbacks on all elements that have it defined.
    export function apply_theme_update() {
        for (const theme of theme_elements) {
            const e = theme.element;
            if (e !== undefined && Array.isArray(e._on_theme_updates)) {
                for (const func of e._on_theme_updates) func(e);
            }
        }
    }
};
export { Themes as themes }; // also export as lowercase for compatibility.