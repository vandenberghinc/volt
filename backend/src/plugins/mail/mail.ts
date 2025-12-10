/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh.
 */

// imports.
import * as nodemailer from "nodemailer";
import * as vlib from "@vandenberghinc/vlib";
import { Readable } from "stream";
import { Url } from "url";

// imports.
import * as UI from "./ui.js";
import { ExternalError } from "../../errors/index.js";
import { Status } from "../../status.js";

/**
 * mail module.
 */
export class Mail {

    /** the smpt mailer. */
    private smtp: nodemailer.Transporter;

    /** the smtp sender address. */
    public sender: Mail.Address; // is defined when `smtp` is defined.

    /** the default mail style. */
    public style: Mail.Style;

    /** construct a new server instance. */
    constructor({
        smtp,
        style = {
            font: '"Helvetica", sans-serif',
            title_fg: "#121B23",
            subtitle_fg: "#121B23",
            text_fg: "#1F2F3D",
            button_fg: "#FFFFFF",
            footer_fg: "#686B80",
            bg: "#EEEEEE",
            widget_bg: "#FFFFFF",
            widget_border: "#E6E6E6",
            button_bg: "#1F2F3D",
            divider_bg: "#706780",
        },
    }: Mail.Opts) {
        this.style = style;
        this.sender = smtp.sender;
        this.smtp = nodemailer.createTransport({
            ...smtp,
            ...(smtp.override ?? {}),
        });
    }

    // ---------------------------------------------------------
    // public methods.

    /**
     * send one or multiple mails.
     *
     * @note ensure SPF/DKIM are configured when sending attachments.
     * @returns resolves/rejects when the mail has been sent.
     *
     * @param sender optional sender override.
     * @param recipients recipient addresses.
     * @param subject subject line.
     * @param body html string or `UI.MailElement`.
     * @param attachments supported inputs (paths, backend model, REST model, or nodemailer attachment).
     * @param max_attachments limit on number of attachments; -1 disables.
     * @param max_attachment_size max size (bytes) per attachment; -1 disables.
     * @param max_attachments_size max total size (bytes) across attachments; -1 disables.
     */
    async send({
        sender = undefined,
        recipients = [],
        subject = undefined,
        body = "",
        attachments = [],
        max_attachments = -1,
        max_attachment_size = -1,
        max_attachments_size = -1,
        allow_untrusted_urls = false,
    }: {
        sender?: Mail.Address;
        recipients?: Mail.Address[];
        subject?: string;
        body?: string | UI.MailElement;
        attachments?: Mail.Attachment.Any[];
    } & Mail.Attachment.Limits): Promise<void> {

        if (!this.smtp) {
            throw new Error("smtp is not enabled, define the required server argument on initialization to enable smtp.");
        }

        if (body instanceof UI.MailElement) {
            body = body.html();
        }

        if ((sender == null) && (this.sender != null)) {
            sender = this.sender;
        }
        if (!recipients || recipients.length === 0) {
            throw new Error("the mail has no recipients.");
        }
        if (sender == null) {
            throw new Error('parameter "sender" should be a defined value of type "string" or "array".');
        }

        const format_address = (address: string | [string, string]): string => {
            if (Array.isArray(address)) return `${address[0]} <${address[1]}>`;
            return address;
        };

        const to: string[] = [];
        recipients.forEach((address) => to.push(format_address(address)));

        const { nodemailer_attachments } = this.normalize_and_validate_attachments(attachments, {
            max_attachments,
            max_attachment_size,
            max_attachments_size,
            allow_untrusted_urls,
        });

        try {
            await this.smtp.sendMail({
                from: format_address(sender),
                to,
                subject,
                html: body,
                attachments: nodemailer_attachments,
            });
        } catch (error: any) {
            throw new Error(error?.message ?? String(error));
        }
    }

    // ---------------------------------------------------------
    // attachment handling (normalization + validation).
    // ---------------------------------------------------------

