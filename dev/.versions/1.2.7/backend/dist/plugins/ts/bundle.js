"use strict";
/*
 * Author: Daan van den Bergh
 * Copyright: © 2024 - 2024 Daan van den Bergh.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bundle = bundle;
// Imports.
const fs = __importStar(require("fs"));
const esbuild_1 = __importDefault(require("esbuild"));
// Local imports.
const Preprocessing = require("./preprocessing.js");
/**
 * Preprocessing plugin for esbuild.
 * Applies custom preprocessing to TypeScript files.
 *
 * @param preprocess_function User-defined preprocess function.
 * @returns An esbuild plugin.
 */
function preprocess_plugin(preprocess_function) {
    return {
        name: 'preprocess-plugin',
        setup(build) {
            build.onLoad({ filter: /\.(ts|js)x?$/ }, async (args) => {
                try {
                    let content = await fs.promises.readFile(args.path, 'utf8');
                    // Apply predefined preprocessing.
                    content = Preprocessing.preprocess(args.path, content, {
                        macros: true,
                    });
                    // Apply user-defined preprocessing if provided.
                    if (preprocess_function) {
                        let result = preprocess_function(args.path, content);
                        if (result instanceof Promise) {
                            result = await result;
                        }
                        if (typeof result === 'string') {
                            content = result;
                        }
                    }
                    return {
                        contents: content,
                        loader: 'ts',
                    };
                }
                catch (error) {
                    // @todo
                    return {
                        errors: [{
                                text: `Preprocessing failed for ${args.path}: ${error.message}`,
                            }],
                    };
                }
            });
        },
    };
}
/**
 * Bundles TypeScript code into a single JavaScript file in-memory.
 *
 * @param options Bundling options.
 * @returns A promise that resolves to the bundling result containing code, errors, and source_map.
 */
async function bundle(options) {
    const { entry_path, additional_entry_paths = [], error_limit = 25, platform = 'node', target = 'ES2023', format, minify = false, sourcemap = false, tsconfig = {}, preprocess, } = options;
    // Vars.
    let build_result;
    const output_files = build_result.outputFiles || [];
    let bundled_code = '';
    let bundled_map = '';
    // Load and set TypeScript compiler options.
    tsconfig.compilerOptions ??= {};
    tsconfig.compilerOptions.moduleResolution ??= 'node';
    tsconfig.compilerOptions.module = 'esnext';
    tsconfig.compilerOptions.sourceMap = sourcemap;
    tsconfig.compilerOptions.outDir = undefined;
    tsconfig.compilerOptions.target ??= target;
    tsconfig.compilerOptions.lib ??= [target, 'DOM'];
    tsconfig.compilerOptions.strict ??= true;
    tsconfig.compilerOptions.noImplicitAny ??= false;
    tsconfig.compilerOptions.skipLibCheck ??= true;
    tsconfig.compilerOptions.declaration ??= true; // Enable declaration files
    tsconfig.compilerOptions.experimentalDecorators ??= true; // Enable decorators
    tsconfig.compilerOptions.emitDecoratorMetadata ??= true; // Emit decorator metadata
    // Configure esbuild build options.
    const build_options = {
        entryPoints: [entry_path, ...additional_entry_paths],
        bundle: true,
        platform: platform,
        target: target,
        format: format ?? (platform === 'node' ? 'cjs' : 'iife'),
        minify: minify,
        sourcemap: sourcemap,
        write: false, // In-memory output
        metafile: true, // Enable metafile generation
        plugins: [
            preprocess_plugin(preprocess),
        ],
        define: {
            'process.env.NODE_ENV': `"${process.env.NODE_ENV || 'production'}"`,
        },
        loader: {
            '.ts': 'ts',
            '.tsx': 'tsx',
            '.js': 'js',
            '.jsx': 'jsx',
            '.json': 'json',
        },
        ...mapTsConfigToEsbuild(tsconfig.compilerOptions),
        // tsconfig,
        // Inject the tsconfig options
        // Using esbuild's 'define' is limited; alternatively, use 'esbuild' API's 'jsxFactory', etc.
    };
    // Add debug func.
    const add_debug = (errs) => {
        return function () {
            if (errs.length > 0) {
                let max = Math.min(error_limit ?? errs.length, errs.length);
                for (let i = 0; i < max; i++) {
                    if (errs[i] instanceof Error) {
                        console.error(errs[i]);
                    }
                    else {
                        console.error(errs[i].toString());
                    }
                }
                if (error_limit != null && errs.length > error_limit) {
                    console.log(`Displayed the first ${error_limit} errors out of ${errs.length}.`);
                }
                else {
                    console.log(`Encountered ${errs.length} errors.`);
                }
            }
            else {
                console.log("TypeScript compilation succeeded.");
            }
        };
    };
    // Build.
    try {
        build_result = await esbuild_1.default.build(build_options);
    }
    catch (error) {
        const errors = Array.isArray(error.errors) ? error.errors : [];
        return {
            errors,
            debug: add_debug(errors),
        };
    }
    // Create bundle.
    for (const file of output_files) {
        console.log(file);
        // Check if 'path' exists and is a string
        if ('path' in file && typeof file.path === 'string') {
            console.log("1");
            if (file.path.endsWith('.js')) {
                bundled_code = Buffer.from(file.contents).toString();
            }
            else if (file.path.endsWith('.js.map')) {
                bundled_map = Buffer.from(file.contents).toString();
            }
        }
        else {
            console.log("2");
            // Fallback: Identify based on content
            const contentStr = Buffer.from(file.contents).toString();
            // Simple heuristic: if content contains sourceMappingURL, it's likely a source map
            if (contentStr.includes('sourceMappingURL')) {
                bundled_map = contentStr;
            }
            else {
                bundled_code = contentStr;
            }
        }
    }
    // Collect errors from build_result
    const errors = Array.isArray(build_result.errors) ? build_result.errors : [];
    console.log({
        bundled_code: bundled_code.slice(0, 1000),
        bundled_map: bundled_map.slice(0, 1000),
        errors,
    });
    return {
        code: bundled_code,
        errors,
        source_map: sourcemap ? bundled_map : undefined,
        debug: add_debug(errors),
    };
}
// Example usage:
// (async () => {
//     const result = await bundle({
//         entry_path: 'src/index.ts',
//         platform: 'node',
//         format: 'cjs',
//         sourcemap: true,
//         preprocess: async (filePath, content) => {
//             // Custom preprocessing logic
//             return content.replace(/DEBUG/g, 'true');
//         },
//     });
//     if (result.errors.length > 0) {
//         console.error('Errors:', result.errors);
//     } else {
//         console.log('Bundled Code:', result.code);
//         if (result.source_map) {
//             console.log('Source Map:', result.source_map);
//         }
//     }
// })();
