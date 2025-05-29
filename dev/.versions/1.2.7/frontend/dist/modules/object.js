/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */
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
    else if (x != null && typeof x === "object") {
        const changes = [];
        const x_keys = Object.keys(x);
        const y_keys = Object.keys(y);
        if (x_keys.length !== y_keys.length) {
            return false;
        }
        for (const key of x_keys) {
            if (!y.hasOwnProperty(key)) {
                const result = obj_eq(x[key], y[key], detect_keys, detect_keys_nested);
                if (detect_keys) {
                    if (result === true) {
                        changes.append(key);
                    }
                    else if (result !== false && result != null && result.length > 0) {
                        changes.append(key);
                        if (detect_keys_nested) {
                            changes.append(...result);
                        }
                    }
                }
                else if (!result) {
                    return false;
                }
            }
        }
        if (detect_keys) {
            return changes.length === 0 ? null : changes;
        }
        return true;
    }
    else {
        return x === y;
    }
}
// Perform a deep copy on any type, except it does not support classes, only primitive objects.
function deep_copy(obj) {
    if (Array.isArray(obj)) {
        const copy = [];
        obj.iterate((item) => {
            copy.append(deep_copy(item));
        });
        return copy;
    }
    else if (obj !== null && obj instanceof String) {
        return new String(obj.toString());
    }
    else if (obj !== null && typeof obj === "object") {
        const copy = {};
        const keys = Object.keys(obj);
        const values = Object.values(obj);
        for (let i = 0; i < keys.length; i++) {
            copy[keys[i]] = deep_copy(values[i]);
        }
        return copy;
    }
    else {
        return obj;
    }
}
// Expand object x with object y, does not create a copy and returns nothing.
Object.expand = function (x, y) {
    const keys = Object.keys(y);
    for (let i = 0; i < keys.length; i++) {
        x[keys[i]] = y[keys[i]];
    }
    return x;
};
// Check if an object equals another object.
// Causes UB wit actual classes.
Object.eq = function (x, y) {
    return obj_eq(x, y);
};
// Detect changed keys between two objects, optionally include the changed nested object keys.
// Returns `null` when no keys have changed.
// Causes undefined behaviour when one of the x, y parameters is not an object.
Object.detect_changes = function (x, y, include_nested = false) {
    return obj_eq(x, y, true, include_nested);
};
// Rename object keys.
Object.rename_keys = (obj = {}, rename = [["old", "new"]], remove = []) => {
    remove.iterate((key) => {
        delete obj[key];
    });
    rename.iterate((key) => {
        obj[key[1]] = obj[key[0]];
        delete obj[key[0]];
    });
    return obj;
};
// Perform a deep copy on any type, except it does not support classes, only primitive objects.
/*  @docs:
    @nav: Frontend
    @chapter: Utils
    @title: Deep copy
    @desc: Perform a deep copy on any type, it does not support classes, only primitive objects.
 */
Object.deep_copy = (obj) => {
    return deep_copy(obj);
};
// Delete keys from an object recursively, so also from the nested objects and from the nested objects nested within nested arrays.
Object.delete_recursively = (obj, remove_keys = []) => {
    const clean = (obj) => {
        if (Array.isArray(obj)) {
            obj.iterate((item) => {
                if (Array.isArray(item) || (typeof item === "object" && item != null)) {
                    clean(item);
                }
            });
        }
        else {
            Object.keys(obj).iterate((key) => {
                if (remove_keys.includes(key)) {
                    delete obj[key];
                }
                else if (Array.isArray(obj[key]) || (typeof obj[key] === "object" && obj[key] != null)) {
                    clean(obj[key]);
                }
            });
        }
    };
    clean(obj);
    return obj;
};
export {};
