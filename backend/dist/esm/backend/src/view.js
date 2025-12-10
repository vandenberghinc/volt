/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
// ---------------------------------------------------------
// Imports.
import * as vlib from "@vandenberghinc/vlib";
import * as vts from "@vandenberghinc/vlib/vts";
import * as vhighlight from "@vandenberghinc/vhighlight";
import zlib from 'zlib';
import { Meta } from "./meta.js";
import { Route } from './route.js';
import { Frontend } from './frontend.js';
import * as crypto from "crypto";
import { Utils } from "./utils.js";
const { debug } = vlib;
// ---------------------------------------------------------
// View.
// @todo add template vars for callback and css and js include files. 
/**
 * @nav Backend
 * @chapter Endpoints
 * @title View
 * @class
 *
 * @param source
 *   The file path to the client side JavaScript source code.
 *
 * @param callback
 *   The client side callback function; this function will be executed at the client side.
 *   For this feature the `Content-Security-Policy: script-src` must be updated with, for example, `unsafe-inline`.
 *
 * @param includes
 *   The included static JS files.
 *
 *   By default, the local includes will be embedded into the HTML page. However, this behaviour can be disabled by passing an object of type `IncludeObject` with the attribute `embed = false`.
 *
 * @param links
 *   The included static CSS files.
 *
 *   By default, the local links will be embedded into the HTML page. However, this behaviour can be disabled by passing an object of type `LinkObject` with the attribute `embed = false`.
 *
 * @param templates
 *   Templates that will replace the `callback` code. Templates can be created using the `$TEMPLATE` template style.
 *
 * @warning
 *   Templates will only be used on the code of the `callback` attribute.
 *
 * @param meta
 *   The meta information object.
 *
 * @param jquery
 *   Include jQuery by default.
 *
 * @param body_style
 *   The style of the `<body>` element. When left undefined, the static attribute `View.body_style` will be used.
 *
 * @param splash_screen
 *   The splash screen settings. When left undefined, the static attribute `View.splash_screen` will be used.
 *
 * @param tree_shaking
 *   Optimize JavaScript source code by removing dead code.
 *
 * @param mangle
 *   Optimize JavaScript source code by mangling function names.
 *
 * @param _src
 *   Internal parameter (ignored).
 *
 * @typedef IncludeObject
 * @property src
 *   The source URL of the script to include. (required)
 * @property embed
 *   When set to `false`, disables embedding the endpoint's content into the HTML page.
 * @property attributes
 *   Any other attributes will be assigned to the `<script>` tag.
 *
 * @typedef LinkObject
 * @property href
 *   The source URL of the link to include. (required)
 * @property rel
 *   The `rel` attribute of the link tag.
 * @property embed
 *   When set to `false`, disables embedding the endpoint's content into the HTML page.
 * @property attributes
 *   Any other attributes will be assigned to the `<link>` tag.
 *
 * @static
 * @memberof View
 * @member body_style
 *   The style of the `<body>` element. This static attribute will be used on all Views when defined. However,
 *   it can be overridden for a single View by defining the parameter.
 *
 * @static
 * @memberof View
 * @member splash_screen
 *   The splash screen settings. This static attribute will be used on all Views when defined. However,
 *   it can be overridden for a single View by defining the parameter.
 */
