/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
import type { User as UserBackend, Users as UsersBackend } from "../../../backend/src/users.js";
import { Request } from "./request.js";
export declare namespace User {
    /**
     * Frontend user object as exposed by the backend.
     */
    type UserObject = UserBackend.Frontend;
    /**
     * Get the user ID of the authenticated user.
     * @nav Frontend/User
     * @type undefined, string
     * @return Returns the user ID when the user is authenticated and `undefined` when the user is not authenticated.
     * @docs
     */
    function uid(): string | undefined;
    /**
     * Get the username of the authenticated user.
     * @nav Frontend/User
     * @type undefined, string
     * @return Returns the user's username when the user is authenticated and `undefined` when the user is not authenticated.
     * @docs
     */
    function username(): string | undefined;
    /**
     * Get the email of the authenticated user.
     * @nav Frontend/User
     * @type undefined, string
     * @return Returns the user's email when the user is authenticated and `undefined` when the user is not authenticated.
     * @docs
     */
    function email(): string | undefined;
    /**
     * Get the first name of the authenticated user.
     * @nav Frontend/User
     * @type undefined, string
     * @return Returns the user's first name when the user is authenticated and `undefined` when the user is not authenticated.
     * @docs
     */
    function first_name(): string | undefined;
    /**
     * Get the last name of the authenticated user.
     * @nav Frontend/User
     * @type undefined, string
     * @return Returns the user's last name when the user is authenticated and `undefined` when the user is not authenticated.
     * @docs
     */
    function last_name(): string | undefined;
    /**
     * Check if the current user is authenticated.
     * @nav Frontend/User
     * @type boolean
     * @return Returns a boolean indicating whether the current user is authenticated.
     * @docs
     */
    function is_authenticated(): boolean;
    /**
     * Check if the current user is activated.
     * @nav Frontend/User
     * @type boolean
     * @return Returns a boolean indicating whether the current user is activated.
     * @docs
     */
    function is_activated(): boolean;
    /**
     * Get the authenticated user object.
     * @nav Frontend/User
     * @type Promise
     * @return Returns a promise with the authenticated user's object or a request error on a failed request.
     * @docs
     */
    function get(): Request.ResultPromiseFromInfo<UsersBackend.Endpoints.GetUser>;
    /**
     * Update the authenticated user object.
     * @nav Frontend/User
     * @type Promise
     * @return Returns a promise with a successful update response or a request error on a failed request.
     * @docs
     */
    function update(payload: UsersBackend.Endpoints.UpdateUser["payload"]): Request.ResultPromiseFromInfo<UsersBackend.Endpoints.UpdateUser>;
    /**
     * Activate the authenticated user.
     * @nav Frontend/User
     * @type Promise
     * @return Returns a promise with a successful update response or a request error on a failed request.
     * @docs
     */
    function activate(payload: UsersBackend.Endpoints.ActivateUser["payload"]): Request.ResultPromiseFromInfo<UsersBackend.Endpoints.ActivateUser>;
    /**
     * Change the password of the authenticated user.
     * @nav Frontend/User
     * @type Promise
     * @return Returns a promise with a successful update response or a request error on a failed request.
     * @docs
     */
    function change_password(payload: UsersBackend.Endpoints.ChangePassword["payload"]): Request.ResultPromiseFromInfo<UsersBackend.Endpoints.ChangePassword>;
    /**
     * Delete the user account.
     * @nav Frontend/User
     * @type Promise
     * @return Returns a promise with a successful update response or a request error on a failed request.
     * @docs
     */
    function delete_account(): Request.ResultPromiseFromInfo<UsersBackend.Endpoints.DeleteUser>;
    /**
     * Generate a new API key for the authenticated user.
     * @nav Frontend/User
     * @type Promise
     * @return Returns a promise with a successful update response with the newly generated API key as an attribute or a request error on a failed request.
     * @docs
     */
    function generate_api_key(): Request.ResultPromiseFromInfo<UsersBackend.Endpoints.GenerateAPIKey>;
    /**
     * Generate a new API key for the authenticated user.
     * @nav Frontend/User
     * @docs
     */
    function has_api_key(): Request.ResultPromiseFromInfo<UsersBackend.Endpoints.HasAPIKey>;
    /**
     * Revoke the API key of the authenticated user.
     * @nav Frontend/User
     * @type Promise
     * @return Returns a promise with a successful update response or a request error on a failed request.
     * @docs
     */
    function revoke_api_key(): Request.ResultPromiseFromInfo<UsersBackend.Endpoints.RevokeAPIKey>;
    /**
     * Load data from the authenticated user's database.
     * @nav Frontend/User
     * @type Promise
     * @return Returns a promise with the loaded user's data or a request error on a failed request.
     *         When the document is not found, an error response with status `404` and type `document_not_found` will be returned,
     *         unless a `default` value is provided in the request payload. In that case, the default value will be inserted
     * @docs
     */
    function load_data(payload: UsersBackend.Endpoints.LoadUserData["payload"]): Request.ResultPromiseFromInfo<UsersBackend.Endpoints.LoadUserData>;
    /**
     * Set data to the authenticated user's database, only updating the supplied fields.
     * @nav Frontend/User
     * @type Promise
     * @return Returns a promise with a successful update response or a request error on a failed request.
     * @docs
     */
    function set_data(payload: UsersBackend.Endpoints.SetUserData["payload"]): Request.ResultPromiseFromInfo<UsersBackend.Endpoints.SetUserData>;
    /**
     * Delete public user data.
     * @nav Frontend/User
     */
    function delete_data(payload: UsersBackend.Endpoints.DeleteUserData["payload"]): Request.ResultPromiseFromInfo<UsersBackend.Endpoints.DeleteUserData>;
    /**
     * Load protected data from the authenticated user's database.
     * @nav Frontend/User
     * @type Promise
     * @return Returns a promise with the loaded user's data or a request error on a failed request.
     *         When the document is not found, an error response with status `404` and type `document_not_found` will be returned,
     *         unless a `default` value is provided in the request payload. In that case, the default value will be inserted
     * @docs
     */
    function load_protected_data(payload: UsersBackend.Endpoints.LoadProtectedUserData["payload"]): Request.ResultPromiseFromInfo<UsersBackend.Endpoints.LoadProtectedUserData>;
}
export { User as user };
