import { AnyElement } from "../ui/any_element";
declare const Utils: {
    is_apple: boolean;
    is_safari: boolean;
    is_string(value: any): value is string;
    is_numeric(value: any): value is number;
    is_int(value: any): value is number;
    is_float(value: any): value is number;
    is_func(value: any): value is Function;
    is_array(value: any): value is Array<any>;
    is_obj(value: any): value is object;
    is_even(number: number): boolean;
    is_mobile(): boolean;
    make_immutable(object: any): any;
    is_child(parent: any, target: any): boolean;
    is_nested_child(parent: any, target: any, stop_node?: any): boolean;
    round(value: number, decimals: number): number;
    device_width(): number;
    device_height(): number;
    endpoint(url?: string | null): string;
    redirect(url: string, forced?: boolean): void;
    delay(mseconds: number, func: () => void): void;
    url_param(name: string, def?: any): any | null;
    url_encode(params: Record<string, any>): string;
    copy_to_clipboard(text: string): Promise<void>;
    hex_brightness(color: string): number;
    hex_to_rgb(hex: string): {
        r: number;
        g: number;
        b: number;
        a: number;
    };
    deep_copy(obj: any): any;
    /** New request method. */
    request<Data = any>(options: {
        method?: string;
        url?: string | null;
        data?: any;
        json?: boolean;
        credentials?: RequestCredentials;
        headers?: Record<string, string>;
    }): Promise<{
        error?: {
            message: string;
            type?: string;
            invalid_fields?: {
                [name: string]: string;
            };
        };
        status: number;
        data?: Data;
    }>;
    request_v1(options: {
        method?: string;
        url?: string | null;
        data?: any;
        json?: boolean;
        credentials?: "include" | "same-origin" | "omit";
        headers?: Record<string, string>;
    }): Promise<any>;
    on_load(func: () => HTMLElement | AnyElement | Promise<HTMLElement | AnyElement> | null | undefined): Promise<void>;
    /**
     * @deprecated Use vlib.VDate instead.
     * @docs:
     
        @nav: Frontend
        @chapter: Utils
        @title: Unix to Date
        @desc: Convert a Unix timestamp in seconds or milliseconds to the user's date format.
        @param:
            @name: unix
            @desc: The Unix timestamp.
            @type: number
            @name: mseconds
            @desc: Optional. Whether the Unix timestamp is in milliseconds.
            @type: boolean | null
        @return:
            @desc: The formatted date string.
            @type: string
    */
    unix_to_date(unix: number, mseconds?: boolean | null): string;
    debounce(delay: number, func: (...args: any[]) => void): (...args: any[]) => void;
    on_render_observer: ResizeObserver;
    on_resize_observer: ResizeObserver;
};
export { Utils };
export { Utils as utils };
