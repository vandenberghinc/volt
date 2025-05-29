// const typescript = require("../backend/dist/plugins/typescript.js");
const vlib = require(`${process.env.PERSISTANCE}/private/dev/vinc/vlib/js/vlib.js`);
const vhighlight = require(`${process.env.PERSISTANCE}/private/dev/vinc/vhighlight/vhighlight.js`);


// -------------------------------------------------------------------------------------------------------------------------
// Compile Test.


// if (true) {
//     (async () => {
//         for (const path of await new vlib.Path(__dirname).paths({recursive: true})) {
//             if (path.str().endsWith(".d.ts")) {
//                 console.log("Remove", path.str())
//                 await path.del();
//                 continue;
//             } else if (path.extension() === ".js") {
//                 const tspath = new vlib.Path(path.str().slice(0, -2) + "ts");
//                 if (tspath.exists()) {
//                     console.log("Remove", path.str())
//                     await path.del();
//                     continue;
//                 }
//             }
//             console.log("Dont remove", path.str())
//         }
//     })()
// }
// else

const Preprocessing = require("../backend/dist/plugins/ts/preprocessing.js");
const TypeScript = require("../backend/dist/plugins/ts/compiler.js");

if (process.argv.includes("--test")) {
    (async () => {

        vlib.print_marker("Test mode enabled.");

        const compiled = await TypeScript.compile({
            // entry_paths: [`/Users/administrator/persistance/private/dev/libris/libris/core/frontend/home/home.ts`],
            entry_paths: [`/Users/administrator/persistance/private/dev/libris/libris/core/frontend/auth/signin.js`],
            output: "/tmp/test-dir/",
            preprocess: Preprocessing.vweb_auto_imports,
            compiler_opts: {
                target: "ES2023",
                module: "es6",
                lib: ["ES2023", "DOM"],
                declaration: true,
                strict: true,
                esModuleInterop: true,
                allowJs: true,
                checkJs: false,
                noImplicitAny: false,
                skipLibCheck: true,
                types: [],
                // "baseUrl": ".",  // Base directory for module resolution
                paths: {
                    // "vhighlight": [
                    //     "/Users/administrator/persistance/private/dev/vinc/vhighlight/vhighlight.js",
                    //     "/Volumes/persistance/private/dev/vinc/vhighlight/vhighlight.js",
                    // ]
                },
            }
        })
        compiled.debug()
        if (compiled.success) {
            const bundle = await TypeScript.bundle({
                // entry_paths: compiled.emitted_files.filter(path => path.endsWith("/home.js")),
                entry_paths: compiled.emitted_files.filter(path => path.endsWith("/signin.js")),
            })
            console.log(bundle)
            bundle.debug();
        }

    })()
}

