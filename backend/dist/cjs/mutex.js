var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  Mutex: () => Mutex,
  default: () => stdin_default
});
module.exports = __toCommonJS(stdin_exports);
class Mutex {
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
    } else {
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
    } else {
      this.locked = false;
    }
  }
}
var stdin_default = Mutex;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Mutex
});
