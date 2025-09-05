import { StrictUpdateFilter } from './strict_update_filter.js';

// ============================================================================
// COMPREHENSIVE TEST SUITE
// ============================================================================

interface TestSchema {
    // Basic types
    // id: string;
    objectId?: mongodb.ObjectId;
    name: string;
    age: number;
    isActive: boolean;
    createdAt: Date;

    // Arrays
    tags: string[];
    scores: number[];

    // Nested objects
    profile: {
        email: string;
        phone: string;
        address: {
            street: string;
            city: string;
            zip: number;
        };
    };

    // Optional fields
    description?: string;
    deletedAt?: Date;

    // Complex arrays
    items: Array<{
        id: string;
        quantity: number;
    }>;

    // Geospatial field
    location?: {
        type: 'Point';
        coordinates: [number, number];
    };

    // Binary data field
    binaryField?: mongodb.Binary;
}

// ============================================================================
// StrictUpdateFilter Tests - Should FAIL (produce TypeScript errors)
// ============================================================================

// Test 5: Unknown field in $set
const failUpdate1: StrictUpdateFilter<TestSchema> = {
    $set: {
        // @ts-expect-error - 'unknown' does not exist in TestSchema
        unknown: true,
    }
};

// Test 6: Unknown nested field in $set
const failUpdate2: StrictUpdateFilter<TestSchema> = {
    $set: {
        // @ts-expect-error - 'profile.unknown' is not a valid path
        'profile.unknown': 'value',
    }
};

// Test 7: Unknown field in $inc
const failUpdate3: StrictUpdateFilter<TestSchema> = {
    $inc: {
        // @ts-expect-error - 'unknownNumber' does not exist
        unknownNumber: 1,
    }
};

// Test 8: Using $inc on non-numeric field
const failUpdate4: StrictUpdateFilter<TestSchema> = {
    $inc: {
        // @ts-expect-error - 'name' is a string, not a number
        name: 1,
    }
};

// Test 9: Unknown field in $unset
const failUpdate5: StrictUpdateFilter<TestSchema> = {
    $unset: {
        // @ts-expect-error - 'notAField' does not exist
        notAField: true,
    }
};

// Test 10: Unknown field in $push
const failUpdate6: StrictUpdateFilter<TestSchema> = {
    $push: {
        // @ts-expect-error - 'unknownArray' does not exist
        unknownArray: 'item',
    }
};

// Test 11: Using $push on non-array field
const failUpdate7: StrictUpdateFilter<TestSchema> = {
    $push: {
        // @ts-expect-error - 'name' is not an array
        name: 'value',
    }
};

// Test 12: Unknown field in $pull
const failUpdate8: StrictUpdateFilter<TestSchema> = {
    $pull: {
        // @ts-expect-error - 'fakeArray' does not exist
        fakeArray: 'item',
    }
};

// Test 13: Unknown field in $rename
const failUpdate9: StrictUpdateFilter<TestSchema> = {
    $rename: {
        // @ts-expect-error - 'oldField' does not exist
        oldField: 'newField',
    }
};

// Test 14: Unknown field in $currentDate
const failUpdate10: StrictUpdateFilter<TestSchema> = {
    $currentDate: {
        // @ts-expect-error - 'timestamp' does not exist
        timestamp: true,
    }
};

// Test 15: Using $currentDate on non-date field
const failUpdate11: StrictUpdateFilter<TestSchema> = {
    $currentDate: {
        // @ts-expect-error - 'name' is not a Date field
        name: true,
    }
};

// Test 16: Unknown field in $mul
const failUpdate12: StrictUpdateFilter<TestSchema> = {
    $mul: {
        // @ts-expect-error - 'multiplier' does not exist
        multiplier: 2,
    }
};

// Test 17: Using $mul on non-numeric field
const failUpdate13: StrictUpdateFilter<TestSchema> = {
    $mul: {
        // @ts-expect-error - 'isActive' is boolean, not number
        isActive: 2,
    }
};

// Test 18: Unknown field in $min
const failUpdate14: StrictUpdateFilter<TestSchema> = {
    $min: {
        // @ts-expect-error - 'minimum' does not exist
        minimum: 10,
    }
};

// Test 19: Unknown field in $max
const failUpdate15: StrictUpdateFilter<TestSchema> = {
    $max: {
        // @ts-expect-error - 'maximum' does not exist
        maximum: 100,
    }
};

// Test 20: Unknown field in $addToSet
const failUpdate16: StrictUpdateFilter<TestSchema> = {
    $addToSet: {
        // @ts-expect-error - 'collection' does not exist
        collection: 'item',
    }
};

// Test 21: Using $pop on non-array field
const failUpdate17: StrictUpdateFilter<TestSchema> = {
    $pop: {
        // @ts-expect-error - 'age' is not an array
        age: 1,
    }
};

