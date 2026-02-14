/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */

// Imports.
import { Cookies } from "./cookies"

import type {
    User as UserBackend,
    Users as UsersBackend,
} from "../../../backend/src/users.js"
import { Request, request } from "./request.js";

// User module.
export namespace User {

    // Interfaces.
    /**
     * Frontend user object as exposed by the backend.
     */
    export type UserObject = UserBackend.Frontend;

    /**
     * Get the user ID of the authenticated user.
     * @nav Frontend/User
     * @type undefined, string
     * @return Returns the user ID when the user is authenticated and `undefined` when the user is not authenticated.
     * @docs
     */
    export function uid(): string | undefined {
        const uid = Cookies.get("UserID");
        return typeof uid !== "string" || uid == "-1" || uid === "" ? undefined : uid;
    }

    /**
     * Get the username of the authenticated user.
     * @nav Frontend/User
     * @type undefined, string
     * @return Returns the user's username when the user is authenticated and `undefined` when the user is not authenticated.
     * @docs
     */
    export function username(): string | undefined {
        const username = Cookies.get("UserName");
        return typeof username !== "string" || username === "" ? undefined : username;
    }

    /**
     * Get the email of the authenticated user.
     * @nav Frontend/User
     * @type undefined, string
     * @return Returns the user's email when the user is authenticated and `undefined` when the user is not authenticated.
     * @docs
     */
    export function email(): string | undefined {
        const email = Cookies.get("UserEmail");
        return typeof email !== "string" || email === "" ? undefined : email;
    }

    /**
     * Get the first name of the authenticated user.
     * @nav Frontend/User
     * @type undefined, string
     * @return Returns the user's first name when the user is authenticated and `undefined` when the user is not authenticated.
     * @docs
     */
    export function first_name(): string | undefined {
        const first_name = Cookies.get("UserFirstName");
        return typeof first_name !== "string" || first_name === "" ? undefined : first_name;
    }

    /**
     * Get the last name of the authenticated user.
     * @nav Frontend/User
     * @type undefined, string
     * @return Returns the user's last name when the user is authenticated and `undefined` when the user is not authenticated.
     * @docs
     */
    export function last_name(): string | undefined {
        const last_name = Cookies.get("UserLastName");
        return typeof last_name !== "string" || last_name === "" ? undefined : last_name;
    }

    /**
     * Check if the current user is authenticated.
     * @nav Frontend/User
     * @type boolean
     * @return Returns a boolean indicating whether the current user is authenticated.
     * @docs
     */
    export function is_authenticated(): boolean {
        return User.uid() != undefined;
    }

    /**
     * Check if the current user is activated.
     * @nav Frontend/User
     * @type boolean
     * @return Returns a boolean indicating whether the current user is activated.
     * @docs
     */
    export function is_activated(): boolean {
        const activated = Cookies.get("UserActivated");
        return activated === "true" || activated === "1";
    }

    /**
     * Get the authenticated user object.
     * @nav Frontend/User
     * @type Promise
     * @return Returns a promise with the authenticated user's object or a request error on a failed request.
     * @docs
     */
    export async function get(): Request.ResultPromiseFromInfo<UsersBackend.Endpoints.GetUser> {
        return request<UsersBackend.Endpoints.GetUser>({
            method: "GET",
            url: "/volt/api/v1/user",
        });
    }

    /**
     * Update the authenticated user object.
     * @nav Frontend/User
     * @type Promise
     * @return Returns a promise with a successful update response or a request error on a failed request.
     * @docs
     */
    export async function update(
        payload: UsersBackend.Endpoints.UpdateUser["payload"],
    ): Request.ResultPromiseFromInfo<UsersBackend.Endpoints.UpdateUser> {
        return request<UsersBackend.Endpoints.UpdateUser>({
            method: "POST",
            url: "/volt/api/v1/user",
            data: payload,
        });
    }

    /**
     * Activate the authenticated user.
     * @nav Frontend/User
     * @type Promise
     * @return Returns a promise with a successful update response or a request error on a failed request.
     * @docs
     */
    export async function activate(
        payload: UsersBackend.Endpoints.ActivateUser["payload"]
    ): Request.ResultPromiseFromInfo<UsersBackend.Endpoints.ActivateUser> {
        return request<UsersBackend.Endpoints.ActivateUser>({
            method: "POST",
            url: "/volt/api/v1/auth/activate",
            data: payload,
        });
    }

    /**
     * Change the password of the authenticated user.
     * @nav Frontend/User
     * @type Promise
     * @return Returns a promise with a successful update response or a request error on a failed request.
     * @docs
     */
    export async function change_password(
        payload: UsersBackend.Endpoints.ChangePassword["payload"]
    ): Request.ResultPromiseFromInfo<UsersBackend.Endpoints.ChangePassword> {
        return request<UsersBackend.Endpoints.ChangePassword>({
            method: "POST",
            url: "/volt/api/v1/user/change_password",
            data: payload,
        });
    }

