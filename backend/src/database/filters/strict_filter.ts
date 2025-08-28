// strict-filter.ts
import type * as mongodb from 'mongodb';
import type {
    Document as MongoDocument,
    Filter as MongoFilter,
    ObjectId,
    WithId,
    Collection,
} from 'mongodb';

/* ---------------------------------- Utils --------------------------------- */

type KnownKeys<T> = {
    [K in keyof T]-?: string extends K
    ? never
    : number extends K
    ? never
    : symbol extends K
    ? never
    : K
}[keyof T];

type Comparable = number | bigint | Date;

type Elem<T> = T extends readonly (infer U)[] ? U : never;
type IsArray<T> = T extends readonly any[] ? true : false;
type Defined<T> = Exclude<T, undefined>;

// Depth limiter for dot-path generation.
type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
type Join<K, P> = K extends string | number
    ? P extends string | number
    ? `${K}.${P}`
    : never
    : never;

/** Dot paths over object properties, ignoring arrays. Depth default = 5. */
export type DotPaths<T, D extends number = 5> = [D] extends [never]
    ? never
    : T extends object
    ? {
        [K in KnownKeys<T>]: T[K] extends object
        ? IsArray<T[K]> extends true
        ? K & string
        : K & string | Join<K & string, DotPaths<T[K], Prev[D]>>
        : K & string
    }[KnownKeys<T>]
    : never;

/** Value type at a given dot-path (subset handles up to depth ~5 cleanly). */
export type PathValue<T, P extends string> =
    P extends `${infer K}.${infer R}`
    ? K extends keyof T
    ? PathValue<T[K], R>
    : never
    : P extends keyof T
    ? T[P]
    : never;

/* ------------------------------ BSON type names --------------------------- */

export type BSONTypeName =
    | 'double'
    | 'string'
    | 'object'
    | 'array'
    | 'binData'
    | 'undefined'
    | 'objectId'
    | 'bool'
    | 'date'
    | 'null'
    | 'regex'
    | 'dbPointer'
    | 'javascript'
    | 'symbol'
    | 'javascriptWithScope'
    | 'int'
    | 'timestamp'
    | 'long'
    | 'decimal'
    | 'minKey'
    | 'maxKey';

export type BSONType = BSONTypeName | number;

/* --------------------------- GeoJSON (lightweight) ------------------------ */

export type Position = [number, number] | [number, number, number];
export type Point = { type: 'Point'; coordinates: Position };
export type LineString = { type: 'LineString'; coordinates: Position[] };
export type Polygon = { type: 'Polygon'; coordinates: Position[][] };
export type MultiPoint = { type: 'MultiPoint'; coordinates: Position[] };
export type MultiLineString = { type: 'MultiLineString'; coordinates: Position[][] };
export type MultiPolygon = { type: 'MultiPolygon'; coordinates: Position[][][] };
export type Geometry =
    | Point
    | LineString
    | Polygon
    | MultiPoint
    | MultiLineString
    | MultiPolygon;

/* ------------------------------- $expr typing ----------------------------- */

export type FieldRef<T extends MongoDocument> = `$${DotPaths<T>}`;
type ExprLiteral = string | number | boolean | null | Date;

/** Strict(ish) expression tree good for `$expr` usage. */
export type Expr<T extends MongoDocument> =
    | ExprLiteral
    | FieldRef<T>
    | Expr<T>[]
    | {
        // arithmetic
        $add?: Expr<T>[];
        $subtract?: [Expr<T>, Expr<T>];
        $multiply?: Expr<T>[];
        $divide?: [Expr<T>, Expr<T>];
        $mod?: [Expr<T>, Expr<T>];

        // comparison
        $eq?: [Expr<T>, Expr<T>];
        $ne?: [Expr<T>, Expr<T>];
        $gt?: [Expr<T>, Expr<T>];
        $gte?: [Expr<T>, Expr<T>];
        $lt?: [Expr<T>, Expr<T>];
        $lte?: [Expr<T>, Expr<T>];

        // boolean
        $and?: Expr<T>[];
        $or?: Expr<T>[];
        $not?: Expr<T>;

        // array/string helpers (useful subset)
        $concat?: Expr<T>[];
        $size?: Expr<T>;
        $in?: [Expr<T>, Expr<T>]; // [needle, haystack-array]

        // type/date coercions (subset)
        $toString?: Expr<T>;
        $toInt?: Expr<T>;
        $toDouble?: Expr<T>;
        $toDecimal?: Expr<T>;
        $toLong?: Expr<T>;
        $toBool?: Expr<T>;
        $toDate?: Expr<T>;
    };

