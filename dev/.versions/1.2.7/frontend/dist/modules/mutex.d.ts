export declare class MutexType {
    locked: boolean;
    queue: Array<() => void>;
    constructor();
    lock(): Promise<void>;
    unlock(): void;
}
export declare const Mutex: (...args: any[]) => any;
