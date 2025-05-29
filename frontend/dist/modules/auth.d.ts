export declare namespace Auth {
    interface Response {
        error?: string;
        invalid_fields?: Record<string, string>;
        message?: string;
    }
    interface MessageResponse {
        message?: string;
    }
    export interface SignInResponse extends Response {
    }
    export interface SignUpResponse extends Response {
    }
    export interface SignOutResponse extends MessageResponse {
    }
    export interface Send2FAResponse extends MessageResponse {
    }
    export interface ForgotPasswordResponse extends Response {
    }
    export function sign_in({ email, username, password, code, }: {
        username: string;
        email: string;
        password: string;
        code?: string;
    }): Promise<Auth.SignInResponse>;
    export function sign_up({ username, email, first_name, last_name, password, verify_password, phone_number, code, }: {
        username: string;
        email: string;
        first_name: string;
        last_name: string;
        password: string;
        verify_password: string;
        phone_number?: string;
        code?: string;
    }): Promise<Auth.SignUpResponse>;
    export function sign_out(): Promise<Auth.SignOutResponse>;
    export function send_2fa(email: string): Promise<Auth.Send2FAResponse>;
    export function forgot_password({ email, code, password, verify_password, }: {
        email: string;
        password: string;
        verify_password: string;
        code: string;
    }): Promise<Auth.ForgotPasswordResponse>;
    export {};
}
export { Auth as auth };
