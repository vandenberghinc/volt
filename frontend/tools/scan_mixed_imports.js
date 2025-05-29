#!/usr/bin/env node
// scan-mixed-imports.js
// ESM script to detect mixed import specifiers resolving to the same real file

import { existsSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import resolve from 'resolve';

async function main() {
    // Adjust pattern to match your source directories
    // const target = `/Users/administrator/persistance/private/dev/libris/libris/src/frontend`;
    const target = `src`;
    if (!existsSync(target)) {
        console.error(`Target directory does not exist: ${target}`);
        process.exit(1);
    }
    const patterns = [target + '/**/*.{js,jsx,ts,tsx}'];
    const files = await glob(patterns, { nodir: true });

    // Map real absolute file path -> Set of import specifiers
    const realMap = new Map();

    for (const file of files) {
        const code = await fs.readFile(file, 'utf8');
        // Regexes for static import, require(), and dynamic import()
        const staticRe = /import\s+(?:[\w*\s{},]+\s+from\s+)?['"]([^'"]+)['"]/g;
        const requireRe = /require\(\s*['"]([^'"]+)['"]\s*\)/g;
        const dynamicRe = /import\(\s*['"]([^'"]+)['"]\s*\)/g;


        for (const re of [staticRe, requireRe, dynamicRe]) {
            let match;
            // console.log(re, re.exec(code))
            while ((match = re.exec(code))) {
                const spec = match[1];
                try {
                    const realPath = resolve.sync(spec, { basedir: path.dirname(file) });
                    const absPath = path.resolve(realPath);
                    if (!realMap.has(absPath)) realMap.set(absPath, new Set());
                    realMap.get(absPath).add(spec);
                } catch {
                    // Ignore unresolved (built-in or external)
                }
            }
        }
    }

    let found = false;
    for (const [realPath, specs] of realMap) {
        if (specs.size > 1) {
            found = true;
            console.log(`\n⚠️  Mixed imports for: ${realPath}`);
            console.log(`   Specifiers: ${[...specs].map(s => `'${s}'`).join(', ')}`);
        }
    }

    if (!found) {
        console.log('✅ No mixed import paths detected.');
    } else {
        process.exitCode = 1;
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
