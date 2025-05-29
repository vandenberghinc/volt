export declare class BrowserPreview {
    private browser_type;
    private browser;
    private context;
    private page;
    /**
     * Initializes the browser_controller with the specified browser type.
     * @param {string} browser - The browser to launch ('chrome' or 'firefox').
     */
    constructor(browser?: string);
    /**
     * Starts the browser and opens a new page.
     */
    start(): Promise<void>;
    /**
     * Stops the browser and cleans up resources.
     */
    stop(): Promise<void>;
    /**
     * Refreshes the active tab if its URL matches the specified endpoint.
     * @param {string | RegExp} endpoint - The server endpoint URL to check against the active tab.
     */
    refresh(endpoint: string | RegExp): Promise<void>;
    /**
     * Opens the specified endpoint in the browser.
     * @param {string} endpoint - The URL to navigate to.
     */
    navigate(endpoint: string): Promise<void>;
    /**
     * Normalizes URLs by removing trailing slashes and converting to lowercase.
     * @param {string} url - The URL to normalize.
     * @returns {string} - The normalized URL.
     */
    _normalize_url(url: string): string;
}
export default BrowserPreview;
