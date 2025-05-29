declare const Support: {
    submit(data?: {
        subject?: string;
        type?: string;
        support_pin?: string;
        email?: string;
        first_name?: string;
        last_name?: string;
        recipient?: string;
        summary?: string;
        detailed?: string;
        attachments?: {
            [fileName: string]: any;
        };
    }): Promise<any>;
    get_pin(): Promise<any>;
};
export { Support };
export { Support as support };
