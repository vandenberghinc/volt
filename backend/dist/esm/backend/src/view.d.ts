/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
import * as vlib from "@vandenberghinc/vlib";
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
    source: string;
    source_path: vlib.Path;
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
    min_device_width?: number;
    server?: Server;
    endpoint?: Endpoint;
    /**
     * The file path of a pre-bundled source, that can be sent from file instead of in-memory data.
     */
    private cached_html_path;
    /**
     * Clone this view, used to create a modified copy of the current view.
     * @note
     * The following attributes are not deep copied, but just referenced:
     * - `params`
     * @param override Override specific endpoint options, note that this will be shallow merged.
     *
     * @docs
     */
    clone(this: View, override?: Partial<View.Opts>): View;
    /**
     * Options for constructing a {@link View} instance.
     * @docs
     */
    constructor({ source, includes, links, templates, meta, jquery, lang, body_style, splash_screen, tree_shaking, mangle, min_device_width, _src, }: {
        /** The file path to the client side JavaScript source code. */
        source: string;
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
         * Templates that will be filled in the bundled source code.
         * Templates can be created through a {{template_name}} syntax.
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
    /**
     * Production initialization.
     * This will bundle the source code and prepare the view for production use.
     * Instead of bundling on demand in the request which is used for development mode.
     */
    production_initialize(): Promise<void>;
    /** Create an error HTML file when errors are encountered during the bundle process. */
    private _build_bundle_err_html;
    private _build_html;
    /** Create the cached HTML file if it doesn't exist. */
    private _create_html_file;
    _serve(stream: Stream, status_code?: number, opts?: {
        /** Compress. */
        compress?: boolean;
        /** Template replacements. */
        templates?: Record<string, string>;
    }): Promise<void>;
}
export declare namespace View {
    type Opts = ConstructorParameters<typeof View>[0];
}
