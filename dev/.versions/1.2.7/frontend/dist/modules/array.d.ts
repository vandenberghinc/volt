declare global {
    interface Array<T> {
        append(...items: T[]): number;
        first(): T | undefined;
        last(): T | undefined;
        iterate(handler: (item: T, index: number, array: T[]) => any): any;
        iterate(start: number, handler: (item: T, index: number, array: T[]) => any): any;
        iterate(start: number, end: number, handler: (item: T, index: number, array: T[]) => any): any;
        iterate_async(handler: (item: T, index: number, array: T[]) => Promise<any>): Promise<any[]>;
        iterate_async(start: number, handler: (item: T, index: number, array: T[]) => Promise<any>): Promise<any[]>;
        iterate_async(start: number, end: number, handler: (item: T, index: number, array: T[]) => Promise<any>): Promise<any[]>;
        iterate_async_await(handler: (item: T, index: number, array: T[]) => Promise<any>): Promise<any>;
        iterate_async_await(start: number, handler: (item: T, index: number, array: T[]) => Promise<any>): Promise<any>;
        iterate_async_await(start: number, end: number, handler: (item: T, index: number, array: T[]) => Promise<any>): Promise<any>;
        iterate_append(handler: (item: T, index: number, array: T[]) => any): any[];
        iterate_append(start: number, handler: (item: T, index: number, array: T[]) => any): any[];
        iterate_append(start: number, end: number, handler: (item: T, index: number, array: T[]) => any): any[];
        iterate_reversed(handler: (item: T, index: number, array: T[]) => any): any;
        iterate_reversed(start: number, handler: (item: T, index: number, array: T[]) => any): any;
        iterate_reversed(start: number, end: number, handler: (item: T, index: number, array: T[]) => any): any;
        iterate_reversed_async(handler: (item: T, index: number, array: T[]) => Promise<any>): Promise<any[]>;
        iterate_reversed_async(start: number, handler: (item: T, index: number, array: T[]) => Promise<any>): Promise<any[]>;
        iterate_reversed_async(start: number, end: number, handler: (item: T, index: number, array: T[]) => Promise<any>): Promise<any[]>;
        iterate_reversed_async_await(handler: (item: T, index: number, array: T[]) => Promise<any>): Promise<any>;
        iterate_reversed_async_await(start: number, handler: (item: T, index: number, array: T[]) => Promise<any>): Promise<any>;
        iterate_reversed_async_await(start: number, end: number, handler: (item: T, index: number, array: T[]) => Promise<any>): Promise<any>;
        drop(item: T): T[];
        drop_index(index: number): T[];
        drop_duplicates(): T[];
        limit_from_end(limit: number): T[];
        remove(item: T): T[];
        eq(otherArray: any[]): boolean;
        eq(x: any, y: any): boolean;
        divide(x: number): T[][];
    }
}
export {};
