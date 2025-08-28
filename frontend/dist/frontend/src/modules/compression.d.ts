export declare namespace Compression {
    /**
     * Compress data.
     * @param data The data to compress
     * @param options The pako gzip options.
     * @nav Frontend/Compression
     * @docs
     */
    function compress(data: string | object, options?: {
        level?: number;
    }): Uint8Array;
    /**
     * Decompress data.
     * @param data The data to decompress.
     * @param type The output data data. Valid types are: "string", "array", "object".
     * @nav Frontend/Compression
     * @docs
     */
    function decompress(data: Uint8Array, type?: "string" | "array" | "object"): string | any[] | object;
}
