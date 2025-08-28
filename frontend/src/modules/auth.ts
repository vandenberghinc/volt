/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import type { Users as UsersBackend } from "../../../backend/src/users.js";
import { Utils } from "./utils.js"

// Namespace.
export namespace Auth {

    /**
     * Make a sign in request.
     * @param payload The request payload.
     * @docs
     */
    export function sign_in(
        payload: UsersBackend.Endpoints.SignIn.Params
    ): Utils.RequestResultPromise<UsersBackend.Endpoints.SignIn.Result> {
        return Utils.request({
            method: "POST",
            url: "/volt/auth/signin",
            data: payload,
        });
    }

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
    export function sign_up(
        payload: UsersBackend.Endpoints.SignUp.Params
    ): Utils.RequestResultPromise<UsersBackend.Endpoints.SignUp.Result> {
        return Utils.request({
            method: "POST",
            url: "/volt/auth/signup",
            data: payload,
        });
    }

    /**
     * Make a sign out request.
     * @docs
     */
    export function sign_out(): Utils.RequestResultPromise<UsersBackend.Endpoints.SignOut.Result> {
        return Utils.request({
            method: "POST",
            url: "/volt/auth/signout",
        });
    }

    /**
     * Make a send 2FA request.
     * @param payload The request payload.
     * @docs
     */
    export function send_2fa(
        payload: UsersBackend.Endpoints.Send2FA.Params
    ): Utils.RequestResultPromise<UsersBackend.Endpoints.Send2FA.Result> {
        return Utils.request({
            method: "POST",
            url: "/volt/auth/2fa",
            data: payload,
        });
    }

    /**
     * Make a forgot password request.
     * @param payload The request payload.
     * @docs
     */
    export function forgot_password(
        payload: UsersBackend.Endpoints.ForgotPassword.Params
    ): Utils.RequestResultPromise<UsersBackend.Endpoints.ForgotPassword.Result> {
        return Utils.request({
            method: "POST",
            url: "/volt/auth/forgot_password",
            data: payload,
        });
    }

};
export { Auth as auth }; // also export as lowercase for compatibility.
