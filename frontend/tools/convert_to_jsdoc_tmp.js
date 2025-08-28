function convertToJSDoc(code) {
    // Helper function to clean and format multi-line text
    const formatMultilineText = (text, indent) => {
        return text
            .split('\n')
            .map(l => l.replace(/^\s*\*\s?/, '').trim())
            .filter(Boolean)
            .join("\n" + indent + ' * ');
    };

    // Helper: convert old docstring to JSDoc format
    const convertDocstring = (docstring, indent = '    ') => {
        // Support @desc: or @description:
        const titleMatch = docstring.match(/@title:\s*([^\n]*)/i);
        const descMatch = docstring.match(/@(desc|descr|description):\s*([\s\S]+?)(?=@param:|@return:|@funcs:|\*\/)/i);


        // Support @descr: or @description: inside @param:
        const paramNameMatch = docstring.match(/@param:[\s\S]*?@name:\s*([^\n]*)/i);
        const paramDescrMatch = docstring.match(/@param:[\s\S]*?@(desc|descr|description):\s*:?\s*([\s\S]+?)(?=@return:|@funcs:|\*\/)/i);

        // Allow optional colon after @description and trim before @funcs or */ 
        const returnDescMatch = docstring.match(/@return:[\s\S]*?@(desc|descr|description)\s*:?\s*([\s\S]+?)(?=@funcs:|\*\/)/i);

        const lines = [];
        lines.push(indent + '/**');

        // Build summary from title + description if present
        const title = titleMatch ? titleMatch[1].trim() : '';
        const desc = descMatch ? formatMultilineText(descMatch[2].trim(), indent) : '';
        if (!desc) {
            throw new Error("No description found for docstring:\n" + fullDocstring);
        }
        lines.push(indent + ' * {' + title + "}");
        lines.push(indent + ' * ' + desc);
        // if (title || desc) {
        //     const summary = [title, desc].filter(Boolean).join(' — ');
        //     lines.push(indent + ' * ' + summary);
        // }

        if (paramNameMatch && paramDescrMatch) {
            const cleanParamDescr = formatMultilineText(paramDescrMatch[2].trim(), indent);
            lines.push(indent + ` * @param ${paramNameMatch[1].trim()} ${cleanParamDescr}`);
        }

        if (returnDescMatch) {
            const cleanReturnDesc = formatMultilineText(returnDescMatch[2].trim(), indent);
            lines.push(indent + ` * @returns ${cleanReturnDesc}`);
        }

        lines.push(indent + ' * @docs');
        lines.push(indent + ' */');

        return lines.join('\n');
    };

    // Split code into lines for easier processing
    const lines = code.split('\n');
    const result = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        // Check if this line starts a docstring
        if (line.trim().startsWith('/**') && i + 1 < lines.length) {
            // Find the end of the docstring
            let docEnd = i;
            let docContent = [line];

            for (let j = i + 1; j < lines.length; j++) {
                docContent.push(lines[j]);
                if (lines[j].trim().endsWith('*/')) {
                    docEnd = j;
                    break;
                }
            }

            const fullDocstring = docContent.join('\n');

            // Check if it's an old-format docstring
            if (fullDocstring.includes('@docs:')) {
                // This is an old-format docstring that needs conversion

                // Look ahead to find function signatures
                let searchIdx = docEnd + 1;
                let functionName = null;
                let overloads = [];
                let implementation = null;
                let implLineIdx = -1;

                while (searchIdx < lines.length) {
                    const searchLine = lines[searchIdx].trim();

                    if (searchLine === '') {
                        searchIdx++;
                        continue;
                    }

                    // Check if this looks like a function signature
                    const funcMatch = searchLine.match(/^(\w+)\s*\([^)]*\)[^;{]*([;{])/);

                    if (funcMatch) {
                        const funcName = funcMatch[1];
                        const isImpl = funcMatch[2] === '{' ||
                            (searchIdx + 1 < lines.length && lines[searchIdx + 1].trim().startsWith('{'));

                        if (!functionName) {
                            functionName = funcName;
                        }

                        if (funcName === functionName) {
                            if (!isImpl) {
                                overloads.push({
                                    line: searchLine,
                                    lineIdx: searchIdx
                                });
                            } else {
                                implementation = searchLine;
                                implLineIdx = searchIdx;
                                break;
                            }
                        } else {
                            // Different function, stop
                            break;
                        }
                    } else {
                        // Not a function signature, stop
                        break;
                    }

                    searchIdx++;
                }

                // Get the indent from the implementation line or first overload
                let indent = '    ';
                if (implLineIdx > -1) {
                    const leadingSpace = lines[implLineIdx].match(/^(\s*)/);
                    if (leadingSpace) {
                        indent = leadingSpace[1];
                    }
                } else if (overloads.length > 0) {
                    const leadingSpace = lines[overloads[0].lineIdx].match(/^(\s*)/);
                    if (leadingSpace) {
                        indent = leadingSpace[1];
                    }
                }

                // Convert the docstring
                const jsdoc = convertDocstring(fullDocstring, indent);

                if (implLineIdx > -1 && overloads.length > 0) {
                    // We have overloads and implementation - don't add docstring yet
                    // Add the overloads without docstring
                    for (const overload of overloads) {
                        result.push(lines[overload.lineIdx]);
                    }

                    // Add the JSDoc before implementation
                    result.push(jsdoc);
                    result.push(lines[implLineIdx]);

                    // Skip past all the lines we've processed
                    i = implLineIdx + 1;
                } else {
                    // No overloads or no implementation - put JSDoc in place
                    result.push(jsdoc);

                    // Add any functions we found
                    if (overloads.length > 0) {
                        for (const overload of overloads) {
                            result.push(lines[overload.lineIdx]);
                        }
                        i = overloads[overloads.length - 1].lineIdx + 1;
                    } else if (implLineIdx > -1) {
                        result.push(lines[implLineIdx]);
                        i = implLineIdx + 1;
                    } else {
                        i = docEnd + 1;
                    }
                }
            } else {
                // Not an old-format docstring, keep as-is
                for (const docLine of docContent) {
                    result.push(docLine);
                }
                i = docEnd + 1;
            }
        } else {
            // Not a docstring line, keep as-is
            result.push(line);
            i++;
        }
    }

    const convertedCode = result.join('\n');

    // Check for any remaining old-format patterns
    const checkPatterns = [
        /@docs:/g,
        /@title:/g,
        /@param:\s*\n\s*@name:/g,
        /@return:\s*\n\s*@description/g,
        /@funcs:/g
    ];

    let hasRemaining = false;
    checkPatterns.forEach(pattern => {
        if (pattern.test(convertedCode)) {
            hasRemaining = true;
        }
    });

    if (hasRemaining) {
        console.log('⚠️ Some old-format patterns may remain in the converted code');
    } else {
        console.log('✅ All docstrings successfully converted!');
    }

    return convertedCode;
}


