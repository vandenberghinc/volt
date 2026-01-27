/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh.
 */

import type { Server } from "../../../backend/src/server.js";
import type { APIError } from "../../../backend/src/stream.js";

export namespace Request {

    /** The method type. */
    export type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";

    /** The response data template base. */
    type ResponseBodyBase = unknown | null | undefined | number | boolean | string | any[] | Record<string, any>;

    /** The request data template base. */
    type RequestBodyBase = unknown | null | undefined | string | Record<string, any>;

    /**
     * The detailed generic type for providing info for the {@link request} function.
     */
    export type Info<
        Method extends Request.Method,
        Endpoint extends string | RegExp,
        ParamsBody extends RequestBodyBase,
        SuccessBody extends ResponseBodyBase,
        ErrorBody extends ResponseBodyBase,
    > = {
        /** The HTTP method for the request. */
        method: Method;
        /** The route's endpoint or full url with domain, string or regex. */
        endpoint: Endpoint;
        /** The request payload (body) type. */
        payload: ParamsBody;
        /** The success result body type. */
        result: SuccessBody;
        /** The error result body type. */
        error: ErrorBody;
    }

    /**
     * Create request info from a registered endpoint.
     */
    export type InfoFromEndpoint<
        E extends Server.RegisteredEndpoint<any, any, any>,
        SuccessBody extends ResponseBodyBase = undefined,
        ErrorBody extends ResponseBodyBase = undefined,
    > = E extends Server.RegisteredEndpoint<infer M, infer EP, infer P>
        ? Info<
            M extends undefined ? "GET" : M extends Method ? M : never,
            EP extends string ? EP : never,
            P,
            SuccessBody,
            ErrorBody
        >
        : never;

    /** The request options. */
    export interface Opts<
        Method extends Request.Method = "GET",
        Url extends string | RegExp = string, // use regex for backend support.
        RequestBody extends RequestBodyBase = unknown
    > {
        method?: Method;
        url: Url;
        data?: RequestBody;
        json?: boolean;
        credentials?: RequestCredentials;
        headers?: Record<string, string>;
    }

    /** The returned result */
    export type Result<
        SuccessBody extends ResponseBodyBase = unknown,
        ErrorBody extends ResponseBodyBase = unknown
    > =
        {
            /** The request status. */
            status: number;
        } & (
            | {
                /** The api error from the backend {@link Stream.error}. */
                error: APIError;
                /** The error response body, always optional in case of body parsing failure. */
                data?: ErrorBody;
            }
            | {
                /** The success response body. */
                data: SuccessBody;
                /** No API error from the backend {@link Stream.error} was found. */
                error?: never;
            }
        );

    /** The returned result by endpoint {@link Info} */
    export type ResultFromInfo<
        Info extends Request.Info<any, any, any, any, any>
    > = Info extends Request.Info<any, any, any, infer S, infer E>
        ? Result<S, E>
        : never;
    
    /** A promise to {@link Result}, for convenience. */
    export type ResultPromise<
        SuccessBody extends ResponseBodyBase = unknown,
        ErrorBody extends ResponseBodyBase = unknown
    > = Promise<Result<SuccessBody, ErrorBody>>;

    /** A promise to {@link Result} from endpoint {@link Info}, for convenience. */
    export type ResultPromiseFromInfo<
        Info extends Request.Info<any, any, any, any, any>
    > = Info extends Request.Info<any, any, any, infer S, infer E>
        ? Promise<Result<S, E>>
        : never;
    
}

/**
 * Make a request with a specific generic typing, optionally passing
 * the request method, endpoint, request body and response body types.
 */
export async function request<Info extends Request.Info<any, any, any, any, any>>(
    options: Info extends Request.Info<infer M, infer E, infer P, any, any>
        ? Request.Opts<M, E, P>
        : never
): Promise<Info extends Request.Info<any, any, any, infer S, infer E> ? Request.Result<S, E> : never> {
    type Res = Info extends Request.Info<any, any, any, infer S, infer E> ? Request.Result<S, E> : never;
    const {
        method = 'GET',
        url = null,
        data = null,
        json = true,
        credentials = "same-origin",
        headers = {},
    } = options;
    if (url instanceof RegExp) {
        throw Error("The 'url' parameter cannot be a RegExp.");
    }

    // — prepare headers —
    if (json && data != null && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    // — build URL + body —
    let finalUrl = url!;
    let body: string | undefined;
    if (data != null && typeof data === 'object') {
        if (method.toUpperCase() === 'GET') {
            // @todo do without any cast.
            finalUrl = `${url}?${new URLSearchParams(data as any).toString()}`;
        } else {
            body = JSON.stringify(data);
        }
    } else if (data != null) {
        body = String(data);
    }

    const init: RequestInit = { method, credentials, headers };
    if (body !== undefined) init.body = body;

    try {
        const response = await fetch(finalUrl, init);
        const status = response.status;

        // — parse payload once —
        let payload: any;
        const clone = response.clone(); // @dev.
        if (json) {
            try {
                payload = await response.json();
            } catch (e: any) {
                // malformed JSON still counts as a “success” fetch
                console.log("[debug] Unable to parse a json from response:", await clone.text(), "- Error: ", JSON.stringify(e, null, 4))
                console.log("[debug] Response:", response);
                return {
                    status,
                    error: { message: `Failed to parse JSON response: ${e.message}` },
                } as Res;
            }
        } else {
            try {
                payload = await response.text();
            } catch (e: any) {
                return {
                    status,
                    error: { message: `Failed to parse text response: ${e.message}` },
                } as Res;
            }
        }
        // console.log("Payload", json, payload)

        // — handle HTTP errors (4xx/5xx) by resolving with an error object —
        if (!response.ok) {
            // if server wrapped its error in { error: { message, type?, invalid_fields? }, … }
            if (
                payload &&
                typeof payload === 'object' &&
                payload.error &&
                typeof payload.error === 'object' &&
                typeof payload.error.message === 'string'
            ) {
                return {
                    status,
                    error: {
                        message: payload.error.message,
                        type: typeof payload.error.type === "string" ? payload.error.type : undefined,
                        invalid_fields: payload.error.invalid_fields && typeof payload.error.invalid_fields === "object" && !Array.isArray(payload.error.invalid_fields)
                            ? payload.error.invalid_fields
                            : undefined,
                    },
                    data: payload.data,
                } as Res;
            }

            // otherwise fall back to a generic single‐message error
            const msg =
                typeof payload === 'string'
                    ? payload
                    : payload?.error?.toString() ?? JSON.stringify(payload);
            return {
                status,
                error: { message: msg },
                data: payload.data,
            } as Res;
        }

        // — 2xx: success —
        return { status, data: payload } as Res;
    } catch (networkErr) {
        // genuine network / system failure
        throw networkErr;
    }
};

// void request<{
//     method: "GET",
//     endpoint: "/example",
//     payload: { id: string },
//     result: { name: string, age: number },
//     error: { reason: string }
// }>({
//     method: "GET",
//     url: "/example",
//     data: { id: "123" }
// })