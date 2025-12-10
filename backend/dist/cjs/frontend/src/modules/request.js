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
  request: () => request
});
module.exports = __toCommonJS(stdin_exports);
async function request(options) {
  const { method = "GET", url = null, data = null, json = true, credentials = "same-origin", headers = {} } = options;
  if (url instanceof RegExp) {
    throw Error("The 'url' parameter cannot be a RegExp.");
  }
  if (json && data != null && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  let finalUrl = url;
  let body;
  if (data != null && typeof data === "object") {
    if (method.toUpperCase() === "GET") {
      finalUrl = `${url}?${new URLSearchParams(data).toString()}`;
    } else {
      body = JSON.stringify(data);
    }
  } else if (data != null) {
    body = String(data);
  }
  const init = { method, credentials, headers };
  if (body !== void 0)
    init.body = body;
  try {
    const response = await fetch(finalUrl, init);
    const status = response.status;
    let payload;
    const clone = response.clone();
    if (json) {
      try {
        payload = await response.json();
      } catch (e) {
        console.log("[debug] Unable to parse a json from response:", await clone.text(), "- Error: ", JSON.stringify(e, null, 4));
        console.log("[debug] Response:", response);
        return {
          status,
          error: { message: `Failed to parse JSON response: ${e.message}` }
        };
      }
    } else {
      try {
        payload = await response.text();
      } catch (e) {
        return {
          status,
          error: { message: `Failed to parse text response: ${e.message}` }
        };
      }
    }
    if (!response.ok) {
      if (payload && typeof payload === "object" && payload.error && typeof payload.error === "object" && typeof payload.error.message === "string") {
        return {
          status,
          error: {
            message: payload.error.message,
            type: typeof payload.error.type === "string" ? payload.error.type : void 0,
            invalid_fields: payload.error.invalid_fields && typeof payload.error.invalid_fields === "object" && !Array.isArray(payload.error.invalid_fields) ? payload.error.invalid_fields : void 0
          },
          data: payload.data
        };
      }
      const msg = typeof payload === "string" ? payload : payload?.error?.toString() ?? JSON.stringify(payload);
      return {
        status,
        error: { message: msg },
        data: payload.data
      };
    }
    return { status, data: payload };
  } catch (networkErr) {
    throw networkErr;
  }
}
;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  request
});
