// import { StrictFilter } from './strict_filter.js';
// import type * as mongodb from 'mongodb';

// // ============================================================================
// // COMPREHENSIVE TEST SUITE
// // ============================================================================

// interface TestSchema {
//     // Basic types
//     // id: string;
//     objectId?: mongodb.ObjectId;
//     name: string;
//     age: number;
//     isActive: boolean;
//     createdAt: Date;

//     // Arrays
//     tags: string[];
//     scores: number[];

//     // Nested objects
//     profile: {
//         email: string;
//         phone: string;
//         address: {
//             street: string;
//             city: string;
//             zip: number;
//         };
//     };

//     // Optional fields
//     description?: string;
//     deletedAt?: Date;

//     // Complex arrays
//     items: Array<{
//         id: string;
//         quantity: number;
//         price: number;
//     }>;

//     // Geospatial field
//     location?: {
//         type: 'Point';
//         coordinates: [number, number];
//     };

//     // Binary data field
//     binaryField?: mongodb.Binary;
// }

// // ============================================================================
// // StrictFilter Tests - Should FAIL (produce TypeScript errors)
// // ============================================================================

// // Test 1: Unknown top-level field in filter
// const failFilter1: StrictFilter<TestSchema> = {
//     // @ts-expect-error - 'unknownField' does not exist in TestSchema
//     unknownField: 'value',
// };

// // Test 2: Unknown nested field in filter
// const failFilter2: StrictFilter<TestSchema> = {
//     // @ts-expect-error - 'profile.unknownField' is not a valid path
//     'profile.unknownField': 'value',
// };

// // Test 3: Unknown deep nested field in filter
// const failFilter3: StrictFilter<TestSchema> = {
//     // @ts-expect-error - 'profile.address.country' does not exist
//     'profile.address.country': 'USA',
// };

// // Test 3: Unknown deep nested field in filter
// const successFilter_1: StrictFilter<TestSchema> = {
//     'profile.address.street': 'USA',
// };

// // Test 4: Typo in field name
// const failFilter4: StrictFilter<TestSchema> = {
//     // @ts-expect-error - 'nmae' is a typo, should be 'name'
//     nmae: 'John',
// };


// // ============================================================================
// // Valid Tests - Should PASS (no TypeScript errors)
// // ============================================================================

// // Valid filter with direct fields
// const validFilter1: StrictFilter<TestSchema> = {
//     name: 'John',
//     age: 30,
//     isActive: true,
// };

// // Valid filter with operators
// const validFilter2: StrictFilter<TestSchema> = {
//     age: { $gte: 18, $lte: 65 },
//     name: { $regex: '^J' },
//     tags: { $in: ['admin', 'user'] },
// };

// // Valid filter with nested paths
// const validFilter3: StrictFilter<TestSchema> = {
//     'profile.email': 'test@example.com',
//     'profile.address.city': 'New York',
//     'profile.address.zip': { $gte: 10000 },
// };

// // Valid filter with logical operators
// const validFilter4: StrictFilter<TestSchema> = {
//     $or: [
//         { age: { $lt: 18 } },
//         { age: { $gte: 65 } }
//     ],
//     $and: [
//         { isActive: true },
//         { tags: { $in: ['premium'] } }
//     ],
// };

// // ============================================================================
// // ADDITIONAL NEGATIVE TESTS (Should FAIL)
// // ============================================================================

// // Array operator with wrong element type in filter
// const failFilter5: StrictFilter<TestSchema> = {
//     // @ts-expect-error - $in expects string[], not string[][]
//     tags: {
//         $in: [['admin']]
//     }
// };

// // ============================================================================
// // ADDITIONAL POSITIVE TESTS (Should PASS)
// // ============================================================================

// // Array equality in filter
// const validFilter5: StrictFilter<TestSchema> = {
//     tags: ['a', 'b'],
// };

// // Element-wise operator on array field
// const validFilter6: StrictFilter<TestSchema> = {
//     scores: { $gte: 50 },
// };

