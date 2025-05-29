export interface Macro {
    name: string;
    value: string;
    args: string[];
}
export declare const tslib: {
    preprocess(path: string, input: string): string;
    _split_macro_args(data: string): string[];
    _extract_macro_statements(path: string, data: string): [string, Record<string, Macro>];
    _fill_macro_statements(path: string, data: string, macros: Record<string, Macro>): string;
    collect_exports(file_path: string, data: string): Promise<string[]>;
    compile_cli({ source, tsconfig, debug, preprocess, enable_macros, }: {
        source: string;
        tsconfig?: Record<string, any>;
        debug?: {
            error_limit?: number;
            max_line_length?: number;
            debug_single_file?: boolean;
            target_file?: string;
        };
        preprocess?: (name: string, data: string) => any;
        enable_macros?: boolean;
    }): Promise<{
        success: boolean;
    }>;
    compile_and_bundle({ path: entry_path, types, tsconfig, error_limit, preprocess, enable_macros, platform, target, minify, }: {
        path: string;
        types: string[];
        tsconfig?: Record<string, any>;
        error_limit?: number;
        max_line_length?: number;
        preprocess?: (name: string, data: string) => string | Promise<string>;
        enable_macros?: boolean;
        platform?: "browser" | "node";
        target?: string;
        minify?: boolean;
    }): Promise<{
        code: string;
        errors: any[];
        debug: () => void;
    }>;
};
import { Plugin } from 'rollup';
export declare function preprocess_plugin(options?: {
    preprocess?: (name: string, data: string) => string | Promise<string>;
    enable_macros?: boolean;
    include?: RegExp | RegExp[];
    exclude?: RegExp | RegExp[];
}): Plugin;