    /**
     * convert a single generic attachment input into a nodemailer attachment.
     */
    private build_attachment(
        it: Mail.Attachment.Any,
        opts: { allow_untrusted_urls?: boolean } = {}
    ): Mail.Attachment.Native {

        // filesystem path inputs (string | vlib.Path).
        if (typeof it === "string" || (it instanceof vlib.Path)) {
            const path = (it instanceof vlib.Path) ? it : new vlib.Path(it);
            const file_name = path.full_name();
            const buf = path.load_sync();
            return {
                filename: file_name,
                path: path.str(),
                content: buf,
            };
        }

        // rest payload: either { content + encoding } or { url }.
        if (Mail.Attachment.RestAPI.is(it)) {
            const { name, mime_type, charset, compressed } = it;

            // a) content + encoding -> to content Buffer/string for nodemailer.
            if (typeof it.content === "string") {
                const enc = (it.encoding ?? "base64").toLowerCase() as Mail.Attachment.RestAPI["encoding"];
                let payload: string | Buffer = it.content;

                if (enc === "base64") {
                    payload = Buffer.from(this.normalize_base64(it.content), "base64");
                } else if (enc === "hex" || enc === "latin1" || enc === "binary" || enc === "utf8" || enc === "utf-8") {
                    const node_enc = enc === "utf-8" ? "utf8" : enc;
                    payload = Buffer.from(it.content, node_enc as BufferEncoding);
                } else {
                    throw new ExternalError({
                        status: Status.bad_request,
                        type: "InvalidAttachment",
                        message: `Unsupported encoding '${it.encoding}'.`,
                    });
                }

                return {
                    filename: name ?? "attachment",
                    content: payload,
                    contentType: mime_type,
                    headers: this.build_content_headers({ charset, compressed }),
                };
            }

            // b) url (http/https/data) -> nodemailer streams from path.
            if (it.url) {
                if (!opts.allow_untrusted_urls && this.is_http_url(it.url)) {
                    throw new ExternalError({
                        status: Status.bad_request,
                        type: "UntrustedUrlBlocked",
                        message: "http/https attachment urls are blocked by default. set 'allow_untrusted_urls' to true to allow.",
                    });
                }
                return {
                    filename: name ?? "attachment",
                    path: it.url,
                    contentType: mime_type,
                    headers: this.build_content_headers({ charset, compressed }),
                };
            }

            throw new ExternalError({
                status: Status.bad_request,
                type: "InvalidAttachment",
                message: "Attachment payload missing { content, encoding } or { url }.",
            });
        }

        // backend model: { bytes } or { content + encoding }.
        if (Mail.Attachment.is(it)) {
            const { name, mime_type, charset, compressed } = it;

            if (it.bytes) {
                const buf = Buffer.isBuffer(it.bytes) ? it.bytes : Buffer.from(it.bytes);
                return {
                    filename: name ?? "attachment",
                    content: buf,
                    contentType: mime_type,
                    headers: this.build_content_headers({ charset, compressed }),
                };
            }

            if (typeof it.content === "string") {
                const enc = (it.encoding ?? "base64").toLowerCase() as Mail.Attachment["encoding"];
                let payload: Buffer;

                if (enc === "base64") {
                    payload = Buffer.from(this.normalize_base64(it.content), "base64");
                } else if (enc === "hex" || enc === "latin1" || enc === "binary" || enc === "utf8" || enc === "utf-8") {
                    const node_enc = enc === "utf-8" ? "utf8" : enc;
                    payload = Buffer.from(it.content, node_enc as BufferEncoding);
                } else {
                    throw new ExternalError({
                        status: Status.bad_request,
                        type: "InvalidAttachment",
                        message: `Unsupported encoding '${it.encoding}'.`,
                    });
                }

                return {
                    filename: name ?? "attachment",
                    content: payload,
                    contentType: mime_type,
                    headers: this.build_content_headers({ charset, compressed }),
                };
            }

            // passthrough for pre-built nodemailer attachments.
            if (Mail.Attachment.Native.is(it)) {
                return { ...it };
            }

            throw new ExternalError({
                status: Status.bad_request,
                type: "InvalidAttachment",
                message: "Attachment missing content: provide bytes or { content, encoding }.",
            });
        }

        throw new ExternalError({
            status: Status.bad_request,
            type: "InvalidAttachment",
            message: "Unsupported attachment input.",
        });
    }

