/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Google wrapper module.
export namespace Google {
    export const id: string = "{{GOOGLE_TAG}}";

    // Source: https://developers.google.com/analytics/devguides/collection/gajs/#disable
    /**
     * Enable google analytics tracking
     * @nav Fronted/Google
     * @docs
     */
    export function enable_tracking(): void {
        // document.cookie = "ga-opt-out=false; Path=/; SameSite=None;";
        delete window[`ga-disable-${Google.id}`];
    }

    // Source: https://developers.google.com/analytics/devguides/collection/gajs/#disable
    /**
     * Disable google analytics tracking
     * @nav Fronted/Google
     * @docs
     */
    export function disable_tracking(): void {
        // document.cookie = "ga-opt-out=true; Path=/; SameSite=None;";
        window[`ga-disable-${Google.id}`] = true;
    }

    // Auto initialize (internal use).
    function _initialize(): void {
        if (Google.id) {
            // @ts-ignore
            window.dataLayer = window.dataLayer || [];
            function gtag(...args: any[]): void {
                // @ts-ignore
                (window.dataLayer as any[]).push(args);
            }
            gtag('js', new Date());
            gtag('config', Google.id);
        }
    }

    // Google cloud.
    export const cloud = {
        api_key: "{{GOOGLE_COULD_API_KEY}}",
    };

    // Initialize.
    _initialize();
};
export { Google as google }; // also export as lowercase for compatibility.