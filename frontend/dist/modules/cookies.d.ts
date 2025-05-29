declare const Cookies: {
    _cookies: {
        [key: string]: string;
    };
    _last_cookies: string;
    _disabled: boolean;
    is_parse_required(): boolean;
    get(name?: string | null): string | {
        [key: string]: string;
    } | undefined;
    has_preference(): boolean;
    is_accepted(): boolean;
    enable(_set_storage?: boolean): void;
    disable(_set_storage?: boolean): void;
    _init(): void;
};
export { Cookies };
export { Cookies as cookies };
