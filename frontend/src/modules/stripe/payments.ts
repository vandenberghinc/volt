/**
 * @author Daan van den Bergh
 * @copyright © 2026 - 2026 Daan van den Bergh. All rights reserved
 * 
 * The frontend payments module for stripe billing.
 */

import { Stripe as StripeBackend } from "../../../../backend/src/payments/stripe/stripe";
import { Request, request } from "../request.js";

/**
 * Get the list of products.
 * @returns
 * A promise with a successful update response or a request error on a failed request.
 * The response objects holds the `status` and `data` properties on a successful response, and an `error` property on a failed request.
 * @docs
 */
export async function get_products(): Request.ResultPromiseFromInfo<StripeBackend.Endpoints.GetProducts> {
    return request<StripeBackend.Endpoints.GetProducts>({
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
export async function get_active_subscriptions(): Request.ResultPromiseFromInfo<StripeBackend.Endpoints.GetSubscriptions> {
    return request<StripeBackend.Endpoints.GetSubscriptions>({
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
export async function get_active_meters(): Request.ResultPromiseFromInfo<StripeBackend.Endpoints.GetMeterSubscriptions> {
    return request<StripeBackend.Endpoints.GetMeterSubscriptions>({
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
export async function cancel_subscription(
    payload: StripeBackend.Endpoints.CancelSubscription["payload"]
): Request.ResultPromiseFromInfo<StripeBackend.Endpoints.CancelSubscription> {
    return request<StripeBackend.Endpoints.CancelSubscription>({
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
export async function create_checkout_session_id(
    payload: StripeBackend.Endpoints.CreateCheckoutSessionId["payload"]
): Request.ResultPromiseFromInfo<StripeBackend.Endpoints.CreateCheckoutSessionId> {
    return request<StripeBackend.Endpoints.CreateCheckoutSessionId>({
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
export async function create_checkout_session(
    payload: StripeBackend.Endpoints.StartCheckoutSession["payload"]
): Request.ResultPromiseFromInfo<StripeBackend.Endpoints.StartCheckoutSession> {
    return request<StripeBackend.Endpoints.StartCheckoutSession>({
        method: "POST",
        url: "/volt/api/stripe/v1/checkout/session",
        data: payload,
    });
}
