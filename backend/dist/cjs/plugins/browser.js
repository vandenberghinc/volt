var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  BrowserPreview: () => BrowserPreview,
  default: () => stdin_default
});
module.exports = __toCommonJS(stdin_exports);
var import_playwright = require("playwright");
var import_logger = __toESM(require("../logger.js"));
const { log, error, warn } = import_logger.default;
class BrowserPreview {
  browser_type;
  browser;
  context;
  page;
  /**
   * Initializes the browser_controller with the specified browser type.
   * @param {string} browser - The browser to launch ('chrome' or 'firefox').
   */
  constructor(browser = "chrome") {
    this.browser_type = browser.toLowerCase();
    this.browser = null;
    this.context = null;
    this.page = null;
  }
  /**
   * Starts the browser and opens a new page.
   */
  async start() {
    try {
      if (this.browser_type === "chrome") {
        this.browser = await import_playwright.chromium.launch({
          headless: false,
          // Set to true if you don't need to see the browser
          channel: "chrome",
          // Ensure Chrome is installed on your system
          args: [
            "--ignore-certificate-errors",
            "--allow-insecure-localhost"
          ]
        });
      } else if (this.browser_type === "firefox") {
        this.browser = await import_playwright.firefox.launch({
          headless: false
          // Set to true if you don't need to see the browser
        });
      } else {
        throw new Error(`Unsupported browser type: ${this.browser_type}`);
      }
      this.context = await this.browser.newContext({
        ignoreHTTPSErrors: true,
        viewport: null
      });
      this.page = await this.context.newPage();
      log(0, `${this.browser_type} browser launched successfully.`);
    } catch (error2) {
      error2(`Error launching browser: ${error2.message}`);
    }
  }
  /**
   * Stops the browser and cleans up resources.
   */
  async stop() {
    try {
      if (this.browser) {
        await this.browser.close();
        log(0, `${this.browser_type} browser closed successfully.`);
      }
    } catch (error2) {
      error2(`Error closing browser: ${error2.message}`);
    }
  }
  /**
   * Refreshes the active tab if its URL matches the specified endpoint.
   * @param {string | RegExp} endpoint - The server endpoint URL to check against the active tab.
   */
  async refresh(endpoint) {
    if (!this.page) {
      warn(0, `No page is open. Please call start() first.`);
      return;
    }
    let current_endpoint = this.page.url().replace(/http[s]*:\/\//g, "");
    const index = current_endpoint.indexOf("/");
    if (index !== -1) {
      current_endpoint = current_endpoint.substr(index);
    }
    current_endpoint = this._normalize_url(current_endpoint);
    if (typeof endpoint === "string") {
      endpoint = this._normalize_url(endpoint);
    }
    if (typeof endpoint === "string" && current_endpoint === endpoint || endpoint instanceof RegExp && endpoint.test(current_endpoint)) {
      const scrollPosition = await this.page.evaluate(() => {
        const scrollableElement = document.scrollingElement;
        if (scrollableElement) {
          return {
            x: scrollableElement.scrollLeft,
            y: scrollableElement.scrollTop
          };
        } else {
          return {
            // @ts-ignore
            x: window.scrollX,
            // @ts-ignore
            y: window.scrollY
          };
        }
      });
      await this.page.reload();
      log(2, `Page reloaded because it matches the endpoint: ${endpoint}`);
      await this.page.evaluate(({ x, y }) => {
        const scrollableElement = document.scrollingElement;
        if (scrollableElement) {
          scrollableElement.scrollTo(x, y);
        } else {
          window.scrollTo(x, y);
        }
      }, { x: scrollPosition.x, y: scrollPosition.y });
      log(2, `Scroll position restored to x: ${scrollPosition.x}, y: ${scrollPosition.y}`);
    } else {
      log(2, `Active tab URL (${current_endpoint}) does not match the endpoint (${endpoint}). No action taken.`);
    }
  }
  /**
   * Opens the specified endpoint in the browser.
   * @param {string} endpoint - The URL to navigate to.
   */
  async navigate(endpoint) {
    try {
      if (!this.page) {
        warn(0, `No page is open. Please call start() first.`);
        return;
      }
      await this.page.goto(endpoint);
      log(1, `Navigated to ${endpoint}`);
    } catch (error2) {
      error2(`Error navigating to ${endpoint}: ${error2.message}`);
    }
  }
  /**
   * Normalizes URLs by removing trailing slashes and converting to lowercase.
   * @param {string} url - The URL to normalize.
   * @returns {string} - The normalized URL.
   */
  _normalize_url(url) {
    if (/http[s]*:\/\//.test(url)) {
      url = url.replace(/http[s]*:\/\//g, "");
      const index2 = url.indexOf("/");
      if (index2 !== -1) {
        url = url.substr(index2);
      }
    }
    let index;
    if ((index = url.indexOf("#")) !== -1) {
      url = url.substr(0, index);
    }
    while (url.includes("//")) {
      url = url.replaceAll("//", "/");
    }
    while (url[0] === "/") {
      url = url.slice(1);
    }
    while (url[url.length - 1] === "/") {
      url = url.slice(0, -1);
    }
    return url.toLowerCase();
  }
}
var stdin_default = BrowserPreview;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BrowserPreview
});
