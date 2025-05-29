/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Libraries.

// const Terser = require("terser");
// const esbuild = require('esbuild');

// ---------------------------------------------------------
// Imports.

const {vhighlight} = require("./vinc.js");
const utils = require("./utils.js");
const Meta = require(`${__dirname}/meta.js`);

// ---------------------------------------------------------
// View.
// @todo add template vars for callback and css and js include files. 
/*  @docs:
 *  @nav: Backend
 *  @chapter: Endpoints
 *  @title: View
 *  @description: The `View` class can be utilized from within the `Endpoint` parameter `view`.
 *  @parameter:
 *      @name: source
 *      @description: The static url to the client side javascript source code.
 *      @type: string
 *  @parameter:
 *      @name: callback
 *      @description: The client side callback function, this function will be executed at the client side. For this feature the `Content-Security-Policy:script-src` must be updated with for example `unsafe-inline`.
 *      @type: function
 *  @parameter:
 *      @name: includes
 *      @description:
 *          The included static js files.
 *
 *          By default the local includes will be embedded into the html page. However, this behaviour can be disabled by passing an include object with attribute `embed = false`.
 *      @type: array[string], array[InluceObject]
 *      @attributes_type: IncludeObject
 *      @attribute:
 *          @name: src
 *          @description: The source url of the script to include.
 *          @type: string
 *          @required: true
 *      @attribute:
 *          @name: embed
 *          @description: This attribute can be defined with the value of `false` to disable embedding the endpoint's content into the html page.
 *          @type: boolean
 *          @required: false
 *          @def: true
 *      @attribute:
 *          @name: **
 *          @description: Any other attributes will be assiged to the `<script>` line.
 *  @parameter:
 *      @name: links
 *      @description: 
 *          The included static css files.
 *
 *          By default the local scripts will be embedded into the html page. However, this behaviour can be disabled by passing a link object with attribute `embed = false`.
 *      @type: array[string], array[LinkObject]
 *      @attributes_type: LinkObject
 *      @attribute:
 *          @name: href
 *          @description: The source url of the link to include.
 *          @type: string
 *          @required: true
 *      @attribute:
 *          @name: rel
 *          @description: The source url of the link to include.
 *          @type: string
 *          @required: false
 *          @def: stylesheet
 *      @attribute:
 *          @name: embed
 *          @description: This attribute can be defined with the value of `false` to disable embedding the endpoint's content into the html page.
 *          @type: boolean
 *          @required: false
 *          @def: true
 *      @attribute:
 *          @name: **
 *          @description: Any other attributes will be assiged to the `<script>` line.
 *  @parameter:
 *      @name: templates
 *      @description: 
 *          Templates that will be replace the `callback` code. Templates can be created using the `$TEMPLATE` template style.
 *      @warning: Templates will only be used on the code of the `callback` attribute.
 *  @parameter:
 *      @name: meta
 *      @description: The meta information object.
 *      @type: Meta
 *  @parameter:
 *      @name: jquery
 *      @description: Include jqeury by default.
 *      @type: boolean
 *  @parameter:
 *      @name: compression
 *      @description: Include the vweb compression module.
 *      @type: boolean
 *  @parameter:
 *      @name: payments
 *      @description: Include external payment sources, should be enabled on the checkout page.
 *      @type: boolean
 *  @parameter:
 *      @name: vhighlight
 *      @description: Include vhighlight by default.
 *      @type: boolean
 *  @parameter:
 *      @name: body_style
 *      @description: The style of the \<body> element. When left undefined, the static attribute `View.body_style` will be used.
 *      @type: null, string
 *  @parameter:
 *      @name: splash_screen
 *      @description: The splash screen settings. When left undefined, the static attribute `View.splash_screen` will be used.
 *      @type: null, SplashScreen
 *  @parameter:
 *      @name: tree_shaking
 *      @description: Optimize javascript source code by removing dead code.
 *      @type: boolean
 *  @parameter:
 *      @name: mangle
 *      @description: Optimize javascript source code by mangling function names.
 *      @type: boolean
 *  @parameter:
 *      @name: _src
 *      @ignore: true
 *
 *  @attribute:
 *      @name: body_style
 *      @description: The style of the \<body> element. This static attribute will be used on all views when defined. However, it can be overridden for a single View by defining the parameter.
 *      @type: null, string
 *  @attribute:
 *      @name: splash_screen
 *      @description: The splash screen settings. This static attribute will be used on all views when defined. However, it can be overridden for a single View by defining the parameter.
 *      @type: null, SplashScreen
 */