/* ---------------------------- Field operator maps ------------------------- */

type BitwiseOps<T> = T extends number | bigint
    ? {
        $bitsAllClear?: number;
        $bitsAllSet?: number;
        $bitsAnyClear?: number;
        $bitsAnySet?: number;
    }
    : {};

type NumericComparators<T> = T extends Comparable
    ? {
        $gt?: T;
        $gte?: T;
        $lt?: T;
        $lte?: T;
        $mod?: T extends number | bigint ? [number, number] : never;
    }
    : {};

type StringOps<T> = T extends string
    ? {
        $regex?: RegExp | string;
        $options?: string;
    }
    : {};

type ArrayOps<T> = T extends readonly any[]
    ? {
        $size?: number;
        $all?: Elem<T>[];
        $elemMatch?: Elem<T> extends object ? StrictFilter<Elem<T>> | FieldOperators<Elem<T>> : FieldOperators<Elem<T>>;
        $in?: Elem<T>[];
        $nin?: Elem<T>[];
    }
    : {};

type ExistsAndType = {
    $exists?: boolean;
    $type?: BSONType | BSONType[];
};

/** For arrays, omit $in/$nin here to avoid the `string[][] & string[]` intersection. */
type EqualityOps<T> = T extends readonly any[]
    ? {
        $eq?: T;
        $ne?: T;
    }
    : {
        $eq?: T;
        $ne?: T;
        $in?: T[];
        $nin?: T[];
    };

export type FieldOperators<T> =
    EqualityOps<Defined<T>> &
    ExistsAndType &
    NumericComparators<Defined<T>> &
    StringOps<Defined<T>> &
    ArrayOps<T extends undefined ? never : T> &
    BitwiseOps<Defined<T>> & {
        /** Field-level $not wrapping the SAME field's operators (or regex for strings). */
        $not?: Omit<FieldOperators<Defined<T>>, '$not'> | (Defined<T> extends string ? RegExp : never);

        // Geospatial (field-level)
        $geoWithin?:
        | { $geometry: Geometry }
        | { $box: [Position, Position] }
        | { $polygon: Position[] }
        | { $centerSphere: [Position, number] };

        $geoIntersects?: { $geometry: Geometry };
        $near?: Position | (Point & { $maxDistance?: number; $minDistance?: number });
        $nearSphere?: Position | (Point & { $maxDistance?: number; $minDistance?: number });
    };

/** Value OR operators for a given field type.
 * For strings, allow bare RegExp because the driver accepts `{ name: /x/ }`.
 */
export type FieldCondition<T> =
    T extends string
    ? string | RegExp | FieldOperators<T>
    : Defined<T> | FieldOperators<T>;

/* ----------------------------- Filter construction ------------------------ */

type FieldQueryMap<T extends MongoDocument> = {
    [K in KnownKeys<T>]?: FieldCondition<T[K]>;
};

type DotPathQueryMap<T extends MongoDocument> = {
    [P in DotPaths<T>]?: FieldCondition<PathValue<T, P>>;
};

type LogicalOps<T extends MongoDocument> = {
    $and?: StrictFilter<WithId<T>>[];
    $or?: StrictFilter<WithId<T>>[];
    $nor?: StrictFilter<WithId<T>>[];
};

/** Top-level evaluation-ish operators accepted by find() / $match */
type TopEvalOps<T extends MongoDocument> = {
    $expr?: Expr<T>;
    $jsonSchema?: unknown;
    $where?: string | ((this: WithId<T>) => boolean);
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
 *
 * NOTE: No string index signatures anywhere — TS excess property checks will catch typos.
 */
export type StrictFilter<TSchema extends MongoDocument> =
    FieldQueryMap<TSchema> &
    DotPathQueryMap<TSchema> &
    LogicalOps<TSchema> &
    TopEvalOps<TSchema>;
// export type StrictFilter<TSchema extends MongoDocument> = any // @todo @tmp for compiling

/** Helper to show compatibility with the official driver types. */
export type IsAssignableToMongoFilter<T extends MongoDocument> =
    StrictFilter<T> extends MongoFilter<T> ? true : false;

/* ----------------------------- Example generic ---------------------------- */

export class SomeClass<Data extends MongoDocument> {
    col!: Collection<Data>;

    cast(query: StrictFilter<Data>): void {
        const q: MongoFilter<Data> = query; // assignable
        void q;
    }

    async find(query: StrictFilter<Data>) {
        return (await this.col.findOne(query)) ?? undefined;
    }
}
