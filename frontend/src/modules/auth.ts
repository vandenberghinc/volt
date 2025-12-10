/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */

// Imports.
import type { Users as UsersBackend } from "../../../backend/src/users.js";
import { Request, request } from "./request.js";

// Namespace.
export namespace Auth {

    /**
     * Make a sign in request.
     * @param payload The request payload.
     * @docs
     */
    export function sign_in(
        payload: UsersBackend.Endpoints.SignIn["payload"]
    ): Request.ResultPromiseFromInfo<UsersBackend.Endpoints.SignIn> {
        return request<UsersBackend.Endpoints.SignIn>({
            method: "POST",
            url: "/volt/api/v1/auth/signin",
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
        payload: UsersBackend.Endpoints.SignUp["payload"]
    ): Request.ResultPromiseFromInfo<UsersBackend.Endpoints.SignUp> {
        return request<UsersBackend.Endpoints.SignUp>({
            method: "POST",
            url: "/volt/api/v1/auth/signup",
            data: payload,
        });
    }

    /**
     * Make a sign out request.
     * @docs
     */
    export function sign_out(): Request.ResultPromiseFromInfo<UsersBackend.Endpoints.SignOut> {
        return request<UsersBackend.Endpoints.SignOut>({
            method: "POST",
            url: "/volt/api/v1/auth/signout",
        });
    }

    /**
     * Make a send 2FA request.
     * @param payload The request payload.
     * @docs
     */
    export function send_2fa(
        payload: UsersBackend.Endpoints.Send2FA["payload"]
    ): Request.ResultPromiseFromInfo<UsersBackend.Endpoints.Send2FA> {
        return request<UsersBackend.Endpoints.Send2FA>({
            method: "POST",
            url: "/volt/api/v1/auth/2fa",
            data: payload,
        });
    }

    /**
     * Make a forgot password request.
     * @param payload The request payload.
     * @docs
     */
    export function forgot_password(
        payload: UsersBackend.Endpoints.ForgotPassword["payload"]
    ): Request.ResultPromiseFromInfo<UsersBackend.Endpoints.ForgotPassword> {
        return request<UsersBackend.Endpoints.ForgotPassword>({
            method: "POST",
            url: "/volt/api/v1/auth/forgot_password",
            data: payload,
        });
    }

};
export { Auth as auth }; // also export as lowercase for compatibility.
