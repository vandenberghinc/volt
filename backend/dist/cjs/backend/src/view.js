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
  View: () => View
});
module.exports = __toCommonJS(stdin_exports);
var vlib = __toESM(require("@vandenberghinc/vlib"));
var vts = __toESM(require("@vandenberghinc/vlib/vts"));
var vhighlight = __toESM(require("@vandenberghinc/vhighlight"));
var import_meta = require("./meta.js");
var import_route = require("./route.js");
var import_frontend = require("./frontend.js");
var crypto = __toESM(require("crypto"));
const { debug } = vlib;
class View {
  // Global settings.
  static includes = [];
  static links = [];
  static body_style = null;
  // css string style.
  static splash_screen = void 0;
  // SplashScreen object.
  // Private static attributes,
  static _volt_css;
  static _vhighlight_css;
  // Attributes.
  source;
  source_path;
  // callback: Function | null;
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
  min_device_width;
  server;
  endpoint;
  /**
   * The file path of a pre-bundled source, that can be sent from file instead of in-memory data.
   */
  cached_html_path;
  // private html_nonce_split?: string[];
  /**
   * Clone this view, used to create a modified copy of the current view.
   * @note
   * The following attributes are not deep copied, but just referenced:
   * - `params`
   * @param override Override specific endpoint options, note that this will be shallow merged.
   *
   * @docs
   */
  clone(override) {
    return new View({
      ...vlib.Object.deep_copy({
        source: this.source,
        // callback: this.callback,
        includes: this.includes,
        links: this.links,
        templates: this.templates,
        jquery: this.jquery,
        lang: this.lang,
        body_style: this.body_style,
        tree_shaking: this.tree_shaking,
        mangle: this.mangle,
        min_device_width: this.min_device_width,
        _src: this._src
      }),
      meta: this.meta.copy(),
      splash_screen: this.splash_screen?.clone(),
      ...override
    });
  }
  /**
   * Options for constructing a {@link View} instance.
   * @docs
   */
  constructor({
    source,
    // callback = null,
    includes = [],
    links = [],
    templates = {},
    meta = new import_meta.Meta(),
    jquery = false,
    lang = "en",
    body_style = null,
    splash_screen = void 0,
    tree_shaking = false,
    mangle = false,
    min_device_width = 600,
    _src
  }) {
    this.source = source;
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
    this._src = _src;
    this._embedded_sources = [];
    this.source_path = new vlib.Path(this.source);
    if (!this.source_path.exists()) {
      throw new Error(`Defined source path "${this.source}" does not exist.`);
    }
    this.source_path = this.source_path.abs();
    this.source = this.source_path.str();
    if (!/\.(jsx?|tsx?)$/.test(this.source_path.extension())) {
      throw new Error(`Invalid view source extension "${this.source_path.extension()}", only ".js", ".ts", ".jsx" and ".tsx" are supported.`);
    }
    this.includes = vlib.Array.drop_duplicates(this.includes);
  }
  // Initialize.
  initialize(server, endpoint) {
    if (server === void 0) {
      throw Error('Invalid usage, define parameter "server".');
    }
    if (endpoint === void 0) {
      throw Error('Invalid usage, define parameter "endpoint".');
    }
    this.server = server;
    this.endpoint = endpoint;
  }
  /**
   * Production initialization.
   * This will bundle the source code and prepare the view for production use.
   * Instead of bundling on demand in the request which is used for development mode.
   */
  async production_initialize() {
    await this._create_html_file();
  }
  /** Create an error HTML file when errors are encountered during the bundle process. */
  async _build_bundle_err_html() {
    if (this.server?.production) {
      throw new Error("Encountered an error while bundling in production.");
    }
    const nonce_identifier = "{{__VOLT_NONCE__}}";
    const bundle = await vts.inspect_bundle({
      include: this.source_path ? [this.source_path?.str()] : [],
      output: vlib.Path.tmp().join(`${this.endpoint?.route.method}_${this.source_path.str().replace(/\//g, "_")}.js`),
      // esbuild requires an output path to resolve .css and .ttf files etc which can be imported by libraries (such as monaco-editor).
      minify: false,
      //this._server.production,
      platform: "browser",
      format: "esm",
      // format: "iife", // can causes issues with node_modules imports.
      target: "es2022",
      tree_shaking: true
    });
    this.server?.log.error(this.endpoint?.route?.id, `: Encountered an error while bundling "${this.source}".
${bundle.debug({ limit: 25 })}`);
    const escape_html = (str) => vlib.Color.to_html(str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"));
    let html;
    if (this.server?.production) {
      html = `
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
    } else {
      const formatted_import_chains = bundle.format_import_chains();
      const formatted_errors = bundle.format_errors();
      html = `
                <!DOCTYPE html>
                <html lang='${this.lang}'>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <title>Bundling Error - ${escape_html(this.source || "Unknown")}</title>
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
                        <div class="source">Source: ${escape_html(this.source || "Unknown")}</div>
                        <div class="error-count">${bundle.errors.length} error${bundle.errors.length === 1 ? "" : "s"}</div>
                        <pre>${escape_html(bundle.debug({ limit: -1 }))}</pre>
                        <!--<h2>Metafile</h2>
                        <pre>${escape_html(bundle.metafile ?? "No metafile detected.")}</pre>
                        <h2>Input files</h2>
                        <pre>${escape_html(bundle.inputs.length ? bundle.inputs.join("\n") : "No input files detected.")}</pre>
                        <h2>Import Chains</h2>
                        <pre>${escape_html(formatted_import_chains.length ? formatted_import_chains.join("\n") : "No import chains detected.")}</pre>
                        <h2>Encountered Errors</h2>
                        <pre>${escape_html(formatted_errors.length ? formatted_errors.join("\n") : "No errors detected.")}</pre>
                        -->
                    </div>
                </body>
                </html>
                `.dedent(false);
    }
    return html;
  }
  // Build html.
  async _build_html() {
    const nonce_identifier = "{{__VOLT_NONCE__}}";
    if (this.server == null || this.endpoint == null) {
      throw Error('View has not been initialized with "View._initialize()" yet.');
    }
    if (debug.on(3))
      debug(this.endpoint?.route?.id, `: Bundling entry path "${this.source_path?.str()}".`);
    const bundle = await vts.bundle({
      include: this.source_path ? [this.source_path?.str()] : [],
      output: `/tmp/${this.endpoint.route.method}_${this.source_path.str().replace(/\//g, "_")}.js`,
      // esbuild requires an output path to resolve .css and .ttf files etc which can be imported by libraries (such as monaco-editor).
      minify: false,
      //this._server.production,
      platform: "browser",
      format: "esm",
      // format: "iife", // can causes issues with node_modules imports.
      target: "es2022",
      // sourcemap: this.server.production ? false : "inline",
      extract_inputs: true,
      // since bundle.inputs is used by server.js.
      tree_shaking: true
    });
    const add_payments_module = bundle.inputs.find((path) => path.endsWith("/modules/paddle.js"));
    if (bundle.errors.length > 0) {
      return this._build_bundle_err_html();
    }
    const line_break = this.server.production ? "\n" : "\n";
    let html = "";
    html += `<!DOCTYPE html><html lang='${this.lang}'>${line_break}`;
    html += `<head>${line_break}`;
    if (this.meta) {
      html += this.meta.build_html(this.server.full_domain) + line_break;
    }
    html += `<style nonce="${nonce_identifier}">html { min-width:100%;min-height:100%; }body { width:100vw;height:100vh;margin:0;padding:0;${this.body_style ?? ""} }</style>${line_break}`;
    const embed_stylesheet = (url, embed) => {
      if (embed == null && url != null && url.charAt(0) === "/") {
        for (const endpoint of this.server.endpoints.values()) {
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
        html += `<style nonce="${nonce_identifier}">${line_break}${embed}${line_break}</style>${line_break}`;
        if (url) {
          this._embedded_sources.push(url);
        }
        return true;
      }
      return false;
    };
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
    if (!View._volt_css) {
      View._volt_css = await new vlib.Path(import_frontend.Frontend.css.volt).load();
    }
    if (!View._vhighlight_css) {
      View._vhighlight_css = await new vlib.Path(vhighlight.web_exports.css).load();
    }
    embed_stylesheet(void 0, View._volt_css);
    embed_stylesheet(void 0, View._vhighlight_css);
    if (this.min_device_width != null) {
      html += `
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
    this.links.forEach((url) => {
      if (typeof url === "string") {
        html += `<link rel="stylesheet" href="${url}">`;
      } else if (typeof url === "object") {
        if (typeof url === "object" && url.rel === "stylesheet" && url.embed !== true && typeof url.href === "string" && embed_stylesheet(import_route.Route.clean_endpoint(url.href))) {
        } else {
          if (url.async) {
            include_link_async(url);
          } else {
            html += "<link";
            Object.keys(url).forEach((key) => {
              if (key !== "embed") {
                html += ` ${key}="${url[key]}"`;
              }
            });
            html += ">" + line_break;
          }
        }
      } else {
        throw Error('Invalid type for a css include, the valid value types are "string" and "object".');
      }
    });
    if (include_links_script) {
      html += `<script nonce="${nonce_identifier}">${line_break}${include_links_script}${line_break}</script>${line_break}`;
    }
    html += "</head>" + line_break;
    html += "<body id='body'>";
    if (this.splash_screen != null) {
      html += this.splash_screen.html + line_break;
    }
    const embed_script = (url) => {
      let embed;
      for (const endpoint of this.server.endpoints.values()) {
        if (url === endpoint.route.endpoint_str && (endpoint.raw_data != null || endpoint.data != null)) {
          embed = endpoint;
        }
      }
      if (embed && (embed.raw_data || embed.data)) {
        if (embed.content_type === "application/javascript") {
          html += `<script nonce="${nonce_identifier}">${line_break}${embed.raw_data || embed.data}${line_break}</script>${line_break}`;
        } else {
          html += `<script nonce="${nonce_identifier}" type='${embed.content_type}'>${line_break}${embed.raw_data || embed.data}${line_break}</script>${line_break}`;
        }
        this._embedded_sources.push(url);
        return true;
      }
      return false;
    };
    let include_js_script = `async function __volt_incl_js(url, async = true) {var script=document.createElement('script');if(async){script.async = true;}script.src=url;document.head.appendChild(script);};${line_break}`;
    if (this.jquery) {
      html += `<script nonce="${nonce_identifier}" src='https://ajax.googleapis.com/ajax/libs/jquery/3.6.4/jquery.min.js'></script>${line_break}`;
    }
    if (this.server.google_tag !== void 0) {
      include_js_script += `__volt_incl_js("https://www.googletagmanager.com/gtag/js?id=${this.server.google_tag}");${line_break}`;
    }
    html += `<script nonce="${nonce_identifier}">${line_break}window.volt_statics_aspect_ratios = ${JSON.stringify(Object.fromEntries(this.server.statics_aspect_ratios))}${line_break}</script>${line_break}`;
    if (this.server.payments) {
    }
    html += `<script nonce="${nonce_identifier}">${line_break}${include_js_script.trimEnd()}${line_break}</script>${line_break}`;
    this.includes.forEach((url) => {
      if (typeof url === "string" && embed_script(url)) {
      } else {
        if (typeof url === "string") {
          html += `<script nonce="${nonce_identifier}" src='${url}'></script>${line_break}`;
        } else if (typeof url === "object") {
          html += `<script nonce="${nonce_identifier}"`;
          Object.keys(url).forEach((key) => {
            if (key !== "embed") {
              html += ` ${key}="${url[key]}"`;
            }
          });
          html += "></script>" + line_break;
        } else {
          throw Error('Invalid type for a js include, the valid value types are "string" and "object".');
        }
      }
    });
    if (typeof bundle.code === "string") {
      html += `<script nonce="${nonce_identifier}" type='module'>${line_break}${bundle.code}${line_break}</script>${line_break}`;
    } else if (typeof this.source === "string") {
      html += `<script nonce="${nonce_identifier}">${line_break}${await new vlib.Path(this.source).load()}${line_break}</script>${line_break}`;
    }
    html += "</body>" + line_break;
    html += "</html>" + line_break;
    return html;
  }
  /** Create the cached HTML file if it doesn't exist. */
  async _create_html_file() {
    const cache_id = `${this.endpoint?.route.method}_${this.source_path?.str()}.html`.replaceAll("/", "_");
    if (!this.cached_html_path) {
      this.cached_html_path = this.server.endpoint_cache_dir.join(cache_id);
    }
    if (!this.cached_html_path.exists()) {
      const html = await this._build_html();
      await this.cached_html_path.save(html);
    }
    return this.cached_html_path;
  }
  // Serve a client.
  async _serve(stream, status_code = 200, opts) {
    const html_file = await this._create_html_file();
    const nonce = crypto.randomBytes(16).toString("base64");
    const csp = stream.get_header("Content-Security-Policy");
    if (typeof csp === "string") {
      const new_csp = csp.replace(/(script-src|style-src)([^;]*)/g, (_, g1, g2) => `${g1}${g2} 'nonce-${nonce}'`);
      stream.set_header("Content-Security-Policy", new_csp);
    }
    stream.send({
      status: status_code,
      headers: { "Content-Type": "text/html" },
      from_file: html_file,
      templates: { ...this.templates, ...opts?.templates ?? {}, "__VOLT_NONCE__": nonce },
      compress: opts?.compress
    });
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  View
});
