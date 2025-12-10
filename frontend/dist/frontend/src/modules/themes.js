/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
// Themes module.
export var Themes;
(function (Themes) {
    Themes.theme_elements = [];
    // Call the on-theme-update callbacks on all elements that have it defined.
    function apply_theme_update() {
        for (const theme of Themes.theme_elements) {
            const e = theme.element;
            if (e !== undefined && Array.isArray(e._on_theme_updates)) {
                for (const func of e._on_theme_updates)
                    func(e);
            }
        }
    }
    Themes.apply_theme_update = apply_theme_update;
})(Themes || (Themes = {}));
;
export { Themes as themes }; // also export as lowercase for compatibility.
