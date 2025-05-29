/**
 * Options for bundling TypeScript code.
 */
interface BundleTypescriptOptions {
    entry_path: string;
    additional_entry_paths?: string[];
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
interface BundleResult {
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
/**
 * Bundles TypeScript code into a single JavaScript file in-memory.
 *
 * @param options Bundling options.
 * @returns A promise that resolves to the bundling result containing code, errors, and source_map.
 */
export declare function bundle(options: BundleTypescriptOptions): Promise<BundleResult>;
export {};
