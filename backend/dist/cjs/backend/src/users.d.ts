/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh.
 */
import { Mail } from "./plugins/mail/mail.js";
import { Stream } from "./stream.js";
import { Server } from "./server.js";
import { Collection } from "./database/collection.js";
import { Request } from "../../frontend/src/modules/request.js";
/**
 * The user object / document.
 * @nav Server
 * @docs
 */
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
export declare namespace User {
    /**
     * The frontend representation of a user.
     * @docs
     */
    type Frontend = {
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
    /**
     * The token object / document.
     * @docs
     */
    type Token = {
        /** The user id. */
        uid: string;
        /** Expiration unix timestamp */
        expiration: number;
        /** The hashed token. */
        token: string;
        /** Is token still active. */
        active: boolean;
    };
    /**
     * The token object / document.
     * @docs
     */
    type TwoFactorAuthToken = {
        /** The user id. */
        uid: string;
        /** Expiration unix timestamp */
        expiration: number;
        /** The correct 2fa code. */
        code: string;
        /** Is token still active. */
        active: boolean;
    };
}
/**
 * The users class, used for user management, authentication, and user data storage.
 * @note This class is accessible via `Server.users`.
 * @nav Server
 * @docs
 */
export declare class Users {
    /**
     * Number of random characters after `<prefix>_<uid>_`.
     * @warning If you change this, also update:
     *  - {@link Users.LEGACY_TOKEN_SUFFIX_LENS} to include old size(s).
     *  - Generators {@link _generate_api_key} and {@link _generate_token}.
     *  - Parser {@link _parse_uid_from_token_api_key}.
     */
    private static readonly TOKEN_SUFFIX_LEN;
    /** Accepted legacy suffix lengths; add old sizes here when rotating. */
    private static readonly LEGACY_TOKEN_SUFFIX_LENS;
    /**
     * Allowed characters for the random suffix.
     * @warning MUST NOT include `_` (delimiter). ASCII only for fast-path validation.
     */
    private static readonly TOKEN_SUFFIX_CHARSET;
    /**
     * UID length used by the generator.
     * @warning If you change this, add the old value to {@link Users.LEGACY_UID_LENGTHS}.
     */
    private static readonly UID_LENGTH;
    /** Accepted legacy UID lengths; add old sizes here when rotating. */
    private static readonly LEGACY_UID_LENGTHS;
    /**
     * UID character set (ASCII). MUST NOT include `_`.
     */
    private static readonly UID_CHARSET;
    /**
     * Build an ASCII allow table for fast membership checks.
     * Index is charCode (0..127), value is 1 if allowed else 0.
     */
    private static _build_ascii_allow;
    /** ASCII allow table for token suffix validation (built from TOKEN_SUFFIX_CHARSET). */
    private static readonly TOKEN_SUFFIX_ALLOW;
    /** ASCII allow table for UID validation (built from UID_CHARSET). */
    private static readonly UID_ALLOW;
    /** The parent server instance. */
    private server;
    /** The recipient email for support submit emails, defaults to `Server.smtp_sender`. */
    private support_recipient?;
    /** The avg wait time when sending 2FA codes. */
    private avg_send_2fa_time;
    /** The database collection for token documents. */
    private _tokens_db;
    /** The database collection for 2fa token documents. */
    private _2fa_tokens_db;
    /** The database collection for user documents. */
    private _users_db;
    /** Enable 2FA for user sign in. */
    private enable_2fa;
    /** Enable 2FA account activation for user sign up. */
    private enable_account_activation;
    /** The token expiration in seconds */
    private token_expiration;
    /** Database collection for public (read:public, write:public) user documents. */
    public: Collection<{
        uid: string;
        query?: string;
        data: Users.Endpoints.JsonValue;
    }>;
    /** Database collection for protected (read:public, write:private) user documents. */
    protected: Collection<{
        uid: string;
        query?: string;
        data: Users.Endpoints.JsonValue;
    }>;
    /** Database collection for private (read:private, write:private) user documents. */
    private: Collection<{
        uid: string;
        query?: string;
        data: Users.Endpoints.JsonValue;
    }>;
    /** Construct the users manager. */
    constructor(opts: Users.Opts & {
        _server: Server;
    });
    /** Generate a code. */
    private _generate_code;
    /**
     * Generate a crypto str.
     * @warning ENSURE this does not add `_` to the charset, as this is used as a delimiter for tokens/api keys.
     */
    private _generate_crypto_str;
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
    private _crypto_scrypt;
    /** Hash a password. */
    private _hash_password;
    /** Verify a plain password vs stored hashed password. */
    private _verify_password;
    /** Generate a unique user ID. */
    private _generate_uid;
    /** Generate an API key. Format: `ak_<uid>_<suffix>` */
    private _generate_api_key;
    /** Generate a token. Format: `tk_<uid>_<suffix>` */
    private _generate_token;
    /**
     * Parse the uid from `<prefix>_<uid>_<suffix>`, where prefix is `ak_` or `tk_`,
     * `<uid>` passes {@link Users.is_valid_uid}, and `<suffix>`:
     *  - length equals {@link Users.TOKEN_SUFFIX_LEN} or a legacy size; and
     *  - every char is in {@link Users.TOKEN_SUFFIX_CHARSET} (ASCII).
     *
     * @warning If you change suffix length, add old sizes to
     * {@link Users.LEGACY_TOKEN_SUFFIX_LENS}. If you change charset, update
     * {@link Users.TOKEN_SUFFIX_CHARSET} (this table rebuilds automatically).
     * If you change delimiters/prefixes, update this and the generators together.
     */
    private _parse_uid_from_token_api_key;
    /**
     * Validate a proposed new password against basic rules and confirmation.
     * @param pass The new password to validate.
     * @param verify_pass The repeated password to confirm.
     * @returns An object with optional error message and invalid_fields mapping.
     */
    private _verify_new_pass;
    /**
     * Generate and persist a new auth token for the given uid.
     * @param uid The user ID.
     * @returns The plaintext token string.
     */
    _create_token(uid: string): Promise<string>;
    /**
     * Deactivate the current token for the given uid.
     * @param uid The user ID.
     */
    _deactivate_token(uid: string): Promise<void>;
    /**
     * Create and store a short-lived 2FA token (code).
     * @param uid_or_email The uid or email key used for the 2FA record.
     * @param expiration Expiration in seconds from now.
     * @returns The generated 2FA code.
     */
    _create_2fa_token(uid_or_email: string, expiration: number): Promise<string>;
    /**
     * Deactivate a stored 2FA token by uid/email key.
     * @param uid_or_email The uid or email key used for the 2FA record.
     */
    _deactivate_2fa_token(uid_or_email: string): Promise<void>;
    /**
     * Perform authentication on a request.
     * @returns An object on refusal, undefined on success.
     */
    _authenticate(stream: Stream): Promise<{
        status: number;
        headers?: {
            [key: string]: string;
        };
        data: string;
    } | undefined>;
    /**
     * Sign a user in, set cookies, and optionally send the success response.
     * @param stream The request stream.
     * @param uid The authenticated user's ID.
     * @param opts Optional settings (e.g., send: false to skip sending the response).
     */
    _sign_in_response(stream: Stream, uid: string, opts?: {
        /** Send the response (defaults to true). */
        send: boolean;
    }): Promise<void>;
    /**
     * Create the auth token cookie on the response.
     * `T` is treated as a real authentication credential.
     *
     * @param stream The request stream.
     * @param token The token string or Token object.
     */
    _create_token_cookie(stream: Stream, token: string | User.Token): void;
    /**
     * Create user cookies (ID and activation flag).
     * These are user-state cookies, NOT auth credentials.
     *
     * @param stream The request stream.
     * @param uid The user ID, or invalid to clear.
     */
    _create_user_cookie(stream: Stream, uid: string | null): Promise<void>;
    /**
     * Create non-HttpOnly cookies with detailed user info for frontend usage.
     * These are UI convenience cookies only.
     *
     * @param stream The request stream.
     * @param uid The user ID.
     */
    _create_detailed_user_cookie(stream: Stream, uid: string): Promise<void>;
    /**
     * Clear all default auth and user-related cookies.
     *
     * @param stream The request stream.
     */
    _reset_cookies(stream: Stream): void;
    /** Build the base email layout used by the various transactional email builders. */
    private _2fa_mail_template;
    /**
     * Build the 2FA verification email content.
     */
    private set_default_2fa_event;
    /**
     * Initialize default authentication, user, and support endpoints.
     */
    _initialize({ worker, }?: {
        /** The `worker` flag passed to `Server.initialize()` */
        worker?: boolean;
    }): Promise<void>;
    /**
     * Validate a UID against ASCII charset and allowed lengths (current + legacy).
     * @dev_warning
     * If you change {@link Users.UID_CHARSET} or {@link Users.UID_LENGTH},
     * update {@link Users.LEGACY_UID_LENGTHS} for backward compatibility.
     *
     * @docs
     */
    is_valid_uid(uid: string): boolean;
    /**
     * Check if a uid exists.
     * @param uid The user ID to check.
     * @returns True if a user with the given uid exists.
     *
     * @docs
     */
    uid_exists(uid: string): Promise<boolean>;
    /**
     * Check if a username exists.
     * @returns Returns a boolean indicating whether the username exists or not.
     * @param username The username to check.
     * @example
     * const exists = await server.users.username_exists("someusername");
     *
     * @docs
     */
    username_exists(username: string): Promise<boolean>;
    /**
     * Check if an email exists.
     * @returns Returns a boolean indicating whether the email exists or not.
     * @param email The email to check.
     * @example
     * const exists = await server.users.email_exists("some@email.com");
     *
     * @docs
     */
    email_exists(email: string): Promise<boolean>;
    /**
     * Check if a user account is activated.
     * @returns Returns a boolean indicating whether the account is activated or not.
     * @param uid The id of the user.
     * @example
     * const activated = await server.users.is_activated("0");
     *
     * @docs
     */
    is_activated(uid: string): Promise<boolean>;
    /**
     * Set the activated status of a user account.
     * @param uid The user id.
     * @param is_activated The boolean with the new activated status.
     * @example
     * await server.users.set_activated("1", true);
     *
     * @docs
     */
    set_activated(uid: string, is_activated: boolean): Promise<void>;
    /**
     * Create a user account. Only the hashed password will be saved.
     * @returns Returns the uid of the newly created user.
     * @param first_name The user's first name.
     * @param last_name The user's last name.
     * @param username The username of the new account.
     * @param email The email of the new account.
     * @param password The password of the new account.
     * @param verify_password An optional second password input to check against the first input to ensure its the same.
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
     *
     * @docs
     */
    create({ first_name, last_name, username, email, password, verify_password, phone_number, is_activated, _check_username_email, }: {
        first_name: string;
        last_name: string;
        username: string;
        email: string;
        password: string;
        verify_password?: string;
        phone_number?: string;
        is_activated?: boolean;
        _check_username_email?: boolean;
    }): Promise<string>;
    /**
     * Delete a user account and associated data.
     * @param uid The user id.
     * @example
     * await server.users.delete("0");
     *
     * @docs
     */
    delete(uid: string): Promise<void>;
    /**
     * Set a user's first name. Throws if uid does not exist.
     * @param uid The user id.
     * @param first_name The new first name.
     * @example
     * await server.users.set_first_name("1", "John");
     *
     * @docs
     */
    set_first_name(uid: string, first_name: string): Promise<void>;
    /**
     * Set a user's last name. Throws if uid does not exist.
     * @param uid The user id.
     * @param last_name The new last name.
     * @example
     * await server.users.set_last_name("1", "Doe");
     *
     * @docs
     */
    set_last_name(uid: string, last_name: string): Promise<void>;
    /**
     * Set a user's username. Throws if uid does not exist.
     * @param uid The user id.
     * @param username The new username.
     * @example
     * await server.users.set_username("1", "newusername");
     *
     * @docs
     */
    set_username(uid: string, username: string): Promise<void>;
    /**
     * Set a user's email. Throws if uid does not exist.
     * @param uid The user id.
     * @param email The new email.
     * @example
     * await server.users.set_email("1", "new@email.com");
     *
     * @docs
     */
    set_email(uid: string, email: string): Promise<void>;
    /**
     * Set a user's password. Throws on invalid input or unknown uid.
     * @param uid The user id.
     * @param password The new password.
     * @example
     * await server.users.set_password("1", "XXXXXX");
     *
     * @docs
     */
    set_password(uid: string, password: string, verify_password?: string): Promise<void>;
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
     *
     * @docs
     */
    set(uid: string, data: {
        first_name?: User["first_name"];
        last_name?: User["last_name"];
        phone_number?: User["phone_number"];
        is_activated?: User["is_activated"];
        password?: User["password"];
        username?: User["username"];
        email?: User["email"];
    }): Promise<void>;
    /**
     * Insert new data into an EXISTING user.
     * @warning Does not upsert documents.
     */
    private _sys_set;
    /**
     * Get a user by uid. Throws if the uid does not exist.
     * @returns Returns a User object.
     * @param uid The user id.
     * @throws {Collection.NotFoundError} If the user id does not exist.
     * @example
     * const user = await server.users.get("0");
     *
     * @docs
     */
    get(uid: string): Promise<User>;
    /**
     * Get a user by username. Throws if the username does not exist.
     * @returns Returns a User object.
     * @param username The username of the user to fetch.
     * @throws {Collection.NotFoundError} If the username does not exist.
     * @example
     * const user = await server.users.get_by_username("myusername");
     *
     * @docs
     */
    get_by_username(username: string): Promise<User>;
    /**
     * Get a user by uid or username.
     * This function can be used if you have a variable which can be both.
     * Throws if the username does not exist.
     * @returns Returns a User object.
     * @param username The username of the user to fetch.
     * @throws {Collection.NotFoundError} If the username or uid does not exist.
     * @example
     * const user = await server.users.get_by_username("myusername");
     *
     * @docs
     */
    get_by_uid_or_username(uid_or_username: string): Promise<User>;
    /**
     * Get a user by email. Throws if the email does not exist.
     * @returns Returns a User object.
     * @param email The email of the user to fetch.
     * @throws {Collection.NotFoundError} If the email does not exist.
     * @example
     * const user = await server.users.get_by_email("my@email.com");
     *
     * @docs
     */
    get_by_email(email: string): Promise<User>;
    /**
     * Get a user by API key. Throws if invalid.
     * @returns Returns a User object.
     * @param api_key The API key of the user to fetch.
     * @example
     * const user = await server.users.get_by_api_key("XXXXXX");
     *
     * @docs
     */
    get_by_api_key(api_key: string): Promise<User>;
    /**
     * Get a user by token. Throws if invalid.
     * @returns Returns a User object.
     * @param token The authentication token of the user to fetch.
     * @example
     * const user = await server.users.get_by_token("XXXXXX");
     *
     * @docs
     */
    get_by_token(token: string): Promise<User>;
    /**
     * Get a uid by username.
     * @returns Returns the uid of the username, or undefined if not found.
     * @param username The username of the uid to fetch.
     * @example
     * const uid = await server.users.get_uid("myusername");
     *
     * @docs
     */
    get_uid(username: string): Promise<string | undefined>;
    /**
     * Get a uid by username.
     * @returns Returns the uid of the username, or undefined if not found.
     * @param username The username of the uid to fetch.
     * @example
     * const uid = await server.users.get_uid_by_username("myuser");
     *
     * @docs
     */
    get_uid_by_username(username: string): Promise<string | undefined>;
    /**
     * Get a uid by email.
     * @returns Returns the uid of the email, or undefined if not found.
     * @param email The email of the uid to fetch.
     * @example
     * const uid = await server.users.get_uid_by_email("my@email.com");
     *
     * @docs
     */
    get_uid_by_email(email: string): Promise<string | undefined>;
    /**
     * Get a uid by API key.
     * @returns Returns the uid for the API key, or undefined if not valid.
     * @param api_key The API key to parse.
     * @example
     * const uid = server.users.get_uid_by_api_key("XXXXXXXXXX");
     *
     * @docs
     */
    get_uid_by_api_key(api_key: string): string | undefined;
    /**
     * Get a uid by token.
     * @returns Returns the uid for the token, or undefined if not valid.
     * @param token The token to parse.
     * @example
     * const uid = server.users.get_uid_by_token("XXXXXXXXXX");
     *
     * @docs
     */
    get_uid_by_token(token: string): string | undefined;
    /**
     * Get a user's support pin by uid.
     * @returns Returns the support PIN string.
     * @param uid The user id.
     * @example
     * const pin = await server.users.get_support_pin("1");
     *
     * @docs
     */
    get_support_pin(uid: string): Promise<string>;
    /**
     * Generate an API key for a user and store its hash. Overwrites existing keys.
     * @returns Returns the API key string (plaintext).
     * @param uid The user id.
     * @example
     * const api_key = await server.users.generate_api_key("0");
     *
     * @docs
     */
    generate_api_key(uid: string): Promise<string>;
    /**
     * Check if a user has a generated API key.
     * @returns Returns a boolean indicating whether the user has an API key.
     * @param uid The user id.
     * @throws {Collection.NotFoundError} If the user id does not exist.
     * @example
     * const has_api_key = await server.users.has_api_key("0");
     *
     * @docs
     */
    has_api_key(uid: string): Promise<boolean>;
    /**
     * Revoke the API key of a user.
     * @param uid The user id.
     * @example
     * await server.users.revoke_api_key("0");
     *
     * @docs
     */
    revoke_api_key(uid: string): Promise<void>;
    /**
     * Verify a plaintext password.
     * @returns Returns a boolean indicating whether the verification was successful.
     * @param uid The user id.
     * @param password The plaintext password.
     * @example
     * const success = await server.users.verify_password("1", "XXXXXX");
     *
     * @docs
     */
    verify_password(uid: string, password: string): Promise<boolean>;
    /**
     * Verify a plaintext API key.
     * @returns Returns a boolean indicating whether the verification was successful.
     * @param api_key The api key to verify.
     * @example
     * const success = await server.users.verify_api_key("XXXXXX");
     *
     * @docs
     */
    verify_api_key(api_key: string): Promise<boolean>;
    /**
     * Verify a plaintext API key by uid.
     * @returns Returns a boolean indicating whether the verification was successful.
     * @param uid The user id.
     * @param api_key The api key to verify.
     * @example
     * const success = await server.users.verify_api_key_by_uid("1", "XXXXXX");
     *
     * @docs
     */
    verify_api_key_by_uid(uid: string | undefined | null, api_key: string): Promise<boolean>;
    /**
     * Verify a plaintext token.
     * @returns Returns a boolean indicating whether the verification was successful.
     * @param token The token to verify.
     * @example
     * const success = await server.users.verify_token("XXXXXX");
     *
     * @docs
     */
    verify_token(token: string): Promise<boolean>;
    /**
     * Verify a plaintext token by uid.
     * @returns Returns a boolean indicating whether the verification was successful.
     * @param uid The user id.
     * @param token The token to verify.
     * @example
     * const success = await server.users.verify_token_by_uid("1", "XXXXXX");
     *
     * @docs
     */
    verify_token_by_uid(uid: string | undefined | null, token: string): Promise<boolean>;
    /**
     * Verify a 2FA code by user id/email key.
     * @param uid The UID or email used when creating the 2FA token.
     * @param code The 2FA code.
     * @returns Returns undefined on success, otherwise a string describing the error.
     * @example
     * await server.users.verify_2fa("1", "123456");
     *
     * @docs
     */
    verify_2fa(uid: string, code: string): Promise<string | undefined>;
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
     *
     * @docs
     */
    send_2fa({ uid, stream, expiration, _user_agent, _username, _email, }: {
        uid: string;
        stream: Stream;
        expiration?: number;
        _user_agent?: string;
        _username?: string;
        _email?: string;
    }): Promise<void>;
    /**
     * List all users.
     * @returns An array of User objects.
     *
     * @docs
     */
    list(): Promise<User[]>;
}
/** Nested types for the {@link User} class. */
export declare namespace Users {
    /**
     * Options for constructing a {@link Users} instance.
     * @docs
     */
    interface Opts {
        /** The number of seconds a sign-in token will be valid. */
        token_expiration?: number;
        /** Enable 2FA for user authentication. */
        enable_2fa?: boolean;
        /** Enable account activation by email after a user signs up. */
        enable_account_activation?: boolean;
        /** The email address to send support requests to, defaults to {@link Server.Opts.smtp.sender} if defined */
        support_recipient?: Mail.Address;
    }
    /** The types for the frontend endpoints. */
    namespace Endpoints {
        /** The get user endpoint. */
        type GetUser = Request.Info<"GET", "/volt/api/v1/user", undefined, User.Frontend, undefined>;
        /** The update user endpoint. */
        type UpdateUser = Request.Info<"POST", "/volt/api/v1/user", {
            first_name?: string;
            last_name?: string;
            phone_number?: string;
            username?: string;
            email?: string;
        }, {
            message: string;
        }, undefined>;
        /** The activate user endpoint. */
        type ActivateUser = Request.Info<"POST", "/volt/api/v1/auth/activate", {
            code: string;
        }, {
            message: string;
        }, undefined>;
        /** The change password endpoint. */
        type ChangePassword = Request.Info<"POST", "/volt/api/v1/user/change_password", {
            current_password: string;
            password: string;
            verify_password: string;
        }, {
            message: string;
        }, undefined>;
        /** The delete user endpoint. */
        type DeleteUser = Request.Info<"DELETE", "/volt/api/v1/user", undefined, {
            message: string;
        }, undefined>;
        /** The generate api key endpoint. */
        type GenerateAPIKey = Request.Info<"POST", "/volt/api/v1/user/api_key", undefined, {
            message: string;
            api_key: string;
        }, undefined>;
        /** The has api key endpoint. */
        type HasAPIKey = Request.Info<"GET", "/volt/api/v1/user/has_api_key", undefined, {
            message: string;
            has_api_key: boolean;
        }, undefined>;
        /** The revoke api key endpoint. */
        type RevokeAPIKey = Request.Info<"DELETE", "/volt/api/v1/user/api_key", undefined, {
            message: string;
        }, undefined>;
        /** JSON values for LoadUserData data field etc. */
        type JsonValue = string | number | boolean | null | JsonArray | JsonObject;
        type JsonArray = Array<JsonValue>;
        type JsonObject = {
            [key: string]: JsonValue;
        };
        const JsonValueSchemaType: readonly ["string", "number", "boolean", "null", "array", "object"];
        /** The load public user data endpoint. */
        type LoadUserData = Request.Info<"GET", "/volt/api/v1/user/data", {
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
        }, {
            message: string;
            data: JsonValue;
        }, undefined>;
        /** The set public user data endpoint. */
        type SetUserData = Request.Info<"POST", "/volt/api/v1/user/data", {
            /**
             * The document query.
             * @note The object form query may not include system
             *       reserved fields `_id`, `uid`, `query` and `data`.
             */
            query: string | Record<string, any>;
            /** The data to save. */
            data: JsonValue;
        }, {
            message: string;
        }, undefined>;
        /** The delete public user data endpoint. */
        type DeleteUserData = Request.Info<"DELETE", "/volt/api/v1/user/data", {
            /**
             * The document query.
             * @note The object form query may not include system
             *       reserved fields `_id`, `uid`, `query` and `data`.
             */
            query: string | Record<string, any>;
            /** The data to save. */
            data: JsonValue;
        }, {
            message: string;
        }, undefined>;
        /** The load protected user data endpoint. */
        type LoadProtectedUserData = Request.Info<"GET", "/volt/api/v1/user/data/protected", {
            /**
             * The document query.
             * @note The object form query may not include system
             *       reserved fields `_id`, `uid`, `query` and `data`.
             */
            query: string | Record<string, any>;
            /** The default value for document field `data`. */
            default?: JsonValue;
        }, {
            message: string;
            data: JsonValue;
        }, undefined>;
        /** The sign in endpoint. */
        type SignIn = Request.Info<"POST", "/volt/api/v1/auth/signin", {
            username: string;
            email: string;
            password: string;
            code?: string;
        }, {
            message: string;
        }, undefined>;
        /** The sign up endpoint. */
        type SignUp = Request.Info<"POST", "/volt/api/v1/auth/signup", {
            username: string;
            email: string;
            first_name: string;
            last_name: string;
            password: string;
            verify_password: string;
            phone_number?: string;
            code?: string;
        }, {
            message: string;
        }, undefined>;
        /** The sign out endpoint. */
        type SignOut = Request.Info<"POST", "/volt/api/v1/auth/signout", undefined, {
            message: string;
        }, undefined>;
        /** The send 2fa endpoint. */
        type Send2FA = Request.Info<"POST", "/volt/api/v1/auth/2fa", {
            email: string;
        }, {
            message: string;
        }, undefined>;
        /** The send forgot password endpoint. */
        type ForgotPassword = Request.Info<"POST", "/volt/api/v1/auth/forgot_password", {
            email: string;
            password: string;
            verify_password: string;
            code: string;
        }, {
            message: string;
        }, undefined>;
        /** The submit support endpoint. */
        type SubmitSupport = Request.Info<"POST", "/volt/api/v1/support/submit", {
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
            summary: string;
            /** A detailed description of the support request. */
            detailed?: string;
            /** An object with attachments, assigned as `{file_name: raw_file_data}`. */
            attachments?: Mail.Attachment.RestAPI[];
        }, {
            message: string;
        }, undefined>;
        /** The get support pin endpoint. */
        type GetSupportPin = Request.Info<"GET", "/volt/api/v1/support/pin", undefined, {
            message: string;
            pin: string;
        }, undefined>;
    }
}
