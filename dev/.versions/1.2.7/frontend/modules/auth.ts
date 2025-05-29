/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Utils } from "./utils"

// Auth module.
const Auth = {

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
	sign_in({
		email = "",
		username = "",
		password = "",
		code = "",
	}: {
		username: string,
		email: string,
		password: string,
		code?: string,
	}): Promise<object> {
		return Utils.request({
			method: "POST",
			url: "/vweb/auth/signin",
			data: {
				email: email,
				username: username,
				password: password,
				code: code,
			},
		});
	},

	// Sign up.
	/*	@docs:
		@nav: Frontend
		@chapter: Authentication
		@title: Sign Up
		@desc: Make a sign up request.
	 */
	sign_up({
		username = "",
		email = "",
		first_name = "",
		last_name = "",
		password = "",
		verify_password = "",
		phone_number = "",
		code = "",
	}: {
		username: string,
		email: string,
		first_name: string,
		last_name: string,
		password: string,
		verify_password: string,
		phone_number?: string,
		code?: string,
	}): Promise<object> {
		return Utils.request({
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
	},

	// Sign out.
	/*	@docs:
		@nav: Frontend
		@chapter: Authentication
		@title: Sign Out
		@desc: Make a sign out request.
	 */
	sign_out(): Promise<object> {
		return Utils.request({
			method: "POST",
			url: "/vweb/auth/signout",
		});
	},

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
	send_2fa(email: string): Promise<object> {
		return Utils.request({
			method: "GET",
			url: "/vweb/auth/2fa",
			data: {
				email:email,
			},
		});
	},

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
	forgot_password({
		email = "",
		code = "",
		password = "",
		verify_password = "",
	}: {
		email: string,
		password: string,
		verify_password: string,
		code: string,
	}): Promise<object> {
		return Utils.request({
			method: "POST",
			url: "/vweb/auth/forgot_password",
			data: {
				email: email,
				code: code,
				password: password,
				verify_password: verify_password,
			},
		});
	},

};

// Export.
export {Auth};