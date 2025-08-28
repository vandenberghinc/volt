export declare namespace Events {
    const events: Map<string, [any, (element: any, args: any) => void][]>;
    /**
     * Emit a registered event.
     * @param id The id of the registered event to emit.
     * @param args The arguments that will be passed to the registered callbacks.
     * @docs
     */
    function emit(id: string, args?: Record<string, any>): void;
    /**
     * Set a callback for an event.
     * @param id The id of the registered event to emit.
     * @param element The element.
     * @param callback The callback function, accepts parameters `(element, args)`.
     * @docs
     */
    function on<T extends object>(id: string, element: T, callback: (element: T, args: Record<string, any>) => void): void;
    /**
     * Remove a callback for an event.
     * @param id The id of the registered event to emit.
     * @param element The element.
     * @param callback The callback function to remove. When left undefined, all callbacks matching to that element will be removed.
     * @docs
     */
    function remove<T extends object>(id: string, element: T, callback?: (element: T, args: Record<string, any>) => void): void;
}
export { Events as events };