// // Using $exists on optional field
// const validFilter7: StrictFilter<TestSchema> = {
//     description: { $exists: false },
// };

// // Using $not with regex
// const validFilter8: StrictFilter<TestSchema> = {
//     name: { $not: { $regex: '^A' } },
// };

// // Using $nor
// const validFilter9: StrictFilter<TestSchema> = {
//     $nor: [{ isActive: false }, { age: { $lt: 18 } }],
// };

// // Nested numeric with $in
// const validFilter10: StrictFilter<TestSchema> = {
//     'profile.address.zip': { $in: [10000, 20000] },
// };



// // ============================================================================
// // CASTING TO OFFICIAL MONGODB TYPES (Should PASS)
// // ============================================================================

// // StrictFilter → mongodb.Filter
// const strictFilterForCast: StrictFilter<TestSchema> = {
//     age: { $gte: 21 },
//     isActive: true,
//     tags: { $in: ['admin', 'user'] },
// };
// const mongoFilterCast: mongodb.Filter<TestSchema> = strictFilterForCast;


// // ============================================================================
// // UPDATE MANY OVERLOAD WITH STRICT UPDATE (Should PASS)
// // ============================================================================

// declare const colX: mongodb.Collection<TestSchema>;


// void colX.updateMany(
//     { id: 'abc' } as StrictFilter<TestSchema>,
//     {},
//     {}
// );

// function update_test_1(
//     filter: StrictFilter<TestSchema>,
//     update_filter: mongodb.UpdateFilter<TestSchema>
// ) {
//     colX.updateMany(
//         filter,
//         update_filter,
//         {}
//     );
// }

// // ============================================================================
// // SIMULATING CAST ERRORS FROM REAL CODE.
// // ============================================================================

// // A concrete schema for comparison
// type TestSchema2 = {
//     id: string;
//     name: string;
//     age?: number;
//     createdAt: Date;
// };

// // ----- Control: with a concrete schema, typical calls compile -----
// declare const colConcrete: mongodb.Collection<TestSchema2>;
// const okStrictUpdateConcrete: mongodb.UpdateFilter<TestSchema2> = { $set: { name: "x" } };

// void colConcrete.updateMany({ id: "abc" } as StrictFilter<TestSchema2>, okStrictUpdateConcrete, {}); // OK

// // ----- Repro: generic boundary (mirrors your save/bulk path) -----
// declare function acceptsBulk<T extends mongodb.Document>(
//     op: mongodb.AnyBulkWriteOperation<T>
// ): void;

// function genericSaveRepro<Data extends mongodb.Document>(
//     filter: mongodb.Filter<Data>,
//     op: mongodb.UpdateFilter<Data>,
// ) {
//     const bulkOp = {
//         updateOne: {
//             filter,
//             update: op, // <- This is where TS2322 shows up pre-fix
//             upsert: true,
//         },
//     };

//     acceptsBulk<Data>(bulkOp);

//     // Also directly:
//     const _direct: mongodb.AnyBulkWriteOperation<Data> = bulkOp;

//     // And findOneAndUpdate:
//     const colGeneric: mongodb.Collection<Data> = null as any;
//     colGeneric.findOneAndUpdate(filter, op);
// }

// // DOES NOT PASS THE FOLLOWING BECAUSE OF TEMPLATE.
// // function forcesRealCheck<Data extends mongodb.Document>(
// //     filter: mongodb.Filter<Data>,
// //     op: StrictUpdateFilter<Data>
// // ) {
// //     // 🔴 This mirrors collection.ts exactly
// //     const x: mongodb.AnyBulkWriteOperation<Data> = {
// //         updateOne: { filter, update: op, upsert: true },
// //     };
// //     void x;
// // }

// // ============================================================================
// // ROOT FILTER OPERATORS TESTS
// // ============================================================================

// // Test $expr operator
// const testExpr: StrictFilter<TestSchema> = {
//     $expr: {
//         $and: [
//             { $gt: ["$age", 18] },
//             { $lte: [{ $add: ["$age", 10] }, 100] }
//         ]
//     }
// };

