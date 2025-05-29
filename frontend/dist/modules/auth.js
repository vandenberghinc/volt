/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */
// Imports.
import { Utils } from "./utils.js";
// Namespace.
export var Auth;
(function (Auth) {
    ;
    ;
    ;
    ;
    ;
    // Sign in.
    /*	@docs:
        @nav: Frontend
        @chapter: Authentication
        @title: Sign In
        @desc: Make a sign in request.
        @param:
            @name: email
            @description The user's email. Either the username or email is required.
        @param:
            @name: username
            @description The user's username. Either the username or email is required.
        @param:
            @name: password
            @description The user's password.
        @param:
            @name: code
            @description The user's 2fa code. Only required when 2fa is enabled in the server.
     */
    function sign_in({ email = "", username = "", password = "", code = "", }) {
        return Utils.request_v1({
            method: "POST",
            url: "/volt/auth/signin",
            data: {
                email: email,
                username: username,
                password: password,
                code: code,
            },
        });
    }
    Auth.sign_in = sign_in;
    // Sign up.
    /*	@docs:
        @nav: Frontend
        @chapter: Authentication
        @title: Sign Up
        @desc: Make a sign up request.
     */
    function sign_up({ username = "", email = "", first_name = "", last_name = "", password = "", verify_password = "", phone_number = "", code = "", }) {
        return Utils.request_v1({
            method: "POST",
            url: "/volt/auth/signup",
            data: {
                username,
                email,
                first_name,
                last_name,
                password,
                verify_password,
                phone_number,
                code,
            },
        });
    }
    Auth.sign_up = sign_up;
    // Sign out.
    /*	@docs:
        @nav: Frontend
        @chapter: Authentication
        @title: Sign Out
        @desc: Make a sign out request.
     */
    function sign_out() {
        return Utils.request_v1({
            method: "POST",
            url: "/volt/auth/signout",
        });
    }
    Auth.sign_out = sign_out;
    // Send 2fa.
    /*	@docs:
        @nav: Frontend
        @chapter: Authentication
        @title: Send 2FA
        @desc: Make a send 2FA request.
        @param:
            @name: email
            @description The user's email.
     */
    function send_2fa(email) {
        return Utils.request_v1({
            method: "GET",
            url: "/volt/auth/2fa",
            data: {
                email: email,
            },
        });
    }
    Auth.send_2fa = send_2fa;
    // Forgot password.
    /*	@docs:
        @nav: Frontend
        @chapter: Authentication
        @title: Forgot Password
        @desc: Make a forgot password request.
        @param:
            @name: email
            @description The user's email.
        @param:
            @name: code
            @description The user's 2fa code.
        @param:
            @name: password
            @description The user's new password.
        @param:
            @name: verify_password
            @description The user's new password.
     */
    function forgot_password({ email = "", code = "", password = "", verify_password = "", }) {
        return Utils.request_v1({
            method: "POST",
            url: "/volt/auth/forgot_password",
            data: {
                email: email,
                code: code,
                password: password,
                verify_password: verify_password,
            },
        });
    }
    Auth.forgot_password = forgot_password;
})(Auth || (Auth = {}));
;
export { Auth as auth }; // also export as lowercase for compatibility.
