/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 * @deprecated use tsc & nodemon instead.
 */
export {};
// // ---------------------------------------------------------
// // Libraries.
// import * as fs from "fs";
// import * as path from "path";
// import { spawn, type ChildProcess } from "child_process";
// import { vlib } from "./vinc.js";
// import { BrowserPreview } from "./plugins/browser.js";
// import { logger, LogSource } from "./logger.js";
// // ---------------------------------------------------------
// // Static endpoints file watcher watcher only used for checking static files with reloads.
// class StaticFileWatcher {
//     private server: any;
//     private mtimes: Map<string, number>;
//     private endpoints: Map<string, any>;
//     // @ts-ignore
//     private log_source: LogSource;
//     private interval: NodeJS.Timeout | undefined;
//     constructor(server: any) {
//         this.server = server;
//         this.mtimes = new Map();
//         this.endpoints = new Map();
//         this.log_source = new LogSource("StaticFileWatcher");
//     }
//     async start(): Promise<void> {
//         // Set interval.
//         this.interval = setInterval(async () => {
//             // Changed endpoints.
//             const changed_endpoints: string[] = [];
//             let changed_aspect_ratio = false;
//             // Check file paths.
//             for (const endpoint of this.endpoints.values()) {
//                 if (endpoint._path && !endpoint.view?.is_js_ts_view) {
//                     const path = new vlib.Path(endpoint._path);
//                     if (path.mtime !== this.mtimes.get(endpoint._path)) {
//                         if (this.mtimes.get(endpoint._path) != null) {
//                             logger.log(1, `Refreshing endpoint ${endpoint.method}:${endpoint.endpoint}.`)
//                             // Image.
//                             if (endpoint.is_image_endpoint) {
//                                 endpoint._clear_cache();
//                                 const aspect_ratio = await endpoint.get_aspect_ratio()
//                                 if (aspect_ratio && this.server.statics_aspect_ratios.get(endpoint.endpoint) !== aspect_ratio) {
//                                     changed_aspect_ratio = true;
//                                     this.server.statics_aspect_ratios.set(endpoint.endpoint, aspect_ratio);
//                                 }
//                             }
//                             // Static file.
//                             else if (endpoint.view == null) {
//                                 endpoint._load_data_by_path(this.server);
//                                 changed_endpoints.push(endpoint.endpoint);
//                             }
//                             // Refresh browser.
//                             if (this.server.browser_preview) {
//                                 await this.server.browser_preview.refresh(endpoint.endpoint);
//                             }
//                         }
//                         this.mtimes.set(endpoint._path, path.mtime);
//                     }
//                 }
//             }
//             // Iterate all endpoints using view to check if any included scripts have changed.
//             for (const endpoint of this.endpoints.values()) {
//                 if (endpoint.view && !endpoint.view?.is_js_ts_view) {
//                     let changed = changed_aspect_ratio;
//                     if (!changed && changed_endpoints.length > 0) {
//                         changed = endpoint.view._embedded_sources.some(url => {
//                             return changed_endpoints.includes(url);
//                         });
//                     }
//                     if (changed) {
//                         logger.log(1, `Refreshing endpoint ${endpoint.method}:${endpoint.endpoint}.`)
//                         endpoint._refresh(this.server)
//                         if (this.server.browser_preview) {
//                             await this.server.browser_preview.refresh(endpoint.endpoint);
//                         }
//                     }
//                 }
//             }
//         }, 500)
//     }
//     add(endpoint: any): void {
//         if (endpoint._path) {
//             this.mtimes.set(endpoint._path, new vlib.Path(endpoint._path).mtime)   
//         }
//         this.endpoints.set(endpoint.endpoint, endpoint);
//     }
//     has(endpoint: string): boolean {
//         return this.endpoints.has(endpoint);
//     }
//     stop(): void {
//         if (this.interval) {
//             clearInterval(this.interval)
//         }
//     }
// }
// // ---------------------------------------------------------
// // File watcher watching entire files and restarting when needed.
// /*  @docs:
//  *  @nav: Backend
//     @chapter: Server
//     @title: FileWatcher
//     @description: 
//         Used to watch all included files and restart the server when any changes have been made.
//     @parameter:
//         @name: source
//         @description: The path to the source directory to watch.
//         @type: string
//     @parameter:
//         @name: config
//         @description: The path to the server's configuration file.
//         @type: string
//     @parameter:
//         @name: interval
//         @description: The interval in milliseconds between file change checks.
//         @type: number
//     @parameter:
//         @name: start_file
//         @description: The optional start js file to start the server.
//         @type: string
//  */
// class FileWatcher {
//     private source: string;
//     private config?: string;
//     private interval: number;
//     private excluded: string[];
//     private additional_paths: string[];
//     private start_file?: string;
//     // @ts-ignore
//     private log_source: LogSource;
//     private args: string[];
//     private mtimes: Record<string, number>;
//     public promise: Promise<any>;
//     private proc!: ChildProcess;
//     private has_changed: boolean = false;
//     private _com_file?: any;
//     constructor({
//         source,
//         config = undefined,
//         interval = 750,
//         excluded = [],
//         additional_paths = [],
//         start_file = undefined,
//     }: {
//         source: vlib.Path | string,
//         config?: string,
//         interval?: number,
//         excluded?: string[],
//         additional_paths?: string[],
//         start_file?: string,
//     }) {
//         // Arguments.
//         // this.source = source == null ? source : new vlib.Path(source).abs().str();
//         this.config = config;
//         this.interval = interval;
//         this.excluded = excluded ?? [];
//         this.excluded = this.excluded.filter(Boolean).map(path => new vlib.Path(path).abs().str())
//         this.start_file = start_file;
//         // Check source.
//         if (source) {
//             source = new vlib.Path(source).abs().str();
//         }
//         if ((source as any) instanceof vlib.Path) {
//             source = (source as any).str();
//         }
//         this.source = source as string;
//         if (this.source == null) {
//             throw Error("Define argument: source.");
//         }
//         this.log_source = new LogSource("FileWatcher");
//         // Check if the excluded paths exist for user mistakes, these happen often.
//         this.excluded.forEach(path => {
//             if (!new vlib.Path(path).exists()) {
//                 logger.warn(1, `Excluded file watcher path ${path} does not exist.`);
//             }
//         })
//         // Attributes.
//         this.additional_paths = additional_paths.map(path => new vlib.Path(path).abs().str());
//         this.args = [];
//         this.mtimes = {};
//         this.promise = new Promise(() => {});
//     }
//     // Add path.
//     add_path(path: string | vlib.Path): void {
//         try {
//             const add = new vlib.Path(path).abs().str();
//             logger.log(2, "Add file watcher exclude", add)
//             this.additional_paths.push(add)
//         } catch (e) {
//             logger.warn(0, `Additional file watcher path ${path.toString()} does not exist.`);
//         }
//     }
//     // Add exclude.
//     add_exclude(path: string | vlib.Path): void {
//         try {
//             const add = new vlib.Path(path).abs().str();
//             logger.log(2, "Add file watcher exclude", add)
//             this.excluded.push(add)
//         } catch (e) {
//             logger.warn(1, `Excluded file watcher path ${path.toString()} does not exist.`);
//         }
//     }
//     // Start.
//     async start(): Promise<void> {
//         process.on('SIGTERM', () => {
//             this.proc.kill("SIGTERM");
//             process.exit(0)
//         });
//         process.on('SIGINT', () => {
//             this.proc.kill("SIGINT");
//             process.exit(0)
//         });
//         // Spawn process.
//         this.scan_files();
//         this.has_changed = false;
//         this.spawn_process();
//         this.args.push("--file-watcher-restart")
//         // Start scan loop.
//         await this.scan();
//     }
//     // Scan.
//     async scan(): Promise<void> {
//         this.scan_files()
//         let interval = this.interval;
//         if (this.has_changed) {
//             interval += 250;
//             await new Promise((resolve) => {
//                 setTimeout(async () => {
//                     this.scan_files()
//                     this.has_changed = false;
//                     await this.restart_process();
//                     resolve(null);
//                 }, 250)
//             })
//         }
//         setTimeout(() => this.scan(), interval);
//     }
//     // Scan files.
//     scan_files(): void {
//         const scan_files = (dir: string) => {
//             fs.readdirSync(dir).forEach((name) => scan_file(path.join(dir, name)));    
//         }
//         const scan_file = (path: string) => {
//             if (this.excluded.includes(path)) {
//                 return null;
//             }
//             let stat;
//             try {
//                 stat = fs.statSync(path);
//             } catch (e) {
//                 delete this.mtimes[path]; // a file was deleted.
//                 return;    
//             }
//             if (this.mtimes[path] != stat.mtimeMs) {
//                 if (this.mtimes[path] != null) {
//                     logger.log(1, `Source file ${path} changed.`);
//                 }
//                 this.has_changed = true;
//             }
//             this.mtimes[path] = stat.mtimeMs;
//             if (stat.isDirectory()) {
//                 scan_files(path)
//             }
//         }
//         scan_files(this.source);
//         this.additional_paths.forEach((path) => scan_file(path));
//     }
//     // Spawn process.
//     spawn_process(): void {
//         if (this._com_file === undefined) {
//             // @ts-ignore
//             this._com_file = new vlib.Path(`/tmp/${String.random(12)}`);
//         }
//         if (this.config == null && this.start_file == null) {
//             throw new Error("When 'Server.file_watcher.start_file' is undefined, the server must be started using `$ volt --start` in order to use the file watcher.");
//         }
//         this.proc = spawn(
//             this.start_file ? "node" : "volt",
//             this.start_file
//                 ? [this.start_file, ...this.args, ...process.argv]
//                 : ["--start", "--config", this.config || "", ...this.args, ...process.argv],
//             {
//                 cwd: this.source,
//                 stdio: "inherit",
//                 env: {
//                     ...process.env,
//                     "VOLT_FILE_WATCHER": "1",
//                     "VOLT_STARTED_FILE": this._com_file.str(),
//                 },
//             }
//         );
//         this.proc.on("exit", (code) => {
//             if (code === 0) {
//                 this.scan_files(); // scan again so any subsequent file changes will be updated as well.
//                 this.has_changed = false;
//                 this.spawn_process();
//             } else {
//                 process.exit(code || 1);
//             }
//         })
//         this.proc.on("error", (e) => {
//             console.error(e)
//             process.exit(1);
//         })
//     }
//     // Spawn process.
//     async restart_process(): Promise<void> {
//         logger.log(0, `Restarting server due to file changes.`);
//         this._com_file.save_sync("0");
//         this.has_changed = false;
//         this.proc.kill("SIGINT");
//         await new Promise<void>((resolve) => {
//             const loop = () => {
//                 if (this._com_file.load_sync() === "1") {
//                     return resolve();
//                 }
//                 setTimeout(loop, 150)
//             }
//             loop();
//         })
//     }
// }
// // ---------------------------------------------------------
// // Exports.
// export { StaticFileWatcher, FileWatcher };
