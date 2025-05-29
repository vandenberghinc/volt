declare const Google: {
    id: string;
    enable_tracking(): void;
    disable_tracking(): void;
    _initialize(): void;
    cloud: {
        api_key: string;
    };
};
export { Google };
export { Google as google };
