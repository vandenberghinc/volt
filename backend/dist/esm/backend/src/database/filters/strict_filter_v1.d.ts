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
type Paths<T, D extends number = 4> = [D] extends [never] ? never : T extends object ? {
    [K in keyof T]-?: K extends string | number ? `${K}` | (T[K] extends object ? T[K] extends ReadonlyArray<any> ? never : Paths<T[K], PathsPrev[D]> extends infer P ? P extends string ? `${K}.${P}` : never : never : never) : never;
}[keyof T] : '';
/**
 * Get the value type at a specific path in the schema
 */
type PathValue<T, P extends string> = P extends keyof T ? T[P] : P extends `${infer K}.${infer Rest}` ? K extends keyof T ? PathValue<T[K], Rest> : never : never;
type Expand<T> = {
    [K in keyof T]: T[K];
};
type CommonOpKeys = '$eq' | '$ne' | '$gt' | '$gte' | '$lt' | '$lte' | '$in' | '$nin' | '$exists' | '$type' | '$not';
type StringOnlyOpKeys = '$regex' | '$options';
type NumberOnlyOpKeys = '$mod' | '$bitsAllClear' | '$bitsAllSet' | '$bitsAnyClear' | '$bitsAnySet';
type GeoOpKeys = '$geoIntersects' | '$geoWithin' | '$near' | '$nearSphere';
/**
 * Field-level operators we allow.
 * Using Pick<...> *removes* any inherited `[key: string]: any]` index signature
 * so unknown operator keys will NOT type-check.
 */
type KnownFieldOps<V> = Pick<mongodb.FilterOperators<V>, CommonOpKeys | StringOnlyOpKeys | NumberOnlyOpKeys | GeoOpKeys>;
/**
 * For whole-array field (not element-wise) we only allow a few generic checks.
 * This avoids array-of-arrays `$in` through `FilterOperators<A>`.
 */
type ArrayFieldGenericOps<A> = Pick<mongodb.FilterOperators<A>, '$exists' | '$type' | '$not'>;
type Elem<T> = T extends ReadonlyArray<infer U> ? U : T extends Array<infer U> ? U : never;
type ElemMatchValue<U> = U extends object ? StrictFilter<U> : KnownFieldOps<U>;
type StrictArrayLevelOperators<A> = A extends ReadonlyArray<infer U> | (infer U)[] ? {
    $all?: ReadonlyArray<U>;
    $size?: number;
    $elemMatch?: ElemMatchValue<U>;
} : never;
/**
 * Full value type allowed for an array field — *without* ever using
 * `mongodb.FilterOperators<A>` wholesale (prevents indexer leakage and
 * array-of-arrays `$in`).
 */
type StrictArrayValue<A> = A extends ReadonlyArray<any> | any[] ? A | Elem<A> | KnownFieldOps<Elem<A>> | ArrayFieldGenericOps<A> | StrictArrayLevelOperators<A> : never;
type DotOnlyPaths<T> = Exclude<Paths<T>, Extract<keyof T, string>>;
type DotPathFilters<T> = {
    [K in DotOnlyPaths<T>]?: PathValue<T, K> extends ReadonlyArray<any> | any[] ? StrictArrayValue<PathValue<T, K>> : PathValue<T, K> | KnownFieldOps<PathValue<T, K>>;
};
type TopFieldKeys<T> = '_id' | Extract<keyof mongodb.EnhancedOmit<T, '_id'>, string>;
type TopFieldFilters<T> = {
    [K in TopFieldKeys<T>]?: K extends keyof T ? (T[K] extends ReadonlyArray<any> | any[] ? StrictArrayValue<T[K]> : T[K] | KnownFieldOps<T[K]>) : mongodb.Condition<mongodb.WithId<T>[K]>;
};
type StrictLogicalOps<T> = {
    $and?: StrictFilter<T>[];
    $or?: StrictFilter<T>[];
    $nor?: StrictFilter<T>[];
};
type StrictOtherRootOps<T> = Partial<Pick<mongodb.RootFilterOperators<T>, '$expr' | '$jsonSchema' | '$text' | '$where' | '$comment' | '$rand'>>;
type StrictRootOperators<T> = StrictLogicalOps<T> & StrictOtherRootOps<T>;
/**
 * StrictFilter:
 *  • Unknown keys rejected on object literals (no string index signature)
 *  • Dot-notation paths allowed & typed
 *  • Arrays keep strict $elemMatch/$size/$all behavior
 *  • Root operators optional and typed to the driver
 *  • Structurally compatible with mongodb.Filter<T>
 */
export type StrictFilter<T> = Expand<TopFieldFilters<T> & DotPathFilters<T> & StrictRootOperators<T>>;
export {};
