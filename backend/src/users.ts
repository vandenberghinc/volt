/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Imports.
// ---------------------------------------------------------

import * as crypto from "crypto"
import * as vlib from "@vandenberghinc/vlib";
import * as utils from "./utils.js";
import * as Mail from "./plugins/mail/ui.js";
import { Status } from "./status.js";
const { ExternalError } = utils;
import { Stream, AuthStream } from "./stream.js"
import { Server, MailAttachment } from "./server.js"
import { Collection } from "./database/collection.js"


// ---------------------------------------------------------
// Types.
// ---------------------------------------------------------

/** The user object / document. */
export type User = {
    /** The user identifier (unique index). */
    uid: string;
    /** The users username (unique index). */
    username: string;
    /** The users email address (unique index). */
    email: string;
    /** The users first name. */
    first_name: string;
    /** The users last name. */
    last_name: string;
    /** The hashed password. */
    password: string;
    /** The users phone number. */
    phone_number?: string;
    /** The created at unix msec timestamp. */
    created_at: number;
    /** The hashed api key (only defined once generated) (non unique index). */
    api_key?: string;
    /** The users support pin, used for support contact validation. */
    support_pin: string;
    /** Whether the user is activated. */
    is_activated: boolean;
};

/** Nested types for the {@link User} interface */
export namespace User {

    /** The frontend representation of a user. */
    export type Frontend = {
        uid: string;
        username: string;
        email: string;
        first_name: string;
        last_name: string;
        phone_number?: string;
        created_at: number;
        has_api_key: boolean;
        support_pin: string;
        is_activated: boolean;
    };
}

/** The token object / document. */
export type Token = {
    /** The user id. */
    uid: string;
    /** Expiration unix timestamp */
    expiration: number;
    /** The hashed token. */
    token: string;
    /** Is token still active. */
    active: boolean;
}

/** The token object / document. */
export type TwoFactorAuthToken = {
    /** The user id. */
    uid: string;
    /** Expiration unix timestamp */
    expiration: number;
    /** The correct 2fa code. */
    code: string;
    /** Is token still active. */
    active: boolean;
}

// ---------------------------------------------------------
// The users manager.
// ---------------------------------------------------------

/**
 * The users class, accessible under `Server.users`.
 */
export class Users {

    // ---------------------------------------------------------
    // Readonly settings.
    // ---------------------------------------------------------

    /**
     * Number of random characters after `<prefix>_<uid>_`.
     * @warning If you change this, also update:
     *  - {@link Users.LEGACY_TOKEN_SUFFIX_LENS} to include old size(s).
     *  - Generators {@link _generate_api_key} and {@link _generate_token}.
     *  - Parser {@link _parse_uid_from_token_api_key}.
     */
    private static readonly TOKEN_SUFFIX_LEN = 64 as const;

    /** Accepted legacy suffix lengths; add old sizes here when rotating. */
    private static readonly LEGACY_TOKEN_SUFFIX_LENS: ReadonlyArray<number> = [];

    /**
     * Allowed characters for the random suffix.
     * @warning MUST NOT include `_` (delimiter). ASCII only for fast-path validation.
     */
    private static readonly TOKEN_SUFFIX_CHARSET =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    /**
     * UID length used by the generator.
     * @warning If you change this, add the old value to {@link Users.LEGACY_UID_LENGTHS}.
     */
    private static readonly UID_LENGTH = 16 as const;

    /** Accepted legacy UID lengths; add old sizes here when rotating. */
    private static readonly LEGACY_UID_LENGTHS: ReadonlyArray<number> = [];

    /**
     * UID character set (ASCII). MUST NOT include `_`.
     */
    private static readonly UID_CHARSET =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    /**
     * Build an ASCII allow table for fast membership checks.
     * Index is charCode (0..127), value is 1 if allowed else 0.
     */
    private static _build_ascii_allow(cs: string): Uint8Array {
        const tbl = new Uint8Array(128);
        for (let i = 0; i < cs.length; i++) {
            const c = cs.charCodeAt(i);
            if (c < 128) tbl[c] = 1;
            else throw new Error("Non-ASCII char in allowed charset; use ASCII-only here.");
        }
        return tbl;
    }

    /** ASCII allow table for token suffix validation (built from TOKEN_SUFFIX_CHARSET). */
    private static readonly TOKEN_SUFFIX_ALLOW = Users._build_ascii_allow(Users.TOKEN_SUFFIX_CHARSET);

    /** ASCII allow table for UID validation (built from UID_CHARSET). */
    private static readonly UID_ALLOW = Users._build_ascii_allow(Users.UID_CHARSET);

    // ---------------------------------------------------------
    // Attributes.
    // ---------------------------------------------------------

    /** The parent server instance. */
    private server: Server;

    /** The recipient email for support submit emails, defaults to `Server.smtp_sender`. */
    private support_recipient?: string | [string, string];

    /** The avg wait time when sending 2FA codes. */
    private avg_send_2fa_time: number[] = [];

    /** The database collection for token documents. */
    private _tokens_db: Collection<Token>;

    /** The database collection for 2fa token documents. */
    private _2fa_tokens_db: Collection<TwoFactorAuthToken>;

    /** The database collection for user documents. */
    private _users_db: Collection<User>;

    /** Enable 2FA for user sign in. */
    private enable_2fa: boolean;

    /** Enable 2FA account activation for user sign up. */
    private enable_account_activation: boolean;

    /** The token expiration in seconds */
    private token_expiration: number;

    /** Database collection for public (read:public, write:public) user documents. */
    public public: Collection<{ uid: string, query?: string, data: Users.Endpoints.JsonValue }>;

    /** Database collection for protected (read:public, write:private) user documents. */
    public protected: Collection<{ uid: string, query?: string, data: Users.Endpoints.JsonValue }>;

    /** Database collection for private (read:private, write:private) user documents. */
    public private: Collection<{ uid: string, query?: string, data: Users.Endpoints.JsonValue }>;

    // ---------------------------------------------------------
    // Constructor.
    // ---------------------------------------------------------

    /** Construct the server. */
    constructor(opts: Users.Opts & { _server: Server }) {
        this.server = opts._server;
        this.enable_2fa = opts.enable_2fa ?? false;
        this.enable_account_activation = opts.enable_account_activation ?? true;
        this.token_expiration = opts.token_expiration ?? 86400;
        this.support_recipient = opts.support_recipient ?? this.server.smtp_sender;

        // Database collections.
        this._tokens_db = this.server.db.collection({
            name: "Volt.Server.Users.Tokens",
            indexes: ["uid", "token"],
            ttl: 1000 * 3600 * 24 * 30, // 30 days.
        });
        this._2fa_tokens_db = this.server.db.collection({
            name: "Volt.Server.Users.TwoFactorAuth",
            indexes: ["uid", "code"],
            ttl: 1000 * 3600 * 24, // 1 day.
        });
        this._users_db = this.server.db.collection({
            name: "Volt.Server.Users.Users",
            indexes: [
                { key: "uid", unique: true },
                { key: "email", unique: true },
                { key: "username", unique: true },
                {
                    key: "api_key", options: {
                        sparse: true, // api_key index sparse/partial so documents without api_key don’t bloat the index
                    }
                } // hashed; non-unique is fine if you only store one per user, and we dont retrieve uid's alike by api key, but extract from raw api key string instead.
            ],
        });

        // Public database collections.
        this.public = this.server.db.collection({
            name: "Volt.Server.Users.Public",
            indexes: ["uid", "query"],
        });
        this.protected = this.server.db.collection({
            name: "Volt.Server.Users.Protected",
            indexes: ["uid", "query"],
        });
        this.private = this.server.db.collection({
            name: "Volt.Server.Users.Private",
            indexes: ["uid", "query"],
        });
    }

    // ---------------------------------------------------------
    // Utils.
    // ---------------------------------------------------------

    /** Generate a code. */
    private _generate_code(length: number = 6): string {
        const charset = "0123456789";
        let out = "";
        for (let i = 0; i < length; i++) out += charset[crypto.randomInt(charset.length)];
        return out;
    }

    /**
     * Generate a crypto str.
     * @warning ENSURE this does not add `_` to the charset, as this is used as a delimiter for tokens/api keys.
     */
    private _generate_crypto_str(length: number = 32, charset: string): string {
        let out = "";
        for (let i = 0; i < length; i++) out += charset[crypto.randomInt(charset.length)];
        return out;
    }

    /**
     * Derive a key with the async `crypto.scrypt` to avoid blocking the event loop.
     * Using the sync variant is CPU-bound and can stall Node’s main thread, enabling
     * trivial DoS via many concurrent hash ops. The async call runs in libuv’s
     * thread pool, preserving responsiveness under load with the same security.
     *
     * @param password - Secret/password or input buffer.
     * @param salt - Per-secret random salt.
     * @param keylen - Desired key length in bytes (default 64).
     * @returns Promise resolving to the derived key buffer.
     */
    private _crypto_scrypt(password: string | Buffer, salt: Buffer, keylen = 64): Promise<Buffer> {
        return new Promise((res, rej) =>
            crypto.scrypt(password, salt, keylen, (e, dk) => (e ? rej(e) : res(dk as Buffer)))
        );
    }

    /** Hash a password. */
    private async _hash_password(plain: string): Promise<string> {
        const salt = crypto.randomBytes(16);
        const hash = await this._crypto_scrypt(plain, salt, 64);
        return `${salt.toString("hex")}:${hash.toString("hex")}`;
    }

    /** Verify a plain password vs stored hashed password. */
    private async _verify_password(plain: string, stored: string): Promise<boolean> {
        const [saltHex, hashHex] = stored.split(":");
        const salt = Buffer.from(saltHex, "hex");
        const expected = Buffer.from(hashHex, "hex");
        const actual = await this._crypto_scrypt(plain, salt, expected.length);
        return crypto.timingSafeEqual(actual, expected);
    }

