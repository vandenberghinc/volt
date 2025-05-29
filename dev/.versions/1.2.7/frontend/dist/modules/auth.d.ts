declare const Auth: {
    sign_in({ email, username, password, code, }: {
        username: string;
        email: string;
        password: string;
        code?: string;
    }): Promise<object>;
    sign_up({ username, email, first_name, last_name, password, verify_password, phone_number, code, }: {
        username: string;
        email: string;
        first_name: string;
        last_name: string;
        password: string;
        verify_password: string;
        phone_number?: string;
        code?: string;
    }): Promise<object>;
    sign_out(): Promise<object>;
    send_2fa(email: string): Promise<object>;
    forgot_password({ email, code, password, verify_password, }: {
        email: string;
        password: string;
        verify_password: string;
        code: string;
    }): Promise<object>;
};
export { Auth };
