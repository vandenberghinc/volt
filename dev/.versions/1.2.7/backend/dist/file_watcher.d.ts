export class StaticFileWatcher {
    constructor(server: any);
    server: any;
    mtimes: Map<any, any>;
    endpoints: Map<any, any>;
    preview: BrowserPreview | undefined;
    start(): Promise<void>;
    interval: NodeJS.Timeout | undefined;
    add(endpoint: any): void;
    has(endpoint: any): boolean;
    stop(): void;
}
export class FileWatcher {
    constructor({ source, config, interval, excluded, additional_paths, start_file, }: {
        source?: null | undefined;
        config?: null | undefined;
        interval?: number | undefined;
        excluded?: never[] | undefined;
        additional_paths?: never[] | undefined;
        start_file?: null | undefined;
    });
    source: any;
    config: any;
    interval: number;
    excluded: any;
    start_file: any;
    additional_paths: any;
    args: any[];
    mtimes: {};
    promise: Promise<any>;
    add_path(path: any): void;
    add_exclude(path: any): void;
    start(): Promise<void>;
    has_changed: boolean | undefined;
    scan(): Promise<void>;
    scan_files(): void;
    spawn_process(): void;
    _com_file: any;
    proc: undefined;
    restart_process(): Promise<void>;
}
import BrowserPreview = require("./plugins/browser.js");
