/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */
// Imports.
import { Utils } from "./utils";
// Support module.
const Support = {
    /* 	@docs:
     *  @nav: Frontend
     * 	@chapter: Support
     * 	@title: Submit Support
     *	@description:
     *		Submit a support contact form. The server will send an email to your registered SMTP mail.
     *
     *		All provided argument keys will be included in the support mail, even the undefined parameters.
     *	@type: Promise
     *	@return: Returns a promise with a successful submit response or a request error on a failed request.
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
     */
    submit(data = {}) {
        return Utils.request({
            method: "POST",
            url: "/vweb/support/submit",
            data: data,
        });
    },
    /* 	@docs:
     *  @nav: Frontend
     *  @chapter: Support
     * 	@title: Support PIN
     *	@description:
     *		Get the support pin of an authenticated user.
     *	@return:
     *		@type: Promise
     *		@desc: Returns a promise with a successful submit response or a request error on a failed request.
     *		@attribute:
     *			@name: pin
     *			@desc: The user's support pin.
     *			@type: string
     */
    get_pin() {
        return Utils.request({
            method: "GET",
            url: "/vweb/support/pin",
        });
    }
};
// Export.
export { Support };
