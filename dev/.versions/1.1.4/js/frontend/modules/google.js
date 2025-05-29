/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Google wrapper module.
vweb.google = {}
vweb.google.id = "{{GOOGLE_TAG}}";

// Enable tracking cookies.
// Source: https://developers.google.com/analytics/devguides/collection/gajs/#disable
/*  @docs:
    @nav: Frontend
    @chapter: Google
    @title: Enable tracking
    @desc: Enable google analytics tracking
 */
vweb.google.enable_tracking = function() {
	// document.cookie = "ga-opt-out=false; Path=/; SameSite=None;";
    delete window[`ga-disable-${vweb.google.id}`];
}

// Disable tracking cookies.
// Source: https://developers.google.com/analytics/devguides/collection/gajs/#disable
/*  @docs:
    @nav: Frontend
    @chapter: Google
    @title: Disable tracking
    @desc: Disable google analytics tracking
 */
vweb.google.disable_tracking = function() {
	// document.cookie = "ga-opt-out=true; Path=/; SameSite=None;";
    window[`ga-disable-${vweb.google.id}`] = true;
}

// Auto initialize.
// vweb.google._initialize = function() {
    if (vweb.google.id != null && vweb.google.id != "") {
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', vweb.google.id);
        // if (vweb.cookies.is_accepted()) {
        //     vweb.google.enable_tracking();
        // } else {
        //     vweb.google.disable_tracking();
        // }
    }
// }