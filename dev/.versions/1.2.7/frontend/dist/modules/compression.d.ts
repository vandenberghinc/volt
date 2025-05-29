export declare const Compression: {
    compress(data: string | object, options?: {
        level?: number;
    }): Uint8Array;
    decompress(data: Uint8Array, type?: string): string | any[] | object;
};
