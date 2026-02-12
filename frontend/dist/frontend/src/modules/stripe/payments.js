/**
 * @author Daan van den Bergh
 * @copyright © 2026 - 2026 Daan van den Bergh. All rights reserved
 *
 * The frontend payments module for stripe billing.
 */
import { request } from "../request.js";
/**
 * Get the list of products.
 * @returns
 * A promise with a successful update response or a request error on a failed request.
 * The response objects holds the `status` and `data` properties on a successful response, and an `error` property on a failed request.
 * @docs
 */
export async function get_products() {
    return request({
        method: "GET",
        url: "/volt/api/stripe/v1/products",
    });
}
/**
 * List the signed in user's active subscriptions.
 * @returns
 * A promise with a successful update response or a request error on a failed request.
 * The response objects holds the `status` and `data` properties on a successful response, and an `error` property on a failed request.
 * @docs
 */
export async function get_active_subscriptions() {
    return request({
        method: "GET",
        url: "/volt/api/stripe/v1/subscriptions",
    });
}
/**
 * List the signed in user's active meter subscriptions.
 * @returns
 * A promise with a successful update response or a request error on a failed request.
 * The response objects holds the `status` and `data` properties on a successful response, and an `error` property on a failed request.
 * @docs
 */
export async function get_active_meters() {
    return request({
        method: "GET",
        url: "/volt/api/stripe/v1/subscriptions/meters",
    });
}
/**
 * Cancel a subscription of the signed in user.
 * @note A successfull operation will result in an empty `data` field,
 *       any error will be returned in the `error` field.
 * @returns
 * A promise with a successful update response or a request error on a failed request.
 * The response objects holds the `status` and `data` properties on a successful response, and an `error` property on a failed request.
 * @docs
 */
export async function cancel_subscription(payload) {
    return request({
        method: "DELETE",
        url: "/volt/api/stripe/v1/subscriptions",
        data: payload,
    });
}
// ------------------------------------------------------------
// Semi-private functions.
/**
 * Start a checkout session, by generating a session id.
 * @return
 * Returns a promise with a successful update response or a request error on a failed request.
 * The response objects holds the `status` and `data` properties on a successful response, and an `error` property on a failed request.
 * @internal
 */
export async function create_checkout_session_id(payload) {
    return request({
        method: "POST",
        url: "/volt/api/stripe/v1/checkout/session_id",
        data: payload,
    });
}
/**
 * Create a checkout session.
 * @return
 * Returns a promise with a successful update response or a request error on a failed request.
 * The response objects holds the `status` and `data` properties on a successful response, and an `error` property on a failed request.
 * @internal
 */
export async function create_checkout_session(payload) {
    return request({
        method: "POST",
        url: "/volt/api/stripe/v1/checkout/session",
        data: payload,
    });
}
