/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// Events module.
const Events = {
    events: new Map<string, Array<[any, (element: any, args: any) => void]>>(),

    // Emit an event.
    /*  @docs:
        @nav: Frontend
        @chapter: Events
        @title: Emit
        @desc: Emit a registered event.
        @param: 
            @name: id
            @description The id of the registered event to emit.
        @param: 
            @name: args
            @description The arguments that will be passed to the registered callbacks.
    */
    emit(id: string, args: Record<string, any> = {}): void {
        const callbacks = this.events.get(id);
        if (callbacks == null) {
            return;
        }
        callbacks.forEach((i) => {
            i[1](i[0], args);
        });
    },

    // On event.
    /*  @docs:
        @nav: Frontend
        @chapter: Events
        @title: On event
        @desc: Set a callback for an event.
        @param: 
            @name: id
            @description The id of the registered event to emit.
        @param: 
            @name: element
            @description The element.
        @param: 
            @name: callback
            @description The callback function, accepts parameters `(element, args)`.
    */
    on<T extends object>(id: string, element: T, callback: (element: T, args: Record<string, any>) => void): void {
        let callbacks = this.events.get(id);
        if (callbacks == null) {
            callbacks = [];
            this.events.set(id, callbacks);
        }
        callbacks.push([element, callback]);
    },

    // Remove a callback for an event.
    /*  @docs:
        @nav: Frontend
        @chapter: Events
        @title: Remove callback
        @desc: Remove a callback for an event.
        @param: 
            @name: id
            @description The id of the registered event to emit.
        @param: 
            @name: element
            @description The element.
        @param: 
            @name: callback
            @description The callback function to remove. When left undefined, all callbacks matching to that element will be removed.
    */
    remove<T extends object>(id: string, element: T, callback?: (element: T, args: Record<string, any>) => void): void {
        const callbacks = this.events.get(id);
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
        this.events.set(id, filtered);
    }
};

// Export.
export { Events };
