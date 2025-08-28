/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh.
 */

import * as vlib from "@vandenberghinc/vlib";

// -------------------------------------------------------------------

/**
 * Flatten a nested object to a flat `key.subkey` like object, suitable for {@link set} and {@link save} $inc operations.
 * @param obj The object to flatten.
 * @param prefix The prefix to use for the keys, used for recursive calls, new keys will be formatted as `{prefix}.key`.
 * @returns A flat object with keys in the format `key.subkey`.
 * @example
 * const nested = { a: { b: 1, c: { d: 2 } }, e: 3 };
 * const flat = flatten(nested);
 * // flat = { 'a.b': 1, 'a.c.d': 2, 'e': 3 }
 */
export function flatten<T extends Record<string, any>>(obj: T, prefix?: string): FlattenToDotNotation<T>;
export function flatten<T extends Record<string, any>, const Prefix extends string>(obj: T, prefix: Prefix): FlattenToDotNotation<T, Prefix>;
export function flatten<T extends Record<string, any>>(obj: T, prefix: string = ""): FlattenToDotNotation<T> {
    if (typeof obj !== "object" || obj == null || Array.isArray(obj)) {
        vlib.schema.throw_invalid_type("obj", obj, "object", true);
    }
    const result: Record<string, any> = {};
    for (const key in obj) {
        if (!Object.hasOwn(obj, key)) continue;  // ES2022
        if (vlib.object.is_plain(obj[key])) {
            Object.assign(result, flatten(obj[key], prefix ? `${prefix}.${key}` : key));
        } else {
            result[prefix ? `${prefix}.${key}` : key] = obj[key];
        }
    }
    return result as any;
}

// --------------------------------------------------------------------
// Converting a nested interface to a flat dotted notation, useful for mongodb type safety.

/**
 * Convert union to intersection
 */
type UnionToIntersection<U> =
    (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

/**
 * Check if a type should be flattened (is a plain object, not a primitive or array)
 */
type IsPlainObject<T> =
    T extends string | number | boolean | bigint | symbol | null | undefined | Date | RegExp | Function | any[]
    ? false
    : T extends object
    ? true
    : false;

/** Make all properties optional (used when recursing through optional parents) */
type MakeOptional<T> = { [P in keyof T]?: T[P] };

/** Depth decrementer for 25 levels: Prev25[N] = N - 1, Prev25[0] = never */
type Prev25 = [
    never, 0, 1, 2, 3, 4, 5, 6, 7, 8,
    9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
    19, 20, 21, 22, 23, 24, 25
];

/** Remove undefined from a type (used before object checks) */
type NonU<T> = Exclude<T, undefined>;

/**
 * Create dot notation paths from an object type.
 * - Handles optional parents by making *all* their dotted children optional.
 * - Stops recursing at depth 25.
 */
export type FlattenToDotNotation<
    T,
    Path extends string = "",
    D extends number = 25
> =
    [D] extends [never]
    ? {}
    : T extends object
    ? UnionToIntersection<{
        [K in keyof T]-?:
        K extends string | number
        ? (
            T[K] extends infer Raw
            ? (
                // If the non-undefined part is a plain object, recurse
                IsPlainObject<NonU<Raw>> extends true
                ? (
                    undefined extends Raw
                    // Optional parent -> make all children optional
                    ? MakeOptional<
                        FlattenToDotNotation<
                            NonU<Raw>,
                            Path extends "" ? `${K}` : `${Path}.${K}`,
                            Prev25[D]
                        >
                    >
                    : FlattenToDotNotation<
                        NonU<Raw>,
                        Path extends "" ? `${K}` : `${Path}.${K}`,
                        Prev25[D]
                    >
                )
                : (
                    // Leaf (primitive/array) -> emit final dotted key
                    undefined extends Raw
                    ? { [P in (Path extends "" ? `${K}` : `${Path}.${K}`)]?: NonU<Raw> }
                    : { [P in (Path extends "" ? `${K}` : `${Path}.${K}`)]: Raw }
                )
            )
            : never
        )
        : never
    }[keyof T]>
    : T;
