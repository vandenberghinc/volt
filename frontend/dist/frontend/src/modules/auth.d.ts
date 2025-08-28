import type { Users as UsersBackend } from "../../../backend/src/users.js";
import { Utils } from "./utils.js";
export declare namespace Auth {
    /**
     * Make a sign in request.
     * @param payload The request payload.
     * @docs
     */
    function sign_in(payload: UsersBackend.Endpoints.SignIn.Params): Utils.RequestResultPromise<UsersBackend.Endpoints.SignIn.Result>;
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
    function sign_up(payload: UsersBackend.Endpoints.SignUp.Params): Utils.RequestResultPromise<UsersBackend.Endpoints.SignUp.Result>;
    /**
     * Make a sign out request.
     * @docs
     */
    function sign_out(): Utils.RequestResultPromise<UsersBackend.Endpoints.SignOut.Result>;
    /**
     * Make a send 2FA request.
     * @param payload The request payload.
     * @docs
     */
    function send_2fa(payload: UsersBackend.Endpoints.Send2FA.Params): Utils.RequestResultPromise<UsersBackend.Endpoints.Send2FA.Result>;
    /**
     * Make a forgot password request.
     * @param payload The request payload.
     * @docs
     */
    function forgot_password(payload: UsersBackend.Endpoints.ForgotPassword.Params): Utils.RequestResultPromise<UsersBackend.Endpoints.ForgotPassword.Result>;
}
export { Auth as auth };
