/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh.
 */
export {};
// // ==================================================================
// // Strict Filter — v1
// // ==================================================================
// /**
//  * Create an exact object type that doesn't allow extra properties
//  * This is the key to making our types strict
//  */
// type Exact<T, Shape = T> = T extends Shape ?
//     T extends infer O ?
//     { [K in keyof O]: O[K] } &
//     { [K in Exclude<keyof T, keyof Shape>]?: never }
//     : never
//     : Shape;
// /**
//  * Strict filter fields that only allow schema paths.
//  * If a field is an array (e.g., string[]), allow operators for the *element* type
//  * (e.g., FilterOperators<string>) in addition to plain array equality and
//  * array-typed operators.
//  */
// type FilterFields<TSchema> = {
//     [K in Paths<TSchema>]?: PathValue<TSchema, K> extends (infer U)[]
//     // arrays: allow equality on the whole array OR element-wise operators
//     ? PathValue<TSchema, K> | mongodb.FilterOperators<U>
//     // non-arrays: keep original behavior
//     : PathValue<TSchema, K> | mongodb.FilterOperators<PathValue<TSchema, K>>;
// };
// /**
//  * Strict version of MongoDB Filter that only allows querying existing fields
//  * Supports logical operators ($and, $or, $nor) with recursive StrictFilter values.
//  * NOTE: We intentionally avoid mongodb.RootFilterOperators here to keep keys airtight.
//  * @template TSchema - The document schema type
//  */
// export type StrictFilter<TSchema> = Exact<
//     FilterFields<TSchema> & {
//         $and?: StrictFilter<TSchema>[];
//         $or?: StrictFilter<TSchema>[];
//         $nor?: StrictFilter<TSchema>[];
//     }
// >;
