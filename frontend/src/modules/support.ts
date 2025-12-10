/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */

// Imports.
import type { Users as UsersBackend } from "../../../backend/src/users.js";
import { Attachment } from "./attachment.js";
import { request, Request } from "./request.js";

// Support module.
export namespace Support {

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
    export function submit(
        payload: Omit<UsersBackend.Endpoints.SubmitSupport["payload"], "attachments"> & {
            attachments?: Attachment[];
        }
    ): Request.ResultPromiseFromInfo<UsersBackend.Endpoints.SubmitSupport> {
        if (payload.attachments) {
            const total_attachments_size = payload.attachments.reduce((acc, it) => acc + it.size, 0);
            if (total_attachments_size > 5 * 1024 * 1024) { // 5 MB total
                throw new Error(`Total attachments size exceeds the maximum of 5 MB.`);
            }
        }
        return request<UsersBackend.Endpoints.SubmitSupport>({
            method: "POST",
            url: "/volt/api/v1/support/submit",
            data: {
                ...payload,
                attachments: payload.attachments?.map(a => a.to_rest_api({
                    decompress: true,
                    encoding: "base64",
                }))
            },
        });
    }

    /**
     * Get the support pin of an authenticated user.
     * @nav Frontend/Support
     * @returns Returns a promise that resolves with an object containing `pin` (the user's support pin) on success, or a request error on failure.
     * @docs
     */
    export function get_pin(): Request.ResultPromiseFromInfo<UsersBackend.Endpoints.GetSupportPin> {
        return request<UsersBackend.Endpoints.GetSupportPin>({
            method: "GET",
            url: "/volt/api/v1/support/pin",
        });
    }
}
export { Support as support }; // also export as lowercase for compatibility.