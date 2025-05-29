/**
 * A Route encapsulates an HTTP method and an endpoint pattern (string, colon-style, or RegExp),
 * and provides a `.match()` method which returns true/false and populates `.params` on success.
 */
export declare class Route {
    readonly method: string;
    readonly endpoint: string | RegExp;
    readonly endpoint_str: string;
    readonly id: string;
    readonly is_regex: boolean;
    readonly params: {
        name: string;
        required: boolean;
    }[];
    private matcher?;
    matched_params: Record<string, any>;
    /**
     *
     * @param method   HTTP method (e.g. "GET", "post", etc.)
     * @param endpoint  The endpoint parameter supports the following input type.
     *                  - A regex to match against the request URL, or a string with colon-style path parameters.
     *                  - A string supporting colon-style path parameters (e.g. "/user/:id"), and simple `*` and `**` wildcards.
     *                    Ensure the wildcards are encapsulated by / or at the start of end of the string.
     */
    constructor(method: string, endpoint: string | RegExp);
    /** Create match args
      * @warning this is required for the `match()` method
      */
    static create_match_args(method: string, endpoint: string): {
        method: string;
        endpoint: string;
    };
    /**
     * Tests this route against another Route (e.g. a “request” Route).
     * Returns true/false and on true populates other.params.
     */
    match(other: Route): boolean;
    private _create_route_matcher;
    private static _stringify_endpoint_regex;
    static clean_endpoint(endpoint: RegExp): RegExp;
    static clean_endpoint(endpoint: string): string;
}
