/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Imports.

import * as vlib from "@vandenberghinc/vlib";
import * as vts from "@vandenberghinc/vlib/vts";
import * as vhighlight from "@vandenberghinc/vhighlight";
import utils from "./utils.js";
import Meta from "./meta.js";
import logger from "./logger.js";
import { Route } from './route.js';
import Frontend from './frontend.js';
import { Endpoint } from "./endpoint.js";
import Server from "./server.js";

const { log, error } = logger;
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
    static includes: Array<string | Record<string, any>> = [];
    static links: Array<string | Record<string, any>> = [];
    static body_style: string | null = null; // css string style.
    static splash_screen: any = null; // SplashScreen object.

    // Private static attributes,
    private static _volt_css?: string;
    private static _vhighlight_css?: string;

    // Attributes.
    source: string | null;
    source_path?: vlib.Path;
    callback: Function | null;
    includes: Array<string | Record<string, any>>;
    links: Array<string | Record<string, any>>;
    templates: Record<string, any>;
    meta: Meta;
    jquery: boolean;
    lang: string;
    body_style: string | null;
    splash_screen: any;
    tree_shaking: boolean;
    mangle: boolean;
    _src?: string;
    _embedded_sources: Array<string>;
    is_js_ts_view: boolean;
    html?: string | Buffer;
    raw_html?: string | Buffer;
    _bundle: any;
    payments?: string | undefined;
    // vhighlight?: string | undefined;
    min_device_width?: number;
    _server?: Server;
    _endpoint?: Endpoint;

    // Constructor.
    constructor({
        source = null,
        callback = null,
        includes = [],
        links = [],
        templates = {},
        meta = new Meta(),
        jquery = false,
        lang = "en",
        body_style = null,
        splash_screen = null,
        tree_shaking = false,
        mangle = false,
        min_device_width = 600,
        _src,
    }: {
        source?: string | null;
        callback?: Function | null;
        includes?: (string | Record<string, any>)[];
        links?: (string | Record<string, any>)[];
        templates?: Record<string, any>;
        meta?: Meta;
        jquery?: boolean;
        lang?: string;
        body_style?: string | null;
        splash_screen?: any;
        tree_shaking?: boolean;
        mangle?: boolean;
        min_device_width?: number,
        _src?: string;
    }) {
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
        this.html = undefined;
        this._bundle = undefined;
    }

    // Initialize.
    _initialize(server: Server, endpoint: Endpoint): void {
        if (server === undefined) { throw Error("Invalid usage, define parameter \"server\"."); }
        if (endpoint === undefined) { throw Error("Invalid usage, define parameter \"endpoint\"."); }
        this._server = server;
        this._endpoint = endpoint;
    }

    // Bundle the compiled typescript / javascript dynamically on demand to optimize server startup for development purposes.
    private async _dynamic_bundle(): Promise<void> {

        // Server & endpoint.
        if (this._server === undefined || this._endpoint === undefined) { throw Error("View has not been initialized with \"View._initialize()\" yet."); }

        // Bundle.
        // const had_bundle = this.bundle !== undefined;
        // if (bundle != null) {
        //     // also accept already bundled for server.js in case multiple endpoint paths serve the same bundle.
        //     this.bundle = bundle;
        // } else {
        debug(3, this._endpoint?.route?.id, `: Bundling entry path "${this.source_path?.str()}".`)
        this._bundle = await vts.bundle({
            entry_paths: [this.source_path?.str() ?? ""],
            output: `/tmp/${this._endpoint.route.method}_${this.source_path!.str().replace(/\//g, "_") }.js`, // esbuild requires an output path to resolve .css and .ttf files etc which can be imported by libraries (such as monaco-editor).
            minify: false,//this._server.production,
            platform: "browser",
            // format: "esm",
            format: "iife",
            target: "es2022",
            // target: "esnext",
            // sourcemap: this._server.production ? false : "inline",
            extract_inputs: true, // since bundle.inputs is used by server.js.
            tree_shaking: true,
        })
        // console.log("Bundle:", this._bundle);
        if (this._bundle.errors.length > 0) {
            error(this._endpoint?.route?.id, `: Encountered an error while bundling "${this.source}".\n`, this._bundle.debug())
            return;
        }
        // }

        // Set options based on inputs.
        this.payments = this._bundle.inputs.find((path: string) => path.endsWith("/modules/paddle.js"));
        // this.vhighlight = this.bundle.inputs.find((path: string) => path.endsWith("/vhighlight.js"));

        // Rebuild html.
        await this._build_html();

        // Response.
        // return this.bundle;
    }

    /** Ensure the view is bundled when required. */
    async ensure_bundle() {
        if (this.is_js_ts_view && !this._bundle) {
            return this._dynamic_bundle();
        }
    }


    // Build html.
    async _build_html(): Promise<void> {
        // Server & endpoint.
        if (this._server == null || this._endpoint == null) { throw Error("View has not been initialized with \"View._initialize()\" yet."); }

        // Bundle js files automatically.
        if (this.is_js_ts_view && !this._bundle) {
            await this._dynamic_bundle();
        }

        // Vars.
        const line_break = this._server.production ? "\n" : "\n";
        const has_bundle = this._bundle != null && typeof this._bundle === "object";

        // Initialize html.
        this.html = "";

        // Doctype.
        this.html += `<!DOCTYPE html><html style='min-width:100%;min-height:100%;' lang='${this.lang}'>${line_break}`;
        
        // Headers.
        this.html += `<head>${line_break}`;
        
        // Meta.
        if (this.meta) {
            this.html += this.meta.build_html(this._server.full_domain) + line_break;
        }

        // this.html = "Hello World!";
        // return;

        // ------------------------------------------------------------------------------------------
        // Stylesheets & links.

        // Embed stylesheet.
        const embed_stylesheet = (url: undefined | string, embed?: string): boolean => {
            if (
                embed == null &&
                url != null &&
                url.charAt(0) === "/"
            ) {
                for (const endpoint of this._server!.endpoints.values()) {
                    if (url === endpoint.route.endpoint_str) {
                        if (typeof endpoint.raw_data === "string") {
                            embed = endpoint.raw_data;
                        } else if (typeof endpoint.data === "string") {
                            embed = endpoint.data;
                        }
                        break;
                    }
                }
            }
            if (embed) {
                this.html += `<style>${line_break}${embed}${line_break}</style>${line_break}`;
                if (url) { this._embedded_sources.push(url); }
                return true;
            }
            return false;
        }

        // Include a link async.
        let include_links_script: string | null = null;
        const include_link_async = (link: Record<string, any>): void => {
            if (include_links_script == null) {
                include_links_script = "async function __incl_lnk(args){var link = document.createElement('link');for (let key in args) {if (args.hasOwnProperty(key)){link.setAttribute(key,args[key])}}document.head.appendChild(link)}" + line_break;
            }
            if (link.rel == null) {
                link.rel = "stylesheet";
            }
            include_links_script += `__incl_lnk(${JSON.stringify(link)});${line_break}`
        }

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
            this.html += `
                <script>
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

        // this.html += `<script>
        
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
        this.links.forEach((url: string | Record<string, any>) => {
            if (typeof url === "string") {
                this.html += `<link rel="stylesheet" href="${url}">`;
            } else if (typeof url === "object") {

                // Embed content.
                if (
                    (typeof url === "object" && url.rel === "stylesheet" && url.embed !== true && typeof url.href === "string") && 
                    embed_stylesheet(Route.clean_endpoint(url.href) as string)
                ) { /* skip */ }

                // Create link.
                else {
                    if (url.async) {
                        include_link_async(url);
                    } else {
                        this.html += "<link";
                        Object.keys(url).forEach((key) => {
                            if (key !== "embed") {
                                this.html += ` ${key}="${url[key]}"`;
                            }
                        })
                        this.html += ">" + line_break;
                    }
                }
            } else {
                throw Error("Invalid type for a css include, the valid value types are \"string\" and \"object\".");
            }
        })

        // Add include links script.
        if (include_links_script) {
            this.html += `<script>${line_break}${include_links_script}${line_break}</script>${line_break}`;
        }
        
        // End headers.
        this.html += "</head>" + line_break;

        // ------------------------------------------------------------------------------------------
        // Body.

        // Body.
        this.html +=  "<body id='body' style='width:100vw;height:100vh;margin:0;padding:0;";
        if (this.body_style != null) { this.html += this.body_style}
        this.html += "'>" + line_break;

        // Create splash screen.
        if (this.splash_screen != null) {
            this.html += this.splash_screen.html + line_break;
        }

        // ------------------------------------------------------------------------------------------
        // Include scripts.

        // Embed the data of an endpoint.
        // Returns `false` when the endpoint is not found.
        const embed_script = (url: string): boolean => {
            let embed;
            for (const endpoint of this._server!.endpoints.values()) {
                if (
                    url === endpoint.route.endpoint_str &&
                    (endpoint.raw_data != null || endpoint.data != null)
                ) {
                    embed = endpoint;
                }
            }

            // Check if the endpoint has data or raw data to embed.
            if (embed && (embed.raw_data || embed.data)) {

                // Dont embed code.
                if (embed.content_type === "application/javascript") {
                    this.html += `<script>${line_break}${embed.raw_data || embed.data}${line_break}</script>${line_break}`;
                } else {
                    this.html += `<script type='${embed.content_type}'>${line_break}${embed.raw_data || embed.data}${line_break}</script>${line_break}`;
                }
                this._embedded_sources.push(url);
                return true;
            }
            return false;
        }

        // Include js.
        let include_js_script = `async function __volt_incl_js(url, async = true) {var script=document.createElement('script');if(async){script.async = true;}script.src=url;document.head.appendChild(script);};${line_break}`

        // 3rd party js includes.
        if (this.jquery) {
            // Keep first since it needs to be included before volt.
            this.html += "<script src='https://ajax.googleapis.com/ajax/libs/jquery/3.6.4/jquery.min.js'></script>" + line_break;
        }
        if (this._server.google_tag !== undefined) {
            // this.html += `<script async src="https://www.googletagmanager.com/gtag/js?id=${this._server.google_tag}" onload='volt.google._initialize()'></script>`;
            include_js_script += `__volt_incl_js("https://www.googletagmanager.com/gtag/js?id=${this._server.google_tag}");${line_break}`;
        }

        // Primary volt includes do not add them to cached_code since they need to be included before any other includes.
        // Otherwise when including several files, most of them embedded and one not, then the not embedded will not have access to volt.
        // Since volt is 
        // embed_script("/volt/volt.js", false);

        // Add volt static aspect ratios.
        // @todo volt.static
        this.html += `<script>${line_break}window.volt_statics_aspect_ratios = ${JSON.stringify(Object.fromEntries(this._server.statics_aspect_ratios))}${line_break}</script>${line_break}`;

        // Embed other scripts.
        if (this._server.payments) {
            if (this._server.payments.type === "paddle") {
                // embed_script("/volt/payments/paddle.js", false); // no longer required due to auto imports.
                if (this.payments) {
                    include_js_script += `__volt_incl_js("https://cdn.paddle.com/paddle/v2/paddle.js");${line_break}`;
                }
            }
        }

        // Add the include js script.
        this.html += `<script>${line_break}${include_js_script.trimEnd()}${line_break}</script>${line_break}`

        // Additional js includes.
        this.includes.forEach((url: string | Record<string, any>) => {
            // Embed content.
            if (typeof url === "string" && embed_script(url)) { /* skip. */ }

            // Include.
            else {
                if (typeof url === "string") {
                    this.html += `<script src='${url}'></script>${line_break}`;
                }
                else if (typeof url === "object") {
                    this.html += "<script";
                    Object.keys(url).forEach((key) => {
                        if (key !== "embed") {
                            this.html += ` ${key}="${url[key]}"`;
                        }
                    })
                    this.html += "></script>" + line_break;
                }
                else {
                    throw Error("Invalid type for a js include, the valid value types are \"string\" and \"object\".");
                }
            }
        })

        // Add direct source code.
        if (has_bundle && typeof this._bundle.code === "string") {
            this.html += `<script type='module'>${line_break}${this._bundle.code}${line_break}</script>${line_break}`;
        }

        // Include the source.
        else if (typeof this.source === "string") {
            this.html += `<script>${line_break}${await new vlib.Path(this.source).load()}${line_break}</script>${line_break}`;
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
            this.html += `<script>${line_break}(${code})()${line_break}</script>${line_break}`
            // cached_code += `;(${code})();`;
        }

        // Close body.
        this.html += "</body>" + line_break;
        
        // End.
        this.html +=  "</html>" + line_break;
    }
    
    // Serve a client.
    _serve(stream: any, status_code: number = 200): void {
        debug(2, this._endpoint?.route?.id, ": Serving HTML ", this.html?.slice(0, 50), "...");
        stream.send({
            status: status_code, 
            headers: { "Content-Type": "text/html" }, 
            body: this.html,
        });
    }
}
export namespace View {
    export type Opts = ConstructorParameters<typeof View>[0];
}