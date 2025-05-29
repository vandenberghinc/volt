import * as Preprocessing from "./preprocessing.js";
interface CompilerError {
    data: string;
    file_name?: string;
    line?: number;
    column?: number;
}
/**
 * Options for bundling TypeScript code.
 */
export interface CompileOptions {
    include?: string[];
    exclude?: string[];
    entry_paths?: string[];
    output: string;
    error_limit?: number;
    debug_file?: string;
    file_by_file?: boolean;
    /**
     * Function to preprocess TypeScript code after transpilation.
     * Receives the file path and its transpiled JavaScript content, returns modified content.
     */
    preprocess?: (file_path: string, content: string) => undefined | string | Promise<undefined | string>;
    /**
     * TypeScript compiler options.
     */
    compiler_opts?: Record<string, any>;
    exact_files?: boolean;
    watch?: boolean | {
        enabled: boolean;
        log_level?: number;
        on_change?: (path: string) => any;
    };
    extract_exports?: boolean;
    templates?: Record<string, any>;
}
/**
 * Result of the bundling process.
 */
export interface CompileResult {
    inputs: string[];
    outputs: string[];
    /**
     * Compilation and bundling errors, if any.
     */
    errors: CompilerError[];
    /**
     * Debug function.
     */
    debug: (_watch?: boolean) => void;
    /**
     * Function to terminate the watch program. Available only in watch mode.
     */
    stop?: () => void;
    exports: Record<string, string[]>;
}
export declare function compile(options: CompileOptions): Promise<CompileResult>;
/**
 * Options for bundling TypeScript code.
 */
export interface BundleOptions {
    include?: string[];
    output?: string | string[];
    entry_paths?: string[];
    error_limit?: number;
    /**
     * Target platform: 'browser' or 'node'.
     */
    platform?: 'browser' | 'node';
    /**
     * Target platform: 'ES2023' etc.
     */
    target?: string;
    /**
     * Output format based on platform.
     * - For 'browser': 'iife' or 'umd'
     * - For 'node': 'cjs' or 'esm'
     */
    format?: 'iife' | 'cjs' | 'esm';
    /**
     * Enable or disable minification.
     */
    minify?: boolean;
    /**
     * Enable or disable tree shaking.
     */
    tree_shaking?: boolean;
    /** External library names not to be included in the bundle */
    externals?: string[];
    /**
     * Enable or disable debug console statements.
     */
    debug?: string | boolean;
    /**
     * Enable or disable source map generation.
     */
    sourcemap?: boolean | 'linked' | 'inline' | 'external' | 'both';
    extract_inputs?: boolean;
    /**
     * Specify which bundler to use: 'esbuild' or 'rollup'.
     * If undefined, defaults to 'esbuild'.
     */
    bundler?: 'esbuild' | 'rollup';
    opts?: any;
    postprocess?: undefined | ((data: string) => string | Promise<string>);
    /** Log level (default is 0) */
    log_level?: number;
    /** Analyze */
    analyze?: boolean;
}
/**
 * Result of the bundling process.
 */
export interface BundleResult {
    /**
     * Bundled JavaScript code.
     */
    code?: string;
    /**
     * Compilation and bundling errors, if any.
     */
    errors: CompilerError[];
    /**
     * Source map, if generated.
     */
    source_map?: string;
    /**
     * Debug function.
     */
    debug: () => void;
    inputs: string[];
}
export declare function bundle(options: BundleOptions): Promise<BundleResult>;
declare const _default: {
    compile: typeof compile;
    bundle: typeof bundle;
    preprocessing: typeof Preprocessing;
};
export default _default;