// Example usage
const test_code = `
    /**
     * @docs:
     * @title: On Suspend
     * @desc: Script to be run when fetching the media data is stopped before it is completely loaded for whatever reason. The equivalent of HTML attribute \`onsuspend\`.
     * @param:
     *     @name: callback
     *     @descr: The function to be executed when the suspend event occurs. The first parameter of the callback is the \`VElement\` object.
     * @return:
     *     @description Returns the \`VElement\` object. Unless parameter \`value\` is \`null\`, then the attribute's value is returned.
     * @funcs: 2
     */
    on_suspend(): Function | undefined;
    on_suspend(callback: Function): this;
    on_suspend(callback?: Function): this | Function | undefined {
        if (callback == null) { return this.onsuspend ?? undefined; }
        const e = this;
        this.onsuspend = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On Time Update
     * @desc: Script to be run when the playing position has changed (like when the user fast forwards to a different point in the media). The equivalent of HTML attribute \`ontimeupdate\`.
     * @param:
     *     @name: callback
     *     @descr: The callback function to execute when the time updates. The first parameter of the callback is the \`VElement\` object.
     * @return:
     *     @description Returns the \`VElement\` object. Unless parameter \`callback\` is \`null\`, then the attribute's value is returned.
     * @funcs: 2
     */
    on_time_update(): Function | undefined;
    on_time_update(callback: ElementEvent<this>): this;
    on_time_update(callback?: ElementEvent<this>): this | Function | undefined {
        if (callback == null) { return this.ontimeupdate ?? undefined; }
        const e = this;
        this.ontimeupdate = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On Volume Change
     * @desc: Script to be run each time the volume is changed which includes setting the volume to "mute". 
     *        The equivalent of HTML attribute \`onvolumechange\`. The first parameter of the callback is the \`VElement\` object.
     * @param:
     *     @name: callback
     *     @descr: The callback function to execute on volume change.
     * @return:
     *     @description Returns the \`VElement\` object for chaining unless parameter \`value\` is \`null\`, then the attribute's value is returned.
     * @funcs: 2
     */
    on_volume_change(): Function | undefined;
    on_volume_change(callback: ElementEvent<this>): this;
    on_volume_change(callback?: ElementEvent<this>): this | Function | undefined {
        if (callback == null) { return this.onvolumechange ?? undefined; }
        const e = this;
        this.onvolumechange = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On Waiting
     * @desc: Script to be run when the media has paused but is expected to resume (like when the media pauses to buffer more data). The equivalent of HTML attribute \`onwaiting\`.
     * @param:
     *     @name: callback
     *     @descr: The callback function to execute when the media is waiting.
     * @return:
     *     @description Returns the \`VElement\` object unless parameter \`callback\` is \`null\`, then the attribute's value is returned.
     * @funcs: 2
     */
    on_waiting(): Function | undefined;
    on_waiting(callback: (element: this, time: any) => any): this;
    on_waiting(callback?: (element: this, time: any) => any): this | Function | undefined {
        if (callback == null) { return this.onwaiting ?? undefined; }
        const e = this;
        this.onwaiting = (t) => callback(e, t);
        return this;
    }

    /**
     * @docs:
     * @title: On toggle
     * @desc: Fires when the user opens or closes the \<details> element. 
     *        The equivalent of HTML attribute \`ontoggle\`. 
     *        The first parameter of the callback is the \`VElement\` object.
     * @param:
     *     @name: value
     *     @descr: The value to assign. Leave \`null\` to retrieve the attribute's value.
     * @return:
     *     @description Returns the \`VElement\` object. Unless parameter \`value\` is \`null\`, then the attribute's value is returned.
     * @funcs: 2
     */
    on_toggle() : Function | undefined;
    on_toggle(callback: ElementEvent<this>): this;
    on_toggle(callback?: ElementEvent<this>): this | Function | undefined {
        if (callback == null) { return this.ontoggle ?? undefined; }
        const e = this;
        this.ontoggle = (t) => callback(e, t);
        return this;
    }


`;

// Convert the code
// const convertedCode = convertToJSDoc(test_code);
// console.log('\n📄 Converted Code:=======================\n'+convertedCode + "\n=====================");

// From file.
import { fileURLToPath } from 'url';
import * as path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import * as vlib from "@vandenberghinc/vlib"

const data = new vlib.Path(__dirname + "/convert_to_jsdoc_input.txt").load_sync();
const converted = convertToJSDoc(data);
new vlib.Path(__dirname + "/convert_to_jsdoc_output.txt").save_sync(converted);