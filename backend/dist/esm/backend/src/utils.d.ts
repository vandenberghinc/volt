/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh.
 */
import * as vlib from "@vandenberghinc/vlib";
export declare namespace Utils {
    function fill_templates(data: string, templates: Record<string, any>, curly_style?: boolean): string;
    function get_currency_symbol(currency: string): string | null;
    function get_compiled_cache(domain: string, method: string, endpoint: string): {
        cache_path: vlib.Path;
        cache_hash: any;
        cache_data: any;
    };
    function set_compiled_cache(path: vlib.Path, data: string, hash: string): void;
}
export { Utils as utils };
