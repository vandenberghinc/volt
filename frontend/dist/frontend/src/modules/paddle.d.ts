import type { Paddle as PaddleBackend, Product } from "../../../backend/src/payments/paddle.js";
import { Request } from "./request.js";
/**
 * @deprecated using stripe from now on.
 */
export declare namespace Payments {
    const sandbox: boolean;
    const tax_inclusive: boolean;
    const countries: {
        AD: {
            name: string;
            calling_code: string;
        };
        AE: {
            name: string;
            calling_code: string;
        };
        AF: {
            name: string;
            calling_code: string;
        };
        AG: {
            name: string;
            calling_code: string;
        };
        AI: {
            name: string;
            calling_code: string;
        };
        AL: {
            name: string;
            calling_code: string;
        };
        AM: {
            name: string;
            calling_code: string;
        };
        AO: {
            name: string;
            calling_code: string;
        };
        AQ: {
            name: string;
            calling_code: string;
        };
        AR: {
            name: string;
            calling_code: string;
        };
        AS: {
            name: string;
            calling_code: string;
        };
        AT: {
            name: string;
            calling_code: string;
        };
        AU: {
            name: string;
            calling_code: string;
        };
        AW: {
            name: string;
            calling_code: string;
        };
        AX: {
            name: string;
            calling_code: string;
        };
        AZ: {
            name: string;
            calling_code: string;
        };
        BA: {
            name: string;
            calling_code: string;
        };
        BB: {
            name: string;
            calling_code: string;
        };
        BD: {
            name: string;
            calling_code: string;
        };
        BE: {
            name: string;
            calling_code: string;
        };
        BF: {
            name: string;
            calling_code: string;
        };
        BG: {
            name: string;
            calling_code: string;
        };
        BH: {
            name: string;
            calling_code: string;
        };
        BI: {
            name: string;
            calling_code: string;
        };
        BJ: {
            name: string;
            calling_code: string;
        };
        BL: {
            name: string;
            calling_code: string;
        };
        BM: {
            name: string;
            calling_code: string;
        };
        BN: {
            name: string;
            calling_code: string;
        };
        BO: {
            name: string;
            calling_code: string;
        };
        BQ: {
            name: string;
            calling_code: string;
        };
        BR: {
            name: string;
            calling_code: string;
        };
        BS: {
            name: string;
            calling_code: string;
        };
        BT: {
            name: string;
            calling_code: string;
        };
        BV: {
            name: string;
            calling_code: string;
        };
        BW: {
            name: string;
            calling_code: string;
        };
        BY: {
            name: string;
            calling_code: string;
        };
        BZ: {
            name: string;
            calling_code: string;
        };
        CA: {
            name: string;
            calling_code: string;
        };
        CC: {
            name: string;
            calling_code: string;
        };
        CD: {
            name: string;
            calling_code: string;
        };
        CF: {
            name: string;
            calling_code: string;
        };
        CG: {
            name: string;
            calling_code: string;
        };
        CH: {
            name: string;
            calling_code: string;
        };
        CI: {
            name: string;
            calling_code: string;
        };
        CK: {
            name: string;
            calling_code: string;
        };
        CL: {
            name: string;
            calling_code: string;
        };
        CM: {
            name: string;
            calling_code: string;
        };
        CN: {
            name: string;
            calling_code: string;
        };
        CO: {
            name: string;
            calling_code: string;
        };
        CR: {
            name: string;
            calling_code: string;
        };
        CU: {
            name: string;
            calling_code: string;
        };
        CV: {
            name: string;
            calling_code: string;
        };
        CW: {
            name: string;
            calling_code: string;
        };
        CX: {
            name: string;
            calling_code: string;
        };
        CY: {
            name: string;
            calling_code: string;
        };
        CZ: {
            name: string;
            calling_code: string;
        };
        DE: {
            name: string;
            calling_code: string;
        };
        DJ: {
            name: string;
            calling_code: string;
        };
        DK: {
            name: string;
            calling_code: string;
        };
        DM: {
            name: string;
            calling_code: string;
        };
        DO: {
            name: string;
            calling_code: string;
        };
        DZ: {
            name: string;
            calling_code: string;
        };
        EC: {
            name: string;
            calling_code: string;
        };
        EE: {
            name: string;
            calling_code: string;
        };
        EG: {
            name: string;
            calling_code: string;
        };
        EH: {
            name: string;
            calling_code: string;
        };
        ER: {
            name: string;
            calling_code: string;
        };
        ES: {
            name: string;
            calling_code: string;
        };
        ET: {
            name: string;
            calling_code: string;
        };
        FI: {
            name: string;
            calling_code: string;
        };
        FJ: {
            name: string;
            calling_code: string;
        };
        FK: {
            name: string;
            calling_code: string;
        };
        FM: {
            name: string;
            calling_code: string;
        };
        FO: {
            name: string;
            calling_code: string;
        };
        FR: {
            name: string;
            calling_code: string;
        };
        GA: {
            name: string;
            calling_code: string;
        };
        GB: {
            name: string;
            calling_code: string;
        };
        GD: {
            name: string;
            calling_code: string;
        };
        GE: {
            name: string;
            calling_code: string;
        };
        GF: {
            name: string;
            calling_code: string;
        };
        GG: {
            name: string;
            calling_code: string;
        };
        GH: {
            name: string;
            calling_code: string;
        };
        GI: {
            name: string;
            calling_code: string;
        };
        GL: {
            name: string;
            calling_code: string;
        };
        GM: {
            name: string;
            calling_code: string;
        };
        GN: {
            name: string;
            calling_code: string;
        };
        GP: {
            name: string;
            calling_code: string;
        };
        GQ: {
            name: string;
            calling_code: string;
        };
        GR: {
            name: string;
            calling_code: string;
        };
        GS: {
            name: string;
            calling_code: string;
        };
        GT: {
            name: string;
            calling_code: string;
        };
        GU: {
            name: string;
            calling_code: string;
        };
        GW: {
            name: string;
            calling_code: string;
        };
        GY: {
            name: string;
            calling_code: string;
        };
        HK: {
            name: string;
            calling_code: string;
        };
        HM: {
            name: string;
            calling_code: string;
        };
        HN: {
            name: string;
            calling_code: string;
        };
        HR: {
            name: string;
            calling_code: string;
        };
        HT: {
            name: string;
            calling_code: string;
        };
        HU: {
            name: string;
            calling_code: string;
        };
        ID: {
            name: string;
            calling_code: string;
        };
        IE: {
            name: string;
            calling_code: string;
        };
        IL: {
            name: string;
            calling_code: string;
        };
        IM: {
            name: string;
            calling_code: string;
        };
        IN: {
            name: string;
            calling_code: string;
        };
        IO: {
            name: string;
            calling_code: string;
        };
        IQ: {
            name: string;
            calling_code: string;
        };
        IR: {
            name: string;
            calling_code: string;
        };
        IS: {
            name: string;
            calling_code: string;
        };
        IT: {
            name: string;
            calling_code: string;
        };
        JE: {
            name: string;
            calling_code: string;
        };
        JM: {
            name: string;
            calling_code: string;
        };
        JO: {
            name: string;
            calling_code: string;
        };
        JP: {
            name: string;
            calling_code: string;
        };
        KE: {
            name: string;
            calling_code: string;
        };
        KG: {
            name: string;
            calling_code: string;
        };
        KH: {
            name: string;
            calling_code: string;
        };
        KI: {
            name: string;
            calling_code: string;
        };
        KM: {
            name: string;
            calling_code: string;
        };
        KN: {
            name: string;
            calling_code: string;
        };
        KP: {
            name: string;
            calling_code: string;
        };
        KR: {
            name: string;
            calling_code: string;
        };
        KW: {
            name: string;
            calling_code: string;
        };
        KY: {
            name: string;
            calling_code: string;
        };
        KZ: {
            name: string;
            calling_code: string;
        };
        LA: {
            name: string;
            calling_code: string;
        };
        LB: {
            name: string;
            calling_code: string;
        };
        LC: {
            name: string;
            calling_code: string;
        };
        LI: {
            name: string;
            calling_code: string;
        };
        LK: {
            name: string;
            calling_code: string;
        };
        LR: {
            name: string;
            calling_code: string;
        };
        LS: {
            name: string;
            calling_code: string;
        };
        LT: {
            name: string;
            calling_code: string;
        };
        LU: {
            name: string;
            calling_code: string;
        };
        LV: {
            name: string;
            calling_code: string;
        };
        LY: {
            name: string;
            calling_code: string;
        };
        MA: {
            name: string;
            calling_code: string;
        };
        MC: {
            name: string;
            calling_code: string;
        };
        MD: {
            name: string;
            calling_code: string;
        };
        ME: {
            name: string;
            calling_code: string;
        };
        MF: {
            name: string;
            calling_code: string;
        };
        MG: {
            name: string;
            calling_code: string;
        };
        MH: {
            name: string;
            calling_code: string;
        };
        MK: {
            name: string;
            calling_code: string;
        };
        ML: {
            name: string;
            calling_code: string;
        };
        MM: {
            name: string;
            calling_code: string;
        };
        MN: {
            name: string;
            calling_code: string;
        };
        MO: {
            name: string;
            calling_code: string;
        };
        MP: {
            name: string;
            calling_code: string;
        };
        MQ: {
            name: string;
            calling_code: string;
        };
        MR: {
            name: string;
            calling_code: string;
        };
        MS: {
            name: string;
            calling_code: string;
        };
        MT: {
            name: string;
            calling_code: string;
        };
        MU: {
            name: string;
            calling_code: string;
        };
        MV: {
            name: string;
            calling_code: string;
        };
        MW: {
            name: string;
            calling_code: string;
        };
        MX: {
            name: string;
            calling_code: string;
        };
        MY: {
            name: string;
            calling_code: string;
        };
        MZ: {
            name: string;
            calling_code: string;
        };
        NA: {
            name: string;
            calling_code: string;
        };
        NC: {
            name: string;
            calling_code: string;
        };
        NE: {
            name: string;
            calling_code: string;
        };
        NF: {
            name: string;
            calling_code: string;
        };
        NG: {
            name: string;
            calling_code: string;
        };
        NI: {
            name: string;
            calling_code: string;
        };
        NL: {
            name: string;
            calling_code: string;
        };
        NO: {
            name: string;
            calling_code: string;
        };
        NP: {
            name: string;
            calling_code: string;
        };
        NR: {
            name: string;
            calling_code: string;
        };
        NU: {
            name: string;
            calling_code: string;
        };
        NZ: {
            name: string;
            calling_code: string;
        };
        OM: {
            name: string;
            calling_code: string;
        };
        PA: {
            name: string;
            calling_code: string;
        };
        PE: {
            name: string;
            calling_code: string;
        };
        PF: {
            name: string;
            calling_code: string;
        };
        PG: {
            name: string;
            calling_code: string;
        };
        PH: {
            name: string;
            calling_code: string;
        };
        PK: {
            name: string;
            calling_code: string;
        };
        PL: {
            name: string;
            calling_code: string;
        };
        PM: {
            name: string;
            calling_code: string;
        };
        PN: {
            name: string;
            calling_code: string;
        };
        PR: {
            name: string;
            calling_code: string;
        };
        PS: {
            name: string;
            calling_code: string;
        };
        PT: {
            name: string;
            calling_code: string;
        };
        PW: {
            name: string;
            calling_code: string;
        };
        PY: {
            name: string;
            calling_code: string;
        };
        QA: {
            name: string;
            calling_code: string;
        };
        RE: {
            name: string;
            calling_code: string;
        };
        RO: {
            name: string;
            calling_code: string;
        };
        RS: {
            name: string;
            calling_code: string;
        };
        RU: {
            name: string;
            calling_code: string;
        };
        RW: {
            name: string;
            calling_code: string;
        };
        SA: {
            name: string;
            calling_code: string;
        };
        SB: {
            name: string;
            calling_code: string;
        };
        SC: {
            name: string;
            calling_code: string;
        };
        SD: {
            name: string;
            calling_code: string;
        };
        SE: {
            name: string;
            calling_code: string;
        };
        SG: {
            name: string;
            calling_code: string;
        };
        SH: {
            name: string;
            calling_code: string;
        };
        SI: {
            name: string;
            calling_code: string;
        };
        SJ: {
            name: string;
            calling_code: string;
        };
        SK: {
            name: string;
            calling_code: string;
        };
        SL: {
            name: string;
            calling_code: string;
        };
        SM: {
            name: string;
            calling_code: string;
        };
        SN: {
            name: string;
            calling_code: string;
        };
        SO: {
            name: string;
            calling_code: string;
        };
        SR: {
            name: string;
            calling_code: string;
        };
        SS: {
            name: string;
            calling_code: string;
        };
        ST: {
            name: string;
            calling_code: string;
        };
        SV: {
            name: string;
            calling_code: string;
        };
        SX: {
            name: string;
            calling_code: string;
        };
        SY: {
            name: string;
            calling_code: string;
        };
        SZ: {
            name: string;
            calling_code: string;
        };
        TC: {
            name: string;
            calling_code: string;
        };
        TD: {
            name: string;
            calling_code: string;
        };
        TF: {
            name: string;
            calling_code: string;
        };
        TG: {
            name: string;
            calling_code: string;
        };
        TH: {
            name: string;
            calling_code: string;
        };
        TJ: {
            name: string;
            calling_code: string;
        };
        TK: {
            name: string;
            calling_code: string;
        };
        TL: {
            name: string;
            calling_code: string;
        };
        TM: {
            name: string;
            calling_code: string;
        };
        TN: {
            name: string;
            calling_code: string;
        };
        TO: {
            name: string;
            calling_code: string;
        };
        TR: {
            name: string;
            calling_code: string;
        };
        TT: {
            name: string;
            calling_code: string;
        };
        TV: {
            name: string;
            calling_code: string;
        };
        TW: {
            name: string;
            calling_code: string;
        };
        TZ: {
            name: string;
            calling_code: string;
        };
        UA: {
            name: string;
            calling_code: string;
        };
        UG: {
            name: string;
            calling_code: string;
        };
        UM: {
            name: string;
            calling_code: string;
        };
        US: {
            name: string;
            calling_code: string;
        };
        UY: {
            name: string;
            calling_code: string;
        };
        UZ: {
            name: string;
            calling_code: string;
        };
        VA: {
            name: string;
            calling_code: string;
        };
        VC: {
            name: string;
            calling_code: string;
        };
        VE: {
            name: string;
            calling_code: string;
        };
        VG: {
            name: string;
            calling_code: string;
        };
        VI: {
            name: string;
            calling_code: string;
        };
        VN: {
            name: string;
            calling_code: string;
        };
        VU: {
            name: string;
            calling_code: string;
        };
        WF: {
            name: string;
            calling_code: string;
        };
        WS: {
            name: string;
            calling_code: string;
        };
        YE: {
            name: string;
            calling_code: string;
        };
        YT: {
            name: string;
            calling_code: string;
        };
        ZA: {
            name: string;
            calling_code: string;
        };
        ZM: {
            name: string;
            calling_code: string;
        };
        ZW: {
            name: string;
            calling_code: string;
        };
    };
    let on_error: (data: string | Error) => any;
    function style({ theme, // light or dark
    font_size, border_radius, bg, bg_1, divider_bg, fg, fg_1, fg_2, theme_fg, missing_fg, selected, button, }?: {
        theme?: string | undefined;
        font_size?: number | undefined;
        border_radius?: number | undefined;
        bg?: string | undefined;
        bg_1?: string | undefined;
        divider_bg?: string | undefined;
        fg?: string | undefined;
        fg_1?: string | undefined;
        fg_2?: string | undefined;
        theme_fg?: string | undefined;
        missing_fg?: string | undefined;
        selected?: {
            fg: null | string;
            bg: null | string;
        } | undefined;
        button?: {
            fg: null | string;
            bg: null | string;
            border_color: null | string;
            border_radius: null | number;
            border_width: null | number | string;
            border_inset: boolean;
            hover_brightness: number[];
        } | undefined;
    }): void;
    /**
     * {Get Currency Symbol}
     * Get the currency symbol for a product currency.
     * @nav Frontend/Payments
     * @parameter currency The currency from the product object.
     * @returns Returns the currency symbol when the currency is supported, otherwise `null`
     * @docs
     */
    function get_currency_symbol(currency: string): string | null;
    /**
     * {Payment Products}
     * Get the backend defined payment products asynchronously.
     * @nav Frontend/Payments
     * @returns Returns the backend defined payment products.
     * @docs
     */
    function get_products(): Request.ResultPromiseFromInfo<PaddleBackend.Endpoints.GetProducts>;
    /**
     * {Get Payment Product}
     * Get the backend defined payment product by id asynchronously.
     * @nav Frontend/Payments
     * @parameter id The id of the payment product.
     * @returns Returns the backend defined payment product.
     * @docs
     */
    function get_product(id: string): Request.ResultPromise<Product>;
    /**
     * {Get Payment}
     * Get a payment by id.
     * @nav Frontend/Payments
     * @parameter id The id of the payment.
     * @docs
     */
    function get_payment(payload: PaddleBackend.Endpoints.GetPayment["payload"]): Request.ResultPromiseFromInfo<PaddleBackend.Endpoints.GetPayment>;
    /**
     * {Get Refunded Payments}
     * Get all payments of the authenticated user
     *
     * All failed payments are no longer stored in the database.
     * @nav Frontend/Payments
     * @parameter days Retrieve payments from the last amount of days.
     * @parameter limit Limit the amount of response payment objects.
     * @parameter status Filter the payments by status. Be aware that the line items of a payment also have a status with possible values of `open`, `cancelled`, `refunding` or `refunded.`
     * @docs
     */
    function get_payments(payload: PaddleBackend.Endpoints.GetPayments["payload"]): Request.ResultPromiseFromInfo<PaddleBackend.Endpoints.GetPayments>;
    /**
     * {Get Refundable Payments}
     * Get all payments that are refundable for the authenticated user.
     * @nav Frontend/Payments
     * @parameter days Retrieve payments from the last amount of days.
     * @parameter limit Limit the amount of response payment objects.
     * @docs
     */
    function get_refundable_payments(payload?: PaddleBackend.Endpoints.GetRefundablePayments["payload"]): Request.ResultPromiseFromInfo<PaddleBackend.Endpoints.GetRefundablePayments>;
    /**
     * {Get Refunded Payments}
     * Get all successfully refunded payments of the authenticated user.
     * @nav Frontend/Payments
     * @parameter days Retrieve payments from the last amount of days.
     * @parameter limit Limit the amount of response payment objects.
     * @docs
     */
    function get_refunded_payments(payload?: PaddleBackend.Endpoints.GetRefundedPayments["payload"]): Request.ResultPromiseFromInfo<PaddleBackend.Endpoints.GetRefundedPayments>;
    /**
     * {Get Refunding Payments}
     * Get all payments that are currently in the refunding process of the authenticated user.
     * @nav Frontend/Payments
     * @parameter days Retrieve payments from the last amount of days.
     * @parameter limit Limit the amount of response payment objects.
     * @docs
     */
    function get_refunding_payments(payload?: PaddleBackend.Endpoints.GetRefundingPayments["payload"]): Request.ResultPromiseFromInfo<PaddleBackend.Endpoints.GetRefundingPayments>;
    /**
     * {Refund Payment}
     * Refund a payment based on the payment id for the authenticated user.
     * @warning Refunding a subscription will also cancel all other subscriptions that were created by the same payment request.
     * @nav Frontend/Payments
     * @parameter payment The id of the payment object or the payment object itself.
     * @parameter line_items The line items to refund, these must be retrieved from the original payment line items otherwise it may cause undefined behaviour. When undefined the entire payment will be refunded.
     * @parameter reason The refund reason.
     * @docs
     */
    function create_refund(payload: PaddleBackend.Endpoints.RefundPayment["payload"]): Request.ResultPromiseFromInfo<PaddleBackend.Endpoints.RefundPayment>;
    /**
     * {Cancel Subscription}
     * Cancel a subscription based on the product id.
     * @warning Cancelling a subscription will also cancel all other subscriptions that were created by the same payment request.
     * @nav Frontend/Payments
     * @parameter product The product id.
     * @docs
     */
    function cancel_subscription(payload: PaddleBackend.Endpoints.CancelSubscription["payload"]): Request.ResultPromiseFromInfo<PaddleBackend.Endpoints.CancelSubscription>;
    /**
     * {Is Subscribed}
     * Check if the authenticated user is subscribed to a product plan.
     * @nav Frontend/Payments
     * @parameter product The product id.
     * @docs
     */
    function is_subscribed(payload: PaddleBackend.Endpoints.IsSubscribed["payload"]): Request.ResultPromiseFromInfo<PaddleBackend.Endpoints.IsSubscribed>;
    /**
     * {Get active subscriptions}
     * Get the active subscriptions of the authenticated user.
     * @nav Frontend/Payments
     * @docs
     */
    function get_active_subscriptions(): Request.ResultPromiseFromInfo<PaddleBackend.Endpoints.GetActiveSubscriptions>;
    namespace Cart {
        let items: {
            product: Product;
            quantity: number;
        }[];
        /**
         * {Refresh Cart}
         * Refresh the shopping cart.
         *
         * The current cart items are accessible as `Payments.cart.items`.
         * @nav Frontend/Payments
         * @docs
         */
        function refresh(): void;
        /**
         * {Save Cart}
         * Save the shopping cart in the local storage.
         *
         * The current cart items are accessible as `Payments.cart.items`.
         * @nav Frontend/Payments
         * @docs
         */
        function save(): void;
        /**
         * {Add to Cart}
         * Add a product to the shopping cart.
         *
         * When the product was already added to the shopping cart only the quantity will be incremented.
         *
         * An error will be thrown if the product id does not exist.
         *
         * The current cart items are accessible as `Payments.cart.items`.
         * @nav Frontend/Payments
         * @parameter id The product's id.
         * @parameter quantity The quantity to add.
         * @docs
         */
        function add(id: string, quantity?: number): Promise<void>;
        /**
         * {Remove from Cart}
         * Remove a product from the shopping cart.
         *
         * Does not throw an error when the product was not added to the shopping cart.
         *
         * The current cart items are accessible as `Payments.cart.items`.
         * @nav Frontend/Payments
         * @parameter id The product's id.
         * @parameter quantity The quantity to remove. When the quantity value is "all", the entire product will be removed from the shopping cart.
         * @docs
         */
        function remove(id: string, quantity?: number | "all"): Promise<void>;
        /**
         * {Clear Cart}
         * Clear the shopping cart.
         *
         * Will automatically be called if `Payments.confirm_charge()` finishes without any errors.
         *
         * The current cart items are accessible as `Payments.cart.items`.
         * @nav Frontend/Payments
         * @docs
         */
        function clear(): Promise<void>;
    }
}
export { Payments as payments };
