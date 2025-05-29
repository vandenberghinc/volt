export = CheckoutAPI;
declare class CheckoutAPI {
    constructor({ secret_key, public_key, success_url, failure_url, products, _server, }: {
        secret_key: any;
        public_key: any;
        success_url?: null | undefined;
        failure_url?: null | undefined;
        products?: never[] | undefined;
        _server: any;
    });
    client: any;
    success_url: string;
    failure_url: string;
    products: any[];
    server: any;
    _handle_error(error: any): Error;
    _sys_has_cid(uid: any): any;
    _sys_load_cid(uid: any): any;
    _sys_load_uid_by_cid(cid: any): any;
    _sys_save_cid(uid: any, cid: any): void;
    _sys_delete_cid(uid: any, cid: any): void;
    _sys_load_refund(payment_id: any, def?: null): any;
    _sys_save_refund(payment_id: any, info: any): any;
    _extend_refund(refund: any): void;
    _sys_add_subscription(uid: any, prod_id: any, payment_id: any): void;
    _sys_remove_subscription(uid: any, prod_id: any): null | undefined;
    _sys_check_subscription(uid: any, prod_id: any, load_sub_id?: boolean): any;
    _sys_get_subscriptions(uid: any): any[];
    _initialize_products(): void;
    _register_webhook(): Promise<void>;
    webhook_key: any;
    _initialize(): Promise<void>;
    get_product(id: any, throw_err?: boolean): Promise<any>;
    get_products(): Promise<any[]>;
    get_cid(uid: any): Promise<any>;
    create_customer(email: any, first_name: any, last_name: any): Promise<any>;
    delete_customer(uid: any): Promise<void>;
    update_customer(uid: any, user: any): Promise<void>;
    get_customer(uid: any): Promise<any>;
    get_customer_by_email(email: any): Promise<any>;
    get_payments({ uid, days, status, limit, }: {
        uid: any;
        days?: number | undefined;
        status?: null | undefined;
        limit?: null | undefined;
    }): Promise<any[]>;
    create_payment({ uid, token, cart, ip, }: {
        uid: any;
        token?: null | undefined;
        cart?: never[] | undefined;
        ip?: null | undefined;
    }): Promise<void>;
    get_subscriptions(uid: any): Promise<any[]>;
    is_subscribed(uid: any, id: any): Promise<any>;
    get_subscription(uid: any, id: any): Promise<any>;
    cancel_subscription(uid: any, id: any, sub_id?: null): Promise<void>;
    get_refundable_payments({ uid, days, limit }: {
        uid: any;
        days?: number | undefined;
        limit?: null | undefined;
    }): Promise<any[]>;
    get_refunded_payments({ uid, days, limit }: {
        uid: any;
        days?: number | undefined;
        limit?: null | undefined;
    }): Promise<any[]>;
    create_refund(refund: any): Promise<void>;
}
