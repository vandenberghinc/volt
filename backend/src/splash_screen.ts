/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

import { Stream } from "./stream.js"

// ---------------------------------------------------------
// Splash screen.
/*  @docs:
 *  @nav: Backend
 *  @chapter: Endpoints
 *  @title: Splash screen
 *  @description: The splash screen that can be used on the `View` class.
 *  @parameter:
 *      @name: background
 *      @description: The background color of the splash screen.
 *      @type: null, string
 *  @parameter:
 *      @name: image
 *      @description: The image settings. When left undefined, no image will be shown.
 *      @type: null, object
 *      @attr:
 *          @name: src
 *          @description: The image source.
 *          @type: string
 *          @required: true
 *      @attr:
 *          @name: width
 *          @description: The image width in pixels as a number.
 *          @type: number
 *      @attr:
 *          @name: height
 *          @description: The image height in pixels as a number.
 *          @type: number
 *      @attr:
 *          @name: style
 *          @description: The CSS style to for the image element.
 *          @type: null, string
 *  @parameter:
 *      @name: loader
 *      @description: 
 *          The loader settings. When left undefined, no loader will be shown.
 *
 *          No loader will be shown when the loader is `null` or `false`. When the loader is `true` or the type is `object` the loader will always be shown. Multiple options can be defined to customize the loader.
 *      @type: null, boolean, object
 *      @attr:
 *          @name: color
 *          @description: The color of the loader.
 *          @type: string
 *      @attr:
 *          @name: size
 *          @description: The loader size in pixels as a number.
 *          @type: number
 *  @parameter:
 *      @name: style
 *      @description: The CSS style to add the main element of the splash screen.
 *      @type: null, string
 */
export class SplashScreen {

    background: string | null;
    image: {
        src: string;
        width?: number;
        height?: number;
        style?: string | null;
        alt?: string;
    } | null;
    loader: boolean | {
        color?: string;
        size?: number;
    } | null;
    style: string | null;
    _html: string | undefined;

    // Constructor.
    constructor({
        background = null,
        image = null,
        loader = true,
        style = null,
    }: {
        background?: string | null;
        image?: {
            src: string;
            width?: number;
            height?: number;
            style?: string | null;
            alt?: string;
        } | null;
        loader?: boolean | {
            color?: string;
            size?: number;
        } | null;
        style?: string | null;
    }) {

        // Arguments.
        this.background = background;
        this.image = image;
        this.loader = loader;
        this.style = style;

        // Attributes.
        this._html = undefined;
    }

    // Get html.
    get html() {

        // Cached.
        if (this._html !== undefined) {
            return this._html;
        }

        // Initialize html.
        this._html = `<div id='__volt_splash_screen' style='width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; ${this.background == null ? "" : "background: " + this.background}; ${this.style == null ? "" : this.style};'>`;

        const margin_between_img_and_loader = this.loader && this.image != null && this.image.src != null ? "50px" : null;

        // Create the image.
        if (this.image != null && this.image.src != null) {
            this._html += "" +
            `<img src='${this.image.src}' alt='${this.image!.alt || "Icon"}' ` +
            `${this.image.width ? "width='"+this.image.width+"'" : ""} ${this.image.height ? "height='"+this.image.height+"'" : ""} ` +
            `style='${this.image.width ? "width: "+this.image.width+";" : ""} ${this.image.height ? "height: "+this.image.height+";" : ""} ` +
            `${margin_between_img_and_loader ? "margin-bottom: "+margin_between_img_and_loader : ""}; ` +
            `${this.image.style == null ? "" : this.image.style};'>`
        }

        // Create loader.
        if (this.loader) {
            const size = typeof this.loader === 'object' && this.loader.size ? this.loader.size : 60;
            const color = typeof this.loader === 'object' && this.loader.color ? this.loader.color : "#fff";
            this._html += "<style>" +
            ".__volt_splash_screen_loader {" +
            "  display: inline-block;" +
            "  position: relative;" +
            `  width: calc(${size}px / 2);` +
            `  height: calc(${size}px / 2);` +
            `  position: absolute; bottom: 50px;` +
            "}" +
            ".__volt_splash_screen_loader div {" +
            "  box-sizing: border-box;" +
            "  display: block;" +
            "  position: absolute;" +
            `  width: calc(${64 / 80 * size}px / 2);` +
            `  height: calc(${64 / 80 * size}px / 2);` +
            `  margin: calc(${8 / 80 * size}px / 2);` +
            `  border: calc(${8 / 80 * size}px / 2) solid ${color};` +
            "  border-radius: 50%;" +
            "  animation: __volt_splash_screen_loader 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;" +
            `  border-color: ${color} transparent transparent transparent;` +
            "}" +
            ".__volt_splash_screen_loader div:nth-child(1) {" +
            "  animation-delay: -0.45s;" +
            "}" +
            ".__volt_splash_screen_loader div:nth-child(2) {" +
            "  animation-delay: -0.3s;" +
            "}" +
            ".__volt_splash_screen_loader div:nth-child(3) {" +
            "  animation-delay: -0.15s;" +
            "}" +
            "@keyframes __volt_splash_screen_loader {" +
            "  0% {" +
            "    transform: rotate(0deg);" +
            "  }" +
            "  100% {" +
            "    transform: rotate(360deg);" +
            "  }" +
            "}</style>" +
            `<div class='__volt_splash_screen_loader'><div></div><div></div><div></div><div></div></div>`
        }

        // Close.
        this._html += "</div>";

        // Handler.
        return this._html;
    }

    // Serve a client.
    _serve(stream: Stream) {
        stream.send({
            status: 200, 
            headers: {"Content-Type": "text/html"}, 
            data: this.html,
        });
    }
}
export default SplashScreen;