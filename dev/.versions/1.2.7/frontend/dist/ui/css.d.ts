export declare class CSSElement {
    _element: HTMLElement;
    constructor(data: any, auto_append?: boolean);
    data(): string;
    data(val: string): this;
    remove(): this;
    append_to(parent: any): this;
}
export declare const CSS: (...args: any[]) => any;
