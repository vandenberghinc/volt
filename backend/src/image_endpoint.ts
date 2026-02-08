/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */

// ---------------------------------------------------------
// Libraries.

import sharp from 'sharp';
import { promises as fs } from "fs"

// ---------------------------------------------------------
// Imports.

import * as vlib from "@vandenberghinc/vlib";
import { Endpoint } from "./endpoint.js";
import { RateLimitGroup } from "./rate_limit.js";
import type { Server } from "./server.js";
import Stream from './stream.js';

// ---------------------------------------------------------
// ImageEndpoint.
// Supports resizing and editing formats.

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
class ImageEndpoint extends Endpoint implements Endpoint {

    // Cache the original and transformed image data in memory.
    // static cache_in_memory = false;

    // Supported image extensions.
    static supported_images: Set<string> = new Set([
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".gif",
        ".tif",
        ".tiff",
        ".svg",
        ".heif",
        ".avif"
    ]);

    private i_path: vlib.Path;
    private i_type: string;
    // private i_data?: Buffer;
    public is_image_endpoint: boolean;

    /**
     * A cache of all transformed image paths, mapped by cache id.
     * We use a cached path since `stat` will be used inside the Stream.send() method.
     * Since this is cached in the Path object, it will be efficient.
     */
    private transformed_cache: Map<string, vlib.Path> = new Map();

    /**
     * Construct an image endpoint.
     * @docs
     */
    constructor({
        endpoint,
        path,
        cache = true,
        _is_static = true,
        rate_limit = undefined,
    }: {
        endpoint: string,
        path: vlib.Path,
        cache?: boolean | number,
        _is_static?: boolean,
        rate_limit?: string | RateLimitGroup,
    }) {
        // Initialize base.
        super({
            method: "GET",
            endpoint,
            compress: false,
            cache,
            params: {
                "type": {type: "string", default: null},
                "width": {type: ["number", "string"], default: null},
                "height": {type: ["number", "string"], default: null},
                "aspect_ratio": {type: "string", default: null},
            },
            rate_limit,
            file_path: path,
            _is_static,
        })

        // Attributes.
        this.i_path = path.abs();
        this.i_type = this.i_path.extension().substr(1)
        // if (ImageEndpoint.cache_in_memory) {
        //     this.i_data = this.i_path.load_sync({type: "buffer"});
        // }

        // Attribute for Endpoint.
        this.is_image_endpoint = true;

        // Assign callback.
        this.callback = async (stream: Stream, params: {
            type: string | null,
            width: number | string | null,
            height: number | string | null,
            aspect_ratio: string | null,
        }) => {
            
            // No params.
            if (
                (params.type == null || this.i_type === params.type) &&
                params.width == null &&
                params.height == null
            ) {
                return stream.send({
                    status: 200, 
                    from_file: this.i_path.str(),
                });
            }

            // Cache id.
            const cache_id = (
                `${this.route.method}:${this.route.endpoint_str}` + 
                `:${params.width == null ? "" : params.width}.${params.height == null ? "" : params.height}.${params.type == null ? this.i_type : params.type}`
            ).replaceAll("/", "_");
            let cache_path: vlib.Path;
            if (this.transformed_cache.has(cache_id)) {
                cache_path = this.transformed_cache.get(cache_id)!;
            } else {
                cache_path = this.server!.endpoint_cache_dir.join(cache_id);
                this.transformed_cache.set(cache_id, cache_path);
            }

            // Fast path from cached transformation.
            if (cache_path.exists()) {
                return stream.send({
                    status: 200, 
                    from_file: cache_path,
                });
            }

            // Remove type from params when same as original type.
            if (this.i_type === params.type) {
                params.type = null;
            }

            // Transform image & save to cache.
            const data = await this.transform(params.type, params.width, params.height, params.aspect_ratio);
            await cache_path.save(data);

            // Send data.
            return stream.send({
                status: 200, 
                from_file: cache_path,
            });
        }
    }

    // Transform image.
    async transform(
        type: string | null = null, 
        width: number | string | null = null, 
        height: number | string | null = null, 
        aspect_ratio: string | boolean | null = true
    ): Promise<Buffer> {
        const img = sharp(this.i_path.str())
        let metadata: sharp.Metadata | undefined;
        
        if (width != null || height != null) {
            let parsed_width: number | undefined;
            let parsed_height: number | undefined;

            if (typeof width === "string") {
                let last_char = width.charAt(width.length - 1);
                if (last_char === "%" || last_char === "x") {
                    if (metadata === undefined) {
                        metadata = await img.metadata();
                    }
                    if (last_char === "x") {
                        parsed_width = parseInt(String(metadata.width! * parseFloat(width)));
                    } else {
                        parsed_width = parseInt(String(metadata.width! * (parseFloat(width) / 100)));
                    }
                } else {
                    parsed_width = parseInt(width);
                }
            } else if (typeof width === "number") {
                parsed_width = parseInt(String(width));
            }

            if (typeof height === "string") {
                let last_char = height.charAt(height.length - 1);
                if (last_char === "%" || last_char === "x") {
                    if (metadata === undefined) {
                        metadata = await img.metadata();
                    }
                    if (last_char === "x") {
                        parsed_height = parseInt(String(metadata.height! * parseFloat(height)));
                    } else {
                        parsed_height = parseInt(String(metadata.height! * (parseFloat(height) / 100)));
                    }
                } else {
                    parsed_height = parseInt(height);
                }
            } else if (typeof height === "number") {
                parsed_height = parseInt(String(height));
            }

            const opts: sharp.ResizeOptions = {
                width: parsed_width,
                height: parsed_height
            };
            if (aspect_ratio === "false" || aspect_ratio === false) {
                opts.fit = 'fill';
            }
            img.resize(opts)
        }
        if (type != null) {
            img.toFormat(type as keyof sharp.FormatEnum)
        }
        return img.toBuffer();
    }

    // Get aspect ratio.
    async get_aspect_ratio(): Promise<string | null> {
        try {
            const metadata = await sharp(this.file_path?.str()).metadata();
            return `${metadata.width} / ${metadata.height}`;
        } catch (err: unknown) {
            this.server?.log.error(`Unable to determine the aspect ratio of image ${this.file_path}: `, err);
            return null;
        }
    }
}

// ---------------------------------------------------------
// Exports.

export { ImageEndpoint };