    /**
     * Delete the user account.
     * @nav Frontend/User
     * @type Promise
     * @return Returns a promise with a successful update response or a request error on a failed request.
     * @docs
     */
    export async function delete_account(): Request.ResultPromiseFromInfo<UsersBackend.Endpoints.DeleteUser> {
        return request<UsersBackend.Endpoints.DeleteUser>({
            method: "DELETE",
            url: "/volt/api/v1/user",
        });
    }

    /**
     * Generate a new API key for the authenticated user.
     * @nav Frontend/User
     * @type Promise
     * @return Returns a promise with a successful update response with the newly generated API key as an attribute or a request error on a failed request.
     * @docs
     */
    export async function generate_api_key(): Request.ResultPromiseFromInfo<UsersBackend.Endpoints.GenerateAPIKey> {
        return request<UsersBackend.Endpoints.GenerateAPIKey>({
            method: "POST",
            url: "/volt/api/v1/user/api_key",
        });
    }

    /**
     * Generate a new API key for the authenticated user.
     * @nav Frontend/User
     * @docs
     */
    export async function has_api_key(): Request.ResultPromiseFromInfo<UsersBackend.Endpoints.HasAPIKey> {
        return request<UsersBackend.Endpoints.HasAPIKey>({
            method: "GET",
            url: "/volt/api/v1/user/has_api_key",
        });
    }

    /**
     * Revoke the API key of the authenticated user.
     * @nav Frontend/User
     * @type Promise
     * @return Returns a promise with a successful update response or a request error on a failed request.
     * @docs
     */
    export async function revoke_api_key(): Request.ResultPromiseFromInfo<UsersBackend.Endpoints.RevokeAPIKey> {
        return request<UsersBackend.Endpoints.RevokeAPIKey>({
            method: "DELETE",
            url: "/volt/api/v1/user/api_key",
        });
    }

    /**
     * Load data from the authenticated user's database.
     * @nav Frontend/User
     * @type Promise
     * @return Returns a promise with the loaded user's data or a request error on a failed request.
     *         When the document is not found, an error response with status `404` and type `document_not_found` will be returned,
     *         unless a `default` value is provided in the request payload. In that case, the default value will be inserted
     * @docs
     */
    export async function load_data(
        payload: UsersBackend.Endpoints.LoadUserData["payload"]
    ): Request.ResultPromiseFromInfo<UsersBackend.Endpoints.LoadUserData> {
        return request<UsersBackend.Endpoints.LoadUserData>({
            method: "GET",
            url: "/volt/api/v1/user/data",
            data: payload,
        });
    }

    /**
     * Set data to the authenticated user's database, only updating the supplied fields.
     * @nav Frontend/User
     * @type Promise
     * @return Returns a promise with a successful update response or a request error on a failed request.
     * @docs
     */
    export async function set_data(
        payload: UsersBackend.Endpoints.SetUserData["payload"]
    ): Request.ResultPromiseFromInfo<UsersBackend.Endpoints.SetUserData> {
        return request<UsersBackend.Endpoints.SetUserData>({
            method: "POST",
            url: "/volt/api/v1/user/data",
            data: payload,
        });
    }

    /** 
     * Delete public user data.
     * @nav Frontend/User
     */
    export async function delete_data(
        payload: UsersBackend.Endpoints.DeleteUserData["payload"]
    ): Request.ResultPromiseFromInfo<UsersBackend.Endpoints.DeleteUserData> {
        return request<UsersBackend.Endpoints.DeleteUserData>({
            method: "DELETE",
            url: "/volt/api/v1/user/data",
            data: payload,
        });
    }

    /**
     * Load protected data from the authenticated user's database.
     * @nav Frontend/User
     * @type Promise
     * @return Returns a promise with the loaded user's data or a request error on a failed request.
     *         When the document is not found, an error response with status `404` and type `document_not_found` will be returned,
     *         unless a `default` value is provided in the request payload. In that case, the default value will be inserted
     * @docs
     */
    export async function load_protected_data(
        payload: UsersBackend.Endpoints.LoadProtectedUserData["payload"]
    ): Request.ResultPromiseFromInfo<UsersBackend.Endpoints.LoadProtectedUserData> {
        return request<UsersBackend.Endpoints.LoadProtectedUserData>({
            method: "GET",
            url: "/volt/api/v1/user/data/protected",
            data: payload,
        });
    }

};
export { User as user }; // also export as lowercase for compatibility.
