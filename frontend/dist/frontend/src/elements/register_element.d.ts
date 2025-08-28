/** Separate file for register_element() method to prevent recursive imports from base.ts and module.ts */
export declare const registered_names: Set<string>;
export declare function register_element(constructor: any): void;
