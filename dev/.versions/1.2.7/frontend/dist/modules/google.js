/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */
// Google wrapper module.
const Google = {
    id: "{{GOOGLE_TAG}}",
    // Enable tracking cookies.
    // Source: https://developers.google.com/analytics/devguides/collection/gajs/#disable
    /*  @docs:
        @nav: Frontend
        @chapter: Google
        @title: Enable tracking
        @desc: Enable google analytics tracking
    */
    enable_tracking() {
        // document.cookie = "ga-opt-out=false; Path=/; SameSite=None;";
        delete window[`ga-disable-${this.id}`];
    },
    // Disable tracking cookies.
    // Source: https://developers.google.com/analytics/devguides/collection/gajs/#disable
    /*  @docs:
        @nav: Frontend
        @chapter: Google
        @title: Disable tracking
        @desc: Disable google analytics tracking
    */
    disable_tracking() {
        // document.cookie = "ga-opt-out=true; Path=/; SameSite=None;";
        window[`ga-disable-${this.id}`] = true;
    },
    // Auto initialize (internal use).
    _initialize() {
        if (this.id != null && this.id !== "") {
            // @ts-ignore
            window.dataLayer = window.dataLayer || [];
            function gtag(...args) {
                // @ts-ignore
                window.dataLayer.push(args);
            }
            gtag('js', new Date());
            gtag('config', this.id);
        }
    },
    // Google cloud.
    cloud: {
        api_key: "{{GOOGLE_COULD_API_KEY}}",
    },
};
// Automatically initialize Google.
Google._initialize();
// Exports.
export { Google };
