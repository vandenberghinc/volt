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
type Paths<T, D extends number = 4> = [D] extends [never] ? never : T extends object
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
type PathValue<T, P extends string> = P extends keyof T
    ? T[P]
    : P extends `${infer K}.${infer Rest}`
    ? K extends keyof T
    ? PathValue<T[K], Rest>
    : never
    : never;

/**
 * MongoDB bitwise operations — exactly one of 'and' | 'or' | 'xor',
 * each requiring an integer value per the driver typings.
 */
type BitwiseOperators =
    | { and: mongodb.IntegerType }
    | { or: mongodb.IntegerType }
    | { xor: mongodb.IntegerType };


/**
 * Create an exact object type that doesn't allow extra properties
 * This is the key to making our types strict
 */
type Exact<T, Shape = T> = T extends Shape ?
    T extends infer O ?
    { [K in keyof O]: O[K] } &
    { [K in Exclude<keyof T, keyof Shape>]?: never }
    : never
    : Shape;


// ==================================================================
// Strict Update Filter.
// ==================================================================

/**
 * Strict set/update fields
 */
type SetFields<TSchema> = Exact<{
    [K in Paths<TSchema>]?: PathValue<TSchema, K>;
}>;

/**
 * Strict numeric fields for math operations
 */
type NumericFields<TSchema> = Exact<{
    [K in Paths<TSchema> as PathValue<TSchema, K> extends number | undefined ? K : never]?: number;
}>;

/**
 * Strict unset fields
 */
type UnsetFields<TSchema> = Exact<{
    [K in Paths<TSchema>]?: '' | true | 1; // only the literal 1 (or '' | true)
}>;

/**
 * Strict rename fields
 */
type RenameFields<TSchema> = Exact<{
    [K in Paths<TSchema>]?: string;
}>;

/**
 * Strict date fields
 */
type DateFields<TSchema> = Exact<{
    [K in Paths<TSchema> as PathValue<TSchema, K> extends Date | mongodb.Timestamp | undefined ? K : never]?:
    true | { $type: 'date' | 'timestamp' };
}>;

/**
 * Strict array fields for array operations
 */
type ArrayAddFields<TSchema> = Exact<{
    [K in Paths<TSchema> as PathValue<TSchema, K> extends any[] ? K : never]?:
    PathValue<TSchema, K> extends (infer U)[] ? U | { $each: U[] } : never;
}>;

type ArrayPopFields<TSchema> = Exact<{
    [K in Paths<TSchema> as PathValue<TSchema, K> extends any[] ? K : never]?: 1 | -1;
}>;

type ArrayPullFields<TSchema> = Exact<{
    [K in Paths<TSchema> as PathValue<TSchema, K> extends any[] ? K : never]?:
    PathValue<TSchema, K> extends (infer U)[] ? U | mongodb.FilterOperators<U> : never;
}>;

type ArrayPushFields<TSchema> = Exact<{
    [K in Paths<TSchema> as PathValue<TSchema, K> extends any[] ? K : never]?:
    PathValue<TSchema, K> extends (infer U)[]
    ? U | mongodb.ArrayOperator<PathValue<TSchema, K>>
    : never;
}>;

type ArrayPullAllFields<TSchema> = Exact<{
    [K in Paths<TSchema> as PathValue<TSchema, K> extends any[] ? K : never]?:
    PathValue<TSchema, K> extends (infer U)[] ? U[] : never;
}>;

/**
 * Strict bit fields
 */
type BitFields<TSchema> = Exact<{
    [K in Paths<TSchema> as PathValue<TSchema, K> extends number | undefined ? K : never]?: BitwiseOperators;
}>;

/**
 * Strict version of MongoDB UpdateFilter that only allows updating existing fields
 * @template TSchema - The document schema type
 */
export type StrictUpdateFilter<TSchema> = Exact<{
    /**
     * The $set operator replaces the value of a field with the specified value.
     */
    $set?: SetFields<TSchema>;

    /**
     * The $setOnInsert operator assigns values to fields during an upsert only when inserting a new document.
     */
    $setOnInsert?: SetFields<TSchema>;

    /**
     * The $unset operator deletes a particular field.
     */
    $unset?: UnsetFields<TSchema>;

    /**
     * The $inc operator increments a field by a specified value.
     */
    $inc?: NumericFields<TSchema>;

    /**
     * The $mul operator multiplies the value of a field by a number.
     */
    $mul?: NumericFields<TSchema>;

    /**
     * The $min operator updates the value of the field to a specified value if the specified value is less than the current value of the field.
     */
    $min?: SetFields<TSchema>;

    /**
     * The $max operator updates the value of the field to a specified value if the specified value is greater than the current value of the field.
     */
    $max?: SetFields<TSchema>;

    /**
     * The $currentDate operator sets the value of a field to the current date.
     */
    $currentDate?: DateFields<TSchema>;

    /**
     * The $rename operator updates the name of a field.
     */
    $rename?: RenameFields<TSchema>;

    /**
     * The $addToSet operator adds a value to an array unless the value is already present.
     */
    $addToSet?: ArrayAddFields<TSchema>;

    /**
     * The $pop operator removes the first or last element of an array.
     */
    $pop?: ArrayPopFields<TSchema>;

    /**
     * The $pull operator removes from an array all instances of a value or values that match a specified condition.
     */
    $pull?: ArrayPullFields<TSchema>;

    /**
     * The $push operator appends a specified value to an array.
     */
    $push?: ArrayPushFields<TSchema>;

    /**
     * The $pullAll operator removes all instances of the specified values from an array.
     */
    $pullAll?: ArrayPullAllFields<TSchema>;

    /**
     * The $bit operator performs a bitwise update of a field.
     */
    $bit?: BitFields<TSchema>;
}>;