/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Google wrapper module.
vweb.static = {}
vweb.static.aspect_ratios = {};

// Enable tracking cookies.
// Source: https://developers.google.com/analytics/devguides/collection/gajs/#disable
/*  @docs:
    @nav: Frontend
    @chapter: Static
    @title: Aspect Ratio
    @desc:
        Retrieve the aspect ratio of a static endpoint.

        All aspect ratio are embedded into the compiled HTML document.
    @warning:
        This function only works when the endpoint has been defined using the `Endpoint.view` attribute.
    @param:
        @name: endpoint
        @type: string
        @descr: The static image endpoint.
 */
vweb.static.aspect_ratio = function(endpoint) {
    if (endpoint.first() !== "/") {
        endpoint = "/" + endpoint;
    }
    let index = endpoint.indexOf("?");
    if (index !== -1) {
        endpoint = endpoint.substr(0, index);
    }
    endpoint = endpoint.replaceAll("//", "/");
    while (endpoint.last() === "/") {
        endpoint = endpoint.substr(0, endpoint.length - 1);
    }
	return vweb.static.aspect_ratios[endpoint];
}