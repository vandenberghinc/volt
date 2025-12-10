var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  Status: () => Status,
  status: () => Status
});
module.exports = __toCommonJS(stdin_exports);
var Status;
(function(Status2) {
  Status2[Status2["undefined"] = 0] = "undefined";
  Status2[Status2["continue"] = 100] = "continue";
  Status2[Status2["switching_protocols"] = 101] = "switching_protocols";
  Status2[Status2["early_hints"] = 103] = "early_hints";
  Status2[Status2["success"] = 200] = "success";
  Status2[Status2["created"] = 201] = "created";
  Status2[Status2["accepted"] = 202] = "accepted";
  Status2[Status2["no_auth_info"] = 203] = "no_auth_info";
  Status2[Status2["no_content"] = 204] = "no_content";
  Status2[Status2["reset_content"] = 205] = "reset_content";
  Status2[Status2["partial_content"] = 206] = "partial_content";
  Status2[Status2["multiple_choices"] = 300] = "multiple_choices";
  Status2[Status2["moved_permanently"] = 301] = "moved_permanently";
  Status2[Status2["found"] = 302] = "found";
  Status2[Status2["see_other"] = 303] = "see_other";
  Status2[Status2["not_modified"] = 304] = "not_modified";
  Status2[Status2["temporary_redirect"] = 307] = "temporary_redirect";
  Status2[Status2["permanent_redirect"] = 308] = "permanent_redirect";
  Status2[Status2["bad_request"] = 400] = "bad_request";
  Status2[Status2["unauthorized"] = 401] = "unauthorized";
  Status2[Status2["payment_required"] = 402] = "payment_required";
  Status2[Status2["forbidden"] = 403] = "forbidden";
  Status2[Status2["not_found"] = 404] = "not_found";
  Status2[Status2["method_not_allowed"] = 405] = "method_not_allowed";
  Status2[Status2["not_acceptable"] = 406] = "not_acceptable";
  Status2[Status2["proxy_auth_required"] = 407] = "proxy_auth_required";
  Status2[Status2["Requestimeout"] = 408] = "Requestimeout";
  Status2[Status2["conflict"] = 409] = "conflict";
  Status2[Status2["gone"] = 410] = "gone";
  Status2[Status2["length_required"] = 411] = "length_required";
  Status2[Status2["precondition_failed"] = 412] = "precondition_failed";
  Status2[Status2["payload_too_large"] = 413] = "payload_too_large";
  Status2[Status2["uri_too_large"] = 414] = "uri_too_large";
  Status2[Status2["unsupported_media_type"] = 415] = "unsupported_media_type";
  Status2[Status2["range_not_statisfiable"] = 416] = "range_not_statisfiable";
  Status2[Status2["expectation_failed"] = 417] = "expectation_failed";
  Status2[Status2["imateapot"] = 418] = "imateapot";
  Status2[Status2["unprocessable_entity"] = 422] = "unprocessable_entity";
  Status2[Status2["too_early"] = 425] = "too_early";
  Status2[Status2["upgrade_required"] = 426] = "upgrade_required";
  Status2[Status2["precondition_required"] = 428] = "precondition_required";
  Status2[Status2["too_many_requests"] = 429] = "too_many_requests";
  Status2[Status2["request_header_fields_too_large"] = 431] = "request_header_fields_too_large";
  Status2[Status2["unavailable_for_legal_reasons"] = 451] = "unavailable_for_legal_reasons";
  Status2[Status2["internal_server_error"] = 500] = "internal_server_error";
  Status2[Status2["not_implemented"] = 501] = "not_implemented";
  Status2[Status2["bad_gateway"] = 502] = "bad_gateway";
  Status2[Status2["service_unvailable"] = 503] = "service_unvailable";
  Status2[Status2["gateway_timeout"] = 504] = "gateway_timeout";
  Status2[Status2["http_version_not_supported"] = 505] = "http_version_not_supported";
  Status2[Status2["variant_also_negotiates"] = 506] = "variant_also_negotiates";
  Status2[Status2["insufficient_storage"] = 507] = "insufficient_storage";
  Status2[Status2["loop_detected"] = 508] = "loop_detected";
  Status2[Status2["not_extended"] = 510] = "not_extended";
  Status2[Status2["network_auth_required"] = 511] = "network_auth_required";
  Status2[Status2["two_factor_auth_required"] = 418] = "two_factor_auth_required";
})(Status || (Status = {}));
;
(function(Status2) {
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
        return "Two Factor Auth Required";
      // Custom status
      default:
        return `Unknown Status ${status}`;
    }
  }
  Status2.get_description = get_description;
})(Status || (Status = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Status,
  status
});
