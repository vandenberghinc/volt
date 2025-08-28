/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Events module.
export namespace Events {
    export const events = new Map<string, Array<[any, (element: any, args: any) => void]>>();

    // Emit an event.
    /**
     * Emit a registered event.
     * @param id The id of the registered event to emit.
     * @param args The arguments that will be passed to the registered callbacks.
     * @docs
     */
    export function emit(id: string, args: Record<string, any> = {}): void {
        const callbacks = events.get(id);
        if (callbacks == null) {
            return;
        }
        callbacks.forEach((i) => {
            i[1](i[0], args);
        });
    }

    // On event.
    /**
     * Set a callback for an event.
     * @param id The id of the registered event to emit.
     * @param element The element.
     * @param callback The callback function, accepts parameters `(element, args)`.
     * @docs
     */
    export function on<T extends object>(id: string, element: T, callback: (element: T, args: Record<string, any>) => void): void {
        let callbacks = events.get(id);
        if (callbacks == null) {
            callbacks = [];
            events.set(id, callbacks);
        }
        callbacks.push([element, callback]);
    }

    // Remove a callback for an event.
    /**
     * Remove a callback for an event.
     * @param id The id of the registered event to emit.
     * @param element The element.
     * @param callback The callback function to remove. When left undefined, all callbacks matching to that element will be removed.
     * @docs
     */
    export function remove<T extends object>(id: string, element: T, callback?: (element: T, args: Record<string, any>) => void): void {
        const callbacks = events.get(id);
        if (callbacks == null) {
            return;
        }
        const filtered: Array<[any, (element: any, args: any) => void]> = [];
        callbacks.forEach((i) => {
            if (i[0] === element && (callback == null || i[1] === callback)) {
                return;
            }
            filtered.push(i);
        });
        events.set(id, filtered);
    }
}
export { Events as events }; // also export as lowercase for compatibility.

// Fire the onload event.
/**
 * Fires the `volt.on_load` event when the window finishes loading.
 */
window.onload = () => {
    Events.emit("volt.on_load");
}
