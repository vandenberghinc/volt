/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Auth module.
vweb.auth = {};

// Sign in.
/*	@docs:
	@nav: Frontend
	@chapter: Authentication
	@title: Sign In
	@desc: Make a sign in request.
	@param: 
		@name: email
		@description The user's email. Either the username or email is required.
	@param: 
		@name: username
		@description The user's username. Either the username or email is required.
	@param: 
		@name: password
		@description The user's password.
	@param: 
		@name: code
		@description The user's 2fa code. Only required when 2fa is enabled in the server.
 */
vweb.auth.sign_in = function({
	email = "",
	username = "",
	password = "",
	code = "",
}) {
	return vweb.utils.request({
		method: "POST",
		url: "/vweb/auth/signin",
		data: {
			email: email,
			username: username,
			password: password,
			code: code,
		},
	});
}

// Sign up.
/*	@docs:
	@nav: Frontend
	@chapter: Authentication
	@title: Sign Up
	@desc: Make a sign up request.
 */
vweb.auth.sign_up = function({
	username = "",
	email = "",
	first_name = "",
	last_name = "",
	password = "",
	verify_password = "",
	phone_number = "",
	code = "",
}) {
	return vweb.utils.request({
		method: "POST",
		url: "/vweb/auth/signup",
		data: {
			username,
			email,
			first_name,
			last_name,
			password,
			verify_password,
			phone_number,
			code,
		},
	});
}

// Sign out.
/*	@docs:
	@nav: Frontend
	@chapter: Authentication
	@title: Sign Out
	@desc: Make a sign out request.
 */
vweb.auth.sign_out = function() {
	return vweb.utils.request({
		method: "POST",
		url: "/vweb/auth/signout",
	});
}

// Send 2fa.
/*	@docs:
	@nav: Frontend
	@chapter: Authentication
	@title: Send 2FA
	@desc: Make a send 2FA request.
	@param: 
		@name: email
		@description The user's email.
 */
vweb.auth.send_2fa = function(email = "") {
	return vweb.utils.request({
		method: "GET",
		url: "/vweb/auth/2fa",
		data: {
			email:email,
		},
	});
}

// Forgot password.
/*	@docs:
	@nav: Frontend
	@chapter: Authentication
	@title: Forgot Password
	@desc: Make a forgot password request.
	@param: 
		@name: email
		@description The user's email.
	@param: 
		@name: code
		@description The user's 2fa code.
	@param: 
		@name: password
		@description The user's new password.
	@param: 
		@name: verify_password
		@description The user's new password.
 */
vweb.auth.forgot_password = function({
	email = "",
	code = "",
	password = "",
	verify_password = "",
}) {
	return vweb.utils.request({
		method: "POST",
		url: "/vweb/auth/forgot_password",
		data: {
			email: email,
			code: code,
			password: password,
			verify_password: verify_password,
		},
	});
}
