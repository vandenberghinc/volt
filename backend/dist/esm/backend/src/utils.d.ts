/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh.
 */
import * as vlib from "@vandenberghinc/vlib";
export declare namespace Utils {
    function fill_templates(data: string, templates: Record<string, any>, curly_style?: boolean): string;
    /** Get the mime type by file extension. */
    function mime_type(extension: string): string | null;
    /** Check if a file extension is compressed. */
    function is_compressed_extension(extension: string): boolean;
    /** Check if a content type is compressed. */
    function is_compressed_content_type(content_type: string): boolean;
    function get_currency_symbol(currency: string): string | null;
    function get_compiled_cache(domain: string, method: string, endpoint: string): {
        cache_path: vlib.Path;
        cache_hash: any;
        cache_data: any;
    };
    function set_compiled_cache(path: vlib.Path, data: string, hash: string): void;
}
export { Utils as utils };
