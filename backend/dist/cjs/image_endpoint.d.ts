import * as vlib from "@vandenberghinc/vlib";
import { Endpoint } from "./endpoint.js";
import { RateLimitGroup } from "./rate_limit.js";
declare class ImageEndpoint extends Endpoint implements Endpoint {
    static cache_in_memory: boolean;
    static supported_images: string[];
    private i_path;
    private i_type;
    private i_data?;
    private i_cache;
    is_image_endpoint: boolean;
    constructor({ endpoint, path, content_type, cache, _is_static, rate_limit, }: {
        endpoint: string;
        path: vlib.Path;
        content_type: string;
        cache?: boolean | number;
        _is_static?: boolean;
        rate_limit?: string | RateLimitGroup;
    });
    transform(type?: string | null, width?: number | string | null, height?: number | string | null, aspect_ratio?: string | boolean | null): Promise<Buffer>;
    get_aspect_ratio(): Promise<string | null>;
    _clear_cache(): void;
}
export { ImageEndpoint };
