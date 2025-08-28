// ============================================================================
// StrictFilter Tests - Should FAIL (produce TypeScript errors)
// ============================================================================
// Test 1: Unknown top-level field in filter
const failFilter1 = {
    // @ts-expect-error - 'unknownField' does not exist in TestSchema
    unknownField: 'value',
};
// Test 2: Unknown nested field in filter
const failFilter2 = {
    // @ts-expect-error - 'profile.unknownField' is not a valid path
    'profile.unknownField': 'value',
};
// Test 3: Unknown deep nested field in filter
const failFilter3 = {
    // @ts-expect-error - 'profile.address.country' does not exist
    'profile.address.country': 'USA',
};
// Test 4: Typo in field name
const failFilter4 = {
    // @ts-expect-error - 'nmae' is a typo, should be 'name'
    nmae: 'John',
};
// ============================================================================
// StrictUpdateFilter Tests - Should FAIL (produce TypeScript errors)
// ============================================================================
// Test 5: Unknown field in $set
const failUpdate1 = {
    $set: {
        // @ts-expect-error - 'unknown' does not exist in TestSchema
        unknown: true,
    }
};
// Test 6: Unknown nested field in $set
const failUpdate2 = {
    $set: {
        // @ts-expect-error - 'profile.unknown' is not a valid path
        'profile.unknown': 'value',
    }
};
// Test 7: Unknown field in $inc
const failUpdate3 = {
    $inc: {
        // @ts-expect-error - 'unknownNumber' does not exist
        unknownNumber: 1,
    }
};
// Test 8: Using $inc on non-numeric field
const failUpdate4 = {
    $inc: {
        // @ts-expect-error - 'name' is a string, not a number
        name: 1,
    }
};
// Test 9: Unknown field in $unset
const failUpdate5 = {
    $unset: {
        // @ts-expect-error - 'notAField' does not exist
        notAField: true,
    }
};
// Test 10: Unknown field in $push
const failUpdate6 = {
    $push: {
        // @ts-expect-error - 'unknownArray' does not exist
        unknownArray: 'item',
    }
};
// Test 11: Using $push on non-array field
const failUpdate7 = {
    $push: {
        // @ts-expect-error - 'name' is not an array
        name: 'value',
    }
};
// Test 12: Unknown field in $pull
const failUpdate8 = {
    $pull: {
        // @ts-expect-error - 'fakeArray' does not exist
        fakeArray: 'item',
    }
};
// Test 13: Unknown field in $rename
const failUpdate9 = {
    $rename: {
        // @ts-expect-error - 'oldField' does not exist
        oldField: 'newField',
    }
};
// Test 14: Unknown field in $currentDate
const failUpdate10 = {
    $currentDate: {
        // @ts-expect-error - 'timestamp' does not exist
        timestamp: true,
    }
};
// Test 15: Using $currentDate on non-date field
const failUpdate11 = {
    $currentDate: {
        // @ts-expect-error - 'name' is not a Date field
        name: true,
    }
};
// Test 16: Unknown field in $mul
const failUpdate12 = {
    $mul: {
        // @ts-expect-error - 'multiplier' does not exist
        multiplier: 2,
    }
};
// Test 17: Using $mul on non-numeric field
const failUpdate13 = {
    $mul: {
        // @ts-expect-error - 'isActive' is boolean, not number
        isActive: 2,
    }
};
// Test 18: Unknown field in $min
const failUpdate14 = {
    $min: {
        // @ts-expect-error - 'minimum' does not exist
        minimum: 10,
    }
};
// Test 19: Unknown field in $max
const failUpdate15 = {
    $max: {
        // @ts-expect-error - 'maximum' does not exist
        maximum: 100,
    }
};
// Test 20: Unknown field in $addToSet
const failUpdate16 = {
    $addToSet: {
        // @ts-expect-error - 'collection' does not exist
        collection: 'item',
    }
};
// Test 21: Using $pop on non-array field
const failUpdate17 = {
    $pop: {
        // @ts-expect-error - 'age' is not an array
        age: 1,
    }
};
// Test 22: Unknown field in $pullAll
const failUpdate18 = {
    $pullAll: {
        // @ts-expect-error - 'list' does not exist
        list: ['item1', 'item2'],
    }
};
// Test 23: Unknown field in $bit
const failUpdate19 = {
    $bit: {
        // @ts-expect-error - 'bitField' does not exist
        bitField: { and: 5 },
    }
};
// Test 24: Using $bit on non-numeric field
const failUpdate20 = {
    $bit: {
        // @ts-expect-error - 'name' is not a number
        name: { or: 3 },
    }
};
// ============================================================================
// Valid Tests - Should PASS (no TypeScript errors)
// ============================================================================
// Valid filter with direct fields
const validFilter1 = {
    name: 'John',
    age: 30,
    isActive: true,
};
// Valid filter with operators
const validFilter2 = {
    age: { $gte: 18, $lte: 65 },
    name: { $regex: '^J' },
    tags: { $in: ['admin', 'user'] },
};
// Valid filter with nested paths
const validFilter3 = {
    'profile.email': 'test@example.com',
    'profile.address.city': 'New York',
    'profile.address.zip': { $gte: 10000 },
};
// Valid filter with logical operators
const validFilter4 = {
    $or: [
        { age: { $lt: 18 } },
        { age: { $gte: 65 } }
    ],
    $and: [
        { isActive: true },
        { tags: { $in: ['premium'] } }
    ],
};
// Valid $set update
const validUpdate1 = {
    $set: {
        name: 'Jane',
        age: 25,
        'profile.email': 'jane@example.com',
        'profile.address.street': '123 Main St',
    }
};
// Valid $inc update
const validUpdate2 = {
    $inc: {
        age: 1,
        'profile.address.zip': 100,
    }
};
// Valid $push and $pull
const validUpdate3 = {
    $push: {
        tags: 'new-tag',
        scores: 95,
    },
    $pull: {
        tags: 'old-tag',
    }
};
// Valid $unset
const validUpdate4 = {
    $unset: {
        description: true,
        deletedAt: '',
    }
};
// Valid $currentDate
const validUpdate5 = {
    $currentDate: {
        createdAt: true,
        deletedAt: { $type: 'date' },
    }
};
// Valid $min and $max
const validUpdate6 = {
    $min: {
        age: 0,
    },
    $max: {
        age: 120,
    }
};
// Valid $mul
const validUpdate7 = {
    $mul: {
        age: 1.5,
        'profile.address.zip': 2,
    }
};
// Valid $rename
const validUpdate8 = {
    $rename: {
        name: 'fullName',
        'profile.email': 'contact',
    }
};
// Valid $addToSet
const validUpdate9 = {
    $addToSet: {
        tags: 'unique-tag',
        scores: { $each: [100, 95, 90] },
    }
};
// Valid $pop
const validUpdate10 = {
    $pop: {
        tags: 1,
        scores: -1,
    }
};
// Valid $pullAll
const validUpdate11 = {
    $pullAll: {
        tags: ['tag1', 'tag2'],
        scores: [0, 50],
    }
};
// Valid $bit
const validUpdate12 = {
    $bit: {
        age: { and: 5 },
        'profile.address.zip': { or: 100 },
    }
};
// Valid complex update with multiple operators
const validUpdate13 = {
    $set: {
        name: 'Updated Name',
        'profile.email': 'new@example.com',
    },
    $inc: {
        age: 1,
    },
    $push: {
        tags: 'new',
    },
    $unset: {
        description: true,
    },
    $currentDate: {
        createdAt: true,
    }
};
// Valid $setOnInsert
const validUpdate14 = {
    $setOnInsert: {
        id: 'new-id',
        name: 'Default Name',
        age: 0,
        'profile.email': 'default@example.com',
    }
};
// ============================================================================
// ADDITIONAL NEGATIVE TESTS (Should FAIL)
// ============================================================================
// Array operator with wrong element type in filter
const failFilter5 = {
    // @ts-expect-error - $in expects string[], not string[][]
    tags: {
        $in: [['admin']]
    }
};
// Wrong value type pushed into number[] array
const failUpdate21 = {
    $push: {
        // @ts-expect-error - scores is number[], cannot push string
        scores: 'oops',
    }
};
// Wrong $each element type in $addToSet for number[]
const failUpdate22 = {
    $addToSet: {
        // @ts-expect-error - scores is number[], $each expects number[]
        scores: { $each: ['100'] },
    }
};
// Wrong $type option for $currentDate
const failUpdate23 = {
    $currentDate: {
        // @ts-expect-error - only 'date' | 'timestamp' are allowed
        createdAt: { $type: 'now' },
    }
};
// Wrong value for $unset (must be '' | true | 1)
const failUpdate24 = {
    $unset: {
        // @ts-expect-error - invalid unset spec
        name: 2,
    }
};
// Wrong value for $pop (must be 1 or -1)
const failUpdate25 = {
    $pop: {
        // @ts-expect-error - only 1 or -1 are allowed
        tags: 0,
    }
};
// ============================================================================
// ADDITIONAL POSITIVE TESTS (Should PASS)
// ============================================================================
// Array equality in filter
const validFilter5 = {
    tags: ['a', 'b'],
};
// Element-wise operator on array field
const validFilter6 = {
    scores: { $gte: 50 },
};
// Using $exists on optional field
const validFilter7 = {
    description: { $exists: false },
};
// Using $not with regex
const validFilter8 = {
    name: { $not: { $regex: '^A' } },
};
// Using $nor
const validFilter9 = {
    $nor: [{ isActive: false }, { age: { $lt: 18 } }],
};
// Nested numeric with $in
const validFilter10 = {
    'profile.address.zip': { $in: [10000, 20000] },
};
// $push with $each on string[]
const validUpdate15 = {
    $push: {
        tags: { $each: ['x', 'y'] },
    }
};
// $addToSet for array of objects
const validUpdate16 = {
    $addToSet: {
        items: { id: 'sku-1', quantity: 2 },
    }
};
// $addToSet with $each for array of objects
const validUpdate17 = {
    $addToSet: {
        items: {
            $each: [
                { id: 'sku-2', quantity: 1 },
                { id: 'sku-3', quantity: 5 },
            ]
        }
    }
};
// $pull using operator on primitive array
const validUpdate18 = {
    $pull: {
        tags: { $in: ['legacy', 'old'] },
        scores: { $gt: 100 },
    }
};
// $min/$max on Date field
const validUpdate19 = {
    $min: { createdAt: new Date(0) },
    $max: { createdAt: new Date() },
};
// $rename on deep nested field
const validUpdate20 = {
    $rename: {
        'profile.address.street': 'streetLine1',
    }
};
// StrictFilter → mongodb.Filter
const strictFilterForCast = {
    age: { $gte: 21 },
    isActive: true,
    tags: { $in: ['admin', 'user'] },
};
const mongoFilterCast = strictFilterForCast;
// StrictUpdateFilter → mongodb.UpdateFilter
const strictUpdateForCast = {
    $set: { name: 'Cast OK' },
    $inc: { age: 1 },
};
const mongoUpdateCast = strictUpdateForCast;
const strictUpdateForUpdateMany = {
    $set: { name: 'Overload OK' },
    $inc: { age: 2 },
};
void colX.updateMany({ id: 'abc' }, strictUpdateForUpdateMany, {});
function update_test_1(filter, update_filter) {
    colX.updateMany(filter, update_filter, {});
}
const okStrictUpdateConcrete = {
    $set: { name: "Overload OK" },
    $inc: { age: 2 },
};
colConcrete.updateMany({ id: "abc" }, okStrictUpdateConcrete, {}); // OK
function genericSaveRepro(filter, op) {
    const bulkOp = {
        updateOne: {
            filter,
            update: op, // <- This is where TS2322 shows up pre-fix
            upsert: true,
        },
    };
    // @ts-expect-error – pre-fix: StrictUpdateFilter<Data> not assignable to UpdateFilter<Data>
    acceptsBulk(bulkOp);
    // Also directly:
    // @ts-expect-error – pre-fix: same reason
    const _direct = bulkOp;
    // And findOneAndUpdate:
    const colGeneric = null;
    // @ts-expect-error – pre-fix: StrictUpdateFilter<Data> not assignable to UpdateFilter<Data>
    colGeneric.findOneAndUpdate(filter, op);
}
// ----- $currentDate guardrails still behave -----
{
    // OK: $currentDate on date field
    const okCD = {
        $currentDate: { "createdAt": true },
    };
    const badCD = {
        // @ts-expect-error – should be rejected: $currentDate on non-date field
        $currentDate: { "name": true },
    };
}
export {};
// DOES NOT PASS THE FOLLOWING BECAUSE OF TEMPLATE.
// function forcesRealCheck<Data extends mongodb.Document>(
//     filter: mongodb.Filter<Data>,
//     op: StrictUpdateFilter<Data>
// ) {
//     // 🔴 This mirrors collection.ts exactly
//     const x: mongodb.AnyBulkWriteOperation<Data> = {
//         updateOne: { filter, update: op, upsert: true },
//     };
//     void x;
// }
