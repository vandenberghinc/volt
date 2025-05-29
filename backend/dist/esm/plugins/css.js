/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */
// ---------------------------------------------------------
// Imports.
import CleanCSS from 'clean-css';
import { vlib } from "../vinc.js";
// ---------------------------------------------------------
// CSS utils.
// Implementation
export var CSS;
(function (CSS) {
    /*  @docs:
        @nav: Backend
        @title: Minify
        @description:
            Minify CSS code.
        @usage:
            import * as volt from "@vandenberghinc/volt";
            const css = volt.CSS.minify("...");
        @param:
            @name: data
            @descr: The css data.
            @type: string
     */
    function minify(data) {
        return new CleanCSS().minify(data).styles;
    }
    CSS.minify = minify;
    /*  @docs:
        @nav: Backend
        @title: Bundle
        @description:
            Bundle CSS code or files.
        @usage:
            import * as volt from "@vandenberghinc/volt";
            const bundle = volt.CSS.bundle({
                paths: [...],
                minify: true,
            });
        @param:
            @name: data
            @descr: The css data.
            @type: string
     */
    async function bundle({ data, paths = undefined, minify = false, output = undefined, postprocess = undefined, log_level = 0, }) {
        // Load via paths.
        if (paths !== undefined) {
            data = "";
            for (const path of paths) {
                data += await new vlib.Path(path).load();
            }
        }
        // Minify.
        if (minify) {
            data = CSS.minify(data);
        }
        // Postprocess.
        if (typeof postprocess === "function") {
            const res = postprocess(data);
            if (res instanceof Promise) {
                data = await res;
            }
            else {
                data = res;
            }
        }
        // Save.
        if (typeof output === "string") {
            await new vlib.Path(output).save(data);
        }
        else if (Array.isArray(output)) {
            for (let i = 0; i < output.length; i++) {
                await new vlib.Path(output[i]).save(data);
            }
        }
        // Logs.
        if (log_level >= 1) {
            const first_path = typeof output === "string" ? output : (Array.isArray(output) ? output[0] : undefined);
            if (first_path != null) {
                const p = new vlib.Path(first_path);
                vlib.Utils.print_marker(`Bundled ${p.name()} (${p.str()}) [${vlib.Utils.format_bytes(p.size)}].`);
            }
        }
        // Return.
        return data;
    }
    CSS.bundle = bundle;
})(CSS || (CSS = {}));
