/*
 * Author: Daan van den Bergh
 * Copyright: © 2024 - 2024 Daan van den Bergh.
 */

import * as pathlib from 'path';
import * as fs from 'fs';
import * as ts from 'typescript';

const {vhighlight, vlib} = require("../../vinc.js");

// Macro interface.
interface Macro {
    name: string,
    value: string,
    args: string[],
}

// ------------------------------------------------------------------------------------------

/*
 * Preprocesses the input text, replacing non-string numeric literals
 * suffixed with units and hex color codes with string literals.
 */
function preprocess(path: string, input: string, opts: {macros?: boolean} = {}) {

    const {
        macros = true,
    } = opts;

    // Initialize output and batch
    let output: string[] = [];
    let batch: string[] = [];
    enum State {
        code,
        string,
        comment,
        regex,
    }
    let state: State = State.code;

    // Function to process the accumulated batch
    const process_code_batch = () => {
        let str = batch.join('')
            // Replace numeric suffix to string.
            .replace(/\b\d+(\.\d+)?(em\b|rem\b|px\b|vh\b|vw\b|%)/g, '"$&"')
            // Replace hex colors.
            .replace(/#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g, '"$&"')

        // Append the transformed segment to output
        output.push(str);

        // Clear the batch
        batch = [];
    };

    // Process string batch.
    const process_string_batch = () => {
        enum BaseIndentState {
            init,
        }
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
                        indent = indent.slice((base_indent as any).length)
                    }
                    else {
                        // console.log({indent, base_indent})
                    }
                    // console.log({mode: "output", line, prefix, indent, base_indent, output: prefix + indent, suffix})
                    // console.log({prefix, indent})
                    return prefix + indent;
                })
                return "`" + content.trim() + "`";
            })

        // Append the transformed segment to output
        output.push(str);

        // Clear the batch
        batch = [];
    }

    // Initialize the Iterator
    new vhighlight.Iterator({
        language: 'js',
        code: input,
        callback(s) {

            // Get new state.
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

            // Process new state.
            if (new_state !== state) {
                if (state === State.code) {
                    process_code_batch();
                } else if (state === State.string) {
                    process_string_batch();
                }
                state = new_state;
            }

            // Push character.
            if (state === State.code || state === State.string) {
                batch.push(s.char);
            } else {
                output.push(s.char);
            }
        },
    }).iterate();

    // Process any remaining batch after iteration
    if (batch.length > 0) {
        if (state === State.code) {
            process_code_batch();
        } else if (state === State.string) {
            process_string_batch();
        }
    }

    // Output
    let content = output.join("");

    // Process macros.
    if (macros) {
        content = _apply_macro_preprocessing(path, content);
    }

    // Response.
    return content;

}

// Split macro args `X, X` args.
function _split_macro_args(data: string): string[] {

    // Process args.
    let args = [""];
    const process_arg = () => {
        let arg = args[args.length - 1].trim();
        if (
            (arg.charAt(0) === "'" && arg.charAt(arg.length - 1) === "'") ||
            (arg.charAt(0) === "\"" && arg.charAt(arg.length - 1) === "\"")
        ) {
            arg = arg.slice(1, -1);
        }
        args[args.length - 1] = arg;
    }

    // Iterate.
    new vhighlight.Iterator({
        language: "ts",
        code: data,
        callback(state) {
            if (
                state.char === "," &&
                state.curly_depth === 0 &&
                state.bracket_depth === 0 &&
                state.parenth_depth === 0 &&
                !state.is_str &&
                !state.is_regex &&
                !state.is_comment &&
                !state.is_multi_line_comment
            ) {
                process_arg()
                args.push("");
            } else {
                args[args.length - 1] += state.char;
            }
        },
    }).iterate();

    // Return empty array.
    if (args.length === 1 && args[0] === "") { return []; }

    // Process arg.
    if (args.length > 0) { process_arg() }

    // Return args.
    return args;
}

/*
 * Fill all #macro statements.
 */
