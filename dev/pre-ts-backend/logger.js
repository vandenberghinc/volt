/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Logger.

const {vlib} = require('./vinc.js');
module.exports = new vlib.Logger({
    log_level: 0,
    threading: true,
});
