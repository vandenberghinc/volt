/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh.
 */
import * as nodemailer from "nodemailer";
import * as vlib from "@vandenberghinc/vlib";
import { Readable } from "stream";
import { Url } from "url";
import * as UI from "./ui.js";
/**
 * The mail class, used to send emails via SMTP.
 *
 * @note This class is initialized under server property `mail` when the server is started with the `smtp` option.
 *
 * @nav Plugins
 * @docs
 */
export declare class Mail {
    /** the smpt mailer. */
    private smtp;
    /** the smtp sender address. */
    sender: Mail.Address;
    /** the default mail style. */
    style: Mail.Style;
    /** construct a new server instance. */
    constructor({ smtp, style, }: Mail.Opts);
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
    send({ sender, recipients, subject, body, attachments, max_attachments, max_attachment_size, max_attachments_size, allow_untrusted_urls, }: {
        sender?: Mail.Address;
        recipients?: Mail.Address[];
        subject?: string;
        body?: string | UI.MailElement;
        attachments?: Mail.Attachment.Any[];
    } & Mail.Attachment.Limits): Promise<void>;
    /**
     * convert a single generic attachment input into a nodemailer attachment.
     */
    private build_attachment;
    /** returns true when url starts with http:// or https:// */
    private is_http_url;
    /**
     * normalize and validate a mixed attachment input into nodemailer attachments.
     * @param input mixed list of attachments.
     * @param limits size/count validation limits.
     * @returns normalized nodemailer attachments.
     * @throws {ExternalError} when limits are exceeded.
     */
    private normalize_and_validate_attachments;
    /**
     * measure the on-wire payload size (approx) of a nodemailer attachment content.
     * note: if `encoding: "base64"` is set, we decode to compute raw byte size.
     */
    private measure_attachment_bytes;
    /**
     * normalize a base64 or url-safe base64 string to standard base64 (no decoding).
     * trims whitespace and converts url-safe chars.
     */
    private normalize_base64;
    /**
     * optional content headers for charset/compression hints.
     * email clients usually ignore custom headers; added for traceability.
     */
    private build_content_headers;
}
/** nested types for the mail module. */
export declare namespace Mail {
    /** a mail address, either a string or an array of [name, email]. */
    type Address = string | [string, string];
    /** options for the smtp mailer. */
    interface Opts {
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
    interface Style {
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
    interface Attachment {
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
    namespace Attachment {
        /** The possible encodings. */
        type Encoding = "base64" | "hex" | "utf8" | "utf-8" | "binary" | "latin1";
        const encodings: Set<Encoding>;
        /** Attachment validation limits. */
        interface Limits {
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
        function is(a: any): a is Attachment;
        /**
         * user-friendly REST attachment payload.
         * choose one of:
         *  - `{ content, encoding }` for inline payloads (encoding: base64/hex/utf8/binary/latin1).
         *  - `{ url }` for http(s) or data: urls (streamed by nodemailer).
         */
        interface RestAPI {
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
        namespace RestAPI {
            /** Type guard. */
            function is(a: any): a is RestAPI;
            /** Schema validation. */
            const Schema: vlib.Schema.Opts;
        }
        /** A native nodemailer attachment. */
        interface Native {
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
            headers?: {
                [key: string]: string | string[] | {
                    prepared: boolean;
                    value: string;
                };
            } | Array<{
                key: string;
                value: string;
            }>;
            /** an optional value that overrides entire node content in the mime message. If used then all other options set for this node are ignored. */
            raw?: string | Buffer | Readable | Native | undefined;
        }
        /** Nested native types. */
        namespace Native {
            /** Simple type guard. */
            function is(a: any): a is Native;
        }
        /**
         * Unified attachment input accepted by {@link Mail.send}.
         */
        type Any = string | vlib.Path | Attachment | RestAPI | Native;
    }
}
