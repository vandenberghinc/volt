/*
 * Author: Daan van den Bergh
 * Copyright: © 2024 - 2024 Daan van den Bergh.
 */

import * as pathlib from 'path';
import * as fs from 'fs';
import * as ts from 'typescript';

const {vhighlight, vlib} = require("../../../vinc.js");

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
			
			// Dedent ``` code blocks.
			.replace(/```([\s\S]*?)```/g, (match, code) => {
				// console.log("===========================\nMatched\n"+ code)

		        // Remove leading and trailing empty lines
		        // Dont use trim() since that would also remove start indent.
		        code = code.replace(/^\s*\n|\s*$/g, '');

		        // Match the base indentation (4 spaces) from the first non-empty line
		        const base_indent_match = code.match(/^([ \t]+)/m);
		        if (!base_indent_match) return '`' + code + '`'; // No base indent found

		        const base_indent = base_indent_match[1];

		        // Ensure base_indent contains only spaces
		        // if (/\t/.test(base_indent)) {
		        //     throw new Error('Invalid indentation: Tabs are not allowed.');
		        // }

		        // Create a regex to remove the base_indent from the start of each line
		        const dedent_regex = new RegExp(`^${base_indent}`, 'gm');

		        // Dedent the code by removing base_indent
		        const dedented_code = code.replace(dedent_regex, '');

		        return `\`${dedented_code}\``;
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

// Variables.
const volt_frontend = new vlib.Path(`${__dirname}/../../../../frontend/dist/`).abs().str();
let volt_exports: undefined | Record<string, string[]> = undefined;

// Detect unused volt frontend imports.
function detect_unused_imports(source_file: ts.SourceFile): string[] {

	// Load volt exports.
	if (volt_exports === undefined) {
		volt_exports = new vlib.Path(`${__dirname}/../../../../frontend/exports.json`).load_sync({type: "object"}) as Record<string, string[]>;
		volt_exports["ui/ui.ts"] = ["VoltUI"];
	}

	// Vars.
	// const source_file = ts.createSourceFile(file_path, file_content, ts.ScriptTarget.Latest, true);
	const imported_identifiers = new Set<string>();
	const declared_identifiers = new Set<string>();
	const used_identifiers = new Set<string>();

	// Helper function to recursively collect declared identifiers
	function collect_declared_identifiers(name: ts.BindingName): void {
		if (ts.isIdentifier(name)) {
			declared_identifiers.add(name.text);
		} else if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
			name.elements.forEach(element => {
				if (ts.isBindingElement(element)) {
					collect_declared_identifiers(element.name);
				}
			});
		}
	}

	// First pass: Collect imported and declared identifiers
	const visit_first_pass = (node: ts.Node) => {
		if (ts.isImportDeclaration(node)) {
			if (node.importClause) {
				const { name, namedBindings } = node.importClause;
				if (name) imported_identifiers.add(name.text);
				if (namedBindings) {
					if (ts.isNamedImports(namedBindings)) {
						namedBindings.elements.forEach(element => imported_identifiers.add(element.name.text));
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

	// Second pass: Collect used identifiers
	// const visit_second_pass = (node: ts.Node) => {
	//     if (ts.isIdentifier(node)) {
	//         used_identifiers.add(node.text);
	//     }
	//     ts.forEachChild(node, visit_second_pass);
	// };

	ts.forEachChild(source_file, visit_first_pass);
	// ts.forEachChild(source_file, visit_second_pass);

	const used_names_set = new Set<string>();

	// Determine which classes/variables are used without being imported
	const classes_to_check = new Set<string>(Object.values(volt_exports).flat() as string[]);
	classes_to_check.forEach(class_name => {
		if (
			used_identifiers.has(class_name) &&
			!imported_identifiers.has(class_name) &&
			!declared_identifiers.has(class_name)
		) {
			used_names_set.add(class_name);
		}
	});

	return Array.from(used_names_set);
}

/**
 * Apply volt frontend auto imports preprocessing
 */
function volt_auto_imports(path: string, data: string) {

	// Check auto import
	if (data.includes("@volt-no-auto-import")) {
		return undefined;
	}

	// Capture names.
	const names = detect_unused_imports(ts.createSourceFile(path, data, ts.ScriptTarget.Latest, true))

	// Create needed modules.
	const names_per_module = {}, added_names = new Set;
	for (const name of names) {
		for (const m of Object.keys(volt_exports as any)) {
			if (name === "VoltUI") {
				names_per_module["VoltUI"] = [];
			}
			else if (
				// name !== "volt.ts" &&
				!path.endsWith(m) &&
				(volt_exports as any)[m].includes(name) &&
				!added_names.has(name)
			) {
				if (names_per_module[m] === undefined) {
					names_per_module[m] = [];
				}
				names_per_module[m].push(name);
				added_names.add(name)
			}
		}
	}

	// Add global types.
	let prefix = 
		`import "${volt_frontend}/modules/string"; ` +
		`import "${volt_frontend}/modules/number"; ` +
		`import "${volt_frontend}/modules/object"; ` +
		`import "${volt_frontend}/modules/array"; `;

	// Add ts code.
	if (names.length > 0) {
		for (const m of Object.keys(names_per_module)) {
			if (m === "VoltUI") {
				prefix += `import * as VoltUI from "${volt_frontend}/ui/ui"; `
			} else {
				prefix += `import { ${names_per_module[m].join(", ")} } from "${volt_frontend}/${m.slice(0, -3)}"; `
			}
		}
	}

	// Response.
	return prefix + data;
}



// console.log("=========================\nOUTPUT\n"+
// preprocess("X", `

// 				.inner_html(
// 					\`\`\`
// 					1 Begin with installing the Libris Client via npm, offering seamless interaction through either the Libris Client API or the intuitive Libris CLI.
// 					<div style='height: 0.5em'></div>
// 					More information about installing libris can be found in the \${ThemeV2.Link("documentation", "/docs?id=getting_started/installation")}.
// 					\`\`\`
// 				),

// 				.inner_html(
// 					\`\`\`   
// 					2 Begin with installing the Libris Client via npm, offering seamless interaction through either the Libris Client API or the intuitive Libris CLI.
// 					<div style='height: 0.5em'></div>
// 					More information about installing libris can be found in the \${ThemeV2.Link("documentation", "/docs?id=getting_started/installation")}.
// 					\`\`\`
// 				),

// 				.inner_html(
// 					\`\`\`3 Begin with installing the Libris Client via npm, offering seamless interaction through either the Libris Client API or the intuitive Libris CLI.
// 					<div style='height: 0.5em'></div>
// 					More information about installing libris can be found in the \${ThemeV2.Link("documentation", "/docs?id=getting_started/installation")}.
// 					\`\`\`
// 				),

// 				\`\`\`
// 				---
// 				title: Lorem Ipsum
// 				name: lorem_ipsum.md
// 				---

// 				# Lorem ipsum
// 				Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
// 				\`\`\`

// 				\`\`\`
// 				{
// 					"name": "My Project",       // The name of your project.
// 					"version": "1.1",           // The documentation version.
// 					"include": [                // The source files you want to include, directories are allowed.
// 						"src/load.js"
// 					],
// 					"documents": [
// 						"pages/lorem_ipsum.md"  // The source path to the document.
// 					],
// 					"output": "docs.html"       // The output path of the generated HTML data.
// 				}
// 				\`\`\`
// `)
// );process.exit(1);

module.exports = {preprocess, volt_auto_imports};