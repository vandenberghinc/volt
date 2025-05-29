import { VElement } from "../ui/element";
declare const Elements: {
    get(id: string): HTMLElement | VElement;
    get_by_id(id: string): HTMLElement | VElement;
    click(id: string): void;
    register_type(type: any, tag?: string): void;
    register<T extends {
        new (...args: any[]): {};
    }>(constructor: T): void;
    wrapper<T extends {
        new (...args: any[]): {};
    }>(constructor: T): (...args: any[]) => any;
    submit(...elements: (string | VElement | HTMLElement)[]): Record<string, any>;
    forward_func_to_child(func_name: string, child: any): (val?: any) => any;
    _velement_classes: Record<string, any>;
    extend_velement(props?: Record<string, any>): void;
};
export { Elements };
