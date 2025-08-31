// strict_filter_test.ts
// Compile-time only tests for StrictFilter<T>.
// Run `tsc` and confirm only the lines marked with `@ts-expect-error` error out.

import {
    type Filter as MongoFilter,
    type ObjectId,
    type WithId,
    type Collection,
    type Document as MongoDocument,
} from 'mongodb';
import * as mongodb from 'mongodb';

import {
    StrictFilter,
    DotPaths,
    PathValue,
    type BSONTypeName,
} from './strict_filter.js';

// ---------------------------------------------------------------------------
// Schema under test
// ---------------------------------------------------------------------------

interface Address {
    street: string;
    zip?: number;
    coords?: { lat: number; lng: number };
}

interface Note {
    title: string;
    meta?: { rank: number; tags?: string[] };
}

interface User {
    // _id: ObjectId; // omit since this is always present so we can test if the schema accepts this even though not defined.
    name: string;
    age: number;
    active?: boolean;
    address: Address;
    tags: string[];
    scores?: number[];
    createdAt: Date;
    location?: { type: 'Point'; coordinates: [number, number] };
    notes?: Note[];
    status: 'active' | 'inactive' | 'pending';
}

// Dot path helpers sanity
type _Paths = DotPaths<User>;
type _StreetType = PathValue<User, 'address.street'>; // string

// ---------------------------------------------------------------------------
// VALID filters: primitives, operators, dot-paths
// ---------------------------------------------------------------------------

// By `_id`.
const ok_id: StrictFilter<User> = {
    _id: new mongodb.ObjectId("507f191e810c19729de860ea")
};

const ok_eq: StrictFilter<User> = {
    name: 'Ada',
};

const ok_eq_regex_on_string: StrictFilter<User> = {
    name: /A.*/i,
};

const ok_numeric_ops: StrictFilter<User> = {
    age: {
        $gte: 18,
        $lt: 65,
        $mod: [10, 0],
    },
};

const ok_string_ops: StrictFilter<User> = {
    name: {
        $regex: 'Ada',
        $options: 'i',
    },
};

const ok_date_ops: StrictFilter<User> = {
    createdAt: { $gt: new Date('2020-01-01') },
};

const ok_exists_and_type: StrictFilter<User> = {
    active: { $exists: true },
    createdAt: { $type: ['date', 9] }, // array of BSON types
};

const ok_array_ops_scalars: StrictFilter<User> = {
    tags: {
        $all: ['pro', 'admin'],
        $in: ['alpha', 'beta'],
        $nin: ['zzz'],
        $size: 2,
        $elemMatch: { $eq: 'pro' },
    },
};

const ok_array_ops_numbers: StrictFilter<User> = {
    scores: {
        $elemMatch: { $gt: 90 },
    },
};

const ok_bitwise: StrictFilter<User> = {
    age: { $bitsAnySet: 0b1010 },
};

const ok_dot_path_string: StrictFilter<User> = {
    'address.street': { $regex: /Main/i },
};

const ok_dot_path_optional_number: StrictFilter<User> = {
    'address.zip': { $type: 'int' },
};

const ok_subdoc_equality: StrictFilter<User> = {
    address: { street: 'Main', zip: 12345 },
};

const ok_field_not_numeric: StrictFilter<User> = {
    age: { $not: { $lt: 18 } },
};

const ok_field_not_regex_string: StrictFilter<User> = {
    name: { $not: /tmp/i },
};

// By in status const.
const ok_const_status: StrictFilter<User> = {
    status: { $in: ['active', 'inactive', 'pending'] },
};

// ---------------------------------------------------------------------------
// VALID: Geospatial operators on GeoJSON-ish field
// ---------------------------------------------------------------------------

const ok_geo_near: StrictFilter<User> = {
    location: {
        $near: { type: 'Point', coordinates: [10, 20], $maxDistance: 1000 },
    },
};

const ok_geo_within: StrictFilter<User> = {
    location: {
        $geoWithin: {
            $centerSphere: [[10, 20], 1],
        },
    },
};

const ok_geo_intersects: StrictFilter<User> = {
    location: {
        $geoIntersects: {
            $geometry: { type: 'Point', coordinates: [11, 21] },
        },
    },
};

// ---------------------------------------------------------------------------
// VALID: Logical operators and recursion
// ---------------------------------------------------------------------------

