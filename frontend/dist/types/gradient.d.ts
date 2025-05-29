export declare class GradientType {
    gradient?: string;
    type?: string;
    degree?: string;
    colors?: {
        color: string;
        stop?: string;
    }[];
    constructor(gradient: string);
    constructor(type: string, ...colors: string[]);
    toString(): string;
}
