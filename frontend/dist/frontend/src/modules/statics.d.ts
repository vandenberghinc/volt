/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
export declare const Statics: {
    aspect_ratios: any;
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
    aspect_ratio(endpoint: string): any;
};
export { Statics as statics };
