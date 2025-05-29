export * as Preprocessing from "./preprocessing.js";
export declare function preprocess(path: string, input: string, opts?: {
    macros?: boolean;
    templates?: Record<string, any>;
}): string;
/**
 * Apply volt frontend auto imports preprocessing
 */
export declare function volt_auto_imports(path: string, data: string): undefined | string;
declare const _default: {
    preprocess: typeof preprocess;
    volt_auto_imports: typeof volt_auto_imports;
};
export default _default;
