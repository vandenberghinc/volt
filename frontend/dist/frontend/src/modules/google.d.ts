/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
export declare namespace Google {
    const id: string;
    /**
     * Enable google analytics tracking
     * @nav Fronted/Google
     * @docs
     */
    function enable_tracking(): void;
    /**
     * Disable google analytics tracking
     * @nav Fronted/Google
     * @docs
     */
    function disable_tracking(): void;
    const cloud: {
        api_key: string;
    };
}
export { Google as google };
