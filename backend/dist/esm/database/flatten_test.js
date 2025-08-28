// Valid assignments
const validSimple1 = {
    x: true,
    "y.z": 42
};
const validSimple2 = {
    x: false,
    "y.z": -100
};
// Invalid assignments - should produce TypeScript errors
// @ts-expect-error - missing required field "y.z"
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
// Valid assignments
const validDeep1 = {
    "level1.level2.level3.level4.value": "test",
    "level1.level2.level3.level4.count": 10,
    "level1.level2.level3.flag": true,
    "level1.sibling": "hello",
    top: 5
};
// Invalid assignments
// @ts-expect-error - missing required fields
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
// Valid assignments
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
    "metadata.created": new Date(),
    "metadata.updated": new Date()
};
// Invalid assignments
const invalidMixed1 = {
    name: "Test",
    age: 20,
    // @ts-expect-error - tags should be string[], not number[]
    tags: [1, 2, 3],
    "profile.email": "test@example.com",
    "profile.settings.theme": "dark",
    "profile.settings.notifications": false,
};
const invalidMixed1_1 = {
    name: "Test",
    age: 20,
    "profile.email": "test@example.com",
    "profile.settings.theme": "dark",
    "profile.settings.notifications": false,
    // @ts-expect-error - "profile.UNKNOWN_nested_tags" does not exist
    "profile.UNKNOWN_nested_tags": ["user", "admin"],
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
// Valid complex assignment
const validUser = {
    id: "user123",
    "personal.firstName": "John",
    "personal.lastName": "Doe",
    "personal.dateOfBirth": new Date("1990-01-01"),
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
    "stats.lastLogin": new Date(),
    "stats.accountAge": 365
};
// Invalid complex assignments
const invalidUser1 = {
    id: "user123",
    "personal.firstName": "John",
    "personal.lastName": "Doe",
    "personal.dateOfBirth": new Date("1990-01-01"),
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
    "stats.lastLogin": new Date(),
    "stats.accountAge": 365
};
const invalidUser2 = {
    id: "user123",
    "personal.firstName": "John",
    "personal.lastName": "Doe",
    "personal.dateOfBirth": new Date("1990-01-01"),
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
    "stats.lastLogin": new Date(),
    "stats.accountAge": 365
};
const validVeryDeep = {
    "l1.l2.l3.l4.l5.l6.l7.l8.l9.l10.l11.l12.l13.l14.l15.l16.l17.l18.l19.l20.l21.l22.l23.l24.l25.value": "deep!"
};
// Both should be valid
const validOptional1 = {
    required: "yes"
};
const validOptional2 = {
    required: "yes",
    "optional.nested.value": 42
};
// Invalid optional usage
// @ts-expect-error - "required" is missing
const invalidOptional = {
    "optional.nested.value": 42
};
export {};