export class View {
    // Global settings.
    static includes = [];
    static links = [];
    static body_style = null; // css string style.
    static splash_screen = undefined; // SplashScreen object.
    // Private static attributes,
    static _volt_css;
    static _vhighlight_css;
    // Attributes.
    source;
    source_path;
    callback;
    includes;
    links;
    templates;
    meta;
    jquery;
    lang;
    body_style;
    splash_screen;
    tree_shaking;
    mangle;
    _src;
    _embedded_sources;
    is_js_ts_view;
    _html;
    raw_html;
    _bundle;
    payments;
    // vhighlight?: string | undefined;
    min_device_width;
    server;
    endpoint;
    /**
     * Clone this view, used to create a modified copy of the current view.
     * @note
     * The following attributes are not deep copied, but just referenced:
     * - `callback`
     * - `params`
     * - `data`
     * @param override Override specific endpoint options, note that this will be shallow merged.
     */
    clone(override) {
        return new View({
            ...vlib.Object.deep_copy({
                source: this.source,
                callback: this.callback,
                includes: this.includes,
                links: this.links,
                templates: this.templates,
                jquery: this.jquery,
                lang: this.lang,
                body_style: this.body_style,
                tree_shaking: this.tree_shaking,
                mangle: this.mangle,
                min_device_width: this.min_device_width,
                _src: this._src,
            }),
            meta: this.meta.copy(),
            splash_screen: this.splash_screen?.clone(),
            ...override,
        });
    }
    // Constructor.
    constructor({ source = null, callback = null, includes = [], links = [], templates = {}, meta = new Meta(), jquery = false, lang = "en", body_style = null, splash_screen = undefined, tree_shaking = false, mangle = false, min_device_width = 600, _src, }) {
        // Arguments.
        this.source = source;
        this.callback = callback;
        this.includes = [...View.includes, ...includes];
        this.links = [...View.links, ...links];
        this.templates = templates;
        this.meta = meta;
        this.jquery = jquery;
        this.lang = lang;
        this.body_style = body_style ?? View.body_style;
        this.splash_screen = splash_screen ?? View.splash_screen;
        this.tree_shaking = tree_shaking;
        this.mangle = mangle;
        this.min_device_width = min_device_width;
        // System arguments.
        this._src = _src;
        this._embedded_sources = [];
        // Clean source, required to match against endpoint's.
        if (this.source != null) {
            this.source_path = new vlib.Path(this.source);
            if (!this.source_path.exists()) {
                throw new Error(`Defined source path "${this.source}" does not exist.`);
            }
            this.source_path = this.source_path.abs();
            this.source = this.source_path.str();
        }
        // Is js/ts bundle view.
        this.is_js_ts_view = this.source_path != null && /\.(jsx?|tsx?)/.test(this.source_path.extension());
        // Check args.
        if (typeof source !== "string" && typeof callback !== "function") {
            throw Error("Invalid usage, define either parameter \"source\" or \"callback\".");
        }
        // Drop duplicate includes.
        this.includes = vlib.Array.drop_duplicates(this.includes);
        // Attributes.
        this._html = undefined;
        this._bundle = undefined;
    }
    // Initialize.
    initialize(server, endpoint) {
        if (server === undefined) {
            throw Error("Invalid usage, define parameter \"server\".");
        }
        if (endpoint === undefined) {
            throw Error("Invalid usage, define parameter \"endpoint\".");
        }
        this.server = server;
        this.endpoint = endpoint;
    }
    /** Production initialization. */
    async production_initialize() {
        await this.ensure_bundle();
        await this._build_html();
    }
    // Bundle the compiled typescript / javascript dynamically on demand to optimize server startup for development purposes.
    async _dynamic_bundle() {
        // Server & endpoint.
        if (this.server === undefined || this.endpoint === undefined) {
            throw Error("View has not been initialized with \"View._initialize()\" yet.");
        }
        // Bundle.
        debug(3, this.endpoint?.route?.id, `: Bundling entry path "${this.source_path?.str()}".`);
        this._bundle = await vts.bundle({
            include: this.source_path ? [this.source_path?.str()] : [],
            output: `/tmp/${this.endpoint.route.method}_${this.source_path.str().replace(/\//g, "_")}.js`, // esbuild requires an output path to resolve .css and .ttf files etc which can be imported by libraries (such as monaco-editor).
            minify: false, //this._server.production,
            platform: "browser",
            format: "esm",
            // format: "iife", // can causes issues with node_modules imports.
            target: "es2022",
            // sourcemap: this.server.production ? false : "inline",
            extract_inputs: true, // since bundle.inputs is used by server.js.
            tree_shaking: true,
        });
        // Set options based on inputs.
        this.payments = this._bundle.inputs.find((path) => path.endsWith("/modules/paddle.js"));
        // this.vhighlight = this.bundle.inputs.find((path: string) => path.endsWith("/vhighlight.js"));
    }
    /** Ensure the view is bundled when required. */
    async ensure_bundle() {
        if (this.is_js_ts_view && !this._bundle) {
            return this._dynamic_bundle();
        }
    }
    /** Create an error HTML file when errors are encountered during the bundle process. */
    async _build_bundle_err_html() {
        // Dont show in production.
        if (this.server?.production) {
            throw new Error("Encountered an error while bundling in production.");
        }
        // A nonce identifier.
        const nonce_identifier = "{{__VOLT_NONCE__}}";
        // Inspect bundle.
        const bundle = await vts.inspect_bundle({
            include: this.source_path ? [this.source_path?.str()] : [],
            output: vlib.Path.tmp().join(`${this.endpoint?.route.method}_${this.source_path.str().replace(/\//g, "_")}.js`), // esbuild requires an output path to resolve .css and .ttf files etc which can be imported by libraries (such as monaco-editor).
            minify: false, //this._server.production,
            platform: "browser",
            format: "esm",
            // format: "iife", // can causes issues with node_modules imports.
            target: "es2022",
            tree_shaking: true,
        });
        // Log to server
        this.server?.log.error(this.endpoint?.route?.id, `: Encountered an error while bundling "${this.source}".\n${bundle.debug({ limit: 25 })}`);
        // HTML escape function
        const escape_html = (str) => vlib.Color.to_html(str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;'));
        if (this.server?.production) {
            this._html = `
                <!DOCTYPE html>
                <html lang='${this.lang}'>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <title>Bundling Error</title>
                    <style nonce="${nonce_identifier}">
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 2rem; background: #f5f5f5;
                        }
                        h1 {
                            color: #d32f2f; margin-top: 0;
                        }
                        #error-container {
                            max-width: 800px; margin: 0 auto; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        }
                    </style>
                </head>
                <body>
                    <div id="error-container">
                        <h1>Bundling Error</h1>
                        <p>An error occurred while processing your request. Please contact support if this issue persists.</p>
                    </div>
                </body>
                </html>
                `.dedent(false);
        }
        else {
            // Development mode - show full debug info
            const formatted_import_chains = bundle.format_import_chains();
            const formatted_errors = bundle.format_errors();
            this._html = `
                <!DOCTYPE html>
                <html lang='${this.lang}'>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <title>Bundling Error - ${escape_html(this.source || 'Unknown')}</title>
                    <style nonce="${nonce_identifier}">
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                            margin: 0;
                            padding: 1rem;
                            background: #1e1e1e;
                            color: #d4d4d4;
                        }
                        .container {
                            max-width: 1200px;
                            margin: 0 auto;
                        }
                        h1 {
                            color: #FFFFFF;
                            font-size: 1.5rem;
                            margin-bottom: 0.5rem;
                        }
                        .source {
                            color: #C0C0C0;
                            font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
                            font-size: 0.875rem;
                            margin-bottom: 1rem;
                        }
                        pre {
                            background: #2d2d2d;
                            border: 1px solid #3e3e3e;
                            border-radius: 4px;
                            padding: 1rem;
                            overflow-x: auto;
                            font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
                            font-size: 0.875rem;
                            line-height: 1.5;
                            margin: 20px 0px 0px 0px;
                        }
                        .error-count {
                            background: #f44336;
                            color: white;
                            padding: 0.25rem 0.5rem;
                            border-radius: 4px;
                            font-size: 0.875rem;
                            display: inline-block;
                            margin-bottom: 1rem;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Bundle Error</h1>
                        <div class="source">Source: ${escape_html(this.source || 'Unknown')}</div>
                        <div class="error-count">${bundle.errors.length} error${bundle.errors.length === 1 ? '' : 's'}</div>
                        <pre>${escape_html(bundle.debug({ limit: -1 }))}</pre>
                        <!--<h2>Metafile</h2>
                        <pre>${escape_html(bundle.metafile ?? "No metafile detected.")}</pre>
                        <h2>Input files</h2>
                        <pre>${escape_html(bundle.inputs.length ? bundle.inputs.join("\n") : "No input files detected.")}</pre>
                        <h2>Import Chains</h2>
                        <pre>${escape_html(formatted_import_chains.length
                ? formatted_import_chains.join("\n")
                : "No import chains detected.")}</pre>
                        <h2>Encountered Errors</h2>
                        <pre>${escape_html(formatted_errors.length ? formatted_errors.join("\n") : "No errors detected.")}</pre>
                        -->
                    </div>
                </body>
                </html>
                `.dedent(false);
        }
        this.html_nonce_split = this._html.split(nonce_identifier);
    }
    // Build html.
    async _build_html() {
        // A nonce identifier.
        const nonce_identifier = "{{__VOLT_NONCE__}}";
        // Server & endpoint.
        if (this.server == null || this.endpoint == null) {
            throw Error("View has not been initialized with \"View._initialize()\" yet.");
        }
        // Bundle js files automatically.
        if (this.is_js_ts_view && !this._bundle) {
            await this._dynamic_bundle();
        }
        if (this._bundle != null && this._bundle.errors.length > 0) {
            return this._build_bundle_err_html();
        }
        // Vars.
        const line_break = this.server.production ? "\n" : "\n";
        const has_bundle = this._bundle != null && typeof this._bundle === "object";
        // console.log("Bundle:", this._bundle)
        // Initialize html.
        this._html = "";
        // Doctype.
        this._html += `<!DOCTYPE html><html lang='${this.lang}'>${line_break}`;
        // Headers.
        this._html += `<head>${line_break}`;
        // Meta.
        if (this.meta) {
            this._html += this.meta.build_html(this.server.full_domain) + line_break;
        }
        // this.html = "Hello World!";
        // return;
        // ------------------------------------------------------------------------------------------
        // Stylesheets & links.
        // Default stylesheet to avoid inline `style=""`.
        this._html += `<style nonce="${nonce_identifier}">` +
            `html { min-width:100%;min-height:100%; }` +
            `body { width:100vw;height:100vh;margin:0;padding:0;${this.body_style ?? ""} }` +
            `</style>${line_break}`;
        // Embed stylesheet.
        const embed_stylesheet = (url, embed) => {
            if (embed == null &&
                url != null &&
                url.charAt(0) === "/") {
                for (const endpoint of this.server.endpoints.values()) {
                    if (url === endpoint.route.endpoint_str) {
                        if (typeof endpoint.raw_data === "string") {
                            embed = endpoint.raw_data;
                        }
                        else if (typeof endpoint.data === "string") {
                            embed = endpoint.data;
                        }
                        break;
                    }
                }
            }
            if (embed) {
                this._html += `<style nonce="${nonce_identifier}">${line_break}${embed}${line_break}</style>${line_break}`;
                if (url) {
                    this._embedded_sources.push(url);
                }
                return true;
            }
            return false;
        };
        // Include a link async.
        let include_links_script = null;
        const include_link_async = (link) => {
            if (include_links_script == null) {
                include_links_script = "async function __incl_lnk(args){var link = document.createElement('link');for (let key in args) {if (args.hasOwnProperty(key)){link.setAttribute(key,args[key])}}document.head.appendChild(link)}" + line_break;
            }
            if (link.rel == null) {
                link.rel = "stylesheet";
            }
            include_links_script += `__incl_lnk(${JSON.stringify(link)});${line_break}`;
        };
        // Stylesheets.
        if (!View._volt_css) {
            View._volt_css = await new vlib.Path(Frontend.css.volt).load();
        }
        if (!View._vhighlight_css) {
            View._vhighlight_css = await new vlib.Path(vhighlight.web_exports.css).load();
        }
        embed_stylesheet(undefined, View._volt_css);
        embed_stylesheet(undefined, View._vhighlight_css);
        // Add custom stylesheet for minimum device width on smaller screens.
        if (this.min_device_width != null) {
            this._html += `
                <script nonce="${nonce_identifier}">
                let has_min_width = false;
                const viewport = document.querySelector('meta[name="viewport"]');
                function set_min_width() {
                    const device_width = window.innerWidth;
                    // console.log("Device width [" + device_width + "] below min_device_width [${this.min_device_width} =", (device_width <= ${this.min_device_width}).toString() + "]");
                    if (device_width <= ${this.min_device_width}) {
                        const content = 'width=${this.min_device_width}, initial-scale=' + (device_width / ${this.min_device_width});
                        // console.log("Below ${this.min_device_width}", {content, width: device_width, has_min_width, viewport: viewport.getAttribute('content')});
                        if (viewport.getAttribute('content') !== content) {
                            // console.log('set min width viewport', device_width, device_width / ${this.min_device_width})
                            viewport.setAttribute('content', content);
                            has_min_width = true;
                        }
                    } else if (has_min_width) {
                        // console.log('disable min width viewport', device_width)
                        viewport.setAttribute('content', 'width=device-width, initial-scale=1');
                        has_min_width = false;
                    }
                }
                let timeout_load; window.addEventListener('load', () => {clearTimeout(timeout_load); timeout_load = setTimeout(set_min_width, 25); } );
                let timeout_resize; window.addEventListener('resize', () => {clearTimeout(timeout_resize); timeout_resize = setTimeout(set_min_width, 25); } );
                set_min_width();
                </script>
            `.dedent();
        }
        // this.html += `<script nonce="${nonce_identifier}">
        // // This version prevents the infinite loop
        // let resizeTimeout;
        // let viewportChangeInProgress = false;
        // const viewport = document.querySelector('meta[name="viewport"]');
        // const originalContent = viewport.getAttribute('content');
        // function set_min_width() {
        //     // Don't run if we're already processing a viewport change
        //     if (viewportChangeInProgress) return;
        //     // Clear any pending resize timeouts
        //     clearTimeout(resizeTimeout);
        //     // Set a small delay to prevent rapid successive calls
        //     resizeTimeout = setTimeout(() => {
        //         viewportChangeInProgress = true;
        //         if (window.innerWidth < 400) {
        //             // Only update if needed
        //             viewport.setAttribute('content', \`width = 400, initial - scale\${ window.innerWidth / 400 }, maximum - scale=1\`);
        //         } else {
        //             // Restore original viewport
        //             viewport.setAttribute('content', originalContent);
        //         }
        //         // Allow future updates after a delay
        //         setTimeout(() => {
        //             viewportChangeInProgress = false;
        //         }, 300);
        //     }, 200);
        // }
        // window.addEventListener('DOMContentLoaded', set_min_width);
        // window.addEventListener('orientationchange', set_min_width);
        // </script>`
        // Custom links.
        this.links.forEach((url) => {
            if (typeof url === "string") {
                this._html += `<link rel="stylesheet" href="${url}">`;
            }
            else if (typeof url === "object") {
                // Embed content.
                if ((typeof url === "object" && url.rel === "stylesheet" && url.embed !== true && typeof url.href === "string") &&
                    embed_stylesheet(Route.clean_endpoint(url.href))) { /* skip */ }
                // Create link.
                else {
                    if (url.async) {
                        include_link_async(url);
                    }
                    else {
                        this._html += "<link";
                        Object.keys(url).forEach((key) => {
                            if (key !== "embed") {
                                this._html += ` ${key}="${url[key]}"`;
                            }
                        });
                        this._html += ">" + line_break;
                    }
                }
            }
            else {
                throw Error("Invalid type for a css include, the valid value types are \"string\" and \"object\".");
            }
        });
        // Add include links script.
        if (include_links_script) {
            this._html += `<script nonce="${nonce_identifier}">${line_break}${include_links_script}${line_break}</script>${line_break}`;
        }
        // End headers.
        this._html += "</head>" + line_break;
        // ------------------------------------------------------------------------------------------
        // Body.
        // Body.
        this._html += "<body id='body'>";
        // Create splash screen.
        if (this.splash_screen != null) {
            this._html += this.splash_screen.html + line_break;
        }
        // ------------------------------------------------------------------------------------------
        // Include scripts.
        // Embed the data of an endpoint.
        // Returns `false` when the endpoint is not found.
        const embed_script = (url) => {
            let embed;
            for (const endpoint of this.server.endpoints.values()) {
                if (url === endpoint.route.endpoint_str &&
                    (endpoint.raw_data != null || endpoint.data != null)) {
                    embed = endpoint;
                }
            }
            // Check if the endpoint has data or raw data to embed.
            if (embed && (embed.raw_data || embed.data)) {
                // Dont embed code.
                if (embed.content_type === "application/javascript") {
                    this._html += `<script nonce="${nonce_identifier}">${line_break}${embed.raw_data || embed.data}${line_break}</script>${line_break}`;
                }
                else {
                    this._html += `<script nonce="${nonce_identifier}" type='${embed.content_type}'>${line_break}${embed.raw_data || embed.data}${line_break}</script>${line_break}`;
                }
                this._embedded_sources.push(url);
                return true;
            }
            return false;
        };
        // Include js.
        let include_js_script = `async function __volt_incl_js(url, async = true) {var script=document.createElement('script');if(async){script.async = true;}script.src=url;document.head.appendChild(script);};${line_break}`;
        // 3rd party js includes.
        if (this.jquery) {
            // Keep first since it needs to be included before volt.
            this._html += `<script nonce="${nonce_identifier}" src='https://ajax.googleapis.com/ajax/libs/jquery/3.6.4/jquery.min.js'></script>${line_break}`;
        }
        if (this.server.google_tag !== undefined) {
            // this.html += `<script async src="https://www.googletagmanager.com/gtag/js?id=${this._server.google_tag}" onload='volt.google._initialize()'></script>`;
            include_js_script += `__volt_incl_js("https://www.googletagmanager.com/gtag/js?id=${this.server.google_tag}");${line_break}`;
        }
        // Primary volt includes do not add them to cached_code since they need to be included before any other includes.
        // Otherwise when including several files, most of them embedded and one not, then the not embedded will not have access to volt.
        // Since volt is 
        // embed_script("/volt/api/v1/volt.js", false);
        // Add volt static aspect ratios.
        // @todo volt.static
        this._html += `<script nonce="${nonce_identifier}">${line_break}window.volt_statics_aspect_ratios = ${JSON.stringify(Object.fromEntries(this.server.statics_aspect_ratios))}${line_break}</script>${line_break}`;
        // Embed other scripts.
        if (this.server.payments) {
            if (this.server.payments.type === "paddle") {
                // embed_script("/volt/api/v1/payments/paddle.js", false); // no longer required due to auto imports.
                if (this.payments) {
                    include_js_script += `__volt_incl_js("https://cdn.paddle.com/paddle/v2/paddle.js");${line_break}`;
                }
            }
        }
        // Add the include js script.
        this._html += `<script nonce="${nonce_identifier}">${line_break}${include_js_script.trimEnd()}${line_break}</script>${line_break}`;
        // Additional js includes.
        this.includes.forEach((url) => {
            // Embed content.
            if (typeof url === "string" && embed_script(url)) { /* skip. */ }
            // Include.
            else {
                if (typeof url === "string") {
                    this._html += `<script nonce="${nonce_identifier}" src='${url}'></script>${line_break}`;
                }
                else if (typeof url === "object") {
                    this._html += `<script nonce="${nonce_identifier}"`;
                    Object.keys(url).forEach((key) => {
                        if (key !== "embed") {
                            this._html += ` ${key}="${url[key]}"`;
                        }
                    });
                    this._html += "></script>" + line_break;
                }
                else {
                    throw Error("Invalid type for a js include, the valid value types are \"string\" and \"object\".");
                }
            }
        });
        // Add direct source code.
        if (has_bundle && this._bundle != null && typeof this._bundle.code === "string") {
            this._html += `<script nonce="${nonce_identifier}" type='module'>${line_break}${this._bundle.code}${line_break}</script>${line_break}`;
        }
        // Include the source.
        else if (typeof this.source === "string") {
            this._html += `<script nonce="${nonce_identifier}">${line_break}${await new vlib.Path(this.source).load()}${line_break}</script>${line_break}`;
        }
        // JS code.
        else if (this.callback != null) {
            let code = this.callback.toString();
            // @deprecated compile using vhighlight, now esbuild is used for bundling, callback is not supported yet.
            // // Fill templates.
            // const code_hash = this._server.hash(code);
            // // Check cache.
            // const { cache_path, cache_hash, cache_data } = utils.get_compiled_cache(this._server.domain, this._endpoint.method, this._endpoint.endpoint);
            // if (cache_data && code_hash === cache_hash) {
            //     code = cache_data;
            // } else {
            //     // Compile.
            //     const compiler = new vhighlight.JSCompiler({
            //         line_breaks: true,
            //         double_line_breaks: true,
            //         comments: false,
            //         white_space: false,
            //     })
            //     try {
            //         code = compiler.compile_code(code, this._src);
            //     } catch (err) {
            //         console.error("JS Compile error:");
            //         console.error(err);
            //     }
            //     // Cache for restarts.
            //     utils.set_compiled_cache(cache_path, code, code_hash);
            // }
            // Add.
            this._html += `<script nonce="${nonce_identifier}">${line_break}(${code})()${line_break}</script>${line_break}`;
            // cached_code += `;(${code})();`;
        }
        // Close body.
        this._html += "</body>" + line_break;
        // End.
        this._html += "</html>" + line_break;
        // Split by nonce.
        this.html_nonce_split = this._html.split(nonce_identifier);
        // console.log("Built HTML for endpoint", this.endpoint?.route?.endpoint_str + "\n" +this.html.slice(0, 25_000) + (this.html.length > 25_000 ? "..." : ""));
    }
    /** Retrieve the content length of the built html. */
    async content_length() {
        // Create nonce.
        const nonce = crypto.randomBytes(16).toString('base64');
        // Build html if needed.
        if (!this._html) {
            await this._build_html();
        }
        // Create html.
        let html = this.html_nonce_split.join(nonce);
        // Return.
        return html.length;
    }
    /** Retrieve the HTML. */
    async html(opts) {
        // Create nonce.
        const nonce = crypto.randomBytes(16).toString('base64');
        // Build html if needed.
        if (!this._html) {
            await this._build_html();
        }
        // Create html.
        let html = this.html_nonce_split.join(nonce);
        // Apply templates.
        const templates = { ...this.templates, ...opts?.templates ?? {} };
        if (Object.keys(templates).length) {
            html = Utils.fill_templates(html, templates, true /** curly style */);
        }
        // Content length.
        const content_length = Buffer.byteLength(html, 'utf-8');
        // Compress.
        if (opts?.compress) {
            html = zlib.gzipSync(html, { level: zlib.constants.Z_BEST_COMPRESSION });
        }
        // Return.
        return {
            html,
            content_length,
            nonce,
        };
    }
    // Serve a client.
    async _serve(stream, status_code = 200, opts) {
        debug(2, this.endpoint?.route?.id, ": Serving HTML ", this._html?.slice(0, 50), "...");
        // Create html.
        const html = await this.html(opts);
        // Compute content length on view & when not defined.
        stream.set_header("Content-Length", html.content_length.toString());
        // Set nonce.
        const csp = stream.get_header("Content-Security-Policy");
        if (typeof csp === "string") {
            const new_csp = csp.replace(/(script-src|style-src)([^;]*)/g, (_, g1, g2) => `${g1}${g2} 'nonce-${html.nonce}'`);
            stream.set_header("Content-Security-Policy", new_csp);
        }
        // Generate a nonce here and use it both in the CSP header and the inline script.
        stream.send({
            status: status_code,
            headers: { "Content-Type": "text/html" },
            data: html.html,
        });
    }
    html_nonce_split;
}
