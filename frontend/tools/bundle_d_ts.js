#!/usr/bin/env node
/**
 * Create a single bundle .d.ts file from multiple .d.ts files.
 */

import fs from 'fs/promises';
import { glob } from 'glob';
import { fileURLToPath } from 'url';
import * as path from 'path';
import * as vlib from "@vandenberghinc/vlib"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    
    const target = path.join(__dirname, '..', 'dist/frontend/');
    const patterns = [target + '/**/*.d.ts'];
    
    console.log("Target directory:", target)
    
    const create_bundle = async (name = "lml_bundle.d.ts", exclude = undefined) => {
        exclude ??= [];
        exclude.push("**/lml_bundle*.d.ts");
        const files = await glob(patterns, { nodir: true, ignore: exclude });
        const bundle = [];
        const out = path.join(target, name);
        console.log("Creating bundle:", out)
        const file_sizes = [];
        for (const file of files) {
            const rel_path = path.relative(target, file);
            if (rel_path === name || (exclude != null && exclude.includes(rel_path))) continue; // Skip output file if re-running
            console.log(" - included", rel_path)

            // Load.
            let code = await fs.readFile(file, 'utf8');

            // Process `elements/base.d.ts`
            if (rel_path === 'src/elements/base.d.ts') {
                // only keep everything before the `extend()` function.
                code = code.split("export declare function extend<")[0];
            }

            // Add to file sizes.
            file_sizes.push({ file: rel_path, size: new vlib.Path(file).size });

            // Add to file.
            bundle.push(`// ---- ${path.relative(target, file)} ----\n` + code);
        }

        // Log file sizes
        file_sizes.sort((a, b) => b.size - a.size);
        console.log("Biggest files:");
        for (const fs of file_sizes.slice(0, 10)) {
            console.log(` - ${vlib.System.format_bytes(fs.size).padStart(10)}  ${fs.file}`);
        }

        // Write.
        await fs.writeFile(out, bundle.join('\n\n'), 'utf8');
        console.log(`Bundled ${files.length} .d.ts files into ${out} with a size of ${vlib.System.format_bytes(new vlib.Path(out).size)}.`);
    }

    await create_bundle("lml_bundle.d.ts");
    await create_bundle("lml_bundle.ui.d.ts", ["src/modules/paddle.d.ts"]);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});

