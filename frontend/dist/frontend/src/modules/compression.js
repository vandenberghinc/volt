/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
import * as pako from "pako";
/**
 * Compression module.
 * @nav Compression
 */
export var Compression;
(function (Compression) {
    // ---------------------------------------------------------
    // Types.
    // ---------------------------------------------------------
    // 
    /** Encode a UTF-8 string to bytes. */
    function encode_utf8(str) {
        return new TextEncoder().encode(str);
    }
    Compression.encode_utf8 = encode_utf8;
    /** Decode UTF-8 bytes to string. */
    function decode_utf8(bytes) {
        return new TextDecoder().decode(to_uint8(bytes));
    }
    Compression.decode_utf8 = decode_utf8;
    /** Encode raw bytes to Base64 (URL-safe optional). */
    function to_base64(bytes, opts) {
        const b = to_uint8(bytes);
        const s = (typeof window !== "undefined" && "btoa" in window)
            ? btoa(String.fromCharCode(...b))
            : Buffer.from(b).toString("base64");
        if (opts?.url_safe) {
            return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        }
        return s;
    }
    Compression.to_base64 = to_base64;
    /** Decode Base64 to bytes (supports URL-safe). */
    function from_base64(b64) {
        const norm = b64.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((b64.length + 3) % 4);
        if (typeof window !== "undefined" && "atob" in window) {
            const bin = atob(norm);
            const out = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++)
                out[i] = bin.charCodeAt(i);
            return out;
        }
        return new Uint8Array(Buffer.from(norm, "base64"));
    }
    Compression.from_base64 = from_base64;
    /** Internal: normalize various byte-like inputs to Uint8Array. */
    function to_uint8(x) {
        if (x instanceof Uint8Array)
            return x;
        if (x instanceof ArrayBuffer)
            return new Uint8Array(x);
        if (x instanceof DataView)
            return new Uint8Array(x.buffer, x.byteOffset, x.byteLength);
        // Covers Buffer and generic ArrayLike<number> without copying if already Uint8Array/Buffer.
        return new Uint8Array(x);
    }
    Compression.to_uint8 = to_uint8;
    // ---------------------------------------------------------
    // Compression.
    /** Compress bytes using gzip (no implicit stringify). */
    function compress(data, options = { level: 9 }) {
        const input = typeof data === "string" ? encode_utf8(data) : to_uint8(data);
        return pako.gzip(input, options);
    }
    Compression.compress = compress;
    /** Compress a JSON object or array. */
    async function compress_json(blob, options = { level: 9 }) {
        return compress(encode_utf8(JSON.stringify(blob)), options);
    }
    Compression.compress_json = compress_json;
    /** Compress a Blob/File using FileReader (browser-safe). */
    async function compress_blob(blob, options = { level: 9 }) {
        const ab = await new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onerror = () => reject(r.error);
            r.onload = () => resolve(r.result);
            r.readAsArrayBuffer(blob);
        });
        return pako.gzip(new Uint8Array(ab), options);
    }
    Compression.compress_blob = compress_blob;
    /** Decompress gzip to raw bytes (use decode_utf8 / json_from_bytes explicitly if needed). */
    function decompress(data) {
        return pako.ungzip(to_uint8(data));
    }
    Compression.decompress = decompress;
    /** Decompress gzip and return a UTF-8 string. */
    function decompress_to_string(data) {
        return decode_utf8(decompress(data));
    }
    Compression.decompress_to_string = decompress_to_string;
    /** Decompress gzip and return parsed JSON. */
    function decompress_to_json(data) {
        return JSON.parse(decode_utf8(decompress(data)));
    }
    Compression.decompress_to_json = decompress_to_json;
})(Compression || (Compression = {}));
