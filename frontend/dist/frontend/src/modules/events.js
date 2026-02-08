/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved
 */
// Events module.
export var Events;
(function (Events) {
    Events.events = new Map();
    // Emit an event.
    /**
     * Emit a registered event.
     * @param id The id of the registered event to emit.
     * @param args The arguments that will be passed to the registered callbacks.
     * @docs
     */
    function emit(id, args = {}) {
        const callbacks = Events.events.get(id);
        if (callbacks == null) {
            return;
        }
        for (const i of callbacks) {
            try {
                i[1](i[0], args);
            }
            catch (e) {
                console.error(`Error in event callback for event '${id}':`, e);
            }
        }
    }
    Events.emit = emit;
    // On event.
    /**
     * Set a callback for an event.
     * @param id The id of the registered event to emit.
     * @param element The element.
     * @param callback The callback function, accepts parameters `(element, args)`.
     * @docs
     */
    function on(id, element, callback) {
        let callbacks = Events.events.get(id);
        if (callbacks == null) {
            callbacks = [];
            Events.events.set(id, callbacks);
        }
        callbacks.push([element, callback]);
    }
    Events.on = on;
    // Remove a callback for an event.
    /**
     * Remove a callback for an event.
     * @param id The id of the registered event to emit.
     * @param element The element.
     * @param callback The callback function to remove. When left undefined, all callbacks matching to that element will be removed.
     * @docs
     */
    function remove(id, element, callback) {
        const callbacks = Events.events.get(id);
        if (callbacks == null) {
            return;
        }
        const filtered = [];
        callbacks.forEach((i) => {
            if (i[0] === element && (callback == null || i[1] === callback)) {
                return;
            }
            filtered.push(i);
        });
        Events.events.set(id, filtered);
    }
    Events.remove = remove;
})(Events || (Events = {}));
export { Events as events }; // also export as lowercase for compatibility.
// Fire the onload event.
/**
 * Fires the `volt.on_load` event when the window finishes loading.
 */
window.onload = () => {
    Events.emit("volt.on_load");
};
