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
const validSimple1 = {
  x: true,
  "y.z": 42
};
const validSimple2 = {
  x: false,
  "y.z": -100
};
const invalidSimple1 = {
  x: true
};
const invalidSimple2 = {
  x: true,
  // @ts-expect-error - "y.z" should be number, not string
  "y.z": "not a number"
};
const invalidSimple3 = {
  x: true,
  "y.z": 42,
  // @ts-expect-error - "unknown" field doesn't exist
  unknown: "field"
};
const validDeep1 = {
  "level1.level2.level3.level4.value": "test",
  "level1.level2.level3.level4.count": 10,
  "level1.level2.level3.flag": true,
  "level1.sibling": "hello",
  top: 5
};
const invalidDeep1 = {
  top: 5
};
const invalidDeep2 = {
  "level1.level2.level3.level4.value": "test",
  "level1.level2.level3.level4.count": 10,
  "level1.level2.level3.flag": true,
  "level1.sibling": "hello",
  top: 5,
  // @ts-expect-error - "level1.level2.unknown" doesn't exist
  "level1.level2.unknown": "nope"
};
const validMixed1 = {
  name: "John",
  age: 30,
  tags: ["user", "admin"],
  "profile.email": "john@example.com",
  "profile.nested_tags": ["user", "admin"],
  "profile.settings.theme": "dark",
  "profile.settings.notifications": true
};
const validMixed2 = {
  name: "Jane",
  age: 25,
  tags: ["x"],
  "profile.nested_tags": ["x"],
  "profile.email": "jane@example.com",
  "profile.settings.theme": "light",
  "profile.settings.notifications": false,
  "metadata.created": /* @__PURE__ */ new Date(),
  "metadata.updated": /* @__PURE__ */ new Date()
};
const invalidMixed1 = {
  name: "Test",
  age: 20,
  // @ts-expect-error - tags should be string[], not number[]
  tags: [1, 2, 3],
  "profile.email": "test@example.com",
  "profile.settings.theme": "dark",
  "profile.settings.notifications": false
};
const invalidMixed1_1 = {
  name: "Test",
  age: 20,
  "profile.email": "test@example.com",
  "profile.settings.theme": "dark",
  "profile.settings.notifications": false,
  // @ts-expect-error - "profile.UNKNOWN_nested_tags" does not exist
  "profile.UNKNOWN_nested_tags": ["user", "admin"]
};
const invalidMixed2 = {
  name: "Test",
  age: 20,
  tags: ["tag"],
  "profile.email": "test@example.com",
  // @ts-expect-error - theme must be "dark" | "light", not "blue"
  "profile.settings.theme": "blue",
  "profile.settings.notifications": false
};
const validUser = {
  id: "user123",
  "personal.firstName": "John",
  "personal.lastName": "Doe",
  "personal.dateOfBirth": /* @__PURE__ */ new Date("1990-01-01"),
  "personal.contact.email": "john@example.com",
  "personal.contact.address.street": "123 Main St",
  "personal.contact.address.city": "New York",
  "personal.contact.address.country": "USA",
  "personal.contact.address.postal.code": "10001",
  "preferences.language": "en",
  "preferences.timezone": "America/New_York",
  "preferences.privacy.shareEmail": true,
  "preferences.privacy.sharePhone": false,
  "preferences.privacy.visibility": "friends",
  "stats.loginCount": 42,
  "stats.lastLogin": /* @__PURE__ */ new Date(),
  "stats.accountAge": 365
};
const invalidUser1 = {
  id: "user123",
  "personal.firstName": "John",
  "personal.lastName": "Doe",
  "personal.dateOfBirth": /* @__PURE__ */ new Date("1990-01-01"),
  "personal.contact.email": "john@example.com",
  "personal.contact.address.street": "123 Main St",
  "personal.contact.address.city": "New York",
  "personal.contact.address.country": "USA",
  "personal.contact.address.postal.code": "10001",
  // @ts-expect-error - language must be "en" | "es" | "fr", not "de"
  "preferences.language": "de",
  "preferences.timezone": "America/New_York",
  "preferences.privacy.shareEmail": true,
  "preferences.privacy.sharePhone": false,
  "preferences.privacy.visibility": "friends",
  "stats.loginCount": 42,
  "stats.lastLogin": /* @__PURE__ */ new Date(),
  "stats.accountAge": 365
};
const invalidUser2 = {
  id: "user123",
  "personal.firstName": "John",
  "personal.lastName": "Doe",
  "personal.dateOfBirth": /* @__PURE__ */ new Date("1990-01-01"),
  "personal.contact.email": "john@example.com",
  "personal.contact.address.street": "123 Main St",
  "personal.contact.address.city": "New York",
  "personal.contact.address.country": "USA",
  "personal.contact.address.postal.code": "10001",
  "preferences.language": "en",
  "preferences.timezone": "America/New_York",
  "preferences.privacy.shareEmail": true,
  "preferences.privacy.sharePhone": false,
  // @ts-expect-error - visibility must be "public" | "private" | "friends", not "hidden"
  "preferences.privacy.visibility": "hidden",
  "stats.loginCount": 42,
  "stats.lastLogin": /* @__PURE__ */ new Date(),
  "stats.accountAge": 365
};
const validVeryDeep = {
  "l1.l2.l3.l4.l5.l6.l7.l8.l9.l10.l11.l12.l13.l14.l15.l16.l17.l18.l19.l20.l21.l22.l23.l24.l25.value": "deep!"
};
const validOptional1 = {
  required: "yes"
};
const validOptional2 = {
  required: "yes",
  "optional.nested.value": 42
};
const invalidOptional = {
  "optional.nested.value": 42
};