    /** returns true when url starts with http:// or https:// */
    private is_http_url(u: string | Url): boolean {
        const s = typeof u === "string" ? u : String(u);
        return /^https?:\/\//i.test(s);
    }

    /**
     * normalize and validate a mixed attachment input into nodemailer attachments.
     * @param input mixed list of attachments.
     * @param limits size/count validation limits.
     * @returns normalized nodemailer attachments.
     * @throws {ExternalError} when limits are exceeded.
     */
    private normalize_and_validate_attachments(
        input: Mail.Attachment.Any[] | undefined,
        limits: Mail.Attachment.Limits = {}
    ): { nodemailer_attachments: Mail.Attachment.Native[] } {

        const items = input ?? [];
        const nm_attachments: Mail.Attachment.Native[] = [];

        for (const it of items) {
            const built = this.build_attachment(it, limits);
            nm_attachments.push(built);
        }

        const {
            max_attachments,
            max_attachment_size,
            max_attachments_size,
        } = limits;

        if (typeof max_attachments === "number" && max_attachments !== -1 && nm_attachments.length > max_attachments) {
            throw new ExternalError({
                status: Status.bad_request,
                type: "TooManyAttachments",
                message: `Too many attachments. max is ${max_attachments}.`,
            });
        }

        if (typeof max_attachment_size === "number" && max_attachment_size !== -1) {
            for (const a of nm_attachments) {
                const size = this.measure_attachment_bytes(a);
                if (size > max_attachment_size) {
                    throw new ExternalError({
                        status: Status.bad_request,
                        type: "AttachmentTooLarge",
                        message: `Attachment '${a.filename ?? "unnamed"}' exceeds max size of ${max_attachment_size} bytes.`,
                    });
                }
            }
        }

        if (typeof max_attachments_size === "number" && max_attachments_size !== -1) {
            let total = 0;
            for (const a of nm_attachments) total += this.measure_attachment_bytes(a);
            if (total > max_attachments_size) {
                throw new ExternalError({
                    status: Status.bad_request,
                    type: "AttachmentsTooLarge",
                    message: `Total attachments size ${total} bytes exceeds max of ${max_attachments_size} bytes.`,
                });
            }
        }

        return { nodemailer_attachments: nm_attachments };
    }

    /**
     * measure the on-wire payload size (approx) of a nodemailer attachment content.
     * note: if `encoding: "base64"` is set, we decode to compute raw byte size.
     */
    private measure_attachment_bytes(a: Mail.Attachment.Native): number {
        if (a.content) {
            if (Buffer.isBuffer(a.content)) return a.content.length;
            if (typeof a.content === "string") {
                if (a.encoding === "base64") {
                    try { return Buffer.from(a.content, "base64").length; } catch { return a.content.length; }
                }
                return Buffer.byteLength(a.content);
            }
            // stream size unknown beforehand.
            return 0;
        }
        if (a.path) {
            try {
                const p = new vlib.Path(String(a.path));
                return p.size ?? 0;
            } catch {
                return 0;
            }
        }
        return 0;
    }

    /**
     * normalize a base64 or url-safe base64 string to standard base64 (no decoding).
     * trims whitespace and converts url-safe chars.
     */
    private normalize_base64(b64: string): string {
        let t = String(b64).trim().replace(/-/g, "+").replace(/_/g, "/");
        const mod = t.length % 4;
        if (mod) t += "=".repeat(4 - mod);
        return t;
    }

    /**
     * optional content headers for charset/compression hints.
     * email clients usually ignore custom headers; added for traceability.
     */
    private build_content_headers({ charset, compressed }: { charset?: string; compressed?: boolean }) {
        const headers: Record<string, string> = {};
        if (charset) headers["X-Attachment-Charset"] = charset;
        if (typeof compressed === "boolean") headers["X-Attachment-Compressed"] = compressed ? "gzip" : "none";
        return Object.keys(headers).length ? headers : undefined;
    }

}

/** nested types for the mail module. */
export namespace Mail {

