/**
 * Platform options for bundling.
 */
type Platform = 'browser' | 'node';
/**
 * Output formats based on platform.
 */
type Format = 'iife' | 'umd' | 'cjs' | 'esm';
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
    platform?: Platform;
    /**
     * Target platform: 'ES2023' etc.
     */
    target?: string;
    /**
     * Output format based on platform.
     * - For 'browser': 'iife' or 'umd'
     * - For 'node': 'cjs' or 'esm'
     */
    format?: Format;
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
    preprocess?: (file_path: string, content: string) => string;
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
    errors: string[];
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
 * @param main_entry_path The main entry point TypeScript file path.
 * @param additional_entry_paths Optional array of additional entry point TypeScript file paths.
 * @param options Optional bundling options.
 * @returns A promise that resolves to the bundling result containing code, errors, and source_map.
 */
declare function bundle(options: BundleTypescriptOptions): Promise<BundleResult>;
export { bundle, BundleTypescriptOptions, BundleResult };
