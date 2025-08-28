/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import type { Users as UsersBackend } from "../../../backend/src/users.js";
import { Utils } from "./utils.js"

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
        payload: UsersBackend.Endpoints.SubmitSupport.Params
    ): Utils.RequestResultPromise<UsersBackend.Endpoints.SubmitSupport.Result> {
        if (payload.attachments) {
            const MAX_ATTACHMENTS = 5;
            const MAX_BYTES = 5 * 1024 * 1024; // 5 MB per file
            const keys = Object.keys(payload.attachments);
            if (keys.length > MAX_ATTACHMENTS) {
                throw new Error("Too many attachments. Maximum is 5.");
            }
            for (const key of keys) {
                const raw = (payload.attachments as Record<string, string>)[key];
                const is_base64 = /^[A-Za-z0-9+/]+=*$/.test(raw);
                const buf = Buffer.from(raw, is_base64 ? "base64" : "utf-8");
                if (buf.length > MAX_BYTES) {
                    throw new Error(`Attachment "${key}" exceeds the maximum size of 5 MB.`);
                }
            }
        }
        return Utils.request({
            method: "POST",
            url: "/volt/support/submit",
            data: payload,
        });
    }

    /**
     * Get the support pin of an authenticated user.
     * @nav Frontend/Support
     * @returns Returns a promise that resolves with an object containing `pin` (the user's support pin) on success, or a request error on failure.
     * @docs
     */
    export function get_pin(): Utils.RequestResultPromise<UsersBackend.Endpoints.GetSupportPin.Result> {
        return Utils.request({
            method: "GET",
            url: "/volt/support/pin",
        });
    }
}
export { Support as support }; // also export as lowercase for compatibility.