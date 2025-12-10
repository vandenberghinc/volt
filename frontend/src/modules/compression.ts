/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */

import * as pako from "pako";
import type { DeflateOptions } from "pako";

/**
 * Compression module.
 * @nav Compression
 */
export namespace Compression {

    // ---------------------------------------------------------
    // Types.

    /** Bytes-like inputs accepted by this wrapper (string must be pre-encoded if you want raw bytes). */
    export type BytesLike = Uint8Array | ArrayBuffer | DataView | ArrayLike<number> | Buffer;

    /** GZip options passed through to pako.gzip. */
    export type GzipOptions = DeflateOptions;

    // ---------------------------------------------------------
    // 

    /** Encode a UTF-8 string to bytes. */
    export function encode_utf8(str: string): Uint8Array {
        return new TextEncoder().encode(str);
    }

    /** Decode UTF-8 bytes to string. */
    export function decode_utf8(bytes: BytesLike): string {
        return new TextDecoder().decode(to_uint8(bytes));
    }

    /** Encode raw bytes to Base64 (URL-safe optional). */
    export function to_base64(bytes: BytesLike, opts?: { url_safe?: boolean }): string {
        const b = to_uint8(bytes);
        const s = (typeof window !== "undefined" && "btoa" in window)
            ? btoa(String.fromCharCode(...b))
            : Buffer.from(b).toString("base64");
        if (opts?.url_safe) {
            return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
        }
        return s;
    }

    /** Decode Base64 to bytes (supports URL-safe). */
    export function from_base64(b64: string): Uint8Array {
        const norm = b64.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((b64.length + 3) % 4);
        if (typeof window !== "undefined" && "atob" in window) {
            const bin = atob(norm);
            const out = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
            return out;
        }
        return new Uint8Array(Buffer.from(norm, "base64"));
    }

    /** Internal: normalize various byte-like inputs to Uint8Array. */
    export function to_uint8(x: BytesLike): Uint8Array {
        if (x instanceof Uint8Array) return x;
        if (x instanceof ArrayBuffer) return new Uint8Array(x);
        if (x instanceof DataView) return new Uint8Array(x.buffer, x.byteOffset, x.byteLength);
        // Covers Buffer and generic ArrayLike<number> without copying if already Uint8Array/Buffer.
        return new Uint8Array(x as ArrayLike<number>);
    }

    // ---------------------------------------------------------
    // Compression.

    /** Compress bytes using gzip (no implicit stringify). */
    export function compress(
        data: BytesLike | string,
        options: GzipOptions = { level: 9 }
    ): Uint8Array {
        const input = typeof data === "string" ? encode_utf8(data) : to_uint8(data);
        return pako.gzip(input, options);
    }

    /** Compress a JSON object or array. */
    export async function compress_json(
        blob: Record<string, any> | any[],
        options: GzipOptions = { level: 9 }
    ): Promise<Uint8Array> {
        return compress(encode_utf8(JSON.stringify(blob)), options);
    }

    /** Compress a Blob/File using FileReader (browser-safe). */
    export async function compress_blob(
        blob: Blob | File,
        options: GzipOptions = { level: 9 }
    ): Promise<Uint8Array> {
        const ab = await new Promise<ArrayBuffer>((resolve, reject) => {
            const r = new FileReader();
            r.onerror = () => reject(r.error);
            r.onload = () => resolve(r.result as ArrayBuffer);
            r.readAsArrayBuffer(blob);
        });
        return pako.gzip(new Uint8Array(ab), options);
    }

    /** Decompress gzip to raw bytes (use decode_utf8 / json_from_bytes explicitly if needed). */
    export function decompress(data: BytesLike): Uint8Array {
        return pako.ungzip(to_uint8(data));
    }

    /** Decompress gzip and return a UTF-8 string. */
    export function decompress_to_string(data: BytesLike): string {
        return decode_utf8(decompress(data));
    }

    /** Decompress gzip and return parsed JSON. */
    export function decompress_to_json<T = unknown>(data: BytesLike): T {
        return JSON.parse(decode_utf8(decompress(data))) as T;
    }
}
