/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Support module.
vweb.support = {};

// Submit a support contact form
/* 	@docs:
 *  @nav: Frontend
 * 	@chapter: Support
 * 	@title: Submit Support
 *	@description: 
 *		Submit a support contact form. The server will send an email to your registered SMTP mail.
 *	
 *		All provided argument keys will be included in the support mail, even the undefined parameters.
 *	@type: Promise
 *	@return: Returns a promise with the with a successfull submit response or a request error on a failed request.
 *	@param:
 *		@name: subject
 *		@desc: The support subject.
 *		@required: false
 *	@param:
 *		@name: type
 *		@desc: The support type for internal purpose only.
 *		@required: false
 *		@type: string
 *	@param:
 *		@name: support_pin
 *		@desc: The user's support pin. This parameter will automatically be assigned when the user is authenticated.
 *		@required: false
 *		@advised: true
 *		@type: string
 *	@param:
 *		@name: email
 *		@desc: The user's email. This parameter will automatically be assigned when the user is authenticated.
 *		@required: false
 *		@advised: true
 *		@type: string
 *	@param:
 *		@name: first_name
 *		@desc: The user's first name. This parameter will automatically be assigned when the user is authenticated.
 *		@required: false
 *		@advised: true
 *		@type: string
 *	@param:
 *		@name: last_name
 *		@desc: The user's last name. This parameter will automatically be assigned when the user is authenticated.
 *		@required: false
 *		@advised: true
 *		@type: string
 *	@param:
 *		@name: recipient
 *		@desc: The recipient email, by default the `Server.smtp_sender` email will be used.
 *		@required: false
 *		@type: string
 *	@param:
 *		@name: subject
 *		@desc: The support subject.
 *		@required: false
 *		@type: string
 *	@param:
 *		@name: summary
 *		@desc: A summary of the support request.
 *		@required: false
 *		@type: string
 *	@param:
 *		@name: detailed
 *		@desc: A detailed description of the support request.
 *		@required: false
 *		@type: string
 *	@param:
 *		@name: attachments
 *		@desc: An object with attachments, assigned as `{file_name: raw_file_data}`.
 *		@required: false
 *		@type: object
 *  @param:
 *      @name: data
 *      @ignore: true
 */
vweb.support.submit = function(data = {}) {
	return vweb.utils.request({
		method: "POST",
		url: "/vweb/support/submit",
		data: data,
	});
}

// Get the support pin of an authenticated user.
/* 	@docs:
 *  @nav: Frontend
 *  @chapter: Support
 * 	@title: Support PIN
 *	@description: 
 *		Get the support pin of an authenticated user.
 *	@return:
 *		@type: Promise
 *		@desc: Returns a promise with the with a successfull submit response or a request error on a failed request.
 *		@attribute:
 *			@name: pin
 *			@desc: The user's support pin.
 *			@type: string
 */
vweb.support.get_pin = function() {
	return vweb.utils.request({
		method: "GET",
		url: "/vweb/support/pin",
	});
}
