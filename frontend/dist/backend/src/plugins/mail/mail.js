/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh.
 */
// imports.
import * as nodemailer from "nodemailer";
import * as vlib from "@vandenberghinc/vlib";
// imports.
import * as UI from "./ui.js";
import { ExternalError } from "../../errors/index.js";
import { Status } from "../../status.js";
/**
 * The mail class, used to send emails via SMTP.
 *
 * @note This class is initialized under server property `mail` when the server is started with the `smtp` option.
 *
 * @nav Plugins
 * @docs
 */
export class Mail {
    /** the smpt mailer. */
    smtp;
    /** the smtp sender address. */
    sender; // is defined when `smtp` is defined.
    /** the default mail style. */
    style;
    /** construct a new server instance. */
    constructor({ smtp, style = {
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
    }, }) {
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
     *
     * @docs
     */
    async send({ sender = undefined, recipients = [], subject = undefined, body = "", attachments = [], max_attachments = -1, max_attachment_size = -1, max_attachments_size = -1, allow_untrusted_urls = false, }) {
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
        const format_address = (address) => {
            if (Array.isArray(address))
                return `${address[0]} <${address[1]}>`;
            return address;
        };
        const to = [];
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
        }
        catch (error) {
            throw new Error(error?.message ?? String(error));
        }
    }
    // ---------------------------------------------------------
    // attachment handling (normalization + validation).
    // ---------------------------------------------------------
    /**
     * convert a single generic attachment input into a nodemailer attachment.
     */
    build_attachment(it, opts = {}) {
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
                const enc = (it.encoding ?? "base64").toLowerCase();
                let payload = it.content;
                if (enc === "base64") {
                    payload = Buffer.from(this.normalize_base64(it.content), "base64");
                }
                else if (enc === "hex" || enc === "latin1" || enc === "binary" || enc === "utf8" || enc === "utf-8") {
                    const node_enc = enc === "utf-8" ? "utf8" : enc;
                    payload = Buffer.from(it.content, node_enc);
                }
                else {
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
                const enc = (it.encoding ?? "base64").toLowerCase();
                let payload;
                if (enc === "base64") {
                    payload = Buffer.from(this.normalize_base64(it.content), "base64");
                }
                else if (enc === "hex" || enc === "latin1" || enc === "binary" || enc === "utf8" || enc === "utf-8") {
                    const node_enc = enc === "utf-8" ? "utf8" : enc;
                    payload = Buffer.from(it.content, node_enc);
                }
                else {
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
    is_http_url(u) {
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
    normalize_and_validate_attachments(input, limits = {}) {
        const items = input ?? [];
        const nm_attachments = [];
        for (const it of items) {
            const built = this.build_attachment(it, limits);
            nm_attachments.push(built);
        }
        const { max_attachments, max_attachment_size, max_attachments_size, } = limits;
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
            for (const a of nm_attachments)
                total += this.measure_attachment_bytes(a);
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
    measure_attachment_bytes(a) {
        if (a.content) {
            if (Buffer.isBuffer(a.content))
                return a.content.length;
            if (typeof a.content === "string") {
                if (a.encoding === "base64") {
                    try {
                        return Buffer.from(a.content, "base64").length;
                    }
                    catch {
                        return a.content.length;
                    }
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
            }
            catch {
                return 0;
            }
        }
        return 0;
    }
    /**
     * normalize a base64 or url-safe base64 string to standard base64 (no decoding).
     * trims whitespace and converts url-safe chars.
     */
    normalize_base64(b64) {
        let t = String(b64).trim().replace(/-/g, "+").replace(/_/g, "/");
        const mod = t.length % 4;
        if (mod)
            t += "=".repeat(4 - mod);
        return t;
    }
    /**
     * optional content headers for charset/compression hints.
     * email clients usually ignore custom headers; added for traceability.
     */
    build_content_headers({ charset, compressed }) {
        const headers = {};
        if (charset)
            headers["X-Attachment-Charset"] = charset;
        if (typeof compressed === "boolean")
            headers["X-Attachment-Compressed"] = compressed ? "gzip" : "none";
        return Object.keys(headers).length ? headers : undefined;
    }
}
/** nested types for the mail module. */
(function (Mail) {
    /** Nested attachment types. */
    let Attachment;
    (function (Attachment) {
        Attachment.encodings = new Set(["base64", "hex", "utf8", "utf-8", "binary", "latin1"]);
        /** Type guard. */
        function is(a) {
            return a && typeof a === "object"
                && ("name" in a)
                && (!("path" in a) || typeof a.path === "string")
                && (!("mime_type" in a) || typeof a.mime_type === "string")
                && (!("charset" in a) || typeof a.charset === "string")
                && (!("bytes" in a) || (Buffer.isBuffer(a.bytes) || a.bytes instanceof Uint8Array))
                && (!("content" in a) || typeof a.content === "string")
                && (!("encoding" in a) || Attachment.encodings.has(a.encoding))
                && (!("compressed" in a) || typeof a.compressed === "boolean");
        }
        Attachment.is = is;
        let RestAPI;
        (function (RestAPI) {
            /** Type guard. */
            function is(a) {
                return a && typeof a === "object"
                    && ("name" in a)
                    && (!("path" in a) || typeof a.path === "string")
                    && (!("mime_type" in a) || typeof a.mime_type === "string")
                    && (!("charset" in a) || typeof a.charset === "string")
                    && (!("compressed" in a) || typeof a.compressed === "boolean")
                    && (!("content" in a) || typeof a.content === "string")
                    && (!("encoding" in a) || Attachment.encodings.has(a.encoding))
                    && (!("url" in a) || typeof a.url === "string");
            }
            RestAPI.is = is;
            /** Schema validation. */
            RestAPI.Schema = {
                name: { type: "string", required: true },
                path: { type: "string", required: false },
                mime_type: { type: "string", required: false },
                charset: { type: "string", required: false },
                compressed: { type: "boolean", required: false },
                content: { type: "string", required: false },
                encoding: { type: "string", enum: Array.from(Attachment.encodings), required: false },
                url: { type: "string", required: false },
            };
        })(RestAPI = Attachment.RestAPI || (Attachment.RestAPI = {}));
        /** Nested native types. */
        let Native;
        (function (Native) {
            /** Simple type guard. */
            function is(a) {
                return a && typeof a === "object"
                    && ("content" in a || "path" in a || "filename" in a);
            }
            Native.is = is;
        })(Native = Attachment.Native || (Attachment.Native = {}));
    })(Attachment = Mail.Attachment || (Mail.Attachment = {}));
})(Mail || (Mail = {}));
