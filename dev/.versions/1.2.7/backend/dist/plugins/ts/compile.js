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
Object.defineProperty(exports, "__esModule", { value: true });
exports.compile = compile;
exports.bundle = bundle;
const pathlib = __importStar(require("path"));
const fs = __importStar(require("fs"));
const ts = __importStar(require("typescript"));
const esbuild = __importStar(require("esbuild"));
// Local imports.
const preprocessing_1 = require("./preprocessing");
/*
   Compiles TypeScript files after preprocessing them to replace non-string
   literals with units and hex color codes into string literals.
   
   ## Macros
  
   Macros are supported in the following code style:
   ```
   #macro MyName values
   ```
   
   Function macros using templates are also supported.
   ```
   #macro MyMacro(myfuncname) myfuncname(first_name: string) { return `Hello ${first_name}!`}
   ```

 */
async function compile(options) {
    // Extract options.
    let { entry_paths = [], output, error_limit = 25, tsconfig = {}, preprocess, } = options;
    // Variables.
    const errors = [];
    const emitted_files = [];
    const processed_files = {};
    // Build default tsconfig.
    tsconfig ??= {};
    tsconfig.compilerOptions ??= {};
    tsconfig.compilerOptions.outDir = output;
    // Read and parse tsconfig.json
    const parsed_tsconfig = ts.parseJsonConfigFileContent(tsconfig, ts.sys, "./");
    if (parsed_tsconfig.errors.length > 0) {
        parsed_tsconfig.errors.forEach(error => {
            const message = ts.flattenDiagnosticMessageText(error.messageText, '\n');
            errors.push(`TSConfig error: ${message}`);
        });
        return {
            success: false,
            emitted_files: [],
            errors,
            debug() {
                // Dump errors.
                for (let i = 0; i < Math.min(error_limit, errors.length); i++) {
                    console.error(errors[i]);
                }
                // If errors were truncated, log a message indicating so
                if (error_limit != null && errors.length > error_limit) {
                    console.log(`Displayed the first ${error_limit} errors out of ${errors.length}.`);
                }
                else {
                    console.log(`Encountered ${errors.length} errors.`);
                }
            },
        };
    }
    // Read and preprocess each file
    for (let i = 0; i < entry_paths.length; i++) {
        const file = entry_paths[i];
        processed_files[file] = preprocessing_1.Preprocessing.preprocess(file, await fs.promises.readFile(file, 'utf-8'), { macros: true });
        // User defined preprocess.
        if (preprocess) {
            let res = preprocess(file, processed_files[file]);
            if (res instanceof Promise) {
                res = await res;
            }
            if (typeof res === "string") {
                processed_files[file] = res;
            }
        }
    }
    ;
    // Create a custom CompilerHost
    const compiler_host = {
        fileExists: (file_name) => {
            if (processed_files[file_name]) {
                return true;
            }
            return fs.existsSync(file_name);
        },
        directoryExists: ts.sys.directoryExists,
        getCurrentDirectory: ts.sys.getCurrentDirectory,
        getDirectories: ts.sys.getDirectories,
        getCanonicalFileName: ts.sys.useCaseSensitiveFileNames
            ? (file_name) => file_name
            : (file_name) => file_name.toLowerCase(),
        getNewLine: () => ts.sys.newLine,
        getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
        getSourceFile: (file_name, language_version, on_error) => {
            if (processed_files[file_name]) {
                return ts.createSourceFile(file_name, processed_files[file_name], language_version, true);
            }
            if (!fs.existsSync(file_name)) {
                if (on_error)
                    on_error(`File not found: ${file_name}`);
                return undefined;
            }
            const sourceText = fs.readFileSync(file_name, 'utf-8');
            return ts.createSourceFile(file_name, sourceText, language_version, true);
        },
        readFile: (file_name) => {
            if (processed_files[file_name]) {
                return processed_files[file_name];
            }
            return fs.readFileSync(file_name, 'utf-8');
        },
        useCaseSensitiveFileNames: () => ts.sys.useCaseSensitiveFileNames,
        writeFile: ts.sys.writeFile,
    };
    // Create the TypeScript program
    const program = ts.createProgram({
        rootNames: entry_paths,
        options: parsed_tsconfig.options,
        host: compiler_host,
    });
    // Emit the compiled JavaScript
    const emit_result = program.emit();
    // Collect and display diagnostics
    let diagnostics = ts
        .getPreEmitDiagnostics(program)
        .concat(emit_result.diagnostics);
    // Process diagnostics.
    for (let i = 0; i < diagnostics.length; i++) {
        errors.push(ts.formatDiagnosticsWithColorAndContext([diagnostics[i]], {
            getCurrentDirectory: () => process.cwd(),
            getCanonicalFileName: (file_name) => pathlib.resolve(file_name),
            getNewLine: () => '\n',
        }));
    }
    // Collect emitted file paths
    console.log(emit_result);
    // if (emit_result.emitSkipped === false && emit_result.outputFiles) {
    //     emit_result.outputFiles.forEach(file => {
    //         if (file.path.endsWith('.js')) {
    //             emitted_files.push(file.path);
    //         }
    //     });
    // }
    // Response.
    return {
        success: errors.length === 0,
        emitted_files,
        errors,
        debug() {
            // Dump errors.
            for (let i = 0; i < Math.min(error_limit, errors.length); i++) {
                console.error(errors[i]);
            }
            // Map errors per file.
            const error_map = {};
            for (const item of diagnostics) {
                if (item.file?.fileName) {
                    if (error_map[item.file.fileName] === undefined) {
                        error_map[item.file.fileName] = 0;
                    }
                    error_map[item.file.fileName] += 1;
                }
            }
            console.log(`\nErrors per file:`);
            for (const [path, errors] of Object.entries(error_map)) {
                console.log(` - ${path}: ${errors}`);
            }
            console.log("");
            // If errors were truncated, log a message indicating so
            if (error_limit != null && errors.length > error_limit) {
                console.log(`Displayed the first ${error_limit} errors out of ${errors.length}.`);
            }
            else {
                console.log(`Encountered ${errors.length} errors.`);
            }
        },
    };
}
;
/*
 * Bundles transpiled JavaScript files using esbuild.
 */
