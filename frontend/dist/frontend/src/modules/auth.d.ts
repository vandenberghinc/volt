/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
import type { Users as UsersBackend } from "../../../backend/src/users.js";
import { Request } from "./request.js";
export declare namespace Auth {
    /**
     * Make a sign in request.
     * @param payload The request payload.
     * @docs
     */
    function sign_in(payload: UsersBackend.Endpoints.SignIn["payload"]): Request.ResultPromiseFromInfo<UsersBackend.Endpoints.SignIn>;
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
    function sign_up(payload: UsersBackend.Endpoints.SignUp["payload"]): Request.ResultPromiseFromInfo<UsersBackend.Endpoints.SignUp>;
    /**
     * Make a sign out request.
     * @docs
     */
    function sign_out(): Request.ResultPromiseFromInfo<UsersBackend.Endpoints.SignOut>;
    /**
     * Make a send 2FA request.
     * @param payload The request payload.
     * @docs
     */
    function send_2fa(payload: UsersBackend.Endpoints.Send2FA["payload"]): Request.ResultPromiseFromInfo<UsersBackend.Endpoints.Send2FA>;
    /**
     * Make a forgot password request.
     * @param payload The request payload.
     * @docs
     */
    function forgot_password(payload: UsersBackend.Endpoints.ForgotPassword["payload"]): Request.ResultPromiseFromInfo<UsersBackend.Endpoints.ForgotPassword>;
}
export { Auth as auth };
