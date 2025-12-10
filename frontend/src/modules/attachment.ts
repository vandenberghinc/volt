/**
 * @author ...
 * @copyright ...
 */

import { AnyElement } from "src/volt.js";
import { Compression } from "./compression.js";
import type { Mail } from "../../../backend/src/plugins/mail/mail.js"

/** A file attachment with an internal byte buffer and compression/encoding helpers. */
export class Attachment {
    /** File or directory name. */
    public name: string;
    /** Path relative to the dropped root. */
    public path: string;
    /** MIME type of the data. */
    public mime_type: string;
    /** Charset used for text decoding (if applicable). */
    public charset?: string;
    /** Whether the internal buffer is gzip-compressed. */
    public compressed: boolean;
    /** Optional original File/Blob source. */
    public file?: File | Blob;
    /** Internal raw buffer (compressed or not depending on state). */
    private _bytes: Uint8Array;

    /** Create an Attachment from initial metadata and/or bytes. */
    constructor(init: Attachment.Opts) {
        this.name = init.name;
        this.path = init.path ?? "";
        this.mime_type = init.mime_type ?? "";
        this.charset = init.charset;
        this.file = init.file;
        this.compressed = !!init.compressed;
        this._bytes = init.bytes ? Compression.to_uint8(init.bytes) : new Uint8Array(0);
    }

    /** Current size of the internal buffer in bytes (compressed if flagged). */
    get size(): number { return this._bytes.byteLength; }

    /** Get a copy of the internal buffer (leave compression state unchanged). */
    bytes(): Uint8Array { return new Uint8Array(this._bytes); }

    /** Replace the internal buffer (optionally update compression flag). */
    set_bytes(bytes: Compression.BytesLike, compressed = false): this {
        this._bytes = Compression.to_uint8(bytes);
        this.compressed = compressed;
        return this;
    }

    /** Ensure the buffer is gzip-compressed (noop if already compressed). */
    compress(options: Compression.GzipOptions = { level: 9 }): this {
        if (!this.compressed) {
            this._bytes = Compression.compress(this._bytes, options);
            this.compressed = true;
        }
        return this;
    }

    /** Ensure the buffer is uncompressed (noop if already uncompressed). */
    decompress(): this {
        if (this.compressed) {
            this._bytes = Compression.decompress(this._bytes);
            this.compressed = false;
        }
        return this;
    }

    /** Return Base64 of the current buffer (compressed or not). */
    to_base64({ url_safe = false }: { url_safe?: boolean } = {}): string {
        return Compression.to_base64(this._bytes, { url_safe });
    }

    /**
     * Return a string view of the data using a charset.
     * @param decompress Whether to decompress first if compressed. Default true.
     * @param encoding Charset label; defaults to this.charset or "utf-8".
     */
    to_string(decompress = true, encoding?: string): string {
        const buf = decompress && this.compressed ? Compression.decompress(this._bytes) : this._bytes;
        const enc = (encoding ?? this.charset ?? "utf-8").toLowerCase();
        if (enc === "utf-8" || enc === "utf8") return new TextDecoder().decode(buf);
        try { return new TextDecoder(enc as any).decode(buf); } catch { return new TextDecoder().decode(buf); }
    }

    /**
     * Parse JSON from the data.
     * @param decompress Whether to decompress first if compressed. Default true.
     */
    to_json<T = unknown>(decompress = true): T {
        return JSON.parse(this.to_string(decompress)) as T;
    }

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
    to_rest_api(opts: {
        encoding?: "base64" | "hex" | "utf8",
        decompress?: boolean,
        url?: string,
    } = {}): Mail.Attachment.RestAPI {
        const { encoding = "base64", decompress = true, url } = opts;

        const base: Omit<Mail.Attachment.RestAPI, "content" | "encoding" | "url"> = {
            name: this.name,
            path: this.path || undefined,
            mime_type: this.mime_type || undefined,
            charset: this.charset || undefined,
            compressed: this.compressed || undefined,
        };

        if (url) {
            return { ...base, url };
        }

        const bytes = decompress && this.compressed ? Compression.decompress(this._bytes) : this._bytes;

        if (encoding === "base64") {
            return { ...base, content: Compression.to_base64(bytes, { url_safe: false }), encoding };
        }

        if (encoding === "hex") {
            // encode bytes -> hex (lowercase)
            const hex = (() => {
                const v = bytes;
                let out = "";
                for (let i = 0; i < v.length; i++) {
                    const h = v[i].toString(16).padStart(2, "0");
                    out += h;
                }
                return out;
            })();
            return { ...base, content: hex, encoding };
        }

        if (encoding === "utf8") {
            // textual encoding (may be lossy for binary data)
            const text = new TextDecoder().decode(bytes);
            return { ...base, content: text, encoding };
        }

        // fallback to base64 if unsupported encoding is passed
        return { ...base, content: Compression.to_base64(bytes, { url_safe: false }), encoding: "base64" };
    }

    /** Clone the attachment, including bytes and metadata. */
    clone(): Attachment {
        return new Attachment({
            name: this.name,
            path: this.path,
            mime_type: this.mime_type,
            charset: this.charset,
            bytes: this.bytes(),
            file: this.file,
            compressed: this.compressed,
        });
    }
}

