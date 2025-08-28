/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh.
 */

import * as mongodb from 'mongodb';

/**
 * Helper type for recursive depth limiting
 */
type PathsPrev = [never, 0, 1, 2, 3, 4];

/**
 * Extract all valid paths from a schema including nested paths
 * Supports dot notation for nested objects
 */
type Paths<T, D extends number = 4> = [D] extends [never]
    ? never
    : T extends object
    ? {
        [K in keyof T]-?: K extends string | number
        ? `${K}` | (
            T[K] extends object
            ? T[K] extends ReadonlyArray<any> // do not recurse into arrays
            ? never
            : Paths<T[K], PathsPrev[D]> extends infer P
            ? P extends string ? `${K}.${P}` : never
            : never
            : never
        )
        : never
    }[keyof T]
    : '';

/**
 * Get the value type at a specific path in the schema
 */
type PathValue<T, P extends string> =
    P extends keyof T
    ? T[P]
    : P extends `${infer K}.${infer Rest}`
    ? K extends keyof T
    ? PathValue<T[K], Rest>
    : never
    : never;

// ==================================================================
// Strict Filter — curated operators & final shape
// ==================================================================

type Expand<T> = { [K in keyof T]: T[K] };

// --------------------------------------
// Curated operator key sets (no indexer)
// --------------------------------------

type CommonOpKeys =
    | '$eq' | '$ne' | '$gt' | '$gte' | '$lt' | '$lte'
    | '$in' | '$nin'
    | '$exists' | '$type'
    | '$not';

type StringOnlyOpKeys = '$regex' | '$options';
type NumberOnlyOpKeys = '$mod' | '$bitsAllClear' | '$bitsAllSet' | '$bitsAnyClear' | '$bitsAnySet';
type GeoOpKeys = '$geoIntersects' | '$geoWithin' | '$near' | '$nearSphere';

/**
 * Field-level operators we allow.
 * Using Pick<...> removes any inherited index signature,
 * so unknown operator keys will NOT type-check.
 */
type KnownFieldOps<V> = Pick<
    mongodb.FilterOperators<V>,
    CommonOpKeys | StringOnlyOpKeys | NumberOnlyOpKeys | GeoOpKeys
>;

/**
 * For whole-array field (not element-wise) we only allow a few generic checks.
 * This avoids array-of-arrays `$in` through `FilterOperators<A>`.
 */
type ArrayFieldGenericOps<A> = Pick<mongodb.FilterOperators<A>, '$exists' | '$type' | '$not'>;

// -------------------------
// Array handling (strict)
// -------------------------

// Element type of array
type Elem<T> =
    T extends ReadonlyArray<infer U> ? U :
    T extends Array<infer U> ? U :
    never;

// $elemMatch value: StrictFilter for object elements; curated ops for primitives
type ElemMatchValue<U> = U extends object ? StrictFilter<U> : KnownFieldOps<U>;

// Array-level operators ($all/$size/strict $elemMatch)
type StrictArrayLevelOperators<A> =
    A extends ReadonlyArray<infer U> | (infer U)[]
    ? {
        $all?: ReadonlyArray<U>;
        $size?: number;
        $elemMatch?: ElemMatchValue<U>;
    }
    : never;

/**
 * Full value type allowed for an array field — *without* ever using
 * `mongodb.FilterOperators<A>` wholesale (prevents indexer leakage and
 * array-of-arrays `$in`).
 */
type StrictArrayValue<A> =
    A extends ReadonlyArray<any> | any[]
    ? // equality on whole array
    | A
    // equality on a single element
    | Elem<A>
    // element-wise operators (e.g. $in, $gte ...) on the element type
    | KnownFieldOps<Elem<A>>
    // a few safe field-level ops that apply to the whole array field
    | ArrayFieldGenericOps<A>
    // array-level operators with strict $elemMatch
    | StrictArrayLevelOperators<A>
    : never;

// -------------------------
// Dot paths & top-level
// -------------------------

// Only the dot-notation paths (exclude top-level keys)
type DotOnlyPaths<T> = Exclude<Paths<T>, Extract<keyof T, string>>;

// Dot-path filters (strict array behavior)
type DotPathFilters<T> = {
    [K in DotOnlyPaths<T>]?: PathValue<T, K> extends ReadonlyArray<any> | any[]
    ? StrictArrayValue<PathValue<T, K>>
    : PathValue<T, K> | KnownFieldOps<PathValue<T, K>>;
};

// --- TOP-LEVEL KEYS ---
// Mirror the driver's top-level mapping via WithId<T> and remap to string keys.
type TopFieldFilters<T> = {
    [K in keyof mongodb.WithId<T> as K extends string ? K : never]?:
    // If K is an actual key of T, we apply strict array/value behavior.
    K extends keyof T
    ? (
        T[K] extends ReadonlyArray<any> | any[]
        ? StrictArrayValue<T[K]>
        : T[K] | KnownFieldOps<T[K]>
    )
    // Otherwise (e.g. "_id" when T doesn't declare it), use the driver's Condition type.
    : mongodb.Condition<mongodb.WithId<T>[K]>;
};

// -------------------------
// Root operators
// -------------------------

// Keep logical ops strict/recursive
type StrictLogicalOps<T> = {
    $and?: StrictFilter<T>[];
    $or?: StrictFilter<T>[];
    $nor?: StrictFilter<T>[];
};

// Borrow the driver's exact root-op types, but optional
type StrictOtherRootOps<T> = Partial<
    Pick<
        mongodb.RootFilterOperators<T>,
        '$expr' | '$jsonSchema' | '$text' | '$where' | '$comment' | '$rand'
    >
>;

// Final root-ops shape used by StrictFilter
type StrictRootOperators<T> = StrictLogicalOps<T> & StrictOtherRootOps<T>;

/**
 * StrictFilter:
 *  • Unknown keys rejected on object literals (no string index signature)
 *  • Dot-notation paths allowed & typed
 *  • Arrays keep strict $elemMatch/$size/$all behavior
 *  • Root operators optional and typed to the driver
 *  • Assignable to mongodb.Filter<T> even at generic boundaries
 */
export type StrictFilter<T> = Expand<
    TopFieldFilters<T> &
    DotPathFilters<T> &
    StrictRootOperators<T>
>;