    /** Generate a unique user ID. */
    private async _generate_uid(): Promise<string> {
        let attempts = 0;
        const max_attempts = 10_000;
        while (attempts < max_attempts) {
            const uid = this._generate_crypto_str(Users.UID_LENGTH, Users.UID_CHARSET);
            if ((await this.uid_exists(uid)) === false) return uid;
            attempts++;
        }
        throw new Error("Failed to generate a unique uid after maximum attempts.");
    }

    /** Generate an API key. Format: `ak_<uid>_<suffix>` */
    private _generate_api_key(uid: string): string {
        /**
         * @warning Do not change the `ak_` prefix or `_` delimiters.
         * If you change suffix length/charset, update:
         *  - {@link Users.TOKEN_SUFFIX_LEN} / {@link Users.LEGACY_TOKEN_SUFFIX_LENS}
         *  - {@link Users.TOKEN_SUFFIX_CHARSET}
         *  - {@link _parse_uid_from_token_api_key}
         */
        return `ak_${uid}_${this._generate_crypto_str(Users.TOKEN_SUFFIX_LEN, Users.TOKEN_SUFFIX_CHARSET)}`;
    }

    /** Generate a token. Format: `tk_<uid>_<suffix>` */
    private _generate_token(uid: string): string {
        /**
         * @warning Do not change the `tk_` prefix or `_` delimiters.
         * Keep the parser and constants in sync if you rotate length/charset.
         */
        return `tk_${uid}_${this._generate_crypto_str(Users.TOKEN_SUFFIX_LEN, Users.TOKEN_SUFFIX_CHARSET)}`;
    }

    /**
     * Validate a UID against ASCII charset and allowed lengths (current + legacy).
     * @warning If you change {@link Users.UID_CHARSET} or {@link Users.UID_LENGTH},
     * update {@link Users.LEGACY_UID_LENGTHS} for backward compatibility.
     */
    private static _is_valid_uid(uid: string): boolean {
        const len = uid.length; // ASCII-only, so code units == chars
        if (len !== Users.UID_LENGTH) {
            let ok = false;
            for (let i = 0; i < Users.LEGACY_UID_LENGTHS.length; i++) {
                if (len === Users.LEGACY_UID_LENGTHS[i]) { ok = true; break; }
            }
            if (!ok) return false;
        }

        const allow = Users.UID_ALLOW;
        for (let i = 0; i < len; i++) {
            const code = uid.charCodeAt(i);
            if (code >= 128 || allow[code] === 0) return false;
        }
        return true;
    }


    /**
     * Parse the uid from `<prefix>_<uid>_<suffix>`, where prefix is `ak_` or `tk_`,
     * `<uid>` passes {@link Users._is_valid_uid}, and `<suffix>`:
     *  - length equals {@link Users.TOKEN_SUFFIX_LEN} or a legacy size; and
     *  - every char is in {@link Users.TOKEN_SUFFIX_CHARSET} (ASCII).
     *
     * @warning If you change suffix length, add old sizes to
     * {@link Users.LEGACY_TOKEN_SUFFIX_LENS}. If you change charset, update
     * {@link Users.TOKEN_SUFFIX_CHARSET} (this table rebuilds automatically).
     * If you change delimiters/prefixes, update this and the generators together.
     */
    private _parse_uid_from_token_api_key(
        input: string,
        expected_prefix: "ak_" | "tk_",
    ): string | undefined {
        if (typeof input !== "string" || !input.startsWith(expected_prefix)) return undefined;

        const pfxLen = expected_prefix.length; // 3
        const delimPos = input.indexOf("_", pfxLen);
        if (delimPos === -1) return undefined;

        const uid = input.slice(pfxLen, delimPos);
        if (uid.length === 0 || !Users._is_valid_uid(uid)) return undefined;

        const suffix = input.slice(delimPos + 1);
        const slen = suffix.length; // ASCII-only assumption
        if (slen !== Users.TOKEN_SUFFIX_LEN) {
            let ok = false;
            for (let i = 0; i < Users.LEGACY_TOKEN_SUFFIX_LENS.length; i++) {
                if (slen === Users.LEGACY_TOKEN_SUFFIX_LENS[i]) { ok = true; break; }
            }
            if (!ok) return undefined;
        }

        const allow = Users.TOKEN_SUFFIX_ALLOW;
        for (let i = 0; i < slen; i++) {
            const code = suffix.charCodeAt(i);
            if (code >= 128 || allow[code] === 0) return undefined;
        }

        return uid;
    }



