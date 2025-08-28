import { Stream } from "./stream.js";
/**
 * The splash screen that can be used on the `View` class.
 *
 * @param background The background color of the splash screen.
 * @param image The image settings. When left undefined, no image will be shown.
 * @param image.src The image source.
 * @param image.width The image width in pixels as a number.
 * @param image.height The image height in pixels as a number.
 * @param image.style The CSS style for the image element.
 * @param loader The loader settings. When left undefined, no loader will be shown.
 *
 * No loader will be shown when the loader is `null` or `false`. When the loader is `true` or the type is `object` the loader will always be shown. Multiple options can be defined to customize the loader.
 * @param loader.color The color of the loader.
 * @param loader.size The loader size in pixels as a number.
 * @param style The CSS style to add to the main element of the splash screen.
 * @docs
 */
export declare class SplashScreen {
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
    /**
     * Create a new splash screen configuration.
     *
     * @param background The background color of the splash screen.
     * @param image The image settings. When left undefined, no image will be shown.
     * @param image.src The image source.
     * @param image.width The image width in pixels as a number.
     * @param image.height The image height in pixels as a number.
     * @param image.style The CSS style for the image element.
     * @param loader The loader settings. When left undefined, no loader will be shown.
     * @param loader.color The color of the loader.
     * @param loader.size The loader size in pixels as a number.
     * @param style The CSS style to add to the main element of the splash screen.
     */
    constructor({ background, image, loader, style, }: {
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
    });
    /**
     * Generate and return the splash screen HTML. Result is cached after the first call.
     *
     * @returns The splash screen HTML markup.
     */
    get html(): string;
    /**
     * Serve the splash screen HTML to a client over the provided stream.
     *
     * @param stream The stream used to send the HTTP response.
     */
    _serve(stream: Stream): void;
}
export default SplashScreen;
