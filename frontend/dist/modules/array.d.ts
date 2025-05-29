/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved.
 *
 * @note FRONTEND - This file should also be accessable from the frontend.
 */
/**
 * Refactored array utilities: namespace-based implementations.
 */
declare namespace ArrayUtils {
    /**
     * Appends items to the array.
     */
    function append<T>(arr: T[], ...items: T[]): number;
    /**
     * Executes a handler for each element in the array.
     */
    function walk<T>(arr: T[], handler: (item: T, index: number, array: T[]) => void): void;
    /**
     * Gets the first element of the array.
     */
    function first<T>(arr: T[]): T | undefined;
    /**
     * Gets the last element of the array.
     */
    function last<T>(arr: T[]): T | undefined;
    /**
     * Iteration function for arrays.
     */
    function iterate<T, R>(arr: T[], start: any, end?: any, handler?: (item: T) => R): R | null;
    /**
     * Asynchronous iteration function for arrays.
     */
    /**
     * Async-await iteration function for arrays.
     */
    /**
     * Iteration function that collects handler results.
     */
    /**
     * Iterate an array reversed.
     */
    function iterate_reversed<T, R>(arr: T[], start: any, end?: any, handler?: (item: T) => R): R | null;
    /**
     * Asynchronous reversed iteration.
     */
    /**
     * Async-await reversed iteration.
     */
    /**
     * Drop an item by value.
     */
    function drop<T>(arr: T[], item: T): T[];
    /**
     * Drop an item by index.
     */
    function drop_index<T>(arr: T[], index: number): T[];
    /**
     * Drop duplicate items from an array.
     */
    function drop_duplicates<T>(arr: T[]): T[];
    /**
     * Limit from end, always creates a new array.
     */
    function limit_from_end<T>(arr: T[], limit: number): T[];
    /**
     * Remove all items equal to the given item.
     */
    function remove<T>(arr: T[], item: T): T[];
    /**
     * Check if two arrays or nested structures are equal.
     */
    function eq(x: any[], y: any[]): boolean;
    /**
     * Divide into nested arrays.
     */
    function divide<T>(arr: T[], x: number): T[][];
}
export { ArrayUtils as Array };
/** Extend global array with some basic methods. */
declare global {
    interface Array<T> {
        append(...items: T[]): number;
        walk: Array<T>["forEach"];
        first(): T | undefined;
        last(): T | undefined;
        /** @deprecated Use `vlib.Array.iterate()` instead. */
        iterate(handler: (item: T, index: number, array: T[]) => any): any;
        /** @deprecated Use `vlib.Array.iterate()` instead. */
        iterate(start: number, handler: (item: T, index: number, array: T[]) => any): any;
        /** @deprecated Use `vlib.Array.iterate()` instead. */
        iterate(start: number, end: number, handler: (item: T, index: number, array: T[]) => any): any;
    }
}