function _apply_macro_preprocessing(path: string, data: string) : string {
    
    // ----------------------------------------
    // Extract macro statements.

    let output: string[] = [], is_preprocessor: any = null;
    const macros: Record<string, Macro> = {};

    let iterator = new vhighlight.Iterator({
        language: "ts",
        code: data,
        allow_preprocessors: true,
        callback(state) {

            // End of preprocessor.
            if (is_preprocessor !== undefined && !state.is_preprocessor) {

                // Extract name & value.
                enum Modes {
                    type,
                    pre_name,
                    name,
                    args,
                    value,
                };
                let type = "", name = "", value = "", full = "", args = "", args_depth = [0, 0, 0];
                let s: any = is_preprocessor, mode = Modes.type;
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
                            args_depth = [s.curly_depth, s.parenth_depth - 1, s.bracket_depth]
                        }
                        else if (
                            s.is_whitespace &&
                            s.curly_depth === is_preprocessor.curly_depth &&
                            s.parenth_depth === is_preprocessor.parenth_depth &&
                            s.bracket_depth === is_preprocessor.bracket_depth
                        ) {
                            mode = Modes.value;
                        } else {
                            name += s.char;
                        }
                    } else if (mode === Modes.args) {
                        if (
                            s.char === ")" &&
                            s.curly_depth === args_depth[0] &&
                            s.parenth_depth === args_depth[1] &&
                            s.bracket_depth === args_depth[2]
                        ) {
                            mode = Modes.name;
                        } else {
                            args += s.char;
                        }
                    } else if (mode === Modes.value) {
                        if (s.char === "\\" && s.next?.is_line_break) {
                            // skip.
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
                        args: args.length === 0 ? [] : _split_macro_args(args),
                    };
                } else {
                    output.push(full);
                }

                is_preprocessor = undefined;
            }

            // Start of preprocessor.
            else if (state.is_preprocessor) {
                if (is_preprocessor === undefined) {
                    is_preprocessor = state;
                }
                return ; // dont add to new data.
            }

            output.push(state.char);
        },
    })
    iterator.iterate();
    data = output.join("");

    // ----------------------------------------
    // Fill macro statements.
    output.length = 0;
    let buff: string[] = [];

    // Construct regex to match preprocessor variables
    const macros_keys = Object.keys(macros);
    const regex = new RegExp(`(\\#?|\\b)(${macros_keys.join("|")})(\\([^)]*\\)|\\b)`, 'g');

    // Fill macro replacements.
    const make_replacements = (buff): string => {
        return buff
        .join('')
        .replace(regex, (match, m1, m2, m3) => {
            const macro = macros[m2];
            if (macro == null) { return match; }
            let value = "";
            if (m1.charAt(0) !== "#") {
                value = m1;
            }
            value += macro.value;
            if (m3 && m3.charAt(0) === "(" && macro.args.length > 0) {
                let args = _split_macro_args(m3.slice(1, -1));
                for (let i = 0; i < macro.args.length; i++) {
                    value = value.replace(new RegExp(`\\b${macro.args[i]}\\b`, 'g'), args[i] ?? "")
                }
                return value;
            }
            return value;
        })
    }

    // Iterator that processes the code
    iterator = new vhighlight.Iterator({
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
}

/**
 * Apply vweb frontend auto imports preprocessing
 */
const vweb_frontend = new vlib.Path(`${__dirname}/../../../../frontend/dist/`).abs().str();
const vweb_exports = new vlib.Path(`${__dirname}/../../../../frontend/exports.json`).load_sync({type: "object"});
function vweb_auto_imports(path: string, data: string) {

    // Check auto import
    if (!data.includes("@vweb-auto-import")) {
        console.log("NO Auto import on", path)
        return ;
    }

    console.log("Auto import on", path)

    // Capture used names.
    const regex = new RegExp(`\\b(${Object.values(vweb_exports).flat().join('|')})\\b`, 'g');
    let names_set = new Set<string>();
    let match;
    while ((match = regex.exec(data)) !== null) {
        if (!names_set.has(match[1])) {
            names_set.add(match[1]);
        }
    }
    let names: string[] = Array.from(names_set);

    // Create needed modules.
    const names_per_module = {};
    for (const name of names) {
        for (const m of Object.keys(vweb_exports)) {
            if (vweb_exports[m].includes(name)) {
                if (names_per_module[m] === undefined) {
                    names_per_module[m] = [];
                }
                names_per_module[m].push(name);
            }
        }
    }

    // Add global types.
    let prefix = 
        `import "${vweb_frontend}/modules/string"; ` +
        `import "${vweb_frontend}/modules/number"; ` +
        `import "${vweb_frontend}/modules/object"; ` +
        `import "${vweb_frontend}/modules/array"; `;

    // Add ts code.
    if (names.length > 0) {
        for (const m of Object.keys(names_per_module)) {
            prefix += `import { ${names_per_module[m].join(", ")} } from "${vweb_frontend}/${m.slice(0, -3)}"; `
        }
    }

    return data.replace(/\/\/\s*@vweb-auto-import\s*\n/, prefix + "\n")
}

module.exports = {preprocess, vweb_auto_imports};