import type { ObjectId, Document as MongoDocument, WithId } from "mongodb";
type KnownKeys<T> = {
    [K in keyof T]-?: string extends K ? never : number extends K ? never : symbol extends K ? never : K;
}[keyof T];
type Comparable = number | bigint | Date;
type Elem<T> = T extends readonly (infer U)[] ? U : never;
type IsArray<T> = T extends readonly any[] ? true : false;
type Defined<T> = Exclude<T, undefined>;
type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
type Join<K, P> = K extends string | number ? P extends string | number ? `${K}.${P}` : never : never;
/** Dot paths over object properties, ignoring arrays. Depth default = 5. */
export type DotPaths<T, D extends number = 5> = [D] extends [never] ? never : T extends object ? {
    [K in KnownKeys<T>]: T[K] extends object ? IsArray<T[K]> extends true ? K & string : (K & string) | Join<K & string, DotPaths<T[K], Prev[D]>> : K & string;
}[KnownKeys<T>] : never;
/** Value type at a given dot-path (subset handles up to depth ~5 cleanly). */
export type PathValue<T, P extends string> = P extends `${infer K}.${infer R}` ? K extends keyof T ? PathValue<T[K], R> : never : P extends keyof T ? T[P] : never;
export type BSONTypeName = "double" | "string" | "object" | "array" | "binData" | "undefined" | "objectId" | "bool" | "date" | "null" | "regex" | "dbPointer" | "javascript" | "symbol" | "javascriptWithScope" | "int" | "timestamp" | "long" | "decimal" | "minKey" | "maxKey";
export type BSONType = BSONTypeName | number;
export type Position = [number, number] | [number, number, number];
export type Point = {
    type: "Point";
    coordinates: Position;
};
export type LineString = {
    type: "LineString";
    coordinates: Position[];
};
export type Polygon = {
    type: "Polygon";
    coordinates: Position[][];
};
export type MultiPoint = {
    type: "MultiPoint";
    coordinates: Position[];
};
export type MultiLineString = {
    type: "MultiLineString";
    coordinates: Position[][];
};
export type MultiPolygon = {
    type: "MultiPolygon";
    coordinates: Position[][][];
};
export type Geometry = Point | LineString | Polygon | MultiPoint | MultiLineString | MultiPolygon;
type AllFieldPaths<T extends MongoDocument> = DotPaths<WithId<T>> | KnownKeys<WithId<T>>;
export type FieldRef<T extends MongoDocument> = `$${AllFieldPaths<T> & string}`;
type StrictExprString<T extends MongoDocument> = FieldRef<T> | (string extends infer S ? S extends `${string}` ? S extends FieldRef<T> ? S : never : S : never);
type NonStrictExprString<T extends MongoDocument, S> = S extends `$${infer Path}` ? Path extends AllFieldPaths<T> ? S : never : S;
type ExprValue<T extends MongoDocument> = number | boolean | null | Date | StrictExprString<T>;
/** Strict expression tree for `$expr`. */
export type Expr<T extends MongoDocument> = ExprValue<T> | Expr<T>[] | {
    $add?: Expr<T>[];
    $subtract?: [Expr<T>, Expr<T>];
    $multiply?: Expr<T>[];
    $divide?: [Expr<T>, Expr<T>];
    $mod?: [Expr<T>, Expr<T>];
    $eq?: [Expr<T>, Expr<T>];
    $ne?: [Expr<T>, Expr<T>];
    $gt?: [Expr<T>, Expr<T>];
    $gte?: [Expr<T>, Expr<T>];
    $lt?: [Expr<T>, Expr<T>];
    $lte?: [Expr<T>, Expr<T>];
    $and?: Expr<T>[];
    $or?: Expr<T>[];
    $not?: Expr<T>;
    $concat?: Expr<T>[];
    $size?: Expr<T>;
    $in?: [Expr<T> | NonStrictExprString<T, string>, Expr<T>];
    $toString?: Expr<T>;
    $toInt?: Expr<T>;
    $toDouble?: Expr<T>;
    $toDecimal?: Expr<T>;
    $toLong?: Expr<T>;
    $toBool?: Expr<T>;
    $toDate?: Expr<T>;
};
type BitwiseOps<T> = [T] extends [number | bigint] ? {
    $bitsAllClear?: number;
    $bitsAllSet?: number;
    $bitsAnyClear?: number;
    $bitsAnySet?: number;
} : {};
type NumericComparators<T> = [T] extends [Comparable] ? {
    $gt?: T;
    $gte?: T;
    $lt?: T;
    $lte?: T;
    $mod?: T extends number | bigint ? [number, number] : never;
} : {};
/**
 * String ops:
 * - `$regex` optional overall, but `$options` is only legal when `$regex` is present.
 */
type StringRegexOps = {
    $regex: RegExp | string;
    $options?: string;
} | {
    $regex?: undefined;
    $options?: undefined;
};
type StringOps<T> = [T] extends [string] ? StringRegexOps : {};
type ArrayOps<T> = [T] extends [readonly any[]] ? {
    $size?: number;
    $all?: Elem<T>[];
    $elemMatch?: Elem<T> extends object ? StrictFilter<Elem<T>> | FieldOperators<Elem<T>> : FieldOperators<Elem<T>>;
    $in?: Elem<T>[];
    $nin?: Elem<T>[];
} : {};
type ExistsOp = {
    $exists?: boolean;
};
/**
 * `$type` differs for string fields for driver-interop:
 * - For string/regex fields, the mongodb driver narrows *`$type`* to **names only** (no numeric codes).
 * - For other fields we allow both numeric codes and names.
 */