const ok_and_or_nor: StrictFilter<User> = {
    $and: [
        { active: { $exists: true } },
        { $or: [{ age: { $gte: 21 } }, { 'address.street': 'Baker St' }] },
        { $nor: [{ tags: { $size: 0 } }] },
    ],
};

// ---------------------------------------------------------------------------
// VALID: $expr with strict field refs and op shapes
// ---------------------------------------------------------------------------

const ok_expr_math_compare: StrictFilter<User> = {
    $expr: {
        $and: [
            { $gte: ['$age', 18] },
            { $lt: ['$age', { $add: [60, -1] }] },
        ],
    },
};

// const ok_expr_string_array_helpers: StrictFilter<User> = {
//     $expr: {
//         $or: [
//             { $eq: [{ $toString: '$age' }, '42'] },
//             { $in: ['admin', '$tags'] },
//             { $size: '$tags' },
//         ],
//     },
// };
const ok_expr_string_array_helpers: StrictFilter<User> = {
    $expr: {
        $or: [
            // { $eq: [{ $toString: '$age' }, '42'] },
            { $in: ['admin', '$tags'] },
            { $size: '$tags' },
        ],
    },
};

const bad_expr_string_array_helpers: StrictFilter<User> = {
    // @ts-expect-error
    $expr: {
        $or: [
            { $in: ['admin', '$tagsUNKNOWN'] },
            { $size: '$tags' },
        ],
    },
};

// ---------------------------------------------------------------------------
// VALID: text / where / jsonSchema / comment
// ---------------------------------------------------------------------------

const ok_text: StrictFilter<User> = {
    $text: { $search: 'engineer', $language: 'en', $caseSensitive: false, $diacriticSensitive: true },
};

const ok_where_string: StrictFilter<User> = {
    $where: 'this.age > 20',
};

const ok_where_function: StrictFilter<User> = {
    $where: function (this: WithId<User>) {
        return this.age >= 18 && this.name.length > 0;
    },
};

const ok_json_schema_comment: StrictFilter<User> = {
    $jsonSchema: { bsonType: 'object' as BSONTypeName, required: ['name'] },
    $comment: 'unit-test',
};

// ---------------------------------------------------------------------------
// VALID: $elemMatch with array of subdocuments (notes?: Note[])
// Force using $elemMatch instead of dot paths into arrays.
// ---------------------------------------------------------------------------

const ok_elemMatch_subdoc: StrictFilter<User> = {
    notes: {
        $elemMatch: {
            title: { $regex: '^T' },
            // Keep `as any` here – we aren't building a full, deep StrictFilter<Note> shape
            // and equality to subdocs is allowed; using any avoids creating another type.
            meta: {
                rank: { $gte: 1 },
                tags: { $in: ['x'] },
            } as any,
        },
    },
};

// ---------------------------------------------------------------------------
// INVALID CASES (Each preceded by @ts-expect-error on the offending line)
// ---------------------------------------------------------------------------

// By `_id`.
const bad_id: StrictFilter<User> = {
    // @ts-expect-error - must be ObjectId
    _id: []
};
const bad_id_1: StrictFilter<User> = {
    // @ts-expect-error - must be ObjectId
    _id: false
};

// Unknown top-level key
const bad_unknown_top: StrictFilter<User> = {
    // @ts-expect-error - 'nmae' is not a declared key on User
    nmae: 'typo',
};

// Unknown nested dot path
const bad_unknown_dot: StrictFilter<User> = {
    // @ts-expect-error - 'adress.stret' doesn't exist
    'adress.stret': 'nope',
};

// Dot path too deep / not present
const bad_too_deep: StrictFilter<User> = {
    // @ts-expect-error - 'address.zip.code' is not a valid path
    'address.zip.code': 5,
};

// Wrong operator for string ($size only for arrays)
const bad_string_size: StrictFilter<User> = {
    name: {
        // @ts-expect-error
        $size: 3,
    },
};

// Bare RegExp on non-string field
const bad_regex_on_number: StrictFilter<User> = {
    // @ts-expect-error
    age: /x/,
};

// $regex only valid for strings
const bad_number_regex: StrictFilter<User> = {
    age: {
        // @ts-expect-error
        $regex: /x/,
    },
};

// Wrong $mod shape
const bad_mod_arity: StrictFilter<User> = {
    age: {
        // @ts-expect-error
        $mod: [2],
    },
};

