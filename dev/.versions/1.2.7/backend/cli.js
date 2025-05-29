#!/usr/bin/env node
/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Imports.

const {vlib} = require("./backend/vinc.js")
const vweb = require("./backend/vweb.js")

// ---------------------------------------------------------
// Global constants.

const CONFIG_PATHS = [
    "./server.json",
    "./server.js",
    "./server/server.json",
    "./server/server.js",
];

// ---------------------------------------------------------
// CLI.

// Initialize the server.
const initialize_server = (path = null, source = "") => {
    if (source == null) {
        source = "";
    }
    if (path == null) {
        path = CONFIG_PATHS.iterate((subpath) => {
            let path = new vlib.Path(source + subpath);
            path = path.abs();
            if (path.exists()) {
                return path;
            }
        })
        if (path == null) {
            throw Error(`Unable to find a configuration file, either specify a the path to the configuration file using argument "--config". Or create a configuration file at one of the following sub paths: ${CONFIG_PATHS.join(", ")}.`);
        }
    }
    else {
        path = new vlib.Path(path);
    }
    if (path.extension() == ".js") {
        let config = require(path.str());
        if (config.server) {
            config = config.server;
        }
        if (config instanceof vweb.Server) { return {path, server: config}; }
        return {path, server: vweb.Server(config)}
    } else {
        return {path, server: vweb.Server(path.load_sync({type: "object"}))};
    }
}

// Create the CLI.
/*  @docs:
 *  @lang: CLI
 *  @name: CLI
 *  @title: VWeb CLI
 *  @description: The VWeb CLI.
 *  @usage: 
 *      @CLI:
 *          $ vweb --start
 */
const cli = new vlib.CLI({
    name: "vweb",
    description: 
`The vweb cli. The cli must be able to access the initialized server instance or its configuration object. This can be achieved in two ways.

1. A JSON file can be used to create the settings for the server.
   The file can reside at the following project locations:
       ./server.json
       ./server/server.json

2. Using a JavaScript configuration file.
   The JS server file must export an object with the server's settings (parameters) or an initialized instance of vweb.Server.
   Both objects must either be exported as 'module.exports = server' or as 'module.exports = {server: server}'.
   The file can reside at the following project locations:
       ./server.js
       ./server/server.js
`,
    version: "1.1.1",
    commands: [

        // Start.
        /*  @docs:
         *  @lang: CLI
         *  @parent: CLI
         *  @title: Start
         *  @name: --start
         *  @description: Start the website (daemon).
         *  @param:
         *      @name: --source
         *      @type: string
         *      @desc: The source path to the website, the configuration file will be automatically loaded. It must reside at one of the default config sub paths.
         *      @con_required: true
         *  @param:
         *      @name: --config
         *      @type: string
         *      @desc: The path to the configuration file.
         *      @con_required: true
         *  @param:
         *      @name: --daemon
         *      @type: boolean
         *      @desc: Flag to start the service daemon.
         *      @con_required: true
         *  @usage: 
         *      @CLI:
         *          $ cd path/to/my/website && vweb --start
         *          $ vweb --start --source path/to/my/website
         *          $ vweb --start --config path/to/my/website/config.js
         */
        {
            id: "--start",
            description: "Start the website (daemon).",
            examples: {
                "Start": "cd path/to/my/website && vweb --start",
                "Start": "vweb --start --source path/to/my/website",
                "Start": "vweb --start --config path/to/my/website/config.js",
            },
            args: [
                {id: "--source", type: "string", description: `The source path to the website, the configuration file will be automatically loaded. It must reside at one of the default config sub paths.`},
                {id: "--config", type: "string", description: `The path to the configuration file.`},
                {id: "--daemon", type: "boolean", description: `Flag to start the service daemon.`},
            ],
            callback: async ({
                source = null,
                config = null,
                daemon = false,
            }) => {
                const {path, server} = initialize_server(config, source);

                // Service daemon.
                if (daemon) {

                    // Server daemon.
                    if (server.db.daemon) {
                        await server.db.daemon.stop()
                        if (server.db.daemon.exists()) {
                            await server.db.daemon.update()
                        } else {
                            await server.db.daemon.create()
                        }
                        await server.db.daemon.start()
                    }

                    // Server daemon.
                    if (!server.daemon) { cli.throw_error("The server service daemon is disabled."); }
                    await server.daemon.stop()
                    if (server.daemon.exists()) {
                        await server.daemon.update()
                    } else {
                        await server.daemon.create()
                    }
                    await server.daemon.start()
                }

                // Development server.
                else {
                    if (server.file_watcher) {
                        server.file_watcher.config = path.str();
                    }
                    server.start();
                }
            }
        },

        // Stop.
        /*  @docs:
         *  @lang: CLI
         *  @parent: CLI
         *  @title: Stop
         *  @name: --stop
         *  @description: Stop the website service daemon.
         *  @param:
         *      @name: --source
         *      @type: string
         *      @desc: The source path to the website, the configuration file will be automatically loaded. It must reside at one of the default config sub paths.
         *      @con_required: true
         *  @param:
         *      @name: --config
         *      @type: string
         *      @desc: The path to the configuration file.
         *      @con_required: true
         *  @usage: 
         *      @CLI:
         *          $ vweb --stop
         *          $ vweb --stop --source path/to/my/website
         *          $ vweb --stop --config path/to/my/website/config.js
         */
        {
            id: "--stop",
            description: "Stop the website service daemon.",
            examples: {
                "Stop": "cd path/to/my/website && vweb --stop",
                "Stop": "vweb --stop --source path/to/my/website",
                "Stop": "vweb --stop --config path/to/my/website/config.js",
            },
            args: [
                {id: "--source", type: "string", description: `The source path to the website, the configuration file will be automatically loaded. It must reside at one of the default config sub paths.`},
                {id: "--config", type: "string", description: `The path to the configuration file.`},
            ],
            callback: async ({
                source = null,
                config = null,
            }) => {
                const {server} = initialize_server(config, source);

                // Server daemon.
                if (server.db.daemon) {
                    await server.db.daemon.stop()
                }

                // Server daemon.
                if (!server.daemon) { cli.throw_error("The server service daemon is disabled."); }
                await server.daemon.stop()
            }
        },

    ],
});

// Start.
cli.start();