class View {

    // Global settings.
    static includes = [];
    static links = [];
    static body_style = null; // css string style.
    static splash_screen = null; // SplashScreen object.

    // Constructor.
    constructor({
        source = null,
        callback = null,
        includes = [],
        links = [],
        templates = {},
        meta = new Meta(),
        jquery = false,
        compression = false,
        payments = false,
        vhighlight = false,
        lang = "en",
        body_style = null,
        splash_screen = null,
        tree_shaking = false,
        mangle = false,
        _src = __filename,
    }) {

        // Arguments.
        this.source = source;
        this.callback = callback;
        this.includes = [...View.includes, ...includes];
        this.links = [...View.links, ...links];
        this.templates = templates;
        this.meta = meta;
        this.jquery = jquery;
        this.compression = compression;
        this.payments = payments;
        this.vhighlight = vhighlight;
        this.lang = lang;
        this.body_style = body_style || View.body_style;
        this.splash_screen = splash_screen || View.splash_screen;
        this.tree_shaking = tree_shaking;
        this.mangle = mangle;

        // System arguments.
        this._src = _src;
        this._embedded_sources = [];

        // Clean source, required to match against endpoint's.
        if (this.source != null) {
            this.source = utils.clean_endpoint(this.source);
        }

        // Check args.
        if (typeof source !== "string" && typeof callback !== "function") {
            throw Error("Invalid usage, define either parameter \"source\" or \"callback\".");
        }

        // Drop duplicate includes.
        this.includes = this.includes.drop_duplicates();

        // Attributes.
        this.html = null;
    }

