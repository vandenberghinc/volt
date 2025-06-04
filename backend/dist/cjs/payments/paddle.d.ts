export interface ProductObject {
    id: string;
    name: string;
    price: number;
    currency: string;
    tax_category: string;
    icon?: string;
    frequency?: number;
    interval?: 'day' | 'week' | 'month' | 'year';
    trial?: {
        frequency: number;
        interval: 'day' | 'week' | 'month' | 'year';
    } | null;
    plans?: ProductObject[];
    description: string;
    paddle_prod_id?: string;
    price_id?: string;
    is_subscription?: boolean;
    subscription_id?: string;
}
export interface PaymentBillingDetails {
    name?: string;
    email?: string;
    business?: string;
    vat_id?: string;
    address?: string;
    city?: string;
    postal_code?: string;
    province?: string;
    country?: string;
    tax_identifier?: string;
}
export interface LineItem {
    product: string;
    item_id: string;
    paddle_prod_id: string;
    quantity: number;
    tax_rate: number;
    tax: number;
    discount: number;
    subtotal: number;
    total: number;
    status: 'paid' | 'refunded' | 'refunding';
}
export interface ExpandedLineItem extends Omit<LineItem, 'product'> {
    product: ProductObject;
}
export type PaymentStatus = 'open' | 'paid' | 'past_due' | 'unknown';
export interface Payment {
    id: string;
    uid: string;
    cus_id: string;
    tran_id: string;
    timestamp: number;
    status: PaymentStatus;
    line_items: LineItem[];
    billing_details: PaymentBillingDetails;
    sub_id?: string;
}
export interface ExpandedPayment extends Omit<Payment, 'line_items'> {
    line_items: ExpandedLineItem[];
}
export type SubscriptionStatus = 'active' | 'cancelling' | 'cancelled';
export interface Subscription {
    uid: string;
    id: string;
    cus_id: string;
    status: SubscriptionStatus;
    plans: string[];
}
export interface PaddleConstructorOptions {
    api_key: string;
    client_key: string;
    sandbox?: boolean;
    products?: ProductObject[];
    inclusive_tax?: boolean;
    _server?: any;
}
export declare class Paddle {
    type: string;
    private client_key;
    private sandbox;
    private inclusive_tax;
    private products;
    private server;
    private _host;
    private _headers;
    private webhook_key?;
    private _has_create_products_permission?;
    private _settings_db;
    private _sub_db;
    private _active_sub_db;
    private _pay_db;
    private performance;
    constructor({ api_key, client_key, sandbox, products, inclusive_tax, _server, }: PaddleConstructorOptions);
    private _req;
    private _add_subscription;
    private _delete_subscription;
    private _check_subscription;
    private _get_active_subscriptions;
    private _save_subscription;
    private _load_subscription;
    private _get_subscriptions;
    private _save_payment;
    private _load_payment;
    private _load_payment_by_transaction;
    private _delete_payment;
    _delete_user(uid: string): Promise<void>;
    _get_all_active_subscriptions(): Promise<any[]>;
    private _get_product_by_paddle_prod_id;
    private _get_products;
    private _get_prices;
    private _check_product;
    private _cancel_subscription;
    private _initialize_products;
    _initialize(): Promise<void>;
    private _exec_user_callback;
    private _payment_webhook;
    private _subscription_webhook;
    private _subscription_cancelled_webhook;
    private _adjustment_webhook;
    private _create_webhook;
    get_product(id: string): Promise<ProductObject | null>;
    get_product(id: string, throw_err: true): Promise<ProductObject>;
    get_product(id: string, throw_err: boolean): Promise<ProductObject | null>;
    get_product_sync(id: string): ProductObject | null;
    get_product_sync(id: string, throw_err: true): ProductObject;
    get_product_sync(id: string, throw_err: boolean): ProductObject | null;
    get_payment(id: string): Promise<Payment>;
    get_payments({ uid, days, limit, status, }: {
        uid: string;
        days?: number;
        limit?: number;
        status?: string | string[];
    }): Promise<Payment[]>;
    get_refundable_payments({ uid, days, limit, }: {
        uid: string;
        days?: number;
        limit?: number;
    }): Promise<Payment[]>;
    get_refunded_payments({ uid, days, limit, }: {
        uid: string;
        days?: number;
        limit?: number;
    }): Promise<Payment[]>;
    get_refunding_payments({ uid, days, limit, }: {
        uid: string;
        days?: number;
        limit?: number;
    }): Promise<Payment[]>;
    create_refund(payment: Payment | string, line_items?: LineItem[] | undefined, reason?: string): Promise<void>;
    cancel_subscription(uid: string, products: string | (string | ProductObject)[], _throw_no_cancelled_err?: boolean): Promise<void>;
    cancel_subscription_by_id(subscription: string | Subscription, immediate?: boolean): Promise<void>;
    get_active_subscriptions(uid: string): Promise<string[]>;
    get_subscriptions(uid: string): Promise<Subscription[]>;
    is_subscribed(uid: string, product: string): Promise<boolean>;
    generate_invoice(payment: Payment | ExpandedPayment): Promise<Buffer>;
    dev_cancel_all_subscriptions(): Promise<void>;
}
export default Paddle;
