/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// Google wrapper module.
vweb.google = {}
vweb.google.id = "{{GOOGLE_TAG}}";

// Enable tracking cookies.
// Source: https://developers.google.com/analytics/devguides/collection/gajs/#disable
vweb.google.enable_tracking = function() {
	document.cookie = "ga-opt-out=false; Path=/; SameSite=None;";
}

// Disable tracking cookies.
// Source: https://developers.google.com/analytics/devguides/collection/gajs/#disable
vweb.google.disable_tracking = function() {
	document.cookie = "ga-opt-out=true; Path=/; SameSite=None;";
}

// Auto initialize.
if (vweb.google.id != null && vweb.google.id != "") {
	window.dataLayer = window.dataLayer || [];
	function gtag(){dataLayer.push(arguments);}
	gtag('js', new Date());
	gtag('config', vweb.google.id);
}