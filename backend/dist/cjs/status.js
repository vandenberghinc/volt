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
  default: () => stdin_default,
  status: () => Status
});
module.exports = __toCommonJS(stdin_exports);
const Status = {
  undefined: 0,
  continue: 100,
  switching_protocols: 101,
  early_hints: 103,
  success: 200,
  created: 201,
  accepted: 202,
  no_auth_info: 203,
  no_content: 204,
  reset_content: 205,
  partial_content: 206,
  multiple_choices: 300,
  moved_permanently: 301,
  found: 302,
  see_other: 303,
  not_modified: 304,
  temporary_redirect: 307,
  permanent_redirect: 308,
  bad_request: 400,
  unauthorized: 401,
  payment_required: 402,
  forbidden: 403,
  not_found: 404,
  method_not_allowed: 405,
  not_acceptable: 406,
  proxy_auth_required: 407,
  Requestimeout: 408,
  conflict: 409,
  gone: 410,
  length_required: 411,
  precondition_failed: 412,
  payload_too_large: 413,
  uri_too_large: 414,
  unsupported_media_type: 415,
  range_not_statisfiable: 416,
  expectation_failed: 417,
  imateapot: 418,
  unprocessable_entity: 422,
  too_early: 425,
  upgrade_required: 426,
  precondition_required: 428,
  too_many_requests: 429,
  request_header_fields_too_large: 431,
  unavailable_for_legal_reasons: 451,
  internal_server_error: 500,
  not_implemented: 501,
  bad_gateway: 502,
  service_unvailable: 503,
  gateway_timeout: 504,
  http_version_not_supported: 505,
  variant_also_negotiates: 506,
  insufficient_storage: 507,
  loop_detected: 508,
  not_extended: 510,
  network_auth_required: 511,
  // Custom statuses.
  two_factor_auth_required: 418,
  // i am a teapot, should not be changed, used by volt js.
  // Get description.
  get_description(status) {
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
};
var stdin_default = Status;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Status,
  status
});
