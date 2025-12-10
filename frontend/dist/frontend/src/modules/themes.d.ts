/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
interface ThemeElement {
    element: any;
}
export declare namespace Themes {
    const theme_elements: ThemeElement[];
    function apply_theme_update(): void;
}
export { Themes as themes };
