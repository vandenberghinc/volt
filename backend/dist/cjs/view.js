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
var import_meta = __toESM(require("./meta.js"));
var import_logger = __toESM(require("./logger.js"));
var import_route = require("./route.js");
var import_frontend = __toESM(require("./frontend.js"));
const { log, error } = import_logger.default;
const { debug } = vlib;
class View {
  // Global settings.
  static includes = [];
  static links = [];
  static body_style = null;
  // css string style.
  static splash_screen = null;
  // SplashScreen object.
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
  html;
  raw_html;
  _bundle;
  payments;
  // vhighlight?: string | undefined;
  min_device_width;
  _server;
  _endpoint;
  // Constructor.
  constructor({ source = null, callback = null, includes = [], links = [], templates = {}, meta = new import_meta.default(), jquery = false, lang = "en", body_style = null, splash_screen = null, tree_shaking = false, mangle = false, min_device_width = 600, _src }) {
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
    this._src = _src;
    this._embedded_sources = [];
    if (this.source != null) {
      this.source_path = new vlib.Path(this.source);
      if (!this.source_path.exists()) {
        throw new Error(`Defined source path "${this.source}" does not exist.`);
      }
      this.source_path = this.source_path.abs();
      this.source = this.source_path.str();
    }
    this.is_js_ts_view = this.source_path != null && /\.(jsx?|tsx?)/.test(this.source_path.extension());
    if (typeof source !== "string" && typeof callback !== "function") {
      throw Error('Invalid usage, define either parameter "source" or "callback".');
    }
    this.includes = vlib.Array.drop_duplicates(this.includes);
    this.html = void 0;
    this._bundle = void 0;
  }
  // Initialize.
  _initialize(server, endpoint) {
    if (server === void 0) {
      throw Error('Invalid usage, define parameter "server".');
    }
    if (endpoint === void 0) {
      throw Error('Invalid usage, define parameter "endpoint".');
    }
    this._server = server;
    this._endpoint = endpoint;
  }
  // Bundle the compiled typescript / javascript dynamically on demand to optimize server startup for development purposes.
  async _dynamic_bundle() {
    if (this._server === void 0 || this._endpoint === void 0) {
      throw Error('View has not been initialized with "View._initialize()" yet.');
    }
    debug(3, this._endpoint?.route?.id, `: Bundling entry path "${this.source_path?.str()}".`);
    this._bundle = await vts.bundle({
      entry_paths: [this.source_path?.str() ?? ""],
      output: `/tmp/${this._endpoint.route.method}_${this.source_path.str().replace(/\//g, "_")}.js`,
      // esbuild requires an output path to resolve .css and .ttf files etc which can be imported by libraries (such as monaco-editor).
      minify: false,
      //this._server.production,
      platform: "browser",
      // format: "esm",
      format: "iife",
      target: "es2022",
      // target: "esnext",
      // sourcemap: this._server.production ? false : "inline",
      extract_inputs: true,
      // since bundle.inputs is used by server.js.
      tree_shaking: true
    });
    if (this._bundle.errors.length > 0) {
      error(this._endpoint?.route?.id, `: Encountered an error while bundling "${this.source}".
`, this._bundle.debug());
      return;
    }
    this.payments = this._bundle.inputs.find((path) => path.endsWith("/modules/paddle.js"));
    await this._build_html();
  }
  /** Ensure the view is bundled when required. */
  async ensure_bundle() {
    if (this.is_js_ts_view && !this._bundle) {
      return this._dynamic_bundle();
    }
  }
  // Build html.
  async _build_html() {
    if (this._server == null || this._endpoint == null) {
      throw Error('View has not been initialized with "View._initialize()" yet.');
    }
    if (this.is_js_ts_view && !this._bundle) {
      await this._dynamic_bundle();
    }
    const line_break = this._server.production ? "\n" : "\n";
    const has_bundle = this._bundle != null && typeof this._bundle === "object";
    this.html = "";
    this.html += `<!DOCTYPE html><html style='min-width:100%;min-height:100%;' lang='${this.lang}'>${line_break}`;
    this.html += `<head>${line_break}`;
    if (this.meta) {
      this.html += this.meta.build_html(this._server.full_domain) + line_break;
    }
    const embed_stylesheet = (url, embed) => {
      if (embed == null && url != null && url.charAt(0) === "/") {
        for (const endpoint of this._server.endpoints.values()) {
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
      View._volt_css = await new vlib.Path(import_frontend.default.css.volt).load();
    }
    if (!View._vhighlight_css) {
      View._vhighlight_css = await new vlib.Path(vhighlight.web_exports.css).load();
    }
    embed_stylesheet(void 0, View._volt_css);
    embed_stylesheet(void 0, View._vhighlight_css);
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
    this.links.forEach((url) => {
      if (typeof url === "string") {
        this.html += `<link rel="stylesheet" href="${url}">`;
      } else if (typeof url === "object") {
        if (typeof url === "object" && url.rel === "stylesheet" && url.embed !== true && typeof url.href === "string" && embed_stylesheet(import_route.Route.clean_endpoint(url.href))) {
        } else {
          if (url.async) {
            include_link_async(url);
          } else {
            this.html += "<link";
            Object.keys(url).forEach((key) => {
              if (key !== "embed") {
                this.html += ` ${key}="${url[key]}"`;
              }
            });
            this.html += ">" + line_break;
          }
        }
      } else {
        throw Error('Invalid type for a css include, the valid value types are "string" and "object".');
      }
    });
    if (include_links_script) {
      this.html += `<script>${line_break}${include_links_script}${line_break}</script>${line_break}`;
    }
    this.html += "</head>" + line_break;
    this.html += "<body id='body' style='width:100vw;height:100vh;margin:0;padding:0;";
    if (this.body_style != null) {
      this.html += this.body_style;
    }
    this.html += "'>" + line_break;
    if (this.splash_screen != null) {
      this.html += this.splash_screen.html + line_break;
    }
    const embed_script = (url) => {
      let embed;
      for (const endpoint of this._server.endpoints.values()) {
        if (url === endpoint.route.endpoint_str && (endpoint.raw_data != null || endpoint.data != null)) {
          embed = endpoint;
        }
      }
      if (embed && (embed.raw_data || embed.data)) {
        if (embed.content_type === "application/javascript") {
          this.html += `<script>${line_break}${embed.raw_data || embed.data}${line_break}</script>${line_break}`;
        } else {
          this.html += `<script type='${embed.content_type}'>${line_break}${embed.raw_data || embed.data}${line_break}</script>${line_break}`;
        }
        this._embedded_sources.push(url);
        return true;
      }
      return false;
    };
    let include_js_script = `async function __volt_incl_js(url, async = true) {var script=document.createElement('script');if(async){script.async = true;}script.src=url;document.head.appendChild(script);};${line_break}`;
    if (this.jquery) {
      this.html += "<script src='https://ajax.googleapis.com/ajax/libs/jquery/3.6.4/jquery.min.js'></script>" + line_break;
    }
    if (this._server.google_tag !== void 0) {
      include_js_script += `__volt_incl_js("https://www.googletagmanager.com/gtag/js?id=${this._server.google_tag}");${line_break}`;
    }
    this.html += `<script>${line_break}window.volt_statics_aspect_ratios = ${JSON.stringify(Object.fromEntries(this._server.statics_aspect_ratios))}${line_break}</script>${line_break}`;
    if (this._server.payments) {
      if (this._server.payments.type === "paddle") {
        if (this.payments) {
          include_js_script += `__volt_incl_js("https://cdn.paddle.com/paddle/v2/paddle.js");${line_break}`;
        }
      }
    }
    this.html += `<script>${line_break}${include_js_script.trimEnd()}${line_break}</script>${line_break}`;
    this.includes.forEach((url) => {
      if (typeof url === "string" && embed_script(url)) {
      } else {
        if (typeof url === "string") {
          this.html += `<script src='${url}'></script>${line_break}`;
        } else if (typeof url === "object") {
          this.html += "<script";
          Object.keys(url).forEach((key) => {
            if (key !== "embed") {
              this.html += ` ${key}="${url[key]}"`;
            }
          });
          this.html += "></script>" + line_break;
        } else {
          throw Error('Invalid type for a js include, the valid value types are "string" and "object".');
        }
      }
    });
    if (has_bundle && typeof this._bundle.code === "string") {
      this.html += `<script type='module'>${line_break}${this._bundle.code}${line_break}</script>${line_break}`;
    } else if (typeof this.source === "string") {
      this.html += `<script>${line_break}${await new vlib.Path(this.source).load()}${line_break}</script>${line_break}`;
    } else if (this.callback != null) {
      let code = this.callback.toString();
      this.html += `<script>${line_break}(${code})()${line_break}</script>${line_break}`;
    }
    this.html += "</body>" + line_break;
    this.html += "</html>" + line_break;
  }
  // Serve a client.
  _serve(stream, status_code = 200) {
    debug(2, this._endpoint?.route?.id, ": Serving HTML ", this.html?.slice(0, 50), "...");
    stream.send({
      status: status_code,
      headers: { "Content-Type": "text/html" },
      body: this.html
    });
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  View
});
