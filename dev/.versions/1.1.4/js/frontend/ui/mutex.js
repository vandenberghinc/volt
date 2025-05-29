/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Mutex class.

@constructor_wrapper
class MutexElement {
    constructor() {
        this.locked = false;
        this.queue = [];
    }

    // Lock the mutex.
    // Should be awaited.
    async lock() {
        if (!this.locked) {
            this.locked = true;
            return Promise.resolve();
        } else {
            return new Promise((resolve) => {
                this.queue.push(resolve);
            });
        }
    }

    // Unlock the mutex.
    unlock() {
        if (this.queue.length > 0) {
            const nextResolve = this.queue.shift();
            nextResolve();
        } else {
            this.locked = false;
        }
    }
}