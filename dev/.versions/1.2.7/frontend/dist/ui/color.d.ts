type Hex = string;
type RGBArray = number[];
interface RGBObject {
    r: number;
    g: number;
    b: number;
    a: number;
}
export declare class ColorRangeClass {
    start: RGBObject;
    end: RGBObject;
    constructor(start: Hex | RGBArray, end: Hex | RGBArray);
    array_to_rgba(array: RGBArray): RGBObject;
    interpolate(percent?: number, alpha?: number): Hex;
}
export declare const ColorRange: (...args: any[]) => any;
export {};
