// // strict-filter.test.ts
// // Compile-time only tests for StrictFilter<T>.
// // Run `tsc` and confirm only the lines marked with `@ts-expect-error` error out.
export {};
// import {
//     type Filter as MongoFilter,
//     type ObjectId,
//     type WithId,
//     type Collection,
//     type Document as MongoDocument,
// } from 'mongodb';
// import {
//     StrictFilter,
//     DotPaths,
//     PathValue,
//     SomeClass as SourceSomeClass, // exported from strict-filter.ts
//     type BSONTypeName,
// } from './strict-filter';
// // ---------------------------------------------------------------------------
// // Schema under test
// // ---------------------------------------------------------------------------
// interface Address {
//     street: string;
//     zip?: number;
//     coords?: { lat: number; lng: number };
// }
// interface Note {
//     title: string;
//     meta?: { rank: number; tags?: string[] };
// }
// interface User {
//     _id: ObjectId;
//     name: string;
//     age: number;
//     active?: boolean;
//     address: Address;
//     tags: string[];
//     scores?: number[];
//     createdAt: Date;
//     location?: { type: 'Point'; coordinates: [number, number] };
//     notes?: Note[];
// }
// // Dot path helpers sanity
// type _Paths = DotPaths<User>;
// type _StreetType = PathValue<User, 'address.street'>; // string
// // ---------------------------------------------------------------------------
// // VALID filters: primitives, operators, dot-paths
// // ---------------------------------------------------------------------------
// const ok_eq: StrictFilter<User> = {
//     name: 'Ada',
// };
// const ok_eq_regex_on_string: StrictFilter<User> = {
//     name: /A.*/i,
// };
// const ok_numeric_ops: StrictFilter<User> = {
//     age: {
//         $gte: 18,
//         $lt: 65,
//         $mod: [10, 0],
//     },
// };
// const ok_string_ops: StrictFilter<User> = {
//     name: {
//         $regex: 'Ada',
//         $options: 'i',
//     },
// };
// const ok_date_ops: StrictFilter<User> = {
//     createdAt: { $gt: new Date('2020-01-01') },
// };
// const ok_exists_and_type: StrictFilter<User> = {
//     active: { $exists: true },
//     createdAt: { $type: ['date', 9] }, // array of BSON types
// };
// const ok_array_ops_scalars: StrictFilter<User> = {
//     tags: {
//         $all: ['pro', 'admin'],
//         $in: ['alpha', 'beta'],
//         $nin: ['zzz'],
//         $size: 2,
//         $elemMatch: { $eq: 'pro' },
//     },
// };
// const ok_array_ops_numbers: StrictFilter<User> = {
//     scores: {
//         $elemMatch: { $gt: 90 },
//     },
// };
// const ok_bitwise: StrictFilter<User> = {
//     age: { $bitsAnySet: 0b1010 },
// };
// const ok_dot_path_string: StrictFilter<User> = {
//     'address.street': { $regex: /Main/i },
// };
// const ok_dot_path_optional_number: StrictFilter<User> = {
//     'address.zip': { $type: 'int' },
// };
// const ok_subdoc_equality: StrictFilter<User> = {
//     address: { street: 'Main', zip: 12345 },
// };
// const ok_field_not_numeric: StrictFilter<User> = {
//     age: { $not: { $lt: 18 } },
// };
// const ok_field_not_regex_string: StrictFilter<User> = {
//     name: { $not: /tmp/i },
// };
// // ---------------------------------------------------------------------------
// // VALID: Geospatial operators on GeoJSON-ish field
// // ---------------------------------------------------------------------------
// const ok_geo_near: StrictFilter<User> = {
//     location: {
//         $near: { type: 'Point', coordinates: [10, 20], $maxDistance: 1000 },
//     },
// };
// const ok_geo_within: StrictFilter<User> = {
//     location: {
//         $geoWithin: {
//             $centerSphere: [[10, 20], 1],
//         },
//     },
// };
// const ok_geo_intersects: StrictFilter<User> = {
//     location: {
//         $geoIntersects: {
//             $geometry: { type: 'Point', coordinates: [11, 21] },
//         },
//     },
// };
// // ---------------------------------------------------------------------------
// // VALID: Logical operators and recursion
// // ---------------------------------------------------------------------------
// const ok_and_or_nor: StrictFilter<User> = {
//     $and: [
//         { active: { $exists: true } },
//         { $or: [{ age: { $gte: 21 } }, { 'address.street': 'Baker St' }] },
//         { $nor: [{ tags: { $size: 0 } }] },
//     ],
// };
// // ---------------------------------------------------------------------------
// // VALID: $expr with strict field refs and op shapes
// // ---------------------------------------------------------------------------
// const ok_expr_math_compare: StrictFilter<User> = {
//     $expr: {
//         $and: [
//             { $gte: ['$age', 18] },
//             { $lt: ['$age', { $add: [60, -1] }] },
//         ],
//     },
// };
// const ok_expr_string_array_helpers: StrictFilter<User> = {
//     $expr: {
//         $or: [
//             { $eq: [{ $toString: '$age' }, '42'] },
//             { $in: ['admin', '$tags'] },
//             { $size: '$tags' },
//         ],
//     },
// };
// // ---------------------------------------------------------------------------
// // VALID: text / where / jsonSchema / comment
// // ---------------------------------------------------------------------------
// const ok_text: StrictFilter<User> = {
//     $text: { $search: 'engineer', $language: 'en', $caseSensitive: false, $diacriticSensitive: true },
// };
// const ok_where_string: StrictFilter<User> = {
//     $where: 'this.age > 20',
// };
// const ok_where_function: StrictFilter<User> = {
//     $where: function (this: WithId<User>) {
//         return this.age >= 18 && this.name.length > 0;
//     },
// };
// const ok_json_schema_comment: StrictFilter<User> = {
//     $jsonSchema: { bsonType: 'object' as BSONTypeName, required: ['name'] },
//     $comment: 'unit-test',
// };
// // ---------------------------------------------------------------------------
// // VALID: $elemMatch with array of subdocuments (notes?: Note[])
// // Force using $elemMatch instead of dot paths into arrays.
// // ---------------------------------------------------------------------------
// const ok_elemMatch_subdoc: StrictFilter<User> = {
//     notes: {
//         $elemMatch: {
//             title: { $regex: '^T' },
//             meta: {
//                 rank: { $gte: 1 },
//                 tags: { $in: ['x'] },
//             } as any, // equality to subdoc also allowed; using any to avoid building full type here
//         },
//     },
// };
// // ---------------------------------------------------------------------------
// // INVALID CASES (Each preceded by @ts-expect-error on the line before the error)
// // ---------------------------------------------------------------------------
// // Unknown top-level key
// // @ts-expect-error - 'nmae' is not a declared key on User
// const bad_unknown_top: StrictFilter<User> = {
//     nmae: 'typo',
// };
// // Unknown nested dot path
// // @ts-expect-error - 'adress.stret' doesn't exist
// const bad_unknown_dot: StrictFilter<User> = {
//     'adress.stret': 'nope',
// };
// // Dot path too deep / not present
// // @ts-expect-error - 'address.zip.code' is not a valid path
// const bad_too_deep: StrictFilter<User> = {
//     'address.zip.code': 5,
// };
// // Wrong operator for string ($size only for arrays)
// // @ts-expect-error
// const bad_string_size: StrictFilter<User> = {
//     name: {
//         $size: 3,
//     },
// };
// // Bare RegExp on non-string field
// // @ts-expect-error
// const bad_regex_on_number: StrictFilter<User> = {
//     age: /x/,
// };
// // $regex only valid for strings
// // @ts-expect-error
// const bad_number_regex: StrictFilter<User> = {
//     age: { $regex: /x/ },
// };
// // Wrong $mod shape
// // @ts-expect-error
// const bad_mod_arity: StrictFilter<User> = {
//     age: { $mod: [2] as any },
// };
// // Wrong $type string
// // @ts-expect-error
// const bad_type_name: StrictFilter<User> = {
//     age: { $type: 'nonsense' as any },
// };
// // $in wrong element type for scalar field
// // @ts-expect-error
// const bad_in_scalar_type: StrictFilter<User> = {
//     age: { $in: ['x'] as any },
// };
// // $in wrong element type for array field (tags: string[])
// // @ts-expect-error
// const bad_in_array_elem_type: StrictFilter<User> = {
//     tags: { $in: [1, 2] as any },
// };
// // $all wrong elem type
// // @ts-expect-error
// const bad_all_type: StrictFilter<User> = {
//     tags: { $all: [1, 2, 3] as any },
// };
// // $elemMatch shape mismatch for number[] (scores)
// // @ts-expect-error
// const bad_elemMatch_type: StrictFilter<User> = {
//     scores: { $elemMatch: { $regex: /x/ } as any },
// };
// // Geo: wrong $near payload (must be Point or Position-like)
// // @ts-expect-error
// const bad_near_shape: StrictFilter<User> = {
//     location: { $near: [0, 0] as any },
// };
// // $geoIntersects missing $geometry
// // @ts-expect-error
// const bad_geo_intersects_shape: StrictFilter<User> = {
//     location: { $geoIntersects: { foo: 1 } as any },
// };
// // $not with illegal inner operator for number (regex disallowed)
// // @ts-expect-error
// const bad_not_regex_on_number: StrictFilter<User> = {
//     age: { $not: /x/ as any },
// };
// // Equality with extra unknown key inside subdocument literal
// // @ts-expect-error
// const bad_subdoc_extra_key: StrictFilter<User> = {
//     address: { street: 'Main', zip: 1, oops: true } as any,
// };
// // Top-level unknown operator
// // @ts-expect-error
// const bad_unknown_top_op: StrictFilter<User> = {
//     $foo: 1 as any,
// };
// // $text with extra unknown property
// // @ts-expect-error
// const bad_text_extra: StrictFilter<User> = {
//     $text: { $search: 'q', unknown: true } as any,
// };
// // $comment wrong type
// // @ts-expect-error
// const bad_comment_type: StrictFilter<User> = {
//     $comment: 42 as any,
// };
// // $where wrong type
// // @ts-expect-error
// const bad_where_type: StrictFilter<User> = {
//     $where: 7 as any,
// };
// // $expr wrong field ref (typo in path)
// // @ts-expect-error
// const bad_expr_field_ref: StrictFilter<User> = {
//     $expr: { $eq: ['$ages' as any, 12] },
// };
// // $expr wrong shapes
// // @ts-expect-error
// const bad_expr_add_scalar: StrictFilter<User> = {
//     $expr: { $add: 1 as any },
// };
// // $and recursive unknown keys
// // @ts-expect-error
// const bad_and_unknown_inside: StrictFilter<User> = {
//     $and: [
//         {
//             nmae: 'typo', // should be name
//         } as any,
//     ],
// };
// // $or element with wrong type (not a StrictFilter)
// // @ts-expect-error
// const bad_or_wrong_elem_type: StrictFilter<User> = {
//     $or: [42 as any],
// };
// // $elemMatch with unknown nested field on subdoc array (notes)
// // @ts-expect-error
// const bad_elemMatch_unknown_nested: StrictFilter<User> = {
//     notes: {
//         $elemMatch: {
//             titla: { $regex: '^T' }, // typo
//         } as any,
//     },
// };
// // ---------------------------------------------------------------------------
// // Driver interop: assignment to mongodb.Filter<T>, findOne usage
// // ---------------------------------------------------------------------------
// const strictOk: StrictFilter<User> = {
//     'address.street': { $regex: 'Main', $options: 'i' },
//     age: { $gte: 18, $lte: 99 },
//     $expr: { $and: [{ $gte: ['$age', 18] }, { $lt: ['$age', 100] }] },
// };
// const mongoFilterAccepts: MongoFilter<User> = strictOk; // should compile
// // Simulate collection to test method signatures (structural type only)
// declare const usersCol: Collection<User>;
// // should accept StrictFilter<User> where Filter<User> is expected
// async function _useInFindOne() {
//     const r = await usersCol.findOne(strictOk);
//     void r;
// }
// // ---------------------------------------------------------------------------
// // Generics: your requested class and a few variants
// // ---------------------------------------------------------------------------
// // Casting with generics (requested sample)
// class SomeClassGeneric<Data extends MongoDocument> {
//     col!: Collection<Data>;
//     cast(query: StrictFilter<Data>): void {
//         const q: MongoFilter<Data> = query; // ensure castable to mongodb.Filter<Data>
//         void q;
//     }
//     async find(query: StrictFilter<Data>): Promise<WithId<Data> | undefined> {
//         return (await this.col.findOne(query)) ?? undefined;
//     }
// }
// // Use with concrete Data:
// const repo1 = new SomeClassGeneric<User>();
// repo1.cast(strictOk);
// // Use the exported class from the source file too:
// const repo2 = new SourceSomeClass<User>();
// repo2.cast({ name: { $regex: 'x' } });
// // Generic function accepting StrictFilter<T> and assigning to Filter<T>
// function acceptsStrict<T extends MongoDocument>(q: StrictFilter<T>) {
//     const f: MongoFilter<T> = q;
//     void f;
// }
// acceptsStrict<User>({ $and: [{ age: { $gte: 1 } }] });
// // Nested generic repository using intersection to ensure constraints still pass
// class FancyRepo<T extends MongoDocument & { createdAt?: Date }> {
//     col!: Collection<T>;
//     whereRecent(q: StrictFilter<T>) {
//         const f: MongoFilter<T> = q;
//         void f;
//     }
//     async findOneStrict(q: StrictFilter<T>) {
//         return (await this.col.findOne(q)) ?? undefined;
//     }
// }
// const fancy = new FancyRepo<User>();
// fancy.whereRecent({ createdAt: { $gt: new Date(0) } });
// // Ensure logicals accept nested StrictFilter<WithId<T>>[] in generics:
// function complexWhere<T extends MongoDocument>(conds: StrictFilter<T>[]) {
//     const merged: StrictFilter<T> = {
//         $and: conds,
//     };
//     const f: MongoFilter<T> = merged;
//     void f;
// }
// complexWhere<User>([{ name: 'Ada' }, { age: { $gt: 20 } }]);
// // ---------------------------------------------------------------------------
// // Additional edge coverage
// // ---------------------------------------------------------------------------
// // Bare string equality + regex mix
// const ok_mix: StrictFilter<User> = {
//     name: { $eq: 'Ada' },
//     age: 36,
// };
// // Plain dot path equality
// const ok_dot_eq: StrictFilter<User> = {
//     'address.street': 'Baker St',
// };
// // Ensure array equality works but operator types still correct
// const ok_array_equality: StrictFilter<User> = {
//     tags: ['x', 'y'],
// };
// // Invalid: $options without $regex (still allowed by Mongo but here it's under string ops only)
// // @ts-expect-error
// const bad_options_without_regex: StrictFilter<User> = {
//     name: { $options: 'i' } as any,
// };
// // Invalid: $nearSphere wrong shape
// // @ts-expect-error
// const bad_nearSphere_shape: StrictFilter<User> = {
//     location: { $nearSphere: { foo: 'bar' } as any },
// };
// // Invalid: $jsonSchema wrong top-level type (must be object, we allow unknown, but basic sanity)
// // This one WON'T error because $jsonSchema is `unknown` by design for pass-through.
// // Keeping a harmless check:
// const ok_jsonSchema_any: StrictFilter<User> = {
//     $jsonSchema: 123 as any,
// };
// void ok_jsonSchema_any;
// // Keep references to avoid TS stripping unused vars
// void ok_eq;
// void ok_eq_regex_on_string;
// void ok_numeric_ops;
// void ok_string_ops;
// void ok_date_ops;
// void ok_exists_and_type;
// void ok_array_ops_scalars;
// void ok_array_ops_numbers;
// void ok_bitwise;
// void ok_dot_path_string;
// void ok_dot_path_optional_number;
// void ok_subdoc_equality;
// void ok_field_not_numeric;
// void ok_field_not_regex_string;
// void ok_geo_near;
// void ok_geo_within;
// void ok_geo_intersects;
// void ok_and_or_nor;
// void ok_expr_math_compare;
// void ok_expr_string_array_helpers;
// void ok_text;
// void ok_where_string;
// void ok_where_function;
// void ok_json_schema_comment;
// void ok_elemMatch_subdoc;
// void ok_mix;
// void ok_dot_eq;
// void ok_array_equality;
