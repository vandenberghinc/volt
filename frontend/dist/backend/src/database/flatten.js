/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh.
 */
import * as vlib from "@vandenberghinc/vlib";
export function flatten(obj, prefix = "") {
    if (typeof obj !== "object" || obj == null || Array.isArray(obj)) {
        vlib.schema.throw_invalid_type("obj", obj, "object", true);
    }
    const result = {};
    for (const key in obj) {
        if (!Object.hasOwn(obj, key))
            continue; // ES2022
        if (vlib.object.is_plain(obj[key])) {
            Object.assign(result, flatten(obj[key], prefix ? `${prefix}.${key}` : key));
        }
        else {
            result[prefix ? `${prefix}.${key}` : key] = obj[key];
        }
    }
    return result;
}
