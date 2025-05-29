/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Imports.

const zlib = require('zlib');

// ---------------------------------------------------------
// Response object.

/*  @docs 
 *  @nav: Backend
 *  @chapter: Stream
 *  @title: Response
 *  @description: The response object.
 *  @deprecated: true
 */
class Response {
    constructor(res) {

        // Arguments.
        this.res = res;

        // Attributes.
        this.cookies = [];

        // Copy default functions.
        // this.addTrailers = this.res.addTrailers;
        this.cork = this.res.cork.bind(this.res);
        this.end = this.res.end.bind(this.res);
        // this.flushHeaders = this.res.flushHeaders;
        // this.getHeader = this.res.getHeader;
        // this.getHeaderNames = this.res.getHeaderNames;
        // this.getHeaders = this.res.getHeaders;
        // this.hasHeader = this.res.hasHeader;
        // this.removeHeader = this.res.removeHeader;
        // this.setHeader = this.res.setHeader;
        // this.setTimeout = this.res.setTimeout;
        this.uncork = this.res.uncork.bind(this.res);
        this.write = this.res.write.bind(this.res);
        // this.writeContinue = this.res.writeContinue;
        // this.writeEarlyHints = this.res.writeEarlyHints;
        // this.writeHead = this.res.writeHead;
        // this.writeProcessing = this.res.writeProcessing;

        // Create lowercase functions.
        this.add_trailers = this.res.addTrailers.bind(this.res);
        this.flush_headers = this.res.flushHeaders.bind(this.res);
        this.get_header = this.res.getHeader.bind(this.res);
        this.get_header_names = this.res.getHeaderNames.bind(this.res);
        this.get_headers = this.res.getHeaders.bind(this.res);
        this.has_header = this.res.hasHeader.bind(this.res);
        this.remove_header = this.res.removeHeader.bind(this.res);
        this.set_header = this.res.setHeader.bind(this.res);
        this.set_timeout = this.res.setTimeout;
        // this.write_continue = this.res.writeContinue;
        // this.write_early_hints = this.res.writeEarlyHints;
        // this.write_head = this.res.writeHead;
        // this.write_processing = this.res.writeProcessing;
    }

    // ---------------------------------------------------------
    // Functions.

    // Send a response.
	/*  @docs:
     *  @title: Send
     *  @description: Send a response
     *  @parameter:
     *      @name: status
     *      @description: The response status.
     *      @type: number
	 *  @parameter:
     *      @name: headers
     *      @description: The response headers.
     *      @type: object
	 *  @parameter:
     *      @name: data
     *      @description: The response data.
     *      @type: undefined, string
	 *  @parameter:
     *      @name: compress
     *      @description: A boolean indicating if the response data should be compressed.
     *      @type: boolean
     *  @usage:
     *      ...
     *      response.send({status: 200, data: "Hello World!"});
     */
    send({status = 200, headers = {}, data = null, compress = false} = {}) {

        // Set status code.
        this.res.statusCode = status;

        // Set headers.
        Object.keys(headers).forEach((key) => {
            this.res.setHeader(key, headers[key]);
        });

        // Set cookies.
        if (this.cookies.length > 0) {
            this.res.setHeader('Set-Cookie', this.cookies);
        }

        // Convert data.
        let is_json = false;
        if (data != null && typeof data === 'object' && Buffer.isBuffer(data) === false && (data instanceof Uint8Array) === false) {
            is_json = true;
            data = JSON.stringify(data);
        }

        // @todo compress.
        if (compress) {
            this.res.setHeader("Content-Encoding", "gzip");
            this.res.setHeader("Vary", "Accept-Encoding");
            data = zlib.gzipSync(data, {level: zlib.constants.Z_BEST_COMPRESSION});
        }

        // Set data.
        if (data !== null) {
            if (is_json) {
                this.res.setHeader("Content-Type", "application/json");
            }
            this.res.write(data); // do not use toString() here or it will cause issues with writing binary data.
        }

        // End.
        this.res.end();
    }

    // Send a successs response.
	/*  @docs:
     *  @title: Send Successs
     *  @description: Send a response
     *  @parameter:
     *      @name: status
     *      @description: The response status.
     *      @type: number
	 *  @parameter:
     *      @name: headers
     *      @description: The response headers.
     *      @type: object
	 *  @parameter:
     *      @name: data
     *      @description: The response data.
     *      @type: undefined, string
	 *  @parameter:
     *      @name: compress
     *      @description: A boolean indicating if the response data should be compressed.
     *      @type: boolean
     *  @usage:
     *      ...
     *      response.success({data: "Hello World!"});
     */
    success({status = 200, headers = {}, data = null, compress = false} = {}) {
        return this.send({status: status, headers: headers, data: data, compress: compress});
    }
	
