/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Utils } from "./utils.js"
import { Cookies } from "./cookies"

// User module.
export namespace User {

    // Interfaces.
    export interface UserObject {
        uid: string;
        first_name: string;
        last_name: string;
        username: string;
        email: string;
        password: string; // only **** etc is shown.
        phone_number: string;
        created: number;
        api_key: string; // only **** etc is shown.
        support_pin: number;
        is_activated: boolean;
    }
    export interface Response {
        error?: string;
        invalid_fields?: Record<string, string>;
        message?: string;
    }
    export interface MessageResponse {
        message?: string;
    }
    export interface GenerateAPIKeyResponse {
        error?: string;
        invalid_fields?: Record<string, string>;
        message?: string;
        api_key?: string;
    }

	/* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: UID
     *	@description: Get the user id of the authenticated user.
     *	@type: null, string
     *	@return: Returns the user id when the user is authenticated and `null` when the user is not authenticated.
     */
    export function uid(): string | undefined {
        const uid = Cookies.get("UserID");
        return typeof uid !== "string" || uid == "-1" ? undefined : uid;
    }

    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Username
     *	@description: Get the username of the authenticated user.
     *	@type: null, string
     *	@return: Returns the user's username when the user is authenticated and `null` when the user is not authenticated.
     */
    export function username(): string | undefined {
        const username = Cookies.get("UserName");
        return typeof username !== "string" || username === "" ? undefined : username;
    }

    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Email
     *	@description: Get the email of the authenticated user.
     *	@type: null, string
     *	@return: Returns the user's email when the user is authenticated and `null` when the user is not authenticated.
     */
    export function email(): string | undefined {
        const email = Cookies.get("UserEmail");
        return typeof email !== "string" || email === "" ? undefined : email;
    }

    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: First Name
     *	@description: Get the first name of the authenticated user.
     *	@type: null, string
     *	@return: Returns the user's first name when the user is authenticated and `null` when the user is not authenticated.
     */
    export function first_name(): string | undefined {
        const first_name = Cookies.get("UserFirstName");
        return typeof first_name !== "string" || first_name === "" ? undefined : first_name;
    }

    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Last Name
     *	@description: Get the last name of the authenticated user.
     *	@type: null, string
     *	@return: Returns the user's last name when the user is authenticated and `null` when the user is not authenticated.
     */
    export function last_name(): string | undefined {
        const last_name = Cookies.get("UserLastName");
        return typeof last_name !== "string" || last_name === "" ? undefined : last_name;
    }

    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Is Authenticated
     *	@description: Check if the current user is authenticated.
     *	@type: boolean
     *	@return: Returns a boolean indicating whether the current user is authenticated.
     */
    export function is_authenticated(): boolean {
        return User.uid() != undefined;
    }

    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Is Activated
     *	@description: Check if the current user is activated.
     *	@type: boolean
     *	@return: Returns a boolean indicating whether the current user is activated.
     */
    export function is_activated(): boolean {
        return Cookies.get("UserActivated") as string === "true";
    }

    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Get
     *	@description: Get the authenticated user object.
     *	@type: Promise
     *	@return: Returns a promise with the authenticated user's object or a request error on a failed request.
     *	@param:
     *		@name: detailed
     *		@desc: Retrieve the detailed user information as well.
     *		@type: boolean
     */
    export async function get(): Promise<UserObject> {
        return Utils.request_v1({
            method: "GET",
            url: "/volt/user/",
            data: {
                // detailed: detailed,
            },
        });
    }

    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Set
     *	@description: Update the authenticated user object.
     *	@type: Promise
     *	@return: Returns a promise with a successful update response or a request error on a failed request.
     */
    export async function set(user: {
        first_name?: string,
        last_name?: string,
        phone_number?: string,
        password?: string,
        username?: string,
        email?: string,
        is_activated?: boolean,
    }): Promise<any> {
        return Utils.request_v1({
            method: "POST",
            url: "/volt/user/",
            data: user,
        });
    }

    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Activate
     *	@description: Activate the authenticated user.
     *	@type: Promise
     *	@return: Returns a promise with a successful update response or a request error on a failed request.
     */
    export async function activate(code: string = ""): Promise<Response> {
        return Utils.request_v1({
            method: "POST",
            url: "/volt/auth/activate",
            data: {
                code: code,
            },
        });
    }

    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Change Password
     *	@description: Change the password of the authenticated user.
     *	@type: Promise
     *	@return: Returns a promise with a successful update response or a request error on a failed request.
     */
    export async function change_password({
        current_password = "", 
        password = "", 
        verify_password = "",
    }: { current_password: string; password: string; verify_password: string }): Promise<Response> {
        return Utils.request_v1({
            method: "POST",
            url: "/volt/user/change_password",
            data: {
                current_password: current_password,
                password: password,
                verify_password: verify_password,
            },
        });
    }

    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Delete Account
     *	@description: Delete the user account.
     *	@type: Promise
     *	@return: Returns a promise with a successful update response or a request error on a failed request.
     */
    export async function delete_account(): Promise<Response> {
        return Utils.request_v1({
            method: "DELETE",
            url: "/volt/user",
        });
    }

    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Generate API Key
     *	@description: Generate a new API key for the authenticated user.
     *	@type: Promise
     *	@return: Returns a promise with a successful update response with the newly generated API key as an attribute or a request error on a failed request.
     */
    export async function generate_api_key(): Promise<GenerateAPIKeyResponse> {
        return Utils.request_v1({
            method: "POST",
            url: "/volt/user/api_key",
        });
    }

    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Revoke API Key
     *	@description: Revoke the API key of the authenticated user.
     *	@type: Promise
     *	@return: Returns a promise with a successful update response or a request error on a failed request.
     */
    export async function revoke_api_key(): Promise<Response> {
        return Utils.request_v1({
            method: "DELETE",
            url: "/volt/user/api_key",
        });
    }

    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Load Data
     *	@description: Load data from the authenticated user's database.
     *	@type: Promise
     *	@return: Returns a promise with the loaded user's data or a request error on a failed request.
     */
    export async function load(path: string, def: string = ""): Promise<any> {
        return Utils.request_v1({
            method: "GET",
            url: "/volt/user/data",
            data: {
                path: path,
                def: def,
            },
        });
    }

    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Save Data
     *	@description: Save data to the authenticated user's database.
     *	@type: Promise
     *	@return: Returns a promise with a successful update response or a request error on a failed request.
     */
    export async function save(path: string = "", data: Record<string, any> = {}): Promise<any> {
        return Utils.request_v1({
            method: "POST",
            url: "/volt/user/data",
            data: {
                path: path,
                data: data,
            },
        });
    }

    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Load Protected Data
     *	@description: Load protected data from the authenticated user's database.
     *	@type: Promise
     *	@return: Returns a promise with the loaded user's data or a request error on a failed request.
     */
    export async function load_protected(path: string, def: string = ""): Promise<any> {
        return Utils.request_v1({
            method: "GET",
            url: "/volt/user/data/protected",
            data: {
                path: path,
                def: def,
            },
        });
    }

};
export { User as user }; // also export as lowercase for compatibility.