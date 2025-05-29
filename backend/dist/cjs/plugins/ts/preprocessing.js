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
  Preprocessing: () => Preprocessing,
  default: () => stdin_default,
  preprocess: () => preprocess,
  volt_auto_imports: () => volt_auto_imports
});
module.exports = __toCommonJS(stdin_exports);
var ts = __toESM(require("typescript"));
var import_vinc = require("../../vinc.js");
var import_vinc2 = require("../../vinc.js");
var import_utils = require("../../utils.js");
var import_url = require("url");
var import_path = require("path");
var Preprocessing = __toESM(require("./preprocessing.js"));
const import_meta = {};
var __dirname = typeof __dirname !== "undefined" ? __dirname : (0, import_path.dirname)((0, import_url.fileURLToPath)(new URL("./package.json", import_meta.url)));
function preprocess(path, input, opts = {}) {
  const { macros = true, templates = void 0 } = opts;
  let output = [];
  let batch = [];
  let State;
  (function(State2) {
    State2[State2["code"] = 0] = "code";
    State2[State2["string"] = 1] = "string";
    State2[State2["comment"] = 2] = "comment";
    State2[State2["regex"] = 3] = "regex";
  })(State || (State = {}));
  let state = State.code;
  const process_code_batch = () => {
    let str = batch.join("").replace(/\b\d+(\.\d+)?(em\b|rem\b|px\b|vh\b|vw\b|%)/g, '"$&"').replace(/#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g, '"$&"');
    output.push(str);
    batch = [];
  };
  const process_string_batch = () => {
    let BaseIndentState;
    (function(BaseIndentState2) {
      BaseIndentState2[BaseIndentState2["init"] = 0] = "init";
    })(BaseIndentState || (BaseIndentState = {}));
    let str = batch.join("").replace(/```([\s\S]*?)```/g, (match, code) => {
      code = code.replace(/^\s*\n|\s*$/g, "");
      const base_indent_match = code.match(/^([ \t]+)/m);
      if (!base_indent_match)
        return "`" + code + "`";
      const base_indent = base_indent_match[1];
      const dedent_regex = new RegExp(`^${base_indent}`, "gm");
      const dedented_code = code.replace(dedent_regex, "");
      return `\`${dedented_code}\``;
    });
    output.push(str);
    batch = [];
  };
  new import_vinc2.vhighlight.Iterator({
    tokenizer: import_vinc2.vhighlight.js,
    language: import_vinc2.vhighlight.js.language,
    code: input,
    callback(s) {
      let new_state;
      if (s.is_str || s.is_template_literal) {
        new_state = State.string;
      } else if (s.is_comment || s.is_multi_line_comment) {
        new_state = State.comment;
      } else if (s.is_str) {
        new_state = State.regex;
      } else {
        new_state = State.code;
      }
      if (new_state !== state) {
        if (state === State.code) {
          process_code_batch();
        } else if (state === State.string) {
          process_string_batch();
        }
        state = new_state;
      }
      if (state === State.code || state === State.string) {
        batch.push(s.char);
      } else {
        output.push(s.char);
      }
    }
  }).iterate();
  if (batch.length > 0) {
    if (state === State.code) {
      process_code_batch();
    } else if (state === State.string) {
      process_string_batch();
    }
  }
  let content = output.join("");
  content = _global_interface_plugin(content);
  if (macros) {
    content = _apply_macro_preprocessing(path, content);
  }
  if (templates !== void 0 && Object.keys(templates.length > 0)) {
    content = import_utils.Utils.fill_templates(content, templates, true);
  }
  return content;
}
function _split_macro_args(data) {
  let args = [""];
  const process_arg = () => {
    let arg = args[args.length - 1].trim();
    if (arg.charAt(0) === "'" && arg.charAt(arg.length - 1) === "'" || arg.charAt(0) === '"' && arg.charAt(arg.length - 1) === '"') {
      arg = arg.slice(1, -1);
    }
    args[args.length - 1] = arg;
  };
  new import_vinc2.vhighlight.Iterator({
    tokenizer: import_vinc2.vhighlight.js,
    language: import_vinc2.vhighlight.js.language,
    code: data,
    callback(state) {
      if (state.char === "," && state.curly_depth === 0 && state.bracket_depth === 0 && state.parenth_depth === 0 && !state.is_str && !state.is_regex && !state.is_comment && !state.is_multi_line_comment) {
        process_arg();
        args.push("");
      } else {
        args[args.length - 1] += state.char;
      }
    }
  }).iterate();
  if (args.length === 1 && args[0] === "") {
    return [];
  }
  if (args.length > 0) {
    process_arg();
  }
  return args;
}
function _apply_macro_preprocessing(path, data) {
  let output = [], is_preprocessor = null;
  const macros = {};
  let iterator = new import_vinc2.vhighlight.Iterator({
    tokenizer: import_vinc2.vhighlight.js,
    language: import_vinc2.vhighlight.js.language,
    code: data,
    allow_preprocessors: true,
    callback(state) {
      if (is_preprocessor !== void 0 && !state.is_preprocessor) {
        let Modes;
        (function(Modes2) {
          Modes2[Modes2["type"] = 0] = "type";
          Modes2[Modes2["pre_name"] = 1] = "pre_name";
          Modes2[Modes2["name"] = 2] = "name";
          Modes2[Modes2["args"] = 3] = "args";
          Modes2[Modes2["value"] = 4] = "value";
        })(Modes || (Modes = {}));
        ;
        let type = "", name = "", value = "", full = "", args = "", args_depth = [0, 0, 0];
        let s = is_preprocessor, mode = Modes.type;
        while (s != null && s != state) {
          if (mode === Modes.type) {
            if (s.is_whitespace) {
              mode = Modes.pre_name;
            } else {
              type += s.char;
            }
          } else if (mode === Modes.pre_name && !s.is_whitespace) {
            mode = Modes.name;
            name += s.char;
          } else if (mode === Modes.name) {
            if (s.char === "(") {
              mode = Modes.args;
              args_depth = [s.curly_depth, s.parenth_depth - 1, s.bracket_depth];
            } else if (s.is_whitespace && s.curly_depth === is_preprocessor.curly_depth && s.parenth_depth === is_preprocessor.parenth_depth && s.bracket_depth === is_preprocessor.bracket_depth) {
              mode = Modes.value;
            } else {
              name += s.char;
            }
          } else if (mode === Modes.args) {
            if (s.char === ")" && s.curly_depth === args_depth[0] && s.parenth_depth === args_depth[1] && s.bracket_depth === args_depth[2]) {
              mode = Modes.name;
            } else {
              args += s.char;
            }
          } else if (mode === Modes.value) {
            if (s.char === "\\" && s.next?.is_line_break) {
            } else {
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
            args: args.length === 0 ? [] : _split_macro_args(args)
          };
        } else {
          output.push(full);
        }
        is_preprocessor = void 0;
      } else if (state.is_preprocessor) {
        if (is_preprocessor === void 0) {
          is_preprocessor = state;
        }
        return;
      }
      output.push(state.char);
    }
  });
  iterator.iterate();
  data = output.join("");
  output.length = 0;
  let buff = [];
  const macros_keys = Object.keys(macros);
  const regex = new RegExp(`(\\#?|\\b)(${macros_keys.join("|")})(\\([^)]*\\)|\\b)`, "g");
  const make_replacements = (buff2) => {
    return buff2.join("").replace(regex, (match, m1, m2, m3) => {
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
        let args = _split_macro_args(m3.slice(1, -1));
        for (let i = 0; i < macro.args.length; i++) {
          value = value.replace(new RegExp(`\\b${macro.args[i]}\\b`, "g"), args[i] ?? "");
        }
        return value;
      }
      return value;
    });
  };
  iterator = new import_vinc2.vhighlight.Iterator({
    tokenizer: import_vinc2.vhighlight.js,
    language: import_vinc2.vhighlight.js.language,
    code: data,
    allow_preprocessors: true,
    callback(state) {
      if (!state.is_str && !state.is_regex && !state.is_comment && !state.is_multi_line_comment) {
        buff.push(state.char);
      } else {
        if (buff.length > 0) {
          output.push(make_replacements(buff));
          buff = [];
        }
        output.push(state.char);
      }
    }
  });
  iterator.iterate();
  if (buff.length > 0) {
    output.push(make_replacements(buff));
  }
  return output.join("");
}
function _global_interface_plugin(data) {
  const prefix_output = [];
  while (true) {
    const regex = /\[(\s*export)*\s*interface\s+([a-zA-Z0-9_.]+)\s*{/g;
    const match = regex.exec(data);
    if (match == null) {
      break;
    }
    const start = match.index;
    let end = -1;
    let curly_start = -1;
    let curly_end = -1;
    new import_vinc2.vhighlight.Iterator({
      tokenizer: import_vinc2.vhighlight.js,
      language: import_vinc2.vhighlight.js.language,
      code: data.slice(start + 1),
      callback(s) {
        if (match[0].includes("UI.ReturnResponseDataOptions")) {
        }
        if (curly_start === -1 && s.curly_depth === 1) {
          curly_start = start + 1 + s.index;
        } else if (curly_start !== -1 && curly_end === -1 && s.curly_depth === 0) {
          curly_end = start + 1 + s.index + 1;
        } else if (s.bracket_depth === -1) {
          end = start + 1 + s.index + 1;
          return false;
        } else {
        }
      }
    }).iterate();
    if (curly_end >= 0 && end !== -1) {
      let export_statement = match[1] === void 0 ? "" : "export ";
      const names = match[2].split(".");
      let closing_curlies = 0;
      for (let i = 0; i < names.length; i++) {
        if (i + 1 === names.length) {
          prefix_output.push(export_statement, "interface ", names[i], " ", data.slice(curly_start, curly_end));
          if (closing_curlies > 0) {
            prefix_output.push("}".repeat(closing_curlies));
          }
        } else {
          export_statement = "export ";
          prefix_output.push(export_statement, "namespace ", names[i], " { ");
          ++closing_curlies;
        }
      }
      prefix_output.push(";\n");
      data = (start > 0 ? data.slice(0, start) : "") + data.slice(end);
    } else {
      break;
    }
  }
  if (prefix_output.length > 0) {
    return prefix_output.join("") + data;
  }
  return data;
}
const volt_frontend = new import_vinc.vlib.Path(`${__dirname}/../../../../../frontend/dist/`).abs().str();
let volt_exports = void 0;
function detect_unused_imports(source_file) {
  if (volt_exports === void 0) {
    volt_exports = {};
  }
  const imported_identifiers = /* @__PURE__ */ new Set();
  const declared_identifiers = /* @__PURE__ */ new Set();
  const used_identifiers = /* @__PURE__ */ new Set();
  function collect_declared_identifiers(name) {
    if (ts.isIdentifier(name)) {
      declared_identifiers.add(name.text);
    } else if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
      name.elements.forEach((element) => {
        if (ts.isBindingElement(element)) {
          collect_declared_identifiers(element.name);
        }
      });
    }
  }
  const visit_first_pass = (node) => {
    if (ts.isImportDeclaration(node)) {
      if (node.importClause) {
        const { name, namedBindings } = node.importClause;
        if (name)
          imported_identifiers.add(name.text);
        if (namedBindings) {
          if (ts.isNamedImports(namedBindings)) {
            namedBindings.elements.forEach((element) => imported_identifiers.add(element.name.text));
          } else if (ts.isNamespaceImport(namedBindings)) {
            imported_identifiers.add(namedBindings.name.text);
          }
        }
      }
    }
    if (ts.isVariableDeclaration(node) && node.name) {
      collect_declared_identifiers(node.name);
    } else if (ts.isFunctionDeclaration(node) && node.name) {
      declared_identifiers.add(node.name.text);
    } else if (ts.isClassDeclaration(node) && node.name) {
      declared_identifiers.add(node.name.text);
    }
    if (ts.isIdentifier(node)) {
      used_identifiers.add(node.text);
    }
    ts.forEachChild(node, visit_first_pass);
  };
  ts.forEachChild(source_file, visit_first_pass);
  const used_names_set = /* @__PURE__ */ new Set();
  const classes_to_check = new Set(Object.values(volt_exports).flat());
  classes_to_check.forEach((class_name) => {
    if (used_identifiers.has(class_name) && !imported_identifiers.has(class_name) && !declared_identifiers.has(class_name)) {
      used_names_set.add(class_name);
    }
  });
  return Array.from(used_names_set);
}
function volt_auto_imports(path, data) {
  if (data.includes("@volt-no-auto-import")) {
    return void 0;
  }
  const names = detect_unused_imports(ts.createSourceFile(path, data, ts.ScriptTarget.Latest, true));
  const names_per_module = {}, added_names = /* @__PURE__ */ new Set();
  for (const name of names) {
    for (const m of Object.keys(volt_exports)) {
      if (name === "VoltUI") {
        names_per_module["VoltUI"] = [];
      } else if (name === "Volt") {
        names_per_module["Volt"] = [];
      } else if (
        // name !== "volt.ts" &&
        !path.endsWith(m) && volt_exports[m].includes(name) && !added_names.has(name)
      ) {
        if (names_per_module[m] === void 0) {
          names_per_module[m] = [];
        }
        names_per_module[m].push(name);
        added_names.add(name);
      }
    }
  }
  let prefix = `import "${volt_frontend}/modules/string.js"; import "${volt_frontend}/modules/number.js"; import "${volt_frontend}/modules/object.js"; import "${volt_frontend}/modules/array.js"; `;
  if (names.length > 0) {
    for (const m of Object.keys(names_per_module)) {
      if (m === "VoltUI") {
        prefix += `import * as VoltUI from "${volt_frontend}/ui/ui.js"; `;
      } else if (m === "Volt") {
        prefix += `import * as Volt from "${volt_frontend}/volt.js"; `;
      } else {
        prefix += `import { ${names_per_module[m].join(", ")} } from "${volt_frontend}/${m.slice(0, -3)}.js"; `;
      }
    }
  }
  return prefix + data;
}
var stdin_default = { preprocess, volt_auto_imports };
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Preprocessing,
  preprocess,
  volt_auto_imports
});