// // Test $expr with complex aggregation expressions
// const testExprComplex: StrictFilter<TestSchema> = {
//     $expr: {
//         $and: [
//             { $eq: [{ $mod: ["$age", 2] }, 0] }, // even ages
//             { $gte: [{ $size: "$tags" }, 2] },   // at least 2 tags
//             { $lt: [{ $subtract: [new Date(), "$createdAt"] }, 86400000] } // created within last day
//         ]
//     }
// };

// // Test $text operator
// const testText: StrictFilter<TestSchema> = {
//     $text: {
//         $search: "coffee shop",
//         $language: "en",
//         $caseSensitive: false,
//         $diacriticSensitive: true
//     }
// };

// // Test $where with function
// const testWhereFunction: StrictFilter<TestSchema> = {
//     $where: function () {
//         return this.age > 21 && this.tags.length > 0;
//     }
// };

// // Test $where with string
// const testWhereString: StrictFilter<TestSchema> = {
//     $where: "this.age > 21 && this.tags.length > 0"
// };

// // Test $jsonSchema
// const testJsonSchema: StrictFilter<TestSchema> = {
//     $jsonSchema: {
//         required: ["name", "age"],
//         properties: {
//             name: {
//                 type: "string",
//                 minLength: 1,
//                 maxLength: 100
//             },
//             age: {
//                 type: "number",
//                 minimum: 0,
//                 maximum: 120
//             }
//         }
//     }
// };

// // Test $comment
// const testComment: StrictFilter<TestSchema> = {
//     age: { $gte: 18 },
//     $comment: "Query for adult users"
// };

// // Test $comment with document
// const testCommentDocument: StrictFilter<TestSchema> = {
//     $comment: {
//         query: "adult_users",
//         version: 2,
//         timestamp: new Date()
//     }
// };

// // Test $rand for random sampling
// const testRand: StrictFilter<TestSchema> = {
//     $expr: { $lte: [{ $rand: {} }, 0.1] } // 10% random sample
// };

// // ============================================================================
// // FIELD-LEVEL FILTER OPERATORS TESTS
// // ============================================================================

// // Comparison operators
// const testComparison: StrictFilter<TestSchema> = {
//     age: {
//         $eq: 25,
//         $ne: 30,
//         $gt: 18,
//         $gte: 18,
//         $lt: 65,
//         $lte: 65
//     },
//     name: {
//         $in: ["Alice", "Bob", "Charlie"],
//         $nin: ["Dave", "Eve"]
//     }
// };

// // Element operators
// const testElement: StrictFilter<TestSchema> = {
//     description: { $exists: true },
//     deletedAt: { $exists: false },
//     age: { $type: "int" },
//     createdAt: { $type: "date" },
//     objectId: { $type: "objectId" },
//     binaryField: { $type: "binData" }
// };

// // Evaluation operators on fields
// const testFieldEvaluation: StrictFilter<TestSchema> = {
//     age: { $mod: [10, 0] }, // divisible by 10
//     name: {
//         $regex: /^[A-Z]/,
//         $options: "i"
//     }
// };

// // String regex with options
// const testRegexString: StrictFilter<TestSchema> = {
//     name: {
//         $regex: "^user_",
//         $options: "im"
//     },
//     "profile.email": {
//         $regex: "@example\\.com$"
//     }
// };

// // Logical operators on fields
// const testFieldLogical: StrictFilter<TestSchema> = {
//     age: { $not: { $gte: 65 } }, // not senior
//     name: { $not: /^admin/i }    // name doesn't start with admin
// };

// // Geospatial operators
// const testGeo: StrictFilter<TestSchema> = {
//     location: {
//         $geoIntersects: {
//             $geometry: {
//                 type: "Polygon",
//                 coordinates: [[[0, 0], [3, 6], [6, 1], [0, 0]]]
//             }
//         }
//     }
// };