async function bundle(options) {
    const { entry_paths, platform = 'browser', format = 'iife', target = 'es2023', minify = false, sourcemap = false, error_limit = 25, } = options;
    const errors = [];
    let bundled_code = undefined;
    let bundled_source_map = undefined;
    try {
        const result = await esbuild.build({
            entryPoints: entry_paths,
            bundle: true,
            platform: platform,
            format: format,
            target: target,
            minify: minify,
            sourcemap: sourcemap,
            write: false, // We want the output in memory
        });
        // Process output files.
        console.log(result);
        if (result.outputFiles && result.outputFiles.length > 0) {
            // Concatenate all output files
            bundled_code = result.outputFiles
                .filter(file => !file.path.endsWith('.map'))
                .map(file => file.text)
                .join('\n');
            if (sourcemap) {
                const source_map_file = result.outputFiles.find(file => file.path.endsWith('.map'));
                if (source_map_file) {
                    bundled_source_map = source_map_file.text;
                }
            }
        }
        else {
            errors.push("No output files were generated during bundling.");
        }
    }
    catch (error) {
        errors.push(error.message || String(error));
    }
    return {
        code: bundled_code,
        source_map: bundled_source_map,
        errors,
        debug() {
            for (let i = 0; i < Math.min(error_limit, errors.length); i++) {
                console.error(errors[i]);
            }
            if (error_limit != null && errors.length > error_limit) {
                console.log(`Displayed the first ${error_limit} errors out of ${errors.length}.`);
            }
            else {
                console.log(`Encountered ${errors.length} errors.`);
            }
        },
    };
}
;
/**
* Wrapper function to compile TypeScript files and then bundle the resulting JavaScript
export async function compile_and_bundle(options: CompileOptions & BundleOptions): Promise<CompileResult & BundleResult> {
    const {
        entry_paths,
        output,
        error_limit: compile_error_limit,
        preprocess: compile_preprocess,
        tsconfig: compile_tsconfig,
        // Bundle options
        platform,
        format,
        target,
        minify,
        sourcemap,
        preprocess: bundle_preprocess,
    } = options;

    const compile_result = await compile({
        entry_paths,
        output,
        error_limit: compile_error_limit,
        preprocess: compile_preprocess,
        tsconfig: compile_tsconfig,
    });

    if (!compile_result.success || compile_result.errors.length !== 0) {
        return compile_result;
    }

    const bundle_result = await bundle({
        entry_paths: compile_result.emitted_files,
        platform,
        format,
        target,
        minify,
        sourcemap,
        // preprocess: bundle_preprocess,
        error_limit: options.error_limit,
        tsconfig: compile_tsconfig, // Pass through if needed
    });

    return bundle_result;
};
*/
// Exports.
module.exports = {
    compile,
    bundle,
};
