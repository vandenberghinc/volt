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
  Users: () => Users,
  default: () => stdin_default
});
module.exports = __toCommonJS(stdin_exports);
var vlib = __toESM(require("@vandenberghinc/vlib"));
var utils = __toESM(require("./utils.js"));
var Mail = __toESM(require("./plugins/mail/ui.js"));
var import_status = require("./status.js");
var import_logger = require("./logger.js");
const { ExternalError } = utils;
const { log, error } = import_logger.logger;
class Users {
  server;
  avg_send_2fa_time = [];
  _tokens_db;
  _users_db;
  public;
  protected;
  private;
  constructor(_server) {
    this.server = _server;
  }
  // ---------------------------------------------------------
  // Utils.
  // Generate a code.
  _generate_code(length = 6) {
    const charset = "0123456789";
    let key = "";
    for (let i = 0; i < length; i++) {
      key += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return key;
  }
  // Generate a str.
  _generate_str(length = 32) {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let key = "";
    for (let i = 0; i < length; i++) {
      key += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return key;
  }
  // Create a new uid.
  async _generate_uid() {
    while (true) {
      const uid = this._generate_str(16);
      if (await this.uid_exists(uid) === false) {
        return uid;
      }
    }
  }
  // Generate an api key.
  _generate_api_key(uid) {
    return `0${uid}:${this._generate_str(64)}`;
  }
  // Generate a token.
  _generate_token(uid) {
    return `1${uid}:${this._generate_str(64)}`;
  }
  // Check a password and the verify password.
  _verify_new_pass(pass, verify_pass) {
    let error2 = null;
    if (pass !== verify_pass) {
      error2 = "Passwords do not match.";
      return { error: error2, invalid_fields: { password: error2, verify_password: error2 } };
    } else if (pass.length < 8) {
      error2 = "The password should at least include eight characters.";
      return { error: error2, invalid_fields: { password: error2, verify_password: error2 } };
    } else if (pass.toLowerCase() === pass) {
      error2 = "The password should at least include one capital letter.";
      return { error: error2, invalid_fields: { password: error2, verify_password: error2 } };
    } else if (!/\d|[!@#$%^&*]/.test(pass)) {
      error2 = "The password should at least include one numeric or special character.";
      return { error: error2, invalid_fields: { password: error2, verify_password: error2 } };
    }
    return { error: null, invalid_fields: null };
  }
  // ---------------------------------------------------------
  // Authentication (private).
  // Generate a token by uid.
  async _create_token(uid) {
    const token = this._generate_token(uid);
    await this._tokens_db.save({ uid, type: "token" }, {
      expiration: Date.now() + this.server.token_expiration * 1e3,
      token: this.server._hmac(token),
      active: true
    });
    return token;
  }
  // Deactivate a token by uid.
  async _deactivate_token(uid) {
    await this._tokens_db.save({ uid, type: "token" }, { active: false });
  }
  // Create a 2FA token.
  async _create_2fa_token(uid_or_email, expiration) {
    const code = this._generate_code(6);
    await this._tokens_db.save({ uid: uid_or_email, type: "2fa" }, {
      expiration: Date.now() + expiration * 1e3,
      code,
      active: true
    });
    return code;
  }
  // Deactivate a 2FA token.
  async _deactivate_2fa_token(uid_or_email) {
    await this._tokens_db.save({ uid: uid_or_email, type: "2fa" }, { active: false });
  }
  // Perform authentication on a request.
  async _authenticate(stream) {
    const authorization = stream.headers["authorization"];
    if (authorization !== void 0) {
      if (typeof authorization !== "string") {
        return {
          status: import_status.Status.bad_request,
          data: "Invalid authorization header."
        };
      }
      if (!authorization.startsWith("Bearer ")) {
        return {
          status: import_status.Status.bad_request,
          data: 'Invalid authorization scheme, the authorization scheme must be "Bearer".'
        };
      }
      let api_key = "";
      for (let i = 7; i < authorization.length; i++) {
        const c = authorization[i];
        if (c == " ") {
          continue;
        }
        api_key += c;
      }
      let uid;
      try {
        uid = await this.get_uid_by_api_key(api_key);
      } catch (e) {
        return {
          status: import_status.Status.unauthorized,
          data: "Unauthorized."
        };
      }
      if (await this.verify_api_key_by_uid(uid, api_key) !== true) {
        return {
          status: import_status.Status.unauthorized,
          data: "Unauthorized."
        };
      }
      stream.uid = uid;
      return null;
    } else {
      if (stream.cookies.T == null || stream.cookies.T.value == null) {
        return {
          status: 302,
          headers: { Location: `/signin?next=${stream.endpoint}` },
          data: "Permission denied."
        };
      }
      const token = stream.cookies.T.value;
      let uid;
      try {
        uid = await this.get_uid_by_api_key(token);
      } catch (e) {
        return {
          status: 302,
          headers: { Location: `/signin?next=${stream.endpoint}` },
          data: "Permission denied."
        };
      }
      if (await this.verify_token_by_uid(uid, token) !== true) {
        return {
          status: 302,
          headers: { Location: `/signin?next=${stream.endpoint}` },
          data: "Permission denied."
        };
      }
      stream.uid = uid;
      return null;
    }
  }
  // Sign a user in and return a response.
  async _sign_in_response(stream, uid) {
    const token = await this._create_token(uid);
    this._create_token_cookie(stream, token);
    await this._create_user_cookie(stream, uid);
    await this._create_detailed_user_cookie(stream, uid);
    stream.send({
      status: 200,
      data: { message: "Successfully signed in." }
    });
  }
  // ---------------------------------------------------------
  // Cookies (private).
  // Create token headers.
  _create_token_cookie(stream, token) {
    stream.set_header("Cache-Control", "max-age=0, no-cache, no-store, must-revalidate, proxy-revalidate");
    stream.set_header("Access-Control-Allow-Credentials", "true");
    const expires = new Date((/* @__PURE__ */ new Date()).getTime() + this.server.token_expiration * 1e3);
    if (typeof token === "object") {
      token = token.token;
    }
    stream.set_cookie(`T=${token}; Max-Age=86400; Path=/; Expires=${expires.toUTCString()}; SameSite=None; ${this.server.https === void 0 ? "" : "Secure"}; HttpOnly;`);
  }
  // Create user headers.
  async _create_user_cookie(stream, uid) {
    const secure = this.server.https === void 0 ? "" : "Secure";
    if (typeof uid === "string") {
      stream.set_cookie(`UserID=${uid}; Path=/; SameSite=None; ${secure};`);
      const is_activated = this.server.enable_account_activation ? await this.is_activated(uid) : true;
      stream.set_cookie(`UserActivated=${is_activated}; Path=/; SameSite=None; ${secure};`);
    } else {
      stream.set_cookie(`UserID=-1; Path=/; SameSite=None; ${secure};`);
      const is_activated = this.server.enable_account_activation ? false : true;
      stream.set_cookie(`UserActivated=${is_activated}; Path=/; SameSite=None; ${secure};`);
    }
  }
  // Create detailed user headers.
  async _create_detailed_user_cookie(stream, uid) {
    const secure = this.server.https === void 0 ? "" : "Secure";
    const user = await this.get(uid);
    stream.set_cookie(`UserName=${user.username}; Path=/; SameSite=None; ${secure};`);
    stream.set_cookie(`UserFirstName=${user.first_name}; Path=/; SameSite=None; ${secure};`);
    stream.set_cookie(`UserLastName=${user.last_name}; Path=/; SameSite=None; ${secure};`);
    stream.set_cookie(`UserEmail=${user.email}; Path=/; SameSite=None; ${secure};`);
  }
  // Reset all default cookies.
  _reset_cookies(stream) {
    const secure = this.server.https === void 0 ? "" : "Secure";
    stream.set_cookie(`T=; Path=/; SameSite=None; ${secure}; HttpOnly;`);
    stream.set_cookie(`UserID=-1; Path=/; SameSite=None; ${secure};`);
    stream.set_cookie(`UserActivated=false; Path=/; SameSite=None; ${secure};`);
    stream.set_cookie(`UserName=; Path=/; SameSite=None; ${secure};`);
    stream.set_cookie(`UserFirstName=; Path=/; SameSite=None; ${secure};`);
    stream.set_cookie(`UserLastName=; Path=/; SameSite=None; ${secure};`);
    stream.set_cookie(`UserEmail=; Path=/; SameSite=None; ${secure};`);
  }
  // ---------------------------------------------------------
  // Initialization (private).
  // Initialize.
  async _initialize() {
    this._tokens_db = await this.server.db.collection({
      name: "Volt.Server.Users.Tokens",
      indexes: ["uid", "type", "token"]
    });
    this._users_db = await this.server.db.collection({
      name: "Volt.Server.Users.Users",
      indexes: ["email", "username", "uid", "api_key"]
    });
    this.public = await this.server.db.collection({
      name: "Volt.Server.Users.Public",
      indexes: ["uid", "path"]
    });
    this.protected = await this.server.db.collection({
      name: "Volt.Server.Users.Protected",
      indexes: ["uid", "path"]
    });
    this.private = await this.server.db.collection({
      name: "Volt.Server.Users.Private",
      indexes: ["uid", "path"]
    });
    this.server.endpoint(
      // Send 2fa.
      {
        method: "GET",
        endpoint: "/volt/auth/2fa",
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
      },
      // Sign in.
      {
        method: "POST",
        endpoint: "/volt/auth/signin",
        content_type: "application/json",
        rate_limit: {
          limit: 10,
          interval: 60,
          group: "volt.auth"
        },
        callback: async (stream) => {
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
            return stream.error({
              status: import_status.Status.bad_request,
              type: "InvalidParams",
              message: email_err.message
            });
          }
          try {
            password = stream.param("password");
          } catch (err) {
            return stream.error({
              status: import_status.Status.bad_request,
              type: "InvalidParams",
              message: err.message
            });
          }
          if (email) {
            if ((uid = await this.get_uid_by_email(email)) == null) {
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
          } else {
            if ((uid = await this.get_uid(username)) == null) {
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
          }
          if (await this.verify_password(uid, password)) {
            if (this.server.enable_2fa) {
              try {
                code = stream.param("code");
              } catch (err2) {
                const start_time = Date.now();
                await this.send_2fa({ uid, stream });
                if (this.avg_send_2fa_time.length >= 1e4) {
                  this.avg_send_2fa_time.shift();
                }
                this.avg_send_2fa_time.push(Date.now() - start_time);
                return stream.send({
                  status: import_status.Status.two_factor_auth_required,
                  data: { error: "2FA required." }
                });
              }
              const err = await this.verify_2fa(uid, code);
              if (err) {
                return stream.send({
                  status: import_status.Status.unauthorized,
                  data: {
                    error: "Invalid 2FA code.",
                    invalid_fields: {
                      "code": err
                    }
                  }
                });
              }
            }
            return await this._sign_in_response(stream, uid);
          }
          if (this.avg_send_2fa_time.length >= 10) {
            const sorted = [...this.avg_send_2fa_time].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            if (sorted.length % 2 === 0) {
              return (sorted[mid - 1] + sorted[mid]) / 2;
            }
            await new Promise((resolve) => setTimeout(resolve, sorted[mid]));
          }
          return stream.send({
            status: import_status.Status.unauthorized,
            data: {
              error: "Unauthorized.",
              invalid_fields: {
                "username": "Invalid or unrecognized username",
                "password": "Invalid or unrecognized password"
              }
            }
          });
        }
      },
      // Sign out.
      {
        method: "POST",
        endpoint: "/volt/auth/signout",
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
      },
      // Sign up.
      {
        method: "POST",
        endpoint: "/volt/auth/signup",
        content_type: "application/json",
        rate_limit: "global",
        params: {
          username: "string",
          first_name: "string",
          last_name: "string",
          email: "string",
          password: "string",
          verify_password: "string",
          phone_number: { type: "string", required: false },
          code: { type: "string", required: false }
        },
        callback: async (stream, params) => {
          const { error: error2, invalid_fields } = this._verify_new_pass(params.password, params.verify_password);
          if (error2) {
            return stream.error({
              status: import_status.Status.bad_request,
              type: "InvalidParams",
              message: error2,
              invalid_fields: invalid_fields ?? void 0
            });
          }
          if (await this.username_exists(params.username)) {
            throw new ExternalError({
              type: "UsernameAlreadyExists",
              message: `Username "${params.username}" is already registered.`,
              status: import_status.Status.bad_request,
              invalid_fields: { "username": "Username is already registered" }
            });
          }
          if (await this.email_exists(params.email)) {
            throw new ExternalError({
              type: "EmailAlreadyExists",
              message: `Email "${params.email}" is already registered.`,
              status: import_status.Status.bad_request,
              invalid_fields: { "email": "Email is already registered" }
            });
          }
          if (this.server.enable_2fa) {
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
              return stream.send({
                status: import_status.Status.two_factor_auth_required,
                data: { error: "2FA required." }
              });
            }
            const err = await this.verify_2fa(params.email, params.code);
            if (err) {
              return stream.send({
                status: import_status.Status.unauthorized,
                data: {
                  error: "Invalid 2FA code.",
                  invalid_fields: {
                    "code": err
                  }
                }
              });
            }
          }
          delete params.verify_password;
          delete params.code;
          params.is_activated = true;
          params._check_username_email = false;
          let uid;
          try {
            uid = await this.create(params);
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
      },
      // Activate account.
      {
        method: "POST",
        endpoint: "/volt/auth/activate",
        content_type: "application/json",
        rate_limit: "global",
        params: {
          "code": "string"
        },
        callback: async (stream, params) => {
          let uid = stream.uid;
          if (uid == null) {
            uid = stream.cookies["UserID"].value;
            if (uid === "null" || uid === "-1") {
              uid = null;
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
          return stream.success({ data: { message: "Successfully verified the 2FA code." } });
        }
      },
      // Forgot password.
      {
        method: "POST",
        endpoint: "/volt/auth/forgot_password",
        content_type: "application/json",
        rate_limit: "global",
        params: {
          email: "string",
          code: "string",
          password: "string",
          verify_password: "string"
        },
        callback: async (stream, params) => {
          const { error: error2, invalid_fields } = this._verify_new_pass(params.password, params.verify_password);
          if (error2) {
            return stream.error({
              status: import_status.Status.bad_request,
              message: error2,
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
      }
    );
    this.server.endpoint(
      // Get user.
      {
        method: "GET",
        endpoint: "/volt/user",
        content_type: "application/json",
        authenticated: true,
        rate_limit: "global",
        params: {
          // detailed: { type: "boolean", default: false },
        },
        callback: async (stream, params) => {
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
          user.api_key ??= "";
          user.support_pin ??= "";
          return stream.success({ data: user });
        }
      },
      // Set user.
      {
        method: "POST",
        endpoint: "/volt/user",
        content_type: "application/json",
        authenticated: true,
        rate_limit: "global",
        callback: async (stream) => {
          await this.set(stream.uid, stream.params);
          await this._create_detailed_user_cookie(stream, stream.uid);
          return stream.success({ data: { message: "Successfully updated your account." } });
        }
      },
      // Change password.
      {
        method: "POST",
        endpoint: "/volt/user/change_password",
        content_type: "application/json",
        authenticated: true,
        rate_limit: "global",
        params: {
          current_password: "string",
          password: "string",
          verify_password: "string"
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
          const { error: error2, invalid_fields } = this._verify_new_pass(params.password, params.verify_password);
          if (error2) {
            return stream.error({
              status: import_status.Status.bad_request,
              message: error2,
              invalid_fields: invalid_fields ?? void 0
            });
          }
          await this.set_password(stream.uid, params.password);
          return stream.success({
            status: import_status.Status.success,
            data: { message: "Successfully updated your password." }
          });
        }
      },
      // Delete account.
      {
        method: "DELETE",
        endpoint: "/volt/user",
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
      },
      // Generate API key.
      {
        method: "POST",
        endpoint: "/volt/user/api_key",
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
      },
      // Revoke API key.
      {
        method: "DELETE",
        endpoint: "/volt/user/api_key",
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
      },
      // Load data.
      {
        method: "GET",
        endpoint: "/volt/user/data",
        content_type: "application/json",
        authenticated: true,
        rate_limit: "global",
        params: {
          path: "string",
          default: { type: "string", default: null }
        },
        callback: async (stream, params) => {
          return stream.send({
            status: import_status.Status.success,
            data: await this.public.load({ uid: stream.uid, path: params.path }, { default: params.default })
          });
        }
      },
      // Save data.
      {
        method: "POST",
        endpoint: "/volt/user/data",
        content_type: "application/json",
        authenticated: true,
        rate_limit: "global",
        params: {
          path: "string",
          data: { type: void 0 }
        },
        callback: async (stream, params) => {
          await this.public.save({ uid: stream.uid, path: params.path }, params.data);
          return stream.send({
            status: import_status.Status.success,
            data: { message: "Successfully saved." }
          });
        }
      },
      // Delete data.
      {
        method: "DELETE",
        endpoint: "/volt/user/data",
        content_type: "application/json",
        authenticated: true,
        rate_limit: "global",
        params: {
          path: "string",
          data: { type: void 0 },
          recursive: { type: "string", default: false }
        },
        callback: async (stream, params) => {
          await this.public.delete({ uid: stream.uid, path: params.path }, params.recursive);
          return stream.send({
            status: import_status.Status.success,
            data: { message: "Successfully deleted." }
          });
        }
      },
      // Load protected data.
      {
        method: "GET",
        endpoint: "/volt/user/data/protected",
        content_type: "application/json",
        authenticated: true,
        rate_limit: "global",
        params: {
          path: "string",
          default: { type: "string", default: null }
        },
        callback: async (stream, params) => {
          return stream.send({
            status: import_status.Status.success,
            data: await this.protected.load({ uid: stream.uid, path: params.path }, { default: params.default })
          });
        }
      }
    );
    this.server.endpoint(
      // Get PIN.
      {
        method: "GET",
        endpoint: "/volt/support/pin",
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
      },
      // Support.
      // Supported params are: `support_pin`, `subject`, `summary`, `detailed`, `attachments`, `recipient` and `type`.
      {
        method: "POST",
        endpoint: "/volt/support/submit",
        content_type: "application/json",
        rate_limit: "global",
        callback: async (stream) => {
          let params = stream.params;
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
          body += "<br>";
          let attachments = [];
          if (params.attachments) {
            Object.keys(params.attachments).forEach((key) => {
              attachments.push({
                filename: key,
                content: Buffer.from(params.attachments[key], "utf-8")
              });
            });
          }
          await this.server.send_mail({
            recipients: [params.recipient || this.server.smtp_sender],
            subject,
            body,
            attachments
          });
          return stream.success({ data: { message: "Successfully sent your request." } });
        }
      }
    );
  }
  // ---------------------------------------------------------
  // Users.
  // Check if a username exists.
  async uid_exists(uid) {
    return await this._users_db.find({ uid }) != null;
  }
  // Check if a username exists.
  /*  @docs:
   *  @title: Username Exists
   *  @description: Check if a username exists.
   *  @type: boolean
   *  @return: Returns a boolean indicating whether the username exists or not.
   *  @parameter:
   *      @name: username
   *      @description: The username to check.
   *      @type: string
   *  @usage:
   *      ...
   *      const exists = await server.users.username_exists("someusername");
   */
  async username_exists(username) {
    return await this._users_db.find({ username }) != null;
  }
  // Check if an email exists.
  /*  @docs:
   *  @title: Email Exists
   *  @description: Check if a email exists.
   *  @type: boolean
   *  @return: Returns a boolean indicating whether the email exists or not.
   *  @parameter:
   *      @name: email
   *      @description: The email to check.
   *      @type: string
   *  @usage:
   *      ...
   *      const exists = await server.users.email_exists("some\@email.com");
   */
  async email_exists(email) {
    return await this._users_db.find({ email }) != null;
  }
  // Is activated.
  /*  @docs:
   *  @title: Is Activated
   *  @description: Check if a user account is activated.
   *  @return: Returns a boolean indicating whether the account is activated or not.
   *  @parameter:
   *      @name: uid
   *      @description: The id of the user.
   *      @type: string
   *      @cache: Users:uid:param
   *  @usage:
   *      ...
   *      const activated = await server.users.is_activated(0);
   */
  async is_activated(uid) {
    return (await this.get(uid)).is_activated == true;
  }
  // Set activated.
  /*  @docs:
   *  @title: Set Activated
   *  @description: Set the activated status of a user account is activated.
   *  @parameter:
   *      @name: uid
   *      @cached: Users:uid:param
   *  @parameter:
   *      @name: activated
   *      @description: The boolean with the new activated status.
   *      @type: boolean
   *  @usage:
   *      ...
   *      await server.users.set_activated(1, true);
   */
  async set_activated(uid, is_activated) {
    await this._sys_set(uid, { is_activated });
  }
  // Create a user.
  /*  @docs:
   *  @title: Create User
   *  @description:
   *      Create a user account.
   *
   *      Only the hashed password will be saved.
   *  @return: Returns the uid of the newly created user.
   *  @parameter:
   *      @name: first_name
   *      @description: The user's first name.
   *      @type: string
   *      @required: true
   *  @parameter:
   *      @name: last_name
   *      @description: The user's last name.
   *      @type: string
   *      @required: true
   *  @parameter:
   *      @name: username
   *      @description: The username of the new account.
   *      @type: string
   *      @required: true
   *  @parameter:
   *      @name: email
   *      @description: The email of the new account.
   *      @type: string
   *      @required: true
   *  @parameter:
   *      @name: password
   *      @description: The password of the new account.
   *      @type: string
   *      @required: true
   *  @parameter:
   *      @name: phone_number
   *      @description: The phone number of the user account.
   *      @type: string
   *  @parameter:
   *      @name: is_activated
   *      @description: A boolean indicating if the account should be set to activated or not, accounts created through the /volt/api/signup endpoint are always immediately activated due to the required 2FA code. When called manually the default value of `!Server.enable_account_activation` will be used for parameter `is_activated`.
   *      @type: boolean
   *  @parameter:
   *      @name: _check_username_email
   *      @ignore: true
   *  @usage:
   *      ...
   *      const uid = await server.users.create{
   *          first_name: "John",
   *          last_name: "Doe",
   *          username: "johndoe",
   *          email: "johndoe\@email.com",
   *          password: "HelloWorld!"
   *      });
   */
  async create({ first_name, last_name, username, email, password, phone_number = "", is_activated = null, _check_username_email = false }) {
    vlib.Scheme.verify({
      object: arguments[0],
      check_unknown: true,
      scheme: {
        first_name: "string",
        last_name: "string",
        username: "string",
        email: "string",
        password: "string",
        phone_number: { type: "string", default: "" },
        is_activated: { type: "boolean", required: false },
        _check_username_email: { type: "boolean", required: false }
      }
    });
    if (_check_username_email) {
      if (await this.username_exists(username)) {
        throw new ExternalError({
          type: "UsernameAlreadyExists",
          message: `Username "${username}" is already registered.`,
          status: import_status.Status.bad_request,
          invalid_fields: { "username": "Username is already registered" }
        });
      }
      if (await this.email_exists(email)) {
        throw new ExternalError({
          type: "EmailAlreadyExists",
          message: `Email "${email}" is already registered.`,
          status: import_status.Status.bad_request,
          invalid_fields: { "email": "Email is already registered" }
        });
      }
    }
    const uid = await this._generate_uid();
    await this._users_db.save({ uid }, {
      uid,
      first_name,
      last_name,
      username,
      email,
      password: this.server._hmac(password),
      phone_number,
      created: Date.now(),
      api_key: null,
      support_pin: this._generate_code(8),
      is_activated: is_activated ?? !this.server.enable_account_activation
    });
    return uid;
  }
  // Delete a user.
  /*  @docs:
   *  @title: Delete User
   *  @description: Delete a user account.
   *  @parameter:
   *      @name: uid
   *      @cached: Users:uid:param
   *  @usage:
   *      ...
   *      await server.users.delete(0);
   */
  async delete(uid) {
    await this._users_db.delete_all({ uid });
    await this._tokens_db.delete_all({ uid });
    await this.public.delete_all({ uid });
    await this.protected.delete_all({ uid });
    await this.private.delete_all({ uid });
    if (this.server.payments !== void 0) {
      await this.server.payments._delete_user(uid);
    }
    const res = this.server.on_delete_user({ uid });
    if (res instanceof Promise) {
      await res;
    }
  }
  // Set a user's first name.
  /*  @docs:
   *  @title: Set First Name
   *  @description:
   *      Set a user's first name
   *
   *      If the uid does not exist an `Error` will be thrown.
   *  @parameter:
   *      @name: uid
   *      @cached: Users:uid:param
   *  @parameter:
   *      @name: first_name
   *      @description: The new first name.
   *      @type: string
   *  @usage:
   *      ...
   *      await server.users.set_first_name(1, "John");
   */
  async set_first_name(uid, first_name) {
    const user = await this.get(uid);
    await this._sys_set(uid, { first_name });
  }
  // Set a user's last name.
  /*  @docs:
   *  @title: Set Last Name
   *  @description:
   *      Set a user's last name
   *
   *      If the uid does not exist an `Error` will be thrown.
   *  @parameter:
   *      @name: uid
   *      @cached: Users:uid:param
   *  @parameter:
   *      @name: last_name
   *      @description: The new last name.
   *      @type: string
   *  @usage:
   *      ...
   *      await server.users.set_last_name(1, "Doe");
   */
  async set_last_name(uid, last_name) {
    const user = await this.get(uid);
    await this._sys_set(uid, { last_name });
  }
  // Set a user's username.
  /*  @docs:
   *  @title: Set Username
   *  @description:
   *      Set a user's username
   *
   *      If the uid does not exist an `Error` will be thrown.
   *  @parameter:
   *      @name: uid
   *      @cached: Users:uid:param
   *  @parameter:
   *      @name: username
   *      @description: The new username.
   *      @type: string
   *  @usage:
   *      ...
   *      await server.users.set_username(1, "newusername");
   */
  async set_username(uid, username) {
    if (await this.username_exists(username)) {
      throw Error(`Username "${username}" already exists.`);
    }
    await this._sys_set(uid, { username });
  }
  // Set a user's email.
  /*  @docs:
   *  @title: Set Email
   *  @description:
   *      Set a user's email
   *
   *      If the uid does not exist an `Error` will be thrown.
   *  @parameter:
   *      @name: uid
   *      @cached: Users:uid:param
   *  @parameter:
   *      @name: email
   *      @description: The new email.
   *      @type: string
   *  @usage:
   *      ...
   *      await server.users.set_email(1, "new\@email.com");
   */
  async set_email(uid, email) {
    if (await this.email_exists(email)) {
      throw Error(`Email "${email}" already exists.`);
    }
    await this._sys_set(uid, { email });
  }
  // Set a user's password.
  /*  @docs:
   *  @title: Set Password
   *  @description:
   *      Set a user's password
   *
   *      If the uid does not exist an `Error` will be thrown.
   *  @parameter:
   *      @name: uid
   *      @cached: Users:uid:param
   *  @parameter:
   *      @name: password
   *      @description: The new password.
   *      @type: string
   *  @usage:
   *      ...
   *      await server.users.set_password(1, "XXXXXX");
   */
  async set_password(uid, password) {
    await this._sys_set(uid, { password: this.server._hmac(password) });
  }
  // Update a user.
  /*  @docs:
   *  @title: Set user
   *  @description:
   *      Set a user's data
   *
   *      This function only updates the passed user attributes, unpresent attributes will not be deleted.
   *
   *      If the uid does not exist an `Error` will be thrown.
   *
   *      @note: The username can not be changed using this function, use `Server.set_username()` instead.
   *      @note: The email can not be changed using this function, use `Server.set_email()` instead.
   *      @note: The password can not be changed using this function, use `Server.set_password()` instead.
   *  @parameter:
   *      @name: uid
   *      @cached: Users:uid:param
   *  @parameter:
   *      @name: data
   *      @description: The new user object.
   *      @type: object
   *  @usage:
   *      ...
   *      await server.users.set(1, {first_name: "John", last_name: "Doe"});
   */
  async set(uid, data) {
    let old_data;
    const set_data = {};
    for (const key of Object.keys(data)) {
      switch (key) {
        case "first_name":
        case "last_name":
        case "phone_number":
        case "is_activated":
          set_data[key] = data[key];
          break;
        case "password":
          set_data[key] = this.server._hmac(data[key]);
          break;
        case "username":
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
          break;
      }
    }
    data = await this._users_db.save({ uid }, set_data);
    if (data == null) {
      throw new Error(`Unable to find a user by uid "${uid}".`);
    }
    return data;
  }
  async _sys_set(uid, data) {
    data = await this._users_db.save({ uid }, data);
    if (data == null) {
      throw new Error(`Unable to find a user by uid "${uid}".`);
    }
    return data;
  }
  // Get user info by uid.
  /*  @docs:
   *  @title: Get User
   *  @description:
   *      Get a user by uid.
   *
   *      If the uid does not exist an `Error` will be thrown.
   *  @return:
   *      Returns a User object.
   *  @parameter:
   *      @name: uid
   *      @cached: Users:uid:param
   *  @parameter:
   *      @name: detailed
   *      @description: Also retrieve the detailed user data.
   *      @type: boolean
   *  @usage:
   *      ...
   *      const user = await server.users.get(0);
   */
  async get(uid) {
    const data = await this._users_db.load({ uid });
    if (data == null) {
      throw new Error(`Unable to find a user by uid "${uid}".`);
    }
    return data;
  }
  // Get user info by username.
  /*  @docs:
   *  @title: Get User By Username
   *  @description:
   *      Get a user by username.
   *
   *      If the username does not exist an `Error` will be thrown.
   *  @return:
   *      Returns a User object.
   *  @parameter:
   *      @name: username
   *      @description: The username of the user to fetch.
   *      @type: string
   *  @usage:
   *      ...
   *      const user = await server.users.get_by_username("myusername");
   */
  async get_by_username(username) {
    const data = await this._users_db.find({ username });
    if (data == null) {
      throw new Error(`Unable to find a user by username "${username}".`);
    }
    return data;
  }
  // Get user info by email.
  /*  @docs:
   *  @title: Get User By Email
   *  @description:
   *      Get a user by email.
   *
   *      If the email does not exist an `Error` will be thrown.
   *  @return:
   *      Returns a User object.
   *  @parameter:
   *      @name: email
   *      @description: The email of the user to fetch.
   *      @type: string
   *  @usage:
   *      ...
   *      const user = await server.users.get_by_email("my\@email.com");
   */
  async get_by_email(email) {
    const data = await this._users_db.find({ email });
    if (data == null) {
      throw new Error(`Unable to find a user by email "${email}".`);
    }
    return data;
  }
  // Get user info by api key.
  /*  @docs:
   *  @title: Get User By API Key
   *  @description:
   *      Get a user by API key.
   *
   *      If the API key does not exist an `Error` will be thrown.
   *  @return:
   *      Returns a User object.
   *  @parameter:
   *      @name: api_key
   *      @description: The API key of the user to fetch.
   *      @type: string
   *  @usage:
   *      ...
   *      const user = await server.users.get_by_api_key("XXXXXX");
   */
  async get_by_api_key(api_key) {
    const data = await this._users_db.find({ api_key });
    if (data == null) {
      throw new Error(`Unable to find a user by api key "${api_key}".`);
    }
    return data;
  }
  // Get user info by token.
  /*  @docs:
   *  @title: Get User By Token
   *  @description:
   *      Get a user by token.
   *
   *      If the token does not exist an `Error` will be thrown.
   *  @return:
   *      Returns a User object.
   *  @parameter:
   *      @name: token
   *      @description: The authentication token of the user to fetch.
   *      @type: string
   *  @usage:
   *      ...
   *      const user = await server.users.get_by_token("XXXXXX");
   */
  async get_by_token(token) {
    const data = await this._tokens_db.find({ type: "token", token });
    if (data == null) {
      throw new Error(`Unable to find a user by token "${token}".`);
    }
    return await this.get(data.uid);
  }
  // Get uid by username.
  /*  @docs:
   *  @title: Get UID
   *  @description: Get a uid by username.
   *  @return:
   *      Returns the uid of the username.
   *
   *      If the user does not exist `null` is returned.
   *  @parameter:
   *      @name: username
   *      @description: The username of the uid to fetch.
   *      @type: string
   *  @usage:
   *      ...
   *      let uid;
   *      if ((uid = await server.users.get_uid("myusername")) != null) { ... }
   */
  async get_uid(username) {
    try {
      return (await this.get_by_username(username)).uid;
    } catch (e) {
      return null;
    }
  }
  // Get uid by username.
  /*  @docs:
   *  @title: Get UID By Email
   *  @description: Get a uid by username.
   *  @return:
   *      Returns the uid of the username.
   *
   *      If the user does not exist `null` is returned.
   *  @parameter:
   *      @name: username
   *      @description: The username of the uid to fetch.
   *      @type: string
   *  @usage:
   *      ...
   *      let uid;
   *      if ((uid = await server.users.get_uid_by_username("myuser")) != null) { ... }
   */
  async get_uid_by_username(username) {
    try {
      return (await this.get_by_username(username)).uid;
    } catch (e) {
      return null;
    }
  }
  // Get uid by email.
  /*  @docs:
   *  @title: Get UID By Email
   *  @description: Get a uid by email.
   *  @return:
   *      Returns the uid of the email.
   *
   *      If the user does not exist `null` is returned.
   *  @parameter:
   *      @name: email
   *      @description: The email of the uid to fetch.
   *      @type: string
   *  @usage:
   *      ...
   *      let uid;
   *      if ((uid = await server.users.get_uid_by_email("my\@email.com")) != null) { ... }
   */
  async get_uid_by_email(email) {
    try {
      return (await this.get_by_email(email)).uid;
    } catch (e) {
      return null;
    }
  }
  // Get uid by api key.
  /*  @docs:
   *  @title: Get UID By API Key
   *  @description: Get a uid by API key.
   *  @return:
   *      Returns the uid of the api key.
   *
   *      If the user does not exist `null` is returned.
   *  @parameter:
   *      @name: api_key
   *      @description: The API key of the uid to fetch.
   *      @type: string
   *  @usage:
   *      ...
   *      let uid;
   *      if ((uid = await server.users.get_uid_by_api_key("XXXXXXXXXX")) != null) { ... }
   */
  async get_uid_by_api_key(api_key) {
    if (typeof api_key !== "string") {
      return null;
    }
    const pos = api_key.indexOf(":");
    if (pos === -1) {
      return null;
    }
    return api_key.substr(1, pos - 1);
  }
  // Get uid by token.
  /*  @docs:
   *  @title: Get UID By Token
   *  @description: Get a uid by token.
   *  @return:
   *      Returns the uid of the token.
   *
   *      If the user does not exist `null` is returned.
   *  @parameter:
   *      @name: token
   *      @description: The token of the uid to fetch.
   *      @type: string
   *  @usage:
   *      ...
   *      let uid;
   *      if ((uid = await server.users.get_uid_by_token("XXXXXXXXXX")) != null) { ... }
   */
  async get_uid_by_token(token) {
    return await this.get_uid_by_api_key(token);
  }
  // Get a user's support pin by uid.
  /*  @docs:
   *  @title: Get Support PIN
   *  @description:
   *      Get a user's support pin by uid.
   *  @return:
   *      Returns a User object.
   *  @parameter:
   *      @name: uid
   *      @cached: Users:uid:param
   *  @usage:
   *      ...
   *      const pin = await server.users.get_support_pin(1);
   */
  async get_support_pin(uid) {
    return (await this.get(uid)).support_pin;
  }
  // Generate an api key by uid.
  /*  @docs:
   *  @title: Generate API Key
   *  @description:
   *      Generate an API key for a user.
   *
   *      Generating an API key overwrites all existing API keys.
   *
   *      If the uid does not exist an `Error` will be thrown.
   *  @return:
   *      Returns the API key string.
   *  @parameter:
   *      @name: uid
   *      @cached: Users:uid:param
   *  @usage:
   *      ...
   *      const api_key = await server.users.generate_api_key(0);
   */
  async generate_api_key(uid) {
    const api_key = this._generate_api_key(uid);
    await this._sys_set(uid, { api_key: this.server._hmac(api_key) });
    return api_key;
  }
  // Revoke the API key of a user.
  /*  @docs:
   *  @title: Revoke API Key
   *  @description:
   *      Revoke the API key of a user.
   *
   *      If the uid does not exist an `Error` will be thrown.
   *  @parameter:
   *      @name: uid
   *      @cached: Users:uid:param
   *  @usage:
   *      ...
   *      await server.users.revoke_api_key(0);
   */
  async revoke_api_key(uid) {
    await this._sys_set(uid, { api_key: "" });
  }
  // Verify a plaintext password.
  // Use async to keep it persistent with other functions.
  /*  @docs:
   *  @title: Verify Password
   *  @description:
   *      Verify a plaintext password.
   *
   *      If the uid does not exist an `Error` will be thrown.
   *  @return:
   *      Returns a boolean indicating whether the verification was successful.
   *  @parameter:
   *      @name: uid
   *      @cached: Users:uid:param
   *  @parameter:
   *      @name: password
   *      @description: The plaintext password.
   *      @type: string
   *  @usage:
   *      ...
   *      const success = await server.users.verify_password(1, "XXXXXX");
   */
  async verify_password(uid, password) {
    try {
      const user = await this.get(uid);
      return user.uid != null && user.password === this.server._hmac(password);
    } catch (err) {
      return false;
    }
  }
  // Verify a plaintext api key.
  // Use async to keep it persistent with other functions.
  /*  @docs:
   *  @title: Verify API Key
   *  @description:
   *      Verify an plaintext API key.
   *
   *      If the uid does not exist an `Error` will be thrown.
   *  @return:
   *      Returns a boolean indicating whether the verification was successful.
   *  @parameter:
   *      @name: api_key
   *      @description: The api key to verify.
   *      @type: string
   *  @usage:
   *      ...
   *      const success = await server.users.verify_api_key("XXXXXX");
   */
  async verify_api_key(api_key) {
    return await this.verify_api_key_by_uid(await this.get_uid_by_api_key(api_key), api_key);
  }
  // Verify a plaintext api key by uid.
  // Use async to keep it persistent with other functions.
  /*  @docs:
   *  @title: Verify API Key By UID
   *  @description:
   *      Verify an plaintext API key by uid.
   *
   *      If the uid does not exist an `Error` will be thrown.
   *  @return:
   *      Returns a boolean indicating whether the verification was successful.
   *  @parameter:
   *      @name: uid
   *      @cached: Users:uid:param
   *  @parameter:
   *      @name: api_key
   *      @description: The api key to verify.
   *      @type: string
   *  @usage:
   *      ...
   *      const success = await server.users.verify_api_key_by_uid(1, "XXXXXX");
   */
  async verify_api_key_by_uid(uid, api_key) {
    try {
      const user = await this.get(uid);
      return user.uid != null && user.api_key != null && user.api_key?.length > 0 && user.api_key == this.server._hmac(api_key);
    } catch (err) {
      return false;
    }
  }
  // Verify a token.
  // Use async to keep it persistent with other functions.
  /*  @docs:
   *  @title: Verify Token
   *  @description:
   *      Verify an plaintext token.
   *
   *      If the uid does not exist an `Error` will be thrown.
   *  @return:
   *      Returns a boolean indicating whether the verification was successful.
   *  @parameter:
   *      @name: api_key
   *      @description: The token to verify.
   *      @type: string
   *  @usage:
   *      ...
   *      const success = await server.users.verify_token("XXXXXX");
   */
  async verify_token(token) {
    return await this.verify_token_by_uid(await this.get_uid_by_api_key(token), token);
  }
  // Verify a token by uid.
  // Use async to keep it persistent with other functions.
  /*  @docs:
   *  @title: Verify Token By UID.
   *  @description:
   *      Verify an plaintext token by uid.
   *
   *      If the uid does not exist an `Error` will be thrown.
   *  @return:
   *      Returns a boolean indicating whether the verification was successful.
   *  @parameter:
   *      @name: uid
   *      @cached: Users:uid:param
   *  @parameter:
   *      @name: api_key
   *      @description: The token to verify.
   *      @type: string
   *  @usage:
   *      ...
   *      const success = await server.users.verify_token_by_uid(1, "XXXXXX");
   */
  async verify_token_by_uid(uid, token) {
    try {
      const correct_token = await this._tokens_db.load({ uid, type: "token" });
      return correct_token != null && correct_token.token != null && correct_token.active !== false && Date.now() < correct_token.expiration && correct_token.token == this.server._hmac(token);
    } catch (err) {
      return false;
    }
  }
  // Verify a 2fa code.
  // Use async to keep it persistent with other functions.
  /*  @docs:
   *  @title: Verify 2FA Code
   *  @description:
   *      Verify a 2FA code by user id.
   *  @parameter:
   *      @name: uid
   *      @cached: Users:uid:param
   *  @parameter:
   *      @name: code
   *      @description: The 2FA code.
   *      @type: string
   *  @return: Returns a boolean indicating whether the verification was successful or not.
   *  @usage:
   *      ...
   *      await server.users.verify_2fa(1, "123456");
   */
  async verify_2fa(uid, code) {
    try {
      const auth = await this._tokens_db.load({ uid, type: "2fa" });
      if (auth == null) {
        return "Invalid 2FA code.";
      }
      const now = Date.now();
      if (now >= auth.expiration) {
        await this._deactivate_2fa_token(uid);
        return "The 2FA code has expired.";
      }
      const status = auth != null && auth.code != null && now < auth.expiration && auth.code == code && auth.active !== false;
      if (status === false) {
        return "Invalid 2FA code.";
      }
      return null;
    } catch (err) {
      error("Encountered an error while validating the 2FA code.");
      error(`${err}.`);
      return "Unknown error.";
    }
  }
  // Send a 2fa code.
  /*  @docs:
   *  @title: Send 2FA Code
   *  @description:
   *      Send a 2FA code to a user by user id.
   *
   *      By default the 2FA code will be valid for 5 minutes.
   *
   *      The mail body will be generated using the `Server.on_2fa_mail({code, username, email, date, ip, device})` callback. When the callback is not defined an error will be thrown.
   *  @return:
   *      Returns a promise that will be resolved or rejected when the 2fa mail has been sent.
   *  @parameter:
   *      @name: uid
   *      @cached: Users:uid:param
   *  @parameter:
   *      @name: stream
   *      @description: The stream object from the client request.
   *      @type: object
   *  @parameter:
   *      @name: expiration
   *      @description: The amount of seconds in which the code will expire.
   *      @type: number
   *  @usage:
   *      ...
   *      await server.users.send_2fa({uid: 0, stream});
   */
  async send_2fa({ uid, stream, expiration = 300, _device = null, _username = null, _email = null }) {
    let code;
    if (_username == null && _email == null) {
      code = await this._create_2fa_token(uid, expiration);
      const user = await this.get(uid);
      _username = user.username;
      _email = user.email;
    } else {
      code = await this._create_2fa_token(_email, expiration);
    }
    let device;
    if (_device == null) {
      device = stream.headers["user-agent"];
    }
    if (this.server.on_2fa_mail === void 0) {
      throw Error('Define server callback "Server.on_2fa_mail" to generate the HTML mail body.');
    }
    let mail = this.server.on_2fa_mail({
      code,
      username: _username,
      email: _email,
      date: (/* @__PURE__ */ new Date()).toUTCString(),
      ip: stream.ip,
      device: device ? device : "Unknown"
    });
    let body = mail, subject = null;
    if (mail instanceof Mail.MailElement) {
      body = mail.html();
      subject = mail.subject();
    }
    await this.server.send_mail({
      recipients: [_email],
      subject: subject ?? "Two Factor Authentication Code",
      body
    });
  }
  // List all users.
  async list() {
    return await this._users_db.list_all();
  }
}
var stdin_default = Users;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Users
});
