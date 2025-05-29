/** @docs
 *  @chapter: System
 *  @title: Mutex
 *  @desc: A mutual exclusion primitive useful for protecting shared data structures from concurrent access
 */
export declare class Mutex {
    private locked;
    private queue;
    constructor();
    /** @docs
     *  @title: Lock
     *  @desc: Acquire the mutex lock. Should be awaited
     *  @returns
     *      @type Promise<void>
     *      @desc Resolves when the lock is acquired
     */
    lock(): Promise<void>;
    /** @docs
     *  @title: Unlock
     *  @desc: Release the mutex lock
     */
    unlock(): void;
}
export default Mutex;
