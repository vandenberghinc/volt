/*
 * Author: Daan van den Bergh
 * Copyright: © 2024 - 2024 Daan van den Bergh.
 */
import * as pathlib from 'path';
import * as fs from 'fs';
import * as ts from 'typescript';
import * as esbuild from 'esbuild';
// Get the directory name of the current module
import { fileURLToPath } from 'url';
import { dirname } from 'path';
var __dirname = typeof __dirname !== 'undefined' ? __dirname : dirname(fileURLToPath(new URL('./package.json', import.meta.url)));
// Local imports.
import { vlib } from "../../vinc.js";
import * as Preprocessing from "./preprocessing.js";
// Resolve path wrapper.
function resolve_path(path) {
    path = pathlib.resolve(path);
    if (process.platform === "darwin" && path.startsWith("/private/tmp/")) {
        path = path.slice(8);
    }
    return path;
}
[];
// Format a typescript error.
function format_ts_error(diagnostic) {
    let line, column;
    if (diagnostic.file && diagnostic.start !== undefined) {
        const res = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        if (res.line !== undefined) {
            line = res.line + 1;
        }
        if (res.character !== undefined) {
            column = res.character + 1;
        }
    }
    return {
        data: ts.formatDiagnosticsWithColorAndContext([diagnostic], {
            getCurrentDirectory: () => process.cwd(),
            getCanonicalFileName: (file_name) => pathlib.resolve(file_name),
            getNewLine: () => '\n',
        }),
        file_name: diagnostic.file === undefined ? undefined : pathlib.resolve(diagnostic.file.resolvedPath),
        line,
        column,
    };
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
export async function compile(options) {
    // Extract options with defaults.
    let { entry_paths = [], include = [], exclude = [], output, error_limit = 25, compiler_opts = {}, preprocess, exact_files = false, file_by_file = false, watch, extract_exports, debug_file, templates = undefined, } = options;
    if (entry_paths.length > 0) {
        include = include.concat(entry_paths);
    }
    if (watch === undefined || typeof watch === "boolean") {
        watch = {
            enabled: watch ?? false,
            log_level: 1,
            on_change: undefined,
        };
    }
    const { enabled: watch_enabled = false, log_level: watch_log_level = 1, } = watch;
    // Initialize compile result.
    let import_order;
    const compile_result = {
        inputs: [],
        outputs: [],
        errors: [],
        debug(_watch = false) {
            // Sort the errors based on import order.
            if (import_order !== undefined) {
                this.errors.sort((a, b) => {
                    // Get import order for both files
                    const orderA = a.file_name ? (import_order.get(a.file_name) ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER;
                    const orderB = b.file_name ? (import_order.get(b.file_name) ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER;
                    // First sort by import order
                    if (orderA !== orderB) {
                        return orderA - orderB;
                    }
                    return 0;
                });
            }
            // Dump errors up to the error limit.
            let last_file, dumped = 0, file_names = new Set();
            for (let i = 0; i < this.errors.length; i++) {
                if (debug_file == null && !file_by_file) {
                    console.error(this.errors[i].data);
                    ++dumped;
                }
                else if (debug_file !== undefined && this.errors[i].file_name?.toLowerCase() === debug_file.toLowerCase()) {
                    console.error(this.errors[i].data);
                    ++dumped;
                }
                else if (file_by_file) {
                    if (last_file !== undefined && this.errors[i].file_name !== last_file) {
                        break;
                    }
                    last_file = this.errors[i].file_name;
                    console.error(this.errors[i].data);
                    ++dumped;
                }
                if (this.errors[i].file_name != null && !file_names.has(this.errors[i].file_name.toLowerCase())) {
                    file_names.add(this.errors[i].file_name.toLowerCase());
                }
                if (dumped >= error_limit) {
                    break;
                }
            }
            if (this.errors.length > 0 && debug_file !== undefined && dumped === 0) {
                console.error(`${vlib.Color.yellow("warning")}: Did not find any files matching "${debug_file}". Valid file names: ${JSON.stringify(Array.from(file_names), null, 4)}`);
            }
            // Map errors per file.
            if (this.errors.length > 0) {
                const error_map = {};
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
            }
            else {
                console.log(`Encountered ${this.errors.length} errors.`);
            }
            if (this.outputs.length > 0) {
                console.log(`Compiled ${this.outputs.length} output files.`);
            }
            // }
        },
        exports: {},
    };
    let diagnostics = [];
    const processed_files = {};
    // Process entry paths if exact_files is true.
    if (exact_files) {
        for (let i = 0; i < include.length; i++) {
            const current_path = new vlib.Path(include[i]);
            if (!current_path.exists()) {
                compile_result.errors.push({
                    data: `Entry path "${current_path.str()}" does not exist.`
                });
                continue;
            }
            include[i] = current_path.abs().str();
        }
        if (compile_result.errors.length > 0) {
            return compile_result;
        }
    }
    // Build in-memory tsconfig options.
    const tsconfig = {
        compilerOptions: {
            ...compiler_opts,
            outDir: output,
            declaration: compiler_opts.declaration === true ? true : false,
            declarationDir: compiler_opts.declaration === true ? output : undefined,
            // Add other default compiler options as needed
        },
        include: include,
        exclude: exclude,
    };
    if (watch.enabled) {
        tsconfig.compilerOptions.incremental = true;
        tsconfig.compilerOptions.tsBuildInfoFile = output + "/.tsbuildinfo";
    }
    tsconfig.compilerOptions.paths ??= {};
    tsconfig.compilerOptions.paths["volt"] = [new vlib.Path(__dirname + "../../../../../../frontend/dist/volt.js").abs().str()];
    tsconfig.compilerOptions.paths["volt/*"] = [new vlib.Path(__dirname + "../../../../../../frontend/dist/").abs().str() + "/*"];
    // let now = Date.now();
    // Parse the in-memory tsconfig options.
    const parsed_tsconfig = ts.parseJsonConfigFileContent(tsconfig, ts.sys, "./");
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
        const written_files = new Map();
        const custom_ts_sys = {
            ...ts.sys,
            fileExists: (file_name) => {
                const resolved_file = pathlib.resolve(file_name);
                if (resolved_file === virtual_tsconfig_path) {
                    return true;
                }
                if (exact_files && !entry_paths.includes(resolved_file)) {
                    return false;
                }
                return fs.existsSync(resolved_file);
            },
            readFile: (file_name) => {
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
                    source_code = Preprocessing.preprocess(resolved_file, source_code, { macros: true, templates });
                    // Apply user preprocessing.
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
            writeFile: (file_name, data, write_byte_order_mark, on_error, source_files) => {
                file_name = pathlib.resolve(file_name);
                // Check if file has changed.
                if (written_files.has(file_name) && written_files.get(file_name) === data) {
                    return;
                }
                // Logs.
                if (watch_log_level >= 1) {
                    console.log(`ts-watcher: ${vlib.Color.purple("message")} Writing out file ${file_name}.`);
                }
                // Write the file using the original writeFile method
                ts.sys.writeFile(file_name, data, write_byte_order_mark);
                written_files.set(file_name, data);
                // Call the on_change callback after writing the file
                if (typeof watch === "object" && typeof watch.on_change === "function" && file_name.endsWith(".js")) {
                    watch.on_change(resolve_path(file_name));
                }
            },
        };
        // Create WatchCompilerHost using createWatchCompilerHost
        const host = ts.createWatchCompilerHost(virtual_tsconfig_path, // Use virtual tsconfig path
        undefined, // Override compiler options if needed
        custom_ts_sys, ts.createEmitAndSemanticDiagnosticsBuilderProgram, 
        // ts.createSemanticDiagnosticsBuilderProgram,
        // reportDiagnostic callback
        (diagnostic) => {
            compile_result.errors.push(format_ts_error(diagnostic));
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
                    }, 100);
                }
                else {
                    if (compile_result.errors.length > 0) {
                        compile_result.debug();
                    }
                    compile_result.errors = [];
                }
            }
            // Skip.
            if (watch_log_level <= 0 && diagnostic.category === 3) {
                // skip messages (3)
                return;
            }
            const message = ts.formatDiagnosticsWithColorAndContext([diagnostic], {
                getCurrentDirectory: () => process.cwd(),
                getCanonicalFileName: (file_name) => pathlib.resolve(file_name),
                getNewLine: () => '\n',
            });
            console.log("ts-watcher:", message.trimEnd());
        });
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
        const checker = initial_program.getTypeChecker();
        // Iterate through all source files in the program
        for (let i = 0; i < program_source_files.length; i++) {
            const source = program_source_files[i];
            // Skip declaration files (.d.ts) if not needed
            if (source.isDeclarationFile)
                continue;
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
                    const name = exp.getName();
                    if (name !== "default") {
                        list.push(name);
                    }
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
        processed_files[file_name] = Preprocessing.preprocess(file_name, source_file.text, { macros: true, templates });
        // Apply user-defined preprocessing.
        if (preprocess) {
            let res = preprocess(file_name, processed_files[file_name]);
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
    const file_exists_cache = new Map();
    const compiler_host = {
        fileExists: (file_name) => {
            // console.log("fileExists", file_name)
            const resolved_file = pathlib.resolve(file_name);
            if (processed_files[resolved_file]) {
                return true;
            }
            else if (file_exists_cache.has(resolved_file)) {
                return file_exists_cache.get(resolved_file);
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
                return ts.createSourceFile(resolved_file, processed_files[resolved_file], language_version, true);
            }
            if (exact_files && !entry_paths.includes(resolved_file)) {
                // if (resolved_file.endsWith("home.ts") || resolved_file.endsWith("home.js")) console.log("getSourceFile2", resolved_file)
                return undefined; // skip by exact files.
            }
            if (!fs.existsSync(resolved_file)) {
                // if (resolved_file.endsWith("home.ts") || resolved_file.endsWith("home.js")) console.log("getSourceFile3", resolved_file)
                if (on_error)
                    on_error(`File not found: ${resolved_file}`);
                return undefined;
            }
            // if (resolved_file.endsWith("home.ts") || resolved_file.endsWith("home.js")) console.log("getSourceFile4", resolved_file)
            const source_code = fs.readFileSync(resolved_file, 'utf-8');
            return ts.createSourceFile(resolved_file, source_code, language_version, true);
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
            if (file_name.endsWith('.js')) {
                const paths = parsed_tsconfig.options.paths || {};
                const baseUrl = parsed_tsconfig.options.baseUrl || './';
                const transformed = data.replace(/(import|export)(\s+(?:\*\s+as\s+[^,}\s]+|\{[^}]*\}|[^,}\s]+)(?:\s*,\s*(?:\*\s+as\s+[^,}\s]+|\{[^}]*\}|[^,}\s]+))*\s+from\s+["'])([^"']+)(["'])/g, (match, importType, importDetails, importPath, quote) => {
                    for (const [alias, targets] of Object.entries(paths)) {
                        if (importPath === alias || importPath.startsWith(alias + '/')) {
                            const target = targets[0];
                            const from = pathlib.dirname(file_name);
                            const to = pathlib.resolve(pathlib.dirname(baseUrl), target);
                            const relativePath = pathlib.relative(from, to);
                            const finalPath = relativePath.startsWith('.') ?
                                relativePath :
                                './' + relativePath;
                            return `${importType}${importDetails}${finalPath}${quote}`;
                        }
                    }
                    return match;
                });
                ts.sys.writeFile(file_name, transformed, write_byte_order_mark);
            }
            else {
                ts.sys.writeFile(file_name, data, write_byte_order_mark);
            }
        },
        resolveModuleNames: (moduleNames, containingFile) => {
            const matchPath = createMatchPath(parsed_tsconfig.options.paths || {});
            return moduleNames.map(moduleName => {
                // First try to resolve using paths
                const matchedPath = matchPath(moduleName);
                // console.log(moduleName, matchedPath)
                if (matchedPath) {
                    return {
                        resolvedFileName: matchedPath,
                        isExternalLibraryImport: false,
                        extension: pathlib.extname(matchedPath)
                    };
                }
                // Fall back to classic resolution
                const result = ts.resolveModuleName(moduleName, containingFile, parsed_tsconfig.options, {
                    fileExists: compiler_host.fileExists,
                    readFile: compiler_host.readFile,
                });
                return result.resolvedModule;
            });
        },
    };
    function createMatchPath(patterns) {
        const matchers = Object.entries(patterns).map(([prefix, paths]) => ({
            prefix: prefix.endsWith('/*') ? prefix.slice(0, -2) : prefix,
            paths: paths.map(p => p.endsWith('/*') ? p.slice(0, -2) : p)
        }));
        return (moduleName) => {
            for (const { prefix, paths } of matchers) {
                if (moduleName.startsWith(prefix)) {
                    const suffix = moduleName.slice(prefix.length);
                    for (const path of paths) {
                        const fullPath = path + suffix;
                        // Try with .ts, .tsx, and as-is
                        for (const ext of ['.ts', '.tsx', '', '.js']) {
                            const attemptPath = fullPath + ext;
                            if (ts.sys.fileExists(attemptPath)) {
                                return attemptPath;
                            }
                        }
                    }
                }
            }
            return undefined;
        };
    }
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
        // if (debug_file == null || diagnostics[i]?.file?.fileName === debug_file) {
        compile_result.errors.push(format_ts_error(diagnostics[i]));
        // }
    }
    // console.log("Compile:", Date.now() - now); now = Date.now()
    // Response.
    return compile_result;
}
;
// Format an esbuild warning / error.
const format_esbuild_warning_error = (warning) => {
    let output;
    if (warning.location) {
        const trimmed_line = warning.location.lineText.trimStart();
        const removed_start_indent = warning.location.lineText.length - trimmed_line.length;
        output =
            `${vlib.Color.cyan(warning.location.file)}:${vlib.Color.yellow(warning.location.line)}:${vlib.Color.yellow(warning.location.column)}` +
                ` - ${vlib.Color.yellow("warning")} [esbuild${warning.id === "" ? "" : `-${warning.id}`}]: ${warning.text}\n` +
                "\n" + vlib.Colors.bright_bg.white + vlib.Colors.black + warning.location.line + vlib.Colors.end + "    " + trimmed_line +
                "\n" + vlib.Colors.bright_bg.white + vlib.Colors.black + " ".repeat(warning.location.line.toString().length) + vlib.Colors.end +
                " ".repeat(4 + warning.location.column - removed_start_indent) + vlib.Color.red("~".repeat(warning.location.length));
    }
    else {
        output = `${vlib.Color.yellow("warning")} [esbuild${warning.id === "" ? "" : `-${warning.id}`}]: ${warning.text}`;
    }
    if (Array.isArray(warning.notes)) {
        for (const note of warning.notes) {
            if (note.location) {
                const trimmed_line = note.location.lineText.trimStart();
                const removed_start_indent = note.location.lineText.length - trimmed_line.length;
                output +=
                    `\n    ${vlib.Color.cyan(note.location.file)}:${vlib.Color.yellow(note.location.line)}:${vlib.Color.yellow(note.location.column)}` +
                        ` - ${vlib.Color.gray("note")}: ${note.text}\n` +
                        "\n" + vlib.Colors.bright_bg.white + vlib.Colors.black + note.location.line + vlib.Colors.end + "        " + trimmed_line +
                        "\n" + vlib.Colors.bright_bg.white + vlib.Colors.black + " ".repeat(note.location.line.toString().length) + vlib.Colors.end +
                        " ".repeat(8 + note.location.column - removed_start_indent) + vlib.Color.red("~".repeat(note.location.length));
            }
            else {
                output +=
                    `\n    ${vlib.Color.gray("note")}: ${note.text}`;
            }
            if (note.suggestion) {
                console.error("@todo handle suggestion:" + note.suggestion + " note: " + JSON.stringify(note, null, 4));
            }
        }
    }
    return {
        data: output,
        file_name: warning.location?.file,
        line: warning.location?.line,
        column: warning.location?.column,
    };
};
/*
 * Bundles transpiled JavaScript files using esbuild.
 */
