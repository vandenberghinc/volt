"use strict";
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
exports.bundle = bundle;
const fs = __importStar(require("fs"));
const ts = __importStar(require("typescript"));
const esbuild = __importStar(require("esbuild"));
const path = __importStar(require("path"));
const Preprocessing = require("./preprocessing.js");
/**
 * Bundles TypeScript code into a single JavaScript file in-memory.
 * @param main_entry_path The main entry point TypeScript file path.
 * @param additional_entry_paths Optional array of additional entry point TypeScript file paths.
 * @param options Optional bundling options.
 * @returns A promise that resolves to the bundling result containing code, errors, and source_map.
 */
async function bundle(options) {
    let { entry_path, additional_entry_paths = [], error_limit = 25, platform = 'node', target = "ES2023", format, minify = false, sourcemap = false, tsconfig = {}, preprocess, } = options;
    // Validate format based on platform
    const valid_formats = {
        browser: ['iife', 'umd'],
        node: ['cjs', 'esm'],
    };
    const resolved_format = format
        ? format
        : platform === 'browser'
            ? 'iife'
            : 'cjs';
    if (!valid_formats[platform].includes(resolved_format)) {
        throw new Error(`Invalid format '${resolved_format}' for platform '${platform}'. ` +
            `Valid formats: ${valid_formats[platform].join(', ')}.`);
    }
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
    // Output errors.
    const errors = [];
    // Resolve absolute paths
    const all_entry_paths = [entry_path, ...additional_entry_paths].map((file_path) => {
        if (path.isAbsolute(file_path)) {
            return file_path;
        }
        return path.resolve(process.cwd(), file_path);
    });
    // Initialize virtual files.
    const virtual_files = {};
    // Load ts config.
    tsconfig.compilerOptions ??= {};
    tsconfig.compilerOptions.moduleResolution ??= "node";
    tsconfig.compilerOptions.module = "esnext";
    tsconfig.compilerOptions.sourceMap = sourcemap;
    tsconfig.compilerOptions.outDir = undefined;
    tsconfig.compilerOptions.target ??= target;
    tsconfig.compilerOptions.lib ??= [target, "DOM"];
    tsconfig.compilerOptions.strict ??= true;
    tsconfig.compilerOptions.noImplicitAny ??= false;
    tsconfig.compilerOptions.skipLibCheck ??= true;
    tsconfig.compilerOptions.declaration ??= true; // Enable declaration files
    tsconfig.compilerOptions.experimentalDecorators ??= true; // Enable decorators
    tsconfig.compilerOptions.emitDecoratorMetadata ??= true; // Emit decorator metadata
    const parsed_ts_config = ts.parseJsonConfigFileContent(tsconfig, ts.sys, process.cwd());
    if (parsed_ts_config.errors.length > 0) {
        parsed_ts_config.errors.forEach(error => {
            errors.push(`tsconfig error: ${ts.flattenDiagnosticMessageText(error.messageText, '\n')}`);
        });
        console.log("errors 0");
        return {
            code: undefined,
            errors,
            source_map: undefined,
            debug: add_debug(errors),
        };
    }
    console.log(parsed_ts_config);
    // Asynchronously preprocess all TypeScript files
    const processed_files = {};
    const source_files = ts.createProgram({
        rootNames: all_entry_paths,
        options: parsed_ts_config.options,
    }).getSourceFiles().filter(sf => !sf.isDeclarationFile);
    for (const sourceFile of source_files) {
        const file_path = sourceFile.fileName;
        let content = "";
        try {
            content = await fs.promises.readFile(file_path, 'utf-8');
        }
        catch (err) {
            errors.push(`Error reading file ${file_path}: ${err.message}`);
            continue;
        }
        // Apply preprocessing.
        try {
            content = Preprocessing.preprocess(file_path, content, {
                macros: true,
            });
            // User defined preprocessing.
            if (preprocess) {
                let res = preprocess(file_path, content);
                if (res instanceof Promise) {
                    res = await res;
                }
                if (typeof res === "string") {
                    content = res;
                }
                // console.log(content);
                // process.exit(1)
            }
            // Extract source files again since auto-import might have been added.
        }
        catch (err) {
            err.message = `Encountered an error while preprocessing file ${file_path}: ${err.message}`;
            errors.push(err);
            continue;
        }
        processed_files[file_path] = content;
    }
    if (errors.length > 0) {
        return {
            code: '',
            errors,
            source_map: undefined,
            debug: add_debug(errors),
        };
    }
    // const program = ts.createProgram(all_entry_paths, compiler_options, compiler_host);
    const program = ts.createProgram({
        rootNames: all_entry_paths,
        options: parsed_ts_config.options,
        host: {
            fileExists: (file_path) => {
                return processed_files.hasOwnProperty(file_path) || ts.sys.fileExists(file_path);
            },
            directoryExists: ts.sys.directoryExists,
            getCurrentDirectory: ts.sys.getCurrentDirectory,
            getDirectories: ts.sys.getDirectories,
            getCanonicalFileName: (file_path) => {
                return ts.sys.useCaseSensitiveFileNames ? file_path : file_path.toLowerCase();
            },
            getNewLine: () => {
                return ts.sys.newLine;
            },
            getDefaultLibFileName: (options) => {
                return ts.getDefaultLibFilePath(options);
            },
            getSourceFile(file_path, language_version) {
                let sourceText = "";
                // Attempt to retrieve processed content
                if (processed_files[file_path]) {
                    sourceText = processed_files[file_path];
                }
                else if (ts.sys.fileExists(file_path)) {
                    try {
                        sourceText = ts.sys.readFile(file_path);
                    }
                    catch (err) {
                        errors.push(`Error reading file ${file_path}: ${err.message}`);
                        return undefined;
                    }
                }
                else {
                    errors.push(`File not found: ${file_path}`);
                    return undefined;
                }
                // Create SourceFile from sourceText
                const sourceFile = ts.createSourceFile(file_path, sourceText, language_version, true);
                // Transforms import paths to include .js extensions where necessary.
                function addJsExtensions(sourceFile) {
                    const transformerFactory = context => {
                        const visit = node => {
                            // Handle Import Declarations
                            if (ts.isImportDeclaration(node)) {
                                const moduleSpecifier = node.moduleSpecifier;
                                if (ts.isStringLiteral(moduleSpecifier)) {
                                    const importPath = moduleSpecifier.text;
                                    // Check if it's a relative path without extension
                                    if ((importPath.startsWith('./') || importPath.startsWith('../')) &&
                                        !path.extname(importPath)) {
                                        const newPath = `${importPath}.js`;
                                        return ts.factory.updateImportDeclaration(node, 
                                        /* decorators */ undefined, // No decorators
                                        undefined, //node.modifiers,
                                        node.importClause, ts.factory.createStringLiteral(newPath));
                                    }
                                }
                            }
                            // Handle Dynamic Imports
                            if (ts.isCallExpression(node) &&
                                node.expression.kind === ts.SyntaxKind.ImportKeyword) {
                                const [arg] = node.arguments;
                                if (ts.isStringLiteral(arg)) {
                                    const importPath = arg.text;
                                    if ((importPath.startsWith('./') || importPath.startsWith('../')) &&
                                        !path.extname(importPath)) {
                                        const newPath = `${importPath}.js`;
                                        return ts.factory.updateCallExpression(node, node.expression, node.typeArguments, [ts.factory.createStringLiteral(newPath)]);
                                    }
                                }
                            }
                            // Continue traversing the AST
                            return ts.visitEachChild(node, visit, context);
                        };
                        return node => {
                            const result = ts.visitNode(node, visit);
                            // Ensure the returned node is a SourceFile
                            if (!ts.isSourceFile(result)) {
                                throw new Error('Transformed node is not a SourceFile.');
                            }
                            return result;
                        };
                    };
                    const result = ts.transform(sourceFile, [transformerFactory]);
                    const transformedSourceFile = result.transformed[0];
                    const printer = ts.createPrinter();
                    const newSource = printer.printFile(transformedSourceFile);
                    result.dispose();
                    return newSource;
                }
                // Apply the transformation
                const transformedSource = addJsExtensions(sourceFile);
                // Create and return the transformed SourceFile
                return ts.createSourceFile(file_path, transformedSource, language_version, true);
            },
            readFile: (file_path) => {
                // console.log("readFile:",file_path, processed_files[file_path] === undefined)
                if (processed_files[file_path]) {
                    return processed_files[file_path];
                }
                return ts.sys.readFile(file_path);
            },
            useCaseSensitiveFileNames: () => {
                return ts.sys.useCaseSensitiveFileNames;
            },
            writeFile: (file_path, content) => {
                // Store transpiled JavaScript in virtual_files
                virtual_files[file_path] = content;
            },
        },
    });
    // Transpile TypeScript to JavaScript using the custom CompilerHost
    const emit_result = program.emit();
    const all_diagnostics = ts.getPreEmitDiagnostics(program).concat(emit_result.diagnostics);
    if (all_diagnostics.length > 0) {
        const diagnostic_messages = all_diagnostics.map(diagnostic => {
            return ts.formatDiagnosticsWithColorAndContext([diagnostic], {
                getCurrentDirectory: () => process.cwd(),
                getCanonicalFileName: (file_name) => path.resolve(file_name),
                getNewLine: () => '\n',
            });
            // if (diagnostic.file && diagnostic.start !== undefined) {
            //     const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
            //     const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
            //     return `${diagnostic.file.file_name} (${line + 1},${character + 1}): ${message}`;
            // } else {
            //     return ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
            // }
        });
        console.log("errors 2");
        return {
            code: undefined,
            errors: diagnostic_messages,
            source_map: undefined,
            debug: add_debug(diagnostic_messages),
        };
    }
    if (errors.length > 0) {
        console.log("errors 3");
        return {
            code: undefined,
            errors,
            source_map: undefined,
            debug: add_debug(errors),
        };
    }
    // Bundle using esbuild
    try {
        console.log("ESBuild Entry points:", all_entry_paths.map(p => p.endsWith('.ts') ? p.slice(0, -2) + 'js' : p));
        const esbuild_result = await esbuild.build({
            entryPoints: all_entry_paths.map(p => p.endsWith('.ts') ? p.slice(0, -2) + 'js' : p),
            bundle: true,
            write: false,
            platform: platform,
            format: resolved_format,
            minify: minify,
            sourcemap: sourcemap,
            plugins: [{
                    name: 'virtual-files',
                    setup(build) {
                        build.onResolve({ filter: /.*/ }, args => {
                            console.log("onResolve", args);
                            let resolved_path;
                            // if (path.isAbsolute(args.path+".js")) {
                            //     resolved_path = path.resolve(path.dirname(args.importer || ''), args.path+".js");
                            // } else {
                            resolved_path = path.isAbsolute(args.path) ? args.path : path.resolve(path.dirname(args.importer || ''), args.path);
                            // }
                            if (virtual_files[resolved_path]) {
                                return {
                                    path: resolved_path,
                                    namespace: 'virtual',
                                    // resolveDir: path.dirname(resolved_path)
                                };
                            }
                            return null;
                        });
                        build.onLoad({ filter: /.*/, namespace: 'virtual' }, args => {
                            console.log("onLoad", args);
                            return {
                                contents: virtual_files[args.path],
                                loader: 'js',
                            };
                        });
                    },
                }],
            loader: {
                '.js': 'js',
                '.jsx': 'jsx',
                '.json': 'json',
            },
            // Since TypeScript is already transpiled, we don't need to handle it here
            tsconfig: undefined,
        });
        let bundled_code = '';
        let source_map = undefined;
        console.log("Output files count:", esbuild_result);
        if (esbuild_result.outputFiles) {
            for (const output_file of esbuild_result.outputFiles) {
                if (output_file.path.endsWith('.map')) {
                    source_map = output_file.text;
                }
                else {
                    bundled_code = output_file.text;
                }
            }
        }
        console.log("errors 4");
        return {
            code: bundled_code,
            errors,
            source_map,
            debug: add_debug(errors),
        };
    }
    catch (error) {
        errors.push(`esbuild bundling error: ${error.message || error}`);
        console.log("errors 5");
        return {
            code: undefined,
            errors,
            source_map: undefined,
            debug: add_debug(errors),
        };
    }
}