// const testGeoWithin: StrictFilter<TestSchema> = {
//     location: {
//         $geoWithin: {
//             $centerSphere: [[-73.93414657, 40.82302903], 10 / 3963.2] // 10 miles
//         }
//     }
// };

// const testNear: StrictFilter<TestSchema> = {
//     location: {
//         $near: {
//             $geometry: { type: "Point", coordinates: [-73.9667, 40.78] },
//             $minDistance: 1000,
//             $maxDistance: 5000
//         }
//     }
// };

// const testNearSphere: StrictFilter<TestSchema> = {
//     location: {
//         $nearSphere: {
//             $geometry: { type: "Point", coordinates: [2.35, 48.85] },
//             $maxDistance: 1000,
//             // @ts-expect-error
//             $unknown: { $lt: 100 }
//         }
//     }
// };

// // Array operators
// const testArray: StrictFilter<TestSchema> = {
//     tags: {
//         $all: ["javascript", "typescript"],
//         $size: 3,
//     },
//     scores: {
//         $elemMatch: { $gte: 80, $lte: 100 }
//     },
//     items: {
//         $elemMatch: {
//             quantity: { $gt: 5 },
//             price: { $lt: 100 },
//             // @ts-expect-error
//             unknown: { $lt: 100 }
//         }
//     }
// };

// // Array operators
// const testArrayFail: StrictFilter<TestSchema> = {
//     tags: {
//         $all: ["javascript", "typescript"],
//         $size: 3,
//         // @ts-expect-error
//         $unknown: 0,
//     },
//     scores: {
//         $elemMatch: { $gte: 80, $lte: 100 }
//     },
//     items: {
//         $elemMatch: {
//             quantity: { $gt: 5 },
//             price: { $lt: 100 },
//             // @ts-expect-error
//             unknown: { $lt: 100 }
//         }
//     }
// };


// // Bitwise operators
// const testBitwise: StrictFilter<TestSchema> = {
//     age: {
//         $bitsAllClear: 3,       // bits 0 and 1 are clear
//         $bitsAllSet: 12,        // bits 2 and 3 are set
//         $bitsAnyClear: [0, 1, 2], // at least one of these bit positions is clear
//         $bitsAnySet: [4, 5],     // at least one of these bit positions is set
//         // @ts-expect-error
//         $unknown: 0,
//     }
// };

// // ============================================================================
// // COMPLEX COMBINED QUERIES
// // ============================================================================

// // Combining root and field operators
// const testCombined1: StrictFilter<TestSchema> = {
//     $and: [
//         { age: { $gte: 21 } },
//         { tags: { $in: ["verified", "premium"] } }
//     ],
//     $or: [
//         { isActive: true },
//         {
//             deletedAt: { $exists: false },
//             // @ts-expect-error
//             unknown: { $exists: false },
//         }
//     ],
//     $expr: {
//         $gt: [{
//             $size: "$scores"
//         }, 0]
//     }
// };

// // Complex nested query
// const testCombined2: StrictFilter<TestSchema> = {
//     "profile.address.city": { $in: ["New York", "Los Angeles"] },
//     "profile.email": { $regex: /@(gmail|yahoo)\.com$/ },
//     $text: { $search: "software engineer" },
//     $comment: "Job search query",
//     // @ts-expect-error
//     $unknown: "Job search query"
// };

// // Query with all logical operators
// const testAllLogical: StrictFilter<TestSchema> = {
//     $and: [
//         { isActive: true },
//         {
//             $or: [
//                 { age: { $lt: 25 } },
//                 { age: { $gt: 60 } }
//             ]
//         }
//     ],
//     $nor: [
//         { tags: "banned" },
//         { "profile.email": { $regex: /@spam\./ } }
//     ]
// };

