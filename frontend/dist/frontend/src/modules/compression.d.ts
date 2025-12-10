/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
import type { DeflateOptions } from "pako";
/**
 * Compression module.
 * @nav Compression
 */
export declare namespace Compression {
    /** Bytes-like inputs accepted by this wrapper (string must be pre-encoded if you want raw bytes). */
    type BytesLike = Uint8Array | ArrayBuffer | DataView | ArrayLike<number> | Buffer;
    /** GZip options passed through to pako.gzip. */
    type GzipOptions = DeflateOptions;
    /** Encode a UTF-8 string to bytes. */
    function encode_utf8(str: string): Uint8Array;
    /** Decode UTF-8 bytes to string. */
    function decode_utf8(bytes: BytesLike): string;
    /** Encode raw bytes to Base64 (URL-safe optional). */
    function to_base64(bytes: BytesLike, opts?: {
        url_safe?: boolean;
    }): string;
    /** Decode Base64 to bytes (supports URL-safe). */
    function from_base64(b64: string): Uint8Array;
    /** Internal: normalize various byte-like inputs to Uint8Array. */
    function to_uint8(x: BytesLike): Uint8Array;
    /** Compress bytes using gzip (no implicit stringify). */
    function compress(data: BytesLike | string, options?: GzipOptions): Uint8Array;
    /** Compress a JSON object or array. */
    function compress_json(blob: Record<string, any> | any[], options?: GzipOptions): Promise<Uint8Array>;
    /** Compress a Blob/File using FileReader (browser-safe). */
    function compress_blob(blob: Blob | File, options?: GzipOptions): Promise<Uint8Array>;
    /** Decompress gzip to raw bytes (use decode_utf8 / json_from_bytes explicitly if needed). */
    function decompress(data: BytesLike): Uint8Array;
    /** Decompress gzip and return a UTF-8 string. */
    function decompress_to_string(data: BytesLike): string;
    /** Decompress gzip and return parsed JSON. */
    function decompress_to_json<T = unknown>(data: BytesLike): T;
}