// Test 22: Unknown field in $pullAll
const failUpdate18: StrictUpdateFilter<TestSchema> = {
    $pullAll: {
        // @ts-expect-error - 'list' does not exist
        list: ['item1', 'item2'],
    }
};

// Test 23: Unknown field in $bit
const failUpdate19: StrictUpdateFilter<TestSchema> = {
    $bit: {
        // @ts-expect-error - 'bitField' does not exist
        bitField: { and: 5 },
    }
};

// Test 24: Using $bit on non-numeric field
const failUpdate20: StrictUpdateFilter<TestSchema> = {
    $bit: {
        // @ts-expect-error - 'name' is not a number
        name: { or: 3 },
    }
};

// ============================================================================
// Valid Tests - Should PASS (no TypeScript errors)
// ============================================================================

// Valid $set update
const validUpdate1: StrictUpdateFilter<TestSchema> = {
    $set: {
        name: 'Jane',
        age: 25,
        'profile.email': 'jane@example.com',
        'profile.address.street': '123 Main St',
    }
};

// Valid $inc update
const validUpdate2: StrictUpdateFilter<TestSchema> = {
    $inc: {
        age: 1,
        'profile.address.zip': 100,
    }
};

// Valid $push and $pull
const validUpdate3: StrictUpdateFilter<TestSchema> = {
    $push: {
        tags: 'new-tag',
        scores: 95,
    },
    $pull: {
        tags: 'old-tag',
    }
};

// Valid $unset
const validUpdate4: StrictUpdateFilter<TestSchema> = {
    $unset: {
        description: true,
        deletedAt: '',
    }
};

// Valid $currentDate
const validUpdate5: StrictUpdateFilter<TestSchema> = {
    $currentDate: {
        createdAt: true,
        deletedAt: { $type: 'date' },
    }
};

// Valid $min and $max
const validUpdate6: StrictUpdateFilter<TestSchema> = {
    $min: {
        age: 0,
    },
    $max: {
        age: 120,
    }
};

// Valid $mul
const validUpdate7: StrictUpdateFilter<TestSchema> = {
    $mul: {
        age: 1.5,
        'profile.address.zip': 2,
    }
};

// Valid $rename
const validUpdate8: StrictUpdateFilter<TestSchema> = {
    $rename: {
        name: 'fullName',
        'profile.email': 'contact',
    }
};

// Valid $addToSet
const validUpdate9: StrictUpdateFilter<TestSchema> = {
    $addToSet: {
        tags: 'unique-tag',
        scores: { $each: [100, 95, 90] },
    }
};

// Valid $pop
const validUpdate10: StrictUpdateFilter<TestSchema> = {
    $pop: {
        tags: 1,
        scores: -1,
    }
};

// Valid $pullAll
const validUpdate11: StrictUpdateFilter<TestSchema> = {
    $pullAll: {
        tags: ['tag1', 'tag2'],
        scores: [0, 50],
    }
};

// Valid $bit
const validUpdate12: StrictUpdateFilter<TestSchema> = {
    $bit: {
        age: { and: 5 },
        'profile.address.zip': { or: 100 },
    }
};

