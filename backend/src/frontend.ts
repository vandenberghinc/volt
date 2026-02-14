
// Imports.
import * as vlib from "@vandenberghinc/vlib";

// @ts-ignore
declare var __dirname; var __dirname = typeof __dirname !== 'undefined' ? __dirname : import.meta.dirname;

/** Validate if a path exists and return. */
function validate_path(path: string): string {
    if (!vlib.Path.exists(path)) {
        throw new Error(`Frontend path "${path}" does not exist. Please create a GitHub issue to report this.`);
    }
    return path; // return the raw path.
}

/**
 * Exported frontend paths.
 */
export const Frontend = {
    /** The frontend assets path. */
    assets: validate_path(__dirname + "/../../../../../frontend/assets/"),
	/** CSS exports. */
	css: {
        /** The default volt css export. */
		volt: validate_path(__dirname + "/../../../../../frontend/css/volt.css"),
	}
}
export default Frontend;