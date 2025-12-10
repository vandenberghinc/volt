/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
import { Cookies } from "./cookies";
import { request } from "./request.js";
// User module.
export var User;
(function (User) {
    /**
     * Get the user ID of the authenticated user.
     * @nav Frontend/User
     * @type undefined, string
     * @return Returns the user ID when the user is authenticated and `undefined` when the user is not authenticated.
     * @docs
     */
    function uid() {
        const uid = Cookies.get("UserID");
        return typeof uid !== "string" || uid == "-1" ? undefined : uid;
    }
    User.uid = uid;
    /**
     * Get the username of the authenticated user.
     * @nav Frontend/User
     * @type undefined, string
     * @return Returns the user's username when the user is authenticated and `undefined` when the user is not authenticated.
     * @docs
     */
    function username() {
        const username = Cookies.get("UserName");
        return typeof username !== "string" || username === "" ? undefined : username;
    }
    User.username = username;
    /**
     * Get the email of the authenticated user.
     * @nav Frontend/User
     * @type undefined, string
     * @return Returns the user's email when the user is authenticated and `undefined` when the user is not authenticated.
     * @docs
     */
    function email() {
        const email = Cookies.get("UserEmail");
        return typeof email !== "string" || email === "" ? undefined : email;
    }
    User.email = email;
    /**
     * Get the first name of the authenticated user.
     * @nav Frontend/User
     * @type undefined, string
     * @return Returns the user's first name when the user is authenticated and `undefined` when the user is not authenticated.
     * @docs
     */
    function first_name() {
        const first_name = Cookies.get("UserFirstName");
        return typeof first_name !== "string" || first_name === "" ? undefined : first_name;
    }
    User.first_name = first_name;
    /**
     * Get the last name of the authenticated user.
     * @nav Frontend/User
     * @type undefined, string
     * @return Returns the user's last name when the user is authenticated and `undefined` when the user is not authenticated.
     * @docs
     */
    function last_name() {
        const last_name = Cookies.get("UserLastName");
        return typeof last_name !== "string" || last_name === "" ? undefined : last_name;
    }
    User.last_name = last_name;
    /**
     * Check if the current user is authenticated.
     * @nav Frontend/User
     * @type boolean
     * @return Returns a boolean indicating whether the current user is authenticated.
     * @docs
     */
    function is_authenticated() {
        return User.uid() != undefined;
    }
    User.is_authenticated = is_authenticated;
    /**
     * Check if the current user is activated.
     * @nav Frontend/User
     * @type boolean
     * @return Returns a boolean indicating whether the current user is activated.
     * @docs
     */
    function is_activated() {
        return Cookies.get("UserActivated") === "true";
    }
    User.is_activated = is_activated;
    /**
     * Get the authenticated user object.
     * @nav Frontend/User
     * @type Promise
     * @return Returns a promise with the authenticated user's object or a request error on a failed request.
     * @docs
     */
    async function get() {
        return request({
            method: "GET",
            url: "/volt/api/v1/user",
        });
    }
    User.get = get;
    /**
     * Update the authenticated user object.
     * @nav Frontend/User
     * @type Promise
     * @return Returns a promise with a successful update response or a request error on a failed request.
     * @docs
     */
    async function update(payload) {
        return request({
            method: "POST",
            url: "/volt/api/v1/user",
            data: payload,
        });
    }
    User.update = update;
    /**
     * Activate the authenticated user.
     * @nav Frontend/User
     * @type Promise
     * @return Returns a promise with a successful update response or a request error on a failed request.
     * @docs
     */
    async function activate(payload) {
        return request({
            method: "POST",
            url: "/volt/api/v1/auth/activate",
            data: payload,
        });
    }
    User.activate = activate;
    /**
     * Change the password of the authenticated user.
     * @nav Frontend/User
     * @type Promise
     * @return Returns a promise with a successful update response or a request error on a failed request.
     * @docs
     */
    async function change_password(payload) {
        return request({
            method: "POST",
            url: "/volt/api/v1/user/change_password",
            data: payload,
        });
    }
    User.change_password = change_password;
    /**
     * Delete the user account.
     * @nav Frontend/User
     * @type Promise
     * @return Returns a promise with a successful update response or a request error on a failed request.
     * @docs
     */
    async function delete_account() {
        return request({
            method: "DELETE",
            url: "/volt/api/v1/user",
        });
    }
    User.delete_account = delete_account;
    /**
     * Generate a new API key for the authenticated user.
     * @nav Frontend/User
     * @type Promise
     * @return Returns a promise with a successful update response with the newly generated API key as an attribute or a request error on a failed request.
     * @docs
     */
    async function generate_api_key() {
        return request({
            method: "POST",
            url: "/volt/api/v1/user/api_key",
        });
    }
    User.generate_api_key = generate_api_key;
    /**
     * Generate a new API key for the authenticated user.
     * @nav Frontend/User
     * @docs
     */
    async function has_api_key() {
        return request({
            method: "GET",
            url: "/volt/api/v1/user/has_api_key",
        });
    }
    User.has_api_key = has_api_key;
    /**
     * Revoke the API key of the authenticated user.
     * @nav Frontend/User
     * @type Promise
     * @return Returns a promise with a successful update response or a request error on a failed request.
     * @docs
     */
    async function revoke_api_key() {
        return request({
            method: "DELETE",
            url: "/volt/api/v1/user/api_key",
        });
    }
    User.revoke_api_key = revoke_api_key;
    /**
     * Load data from the authenticated user's database.
     * @nav Frontend/User
     * @type Promise
     * @return Returns a promise with the loaded user's data or a request error on a failed request.
     *         When the document is not found, an error response with status `404` and type `document_not_found` will be returned,
     *         unless a `default` value is provided in the request payload. In that case, the default value will be inserted
     * @docs
     */
    async function load_data(payload) {
        return request({
            method: "GET",
            url: "/volt/api/v1/user/data",
            data: payload,
        });
    }
    User.load_data = load_data;
    /**
     * Set data to the authenticated user's database, only updating the supplied fields.
     * @nav Frontend/User
     * @type Promise
     * @return Returns a promise with a successful update response or a request error on a failed request.
     * @docs
     */
    async function set_data(payload) {
        return request({
            method: "POST",
            url: "/volt/api/v1/user/data",
            data: payload,
        });
    }
    User.set_data = set_data;
    /**
     * Delete public user data.
     * @nav Frontend/User
     */
    async function delete_data(payload) {
        return request({
            method: "DELETE",
            url: "/volt/api/v1/user/data",
            data: payload,
        });
    }
    User.delete_data = delete_data;
    /**
     * Load protected data from the authenticated user's database.
     * @nav Frontend/User
     * @type Promise
     * @return Returns a promise with the loaded user's data or a request error on a failed request.
     *         When the document is not found, an error response with status `404` and type `document_not_found` will be returned,
     *         unless a `default` value is provided in the request payload. In that case, the default value will be inserted
     * @docs
     */
    async function load_protected_data(payload) {
        return request({
            method: "GET",
            url: "/volt/api/v1/user/data/protected",
            data: payload,
        });
    }
    User.load_protected_data = load_protected_data;
})(User || (User = {}));
;
export { User as user }; // also export as lowercase for compatibility.
