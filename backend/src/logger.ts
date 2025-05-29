/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Logger.

import * as vlib from "@vandenberghinc/vlib";

export const logger = new vlib.logging.Logger({
    log_level: 0,
});

export default logger;