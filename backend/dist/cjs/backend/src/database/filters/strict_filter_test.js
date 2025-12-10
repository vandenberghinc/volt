var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var mongodb = __toESM(require("mongodb"));
const ok_id = {
  _id: new mongodb.ObjectId("507f191e810c19729de860ea")
};
const ok_eq = {
  name: "Ada"
};
const ok_eq_regex_on_string = {
  name: /A.*/i
};
const ok_numeric_ops = {
  age: {
    $gte: 18,
    $lt: 65,
    $mod: [10, 0]
  }
};
const ok_string_ops = {
  name: {
    $regex: "Ada",
    $options: "i"
  }
};
const ok_date_ops = {
  createdAt: { $gt: /* @__PURE__ */ new Date("2020-01-01") }
};
const ok_exists_and_type = {
  active: { $exists: true },
  createdAt: { $type: ["date", 9] }
  // array of BSON types
};
const ok_array_ops_scalars = {
  tags: {
    $all: ["pro", "admin"],
    $in: ["alpha", "beta"],
    $nin: ["zzz"],
    $size: 2,
    $elemMatch: { $eq: "pro" }
  }
};
const ok_array_ops_numbers = {
  scores: {
    $elemMatch: { $gt: 90 }
  }
};
const ok_bitwise = {
  age: { $bitsAnySet: 10 }
};
const ok_dot_path_string = {
  "address.street": { $regex: /Main/i }
};
const ok_dot_path_optional_number = {
  "address.zip": { $type: "int" }
};
const ok_subdoc_equality = {
  address: { street: "Main", zip: 12345 }
};
const ok_field_not_numeric = {
  age: { $not: { $lt: 18 } }
};
const ok_field_not_regex_string = {
  name: { $not: /tmp/i }
};
const ok_const_status = {
  status: { $in: ["active", "inactive", "pending"] }
};
const ok_geo_near = {
  location: {
    $near: { type: "Point", coordinates: [10, 20], $maxDistance: 1e3 }
  }
};
const ok_geo_within = {
  location: {
    $geoWithin: {
      $centerSphere: [[10, 20], 1]
    }
  }
};
const ok_geo_intersects = {
  location: {
    $geoIntersects: {
      $geometry: { type: "Point", coordinates: [11, 21] }
    }
  }
};
const ok_and_or_nor = {
  $and: [
    { active: { $exists: true } },
    { $or: [{ age: { $gte: 21 } }, { "address.street": "Baker St" }] },
    { $nor: [{ tags: { $size: 0 } }] }
  ]
};
const ok_expr_math_compare = {
  $expr: {
    $and: [
      { $gte: ["$age", 18] },
      { $lt: ["$age", { $add: [60, -1] }] }
    ]
  }
};
const ok_expr_string_array_helpers = {
  $expr: {
    $or: [
      // { $eq: [{ $toString: '$age' }, '42'] },
      { $in: ["admin", "$tags"] },
      { $size: "$tags" }
    ]
  }
};
const bad_expr_string_array_helpers = {
  // @ts-expect-error
  $expr: {
    $or: [
      { $in: ["admin", "$tagsUNKNOWN"] },
      { $size: "$tags" }
    ]
  }
};
const ok_text = {
  $text: { $search: "engineer", $language: "en", $caseSensitive: false, $diacriticSensitive: true }
};
const ok_where_string = {
  $where: "this.age > 20"
};
const ok_where_function = {
  $where: function() {
    return this.age >= 18 && this.name.length > 0;
  }
};
const ok_json_schema_comment = {
  $jsonSchema: { bsonType: "object", required: ["name"] },
  $comment: "unit-test"
};
const ok_elemMatch_subdoc = {
  notes: {
    $elemMatch: {
      title: { $regex: "^T" },
      // Keep `as any` here – we aren't building a full, deep StrictFilter<Note> shape
      // and equality to subdocs is allowed; using any avoids creating another type.
      meta: {
        rank: { $gte: 1 },
        tags: { $in: ["x"] }
      }
    }
  }
};
const bad_id = {
  // @ts-expect-error - must be ObjectId
  _id: []
};
const bad_id_1 = {
  // @ts-expect-error - must be ObjectId
  _id: false
};
const bad_unknown_top = {
  // @ts-expect-error - 'nmae' is not a declared key on User
  nmae: "typo"
};
const bad_unknown_dot = {
  // @ts-expect-error - 'adress.stret' doesn't exist
  "adress.stret": "nope"
};
const bad_too_deep = {
  // @ts-expect-error - 'address.zip.code' is not a valid path
  "address.zip.code": 5
};
const bad_string_size = {
  name: {
    // @ts-expect-error
    $size: 3
  }
};
const bad_regex_on_number = {
  // @ts-expect-error
  age: /x/
};
const bad_number_regex = {
  age: {
    // @ts-expect-error
    $regex: /x/
  }
};
const bad_mod_arity = {
  age: {
    // @ts-expect-error
    $mod: [2]
  }
};
const bad_type_name = {
  age: {
    // @ts-expect-error
    $type: "nonsense"
  }
};
const bad_in_scalar_type = {
  age: {
    // @ts-expect-error
    $in: ["x"]
  }
};
const bad_in_array_elem_type = {
  // @ts-expect-error
  tags: {
    $in: [1, 2]
  }
};
const bad_all_type = {
  // @ts-expect-error
  tags: {
    $all: [1, 2, 3]
  }
};
const bad_elemMatch_type = {
  scores: {
    $elemMatch: {
      // @ts-expect-error
      $regex: /x/
    }
  }
};
const bad_near_shape = {
  location: {
    // @ts-expect-error
    $near: [0, 0]
  }
};
const bad_geo_intersects_shape = {
  location: {
    $geoIntersects: {
      // @ts-expect-error
      foo: 1
    }
  }
};
const bad_not_regex_on_number = {
  age: {
    // @ts-expect-error
    $not: /x/
  }
};
const bad_subdoc_extra_key = {
  address: {
    street: "Main",
    zip: 1,
    // @ts-expect-error
    oops: true
  }
};
const bad_unknown_top_op = {
  // @ts-expect-error
  $foo: 1
};
const bad_text_extra = {
  $text: {
    $search: "q",
    // @ts-expect-error
    unknown: true
  }
};
const bad_comment_type = {
  // @ts-expect-error
  $comment: 42
};
const bad_where_type = {
  // @ts-expect-error
  $where: 7
};
const bad_expr_field_ref = {
  // @ts-expect-error
  $expr: {
    $eq: ["$ages", 12]
  }
};
const bad_expr_add_scalar = {
  // @ts-expect-error
  $expr: {
    $add: 1
  }
};
const bad_and_unknown_inside = {
  $and: [
    {
      // @ts-expect-error
      nmae: "typo"
      // should be name
    }
  ]
};
const bad_or_wrong_elem_type = {
  $or: [
    // @ts-expect-error
    42
  ]
};
const bad_elemMatch_unknown_nested = {
  notes: {
    $elemMatch: {
      // @ts-expect-error
      titla: { $regex: "^T" }
      // typo
    }
  }
};
const typo_in_and = {
  "address.street": { $regex: "Main", $options: "i" },
  age: { $gte: 18, $lte: 99 },
  // @ts-expect-error
  $expr: {
    $and: [
      { $gte: ["$ageXXX", 18] },
      { $lt: ["$ageXXX", 100] }
    ]
  }
};
const bad_const_status = {
  // @ts-expect-error
  status: { $in: ["UNKNOWN"] }
};
const strictOk = {
  "address.street": { $regex: "Main", $options: "i" },
  age: { $gte: 18, $lte: 99 },
  $expr: { $and: [{ $gte: ["$age", 18] }, { $lt: ["$age", 100] }] }
};
const mongoFilterAccepts = strictOk;
async function _useInFindOne() {
  const r = await usersCol.findOne(strictOk);
  void r;
}
class SomeClassGeneric {
  col;
  cast(query) {
    const q = query;
    void q;
  }
  async find(query) {
    return await this.col.findOne(query) ?? void 0;
  }
}
const repo1 = new SomeClassGeneric();
repo1.cast(strictOk);
function acceptsStrict(q) {
  const f = q;
  void f;
}
acceptsStrict({ $and: [{ age: { $gte: 1 } }] });
class FancyRepo {
  col;
  whereRecent(q) {
    const f = q;
    void f;
  }
  async findOneStrict(q) {
    return await this.col.findOne(q) ?? void 0;
  }
}
const fancy = new FancyRepo();
fancy.whereRecent({ createdAt: { $gt: /* @__PURE__ */ new Date(0) } });
function complexWhere(conds) {
  const merged = {
    $and: conds
  };
  const f = merged;
  void f;
}
complexWhere([{ name: "Ada" }, { age: { $gt: 20 } }]);
const ok_mix = {
  name: { $eq: "Ada" },
  age: 36
};
const ok_dot_eq = {
  "address.street": "Baker St"
};
const ok_array_equality = {
  tags: ["x", "y"]
};
const bad_options_without_regex = {
  // @ts-expect-error
  name: {
    $options: "i"
  }
};
const bad_nearSphere_shape = {
  location: {
    $nearSphere: {
      // @ts-expect-error
      foo: "bar"
    }
  }
};
const ok_jsonSchema_any = {
  $jsonSchema: 123
};
void ok_jsonSchema_any;
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