// -------------------------------------------------------------------------------------------------------------------------
// Compile Frontend.
else {

    // Settings.
    const tab_size = 4;

    // Create VElement interface like.
    const create_velement_interface = (name, data) => {

        // Prepare data.
        if (!data.includes("class VBaseElement")) { throw new Error("Unable to find 'class VBaseElement' in 'ui/element.ts'."); }
        const code = data.split("class VBaseElement")[1];

        // Vars.
        const funcs = [], attrs = []
        let is_open = false;
        let first_state, last_state;

        // Map funcs & attrs.
        const iterator = new vhighlight.Iterator({
            language: "ts",
            code,
            tab_size,
            callback(state) {

                // Set first state.
                if (is_open && first_state === undefined) {
                    first_state = state;
                }

                // Open.
                if (
                    state.is_line_break &&
                    state.curly_depth === 1 &&
                    state.bracket_depth === 0 &&
                    state.parenth_depth === 0 &&
                    !is_open
                ) {
                    is_open = true;
                }

                // On end of line at correct depth.
                else if (
                    state.is_line_break &&
                    state.curly_depth === 1 &&
                    state.bracket_depth === 0 &&
                    state.parenth_depth === 0 &&
                    is_open
                ) {

                    // Gather states from line.
                    const start_state = last_state ?? first_state;
                    const states = [];
                    let prev = state;
                    while (prev) {
                        states.push(prev);
                        if (prev === start_state) {
                            break;
                        }
                        prev = prev.prev;
                    }
                    states.reverse();

                    // Get header line.
                    let body_indent = 0, header = "", body = "", header_open = true, body_open = false;
                    for (const s of states) {
                        if (header_open && !state.is_comment && !s.is_multi_line_comment) {
                            header += s.char;
                        }
                        if (body_open) {
                            body += s.char;
                        }
                        if (
                            header_open &&
                            s.is_line_break &&
                            (s.curly_depth === 1 || (s.curly_depth === 2 && s.prev_non_whitespace_char === "{")) &&
                            s.bracket_depth === 0 &&
                            s.parenth_depth === 0 &&
                            !/^[\s\n]*$/.test(header)
                        ) {
                            if (s.prev_non_whitespace_char === "{") {
                                body_open = true;
                                body_indent = s.prev.line_indent;
                                body += "{\n";
                            }
                            header_open = false;
                        }
                    }

                    // Post-process header.
                    header = header.trim()
                    if (header.includes("\n")) {
                        header = header
                        .replace(
                            new RegExp(`\n([ \t]*)`, "g"),
                            (m, m1) => {
                                let indent = "";
                                for (const char of m1) {
                                    if (char === " ") {
                                        indent += char;
                                    } else {
                                        indent += " ".repeat(tab_size - (indent.length % tab_size));
                                    }
                                }
                                if (indent.length % tab_size === 0) {
                                    indent = "\t".repeat(indent.length / tab_size)
                                }
                                return "\n" + indent;
                            },
                        )
                        .replace(
                            new RegExp(`\n(\\t| {${tab_size}}){${Math.floor(body_indent / tab_size)}}`, "g"),
                            "\n",
                        )
                    }

                    // Post-process body.
                    if (body === "") {
                        body = null;
                    } else {
                        body = body
                        .replace(
                            new RegExp(`\n([ \t]*)`, "g"),
                            (m, m1) => {
                                let indent = "";
                                for (const char of m1) {
                                    if (char === " ") {
                                        indent += char;
                                    } else {
                                        indent += " ".repeat(tab_size - (indent.length % tab_size));
                                    }
                                }
                                if (indent.length % tab_size === 0) {
                                    indent = "\t".repeat(indent.length / tab_size)
                                }
                                // return "\n";
                                return "\n" + indent;
                            },
                        )
                        .replace(
                            new RegExp(`\n(\\t| {${tab_size}}){${Math.floor(body_indent / tab_size)}}`, "g"),
                            "\n",
                        )
                    }

                    const raw = states.map(s => s.char).join("");
                    
                    // Check if the header line has any content exclluding comments and whitespace.
                    // console.log({line: state.line, start: start_state.index, end: state.index, header_line})
                    if (/^[\s\n]*$/.test(header)) {
                        return null;
                    }

                    // Set post vars.
                    last_state = state;

                    // Check signature.
                    let match = header.match(/^\s*((?:public|private|protected|static|async)\s+)*([a-zA-Z0-9_]+)\s*(\()*/)
                    if (match) {
                        const types = match[1] == null ? [] : match[1].trim().split(/\s+/).filter(mod => mod.length > 0) ?? [];
                        const name = match[2];
                        const is_func = match[3] != null;

                        // Function signature.
                        if (is_func && header.charAt(header.length - 1) === ";") {
                            funcs.push({
                                type: types,
                                name,
                                header,
                                typeless_header: match[1] == null ? header : header.slice(header.indexOf(match[1]) + match[1].length),
                                body,
                                raw: states.map(s => s.char).join(""),
                            });
                        }
                        else if (is_func && header.charAt(header.length - 1) === "{") {
                            header = header.slice(0, -1).trimEnd() + ";";
                            funcs.push({
                                type: types,
                                name,
                                header,
                                typeless_header: match[1] == null ? header : header.slice(header.indexOf(match[1]) + match[1].length),
                                body,
                                raw: states.map(s => s.char).join(""),
                            });
                        }
                        
                        // Attribute signature.
                        else if (header.charAt(header.length - 1) === ";") {
                            attrs.push({
                                type: types,
                                name,
                                header,
                                typeless_header: match[1] == null ? header : header.slice(header.indexOf(match[1]) + match[1].length),
                                body,
                                raw: states.map(s => s.char).join(""),
                            });
                        }
                        else if (header.charAt(header.length - 1) === "{") {
                            header = header.slice(0, -1) + body.trim();
                            attrs.push({
                                type: types,
                                name,
                                header,
                                typeless_header: match[1] == null ? header : header.slice(header.indexOf(match[1]) + match[1].length),
                                body: null,
                                raw: states.map(s => s.char).join(""),
                            });
                        }
                    }
                }

                // Check stop by zero depth.
                else if (is_open && state.curly_depth === 0) {
                    return false;
                }
            },
        });
        iterator.iterate()

        // Find template and indent level.
        let match1 = [];
        // let match1 = data.match(/([ \t]*)\{\{\s*VELEMENT_INTERFACE\s*\}\}/);
        // if (!match1) {
        //     throw new Error(`Template string "{{VELEMENT_INSTANCE}}" was not found in file "${name}".`);
        // }

        // Build data.
        let instance_data = "", statics_data = "", indent = match1[1] ?? "";
        for (const item of attrs) {
            if (item.type.includes("static")) {
                continue;
            }
            else if (item.typeless_header.includes(" = ")) {
                instance_data += item.typeless_header.split(" = ")[0] += ";\n"; continue;
            }
            else {
                instance_data += item.typeless_header += "\n"; continue;
            }

            // if (item.type.includes("static")) {
            //     statics_data += indent + item.header.replace("static ", "") + "\n";    
            // }
            // else if (item.type.includes("public")) {
            //     instance_data += indent + item.header.replace("public ", "") + "\n";    
            // }
            // else if (item.type.length === 0) {
            //     instance_data += indent + item.header + "\n";    
            // }
            
        }
        for (const item of funcs) {
            if (item.type.includes("static")) {
                continue;
            }
            else {
                instance_data += item.typeless_header += "\n"; continue;
            }

            // if (item.type.includes("static")) {
            //     statics_data += indent + item.header.replace("static ", "") + "\n";    
            // }
            // else if (item.type.includes("public")) {
            //     instance_data += indent + item.header.replace("public ", "") + "\n";    
            // }
            // else if (
            //     item.type.length === 0 ||
            //     (item.type.length === 1 && item.type.includes("async"))
            // ) {
            //     instance_data += indent + item.header + "\n";
            // }
        }
        console.log(instance_data)

        // Replace template.
        // data = data.replace("{{VELEMENT_INTERFACE}}", instance_data.trimStart());
        // console.log(
        //     "type _VElementInstance = {" + data.split("type _VElementInstance = {")[1].split("type VElement = _VElementInstance & { new (): _VElementInstance; } & _VElementStatic;")[0] + "type VElement = _VElementInstance & { new (): _VElementInstance; } & _VElementStatic;"
        // )
        return data;
    }

    // Get args.
    let source = __dirname,
    	error_limit = 25,
    	debug_single_file = false,
    	target_file = undefined;
    for (let i = 0; i < process.argv.length; i++) {
        if (process.argv[i] === "--error-limit") {
            error_limit = parseInt(process.argv[i + 1]);
            console.log("Error limit:", error_limit)
            if (isNaN(error_limit)) { error_limit = null; }
            ++i;
        }
        else if (process.argv[i] === "--target-file") {
            target_file = process.argv[i + 1];
            console.log("Target file:", target_file)
            ++i;
        }
        else if (process.argv[i] === "--debug-single-file") {
            console.log("Debug single file:", true)
            debug_single_file = true;
        }
    }
    if (source === "") {
        throw new Error("Define argument --source.");
    }
        
    // Capture exports.
    const exported_names = {};

    // Compile.
    typescript.compile_cli({
    	source,
        tsconfig: {
            "compilerOptions": {
                "target": "ES2021",
                "module": "es6",
                "lib": ["ES2021", "DOM"],
                "declaration": true,
                "declarationDir": "./dist",
                "outDir": "./dist",
                // "rootDir": "./src",
                "strict": true,
                "esModuleInterop": true,
                "allowJs": true,
                "checkJs": false,
                "noImplicitAny": false,
                "types": [],
                "baseUrl": ".",  // Base directory for module resolution
                "paths": {
                    "vhighlight": [
                        "/Users/administrator/persistance/private/dev/vinc/vhighlight/vhighlight.js",
                        "/Volumes/persistance/private/dev/vinc/vhighlight/vhighlight.js",
                    ]
                },
            },
            "include": ["vweb.js", "modules/**/*", "ui/**/*"],
            "exclude": [
                "ui/element.v1.ts",
                "uiX/",
                "./compile.js",
                "/Users/administrator/persistance/private/dev/vinc/vhighlight/vhighlight.js",
                "/Volumes/persistance/private/dev/vinc/vhighlight/vhighlight.js",
            ]
        },
        debug: {
        	error_limit,
        	debug_single_file,
        	target_file,
        },
    	async preprocess(name, data) {

            // Extract exports.
            exported_names[name] = await typescript.collect_exports(name, data);

            // Create Velement interface.
            if (false && name === "ui/element.ts") {
                return create_velement_interface(name, data);
            }

            // Default.
            return data;
    	},
    })
    .then(() => {

        // Save exports.
        new vlib.Path(`${__dirname}/exports.json`).save_sync(JSON.stringify(exported_names, null, 4))
        console.log("Saved ./exports.json");

    })
}
