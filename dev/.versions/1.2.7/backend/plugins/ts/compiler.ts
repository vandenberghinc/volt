/*
 * Author: Daan van den Bergh
 * Copyright: © 2024 - 2024 Daan van den Bergh.
 */

import * as pathlib from 'path';
import * as fs from 'fs';
import * as ts from 'typescript';
import * as esbuild from 'esbuild';

// Local imports.
const {vhighlight, vlib} = require("../../vinc.js");
const Preprocessing = require("./preprocessing.js");

/**
 * Options for bundling TypeScript code.
 */
export interface CompileOptions {

    // Additional entry paths.
    entry_paths: string[],

    // Output.
    output: string,

    // Error limit.
    error_limit?: number,

    /**
     * Function to preprocess TypeScript code after transpilation.
     * Receives the file path and its transpiled JavaScript content, returns modified content.
     */
    preprocess?: (file_path: string, content: string) => string | Promise<string>;

    /**
     * TypeScript compiler options.
     */
    compiler_opts?: Record<string, any>;

    // Add copyright.
    // copyright?: boolean,
}

/**
 * Result of the bundling process.
 */
export interface CompileResult {
    
    // Compiliation status.
    success: boolean;

    // Emitted files.
    emitted_files: string[],

    /**
     * Compilation and bundling errors, if any.
     */
    errors: string[];

    /**
     * Debug function.
     */
    debug: () => void;
}

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
export async function compile(options: CompileOptions): Promise<CompileResult> {

    // Extract options.
    let {
        entry_paths = [],
        output,
        error_limit = 25,
        compiler_opts = {},
        preprocess,
    } = options;

    // Variables.
    const errors: string[] = [];
    const emitted_files: string[] = [];
    const processed_files: { [file_name: string]: string } = {};

    // Build default tsconfig.
    compiler_opts.outDir = output;
    compiler_opts.declarationDir = output;

    // Read and parse tsconfig.json
    const parsed_tsconfig = ts.parseJsonConfigFileContent(
        {compilerOptions: compiler_opts},
        ts.sys,
        "./",
    );
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
                } else {
                    console.log(`Encountered ${errors.length} errors.`);
                }
            },
        }
    }

    // Read and preprocess each file
    const all_source_files = ts.createProgram({
        rootNames: entry_paths,
        options: parsed_tsconfig.options,
    }).getSourceFiles().filter(sf => !sf.isDeclarationFile);
    for (let i = 0; i < all_source_files.length; i++) {
        const source_file = all_source_files[i]
        const file_name = source_file.fileName;

        // console.log("Preprocessing", file_name, "with default preprocessor.")
        processed_files[file_name] = Preprocessing.preprocess(
            file_name,
            source_file.text,
            { macros: true },
        );

        // User defined preprocess.
        if (preprocess) {
            // console.log("Preprocessing", file_name, "with default user defined preprocessor.")
            let res: any = preprocess(file_name, processed_files[file_name]);
            if (res instanceof Promise) {
                res = await res;
            }
            if (typeof res === "string") {
                processed_files[file_name] = res;
            }
        }
    };

    // Create a custom CompilerHost
    const compiler_host: ts.CompilerHost = {
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
                return ts.createSourceFile(
                    file_name,
                    processed_files[file_name],
                    language_version,
                    true
                );
            }
            if (!fs.existsSync(file_name)) {
                if (on_error) on_error(`File not found: ${file_name}`);
                return undefined;
            }
            const sourceText = fs.readFileSync(file_name, 'utf-8');
            return ts.createSourceFile(
                file_name,
                sourceText,
                language_version,
                true
            );
        },
        readFile: (file_name) => {
            if (processed_files[file_name]) {
                return processed_files[file_name];
            }
            return fs.readFileSync(file_name, 'utf-8');
        },
        useCaseSensitiveFileNames: () => ts.sys.useCaseSensitiveFileNames,
        writeFile: (file_name, data, write_byte_order_mark, on_error, source_files) => {
            console.log("Write out", file_name);
            // if (file_name.endsWith('.js')) {
            //     emitted_files.push(file_name);
            // }
            emitted_files.push(file_name);
            ts.sys.writeFile(file_name, data, write_byte_order_mark);
        },
    };

    // Create the TypeScript program
    const program = ts.createProgram({
        rootNames: entry_paths,
        options: parsed_tsconfig.options,
        host: compiler_host,
    });

    // Emit the compiled JavaScript
    const emit_result = program.emit();

    console.log("EMITTED!:",emitted_files)

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
        }))
    }

    // Collect emitted file paths
    // console.log(emit_result)
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
            const error_map: Record<string, number> = {};
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
                console.log(` - ${path}: ${errors}`)
            }
            console.log("");

            // If errors were truncated, log a message indicating so
            if (error_limit != null && errors.length > error_limit) {
                console.log(`Displayed the first ${error_limit} errors out of ${errors.length}.`);
            } else {
                console.log(`Encountered ${errors.length} errors.`);
            }

            console.log(`Compiled ${emitted_files.length} output files.`);
        },
    }
};

/**
 * Options for bundling TypeScript code.
 */
export interface BundleOptions {

    // Additional entry paths.
    entry_paths: string[],

    // Error limit.
    error_limit?: number,

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
    format?: 
        | 'iife'       // Immediately Invoked Function Expression (Browser)
        // | 'umd'     // Universal Module Definition (Browser/Node)
        | 'cjs'        // CommonJS (Node)
        | 'esm';       // ES Modules (Browser/Node);

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

/*
 * Bundles transpiled JavaScript files using esbuild.
 */
export async function bundle(options: BundleOptions): Promise<BundleResult> {
    const {
        entry_paths,
        platform = 'browser',
        format = 'iife',
        target = 'es2023',
        minify = false,
        sourcemap = false, // 'inline'
        error_limit = 25,
    } = options;

    const errors: string[] = [];
    let bundled_code: string | undefined = undefined;
    let bundled_source_map: string | undefined = undefined;

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
            // outdir: "/tmp/",
        });
        if (result.errors.length > 0) {
            console.log("Errors:", result.errors);
            throw new Error("@todo parse errors " + JSON.stringify(result.errors, null, 4))
            // errors.push(...result.errors);
        }
        if (result.warnings.length > 0) {
            console.log("Warnings:", result.warnings);
            throw new Error("@todo parse warnings " + JSON.stringify(result.warnings, null, 4))
            // errors.push(...result.warnings);
        }

        // Process output files.
        if (result.outputFiles && result.outputFiles.length > 0) {
            
            // Concatenate all output files
            bundled_code = result.outputFiles
                .filter(file => file.path === "<stdout>" || (file.path.endsWith('.js') && !file.path.endsWith('.d.js')))
                .map(file => file.text)
                .join('\n');

            if (sourcemap) {
                const source_map_file = result.outputFiles.find(file => file.path.endsWith('.map'));
                if (source_map_file) {
                    bundled_source_map = source_map_file.text;
                }
            }
        } else {
            errors.push("No output files were generated during bundling.");
        }

    } catch (error: any) {
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
            } else {
                console.log(`Encountered ${errors.length} errors.`);
            }

            if (typeof bundled_code === "string" && bundled_code !== "") {
                console.log(`Generated code of ${vlib.utils.format_bytes(Buffer.byteLength(bundled_code as string, 'utf8'))}`)
            }
        },
    }
};

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