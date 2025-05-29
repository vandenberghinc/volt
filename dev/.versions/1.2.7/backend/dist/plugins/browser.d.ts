export = BrowserPreview;
declare class BrowserPreview {
    /**
     * Initializes the browser_controller with the specified browser type.
     * @param {string} browser - The browser to launch ('chrome' or 'firefox').
     */
    constructor(browser?: string);
    browser_type: string;
    browser: import("playwright").Browser | null;
    context: import("playwright").BrowserContext | null;
    page: import("playwright").Page | null;
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
     * @param {string} endpoint - The server endpoint URL to check against the active tab.
     */
    refresh(endpoint: string): Promise<void>;
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
