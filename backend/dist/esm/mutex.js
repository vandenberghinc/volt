/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */
/** @docs
 *  @chapter: System
 *  @title: Mutex
 *  @desc: A mutual exclusion primitive useful for protecting shared data structures from concurrent access
 */
export class Mutex {
    locked;
    queue;
    constructor() {
        this.locked = false;
        this.queue = [];
    }
    /** @docs
     *  @title: Lock
     *  @desc: Acquire the mutex lock. Should be awaited
     *  @returns
     *      @type Promise<void>
     *      @desc Resolves when the lock is acquired
     */
    async lock() {
        if (!this.locked) {
            this.locked = true;
        }
        else {
            return new Promise((resolve) => {
                this.queue.push(resolve);
            });
        }
    }
    /** @docs
     *  @title: Unlock
     *  @desc: Release the mutex lock
     */
    unlock() {
        if (this.queue.length > 0) {
            const next_resolve = this.queue.shift();
            next_resolve();
        }
        else {
            this.locked = false;
        }
    }
}
export default Mutex;
