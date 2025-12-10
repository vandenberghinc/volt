/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
export declare class Stylesheet {
    _element: HTMLStyleElement;
    /** @warning This function may cause security issues if the data is unsafe provided by the user, since this assigns to innerHTML. */
    constructor(data: string, auto_append?: boolean);
    /** @warning This function may cause security issues if the data is unsafe provided by the user, since this assigns to innerHTML. */
    data(): string;
    data(val: string): this;
    attach(): this;
    join(): this;
    remove(): this;
    append_to(parent: any): this;
}
