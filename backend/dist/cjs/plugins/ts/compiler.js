var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  bundle: () => bundle,
  compile: () => compile,
  default: () => stdin_default
});
module.exports = __toCommonJS(stdin_exports);
var pathlib = __toESM(require("path"));
var fs = __toESM(require("fs"));
var ts = __toESM(require("typescript"));
var esbuild = __toESM(require("esbuild"));
var import_url = require("url");
var import_path = require("path");
var import_vinc = require("../../vinc.js");
var Preprocessing = __toESM(require("./preprocessing.js"));
const import_meta = {};
var __dirname = typeof __dirname !== "undefined" ? __dirname : (0, import_path.dirname)((0, import_url.fileURLToPath)(new URL("./package.json", import_meta.url)));
function resolve_path(path) {
  path = pathlib.resolve(path);
  if (process.platform === "darwin" && path.startsWith("/private/tmp/")) {
    path = path.slice(8);
  }
  return path;
}
[];
function format_ts_error(diagnostic) {
  let line, column;
  if (diagnostic.file && diagnostic.start !== void 0) {
    const res = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    if (res.line !== void 0) {
      line = res.line + 1;
    }
    if (res.character !== void 0) {
      column = res.character + 1;
    }
  }
  return {
    data: ts.formatDiagnosticsWithColorAndContext([diagnostic], {
      getCurrentDirectory: () => process.cwd(),
      getCanonicalFileName: (file_name) => pathlib.resolve(file_name),
      getNewLine: () => "\n"
    }),
    file_name: diagnostic.file === void 0 ? void 0 : pathlib.resolve(diagnostic.file.resolvedPath),
    line,
    column
  };
}
async function compile(options) {
  let { entry_paths = [], include = [], exclude = [], output, error_limit = 25, compiler_opts = {}, preprocess, exact_files = false, file_by_file = false, watch, extract_exports, debug_file, templates = void 0 } = options;
  if (entry_paths.length > 0) {
    include = include.concat(entry_paths);
  }
  if (watch === void 0 || typeof watch === "boolean") {
    watch = {
      enabled: watch ?? false,
      log_level: 1,
      on_change: void 0
    };
  }
  const { enabled: watch_enabled = false, log_level: watch_log_level = 1 } = watch;
  let import_order;
  const compile_result = {
    inputs: [],
    outputs: [],
    errors: [],
    debug(_watch = false) {
      if (import_order !== void 0) {
        this.errors.sort((a, b) => {
          const orderA = a.file_name ? import_order.get(a.file_name) ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
          const orderB = b.file_name ? import_order.get(b.file_name) ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
          if (orderA !== orderB) {
            return orderA - orderB;
          }
          return 0;
        });
      }
      let last_file, dumped = 0, file_names = /* @__PURE__ */ new Set();
      for (let i = 0; i < this.errors.length; i++) {
        if (debug_file == null && !file_by_file) {
          console.error(this.errors[i].data);
          ++dumped;
        } else if (debug_file !== void 0 && this.errors[i].file_name?.toLowerCase() === debug_file.toLowerCase()) {
          console.error(this.errors[i].data);
          ++dumped;
        } else if (file_by_file) {
          if (last_file !== void 0 && this.errors[i].file_name !== last_file) {
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
      if (this.errors.length > 0 && debug_file !== void 0 && dumped === 0) {
        console.error(`${import_vinc.vlib.Color.yellow("warning")}: Did not find any files matching "${debug_file}". Valid file names: ${JSON.stringify(Array.from(file_names), null, 4)}`);
      }
      if (this.errors.length > 0) {
        const error_map = {};
        for (const err of this.errors) {
          if (err.file_name) {
            if (error_map[err.file_name] === void 0) {
              error_map[err.file_name] = 0;
            }
            error_map[err.file_name] += 1;
          }
        }
        console.log(`
Errors per file:`);
        for (const [file_path, error_count] of Object.entries(error_map)) {
          console.log(` - ${file_path}: ${error_count}`);
        }
        console.log("");
      }
      if (error_limit != null && this.errors.length > error_limit) {
        console.log(`Displayed the first ${error_limit} errors out of ${this.errors.length}.`);
      } else {
        console.log(`Encountered ${this.errors.length} errors.`);
      }
      if (this.outputs.length > 0) {
        console.log(`Compiled ${this.outputs.length} output files.`);
      }
    },
    exports: {}
  };
  let diagnostics = [];
  const processed_files = {};
  if (exact_files) {
    for (let i = 0; i < include.length; i++) {
      const current_path = new import_vinc.vlib.Path(include[i]);
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
  const tsconfig = {
    compilerOptions: {
      ...compiler_opts,
      outDir: output,
      declaration: compiler_opts.declaration === true ? true : false,
      declarationDir: compiler_opts.declaration === true ? output : void 0
      // Add other default compiler options as needed
    },
    include,
    exclude
  };
  if (watch.enabled) {
    tsconfig.compilerOptions.incremental = true;
    tsconfig.compilerOptions.tsBuildInfoFile = output + "/.tsbuildinfo";
  }
  tsconfig.compilerOptions.paths ??= {};
  tsconfig.compilerOptions.paths["volt"] = [new import_vinc.vlib.Path(__dirname + "../../../../../../frontend/dist/volt.js").abs().str()];
  tsconfig.compilerOptions.paths["volt/*"] = [new import_vinc.vlib.Path(__dirname + "../../../../../../frontend/dist/").abs().str() + "/*"];
  const parsed_tsconfig = ts.parseJsonConfigFileContent(tsconfig, ts.sys, "./");
  if (parsed_tsconfig.errors.length > 0) {
    parsed_tsconfig.errors.forEach((error) => {
      const message = ts.flattenDiagnosticMessageText(error.messageText, "\n");
      compile_result.errors.push({
        data: `TSConfig error: ${message}`
      });
    });
    return compile_result;
  }
  if (watch_enabled) {
    const virtual_tsconfig_path = pathlib.resolve("tsconfig.virtual.json");
    const written_files = /* @__PURE__ */ new Map();
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
        const resolved_file = pathlib.resolve(file_name);
        if (resolved_file === virtual_tsconfig_path) {
          return JSON.stringify(tsconfig, null, 4);
        }
        if (exact_files && !entry_paths.includes(resolved_file)) {
          return void 0;
        }
        if (!fs.existsSync(resolved_file)) {
          return void 0;
        }
        let source_code = fs.readFileSync(resolved_file, "utf-8");
        if (!resolved_file.endsWith(".d.ts") && (resolved_file.endsWith(".js") || resolved_file.endsWith(".ts"))) {
          source_code = Preprocessing.preprocess(resolved_file, source_code, { macros: true, templates });
          if (preprocess) {
            const preprocessed = preprocess(resolved_file, source_code);
            if (preprocessed instanceof Promise) {
              throw new Error("Asynchronous preprocessing is not supported in watch mode.");
            }
            if (typeof preprocessed === "string") {
              source_code = preprocessed;
            }
          }
        }
        return source_code;
      },
      writeFile: (file_name, data, write_byte_order_mark, on_error, source_files2) => {
        file_name = pathlib.resolve(file_name);
        if (written_files.has(file_name) && written_files.get(file_name) === data) {
          return;
        }
        if (watch_log_level >= 1) {
          console.log(`ts-watcher: ${import_vinc.vlib.Color.purple("message")} Writing out file ${file_name}.`);
        }
        ts.sys.writeFile(file_name, data, write_byte_order_mark);
        written_files.set(file_name, data);
        if (typeof watch === "object" && typeof watch.on_change === "function" && file_name.endsWith(".js")) {
          watch.on_change(resolve_path(file_name));
        }
      }
    };
    const host = ts.createWatchCompilerHost(
      virtual_tsconfig_path,
      // Use virtual tsconfig path
      void 0,
      // Override compiler options if needed
      custom_ts_sys,
      ts.createEmitAndSemanticDiagnosticsBuilderProgram,
      // ts.createSemanticDiagnosticsBuilderProgram,
      // reportDiagnostic callback
      (diagnostic) => {
        compile_result.errors.push(format_ts_error(diagnostic));
      },
      // reportWatchStatusChanged callback
      (diagnostic) => {
        if (diagnostic.code === 6194) {
          if (import_order === void 0) {
            const interval = setInterval(() => {
              if (import_order !== void 0) {
                compile_result.debug();
                compile_result.errors = [];
                clearInterval(interval);
              }
            }, 100);
          } else {
            if (compile_result.errors.length > 0) {
              compile_result.debug();
            }
            compile_result.errors = [];
          }
        }
        if (watch_log_level <= 0 && diagnostic.category === 3) {
          return;
        }
        const message = ts.formatDiagnosticsWithColorAndContext([diagnostic], {
          getCurrentDirectory: () => process.cwd(),
          getCanonicalFileName: (file_name) => pathlib.resolve(file_name),
          getNewLine: () => "\n"
        });
        console.log("ts-watcher:", message.trimEnd());
      }
    );
    const program2 = ts.createWatchProgram(host);
    import_order = /* @__PURE__ */ new Map();
    const source_files = program2.getProgram().getSourceFiles();
    for (let i = 0; i < source_files.length; i++) {
      const source = source_files[i];
      const file_name = pathlib.resolve(source.fileName).toLowerCase();
      if (!import_order.has(file_name)) {
        import_order.set(file_name, i);
      }
    }
    compile_result.stop = () => {
      program2.close();
      console.log("ts-watcher:", "Stopped watching.");
    };
    return compile_result;
  }
  const initial_program = ts.createProgram({
    rootNames: parsed_tsconfig.fileNames,
    options: parsed_tsconfig.options
  });
  const program_source_files = initial_program.getSourceFiles();
  const all_source_files = program_source_files.filter((sf) => !sf.isDeclarationFile);
  if (all_source_files.length === 0) {
    compile_result.errors.push({ data: "No source files were found. Please check your entry paths." });
    return compile_result;
  }
  if (extract_exports) {
    const checker = initial_program.getTypeChecker();
    for (let i = 0; i < program_source_files.length; i++) {
      const source = program_source_files[i];
      if (source.isDeclarationFile)
        continue;
      const symbol = checker.getSymbolAtLocation(source);
      if (symbol) {
        if (compile_result.exports[source.fileName] === void 0) {
          compile_result.exports[source.fileName] = [];
        }
        const list = compile_result.exports[source.fileName];
        const exports2 = checker.getExportsOfModule(symbol);
        for (const exp of exports2) {
          const name = exp.getName();
          if (name !== "default") {
            list.push(name);
          }
        }
      }
    }
  }
  for (let i = 0; i < all_source_files.length; i++) {
    const source_file = all_source_files[i];
    const file_name = pathlib.resolve(source_file.fileName);
    compile_result.inputs.push(file_name);
    if (exact_files && !entry_paths.includes(file_name)) {
      continue;
    }
    processed_files[file_name] = Preprocessing.preprocess(file_name, source_file.text, { macros: true, templates });
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
  const file_exists_cache = /* @__PURE__ */ new Map();
  const compiler_host = {
    fileExists: (file_name) => {
      const resolved_file = pathlib.resolve(file_name);
      if (processed_files[resolved_file]) {
        return true;
      } else if (file_exists_cache.has(resolved_file)) {
        return file_exists_cache.get(resolved_file);
      }
      const res = fs.existsSync(resolved_file);
      file_exists_cache.set(resolved_file, res);
      return res;
    },
    directoryExists: ts.sys.directoryExists,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getDirectories: ts.sys.getDirectories,
    getCanonicalFileName: ts.sys.useCaseSensitiveFileNames ? (file_name) => file_name : (file_name) => file_name.toLowerCase(),
    getNewLine: () => ts.sys.newLine,
    getDefaultLibFileName: (options2) => ts.getDefaultLibFilePath(options2),
    getSourceFile: (file_name, language_version, on_error) => {
      const resolved_file = pathlib.resolve(file_name);
      if (processed_files[resolved_file]) {
        return ts.createSourceFile(resolved_file, processed_files[resolved_file], language_version, true);
      }
      if (exact_files && !entry_paths.includes(resolved_file)) {
        return void 0;
      }
      if (!fs.existsSync(resolved_file)) {
        if (on_error)
          on_error(`File not found: ${resolved_file}`);
        return void 0;
      }
      const source_code = fs.readFileSync(resolved_file, "utf-8");
      return ts.createSourceFile(resolved_file, source_code, language_version, true);
    },
    readFile: (file_name) => {
      const resolved_file = pathlib.resolve(file_name);
      if (processed_files[resolved_file]) {
        return processed_files[resolved_file];
      }
      if (exact_files && !entry_paths.includes(resolved_file)) {
        return void 0;
      }
      return fs.readFileSync(resolved_file, "utf-8");
    },
    useCaseSensitiveFileNames: () => ts.sys.useCaseSensitiveFileNames,
    writeFile: (file_name, data, write_byte_order_mark, on_error, source_files) => {
      compile_result.outputs.push(file_name);
      if (file_name.endsWith(".js")) {
        const paths = parsed_tsconfig.options.paths || {};
        const baseUrl = parsed_tsconfig.options.baseUrl || "./";
        const transformed = data.replace(/(import|export)(\s+(?:\*\s+as\s+[^,}\s]+|\{[^}]*\}|[^,}\s]+)(?:\s*,\s*(?:\*\s+as\s+[^,}\s]+|\{[^}]*\}|[^,}\s]+))*\s+from\s+["'])([^"']+)(["'])/g, (match, importType, importDetails, importPath, quote) => {
          for (const [alias, targets] of Object.entries(paths)) {
            if (importPath === alias || importPath.startsWith(alias + "/")) {
              const target = targets[0];
              const from = pathlib.dirname(file_name);
              const to = pathlib.resolve(pathlib.dirname(baseUrl), target);
              const relativePath = pathlib.relative(from, to);
              const finalPath = relativePath.startsWith(".") ? relativePath : "./" + relativePath;
              return `${importType}${importDetails}${finalPath}${quote}`;
            }
          }
          return match;
        });
        ts.sys.writeFile(file_name, transformed, write_byte_order_mark);
      } else {
        ts.sys.writeFile(file_name, data, write_byte_order_mark);
      }
    },
    resolveModuleNames: (moduleNames, containingFile) => {
      const matchPath = createMatchPath(parsed_tsconfig.options.paths || {});
      return moduleNames.map((moduleName) => {
        const matchedPath = matchPath(moduleName);
        if (matchedPath) {
          return {
            resolvedFileName: matchedPath,
            isExternalLibraryImport: false,
            extension: pathlib.extname(matchedPath)
          };
        }
        const result = ts.resolveModuleName(moduleName, containingFile, parsed_tsconfig.options, {
          fileExists: compiler_host.fileExists,
          readFile: compiler_host.readFile
        });
        return result.resolvedModule;
      });
    }
  };
  function createMatchPath(patterns) {
    const matchers = Object.entries(patterns).map(([prefix, paths]) => ({
      prefix: prefix.endsWith("/*") ? prefix.slice(0, -2) : prefix,
      paths: paths.map((p) => p.endsWith("/*") ? p.slice(0, -2) : p)
    }));
    return (moduleName) => {
      for (const { prefix, paths } of matchers) {
        if (moduleName.startsWith(prefix)) {
          const suffix = moduleName.slice(prefix.length);
          for (const path of paths) {
            const fullPath = path + suffix;
            for (const ext of [".ts", ".tsx", "", ".js"]) {
              const attemptPath = fullPath + ext;
              if (ts.sys.fileExists(attemptPath)) {
                return attemptPath;
              }
            }
          }
        }
      }
      return void 0;
    };
  }
  const program = ts.createProgram({
    rootNames: parsed_tsconfig.fileNames,
    options: parsed_tsconfig.options,
    host: compiler_host
  });
  const emit_result = program.emit();
  diagnostics = ts.getPreEmitDiagnostics(program).concat(emit_result.diagnostics);
  for (let i = 0; i < diagnostics.length; i++) {
    compile_result.errors.push(format_ts_error(diagnostics[i]));
  }
  return compile_result;
}
;
const format_esbuild_warning_error = (warning) => {
  let output;
  if (warning.location) {
    const trimmed_line = warning.location.lineText.trimStart();
    const removed_start_indent = warning.location.lineText.length - trimmed_line.length;
    output = `${import_vinc.vlib.Color.cyan(warning.location.file)}:${import_vinc.vlib.Color.yellow(warning.location.line)}:${import_vinc.vlib.Color.yellow(warning.location.column)} - ${import_vinc.vlib.Color.yellow("warning")} [esbuild${warning.id === "" ? "" : `-${warning.id}`}]: ${warning.text}

` + import_vinc.vlib.Colors.bright_bg.white + import_vinc.vlib.Colors.black + warning.location.line + import_vinc.vlib.Colors.end + "    " + trimmed_line + "\n" + import_vinc.vlib.Colors.bright_bg.white + import_vinc.vlib.Colors.black + " ".repeat(warning.location.line.toString().length) + import_vinc.vlib.Colors.end + " ".repeat(4 + warning.location.column - removed_start_indent) + import_vinc.vlib.Color.red("~".repeat(warning.location.length));
  } else {
    output = `${import_vinc.vlib.Color.yellow("warning")} [esbuild${warning.id === "" ? "" : `-${warning.id}`}]: ${warning.text}`;
  }
  if (Array.isArray(warning.notes)) {
    for (const note of warning.notes) {
      if (note.location) {
        const trimmed_line = note.location.lineText.trimStart();
        const removed_start_indent = note.location.lineText.length - trimmed_line.length;
        output += `
    ${import_vinc.vlib.Color.cyan(note.location.file)}:${import_vinc.vlib.Color.yellow(note.location.line)}:${import_vinc.vlib.Color.yellow(note.location.column)} - ${import_vinc.vlib.Color.gray("note")}: ${note.text}

` + import_vinc.vlib.Colors.bright_bg.white + import_vinc.vlib.Colors.black + note.location.line + import_vinc.vlib.Colors.end + "        " + trimmed_line + "\n" + import_vinc.vlib.Colors.bright_bg.white + import_vinc.vlib.Colors.black + " ".repeat(note.location.line.toString().length) + import_vinc.vlib.Colors.end + " ".repeat(8 + note.location.column - removed_start_indent) + import_vinc.vlib.Color.red("~".repeat(note.location.length));
      } else {
        output += `
    ${import_vinc.vlib.Color.gray("note")}: ${note.text}`;
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
    column: warning.location?.column
  };
};
async function bundle(options) {
  let {
    entry_paths = [],
    include = [],
    externals = [],
    output = void 0,
    platform = "browser",
    format = "iife",
    target = "es2021",
    minify = false,
    sourcemap = false,
    // 'inline'
    error_limit = 25,
    extract_inputs = false,
    tree_shaking = void 0,
    debug = false,
    bundler = "esbuild",
    opts = {},
    postprocess = void 0,
    log_level = 0,
    analyze = false
  } = options;
  if (entry_paths.length > 0) {
    include = include.concat(entry_paths);
  }
  const errors = [];
  let bundled_code = void 0;
  let bundled_source_map = void 0;
  let inputs = [];
  const outfile = !output || typeof output === "string" ? output : output[0];
  const x = false;
  if (bundler === "esbuild") {
    try {
      const result = await esbuild.build({
        entryPoints: include,
        bundle: true,
        platform,
        format,
        target,
        minify,
        sourcemap,
        write: false,
        metafile: extract_inputs,
        logLevel: typeof debug === "boolean" ? debug ? "debug" : "silent" : debug,
        treeShaking: tree_shaking,
        external: externals,
        outfile,
        loader: {
          ".ttf": "file",
          ".woff": "file",
          ".woff2": "file",
          ".eot": "file",
          ".svg": "file"
        },
        ...opts
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
        bundled_code = result.outputFiles.filter((f) => f.path === "<stdout>" || f.path.endsWith(".js") && !f.path.endsWith(".d.js")).map((f) => f.text).join("\n");
        if (sourcemap) {
          const mapFile = result.outputFiles.find((f) => f.path.endsWith(".map"));
          if (mapFile)
            bundled_source_map = mapFile.text;
        }
      } else {
        errors.push({ data: "No output files were generated during bundling." });
      }
    } catch (err) {
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
  } else {
    throw new Error("Still in development.");
    try {
      const { rollup } = await import("rollup");
      const { nodeResolve } = await import("@rollup/plugin-node-resolve");
      const commonjs = (await import("@rollup/plugin-commonjs")).default;
      const json = (await import("@rollup/plugin-json")).default;
      const url = (await import("@rollup/plugin-url")).default;
      const postcss = (await import("rollup-plugin-postcss")).default;
      const ts2 = (await import("rollup-plugin-typescript2")).default;
      const { terser } = await import("@rollup/plugin-terser");
      const plugins = [
        nodeResolve({
          browser: platform === "browser",
          preferBuiltins: platform !== "browser",
          extensions: [".mjs", ".js", ".json", ".node", ".ts", ".tsx", ".css"]
        }),
        // override module setting to an ES module format Rollup can handle
        ts2({
          tsconfigOverride: {
            compilerOptions: {
              module: "ESNext",
              sourceMap: !!sourcemap
            }
          }
        }),
        commonjs(),
        json({ preferConst: true }),
        url({
          include: ["**/*.{ttf,woff,woff2,eot,svg,png,jpg,gif,json}"],
          limit: 8192,
          emitFiles: true
        }),
        postcss({ inject: true, extensions: [".css"] })
      ];
      if (minify) {
        plugins.push(terser());
      }
      const bundleObj = await rollup({
        input: include,
        external: externals,
        plugins,
        treeshake: tree_shaking ?? true,
        onwarn(warning, warn) {
          if (debug)
            warn(warning);
        }
      });
      const { output: rollupOutput } = await bundleObj.generate({
        format,
        sourcemap: sourcemap !== false,
        ...format === "iife" ? { name: "Bundle" } : {}
      });
      bundled_code = "";
      bundled_source_map = "";
      for (const chunkOrAsset of rollupOutput) {
        if (chunkOrAsset.type === "chunk") {
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
    } catch (err) {
      console.error("Rollup error:", err);
      errors.push({ data: err.message || String(err) });
    }
  }
  if (bundled_code && typeof postprocess === "function") {
    const res = postprocess(bundled_code);
    if (res instanceof Promise) {
      bundled_code = await res;
    } else {
      bundled_code = res;
    }
  }
  if (typeof output === "string") {
    await new import_vinc.vlib.Path(output).save(bundled_code ?? "");
  } else if (Array.isArray(output)) {
    for (let i = 0; i < output.length; i++) {
      await new import_vinc.vlib.Path(output[i]).save(bundled_code ?? "");
    }
  }
  if (log_level >= 1) {
    const first_path = typeof output === "string" ? output : Array.isArray(output) ? output[0] : void 0;
    if (first_path != null) {
      const p = new import_vinc.vlib.Path(first_path);
      import_vinc.vlib.Utils.print_marker(`Bundled ${p.name()} (${p.str()}) [${import_vinc.vlib.Utils.format_bytes(p.size)}].`);
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
        console.log(`Generated code of ${import_vinc.vlib.Utils.format_bytes(Buffer.byteLength(bundled_code, "utf8"))}`);
      }
    }
  };
}
var stdin_default = {
  compile,
  bundle,
  preprocessing: Preprocessing
  // collect_exports,
  // get_source_files,
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  bundle,
  compile
});
