/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */
// Imports.
import { Utils } from "./utils";
import { Cookies } from "./cookies";
// User module.
const User = {
    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: UID
     *	@description: Get the user id of the authenticated user.
     *	@type: null, string
     *	@return: Returns the user id when the user is authenticated and `null` when the user is not authenticated.
     */
    uid() {
        const uid = Cookies.get("UserID");
        return uid == "-1" ? null : uid;
    },
    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Username
     *	@description: Get the username of the authenticated user.
     *	@type: null, string
     *	@return: Returns the user's username when the user is authenticated and `null` when the user is not authenticated.
     */
    username() {
        const username = Cookies.get("UserName");
        return username === "" ? null : username;
    },
    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Email
     *	@description: Get the email of the authenticated user.
     *	@type: null, string
     *	@return: Returns the user's email when the user is authenticated and `null` when the user is not authenticated.
     */
    email() {
        const email = Cookies.get("UserEmail");
        return email === "" ? null : email;
    },
    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: First Name
     *	@description: Get the first name of the authenticated user.
     *	@type: null, string
     *	@return: Returns the user's first name when the user is authenticated and `null` when the user is not authenticated.
     */
    first_name() {
        const first_name = Cookies.get("UserFirstName");
        return first_name === "" ? null : first_name;
    },
    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Last Name
     *	@description: Get the last name of the authenticated user.
     *	@type: null, string
     *	@return: Returns the user's last name when the user is authenticated and `null` when the user is not authenticated.
     */
    last_name() {
        const last_name = Cookies.get("UserLastName");
        return last_name === "" ? null : last_name;
    },
    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Is Authenticated
     *	@description: Check if the current user is authenticated.
     *	@type: boolean
     *	@return: Returns a boolean indicating whether the current user is authenticated.
     */
    is_authenticated() {
        return this.uid() != null;
    },
    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Is Activated
     *	@description: Check if the current user is activated.
     *	@type: boolean
     *	@return: Returns a boolean indicating whether the current user is activated.
     */
    is_activated() {
        return Cookies.get("UserActivated") === "true";
    },
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
    async get(detailed = false) {
        return Utils.request({
            method: "GET",
            url: "/vweb/user/",
            data: {
                detailed: detailed,
            },
        });
    },
    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Set
     *	@description: Update the authenticated user object.
     *	@type: Promise
     *	@return: Returns a promise with a successful update response or a request error on a failed request.
     */
    async set(user) {
        return Utils.request({
            method: "POST",
            url: "/vweb/user/",
            data: user,
        });
    },
    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Activate
     *	@description: Activate the authenticated user.
     *	@type: Promise
     *	@return: Returns a promise with a successful update response or a request error on a failed request.
     */
    async activate(code = "") {
        return Utils.request({
            method: "POST",
            url: "/vweb/auth/activate",
            data: {
                code: code,
            },
        });
    },
    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Change Password
     *	@description: Change the password of the authenticated user.
     *	@type: Promise
     *	@return: Returns a promise with a successful update response or a request error on a failed request.
     */
    async change_password({ current_password = "", password = "", verify_password = "", }) {
        return Utils.request({
            method: "POST",
            url: "/vweb/user/change_password",
            data: {
                current_password: current_password,
                password: password,
                verify_password: verify_password,
            },
        });
    },
    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Delete Account
     *	@description: Delete the user account.
     *	@type: Promise
     *	@return: Returns a promise with a successful update response or a request error on a failed request.
     */
    async delete_account() {
        return Utils.request({
            method: "DELETE",
            url: "/vweb/user",
        });
    },
    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Generate API Key
     *	@description: Generate a new API key for the authenticated user.
     *	@type: Promise
     *	@return: Returns a promise with a successful update response with the newly generated API key as an attribute or a request error on a failed request.
     */
    async generate_api_key() {
        return Utils.request({
            method: "POST",
            url: "/vweb/user/api_key",
        });
    },
    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Revoke API Key
     *	@description: Revoke the API key of the authenticated user.
     *	@type: Promise
     *	@return: Returns a promise with a successful update response or a request error on a failed request.
     */
    async revoke_api_key() {
        return Utils.request({
            method: "DELETE",
            url: "/vweb/user/api_key",
        });
    },
    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Load Data
     *	@description: Load data from the authenticated user's database.
     *	@type: Promise
     *	@return: Returns a promise with the loaded user's data or a request error on a failed request.
     */
    async load(path, def = "") {
        return Utils.request({
            method: "GET",
            url: "/vweb/user/data",
            data: {
                path: path,
                def: def,
            },
        });
    },
    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Save Data
     *	@description: Save data to the authenticated user's database.
     *	@type: Promise
     *	@return: Returns a promise with a successful update response or a request error on a failed request.
     */
    async save(path = "", data = {}) {
        return Utils.request({
            method: "POST",
            url: "/vweb/user/data",
            data: {
                path: path,
                data: data,
            },
        });
    },
    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Load Protected Data
     *	@description: Load protected data from the authenticated user's database.
     *	@type: Promise
     *	@return: Returns a promise with the loaded user's data or a request error on a failed request.
     */
    async load_protected(path, def = "") {
        return Utils.request({
            method: "GET",
            url: "/vweb/user/data/protected",
            data: {
                path: path,
                def: def,
            },
        });
    }
};
// Export.
export { User };