// Valid complex update with multiple operators
const validUpdate13: StrictUpdateFilter<TestSchema> = {
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
const validUpdate14: StrictUpdateFilter<TestSchema> = {
    $setOnInsert: {
        // id: 'new-id',
        name: 'Default Name',
        age: 0,
        'profile.email': 'default@example.com',
    }
};

// ============================================================================
// ADDITIONAL NEGATIVE TESTS (Should FAIL)
// ============================================================================


// Wrong value type pushed into number[] array
const failUpdate21: StrictUpdateFilter<TestSchema> = {
    $push: {
        // @ts-expect-error - scores is number[], cannot push string
        scores: 'oops',
    }
};

// Wrong $each element type in $addToSet for number[]
const failUpdate22: StrictUpdateFilter<TestSchema> = {
    $addToSet: {
        // @ts-expect-error - scores is number[], $each expects number[]
        scores: { $each: ['100'] },
    }
};

// Wrong $type option for $currentDate
const failUpdate23: StrictUpdateFilter<TestSchema> = {
    $currentDate: {
        // @ts-expect-error - only 'date' | 'timestamp' are allowed
        createdAt: { $type: 'now' },
    }
};

// Wrong value for $unset (must be '' | true | 1)
const failUpdate24: StrictUpdateFilter<TestSchema> = {
    $unset: {
        // @ts-expect-error - invalid unset spec
        name: 2,
    }
};

// Wrong value for $pop (must be 1 or -1)
const failUpdate25: StrictUpdateFilter<TestSchema> = {
    $pop: {
        // @ts-expect-error - only 1 or -1 are allowed
        tags: 0,
    }
};

// ============================================================================
// ADDITIONAL POSITIVE TESTS (Should PASS)
// ============================================================================

// $push with $each on string[]
const validUpdate15: StrictUpdateFilter<TestSchema> = {
    $push: {
        tags: { $each: ['x', 'y'] },
    }
};

// $addToSet for array of objects
const validUpdate16: StrictUpdateFilter<TestSchema> = {
    $addToSet: {
        items: { id: 'sku-1', quantity: 2 },
    }
};

// $addToSet with $each for array of objects
const validUpdate17: StrictUpdateFilter<TestSchema> = {
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
const validUpdate18: StrictUpdateFilter<TestSchema> = {
    $pull: {
        tags: { $in: ['legacy', 'old'] },
        scores: { $gt: 100 },
    }
};

// $min/$max on Date field
const validUpdate19: StrictUpdateFilter<TestSchema> = {
    $min: { createdAt: new Date(0) },
    $max: { createdAt: new Date() },
};

// $rename on deep nested field
const validUpdate20: StrictUpdateFilter<TestSchema> = {
    $rename: {
        'profile.address.street': 'streetLine1',
    }
};




// ============================================================================
// CASTING TO OFFICIAL MONGODB TYPES (Should PASS)
// ============================================================================

import type * as mongodb from 'mongodb';

// StrictUpdateFilter → mongodb.UpdateFilter
const strictUpdateForCast: StrictUpdateFilter<TestSchema> = {
    $set: { name: 'Cast OK' },
    $inc: { age: 1 },
};
const mongoUpdateCast: mongodb.UpdateFilter<TestSchema> = strictUpdateForCast;

// ============================================================================
// UPDATE MANY OVERLOAD WITH STRICT UPDATE (Should PASS)
// ============================================================================

declare const colX: mongodb.Collection<TestSchema>;

const strictUpdateForUpdateMany: StrictUpdateFilter<TestSchema> = {
    $set: { name: 'Overload OK' },
    $inc: { age: 2 },
};

void colX.updateMany(
    { id: 'abc' },
    strictUpdateForUpdateMany,
    {}
);

function update_test_1(
    filter: mongodb.Filter<TestSchema>,
    update_filter: StrictUpdateFilter<TestSchema>
) {
    colX.updateMany(
        filter,
        update_filter,
        {}
    );
}

// ============================================================================
// SIMULATING CAST ERRORS FROM REAL CODE.
// ============================================================================

// A concrete schema for comparison
type TestSchema2 = {
    id: string;
    name: string;
    age?: number;
    createdAt: Date;
};

// ----- Control: with a concrete schema, typical calls compile -----
declare const colConcrete: mongodb.Collection<TestSchema2>;

const okStrictUpdateConcrete: StrictUpdateFilter<TestSchema2> = {
    $set: { name: "Overload OK" },
    $inc: { age: 2 },
};

// ----- Repro: generic boundary (mirrors your save/bulk path) -----
declare function acceptsBulk<T extends mongodb.Document>(
    op: mongodb.AnyBulkWriteOperation<T>
): void;

function genericSaveRepro<Data extends mongodb.Document>(
    filter: mongodb.Filter<Data>,
    op: StrictUpdateFilter<Data>,
) {
    const bulkOp = {
        updateOne: {
            filter,
            update: op, // <- This is where TS2322 shows up pre-fix
            upsert: true,
        },
    };

    // @ts-expect-error – pre-fix: StrictUpdateFilter<Data> not assignable to UpdateFilter<Data>
    acceptsBulk<Data>(bulkOp);

    // Also directly:
    // @ts-expect-error – pre-fix: same reason
    const _direct: mongodb.AnyBulkWriteOperation<Data> = bulkOp;

    // And findOneAndUpdate:
    const colGeneric: mongodb.Collection<Data> = null as any;
    // @ts-expect-error – pre-fix: StrictUpdateFilter<Data> not assignable to UpdateFilter<Data>
    colGeneric.findOneAndUpdate(filter, op);
}

// ----- $currentDate guardrails still behave -----
{
    type TS = { createdAt: Date; name: string };

    // OK: $currentDate on date field
    const okCD: StrictUpdateFilter<TS> = {
        $currentDate: { "createdAt": true },
    };

    const badCD: StrictUpdateFilter<TS> = {
        // @ts-expect-error – should be rejected: $currentDate on non-date field
        $currentDate: { "name": true },
    };
}

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

// --------------------------------------
// Errors encountered in Quota

export interface Query<Type extends string> {
    uid: string;
    type: Type;
    name: string;
}
type Quota = {
    max: number;
    interval: number;
    start: number;
    usage: number;
}
type QuotaDocument<Type extends string> = Query<Type> & Quota;

const ok_query: StrictUpdateFilter<QuotaDocument<'my-project'>> = {
    $set: {
        max: 0,
        interval: 0,
    },
    $setOnInsert: {
        usage: 0,
        start: 0,
    },
};