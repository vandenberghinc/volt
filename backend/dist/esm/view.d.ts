import * as vlib from "@vandenberghinc/vlib";
import Meta from "./meta.js";
import { Endpoint } from "./endpoint.js";
import Server from "./server.js";
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
export declare class View {
    static includes: Array<string | Record<string, any>>;
    static links: Array<string | Record<string, any>>;
    static body_style: string | null;
    static splash_screen: any;
    private static _volt_css?;
    private static _vhighlight_css?;
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
    min_device_width?: number;
    _server?: Server;
    _endpoint?: Endpoint;
    constructor({ source, callback, includes, links, templates, meta, jquery, lang, body_style, splash_screen, tree_shaking, mangle, min_device_width, _src, }: {
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
        min_device_width?: number;
        _src?: string;
    });
    _initialize(server: Server, endpoint: Endpoint): void;
    private _dynamic_bundle;
    /** Ensure the view is bundled when required. */
    ensure_bundle(): Promise<void>;
    _build_html(): Promise<void>;
    _serve(stream: any, status_code?: number): void;
}
export declare namespace View {
    type Opts = ConstructorParameters<typeof View>[0];
}
