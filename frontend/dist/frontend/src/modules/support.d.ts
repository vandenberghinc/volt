/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
import type { Users as UsersBackend } from "../../../backend/src/users.js";
import { Attachment } from "./attachment.js";
import { Request } from "./request.js";
export declare namespace Support {
    /**
     * Submit a support contact form. The server will send an email to your registered SMTP mail.
     *
     * All provided argument keys will be included in the support mail, even the undefined parameters.
     * Allows for a maximum of 5 attachments, each up to 5 MB in size.
     * @nav Frontend/Support
     * @returns Returns a promise with a successful submit response or a request error on a failed request.
     * @param payload The request payload, see {@link UsersBackend.Endpoints.SubmitSupport.Params}.
     * @docs
     */
    function submit(payload: Omit<UsersBackend.Endpoints.SubmitSupport["payload"], "attachments"> & {
        attachments?: Attachment[];
    }): Request.ResultPromiseFromInfo<UsersBackend.Endpoints.SubmitSupport>;
    /**
     * Get the support pin of an authenticated user.
     * @nav Frontend/Support
     * @returns Returns a promise that resolves with an object containing `pin` (the user's support pin) on success, or a request error on failure.
     * @docs
     */
    function get_pin(): Request.ResultPromiseFromInfo<UsersBackend.Endpoints.GetSupportPin>;
}
export { Support as support };
