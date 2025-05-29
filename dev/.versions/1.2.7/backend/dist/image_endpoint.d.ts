export = ImageEndpoint;
declare class ImageEndpoint extends Endpoint {
    static cache_in_memory: boolean;
    static supported_images: string[];
    constructor({ endpoint, path, content_type, cache, _is_static, }: {
        endpoint?: null | undefined;
        path?: null | undefined;
        content_type?: null | undefined;
        cache?: boolean | undefined;
        _is_static?: boolean | undefined;
    });
    i_path: any;
    i_type: any;
    i_data: any;
    i_cache: Map<any, any> | undefined;
    is_image_endpoint: boolean;
    callback: (stream: any, params: any) => Promise<any>;
    transform(type?: null, width?: null, height?: null, aspect_ratio?: boolean): Promise<Buffer>;
    get_aspect_ratio(): Promise<string | null>;
    _clear_cache(): void;
}
import Endpoint = require("./endpoint.js");