    /**
     * Validate a proposed new password against basic rules and confirmation.
     * @param pass The new password to validate.
     * @param verify_pass The repeated password to confirm.
     * @returns An object with optional error message and invalid_fields mapping.
     */
    private _verify_new_pass(pass: string, verify_pass: string): { error: string | undefined; invalid_fields: { [key: string]: string } | undefined } {
        let error: string | undefined = undefined;
        if (pass !== verify_pass) {
            error = "Passwords do not match.";
            return { error, invalid_fields: { password: error, verify_password: error } };
        } else if (pass.length < 8) {
            error = "The password should at least include eight characters.";
            return { error, invalid_fields: { password: error, verify_password: error } };
        } else if (pass.toLowerCase() === pass) {
            error = "The password should at least include one capital letter.";
            return { error, invalid_fields: { password: error, verify_password: error } };
        } else if (!/\d|[!@#$%^&*]/.test(pass)) {
            error = "The password should at least include one numeric or special character.";
            return { error, invalid_fields: { password: error, verify_password: error } };
        }
        return { error: undefined, invalid_fields: undefined };
    }

    // ---------------------------------------------------------
    // Authentication (private).
    // ---------------------------------------------------------

    /**
     * Generate and persist a new auth token for the given uid.
     * @param uid The user ID.
     * @returns The plaintext token string.
     */
    async _create_token(uid: string): Promise<string> {
        // @todo create uid & type index.
        const token = this._generate_token(uid);
        await this._tokens_db.set({ uid }, {
            expiration: Date.now() + this.token_expiration * 1000,
            token: await this._hash_password(token),
            active: true,
        });
        return token;
    }

    /**
     * Deactivate the current token for the given uid.
     * @param uid The user ID.
     */
    async _deactivate_token(uid: string): Promise<void> {
        await this._tokens_db.set({ uid }, { active: false });
    }

    /**
     * Create and store a short-lived 2FA token (code).
     * @param uid_or_email The uid or email key used for the 2FA record.
     * @param expiration Expiration in seconds from now.
     * @returns The generated 2FA code.
     */
    async _create_2fa_token(uid_or_email: string, expiration: number): Promise<string> {
        const code = this._generate_code(6);
        await this._2fa_tokens_db.set({ uid: uid_or_email }, {
            expiration: Date.now() + expiration * 1000,
            code: code,
            active: true,
        });
        return code;
    }

    /**
     * Deactivate a stored 2FA token by uid/email key.
     * @param uid_or_email The uid or email key used for the 2FA record.
     */
    async _deactivate_2fa_token(uid_or_email: string): Promise<void> {
        await this._2fa_tokens_db.set({ uid: uid_or_email }, { active: false });
    }

    /**
     * Perform authentication on a request.
     * @returns An object on refusal, undefined on success.
     */
    async _authenticate(stream: Stream): Promise<{ status: number; headers?: { [key: string]: string }; data: string } | undefined> {
        const authorization = stream.headers["authorization"];
        if (authorization !== undefined) {
            if (typeof authorization !== "string") {
                return {
                    status: Status.bad_request,
                    data: "Invalid authorization header.",
                };
            }
            const match = authorization.match(/^Bearer\s+(\S+)$/i);
            if (!match) {
                return {
                    status: Status.bad_request,
                    data: "Invalid authorization scheme, the authorization scheme must be \"Bearer\".",
                };
            }
            const api_key = match[1];
            const uid = this.get_uid_by_api_key(api_key);
            if (!uid) {
                return { status: Status.unauthorized, data: "Unauthorized." };
            }
            if ((await this.verify_api_key_by_uid(uid, api_key)) !== true) {
                return {
                    status: Status.unauthorized,
                    data: "Unauthorized.",
                };
            }
            stream.uid = uid;
            return;
        } else {
            if (stream.cookies.T == null || stream.cookies.T.value == null) {
                return {
                    status: 302,
                    headers: { Location: `/signin?next=${encodeURIComponent(stream.endpoint)}` },
                    data: "Permission denied.",
                };
            }
            const token = stream.cookies.T.value;
            const uid = this.get_uid_by_token(token);
            if (!uid) {
                return {
                    status: 302,
                    headers: { Location: `/signin?next=${encodeURIComponent(stream.endpoint)}` },
                    data: "Permission denied.",
                };
            }
            if ((await this.verify_token_by_uid(uid, token)) !== true) {
                return {
                    status: 302,
                    headers: { Location: `/signin?next=${encodeURIComponent(stream.endpoint)}` },
                    data: "Permission denied.",
                };
            }
            stream.uid = uid;
            return;
        }
    }

    /**
     * Sign a user in, set cookies, and optionally send the success response.
     * @param stream The request stream.
     * @param uid The authenticated user's ID.
     * @param opts Optional settings (e.g., send: false to skip sending the response).
     */
    async _sign_in_response(stream: Stream, uid: string, opts?: {
        /** Send the response (defaults to true). */
        send: boolean,
    }): Promise<void> {
        // Generate token.
        const token = await this._create_token(uid);

        // Create headers.
        this._create_token_cookie(stream, token);
        await this._create_user_cookie(stream, uid);
        await this._create_detailed_user_cookie(stream, uid);

        // Response.
        if (opts?.send !== false) {
            stream.send<Users.Endpoints.SignIn.Result>({
                status: 200,
                data: { message: "Successfully signed in." },
            });
        }
    }

    // ---------------------------------------------------------
    // Cookies (private).
    // ---------------------------------------------------------

    /**
     * Create the auth token cookie on the response.
     * @param stream The request stream.
     * @param token The token string or Token object.
     */
    _create_token_cookie(stream: Stream, token: string | Token): void {
        stream.set_header("Cache-Control", "max-age=0, no-cache, no-store, must-revalidate, proxy-revalidate");
        stream.set_header("Access-Control-Allow-Credentials", "true");
        if (typeof token === "object") {
            token = token.token;
        }
        const max_age = this.token_expiration; // seconds
        const expires = new Date(Date.now() + max_age * 1000).toUTCString();
        stream.set_cookie(`T=${encodeURIComponent(token ?? "")}; Max-Age=${max_age}; Path=/; Expires=${expires}; SameSite=Lax; Secure; HttpOnly;`);
    }

    /**
     * Create user cookies (id and activation flag).
     * @param stream The request stream.
     * @param uid The user ID, or invalid to clear.
     */
    async _create_user_cookie(stream: Stream, uid: string): Promise<void> {
        if (typeof uid === "string") {
            stream.set_cookie(`UserID=${encodeURIComponent(uid ?? "")}; Path=/; SameSite=Lax; Secure; HttpOnly;`); // http only since we use this value for account activation without signin.
            const is_activated = this.enable_account_activation ? await this.is_activated(uid) : true;
            stream.set_cookie(`UserActivated=${is_activated}; Path=/; SameSite=Lax; Secure; HttpOnly;`);
        } else {
            stream.set_cookie(`UserID=-1; Path=/; SameSite=Lax; Secure; HttpOnly;`); // http only since we use this value for account activation without signin.
            const is_activated = this.enable_account_activation ? false : true;
            stream.set_cookie(`UserActivated=${is_activated}; Path=/; SameSite=Lax; Secure; HttpOnly;`);
        }
    }

    /**
     * Create non-HTTP-only cookies with detailed user info for the frontend.
     * @param stream The request stream.
     * @param uid The user ID.
     */
    async _create_detailed_user_cookie(stream: Stream, uid: string): Promise<void> {
        const user = await this.get(uid);
        stream.set_cookie(`UserName=${encodeURIComponent(user.username ?? "")}; Path=/; SameSite=Lax; Secure;`);
        stream.set_cookie(`UserFirstName=${encodeURIComponent(user.first_name ?? "")}; Path=/; SameSite=Lax; Secure;`);
        stream.set_cookie(`UserLastName=${encodeURIComponent(user.last_name ?? "")}; Path=/; SameSite=Lax; Secure;`);
        stream.set_cookie(`UserEmail=${encodeURIComponent(user.email ?? "")}; Path=/; SameSite=Lax; Secure;`);
    }

    /**
     * Clear all default auth/user cookies.
     * @param stream The request stream.
     */
    _reset_cookies(stream: Stream): void {
        const past = "Thu, 01 Jan 1970 00:00:00 GMT";
        stream.set_cookie(`T=; Max-Age=0; Path=/; Expires=${past}; SameSite=Lax; Secure; HttpOnly;`);
        stream.set_cookie(`UserID=; Max-Age=0; Path=/; Expires=${past}; SameSite=Lax; Secure; HttpOnly;`); // http only since we use this value for account activation without signin.
        stream.set_cookie(`UserActivated=; Max-Age=0; Path=/; Expires=${past}; SameSite=Lax; Secure; HttpOnly;`);
        stream.set_cookie(`UserName=; Max-Age=0; Path=/; Expires=${past}; SameSite=Lax; Secure;`);
        stream.set_cookie(`UserFirstName=; Max-Age=0; Path=/; Expires=${past}; SameSite=Lax; Secure;`);
        stream.set_cookie(`UserLastName=; Max-Age=0; Path=/; Expires=${past}; SameSite=Lax; Secure;`);
        stream.set_cookie(`UserEmail=; Max-Age=0; Path=/; Expires=${past}; SameSite=Lax; Secure;`);
    }

    // ---------------------------------------------------------
    // Initialization (private).
    // ---------------------------------------------------------

    /**
     * Initialize default authentication, user, and support endpoints.
     */
    async _initialize(): Promise<void> {

        // ---------------------------------------------------------
        // Default auth endpoints.

        // Send 2fa.
        this.server.endpoint({
            method: "POST",
            endpoint: "/volt/auth/2fa",
            content_type: "application/json",
            rate_limit: "global",
            params: {
                email: "string",
            },
            callback: async (stream, params) => {
                // Get uid.
                let uid;
                if ((uid = await this.get_uid_by_email(params.email)) == null) {
                    return stream.success<Users.Endpoints.Send2FA.Result>({
                        data: { message: "A 2FA code was sent if the specified email exists." },
                    });
                }

                // Send.
                await this.send_2fa({ uid: uid, stream });
                return stream.success<Users.Endpoints.Send2FA.Result>({
                    data: { message: "A 2FA code was sent if the specified email exists." },
                });
            }
        });

        // Sign in.
        this.server.endpoint({
            method: "POST",
            endpoint: "/volt/auth/signin",
            content_type: "application/json",
            rate_limit: {
                limit: 10,
                interval: 60,
                group: "volt.auth"
            },
            callback: async (stream: Stream) => {

                // Uniform delay on failure.
                // Basically wait for the same time as it would time on avg to send a mail, since this causes a very slow response.
                const uniform_delay = async () => {
                    if (this.avg_send_2fa_time.length >= 10) {
                        const sorted = [...this.avg_send_2fa_time].sort((a, b) => a - b);
                        const mid = Math.floor(sorted.length / 2);
                        const median = (sorted.length % 2 === 0)
                            ? Math.floor((sorted[mid - 1] + sorted[mid]) / 2)
                            : sorted[mid];
                        await new Promise(res => setTimeout(res, median));
                    }
                }

                // Get params.
                let email: string | undefined,
                    email_err: Error | undefined,
                    username: string | undefined,
                    username_err: Error | undefined,
                    password: string,
                    uid: string | undefined,
                    code: string;
                try {
                    email = stream.param("email");
                } catch (err) {
                    email_err = err as Error;
                }
                try {
                    username = stream.param("username");
                } catch (err) {
                    username_err = err as Error;
                }
                if (email_err && username_err) {
                    await uniform_delay();
                    return stream.error({
                        status: Status.bad_request,
                        type: "InvalidParams",
                        message: email_err.message,
                    });
                }
                try {
                    password = stream.param("password");
                } catch (err) {
                    await uniform_delay();
                    return stream.error({
                        status: Status.bad_request,
                        type: "InvalidParams",
                        message: (err as any).message,
                    });
                }

                // Get uid.
                if (email) {
                    if ((uid = await this.get_uid_by_email(email)) == null) {
                        await uniform_delay();
                        return stream.error({
                            status: Status.unauthorized,
                            type: "Unauthorized",
                            message: "Unauthorized.",
                            invalid_fields: {
                                "email": "Invalid or unrecognized email",
                                "password": "Invalid or unrecognized password",
                            },
                        });
                    }
                } else {
                    if ((uid = await this.get_uid(username as string)) == null) {
                        await uniform_delay();
                        return stream.error({
                            status: Status.unauthorized,
                            type: "Unauthorized",
                            message: "Unauthorized.",
                            invalid_fields: {
                                "username": "Invalid or unrecognized username",
                                "password": "Invalid or unrecognized password",
                            },
                        });
                    }
                }

                // Verify password.
                if (await this.verify_password(uid, password)) {
                    // Verify 2fa.
                    if (this.enable_2fa) {
                        // Get 2FA.
                        try {
                            code = stream.param("code");
                        } catch (err) {
                            // Send 2fa and add to avg time tracking.
                            const start_time = Date.now();
                            await this.send_2fa({ uid: uid, stream });

                            // Add to avg time tracking.
                            if (this.avg_send_2fa_time.length >= 10000) {
                                this.avg_send_2fa_time.shift();
                            }
                            this.avg_send_2fa_time.push(Date.now() - start_time);

                            // Send error.
                            return stream.error({
                                status: Status.two_factor_auth_required,
                                message: "2FA required.",
                                type: "2FARequired",
                                data: { error: "2FA required." }
                            });
                        }

                        // Verify 2FA.
                        const err = await this.verify_2fa(uid, code);
                        if (err) {
                            return stream.error({
                                status: Status.unauthorized,
                                message: "Invalid 2FA code.",
                                type: "Invalid2FACode",
                                invalid_fields: {
                                    "code": err,
                                },
                            });
                        }
                    }

                    // Sign in.
                    return await this._sign_in_response(stream, uid);
                }

                // Wait for the same time as it would time on avg to send a mail.
                await uniform_delay();

                // Unauthorized.
                return stream.error({
                    status: Status.unauthorized,
                    type: "Unauthorized",
                    message: "Unauthorized.",
                    invalid_fields: {
                        "username": "Invalid or unrecognized username",
                        "password": "Invalid or unrecognized password",
                    }
                });
            }
        });

        // Sign out.
        this.server.endpoint({
            method: "POST",
            endpoint: "/volt/auth/signout",
            content_type: "application/json",
            authenticated: true,
            rate_limit: "global",
            callback: async (stream: AuthStream) => {
                // Delete token.
                await this._deactivate_token(stream.uid);

                // Create headers.
                this._reset_cookies(stream);

                // Response.
                return stream.success<Users.Endpoints.SignOut.Result>({
                    data: { message: "Successfully signed out." },
                });
            }
        });

        // Sign up.
        this.server.endpoint({
            method: "POST",
            endpoint: "/volt/auth/signup",
            content_type: "application/json",
            rate_limit: "global",
            params: {
                username: { type: "string", allow_empty: false },
                first_name: { type: "string", allow_empty: false },
                last_name: { type: "string", allow_empty: false },
                email: { type: "string", allow_empty: false },
                password: { type: "string", allow_empty: false },
                verify_password: { type: "string", allow_empty: false },
                phone_number: { type: "string", required: false },
                code: { type: "string", required: false },
            },
            callback: async (stream, params) => {
                // Verify password.
                const { error, invalid_fields } = this._verify_new_pass(params.password, params.verify_password);
                if (error) {
                    return stream.error({
                        status: Status.bad_request,
                        type: "InvalidParams",
                        message: error,
                        invalid_fields: invalid_fields ?? undefined,
                    });
                }

                // Verify username and email.
                if (await this.username_exists(params.username)) {
                    throw new ExternalError({
                        type: "UsernameAlreadyExists",
                        message: `Username "${params.username}" is already registered.`,
                        status: Status.bad_request,
                        invalid_fields: { "username": "Username is already registered" },
                    });
                }
                if (await this.email_exists(params.email)) {
                    throw new ExternalError({
                        type: "EmailAlreadyExists",
                        message: `Email "${params.email}" is already registered.`,
                        status: Status.bad_request,
                        invalid_fields: { "email": "Email is already registered" }
                    });
                }

                // Verify 2fa.
                if (this.enable_2fa) {
                    // Send 2FA.
                    if (params.code == null || params.code == "") {

                        // Send 2fa and add to avg time tracking.
                        const start_time = Date.now();
                        await this.send_2fa({
                            _email: params.email,
                            _username: params.username,
                            stream,
                            uid: undefined as unknown as string, // keep uid required param but use _email sys arg here.
                        });

                        // Add to avg time tracking.
                        if (this.avg_send_2fa_time.length >= 10000) {
                            this.avg_send_2fa_time.shift();
                        }
                        this.avg_send_2fa_time.push(Date.now() - start_time);

                        // Send error.
                        return stream.error({
                            status: Status.two_factor_auth_required,
                            message: "2FA required.",
                            type: "TwoFactorAuthRequired",
                        });
                    }

                    // Verify 2FA.
                    const err = await this.verify_2fa(params.email, params.code);
                    if (err) {
                        return stream.error({
                            status: Status.unauthorized,
                            type: "Invalid2FACode",
                            message: "Invalid 2FA code.",
                            invalid_fields: {
                                "code": err,
                            },
                        });
                    }
                }

                // Create.
                let uid: string;
                try {
                    uid = await this.create({
                        ...params,
                        // verify_password: undefined,
                        // code: undefined,
                        is_activated: true, // already verified by 2fa or no 2fa is enabled.
                        _check_username_email: false, // already checked.
                    });
                } catch (err) {
                    return stream.error({
                        status: Status.bad_request,
                        type: "InvalidParams",
                        message: (err as Error).message,
                        invalid_fields: (err as any).invalid_fields || {},
                    });
                }

                // Sign in.
                return await this._sign_in_response(stream, uid);
            }
        });

        // Activate account.
        this.server.endpoint({
            method: "POST",
            endpoint: "/volt/auth/activate",
            content_type: "application/json",
            rate_limit: "global",
            params: {
                code: "string",
            },
            callback: async (stream, params) => {
                // Vars.
                let uid = stream.uid;

                // Get uid by cookie.
                if (uid == null) {
                    uid = stream.cookies.UserID?.value; // ensure cookie is http-only since we rely on this for account activation before signin after signup.
                    if (!uid || uid === "null" || uid === "undefined" || uid === "-1") {
                        uid = undefined;
                    }
                }

                // Check uid.
                if (uid == null) {
                    return stream.error({ status: Status.forbidden, message: "Permission denied." });
                }

                // Verify.
                const err = await this.verify_2fa(uid, params.code);
                if (err) {
                    return stream.error({
                        status: Status.forbidden,
                        message: "Permission denied.",
                        invalid_fields: {
                            "code": err,
                        },
                    });
                }

                // Set activated.
                await this.set_activated(uid, true);

                // Response.
                await this._create_user_cookie(stream, uid);
                return stream.success<Users.Endpoints.ActivateUser.Result>({ data: { message: "Successfully activated your account." } });
            }
        });

        // Forgot password.
        this.server.endpoint({
            method: "POST",
            endpoint: "/volt/auth/forgot_password",
            content_type: "application/json",
            rate_limit: "global",
            params: {
                email: { type: "string", allow_empty: false },
                code: { type: "string", allow_empty: false },
                password: { type: "string", allow_empty: false },
                verify_password: { type: "string", allow_empty: false },
            },
            callback: async (stream, params) => {
                // Verify password.
                const { error, invalid_fields } = this._verify_new_pass(params.password, params.verify_password);
                if (error) {
                    return stream.error({
                        status: Status.bad_request,
                        message: error,
                        invalid_fields: invalid_fields ?? undefined,
                    });
                }

                // Get uid.
                let uid;
                if ((uid = await this.get_uid_by_email(params.email)) == null) {
                    return stream.error({ status: Status.forbidden, message: "Invalid email." });
                }

                // Verify 2fa.
                const err = await this.verify_2fa(uid, params.code);
                if (err) {
                    return stream.error({
                        status: Status.forbidden,
                        message: "Invalid 2FA code.",
                        invalid_fields: {
                            "code": "Invalid code"
                        },
                    });
                }

                // Set password.
                await this.set_password(uid, params.password);

                // Sign in.
                return await this._sign_in_response(stream, uid);
            }
        });

        // ---------------------------------------------------------
        // Default user endpoints.

        // Get user.
        this.server.endpoint({
            method: "GET",
            endpoint: "/volt/user",
            content_type: "application/json",
            authenticated: true,
            rate_limit: "global",
            params: {
                // detailed: { type: "boolean", default: false },
            },
            callback: async (stream) => {
                const user = await this.get(stream.uid);

                // Mask sensitive data.
                if (user.password) { user.password = "*".repeat(user.password.length); }
                if (user.api_key) { user.api_key = "*".repeat(user.api_key.length); }

                // Ensure string type for frontend scheme.
                user.first_name ??= "";
                user.last_name ??= "";
                user.username ??= "";
                user.email ??= "";
                user.password ??= "";
                // user.phone_number ??= ""; // its optional in response interface.
                // user.api_key ??= ""; // its optional in response interface.
                user.support_pin ??= "";

                const frontend: User.Frontend = {
                    uid: user.uid,
                    username: user.username ?? "",
                    first_name: user.first_name ?? "",
                    last_name: user.last_name ?? "",
                    email: user.email ?? "",
                    phone_number: user.phone_number, // optional
                    created_at: user.created_at,
                    support_pin: user.support_pin ?? "",
                    is_activated: user.is_activated === true,
                    has_api_key: Boolean(user.api_key),
                }
                return stream.success<Users.Endpoints.GetUser.Result>({ data: frontend });
            }
        });

        // Set user.
        this.server.endpoint({
            method: "POST",
            endpoint: "/volt/user",
            content_type: "application/json",
            authenticated: true,
            rate_limit: "global",
            params: {
                first_name: { type: "string", required: false, allow_empty: false },
                last_name: { type: "string", required: false, allow_empty: false },
                phone_number: { type: "string", required: false, allow_empty: false },
                // is_activated:{ type: "boolean", required: false },
                // password:{ type: "string", required: false }, // dont allow password.
                username: { type: "string", required: false, allow_empty: false },
                email: { type: "string", required: false, allow_empty: false },
            },
            callback: async (stream, params) => {
                if ((params as any).password != null) {
                    return stream.error({
                        status: Status.unauthorized,
                        message: "This endpoint does not allow for password changes.",
                        invalid_fields: {
                            password: "This endpoint does not allow for password changes.",
                        }
                    });
                }
                if ((params as any).is_activated != null) {
                    return stream.error({
                        status: Status.unauthorized,
                        message: "This endpoint does not allow for user activation changes.",
                        invalid_fields: {
                            is_activated: "This endpoint does not allow for user activation changes.",
                        }
                    });
                }
                await this.set(stream.uid, {
                    first_name: params.first_name,
                    last_name: params.last_name,
                    phone_number: params.phone_number,
                    username: params.username,
                    email: params.email,
                });
                await this._sign_in_response(
                    stream,
                    stream.uid,
                    { send: false },
                );
                return stream.success<Users.Endpoints.UpdateUser.Result>({ data: { message: "Successfully updated your account." } });
            }
        });

        // Change password.
        this.server.endpoint({
            method: "POST",
            endpoint: "/volt/user/change_password",
            content_type: "application/json",
            authenticated: true,
            rate_limit: "global",
            params: {
                current_password: { type: "string", allow_empty: false },
                password: { type: "string", allow_empty: false },
                verify_password: { type: "string", allow_empty: false },
            },
            callback: async (stream, params) => {
                // Verify old password.
                if (await this.verify_password(stream.uid, params.current_password) !== true) {
                    return stream.error({
                        status: Status.unauthorized,
                        message: "Incorrect password.",
                        invalid_fields: {
                            current_password: "Incorrect password.",
                        }
                    });
                }

                // Verify new password.
                const { error, invalid_fields } = this._verify_new_pass(params.password, params.verify_password);
                if (error) {
                    return stream.error({
                        status: Status.bad_request,
                        message: error,
                        invalid_fields: invalid_fields ?? undefined,
                    });
                }

                // Set password.
                await this.set_password(stream.uid, params.password);

                // Success.
                return stream.success<Users.Endpoints.ChangePassword.Result>({
                    status: Status.success,
                    data: { message: "Successfully updated your password." },
                });
            }
        });

        // Delete account.
        this.server.endpoint({
            method: "DELETE",
            endpoint: "/volt/user",
            content_type: "application/json",
            authenticated: true,
            rate_limit: "global",
            callback: async (stream: AuthStream) => {
                // Delete.
                await this.delete(stream.uid);

                // Reset cookies.
                this._reset_cookies(stream);

                // Success.
                return stream.success<Users.Endpoints.DeleteUser.Result>({
                    status: Status.success,
                    data: { message: "Successfully deleted your account." },
                });
            }
        });

        // Generate API key.
        this.server.endpoint({
            method: "POST",
            endpoint: "/volt/user/api_key",
            content_type: "application/json",
            authenticated: true,
            rate_limit: "global",
            callback: async (stream: AuthStream) => {
                return stream.success<Users.Endpoints.GenerateAPIKey.Result>({
                    data: {
                        message: "Successfully generated an API key.",
                        api_key: await this.generate_api_key(stream.uid),
                    }
                });
            }
        });

        // Has API key.
        this.server.endpoint({
            method: "GET",
            endpoint: "/volt/user/has_api_key",
            content_type: "application/json",
            authenticated: true,
            rate_limit: "global",
            callback: async (stream: AuthStream) => {
                return stream.success<Users.Endpoints.HasAPIKey.Result>({
                    data: {
                        message: "Successfully checked your API key.",
                        has_api_key: await this.has_api_key(stream.uid),
                    }
                });
            }
        });

        // Revoke API key.
        this.server.endpoint({
            method: "DELETE",
            endpoint: "/volt/user/api_key",
            content_type: "application/json",
            authenticated: true,
            rate_limit: "global",
            callback: async (stream: AuthStream) => {
                await this.revoke_api_key(stream.uid);
                return stream.send<Users.Endpoints.RevokeAPIKey.Result>({
                    status: Status.success,
                    data: { message: "Successfully revoked your API key." },
                });
            }
        });

        /**
         * Initialize a document query for the public/protected/private user data.
         * @returns The initialzied query upon success, or `false` is an error has been sent through the stream.
         */
        const init_user_data_query = (
            stream: AuthStream,
            uid: string,
            query: string | Record<string, any>,
        ): false | { uid: string; [key: string]: any } => {
            if (typeof query === "object") {
                if ("uid" in query) {
                    return stream.error({
                        message: "Invalid query parameter, the 'uid' field is not allowed.",
                        type: "invalid_query_parameter",
                        status: Status.bad_request,
                        invalid_fields: {
                            query: "Invalid query parameter, the 'uid' field is not allowed.",
                        }
                    });
                }
                if ("data" in query) {
                    return stream.error({
                        message: "Invalid query parameter, the 'data' field is not allowed.",
                        type: "invalid_query_parameter",
                        status: Status.bad_request,
                        invalid_fields: {
                            query: "Invalid query parameter, the 'data' field is not allowed.",
                        }
                    });
                }
                if ("query" in query) {
                    return stream.error({
                        message: "Invalid query parameter, the 'query' field is not allowed.",
                        type: "invalid_query_parameter",
                        status: Status.bad_request,
                        invalid_fields: {
                            query: "Invalid query parameter, the 'query' field is not allowed.",
                        }
                    });
                }
                if ("_id" in query) {
                    return stream.error({
                        message: "Invalid query parameter, the '_id' field is not allowed.",
                        type: "invalid_query_parameter",
                        status: Status.bad_request,
                        invalid_fields: {
                            query: "Invalid query parameter, the '_id' field is not allowed.",
                        }
                    });
                }
            }
            return typeof query === "string"
                ? { uid, query: query }
                : { ...query, uid: uid };
        }

        // Load data.
        this.server.endpoint({
            method: "GET",
            endpoint: "/volt/user/data",
            content_type: "application/json",
            authenticated: true,
            rate_limit: "global",
            params: {
                query: { type: ["string", "object"], allow_empty: false },
                default: { type: Users.Endpoints.JsonValueSchemaType, required: false },
            },
            callback: async (stream, params) => {
                const query = init_user_data_query(stream, stream.uid, params.query);
                if (!query) return;
                try {
                    const document = await this.public.load(
                        query,
                        {
                            default: params.default
                                ? { ...query, data: params.default }
                                : undefined,
                            retry: 3,
                        }
                    );
                    return stream.send<Users.Endpoints.LoadUserData.Result>({
                        status: Status.success,
                        data: {
                            message: "Successfully loaded the requested document.",
                            data: document.data,
                        },
                    });
                } catch (e: unknown) {
                    if (e instanceof Collection.NotFoundError) {
                        return stream.error({
                            message: "Document not found.",
                            type: "document_not_found",
                            status: Status.not_found,
                        });
                    }
                    throw e;
                }
            }
        });

        // Set data.
        this.server.endpoint({
            method: "POST",
            endpoint: "/volt/user/data",
            content_type: "application/json",
            authenticated: true,
            rate_limit: "global",
            params: {
                query: { type: ["string", "object"], allow_empty: false },
                data: { type: Users.Endpoints.JsonValueSchemaType },
            },
            callback: async (stream, params) => {
                const query = init_user_data_query(stream, stream.uid, params.query);
                if (!query) return;
                await this.public.set(
                    query,
                    { data: params.data },
                    { retry: 3, flatten: true }
                );
                return stream.send<Users.Endpoints.SetUserData.Result>({
                    status: Status.success,
                    data: { message: "Successfully saved." },
                });
            }
        });

        // Delete data.
        this.server.endpoint({
            method: "DELETE",
            endpoint: "/volt/user/data",
            content_type: "application/json",
            authenticated: true,
            rate_limit: "global",
            params: {
                query: { type: ["string", "object"], allow_empty: false },
            },
            callback: async (stream, params) => {
                const query = init_user_data_query(stream, stream.uid, params.query);
                if (!query) return;
                await this.public.delete(query);
                return stream.send<Users.Endpoints.DeleteUserData.Result>({
                    status: Status.success,
                    data: { message: "Successfully deleted." },
                });
            }
        });

        // Load protected data.
        this.server.endpoint({
            method: "GET",
            endpoint: "/volt/user/data/protected",
            content_type: "application/json",
            authenticated: true,
            rate_limit: "global",
            params: {
                query: { type: ["string", "object"], allow_empty: false },
                default: { type: Users.Endpoints.JsonValueSchemaType, required: false },
            }, 
            callback: async (stream, params) => {
                const query = init_user_data_query(stream, stream.uid, params.query);
                if (!query) return;
                try {
                    const document = await this.protected.load(
                        query,
                        {
                            default: params.default
                                ? { ...query, data: params.default }
                                : undefined,
                            retry: 3,
                        }
                    );
                    return stream.send<Users.Endpoints.LoadProtectedUserData.Result>({
                        status: Status.success,
                        data: {
                            message: "Successfully loaded the requested document.",
                            data: document.data,
                        },
                    });
                } catch (e: unknown) {
                    if (e instanceof Collection.NotFoundError) {
                        return stream.error({
                            message: "Document not found.",
                            type: "document_not_found",
                            status: Status.not_found,
                        });
                    }
                    throw e;
                }
            }
        });


        // ---------------------------------------------------------
        // Default support endpoints.

        // Get PIN.
        this.server.endpoint({
            method: "GET",
            endpoint: "/volt/support/pin",
            content_type: "application/json",
            authenticated: true,
            rate_limit: "global",
            callback: async (stream: AuthStream) => {
                // Sign in.
                const pin = await this.get_support_pin(stream.uid);
                return stream.success<Users.Endpoints.GetSupportPin.Result>({
                    data: {
                        message: "Successfully retrieved your support PIN.",
                        pin: pin,
                    }
                });
            }
        });

        // Support.
        this.server.endpoint({
            method: "POST",
            endpoint: "/volt/support/submit",
            content_type: "application/json",
            rate_limit: [
                "global",
                {
                    interval: 3600 * 24,
                    limit: 5,
                },
            ],
            callback: async (stream: Stream) => {

                // Check recipient.
                if (!this.support_recipient) {
                    throw new ExternalError({
                        status: Status.unavailable_for_legal_reasons,
                        type: "NoSMTPSender", message: "This server does not have a SMTP sender configured."
                    });
                }

                // Get params.
                let params = stream.params as Record<string, any>;

                // When unauthenticated get contact params.
                let user: null | User = null, email: string, first_name: string, last_name: string;
                if (stream.uid == null) {
                    try {
                        email = stream.param("email");
                        first_name = stream.param("first_name");
                        last_name = stream.param("last_name");
                    } catch (err) {
                        return stream.error({ status: Status.bad_request, message: (err as Error).message });
                    }
                } else {
                    user = await this.get(stream.uid);
                    email = user.email;
                    first_name = user.first_name;
                    last_name = user.last_name;
                }

                // Create mail body.
                let body = "";
                const subject = params.subject || (params.type == null ? "Support" : `Support ${params.type}`);
                body += `<h1>${subject}</h1>`;
                if (params.subject) {
                    delete params.subject;
                }
                if (params.type) {
                    body += `<span style='font-weight: bold'>Type</span>: ${params.type}<br>`;
                    delete params.type;
                }
                if (user) {
                    body += `<span style='font-weight: bold'>UID</span>: ${stream.uid}<br>`;
                    body += `<span style='font-weight: bold'>User</span>: ${user.username}<br>`;
                }
                body += `<span style='font-weight: bold'>Email</span>: ${email}<br>`;
                body += `<span style='font-weight: bold'>First Name</span>: ${first_name}<br>`;
                body += `<span style='font-weight: bold'>Last Name</span>: ${last_name}<br>`;
                if (stream.uid != null) {
                    const support_pin = await this.get_support_pin(stream.uid);
                    body += `<span style='font-weight: bold'>Support PIN</span>: ${support_pin} <span style='color: green'>verified</span><br>`;
                } else if (params.support_pin) {
                    body += `<span style='font-weight: bold'>Support PIN</span>: ${params.support_pin} <span style='color: red'>not yet verified</span><br>`;
                    delete params.support_pin;
                } else {
                    body += `<span style='font-weight: bold'>Support PIN</span>: Unknown<br>`;
                }
                if (params.summary) {
                    body += `<br><span style='font-weight: bold'>Summary</span>:<br>${params.summary}<br>`;
                    delete params.summary;
                }
                if (params.detailed) {
                    body += `<br><span style='font-weight: bold'>Detailed</span>:<br>${params.detailed}<br>`;
                    delete params.detailed;
                }
                Object.keys(params).forEach((key) => {
                    if (key !== "attachments" && key !== "recipient") {
                        body += `<br><span style='font-weight: bold'>${key}</span>: ${params[key]}<br>`;
                    }
                });

                // Attachments.
                body += "<br>";
                let attachments: MailAttachment[] = [];
                const MAX_ATTACHMENTS = 5;
                const MAX_BYTES = 5 * 1024 * 1024; // 5 MB per file
                if (params.attachments) {
                    const keys = Object.keys(params.attachments);
                    if (keys.length > MAX_ATTACHMENTS) {
                        throw new ExternalError({ status: Status.bad_request, type: "TooManyAttachments", message: `Too many attachments. Max is ${MAX_ATTACHMENTS}.` });
                    }
                    for (const key of keys) {
                        const raw = (params.attachments as Record<string, string>)[key];
                        const is_base64 = /^[A-Za-z0-9+/]+={0,2}$/.test(raw) && (raw.length % 4 === 0);
                        const buf = Buffer.from(raw, is_base64 ? "base64" : "utf-8");
                        if (buf.length > MAX_BYTES) {
                            throw new ExternalError({ status: Status.bad_request, type: "AttachmentTooLarge", message: `${key} too large, maximum size is 5 MB.` });
                        }
                        attachments.push({ filename: key, content: buf });
                    }
                }

                // Send email.
                await this.server.send_mail({
                    // Only send to support_recipient since we dont want users/people to send emails to random people.
                    recipients: [this.support_recipient],
                    subject: subject,
                    body: body,
                    attachments: attachments,
                });

                // Sign in.
                return stream.success<Users.Endpoints.SubmitSupport.Result>({
                    data: { message: "Successfully sent your request." }
                });
            }
        });

    }

    // ---------------------------------------------------------
    // Public methods.
    // ---------------------------------------------------------

    /**
     * Check if a uid exists.
     * @param uid The user ID to check.
     * @returns True if a user with the given uid exists.
     */
    async uid_exists(uid: string): Promise<boolean> {
        return await this._users_db.exists({ uid });
    }

    /**
     * Check if a username exists.
     * @returns Returns a boolean indicating whether the username exists or not.
     * @param username The username to check.
     * @example
     * const exists = await server.users.username_exists("someusername");
     */
    async username_exists(username: string): Promise<boolean> {
        return await this._users_db.exists({ username });
    }

    /**
     * Check if an email exists.
     * @returns Returns a boolean indicating whether the email exists or not.
     * @param email The email to check.
     * @example
     * const exists = await server.users.email_exists("some@email.com");
     */
    async email_exists(email: string): Promise<boolean> {
        return await this._users_db.exists({ email });
    }

    /**
     * Check if a user account is activated.
     * @returns Returns a boolean indicating whether the account is activated or not.
     * @param uid The id of the user.
     * @example
     * const activated = await server.users.is_activated("0");
     */
    async is_activated(uid: string): Promise<boolean> {
        return (await this.get(uid)).is_activated === true;
    }

    /**
     * Set the activated status of a user account.
     * @param uid The user id.
     * @param is_activated The boolean with the new activated status.
     * @example
     * await server.users.set_activated("1", true);
     */
    async set_activated(uid: string, is_activated: boolean): Promise<void> {
        await this._sys_set(uid, { is_activated: is_activated });
    }

    /**
     * Create a user account. Only the hashed password will be saved.
     * @returns Returns the uid of the newly created user.
     * @param first_name The user's first name.
     * @param last_name The user's last name.
     * @param username The username of the new account.
     * @param email The email of the new account.
     * @param password The password of the new account.
     * @param phone_number The phone number of the user account.
     * @param is_activated Whether the account should be set to activated; by default `!Server.enable_account_activation`.
     * @example
     * const uid = await server.users.create({
     *   first_name: "John",
     *   last_name: "Doe",
     *   username: "johndoe",
     *   email: "johndoe@email.com",
     *   password: "HelloWorld!"
     * });
     */
    async create({
        first_name,
        last_name,
        username,
        email,
        password,
        phone_number = "",
        is_activated = undefined,
        _check_username_email = false,
    }: {
        first_name: string;
        last_name: string;
        username: string;
        email: string;
        password: string;
        phone_number?: string;
        is_activated?: boolean;
        _check_username_email?: boolean;
    }): Promise<string> {
        // Verify params.
        vlib.schema.validate(arguments[0], {
            unknown: false,
            throw: true,
            schema: {
                first_name: "string",
                last_name: "string",
                username: "string",
                email: "string",
                password: "string",
                phone_number: { type: "string", required: false },
                is_activated: { type: "boolean", required: false },
                _check_username_email: { type: "boolean", required: false },
            }
        })

        // Check if username & email already exist.
        if (_check_username_email) {
            if (await this.username_exists(username)) {
                throw new ExternalError({
                    type: "UsernameAlreadyExists",
                    message: `Username "${username}" is already registered.`,
                    status: Status.bad_request,
                    invalid_fields: { "username": "Username is already registered" },
                });
            }
            if (await this.email_exists(email)) {
                throw new ExternalError({
                    type: "EmailAlreadyExists",
                    message: `Email "${email}" is already registered.`,
                    status: Status.bad_request,
                    invalid_fields: { "email": "Email is already registered" }
                });
            }
        }

        // Generate a uid.
        const uid = await this._generate_uid();

        // Create the user.
        const user: User = {
            uid,
            first_name,
            last_name,
            username,
            email,
            password: await this._hash_password(password),
            phone_number,
            created_at: Date.now(),
            api_key: undefined, // api key can be undefined, it doesnt have to be set.
            support_pin: this._generate_code(8),
            is_activated: is_activated ?? !this.enable_account_activation,
        };
        await this._users_db.set({ uid }, user);

        // Response.
        return uid;
    }

    /**
     * Delete a user account and associated data.
     * @param uid The user id.
     * @example
     * await server.users.delete("0");
     */
    async delete(uid: string): Promise<void> {
        await this._users_db.delete_many({ uid });
        await this._tokens_db.delete_many({ uid });
        await this._2fa_tokens_db.delete_many({ uid });
        await this.public.delete_many({ uid });
        await this.protected.delete_many({ uid });
        await this.private.delete_many({ uid });
        if (this.server.payments !== undefined) {
            await this.server.payments._delete_user(uid);
        }
        const res = this.server.on_delete_user({ uid });
        if (res instanceof Promise) {
            await res;
        }
    }

    /**
     * Set a user's first name. Throws if uid does not exist.
     * @param uid The user id.
     * @param first_name The new first name.
     * @example
     * await server.users.set_first_name("1", "John");
     */
    async set_first_name(uid: string, first_name: string): Promise<void> {
        await this._sys_set(uid, { first_name });
    }

    /**
     * Set a user's last name. Throws if uid does not exist.
     * @param uid The user id.
     * @param last_name The new last name.
     * @example
     * await server.users.set_last_name("1", "Doe");
     */
    async set_last_name(uid: string, last_name: string): Promise<void> {
        await this._sys_set(uid, { last_name });
    }

    /**
     * Set a user's username. Throws if uid does not exist.
     * @param uid The user id.
     * @param username The new username.
     * @example
     * await server.users.set_username("1", "newusername");
     */
    async set_username(uid: string, username: string): Promise<void> {
        if (await this.username_exists(username)) {
            throw Error(`Username "${username}" already exists.`);
        }
        await this._sys_set(uid, { username });
    }

    /**
     * Set a user's email. Throws if uid does not exist.
     * @param uid The user id.
     * @param email The new email.
     * @example
     * await server.users.set_email("1", "new@email.com");
     */
    async set_email(uid: string, email: string): Promise<void> {
        if (await this.email_exists(email)) {
            throw Error(`Email "${email}" already exists.`);
        }
        await this._sys_set(uid, { email });
    }

    /**
     * Set a user's password. Throws on invalid input or unknown uid.
     * @param uid The user id.
     * @param password The new password.
     * @example
     * await server.users.set_password("1", "XXXXXX");
     */
    async set_password(uid: string, password: string, verify_password?: string): Promise<void> {
        const { error } = this._verify_new_pass(password, verify_password ?? password);
        if (error) {
            throw Error(`Invalid password "${password}": ${error}.`);
        }
        await this._sys_set(uid, { password: await this._hash_password(password) });
    }

    /**
     * Update an existing user object.
     * 
     * This function only updates the passed user attributes, unpresent attributes will not be deleted.
     * 
     * If the uid does not exist an `Error` will be thrown.
     * 
     * A password will automatically be hashed if passed.
     * 
     * Updating the API key through this function is not allowed (wont work).
     * 
     * @warning Does not upsert documents.
     */
    async set(uid: string, data: {
        first_name?: User["first_name"];
        last_name?: User["last_name"];
        phone_number?: User["phone_number"];
        is_activated?: User["is_activated"];
        password?: User["password"];
        username?: User["username"];
        email?: User["email"];
    }): Promise<void> {
        let old_data;
        const set_data: Record<string, any> = {};
        for (const key of Object.keys(data)) {
            switch (key) {
                case "first_name":
                case "last_name":
                case "phone_number":
                    if (!data[key]) {
                        throw Error(`Invalid ${key.replaceAll("_", " ")} "${data[key]}".`);
                    }
                    set_data[key] = data[key];
                    break;
                case "is_activated":
                    set_data[key] = data[key];
                    break;
                case "password": {
                    if (!data[key]) {
                        throw Error(`Password may not be empty.`);
                    }
                    const { error } = this._verify_new_pass(data[key], data[key]);
                    if (error) {
                        throw Error(`Invalid password "${data[key]}": ${error}.`);
                    }
                    set_data[key] = await this._hash_password(data[key]);
                    break;
                }
                case "username":
                    if (!data.username) {
                        throw Error(`Invalid username "${data.username}".`);
                    }
                    if (old_data === undefined) {
                        old_data = await this.get(uid);
                    }
                    if (old_data.username !== data.username) {
                        if (await this.username_exists(data.username)) {
                            throw Error(`Username "${data.username}" already exists.`);
                        }
                        set_data[key] = data[key];
                    }
                    break;
                case "email":
                    if (!data.email) {
                        throw Error(`Invalid email "${data.email}".`);
                    }
                    if (old_data === undefined) {
                        old_data = await this.get(uid);
                    }
                    if (old_data.email !== data.email) {
                        if (await this.email_exists(data.email)) {
                            throw Error(`Email "${data.email}" already exists.`);
                        }
                        set_data[key] = data[key];
                    }
                    break;
                default:
                    // delete all other keys, such as uid, api_key etc.
                    delete set_data[key];
                    break;
            }
        }
        await this._users_db.set({ uid }, set_data, { upsert: false });
    }
    /**
     * Insert new data into an EXISTING user.
     * @warning Does not upsert documents.
     */
    private async _sys_set(uid: string, data: Record<string, any>): Promise<void> {
        await this._users_db.set({ uid }, data, { upsert: false });
    }


    /**
     * Get a user by uid. Throws if the uid does not exist.
     * @returns Returns a User object.
     * @param uid The user id.
     * @throws {Collection.NotFoundError} If the user id does not exist.
     * @example
     * const user = await server.users.get("0");
     */
    async get(uid: string): Promise<User> {
        return await this._users_db.load({ uid });
    }

    /**
     * Get a user by username. Throws if the username does not exist.
     * @returns Returns a User object.
     * @param username The username of the user to fetch.
     * @throws {Collection.NotFoundError} If the username does not exist.
     * @example
     * const user = await server.users.get_by_username("myusername");
     */
    async get_by_username(username: string): Promise<User> {
        return await this._users_db.load({ username });
    }

    /**
     * Get a user by email. Throws if the email does not exist.
     * @returns Returns a User object.
     * @param email The email of the user to fetch.
     * @throws {Collection.NotFoundError} If the email does not exist.
     * @example
     * const user = await server.users.get_by_email("my@email.com");
     */
    async get_by_email(email: string): Promise<User> {
        return await this._users_db.load({ email });
    }

    /**
     * Get a user by API key. Throws if invalid.
     * @returns Returns a User object.
     * @param api_key The API key of the user to fetch.
     * @example
     * const user = await server.users.get_by_api_key("XXXXXX");
     */
    async get_by_api_key(api_key: string): Promise<User> {
        const uid = this.get_uid_by_api_key(api_key);
        if (!uid) throw new Error("Unable to find a user by api key.");
        const user = await this.get(uid);
        const ok = await this.verify_api_key_by_uid(uid, api_key);
        if (!ok) throw new Error("Unable to find a user by api key.");
        return user;

        // DELETED Cannot search by re-hash ofcourse.
        // const data = await this._users_db.find({ api_key: await this._hash_password(api_key) });
        // if (data == null) { throw new Error(`Unable to find a user by api key "${api_key}".`); }
        // return data;
    }

    /**
     * Get a user by token. Throws if invalid.
     * @returns Returns a User object.
     * @param token The authentication token of the user to fetch.
     * @example
     * const user = await server.users.get_by_token("XXXXXX");
     */
    async get_by_token(token: string): Promise<User> {
        const uid = this.get_uid_by_token(token);
        if (!uid) throw new Error("Unable to find a user by token.");
        const ok = await this.verify_token_by_uid(uid, token);
        if (!ok) throw new Error("Unable to find a user by token.");
        return await this.get(uid);

        // DELETED Cannot search by re-hash ofcourse.
        // const data = await this._tokens_db.find({ token: await this._hash_password(token) });
        // if (data == null) { throw new Error(`Unable to find a user by token "${token}".`); }
        // return await this.get(data.uid);
    }

    /**
     * Get a uid by username.
     * @returns Returns the uid of the username, or undefined if not found.
     * @param username The username of the uid to fetch.
     * @example
     * const uid = await server.users.get_uid("myusername");
     */
    async get_uid(username: string): Promise<string | undefined> {
        try {
            return (await this.get_by_username(username)).uid;
        } catch (e) {
            return undefined;
        }
    }

    /**
     * Get a uid by username.
     * @returns Returns the uid of the username, or undefined if not found.
     * @param username The username of the uid to fetch.
     * @example
     * const uid = await server.users.get_uid_by_username("myuser");
     */
    async get_uid_by_username(username: string): Promise<string | undefined> {
        try {
            return (await this.get_by_username(username)).uid;
        } catch (e) {
            return undefined;
        }
    }

    /**
     * Get a uid by email.
     * @returns Returns the uid of the email, or undefined if not found.
     * @param email The email of the uid to fetch.
     * @example
     * const uid = await server.users.get_uid_by_email("my@email.com");
     */
    async get_uid_by_email(email: string): Promise<string | undefined> {
        try {
            return (await this.get_by_email(email)).uid;
        } catch (e) {
            return undefined;
        }
    }

    /**
     * Get a uid by API key.
     * @returns Returns the uid for the API key, or undefined if not valid.
     * @param api_key The API key to parse.
     * @example
     * const uid = server.users.get_uid_by_api_key("XXXXXXXXXX");
     */
    get_uid_by_api_key(api_key: string): string | undefined {
        return this._parse_uid_from_token_api_key(api_key, "ak_");
    }

    /**
     * Get a uid by token.
     * @returns Returns the uid for the token, or undefined if not valid.
     * @param token The token to parse.
     * @example
     * const uid = server.users.get_uid_by_token("XXXXXXXXXX");
     */
    get_uid_by_token(token: string): string | undefined {
        return this._parse_uid_from_token_api_key(token, "tk_");
    }

    /**
     * Get a user's support pin by uid.
     * @returns Returns the support PIN string.
     * @param uid The user id.
     * @example
     * const pin = await server.users.get_support_pin("1");
     */
    async get_support_pin(uid: string): Promise<string> {
        return (await this.get(uid)).support_pin;
    }

    /**
     * Generate an API key for a user and store its hash. Overwrites existing keys.
     * @returns Returns the API key string (plaintext).
     * @param uid The user id.
     * @example
     * const api_key = await server.users.generate_api_key("0");
     */
    async generate_api_key(uid: string): Promise<string> {
        const api_key = this._generate_api_key(uid);
        await this._sys_set(uid, { api_key: await this._hash_password(api_key) });
        return api_key;
    }

    /**
     * Check if a user has a generated API key.
     * @returns Returns a boolean indicating whether the user has an API key.
     * @param uid The user id.
     * @throws {Collection.NotFoundError} If the user id does not exist.
     * @example
     * const has_api_key = await server.users.has_api_key("0");
     */
    async has_api_key(uid: string): Promise<boolean> {
        const data = await this._users_db.load({ uid }, {
            projection: { api_key: 1 }
        });
        return data.api_key != null && data.api_key.length > 0;
    }

    /**
     * Revoke the API key of a user.
     * @param uid The user id.
     * @example
     * await server.users.revoke_api_key("0");
     */
    async revoke_api_key(uid: string): Promise<void> {
        await this._users_db.save(
            { uid },
            { $unset: { api_key: "" } },
            { upsert: false },
        );
    }

    /**
     * Verify a plaintext password.
     * @returns Returns a boolean indicating whether the verification was successful.
     * @param uid The user id.
     * @param password The plaintext password.
     * @example
     * const success = await server.users.verify_password("1", "XXXXXX");
     */
    async verify_password(uid: string, password: string): Promise<boolean> {
        try {
            const user = await this.get(uid);
            return user.uid != null && await this._verify_password(password, user.password);
        } catch (err) {
            return false;
        }
    }

    /**
     * Verify a plaintext API key.
     * @returns Returns a boolean indicating whether the verification was successful.
     * @param api_key The api key to verify.
     * @example
     * const success = await server.users.verify_api_key("XXXXXX");
     */
    async verify_api_key(api_key: string): Promise<boolean> {
        return await this.verify_api_key_by_uid(this.get_uid_by_api_key(api_key), api_key);
    }

    /**
     * Verify a plaintext API key by uid.
     * @returns Returns a boolean indicating whether the verification was successful.
     * @param uid The user id.
     * @param api_key The api key to verify.
     * @example
     * const success = await server.users.verify_api_key_by_uid("1", "XXXXXX");
     */
    async verify_api_key_by_uid(uid: string | undefined | null, api_key: string): Promise<boolean> {
        try {
            if (!uid) return false;
            const user = await this.get(uid);
            return user.uid != null && user.api_key != null && user.api_key?.length > 0
                && await this._verify_password(api_key, user.api_key);
        } catch (err) {
            return false;
        }
    }

    /**
     * Verify a plaintext token.
     * @returns Returns a boolean indicating whether the verification was successful.
     * @param token The token to verify.
     * @example
     * const success = await server.users.verify_token("XXXXXX");
     */
    async verify_token(token: string): Promise<boolean> {
        return await this.verify_token_by_uid(this.get_uid_by_token(token), token);
    }

    /**
     * Verify a plaintext token by uid.
     * @returns Returns a boolean indicating whether the verification was successful.
     * @param uid The user id.
     * @param token The token to verify.
     * @example
     * const success = await server.users.verify_token_by_uid("1", "XXXXXX");
     */
    async verify_token_by_uid(uid: string | undefined | null, token: string): Promise<boolean> {
        try {
            if (!uid) return false;
            const correct_token = await this._tokens_db.load({ uid });
            return (
                correct_token != null &&
                correct_token.token != null &&
                correct_token.active !== false &&
                Date.now() < correct_token.expiration &&
                await this._verify_password(token, correct_token.token)
            );
        } catch (err) {
            if (err instanceof Collection.NotFoundError) {
                return false;
            }
            throw err;
        }
    }

    /**
     * Verify a 2FA code by user id/email key.
     * @param uid The UID or email used when creating the 2FA token.
     * @param code The 2FA code.
     * @returns Returns undefined on success, otherwise a string describing the error.
     * @example
     * await server.users.verify_2fa("1", "123456");
     */
    async verify_2fa(uid: string, code: string): Promise<string | undefined> {
        try {
            const auth = await this._2fa_tokens_db.load({ uid });
            const now = Date.now();
            if (now >= auth.expiration) {
                await this._deactivate_2fa_token(uid);
                return "The 2FA code has expired.";
            }
            const status = (
                auth != null &&
                auth.code != null &&
                now < auth.expiration &&
                auth.code == code &&
                auth.active !== false
            );
            if (status === false) {
                return "Invalid 2FA code.";
            }
            await this._deactivate_2fa_token(uid); // single use.
            return;
        } catch (err) {
            if (err instanceof Collection.NotFoundError) {
                return "Invalid 2FA code.";
            }
            this.server.log.error(`${err}.`);
            return "Unknown error.";
        }
    }

    /**
     * Send a 2FA code to a user by user id.
     * By default the 2FA code will be valid for 5 minutes.
     * The mail body is generated via `Server.on_2fa_mail({code, username, email, date, ip, device})`.
     * @returns Returns a promise that resolves when the 2FA mail has been sent.
     * @param uid The user id (or use _email with internal flow).
     * @param stream The stream object from the client request.
     * @param expiration The amount of seconds in which the code will expire.
     * @example
     * await server.users.send_2fa({ uid: "0", stream });
     */
    async send_2fa({
        uid,
        stream,
        expiration = 300,
        _user_agent = undefined,
        _username = undefined,
        _email = undefined,
    }: {
        uid: string;
        stream: Stream;
        expiration?: number;
        _user_agent?: string;
        _username?: string;
        _email?: string;
    }): Promise<void> {

        // Generate 2fa and get user email.
        let code;
        if (_username == null && _email == null) {
            code = await this._create_2fa_token(uid, expiration);
            const user = await this.get(uid);
            _username = user.username;
            _email = user.email;
        } else {
            code = await this._create_2fa_token(_email!, expiration);
        }

        // Get device.
        const user_agent = _user_agent ?? (stream.headers["user-agent"] ?? "Unknown");

        // Replace body.
        if (this.server.on_2fa_mail === undefined) {
            throw Error("Define server callback \"Server.on_2fa_mail\" to generate the HTML mail body.");
        }
        let mail = this.server.on_2fa_mail({
            code: code,
            username: _username!,
            email: _email!,
            date: new Date().toUTCString(),
            ip: stream.ip,
            device: user_agent,
        });
        let body = mail, subject: string | undefined;
        if (mail instanceof Mail.MailElement) {
            body = mail.html();
            subject = mail.subject();
        }

        // Send mail.
        await this.server.send_mail({
            recipients: [_email!],
            subject: subject ?? "Two Factor Authentication Code",
            body,
        });
    }

    /**
     * List all users.
     * @returns An array of User objects.
     */
    async list(): Promise<User[]> {
        return await this._users_db.list_all();
    }

}


/** Nested types for the {@link User} class. */
export namespace Users {

