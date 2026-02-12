/**
 * @author ...
 * @copyright ...
 */
import { AnyElement } from "../ui/any_element.js";
import { Compression } from "./compression.js";
import type { Mail } from "../../../backend/src/plugins/mail/mail.js";
/** A file attachment with an internal byte buffer and compression/encoding helpers. */
export declare class Attachment {
    /** File or directory name. */
    name: string;
    /** Path relative to the dropped root. */
    path: string;
    /** MIME type of the data. */
    mime_type: string;
    /** Charset used for text decoding (if applicable). */
    charset?: string;
    /** Whether the internal buffer is gzip-compressed. */
    compressed: boolean;
    /** Optional original File/Blob source. */
    file?: File | Blob;
    /** Internal raw buffer (compressed or not depending on state). */
    private _bytes;
    /** Create an Attachment from initial metadata and/or bytes. */
    constructor(init: Attachment.Opts);
    /** Current size of the internal buffer in bytes (compressed if flagged). */
    get size(): number;
    /** Get a copy of the internal buffer (leave compression state unchanged). */
    bytes(): Uint8Array;
    /** Replace the internal buffer (optionally update compression flag). */
    set_bytes(bytes: Compression.BytesLike, compressed?: boolean): this;
    /** Ensure the buffer is gzip-compressed (noop if already compressed). */
    compress(options?: Compression.GzipOptions): this;
    /** Ensure the buffer is uncompressed (noop if already uncompressed). */
    decompress(): this;
    /** Return Base64 of the current buffer (compressed or not). */
    to_base64({ url_safe }?: {
        url_safe?: boolean;
    }): string;
    /**
     * Return a string view of the data using a charset.
     * @param decompress Whether to decompress first if compressed. Default true.
     * @param encoding Charset label; defaults to this.charset or "utf-8".
     */
    to_string(decompress?: boolean, encoding?: string): string;
    /**
     * Parse JSON from the data.
     * @param decompress Whether to decompress first if compressed. Default true.
     */
    to_json<T = unknown>(decompress?: boolean): T;
    /**
     * Convert this attachment to a backend REST API attachment payload.
     *
     * This returns an object compatible with the server's `Mail.Attachment.RestAPI`
     * shape using either:
     *  - `{ content, encoding }` (default; embeds the payload), or
     *  - `{ url }` (streams from an http(s)/data URL).
     *
     * @param opts Conversion options.
     * @param opts.encoding Output string encoding for `content`. Defaults to `"base64"`.
     *                      Supported: `"base64" | "hex" | "utf8"`.
     *                      Use `"utf8"` only for textual data.
     * @param opts.decompress Whether to decompress before encoding. Defaults to `true`.
     * @param opts.url Optional http(s) or data: URL. When provided, `content`/`encoding`
     *                 are omitted and the server will stream from this URL.
     *
     * @returns A REST API attachment payload with metadata plus either `{ content, encoding }` or `{ url }`.
     */
    to_rest_api(opts?: {
        encoding?: "base64" | "hex" | "utf8";
        decompress?: boolean;
        url?: string;
    }): Mail.Attachment.RestAPI;
    /** Clone the attachment, including bytes and metadata. */
    clone(): Attachment;
}
export declare namespace Attachment {
    /** Options for constructing an Attachment. */
    interface Opts {
        /** File or directory name. */
        name: string;
        /** Path relative to the dropped root (if available). */
        path?: string;
        /** MIME type of the data. */
        mime_type?: string;
        /** Charset used for text decoding (if applicable). */
        charset?: string;
        /** Initial bytes to load into the attachment. */
        bytes?: Compression.BytesLike;
        /** Original File/Blob (if created from user drop). */
        file?: File | Blob;
        /** Whether bytes are already gzip-compressed. */
        compressed?: boolean;
    }
    /** Create an Attachment from a Blob/File; optionally read and compress. */
    function from_blob(blob: Blob | File, opts?: {
        name?: string;
        read?: boolean;
        compress?: boolean;
        charset?: string | "auto";
    }): Promise<Attachment>;
    /** Parameters for the {@link on_drop} handler. */
    interface OnDropOpts {
        /** Callback invoked per created attachment (files only). */
        callback: (attachment: Attachment) => any;
        /** Whether to read bytes immediately. Default true. */
        read?: boolean;
        /** Whether to gzip after reading. Default false. */
        compress?: boolean;
        /** Max uncompressed size per file (-1 disables). Default 50MB. */
        max_size?: number;
        /** Max cumulative uncompressed size (-1 disables). Default 50MB. */
        total_max_size?: number;
        /** Called at drag start. */
        on_start?: (event: DragEvent) => any;
        /** Called at drag end. */
        on_stop?: (event: DragEvent) => any;
        /** Error callback. */
        on_error?: (error: Error) => any;
    }
    /**
     * Handle drag/drop; recursively traverses directories and adds only files.
     * Uses FS Access API when available, falls back to WebKit entries, otherwise flat files only.
     */
    function on_drop(node: AnyElement, sink: Attachment[], opts: OnDropOpts): void;
}