// // Query mixing $expr with regular filters
// const testMixedExpr: StrictFilter<TestSchema> = {
//     isActive: true,
//     tags: { $in: ["user", "admin"] },
//     $expr: {
//         $and: [
//             { $gte: ["$age", 18] },
//             { $lte: ["$age", 65] },
//             { $eq: [{ $mod: ["$age", 5] }, 0] }
//         ]
//     },
//     $comment: "Active users of working age divisible by 5"
// };

// // ============================================================================
// // NEGATIVE TESTS - Should FAIL
// // ============================================================================

// // Invalid field in root filter
// const failRootFilter1: StrictFilter<TestSchema> = {
//     // @ts-expect-error - 'unknownField' does not exist
//     unknownField: "value"
// };

// // Invalid nested field
// const failRootFilter2: StrictFilter<TestSchema> = {
//     // @ts-expect-error - 'profile.unknown' is not a valid path
//     "profile.unknown": "value"
// };

// // Invalid $text options
// const failText: StrictFilter<TestSchema> = {
//     $text: {
//         $search: "query",
//         // @ts-expect-error - 'fuzzy' is not a valid text search option
//         $fuzzy: true
//     }
// };

// // $where with wrong type
// const failWhere: StrictFilter<TestSchema> = {
//     // @ts-expect-error - $where must be string or function
//     $where: 123
// };

// // Invalid logical operator value
// const failLogical: StrictFilter<TestSchema> = {
//     // @ts-expect-error - $and must be an array
//     $and: { age: 25 }
// };

// // ============================================================================
// // CASTING TESTS - Ensure StrictFilter casts to mongodb.Filter
// // ============================================================================

// // Test basic cast
// const strictFilter1: StrictFilter<TestSchema> = {
//     age: { $gte: 18 },
//     tags: { $in: ["user"] }
// };
// const mongoFilter1: mongodb.Filter<TestSchema> = strictFilter1; // Should work

// // Test cast with root operators
// const strictFilter2: StrictFilter<TestSchema> = {
//     $expr: { $gt: ["$age", 21] },
//     $text: { $search: "test" },
//     $comment: "test query"
// };
// const mongoFilter2: mongodb.Filter<TestSchema> = strictFilter2; // Should work

// // Test cast with complex query
// const strictFilter3: StrictFilter<TestSchema> = {
//     $and: [
//         { age: { $gte: 18 } },
//         { isActive: true }
//     ],
//     $or: [
//         { tags: "admin" },
//         { tags: "moderator" }
//     ],
//     $expr: {
//         $and: [
//             { $gt: [{ $size: "$tags" }, 0] },
//             { $lte: ["$age", 100] }
//         ]
//     },
//     $text: { $search: "search term" },
//     $where: "this.age > 0",
//     $jsonSchema: { required: ["id"] },
//     $comment: "complex query"
// };
// const mongoFilter3: mongodb.Filter<TestSchema> = strictFilter3; // Should work

// // ============================================================================
// // FUNCTION TESTS - Using filters in MongoDB operations
// // ============================================================================

// declare const collection: mongodb.Collection<TestSchema>;

// // Test with find
// async function testFind() {
//     const filter: StrictFilter<TestSchema> = {
//         age: { $gte: 18 },
//         $text: { $search: "developer" }
//     };

//     const results = await collection.find(filter).toArray();
// }

// // Test with findOne
// async function testFindOne() {
//     const filter: StrictFilter<TestSchema> = {
//         // id: "123",
//         $expr: { $gt: ["$age", 21] }
//     };

//     const result = await collection.findOne(filter);
// }

// // Test with countDocuments
// async function testCount() {
//     const filter: StrictFilter<TestSchema> = {
//         isActive: true,
//         $or: [
//             { age: { $lt: 25 } },
//             { age: { $gt: 60 } }
//         ]
//     };

//     const count = await collection.countDocuments(filter);
// }

// // Test with deleteMany
// async function testDelete() {
//     const filter: StrictFilter<TestSchema> = {
//         deletedAt: { $exists: true },
//         $expr: {
//             $lt: ["$deletedAt", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)]
//         }
//     };

//     const result = await collection.deleteMany(filter);
// }

