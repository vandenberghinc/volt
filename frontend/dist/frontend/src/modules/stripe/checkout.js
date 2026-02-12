/**
 * @author Daan van den Bergh
 * @copyright © 2026 - 2026 Daan van den Bergh. All rights reserved
 *
 * The frontend payments module for stripe billing.
 */
import { request } from "../request.js";
/**
 * Start a checkout session, by generating a session id.
 * @nav Frontend/User
 * @return
 * Returns a promise with a successful update response or a request error on a failed request.
 * The response objects holds the `status` and `data` properties on a successful response, and an `error` property on a failed request.
 * @docs
 */
async function create_checkout_session_id(payload) {
    return request({
        method: "POST",
        url: "/volt/api/stripe/v1/checkout/session_id",
        data: payload,
    });
}
/**
 * Create a checkout session.
 * @nav Frontend/User
 * @return
 * Returns a promise with a successful update response or a request error on a failed request.
 * The response objects holds the `status` and `data` properties on a successful response, and an `error` property on a failed request.
 * @docs
 */
async function create_checkout_session(payload) {
    return request({
        method: "POST",
        url: "/volt/api/stripe/v1/checkout/session",
        data: payload,
    });
}
