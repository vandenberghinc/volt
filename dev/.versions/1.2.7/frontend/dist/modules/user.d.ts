declare const User: {
    uid(): string | null;
    username(): string | null;
    email(): string | null;
    first_name(): string | null;
    last_name(): string | null;
    is_authenticated(): boolean;
    is_activated(): boolean;
    get(detailed?: boolean): Promise<any>;
    set(user: Record<string, any>): Promise<any>;
    activate(code?: string): Promise<any>;
    change_password({ current_password, password, verify_password, }: {
        current_password: string;
        password: string;
        verify_password: string;
    }): Promise<any>;
    delete_account(): Promise<any>;
    generate_api_key(): Promise<any>;
    revoke_api_key(): Promise<any>;
    load(path: string, def?: string): Promise<any>;
    save(path?: string, data?: Record<string, any>): Promise<any>;
    load_protected(path: string, def?: string): Promise<any>;
};
export { User };
