/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// User module.
vweb.user = {};

// Get user id from cookie.
/* 	@docs:
 * 	@nav: Frontend
 *	@chapter: User
 * 	@title: UID
 *	@description: Get the user id of the authenticated user.
 *	@type: null, number
 *	@return: Returns the user id when the user is authenticated and `null` when the user is not authenticated.
 */
vweb.user.uid = function() {
	let uid = vweb.cookies.get("UserID");
	if (uid == "-1") {
		return null;
	}
	return uid;
}

// Get username from cookie.
/* 	@docs:
 * 	@nav: Frontend
 *	@chapter: User
 * 	@title: Username
 *	@description: Get the username of the authenticated user.
 *	@type: null, string
 *	@return: Returns the user's username when the user is authenticated and `null` when the user is not authenticated.
 */
vweb.user.username = function() {
	let username = vweb.cookies.get("UserName");
	if (username == "") {
		username = null;
	}
	return username;
}

// Get email from cookie.
/* 	@docs:
 * 	@nav: Frontend
 *	@chapter: User
 * 	@title: Email
 *	@description: Get the email of the authenticated user.
 *	@type: null, string
 *	@return: Returns the user's email when the user is authenticated and `null` when the user is not authenticated.
 */
vweb.user.email = function() {
	let email = vweb.cookies.get("UserEmail");
	if (email == "") {
		email = null;
	}
	return email;
}

// Get first name from cookie.
/* 	@docs:
 * 	@nav: Frontend
 *	@chapter: User
 * 	@title: First Name
 *	@description: Get the first name of the authenticated user.
 *	@type: null, string
 *	@return: Returns the user's first name when the user is authenticated and `null` when the user is not authenticated.
 */
vweb.user.first_name = function() {
	let first_name = vweb.cookies.get("UserFirstName");
	if (first_name == "") {
		first_name = null;
	}
	return first_name;
}

// Get last name from cookie.
/* 	@docs:
 * 	@nav: Frontend
 *	@chapter: User
 * 	@title: Last Name
 *	@description: Get the last anme of the authenticated user.
 *	@type: null, string
 *	@return: Returns the user's last anme when the user is authenticated and `null` when the user is not authenticated.
 */
vweb.user.last_name = function() {
	let last_name = vweb.cookies.get("UserLastName");
	if (last_name == "") {
		last_name = null;
	}
	return last_name;
}

// Get the is authenticated boolean.
/* 	@docs:
 * 	@nav: Frontend
 *	@chapter: User
 * 	@title: Is Authenticated
 *	@description: Check if the current user is authenticated.
 *	@type: boolean
 *	@return: Returns a boolean indicating whether the current user is authenticated.
 */
vweb.user.is_authenticated = function() {
	return this.uid() != null;
}

// Get the is user activated boolean.
/* 	@docs:
 * 	@nav: Frontend
 *	@chapter: User
 * 	@title: Is Activated
 *	@description: Check if the current user is activated.
 *	@type: boolean
 *	@return: Returns a boolean indicating whether the current user is activated.
 */
vweb.user.is_activated = function() {
	return vweb.cookies.get("UserActivated") === "true";
}

// Get user.
/* 	@docs:
 * 	@nav: Frontend
 *	@chapter: User
 * 	@title: Get
 *	@description: Get the authenticated user object.
 *	@type: Promise
 *	@return: Returns a promise with the authenticated user's object as promise or a request error on a failed request.
 *	@param:
 *		@name: detailed
 *		@desc: Retrieve the detailed user information as well.
 *		@type: boolean
 */
vweb.user.get = async function(detailed = false) {
	return vweb.utils.request({
		method: "GET",
		url: "/vweb/user/",
		data: {
			detailed: detailed,
		}
	});
}

// Update user.
/* 	@docs:
 * 	@nav: Frontend
 *	@chapter: User
 * 	@title: Set
 *	@description: Update the authenticated user object.
 *	@type: Promise
 *	@return: Returns a promise with the with a successfull update response or a request error on a failed request.
 */