export namespace Attachment {
    /** Options for constructing an Attachment. */
    export interface Opts {
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
    export async function from_blob(
        blob: Blob | File,
        opts: { name?: string; read?: boolean; compress?: boolean; charset?: string | "auto" } = {}
    ): Promise<Attachment> {
        const name = (opts.name ?? (blob as File).name) || "blob";
        const mime_type = blob.type || "";
        const charset = (() => {
            const label = opts.charset ?? "auto";
            if (label !== "auto") return label;
            const m = /charset\s*=\s*([^;]+)/i.exec(mime_type);
            return m ? m[1].trim().toLowerCase() : undefined;
        })();

        const att = new Attachment({ name, mime_type, charset, file: blob, bytes: new Uint8Array(0), compressed: false });
        if (opts.read !== false) {
            const ab = "arrayBuffer" in blob
                ? await (blob as any).arrayBuffer()
                : await new Promise<ArrayBuffer>((res, rej) => {
                    const r = new FileReader();
                    r.onerror = () => rej(r.error);
                    r.onload = () => res(r.result as ArrayBuffer);
                    r.readAsArrayBuffer(blob);
                });
            att.set_bytes(new Uint8Array(ab), false);
            if (opts.compress) att.compress();
        }
        return att;
    }

    /** Parameters for the {@link on_drop} handler. */
    export interface OnDropOpts {
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
    export function on_drop(node: AnyElement, sink: Attachment[], opts: OnDropOpts): void {
        let {
            callback,
            read = true,
            compress = false,
            on_start,
            on_stop,
            on_error = (e) => console.error(e),
            max_size = 50 * 1024 * 1024,
            total_max_size = 50 * 1024 * 1024,
        } = opts;

        /** Sum current sink sizes. */
        const sink_total = () => sink.reduce((a, b) => a + b.size, 0);

        /** Guard size constraints. */
        const enforce_sizes = (file: File): boolean => {
            if (max_size !== -1 && file.size > max_size) {
                on_error(new Error(`Attachment '${file.name}' exceeds the size limit of ${Math.round(max_size / (1024 * 1024))}MB.`));
                return false;
            }
            if (total_max_size !== -1 && (sink_total() + file.size) > total_max_size) {
                on_error(new Error(`Attachment '${file.name}' exceeds the total size limit of ${Math.round(total_max_size / (1024 * 1024))}MB.`));
                return false;
            }
            return true;
        };

        /** Push a file as Attachment (respects read/compress). */
        const push_file = async (file: File, rel_path = "") => {
            if (!enforce_sizes(file)) return;
            try {
                const att = await Attachment.from_blob(file, { read, compress });
                (att as any).path = rel_path || (file as any).path || file.name;
                sink.push(att);
                callback(att);
            } catch (e: any) {
                on_error(e instanceof Error ? e : new Error(String(e)));
            }
        };

        /** FS Access API: recursively collect files from a directory handle. */
        const walk_fs_handle = async (handle: any, prefix = ""): Promise<void> => {
            if (handle.kind === "file") {
                const file = await handle.getFile();
                await push_file(file, `${prefix}${file.name}`);
                return;
            }
            if (handle.kind === "directory") {
                // @ts-ignore: async iterator is standard on Chromium
                for await (const [name, child] of handle.entries()) {
                    await walk_fs_handle(child, `${prefix}${name}/`);
                }
            }
        };

        /** WebKit fallback: recursively collect files from a FileSystemEntry directory. */
        const walk_webkit_entry = async (entry: any, prefix = ""): Promise<void> => {
            if (entry.isFile) {
                await new Promise<void>((resolve, reject) => {
                    entry.file(async (file: File) => { try { await push_file(file, `${prefix}${file.name}`); resolve(); } catch (e) { reject(e); } }, reject);
                });
                return;
            }
            if (entry.isDirectory) {
                const reader = entry.createReader();
                const read_all = async (): Promise<any[]> =>
                    new Promise((res, rej) => reader.readEntries((ents: any[]) => res(ents), rej));
                // readEntries may return partial batches; keep reading until empty
                for (; ;) {
                    const batch = await read_all();
                    if (!batch.length) break;
                    for (const child of batch) {
                        await walk_webkit_entry(child, `${prefix}${entry.name ? entry.name + "/" : ""}${child.name ? "" : ""}`);
                        // Note: child.name is already included when recursing into child; build prefix at directory level:
                    }
                }
            }
        };

        node.ondragover = (event) => {
            event.preventDefault();
            event.dataTransfer && (event.dataTransfer.dropEffect = "copy");
            on_start?.(event);
        };
        node.ondragend = (event) => { event.preventDefault(); on_stop?.(event); };

        node.ondrop = (event) => {
            event.preventDefault();
            const items = event.dataTransfer?.items;
            if (!items) return;

            // Process each DataTransferItem
            (async () => {
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    if (item.kind !== "file") continue;

                    // Prefer FS Access API if available.
                    const get_handle = (item as any).getAsFileSystemHandle?.bind(item);
                    if (get_handle) {
                        try {
                            const handle = await get_handle();
                            // handle can be file or directory
                            await walk_fs_handle(handle, "");
                            continue;
                        } catch { /* fall through to other paths */ }
                    }

                    // WebKit directory traversal fallback.
                    const entry = (item as any).webkitGetAsEntry?.();
                    if (entry && (entry.isDirectory || entry.isFile)) {
                        try {
                            await walk_webkit_entry(entry, "");
                            continue;
                        } catch { /* fall through */ }
                    }

                    // Basic file fallback: just the file (most browsers).
                    const file = item.getAsFile();
                    if (file) await push_file(file, file.name);
                }
            })().catch((e) => on_error(e instanceof Error ? e : new Error(String(e))));
        };
    }
}
