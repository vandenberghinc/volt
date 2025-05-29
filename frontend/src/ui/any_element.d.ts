// 1) Declare a normal exported interface
export interface AnyElementMap {}

// 2) A union type that picks all values in AnyElementMap
export type AnyElement = AnyElementMap[keyof AnyElementMap];