    /** Constructor options. */
    export interface Opts {
        /** The number of seconds a sign-in token will be valid. */
        token_expiration?: number;
        /** Enable 2FA for user authentication. */
        enable_2fa?: boolean;
        /** Enable account activation by email after a user signs up. */
        enable_account_activation?: boolean;
        /** The email address to send support requests to, defaults to {@link Server.Opts.smtp.sender} if defined */
        support_recipient?: string;
    }

    /** The types for the frontend endpoints. */
    export namespace Endpoints {

        // ---------------------------------------------
        // Users.
        // ---------------------------------------------

        /** The get user endpoint. */
        export namespace GetUser {
            /** The request params. */
            export interface Params {
                // must be authenticated.
            }
            /** The result interface for a **successful** request. */
            export type Result = User.Frontend;
        }

        /** The update user endpoint. */
        export namespace UpdateUser {
            /** The request params. */
            export interface Params {
                first_name?: string;
                last_name?: string;
                phone_number?: string;
                username?: string;
                email?: string;
            }
            /** The result interface for a **successful** request. */
            export interface Result {
                message: string;
            };
        }

        /** The activate user endpoint. */
        export namespace ActivateUser {
            /** The request params. */
            export interface Params {
                code: string;
            }
            /** The result interface for a **successful** request. */
            export interface Result {
                message: string;
            };
        }

