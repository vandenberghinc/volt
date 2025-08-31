import { Stream } from "./stream.js";
import { Server } from "./server.js";
import { Collection } from "./database/collection.js";
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
export declare namespace User {
    /** The frontend representation of a user. */
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
};
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
};
/**
 * The users class, accessible under `Server.users`.
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
    /** Construct the server. */
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
     * Validate a UID against ASCII charset and allowed lengths (current + legacy).
     * @warning If you change {@link Users.UID_CHARSET} or {@link Users.UID_LENGTH},
     * update {@link Users.LEGACY_UID_LENGTHS} for backward compatibility.
     */
    private static _is_valid_uid;
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
     * @param stream The request stream.
     * @param token The token string or Token object.
     */
    _create_token_cookie(stream: Stream, token: string | Token): void;
    /**
     * Create user cookies (id and activation flag).
     * @param stream The request stream.
     * @param uid The user ID, or invalid to clear.
     */
    _create_user_cookie(stream: Stream, uid: string): Promise<void>;
    /**
     * Create non-HTTP-only cookies with detailed user info for the frontend.
     * @param stream The request stream.
     * @param uid The user ID.
     */
    _create_detailed_user_cookie(stream: Stream, uid: string): Promise<void>;
    /**
     * Clear all default auth/user cookies.
     * @param stream The request stream.
     */
    _reset_cookies(stream: Stream): void;
    /**
     * Initialize default authentication, user, and support endpoints.
     */
    _initialize(): Promise<void>;
    /**
     * Check if a uid exists.
     * @param uid The user ID to check.
     * @returns True if a user with the given uid exists.
     */
    uid_exists(uid: string): Promise<boolean>;
    /**
     * Check if a username exists.
     * @returns Returns a boolean indicating whether the username exists or not.
     * @param username The username to check.
     * @example
     * const exists = await server.users.username_exists("someusername");
     */
    username_exists(username: string): Promise<boolean>;
    /**
     * Check if an email exists.
     * @returns Returns a boolean indicating whether the email exists or not.
     * @param email The email to check.
     * @example
     * const exists = await server.users.email_exists("some@email.com");
     */
    email_exists(email: string): Promise<boolean>;
    /**
     * Check if a user account is activated.
     * @returns Returns a boolean indicating whether the account is activated or not.
     * @param uid The id of the user.
     * @example
     * const activated = await server.users.is_activated("0");
     */
    is_activated(uid: string): Promise<boolean>;
    /**
     * Set the activated status of a user account.
     * @param uid The user id.
     * @param is_activated The boolean with the new activated status.
     * @example
     * await server.users.set_activated("1", true);
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
    create({ first_name, last_name, username, email, password, phone_number, is_activated, _check_username_email, }: {
        first_name: string;
        last_name: string;
        username: string;
        email: string;
        password: string;
        phone_number?: string;
        is_activated?: boolean;
        _check_username_email?: boolean;
    }): Promise<string>;
    /**
     * Delete a user account and associated data.
     * @param uid The user id.
     * @example
     * await server.users.delete("0");
     */
    delete(uid: string): Promise<void>;
    /**
     * Set a user's first name. Throws if uid does not exist.
     * @param uid The user id.
     * @param first_name The new first name.
     * @example
     * await server.users.set_first_name("1", "John");
     */
    set_first_name(uid: string, first_name: string): Promise<void>;
    /**
     * Set a user's last name. Throws if uid does not exist.
     * @param uid The user id.
     * @param last_name The new last name.
     * @example
     * await server.users.set_last_name("1", "Doe");
     */
    set_last_name(uid: string, last_name: string): Promise<void>;
    /**
     * Set a user's username. Throws if uid does not exist.
     * @param uid The user id.
     * @param username The new username.
     * @example
     * await server.users.set_username("1", "newusername");
     */
    set_username(uid: string, username: string): Promise<void>;
    /**
     * Set a user's email. Throws if uid does not exist.
     * @param uid The user id.
     * @param email The new email.
     * @example
     * await server.users.set_email("1", "new@email.com");
     */
    set_email(uid: string, email: string): Promise<void>;
    /**
     * Set a user's password. Throws on invalid input or unknown uid.
     * @param uid The user id.
     * @param password The new password.
     * @example
     * await server.users.set_password("1", "XXXXXX");
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
     */
    get(uid: string): Promise<User>;
    /**
     * Get a user by username. Throws if the username does not exist.
     * @returns Returns a User object.
     * @param username The username of the user to fetch.
     * @throws {Collection.NotFoundError} If the username does not exist.
     * @example
     * const user = await server.users.get_by_username("myusername");
     */
    get_by_username(username: string): Promise<User>;
    /**
     * Get a user by email. Throws if the email does not exist.
     * @returns Returns a User object.
     * @param email The email of the user to fetch.
     * @throws {Collection.NotFoundError} If the email does not exist.
     * @example
     * const user = await server.users.get_by_email("my@email.com");
     */
    get_by_email(email: string): Promise<User>;
    /**
     * Get a user by API key. Throws if invalid.
     * @returns Returns a User object.
     * @param api_key The API key of the user to fetch.
     * @example
     * const user = await server.users.get_by_api_key("XXXXXX");
     */
    get_by_api_key(api_key: string): Promise<User>;
    /**
     * Get a user by token. Throws if invalid.
     * @returns Returns a User object.
     * @param token The authentication token of the user to fetch.
     * @example
     * const user = await server.users.get_by_token("XXXXXX");
     */
    get_by_token(token: string): Promise<User>;
    /**
     * Get a uid by username.
     * @returns Returns the uid of the username, or undefined if not found.
     * @param username The username of the uid to fetch.
     * @example
     * const uid = await server.users.get_uid("myusername");
     */
    get_uid(username: string): Promise<string | undefined>;
    /**
     * Get a uid by username.
     * @returns Returns the uid of the username, or undefined if not found.
     * @param username The username of the uid to fetch.
     * @example
     * const uid = await server.users.get_uid_by_username("myuser");
     */
    get_uid_by_username(username: string): Promise<string | undefined>;
    /**
     * Get a uid by email.
     * @returns Returns the uid of the email, or undefined if not found.
     * @param email The email of the uid to fetch.
     * @example
     * const uid = await server.users.get_uid_by_email("my@email.com");
     */
    get_uid_by_email(email: string): Promise<string | undefined>;
    /**
     * Get a uid by API key.
     * @returns Returns the uid for the API key, or undefined if not valid.
     * @param api_key The API key to parse.
     * @example
     * const uid = server.users.get_uid_by_api_key("XXXXXXXXXX");
     */
    get_uid_by_api_key(api_key: string): string | undefined;
    /**
     * Get a uid by token.
     * @returns Returns the uid for the token, or undefined if not valid.
     * @param token The token to parse.
     * @example
     * const uid = server.users.get_uid_by_token("XXXXXXXXXX");
     */
    get_uid_by_token(token: string): string | undefined;
    /**
     * Get a user's support pin by uid.
     * @returns Returns the support PIN string.
     * @param uid The user id.
     * @example
     * const pin = await server.users.get_support_pin("1");
     */
    get_support_pin(uid: string): Promise<string>;
    /**
     * Generate an API key for a user and store its hash. Overwrites existing keys.
     * @returns Returns the API key string (plaintext).
     * @param uid The user id.
     * @example
     * const api_key = await server.users.generate_api_key("0");
     */
    generate_api_key(uid: string): Promise<string>;
    /**
     * Check if a user has a generated API key.
     * @returns Returns a boolean indicating whether the user has an API key.
     * @param uid The user id.
     * @throws {Collection.NotFoundError} If the user id does not exist.
     * @example
     * const has_api_key = await server.users.has_api_key("0");
     */
    has_api_key(uid: string): Promise<boolean>;
    /**
     * Revoke the API key of a user.
     * @param uid The user id.
     * @example
     * await server.users.revoke_api_key("0");
     */
    revoke_api_key(uid: string): Promise<void>;
    /**
     * Verify a plaintext password.
     * @returns Returns a boolean indicating whether the verification was successful.
     * @param uid The user id.
     * @param password The plaintext password.
     * @example
     * const success = await server.users.verify_password("1", "XXXXXX");
     */
    verify_password(uid: string, password: string): Promise<boolean>;
    /**
     * Verify a plaintext API key.
     * @returns Returns a boolean indicating whether the verification was successful.
     * @param api_key The api key to verify.
     * @example
     * const success = await server.users.verify_api_key("XXXXXX");
     */
    verify_api_key(api_key: string): Promise<boolean>;
    /**
     * Verify a plaintext API key by uid.
     * @returns Returns a boolean indicating whether the verification was successful.
     * @param uid The user id.
     * @param api_key The api key to verify.
     * @example
     * const success = await server.users.verify_api_key_by_uid("1", "XXXXXX");
     */
    verify_api_key_by_uid(uid: string | undefined | null, api_key: string): Promise<boolean>;
    /**
     * Verify a plaintext token.
     * @returns Returns a boolean indicating whether the verification was successful.
     * @param token The token to verify.
     * @example
     * const success = await server.users.verify_token("XXXXXX");
     */
    verify_token(token: string): Promise<boolean>;
    /**
     * Verify a plaintext token by uid.
     * @returns Returns a boolean indicating whether the verification was successful.
     * @param uid The user id.
     * @param token The token to verify.
     * @example
     * const success = await server.users.verify_token_by_uid("1", "XXXXXX");
     */
    verify_token_by_uid(uid: string | undefined | null, token: string): Promise<boolean>;
    /**
     * Verify a 2FA code by user id/email key.
     * @param uid The UID or email used when creating the 2FA token.
     * @param code The 2FA code.
     * @returns Returns undefined on success, otherwise a string describing the error.
     * @example
     * await server.users.verify_2fa("1", "123456");
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
     */
    list(): Promise<User[]>;
}
/** Nested types for the {@link User} class. */
export declare namespace Users {
    /** Constructor options. */
    interface Opts {
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
    namespace Endpoints {
        /** The get user endpoint. */
        namespace GetUser {
            /** The request params. */
            interface Params {
            }
            /** The result interface for a **successful** request. */
            type Result = User.Frontend;
        }
        /** The update user endpoint. */
        namespace UpdateUser {
            /** The request params. */
            interface Params {
                first_name?: string;
                last_name?: string;
                phone_number?: string;
                username?: string;
                email?: string;
            }
            /** The result interface for a **successful** request. */
            interface Result {
                message: string;
            }
        }
        /** The activate user endpoint. */
        namespace ActivateUser {
            /** The request params. */
            interface Params {
                code: string;
            }
            /** The result interface for a **successful** request. */
            interface Result {
                message: string;
            }
        }
        /** The change password endpoint. */
        namespace ChangePassword {
            /** The request params. */
            interface Params {
                current_password: string;
                password: string;
                verify_password: string;
            }
            /** The result interface for a **successful** request. */
            interface Result {
                message: string;
            }
        }
        /** The delete user endpoint. */
        namespace DeleteUser {
            /** The request params. */
            interface Params {
            }
            /** The result interface for a **successful** request. */
            interface Result {
                message: string;
            }
        }
        /** The generate api key endpoint. */
        namespace GenerateAPIKey {
            /** The request params. */
            interface Params {
            }
            /** The result interface for a **successful** request. */
            interface Result {
                message: string;
                api_key: string;
            }
        }
        /** The has api key endpoint. */
        namespace HasAPIKey {
            /** The request params. */
            interface Params {
            }
            /** The result interface for a **successful** request. */
            interface Result {
                message: string;
                has_api_key: boolean;
            }
        }
        /** The revoke api key endpoint. */
        namespace RevokeAPIKey {
            /** The request params. */
            interface Params {
            }
            /** The result interface for a **successful** request. */
            interface Result {
                message: string;
            }
        }
        /** JSON values for LoadUserData data field etc. */
        type JsonValue = string | number | boolean | null | JsonArray | JsonObject;
        type JsonArray = Array<JsonValue>;
        type JsonObject = {
            [key: string]: JsonValue;
        };
        const JsonValueSchemaType: readonly ["string", "number", "boolean", "null", "array", "object"];
        /** The load public user data endpoint. */
        namespace LoadUserData {
            /** The request params. */
            interface Params {
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
            interface Result {
                message: string;
                data: JsonValue;
            }
        }
        /** The set public user data endpoint. */
        namespace SetUserData {
            /** The request params. */
            interface Params {
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
            interface Result {
                message: string;
            }
        }
        /** The delete public user data endpoint. */
        namespace DeleteUserData {
            /** The request params. */
            interface Params {
                /**
                 * The document query.
                 * @note The object form query may not include system
                 *       reserved fields `_id`, `uid`, `query` and `data`.
                 */
                query: string | Record<string, any>;
            }
            /** The result interface for a **successful** request. */
            interface Result {
                message: string;
            }
        }
        /** The load protected user data endpoint. */
        namespace LoadProtectedUserData {
            /** The request params. */
            interface Params {
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
            interface Result {
                message: string;
                data: JsonValue;
            }
        }
        /** The sign in endpoint. */
        namespace SignIn {
            /** The request params. */
            interface Params {
                username: string;
                email: string;
                password: string;
                code?: string;
            }
            /** The result interface for a **successful** request. */
            interface Result {
                message: string;
            }
        }
        /** The sign up endpoint. */
        namespace SignUp {
            /** The request params. */
            interface Params {
                username: string;
                email: string;
                first_name: string;
                last_name: string;
                password: string;
                verify_password: string;
                phone_number?: string;
                code?: string;
            }
            /** The result interface for a **successful** request. */
            interface Result {
                message: string;
            }
        }
        /** The sign out endpoint. */
        namespace SignOut {
            /** The request params. */
            interface Params {
            }
            /** The result interface for a **successful** request. */
            interface Result {
                message: string;
            }
        }
        /** The send 2fa endpoint. */
        namespace Send2FA {
            /** The request params. */
            interface Params {
                email: string;
            }
            /** The result interface for a **successful** request. */
            interface Result {
                message: string;
            }
        }
        /** The send forgot password endpoint. */
        namespace ForgotPassword {
            /** The request params. */
            interface Params {
                email: string;
                password: string;
                verify_password: string;
                code: string;
            }
            /** The result interface for a **successful** request. */
            interface Result {
                message: string;
            }
        }
        /** The submit support endpoint. */
        namespace SubmitSupport {
            /** The request params. */
            interface Params {
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
                attachments?: {
                    [fileName: string]: any;
                };
            }
            /** The result interface for a **successful** request. */
            interface Result {
                message: string;
            }
        }
        /** The get support pin endpoint. */
        namespace GetSupportPin {
            /** The request params. */
            interface Params {
            }
            /** The result interface for a **successful** request. */
            interface Result {
                message: string;
                pin: string;
            }
        }
    }
}