type TypeOpByField<T> = {
    $type?: [Defined<T>] extends [string] ? BSONTypeName | BSONTypeName[] : BSONType | BSONType[];
};
/**
 * For arrays, omit $in/$nin here to avoid the `string[][] & string[]` intersection.
 * For union types, properly handle $in and $nin to accept arrays of the union values.
 */
type EqualityOps<T> = [T] extends [readonly any[]] ? {
    $eq?: T;
    $ne?: T;
} : {
    $eq?: T;
    $ne?: T;
    $in?: T[];
    $nin?: T[];
};
/** Geospatial operators (field-level) */
type GeoOps = {
    $geoWithin?: {
        $geometry: Geometry;
    } | {
        $box: [Position, Position];
    } | {
        $polygon: Position[];
    } | {
        $centerSphere: [Position, number];
    };
    $geoIntersects?: {
        $geometry: Geometry;
    };
    /**
     * `$near`/`$nearSphere`: accept only GeoJSON Point (+ optional distance bounds).
     * (Unit tests expect raw coordinate arrays to be rejected.)
     */
    $near?: Point & {
        $maxDistance?: number;
        $minDistance?: number;
    };
    $nearSphere?: Point & {
        $maxDistance?: number;
        $minDistance?: number;
    };
};
/** Operators excluding equality — used as the inner type for $not */
type FieldOperatorsBase<T> = ExistsOp & TypeOpByField<T> & NumericComparators<Defined<T>> & StringOps<Defined<T>> & ArrayOps<T extends undefined ? never : T> & BitwiseOps<Defined<T>> & GeoOps;
type NotInner<T> = Omit<FieldOperatorsBase<T>, "$not">;
export type FieldOperators<T> = EqualityOps<Defined<T>> & FieldOperatorsBase<T> & {
    /**
     * Field-level $not wrapping EITHER a regex (only for string fields)
     * OR any non-equality operators. (Equality inside $not is not allowed.)
     *
     * This shape also matches the driver's `FilterOperators<string | RegExp | BSONRegExp>`
     * so `StrictFilter<T>` remains assignable to `mongodb.Filter<T>`.
     */
    $not?: (Defined<T> extends string ? RegExp : never) | NotInner<Defined<T>>;
};
/** Value OR operators for a given field type.
 * For strings, allow bare RegExp because the driver accepts `{ name: /x/ }`.
 */
export type FieldCondition<T> = [T] extends [string] ? string | RegExp | FieldOperators<T> : Defined<T> | FieldOperators<T>;
type IdField = {
    _id?: ObjectId | FieldOperators<ObjectId>;
};
type FieldQueryMap<T extends MongoDocument> = {
    [K in KnownKeys<T>]?: FieldCondition<T[K]>;
};
type DotPathQueryMap<T extends MongoDocument> = {
    [P in DotPaths<T>]?: FieldCondition<PathValue<T, P>>;
};
/**
 * Use `WithId<T>` in logicals for driver interop (driver defines logicals in terms of `Filter<WithId<T>>`).
 * That lets `StrictFilter<T>` be assignable to `Filter<T>` and also makes arrays of `StrictFilter<T>`
 * usable where the driver expects `Filter<WithId<T>>[]` (because `StrictFilter<T>` is a subtype).
 */
type LogicalOps<T extends MongoDocument> = {
    $and?: StrictFilter<WithId<T>>[];
    $or?: StrictFilter<WithId<T>>[];
    $nor?: StrictFilter<WithId<T>>[];
};
/** Top-level evaluation-ish operators accepted by find() / $match */
type TopEvalOps<T extends MongoDocument> = {
    $expr?: Expr<T>;
    $jsonSchema?: unknown;
    /**
     * Accept a $where function compatible with both our tests (WithId<T>) and the driver
     * (which spells it as WithId<WithId<T>>). The intersection makes it callable as either.
     */
    $where?: string | (((this: WithId<T>) => boolean) & ((this: WithId<WithId<T>>) => boolean));
    $text?: {
        $search: string;
        $language?: string;
        $caseSensitive?: boolean;
        $diacriticSensitive?: boolean;
    };
    $comment?: string;
};
/**
 * StrictFilter<T>
 * - Only allows T's declared keys (plus dot paths) and legal top-level operators.
 * - Field operators strictly depend on the field type.
 * - `$expr` has a strongly-typed expression tree with field refs limited to known paths.
 * - Includes support for _id field which is always present in MongoDB documents.
 *
 * NOTE: No string index signatures anywhere — TS excess property checks will catch typos.
 */
export type StrictFilter<TSchema extends MongoDocument> = IdField & FieldQueryMap<TSchema> & DotPathQueryMap<TSchema> & LogicalOps<TSchema> & TopEvalOps<TSchema>;
export {};
