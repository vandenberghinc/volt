export = Payments;
declare class Payments {
    constructor({ api_key, client_key, webhook_key, account_id, return_url, products, blocked_payment_methods, _server, }: {
        api_key: any;
        client_key: any;
        webhook_key: any;
        account_id: any;
        return_url?: null | undefined;
        products?: never[] | undefined;
        blocked_payment_methods?: never[] | undefined;
        _server?: null | undefined;
    }, ...args: any[]);
    client_key: any;
    webhook_keys: any;
    account_id: any;
    return_url: string | null;
    products: any[];
    blocked_payment_methods: any[];
    server: any;
    client: Client;
    checkout: CheckoutAPI;
    _handle_error(error: any): Error;
    _create_customer_id(uid: any): any;
    _sys_add_subscription(uid: any, prod_id: any, pay_id: any, sub_id: any): void;
    _sys_delete_subscription(uid: any, prod_id: any): null | undefined;
    _sys_check_subscription(uid: any, prod_id: any, load_data?: boolean): any;
    _sys_get_subscriptions(uid: any): any[];
    _sys_save_payment(payment: any): void;
    _sys_load_payment(id: any): any;
    _sys_update_payment(uid: any, id: any, data: any): void;
    _sys_delete_payment(uid: any, id: any): void;
    _sys_delete_user(user: any): void;
    _refund_payment(payment: any, line_items?: null): Promise<import("@adyen/api-library/lib/src/typings/checkout/paymentRefundResponse.js").PaymentRefundResponse>;
    _exec_user_callback(callback: any, args: any): Promise<void>;
    _send_payment_mail({ payment, subject, attachments, mail }: {
        payment: any;
        subject: any;
        attachments?: never[] | undefined;
        mail: any;
    }): Promise<void>;
    _payment_webhook(data: any): Promise<void>;
    _cancellation_webhook(data: any): Promise<void>;
    _refund_webhook(data: any): Promise<void>;
    _failed_refund_webhook(data: any): Promise<void>;
    _create_webhook_endpoint(data: any): {
        method: string;
        endpoint: string;
        content_type: string;
        rate_limit: number;
        rate_limit_duration: number;
        callback: (request: any, response: any) => Promise<any>;
    };
    _initialize_products(): void;
    _initialize(): Promise<void>;
    get_product(id: any, throw_err?: boolean): Promise<any>;
    get_product_sync(id: any, throw_err?: boolean): any;
    get_payment(id: any): Promise<any>;
    get_payment_sync(id: any): any;
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
    create_payment({ uid, cart, billing_details, ip, }: {
        uid?: null | undefined;
        cart?: never[] | undefined;
        billing_details?: {} | undefined;
        ip?: string | undefined;
    }): Promise<import("@adyen/api-library/lib/src/typings/checkout/createCheckoutSessionResponse.js").CreateCheckoutSessionResponse>;
    create_refund(payment: any, line_items?: null): Promise<import("@adyen/api-library/lib/src/typings/checkout/paymentRefundResponse.js").PaymentRefundResponse>;
    cancel_subscription(payment: any): Promise<void>;
    get_invoice(payment: any): Promise<any>;
    get_invoice_sync(payment: any): any;
    generate_invoice({ payment, icon, path }: {
        payment: any;
        icon?: null | undefined;
        path?: null | undefined;
    }): Promise<null>;
    generate_invoice_sync({ payment, icon, path }: {
        payment: any;
        icon?: null | undefined;
        path?: null | undefined;
    }): null;
}
import { Client } from "@adyen/api-library";
import { CheckoutAPI } from "@adyen/api-library/lib/src/services/index.js";