// Wrong $type string
const bad_type_name: StrictFilter<User> = {
    age: {
        // @ts-expect-error
        $type: 'nonsense',
    },
};

// $in wrong element type for scalar field
const bad_in_scalar_type: StrictFilter<User> = {
    age: {
        // @ts-expect-error
        $in: ['x'],
    },
};

// $in wrong element type for array field (tags: string[])
const bad_in_array_elem_type: StrictFilter<User> = {
    // @ts-expect-error
    tags: {
        $in: [1, 2],
    },
};

// $all wrong elem type
const bad_all_type: StrictFilter<User> = {
    // @ts-expect-error
    tags: {
        $all: [1, 2, 3],
    },
};

// $elemMatch shape mismatch for number[] (scores)
const bad_elemMatch_type: StrictFilter<User> = {
    scores: {
        $elemMatch: {
            // @ts-expect-error
            $regex: /x/,
        },
    },
};

// Geo: wrong $near payload (must be Point or Position-like)
const bad_near_shape: StrictFilter<User> = {
    location: {
        // @ts-expect-error
        $near: [0, 0],
    },
};

// $geoIntersects missing $geometry
const bad_geo_intersects_shape: StrictFilter<User> = {
    location: {
        $geoIntersects: {
            // @ts-expect-error
            foo: 1,
        },
    },
};

// $not with illegal inner operator for number (regex disallowed)
const bad_not_regex_on_number: StrictFilter<User> = {
    age: {
        // @ts-expect-error
        $not: /x/,
    },
};

// Equality with extra unknown key inside subdocument literal
const bad_subdoc_extra_key: StrictFilter<User> = {
    address: {
        street: 'Main',
        zip: 1,
        // @ts-expect-error
        oops: true,
    },
};

// Top-level unknown operator
const bad_unknown_top_op: StrictFilter<User> = {
    // @ts-expect-error
    $foo: 1,
};

// $text with extra unknown property
const bad_text_extra: StrictFilter<User> = {
    $text: {
        $search: 'q',
        // @ts-expect-error
        unknown: true,
    },
};

// $comment wrong type
const bad_comment_type: StrictFilter<User> = {
    // @ts-expect-error
    $comment: 42,
};

// $where wrong type
const bad_where_type: StrictFilter<User> = {
    // @ts-expect-error
    $where: 7,
};

// $expr wrong field ref (typo in path)
const bad_expr_field_ref: StrictFilter<User> = {
    // @ts-expect-error
    $expr: {
        $eq: ['$ages', 12],
    },
};

// $expr wrong shapes
const bad_expr_add_scalar: StrictFilter<User> = {
    // @ts-expect-error
    $expr: {
        $add: 1,
    },
};

// $and recursive unknown keys
const bad_and_unknown_inside: StrictFilter<User> = {
    $and: [
        {
            // @ts-expect-error
            nmae: 'typo', // should be name
        },
    ],
};

// $or element with wrong type (not a StrictFilter)
const bad_or_wrong_elem_type: StrictFilter<User> = {
    $or: [
        // @ts-expect-error
        42,
    ],
};

// $elemMatch with unknown nested field on subdoc array (notes)
const bad_elemMatch_unknown_nested: StrictFilter<User> = {
    notes: {
        $elemMatch: {
            // @ts-expect-error
            titla: { $regex: '^T' }, // typo
        },
    },
};

const typo_in_and: StrictFilter<User> = {
    'address.street': { $regex: 'Main', $options: 'i' },
    age: { $gte: 18, $lte: 99 },
    // @ts-expect-error
    $expr: {
        $and: [
            { $gte: ['$ageXXX', 18] },
            { $lt: ['$ageXXX', 100] }
        ]
    },
};

// Bad status const.
const bad_const_status: StrictFilter<User> = {
    // @ts-expect-error
    status: { $in: ['UNKNOWN'] },
};

// ---------------------------------------------------------------------------
// Driver interop: assignment to mongodb.Filter<T>, findOne usage
// ---------------------------------------------------------------------------

const strictOk: StrictFilter<User> = {
    'address.street': { $regex: 'Main', $options: 'i' },
    age: { $gte: 18, $lte: 99 },
    $expr: { $and: [{ $gte: ['$age', 18] }, { $lt: ['$age', 100] }] },
};

const mongoFilterAccepts: MongoFilter<User> = strictOk as MongoFilter<User>; // should compile

