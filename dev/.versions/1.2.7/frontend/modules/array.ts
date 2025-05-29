/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

declare global {
    interface Array<T> {

        // Append alias for push.
        append(...items: T[]): number;

        // Get the first item.
        first(): T | undefined;

        // Get the last item.
        last(): T | undefined;

        // Iteration functions
        iterate(handler: (item: T, index: number, array: T[]) => any): any;
        iterate(start: number, handler: (item: T, index: number, array: T[]) => any): any;
        iterate(start: number, end: number, handler: (item: T, index: number, array: T[]) => any): any;

        // Asynchronous iteration functions
        iterate_async(handler: (item: T, index: number, array: T[]) => Promise<any>): Promise<any[]>;
        iterate_async(start: number, handler: (item: T, index: number, array: T[]) => Promise<any>): Promise<any[]>;
        iterate_async(start: number, end: number, handler: (item: T, index: number, array: T[]) => Promise<any>): Promise<any[]>;

        iterate_async_await(handler: (item: T, index: number, array: T[]) => Promise<any>): Promise<any>;
        iterate_async_await(start: number, handler: (item: T, index: number, array: T[]) => Promise<any>): Promise<any>;
        iterate_async_await(start: number, end: number, handler: (item: T, index: number, array: T[]) => Promise<any>): Promise<any>;

        // Iteration function to build an array by appending returned values
        iterate_append(handler: (item: T, index: number, array: T[]) => any): any[];
        iterate_append(start: number, handler: (item: T, index: number, array: T[]) => any): any[];
        iterate_append(start: number, end: number, handler: (item: T, index: number, array: T[]) => any): any[];

        // Reversed iteration functions
        iterate_reversed(handler: (item: T, index: number, array: T[]) => any): any;
        iterate_reversed(start: number, handler: (item: T, index: number, array: T[]) => any): any;
        iterate_reversed(start: number, end: number, handler: (item: T, index: number, array: T[]) => any): any;

        iterate_reversed_async(handler: (item: T, index: number, array: T[]) => Promise<any>): Promise<any[]>;
        iterate_reversed_async(start: number, handler: (item: T, index: number, array: T[]) => Promise<any>): Promise<any[]>;
        iterate_reversed_async(start: number, end: number, handler: (item: T, index: number, array: T[]) => Promise<any>): Promise<any[]>;

        iterate_reversed_async_await(handler: (item: T, index: number, array: T[]) => Promise<any>): Promise<any>;
        iterate_reversed_async_await(start: number, handler: (item: T, index: number, array: T[]) => Promise<any>): Promise<any>;
        iterate_reversed_async_await(start: number, end: number, handler: (item: T, index: number, array: T[]) => Promise<any>): Promise<any>;

        // Drop methods
        drop(item: T): T[];

        drop_index(index: number): T[];

        // Remove duplicates
        drop_duplicates(): T[];

        // Limit from end
        limit_from_end(limit: number): T[];

        // Remove items equal to the specified item
        remove(item: T): T[];

        // Equality check
        eq(otherArray: any[]): boolean;
        eq(x: any, y: any): boolean;

        // Divide into nested arrays
        divide(x: number): T[][];
    }
}
export {}; // is required.

// Append alias for push.
Array.prototype.append = Array.prototype.push; 

// Get the first and last item.
Array.prototype.first = function() {
    return this[0];
};

// Get the first and last item.
Array.prototype.last = function() {
    return this[this.length - 1];
};

// Iteration function for arrays.
Array.prototype.iterate = function(start: any, end?: any, handler?: any): any {
    if (typeof start === "function") {
        handler = start;
        start = null;
    }
    if (start == null) {
        start = 0;
    }
    if (end == null) {
        end = this.length;
    }
    for (let i = start; i < end; i++) {    
        const res = handler(this[i]);
        if (res != null && !(res instanceof Promise)) {
            return res;
        }
    }
    return null;
};
Array.prototype.iterate_async = function(start: any, end?: any, handler?: any): any {
    if (typeof start === "function") {
        handler = start;
        start = null;
    }
    if (start == null) {
        start = 0;
    }
    if (end == null) {
        end = this.length;
    }
    let promises: Promise<any>[] = [];
    for (let i = start; i < end; i++) {    
        const res = handler(this[i]);
        if (res != null && res instanceof Promise) {
            promises.push(res);
        }
    }
    return promises;
};
Array.prototype.iterate_async_await = async function(start: any, end?: any, handler?: any): Promise<any> {
    if (typeof start === "function") {
        handler = start;
        start = null;
    }
    if (start == null) {
        start = 0;
    }
    if (end == null) {
        end = this.length;
    }
    for (let i = start; i < end; i++) {    
        const res = handler(this[i]);
        if (res != null && res instanceof Promise) {
            const pres = await res;
            if (pres != null) {
                return pres;
            }
        }
    }
    return null;
};

// Iteration function for arrays to build an array by another array, it appends all the returned callback values into an array and returns that array. Quite useful for vweb.
Array.prototype.iterate_append = function(start: any, end?: any, handler?: any): any {
    if (typeof start === "function") {
        handler = start;
        start = null;
    }
    if (start == null) {
        start = 0;
    }
    if (end == null) {
        end = this.length;
    }
    const items: any[] = [];
    for (let i = start; i < end; i++) {    
        items.append(handler(this[i]));
    }
    return items;
};