        /** The change password endpoint. */
        export namespace ChangePassword {
            /** The request params. */
            export interface Params {
                current_password: string;
                password: string;
                verify_password: string;
            }
            /** The result interface for a **successful** request. */
            export interface Result {
                message: string;
            };
        }

        /** The delete user endpoint. */
        export namespace DeleteUser {
            /** The request params. */
            export interface Params {
            }
            /** The result interface for a **successful** request. */
            export interface Result {
                message: string;
            };
        }

        /** The generate api key endpoint. */
        export namespace GenerateAPIKey {
            /** The request params. */
            export interface Params {
            }
            /** The result interface for a **successful** request. */
            export interface Result {
                message: string;
                api_key: string;
            };
        }
        
        /** The has api key endpoint. */
        export namespace HasAPIKey {
            /** The request params. */
            export interface Params {
            }
            /** The result interface for a **successful** request. */
            export interface Result {
                message: string;
                has_api_key: boolean;
            };
        }

        /** The revoke api key endpoint. */
        export namespace RevokeAPIKey {
            /** The request params. */
            export interface Params {
            }
            /** The result interface for a **successful** request. */
            export interface Result {
                message: string;
            };
        }

        /** JSON values for LoadUserData data field etc. */
        export type JsonValue = string | number | boolean | null | JsonArray | JsonObject;
        export type JsonArray = Array<JsonValue>;
        export type JsonObject = {
            [key: string]: JsonValue;
        }
        export const JsonValueSchemaType = [
            "string",
            "number",
            "boolean",
            "null",
            "array",
            "object"
        ] as const;

