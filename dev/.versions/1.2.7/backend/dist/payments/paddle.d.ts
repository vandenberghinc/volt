export = Paddle;
declare class Paddle {
    constructor({ api_key, client_key, sandbox, products, inclusive_tax, _server, }: {
        api_key: any;
        client_key: any;
        sandbox?: boolean | undefined;
        products?: never[] | undefined;
        inclusive_tax?: boolean | undefined;
        _server?: null | undefined;
    }, ...args: any[]);
    type: string;
    client_key: any;
    sandbox: boolean;
    inclusive_tax: boolean;
    products: any[];
    server: any;
    _host: string;
    _headers: {
        "Content-Type": string;
        Accept: string;
        Authorization: string;
    };
    performance: any;
    _req(method: any, endpoint: any, params?: null): Promise<any>;
    _add_subscription(uid: any, prod_id: any, sub_id: any): Promise<void>;
    _delete_subscription(uid: any, prod_id: any): Promise<void>;
    _check_subscription(uid: any, prod_id: any, load_data?: boolean): Promise<boolean | {
        exists: boolean;
        sub_id: any;
    }>;
    _get_active_subscriptions(uid: any, detailed?: boolean): Promise<any>;
    _save_subscription(subscription: any): Promise<void>;
    _load_subscription(id: any): Promise<any>;
    _get_subscriptions(uid: any): Promise<any>;
    _save_payment(payment: any): Promise<void>;
    _load_payment(id: any): Promise<any>;
    _load_payment_by_transaction(id: any): Promise<any>;
    _delete_payment(id: any): Promise<void>;
    _delete_user(uid: any): Promise<void>;
    _get_all_active_subscriptions(): Promise<any>;
    _get_product_by_paddle_prod_id(id: any, throw_err?: boolean): any;
    _get_products(): Promise<any[]>;
    _get_prices(): Promise<any[]>;
    _check_product(product: any, existing_products?: any[], existing_prices?: any[]): Promise<void>;
    _has_create_products_permission: boolean | undefined;
    _cancel_subscription(id: any, immediate?: boolean): Promise<void>;
    _initialize_products(): Promise<void>;
    _initialize(): Promise<void>;
    _settings_db: any;
    _sub_db: any;
    _active_sub_db: any;
    _pay_db: any;
    _inv_db: any;
    _exec_user_callback(callback: any, args: any): Promise<void>;
    _payment_webhook(data: any): Promise<void>;
    _subscription_webhook(data: any): Promise<void>;
    _subscription_cancelled_webhook(data: any): Promise<void>;
    _adjustment_webhook(data: any): Promise<void>;
    _create_webhook(): Promise<{
        method: string;
        endpoint: string;
        rate_limit: boolean;
        callback: (stream: any) => Promise<any>;
    }>;
    webhook_key: any;
    get_product(id: any, throw_err?: boolean): Promise<any>;
    get_product_sync(id: any, throw_err?: boolean): any;
    get_payment(id: any): Promise<any>;
    get_payments({ uid, days, limit, status, }: {
        uid: any;
        days?: number | undefined;
        limit?: null | undefined;
        status?: null | undefined;
    }): Promise<any[]>;
    get_refundable_payments({ uid, days, limit, }: {
        uid: any;
        days?: number | undefined;
        limit?: null | undefined;
    }): Promise<any[]>;
    get_refunded_payments({ uid, days, limit, }: {
        uid: any;
        days?: number | undefined;
        limit?: null | undefined;
    }): Promise<any[]>;
    get_refunding_payments({ uid, days, limit, }: {
        uid: any;
        days?: null | undefined;
        limit?: null | undefined;
    }): Promise<any[]>;
    create_refund(payment: any, line_items?: null, reason?: string): Promise<void>;
    cancel_subscription(uid: any, products: any, _throw_no_cancelled_err?: boolean): Promise<void>;
    cancel_subscription_by_id(subscription: any, immediate?: boolean): Promise<void>;
    get_active_subscriptions(uid: any): Promise<any>;
    get_subscriptions(uid: any): Promise<any>;
    is_subscribed(uid: any, product: any): Promise<boolean | {
        exists: boolean;
        sub_id: any;
    }>;
    generate_invoice(payment: any): Promise<any>;
    dev_cancel_all_subscriptions(): Promise<void>;
}