// // Test with updateMany
// async function testUpdate() {
//     const filter: StrictFilter<TestSchema> = {
//         isActive: false,
//         $where: "this.age >= 18"
//     };

//     const update: mongodb.UpdateFilter<TestSchema> = {
//         $set: { isActive: true }
//     };

//     const result = await collection.updateMany(filter, update);
// }

// // ============================================================================
// // GENERIC FUNCTION TESTS
// // ============================================================================

// // Generic function accepting StrictFilter
// function processDocuments<T extends mongodb.Document>(
//     collection: mongodb.Collection<T>,
//     filter: StrictFilter<T>
// ) {
//     // Should be able to pass to MongoDB operations
//     return collection.find(filter as mongodb.Filter<T>).toArray();
// }

// // Test generic function
// async function testGeneric() {
//     const filter: StrictFilter<TestSchema> = {
//         age: { $gte: 21 },
//         $text: { $search: "test" }
//     };

//     await processDocuments(collection, filter);
// }

// // ============================================================================
// // BULK OPERATIONS TEST
// // ============================================================================

// async function testBulkOperations() {
//     const bulkOps: mongodb.AnyBulkWriteOperation<TestSchema>[] = [
//         {
//             updateOne: {
//                 filter: {
//                     id: "123",
//                     $expr: { $gt: ["$age", 18] }
//                 } as StrictFilter<TestSchema>,
//                 update: {
//                     $set: { isActive: true }
//                 } as mongodb.UpdateFilter<TestSchema>
//             }
//         },
//         {
//             deleteOne: {
//                 filter: {
//                     id: "456",
//                     deletedAt: { $exists: true }
//                 } as StrictFilter<TestSchema>
//             }
//         }
//     ];

//     await collection.bulkWrite(bulkOps);
// }

// // ============================================================================
// // EXTRA StrictFilter → mongodb.Filter casts (requested)
// // ============================================================================

// const extraCast1: mongodb.Filter<TestSchema> = ({
//     'profile.address.city': { $in: ['Paris', 'London'] },
//     'profile.email': { $regex: /@example\.com$/ }
// } as StrictFilter<TestSchema>);

// const extraCast2: mongodb.Filter<TestSchema> = ({
//     $and: [{ age: { $gte: 18 } }, { isActive: true }],
//     $expr: { $gt: [{ $size: '$tags' }, 0] }
// } as StrictFilter<TestSchema>);

// const extraCast3: mongodb.Filter<TestSchema> = ({
//     scores: { $elemMatch: { $gte: 95 } }
// } as StrictFilter<TestSchema>);

// const extraCast4: mongodb.Filter<TestSchema> = ({
//     tags: { $in: ['user'] },
//     $nor: [{ 'profile.address.city': { $regex: /spam/i } }]
// } as StrictFilter<TestSchema>);

// const extraCast5: mongodb.Filter<TestSchema> = ({
//     location: {
//         $near: {
//             $geometry: { type: 'Point', coordinates: [0, 0] },
//             $maxDistance: 5000
//         }
//     }
// } as StrictFilter<TestSchema>);


// // Real code tests.
// class SomeClass<Data extends mongodb.Document> {
//     col!: mongodb.Collection<Data>;
//     cast(query: StrictFilter<Data>): void {
//         const q: mongodb.Filter<Data> = query;
//     }
//     async find(query: StrictFilter<Data>): Promise<mongodb.WithId<Data> | undefined> {
//         return await this.col.findOne(
//             query,
//         ) ?? undefined;
//     }
// }

// // -------------------------------------------
// // Fixed type with $in etc

// // Array operator with wrong element type in filter
// const successFilterIn_1: StrictFilter<{
//     status: "active" | "closed",
// }> = {
//     status: {
//         $in: ['active']
//     }
// };
// const failedFilterIn_1: StrictFilter<{
//     status: "active" | "closed",
// }> = {
//     status: {
//         // @ts-expect-error
//         $in: ['unknown']
//     }
// };