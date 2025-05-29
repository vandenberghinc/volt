export = Mutex;
declare class Mutex {
    locked: boolean;
    queue: any[];
    lock(): Promise<any>;
    unlock(): void;
}
