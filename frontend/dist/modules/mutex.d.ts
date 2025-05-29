export declare class Mutex {
    locked: boolean;
    queue: Array<() => void>;
    constructor();
    lock(): Promise<void>;
    unlock(): void;
}