// Iterate an array reversed.
Array.prototype.iterate_reversed = function(start: any, end?: any, handler?: any): any {
    if (handler == null && start != null) {
        handler = start;
        start = null;
    }
    if (start == null) {
        start = 0;
    }
    if (end == null) {
        end = this.length;
    }
    for (let i = end - 1; i >= start; i--) {    
        const res = handler(this[i]);
        if (res != null && !(res instanceof Promise)) {
            return res;
        }
    }
    return null;
};
Array.prototype.iterate_reversed_async = function(start: any, end?: any, handler?: any): any {
    if (handler == null && start != null) {
        handler = start;
        start = null;
    }
    if (start == null) {
        start = 0;
    }
    if (end == null) {
        end = this.length;
    }
    let promises: Promise<any>[] = [];
    for (let i = end - 1; i >= start; i--) {    
        const res = handler(this[i]);
        if (res != null && res instanceof Promise) {
            promises.push(res);
        }
    }
    return promises;
};
Array.prototype.iterate_reversed_async_await = async function(start: any, end?: any, handler?: any): Promise<any> {
    if (handler == null && start != null) {
        handler = start;
        start = null;
    }
    if (start == null) {
        start = 0;
    }
    if (end == null) {
        end = this.length;
    }
    for (let i = end - 1; i >= start; i--) {    
        const res = handler(this[i]);
        if (res != null && res instanceof Promise) {
            const pres = await res;
            if (pres != null) {
                return pres;
            }
        }
    }
    return null;
};

// Drop an item by the item itself.
Array.prototype.drop = function(item) {
    // @ts-expect-error
    const dropped = new this.constructor(); // for when a class extends Array.
    for (let i = 0; i < this.length; i++) {    
        if (this[i] !== item) {
            dropped.push(this[i])
        }
    }
    return dropped;
};

// Drop an item by index.
Array.prototype.drop_index = function(index) {
    // @ts-expect-error
    const dropped = new this.constructor(); // for when a class extends Array.
    for (let i = 0; i < this.length; i++) {    
        if (i != index) {
            dropped.push(this[i])
        }
    }
    return dropped;
};

// Drop duplicate items from an array.
Array.prototype.drop_duplicates = function() {
    return this.reduce((accumulator, val) => {
        if (!accumulator.includes(val)) {
            accumulator.push(val);
        }
        return accumulator;
    }, []);
}

// Limit from end, always creates a new array.
Array.prototype.limit_from_end = function<T extends any>(limit) {
    let limited: T[] = [];
    if (this.length > limit) {
        for (let i = this.length - limit; i < this.length; i++) {
            limited.push(this[i]);
        }
    } else {
        for (let i = 0; i < this.length; i++) {
            limited.push(this[i]);
        }
    }
    return limited;
}

// Remove all items that equal the item from the array.
Array.prototype.remove = function<T extends any>(item: T) {
    let removed: T[] = [];
    this.iterate((i) => {
        if (i != item) {
            removed.push(i);
        }
    })
    return removed;
};

// Check if an array equals another array.
// When the second parameter is not passed `this` will be used as `x` and `x` will be used as `y`.
Array.prototype.eq = function(x?: any[], y?: any[]) {
    const eq = (x, y) => {

        // Arrays.
        if (Array.isArray(x)) {
            if (
                Array.isArray(y) === false ||
                x.length !== y.length
            ) {
                return false;
            }
            for (let i = 0; i < x.length; i++) {
                if (typeof x[i] === "object" || typeof y[i] === "object") {
                    const result = eq(x[i], y[i]);
                    if (result === false) {
                        return false;
                    }
                } else if (x[i] !== y[i]) {
                    return false;
                }
            }
            return true;
        }

        // Objects.
        else if (typeof x === "object") {
            if (
                typeof y !== "object" ||
                Array.isArray(y)
            ) {
                return false;
            }
            const x_keys = Object.keys(x);
            const y_keys = Object.keys(y);
            if (eq(x_keys, y_keys) === false) {
                return false;
            }
            for (let i = 0; i < x_keys.length; i++) {
                if (typeof x[x_keys[i]] === "object" || typeof y[y_keys[i]] === "object") {
                    const result = eq(x[x_keys[i]], y[y_keys[i]]);
                    if (result === false) {
                        return false;
                    }
                } else if (x[x_keys[i]] !== y[y_keys[i]]) {
                    return false;
                }
            }
            return true;
        }

        // Others.
        else if (typeof x !== typeof y) { return false; }
        return x === y;
    }
    if (y == null) {
        y = x;
        x = this;
    }
    return eq(x, y);
}

// Divide into nested arrays.
Array.prototype.divide = function(x) {
    if (typeof x !== 'number' || x <= 0) {
        throw new Error('Number of nested arrays must be a positive number');
    }
    const result: any[] = [];
    const nested_len = Math.ceil(this.length / x);
    for (let i = 0; i < this.length; i += nested_len) {
        result.push(this.slice(i, i + nested_len));
    }
    return result;
}
