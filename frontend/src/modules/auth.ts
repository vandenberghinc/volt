/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Utils } from "./utils.js"

// Namespace.
export namespace Auth {

	// Response schemes.
	interface Response {
		error?: string;
		invalid_fields?: Record<string, string>;
		message?: string;
	}
	interface MessageResponse {
		message?: string;
	}
	export interface SignInResponse extends Response {};
	export interface SignUpResponse extends Response {};
	export interface SignOutResponse extends MessageResponse {};
	export interface Send2FAResponse extends MessageResponse {};
	export interface ForgotPasswordResponse extends Response {};


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
	export function sign_in({
		email = "",
		username = "",
		password = "",
		code = "",
	}: {
		username: string,
		email: string,
		password: string,
		code?: string,
	}): Promise<Auth.SignInResponse> {
		return Utils.request_v1({
			method: "POST",
			url: "/volt/auth/signin",
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
	export function sign_up({
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
	}): Promise<Auth.SignUpResponse> {
		return Utils.request_v1({
			method: "POST",
			url: "/volt/auth/signup",
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
	export function sign_out(): Promise<Auth.SignOutResponse> {
		return Utils.request_v1({
			method: "POST",
			url: "/volt/auth/signout",
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
	export function send_2fa(email: string): Promise<Auth.Send2FAResponse> {
		return Utils.request_v1({
			method: "GET",
			url: "/volt/auth/2fa",
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
	export function forgot_password({
		email = "",
		code = "",
		password = "",
		verify_password = "",
	}: {
		email: string,
		password: string,
		verify_password: string,
		code: string,
	}): Promise<Auth.ForgotPasswordResponse> {
		return Utils.request_v1({
			method: "POST",
			url: "/volt/auth/forgot_password",
			data: {
				email: email,
				code: code,
				password: password,
				verify_password: verify_password,
			},
		});
	}

};
export { Auth as auth }; // also export as lowercase for compatibility.