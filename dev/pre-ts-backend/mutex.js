/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Mutex class.

class Mutex {
    constructor() {
        this.locked = false;
        this.queue = [];
    }

    // Lock the mutex.
    // Should be awaited.
    async lock() {
        if (!this.locked) {
            this.locked = true;
        } else {
            return new Promise((resolve) => {
                this.queue.push(resolve);
            });
        }
    }

    // Unlock the mutex.
    unlock() {
        if (this.queue.length > 0) {
            const next_resolve = this.queue.shift();
            next_resolve();
        } else {
            this.locked = false;
        }
    }
}

// ---------------------------------------------------------
// Exports.

module.exports = Mutex;