    /** a mail address, either a string or an array of [name, email]. */
    export type Address = string | [string, string];

    /** options for the smtp mailer. */
    export interface Opts {
        /**
         * the smtp nodemailer arguments object.
         * more information can be found at the nodemailer documentation.
         */
        smtp: {
            /** the smtp sender address; either a string email, e.g. `your@email.com`, or`[name, email]`. */
            sender: Address;
            /** the mail server's host address. */
            host?: string;
            /** the mail server's port. */
            port?: number;
            /** enable secure options. */
            secure?: boolean;
            /** the authentication settings. */
            auth?: {
                /** the email used for authentication. */
                user: string;
                /** the password used for authentication. */
                pass: string;
            };
            /**
             * the smtp `nodemailer.createTransport` argument that overrides the other {@link Mail.Opts.smtp} options.
             * use this to supply vendor-specific transport options.
             */
            override?: nodemailer.TransportOptions;
        };
        /** the default mail style. */
        style?: Style;
    }

    /**
     * style tokens used to theme automatically generated emails.
     */
    export interface Style {
        /** the font family. */
        font: string;
        /** the title foreground color. */
        title_fg: string;
        /** the subtitle foreground color. */
        subtitle_fg: string;
        /** the body text foreground color. */
        text_fg: string;
        /** the foreground color used for buttons. */
        button_fg: string;
        /** the footer foreground color. */
        footer_fg: string;
        /** page background color. */
        bg: string;
        /** widget background color. */
        widget_bg: string;
        /** widget border color. */
        widget_border: string;
        /** button background color. */
        button_bg: string;
        /** divider color. */
        divider_bg: string;
    }

    /**
     * stable backend attachment model.
     * mirrors the frontend Attachment; provide either raw `bytes` or `{ content, encoding }`.
     * encoding is only used when `content` is a string.
     */
    export interface Attachment {
        /** file or directory name. */
        name: string;
        /** path relative to a logical root (optional). */
        path?: string;
        /** mime type of the data. */
        mime_type?: string;
        /** charset used for text decoding (if applicable). */
        charset?: string;
        /** raw bytes buffer. */
        bytes?: Buffer | Uint8Array;
        /** textual payload to be decoded using `encoding`. */
        content?: string;
        /** encoding used to decode `content` into bytes (e.g. base64, hex, utf8, binary, latin1). */
        encoding?: "base64" | "hex" | "utf8" | "utf-8" | "binary" | "latin1";
        /** whether bytes are gzip-compressed (metadata only). */
        compressed?: boolean;
    }

    /** Nested attachment types. */
    export namespace Attachment {

        /** The possible encodings. */
        export type Encoding = "base64" | "hex" | "utf8" | "utf-8" | "binary" | "latin1";
        export const encodings: Set<Encoding> = new Set(["base64", "hex", "utf8", "utf-8", "binary", "latin1"]);

        /** Attachment validation limits. */
        export interface Limits {
            /** Maximum number of attachments allowed (unset means no limit). */
            max_attachments?: number;
            /** Maximum size in bytes per attachment (unset means no limit). */
            max_attachment_size?: number;
            /** Maximum cumulative size in bytes across all attachments (unset means no limit). */
            max_attachments_size?: number;
            /** Allow loading http/https urls as attachments (default: false). */
            allow_untrusted_urls?: boolean;
        }

        /** Type guard. */
        export function is(a: any): a is Attachment {
            return a && typeof a === "object"
                && ("name" in a)
                && (!("path" in a) || typeof a.path === "string")
                && (!("mime_type" in a) || typeof a.mime_type === "string")
                && (!("charset" in a) || typeof a.charset === "string")
                && (!("bytes" in a) || (Buffer.isBuffer(a.bytes) || a.bytes instanceof Uint8Array))
                && (!("content" in a) || typeof a.content === "string")
                && (!("encoding" in a) || encodings.has(a.encoding))
                && (!("compressed" in a) || typeof a.compressed === "boolean");
        }