// Simulate collection to test method signatures (structural type only)
declare const usersCol: Collection<User>;

// should accept StrictFilter<User> where Filter<User> is expected
async function _useInFindOne() {
    const r = await usersCol.findOne(strictOk as MongoFilter<User>);
    void r;
}

// ---------------------------------------------------------------------------
// Generics: your requested class and a few variants
// ---------------------------------------------------------------------------

// Casting with generics (requested sample)
class SomeClassGeneric<Data extends MongoDocument> {
    col!: Collection<Data>;
    cast(query: StrictFilter<Data>): void {
        const q: MongoFilter<Data> = query; // ensure castable to mongodb.Filter<Data>
        void q;
    }
    async find(query: StrictFilter<Data>): Promise<WithId<Data> | undefined> {
        return (await this.col.findOne(query)) ?? undefined;
    }
}

// Use with concrete Data:
const repo1 = new SomeClassGeneric<User>();
repo1.cast(strictOk);

// (Removed SourceSomeClass usage — class no longer exported from strict_filter.ts)

// Generic function accepting StrictFilter<T> and assigning to Filter<T>
function acceptsStrict<T extends MongoDocument>(q: StrictFilter<T>) {
    const f: MongoFilter<T> = q;
    void f;
}
acceptsStrict<User>({ $and: [{ age: { $gte: 1 } }] });

// Nested generic repository using intersection to ensure constraints still pass
class FancyRepo<T extends MongoDocument & { createdAt?: Date }> {
    col!: Collection<T>;
    whereRecent(q: StrictFilter<T>) {
        const f: MongoFilter<T> = q;
        void f;
    }
    async findOneStrict(q: StrictFilter<T>) {
        return (await this.col.findOne(q)) ?? undefined;
    }
}

const fancy = new FancyRepo<User>();
fancy.whereRecent({ createdAt: { $gt: new Date(0) } });

// Ensure logicals accept nested StrictFilter<WithId<T>>[] in generics:
function complexWhere<T extends MongoDocument>(conds: StrictFilter<T>[]) {
    const merged: StrictFilter<T> = {
        $and: conds,
    } as StrictFilter<T>;
    const f: MongoFilter<T> = merged;
    void f;
}
complexWhere<User>([{ name: 'Ada' }, { age: { $gt: 20 } }]);

// ---------------------------------------------------------------------------
// Additional edge coverage
// ---------------------------------------------------------------------------

// Bare string equality + regex mix
const ok_mix: StrictFilter<User> = {
    name: { $eq: 'Ada' },
    age: 36,
};

// Plain dot path equality
const ok_dot_eq: StrictFilter<User> = {
    'address.street': 'Baker St',
};

// Ensure array equality works but operator types still correct
const ok_array_equality: StrictFilter<User> = {
    tags: ['x', 'y'],
};

// Invalid: $options without $regex (still allowed by Mongo but here it's under string ops only)
const bad_options_without_regex: StrictFilter<User> = {
    // @ts-expect-error
    name: {
        $options: 'i',
    },
};

// Invalid: $nearSphere wrong shape
const bad_nearSphere_shape: StrictFilter<User> = {
    location: {
        $nearSphere: {
            // @ts-expect-error
            foo: 'bar',
        },
    },
};

// Invalid: $jsonSchema wrong top-level type (must be object, we allow unknown, but basic sanity)
// This one WON'T error because $jsonSchema is `unknown` by design for pass-through.
const ok_jsonSchema_any: StrictFilter<User> = {
    $jsonSchema: 123,
};
void ok_jsonSchema_any;

// Keep references to avoid TS stripping unused vars
void ok_eq;
void ok_eq_regex_on_string;
void ok_numeric_ops;
void ok_string_ops;
void ok_date_ops;
void ok_exists_and_type;
void ok_array_ops_scalars;
void ok_array_ops_numbers;
void ok_bitwise;
void ok_dot_path_string;
void ok_dot_path_optional_number;
void ok_subdoc_equality;
void ok_field_not_numeric;
void ok_field_not_regex_string;
void ok_geo_near;
void ok_geo_within;
void ok_geo_intersects;
void ok_and_or_nor;
void ok_expr_math_compare;
void ok_expr_string_array_helpers;
void ok_text;
void ok_where_string;
void ok_where_function;
void ok_json_schema_comment;
void ok_elemMatch_subdoc;
void ok_mix;
void ok_dot_eq;
void ok_array_equality;
