/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Exports.

// Create vweb lib.
const {FrontendError, APIError} = require("./utils.js")
const vweb = {
    APIError,
    FrontendError,
    status: require("./status.js"),
    Meta: require("./meta.js"),
    SplashScreen: require("./splash_screen.js"),
    View: require("./view.js"),
    Endpoint: require("./endpoint.js"),
    Server: require("./server.js"),
    ...require("./rate_limit.js"),
    logger: require("./logger.js"),
    FileWatcher: require("./file_watcher.js"),
    Mail: require("./plugins/mail.js"),
    PDF: require("./plugins/pdf.js"),
    frontend: {
        globals: require("./frontend_globals.js"),
    },
    version: require("../.version.js"),
}

// Export.
module.exports = vweb;