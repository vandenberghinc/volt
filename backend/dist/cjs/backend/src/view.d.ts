/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
import * as vlib from "@vandenberghinc/vlib";
import * as vts from "@vandenberghinc/vlib/vts";
import { Meta } from "./meta.js";
import { Endpoint } from "./endpoint.js";
import { Server } from "./server.js";
import { SplashScreen } from "./splash_screen.js";
import Stream from "./stream.js";
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
    static splash_screen: SplashScreen | undefined;
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
    splash_screen: SplashScreen | undefined;
    tree_shaking: boolean;
    mangle: boolean;
    _src?: string;
    _embedded_sources: Array<string>;
    is_js_ts_view: boolean;
    private _html?;
    raw_html?: string | Buffer;
    _bundle?: vts.BundleResult;
    payments?: string | undefined;
    min_device_width?: number;
    server?: Server;
    endpoint?: Endpoint;
    /**
     * Clone this view, used to create a modified copy of the current view.
     * @note
     * The following attributes are not deep copied, but just referenced:
     * - `callback`
     * - `params`
     * - `data`
     * @param override Override specific endpoint options, note that this will be shallow merged.
     */
    clone(this: View, override?: Partial<View.Opts>): View;
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
        splash_screen?: SplashScreen;
        tree_shaking?: boolean;
        mangle?: boolean;
        min_device_width?: number;
        _src?: string;
    });
    initialize(server: Server, endpoint: Endpoint): void;
    /** Production initialization. */
    production_initialize(): Promise<void>;
    private _dynamic_bundle;
    /** Ensure the view is bundled when required. */
    ensure_bundle(): Promise<void>;
    /** Create an error HTML file when errors are encountered during the bundle process. */
    private _build_bundle_err_html;
    private _build_html;
    /** Retrieve the content length of the built html. */
    content_length(): Promise<number>;
    /** Retrieve the HTML. */
    html(opts?: {
        /** Compress content. */
        compress?: boolean;
        /** Add new templates, overriding the default `View` templates. */
        templates?: Record<string, any>;
    }): Promise<{
        html: string | Buffer;
        content_length: number;
        nonce: string;
    }>;
    _serve(stream: Stream, status_code?: number, opts?: {
        /** Compress. */
        compress?: boolean;
        /** Add new templates, overriding the default `View` templates. */
        templates?: Record<string, any>;
    }): Promise<void>;
    private html_nonce_split?;
}
export declare namespace View {
    type Opts = ConstructorParameters<typeof View>[0];
}