	// Send an error response.
	/*  @docs:
     *  @title: Send Error
     *  @description: Send an error response
     *  @parameter:
     *      @name: status
     *      @description: The response status.
     *      @type: number
	 *  @parameter:
     *      @name: headers
     *      @description: The response headers.
     *      @type: object
	 *  @parameter:
     *      @name: data
     *      @description: The response data.
     *      @type: undefined, string
	 *  @parameter:
     *      @name: compress
     *      @description: A boolean indicating if the response data should be compressed.
     *      @type: boolean
     *  @usage:
     *      ...
     *      response.error({data: "Some error occured"});
     */
    error({status = 500, headers = {}, data = null, compress = false} = {}) {
        return this.send({status: status, headers: headers, data: data, compress: compress});
    }

    // Set headers.
	/*  @docs:
     *  @title: Set Headers
     *  @description: Add new headers to the response data.
	 *  @parameter:
     *      @name: headers
     *      @description: The new response headers.
     *      @type: object
     *  @usage:
     *      ...
     *      response.set_headers({"Connection": "close"});
     */
    set_headers(headers = {}) {
        if (headers === null) { return null; }
        Object.keys(headers).forEach((key) => {
            this.res.setHeader(key, headers[key]);
        });
    }

    // Set a cookie.
	/*  @docs:
     *  @title: Set cookie.
     *  @description: Set a cookie that will be sent with the response.
	 *  @warning: Will only be added to the response when the user uses `send()`, `success()` or `error()`.
	 *  @parameter:
     *      @name: cookie
     *      @description: The cookie string.
     *      @type: string
     *  @usage:
     *      ...
     *      response.set_cookie("MyCookie=Hello World;");
     */
    set_cookie(cookie) {
        this.cookies.push(cookie);
    }
	
	// Set cookies.
	/*  @docs:
     *  @title: Set Cookies
     *  @description: Set a cookie that will be sent with the response.
	 *  @warning: Will only be added to the response when the user uses `send()`, `success()` or `error()`.
	 *  @parameter:
     *      @name: cookies
     *      @description: The cookie strings.
     *      @type: ...string
     *  @usage:
     *      ...
     *      response.set_cookies("MyCookie1=Hello World;", "MyCookie2=Hello Universe;");
     */
    set_cookies(cookies) {
        for (let i = 0; i < cookies.length; i++) {
            this.cookies.push(cookies[i]);
        }
    }

    // ---------------------------------------------------------
    // Defaults.

    // Create lowercase functions for default getters and setters.
    get headers_sent() {
        return this.res.headersSent;
    }
    set headers_sent(val) {
        this.res.headersSent = val;
    }
    get send_date() {
        return this.res.sendDate;
    }
    set send_date(val) {
        this.res.sendDate = val;
    }
    get status_code() {
        return this.res.statusCode;
    }
    set status_code(val) {
        this.res.statusCode = val;
    }
    get status_message() {
        return this.res.statusMessage;
    }
    set status_message(val) {
        this.res.statusMessage = val;
    }
    get strict_content_length() {
        return this.res.strictContentLength;
    }
    set strict_content_length(val) {
        this.res.strictContentLength = val;
    }
    get writable_ended() {
        return this.res.writableEnded;
    }
    set writable_ended(val) {
        this.res.writableEnded = val;
    }
    get finished() {
        return this.res.finished;
    }
    get writable_finished() {
        return this.res.writableFinished;
    }
    set writable_finished(val) {
        this.res.writableFinished = val;
    }

    // Copy default functions.
    // get headersSent() {
    //     return this.res.headersSent;
    // }
    // set headersSent() {
    //     return this.res.headersSent;
    // }
    // get req() {
    //    return this.res.req;
    // }
    // set req() {
    //    return this.res.req; 
    // }
    // get sendDate() {
    //     return this.res.sendDate;
    // }
    // set sendDate() {
    //     return this.res.sendDate;
    // }
    // get socket() {
    //     return this.res.socket;
    // }
    // set socket() {
    //     return this.res.socket;
    // }
    // get statusCode() {
    //     return this.res.statusCode;
    // }
    // set statusCode() {
    //     return this.res.statusCode;
    // }
    // get statusMessage() {
    //     return this.res.statusMessage;
    // }
    // set statusMessage() {
    //     return this.res.statusMessage;
    // }
    // get strictContentLength() {
    //     return this.res.strictContentLength;
    // }
    // set strictContentLength() {
    //     return this.res.strictContentLength;
    // }
    // get writableEnded() {
    //     return this.res.writableEnded;
    // }
    // set writableEnded() {
    //     return this.res.writableEnded;
    // }
    // get writableFinished() {
    //     return this.res.writableFinished;
    // }
    // set writableFinished() {
    //     return this.res.writableFinished;
    // }
}

// ---------------------------------------------------------
// Exports.

module.exports = Response;