        /** The load public user data endpoint. */
        export namespace LoadUserData {
            /** The request params. */
            export interface Params {
                /**
                 * The document query.
                 * @note The object form query may not include system
                 *       reserved fields `_id`, `uid`, `query` and `data`.
                 */
                query: string | Record<string, any>;
                /**
                 * The default value for document field `data`,
                 * see {@link Collection.LoadOpts.default}.
                 */
                default?: JsonValue;
            }
            /** The result interface for a **successful** request. */
            export interface Result {
                message: string;
                data: JsonValue;
            };
        }

        /** The set public user data endpoint. */
        export namespace SetUserData {
            /** The request params. */
            export interface Params {
                /**
                 * The document query.
                 * @note The object form query may not include system
                 *       reserved fields `_id`, `uid`, `query` and `data`.
                 */
                query: string | Record<string, any>;
                /** The data to save. */
                data: JsonValue;
            }
            /** The result interface for a **successful** request. */
            export interface Result {
                message: string;
            };
        }

        /** The delete public user data endpoint. */
        export namespace DeleteUserData {
            /** The request params. */
            export interface Params {
                /**
                 * The document query.
                 * @note The object form query may not include system
                 *       reserved fields `_id`, `uid`, `query` and `data`.
                 */
                query: string | Record<string, any>;
            }
            /** The result interface for a **successful** request. */
            export interface Result {
                message: string;
            };
        }

