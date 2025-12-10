export declare class ThreadMonitor {
    private async_resources;
    private ignored_types;
    private hook;
    constructor();
    start(): void;
    stop(): void;
    dump_active_resources(options?: {
        min_age?: number;
        types?: string[];
        exclude_types?: string[];
        include_internal?: boolean;
    }): void;
    get_resource_count(): {
        [key: string]: number;
    };
}
export default ThreadMonitor;
