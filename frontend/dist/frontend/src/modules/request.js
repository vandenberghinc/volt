/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh.
 */
/**
 * Make a request with a specific generic typing, optionally passing
 * the request method, endpoint, request body and response body types.
 */
export async function request(options) {
    const { method = 'GET', url = null, data = null, json = true, credentials = "same-origin", headers = {}, } = options;
    if (url instanceof RegExp) {
        throw Error("The 'url' parameter cannot be a RegExp.");
    }
    // — prepare headers —
    if (json && data != null && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }
    // — build URL + body —
    let finalUrl = url;
    let body;
    if (data != null && typeof data === 'object') {
        if (method.toUpperCase() === 'GET') {
            // @todo do without any cast.
            finalUrl = `${url}?${new URLSearchParams(data).toString()}`;
        }
        else {
            body = JSON.stringify(data);
        }
    }
    else if (data != null) {
        body = String(data);
    }
    const init = { method, credentials, headers };
    if (body !== undefined)
        init.body = body;
    try {
        const response = await fetch(finalUrl, init);
        const status = response.status;
        // — parse payload once —
        let payload;
        const clone = response.clone(); // @dev.
        if (json) {
            try {
                payload = await response.json();
            }
            catch (e) {
                // malformed JSON still counts as a “success” fetch
                console.log("[debug] Unable to parse a json from response:", await clone.text(), "- Error: ", JSON.stringify(e, null, 4));
                console.log("[debug] Response:", response);
                return {
                    status,
                    error: { message: `Failed to parse JSON response: ${e.message}` },
                };
            }
        }
        else {
            try {
                payload = await response.text();
            }
            catch (e) {
                return {
                    status,
                    error: { message: `Failed to parse text response: ${e.message}` },
                };
            }
        }
        // console.log("Payload", json, payload)
        // — handle HTTP errors (4xx/5xx) by resolving with an error object —
        if (!response.ok) {
            // if server wrapped its error in { error: { message, type?, invalid_fields? }, … }
            if (payload &&
                typeof payload === 'object' &&
                payload.error &&
                typeof payload.error === 'object' &&
                typeof payload.error.message === 'string') {
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
                };
            }
            // otherwise fall back to a generic single‐message error
            const msg = typeof payload === 'string'
                ? payload
                : payload?.error?.toString() ?? JSON.stringify(payload);
            return {
                status,
                error: { message: msg },
                data: payload.data,
            };
        }
        // — 2xx: success —
        return { status, data: payload };
    }
    catch (networkErr) {
        // genuine network / system failure
        throw networkErr;
    }
}
;
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
