export declare namespace User {
    interface UserObject {
        uid: string;
        first_name: string;
        last_name: string;
        username: string;
        email: string;
        password: string;
        phone_number: string;
        created: number;
        api_key: string;
        support_pin: number;
        is_activated: boolean;
    }
    interface Response {
        error?: string;
        invalid_fields?: Record<string, string>;
        message?: string;
    }
    interface MessageResponse {
        message?: string;
    }
    interface GenerateAPIKeyResponse {
        error?: string;
        invalid_fields?: Record<string, string>;
        message?: string;
        api_key?: string;
    }
    function uid(): string | undefined;
    function username(): string | undefined;
    function email(): string | undefined;
    function first_name(): string | undefined;
    function last_name(): string | undefined;
    function is_authenticated(): boolean;
    function is_activated(): boolean;
    function get(): Promise<UserObject>;
    function set(user: {
        first_name?: string;
        last_name?: string;
        phone_number?: string;
        password?: string;
        username?: string;
        email?: string;
        is_activated?: boolean;
    }): Promise<any>;
    function activate(code?: string): Promise<Response>;
    function change_password({ current_password, password, verify_password, }: {
        current_password: string;
        password: string;
        verify_password: string;
    }): Promise<Response>;
    function delete_account(): Promise<Response>;
    function generate_api_key(): Promise<GenerateAPIKeyResponse>;
    function revoke_api_key(): Promise<Response>;
    function load(path: string, def?: string): Promise<any>;
    function save(path?: string, data?: Record<string, any>): Promise<any>;
    function load_protected(path: string, def?: string): Promise<any>;
}
export { User as user };
