/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */
// ---------------------------------------------------------
// Libraries.
import sharp from 'sharp';
import { Endpoint } from "./endpoint.js";
import { logger } from "./logger.js";
const { log, error } = logger;
// ---------------------------------------------------------
// ImageEndpoint.
// Supports resizing and editing formats.
/*  @docs:
    @nav: Backend
    @chapter: Endpoints
    @title: Image Endpoint
    @description:
        All static images are served through the `ImageEndpoint`.

        The image endpoint accepts three optional query parameters when retrieving the image to transform the image.
         - `type` string: The input type.
         - `width` number: The height of the image as a number `100` or percentage `50%` / `0.5x`. The aspect ratio will be maintained when `height` is undefined.
         - `height` number: The width of the image as a number `100` or percentage `50%` / `0.5x`. The aspect ratio will be maintained when `width` is undefined.
         - `aspect_ratio` boolean: Maintain the aspect ratio when only one resizing dimension has been defined.
 */
class ImageEndpoint extends Endpoint {
    // Cache the original and transformed image data in memory.
    static cache_in_memory = false;
    // Supported image extensions.
    static supported_images = [
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
    ];
    i_path;
    i_type;
    i_data;
    i_cache;
    is_image_endpoint;
    constructor({ endpoint, path, content_type, cache = true, _is_static = true, rate_limit = undefined, }) {
        // Initialize base.
        super({
            method: "GET",
            endpoint,
            content_type,
            compress: false,
            cache,
            params: {
                "type": { type: "string", default: null },
                "width": { type: ["number", "string"], default: null },
                "height": { type: ["number", "string"], default: null },
                "aspect_ratio": { type: "string", default: null },
            },
            rate_limit,
            _static_path: path.str(),
            _is_static,
        });
        // Attributes.
        this.i_path = path.abs();
        this.i_type = this.i_path.extension().substr(1);
        this.i_cache = new Map();
        if (ImageEndpoint.cache_in_memory) {
            this.i_data = this.i_path.load_sync({ type: "buffer" });
        }
        // Attribute for Endpoint.
        this.is_image_endpoint = true;
        // Assign callback.
        this.callback = async (stream, params) => {
            // const buff = await fs.readFile(this.i_path.str())
            const buff = await this.i_path.load({ type: "buffer" });
            // const buff = await sharp(this.i_path.str())
            //     // .png()
            //     .toBuffer();
            // stream.set_header("Content-Length", datax.length.toString());
            return stream.send({
                status: 200,
                data: buff,
                headers: {
                    "Content-Length": buff.length.toString(),
                }
            });
            // No params.
            if ((params.type == null || this.i_type === params.type) &&
                params.width == null &&
                params.height == null) {
                return stream.send({
                    status: 200,
                    data: ImageEndpoint.cache_in_memory ? this.i_data : this.i_path.load_sync({ type: "buffer" }),
                });
            }
            // Remove type from params when same as original type.
            if (this.i_type === params.type) {
                params.type = null;
            }
            // Check cache.
            let cache_id;
            if (ImageEndpoint.cache_in_memory) {
                cache_id = `${params.width == null ? "" : params.width}.${params.height == null ? "" : params.height}.${params.type == null ? "" : params.type}`;
                if (this.i_cache.has(cache_id)) {
                    return stream.send({
                        status: 200,
                        data: this.i_cache.get(cache_id),
                    });
                }
            }
            // Transform image.
            const data = await this.transform(params.type, params.width, params.height, params.aspect_ratio);
            if (ImageEndpoint.cache_in_memory && cache_id) {
                this.i_cache.set(cache_id, data);
            }
            return stream.send({
                status: 200,
                data,
            });
        };
    }
    // Transform image.
    async transform(type = null, width = null, height = null, aspect_ratio = true) {
        const img = sharp(this.i_path.str());
        let metadata;
        if (width != null || height != null) {
            let parsed_width;
            let parsed_height;
            if (typeof width === "string") {
                let last_char = width.charAt(width.length - 1);
                if (last_char === "%" || last_char === "x") {
                    if (metadata === undefined) {
                        metadata = await img.metadata();
                    }
                    if (last_char === "x") {
                        parsed_width = parseInt(String(metadata.width * parseFloat(width)));
                    }
                    else {
                        parsed_width = parseInt(String(metadata.width * (parseFloat(width) / 100)));
                    }
                }
                else {
                    parsed_width = parseInt(width);
                }
            }
            else if (typeof width === "number") {
                parsed_width = parseInt(String(width));
            }
            if (typeof height === "string") {
                let last_char = height.charAt(height.length - 1);
                if (last_char === "%" || last_char === "x") {
                    if (metadata === undefined) {
                        metadata = await img.metadata();
                    }
                    if (last_char === "x") {
                        parsed_height = parseInt(String(metadata.height * parseFloat(height)));
                    }
                    else {
                        parsed_height = parseInt(String(metadata.height * (parseFloat(height) / 100)));
                    }
                }
                else {
                    parsed_height = parseInt(height);
                }
            }
            else if (typeof height === "number") {
                parsed_height = parseInt(String(height));
            }
            const opts = {
                width: parsed_width,
                height: parsed_height
            };
            if (aspect_ratio === "false" || aspect_ratio === false) {
                opts.fit = 'fill';
            }
            img.resize(opts);
        }
        if (type != null) {
            img.toFormat(type);
        }
        return img.toBuffer();
    }
    // Get aspect ratio.
    async get_aspect_ratio() {
        try {
            const metadata = await sharp(this._static_path).metadata();
            return `${metadata.width} / ${metadata.height}`;
        }
        catch (err) {
            error(`Unable to determine the aspect ratio of image ${this._static_path}: `, err);
            return null;
        }
    }
    // Clear cache.
    _clear_cache() {
        if (ImageEndpoint.cache_in_memory) {
            this.i_cache.clear();
        }
    }
}
// ---------------------------------------------------------
// Exports.
export { ImageEndpoint };
