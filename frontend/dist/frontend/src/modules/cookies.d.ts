/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
export declare namespace Cookies {
    let enabled: boolean;
    /**
     * Checks if cookies need to be parsed again.
     * @docs
     */
    function is_parse_required(): boolean;
    /**
     * Get cookies or a specific cookie by name.
     * @experimental true
     * @param name The name of the cookie.
     * @docs
     */
    function get(name?: string | null): string | {
        [key: string]: string;
    } | undefined;
    /**
     * Checks if the user has set a cookie preference (enabled or disabled).
     * @docs
     */
    function has_preference(): boolean;
    /**
     * Checks if cookies are accepted by the user.
     * @docs
     */
    function is_accepted(): boolean;
    /**
     * Enables cookies (opt-in) and updates the user's preference.
     * @param _set_storage Whether to update the localStorage preference (default: true).
     * @docs
     */
    function enable(_set_storage?: boolean): void;
    /**
     * Disables cookies (opt-out) and updates the user's preference.
     * @param _set_storage Whether to update the localStorage preference (default: true).
     * @docs
     */
    function disable(_set_storage?: boolean): void;
}
export { Cookies as cookies };