        /** The load protected user data endpoint. */
        export namespace LoadProtectedUserData {
            /** The request params. */
            export interface Params {
                /**
                 * The document query.
                 * @note The object form query may not include system
                 *       reserved fields `_id`, `uid`, `query` and `data`.
                 */
                query: string | Record<string, any>;
                /** The default value for document field `data`. */
                default?: JsonValue;
            }
            /** The result interface for a **successful** request. */
            export interface Result {
                message: string;
                data: JsonValue;
            };
        }

        // ---------------------------------------------
        // Authentication.
        // ---------------------------------------------

        /** The sign in endpoint. */
        export namespace SignIn {
            /** The request params. */
            export interface Params {
                username: string,
                email: string,
                password: string,
                code?: string,
            }
            /** The result interface for a **successful** request. */
            export interface Result {
                message: string;
            }
        }

        /** The sign up endpoint. */
        export namespace SignUp {
            /** The request params. */
            export interface Params {
                username: string,
                email: string,
                first_name: string,
                last_name: string,
                password: string,
                verify_password: string,
                phone_number?: string,
                code?: string,
            }
            /** The result interface for a **successful** request. */
            export interface Result {
                message: string;
            }
        }

        /** The sign out endpoint. */
        export namespace SignOut {
            /** The request params. */
            export interface Params { }
            /** The result interface for a **successful** request. */
            export interface Result {
                message: string;
            }
        }

