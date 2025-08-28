/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Utils } from "./utils.js"
import { Cookies } from "./cookies"

import {
    User as UserBackend,
    Users as UsersBackend,
} from "../../../backend/src/users.js"

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
        return typeof uid !== "string" || uid == "-1" ? undefined : uid;
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
        return Cookies.get("UserActivated") as string === "true";
    }

    /**
     * Get the authenticated user object.
     * @nav Frontend/User
     * @type Promise
     * @return Returns a promise with the authenticated user's object or a request error on a failed request.
     * @docs
     */
    export async function get(): Promise<Utils.RequestResult<
        UsersBackend.Endpoints.GetUser.Result
    >> {
        return Utils.request({
            method: "GET",
            url: "/volt/user",
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
        payload: UsersBackend.Endpoints.UpdateUser.Params,
    ): Utils.RequestResultPromise<UsersBackend.Endpoints.UpdateUser.Result> {
        return Utils.request({
            method: "POST",
            url: "/volt/user",
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
        payload: UsersBackend.Endpoints.ActivateUser.Params
    ): Utils.RequestResultPromise<UsersBackend.Endpoints.ActivateUser.Result> {
        return Utils.request({
            method: "POST",
            url: "/volt/auth/activate",
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
        payload: UsersBackend.Endpoints.ChangePassword.Params
    ): Utils.RequestResultPromise<UsersBackend.Endpoints.ChangePassword.Result> {
        return Utils.request({
            method: "POST",
            url: "/volt/user/change_password",
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
    export async function delete_account(): Utils.RequestResultPromise<UsersBackend.Endpoints.DeleteUser.Result> {
        return Utils.request({
            method: "DELETE",
            url: "/volt/user",
        });
    }

    /**
     * Generate a new API key for the authenticated user.
     * @nav Frontend/User
     * @type Promise
     * @return Returns a promise with a successful update response with the newly generated API key as an attribute or a request error on a failed request.
     * @docs
     */
    export async function generate_api_key(): Utils.RequestResultPromise<UsersBackend.Endpoints.GenerateAPIKey.Result> {
        return Utils.request({
            method: "POST",
            url: "/volt/user/api_key",
        });
    }

    /**
     * Generate a new API key for the authenticated user.
     * @nav Frontend/User
     * @docs
     */
    export async function has_api_key(): Utils.RequestResultPromise<UsersBackend.Endpoints.HasAPIKey.Result> {
        return Utils.request({
            method: "GET",
            url: "/volt/user/has_api_key",
        });
    }

    /**
     * Revoke the API key of the authenticated user.
     * @nav Frontend/User
     * @type Promise
     * @return Returns a promise with a successful update response or a request error on a failed request.
     * @docs
     */
    export async function revoke_api_key(): Utils.RequestResultPromise<UsersBackend.Endpoints.RevokeAPIKey.Result> {
        return Utils.request({
            method: "DELETE",
            url: "/volt/user/api_key",
        });
    }

    /**
     * Load data from the authenticated user's database.
     * @nav Frontend/User
     * @type Promise
     * @return Returns a promise with the loaded user's data or a request error on a failed request.
     * @docs
     */
    export async function load_data(
        payload: UsersBackend.Endpoints.LoadUserData.Params
    ): Utils.RequestResultPromise<UsersBackend.Endpoints.LoadUserData.Result> {
        return Utils.request({
            method: "GET",
            url: "/volt/user/data",
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
        payload: UsersBackend.Endpoints.SetUserData.Params
    ): Utils.RequestResultPromise<UsersBackend.Endpoints.SetUserData.Result> {
        return Utils.request({
            method: "POST",
            url: "/volt/user/data",
            data: payload,
        });
    }

    /** 
     * Delete public user data.
     * @nav Frontend/User
     */
    export async function delete_data(
        payload: UsersBackend.Endpoints.DeleteUserData.Params
    ): Utils.RequestResultPromise<UsersBackend.Endpoints.DeleteUserData.Result> {
        return Utils.request({
            method: "DELETE",
            url: "/volt/user/data",
            data: payload,
        });
    }

    /**
     * Load protected data from the authenticated user's database.
     * @nav Frontend/User
     * @type Promise
     * @return Returns a promise with the loaded user's data or a request error on a failed request.
     * @docs
     */
    export async function load_protected_data(
        payload: UsersBackend.Endpoints.LoadProtectedUserData.Params
    ): Utils.RequestResultPromise<UsersBackend.Endpoints.LoadProtectedUserData.Result> {
        return Utils.request({
            method: "GET",
            url: "/volt/user/data/protected",
            data: payload,
        });
    }

};
export { User as user }; // also export as lowercase for compatibility.