    // Build html.
    async _build_html(server, endpoint) {

        // Initialize html.
        this.html = "";

        // Doctype.
        this.html += `<!DOCTYPE html><html style='min-width:100%;min-height:100%;' lang='${this.lang}'>`;
        
        // Headers.
        this.html += `<head>`;
        
        // Meta.
        if (this.meta) {
            this.html += this.meta.build_html(server.full_domain);
        }

        // ------------------------------------------------------------------------------------------
        // Stylesheets & links.

        // Embed stylesheet.
        const embed_stylesheet = (url) => {
            let embed;
            if (
                url != null &&
                url.charAt(0) === "/"
            ) {
                for (const endpoint of server.endpoints.values()) {
                    if (url === endpoint.endpoint && (endpoint.raw_data != null || endpoint.data != null)) {
                        embed = endpoint.raw_data || endpoint.data;
                    }
                }
            }
            if (embed) {
                this.html += `<style>${embed}</style>`;
                this._embedded_sources.append(url);
                return true;
            }
            return false;
        }

        // Include a link async.
        let include_links_script = null;
        const include_link_async = (link) => {
            if (include_links_script === null) {
                include_links_script = "async function __incl_lnk(args){var link = document.createElement('link');for (let key in args) {if (args.hasOwnProperty(key)){link.setAttribute(key,args[key])}}document.head.appendChild(link)}";
            }
            if (link.rel == null) {
                link.rel = "stylesheet";
            }
            include_links_script += `__incl_lnk(${JSON.stringify(link)});`
        }

        // Stylesheets.
        embed_stylesheet("/vweb/vweb.css")
        if (this.vhighlight) {
            embed_stylesheet("/vhighlight/vhighlight.css")
        }
        if (this.payments && server.payments) {
            if (server.payments.type === "adyen") {
                include_link_async({
                    rel: "stylesheet",
                    href: `https://checkoutshopper-${server.production ? "live" : "test"}.adyen.com/checkoutshopper/sdk/5.53.2/adyen.css`,
                    integrity: "sha384-9EdBqZRrjozkt+Be5ycjHBTi+4DYrafpC1KyPnNyTBfjBIZ5+oMp8BbgvPLGgsE0",
                    crossorigin:"anonymous",
                })
            }
        }

        // Custom links.
        this.links.iterate((url) => {
            if (typeof url === "string") {
                this.html += `<link rel="stylesheet" href="${url}">`;
            } else if (typeof url === "object") {

                // Embed content.
                if (
                    (typeof url === "object" && url.rel === "stylesheet" && url.embed !== true) && 
                    embed_stylesheet(utils.clean_endpoint(url.href))
                ) { /* skip */ }

                // Create link.
                else {
                    if (url.async) {
                        include_link_async(url);
                    } else {
                        this.html += "<link";
                        Object.keys(url).iterate((key) => {
                            if (key !== "embed") {
                                this.html += ` ${key}="${url[key]}"`;
                            }
                        })
                        this.html += ">";
                    }
                }
            } else {
                throw Error("Invalid type for a css include, the valid value types are \"string\" and \"object\".");
            }
        })

        // Add include links script.
        if (include_links_script) {
            this.html += `<script>${include_links_script}</script>`;
        }
        
        // End headers.
        this.html += "</head>";

        // ------------------------------------------------------------------------------------------
        // Body.

        // Body.
        this.html +=  "<body id='body' style='width:100vw;height:100vh;margin:0;padding:0;";
        if (this.body_style != null) { this.html += this.body_style}
        this.html += "'>";

        // Create splash screen.
        if (this.splash_screen != null) {
            this.html += this.splash_screen.html;
        }

        // ------------------------------------------------------------------------------------------
        // Include scripts.

        // Embed the data of an endpoint.
        // Returns `false` when the endpoint is not found.
        const embed_script = (url) => {
            let embed;
            for (const endpoint of server.endpoints.values()) {
                if (
                    url === endpoint.endpoint &&
                    (endpoint.raw_data != null || endpoint.data != null)
                ) {
                    embed = endpoint;
                }
            }

            // Check if the endpoint has data or raw data to embed.
            if (embed && (embed.raw_data || embed.data)) {

                // Dont embed code.
                if (embed.content_type === "application/javascript") {
                    this.html += `<script>${embed.raw_data || embed.data}</script>`;
                } else {
                    this.html += `<script type='${embed.content_type}'>${embed.raw_data || embed.data}</script>`;
                }
                this._embedded_sources.append(url);
                return true;
            }
            return false;
        }

        // Include js.
        let include_js_script = `async function __incl_js(url, async = true) {var script=document.createElement('script');if(async){script.async = true;}script.src=url;document.head.appendChild(script);};`

        // 3rd party js includes.
        if (this.jquery) {
            // Keep first since it needs to be included before vweb.
            this.html += "<script src='https://ajax.googleapis.com/ajax/libs/jquery/3.6.4/jquery.min.js'></script>";
        }
        if (server.google_tag !== undefined) {
            // this.html += `<script async src="https://www.googletagmanager.com/gtag/js?id=${server.google_tag}" onload='vweb.google._initialize()'></script>`;
            include_js_script += `__incl_js("https://www.googletagmanager.com/gtag/js?id=${server.google_tag}");`;
        }

        // Primary vweb includes do not add them to cached_code since they need to be included before any other includes.
        // Otherwise when including several files, most of them embedded and one not, then the not embedded will not have access to vweb.
        // Since vweb is 
        embed_script("/vweb/vweb.js", false);

        // Add vweb static aspect ratios.
        this.html += `<script>vweb.static.aspect_ratios = ${JSON.stringify(server.statics_aspect_ratios)}</script>`;

        // Embed other scripts.
        if (this.vhighlight) {
            embed_script("/vhighlight/vhighlight.js", false);
        }
        if (server.payments) {
            if (server.payments.type === "adyen") {
                embed_script("/vweb/payments/adyen.js", false);
                if (this.payments) {
                    this.html += `<script>vweb.payments.include_started = true;</script>`
                    this.html += `<script async src="https://checkoutshopper-${server.production ? "live" : "test"}.adyen.com/checkoutshopper/sdk/5.53.2/adyen.js" integrity="sha384-ng3HLoZIlQ3BLgyGyGNiwWSx6LEPIlmxVuGRw72skZFt9mL8OweRjp7vcPzSqxTj" crossorigin="anonymous" onload="vweb.payments.include_finished = true;"></script>`
                }
            } else if (server.payments.type === "paddle") {
                embed_script("/vweb/payments/paddle.js", false);
                if (this.payments) {
                    include_js_script += `__incl_js("https://cdn.paddle.com/paddle/v2/paddle.js");`;
                }
            }
        }

        // Add the include js script.
        this.html += `<script>${include_js_script}</script>`

        // Additional js includes.
        this.includes.iterate((url) => {

            // Embed content.
            if (typeof url === "string" && embed_script(url)) { /* skip. */ }

            // Include.
            else {
                if (typeof url === "string") {
                    this.html += `<script src='${url}'></script>`;
                }
                else if (typeof url === "object") {
                    this.html += "<script";
                    Object.keys(url).iterate((key) => {
                        if (key !== "embed") {
                            this.html += ` ${key}="${url[key]}"`;
                        }
                    })
                    this.html += "></script>";
                }
                else {
                    throw Error("Invalid type for a js include, the valid value types are \"string\" and \"object\".");
                }
            }
        })

        // Include the srouce.
        if (typeof this.source === "string") {
            if (embed_script(this.source)) { /* skip */ }
            else {
                this.html += `<script src='${this.source}'></script>`;
            }
        }

        // JS code.
        else if (this.callback !== null) {
            let code = this.callback.toString();

            // Fill templates.
            const code_hash = server.hash(code);

            // Check cache.
            const {cache_path, cache_hash, cache_data} = utils.get_compiled_cache(server.domain, endpoint.method, endpoint.endpoint);
            if (cache_data && code_hash === cache_hash) {
                code = cache_data;
            } else {

                // Compile.
                const compiler = new vhighlight.JSCompiler({
                    line_breaks: true,
                    double_line_breaks: true,
                    comments: false,
                    white_space: false,
                })
                try {
                    code = compiler.compile_code(code, this._src);
                } catch (err) {
                    console.error("JS Compile error:");
                    console.error(err);
                }

                // Cache for restarts.
                utils.set_compiled_cache(cache_path, code, code_hash);
            }

            // Add.
            cached_code += `;(${code})();`;
        }

        // Close body.
        this.html += "</body>";
        
        // End.
        this.html +=  "</html>";
    }
    /*
    async _build_html(server, endpoint) {

        // Initialize html.
        this.html = "";

        // Doctype.
        this.html += `<!DOCTYPE html><html style='min-width:100%;min-height:100%;' lang='${this.lang}'>`;
        
        // Headers.
        this.html += `<head>`;
        
        // Meta.
        if (this.meta) {
            this.html += this.meta.build_html(server.full_domain);
        }

        // Embed stylesheet.
        const embed_stylesheet = (url) => {
            let embed;
            if (
                url != null &&
                url.charAt(0) === "/"
            ) {
                for (const endpoint of server.endpoints.values()) {
                    if (url === endpoint.endpoint && (endpoint.raw_data != null || endpoint.data != null)) {
                        embed = endpoint.raw_data || endpoint.data;
                    }
                }
            }
            if (embed) {
                this.html += `<style>${embed}</style>`;
                this._embedded_sources.append(url);
                return true;
            }
            return false;
        }

        // Include a link async.
        let include_links_script = null;
        const include_link_async = (link) => {
            if (include_links_script === null) {
                include_links_script = "async function __incl_lnk(args){var link = document.createElement('link');for (let key in args) {if (args.hasOwnProperty(key)){link.setAttribute(key,args[key])}}document.head.appendChild(link)}";
            }
            if (link.rel == null) {
                link.rel = "stylesheet";
            }
            include_links_script += `__incl_lnk(${JSON.stringify(link)});`
        }

        // Stylesheets.
        embed_stylesheet("/vweb/vweb.css")
        if (this.vhighlight) {
            embed_stylesheet("/vhighlight/vhighlight.css")
        }
        if (this.payments && server.payments) {
            if (server.payments.type === "adyen") {
                include_link_async({
                    rel: "stylesheet",
                    href: `https://checkoutshopper-${server.production ? "live" : "test"}.adyen.com/checkoutshopper/sdk/5.53.2/adyen.css`,
                    integrity: "sha384-9EdBqZRrjozkt+Be5ycjHBTi+4DYrafpC1KyPnNyTBfjBIZ5+oMp8BbgvPLGgsE0",
                    crossorigin:"anonymous",
                })
                // this.html += `<link rel="stylesheet" href="https://checkoutshopper-${server.production ? "live" : "test"}.adyen.com/checkoutshopper/sdk/5.53.2/adyen.css" integrity="sha384-9EdBqZRrjozkt+Be5ycjHBTi+4DYrafpC1KyPnNyTBfjBIZ5+oMp8BbgvPLGgsE0" crossorigin="anonymous">`
                // this.html += `<link rel="stylesheet" href="/vweb/payments/adyen.css"></script>`;
            }
        }

        // Custom links.
        this.links.iterate((url) => {
            if (typeof url === "string") {
                this.html += `<link rel="stylesheet" href="${url}">`;
            } else if (typeof url === "object") {

                // Embed content.
                if (
                    (typeof url === "object" && url.rel === "stylesheet" && url.embed !== true) && 
                    embed_stylesheet(utils.clean_endpoint(url.href))
                ) {}

                // Create link.
                else {
                    if (url.async) {
                        include_link_async(url);
                    } else {
                        this.html += "<link";
                        Object.keys(url).iterate((key) => {
                            if (key !== "embed") {
                                this.html += ` ${key}="${url[key]}"`;
                            }
                        })
                        this.html += ">";
                    }
                }
            } else {
                throw Error("Invalid type for a css include, the valid value types are \"string\" and \"object\".");
            }
        })

        // Add include links script.
        if (include_links_script) {
            this.html += `<script>${include_links_script}</script>`;
        }
        
        // End headers.
        this.html += "</head>";

        // Body.
        this.html +=  "<body id='body' style='width:100vw;height:100vh;margin:0;padding:0;";
        if (this.body_style != null) { this.html += this.body_style}
        this.html += "'>";

        // Create splash screen.
        if (this.splash_screen != null) {
            this.html += this.splash_screen.html;
        }

        // Embed the data of an endpoint.
        // Returns `false` when the endpoint is not found.
        let cached_code = "";
        const embed_script = (url) => {
            let embed;
            for (const endpoint of server.endpoints.values()) {
                if (
                    url === endpoint.endpoint &&
                    (endpoint.raw_data != null || endpoint.data != null)
                ) {
                    embed = endpoint;
                }
            }

            // Check if the endpoint has data or raw data to embed.
            if (embed && (embed.raw_data || embed.data)) {

                // Embed code.
                if (embed.content_type === "application/javascript") {
                    cached_code += (embed.raw_data || embed.data);
                }

                // Dont embed code.
                else {
                    embed_cached_code();
                    if (embed.content_type === "application/javascript") {
                        this.html += `<script>${embed.raw_data || embed.data}</script>`;
                    } else {
                        this.html += `<script type='${embed.content_type}'>${embed.raw_data || embed.data}</script>`;
                    }
                }
                this._embedded_sources.append(url);
                return true;
            }
            embed_cached_code();
            return false;
        }

        // Embed the cached code into the html code.
        // This must be done in batches, in order to keep the same order as the user defined includes.
        // Otherwise in v1 the cached_code was added last and if another script was encountered ...
        // That was not possible to embed it would be loaded before the cached_code.
        // Which caused the include order not to be followed resulting in wrong behaviour of undefined modules.
        const embed_cached_code = () => {
            if (cached_code.length > 0) {
                cached_code = utils.fill_templates(cached_code, this.templates);

                // deprecated all static files are already compiled.
                // but keep as backup since in the future there are plans to reimplement tree-shaking and mangling.
                // if (false && server.production) {
                //     const compiler = new vhighlight.JSCompiler({
                //         line_breaks: true,
                //         double_line_breaks: true,
                //         comments: false,
                //         white_space: false,
                //         tree_shaking: this.tree_shaking,
                //         mangle: this.mangle,
                //     })
                //     let code;
                //     try {
                //         code = compiler.compile_code(cached_code, this._src);
                //     } catch (err) {
                //         console.error("JS Compile error:");
                //         console.error(err);
                //     }
                //     console.log("Removed", ((cached_code.length - code.length) / cached_code.length * 100).toFixed(2) + "%", " dead code.");

                //     this.html += `<script>${cached_code}</script>`;
                // } else {
                
                this.html += `<script>${cached_code}</script>`;
                
                // }

                // Reset cached code.
                cached_code = "";
            }
        }

        // Include js.
        let include_js_script = `async function __incl_js(url, async = true) {var script=document.createElement('script');if(async){script.async = true;}script.src=url;document.head.appendChild(script);};`

        // 3rd party js includes.
        if (this.jquery) {
            // Keep first since it needs to be included before vweb.
            this.html += "<script src='https://ajax.googleapis.com/ajax/libs/jquery/3.6.4/jquery.min.js'></script>";
        }
        if (server.google_tag !== undefined) {
            // this.html += `<script async src="https://www.googletagmanager.com/gtag/js?id=${server.google_tag}" onload='vweb.google._initialize()'></script>`;
            include_js_script += `__incl_js("https://www.googletagmanager.com/gtag/js?id=${server.google_tag}");`;
        }

        // Primary vweb includes do not add them to cached_code since they need to be included before any other includes.
        // Otherwise when including several files, most of them embedded and one not, then the not embedded will not have access to vweb.
        // Since vweb is 
        embed_script("/vweb/vweb.js", false);

        // Add vweb static aspect ratios.
        embed_cached_code()
        this.html += `<script>vweb.static.aspect_ratios = ${JSON.stringify(server.statics_aspect_ratios)}</script>`;

        // Embed other scripts.
        if (this.vhighlight) {
            embed_script("/vhighlight/vhighlight.js", false);
        }
        if (server.payments) {
            if (server.payments.type === "adyen") {
                embed_script("/vweb/payments/adyen.js", false);
                if (this.payments) {
                    this.html += `<script>vweb.payments.include_started = true;</script>`
                    this.html += `<script async src="https://checkoutshopper-${server.production ? "live" : "test"}.adyen.com/checkoutshopper/sdk/5.53.2/adyen.js" integrity="sha384-ng3HLoZIlQ3BLgyGyGNiwWSx6LEPIlmxVuGRw72skZFt9mL8OweRjp7vcPzSqxTj" crossorigin="anonymous" onload="vweb.payments.include_finished = true;"></script>`
                }
            } else if (server.payments.type === "paddle") {
                embed_script("/vweb/payments/paddle.js", false);
                if (this.payments) {
                    include_js_script += `__incl_js("https://cdn.paddle.com/paddle/v2/paddle.js");`;
                }
            }
        }

        // Add the include js script.
        this.html += `<script>${include_js_script}</script>`

        // Additional js includes.
        this.includes.iterate((url) => {

            // Embed content.
            if (typeof url === "string" && embed_script(url)) {}

            // Include.
            else {
                if (typeof url === "string") {
                    this.html += `<script src='${url}'></script>`;
                }
                else if (typeof url === "object") {
                    this.html += "<script";
                    Object.keys(url).iterate((key) => {
                        if (key !== "embed") {
                            this.html += ` ${key}="${url[key]}"`;
                        }
                    })
                    this.html += "></script>";
                }
                else {
                    throw Error("Invalid type for a js include, the valid value types are \"string\" and \"object\".");
                }
            }
        })

        // Include the srouce.
        if (typeof this.source === "string") {
            if (embed_script(this.source)) {}
            else {
                this.html += `<script src='${this.source}'></script>`;
            }
        }

        // JS code.
        else if (this.callback !== null) {
            let code = this.callback.toString();

            // Fill templates.
            const code_hash = server.hash(code);

            // Check cache.
            const {cache_path, cache_hash, cache_data} = utils.get_compiled_cache(server.domain, endpoint.method, endpoint.endpoint);
            if (cache_data && code_hash === cache_hash) {
                code = cache_data;
            } else {

                // Compile.
                const compiler = new vhighlight.JSCompiler({
                    line_breaks: true,
                    double_line_breaks: true,
                    comments: false,
                    white_space: false,
                })
                try {
                    code = compiler.compile_code(code, this._src);
                } catch (err) {
                    console.error("JS Compile error:");
                    console.error(err);
                }

                // Cache for restarts.
                utils.set_compiled_cache(cache_path, code, code_hash);
            }

            // Add.
            cached_code += `;(${code})();`;
        }

        // Add cached code.
        embed_cached_code();

        // Close body.
        this.html += "</body>";
        
        // End.
        this.html +=  "</html>";
    }*/

    // Serve a client.
    _serve(stream, status_code = 200) {
        stream.send({
            status: status_code, 
            headers: {"Content-Type": "text/html"}, 
            data: this.html,
        });
    }
}

// ---------------------------------------------------------
// Exports.

module.exports = View;
