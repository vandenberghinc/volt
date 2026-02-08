/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
// HTTP response status.
// - Does not include all status codes.
/**
 * HTTP status codes.
 * @example
 * {Success status check}
 * Check if a response was successful using `volt.Status.success`.
 * ```
 * ...
 * if (response.status === volt.Status.success) {
 *     console.log("Request was successful!");
 * }
 * ```
 *
 * @nav Server
 * @docs
 */
export var Status;
(function (Status) {
    Status[Status["undefined"] = 0] = "undefined";
    Status[Status["continue"] = 100] = "continue";
    Status[Status["switching_protocols"] = 101] = "switching_protocols";
    Status[Status["early_hints"] = 103] = "early_hints";
    Status[Status["success"] = 200] = "success";
    Status[Status["created"] = 201] = "created";
    Status[Status["accepted"] = 202] = "accepted";
    Status[Status["no_auth_info"] = 203] = "no_auth_info";
    Status[Status["no_content"] = 204] = "no_content";
    Status[Status["reset_content"] = 205] = "reset_content";
    Status[Status["partial_content"] = 206] = "partial_content";
    Status[Status["multiple_choices"] = 300] = "multiple_choices";
    Status[Status["moved_permanently"] = 301] = "moved_permanently";
    Status[Status["found"] = 302] = "found";
    Status[Status["see_other"] = 303] = "see_other";
    Status[Status["not_modified"] = 304] = "not_modified";
    Status[Status["temporary_redirect"] = 307] = "temporary_redirect";
    Status[Status["permanent_redirect"] = 308] = "permanent_redirect";
    Status[Status["bad_request"] = 400] = "bad_request";
    Status[Status["unauthorized"] = 401] = "unauthorized";
    Status[Status["payment_required"] = 402] = "payment_required";
    Status[Status["forbidden"] = 403] = "forbidden";
    Status[Status["not_found"] = 404] = "not_found";
    Status[Status["method_not_allowed"] = 405] = "method_not_allowed";
    Status[Status["not_acceptable"] = 406] = "not_acceptable";
    Status[Status["proxy_auth_required"] = 407] = "proxy_auth_required";
    Status[Status["Requestimeout"] = 408] = "Requestimeout";
    Status[Status["conflict"] = 409] = "conflict";
    Status[Status["gone"] = 410] = "gone";
    Status[Status["length_required"] = 411] = "length_required";
    Status[Status["precondition_failed"] = 412] = "precondition_failed";
    Status[Status["payload_too_large"] = 413] = "payload_too_large";
    Status[Status["uri_too_large"] = 414] = "uri_too_large";
    Status[Status["unsupported_media_type"] = 415] = "unsupported_media_type";
    Status[Status["range_not_statisfiable"] = 416] = "range_not_statisfiable";
    Status[Status["expectation_failed"] = 417] = "expectation_failed";
    Status[Status["imateapot"] = 418] = "imateapot";
    Status[Status["unprocessable_entity"] = 422] = "unprocessable_entity";
    Status[Status["too_early"] = 425] = "too_early";
    Status[Status["upgrade_required"] = 426] = "upgrade_required";
    Status[Status["precondition_required"] = 428] = "precondition_required";
    Status[Status["too_many_requests"] = 429] = "too_many_requests";
    Status[Status["request_header_fields_too_large"] = 431] = "request_header_fields_too_large";
    Status[Status["unavailable_for_legal_reasons"] = 451] = "unavailable_for_legal_reasons";
    Status[Status["internal_server_error"] = 500] = "internal_server_error";
    Status[Status["not_implemented"] = 501] = "not_implemented";
    Status[Status["bad_gateway"] = 502] = "bad_gateway";
    Status[Status["service_unvailable"] = 503] = "service_unvailable";
    Status[Status["gateway_timeout"] = 504] = "gateway_timeout";
    Status[Status["http_version_not_supported"] = 505] = "http_version_not_supported";
    Status[Status["variant_also_negotiates"] = 506] = "variant_also_negotiates";
    Status[Status["insufficient_storage"] = 507] = "insufficient_storage";
    Status[Status["loop_detected"] = 508] = "loop_detected";
    Status[Status["not_extended"] = 510] = "not_extended";
    Status[Status["network_auth_required"] = 511] = "network_auth_required";
    // Custom statuses.
    Status[Status["two_factor_auth_required"] = 418] = "two_factor_auth_required";
})(Status || (Status = {}));
;
(function (Status) {
    /**
     * Get the description string for a status code.
     *
     * @param status The status number.
     * @returns The description string that corresponds to the status code.
     *
     * @docs
     */
    function get_description(status) {
        switch (status) {
            case 0:
                return "Undefined";
            case 100:
                return "Continue";
            case 101:
                return "Switching Protocols";
            case 103:
                return "Early Hints";
            case 200:
                return "OK";
            case 201:
                return "Created";
            case 202:
                return "Accepted";
            case 203:
                return "Non-Authoritative Information";
            case 204:
                return "No Content";
            case 205:
                return "Reset Content";
            case 206:
                return "Partial Content";
            case 300:
                return "Multiple Choices";
            case 301:
                return "Moved Permanently";
            case 302:
                return "Found";
            case 303:
                return "See Other";
            case 304:
                return "Not Modified";
            case 307:
                return "Temporary Redirect";
            case 308:
                return "Permanent Redirect";
            case 400:
                return "Bad Request";
            case 401:
                return "Unauthorized";
            case 402:
                return "Payment Required";
            case 403:
                return "Forbidden";
            case 404:
                return "Not Found";
            case 405:
                return "Method Not Allowed";
            case 406:
                return "Not Acceptable";
            case 407:
                return "Proxy Authentication Required";
            case 408:
                return "Request Timeout";
            case 409:
                return "Conflict";
            case 410:
                return "Gone";
            case 411:
                return "Length Required";
            case 412:
                return "Precondition Failed";
            case 413:
                return "Payload Too Large";
            case 414:
                return "URI Too Long";
            case 415:
                return "Unsupported Media Type";
            case 416:
                return "Range Not Satisfiable";
            case 417:
                return "Expectation Failed";
            // case 418:
            //     return "I'm a teapot";
            case 422:
                return "Unprocessable Entity";
            case 425:
                return "Too Early";
            case 426:
                return "Upgrade Required";
            case 428:
                return "Precondition Required";
            case 429:
                return "Too Many Requests";
            case 431:
                return "Request Header Fields Too Large";
            case 451:
                return "Unavailable For Legal Reasons";
            case 500:
                return "Internal Server Error";
            case 501:
                return "Not Implemented";
            case 502:
                return "Bad Gateway";
            case 503:
                return "Service Unavailable";
            case 504:
                return "Gateway Timeout";
            case 505:
                return "HTTP Version Not Supported";
            case 506:
                return "Variant Also Negotiates";
            case 507:
                return "Insufficient Storage";
            case 508:
                return "Loop Detected";
            case 510:
                return "Not Extended";
            case 511:
                return "Network Authentication Required";
            // Custom.
            case 418:
                return "Two Factor Auth Required"; // Custom status
            default:
                return `Unknown Status ${status}`;
        }
    }
    Status.get_description = get_description;
})(Status || (Status = {}));
export { Status as status }; // snake_case compatibility.
