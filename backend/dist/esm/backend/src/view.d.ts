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
 * The view class can be used to create HTML pages through JavaScript or TypeScript source code.
 * The view instance or constructor options can be passed to an {@link Endpoint} to serve the view at a specific route.
 *
 * @docs
 * @nav Endpoints
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
     *
     * @docs
     */
    clone(this: View, override?: Partial<View.Opts>): View;
    /**
     * Options for constructing a {@link View} instance.
     * @docs
     */
    constructor({ source, callback, includes, links, templates, meta, jquery, lang, body_style, splash_screen, tree_shaking, mangle, min_device_width, _src, }: {
        /** The file path to the client side JavaScript source code. */
        source?: string | null;
        /**
         * The client side callback function; this function will be executed at the client side.
         * For this feature the `Content-Security-Policy: script-src` must be updated with, for example, `unsafe-inline`.
         */
        callback?: Function | null;
        /**
         * The included static JS files.
         * By default, the local includes will be embedded into the HTML page. However, this behaviour can be disabled by passing an object of type `IncludeObject` with the attribute `embed = false`.
         */
        includes?: (string | Record<string, any>)[];
        /**
         * The included static CSS files.
         * By default, the local links will be embedded into the HTML page. However, this behaviour can be disabled by passing an object of type `LinkObject` with the attribute `embed = false`.
         */
        links?: (string | Record<string, any>)[];
        /**
         * Templates that will replace the `callback` code. Templates can be created using the `$TEMPLATE` template style.
         * However, templates will only be used on the code of the `callback` attribute.
         */
        templates?: Record<string, any>;
        /** The meta information object. */
        meta?: Meta;
        /** Include jQuery by default. */
        jquery?: boolean;
        /** The style of the `<body>` element. When left undefined, the static attribute `View.body_style` will be used. */
        lang?: string;
        body_style?: string | null;
        /** The splash screen settings. When left undefined, the static attribute `View.splash_screen` will be used. */
        splash_screen?: SplashScreen;
        /** Optimize JavaScript source code by removing dead code. */
        tree_shaking?: boolean;
        /** Optimize JavaScript source code by mangling function names. */
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
