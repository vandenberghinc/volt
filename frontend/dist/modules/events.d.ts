declare const Events: {
    events: Map<string, [any, (element: any, args: any) => void][]>;
    emit(id: string, args?: Record<string, any>): void;
    on<T extends object>(id: string, element: T, callback: (element: T, args: Record<string, any>) => void): void;
    remove<T extends object>(id: string, element: T, callback?: (element: T, args: Record<string, any>) => void): void;
};
export { Events };
export { Events as events };
