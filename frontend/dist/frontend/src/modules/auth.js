/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
import { request } from "./request.js";
// Namespace.
export var Auth;
(function (Auth) {
    /**
     * Make a sign in request.
     * @param payload The request payload.
     * @docs
     */
    function sign_in(payload) {
        return request({
            method: "POST",
            url: "/volt/api/v1/auth/signin",
            data: payload,
        });
    }
    Auth.sign_in = sign_in;
    /**
     * Make a sign up request.
     *
     * Note that a request can be made first without the `payload.code` field,
     * when all other fields are correctly defined it will return a {@link Status.two_factor_auth_required} backend status.
     * Indicating a two-factor authentication challenge is sent, prompt the user to the next screen where the user can fill in the 2fa code.
     * Then retrieve the 2fa code and resubmit the request with the code included.
     *
     * @param payload The request payload.
     * @docs
     */
    function sign_up(payload) {
        return request({
            method: "POST",
            url: "/volt/api/v1/auth/signup",
            data: payload,
        });
    }
    Auth.sign_up = sign_up;
    /**
     * Make a sign out request.
     * @docs
     */
    function sign_out() {
        return request({
            method: "POST",
            url: "/volt/api/v1/auth/signout",
        });
    }
    Auth.sign_out = sign_out;
    /**
     * Make a send 2FA request.
     * @param payload The request payload.
     * @docs
     */
    function send_2fa(payload) {
        return request({
            method: "POST",
            url: "/volt/api/v1/auth/2fa",
            data: payload,
        });
    }
    Auth.send_2fa = send_2fa;
    /**
     * Make a forgot password request.
     * @param payload The request payload.
     * @docs
     */
    function forgot_password(payload) {
        return request({
            method: "POST",
            url: "/volt/api/v1/auth/forgot_password",
            data: payload,
        });
    }
    Auth.forgot_password = forgot_password;
})(Auth || (Auth = {}));
;
export { Auth as auth }; // also export as lowercase for compatibility.
