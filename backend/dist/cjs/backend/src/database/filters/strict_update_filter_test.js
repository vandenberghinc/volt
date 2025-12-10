var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
module.exports = __toCommonJS(stdin_exports);
const failUpdate1 = {
  $set: {
    // @ts-expect-error - 'unknown' does not exist in TestSchema
    unknown: true
  }
};
const failUpdate2 = {
  $set: {
    // @ts-expect-error - 'profile.unknown' is not a valid path
    "profile.unknown": "value"
  }
};
const failUpdate3 = {
  $inc: {
    // @ts-expect-error - 'unknownNumber' does not exist
    unknownNumber: 1
  }
};
const failUpdate4 = {
  $inc: {
    // @ts-expect-error - 'name' is a string, not a number
    name: 1
  }
};
const failUpdate5 = {
  $unset: {
    // @ts-expect-error - 'notAField' does not exist
    notAField: true
  }
};
const failUpdate6 = {
  $push: {
    // @ts-expect-error - 'unknownArray' does not exist
    unknownArray: "item"
  }
};
const failUpdate7 = {
  $push: {
    // @ts-expect-error - 'name' is not an array
    name: "value"
  }
};
const failUpdate8 = {
  $pull: {
    // @ts-expect-error - 'fakeArray' does not exist
    fakeArray: "item"
  }
};
const failUpdate9 = {
  $rename: {
    // @ts-expect-error - 'oldField' does not exist
    oldField: "newField"
  }
};
const failUpdate10 = {
  $currentDate: {
    // @ts-expect-error - 'timestamp' does not exist
    timestamp: true
  }
};
const failUpdate11 = {
  $currentDate: {
    // @ts-expect-error - 'name' is not a Date field
    name: true
  }
};
const failUpdate12 = {
  $mul: {
    // @ts-expect-error - 'multiplier' does not exist
    multiplier: 2
  }
};
const failUpdate13 = {
  $mul: {
    // @ts-expect-error - 'isActive' is boolean, not number
    isActive: 2
  }
};
const failUpdate14 = {
  $min: {
    // @ts-expect-error - 'minimum' does not exist
    minimum: 10
  }
};
const failUpdate15 = {
  $max: {
    // @ts-expect-error - 'maximum' does not exist
    maximum: 100
  }
};
const failUpdate16 = {
  $addToSet: {
    // @ts-expect-error - 'collection' does not exist
    collection: "item"
  }
};
const failUpdate17 = {
  $pop: {
    // @ts-expect-error - 'age' is not an array
    age: 1
  }
};
const failUpdate18 = {
  $pullAll: {
    // @ts-expect-error - 'list' does not exist
    list: ["item1", "item2"]
  }
};
const failUpdate19 = {
  $bit: {
    // @ts-expect-error - 'bitField' does not exist
    bitField: { and: 5 }
  }
};
const failUpdate20 = {
  $bit: {
    // @ts-expect-error - 'name' is not a number
    name: { or: 3 }
  }
};
const validUpdate1 = {
  $set: {
    name: "Jane",
    age: 25,
    "profile.email": "jane@example.com",
    "profile.address.street": "123 Main St"
  }
};
const validUpdate2 = {
  $inc: {
    age: 1,
    "profile.address.zip": 100
  }
};
const validUpdate3 = {
  $push: {
    tags: "new-tag",
    scores: 95
  },
  $pull: {
    tags: "old-tag"
  }
};
const validUpdate4 = {
  $unset: {
    description: true,
    deletedAt: ""
  }
};
const validUpdate5 = {
  $currentDate: {
    createdAt: true,
    deletedAt: { $type: "date" }
  }
};
const validUpdate6 = {
  $min: {
    age: 0
  },
  $max: {
    age: 120
  }
};
const validUpdate7 = {
  $mul: {
    age: 1.5,
    "profile.address.zip": 2
  }
};
const validUpdate8 = {
  $rename: {
    name: "fullName",
    "profile.email": "contact"
  }
};
const validUpdate9 = {
  $addToSet: {
    tags: "unique-tag",
    scores: { $each: [100, 95, 90] }
  }
};
const validUpdate10 = {
  $pop: {
    tags: 1,
    scores: -1
  }
};
const validUpdate11 = {
  $pullAll: {
    tags: ["tag1", "tag2"],
    scores: [0, 50]
  }
};
const validUpdate12 = {
  $bit: {
    age: { and: 5 },
    "profile.address.zip": { or: 100 }
  }
};
const validUpdate13 = {
  $set: {
    name: "Updated Name",
    "profile.email": "new@example.com"
  },
  $inc: {
    age: 1
  },
  $push: {
    tags: "new"
  },
  $unset: {
    description: true
  },
  $currentDate: {
    createdAt: true
  }
};
const validUpdate14 = {
  $setOnInsert: {
    // id: 'new-id',
    name: "Default Name",
    age: 0,
    "profile.email": "default@example.com"
  }
};
const failUpdate21 = {
  $push: {
    // @ts-expect-error - scores is number[], cannot push string
    scores: "oops"
  }
};
const failUpdate22 = {
  $addToSet: {
    // @ts-expect-error - scores is number[], $each expects number[]
    scores: { $each: ["100"] }
  }
};
const failUpdate23 = {
  $currentDate: {
    // @ts-expect-error - only 'date' | 'timestamp' are allowed
    createdAt: { $type: "now" }
  }
};
const failUpdate24 = {
  $unset: {
    // @ts-expect-error - invalid unset spec
    name: 2
  }
};
const failUpdate25 = {
  $pop: {
    // @ts-expect-error - only 1 or -1 are allowed
    tags: 0
  }
};
const validUpdate15 = {
  $push: {
    tags: { $each: ["x", "y"] }
  }
};
const validUpdate16 = {
  $addToSet: {
    items: { id: "sku-1", quantity: 2 }
  }
};
const validUpdate17 = {
  $addToSet: {
    items: {
      $each: [
        { id: "sku-2", quantity: 1 },
        { id: "sku-3", quantity: 5 }
      ]
    }
  }
};
const validUpdate18 = {
  $pull: {
    tags: { $in: ["legacy", "old"] },
    scores: { $gt: 100 }
  }
};
const validUpdate19 = {
  $min: { createdAt: /* @__PURE__ */ new Date(0) },
  $max: { createdAt: /* @__PURE__ */ new Date() }
};
const validUpdate20 = {
  $rename: {
    "profile.address.street": "streetLine1"
  }
};
const strictUpdateForCast = {
  $set: { name: "Cast OK" },
  $inc: { age: 1 }
};
const mongoUpdateCast = strictUpdateForCast;
const strictUpdateForUpdateMany = {
  $set: { name: "Overload OK" },
  $inc: { age: 2 }
};
void colX.updateMany({ id: "abc" }, strictUpdateForUpdateMany, {});
function update_test_1(filter, update_filter) {
  colX.updateMany(filter, update_filter, {});
}
const okStrictUpdateConcrete = {
  $set: { name: "Overload OK" },
  $inc: { age: 2 }
};
function genericSaveRepro(filter, op) {
  const bulkOp = {
    updateOne: {
      filter,
      update: op,
      // <- This is where TS2322 shows up pre-fix
      upsert: true
    }
  };
  acceptsBulk(bulkOp);
  const _direct = bulkOp;
  const colGeneric = null;
  colGeneric.findOneAndUpdate(filter, op);
}
{
  const okCD = {
    $currentDate: { "createdAt": true }
  };
  const badCD = {
    // @ts-expect-error – should be rejected: $currentDate on non-date field
    $currentDate: { "name": true }
  };
}
const ok_query = {
  $set: {
    max: 0,
    interval: 0
  },
  $setOnInsert: {
    usage: 0,
    start: 0
  }
};