        /**
         * user-friendly REST attachment payload.
         * choose one of:
         *  - `{ content, encoding }` for inline payloads (encoding: base64/hex/utf8/binary/latin1).
         *  - `{ url }` for http(s) or data: urls (streamed by nodemailer).
         */
        export interface RestAPI {
            /** file name to display to the recipient. */
            name: string;
            /** relative path inside a bundle/archive (metadata only, optional). */
            path?: string;
            /** mime type of the data. */
            mime_type?: string;
            /** charset used for text decoding (if applicable). */
            charset?: string;
            /** whether the provided bytes are gzip-compressed (metadata only). */
            compressed?: boolean;
            /** textual payload to be decoded using `encoding`. */
            content?: string;
            /** encoding used to decode `content` into bytes. */
            encoding?: "base64" | "hex" | "utf8" | "utf-8" | "binary" | "latin1";
            /** http(s) url or data: url to stream. */
            url?: string;
        }
        export namespace RestAPI {

            /** Type guard. */
            export function is(a: any): a is RestAPI {
                return a && typeof a === "object"
                    && ("name" in a)
                    && (!("path" in a) || typeof a.path === "string")
                    && (!("mime_type" in a) || typeof a.mime_type === "string")
                    && (!("charset" in a) || typeof a.charset === "string")
                    && (!("compressed" in a) || typeof a.compressed === "boolean")
                    && (!("content" in a) || typeof a.content === "string")
                    && (!("encoding" in a) || encodings.has(a.encoding))
                    && (!("url" in a) || typeof a.url === "string")
            }
            
            /** Schema validation. */
            export const Schema: vlib.Schema.Opts = {
                name: { type: "string", required: true },
                path: { type: "string", required: false },
                mime_type: { type: "string", required: false },
                charset: { type: "string", required: false },
                compressed: { type: "boolean", required: false },
                content: { type: "string", required: false },
                encoding: { type: "string", enum: Array.from(encodings), required: false },
                url: { type: "string", required: false },
            }
        }

        /** A native nodemailer attachment. */
        export interface Native {
            /** String, Buffer or a Stream contents for the attachment */
            content?: string | Buffer | Readable | undefined;
            /** path to a file or an URL (data uris are allowed as well) if you want to stream the file instead of including it (better for larger attachments) */
            path?: string | Url | undefined;
            /** filename to be reported as the name of the attached file, use of unicode is allowed. If you do not want to use a filename, set this value as false, otherwise a filename is generated automatically */
            filename?: string | false | undefined;
            /** optional content id for using inline images in HTML message source. Using cid sets the default contentDisposition to 'inline' and moves the attachment into a multipart/related mime node, so use it only if you actually want to use this attachment as an embedded image */
            cid?: string | undefined;
            /** If set and content is string, then encodes the content to a Buffer using the specified encoding. Example values: base64, hex, binary etc. Useful if you want to use binary attachments in a JSON formatted e-mail object */
            encoding?: string | undefined;
            /** optional content type for the attachment, if not set will be derived from the filename property */
            contentType?: string | undefined;
            /** optional transfer encoding for the attachment, if not set it will be derived from the contentType property. Example values: quoted-printable, base64. If it is unset then base64 encoding is used for the attachment. If it is set to false then previous default applies (base64 for most, 7bit for text). */
            contentTransferEncoding?: "7bit" | "base64" | "quoted-printable" | false | undefined;
            /** optional content disposition type for the attachment, defaults to ‘attachment’ */
            contentDisposition?: "attachment" | "inline" | undefined;
            /** is an object of additional headers */
            headers?:
            | { [key: string]: string | string[] | { prepared: boolean; value: string } }
            | Array<{ key: string; value: string }>;
            /** an optional value that overrides entire node content in the mime message. If used then all other options set for this node are ignored. */
            raw?: string | Buffer | Readable | Native | undefined;
        }

        /** Nested native types. */
        export namespace Native {

            /** Simple type guard. */
            export function is(a: any): a is Native {
                return a && typeof a === "object"
                    && ("content" in a || "path" in a || "filename" in a);
            }

        }

        /**
         * Unified attachment input accepted by {@link Mail.send}.
         */
        export type Any =
            | string
            | vlib.Path
            | Attachment
            | RestAPI
            | Native;
    }
}