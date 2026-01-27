var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  Users: () => Users
});
module.exports = __toCommonJS(stdin_exports);
var crypto = __toESM(require("crypto"));
var vlib = __toESM(require("@vandenberghinc/vlib"));
var MailUI = __toESM(require("./plugins/mail/ui.js"));
var import_mail = require("./plugins/mail/mail.js");
var import_status = require("./status.js");
var import_errors = require("./errors/index.js");
var import_collection = require("./database/collection.js");
class Users {
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
  static TOKEN_SUFFIX_LEN = 64;
  /** Accepted legacy suffix lengths; add old sizes here when rotating. */
  static LEGACY_TOKEN_SUFFIX_LENS = [];
  /**
   * Allowed characters for the random suffix.
   * @warning MUST NOT include `_` (delimiter). ASCII only for fast-path validation.
   */
  static TOKEN_SUFFIX_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  /**
   * UID length used by the generator.
   * @warning If you change this, add the old value to {@link Users.LEGACY_UID_LENGTHS}.
   */
  static UID_LENGTH = 16;
  /** Accepted legacy UID lengths; add old sizes here when rotating. */
  static LEGACY_UID_LENGTHS = [];
  /**
   * UID character set (ASCII). MUST NOT include `_`.
   */
  static UID_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  /**
   * Build an ASCII allow table for fast membership checks.
   * Index is charCode (0..127), value is 1 if allowed else 0.
   */
  static _build_ascii_allow(cs) {
    const tbl = new Uint8Array(128);
    for (let i = 0; i < cs.length; i++) {
      const c = cs.charCodeAt(i);
      if (c < 128)
        tbl[c] = 1;
      else
        throw new Error("Non-ASCII char in allowed charset; use ASCII-only here.");
    }
    return tbl;
  }
  /** ASCII allow table for token suffix validation (built from TOKEN_SUFFIX_CHARSET). */
  static TOKEN_SUFFIX_ALLOW = Users._build_ascii_allow(Users.TOKEN_SUFFIX_CHARSET);
  /** ASCII allow table for UID validation (built from UID_CHARSET). */
  static UID_ALLOW = Users._build_ascii_allow(Users.UID_CHARSET);
  // ---------------------------------------------------------
  // Attributes.
  // ---------------------------------------------------------
  /** The parent server instance. */
  server;
  /** The recipient email for support submit emails, defaults to `Server.smtp_sender`. */
  support_recipient;
  /** The avg wait time when sending 2FA codes. */
  avg_send_2fa_time = [];
  /** The database collection for token documents. */
  _tokens_db;
  /** The database collection for 2fa token documents. */
  _2fa_tokens_db;
  /** The database collection for user documents. */
  _users_db;
  /** Enable 2FA for user sign in. */
  enable_2fa;
  /** Enable 2FA account activation for user sign up. */
  enable_account_activation;
  /** The token expiration in seconds */
  token_expiration;
  /** Database collection for public (read:public, write:public) user documents. */
  public;
  /** Database collection for protected (read:public, write:private) user documents. */
  protected;
  /** Database collection for private (read:private, write:private) user documents. */
  private;
  // ---------------------------------------------------------
  // Constructor.
  // ---------------------------------------------------------
  /** Construct the server. */
  constructor(opts) {
    this.server = opts._server;
    this.enable_2fa = opts.enable_2fa ?? false;
    this.enable_account_activation = opts.enable_account_activation ?? true;
    this.token_expiration = opts.token_expiration ?? 86400;
    this.support_recipient = opts.support_recipient ?? this.server.mail?.sender;
    this._tokens_db = this.server.db.collection({
      name: "Volt.Server.Users.Tokens",
      indexes: ["uid", "token"],
      ttl: 1e3 * 3600 * 24 * 30
      // 30 days.
    });
    this._2fa_tokens_db = this.server.db.collection({
      name: "Volt.Server.Users.TwoFactorAuth",
      indexes: ["uid", "code"],
      ttl: 1e3 * 3600 * 24
      // 1 day.
    });
    this._users_db = this.server.db.collection({
      name: "Volt.Server.Users.Users",
      indexes: [
        { key: "uid", unique: true, forced: true },
        { key: "email", unique: true, forced: true },
        { key: "username", unique: true, forced: true },
        {
          key: "api_key",
          sparse: true,
          // api_key index sparse/partial so documents without api_key don’t bloat the index
          forced: true
          // hashed; non-unique is fine if you only store one per user, and we dont retrieve uid's alike by api key, but extract from raw api key string instead.
        }
      ]
    });
    this.public = this.server.db.collection({
      name: "Volt.Server.Users.Public",
      indexes: ["uid", "query"]
    });
    this.protected = this.server.db.collection({
      name: "Volt.Server.Users.Protected",
      indexes: ["uid", "query"]
    });
    this.private = this.server.db.collection({
      name: "Volt.Server.Users.Private",
      indexes: ["uid", "query"]
    });
  }
  // ---------------------------------------------------------
  // Utils.
  // ---------------------------------------------------------
  /** Generate a code. */
  _generate_code(length = 6) {
    const charset = "0123456789";
    let out = "";
    for (let i = 0; i < length; i++)
      out += charset[crypto.randomInt(charset.length)];
    return out;
  }
  /**
   * Generate a crypto str.
   * @warning ENSURE this does not add `_` to the charset, as this is used as a delimiter for tokens/api keys.
   */
  _generate_crypto_str(length = 32, charset) {
    let out = "";
    for (let i = 0; i < length; i++)
      out += charset[crypto.randomInt(charset.length)];
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
  _crypto_scrypt(password, salt, keylen = 64) {
    return new Promise((res, rej) => crypto.scrypt(password, salt, keylen, (e, dk) => e ? rej(e) : res(dk)));
  }
  /** Hash a password. */
  async _hash_password(plain) {
    const salt = crypto.randomBytes(16);
    const hash = await this._crypto_scrypt(plain, salt, 64);
    return `${salt.toString("hex")}:${hash.toString("hex")}`;
  }
  /** Verify a plain password vs stored hashed password. */
  async _verify_password(plain, stored) {
    const [saltHex, hashHex] = stored.split(":");
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const actual = await this._crypto_scrypt(plain, salt, expected.length);
    return crypto.timingSafeEqual(actual, expected);
  }
  /** Generate a unique user ID. */
  async _generate_uid() {
    let attempts = 0;
    const max_attempts = 1e4;
    while (attempts < max_attempts) {
      const uid = this._generate_crypto_str(Users.UID_LENGTH, Users.UID_CHARSET);
      if (await this.uid_exists(uid) === false)
        return uid;
      attempts++;
    }
    throw new Error("Failed to generate a unique uid after maximum attempts.");
  }
  /** Generate an API key. Format: `ak_<uid>_<suffix>` */
  _generate_api_key(uid) {
    return `ak_${uid}_${this._generate_crypto_str(Users.TOKEN_SUFFIX_LEN, Users.TOKEN_SUFFIX_CHARSET)}`;
  }
  /** Generate a token. Format: `tk_<uid>_<suffix>` */
  _generate_token(uid) {
    return `tk_${uid}_${this._generate_crypto_str(Users.TOKEN_SUFFIX_LEN, Users.TOKEN_SUFFIX_CHARSET)}`;
  }
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
  _parse_uid_from_token_api_key(input, expected_prefix) {
    if (typeof input !== "string" || !input.startsWith(expected_prefix))
      return void 0;
    const pfxLen = expected_prefix.length;
    const delimPos = input.indexOf("_", pfxLen);
    if (delimPos === -1)
      return void 0;
    const uid = input.slice(pfxLen, delimPos);
    if (uid.length === 0 || !this.is_valid_uid(uid))
      return void 0;
    const suffix = input.slice(delimPos + 1);
    const slen = suffix.length;
    if (slen !== Users.TOKEN_SUFFIX_LEN) {
      let ok = false;
      for (let i = 0; i < Users.LEGACY_TOKEN_SUFFIX_LENS.length; i++) {
        if (slen === Users.LEGACY_TOKEN_SUFFIX_LENS[i]) {
          ok = true;
          break;
        }
      }
      if (!ok)
        return void 0;
    }
    const allow = Users.TOKEN_SUFFIX_ALLOW;
    for (let i = 0; i < slen; i++) {
      const code = suffix.charCodeAt(i);
      if (code >= 128 || allow[code] === 0)
        return void 0;
    }
    return uid;
  }
  /**
   * Validate a proposed new password against basic rules and confirmation.
   * @param pass The new password to validate.
   * @param verify_pass The repeated password to confirm.
   * @returns An object with optional error message and invalid_fields mapping.
   */
  _verify_new_pass(pass, verify_pass) {
    let error = void 0;
    if (pass !== verify_pass) {
      error = "Passwords do not match.";
    } else if (pass.length < 8) {
      error = "The password should at least include eight characters.";
    } else if (pass.toLowerCase() === pass) {
      error = "The password should at least include one capital letter.";
    } else if (!/\d|[!@#$%^&*]/.test(pass)) {
      error = "The password should at least include one numeric or special character.";
    }
    if (error) {
      return { error, invalid_fields: { password: error, verify_password: error } };
    } else {
      return { error: void 0, invalid_fields: void 0 };
    }
  }
  // ---------------------------------------------------------
  // Authentication (private).
  // ---------------------------------------------------------
  /**
   * Generate and persist a new auth token for the given uid.
   * @param uid The user ID.
   * @returns The plaintext token string.
   */
  async _create_token(uid) {
    const token = this._generate_token(uid);
    await this._tokens_db.set({ uid }, {
      expiration: Date.now() + this.token_expiration * 1e3,
      token: await this._hash_password(token),
      active: true
    });
    return token;
  }
  /**
   * Deactivate the current token for the given uid.
   * @param uid The user ID.
   */
  async _deactivate_token(uid) {
    await this._tokens_db.set({ uid }, { active: false });
  }
  /**
   * Create and store a short-lived 2FA token (code).
   * @param uid_or_email The uid or email key used for the 2FA record.
   * @param expiration Expiration in seconds from now.
   * @returns The generated 2FA code.
   */
  async _create_2fa_token(uid_or_email, expiration) {
    const code = this._generate_code(6);
    await this._2fa_tokens_db.set({ uid: uid_or_email }, {
      expiration: Date.now() + expiration * 1e3,
      code,
      active: true
    });
    return code;
  }
  /**
   * Deactivate a stored 2FA token by uid/email key.
   * @param uid_or_email The uid or email key used for the 2FA record.
   */
  async _deactivate_2fa_token(uid_or_email) {
    await this._2fa_tokens_db.set({ uid: uid_or_email }, { active: false });
  }
  /**
   * Perform authentication on a request.
   * @returns An object on refusal, undefined on success.
   */
  async _authenticate(stream) {
    const authorization = stream.headers["authorization"];
    if (authorization !== void 0) {
      if (typeof authorization !== "string") {
        return {
          status: import_status.Status.bad_request,
          data: "Invalid authorization header."
        };
      }
      const match = authorization.match(/^Bearer\s+(\S+)$/i);
      if (!match) {
        return {
          status: import_status.Status.bad_request,
          data: 'Invalid authorization scheme, the authorization scheme must be "Bearer".'
        };
      }
      const api_key = match[1];
      const uid = this.get_uid_by_api_key(api_key);
      if (!uid) {
        return { status: import_status.Status.unauthorized, data: "Unauthorized." };
      }
      if (await this.verify_api_key_by_uid(uid, api_key) !== true) {
        return {
          status: import_status.Status.unauthorized,
          data: "Unauthorized."
        };
      }
      stream.uid = uid;
      return;
    } else {
      if (stream.cookies.T == null || stream.cookies.T.value == null) {
        return {
          status: 302,
          headers: { Location: `/signin?next=${encodeURIComponent(stream.endpoint)}` },
          data: "Permission denied."
        };
      }
      const token = stream.cookies.T.value;
      const uid = this.get_uid_by_token(token);
      if (!uid) {
        return {
          status: 302,
          headers: { Location: `/signin?next=${encodeURIComponent(stream.endpoint)}` },
          data: "Permission denied."
        };
      }
      if (await this.verify_token_by_uid(uid, token) !== true) {
        return {
          status: 302,
          headers: { Location: `/signin?next=${encodeURIComponent(stream.endpoint)}` },
          data: "Permission denied."
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
  async _sign_in_response(stream, uid, opts) {
    const token = await this._create_token(uid);
    this._create_token_cookie(stream, token);
    await this._create_user_cookie(stream, uid);
    await this._create_detailed_user_cookie(stream, uid);
    if (opts?.send !== false) {
      stream.send({
        status: 200,
        data: { message: "Successfully signed in." }
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
  _create_token_cookie(stream, token) {
    stream.set_header("Cache-Control", "max-age=0, no-cache, no-store, must-revalidate, proxy-revalidate");
    stream.set_header("Access-Control-Allow-Credentials", "true");
    if (typeof token === "object") {
      token = token.token;
    }
    const max_age = this.token_expiration;
    const expires = new Date(Date.now() + max_age * 1e3).toUTCString();
    stream.set_cookie(`T=${encodeURIComponent(token ?? "")}; Max-Age=${max_age}; Path=/; Expires=${expires}; SameSite=Strict; Secure; HttpOnly;`);
  }
  /**
   * Create user cookies (id and activation flag).
   * @param stream The request stream.
   * @param uid The user ID, or invalid to clear.
   */
  async _create_user_cookie(stream, uid) {
    if (typeof uid === "string") {
      stream.set_cookie(`UserID=${encodeURIComponent(uid ?? "")}; Path=/; SameSite=Strict; Secure;`);
      const is_activated = this.enable_account_activation ? await this.is_activated(uid) : true;
      stream.set_cookie(`UserActivated=${is_activated}; Path=/; SameSite=Strict; Secure;`);
    } else {
      stream.set_cookie(`UserID=-1; Path=/; SameSite=Strict; Secure;`);
      const is_activated = this.enable_account_activation ? false : true;
      stream.set_cookie(`UserActivated=${is_activated}; Path=/; SameSite=Strict; Secure;`);
    }
  }
  /**
   * Create non-HTTP-only cookies with detailed user info for the frontend.
   * @param stream The request stream.
   * @param uid The user ID.
   */
  async _create_detailed_user_cookie(stream, uid) {
    const user = await this.get(uid);
    stream.set_cookie(`UserName=${encodeURIComponent(user.username ?? "")}; Path=/; SameSite=Strict; Secure;`);
    stream.set_cookie(`UserFirstName=${encodeURIComponent(user.first_name ?? "")}; Path=/; SameSite=Strict; Secure;`);
    stream.set_cookie(`UserLastName=${encodeURIComponent(user.last_name ?? "")}; Path=/; SameSite=Strict; Secure;`);
    stream.set_cookie(`UserEmail=${encodeURIComponent(user.email ?? "")}; Path=/; SameSite=Strict; Secure;`);
  }
  /**
   * Clear all default auth/user cookies.
   * @param stream The request stream.
   */
  _reset_cookies(stream) {
    const past = "Thu, 01 Jan 1970 00:00:00 GMT";
    stream.set_cookie(`T=; Max-Age=0; Path=/; Expires=${past}; SameSite=Strict; Secure; HttpOnly;`);
    stream.set_cookie(`UserID=; Max-Age=0; Path=/; Expires=${past}; SameSite=Strict; Secure;`);
    stream.set_cookie(`UserActivated=; Max-Age=0; Path=/; Expires=${past}; SameSite=Strict; Secure;`);
    stream.set_cookie(`UserName=; Max-Age=0; Path=/; Expires=${past}; SameSite=Strict; Secure;`);
    stream.set_cookie(`UserFirstName=; Max-Age=0; Path=/; Expires=${past}; SameSite=Strict; Secure;`);
    stream.set_cookie(`UserLastName=; Max-Age=0; Path=/; Expires=${past}; SameSite=Strict; Secure;`);
    stream.set_cookie(`UserEmail=; Max-Age=0; Path=/; Expires=${past}; SameSite=Strict; Secure;`);
  }
  // ---------------------------------------------------------
  // Initialization (private).
  // ---------------------------------------------------------
  /**
   * Initialize default authentication, user, and support endpoints.
   */
  async _initialize({ worker = false } = {}) {
    if (!worker) {
      this.server.endpoint({
        method: "POST",
        endpoint: "/volt/api/v1/auth/2fa",
        content_type: "application/json",
        rate_limit: "global",
        params: {
          email: "string"
        },
        callback: async (stream, params) => {
          let uid;
          if ((uid = await this.get_uid_by_email(params.email)) == null) {
            return stream.success({
              data: { message: "A 2FA code was sent if the specified email exists." }
            });
          }
          await this.send_2fa({ uid, stream });
          return stream.success({
            data: { message: "A 2FA code was sent if the specified email exists." }
          });
        }
      });
      this.server.endpoint({
        method: "POST",
        endpoint: "/volt/api/v1/auth/signin",
        content_type: "application/json",
        rate_limit: {
          limit: 10,
          interval: 60,
          group: "volt.auth"
        },
        callback: async (stream) => {
          const uniform_delay = async () => {
            if (this.avg_send_2fa_time.length >= 10) {
              const sorted = [...this.avg_send_2fa_time].sort((a, b) => a - b);
              const mid = Math.floor(sorted.length / 2);
              const median = sorted.length % 2 === 0 ? Math.floor((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
              await new Promise((res) => setTimeout(res, median));
            }
          };
          let email, email_err, username, username_err, password, uid, code;
          try {
            email = stream.param("email");
          } catch (err) {
            email_err = err;
          }
          try {
            username = stream.param("username");
          } catch (err) {
            username_err = err;
          }
          if (email_err && username_err) {
            await uniform_delay();
            return stream.error({
              status: import_status.Status.bad_request,
              type: "InvalidParams",
              message: email_err.message
            });
          }
          try {
            password = stream.param("password");
          } catch (err) {
            await uniform_delay();
            return stream.error({
              status: import_status.Status.bad_request,
              type: "InvalidParams",
              message: err.message
            });
          }
          if (email && email.indexOf("@") === -1) {
            username = email;
            email = void 0;
          } else if (username && username.indexOf("@") !== -1) {
            email = username;
            username = void 0;
          }
          if (email) {
            if ((uid = await this.get_uid_by_email(email)) == null) {
              await uniform_delay();
              return stream.error({
                status: import_status.Status.unauthorized,
                type: "Unauthorized",
                message: "Unauthorized.",
                invalid_fields: {
                  "email": "Invalid or unrecognized email",
                  "password": "Invalid or unrecognized password"
                }
              });
            }
          } else if (username) {
            if ((uid = await this.get_uid(username)) == null) {
              await uniform_delay();
              return stream.error({
                status: import_status.Status.unauthorized,
                type: "Unauthorized",
                message: "Unauthorized.",
                invalid_fields: {
                  "username": "Invalid or unrecognized username",
                  "password": "Invalid or unrecognized password"
                }
              });
            }
          } else {
            await uniform_delay();
            return stream.error({
              status: import_status.Status.unauthorized,
              type: "Unauthorized",
              message: "Unauthorized.",
              invalid_fields: {
                "username": "Invalid or unrecognized username",
                "password": "Invalid or unrecognized password"
              }
            });
          }
          if (await this.verify_password(uid, password)) {
            if (this.enable_2fa) {
              try {
                code = stream.param("code");
              } catch (err2) {
                const start_time = Date.now();
                await this.send_2fa({ uid, stream });
                if (this.avg_send_2fa_time.length >= 1e4) {
                  this.avg_send_2fa_time.shift();
                }
                this.avg_send_2fa_time.push(Date.now() - start_time);
                return stream.error({
                  status: import_status.Status.two_factor_auth_required,
                  message: "2FA required.",
                  type: "2FARequired",
                  data: { error: "2FA required." }
                });
              }
              const err = await this.verify_2fa(uid, code);
              if (err) {
                return stream.error({
                  status: import_status.Status.unauthorized,
                  message: "Invalid 2FA code.",
                  type: "Invalid2FACode",
                  invalid_fields: {
                    "code": err
                  }
                });
              }
            }
            return await this._sign_in_response(stream, uid);
          }
          await uniform_delay();
          return stream.error({
            status: import_status.Status.unauthorized,
            type: "Unauthorized",
            message: "Unauthorized.",
            invalid_fields: {
              "username": "Invalid or unrecognized username",
              "password": "Invalid or unrecognized password"
            }
          });
        }
      });
      this.server.endpoint({
        method: "POST",
        endpoint: "/volt/api/v1/auth/signout",
        content_type: "application/json",
        authenticated: true,
        rate_limit: "global",
        callback: async (stream) => {
          await this._deactivate_token(stream.uid);
          this._reset_cookies(stream);
          return stream.success({
            data: { message: "Successfully signed out." }
          });
        }
      });
      this.server.endpoint({
        method: "POST",
        endpoint: "/volt/api/v1/auth/signup",
        content_type: "application/json",
        rate_limit: [
          "global",
          { limit: 5, interval: 60 * 10, group: "volt/Users/signup" }
        ],
        params: {
          username: { type: "string", allow_empty: false },
          first_name: { type: "string", allow_empty: false },
          last_name: { type: "string", allow_empty: false },
          email: { type: "string", allow_empty: false },
          password: { type: "string", allow_empty: false },
          verify_password: { type: "string", allow_empty: false },
          phone_number: { type: "string", required: false },
          code: { type: "string", required: false }
        },
        callback: async (stream, params) => {
          console.log("signup 1", params);
          const { error, invalid_fields } = this._verify_new_pass(params.password, params.verify_password);
          if (error) {
            return stream.error({
              status: import_status.Status.bad_request,
              type: "InvalidParams",
              message: error,
              invalid_fields: invalid_fields ?? void 0
            });
          }
          if (await this.username_exists(params.username)) {
            throw new import_errors.ExternalError({
              type: "UsernameAlreadyExists",
              message: `Username "${params.username}" is already registered.`,
              status: import_status.Status.bad_request,
              invalid_fields: { "username": "Username is already registered" }
            });
          }
          if (await this.email_exists(params.email)) {
            throw new import_errors.ExternalError({
              type: "EmailAlreadyExists",
              message: `Email "${params.email}" is already registered.`,
              status: import_status.Status.bad_request,
              invalid_fields: { "email": "Email is already registered" }
            });
          }
          if (this.enable_2fa) {
            if (params.code == null || params.code == "") {
              const start_time = Date.now();
              await this.send_2fa({
                _email: params.email,
                _username: params.username,
                stream,
                uid: void 0
                // keep uid required param but use _email sys arg here.
              });
              if (this.avg_send_2fa_time.length >= 1e4) {
                this.avg_send_2fa_time.shift();
              }
              this.avg_send_2fa_time.push(Date.now() - start_time);
              return stream.error({
                status: import_status.Status.two_factor_auth_required,
                message: "2FA required.",
                type: "TwoFactorAuthRequired"
              });
            }
            const err = await this.verify_2fa(params.email, params.code);
            if (err) {
              return stream.error({
                status: import_status.Status.unauthorized,
                type: "Invalid2FACode",
                message: "Invalid 2FA code.",
                invalid_fields: {
                  "code": err
                }
              });
            }
          }
          let uid;
          try {
            uid = await this.create({
              // dont unpack params since we are performing param validation inside create().
              first_name: params.first_name,
              last_name: params.last_name,
              username: params.username,
              email: params.email,
              password: params.password,
              verify_password: params.verify_password,
              phone_number: params.phone_number,
              is_activated: true,
              // already verified by 2fa or no 2fa is enabled.
              _check_username_email: false
              // already checked.
            });
          } catch (err) {
            return stream.error({
              status: import_status.Status.bad_request,
              type: "InvalidParams",
              message: err.message,
              invalid_fields: err.invalid_fields || {}
            });
          }
          return await this._sign_in_response(stream, uid);
        }
      });
      this.server.endpoint({
        method: "POST",
        endpoint: "/volt/api/v1/auth/activate",
        content_type: "application/json",
        rate_limit: "global",
        params: {
          code: "string"
        },
        callback: async (stream, params) => {
          let uid = stream.uid;
          if (uid == null) {
            uid = stream.cookies.UserID?.value;
            if (!uid || uid === "null" || uid === "undefined" || uid === "-1") {
              uid = void 0;
            }
          }
          if (uid == null) {
            return stream.error({ status: import_status.Status.forbidden, message: "Permission denied." });
          }
          const err = await this.verify_2fa(uid, params.code);
          if (err) {
            return stream.error({
              status: import_status.Status.forbidden,
              message: "Permission denied.",
              invalid_fields: {
                "code": err
              }
            });
          }
          await this.set_activated(uid, true);
          await this._create_user_cookie(stream, uid);
          return stream.success({ data: { message: "Successfully activated your account." } });
        }
      });
      this.server.endpoint({
        method: "POST",
        endpoint: "/volt/api/v1/auth/forgot_password",
        content_type: "application/json",
        rate_limit: "global",
        params: {
          email: { type: "string", allow_empty: false },
          code: { type: "string", allow_empty: false },
          password: { type: "string", allow_empty: false },
          verify_password: { type: "string", allow_empty: false }
        },
        callback: async (stream, params) => {
          const { error, invalid_fields } = this._verify_new_pass(params.password, params.verify_password);
          if (error) {
            return stream.error({
              status: import_status.Status.bad_request,
              message: error,
              invalid_fields: invalid_fields ?? void 0
            });
          }
          let uid;
          if ((uid = await this.get_uid_by_email(params.email)) == null) {
            return stream.error({ status: import_status.Status.forbidden, message: "Invalid email." });
          }
          const err = await this.verify_2fa(uid, params.code);
          if (err) {
            return stream.error({
              status: import_status.Status.forbidden,
              message: "Invalid 2FA code.",
              invalid_fields: {
                "code": "Invalid code"
              }
            });
          }
          await this.set_password(uid, params.password);
          return await this._sign_in_response(stream, uid);
        }
      });
      this.server.endpoint({
        method: "GET",
        endpoint: "/volt/api/v1/user",
        content_type: "application/json",
        authenticated: true,
        rate_limit: "global",
        params: {
          // detailed: { type: "boolean", default: false },
        },
        callback: async (stream) => {
          const user = await this.get(stream.uid);
          if (user.password) {
            user.password = "*".repeat(user.password.length);
          }
          if (user.api_key) {
            user.api_key = "*".repeat(user.api_key.length);
          }
          user.first_name ??= "";
          user.last_name ??= "";
          user.username ??= "";
          user.email ??= "";
          user.password ??= "";
          user.support_pin ??= "";
          const frontend = {
            uid: user.uid,
            username: user.username ?? "",
            first_name: user.first_name ?? "",
            last_name: user.last_name ?? "",
            email: user.email ?? "",
            phone_number: user.phone_number,
            // optional
            created_at: user.created_at,
            support_pin: user.support_pin ?? "",
            is_activated: user.is_activated === true,
            has_api_key: Boolean(user.api_key)
          };
          return stream.success({ data: frontend });
        }
      });
      this.server.endpoint({
        method: "POST",
        endpoint: "/volt/api/v1/user",
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
          email: { type: "string", required: false, allow_empty: false }
        },
        callback: async (stream, params) => {
          if (params.password != null) {
            return stream.error({
              status: import_status.Status.unauthorized,
              message: "This endpoint does not allow for password changes.",
              invalid_fields: {
                password: "This endpoint does not allow for password changes."
              }
            });
          }
          if (params.is_activated != null) {
            return stream.error({
              status: import_status.Status.unauthorized,
              message: "This endpoint does not allow for user activation changes.",
              invalid_fields: {
                is_activated: "This endpoint does not allow for user activation changes."
              }
            });
          }
          await this.set(stream.uid, {
            first_name: params.first_name,
            last_name: params.last_name,
            phone_number: params.phone_number,
            username: params.username,
            email: params.email
          });
          await this._sign_in_response(stream, stream.uid, { send: false });
          return stream.success({ data: { message: "Successfully updated your account." } });
        }
      });
      this.server.endpoint({
        method: "POST",
        endpoint: "/volt/api/v1/user/change_password",
        content_type: "application/json",
        authenticated: true,
        rate_limit: "global",
        params: {
          current_password: { type: "string", allow_empty: false },
          password: { type: "string", allow_empty: false },
          verify_password: { type: "string", allow_empty: false }
        },
        callback: async (stream, params) => {
          if (await this.verify_password(stream.uid, params.current_password) !== true) {
            return stream.error({
              status: import_status.Status.unauthorized,
              message: "Incorrect password.",
              invalid_fields: {
                current_password: "Incorrect password."
              }
            });
          }
          const { error, invalid_fields } = this._verify_new_pass(params.password, params.verify_password);
          if (error) {
            return stream.error({
              status: import_status.Status.bad_request,
              message: error,
              invalid_fields: invalid_fields ?? void 0
            });
          }
          await this.set_password(stream.uid, params.password);
          return stream.success({
            status: import_status.Status.success,
            data: { message: "Successfully updated your password." }
          });
        }
      });
      this.server.endpoint({
        method: "DELETE",
        endpoint: "/volt/api/v1/user",
        content_type: "application/json",
        authenticated: true,
        rate_limit: "global",
        callback: async (stream) => {
          await this.delete(stream.uid);
          this._reset_cookies(stream);
          return stream.success({
            status: import_status.Status.success,
            data: { message: "Successfully deleted your account." }
          });
        }
      });
      this.server.endpoint({
        method: "POST",
        endpoint: "/volt/api/v1/user/api_key",
        content_type: "application/json",
        authenticated: true,
        rate_limit: "global",
        callback: async (stream) => {
          return stream.success({
            data: {
              message: "Successfully generated an API key.",
              api_key: await this.generate_api_key(stream.uid)
            }
          });
        }
      });
      this.server.endpoint({
        method: "GET",
        endpoint: "/volt/api/v1/user/has_api_key",
        content_type: "application/json",
        authenticated: true,
        rate_limit: "global",
        callback: async (stream) => {
          return stream.success({
            data: {
              message: "Successfully checked your API key.",
              has_api_key: await this.has_api_key(stream.uid)
            }
          });
        }
      });
      this.server.endpoint({
        method: "DELETE",
        endpoint: "/volt/api/v1/user/api_key",
        content_type: "application/json",
        authenticated: true,
        rate_limit: "global",
        callback: async (stream) => {
          await this.revoke_api_key(stream.uid);
          return stream.send({
            status: import_status.Status.success,
            data: { message: "Successfully revoked your API key." }
          });
        }
      });
      const init_user_data_query = (stream, uid, query) => {
        if (typeof query === "object") {
          if ("uid" in query) {
            return stream.error({
              message: "Invalid query parameter, the 'uid' field is not allowed.",
              type: "invalid_query_parameter",
              status: import_status.Status.bad_request,
              invalid_fields: {
                query: "Invalid query parameter, the 'uid' field is not allowed."
              }
            });
          }
          if ("data" in query) {
            return stream.error({
              message: "Invalid query parameter, the 'data' field is not allowed.",
              type: "invalid_query_parameter",
              status: import_status.Status.bad_request,
              invalid_fields: {
                query: "Invalid query parameter, the 'data' field is not allowed."
              }
            });
          }
          if ("query" in query) {
            return stream.error({
              message: "Invalid query parameter, the 'query' field is not allowed.",
              type: "invalid_query_parameter",
              status: import_status.Status.bad_request,
              invalid_fields: {
                query: "Invalid query parameter, the 'query' field is not allowed."
              }
            });
          }
          if ("_id" in query) {
            return stream.error({
              message: "Invalid query parameter, the '_id' field is not allowed.",
              type: "invalid_query_parameter",
              status: import_status.Status.bad_request,
              invalid_fields: {
                query: "Invalid query parameter, the '_id' field is not allowed."
              }
            });
          }
        }
        return typeof query === "string" ? { uid, query } : { ...query, uid };
      };
      this.server.endpoint({
        method: "GET",
        endpoint: "/volt/api/v1/user/data",
        content_type: "application/json",
        authenticated: true,
        rate_limit: "global",
        params: {
          query: { type: ["string", "object"], allow_empty: false },
          default: { type: Users.Endpoints.JsonValueSchemaType, required: false }
        },
        callback: async (stream, params) => {
          const query = init_user_data_query(stream, stream.uid, params.query);
          if (!query)
            return;
          try {
            const document = await this.public.load(query, {
              default: params.default ? { ...query, data: params.default } : void 0,
              retry: 3
            });
            return stream.send({
              status: import_status.Status.success,
              data: {
                message: "Successfully loaded the requested document.",
                data: document.data
              }
            });
          } catch (e) {
            if (e instanceof import_collection.Collection.NotFoundError) {
              return stream.error({
                message: "Document not found.",
                type: "document_not_found",
                status: import_status.Status.not_found
              });
            }
            throw e;
          }
        }
      });
      this.server.endpoint({
        method: "POST",
        endpoint: "/volt/api/v1/user/data",
        content_type: "application/json",
        authenticated: true,
        rate_limit: "global",
        params: {
          query: { type: ["string", "object"], allow_empty: false },
          data: { type: Users.Endpoints.JsonValueSchemaType }
        },
        callback: async (stream, params) => {
          const query = init_user_data_query(stream, stream.uid, params.query);
          if (!query)
            return;
          await this.public.set(query, { data: params.data }, { retry: 3, flatten: true });
          return stream.send({
            status: import_status.Status.success,
            data: { message: "Successfully saved." }
          });
        }
      });
      this.server.endpoint({
        method: "DELETE",
        endpoint: "/volt/api/v1/user/data",
        content_type: "application/json",
        authenticated: true,
        rate_limit: "global",
        params: {
          query: { type: ["string", "object"], allow_empty: false }
        },
        callback: async (stream, params) => {
          const query = init_user_data_query(stream, stream.uid, params.query);
          if (!query)
            return;
          await this.public.delete(query);
          return stream.send({
            status: import_status.Status.success,
            data: { message: "Successfully deleted." }
          });
        }
      });
      this.server.endpoint({
        method: "GET",
        endpoint: "/volt/api/v1/user/data/protected",
        content_type: "application/json",
        authenticated: true,
        rate_limit: "global",
        params: {
          query: { type: ["string", "object"], allow_empty: false },
          default: { type: Users.Endpoints.JsonValueSchemaType, required: false }
        },
        callback: async (stream, params) => {
          const query = init_user_data_query(stream, stream.uid, params.query);
          if (!query)
            return;
          try {
            const document = await this.protected.load(query, {
              default: params.default ? { ...query, data: params.default } : void 0,
              retry: 3
            });
            return stream.send({
              status: import_status.Status.success,
              data: {
                message: "Successfully loaded the requested document.",
                data: document.data
              }
            });
          } catch (e) {
            if (e instanceof import_collection.Collection.NotFoundError) {
              return stream.error({
                message: "Document not found.",
                type: "document_not_found",
                status: import_status.Status.not_found
              });
            }
            throw e;
          }
        }
      });
      this.server.endpoint({
        method: "GET",
        endpoint: "/volt/api/v1/support/pin",
        content_type: "application/json",
        authenticated: true,
        rate_limit: "global",
        callback: async (stream) => {
          const pin = await this.get_support_pin(stream.uid);
          return stream.success({
            data: {
              message: "Successfully retrieved your support PIN.",
              pin
            }
          });
        }
      });
      this.server.endpoint({
        method: "POST",
        endpoint: "/volt/api/v1/support/submit",
        content_type: "application/json",
        rate_limit: [
          "global",
          {
            interval: 3600 * 24,
            limit: 5
          }
        ],
        params: {
          subject: { type: "string", required: false, allow_empty: false },
          type: { type: "string", required: false, allow_empty: false },
          support_pin: { type: "string", required: false, allow_empty: false },
          email: { type: "string", required: false, allow_empty: false },
          first_name: { type: "string", required: false, allow_empty: false },
          last_name: { type: "string", required: false, allow_empty: false },
          summary: { type: "string", required: true, allow_empty: false },
          detailed: { type: "string", required: false, allow_empty: false },
          attachments: { type: "array", required: false, value_schema: {
            type: "object",
            schema: import_mail.Mail.Attachment.RestAPI.Schema
          } }
        },
        callback: async (stream, params) => {
          if (!this.support_recipient) {
            throw new import_errors.ExternalError({
              status: import_status.Status.unavailable_for_legal_reasons,
              type: "NoSMTPSender",
              message: "This server does not have a SMTP sender configured."
            });
          }
          this.server.assert_mail();
          let user = null, email, first_name, last_name;
          if (stream.uid == null) {
            try {
              email = stream.param("email");
              first_name = stream.param("first_name");
              last_name = stream.param("last_name");
            } catch (err) {
              return stream.error({ status: import_status.Status.bad_request, message: err.message });
            }
          } else {
            user = await this.get(stream.uid);
            email = user.email;
            first_name = user.first_name;
            last_name = user.last_name;
          }
          let body = "";
          const subject = params.subject || (params.type == null ? "Support" : `Support ${params.type}`);
          body += `<h1>${subject}</h1>`;
          if (params.type) {
            body += `<span style='font-weight: bold'>Type</span>: ${params.type}<br>`;
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
          } else {
            body += `<span style='font-weight: bold'>Support PIN</span>: Unknown<br>`;
          }
          if (params.summary) {
            body += `<br><span style='font-weight: bold'>Summary</span>:<br>${params.summary}<br>`;
          }
          if (params.detailed) {
            body += `<br><span style='font-weight: bold'>Detailed</span>:<br>${params.detailed}<br>`;
          }
          for (const key of Object.keys(params)) {
            switch (key) {
              case "subject":
              case "type":
              case "support_pin":
              case "summary":
              case "detailed":
              case "attachments":
              case "recipient":
                continue;
              default:
                body += `<br><span style='font-weight: bold'>${key}</span>: ${params[key]}<br>`;
            }
          }
          body += "<br>";
          await this.server.mail.send({
            // Only send to support_recipient since we dont want users/people to send emails to random people.
            recipients: [this.support_recipient],
            subject,
            body,
            attachments: params.attachments,
            max_attachments_size: 5 * 1024 * 1024,
            // 5 MB
            allow_untrusted_urls: false
          });
          return stream.success({
            data: { message: "Successfully sent your request." }
          });
        }
      });
    }
  }
  // ---------------------------------------------------------
  // Public methods.
  // ---------------------------------------------------------
  /**
   * DEVELOPMENT:
   * @warning
   * If you change {@link Users.UID_CHARSET} or {@link Users.UID_LENGTH},
   * update {@link Users.LEGACY_UID_LENGTHS} for backward compatibility.
   */
  /**
   * Validate a UID against ASCII charset and allowed lengths (current + legacy).
   */
  is_valid_uid(uid) {
    const len = uid.length;
    if (len !== Users.UID_LENGTH) {
      let ok = false;
      for (let i = 0; i < Users.LEGACY_UID_LENGTHS.length; i++) {
        if (len === Users.LEGACY_UID_LENGTHS[i]) {
          ok = true;
          break;
        }
      }
      if (!ok)
        return false;
    }
    const allow = Users.UID_ALLOW;
    for (let i = 0; i < len; i++) {
      const code = uid.charCodeAt(i);
      if (code >= 128 || allow[code] === 0)
        return false;
    }
    return true;
  }
  /**
   * Check if a uid exists.
   * @param uid The user ID to check.
   * @returns True if a user with the given uid exists.
   */
  async uid_exists(uid) {
    return await this._users_db.exists({ uid });
  }
  /**
   * Check if a username exists.
   * @returns Returns a boolean indicating whether the username exists or not.
   * @param username The username to check.
   * @example
   * const exists = await server.users.username_exists("someusername");
   */
  async username_exists(username) {
    return await this._users_db.exists({ username });
  }
  /**
   * Check if an email exists.
   * @returns Returns a boolean indicating whether the email exists or not.
   * @param email The email to check.
   * @example
   * const exists = await server.users.email_exists("some@email.com");
   */
  async email_exists(email) {
    return await this._users_db.exists({ email });
  }
  /**
   * Check if a user account is activated.
   * @returns Returns a boolean indicating whether the account is activated or not.
   * @param uid The id of the user.
   * @example
   * const activated = await server.users.is_activated("0");
   */
  async is_activated(uid) {
    return (await this.get(uid)).is_activated === true;
  }
  /**
   * Set the activated status of a user account.
   * @param uid The user id.
   * @param is_activated The boolean with the new activated status.
   * @example
   * await server.users.set_activated("1", true);
   */
  async set_activated(uid, is_activated) {
    await this._sys_set(uid, { is_activated });
  }
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
   */
  async create({ first_name, last_name, username, email, password, verify_password, phone_number = "", is_activated = void 0, _check_username_email = false }) {
    vlib.schema.validate(arguments[0], {
      unknown: false,
      throw: true,
      schema: {
        first_name: "string",
        last_name: "string",
        username: "string",
        email: "string",
        password: "string",
        verify_password: { type: "string", required: false },
        phone_number: { type: "string", required: false },
        is_activated: { type: "boolean", required: false },
        _check_username_email: { type: "boolean", required: false }
      }
    });
    const { error, invalid_fields } = this._verify_new_pass(password, verify_password ?? password);
    if (error) {
      throw new import_errors.ExternalError({
        type: "InvalidPassword",
        message: `Invalid password: ${error}.`,
        status: import_status.Status.bad_request,
        invalid_fields
      });
    }
    if (_check_username_email) {
      if (await this.username_exists(username)) {
        throw new import_errors.ExternalError({
          type: "UsernameAlreadyExists",
          message: `Username "${username}" is already registered.`,
          status: import_status.Status.bad_request,
          invalid_fields: { "username": "Username is already registered" }
        });
      }
      if (await this.email_exists(email)) {
        throw new import_errors.ExternalError({
          type: "EmailAlreadyExists",
          message: `Email "${email}" is already registered.`,
          status: import_status.Status.bad_request,
          invalid_fields: { "email": "Email is already registered" }
        });
      }
    }
    const uid = await this._generate_uid();
    const user = {
      uid,
      first_name,
      last_name,
      username,
      email,
      password: await this._hash_password(password),
      phone_number,
      created_at: Date.now(),
      api_key: void 0,
      // api key can be undefined, it doesnt have to be set.
      support_pin: this._generate_code(8),
      is_activated: is_activated ?? !this.enable_account_activation
    };
    await this._users_db.set({ uid }, user);
    for (const cb of this.server.events.get("create_user")) {
      try {
        await cb({ user });
      } catch (err) {
        this.server.log.error(new Error(`Encountered an error in event callback "create_user".`, { cause: err }));
      }
    }
    return uid;
  }
  /**
   * Delete a user account and associated data.
   * @param uid The user id.
   * @example
   * await server.users.delete("0");
   */
  async delete(uid) {
    const user = await this.get(uid);
    if (!user) {
      throw new import_errors.ExternalError({ status: import_status.Status.not_found, type: "UserNotFound", message: `User with uid "${uid}" not found.` });
    }
    await this._users_db.delete_many({ uid });
    await this._tokens_db.delete_many({ uid });
    await this._2fa_tokens_db.delete_many({ uid });
    await this.public.delete_many({ uid });
    await this.protected.delete_many({ uid });
    await this.private.delete_many({ uid });
    if (this.server.payments !== void 0) {
      await this.server.payments._delete_user(uid);
    }
    for (const cb of this.server.events.get("delete_user")) {
      try {
        await cb({ user });
      } catch (err) {
        this.server.log.error(new Error(`Encountered an error in event callback "delete_user".`, { cause: err }));
      }
    }
  }
  /**
   * Set a user's first name. Throws if uid does not exist.
   * @param uid The user id.
   * @param first_name The new first name.
   * @example
   * await server.users.set_first_name("1", "John");
   */
  async set_first_name(uid, first_name) {
    await this._sys_set(uid, { first_name });
  }
  /**
   * Set a user's last name. Throws if uid does not exist.
   * @param uid The user id.
   * @param last_name The new last name.
   * @example
   * await server.users.set_last_name("1", "Doe");
   */
  async set_last_name(uid, last_name) {
    await this._sys_set(uid, { last_name });
  }
  /**
   * Set a user's username. Throws if uid does not exist.
   * @param uid The user id.
   * @param username The new username.
   * @example
   * await server.users.set_username("1", "newusername");
   */
  async set_username(uid, username) {
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
  async set_email(uid, email) {
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
  async set_password(uid, password, verify_password) {
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
  async set(uid, data) {
    let old_data;
    const set_data = {};
    for (const key of Object.keys(data)) {
      if (data[key] === void 0)
        continue;
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
          if (old_data === void 0) {
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
          if (old_data === void 0) {
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
  async _sys_set(uid, data) {
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
  async get(uid) {
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
  async get_by_username(username) {
    return await this._users_db.load({ username });
  }
  /**
   * Get a user by uid or username.
   * This function can be used if you have a variable which can be both.
   * Throws if the username does not exist.
   * @returns Returns a User object.
   * @param username The username of the user to fetch.
   * @throws {Collection.NotFoundError} If the username or uid does not exist.
   * @example
   * const user = await server.users.get_by_username("myusername");
   */
  async get_by_uid_or_username(uid_or_username) {
    return await this._users_db.load({
      $or: [
        { uid: uid_or_username },
        { username: uid_or_username }
      ]
    });
  }
  /**
   * Get a user by email. Throws if the email does not exist.
   * @returns Returns a User object.
   * @param email The email of the user to fetch.
   * @throws {Collection.NotFoundError} If the email does not exist.
   * @example
   * const user = await server.users.get_by_email("my@email.com");
   */
  async get_by_email(email) {
    return await this._users_db.load({ email });
  }
  /**
   * Get a user by API key. Throws if invalid.
   * @returns Returns a User object.
   * @param api_key The API key of the user to fetch.
   * @example
   * const user = await server.users.get_by_api_key("XXXXXX");
   */
  async get_by_api_key(api_key) {
    const uid = this.get_uid_by_api_key(api_key);
    if (!uid)
      throw new Error("Unable to find a user by api key.");
    const user = await this.get(uid);
    const ok = await this.verify_api_key_by_uid(uid, api_key);
    if (!ok)
      throw new Error("Unable to find a user by api key.");
    return user;
  }
  /**
   * Get a user by token. Throws if invalid.
   * @returns Returns a User object.
   * @param token The authentication token of the user to fetch.
   * @example
   * const user = await server.users.get_by_token("XXXXXX");
   */
  async get_by_token(token) {
    const uid = this.get_uid_by_token(token);
    if (!uid)
      throw new Error("Unable to find a user by token.");
    const ok = await this.verify_token_by_uid(uid, token);
    if (!ok)
      throw new Error("Unable to find a user by token.");
    return await this.get(uid);
  }
  /**
   * Get a uid by username.
   * @returns Returns the uid of the username, or undefined if not found.
   * @param username The username of the uid to fetch.
   * @example
   * const uid = await server.users.get_uid("myusername");
   */
  async get_uid(username) {
    try {
      return (await this.get_by_username(username)).uid;
    } catch (e) {
      return void 0;
    }
  }
  /**
   * Get a uid by username.
   * @returns Returns the uid of the username, or undefined if not found.
   * @param username The username of the uid to fetch.
   * @example
   * const uid = await server.users.get_uid_by_username("myuser");
   */
  async get_uid_by_username(username) {
    try {
      return (await this.get_by_username(username)).uid;
    } catch (e) {
      return void 0;
    }
  }
  /**
   * Get a uid by email.
   * @returns Returns the uid of the email, or undefined if not found.
   * @param email The email of the uid to fetch.
   * @example
   * const uid = await server.users.get_uid_by_email("my@email.com");
   */
  async get_uid_by_email(email) {
    try {
      return (await this.get_by_email(email)).uid;
    } catch (e) {
      return void 0;
    }
  }
  /**
   * Get a uid by API key.
   * @returns Returns the uid for the API key, or undefined if not valid.
   * @param api_key The API key to parse.
   * @example
   * const uid = server.users.get_uid_by_api_key("XXXXXXXXXX");
   */
  get_uid_by_api_key(api_key) {
    return this._parse_uid_from_token_api_key(api_key, "ak_");
  }
  /**
   * Get a uid by token.
   * @returns Returns the uid for the token, or undefined if not valid.
   * @param token The token to parse.
   * @example
   * const uid = server.users.get_uid_by_token("XXXXXXXXXX");
   */
  get_uid_by_token(token) {
    return this._parse_uid_from_token_api_key(token, "tk_");
  }
  /**
   * Get a user's support pin by uid.
   * @returns Returns the support PIN string.
   * @param uid The user id.
   * @example
   * const pin = await server.users.get_support_pin("1");
   */
  async get_support_pin(uid) {
    return (await this.get(uid)).support_pin;
  }
  /**
   * Generate an API key for a user and store its hash. Overwrites existing keys.
   * @returns Returns the API key string (plaintext).
   * @param uid The user id.
   * @example
   * const api_key = await server.users.generate_api_key("0");
   */
  async generate_api_key(uid) {
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
  async has_api_key(uid) {
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
  async revoke_api_key(uid) {
    await this._users_db.save({ uid }, { $unset: { api_key: "" } }, { upsert: false });
  }
  /**
   * Verify a plaintext password.
   * @returns Returns a boolean indicating whether the verification was successful.
   * @param uid The user id.
   * @param password The plaintext password.
   * @example
   * const success = await server.users.verify_password("1", "XXXXXX");
   */
  async verify_password(uid, password) {
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
  async verify_api_key(api_key) {
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
  async verify_api_key_by_uid(uid, api_key) {
    try {
      if (!uid)
        return false;
      const user = await this.get(uid);
      return user.uid != null && user.api_key != null && user.api_key?.length > 0 && await this._verify_password(api_key, user.api_key);
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
  async verify_token(token) {
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
  async verify_token_by_uid(uid, token) {
    try {
      if (!uid)
        return false;
      const correct_token = await this._tokens_db.load({ uid });
      return correct_token != null && correct_token.token != null && correct_token.active !== false && Date.now() < correct_token.expiration && await this._verify_password(token, correct_token.token);
    } catch (err) {
      if (err instanceof import_collection.Collection.NotFoundError) {
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
  async verify_2fa(uid, code) {
    try {
      const auth = await this._2fa_tokens_db.load({ uid });
      const now = Date.now();
      if (now >= auth.expiration) {
        await this._deactivate_2fa_token(uid);
        return "The 2FA code has expired.";
      }
      const status = auth != null && auth.code != null && now < auth.expiration && auth.code == code && auth.active !== false;
      if (status === false) {
        return "Invalid 2FA code.";
      }
      await this._deactivate_2fa_token(uid);
      return;
    } catch (err) {
      if (err instanceof import_collection.Collection.NotFoundError) {
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
  async send_2fa({ uid, stream, expiration = 300, _user_agent = void 0, _username = void 0, _email = void 0 }) {
    let code;
    if (_username == null && _email == null) {
      code = await this._create_2fa_token(uid, expiration);
      const user = await this.get(uid);
      _username = user.username;
      _email = user.email;
    } else {
      code = await this._create_2fa_token(_email, expiration);
    }
    const user_agent = _user_agent ?? (stream.headers["user-agent"] ?? "Unknown");
    if (this.server.on_2fa_mail === void 0) {
      throw Error('Define server callback "Server.on_2fa_mail" to generate the HTML mail body.');
    }
    let mail = this.server.on_2fa_mail({
      code,
      username: _username,
      email: _email,
      date: (/* @__PURE__ */ new Date()).toUTCString(),
      ip: stream.ip,
      device: user_agent
    });
    let body = mail, subject;
    if (mail instanceof MailUI.MailElement) {
      body = mail.html();
      subject = mail.subject();
    }
    this.server.assert_mail();
    await this.server.mail.send({
      recipients: [_email],
      subject: subject ?? "Two Factor Authentication Code",
      body
    });
  }
  /**
   * List all users.
   * @returns An array of User objects.
   */
  async list() {
    return await this._users_db.list_all();
  }
}
(function(Users2) {
  let Endpoints;
  (function(Endpoints2) {
    Endpoints2.JsonValueSchemaType = [
      "string",
      "number",
      "boolean",
      "null",
      "array",
      "object"
    ];
  })(Endpoints = Users2.Endpoints || (Users2.Endpoints = {}));
})(Users || (Users = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Users
});
