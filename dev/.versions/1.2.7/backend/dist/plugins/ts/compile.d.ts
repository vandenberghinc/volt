/**
 * Options for bundling TypeScript code.
 */
export interface CompileOptions {
    entry_paths: string[];
    output: string;
    error_limit?: number;
    /**
     * Function to preprocess TypeScript code after transpilation.
     * Receives the file path and its transpiled JavaScript content, returns modified content.
     */
    preprocess?: (file_path: string, content: string) => string | Promise<string>;
    /**
     * Custom TypeScript compiler options.
     */
    tsconfig?: Record<string, any>;
}
/**
 * Result of the bundling process.
 */
export interface CompileResult {
    success: boolean;
    emitted_files: string[];
    /**
     * Compilation and bundling errors, if any.
     */
    errors: string[];
    /**
     * Debug function.
     */
    debug: () => void;
}
export declare function compile(options: CompileOptions): Promise<CompileResult>;
/**
 * Options for bundling TypeScript code.
 */
export interface BundleOptions {
    entry_paths: string[];
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
     * Enable or disable source map generation.
     */
    sourcemap?: boolean;
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
    errors: any[];
    /**
     * Source map, if generated.
     */
    source_map?: string;
    /**
     * Debug function.
     */
    debug: () => void;
}
export declare function bundle(options: BundleOptions): Promise<BundleResult>;
