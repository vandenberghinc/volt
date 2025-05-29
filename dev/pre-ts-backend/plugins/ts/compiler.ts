/*
 * Author: Daan van den Bergh
 * Copyright: © 2024 - 2024 Daan van den Bergh.
 */

import * as pathlib from 'path';
import * as fs from 'fs';
import * as ts from 'typescript';
import * as esbuild from 'esbuild';

import { rollup, RollupOptions, OutputOptions, Plugin } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';


// Local imports.
const {vhighlight, vlib} = require("../../../vinc.js");
const Preprocessing = require("./preprocessing.js");

// Resolve path wrapper.
function resolve_path(path: string) {
    path = pathlib.resolve(path);
    if (process.platform === "darwin" && path.startsWith("/private/tmp/")) {
        path = path.slice(8);
    }
    return path;
}

// Error interface.
interface CompilerError { data: string, file_name?: string, line?: number, column?: number }[]

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

    // Debug a single file by file path.
    debug_file?: string,

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

    // Exact files: only compile the entry files and no other files.
    exact_files?: boolean;

    // Watch mode.
    watch?: boolean | {
        enabled: boolean,
        log_level?: number,
        on_change?: (path: string) => any,
    };

    // Extract exports.
    extract_exports?: boolean;
}

/**
 * Result of the bundling process.
 */
export interface CompileResult {

    // Input paths.
    inputs: string[],

    // Output paths.
    outputs: string[],

    /**
     * Compilation and bundling errors, if any.
     */
    errors: CompilerError[]

    /**
     * Debug function.
     */
    debug: (_watch?: boolean) => void;

    /**
     * Function to terminate the watch program. Available only in watch mode.
     */
    stop?: () => void,

    // Extracted export names.
    // Only defined when `extract_inputs` is enabled.
    exports: Record<string, string[]>;
}

