/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */

// Static module
if ((window as any).volt_statics_aspect_ratios === undefined) {
    (window as any).volt_statics_aspect_ratios = {};
}
export const Statics = {
    get aspect_ratios() { 
        return (window as any).volt_statics_aspect_ratios
    },
    set aspect_ratios(aspect_ratios) {
        (window as any).volt_statics_aspect_ratios = aspect_ratios;
    },
    
    /**
     * Retrieve the aspect ratio of a static endpoint.
     * 
     * All aspect ratios are embedded into the compiled HTML document.
     * 
     * @warning This function only works when the endpoint has been defined using the `Endpoint.view` attribute.
     * 
     * @param endpoint The static image endpoint.
     * 
     * @nav Frontend/Static
     * @docs
     */
    aspect_ratio(endpoint: string) {
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
}
export { Statics as statics }; // also export as lowercase for compatibility.