vweb.user.set = async function(user) {
	return vweb.utils.request({
		method: "POST",
		url: "/vweb/user/",
		data: user,
	});
}

// Activate account.
/* 	@docs:
 * 	@nav: Frontend
 *	@chapter: User
 * 	@title: Activate
 *	@description: Activate the authenticated user.
 *	@type: Promise
 *	@return: Returns a promise with the with a successfull update response or a request error on a failed request.
 */
vweb.user.activate = async function(code = "") {
	return vweb.utils.request({
		method: "POST",
		url: "/vweb/auth/activate",
		data: {
			"code": code,
		},
	});
}

// Change password.
/* 	@docs:
 * 	@nav: Frontend
 *	@chapter: User
 * 	@title: Change Password
 *	@description: Change the password of the authenticated user.
 *	@type: Promise
 *	@return: Returns a promise with the with a successfull update response or a request error on a failed request.
 */
vweb.user.change_password = async function({
	current_password = "", 
	password = "", 
	verify_password = "",
}) {
	return vweb.utils.request({
		method: "POST",
		url: "/vweb/user/change_password",
		data: {
			current_password: current_password,
			password: password,
			verify_password: verify_password,
		},
	});
}

// Delete account.
/* 	@docs:
 * 	@nav: Frontend
 *	@chapter: User
 * 	@title: Delete account
 *	@description: Delete the user account
 *	@type: Promise
 *	@return: Returns a promise with the with a successfull update response or a request error on a failed request.
 */
vweb.user.delete_account = async function() {
	return vweb.utils.request({
		method: "DELETE",
		url: "/vweb/user",
	});
}

// Generate api key.
/* 	@docs:
 * 	@nav: Frontend
 *	@chapter: User
 * 	@title: Generate API Key
 *	@description: Generate a new api key for the authenticated user.
 *	@type: Promise
 *	@return: Returns a promise with the with a successfull update response with the newly generated api key as attribute or a request error on a failed request.
 */
vweb.user.generate_api_key = async function() {
	return vweb.utils.request({
		method: "POST",
		url: "/vweb/user/api_key",
	});
}

// Revoke api key.
/* 	@docs:
 * 	@nav: Frontend
 *	@chapter: User
 * 	@title: Revoke API Key
 *	@description: Revoke the api key of the authenticated user.
 *	@type: Promise
 *	@return: Returns a promise with the with a successfull update response or a request error on a failed request.
 */
vweb.user.revoke_api_key = async function() {
	return vweb.utils.request({
		method: "DELETE",
		url: "/vweb/user/api_key",
	});
}

// Load data from the users database.
/* 	@docs:
 * 	@nav: Frontend
 *	@chapter: User
 * 	@title: Load Data
 *	@description: Load data from the authenticated user's database.
 *	@type: Promise
 *	@return: Returns a promise with the with a successfull update response with the loaded user's data or a request error on a failed request.
 */
vweb.user.load = async function(path, def = "") {
	return vweb.utils.request({
		method: "GET",
		url: "/vweb/user/data",
		data: {
			path: path,
			def: "",
		},
	});
}

// Save data to the users database.
/* 	@docs:
 * 	@nav: Frontend
 *	@chapter: User
 * 	@title: Save Data
 *	@description: Save data to the authenticated user's database.
 *	@type: Promise
 *	@return: Returns a promise with the with a successfull update response or a request error on a failed request.
 */
vweb.user.save = async function(path = "", data = {}) {
	return vweb.utils.request({
		method: "POST",
		url: "/vweb/user/data",
		data: {
			path: path,
			data: data,
		},
	});
}

// Load protected data from the users database.
/* 	@docs:
 * 	@nav: Frontend
 *	@chapter: User
 * 	@title: Load Protected Data
 *	@description: Load protected data from the authenticated user's database.
 *	@type: Promise
 *	@return: Returns a promise with the with a successfull update response with the loaded user's data or a request error on a failed request.
 */
vweb.user.load_protected = async function(path, def = "") {
	return vweb.utils.request({
		method: "GET",
		url: "/vweb/user/data/protected",
		data: {
			path: path,
			def: def,
		},
	});
}