// Format a typescript error.
function format_ts_error(diagnostic): CompilerError {
    let line, column;
    if (diagnostic.file && diagnostic.start !== undefined) {
        const res = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        if (res.line !== undefined) { line = res.line + 1; }
        if (res.character !== undefined) { column = res.character + 1; }
    }
    return {
        data: ts.formatDiagnosticsWithColorAndContext([diagnostic], {
            getCurrentDirectory: () => process.cwd(),
            getCanonicalFileName: (file_name) => pathlib.resolve(file_name),
            getNewLine: () => '\n',
        }),
        file_name: pathlib.resolve(diagnostic.file?.resolvedPath),
        line,
        column,
    }
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

    // Extract options with defaults.
    let {
        entry_paths = [],
        output,
        error_limit = 25,
        compiler_opts = {},
        preprocess,
        exact_files = false,
        watch,
        extract_exports,
        debug_file,
    } = options;
    if (watch === undefined || typeof watch === "boolean") {
        watch = {
            enabled: watch ?? false,
            log_level: 1,
            on_change: undefined,
        };
    }
    const {
        enabled: watch_enabled = false,
        log_level: watch_log_level = 1,
    } = watch;

    // Initialize compile result.
    let import_order: Map<string, number> | undefined;
    const compile_result: CompileResult = {
        inputs: [],
        outputs: [],
        errors: [],
        debug(_watch: boolean = false) {

            // Sort the errors based on import order.
            if (import_order !== undefined) {
                this.errors.sort((a, b) => {
                    // Get import order for both files
                    const orderA = a.file_name ? ((import_order as any).get(a.file_name) ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER;
                    const orderB = b.file_name ? ((import_order as any).get(b.file_name) ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER;

                    // First sort by import order
                    if (orderA !== orderB) {
                        return orderA - orderB;
                    }

                    return 0;
                });
            }

            // Dump errors up to the error limit.
            for (let i = 0; i < Math.min(error_limit, this.errors.length); i++) {
                console.error(this.errors[i].data);
            }

            // Map errors per file.
            if (this.errors.length > 0) {
                const error_map: Record<string, number> = {};
                for (const err of this.errors) {
                    if (err.file_name) {
                        if (error_map[err.file_name] === undefined) {
                            error_map[err.file_name] = 0;
                        }
                        error_map[err.file_name] += 1;
                    }
                }
                console.log(`\nErrors per file:`);
                for (const [file_path, error_count] of Object.entries(error_map)) {
                    console.log(` - ${file_path}: ${error_count}`);
                }
                console.log("");
            }

            // Inform about error truncation.
            // if (_watch === false) {
                if (error_limit != null && this.errors.length > error_limit) {
                    console.log(`Displayed the first ${error_limit} errors out of ${this.errors.length}.`);
                } else {
                    console.log(`Encountered ${this.errors.length} errors.`);
                }

                if (this.outputs.length > 0) {
                    console.log(`Compiled ${this.outputs.length} output files.`);
                }
            // }
        },
        exports: {},
    }

    let diagnostics: ts.Diagnostic[] = [];
    const processed_files: { [file_name: string]: string } = {};

    // Process entry paths if exact_files is true.
    if (exact_files) {
        for (let i = 0; i < entry_paths.length; i++) {
            const current_path = new vlib.Path(entry_paths[i]);
            if (!current_path.exists()) {
                compile_result.errors.push({
                    data: `Entry path "${current_path.str()}" does not exist.`
                });
                continue;
            }
            entry_paths[i] = current_path.abs().str();
        }
        if (compile_result.errors.length > 0) {
            return compile_result;
        }
    }

    // Build in-memory tsconfig options.
    const tsconfig: Record<string, any> = {
        compilerOptions: {
            ...compiler_opts,
            outDir: output,
            declaration: compiler_opts.declaration === true ? true : false,
            declarationDir: compiler_opts.declaration === true ? output : undefined,
            // Add other default compiler options as needed
        },
        include: entry_paths,
    };
    if (watch.enabled) {
        tsconfig.compilerOptions.incremental = true;
        tsconfig.compilerOptions.tsBuildInfoFile = output + "/.tsbuildinfo"
    }
    tsconfig.compilerOptions.paths ??= {};
    tsconfig.compilerOptions.paths["volt/*"] = [new vlib.Path(__dirname + "../../../../../frontend/").abs().str() + "/*"];

    // let now = Date.now();

    // Parse the in-memory tsconfig options.
    const parsed_tsconfig = ts.parseJsonConfigFileContent(
        tsconfig,
        ts.sys,
        "./",
    );

    if (parsed_tsconfig.errors.length > 0) {
        parsed_tsconfig.errors.forEach(error => {
            const message = ts.flattenDiagnosticMessageText(error.messageText, '\n');
            compile_result.errors.push({
                data: `TSConfig error: ${message}`,
            });
        });
        return compile_result;
    }

    // console.log("Init jsonconfig:", Date.now() - now); now = Date.now()

    // Watch Mode
    if (watch_enabled) {

        // Define a virtual tsconfig file name
        const virtual_tsconfig_path = pathlib.resolve("tsconfig.virtual.json");

        // Create a custom system that intercepts readFile and fileExists
        const written_files = new Map<string, string>()
        const custom_ts_sys: ts.System = {
            ...ts.sys,
            fileExists: (file_name: string) => {
                const resolved_file = pathlib.resolve(file_name);
                if (resolved_file === virtual_tsconfig_path) {
                    return true;
                }
                if (exact_files && !entry_paths.includes(resolved_file)) {
                    return false;
                }
                return fs.existsSync(resolved_file);
            },
            readFile: (file_name: string) => {
                // console.log("Read file", file_name)
                const resolved_file = pathlib.resolve(file_name);

                // Config path.
                if (resolved_file === virtual_tsconfig_path) {
                    return JSON.stringify(tsconfig, null, 4);
                }

                // Exact files.
                if (exact_files && !entry_paths.includes(resolved_file)) {
                    return undefined;
                }

                // Check existance.
                if (!fs.existsSync(resolved_file)) {
                    return undefined;
                }

                // Load data.
                let source_code = fs.readFileSync(resolved_file, 'utf-8');

                // Apply preprocessing
                if (!resolved_file.endsWith(".d.ts") && (resolved_file.endsWith(".js") || resolved_file.endsWith(".ts"))) {
                    source_code = Preprocessing.preprocess(resolved_file, source_code, { macros: true });
                    if (preprocess) {
                        const preprocessed = preprocess(resolved_file, source_code);
                        if (preprocessed instanceof Promise) {
                            throw new Error('Asynchronous preprocessing is not supported in watch mode.');
                        }
                        if (typeof preprocessed === "string") {
                            source_code = preprocessed;
                        }
                    }
                }

                // Response.
                return source_code;
            },
            writeFile: (file_name: string, data: string, write_byte_order_mark: boolean, on_error?: (message: string) => void, source_files?: readonly string[]) => {
                file_name = pathlib.resolve(file_name);

                // Check if file has changed.
                if (written_files.has(file_name) && written_files.get(file_name) === data) {
                    return ;
                }

                // Logs.
                if (watch_log_level >= 1) {
                    console.log(`ts-watcher: ${vlib.color.purple("message")} Writing out file ${file_name}.`);
                }

                // Write the file using the original writeFile method
                ts.sys.writeFile(file_name, data, write_byte_order_mark);
                written_files.set(file_name, data)
            
                // Call the on_change callback after writing the file
                if (typeof watch === "object" && typeof watch.on_change === "function" && file_name.endsWith(".js")) {
                    watch.on_change(resolve_path(file_name));
                }
            },
        };

        // Create WatchCompilerHost using createWatchCompilerHost
        const host = ts.createWatchCompilerHost(
            virtual_tsconfig_path, // Use virtual tsconfig path
            undefined, // Override compiler options if needed
            custom_ts_sys,
            ts.createSemanticDiagnosticsBuilderProgram,
            // reportDiagnostic callback
            (diagnostic) => {
                compile_result.errors.push(format_ts_error(diagnostic))
            },
            // reportWatchStatusChanged callback
            (diagnostic) => {

                // Show errors on message `Found X errors. Watching for file changes.`
                if (diagnostic.code === 6194) {
                    if (import_order === undefined) {
                        const interval = setInterval(() => {
                            if (import_order !== undefined) {
                                compile_result.debug();
                                compile_result.errors = [];
                                clearInterval(interval);
                            }
                        }, 100)
                    } else {
                        compile_result.debug();
                        compile_result.errors = [];
                    }
                }

                // Skip.
                if (watch_log_level <= 0 && diagnostic.category === 3) {
                    // skip messages (3)
                    return ;
                }
                const message = ts.formatDiagnosticsWithColorAndContext([diagnostic], {
                    getCurrentDirectory: () => process.cwd(),
                    getCanonicalFileName: (file_name) => pathlib.resolve(file_name),
                    getNewLine: () => '\n',
                });
                console.log("ts-watcher:", message.trimEnd());
            }
        );

        // Create the WatchProgram
        const program = ts.createWatchProgram(host);

        // Define the import order.
        import_order = new Map();
        const source_files = program.getProgram().getSourceFiles();
        for (let i = 0; i < source_files.length; i++) {
            const source = source_files[i];
            const file_name = pathlib.resolve(source.fileName).toLowerCase();
            if (!import_order.has(file_name)) {
                import_order.set(file_name, i);
            }
        }
        
        // Assign the stop function to terminate the watch program
        compile_result.stop = () => {
            program.close();
            console.log("ts-watcher:", "Stopped watching.");
        };
        return compile_result;
    }

    // Non-watch mode continues as before

    // Create the initial TypeScript program to get all source files.
    const initial_program = ts.createProgram({
        rootNames: parsed_tsconfig.fileNames,
        options: parsed_tsconfig.options,
    });
    const program_source_files = initial_program.getSourceFiles();
    const all_source_files = program_source_files.filter(sf => !sf.isDeclarationFile);

    // Check empty source files.
    if (all_source_files.length === 0) {
        compile_result.errors.push({ data: "No source files were found. Please check your entry paths." });
        return compile_result;
    }

    // console.log({
    //     entry_paths,
    //     // all_source_files,
    //     // compiler_opts: parsed_tsconfig.options,
    //     file_names: parsed_tsconfig.fileNames,
    // })

    // Get extracted exports.
    if (extract_exports) {

        // Obtain the TypeChecker
        const checker = initial_program.getTypeChecker()

        // Iterate through all source files in the program
        for (let i = 0; i < program_source_files.length; i++) {
            const source = program_source_files[i]
            
            // Skip declaration files (.d.ts) if not needed
            if (source.isDeclarationFile) continue;

            // Get the module symbol for the source file
            const symbol = checker.getSymbolAtLocation(source);

            // Get exports of the module
            if (symbol) {
                if (compile_result.exports[source.fileName] === undefined) {
                    compile_result.exports[source.fileName] = [];
                }
                const list = compile_result.exports[source.fileName];
                const exports = checker.getExportsOfModule(symbol);
                for (const exp of exports) {
                    list.push(exp.getName());
                }
            }
        }
    }

    // console.log("Get source files:", Date.now() - now); now = Date.now()

    // Preprocess each source file.
    for (let i = 0; i < all_source_files.length; i++) {
        const source_file = all_source_files[i];
        const file_name = pathlib.resolve(source_file.fileName);

        // Add input file to compile_result.
        compile_result.inputs.push(file_name);

        // Skip files if exact_files is true and the file is not an entry file.
        if (exact_files && !entry_paths.includes(file_name)) {
            continue;
        }

        // Apply default preprocessing.
        processed_files[file_name] = Preprocessing.preprocess(
            file_name,
            source_file.text,
            { macros: true },
        );

        // Apply user-defined preprocessing.
        if (preprocess) {
            let res: any = preprocess(file_name, processed_files[file_name]);
            if (res instanceof Promise) {
                res = await res;
            }
            if (typeof res === "string") {
                processed_files[file_name] = res;
            }
        }
    }
    // console.log("Processed files:", Object.keys(processed_files))

    // console.log("Apply preprocessing:", Date.now() - now); now = Date.now()

    // Create a custom CompilerHost for non-watch mode
    const file_exists_cache = new Map<string, boolean>();
    const compiler_host: ts.CompilerHost = {
        fileExists: (file_name) => {
            // console.log("fileExists", file_name)
            const resolved_file = pathlib.resolve(file_name);
            if (processed_files[resolved_file]) {
                return true;
            }
            else if (file_exists_cache.has(resolved_file)) {
                return file_exists_cache.get(resolved_file) as boolean;
            }
            const res = fs.existsSync(resolved_file);
            file_exists_cache.set(resolved_file, res);
            return res;
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

            const resolved_file = pathlib.resolve(file_name);

            if (processed_files[resolved_file]) {
                // if (resolved_file.endsWith("home.ts") || resolved_file.endsWith("home.js")) console.log("getSourceFile1", resolved_file)
                return ts.createSourceFile(
                    resolved_file,
                    processed_files[resolved_file],
                    language_version,
                    true
                );
            }
            if (exact_files && !entry_paths.includes(resolved_file)) {
                // if (resolved_file.endsWith("home.ts") || resolved_file.endsWith("home.js")) console.log("getSourceFile2", resolved_file)
                return undefined; // skip by exact files.
            }
            if (!fs.existsSync(resolved_file)) {
                // if (resolved_file.endsWith("home.ts") || resolved_file.endsWith("home.js")) console.log("getSourceFile3", resolved_file)
                if (on_error) on_error(`File not found: ${resolved_file}`);
                return undefined;
            }
            // if (resolved_file.endsWith("home.ts") || resolved_file.endsWith("home.js")) console.log("getSourceFile4", resolved_file)
            const source_code = fs.readFileSync(resolved_file, 'utf-8');
            return ts.createSourceFile(
                resolved_file,
                source_code,
                language_version,
                true
            );
        },
        readFile: (file_name) => {
            // console.log("readFile", file_name)
            const resolved_file = pathlib.resolve(file_name);
            // console.log("readFile2", resolved_file)
            if (processed_files[resolved_file]) {
                // console.log("readFile3", resolved_file)
                return processed_files[resolved_file];
            }
            if (exact_files && !entry_paths.includes(resolved_file)) {
                // console.log("readFile4", resolved_file)
                return undefined; // skip by exact files.
            }
            // console.log("readFile5", resolved_file)
            return fs.readFileSync(resolved_file, 'utf-8');
        },
        useCaseSensitiveFileNames: () => ts.sys.useCaseSensitiveFileNames,
        writeFile: (file_name, data, write_byte_order_mark, on_error, source_files) => {
            compile_result.outputs.push(file_name);
            ts.sys.writeFile(file_name, data, write_byte_order_mark);
        },
    };

    // Create the TypeScript program
    const program = ts.createProgram({
        rootNames: parsed_tsconfig.fileNames,
        options: parsed_tsconfig.options,
        host: compiler_host,
    });

    // Emit the compiled JavaScript
    const emit_result = program.emit();

    // Collect and display diagnostics
    diagnostics = ts.getPreEmitDiagnostics(program).concat(emit_result.diagnostics);

    // Process diagnostics.
    for (let i = 0; i < diagnostics.length; i++) {
        if (debug_file == null || diagnostics[i]?.file?.fileName === debug_file) {
            compile_result.errors.push(format_ts_error(diagnostics[i]))
        }
    }

    // console.log("Compile:", Date.now() - now); now = Date.now()

    // Response.
    return compile_result;

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
     * Enable or disable tree shaking.
     */
    tree_shaking?: boolean;

    /**
     * Enable or disable debug console statements.
     */
    debug?: string | boolean;

    /**
     * Enable or disable source map generation.
     */
    sourcemap?: boolean | 'linked' | 'inline' | 'external' | 'both';

    // Extract input files.
    extract_inputs?: boolean;

    /**
     * Specify which bundler to use: 'esbuild' or 'rollup'.
     * If undefined, defaults to 'esbuild'.
     */
    bundler?: 'esbuild' | 'rollup';
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

    // Input paths.
    // Only defined when extract_inputs is `true`.
    inputs: string[];
}

// Format an esbuild warning / error.
const format_esbuild_warning_error = (warning): CompilerError => {
    const trimmed_line = warning.location.lineText.trimStart();
    const removed_start_indent = warning.location.lineText.length - trimmed_line.length;
    let output = 
        `${vlib.color.cyan(warning.location.file)}:${vlib.color.yellow(warning.location.line)}:${vlib.color.yellow(warning.location.column)}` + 
        ` - ${vlib.color.yellow("warning")} [esbuild${warning.id === "" ? "" : `-${warning.id}`}]: ${warning.text}\n` + 
        "\n" + vlib.colors.bright_bg.white + vlib.colors.black + warning.location.line + vlib.colors.end + "    " + trimmed_line +
        "\n" + vlib.colors.bright_bg.white + vlib.colors.black + " ".repeat(warning.location.line.toString().length) + vlib.colors.end +
        " ".repeat(4 + warning.location.column - removed_start_indent) + vlib.color.red("~".repeat(warning.location.length));
    if (Array.isArray(warning.notes)) {
        for (const note of warning.notes) {
            if (note.location) {
                const trimmed_line = note.location.lineText.trimStart();
                const removed_start_indent = note.location.lineText.length - trimmed_line.length;
                output += 
                `\n    ${vlib.color.cyan(note.location.file)}:${vlib.color.yellow(note.location.line)}:${vlib.color.yellow(note.location.column)}` + 
                ` - ${vlib.color.gray("note")}: ${note.text}\n` + 
                "\n" + vlib.colors.bright_bg.white + vlib.colors.black + note.location.line + vlib.colors.end + "        " + trimmed_line +
                "\n" + vlib.colors.bright_bg.white + vlib.colors.black + " ".repeat(note.location.line.toString().length) + vlib.colors.end +
                " ".repeat(8 + note.location.column - removed_start_indent) + vlib.color.red("~".repeat(note.location.length));
            } else {
                output += 
                `\n    ${vlib.color.gray("note")}: ${note.text}`;
            }
            if (note.suggestion) {
                console.error("@todo handle suggestion:" + note.suggestion + " note: " + JSON.stringify(note, null, 4));
            }
        }
    }
    return {
        data: output,
        file_name: warning.location.file,
        line: warning.location.line,
        column: warning.location.column,
    }
}

/*
 * Bundles transpiled JavaScript files using esbuild.
 */
export async function bundle(options: BundleOptions): Promise<BundleResult> {
    const {
        entry_paths,
        platform = 'browser',
        format = 'iife',
        target = 'es2021',
        minify = false,
        sourcemap = false, // 'inline'
        error_limit = 25,
        extract_inputs = false,
        tree_shaking = undefined,
        debug = false,
        bundler = "esbuild",
        // bundler = "rollup",
    } = options;

    const errors: CompilerError[] = [];
    let bundled_code: string | undefined = undefined;
    let bundled_source_map: string | undefined = undefined;
    let inputs: string[] = [];

    // Bundle using esbuild.
    if (bundler === "esbuild") {
        try {
            const result = await esbuild.build({
                entryPoints: entry_paths,
                bundle: true,
                platform: platform,
                format: format,
                target: target,
                minify: minify,
                sourcemap,
                write: false,
                metafile: extract_inputs,
                logLevel: typeof debug === "boolean" ? (debug ? 'debug' : 'silent') : debug as any,
                treeShaking: tree_shaking,
                // logLevel: 'silent',
                // outdir: "/",
                // minifyWhitespace: false,
                // minifySyntax: false,
                // minifyIdentifiers: false,
            });
            if (result.errors.length > 0) {
                for (const error of result.errors) {
                    errors.push(format_esbuild_warning_error(error))
                }
            }
            if (result.warnings.length > 0) {
                for (const warning of result.warnings) {
                    errors.push(format_esbuild_warning_error(warning))
                }
            }

            // Set output paths.
            if (extract_inputs && result.metafile?.inputs !== null && typeof result.metafile?.inputs === "object") {
                inputs = Object.keys(result.metafile?.inputs).map(resolve_path);
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
                errors.push({ data: "No output files were generated during bundling." });
            }

        } catch (err: any) {
            let processed = false;
            if (Array.isArray(err.errors) && err.errors.length > 0) {
                for (const error of err.errors) {
                    errors.push(format_esbuild_warning_error(error))
                }
                processed = true;
            }
            if (Array.isArray(err.warnings) && err.warnings.length > 0) {
                for (const warning of err.warnings) {
                    errors.push(format_esbuild_warning_error(warning))
                }
                processed = true;
            }
            if (!processed) {
                errors.push({ data: err.message || String(err) });
            }
        }
    }

    // Bundle using rollup.
    else {
        try {

            // Determine if minification is needed
            const plugins: Plugin[] = [
                resolve({
                    browser: platform === 'browser',
                    preferBuiltins: platform === 'node',
                }),
                commonjs(),
            ];

            if (minify) {
                plugins.push(terser());
            }
            const input_set: Set<string> = new Set();
            // if (extract_inputs) {
            //     plugins.push(
            //         // Custom plugin to collect all imported files
            //         {
            //             name: 'collect-input-files',
            //             resolveId(source, importer) {
            //                 return null; // Let Rollup handle module resolution
            //             },
            //             load(id) {
            //                 console.log("ADD:",id)
            //                 input_set.add(id); // Add each module to the input_set set
            //                 return null; // Let Rollup handle loading the module
            //             }
            //         }
            //     )
            // }

            const rollup_input_options: RollupOptions = {
                input: entry_paths,
                plugins: plugins,
                treeshake: tree_shaking !== undefined ? tree_shaking : true,
                // Suppress Rollup warnings if not in debug mode
                onwarn: (warning, warn) => {
                    if (debug) {
                        warn(warning);
                    }
                    // Otherwise, suppress warnings
                },
            };

            const bundle = await rollup(rollup_input_options);

            const rollup_output_options: OutputOptions = {
                format: format,
                sourcemap: sourcemap !== false,
                // Name is required for 'iife' format
                ...(format === 'iife' ? { name: 'Bundle' } : {}),
                // Generate inline source maps if specified
                ...(sourcemap === 'inline' ? { sourcemap: 'inline' } : {}),
                ...(sourcemap === 'external' ? { sourcemap: true } : {}),
                ...(sourcemap === 'linked' ? { sourcemap: true, sourcemapPathTransform: (relativePath: string) => `./${relativePath}` } : {}),
                // Additional Rollup output options can be added here
            };

            const { output } = await bundle.generate(rollup_output_options);

            bundled_code = '';
            bundled_source_map = '';

            for (const item of output) {
                if (item.type === 'chunk') {
                    bundled_code += item.code;
                    if (item.map) {
                        bundled_source_map += item.map.toString();
                    }
                    if (extract_inputs) {
                        for (const name of Object.keys(item.modules)) {
                            if (!input_set.has(name)) {
                                input_set.add(name);
                            }
                        }
                    }
                }
            }
            inputs = extract_inputs ? Array.from(input_set) : []

        } catch (err: any) {
            errors.push({ data: err.message ?? String(err) });
            // throw new Error(`Rollup bundling failed: ${err.message || err}`);
        }
    }

    return {
        code: bundled_code,
        source_map: bundled_source_map,
        errors,
        inputs,
        debug() {
            for (let i = 0; i < Math.min(error_limit, errors.length); i++) {
                console.error(errors[i].data);
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

/*

// Collect imports.
export async function collect_exports(file_path: string, data: string) {
    const exported_names = new Set<string>();

    const source_file = ts.createSourceFile(
        file_path,
        data,
        ts.ScriptTarget.ESNext,
        true
    );

    function visit_node(node: ts.Node) {
        // Handle named export declarations: export { Utils, Another };
        if (ts.isExportDeclaration(node)) {
            if (node.exportClause && ts.isNamedExports(node.exportClause)) {
                node.exportClause.elements.forEach(element => {
                    const n = element.name.getText();
                    if (!exported_names.has(n)) {
                        exported_names.add(n);
                    }
                });
            }
        }
        // Handle export specifiers: export { Utils } from './utils';
        else if (ts.isExportSpecifier(node)) {
            const n = node.name.getText();
            if (!exported_names.has(n)) {
                exported_names.add(n);
            }
        }
        // Handle exported declarations: export function foo() {}, export const bar = 1, etc.
        else if (ts.isExportAssignment(node)) {
            // Handle default exports if needed
            const expr = node.expression;
            if (ts.isIdentifier(expr)) {
                const n = expr.getText();
                if (!exported_names.has(n)) {
                    exported_names.add(n);
                }
            }
            // Handle other export assignment expressions if necessary
        }
        else {
            const modifiers = ts.getModifiers(node as any);
            if (modifiers && modifiers.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword)) {
                if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node) || ts.isEnumDeclaration(node)) {
                    if (node.name) {
                        const n = node.name.getText();
                        if (!exported_names.has(n)) {
                            exported_names.add(n);
                        }
                    }
                }
                else if (ts.isVariableStatement(node)) {
                    node.declarationList.declarations.forEach(declaration => {
                        const n = declaration.name.getText();
                        if (!exported_names.has(n)) {
                            exported_names.add(n);
                        }
                    });
                }
            }
        }

        ts.forEachChild(node, visit_node);
    }

    visit_node(source_file);

    return Array.from(exported_names);
}

// Get all included soruce files.
export async function get_source_files(entry_paths: string[]): Promise<string[]> {
    const result = await esbuild.build({
        entryPoints: entry_paths,
        bundle: true,
        metafile: true,
        write: false, // Keep outputs in memory
    });
    if (!result.metafile) {
    throw new Error('Metafile not generated');
    }
    return Object.keys(result.metafile.inputs);
}

*/

// Exports.
export default {
    compile,
    bundle,
    preprocessing: Preprocessing,
}
module.exports = {
    compile,
    bundle,
    preprocessing: Preprocessing,
    // collect_exports,
    // get_source_files,
};