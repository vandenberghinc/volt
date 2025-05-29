/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */
// Imports.
import { Utils } from "./utils.js";
import { Cookies } from "./cookies";
// User module.
export var User;
(function (User) {
    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: UID
     *	@description: Get the user id of the authenticated user.
     *	@type: null, string
     *	@return: Returns the user id when the user is authenticated and `null` when the user is not authenticated.
     */
    function uid() {
        const uid = Cookies.get("UserID");
        return typeof uid !== "string" || uid == "-1" ? undefined : uid;
    }
    User.uid = uid;
    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Username
     *	@description: Get the username of the authenticated user.
     *	@type: null, string
     *	@return: Returns the user's username when the user is authenticated and `null` when the user is not authenticated.
     */
    function username() {
        const username = Cookies.get("UserName");
        return typeof username !== "string" || username === "" ? undefined : username;
    }
    User.username = username;
    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Email
     *	@description: Get the email of the authenticated user.
     *	@type: null, string
     *	@return: Returns the user's email when the user is authenticated and `null` when the user is not authenticated.
     */
    function email() {
        const email = Cookies.get("UserEmail");
        return typeof email !== "string" || email === "" ? undefined : email;
    }
    User.email = email;
    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: First Name
     *	@description: Get the first name of the authenticated user.
     *	@type: null, string
     *	@return: Returns the user's first name when the user is authenticated and `null` when the user is not authenticated.
     */
    function first_name() {
        const first_name = Cookies.get("UserFirstName");
        return typeof first_name !== "string" || first_name === "" ? undefined : first_name;
    }
    User.first_name = first_name;
    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Last Name
     *	@description: Get the last name of the authenticated user.
     *	@type: null, string
     *	@return: Returns the user's last name when the user is authenticated and `null` when the user is not authenticated.
     */
    function last_name() {
        const last_name = Cookies.get("UserLastName");
        return typeof last_name !== "string" || last_name === "" ? undefined : last_name;
    }
    User.last_name = last_name;
    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Is Authenticated
     *	@description: Check if the current user is authenticated.
     *	@type: boolean
     *	@return: Returns a boolean indicating whether the current user is authenticated.
     */
    function is_authenticated() {
        return User.uid() != undefined;
    }
    User.is_authenticated = is_authenticated;
    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Is Activated
     *	@description: Check if the current user is activated.
     *	@type: boolean
     *	@return: Returns a boolean indicating whether the current user is activated.
     */
    function is_activated() {
        return Cookies.get("UserActivated") === "true";
    }
    User.is_activated = is_activated;
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
    async function get() {
        return Utils.request_v1({
            method: "GET",
            url: "/volt/user/",
            data: {
            // detailed: detailed,
            },
        });
    }
    User.get = get;
    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Set
     *	@description: Update the authenticated user object.
     *	@type: Promise
     *	@return: Returns a promise with a successful update response or a request error on a failed request.
     */
    async function set(user) {
        return Utils.request_v1({
            method: "POST",
            url: "/volt/user/",
            data: user,
        });
    }
    User.set = set;
    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Activate
     *	@description: Activate the authenticated user.
     *	@type: Promise
     *	@return: Returns a promise with a successful update response or a request error on a failed request.
     */
    async function activate(code = "") {
        return Utils.request_v1({
            method: "POST",
            url: "/volt/auth/activate",
            data: {
                code: code,
            },
        });
    }
    User.activate = activate;
    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Change Password
     *	@description: Change the password of the authenticated user.
     *	@type: Promise
     *	@return: Returns a promise with a successful update response or a request error on a failed request.
     */
    async function change_password({ current_password = "", password = "", verify_password = "", }) {
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
    User.change_password = change_password;
    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Delete Account
     *	@description: Delete the user account.
     *	@type: Promise
     *	@return: Returns a promise with a successful update response or a request error on a failed request.
     */
    async function delete_account() {
        return Utils.request_v1({
            method: "DELETE",
            url: "/volt/user",
        });
    }
    User.delete_account = delete_account;
    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Generate API Key
     *	@description: Generate a new API key for the authenticated user.
     *	@type: Promise
     *	@return: Returns a promise with a successful update response with the newly generated API key as an attribute or a request error on a failed request.
     */
    async function generate_api_key() {
        return Utils.request_v1({
            method: "POST",
            url: "/volt/user/api_key",
        });
    }
    User.generate_api_key = generate_api_key;
    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Revoke API Key
     *	@description: Revoke the API key of the authenticated user.
     *	@type: Promise
     *	@return: Returns a promise with a successful update response or a request error on a failed request.
     */
    async function revoke_api_key() {
        return Utils.request_v1({
            method: "DELETE",
            url: "/volt/user/api_key",
        });
    }
    User.revoke_api_key = revoke_api_key;
    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Load Data
     *	@description: Load data from the authenticated user's database.
     *	@type: Promise
     *	@return: Returns a promise with the loaded user's data or a request error on a failed request.
     */
    async function load(path, def = "") {
        return Utils.request_v1({
            method: "GET",
            url: "/volt/user/data",
            data: {
                path: path,
                def: def,
            },
        });
    }
    User.load = load;
    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Save Data
     *	@description: Save data to the authenticated user's database.
     *	@type: Promise
     *	@return: Returns a promise with a successful update response or a request error on a failed request.
     */
    async function save(path = "", data = {}) {
        return Utils.request_v1({
            method: "POST",
            url: "/volt/user/data",
            data: {
                path: path,
                data: data,
            },
        });
    }
    User.save = save;
    /* 	@docs:
     * 	@nav: Frontend
     *	@chapter: User
     * 	@title: Load Protected Data
     *	@description: Load protected data from the authenticated user's database.
     *	@type: Promise
     *	@return: Returns a promise with the loaded user's data or a request error on a failed request.
     */
    async function load_protected(path, def = "") {
        return Utils.request_v1({
            method: "GET",
            url: "/volt/user/data/protected",
            data: {
                path: path,
                def: def,
            },
        });
    }
    User.load_protected = load_protected;
})(User || (User = {}));
;
export { User as user }; // also export as lowercase for compatibility.
