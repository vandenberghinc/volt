"use strict";
/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */
// ---------------------------------------------------------
// Logger.
const { vlib } = require('./vinc.js');
module.exports = new vlib.Logger({
    log_level: 0,
    threading: true,
});
/*
const fs = require('fs');
const libcluster = require('cluster');
const {vlib} = require('./vinc.js');

module.exports = {
    log_path: null,
    error_path: null,
    log_stream: null,
    error_stream: null,
    max_mb: 50,
    thread: libcluster.worker ? ` [thread-${libcluster.worker.id}]${parseInt(libcluster.worker.id) < 10 ? ":" : ":"}` : " [thread-0]:",
    log_level: 0,

    // Initialize log streams
    assign_paths(log_path, error_path) {
        this.log_path = log_path;
        this.error_path = error_path;
        this.log_stream = fs.createWriteStream(this.log_path.str(), { flags: 'a' });
        this.error_stream = fs.createWriteStream(this.error_path.str(), { flags: 'a' });
    },

    // Trim.
    _trim(path) {
        const stat = path.stat();
    },

    // Log
    log(level, ...args) {
        if (level > this.log_level) { return ; }
        let msg = new vlib.Date().format("%d-%m-%y %H:%M:%S");
        msg += `${this.thread} `;
        for (let i = 0; i < args.length; i++) {
            msg += args[i] + " ";
        }
        console.log(msg);
        if (this.log_stream) {
            msg += '\n';
            this.log_stream.write(msg);
        }
    },

    // Log error
    error(prefix, err) {
        let msg;
        if (err == null) {
            err = prefix;
            prefix = "";
        }
        if (typeof err === "string") {
            msg = `${new vlib.Date().format("%d-%m-%y %H:%M:%S")}${this.thread} ${prefix}${err}`;
        } else if (err != null) {
            msg = `${new vlib.Date().format("%d-%m-%y %H:%M:%S")}${this.thread} ${prefix}${err.stack || err.message}`;
        }
        if (msg) {
            console.error(msg);
            if (this.error_stream) {
                msg += '\n';
                this.error_stream.write(msg);
            }
        }
    },
};
*/ 
