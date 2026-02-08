/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
import * as vlib from "@vandenberghinc/vlib";
import { Endpoint } from "./endpoint.js";
import { RateLimitGroup } from "./rate_limit.js";
/**
 * All static images are served through the `ImageEndpoint`.
 *
 * The image endpoint accepts three optional query parameters when retrieving the image to transform the image.
 *     - `type` string: The input type.
 *     - `width` number: The height of the image as a number `100` or percentage `50%` / `0.5x`. The aspect ratio will be maintained when `height` is undefined.
 *     - `height` number: The width of the image as a number `100` or percentage `50%` / `0.5x`. The aspect ratio will be maintained when `width` is undefined.
 *     - `aspect_ratio` boolean: Maintain the aspect ratio when only one resizing dimension has been defined.
 * @docs
 * @nav Endpoints
 */
declare class ImageEndpoint extends Endpoint implements Endpoint {
    static supported_images: Set<string>;
    private i_path;
    private i_type;
    is_image_endpoint: boolean;
    /**
     * A cache of all transformed image paths, mapped by cache id.
     * We use a cached path since `stat` will be used inside the Stream.send() method.
     * Since this is cached in the Path object, it will be efficient.
     */
    private transformed_cache;
    /**
     * Construct an image endpoint.
     * @docs
     */
    constructor({ endpoint, path, cache, _is_static, rate_limit, }: {
        endpoint: string;
        path: vlib.Path;
        cache?: boolean | number;
        _is_static?: boolean;
        rate_limit?: string | RateLimitGroup;
    });
    transform(type?: string | null, width?: number | string | null, height?: number | string | null, aspect_ratio?: string | boolean | null): Promise<Buffer>;
    get_aspect_ratio(): Promise<string | null>;
}
export { ImageEndpoint };
