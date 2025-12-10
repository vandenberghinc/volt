/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
// Google wrapper module.
export var Google;
(function (Google) {
    Google.id = "{{GOOGLE_TAG}}";
    // Source: https://developers.google.com/analytics/devguides/collection/gajs/#disable
    /**
     * Enable google analytics tracking
     * @nav Fronted/Google
     * @docs
     */
    function enable_tracking() {
        // document.cookie = "ga-opt-out=false; Path=/; SameSite=None;";
        delete window[`ga-disable-${Google.id}`];
    }
    Google.enable_tracking = enable_tracking;
    // Source: https://developers.google.com/analytics/devguides/collection/gajs/#disable
    /**
     * Disable google analytics tracking
     * @nav Fronted/Google
     * @docs
     */
    function disable_tracking() {
        // document.cookie = "ga-opt-out=true; Path=/; SameSite=None;";
        window[`ga-disable-${Google.id}`] = true;
    }
    Google.disable_tracking = disable_tracking;
    // Auto initialize (internal use).
    function _initialize() {
        if (Google.id && typeof window !== "undefined") {
            // @ts-ignore
            window.dataLayer = window.dataLayer || [];
            function gtag(...args) {
                // @ts-ignore
                window.dataLayer.push(args);
            }
            gtag('js', new Date());
            gtag('config', Google.id);
        }
    }
    // Google cloud.
    Google.cloud = {
        api_key: "{{GOOGLE_COULD_API_KEY}}",
    };
    // Initialize.
    _initialize();
})(Google || (Google = {}));
;
export { Google as google }; // also export as lowercase for compatibility.
