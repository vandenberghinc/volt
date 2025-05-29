/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 *
 * Frontend Typescript compiler with some mini additional options.
 */
import * as pathlib from 'path';
import * as fs from 'fs';
import * as ts from 'typescript';
import * as rollup from 'rollup';
import typescript from 'rollup-plugin-typescript2';
import resolve_plugin from '@rollup/plugin-node-resolve';
import commonjs_plugin from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
const { vhighlight, vlib } = require("../vinc.js");
// ------------------------------------------------------------------------------------------
// TS lib.
export const tslib = {
    /*
     * Preprocesses the input text, replacing non-string numeric literals
     * suffixed with units and hex color codes with string literals.
     */
    preprocess(path, input) {
        // Initialize output and batch
        let output = [];
        let batch = [];
        let State;
        (function (State) {
            State[State["code"] = 0] = "code";
            State[State["string"] = 1] = "string";
            State[State["comment"] = 2] = "comment";
            State[State["regex"] = 3] = "regex";
        })(State || (State = {}));
        let state = State.code;
        // Function to process the accumulated batch
        const process_code_batch = () => {
            let str = batch.join('')
                // Replace numeric suffix to string.
                .replace(/\b\d+(\.\d+)?(em\b|rem\b|px\b|vh\b|vw\b|%)/g, '"$&"')
                // Replace hex colors.
                .replace(/#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g, '"$&"');
            // Append the transformed segment to output
            output.push(str);
            // Clear the batch
            batch = [];
        };
        // Process string batch.
        const process_string_batch = () => {
            let BaseIndentState;
            (function (BaseIndentState) {
                BaseIndentState[BaseIndentState["init"] = 0] = "init";
            })(BaseIndentState || (BaseIndentState = {}));
            let str = batch.join('')
                // Replace numeric suffix to string.
                .replace(/```([\s\S]*?)```/g, (match, content) => {
                // console.log("===========================\nMatched\n"+ content)
                let base_indent = BaseIndentState.init;
                let line = -1;
                content = content.replace(/(^|\n)([ \t]*)(\n)*/g, (indent_match, prefix, indent, suffix) => {
                    ++line;
                    if (line === 0 && suffix === undefined && indent === "") {
                        base_indent = BaseIndentState.init;
                        // console.log({mode: 1, line, prefix, indent, base_indent, output: prefix, suffix})
                        return prefix;
                    }
                    else if (base_indent === BaseIndentState.init) {
                        base_indent = indent;
                        // console.log("Set base indent to:",{indent})
                        // console.log({line, prefix, indent, base_indent, output: prefix, suffix})
                        return prefix;
                    }
                    else if (indent.startsWith(base_indent)) {
                        indent = indent.slice(base_indent.length);
                    }
                    else {
                        // console.log({indent, base_indent})
                    }
                    // console.log({mode: "output", line, prefix, indent, base_indent, output: prefix + indent, suffix})
                    // console.log({prefix, indent})
                    return prefix + indent;
                });
                return "`" + content.trim() + "`";
            });
            // Append the transformed segment to output
            output.push(str);
            // Clear the batch
            batch = [];
        };
        // Initialize the Iterator
        new vhighlight.Iterator({
            language: 'js',
            code: input,
            callback(s) {
                // Get new state.
                let new_state;
                if (s.is_str || s.is_template_literal) {
                    new_state = State.string;
                }
                else if (s.is_comment || s.is_multi_line_comment) {
                    new_state = State.comment;
                }
                else if (s.is_str) {
                    new_state = State.regex;
                }
                else {
                    new_state = State.code;
                }
                // Process new state.
                if (new_state !== state) {
                    if (state === State.code) {
                        process_code_batch();
                    }
                    else if (state === State.string) {
                        process_string_batch();
                    }
                    state = new_state;
                }
                // Push character.
                if (state === State.code || state === State.string) {
                    batch.push(s.char);
                }
                else {
                    output.push(s.char);
                }
            },
        }).iterate();
        // Process any remaining batch after iteration
        if (batch.length > 0) {
            if (state === State.code) {
                process_code_batch();
            }
            else if (state === State.string) {
                process_string_batch();
            }
        }
        // Combine the output into a single string
        return output.join('');
    },
    // Split macro args `X, X` args.
    _split_macro_args(data) {
        // Process args.
        let args = [""];
        const process_arg = () => {
            let arg = args[args.length - 1].trim();
            if ((arg.charAt(0) === "'" && arg.charAt(arg.length - 1) === "'") ||
                (arg.charAt(0) === "\"" && arg.charAt(arg.length - 1) === "\"")) {
                arg = arg.slice(1, -1);
            }
            args[args.length - 1] = arg;
        };
        // Iterate.
        new vhighlight.Iterator({
            language: "ts",
            code: data,
            callback(state) {
                if (state.char === "," &&
                    state.curly_depth === 0 &&
                    state.bracket_depth === 0 &&
                    state.parenth_depth === 0 &&
                    !state.is_str &&
                    !state.is_regex &&
                    !state.is_comment &&
                    !state.is_multi_line_comment) {
                    process_arg();
                    args.push("");
                }
                else {
                    args[args.length - 1] += state.char;
                }
            },
        }).iterate();
        // Return empty array.
        if (args.length === 1 && args[0] === "") {
            return [];
        }
        // Process arg.
        if (args.length > 0) {
            process_arg();
        }
        // Return args.
        return args;
    },
    /*
     * Extract all #macro statements.
     */
    _extract_macro_statements(path, data) {
        let output = [], is_preprocessor = null;
        const macros = {};
        const iterator = new vhighlight.Iterator({
            language: "ts",
            code: data,
            allow_preprocessors: true,
            callback(state) {
                // End of preprocessor.
                if (is_preprocessor !== undefined && !state.is_preprocessor) {
                    // Extract name & value.
                    let Modes;
                    (function (Modes) {
                        Modes[Modes["type"] = 0] = "type";
                        Modes[Modes["pre_name"] = 1] = "pre_name";
                        Modes[Modes["name"] = 2] = "name";
                        Modes[Modes["args"] = 3] = "args";
                        Modes[Modes["value"] = 4] = "value";
                    })(Modes || (Modes = {}));
                    ;
                    let type = "", name = "", value = "", full = "", args = "", args_depth = [0, 0, 0];
                    let s = is_preprocessor, mode = Modes.type;
                    while (s != null && s != state) {
                        if (mode === Modes.type) {
                            if (s.is_whitespace) {
                                mode = Modes.pre_name;
                            }
                            else {
                                type += s.char;
                            }
                        }
                        else if (mode === Modes.pre_name && !s.is_whitespace) {
                            mode = Modes.name;
                            name += s.char;
                        }
                        else if (mode === Modes.name) {
                            if (s.char === "(") {
                                mode = Modes.args;
                                args_depth = [s.curly_depth, s.parenth_depth - 1, s.bracket_depth];
                            }
                            else if (s.is_whitespace &&
                                s.curly_depth === is_preprocessor.curly_depth &&
                                s.parenth_depth === is_preprocessor.parenth_depth &&
                                s.bracket_depth === is_preprocessor.bracket_depth) {
                                mode = Modes.value;
                            }
                            else {
                                name += s.char;
                            }
                        }
                        else if (mode === Modes.args) {
                            if (s.char === ")" &&
                                s.curly_depth === args_depth[0] &&
                                s.parenth_depth === args_depth[1] &&
                                s.bracket_depth === args_depth[2]) {
                                mode = Modes.name;
                            }
                            else {
                                args += s.char;
                            }
                        }
                        else if (mode === Modes.value) {
                            if (s.char === "\\" && s.next?.is_line_break) {
                                // skip.
                            }
                            else {
                                value += s.char;
                            }
                        }
                        full += s.char;
                        s = s.next;
                    }
                    if (type === "#macro") {
                        name = name.trim();
                        macros[name] = {
                            name,
                            value: value.trim(),
                            args: args.length === 0 ? [] : tslib._split_macro_args(args),
                        };
                    }
                    else {
                        output.push(full);
                    }
                    is_preprocessor = undefined;
                }
                // Start of preprocessor.
                else if (state.is_preprocessor) {
                    if (is_preprocessor === undefined) {
                        is_preprocessor = state;
                    }
                    return; // dont add to new data.
                }
                output.push(state.char);
            },
        });
        iterator.iterate();
        return [output.join(""), macros];
    },
    /*
     * Fill all #macro statements.
     */
    _fill_macro_statements(path, data, macros) {
        let output = [];
        let buff = [];
        // Construct regex to match preprocessor variables
        const macros_keys = Object.keys(macros);
        const regex = new RegExp(`(\\#?|\\b)(${macros_keys.join("|")})(\\([^)]*\\)|\\b)`, 'g');
        // Fill macro replacements.
        const make_replacements = (buff) => {
            return buff
                .join('')
                .replace(regex, (match, m1, m2, m3) => {
                const macro = macros[m2];
                if (macro == null) {
                    return match;
                }
                let value = "";
                if (m1.charAt(0) !== "#") {
                    value = m1;
                }
                value += macro.value;
                if (m3 && m3.charAt(0) === "(" && macro.args.length > 0) {
                    let args = tslib._split_macro_args(m3.slice(1, -1));
                    for (let i = 0; i < macro.args.length; i++) {
                        value = value.replace(new RegExp(`\\b${macro.args[i]}\\b`, 'g'), args[i] ?? "");
                    }
                    return value;
                }
                return value;
            });
        };
        // Iterator that processes the code
        const iterator = new vhighlight.Iterator({
            language: "ts",
            code: data,
            allow_preprocessors: true,
            callback(state) {
                // Accumulate real code into the buffer
                if (!state.is_str && !state.is_regex && !state.is_comment && !state.is_multi_line_comment) {
                    buff.push(state.char);
                }
                else {
                    // Process code buff.
                    if (buff.length > 0) {
                        output.push(make_replacements(buff));
                        buff = [];
                    }
                    // Push non-code characters directly to output (strings, comments, etc.)
                    output.push(state.char);
                }
            },
        });
        // Run the iterator to process the code
        iterator.iterate();
        // Process code buff.
        if (buff.length > 0) {
            output.push(make_replacements(buff));
        }
        // Return the processed output as a joined string
        return output.join('');
    },
    // Collect imports.
    async collect_exports(file_path, data) {
        const exported_names = new Set();
        const source_file = ts.createSourceFile(file_path, data, ts.ScriptTarget.ESNext, true);
        /**
         * Recursively visits each node in the AST to find export declarations.
         * @param node - The current AST node.
         */
        function visit_node(node) {
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
                const modifiers = ts.getModifiers(node);
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
    },
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
    async compile_cli({ source, tsconfig, debug = undefined, preprocess = undefined, enable_macros = true, }) {
        vlib.print_marker(`Compiling ${source}.`);
        const { error_limit = 25, max_line_length, debug_single_file = false, target_file, } = (debug ?? {});
        const srcDir = pathlib.resolve(source);
        const tsconfigPath = pathlib.join(srcDir, 'tsconfig.json');
        // Read and parse tsconfig.json
        if (tsconfig === undefined) {
            if (!fs.existsSync(tsconfigPath)) {
                console.error(`tsconfig.json not found in the source directory: ${srcDir}`);
                process.exit(1);
            }
            tsconfig = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
            if (tsconfig.error) {
                const message = ts.flattenDiagnosticMessageText(tsconfig.error.messageText, '\n');
                console.error(`Error reading tsconfig.json: ${message}`);
                process.exit(1);
            }
        }
        const parsedTsConfig = ts.parseJsonConfigFileContent(tsconfig, ts.sys, srcDir);
        if (parsedTsConfig.errors.length > 0) {
            parsedTsConfig.errors.forEach(error => {
                const message = ts.flattenDiagnosticMessageText(error.messageText, '\n');
                console.error(`tsconfig.json error: ${message}`);
            });
            process.exit(1);
        }
        // Get all TypeScript files based on tsconfig's include/exclude
        const files = parsedTsConfig.fileNames;
        // Read and preprocess each file
        const processedFiles = {};
        let preprocessor_definitions = {};
        for (const file of files) {
            processedFiles[file] = this.preprocess(file, await fs.promises.readFile(file, 'utf-8'));
            // Macros
            if (enable_macros) {
                const [data, definitions] = this._extract_macro_statements(file, processedFiles[file]);
                processedFiles[file] = this._fill_macro_statements(file, data, definitions);
            }
            // User defined preprocess.
            if (preprocess) {
                let res = preprocess(file.substr(srcDir.length + 1), processedFiles[file]);
                if (res instanceof Promise) {
                    res = await res;
                }
                if (typeof res === "string") {
                    processedFiles[file] = res;
                }
            }
        }
        ;
        // Create a custom CompilerHost
        const compilerHost = {
            fileExists: (fileName) => {
                if (processedFiles[fileName]) {
                    return true;
                }
                return fs.existsSync(fileName);
            },
            directoryExists: ts.sys.directoryExists,
            getCurrentDirectory: ts.sys.getCurrentDirectory,
            getDirectories: ts.sys.getDirectories,
            getCanonicalFileName: ts.sys.useCaseSensitiveFileNames
                ? (fileName) => fileName
                : (fileName) => fileName.toLowerCase(),
            getNewLine: () => ts.sys.newLine,
            getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
            getSourceFile: (fileName, languageVersion, onError) => {
                if (processedFiles[fileName]) {
                    return ts.createSourceFile(fileName, processedFiles[fileName], languageVersion, true);
                }
                if (!fs.existsSync(fileName)) {
                    if (onError)
                        onError(`File not found: ${fileName}`);
                    return undefined;
                }
                const sourceText = fs.readFileSync(fileName, 'utf-8');
                return ts.createSourceFile(fileName, sourceText, languageVersion, true);
            },
            readFile: (fileName) => {
                if (processedFiles[fileName]) {
                    return processedFiles[fileName];
                }
                return fs.readFileSync(fileName, 'utf-8');
            },
            useCaseSensitiveFileNames: () => ts.sys.useCaseSensitiveFileNames,
            writeFile: ts.sys.writeFile,
        };
        // Create the TypeScript program
        const program = ts.createProgram({
            rootNames: files,
            options: parsedTsConfig.options,
            host: compilerHost,
        });
        // Emit the compiled JavaScript
        const emitResult = program.emit();
        // Collect and display diagnostics
        let allDiagnostics = ts
            .getPreEmitDiagnostics(program)
            .concat(emitResult.diagnostics);
        let hasError = false;
        // Map errors per file.
        const error_map = {};
        for (const item of allDiagnostics) {
            if (item.file?.fileName) {
                if (error_map[item.file.fileName] === undefined) {
                    error_map[item.file.fileName] = 0;
                }
                error_map[item.file.fileName] += 1;
            }
        }
        // Filter by target.
        if (target_file != null) {
            let filtered = [];
            let file_names = [];
            for (const item of allDiagnostics) {
                if (item.file?.fileName == target_file) {
                    filtered.push(item);
                }
                if (item.file?.fileName && !file_names.includes(item.file?.fileName)) {
                    file_names.push(item.file?.fileName);
                }
            }
            if (filtered.length == 0) {
                throw new Error(`Unable to find target file "${target_file}", files: "${file_names.join('", "')}".`);
            }
            allDiagnostics = filtered;
        }
        // Debug single file.
        if (debug_single_file) {
            let filtered = [], file = null;
            for (const item of allDiagnostics) {
                if (item.file) {
                    if (file == null) {
                        // if (item.file.fileName.includes("loaders.js")) {
                        file = item.file.fileName;
                        // }
                    }
                    else if (file != null && file !== item.file.fileName) {
                        break;
                    }
                }
                if (file != null) {
                    filtered.push(item);
                }
            }
            allDiagnostics = filtered;
        }
        // Limit the number of diagnostics if `error_limit` is provided
        const total_errors = allDiagnostics.length;
        const diagnosticsToShow = error_limit != null ? allDiagnostics.slice(0, error_limit) : allDiagnostics;
        // Check if there are any errors
        if (diagnosticsToShow.length > 0) {
            hasError = true;
        }
        // Truncate very long messages.
        // for (const item of diagnosticsToShow) {
        //     if (typeof item.length === "number" && item.length > 180) {
        //         item.length = 180;
        //         item.end = item.start + item.length;
        //         console.log("Limit!")
        //     }
        //     // Searching.
        //     const refset = new WeakSet();
        //     const check = (obj) => {
        //         refset.add(obj)
        //         const values = Object.values(obj);
        //         for (const i of values) {
        //             if (typeof i === "string" && i.includes("!function(t,e){\"object\"==t")) {
        //                 return true;
        //             } else if (i != null && typeof i === "object" && !refset.has(i)) {
        //                 let res;
        //                 if ((res = check(i)) != null) {
        //                     return res;
        //                 }
        //             }
        //         }
        //     }
        //     if (check(item)) {
        //         console.log(item)
        //         process.exit(1)
        //     }
        // }
        if (hasError) {
            // Format the diagnostics with colors and context similar to `tsc`
            const formattedDiagnostics = ts.formatDiagnosticsWithColorAndContext(diagnosticsToShow, {
                getCurrentDirectory: () => process.cwd(),
                getCanonicalFileName: (fileName) => pathlib.resolve(fileName),
                getNewLine: () => '\n',
            });
            if (max_line_length === undefined) {
                console.error(formattedDiagnostics);
            }
            else {
                const split = formattedDiagnostics.split("\n");
                for (let i = 0; i < split.length; i++) {
                    if (!split[i].includes(" - \x1B[91merror\x1B[0m\x1B[90m TS") && split[i].length > max_line_length) {
                        split[i] = split[i].substr(0, max_line_length - 3) + "...";
                    }
                }
                console.error(split.join("\n"));
            }
            // Log error map.
            console.log(`\nErrors per file:`);
            for (const [path, errors] of Object.entries(error_map)) {
                console.log(` - ${path}: ${errors}`);
            }
            console.log("");
            // If errors were truncated, log a message indicating so
            if (error_limit != null && allDiagnostics.length > error_limit) {
                console.log(`Displayed the first ${error_limit} errors out of ${allDiagnostics.length}.`);
            }
            else {
                console.log(`Encountered ${allDiagnostics.length} errors.`);
            }
        }
        if (emitResult.emitSkipped || hasError) {
            console.log('TypeScript compilation failed.');
            return { success: false };
        }
        else {
            console.log('TypeScript compilation succeeded.');
            return { success: true };
        }
    },
    // Compile & bundle.
    async compile_and_bundle({ path: entry_path, // The path to the single file you want to compile and bundle
    types = [], tsconfig = {}, // TypeScript configuration object
    error_limit = 25, preprocess = undefined, enable_macros = true, platform = "browser", target = "ES2017", minify = false, }) {
        console.log("Bundling...");
        // Vars.
        const absolute_entry_path = pathlib.resolve(entry_path);
        const src_dir = pathlib.dirname(absolute_entry_path);
        const typescript_errors = [];
        // Parse and normalize ts config
        if (tsconfig.compiler_options) {
            tsconfig.compilerOptions = tsconfig.compiler_options;
        }
        tsconfig.compilerOptions ??= {};
        tsconfig.compilerOptions.target ??= target;
        tsconfig.compilerOptions.lib ??= [target, "DOM"];
        tsconfig.compilerOptions.strict ??= true;
        tsconfig.compilerOptions.noImplicitAny ??= false;
        tsconfig.compilerOptions.skipLibCheck ??= true;
        tsconfig.compilerOptions.declaration ??= true; // Enable declaration files
        tsconfig.compilerOptions.sourceMap ??= false; // Adjust as needed
        tsconfig.compilerOptions.experimentalDecorators ??= true; // Enable decorators
        tsconfig.compilerOptions.emitDecoratorMetadata ??= true; // Emit decorator metadata
        tsconfig.compilerOptions.importHelpers ??= true; // Use tslib helpers
        tsconfig.compilerOptions.moduleResolution ??= "node";
        tsconfig.compilerOptions.esModuleInterop ??= true;
        tsconfig.compilerOptions.forceConsistentCasingInFileNames ??= true;
        console.log('Compiler Options:', tsconfig.compilerOptions);
        // Validate entry file existence
        if (!fs.existsSync(absolute_entry_path)) {
            throw new Error(`Entry file not found: ${absolute_entry_path}`);
        }
        // Configure Rollup input options
        const input_options = {
            input: absolute_entry_path,
            onwarn(warning, warn) {
                if (warning.code === 'THIS_IS_UNDEFINED')
                    return; // Suppress specific warnings
                // Check if the warning is a TypeScript diagnostic
                typescript_errors.push(warning);
            },
            plugins: [
                preprocessPlugin({ preprocess, enable_macros }),
                resolve_plugin({
                    extensions: ['.js', '.ts', '.tsx'],
                    browser: platform === "browser",
                    preferBuiltins: platform === "node",
                }),
                commonjs_plugin(),
                // alias({
                //     entries: [
                //         // Define path aliases here if any
                //         // Example:
                //         // { find: '@modules', replacement: pathlib.resolve(__dirname, 'src/modules') },
                //     ]
                // }),
                typescript({
                    // tsconfig: path.resolve(src_dir, 'tsconfig.json'), // Path to your tsconfig.json
                    tsconfigOverride: {
                        compilerOptions: tsconfig.compilerOptions,
                        // {
                        //     target: target,
                        //     lib: [target, "DOM"],
                        //     declaration: true,
                        //     sourceMap: false,
                        //     experimentalDecorators: true,
                        //     emitDecoratorMetadata: true,
                        //     importHelpers: true,
                        //     moduleResolution: "node",
                        //     esModuleInterop: true,
                        //     forceConsistentCasingInFileNames: true,
                        // },
                    },
                    useTsconfigDeclarationDir: true,
                    clean: true,
                    abortOnError: false, // Handle errors manually
                }),
                minify ? terser() : null,
            ].filter(plugin => plugin !== null),
        };
        let bundled_code = '';
        // let bundle: rollup.RollupBuild;
        let bundle;
        console.log("Bundling...");
        try {
            // Create the Rollup bundle
            bundle = await rollup.rollup(input_options);
            console.log('Rollup bundle created.');
            // Generate the output in-memory
            console.log("Generating bundle...");
            const { output } = await bundle.generate({
                format: platform === "node" ? 'cjs' : 'esm',
                sourcemap: false,
            });
            console.log('Rollup bundle generated.');
            // Concatenate all chunks into a single string
            for (const chunk_or_asset of output) {
                if (chunk_or_asset.type === 'chunk') {
                    bundled_code += chunk_or_asset.code;
                }
                // Handle assets if necessary
            }
        }
        catch (error) {
            console.log("Encountered an error while bundling...");
            typescript_errors.push(error);
        }
        console.log("Closing bundle...");
        // Close the bundle
        if (bundle) {
            await bundle.close();
        }
        console.log("Finished bundling...");
        return {
            code: bundled_code,
            errors: typescript_errors,
            debug: function () {
                if (typescript_errors.length > 0) {
                    let max = Math.min(error_limit ?? typescript_errors.length, typescript_errors.length);
                    for (let i = 0; i < max; i++) {
                        if (typescript_errors[i] instanceof Error) {
                            console.error(typescript_errors[i]);
                        }
                        else {
                            console.error(typescript_errors[i].toString());
                        }
                    }
                    if (error_limit != null && typescript_errors.length > error_limit) {
                        console.log(`Displayed the first ${error_limit} errors out of ${typescript_errors.length}.`);
                    }
                    else {
                        console.log(`Encountered ${typescript_errors.length} errors.`);
                    }
                }
                else {
                    console.log("TypeScript compilation succeeded.");
                }
            },
        };
    }
    // async compile_and_bundle(
    //     {
    //         path: entry_path, // The path to the single file you want to compile and bundle
    //         types = [],
    //         ts_config = {}, // TypeScript configuration object
    //         error_limit = 25,
    //         preprocess = undefined,
    //         enable_macros = true,
    //         platform = "browser",
    //         target = "es2017",
    //         minify = false,
    //         detailed = true,
    //     }:
    //     {
    //         path: string,
    //         types: string[],
    //         ts_config?: Record<string, any>,
    //         error_limit?: null | number,
    //         max_line_length?: number,
    //         preprocess?: (name: string, data: string) => string | Promise<string>,
    //         enable_macros?: boolean,
    //         platform?: "browser" | "node",
    //         target?: string,
    //         minify?: boolean,
    //         detailed?: boolean,
    //     }
    // ): Promise<{ code: string, errors: string[], debug: () => void; }> {
    //     console.log("Bundling...")
    //     // Debug.
    //     const _compile_and_bundle_debug = (errors: string[], error_limit: null | number, total_error_count: null | number) => {
    //         return function(): void {
    //             if (errors) {
    //                 console.log(errors.join("\n"));
    //                 if (total_error_count != null && error_limit != null && total_error_count > error_limit) {
    //                     console.log(`Displayed the first ${error_limit} errors out of ${total_error_count}.`);
    //                 } else {
    //                     console.log(`Encountered ${total_error_count} errors.`);
    //                 }
    //             } else {
    //                 console.log("TypeScript compilation succeeded.");
    //             }
    //         }
    //     };
    //     // Vars.
    //     const absolute_entry_path = pathlib.resolve(entry_path);
    //     const src_dir = pathlib.dirname(absolute_entry_path);
    //     // Parse ts config.
    //     if (ts_config.compiler_options) {
    //         ts_config.compilerOptions = ts_config.compiler_options;
    //     }
    //     ts_config.compilerOptions ??= {};
    //     ts_config.compilerOptions.target ??= target;
    //     ts_config.compilerOptions.lib ??= [target, "dom"];
    //     ts_config.compilerOptions.strict ??= true;
    //     ts_config.compilerOptions.noImplicitAny ??= false;
    //     ts_config.compilerOptions.skipLibCheck ??= true;
    //     ts_config.compilerOptions.declaration ??= true;
    //     const {options: ts_config_compiler_options, errors} = ts.convertCompilerOptionsFromJson(
    //         ts_config.compilerOptions, // Only pass compilerOptions, as we're not using full tsconfig
    //         src_dir
    //     );
    //     if (errors.length > 0) {
    //         console.log(errors)
    //         throw new Error(`TypeScript config error: ${errors[0].messageText} [${errors[0].code}].`);
    //     }
    //     // Validate entry file existence
    //     if (!fs.existsSync(absolute_entry_path)) {
    //         throw new Error(`Entry file not found: ${absolute_entry_path}`);
    //     }
    //     // Initialize a map to store file contents
    //     const file_contents: Map<string, string> = new Map();
    //     // Recursively collects all TypeScript dependencies starting from the entry file.
    //     async function collect_dependencies(file_path: string) {
    //         const resolved_path = pathlib.resolve(file_path);
    //         if (file_contents.has(resolved_path)) {
    //             return; // Already processed
    //         }
    //         if (!fs.existsSync(resolved_path)) {
    //             throw new Error(`File not found: ${resolved_path}`);
    //         }
    //         let content = fs.readFileSync(resolved_path, 'utf-8');
    //         // Apply default preprocessing.
    //         content = tslib.preprocess(file_path, content);
    //         // Apply Macros
    //         if (enable_macros) {
    //             const [data, definitions] = tslib._extract_macro_statements(resolved_path, content);
    //             content = tslib._fill_macro_statements(resolved_path, data, definitions);
    //         }
    //         // Apply Preprocessing
    //         if (preprocess) {
    //             const relative_path = pathlib.relative(src_dir, resolved_path);
    //             let res = preprocess(relative_path, content);
    //             if (res instanceof Promise) {
    //                 res = await res;
    //             }
    //             if (typeof res === "string") {
    //                 content = res;
    //             }
    //         }
    //         file_contents.set(resolved_path, content);
    //         // Parse imports to collect dependencies
    //         const source_file = ts.createSourceFile(resolved_path, content, ts.ScriptTarget.ESNext, true);
    //         const import_promises: Promise<void>[] = [];
    //         ts.forEachChild(source_file, node => {
    //             if (ts.isImportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
    //                 const import_path = node.moduleSpecifier.text;
    //                 if (!import_path.startsWith('.')) {
    //                     // Non-relative import, skip (could be node_modules or absolute)
    //                     return;
    //                 }
    //                 const dir = pathlib.dirname(resolved_path);
    //                 const full_import_path = pathlib.resolve(dir, import_path);
    //                 let import_file = '';
    //                 if (fs.existsSync(full_import_path + '.ts')) {
    //                     import_file = full_import_path + '.ts';
    //                 } else if (fs.existsSync(full_import_path + '.tsx')) {
    //                     import_file = full_import_path + '.tsx';
    //                 } else if (fs.existsSync(full_import_path + '/index.ts')) {
    //                     import_file = pathlib.join(full_import_path, 'index.ts');
    //                 } else if (fs.existsSync(full_import_path + '/index.tsx')) {
    //                     import_file = pathlib.join(full_import_path, 'index.tsx');
    //                 } else {
    //                     throw new Error(`Cannot resolve import: ${import_path} in ${resolved_path}`);
    //                 }
    //                 // Recursively collect dependencies
    //                 import_promises.push(collect_dependencies(import_file));
    //             }
    //         });
    //         await Promise.all(import_promises);
    //     }
    //     console.log("Processing all files...")
    //     // Start collecting dependencies from the entry file
    //     await collect_dependencies(absolute_entry_path);
    //     console.log("File contents:", Array.from(file_contents.keys()));
    //     // Compile TypeScript in-memory to collect all errors
    //     const compiler_options: ts.CompilerOptions = {
    //         ...ts_config_compiler_options,
    //         skipLibCheck: true,
    //         // noEmit: true, // We only want to check for errors
    //     };
    //     // Initialize maps for transpiled JavaScript and source maps
    //     const transpiled_code: Map<string, string> = new Map();
    //     const transpiled_sourcemaps: Map<string, string> = new Map();
    //     console.log("Compiling...")
    //     const program = ts.createProgram({
    //         rootNames: [
    //             ...Array.from(file_contents.keys()),
    //             ...types,
    //         ],
    //         options: compiler_options,
    //         host: {
    //             // @v1.
    //             fileExists: ts.sys.fileExists,
    //             readFile: (fileName) => {
    //                 const resolved = pathlib.resolve(fileName);
    //                 return file_contents.get(resolved) || fs.readFileSync(resolved, 'utf-8');
    //             },
    //             // getSourceFile: (fileName, languageVersion) => {
    //             //     const resolved = pathlib.resolve(fileName);
    //             //     const source_text = file_contents.get(resolved) || fs.readFileSync(resolved, 'utf-8');
    //             //     return ts.createSourceFile(fileName, source_text, languageVersion, true);
    //             // },
    //             getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
    //             // writeFile: () => {
    //             //     // No-op
    //             // },
    //             getCurrentDirectory: () => src_dir,
    //             getDirectories: ts.sys.getDirectories,
    //             getCanonicalFileName: ts.sys.useCaseSensitiveFileNames
    //                 ? (fileName) => fileName
    //                 : (fileName) => fileName.toLowerCase(),
    //             useCaseSensitiveFileNames: () => ts.sys.useCaseSensitiveFileNames,
    //             getNewLine: () => ts.sys.newLine,
    //             // @v2.
    //             // ...ts.createCompilerHost(compiler_options),
    //             writeFile: (fileName, contents) => {
    //                 // console.log("Write", fileName)
    //                 if (fileName.endsWith('.js')) {
    //                     const original_ts_file = fileName.replace(/\.js$/, '.ts');
    //                     transpiled_code.set(pathlib.resolve(original_ts_file), contents);
    //                 } else if (fileName.endsWith('.js.map')) {
    //                     const original_ts_file = fileName.replace(/\.js\.map$/, '.ts');
    //                     transpiled_sourcemaps.set(pathlib.resolve(original_ts_file), contents);
    //                 }
    //             },
    //             getSourceFile: (fileName, languageVersion) => {
    //                 const resolved = pathlib.resolve(fileName);
    //                 if (file_contents.has(resolved)) {
    //                     const source_text = file_contents.get(resolved)!;
    //                     return ts.createSourceFile(fileName, source_text, languageVersion, true);
    //                 }
    //                 // Fallback to reading from disk
    //                 if (fs.existsSync(resolved)) {
    //                     const source_text = fs.readFileSync(resolved, 'utf-8');
    //                     return ts.createSourceFile(fileName, source_text, languageVersion, true);
    //                 }
    //                 return undefined;
    //             },
    //         }
    //     });
    //     const emit_result = program.emit();
    //     const all_diagnostics = ts.getPreEmitDiagnostics(program).concat(emit_result.diagnostics);
    //     console.log("Finished compiling...")
    //     // Format diagnostics
    //     const formatted_errors: string[] = all_diagnostics.map(diagnostic => {
    //         if (detailed) {
    //             return ts.formatDiagnosticsWithColorAndContext([diagnostic], {
    //                 getCurrentDirectory: () => process.cwd(),
    //                 getCanonicalFileName: (fileName) => pathlib.resolve(fileName),
    //                 getNewLine: () => '\n',
    //             });
    //         } else {
    //             let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    //             if (diagnostic.file && diagnostic.start !== undefined) {
    //                 const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    //                 const file_path = pathlib.relative(process.cwd(), diagnostic.file.fileName);
    //                 return `${file_path}:${line + 1}:${character + 1} - ${message}`;
    //             } else {
    //                 return `- ${message}`;
    //             }
    //         }
    //     });
    //     console.log("Checking errors...")
    //     // Apply error_limit
    //     const limited_errors = (error_limit !== null && error_limit !== undefined)
    //         ? formatted_errors.slice(0, error_limit)
    //         : formatted_errors;
    //     // If there are TypeScript errors, return them without bundling
    //     if (limited_errors.length > 0) {
    //         return {
    //             code: '',
    //             errors: limited_errors,
    //             debug: _compile_and_bundle_debug(limited_errors, error_limit, formatted_errors.length),
    //         };
    //     }
    //     console.log("Creating bundle configuration...")
    //     // Configure Rollup input options
    //     const input_options: rollup.RollupOptions = {
    //         input: absolute_entry_path,
    //         onwarn(warning, warn) {
    //             if (warning.code === 'THIS_IS_UNDEFINED') return; // Suppress specific warnings
    //             warn(warning); // Handle all other warnings normally
    //         },
    //         plugins: [
    //             {
    //                 name: 'virtual-files',
    //                 // @v1
    //                 // resolveId(source, importer) {
    //                 //     if (source.startsWith('.')) {
    //                 //         // Resolve relative paths
    //                 //         const resolved = pathlib.resolve(pathlib.dirname(importer || absolute_entry_path), source);
    //                 //         return resolved;
    //                 //     }
    //                 //     return null; // Let Rollup handle external modules
    //                 // },
    //                 // load(id) {
    //                 //     if (file_contents.has(id)) {
    //                 //         return file_contents.get(id);
    //                 //     }
    //                 //     return null; // Let Rollup handle external modules
    //                 // }
    //                 // @v2
    //                 resolveId(source, importer) {
    //                     console.log("Resolve", source)
    //                     if (source.startsWith('.')) {
    //                         // Resolve relative paths
    //                         const resolved = pathlib.resolve(pathlib.dirname(importer || absolute_entry_path), source);
    //                         return resolved;
    //                     }
    //                     return null; // Let Rollup handle external modules
    //                 },
    //                 load(id) {
    //                     console.log("Request", id)
    //                     if (transpiled_code.has(id)) {
    //                         const code = transpiled_code.get(id)!;
    //                         const map = transpiled_sourcemaps.get(id);
    //                         if (map) {
    //                             return {
    //                                 code: code,
    //                                 map: map,
    //                             };
    //                         }
    //                         return code;
    //                     }
    //                     return null; // Let Rollup handle external modules or files not transpiled
    //                 }
    //             },
    //             resolve_plugin({
    //                 extensions: ['.js', '.ts', '.tsx'],
    //                 browser: platform === "browser",
    //                 preferBuiltins: platform === "node",
    //             }),
    //             commonjs_plugin(),
    //             // typescript({
    //             //     tsconfigOverride: {
    //             //         compilerOptions: ts_config.compilerOptions,
    //             //         // compilerOptions: {
    //             //         //     module: 'ESNext',
    //             //         //     target: compiler_options.target as string | undefined,
    //             //         //     declaration: false,
    //             //         //     noEmit: false,
    //             //         // },
    //             //     },
    //             //     useTsconfigDeclarationDir: true,
    //             //     clean: true,
    //             //     // include: [entry_path, ...types],
    //             //     // include: [
    //             //     //     ...Array.from(file_contents.keys()),
    //             //     //     ...types,
    //             //     // ],
    //             //     // exclude: [
    //             //     //     // "node_modules",
    //             //     //     // "dist",
    //             //     // ]
    //             // }),
    //             // typescript_plugin({
    //             //     tsconfig: undefined, // Already compiled, skip tsconfig
    //             //     compilerOptions: {
    //             //         target: compiler_options.target as string | undefined,
    //             //         module: 'ESNext',
    //             //         sourceMap: false,
    //             //         inlineSources: false,
    //             //         allowNonTsExtensions: true,
    //             //     },
    //             //     include: [/\.tsx?$/],
    //             //     exclude: /node_modules/,
    //             //     transpileOnly: true, // Avoid type-checking since we've already done that
    //             // }),
    //             minify ? terser() : null,
    //         ].filter(plugin => plugin !== null),
    //     };
    //     let bundled_code = '';
    //     const bundling_errors: string[] = [];
    //     let bundle: any;
    //     console.log("Bundling...")
    //     try {
    //         // Create the Rollup bundle
    //         bundle = await rollup.rollup(input_options);
    //         // Generate the output in-memory
    //         console.log("Generating bundle...")
    //         const { output } = await bundle.generate({
    //             format: platform === "node" ? 'cjs' : 'esm',
    //             sourcemap: false,
    //         });
    //         // Concatenate all chunks into a single string
    //         console.log("Bundle:", bundle);
    //         console.log("Output", output);
    //         for (let i = 0; i < output.length; i++) {
    //             const chunk_or_asset = output[i];
    //             if (chunk_or_asset.type === 'chunk') {
    //                 bundled_code += chunk_or_asset.code;
    //             }
    //         }
    //     }
    //     // Capture Rollup and bundling-related errors
    //     catch (error: any) {
    //         console.log("Encountered an error while bundling...")
    //         if (error.loc) {
    //             bundling_errors.push(`${error.loc.file}:${error.loc.line}:${error.loc.column} - ${error.message}`);
    //         } else if (error.message) {
    //             bundling_errors.push(error.message);
    //         } else {
    //             bundling_errors.push(JSON.stringify(error));
    //         }
    //     }
    //     console.log("Closing bundle...")
    //     // Close the bundle
    //     if (bundle) {
    //         await bundle.close();
    //     }
    //     console.log("Finished bundling...")
    //     return {
    //         code: bundled_code,
    //         errors: bundling_errors,
    //         debug: _compile_and_bundle_debug(bundling_errors, error_limit, bundling_errors.length),
    //     };
    // },
};
import * as path from 'path';
export function preprocessPlugin(options = {}) {
    const { preprocess, enable_macros = true, include = /\.tsx?$/, exclude = /node_modules/ } = options;
    return {
        name: 'preprocess-plugin',
        async transform(code, id) {
            // Check if the file matches the include pattern and does not match the exclude pattern
            if ((include instanceof RegExp && !include.test(id)) ||
                (exclude instanceof RegExp && exclude.test(id))) {
                console.log("preprocessor: Skip file", id);
                return null; // do not transform.
            }
            else if (Array.isArray(include)) {
                let include_file = false;
                for (let i = 0; i < include.length; i++) {
                    if (include[i].test(id)) {
                        include_file = true;
                    }
                }
                if (!include_file) {
                    console.log("preprocessor: Skip file", id);
                    return null;
                }
            }
            else if (Array.isArray(exclude)) {
                for (let i = 0; i < exclude.length; i++) {
                    if (exclude[i].test(id)) {
                        console.log("preprocessor: Skip file", id);
                        return null;
                    }
                }
            }
            console.log("preprocessor: Process file", id);
            let processedCode = code;
            // Apply Macros
            if (enable_macros) {
                // Assuming tslib has the necessary macro functions
                // Replace with your actual macro processing logic
                const [data, definitions] = tslib._extract_macro_statements(id, processedCode);
                processedCode = tslib._fill_macro_statements(id, data, definitions);
            }
            // Apply Preprocessing
            if (preprocess) {
                const relative_path = path.relative(process.cwd(), id);
                let res = preprocess(relative_path, processedCode);
                if (res instanceof Promise) {
                    res = await res;
                }
                if (typeof res === "string") {
                    processedCode = res;
                }
            }
            return {
                code: processedCode,
                map: null, // Let other plugins handle source maps
            };
        },
        // resolveId(source, importer) {
        //     // This resolveId ensures that Rollup resolves internal modules correctly
        //     if (source.startsWith('.')) {
        //         // Resolve relative paths
        //         const resolved = path.resolve(path.dirname(importer || absolute_entry_path), source);
        //         return resolved;
        //     }
        //     return null; // Let Rollup handle external modules
        // },
    };
}
// const data = `
// ThemeV2.Text(
//     \`\`\`
//     Simply place a structured comment block above the structure you want to document.
//     \\\`\\\`\\\`
//     Set up a configuration file for your project to define essential details such as name, version, custom themes, action buttons, social media links, and more.
//         Keep me indented pleas
//         And me
//     Not me though
//     \`\`\`
// )
// .color(ThemeV2.fg_1)
// .font_size(20)
// .margin_bottom(10),
// ThemeV2.Text(
//     \`\`\`With text here it does not work.
//     This must be indented as well
//     \`\`\`
// )
// `
// console.log(tslib.preprocess("example.ts", data));
// process.exit(1)
// Check if the current file is the main module
if (require.main === module) {
    // Testing.
    // tslib.compile_and_bundle({
    //     path: `/Users/administrator/persistance/private/dev/libris/libris/core/frontend/home/home.js`,
    // })
    // .then(console.log)
    // .catch(console.error)
    // process.exit(1)
    // CLI.
    let source = "", error_limit = 25, debug_single_file = false, target_file = undefined;
    for (let i = 0; i < process.argv.length; i++) {
        if (process.argv[i] === "--source") {
            source = process.argv[i + 1] ?? "";
            ++i;
        }
        else if (process.argv[i] === "--error-limit") {
            error_limit = parseInt(process.argv[i + 1]);
            if (isNaN(error_limit)) {
                error_limit = undefined;
            }
            ++i;
        }
        else if (process.argv[i] === "--target-file") {
            target_file = process.argv[i + 1];
            ++i;
        }
        else if (process.argv[i] === "--debug-single-file") {
            debug_single_file = true;
        }
    }
    if (source === "") {
        throw new Error("Define argument --source.");
    }
    tslib.compile_cli({
        source,
        debug: { error_limit, debug_single_file, target_file }
    });
}
// const data = `
// #include <stdio.h>
// #macro MAX_SIZE 1024
// #macro MIN_VALUE 0
// #macro PI 3.14159
// #macro DEBUG
// #macro MULTI_LINE_MACRO(a, b) \\
//     ((a) > (b) ? (a) : (b))
// #macro MyMacro(myfuncname) myfuncname(first_name: string) { \\
//     return \`Hello \${first_name}!\` \\
// }
// MyMacro("mefunc1")
// #MyMacro(mefunc2)
// MyMacro(mefunc3)
// #macro ForwardFuncToImg(attr_name, type) \\
//     attr_name(): type; \\
//     attr_name(value: type): this; \\
//     attr_name(value?: type): this | type { if (value == null) { return this.image.attr_name(); } this.image.attr_name(value); return this; }
// #ForwardFuncToImg(src, string)
// int main() {
//     // code here
//     const int valid_size = 0 <= MAX_SIZE;
//     return 0;
// }
// `;
// const [d, definitions] = tslib._extract_macro_statements("test.ts", data);
// // console.log(d)
// console.log(definitions);
// console.log("============\n"+tslib._fill_macro_statements("test.ts", d, definitions));
// process.exit(1)
// Exports.
module.exports = tslib;
