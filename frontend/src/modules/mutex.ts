/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Imports.
import { Elements } from "../elements/module.js";

// ---------------------------------------------------------
// Mutex class.

export class Mutex {
    locked: boolean;
    queue: Array<() => void>;

    constructor() {
        this.locked = false;
        this.queue = [];
    }

    // Lock the mutex.
    // Should be awaited.
    /*  @docs:
        @nav: Frontend
        @chapter: Mutex
        @title: Lock
        @desc: Lock the mutex. This method should be awaited to ensure the proper locking mechanism.
    */
    async lock(): Promise<void> {
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
    /*  @docs:
        @nav: Frontend
        @chapter: Mutex
        @title: Unlock
        @desc: Unlock the mutex, allowing the next item in the queue to proceed.
    */
    unlock(): void {
        if (this.queue.length > 0) {
            const nextResolve = this.queue.shift();
            if (nextResolve) {
                nextResolve();
            }
        } else {
            this.locked = false;
        }
    }
}