export async function bundle(options) {
    // console.log(">>> BUNDLE", options)
    let { entry_paths = [], include = [], externals = [], output = undefined, platform = 'browser', format = 'iife', target = 'es2021', minify = false, sourcemap = false, // 'inline'
    error_limit = 25, extract_inputs = false, tree_shaking = undefined, debug = false, bundler = "esbuild", opts = {}, postprocess = undefined, log_level = 0, analyze = false, } = options;
    if (entry_paths.length > 0) {
        include = include.concat(entry_paths);
    }
    const errors = [];
    let bundled_code = undefined;
    let bundled_source_map = undefined;
    let inputs = [];
    // Bundle using esbuild.
    const outfile = !output || typeof output === "string" ? output : output[0];
    const x = false;
    if (bundler === "esbuild") {
        try {
            const result = await esbuild.build({
                entryPoints: include,
                bundle: true,
                platform: platform,
                format: format,
                target: target,
                minify: minify,
                sourcemap,
                write: false,
                metafile: extract_inputs,
                logLevel: typeof debug === "boolean" ? (debug ? 'debug' : 'silent') : debug,
                treeShaking: tree_shaking,
                external: externals,
                outfile,
                loader: {
                    '.ttf': 'file',
                    '.woff': 'file',
                    '.woff2': 'file',
                    '.eot': 'file',
                    '.svg': 'file',
                },
                ...opts,
            });
            if (result.errors.length > 0) {
                for (const error of result.errors) {
                    errors.push(format_esbuild_warning_error(error));
                }
            }
            if (result.warnings.length > 0) {
                for (const warning of result.warnings) {
                    errors.push(format_esbuild_warning_error(warning));
                }
            }
            if (extract_inputs && result.metafile?.inputs) {
                inputs = Object.keys(result.metafile.inputs).map(resolve_path);
            }
            if (result.outputFiles && result.outputFiles.length > 0) {
                bundled_code = result.outputFiles
                    .filter(f => f.path === "<stdout>" || (f.path.endsWith('.js') && !f.path.endsWith('.d.js')))
                    .map(f => f.text)
                    .join('\n');
                if (sourcemap) {
                    const mapFile = result.outputFiles.find(f => f.path.endsWith('.map'));
                    if (mapFile)
                        bundled_source_map = mapFile.text;
                }
            }
            else {
                errors.push({ data: "No output files were generated during bundling." });
            }
            // if (analyze && result.metafile) {
            //     const res = await esbuild.analyzeMetafile(result.metafile, { verbose: false })
            //     console.log("Meta:\n" + res);
            // }
        }
        catch (err) {
            let processed = false;
            if (Array.isArray(err.errors)) {
                for (const error of err.errors) {
                    errors.push(format_esbuild_warning_error(error));
                }
                processed = true;
            }
            if (Array.isArray(err.warnings)) {
                for (const warning of err.warnings) {
                    errors.push(format_esbuild_warning_error(warning));
                }
                processed = true;
            }
            if (!processed) {
                errors.push({ data: err.message || String(err) });
            }
        }
    }
    // Bundle using Rollup.
    else {
        throw new Error("Still in development.");
        try {
            const { rollup } = await import('rollup');
            const { nodeResolve } = await import('@rollup/plugin-node-resolve');
            const commonjs = (await import('@rollup/plugin-commonjs')).default;
            const json = (await import('@rollup/plugin-json')).default;
            const url = (await import('@rollup/plugin-url')).default;
            const postcss = (await import('rollup-plugin-postcss')).default;
            const ts2 = (await import('rollup-plugin-typescript2')).default;
            const { terser } = await import('@rollup/plugin-terser');
            const plugins = [
                nodeResolve({
                    browser: platform === 'browser',
                    preferBuiltins: platform !== 'browser',
                    extensions: ['.mjs', '.js', '.json', '.node', '.ts', '.tsx', '.css']
                }),
                // override module setting to an ES module format Rollup can handle
                ts2({
                    tsconfigOverride: {
                        compilerOptions: {
                            module: 'ESNext',
                            sourceMap: !!sourcemap
                        }
                    }
                }),
                commonjs(),
                json({ preferConst: true }),
                url({
                    include: ['**/*.{ttf,woff,woff2,eot,svg,png,jpg,gif,json}'],
                    limit: 8192,
                    emitFiles: true,
                }),
                postcss({ inject: true, extensions: ['.css'] }),
            ];
            if (minify) {
                plugins.push(terser());
            }
            const bundleObj = await rollup({
                input: include,
                external: externals,
                plugins,
                treeshake: tree_shaking ?? true,
                onwarn(warning, warn) { if (debug)
                    warn(warning); }
            });
            const { output: rollupOutput } = await bundleObj.generate({
                format,
                sourcemap: sourcemap !== false,
                ...(format === 'iife' ? { name: 'Bundle' } : {}),
            });
            bundled_code = '';
            bundled_source_map = '';
            for (const chunkOrAsset of rollupOutput) {
                if (chunkOrAsset.type === 'chunk') {
                    bundled_code += chunkOrAsset.code;
                    if (chunkOrAsset.map) {
                        bundled_source_map += chunkOrAsset.map.toString();
                    }
                    if (extract_inputs) {
                        inputs.push(...Object.keys(chunkOrAsset.modules));
                    }
                }
            }
            if (extract_inputs) {
                inputs = Array.from(new Set(inputs.map(resolve_path)));
            }
        }
        catch (err) {
            console.error("Rollup error:", err);
            errors.push({ data: err.message || String(err) });
        }
    }
    // After bundling, stabilize output with Babel
    // if (bundled_code) {
    //     try {
    //         const { transformAsync } = await import('@babel/core');
    //         const babelResult = await transformAsync(bundled_code, {
    //             babelrc: false,
    //             configFile: false,
    //             presets: [
    //                 ['@babel/preset-env', {
    //                     targets: platform === 'browser' ? ">0.25%, not dead" : undefined
    //                 }]
    //             ],
    //             sourceMaps: !!sourcemap,
    //             inputSourceMap: bundled_source_map ? JSON.parse(bundled_source_map) : undefined,
    //         });
    //         if (babelResult && babelResult.code) {
    //             bundled_code = babelResult.code;
    //             if (babelResult.map) {
    //                 bundled_source_map = typeof babelResult.map === 'string'
    //                     ? babelResult.map
    //                     : JSON.stringify(babelResult.map);
    //             }
    //         }
    //     } catch (err: any) {
    //         errors.push({ data: `Babel transform error: ${err.message || err}` });
    //     }
    // }
    // Postprocess.
    if (bundled_code && typeof postprocess === "function") {
        const res = postprocess(bundled_code);
        if (res instanceof Promise) {
            bundled_code = await res;
        }
        else {
            bundled_code = res;
        }
    }
    // Write to file.
    if (typeof output === "string") {
        await new vlib.Path(output).save(bundled_code ?? "");
    }
    else if (Array.isArray(output)) {
        for (let i = 0; i < output.length; i++) {
            await new vlib.Path(output[i]).save(bundled_code ?? "");
        }
    }
    // Logs.
    if (log_level >= 1) {
        const first_path = typeof output === "string" ? output : (Array.isArray(output) ? output[0] : undefined);
        if (first_path != null) {
            const p = new vlib.Path(first_path);
            vlib.Utils.print_marker(`Bundled ${p.name()} (${p.str()}) [${vlib.Utils.format_bytes(p.size)}].`);
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
            }
            else {
                console.log(`Encountered ${errors.length} errors.`);
            }
            if (typeof bundled_code === "string" && bundled_code !== "") {
                console.log(`Generated code of ${vlib.Utils.format_bytes(Buffer.byteLength(bundled_code, 'utf8'))}`);
            }
        },
    };
}
// export async function bundle(options: BundleOptions): Promise<BundleResult> {
//     // console.log(">>> BUNDLE", options)
//     let {
//         entry_paths = [],
//         include = [],
//         externals = [],
//         output = undefined,
//         platform = 'browser',
//         format = 'iife',
//         target = 'es2021',
//         minify = false,
//         sourcemap = false, // 'inline'
//         error_limit = 25,
//         extract_inputs = false,
//         tree_shaking = undefined,
//         debug = false,
//         bundler = "esbuild",
//         opts = {},
//         postprocess = undefined,
//         log_level = 0,
//         // bundler = "rollup",
//     } = options;
//     if (entry_paths.length > 0) {
//         include = include.concat(entry_paths);
//     }
//     const errors: CompilerError[] = [];
//     let bundled_code: string | undefined = undefined;
//     let bundled_source_map: string | undefined = undefined;
//     let inputs: string[] = [];
//     // Bundle using esbuild.
//     const outfile = !output || typeof output === "string" ? output : output[0];
//     if (bundler === "esbuild") {
//         try {
//             const result = await esbuild.build({
//                 entryPoints: include,
//                 bundle: true,
//                 platform: platform,
//                 format: format,
//                 target: target,
//                 minify: minify,
//                 sourcemap,
//                 write: false,
//                 metafile: extract_inputs,
//                 logLevel: typeof debug === "boolean" ? (debug ? 'debug' : 'silent') : debug as any,
//                 treeShaking: tree_shaking,
//                 // logLevel: 'silent',
//                 // outdir: "/",
//                 // minifyWhitespace: false,
//                 // minifySyntax: false,
//                 // minifyIdentifiers: false,
//                 external: externals,
//                 // Adding an outfile is required for esbuild to resolve non js files.
//                 outfile,
//                 loader: {
//                     // when you import or url() a .ttf, copy it to output and adjust the URL
//                     '.ttf': 'file',
//                     '.woff': 'file',
//                     '.woff2': 'file',
//                     '.eot': 'file',
//                     '.svg': 'file',
//                 },
//                 ...opts,
//             });
//             if (result.errors.length > 0) {
//                 for (const error of result.errors) {
//                     errors.push(format_esbuild_warning_error(error))
//                 }
//             }
//             if (result.warnings.length > 0) {
//                 for (const warning of result.warnings) {
//                     errors.push(format_esbuild_warning_error(warning))
//                 }
//             }
//             // Set output paths.
//             if (extract_inputs && result.metafile?.inputs != null && typeof result.metafile?.inputs === "object") {
//                 inputs = Object.keys(result.metafile?.inputs).map(resolve_path);
//             }
//             // console.log("RESULT:", result);
//             // Load outfile.
//             // if (typeof outfile === "string") {
//             //     bundled_code = await new vlib.Path(outfile).load();
//             //     // console.log("BUNDLED CODE:", bundled_code);
//             // }
//             //
//             // Process output files.
//             // else
//             if (result.outputFiles && result.outputFiles.length > 0) {
//                 // Concatenate all output files
//                 bundled_code = result.outputFiles
//                     .filter(file => file.path === "<stdout>" || (file.path.endsWith('.js') && !file.path.endsWith('.d.js')))
//                     .map(file => file.text)
//                     .join('\n');
//                 if (sourcemap) {
//                     const source_map_file = result.outputFiles.find(file => file.path.endsWith('.map'));
//                     if (source_map_file) {
//                         bundled_source_map = source_map_file.text;
//                     }
//                 }
//             } else {
//                 errors.push({ data: "No output files were generated during bundling." });
//             }
//         } catch (err: any) {
//             let processed = false;
//             if (Array.isArray(err.errors) && err.errors.length > 0) {
//                 for (const error of err.errors) {
//                     errors.push(format_esbuild_warning_error(error))
//                 }
//                 processed = true;
//             }
//             if (Array.isArray(err.warnings) && err.warnings.length > 0) {
//                 for (const warning of err.warnings) {
//                     errors.push(format_esbuild_warning_error(warning))
//                 }
//                 processed = true;
//             }
//             if (!processed) {
//                 errors.push({ data: err.message || String(err) });
//             }
//         }
//     }
//     // Bundle using rollup.
//     else {
//         try {
//             throw new Error("Rollup is deprecated since it is currently out of use.");
//             // // Determine if minification is needed
//             // const plugins: Plugin[] = [
//             //     nodeResolve({
//             //         browser: platform === 'browser',
//             //         preferBuiltins: platform === 'node',
//             //     }),
//             //     // commonjs(),
//             // ];
//             // if (minify) {
//             //     plugins.push(terser());
//             // }
//             // const input_set: Set<string> = new Set();
//             // // if (extract_inputs) {
//             // //     plugins.push(
//             // //         // Custom plugin to collect all imported files
//             // //         {
//             // //             name: 'collect-input-files',
//             // //             resolveId(source, importer) {
//             // //                 return null; // Let Rollup handle module resolution
//             // //             },
//             // //             load(id) {
//             // //                 console.log("ADD:",id)
//             // //                 input_set.add(id); // Add each module to the input_set set
//             // //                 return null; // Let Rollup handle loading the module
//             // //             }
//             // //         }
//             // //     )
//             // // }
//             // const rollup_input_options: RollupOptions = {
//             //     input: include,
//             //     plugins: plugins,
//             //     treeshake: tree_shaking !== undefined ? tree_shaking : true,
//             //     // Suppress Rollup warnings if not in debug mode
//             //     onwarn: (warning, warn) => {
//             //         if (debug) {
//             //             warn(warning);
//             //         }
//             //         // Otherwise, suppress warnings
//             //     },
//             // };
//             // const bundle = await rollup(rollup_input_options);
//             // const rollup_output_options: OutputOptions = {
//             //     format: format,
//             //     sourcemap: sourcemap !== false,
//             //     // Name is required for 'iife' format
//             //     ...(format === 'iife' ? { name: 'Bundle' } : {}),
//             //     // Generate inline source maps if specified
//             //     ...(sourcemap === 'inline' ? { sourcemap: 'inline' } : {}),
//             //     ...(sourcemap === 'external' ? { sourcemap: true } : {}),
//             //     ...(sourcemap === 'linked' ? { sourcemap: true, sourcemapPathTransform: (relativePath: string) => `./${relativePath}` } : {}),
//             //     // Additional Rollup output options can be added here
//             // };
//             // const { output } = await bundle.generate(rollup_output_options);
//             // bundled_code = '';
//             // bundled_source_map = '';
//             // // @todo remove as any
//             // for (const item of output as any) {
//             //     if (item.type === 'chunk') {
//             //         bundled_code += item.code;
//             //         if (item.map) {
//             //             bundled_source_map += item.map.toString();
//             //         }
//             //         if (extract_inputs) {
//             //             for (const name of Object.keys(item.modules)) {
//             //                 if (!input_set.has(name)) {
//             //                     input_set.add(name);
//             //                 }
//             //             }
//             //         }
//             //     }
//             // }
//             // inputs = extract_inputs ? Array.from(input_set) : []
//         } catch (err: any) {
//             errors.push({ data: err.message ?? String(err) });
//             // throw new Error(`Rollup bundling failed: ${err.message || err}`);
//         }
//     }
//     // Postprocess.
//     if (bundled_code && typeof postprocess === "function") {
//         const res = postprocess(bundled_code);
//         if (res instanceof Promise) {
//             bundled_code = await res;
//         } else {
//             bundled_code = res;
//         }
//     }
//     // Write to file.
//     if (typeof output === "string") {
//         await new vlib.Path(output).save(bundled_code ?? "");
//     } else if (Array.isArray(output)) {
//         for (let i = 0; i < output.length; i++) {
//             await new vlib.Path(output[i]).save(bundled_code ?? "");
//         }
//     }
//     // Logs.
//     if (log_level >= 1) {
//         const first_path = typeof output === "string" ? output : (Array.isArray(output) ? output[0] : undefined);
//         if (first_path != null) {
//             const p = new vlib.Path(first_path);
//             vlib.Utils.print_marker(`Bundled ${p.name()} (${p.str()}) [${vlib.Utils.format_bytes(p.size)}].`);
//         }
//     }
//     return {
//         code: bundled_code,
//         source_map: bundled_source_map,
//         errors,
//         inputs,
//         debug() {
//             for (let i = 0; i < Math.min(error_limit, errors.length); i++) {
//                 console.error(errors[i].data);
//             }
//             if (error_limit != null && errors.length > error_limit) {
//                 console.log(`Displayed the first ${error_limit} errors out of ${errors.length}.`);
//             } else {
//                 console.log(`Encountered ${errors.length} errors.`);
//             }
//             if (typeof bundled_code === "string" && bundled_code !== "") {
//                 console.log(`Generated code of ${vlib.Utils.format_bytes(Buffer.byteLength(bundled_code as string, 'utf8'))}`)
//             }
//         },
//     }
// };
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
    // collect_exports,
    // get_source_files,
};
