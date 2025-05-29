/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */
var ObjectUtils;
(function (ObjectUtils) {
    /**
     * Expands object x with properties from object y.
     * Modifies x in place and returns it.
     * @param x The target object to expand.
     * @param y The source object with properties to add to x.
     * @returns The expanded object x.
     */
    function expand(x, y) {
        const keys = Object.keys(y);
        for (const key of keys) {
            x[key] = y[key];
        }
        return x;
    }
    ObjectUtils.expand = expand;
    /**
     * Performs a deep equality check between two values.
     * @param x The first value to compare.
     * @param y The second value to compare.
     * @returns True if x and y are deeply equal, false otherwise.
     */
    function eq(x, y) {
        return obj_eq(x, y);
    }
    ObjectUtils.eq = eq;
    /**
     * Detects changed keys between two objects.
     * @param x The original object.
     * @param y The modified object.
     * @param include_nested Whether to include nested changed keys.
     * @returns An array of changed keys or null if no changes.
     */
    function detect_changes(x, y, include_nested = false) {
        return obj_eq(x, y, true, include_nested);
    }
    ObjectUtils.detect_changes = detect_changes;
    /**
     * Renames keys in an object.
     * @param obj The object to rename keys in.
     * @param rename An array of [oldKey, newKey] pairs.
     * @param remove An array of keys to remove from the object.
     * @returns The modified object.
     */
    function rename_keys(obj, rename = [], remove = []) {
        // remove keys
        for (const key of remove) {
            delete obj[key];
        }
        // rename pairs
        for (const [oldKey, newKey] of rename) {
            if (oldKey in obj) {
                obj[newKey] = obj[oldKey];
                delete obj[oldKey];
            }
        }
        return obj;
    }
    ObjectUtils.rename_keys = rename_keys;
    /**
     * Performs a deep copy of an object.
     * Does not support classes, only primitive objects.
     * @param obj The object to deep copy.
     * @returns A deep copy of the object.
     */
    function deep_copy(obj) {
        return deep_copy_internal(obj);
    }
    ObjectUtils.deep_copy = deep_copy;
    /**
     * Deletes keys from an object recursively, including nested objects and arrays.
     * @param obj The object to modify.
     * @param remove_keys An array of keys to remove.
     * @returns The modified object.
     */
    function delete_recursively(obj, remove_keys = []) {
        function clean(o) {
            if (Array.isArray(o)) {
                for (const item of o) {
                    if (item && typeof item === 'object')
                        clean(item);
                }
            }
            else if (o && typeof o === 'object') {
                for (const key of Object.keys(o)) {
                    if (remove_keys.includes(key)) {
                        delete o[key];
                    }
                    else if (o[key] && typeof o[key] === 'object') {
                        clean(o[key]);
                    }
                }
            }
        }
        clean(obj);
        return obj;
    }
    ObjectUtils.delete_recursively = delete_recursively;
    /**
     * Create a partial copy of an object with only the specified keys.
     */
    function partial_copy(obj, keys) {
        const out = {};
        for (const key of keys) {
            if (key in obj) {
                out[key] = obj[key];
            }
        }
        return out;
    }
    ObjectUtils.partial_copy = partial_copy;
    // Internal helper: deep equality / change detection
    function obj_eq(x, y, detect_keys = false, detect_keys_nested = false) {
        if (typeof x !== typeof y) {
            return false;
        }
        else if (x instanceof String) {
            return x.toString() === y.toString();
        }
        else if (Array.isArray(x)) {
            if (!Array.isArray(y) || x.length !== y.length) {
                return false;
            }
            for (let i = 0; i < x.length; i++) {
                if (!obj_eq(x[i], y[i])) {
                    return false;
                }
            }
            return true;
        }
        else if (x && typeof x === 'object') {
            const changes = [];
            const x_keys = Object.keys(x);
            const y_keys = Object.keys(y);
            if (x_keys.length !== y_keys.length) {
                return false;
            }
            for (const key of x_keys) {
                const result = obj_eq(x[key], y[key], detect_keys, detect_keys_nested);
                if (detect_keys) {
                    if (result === true) {
                        changes.push(key);
                    }
                    else if (Array.isArray(result) && result.length > 0) {
                        changes.push(key);
                        if (detect_keys_nested) {
                            changes.push(...result);
                        }
                    }
                }
                else if (result !== true) {
                    return false;
                }
            }
            return detect_keys ? (changes.length ? changes : null) : true;
        }
        else {
            return x === y;
        }
    }
    // Internal helper: deep copy implementation
    function deep_copy_internal(obj) {
        if (Array.isArray(obj)) {
            const copy = [];
            for (const item of obj) {
                copy.push(deep_copy_internal(item));
            }
            return copy;
        }
        else if (obj && obj instanceof String) {
            return new String(obj.toString());
        }
        else if (obj && typeof obj === 'object') {
            const copy = {};
            for (const key of Object.keys(obj)) {
                copy[key] = deep_copy_internal(obj[key]);
            }
            return copy;
        }
        else {
            return obj;
        }
    }
})(ObjectUtils || (ObjectUtils = {}));
export { ObjectUtils as Object };
// declare global {
//     interface ObjectConstructor {
//         /**
//          * Expands object x with properties from object y.
//          * Modifies x in place and returns it.
//          * @param x The target object to expand.
//          * @param y The source object with properties to add to x.
//          * @returns The expanded object x.
//          */
//         expand<T extends object, U extends object>(x: T, y: U): any;
//         /**
//          * Performs a deep equality check between two values.
//          * @param x The first value to compare.
//          * @param y The second value to compare.
//          * @returns True if x and y are deeply equal, false otherwise.
//          */
//         eq(x: any, y: any): boolean;
//         /**
//          * Detects changed keys between two objects.
//          * @param x The original object.
//          * @param y The modified object.
//          * @param include_nested Whether to include nested changed keys.
//          * @returns An array of changed keys or null if no changes.
//          */
//         detect_changes(x: any, y: any, include_nested?: boolean): string[] | null;
//         /**
//          * Renames keys in an object.
//          * @param obj The object to rename keys in.
//          * @param rename An array of [oldKey, newKey] pairs.
//          * @param remove An array of keys to remove from the object.
//          * @returns The modified object.
//          */
//         rename_keys(
//             obj: Record<string, any>,
//             rename?: [string, string][],
//             remove?: string[]
//         ): Record<string, any>;
//         /**
//          * Performs a deep copy of an object.
//          * Does not support classes, only primitive objects.
//          * @param obj The object to deep copy.
//          * @returns A deep copy of the object.
//          */
//         deep_copy<T>(obj: T): T;
//         /**
//          * Deletes keys from an object recursively, including nested objects and arrays.
//          * @param obj The object to modify.
//          * @param remove_keys An array of keys to remove.
//          * @returns The modified object.
//          */
//         delete_recursively<T>(obj: T, remove_keys?: string[]): T;
//     }
// }
// export {} // is required.
// // Internal function to check equals.
// function obj_eq(x: any, y: any): boolean;
// function obj_eq(x: any, y: any, detect_keys?: boolean, detect_keys_nested?: boolean): string[] | null;
// function obj_eq(x: any, y: any, detect_keys: boolean = false, detect_keys_nested: boolean = false) : boolean | string[] | null {
//     if (typeof x !== typeof y) { return false; }
//     else if (x instanceof String) {
//         return x.toString() === y.toString();
//     }
//     else if (Array.isArray(x)) {
//         if (!Array.isArray(y) || x.length !== y.length) { return false; }
//         for (let i = 0; i < x.length; i++) {
//             if (!obj_eq(x[i], y[i])) {
//                 return false;
//             }
//         }
//         return true;
//     }
//     else if (x != null && typeof x === "object") {
//         const changes: string[] = [];
//         const x_keys: string[] = Object.keys(x);
//         const y_keys: string[] = Object.keys(y);
//         if (x_keys.length !== y_keys.length) {
//             return false;
//         }
//         for (const key of x_keys) {
//             if (!y.hasOwnProperty(key)) {
//                 const result: any = obj_eq(x[key], y[key], detect_keys, detect_keys_nested)
//                 if (detect_keys) {
//                     if (result === true) {
//                         changes.append(key)
//                     }
//                     else if (result !== false && result != null && result.length > 0) {
//                         changes.append(key)
//                         if (detect_keys_nested) {
//                             changes.append(...result)
//                         }   
//                     }
//                 } else if (!result) {
//                     return false
//                 }
//             }
//         }
//         if (detect_keys) {
//             return changes.length === 0 ? null : changes;
//         }
//         return true;
//     }
//     else {
//         return x === y;
//     }
// }
// // Perform a deep copy on any type, except it does not support classes, only primitive objects.
// function deep_copy(obj) {
//     if (Array.isArray(obj)) {
//         const copy: any[] = [];
//         obj.walk((item) => {
//             copy.append(deep_copy(item));
//         })
//         return copy;
//     }
//     else if (obj !== null && obj instanceof String) {
//         return new String(obj.toString());
//     }
//     else if (obj !== null && typeof obj === "object") {
//         const copy = {};
//         const keys = Object.keys(obj);
//         const values = Object.values(obj);
//         for (let i = 0; i < keys.length; i++) {
//             copy[keys[i]] = deep_copy(values[i]);
//         }
//         return copy;
//     }
//     else {
//         return obj;
//     }
// }
// // Expand object x with object y, does not create a copy and returns nothing.
// Object.expand = function(x, y) {
//     const keys = Object.keys(y);
//     for (let i = 0; i < keys.length; i++) {
//         x[keys[i]] = y[keys[i]];
//     }
//     return x;
// }
// // Check if an object equals another object.
// // Causes UB wit actual classes.
// Object.eq = function(x, y): boolean {
//     return obj_eq(x, y);
// }
// // Detect changed keys between two objects, optionally include the changed nested object keys.
// // Returns `null` when no keys have changed.
// // Causes undefined behaviour when one of the x, y parameters is not an object.
// Object.detect_changes = function(x, y, include_nested = false) {
//     return obj_eq(x, y, true, include_nested);
// }
// // Rename object keys.
// Object.rename_keys = (obj = {}, rename = [["old", "new"]], remove = []) => {
//     remove.iterate((key) => {
//         delete obj[key];
//     })
//     rename.iterate((key) => {
//         obj[key[1]] = obj[key[0]];
//         delete obj[key[0]];
//     })
//     return obj;
// }
// // Perform a deep copy on any type, except it does not support classes, only primitive objects.
// /*  @docs:
//     @nav: Frontend
//     @chapter: Utils
//     @title: Deep copy
//     @desc: Perform a deep copy on any type, it does not support classes, only primitive objects.
//  */
// Object.deep_copy = (obj) => {
//     return deep_copy(obj);
// }
// // Delete keys from an object recursively, so also from the nested objects and from the nested objects nested within nested arrays.
// Object.delete_recursively = (obj, remove_keys: string[] = []) => {
//     const clean = (obj) => {
//         if (Array.isArray(obj)) {
//             obj.iterate((item: any) => {
//                 if (Array.isArray(item) || (typeof item === "object" && item != null)) {
//                     clean(item);
//                 }
//             })
//         } else {
//             Object.keys(obj).iterate((key: string) => {
//                 if (remove_keys.includes(key)) {
//                     delete obj[key];
//                 }
//                 else if (Array.isArray(obj[key]) || (typeof obj[key] === "object" && obj[key] != null)) {
//                     clean(obj[key]);
//                 }
//             })
//         }
//     }
//     clean(obj);
//     return obj;
// }
