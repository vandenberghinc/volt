import * as vlib from "@vandenberghinc/vlib";
import { Server } from "../server.js";
/**
 * The product object.
 * @warning This object is publicly accessible by the frontend.
 */
export type Product = Product.OneTime | Product.Subscription;
export declare namespace Product {
    /** The interface for a one-time product. */
    interface OneTime {
        /**
         * The id of product
         * @warning The id can not be changed
         * @warning The id must be unique across all your products.
         */
        id: string;
        /** The name of the product. */
        name: string;
        /** The price of the product, digits after the decimal are the minor units (e.g. cents). */
        price: number;
        /** The ISO currency code of the price. */
        currency: string;
        /** The tax category https://developer.paddle.com/api-reference/products/create-product. */
        tax_category: string;
        /** The icon url of the product, may also be an endpoint url of your website. */
        icon?: string;
        /** The products description. */
        description: string;
        /** Is this product a subscription product. */
        is_subscription?: false;
        /** System attribute. */
        price_id?: string;
        /** System attribute. */
        paddle_prod_id?: string;
    }
    /** The interface for a subscription product. */
    interface Subscription extends Omit<OneTime, "is_subscription"> {
        /** The recurring frequency, when this is defined a product will become a subscription product. */
        frequency: number;
        /** The recurring interval, when this is defined a product will become a subscription product. */
        interval: 'day' | 'week' | 'month' | 'year';
        /** The plans for this subscription product. Every item is a product object. However, attributes `currency`, `frequency`, `interval`, `tax_category` and `icon` can either be defined in the subscription product or on each individual plan. */
        plans: Product.Subscription[];
        /** The trial settings for this product. Leave undefined to disable a trialing period. This attribute will be ignored for one-time payments. */
        trial?: {
            /** The trial frequency. */
            frequency: number;
            /** The trial interval. */
            interval: 'day' | 'week' | 'month' | 'year';
        } | null;
        /** Is this product a subscription product. */
        is_subscription: true;
        /** System attribute. */
        subscription_id?: string;
    }
}
/**
 * The payment billing details.
 * @warning This object should not be exposed to the public unless authenticated.
 */
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
/** A payment line item. */
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
    status: "paid" | "refunded" | "refunding";
}
/** Nested types for the {@link LineItem} interface. */
export declare namespace LineItem {
    /** Validation schema. */
    const Schema: vlib.Schema.Entries.Opts;
}
/** An expanded payment line item. */
export interface ExpandedLineItem extends Omit<LineItem, 'product'> {
    product: Product;
}
/** The possible values for {@link Payment.status} */
export type PaymentStatus = 'open' | 'paid' | 'past_due' | 'unknown';
export declare const PaymentStatusValues: PaymentStatus[];
/** The interface for a saved payment. */
export interface Payment {
    id: string;
    uid: string;
    /** The paddle customer id. */
    cus_id: string;
    tran_id: string;
    timestamp: number;
    status: PaymentStatus;
    line_items: LineItem[];
    billing_details: PaymentBillingDetails;
    sub_id?: string;
}
/** The interface for retrieving payments. */
export interface GetPaymentsOpts<Public extends boolean = false> {
    /** The user id. */
    uid: string;
    /** Since days. */
    days?: number;
    /** Limit */
    limit?: number;
    /** Filter by status. */
    status?: PaymentStatus | PaymentStatus[];
    /** Anonymizes the billing details if the payment uid is undefined. */
    for_public?: Public;
}
/** Nested types for the {@link Payment} interface. */
export declare namespace Payment {
    /**
     * Semi-public payment object
     * where billing_details are omitted if the uid is undefined.
     */
    type Public = vlib.Types.Optional<Payment, "billing_details">;
    /** Get as public or full by generic. */
    type PublicBy<IsPublic extends boolean> = IsPublic extends true ? Public : Payment;
    /**
     * Check if a payment should be anonymized,
     * if so return a public version of the payment.
     */
    function anonymize(payment: Payment): Public;
}
/** The expanded payment interface. */
export interface ExpandedPayment extends Omit<Payment, 'line_items'> {
    line_items: ExpandedLineItem[];
}
/** The possible values for {@link Subscriptino.status} */
export type SubscriptionStatus = 'active' | 'cancelling' | 'cancelled';
/** The interface for a subscription. */
export interface Subscription {
    uid: string;
    id: string;
    cus_id: string;
    status: SubscriptionStatus;
    plans: string[];
}
/** The interface for an active subscription. */
export interface ActiveSubscription {
    uid: string;
    prod_id: string;
    sub_id: string;
}
/**
 * The paddle payments class.
 *
 * Sandbox env: https://sandbox-vendors.paddle.com
 *
 * @nav Backend/Payments
 * @docs
 * @deprecated Using stripe from now on.
 */
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
    private _last_products_db;
    private _webhook_conf_db;
    private _sub_db;
    private _active_sub_db;
    private _pay_db;
    private performance;
    constructor({ api_key, client_key, sandbox, products, inclusive_tax, _server, }: Paddle.Opts & {
        _server: Server;
    });
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
    private _load_payment_for_public;
    private _load_payment_by_transaction;
    private _load_payment_by_transaction_for_public;
    private _delete_payment;
    _delete_user(uid: string): Promise<void>;
    _get_all_active_subscriptions(): Promise<ActiveSubscription[]>;
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
    get_product(id: string): Promise<Product | null>;
    get_product(id: string, throw_err: true): Promise<Product>;
    get_product(id: string, throw_err: boolean): Promise<Product | null>;
    get_product_sync(id: string): Product | null;
    get_product_sync(id: string, throw_err: true): Product;
    get_product_sync(id: string, throw_err: boolean): Product | null;
    get_payment(id: string, opts?: {
        for_public?: boolean;
    }): Promise<vlib.Types.Optional<Payment, "billing_details">>;
    get_payments<Public extends boolean = false>({ uid, days, limit, status, for_public, }: GetPaymentsOpts<Public>): Promise<Payment.PublicBy<Public>[]>;
    get_refundable_payments<Public extends boolean = false>({ uid, days, limit, for_public, }: Omit<GetPaymentsOpts<Public>, "status">): Promise<Payment.PublicBy<Public>[]>;
    get_refunded_payments<Public extends boolean = false>({ uid, days, limit, for_public, }: Omit<GetPaymentsOpts<Public>, "status">): Promise<Payment.PublicBy<Public>[]>;
    get_refunding_payments<Public extends boolean = false>({ uid, days, limit, for_public, }: Omit<GetPaymentsOpts<Public>, "status">): Promise<Payment.PublicBy<Public>[]>;
    create_refund(payment: Payment | string, line_items?: LineItem[] | undefined, reason?: string): Promise<void>;
    cancel_subscription(uid: string, products: string | (string | Product)[], _throw_no_cancelled_err?: boolean): Promise<void>;
    cancel_subscription_by_id(subscription: string | Subscription, immediate?: boolean): Promise<void>;
    get_active_subscriptions(uid: string): Promise<string[]>;
    get_subscriptions(uid: string): Promise<Subscription[]>;
    is_subscribed(uid: string, product: string): Promise<boolean>;
    generate_invoice(payment: Payment | ExpandedPayment): Promise<Buffer>;
    dev_cancel_all_subscriptions(): Promise<void>;
}
/** Nested types for the {@link Paddle} class */
export declare namespace Paddle {
    /** Constructor options. */
    interface Opts {
        /** The paddle API key. */
        api_key: string;
        /** The paddle client key. */
        client_key: string;
        /** Whether to use the sandbox environment. */
        sandbox?: boolean;
        /** The list of products to be created. */
        products?: Product[];
        /** Whether to include tax in the prices. */
        inclusive_tax?: boolean;
    }
    /** Paddle api request error. */
    class RequestError extends Error {
        status_code?: number;
        constructor(err: string, status_code?: number);
    }
    /** The types for the frontend endpoints. */
    namespace Endpoints {
        /** The initialize payment endpoint. */
        namespace InitPayment {
            /** The request params. */
            interface Params {
                items: {
                    product: Product;
                    quantity: number;
                }[];
            }
            /** The result interface for a **successful** request. */
            type Result = vlib.Types.Optional<Payment, "billing_details">;
        }
        /** The get products endpoint. */
        namespace GetProducts {
            /** The request params. */
            interface Params {
            }
            /** The result interface for a **successful** request. */
            type Result = Product[];
        }
        /** The get payment endpoint. */
        namespace GetPayment {
            /** The request params. */
            interface Params {
                id: string;
            }
            /** The result interface for a **successful** request. */
            type Result = Payment.Public;
        }
        /** The get payments endpoint. */
        namespace GetPayments {
            /** The request params. */
            interface Params {
                days?: number;
                limit?: number;
                status?: string | string[];
            }
            /** The result interface for a **successful** request. */
            type Result = Payment.Public[];
        }
        /** The get refundable payments endpoint. */
        namespace GetRefundablePayments {
            /** The request params. */
            interface Params {
                days?: number;
                limit?: number;
            }
            /** The result interface for a **successful** request. */
            type Result = Payment.Public[];
        }
        /** The get refunded payments endpoint. */
        namespace GetRefundedPayments {
            /** The request params. */
            interface Params {
                days?: number;
                limit?: number;
            }
            /** The result interface for a **successful** request. */
            type Result = Payment.Public[];
        }
        /** The get refunding payments endpoint. */
        namespace GetRefundingPayments {
            /** The request params. */
            interface Params {
                days?: number;
                limit?: number;
            }
            /** The result interface for a **successful** request. */
            type Result = Payment.Public[];
        }
        /** The refund payment endpoint. */
        namespace RefundPayment {
            /** The request params. */
            interface Params {
                payment: string | Payment;
                line_items?: LineItem[];
                reason?: string;
            }
            /** The result interface for a **successful** request. */
            type Result = undefined;
        }
        /** The cancel subscription endpoint. */
        namespace CancelSubscription {
            /** The request params. */
            interface Params {
                product: string;
            }
            /** The result interface for a **successful** request. */
            type Result = undefined;
        }
        /** The is subscribed endpoint. */
        namespace IsSubscribed {
            /** The request params. */
            interface Params {
                product: string;
            }
            /** The result interface for a **successful** request. */
            interface Result {
                is_subscribed: boolean;
            }
        }
        /** The get active subscriptions endpoint. */
        namespace GetActiveSubscriptions {
            /** The request params. */
            interface Params {
            }
            /** The result interface for a **successful** request. */
            interface Result {
                subscriptions: string[];
            }
        }
    }
}
/**
 * @todo if undeprecate: ASK claude to audit.
 */ 
