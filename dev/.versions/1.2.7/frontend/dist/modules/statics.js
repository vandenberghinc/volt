/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */
// Google wrapper module.
const Statics = {
    aspect_ratios: {},
    /*  @docs:
        @nav: Frontend
        @chapter: Static
        @title: Aspect Ratio
        @desc:
            Retrieve the aspect ratio of a static endpoint.

            All aspect ratios are embedded into the compiled HTML document.
        @warning:
            This function only works when the endpoint has been defined using the `Endpoint.view` attribute.
        @param:
            @name: endpoint
            @type: string
            @descr: The static image endpoint.
    */
    aspect_ratio(endpoint) {
        if (endpoint.charAt(0) !== "/") {
            endpoint = "/" + endpoint;
        }
        const index = endpoint.indexOf("?");
        if (index !== -1) {
            endpoint = endpoint.substring(0, index);
        }
        endpoint = endpoint.replace(/\/\//g, "/");
        while (endpoint.charAt(endpoint.length - 1) === "/") {
            endpoint = endpoint.substring(0, endpoint.length - 1);
        }
        return this.aspect_ratios[endpoint];
    }
};
// Export.
export { Statics };