        /** The send 2fa endpoint. */
        export namespace Send2FA {
            /** The request params. */
            export interface Params {
                email: string;
            }
            /** The result interface for a **successful** request. */
            export interface Result {
                message: string;
            }
        }

        /** The send forgot password endpoint. */
        export namespace ForgotPassword {
            /** The request params. */
            export interface Params {
                email: string,
                password: string,
                verify_password: string,
                code: string,
            }
            /** The result interface for a **successful** request. */
            export interface Result {
                message: string;
            }
        }

        // ---------------------------------------------
        // Support.
        // ---------------------------------------------

        /** The submit support endpoint. */
        export namespace SubmitSupport {
            /** The request params. */
            export interface Params {
                /** The support subject. */
                subject?: string;
                /** The support type for internal purpose only. */
                type?: string;
                /** The user's support pin. This parameter will automatically be assigned when the user is authenticated. */
                support_pin?: string;
                /** The user's email. This parameter will automatically be assigned when the user is authenticated. */
                email?: string;
                /** The user's first name. This parameter will automatically be assigned when the user is authenticated. */
                first_name?: string;
                /** The user's last name. This parameter will automatically be assigned when the user is authenticated. */
                last_name?: string;
                /** A summary of the support request. */
                summary?: string;
                /** A detailed description of the support request. */
                detailed?: string;
                /** An object with attachments, assigned as `{file_name: raw_file_data}`. */
                attachments?: { [fileName: string]: any };
                // Note that users can not specify a `recipient` field since this would allow them to send emails to everyone.
            }
            /** The result interface for a **successful** request. */
            export interface Result {
                message: string;
            }
        }

        /** The get support pin endpoint. */
        export namespace GetSupportPin {
            /** The request params. */
            export interface Params { }
            /** The result interface for a **successful** request. */
            export interface Result {
                message: string;
                pin: string;
            }
        }
    }
}